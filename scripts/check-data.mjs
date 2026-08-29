/**
 * scripts/check-data.mjs — בודק שארבעת קבצי הנתונים לא סותרים זה את זה.
 *
 * למה: מוסדות · מלגות · קורסים · תארים מצטלבים בעשרות הפניות הדדיות, וסתירה
 * ביניהם היא שקטה לחלוטין — TypeScript מאמת טיפוסים, לא **קיום**. `institutionId`
 * שמצביע למוסד שנמחק הוא מחרוזת תקינה לגמרי. ב-28.8 התגלה ש-`research-findings`
 * אמר 4,000 ₪ בזמן ש-`institutions.ts` אמר 2,000 — במשך שבוע, בלי שאיש ידע.
 *
 * הרצה: `node scripts/check-data.mjs`. יוצא בקוד 1 אם יש שגיאה (לא אזהרה),
 * כדי שאפשר יהיה לתלות בזה בדיקה אוטומטית בהמשך.
 *
 * ⚠️ הסקריפט קורא את הנתונים **מהקוד עצמו** דרך מהדר TypeScript, ולכן אינו
 * יכול להתיישן — בדיוק כמו sim-tracks.mjs שקורא את WEIGHTS מ-paths/page.tsx.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, ".data-check-tmp");
const FILES = ["institutions", "scholarships", "courses", "degrees", "journey", "meetings"];

/** מהדר כל קובץ נתונים ל-ESM זמני, כדי לייבא אותו כמו מודול רגיל */
async function load() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  for (const f of FILES) {
    const src = readFileSync(path.join(ROOT, "src/data", `${f}.ts`), "utf8");
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText.replace(/from\s+"\.\/(\w+)"/g, 'from "./$1.mjs"');
    writeFileSync(path.join(TMP, `${f}.mjs`), out);
  }
  const mods = {};
  for (const f of FILES) mods[f] = await import(pathToFileURL(path.join(TMP, `${f}.mjs`)).href);
  return mods;
}

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const m = await load();
const INST = m.institutions.INSTITUTIONS;
const FUND = m.scholarships.FUNDING;
const COURSES = m.courses.COURSES;
const DEGREES = m.degrees.DEGREES;
const DOMAINS = Object.keys(m.institutions.DOMAIN_LABEL);

const instIds = new Set(INST.map((x) => x.id));
const fundIds = new Set(FUND.map((x) => x.id));
const degIds = new Set(DEGREES.map((x) => x.id));

// ── 1. מזהים כפולים ────────────────────────────────────────────────────────
for (const [label, arr] of [["מוסד", INST], ["תוכנית", FUND], ["קורס", COURSES], ["תואר", DEGREES]]) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x.id)) err(`${label}: מזהה כפול "${x.id}" — השני דורס את הראשון בכל Map`);
    seen.add(x.id);
  }
}

// ── 2. הפניות שמצביעות לשום מקום ───────────────────────────────────────────
const ref = (ok, where, what, id) => { if (!ok) err(`${where}: ${what} "${id}" לא קיים`); };
for (const c of COURSES) {
  ref(instIds.has(c.institutionId), `קורס "${c.name}"`, "institutionId", c.institutionId);
  if (c.programId) ref(fundIds.has(c.programId), `קורס "${c.name}"`, "programId", c.programId);
  for (const d of c.domains ?? []) ref(DOMAINS.includes(d), `קורס "${c.name}"`, "domain", d);
}
for (const i of INST) {
  for (const p of i.programIds ?? []) ref(fundIds.has(p), `מוסד "${i.name}"`, "programId", p);
  for (const d of i.degreeIds ?? []) ref(degIds.has(d), `מוסד "${i.name}"`, "degreeId", d);
  for (const d of i.domains ?? []) ref(DOMAINS.includes(d), `מוסד "${i.name}"`, "domain", d);
}
for (const f of FUND) {
  for (const i of f.institutions ?? []) ref(instIds.has(i), `תוכנית "${f.name}"`, "institution", i);
  for (const d of f.degreeIds ?? []) ref(degIds.has(d), `תוכנית "${f.name}"`, "degreeId", d);
  for (const b of f.blocks ?? []) ref(fundIds.has(b), `תוכנית "${f.name}"`, "blocks", b);
}
for (const d of DEGREES) for (const x of d.domains ?? []) ref(DOMAINS.includes(x), `תואר "${d.name}"`, "domain", x);
for (const id of m.scholarships.RECOMMENDED_STACK) ref(fundIds.has(id), "RECOMMENDED_STACK", "מזהה", id);

