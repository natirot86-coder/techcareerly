"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — AI ובינה מלאכותית
const AI = "#7c3aed";
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Phase =
  | "career"
  | "intro"
  | "step-first"
  | "first-reply"
  | "guardrails"
  | "test"
  | "improve"
  | "done";

const PHASE_ORDER: Phase[] = [
  "step-first", "first-reply", "guardrails", "test", "improve",
];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

// ─── Chat (חלון וואטסאפ בסגנון terminal — התשובות של ה-AI מוצגות כאן) ─────────

type ChatLine = { from: "customer" | "ai" | "note"; text: string; label?: string; labelColor?: string };

function Chat({ title, lines }: { title: string; lines: ChatLine[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>{title}</span>
      </div>
      <div className="p-4 flex flex-col gap-2.5" style={{ background: "#0f172a" }} dir="rtl">
        {lines.map((l, i) => {
          if (l.from === "note") {
            return (
              <div key={i} className="text-center text-[11px] leading-[1.6] px-2 py-1" style={{ color: "#94a3b8", fontStyle: "italic" }}>
                {l.text}
              </div>
            );
          }
          const isAi = l.from === "ai";
          return (
            <div key={i} className={`flex flex-col ${isAi ? "items-end" : "items-start"}`}>
              <div className="text-[9.5px] mb-0.5 px-1" style={{ color: "#64748b" }}>
                {isAi ? "🤖 העוזר" : "👤 לקוח/ה"}
              </div>
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-[1.6]"
                style={{
                  background: isAi ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.09)",
                  color: isAi ? "#ddd6fe" : "#e2e8f0",
                  ...(isAi ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 }),
                }}>
                {l.text}
              </div>
              {l.label && (
                <span className="text-[10px] px-2 py-0.5 rounded mt-1"
                  style={{ background: "rgba(255,255,255,0.06)", color: l.labelColor ?? "#94a3b8", fontFamily: "'Heebo', sans-serif" }}>
                  {l.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PromptDoc (התדריך — המסמך שכותבים ל-AI) ─────────────────────────────────

function PromptDoc({ version, lines }: {
  version: string;
  lines: { text: string; head?: boolean; fence?: boolean; added?: boolean }[];
}) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(124,58,237,0.06)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <span style={{ fontSize: 14 }}>📄</span>
        <span className="text-[12px] font-bold" style={{ color: NAVY }}>התדריך (הפרומפט) — {version}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-1.5" style={{ background: "#fff" }} dir="rtl">
        {lines.map((l, i) => (
          <div key={i}
            className={`text-[12px] leading-[1.65] ${l.head ? "font-black mt-1" : ""}`}
            style={{
              color: l.head ? NAVY : l.fence ? "#6d28d9" : "rgba(0,0,0,0.65)",
              background: l.added ? "rgba(34,197,94,0.08)" : "transparent",
              borderRight: l.added ? "3px solid #22c55e" : l.fence ? "3px solid rgba(124,58,237,0.35)" : "3px solid transparent",
              paddingRight: 8, borderRadius: 6,
            }}>
            {l.added ? "＋ " : ""}{l.text}
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
              style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
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
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(124,58,237,0.18)" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(124,58,237,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, fontFamily: "'Heebo', sans-serif" }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(124,58,237,0.03)" }}>
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
          background: open ? "rgba(124,58,237,0.14)" : "rgba(124,58,237,0.06)",
          border: `1px solid rgba(124,58,237,${open ? 0.3 : 0.15})`,
          color: AI, fontFamily: "'Heebo', sans-serif",
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
    const saved = localStorage.getItem("ai-day-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function AiDayPage() {
  const [phase, setPhase] = useState<Phase>(() => loadSavedState().phase ?? "career");
  const [score, setScore] = useState(() => loadSavedState().score ?? 0);

  useEffect(() => {
    try { localStorage.setItem("ai-day-state", JSON.stringify({ phase, score })); } catch {/* ignore */}
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
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: AI }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/ai" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {canGoBack && (
            <button onClick={goBack} className="text-[12px] font-bold" style={{ opacity: 0.82, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
              שלב קודם ↩
            </button>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי מיישם/ת AI בעסק</div>
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
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה מיישם/ת AI?</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנצא לעבודה אצל עסק אמיתי — בואי נבין את התפקיד</div>

          {/* Timeline — נשאר גלוי */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "08:30", icon: "📊", task: "קריאת השיחות של אתמול — איפה העוזרים שבנינו ענו טוב, ואיפה הסתבכו" },
              { time: "10:00", icon: "🤝", task: "פגישה עם בעל עסק חדש — מה הוא צריך, מה הלקוחות שלו שואלים" },
              { time: "11:30", icon: "✍️", task: "כתיבת תדריך (פרומפט) לעוזר החדש — עובדות, טון, וגדרות" },
              { time: "14:00", icon: "🧪", task: "בדיקות: מריצים על העוזר שאלות אמיתיות של לקוחות ובודקים כל תשובה" },
              { time: "16:00", icon: "🔧", task: "שיפור ותיעוד — מה תוקן בתדריך, למה, ואיזו גרסה עלתה לאוויר" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: "rgba(0,0,0,0.35)", minWidth: 34 }}>{item.time}</span>
                <span className="text-[16px] shrink-0">{item.icon}</span>
                <span className="text-[12.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.7)" }}>{item.task}</span>
              </div>
            ))}
          </div>

          {/* Entry path — גלוי, בכנות, בלי מספרי שכר */}
          <div className="rounded-xl p-4 mb-5 flex gap-4 items-center" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="text-[28px]">🚪</div>
            <div dir="rtl">
              <div className="text-[13px] font-black" style={{ color: NAVY }}>הכניסה: תיק עבודות — עוזרים שבנית ואפשר להראות</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>המקצוע צעיר ואין עדיין תעודה אחת מוכרת. עברית מדויקת ומחשבה סדורה שוות כאן יותר מקוד</div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>על מסלולי לימוד ושכר — בשלב מסלולי הלימוד ועם הרכזת</div>
            </div>
          </div>

          {/* Wow card — ריגוש וסיפוק — גלוי, לפני האתגרים */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(251,133,0,0.08) 100%)", border: "1.5px solid rgba(124,58,237,0.2)" }}>
            <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>⚡ למה אנשים אוהבים את התפקיד הזה</div>
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: "🇮🇱", text: "כל עסק בישראל צריך את זה עכשיו — המאפייה בשכונה, מרפאת השיניים, המוסך. הביקוש לא ״יגיע בעתיד״ — הוא נולד מול העיניים שלנו." },
                { emoji: "🗣️", text: "הכלי המרכזי הוא שפה, לא קוד — מי שיודע להסביר בעברית פשוטה ומדויקת מה מותר ומה אסור, מחזיק את הכישור הכי חשוב בתחום." },
                { emoji: "⚡", text: "רואים תוצאה באותו יום — כותבים תדריך בבוקר, ואחר הצהריים העוזר כבר עונה ללקוחות אמיתיים. מעט מקצועות נותנים סיפוק כל כך מהיר." },
                { emoji: "🧩", text: "כל עסק הוא חידה אחרת — מה מותר להבטיח? מתי מעבירים לבן-אדם? אף יום לא דומה לקודם." },
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
                  role: "מיישם/ת AI לעסקים", co: "סוכנויות דיגיטל, פרילנס, עסקים קטנים",
                  desc: "בונים עוזרי AI ואוטומציות לעסקים — בדיוק מה שתעשי היום. תפקיד כניסה שנפתח דרך תיק עבודות.",
                  badge: "כניסה: תיק עבודות + היכרות עם כלי AI",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=AI",
                },
                {
                  role: "כותב/ת פרומפטים (Prompt Engineer)", co: "חברות טק, סטארטאפים",
                  desc: "מנסחים את התדריכים שמאחורי מוצרי AI — בודקים, משווים גרסאות, ומודדים איזו עובדת טוב יותר.",
                  badge: "כניסה: כתיבה מדויקת + הבנת מגבלות AI",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Prompt",
                },
                {
                  role: "מטמיע/ת אוטומציות", co: "סוכנויות אוטומציה, מחלקות תפעול",
                  desc: "מחברים AI למערכות של העסק — וואטסאפ, יומן, מערכת הזמנות — כך שהכול זורם בלי ידיים.",
                  badge: "כניסה: כלי אוטומציה (כמו Make) — נלמדים בקורסים קצרים",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=%D7%90%D7%95%D7%98%D7%95%D7%9E%D7%A6%D7%99%D7%94",
                },
                {
                  role: "מאמן/ת ובודק/ת מודלים (AI Trainer)", co: "חברות AI, חברות דאטה",
                  desc: "בודקים תשובות של מודלים, מסמנים טעויות ומלמדים אותם לענות טוב יותר — עבודה שדורשת עין חדה ושפה טובה.",
                  badge: "כניסה: דיוק לשוני + סבלנות לפרטים",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=AI+Trainer",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}>
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-black" style={{ color: AI }}>{item.role}</span>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>{item.co}</span>
                  </div>
                  <div className="text-[11.5px] leading-[1.65] mb-2" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>{item.desc}</div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" dir="rtl" style={{ background: "rgba(124,58,237,0.1)", color: AI }}>
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
                { emoji: "🌪️", text: "התחום משתנה כל כמה חודשים — כלי שעבד אתמול מתעדכן היום. מי שאוהב ללמוד כל הזמן — ייהנה. מי שמחפש שגרה קבועה — יתקשה." },
                { emoji: "🧗", text: "אין עדיין מסלול כניסה סלול — אין תעודה אחת שכולם מכירים. בונים תיק עבודות ומוכיחים. זה גם חיסרון וגם הזדמנות למי שמגיע מוקדם." },
                { emoji: "🎭", text: "ה-AI טועה בביטחון מלא — והאחריות על הטעויות שלו היא שלך. צריך עין חשדנית שבודקת גם תשובה שנשמעת מושלמת." },
                { emoji: "🤝", text: "חצי מהעבודה היא עם אנשים — בעל העסק צריך להבין מה בנית ולסמוך עליו. הסבר סבלני הוא חלק מהמקצוע." },
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
              📋 קריאת עשרות שיחות של העוזר כדי למצוא איפה הוא טעה<br />
              🔁 ניסוח מחדש של אותו משפט בתדריך — בפעם החמישית<br />
              📝 תיעוד גרסאות: מה שונה, למה, ומה קרה אחרי<br />
              🧾 להסביר שוב ושוב ללקוחות מה AI יכול ומה הוא לא<br />
              🕳️ כשהעוזר עובד מצוין — אף אחד לא זוכר שמישהו בנה אותו
            </div>
          </RevealCard>

          <button onClick={() => go("intro")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white mt-2"
            style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
            הבנתי — קדימה למאפייה ←
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
            יום רביעי. 09:00 בבוקר. את מיישמת ה-AI שהגיעה למאפייה השכונתית ״האופה של רמי״.
          </div>

          {/* Context banner — חובה לפני כל scenario */}
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <span style={{ fontSize: 14 }}>💼</span>
            <span className="text-[11.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>מיישם/ת AI בעסק</strong> = מי שלוקח כלי AI קיים ומתאים אותו לעסק ספציפי —
              כותב לו תדריך, מגדיר מה אסור לו, ובודק אותו לפני שהוא פוגש לקוחות אמיתיים.
            </span>
          </div>

          {/* הדימוי שמלווה את כל הדף — מוצג לפני שפוגשים מושג ראשון */}
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
            style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <span style={{ fontSize: 14 }}>🧑‍💼</span>
            <span className="text-[11.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>הדימוי שילווה אותנו כל היום:</strong>{" "}
              AI הוא עובד חדש מבריק שאין לו שכל ישר —
              הוא עושה <strong>בדיוק מה שביקשת</strong>, לא מה שהתכוונת.
            </span>
          </div>

          {/* מה רמי רוצה */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-start gap-3">
              <span className="text-[26px]">🥖</span>
              <div dir="rtl">
                <div className="text-[12.5px] font-black mb-1" style={{ color: NAVY }}>רמי, בעל המאפייה:</div>
                <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)" }}>
                  ״אני מפספס עשרות הודעות וואטסאפ ביום. אנשים שואלים מתי פתוח, מה יש, כמה עולה —
                  ואני עם הידיים בבצק. אני צריך מישהו שיענה להם. אין לי כסף לעובד נוסף.״
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-5 text-[13.5px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            המשימה שלך: לבנות לרמי עוזר AI שעונה ללקוחות בוואטסאפ.{" "}
            <span className="font-bold" style={{ color: NAVY }}>כמו לקלוט עובד חדש — רק שהעובד הזה צריך שיכתבו לו הכול.</span>
          </div>

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
            <div className="text-[12px] font-bold mb-2" style={{ color: "#c2410c" }}>🛠️ הכלים שישמשו אותנו היום</div>
            <div className="flex flex-col gap-1.5">
              {[
                { tool: "התדריך", desc: "ההוראות הכתובות שהעוזר מקבל — כמו דף הדרכה לעובד חדש" },
                { tool: "הגדרות", desc: "המשפטים שמגדירים מה אסור — מה לא מבטיחים ומתי עוצרים" },
                { tool: "הבדיקות", desc: "שאלות אמיתיות של לקוחות שמריצים על העוזר לפני שהוא עולה לאוויר" },
              ].map(({ tool, desc }) => (
                <div key={tool} className="flex items-center gap-2" dir="rtl">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded shrink-0"
                    style={{ background: "rgba(251,133,0,0.12)", color: "#c2410c" }}>{tool}</span>
                  <span className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.6)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => go("step-first")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
            קדימה — כותבים תדריך ראשון ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Step First — התדריך הראשון ──────────────────────────────────────────────
  if (phase === "step-first") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>שלב א׳ — התדריך הראשון</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>
            09:15. עוזר AI לא לומד מלראות את רמי עובד — כל מה שהוא יודע נמצא בתדריך שכותבים לו. הנה טיוטה ראשונה:
          </div>

          <PromptDoc version="גרסה 1" lines={[
            { text: "אתה העוזר של מאפיית ״האופה של רמי״." },
            { text: "תענה ללקוחות בוואטסאפ בצורה נחמדה ותעזור להם בכל מה שהם צריכים." },
          ]} />

          <GlossaryRow terms={[
            {
              term: "תדריך (פרומפט)",
              explanation: (
                <span>
                  ההוראות הכתובות שנותנים ל-AI — כמו דף ההדרכה שמקבל עובד חדש ביום הראשון.
                  כל מה שכתוב בו — העוזר יודע. כל מה שלא — הוא ישלים לבד.<br />
                  באנגלית קוראים לזה <strong>Prompt</strong>.
                </span>
              ),
            },
            {
              term: "עוזר AI",
              explanation: "תוכנה שמנהלת שיחה עם לקוחות — עונה על שאלות לפי התדריך שכתבו לה. היא לא ״מבינה״ את המאפייה — היא מכירה רק את מה שכתבת.",
            },
          ]} />

          <Question
            q="זה התדריך כולו. מה דעתך עליו?"
            options={[
              "מצוין — קצר, נחמד, אפשר לחבר ללקוחות",
              "חסרות בו עובדות על המאפייה — שעות, מוצרים, מחירים — וחסרות גדרות: מה אסור לו להבטיח",
              "צריך לכתוב אותו באנגלית כדי שה-AI יבין",
            ]}
            correct={1}
            okMsg="✓ בדיוק — אין בו אף עובדה ואף גבול. אבל הדרך הכי טובה להבין למה זה מסוכן היא לראות מה קורה. בואי נשלח אותו לעבודה כמו שהוא."
            errMsg="✗ שימי לב: אין בתדריך אף עובדה על המאפייה ואף גבול למה שמותר להבטיח. (ודרך אגב — AI מבין עברית מצוין.) בואי נראה מה יוצא מזה."
            onAnswer={ok => answer(ok)}
            nextLabel="שלחי את העוזר לשיחה ראשונה ←"
            onNext={() => go("first-reply")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── First Reply — הפדיחה ─────────────────────────────────────────────────────
  if (phase === "first-reply") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ב׳ — השיחה הראשונה</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>
            10:40. חיברנו את העוזר לוואטסאפ של המאפייה. הודעה ראשונה נכנסת — קראי כל בועה:
          </div>

          <Chat title="whatsapp — האופה של רמי" lines={[
            { from: "customer", text: "היי, יש חלות טריות ליום שישי? ואם אני קונה חמש — יש הנחה?" },
            { from: "ai", text: "בוודאי! 🎉 חלות טריות יוצאות מהתנור כל יום שישי בבוקר. ועל חמש חלות מגיעה לך הנחה של 20% — מבצע מיוחד שלנו!", label: "⚠️ רגע... איזה מבצע?!", labelColor: "#fca5a5" },
            { from: "note", text: "עשר דקות אחר כך רמי מתקשר: ״איזה מבצע?! אין אצלי שום הנחה של 20%! הלקוחה כבר בדרך עם צילום מסך!״" },
          ]} />

          <GlossaryRow terms={[
            {
              term: "הזיה",
              explanation: (
                <span>
                  כש-AI ממציא עובדה שנשמעת אמינה לגמרי — כמו עובד חדש שלא יודע את התשובה,
                  אבל עונה בביטחון מלא במקום להגיד ״אני אבדוק״.<br />
                  זו לא תקלה נדירה — זו ההתנהגות הצפויה כשחסר לו מידע.
                  באנגלית קוראים לזה <strong>Hallucination</strong>.
                </span>
              ),
            },
            {
              term: "גדרות",
              explanation: (
                <span>
                  המשפטים בתדריך שמגדירים מה <strong>אסור</strong> — מה לא מבטיחים, מתי עוצרים,
                  ומה עושים כשלא יודעים. כמו הכללים שאומרים לעובד חדש ביום הראשון:
                  ״הנחות — רק דרך המנהל״.<br />
                  באנגלית קוראים לזה <strong>Guardrails</strong>.
                </span>
              ),
            },
          ]} />

          {/* עיקרון לפני השאלה */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>הכלל: העובד החדש לא משקר בכוונה — הוא ממלא את החסר</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              ביקשנו ממנו ״תעזור להם בכל מה שהם צריכים״ — והוא עזר: הלקוחה רצתה הנחה, אז הוא המציא אחת.
              הוא עשה <strong>בדיוק מה שביקשנו</strong> — לא מה שהתכוונו.
            </div>
          </div>

          <Question
            q="למה העוזר הבטיח הנחה שלא קיימת?"
            options={[
              "מישהו פרץ לעוזר ושתל בו את המבצע",
              "התדריך ביקש ״לעזור בכל דבר״ בלי עובדות ובלי גדרות — אז הוא המציא תשובה שתשמח את הלקוחה",
              "ה-AI לא מבין עברית מספיק טוב",
            ]}
            correct={1}
            okMsg="✓ נכון. זו הזיה — והיא צפויה לחלוטין כשאין גדרות. עכשיו נכתוב אותן, כמו שמדריכים עובד חדש אחרי טעות ראשונה."
            errMsg="✗ אף אחד לא פרץ, והעברית שלו מצוינת. הבעיה בתדריך שלנו: ״תעזור בכל דבר״ בלי עובדות ובלי גדרות = הזמנה להמציא."
            onAnswer={ok => answer(ok)}
            nextLabel="לכתוב גדרות ←"
            onNext={() => go("guardrails")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Guardrails — כותבים גדרות ────────────────────────────────────────────────
  if (phase === "guardrails") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ג׳ — גדרות</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>
            11:30. ישבנו עם רמי, רשמנו את העובדות האמיתיות — וכתבנו את התדריך מחדש.
          </div>

          {/* עיקרון לפני התרגיל */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>הכלל: כל מה שלא כתבת בתדריך — העובד החדש ישלים מהדמיון</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              לכן תדריך טוב בנוי משני חלקים: <strong>עובדות</strong> (ממה מותר לענות)
              ו<strong>גדרות</strong> (מה אסור, ומה אומרים כשלא יודעים).
            </div>
          </div>

          <PromptDoc version="גרסה 2" lines={[
            { text: "אתה העוזר של מאפיית ״האופה של רמי״. ענה ללקוחות בוואטסאפ בחום ובקצרה." },
            { text: "העובדות:", head: true },
            { text: "שעות פתיחה: ראשון–שישי 06:00–14:00. שבת — סגור." },
            { text: "מוצרים: חלה 18 ₪ · לחם מחמצת 22 ₪ · פיתות 10 ₪ לשקית · בורקס 6 ₪." },
            { text: "הזמנות ליום שישי נסגרות ביום חמישי ב-12:00." },
            { text: "הגדרות:", head: true },
            { text: "ענה רק לפי העובדות שלמעלה.", fence: true },
            { text: "אסור להבטיח הנחות או מבצעים.", fence: true },
            { text: "אם משהו לא כתוב כאן — אמור: ״אני אבדוק עם רמי ונחזור אליך״.", fence: true },
            { text: "הזמנות מיוחדות — תמיד להעביר לרמי.", fence: true },
          ]} />

          <Question
            q="הלקוחה מהבוקר שואלת שוב: ״יש הנחה על חמש חלות?״ — מה יעצור הפעם את הפדיחה?"
            options={[
              "ההוראה ״ענה בחום ובקצרה״ — עוזר מנומס לא מבטיח סתם",
              "שתי גדרות שעובדות יחד: ״אסור להבטיח הנחות״ + ״אם לא כתוב — אבדוק עם רמי ונחזור אליך״",
              "העובדה ששעות הפתיחה כתובות בתדריך",
            ]}
            correct={1}
            okMsg="✓ בדיוק. איסור מפורש — ודרך מילוט מכובדת. עובד חדש טוב יודע להגיד ״אני לא יודע, אבדוק״ — וזה בדיוק מה שלימדנו את העוזר."
            errMsg="✗ נימוס לא עוצר המצאות — הוא היה מנומס להפליא גם כשהמציא את המבצע. מה שעוצר: האיסור המפורש על הנחות + ברירת המחדל ״אבדוק עם רמי״."
            onAnswer={ok => answer(ok)}
            nextLabel="לבדוק על שאלות אמיתיות ←"
            onNext={() => go("test")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Test — בדיקות על שאלות אמיתיות ──────────────────────────────────────────
  if (phase === "test") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ד׳ — הבדיקות</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>
            14:00. לפני שמחברים לקוחות אמיתיים — מריצים על העוזר שאלות שרמי באמת מקבל. קראי את שלוש התשובות:
          </div>

          <Chat title="בדיקות — גרסה 2" lines={[
            { from: "customer", text: "עד איזו שעה אתם פתוחים היום?" },
            { from: "ai", text: "פתוחים היום עד 14:00 😊 מחכים לך!", label: "✓ ענה מהעובדות", labelColor: "#86efac" },
            { from: "customer", text: "יש הנחה אם אני קונה חמש חלות?" },
            { from: "ai", text: "אין לי אפשרות להבטיח הנחות — אבל אבדוק עם רמי ונחזור אליך בהקדם 🙏", label: "✓ הגדר עבדה!", labelColor: "#86efac" },
            { from: "customer", text: "יש לכם עוגות בלי גלוטן?" },
            { from: "ai", text: "כן, בטח! יש לנו מבחר עוגות ללא גלוטן, טריות וטעימות במיוחד 🍰", label: "⚠️ רגע... זה בכלל לא בעובדות!", labelColor: "#fca5a5" },
          ]} />

          {/* עיקרון לפני השאלה */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: "#92400e" }}>🔍 מה גילינו?</div>
            <div className="text-[12px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              שתי גדרות עבדו — ואחת נפרצה. ״עוגות ללא גלוטן״ לא מופיע בעובדות,
              והגדר הכללית ״ענה רק לפי העובדות״ לא החזיקה מול שאלה שנשמעת תמימה.<br />
              <strong>בשביל זה בודקים לפני שמחברים לקוחות</strong> — גם עובד חדש עם הדרכה טובה מתלהב לפעמים,
              ורק צפייה בעבודה שלו מגלה את זה.
            </div>
          </div>

          <Question
            q="העוזר המציא עוגות ללא גלוטן למרות הגדרות. מה עושים?"
            options={[
              "מוותרים — אי אפשר לסמוך על AI, חבל על הזמן של רמי",
              "מחזקים את התדריך: מוסיפים ״רשימת המוצרים סגורה — אין מוצרים אחרים״, ובודקים שוב",
              "מוחקים את השאלה על הגלוטן מהוואטסאפ",
            ]}
            correct={1}
            okMsg="✓ זה בדיוק המחזור של המקצוע: תדריך ← בדיקה ← שיפור ← בדיקה שוב. לא מוותרים ולא סומכים בעיניים עצומות — משפרים ובודקים."
            errMsg="✗ לא מוותרים ולא מוחקים שאלות של לקוחות — מחזקים את הגדר: גדר ספציפית (״הרשימה סגורה״) חזקה מגדר כללית. ואז בודקים שוב."
            onAnswer={ok => answer(ok)}
            nextLabel="לשפר ולסגור ←"
            onNext={() => go("improve")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Improve — גרסה 3 ────────────────────────────────────────────────────────
  if (phase === "improve") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ה׳ — השיפור</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>
            16:00. שתי שורות חדשות בתדריך — מסומנות בירוק — ואז מריצים שוב את השאלה שנפלה:
          </div>

          <PromptDoc version="גרסה 3 — מה נוסף" lines={[
            { text: "הגדרות:", head: true },
            { text: "רשימת המוצרים שלמעלה היא סגורה — אין מוצרים אחרים.", fence: true, added: true },
            { text: "נשאלת על מוצר שלא ברשימה? אמור: ״זה לא במבחר הקבוע שלנו — אבדוק עם רמי אם אפשר להזמין מיוחד״.", fence: true, added: true },
          ]} />

          <Chat title="בדיקה חוזרת — גרסה 3" lines={[
            { from: "customer", text: "יש לכם עוגות בלי גלוטן?" },
            { from: "ai", text: "זה לא במבחר הקבוע שלנו — אבל אשמח לבדוק עם רמי אם אפשר להזמין מיוחד. לתת לו את המספר שלך? 🙏", label: "✓ עכשיו — כן!", labelColor: "#86efac" },
            { from: "note", text: "רמי בסוף היום: ״הוא ענה לשלושים הודעות בזמן שאפיתי. שלוש הזמנות חדשות לשישי.״" },
          ]} />

          <Question
            q="שאלה אחרונה להיום: מה ישמור על העוזר טוב גם בעוד חודש?"
            options={[
              "כלום — אחרי שהתדריך טוב, הוא טוב לתמיד",
              "רשימת שאלות בדיקה קבועה + מעבר על שיחות אמיתיות פעם בשבוע — כמו חניכה מתמשכת של עובד חדש",
              "להחליף את העוזר בעוזר חדש כל חודש",
            ]}
            correct={1}
            okMsg="✓ בדיוק. המאפייה משתנה — מחירים, מוצרים, חגים — ותדריך שלא מתעדכן חוזר להמציא. הבדיקה השבועית היא העבודה, לא תוספת לה."
            errMsg="✗ המאפייה משתנה — מחירים, מוצרים, חגים. תדריך קפוא חוזר להמציא, והחלפת עוזר מאפסת את כל מה שלמדנו. התשובה: בדיקות קבועות."
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
        const journey = JSON.parse(localStorage.getItem("ai-journey") || "{}");
        localStorage.setItem("ai-journey", JSON.stringify({ ...journey, day: true }));
      } catch { /* ignore */ }
      window.location.href = href;
    }
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-7">
            <div className="text-[52px] mb-2">🤖</div>
            <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>העוזר של רמי באוויר</div>
            <div className="text-[13px]" dir="rtl" style={{ color: "rgba(0,0,0,0.4)" }}>מתדריך תמים אחד — דרך פדיחה — לעוזר עם גדרות שעובד</div>
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>מה עשית היום</div>
            <div className="flex flex-col gap-2">
              {[
                { tool: "תדריך (פרומפט)", desc: "גרסה 1 — קצרה, נחמדה... ומסוכנת", icon: "📄" },
                { tool: "זיהוי הזיה", desc: "העוזר המציא הנחה של 20% — כי ביקשנו ״לעזור בכל דבר״", icon: "🎭" },
                { tool: "גדרות", desc: "עובדות + איסורים + ״אבדוק עם רמי ונחזור אליך״", icon: "🚧" },
                { tool: "בדיקות", desc: "שלוש שאלות אמיתיות — שתיים עברו, אחת נפרצה", icon: "🧪" },
                { tool: "שיפור", desc: "גרסה 3: רשימה סגורה + תשובה מוכנה למוצר שלא קיים", icon: "🔧" },
              ].map(({ tool, desc, icon }) => (
                <div key={tool} className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(34,197,94,0.07)", border: "1px solid #22c55e44" }}>
                  <span className="text-[18px]">{icon}</span>
                  <div>
                    <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{tool}</div>
                    <div className="text-[11.5px]" dir="rtl" style={{ color: "rgba(0,0,0,0.45)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real world incident */}
          <div className="rounded-2xl p-4 mb-6" style={{ background: "#0f172a" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>📰 זה קורה בעולם האמיתי</div>
            <div className="text-[12.5px] leading-[1.7] mb-3" dir="rtl" style={{ color: "#e2e8f0" }}>
              <strong style={{ color: "#c4b5fd" }}>אייר קנדה — פברואר 2024</strong><br />
              הצ׳אטבוט של חברת התעופה המציא לנוסע מדיניות החזר שלא קיימת — הבטיח לו הנחת אֵבֶל
              שאפשר לבקש אחרי הטיסה. בית הדין בקנדה חייב את החברה לכבד את מה שהבוט הבטיח:
              ״החברה אחראית לכל מה שכתוב באתר שלה — כולל מה שהצ׳אטבוט אומר״.
            </div>
            <div className="text-[11.5px] mt-3 leading-[1.6]" dir="rtl" style={{ color: "#94a3b8" }}>
              בדיוק הפדיחה של רמי — בקנה מידה של חברת תעופה. מי שיודעת לכתוב גדרות ולבדוק לפני שמחברים לקוחות —{" "}
              <strong style={{ color: "#e2e8f0" }}>חוסכת לעסקים בדיוק את זה.</strong>
            </div>
          </div>

          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(251,133,0,0.08)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>מה זה אומר לקריירה שלך</div>
            <div className="text-[13px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              כל עסק שמפספס הודעות צריך עוזר כזה — והעוזר טוב בדיוק כמו התדריך, הגדרות והבדיקות שלו.{" "}
              <span className="font-bold" style={{ color: NAVY }}>מי שיודעת לכתוב אותם — נכנסת לשוק שנולד ממש עכשיו.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/ai/learn/mystery")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
            למיני-פרויקט: העוזר של המרפאה ←
          </button>
          <button onClick={() => saveAndGo("/explore/ai/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${AI}`, color: AI, fontFamily: "'Heebo', sans-serif" }}>
            מיציתי את הטעימה — קדימה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}
