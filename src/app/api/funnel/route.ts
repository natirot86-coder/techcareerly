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
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyCoordinator, isOwner } from "@/lib/serverCoordinatorAuth";
import { mondayBoard } from "@/lib/monday";
import { clusterPeople, meetingKind } from "@/lib/personIdentity";

const ALUMNI_TRACK = "בוגרים — תואר בלבד";

/*
 * ── משפך התוכנית: אנשים, לא דפדפנים (נתי, 31.10) ────────────────────────────
 * "התקינו" ספר שורות ב-candidates — ו-403 מ-432 היו ריקות: כל פתיחה של
 * האפליקציה בדפדפן חדש (וואטסאפ ואז כרום, צוות, QA) יוצרת סשן אנונימי ושורה.
 * הבסיס היה מנופח פי 20, וכל אחוז שנגזר ממנו נראה גרוע ממה שהוא.
 * כאן כל שלב סופר **אנשים**: הלוח (מי בתוכנית) · הלחיצה המתועדת על הקישור ·
 * אימות טלפון · פגישות ב-Cal לפי personIdentity — אותה זהות כמו בדשבורד.
 * ⚠️ אינו מונוטוני בהכרח: אפשר לקבוע פגישה מקישור היומן בלי להירשם לאפליקציה.
 */
async function programFunnel(db: SupabaseClient, cohort: string) {
  const board = ((await mondayBoard(null)) ?? [])
    .filter(r => (r.track === ALUMNI_TRACK ? "alumni" : "main") === cohort);
  const { data: cands } = await db.from("candidates")
    .select("phone, cohort, phone_verified, is_test").eq("phone_verified", true);
  const registered = (cands ?? []).filter(c => !c.is_test && String(c.cohort ?? "main") === cohort);
  const { data: raw } = await db.from("cal_bookings")
    .select("title, attendee_phone, attendee_email, trigger, uid:raw->>uid, puid:raw->payload->>uid, movedFrom:raw->payload->>rescheduleUid")
    .neq("trigger", "BOOKING_CANCELLED");
  type B = { title: string | null; attendee_phone: string | null; attendee_email: string | null; uid?: string | null; puid?: string | null; movedFrom?: string | null };
  const rows = (raw ?? []) as B[];
  const moved = new Set(rows.map(b => b.movedFrom).filter(Boolean));
  const bookings = rows.filter(b => !moved.has(b.uid ?? b.puid ?? ""));

  /* אשכול אחד לכולם: מי מהלוח/מהנרשמים קבע איזו פגישה — גם בשם אחר */
  const items = [
    ...board.map(r => ({ phone: r.phone, email: r.email })),
    ...registered.map(c => ({ phone: c.phone as string, email: null })),
    ...bookings.map(b => ({ phone: b.attendee_phone, email: b.attendee_email })),
  ];
  const ids = clusterPeople(items);
  const members = new Set(ids.slice(0, board.length + registered.length));
  const met = (k: 1 | 2 | 3) => new Set(bookings
    .map((b, i) => (meetingKind(b.title) === k ? ids[board.length + registered.length + i] : null))
    .filter((p): p is string => !!p && members.has(p))).size;

  return {
    inProgram: board.length,
    clickedLink: board.filter(r => r.clickedAt).length,
    registered: registered.length,
    m1: met(1), m2: met(2), m3: met(3),
  };
}

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
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  /* אנליטיקות ל-owner בלבד (נתי 4.10) — ראה serverCoordinatorAuth */
  if (!isOwner(auth.role)) return NextResponse.json({ error: "המסך הזה מיועד לניהול המוצר" }, { status: 403 });

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
  const all = (data ?? []) as Ev[];

  /*
   * פילוח לפי קוהורט (28.8) — **לפני שהמועמד הראשון נכנס.**
   * בוגרי טק-קריירה מדלגים על שלב הטעימות, ולכן ערבוב שלהם עם
   * הקהל הרחב היה **מצניח את אחוז ההמרה בטעימות ונראה כמו רגרסיה במוצר**.
   * מספר שהתחיל לשקר אינו ניתן לתיקון רטרואקטיבי.
   *
   * ברירת המחדל היא main בכוונה: כך המספר שמוצג באנליטיקות
   * ממשיך להיות בדיוק מה שהוא היה, והפיילוט נוסף ולא מערבב.
   */
  const wanted = (req.nextUrl.searchParams.get("cohort") ?? "main").toLowerCase();
  const { data: people } = await db.from("candidates").select("id, cohort");
  const cohortOf = new Map<string, string>((people ?? []).map(p => [String(p.id), String(p.cohort ?? "main")]));

  const cohortCounts: Record<string, number> = {};
  for (const c of cohortOf.values()) cohortCounts[c] = (cohortCounts[c] ?? 0) + 1;

  /* מי שאינו בטבלה (אירוע יתום) נחשב main — כמו ברירת המחדל ב-DB */
  const events = wanted === "all" ? all
    : all.filter(e => (cohortOf.get(String(e.candidate_id)) ?? "main") === wanted);

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

  let program: Awaited<ReturnType<typeof programFunnel>> | null = null;
  try { program = await programFunnel(db, wanted); }
  catch (e) { console.error("[funnel] program funnel failed:", e); }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    cohort: wanted,
    program,
    cohortCounts,
    sampled: events.length,
    sampledAll: all.length,
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
