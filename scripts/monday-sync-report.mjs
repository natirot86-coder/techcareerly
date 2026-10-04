/**
 * scripts/monday-sync-report.mjs — משווה את לוח המועמדים הראשי ללוח אינטק.
 *
 * המודל שסוכם (נתי 4.10): **הלוח הראשי הוא שער כניסה, לוח אינטק הוא הבעלות,
 * והאפליקציה היא ההתקדמות.** אין עריכה מקבילה — יש העברת בעלות, ולכן אין
 * כאן "שתי אמיתות". מה שכן יכול לקרות הוא שעדכון טלפוני ייכנס לאינטק ולא
 * יחזור לראשי, והסריקה הזאת היא מה שהופך את זה מ"מדי פעם" ל"כל יום ראשון".
 *
 * ⚠️ **הסקריפט לא מתקן כלום.** הוא רק מראה, ונתי מכריע — כי תיקון אוטומטי
 * של פרטי אדם בין שני מקורות הוא בדיוק מה שאסור לעשות בשקט.
 *
 * ⚠️ **טלפון הוא היחיד שמסומן דחוף.** הוא המפתח שמחבר מאנדיי ל-Cal
 * ולאפליקציה; אם הוא משתנה בצד אחד בלבד, החיבור **נשבר** ולא רק מתיישן.
 * שאר ההפרשים הם רשימה רגילה.
 *
 * הרצה:  node scripts/monday-sync-report.mjs [--html <path>]
 */
import { readFileSync, writeFileSync } from "node:fs";

const T = readFileSync("C:/Users/user/.monday-token", "utf8").trim();
const MAIN = "18396761860";   // לוח מועמדים ראשי
const INTECH = "18433888639"; // לוח אינטק החדשה הראשי

/* "החלטה סופית" — האינדקס של התווית "חשיפה" */
const DECISION_COL = "color_mm4ms1kq";
const DECISION_EXPOSURE = 2;

const M = { phone: "phone_mm46se7z", phoneText: "text_mkyqhj10", email: "text_mkyq3a1",
            first: "text_mkywv4ea", last: "text_mkyqqaf9", coord: "color_mm7t9gvx" };
const I = { phone: "text_mm7tmnqc", email: "text_mm7tase7", coord: "color_mm7t74m3",
            status: "color_mm7t1s7a", source: "text_mm7t5f8a" };

const norm = (raw) => {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("972") ? d : d.startsWith("0") ? "972" + d.slice(1) : d;
};

async function gql(query) {
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: T, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 400));
  return j.data;
}

const cv = (it, id) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();

/* שמות עמודות כמחרוזות GraphQL — בלי בריחה כפולה, שהיא מה ששברה את השאילתה */
const cols = (o) => Object.values(o).map(c => JSON.stringify(c)).join(", ");

const mainData = await gql(`{ boards(ids: ${MAIN}) { items_page(limit: 300,
  query_params: {rules: [{column_id: "${DECISION_COL}", compare_value: [${DECISION_EXPOSURE}], operator: any_of}]})
  { items { id name column_values(ids: [${cols(M)}]) { id text } } } } }`);

const intechData = await gql(`{ boards(ids: ${INTECH}) { items_page(limit: 300)
  { items { id name column_values(ids: [${cols(I)}]) { id text } } } } }`);

const mainItems = mainData.boards[0].items_page.items;
const intechItems = intechData.boards[0].items_page.items;

const mainBy = new Map();
for (const it of mainItems) {
  const p = norm(cv(it, M.phone) || cv(it, M.phoneText));
  if (p) mainBy.set(p, it);
}
const intechBy = new Map();
for (const it of intechItems) {
  const p = norm(cv(it, I.phone));
  if (p) intechBy.set(p, it);
}

const urgent = [];
const missingInIntech = [];
const missingInMain = [];
const diffs = [];

/* ── דחוף: אותו אדם, טלפון שונה ──────────────────────────────────────────
   מזוהה לפי מייל, כי אם הטלפון הוא זה שהשתנה אי אפשר להשוות לפיו. */
const mainByEmail = new Map(mainItems.map(it => [cv(it, M.email).toLowerCase(), it]).filter(([e]) => e));
for (const it of intechItems) {
  const em = cv(it, I.email).toLowerCase();
  if (!em) continue;
  const m = mainByEmail.get(em);
  if (!m) continue;
  const pi = norm(cv(it, I.phone));
  const pm = norm(cv(m, M.phone) || cv(m, M.phoneText));
  if (pi && pm && pi !== pm) urgent.push({ name: it.name, email: em, intech: pi, main: pm });
}

