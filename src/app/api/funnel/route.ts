/**
 * GET /api/funnel — צבירת האירועים החדשים, בלי לגעת ב-SQL.
 *
 * `admin_stats()` נכתבה לפני שהאירועים האלה היו קיימים, ולהוסיף להם צבירה
 * שם היה מחייב מיגרציה נוספת — כלומר את הדפדפן של נתי. במקום זה נצברים כאן,
 * בצד שרת, מאותו לוג בדיוק.
 *
 * מה שנענה כאן ואי אפשר לענות בשום מקום אחר:
 *   1. באיזה **צעד** נוטשים בתוך סימולציה — לא רק כמה סיימו
 *   2. באיזו מ**שש שאלות** כלי עיבוד החוויה עוצרים
 *   3. כמה מהמגיעים למסך הפגישה באמת קובעים — ומי מהם היומן פשוט נפל אצלו
 *   4. אילו מהמענים שלנו לחסמים מישהו טרח לפתוח
 *
 * ⚠️ במספרים נמוכים כל האחוזים כאן חסרי משמעות סטטיסטית. השימוש הכן
 *    הראשון הוא לראות **איפה בכלל יש תנועה**, לא להסיק שיעורים.
 *
 * צבירה בלבד: אין בתשובה שום מזהה של אדם.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Ev = { name: string; props: Record<string, unknown> | null; candidate_id: string | null };

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/** כמה **אנשים שונים** הגיעו לכל ערך — לא כמה אירועים, שאותו אדם מנפח */
function peopleBy(events: Ev[], name: string, key: (e: Ev) => string): Record<string, number> {
  const seen = new Map<string, Set<string>>();
  for (const e of events) {
    if (e.name !== name || !e.candidate_id) continue;
    const k = key(e);
    if (!k) continue;
    if (!seen.has(k)) seen.set(k, new Set());
    seen.get(k)!.add(e.candidate_id);
  }
  return Object.fromEntries([...seen].map(([k, v]) => [k, v.size]));
}

function peopleWith(events: Ev[], name: string): number {
  return new Set(events.filter(e => e.name === name && e.candidate_id).map(e => e.candidate_id)).size;
}

export async function GET(req: NextRequest) {
  const code = process.env.COORDINATOR_CODE;
  if (!code) return NextResponse.json({ error: "COORDINATOR_CODE not configured" }, { status: 503 });
  if (req.headers.get("x-coordinator-code") !== code) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("funnel_events")
    .select("name, props, candidate_id")
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const events = (data ?? []) as Ev[];

  /*
   * נטישה בסימולציה: לכל תחום, כמה אנשים הגיעו לכל צעד.
   * הצעד נשמר עם המושג שנלמד בו — "צעד 4" לא אומר כלום, "מהו JOIN" כן.
   */
  const simSteps: Record<string, { i: number; of: number; concept: string; n: number }[]> = {};
  const simSeen = new Map<string, Set<string>>();
  const simMeta = new Map<string, { i: number; of: number; concept: string }>();
  for (const e of events) {
    if (e.name !== "sim_step" || !e.candidate_id) continue;
    const d = s(e.props?.domain);
    const i = Number(e.props?.i);
    if (!d || !Number.isFinite(i)) continue;
    const k = `${d}|${i}`;
    if (!simSeen.has(k)) simSeen.set(k, new Set());
    simSeen.get(k)!.add(e.candidate_id);
    if (!simMeta.has(k)) simMeta.set(k, { i, of: Number(e.props?.of) || 0, concept: s(e.props?.concept) });
  }
  for (const [k, who] of simSeen) {
    const [d] = k.split("|");
    const m = simMeta.get(k)!;
    (simSteps[d] ??= []).push({ ...m, n: who.size });
  }
  Object.values(simSteps).forEach(a => a.sort((x, y) => x.i - y.i));

  const meetingOpen = peopleWith(events, "meeting_open");
  const meetingReady = peopleWith(events, "meeting_calendar_ready");
  const meetingFailed = peopleWith(events, "meeting_calendar_failed");
  const meetingBooked = peopleWith(events, "meeting_booked");

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    sampled: events.length,
    simSteps,
    scctSteps: peopleBy(events, "scct_step", e => `${s(e.props?.domain)}|${s(e.props?.q)}`),
    blockers: peopleBy(events, "paths_blocker_open", e => s(e.props?.blocker)),
    solutions: peopleBy(events, "paths_solution_click", e => s(e.props?.solution)),
    quiz: peopleBy(events, "paths_question", e => s(e.props?.answered)),
    // המשפך של הפגישה. הפער בין open ל-booked הוא המספר שלא היה לנו קודם,
    // ו-failed מפריד בין "לא רצה" ל"נשבר אצלו" — שני דברים שנראים זהים
    meeting: { open: meetingOpen, ready: meetingReady, failed: meetingFailed, booked: meetingBooked },
    tasksReopened: peopleBy(events, "plan_task_open", e => s(e.props?.task)),
  });
}
