/**
 * שלב 5 — לוגיסטיקה ומלגות.
 *
 * שני אילוצים שנקבעו ואסור לשבור אותם בלי החלטה מפורשת:
 *
 * 1. **משימה בגודל ישיבה אחת.** הפחד גדל עם גודל המשימה. "להגיש בקשה למלגת
 *    מרום" מייצר שיתוק; "לבדוק אם אישור השחרור נמצא אצלך בבית" לוקח ארבע
 *    דקות. כל משימה כאן חייבת להיות משהו שאפשר לסיים בישיבה אחת — ואם היא
 *    גדולה מזה, לפרק אותה.
 *
 * 2. **חשבון במקום הרגעה.** הפחד הכלכלי אינו אי-רציונלי, הוא בעיית
 *    אריתמטיקה. התשובה היא לא "אל תדאג" אלא המספר. כל מה שכתוב כאן
 *    מגיע מ-docs/research-findings.md עם תאריך אימות. אין המצאות:
 *    מה שלא אומת מסומן needs-check ולא מוצג כעובדה.
 *
 * המקור לתאריכים ולכללי הצבירה: docs/research-findings.md, חלק א׳.
 */

import type { Track } from "./institutions";
import { FUNDING, RECOMMENDED_STACK, type Funding } from "./scholarships";

/**
 * המלגות והתוכניות יושבות ב-scholarships.ts — מקור אמת אחד, עם ממשק ניהול
 * ואישור ב-/admin/scholarships. כאן רק מייצאים אותן הלאה, כדי ששלב 5 ימשיך
 * לצרוך אותן מאותו מקום שהוא צרך קודם.
 */
export type Scholarship = Funding;
export const SCHOLARSHIPS: Funding[] = FUNDING.filter(f => f.status !== "hidden");
export { RECOMMENDED_STACK };

// ─── שכר לימוד ────────────────────────────────────────────────────────────────

/**
 * שכר הלימוד המתוקצב לשנה. הנתון היחיד שחוזר זהה בכל המוסדות המתוקצבים
 * שנבדקו, ולכן אפשר להציג אותו כעוגן לחשבון.
 */
// תשפ"ז — נקבע אחרי מדד יולי, פורסם 15.8.2026. 12,017 היה נכון לתשפ"ו בלבד
export const BUDGETED_TUITION = 12203;

/**
 * מלגות שחוסמות זו את זו — מוצהר בדאטה, לא מפוזר בטקסטים.
 * מי שבוחר את שתיהן בחשבון מקבל הכרעה מפורשת: על מה מוותרים.
 */
export const EXCLUSIONS: { a: string; b: string; why: string }[] = [
  { a: "marom", b: "olim", why: "מרום והמינהל לסטודנטים עולים הם מסלולים חלופיים — נרשמים לאחד מהם" },
  { a: "yeud44", b: "peripheria45", why: "ממלגות הפריפריה (44/45/46) מממשים אחת בלבד" },
  { a: "yeud44", b: "yeud46", why: "ממלגות הפריפריה (44/45/46) מממשים אחת בלבד" },
  { a: "peripheria45", b: "yeud46", why: "ממלגות הפריפריה (44/45/46) מממשים אחת בלבד" },
  { a: "tnufa-colman", b: "olim-beyahad-colman", why: "שתי מלגות המכללה למנהל — מגישים לאחת" },
  { a: "tnufa-colman", b: "perach", why: "תנופה להצלחה מתירה לצידה רק את מרום ואת מינהל הסטודנטים" },
  { a: "olim-beyahad-colman", b: "perach", why: "עולים ביחד מתירה לצידה רק את מרום ואת מינהל הסטודנטים" },
];

// ─── מלגות ────────────────────────────────────────────────────────────────────

// ─── מסמכים ───────────────────────────────────────────────────────────────────

/**
 * קטלוג המסמכים. הוא **לא** מוצג כרשימת משימות — המשתמש מוסיף רק מה שביקשו
 * ממנו בפועל. הקטלוג משמש להשלמה אוטומטית בשדה החיפוש ולהערת ההנפקה.
 *
 * `where` ולא `leadTime`: אין לנו נתון מאומת על כמה זמן לוקחת הנפקה, ולא
 * ממציאים מספר. מאיפה מוציאים — זה מידע שכן יש לנו, והוא שימושי יותר.
 */
export type DocDef = { id: string; name: string; where?: string };

export const DOC_CATALOG: DocDef[] = [
  { id: "id", name: "צילום תעודת זהות + ספח" },
  { id: "discharge", name: "תעודת שחרור", where: "האזור האישי באתר האגף והקרן לחיילים משוחררים" },
  { id: "grades", name: "גיליון ציונים / תעודת בגרות", where: "משרד החינוך או בית הספר שסיימת בו" },
  { id: "income", name: "אישור הכנסה של המשפחה", where: "תלושי שכר, או אישור מביטוח לאומי" },
  { id: "enrollment", name: "אישור לימודים", where: "מזכירות המוסד — רק אחרי שנרשמת" },
  { id: "bank", name: "אישור ניהול חשבון בנק", where: "הסניף או האפליקציה של הבנק" },
  { id: "rent", name: "חוזה שכירות", where: "בעל הדירה" },
  { id: "photo", name: "תמונת פספורט" },
];

// ─── משימות ───────────────────────────────────────────────────────────────────

export type TaskArea = "scholarship" | "registration" | "housing" | "money";

export const AREA_LABEL: Record<TaskArea, string> = {
  scholarship: "מלגות",
  registration: "הרשמה",
  housing: "מגורים",
  money: "כסף",
};

