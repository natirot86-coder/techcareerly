/**
 * מה נחשב "טעימה" — הגדרה אחת לכל המסכים (נתי, 22.11).
 *
 * עד היום היו שתיים: מסך הטעימות ספר רק טעימה שהגיעה לכלי עיבוד החוויה,
 * ומסך המסע ספר כל נגיעה בתחום. כך משתתף/ת יכול/ה היה לראות "הפגישה נפתחת"
 * במסך אחד ומנעול במסך השני. **טעימה = הגיע/ה לסוף, לשאלון החוויה** —
 * זו ההגדרה שמסך הטעימות כבר הציג, ועכשיו גם נאכפת ביומן של פגישה 2.
 */
export const TASTE_DOMAINS = ["code", "data", "networks", "hardware", "cyber", "ai", "ux", "marketing", "qa"] as const;

/** כמה טעימות צריך לפני פגישה 2 — מהמערך ("לפחות 2 טעימות") */
export const TASTES_FOR_MEETING_2 = 2;

type Reader = Pick<Storage, "getItem">;

function journey(ls: Reader, d: string): Record<string, unknown> | null {
  try { return JSON.parse(ls.getItem(`${d}-journey`) || "null"); } catch { return null; }
}

/** תחומים שהטעימה בהם הושלמה */
export function completedTastes(ls: Reader): string[] {
  return TASTE_DOMAINS.filter(d => journey(ls, d)?.experience === true);
}

/** תחומים שנגע/ה בהם ולא סיים/ה — מוצגים כ"התחלת", לא נספרים */
export function startedTastes(ls: Reader): string[] {
  return TASTE_DOMAINS.filter(d => {
    const j = journey(ls, d);
    return !!j && j.experience !== true && !!(j.sim || j.day || j.mystery || j.analytics);
  });
}
