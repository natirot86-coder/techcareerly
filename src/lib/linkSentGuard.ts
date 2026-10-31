/**
 * src/lib/linkSentGuard.ts — "נשלח קישור" בלי רכז/ת (נתי, 31.10).
 *
 * מייל הפתיחה יוצא רק כשיש סטטוס + רכז/ת + קישור יומן. כשמסמנים "נשלח קישור"
 * בשורה בלי רכז/ת הוא **ממתין בשקט** — והשורה גם לא מופיעה אצל אף רכז/ת,
 * כי כל אחד רואה רק את שלו. כך בתאל (26.10): שי דיבר איתה וסימן, ואיש לא
 * ידע שהמייל לא יצא; כשקבעה פגישה הסטטוס עבר הלאה והמייל לא יצא לעולם.
 *
 * 1. **מי שסימן/ה הוא הרכז/ת** — אם הוא/היא נושא/ת מכסה (`quota_weight > 0`),
 *    נכתב/ת בשורה, והמייל יוצא דרך ה-webhook של שינוי הרכז/ת. מאיה (0) ונתי
 *    לא — מאיה מסמנת לפעמים בשם אחרים, ושיוך שגוי שקט גרוע מהמתנה גלויה.
 * 2. **אחרת — מייל למי שסימן/ה** (נתי: מייל, לא פעמון של מאנדיי — "פחות
 *    מתייחסים אליו"), פעם אחת לשורה: הסימון "ממתין: אין רכז/ת" בעמודה
 *    "תקלת מייל" הוא העובדה ששומרת מפני שליחה חוזרת.
 *
 * ⚠️ עד ש-`LINK_SENT_NOTICE_LIVE=1` — המייל מגיע לנתי בלבד, עם מי שהיה מקבל
 * אותו. אנשים אמיתיים מקבלים הודעה אוטומטית רק אחרי שנתי ראה טסט.
 */
import { createClient } from "@supabase/supabase-js";
import { mondaySetCoordinatorById } from "@/lib/monday";
import { sendMail } from "@/lib/mail";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const COL_COORD = "color_mm7t74m3";
const COL_MAILFAIL = "text_mm7yz6ar";
export const PENDING_NO_COORD = "ממתין: אין רכז/ת משויך/ת";
const TEST_TO = "nati@tech-career.org";

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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** @returns "assigned" — נכתב/ה רכז/ת, המייל ייצא מה-webhook של שינוי הרכז/ת */
export async function guardLinkSent(itemId: number, userId: number | undefined): Promise<"has-coordinator" | "assigned" | "notified" | "skipped"> {
  const d = await gql<{ items: { name: string; column_values: { id: string; text: string | null }[] }[] }>(
    `{ items(ids: [${itemId}]) { name column_values(ids: ["${COL_COORD}","${COL_MAILFAIL}"]) { id text } } }`);
  const item = d?.items?.[0];
  if (!item) return "skipped";
  const cv = (id: string) => (item.column_values.find(c => c.id === id)?.text ?? "").trim();
  if (cv(COL_COORD)) return "has-coordinator";

  const u = userId
    ? (await gql<{ users: { name: string; email: string }[] }>(`{ users(ids: [${userId}]) { name email } }`))?.users?.[0]
    : undefined;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  const staff = url && key
    ? (await createClient(url, key, { auth: { persistSession: false } })
        .from("coordinators").select("name, email, takes_participants, quota_weight").eq("active", true)).data ?? []
    : [];
  const me = u?.email ? staff.find(c => String(c.email ?? "").toLowerCase() === u.email.toLowerCase()) : undefined;

  /* 1 — מי שסימן/ה הוא/היא הרכז/ת */
  if (me && me.takes_participants && Number(me.quota_weight) > 0) {
    const ok = await mondaySetCoordinatorById(String(itemId), me.name);
    if (ok) { console.log(`[linkSentGuard] item ${itemId} → ${me.name} (סימן/ה "נשלח קישור")`); return "assigned"; }
  }

  /* 2 — מייל למי שסימן/ה, פעם אחת לשורה */
  if (cv(COL_MAILFAIL).startsWith(PENDING_NO_COORD)) return "skipped";
  const to = u?.email ?? TEST_TO;
  const live = process.env.LINK_SENT_NOTICE_LIVE === "1";
  const first = (me?.name ?? u?.name ?? "").split(/\s+/)[0];
  const who = item.name.trim();
  const rowUrl = `https://tech-career-team.monday.com/boards/${BOARD}/pulses/${itemId}`;
  const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"></head>
<body dir="rtl" style="direction:rtl;text-align:right;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#1c1a16">
<div dir="rtl" style="direction:rtl;text-align:right;max-width:600px">
${live ? "" : `<p style="background:#fff7ec;padding:8px 12px">טסט — במצב פעיל המייל הזה היה נשלח אל ${esc(to)}</p>`}
<p>היי${first ? " " + esc(first) : ""},</p>
<p>סימנת <b>"נשלח קישור"</b> אצל <b>${esc(who)}</b>, אבל בשורה אין רכז/ת משויך/ת, <b>ולכן המייל עם הקישורים לאפליקציה וליומן לא יצא.</b></p>
<p><b>מה לעשות:</b> לבחור רכז/ת בעמודה "רכז/ת אחראי" בשורה. המייל יישלח מעצמו ברגע שתבחר/י.</p>
<p><a href="${rowUrl}">לפתוח את השורה במאנדיי</a></p>
<p style="color:#8d867a;font-size:13px">הודעה אוטומטית מהאפליקציה. נשלחת פעם אחת לכל משתתף/ת.</p>
</div></body></html>`;
  const sent = await sendMail({
    to: live ? to : TEST_TO,
    subject: `${live ? "" : "[טסט] "}המייל ל${who} לא יצא — חסר/ה רכז/ת בשורה`,
    html,
  });
  console.log(`[linkSentGuard] notice for item ${itemId} → ${live ? to : TEST_TO + " (test)"}: ${sent}`);
  return "notified";
}
