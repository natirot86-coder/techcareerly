/**
 * scripts/backfill-cal-bookings.mjs — מייבא הזמנות Cal שקדמו ל-webhook.
 *
 * ה-webhook תופס רק מכאן והלאה. לסיוון היו 27 הזמנות ביומן לפני שחובר,
 * וביניהן פגישות אמיתיות עם מועמדים — בלי ייבוא, מסך הרכזת מראה יומן ריק
 * בזמן שהיומן האמיתי מלא. זה בדיוק סוג המסך שאי אפשר לסמוך עליו.
 *
 * ⚠️ **אידמפוטנטי**: הזמנה שכבר קיימת (אותו `uid` ב-raw) לא תיכנס פעמיים.
 *
 * ⚠️ עובד מול **Management API** ולא מול supabase-js, כי `vercel env pull`
 * מחזיר מפתחות רגישים כמחרוזת ריקה — `SUPABASE_SECRET_KEY=""`. הטוקן
 * של ה-Management יושב מקומית מחוץ לריפו.
 *
 * הרצה:
 *   node scripts/backfill-cal-bookings.mjs <CAL_API_KEY> [--commit]
 * בלי --commit זו ריצה יבשה שמראה מה ייכנס ולא נוגעת בכלום.
 */
import { readFileSync } from "node:fs";

const KEY = process.argv[2];
const COMMIT = process.argv.includes("--commit");
if (!KEY) { console.error("שימוש: node scripts/backfill-cal-bookings.mjs <CAL_API_KEY> [--commit]"); process.exit(1); }

const PROJECT = "mfepztmnkkhzkghxnxrt";
const TOKEN = readFileSync("C:/Users/user/.supabase-claude-token", "utf8").trim();

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300));
  return j;
}

/** אותו נרמול בדיוק כמו ב-webhook — אחרת ההתאמה למועמד לא תעבוד */
function normPhone(raw) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("972") ? d
    : d.startsWith("0") ? "972" + d.slice(1)
    : d.length === 9 ? "972" + d : d;
}

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);

const res = await fetch("https://api.cal.com/v2/bookings?take=100", {
  headers: { Authorization: `Bearer ${KEY}`, "cal-api-version": "2024-08-13" },
});
const { data: bookings = [] } = await res.json();
console.log(`נמצאו ${bookings.length} הזמנות ב-Cal\n`);

const [coords, cands, existing] = await Promise.all([
  sql("select id, lower(coalesce(email,'')) email from coordinators;"),
  sql("select id, phone from candidates where coalesce(phone,'') <> '';"),
  sql("select raw->>'uid' uid from cal_bookings where raw ? 'uid';"),
]);

const coordByEmail = new Map(coords.map(c => [c.email, c.id]));
const candByPhone = new Map(cands.map(c => [c.phone, c.id]));
const seen = new Set(existing.map(r => r.uid).filter(Boolean));

const rows = [];
let skipped = 0;

for (const b of bookings) {
  if (seen.has(b.uid)) { skipped++; continue; }
  const host = (b.hosts ?? [])[0] ?? {};
  const at = (b.attendees ?? [])[0] ?? {};
  const phone = normPhone(at.phoneNumber);
  const organizer = String(host.email ?? "").toLowerCase();
  rows.push({
    /* מסומן כייבוא ולא כ-BOOKING_CREATED, כדי שתמיד אפשר יהיה להבדיל */
    trigger: b.status === "cancelled" ? "BOOKING_CANCELLED" : "BACKFILL",
    title: b.eventType?.title ?? b.title ?? "",
    start_time: b.start ?? null,
    attendee_name: at.name ?? "",
    attendee_email: at.email ?? "",
    attendee_phone: phone,
    organizer_email: organizer,
    coordinator_id: coordByEmail.get(organizer) ?? null,
    candidate_id: phone ? (candByPhone.get(phone) ?? null) : null,
    uid: b.uid,
    status: b.status,
  });
}

console.log(`חדשות להכנסה : ${rows.length}`);
console.log(`כבר קיימות    : ${skipped}`);
console.log(`זוהתה רכזת    : ${rows.filter(r => r.coordinator_id).length}`);
console.log(`הותאם מועמד   : ${rows.filter(r => r.candidate_id).length}  ← לפי טלפון בלבד`);
console.log(`בלי טלפון     : ${rows.filter(r => !r.attendee_phone).length}\n`);

for (const r of rows) {
  const when = r.start_time ? r.start_time.slice(0, 16).replace("T", " ") : "—";
  console.log(` ${when} | ${(r.attendee_name || "—").padEnd(18)} | ${(r.attendee_phone || "ללא טלפון").padEnd(13)} | ${r.candidate_id ? "מותאם" : "—"} | ${r.status}`);
}

if (!rows.length) { console.log("\nאין מה להכניס."); process.exit(0); }
if (!COMMIT) { console.log("\nריצה יבשה. להוסיף --commit כדי לכתוב."); process.exit(0); }

const values = rows.map(r => `(${[
  q(r.trigger), q(r.title), r.start_time ? q(r.start_time) : "null",
  q(r.attendee_name), q(r.attendee_email), q(r.attendee_phone),
  q(r.organizer_email), r.coordinator_id ? q(r.coordinator_id) : "null",
  r.candidate_id ? q(r.candidate_id) : "null",
  q(JSON.stringify({ uid: r.uid, status: r.status, backfilledAt: new Date().toISOString() })) + "::jsonb",
].join(", ")})`).join(",\n");

await sql(`insert into cal_bookings
  (trigger, title, start_time, attendee_name, attendee_email, attendee_phone,
   organizer_email, coordinator_id, candidate_id, raw)
values\n${values};`);

console.log(`\n✅ הוכנסו ${rows.length} הזמנות.`);