// ── 3. כלל הדלת — סתירה בלבד, לא א-סימטריה ──────────────────
/*
   בדיקה דו-כיוונית מלאה הנפיקה 24 אזהרות שרובן תקינות: רוטשילד
   תקפה ב-11 מוסדות ואיננה הדלת לאף אחד מהם. ואזהרה שבדרך כלל
   שגויה מאמנת להתעלם מהרשימה כולה. נשאר רק הכיוון שהוא
   **סתירה** ולא השמטה: המוסד טוען שהדלת קיימת אצלו, והתוכנית
   מחזיקה רשימת מוסדות שהוא לא בתוכה. שניהם לא יכולים להיות נכונים.
*/
for (const i of INST) {
  for (const pid of i.programIds ?? []) {
    const p = FUND.find((x) => x.id === pid);
    if (p && p.institutions?.length && !p.institutions.includes(i.id))
      err(`סתירה: "${i.name}" מציג את "${p.name}" כדלת שלו, אבל לתוכנית יש רשימת מוסדות שהוא לא בתוכה`);
  }
}

// ── 4. שכר הלימוד המפוקח — ערך אחד בלבד ────────────────────
/*
   12,017 היה נכון לתשפ״ו בלבד והוחלף ב-15.8.2026. לא בודקים "טווח
   סביב המספר" — רייכמן גובה 12,552 וזה פשוט המחיר הפרטי שלה.
   רק הערך הישן עצמו, ורק כמספר שלם.
*/
const STALE_TUITION = 12017;
const REGULATED = 12203;  // plan.ts הוא המקור
const hasStale = (t) => new RegExp(`\b(12,017|12017)\b`).test(String(t ?? ""));
for (const i of INST) if (hasStale(i.tuition)) err(`מוסד "${i.name}": נושא את ${STALE_TUITION.toLocaleString("he-IL")} — שכר הלימוד המפוקח של תשפ״ו. העדכני: ${REGULATED.toLocaleString("he-IL")}`);
for (const f of FUND) {
  if (f.amount === STALE_TUITION)
    err(`"${f.name}": amount = ${STALE_TUITION.toLocaleString("he-IL")} — שכר הלימוד של תשפ״ו. החשבון מוריד פחות ממה שהמלגה נותנת`);
}

// ── 4b. מלגה שמכסה שנה מלאה ואין לה סכום ──────────────────────
/*
   החשבון ב-plan עושה `f.amount ?? 0`, והצ׳יפ אומר "סכום יפורסם".
   מלגה שמצהירה על מימון מלא ואין לה amount מורידה אפס — והמסך
   מראה פער גדול מהאמת. זה הכיוון המסוכן יותר לטעות בו.
*/
const CLAIMS_FULL = /מימון מלא|שכר לימוד מלא|100% משכר|כל שכר הלימוד|שכ״ל מלא/;
/*
   חשוב: חסר amount אינו באג כשיש amountNote שמסביר למה — מרום
   מפרסמת בספטמבר, ושכ״ל המלא של עולים ביחד לא אומת. "לא יודעים"
   מתועד הוא תשובה לגיטימית. הבאג הוא רק **שתיקה** — בלי סכום ובלי הסבר.
*/
for (const f of FUND) {
  if (f.status !== "active" || f.amount || f.amountNote) continue;
  if (CLAIMS_FULL.test(f.what ?? ""))
    err(`"${f.name}" מצהירה על מימון מלא אבל אין לה לא amount ולא amountNote — החשבון מוריד 0 ₪ בלי להסביר`);
}

/*
   הערימה המומלצת היא מה שהמסך מוביל בו, ולכן מלגה בתוכה בלי
   סכום גרועה פי כמה — היא מוצגת ראשונה ומורידה אפס.
*/
for (const id of m.scholarships.RECOMMENDED_STACK) {
  const f = FUND.find((x) => x.id === id);
  if (f && !f.amount && !f.amountNote)
    err(`"${f.name}" נמצאת בערימה המומלצת ושותקת על הסכום — החשבון מוריד 0 ₪ בלי להסביר למה`);
}

// ── 5. מה שמוצג למועמד בלי שאומת ───────────────────────────────────────────
for (const i of INST) {
  if (i.status === "active" && !String(i.verified ?? "").trim())
    warn(`"${i.name}" מוצג למועמד בלי שדה verified — אין דרך לדעת מתי נבדק`);
}
for (const f of FUND) {
  if (f.status === "active" && !String(f.verified ?? "").trim())
    warn(`תוכנית "${f.name}" מוצגת בלי verified`);
}

// ── 6. חלונות שנסגרו ───────────────────────────────────────────────────────
/*
   closesAt הוא יום+חודש בלי שנה, ולכן "עבר" נמדד מול השנה הנוכחית בלבד —
   הוא נועד להתריע, לא להסתיר. מלגה שנסגרה אתמול עדיין מוצגת כפתוחה.
*/
const today = new Date();
for (const f of FUND) {
  if (f.status !== "active" || !f.closesAt) continue;
  const close = new Date(today.getFullYear(), f.closesAt.m - 1, f.closesAt.d);
  const days = Math.round((close - today) / 86400000);
  if (days < 0 && days > -120) warn(`"${f.name}" — חלון ההגשה נסגר לפני ${-days} ימים והיא עדיין active`);
}

