import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { sendSms } from "@/lib/sms019";

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

  if (!result.ok) {
    return errorResponse(500, result.error);
  }

  return NextResponse.json({}, { status: 200 });
}
