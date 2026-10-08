/**
 * שער גישה מאוחד לכל ה-API-ים של אזור הניהול (7.9.2026).
 *
 * עד עכשיו כל route חזר על אותה בדיקה בדיוק: השוואת x-coordinator-code
 * מול COORDINATOR_CODE. זה היה קוד אחד משותף לכל הרכזות — לא זהות,
 * רק סיסמה. עכשיו יש שתי דרכים להיכנס, נבדקות בסדר הזה:
 *
 * 1. COORDINATOR_CODE — נשאר כגיבוי חירום (החלטת המוצר, 7.9): אם ה-SMS
 *    נופל או רכזת חדשה עוד לא בסגל, יש דרך חלופית להיכנס.
 * 2. טלפון מאומת דרך OTP (אותה תשתית בדיוק כמו כניסת מועמד/ת) שמותאם
 *    למספר טלפון פעיל בטבלת coordinators. זו זהות אמיתית — יודעים *מי*
 *    נכנס/ה, לא רק שמישהו/י ידע/ה סיסמה.
 *
 * הבדל חשוב: הגיבוי מחזיר coordinatorId=null (אין זהות אישית — "רואים
 * הכל"), הכניסה האישית מחזירה מזהה אמיתי, וזה מה שמאפשר לסנן את מסך
 * "מי צריך אותי היום" לרכזת הספציפית.
 */
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizePhone } from "./candidate";

/**
 * 'coordinator' רואה את המועמדים שלה · 'manager' רואה את כולם ויכול לצפות
 * בתצוגה של רכזת מסוימת. קוד החירום המשותף מקבל manager — הוא ממילא ראה
 * הכל מאז ומתמיד, וזה רק נותן שם למה שכבר קורה.
 */
/*
 * 'coordinator' ⊂ 'manager' ⊂ 'owner'.
 * הפרדת owner נולדה מהאנליטיקות (נתי 4.10): מנהלת תוכנית
 * צריכה תור חילוץ וכל המשתתפים; מסך האנליטיקות הוא **דיבאג מוצר**
 * — באיזה צעד נוטשים בסימולציה, באיזו משש השאלות עוצרים — וזו עבודה
 * של מי שבונה את המוצר.
 */
export type Role = "coordinator" | "manager" | "owner";
export const isOwner = (r: Role) => r === "owner";
/*
 * "רואה הכל" (8.10) — owner נולד אחרי manager (מיגרציה 012 אחרי 011),
 * וכמה מקומות עדיין בדקו `role === "manager"` באופן מילולי: owner נפל
 * לענף המצומצם, והיה *יותר* נעול ממנהלת רגילה — הפוך מההיררכיה המוצהרת
 * coordinator ⊂ manager ⊂ owner. נתפס כש-israel@tech-career.org (owner
 * לפי מיגרציה 012) ביקש לוודא שיש לו גישה לכל המשתתפים וגילה שאין.
 */
export const canSeeEveryone = (r: Role) => r === "manager" || r === "owner";

export type CoordinatorAuth =
  | { ok: true; coordinatorId: string | null; name: string | null; role: Role; breakGlass?: boolean }
  | { ok: false; status: number; error: string };

/*
 * ── כניסת החירום: 24 שעות, לא לנצח (נתי, 5.10) ──────────────────────────────
 *
 * הקוד המשותף נבנה כגיבוי ליום שבו ה-SMS לא עבד. 019 מחובר מ-4.10, ולכן
 * התנאי שהצדיק אותו כבר לא מתקיים — אבל **מחיקה מלאה הייתה חוסמת רכזת
 * חדשה, או מי שהחליפה מכשיר, בדיוק ביום שבו היא הכי צריכה להיכנס.**
 * הפתרון אינו לבטל את הדלת אלא להדליק עליה אור:
 *
 *   · הכניסה **פגה אחרי 24 שעות** ולא נשמרת לנצח בדפדפן. זה מה שהופך
 *     אותה מדלת אחורית לחירום אמיתי.
 *   · `breakGlass: true` חוזר ללקוח, והמסך מציג באנר קבוע. חירום שנראה
 *     כמו חירום לא הופך לשגרה.
 *   · כל שימוש נרשם ב-funnel_events. אין זהות אישית, אבל יש **כמה פעמים
 *     ומתי** — וזה מספיק כדי לראות אם הדלת הזאת הפכה לדרך המלך.
 *
 * הקוד נשאר 'manager' ולא 'owner': אנליטיקות דורשות זהות אמיתית.
 */
