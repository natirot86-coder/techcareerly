/**
 * src/lib/mail.ts — שליחת מייל מ-intech@tech-career.org (Microsoft Graph).
 *
 * ─── למה האפליקציה שולחת ולא מאנדיי ──────────────────────────────────────────
 *
 * למאנדיי יש אוטומציית מייל, אבל היא שולחת מייל של מאנדיי: אי אפשר לשלוט
 * בעיצוב, ו-RTL בפרט יוצא שבור. כאן זה מייל שלנו, מהכתובת של התוכנית,
 * ואפשר לתקן בו מילה בלי לבקש מאף אחד.
 *
 * ⚠️ **מייל אינו מחליף את הוואטסאפ — הוא מצטרף אליו.** לקהל הזה וואטסאפ
 * מגיע ונקרא; המייל הוא מה שאפשר לחזור אליו אחרי שבוע, והוא היחיד שנשאר
 * בתיבה כשההודעה כבר נקברה מתחת לעשרים צ'אטים.
 *
 * ⚠️ **בלי משתני הסביבה — no-op שקט.** לא מפיל את ה-webhook, בדיוק כמו
 * monday.ts: הסטטוס בלוח הוא העובדה, והמייל הוא מה שנגזר ממנה.
 */

type Credentials = { tenant: string; clientId: string; secret: string; from: string };

function creds(): Credentials | null {
  const tenant = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const secret = process.env.MS_CLIENT_SECRET;
  const from = process.env.SENDER_EMAIL;
  if (!tenant || !clientId || !secret || !from) return null;
  return { tenant, clientId, secret, from };
}

async function token(c: Credentials): Promise<string | null> {
  try {
    const r = await fetch(`https://login.microsoftonline.com/${c.tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: c.clientId, client_secret: c.secret,
        scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials",
      }),
    });
    const j = await r.json();
    return j.access_token ?? null;
  } catch { return null; }
}

/** מחזיר true אם נשלח, false אם נכשל, null אם האינטגרציה כבויה */
export async function sendMail(p: {
  to: string; subject: string; html: string; cc?: string;
}): Promise<boolean | null> {
  const c = creds();
  if (!c) return null;
  const t = await token(c);
  if (!t) { console.error("[mail] token failed"); return false; }
  try {
    const r = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(c.from)}/sendMail`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            subject: p.subject,
            body: { contentType: "HTML", content: p.html },
            toRecipients: [{ emailAddress: { address: p.to } }],
            ...(p.cc ? { ccRecipients: [{ emailAddress: { address: p.cc } }] } : {}),
          },
          saveToSentItems: true,
        }),
      }
    );
    if (!r.ok) console.error("[mail]", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) { console.error("[mail] fetch failed", e); return false; }
}

const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, ch =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] as string));

const APP_URL = "https://hasifaapp.vercel.app";

/**
 * ההודעה הראשונה — אותו רגע בדיוק שבו יוצא הוואטסאפ.
 *
 * ⚠️ **טבלאות ו-CSS מוטבע, לא flexbox ולא grid.** Outlook מרנדר ב-Word,
 * והפריסות המודרניות קורסות בו לעמודה אחת מעורבבת.
 *
 * ⚠️ **אישי מהרכזת ולא רשמי מהתוכנית.** המייל הזה מגיע דקות אחרי שיחה
 * אמיתית, והוא ממשיך אותה — "ברוך הבא לתוכנית אינטק" היה מנתק אותו ממנה.
 */
export function welcomeEmail(p: {
  participant: string;
  coordinator?: string | null;
  calUrl?: string | null;
  /* קישורים נמדדים (8.10) — ראה /api/r */
  appUrl?: string | null;
  trackedCalUrl?: string | null;
}): { subject: string; html: string } {
  const them = esc((p.participant ?? "").trim().split(/\s+/)[0] ?? "");
  const me = esc((p.coordinator ?? "").trim() || "צוות אינטק");
  const cal = (p.calUrl ?? "").trim();

  const btn = (href: string, label: string, primary: boolean) => `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
      <tr><td style="border-radius:10px;background:${primary ? "#023e8a" : "#ffffff"};
        border:1px solid ${primary ? "#023e8a" : "#c9d4e4"};">
        <a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-size:16px;font-weight:700;
          text-decoration:none;color:${primary ? "#ffffff" : "#023e8a"};font-family:Arial,sans-serif;">
          ${label}
        </a>
      </td></tr>
    </table>`;

  const html = `<div dir="rtl" style="background:#fbf9f5;padding:24px 12px;font-family:Arial,'Segoe UI',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;margin:0 auto;
    background:#ffffff;border:1px solid #e8e3da;border-radius:14px;">
    <tr><td style="background:#023e8a;padding:20px 26px;border-radius:14px 14px 0 0;">
      <div style="color:#ffffff;opacity:.72;font-size:12px;letter-spacing:1px;">טק-קריירה</div>
      <div style="color:#ffffff;font-size:21px;font-weight:700;margin-top:3px;">תוכנית אינטק</div>
    </td></tr>

    <tr><td style="padding:26px;color:#1c1a16;font-size:16px;line-height:1.85;">
      <p style="margin:0 0 14px;">היי${them ? " " + them : ""},</p>
      <p style="margin:0 0 18px;">
        נעים להכיר — אני <b>${me}</b>, ואני אלווה אותך בתוכנית. כמו שדיברנו,
        הנה שני הדברים שצריך כדי להתחיל:
      </p>

      ${btn(p.appUrl || APP_URL, "כניסה לאפליקציה ←", true)}
      <p style="margin:0 0 20px;font-size:14px;color:#6b6558;line-height:1.7;">
        נכנסים עם מספר הטלפון שלך — זה שאליו הגיעה ההודעה. האפליקציה תלווה
        אותך לאורך כל הדרך, ושם גם תמצא את כל מה שנדבר עליו.
      </p>

      ${cal ? btn(p.trackedCalUrl || cal, "קביעת הפגישה הראשונה שלנו ←", false) : ""}
      ${cal ? `<p style="margin:0 0 20px;font-size:14px;color:#6b6558;line-height:1.7;">
        בוחרים זמן שנוח לך. נפגשים שעה, מכירים, ובונים תוכנית.
      </p>` : ""}

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
        style="background:#f7f5f0;border-radius:10px;margin-top:6px;">
        <tr><td style="padding:14px 16px;font-size:14px;color:#5b5648;line-height:1.75;">
          <b style="color:#023e8a;">מה קורה מכאן</b><br>
          נפגשים להיכרות · מתנסים בתחומי הייטק · בוחרים מסלול לימודים ·
          ואני איתך גם במלגות ובהרשמה.
        </td></tr>
      </table>

      <p style="margin:22px 0 0;">נדבר בקרוב,<br><b>${me}</b></p>
    </td></tr>

    <tr><td style="background:#f3f1ec;padding:14px 26px;border-radius:0 0 14px 14px;
      color:#8d867a;font-size:12px;line-height:1.7;">
      קיבלת את המייל הזה אחרי שיחה איתנו. אם זה הגיע אליך בטעות — אפשר פשוט להתעלם.
    </td></tr>
  </table>
</div>`;

  return { subject: `${them ? them + ", " : ""}הקישור לאפליקציה ולפגישה הראשונה — תוכנית אינטק`, html };
}
