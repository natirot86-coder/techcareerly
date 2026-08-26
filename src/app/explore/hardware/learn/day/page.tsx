"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — חומרה ואלקטרוניקה
const HW = "#7c2d12";
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Phase =
  | "career"
  | "intro"
  | "step-first"
  | "multimeter-result"
  | "scope-result"
  | "fix-it"
  | "debrief"
  | "design-intro"
  | "design-cap"
  | "design-logic"
  | "done";

const PHASE_ORDER: Phase[] = [
  "step-first", "multimeter-result", "scope-result", "fix-it", "debrief",
  "design-intro", "design-cap", "design-logic",
];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

// ─── Terminal (פלט מכשירי מדידה בסגנון מסוף) ──────────────────────────────────

function Terminal({ title, lines }: { title?: string; lines: { text: string; color?: string; label?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>{title ?? "hardware lab"}</span>
      </div>
      <div className="p-4 font-mono text-[12px] leading-[2]" style={{ background: "#0f172a" }} dir="ltr">
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-3">
            <span style={{ color: l.color ?? "#e2e8f0", flex: 1 }}>{l.text || "\u00a0"}</span>
            {l.label && (
              <span className="text-[10px] px-2 py-0.5 rounded shrink-0" dir="rtl"
                style={{ background: "rgba(124,45,18,0.25)", color: "#fdba74", fontFamily: "'Heebo', sans-serif" }}>
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
              style={{ background: HW, fontFamily: "'Heebo', sans-serif" }}>
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
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(124,45,18,0.18)" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(124,45,18,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, fontFamily: "'Heebo', sans-serif" }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(124,45,18,0.03)" }}>
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
          background: open ? "rgba(124,45,18,0.14)" : "rgba(124,45,18,0.06)",
          border: `1px solid rgba(124,45,18,${open ? 0.3 : 0.15})`,
          color: HW, fontFamily: "'Heebo', sans-serif",
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

// ─── Video embed ──────────────────────────────────────────────────────────────

function VideoEmbed({ id, label }: { id: string; label: string }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
      <div className="px-4 py-2.5" style={{ background: "rgba(0,0,0,0.04)" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>🎥 סרטון בעברית</div>
        <div className="text-[12px] font-bold" style={{ color: NAVY }}>{label}</div>
      </div>
      <div className="relative" style={{ paddingTop: "56.25%" }}>
        <iframe src={`https://www.youtube.com/embed/${id}`} title={label} allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// חוזרים בדיוק לשלב שבו נעצרנו, כולל הניקוד — אחרת מסך הסיכום מציג ניקוד שגוי
function loadSavedState(): { phase?: Phase; score?: number } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("hardware-day-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function HardwareDayPage() {
  const [phase, setPhase] = useState<Phase>(() => loadSavedState().phase ?? "career");
  const [score, setScore] = useState(() => loadSavedState().score ?? 0);

  useEffect(() => {
    try { localStorage.setItem("hardware-day-state", JSON.stringify({ phase, score })); } catch {/* ignore */}
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
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: HW }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/hardware" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {canGoBack && (
            <button onClick={goBack} className="text-[12px] font-bold" style={{ opacity: 0.82, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
              שלב קודם ↩
            </button>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי מהנדסת חומרה</div>
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
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה מהנדסת חומרה?</div>
          <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנצלול לתקלה אמיתית במעבדה — בואי נבין את התפקיד</div>

          {/* Timeline — נשאר גלוי */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "08:30", icon: "📊", task: "בדיקת תוצאות ריצת הלילה של עמדות הבדיקה — כמה לוחות עברו, כמה נכשלו" },
              { time: "09:30", icon: "🔬", task: "מעבדה: אבחון לוח שנכשל — מולטימטר, אוסצילוסקופ, בדיקה חזותית" },
              { time: "11:00", icon: "📐", task: "ישיבת תכן: סקירת שרטוט (schematic) של גרסת הלוח הבאה" },
              { time: "13:30", icon: "🔧", task: "תיקון ואימות: מחליפים רכיב חשוד ומריצים את הבדיקות מחדש" },
              { time: "16:00", icon: "📝", task: "תיעוד: מה נמצא, מה תוקן, ומה משנים בתכן כדי שלא יחזור" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: "rgba(0,0,0,0.35)", minWidth: 34 }}>{item.time}</span>
                <span className="text-[16px] shrink-0">{item.icon}</span>
                <span className="text-[12.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.7)" }}>{item.task}</span>
              </div>
            ))}
          </div>

          {/* Entry path — גלוי, בכנות, בלי מספרי שכר מומצאים */}
          <div className="rounded-xl p-4 mb-5 flex gap-4 items-center" style={{ background: "rgba(124,45,18,0.06)", border: "1px solid rgba(124,45,18,0.15)" }}>
            <div className="text-[28px]">🎓</div>
            <div dir="rtl">
              <div className="text-[13px] font-black" style={{ color: NAVY }}>הכניסה: תואר הנדסת חשמל או הנדסאי מה״ט</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>אלקטרוניקה · מכטרוניקה · אין דלת של בוטקאמפ קצר — וזה חלק ממה שהופך את המקצוע ליציב</div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>נתוני שכר — בכרטיסי התארים בשלב 4</div>
            </div>
          </div>

          {/* Wow card — ריגוש וסיפוק — גלוי, לפני האתגרים */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "linear-gradient(135deg, rgba(124,45,18,0.08) 0%, rgba(251,133,0,0.08) 100%)", border: "1.5px solid rgba(124,45,18,0.2)" }}>
            <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>⚡ למה אנשים אוהבים את התפקיד הזה</div>
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: "🌍", text: "השבב שתכננת נמצא במיליוני מכשירים — ברכב, בטלפון, במוניטור בבית חולים. אנשים מחזיקים ביד משהו שאת בנית." },
                { emoji: "🔍", text: "כל תקלה היא חידה פיזית — מודדים, מצמצמים, מוצאים את הרכיב האשם. הרגע שהלוח נדלק אחרי התיקון — סיפוק שרואים בעיניים." },
                { emoji: "🛠️", text: "עובדים בידיים ובראש ביחד — מלחם, אוסצילוסקופ ומחשב על אותו שולחן. לא רק מסך." },
                { emoji: "🏭", text: "מקצוע שקשה להחליף — אי אפשר ללמוד אותו בשלושה חודשים, ולכן מי שבפנים מבוקש לאורך שנים." },
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
                  role: "טכנאי/ת מעבדה", co: "חברות מכשור, תעשייה ביטחונית",
                  desc: "תפקיד הכניסה הנפוץ — הרכבה, מדידות, הרצת בדיקות ותיקוני לוחות. לומדים את המקצוע מהידיים.",
                  badge: "כניסה: הנדסאי אלקטרוניקה או ניסיון מעשי",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=%D7%98%D7%9B%D7%A0%D7%90%D7%99+%D7%90%D7%9C%D7%A7%D7%98%D7%A8%D7%95%D7%A0%D7%99%D7%A7%D7%94",
                },
                {
                  role: "הנדסאי/ת אלקטרוניקה", co: "אלביט, רפאל, תעשייה אווירית, מכשור רפואי",
                  desc: "אבחון, בדיקות ואינטגרציה של מערכות אלקטרוניות. עמוד השדרה של התעשייה הביטחונית והמכשור.",
                  badge: "כניסה: מסלול הנדסאי מה״ט — כשנתיים",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=%D7%94%D7%A0%D7%93%D7%A1%D7%90%D7%99+%D7%90%D7%9C%D7%A7%D7%98%D7%A8%D7%95%D7%A0%D7%99%D7%A7%D7%94",
                },
                {
                  role: "מהנדס/ת חומרה (Board Design)", co: "Intel, Mobileye, סטארטאפים",
                  desc: "תכנון לוחות אלקטרוניים — בחירת רכיבים, שרטוט, ליווי ייצור ובדיקות. הגרסה המלאה של מה שתראי היום.",
                  badge: "כניסה: תואר הנדסת חשמל / אלקטרוניקה",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Hardware+Engineer",
                },
                {
                  role: "מהנדס/ת Validation", co: "Intel, Nvidia, Apple",
                  desc: "בודקים ששבב חדש באמת עושה מה שתוכנן — כתיבת בדיקות, ניתוח כשלים, עבודה עם צוותי התכן.",
                  badge: "כניסה: תואר הנדסה · דלת נפוצה לענף השבבים",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Validation+Engineer",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(124,45,18,0.04)", border: "1px solid rgba(124,45,18,0.12)" }}>
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-black" style={{ color: HW }}>{item.role}</span>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>{item.co}</span>
                  </div>
                  <div className="text-[11.5px] leading-[1.65] mb-2" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>{item.desc}</div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" dir="rtl" style={{ background: "rgba(124,45,18,0.1)", color: HW }}>
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
                { emoji: "⏳", text: "מסלול כניסה ארוך — הנדסאי כשנתיים, תואר ארבע שנים. אין קיצור דרך, וחשוב לדעת את זה מראש." },
                { emoji: "🐌", text: "מחזורי פיתוח איטיים מתוכנה — תיקון בלוח יכול לחכות לסבב ייצור הבא. סבלנות היא כלי עבודה." },
                { emoji: "💸", text: "טעות עולה כסף אמיתי — לוח שיוצא לייצור עם באג אי אפשר 'לעדכן מרחוק' כמו אפליקציה." },
                { emoji: "📏", text: "דיוק בלתי מתפשר — הבדל של מילימטר או וולט אחד הוא ההבדל בין לוח עובד ללוח מת." },
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
              📋 מילוי דוחות בדיקה ארוכים לכל לוח ולכל גרסה<br />
              🔁 הרצת אותה בדיקה עשרות פעמים כדי לשחזר תקלה נדירה<br />
              📦 המתנה לרכיבים — הרכיב שצריך יגיע רק בעוד שבועיים<br />
              🧾 עבודה מול ספקים ותיעוד גרסאות של כל רכיב<br />
              🕳️ כשהכל עובד — אף אחד לא שם לב שעבדת
            </div>
          </RevealCard>

          {/* סרטון מאומת (ASR) — מכללת אפקה, 2:50. סרטון הקריירה אחרי כל ה-RevealCards, לפני ה-CTA */}
          <RevealCard emoji="🎥" title="מהי הנדסת חשמל? — בעברית (3 דק')">
            <VideoEmbed id="HQo6hRkVh70" label="מהי הנדסת חשמל? — מכללת אפקה" />
          </RevealCard>

          <button onClick={() => go("intro")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white mt-2"
            style={{ background: HW, fontFamily: "'Heebo', sans-serif" }}>
            הבנתי — קדימה לתקלה האמיתית ←
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
            יום שלישי. 09:30 בבוקר. את מהנדסת החומרה במעבדה של חברת מכשור.
          </div>

          {/* Context banner — חובה לפני כל scenario */}
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
            style={{ background: "rgba(124,45,18,0.06)", border: "1px solid rgba(124,45,18,0.15)" }}>
            <span style={{ fontSize: 14 }}>🔬</span>
            <span className="text-[11.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>מעבדת חומרה</strong> = החדר שבו לוחות אלקטרוניים נבדקים ומתוקנים.
              על השולחן: מולטימטר, אוסצילוסקופ, מלחם — והלוח החשוד.
            </span>
          </div>

          {/* הדימוי שמלווה את כל הדף — מוצג לפני שפוגשים מושג ראשון */}
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
            style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <span style={{ fontSize: 14 }}>🚰</span>
            <span className="text-[11.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>הדימוי שילווה אותנו כל הדרך:</strong>{" "}
              חשמל בלוח מתנהג כמו מים בצנרת — <strong>מתח</strong> = לחץ המים,{" "}
              <strong>זרם</strong> = כמות המים שזורמת. בלי לחץ תקין, אף "ברז" (שבב) לא עובד.
            </span>
          </div>

          {/* לאימות שמע ידני לפני חשיפה רחבה — אין caption track, אך ההתאמה התמטית (אנלוגיית המים) מדויקת */}
          <RevealCard emoji="🎥" title="מתח וזרם דרך בריכת מים — הסרטון של הדימוי שלנו (3 דק')">
            <VideoEmbed id="e0rFS1o4Lv4" label="מטען, פוטנציאל, מתח וזרם — אנלוגיית בריכת המים" />
          </RevealCard>

          {/* סרטון מאומת (ASR) — 45 שניות, בגובה בית-ספר. לפני מושג המעגל הראשון (הלוח והפסים) */}
          <RevealCard emoji="🎥" title="מהו מעגל חשמלי? — ב-45 שניות">
            <VideoEmbed id="F79vcL0ZC9k" label="מהו מעגל חשמלי?" />
          </RevealCard>

          {/* The failing board */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f172a" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Test Station 2 — Board #A-1047</div>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#eab308" }} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(220,38,38,0.15)", border: "1px solid #dc262644" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f87171" }}>FAIL</span>
                </div>
                <div className="font-mono text-[12px]" dir="ltr" style={{ color: "#e2e8f0" }}>09:12 POWER-ON SELF TEST — FAIL (no boot)</div>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#22c55e" }}>PASS</span>
                </div>
                <div className="font-mono text-[12px]" dir="ltr" style={{ color: "#e2e8f0" }}>09:14 POWER-ON SELF TEST — PASS (retry)</div>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(220,38,38,0.15)", border: "1px solid #dc262644" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f87171" }}>FAIL</span>
                </div>
                <div className="font-mono text-[12px]" dir="ltr" style={{ color: "#e2e8f0" }}>09:26 POWER-ON SELF TEST — FAIL (no boot)</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-5 text-[13.5px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(124,45,18,0.06)", border: "1px solid rgba(124,45,18,0.15)" }}>
            הלוח נכשל <strong>לסירוגין</strong> — לפעמים נדלק, לפעמים לא. אלו התקלות הכי מתעתעות:
            אי אפשר סתם להחליף חלק ולקוות.{" "}
            <span className="font-bold" style={{ color: NAVY }}>צריך למצוא את הסיבה — עם מדידות.</span>
          </div>

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
            <div className="text-[12px] font-bold mb-2" style={{ color: "#c2410c" }}>🛠️ הכלים שישמשו אותנו</div>
            <div className="flex flex-col gap-1.5">
              {[
                { tool: "מולטימטר", desc: "מד הלחץ של הלוח — כמה מתח יש בנקודה, ברגע זה" },
                { tool: "אוסצילוסקופ", desc: "סרט של הלחץ לאורך זמן — תופס נפילות רגעיות" },
                { tool: "בדיקה חזותית", desc: "עיניים + זכוכית מגדלת — חיבורים סדוקים ורכיבים שרופים" },
              ].map(({ tool, desc }) => (
                <div key={tool} className="flex items-center gap-2">
                  <code className="text-[11px] font-black px-2 py-0.5 rounded"
                    style={{ background: "rgba(251,133,0,0.12)", color: "#c2410c", fontFamily: "'Heebo', sans-serif" }}>{tool}</code>
                  <span className="text-[11.5px]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => go("step-first")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: HW, fontFamily: "'Heebo', sans-serif" }}>
            קחי את הלוח לשולחן העבודה ←
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
            09:35. הלוח על השולחן. לפני שנוגעים במשהו — עיקרון אחד:
          </div>

          {/* כרטיס עיקרון לפני השאלה */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>הכלל: קודם מודדים, אחר כך מחליפים</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              החלפת חלקים בניחוש נקראת "shotgun repair" — לפעמים עוזרת, אף פעם לא מלמדת.
              מדידה אחת טובה שווה עשר החלפות. ומאיפה מתחילים למדוד? <strong>תמיד מהחשמל</strong> —
              בלי מתח תקין, שום דבר על הלוח לא יעבוד.
            </div>
          </div>

          <GlossaryRow terms={[
            { term: "מולטימטר", explanation: "מכשיר המדידה הבסיסי של כל טכנאי — כמו מד לחץ שמצמידים לצינור: מראה כמה מתח (לחץ) יש בנקודה ברגע זה. עולה כמה עשרות שקלים ונמצא בכל מעבדה." },
            {
              term: "פס מתח (Power Rail)",
              explanation: (
                <span dir="rtl">
                  קו חשמלי על הלוח שמספק מתח קבוע לרכיבים — למשל פס של 3.3V ופס של 5V.<br />
                  כמו צנרת מים בבניין: אם אין לחץ בצנרת, אף ברז לא עובד — ולא משנה כמה הברזים תקינים.
                </span>
              )
            },
            { term: "firmware", explanation: "התוכנה הקטנה שצרובה על הלוח עצמו ומריצה אותו — הצעד הראשון כשהלוח נדלק. אם הלוח בכלל לא נדלק, הבעיה כנראה לפני ה-firmware — בחשמל." },
          ]} />

          {/* סרטון מאומת (ASR) — 1:15. לפני סצנת קריאת המולטימטר (כלל 7: סרטון לפני השאלה שמשתמשת במושג) */}
          <RevealCard emoji="🎥" title="איך משתמשים ברב־מודד (מולטימטר)? — דקה ורבע">
            <VideoEmbed id="gcUbsYWruE0" label="שימוש ברב־מודד למדידת זרם" />
          </RevealCard>

          <Question
            q="לוח שנכשל לסירוגין. מה הצעד הראשון?"
            options={[
              "להחליף את הלוח בלוח חדש ולסגור את התקלה",
              "לחבר מולטימטר ולמדוד את פסי המתח על הלוח",
              "לצרוב firmware מחדש — אולי התוכנה התקלקלה",
            ]}
            correct={1}
            okMsg="✓ נכון — קודם מודדים. תקלה לסירוגין בהדלקה מריחה כמו בעיית חשמל, ומדידת פסי המתח תגיד לנו תוך דקה אם צדקנו."
            errMsg="✗ להחליף לוח = לזרוק את הראיות; לצרוב firmware = לנחש. קודם מודדים את פסי המתח — בלי חשמל תקין שום דבר לא יעבוד."
            onAnswer={ok => answer(ok)}
            nextLabel="חברי את המולטימטר ←"
            onNext={() => go("multimeter-result")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Multimeter Result ────────────────────────────────────────────────────────
  if (phase === "multimeter-result") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            חיברת מולטימטר לשלושת פסי המתח. מדדת פעמיים — פעם כשהלוח עובד, ופעם בדיוק ברגע כישלון:
          </div>
          <Terminal title="multimeter — board #A-1047" lines={[
            { text: "== BOARD OK (09:41) ==", color: "#64748b" },
            { text: "12V rail:   12.02 V", color: "#22c55e", label: "תקין" },
            { text: "5V rail:     4.98 V", color: "#22c55e", label: "תקין" },
            { text: "3.3V rail:   3.31 V", color: "#22c55e", label: "תקין" },
            { text: "" },
            { text: "== BOARD FAIL (09:47) ==", color: "#64748b" },
            { text: "12V rail:   12.01 V", color: "#22c55e", label: "תקין" },
            { text: "5V rail:     4.99 V", color: "#22c55e", label: "תקין" },
            { text: "3.3V rail:   2.38 V", color: "#f87171", label: "⚠️ נמוך מדי!" },
          ]} />

          <GlossaryRow terms={[
            {
              term: "קצר (Short)",
              explanation: (
                <span dir="rtl">
                  במים: <strong>פיצוץ בצינור</strong> — כל הלחץ מתנקז החוצה בבת אחת, ולברזים לא מגיע כלום.<br />
                  בחשמל: חיבור לא רצוי שהזרם "מקצר" דרכו במקום לעבור ברכיבים. קצר מלא מפיל את המתח לאפס ומחמם רכיבים.<br />
                  אצלנו המתח נפל ל-2.38V ולא לאפס — כלומר הלחץ ירד, לא נעלם. כנראה לא קצר מלא.
                </span>
              )
            },
            { term: "נפילת מתח", explanation: "הלחץ בצינור ירד מתחת למה שהברזים צריכים — והם פשוט מפסיקים לעבוד. שבב שדורש לחץ 3.3 ומקבל 2.4 מתנהג בדיוק כמו הלוח שלנו: לפעמים עולה, לפעמים לא." },
            { term: "קבל (Capacitor)", explanation: "רכיב שאוגר חשמל ומייצב את המתח — כמו מיכל מים קטן ליד הברז ששומר על לחץ קבוע. קבל תקול = מתח לא יציב. אחד הרכיבים שמתקלקלים הכי הרבה." },
          ]} />

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#dc2626" }}>🔍 מה אנחנו יודעים עכשיו?</div>
            <div className="text-[12px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              שני פסים יציבים תמיד. פס ה-3.3V נופל ל-2.38V — <strong>בדיוק ברגעי הכישלון.</strong><br />
              מצאנו את האזור — אבל מולטימטר מראה מספר אחד בכל רגע.<br />
              כדי לראות <em>איך</em> המתח נופל לאורך זמן — צריך את הכלי הבא.
            </div>
          </div>

          <Question
            q="פס ה-3.3V נופל בדיוק ברגעי הכישלון. מה המסקנה הנכונה?"
            options={[
              "השבב הראשי שרוף — צריך להחליף אותו",
              "משהו במסלול של פס ה-3.3V לא יציב — שם ממוקדת החקירה",
              "המולטימטר לא מכויל — המדידה לא אמינה",
            ]}
            correct={1}
            okMsg="✓ בדיוק! הבעיה ממוקדת במסלול ה-3.3V. עוד לא יודעים אם זה רכיב, לחמה או קצר — בשביל זה נמדוד לאורך זמן עם אוסצילוסקופ."
            errMsg="✗ שבב שרוף לא עובד אף פעם — והלוח שלנו עובד לסירוגין. שני הפסים האחרים יציבים, אז המולטימטר בסדר. הבעיה במסלול ה-3.3V."
            onAnswer={ok => answer(ok)}
            nextLabel="חברי את האוסצילוסקופ ←"
            onNext={() => go("scope-result")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Scope Result ─────────────────────────────────────────────────────────────
  if (phase === "scope-result") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            מולטימטר מראה מספר. אוסצילוסקופ מראה <strong>סרט</strong> — את המתח לאורך זמן.
            חיברת את הפרוב לפס ה-3.3V והשארת את הלוח דולק עשרים דקות:
          </div>

          <Terminal title="oscilloscope — 3.3V rail" lines={[
            { text: "3.4V |", color: "#64748b" },
            { text: "3.3V |‾‾‾‾‾‾‾‾‾‾\\    /‾‾\\      /‾‾‾", color: "#22c55e" },
            { text: "     |           \\  /    \\    /", color: "#eab308" },
            { text: "2.4V |            \\/      \\__/", color: "#f87171", label: "נפילות רגעיות" },
            { text: "     +--------------------------------", color: "#64748b" },
            { text: "      0min   8min    12min   16min", color: "#64748b" },
            { text: "", color: "#64748b" },
            { text: "board temp: 24°C → 41°C over 20 min", color: "#eab308", label: "הלוח מתחמם" },
          ]} />

          <GlossaryRow terms={[
            { term: "אוסצילוסקופ", explanation: "מכשיר שמצייר גרף של המתח לאורך זמן. מה שמולטימטר מפספס — נפילה של אלפית שנייה — האוסצילוסקופ תופס. הכלי המרכזי של כל מעבדת אלקטרוניקה." },
            {
              term: "לחמה קרה",
              explanation: (
                <span dir="rtl">
                  נקודת הלחמה שלא נוצרה כמו שצריך — הבדיל לא נמס עד הסוף, והחיבור מחזיק "בקושי".<br /><br />
                  הטריק המלוכלך שלה: <strong>בקור היא מוליכה, בחום היא מתרחבת ומתנתקת.</strong><br />
                  לכן תקלות שמופיעות "רק אחרי שהמכשיר עובד קצת" — לחמה קרה היא חשודה מיידית.
                </span>
              )
            },
            { term: "התפשטות תרמית", explanation: "מתכת מתרחבת כשהיא מתחממת — בשברירי מילימטר. בחיבור בריא זה לא מורגש; בלחמה סדוקה זה בדיוק מה שמנתק את המגע." },
          ]} />

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: "#92400e" }}>🔍 מה גילינו?</div>
            <div className="text-[12px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              המתח יציב כשהלוח קר. הנפילות מתחילות אחרי שמונה דקות — <strong>כשהלוח מתחמם.</strong><br />
              תקלה שתלויה בטמפרטורה = משהו פיזי משתנה עם החום.
            </div>
          </div>

          <RevealCard emoji="🧊" title="איך מאשרים חשד לתקלה תלוית-חום?">
            <div className="text-[12px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              טכניקה אמיתית מהמעבדה: <strong>קירור נקודתי</strong>.<br />
              מרססים ספריי קירור על אזור חשוד ברגע התקלה — אם המתח מתאושש מיד, מצאנו את האזור.<br />
              ולהפך: אקדח חום עדין על אזור בריא-לכאורה יכול לשחזר את התקלה בכוונה.<br />
              חום וקור הם כלי אבחון — לא רק אויבים.
            </div>
          </RevealCard>

          <Question
            q="המתח יציב כשהלוח קר ונופל כשהוא מתחמם. מה החשוד הסביר ביותר?"
            options={[
              "באג ב-firmware שמופיע רק אחרי כמה דקות",
              "חיבור פיזי שמתנתק עם החום — למשל לחמה קרה במסלול ה-3.3V",
              "עומס יתר על השבב הראשי שמחמם את הלוח",
            ]}
            correct={1}
            okMsg="✓ מצוין! תקלה תלוית-חום עם נפילת מתח = חיבור פיזי שמתרחב ומתנתק. לחמה קרה היא החשודה הקלאסית. עכשיו — למצוא אותה ולתקן."
            errMsg="✗ firmware לא משתנה עם הטמפרטורה, וחימום עצמי של הלוח הוא נורמלי. מתח שנופל עם חום מצביע על חיבור פיזי שמתנתק — לחמה קרה."
            onAnswer={ok => answer(ok)}
            nextLabel="לבדיקה חזותית ולתיקון ←"
            onNext={() => go("fix-it")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Fix It ─────────────────────────────────────────────────────────────────
  if (phase === "fix-it") {
    return <FixItPhase onDone={() => go("debrief")} />;
  }

  // ── Debrief ─────────────────────────────────────────────────────────────────
  if (phase === "debrief") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>יומן מעבדה — סיכום התקלה</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>כל תיקון מסתיים בתיעוד. זה מה שהופך תקלה אחת לידע של כל הצוות.</div>

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[13px] font-black mb-2" style={{ color: NAVY }}>מה נכנס ליומן המעבדה?</div>
            <div className="text-[12.5px] leading-[1.75]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              📝 <strong>הסימפטום</strong> — כישלון לסירוגין בהדלקה, מתגבר עם חום<br />
              🔍 <strong>הממצא</strong> — נפילות מתח בפס ה-3.3V, לחמה סדוקה במחבר המתח<br />
              🔧 <strong>התיקון</strong> — הלחמה מחדש + 50 מחזורי בדיקה קר/חם<br />
              🛡️ <strong>המניעה</strong> — מה יעצור את זה בלוחות הבאים
            </div>
          </div>

          <Question
            q="שאלת המניעה: איך מוודאים שלחמות קרות לא יגיעו ללקוחות בכלל?"
            options={[
              "אי אפשר — לחמה קרה תמיד תתגלה רק אצל הלקוח",
              "בדיקה אופטית אוטומטית של הלחמות בפס הייצור + בדיקת חום ללוחות לפני משלוח",
              "להפסיק להשתמש בלחמות ולעבור לדבק",
            ]}
            correct={1}
            okMsg="✓ בדיוק! בפסי ייצור אמיתיים יש AOI — מצלמה שסורקת כל לחמה — ובדיקות burn-in שמחממות את הלוח לפני משלוח. ככה תקלת חום נתפסת במפעל, לא בשטח."
            errMsg="✗ דווקא אפשר: בדיקה אופטית אוטומטית (AOI) סורקת כל לחמה בייצור, ובדיקת burn-in מחממת לוחות לפני משלוח כדי להקדים תקלות חום. דבק לא מוליך חשמל."
            onAnswer={ok => answer(ok)}
            nextLabel="הבוקר נסגר — לישיבת התכנון של אחר הצהריים ←"
            onNext={() => go("design-intro")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Design Intro — אחר הצהריים: עכשיו מתכננים (הצד של המהנדס/ת) ─────────────
  if (phase === "design-intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>אחר הצהריים — עכשיו מתכננים</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>13:30. התקלה של הבוקר סגורה. עכשיו — ישיבת תכן על הגרסה הבאה של המכשיר.</div>

          {/* החלפת כובע — הרגע שבו ההבדל הנדסאי/מהנדס נחווה ולא רק נאמר */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1.5px solid rgba(2,62,138,0.15)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>🎩 החלפת כובע</div>
            <div className="text-[12.5px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              כל הבוקר עבדת עם כובע של <strong>הנדסאי/ת</strong> — לבנות, למדוד, לאתר.
              עכשיו נטעם את הצד השני: <strong style={{ color: HW }}>זו העבודה של מהנדס/ת התכנון — ההנדסאי בונה ובודק את מה שתוכנן כאן.</strong>{" "}
              ההשוואה המלאה בין שתי הדלתות מחכה בדף התחום.
            </div>
          </div>

          {/* עיקרון לפני השאלה */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(124,45,18,0.05)", border: "1px solid rgba(124,45,18,0.13)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: HW }}>הכלל: בתכנון אין תשובה מושלמת — יש עסקה</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              כל בחירה נותנת משהו ולוקחת משהו. במים: <strong>משאבה חזקה</strong> נותנת לחץ גבוה —
              אבל שואבת את מיכל המים מהר. <strong>משאבה חסכונית</strong> מספיקה לברזים — והמיכל מחזיק יום שלם.
              מי שבוחר "הכי חזק" בכל סעיף — מקבל מכשיר שנגמר לו הכוח בצהריים.
            </div>
          </div>

          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
            הדרישה מהלקוח + שני המעבדים על השולחן
          </div>
          <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="px-4 py-2.5" style={{ background: "rgba(2,62,138,0.05)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="text-[12px] font-bold" dir="rtl" style={{ color: NAVY }}>📋 דרישה: המכשיר חייב להחזיק 24 שעות על סוללה</span>
            </div>
            {[
              { name: "מעבד A — החזק", spec: "מהיר פי שלושה ממה שהמכשיר צריך · צורך פי ארבעה חשמל", result: "הסוללה תחזיק ~9 שעות", ok: false },
              { name: "מעבד B — החסכוני", spec: "עומד בדיוק בדרישות המכשיר · צריכת חשמל נמוכה", result: "הסוללה תחזיק ~26 שעות", ok: true },
            ].map((p, i) => (
              <div key={i} className="px-4 py-3" dir="rtl"
                style={{ borderBottom: i === 0 ? "1px solid rgba(0,0,0,0.05)" : "none", background: "#fff" }}>
                <div className="text-[12.5px] font-black mb-0.5" style={{ color: NAVY }}>{p.name}</div>
                <div className="text-[11.5px] mb-1" style={{ color: "rgba(0,0,0,0.55)" }}>{p.spec}</div>
                <div className="text-[11px] font-bold" style={{ color: p.ok ? "#15803d" : "#b91c1c" }}>🔋 {p.result}</div>
              </div>
            ))}
          </div>

          <Question
            q="החלטת תכנון ראשונה: איזה מעבד נכנס לגרסה הבאה?"
            options={[
              "מעבד A החזק — שיהיה מהיר, את הסוללה נפתור אחר כך",
              "מעבד B החסכוני — עומד בדרישות, והסוללה תחזיק 24 שעות כנדרש",
              "שניהם על הלוח — ליתר ביטחון",
            ]}
            correct={1}
            okMsg="✓ חשבת כמו מתכננת! הדרישה היא 24 שעות — ומעבד B עומד בה. 'הכי חזק' זה לא תמיד 'הכי נכון': תכנון טוב בוחר את מה שמספיק ועומד בדרישה. זו העסקה."
            errMsg="✗ הדרישה הקשיחה היא 24 שעות סוללה — מעבד A נותן 9, ושני מעבדים = כפול משקל, מחיר וצריכה. המשאבה החסכונית שמספיקה לברזים מנצחת. זו העסקה של התכנון."
            onAnswer={ok => answer(ok)}
            nextLabel="להחלטה הבאה — איפה שמים את המיכל? ←"
            onNext={() => go("design-cap")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Design — מיקום הקבל (מונע את התקלה של הבוקר) ─────────────────────────────
  if (phase === "design-cap") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            ההחלטה הבאה קשורה ישירות לבוקר שלך: ראינו מה קורה כשהלחץ בצינור ה-3.3 נופל לרגע —
            השבב "משתהק" והלוח נכשל.
          </div>

          {/* מושג לפני השאלה — קבל כמיכל רזרבה */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>🫙 המושג: קבל = מיכל רזרבה קטן</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              קבל שומר רזרבה של חשמל ומחליק נפילות רגעיות בלחץ — כמו מיכל קטן שממשיך לספק מים
              לברז גם כשהצינור "שיהק" לשנייה. בתכנון הלוח, <strong>המתכננת מחליטה איפה לשים אותו</strong> —
              וההחלטה הזו קובעת אם הוא באמת יציל את השבב.
            </div>
          </div>

          <Question
            q="החלטת תכנון שנייה: איפה לשים את הקבל, כדי שנפילת לחץ רגעית לא תפיל את השבב הרגיש?"
            options={[
              "צמוד לשבב הרגיש — המיכל ליד הברז שצריך אותו",
              "בכניסת החשמל של הלוח — רחוק מהשבב, אבל מקום מרווח",
              "לא צריך קבל — עדיף לחסוך רכיב",
            ]}
            correct={0}
            okMsg="✓ בדיוק! מיכל ליד הברז עוזר מיד; מיכל בכניסה לבית — עד שהמים מגיעים לברז, הברז כבר שיהק. בתכנון אמיתי זה כלל ברזל: קבל צמוד לכל שבב. ככה הגרסה הבאה לא תסבול מהתקלה של הבוקר."
            errMsg="✗ נפילת לחץ נבלמת רק אם הרזרבה קרובה: מיכל בכניסה לבית לא מספיק מהיר, ובלי מיכל בכלל — כל שיהוק מפיל את השבב. הכלל בתכנון: קבל צמוד לשבב הרגיש."
            onAnswer={ok => answer(ok)}
            nextLabel="להחלטה האחרונה — קצת לוגיקה ←"
            onNext={() => go("design-logic")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Design — שער לוגי (אבני הלגו של השבב) ────────────────────────────────────
  if (phase === "design-logic") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            החלטה אחרונה להיום — והיא הצצה למה שקורה <strong>בתוך</strong> השבבים שמהנדסים מתכננים.
          </div>

          {/* מושג לפני השאלה — שערים לוגיים במילים של יומיום */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>🧱 המושג: שערים לוגיים — אבני הלגו של כל שבב</div>
            <div className="text-[12px] leading-[1.85]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              שער לוגי הוא רכיב זעיר שמקבל תנאים ומחליט כן/לא. יש שלושה בסיסיים:<br />
              🔒 <strong>שער "וגם" (AND)</strong> — אומר כן רק אם <strong>שני</strong> התנאים מתקיימים יחד<br />
              🔓 <strong>שער "או" (OR)</strong> — אומר כן אם <strong>לפחות אחד</strong> מהתנאים מתקיים<br />
              🔄 <strong>שער "לא" (NOT)</strong> — הופך: כן נהיה לא, לא נהיה כן<br />
              מיליארדי שערים כאלה, מחוברים נכון — זה שבב.
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 mb-5" style={{ background: "rgba(124,45,18,0.05)", border: "1px solid rgba(124,45,18,0.13)" }}>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              📋 <strong style={{ color: HW }}>הדרישה מהלקוח:</strong>{" "}
              "האזעקה תצפצף רק אם הטמפרטורה גבוהה <strong>וגם</strong> המכסה פתוח.
              מכסה פתוח לבד? לא נורא. חום לבד? המאוורר מטפל. שניהם יחד — סכנה אמיתית."
            </div>
          </div>

          <Question
            q="החלטת תכנון שלישית: איזה שער מחבר את שני החיישנים לאזעקה?"
            options={[
              'שער "או" (OR) — שהאזעקה תתריע על כל דבר חשוד',
              'שער "וגם" (AND) — האזעקה תצפצף רק כששני התנאים מתקיימים יחד',
              'שער "לא" (NOT) — שיהפוך את האות של החיישן',
            ]}
            correct={1}
            okMsg='✓ נכון! "וגם" = שני התנאים יחד, בדיוק כמו שהלקוח ביקש. עם "או" האזעקה הייתה מצפצפת בכל פתיחת מכסה שגרתית — ואחרי שבוע כולם היו מתעלמים ממנה. מאבני לגו כאלה בנוי כל שבב שתכננת היום.'
            errMsg='✗ הדרישה: רק כששני התנאים מתקיימים יחד — זה בדיוק שער "וגם" (AND). "או" מצפצף על כל תנאי בודד, ו"לא" רק הופך אות. הקשיבו ללקוח: המילה "וגם" הייתה שם.'
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
        const journey = JSON.parse(localStorage.getItem("hardware-journey") || "{}");
        localStorage.setItem("hardware-journey", JSON.stringify({ ...journey, day: true }));
      } catch { /* ignore */ }
      window.location.href = href;
    }
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-7">
            <div className="text-[52px] mb-2">🔬</div>
            <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>הלוח חזר לחיים</div>
            <div className="text-[13px]" dir="rtl" style={{ color: "rgba(0,0,0,0.4)" }}>אבחנת תקלה לסירוגין בבוקר — וקיבלת שלוש החלטות תכנון אחר הצהריים</div>
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>מה השתמשת היום</div>
            <div className="flex flex-col gap-2">
              {[
                { tool: "מולטימטר", desc: "מדידת הלחץ בפסי המתח — 3.3V נופל ל-2.38V בכישלון", icon: "📟" },
                { tool: "אוסצילוסקופ", desc: "סרט הלחץ לאורך זמן — נפילות שמתחילות עם החום", icon: "📈" },
                { tool: "בדיקה חזותית", desc: "לחמה סדוקה במחבר המתח — בזכוכית מגדלת", icon: "🔎" },
                { tool: "הלחמה מחדש", desc: "תיקון ממוקד + 50 מחזורי אימות קר/חם", icon: "🔧" },
                { tool: "יומן מעבדה", desc: "תיעוד + מניעה — AOI ו-burn-in בייצור", icon: "📝" },
                { tool: "החלטות תכן", desc: "מעבד חסכוני · קבל צמוד לשבב · שער וגם (AND)", icon: "📐" },
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
              <strong style={{ color: "#fdba74" }}>Xbox 360 — "טבעת המוות האדומה"</strong><br />
              מיליוני קונסולות של מיקרוסופט קרסו בגלל חיבורי הלחמה של השבב הגרפי, שנסדקו ממחזורי
              חימום וקירור חוזרים. התקלה עלתה למיקרוסופט למעלה ממיליארד דולר בתיקונים והארכות אחריות.
            </div>
            <div className="text-[11.5px] mt-3 leading-[1.6]" dir="rtl" style={{ color: "#94a3b8" }}>
              מה שעשית היום — מדידה, בידוד תקלה תלוית-חום, ומניעה בייצור —{" "}
              <strong style={{ color: "#e2e8f0" }}>זה בדיוק סוג העבודה שהיה חוסך את זה.</strong>
            </div>
          </div>

          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(251,133,0,0.08)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>מה זה אומר לקריירה שלך</div>
            <div className="text-[13px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              טעמת היום את <strong>שני הכובעים</strong> של התחום: בבוקר עבדת כמו{" "}
              <span className="font-bold" style={{ color: HW }}>הנדסאי/ת</span> — לבנות, למדוד, לאתר;
              אחר הצהריים כמו{" "}
              <span className="font-bold" style={{ color: NAVY }}>מהנדס/ת תכנון</span> — להחליט מה ייכנס לגרסה הבאה.
              אלו שתי דלתות אמיתיות לאותו עולם — ההשוואה המלאה ביניהן (כולל שכר מאומת) מחכה בדף התחום.{" "}
              <span className="font-bold" style={{ color: NAVY }}>מי שיודעת למדוד — תמיד תהיה נחוצה.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/hardware/learn/mystery")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: HW, fontFamily: "'Heebo', sans-serif" }}>
            לתעלומת המכשיר החוזר ←
          </button>
          <button onClick={() => saveAndGo("/explore/hardware/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${HW}`, color: HW, fontFamily: "'Heebo', sans-serif" }}>
            מיציתי את הטעימה — קדימה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}

// ─── Fix It Phase (קומפוננטה נפרדת — כמו בתבנית networks, בגלל חוקי hooks) ─────

function FixItPhase({ onDone }: { onDone: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);

  const options = [
    { label: "להחליף את הלוח כולו — התיקון לא שווה את הזמן", why: "✗ הלוח תקין חוץ מלחמה אחת. החלפה = לזרוק כסף ולא ללמוד כלום." },
    { label: "להלחים מחדש את הלחמה הסדוקה במחבר המתח — ואז לאמת בבדיקה חוזרת", why: "✓ תיקון ממוקד: מחממים את הנקודה עם מלחם, הבדיל נמס ונוצר חיבור בריא. ואז — מאמתים." },
    { label: "להצמיד את המחבר עם דבק חזק שלא יזוז", why: "✗ דבק לא מוליך חשמל — הבעיה היא המגע החשמלי, לא התזוזה." },
  ];
  const correct = 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: HW }}>
        <div className="max-w-[720px] mx-auto">
          <div className="text-[20px]" style={HEEBO}>יום בחיי מהנדסת חומרה</div>
        </div>
      </div>
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
        <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מצאת — עכשיו מתקנים</div>
        <div className="text-[13px] mb-5" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>10:20. בדיקה חזותית בזכוכית מגדלת לאורך מסלול ה-3.3V — והנה זה:</div>

        {/* Visual inspection mockup */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
          בדיקה חזותית — מסלול ה-3.3V
        </div>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 14 }}>🔎</span>
            <span className="text-[12px] font-bold" style={{ color: NAVY }}>ממצאי הבדיקה — Board #A-1047</span>
          </div>
          {[
            { point: "ממיר המתח (Regulator)", finding: "לחמות מבריקות וחלקות", problem: false },
            { point: "קבלים לאורך הפס", finding: "מראה תקין, אין נפיחות", problem: false },
            { point: "מחבר המתח J4", finding: "לחמה מטה (עמומה) עם סדק דק מסביב לפין", problem: true },
          ].map((r, i, arr) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", background: r.problem ? "rgba(220,38,38,0.04)" : "#fff" }}>
              <span className="text-[12px] font-bold w-36 shrink-0" dir="rtl" style={{ color: r.problem ? "#dc2626" : NAVY }}>{r.point}</span>
              <span className="text-[12px] flex-1" dir="rtl" style={{ color: r.problem ? "#dc2626" : "rgba(0,0,0,0.6)" }}>{r.finding}</span>
              {r.problem && <span className="text-[10px] font-black px-2 py-0.5 rounded shrink-0" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>⚠️ חשוד</span>}
            </div>
          ))}
        </div>

        <div className="rounded-xl px-3 py-2 mb-5 flex items-center gap-2"
          style={{ background: "rgba(124,45,18,0.06)", border: "1px solid rgba(124,45,18,0.15)" }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span className="text-[11.5px] leading-[1.5]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
            לחמה בריאה נראית <strong style={{ color: NAVY }}>מבריקה וחלקה</strong> כמו טיפת כסף.
            לחמה קרה נראית <strong style={{ color: "#dc2626" }}>עמומה ומחוספסת</strong> — ולפעמים עם סדק דק. בדיוק מה שמצאנו.
          </span>
        </div>

        {/* Fix options */}
        <div className="text-[13.5px] font-bold mb-4" style={{ color: NAVY }}>מה הצעד הנכון?</div>
        <div className="flex flex-col gap-3 mb-4">
          {options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = i === correct;
            const answered = picked !== null;
            let bg = "#fff", border = "1.5px solid rgba(0,0,0,0.08)", color = "rgba(0,0,0,0.75)";
            if (answered) {
              if (isCorrect) { bg = "rgba(34,197,94,0.08)"; border = "1.5px solid #22c55e55"; color = "#15803d"; }
              else if (isPicked) { bg = "rgba(220,38,38,0.07)"; border = "1.5px solid #dc262644"; color = "#b91c1c"; }
              else { color = "rgba(0,0,0,0.3)"; }
            }
            return (
              <button key={i} type="button" disabled={answered} onClick={() => setPicked(i)} className="text-right w-full">
                <div className="rounded-xl px-4 py-3 text-[13px] transition-all" style={{ background: bg, border, color }}>
                  {opt.label}
                </div>
                {answered && (isPicked || isCorrect) && (
                  <div className="text-[11.5px] px-4 pt-1.5 text-right" style={{ color: isCorrect ? "#15803d" : "#b91c1c" }}>{opt.why}</div>
                )}
              </button>
            );
          })}
        </div>

        {/* After correct fix — verification */}
        {picked === correct && !verified && (
          <div>
            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid #22c55e55" }}>
              <div className="text-[12px] font-black mb-2" style={{ color: "#15803d" }}>✓ הלחמת מחדש את J4!</div>
              <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
                אבל תיקון בלי אימות הוא ניחוש. הכלל במעבדה: <strong>משחזרים את תנאי התקלה</strong> —
                מחממים את הלוח ומריצים את הבדיקה שוב ושוב.
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>אמתי — הריצי בדיקה חוזרת בחום</div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
              <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
                <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
                <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
                <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
              </div>
              <div className="p-4 font-mono text-[12px] leading-[2]" style={{ background: "#0f172a" }} dir="ltr">
                <div style={{ color: "#60a5fa" }}>$ run-test --cycles 50 --thermal</div>
                <div style={{ color: "#94a3b8" }}>heating board to 45°C...</div>
                <div style={{ color: "#22c55e" }}>PASS 50/50 cycles</div>
                <div style={{ color: "#22c55e" }}>3.3V rail: 3.30V stable <span style={{ color: "#64748b" }}># ✓ גם בחום</span></div>
              </div>
            </div>

            <button onClick={() => setVerified(true)} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: "#15803d", fontFamily: "'Heebo', sans-serif" }}>
              ✓ חמישים מתוך חמישים — הלוח תקין ←
            </button>
          </div>
        )}

        {verified && (
          <button onClick={onDone} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: HW, fontFamily: "'Heebo', sans-serif" }}>
            ליומן המעבדה ←
          </button>
        )}

        {picked !== null && picked !== correct && (
          <div className="text-center text-[12px] mt-3" style={{ color: "rgba(0,0,0,0.45)" }}>
            נסי שוב — בחרי את הפעולה הנכונה
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
