/**
 * src/lib/linkSentGuard.ts — "נשלח קישור" בלי רכז/ת (נתי, 31.10).
 *
 * מייל הפתיחה יוצא רק כשיש סטטוס + רכז/ת + קישור יומן. כשמעדכנים "נשלח קישור"
 * בשורה בלי רכז/ת הוא **ממתין בשקט** — והשורה גם לא מופיעה אצל אף רכז/ת,
 * כי כל אחד רואה רק את שלו. כך בתאל (26.10): שי דיבר איתה ועדכן, ואיש לא
 * ידע שהמייל לא יצא; כשקבעה פגישה הסטטוס עבר הלאה והמייל לא יצא לעולם.
 *
 * 1. **מי שעדכן/ה הוא הרכז/ת** — אם הוא/היא נושא/ת מכסה (`quota_weight > 0`),
 *    נכתב/ת בשורה, והמייל יוצא דרך ה-webhook של שינוי הרכז/ת. מאיה (0) ונתי
 *    לא — מאיה מעדכנת לפעמים בשם אחרים, ושיוך שגוי שקט גרוע מהמתנה גלויה.
 * 2. **אחרת — מייל למי שעדכן/ה** (נתי: מייל, לא פעמון — "פחות מתייחסים
 *    אליו"). **מאוחד:** כל שורה נכנסת לתור (`link_sent_notices`, מיגרציה 022),
 *    ומייל אחד יוצא 45 שניות אחרי השינוי האחרון של אותו אדם — עדכון גורף של
 *    15 שורות הוא מייל אחד עם רשימה, לא 15. הודעה אחת לכל משתתף/ת, לעולם.
 *
 * ⚠️ עד ש-`LINK_SENT_NOTICE_LIVE=1` — המייל מגיע לנתי בלבד, עם מי שהיה מקבל
 * אותו. אנשים אמיתיים מקבלים הודעה אוטומטית רק אחרי שנתי ראה טסט.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mondaySetCoordinatorById } from "@/lib/monday";
import { sendMail } from "@/lib/mail";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const COL_COORD = "color_mm7t74m3";
export const PENDING_NO_COORD = "ממתין: אין רכז/ת משויך/ת";
const TEST_TO = "nati@tech-career.org";
/* עדכון גורף במאנדיי שולח את כל האירועים בתוך שניות — החלון הזה תופס אותו */
export const NOTICE_QUIET_MS = 45_000;
const VIEW_URL = `https://tech-career-team.monday.com/boards/${BOARD}/views/289567387`;

async function gql<T>(query: string): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[linkSentGuard]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * @returns "assigned" — נכתב/ה רכז/ת, המייל ייצא מה-webhook של שינוי הרכז/ת.
 *          "queued" — נכנס לתור; `flushNotices(email)` שולח אחרי השקט.
 */
export async function guardLinkSent(itemId: number, userId: number | undefined):
  Promise<{ result: "has-coordinator" | "assigned" | "skipped" } | { result: "queued"; email: string }> {
  const d = await gql<{ items: { name: string; column_values: { id: string; text: string | null }[] }[] }>(
    `{ items(ids: [${itemId}]) { name column_values(ids: ["${COL_COORD}"]) { id text } } }`);
  const item = d?.items?.[0];
  if (!item) return { result: "skipped" };
  if ((item.column_values[0]?.text ?? "").trim()) return { result: "has-coordinator" };

  const u = userId
    ? (await gql<{ users: { name: string; email: string }[] }>(`{ users(ids: [${userId}]) { name email } }`))?.users?.[0]
    : undefined;
  const client = db();
  const staff = client
    ? (await client.from("coordinators").select("name, email, takes_participants, quota_weight").eq("active", true)).data ?? []
    : [];
  const me = u?.email ? staff.find(c => String(c.email ?? "").toLowerCase() === u.email.toLowerCase()) : undefined;

  /* 1 — מי שעדכן/ה הוא/היא הרכז/ת */
  if (me && me.takes_participants && Number(me.quota_weight) > 0) {
    const ok = await mondaySetCoordinatorById(String(itemId), me.name);
    if (ok) { console.log(`[linkSentGuard] item ${itemId} → ${me.name} (עדכן/ה "נשלח קישור")`); return { result: "assigned" }; }
  }

  /* 2 — לתור. המפתח הוא השורה: מי שכבר בתור (או קיבל הודעה) לא נכנס שוב */
  if (!client) return { result: "skipped" };
  const email = (u?.email ?? TEST_TO).toLowerCase();
  const { error } = await client.from("link_sent_notices").upsert({
    item_id: itemId, user_email: email,
    user_name: (me?.name ?? u?.name ?? "").split(/\s+/)[0] || null,
    item_name: item.name.trim(),
  }, { onConflict: "item_id", ignoreDuplicates: true });
  if (error) { console.error("[linkSentGuard] queue failed:", error.message); return { result: "skipped" }; }
  return { result: "queued", email };
}

