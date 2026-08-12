"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const BLUE = "#3b82f6";
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
        style={{ background: open ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.08)", border: `1px solid rgba(59,130,246,${open ? 0.3 : 0.18})`, color: BLUE, fontFamily: "monospace" }}
      >
        {term}
        <span style={{ fontSize: 9, fontFamily: "'Heebo', sans-serif", opacity: 0.65 }}>{open ? "▲" : "?"}</span>
      </button>
      {open && (
        <div className="rounded-xl px-3 py-2.5 mt-1.5 text-[12px] leading-[1.65]"
          style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)", color: "rgba(0,0,0,0.7)" }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

function RevealCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(59,130,246,0.18)" }}>
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(59,130,246,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, ...HEEBO }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(59,130,246,0.03)" }}>
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
  { id: "checkout", emoji: "🔴", title: "Checkout מחזיר שגיאת 500", sub: "בפרודקשן — לקוחות לא יכולים לשלם", correct: 1 },
  { id: "query",    emoji: "🟠", title: "שאילתת דשבורד איטית",       sub: "3 שניות טעינה — לא קורס",         correct: 2 },
  { id: "style",    emoji: "🟡", title: "כפתור בצבע לא עקבי",        sub: "עמוד ההרשמה — קוסמטי בלבד",       correct: 3 },
  { id: "dep",      emoji: "🔵", title: "התראת גרסה מיושנת בספרייה", sub: "אין סיכון מיידי",                 correct: 4 },
];

const CODE_LINES = [
  { id: 0, code: "function calculateTotal(items) {",              suspicious: false, reason: "" },
  { id: 1, code: "  let total = 0;",                               suspicious: false, reason: "" },
  { id: 2, code: "  for (let i = 0; i <= items.length; i++) {",    suspicious: true,  reason: "<= במקום < — הלולאה רצה איטרציה אחת יותר מדי, i מגיע לאינדקס שלא קיים" },
  { id: 3, code: "    total += items[i].price;",                   suspicious: true,  reason: "items[i] הוא undefined באיטרציה האחרונה → קריאה ל-.price זורקת TypeError" },
  { id: 4, code: "  }",                                            suspicious: false, reason: "" },
  { id: 5, code: "  return total.toFixed(2);",                     suspicious: false, reason: "" },
  { id: 6, code: "}",                                              suspicious: false, reason: "" },
  { id: 7, code: "// שונה אתמול 14:02 — commit a3f21c9",            suspicious: false, reason: "" },
];

const TOGGLE_ACTIONS = [
  { id: "revert",        label: "בצעי revert מיידי לגרסה הקודמת בפרודקשן",        correct: true,  wrongMsg: "נכון! revert עוצר את הדימום מיד — את השורש מתקנים אחר כך בשקט" },
  { id: "fix_loop",      label: "תקני את תנאי הלולאה מ-<= ל-<",                    correct: true,  wrongMsg: "נכון! זה השורש בפועל של הבאג" },
  { id: "restart_blind", label: "הפעילי מחדש את השרת שוב ושוב עד שזה נעלם",       correct: false, wrongMsg: "לא — restart לא מתקן קוד שבור, הבאג יחזור מיד עם הבקשה הבאה" },
  { id: "add_test",      label: "כתבי טסט שמכסה רשימת פריטים ריקה/גבולית",         correct: true,  wrongMsg: "נכון! מונע רגרסיה עתידית של אותו באג בדיוק" },
  { id: "push_friday",   label: "פרסי את התיקון בשישי ב-17:00 בלי לבדוק",          correct: false, wrongMsg: "לא — פריסה בסוף שבוע בלי מוניטורינג זמין = סיכון מיותר" },
  { id: "alert_team",    label: "עדכני את הצוות בסלאק שהתקרית טופלה",             correct: true,  wrongMsg: "נכון! שקיפות עם הצוות היא חלק מהתפקיד, לא רק כתיבת קוד" },
];

const TERM_QUESTIONS = [
  { label: "למזג ישר ל-main בלי code review",                     correct: false, ok: "", err: "✗ לא — code review תופס בעיות שאת לא רואה, גם כשהטסטים עוברים." },
  { label: "לבקש code review מחברה לצוות, ואז למזג ולפרוס",       correct: true,  ok: "✓ נכון — code review + טסטים ירוקים = הדרך הבטוחה לשחרר תיקון.", err: "" },
  { label: "לחכות שבוע ולראות אם מישהו מתלונן שוב",                correct: false, ok: "", err: "✗ לא — לקוחות כבר נפגעים והתיקון מוכן, אין סיבה לחכות." },
];

const PM_QUESTIONS = [
  {
    q: "מה גרם לבאג להגיע לפרודקשן?",
    options: ["בדיקת QA ידנית לא תפסה מקרה קצה", "לא היו טסטים אוטומטיים למקרה גבול (רשימה עם פריט אחרון)", "השרת היה עמוס מדי באותו יום"],
    correct: 1,
    okMsg: "נכון — טסט יחידה פשוט על \"רשימה עם פריט אחד\" היה תופס את זה לפני שהקוד הגיע לפרודקשן.",
  },
  {
    q: "מה הגורם השורשי?",
    options: ["מפתח לא מוכשר כתב את זה", "לולאת for עם תנאי גבול שגוי (off-by-one) — טעות אנוש קלאסית", "הדפדפן של הלקוח לא נתמך"],
    correct: 1,
    okMsg: "נכון — off-by-one הוא אחד הבאגים הכי נפוצים בתכנות. גם מפתחים מנוסים מאוד עושים את זה.",
  },
  {
    q: "מה מונע שזה יקרה שוב?",
    options: ["לאסור על אף אחד לגעת בקובץ הזה", "Code review חובה + coverage לטסטים על מקרי קצה + CI שחוסם merge אם טסט נכשל", "לבדוק ידנית כל פריסה לפני שהיא יוצאת"],
    correct: 1,
    okMsg: "נכון — תהליך (review + CI אוטומטי) תופס מה שבן אדם לבד מפספס בלחץ של יום עבודה.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CodeDay() {
  const [phase, setPhase] = useState<Phase>("career");
  const [score, setScore] = useState(0);

  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);
  const [prioritySubmitted, setPrioritySubmitted] = useState(false);
  const [priorityError, setPriorityError] = useState(false);

  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
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
    "> git checkout -b hotfix/checkout-loop-bug",
    "[✓] Switched to new branch",
    "",
    '> git commit -m "fix: correct off-by-one in calculateTotal loop"',
    "[✓] 1 file changed, 1 insertion(+), 1 deletion(-)",
    "",
    "> git push origin hotfix/checkout-loop-bug",
    "[✓] Pull request opened — awaiting review",
    "",
    "> npm test",
    "[✓] 42 passed, 0 failed",
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
      const cur = JSON.parse(localStorage.getItem("code-journey") || "{}");
      localStorage.setItem("code-journey", JSON.stringify({ ...cur, day: true }));
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

  function toggleLine(id: number) {
    if (reviewSubmitted) return;
    const s = new Set(selectedLines);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedLines(s);
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
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: BLUE }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/code" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {phase !== "career" && phase !== "done" && (
            <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              {score} נקודות
            </span>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי מפתחת תוכנה</div>
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
            style={{ background: "rgba(59,130,246,0.06)", border: "1.5px solid rgba(59,130,246,0.2)" }}>
            <div className="text-[32px] mb-2">🛠️</div>
            <div className="text-[20px] font-black mb-2" style={{ color: BLUE, ...HEEBO }}>תיקנת את הפרודקשן</div>
            <div className="text-[13px] mb-1" style={{ color: "rgba(0,0,0,0.55)" }}>
              מ-triage ועד hotfix — תוך פחות מ-30 דקות סימולציה.
            </div>
            <div className="text-[22px] font-black mt-2" style={{ color: BLUE }}>{score}/{INTERACTIVE.length}</div>
          </div>

          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>מה עשית</div>
            {[
              "✓ תיעדוף tickets — הבאג בפרודקשן ראשון",
              "✓ Code review — איתור off-by-one bug בקוד",
              "✓ תגובה נכונה — revert + תיקון + טסט",
              "✓ Git flow — branch, commit, push, PR",
              "✓ Post-mortem — שורש, גורם, מניעה",
            ].map((line, i) => (
              <div key={i} className="text-[12px] mb-2" style={{ color: "#15803d" }}>{line}</div>
            ))}
            <div className="mt-3 pt-3 text-[12.5px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
              &quot;Incident response&quot; זה לא רק לסייבר — זה מה שכל מפתחת עושה כשהפרודקשן נופל.
            </div>
          </div>

          {/* Real-world links */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>כלים אמיתיים שמפתחות משתמשות בהם</div>
            {[
              { label: "GitHub", sub: "ניהול קוד וcode review — הכלי שכל צוות פיתוח עובד בו", url: "https://github.com" },
              { label: "Stack Overflow", sub: "כשמפתחים נתקעים — כאן פותרים שאלות", url: "https://stackoverflow.com" },
              { label: "MDN Web Docs", sub: "התיעוד הרשמי של JavaScript ו-Web APIs", url: "https://developer.mozilla.org" },
              { label: "LeetCode", sub: "תרגול אלגוריתמים — מוכן לראיונות עבודה", url: "https://leetcode.com" },
            ].map((tool) => (
              <a key={tool.label} href={tool.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: "rgba(0,0,0,0.05)", textDecoration: "none" }}>
                <div>
                  <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{tool.label}</div>
                  <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>{tool.sub}</div>
                </div>
                <span style={{ color: BLUE, fontSize: 13 }}>↗</span>
              </a>
            ))}
          </div>

          <Link href="/explore/code/learn/mystery"
            className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
            style={{ background: BLUE, color: "#fff", ...HEEBO }}>
            לתעלומת הקוד ←
          </Link>
          <Link href="/explore/code/experience"
            className="block w-full py-3.5 rounded-2xl text-center text-[13.5px] font-bold mb-6"
            style={{ background: "rgba(59,130,246,0.08)", color: BLUE }}>
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
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה מפתחת תוכנה?</div>
          <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנצלול לתקרית אמיתית — בואי נבין את התפקיד</div>

          <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.12)" }}>
            <img src="/domains/domain-code.jpeg" alt="" className="w-full object-cover" style={{ height: "200px" }} />
          </div>

          {/* Typical day timeline */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "09:00", icon: "🗣️", task: "standup — מה עשית אתמול, מה היום, יש חסמים?" },
              { time: "09:30", icon: "💻", task: "כתיבת פיצ'ר חדש לפי הטיקט שנקבע השבוע" },
              { time: "11:42", icon: "🔥", task: "incident! checkout מחזיר שגיאה בפרודקשן — תגובה מיידית" },
              { time: "13:00", icon: "👀", task: "code review — בודקת PR שחברה לצוות פתחה" },
              { time: "15:00", icon: "🐛", task: "מתקנת את הבאג מהבוקר, כותבת טסט שמונע הישנות" },
              { time: "17:00", icon: "🚀", task: "פורסת גרסה, עוקבת אחרי המוניטורינג כמה דקות" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: BLUE }}>{item.time}</span>
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
                  "יוצרת דברים שאנשים אמיתיים משתמשים בהם כל יום",
                  "אפשר לעבוד מכל מקום — עבודה מרחוק נפוצה מאוד",
                  "קהילה גלובלית ענקית שעוזרת (Stack Overflow, GitHub, פורומים)",
                  "נקודת כניסה מעולה גם בלי תואר — bootcamp של חצי שנה מספיק",
                  "שכר מתחיל של 13,000–18,000 ₪ כבר בשנה הראשונה",
                ].map((p, i) => <li key={i} className="flex gap-2"><span style={{ color: BLUE }}>✓</span>{p}</li>)}
              </ul>
            </RevealCard>

            <RevealCard emoji="🛠️" title="כלים שמפתחת תוכנה משתמשת בהם">
              <div className="space-y-2">
                {[
                  { tool: "VS Code", desc: "עורך הקוד הנפוץ ביותר — חינמי, עם תוספים לכל שפה" },
                  { tool: "Git / GitHub", desc: "ניהול גרסאות — כל שינוי בקוד נשמר ואפשר לחזור אליו" },
                  { tool: "Terminal", desc: "שורת פקודה — להרצת קוד, בדיקות ופריסות" },
                  { tool: "Chrome DevTools", desc: "בדיקת קוד שרץ בדפדפן — שגיאות, רשת, ביצועים" },
                  { tool: "GitHub Copilot / Claude", desc: "עוזר AI שכותב קוד יחד איתך — לא מחליף, מאיץ" },
                ].map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <code className="text-[11px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded" style={{ background: "#0f172a", color: "#60a5fa" }}>{r.tool}</code>
                    <span>{r.desc}</span>
                  </div>
                ))}
              </div>
            </RevealCard>

            <RevealCard emoji="🔥" title="אתגרים בתפקיד">
              <ul className="list-none space-y-2">
                {[
                  "למידה מתמדת — טכנולוגיות משתנות מהר מאוד",
                  "Debugging יכול להיות מתסכל — לפעמים שעות על שורה אחת",
                  "לחץ deadlines כשפיצ'ר צריך לצאת בזמן",
                  "code review יכול להרגיש אישי בהתחלה — זה לא ביקורת עלייך",
                ].map((p, i) => <li key={i} className="flex gap-2"><span style={{ color: "#d97706" }}>⚠️</span>{p}</li>)}
              </ul>
            </RevealCard>

            <RevealCard emoji="📈" title="נתיב קריירה ממפתחת ג'וניור">
              <div className="space-y-1.5">
                {[
                  { level: "Junior Developer", time: "כניסה", desc: "לומדת את הקוד הקיים, משימות מוגדרות היטב" },
                  { level: "Mid-level Developer", time: "1-3 שנים", desc: "פיצ'רים עצמאיים, code review לאחרים" },
                  { level: "Senior Developer", time: "3-6 שנים", desc: "ארכיטקטורה, מנטורינג, החלטות טכניות" },
                  { level: "Tech Lead / Staff", time: "6+ שנים", desc: "כיוון טכני לצוות שלם או מוצר" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="shrink-0 w-2 h-2 rounded-full" style={{ background: BLUE, opacity: 0.6 }} />
                    <div className="flex-1">
                      <span className="font-bold text-[12px]" style={{ color: NAVY }}>{r.level}</span>
                      <span className="text-[11px] mx-2" style={{ color: "rgba(0,0,0,0.35)" }}>·</span>
                      <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.5)" }}>{r.desc}</span>
                    </div>
                    <span className="text-[10.5px]" style={{ color: BLUE }}>{r.time}</span>
                  </div>
                ))}
              </div>
            </RevealCard>
          </div>

          <button type="button" onClick={() => go("intro")}
            className="w-full py-4 rounded-2xl text-[14.5px] font-black mb-6 transition-all active:scale-[0.98]"
            style={{ background: BLUE, color: "#fff", ...HEEBO }}>
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
              style={{ background: "rgba(59,130,246,0.06)", border: "1.5px solid rgba(59,130,246,0.15)" }}>
              <span className="text-[22px] shrink-0">💬</span>
              <div>
                <div className="text-[12.5px] font-black mb-1" style={{ color: BLUE }}>Slack #production-alerts</div>
                <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
                  &quot;Checkout שבור!! לקוחות מדווחים שגיאה כשמנסים לשלם 🔴&quot;
                </div>
              </div>
            </div>

            <div className="text-[22px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>יום רביעי, 11:42</div>
            <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.5)" }}>
              ארבעה tickets נפתחו בו-זמנית. את המפתחת התורנית שרואה את זה ראשונה.
            </div>

            <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-bold" style={{ color: "#60a5fa" }}>🐞 Error Tracking Dashboard</span>
                <span className="text-[10px]" style={{ color: "#ef4444" }}>● LIVE</span>
              </div>
              <div className="p-4" style={{ background: "#111827" }}>
                {[
                  { emoji: "🔴", prio: "P1", title: "Checkout returns 500", host: "checkout-service" },
                  { emoji: "🟠", prio: "P2", title: "Dashboard query slow", host: "analytics-api" },
                  { emoji: "🟡", prio: "P3", title: "Button color inconsistent", host: "signup-page" },
                  { emoji: "🔵", prio: "P4", title: "Dependency outdated warning", host: "package.json" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b font-mono text-[11px]"
                    style={{ borderColor: "rgba(255,255,255,0.05)", color: "#d1d5db" }}>
                    <span className="text-[14px]">{a.emoji}</span>
                    <span style={{ color: "#94a3b8" }}>{a.prio}</span>
                    <span className="flex-1">{a.title}</span>
                    <span style={{ color: "#60a5fa" }}>{a.host}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => go("priority")}
              className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
              style={{ background: BLUE, color: "#fff", ...HEEBO }}>
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
              <strong style={{ color: NAVY }}>הכלל:</strong> קוד שבור בפרודקשן שפוגע בלקוחות = P1 תמיד. קוסמטיקה = P3/P4.
            </div>

            <div className="mb-4">
              <GlossaryChip term="שגיאת 500" explanation="Internal Server Error — הקוד בשרת קרס. הלקוח לא רואה למה, רק שזה נכשל." />
              <GlossaryChip term="P1 / P2 / P3 / P4" explanation="סולם עדיפויות: P1 = קריטי עכשיו, פוגע בכסף/לקוחות. P4 = יכול לחכות." />
              <GlossaryChip term="dependency warning" explanation="ספרייה חיצונית שהפרויקט משתמש בה הוציאה גרסה חדשה. לא דחוף — לא שבור." />
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
                    style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(59,130,246,0.06)" : "#fff", border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isSelected ? "1.5px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[14px] font-black"
                      style={{ background: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? BLUE : "rgba(0,0,0,0.06)", color: isSelected ? "#fff" : "rgba(0,0,0,0.3)" }}>
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
                style={{ background: priorityOrder.length === TICKETS_FOR_PRIORITY.length ? BLUE : "rgba(0,0,0,0.06)", color: priorityOrder.length === TICKETS_FOR_PRIORITY.length ? "#fff" : "rgba(0,0,0,0.3)", ...HEEBO }}>
                {priorityOrder.length < TICKETS_FOR_PRIORITY.length ? `בחרי עוד ${TICKETS_FOR_PRIORITY.length - priorityOrder.length}` : "אשרי סדר עדיפויות"}
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: priorityError ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)", border: `1px solid ${priorityError ? "rgba(220,38,38,0.25)" : "rgba(22,163,74,0.25)"}`, color: priorityError ? "#b91c1c" : "#15803d" }}>
                  {priorityError ? "✗ לא בדיוק. Checkout שבור = כסף אבוד = תמיד P1. dependency warning יכול לחכות לספרינט הבא." : "✓ נכון — checkout שבור פוגע ישירות בהכנסות. הקוסמטיקה יכולה לחכות."}
                </div>
                <button type="button" onClick={() => go("review")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                  המשיכי ל-code review ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── REVIEW ── */}
        {phase === "review" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ב׳ — Code Review: מה שבור?</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>כל commit נשמר בהיסטוריה. בדקי מה השתנה בפונקציה שמחשבת את סכום העגלה.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>מה לחפש:</strong> תנאי לולאה, גישה למערך שעלולה לחרוג מהגבול שלו.
            </div>

            <div className="mb-4">
              <GlossaryChip term="off-by-one" explanation={<span>באג נפוץ שבו לולאה רצה איטרציה אחת יותר מדי (או פחות מדי). לרוב נגרם מ-<code style={{ fontFamily: "monospace" }}>{"<="}</code> במקום <code style={{ fontFamily: "monospace" }}>{"<"}</code>.</span>} />
              <GlossaryChip term="undefined" explanation="ב-JavaScript, גישה לאינדקס שלא קיים במערך מחזירה undefined — וקריאה לתכונה שלו (כמו .price) זורקת שגיאה." />
              <GlossaryChip term="TypeError" explanation="שגיאת ריצה שקורית כשמנסים לבצע פעולה על ערך מהסוג הלא נכון — למשל .price על undefined." />
            </div>

            <div className="text-[12px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.45)" }}>checkout.js — סמני שורות חשודות:</div>

            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="px-3 py-2 flex gap-3 font-mono text-[9.5px]"
                style={{ background: "#1e293b", color: "#475569" }} dir="ltr">
                <span>checkout.js</span>
              </div>
              {CODE_LINES.map((line) => {
                const isSelected = selectedLines.has(line.id);
                const isCorrect = reviewSubmitted && line.suspicious && isSelected;
                const isMissed = reviewSubmitted && line.suspicious && !isSelected;
                const isFalsePos = reviewSubmitted && !line.suspicious && isSelected;
                return (
                  <button key={line.id} type="button" onClick={() => toggleLine(line.id)} disabled={reviewSubmitted}
                    className="w-full border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="px-3 py-2.5 flex gap-3 items-start font-mono text-[11px]"
                      style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isMissed ? "rgba(251,133,0,0.08)" : isFalsePos ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(59,130,246,0.05)" : "#fff" }} dir="ltr">
                      <span className="w-[18px] shrink-0 text-left" style={{ color: "#94a3b8" }}>{line.id + 1}</span>
                      <span className="flex-1 text-left" style={{ color: isSelected ? BLUE : "#374151" }}>{line.code}</span>
                      {isSelected && !reviewSubmitted && <span style={{ color: BLUE, fontSize: 12 }}>✓</span>}
                      {reviewSubmitted && line.suspicious && <span style={{ color: isCorrect ? "#16a34a" : "#d97706", fontSize: 12 }}>{isCorrect ? "✓" : "!"}</span>}
                      {reviewSubmitted && isFalsePos && <span style={{ color: "#dc2626", fontSize: 12 }}>✗</span>}
                    </div>
                    {reviewSubmitted && line.suspicious && (
                      <div className="px-3 py-1.5 text-[10.5px] text-right border-t"
                        style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.1)", color: "#b91c1c" }} dir="rtl">
                        ⚠️ {line.reason}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!reviewSubmitted ? (
              <button type="button" onClick={() => { setReviewSubmitted(true); setScore(s => s + 1); }} disabled={selectedLines.size === 0}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: selectedLines.size > 0 ? BLUE : "rgba(0,0,0,0.06)", color: selectedLines.size > 0 ? "#fff" : "rgba(0,0,0,0.3)", ...HEEBO }}>
                שלחי — {selectedLines.size} שורות מסומנות
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-3 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                  ✓ שתי שורות חשודות: תנאי הלולאה (off-by-one) והגישה למערך שקורסת בגללו.
                </div>
                <button type="button" onClick={() => go("toggles")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: BLUE, color: "#fff", ...HEEBO }}>
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
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>לקוחות ממשיכים להיפגע כל דקה. לפני שמתחילים לתקן בשקט — עוצרים את הדימום.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>עיקרון:</strong> עצרי את הנזק קודם (revert), תקני את השורש אחר כך בזהירות.
            </div>

            <div className="mb-4">
              <GlossaryChip term="revert" explanation="ביטול הפריסה האחרונה — חזרה מיידית לגרסה שעבדה, בלי לחכות לתיקון." />
              <GlossaryChip term="hotfix" explanation="תיקון דחוף וממוקד שיוצא מחוץ למחזור הפיתוח הרגיל — ישר לפרודקשן אחרי בדיקה." />
              <GlossaryChip term="regression" explanation="באג שחוזר אחרי שכבר תוקן פעם — טסטים אוטומטיים מונעים את זה." />
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
                      style={{ background: isOn ? (togglesSubmitted ? (isCorrect ? "#16a34a" : "#dc2626") : BLUE) : "rgba(0,0,0,0.15)" }}>
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
                style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                אשרי פעולות ←
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                  ✓ revert עוצר את הדימום. תיקון השורש + טסט + שקיפות מול הצוות — לא restart עיוור.
                </div>
                <button type="button" onClick={() => go("terminal")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                  הריצי את הפקודות ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── TERMINAL ── */}
        {phase === "terminal" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ד׳ — ביצוע: התיקון בדרך</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              עכשיו שהדימום נעצר — כותבים את התיקון האמיתי ומעלים אותו ל-GitHub.
            </div>

            <TerminalCard lines={termLines.map((line) => ({ text: line, color: line.startsWith("[✓]") ? "#22c55e" : line.startsWith(">") ? "#60a5fa" : line === "" ? undefined : "#e2e8f0" }))} />

            {termDone && (
              <>
                <div className="mb-4">
                  <GlossaryChip term="branch" explanation="עותק נפרד של הקוד לעבודה על שינוי מסוים, בלי לגעת ב-main עד שהתיקון מוכן ונבדק." />
                  <GlossaryChip term="commit" explanation="שמירה של קבוצת שינויים בהיסטוריית Git, עם הודעה שמסבירה מה השתנה ולמה." />
                  <GlossaryChip term="pull request (PR)" explanation="בקשה למזג את ה-branch שלך ל-main — כאן קורה code review לפני שהקוד נכנס." />
                </div>

                <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>הטסטים ירוקים. מה הצעד הבא?</div>
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
            <div className="text-[13px] mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>אחרי כל תקרית — צוותי פיתוח עושים post-mortem: מה קרה, למה, ואיך מונעים שוב.</div>

            {pmIdx === 0 && (
              <div className="mb-4">
                <GlossaryChip term="unit test" explanation="קטע קוד קטן שבודק אוטומטית שפונקציה בודדת מתנהגת נכון — כולל מקרי קצה." />
                <GlossaryChip term="edge case" explanation="מקרה גבולי לא שגרתי (רשימה ריקה, פריט אחרון, ערך שלילי) שקל לשכוח לבדוק." />
                <GlossaryChip term="CI" explanation="Continuous Integration — מריץ טסטים אוטומטית על כל שינוי, וחוסם merge אם משהו נכשל." />
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
                style={{ background: BLUE, color: "#fff", ...HEEBO }}>
                {pmIdx + 1 < PM_QUESTIONS.length ? `שאלה ${pmIdx + 2} מ-${PM_QUESTIONS.length} ←` : "סיום Post-Mortem ←"}
              </button>
            )}

            {pmDoneAll && (
              <button type="button" onClick={() => { markDone(); go("done"); }}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black mt-4 transition-all"
                style={{ background: BLUE, color: "#fff", ...HEEBO }}>
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
          style={{ background: BLUE, color: "#fff", fontFamily: "'Heebo', sans-serif", fontWeight: 900 }}>
          המשיכי ל-Post-Mortem ←
        </button>
      )}
    </div>
  );
}
