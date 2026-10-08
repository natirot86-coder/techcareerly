/**
 * POST /api/booking-outcome — הרכזת מסמנת מה קרה בפגישה.
 *
 * ─── למה זה כאן ולא ב-Cal ────────────────────────────────────────────────────
 *
 * Cal יודע מתי נקבעה פגישה, מתי בוטלה ומתי הוזזה — ה-webhook קולט את שלושתם
 * אוטומטית, ולכפול אותם כאן היה יוצר **מקור אמת שני על אותו תאריך**.
 * **מה ש-Cal לעולם לא יידע הוא אם הפגישה באמת התקיימה**, וזה הדבר היחיד
 * שהמסלול הזה מקבל.
 *
 * וזו גם השכבה הראשונה והזולה בשער פגישה 2 (27.8): הרכזת כבר ביומן, וסימון
 * אחד שלה חוסך מהמועמד להיתקע מול מסך נעול — בלי שאיש יצטרך לזכור כלום.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCoordinator, canSeeEveryone } from "@/lib/serverCoordinatorAuth";

export const dynamic = "force-dynamic";

const OUTCOMES = ["happened", "no_show", "cancelled", null] as const;

export async function POST(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as
    | { id?: number; outcome?: string | null; note?: string }
    | null;
  if (!body?.id) return NextResponse.json({ error: "חסר מזהה הזמנה" }, { status: 400 });

  const outcome = body.outcome ?? null;
  if (!OUTCOMES.includes(outcome as never)) {
    return NextResponse.json({ error: "תוצאה לא חוקית" }, { status: 400 });
  }

  const db = createClient(url, secret, { auth: { persistSession: false } });

  /*
   * רכזת מסמנת רק פגישות שלה. מנהלת/בעלים וקוד החירום יכולים לסמן הכל —
   * הם ממילא רואים הכל (canSeeEveryone, 8.10 — owner נפל בטעות לענף
   * המצומצם עד עכשיו), ומי שסימן נשמר ב-outcome_by כדי שתמיד יהיה תיעוד.
   */
  let q = db.from("cal_bookings")
    .update({
      outcome,
      outcome_at: outcome ? new Date().toISOString() : null,
      outcome_by: auth.coordinatorId ?? "manager",
      outcome_note: body.note?.trim() || null,
    })
    .eq("id", body.id);

  if (!canSeeEveryone(auth.role) && auth.coordinatorId) {
    q = q.eq("coordinator_id", auth.coordinatorId);
  }

  const { data, error } = await q.select("id, outcome");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) {
    return NextResponse.json({ error: "הפגישה לא נמצאה או שאינה שלך" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, outcome });
}
