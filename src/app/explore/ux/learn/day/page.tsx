"use client";
import React, { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — עיצוב UX/UI
const PINK = "#db2777";
const NAVY = "#023e8a";

type Phase =
  | "career"
  | "intro"
  | "funnel"
  | "why"
  | "fix-keyboard"
  | "fix-copy"
  | "fix-fields"
  | "after"
  | "done";

const PHASE_ORDER: Phase[] = [
  "funnel", "why", "fix-keyboard", "fix-copy", "fix-fields", "after",
];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

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
              style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
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
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(219,39,119,0.18)" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(219,39,119,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, fontFamily: "'Heebo', sans-serif" }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(219,39,119,0.03)" }}>
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
          background: open ? "rgba(219,39,119,0.14)" : "rgba(219,39,119,0.06)",
          border: `1px solid rgba(219,39,119,${open ? 0.3 : 0.15})`,
          color: PINK, fontFamily: "'Heebo', sans-serif",
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

// ─── PhoneFrame — מוקאפ מסך כ-div מעוצב, לא תמונה ─────────────────────────────

function PhoneFrame({ label, tone, children }: { label: string; tone: "bad" | "good"; children: React.ReactNode }) {
  return (
    <div className="flex-1" style={{ minWidth: 210, maxWidth: 260 }}>
      <div className="text-center text-[11px] font-black mb-2"
        style={{ color: tone === "bad" ? "#b91c1c" : "#15803d" }}>
        {tone === "bad" ? "🔴 " : "🟢 "}{label}
      </div>
      <div className="rounded-[24px] p-[7px] mx-auto" style={{ background: "#1e293b", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
        <div className="rounded-[18px] overflow-hidden" style={{ background: "#fff" }} dir="rtl">
          {children}
        </div>
      </div>
    </div>
  );
}

function MockField({ label, danger, note }: { label: string; danger?: boolean; note?: string }) {
  return (
    <div className="mb-2">
      <div className="text-[9px] font-bold mb-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>{label}</div>
      <div className="rounded-lg h-[26px]"
        style={{ border: danger ? "1.5px solid #dc2626" : "1px solid rgba(0,0,0,0.15)", background: danger ? "rgba(220,38,38,0.04)" : "#fff" }} />
      {note && <div className="text-[8.5px] mt-0.5 leading-[1.4]" style={{ color: "#15803d" }}>{note}</div>}
    </div>
  );
}

// מקלדת אותיות — מה שקופץ היום בשדה הטלפון (הבאג)
function LettersKeyboard() {
  const rows = ["קראטוןםפ", "שדגכעיחלך", "זסבהנמצתץ"];
  return (
    <div className="px-1.5 py-1.5" style={{ background: "#e2e8f0" }}>
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-[2px] mb-[2px]">
          {row.split("").map((ch, j) => (
            <div key={j} className="rounded-[3px] text-center text-[8px] py-[3px]"
              style={{ background: "#fff", width: 16, color: "rgba(0,0,0,0.6)" }}>{ch}</div>
          ))}
        </div>
      ))}
      <div className="text-center text-[8px] font-bold pt-0.5" style={{ color: "#b91c1c" }}>
        מקלדת אותיות — בשדה של מספרים
      </div>
    </div>
  );
}

// מקלדת מספרים — התיקון
function NumbersKeyboard() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
  return (
    <div className="px-6 py-1.5" style={{ background: "#e2e8f0" }} dir="ltr">
      <div className="grid grid-cols-3 gap-[3px]">
        {keys.map((k, i) => (
          <div key={i} className="rounded-[4px] text-center text-[10px] font-bold py-[4px]"
            style={{ background: k ? "#fff" : "transparent", color: "rgba(0,0,0,0.7)" }}>{k}</div>
        ))}
      </div>
      <div className="text-center text-[8px] font-bold pt-1" style={{ color: "#15803d" }} dir="rtl">
        מקלדת מספרים נפתחת מעצמה
      </div>
    </div>
  );
}

// ─── FunnelMap — מפת הנטישה ────────────────────────────────────────────────────

