"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";

const TEAL   = "#0d9488";
const NAVY   = "#023e8a";
const ORANGE = "#fb8500";
const HEEBO  = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Question definitions ─────────────────────────────────────────────────────

type Construct = "interest" | "efficacy" | "outcome";

interface Question {
  id: string;
  construct: Construct;
  constructLabel: string;
  constructColor: string;
  constructEmoji: string;
  type: "scale" | "open";
  question: string;
  hint: string;
}

const QUESTIONS: Question[] = [
  {
    id: "interest_scale",
    construct: "interest",
    constructLabel: "עניין",
    constructColor: TEAL,
    constructEmoji: "🌟",
    type: "scale",
    question: "בסולם 1–5 — כמה התחום הזה מדבר אליך?",
    hint: "1 = ממש לא מרגישה חיבור · 5 = מאוד מדבר אליי",
  },
  {
    id: "interest_open",
    construct: "interest",
    constructLabel: "עניין",
    constructColor: TEAL,
    constructEmoji: "🌟",
    type: "open",
    question: "האם היה רגע שבו משהו הדליק אותך? מה היה זה?",
    hint: "אפשר לכתוב גם 'לא היה' — חשובה הכנות",
  },
  {
    id: "efficacy_scale",
    construct: "efficacy",
    constructLabel: "ביטחון",
    constructColor: ORANGE,
    constructEmoji: "💪",
    type: "scale",
    question: "בסולם 1–5 — כמה הרגשת שאת יכולה ללמוד ולהצליח בדאטה?",
    hint: "1 = ממש לא בטוחה · 5 = כן, בהחלט יכולה",
  },
  {
    id: "efficacy_open",
    construct: "efficacy",
    constructLabel: "ביטחון",
    constructColor: ORANGE,
    constructEmoji: "💪",
    type: "open",
    question: "כשנתקלת בדבר קשה — רצית לברוח או לחפור?",
    hint: "אין תשובה נכונה — ספרי מה הרגשת באמת",
  },
  {
    id: "outcome_open",
    construct: "outcome",
    constructLabel: "עתיד",
    constructColor: NAVY,
    constructEmoji: "🔭",
    type: "open",
    question: "דמייני את עצמך 3 שנים קדימה — בוקר של יום עבודה. מה ההרגשה?",
    hint: "כתבי 2-3 משפטים — מה רואים, מה מרגישים",
  },
  {
    id: "outcome_scale",
    construct: "outcome",
    constructLabel: "עתיד",
    constructColor: NAVY,
    constructEmoji: "🔭",
    type: "scale",
    question: "בסולם 1–5 — כמה את מדמיינת את עצמך מאושרת ומצליחה בתחום?",
    hint: "1 = לא מדמיינת בכלל · 5 = ברורה לי מאוד התמונה",
  },
];

const SCALE_EMOJIS = ["", "😐", "🙂", "😊", "😄", "🤩"];
const SCALE_LABELS = ["", "כלל לא", "קצת", "בסדר", "טוב", "ממש כן!"];

type Answers = Record<string, string | number>;

// ─── Scale Question Component ─────────────────────────────────────────────────

