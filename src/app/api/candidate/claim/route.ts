/**
 * POST /api/candidate/claim — מי שאימת טלפון מקבל את הרשומה שנרשמה עליו.
 *
 * רחמים נרשם ב-5.10 בלי SMS (משתמש אנונימי), וב-7.10 נכנס עם הטלפון —
 * ונוצר לו משתמש מאומת **ריק**. כל ההתקדמות נשארה בזהות הישנה, ולכן הוא
 * נזרק למסך הפתיחה. השחזור מהשרת לא עזר: הנתונים לא היו של מי שנכנס.
 *
 * כל הלוגיקה ב-`claim_candidate` (מיגרציה 016) — טרנזקציה אחת, ובתנאים:
 * הטלפון מאומת ב-SMS · הרשומה הישנה **לא** מאומתת · החדשה ריקה. כל
 * מקרה אחר מוחזר כסיבה ולא מתבצע — שתי היסטוריות הן החלטה של רכז/ת.
 *
 * ⚠️ אידמפוטנטי: אחרי איחוד אין יותר מה לאחד, וקריאה חוזרת מחזירה
 * "nothing to claim". לכן בטוח לקרוא לו בכל כניסה.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon || !secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: { user } } = await createClient(url, anon).auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.is_anonymous || !user.phone) return NextResponse.json({ claimed: false, why: "not verified" });

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("claim_candidate", { p_new: user.id });
  if (error) {
    console.error("[claim]", error.message);
    return NextResponse.json({ claimed: false, why: "error" }, { status: 500 });
  }
  if (data?.claimed) console.log(`[claim] ${String(data.from).slice(0, 8)} → ${user.id.slice(0, 8)}`);
  /* שתי היסטוריות — הרכז/ת צריכ/ה לדעת. נרשם כאירוע שמסך הרכזת יכול להציג */
  if (data?.why === "both have history" || data?.why === "ambiguous") {
    await db.from("funnel_events").insert({ candidate_id: user.id, name: "claim_conflict", props: { why: data.why } });
  }
  return NextResponse.json(data ?? { claimed: false });
}
