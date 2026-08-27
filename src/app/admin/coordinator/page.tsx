/**
 * /admin/coordinator — מסך הרכזת: תור החילוץ.
 *
 * כוכב הצפון: **"מי צריך אותי היום."** לא CRM ולא טבלת כולם — רשימה ממוינת
 * לפי דחיפות, וכל שורה היא אדם + הסיגנל במילים + פעולה אחת.
 *
 * מה שבכוונה אין כאן: ציונים, אחוזים, השוואות בין מועמדים. המסך משרת
 * התערבות, לא הערכה — ברגע שרכזת מדרגת אנשים, המספרים הופכים למטרה.
 *
 * הנתונים מ-/api/coordinator (צד שרת, מפתח סודי). הגישה בקוד רכזת שנשמר
 * מקומית אחרי הזנה ראשונה — שכבת הגנה מינימלית עד שיהיה Auth אמיתי.
 */
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { FUNDING } from "@/data/scholarships";
import Link from "next/link";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const SEV_META: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "דחוף", color: "#b91c1c", bg: "rgba(220,38,38,0.08)" },
  2: { label: "שווה פנייה", color: "#92400e", bg: "rgba(251,133,0,0.09)" },
  3: { label: "שיחה מחזקת", color: "#0369a1", bg: "rgba(14,165,233,0.08)" },
};


const DOMAIN_HE: Record<string, string> = {
  data: "דאטה", cyber: "סייבר", networks: "רשתות", code: "קוד",
  qa: "בדיקות תוכנה", ai: "AI", ux: "UX", marketing: "שיווק דיגיטלי",
};

/** שש שאלות כלי עיבוד החוויה — כדי שנדע *באיזו* מהן נעצרו */
const SCCT_HE: Record<string, string> = {
  interest_scale: "שאלת העניין",
  interest_open: "העניין — בכתיבה חופשית",
  efficacy_scale: "שאלת המסוגלות",
  efficacy_open: "המסוגלות — בכתיבה חופשית",
  outcome_scale: "שאלת הציפיות",
  outcome_open: "הציפיות — בכתיבה חופשית",
};

type Ev = { name: string; props: Record<string, unknown>; at: string };

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const dom = (v: unknown) => DOMAIN_HE[s(v)] ?? s(v);
const DOMAIN_DOT: Record<string, string> = {
  code: "#3b82f6", data: "#0d9488", cyber: "#dc2626", networks: "#2563eb",
  qa: "#d97706", hardware: "#0891b2", ai: "#7c3aed", ux: "#db2777", marketing: "#f97316",
};

/**
 * אירוע → משפט בעברית.
 *
 * הרכזת קוראת את זה חמש דקות לפני שיחה, אז אין כאן שמות אירועים ואין
 * JSON — רק מה קרה. מה שאין לו ניסוח מוצג כמו שהוא, כדי שאירוע חדש
 * לא ייעלם מהמסך בשקט.
 */
const TASTE_STEP_HE: Record<string, string> = {
  sim: "את הסימולציה", day: "את יום-בחיי", mystery: "את משימת העומק",
  experience: "את עיבוד החוויה", analytics: "את מרכז הלמידה",
};

/** שם מלגה ממזהה — "poalim-success" ← השם האמיתי מהדאטה */
function fundName(id: string): string {
  const f = FUNDING.find(x => x.id === id);
  return f ? f.name.split(" — ")[0] : id;
}

/** מזהי משימות תוכנית: s-close-<מלגה> / s-open-<מלגה> / r-check-<מוסד> */
function taskName(id: string): string {
  if (id.startsWith("s-close-")) return "להגיש ל" + fundName(id.slice(8));
  if (id.startsWith("s-open-")) return "ההרשמה ל" + fundName(id.slice(7)) + " נפתחת";
  if (id.startsWith("r-check-")) return "בירור הרשמה מול " + id.slice(8).split(" — ")[0];
  if (id === "m-math") return "לראות את החשבון";
  if (id === "h-commute") return "לבדוק את הנסיעה";
  return id;
}

function describe(e: Ev): string {
  const p = e.props ?? {};
  switch (e.name) {
    case "meeting_booked":         return `קבע/ה את פגישה ${s(p.n)}`;
    case "meeting_self_declared":  return `הצהיר/ה שכבר קבע/ה את פגישה ${s(p.n)} — אין לזה אישור ביומן`;
    case "meeting_open":           return `נכנס/ה למסך תיאום פגישה ${s(p.n)}`;
    case "meeting_calendar_ready": return `היומן נטען`;
    case "meeting2_checkin":       return s(p.result) === "yes" ? "פגישה 2 — ״היה טוב״" : "פגישה 2 — לא הצליח/ה להגיע ⚠️";
    case "meeting3_checkin":       return s(p.result) === "yes" ? "פגישה 3 — ״היה טוב״" : "פגישה 3 — לא הצליח/ה להגיע ⚠️";
    case "student_checkin":        return s(p.result) === "ok" ? "צ'ק-אין סטודנט/ית — מסתדר/ת 💪" : "צ'ק-אין סטודנט/ית — קשה לו/לה ⚠️ להתקשר";
    case "meeting1_checkin":       return s(p.result) === "missed" ? "סימן/ה שלא הצליח/ה להגיע לפגישה" : "סימן/ה שהפגישה הייתה טובה";
    case "sim_start":              return `נכנס/ה לסימולציית ${dom(p.domain)}`;
    case "sim_step":               return `סימולציית ${dom(p.domain)} — צעד ${s(p.i)} מתוך ${s(p.of)}${p.concept ? ` · ${s(p.concept)}` : ""}`;
    case "scct_done":              return `סיים/ה את כלי עיבוד החוויה ב${dom(p.domain)}`;
    case "scct_step":              return `כלי עיבוד החוויה ב${dom(p.domain)} — ${SCCT_HE[s(p.q)] ?? s(p.q)}`;
    case "paths_question":         return `ענה/תה על שאלה ${s(p.answered)} בשאלון המסלולים`;
    case "paths_quiz_done":        return `סיים/ה את השאלון — ההמלצה שיצאה: ${s(p.recommendation)}`;
    case "paths_blocker_open":     return `הוצג לו/ה החסם: ${s(p.blocker)}`;
    case "paths_solution_click":   return `פתח/ה פתרון: ${s(p.solution)}`;
    case "plan_money_opened":      return "פתח/ה את מסך החשבון";
    case "plan_task_open":         return `חזר/ה למשימה "${taskName(s(p.task))}" — פעם ${s(p.count)}`;
    case "paths_domain_gate":      return "הגיע/ה לשער בחירת הכיוון";
    case "domain_committed":       return `בחר/ה כיוון: ${s(p.domains).split(",").map(dom).join(" + ")}`;
    case "domain_switch":          return `החליף/ה תחום פעיל ל${dom(p.to)}`;
    case "plan_inst_gate":         return "הגיע/ה לשער בחירת המוסד";
    case "institution_committed":  return `בחר/ה מוסד: ${s(p.main).split(" — ")[0]}${p.backup ? ` · גיבוי: ${s(p.backup).split(" — ")[0]}` : ""}`;
    case "plan_scholarship_pick":  return s(p.on) === "true" ? `הוסיף/ה לחשבון את ${fundName(s(p.id))}` : `הסיר/ה מהחשבון את ${fundName(s(p.id))}`;
    case "paths_solution_open":    return `התעניין/ה בפתרון: ${s(p.solution)}`;
    case "taste_done":             return `השלים/ה ${TASTE_STEP_HE[s(p.step)] ?? s(p.step)} ב${dom(p.domain)}`;
    case "enrollment_doc_uploaded": return "העלה/תה אישור לימודים 🎓";
    case "profile":                return "השלים/ה את פרטי הפרופיל";
    case "plan_update_sent":       return "שלח/ה עדכון לרכזת";
    case "plan_intro_done":        return "נכנס/ה לשלב התוכנית";
    case "waiting_taste_start":    return "התחיל/ה את שתי הדקות";
    case "waiting_taste_done":     return "סיים/ה את שתי הדקות";
    case "intro_start":            return "פתח/ה את המבוא לעולם ההייטק";
    case "intro_step":             return `במבוא להייטק — כרטיס ${s(p.n)} מתוך 7`;
    case "intro_done":             return "סיים/ה את המבוא לעולם ההייטק 🌍";
    case "waiting_prep_open":      return "קרא/ה את ההכנה לפגישה";
    case "waiting_booked_self_declared": return "סימן/ה 'כבר קבעתי'";
    default: {
      const extra = Object.values(p).map(s).filter(Boolean).join(" · ");
      return extra ? `${e.name} · ${extra}` : e.name;
    }
  }
}

