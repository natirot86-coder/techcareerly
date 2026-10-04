/**
 * src/lib/monday.ts — כתיבה חזרה ללוח "אינטק החדשה" (צד שרת בלבד).
 *
 * ─── המודל שסוכם עם נתי (4.10) ───────────────────────────────────────────────
 *
 * הלוח הראשי הוא **שער כניסה**, לוח אינטק הוא **הבעלות**, והאפליקציה היא
 * **ההתקדמות**. ארבעה סטטוסים, ורק שניים מהם נכתבים ביד:
 *
 *   לפני שיחה ראשונה  — ברירת המחדל לכל שורה חדשה (יבוא או דף נחיתה)
 *   נשלח קישור        — ✋ הרכזת. דיברה, הוא מעוניין, המייל יצא
 *   בתהליך פעיל       — 🤖 נגזר: ברגע שנקבעה פגישה ב-Cal
 *   לא מעוניין/ת      — ✋ הרכזת. סירב בשיחה
 *
 * **"נשלח קישור" הוא כל העניין.** בלעדיו הקפיצה הייתה מ"לפני שיחה" ישר
 * ל"בתהליך פעיל", ומי שקיבל קישור ולא קבע פגישה היה בלתי נראה — וזו בדיוק
 * נקודת הנטישה. עכשיו היא שורה בלוח, ומי שתקוע עליה שבוע הוא רשימת המעקב
 * **בלי שאיש יצטרך לכתוב אותה**.
 *
 * ─── שני כללים שמגינים על הלוח ───────────────────────────────────────────────
 *
 * 1. **לעולם לא לאחור.** מי שכבר "סיימ/ה תהליך" או "נרשמ/ה ללימודים" לא
 *    יוחזר ל"בתהליך פעיל" כי קבע פגישה נוספת. התקדמות היא חד-כיוונית כאן.
 * 2. **בלי טוקן — שקט.** `MONDAY_TOKEN` חסר ⇒ no-op מוחלט. ה-webhook של Cal
 *    לא ייפול בגלל אינטגרציה שעדיין לא הוגדרה; הנתון כבר שמור ב-Supabase
 *    וזה מקור האמת. מאנדיי הוא העותק לרכזת, לא ההפך.
 */

import { waLink } from "@/lib/waLink";

const API = "https://api.monday.com/v2";
const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";

const COL = {
  phone: "text_mm7tmnqc",
  email: "text_mm7tase7",
  coord: "color_mm7t74m3",
  status: "color_mm7t1s7a",
  source: "text_mm7t5f8a",
  wa: "link_mm7t82dd",
} as const;

export const STATUS = {
  beforeCall: "לפני שיחה ראשונה",
  linkSent: "נשלח קישור",
  active: "בתהליך פעיל",
  finished: "סיימ/ה תהליך",
  enrolled: "נרשמ/ה ללימודים",
  declined: "לא מעוניין/ת",
} as const;

/** סטטוסים שקביעת פגישה לא רשאית לדרוס */
const TERMINAL: string[] = [STATUS.finished, STATUS.enrolled];

/** אותו נרמול בדיוק כמו ב-webhook וב-candidate.ts — אחרת ההתאמה לא תעבוד */
export function normPhone(raw: unknown): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("972")) return d;
  if (d.startsWith("0")) return "972" + d.slice(1);
  return d.length === 9 ? "972" + d : d;
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors) {
      console.error("[monday]", JSON.stringify(j.errors).slice(0, 300));
      return null;
    }
    return j.data as T;
  } catch (e) {
    console.error("[monday] fetch failed", e);
    return null;
  }
}

/*
  ⚠️ "סיוון" בלוח הראשי מול "סיון" באינטק — **כתיב מלא מול חסר**, ולכן
  השוואת שם פרטי החזירה ריק והרכזת פשוט לא נכתבה. מכווצים אותיות כפולות
  (וו→ו, יי→י) לפני ההשוואה; זה בדיוק ההבדל בין שתי הצורות, בלי למחוק
  אותיות ובלי להמציא התאמות.
*/
export function heKey(s: string): string {
  return s.replace(/ו{2,}/g, "ו").replace(/י{2,}/g, "י").trim();
}

