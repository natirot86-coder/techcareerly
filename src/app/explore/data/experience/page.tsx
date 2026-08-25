"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { ExperienceCTAs } from "@/components/ui/ExperienceCTAs";
import { saveScctScore, logEvent } from "@/lib/candidate";

const TEAL   = "#0d9488";
const NAVY   = "#023e8a";
const ORANGE = "#fb8500";
const HEEBO  = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

type Gender = "female" | "male";
type Phase =
  | "gender"
  | "interest_scale" | "interest_open"
  | "efficacy_scale"  | "efficacy_open"
  | "outcome_scale"   | "outcome_open"
  | "done";

const PHASE_ORDER: Phase[] = [
  "interest_scale", "interest_open",
  "efficacy_scale",  "efficacy_open",
  "outcome_scale",   "outcome_open",
];

// ─── Dynamic follow-up maps (score 1–5 → gender-aware question) ───────────────

const INTEREST_FOLLOWUPS: Record<number, (g: Gender) => string> = {
  1: () => "מה הרגשת? היה משהו שגרם לך להתנתק?",
  2: () => "היה רגע אחד קטן שמשך אותך — גם אם לא ידעת להסביר למה?",
  3: () => "מה עצר אותך מלתת יותר? מה חסר לך?",
  4: (g) => g === "female"
    ? "מה דווקא הדליק אותך? ספרי לי על הרגע הזה."
    : "מה דווקא הדליק אותך? ספר לי על הרגע הזה.",
  5: () => "וואו — מה בדיוק תפס אותך? מה הרגשת?",
};

const EFFICACY_FOLLOWUPS: Record<number, (g: Gender) => string> = {
  1: () => "מה גרם לך להרגיש ככה? היה משהו ספציפי שהקשה?",
  2: (g) => g === "female"
    ? "היה רגע שחשבת 'אולי אני יכולה'? גם קטן?"
    : "היה רגע שחשבת 'אולי אני יכול'? גם קטן?",
  3: (g) => g === "female"
    ? "מה לדעתך היה עוזר לך להרגיש יותר בטוחה בעצמך?"
    : "מה לדעתך היה עוזר לך להרגיש יותר בטוח בעצמך?",
  4: () => "מה נתן לך את הביטחון? מה הצלחת לעשות שהפתיע אותך?",
  5: (g) => g === "female"
    ? "מה הרגשת כשהיה 'קליק'? ספרי לי על הרגע הזה."
    : "מה הרגשת כשהיה 'קליק'? ספר לי על הרגע הזה.",
};

const OUTCOME_FOLLOWUPS: Record<number, (g: Gender) => string> = {
  1: () => "מה חוסם אותך מלדמיין את עצמך שם? מה נראה קשה מדי?",
  2: (g) => g === "female"
    ? "יש משהו אחד בתחום שאת כן יכולה לדמיין את עצמך עושה?"
    : "יש משהו אחד בתחום שאתה כן יכול לדמיין את עצמך עושה?",
  3: () => "מה עוצר את הדמיון? מה היה עוזר לך לראות את זה יותר ברור?",
  4: (g) => g === "female"
    ? "תארי לי — מה ראית בדמיון? מה הגרסה העתידית שלך עושה?"
    : "תאר לי — מה ראית בדמיון? מה הגרסה העתידית שלך עושה?",
  5: (g) => g === "female"
    ? "תארי לי את הרגע הזה — בוקר יום עבודה, 3 שנים קדימה. מה את עושה?"
    : "תאר לי את הרגע הזה — בוקר יום עבודה, 3 שנים קדימה. מה אתה עושה?",
};

// ─── Constructs config ────────────────────────────────────────────────────────

