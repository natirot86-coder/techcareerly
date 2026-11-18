/**
 * src/lib/webinars.ts — תגי "השתתפות בוובינרים" מלוח אינטק (נתי, 2.11).
 *
 * מאנדיי הוא המקור היחיד: מי שהשתתף/ה מתויג/ת בעמודה (רשימה נפתחת, כמה
 * ערכים). האפליקציה **קוראת** את העמודה בכל כניסה ולא מעתיקה אותה — אין שני
 * מקומות שיכולים לא להסכים.
 *
 * מוסכמה לשם התג: "וובינר <נושא> <תאריך>" — "וובינר סייבר 1.11.26". תג בפורמט
 * אחר עדיין מוצג כמו שהוא, רק בלי תאריך ובלי קישור לתחום.
 */

/** מילת מפתח בנושא ⇐ תחום באפליקציה (לקישור לטעימה ולסיגנל עניין) */
const DOMAIN_WORDS: [RegExp, string][] = [
  [/סייבר|cyber/i, "cyber"],
  [/דאטה|נתונים|data/i, "data"],
  [/פיתוח|תכנות|קוד|code/i, "code"],
  [/בדיקות|qa/i, "qa"],
  [/רשתות|network/i, "networks"],
  [/חומרה|hardware/i, "hardware"],
  [/בינה מלאכותית|\bai\b/i, "ai"],
  [/ux|חוויית משתמש|עיצוב/i, "ux"],
  [/שיווק|marketing/i, "marketing"],
];

export type Webinar = {
  /** התג כפי שהוא בלוח */
  label: string;
  /** "סייבר" — הנושא בלי המילה "וובינר" ובלי התאריך */
  topic: string;
  /** "1.11" — לתצוגה קצרה, או null */
  day: string | null;
  /** ISO, למיון — או null */
  date: string | null;
  /** מזהה תחום באפליקציה, או null */
  domain: string | null;
};

export function parseWebinar(label: string): Webinar {
  const raw = label.trim();
  const m = raw.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\s*$/);
  let date: string | null = null, day: string | null = null;
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : new Date().getFullYear();
    day = `${Number(m[1])}.${Number(m[2])}`;
    date = new Date(Date.UTC(y, Number(m[2]) - 1, Number(m[1]))).toISOString().slice(0, 10);
  }
  const topic = (m ? raw.slice(0, m.index) : raw).replace(/^וובינר\s*/, "").trim() || raw;
  const domain = DOMAIN_WORDS.find(([re]) => re.test(topic))?.[1] ?? null;
  return { label: raw, topic, day, date, domain };
}

/** טקסט עמודת dropdown של מאנדיי ("א, ב") ⇐ רשימת וובינרים, מהחדש לישן */
export function parseWebinarColumn(text: string | null | undefined): Webinar[] {
  return (text ?? "").split(",").map(s => s.trim()).filter(Boolean).map(parseWebinar)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
