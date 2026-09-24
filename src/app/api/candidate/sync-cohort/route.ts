/**
 * POST /api/candidate/sync-cohort — שיוך אוטומטי לפיילוט הבוגרים (16.9).
 *
 * החלק שהיה חסר לפי docs/pilot-alumni-spec.md: `alumni_roster` קיימת
 * ב-DB (מיגרציה 009) ומסך הטלפון באונבורדינג קיים — אבל שום קוד לא
 * חיבר ביניהם. בלעדי זה, בוגר/ת אמיתי/ת שנרשמ/ת נשאר/ת cohort=main
 * לנצח ועובר/ת את המסע המלא בן 6 השלבים במקום חמשת השלבים שלו/ה.
 *
 * למה בצד שרת ולא ישירות מהדפדפן: ל-alumni_roster אין מדיניות RLS
 * ציבורית בכוונה (רשימת טלפונים של בוגרים היא לא נתון שנחשף) — הבדיקה
 * חייבת לרוץ עם המפתח הסודי.
 *
 * נקרא פעם אחת מ-`ensureCandidateId` באותו רגע שבו הטלפון מסונכרן
 * לראשונה למכשיר הזה (candidate.ts, דגל `phone-synced`) — בדיוק הרגע
 * שהמפרט מכנה "הקוהורט נקבע בהרשמה". לא דורס שיוך קיים: כותב 'alumni'
 * רק כשיש התאמה, ולעולם לא כותב 'main' — תיקון הפוך (שיוך שגוי) הוא
 * במפורש עניין לרכזת ב-/admin/coordinator (PATCH /api/coordinator),
 * לא למנגנון האוטומטי הזה.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizePhone } from "@/lib/candidate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Supabase לא מוגדר" }, { status: 503 });
  if (!secret) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const authClient = createClient(url, anonKey);
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user?.phone) {
    return NextResponse.json({ error: "משתמש לא מזוהה" }, { status: 401 });
  }

  const phone = normalizePhone(user.phone);
  const db = createClient(url, secret, { auth: { persistSession: false } });

  const { data: rosterRow, error: rosterError } = await db
    .from("alumni_roster")
    .select("phone")
    .eq("phone", phone)
    .maybeSingle();

  // הטבלה קיימת מאז מיגרציה 009 — שגיאה כאן כנראה זמנית (רשת/הרשאות), לא "אין התאמה"
  if (rosterError) return NextResponse.json({ error: rosterError.message }, { status: 500 });
  if (!rosterRow) return NextResponse.json({ cohort: "main", matched: false });

  const { error: updateError } = await db
    .from("candidates")
    .update({ cohort: "alumni" })
    .eq("id", user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ cohort: "alumni", matched: true });
}
