"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const RED = "#dc2626";
const NAVY = "#023e8a";

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
        style={{ background: "rgba(220,38,38,0.1)", color: RED, border: "1px solid rgba(220,38,38,0.2)" }}>
        {term} <span style={{ fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 rounded-xl px-3 py-2.5 text-[12px] leading-[1.6] w-[240px]"
          style={{ background: "#fff", border: "1px solid rgba(220,38,38,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.7)" }}>
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

type ToolId = "grep" | "ls" | "last";
type Phase = "intro" | "tools" | "timeline" | "evidence" | "suspect" | "postmortem" | "done";

const TOOLS: { id: ToolId; cmd: string; output: { text: string; color?: string }[]; question: string; options: string[]; correct: number; okMsg: string }[] = [
  {
    id: "grep",
    cmd: 'grep "EXPORT" access.log',
    output: [
      { text: '$ grep "EXPORT" access.log', color: "#60a5fa" },
      { text: "03:14:22  api-server  POST /api/export?limit=9999  → 8.7MB  200 OK" },
      { text: "04:52:11  api-server  POST /api/export?limit=9999  → 8.7MB  200 OK" },
      { text: "03:14:25  dev-01      GET  /api/users?page=1       → 2KB   200 OK" },
    ],
    question: "", options: [], correct: 0, okMsg: "", // handled separately (multi-select)
  },
  {
    id: "ls",
    cmd: "ls -lh /var/exports/",
    output: [
      { text: "$ ls -lh /var/exports/", color: "#60a5fa" },
      { text: "-rw-r--r-- 1 api-server staff  8.7M  Aug 04 03:14  export_customers.csv" },
      { text: "-rw-r--r-- 1 api-server staff  8.7M  Aug 04 04:52  export_customers_v2.csv" },
    ],
    question: "שני קבצים בתיקייה. 8.7MB + 8.7MB — כמה נתוני לקוחות יצאו סה\"כ?",
    options: ["8.7MB — רק ייצוא אחד יצא", "17.4MB — שני ייצואים שונים בשתי נקודות זמן", "0 — הקבצים ריקים, אין נתונים אמיתיים"],
    correct: 1,
    okMsg: "✓ נכון — 17.4MB = שתי רשימות לקוחות מלאות. הנתונים יצאו פעמיים.",
  },
  {
    id: "last",
    cmd: "last -n 20",
    output: [
      { text: "$ last -n 20", color: "#60a5fa" },
      { text: "maya    pts/0  192.168.1.55  Mon Aug 4  02:57 - 05:14  (02:17)", color: "#f87171" },
      { text: "daniel  pts/1  10.0.0.12     Mon Aug 4  09:02 - 12:30  (03:28)" },
      { text: "root    tty1               Mon Aug 4  00:01 - 00:15  (00:14)" },
    ],
    question: "מי היה מחובר בזמן הדלף (03:14 ו-04:52)?",
    options: ["Daniel — מחובר 09:02", "Maya — מחוברת 02:57 עד 05:14", "root — מחובר 00:01"],
    correct: 1,
    okMsg: "✓ נכון — Maya הייתה מחוברת בין 02:57 ל-05:14, כולל שתי נקודות הייצוא.",
  },
];

// Grep — selectable lines (indices into the data lines, excluding the command line)
const GREP_LINES: { text: string; suspicious: boolean; explanation: string }[] = [
  { text: "03:14:22  api-server  POST /api/export?limit=9999  → 8.7MB  200 OK", suspicious: true,  explanation: "ייצוא ראשון — 8.7MB יצאו לכתובת חיצונית" },
  { text: "04:52:11  api-server  POST /api/export?limit=9999  → 8.7MB  200 OK", suspicious: true,  explanation: "ייצוא שני — שעתיים אחרי, 8.7MB נוספים" },
  { text: "03:14:25  dev-01      GET  /api/users?page=1       → 2KB   200 OK",  suspicious: false, explanation: "פעולה רגילה — dev-01 פתח עמוד לקוחות, 2KB בלבד" },
];

const META_Q = {
  question: "עכשיו ידוע לנו: מי היה מחובר, מתי ייצאו הנתונים, וכמה. מה הצעד הבא בחקירה?",
  options: [
    { text: "לשחזר Timeline מלא ולחפש חפיפות בין כל הנתונים שמצאנו", correct: true },
    { text: "לחסום את api-server ולסגור את החקירה — יש מספיק ראיות", correct: false },
    { text: "לפנות ישירות ל-Maya ולשאול אם היא עשתה את זה", correct: false },
  ],
  okMsg: "✓ בדיוק — 3 כלים נתנו 3 פיסות מידע. עכשיו מחברים אותן לתמונה שלמה.",
};

const TIMELINE_EVENTS = [
  { id: "maya_in",   label: "Maya נכנסת למערכת",          time: "02:57", correct: 0 },
  { id: "export1",   label: "ייצוא ראשון דרך api-server", time: "03:14", correct: 1 },
  { id: "export2",   label: "ייצוא שני דרך api-server",   time: "04:52", correct: 2 },
  { id: "maya_out",  label: "Maya מתנתקת",                time: "05:14", correct: 3 },
  { id: "daniel_in", label: "Daniel נכנס — יום עבודה רגיל", time: "09:02", correct: 4 },
  { id: "alert",     label: "Alert מופעל ב-SOC",           time: "09:17", correct: 5 },
];

const EVIDENCE_ITEMS = [
  {
    label: "ראיה 1", icon: "🔑",
    title: "סיסמאות api-server נשמרו בקובץ פתוח",
    body: "לכל אפליקציה יש \"סיסמה\" שמאפשרת לה לגשת לנתונים — זה נקרא credentials. בשרת של CyberSec, הסיסמה של api-server הייתה שמורה בקובץ config רגיל, לא מוצפן — פתוח לקריאה לכל מי שיש לו גישה לשרת.",
    conclusion: "לא רק api-server יכול לייצא. כל מי שמצא את הקובץ הזה — יכול להשתמש בסיסמה שלו.",
  },
  {
    label: "ראיה 2", icon: "📋",
    title: "ל-Maya הייתה גישה לקובץ הסיסמאות",
    body: "לכל קובץ בשרת יש רשימת הרשאות — מי יכול לקרוא אותו ומי לא. לפי הרשומות (ACL logs), ל-Maya הייתה הרשאת קריאה לקובץ config שבו הסיסמאות שמורות.",
    conclusion: "Maya ידעה בדיוק היכן הסיסמה שמורה. היא יכלה לקחת אותה.",
  },
  {
    label: "ראיה 3", icon: "🌐",
    title: "17.4MB יצאו לכתובת מחוץ לחברה",
    body: "כל מחשב ברשת מזוהה בכתובת IP. ב-03:14 וב-04:52 הנתונים לא נשארו בתוך הארגון — הם יצאו לכתובת חיצונית (185.220.101.48) שלא שייכת לאף אחד מהעובדים.",
    conclusion: "הייצוא לא היה לצרכים פנימיים. מישהו שלח את רשימת הלקוחות החוצה.",
  },
  {
    label: "ראיה 4", icon: "🗺️",
    title: "הכתובת החיצונית מסתירה זהות — בכוונה",
    body: "VPN הוא שירות שמסווה מאיפה מחשב מתחבר. הכתובת 185.220.101.48 היא נקודת יציאה של VPN בקפריסין — לא ברשימת הכתובות המאושרות של הארגון, ואי אפשר לדעת מי יושב מאחוריה.",
    conclusion: "מי שקיבל את הנתונים הקפיד להסתיר את עצמו. זו לא טעות — זו כוונה.",
  },
  {
    label: "ראיה 5", icon: "💻",
    title: "Maya התחברה מהמחשב האישי שלה, בשעת לילה",
    body: "ה-login של Maya הגיע מהכתובת 192.168.1.55 — זה הלפטופ האישי שלה, לא מחשב משרדי. היא הייתה בבית, מחוברת מרחוק — בדיוק בשעות שבהן הנתונים יצאו.",
    conclusion: "Maya הייתה מחוברת בשעות הלילה, מהמחשב שלה, בזמן שה-api-server \"עבד\". החפיפה הזו אינה מקרית.",
  },
];

const PM_QUESTIONS = [
  {
    q: "מה קרה?",
    options: ["תוקף חיצוני ניצל API", "Maya גנבה credentials של api-server וייצאה נתוני לקוחות", "Daniel שכח לנעול את ה-server"],
    correct: 1,
    okMsg: "✓ נכון — Maya ניצלה גישה לservice account לגיטימי כדי להסוות את הפעולה שלה.",
  },
  {
    q: "מה גורם שורשי?",
    options: ["api-server לא היה מוגן", "Credentials בקובץ config ללא הצפנה + RBAC רחב מדי", "אין monitoring על exports"],
    correct: 1,
    okMsg: "✓ נכון — Secrets בcleartext + גישה לא מבוקרת = שילוב מסוכן.",
  },
  {
    q: "מה מונע הישנות?",
    options: ["לסגור את כל ה-API", "Secrets manager + least-privilege + DLP alerts", "לפטר את Maya"],
    correct: 1,
    okMsg: "✓ נכון — כלים טכניים ב-depth defense, לא פתרון נקודתי.",
  },
];

const PHASES_ORDER: Phase[] = ["tools", "timeline", "evidence", "suspect", "postmortem"];

// ─── State persistence ────────────────────────────────────────────────────────

type SavedMysteryState = {
  phase?: Phase;
  usedTools?: ToolId[];
  activeToolId?: ToolId | null;
  toolAnswers?: Record<ToolId, number | null>;
  grepSelected?: number[];
  grepSubmitted?: boolean;
  metaPicked?: number | null;
  timelineOrder?: string[];
  timelineSubmitted?: boolean;
  evidenceIdx?: number;
  evidenceRevealed?: boolean;
  suspectPicked?: string | null;
  pmIdx?: number;
  pmPicked?: number | null;
  pmDoneAll?: boolean;
};

function loadSavedMysteryState(): SavedMysteryState {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("cyber-mystery-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CyberMystery() {
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
  const [toolAnswers, setToolAnswers]     = useState<Record<ToolId, number | null>>(saved.toolAnswers ?? { grep: null, ls: null, last: null });
  const [grepSelected, setGrepSelected]   = useState<Set<number>>(new Set(saved.grepSelected ?? []));
  const [grepSubmitted, setGrepSubmitted] = useState(saved.grepSubmitted ?? false);
  const [metaPicked, setMetaPicked]       = useState<number | null>(saved.metaPicked ?? null);

  // Timeline phase state
  const [timelineOrder, setTimelineOrder]         = useState<string[]>(saved.timelineOrder ?? []);
  const [timelineSubmitted, setTimelineSubmitted] = useState(saved.timelineSubmitted ?? false);

  // Evidence phase state
  const [evidenceIdx, setEvidenceIdx]         = useState(saved.evidenceIdx ?? 0);
  const [evidenceRevealed, setEvidenceRevealed] = useState(saved.evidenceRevealed ?? false);

  // Suspect phase state
  const [suspectPicked, setSuspectPicked] = useState<string | null>(saved.suspectPicked ?? null);

  // Postmortem phase state
  const [pmIdx, setPmIdx]         = useState(saved.pmIdx ?? 0);
  const [pmPicked, setPmPicked]   = useState<number | null>(saved.pmPicked ?? null);
  const [pmDoneAll, setPmDoneAll] = useState(saved.pmDoneAll ?? false);

  useEffect(() => {
    try {
      localStorage.setItem("cyber-mystery-state", JSON.stringify({
        phase,
        usedTools: Array.from(usedTools), activeToolId, toolAnswers,
        grepSelected: Array.from(grepSelected), grepSubmitted, metaPicked,
        timelineOrder, timelineSubmitted,
        evidenceIdx, evidenceRevealed,
        suspectPicked,
        pmIdx, pmPicked, pmDoneAll,
      } satisfies SavedMysteryState));
    } catch {/* ignore */}
  }, [phase, usedTools, activeToolId, toolAnswers, grepSelected, grepSubmitted, metaPicked,
      timelineOrder, timelineSubmitted, evidenceIdx, evidenceRevealed, suspectPicked, pmIdx, pmPicked, pmDoneAll]);

  function markDone() {
    try {
      const cur = JSON.parse(localStorage.getItem("cyber-journey") || "{}");
      localStorage.setItem("cyber-journey", JSON.stringify({ ...cur, mystery: true }));
    } catch {/* ignore */}
  }

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  const activeTool = TOOLS.find((t) => t.id === activeToolId) ?? null;

  // All tools done = grep submitted + ls answered + last answered + meta answered
  const allToolsAnswered = grepSubmitted && toolAnswers.ls !== null && toolAnswers.last !== null && metaPicked !== null;

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
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: RED }}>
      <div className="max-w-[720px] mx-auto">
        <Link href="/explore/cyber" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.82 }}>
          ← חזרה לסייבר
        </Link>
        <div className="text-[20px]" style={HEEBO}>תעלומת הדלף — CyberSec Inc.</div>
        <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>חקירת data breach · Digital Forensics</div>
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
            style={{ background: "rgba(220,38,38,0.06)", border: "1.5px solid rgba(220,38,38,0.2)" }}>
            <div className="text-[32px] mb-2">🕵️</div>
            <div className="text-[20px] font-black mb-2" style={{ color: RED, ...HEEBO }}>
              זיהית את הגורם
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.55)" }}>
              תוך 18 דקות — <span className="font-bold">Digital Forensics.</span>
            </div>
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>מה עשית</div>
            {["✓ Log analysis — grep, ls, last", "✓ Timeline reconstruction", "✓ Evidence chain — 5 ראיות", "✓ Suspect identification", "✓ Post-mortem — שורש, גורם, מניעה"].map((line, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 text-[12px]" style={{ color: "#15803d" }}>{line}</div>
            ))}
            <div className="mt-3 pt-3 text-[12.5px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
              &quot;Digital forensics&quot; — זה מה שחוקר אבטחה עושה בכל תקרית: נתונים, לא ניחושים.
            </div>
          </div>
          <Link href="/explore/cyber/experience"
            className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
            style={{ background: RED, color: "#fff", ...HEEBO }}>
            לכלי עיבוד החוויה ←
          </Link>
          <Link href="/explore/cyber"
            className="block w-full py-3.5 rounded-2xl text-center text-[13px] font-bold"
            style={{ background: "rgba(220,38,38,0.08)", color: RED }}>
            מיציתי — חזרה לסייבר ←
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
              style={{ background: "rgba(220,38,38,0.05)", border: "1.5px solid rgba(220,38,38,0.15)" }}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: RED }}>
                🏢 CyberSec Inc. — הרקע
              </div>
              <div className="text-[12.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
                חברת אבטחת מידע שמנהלת נתוני לקוחות רגישים — שמות, כתובות, מספרי זהות. לחברה מערכת API שמאפשרת ייצוא נתונים לצרכים פנימיים. הבוקר עלה alert מוזר: ייצוא חריג בשעות הלילה. <span className="font-bold" style={{ color: RED }}>8,500 רשומות לקוח</span> עלולות להיות בידיים לא נכונות.
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
                  { icon: "🔴", label: "Status",   val: "Data breach suspected — customer records" },
                  { icon: "📁", label: "Records",  val: "8,500 רשומות לקוח — שמות, מיילים, ת.ז." },
                  { icon: "⏰", label: "Window",   val: "03:00–05:14 אתמול בלילה" },
                  { icon: "📤", label: "Exports",  val: "2 × 8.7MB — api-server | → IP חיצוני" },
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

            {/* Suspects */}
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>
              שלושה חשודים
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { emoji: "👨‍💻", name: "Daniel", role: "dev-01 — מפתח backend", note: "גישה ל-API לפיתוח, אין לו גישה לmgmt ולconfig" },
                { emoji: "👩‍💼", name: "Maya",   role: "admin-02 — מנהלת מערכת", note: "גישה לכמעט הכל — כולל קבצי config ו-server logs" },
                { emoji: "🤖", name: "api-server", role: "service account — מאפשר ייצוא נתונים", note: "Credentials שמורים ב-config file על ה-server" },
              ].map((s) => (
                <div key={s.name} className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <span className="text-[24px] shrink-0">{s.emoji}</span>
                  <div>
                    <div className="text-[12.5px] font-black" style={{ color: NAVY }}>{s.name} — {s.role}</div>
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
                <GlossaryChip term="grep" explanation="חיפוש טקסט בקבצים. grep &quot;EXPORT&quot; access.log יחפש את כל שורות הייצוא ב-log." />
                <GlossaryChip term="access.log" explanation="יומן גישה — קובץ שרושם כל בקשה שנכנסת לשרת: מי, מה, מתי, מאיזה IP ומה גודל התגובה." />
                <GlossaryChip term="ls -lh" explanation="list — מציג רשימת קבצים עם גדלים ותאריכים. -l = פרטים, -h = גדלים קריאים (8.7M)." />
                <GlossaryChip term="last" explanation="מציג מי התחבר למערכת, מאיזה IP ומתי. כלי בסיסי בכל חקירת פריצה — מראה session history." />
                <GlossaryChip term="service account" explanation="חשבון מערכת שמשמש תוכנות (לא אנשים) לגישה לresources. Credentials שלו = מפתחות — גניבתם מסוכנת." />
              </div>
            </div>

            {/* Bridge — tools from day */}
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: "rgba(220,38,38,0.05)", border: "1.5px solid rgba(220,38,38,0.15)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: RED }}>
                ✓ מה שכבר עשית היום
              </div>
              <div className="text-[12px] leading-[1.55]" style={{ color: "rgba(0,0,0,0.6)" }}>
                עצרת ransomware, בדדת מכונות, ניתחת logs — עכשיו תחקרי מקרה אחר לגמרי: לא מתקפה מבחוץ, אלא אולי מישהו <span className="font-bold">מבפנים</span>.
              </div>
            </div>

            {/* Non-linear tip */}
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
              <div className="text-[12.5px] leading-[1.55]" style={{ color: "#92400e" }}>
                💡 <span className="font-bold">הפעם — את בוחרת את הסדר.</span> השתמשי בשלושת כלי החקירה בכל סדר שתרצי. כל אחד מוסיף פיסת מידע אחרת. אחרי שבדקת את כולם — תרכיבי את התמונה המלאה.
              </div>
            </div>

            <button type="button" onClick={() => go("tools")}
              className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
              style={{ background: RED, color: "#fff", ...HEEBO }}>
              התחילי לחקור ←
            </button>
          </>
        )}

        {/* ── TOOLS ── */}
        {phase === "tools" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב א׳ — חקירת הלוגים</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              בחרי כלי, הריצי אותו, ענה על השאלה — ואז חזרי לבחור כלי נוסף.
            </div>

            {/* ── Skeleton timeline — goal card ── */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
                🎯 מה אנחנו בונות — Timeline של הדלף
              </div>
              <div className="flex flex-col gap-[7px]">
                {[
                  { time: "02:57", label: toolAnswers.last !== null ? "Maya התחברה" : "?", known: toolAnswers.last !== null, fromTool: true },
                  { time: "03:14", label: "ייצוא ראשון — api-server", known: true, fromTool: false },
                  { time: "04:52", label: "ייצוא שני — api-server", known: true, fromTool: false },
                  { time: "05:14", label: toolAnswers.last !== null ? "Maya התנתקה" : "?", known: toolAnswers.last !== null, fromTool: true },
                  { time: "09:02", label: toolAnswers.last !== null ? "Daniel נכנס" : "?", known: toolAnswers.last !== null, fromTool: true },
                  { time: "09:17", label: "Alert מופעל ב-SOC", known: true, fromTool: false },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="w-10 shrink-0 text-right font-bold" style={{ color: NAVY }}>{row.time}</span>
                    <span className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                      style={{ background: row.known ? (row.fromTool ? "#16a34a" : RED) : "rgba(0,0,0,0.15)" }} />
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
                  💡 כל כלי שתריצי ימלא פיסה נוספת — הסימנים הירוקים מגיעים מה-
                  <span className="font-mono">last</span>
                </div>
              )}
            </div>

            {/* ── Tool buttons ── */}
            <div className="flex flex-col gap-2 mb-4">
              {TOOLS.map((tool) => {
                const isActive  = activeToolId === tool.id;
                const answered  = tool.id === "grep" ? grepSubmitted : toolAnswers[tool.id] !== null;
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
                      border: isActive ? "1.5px solid rgba(220,38,38,0.4)" : answered ? "1.5px solid rgba(22,163,74,0.25)" : "1px solid rgba(0,0,0,0.08)",
                    }}>
                    <span className="text-[14px] font-mono" style={{ color: isActive ? "#60a5fa" : "#6b7280" }}>$</span>
                    <span className="flex-1 font-mono text-[12px] text-left" style={{ color: isActive ? "#e2e8f0" : NAVY }}>
                      {tool.cmd}
                    </span>
                    {answered
                      ? <span style={{ color: "#16a34a", fontSize: 14 }}>✓</span>
                      : isUsed
                        ? <span style={{ color: RED, fontSize: 12 }}>●</span>
                        : null}
                  </button>
                );
              })}
            </div>

            {/* ── Active tool ── */}
            {activeTool && (
              <div className="mb-4">
                <TerminalCard title={activeTool.cmd} lines={activeTool.output} />

                {/* GREP — multi-select lines */}
                {activeTool.id === "grep" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-1" style={{ color: NAVY }}>
                      סמני את השורות החשודות בפלט:
                    </div>
                    <div className="text-[11px] mb-3" style={{ color: "rgba(0,0,0,0.4)" }}>
                      לחצי על שורה לבחירה — ייתכן יותר מאחת חשודה
                    </div>
                    <div className="flex flex-col gap-2 mb-3">
                      {GREP_LINES.map((line, i) => {
                        const isSelected = grepSelected.has(i);
                        const showResult = grepSubmitted;
                        const isCorrect  = showResult && line.suspicious && isSelected;
                        const isWrong    = showResult && isSelected && !line.suspicious;
                        const isMissed   = showResult && !isSelected && line.suspicious;

                        return (
                          <button key={i} type="button"
                            onClick={() => {
                              if (grepSubmitted) return;
                              setGrepSelected((prev) => {
                                const next = new Set(prev);
                                if (next.has(i)) next.delete(i); else next.add(i);
                                return next;
                              });
                            }}
                            disabled={grepSubmitted}
                            className="w-full rounded-xl px-3 py-2.5 text-left transition-all"
                            style={{
                              background: isCorrect ? "rgba(22,163,74,0.1)" : isWrong ? "rgba(220,38,38,0.08)" : isMissed ? "rgba(251,133,0,0.08)" : isSelected ? "rgba(220,38,38,0.06)" : "#f8fafc",
                              border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isMissed ? "1.5px solid rgba(251,133,0,0.35)" : isSelected ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.06)",
                            }}>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center"
                                style={{
                                  background: isCorrect ? "#16a34a" : isWrong ? RED : isSelected ? RED : "rgba(0,0,0,0.08)",
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

                    {!grepSubmitted ? (
                      <button type="button"
                        onClick={() => setGrepSubmitted(true)}
                        disabled={grepSelected.size === 0}
                        className="w-full py-3 rounded-xl text-[13px] font-bold transition-all"
                        style={{
                          background: grepSelected.size > 0 ? RED : "rgba(0,0,0,0.05)",
                          color: grepSelected.size > 0 ? "#fff" : "rgba(0,0,0,0.3)",
                        }}>
                        אשרי בחירה
                      </button>
                    ) : (
                      <>
                        <div className="rounded-xl px-3 py-2.5 mb-3 text-[12px] leading-[1.55]"
                          style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                          ✓ api-server ביצע את הייצואים — service account. מישהו ניצל את הcredentials שלו כדי להסוות את הפעולה.
                        </div>
                        {!allToolsAnswered && (
                          <button type="button" onClick={() => setActiveToolId(null)}
                            className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-1 transition-all"
                            style={{ background: "rgba(220,38,38,0.08)", color: RED, border: "1.5px solid rgba(220,38,38,0.15)" }}>
                            ← בחרי כלי נוסף
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* LS — calculation MCQ */}
                {activeTool.id === "ls" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{activeTool.question}</div>
                    {activeTool.options.map((opt, i) => {
                      const isCorrect  = i === activeTool.correct;
                      const isPicked   = toolAnswers.ls === i;
                      const showResult = toolAnswers.ls !== null;

                      return (
                        <button key={i} type="button"
                          onClick={() => handleToolAnswer("ls", i)}
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
                    {toolAnswers.ls !== null && !allToolsAnswered && (
                      <button type="button" onClick={() => setActiveToolId(null)}
                        className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-2 transition-all"
                        style={{ background: "rgba(220,38,38,0.08)", color: RED, border: "1.5px solid rgba(220,38,38,0.15)" }}>
                        ← בחרי כלי נוסף
                      </button>
                    )}
                  </div>
                )}

                {/* LAST — MCQ + metacognitive */}
                {activeTool.id === "last" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{activeTool.question}</div>
                    {activeTool.options.map((opt, i) => {
                      const isCorrect  = i === activeTool.correct;
                      const isPicked   = toolAnswers.last === i;
                      const showResult = toolAnswers.last !== null;

                      return (
                        <button key={i} type="button"
                          onClick={() => handleToolAnswer("last", i)}
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

                    {/* Metacognitive question — appears after last is answered */}
                    {toolAnswers.last !== null && (
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
                        {/* Back to tools if ls still needed */}
                        {metaPicked !== null && !allToolsAnswered && (
                          <button type="button" onClick={() => setActiveToolId(null)}
                            className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-2 transition-all"
                            style={{ background: "rgba(220,38,38,0.08)", color: RED, border: "1.5px solid rgba(220,38,38,0.15)" }}>
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
                <GlossaryChip term="service account" explanation="חשבון מערכת — לא משתמש אנושי. Credentials שלו = מפתחות שניתן לגנוב ולהשתמש בהם." />
                <GlossaryChip term="ACL" explanation="Access Control List — רשימה שמגדירה מי יכול לגשת לאיזה קובץ ועם אילו הרשאות." />
                <GlossaryChip term="exfiltration" explanation="הוצאת נתונים מהארגון ללא אישור — זה מה שקרה כאן: הנתונים יצאו לIP חיצוני." />
              </div>
            )}

            {/* Counter */}
            {!allToolsAnswered && (() => {
              const rem = [!grepSubmitted, toolAnswers.ls === null, toolAnswers.last === null].filter(Boolean).length;
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
                style={{ background: RED, color: "#fff", ...HEEBO }}>
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
                { tool: "grep", text: "api-server ביצע שני EXPORTs — בשעה 03:14 ובשעה 04:52" },
                { tool: "ls",   text: "סה\"כ 17.4MB יצאו — שני קבצים שלמים של נתוני לקוחות" },
                { tool: "last", text: "Maya הייתה מחוברת 02:57 עד 05:14 — כולל שתי נקודות הייצוא" },
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
              style={{ background: "rgba(220,38,38,0.05)", border: "1.5px solid rgba(220,38,38,0.15)" }}>
              <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
                <span className="font-bold" style={{ color: RED }}>למה Timeline?</span>{" "}
                חפיפת זמנים היא הראיה המרכזית — אם Maya הייתה מחוברת בדיוק בזמן הייצואים, זה לא מקרה. Timeline מחבר בין הממצאים ומוכיח קשר עם נתונים, לא ניחושים.
              </div>
            </div>

            {/* How-to card */}
            <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
              <div className="flex gap-1.5 shrink-0">
                {["1", "2", "3"].map((n) => (
                  <div key={n} className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black"
                    style={{ background: RED, color: "#fff" }}>{n}</div>
                ))}
              </div>
              <div className="text-[11.5px] leading-[1.5]" style={{ color: NAVY }}>
                לחצי על כרטיס = מקצה לו מספר סידורי. לחיצה נוספת — מבטלת.
              </div>
            </div>

            {/* Tapable events (1–5) */}
            <div className="flex flex-col gap-2 mb-3">
              {TIMELINE_EVENTS.filter((ev) => ev.id !== "alert").map((ev) => {
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
                      background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(220,38,38,0.06)" : "#fff",
                      border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isSelected ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.08)",
                    }}>
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-black"
                      style={{
                        background: isCorrect ? "#16a34a" : isWrong ? RED : isSelected ? RED : "rgba(0,0,0,0.06)",
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

            {/* Pre-placed anchor — Alert #6 */}
            <div className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-4"
              style={{
                background: timelineSubmitted ? "rgba(22,163,74,0.08)" : "rgba(2,62,138,0.04)",
                border: timelineSubmitted ? "1.5px solid rgba(22,163,74,0.3)" : "1.5px dashed rgba(2,62,138,0.2)",
              }}>
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-black"
                style={{ background: timelineSubmitted ? "#16a34a" : NAVY, color: "#fff" }}>
                6
              </div>
              <div className="flex-1 text-right">
                <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>Alert מופעל ב-SOC</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>
                  {timelineSubmitted ? "09:17" : "ממוקם מראש — ברור שהוא אחרון"}
                </div>
              </div>
            </div>

            {!timelineSubmitted ? (
              <button type="button" onClick={() => setTimelineSubmitted(true)}
                disabled={timelineOrder.length < TIMELINE_EVENTS.length - 1}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all active:scale-[0.98]"
                style={{
                  background: timelineOrder.length === TIMELINE_EVENTS.length - 1 ? RED : "rgba(0,0,0,0.06)",
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
                  ✓ Timeline ברור — Maya נכנסה לפני הייצוא ויצאה אחריו. Daniel נכנס רק בבוקר.
                </div>
                <button type="button" onClick={() => go("evidence")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                  style={{ background: RED, color: "#fff", ...HEEBO }}>
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
              לחצי להצגת ראיה אחת בכל פעם — הן יצרו שרשרת שמצביעה על הגורם:
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {EVIDENCE_ITEMS.slice(0, evidenceIdx + 1).map((ev, i) => (
                <div key={i} className="rounded-2xl px-4 py-4"
                  style={{ background: "#fff", border: "1px solid rgba(220,38,38,0.15)" }}>
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
                  {/* Conclusion */}
                  <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                    style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
                    <span className="text-[12px] font-black shrink-0" style={{ color: RED }}>⟹</span>
                    <div className="text-[12px] leading-[1.55] font-medium" style={{ color: "#7f1d1d" }}>
                      {ev.conclusion}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {evidenceIdx < EVIDENCE_ITEMS.length - 1 && !evidenceRevealed ? (
              <button type="button" onClick={() => setEvidenceIdx((i) => i + 1)}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black mb-3 transition-all active:scale-[0.98]"
                style={{ background: "rgba(220,38,38,0.08)", color: RED, border: "1.5px solid rgba(220,38,38,0.2)" }}>
                הצגי ראיה {evidenceIdx + 2} מ-{EVIDENCE_ITEMS.length} ←
              </button>
            ) : !evidenceRevealed ? (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "#b91c1c" }}>
                  חמש ראיות — מספיק לזהות את הגורם. מי ביצע את הדלף?
                </div>
                <button type="button" onClick={() => { setEvidenceRevealed(true); go("suspect"); }}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                  style={{ background: RED, color: "#fff", ...HEEBO }}>
                  שלב ד׳ — זיהוי חשוד ←
                </button>
              </>
            ) : null}
          </>
        )}

        {/* ── SUSPECT ── */}
        {phase === "suspect" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ד׳ — זיהוי הגורם</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              על סמך הראיות — מי ביצע את הדלף?
            </div>

            {[
              {
                id: "daniel",
                name: "Daniel (dev-01)",
                emoji: "👨‍💻",
                evidence: ["לא היה מחובר בשעות הדלף", "נכנס רק ב-09:02 — אחרי האירוע"],
                correct: false,
                errMsg: "✗ לא — Daniel לא היה מחובר בזמן הדלף (02:57–05:14).",
              },
              {
                id: "maya",
                name: "Maya (admin-02)",
                emoji: "👩‍💼",
                evidence: [
                  "מחוברת 02:57–05:14 — כולל שתי נקודות הייצוא",
                  "הייתה לה גישה ל-api-server credentials",
                  "IP login תואם ללפטופ האישי שלה מחוץ למשרד",
                  "IP חיצוני קיבל את הנתונים בדיוק בזמן ה-session שלה",
                ],
                correct: true,
                errMsg: "",
              },
              {
                id: "api",
                name: "api-server (service account)",
                emoji: "🤖",
                evidence: ["שימש כ-tool בלבד — לא actor עצמאי", "Credentials נגנבו ממנו"],
                correct: false,
                errMsg: "✗ לא — api-server הוא כלי שמישהו ניצל, לא הגורם עצמו.",
              },
            ].map((suspect) => {
              const isPicked   = suspectPicked === suspect.id;
              const showResult = suspectPicked !== null;

              return (
                <button key={suspect.id} type="button"
                  onClick={() => { if (!suspectPicked) setSuspectPicked(suspect.id); }}
                  disabled={!!suspectPicked}
                  className="w-full rounded-2xl p-4 flex items-start gap-3 mb-3 transition-all text-right"
                  style={{
                    background: showResult && suspect.correct ? "rgba(22,163,74,0.08)" : showResult && isPicked && !suspect.correct ? "rgba(220,38,38,0.08)" : "#fff",
                    border: showResult && suspect.correct ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !suspect.correct ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid rgba(0,0,0,0.08)",
                  }}>
                  <span className="text-[28px] shrink-0">{suspect.emoji}</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-black mb-1" style={{ color: NAVY }}>{suspect.name}</div>
                    <div className="flex flex-col gap-1">
                      {suspect.evidence.map((e, i) => (
                        <div key={i} className="text-[11.5px] leading-[1.45]"
                          style={{ color: showResult && suspect.correct ? "#15803d" : "rgba(0,0,0,0.5)" }}>
                          {showResult && suspect.correct ? "✓ " : "• "}{e}
                        </div>
                      ))}
                    </div>
                    {showResult && isPicked && !suspect.correct && (
                      <div className="mt-2 text-[12px]" style={{ color: "#b91c1c" }}>{suspect.errMsg}</div>
                    )}
                  </div>
                </button>
              );
            })}

            {suspectPicked === "maya" && (
              <button type="button" onClick={() => go("postmortem")}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                style={{ background: RED, color: "#fff", ...HEEBO }}>
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
                style={{ background: RED, color: "#fff", ...HEEBO }}>
                {pmIdx + 1 < PM_QUESTIONS.length ? `שאלה ${pmIdx + 2} ←` : "סיום ←"}
              </button>
            )}

            {pmDoneAll && (
              <button type="button" onClick={() => { markDone(); go("done"); }}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                style={{ background: RED, color: "#fff", ...HEEBO }}>
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
