/**
 * src/lib/bounces.ts — מיילי פתיחה שחזרו (נתי, 1.11).
 *
 * "נשלח" בעמודה אומר רק שמיקרוסופט קיבלה את המייל לשליחה. כשהכתובת לא קיימת
 * או שהתיבה מלאה, חוזרת לתיבת השולח (intech@) הודעת "Undeliverable" — ואיש
 * לא קרא אותה. הרכז/ת ראה/תה "נשלח" והאדם לא קיבל כלום.
 *
 * כל בוקר: הודעות ההחזרה מהימים האחרונים ⇐ הכתובת שנכשלה ⇐ שורה בלוח
 * אינטק עם אותה כתובת ⇐ "המייל חזר" בעמודה "תקלת מייל". כך זה מופיע גם
 * בכרטיסי התקועים במסך הרכז/ת. לא נוגעים בשורה שכבר יש בה תקלה אחרת.
 * ⚠️ רק שורות בלוח — מייל אחר שחזר (לא שלנו) לא נכתב לשום מקום.
 */
import { graphAccess } from "@/lib/mail";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const COL_MAIL = "text_mm7tase7";
const COL_MAILFAIL = "text_mm7yz6ar";
/*
  שני סוגי החזרה, ולכל אחד פעולה אחרת (1.11):
  • הכתובת שגויה — ‎.comb / .om / .con, או משתמש שלא קיים. לתקן ולשלוח שוב
    (מחיקת התאריך ב"מייל פתיחה נשלח" היא מה ששולח שוב — ראה maybeSendWelcome).
  • לא נמסר — "למרות ניסיונות חוזרים": הכתובת נראית תקינה ושרת הנמען (בדרך
    כלל Gmail) לא קיבל. ככל הנראה חסימה של שליחה המונית — הכתובת לא אשמה.
*/
export const BOUNCED_WRONG = 'המייל חזר — הכתובת שגויה או לא קיימת. לתקן ולמחוק את התאריך ב"מייל פתיחה נשלח" כדי לשלוח שוב';
export const BOUNCED_UNDELIVERED = "המייל לא נמסר — שרת הנמען לא קיבל אותו (הכתובת נראית תקינה). לשלוח בוואטסאפ";
const WRONG_ADDRESS = /DNS|לא נמצא|unknown address|user unknown|invalid user|does not exist|doesn't exist|no such user|address not found|recipient not found/i;
/* תווי כיוון בלתי נראים — Outlook מוסיף אותם לנושא בעברית */
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[bounces]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

/* הודעת החזרה של Exchange (עברית או אנגלית), או של שרת אחר */
const isBounce = (subject: string, from: string) =>
  /^(undeliverable|undelivered|delivery status notification|mail delivery failed|לא ניתן למסירה|לא ניתן למסור)/i.test(subject.replace(BIDI, "").trim())
  || /mailer-daemon|postmaster|microsoftexchange/i.test(from);

const EMAILS = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/* מכאן מתחילות הכותרות של המייל המקורי — עם כל הנמענים שלו */
const HEADER_MARKERS = ["Original message headers", "כותרות ההודעה המקורית", "-----Original Message", "Received: from", "\nFrom:", "\nTo:", "\nSubject:", "\nמאת:", "\nאל:"];

export async function scanBounces(opts: { days: number; dry: boolean }) {
  const g = await graphAccess();
  if (!g) return { error: "graph not configured" as const };
  const since = new Date(Date.now() - opts.days * 864e5).toISOString();
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(g.mailbox)}/mailFolders/inbox/messages`
    + `?$filter=receivedDateTime ge ${since}&$select=subject,from,body,receivedDateTime&$top=100`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${g.token}`, Prefer: 'outlook.body-content-type="text"' } });
  if (!r.ok) return { error: `graph ${r.status}` as const };
  const msgs = ((await r.json()).value ?? []) as { subject: string; from?: { emailAddress?: { address?: string } }; body?: { content?: string } }[];

  /*
    הכתובות שנכשלו — **רק מהסיכום שבראש הודעת ההחזרה.** אחריו מצורפות
    הכותרות של המייל המקורי, ובהזמנה המונית ("מפגש חשיפה") הן כוללות את כל
    המוזמנים: הגרסה הראשונה סימנה 109 שורות "חזרו" מהחזרה של כתובת אחת (1.11).
  */
  /* כתובת ⇐ סוג. "שגויה" גוברת: אותה כתובת יכולה להופיע בשתי החזרות */
  const failed = new Map<string, "wrong" | "undelivered">();
  for (const m of msgs) {
    if (!isBounce(m.subject ?? "", m.from?.emailAddress?.address ?? "")) continue;
    const body = m.body?.content ?? "";
    const cut = HEADER_MARKERS.map(k => body.indexOf(k)).filter(i => i >= 0);
    const summary = body.slice(0, cut.length ? Math.min(...cut) : 1500).slice(0, 1500);
    const kind = WRONG_ADDRESS.test(summary) ? "wrong" : "undelivered";
    for (const e of summary.match(EMAILS) ?? []) {
      const a = e.toLowerCase();
      if (a.endsWith("@tech-career.org") || a.endsWith(".onmicrosoft.com")) continue;
      if (failed.get(a) !== "wrong") failed.set(a, kind);
    }
  }
  if (!failed.size) return { bounces: 0, matched: [] };

  const d = await gql<{ boards: { items_page: { items: { id: string; name: string; column_values: { id: string; text: string | null }[] }[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { items { id name column_values(ids: ["${COL_MAIL}","${COL_MAILFAIL}"]) { id text } } } } }`);
  const rows = d?.boards?.[0]?.items_page?.items ?? [];
  const matched: { item: string; kind: "wrong" | "undelivered" }[] = [];
  for (const it of rows) {
    const cv = (id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();
    const kind = failed.get(cv(COL_MAIL).toLowerCase());
    if (!kind) continue;
    if (cv(COL_MAILFAIL)) continue;   // כבר יש תקלה רשומה — לא דורסים
    matched.push({ item: it.id, kind });
    if (!opts.dry) await gql(
      `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
      { b: BOARD, i: it.id, v: JSON.stringify({ [COL_MAILFAIL]: kind === "wrong" ? BOUNCED_WRONG : BOUNCED_UNDELIVERED }) });
  }
  return { bounces: failed.size, matched, dry: opts.dry };
}