const CONSTRUCTS = [
  {
    id: "interest",
    label: "עניין",
    color: TEAL,
    emoji: "🌟",
    scaleQ: (_g: Gender) => "בסולם 1–5 — כמה התחום הזה מדבר אליך?",
    scaleHint: (g: Gender) => g === "female"
      ? "1 = כלל לא מרגישה חיבור · 5 = מאוד מדבר אליי"
      : "1 = כלל לא מרגיש חיבור · 5 = מאוד מדבר אליי",
    openHint: (_g: Gender) => "אפשר לכתוב גם 'לא היה' — חשובה הכנות",
    followUps: INTEREST_FOLLOWUPS,
    scalePhase: "interest_scale" as Phase,
    openPhase:  "interest_open"  as Phase,
    scaleKey: "interest_scale",
    openKey:  "interest_open",
  },
  {
    id: "efficacy",
    label: "ביטחון",
    color: ORANGE,
    emoji: "💪",
    scaleQ: (g: Gender) => g === "female"
      ? "בסולם 1–5 — כמה הרגשת שאת יכולה ללמוד ולהצליח בדאטה?"
      : "בסולם 1–5 — כמה הרגשת שאתה יכול ללמוד ולהצליח בדאטה?",
    scaleHint: (g: Gender) => g === "female"
      ? "1 = ממש לא בטוחה · 5 = בהחלט יכולה"
      : "1 = ממש לא בטוח · 5 = בהחלט יכול",
    openHint: (g: Gender) => g === "female"
      ? "אין תשובה נכונה — ספרי מה הרגשת באמת"
      : "אין תשובה נכונה — ספר מה הרגשת באמת",
    followUps: EFFICACY_FOLLOWUPS,
    scalePhase: "efficacy_scale" as Phase,
    openPhase:  "efficacy_open"  as Phase,
    scaleKey: "efficacy_scale",
    openKey:  "efficacy_open",
  },
  {
    id: "outcome",
    label: "עתיד",
    color: NAVY,
    emoji: "🔭",
    scaleQ: (g: Gender) => g === "female"
      ? "בסולם 1–5 — כמה את מדמיינת את עצמך מצליחה בתחום?"
      : "בסולם 1–5 — כמה אתה מדמיין את עצמך מצליח בתחום?",
    scaleHint: (g: Gender) => g === "female"
      ? "1 = לא מדמיינת בכלל · 5 = ברורה לי מאוד התמונה"
      : "1 = לא מדמיין בכלל · 5 = ברורה לי מאוד התמונה",
    openHint: (g: Gender) => g === "female"
      ? "כתבי 2–3 משפטים — מה רואים, מה מרגישים"
      : "כתוב 2–3 משפטים — מה רואים, מה מרגישים",
    followUps: OUTCOME_FOLLOWUPS,
    scalePhase: "outcome_scale" as Phase,
    openPhase:  "outcome_open"  as Phase,
    scaleKey: "outcome_scale",
    openKey:  "outcome_open",
  },
];

const SCALE_EMOJIS = ["", "😐", "🙂", "😊", "😄", "🤩"];
const SCALE_LABELS = ["", "כלל לא", "קצת", "בינוני", "הרבה", "מאוד!"];

type Answers = Record<string, string | number>;

// ─── Open Question ────────────────────────────────────────────────────────────