/**
 * כיווץ רצפים.
 *
 * מי שעבר 12 צעדים בסימולציה ייצר 12 שורות שמציפות את הציר. האירועים
 * מגיעים מהחדש לישן, ולכן הראשון ברצף הוא **הרחוק ביותר שהגיע אליו** —
 * בדיוק מה שמעניין: איפה עצר.
 */
function compact(events: Ev[]): Ev[] {
  const out: Ev[] = [];
  for (const e of events) {
    const prev = out[out.length - 1];
    const sameRun =
      prev && prev.name === e.name &&
      (e.name === "sim_step" || e.name === "scct_step" || e.name === "paths_blocker_open") &&
      s(prev.props?.domain) === s(e.props?.domain);
    if (!sameRun) out.push(e);
  }
  return out;
}

/**
 * חלוקה לביקורים.
 *
 * פער של יותר מחצי שעה בין אירועים = יצא וחזר. זה מה שמאפשר להגיד
 * "היה כאן ארבע פעמים" ו"הביקור הזה ארך 12 דקות" — ובעיקר לזהות מי
 * שחוזר שוב ושוב לאותה נקודה בלי לעבור אותה.
 *
 * מה שהמדידה הזו **לא** יודעת: כמה זמן הוא ישב וקרא אחרי האירוע האחרון
 * בביקור. אין בנייד אירוע "יצא", ולכן משך ביקור הוא תמיד הערכת חסר.
 */
const SESSION_GAP = 30 * 60 * 1000;

function sessions(events: Ev[]): Ev[][] {
  const out: Ev[][] = [];
  let run: Ev[] = [];
  for (const e of events) { // מגיעים מהחדש לישן
    const prev = run[run.length - 1];
    if (prev && +new Date(prev.at) - +new Date(e.at) > SESSION_GAP) { out.push(run); run = []; }
    run.push(e);
  }
  if (run.length) out.push(run);
  return out;
}

/** מיקום בתוך המסע — הצעד/השאלה, בלי התחום. משמש לזיהוי "חזר לאותו מקום" */
function spot(e: Ev): string | null {
  if (e.name === "sim_step") return `sim:${s(e.props?.domain)}:${s(e.props?.i)}`;
  if (e.name === "scct_step") return `scct:${s(e.props?.domain)}:${s(e.props?.q)}`;
  if (e.name === "paths_question") return `quiz:${s(e.props?.answered)}`;
  return null;
}

function minutes(ms: number): string {
  const m = Math.round(ms / 60000);
  return m < 1 ? "פחות מדקה" : `${m} דקות`;
}

/**
 * "בקצרה" — המשפט שהרכזת קוראת אם היא קוראת רק דבר אחד.
 *
 * חמש דקות לפני שיחה אין זמן לקרוא ציר זמן. הציר הוא הגיבוי; זה הכותרת.
 */
function summarize(p: Person): string[] {
  const out: string[] = [];
  const visits = sessions(p.timeline);
  if (visits.length) {
    const total = visits.reduce((sum, v) => sum + (+new Date(v[0].at) - +new Date(v[v.length - 1].at)), 0);
    out.push(`${visits.length} כניסות · ${minutes(total)} בסך הכל`);
  }

  // איפה עצר — הצעד הרחוק ביותר בכל סימולציה/כלי, מהאירוע החדש ביותר
  const furthest = p.timeline.find(e => e.name === "sim_step" || e.name === "scct_step");
  if (furthest) out.push(`עצר/ה ב: ${describe(furthest)}`);

  // חזר לאותה נקודה בשתי כניסות נפרדות — סימן לחיכוך, לא לשכחה
  const seen = new Map<string, number>();
  visits.forEach((v, i) => v.forEach(e => {
    const k = spot(e);
    if (k && seen.get(k) !== i) seen.set(k, seen.has(k) ? -1 : i);
  }));
  if ([...seen.values()].some(v => v === -1)) out.push("חזר/ה לאותה נקודה ביותר מכניסה אחת");

  return out;
}

/** "לפני 3 ימים" / "היום" — כמה זמן עבר, במילים */
function ago(iso: string | null): string {
  if (!iso) return "עוד לא";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "היום";
  if (days === 1) return "אתמול";
  return `לפני ${days} ימים`;
}

type Person = {
  id: string; name: string; anonymous: boolean; region: string | null;
  stage: number; domain: string | null; ranked: string[]; lastActive: string | null; lastAction: string | null;
  signals: { severity: 1 | 2 | 3; reason: string; action: string }[];
  checklist: { label: string; done: boolean; detail?: string }[];
  timeline: Ev[];
};

/** צ'קליסט התהליך — קודם לציר האירועים: הרכזת צריכה "איפה הוא במסע", לא לוג */
/* ─── מסע הלקוח הוויזואלי (עיצוב 23.8) ──────────────────────────────────────
   סרפנטינה של 12 תחנות ב-6 שלבים. מצבי תחנה נגזרים מאירועים בלבד:
   הושלם / כאן עכשיו / עצר כאן / עוד לא הגיע — בלי רגשות מומצאים ובלי ציונים.
   תחנת עצירה מקבלת את הבולטות הגבוהה ביותר אחרי סיגנל, כולל משך העמידה. */

