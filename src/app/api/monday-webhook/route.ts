/**
 * POST /api/monday-webhook — הרכזת מסמנת בלוח, והאפליקציה יודעת תוך שניות.
 *
 * ─── למה webhook ולא סקריפט ──────────────────────────────────────────────────
 *
 * עמודת "מסלול באפליקציה" קובעת אם אדם יקבל את המסע בן חמשת השלבים או את
 * המלא. עד עכשיו התרגום שלה ל-`alumni_roster` רץ בסקריפט ידני — כלומר
 * **הפער בין הסימון לכניסה היה "עד שמישהו יזכר להריץ"**. בפיילוט של 12 זה
 * עובד; ב-50 זה בדיוק הסוג של פער שמייצר אדם שנכנס וקיבל את המסע הלא נכון,
 * ואז אי אפשר לתקן לו את זה בלי לשנות לו את המסך באמצע.
 *
 * ─── אבטחה ───────────────────────────────────────────────────────────────────
 *
 * מאנדיי שולח `challenge` ברישום וממתין שנחזיר אותו — זו לחיצת היד. מעבר
 * לכך אין חתימה בברירת מחדל, ולכן סוד ב-query (`?token=`). הנתון שעובר כאן
 * הוא מזהה פריט בלבד; **את הטלפון אנחנו קוראים בעצמנו מ-API של מאנדיי**
 * ולא מגוף הבקשה — כך שגם מי שינחש את הכתובת לא יוכל להזריק מספר לרשימה.
 *
 * ⚠️ מחיקה נוגעת רק במי שהסנכרון הזה הכניס (`note`), כמו בסקריפט. ומי שכבר
 * במסע הבוגרים לא מוחזר ל-main אוטומטית — זה משנה לו את מספר השלבים על
 * המסך באמצע, וזו החלטה של רכזת.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizePhone } from "@/lib/candidate";
import { waLink } from "@/lib/waLink";

export const dynamic = "force-dynamic";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const COL_PHONE = "text_mm7tmnqc";
const COL_TRACK = "color_mm7tahjd";
const ALUMNI_LABEL = "בוגרים — תואר בלבד";
const NOTE = "סומן על ידי הרכזת בלוח אינטק";
const COL_COORD = "color_mm7t74m3";
const COL_WA = "link_mm7t82dd";

/* ── הלוח הראשי: "החלטה סופית" ← שורה בלוח אינטק ────────────────────────────
   הלוח הראשי הוא שער הכניסה, ולוח אינטק הוא הבעלות. ההעברה הייתה עד היום
   ייבוא ידני של 25 שורות, כלומר מי שהוחלט עליו ביום רביעי התגלה ביום ראשון.
   ⚠️ **היעד נוצר ולא מתעדכן**: מי שכבר שם — הבעלות עליו עברה, והלוח הראשי
   כבר לא רשאי לדרוס לו סטטוס או רכז/ת. */
const MAIN_BOARD = process.env.MONDAY_MAIN_BOARD ?? "18396761860";
const MAIN = {
  decision: "color_mm4ms1kq", phone: "phone_mm46se7z", phoneText: "text_mkyqhj10",
  email: "text_mkyq3a1", first: "text_mkywv4ea", last: "text_mkyqqaf9",
  birth: "date_mm6jsd1j",
} as const;
const INTECH = {
  phone: "text_mm7tmnqc", email: "text_mm7tase7", coord: "color_mm7t74m3",
  status: "color_mm7t1s7a", src: "color_mm7tee80", how: "text_mm7t5f8a",
  birth: "date_mm7tj7b9", gender: "color_mm7twyz4", city: "text_mm7tafps",
} as const;
const MAIN_EXTRA = { gender: "color_mm4mffq6", city: "text_mm05bcne" } as const;

async function monday<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[monday-webhook]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

