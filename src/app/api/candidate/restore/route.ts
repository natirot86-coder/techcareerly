/**
 * GET /api/candidate/restore — ההתקדמות של המשתתף/ת, מהשרת, בשביל דפדפן חדש.
 *
 * ─── למה (סיון, 11.10) ───────────────────────────────────────────────────────
 *
 * משתתף בפגישה 2 נכנס עם הטלפון — ונזרק למסך הפתיחה, כאילו לא עשה כלום.
 * **כל ההתקדמות חיה ב-localStorage**, כלומר בדפדפן אחד. דפדפן אחר — טלפון
 * חדש, או הדפדפן המובנה של וואטסאפ מול כרום, שזה המקרה הנפוץ — ריק. הכניסה
 * עם הטלפון החזירה את **הזהות** אבל לא את ה**מקום**, ודף הבית ראה דפדפן ריק
 * ושלח לאונבורדינג. וזה קורה בדיוק לאנשים שכבר התקדמו — הכי יקר לאבד.
 *
 * מה שכבר נשמר בשרת מספיק כדי להחזיר אותו למקום הנכון: פרטי ההרשמה
 * (candidates), האירועים (funnel_events — הפגישה, הצ'ק-אין, המבוא, הטעימות)
 * וההזמנות מ-Cal. מחזירים **מפתחות localStorage** — אותם מפתחות שהמסכים
 * כבר קוראים — כדי שאף מסך לא יצטרך לדעת שהיה שחזור.
 *
 * ⚠️ הלקוח כותב **רק מפתחות שחסרים** — לעולם לא דורס מצב מקומי.
 * ⚠️ מה ששמור רק בדפדפן (תשובות השאלונים עצמן) לא חוזר. השלב והמקום — כן.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Ev = { name: string; props: Record<string, unknown> | null; created_at: string };

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon || !secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: { user } } = await createClient(url, anon).auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const { data: c } = await db.from("candidates")
    .select("first_name, gender, cohort, phone, onboarding_completed_at")
    .eq("id", user.id).maybeSingle();

  /* בלי הרשמה שהושלמה אין מה לשחזר — האונבורדינג הוא באמת המקום הנכון */
  if (!c || (!c.onboarding_completed_at && !String(c.first_name ?? "").trim())) {
    return NextResponse.json({ restored: false, keys: {} });
  }

  const keys: Record<string, string> = {
    "onboarding-done": "1",
    "user-name": String(c.first_name ?? "").trim(),
  };
  if (c.gender) keys["user-gender"] = String(c.gender);
  if (c.cohort) keys["cohort"] = String(c.cohort);
  if (c.phone) keys["phone-synced"] = String(c.phone);

  const { data: evs } = await db.from("funnel_events")
    .select("name, props, created_at")
    .eq("candidate_id", user.id)
    .in("name", ["profile", "meeting_booked", "meeting1_checkin", "intro_done", "taste_done"])
    .order("created_at", { ascending: true })
    .limit(1000);
  const events = (evs ?? []) as Ev[];
  const last = (n: string) => [...events].reverse().find(e => e.name === n);
  const p = (e: Ev | undefined, k: string) => String(e?.props?.[k] ?? "");

  const profile = last("profile");
  if (profile) {
    if (p(profile, "birthDate")) keys["birth-date"] = p(profile, "birthDate");
    if (p(profile, "service")) keys["service-status"] = p(profile, "service");
    if (p(profile, "city")) keys["home-city"] = p(profile, "city");
    if (p(profile, "discharge")) keys["discharge-date"] = p(profile, "discharge");
    if (p(profile, "miluim")) keys["miluim-active"] = p(profile, "miluim");
  }

  /* פגישה 1: נקבעה — מהאירוע או מ-Cal; ומועדה מ-Cal, כי ממנו נגזר "איך היה?" */
  const { data: books } = await db.from("cal_bookings")
    .select("start_time, trigger").eq("candidate_id", user.id)
    .neq("trigger", "BOOKING_CANCELLED").order("start_time", { ascending: true }).limit(5);
  const booked = events.some(e => e.name === "meeting_booked" && p(e, "n") !== "2" && p(e, "n") !== "3")
    || (books?.length ?? 0) > 0;
  if (booked) { keys["meeting-1-booked"] = "true"; keys["meeting-booked"] = "true"; }
  if (books?.[0]?.start_time) keys["meeting-1-at"] = String(books[0].start_time);

  const checkin = last("meeting1_checkin");
  if (p(checkin, "result") === "yes" || p(checkin, "result") === "missed") {
    keys["meeting-1-attended"] = p(checkin, "result");
  }

  const intro = last("intro_done");
  if (intro) keys["waiting-taste"] = JSON.stringify({ intro: true, at: intro.created_at, restored: true });

  /* הטעימות: אותו מבנה בדיוק כמו `${domain}-journey` שהמסכים כותבים */
  const journeys: Record<string, Record<string, boolean>> = {};
  const synced: Record<string, boolean> = {};
  for (const e of events.filter(e => e.name === "taste_done")) {
    const d = p(e, "domain"), s = p(e, "step");
    if (!d || !s) continue;
    (journeys[d] ??= {})[s] = true;
    synced[`${d}.${s}`] = true;
  }
  for (const [d, j] of Object.entries(journeys)) keys[`${d}-journey`] = JSON.stringify(j);
  /* אחרת syncTasteProgress ישלח שוב taste_done על כל מה ששוחזר */
  if (Object.keys(synced).length) keys["taste-synced"] = JSON.stringify(synced);

  return NextResponse.json({ restored: true, keys });
}