export type PlanTask = {
  id: string;
  title: string;
  /** ההקשר. למה זה חשוב, או מה המלכודת */
  note?: string;
  area: TaskArea;
  /** ISO. null = אין דדליין */
  due: string | null;
  source: "generated" | "user";
  status: "open" | "done";
  /**
   * כמה פעמים המשימה נפתחה בלי שנסגרה — אות התנהגותי, לא שאלון.
   * זה המימוש של "פחד נמדד בהתנהגות": שלוש פתיחות בלי סגירה עוברות
   * לתור החילוץ של הרכזת. נספר כאן ולא ב-DB כי localStorage הוא מקור
   * האמת המקומי, וה-DB הוא השיקוף.
   */
  openCount?: number;
  /** ISO. מתי נסגרה בפועל — ולא מתי סונכרנה, שזה מה שנשמר עד היום */
  doneAt?: string | null;
};

// ─── תאריכים ──────────────────────────────────────────────────────────────────

/** התאריך הקרוב ביותר שבו חל d/m — השנה או בשנה הבאה */
export function nextOccurrence(d: number, m: number, from = new Date()): Date {
  const y = from.getFullYear();
  const thisYear = new Date(y, m - 1, d);
  thisYear.setHours(23, 59, 59, 0);
  return thisYear >= from ? thisYear : new Date(y + 1, m - 1, d, 23, 59, 59);
}

export function daysUntil(date: Date, from = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const now = new Date();
  const sameYear = y === now.getFullYear();
  return sameYear ? MONTHS[m - 1] : `${MONTHS[m - 1]} ${y}`;
}

/** "עוד 3 ימים" · "מחר" · "היום" · "עבר" */
export function dueText(iso: string, from = new Date()): string {
  const n = daysUntil(new Date(iso), from);
  if (n < 0) return "עבר התאריך";
  if (n === 0) return "היום";
  if (n === 1) return "מחר";
  if (n <= 21) return `עוד ${n} ימים`;
  const d = new Date(iso);
  return `${d.getDate()} ב${MONTHS[d.getMonth()]}`;
}

// ─── ייצור התוכנית ────────────────────────────────────────────────────────────

export type QuizLike = {
  budget?: string;
  location?: string;
  education?: string;
  when?: string;
};

/**
 * בונה את התוכנית ההתחלתית מהתשובות של שלב 4 ומהמוסדות ברשימה.
 *
 * הכלל שמנחה כל שורה כאן: **מה אפשר לסיים בישיבה אחת.** לכן אין כאן
 * "להגיש בקשה למלגה" — יש "לחתום על כתב ההתחייבות", "להירשם ביום הפתיחה",
 * "לבדוק אם אישור השחרור אצלך". מי שסיים משימה כאן באמת סיים משהו.
 */
export function buildPlan(
  quiz: QuizLike,
  shortlist: { name: string; track: Track }[],
  today = new Date(),
): PlanTask[] {
  const tasks: PlanTask[] = [];
  const track: Track | undefined = shortlist[0]?.track;
  const inPeriphery = quiz.location === "B";

  const add = (t: Omit<PlanTask, "source" | "status">) =>
    tasks.push({ ...t, source: "generated", status: "open" });

  // — מלגות. רק מה שרלוונטי למסלול, ורק מה שהחלון שלו עוד לפנינו —
  for (const s of SCHOLARSHIPS) {
    if (s.tracks && track && !s.tracks.includes(track)) continue;
    if (s.id === "yeud44" && !inPeriphery) continue;
    if (s.id === "yeud46") continue; // רק לבוגרי מכינה — נכנס ידנית

    if (s.opensAt) {
      const opens = nextOccurrence(s.opensAt.d, s.opensAt.m, today);
      if (daysUntil(opens, today) >= 0) {
        add({
          id: `s-open-${s.id}`,
          title: `${s.name} — נפתחת. להירשם`,
          note: s.catch ?? s.what,
          area: "scholarship",
          due: opens.toISOString(),
        });
        continue;
      }
    }
    if (s.closesAt) {
      const closes = nextOccurrence(s.closesAt.d, s.closesAt.m, today);
      add({
        id: `s-close-${s.id}`,
        title:
          s.id === "yeud44"
            ? "ייעוד 44 — לחתום על כתב ההתחייבות באזור האישי"
            : `${s.name} — להגיש לפני שנסגר`,
        note: s.catch ?? s.what,
        area: "scholarship",
        due: closes.toISOString(),
      });
    }
  }

  // — הרשמה. משימה אחת קטנה לכל מוסד ברשימה —
  for (const inst of shortlist.slice(0, 3)) {
    add({
      id: `r-check-${inst.name}`,
      title: `${inst.name} — לבדוק מה התאריך האחרון להרשמה`,
      note: "שיחה אחת ליחידת התמיכה. לא למדור רישום — הם לא מכירים מסלולי קבלה חלופיים. וגם אם המועד הרשמי עבר — כמעט תמיד שווה לבדוק בכל זאת: במוסדות רבים יש רשימות המתנה ומחזורים נוספים.",
      area: "registration",
      due: null,
    });
  }

  // — כסף. החשבון עצמו, לא הרגעה —
  if (quiz.budget === "A" || quiz.budget === "B") {
    add({
      id: "m-math",
      title: "לראות את החשבון: כמה זה עולה וכמה המלגות מכסות",
      note: "לוקח שתי דקות. עדיף לדעת את המספר מאשר לנחש אותו.",
      area: "money",
      due: null,
    });
  }

  // — מגורים —
  if (inPeriphery) {
    add({
      id: "h-commute",
      title: "לבדוק כמה זמן לוקחת הנסיעה למוסד בבוקר",
      note: "לא בגוגל מפות בערב — בשעה שבה באמת תיסע.",
      area: "housing",
      due: null,
    });
  }

  return tasks.sort((a, b) => {
    if (a.due && b.due) return a.due < b.due ? -1 : 1;
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });
}