export async function POST(req: NextRequest) {
  const secret = process.env.MONDAY_WEBHOOK_TOKEN;
  if (!secret) return NextResponse.json({ error: "MONDAY_WEBHOOK_TOKEN not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as {
    challenge?: string;
    event?: { pulseId?: number; boardId?: number; columnId?: string };
  } | null;

  /* לחיצת היד של מאנדיי ברישום — חייבת לחזור כמו שהיא, ולפני בדיקת הסוד
     היא עוברת גם כן דרכו כי הכתובת שנרשמת כוללת אותו */
  if (req.nextUrl.searchParams.get("token") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (body?.challenge) return NextResponse.json({ challenge: body.challenge });

  const itemId = body?.event?.pulseId;
  if (!itemId) return NextResponse.json({ ok: true, skipped: "no item" });

  if (String(body?.event?.boardId ?? "") === MAIN_BOARD) return promoteFromMain(itemId);

  /* שינוי רכז/ת — ההודעה והיומן שבה תלויים בה, ולכן הקישור נבנה מחדש */
  if (body?.event?.columnId === COL_COORD) return rebuildWa(itemId);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  /* קוראים את המצב מהלוח ולא מגוף הבקשה — גם כדי שלא יוזרק מספר, וגם כי
     ככה שינוי שהגיע מכל מקום (ייבוא, עריכה המונית) מטופל אותו דבר */
  const data = await monday<{ items: { name: string; column_values: { id: string; text: string | null }[] }[] }>(
    `{ items(ids: [${itemId}]) { name column_values(ids: ["${COL_PHONE}","${COL_TRACK}"]) { id text } } }`
  );
  const item = data?.items?.[0];
  if (!item) return NextResponse.json({ ok: true, skipped: "item not found" });

  const cv = (id: string) => (item.column_values.find(c => c.id === id)?.text ?? "").trim();
  const phone = normalizePhone(cv(COL_PHONE));
  const isAlumni = cv(COL_TRACK) === ALUMNI_LABEL;
  if (!phone) return NextResponse.json({ ok: true, skipped: "no phone" });

  const db = createClient(url, key, { auth: { persistSession: false } });

  if (isAlumni) {
    const { error } = await db.from("alumni_roster")
      .upsert({ phone, name: item.name.trim(), note: NOTE }, { onConflict: "phone", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, phone, action: "added" });
  }

  const { error } = await db.from("alumni_roster").delete().eq("phone", phone).eq("note", NOTE);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, phone, action: "removed", board: BOARD });
}

/* ── הלוח הראשי ──────────────────────────────────────────────────────────── */

const norm = (raw: unknown): string => {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("972")) return d;
  if (d.startsWith("0")) return "972" + d.slice(1);
  return d.length === 9 ? "972" + d : d;
};

