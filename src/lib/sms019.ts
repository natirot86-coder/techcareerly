/**
 * 019sms.co.il — Send SMS API
 * https://docs.019sms.co.il/sms/send-sms.html
 *
 * שרת בלבד — נעזר ב-SMS_019_TOKEN (Bearer, נוצר בממשק הווב של 019sms).
 * לעולם לא לחשוף את המשתנים האלה ל-client (בלי NEXT_PUBLIC_).
 */

const API_URL = "https://019sms.co.il/api";

export type SendSmsResult =
  | { ok: true; shipmentId: string }
  | { ok: false; error: string };

/** ממירה כל פורמט טלפון ישראלי נפוץ (+972.., 972.., 0.., בלי אפס) לפורמט המקומי שה-API מצפה לו: 05XXXXXXXX */
function toLocalIsraeliFormat(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("972") ? digits.slice(3) : digits;
  const withoutLeadingZero = withoutCountryCode.startsWith("0") ? withoutCountryCode.slice(1) : withoutCountryCode;
  return `0${withoutLeadingZero}`;
}

/**
 * שולחת SMS בודד למספר טלפון ישראלי אחד.
 * מחזירה תוצאה מובנית — לעולם לא זורקת.
 */
export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  const token = process.env.SMS_019_TOKEN;
  const username = process.env.SMS_019_USERNAME;
  const source = process.env.SMS_019_SOURCE;

  if (!token || !username || !source) {
    return { ok: false, error: "019sms לא מוגדר — חסרים SMS_019_TOKEN / SMS_019_USERNAME / SMS_019_SOURCE ב-.env.local" };
  }

  const body = {
    sms: {
      user: { username },
      source,
      destinations: {
        phone: [{ _: toLocalIsraeliFormat(phone) }],
      },
      message,
    },
  };

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "שגיאת רשת בשליחה ל-019sms" };
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || !data || data.status !== 0) {
    const msg = data?.message || `שגיאה מ-019sms (HTTP ${res.status})`;
    return { ok: false, error: msg };
  }

  return { ok: true, shipmentId: String(data.shipment_id ?? "") };
}