function OpenQuestion({ color, hint, gender, onAnswer }: { color: string; hint: string; gender: Gender | null; onAnswer: (v: string) => void }) {
  const [text, setText] = useState("");
  const ready = text.trim().length >= 2;
  const isFemale = gender === "female";

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={hint}
        rows={5}
        autoFocus
        className="w-full rounded-2xl p-4 text-[14px] leading-relaxed resize-none outline-none"
        style={{
          background: "#fff",
          border: `2px solid ${ready ? color : "rgba(0,0,0,0.1)"}`,
          color: "#1a1a1a",
          fontFamily: "'Heebo', sans-serif",
          transition: "border-color 0.25s",
          boxShadow: ready ? `0 2px 12px ${color}18` : "none",
        }}
        dir="rtl"
      />
      <div className="text-right text-[11px] mt-1.5" style={{ color: "rgba(0,0,0,0.28)" }}>
        {text.length} תווים
      </div>
      <button
        onClick={() => ready && onAnswer(text.trim())}
        disabled={!ready}
        className="w-full mt-4 py-4 rounded-xl font-black text-[15px] text-white transition-all"
        style={{
          background: ready ? color : "rgba(0,0,0,0.12)",
          fontFamily: "'Heebo', sans-serif",
          cursor: ready ? "pointer" : "not-allowed",
        }}
      >
        {ready ? (isFemale ? "המשיכי ←" : "המשך ←") : (isFemale ? "כתבי קודם" : "כתוב קודם")}
      </button>
    </div>
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function Summary({ answers, gender }: { answers: Answers; gender: Gender | null }) {
  const interestScore = (answers["interest_scale"] as number) || 0;
  const efficacyScore = (answers["efficacy_scale"] as number) || 0;
  const outcomeScore  = (answers["outcome_scale"]  as number) || 0;
  const avg = (interestScore + efficacyScore + outcomeScore) / 3;

  const isFemale = gender === "female";

  const constructs = [
    { label: "עניין",   score: interestScore, color: TEAL,   emoji: "🌟", desc: "כמה התחום מדבר אליך" },
    { label: "ביטחון",  score: efficacyScore, color: ORANGE, emoji: "💪", desc: "כמה האמנת ביכולת שלך ללמוד" },
    { label: "עתיד",    score: outcomeScore,  color: NAVY,   emoji: "🔭", desc: "כמה ברורה לך התמונה העתידית" },
  ];

  let headline = "", subtext = "", heroEmoji = "";

  if (avg >= 4) {
    heroEmoji = "🎯";
    headline = "יש לך חיבור אמיתי לדאטה";
    subtext = `שלושת הסימנים — עניין, ביטחון, ותמונה עתידית — נדלקו. זה דיוק נדיר. כדאי לשוחח עם הרכזת על מסלול דאטה מעמיק.`;
  } else if (interestScore >= 4 && efficacyScore <= 2) {
    heroEmoji = "✨";
    headline = "יש עניין — הביטחון עוד יגיע";
    subtext = isFemale
      ? "את מרגישה חיבור לתחום, אבל עוד לא בטוחה ביכולת. זה בדיוק מה שמסלול לימודים טוב עושה — בונה את הביטחון צעד אחר צעד."
      : "אתה מרגיש חיבור לתחום, אבל עוד לא בטוח ביכולת. זה בדיוק מה שמסלול לימודים טוב עושה — בונה את הביטחון צעד אחר צעד.";
  } else if (avg >= 2.5) {
    heroEmoji = "💡";
    headline = "יש ניצוץ — כדאי להעמיק";
    subtext = "ראית משהו מעניין. הטעימה הזו היא רק ההתחלה — עם ליווי נכון ניתן לפתח עניין לכיוון ממשי.";
  } else {
    heroEmoji = "🔍";
    headline = "הטעימה עשתה את שלה";
    subtext = "תחום הדאטה הוא רק אחד מהאפשרויות. הרכזת תעזור להבין מה מתאים לך יותר — לפעמים הכיוון הנכון נמצא בתחום אחר.";
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

      {/* 3 Construct Bars */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>
          3 עמודות ה-SCCT
        </div>
        {constructs.map((c) => (
          <div key={c.label} className="mb-5 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[18px]">{c.emoji}</span>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: NAVY }}>{c.label}</div>
                  <div className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.35)" }}>{c.desc}</div>
                </div>
              </div>
              <div className="text-[18px] font-black" style={{ color: c.color, ...HEEBO }}>
                {c.score}<span className="text-[13px] font-bold opacity-40">/5</span>
              </div>
            </div>
            <div className="h-[10px] rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(c.score / 5) * 100}%`, background: c.color, transition: "width 1s ease-out" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Open answers recap */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
          מה כתבת
        </div>
        {[
          { label: "עניין — מה הרגשת?",      id: "interest_open" },
          { label: "ביטחון — מה הרגשת?",     id: "efficacy_open" },
          { label: "עתיד — מה ראית?",         id: "outcome_open"  },
        ].map(({ label, id }) => {
          const a = answers[id] as string;
          return (
            <div key={id} className="mb-3 rounded-xl p-3.5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="text-[10.5px] font-bold mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{label}</div>
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
      <div className="rounded-2xl p-4 mb-7" style={{ background: `${ORANGE}08`, border: `1.5px solid ${ORANGE}25` }}>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: ORANGE }}>
          מה הלאה
        </div>
        <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
          הרכזת תראה את התוצאות האלה לפני הפגישה הבאה שלכן.{" "}
          <span className="font-bold" style={{ color: NAVY }}>יחד תבחרו את הכיוון הנכון.</span>
        </div>
      </div>

      <ExperienceCTAs domainId="data" domainLabel="הדאטה" />

      {/* Courses — card grid */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} className="pt-7">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>
          רוצה להעמיק?
        </div>
        <div className="text-[14px] font-bold mb-4" style={{ color: NAVY }}>
          קורסי דאטה אנליטיקס חינמיים
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/courses/campus-data.jpg",
              platform: "Campus.gov.il",
              title: "Data.Intro — ניתוח נתונים בפייתון",
              lang: "עברית",
              href: "https://campus.gov.il/en/course/cs-gov-cs-data-dataintro101-he/",
            },
            {
              img: "/courses/ramkedem-data.jpg",
              platform: "Upscale Analytics",
              title: "קורס דאטה אנליסט למתחילים",
              lang: "עברית",
              href: "https://ramkedem.com/course/%d7%a7%d7%95%d7%a8%d7%a1-%d7%93%d7%90%d7%98%d7%94-%d7%90%d7%a0%d7%9c%d7%99%d7%a1%d7%98-%d7%9c%d7%9e%d7%aa%d7%97%d7%99%d7%9c%d7%99%d7%9d/",
            },
            {
              img: "/courses/google-data-analytics.jpg",
              platform: "Google / Coursera",
              title: "Google Data Analytics Certificate",
              lang: "אנגלית",
              href: "https://www.coursera.org/professional-certificates/google-data-analytics",
            },
          ].map((c) => (
            <a
              key={c.title}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}
            >
              <div className="overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>
                  {c.platform}
                </div>
                <div className="text-[12px] font-bold leading-[1.4] mb-3 flex-1" style={{ color: NAVY }}>
                  {c.title}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>✓ חינמי</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${TEAL}12`, color: TEAL }}>{c.lang}</span>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: TEAL }}>לקורס ←</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// חוזרים בדיוק לשלב שבו נעצרנו — כולל מגדר ותשובות, לא רק השלב עצמו
// (בלי זה: מי שחוזר ל-"done" רואה תוצאה ריקה, ומי שחוזר לשאלה רואה ניסוח בלי מגדר)
function loadSavedState(): { phase?: Phase; gender?: Gender | null; answers?: Answers } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("data-experience-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function ExperiencePage() {
  const [phase, setPhase]         = useState<Phase>(() => loadSavedState().phase ?? "gender");
  const [gender, setGender]       = useState<Gender | null>(() => loadSavedState().gender ?? null);
  const [answers, setAnswers]     = useState<Answers>(() => loadSavedState().answers ?? {});
  const [tapped, setTapped]       = useState<number | null>(null); // scale visual feedback

  useEffect(() => {
    try { localStorage.setItem("data-experience-state", JSON.stringify({ phase, gender, answers })); } catch {/* ignore */}
  }, [phase, gender, answers]);

  /*
   * איפה עוצרים בתוך הכלי.
   *
   * עד היום נרשם רק scct_done, כלומר מי שענה על ארבע שאלות מתוך שש ונעלם
   * פשוט לא היה קיים בנתונים. ההשערה שכדאי לבדוק ראשונה: שאלות המסוגלות
   * ("כמה את מאמינה שאת מסוגלת") הן אלה שקשה לענות עליהן בכנות.
   */
  useEffect(() => {
    if (phase === "gender" || phase === "done") return;
    logEvent("scct_step", { domain: "data", q: phase });
  }, [phase]);



  // ── helpers ────────────────────────────────────────────────────────────────

  function getCurrentConstruct() {
    if (phase.startsWith("interest")) return CONSTRUCTS[0];
    if (phase.startsWith("efficacy")) return CONSTRUCTS[1];
    if (phase.startsWith("outcome"))  return CONSTRUCTS[2];
    return null;
  }

  function handleGender(g: Gender) {
    setGender(g);
    setPhase("interest_scale");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleScale(val: number) {
    const construct = getCurrentConstruct()!;
    setTapped(val);
    setTimeout(() => {
      setAnswers((prev) => ({ ...prev, [construct.scaleKey]: val }));
      setPhase(construct.openPhase);
      setTapped(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 320);
  }

  function handleOpen(val: string) {
    const construct = getCurrentConstruct()!;
    const newAnswers = { ...answers, [construct.openKey]: val };
    setAnswers(newAnswers);

    if (construct.id === "interest") {
      setPhase("efficacy_scale");
    } else if (construct.id === "efficacy") {
      setPhase("outcome_scale");
    } else {
      try {
        localStorage.setItem("data-experience", JSON.stringify(newAnswers));
        /*
         * מדד השליחות נשמר לסופאבייס: עניין גבוה + מסוגלות נמוכה הוא בדיוק
         * האדם שבשבילו הארגון קיים, ועד היום הציונים חיו רק בדפדפן.
         * הסקאלות בכלי הן 1-5 — בדיוק מה ש-scct_scores מצפה לו.
         */
        saveScctScore(
          "data",
          Number(newAnswers["interest_scale"]) || null,
          Number(newAnswers["efficacy_scale"]) || null,
          Number(newAnswers["outcome_scale"]) || null,
          [newAnswers["interest_open"], newAnswers["efficacy_open"], newAnswers["outcome_open"]]
            .filter(Boolean).join(" | ") || undefined
        );
        logEvent("scct_done", { domain: "data" });
        const journey = JSON.parse(localStorage.getItem("data-journey") || "{}");
        localStorage.setItem("data-journey", JSON.stringify({ ...journey, experience: true }));
      } catch {/* ignore */}
      setPhase("done");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Gender selection ───────────────────────────────────────────────────────

  if (phase === "gender") {
    return (
      <div className="min-h-screen" style={{ background: "#fbf9f5" }} dir="rtl">
        <div className="text-white px-[22px] pt-[26px] pb-[30px]" style={{ background: NAVY }}>
          <div className="max-w-[720px] mx-auto">
            <div className="text-[12px] mb-2" style={{ opacity: 0.55 }}>כלי עיבוד החוויה · דאטה ואנליטיקס</div>
            <div className="text-[26px] font-black leading-tight" style={HEEBO}>רגע לפני שנתחיל</div>
          </div>
        </div>
        <div className="max-w-[720px] mx-auto px-[22px] pt-6 pb-36">
          <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(13,148,136,0.05)", border: "1.5px solid rgba(13,148,136,0.15)" }}>
            <div className="text-[13.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
              <span className="font-bold" style={{ color: NAVY }}>מה שחווית עכשיו הוא מידע חשוב.</span>{" "}
              חמש שאלות קצרות יעזרו לך להבין מה זה אמר לך — על העניין שלך, על הביטחון שלך, ועל האופן שבו את רואה את עצמך בתחום.
            </div>
            <div className="mt-2 text-[11.5px]" style={{ color: "rgba(0,0,0,0.38)" }}>
              הרכזת תראה את התשובות לפני הפגישה הבאה · לוקח כחמש דקות
            </div>
          </div>
          <div className="text-[20px] font-black mb-2" style={{ color: NAVY, ...HEEBO }}>איך לפנות אליך?</div>
          <div className="text-[13px] mb-8" style={{ color: "rgba(0,0,0,0.45)" }}>
            כדי שהשאלות ישמעו אישיות וטבעיות
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleGender("female")}
              className="w-full py-5 rounded-2xl text-[17px] font-black text-right px-6 transition-all active:scale-[0.98]"
              style={{ background: TEAL, color: "#fff", ...HEEBO }}
            >
              אליה — בלשון נקבה
            </button>
            <button
              onClick={() => handleGender("male")}
              className="w-full py-5 rounded-2xl text-[17px] font-black text-right px-6 transition-all active:scale-[0.98]"
              style={{ background: "transparent", border: `2px solid ${NAVY}`, color: NAVY, ...HEEBO }}
            >
              אליו — בלשון זכר
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Done / Summary ─────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="min-h-screen" style={{ background: "#fbf9f5" }} dir="rtl">
        <div className="text-white px-[22px] pt-[26px] pb-[30px]" style={{ background: NAVY }}>
          <div className="max-w-[720px] mx-auto">
            <div className="text-[12px] mb-2" style={{ opacity: 0.55 }}>כלי עיבוד החוויה · דאטה ואנליטיקס</div>
            <div className="text-[26px] font-black leading-tight" style={HEEBO}>הסיכום שלך ✓</div>
          </div>
        </div>
        <div className="max-w-[720px] mx-auto">
          <Summary answers={answers} gender={gender} />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Question screens ───────────────────────────────────────────────────────

  const construct   = getCurrentConstruct()!;
  const isScale     = phase.endsWith("_scale");
  const progressIdx = PHASE_ORDER.indexOf(phase);

  // dynamic follow-up question text
  const scaleVal    = answers[construct.scaleKey] as number;
  const openQ       = !isScale && gender && scaleVal
    ? construct.followUps[scaleVal]?.(gender) ?? (gender === "female" ? "ספרי לי על הרגע הזה." : "ספר לי על הרגע הזה.")
    : "";

  const questionText = isScale ? construct.scaleQ(gender!) : openQ;

  return (
    <div className="min-h-screen" style={{ background: "#fbf9f5" }} dir="rtl">
      {/* Header */}
      <div className="text-white px-[22px] pt-[26px] pb-7" style={{ background: construct.color }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/explore/data" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.75 }}>
            ← חזרה
          </Link>

          {/* Progress bar — 6 segments */}
          <div className="flex items-center gap-1.5 mb-6">
            {PHASE_ORDER.map((_, i) => (
              <div
                key={i}
                className="h-[5px] flex-1 rounded-full transition-all duration-500"
                style={{
                  background:
                    i < progressIdx  ? "rgba(255,255,255,0.9)" :
                    i === progressIdx ? "rgba(255,255,255,0.6)" :
                                        "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>

          {/* Construct badge */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-[11px] font-bold"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <span>{construct.emoji}</span>
            <span>{construct.label}</span>
            <span style={{ opacity: 0.65 }}>· {isScale ? "דירוג" : "שאלה פתוחה"}</span>
          </div>

          <div className="text-[21px] font-black leading-snug" style={HEEBO}>
            {questionText}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[720px] mx-auto px-[22px] pt-6 pb-36">
        {isScale ? (
          <>
            <div className="text-[12px] mb-5" style={{ color: "rgba(0,0,0,0.4)" }}>
              {construct.scaleHint(gender!)} — {gender === "female" ? "לחצי" : "לחץ"} לבחור
            </div>
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => tapped === null && handleScale(n)}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all text-right w-full active:scale-[0.98]"
                  style={{
                    background: tapped === n ? `${construct.color}18` : "#fff",
                    border: `2px solid ${tapped === n ? construct.color : "rgba(0,0,0,0.08)"}`,
                    boxShadow: tapped === n ? `0 2px 12px ${construct.color}22` : "none",
                    cursor: tapped !== null ? "default" : "pointer",
                  }}
                >
                  <span className="text-[26px] shrink-0">{SCALE_EMOJIS[n]}</span>
                  <div className="flex-1 text-right">
                    <span className="text-[14px] font-bold" style={{ color: tapped === n ? construct.color : "#023e8a" }}>
                      {n} — {SCALE_LABELS[n]}
                    </span>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{
                      borderColor: tapped === n ? construct.color : "rgba(0,0,0,0.15)",
                      background:  tapped === n ? construct.color : "transparent",
                    }}
                  >
                    {tapped === n && <span className="text-white text-[10px] font-black">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <OpenQuestion
            color={construct.color}
            hint={construct.openHint(gender!)}
            gender={gender}
            onAnswer={handleOpen}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
