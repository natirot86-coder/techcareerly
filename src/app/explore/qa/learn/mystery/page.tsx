"use client";
import React, { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const AMBER = "#d97706";
const NAVY = "#023e8a";

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
        style={{ background: "rgba(217,119,6,0.1)", color: AMBER, border: "1px solid rgba(217,119,6,0.2)" }}>
        {term} <span style={{ fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 rounded-xl px-3 py-2.5 text-[12px] leading-[1.6] w-[240px]"
          style={{ background: "#fff", border: "1px solid rgba(217,119,6,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.7)" }}>
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

type ToolId = "grep" | "coverage" | "ci";
type Phase = "intro" | "tools" | "timeline" | "evidence" | "cause" | "postmortem" | "done";

const TOOLS: { id: ToolId; cmd: string; output: { text: string; color?: string }[]; question: string; options: string[]; correct: number; okMsg: string }[] = [
  {
    id: "grep",
    cmd: 'grep -rn "discount" tests/',
    output: [
      { text: '$ grep -rn "discount" tests/', color: "#60a5fa" },
      { text: "tests/checkout.spec.js:34: test('applies valid discount code correctly')" },
      { text: "(1 result)" },
    ],
    question: "", options: [], correct: 0, okMsg: "", // handled separately (single info card)
  },
  {
    id: "coverage",
    cmd: "npm run coverage -- checkout.js",
    output: [
      { text: "$ npm run coverage -- checkout.js", color: "#60a5fa" },
      { text: "File            % Stmts   % Branch" },
      { text: "checkout.js       88%        50%" },
      { text: "  ↳ discount lookup branch: NOT COVERED", color: "#f87171" },
    ],
    question: "מה אומר 50% Branch coverage על לוגיקת ההנחה?",
    options: ["הקוד רץ לאט", "רק אחד משני המסלולים האפשריים (קוד תקין / קוד לא קיים) נבדק אי פעם", "יש 50% סיכוי שהקוד יעבוד"],
    correct: 1,
    okMsg: "✓ נכון — Branch coverage מודד כמה מהמסלולים האפשריים בקוד רצו בטסטים. 50% פה = רק חצי מהתמונה נבדקה, בדיוק החצי שלא כלל את הבאג.",
  },
  {
    id: "ci",
    cmd: "ci-history --file tests/checkout.edge-cases.spec.js",
    output: [
      { text: "$ ci-history --file tests/checkout.edge-cases.spec.js", color: "#60a5fa" },
      { text: "2024-06-02  DISABLED  reason: \"flaky — skip for now\"" },
      { text: "2024-06-02 .. today   status: still disabled (67 days)" },
    ],
    question: "מה משמעות הממצא הזה לגבי הבאג שקרה השבוע?",
    options: ["אין קשר — זה טסט אחר לגמרי", "הטסט שכיסה בדיוק את מקרה 'קוד הנחה לא קיים' הושבת לפני חודשיים ולא הופעל מחדש", "הטסט הזה תמיד היה שבור מלכתחילה"],
    correct: 1,
    okMsg: "✓ נכון — זה בדיוק הטסט שהיה תופס את הבאג. הוא סומן 'flaky' לפני חודשיים כדי לא לעכב פריסה — ואף אחת לא חזרה לתקן ולהפעיל אותו מחדש.",
  },
];

const META_Q = {
  question: "עכשיו ידוע לנו: אין טסט חדש להנחה, ה-coverage חלקי, וטסט רלוונטי מושבת. מה הצעד הבא בחקירה?",
  options: [
    { text: "לבדוק למה בדיוק הטסט המושבת סומן 'flaky' ומה היה קורה אילו הוא רץ", correct: true },
    { text: "להפעיל את הטסט מחדש ולסגור את החקירה — הבעיה נפתרה", correct: false },
    { text: "להתעלם — הבאג כבר תוקן בקוד, אין מה לבדוק יותר", correct: false },
  ],
  okMsg: "✓ בדיוק — שלושה כלים נתנו 3 פיסות מידע. עכשיו בודקים איך התהליך עצמו איפשר לזה לקרות.",
};

const TIMELINE_EVENTS = [
  { id: "disabled",  label: "טסט edge-cases מושבת (flaky)",       time: "יום 0",   correct: 0 },
  { id: "feature",   label: "פיצ'ר קוד הנחה נוסף ל-checkout",     time: "יום 62",  correct: 1 },
  { id: "merged",    label: "PR עובר review וממוזג בלי טסט חדש",   time: "יום 62",  correct: 2 },
  { id: "shipped",   label: "הפיצ'ר יוצא לפרודקשן",                time: "יום 63",  correct: 3 },
  { id: "reported",  label: "QA פותחת חקירה אחרי דיווח לקוח",       time: "יום 67",  correct: 4 },
];

const EVIDENCE_ITEMS = [
  {
    label: "ראיה 1", icon: "🚫",
    title: "הטסט שהיה תופס את זה — מושבת",
    body: "tests/checkout.edge-cases.spec.js כלל מקרה בדיקה בשם \"checkout with invalid discount code shows error\". הוא הושבת ב-CI לפני 67 יום בגלל שהיה לא-יציב (flaky) — ולא הופעל מחדש מאז.",
    code: "// DISABLED 2024-06-02 — flaky, revisit later\ntest.skip('checkout with invalid discount code', () => { ... })",
    conclusion: "המקרה המדויק שהיה תופס את הבאג היה קיים בקוד — פשוט לא רץ.",
  },
  {
    label: "ראיה 2", icon: "🆕",
    title: "לא נכתב טסט חדש לפיצ'ר קוד ההנחה",
    body: "כשנוספה תמיכה בקוד הנחה, נכתב טסט אחד בלבד ל'קוד תקין'. אף אחד לא הוסיף מקרה בדיקה ל'קוד לא קיים' — למרות שזה מסלול לוגי נפרד לגמרי.",
    conclusion: "פיצ'ר חדש עם לוגיקה חדשה תמיד צריך גם מקרה בדיקה למסלול הכשל שלו, לא רק להצלחה.",
  },
  {
    label: "ראיה 3", icon: "👀",
    title: "ה-PR עבר review בלי הערה על כיסוי חסר",
    body: "ה-reviewer בדק את הלוגיקה של הקוד עצמו, אבל לא בדק אם יש טסט למקרה הכשל. אין ברשימת הבדיקה של review סעיף שמזכיר coverage.",
    conclusion: "review טוב בודק גם את איכות הבדיקות, לא רק את איכות הקוד.",
  },
  {
    label: "ראיה 4", icon: "🚦",
    title: "אין שער (gate) ב-CI שחוסם ירידת coverage",
    body: "ה-pipeline של CI מריץ טסטים ומדווח על coverage — אבל לא נכשל אם ה-coverage יורד. אפשר למזג קוד גם אם הוא מוריד את אחוז הכיסוי.",
    conclusion: "בלי שער אוטומטי, ההגנה תלויה כולה בזיכרון האנושי — וזה נשבר.",
  },
  {
    label: "ראיה 5", icon: "🔁",
    title: "אף אחת לא חזרה לטסט המושבת ב-67 הימים",
    body: "כשמשביתים טסט 'זמנית' בגלל flaky, בלי תזכורת או תאריך יעד — הוא נשאר מושבת. אין תהליך שמזכיר לחזור ולתקן.",
    conclusion: "טסטים מושבתים בלי מעקב הם חוב טכני שנשכח — עד שהוא מתפוצץ.",
  },
];

const CAUSES = [
  {
    id: "blame_dev",
    name: "המפתחת ששכתבה את הקוד אשמה",
    emoji: "🙅",
    evidence: ["הקוד עצמו כבר תוקן ונבדק בנפרד", "הבעיה כאן היא שהתהליך לא תפס את החוסר — לא איכות הקוד"],
    correct: false,
    errMsg: "✗ זו לא המסקנה הנכונה — הבעיה היא בפער בתהליך הבדיקה, לא באדם ספציפי.",
  },
  {
    id: "process",
    name: "טסט מושבת ללא מעקב + חוסר שער coverage ב-CI",
    emoji: "🚦",
    evidence: [
      "הטסט המדויק שהיה תופס את הבאג הושבת 67 יום קודם",
      "אין שער ב-CI שחוסם merge כשה-coverage יורד",
      "review לא כלל בדיקה של כיסוי בדיקות לפיצ'ר החדש",
    ],
    correct: true,
    errMsg: "",
  },
  {
    id: "blame_qa",
    name: "QA הייתה צריכה לבדוק את זה ידנית לפני השחרור",
    emoji: "🧍",
    evidence: ["בדיקה ידנית של כל שילוב אפשרי לא סקיילבילית", "בדיוק בשביל זה קיימת אוטומציה — כדי לא להסתמך רק על זיכרון אנושי"],
    correct: false,
    errMsg: "✗ לא — אי אפשר לבדוק ידנית כל שינוי בכל release. בדיוק לשם כך קיימת חבילת בדיקות אוטומטית אמינה.",
  },
];

const PM_QUESTIONS = [
  {
    q: "מה קרה בפועל?",
    options: ["באג הגיע לפרודקשן כי המפתחת לא בדקה כלום", "טסט שהיה תופס את הבאג הושבת חודשיים לפני, ולא נכתב טסט חדש לפיצ'ר", "מסד הנתונים היה למטה"],
    correct: 1,
    okMsg: "✓ נכון — שילוב של טסט ישן מושבת + היעדר טסט חדש = חור מוחלט בכיסוי בדיוק במקום הבעיה.",
  },
  {
    q: "מה גורם שורשי?",
    options: ["מפתחת אחת לא מנוסה", "תהליך שמאפשר לטסטים להישאר מושבתים ללא מעקב, ולמזג קוד בלי שער coverage", "השרת היה ישן מדי"],
    correct: 1,
    okMsg: "✓ נכון — תהליך, לא אדם בודד, הוא מה שהיה חסר כאן.",
  },
  {
    q: "מה מונע הישנות?",
    options: ["לאסור השבתת טסטים לחלוטין, לנצח", "שער CI שחוסם ירידת coverage + תאריך יעד חובה לכל טסט מושבת + checklist review שכולל כיסוי", "לפטר את מי שהשבית את הטסט"],
    correct: 1,
    okMsg: "✓ נכון — הגנות אוטומטיות + תהליך מעקב תופסים בדיוק את מה שנשכח בלחץ זמן.",
  },
];

const PHASES_ORDER: Phase[] = ["tools", "timeline", "evidence", "cause", "postmortem"];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function QAMystery() {
  const [phase, setPhase] = useState<Phase>("intro");

  // Tools phase state
  const [usedTools, setUsedTools]         = useState<Set<ToolId>>(new Set());
  const [activeToolId, setActiveToolId]   = useState<ToolId | null>(null);
  const [toolAnswers, setToolAnswers]     = useState<Record<ToolId, number | null>>({ grep: null, coverage: null, ci: null });
  const [grepAck, setGrepAck]             = useState(false);
  const [metaPicked, setMetaPicked]       = useState<number | null>(null);

  // Timeline phase state
  const [timelineOrder, setTimelineOrder]         = useState<string[]>([]);
  const [timelineSubmitted, setTimelineSubmitted] = useState(false);

  // Evidence phase state
  const [evidenceIdx, setEvidenceIdx]         = useState(0);
  const [evidenceRevealed, setEvidenceRevealed] = useState(false);

  // Cause phase state
  const [causePicked, setCausePicked] = useState<string | null>(null);

  // Postmortem phase state
  const [pmIdx, setPmIdx]         = useState(0);
  const [pmPicked, setPmPicked]   = useState<number | null>(null);
  const [pmDoneAll, setPmDoneAll] = useState(false);

  function markDone() {
    try {
      const cur = JSON.parse(localStorage.getItem("qa-journey") || "{}");
      localStorage.setItem("qa-journey", JSON.stringify({ ...cur, mystery: true }));
    } catch {/* ignore */}
  }

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  const activeTool = TOOLS.find((t) => t.id === activeToolId) ?? null;

  const allToolsAnswered = grepAck && toolAnswers.coverage !== null && toolAnswers.ci !== null && metaPicked !== null;

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
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: AMBER }}>
      <div className="max-w-[720px] mx-auto">
        <Link href="/explore/qa" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.82 }}>
          ← חזרה ל-QA
        </Link>
        <div className="text-[20px]" style={HEEBO}>איך זה עבר את ה-QA? — TechFlow</div>
        <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>חקירת פער כיסוי בדיקות · Process Forensics</div>
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
            style={{ background: "rgba(217,119,6,0.06)", border: "1.5px solid rgba(217,119,6,0.2)" }}>
            <div className="text-[32px] mb-2">🕵️</div>
            <div className="text-[20px] font-black mb-2" style={{ color: AMBER, ...HEEBO }}>
              מצאת את הפער בתהליך
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.55)" }}>
              תוך 19 דקות — <span className="font-bold">Process Forensics.</span>
            </div>
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>מה עשית</div>
            {["✓ חקירת test suite — grep, coverage, CI history", "✓ Timeline reconstruction", "✓ Evidence chain — 5 ראיות", "✓ זיהוי גורם שורשי בתהליך", "✓ Post-mortem — שורש, גורם, מניעה"].map((line, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 text-[12px]" style={{ color: "#15803d" }}>{line}</div>
            ))}
            <div className="mt-3 pt-3 text-[12.5px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
              &quot;Process forensics&quot; — זה מה ש-QA עושה אחרי כל תקרית: לא רק לתקן את הבאג, אלא להבין למה הבדיקות לא תפסו אותו.
            </div>
          </div>
          <Link href="/explore/qa/experience"
            className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
            style={{ background: AMBER, color: "#fff", ...HEEBO }}>
            לכלי עיבוד החוויה ←
          </Link>
          <Link href="/explore/qa"
            className="block w-full py-3.5 rounded-2xl text-center text-[13px] font-bold"
            style={{ background: "rgba(217,119,6,0.08)", color: AMBER }}>
            מיציתי — חזרה ל-QA ←
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
              style={{ background: "rgba(217,119,6,0.05)", border: "1.5px solid rgba(217,119,6,0.15)" }}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: AMBER }}>
                🏢 TechFlow — הרקע
              </div>
              <div className="text-[12.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
                באג בחישוב קוד הנחה כבר תוקן בקוד. אבל השאלה האמיתית לא נסגרה: <span className="font-bold" style={{ color: AMBER }}>איך זה בכלל עבר את ה-QA ויצא לפרודקשן?</span> את חוקרת את התהליך, לא את הקוד.
              </div>
            </div>

            {/* Incident dashboard */}
            <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-bold" style={{ color: "#fbbf24" }}>🔍 QA Investigation</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>OPEN</span>
              </div>
              <div className="p-4" style={{ background: "#111827" }}>
                {[
                  { icon: "✅", label: "Code fix",  val: "כבר במיזוג — checkout.js תוקן" },
                  { icon: "❓", label: "Question",  val: "למה test suite לא תפס את זה?" },
                  { icon: "📁", label: "Files",     val: "checkout.spec.js · checkout.edge-cases.spec.js" },
                  { icon: "📊", label: "Coverage",  val: "88% statements · 50% branches" },
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

            {/* Candidate causes */}
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>
              שלושה כיוונים אפשריים
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { emoji: "🙅", name: "כישלון אישי", role: "המפתחת שכתבה את הקוד", note: "אבל הקוד עצמו כבר תוקן — זו לא כל התמונה" },
                { emoji: "🚦", name: "פער בתהליך", role: "test coverage + CI + review", note: "האם משהו במערכת אמור היה לתפוס את זה?" },
                { emoji: "🧍", name: "כישלון QA ידני", role: "בדיקה ידנית לפני שחרור", note: "האם היה סביר לצפות שבדיקה ידנית תתפוס זאת?" },
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
                <GlossaryChip term="grep" explanation="חיפוש טקסט בקבצים — כאן נשתמש בו כדי למצוא אילו קבצי טסט בכלל מתייחסים ל'discount'." />
                <GlossaryChip term="coverage" explanation="דוח שמראה איזה אחוז מהקוד (ומאילו מסלולים לוגיים) רץ בפועל במהלך הטסטים." />
                <GlossaryChip term="branch coverage" explanation="לא רק 'האם השורה רצה' — אלא 'האם כל אחד מהתנאים האפשריים (if/else) נבדק'." />
                <GlossaryChip term="CI history" explanation="יומן שמראה מתי טסט הושבת, על ידי מי, ומה הסיבה שנרשמה — עוזר להבין החלטות עבר." />
                <GlossaryChip term="flaky test" explanation="טסט שנכשל לפעמים בלי שהקוד השתנה — לעיתים משביתים אותו זמנית, אבל 'זמני' נשכח בקלות." />
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
              style={{ background: AMBER, color: "#fff", ...HEEBO }}>
              התחילי לחקור ←
            </button>
          </>
        )}

        {/* ── TOOLS ── */}
        {phase === "tools" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב א׳ — חקירת ה-Test Suite</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              בחרי כלי, הריצי אותו, ענה על השאלה — ואז חזרי לבחור כלי נוסף.
            </div>

            {/* ── Skeleton — goal card ── */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
                🎯 מה אנחנו בונות — תמונת הפער בבדיקות
              </div>
              <div className="flex flex-col gap-[7px]">
                {[
                  { label: grepAck ? "רק טסט אחד מזכיר discount" : "?", known: grepAck, fromTool: true },
                  { label: "הבאג הגיע לפרודקשן דרך checkout.js", known: true, fromTool: false },
                  { label: toolAnswers.coverage !== null ? "מסלול 'קוד לא קיים' לא נבדק כלל" : "?", known: toolAnswers.coverage !== null, fromTool: true },
                  { label: toolAnswers.ci !== null ? "הטסט הרלוונטי מושבת כבר 67 יום" : "?", known: toolAnswers.ci !== null, fromTool: true },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                      style={{ background: row.known ? (row.fromTool ? "#16a34a" : AMBER) : "rgba(0,0,0,0.15)" }} />
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
                  💡 כל כלי שתריצי ימלא פיסה נוספת בתמונה
                </div>
              )}
            </div>

            {/* ── Tool buttons ── */}
            <div className="flex flex-col gap-2 mb-4">
              {TOOLS.map((tool) => {
                const isActive  = activeToolId === tool.id;
                const answered  = tool.id === "grep" ? grepAck : toolAnswers[tool.id] !== null;
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
                      border: isActive ? "1.5px solid rgba(217,119,6,0.4)" : answered ? "1.5px solid rgba(22,163,74,0.25)" : "1px solid rgba(0,0,0,0.08)",
                    }}>
                    <span className="text-[14px] font-mono" style={{ color: isActive ? "#fbbf24" : "#6b7280" }}>$</span>
                    <span className="flex-1 font-mono text-[12px] text-left" style={{ color: isActive ? "#e2e8f0" : NAVY }}>
                      {tool.cmd}
                    </span>
                    {answered
                      ? <span style={{ color: "#16a34a", fontSize: 14 }}>✓</span>
                      : isUsed
                        ? <span style={{ color: AMBER, fontSize: 12 }}>●</span>
                        : null}
                  </button>
                );
              })}
            </div>

            {/* ── Active tool ── */}
            {activeTool && (
              <div className="mb-4">
                <TerminalCard title={activeTool.cmd} lines={activeTool.output} />

                {/* GREP — single info card, acknowledge and move on */}
                {activeTool.id === "grep" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-2" style={{ color: NAVY }}>
                      תוצאה אחת בלבד — טסט אחד שמזכיר "discount" בכל הפרויקט.
                    </div>
                    <div className="text-[12px] leading-[1.6] mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
                      כלומר: כל לוגיקת ההנחה בקוד, נבדקת על ידי מקרה בדיקה יחיד.
                    </div>
                    {!grepAck ? (
                      <button type="button" onClick={() => setGrepAck(true)}
                        className="w-full py-3 rounded-xl text-[13px] font-bold transition-all"
                        style={{ background: AMBER, color: "#fff" }}>
                        הבנתי — סמני כנבדק
                      </button>
                    ) : (
                      <>
                        <div className="rounded-xl px-3 py-2.5 mb-3 text-[12px] leading-[1.55]"
                          style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                          ✓ נרשם — תוצאה אחת. בואי נבדוק מה בדיוק היא מכסה.
                        </div>
                        {!allToolsAnswered && (
                          <button type="button" onClick={() => setActiveToolId(null)}
                            className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-1 transition-all"
                            style={{ background: "rgba(217,119,6,0.08)", color: AMBER, border: "1.5px solid rgba(217,119,6,0.15)" }}>
                            ← בחרי כלי נוסף
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* COVERAGE — MCQ */}
                {activeTool.id === "coverage" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{activeTool.question}</div>
                    {activeTool.options.map((opt, i) => {
                      const isCorrect  = i === activeTool.correct;
                      const isPicked   = toolAnswers.coverage === i;
                      const showResult = toolAnswers.coverage !== null;

                      return (
                        <button key={i} type="button"
                          onClick={() => handleToolAnswer("coverage", i)}
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
                    {toolAnswers.coverage !== null && !allToolsAnswered && (
                      <button type="button" onClick={() => setActiveToolId(null)}
                        className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-2 transition-all"
                        style={{ background: "rgba(217,119,6,0.08)", color: AMBER, border: "1.5px solid rgba(217,119,6,0.15)" }}>
                        ← בחרי כלי נוסף
                      </button>
                    )}
                  </div>
                )}

                {/* CI — MCQ + metacognitive */}
                {activeTool.id === "ci" && (
                  <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{activeTool.question}</div>
                    {activeTool.options.map((opt, i) => {
                      const isCorrect  = i === activeTool.correct;
                      const isPicked   = toolAnswers.ci === i;
                      const showResult = toolAnswers.ci !== null;

                      return (
                        <button key={i} type="button"
                          onClick={() => handleToolAnswer("ci", i)}
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

                    {/* Metacognitive question — appears after ci is answered */}
                    {toolAnswers.ci !== null && (
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
                        {metaPicked !== null && !allToolsAnswered && (
                          <button type="button" onClick={() => setActiveToolId(null)}
                            className="w-full py-2.5 rounded-xl text-[12.5px] font-bold mt-2 transition-all"
                            style={{ background: "rgba(217,119,6,0.08)", color: AMBER, border: "1.5px solid rgba(217,119,6,0.15)" }}>
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
                <GlossaryChip term="test.skip" explanation="פקודה שמסמנת טסט כ'מדולג' — הוא נשאר בקוד אבל לא רץ בפועל ב-CI." />
                <GlossaryChip term="statement coverage" explanation="כמה אחוז מהשורות בקוד רצו בכלל — מדד רדוד יותר מ-branch coverage." />
                <GlossaryChip term="tech debt" explanation="חוב טכני — 'פתרון זמני' שנשאר קבוע כי אף אחת לא חוזרת לתקן אותו." />
              </div>
            )}

            {/* Counter */}
            {!allToolsAnswered && (() => {
              const rem = [!grepAck, toolAnswers.coverage === null, toolAnswers.ci === null].filter(Boolean).length;
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
                style={{ background: AMBER, color: "#fff", ...HEEBO }}>
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
                { tool: "grep",     text: "רק טסט אחד בכל הפרויקט מזכיר discount" },
                { tool: "coverage", text: "מסלול 'קוד לא קיים' לא נבדק — 50% branch coverage בלבד" },
                { tool: "ci",       text: "הטסט הרלוונטי (edge-cases) מושבת כבר 67 יום" },
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
              style={{ background: "rgba(217,119,6,0.05)", border: "1.5px solid rgba(217,119,6,0.15)" }}>
              <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
                <span className="font-bold" style={{ color: AMBER }}>למה Timeline?</span>{" "}
                כדי לראות שהפער לא נוצר ברגע אחד — הוא הצטבר: קודם השבתה "זמנית", ואז פיצ'ר חדש נבנה בלי לשים לב שהחור עדיין פתוח.
              </div>
            </div>

            {/* How-to card */}
            <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
              <div className="flex gap-1.5 shrink-0">
                {["1", "2", "3"].map((n) => (
                  <div key={n} className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black"
                    style={{ background: AMBER, color: "#fff" }}>{n}</div>
                ))}
              </div>
              <div className="text-[11.5px] leading-[1.5]" style={{ color: NAVY }}>
                לחצי על כרטיס = מקצה לו מספר סידורי. לחיצה נוספת — מבטלת.
              </div>
            </div>

            {/* Tapable events (1–4) */}
            <div className="flex flex-col gap-2 mb-3">
              {TIMELINE_EVENTS.filter((ev) => ev.id !== "reported").map((ev) => {
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
                      background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(217,119,6,0.06)" : "#fff",
                      border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isSelected ? "1.5px solid rgba(217,119,6,0.2)" : "1px solid rgba(0,0,0,0.08)",
                    }}>
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-black"
                      style={{
                        background: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? AMBER : "rgba(0,0,0,0.06)",
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

            {/* Pre-placed anchor — QA investigation begins */}
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
                <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>QA פותחת חקירה אחרי דיווח לקוח</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>
                  {timelineSubmitted ? "יום 67" : "ממוקם מראש — ברור שהוא אחרון"}
                </div>
              </div>
            </div>

            {!timelineSubmitted ? (
              <button type="button" onClick={() => setTimelineSubmitted(true)}
                disabled={timelineOrder.length < TIMELINE_EVENTS.length - 1}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all active:scale-[0.98]"
                style={{
                  background: timelineOrder.length === TIMELINE_EVENTS.length - 1 ? AMBER : "rgba(0,0,0,0.06)",
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
                  ✓ Timeline ברור — ההשבתה קדמה לפיצ'ר בחודשיים, ואף אחת לא חיברה בין השניים.
                </div>
                <button type="button" onClick={() => go("evidence")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                  style={{ background: AMBER, color: "#fff", ...HEEBO }}>
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
              לחצי להצגת ראיה אחת בכל פעם — הן יצרו שרשרת שמסבירה את הפער:
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {EVIDENCE_ITEMS.slice(0, evidenceIdx + 1).map((ev, i) => (
                <div key={i} className="rounded-2xl px-4 py-4"
                  style={{ background: "#fff", border: "1px solid rgba(217,119,6,0.15)" }}>
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
                  {/* Optional code */}
                  {"code" in ev && ev.code && (
                    <pre className="rounded-lg px-3 py-2.5 mb-3 text-[11px] font-mono overflow-x-auto m-0 leading-[1.7]"
                      style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
                      {ev.code}
                    </pre>
                  )}
                  {/* Conclusion */}
                  <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                    style={{ background: "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.15)" }}>
                    <span className="text-[12px] font-black shrink-0" style={{ color: AMBER }}>⟹</span>
                    <div className="text-[12px] leading-[1.55] font-medium" style={{ color: "#7c4a03" }}>
                      {ev.conclusion}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {evidenceIdx < EVIDENCE_ITEMS.length - 1 && !evidenceRevealed ? (
              <button type="button" onClick={() => setEvidenceIdx((i) => i + 1)}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black mb-3 transition-all active:scale-[0.98]"
                style={{ background: "rgba(217,119,6,0.08)", color: AMBER, border: "1.5px solid rgba(217,119,6,0.2)" }}>
                הצגי ראיה {evidenceIdx + 2} מ-{EVIDENCE_ITEMS.length} ←
              </button>
            ) : !evidenceRevealed ? (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)", color: "#7c4a03" }}>
                  חמש ראיות — מספיק לזהות את הגורם השורשי. מה הוא בעצם?
                </div>
                <button type="button" onClick={() => { setEvidenceRevealed(true); go("cause"); }}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                  style={{ background: AMBER, color: "#fff", ...HEEBO }}>
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
              על סמך הראיות — מה באמת גרם לבאג לעבור בלי שאף בדיקה תתפוס אותו?
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
                style={{ background: AMBER, color: "#fff", ...HEEBO }}>
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
                style={{ background: AMBER, color: "#fff", ...HEEBO }}>
                {pmIdx + 1 < PM_QUESTIONS.length ? `שאלה ${pmIdx + 2} ←` : "סיום ←"}
              </button>
            )}

            {pmDoneAll && (
              <button type="button" onClick={() => { markDone(); go("done"); }}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
                style={{ background: AMBER, color: "#fff", ...HEEBO }}>
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
