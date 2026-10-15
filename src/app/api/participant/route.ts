/**
 * PATCH /api/participant — עריכת פרטי משתתף/ת ממסך הניהול (נתי, 16.10).
 *
 * ─── מי הבעלים ──────────────────────────────────────────────────────────────
 *
 * מאנדיי הוא נקודת ההתחלה; **מרגע שהמשתתף/ת אימת/ה טלפון באפליקציה —
 * האפליקציה בעלת הפרטים** ומאנדיי מקבל עותק. לפני כן אין לנו עליו כלום,
 * והלוח הוא הבעלים. הרכזת לא צריכה לדעת את זה: **מסך אחד, והשרת כותב
 * לבעלים הנכון.**
 *
 *   לא באפליקציה      ⇒ ללוח בלבד (הלוח הבעלים)
 *   באפליקציה ומאומת  ⇒ ל-candidates, ומשם עותק ללוח
 *
 * ⚠️ **רק פרטים, לא בחירות** (נתי): תחום, מסלול ותשובות שייכים למשתתף/ת.
 * ⚠️ **טלפון מאומת לא נערך** — הוא הזהות. מי שינסה יקבל הסבר, לא שגיאה גנרית.
 * ⚠️ **רכז/ת** — רק מנהלת, ותמיד דרך הלוח (ה-webhook מחזיר ל-DB). רכז/ת
 *    שמעבירה משתתף לאחר/ת היא החלטה ניהולית, לא תיקון פרט.
 * ⚠️ רכז/ת עורכ/ת רק את המשתתפים שלו/ה. כל שינוי נרשם ב-participant_edits.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyCoordinator, canSeeEveryone } from "@/lib/serverCoordinatorAuth";
import { mondayRow, mondayBoardAll, mondayWriteDetails, mondaySetCoordinatorById, normPhone, heKey } from "@/lib/monday";

export const dynamic = "force-dynamic";

type Body = {
  itemId?: string; candidateId?: string;
  firstName?: string; lastName?: string; gender?: string; city?: string;
  email?: string; phone?: string; coordinatorId?: string | null;
};

const GENDERS = ["male", "female", "other"];
const genderFromBoard = (g: string) => g === "זכר" ? "male" : g === "נקבה" ? "female" : "";

type Cand = { id: string; first_name: string | null; last_name: string | null; gender: string | null;
  city: string | null; phone: string | null; phone_verified: boolean | null; coordinator_id: string | null };
const CAND_COLS = "id, first_name, last_name, gender, city, phone, phone_verified, coordinator_id";

/** מי זה, מי הבעלים, ומה הערכים הנוכחיים — מהבעלים. משותף ל-GET ול-PATCH. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolve(db: SupabaseClient<any, any, any>, itemId?: string, candidateId?: string) {
  if (!itemId && !candidateId) return { error: "חסר מזהה משתתף/ת", status: 400 } as const;
  let row = itemId ? await mondayRow(itemId) : null;
  if (itemId && !row) return { error: "השורה לא נמצאה בלוח", status: 404 } as const;

  let cand: Cand | null = null;
  if (candidateId) {
    const { data } = await db.from("candidates").select(CAND_COLS).eq("id", candidateId).maybeSingle();
    cand = (data as unknown as Cand) ?? null;
  } else if (row?.phone) {
    const { data } = await db.from("candidates").select(CAND_COLS).eq("phone", row.phone)
      .eq("phone_verified", true).limit(1);
    cand = ((data ?? [])[0] as Cand) ?? null;
  }
  if (!row && cand?.phone) {
    row = (await mondayBoardAll())?.find(r => r.phone === normPhone(cand!.phone)) ?? null;
  }
  const appOwned = !!cand?.phone_verified;
  /* הערכים הנוכחיים — מהבעלים */
  const boardFirst = (row?.name ?? "").split(/\s+/)[0] ?? "";
  const boardLast = (row?.name ?? "").split(/\s+/).slice(1).join(" ");
  const cur = {
    /* trim — אחרת רווח שמור בסוף השם נראה כשינוי, ושמירה ריקה כותבת ללוח (16.10) */
    firstName: (appOwned ? (cand!.first_name ?? "") : boardFirst).trim(),
    lastName: (appOwned ? (cand!.last_name ?? "") : boardLast).trim(),
    gender: appOwned ? (cand!.gender ?? "") : genderFromBoard(row?.gender ?? ""),
    city: (appOwned ? (cand!.city ?? "") : (row?.city ?? "")).trim(),
    email: row?.email ?? "",
    phone: appOwned ? normPhone(cand!.phone) : (row?.phone ?? ""),
  };
  return { row, cand, appOwned, cur };
}

