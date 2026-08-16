"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const AMBER = "#d97706";
const NAVY = "#023e8a";

// ─── Phase order ──────────────────────────────────────────────────────────────

type Phase = "career" | "intro" | "priority" | "review" | "toggles" | "terminal" | "postmortem" | "done";
const INTERACTIVE: Phase[] = ["priority", "review", "toggles", "terminal", "postmortem"];

function phaseNum(p: Phase) { return INTERACTIVE.indexOf(p) + 1; }

// ─── Shared UI ────────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block mb-1 mr-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
        style={{ background: open ? "rgba(217,119,6,0.14)" : "rgba(217,119,6,0.08)", border: `1px solid rgba(217,119,6,${open ? 0.3 : 0.18})`, color: AMBER, fontFamily: "monospace" }}
      >
        {term}
        <span style={{ fontSize: 9, fontFamily: "'Heebo', sans-serif", opacity: 0.65 }}>{open ? "▲" : "?"}</span>
      </button>
      {open && (
        <div className="rounded-xl px-3 py-2.5 mt-1.5 text-[12px] leading-[1.65]"
          style={{ background: "rgba(217,119,6,0.04)", border: "1px solid rgba(217,119,6,0.15)", color: "rgba(0,0,0,0.7)" }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

function RevealCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(217,119,6,0.18)" }}>
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(217,119,6,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, ...HEEBO }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(217,119,6,0.03)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TerminalCard({ lines }: { lines: { text: string; color?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>terminal</span>
      </div>
      <div className="p-4 font-mono text-[12px] leading-[1.9]" style={{ background: "#0f172a" }} dir="ltr">
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.color ?? "#e2e8f0" }}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TICKETS_FOR_PRIORITY = [
  { id: "checkout", emoji: "🔴", title: "סכום עגלה שגוי בתשלום",        sub: "בפרודקשן — לקוחות מחויבים לא נכון",  correct: 1 },
  { id: "flaky",    emoji: "🟠", title: "טסט אוטומטי נכשל לסירוגין",     sub: "לא ברור אם זה באג אמיתי או flaky",   correct: 2 },
  { id: "copy",     emoji: "🟡", title: "שגיאת כתיב בהודעת הצלחה",       sub: "קוסמטי בלבד",                        correct: 3 },
  { id: "docs",     emoji: "🔵", title: "מסמך test plan ישן לא מעודכן",  sub: "אין השפעה מיידית",                   correct: 4 },
];

const TEST_CASES = [
  { id: 0, text: "בדיקה: התחברות עם מייל וסיסמה תקינים → הצלחה",                    bad: false, reason: "" },
  { id: 1, text: "בדיקה: 'לבדוק שהתחברות עובדת'",                                    bad: true,  reason: "אין קלט מדויק ואין תוצאה צפויה ברורה — אי אפשר לדעת מה בדיוק נבדק" },
  { id: 2, text: "בדיקה: התחברות עם סיסמה שגויה → הודעת שגיאה 'פרטים שגויים'",       bad: false, reason: "" },
  { id: 3, text: "בדיקה: 'לוודא שהכל תקין במסך ההתחברות'",                          bad: true,  reason: "'הכל תקין' לא מגדיר מה בודקים — כל בודקת תפרש אחרת" },
  { id: 4, text: "בדיקה: נעילת חשבון אחרי 5 ניסיונות כושלים → הודעה + נעילה ל-15 דק'", bad: false, reason: "" },
  { id: 5, text: "בדיקה: התחברות משדה ריק → כפתור לא מגיב",                          bad: false, reason: "" },
];

const TOGGLE_ACTIONS = [
  { id: "report_critical", label: "דווחי מיד על באג התשלום הקריטי",              correct: true,  wrongMsg: "נכון! חיוב שגוי ללקוחות = כסף אמיתי, זו הבעיה הכי דחופה כרגע" },
  { id: "rewrite_cases",   label: "שכתבי את מקרי הבדיקה המעורפלים בבירור",        correct: true,  wrongMsg: "נכון! מקרה בדיקה מעורפל לא באמת בודק כלום — הוא רק נראה כאילו כן" },
  { id: "ignore_flaky",    label: "התעלמי מהטסט שנכשל לסירוגין — בטח flaky",       correct: false, wrongMsg: "לא — טסט לא-יציב יכול להסתיר באג אמיתי. בודקים לפני שמתעלמים" },
  { id: "add_regression",  label: "הוסיפי מקרה בדיקה לרגרסיה על חישוב הסכום",      correct: true,  wrongMsg: "נכון! מונע שהבאג הזה בדיוק יחזור בגרסה הבאה בלי שאף אחת תשים לב" },
  { id: "skip_review",     label: "דלגי על בדיקת מקרי הבדיקה — אין זמן היום",      correct: false, wrongMsg: "לא — מקרי בדיקה מעורפלים נשארים מעורפלים לנצח אם אף אחת לא עוצרת לתקן" },
  { id: "alert_team",      label: "עדכני את הצוות על ממצאי הבדיקה בסלאק",          correct: true,  wrongMsg: "נכון! שקיפות עם הצוות היא חלק מהתפקיד, לא רק כתיבת מקרי בדיקה" },
];

const TERM_QUESTIONS = [
  { label: "להתעלם כי אולי זה flaky",                                  correct: false, ok: "", err: "✗ לא — 'אולי זה flaky' זו הנחה, לא בדיקה. חייבים לוודא." },
  { label: "לבדוק אם זו רגרסיה אמיתית, ורק אז לסמן כ-flaky",           correct: true,  ok: "✓ נכון — כל טסט שנכשל נבדק לפני שמתייגים אותו כ'לא אמין'. אחרת מפספסים באגים אמיתיים.", err: "" },
  { label: "למחוק את הטסט כי הוא מפריע לריצה הירוקה",                   correct: false, ok: "", err: "✗ לא — מחיקת טסט כדי ש-CI ייראה ירוק זה מסתיר בעיה, לא פותר אותה." },
];

const PM_QUESTIONS = [
  {
    q: "מה גרם לבאג בחישוב הסכום להגיע לפרודקשן?",
    options: ["בדיקת QA ידנית לא תפסה מקרה קצה", "לא היה מקרה בדיקה ברור לחישוב סכום עם כמה פריטים", "השרת היה עמוס מדי"],
    correct: 1,
    okMsg: "נכון — מקרה בדיקה מעורפל ('לוודא שהכל תקין') לא מכסה בפועל את חישוב הסכום. מקרה ברור היה תופס את זה.",
  },
  {
    q: "מה הגורם השורשי?",
    options: ["בודקת לא מוכשרת מספיק", "test suite עם מקרי בדיקה מעורפלים שלא באמת בודקים לוגיקה", "הדפדפן של הלקוח לא נתמך"],
    correct: 1,
    okMsg: "נכון — מקרי בדיקה שנכתבים בעמימות נותנים תחושת ביטחון כוזבת: 'יש טסט' לא שווה ל'הטסט בודק את הדבר הנכון'.",
  },
  {
    q: "מה מונע שזה יקרה שוב?",
    options: ["לאסור על אף אחת לגעת בעגלת הקניות", "תבנית ברורה למקרי בדיקה (קלט + פעולה + תוצאה צפויה) + review על ה-test suite עצמו", "לבדוק ידנית כל פריסה בלי טסטים"],
    correct: 1,
    okMsg: "נכון — לא רק לכתוב טסטים, אלא גם לוודא שהם כתובים כך שבאמת אפשר לסמוך עליהם.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function QADay() {
  const [phase, setPhase] = useState<Phase>("career");
  const [score, setScore] = useState(0);

  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);
  const [prioritySubmitted, setPrioritySubmitted] = useState(false);
  const [priorityError, setPriorityError] = useState(false);

  const [selectedCases, setSelectedCases] = useState<Set<number>>(new Set());
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [togglesSubmitted, setTogglesSubmitted] = useState(false);

  const [termLines, setTermLines] = useState<string[]>([]);
  const [termDone, setTermDone] = useState(false);
  const termRef = useRef(false);
  const [termAns, setTermAns] = useState<number | null>(null);

  const [pmIdx, setPmIdx] = useState(0);
  const [pmPicked, setPmPicked] = useState<number | null>(null);
  const [pmDoneAll, setPmDoneAll] = useState(false);

  const TERM_LINES = [
    "> npm run test:e2e",
    "[✓] login.spec.ts — 8 passed",
    "[✗] checkout.spec.ts — 1 failed: total_calculation_test",
    "",
    "> npm run test:regression",
    "[✓] regression suite — 42 passed, 1 failed",
    "",
    "> git log -1 -- checkout.spec.ts",
    "[i] last modified 3 sprints ago — test itself is old, unchanged",
  ];

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  useEffect(() => {
    if (phase !== "terminal" || termRef.current) return;
    termRef.current = true;
    TERM_LINES.forEach((line, i) => {
      setTimeout(() => {
        setTermLines((prev) => [...prev, line]);
        if (i === TERM_LINES.length - 1) setTimeout(() => setTermDone(true), 400);
      }, i * 250);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function markDone() {
    try {
      const cur = JSON.parse(localStorage.getItem("qa-journey") || "{}");
      localStorage.setItem("qa-journey", JSON.stringify({ ...cur, day: true }));
    } catch {/* ignore */}
  }

  function tapPriority(id: string) {
    if (prioritySubmitted) return;
    if (priorityOrder.includes(id)) setPriorityOrder(priorityOrder.filter((x) => x !== id));
    else if (priorityOrder.length < TICKETS_FOR_PRIORITY.length) setPriorityOrder([...priorityOrder, id]);
  }

  function submitPriority() {
    const expected = [...TICKETS_FOR_PRIORITY].sort((a, b) => a.correct - b.correct).map((a) => a.id);
    const correct = priorityOrder.every((id, i) => id === expected[i]);
    if (correct) setScore(s => s + 1);
    setPrioritySubmitted(true);
    setPriorityError(!correct);
  }

  function toggleCase(id: number) {
    if (reviewSubmitted) return;
    const s = new Set(selectedCases);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedCases(s);
  }

  function flipToggle(id: string) {
    if (togglesSubmitted) return;
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function nextPm() {
    if (pmIdx + 1 >= PM_QUESTIONS.length) { setPmDoneAll(true); }
    else { setPmIdx(pmIdx + 1); setPmPicked(null); }
  }

  // ─── Header ─────────────────────────────────────────────────────────────────

  const pNum = phaseNum(phase);
  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: AMBER }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/qa" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {phase !== "career" && phase !== "done" && (
            <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              {score} נקודות
            </span>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי QA Engineer</div>
        {pNum > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.65 }}>
              <span>שלב {pNum} מתוך {INTERACTIVE.length}</span>
              <span>{score}/{INTERACTIVE.length} נקודות</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pNum / INTERACTIVE.length) * 100}%`, background: "#fff" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Done ───────────────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="min-h-screen flex flex-col pb-28" style={{ background: "#f8fafc" }}>
        {Header}
        <div className="max-w-[720px] mx-auto w-full px-[22px] pt-6">
          <div className="rounded-2xl p-5 mb-5 text-center"
            style={{ background: "rgba(217,119,6,0.06)", border: "1.5px solid rgba(217,119,6,0.2)" }}>
            <div className="text-[32px] mb-2">🐞</div>
            <div className="text-[20px] font-black mb-2" style={{ color: AMBER, ...HEEBO }}>תפסת את הבאג לפני שהוא התפשט</div>
            <div className="text-[13px] mb-1" style={{ color: "rgba(0,0,0,0.55)" }}>
              מ-triage ועד regression suite — תוך פחות מ-30 דקות סימולציה.
            </div>
            <div className="text-[22px] font-black mt-2" style={{ color: AMBER }}>{score}/{INTERACTIVE.length}</div>
          </div>

          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>מה עשית</div>
            {[
              "✓ תיעדוף tickets — באג התשלום ראשון",
              "✓ Test case review — איתור מקרי בדיקה מעורפלים",
              "✓ תגובה נכונה — דיווח + שכתוב + מקרה רגרסיה",
              "✓ הרצת test suite — בדיקת flaky vs רגרסיה אמיתית",
              "✓ Post-mortem — שורש, גורם, מניעה",
            ].map((line, i) => (
              <div key={i} className="text-[12px] mb-2" style={{ color: "#15803d" }}>{line}</div>
            ))}
            <div className="mt-3 pt-3 text-[12.5px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
              מקרה בדיקה מעורפל מרגיש כמו כיסוי — אבל הוא לא. QA טובה בודקת גם את הבדיקות עצמן.
            </div>
          </div>

          {/* Real-world links */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>כלים אמיתיים ש-QA Engineers משתמשות בהם</div>
            {[
              { label: "Jira", sub: "ניהול דיווחי באגים וטריאז' — הכלי שכל צוות QA עובד בו", url: "https://www.atlassian.com/software/jira" },
              { label: "Playwright", sub: "כתיבת בדיקות אוטומטיות לדפדפן — חינמי ופתוח", url: "https://playwright.dev" },
              { label: "Postman", sub: "בדיקת API ידנית ואוטומטית", url: "https://www.postman.com" },
              { label: "BrowserStack", sub: "בדיקת אתרים על עשרות דפדפנים ומכשירים אמיתיים", url: "https://www.browserstack.com" },
            ].map((tool) => (
              <a key={tool.label} href={tool.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: "rgba(0,0,0,0.05)", textDecoration: "none" }}>
                <div>
                  <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{tool.label}</div>
                  <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>{tool.sub}</div>
                </div>
                <span style={{ color: AMBER, fontSize: 13 }}>↗</span>
              </a>
            ))}
          </div>

          <Link href="/explore/qa/learn/mystery"
            className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
            style={{ background: AMBER, color: "#fff", ...HEEBO }}>
            לתעלומה — איך זה עבר את ה-QA? ←
          </Link>
          <Link href="/explore/qa/experience"
            className="block w-full py-3.5 rounded-2xl text-center text-[13.5px] font-bold mb-6"
            style={{ background: "rgba(217,119,6,0.08)", color: AMBER }}>
            מיציתי את הטעימה ←
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Career ─────────────────────────────────────────────────────────────────

  if (phase === "career") {
    return (
      <div className="min-h-screen flex flex-col pb-28" style={{ background: "#f8fafc" }}>
        {Header}
        <div className="max-w-[720px] mx-auto w-full px-[22px] pt-6">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה QA Engineer?</div>
          <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנצלול לתקרית אמיתית — בואי נבין את התפקיד</div>

          <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.12)" }}>
            <img src="/domains/domain-qa.jpeg" alt="" className="w-full object-cover" style={{ height: "200px" }} />
          </div>

          {/* Typical day timeline */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "09:00", icon: "🗣️", task: "standup — אילו פיצ'רים מוכנים לבדיקה היום?" },
              { time: "09:30", icon: "📝", task: "כתיבת מקרי בדיקה לפיצ'ר חדש לפי הדרישות" },
              { time: "11:42", icon: "🔴", task: "מוצאת באג קריטי — חישוב סכום שגוי בעגלת הקניות" },
              { time: "13:00", icon: "🔍", task: "review על test suite קיים — מזהה מקרי בדיקה מעורפלים" },
              { time: "15:00", icon: "🧪", task: "מריצה automated regression suite, בודקת כשלים" },
              { time: "17:00", icon: "📋", task: "מעדכנת דיווחי באגים, סוגרת כאלה שאומתו כתקינים" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: AMBER }}>{item.time}</span>
                <span className="text-[16px] shrink-0">{item.icon}</span>
                <span className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.7)" }}>{item.task}</span>
              </div>
            ))}
          </div>

          {/* RevealCards */}
          <div className="mb-4">
            <RevealCard emoji="⚡" title="למה אנשים אוהבים את התפקיד הזה">
              <ul className="list-none space-y-2">
                {[
                  "נקודת כניסה מהירה להייטק — לא חובה רקע בקוד",
                  "חשיבה בלשית — מוצאות דברים שאחרים פספסו",
                  "אחריות ממשית — את שומרת שהמוצר באמת עובד ללקוחות",
                  "נתיב טבעי להתקדם ל-Automation / SDET עם הזמן",
                  "שכר מתחיל של 11,000–16,000 ₪ כבר בשנה הראשונה",
                ].map((p, i) => <li key={i} className="flex gap-2"><span style={{ color: AMBER }}>✓</span>{p}</li>)}
              </ul>
            </RevealCard>

            <RevealCard emoji="🛠️" title="כלים ש-QA Engineer משתמשת בהם">
              <div className="space-y-2">
                {[
                  { tool: "Jira / Azure DevOps", desc: "ניהול דיווחי באגים, מעקב סטטוס וטריאז'" },
                  { tool: "Playwright / Selenium", desc: "כתיבת בדיקות אוטומטיות לדפדפן" },
                  { tool: "Postman", desc: "בדיקת API — שליחת בקשות ובדיקת תשובות" },
                  { tool: "TestRail", desc: "ניהול test cases ומעקב אחרי כיסוי בדיקות" },
                  { tool: "BrowserStack", desc: "בדיקה על דפדפנים ומכשירים אמיתיים מרחוק" },
                ].map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <code className="text-[11px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded" style={{ background: "#0f172a", color: "#fbbf24" }}>{r.tool}</code>
                    <span>{r.desc}</span>
                  </div>
                ))}
              </div>
            </RevealCard>

            <RevealCard emoji="🔥" title="אתגרים בתפקיד">
              <ul className="list-none space-y-2">
                {[
                  "לוח זמנים צפוף — צריך לבדוק הכל לפני כל שחרור",
                  "לפעמים מרגישות כמו 'שוטרות רעות' מול הצוות שממהר לשחרר",
                  "טסטים לא-יציבים (flaky) גוזלים זמן חקירה",
                  "צריך לחשוב על מקרי קצה שאף אחד אחר לא חשב עליהם",
                ].map((p, i) => <li key={i} className="flex gap-2"><span style={{ color: "#d97706" }}>⚠️</span>{p}</li>)}
              </ul>
            </RevealCard>

            <RevealCard emoji="📈" title="נתיב קריירה מ-QA Engineer">
              <div className="space-y-1.5">
                {[
                  { level: "Junior QA / Manual Tester", time: "כניסה", desc: "כתיבת מקרי בדיקה, בדיקה ידנית, דיווח באגים" },
                  { level: "QA Engineer", time: "1-2 שנים", desc: "תכנון בדיקות, ניהול test suite שלם" },
                  { level: "QA Automation Engineer / SDET", time: "2-4 שנים", desc: "כתיבת קוד — בדיקות אוטומטיות ו-CI" },
                  { level: "QA Lead / Test Architect", time: "4+ שנים", desc: "אסטרטגיית איכות לצוות או מוצר שלם" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="shrink-0 w-2 h-2 rounded-full" style={{ background: AMBER, opacity: 0.6 }} />
                    <div className="flex-1">
                      <span className="font-bold text-[12px]" style={{ color: NAVY }}>{r.level}</span>
                      <span className="text-[11px] mx-2" style={{ color: "rgba(0,0,0,0.35)" }}>·</span>
                      <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.5)" }}>{r.desc}</span>
                    </div>
                    <span className="text-[10.5px]" style={{ color: AMBER }}>{r.time}</span>
                  </div>
                ))}
              </div>
            </RevealCard>
          </div>

          <button type="button" onClick={() => go("intro")}
            className="w-full py-4 rounded-2xl text-[14.5px] font-black mb-6 transition-all active:scale-[0.98]"
            style={{ background: AMBER, color: "#fff", ...HEEBO }}>
            קדימה לתקרית האמיתית ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Shared wrapper ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: "#f8fafc" }}>
      {Header}
      <div className="max-w-[720px] mx-auto w-full px-[22px] pt-6">

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <>
            <div className="rounded-2xl px-4 py-3.5 mb-5 flex gap-3 items-start"
              style={{ background: "rgba(217,119,6,0.06)", border: "1.5px solid rgba(217,119,6,0.15)" }}>
              <span className="text-[22px] shrink-0">💬</span>
              <div>
                <div className="text-[12.5px] font-black mb-1" style={{ color: AMBER }}>Slack #bug-reports</div>
                <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
                  &quot;לקוח פתח קריאה — חויבתי סכום שגוי בעגלה. מישהי בודקת?&quot;
                </div>
              </div>
            </div>

            <div className="text-[22px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>יום שלישי, 11:42</div>
            <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.5)" }}>
              ארבעה tickets נפתחו בו-זמנית. את ה-QA Engineer שרואה את זה ראשונה.
            </div>

            <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-bold" style={{ color: "#fbbf24" }}>🐞 Bug Tracker Dashboard</span>
                <span className="text-[10px]" style={{ color: "#ef4444" }}>● LIVE</span>
              </div>
              <div className="p-4" style={{ background: "#111827" }}>
                {[
                  { emoji: "🔴", prio: "P1", title: "Cart total miscalculated", host: "checkout-service" },
                  { emoji: "🟠", prio: "P2", title: "checkout.spec.ts flaky", host: "CI pipeline" },
                  { emoji: "🟡", prio: "P3", title: "Typo in success message", host: "checkout-ui" },
                  { emoji: "🔵", prio: "P4", title: "Test plan doc outdated", host: "docs" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b font-mono text-[11px]"
                    style={{ borderColor: "rgba(255,255,255,0.05)", color: "#d1d5db" }}>
                    <span className="text-[14px]">{a.emoji}</span>
                    <span style={{ color: "#94a3b8" }}>{a.prio}</span>
                    <span className="flex-1">{a.title}</span>
                    <span style={{ color: "#fbbf24" }}>{a.host}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => go("priority")}
              className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
              style={{ background: AMBER, color: "#fff", ...HEEBO }}>
              קחי את הcase ←
            </button>
          </>
        )}

        {/* ── PRIORITY ── */}
        {phase === "priority" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב א׳ — תיעדוף: מה קודם?</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>כשכמה tickets נפתחים בבת אחת — מחליטים מה דחוף.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>הכלל:</strong> באג בפרודקשן שנוגע בכסף הלקוח = P1 תמיד. תיעוד ישן = יכול לחכות.
            </div>

            <div className="mb-4">
              <GlossaryChip term="flaky test" explanation="טסט אוטומטי שלפעמים עובר ולפעמים נכשל בלי שהקוד השתנה — לא בהכרח מעיד על באג אמיתי, אבל דורש בדיקה." />
              <GlossaryChip term="P1 / P2 / P3 / P4" explanation="סולם עדיפויות: P1 = קריטי עכשיו, פוגע בכסף/לקוחות. P4 = יכול לחכות." />
              <GlossaryChip term="test plan" explanation="מסמך שמתאר מה בכוונתן לבדוק ובאיזו שיטה — לא קוד, אלא תכנון." />
            </div>

            <div className="text-[12px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>לחצי לפי סדר הטיפול (1 = ראשון):</div>

            <div className="flex flex-col gap-2 mb-4">
              {TICKETS_FOR_PRIORITY.map((a) => {
                const rank = priorityOrder.indexOf(a.id) + 1;
                const isSelected = rank > 0;
                const isCorrect = prioritySubmitted && a.correct === rank;
                const isWrong = prioritySubmitted && isSelected && !isCorrect;
                return (
                  <button key={a.id} type="button" onClick={() => tapPriority(a.id)} disabled={prioritySubmitted}
                    className="w-full rounded-2xl p-3.5 flex items-center gap-3 transition-all"
                    style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(217,119,6,0.06)" : "#fff", border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isSelected ? "1.5px solid rgba(217,119,6,0.2)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[14px] font-black"
                      style={{ background: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? AMBER : "rgba(0,0,0,0.06)", color: isSelected ? "#fff" : "rgba(0,0,0,0.3)" }}>
                      {isSelected ? rank : "—"}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[12.5px] font-bold" style={{ color: NAVY }}>{a.title}</span>
                        <span className="text-[16px]">{a.emoji}</span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>{a.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!prioritySubmitted ? (
              <button type="button" onClick={submitPriority} disabled={priorityOrder.length < TICKETS_FOR_PRIORITY.length}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: priorityOrder.length === TICKETS_FOR_PRIORITY.length ? AMBER : "rgba(0,0,0,0.06)", color: priorityOrder.length === TICKETS_FOR_PRIORITY.length ? "#fff" : "rgba(0,0,0,0.3)", ...HEEBO }}>
                {priorityOrder.length < TICKETS_FOR_PRIORITY.length ? `בחרי עוד ${TICKETS_FOR_PRIORITY.length - priorityOrder.length}` : "אשרי סדר עדיפויות"}
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: priorityError ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)", border: `1px solid ${priorityError ? "rgba(220,38,38,0.25)" : "rgba(22,163,74,0.25)"}`, color: priorityError ? "#b91c1c" : "#15803d" }}>
                  {priorityError ? "✗ לא בדיוק. חיוב שגוי ללקוחות = כסף אמיתי = תמיד P1. מסמך תיעוד יכול לחכות." : "✓ נכון — חיוב שגוי פוגע ישירות בלקוחות ובאמון. התיעוד יכול לחכות."}
                </div>
                <button type="button" onClick={() => go("review")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: AMBER, color: "#fff", ...HEEBO }}>
                  המשיכי ל-test case review ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── REVIEW ── */}
        {phase === "review" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ב׳ — Test Case Review: מה מעורפל?</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>לפני שסומכים על test suite — בודקים שהמקרים בו באמת בודקים משהו ברור.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>מה לחפש:</strong> מקרה בדיקה בלי קלט מדויק, בלי תוצאה צפויה ברורה — "בודק הכל" בלי לבדוק כלום בפועל.
            </div>

            <div className="mb-4">
              <GlossaryChip term="test case מעורפל" explanation="מקרה בדיקה כמו 'לוודא שהכל תקין' — לא מגדיר קלט או תוצאה צפויה, כך שכל בודקת מריצה אותו אחרת." />
              <GlossaryChip term="false confidence" explanation="תחושת ביטחון כוזבת: יש 'טסט' לפיצ'ר — אבל הוא לא בודק את מה שבאמת חשוב." />
            </div>

            <div className="text-[12px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.45)" }}>login.suite.md — סמני מקרי בדיקה מעורפלים:</div>

            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              {TEST_CASES.map((tc) => {
                const isSelected = selectedCases.has(tc.id);
                const isCorrect = reviewSubmitted && tc.bad && isSelected;
                const isMissed = reviewSubmitted && tc.bad && !isSelected;
                const isFalsePos = reviewSubmitted && !tc.bad && isSelected;
                return (
                  <button key={tc.id} type="button" onClick={() => toggleCase(tc.id)} disabled={reviewSubmitted}
                    className="w-full border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="px-3 py-2.5 flex gap-3 items-start text-[12px] text-right"
                      style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isMissed ? "rgba(251,133,0,0.08)" : isFalsePos ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(217,119,6,0.05)" : "#fff" }}>
                      <span className="flex-1" style={{ color: isSelected ? AMBER : "#374151" }}>{tc.text}</span>
                      {isSelected && !reviewSubmitted && <span style={{ color: AMBER, fontSize: 12 }}>✓</span>}
                      {reviewSubmitted && tc.bad && <span style={{ color: isCorrect ? "#16a34a" : "#d97706", fontSize: 12 }}>{isCorrect ? "✓" : "!"}</span>}
                      {reviewSubmitted && isFalsePos && <span style={{ color: "#dc2626", fontSize: 12 }}>✗</span>}
                    </div>
                    {reviewSubmitted && tc.bad && (
                      <div className="px-3 py-1.5 text-[10.5px] text-right border-t"
                        style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.1)", color: "#b91c1c" }}>
                        ⚠️ {tc.reason}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!reviewSubmitted ? (
              <button type="button" onClick={() => { setReviewSubmitted(true); setScore(s => s + 1); }} disabled={selectedCases.size === 0}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: selectedCases.size > 0 ? AMBER : "rgba(0,0,0,0.06)", color: selectedCases.size > 0 ? "#fff" : "rgba(0,0,0,0.3)", ...HEEBO }}>
                שלחי — {selectedCases.size} מקרים מסומנים
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-3 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                  ✓ שני מקרים מעורפלים: "לוודא שהכל תקין" ו"לבדוק שהתחברות עובדת" — שניהם ללא קלט או תוצאה צפויה ברורה.
                </div>
                <button type="button" onClick={() => go("toggles")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: AMBER, color: "#fff", ...HEEBO }}>
                  המשיכי לתגובה ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── TOGGLES ── */}
        {phase === "toggles" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ג׳ — תגובה: מה עושים עכשיו?</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>לקוחות ממשיכים להיפגע מחיוב שגוי. לפני שמשקיעים בתיקון שקט — עוצרים את הדימום.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>עיקרון:</strong> דווחי מיד על מה שדחוף, ותקני את תשתית הבדיקות לצד זה — לא במקומו.
            </div>

            <div className="mb-4">
              <GlossaryChip term="regression suite" explanation="קבוצת טסטים שרצה על כל שינוי כדי לוודא שדברים שכבר עבדו — עדיין עובדים." />
              <GlossaryChip term="triage" explanation="מיון ראשוני של דיווחים — מה דחוף, מה אמיתי, מה אפשר לדחות." />
            </div>

            <div className="text-[12px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>בחרי אילו פעולות לבצע:</div>

            <div className="flex flex-col gap-2 mb-4">
              {TOGGLE_ACTIONS.map((action) => {
                const isOn = !!toggles[action.id];
                const isCorrect = togglesSubmitted && isOn === action.correct;
                const isWrong = togglesSubmitted && isOn !== action.correct;
                return (
                  <button key={action.id} type="button" onClick={() => flipToggle(action.id)} disabled={togglesSubmitted}
                    className="w-full rounded-2xl p-3.5 flex items-center gap-3 transition-all"
                    style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.06)" : "#fff", border: isCorrect ? "1.5px solid rgba(22,163,74,0.25)" : isWrong ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="shrink-0 w-12 h-6 rounded-full relative transition-all"
                      style={{ background: isOn ? (togglesSubmitted ? (isCorrect ? "#16a34a" : "#dc2626") : AMBER) : "rgba(0,0,0,0.15)" }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: isOn ? "26px" : "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{action.label}</div>
                      {togglesSubmitted && (
                        <div className="text-[11px] mt-0.5" style={{ color: isCorrect ? "#15803d" : "#b91c1c" }}>
                          {isCorrect ? (isOn ? "✓ נכון" : "✓ נכון לא להפעיל") : action.wrongMsg}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {!togglesSubmitted ? (
              <button type="button" onClick={() => { setTogglesSubmitted(true); setScore(s => s + 1); }}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: AMBER, color: "#fff", ...HEEBO }}>
                אשרי פעולות ←
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                  ✓ דיווח מיידי + שכתוב מקרי בדיקה + מקרה רגרסיה חדש — לא התעלמות מהטסט הלא-יציב.
                </div>
                <button type="button" onClick={() => go("terminal")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: AMBER, color: "#fff", ...HEEBO }}>
                  הריצי את ה-test suite ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── TERMINAL ── */}
        {phase === "terminal" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ד׳ — הרצה: מה ה-suite אומר?</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              עכשיו שהדיווח נשלח — מריצים את חבילת הבדיקות האוטומטית לראות מה עוד נשבר.
            </div>

            <TerminalCard lines={termLines.map((line) => ({ text: line, color: line.startsWith("[✓]") ? "#22c55e" : line.startsWith("[✗]") ? "#f87171" : line.startsWith("[i]") ? "#94a3b8" : line.startsWith(">") ? "#60a5fa" : line === "" ? undefined : "#e2e8f0" }))} />

            {termDone && (
              <>
                <div className="mb-4">
                  <GlossaryChip term="e2e test" explanation="End-to-End — בדיקה שמדמה משתמש אמיתי מתחילת התהליך ועד סופו, לא רק פונקציה בודדת." />
                  <GlossaryChip term="CI" explanation="Continuous Integration — מריץ את כל חבילת הבדיקות אוטומטית על כל שינוי בקוד." />
                  <GlossaryChip term="git blame" explanation="פקודה שמראה מתי ומי שינה לאחרונה שורה מסוימת — עוזרת להבין אם הטסט עצמו ישן או חדש." />
                </div>

                <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>הטסט checkout.spec.ts נכשל, אבל הוא עצמו לא השתנה. מה הצעד הבא?</div>
                  {TERM_QUESTIONS.map((opt, i) => (
                    <TermAnswer key={i} opt={opt} idx={i} termAns={termAns} setTermAns={(n) => { setTermAns(n); if (opt.correct) setScore(s => s + 1); }} onNext={() => go("postmortem")} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── POSTMORTEM ── */}
        {phase === "postmortem" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ה׳ — Post-Mortem: מה למדנו?</div>
            <div className="text-[13px] mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>אחרי כל תקרית — צוותי QA עושים post-mortem: מה קרה, למה, ואיך מונעים שוב.</div>

            {pmIdx === 0 && (
              <div className="mb-4">
                <GlossaryChip term="edge case" explanation="מקרה גבולי לא שגרתי (עגלה ריקה, פריט יחיד, כמות גדולה) שקל לשכוח לבדוק." />
                <GlossaryChip term="test coverage" explanation="כמה מהתרחישים האפשריים באמת מכוסים על ידי מקרי בדיקה — לא רק 'יש טסטים'." />
                <GlossaryChip term="acceptance criteria" explanation="הגדרה ברורה מראש של מה נחשב 'עובד נכון' לפיצ'ר — הבסיס לכתיבת מקרה בדיקה טוב." />
              </div>
            )}

            <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{PM_QUESTIONS[pmIdx].q}</div>

            <div className="flex flex-col gap-2 mb-4">
              {PM_QUESTIONS[pmIdx].options.map((opt, i) => {
                const isCorrect = i === PM_QUESTIONS[pmIdx].correct;
                const isPicked = pmPicked === i;
                const showResult = pmPicked !== null;
                return (
                  <button key={i} type="button" onClick={() => { if (pmPicked === null) { setPmPicked(i); if (isCorrect) setScore(s => s + 1); } }} disabled={pmPicked !== null}
                    className="w-full rounded-2xl px-4 py-3.5 text-right transition-all"
                    style={{ background: showResult && isCorrect ? "rgba(22,163,74,0.08)" : showResult && isPicked && !isCorrect ? "rgba(220,38,38,0.08)" : "#fff", border: showResult && isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !isCorrect ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt}</span>
                    {showResult && isCorrect && <div className="text-[11.5px] mt-1.5" style={{ color: "#15803d" }}>{PM_QUESTIONS[pmIdx].okMsg}</div>}
                  </button>
                );
              })}
            </div>

            {pmPicked !== null && !pmDoneAll && (
              <button type="button" onClick={nextPm}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: AMBER, color: "#fff", ...HEEBO }}>
                {pmIdx + 1 < PM_QUESTIONS.length ? `שאלה ${pmIdx + 2} מ-${PM_QUESTIONS.length} ←` : "סיום Post-Mortem ←"}
              </button>
            )}

            {pmDoneAll && (
              <button type="button" onClick={() => { markDone(); go("done"); }}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black mt-4 transition-all"
                style={{ background: AMBER, color: "#fff", ...HEEBO }}>
                סיום — ראי את הסיכום ←
              </button>
            )}
          </>
        )}

      </div>
      <BottomNav />
    </div>
  );
}

// Helper: Terminal question answer
function TermAnswer({ opt, idx, termAns, setTermAns, onNext }: {
  opt: { label: string; correct: boolean; ok: string; err: string };
  idx: number; termAns: number | null; setTermAns: (n: number) => void; onNext: () => void;
}) {
  const isPicked = termAns === idx;
  const showResult = termAns !== null;
  const isCorrect = opt.correct;
  return (
    <div>
      <button type="button" onClick={() => { if (termAns === null) setTermAns(idx); }} disabled={showResult}
        className="w-full rounded-xl px-4 py-3 text-right mb-2 transition-all"
        style={{ background: showResult && isCorrect ? "rgba(22,163,74,0.08)" : showResult && isPicked && !isCorrect ? "rgba(220,38,38,0.08)" : "#f8fafc", border: showResult && isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !isCorrect ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid rgba(0,0,0,0.07)" }}>
        <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt.label}</span>
        {showResult && isCorrect && <div className="text-[11.5px] mt-1" style={{ color: "#15803d" }}>{opt.ok}</div>}
        {showResult && isPicked && !isCorrect && <div className="text-[11.5px] mt-1" style={{ color: "#b91c1c" }}>{opt.err}</div>}
      </button>
      {showResult && isCorrect && isPicked && (
        <button type="button" onClick={onNext} className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
          style={{ background: AMBER, color: "#fff", fontFamily: "'Heebo', sans-serif", fontWeight: 900 }}>
          המשיכי ל-Post-Mortem ←
        </button>
      )}
    </div>
  );
}
