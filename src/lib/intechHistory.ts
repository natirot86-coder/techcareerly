/**
 * src/lib/intechHistory.ts — מתי דברים קרו בלוח אינטק (נתי, 29.10).
 *
 * הלוח זוכר רק את המצב של היום. הדשבורד צריך לדעת *מתי*: כמה שיחות היו
 * בנובמבר, כמה זמן חיכו לשיחה ראשונה, למי היה משויך מי ומתי. שני חלקים:
 *
 * 1. **קליטת יומן הפעילות** ל-`intech_status_log` (מיגרציה 020) — כל שינוי
 *    בסטטוס ובשיוך, עם התאריך. ⚠️ מאנדיי שומר את היומן 90 יום בלבד, ולכן
 *    הקליטה רצה כל בוקר: מה שלא נקלט עד אז אובד.
 *
 * 2. **חתימת "שיחה ראשונה" בלוח** — ברגע שהסטטוס יוצא מ"לפני שיחה ראשונה"
 *    (נשלח קישור / אין מענה / לא רלוונטי…) — זה הרגע שבו הרכז/ת דיבר/ה או
 *    ניסה/תה. בלי שום עבודה לרכזים: הם ממשיכים לסמן סטטוס כמו היום.
 *    ⚠️ **נחתם פעם אחת ולא נדרס** — חזרה ל"לפני שיחה ראשונה" ויציאה שנייה
 *    אינן שיחה ראשונה. התאריך הוא של היציאה *הראשונה* ביומן.
 *
 * ה-webhook חותם מיד (`stampFromWebhook`); הבדיקה היומית קולטת את היומן
 * ומשלימה כל מה שה-webhook פספס. **הבדיקה היא ההגנה, לא ה-webhook** —
 * אירוע ממאנדיי יכול להתפספס (11.10).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
export const COL_STATUS = "color_mm7t1s7a";
export const COL_COORD = "color_mm7t74m3";
export const COL_FIRST_CALL = "date_mm8kc890";
export const BEFORE_FIRST_CALL = "לפני שיחה ראשונה";

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[intechHistory]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** התאריך בישראל (YYYY-MM-DD) — שיחה ב-01:00 בלילה שייכת ליום שבו קרתה כאן */
export function ilDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d);
}

type LogRow = {
  id: string; item_id: number; column_id: string;
  from_value: string | null; to_value: string | null; changed_at: string; user_id: number | null;
};

/** קולט את יומן הפעילות של הסטטוס והשיוך מ-`fromIso` ועד עכשיו. אידמפוטנטי לפי מזהה האירוע */
export async function ingestActivity(fromIso: string): Promise<{ read: number; error?: string }> {
  const client = db();
  if (!client) return { read: 0, error: "no db" };
  const rows: LogRow[] = [];
  for (let page = 1; page <= 50; page++) {
    const d = await gql<{ boards: { activity_logs: { id: string; data: string; created_at: string; user_id: string }[] }[] }>(
      `{ boards(ids: ${BOARD}) { activity_logs(from: "${fromIso}", column_ids: ["${COL_STATUS}", "${COL_COORD}"], limit: 1000, page: ${page}) { id data created_at user_id } } }`);
    if (!d) return { read: rows.length, error: "monday unavailable" };
    const logs = d.boards[0]?.activity_logs ?? [];
    for (const e of logs) {
      let x: { pulse_id?: number; column_id?: string; value?: { label?: { text?: string } } | null; previous_value?: { label?: { text?: string } } | null };
      try { x = JSON.parse(e.data); } catch { continue; }
      if (!x.pulse_id || !x.column_id) continue;
      rows.push({
        id: e.id,
        item_id: x.pulse_id,
        column_id: x.column_id,
        from_value: x.previous_value?.label?.text ?? null,
        to_value: x.value?.label?.text ?? null,
        /* created_at של מאנדיי ביחידות של 100 ננו-שנייה */
        changed_at: new Date(Number(e.created_at) / 1e4).toISOString(),
        user_id: Number(e.user_id) || null,
      });
    }
    if (logs.length < 1000) break;
  }
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await client.from("intech_status_log").upsert(rows.slice(i, i + 500), { onConflict: "id", ignoreDuplicates: true });
    if (error) return { read: rows.length, error: error.message };
  }
  return { read: rows.length };
}

