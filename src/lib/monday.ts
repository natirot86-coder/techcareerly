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
  /* "מאיפה הגיע/ה" — ערוץ אחד, רשימה סגורה */
  channel: "color_mm7tee80",
} as const;

export const STATUS = {
  beforeCall: "לפני שיחה ראשונה",
  linkSent: "נשלח קישור",
  active: "בתהליך פעיל",
  finished: "סיימ/ה תהליך",
  enrolled: "נרשמ/ה ללימודים",
  declined: "לא מעוניין/ת",
  /*
   * ⚠️ **דיווח בלבד — לא תהליך** (נתי, 5.10). שתי קבוצות יושבות בלוח רק
   * כדי שיופיעו בדיווח למשרד העבודה: מי שהתחיל קורס של רשות החדשנות,
   * ובוגרים שכבר נרשמו לתואר. אין להם רכז/ת, אין להם מסע, והם **לעולם
   * לא יתקדמו — במתכוון**.
   *
   * ולכן הם מסוננים מכל מה שהאפליקציה מציגה: אחרת הרכזת הייתה מנסה
   * להתקשר אליהם, הם היו נספרים ב"בליווי שלי", ואחוז ההמרה של התוכנית
   * היה נראה גרוע ממה שהוא. מספר שהתחיל לשקר אי אפשר לתקן אחורה.
   */
  reportOnly: "נרשמו ללימודים — דיווח בלבד",
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

  /*
   * ⚠️ מי שקובע פגישה בלי להיות בלוח **נוצר כאן** (נתי, 5.10): תמיד יהיו
   * כאלה שיקבלו קישור ישיר ויקפצו מעל מאנדיי, ועדיף שייכנסו אוטומטית
   * מאשר שיתגלו כעבור שבוע. הכפילות נמנעת לפי טלפון או מייל למעלה.
   *
   * **מאיפה הגיע/ה נשאר "לא ידוע עדיין" במפורש ולא ריק** — זו שאלה פתוחה
   * לרכזת, והיא נספרת במסך שלה. שדה ריק נראה כמו שכחה; "לא ידוע עדיין"
   * נראה כמו משימה.
   */
  const vals: Record<string, unknown> = {
    [COL.status]: { label: STATUS.active },
    [COL.channel]: { label: "לא ידוע עדיין" },
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
  /* בלי calPath הפונקציה מחזירה ריק — הקישור ייווצר ב-webhook כשתשוייך רכז/ת */
  const wa = waLink({ phone, participant: p.name ?? "", coordinator: coord });
  if (wa) vals[COL.wa] = { url: wa, text: `וואטסאפ ל${(p.name ?? "").trim().split(/\s+/)[0]}` };

  const ok = await gql(
    `mutation ($b: ID!, $n: String!, $v: JSON!) { create_item(board_id: $b, item_name: $n,
       column_values: $v, create_labels_if_missing: true) { id } }`,
    { b: BOARD, n: (p.name ?? "").trim() || phone || email, v: JSON.stringify(vals) }
  );
  return ok ? "created" : null;
}

/**
 * ── מי שנרשם/ה ישירות באפליקציה מקבל/ת שורה בלוח (נתי, 31.10) ──────────────
 *
 * עד היום שורה נוצרה רק מהלוח הראשי ("חשיפה") או מקביעת פגישה ב-Cal
 * (`mondayMarkActive`). מי שנכנס/ה מקישור שהועבר ישירות, נרשם/ה, אימת/ה
 * טלפון **ולא קבע/ה** — לא היה/תה בשום לוח. ומסך הרכז/ת נבנה מהלוח, אז
 * היא הייתה בלתי נראית בדיוק ברגע שבו צריך להרים אליה טלפון (פקדו, 26.10).
 *
 * נקרא אחרי שמירת ההרשמה **וגם** בבדיקת הבוקר — אותה פונקציה, כי כל אירוע
 * יכול להתפספס. לא נוגע/ת בשורה קיימת: מרגע שיש שורה, הלוח הוא הבית שלה.
 */
export const CHANNEL_DIRECT = "נרשם ישירות מהאפליקציה";

export async function mondayEnsureParticipant(p: {
  phone: string; email?: string | null; name?: string | null;
  coordinatorName?: string | null; gender?: string | null; city?: string | null; when?: string | null;
  /** בודק בדיוק כמו היצירה האמיתית, בלי לכתוב */
  dry?: boolean;
}): Promise<{ result: "exists" | "created" | "skipped" | "would-create"; itemId?: string } | null> {
  if (!process.env.MONDAY_TOKEN) return null;
  const phone = normPhone(p.phone);
  const email = (p.email ?? "").trim().toLowerCase();
  if (!phone) return { result: "skipped" };

  const data = await gql<{ boards: { items_page: { cursor: string | null; items: Item[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { cursor items { id name
       column_values(ids: ["${COL.phone}","${COL.email}"]) { id text } } } } }`
  );
  const page = data?.boards?.[0]?.items_page;
  /* לוח שלא נקרא במלואו ⇒ לא יוצרים: "לא מצאתי" בחצי לוח הוא כפילות שמחכה */
  if (!page || page.cursor) return null;
  const hit = page.items.find(it => normPhone(cv(it, COL.phone)) === phone
    || (email && cv(it, COL.email).toLowerCase() === email));
  if (hit) return { result: "exists", itemId: hit.id };
  if (p.dry) return { result: "would-create" };

  const coord = await resolveCoordLabel(p.coordinatorName);
  const name = (p.name ?? "").trim();
  const vals: Record<string, unknown> = {
    [COL.status]: { label: STATUS.beforeCall },
    [COL.channel]: { label: CHANNEL_DIRECT },
    [COL.source]: `נרשם/ה באפליקציה${p.when ? " · " + p.when.slice(0, 10) : ""}`,
    [COL.phone]: phone,
  };
  if (email) vals[COL.email] = email;
  if (coord) vals[COL.coord] = { label: coord };
  if (p.city?.trim()) vals[COL_EXTRA.city] = p.city.trim();
  const g = p.gender === "male" ? "זכר" : p.gender === "female" ? "נקבה" : null;
  if (g) vals[COL_EXTRA.gender] = { label: g };
  /* כמו ב-mondayMarkActive: שורה שנולדת עם רכז/ת לא מפיקה אירוע שינוי, אז הקישור נבנה כאן */
  const wa = waLink({ phone, participant: name, coordinator: coord });
  if (wa) vals[COL.wa] = { url: wa, text: `וואטסאפ ל${name.split(/\s+/)[0]}` };

  const r = await gql<{ create_item: { id: string } }>(
    `mutation ($b: ID!, $n: String!, $v: JSON!) { create_item(board_id: $b, item_name: $n,
       column_values: $v, create_labels_if_missing: true) { id } }`,
    { b: BOARD, n: name || phone, v: JSON.stringify(vals) }
  );
  return r ? { result: "created", itemId: r.create_item.id } : null;
}

/* ── הרשימה של הרכזת מגיעה מהלוח (נתי, 5.10) ──────────────────────────────────
 *
 * עד היום מסך הרכזת שאב את רשימת המשתתפים מ-`candidates`, כלומר **רק ממי
 * שכבר נכנס לאפליקציה** — ובפועל אף אחד מה-44 לא נכנס, ולכן הטאב "כל
 * המשתתפים" היה ריק לגמרי בזמן שלסיון 21 אנשים בליווי.
 *
 * המודל שסוכם: **הלוח הראשי שער · לוח אינטק בעלות · האפליקציה התקדמות.**
 * הבעלות היא מי נמצא ברשימה, ולכן היא באה מהלוח. Cal והאפליקציה מעשירים.
 */
export type BoardRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  coordinator: string;
  status: string;
  source: string;
  track: string;
  /* לעריכה במסך הניהול (16.10) — הערכים כפי שהם בלוח */
  gender: string;
  city: string;
  /** תאריך הלחיצה הראשונה על הקישור מההודעה, או "" */
  clickedAt: string;
};

const COL_EXTRA = {
  src: "color_mm7tee80", track: "color_mm7tahjd",
  gender: "color_mm7twyz4", city: "text_mm7tafps",
  /* "לחץ על הקישור" — נכתב מ-/api/r בלחיצה הראשונה (8.10). המדד היחיד ל"פתח" ברמת אדם */
  clicked: "date_mm7ye5aa",
} as const;

/*
 * ⚠️ **בוגרי הקורס שסיון דיברה איתם באוגוסט — לפני התוכנית** (נתי, 11.10).
 * 13 שורות, כולן "סיימ/ה תהליך". הן בלוח כי זה התיעוד, ולא במסך הניהול
 * כי הן לא תהליך: הרכזת הייתה רואה 13 "סיימו" ובטוחה שזה ההישג של
 * אינטק. אותו עיקרון כמו PROGRAM_START בפגישות.
 *
 * הסינון לפי **הערוץ ולא לפי המסלול**: שלושה מ"בוגרים — תואר בלבד"
 * הגיעו מהוובינר והם בתהליך פעיל — סינון לפי מסלול היה מעלים אותם.
 */
const PRE_PROGRAM_SOURCE = "בוגר שסיון דיברה איתו";

/** כל השורות בלוח. `coordinatorName` ריק ⇒ הכל (מנהלת/owner) */
export async function mondayBoard(coordinatorName?: string | null): Promise<BoardRow[] | null> {
  const ids = [COL.phone, COL.email, COL.coord, COL.status, COL.source, COL_EXTRA.src, COL_EXTRA.track,
    COL_EXTRA.gender, COL_EXTRA.city, COL_EXTRA.clicked]
    .map(c => `"${c}"`).join(", ");
  const data = await gql<{ boards: { items_page: { items: Item[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { items { id name
       column_values(ids: [${ids}]) { id text } } } } }`
  );
  if (!data) return null;

  const want = coordinatorName ? heKey(coordinatorName.split(/\s+/)[0]) : null;
  return (data.boards?.[0]?.items_page?.items ?? [])
    .map(it => ({
      id: it.id,
      name: it.name.trim(),
      phone: normPhone(cv(it, COL.phone)),
      email: cv(it, COL.email),
      coordinator: cv(it, COL.coord),
      status: cv(it, COL.status),
      /* "מאיפה הגיע/ה" הוא הערוץ; "איך הגיע/ה?" הוא העקבות המלאות */
      source: cv(it, COL_EXTRA.src) || cv(it, COL.source),
      track: cv(it, COL_EXTRA.track),
      gender: cv(it, COL_EXTRA.gender),
      city: cv(it, COL_EXTRA.city),
      clickedAt: cv(it, COL_EXTRA.clicked),
    }))
    /* דיווח בלבד אינו משתתף — ראה STATUS.reportOnly */
    .filter(r => r.status !== STATUS.reportOnly)
    .filter(r => r.source !== PRE_PROGRAM_SOURCE)
    /* התאמה לפי שם פרטי מכווץ — "סיון" מול "סיוון", בדיוק כמו בתוויות */
    .filter(r => !want || heKey(r.coordinator.split(/\s+/)[0]) === want);
}

/**
 * מעדכן את עמודת הרכז/ת בלוח לפי טלפון. מחזיר true אם נמצאה שורה.
 *
 * ─── למה כיוון אחד ולא סנכרון דו-כיווני (נתי, 8.10) ─────────────────────────
 *
 * **שני צדדים שכותבים לאותו שדה ושניהם דוחפים זה לזה = לולאה**, ובלי
 * השתקת הד היא אינסופית. אבל הבעיה החמורה יותר אינה הלולאה אלא השאלה
 * **מי מנצח כששניהם השתנו** — ולשאלה הזאת אין תשובה בסנכרון דו-כיווני,
 * רק "מי כתב אחרון". לשדה "של מי האדם הזה" זה אומר שערך ישן יכול לגנוב
 * משתתף בשקט.
 *
 * לכן בעלות אחת: **הלוח מחזיק את השיוך**, והאפליקציה משקפת אותו. מסך
 * השיוך שלנו הוא **שלט רחוק ללוח** — הוא כותב לכאן, ה-webhook חוזר
 * וכותב ל-DB, וכך יש מסלול אחד ולא שניים.
 */
export async function mondaySetCoordinator(phone: string, coordinatorName: string | null): Promise<boolean | null> {
  const p = normPhone(phone);
  if (!p) return false;
  const data = await gql<{ boards: { items_page: { items: Item[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { items { id
       column_values(ids: ["${COL.phone}"]) { id text } } } } }`
  );
  if (!data) return null;
  const hit = (data.boards?.[0]?.items_page?.items ?? []).find(it => normPhone(cv(it, COL.phone)) === p);
  if (!hit) return false;

  const label = await resolveCoordLabel(coordinatorName);
  /* ריק מנקה; שם שאין לו תווית בלוח לא נכתב — עדיף ריק על תווית מומצאת */
  const ok = await gql(
    `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
    { b: BOARD, i: hit.id, v: JSON.stringify({ [COL.coord]: label ? { label } : {} }) }
  );
  return !!ok;
}

/**
 * כותב פרטים לשורה בלוח אינטק (16.10) — מסך הניהול הוא מקום העריכה היחיד.
 *
 * למי שעוד לא באפליקציה — **זה** העדכון (הלוח הבעלים). למי שכבר אימת
 * טלפון — זה **עותק** של מה שנשמר אצלנו. אותה פונקציה בשני המקרים, כדי
 * שהלוח ייראה אותו דבר לא משנה מי הבעלים.
 *
 * ⚠️ מגדר: רשימה סגורה בלוח (זכר/נקבה). "אחר" לא נכתב — עדיף שדה כמו
 * שהוא על תווית ש-create_labels_if_missing היה ממציא.
 * מחזיר true אם נכתב, false אם נכשל, null אם אין טוקן.
 */
export async function mondayWriteDetails(itemId: string, d: {
  name?: string; phone?: string; email?: string; gender?: string | null; city?: string;
}): Promise<boolean | null> {
  if (!process.env.MONDAY_TOKEN) return null;
  const vals: Record<string, unknown> = {};
  if (d.name !== undefined && d.name.trim()) vals.name = d.name.trim();
  if (d.phone !== undefined) vals[COL.phone] = normPhone(d.phone);
  if (d.email !== undefined) vals[COL.email] = d.email.trim();
  if (d.city !== undefined) vals[COL_EXTRA.city] = d.city.trim();
  const g = d.gender === "male" ? "זכר" : d.gender === "female" ? "נקבה" : null;
  if (g) vals[COL_EXTRA.gender] = { label: g };
  if (!Object.keys(vals).length) return true;
  const ok = await gql(
    `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
    { b: BOARD, i: itemId, v: JSON.stringify(vals) }
  );
  return !!ok;
}

/** שורה אחת בלוח לפי מזהה — לעריכה ולבדיקת הרשאה */
export async function mondayRow(itemId: string): Promise<BoardRow | null> {
  const rows = await mondayBoardAll();
  return rows?.find(r => r.id === itemId) ?? null;
}

/** כל השורות בלי סינוני התצוגה (דיווח בלבד / בוגרי אוגוסט) — לשימוש פנימי */
async function mondayBoardAll(): Promise<BoardRow[] | null> {
  const ids = [COL.phone, COL.email, COL.coord, COL.status, COL.source, COL_EXTRA.src, COL_EXTRA.track,
    COL_EXTRA.gender, COL_EXTRA.city, COL_EXTRA.clicked].map(c => `"${c}"`).join(", ");
  const data = await gql<{ boards: { items_page: { items: Item[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { items { id name
       column_values(ids: [${ids}]) { id text } } } } }`
  );
  if (!data) return null;
  return (data.boards?.[0]?.items_page?.items ?? []).map(it => ({
    id: it.id, name: it.name.trim(), phone: normPhone(cv(it, COL.phone)), email: cv(it, COL.email),
    coordinator: cv(it, COL.coord), status: cv(it, COL.status),
    source: cv(it, COL_EXTRA.src) || cv(it, COL.source), track: cv(it, COL_EXTRA.track),
    gender: cv(it, COL_EXTRA.gender), city: cv(it, COL_EXTRA.city), clickedAt: cv(it, COL_EXTRA.clicked),
  }));
}

export { mondayBoardAll };

/**
 * רכז/ת לשורה לפי מזהה השורה (16.10) — למי שאין לו עדיין טלפון בלוח,
 * ולכן mondaySetCoordinator (שמחפש לפי טלפון) לא מוצא אותו. התווית
 * מתורגמת מול הקיימות ולא ממציאים חדשה. null בשם ⇒ מנקה.
 */
export async function mondaySetCoordinatorById(itemId: string, coordinatorName: string | null): Promise<boolean | null> {
  if (!process.env.MONDAY_TOKEN) return null;
  const label = coordinatorName ? await resolveCoordLabel(coordinatorName) : null;
  if (coordinatorName && !label) return false;
  const ok = await gql(
    `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
    { b: BOARD, i: itemId, v: JSON.stringify({ [COL.coord]: label ? { label } : null }) }
  );
  return !!ok;
}