type Station = {
  id: string;
  stage: string;
  title: string;
  emoji: string;
  state: "done" | "current" | "stuck" | "future";
  date?: string | null;
  stuckDays?: number;
  signal?: boolean;
  chips: { text: string; kind: "info" | "quote" | "talk" | "stop" | "alert" }[];
  events: Ev[];
  action?: string;
};

const DAY_MS = 86400000;

/** בניית 12 התחנות מהאירועים — מקור אמת אחד, אפס דיווח עצמי */
function buildStations(p: Person): Station[] {
  const evs = [...p.timeline].reverse(); // מהישן לחדש
  const by = (name: string, pred?: (pr: Record<string, unknown>) => boolean) =>
    evs.filter(e => e.name === name && (!pred || pred((e.props ?? {}) as Record<string, unknown>)));
  const latest = (name: string, pred?: (pr: Record<string, unknown>) => boolean) => {
    const all = by(name, pred);
    return all.length ? all[all.length - 1] : null;
  };
  const S = (v: unknown) => (v == null ? "" : String(v));

  const tasted = [...new Set([...by("sim_start"), ...by("scct_done"), ...by("taste_done")]
    .map(e => S((e.props as Record<string, unknown>)?.domain)).filter(Boolean))];

  const m1 = latest("meeting1_checkin");
  const m1ok = m1 && S((m1.props as Record<string, unknown>)?.result) === "yes";
  const m1missed = m1 && S((m1.props as Record<string, unknown>)?.result) === "missed";

  const gate = latest("paths_domain_gate");
  const committed = latest("domain_committed");
  const instGate = latest("plan_inst_gate");
  const instCommitted = latest("institution_committed");
  const picks = [...new Set(by("plan_scholarship_pick")
    .map(e => S((e.props as Record<string, unknown>)?.id)).filter(Boolean))];
  const quizDone = latest("paths_quiz_done");
  const enrolled = (p.checklist ?? []).find(c => c.label.includes("נרשם/ה ללימודים"))?.done ?? false;
  const docUp = latest("enrollment_doc_uploaded");

  const def: Omit<Station, "state">[] = [
    { id: "signup", stage: "פתיחת חשבון", title: "נרשם/ה ומילא/ה שאלון בסיס", emoji: "📝",
      date: evs[0]?.at ?? null, chips: [], events: by("profile") },
    { id: "m1", stage: "היכרות", title: "פגישה 1 — נקבעה והתקיימה", emoji: "🗓",
      date: m1?.at ?? latest("meeting_booked", pr => S(pr.n) === "1")?.at ?? null,
      signal: !!m1missed,
      chips: m1ok ? [{ text: "״היה טוב״", kind: "quote" as const }]
        : m1missed ? [{ text: "לא הצליח/ה להגיע", kind: "alert" as const }] : [],
      events: [...by("meeting_open", pr => S(pr.n) === "1"), ...by("meeting_booked", pr => S(pr.n) === "1"), ...by("meeting1_checkin")] },
    { id: "taste", stage: "טעימות הייטק", title: "טעימות תחומים", emoji: "🧪",
      date: latest("scct_done")?.at ?? latest("sim_start")?.at ?? null,
      chips: tasted.length ? [{ text: "טעם/ה: " + tasted.map(dom).join(", "), kind: "info" as const }] : [],
      events: [...by("sim_start"), ...by("scct_done"), ...by("taste_done")] },
    { id: "m2", stage: "מסלול לימודים", title: "פגישה 2 — בחירת תחום", emoji: "🗓",
      date: latest("meeting_booked", pr => S(pr.n) === "2")?.at ?? null, chips: [],
      events: [...by("meeting_open", pr => S(pr.n) === "2"), ...by("meeting_booked", pr => S(pr.n) === "2")] },
    { id: "domain", stage: "", title: "בחירת כיוון", emoji: "🧭",
      date: committed?.at ?? null,
      chips: committed
        ? [{ text: "בחר/ה: " + S((committed.props as Record<string, unknown>)?.domains).split(",").map(dom).join(" + "), kind: "info" as const }]
        : [],
      events: [...by("paths_domain_gate"), ...by("domain_committed")] },
    { id: "quiz", stage: "", title: "שאלון אילוצים", emoji: "📋",
      date: quizDone?.at ?? null, chips: [],
      events: [...by("paths_question"), ...by("paths_quiz_done")] },
    { id: "inst-research", stage: "", title: "חקר מוסדות וחסמים", emoji: "🔍",
      date: latest("paths_solution_click")?.at ?? latest("paths_blocker_open")?.at ?? null, chips: [],
      events: [...by("paths_blocker_open"), ...by("paths_solution_click"), ...by("paths_solution_open")] },
    { id: "m3", stage: "מלגות והרשמה", title: "פגישה 3 — נעילת מסלול", emoji: "🗓",
      date: latest("meeting_booked", pr => S(pr.n) === "3")?.at ?? null, chips: [],
      events: [...by("meeting_open", pr => S(pr.n) === "3"), ...by("meeting_booked", pr => S(pr.n) === "3")] },
    { id: "inst", stage: "", title: "בחירת מוסד + גיבוי", emoji: "🏛",
      date: instCommitted?.at ?? null,
      chips: instCommitted
        ? [{ text: S((instCommitted.props as Record<string, unknown>)?.main).split(" — ")[0], kind: "info" as const }]
        : [],
      events: [...by("plan_inst_gate"), ...by("institution_committed")] },
    { id: "scholarships", stage: "", title: "בחירת מלגות", emoji: "💰",
      date: latest("plan_scholarship_pick")?.at ?? null,
      chips: picks.length ? [{ text: `${picks.length} מלגות בחשבון`, kind: "info" as const }] : [],
      events: [...by("plan_money_opened"), ...by("plan_scholarship_pick")] },
    { id: "anchor", stage: "", title: "העוגן: ההרשמה עצמה", emoji: "⚓",
      date: null, chips: [], events: by("plan_task_open") },
    { id: "student", stage: "סטודנט/ית", title: "אישור לימודים הועלה", emoji: "🎓",
      date: docUp?.at ?? null, chips: [], events: by("enrollment_doc_uploaded") },
  ];

  // מצב כל תחנה: מה הושלם — לפי ראיות; העצירה — שער שנראה בלי בחירה
  const doneFlags = [
    true,
    !!m1ok,
    tasted.length >= 2,
    !!latest("meeting_booked", pr => S(pr.n) === "2"),
    !!committed,
    !!quizDone,
    by("paths_solution_click").length > 0 || by("paths_blocker_open").length > 0,
    !!latest("meeting_booked", pr => S(pr.n) === "3"),
    !!instCommitted,
    picks.length > 0,
    enrolled,
    !!docUp,
  ];

  const now = Date.now();
  const daysSince = (iso?: string | null) => (iso ? Math.floor((now - +new Date(iso)) / DAY_MS) : 0);

  // התחנה הפתוחה הראשונה היא "כאן עכשיו" — או "עצר כאן" אם יש ראיית עמידה
  let currentIdx = doneFlags.findIndex(d => !d);
  if (currentIdx === -1) currentIdx = def.length - 1;

  return def.map((d, i) => {
    if (doneFlags[i]) return { ...d, state: "done" as const };
    if (i !== currentIdx) return { ...d, state: "future" as const, date: null };
    // עצירה מוכחת: שער נראה בלי בחירה יומיים+, או אי-תנועה שבוע כשנכנסים
    let stuckDays = 0;
    if (d.id === "domain" && gate && !committed) stuckDays = daysSince(gate.at);
    if (d.id === "inst" && instGate && !instCommitted) stuckDays = daysSince(instGate.at);
    if (!stuckDays && p.lastAction && daysSince(p.lastAction) >= 5 && p.lastActive && daysSince(p.lastActive) < 3) {
      stuckDays = daysSince(p.lastAction);
    }
    if (stuckDays >= 2) {
      return { ...d, state: "stuck" as const, stuckDays,
        chips: [...d.chips, { text: `⏸ ${stuckDays} ימים מול ${d.title}`, kind: "stop" as const }],
        action: p.signals[0]?.reason ? `הסיגנל הפעיל: ${p.signals[0].reason}` : "שיחת וואטסאפ קצרה — לשאול איפה זה עומד" };
    }
    return { ...d, state: "current" as const };
  });
}

