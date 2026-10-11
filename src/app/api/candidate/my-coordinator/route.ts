/**
 * GET /api/candidate/my-coordinator — מי הרכז/ת של המשתתף/ת, ומה היומן שלו/ה.
 *
 * ─── למה בשרת ולא שאילתה מהדפדפן (נתי, 11.10) ───────────────────────────────
 *
 * משתתפת של סיון ראתה את היומן ואת השם של נתי. שתי סיבות, ושתיהן תשתיתיות:
 * הדפדפן בחר "הרכז/ת הפעיל/ה הראשון/ה בטבלה" כשלא היה שיוך — כלומר נתי, שבכלל
 * לא מלווה משתתפים — ו**השיוך לא הגיע אף פעם**, כי הוא זורם מהלוח רק כשעמודת
 * הרכז/ת *משתנה*, ואצל מי שהגיע מהלוח היא כבר הייתה מלאה לפני שנרשם.
 *
 * שלוש שכבות, מהחזקה לחלשה:
 *   1. **שיוך קיים** ב-candidates.coordinator_id — מהלוח, מהקישור (?coord=) או מהרכזת.
 *   2. **הטלפון בלוח אינטק** — אם יש שורה עם רכז/ת, משייכים ו**כותבים**. זה סוגר
 *      את כל מי שנרשם אחרי שהלוח כבר שייך אותו, בלי לחכות לשינוי שלא יגיע.
 *   3. **רכז/ת הקליטה** (`is_intake`, מיגרציה 015) — לתצוגה בלבד, **לא נכתב**:
 *      שיוך אמיתי שיגיע מהלוח מחר חייב לגבור עליו.
 *
 * ⚠️ **רק מי שמלווה משתתפים** (`takes_participants`). owner/manager שלא מלווים
 * אינם רכזים מבחינת המשתתף, גם אם הם הראשונים בטבלה.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizePhone } from "@/lib/candidate";
import { mondayBoard, normPhone } from "@/lib/monday";
import { activeCoordinators, matchCoordinator, type CoordinatorRow } from "@/lib/coordinatorLookup";

export const dynamic = "force-dynamic";

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
  const all = await activeCoordinators(db);
  const staff = all.filter(c => c.takes_participants !== false);

  const { data: cand } = await db.from("candidates")
    .select("coordinator_id, phone").eq("id", user.id).maybeSingle();

  let row: CoordinatorRow | null = null;
  let source: "assigned" | "board" | "intake" | "none" = "none";

  /* 1 — שיוך קיים. גם אם הוא למי שלא מלווה — זו החלטה של אדם, לא שלנו */
  if (cand?.coordinator_id) {
    row = all.find(c => c.id === cand.coordinator_id) ?? null;
    if (row) source = "assigned";
  }

  /* 2 — הטלפון בלוח אינטק */
  const phone = normPhone(cand?.phone || normalizePhone(user.phone));
  if (!row && phone) {
    try {
      const board = await mondayBoard(null);
      const hit = board?.find(r => r.phone === phone && r.coordinator);
      const match = hit ? matchCoordinator(staff, hit.coordinator) : null;
      if (match) {
        /* רק אם עדיין ריק — לא דורסים שיוך שנכתב במקביל */
        await db.from("candidates").update({ coordinator_id: match.id })
          .eq("id", user.id).is("coordinator_id", null);
        row = match;
        source = "board";
      }
    } catch (e) { console.error("[my-coordinator] board lookup failed", e); }
  }

  /* 3 — רכז/ת הקליטה, לתצוגה בלבד */
  if (!row) {
    row = staff.find(c => c.is_intake) ?? null;
    if (row) source = "intake";
  }

  if (!row) return NextResponse.json({ coordinator: null, source });

  const digits = (row.phone ?? "").replace(/\D/g, "");
  return NextResponse.json({
    source,
    coordinator: {
      id: row.id,
      name: row.name,
      firstName: row.name.trim().split(/\s+/)[0] ?? "",
      phone: digits.startsWith("0") ? "972" + digits.slice(1) : digits,
      calLinks: { 1: row.cal_m1 ?? "", 2: row.cal_m2 ?? "", 3: row.cal_m3 ?? "" },
    },
  });
}
