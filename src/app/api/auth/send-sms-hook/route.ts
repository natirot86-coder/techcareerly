import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { sendSms } from "@/lib/sms019";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

/*
  ── התראה כש-019 נופל (נתי, 12.10) ──────────────────────────────────────────
  SMS הוא עכשיו הדרך היחידה להיכנס, ולכן 019 הוא נקודת כשל יחידה. בלי
  זה, הנפילה הייתה מתגלה כשמשתתף מתקשר לרכזת — אחרי שעות, ואחרי שאחרים
  כבר ויתרו בשקט. **שלושה כשלונות ברצף** (בלי הצלחה ביניהם) ⇒ מייל לנתי
  ולישראל, **לכל היותר פעם בשעתיים** — התראה שחוזרת כל דקה הופכת לרעש.
  ⚠️ הרישום לעולם לא מפיל את השליחה עצמה.
*/
const ALERT_AFTER = 3;
const ALERT_EVERY_MS = 2 * 60 * 60 * 1000;

async function logAndMaybeAlert(ok: boolean, error?: string) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return;
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data: row } = await db.from("sms_send_log")
      .insert({ ok, error: error?.slice(0, 300) ?? null }).select("id").single();
    if (ok) return;

    const { data: recent } = await db.from("sms_send_log")
      .select("ok, error, at").order("at", { ascending: false }).limit(ALERT_AFTER);
    const streak = (recent ?? []).length === ALERT_AFTER && (recent ?? []).every(r => !r.ok);
    if (!streak) return;

    const since = new Date(Date.now() - ALERT_EVERY_MS).toISOString();
    const { count } = await db.from("sms_send_log")
      .select("id", { count: "exact", head: true }).eq("alerted", true).gte("at", since);
    if (count) return;

    const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, "");
    const lines = (recent ?? []).map(r =>
      `<li>${new Date(r.at).toLocaleTimeString("he-IL", { timeZone: "Asia/Jerusalem" })} — ${esc(r.error)}</li>`).join("");
    await sendMail({
      to: "nati@tech-career.org",
      cc: "israel@tech-career.org",
      subject: "⚠️ שליחת SMS נכשלת — משתתפים לא יכולים להיכנס לאפליקציה",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
        <p><b>${ALERT_AFTER} שליחות SMS אחרונות נכשלו ברצף.</b> כל עוד זה כך, אף משתתף חדש לא יכול לאמת טלפון ולהיכנס.</p>
        <ul>${lines}</ul>
        <p>מה לבדוק: יתרה וחשבון ב-019 · משתני SMS_019 בוורסל · Supabase ← Auth ← Hooks.</p>
        <p style="color:#888;font-size:13px">ההתראה הבאה לא תישלח לפני שעתיים, גם אם הכשלונות נמשכים.</p></div>`,
    });
    if (row?.id) await db.from("sms_send_log").update({ alerted: true }).eq("id", row.id);
  } catch (e) {
    console.error("[send-sms-hook] log/alert failed", e);
  }
}

/**
 * Supabase Auth Hook — "Send SMS hook"
 * https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
 *
 * Supabase קוראת לכתובת הזו במקום לשלוח SMS בעצמה (ה-Phone provider המובנה
 * לא מוגדר אצלנו). אנחנו מאמתים את החתימה, שולפים phone+otp, ומעבירים
 * ל-019sms בפועל. חובה להחזיר {} עם 200 כדי ש-Supabase תדע שהשליחה הצליחה.
 */

type HookPayload = {
  user: { phone?: string };
  sms: { otp: string };
};

function errorResponse(httpCode: number, message: string) {
  return NextResponse.json({ error: { http_code: httpCode, message } }, { status: httpCode });
}

export async function POST(request: NextRequest) {
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!rawSecret) {
    return errorResponse(503, "SUPABASE_AUTH_HOOK_SECRET not configured");
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  let verified: HookPayload;
  try {
    const base64Secret = rawSecret.replace("v1,whsec_", "");
    const wh = new Webhook(base64Secret);
    verified = wh.verify(payload, headers) as HookPayload;
  } catch {
    return errorResponse(401, "חתימה לא תקינה — הבקשה לא אומתה כמגיעה מ-Supabase");
  }

  const phone = verified.user?.phone;
  const otp = verified.sms?.otp;

  if (!phone || !otp) {
    return errorResponse(400, "phone/otp חסרים בבקשה מ-Supabase");
  }

  const message = `קוד האימות שלך ל-Techcareerly: ${otp}`;
  const result = await sendSms(phone, message);

  await logAndMaybeAlert(result.ok, result.ok ? undefined : result.error);
  if (!result.ok) {
    return errorResponse(500, result.error);
  }

  return NextResponse.json({}, { status: 200 });
}
