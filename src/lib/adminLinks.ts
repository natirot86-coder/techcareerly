/**
 * src/lib/adminLinks.ts — "פתח במסך הרכזים" בכל שורה בלוח אינטק (נתי, 23.11).
 *
 * הרכז/ת עובד/ת מהלוח, והמידע על ההתקדמות במסך הרכזים. העמודה מחברת:
 * לחיצה פותחת ישר את הדף של אותו/ה משתתף/ת (`?p=<candidate id>`).
 *
 * - **רק מי שנרשם/ה ואימת/ה טלפון** — לפני ההרשמה אין למסך מה להציג.
 * - **ההתאמה לפי טלפון**, כמו כל חיבור אחר בין האפליקציה ללוח. כמה שורות
 *   עם אותו טלפון (כפילות) — כולן מקבלות את הקישור.
 * - **כותב רק כשהשתנה**, כדי לא לייצר אירועי webhook על כל ריצה.
 * - הקישור אינו מעניק גישה: מסך הרכזים דורש כניסה, ורכז/ת רואה רק את שלו/ה.
 *
 * רץ בבדיקת הבוקר וגם מיד אחרי הרשמה (ensure-board-row).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { normPhone } from "@/lib/monday";

export const COL_ADMIN_LINK = "link_mm9cwbwk";
const COL_PHONE = "text_mm7tmnqc";
const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const APP = "https://hasifaapp.vercel.app";

type Item = { id: string; name: string; column_values: { id: string; text: string | null; value: string | null }[] };

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[adminLinks]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

/** כל השורות, עמוד אחרי עמוד — null אם הלוח לא נקרא במלואו */
async function boardItems(): Promise<Item[] | null> {
  const sel = `cursor items { id name column_values(ids: ["${COL_PHONE}", "${COL_ADMIN_LINK}"]) { id text value } }`;
  const first = await gql<{ boards: { items_page: { cursor: string | null; items: Item[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { ${sel} } } }`);
  if (!first) return null;
  const out = [...first.boards[0].items_page.items];
  let cursor = first.boards[0].items_page.cursor;
  while (cursor) {
    const next = await gql<{ next_items_page: { cursor: string | null; items: Item[] } }>(
      `{ next_items_page(limit: 500, cursor: "${cursor}") { ${sel} } }`);
    if (!next) return null;
    out.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }
  return out;
}

export const adminUrlFor = (candidateId: string) => `${APP}/admin/coordinator?p=${candidateId}`;

export async function syncAdminLinks(db: SupabaseClient, opts: { dry: boolean; limit?: number; candidateId?: string }) {
  let q = db.from("candidates").select("id, first_name, phone")
    .eq("phone_verified", true).eq("is_test", false).not("phone", "is", null);
  if (opts.candidateId) q = q.eq("id", opts.candidateId);
  const { data: cands } = await q;
  const items = await boardItems();
  if (!items) return { skipped: "monday unavailable" };

  const byPhone = new Map<string, Item[]>();
  for (const it of items) {
    const p = normPhone(it.column_values.find(c => c.id === COL_PHONE)?.text);
    if (p) byPhone.set(p, [...(byPhone.get(p) ?? []), it]);
  }

  const todo: { item: string; firstName: string; url: string }[] = [];
  let matched = 0;
  for (const c of cands ?? []) {
    const rows = byPhone.get(normPhone(c.phone)) ?? [];
    if (rows.length) matched++;
    const url = adminUrlFor(String(c.id));
    for (const it of rows) {
      const raw = it.column_values.find(v => v.id === COL_ADMIN_LINK)?.value;
      let current = "";
      try { current = JSON.parse(raw ?? "null")?.url ?? ""; } catch { /* empty */ }
      if (current !== url) todo.push({ item: it.id, firstName: String(c.first_name ?? "").trim().split(/\s+/)[0], url });
    }
  }

  const out = { dry: opts.dry, verified: cands?.length ?? 0, matched, toWrite: todo.length,
    samples: todo.slice(0, 5).map(t => ({ item: t.item, firstName: t.firstName })), written: 0, failed: [] as string[] };
  if (opts.dry) return out;

  for (const t of todo.slice(0, opts.limit ?? todo.length)) {
    const ok = await gql(
      `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
      { b: BOARD, i: t.item, v: JSON.stringify({ [COL_ADMIN_LINK]: { url: t.url, text: "פתח במסך הרכזים" } }) });
    if (ok) out.written++; else out.failed.push(t.item);
  }
  return out;
}