export const BREAK_GLASS_TTL_MS = 24 * 60 * 60 * 1000;

async function logBreakGlass(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return;
  try {
    const db = createClient(url, secret, { auth: { persistSession: false } });
    await db.from("funnel_events").insert({
      candidate_id: null,
      name: "admin_break_glass",
      props: { path: req.nextUrl.pathname },
    });
  } catch { /* רישום שנכשל לא חוסם כניסה */ }
}

export async function verifyCoordinator(req: NextRequest): Promise<CoordinatorAuth> {
  const legacyCode = process.env.COORDINATOR_CODE;
  const headerCode = req.headers.get("x-coordinator-code");
  // ?code= — לקישורים שנפתחים כ-<a href> רגיל (למשל enrollment-doc) ולא
  // יכולים לשאת header; עדיין רק הקוד הישן, לא הכניסה האישית
  const queryCode = req.nextUrl.searchParams.get("code");
  if (legacyCode && (headerCode === legacyCode || queryCode === legacyCode)) {
    /*
     * הלקוח שולח מתי הקוד הוזן (x-coordinator-since). חסר או ישן מ-24 שעות
     * ⇒ 401, והמסך יבקש להזין מחדש. ⚠️ הזמן מגיע מהדפדפן ולכן ניתן לזיוף —
     * זה מקובל כאן: מי שמזייף אותו מחזיק ממילא בקוד עצמו, והמנגנון בא
     * למנוע **שכחה**, לא תוקף.
     */
    const since = Number(req.headers.get("x-coordinator-since") ?? "0");
    if (!since || Date.now() - since > BREAK_GLASS_TTL_MS) {
      return { ok: false, status: 401, error: "כניסת החירום פגה — נדרשת הזדהות מחדש" };
    }
    await logBreakGlass(req);
    return { ok: true, coordinatorId: null, name: null, role: "manager", breakGlass: true };
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return legacyCode
      ? { ok: false, status: 401, error: "unauthorized" }
      : { ok: false, status: 503, error: "COORDINATOR_CODE not configured" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anonKey) return { ok: false, status: 503, error: "Supabase לא מוגדר" };
  if (!secret) return { ok: false, status: 503, error: "SUPABASE_SECRET_KEY not configured" };

  const authClient = createClient(url, anonKey);
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user?.phone) {
    return { ok: false, status: 401, error: "משתמש לא מזוהה" };
  }

  const phone = normalizePhone(user.phone);
  const db = createClient(url, secret, { auth: { persistSession: false } });
  /*
   * לא .eq("phone", phone): טופס /admin/program מבטיח לצוות שאפשר להזין
   * "גם 05... בסדר", ואכן ככה זה נשמר בפועל (נתחי בדיקה חי: 0509632170,
   * לא 972509632170). השוואה מדויקת הייתה נועלת בחוץ כל רכזת שהוזנה
   * בפורמט מקומי — מנרמלים משני הצדדים במקום לסמוך על איך שהוזן.
   */
  const { data: coords, error: coordError } = await db
    .from("coordinators")
    .select("id, name, phone, active, role")
    .eq("active", true);

  if (coordError) return { ok: false, status: 500, error: coordError.message };
  const coord = coords?.find(c => normalizePhone(c.phone) === phone);
  if (!coord) {
    return { ok: false, status: 403, error: "מספר הטלפון הזה לא רשום כרכזת פעילה בסגל" };
  }

  const role: Role = coord.role === "owner" ? "owner"
    : coord.role === "manager" ? "manager" : "coordinator";
  return { ok: true, coordinatorId: coord.id, name: coord.name, role };
}
