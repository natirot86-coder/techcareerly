/**
 * POST /api/cal-webhook — קליטת אירועי קביעה מ-Cal.com בצד השרת.
 *
 * למה: היום מועד הפגישה נקלט רק מהדפדפן של המועמד (embed callback) — מי
 * שקובע מהמייל/מהנייד של Cal עוקף את המדידה. ה-webhook הוא מקור האמת.
 *
 * זיהוי מועמד: אין לנו אימייל באפליקציה (Anonymous auth), ולכן אין התאמה
 * אוטומטית — הקביעות נשמרות בטבלת cal_bookings והרכזת רואה אותן במסך שלה
 * לצד המועמדים. כשיהיה Phone/Email Auth — נתאים אוטומטית.
 *
 * אבטחה: אימות חתימת HMAC-SHA256 של Cal (כותרת x-cal-signature-256) מול
 * CAL_WEBHOOK_SECRET. בלי הסוד ב-env — המסלול נעול.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "CAL_WEBHOOK_SECRET not configured" }, { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get("x-cal-signature-256") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const ok = signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  let body: {
    triggerEvent?: string;
    payload?: {
      title?: string;
      startTime?: string;
      attendees?: { name?: string; email?: string; phoneNumber?: string; smsReminderNumber?: string }[];
      responses?: Record<string, unknown>;
      organizer?: { name?: string; email?: string };
      eventType?: { title?: string };
    };
  };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const p = body.payload ?? {};
  const attendee = p.attendees?.[0] ?? {};
  const db = createClient(url, key, { auth: { persistSession: false } });

  // רב-רכזות בלי רב-חיבורים: כל רכזת שמה את אותו webhook בחשבון Cal שלה,
  // וההזמנה מזוהה כאן לפי מייל ה-organizer מול סגל הרכזות ב-DB
  const organizerEmail = (p.organizer?.email ?? "").trim().toLowerCase();
  let coordinatorId: string | null = null;
  if (organizerEmail) {
    const { data: match } = await db.from("coordinators")
      .select("id").ilike("email", organizerEmail).limit(1);
    coordinatorId = match?.[0]?.id ?? null;
  }

  /*
   * זיהוי המועמד לפי טלפון מנורמל — התאמה מלאה בלבד.
   * ניחוש לפי דמיון שמות היה מסוכן פי כמה מתור ידני: שיוך שגוי בשקט
   * הוא בדיוק מה שאי אפשר לתקן. מה שלא הותאם נשאר candidate_id ריק
   * ומופיע לרכזת כ"הזמנה לא משויכת".
   */
  const rawPhone =
    (attendee as { phoneNumber?: string }).phoneNumber ??
    (attendee as { smsReminderNumber?: string }).smsReminderNumber ??
    (p.responses?.smsReminderNumber as string | undefined) ??
    (p.responses?.attendeePhoneNumber as string | undefined) ??
    "";
  const digits = String(rawPhone).replace(/\D/g, "");
  const phone = digits.startsWith("972") ? digits
    : digits.startsWith("0") ? "972" + digits.slice(1)
    : digits.length === 9 ? "972" + digits : digits;

  let candidateId: string | null = null;
  if (phone) {
    const { data: match } = await db.from("candidates")
      .select("id").eq("phone", phone).limit(1);
    candidateId = match?.[0]?.id ?? null;
  }

  const { error } = await db.from("cal_bookings").insert({
    trigger: body.triggerEvent ?? "unknown",
    title: p.eventType?.title ?? p.title ?? "",
    start_time: p.startTime ?? null,
    attendee_name: attendee.name ?? "",
    attendee_email: attendee.email ?? "",
    organizer_email: organizerEmail,
    coordinator_id: coordinatorId,
    attendee_phone: phone,
    candidate_id: candidateId,
    raw: body,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
