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

export const dynamic = "force-dynamic";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const COL_PHONE = "text_mm7tmnqc";
const COL_TRACK = "color_mm7tahjd";
const ALUMNI_LABEL = "בוגרים — תואר בלבד";
const NOTE = "סומן על ידי הרכזת בלוח אינטק";

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
