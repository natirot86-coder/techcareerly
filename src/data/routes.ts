/**
 * מסלולי הכניסה למשרה ראשונה, לפי תחום — במבנה של וריאנט 7a:
 * שלושה קווים אנכיים זה לצד זה, שכולם יוצאים מאותה נקודה — היום.
 *
 * ארבעה כללים שנקבעו ואסור לשבור:
 *
 * 1. אורך הקו מייצג משך — דחוס בכוונה, ולא בקנה מידה אמיתי. קנה מידה
 *    אמיתי היה הופך את המסלול הקצר לעדיף אוטומטית.
 *
 * 2. שני גוונים של ירוק: בהיר = אפשר להרוויח כאן · מלא = מכאן בטוח.
 *    משרת סטודנט היא "אפשרי" ולא "בטוח" — השוק תחרותי, ולא נבטיח.
 *
 * 3. אפס טקסט על התחנות. שם ותת-תווית קצרה, ותו לא. העומק במסך הנפרד.
 *
 * 4. gap = מרווח בפיקסלים מהתחנה הקודמת. זה מה שיוצר את ההבדל באורכים,
 *    והוא נכתב ביד לכל מסלול — לא נגזר מקבוע.
 */

import type { Domain, Track } from "./institutions";

export type Station = {
  label: string;
  /** מרווח מהתחנה הקודמת. התחנה הראשונה — מסוף קטע ההכנה */
  gap: number;
  /** מכאן השכר בטוח — הקו הופך ירוק מלא */
  income?: boolean;
  /** אפשר להרוויח כאן, אבל זה לא מובטח — ירוק בהיר ועיגול מקווקו */
  optional?: boolean;
};

export type Route = {
  track: Track;
  span: string;
  destination: string;
  /** שורה אחת. זה כל הפרוזה שמותרת בכרטיס */
  note: string;
  /** קטע מקווקו לפני התחנה הראשונה — שלב שלא כולם צריכים */
  prep?: { height: number; label: string };
  stations: Station[];
};

const PREP = { height: 46, label: "פסיכומטרי · מכינה · בגרויות" };

/** מסלול תואר סטנדרטי — חוזר על עצמו ברוב תחומי הפיתוח */
function degreeRoute(destination: string, note: string, firstJob = "משרה ראשונה"): Route {
  return {
    track: "degree", span: "3-4 שנים", destination, note, prep: PREP,
    stations: [
      { label: "קבלה", gap: 0 },
      { label: "משרת סטודנט", gap: 74, optional: true },
      { label: "תואר + ניסיון", gap: 94 },
      { label: firstJob, gap: 48, income: true },
    ],
  };
}