async function promoteFromMain(itemId: number) {
  const ids = [...Object.values(MAIN), ...Object.values(MAIN_EXTRA)].map(c => `"${c}"`).join(", ");
  const d = await monday<{ items: { name: string; column_values: { id: string; text: string | null }[] }[] }>(
    `{ items(ids: [${itemId}]) { name column_values(ids: [${ids}]) { id text } } }`
  );
  const item = d?.items?.[0];
  if (!item) return NextResponse.json({ ok: true, skipped: "item not found" });
  const cv = (id: string) => (item.column_values.find(c => c.id === id)?.text ?? "").trim();

  /* רק "חשיפה". כל ערך אחר — כולל חזרה לריק — אינו מייצר ואינו מוחק: מחיקה
     אוטומטית של אדם שכבר בתהליך אצל רכזת היא בדיוק מה שאסור לקרות בשקט. */
  if (cv(MAIN.decision) !== "חשיפה") {
    return NextResponse.json({ ok: true, skipped: `decision=${cv(MAIN.decision) || "(ריק)"}` });
  }

  const phone = norm(cv(MAIN.phone) || cv(MAIN.phoneText));
  const email = cv(MAIN.email).toLowerCase();
  if (!phone && !email) return NextResponse.json({ ok: true, skipped: "no phone or email" });

  const existing = await monday<{ boards: { items_page: { items: { id: string; column_values: { id: string; text: string | null }[] }[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { items { id
       column_values(ids: ["${INTECH.phone}","${INTECH.email}"]) { id text } } } } }`
  );
  const dup = (existing?.boards?.[0]?.items_page?.items ?? []).some(it => {
    const g = (id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();
    return (phone && norm(g(INTECH.phone)) === phone) || (email && g(INTECH.email).toLowerCase() === email);
  });
  if (dup) return NextResponse.json({ ok: true, skipped: "already in board" });

  const name = [cv(MAIN.first), cv(MAIN.last)].filter(Boolean).join(" ") || item.name;
  /*
    ⚠️ הרכז/ת **לא** עובר/ת מהלוח הראשי (נתי, 4.10): השיוך נקבע
    בלוח אינטק, ושתי עמודות שכותבות לאותו שדה הן שתי אמיתות שיוצאות
    מסנכרון. השדה נולד ריק והרכזת ממלאת — וריק אומר "טרם שויך".
  */
  const vals: Record<string, unknown> = {
    [INTECH.status]: { label: "לפני שיחה ראשונה" },
    [INTECH.src]: { label: "לוח מועמדים ראשי" },
    [INTECH.how]: "לוח מועמדים ראשי · החלטה סופית = חשיפה",
  };
  if (phone) vals[INTECH.phone] = phone;
  if (email) vals[INTECH.email] = email;
  if (cv(MAIN.birth)) vals[INTECH.birth] = { date: cv(MAIN.birth) };
  if (cv(MAIN_EXTRA.gender)) vals[INTECH.gender] = { label: cv(MAIN_EXTRA.gender) };
  if (cv(MAIN_EXTRA.city)) vals[INTECH.city] = cv(MAIN_EXTRA.city);

  /* הקישור נולד עם השורה, עדיין בלי שם רכזת — ומתמלא כשהיא משוייכת */
  const wa = waLink({ phone, participant: name });
  if (wa) vals[COL_WA] = { url: wa, text: `וואטסאפ ל${name.trim().split(/\s+/)[0]}` };

  const made = await monday<{ create_item: { id: string } }>(
    `mutation ($b: ID!, $n: String!, $v: JSON!) { create_item(board_id: $b, item_name: $n, column_values: $v) { id } }`,
    { b: BOARD, n: name, v: JSON.stringify(vals) }
  );
  return NextResponse.json({ ok: !!made, created: made?.create_item?.id ?? null, name });
}

/* ── קישור הוואטסאפ ─────────────────────────────────────────────────────────
   נבנה מחדש בכל שינוי רכז/ת, כי הקישור ליומן הוא פר-רכזת — הודעה שנוצרה
   פעם אחת בלבד הייתה שולחת מועמד ליומן של מישהי אחרת. */
export async function rebuildWa(itemId: number) {
  const d = await monday<{ items: { name: string; column_values: { id: string; text: string | null }[] }[] }>(
    `{ items(ids: [${itemId}]) { name column_values(ids: ["${COL_PHONE}","${COL_COORD}"]) { id text } } }`
  );
  const item = d?.items?.[0];
  if (!item) return NextResponse.json({ ok: true, skipped: "item not found" });
  const cv = (id: string) => (item.column_values.find(c => c.id === id)?.text ?? "").trim();

  const coordName = cv(COL_COORD);
  let calPath: string | null = null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (coordName && url && key) {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await db.from("coordinators").select("cal_m1").ilike("name", coordName).limit(1);
    calPath = data?.[0]?.cal_m1 || null;
  }

  const link = waLink({ phone: cv(COL_PHONE), participant: item.name, coordinator: coordName, calPath });
  const value = link
    ? { url: link, text: `וואטסאפ ל${item.name.trim().split(/\s+/)[0]}` }
    : {};   // בלי טלפון תקין אין קישור — ולא קישור שבור

  const ok = await monday(
    `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b,
       item_id: $i, column_values: $v) { id } }`,
    { b: BOARD, i: itemId, v: JSON.stringify({ [COL_WA]: value }) }
  );
  return NextResponse.json({ ok: !!ok, link: !!link, coordinator: coordName || null });
}
