/**
 * GET /api/admin-auth — אימות קוד הניהול מול השרת.
 *
 * לוחות הניהול הם דפים סטטיים, ולכן סיסמה בצד לקוח הייתה קישוט — כל אחד
 * יכול לקרוא אותה מהקוד. כאן הקוד נבדק מול COORDINATOR_CODE שחי רק ב-env,
 * והדפדפן מקבל רק כן/לא.
 *
 * גילוי נאות של מודל האיום: נתוני המוסדות עצמם נמצאים ב-bundle של האתר
 * בכל מקרה (הם מוצגים למועמדים). השער מגן על **ממשקי העריכה והאישור**
 * מפני גישה מזדמנת — לא מפני מהנדס נחוש. Auth אמיתי לרכזות — בהמשך.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = process.env.COORDINATOR_CODE;
  if (!code) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  if (req.headers.get("x-coordinator-code") !== code) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
