/**
 * כניסת רכזת דרך OTP (7.9.2026) — צד לקוח.
 *
 * בכוונה לא משתמש ב-sendPhoneOtp/verifyPhoneOtp של candidate.ts: אלו
 * בנויות סביב שדרוג session אנונימי קיים (מועמד/ת שממשיכים לאותו
 * מזהה). כניסת רכזת היא ההפך — זהות עצמאית ונפרדת, ולכן מתנתקים קודם
 * מכל session שכבר ישב בדפדפן הזה (אנונימי או מועמד/ת) ומתחילים נקי.
 * בלי זה, רכזת שנכנסת בדפדפן שבו נבדק המסע כמועמד/ת הייתה משדרגת את
 * ה-session ההוא בשקט ומקבלת auth.uid() של מישהו אחר.
 */
import { supabase } from "./supabase";

const IDENTITY_KEY = "coordinator-identity";
const LEGACY_CODE_KEY = "coordinator-code";
/*
  מתי הוזן קוד החירום. השרת דורש את החותמת הזאת ופוסל אותה אחרי 24 שעות —
  ראה BREAK_GLASS_TTL_MS ב-serverCoordinatorAuth. בלי זה הקוד נשאר בדפדפן
  **לנצח**, וזה בדיוק מה שהפך גיבוי חירום לדרך הכניסה הרגילה.
*/
const LEGACY_SINCE_KEY = "coordinator-code-since";
export const BREAK_GLASS_TTL_MS = 24 * 60 * 60 * 1000;

/** האם יושבת בדפדפן כניסת חירום בתוקף (לבאנר ולבדיקת השער) */
export function breakGlassActive(): boolean {
  try {
    if (!localStorage.getItem(LEGACY_CODE_KEY)) return false;
    const since = Number(localStorage.getItem(LEGACY_SINCE_KEY) ?? "0");
    return !!since && Date.now() - since <= BREAK_GLASS_TTL_MS;
  } catch { return false; }
}

export type CoordinatorIdentity = { id: string; name: string | null; role?: string };

/** האם המזוהה הנוכחי הוא owner — לפריטי תפריט שמיועדים לניהול המוצר בלבד */
export function isOwnerIdentity(): boolean {
  return getCoordinatorIdentity()?.role === "owner";
}

export async function sendCoordinatorOtp(phone: string): Promise<string | null> {
  if (!supabase) return "Supabase לא מוגדר — חסרים משתני סביבה";
  await supabase.auth.signOut().catch(() => { /* ignore */ });
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return error?.message ?? null;
}

/**
 * מאמתת את הקוד, ואז בודקת מול השרת שהטלפון רשום כרכזת פעילה.
 * בכשלון — מתנתקים מיד, כדי לא להשאיר session מאומת של מי שאינו רכזת.
 */
export async function verifyCoordinatorOtp(phone: string, token: string): Promise<string | null> {
  if (!supabase) return "Supabase לא מוגדר — חסרים משתני סביבה";

  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) return error.message;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return "האימות הצליח אבל לא נוצר session";

  const res = await fetch("/api/admin-auth", { headers: { Authorization: `Bearer ${session.access_token}` } });
  if (!res.ok) {
    await supabase.auth.signOut().catch(() => { /* ignore */ });
    const body = await res.json().catch(() => null);
    return body?.error ?? "המספר הזה לא רשום כרכזת פעילה";
  }

  const data = await res.json();
  try {
    /* התפקיד נשמר כדי שהתפריט יסתיר פריטים שהשרת ממילא יחסום (8.10) */
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ id: data.coordinatorId, name: data.name, role: data.role }));
  } catch { /* ignore */ }
  return null;
}

export function getCoordinatorIdentity(): CoordinatorIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * תווית "מחוברת בתור" לתצוגה בסיידבר הניהול (16.9) — best practice בסיסי
 * בכל פאנל ניהול: מי שרואה מסך ניהול צריך לדעת *מי* מזוהה כרגע, לא רק
 * שהוא בפנים. למי שנכנס/ה עם OTP אישי — השם. למי שנכנס/ה בקוד החירום
 * המשותף — תיוג גלוי שזו לא זהות אישית (עקבי עם "רואים הכל" ב-verifyCoordinator).
 */
export function getLoginLabel(): string | null {
  const identity = getCoordinatorIdentity();
  if (identity?.name) return identity.name;
  try {
    if (breakGlassActive()) return "כניסת חירום · פגה תוך 24 שעות";
  } catch { /* ignore */ }
  return null;
}

export async function coordinatorSignOut(): Promise<void> {
  try { localStorage.removeItem(IDENTITY_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(LEGACY_CODE_KEY); localStorage.removeItem(LEGACY_SINCE_KEY); } catch { /* ignore */ }
  if (supabase) await supabase.auth.signOut().catch(() => { /* ignore */ });
}

/**
 * הכותרות לשלוח בכל קריאה ל-API של הניהול. מעדיפה session אמיתי; אם
 * אין (או שהוא פג), נופלת לקוד הישן שנשמר ב-localStorage כגיבוי חירום.
 */
export async function coordinatorAuthHeaders(): Promise<Record<string, string>> {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && getCoordinatorIdentity()) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  }
  try {
    const legacy = localStorage.getItem(LEGACY_CODE_KEY);
    const since = localStorage.getItem(LEGACY_SINCE_KEY);
    /* השרת פוסל חותמת חסרה או ישנה מ-24 שעות — שולחים אותה כמו שהיא */
    if (legacy) return { "x-coordinator-code": legacy, "x-coordinator-since": since ?? "0" };
  } catch { /* ignore */ }
  return {};
}

export function saveLegacyCode(code: string): void {
  try {
    localStorage.setItem(LEGACY_CODE_KEY, code);
    localStorage.setItem(LEGACY_SINCE_KEY, String(Date.now()));
  } catch { /* ignore */ }
}