type Item = { id: string; name: string; column_values: { id: string; text: string | null }[] };
const cv = (it: Item, id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();

/**
 * ⚠️ עמודת הרכז/ת היא **רשימה סגורה**, ו-`create_labels_if_missing` ישמח
 * להמציא בה תווית חדשה. זה כבר קרה: ב-DB היא "סיון מקונן" ובלוח "סיון",
 * והבדיקה הראשונה ילדה תווית רביעית. מאז מתרגמים מול התוויות הקיימות
 * (שם פרטי מספיק), ומי שלא נמצא — לא נכתב. **עדיף שדה ריק על תווית
 * כפולה**: ריק זה חוסר, כפולה זה פילטר שמפספס חצי מהשורות בשקט.
 */
async function resolveCoordLabel(name: string | null | undefined): Promise<string | null> {
  const want = (name ?? "").trim();
  if (!want) return null;
  const data = await gql<{ boards: { columns: { settings_str: string }[] }[] }>(
    `{ boards(ids: ${BOARD}) { columns(ids: ["${COL.coord}"]) { settings_str } } }`
  );
  const raw = data?.boards?.[0]?.columns?.[0]?.settings_str;
  if (!raw) return null;
  let entries: [number, string][] = [];
  try {
    entries = Object.entries((JSON.parse(raw).labels ?? {}) as Record<string, string>)
      .map(([k, v]) => [Number(k), String(v).trim()] as [number, string]);
  } catch { return null; }

  /*
   * השוואה לפי **שם פרטי**, ומבין המתאימים נבחר הקצר ביותר. למה הקצר:
   * אם כבר נולדה בלוח תווית ארוכה ("סיון מקונן" לצד "סיון"), התאמה
   * מדויקת הייתה מנציחה דווקא את הכפולה. הקצר הוא הקנוני.
   */
  const first = heKey(want.split(/\s+/)[0]);
  const hits = entries
    .filter(([, l]) => heKey(l) === heKey(want) || heKey(l) === first || heKey(l.split(/\s+/)[0]) === first)
    .sort((a, b) => a[1].length - b[1].length || a[0] - b[0]);
  return hits[0]?.[1] ?? null;
}

/**
 * נקבעה פגישה ⇒ "בתהליך פעיל". מי שאינו בלוח — נוצר, כי זו בדיוק הדרך
 * שבה מגיעים מהקישור הישיר של הרכזת בלי לעבור באף טופס.
 *
 * מחזיר `"updated" | "created" | "skipped" | null` (null = האינטגרציה כבויה).
 */
export async function mondayMarkActive(p: {
  phone?: string;
  email?: string;
  name?: string;
  coordinatorName?: string | null;
  when?: string;
}): Promise<"updated" | "created" | "skipped" | null> {
  const phone = normPhone(p.phone);
  const email = (p.email ?? "").trim().toLowerCase();
  if (!phone && !email) return "skipped";

  const data = await gql<{ boards: { items_page: { items: Item[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { items { id name
       column_values(ids: ["${COL.phone}","${COL.email}","${COL.status}"]) { id text } } } } }`
  );
  if (!data) return null;

  const items = data.boards?.[0]?.items_page?.items ?? [];
  const hit = items.find(it => (phone && normPhone(cv(it, COL.phone)) === phone)
    || (email && cv(it, COL.email).toLowerCase() === email));

  const coord = await resolveCoordLabel(p.coordinatorName);

  if (hit) {
    const now = cv(hit, COL.status);
    if (TERMINAL.includes(now) || now === STATUS.active) return "skipped";
    const vals: Record<string, unknown> = { [COL.status]: { label: STATUS.active } };
    if (coord && !cv(hit, COL.coord)) vals[COL.coord] = { label: coord };
    const ok = await gql(
      `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b,
         item_id: $i, column_values: $v, create_labels_if_missing: true) { id } }`,
      { b: BOARD, i: hit.id, v: JSON.stringify(vals) }
    );
    return ok ? "updated" : null;
  }

  const vals: Record<string, unknown> = {
    [COL.status]: { label: STATUS.active },
    [COL.source]: `קבע/ה פגישה ביומן${coord ? " של " + coord : ""}${p.when ? " · " + p.when.slice(0, 10) : ""}`,
  };
  if (phone) vals[COL.phone] = phone;
  if (email) vals[COL.email] = email;
  if (coord) vals[COL.coord] = { label: coord };

  /*
   * ⚠️ הקישור נולד כאן ולא דרך ה-webhook: שורה שנוצרת ב-API עם
   * רכז/ת כבר ממולאת לא מפיקה אירוע שינוי לעמודה — **לא השתנה כלום, הוא
   * נולד כך** — ולכן מי שקבע פגישה בלי להיות בלוח היה נכנס בלי קישור.
   */
  const wa = waLink({ phone, participant: p.name ?? "", coordinator: coord });
  if (wa) vals[COL.wa] = { url: wa, text: `וואטסאפ ל${(p.name ?? "").trim().split(/\s+/)[0]}` };

  const ok = await gql(
    `mutation ($b: ID!, $n: String!, $v: JSON!) { create_item(board_id: $b, item_name: $n,
       column_values: $v, create_labels_if_missing: true) { id } }`,
    { b: BOARD, n: (p.name ?? "").trim() || phone || email, v: JSON.stringify(vals) }
  );
  return ok ? "created" : null;
}
