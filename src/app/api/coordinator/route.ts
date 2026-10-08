/**
 * GET /api/coordinator — הנתונים למסך הרכזת.
 *
 * רץ בצד שרת עם המפתח הסודי (SUPABASE_SECRET_KEY), כי ה-RLS מגביל כל מועמד
 * לשורה שלו — והרכזת צריכה לראות את כולם. **המפתח לעולם לא מגיע לדפדפן.**
 *
 * כוכב הצפון של המסך: "מי צריך אותי היום" — תור חילוץ, לא CRM. לכן ה-API
 * מחזיר סיגנלים ממוינים לפי דחיפות, וכל סיגנל נושא את הסיבה שלו במילים.
 *
 * שער גישה: verifyCoordinator (7.9) — קוד חירום משותף, או זהות אישית
 * מ-OTP. כשידועה זהות אישית, הרשימה מסוננת ל"שלי" — מועמד/ת ששויכו
 * לרכזת אחרת מוסתרים, אבל מי שעוד לא שויך/ה לאף אחד/ת נשאר/ת גלוי/ה
 * לכולם (אחרת שיוך חסר = מועמד/ת שנעלם/ת בלי שאיש רואה).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCoordinator, canSeeEveryone } from "@/lib/serverCoordinatorAuth";
import { mondayBoard, mondaySetCoordinator, type BoardRow } from "@/lib/monday";

export const dynamic = "force-dynamic";

type Signal = {
  severity: 1 | 2 | 3; // 1 = הכי דחוף
  reason: string;
  action: "call" | "whatsapp" | "watch";
};

export async function GET(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });
  }

  const db = createClient(url, secret, { auth: { persistSession: false } });

  const [candidates, events, tasks, scct, ranks] = await Promise.all([
    db.from("candidates")
      .select("id, first_name, last_name, region, current_stage, last_active_at, created_at, chosen_domain, coordinator_id, cohort, phone, phone_verified, onboarding_completed_at, is_test")
      .order("last_active_at", { ascending: false }),
    db.from("funnel_events")
      .select("candidate_id, name, props, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    db.from("plan_tasks")
      .select("candidate_id, title, due_date, status, open_count"),
    db.from("scct_scores")
      .select("candidate_id, domain_id, interest, self_efficacy"),
    // לאן הוא הלך: הדירוג מהחשיפה. מוצג לצד התחום שנבחר בסוף
    db.from("domain_rankings")
      .select("candidate_id, domain_id, rank")
      .order("rank", { ascending: true }),
  ]);

  const err = candidates.error ?? events.error ?? tasks.error ?? scct.error ?? ranks.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  const now = Date.now();
  const DAY = 86400000;

  /**
   * תאריך בטוח.
   *
   * `new Date("משהו לא תקין").toISOString()` **זורק RangeError**, ובמסלול
   * הזה שגיאה אחת מפילה את כל התשובה — כלומר שורה פגומה אחת מחשיכה את
   * המסך לכל הרכזות. מחזיר 0 במקום להתפוצץ.
   */
  const ms = (v: unknown): number => {
    const t = v ? new Date(v as string).getTime() : NaN;
    return Number.isFinite(t) ? t : 0;
  };
  const iso = (t: number): string | null =>
    Number.isFinite(t) && t > 0 ? new Date(t).toISOString() : null;

  let skipped = 0;

  // כניסה אישית (7.9) — "מי צריך אותי" מסונן לשלי + מי שעוד לא שויך לאף אחת
  /*
    ⚠️ שורה ב-candidates נוצרת ב**כל כניסה ראשונה לאפליקציה** — ensureCandidateId
    עושה signInAnonymously ואז upsert, עוד לפני שנשאלה שאלה אחת. כלומר הטבלה
    סופרת **דפדפנים, לא אנשים**: ב-4.10 היו בה 87 שורות, מהן 4 עם שם.
    השאר הן בדיקות שלנו וכניסות חטופות.

    בלי הסינון הזה הרכזת פותחת את התור ורואה 87 "מועמדים" שרובם רוחות —
    מסך שמשקר בשקט, ובדיוק בכיוון שהופך אותו לחסר שימוש: מי שבאמת צריך
    אותה נקבר ברעש.

    **הסף הוא התחלת אונבורדינג ולא סיומו** — מי שהתחיל ונטש הוא בדיוק
    מי שהיא צריכה לראות.
  */
  /*
    ── מי רואה מה (4.10) ──────────────────────────────────────────────
    רכזת רואה את שלה. **מנהלת רואה את כולן**, ויכולה לצפות בתצוגה של
    רכזת מסוימת עם ?as= — כדי שתוכל לשבת לידה ולראות בדיוק את המסך שלה.
    זה מחליף את הפתרון שהיה: לחלוק קוד חירום, שמוחק את התיעוד של מי עשה מה.
  */
  const viewAs = req.nextUrl.searchParams.get("as");
  const effectiveId =
    canSeeEveryone(auth.role) ? (viewAs || null) : auth.coordinatorId;

  const real = (candidates.data ?? []).filter(
    c =>
      /*
        רשומות בדיקה מסומנות ב-is_test (מיגרציה 010). סינון לפי תוכן לא
        יכול לתפוס אותן — "שדגלח ראר" נראה כמו שם — ולכן הסימון מפורש,
        והכלל האוטומטי הוא שטלפון של רכזת לעולם אינו מועמד אמיתי.
      */
      !c.is_test &&
      (String(c.first_name ?? "").trim() || c.onboarding_completed_at || String(c.phone ?? "").trim())
  );

  const myCandidates = effectiveId
    ? real.filter(c => !c.coordinator_id || c.coordinator_id === effectiveId)
    : real;

  let staff: { id: string; name: string }[] = [];
  /* נטען תמיד — גם רכזת צריכה שהמזהה יתורגם לשם על הכרטיס */
  {
    const { data } = await db.from("coordinators")
      .select("id, name").eq("active", true).neq("name", "").order("name");
    staff = (data ?? []) as { id: string; name: string }[];
  }
  const staffNames = new Map(staff.map(c => [c.id, c.name]));

  const queue = myCandidates.flatMap(c => {
   try {
    const signals: Signal[] = [];
    const myEvents = (events.data ?? []).filter(e => e.candidate_id === c.id);
    const myTasks = (tasks.data ?? []).filter(t => t.candidate_id === c.id);
    const myScct = (scct.data ?? []).filter(s => s.candidate_id === c.id);
    const myRanks = (ranks.data ?? []).filter(r => r.candidate_id === c.id).map(r => r.domain_id as string);

    // 1 — פספוס פגישה: הסיגנל החזק ביותר בפאנל
    const missed = myEvents.find(e => e.name === "meeting1_checkin" && (e.props as { result?: string })?.result === "missed");
    if (missed) {
      const days = Math.floor((now - ms(missed.created_at)) / DAY);
      signals.push({ severity: 1, reason: `סימן/ה "לא הצלחתי להגיע" לפגישת ההיכרות${days > 0 ? ` — לפני ${days} ימים` : " — היום"}`, action: "call" });
    }

    /*
     * 2 — עצר בשער בחירת הכיוון: ראה את המסך ולא בחר.
     * האופציה "עוד לא סגור" הוסרה בכוונה (נתי 20.8) — ולכן מי שעומד מול
     * השער בלי לבחור חייב להפוך לסיגנל, אחרת לקחנו את פתח המילוט
     * בלי לשים שם רכזת.
     */
    const gate = myEvents.find(e => e.name === "paths_domain_gate");
    const committedDomain = myEvents.some(e => e.name === "domain_committed") || !!c.chosen_domain;
    if (gate && !committedDomain) {
      const days = Math.floor((now - ms(gate.created_at)) / DAY);
      if (days >= 2) {
        signals.push({ severity: 2, reason: `הגיע/ה לבחירת הכיוון בשלב 4 ולא בחר/ה — ${days} ימים. שווה שיחה על התחום`, action: "call" });
      }
    }

    // 1 — דדליין מלגה שעבר עם משימה פתוחה: כסף שלא יחזור
    for (const t of myTasks) {
      if (t.status === "open" && t.due_date && ms(t.due_date) < now) {
        signals.push({ severity: 1, reason: `דדליין עבר והמשימה פתוחה: ${t.title}`, action: "call" });
      }
    }

    /*
     * שתי שתיקות שונות — וזו החשובה מבין השתיים היא השנייה.
     *
     * "נכנס" = last_active_at, שנוגעים בו בכל ניווט. אבל השדה נכתב מהשעון
     * של המכשיר, ואצל חלק מהאנשים הוא שגוי — ולכן לוקחים את המקסימום מול
     * האירוע האחרון, שמקבל חותמת מהשרת ואי אפשר לטעות בו.
     *
     * "עשה משהו" = האירוע המשמעותי האחרון. מי שנעלם לגמרי אולי סתם עסוק;
     * מי שנכנס שוב ושוב ולא מצליח להתקדם הוא מי שנתקע ולא יבקש עזרה
     * מעצמו. זה הכי קרוב שנגיע לראות חיכוך דרך המסך.
     */
    const lastEventAt = myEvents.length ? ms(myEvents[0].created_at) : 0;
    const seenAt = Math.max(ms(c.last_active_at), lastEventAt);
    const idleDays = (now - seenAt) / DAY;

    const doing = myEvents.find(e => e.name !== "app_open");
    const actionDays = doing ? (now - ms(doing.created_at)) / DAY : Infinity;

    if (idleDays >= 3 && c.current_stage >= 2) {
      signals.push({ severity: 2, reason: `לא נכנס/ה ${Math.floor(idleDays)} ימים`, action: "whatsapp" });
    } else if (idleDays < 2 && c.current_stage >= 2) {
      // נכנס, אבל לא זז — הסיגנל של "תקוע", לא של "נעלם"
      if (!doing) {
        const since = Math.floor((now - ms(c.created_at)) / DAY);
        signals.push({
          severity: 2,
          reason: `נכנס/ה אבל עוד לא התחיל/ה כלום${since > 0 ? ` — ${since} ימים מאז ההרשמה` : ""}`,
          action: "call",
        });
      } else if (actionDays >= 5) {
        signals.push({
          severity: 2,
          reason: `נכנס/ה לאחרונה אבל לא התקדם/ה ${Math.floor(actionDays)} ימים — כנראה תקוע/ה`,
          action: "call",
        });
      }
    }

    // 2 — משימה שנפתחה 3 פעמים בלי להיסגר: משהו תקוע
    for (const t of myTasks) {
      if (t.status === "open" && (t.open_count ?? 0) >= 3) {
        signals.push({ severity: 2, reason: `נפתחה 3 פעמים בלי להיסגר: ${t.title}`, action: "whatsapp" });
      }
    }

    // 3 — מדד השליחות: עניין גבוה, מסוגלות נמוכה. שיחה מחזקת, לא חילוץ
    for (const s of myScct) {
      if ((s.interest ?? 0) >= 4 && (s.self_efficacy ?? 0) <= 2) {
        signals.push({ severity: 3, reason: `עניין גבוה (${s.interest}) ומסוגלות נמוכה (${s.self_efficacy}) ב${s.domain_id} — שווה שיחה מחזקת`, action: "whatsapp" });
      }
    }

    /*
     * צ'קליסט התהליך — תשע אבני דרך, כולן נגזרות ממה שקרה (אירועים,
     * שדות, משימות) ולא ממה שדווח. זה מה שהרכזת רואה קודם; יומן
     * האירועים הגולמי משרת אנליטיקות, לא אותה.
     */
    const has = (n: string, pred?: (props: Record<string, unknown>) => boolean) =>
      myEvents.some(e => e.name === n && (!pred || pred((e.props ?? {}) as Record<string, unknown>)));
    const tastedDomains = new Set(
      myEvents
        .filter(e => e.name === "scct_done" || e.name === "sim_start")
        .map(e => String((e.props as { domain?: string } | null)?.domain ?? ""))
        .filter(Boolean)
    ).size;
    /*
      הצ׳קליסט נגזר מהקוהורט (31.8): לבוגרי טק-קריירה אין שלב
      טעימות ואין פגישת בחירת תחום. שורה שלעולם לא תסומן אינה
      "משימה פתוחה" — היא רעש שמסתיר את מי שבאמת תקוע.
    */
    const cohort = String(c.cohort ?? "main");
    const checklist = [
      { label: "נרשם/ה לאפליקציה", done: true },
      { label: "קבע/ה פגישת היכרות", done: has("meeting_booked", pr => pr.n === "1") || has("meeting1_checkin") },
      { label: "הגיע/ה לפגישה 1", done: has("meeting1_checkin", pr => pr.result === "yes") },
      ...(cohort === "alumni" ? [] : [
        { label: "טעם/ה תחומים", done: tastedDomains > 0, detail: tastedDomains ? `${tastedDomains} תחומים` : undefined },
        { label: "קבע/ה פגישת בחירת תחום", done: has("meeting_booked", pr => pr.n === "2") },
        { label: "בחר/ה כיוון", done: has("domain_committed") || !!c.chosen_domain },
      ]),
      { label: cohort === "alumni" ? "קבע/ה פגישה 2 — נעילת מסלול" : "קבע/ה פגישת נעילת מסלול", done: has("meeting_booked", pr => pr.n === "3") },
      { label: "בחר/ה מוסד", done: has("institution_committed") },
      { label: "נרשם/ה ללימודים", done: myTasks.some(t => t.status === "done" && /הרשמה/.test(t.title ?? "")) || has("enrollment_doc_uploaded") },
      { label: "העלה/תה אישור לימודים", done: has("enrollment_doc_uploaded") },
    ];

    const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "מועמד/ת ללא שם";
    return [{
      id: c.id,
      name,
      anonymous: !c.first_name,
      region: c.region,
      /* לזיהוי באיזור השיוך (16.9) — אותו טלפון שכבר מוצג לרכזת בכל מקום אחר */
      phone: c.phone || null,
      stage: c.current_stage,
      domain: c.chosen_domain,
      coordinatorId: c.coordinator_id ?? null,
      /*
        ⚠️ **השם ולא רק המזהה** (8.10). המזהה הוחזר מאז 20.8 ואף מסך לא
        הציג אותו — נתי ראה כרטיס מסע בלי רכז/ת והניח שהשיוך חסר, בזמן
        שהוא היה מלא. מזהה שאף אחד לא מתרגם שווה לשדה ריק.
      */
      coordinatorName: staffNames.get(c.coordinator_id ?? "") ?? null,
      /* false = הוקלד ביד ולא אומת ב-SMS. ראה מיגרציה 014 */
      phoneVerified: !!c.phone_verified,
      /* בוגרי טק-קריירה מדלגים על שלב הטעימות — בלי זה הם ייראו לרכזת
         תקועים לנצח בתחנה שאינה שלהם, ותור החילוץ יתמלא ברעש */
      cohort: c.cohort ?? "main",
      ranked: myRanks,
      lastActive: iso(seenAt),
      lastAction: doing?.created_at ?? null,
      checklist,
      signals: signals.sort((a, b) => a.severity - b.severity),
      topSeverity: signals.length ? Math.min(...signals.map(s => s.severity)) : 9,
      // ציר הזמן — למסך הפרט: מה קרה, בסדר הפוך
      timeline: myEvents.slice(0, 40).map(e => ({ name: e.name, props: e.props, at: e.created_at })),
    }];
   } catch (e) {
    // שורה פגומה לא מפילה את המסך — היא מדולגת ונספרת, כדי שלא תיעלם בשקט
    console.error("coordinator: skipping candidate", c.id, e);
    skipped++;
    return [];
   }
  });

  queue.sort((a, b) => a.topSeverity - b.topSeverity || ms(b.lastActive) - ms(a.lastActive));

  /*
   * הזמנות Cal עתידיות שלא הותאמו למועמד לפי טלפון — תור שיוך ידני.
   * (ההתאמה האוטומטית היא התאמה מלאה בלבד; ניחוש לפי שם היה מסוכן.)
   */
  /*
    כל הפגישות של הרכזת הנצפית — עבר ועתיד, מותאמות ולא (4.10).
    קודם היה כאן רק תור החריגים, וזה ענה על "מי לא זוהה" אבל לא על
    השאלה שהרכזת באמת שואלת: **"מי קבע איתי ומתי"**. היומן שלה מלא
    ומסך הניהול הראה יומן ריק — מסך שאי אפשר לסמוך עליו.
  */


  let myBookings: unknown[] = [];
  try {
    let qb = db
      .from("cal_bookings")
      .select("id, title, start_time, attendee_name, attendee_phone, attendee_email, trigger, candidate_id, coordinator_id, outcome, outcome_at, outcome_note")
      .order("start_time", { ascending: false })
      .limit(200);
    /* רכזת רואה את שלה; מנהל התוכנית (בלי זיהוי רכזת) רואה הכל */
    if (effectiveId) qb = qb.eq("coordinator_id", effectiveId);
    const { data } = await qb;
    myBookings = data ?? [];
  } catch { /* הטבלה או העמודה עוד לא קיימות — לא שוברים את המסך */ }

  let unmatched: unknown[] = [];
  try {
    const { data } = await db
      .from("cal_bookings")
      .select("id, title, start_time, attendee_name, attendee_phone, trigger")
      .is("candidate_id", null)
      .gte("start_time", new Date().toISOString())
      .neq("trigger", "BOOKING_CANCELLED")
      .order("start_time")
      .limit(20);
    unmatched = data ?? [];
  } catch { /* הטבלה או העמודה עוד לא קיימות — לא שוברים את המסך */ }

  /*
   * ── הרשימה מהלוח (נתי, 5.10) ───────────────────────────────────────────────
   * `queue` נבנה מ-candidates, כלומר **רק ממי שכבר נכנס לאפליקציה**. נכון
   * להיום אף אחד מה-44 לא נכנס, ולכן הטאב "כל המשתתפים" היה ריק בזמן
   * שלרכזת 21 אנשים בליווי. הבעלות על "מי נמצא ברשימה" היא של לוח אינטק.
   *
   * ⚠️ הטלפון הוא המפתח שמחבר — `inApp` נגזר ממנו, ולכן אדם שהקליד
   * באפליקציה מספר אחר ייראה כאן כמי שלא נכנס. זו הסיבה שהסתירה הזאת
   * נספרת בסריקת הסנכרון במקום להיות מוסקת כאן בשקט.
   *
   * ⚠️ בלי MONDAY_TOKEN מחזיר null והמסך נופל חזרה להתנהגות הקודמת בדיוק.
   */
  let board: (BoardRow & { inApp: boolean; nextMeeting: string | null })[] | null = null;
  try {
    const rows = await mondayBoard(auth.role === "coordinator" ? auth.name : null);
    if (rows) {
      const appPhones = new Set(
        (candidates.data ?? []).map(c => String(c.phone ?? "").replace(/\D/g, "")).filter(Boolean)
      );
      const nextBy = new Map<string, string>();
      for (const b of (myBookings as { attendee_phone?: string; start_time?: string; trigger?: string }[])) {
        const ph = (b.attendee_phone ?? "").replace(/\D/g, "");
        if (!ph || !b.start_time || b.trigger === "BOOKING_CANCELLED") continue;
        if (b.start_time < new Date().toISOString()) continue;
        const cur = nextBy.get(ph);
        if (!cur || b.start_time < cur) nextBy.set(ph, b.start_time);
      }
      board = rows.map(r => ({
        ...r,
        inApp: !!r.phone && appPhones.has(r.phone),
        nextMeeting: nextBy.get(r.phone) ?? null,
      }));
    }
  } catch { /* מאנדיי לא זמין — המסך ממשיך בלעדיו */ }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    board,
    unmatchedBookings: unmatched,
    myBookings,
    role: auth.role,
    viewingAs: effectiveId,
    /* המנהלת צריכה את הרשימה כדי לבחור את מי לצפות */
    staff: canSeeEveryone(auth.role) ? staff : [],
    needsAttention: queue.filter(q => q.signals.length > 0),
    quiet: queue.filter(q => q.signals.length === 0).length,
    // הרשימה המלאה — לטאב ״כל המשתתפים״ ולדף מנהל התוכנית (20.8)
    quietList: queue.filter(q => q.signals.length === 0),
    total: queue.length,
    skipped, // שורות שלא ניתן היה לחשב — 0 במצב תקין
  });
}

