/**
 * GET /api/cron/reconcile-main — רשת ביטחון יומית ללוח הראשי → לוח אינטק.
 *
 * ─── למה זה קיים (11.10) ─────────────────────────────────────────────────────
 *
 * שישה אנשים מהטופס של 6.10 קיבלו "החלטה סופית = חשיפה" ולא נוצרה להם שורה
 * באינטק. אף אחד לא קיבל הודעה, ואף שגיאה לא נרשמה — הם פשוט לא היו.
 * הסיבה הסבירה: השורה נולדה מהטופס כשההחלטה כבר מלאה, ומאנדיי לא שולח
 * אירוע *שינוי* על ערך שנולד ככה. נוסף webhook על יצירת שורה — אבל את
 * הסיבה לא הוכחנו, ולכן **ה-webhook הוא המסלול המהיר וזו ההגנה**: היא לא
 * צריכה לדעת למה אירוע התפספס, רק להשוות את שני הלוחות.
 *
 * ⚠️ **אותה פונקציה בדיוק כמו ה-webhook** (`promoteFromMain`) — כולל בדיקת
 * הכפילות לפי טלפון/מייל. שני מסלולים שיוצרים שורה היו שתי דרכים ליצור
 * אותו אדם פעמיים.
 *
 * ⚠️ **רק יוצרת, לעולם לא מוחקת ולא מעדכנת** — אותו כלל כמו ה-webhook.
 */
import { NextRequest, NextResponse } from "next/server";
import { promoteFromMain } from "@/app/api/monday-webhook/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAIN_BOARD = process.env.MONDAY_MAIN_BOARD ?? "18396761860";
const INTECH_BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const MAIN = { decision: "color_mm4ms1kq", phone: "phone_mm46se7z", phoneText: "text_mkyqhj10", email: "text_mkyq3a1" };
const INTECH = { phone: "text_mm7tmnqc", email: "text_mm7tase7" };

type Item = { id: string; name: string; column_values: { id: string; text: string | null }[] };

async function gql<T>(query: string): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[reconcile-main]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

/** הלוח הראשי גדל מעבר ל-500 — חייבים לעבור עמוד אחרי עמוד */
async function allItems(board: string, cols: string[]): Promise<Item[] | null> {
  const ids = cols.map(c => `"${c}"`).join(", ");
  const sel = `cursor items { id name column_values(ids: [${ids}]) { id text } }`;
  const first = await gql<{ boards: { items_page: { cursor: string | null; items: Item[] } }[] }>(
    `{ boards(ids: ${board}) { items_page(limit: 500) { ${sel} } } }`);
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

const norm = (raw: unknown) => {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("972")) return d;
  if (d.startsWith("0")) return "972" + d.slice(1);
  return d.length === 9 ? "972" + d : d;
};

export async function GET(req: NextRequest) {
  /* Vercel Cron שולח את CRON_SECRET כ-Bearer. בלי הסוד — אין ריצה */
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [main, intech] = await Promise.all([
    allItems(MAIN_BOARD, Object.values(MAIN)),
    allItems(INTECH_BOARD, Object.values(INTECH)),
  ]);
  if (!main || !intech) return NextResponse.json({ ok: false, error: "monday unavailable" }, { status: 502 });

  const cv = (it: Item, id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();
  const phones = new Set(intech.map(i => norm(cv(i, INTECH.phone))).filter(Boolean));
  const emails = new Set(intech.map(i => cv(i, INTECH.email).toLowerCase()).filter(Boolean));

  const missing = main.filter(i => {
    if (cv(i, MAIN.decision) !== "חשיפה") return false;
    const p = norm(cv(i, MAIN.phone) || cv(i, MAIN.phoneText));
    const e = cv(i, MAIN.email).toLowerCase();
    return !(p && phones.has(p)) && !(e && emails.has(e));
  });

  const created: string[] = [];
  const skipped: { name: string; why: string }[] = [];
  for (const m of missing) {
    const res = await (await promoteFromMain(Number(m.id))).json();
    if (res.created) created.push(res.name);
    else skipped.push({ name: m.name, why: res.skipped ?? "failed" });
  }
  if (created.length) console.log(`[reconcile-main] נוצרו ${created.length}: ${created.join(", ")}`);
  /*
    מי שאין לו טלפון ולא מייל לא ייווצר לעולם — אי אפשר לבדוק כפילות בלי
    מזהה. הוא נשאר ברשימה הזאת כל יום, וזה בכוונה: מישהו צריך להשלים לו פרטים.
  */
  return NextResponse.json({ ok: true, checked: main.length, created, skipped });
}
