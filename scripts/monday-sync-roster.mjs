/**
 * scripts/monday-sync-roster.mjs — עמודת "מסלול באפליקציה" במאנדיי ← alumni_roster.
 *
 * ─── מה זה סוגר ──────────────────────────────────────────────────────────────
 *
 * `alumni_roster` היא מה שקובע שבוגר/ת טק-קריירה יקבל/תקבל את המסע בן חמשת
 * השלבים ולא את המלא. עד היום היא נטענה בידיים (12 שורות, 4.10), כלומר
 * **הרכזת לא יכלה לצרף אדם לפיילוט בלי לבקש מקלוד**. עכשיו היא מסמנת
 * עמודה בלוח שהיא ממילא עובדת בו, והסקריפט הזה מתרגם.
 *
 * ⚠️ **הזהות קובעת ולא הקישור** (28.8). הקישור לאפליקציה יעבור בוואטסאפ
 * ותמיד ידלוף — ולכן מה שמחליט הוא הטלפון מול הרשימה הזאת, בדיוק כמו קודם.
 * העמודה החדשה מחליפה את מי שמזין את הרשימה, לא את מי שקובע לפיה.
 *
 * ⚠️ **ההסרה היא רק של מי שהסקריפט הזה הכניס.** מי שנוסף ידנית מסיבה אחרת
 * (למשל ייבוא פיילוט 40) נושא `note` אחר ולא נגרע — מחיקה אוטומטית של שורה
 * שמקור אחר אחראי עליה היא בדיוק הסוג שמגלים אחרי שבוע.
 *
 * הרצה:  node scripts/monday-sync-roster.mjs [--commit]
 */
import { readFileSync } from "node:fs";

const MT = readFileSync("C:/Users/user/.monday-token", "utf8").trim();
const ST = readFileSync("C:/Users/user/.supabase-claude-token", "utf8").trim();
const PROJECT = "mfepztmnkkhzkghxnxrt";
const BOARD = "18433888639";
const COMMIT = process.argv.includes("--commit");

const COL = { phone: "text_mm7tmnqc", track: "color_mm7tahjd", status: "color_mm7t1s7a" };
const ALUMNI_LABEL = "בוגרים — תואר בלבד";
const NOTE = "סומן על ידי הרכזת בלוח אינטק";

const norm = (r) => { const d = String(r ?? "").replace(/\D/g, "");
  return !d ? "" : d.startsWith("972") ? d : d.startsWith("0") ? "972" + d.slice(1) : d; };
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

async function mon(query) {
  const r = await fetch("https://api.monday.com/v2", { method: "POST",
    headers: { Authorization: MT, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}
async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${ST}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }) });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300));
  return j;
}
const cv = (it, id) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();

const items = (await mon(`{ boards(ids: ${BOARD}) { items_page(limit: 500)
  { items { name column_values(ids: ["${COL.phone}","${COL.track}","${COL.status}"]) { id text } } } } }`))
  .boards[0].items_page.items;

const marked = new Map();
const noPhone = [];
for (const it of items) {
  if (cv(it, COL.track) !== ALUMNI_LABEL) continue;
  const p = norm(cv(it, COL.phone));
  if (!p) { noPhone.push(it.name); continue; }
  marked.set(p, it.name.trim());
}

const current = await sql(`select phone, name, note from alumni_roster`);
const mine = new Set(current.filter(r => r.note === NOTE).map(r => r.phone));
const all = new Set(current.map(r => r.phone));

const add = [...marked.keys()].filter(p => !all.has(p));
const drop = [...mine].filter(p => !marked.has(p));

console.log(`בלוח מסומנים כבוגרים: ${marked.size} · ברשימה היום: ${all.size}`);
if (noPhone.length) console.log(`⚠️ מסומנים בלי טלפון (אי אפשר לשייך): ${noPhone.join(", ")}`);
console.log(`להוספה: ${add.length ? add.map(p => `${marked.get(p)} (${p})`).join(", ") : "אין"}`);
console.log(`להסרה: ${drop.length ? drop.join(", ") : "אין"}`);

if (!COMMIT) { console.log("\nריצה יבשה. --commit כדי לכתוב."); process.exit(0); }

if (add.length) {
  await sql(`insert into alumni_roster (phone, name, note) values ${
    add.map(p => `(${q(p)}, ${q(marked.get(p))}, ${q(NOTE)})`).join(", ")
  } on conflict (phone) do nothing`);
}
if (drop.length) {
  await sql(`delete from alumni_roster where note = ${q(NOTE)} and phone in (${drop.map(q).join(", ")})`);
}
/*
 * מי שכבר נכנס לאפליקציה ושויך — מסומן עכשיו ככזה שאינו בוגר. לא מחזירים
 * אותו ל-main אוטומטית: הורדת אדם מהפיילוט באמצע המסע משנה לו את מספר
 * השלבים על המסך, וזו החלטה של רכזת ולא של סקריפט סנכרון.
 */
if (drop.length) {
  const stuck = await sql(`select id, phone from candidates
    where cohort = 'alumni' and phone in (${drop.map(q).join(", ")})`);
  if (stuck.length) console.log(`⚠️ כבר במסע הבוגרים ולא שונו: ${stuck.map(r => r.phone).join(", ")}`);
}
console.log(`נוספו ${add.length} · הוסרו ${drop.length} · ברשימה עכשיו ${(await sql(`select count(*) n from alumni_roster`))[0].n}`);