/**
 * POST /api/coordinator — שיוך רכזת למועמד (מדף מנהל התוכנית).
 * אותו שער גישה. דורש את עמודת coordinator_id (מיגרציה 003) — עד שהיא
 * רצה, מוחזרת שגיאה מפורשת במקום כישלון שקט.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as
    { candidateId?: string; coordinatorId?: string; phone?: string } | null;
  if (!body?.candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });

  /*
   * ── טלפון שהוקלד ביד (נתי, 8.10) ─────────────────────────────────────────
   * מי שלא הסתדר עם אימות ה-SMS נכנס בלי טלפון, ואז הוא **בלתי נראה לכל
   * החיבורים**: הזמנת Cal לא מותאמת, השורה בלוח לא מתחברת, והרכזת לא
   * רואה שהוא בכלל נכנס.
   *
   * ⚠️ **נשמר עם `phone_verified = false`.** טלפון מ-OTP הוא הוכחה שהמכשיר
   * ביד שלו; טלפון שהוקלד הוא טענה. השימוש היחיד שדורש הוכחה הוא שיוך
   * לקוהורט — שם ניחוש היה מכניס אדם למסע הלא נכון. לכל השאר טענה מספיקה.
   */
  if (typeof body.phone === "string") {
    const digits = body.phone.replace(/\D/g, "");
    const norm = digits.startsWith("972") ? digits
      : digits.startsWith("0") ? "972" + digits.slice(1)
      : digits.length === 9 ? "972" + digits : digits;
    if (norm && !/^9725\d{8}$/.test(norm)) {
      return NextResponse.json({ error: "זה לא נראה כמו נייד ישראלי" }, { status: 400 });
    }
    const dbp = createClient(url, secret, { auth: { persistSession: false } });
    if (norm) {
      const { data: clash } = await dbp.from("candidates")
        .select("id").eq("phone", norm).neq("id", body.candidateId).limit(1);
      if (clash?.length) {
        return NextResponse.json({ error: "המספר הזה כבר משויך למשתתף אחר" }, { status: 409 });
      }
    }
    const { error: pe } = await dbp.from("candidates")
      .update({ phone: norm || null, phone_verified: false })
      .eq("id", body.candidateId);
    if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
    if (!body.coordinatorId) return NextResponse.json({ ok: true, phone: norm });
  }

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const { error } = await db
    .from("candidates")
    .update({ coordinator_id: body.coordinatorId || null })
    .eq("id", body.candidateId);

  if (error) {
    const missing = /coordinator_id/.test(error.message);
    return NextResponse.json(
      { error: missing ? "העמודה coordinator_id חסרה — להריץ את supabase/migrations/003 בדשבורד" : error.message },
      { status: missing ? 409 : 500 },
    );
  }
  /*
   * ── השיוך נכתב גם ללוח (נתי, 8.10) ────────────────────────────────────────
   * **הלוח הוא הבעלים של "של מי האדם הזה"**, והמסך הזה הוא שלט רחוק אליו.
   * לא סנכרון דו-כיווני: שני צדדים שכותבים לאותו שדה ודוחפים זה לזה יוצרים
   * לולאה, ו**גרוע מכך — אין תשובה לשאלה מי מנצח כששניהם השתנו**. לשדה
   * "של מי האדם" ערך ישן שמנצח גונב משתתף בשקט.
   *
   * ⚠️ כישלון כאן לא מבטל את השמירה ב-DB — האדם כבר משויך, והלוח יתעדכן
   * בניסיון הבא. אבל הוא מדווח, כדי שלא ייווצר פער שקט בין השניים.
   */
  let board: string | null = null;
  try {
    const { data: who } = await db.from("candidates").select("phone").eq("id", body.candidateId).maybeSingle();
    const { data: co } = body.coordinatorId
      ? await db.from("coordinators").select("name").eq("id", body.coordinatorId).maybeSingle()
      : { data: null };
    if (who?.phone) {
      const res = await mondaySetCoordinator(who.phone, co?.name ?? null);
      if (res === false) board = "השיוך נשמר, אבל לא נמצאה שורה תואמת בלוח אינטק";
    } else {
      board = "השיוך נשמר, אבל אין לאדם הזה טלפון — אי אפשר להתאים לשורה בלוח";
    }
  } catch { board = "השיוך נשמר, אבל העדכון ללוח נכשל"; }

  return NextResponse.json({ ok: true, ...(board ? { boardWarning: board } : {}) });
}

/**
 * PATCH /api/coordinator — שינוי קוהורט ידני (16.9).
 *
 * רשת הביטחון שמפרט הפיילוט (docs/pilot-alumni-spec.md, סעיף 3, דליפה ד)
 * דורש: "הקוהורט ניתן לשינוי באדמין בלבד, ולא על ידי ביקור חוזר ב-URL".
 * ההתאמה האוטומטית (POST /api/candidate/sync-cohort) יכולה לפספס — מספר
 * שהוקלד לא מדויק ברשימת מאנדיי, או בוגר/ת שנרשמו לפני שהרשימה יובאה.
 * זה הכלי לתקן שיוך שגוי בלי לגעת ב-DB ישירות.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as { candidateId?: string; cohort?: string } | null;
  if (!body?.candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  if (body.cohort !== "main" && body.cohort !== "alumni") {
    return NextResponse.json({ error: "cohort חייב להיות main או alumni" }, { status: 400 });
  }

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const { error } = await db
    .from("candidates")
    .update({ cohort: body.cohort })
    .eq("id", body.candidateId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
