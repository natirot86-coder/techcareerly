"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Types ────────────────────────────────────────────────────────────────────

type StepData = {
  tag: string;
  context: React.ReactNode;
  question: string;
  options: string[];
  correct: number;
  okMsg: string;
  errMsg: string;
  conceptTag: string;
};

// ─── STEP 0 — מטאפורה, ללא קוד, win מובטח ──────────────────────────────────

const S0: StepData = {
  tag: "מושג ראשון",
  context: (
    <div>
      <p className="text-[14px] leading-[1.7] mb-5" style={{ color: "rgba(0,0,0,0.62)" }}>
        לפני שנגע בקוד — שאלה אחת מהחיים.
        <br />
        <span className="font-bold" style={{ color: "#023e8a" }}>
          מה הכי דומה לפונקציה לדעתך?
        </span>
      </p>
      <div className="flex gap-2 mb-5">
        {[
          { icon: "📖", name: "ספר", desc: "קוראים — הוא לא משתנה" },
          { icon: "🥤", name: "מכונת שייק", desc: "חומרים פנימה → שתיה החוצה" },
          { icon: "🕐", name: "שעון", desc: "מראה שעה בלי לייצר כלום" },
        ].map((item) => (
          <div
            key={item.name}
            className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.13)" }}
          >
            <div className="text-[28px]">{item.icon}</div>
            <div className="text-[10.5px] font-bold mt-1" style={{ color: "#1e3a8a" }}>{item.name}</div>
            <div className="text-[9.5px] mt-[3px] leading-[1.4]" style={{ color: "rgba(0,0,0,0.38)" }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "איזה אחד?",
  options: ["📖 ספר", "🥤 מכונת שייק", "🕐 שעון"],
  correct: 1,
  okMsg: "בדיוק! פונקציה מקבלת 'חומרים' (קלט) → מעבדת → מחזירה תוצאה. אותו עיקרון של שייק — תמיד.",
  errMsg: "מכונת השייק היא התשובה. שמים פנימה, יוצא משהו חדש — פונקציה עובדת בדיוק ככה.",
  conceptTag: "פונקציה = קלט → עיבוד → פלט",
};

// ─── STEP 1 — הגיון בלי קוד ──────────────────────────────────────────────────

const S1: StepData = {
  tag: "הגיון פשוט",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.65] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        את עובדת על אפליקציה. כשמישהי נרשמת, היא צריכה לקבל ברכה בשמה.
        <br />
        <span className="font-bold" style={{ color: "#023e8a" }}>יש לך רשימה:</span>
      </p>
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        {[
          { input: "נועה", output: "שלום, נועה!" },
          { input: "מיכל", output: "שלום, מיכל!" },
          { input: "שרה", output: "שלום, שרה!" },
        ].map((row) => (
          <div key={row.input} className="flex items-center gap-2 mb-3 last:mb-0">
            <span
              className="text-[12.5px] font-bold px-3 py-[5px] rounded-lg bg-white shrink-0"
              style={{ color: "#023e8a", border: "1px solid rgba(2,62,138,0.14)" }}
            >
              {row.input}
            </span>
            <span className="text-[13px]" style={{ color: "rgba(0,0,0,0.22)" }}>→</span>
            <span
              className="text-[12.5px] font-bold px-3 py-[5px] rounded-lg shrink-0"
              style={{ background: "#3b82f6", color: "#fff" }}
            >
              ?
            </span>
            <span className="text-[13px]" style={{ color: "rgba(0,0,0,0.22)" }}>→</span>
            <span className="text-[12px]" style={{ color: "rgba(0,0,0,0.55)" }}>{row.output}</span>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "מה ה-? עושה בפועל?",
  options: [
    "שומרת את השם בקובץ",
    "לוקחת שם, מחברת לברכה, מחזירה תוצאה",
    "בודקת אם השם רשום במערכת",
  ],
  correct: 1,
  okMsg: "נכון! ובלי לדעת מה השם מראש — זה הקסם. אותה לוגיקה לנועה, למיכל, לשרה — ולמיליון משתמשות.",
  errMsg: 'לוקחת שם, מחברת לברכה, מחזירה תוצאה — זה בדיוק מה שה-? עושה. שמת לב? אותה נוסחה לכל שם.',
  conceptTag: "אותה לוגיקה לכל קלט — זה כוח הקוד",
};

// ─── STEP 2 — קוד ראשון ───────────────────────────────────────────────────────

const S2: StepData = {
  tag: "קוד ראשון",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.65] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        זה הקוד שמפתחת כתבה בשביל מה שתיארת.
        <br />
        <span className="font-bold" style={{ color: "#023e8a" }}>קראי לאט — כל מילה אומרת משהו:</span>
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}
      >
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.1]" style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
          <div>
            <span style={{ color: "#a78bfa" }}>def</span>
            <span> greet(</span>
            <span style={{ color: "#60a5fa" }}>name</span>
            <span>):</span>
          </div>
          <div>
            {"  "}
            <span style={{ color: "#a78bfa" }}>return</span>
            <span> </span>
            <span style={{ color: "#34d399" }}>"שלום, "</span>
            <span> + </span>
            <span style={{ color: "#60a5fa" }}>name</span>
            <span> + </span>
            <span style={{ color: "#34d399" }}>"!"</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[6px] mb-5">
        {[
          { word: "def", meaning: "מגדירה פונקציה חדשה" },
          { word: "name", meaning: "המשתנה — יקבל ערך בכל קריאה" },
          { word: "return", meaning: "מחזירה את התוצאה" },
        ].map((item) => (
          <div key={item.word} className="flex items-center gap-2">
            <span
              className="font-mono text-[11px] font-bold px-2 py-[3px] rounded shrink-0"
              style={{ background: "#1e3a8a", color: "#93c5fd" }}
            >
              {item.word}
            </span>
            <span className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>= {item.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  ),
  question: 'מה יופיע אחרי: greet("נועה")?',
  options: ['"שלום, נועה!"', '"שלום, name!"', '"greet(נועה)"'],
  correct: 0,
  okMsg: 'נכון! `name` מוחלף ב-"נועה" — והפונקציה מחזירה "שלום, נועה!". בדיוק כך ה-SMS מהבנק יודע לקרוא לך בשם.',
  errMsg: '"שלום, נועה!" — `name` מקבל את הערך האמיתי. זה נקרא משתנה. הוא כמו תא ריק שמקבל תוכן בכל קריאה.',
  conceptTag: "`def`, `name`, `return` — 3 מילות הבסיס",
};

// ─── STEP 3 — ציד הבאג ───────────────────────────────────────────────────────

const S3: StepData = {
  tag: "ציד הבאג",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
      >
        <span className="text-[20px] shrink-0">🚨</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#b91c1c" }}>דיווח דחוף מהלקוחה</div>
          <div className="text-[12px] mt-[2px]" style={{ color: "rgba(0,0,0,0.58)" }}>
            "האפליקציה קרסה — כולם מתלוננים!"
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.65] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        הנה הקוד שנשלח לפרודקשן.
        <br />
        <span className="font-bold" style={{ color: "#023e8a" }}>משהו לא בסדר — מצאי:</span>
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.18)" }}
      >
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.1]" style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
          <div>
            <span style={{ color: "#a78bfa" }}>def</span>
            <span> greet(</span>
            <span style={{ color: "#60a5fa" }}>name</span>
            <span>):</span>
          </div>
          <div>
            {"  "}
            <span style={{ color: "#a78bfa" }}>return</span>
            <span> </span>
            <span style={{ color: "#34d399" }}>"שלום, "</span>
            <span> + </span>
            {/* The bug — capital N, highlighted */}
            <span
              style={{
                color: "#f87171",
                fontWeight: 700,
                background: "rgba(248,113,113,0.18)",
                borderRadius: 4,
                padding: "0 2px",
              }}
            >
              Name
            </span>
            <span> + </span>
            <span style={{ color: "#34d399" }}>"!"</span>
          </div>
        </div>
      </div>
    </div>
  ),
  question: "מה גרם לקריסה?",
  options: [
    "חסר פסיק אחרי המילה 'שלום'",
    "`Name` עם N גדולה — שונה מ-`name`",
    "צריך להוסיף ! בסוף הפונקציה",
  ],
  correct: 1,
  okMsg: "מעולה! Python רגיש לאותיות — `name` ו-`Name` הם שני דברים שונים לחלוטין. הבאג הזה הפיל את האפליקציה. מציאתו חסכה שעות של תמיכה.",
  errMsg: "`Name` עם N גדולה — זה הבאג. Python רגיש לאותיות גדולות/קטנות (case-sensitive). `name` ≠ `Name`. אחד הבאגים הנפוצים ביותר.",
  conceptTag: "קוד רגיש לאותיות — case-sensitive",
};

const STEPS: StepData[] = [S0, S1, S2, S3];

// ─── Result ───────────────────────────────────────────────────────────────────

function ResultScreen({ score }: { score: number }) {
  const great = score >= 3;
  const concepts = [S0, S1, S2, S3].map((s) => s.conceptTag);

  return (
    <div className="px-[22px] pt-7 pb-36">
      <div className="text-center mb-7">
        <div className="text-[52px] mb-3">{great ? "🎯" : "💪"}</div>
        <div className="text-[26px] leading-tight" style={{ color: "#023e8a", ...HEEBO }}>
          {great ? "חשבת כמו מפתחת!" : "התחלת לחשוב כמו מפתחת!"}
        </div>
        <div className="text-[13px] mt-2" style={{ color: "rgba(0,0,0,0.42)" }}>
          {score} מתוך 4 נכון · פיתוח תוכנה
        </div>
      </div>

      {/* Concepts */}
      <div className="mb-6">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "rgba(0,0,0,0.32)" }}
        >
          מה למדת היום
        </div>
        <div className="flex flex-col gap-2">
          {concepts.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.14)" }}
            >
              <span className="text-[15px] shrink-0" style={{ color: "#3b82f6" }}>✓</span>
              <span className="text-[12.5px]" style={{ color: "#1e3a8a" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wow */}
      <div
        className="mb-7 rounded-2xl p-4"
        style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.22)" }}
      >
        <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
          הפונקציה שכתבת היום — זהה למה שמפתחות ב-
          <span className="font-bold" style={{ color: "#023e8a" }}>Wix, Monday ו-Fiverr</span>
          {" "}כותבות. אותו עיקרון, בסקייל של מיליוני משתמשים.
        </div>
      </div>

      <Link
        href="/explore"
        className="block w-full text-center py-[14px] rounded-xl text-white font-bold text-[15px]"
        style={{ background: "#fb8500", fontFamily: "'Heebo', sans-serif" }}
      >
        המשך במסלול ←
      </Link>
    </div>
  );
}