export const ROUTES: Record<Domain, Route[]> = {
  code: [
    degreeRoute("מפתח/ת תוכנה", "נפתח לצוות, ארכיטקטורה, ניהול ומחקר"),
    {
      track: "bootcamp", span: "6-12 חודשים", destination: "מפתח/ת ג׳וניור",
      note: "כניסה מהירה. תיק העבודות הוא מה שמבדיל",
      stations: [
        { label: "מיון", gap: 0 }, { label: "הקורס", gap: 40 },
        { label: "תיק עבודות", gap: 40 }, { label: "משרה ראשונה", gap: 56, income: true },
      ],
    },
  ],

  data: [
    degreeRoute("אנליסט/ית · דאטה סיינטיסט/ית", "נפתח למחקר, ML ותפקידים בכירים"),
    {
      track: "bootcamp", span: "6-12 חודשים", destination: "אנליסט/ית דאטה",
      note: "ML ומחקר דורשים בסיס סטטיסטי מתואר",
      stations: [
        { label: "מיון", gap: 0 }, { label: "הקורס", gap: 40 },
        { label: "תיק עבודות", gap: 40 }, { label: "משרה ראשונה", gap: 56, income: true },
      ],
    },
  ],

  cyber: [
    degreeRoute("מהנדס/ת אבטחה", "נפתח למחקר, ארכיטקטורה ותפקידים בכירים"),
    {
      track: "bootcamp", span: "6 חודשים", destination: "אנליסט/ית SOC",
      note: "כניסה מצוינת. להתקדם למחקר צריך להמשיך ללמוד",
      stations: [
        { label: "מיון", gap: 0 }, { label: "קבלה", gap: 30 },
        { label: "הקורס", gap: 32 }, { label: "השמה", gap: 56, income: true },
      ],
    },
    {
      track: "mahat", span: "2-3 שנים", destination: "הנדסאי/ת מערכות ואבטחה",
      note: "חזק בגופים ביטחוניים וממשלתיים",
      stations: [
        { label: "קבלה", gap: 0 }, { label: "תעודת הנדסאי", gap: 150 },
        { label: "השמה", gap: 40, income: true },
      ],
    },
  ],

  networks: [
    degreeRoute("מהנדס/ת רשתות ותשתיות", "נפתח לארכיטקטורה, ענן ותפקידים בכירים"),
    {
      track: "bootcamp", span: "6 חודשים", destination: "טכנאי/ת רשת · NOC",
      note: "ההסמכות — CCNA וענן — שוות כאן לא פחות מתעודה",
      stations: [
        { label: "מיון", gap: 0 }, { label: "הקורס", gap: 34 },
        { label: "CCNA · ענן", gap: 34 }, { label: "השמה", gap: 50, income: true },
      ],
    },
    {
      track: "mahat", span: "2-3 שנים", destination: "הנדסאי/ת תקשורת ותשתיות",
      note: "לחיילים משוחררים: 90% מימון שכר הלימוד",
      stations: [
        { label: "קבלה", gap: 0 }, { label: "תעודת הנדסאי", gap: 150 },
        { label: "השמה", gap: 40, income: true },
      ],
    },
  ],

  ai: [
    degreeRoute("מהנדס/ת AI · חוקר/ת", "התחום היחיד שבו התואר כמעט הכרחי"),
  ],

  ux: [
    {
      track: "degree", span: "3-4 שנים", destination: "מעצב/ת מוצר · UX",
      note: "נפתח לפרודקט דיזיין וניהול עיצוב",
      stations: [
        { label: "תיק עבודות", gap: 0 },
        { label: "לימודי עיצוב", gap: 74 },
        { label: "פרילנס ופרויקטים", gap: 94, optional: true },
        { label: "משרה ראשונה", gap: 48, income: true },
      ],
    },
    {
      track: "bootcamp", span: "6-12 חודשים", destination: "מעצב/ת UX ג׳וניור",
      note: "התיק קובע יותר מהתעודה",
      stations: [
        { label: "הקורס", gap: 0 }, { label: "בניית תיק", gap: 40 },
        { label: "פרויקטים ראשונים", gap: 44, optional: true },
        { label: "משרה ראשונה", gap: 50, income: true },
      ],
    },
  ],

  qa: [
    {
      track: "bootcamp", span: "3–5 חודשים", destination: "בודק/ת תוכנה",
      note: "המסלול המהיר לטק: קווליטסט מכשירה לעצמה (~3 חודשים), ויש קורסי QA רבים. לב העניין: הכשרה עם השמה, לא קורס בלבד",
      stations: [
        { label: "הכשרת QA", gap: 0 },
        { label: "פרויקט מעשי", gap: 90 },
        { label: "משרה ראשונה", gap: 90, income: true },
      ],
    },
    {
      track: "degree", span: "3 שנים", destination: "QA ואוטומציה",
      note: "מערכות מידע פותחת QA ידני; לאוטומציה — תואר טכנולוגי מלא עדיף. משרת סטודנט מסוף שנה א׳",
      stations: [
        { label: "שנה א׳", gap: 0 },
        { label: "משרת סטודנט", gap: 100, income: true, optional: true },
        { label: "תואר + משרה", gap: 160 },
      ],
    },
  ],
  marketing: [
    {
      track: "bootcamp", span: "3-9 חודשים", destination: "שיווק דיגיטלי ג׳וניור",
      note: "מתקדמים לפי תוצאות מוכחות, לא לפי תעודה",
      stations: [
        { label: "קורס", gap: 0 },
        { label: "קמפיין ראשון", gap: 44, optional: true },
        { label: "פרילנס", gap: 44 },
        { label: "משרה", gap: 50, income: true },
      ],
    },
  ],
};

export function routesFor(domain: Domain): Route[] {
  return ROUTES[domain] ?? [];
}

/** y מוחלט לכל תחנה, נגזר מה-gaps ומגובה קטע ההכנה */
export function stationYs(route: Route): number[] {
  let y = route.prep ? route.prep.height : 0;
  return route.stations.map(s => (y += s.gap));
}

/**
 * מה אומרים כשמסלול לא קיים בתחום.
 * "לא מצאנו" ולא "לא קיים" — הרשימה שלנו חלקית, ואם רכזת מכירה מסלול
 * שאנחנו לא, האפליקציה לא צריכה לסתור אותה מול המועמד.
 */
export const NO_ROUTE_NOTE: Partial<Record<Domain, Partial<Record<Track, string>>>> = {
  ai: {
    bootcamp: "לא מצאנו הכשרה שמכניסה ל-AI בלי תואר. זה כמעט התחום היחיד שבו הבסיס המתמטי הוא תנאי אמיתי.",
    mahat: "אין מסלול הנדסאי שמוביל ל-AI.",
  },
  ux: { mahat: "אין מסלול הנדסאי בעיצוב. הכניסה כאן היא דרך תיק עבודות." },
  code: { mahat: "יש הנדסאי תוכנה, אבל הוא דורש כמעט מה שתואר דורש ולוקח כמעט אותו זמן." },
  data: { mahat: "לא מצאנו מסלול הנדסאי שמוביל לדאטה." },
  marketing: {
    degree: "אין תואר במדעי המחשב לשיווק דיגיטלי. כאן מה שפותח דלתות הוא תיק עבודות ותוצאות.",
    mahat: "לא רלוונטי לתחום הזה.",
  },
};

/**
 * המשך אפשרי מהכשרה או מהנדסאי אל תואר.
 * מנוסח כהעמקה ולא כ"חזרה" — "לחזור" מרמז שההכשרה הייתה עיקוף או כשל,
 * ו"להעמיק" אומר התקדמות. לקהל הזה זה הבדל אמיתי.
 */
export const DEEPEN_NOTE =
  "מהכשרה או מהנדסאי אפשר להמשיך לתואר ולהעמיק. הרבה עושים בדיוק את זה — וזה קל יותר כשכבר עובדים ומרוויחים.";
