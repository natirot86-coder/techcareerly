/**
 * scripts/monday-mark-alumni.mjs — מצליב את לוח אינטק מול לוח הבוגרים
 * ומסמן "מסלול באפליקציה = בוגרים — תואר בלבד".
 *
 * ─── למה זה עדיף על ניחוש לפי מקור ───────────────────────────────────────────
 *
 * חיפשתי קודם את רשימת הבוגרים ומצאתי לוח עם חמש שורות, ולכן אמרתי שאין
 * ממה למלא. **טעיתי** — הלוח האמיתי הוא "לוח בוגרי טק-קריירה - נתי הצגה"
 * עם 1,845 שורות ו-1,533 טלפונים. זו רשימה סמכותית, ולא היקש מ"מאיפה הגיע".
 *
 * ⚠️ **ההתאמה לפי טלפון בלבד.** בלוח הבוגרים השמות כתובים אחרת מאשר ב-Cal
 * ("shay" מול "שי סבהט", "adir samuel" מול "אדיר סמואל"), והתאמה לפי שם
 * הייתה או מפספסת את כולם או מייצרת שיוך שגוי בשקט — וזה הדבר שאי אפשר
 * לתקן אחר כך.
 *
 * ⚠️ **לא דורס.** מי שכבר מסומן ידנית נשאר כפי שהוא, בשני הכיוונים: הרכזת
 * מכירה מקרים שהלוח לא יודע עליהם, וסקריפט שמתקן רכזת הוא סקריפט שמפסיקים
 * לסמוך עליו.
 *
 * ⚠️ **היעדר מהלוח אינו "לא בוגר".** הלוח מכסה את המחזורים שתועדו במאנדיי,
 * ולכן מי שאינו שם נשאר **ריק** ולא "קהל רחב" — ריק אומר "לא הוחלט", והרכזת
 * רואה מה ממתין לה.
 *
 * הרצה:  node scripts/monday-mark-alumni.mjs [--commit] [--names]
 *   --names משלים גם שם מלא בעברית למי שרשום בלוח אינטק באנגלית או בשם פרטי.
 */
import { readFileSync } from "node:fs";

const MT = readFileSync("C:/Users/user/.monday-token", "utf8").trim();
const GRADS = "18375356094";
const INTECH = "18433888639";
const COMMIT = process.argv.includes("--commit");
const FIX_NAMES = process.argv.includes("--names");

const COL = { phone: "text_mm7tmnqc", track: "color_mm7tahjd" };
const ALUMNI = "בוגרים — תואר בלבד";

const norm = (r) => { const d = String(r ?? "").replace(/\D/g, "");
  return !d ? "" : d.startsWith("972") ? d : d.startsWith("0") ? "972" + d.slice(1) : d; };
const tidy = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

async function mon(query, variables) {
  const r = await fetch("https://api.monday.com/v2", { method: "POST",
    headers: { Authorization: MT, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}
const cv = (it, id) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();

/* לוח הבוגרים גדול מדף אחד — דפדוף בעזרת cursor */
const byPhone = new Map();
let cursor = null, pages = 0;
do {
  const q = cursor
    ? `{ next_items_page(limit: 500, cursor: "${cursor}") { cursor items { name column_values(ids: ["phone_mm1fxks7"]) { id text } } } }`
    : `{ boards(ids: ${GRADS}) { items_page(limit: 500) { cursor items { name column_values(ids: ["phone_mm1fxks7"]) { id text } } } } }`;
  const d = await mon(q);
  const p = cursor ? d.next_items_page : d.boards[0].items_page;
  for (const it of p.items) {
    const ph = norm(cv(it, "phone_mm1fxks7"));
    if (ph) byPhone.set(ph, tidy(it.name));
  }
  cursor = p.cursor;
} while (cursor && ++pages < 10);
console.log(`לוח הבוגרים: ${byPhone.size} טלפונים`);

const items = (await mon(`{ boards(ids: ${INTECH}) { items_page(limit: 500)
  { items { id name column_values(ids: ["${COL.phone}","${COL.track}"]) { id text } } } } }`))
  .boards[0].items_page.items;

let marked = 0, renamed = 0, already = 0;
for (const it of items) {
  const grad = byPhone.get(norm(cv(it, COL.phone)));
  if (!grad) continue;
  const cur = cv(it, COL.track);
  if (cur) { already++; }
  else {
    console.log(`סימון  ${it.name.padEnd(18)} ↔ ${grad}`);
    marked++;
    if (COMMIT) await mon(`mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b,
      item_id: $i, column_values: $v) { id } }`,
      { b: INTECH, i: it.id, v: JSON.stringify({ [COL.track]: { label: ALUMNI } }) });
  }
  /* השם בלוח אינטק מגיע מטופס Cal — מה שהאדם הקליד על עצמו. בלוח הבוגרים
     הוא רשום כפי שהמכללה רשמה אותו, וזה השם שרכזת מחפשת לפיו. */
  if (FIX_NAMES && tidy(it.name) !== grad && (/^[A-Za-z]/.test(it.name) || it.name.trim().split(/\s+/).length === 1)) {
    console.log(`  שם   "${it.name}" → "${grad}"`);
    renamed++;
    if (COMMIT) await mon(`mutation ($b: ID!, $i: ID!, $n: String!) {
      change_simple_column_value(board_id: $b, item_id: $i, column_id: "name", value: $n) { id } }`,
      { b: INTECH, i: it.id, n: grad });
  }
}
console.log(`\nבוגרים שאותרו: ${marked + already} · סומנו עכשיו ${marked} · היו מסומנים ${already}` +
  (FIX_NAMES ? ` · שמות שהושלמו ${renamed}` : ""));
if (!COMMIT) console.log("ריצה יבשה. --commit כדי לכתוב.");