export async function GET(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "השרת לא מוגדר" }, { status: 503 });
  const db = createClient(url, secret, { auth: { persistSession: false } });
  const q = req.nextUrl.searchParams;
  const r = await resolve(db, q.get("itemId") ?? undefined, q.get("candidateId") ?? undefined);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { data: staff } = await db.from("coordinators").select("id, name")
    .eq("active", true).neq("takes_participants", false).neq("name", "").order("name");
  const coord = r.cand?.coordinator_id
    ?? (staff ?? []).find(c => r.row && heKey(c.name.split(/s+/)[0]) === heKey(r.row.coordinator.split(/s+/)[0]))?.id
    ?? null;
  return NextResponse.json({
    itemId: r.row?.id ?? null, candidateId: r.cand?.id ?? null,
    owner: r.appOwned ? "app" : "board",
    phoneVerified: r.appOwned,
    values: { ...r.cur, coordinatorId: coord },
    canAssign: canSeeEveryone(auth.role),
    staff: canSeeEveryone(auth.role) ? staff ?? [] : [],
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "השרת לא מוגדר" }, { status: 503 });
  const db = createClient(url, secret, { auth: { persistSession: false } });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.itemId && !body?.candidateId) return NextResponse.json({ error: "חסר מזהה משתתף/ת" }, { status: 400 });
  /*
    ⚠️ קידוד שבור (16.10): curl מ-Windows שלח שם בעברית כ-"�����", והוא נשמר גם
    באפליקציה וגם בלוח. התו U+FFFD אומר שהטקסט כבר הושחת לפני שהגיע — אין
    מצב שבו הוא שם אמיתי, ולכן נדחה תמיד.
  */
  if (Object.values(body).some(v => typeof v === "string" && v.includes("�"))) {
    return NextResponse.json({ error: "הטקסט הגיע עם קידוד שבור — לא נשמר" }, { status: 400 });
  }
  if (body.gender !== undefined && body.gender && !GENDERS.includes(body.gender)) {
    return NextResponse.json({ error: "מגדר לא תקין" }, { status: 400 });
  }

  const r = await resolve(db, body.itemId, body.candidateId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { row, cand, appOwned, cur } = r;

  /* ── הרשאה: רכז/ת — רק את שלו/ה ── */
  if (!canSeeEveryone(auth.role)) {
    const mine = (cand && cand.coordinator_id === auth.coordinatorId)
      || (row && auth.name && heKey(row.coordinator.split(/\s+/)[0]) === heKey(auth.name.split(/\s+/)[0]));
    if (!mine) return NextResponse.json({ error: "אפשר לערוך רק משתתפים שמשויכים אלייך" }, { status: 403 });
    if (body.coordinatorId !== undefined) {
      return NextResponse.json({ error: "העברה לרכז/ת אחר/ת — רק מנהלת" }, { status: 403 });
    }
  }

  const next = {
    firstName: body.firstName?.trim() ?? cur.firstName,
    lastName: body.lastName?.trim() ?? cur.lastName,
    gender: body.gender ?? cur.gender,
    city: body.city?.trim() ?? cur.city,
    email: body.email?.trim() ?? cur.email,
    phone: body.phone !== undefined ? normPhone(body.phone) : cur.phone,
  };

  /* ── טלפון ── */
  if (next.phone !== cur.phone) {
    if (appOwned) {
      return NextResponse.json({
        error: "הטלפון אומת ב-SMS והוא הזהות של המשתתף/ת — אי אפשר לשנות אותו מכאן. אם המספר באמת התחלף, המשתתף/ת צריך/ה להיכנס עם המספר החדש.",
      }, { status: 409 });
    }
    if (next.phone && !/^9725\d{8}$/.test(next.phone)) {
      return NextResponse.json({ error: "מספר נייד ישראלי לא תקין" }, { status: 400 });
    }
    if (next.phone) {
      const { data: clash } = await db.from("candidates").select("id").eq("phone", next.phone).limit(1);
      if (clash?.length && clash[0].id !== cand?.id) {
        return NextResponse.json({ error: "המספר הזה כבר שייך למשתתף/ת אחר/ת באפליקציה" }, { status: 409 });
      }
    }
  }
  if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) {
    return NextResponse.json({ error: "כתובת מייל לא תקינה" }, { status: 400 });
  }

  const changed = (Object.keys(next) as (keyof typeof next)[]).filter(k => next[k] !== cur[k]);

  /* ── כתיבה לבעלים ── */
  if (cand && changed.some(k => k !== "email")) {
    const patch: Record<string, unknown> = {};
    if (changed.includes("firstName")) patch.first_name = next.firstName;
    if (changed.includes("lastName")) patch.last_name = next.lastName;
    if (changed.includes("gender")) patch.gender = next.gender || null;
    if (changed.includes("city")) patch.city = next.city || null;
    /* טלפון שהוקלד הוא טענה, לא הוכחה — נשאר לא מאומת */
    if (changed.includes("phone")) { patch.phone = next.phone || null; patch.phone_verified = false; }
    if (Object.keys(patch).length) {
      const { error } = await db.from("candidates").update(patch).eq("id", cand.id);
      if (error) return NextResponse.json({ error: "השמירה באפליקציה נכשלה: " + error.message }, { status: 500 });
    }
  }

  /* ── הלוח: הבעלים (לפני האפליקציה) או עותק (אחריה) ── */
  let boardWarning: string | null = null;
  if (row && changed.length) {
    const full = [next.firstName, next.lastName].filter(Boolean).join(" ");
    const ok = await mondayWriteDetails(row.id, {
      ...(changed.includes("firstName") || changed.includes("lastName") ? { name: full } : {}),
      ...(changed.includes("phone") ? { phone: next.phone } : {}),
      ...(changed.includes("email") ? { email: next.email } : {}),
      ...(changed.includes("gender") ? { gender: next.gender } : {}),
      ...(changed.includes("city") ? { city: next.city } : {}),
    });
    if (ok === false) {
      boardWarning = appOwned
        ? "נשמר באפליקציה, אבל העדכון ללוח נכשל — הבדיקה היומית תשלים אותו"
        : "העדכון ללוח נכשל — נסו שוב";
      if (!appOwned) return NextResponse.json({ error: boardWarning }, { status: 502 });
    }
  } else if (!row && changed.length && !cand) {
    return NextResponse.json({ error: "לא נמצאה שורה בלוח לעדכן" }, { status: 404 });
  }

  /* ── רכז/ת: תמיד דרך הלוח, וה-webhook מחזיר ל-DB ── */
  if (body.coordinatorId !== undefined && row) {
    let name: string | null = null;
    if (body.coordinatorId) {
      const { data: c } = await db.from("coordinators").select("name").eq("id", body.coordinatorId).maybeSingle();
      name = c?.name ?? null;
      if (!name) return NextResponse.json({ error: "רכז/ת לא נמצא/ה" }, { status: 400 });
    }
    if (heKey((name ?? "").split(/\s+/)[0]) !== heKey(row.coordinator.split(/\s+/)[0])) {
      const ok = await mondaySetCoordinatorById(row.id, name);
      if (!ok) return NextResponse.json({ error: "העדכון של הרכז/ת בלוח נכשל" }, { status: 502 });
      if (cand) await db.from("candidates").update({ coordinator_id: body.coordinatorId || null }).eq("id", cand.id);
      changed.push("coordinator" as keyof typeof next);
      (cur as Record<string, string>).coordinator = row.coordinator;
      (next as Record<string, string>).coordinator = name ?? "";
    }
  }

  /* ── תיעוד ── */
  if (changed.length) {
    const editor = auth.name ?? (auth.breakGlass ? "כניסת חירום" : "לא ידוע");
    await db.from("participant_edits").insert(changed.map(f => ({
      editor, item_id: row?.id ?? null, candidate_id: cand?.id ?? null, field: f,
      old_value: (cur as Record<string, string>)[f] ?? null,
      new_value: (next as Record<string, string>)[f] ?? null,
    })));
  }

  return NextResponse.json({ ok: true, changed, owner: appOwned ? "app" : "board", ...(boardWarning ? { boardWarning } : {}) });
}