function FunnelMap({ improved }: { improved?: boolean }) {
  const steps = improved
    ? [
        { label: "פתחו את מסך ההרשמה", n: 1000, pct: 100, drop: null as string | null },
        { label: "מילאו שם מלא", n: 890, pct: 89, drop: null },
        { label: "עברו את שדה הטלפון", n: 730, pct: 73, drop: "רק 18% עזבו כאן ✓" },
        { label: "סיימו הרשמה", n: 660, pct: 66, drop: null },
      ]
    : [
        { label: "פתחו את מסך ההרשמה", n: 1000, pct: 100, drop: null as string | null },
        { label: "מילאו שם מלא", n: 850, pct: 85, drop: null },
        { label: "עברו את שדה הטלפון", n: 340, pct: 34, drop: "60% עזבו כאן!" },
        { label: "סיימו הרשמה", n: 320, pct: 32, drop: null },
      ];
  return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f172a", boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }} dir="rtl">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>
        מפת נטישה · מסך ההרשמה · {improved ? "אחרי התיקון" : "השבוע האחרון"}
      </div>
      {steps.map((s, i) => {
        const isDrop = !!s.drop;
        const barColor = improved
          ? "#22c55e"
          : isDrop || s.pct < 40 ? "#ef4444" : "#38bdf8";
        return (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[11.5px] font-bold" style={{ color: "#e2e8f0" }}>{s.label}</span>
              <span className="text-[11px] font-mono" style={{ color: "#94a3b8" }} dir="ltr">{s.n} ({s.pct}%)</span>
            </div>
            <div className="h-[14px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${s.pct}%`, background: barColor }} />
            </div>
            {s.drop && (
              <div className="text-[11px] font-black mt-1" style={{ color: improved ? "#4ade80" : "#f87171" }}>
                {improved ? "✓ " : "⚠️ "}{s.drop}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── מסך "לפני" — מוקאפ ההרשמה השבור ──────────────────────────────────────────

function BeforeScreen() {
  return (
    <PhoneFrame label="המסך היום — לפני" tone="bad">
      <div className="px-2.5 py-2 text-center text-[10px] font-black text-white" style={{ background: PINK }}>
        🛵 משלוח מהיר
      </div>
      <div className="px-3 pt-2 pb-1">
        <div className="text-[11px] font-black mb-2" style={{ color: NAVY }}>הרשמה</div>
        <MockField label="שם מלא" />
        <MockField label="מספר טלפון" danger />
        <MockField label="אימייל" />
        <MockField label="כתובת מלאה" />
        <MockField label="תאריך לידה" />
        <div className="rounded-lg text-center text-[10px] font-bold text-white py-1.5 mb-2"
          style={{ background: "rgba(0,0,0,0.25)" }}>המשך</div>
      </div>
      <LettersKeyboard />
    </PhoneFrame>
  );
}

// ─── מסך "אחרי" — שלוש ההחלטות הקטנות ─────────────────────────────────────────

function AfterScreen() {
  return (
    <PhoneFrame label="המסך המתוקן — אחרי" tone="good">
      <div className="px-2.5 py-2 text-center text-[10px] font-black text-white" style={{ background: PINK }}>
        🛵 משלוח מהיר
      </div>
      <div className="px-3 pt-2 pb-1">
        <div className="text-[11px] font-black mb-2" style={{ color: NAVY }}>עוד רגע מזמינים 🎉</div>
        <MockField label="שם מלא" />
        <MockField label="מספר טלפון" note="כדי שהשליח יתקשר כשהוא מגיע אליך 📞" />
        <div className="rounded-lg text-center text-[10px] font-bold text-white py-1.5 mb-2"
          style={{ background: "#16a34a" }}>לחנות ←</div>
        <div className="text-center text-[8px] mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>
          את הכתובת נשאל רק כשתזמינו משהו
        </div>
      </div>
      <NumbersKeyboard />
    </PhoneFrame>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UxDayPage() {
  const [phase, setPhase] = useState<Phase>("career");
  const [score, setScore] = useState(0);

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (next === "done") {
      // סימון סיום הטעימה — מפתח המסע של התחום
      try {
        const journey = JSON.parse(localStorage.getItem("ux-journey") || "{}");
        localStorage.setItem("ux-journey", JSON.stringify({ ...journey, day: true }));
      } catch { /* ignore */ }
    }
    setPhase(next);
  }
  function answer(ok: boolean) { if (ok) setScore(s => s + 1); }

  function goBack() {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx > 0) go(PHASE_ORDER[idx - 1]);
    else if (phase === "funnel") go("intro");
    else if (phase === "intro") go("career");
  }
  const canGoBack = phase !== "career" && phase !== "done";

  const pNum = phaseNum(phase);
  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: PINK }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/ux" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {canGoBack && (
            <button onClick={goBack} className="text-[12px] font-bold" style={{ opacity: 0.82, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
              שלב קודם ↩
            </button>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי מעצב/ת מוצר</div>
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
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה מעצב/ת מוצר?</div>
          <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנצלול לבעיה אמיתית — בואי נבין את התפקיד</div>

          {/* האנלוגיה המרכזית — גלויה, מלווה את כל הטעימה */}
          <div className="rounded-2xl p-4 mb-5" dir="rtl"
            style={{ background: "linear-gradient(135deg, rgba(219,39,119,0.08) 0%, rgba(168,85,247,0.08) 100%)", border: "1.5px solid rgba(219,39,119,0.2)" }}>
            <div className="text-[13px] font-black mb-2" style={{ color: NAVY }}>🛒 עיצוב מוצר הוא כמו לסדר חנות</div>
            <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.68)" }}>
              אם הלקוח לא מוצא את החלב תוך עשר שניות — הוא יוצא בלי לקנות.
              מעצבת מוצר מסדרת את "החנות" של האפליקציה: מה רואים קודם, איפה כל דבר עומד,
              ואיזה שלט קטן חוסך ללקוח שאלה. <strong style={{ color: NAVY }}>המשתמש אף פעם לא אשם — הסידור אשם.</strong>
            </div>
          </div>

          {/* יום עבודה טיפוסי */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "09:00", icon: "📊", task: "בדיקת נתונים — איפה אנשים נתקעו אתמול באפליקציה?" },
              { time: "10:00", icon: "👥", task: "צפייה במשתמשת אמיתית — איך היא מסתדרת עם המסך החדש?" },
              { time: "11:30", icon: "✏️", task: "סקיצות — שלוש גרסאות שונות למסך ההרשמה" },
              { time: "14:00", icon: "🤝", task: "ישיבה עם מנהלת המוצר והמתכנתים — מה בונים עד סוף השבוע" },
              { time: "16:00", icon: "🔍", task: "בדיקת הגרסה שנבנתה — האם יצא כמו שתוכנן?" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" dir="rtl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: "rgba(0,0,0,0.35)", minWidth: 34 }}>{item.time}</span>
                <span className="text-[16px] shrink-0">{item.icon}</span>
                <span className="text-[12.5px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.7)" }}>{item.task}</span>
              </div>
            ))}
          </div>

          {/* ריגוש — גלוי, לפני האתגרים */}
          <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "linear-gradient(135deg, rgba(219,39,119,0.07) 0%, rgba(59,130,246,0.07) 100%)", border: "1.5px solid rgba(219,39,119,0.18)" }}>
            <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>⚡ למה אנשים אוהבים את התפקיד הזה</div>
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: "👀", text: "את רואה אנשים אמיתיים משתמשים במשהו שאת עיצבת — בסופר, באוטובוס, אצל סבתא. מעט מקצועות נותנים את זה." },
                { emoji: "💡", text: "הרגע שמשתמש אומר \"וואי, כמה פשוט\" — אחרי שבועיים שהזזת כפתור אחד עשר פעמים. הפשטות הזו היא העבודה שלך." },
                { emoji: "🧠", text: "שילוב נדיר: קצת פסיכולוגיה, קצת יצירתיות, קצת נתונים. כל בעיה היא חידה על בני אדם, לא רק על מסכים." },
                { emoji: "🚪", text: "משפיעים על המוצר בלי לכתוב קוד — הכלי המרכזי הוא הבנת אנשים, והחלטות קטנות שמזיזות מספרים גדולים." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[16px] shrink-0 mt-0.5">{item.emoji}</span>
                  <span className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.7)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* כנות על שוק הג'וניורים — גלוי, לא מוסתר */}
          <div className="rounded-xl p-4 mb-5" dir="rtl" style={{ background: "rgba(217,119,6,0.06)", border: "1.5px solid rgba(217,119,6,0.25)" }}>
            <div className="text-[12px] font-black mb-1.5" style={{ color: "#92400e" }}>🧭 חשוב לדעת מראש, ביושר</div>
            <div className="text-[12px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)" }}>
              השוק למתחילים בעיצוב מוצר <strong>תחרותי מאוד</strong> — על משרה ראשונה מתמודדים רבים.
              מה שמכריע הוא <strong>תיק העבודות</strong> (פורטפוליו): פרויקטים שמראים איך את חושבת, לא רק איך זה נראה.
              בניית תיק היא חלק מהמסלול עצמו — לא תוספת. שווה לדבר על זה בפתיחות עם הרכזת.
            </div>
          </div>

          {/* RevealCards */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>רוצי לדעת עוד? לחצי להרחבה</div>

          <RevealCard emoji="🏢" title="איפה עובדים ואיזה תפקידים קיימים?">
            <div className="flex flex-col gap-3">
              {[
                {
                  role: "מעצב/ת מוצר (Product Designer)", co: "סטארטאפים, בנקים, וולט, מאנדיי",
                  desc: "התפקיד הרחב ביותר — אחראית על כל החוויה: מהרעיון, דרך הסקיצות, ועד בדיקת מה שנבנה. עובדת צמוד למנהלי מוצר ומתכנתים.",
                  badge: "הכניסה דרך תיק עבודות חזק",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Product+Designer",
                },
                {
                  role: "חוקר/ת חוויית משתמש (UX Researcher)", co: "חברות גדולות, מכוני מחקר",
                  desc: "מתמחה בצד של הבנת האנשים — ראיונות, צפיות במשתמשים, ניתוח התנהגות. פחות מציירת מסכים, יותר מגלה למה אנשים עושים מה שהם עושים.",
                  badge: "מתאים למי שאוהבת לשאול שאלות",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=UX+Researcher",
                },
                {
                  role: "מעצב/ת ממשק (UI Designer)", co: "סוכנויות דיגיטל, סטודיואים",
                  desc: "מתמחה בצד הוויזואלי — צבעים, טיפוגרפיה, אנימציות קטנות. הופכת סקיצה אפורה למסך שנעים להסתכל עליו.",
                  badge: "מתאים למי שיש לה עין חזותית",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=UI+Designer",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3.5" dir="rtl" style={{ background: "rgba(219,39,119,0.04)", border: "1px solid rgba(219,39,119,0.12)" }}>
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-black" style={{ color: PINK }}>{item.role}</span>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>{item.co}</span>
                  </div>
                  <div className="text-[11.5px] leading-[1.65] mb-2" style={{ color: "rgba(0,0,0,0.6)" }}>{item.desc}</div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(219,39,119,0.1)", color: PINK }}>
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
              <div className="text-[11px] leading-[1.6] rounded-lg px-3 py-2" style={{ background: "rgba(217,119,6,0.07)", color: "#92400e" }}>
                תזכורת כנה: בכל התפקידים האלה, משרה ראשונה דורשת תיק עבודות וסבלנות — התחרות על תפקידי ג'וניור גבוהה.
              </div>
            </div>
          </RevealCard>

          <RevealCard emoji="🔥" title="האתגרים האמיתיים של התפקיד">
            <div>
              {[
                { emoji: "🗣️", text: "כולם מרגישים שיש להם דעה על עיצוב — המנכ\"ל, המתכנת, הדוד של המנכ\"ל. צריך לדעת להגן על החלטות עם נתונים, לא עם טעם אישי." },
                { emoji: "✂️", text: "העיצוב היפה שתכננת ייחתך — בגלל לוחות זמנים, אילוצים טכניים, או תקציב. לומדים לוותר על הפרטים הנכונים." },
                { emoji: "📏", text: "קשה להוכיח הצלחה — \"המסך יפה יותר\" זה לא נתון. לכן מעצבים טובים לומדים למדוד: כמה סיימו, כמה נטשו." },
                { emoji: "🎯", text: "התיק קובע, והתיק דורש עבודה — גם אחרי הקורס, בניית פורטפוליו אמיתי לוקחת חודשים של פרויקטים." },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-2 ${i > 0 ? "mt-2.5 pt-2.5" : ""}`} style={i > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}}>
                  <span className="shrink-0">{item.emoji}</span>
                  <span className="text-[12px] leading-[1.6]">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealCard>

          <RevealCard emoji="🌫️" title="החלקים הפחות מסעירים (שאף אחד לא מספר עליהם)">
            <div className="text-[12px] leading-[1.75]" dir="rtl">
              📋 ישיבות. הרבה ישיבות — סנכרון עם מוצר, פיתוח, שיווק<br />
              🧩 עיצוב של מסכי שגיאה, מסכים ריקים ומקרי קצה — לכל מסך יפה יש עשרה אחים משעממים<br />
              📚 סדר בספריית הרכיבים — שכל כפתור באפליקציה ייראה אותו דבר<br />
              📝 תיעוד והעברה מסודרת למתכנתים — בלי זה, מה שייבנה לא יידמה למה שעיצבת<br />
              🔁 אותו מסך, עשר גרסאות — רוב היום הוא שיפורים קטנים, לא רעיונות גדולים
            </div>
          </RevealCard>

          <button onClick={() => go("intro")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white mt-2"
            style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
            הבנתי — קדימה לבעיה האמיתית ←
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
          <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            יום שלישי, 09:15. את מעצבת המוצר של "משלוח מהיר" — אפליקציה שמביאה קניות מהסופר עד הבית.
          </div>

          <div className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2" dir="rtl"
            style={{ background: "rgba(219,39,119,0.06)", border: "1px solid rgba(219,39,119,0.15)" }}>
            <span style={{ fontSize: 14 }}>🎨</span>
            <span className="text-[11.5px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>מעצבת מוצר</strong> = מי שמחליטה איך נראה כל מסך ומה קורה בכל לחיצה —
              כדי שאנשים יצליחו לעשות מה שבאו לעשות, בלי לחשוב.
            </span>
          </div>

          {/* ההודעה ממנהלת המוצר */}
          <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]" style={{ background: "rgba(219,39,119,0.12)" }}>👩‍💼</div>
              <div>
                <div className="text-[12px] font-black" style={{ color: NAVY }}>נועה · מנהלת המוצר</div>
                <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>הודעה חדשה · 09:12</div>
              </div>
            </div>
            <div className="rounded-xl px-3.5 py-3 text-[12.5px] leading-[1.7]" style={{ background: "rgba(219,39,119,0.05)", color: "rgba(0,0,0,0.7)" }}>
              "בוקר טוב 🙏 יש לנו בעיה: אלפי אנשים מורידים את האפליקציה — אבל רק שלושה מתוך עשרה
              מסיימים הרשמה. כל השאר נעלמים באמצע. תוכלי לבדוק מה קורה שם?"
            </div>
          </div>

          {/* האנלוגיה ממשיכה */}
          <div className="rounded-2xl p-4 mb-4 text-[13px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(219,39,119,0.06)", border: "1px solid rgba(219,39,119,0.15)" }}>
            🛒 תחשבי על זה כמו חנות: פתחנו חנות חדשה, אנשים נכנסים בהמוניהם —
            <span className="font-bold" style={{ color: NAVY }}> ורובם יוצאים בלי להגיע לקופה.</span>{" "}
            משהו בסידור של החנות עוצר אותם. העבודה שלנו: לגלות איפה, להבין למה, ולתקן.
          </div>

          {/* הכלים */}
          <div className="rounded-xl p-4 mb-5" dir="rtl" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-bold mb-2" style={{ color: NAVY }}>🛠️ הכלים שישמשו אותנו היום</div>
            <div className="flex flex-col gap-1.5">
              {[
                { tool: "מפת נטישה", desc: "מספרים שמראים באיזה שלב אנשים עוזבים" },
                { tool: "צפייה במשתמשים", desc: "יושבים ליד אנשים אמיתיים ורואים איפה הם נתקעים" },
                { tool: "תיקון ומדידה", desc: "משנים משהו קטן — ובודקים אם המספר השתפר" },
              ].map(({ tool, desc }) => (
                <div key={tool} className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded"
                    style={{ background: "rgba(219,39,119,0.1)", color: PINK }}>{tool}</span>
                  <span className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.6)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => go("funnel")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
            פתחי את מפת הנטישה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Funnel — קריאת מפת הנטישה ──────────────────────────────────────────────
  if (phase === "funnel") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>שלב א׳ — איפה אנשים עוזבים?</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            לפני שמתקנים — מודדים. זו מפת הנטישה של מסך ההרשמה: כמה אנשים
            <strong> עברו</strong> כל שלב, מתוך אלף שהתחילו. כמו לספור כמה לקוחות מגיעים לכל מעבר בחנות.
          </div>

          <div className="rounded-xl p-3.5 mb-4" dir="rtl" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>הכלל:</strong> ירידה הדרגתית בין שלבים היא טבעית.
              <strong> צניחה חדה בשלב אחד</strong> — שם קבור משהו. מחפשים את המדרגה הכי גדולה.
            </div>
          </div>

          <FunnelMap />

          <GlossaryRow terms={[
            { term: "נטישה", explanation: "כשמישהו מתחיל תהליך — ועוזב באמצע בלי לסיים. באנגלית: Drop-off. הנטישה היא לא כישלון של המשתמש — היא איתות שמשהו במסך עצר אותו." },
            { term: "מפת נטישה", explanation: <span>מדידה של כמה אנשים שורדים כל שלב בתהליך. באנגלית קוראים לזה Funnel — משפך: נכנסים הרבה, יוצאים מעט. כמו לספור כמה לקוחות שנכנסו לחנות הגיעו בסוף לקופה.</span> },
          ]} />

          <Question
            q="תסתכלי על המספרים. איפה הבעיה הכי גדולה?"
            options={[
              "במסך הפתיחה — 15% עזבו כבר בהתחלה",
              "בשדה מספר הטלפון — 60% מהאנשים שהגיעו אליו עזבו",
              "אין בעיה — אנשים פשוט לא אוהבים אפליקציות משלוחים",
            ]}
            correct={1}
            okMsg="✓ בדיוק. ירידה של 15% בהתחלה זה טבעי — אבל 60% שעוזבים בשדה אחד? זה לא מקרה. משהו בשדה הזה עוצר אנשים, ואנחנו הולכות לגלות מה."
            errMsg="✗ תסתכלי על גודל המדרגות: מ-850 ל-340 בשדה הטלפון — 60% עזבו בנקודה אחת. זו הצניחה החדה, ושם מחפשים."
            onAnswer={ok => answer(ok)}
            nextLabel="בואי נגלה למה ←"
            onNext={() => go("why")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Why — צפייה במשתמשים וגילוי הסיבות ─────────────────────────────────────
  if (phase === "why") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ב׳ — למה הם עוזבים?</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            המספרים אמרו <strong>איפה</strong>. עכשיו צריך לגלות <strong>למה</strong> —
            ובשביל זה יושבים ליד אנשים אמיתיים וצופים בהם מנסים להירשם. זה המסך שהם רואים:
          </div>

          <div className="flex justify-center mb-5">
            <BeforeScreen />
          </div>

          {/* ממצאי הצפייה */}
          <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="text-[12px] font-black mb-3" style={{ color: NAVY }}>👥 צפינו בחמישה אנשים מנסים להירשם. הנה מה שראינו:</div>
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: "⌨️", text: "לוחצים על שדה הטלפון — וקופצת מקלדת אותיות. צריך לחפש לבד איך לעבור למספרים. שניים התייאשו כבר כאן." },
                { emoji: "🤨", text: "\"למה בכלל צריכים את הטלפון שלי?\" — אין שום הסבר ליד השדה. אנשים חוששים מספאם ושיחות שיווק, אז הם סוגרים." },
                { emoji: "😮‍💨", text: "חמישה שדות חובה לפני שרואים בכלל את החנות — אימייל, כתובת, תאריך לידה. \"כל זה רק בשביל להזמין חלב?\"" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[16px] shrink-0 mt-0.5">{item.emoji}</span>
                  <span className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.68)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* אנלוגיה */}
          <div className="rounded-xl p-3.5 mb-4 text-[12px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(219,39,119,0.06)", border: "1px solid rgba(219,39,119,0.15)" }}>
            🛒 במונחי החנות שלנו: הלקוח מצא את מקרר החלב — אבל המקרר נעול,
            תלוי עליו טופס בן חמישה סעיפים, ואף אחד לא טרח להסביר למה.
            <strong style={{ color: NAVY }}> רוב האנשים לא מתלוננים. הם פשוט יוצאים.</strong>
          </div>

          <GlossaryRow terms={[
            { term: "מיקרו-קופי", explanation: "המילים הקטנות במסך — שורת הסבר מתחת לשדה, טקסט על כפתור, הודעת שגיאה. באנגלית: Microcopy. משפט אחד נכון במקום הנכון יכול להציל אלפי הרשמות — כמו שלט קטן ומדויק בחנות." },
            { term: "היררכיה", explanation: "סדר החשיבות במסך: מה מבקשים קודם, מה אחר כך, ומה בכלל לא עכשיו. הכלל: לשאול רק מה שחייבים ברגע הזה — ולדחות את השאר לרגע שבו זה באמת נדרש." },
          ]} />

          <Question
            q="יש לנו שלושה ממצאים. מה עושה מעצבת מוצר עכשיו?"
            options={[
              "מתקנת בשלוש החלטות קטנות וממוקדות — ואז מודדת שוב",
              "מעצבת מחדש את כל האפליקציה מאפס — הכל שבור",
              "מוחקת את שדה הטלפון לגמרי — הוא רק מפריע",
            ]}
            correct={0}
            okMsg="✓ נכון. שינויים קטנים וממוקדים — כי אז יודעים בדיוק מה עבד. עיצוב מחדש מאפס לוקח חודשים, ואת הטלפון אי אפשר למחוק: השליח חייב להתקשר כשהוא מגיע."
            errMsg="✗ עיצוב מאפס לוקח חודשים ולא נדע מה עבד. ולמחוק את הטלפון אי אפשר — השליח חייב להתקשר כשהוא מגיע. הדרך: שלוש החלטות קטנות, ואז למדוד שוב."
            onAnswer={ok => answer(ok)}
            nextLabel="להחלטה הראשונה ←"
            onNext={() => go("fix-keyboard")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Fix 1 — המקלדת ─────────────────────────────────────────────────────────
  if (phase === "fix-keyboard") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 1 מתוך 3 — המקלדת</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            הממצא הראשון: לוחצים על שדה הטלפון — וקופצת מקלדת אותיות.
            נשמע קטן? שניים מתוך חמישה נעצרו בדיוק כאן.
          </div>

          <div className="rounded-xl p-3.5 mb-4" dir="rtl" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>הכלל:</strong> כל פעולה מיותרת שאת מבקשת מהמשתמש — חלק מהאנשים יעזבו בגללה.
              המסך צריך לעבוד בשביל המשתמש, לא להפך.
            </div>
          </div>

          <Question
            q="מה עושים עם המקלדת בשדה הטלפון?"
            options={[
              "משאירים — כל אחד יודע לעבור למקלדת מספרים לבד",
              "מגדירים שבשדה הזה תיפתח אוטומטית מקלדת מספרים בלבד",
              "מוסיפים הודעה קופצת שמסבירה איך מחליפים מקלדת",
            ]}
            correct={1}
            okMsg="✓ בדיוק. שינוי של הגדרה אחת — והמקלדת הנכונה נפתחת מעצמה. המשתמש לא צריך ללמוד כלום. זה עיקרון מרכזי בעיצוב: לתקן את המסך, לא לחנך את המשתמש."
            errMsg={"✗ \"כל אחד יודע\" — הנתונים הראו אחרת. והודעה קופצת רק מוסיפה עוד מכשול. הפתרון: מקלדת מספרים שנפתחת מעצמה — המסך עובד בשביל המשתמש."}
            onAnswer={ok => answer(ok)}
            nextLabel="להחלטה השנייה ←"
            onNext={() => go("fix-copy")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Fix 2 — מיקרו-קופי ─────────────────────────────────────────────────────
  if (phase === "fix-copy") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 2 מתוך 3 — משפט אחד קטן</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            הממצא השני: אנשים לא מבינים למה מבקשים מהם טלפון — וחוששים.
            הפתרון הוא <strong>מיקרו-קופי</strong>: שורת הסבר קטנה מתחת לשדה. איזו שורה?
          </div>

          <div className="rounded-xl p-3.5 mb-4" dir="rtl" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>הכלל:</strong> מיקרו-קופי טוב עונה על השאלה שהמשתמש שואל בראש
              <em> בדיוק ברגע הזה</em> — במילים של בן אדם, לא של מערכת. כמו שלט "החלב במעבר 3" בכניסה לחנות.
            </div>
          </div>

          <Question
            q="איזו שורה תופיע מתחת לשדה הטלפון?"
            options={[
              "\"שדה חובה\"",
              "\"המספר ישמש אותנו לעדכונים ומבצעים\"",
              "\"כדי שהשליח יוכל להתקשר כשהוא מגיע אליך\"",
            ]}
            correct={2}
            okMsg={"✓ מושלם. המשפט הזה עונה בדיוק על החשש (\"למה צריכים את זה?\") ונותן סיבה שכל אחד מבין — השליח בדרך אליך. שבע מילים שמחזירות מאות נרשמים."}
            errMsg={"✗ \"שדה חובה\" מסביר שחייבים — לא למה. ו\"עדכונים ומבצעים\" זה בדיוק הספאם שאנשים מפחדים ממנו. המשפט הנכון עונה על החשש: השליח צריך להתקשר כשהוא מגיע."}
            onAnswer={ok => answer(ok)}
            nextLabel="להחלטה השלישית ←"
            onNext={() => go("fix-fields")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Fix 3 — היררכיה ────────────────────────────────────────────────────────
  if (phase === "fix-fields") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 3 מתוך 3 — כמה שדות באמת צריך?</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            הממצא השלישי: חמישה שדות חובה לפני שרואים בכלל את החנות.
            כאן נכנסת <strong>היררכיה</strong> — מה שואלים עכשיו, ומה דוחים לאחר כך.
          </div>

          <div className="rounded-xl p-3.5 mb-4 text-[12px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(219,39,119,0.06)", border: "1px solid rgba(219,39,119,0.15)" }}>
            🛒 במונחי החנות: אף חנות לא עוצרת אותך בכניסה כדי למלא טופס עם תאריך הלידה שלך.
            קודם נותנים לך להגיע למדף — <strong style={{ color: NAVY }}>את הכתובת שואלים בקופה, כשזה באמת נחוץ.</strong>
          </div>

          <Question
            q="מה עושים עם חמשת השדות בהרשמה?"
            options={[
              "משאירים את כולם — כל פרט מידע שווה כסף לחברה",
              "משאירים רק שם וטלפון עכשיו — כתובת שואלים בהזמנה הראשונה, ואת השאר מוותרים",
              "מוחקים הכל — שיירשמו רק עם כפתור, בלי שום פרטים",
            ]}
            correct={1}
            okMsg="✓ בדיוק. שואלים עכשיו רק מה שחייבים כדי להתחיל — שם וטלפון. כתובת? בהזמנה הראשונה, כשברור למה. תאריך לידה? מוותרים. כל שדה שנדחה = פחות נטישה."
            errMsg="✗ כל שדה נוסף עולה בנרשמים — והחברה מרוויחה יותר מלקוח נרשם מאשר מתאריך לידה. אבל בלי כלום גם אי אפשר: השליח צריך שם וטלפון. האיזון: לשאול עכשיו רק מה שחיוני."
            onAnswer={ok => answer(ok)}
            nextLabel="בואי נראה את התוצאה ←"
            onNext={() => go("after")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── After — לפני/אחרי והמספר שהשתפר ────────────────────────────────────────
  if (phase === "after") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>שלב אחרון — מודדים שוב</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            שלוש ההחלטות עלו לאוויר. ככה נראה המסך לפני — וככה אחרי:
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <BeforeScreen />
            <AfterScreen />
          </div>

          <div className="text-[13px] leading-[1.7] mb-3" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            שבועיים אחרי — פותחים שוב את מפת הנטישה:
          </div>

          <FunnelMap improved />

          <div className="rounded-2xl p-4 mb-4" dir="rtl"
            style={{ background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.25)" }}>
            <div className="text-[13px] font-black mb-2" style={{ color: "#15803d" }}>📈 מה השתנה במספרים</div>
            <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.68)" }}>
              הנטישה בשדה הטלפון ירדה <strong>מ-60% ל-18%</strong>.
              מספר האנשים שמסיימים הרשמה קפץ <strong>מ-320 ל-660 מכל אלף</strong> — יותר מכפול.
              בלי לעצב מחדש את האפליקציה, בלי קמפיין פרסום — שלוש החלטות קטנות בסידור של "החנות".
            </div>
          </div>

          <div className="rounded-xl p-3.5 mb-5" dir="rtl" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>וזה כל התפקיד בתמצית:</strong>{" "}
              מדדנו ← צפינו באנשים ← הבנו למה ← תיקנו בקטן ← מדדנו שוב.
              לא השראה פתאומית, לא כישרון ציור — <strong>שיטה</strong>.
            </div>
          </div>

          <button onClick={() => go("done")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
            לסיכום ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {Header}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-8 pb-32 text-center">
        <div className="text-[52px] mb-3">🎨</div>
        <div className="text-[24px] leading-tight mb-2" style={{ color: NAVY, ...HEEBO }}>
          עברת יום שלם בחיי מעצבת מוצר
        </div>
        <div className="text-[13px] leading-[1.7] mb-6" dir="rtl" style={{ color: "rgba(0,0,0,0.55)" }}>
          קראת מפת נטישה, צפית במשתמשים, וקיבלת שלוש החלטות עיצוב שהכפילו את מספר הנרשמים.
          {score > 0 && <span> צברת {score} נקודות בדרך.</span>}
        </div>

        <div className="rounded-2xl p-4 mb-6 text-right" dir="rtl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="text-[12px] font-black mb-2.5" style={{ color: NAVY }}>מה לקחת מהיום הזה:</div>
          {[
            "המשתמש אף פעם לא אשם — הסידור אשם. כמו חנות שבה לא מוצאים את החלב.",
            "מודדים לפני שמתקנים, ומודדים שוב אחרי. עיצוב הוא שיטה, לא ניחוש.",
            "שינויים קטנים מזיזים מספרים גדולים: מקלדת נכונה, משפט אחד, שדות שנדחו.",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
              <span style={{ color: "#16a34a" }}>✓</span>
              <span className="text-[12.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>{t}</span>
            </div>
          ))}
        </div>

        <Link href="/explore/ux/learn/mystery"
          className="block w-full py-[14px] rounded-xl font-bold text-[15px] text-white mb-3"
          style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
          להמשך — מיני-פרויקט: עצבי מסך בעצמך ←
        </Link>
        <Link href="/explore/ux"
          className="block w-full py-[13px] rounded-xl font-bold text-[14px]"
          style={{ border: `1.5px solid ${PINK}`, color: PINK, fontFamily: "'Heebo', sans-serif" }}>
          מיציתי את הטעימה — חזרה למפת התחום
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