/**
 * שולח מייל אחד לאדם על כל השורות שלו בתור — אם עברו 45 שניות מהאחרונה.
 * אם נכנסה שורה חדשה בינתיים, הקריאה שלה תשלח (היא תחכה את השקט שלה).
 * `force` — לבדיקה היומית: שולח הכל, בלי לחכות.
 */
export async function flushNotices(email: string, force = false): Promise<number> {
  const client = db();
  if (!client) return 0;
  const { data: waiting } = await client.from("link_sent_notices")
    .select("created_at").eq("user_email", email).is("sent_at", null)
    .order("created_at", { ascending: false }).limit(1);
  const last = waiting?.[0]?.created_at;
  if (!last) return 0;
  if (!force && Date.now() - Date.parse(last) < NOTICE_QUIET_MS - 2_000) return 0;

  /* תפיסה אטומית — שתי ריצות במקביל לא שולחות את אותה שורה פעמיים */
  const { data: rows } = await client.from("link_sent_notices")
    .update({ sent_at: new Date().toISOString() })
    .eq("user_email", email).is("sent_at", null)
    .select("item_id, item_name, user_name");
  if (!rows?.length) return 0;

  const live = process.env.LINK_SENT_NOTICE_LIVE === "1";
  const n = rows.length;
  const first = rows.find(r => r.user_name)?.user_name ?? "";
  const names = rows.map(r => r.item_name ?? "").filter(Boolean);
  const list = rows.map(r =>
    `<li><a href="https://tech-career-team.monday.com/boards/${BOARD}/pulses/${r.item_id}">${esc(r.item_name ?? String(r.item_id))}</a></li>`).join("");
  const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"></head>
<body dir="rtl" style="direction:rtl;text-align:right;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#1c1a16">
<div dir="rtl" style="direction:rtl;text-align:right;max-width:600px">
${live ? "" : `<p style="background:#fff7ec;padding:8px 12px">טסט — במצב פעיל המייל הזה היה נשלח אל ${esc(email)}</p>`}
<p>היי${first ? " " + esc(first) : ""},</p>
<p>בלוח אינטק במאנדיי, אחרי שיחה ראשונה, עדכנת את הסטטוס ל<b>"נשלח קישור"</b> אצל ${n === 1 ? "" : `${n} משתתפים`}:</p>
<ul dir="rtl" style="direction:rtl;text-align:right;padding-right:20px;margin-right:0">${list}</ul>
<p>אבל ${n === 1 ? "בשורה" : "בשורות האלה"} <b>אין רכז/ת משויך/ת, ולכן מייל הפתיחה לא יצא.</b>
<b>עד שתבחר/י רכז/ת, ${n === 1 ? esc(names[0] ?? "") + " לא מקבל/ת" : "הם לא מקבלים"} מאיתנו כלום</b>: לא את הקישור לאפליקציה, לא את היומן לקביעת פגישה, וגם קישור הוואטסאפ בשורה עוד לא כולל יומן.</p>
<p><b>מה לעשות:</b> לבחור רכז/ת בעמודה "רכז/ת אחראי". המייל יישלח מעצמו ברגע שתבחר/י.</p>
<p style="color:#8d867a;font-size:13px">הודעה אוטומטית מאפליקציית טק-קריירה, פעם אחת לכל משתתף/ת.
כל מי שמחכה לשיוך כזה: <a href="${VIEW_URL}">התצוגה "לשיוך · אחרי שיחה, המייל לא יצא"</a> בלוח.</p>
</div></body></html>`;
  const subject = `${live ? "" : "[טסט] "}אינטק · ${n === 1 ? `המייל ל${names[0] ?? ""} לא יצא` : `${n} משתתפים לא קיבלו מייל`}, חסר/ה רכז/ת`;
  const sent = await sendMail({ to: live ? email : TEST_TO, subject, html });
  console.log(`[linkSentGuard] notice (${n} rows) → ${live ? email : TEST_TO + " (test)"}: ${sent}`);
  /* לא נשלח — משחררים לתור, הבדיקה היומית תנסה שוב */
  if (!sent) await client.from("link_sent_notices").update({ sent_at: null }).in("item_id", rows.map(r => r.item_id));
  return sent ? n : 0;
}

/** הבדיקה היומית: כל מה שנשאר בתור (הקריאה הדחויה נקטעה) נשלח עכשיו */
export async function flushStaleNotices(): Promise<number> {
  const client = db();
  if (!client) return 0;
  const { data } = await client.from("link_sent_notices").select("user_email").is("sent_at", null);
  let total = 0;
  for (const email of new Set((data ?? []).map(r => r.user_email as string))) total += await flushNotices(email, true);
  return total;
}
