/**
 * תארים — הישות הרביעית, והמקבילה האקדמית לקורס העטוף.
 *
 * בהכשרה היחידה היא קורס = מוסד × מעטפת. **באקדמיה ההחלטה האמיתית היא
 * התואר, והמוסד הוא הכתובת** — "מערכות מידע בבן-גוריון דרך סיקט", לא
 * "בן-גוריון". ממצא הדגל של המחקר (docs/research-findings.md): פער של
 * 12,000 ₪ בחודש בין שני תארים שנשמעים כמעט אותו דבר.
 *
 * **התואר הוא ישות לאומית, לא מוסדית** — השכר, התעסוקה והנגישות כמעט זהים
 * בכל הארץ, ולכן שורה אחת לתואר במקום לאמת מאות צירופי תואר×מוסד.
 *
 * **העיקרון המנחה: הנגישות היא הציר, לא היוקרה.** לקהל שלנו התואר המומלץ
 * אינו הטוב ביותר בתחום אלא הטוב ביותר שאפשר להיכנס אליו — מערכות מידע
 * מגיעה כמעט לאותם תפקידים כמו מדעי המחשב, עם דלת כניסה כפולה ברוחבה.
 *
 * מקור הנתונים: עבודאטה / משרד העבודה + סקר מודעות חיות (אוגוסט 2026),
 * מתועד במלואו ב-docs/research-findings.md. לא ממציאים — מה שלא נבדק לא כתוב.
 */

import type { Domain } from "./institutions";

export type Degree = {
  id: string;
  name: string;
  /** B.Sc / B.A — ההבדל מהותי: ראה מערכות מידע */
  kind: string;
  /** שכר ממוצע אחרי 5–6 שנים, ₪ לחודש. מקור: עבודאטה */
  salary?: number;
  /** אחוז מועסקים */
  employment?: number;
  /** אחוז שמגיעים לענף התוכנה — המדד שמפריד תארים דומים-בשמם */
  inTech?: number;
  /** לאילו תחומי חקר התואר מוביל */
  domains: Domain[];
  /** לאילו תפקידים הוא באמת פותח דלת — מסקר מודעות חיות */
  leadsTo: string;
  /** ההסתייגות הכנה. תמיד מוצגת — בלי חצאי אמיתות */
  caveat: string;
  /** חסם הכניסה בפועל */
  entryBar: "high" | "medium" | "low";
  entryNote: string;
  /** האם ההמלצה שלנו לקהל — ולמה */
  recommended?: string;
  status: "active" | "hidden";
  notes?: string;
  /**
   * המוסדות המומלצים ללמוד בהם את התואר הזה — **סימון של נתי, לא שלנו**.
   * אנחנו לא יודעים לאמת איזה מוסד "הכי טוב" לתואר; מי שכן יודע זה מי
   * שמדבר עם המוסדות. ריק = עוד לא סומן, והמועמד לא רואה המלצת מוסד.
   */
  recommendedAt?: string[];
};

