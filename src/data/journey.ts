/**
 * ששת שלבי המסע — **מקור אמת אחד**.
 *
 * לפני הקובץ הזה היו חמש רשימות שונות, בחמישה מקומות, עם שמות שלא הסכימו:
 * שלב 5 נקרא "צ׳קליסט" באונבורדינג, "מלגות" בפס ההתקדמות, "לוגיסטיקה ומלגות"
 * במפה, ו"התוכנית שלי" בתוך האפליקציה עצמה. שלבים 1 ו-6 שניהם נקראו "הרשמה".
 * כל מי שצריך שם שלב קורא מכאן, ואין רשימה שנייה.
 *
 * ─── שתי שפות, בכוונה ───────────────────────────────────────────────────────
 *
 * `candidate` — מה שהמועמד רואה באפליקציה. בלי ז'רגון, בלי מילה שחוזרת פעמיים,
 *               וכל שם אומר **למה השלב קיים** ולא איך הוא נראה.
 * `org`       — מה שמופיע ב-PRD, במפה, בדוחות ומול מל״ג ותורמים. "אינטייק"
 *               ו"חשיפה" הן המילים הנכונות שם, ובדיוק המילים הלא נכונות למועמד.
 *
 * ─── הכלל המבני שמאחורי הרשימה ──────────────────────────────────────────────
 *
 * **אף פגישה איננה שלב.** כל שלב הוא תקופה של עשייה, ושלושת השלבים האמצעיים
 * נסגרים בפגישה — זה מה ש-`closes` מייצג.
 *
 * שלב 2 נקרא פעם "פגישת פתיחה", כלומר על שם הרגע האחרון שלו. זו הייתה
 * אסימטריה: פגישות 2 ו-3 סגרו שלבים, ופגישה 1 **הייתה** שלב. היום שלב 2 הוא
 * "היכרות" — התקופה שבה הוא מכיר את התהליך ונוגע בשתי דקות של הייטק, והרכזת
 * מכירה אותו בפגישה שסוגרת אותה. אותה מילה משני הכיוונים, בכוונה.
 *
 * ⚠️ קביעת פגישה איננה השתתפות בה. מה שסוגר שלב הוא הפגישה שהתקיימה.
 */

export type JourneyStage = {
  /** מזהה יציב. **המספר משתנה בין קוהורטים, המזהה לא** */
  id: string;
  n: number;
  /** מה שהמועמד רואה */
  candidate: string;
  /** גרסה קצרה לפסי התקדמות צרים */
  short: string;
  /** שפת הארגון — PRD, מפה, דוחות */
  org: string;
  /** הפגישה שסוגרת את השלב. null = השלב לא נסגר בפגישה */
  closes: string | null;
};

export const JOURNEY: JourneyStage[] = [
  { id: "signup",  n: 1, candidate: "פתיחת חשבון",  short: "חשבון",    org: "טרום אינטייק",      closes: null },
  { id: "intro",   n: 2, candidate: "היכרות",        short: "היכרות",   org: "אינטייק",           closes: "פגישת היכרות" },
  { id: "tasting", n: 3, candidate: "טעימות הייטק",  short: "טעימות",   org: "חשיפה",             closes: "פגישת בחירת תחום" },
  { id: "track",   n: 4, candidate: "בחירת מסלול",   short: "מסלול",    org: "מסלול לימודים",     closes: "פגישת בחירת מסלול" },
  { id: "plan",    n: 5, candidate: "מלגות והרשמה",  short: "מלגות",    org: "לוגיסטיקה ומלגות",  closes: null },
  { id: "student", n: 6, candidate: "סטודנט/ית",     short: "סטודנט/ית", org: "רישום",            closes: null },
];

export const STAGE_COUNT = JOURNEY.length;

export function stage(n: number): JourneyStage | undefined {
  return JOURNEY.find(s => s.n === n);
}

/* ─── קוהורטים (28.8) ────────────────────────────────────────────────────────
 *
 * בוגרי טק-קריירה כבר עשו הכשרה טכנולוגית, ולכן שלב הטעימות מיותר להם — הם
 * לא צריכים לגלות מה זה סייבר אלא להחליט אם תואר שווה להם.
 *
 * ⚠️ **הרשימה של alumni מוגדרת כחיסור מ-main ולא כרשימה עצמאית.** שלב שיתווסף
 * בעתיד ל-main מופיע אצלם אוטומטית, אלא אם יוחרג כאן במפורש. רשימה שנייה
 * הייתה מתיישנת בשקט — וזה בדיוק הבאג שהקובץ הזה נולד כדי למנוע.
 */
export type CohortId = "main" | "alumni";

const EXCLUDED: Record<CohortId, string[]> = {
  main: [],
  alumni: ["tasting"],
};

export function isCohort(v: unknown): v is CohortId {
  return v === "main" || v === "alumni";
}

/** רשימת השלבים של הקוהורט — **ממוספרת מחדש**, המזהה נשמר */
export function journeyFor(cohort: CohortId = "main"): JourneyStage[] {
  const drop = EXCLUDED[cohort] ?? [];
  return JOURNEY.filter(s => !drop.includes(s.id)).map((s, i) => ({ ...s, n: i + 1 }));
}

export function stageCountFor(cohort: CohortId = "main"): number {
  return journeyFor(cohort).length;
}

/**
 * מסך שכתוב `current={4}` מתכוון לשלב 4 **של הקהל הרחב**. אצל בוגרים אותו
 * שלב הוא 3. הפונקציה מתרגמת, כדי שאף מסך לא יצטרך להכיר קוהורטים.
 * מחזירה 0 אם השלב לא קיים אצל הקוהורט הזה.
 */
export function stageNumFor(cohort: CohortId, mainN: number): number {
  const id = JOURNEY.find(s => s.n === mainN)?.id;
  return id ? (journeyFor(cohort).find(s => s.id === id)?.n ?? 0) : 0;
}

/** מספר הפגישה כפי שהמועמד רואה אותה. אצל בוגרים אין פגישה 2, וה-3 היא השנייה */
export function meetingLabelFor(cohort: CohortId, n: 1 | 2 | 3): number {
  if (cohort !== "alumni") return n;
  return n === 3 ? 2 : n;
}

/** שמות שלושת הפגישות, נגזרים מהשלבים שהן סוגרות — כדי שלא יהיה שם שני */
export const MEETING_NAMES: Record<1 | 2 | 3, string> = {
  1: JOURNEY[1].closes!,
  2: JOURNEY[2].closes!,
  3: JOURNEY[3].closes!,
};