// ─── Sim flow ─────────────────────────────────────────────────────────────────

function SimFlow({ onComplete }: { onComplete: (score: number) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const step = STEPS[stepIndex];
  const revealed = selected !== null;
  const isCorrect = selected === step.correct;

  function handleSelect(i: number) {
    if (revealed) return;
    setSelected(i);
    if (i === step.correct) setScore((s) => s + 1);
  }

  function handleNext() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((s) => s + 1);
      setSelected(null);
    } else {
      onComplete(score + (isCorrect ? 0 : 0)); // score already accumulated
      onComplete(score);
    }
  }

  return (
    <div className="pb-4">
      {/* Progress pills */}
      <div className="flex items-center justify-center gap-[6px] py-5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              height: 7,
              width: i === stepIndex ? 24 : 7,
              background:
                i < stepIndex
                  ? "#3b82f6"
                  : i === stepIndex
                  ? "#3b82f6"
                  : "rgba(59,130,246,0.2)",
            }}
          />
        ))}
      </div>

      {/* Step tag */}
      <div className="px-[22px] mb-4">
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-[10px] py-[4px] rounded-full"
          style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
        >
          {step.tag} · {stepIndex + 1} / {STEPS.length}
        </span>
      </div>

      {/* Context */}
      <div className="px-[22px]">{step.context}</div>

      {/* Question */}
      <div className="px-[22px] mb-4">
        <div className="text-[15.5px] font-bold" style={{ color: "#023e8a", ...HEEBO }}>
          {step.question}
        </div>
      </div>

      {/* Options */}
      <div className="px-[22px] flex flex-col gap-[9px] mb-4">
        {step.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOpt = i === step.correct;

          let bg = "#fff";
          let border = "rgba(0,0,0,0.08)";
          let color = "rgba(0,0,0,0.68)";
          let suffix: React.ReactNode = null;

          if (revealed) {
            if (isCorrectOpt) {
              bg = "rgba(34,197,94,0.08)";
              border = "#22c55e55";
              color = "#15803d";
              suffix = <span className="text-[16px] shrink-0">✓</span>;
            } else if (isSelected) {
              bg = "rgba(220,38,38,0.07)";
              border = "#dc262644";
              color = "#b91c1c";
              suffix = <span className="text-[16px] shrink-0">✗</span>;
            } else {
              color = "rgba(0,0,0,0.32)";
            }
          } else if (isSelected) {
            bg = "rgba(59,130,246,0.08)";
            border = "#3b82f6";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => handleSelect(i)}
              className="text-right w-full"
            >
              <div
                className="rounded-xl px-4 py-[14px] flex items-center gap-3 transition-all duration-150"
                style={{ background: bg, border: `1.5px solid ${border}` }}
              >
                <span className="text-[13.5px] flex-1 leading-[1.45]" style={{ color }}>
                  {opt}
                </span>
                {suffix}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {revealed && (
        <div className="px-[22px]">
          <div
            className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-3"
            style={{
              background: isCorrect ? "rgba(34,197,94,0.07)" : "rgba(59,130,246,0.07)",
              border: `1px solid ${isCorrect ? "#22c55e44" : "#3b82f644"}`,
              color: isCorrect ? "#15803d" : "#1e40af",
            }}
          >
            {isCorrect ? step.okMsg : step.errMsg}
          </div>

          {/* What you learned */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.32)" }}>למדת:</span>
            <span
              className="text-[11px] font-bold px-[10px] py-[4px] rounded-full"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
            >
              {step.conceptTag}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px] mb-4"
            style={{ background: "#023e8a", fontFamily: "'Heebo', sans-serif" }}
          >
            {stepIndex < STEPS.length - 1 ? "הבא ←" : "סיימתי — תראי לי תוצאות"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SimPage() {
  const { domain } = useParams();
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  function handleComplete(s: number) {
    setScore(s);
    setDone(true);
  }

  // Other domains — not built yet
  if (domain !== "code") {
    return (
      <div className="flex justify-center min-h-screen" style={{ background: "#f2ede6" }}>
        <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col items-center justify-center gap-4 px-8">
          <div className="text-[40px]">🚧</div>
          <div className="text-[16px] font-bold text-navy text-center" style={HEEBO}>
            הסימולציה הזו בפיתוח
          </div>
          <div className="text-[13px] text-center" style={{ color: "rgba(0,0,0,0.45)" }}>
            בינתיים אפשר לנסות את סימולציית פיתוח התוכנה
          </div>
          <Link
            href={`/explore/${domain}`}
            className="mt-2 text-[13px] font-bold"
            style={{ color: "#023e8a" }}
          >
            ← חזרה לתחום
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen" style={{ background: "#f2ede6" }}>
      <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">

        {/* Header */}
        <div className="bg-navy text-white px-[22px] pt-[26px] pb-[30px] shrink-0">
          <Link
            href={`/explore/${domain}`}
            className="text-[12px] font-bold block mb-5"
            style={{ opacity: 0.6 }}
          >
            ← חזרה לתחום
          </Link>
          <div className="text-[28px] leading-tight" style={HEEBO}>
            {done ? "סיימת!" : "סימולציה"}
          </div>
          <div className="text-[13px] mt-[6px]" style={{ opacity: 0.72 }}>
            פיתוח תוכנה · 4 שלבים
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {done ? (
            <ResultScreen score={score} />
          ) : (
            <SimFlow onComplete={handleComplete} />
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
