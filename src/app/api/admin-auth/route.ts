/**
 * GET /api/admin-auth — אימות הכניסה לאזור הניהול.
 *
 * שתי דרכים (src/lib/serverCoordinatorAuth.ts): קוד חירום משותף
 * (x-coordinator-code, כמו קודם), או טוקן Supabase מכניסת OTP שמותאם
 * לטלפון פעיל בטבלת coordinators. הדרך השנייה מחזירה גם מי בדיוק נכנס/ה.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyCoordinator } from "@/lib/serverCoordinatorAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ ok: true, coordinatorId: auth.coordinatorId, name: auth.name });
}