for (const [p, it] of intechBy) if (!mainBy.has(p)) missingInMain.push({ name: it.name, phone: p, status: cv(it, I.status), source: cv(it, I.source) });
for (const [p, it] of mainBy) if (!intechBy.has(p)) missingInIntech.push({ name: it.name, phone: p, coord: cv(it, M.coord) });

/* ── הפרשים רגילים: שם או מייל ─────────────────────────────────────────── */
for (const [p, it] of intechBy) {
  const m = mainBy.get(p);
  if (!m) continue;
  const mName = [cv(m, M.first), cv(m, M.last)].filter(Boolean).join(" ") || m.name;
  if (mName && it.name && mName !== it.name) diffs.push({ field: "שם", phone: p, intech: it.name, main: mName });
  const ei = cv(it, I.email).toLowerCase(), em = cv(m, M.email).toLowerCase();
  if (ei && em && ei !== em) diffs.push({ field: "מייל", phone: p, intech: ei, main: em });
}

const L = [];
L.push(`סריקת סנכרון — לוח ראשי מול לוח אינטק`);
L.push(`ראשי (החלטה סופית = חשיפה): ${mainItems.length} · אינטק: ${intechItems.length}`);
L.push("");
L.push(`🚨 דחוף — טלפון שונה בין הלוחות: ${urgent.length}`);
urgent.forEach(u => L.push(`   ${u.name} · אינטק ${u.intech} · ראשי ${u.main}`));
L.push("");
L.push(`באינטק ולא בראשי: ${missingInMain.length}`);
missingInMain.forEach(x => L.push(`   ${x.name} · ${x.phone} · ${x.status || "ללא סטטוס"}${x.source ? " · " + x.source : ""}`));
L.push("");
L.push(`בראשי (חשיפה) ולא באינטק: ${missingInIntech.length}`);
missingInIntech.forEach(x => L.push(`   ${x.name} · ${x.phone} · רכז/ת: ${x.coord || "(ריק)"}`));
L.push("");
L.push(`הפרשי שם/מייל: ${diffs.length}`);
diffs.forEach(d => L.push(`   ${d.field} · ${d.phone} · אינטק "${d.intech}" · ראשי "${d.main}"`));

console.log(L.join("\n"));

const htmlPath = process.argv[process.argv.indexOf("--html") + 1];
if (process.argv.includes("--html") && htmlPath) {
  const esc = (s) => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const sec = (title, rows, urgentStyle) => `
    <h2${urgentStyle ? ' class="u"' : ""}>${esc(title)} <span class="n">${rows.length}</span></h2>
    ${rows.length ? `<ul>${rows.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : `<p class="ok">אין</p>`}`;
  writeFileSync(htmlPath, `<title>סריקת סנכרון מאנדיי</title>
<style>
 body{direction:rtl;font-family:Heebo,Assistant,system-ui,sans-serif;background:#fbf9f5;color:#1c1a16;
      max-width:46rem;margin:0 auto;padding:2rem 1.2rem;line-height:1.7}
 h1{font-size:1.5rem;color:#023e8a} h2{font-size:1.05rem;color:#023e8a;margin-top:1.8rem}
 h2.u{color:#a33} .n{background:rgba(2,62,138,.1);border-radius:999px;padding:.1rem .6rem;font-size:.8rem}
 h2.u .n{background:#fdecea;color:#a33} ul{padding-inline-start:1.1rem} li{margin-bottom:.35rem;font-size:.95rem}
 .ok{color:#0f7a52;font-weight:700} .meta{color:#5f6672;font-size:.9rem}
</style>
<h1>סריקת סנכרון — ראשי מול אינטק</h1>
<p class="meta">ראשי (החלטה סופית = חשיפה): ${mainItems.length} · אינטק: ${intechItems.length}</p>
<p class="meta">הסריקה <b>לא מתקנת כלום</b> — רק מראה. טלפון הוא היחיד שמסומן דחוף, כי הוא המפתח שמחבר מאנדיי, Cal והאפליקציה.</p>
${sec("🚨 דחוף — טלפון שונה בין הלוחות", urgent.map(u => `${u.name} · אינטק ${u.intech} · ראשי ${u.main}`), true)}
${sec("באינטק ולא בראשי", missingInMain.map(x => `${x.name} · ${x.phone} · ${x.status || "ללא סטטוס"}${x.source ? " · " + x.source : ""}`))}
${sec("בראשי (חשיפה) ולא באינטק", missingInIntech.map(x => `${x.name} · ${x.phone} · רכז/ת: ${x.coord || "(ריק)"}`))}
${sec("הפרשי שם או מייל", diffs.map(d => `${d.field} · ${d.phone} · אינטק "${d.intech}" · ראשי "${d.main}"`))}
`, "utf8");
  console.log(`\nדוח HTML נכתב ל-${htmlPath}`);
}
