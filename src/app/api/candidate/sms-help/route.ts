/**
 * POST /api/candidate/sms-help — "לא מגיע לי קוד": מי הרכז/ת, ולהודיע לו/ה.
 *
 * ─── למה (נתי, 12.10) ───────────────────────────────────────────────────────
 *
 * SMS הופך לדרך היחידה להיכנס. מי שהקוד לא מגיע אליו נתקע **במסך הראשון** —
 * עוד לא פגש אף אחד, לא יכתוב לאף אחד, ולא יחזור. אצל קהל שהמסוגלות שלו
 * נמוכה "הקוד לא הגיע" נשמע כמו "זה לא בשבילי". ולכן הכישלון לא נגמר
 * במבוי סתום אלא **באדם**: כפתור וואטסאפ לרכז/ת, ומייל לרכז/ת עם הטלפון
 * שהוקלד — כדי שהיא תדע שמישהו ניסה, גם אם הוא לא כתב.
 *
 * הרכז/ת: לפי **הטלפון שהוקלד** בלוח אינטק (רוב מי שמגיע — מגיע מהלוח),
 * ואם אין — רכז/ת הקליטה. אותו `matchCoordinator` כמו בכל מקום אחר.
 *
 * `notify: false` ⇒ רק מחזיר את הרכז/ת (לכפתור). `true` ⇒ גם מודיע — פעם
 * לשעה לכל טלפון, כי לחיצה כפולה על כפתור לא צריכה להיות שני מיילים.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mondayBoard, normPhone } from "@/lib/monday";
import { activeCoordinators, matchCoordinator } from "@/lib/coordinatorLookup";
import { sendMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

const sentAt = new Map<string, number>();
const ipHits = new Map<string, number[]>();

/*
  ⚠️ **בלי זיהוי — בכוונה** (QA 16.10). התיבה מופיעה כשה-SMS נכשל, כלומר
  **בדיוק כשאין עדיין זהות**. כשהנקודה דרשה זהות היא נכשלה תמיד במצב שבשבילו
  נבנתה, והתיבה הופיעה בלי רכז/ת ובלי וואטסאפ — מבוי סתום. בבדיקה של 12.10 זה
  "עבד" רק כי הדפדפן כבר היה מזוהה.
  מה שמוגן במקום זיהוי: המייל לרכז/ת — פעם בשעה לטלפון, 5 בשעה ל-IP.
*/
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon || !secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  /* זהות אם יש — רק כדי לרשום את האירוע אצלו. לא תנאי */
  const user = token ? (await createClient(url, anon).auth.getUser(token)).data.user : null;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

  const body = await req.json().catch(() => ({})) as { phone?: string; name?: string; where?: string; notify?: boolean };
  const phone = normPhone(body.phone ?? "");
  const db = createClient(url, secret, { auth: { persistSession: false } });
  const staff = (await activeCoordinators(db)).filter(c => c.takes_participants !== false);

  let coord = null as (typeof staff)[number] | null;
  if (phone) {
    try {
      const row = (await mondayBoard(null))?.find(r => r.phone === phone && r.coordinator);
      if (row) coord = matchCoordinator(staff, row.coordinator);
    } catch { /* הלוח לא זמין — נופלים לקליטה */ }
  }
  coord ??= staff.find(c => c.is_intake) ?? null;
  if (!coord) return NextResponse.json({ coordinator: null });

  const digits = (coord.phone ?? "").replace(/\D/g, "");
  const waPhone = digits.startsWith("0") ? "972" + digits.slice(1) : digits;

  if (body.notify) {
    const key = phone || user?.id || ip;
    const last = sentAt.get(key) ?? 0;
    const hour = Date.now() - 60 * 60 * 1000;
    const hits = (ipHits.get(ip) ?? []).filter(t => t > hour);
    if (Date.now() - last > 60 * 60 * 1000 && hits.length < 5) {
      ipHits.set(ip, [...hits, Date.now()]);
      sentAt.set(key, Date.now());
      const { data: c } = await db.from("coordinators").select("email").eq("id", coord.id).maybeSingle();
      const esc = (s: unknown) => String(s ?? "").replace(/[<>&"]/g, "");
      const local = phone ? "0" + phone.slice(3) : "(לא הוקלד)";
      if (c?.email) {
        await sendMail({
          to: c.email,
          subject: `${esc(body.name) || "משתתף/ת"} לא מצליח/ה לקבל קוד אימות`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7">
            <p>היי ${esc(coord.name.split(/\s+/)[0])},</p>
            <p><b>${esc(body.name) || "משתתף/ת"}</b> ניסה/תה להיכנס לאפליקציה והקוד ב-SMS לא הגיע.</p>
            <p>הטלפון שהוקלד: <b dir="ltr">${local}</b></p>
            <p>כדאי ליצור קשר — מי שנתקע במסך הראשון בדרך כלל לא חוזר לבד.
            אם המספר שגוי, אפשר לתקן אותו בלוח אינטק ולבקש לנסות שוב.</p>
            <p style="color:#888;font-size:13px">נשלח מהאפליקציה · ${esc(body.where) || ""}</p></div>`,
        });
      }
      if (user) await db.from("funnel_events").insert({ candidate_id: user.id, name: "sms_help", props: { where: body.where ?? "" } });
    }
  }

  return NextResponse.json({
    coordinator: { firstName: coord.name.trim().split(/\s+/)[0], phone: waPhone },
  });
}
