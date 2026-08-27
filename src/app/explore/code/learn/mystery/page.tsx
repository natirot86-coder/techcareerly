"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const BLUE = "#3b82f6";
const NAVY = "#023e8a";

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
        style={{ background: "rgba(59,130,246,0.1)", color: BLUE, border: "1px solid rgba(59,130,246,0.2)" }}>
        {term} <span style={{ fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 rounded-xl px-3 py-2.5 text-[12px] leading-[1.6] w-[240px]"
          style={{ background: "#fff", border: "1px solid rgba(59,130,246,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.7)" }}>
          {explanation}
        </div>
      )}
    </span>
  );
}

// ─── TerminalCard ─────────────────────────────────────────────────────────────

function TerminalCard({ title, lines }: { title: string; lines: { text: string; color?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2 font-mono" style={{ color: "#64748b" }}>{title}</span>
      </div>
      <div className="p-4 font-mono text-[11.5px] leading-[1.9]" style={{ background: "#0f172a" }} dir="ltr">
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.color ?? "#e2e8f0" }}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Tools data ───────────────────────────────────────────────────────────────

type ToolId = "log" | "blame" | "grep";
type Phase = "intro" | "tools" | "timeline" | "evidence" | "cause" | "postmortem" | "done";

const TOOLS: { id: ToolId; cmd: string; output: { text: string; color?: string }[]; question: string; options: string[]; correct: number; okMsg: string }[] = [
  {
    id: "log",
    cmd: 'git log --oneline --since="2 days ago"',
    output: [
      { text: '$ git log --oneline --since="2 days ago"', color: "#60a5fa" },
      { text: "e91d0b2  Tue 22:09  feat: add discount code support to checkout" },
      { text: "88c4a1f  Tue 14:20  chore: bump lodash to 4.17.21" },
      { text: "1d5e0f3  Mon 16:45  feat: add loyalty points calculation" },
    ],
    question: "", options: [], correct: 0, okMsg: "", // handled separately (multi-select)
  },
  {
    id: "blame",
    cmd: "git blame -L 40,42 checkout.js",
    output: [
      { text: "$ git blame -L 40,42 checkout.js", color: "#60a5fa" },
      { text: "e91d0b2 (Dana  Tue 22:09 40)   const discount = discountTable[code].amount;" },
      { text: "e91d0b2 (Dana  Tue 22:09 41)   const total = subtotal - discount;" },
      { text: "1d5e0f3 (Yossi Mon 16:45 42)   const points = calculateLoyaltyPoints(total);" },
    ],
    question: "איזו commit נגעה לאחרונה בשורה 40 — השורה שמחשבת את ההנחה?",
    options: ["1d5e0f3 — Yossi", "e91d0b2 — Dana", "88c4a1f — עדכון ספרייה"],
    correct: 1,
    okMsg: "✓ נכון — git blame מראה ש-e91d0b2 היא ה-commit האחרונה שנגעה בשורה הזו. זו ה'חשודה' הראשית.",
  },
  {
    id: "grep",
    cmd: 'grep "ERROR" app.log | tail -3',
    output: [
      { text: '$ grep "ERROR" app.log | tail -3', color: "#60a5fa" },
      { text: "22:14:03  ERROR  checkout.js:40  TypeError: Cannot read properties of undefined (reading 'amount')" },
      { text: "22:14:47  ERROR  checkout.js:40  TypeError: Cannot read properties of undefined (reading 'amount')" },
      { text: "22:16:12  ERROR  checkout.js:40  TypeError: Cannot read properties of undefined (reading 'amount')" },
    ],
    question: "לפי זמן השגיאה הראשונה (22:14:03), איזו commit היא כנראה הגורם?",
    options: ["1d5e0f3 (Mon 16:45 — יותר מדי מוקדם)", "e91d0b2 (Tue 22:09 — 5 דקות לפני)", "88c4a1f (Tue 14:20 — 8 שעות לפני)"],
    correct: 1,
    okMsg: "✓ נכון — פער של 5 דקות בין הפריסה לשגיאה הראשונה זה כמעט תמיד קשר סיבתי.",
  },
];

// git log — selectable lines (indices into the data lines, excluding the command line)
const LOG_LINES: { text: string; suspicious: boolean; explanation: string }[] = [
  { text: "e91d0b2  Tue 22:09  feat: add discount code support to checkout", suspicious: true,  explanation: "נגע בcheckout‏ — 5 דקות לפני שהשגיאות התחילו ב-22:14" },
  { text: "88c4a1f  Tue 14:20  chore: bump lodash to 4.17.21",               suspicious: false, explanation: "עדכון ספרייה כללי — לא נגע בקבצי checkout" },
  { text: "1d5e0f3  Mon 16:45  feat: add loyalty points calculation",        suspicious: false, explanation: "פיצ'ר נפרד לגמרי, יום שלם לפני האירוע" },
];

const META_Q = {
  question: "עכשיו ידוע לנו: איזו commit נגעה בקוד, מתי, ומה השגיאה אומרת. מה הצעד הבא בחקירה?",
  options: [
    { text: "לקרוא את ה-diff המלא של e91d0b2 ולהבין מה בדיוק השתנה", correct: true },
    { text: "לחסום את הגישה של Dana ולסגור את החקירה — יש מספיק ראיות", correct: false },
    { text: "למחוק את ה-commit ולשכוח מזה", correct: false },
  ],
  okMsg: "✓ בדיוק — שלושה כלים נתנו 3 פיסות מידע. עכשיו קוראים את הקוד עצמו כדי להבין את הבאג לעומק.",
};

const TIMELINE_EVENTS = [
  { id: "deploy",    label: "e91d0b2 נפרס לפרודקשן",           time: "22:09", correct: 0 },
  { id: "first_err", label: "שגיאת ERROR ראשונה ב-log",         time: "22:14", correct: 1 },
  { id: "spike",     label: "קצב השגיאות מזנק ל-40 בדקה",        time: "22:20", correct: 2 },
  { id: "alert",     label: "Alert אוטומטי נשלח לצוות",          time: "22:23", correct: 3 },
  { id: "oncall",    label: "מפתחת תורנית מתחילה חקירה",         time: "22:31", correct: 4 },
];

const EVIDENCE_ITEMS = [
  {
    label: "ראיה 1", icon: "📄",
    title: "ה-diff המלא של e91d0b2",
    body: "דנה הוסיפה תמיכה בקוד הנחה. השורה החדשה מחפשת את הקוד ברשימת ההנחות — אבל אם אין ערך תואם, הביטוי מחזיר undefined במקום להתגונן.",
    code: "- const discount = 0;\n+ const discount = discountTable[code].amount;",
    conclusion: "אם code לא קיים ב-discountTable — הקריאה ל-.amount זורקת TypeError. בדיוק השגיאה שראינו ב-log.",
  },
  {
    label: "ראיה 2", icon: "🧪",
    title: "אין טסט שמכסה \"קוד לא קיים\"",
    body: "חבילת הטסטים שרצה לפני המיזוג בדקה רק את המקרה שבו קוד ההנחה תקין. המקרה של קוד שגוי או ריק — לא נבדק בכלל.",
    conclusion: "טסט אחד על \"קוד לא קיים\" היה תופס את זה שניות לפני שהקוד יצא לאוויר.",
  },
  {
    label: "ראיה 3", icon: "⏱️",
    title: "רוב הלקוחות לא הזינו קוד הנחה בכלל",
    body: "code היה undefined אצל כל מי שלא הזין קוד הנחה — כלומר אצל רוב הלקוחות. זו הסיבה שקצב השגיאות היה כל כך מהיר (40 בדקה).",
    conclusion: "הבאג לא פגע ב\"מקרה קיצון נדיר\" — הוא פגע כמעט בכל מי שניסה לשלם.",
  },
  {
    label: "ראיה 4", icon: "👀",
    title: "ה-PR עבר review — אבל בעיון חלקי",
    body: "ל-PR של דנה היה reviewer שאישר תוך 4 דקות. review מהיר מדי לא תמיד תופס בעיות לוגיות עמוקות, במיוחד בשורה אחת שנראית תמימה.",
    conclusion: "code review חשוב — אבל הוא לא מחליף טסטים אוטומטיים למקרי קצה.",
  },
  {
    label: "ראיה 5", icon: "🔁",
    title: "אותו דפוס מופיע גם ב-1d5e0f3 (פיצ'ר אחר)",
    body: "בדיקה מהירה מראה ש-calculateLoyaltyPoints מיום שני משתמשת בדפוס גישה דומה למערך בלי בדיקת קיום. כרגע היא לא גרמה לשגיאה — אבל היא \"פצצה מתקתקת\" דומה.",
    conclusion: "זה לא רק באג בודד — זה דפוס כתיבה מסוכן שמופיע ביותר ממקום אחד בקוד.",
  },
];

const CAUSES = [
  {
    id: "blame_dana",
    name: "דנה כתבה קוד גרוע",
    emoji: "🙅",
    evidence: ["כולם כותבים קוד עם באגים מדי פעם — זה לא ייחודי לדנה", "התהליך, לא האדם, הוא מה שצריך לתקן"],
    correct: false,
    errMsg: "✗ זו לא המסקנה הנכונה — האשמת אדם בודד לא מונעת את הבאג הבא.",
  },
  {
    id: "process",
    name: "חוסר טסט למקרה קצה + review מהיר מדי",
    emoji: "🧪",
    evidence: [
      "מקרה \"קוד הנחה לא קיים\" לא נבדק בטסטים",
      "code review אישר תוך 4 דקות בלי לתפוס את הבעיה",
      "התהליך לא תפס באג לוגי פשוט לפני production",
    ],
    correct: true,
    errMsg: "",
  },
  {
    id: "lodash",
    name: "עדכון lodash (88c4a1f) גרם לזה",
    emoji: "📦",
    evidence: ["לא נגע בקובץ checkout.js בכלל", "רץ 8 שעות לפני שהשגיאות התחילו"],
    correct: false,
    errMsg: "✗ לא — 88c4a1f לא קשור בזמן או במיקום לשגיאה.",
  },
];

const PM_QUESTIONS = [
  {
    q: "מה קרה בפועל?",
    options: ["שרת קרס בגלל עומס", "commit הוסיף גישה למערך בלי בדיקת קיום — קרסה כשקוד הנחה לא נמצא", "מסד הנתונים היה למטה"],
    correct: 1,
    okMsg: "✓ נכון — קריאה ל-.amount על ערך undefined היא הסיבה הישירה לכל השגיאות.",
  },
  {
    q: "מה גורם שורשי?",
    options: ["דנה לא מנוסה מספיק", "חוסר טסט למקרה קצה + review שלא תפס לוגיקה עמוקה", "השרת היה ישן מדי"],
    correct: 1,
    okMsg: "✓ נכון — תהליך, לא כישרון בודד, הוא מה שהיה חסר כאן.",
  },
  {
    q: "מה מונע הישנות?",
    options: ["לאסור שינויים ב-checkout.js", "coverage חובה למקרי קצה + linter שמזהיר על גישה לא בטוחה למערכים + CI שחוסם merge", "לפטר את ה-reviewer"],
    correct: 1,
    okMsg: "✓ נכון — הגנות אוטומטיות תופסות מה שבן אדם מפספס בלחץ זמן.",
  },
];

const PHASES_ORDER: Phase[] = ["tools", "timeline", "evidence", "cause", "postmortem"];

// ─── State persistence ────────────────────────────────────────────────────────

type SavedMysteryState = {
  phase?: Phase;
  usedTools?: ToolId[];
  activeToolId?: ToolId | null;
  toolAnswers?: Record<ToolId, number | null>;
  logSelected?: number[];
  logSubmitted?: boolean;
  metaPicked?: number | null;
  timelineOrder?: string[];
  timelineSubmitted?: boolean;
  evidenceIdx?: number;
  evidenceRevealed?: boolean;
  causePicked?: string | null;
  pmIdx?: number;
  pmPicked?: number | null;
  pmDoneAll?: boolean;
};

function loadSavedMysteryState(): SavedMysteryState {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("code-mystery-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CodeMystery() {
  /*
   * חוזרים בדיוק לאיפה שנעצרנו — לא רק לשלב, אלא גם לתשובות ולכלים שכבר
   * הרצנו בו. עד עכשיו נשמר רק ה-phase, ומי שחזר באמצע שלב "כלים" נחת שוב
   * על מסך ריק בלי הכלים שכבר הריץ — נראה כמו איפוס גם כשה-phase נכון.
   */
  const savedRef = useRef<SavedMysteryState | null>(null);
  if (savedRef.current === null) savedRef.current = loadSavedMysteryState();
  const saved = savedRef.current;

  const [phase, setPhase] = useState<Phase>(saved.phase ?? "intro");

  // Tools phase state
  const [usedTools, setUsedTools]         = useState<Set<ToolId>>(new Set(saved.usedTools ?? []));
  const [activeToolId, setActiveToolId]   = useState<ToolId | null>(saved.activeToolId ?? null);
  const [toolAnswers, setToolAnswers]     = useState<Record<ToolId, number | null>>(saved.toolAnswers ?? { log: null, blame: null, grep: null });
  const [logSelected, setLogSelected]     = useState<Set<number>>(new Set(saved.logSelected ?? []));
  const [logSubmitted, setLogSubmitted]   = useState(saved.logSubmitted ?? false);
  const [metaPicked, setMetaPicked]       = useState<number | null>(saved.metaPicked ?? null);

  // Timeline phase state
  const [timelineOrder, setTimelineOrder]         = useState<string[]>(saved.timelineOrder ?? []);
  const [timelineSubmitted, setTimelineSubmitted] = useState(saved.timelineSubmitted ?? false);

  // Evidence phase state
  const [evidenceIdx, setEvidenceIdx]         = useState(saved.evidenceIdx ?? 0);
  const [evidenceRevealed, setEvidenceRevealed] = useState(saved.evidenceRevealed ?? false);

  // Cause phase state
  const [causePicked, setCausePicked] = useState<string | null>(saved.causePicked ?? null);

  // Postmortem phase state
  const [pmIdx, setPmIdx]         = useState(saved.pmIdx ?? 0);
  const [pmPicked, setPmPicked]   = useState<number | null>(saved.pmPicked ?? null);
  const [pmDoneAll, setPmDoneAll] = useState(saved.pmDoneAll ?? false);

  useEffect(() => {
    try {
      localStorage.setItem("code-mystery-state", JSON.stringify({
        phase,
        usedTools: Array.from(usedTools), activeToolId, toolAnswers,
        logSelected: Array.from(logSelected), logSubmitted, metaPicked,
        timelineOrder, timelineSubmitted,
        evidenceIdx, evidenceRevealed,
        causePicked,
        pmIdx, pmPicked, pmDoneAll,
      } satisfies SavedMysteryState));
    } catch {/* ignore */}
  }, [phase, usedTools, activeToolId, toolAnswers, logSelected, logSubmitted, metaPicked,
      timelineOrder, timelineSubmitted, evidenceIdx, evidenceRevealed, causePicked, pmIdx, pmPicked, pmDoneAll]);

  function markDone() {
    try {
      const cur = JSON.parse(localStorage.getItem("code-journey") || "{}");
      localStorage.setItem("code-journey", JSON.stringify({ ...cur, mystery: true }));
    } catch {/* ignore */}
  }

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  const activeTool = TOOLS.find((t) => t.id === activeToolId) ?? null;

  // All tools done = log submitted + blame answered + grep answered + meta answered
  const allToolsAnswered = logSubmitted && toolAnswers.blame !== null && toolAnswers.grep !== null && metaPicked !== null;

  function handleToolAnswer(toolId: ToolId, idx: number) {
    setToolAnswers((prev) => ({ ...prev, [toolId]: idx }));
  }

  function tapTimeline(id: string) {
    if (timelineSubmitted) return;
    if (timelineOrder.includes(id)) {
      setTimelineOrder(timelineOrder.filter((x) => x !== id));
    } else if (timelineOrder.length < TIMELINE_EVENTS.length - 1) {
      setTimelineOrder([...timelineOrder, id]);
    }
  }

  function pickPm(idx: number) {
    if (pmPicked !== null) return;
    setPmPicked(idx);
  }

  function nextPm() {
    if (pmIdx + 1 >= PM_QUESTIONS.length) {
      setPmDoneAll(true);
    } else {
      setPmIdx(pmIdx + 1);
      setPmPicked(null);
    }
  }

  // ─── Header ───────────────────────────────────────────────────────────────

  const phaseNum = phase === "intro" ? 0 : phase === "done" ? 5 : PHASES_ORDER.indexOf(phase) + 1;

  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: BLUE }}>
      <div className="max-w-[720px] mx-auto">
        <Link href="/explore/code" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.82 }}>
          ← חזרה לקוד
        </Link>
        <div className="text-[20px]" style={HEEBO}>תעלומת הקוד — TechFlow</div>
        <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>חקירת regression בפרודקשן · Git Forensics</div>
        {phaseNum > 0 && (
          <div className="mt-3 h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(phaseNum / 5) * 100}%`, background: "#fff" }} />
          </div>
        )}
      </div>
    </div>
  );

  // ─── Done ─────────────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-5 pt-6 pb-32">
          <div className="rounded-2xl p-5 mb-5 text-center"
            style={{ background: "rgba(59,130,246,0.06)", border: "1.5px solid rgba(59,130,246,0.2)" }}>
            <div className="text-[32px] mb-2">🕵️</div>
            <div className="text-[20px] font-black mb-2" style={{ color: BLUE, ...HEEBO }}>
              מצאת את השורש
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.55)" }}>
              תוך 22 דקות — <span className="font-bold">Git forensics.</span>
            </div>
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>מה עשית</div>
            {["✓ Git forensics — log, blame, grep", "✓ Timeline reconstruction", "✓ Evidence chain‏ — 5 ראיות", "✓ זיהוי גורם שורשי", "✓ Post-mortem — שורש, גורם, מניעה"].map((line, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 text-[12px]" style={{ color: "#15803d" }}>{line}</div>
            ))}
            <div className="mt-3 pt-3 text-[12.5px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
              &quot;Git forensics&quot; — זה מה שכל צוות פיתוח עושה כשבאג מגיע לפרודקשן: נתונים, לא ניחושים.
            </div>
          </div>
          <Link href="/explore/code/experience"
            className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
            style={{ background: BLUE, color: "#fff", ...HEEBO }}>
            לכלי עיבוד החוויה ←
          </Link>
          <Link href="/explore/code"
            className="block w-full py-3.5 rounded-2xl text-center text-[13px] font-bold"
            style={{ background: "rgba(59,130,246,0.08)", color: BLUE }}>
            מיציתי — חזרה לקוד ←
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      {Header}

      <div className="flex-1 max-w-[720px] mx-auto w-full px-5 pt-5 pb-32">

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <>
            {/* Context banner */}
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: "rgba(59,130,246,0.05)", border: "1.5px solid rgba(59,130,246,0.15)" }}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: BLUE }}>
                🏢 TechFlow — הרקע
              </div>
              <div className="text-[12.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
                חברת e-commerce עם checkout שרץ 24/7. אתמול בלילה, ב-22:14, שגיאות התחילו להציף את מערכת המוניטורינג. <span className="font-bold" style={{ color: BLUE }}>עשרות לקוחות לא הצליחו להשלים תשלום.</span>
              </div>
            </div>

            {/* Incident dashboard */}
            <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-bold" style={{ color: "#60a5fa" }}>🔍 Incident Dashboard</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>OPEN</span>
              </div>
              <div className="p-4" style={{ background: "#111827" }}>
                {[
                  { icon: "🔴", label: "Status",   val: "checkout.js — TypeError בקצב עולה" },
                  { icon: "📁", label: "Endpoint",  val: "POST /api/checkout — 40 שגיאות/דקה" },
                  { icon: "⏰", label: "Window",   val: "22:14 והלאה — אתמול בלילה" },
                  { icon: "📤", label: "Commits",  val: "3 commits ב-48 השעות האחרונות" },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5 border-b font-mono text-[11px]"
                    style={{ borderColor: "rgba(255,255,255,0.05)", color: "#d1d5db" }}>
                    <span className="text-[14px] shrink-0">{row.icon}</span>
                    <span className="w-20 shrink-0" style={{ color: "#94a3b8" }}>{row.label}</span>
                    <span style={{ color: "#e2e8f0" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate commits */}
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>
              שלושה commits מהימים האחרונים
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { emoji: "🎁", name: "e91d0b2", role: "feat: discount code support — Dana", note: "נגע ישירות ב-checkout.js" },
                { emoji: "📦", name: "88c4a1f", role: "chore: bump lodash — CI bot", note: "עדכון ספרייה אוטומטי, קובץ package.json בלבד" },
                { emoji: "🏅", name: "1d5e0f3", role: "feat: loyalty points — Yossi", note: "פיצ'ר נפרד, יום שלם לפני האירוע" },
              ].map((s) => (
                <div key={s.name} className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <span className="text-[24px] shrink-0">{s.emoji}</span>
                  <div>
                    <div className="text-[12.5px] font-black font-mono" style={{ color: NAVY }}>{s.name} — {s.role}</div>
                    <div className="text-[11px] leading-[1.4]" style={{ color: "rgba(0,0,0,0.45)" }}>{s.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tools you'll use */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(0,0,0,0.3)" }}>
                כלי החקירה
              </div>
              <div className="flex flex-wrap gap-1.5">
                <GlossaryChip term="git log" explanation="מציג היסטוריית commits — מי שינה מה, מתי, ובאיזו הודעה." />
                <GlossaryChip term="git blame" explanation="מראה איזו commit נגעה לאחרונה בכל שורה בקובץ — הכלי הראשון לחקירת regression." />
                <GlossaryChip term="grep" explanation="חיפוש טקסט בקבצים. grep &quot;ERROR&quot; app.log יחפש את כל שורות השגיאה ב-log." />
                <GlossaryChip term="app.log" explanation="יומן אפליקציה — קובץ שרושם כל שגיאה: מתי קרתה, איפה בקוד, ומה בדיוק נכשל." />
                <GlossaryChip term="regression" explanation="באג שנוצר משינוי חדש בקוד — משהו שעבד קודם, נשבר." />
              </div>
            </div>

            {/* Non-linear tip */}
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
              <div className="text-[12.5px] leading-[1.55]" style={{ color: "#92400e" }}>
                💡 <span className="font-bold">את בוחרת את הסדר.</span> השתמשי בשלושת כלי החקירה בכל סדר שתרצי. כל אחד מוסיף פיסת מידע אחרת. אחרי שבדקת את כולם — תרכיבי את התמונה המלאה.
              </div>
            </div>

            <button type="button" onClick={() => go("tools")}
              className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
              style={{ background: BLUE, color: "#fff", ...HEEBO }}>
              התחילי לחקור ←
            </button>
          </>
        )}

        {/* ── TOOLS ── */}
        {phase === "tools" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב א׳ — חקירת ה-Git וה-Logs</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              בחרי כלי, הריצי אותו, ענה על השאלה — ואז חזרי לבחור כלי נוסף.
            </div>

            {/* ── Skeleton timeline — goal card ── */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
                🎯 מה אנחנו בונות — Timeline של הבאג
              </div>
              <div className="flex flex-col gap-[7px]">
                {[
                  { time: "22:09", label: toolAnswers.blame !== null ? "e91d0b2 נפרסה" : "?", known: toolAnswers.blame !== null, fromTool: true },
                  { time: "22:14", label: "שגיאה ראשונה — checkout.js:40", known: true, fromTool: false },
                  { time: "22:20", label: toolAnswers.grep !== null ? "קצב שגיאות מזנק" : "?", known: toolAnswers.grep !== null, fromTool: true },
                  { time: "22:23", label: "Alert אוטומטי לצוות", known: true, fromTool: false },
                  { time: "22:31", label: logSubmitted ? "החקירה מתחילה" : "?", known: logSubmitted, fromTool: true },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="w-10 shrink-0 text-right font-bold" style={{ color: NAVY }}>{row.time}</span>
                    <span className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                      style={{ background: row.known ? (row.fromTool ? "#16a34a" : BLUE) : "rgba(0,0,0,0.15)" }} />
                    <span className="transition-all duration-300"
                      style={{ color: row.known ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)", fontStyle: row.known ? "normal" : "italic" }}>
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
              {!allToolsAnswered && (
                <div className="text-[10px] mt-3 pt-2.5 leading-[1.5]"
                  style={{ color: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  💡 כל כלי שתריצי ימלא פיסה נוספת בטיימליין
                </div>
              )}
            </div>

            {/* ── Tool buttons ── */}
            <div className="flex flex-col gap-2 mb-4">
              {TOOLS.map((tool) => {
                const isActive  = activeToolId === tool.id;
                const answered  = tool.id === "log" ? logSubmitted : toolAnswers[tool.id] !== null;
                const isUsed    = usedTools.has(tool.id);

                return (
                  <button key={tool.id} type="button"
                    onClick={() => {
                      setActiveToolId(tool.id);
                      setUsedTools((prev) => new Set([...prev, tool.id]));
                    }}
                    className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 transition-all"
                    style={{
                      background: isActive ? "#0f172a" : answered ? "rgba(22,163,74,0.06)" : "#fff",
                      border: isActive ? "1.5px solid rgba(59,130,246,0.4)" : answered ? "1.5px solid rgba(22,163,74,0.25)" : "1px solid rgba(0,0,0,0.08)",
                    }}>
                    <span className="text-[14px] font-mono" style={{ color: isActive ? "#60a5fa" : "#6b7280" }}>$</span>
                    <span className="flex-1 font-mono text-[12px] text-left" style={{ color: isActive ? "#e2e8f0" : NAVY }}>
                      {tool.cmd}
                    </span>
                    {answered
                      ? <span style={{ color: "#16a34a", fontSize: 14 }}>✓</span>
                      : isUsed
                        ? <span style={{ color: BLUE, fontSize: 12 }}>●</span>
                        : null}
                  </button>
                );
              })}
            </div>

            {/* ── Active tool ── */}
            {activeTool && (
              <div className="mb-4">
                <TerminalCard title={activeTool.cmd} lines={activeTool.output} />

                {/* LOG — multi-select lines */}
                {activeTool.id === "log" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-1" style={{ color: NAVY }}>
                      סמני את ה-commits החשודים:
                    </div>
                    <div className="text-[11px] mb-3" style={{ color: "rgba(0,0,0,0.4)" }}>
                      לחצי על שורה לבחירה — ייתכן יותר מאחת חשודה
                    </div>
                    <div className="flex flex-col gap-2 mb-3">
                      {LOG_LINES.map((line, i) => {
                        const isSelected = logSelected.has(i);
                        const showResult = logSubmitted;
                        const isCorrect  = showResult && line.suspicious && isSelected;
                        const isWrong    = showResult && isSelected && !line.suspicious;
                        const isMissed   = showResult && !isSelected && line.suspicious;

                        return (
                          <button key={i} type="button"
                            onClick={() => {
                              if (logSubmitted) return;
                              setLogSelected((prev) => {
                                const next = new Set(prev);
                                if (next.has(i)) next.delete(i); else next.add(i);
                                return next;
                              });
                            }}
                            disabled={logSubmitted}
                            className="w-full rounded-xl px-3 py-2.5 text-left transition-all"
                            style={{
                              background: isCorrect ? "rgba(22,163,74,0.1)" : isWrong ? "rgba(220,38,38,0.08)" : isMissed ? "rgba(251,133,0,0.08)" : isSelected ? "rgba(59,130,246,0.06)" : "#f8fafc",
                              border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isMissed ? "1.5px solid rgba(251,133,0,0.35)" : isSelected ? "1.5px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,0,0,0.06)",
                            }}>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center"
                                style={{
                                  background: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? BLUE : "rgba(0,0,0,0.08)",
                                  border: isSelected || showResult ? "none" : "1px solid rgba(0,0,0,0.15)",
                                }}>
                                {isSelected && <span className="text-[9px] text-white font-black">✓</span>}
                                {isMissed && <span className="text-[9px] font-black" style={{ color: "#92400e" }}>!</span>}
                              </div>
                              <span className="font-mono text-[10px] leading-[1.6]"
                                style={{ color: isCorrect ? "#15803d" : isWrong ? "#b91c1c" : isMissed ? "#92400e" : "rgba(0,0,0,0.65)" }}
                                dir="ltr">
                                {line.text}
                              </span>
                            </div>
                            {showResult && (isCorrect || isMissed) && (
                              <div className="text-[10.5px] mt-1.5 pr-6"
                                style={{ color: isCorrect ? "#15803d" : "#92400e" }}>
                                {isCorrect ? `✓ ${line.explanation}` : `↑ פספסת — ${line.explanation}`}
                              </div>
                            )}
                            {showResult && isWrong && (
                              <div className="text-[10.5px] mt-1.5 pr-6" style={{ color: "#b91c1c" }}>
                                ✗ לא חשוד — {line.explanation}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!logSubmitted ? (
                      <button type="button"
                        onClick={() => setLogSubmitted(true)}
                        disabled={logSelected.size === 0}
                        className="w-full py-3 rounded-xl text-[13px] font-bold transition-all"
                        style={{
                          background: logSelected.size > 0 ? BLUE : "rgba(0,0,0,0.05)",
                          color: logSelected.size > 0 ? "#fff" : "rgba(0,0,0,0.3)",
                        }}>
                        אשרי בחירה
                      </button>
                    ) : (
                      <>
                        <div className="rounded-xl px-3 py-2.5 mb-3 text-[12px] leading-[1.55]"
                          style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                          ✓ e91d0b2 נגעה ישירות ב-checkout ורגעים לפני שהשגיאות התחילו — היא ה-commit החשודה.
                        </div>
                        {!allToolsAnswered && (
                          <button type="button" onClick={() => setActiveToolId(null)}
                            className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-1 transition-all"
                            style={{ background: "rgba(59,130,246,0.08)", color: BLUE, border: "1.5px solid rgba(59,130,246,0.15)" }}>
                            ← בחרי כלי נוסף
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* BLAME — MCQ */}
                {activeTool.id === "blame" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{activeTool.question}</div>
                    {activeTool.options.map((opt, i) => {
                      const isCorrect  = i === activeTool.correct;
                      const isPicked   = toolAnswers.blame === i;
                      const showResult = toolAnswers.blame !== null;

                      return (
                        <button key={i} type="button"
                          onClick={() => handleToolAnswer("blame", i)}
                          disabled={showResult}
                          className="w-full rounded-xl px-4 py-3 text-right mb-2 transition-all"
                          style={{
                            background: showResult && isCorrect ? "rgba(22,163,74,0.08)" : showResult && isPicked && !isCorrect ? "rgba(220,38,38,0.06)" : "#f8fafc",
                            border: showResult && isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !isCorrect ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.07)",
                          }}>
                          <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt}</span>
                          {showResult && isCorrect && (
                            <div className="text-[11.5px] mt-1" style={{ color: "#15803d" }}>{activeTool.okMsg}</div>
                          )}
                        </button>
                      );
                    })}
                    {toolAnswers.blame !== null && !allToolsAnswered && (
                      <button type="button" onClick={() => setActiveToolId(null)}
                        className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-2 transition-all"
                        style={{ background: "rgba(59,130,246,0.08)", color: BLUE, border: "1.5px solid rgba(59,130,246,0.15)" }}>
                        ← בחרי כלי נוסף
                      </button>
                    )}
                  </div>
                )}

                {/* GREP — MCQ + metacognitive */}
                {activeTool.id === "grep" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{activeTool.question}</div>
                    {activeTool.options.map((opt, i) => {
                      const isCorrect  = i === activeTool.correct;
                      const isPicked   = toolAnswers.grep === i;
                      const showResult = toolAnswers.grep !== null;

                      return (
                        <button key={i} type="button"
                          onClick={() => handleToolAnswer("grep", i)}
                          disabled={showResult}
                          className="w-full rounded-xl px-4 py-3 text-right mb-2 transition-all"
                          style={{
                            background: showResult && isCorrect ? "rgba(22,163,74,0.08)" : showResult && isPicked && !isCorrect ? "rgba(220,38,38,0.06)" : "#f8fafc",
                            border: showResult && isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !isCorrect ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.07)",
                          }}>
                          <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt}</span>
                          {showResult && isCorrect && (
                            <div className="text-[11.5px] mt-1" style={{ color: "#15803d" }}>{activeTool.okMsg}</div>
                          )}
                        </button>
                      );
                    })}

                    {/* Metacognitive question — appears after grep is answered */}
                    {toolAnswers.grep !== null && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="text-[12.5px] font-bold mb-2.5" style={{ color: NAVY }}>
                          {META_Q.question}
                        </div>
                        {META_Q.options.map((opt, i) => {
                          const isPicked   = metaPicked === i;
                          const showResult = metaPicked !== null;

                          return (
                            <button key={i} type="button"
                              onClick={() => { if (metaPicked === null) setMetaPicked(i); }}
                              disabled={metaPicked !== null}
                              className="w-full rounded-xl px-4 py-3 text-right mb-2 transition-all"
                              style={{
                                background: showResult && opt.correct ? "rgba(22,163,74,0.08)" : showResult && isPicked && !opt.correct ? "rgba(220,38,38,0.06)" : "#f8fafc",
                                border: showResult && opt.correct ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !opt.correct ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.07)",
                              }}>
                              <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt.text}</span>
                              {showResult && opt.correct && (
                                <div className="text-[11.5px] mt-1" style={{ color: "#15803d" }}>{META_Q.okMsg}</div>
                              )}
                            </button>
                          );
                        })}
                        {/* Back to tools if log still needed */}
                        {metaPicked !== null && !allToolsAnswered && (
                          <button type="button" onClick={() => setActiveToolId(null)}
                            className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-2 transition-all"
                            style={{ background: "rgba(59,130,246,0.08)", color: BLUE, border: "1.5px solid rgba(59,130,246,0.15)" }}>
                            ← בחרי כלי נוסף
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Glossary chips */}
            {usedTools.size > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <GlossaryChip term="diff" explanation="ההשוואה בין הקוד לפני ואחרי commit — מראה בדיוק אילו שורות נוספו, נמחקו או שונו." />
                <GlossaryChip term="commit hash" explanation="מזהה ייחודי (כמו e91d0b2) לכל commit — אפשר להשתמש בו כדי לחזור לגרסה מדויקת." />
                <GlossaryChip term="stack trace" explanation="השרשרת המדויקת של קריאות פונקציה שהובילה לשגיאה — כאן: checkout.js:40." />
              </div>
            )}

            {/* Counter */}
            {!allToolsAnswered && (() => {
              const rem = [!logSubmitted, toolAnswers.blame === null, toolAnswers.grep === null].filter(Boolean).length;
              return rem > 0 ? (
                <div className="text-center text-[12px] mb-4" style={{ color: "rgba(0,0,0,0.4)" }}>
                  עוד {rem} כלים לבחור
                </div>
              ) : (
                <div className="text-center text-[12px] mb-4" style={{ color: "rgba(0,0,0,0.4)" }}>
                  ענה על שאלת הבונוס ←
                </div>
              );
            })()}

            {allToolsAnswered && (
              <button type="button" onClick={() => go("timeline")}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                שלב ב׳ — אשרי את ה-Timeline שבנית ←
              </button>
            )}
          </>
        )}

        {/* ── TIMELINE ── */}
        {phase === "timeline" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ב׳ — אשרי את ה-Timeline שבנית</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              בחקירה ראית את כל האירועים. עכשיו סדרי אותם — מה קרה ראשון?
            </div>

            {/* What you found — reference card */}
            <div className="rounded-2xl p-4 mb-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(0,0,0,0.3)" }}>
                📋 מה גילית בחקירה
              </div>
              {[
                { tool: "log",   text: "e91d0b2 נגעה ב-checkout ב-22:09, 5 דקות לפני השגיאות" },
                { tool: "blame", text: "שורה 40 בcheckout.js — הגישה שגורמת לקריסה — שייכת ל-e91d0b2" },
                { tool: "grep",  text: "שגיאת ה-TypeError הראשונה נרשמה ב-22:14:03" },
              ].map((item) => (
                <div key={item.tool} className="flex items-start gap-2.5 mb-1.5">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>{item.tool}</span>
                  <span className="text-[12px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.65)" }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Why timeline matters */}
            <div className="rounded-2xl px-4 py-3 mb-4"
              style={{ background: "rgba(59,130,246,0.05)", border: "1.5px solid rgba(59,130,246,0.15)" }}>
              <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
                <span className="font-bold" style={{ color: BLUE }}>למה Timeline?</span>{" "}
                חפיפת זמנים היא הראיה המרכזית — פריסה שקדמה בדקות לגל השגיאות זה לא מקרה. Timeline מחבר בין הממצאים ומוכיח קשר עם נתונים, לא ניחושים.
              </div>
            </div>

            {/* How-to card */}
            <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
              <div className="flex gap-1.5 shrink-0">
                {["1", "2", "3"].map((n) => (
                  <div key={n} className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black"
                    style={{ background: BLUE, color: "#fff" }}>{n}</div>
                ))}
              </div>
              <div className="text-[11.5px] leading-[1.5]" style={{ color: NAVY }}>
                לחצי על כרטיס = מקצה לו מספר סידורי. לחיצה נוספת — מבטלת.
              </div>
            </div>

            {/* Tapable events (1–4) */}
            <div className="flex flex-col gap-2 mb-3">
              {TIMELINE_EVENTS.filter((ev) => ev.id !== "oncall").map((ev) => {
                const rank       = timelineOrder.indexOf(ev.id) + 1;
                const isSelected = rank > 0;
                const isCorrect  = timelineSubmitted && ev.correct === rank - 1;
                const isWrong    = timelineSubmitted && isSelected && !isCorrect;

                return (
                  <button key={ev.id} type="button"
                    onClick={() => tapTimeline(ev.id)}
                    disabled={timelineSubmitted}
                    className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all"
                    style={{
                      background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(59,130,246,0.06)" : "#fff",
                      border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isSelected ? "1.5px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,0,0,0.08)",
                    }}>
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-black"
                      style={{
                        background: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? BLUE : "rgba(0,0,0,0.06)",
                        color: isSelected ? "#fff" : "rgba(0,0,0,0.3)",
                      }}>
                      {isSelected ? rank : "?"}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{ev.label}</div>
                      {timelineSubmitted && (
                        <div className="text-[11px] mt-0.5 font-mono" style={{ color: "rgba(0,0,0,0.4)" }}>{ev.time}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pre-placed anchor — on-call response */}
            <div className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-4"
              style={{
                background: timelineSubmitted ? "rgba(22,163,74,0.08)" : "rgba(2,62,138,0.04)",
                border: timelineSubmitted ? "1.5px solid rgba(22,163,74,0.3)" : "1.5px dashed rgba(2,62,138,0.2)",
              }}>
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-black"
                style={{ background: timelineSubmitted ? "#16a34a" : NAVY, color: "#fff" }}>
                5
              </div>
              <div className="flex-1 text-right">
                <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>מפתחת תורנית מתחילה חקירה</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>
                  {timelineSubmitted ? "22:31" : "ממוקם מראש — ברור שהוא אחרון"}
                </div>
              </div>
            </div>

            {!timelineSubmitted ? (
              <button type="button" onClick={() => setTimelineSubmitted(true)}
                disabled={timelineOrder.length < TIMELINE_EVENTS.length - 1}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all active:scale-[0.98]"
                style={{
                  background: timelineOrder.length === TIMELINE_EVENTS.length - 1 ? BLUE : "rgba(0,0,0,0.06)",
                  color: timelineOrder.length === TIMELINE_EVENTS.length - 1 ? "#fff" : "rgba(0,0,0,0.3)",
                  ...HEEBO,
                }}>
                {timelineOrder.length < TIMELINE_EVENTS.length - 1
                  ? `עוד ${TIMELINE_EVENTS.length - 1 - timelineOrder.length} אירועים לסדר`
                  : "אשרי Timeline"}
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                  ✓ Timeline ברור — הפריסה קדמה לגל השגיאות בדקות ספורות, לא במקרה.
                </div>
                <button type="button" onClick={() => go("evidence")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                  style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                  שלב ג׳ — שרשרת הראיות ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── EVIDENCE ── */}
        {phase === "evidence" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ג׳ — שרשרת הראיות</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              לחצי להצגת ראיה אחת בכל פעם — הן יצרו שרשרת שמסבירה את הבאג:
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {EVIDENCE_ITEMS.slice(0, evidenceIdx + 1).map((ev, i) => (
                <div key={i} className="rounded-2xl px-4 py-4"
                  style={{ background: "#fff", border: "1px solid rgba(59,130,246,0.15)" }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[18px] shrink-0">{ev.icon}</span>
                    <div>
                      <div className="text-[9.5px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.28)" }}>{ev.label}</div>
                      <div className="text-[13px] font-black leading-[1.3]" style={{ color: NAVY }}>{ev.title}</div>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="text-[12px] leading-[1.65] mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
                    {ev.body}
                  </div>
                  {/* Optional code diff */}
                  {"code" in ev && ev.code && (
                    <pre className="rounded-lg px-3 py-2.5 mb-3 text-[11px] font-mono overflow-x-auto m-0 leading-[1.7]"
                      style={{ background: "#0f172a" }} dir="ltr">
                      {ev.code.split("\n").map((line, li) => (
                        <div key={li} style={{ color: line.startsWith("+") ? "#4ade80" : line.startsWith("-") ? "#f87171" : "#e2e8f0" }}>
                          {line}
                        </div>
                      ))}
                    </pre>
                  )}
                  {/* Conclusion */}
                  <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                    style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                    <span className="text-[12px] font-black shrink-0" style={{ color: BLUE }}>⟹</span>
                    <div className="text-[12px] leading-[1.55] font-medium" style={{ color: "#1e3a8a" }}>
                      {ev.conclusion}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {evidenceIdx < EVIDENCE_ITEMS.length - 1 && !evidenceRevealed ? (
              <button type="button" onClick={() => setEvidenceIdx((i) => i + 1)}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black mb-3 transition-all active:scale-[0.98]"
                style={{ background: "rgba(59,130,246,0.08)", color: BLUE, border: "1.5px solid rgba(59,130,246,0.2)" }}>
                הצגי ראיה {evidenceIdx + 2} מ-{EVIDENCE_ITEMS.length} ←
              </button>
            ) : !evidenceRevealed ? (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", color: "#1e3a8a" }}>
                  חמש ראיות — מספיק לזהות את הגורם השורשי. מה הוא בעצם?
                </div>
                <button type="button" onClick={() => { setEvidenceRevealed(true); go("cause"); }}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                  style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                  שלב ד׳ — זיהוי הגורם השורשי ←
                </button>
              </>
            ) : null}
          </>
        )}

        {/* ── CAUSE ── */}
        {phase === "cause" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ד׳ — זיהוי הגורם השורשי</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              על סמך הראיות — מה באמת גרם לבאג להגיע לפרודקשן?
            </div>

            {CAUSES.map((cause) => {
              const isPicked   = causePicked === cause.id;
              const showResult = causePicked !== null;

              return (
                <button key={cause.id} type="button"
                  onClick={() => { if (!causePicked) setCausePicked(cause.id); }}
                  disabled={!!causePicked}
                  className="w-full rounded-2xl p-4 flex items-start gap-3 mb-3 transition-all text-right"
                  style={{
                    background: showResult && cause.correct ? "rgba(22,163,74,0.08)" : showResult && isPicked && !cause.correct ? "rgba(220,38,38,0.08)" : "#fff",
                    border: showResult && cause.correct ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !cause.correct ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid rgba(0,0,0,0.08)",
                  }}>
                  <span className="text-[28px] shrink-0">{cause.emoji}</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-black mb-1" style={{ color: NAVY }}>{cause.name}</div>
                    <div className="flex flex-col gap-1">
                      {cause.evidence.map((e, i) => (
                        <div key={i} className="text-[11.5px] leading-[1.45]"
                          style={{ color: showResult && cause.correct ? "#15803d" : "rgba(0,0,0,0.5)" }}>
                          {showResult && cause.correct ? "✓ " : "• "}{e}
                        </div>
                      ))}
                    </div>
                    {showResult && isPicked && !cause.correct && (
                      <div className="mt-2 text-[12px]" style={{ color: "#b91c1c" }}>{cause.errMsg}</div>
                    )}
                  </div>
                </button>
              );
            })}

            {causePicked === "process" && (
              <button type="button" onClick={() => go("postmortem")}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                שלב ה׳ — Post-Mortem ←
              </button>
            )}
          </>
        )}

        {/* ── POSTMORTEM ── */}
        {phase === "postmortem" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ה׳ — Post-Mortem</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              {PM_QUESTIONS[pmIdx].q}
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {PM_QUESTIONS[pmIdx].options.map((opt, i) => {
                const isCorrect  = i === PM_QUESTIONS[pmIdx].correct;
                const isPicked   = pmPicked === i;
                const showResult = pmPicked !== null;

                return (
                  <button key={i} type="button"
                    onClick={() => pickPm(i)}
                    disabled={pmPicked !== null}
                    className="w-full rounded-2xl px-4 py-3.5 text-right transition-all"
                    style={{
                      background: showResult && isCorrect ? "rgba(22,163,74,0.08)" : showResult && isPicked && !isCorrect ? "rgba(220,38,38,0.08)" : "#fff",
                      border: showResult && isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !isCorrect ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid rgba(0,0,0,0.08)",
                    }}>
                    <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt}</span>
                    {showResult && isCorrect && (
                      <div className="text-[11.5px] mt-1.5" style={{ color: "#15803d" }}>{PM_QUESTIONS[pmIdx].okMsg}</div>
                    )}
                  </button>
                );
              })}
            </div>

            {pmPicked !== null && !pmDoneAll && (
              <button type="button" onClick={nextPm}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all active:scale-[0.98]"
                style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                {pmIdx + 1 < PM_QUESTIONS.length ? `שאלה ${pmIdx + 2} ←` : "סיום ←"}
              </button>
            )}

            {pmDoneAll && (
              <button type="button" onClick={() => { markDone(); go("done"); }}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                ראי את הסיכום ←
              </button>
            )}
          </>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