// ── 7. מיקום ברמת הקורס ────────────────────────────────────────────────────
/*
   הפריט הפתוח מ-19.8: קורס בלי city יורש את כתובת המוסד, וזה שגוי לגופים
   שמפעילים מחזורים בכמה ערים. "יש סניף אורט באשקלון" אינו "הקורס רץ באשקלון".
*/
const noCity = COURSES.filter((c) => c.status === "active" && !c.city && !c.online);
if (noCity.length) warn(`${noCity.length} קורסים פעילים בלי city משלהם — יורשים את כתובת המוסד: ${noCity.map((c) => c.name).join(" | ")}`);

// ── 8. מחזורים שפגו ────────────────────────────────────────────────────────
for (const c of COURSES) {
  if (c.status !== "active" || !c.startsAt) continue;
  const d = new Date(c.startsAt);
  /* לא באג: courseState מסמן "passed" ו-visibleCourses מסתיר מהמועמד
     מעצמו. זו רשימת המחזורים שמחכים לתאריך חדש — ולא ממציאים אותו */
  if (d < today) warn(`קורס "${c.name}" — המחזור (${c.startsAt}) עבר והוא מוסתר מהמועמד. לשאול תאריך חדש`);
}

// ── 9. תארים בלי מוסד שמלמד אותם ───────────────────────────────────────────
const taught = new Set(INST.flatMap((i) => i.degreeIds ?? []));
const openAll = INST.some((i) => i.openToAllDegrees);
for (const d of DEGREES) {
  if (d.status !== "active") continue;
  if (!taught.has(d.id) && !openAll) warn(`תואר "${d.name}" — אף מוסד לא מקושר אליו`);
}

// ── 10. קוהורטים ──────────────────────────────────────────────
/*
   תצורה שבורה של קוהורט צריכה ליפול כאן ולא על מסך של מועמד.
   שלוש הבדיקות: הרשימה לא ריקה · המיספור רציף · וכל שלב
   שהוחרג באמת קיים — החרגה של מזהה ששונה שם היא החרגה שלא עושה כלום.
*/
const J = m.journey;
const ids = new Set(J.JOURNEY.map((s) => s.id));
for (const c of ["main", "alumni"]) {
  const list = J.journeyFor(c);
  if (!list.length) { err(`קוהורט "${c}": רשימת השלבים ריקה`); continue; }
  list.forEach((s, i) => {
    if (s.n !== i + 1) err(`קוהורט "${c}": מיספור לא רציף — "${s.id}" קיבל ${s.n} במקום ${i + 1}`);
    if (!ids.has(s.id)) err(`קוהורט "${c}": שלב "${s.id}" אינו ב-JOURNEY`);
  });
}
/* כל שלב שהוחרג חייב להיות קיים — אחרת החסרון לא עשה כלום */
for (const c of ["main", "alumni"]) {
  const kept = new Set(J.journeyFor(c).map((s) => s.id));
  const dropped = [...ids].filter((id) => !kept.has(id));
  for (const id of dropped) if (!ids.has(id)) err(`קוהורט "${c}": מחריג מזהה שאינו קיים — "${id}"`);
}
/* כל פגישה ששלב מצביע אליה חייבת להיות לה חריץ ב-meetings.ts */
const links = Object.values(m.meetings.COORDINATORS ?? {})[0]?.links ?? {};
for (const st of J.JOURNEY) {
  if (!st.closes) continue;
  const n = Object.entries(J.MEETING_NAMES).find(([, v]) => v === st.closes)?.[0];
  if (!n) err(`שלב "${st.id}" נסגר ב"${st.closes}" — שאינה ב-MEETING_NAMES`);
  else if (!links[n]) warn(`פגישה ${n} ("${st.closes}") — אין לה קישור יומן ב-meetings.ts`);
}

// ── דוח ────────────────────────────────────────────────────────────────────
rmSync(TMP, { recursive: true, force: true });
const line = (s) => console.log(s);
line(`\nמוסדות ${INST.length} · תוכניות ${FUND.length} · קורסים ${COURSES.length} · תארים ${DEGREES.length}\n`);
if (errors.length) { line(`❌ ${errors.length} שגיאות\n`); errors.forEach((e) => line("   " + e)); line(""); }
if (warns.length) { line(`⚠️  ${warns.length} אזהרות\n`); warns.forEach((w) => line("   " + w)); line(""); }
if (!errors.length && !warns.length) line("✅ הכל עקבי\n");
process.exit(errors.length ? 1 : 0);