const NODE_COLOR: Record<Station["state"], { bg: string; border: string; icon: string }> = {
  done:    { bg: "#059669", border: "#059669", icon: "#fff" },
  current: { bg: "#fb8500", border: "#fb8500", icon: "#fff" },
  stuck:   { bg: "#fff7ed", border: "#fb8500", icon: "#9a3412" },
  future:  { bg: "#fbf9f5", border: "#e2ddd3", icon: "#a8a195" },
};

function JourneyMap({ p, coordName, onBack }: { p: Person; coordName: string; onBack: () => void }) {
  const stations = useMemo(() => buildStations(p), [p]);

  /* הפרופיל מאירוע profile — גיל נגזר, שעון זכאות משוחררים נגזר, יו"ה מתנה */
  const profile = useMemo(() => {
    const e = p.timeline.find(ev => ev.name === "profile");
    const pr = (e?.props ?? {}) as Record<string, unknown>;
    const S = (v: unknown) => (v == null ? "" : String(v));
    const birth = S(pr.birthDate);
    const age = birth ? Math.floor((Date.now() - +new Date(birth)) / (365.25 * 24 * 3600 * 1000)) : null;
    const service = S(pr.service);
    const serviceLabel =
      service === "done-army" ? "סיים/ה שירות צבאי"
      : service === "done-national" ? "סיים/ה שירות לאומי"
      : service === "done" ? "סיים/ה שירות"
      : service === "serving" ? "משרת/ת עכשיו"
      : service === "none" ? "ללא שירות" : "";
    const discharge = S(pr.discharge);
    const miluimActive = S(pr.miluim) === "1";
    let clock: string | null = null;
    if (discharge) {
      /*
       * חלון הזכאות של האגף: 5 שנים מהשחרור — ו-10 למשרתי מילואים
       * פעילים ולחיילים בודדים. מילואים אנחנו שואלים באונבורדינג; בדידות
       * לא (שאלה רגישה) — ולכן כשחלון ה-5 נסגר, הנוסח מזכיר לרכזת לבדוק
       * גם את מסלול הבודד לפני שמוותרים.
       */
      const years = miluimActive ? 10 : 5;
      const end = new Date(discharge + "-01");
      end.setFullYear(end.getFullYear() + years);
      const months = Math.floor((+end - Date.now()) / (30.44 * 24 * 3600 * 1000));
      const basis = miluimActive ? " (10 שנים — מילואים פעיל)" : "";
      clock = months <= 0 ? (miluimActive ? "הסתיימה גם במסלול המילואים — לוודא מול האגף" : "חלון ה-5 נסגר — אם בודד/ה או מילואים: 10 שנים. לבדוק לפני שמוותרים")
        : months < 12 ? `עוד ${months} חודשים בלבד ⚠️${basis}`
        : `עוד כ-${Math.floor(months / 12)} שנים${basis}`;
    }
    let birthdaySoon = false;
    if (birth) {
      const b = new Date(birth); const now = new Date();
      const next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
      if (+next < +now) next.setFullYear(next.getFullYear() + 1);
      birthdaySoon = (+next - +now) / 86400000 <= 14;
    }
    return { age, city: S(pr.city), serviceLabel, clock, miluim: S(pr.miluim) === "1", birthdaySoon };
  }, [p.timeline]);
  /* מניפת הטעימות (נתי 26.8): התחומים שהמועמד באמת נגע בהם — מאירועי שרת */
  const tastedD = [...new Set(p.timeline
    .filter(e => ["sim_start", "scct_done", "taste_done"].includes(e.name))
    .map(e => String((e.props as Record<string, unknown>)?.domain ?? ""))
    .filter(d => d && DOMAIN_DOT[d]))];

  const stuck = stations.find(st => st.state === "stuck");
  const current = stuck ?? stations.find(st => st.state === "current") ?? null;
  const [openId, setOpenId] = useState<string | null>(stuck ? stuck.id : null);
  const open = stations.find(st => st.id === openId) ?? null;

  const idleDays = p.lastActive ? Math.floor((Date.now() - +new Date(p.lastActive)) / DAY_MS) : null;
  const actionDays = p.lastAction ? Math.floor((Date.now() - +new Date(p.lastAction)) / DAY_MS) : null;
  const inButStuck = idleDays !== null && idleDays < 2 && actionDays !== null && actionDays >= 5;

  const rows: Station[][] = [stations.slice(0, 4), stations.slice(4, 8), stations.slice(8, 12)];
  const visits = sessions(p.timeline);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto" }}>
      <style>{`@keyframes tcPulse { 0% { box-shadow: 0 0 0 0 rgba(251,133,0,.35); } 70% { box-shadow: 0 0 0 14px rgba(251,133,0,0); } 100% { box-shadow: 0 0 0 0 rgba(251,133,0,0); } }`}</style>

      <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: NAVY, padding: "4px 0", fontFamily: "'Heebo', sans-serif" }}>
        ← חזרה לרשימת המשתתפים
      </button>

      {/* כרטיס פרסונה */}
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 10px rgba(2,62,138,.06)", padding: "24px 28px", marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: NAVY, fontFamily: "'Heebo', sans-serif" }}>{p.name}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#8d867a" }}>
                {[profile.age ? `גיל ${profile.age}` : null, profile.city || null, p.region].filter(Boolean).join(" · ")}
              </span>
              {profile.birthdaySoon && (
                <span style={{ background: "#eef3fa", color: NAVY, fontWeight: 800, borderRadius: 999, padding: "2px 10px", fontSize: 12 }}>
                  🎂 יום הולדת בקרוב
                </span>
              )}
            </div>
            <div style={{ fontSize: 13.5, color: "#8d867a", marginTop: 6 }}>
              נראה/תה לאחרונה: <b style={{ color: "#1c1a16" }}>{ago(p.lastActive)}</b>
              {inButStuck && (
                <span style={{ marginRight: 10, background: "#fff7ed", border: "1.5px solid #fb8500", color: "#9a3412", fontWeight: 700, borderRadius: 999, padding: "3px 12px", fontSize: 12.5 }}>
                  נכנס/ת — ולא מתקדם/ת
                </span>
              )}
            </div>
          </div>
          {current && (
            <div style={current.state === "stuck"
              ? { background: "#fff7ed", border: "2.5px solid #fb8500", color: "#9a3412", borderRadius: 999, padding: "8px 18px", fontSize: 15, fontWeight: 900 }
              : { background: "#fb8500", color: "#fff", borderRadius: 999, padding: "8px 18px", fontSize: 15, fontWeight: 900, boxShadow: "0 3px 10px rgba(251,133,0,.35)" }}>
              {current.state === "stuck"
                ? `⏸ עצר/ה כאן: ${current.title} · ${current.stuckDays} ימים`
                : `🏃 כאן עכשיו: ${current.title} · בתנועה`}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {p.signals.length === 0 ? (
            <span style={{ background: "#ecfdf5", color: "#059669", fontWeight: 700, borderRadius: 999, padding: "4px 12px", fontSize: 12.5 }}>אין סיגנלים פעילים</span>
          ) : p.signals.map((sig, i) => (
            <span key={i} style={{ background: "#fef2f2", border: "1.5px solid #dc2626", color: "#dc2626", fontWeight: 700, borderRadius: 999, padding: "4px 12px", fontSize: 12.5, whiteSpace: "nowrap" }}>
              ⚠ {sig.reason}
            </span>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #f0ece2", marginTop: 14, paddingTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            ["תחומים שבחר/ה", p.domain ? p.domain.split(",").map(dom).join(" + ") : "טרם נבחרו"],
            ["מוסד + גיבוי", (() => {
              const e = [...p.timeline].find(ev => ev.name === "institution_committed");
              if (!e) return "טרם נבחר";
              const pr = (e.props ?? {}) as Record<string, unknown>;
              const main = String(pr.main ?? "").split(" — ")[0];
              return pr.backup ? `${main} · גיבוי: ${String(pr.backup).split(" — ")[0]}` : main;
            })()],
            ["רכזת מלווה", coordName || "—"],
            ["שירות", profile.serviceLabel ? `${profile.serviceLabel}${profile.miluim ? " · מילואים פעיל ✓" : ""}` : "—"],
            ...(profile.clock ? [["שעון זכאות משוחררים", profile.clock] as [string, string]] : []),
            ["שלב במסע", `שלב ${p.stage || 1} מתוך 6`],
          ].map(([label, val]) => (
            <div key={label as string}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#a8a195" }}>{label}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1c1a16" }}>{val}</div>
            </div>
          ))}
        </div>
        {/* האסמכתא למשרד העבודה — קישור חתום מצד השרת, כי הקובץ בתיקייה אישית */}
        {p.timeline.some(e => e.name === "enrollment_doc_uploaded") && (
          <a
            href={`/api/enrollment-doc?candidate=${encodeURIComponent(p.id)}&code=${encodeURIComponent(typeof window !== "undefined" ? sessionStorage.getItem("coordinator-code") ?? "" : "")}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14,
              background: "#e8f6ef", color: "#04543a", borderRadius: 12,
              padding: "9px 14px", fontSize: 13.5, fontWeight: 800, textDecoration: "none",
            }}
          >
            🎓 הורדת אישור הלימודים — האסמכתא למשרד העבודה
          </a>
        )}
      </div>

      {/* מפת המסע */}
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 10px rgba(2,62,138,.06)", padding: "22px 24px", marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: NAVY, fontFamily: "'Heebo', sans-serif" }}>מפת המסע</div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#8d867a", flexWrap: "wrap" }}>
            {[["#059669", "הושלם"], ["#fb8500", "כאן עכשיו"], ["stuck", "עצר/ה כאן"], ["#e2ddd3", "עוד לא הגיע/ה"], ["#dc2626", "סיגנל פעיל"]].map(([c, label]) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={c === "stuck"
                  ? { width: 11, height: 11, borderRadius: 999, background: "#fff7ed", border: "2px solid #fb8500", display: "inline-block" }
                  : { width: 11, height: 11, borderRadius: 999, background: c as string, display: "inline-block" }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 16 }}>
          <div style={{ minWidth: 1000 }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ position: "relative", height: 196, display: "flex", flexDirection: ri === 1 ? "row-reverse" : "row", alignItems: "flex-start" }}>
                {/* הקו המקווקו של השורה */}
                <div style={{ position: "absolute", top: 60, right: "6%", left: "6%", borderTop: "3px dashed #ddd6c9" }} />
                {/*
                  הקשת המקווקה שמחברת שורה לשורה (נתי 25.8 — הייתה חסרה):
                  הסרפנטינה זורמת ימין←שמאל←ימין, אז אחרי שורה 0 הקשת בצד
                  שמאל, ואחרי שורה 1 בצד ימין. חצי-טבעת ב-CSS: מסגרת מקווקה
                  בלי הצלע הפנימית, מעוגלת כלפי חוץ.
                */}
                {ri < rows.length - 1 && (
                  <div style={{
                    position: "absolute", top: 60, height: 196, width: "5.5%",
                    ...(ri % 2 === 0
                      ? { left: "0.5%", border: "3px dashed #ddd6c9", borderRight: "none", borderRadius: "110px 0 0 110px" }
                      : { right: "0.5%", border: "3px dashed #ddd6c9", borderLeft: "none", borderRadius: "0 110px 110px 0" }),
                  }} />
                )}
                {row.map(st => {
                  const c = NODE_COLOR[st.state];
                  const isOpen = openId === st.id;
                  return (
                    <button key={st.id} onClick={() => setOpenId(isOpen ? null : st.id)}
                      style={{ flex: 1, border: "none", background: "none", cursor: "pointer", position: "relative", paddingTop: 30, textAlign: "center", fontFamily: "'Heebo', sans-serif" }}>
                      {/* מניפת הטעימות של המועמד — ההסתעפות מהדרך (נתי 26.8) */}
                      {st.id === "taste" && tastedD.length > 0 && (
                        <span style={{ position: "absolute", top: 92, right: "50%", transform: "translateX(50%)", zIndex: 2 }}>
                          <svg width={Math.max(tastedD.length * 52, 60)} height="18" style={{ display: "block", margin: "0 auto" }}>
                            {tastedD.slice(0, 5).map((d, i, arr) => {
                              const w = Math.max(arr.length * 52, 60);
                              const x = arr.length === 1 ? w / 2 : 26 + i * ((w - 52) / (arr.length - 1));
                              return <path key={d} d={`M ${w / 2} 0 C ${w / 2} 10, ${x} 8, ${x} 18`} fill="none" stroke={DOMAIN_DOT[d]} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6" />;
                            })}
                          </svg>
                          <span style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 0 }}>
                            {tastedD.slice(0, 5).map(d => (
                              <span key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 38 }}>
                                <span style={{ width: 14, height: 14, borderRadius: 999, background: DOMAIN_DOT[d], boxShadow: "0 0 0 3px #fff" }} />
                                <span style={{ fontSize: 10, fontWeight: 800, color: "#5b5648", whiteSpace: "nowrap" }}>{dom(d)}</span>
                              </span>
                            ))}
                            {tastedD.length > 5 && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#a8a195", alignSelf: "center" }}>+{tastedD.length - 5}</span>}
                          </span>
                        </span>
                      )}
                      {st.stage && (
                        <span style={{ position: "absolute", top: 0, right: "50%", transform: "translateX(50%)", background: "#eef3fa", color: NAVY, fontSize: 11.5, fontWeight: 900, borderRadius: 999, padding: "3px 12px", whiteSpace: "nowrap" }}>
                          {st.stage}
                        </span>
                      )}
                      <span style={{
                        position: "relative", zIndex: 1, width: 56, height: 56, borderRadius: 999, display: "inline-flex",
                        alignItems: "center", justifyContent: "center", fontSize: 24,
                        background: c.bg, border: `${st.state === "stuck" ? 3 : 2}px solid ${c.border}`,
                        boxShadow: st.state === "stuck" ? "0 0 0 6px rgba(251,133,0,.14)" : "none",
                        animation: st.state === "current" ? "tcPulse 2s infinite" : "none",
                      }}>
                        <span style={{ filter: st.state === "future" ? "grayscale(1) opacity(.55)" : "none" }}>{st.emoji}</span>
                        {st.state === "done" && (
                          <span style={{ position: "absolute", bottom: -3, left: -3, width: 20, height: 20, borderRadius: 999, background: "#fff", color: "#059669", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,.15)" }}>✓</span>
                        )}
                        {st.state === "stuck" && (
                          <span style={{ position: "absolute", bottom: -3, left: -3, width: 22, height: 22, borderRadius: 999, background: "#fb8500", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>⏸</span>
                        )}
                        {st.signal && (
                          <span style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: 999, background: "#dc2626", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>⚠</span>
                        )}
                      </span>
                      {st.state === "current" && (
                        <div><span style={{ display: "inline-block", marginTop: 5, background: "#fb8500", color: "#fff", fontSize: 12.5, fontWeight: 900, borderRadius: 999, padding: "2px 12px" }}>כאן עכשיו</span></div>
                      )}
                      <div style={{ fontSize: 13.5, fontWeight: st.state === "stuck" ? 900 : 700, marginTop: 6, maxWidth: 170, marginRight: "auto", marginLeft: "auto",
                        color: st.state === "future" ? "#b8b1a4" : st.state === "stuck" ? "#9a3412" : "#1c1a16" }}>
                        {st.title}
                      </div>
                      {st.state === "done" && st.date && (
                        <div style={{ fontSize: 11.5, color: "#a8a195", marginTop: 2 }}>{new Date(st.date).toLocaleDateString("he-IL")}</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center", marginTop: 4 }}>
                        {st.chips.slice(0, 2).map((ch, i) => (
                          <span key={i} style={{
                            fontSize: ch.kind === "stop" ? 12.5 : 11.5, borderRadius: 999, padding: "2px 10px", maxWidth: 190,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            ...(ch.kind === "info" ? { background: "#f6f2ea", color: "#5b5648" }
                              : ch.kind === "quote" ? { background: "#ecfdf5", color: "#059669" }
                              : ch.kind === "talk" ? { background: "#eef3fa", color: NAVY, fontWeight: 700 }
                              : ch.kind === "stop" ? { background: "#fff7ed", border: "2px solid #fb8500", color: "#9a3412", fontWeight: 900 }
                              : { background: "#fef2f2", border: "1.5px solid #dc2626", color: "#dc2626", fontWeight: 700 }),
                          }}>{ch.text}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* פאנל פירוט תחנה */}
        {open && (
          <div style={{
            borderRadius: 14, padding: "18px 22px", marginTop: 6,
            background: open.state === "stuck" ? "#fffdf8" : "#fdfcf9",
            border: open.state === "stuck" ? "2px solid #fb8500" : "1.5px solid #eee9dd",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 15.5, fontWeight: 900, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {open.emoji} {open.title}
                <span style={{ marginRight: 10, fontSize: 12, fontWeight: 700, color: "#8d867a" }}>
                  {open.state === "done" ? "הושלם" : open.state === "current" ? "כאן עכשיו" : open.state === "stuck" ? `עצירה — ${open.stuckDays} ימים` : "עוד לא הגיע/ה"}
                </span>
              </div>
              <button onClick={() => setOpenId(null)} style={{ width: 28, height: 28, borderRadius: 999, border: "1px solid #e2ddd3", background: "#fff", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {open.events.length === 0 && <div style={{ fontSize: 13, color: "#a8a195" }}>אין אירועים בתחנה זו עדיין</div>}
              {[...open.events].reverse().slice(0, 12).map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 14 }}>
                  <span style={{ minWidth: 52, fontSize: 12.5, fontWeight: 700, color: "#8d867a" }}>
                    {new Date(e.at).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                  </span>
                  <span style={{ fontWeight: 500, color: "#1c1a16" }}>{describe(e)}</span>
                </div>
              ))}
            </div>
            {open.action && (
              <div style={{ marginTop: 12, background: NAVY, color: "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontWeight: 700 }}>
                הפעולה שלך: {open.action}
              </div>
            )}
          </div>
        )}
      </div>

      {/*
        "לקראת השיחה" במקום ציר ביקורים גולמי (נתי 23.8): הכרונולוגיה שירתה
        אנליטיקות, לא רכזת. מה שרכזת צריכה לפני שהיא מרימה טלפון: במה הוא
        מתעניין, איפה הוא מסתובב במעגלים, וכמה הוא בכלל פה. הכל נגזר, כרגיל.
      */}
      <div style={{ marginTop: 20, background: "#fff", borderRadius: 18, boxShadow: "0 2px 10px rgba(2,62,138,.06)", padding: "20px 24px" }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: NAVY, fontFamily: "'Heebo', sans-serif" }}>לקראת השיחה</div>
        <div style={{ fontSize: 12.5, color: "#8d867a", marginTop: 2 }}>מה שכדאי לדעת לפני שמרימים טלפון — נגזר מהפעילות שלו/ה</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
          {(() => {
            const evs = p.timeline; // מהחדש לישן
            const S = (v: unknown) => (v == null ? "" : String(v));
            const cards: { icon: string; title: string; body: string }[] = [];

            // 1 — במה מתעניין/ת: פתרונות ומלגות שנפתחו, מהחדש לישן, בלי כפולים
            const interests: string[] = [];
            for (const e of evs) {
              const pr = (e.props ?? {}) as Record<string, unknown>;
              let t = "";
              if (e.name === "paths_solution_open" || e.name === "paths_solution_click") t = S(pr.solution);
              if (e.name === "plan_scholarship_pick" && S(pr.on) === "true") t = fundName(S(pr.id));
              if (t && !interests.includes(t)) interests.push(t);
              if (interests.length >= 3) break;
            }
            if (interests.length) cards.push({
              icon: "✨", title: "במה הוא/היא מתעניין/ת",
              body: interests.join(" · "),
            });

            // 2 — איפה מסתובב/ת במעגלים: המשימה עם הכי הרבה חזרות
            let loopTask = ""; let loopCount = 0;
            for (const e of evs) {
              if (e.name !== "plan_task_open") continue;
              const pr = (e.props ?? {}) as Record<string, unknown>;
              const c = parseInt(S(pr.count) || "0", 10);
              if (c > loopCount) { loopCount = c; loopTask = taskName(S(pr.task)); }
            }
            if (loopCount >= 2) cards.push({
              icon: "🔄", title: "חוזר/ת לאותו מקום",
              body: `"${loopTask}" נפתחה ${loopCount} פעמים בלי להיסגר — כנראה תקוע/ה שם, וזו נקודת פתיחה טובה לשיחה.`,
            });

            // 3 — כמה הוא/היא פה: ביקורים בשבוע האחרון + הביקור האחרון
            const weekAgo = Date.now() - 7 * DAY_MS;
            const recent = visits.filter(v => +new Date(v[0].at) >= weekAgo);
            if (visits.length) {
              const last = visits[0];
              const lastStart = new Date(last[last.length - 1].at);
              const lastTook = +new Date(last[0].at) - +lastStart;
              const what = describe(compact(last)[0]);
              cards.push({
                icon: "📈", title: "כמה הוא/היא פה",
                body: `${recent.length} ביקורים בשבוע האחרון. האחרון: ${lastStart.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}, ${minutes(lastTook)} — ${what}.`,
              });
            }

            // 4 — פערי SCCT: עניין גבוה ומסוגלות נמוכה — שיחה מחזקת
            const talk = p.signals.find(sig => sig.reason.includes("מסוגלות נמוכה"));
            if (talk) cards.push({ icon: "💬", title: "שיחה מחזקת", body: talk.reason });

            if (!cards.length) cards.push({ icon: "🌱", title: "עוד אין מספיק פעילות", body: "כשיתחיל/תתחיל לזוז — התובנות יופיעו כאן מעצמן." });

            return cards.map((c, i) => (
              <div key={i} style={{ background: "#fdfcf9", border: "1px solid #eee9dd", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: NAVY, marginBottom: 5 }}>{c.icon} {c.title}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "#5b5648", lineHeight: 1.65 }}>{c.body}</div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

function Checklist({ items }: { items: { label: string; done: boolean; detail?: string }[] }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "4px 0 12px" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
          <span style={{
            width: 16, height: 16, borderRadius: 999, flexShrink: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: it.done ? "#059669" : "rgba(0,0,0,0.08)", color: "#fff", fontSize: 10, fontWeight: 900,
          }}>{it.done ? "✓" : ""}</span>
          <span style={{ color: it.done ? "#1c1a16" : "rgba(0,0,0,0.4)", fontWeight: it.done ? 700 : 500 }}>
            {it.label}{it.detail ? ` — ${it.detail}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CoordinatorPage() {
  const [code, setCode] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [data, setData] = useState<{ needsAttention: Person[]; quiet: number; quietList?: Person[]; total: number; generatedAt: string } | null>(null);
  // ברירת המחדל היא תור החילוץ — ההחלטה מ-14.8. הרשימה המלאה היא טאב, לא הבית
  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  // מסע הלקוח: לחיצה על שם בטאב "כל המשתתפים" פותחת את המפה של האדם
  const [journeyFor, setJourneyFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setCode(localStorage.getItem("coordinator-code")); }, []);

  const load = useCallback(async (c: string) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/coordinator", { headers: { "x-coordinator-code": c } });
      if (r.status === 401) { setError("קוד שגוי"); localStorage.removeItem("coordinator-code"); setCode(null); return; }
      if (r.status === 503) { setError((await r.json()).error); return; }
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        setError(body?.error ? `שגיאה ${r.status} — ${body.error}` : `שגיאה ${r.status}. אם זה קרה בזמן עדכון של האתר, רענון אמור לפתור`);
        return;
      }
      setData(await r.json());
    } catch { setError("שגיאת רשת"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (code) load(code); }, [code, load]);

  if (!code) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 360, width: "100%", background: "#fff", borderRadius: 18, padding: 26, border: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 20, ...HEEBO, color: NAVY }}>מסך הרכזת</div>
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", lineHeight: 1.7, marginTop: 8 }}>
            המסך מציג נתונים אישיים של מועמדים, ולכן דורש קוד גישה.
          </p>
          <input
            type="password" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && draft) { localStorage.setItem("coordinator-code", draft); setCode(draft); } }}
            placeholder="קוד רכזת"
            style={{ width: "100%", marginTop: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 15 }}
          />
          <button
            onClick={() => { if (draft) { localStorage.setItem("coordinator-code", draft); setCode(draft); } }}
            style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            כניסה
          </button>
          {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c" }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 26, marginTop: 8, ...HEEBO }}>מי צריך אותי היום</div>
          {data && (
            <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7 }}>
              {data.needsAttention.length} דורשים תשומת לב · {data.quiet} בסדר גמור · {data.total} סה״כ
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: journeyFor ? 1240 : 760, margin: "0 auto", padding: "16px 24px 60px" }}>
        {error && (
          <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#b91c1c", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7 }}>
            {error === "SUPABASE_SECRET_KEY not configured" ? (
              <><b>המפתח הסודי עוד לא בוורסל.</b> Settings → Environment Variables → להוסיף SUPABASE_SECRET_KEY (הערך מ-Supabase → API Keys → server_side_app) ולעשות deploy.</>
            ) : error === "COORDINATOR_CODE not configured" ? (
              <><b>קוד הרכזת עוד לא הוגדר.</b> להוסיף COORDINATOR_CODE ב-Vercel — זה הקוד שרכזות יזינו כאן.</>
            ) : error}
          </div>
        )}

        {journeyFor && data && (() => {
          const person = [...data.needsAttention, ...(data.quietList ?? [])].find(q => q.id === journeyFor);
          if (!person) { setJourneyFor(null); return null; }
          return <JourneyMap p={person} coordName="" onBack={() => setJourneyFor(null)} />;
        })()}

        {!journeyFor && data && (
          <div style={{ display: "flex", gap: 6, background: "rgba(2,62,138,0.06)", borderRadius: 12, padding: 4, marginBottom: 14 }}>
            {([["queue", "מי צריך אותי היום"], ["all", `כל המשתתפים (${data.total})`]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setTab(v)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 800, fontFamily: "'Heebo', sans-serif",
                  background: tab === v ? "#fff" : "transparent",
                  color: tab === v ? NAVY : "rgba(0,0,0,0.45)",
                  boxShadow: tab === v ? "0 1px 3px rgba(2,62,138,0.12)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {loading && <div style={{ padding: 30, textAlign: "center", color: "rgba(0,0,0,0.4)" }}>טוען…</div>}

        {!journeyFor && tab === "queue" && data && data.needsAttention.length === 0 && !loading && (
          <div style={{ background: "#eef8f3", border: "1px solid #cfe9dd", color: "#08694c", borderRadius: 14, padding: 22, textAlign: "center", fontSize: 15, fontWeight: 700 }}>
            אף אחד לא תקוע כרגע 🎉
          </div>
        )}

        {!journeyFor && tab === "queue" && data?.needsAttention.map(p => {
          const sev = SEV_META[p.signals[0]?.severity ?? 3];
          const isOpen = open === p.id;
          return (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${sev.color}33`, marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => setOpen(isOpen ? null : p.id)}
                style={{ width: "100%", textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: sev.bg, color: sev.color }}>{sev.label}</span>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: "#1c1a16" }}>{p.name}</span>
                  {p.anonymous && <span style={{ fontSize: 10.5, color: "rgba(0,0,0,0.35)" }}>(עוד לא השלים/ה שאלון)</span>}
                  <span style={{ fontSize: 11.5, color: "rgba(0,0,0,0.4)" }}>
                    שלב {p.stage}{p.region ? ` · ${p.region}` : ""}{p.domain ? ` · ${p.domain}` : ""}
                  </span>
                </div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                  {p.signals.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(0,0,0,0.7)" }}>
                      {s.severity === 1 ? "🔴" : s.severity === 2 ? "🟠" : "🔵"} {s.reason}
                    </div>
                  ))}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "12px 16px", background: "#fcfbf9" }}>
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
                    <span style={{ color: "rgba(0,0,0,0.5)" }}>
                      נכנס/ה: <b style={{ color: "#1c1a16" }}>{ago(p.lastActive)}</b>
                    </span>
                    <span style={{ color: "rgba(0,0,0,0.5)" }}>
                      התקדם/ה: <b style={{ color: "#1c1a16" }}>{ago(p.lastAction)}</b>
                    </span>
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); setJourneyFor(p.id); }}
                    style={{ border: "none", background: "rgba(2,62,138,0.06)", color: NAVY, fontWeight: 800, fontSize: 12.5, borderRadius: 10, padding: "7px 14px", cursor: "pointer", marginBottom: 10, fontFamily: "'Heebo', sans-serif" }}>
                    🗺 למפת המסע המלאה ←
                  </button>

                  <Checklist items={p.checklist ?? []} />

                  {/* בקצרה — מה שקוראים אם קוראים רק שורה אחת */}
                  {summarize(p).map((line, i) => (
                    <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#1c1a16", lineHeight: 1.7 }}>· {line}</div>
                  ))}

                  {p.ranked.length > 0 && (
                    <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.6)", marginTop: 6, lineHeight: 1.7 }}>
                      דירג/ה: {p.ranked.map(dom).join(" › ")}
                      {p.domain ? ` · בחר/ה בסוף: ${dom(p.domain)}` : ""}
                    </div>
                  )}

                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,0.4)", margin: "14px 0 8px" }}>
                    הביקורים — מהאחרון לראשון, ובתוך כל ביקור לפי הסדר שקרה
                  </div>
                  {p.timeline.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.4)" }}>אין עדיין אירועים</div>}

                  {sessions(p.timeline).map((visit, vi) => {
                    const end = new Date(visit[0].at);
                    const start = new Date(visit[visit.length - 1].at);
                    const took = +end - +start;
                    return (
                      <div key={vi} style={{ marginTop: vi ? 12 : 0, borderRight: `2px solid ${vi === 0 ? ORANGE : "rgba(0,0,0,0.08)"}`, paddingRight: 10 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: NAVY, opacity: 0.7 }}>
                          {start.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" })}
                          {" · "}
                          <span style={{ direction: "ltr", display: "inline-block" }}>
                            {start.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {took > 60000 ? ` · ${minutes(took)}` : ""}
                        </div>
                        {compact(visit).reverse().map((e, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, padding: "3px 0", fontSize: 12.5, color: "rgba(0,0,0,0.72)", lineHeight: 1.6 }}>
                            <span style={{ color: "rgba(0,0,0,0.28)", flexShrink: 0, direction: "ltr", minWidth: 36 }}>
                              {new Date(e.at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span>{describe(e)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 12, fontSize: 11.5, color: "rgba(0,0,0,0.4)", lineHeight: 1.6 }}>
                    רצף צעדים באותה סימולציה מכווץ לשורה אחת. משך ביקור הוא הערכת חסר —
                    אין דרך לדעת כמה זמן הוא קרא אחרי הפעולה האחרונה.
                    <br />
                    טלפון יופיע כאן כשיהיה שדה טלפון — עד אז הזיהוי דרך השם והשלב.
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!journeyFor && tab === "all" && data && (() => {
          const everyone = [...data.needsAttention, ...(data.quietList ?? [])]
            .sort((a, b) => (b.stage ?? 0) - (a.stage ?? 0));
          return everyone.map(p => {
            const isOpen = open === p.id;
            const doneCount = (p.checklist ?? []).filter(c => c.done).length;
            const total = (p.checklist ?? []).length || 9;
            return (
              <div key={p.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", marginBottom: 8, overflow: "hidden" }}>
                <button onClick={() => setJourneyFor(p.id)}
                  style={{ width: "100%", textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: NAVY, textDecoration: "underline", textUnderlineOffset: 3 }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: "rgba(0,0,0,0.45)" }}>שלב {p.stage || "—"}</span>
                    {p.signals.length > 0 && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: "#b91c1c" }}>● {p.signals.length} סיגנלים</span>
                    )}
                    <span style={{ marginRight: "auto", fontSize: 11.5, fontWeight: 800, color: NAVY }}>
                      {doneCount}/{total}
                    </span>
                  </div>
                  {/* פס התקדמות דק — סריקה של שנייה על כל הרשימה */}
                  <div style={{ height: 4, borderRadius: 999, background: "rgba(0,0,0,0.06)", marginTop: 8 }}>
                    <div style={{ height: "100%", width: `${(doneCount / total) * 100}%`, borderRadius: 999, background: doneCount === total ? "#059669" : ORANGE }} />
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ paddingTop: 10 }}>
                      <Checklist items={p.checklist ?? []} />
                    </div>
                    {summarize(p).map((line, i2) => (
                      <div key={i2} style={{ fontSize: 12.5, fontWeight: 700, color: "#1c1a16", lineHeight: 1.7 }}>· {line}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()}

        {data && (
          <button onClick={() => load(code)} style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.14)", background: "#fff", color: NAVY, cursor: "pointer" }}>
            רענון
          </button>
        )}
      </div>
    </div>
  );
}
