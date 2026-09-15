/**
 * GET /api/enrollment-doc?candidate=<id> — הורדת אישור הלימודים לרכזת.
 *
 * למה: האסמכתא נשמרת בתיקייה אישית של המועמד (RLS לפי auth.uid) — הרכזת
 * לא יכולה לגשת אליה מהדפדפן. זה הקובץ שמגישים למשרד העבודה, ולכן צד
 * השרת (מפתח סודי) מייצר קישור חתום קצר-מועד. אותו שער כמו מסך הרכזת.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCoordinator } from "@/lib/serverCoordinatorAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  /*
   * הקישור נפתח כ-<a href> רגיל ולא יכול לשאת Authorization header —
   * לכן כניסה אישית (OTP) עדיין לא נתמכת כאן, רק ?code= הישן
   * (verifyCoordinator בודק אותו כחלק מהגיבוי המשותף). הצעד הבא: להפוך
   * את הקישור להורדה דרך fetch כדי שגם טוקן אישי יעבוד.
   */
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const candidateId = req.nextUrl.searchParams.get("candidate");
  if (!candidateId) return NextResponse.json({ error: "candidate required" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });

  // הקובץ העדכני ביותר בתיקיית המועמד
  const { data: files, error } = await db.storage.from("enrollment-docs").list(candidateId, {
    sortBy: { column: "created_at", order: "desc" }, limit: 1,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!files?.length) return NextResponse.json({ error: "אין אישור לימודים למועמד הזה" }, { status: 404 });

  const { data: signed, error: sErr } = await db.storage.from("enrollment-docs")
    .createSignedUrl(`${candidateId}/${files[0].name}`, 60 * 10);
  if (sErr || !signed) return NextResponse.json({ error: sErr?.message ?? "sign failed" }, { status: 500 });
  return NextResponse.redirect(signed.signedUrl);
}