function ScaleQuestion({ q, onAnswer }: { q: Question; onAnswer: (val: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      <div className="flex flex-col gap-2.5 mb-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setSelected(n)}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all text-right w-full"
            style={{
              background: selected === n ? `${q.constructColor}12` : "#fff",
              border: `2px solid ${selected === n ? q.constructColor : "rgba(0,0,0,0.08)"}`,
              boxShadow: selected === n ? `0 2px 12px ${q.constructColor}22` : "none",
            }}
          >
            <span className="text-[26px] shrink-0">{SCALE_EMOJIS[n]}</span>
            <div className="flex-1 text-right">
              <span
                className="text-[14px] font-bold"
                style={{ color: selected === n ? q.constructColor : "#023e8a" }}
              >
                {n} — {SCALE_LABELS[n]}
              </span>
            </div>
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              style={{
                borderColor: selected === n ? q.constructColor : "rgba(0,0,0,0.15)",
                background: selected === n ? q.constructColor : "transparent",
              }}
            >
              {selected === n && (
                <span className="text-white text-[10px] font-black">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => selected !== null && onAnswer(selected)}
        disabled={selected === null}
        className="w-full py-4 rounded-xl font-black text-[15px] text-white transition-all"
        style={{
          background: selected !== null ? q.constructColor : "rgba(0,0,0,0.12)",
          fontFamily: "'Heebo', sans-serif",
          cursor: selected !== null ? "pointer" : "not-allowed",
        }}
      >
        {selected !== null ? "המשיכי ←" : "בחרי קודם"}
      </button>
    </div>
  );
}

// ─── Open Question Component ──────────────────────────────────────────────────

function OpenQuestion({ q, onAnswer }: { q: Question; onAnswer: (val: string) => void }) {
  const [text, setText] = useState("");

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={q.hint}
        rows={5}
        className="w-full rounded-2xl p-4 text-[14px] leading-relaxed resize-none outline-none"
        style={{
          background: "#fff",
          border: `2px solid ${text.length > 2 ? q.constructColor : "rgba(0,0,0,0.1)"}`,
          color: "#1a1a1a",
          fontFamily: "'Heebo', sans-serif",
          transition: "border-color 0.25s",
          boxShadow: text.length > 2 ? `0 2px 12px ${q.constructColor}18` : "none",
        }}
        dir="rtl"
      />
      <div className="text-right text-[11px] mt-1.5" style={{ color: "rgba(0,0,0,0.28)" }}>
        {text.length} תווים
      </div>
      <button
        onClick={() => onAnswer(text.trim() || "—")}
        disabled={text.trim().length < 2}
        className="w-full mt-4 py-4 rounded-xl font-black text-[15px] text-white transition-all"
        style={{
          background: text.trim().length >= 2 ? q.constructColor : "rgba(0,0,0,0.12)",
          fontFamily: "'Heebo', sans-serif",
          cursor: text.trim().length >= 2 ? "pointer" : "not-allowed",
        }}
      >
        {text.trim().length >= 2 ? "המשיכי ←" : "כתבי קודם"}
      </button>
    </div>
  );
}

// ─── Summary Component ────────────────────────────────────────────────────────

function Summary({ answers }: { answers: Answers }) {
  const interestScore  = (answers["interest_scale"]  as number) || 0;
  const efficacyScore  = (answers["efficacy_scale"]  as number) || 0;
  const outcomeScore   = (answers["outcome_scale"]   as number) || 0;

  const avg = (interestScore + efficacyScore + outcomeScore) / 3;

  const constructs = [
    {
      label: "עניין",
      score: interestScore,
      color: TEAL,
      emoji: "🌟",
      desc: "כמה התחום מדבר אלייך",
    },
    {
      label: "ביטחון",
      score: efficacyScore,
      color: ORANGE,
      emoji: "💪",
      desc: "כמה אמנת ביכולת שלך ללמוד",
    },
    {
      label: "עתיד",
      score: outcomeScore,
      color: NAVY,
      emoji: "🔭",
      desc: "כמה ברורה לך התמונה העתידית",
    },
  ];

  let headline = "";
  let subtext = "";
  let heroEmoji = "";

  if (avg >= 4) {
    heroEmoji = "🎯";
    headline = "יש לך חיבור אמיתי לדאטה";
    subtext =
      "שלושת הסימנים — עניין, ביטחון, ותמונה עתידית — נדלקו. זה דיוק נדיר. כדאי לשוחח עם הרכזת על מסלול דאטה מעמיק.";
  } else if (interestScore >= 4 && efficacyScore <= 2) {
    heroEmoji = "✨";
    headline = "יש עניין — הביטחון עוד יגיע";
    subtext =
      "את מרגישה חיבור לתחום, אבל עוד לא בטוחה ביכולת. זה בדיוק מה שמסלול לימודים טוב עושה — בונה את הביטחון צעד אחר צעד.";
  } else if (avg >= 2.5) {
    heroEmoji = "💡";
    headline = "יש ניצוץ — כדאי לעמיק";
    subtext =
      "ראית משהו מעניין. הטעימה הזו היא רק ההתחלה — עם ליווי נכון ניתן לפתח עניין לכיוון ממשי.";
  } else {
    heroEmoji = "🔍";
    headline = "הטעימה עשתה את שלה";
    subtext =
      "תחום הדאטה הוא רק אחד מהאפשרויות. הרכזת תעזור להבין מה מתאים לך יותר — לפעמים הכיוון הנכון נמצא בתחום אחר.";
  }

  return (
    <div className="px-[22px] pt-6 pb-32">
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="text-[52px] mb-3">{heroEmoji}</div>
        <div className="text-[24px] font-black leading-tight mb-2" style={{ color: NAVY, ...HEEBO }}>
          {headline}
        </div>
        <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.5)" }}>
          {subtext}
        </div>
      </div>

      {/* 3 Construct Bars — SCCT */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-5"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          3 עמודות ה-SCCT — Social Cognitive Career Theory
        </div>
        {constructs.map((c) => (
          <div key={c.label} className="mb-5 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[18px]">{c.emoji}</span>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: NAVY }}>
                    {c.label}
                  </div>
                  <div className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.35)" }}>
                    {c.desc}
                  </div>
                </div>
              </div>
              <div className="text-[18px] font-black" style={{ color: c.color, ...HEEBO }}>
                {c.score}<span className="text-[13px] font-bold opacity-40">/5</span>
              </div>
            </div>
            <div className="h-[10px] rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(c.score / 5) * 100}%`,
                  background: c.color,
                  transition: "width 1s ease-out",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Open answers recap */}
      <div className="mb-6">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          מה כתבת
        </div>
        {[
          { label: "מה הדליק אותך?", id: "interest_open" },
          { label: "לברוח או לחפור?", id: "efficacy_open" },
          { label: "3 שנים קדימה", id: "outcome_open" },
        ].map(({ label, id }) => {
          const a = answers[id] as string;
          return (
            <div
              key={id}
              className="mb-3 rounded-xl p-3.5"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <div className="text-[10.5px] font-bold mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>
                {label}
              </div>
              <div
                className="text-[12.5px] leading-relaxed"
                style={{ color: !a || a === "—" ? "rgba(0,0,0,0.25)" : "#1a1a1a", fontStyle: !a || a === "—" ? "italic" : "normal" }}
              >
                {!a || a === "—" ? "לא נכתב" : a}
              </div>
            </div>
          );
        })}
      </div>

      {/* What next */}
      <div
        className="rounded-2xl p-4 mb-7"
        style={{ background: `${ORANGE}08`, border: `1.5px solid ${ORANGE}25` }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: ORANGE }}
        >
          מה הלאה
        </div>
        <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
          הרכזת תראה את התוצאות האלה לפני הפגישה הבאה שלכן.{" "}
          <span className="font-bold" style={{ color: NAVY }}>
            יחד תבחרו את הכיוון הנכון.
          </span>
        </div>
      </div>

      <Link href="/explore">
        <button
          className="block w-full py-4 rounded-xl font-black text-[15px] text-white mb-3"
          style={{ background: NAVY, fontFamily: "'Heebo', sans-serif" }}
        >
          חזרה למסלול ←
        </button>
      </Link>
      <Link href="/explore/data">
        <button
          className="block w-full py-3.5 rounded-xl font-bold text-[14px]"
          style={{
            background: "transparent",
            border: "1.5px solid rgba(2,62,138,0.2)",
            color: NAVY,
            fontFamily: "'Heebo', sans-serif",
          }}
        >
          חזרה לדאטה
        </button>
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExperiencePage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const q = QUESTIONS[step];

  useEffect(() => {
    // Mark journey: experience started
    try {
      const journey = JSON.parse(localStorage.getItem("data-journey") || "{}");
      localStorage.setItem("data-journey", JSON.stringify({ ...journey, experience: true }));
    } catch {/* ignore */}
  }, []);

  function handleAnswer(val: string | number) {
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // All done — save to localStorage
      try {
        localStorage.setItem("data-experience", JSON.stringify(newAnswers));
        const journey = JSON.parse(localStorage.getItem("data-journey") || "{}");
        localStorage.setItem("data-journey", JSON.stringify({ ...journey, experience: true }));
      } catch {/* ignore */}
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen" style={{ background: "#fbf9f5" }} dir="rtl">
        <div className="text-white px-[22px] pt-[26px] pb-[30px]" style={{ background: NAVY }}>
          <div className="max-w-[720px] mx-auto">
            <div className="text-[12px] mb-2" style={{ opacity: 0.55 }}>
              כלי עיבוד החוויה · דאטה ואנליטיקס
            </div>
            <div className="text-[26px] font-black leading-tight" style={HEEBO}>
              הסיכום שלך ✓
            </div>
          </div>
        </div>
        <div className="max-w-[720px] mx-auto">
          <Summary answers={answers} />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Question screen ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#fbf9f5" }} dir="rtl">
      {/* Header */}
      <div
        className="text-white px-[22px] pt-[26px] pb-7"
        style={{ background: q.constructColor }}
      >
        <div className="max-w-[720px] mx-auto">
          <Link href="/explore/data/learn/mystery" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.75 }}>
            ← חזרה
          </Link>

          {/* Progress bar */}
          <div className="flex items-center gap-1.5 mb-6">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="h-[5px] flex-1 rounded-full transition-all duration-500"
                style={{
                  background: i < step ? "rgba(255,255,255,0.9)" : i === step ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>

          {/* Construct badge */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-[11px] font-bold"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <span>{q.constructEmoji}</span>
            <span>{q.constructLabel}</span>
            <span style={{ opacity: 0.65 }}>
              · שאלה {step + 1} מתוך {QUESTIONS.length}
            </span>
          </div>

          <div className="text-[21px] font-black leading-snug" style={HEEBO}>
            {q.question}
          </div>
        </div>
      </div>

      {/* Question body */}
      <div className="max-w-[720px] mx-auto px-[22px] pt-6 pb-36">
        {q.type === "scale" && (
          <div className="text-[12px] mb-5" style={{ color: "rgba(0,0,0,0.4)" }}>
            {q.hint}
          </div>
        )}

        {q.type === "scale" ? (
          <ScaleQuestion q={q} onAnswer={handleAnswer} />
        ) : (
          <OpenQuestion q={q} onAnswer={handleAnswer} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
