"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — שיווק דיגיטלי
const MKT = "#f97316";
const MKT_DARK = "#c2410c";
const NAVY = "#023e8a";

type Phase =
  | "career"
  | "intro"
  | "step-first"
  | "board-result"
  | "fix-audience"
  | "fix-message"
  | "results"
  | "done";

const PHASE_ORDER: Phase[] = [
  "step-first", "board-result", "fix-audience", "fix-message", "results",
];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

// ─── Board (לוח קמפיין בסגנון מסוף) ───────────────────────────────────────────

function Board({ title, lines }: { title?: string; lines: { text: string; color?: string; label?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>{title ?? "campaign board"}</span>
      </div>
      <div className="p-4 font-mono text-[12px] leading-[2]" style={{ background: "#0f172a" }} dir="ltr">
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-3">
            <span style={{ color: l.color ?? "#e2e8f0", flex: 1 }}>{l.text || " "}</span>
            {l.label && (
              <span className="text-[10px] px-2 py-0.5 rounded shrink-0" dir="rtl"
                style={{ background: "rgba(249,115,22,0.2)", color: "#fdba74", fontFamily: "'Heebo', sans-serif" }}>
                {l.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Question — תמיד nextLabel+onNext, בלי auto-advance ───────────────────────

function Question({
  q, options, correct, okMsg, errMsg, onAnswer, nextLabel, onNext,
}: {
  q: string; options: string[]; correct: number;
  okMsg: string; errMsg: string; onAnswer: (ok: boolean) => void;
  nextLabel?: string; onNext?: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(i === correct);
  }
  const answered = picked !== null;
  return (
    <div>
      <div className="text-[13.5px] font-bold mb-4" style={{ color: NAVY }}>{q}</div>
      <div className="flex flex-col gap-3 mb-4">
        {options.map((opt, i) => {
          const isCorrect = i === correct;
          const isPicked = i === picked;
          let bg = "#fff", border = "1.5px solid rgba(0,0,0,0.08)", color = "rgba(0,0,0,0.75)";
          if (answered) {
            if (isCorrect) { bg = "rgba(34,197,94,0.08)"; border = "1.5px solid #22c55e55"; color = "#15803d"; }
            else if (isPicked) { bg = "rgba(220,38,38,0.07)"; border = "1.5px solid #dc262644"; color = "#b91c1c"; }
            else { color = "rgba(0,0,0,0.35)"; }
          }
          return (
            <button key={i} type="button" disabled={answered} onClick={() => pick(i)} className="text-right w-full">
              <div className="rounded-xl px-4 py-3 text-[13px] transition-all" style={{ background: bg, border, color }}>
                {answered && isCorrect && "✓ "}{answered && isPicked && !isCorrect && "✗ "}{opt}
              </div>
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-3"
            style={{
              background: picked === correct ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
              border: `1px solid ${picked === correct ? "#22c55e55" : "#dc262644"}`,
              color: picked === correct ? "#15803d" : "#b91c1c",
            }}>
            {picked === correct ? okMsg : errMsg}
          </div>
          {nextLabel && onNext && (
            <button onClick={onNext}
              className="w-full py-[13px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
              {nextLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── RevealCard ───────────────────────────────────────────────────────────────

function RevealCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(249,115,22,0.18)" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(249,115,22,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, fontFamily: "'Heebo', sans-serif" }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(249,115,22,0.03)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block mb-1 mr-1">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
        style={{
          background: open ? "rgba(249,115,22,0.14)" : "rgba(249,115,22,0.06)",
          border: `1px solid rgba(249,115,22,${open ? 0.35 : 0.18})`,
          color: MKT_DARK, fontFamily: "'Heebo', sans-serif",
        }}>
        {term}
        <span style={{ fontSize: 9, fontFamily: "'Heebo', sans-serif", opacity: 0.65 }}>{open ? "▲" : "?"}</span>
      </button>
      {open && (
        <div className="rounded-xl px-3 py-2.5 mt-1.5 text-[12px] leading-[1.65]"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.7)" }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

function GlossaryRow({ terms }: { terms: { term: string; explanation: React.ReactNode }[] }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
        👆 לחצי על מונח לקבל הסבר
      </div>
      <div className="flex flex-wrap">
        {terms.map(t => <GlossaryChip key={t.term} term={t.term} explanation={t.explanation} />)}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// חוזרים בדיוק לשלב שבו נעצרנו, כולל הניקוד — אחרת מסך הסיכום מציג ניקוד שגוי
function loadSavedState(): { phase?: Phase; score?: number } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("marketing-day-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function MarketingDayPage() {
  const [phase, setPhase] = useState<Phase>(() => loadSavedState().phase ?? "career");
  const [score, setScore] = useState(() => loadSavedState().score ?? 0);

  useEffect(() => {
    try { localStorage.setItem("marketing-day-state", JSON.stringify({ phase, score })); } catch {/* ignore */}
  }, [phase, score]);

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }
  function answer(ok: boolean) { if (ok) setScore(s => s + 1); }

  function goBack() {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx > 0) go(PHASE_ORDER[idx - 1]);
    else if (phase === "step-first") go("intro");
    else if (phase === "intro") go("career");
  }
  const canGoBack = phase !== "career" && phase !== "done";

  const pNum = phaseNum(phase);
  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: MKT }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/marketing" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {canGoBack && (
            <button onClick={goBack} className="text-[12px] font-bold" style={{ opacity: 0.82, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
              שלב קודם ↩
            </button>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי מנהלת שיווק דיגיטלי</div>
        {pNum > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.65 }}>
              <span>שלב {pNum} מתוך {PHASE_ORDER.length}</span>
              <span>{score} נקודות</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pNum / PHASE_ORDER.length) * 100}%`, background: "#fff" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Career ─────────────────────────────────────────────────────────────────
  if (phase === "career") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה מנהלת שיווק דיגיטלי?</div>
          <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנציל קמפיין אמיתי של עסק שכונתי — בואי נבין את התפקיד</div>

          {/* Timeline — נשאר גלוי */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "08:30", icon: "📊", task: "פתיחת לוחות הקמפיינים — מה רץ בלילה, מה עלה, מה נפל" },
              { time: "10:00", icon: "✍️", task: "כתיבת שתי גרסאות מודעה — ניתן לשתיהן לרוץ ונראה מי מנצחת" },
              { time: "12:00", icon: "📞", task: "שיחה עם לקוח: מה קרה החודש, כמה פניות, מה משנים" },
              { time: "14:00", icon: "🔍", task: "צלילה לדאטה — איזה קהל מגיב, באיזו שעה, מאיזו מודעה" },
              { time: "16:00", icon: "🎛️", task: "התאמות: מזיזים תקציב למודעה שעובדת, עוצרים את זו שלא" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: "rgba(0,0,0,0.35)", minWidth: 34 }}>{item.time}</span>
                <span className="text-[16px] shrink-0">{item.icon}</span>
                <span className="text-[12.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.7)" }}>{item.task}</span>
              </div>
            ))}
          </div>

          {/* Entry path — גלוי, בכנות, בלי מספרים מומצאים */}
          <div className="rounded-xl p-4 mb-5 flex gap-4 items-center" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.18)" }}>
            <div className="text-[28px]">🚪</div>
            <div dir="rtl">
              <div className="text-[13px] font-black" style={{ color: NAVY }}>הכניסה: בלי תואר חובה — אבל תחרותית</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>
                נכנסים דרך קורס או לימוד עצמי + קמפיין ראשון אמיתי (גם לעסק של קרוב משפחה).
                הרבה אנשים מנסים להיכנס — מה שמבדיל הוא תוצאות שאפשר להראות.
              </div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>מי שמראה "הקמפיין שלי הביא לקוחות" — מדברת בשפה שכל מעסיק מבין</div>
            </div>
          </div>

          {/* Wow card — ריגוש וסיפוק — גלוי, לפני האתגרים */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(251,133,0,0.08) 100%)", border: "1.5px solid rgba(249,115,22,0.2)" }}>
            <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>⚡ למה אנשים אוהבים את התפקיד הזה</div>
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: "📈", text: "רואים תוצאה במספרים תוך ימים — כתבת מודעה הבוקר, ובערב את כבר יודעת אם היא עובדת. מעט מקצועות נותנים פידבק כל כך מהיר." },
                { emoji: "🧠", text: "יצירתיות שנמדדת — הרעיון הכי יפה שלך מתמודד מול המספרים. כשהניסוח שלך מנצח, יש הוכחה שחורה על גבי לוח." },
                { emoji: "🏪", text: "כל עסק בעולם צריך את זה — ממספרה שכונתית ועד סטארטאפ. מי שיודעת להביא לקוחות תמיד תמצא למי לעזור." },
                { emoji: "🤝", text: "עובדים עם אנשים ועם דאטה ביחד — חצי מהיום שיחות עם בעלי עסקים, חצי מהיום מספרים. לא נתקעים מול מסך לבד." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[16px] shrink-0 mt-0.5">{item.emoji}</span>
                  <span className="text-[12px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.7)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RevealCards — שאר הפרטים */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>רוצי לדעת עוד? לחצי להרחבה</div>

          <RevealCard emoji="🏢" title="איפה עובדים ואיזה תפקידים קיימים?">
            <div className="flex flex-col gap-3">
              {[
                {
                  role: "מנהל/ת קמפיינים (PPC)", co: "סוכנויות דיגיטל, עסקים בינוניים",
                  desc: "מנהלת מודעות ממומנות בגוגל ובפייסבוק לכמה לקוחות במקביל — בדיוק מה שתעשי היום. תפקיד הכניסה הנפוץ ביותר.",
                  badge: "כניסה: קורס + קמפיין ראשון להצגה",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=%D7%9E%D7%A0%D7%94%D7%9C+%D7%A7%D7%9E%D7%A4%D7%99%D7%99%D7%A0%D7%99%D7%9D",
                },
                {
                  role: "מנהל/ת סושיאל", co: "מותגים, סוכנויות, עסקים מקומיים",
                  desc: "תוכן, קהילה ומודעות ברשתות החברתיות. מתאים למי שאוהבת גם לכתוב וגם למדוד.",
                  badge: "כניסה: תיק עבודות — גם עמוד שניהלת בהתנדבות נחשב",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=%D7%9E%D7%A0%D7%94%D7%9C+%D7%A1%D7%95%D7%A9%D7%99%D7%90%D7%9C",
                },
                {
                  role: "שיווק בתוך עסק (In-house)", co: "חברות טק, רשתות, קליניקות",
                  desc: "אחראית על כל השיווק הדיגיטלי של עסק אחד — קרובה להנהלה ולהחלטות, רואה את התמונה המלאה.",
                  badge: "בדרך כלל אחרי ניסיון ראשון בסוכנות או כעצמאית",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=%D7%A9%D7%99%D7%95%D7%95%D7%A7+%D7%93%D7%99%D7%92%D7%99%D7%98%D7%9C%D7%99",
                },
                {
                  role: "Growth / Performance", co: "סטארטאפים",
                  desc: "הצד המדעי של השיווק — ניסויים, משפכים, אופטימיזציה. הדלת של עולם השיווק אל תוך ההייטק עצמו.",
                  badge: "אחרי ניסיון בקמפיינים + חיבה אמיתית לדאטה",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Performance+Marketing",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.12)" }}>
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-black" style={{ color: MKT_DARK }}>{item.role}</span>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>{item.co}</span>
                  </div>
                  <div className="text-[11.5px] leading-[1.65] mb-2" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>{item.desc}</div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" dir="rtl" style={{ background: "rgba(249,115,22,0.1)", color: MKT_DARK }}>
                      📍 {item.badge}
                    </span>
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-bold"
                      style={{ color: "rgba(0,0,0,0.35)", textDecoration: "underline" }}>
                      ראי משרות דומות ←
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </RevealCard>

          <RevealCard emoji="🔥" title="האתגרים האמיתיים של התפקיד">
            <div>
              {[
                { emoji: "🚪", text: "הכניסה תחרותית — הרבה אנשים מתחילים, כי אין מחסום של תואר. מה שמפריד: תוצאות אמיתיות שאפשר להראות, גם מקמפיין קטן." },
                { emoji: "🪟", text: "התוצאות שקופות לגמרי — כשקמפיין לא עובד, המספרים על הלוח וכולם רואים. אין איפה להתחבא. (וכשהוא עובד — גם את זה כולם רואים.)" },
                { emoji: "🔄", text: "הפלטפורמות משתנות כל הזמן — מה שעבד בפייסבוק לפני שנה כבר לא עובד היום. לומדים כל הקריירה." },
                { emoji: "💸", text: "תקציב של לקוח הוא אחריות אמיתית — כל שקל שהעסק שם במודעות עובר דרך ההחלטות שלך." },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-2 ${i > 0 ? "mt-2.5 pt-2.5" : ""}`} style={i > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}}>
                  <span className="shrink-0">{item.emoji}</span>
                  <span className="text-[12px] leading-[1.6]" dir="rtl">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealCard>

          <RevealCard emoji="🌫️" title="החלקים הפחות מסעירים (שאף אחד לא מספר עליהם)">
            <div className="text-[12px] leading-[1.75]" dir="rtl">
              📋 דוחות חודשיים ללקוחות — טבלאות, גרפים, הסברים<br />
              ✍️ כתיבת הגרסה העשירית לאותה מודעה כשתשע הראשונות לא עבדו<br />
              🧾 חשבוניות, אישורי תקציב ותיאומים בין לקוח לפלטפורמה<br />
              ⏳ ימים שבהם הדאטה עוד לא הצטברה — ואין מה לעשות חוץ מלחכות<br />
              🕳️ כשקמפיין עובד חלק — הלקוח שוכח למה הוא משלם לך
            </div>
          </RevealCard>

          <button onClick={() => go("intro")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white mt-2"
            style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
            הבנתי — קדימה ללקוח האמיתי ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-5" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            יום ראשון. 09:00 בבוקר. את מנהלת שיווק דיגיטלי שמלווה עסקים קטנים בעיר.
          </div>

          {/* Context banner — חובה לפני כל scenario */}
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
            style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <span style={{ fontSize: 14 }}>💼</span>
            <span className="text-[11.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>מנהלת שיווק דיגיטלי</strong> = מי שמפעילה את המודעות של עסקים באינטרנט,
              קוראת את המספרים, ומחליטה מה לשנות כדי שיגיעו יותר לקוחות.
            </span>
          </div>

          {/* הדימוי שמלווה את כל הדף — מוצג לפני שפוגשים מושג ראשון */}
          <div className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2"
            style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <span style={{ fontSize: 14 }}>🍉</span>
            <span className="text-[11.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>הדימוי שילווה אותנו כל הדרך:</strong>{" "}
              קמפיין הוא כמו <strong>דוכן בשוק</strong> — שלוש החלטות קובעות הכל:
              <strong> איפה</strong> שמים את הדוכן, <strong>מה</strong> צועקים, <strong>ולמי</strong>.
            </span>
          </div>

          {/* ההודעה מהלקוחה */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>הודעה חדשה בוואטסאפ</div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#e7f6e7", border: "1px solid rgba(34,197,94,0.25)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[20px]">🏋️‍♀️</span>
              <span className="text-[12px] font-black" style={{ color: NAVY }}>מיכל — סטודיו כושר שכונתי</span>
            </div>
            <div className="text-[13px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.72)" }}>
              "אני משלמת <strong>2,000 ₪ בחודש</strong> על מודעות בפייסבוק —
              והחודש קיבלתי <strong>3 פניות</strong>. שלוש. אני על סף לוותר על כל הסיפור הזה.
              תוכלי להסתכל מה קורה שם?"
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-5 text-[13.5px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
            בוא נעשה חשבון בגובה עיניים: 2,000 ₪ חלקי 3 פניות ={" "}
            <strong>כ-667 ₪ לכל פנייה</strong> — ופנייה היא עוד לא לקוחה משלמת.{" "}
            <span className="font-bold" style={{ color: NAVY }}>משהו בדוכן הזה שבור. התפקיד שלך — למצוא מה.</span>
          </div>

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
            <div className="text-[12px] font-bold mb-2" style={{ color: MKT_DARK }}>🛠️ הכלים שישמשו אותנו</div>
            <div className="flex flex-col gap-1.5">
              {[
                { tool: "לוח הקמפיין", desc: "המספרים: כמה ראו, כמה לחצו, כמה פנו" },
                { tool: "קהל היעד", desc: "למי המודעה מוצגת — איפה עומד הדוכן" },
                { tool: "המסר", desc: "מה כתוב במודעה — מה צועקים בדוכן" },
              ].map(({ tool, desc }) => (
                <div key={tool} className="flex items-center gap-2">
                  <code className="text-[11px] font-black px-2 py-0.5 rounded"
                    style={{ background: "rgba(251,133,0,0.12)", color: MKT_DARK, fontFamily: "'Heebo', sans-serif" }}>{tool}</code>
                  <span className="text-[11.5px]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => go("step-first")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
            קחי את הקמפיין של מיכל ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Step First — מה הצעד הראשון ─────────────────────────────────────────────
  if (phase === "step-first") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            09:10. הקמפיין של מיכל פתוח מולך. לפני שנוגעים במשהו — עיקרון אחד:
          </div>

          {/* כרטיס עיקרון לפני השאלה */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>הכלל: קודם קוראים את הלוח, אחר כך משנים</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              בעל דוכן חכם לא מזיז את הדוכן לפני שהוא עומד לידו שעה ורואה מי עובר, מי עוצר ומי קונה.
              אותו דבר בקמפיין: המספרים כבר יודעים מה הבעיה — <strong>צריך רק לקרוא אותם</strong>.
              שינוי בלי קריאה הוא ניחוש, וניחושים עולים כסף של הלקוחה.
            </div>
          </div>

          <GlossaryRow terms={[
            {
              term: "המרה",
              explanation: (
                <span dir="rtl">
                  הרגע שבו מי שראה את המודעה עשה את מה שרצינו — התקשר, השאיר פרטים, קבע שיעור ניסיון.<br />
                  בשוק: לא מי שהסתכל על הדוכן — <strong>מי שקנה</strong>. כל הקמפיין קיים בשביל הרגע הזה.
                </span>
              )
            },
            {
              term: "קהל יעד",
              explanation: (
                <span dir="rtl">
                  למי המודעה מוצגת — לפי אזור, גיל ותחומי עניין.<br />
                  זה המקום שבו עומד הדוכן: דוכן לימונדה מול בית ספר ימכור;
                  אותו דוכן בדיוק בכביש מהיר — לא. הקהל קובע יותר מהמודעה עצמה.
                </span>
              )
            },
            {
              term: "תקציב יומי",
              explanation: (
                <span dir="rtl">
                  כמה כסף מותר לפלטפורמה להוציא ביום על הצגת המודעה. 2,000 ₪ בחודש ≈ 66 ₪ ליום.<br />
                  כמו שכר הדוכן בשוק: משלמים על המקום גם אם אף אחד לא קנה — ולכן חשוב כל כך שהדוכן יעמוד ברחוב הנכון.
                </span>
              )
            },
          ]} />

          <Question
            q="מיכל משלמת 2,000 ₪ ומקבלת 3 פניות. מה הצעד הראשון שלך?"
            options={[
              "לכתוב מיד מודעה חדשה ויפה יותר — הישנה כנראה משעממת",
              "לפתוח את לוח הקמפיין ולקרוא את המספרים שורה-שורה",
              "להגיד למיכל להגדיל את התקציב — 2,000 ₪ זה כנראה לא מספיק",
            ]}
            correct={1}
            okMsg="✓ נכון — קודם קוראים. הלוח יגיד לנו איפה הבעיה: בקהל, במסר או במשהו אחר. מודעה חדשה בלי אבחון = ניחוש יקר."
            errMsg="✗ מודעה חדשה או תקציב גדול יותר בלי אבחון = לשפוך עוד כסף על אותה בעיה. קודם קוראים את הלוח — הוא כבר יודע את התשובה."
            onAnswer={ok => answer(ok)}
            nextLabel="פתחי את לוח הקמפיין ←"
            onNext={() => go("board-result")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Board Result — קריאת הלוח ────────────────────────────────────────────────
  if (phase === "board-result") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            פתחת את לוח הקמפיין של החודש האחרון. קראי כל שורה — התוויות בעברית מסבירות:
          </div>

          <Board title="לוח קמפיין — סטודיו הכושר של מיכל" lines={[
            { text: "== CAMPAIGN: studio-michal ==", color: "#64748b" },
            { text: "period:       30 days", color: "#94a3b8", label: "חודש אחד" },
            { text: "spend:        2,000 ILS", color: "#94a3b8", label: "כמה שולם" },
            { text: "impressions:  48,200", color: "#e2e8f0", label: "כמה אנשים ראו" },
            { text: "clicks:       610", color: "#e2e8f0", label: "כמה לחצו" },
            { text: "leads:        3", color: "#f87171", label: "כמה פנו בפועל" },
            { text: "cost/lead:    667 ILS", color: "#f87171", label: "מחיר לפנייה!" },
            { text: "" },
            { text: "audience:     ALL ISRAEL", color: "#f87171", label: "⚠️ כל הארץ!" },
            { text: "headline:     \"התחילו את הטרנספורמציה שלכם\"", color: "#eab308", label: "הכותרת" },
          ]} />

          <GlossaryRow terms={[
            { term: "חשיפות", explanation: <span dir="rtl">כמה פעמים המודעה הוצגה על מסך של מישהו. כמו מספר האנשים שעברו ליד הדוכן — עוד לא אומר שמישהו עצר.</span> },
            { term: "קליקים", explanation: <span dir="rtl">כמה אנשים לחצו על המודעה. אלה שעצרו ליד הדוכן להסתכל — עדיין לא קנו, אבל התעניינו.</span> },
            { term: "עלות לפנייה", explanation: <span dir="rtl">כמה כסף עלתה כל פנייה: סך ההוצאה חלקי מספר הפניות. 2,000 ÷ 3 = כ-667 ₪. המספר האחד שבעלת העסק באמת מרגישה בכיס.</span> },
          ]} />

          {/* קריאת הלוח בגובה עיניים */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#dc2626" }}>🔍 מה הלוח מספר לנו?</div>
            <div className="text-[12px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              48,200 ראו ← 610 לחצו ← <strong>רק 3 פנו</strong>. המשפך דולף בסוף.<br />
              ולמה? שתי שורות למטה מסגירות הכל:<br />
              <strong>הדוכן עומד בעיר הלא נכונה</strong> — המודעה של סטודיו שכונתי רצה על כל הארץ.
              מישהי מאילת רואה מודעה של סטודיו בחיפה — היא לא תבוא, גם אם המודעה מושלמת.<br />
              <strong>והצעקה לא ברורה</strong> — "טרנספורמציה" היא מילה גדולה שלא אומרת לאף אחד מה מקבלים.
            </div>
          </div>

          <RevealCard emoji="🍉" title="רגע, למה 48,200 חשיפות זה דווקא סימן רע כאן?">
            <div className="text-[12px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              נשמע מרשים — כמעט 50 אלף איש ראו! אבל חשיפות עולות כסף,
              וחשיפה למי שגר שעתיים נסיעה מהסטודיו היא כסף שנשרף.<br /><br />
              בשוק: לשלם על דוכן ברחוב הכי סואן <strong>בעיר אחרת</strong> —
              המון אנשים עוברים, אף אחד לא יכול לקנות ממך.<br />
              בשיווק מקומי המטרה היא לא "שכולם יראו" — אלא <strong>שהאנשים הנכונים יראו</strong>.
            </div>
          </RevealCard>

          <Question
            q="קראת את הלוח. מה הבעיה הכי גדולה בקמפיין?"
            options={[
              "המודעה לא מספיק יפה — צריך עיצוב מקצועי",
              "הקהל: המודעה רצה על כל הארץ, ורוב מי שרואה אותה לא יכול בכלל להגיע לסטודיו",
              "התקציב: 2,000 ₪ בחודש פשוט לא מספיק לפייסבוק",
            ]}
            correct={1}
            okMsg="✓ בדיוק! 610 אנשים אפילו לחצו — המודעה מושכת מספיק. אבל רובם רחוקים מדי מכדי לבוא. קודם מתקנים את מיקום הדוכן — את הקהל."
            errMsg="✗ 610 לחיצות אומרות שהמודעה מושכת, והתקציב הביא המון חשיפות. הבעיה בשורת ה-audience: כל הארץ רואה סטודיו שכונתי. קודם מתקנים את הקהל."
            onAnswer={ok => answer(ok)}
            nextLabel="לתיקון הקהל ←"
            onNext={() => go("fix-audience")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Fix Audience ─────────────────────────────────────────────────────────────
  if (phase === "fix-audience") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>תיקון ראשון — מזיזים את הדוכן</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>09:30. נכנסת להגדרות הקהל. השאלה: לאיפה מצמצמים?</div>

          {/* כרטיס עיקרון */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>הכלל: הקהל הנכון הוא מי שיכול להגיע ברגל או בנסיעה קצרה</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              לסטודיו שכונתי מגיעים פעמיים-שלוש בשבוע. אף אחד לא נוסע חצי שעה לאימון של 45 דקות
              כשיש סטודיו ליד הבית. לכן שואלים: <strong>מאיפה באמת מגיעות הלקוחות הקיימות של מיכל?</strong>
              — היא אומרת: כולן מהשכונה והסביבה הקרובה.
            </div>
          </div>

          <Question
            q="לאיזה קהל מכוונים עכשיו את המודעה?"
            options={[
              "כל העיר — לא לוותר על אף לקוחה פוטנציאלית",
              "רדיוס של 3 ק\"מ סביב הסטודיו — מי שיכולה באמת להגיע",
              "כל הארץ, אבל רק נשים בגיל המתאים — הבעיה היא המגדר, לא המרחק",
            ]}
            correct={1}
            okMsg="✓ נכון — הדוכן חוזר לשכונה. כל שקל מוצג עכשיו רק למי שיכולה באמת להגיע. פחות חשיפות, אבל כל אחת שווה משהו."
            errMsg={"✗ גם כל העיר רחב מדי לאימון של 45 דקות, ומגדר בלי מרחק לא פותר כלום — מתאמנת מאילת עדיין לא תגיע לחיפה. רדיוס 3 ק\"מ = מי שבאמת יכולה לבוא."}
            onAnswer={ok => answer(ok)}
            nextLabel="הקהל עודכן — עכשיו המסר ←"
            onNext={() => go("fix-message")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Fix Message ──────────────────────────────────────────────────────────────
  if (phase === "fix-message") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>תיקון שני — משנים את הצעקה</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>10:00. הדוכן במקום הנכון. עכשיו — מה צועקים ממנו?</div>

          {/* הכותרת הנוכחית */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>הכותרת שרצה עד עכשיו</div>
          <div className="rounded-2xl px-4 py-4 mb-5" style={{ background: "#fff", border: "1.5px solid rgba(220,38,38,0.25)" }}>
            <div className="text-[15px] font-black mb-1" dir="rtl" style={{ color: "rgba(0,0,0,0.75)" }}>"התחילו את הטרנספורמציה שלכם"</div>
            <div className="text-[11.5px] leading-[1.6]" dir="rtl" style={{ color: "#b91c1c" }}>
              ⚠️ "טרנספורמציה" — מילה גדולה שאפשר להדביק לכל דבר: חדר כושר, קורס, דיאטה.
              היא לא אומרת מה מקבלים, כמה זה קרוב, ולמה דווקא כאן.
            </div>
          </div>

          {/* כרטיס עיקרון */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>הכלל: מדברים על החיים של הלקוחה, לא על מילים גדולות</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              בשוק, הדוכן שצועק "חוויה קולינרית עילאית!" מפסיד לדוכן שצועק "מלפפונים טריים, שלושה בעשר".
              אנשים עסוקים — הם עוצרים רק כשמשהו מתחבר <strong>למה שהם צריכים היום</strong>.
              היתרון האמיתי של הסטודיו של מיכל? <strong>הוא קרוב.</strong> חמש דקות מהבית — בלי פקקים, בלי תירוצים.
            </div>
          </div>

          <Question
            q="איזו כותרת שמים במקום?"
            options={[
              "\"הסטודיו המקצועי והמתקדם בישראל\"",
              "\"אימון 5 דקות מהבית — בואי לשיעור ניסיון\"",
              "\"הטרנספורמציה מתחילה עכשיו!!! מקומות אחרונים\"",
            ]}
            correct={1}
            okMsg="✓ בדיוק! קונקרטי: מה (אימון), כמה קרוב (5 דקות מהבית), ומה עושים עכשיו (שיעור ניסיון). מי שגרה בשכונה קוראת את זה ומרגישה — זה בשבילי."
            errMsg={"✗ \"מקצועי ומתקדם\" ו\"מקומות אחרונים\" הן צעקות שכל דוכן צועק — אף אחד כבר לא מאמין. הכותרת המנצחת אומרת בדיוק מה מקבלים ולמה זה נוח: 5 דקות מהבית."}
            onAnswer={ok => answer(ok)}
            nextLabel="שמרי והריצי — נחזור בעוד שבועיים ←"
            onNext={() => go("results")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (phase === "results") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            עברו שבועיים. הקמפיין רץ עם הקהל החדש והכותרת החדשה — באותו תקציב בדיוק.
            פתחי את הלוח:
          </div>

          <Board title="לוח קמפיין — אחרי התיקון (שבועיים)" lines={[
            { text: "== CAMPAIGN: studio-michal v2 ==", color: "#64748b" },
            { text: "period:       14 days", color: "#94a3b8", label: "שבועיים" },
            { text: "spend:        1,000 ILS", color: "#94a3b8", label: "חצי מהחודשי" },
            { text: "impressions:  6,400", color: "#eab308", label: "הרבה פחות ראו!" },
            { text: "clicks:       290", color: "#e2e8f0", label: "כמה לחצו" },
            { text: "leads:        11", color: "#22c55e", label: "פי כמה יותר פניות" },
            { text: "cost/lead:    91 ILS", color: "#22c55e", label: "במקום 667 ₪!" },
            { text: "" },
            { text: "audience:     3km radius", color: "#22c55e", label: "✓ השכונה" },
            { text: "headline:     \"אימון 5 דקות מהבית\"", color: "#22c55e", label: "✓ קונקרטי" },
          ]} />

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid #22c55e44" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#15803d" }}>🔍 קראי את זה שוב — כי זה לב המקצוע</div>
            <div className="text-[12px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              החשיפות <strong>ירדו</strong> מ-48,200 ל-6,400 — והפניות <strong>עלו</strong> מ-3 ל-11
              בחצי מהזמן ובחצי מהכסף.<br />
              פחות אנשים ראו, אבל <strong>הנכונים</strong> ראו — ושמעו משהו שמדבר על החיים שלהם.
            </div>
          </div>

          <Question
            q="החשיפות ירדו פי שבעה — והפניות קפצו. איך זה מסתדר?"
            options={[
              "פייסבוק פשוט החליט לתת לקמפיין יחס טוב יותר החודש",
              "כי עכשיו המודעה מוצגת רק למי שיכולה באמת להגיע — והמסר אומר לה בדיוק למה לבוא",
              "זה מזל של שבועיים — צריך לחזור לקהל הרחב כדי לשמר את זה",
            ]}
            correct={1}
            okMsg="✓ בדיוק. זה כל הסיפור: הדוכן ברחוב הנכון + צעקה שמתחברת לחיים = פחות רעש, יותר לקוחות. את זה מיכל מרגישה בכיס."
            errMsg="✗ אין כאן מזל ואין קסם של פלטפורמה. הדוכן עבר לרחוב הנכון והצעקה נהייתה קונקרטית — לכן כל חשיפה שווה עכשיו הרבה יותר."
            onAnswer={ok => answer(ok)}
            nextLabel="לסיכום היום ←"
            onNext={() => go("done")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    function saveAndGo(href: string) {
      try {
        const journey = JSON.parse(localStorage.getItem("marketing-journey") || "{}");
        localStorage.setItem("marketing-journey", JSON.stringify({ ...journey, day: true }));
      } catch { /* ignore */ }
      window.location.href = href;
    }
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-7">
            <div className="text-[52px] mb-2">📈</div>
            <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>הצלת את הקמפיין של מיכל</div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.4)" }}>מ-667 ₪ לפנייה — ל-91 ₪ לפנייה. בלי שקל אחד נוסף.</div>
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>מה עשית היום</div>
            <div className="flex flex-col gap-2">
              {[
                { tool: "קריאת הלוח", desc: "48,200 ראו ← 610 לחצו ← 3 פנו — המשפך דלף בסוף", icon: "📊" },
                { tool: "אבחון הקהל", desc: "המודעה רצה על כל הארץ — הדוכן עמד בעיר הלא נכונה", icon: "📍" },
                { tool: "תיקון הקהל", desc: "רדיוס 3 ק\"מ — רק מי שיכולה באמת להגיע", icon: "🎯" },
                { tool: "תיקון המסר", desc: "\"טרנספורמציה\" ← \"אימון 5 דקות מהבית\"", icon: "✍️" },
                { tool: "קריאת התוצאה", desc: "פחות חשיפות, פי כמה יותר פניות — בחצי מהעלות", icon: "📈" },
              ].map(({ tool, desc, icon }) => (
                <div key={tool} className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(34,197,94,0.07)", border: "1px solid #22c55e44" }}>
                  <span className="text-[18px]">{icon}</span>
                  <div dir="rtl">
                    <div className="text-[12.5px] font-bold" style={{ color: NAVY, fontFamily: "'Heebo', sans-serif" }}>{tool}</div>
                    <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(249,115,22,0.08)", border: "1.5px solid rgba(249,115,22,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: MKT_DARK }}>מה זה אומר לקריירה שלך</div>
            <div className="text-[13px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              לא צריך תואר בשביל מה שעשית עכשיו — צריך לדעת לקרוא מספרים, להבין אנשים, ולתקן.
              והכי חשוב: <span className="font-bold" style={{ color: NAVY }}>יש לך עכשיו סיפור עם תוצאה — וזה בדיוק מה שפותח דלתות במקצוע הזה.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/marketing/learn/mystery")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
            למיני-פרויקט: השק/י קמפיין ב-300 ₪ ←
          </button>
          <button onClick={() => saveAndGo("/explore/marketing/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${MKT}`, color: MKT_DARK, fontFamily: "'Heebo', sans-serif" }}>
            מיציתי את הטעימה — קדימה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}