/** היציאה הראשונה מ"לפני שיחה ראשונה" של כל שורה, לפי ההיסטוריה שנקלטה */
async function firstExits(client: SupabaseClient): Promise<Map<string, Date>> {
  const out = new Map<string, Date>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from("intech_status_log")
      .select("item_id, to_value, changed_at")
      .eq("column_id", COL_STATUS).eq("from_value", BEFORE_FIRST_CALL)
      .order("changed_at", { ascending: true })
      .range(from, from + 999);
    if (error || !data?.length) break;
    for (const r of data) {
      if (!r.to_value || r.to_value === BEFORE_FIRST_CALL) continue;
      const k = String(r.item_id);
      if (!out.has(k)) out.set(k, new Date(r.changed_at));
    }
    if (data.length < 1000) break;
  }
  return out;
}

async function writeDate(itemId: string, date: string): Promise<boolean> {
  const r = await gql<{ change_multiple_column_values: { id: string } }>(
    `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
    { b: BOARD, i: itemId, v: JSON.stringify({ [COL_FIRST_CALL]: { date } }) });
  return Boolean(r?.change_multiple_column_values?.id);
}

/**
 * משלים "שיחה ראשונה" בכל שורה שיצאה מ"לפני שיחה ראשונה" ואין לה תאריך.
 * `dry` — מחזיר מה *היה* נכתב, בלי לכתוב. `limit` — לכתיבה הדרגתית (שורה
 * אחת קודם). ממשיך מאמצע מעצמו: שורה שכבר נחתמה לא נבחרת שוב.
 * ⚠️ שורה שאין לה יציאה ביומן (נוצרה עם סטטוס מוכן, או לפני 4.10) נשארת
 * ריקה בכוונה — תאריך מומצא היה מעוות את זמן ההמתנה.
 */
export async function stampFirstCalls(opts: { dry: boolean; limit?: number; since?: Date; skipItems?: Set<string> }) {
  const client = db();
  if (!client) return { error: "no db" };
  const exits = await firstExits(client);
  /* הבדיקה היומית משלימה רק יציאות אחרונות שה-webhook פספס (`since`).
     שחזור היסטורי הוא כתיבה גורפת ללוח — רץ רק במפורש, אחרי אישור */
  if (opts.since) for (const [k, at] of exits) if (at < opts.since) exits.delete(k);
  for (const k of opts.skipItems ?? []) exits.delete(k);
  const d = await gql<{ boards: { items_page: { cursor: string | null; items: { id: string; column_values: { id: string; text: string | null }[] }[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { cursor items { id column_values(ids: ["${COL_STATUS}", "${COL_FIRST_CALL}"]) { id text } } } } }`);
  const page = d?.boards[0]?.items_page;
  if (!page) return { error: "monday unavailable" };
  if (page.cursor) return { error: "board has more than 500 rows — paging not implemented" };

  const todo = page.items.flatMap(it => {
    const cv = (id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();
    if (cv(COL_STATUS) === BEFORE_FIRST_CALL || cv(COL_FIRST_CALL)) return [];
    const at = exits.get(it.id);
    return at ? [{ item: it.id, date: ilDate(at) }] : [];
  });
  if (opts.dry) return { dry: true, toWrite: todo.length, sample: todo.slice(0, 5) };

  const batch = opts.limit ? todo.slice(0, opts.limit) : todo;
  const written: string[] = [], failed: string[] = [];
  for (const t of batch) (await writeDate(t.item, t.date) ? written : failed).push(t.item);
  return { written: written.length, failed, remaining: todo.length - written.length };
}

/**
 * ה-webhook: הסטטוס השתנה. אם הוא יצא עכשיו מ"לפני שיחה ראשונה" ואין עדיין
 * תאריך — חותמים את היום. כל ספק (אין ערך קודם בגוף הבקשה, מאנדיי לא זמין)
 * ⇐ לא עושים כלום, והבדיקה היומית תשלים מהיומן.
 */
export async function stampFromWebhook(itemId: number, previousLabel: string | undefined, nowLabel: string | undefined) {
  if (previousLabel !== BEFORE_FIRST_CALL || !nowLabel || nowLabel === BEFORE_FIRST_CALL) return;
  const d = await gql<{ items: { column_values: { text: string | null }[] }[] }>(
    `{ items(ids: [${itemId}]) { column_values(ids: ["${COL_FIRST_CALL}"]) { text } } }`);
  const current = d?.items?.[0]?.column_values?.[0]?.text?.trim();
  if (d && !current) await writeDate(String(itemId), ilDate(new Date()));
}