export const DEGREES: Degree[] = [
  {
    id: "info-systems-eng",
    name: "הנדסת מערכות מידע",
    kind: "B.Sc",
    salary: 38700, employment: 84, inTech: 75,
    domains: ["data", "code", "cyber", "networks"],
    leadsTo: "פיתוח (מופיעה במודעות לצד מדעי המחשב!) · BI · Data · סייבר SOC · יישום",
    caveat: "פחות מוכרת ממדעי המחשב, וחלק מהמודעות עדיין נוקבות רק בו.",
    entryBar: "medium",
    entryNote: "נגישה יותר ממדעי המחשב ברוב המוסדות — וזה כל הסיפור: 75% מהבוגרים בענף",
    recommended:
      "ההמלצה המרכזית שלנו: כמעט אותם תפקידים כמו מדעי המחשב, עם דלת כניסה רחבה כפליים. עתידים ומלגות ות״ת מכירות בה במפורש.",
    status: "active",
  },
  {
    id: "cs",
    name: "מדעי המחשב",
    kind: "B.Sc",
    salary: 36000, employment: 89, inTech: 72,
    domains: ["code", "data", "ai", "cyber"],
    leadsTo: "פיתוח · אלגוריתמיקה · ML · כל תפקידי התוכנה",
    caveat: "הדלת הצרה ביותר: מתמטיקה 4–5 יח׳ וסכם גבוה כמעט בכל מקום. השכר הוא טווח ~35–37.5 אלף.",
    entryBar: "high",
    entryNote: "החסם הוא הקבלה, לא הלימודים. חלופות: מכינות ייעודיות, האקדמית רמת גן (בגרות 80 בלי פסיכומטרי)",
    recommended: "הבחירה הנכונה למי שהמתמטיקה שלו חזקה — השם שכל מודעה מכירה.",
    status: "active",
  },
  {
    id: "info-systems-ba",
    name: "מערכות מידע (מכללות)",
    kind: "B.A",
    salary: 26500, employment: 94, inTech: 62,
    domains: ["data", "networks"],
    leadsTo: "ניתוח מערכות · BI · יישום ERP · QA ידני · IT ו-NOC",
    caveat: "94% מוצאים עבודה — אבל בתפקידים זולים יותר. מיישם מתחיל: ~15,000 ₪. פיתוח כמעט סגור.",
    entryBar: "low",
    entryNote: "הדלת האקדמית הנגישה ביותר לטק — בלי דרישות מתמטיקה גבוהות ברוב המכללות",
    recommended: "למי שהעדיפות שלו היא ודאות תעסוקתית וכניסה מהירה — לא תקרת השכר.",
    status: "active",
  },
  {
    id: "industrial-eng",
    name: "הנדסת תעשייה וניהול",
    kind: "B.Sc",
    salary: 27000, employment: 92, inTech: 50,
    domains: ["data", "marketing"],
    leadsTo: "BI ואנליטיקה · ניהול מוצר · תפעול. היחיד ש-GotFriends נוקבת בשמו כרקע ל-Data Analyst",
    caveat: "לא מכשיר לפיתוח. חצי מהבוגרים בכלל לא בטק.",
    entryBar: "medium",
    entryNote: "הגשר הטוב ביותר למלגות: מופיע במפורש גם בעתידים וגם במושל",
    status: "active",
  },
  {
    id: "ee",
    name: "הנדסת חשמל / מחשבים",
    kind: "B.Sc",
    salary: 33300, employment: 84, inTech: 18,
    domains: ["networks", "cyber"],
    leadsTo: "חומרה · Embedded · VLSI · סייבר OT. הגרסה המשולבת (מחשבים-חשמל): 45,300 ₪ — השיא בטבלה",
    caveat: "רק 18% מגיעים לתוכנה — זו בחירה בחומרה, לא דלת לתוכנה.",
    entryBar: "high",
    entryNote: "דרישות קבלה כמו מדעי המחשב ומעלה",
    recommended: "קונטרה-אינטואיטיבי ל-2026: חומרה יציבה מתוכנה — מפתחי תוכנה +174% בלתי-מועסקים בשלוש שנים, מהנדסי חומרה +5% בלבד.",
    status: "active",
  },
  {
    id: "statistics",
    name: "סטטיסטיקה ומדעי הנתונים",
    kind: "B.Sc",
    salary: 25400, inTech: 55,
    domains: ["data", "ai"],
    leadsTo: "Data Analyst · BI",
    caveat: "ל-Data Scientist מלא נדרש בדרך כלל תואר שני.",
    entryBar: "medium",
    entryNote: "דורש נוחות עם מתמטיקה, אך פחות מהנדסה",
    status: "active",
  },
  {
    id: "math",
    name: "מתמטיקה",
    kind: "B.Sc",
    salary: 30500, employment: 63, inTech: 41,
    domains: ["ai", "data"],
    leadsTo: "אלגוריתמיקה · ML — אבל רק בדו-חוגי עם מדעי המחשב",
    caveat: "לבד: 63% תעסוקה בלבד, ושליש הולכים לחינוך. רק כדו-חוגי.",
    entryBar: "high",
    entryNote: "מתמטיקה 5 יח׳ ברמה גבוהה",
    status: "active",
  },
  {
    id: "business-is",
    name: "מנהל עסקים עם התמחות במערכות מידע",
    kind: "B.A",
    salary: 19200, employment: 90, inTech: 15,
    domains: ["marketing", "data"],
    leadsTo: "ניהול מוצר · שיווק · יישום. ⚠️ רק עם ההתמחות — מודעות Log-On דורשות אותה כשורה מפורשת",
    caveat: "הכי חלש לטק: 15% בענף, והתפקידים האלה ראשונים לעבור לחו״ל. בלי ההתמחות — לא רלוונטי בכלל.",
    entryBar: "low",
    entryNote: "הדלת הכי קלה — וזו בדיוק הסיבה לחשוד בה",
    status: "active",
  },
  {
    id: "psych-ux",
    name: "פסיכולוגיה / קוגניציה",
    kind: "B.A",
    salary: 14600, employment: 89, inTech: 18,
    domains: ["ux"],
    leadsTo: "UX Research · Product — בתוספת קורס UX ותיק עבודות",
    caveat: "שוק ה-UX לג׳וניורים כמעט סגור: שכר ג׳וניור צנח מ-14,900 ל-11,927 ₪ בשנה אחת. לא מסלול כניסה מומלץ כרגע.",
    entryBar: "medium",
    entryNote: "קבלה נגישה — אבל השוק בקצה השני לא",
    status: "active",
  },
];

/** התארים שמובילים לתחום, ממוינים: מומלצים קודם, ואז לפי נגישות ושכר */
export function degreesFor(domain: Domain): Degree[] {
  const bar = { low: 0, medium: 1, high: 2 };
  return DEGREES
    .filter(d => d.status === "active" && d.domains.includes(domain))
    .sort((a, b) =>
      (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0) ||
      bar[a.entryBar] - bar[b.entryBar] ||
      (b.salary ?? 0) - (a.salary ?? 0));
}

export const ENTRY_LABEL: Record<Degree["entryBar"], { label: string; color: string }> = {
  low: { label: "כניסה נגישה", color: "#059669" },
  medium: { label: "כניסה בינונית", color: "#b45309" },
  high: { label: "כניסה תחרותית", color: "#b91c1c" },
};
