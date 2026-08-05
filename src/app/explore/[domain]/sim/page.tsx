"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { saveSimulationProgress, updateTask } from "@/lib/candidate";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─────────────────────────────────────────────────────────────────────────────
// THEME — עיצוב "Playful" (קורל/סגול על קרם) לתחום ה-code בלבד; שאר התחומים
// ממשיכים עם עיצוב הניווי הקיים. כל שאר קומפוננטות ה-UI מקבלות theme כפרופ.
// ─────────────────────────────────────────────────────────────────────────────

type SimTheme = {
  fontUI: string;
  fontCode: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  headerGradient: string;
  accent: string;
  accentSoft: string;
  accentGradient: string;
  textDark: string;
  textMuted: string;
  textFaint: string;
  successBg: string;
  successBorder: string;
  successText: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  hintBg: string;
  hintBorder: string;
  hintText: string;
  codeBg: string;
  codeHeaderBg: string;
  codeKeyword: string;
  codeFn: string;
  codeString: string;
  codeNum: string;
  codeErr: string;
  codePlain: string;
  progressTrack: string;
};

const NAVY_THEME: SimTheme = {
  fontUI: "'Heebo', sans-serif",
  fontCode: "monospace",
  pageBg: "#fbf9f5",
  cardBg: "#fff",
  cardBorder: "rgba(0,0,0,0.08)",
  headerGradient: "#023e8a",
  accent: "#3b82f6",
  accentSoft: "rgba(59,130,246,0.1)",
  accentGradient: "#023e8a",
  textDark: "#023e8a",
  textMuted: "rgba(0,0,0,0.6)",
  textFaint: "rgba(0,0,0,0.35)",
  successBg: "rgba(34,197,94,0.08)",
  successBorder: "#22c55e55",
  successText: "#15803d",
  errorBg: "rgba(220,38,38,0.07)",
  errorBorder: "#dc262644",
  errorText: "#b91c1c",
  hintBg: "rgba(251,133,0,0.08)",
  hintBorder: "rgba(251,133,0,0.22)",
  hintText: "#c2410c",
  codeBg: "#0f172a",
  codeHeaderBg: "#1e293b",
  codeKeyword: "#a78bfa",
  codeFn: "#60a5fa",
  codeString: "#34d399",
  codeNum: "#f472b6",
  codeErr: "#f87171",
  codePlain: "#e2e8f0",
  progressTrack: "rgba(59,130,246,0.18)",
};

const PLAYFUL_THEME: SimTheme = {
  fontUI: "'Rubik', sans-serif",
  fontCode: "'JetBrains Mono', monospace",
  pageBg: "#f3ede0",
  cardBg: "#fff8ef",
  cardBorder: "#ffe3cc",
  headerGradient: "linear-gradient(135deg, #ff7a59, #ffb648)",
  accent: "#7c5cff",
  accentSoft: "rgba(124,92,255,0.1)",
  accentGradient: "linear-gradient(135deg, #7c5cff, #5f3dff)",
  textDark: "#33261a",
  textMuted: "#5a4636",
  textFaint: "#a3773f",
  successBg: "#e4ffe9",
  successBorder: "#7ee6a0",
  successText: "#219653",
  errorBg: "#ffe6e6",
  errorBorder: "#ffb3b3",
  errorText: "#e05252",
  hintBg: "#fff2da",
  hintBorder: "#ffcf70",
  hintText: "#8a5a12",
  codeBg: "#2b2540",
  codeHeaderBg: "#241e38",
  codeKeyword: "#ff9df5",
  codeFn: "#7ee6ff",
  codeString: "#a5f3b8",
  codeNum: "#ffd580",
  codeErr: "#ff8a80",
  codePlain: "#eae6ff",
  progressTrack: "#ffe3cc",
};

function getTheme(domain: string): SimTheme {
  return domain === "code" ? PLAYFUL_THEME : NAVY_THEME;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ChoiceStep = {
  kind: "choice";
  tag: string;
  concept: string; // what's being taught
  context: React.ReactNode;
  question: string;
  options: string[];
  correct: number;
  okMsg: string;
  errMsg: string;
  learned: string;
  level?: 1 | 2 | 3;
};

type SequenceStep = {
  kind: "sequence";
  tag: string;
  concept: string;
  context: React.ReactNode;
  instruction: string;
  items: string[];
  correctOrder: number[]; // correct sequence of indices
  okMsg: string;
  errMsg: string;
  learned: string;
  level?: 1 | 2 | 3;
};

// משחק התאמה — לוחצות על פריט משמאל ואז על ההתאמה שלו מימין
type MatchStep = {
  kind: "match";
  tag: string;
  concept: string;
  context: React.ReactNode;
  instruction: string;
  pairs: { left: string; right: string }[];
  okMsg: string;
  errMsg: string;
  learned: string;
  level?: 1 | 2 | 3;
};

// השלמה בהקלדה חופשית — בודקים מול רשימת תשובות מקובלות (case-insensitive, trim)
type TypeStep = {
  kind: "type";
  tag: string;
  concept: string;
  context: React.ReactNode;
  question: string;
  accepted: string[];
  placeholder?: string;
  okMsg: string;
  errMsg: string;
  learned: string;
  level?: 1 | 2 | 3;
};

type Step = ChoiceStep | SequenceStep | MatchStep | TypeStep;

const LEVEL_LABELS: Record<number, string> = {
  1: "רמה 1 · יסודות",
  2: "רמה 2 · בניית לוגיקה",
  3: "רמה 3 · אתגר מתקדם",
};

// קופסת "רוצה להעמיק?" — קישורי מאמר + סרטון מוטמע בתוך הדף (בלי לצאת לינק חדש)
type LearnResource = { label: string; url: string; kind: "article" | "video" };

// מוציאה video id מתוך כתובת יוטיוב (watch?v=, youtu.be/, embed/) כדי להטמיע נגן ישירות בדף
function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// (בשימוש בלעדי בתחום ה-code — צבועה תמיד בפלטת ה-Playful)
function LearnMore({ resources }: { resources: LearnResource[] }) {
  const t = PLAYFUL_THEME;
  const articles = resources.filter((r) => r.kind === "article");
  const videos = resources.filter((r) => r.kind === "video");

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{ background: t.cardBg, border: `1.5px solid ${t.cardBorder}`, fontFamily: t.fontUI }}
    >
      <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: t.textFaint }}>
        רוצה להעמיק? 📚
      </div>

      <div className="flex gap-4 flex-wrap items-start">
        {articles.length > 0 && (
          <div className="flex-1 min-w-[120px]">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-[6px]" style={{ color: t.textFaint }}>
              📄 קריאה
            </div>
            <div className="flex flex-col gap-[6px]">
              {articles.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-bold underline leading-[1.4]"
                  style={{ color: t.accent }}
                >
                  {r.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div className="flex-1 min-w-[140px]">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-[6px]" style={{ color: t.textFaint }}>
              🎥 צפייה
            </div>
            <div className="flex flex-col gap-3">
              {videos.map((v) => {
                const embedUrl = getYouTubeEmbedUrl(v.url);
                return (
                  <div key={v.url}>
                    {embedUrl ? (
                      <div
                        className="relative w-full rounded-lg overflow-hidden"
                        style={{ paddingTop: "56.25%", background: "#000" }}
                      >
                        <iframe
                          src={embedUrl}
                          title={v.label}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full border-0"
                        />
                      </div>
                    ) : (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-bold underline"
                        style={{ color: t.accent }}
                      >
                        {v.label}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// קופסת "העמקה" — תוכן טכני נוסף שמתקפל (בשימוש בלעדי בתחום ה-code)
function DeepDive({ title, children }: { title: string; children: React.ReactNode }) {
  const t = PLAYFUL_THEME;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: `1.5px solid ${t.cardBorder}`, fontFamily: t.fontUI }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-right"
        style={{ background: t.accentSoft }}
      >
        <span className="text-[12.5px] font-bold" style={{ color: t.accent }}>🔬 {title}</span>
        <span className="text-[12px]" style={{ color: t.accent }}>{open ? "סגירה ▲" : "העמקה ▼"}</span>
      </button>
      {open && (
        <div className="px-4 py-4 text-[12.5px] leading-[1.75]" style={{ color: t.textMuted, background: t.cardBg }}>
          {children}
        </div>
      )}
    </div>
  );
}

// כרטיס פתיחה לכל שלב (בשימוש בלעדי בתחום ה-code)
function ConceptIntro({ title, icon = "📘", children }: { title: string; icon?: string; children: React.ReactNode }) {
  const t = PLAYFUL_THEME;
  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: t.cardBg, border: `1.5px solid ${t.cardBorder}`, boxShadow: "0 4px 16px rgba(255,122,89,0.08)", fontFamily: t.fontUI }}
    >
      <div className="flex items-center gap-2 mb-[10px]">
        <span className="text-[17px] shrink-0">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.accent }}>{title}</span>
      </div>
      <div className="text-[13.5px] leading-[1.75] flex flex-col gap-[10px]" style={{ color: t.textMuted }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 0 — זהות: "זה בשבילי?"
// ─────────────────────────────────────────────────────────────────────────────

const S0: ChoiceStep = {
  kind: "choice",
  tag: "נקודת פתיחה",
  concept: "מי מפתחת תוכנה?",
  context: (
    <div>
      <div
        className="rounded-2xl p-4 mb-5 flex gap-4 items-start"
        style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}
      >
        <div
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[22px] font-black text-white"
          style={{ background: "#3b82f6", ...HEEBO }}
        >
          מ
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: "#023e8a" }}>מירב, 27, מנצרת עילית</div>
          <div className="text-[12.5px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            "לפני 3 שנים לא ידעתי מה זה Python. היום אני מפתחת ב-Wix ומרוויחה ₪22,000 בחודש. לא הייתי 'גאונית מולד' — סתם למדתי צעד אחר צעד."
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
        לפני שנגלה מה זה פיתוח תוכנה — שאלה אחת חשובה:
      </p>
    </div>
  ),
  question: "מה לדעתך מאפיין מפתחת תוכנה מצליחה?",
  options: [
    "כישרון מולד במתמטיקה",
    "סבלנות, סקרנות, ויכולת ללמוד מטעויות",
    "תואר אקדמי במדעי המחשב",
  ],
  correct: 1,
  okMsg: "בדיוק! מחקרים מראים שהמאפיין הכי חשוב הוא Growth Mindset — האמונה שאפשר לצמוח. לא IQ, לא תואר. מירב הוכיחה את זה.",
  errMsg: "מסתבר שלא — רוב המפתחות המצליחות לא סיימו תואר CS. מה שעשה את ההבדל: סבלנות וסקרנות. כישרון מפתח בדרך.",
  learned: "מפתחות מצליחות = סקרנות + התמדה, לא גאונות",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — מה זה קוד?
// ─────────────────────────────────────────────────────────────────────────────

const S1: ChoiceStep = {
  kind: "choice",
  tag: "מה זה קוד?",
  concept: "קוד = הוראות מדויקות",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        דמיין שאת מנסה להסביר לאדם שמעולם לא ראה כריך — <span className="font-bold" style={{ color: "#023e8a" }}>כיצד להכין כריך גבינה.</span>
      </p>
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>
          הניסיון הראשון שלך:
        </div>
        <div className="text-[13.5px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.65)" }}>
          "תשים גבינה על לחם."
        </div>
        <div className="mt-3 text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.42)" }}>
          הבעיה: "לשים" — לאן? כמה? עם ידיים? בסכין?
          <br />
          מחשב לא מנחש — הוא עוקב אחרי כל הוראה <span className="font-bold">מילה במילה.</span>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#023e8a" }}>קוד = מתכון מדויק</span> עבור המחשב. כל שלב, בסדר הנכון, ללא מרווח לפרשנות.
      </p>
    </div>
  ),
  question: "מה ההבדל בין הסבר לאדם לבין הסבר למחשב?",
  options: [
    "למחשב צריך לדבר בעברית פשוטה יותר",
    "לאדם יש הקשר ושכל ישר — מחשב עוקב אחרי הוראות בלבד, בלי לפרש",
    "אין הבדל — שניהם מבינים שפה טבעית",
  ],
  correct: 1,
  okMsg: "בדיוק! מחשב הוא מכונה חזקה מאוד — אבל ממש טיפשה. הוא לא 'מבין'. לכן קוד חייב להיות מדויק כמו הוראות הרכבה של איקאה.",
  errMsg: "מחשב לא מבין שפה טבעית — הוא מריץ הוראות בדיוק כפי שנכתבו. לכן קוד חייב להיות מפורש ומדויק.",
  learned: "קוד = הוראות מדויקות שמחשב מריץ שורה אחרי שורה",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — מה זה אלגוריתם? (sequence interaction)
// ─────────────────────────────────────────────────────────────────────────────

const S2: SequenceStep = {
  kind: "sequence",
  tag: "אלגוריתם",
  concept: "אלגוריתם = סדר פעולות",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#023e8a" }}>אלגוריתם</span> — מילה מפחידה? בעצם זה פשוט:
        <br />
        <span className="font-bold" style={{ color: "#023e8a" }}>רשימת שלבים שחייבים להתרחש בסדר מסוים.</span>
      </p>
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        <div className="text-[12px] font-bold mb-2" style={{ color: "#023e8a" }}>
          אלגוריתם "הכני מים רותחים":
        </div>
        <div className="text-[12.5px] leading-[1.9]" style={{ color: "rgba(0,0,0,0.6)" }}>
          ✓ שים קומקום על חשמל<br />
          ✓ מלאי מים בקומקום<br />
          ✓ לחצי על כפתור הפעלה<br />
          ✓ חכי שירתח
        </div>
        <div className="mt-2 text-[11.5px]" style={{ color: "rgba(0,0,0,0.38)" }}>
          מה יקרה אם נחליף שלב 1 עם שלב 2? → מים על הרצפה, לא מים רותחים.
        </div>
      </div>
    </div>
  ),
  instruction: "סדרי את שלבי האלגוריתם לשליחת WhatsApp — לחצי לפי הסדר הנכון:",
  items: [
    "לחצי שלח",
    "פתחי WhatsApp",
    "הקלידי הודעה",
    "בחרי איש קשר",
  ],
  correctOrder: [1, 3, 2, 0], // פתחי → בחרי → הקלידי → לחצי
  okMsg: "מעולה! זה אלגוריתם — סדר פעולות שחייב להיות נכון. מחשבים מריצים אלגוריתמים מאות מיליוני פעמים ביום, בכל קליק שאת עושה.",
  errMsg: "נסי שוב — הסדר הנכון: פתחי WhatsApp → בחרי איש קשר → הקלידי → שלחי. כל שלב מוכן את הקרקע לבא אחריו.",
  learned: "אלגוריתם = סדר פעולות מדויק. הסדר קריטי.",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — מה זה פונקציה? (ויזואל לפני קוד)
// ─────────────────────────────────────────────────────────────────────────────

const S3: ChoiceStep = {
  kind: "choice",
  tag: "פונקציה",
  concept: "פונקציה = מכונה עם שם",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        עכשיו מגיע מושג שתשמעי הרבה:{" "}
        <span className="font-bold" style={{ color: "#023e8a" }}>פונקציה.</span>
        <br />
        זה כמו מכונה קטנה: שמים משהו פנימה, יוצא משהו אחר.
      </p>

      {/* Visual machine */}
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.32)" }}>
          הפונקציה: create_greeting
        </div>
        {[
          { input: '"נועה"', output: '"שלום, נועה!"' },
          { input: '"מיכל"', output: '"שלום, מיכל!"' },
          { input: '"שרה"', output: '"שלום, שרה!"' },
        ].map((row) => (
          <div key={row.input} className="flex items-center gap-2 mb-3">
            <div
              className="rounded-xl px-3 py-2 text-[12px] font-bold font-mono text-center shrink-0"
              style={{ background: "#fff", border: "1.5px solid #3b82f6", color: "#1e3a8a", width: 76 }}
            >
              {row.input}
            </div>
            <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.28)" }}>←</div>
            <div
              className="rounded-xl px-3 py-2 text-[12px] font-bold text-center flex-1"
              style={{ background: "#3b82f6", color: "#fff" }}
            >
              create_greeting
            </div>
            <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.28)" }}>←</div>
            <div
              className="rounded-xl px-3 py-2 text-[11.5px] font-bold font-mono shrink-0"
              style={{ background: "rgba(34,197,94,0.1)", border: "1.5px solid #22c55e", color: "#15803d" }}
            >
              {row.output}
            </div>
          </div>
        ))}
        <div className="text-[11.5px] mt-2" style={{ color: "rgba(0,0,0,0.38)" }}>
          אותה מכונה. שלושה שמות שונים. שלוש תוצאות שונות.
        </div>
      </div>
    </div>
  ),
  question: 'מה תחזיר הפונקציה create_greeting עבור "ריבה"?',
  options: [
    '"שלום, create_greeting!"',
    '"שלום, ריבה!"',
    '"ריבה שלום!"',
  ],
  correct: 1,
  okMsg: "נכון! הפונקציה לקחה 'ריבה', הכניסה לתבנית הקבועה, והחזירה 'שלום, ריבה!'. עכשיו נראה איך זה נראה בקוד אמיתי.",
  errMsg: '"שלום, ריבה!" — הפונקציה תמיד בונה לפי אותה תבנית: שלום + השם + !. השם משתנה, התבנית קבועה.',
  learned: "פונקציה = קלט נכנס → עיבוד קבוע → פלט יוצא",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — הפונקציה בקוד אמיתי
// ─────────────────────────────────────────────────────────────────────────────

const S4: ChoiceStep = {
  kind: "choice",
  tag: "קוד ראשון",
  concept: "def, name, return — 3 מילות בסיס",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.65] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        זוכרת את מכונת create_greeting? הנה איך היא נראית
        בשפת Python — אחת משפות התכנות הפופולריות בעולם:
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}
      >
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
          <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>greeting.py</span>
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
          <div>
            <span style={{ color: "#a78bfa" }}>def</span>
            {" "}
            <span style={{ color: "#60a5fa" }}>create_greeting</span>
            (<span style={{ color: "#fbbf24" }}>name</span>):
          </div>
          <div>
            {"    "}
            <span style={{ color: "#a78bfa" }}>return</span>
            {" "}
            <span style={{ color: "#34d399" }}>"שלום, "</span>
            {" + "}
            <span style={{ color: "#fbbf24" }}>name</span>
            {" + "}
            <span style={{ color: "#34d399" }}>"!"</span>
          </div>
        </div>
      </div>

      {/* Word guide */}
      <div className="flex flex-col gap-2 mb-5">
        {[
          { word: "def", color: "#a78bfa", meaning: "מגדירה פונקציה חדשה (definition)" },
          { word: "name", color: "#fbbf24", meaning: "המשתנה — כמו 'תיבה ריקה' שמקבלת ערך" },
          { word: "return", color: "#a78bfa", meaning: "מחזירה את התוצאה החוצה" },
        ].map((item) => (
          <div key={item.word} className="flex items-start gap-3">
            <span
              className="font-mono text-[11.5px] font-bold px-2 py-[3px] rounded shrink-0 mt-[1px]"
              style={{ background: "#1e293b", color: item.color }}
            >
              {item.word}
            </span>
            <span className="text-[12px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.55)" }}>
              {item.meaning}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
  question: 'מה יחזיר הקוד כאשר נקרא: create_greeting("ריבה")?',
  options: [
    '"שלום, name!"',
    '"שלום, ריבה!"',
    '"create_greeting(ריבה)"',
  ],
  correct: 1,
  okMsg: 'נכון! Python מחליף את `name` בערך שקיבלה הפונקציה — "ריבה" — ובונה את המחרוזת. זה בדיוק מה שקורה כשאת מקבלת SMS עם שמך מהבנק.',
  errMsg: '"שלום, ריבה!" — `name` הוא לא מחרוזת, הוא משתנה שמקבל ערך. כשקוראים create_greeting("ריבה"), המחשב מחליף name ב-"ריבה".',
  learned: "def → name → return: לסדר הזה תמיד",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — בני פונקציה חדשה (fill-in-the-blank choice)
// ─────────────────────────────────────────────────────────────────────────────

const S5: ChoiceStep = {
  kind: "choice",
  tag: "כתיבה ראשונה",
  concept: "לכתוב קוד מאפס",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(251,133,0,0.08)", border: "1px solid rgba(251,133,0,0.22)" }}
      >
        <span className="text-[20px] shrink-0">🎯</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#c2410c" }}>משימה מהמנהלת</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>
            "צריך פונקציה שמקבלת שם עיר ומחזירה 'שלום מ-[עיר]!'. תוכלי לכתוב?"
          </div>
        </div>
      </div>

      <p className="text-[13px] leading-[1.65] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        הנה תחילת הפונקציה — מה צריך לשים ב-___?
      </p>

      <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}>
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
          <div>
            <span style={{ color: "#a78bfa" }}>def</span>
            {" city_greeting("}
            <span style={{ color: "#fbbf24" }}>city</span>
            {"):"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#a78bfa" }}>return</span>
            {" "}
            <span style={{ color: "#34d399" }}>"שלום מ-"</span>
            {" + "}
            <span
              className="rounded px-1"
              style={{ background: "rgba(251,133,0,0.25)", color: "#fb8500", border: "1.5px dashed #fb8500" }}
            >
              ___
            </span>
            {" + "}
            <span style={{ color: "#34d399" }}>"!"</span>
          </div>
        </div>
      </div>
    </div>
  ),
  question: "מה צריך לשים במקום ה-___ ?",
  options: [
    '"city"  (עם מרכאות)',
    "city  (בלי מרכאות)",
    '"שלום"  (המילה שלום)',
  ],
  correct: 1,
  okMsg: 'נכון! `city` בלי מרכאות — כי זה משתנה, לא טקסט קבוע. אם תשימי מרכאות תקבלי "שלום מ-city!" תמיד. בלי מרכאות — city מוחלף בערך האמיתי.',
  errMsg: 'city בלי מרכאות — הסיבה: עם מרכאות הייתי כותבת את המילה "city" ממש. בלי מרכאות, Python יודע שזה משתנה ומחליף אותו בערך האמיתי.',
  learned: "משתנה בלי מרכאות — Python יחליף אותו בערך האמיתי",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — ציד הבאג (רמה גבוהה יותר)
// ─────────────────────────────────────────────────────────────────────────────

const S6: ChoiceStep = {
  kind: "choice",
  tag: "ציד הבאג",
  concept: "debugging — מציאת שגיאות",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
      >
        <span className="text-[20px] shrink-0">🚨</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#b91c1c" }}>דיווח מהפרודקשן</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.58)" }}>
            "האפליקציה קורסת — 50,000 משתמשים מדווחים על שגיאה בברכה"
          </div>
        </div>
      </div>

      <p className="text-[13px] leading-[1.65] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        הקוד שנשלח לאוויר. יש 2 שגיאות — מצאי את הגדולה:
      </p>

      <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.18)" }}>
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
          <div>
            <span style={{ color: "#a78bfa" }}>def</span>
            {" create_greeting("}
            <span style={{ color: "#fbbf24" }}>name</span>
            {"):"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#a78bfa" }}>return</span>
            {" "}
            <span style={{ color: "#34d399" }}>"שלום, "</span>
            {" + "}
            <span
              style={{
                color: "#f87171",
                fontWeight: 700,
                background: "rgba(248,113,113,0.18)",
                borderRadius: 3,
                padding: "0 3px",
              }}
            >
              Name
            </span>
            {" + "}
            <span style={{ color: "#34d399" }}>"!"</span>
          </div>
        </div>
      </div>

      <div className="text-[11.5px] leading-[1.55] p-3 rounded-xl" style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.5)" }}>
        רמז: Python רגישה מאוד לאותיות גדולות וקטנות. בדקי שמות של משתנים.
      </div>
    </div>
  ),
  question: "מה גרם לקריסה?",
  options: [
    "חסר נקודתיים בסוף שורה ראשונה",
    '`Name` עם N גדולה — שונה לחלוטין מ-`name`',
    "חסרות מרכאות סביב המחרוזת הראשונה",
  ],
  correct: 1,
  okMsg: 'מצוין! Python רגישה לאותיות — `name` ו-`Name` הם שני משתנים שונים לחלוטין. `name` מוגדר בפונקציה, `Name` לא קיים — קריסה. מציאת הבאג הזה חסכה השבתה של 50,000 משתמשים.',
  errMsg: '`Name` עם N גדולה — זה הבאג הקלאסי. Python case-sensitive: `name` ≠ `Name`. הפונקציה מקבלת `name` (קטנה), אבל `return` מנסה להשתמש ב-`Name` (גדולה) שלא קיים.',
  learned: "Python case-sensitive — שגיאת אות = קריסה",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — תנאי אמת/שקר: בדיקת אורך סיסמה
// ─────────────────────────────────────────────────────────────────────────────

const S7: ChoiceStep = {
  kind: "choice",
  tag: "תנאי אמת/שקר",
  concept: "פונקציה שמחזירה True/False",
  context: (
    <div>
      <ConceptIntro title="פונקציה שמחזירה True/False" icon="🔑">
        <p>
          בכל אתר שדורש הרשמה, יש קוד שבודק אם הסיסמה שהזנת "מספיק חזקה". איך עושים את זה בפייתון? עם שתי מילות מפתח:
        </p>
        <ul className="flex flex-col gap-[6px] pr-4 list-disc">
          <li><span className="font-mono font-bold">len()</span> — פונקציה מובנית שסופרת כמה תווים יש במחרוזת (טקסט).</li>
          <li><span className="font-mono font-bold">if...else</span> — מריץ קטע קוד אחד אם תנאי נכון, וקטע אחר אם לא.</li>
        </ul>
        <p>
          כששתי אלה משולבות יחד — מקבלים פונקציה קטנה שמחזירה תשובה של <span className="font-bold">אמת/שקר (True/False)</span> לכל שאלה שאפשר לנסח כתנאי.
        </p>
      </ConceptIntro>

      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(124,92,255,0.08)", border: "1px solid rgba(124,92,255,0.22)" }}
      >
        <span className="text-[20px] shrink-0">🔐</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#5f3dff" }}>משימה מצוות האבטחה</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "#5a4636" }}>
            "צריך פונקציה שבודקת אם סיסמה מכילה 8 תווים או יותר, ומחזירה True/False."
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(90,60,20,0.14)" }}>
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#241e38" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff8a80" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffd580" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#a5f3b8" }} />
          <span className="text-[11px] mr-2" style={{ color: "#b8aee0" }}>password_check.py</span>
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#2b2540", color: "#eae6ff", fontFamily: "'JetBrains Mono', monospace" }} dir="ltr">
          <div>
            <span style={{ color: "#ff9df5" }}>def</span>
            {" password_check("}
            <span style={{ color: "#c9b8ff" }}>password</span>
            {"):"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#ff9df5" }}>if</span>
            {" "}
            <span style={{ color: "#7ee6ff" }}>len</span>
            {"("}
            <span style={{ color: "#c9b8ff" }}>password</span>
            {") >= "}
            <span style={{ color: "#ffd580" }}>8</span>
            {":"}
          </div>
          <div>
            {"        "}
            <span style={{ color: "#ff9df5" }}>return</span>
            {" "}
            <span style={{ color: "#ffd580" }}>True</span>
          </div>
          <div>
            {"    "}
            <span style={{ color: "#ff9df5" }}>else</span>
            {":"}
          </div>
          <div>
            {"        "}
            <span style={{ color: "#ff9df5" }}>return</span>
            {" "}
            <span style={{ color: "#ffd580" }}>False</span>
          </div>
        </div>
      </div>
      <div className="text-[11.5px] leading-[1.55] p-3 rounded-xl mb-5" style={{ background: "rgba(255,242,218,0.6)", color: "#5a4636" }}>
        `len()` סופרת כמה תווים יש במחרוזת.
      </div>

      <DeepDive title="האם 8 תווים באמת מספיק כדי לקבוע שסיסמה 'חזקה'?">
        <p className="mb-3">
          התשובה הכנה: לא ממש. `password_check` בודקת רק <span className="font-bold">אורך</span> — והסיסמה
          "<span className="font-mono">12345678</span>" עוברת אותה בקלות, למרות שהיא אחת הסיסמאות הכי נפוצות ופרוצות בעולם.
        </p>
        <p className="mb-3">
          מערכות אמיתיות מוסיפות בדיקות נוספות: האם יש גם אות גדולה, גם ספרה, גם תו מיוחד? בפייתון אמיתי עושים
          את זה עם ביטויים רגולריים (<span className="font-mono">regex</span>) או בדיקות נוספות בתוך אותה פונקציה —
          אבל העיקרון זהה: כל בדיקה היא עוד <span className="font-mono font-bold">if</span> שמצטרף לתנאי.
        </p>
        <p>
          שימי לב גם לגבול המדויק: <span className="font-mono">&gt;= 8</span> אומר "8 ומעלה, כולל 8 בדיוק". אם היינו
          כותבים <span className="font-mono">&gt; 8</span> (בלי ה-<span className="font-mono">=</span>), סיסמה בת
          8 תווים בדיוק הייתה נכשלת — טעות נפוצה מאוד שנקראת <span className="font-bold">off-by-one</span>.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — len() Function", url: "https://www.w3schools.com/python/ref_func_len.asp", kind: "article" },
          { label: "W3Schools — If...Else Statements", url: "https://www.w3schools.com/python/python_conditions.asp", kind: "article" },
          { label: "וידאו: If Elif Else Statements in Python", url: "https://www.youtube.com/watch?v=rvLpDfOi9pQ", kind: "video" },
        ]}
      />
    </div>
  ),
  question: 'מה תחזיר הקריאה password_check("1234")?',
  options: ["True", "False", "שגיאה — הקוד לא תקין"],
  correct: 1,
  okMsg: '`len("1234")` שווה 4 — קטן מ-8, אז התנאי `if` לא מתקיים, ואז מגיעים ל-`else` שמחזיר False.',
  errMsg: 'False — כי `len("1234")` הוא 4, וזה קטן מ-8. התנאי `if len(password) >= 8` נכשל, אז רצים ל-`else`.',
  learned: "len() סופרת תווים; if/else מחזיר True או False לפי התנאי",
  level: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8 — לולאת FOR שעוברת על כל תו במחרוזת
// ─────────────────────────────────────────────────────────────────────────────

const S8: ChoiceStep = {
  kind: "choice",
  tag: "לולאת FOR",
  concept: "מעבר על מחרוזת תו-אחר-תו",
  context: (
    <div>
      <ConceptIntro title="מעבר על מחרוזת תו-אחר-תו" icon="🔁">
        <p>
          <span className="font-bold" style={{ color: "#7c5cff" }}>לולאת FOR</span> היא אחד הכלים הכי שימושיים בתכנות: היא לוקחת רשימה (או מחרוזת) ורצה על כל איבר בה, אחד-אחד, ומריצה עליו את אותו קטע קוד.
        </p>
        <p>
          במקום לכתוב "בדוק אם התו הראשון הוא @, בדוק אם השני הוא @..." שוב ושוב — כותבים פעם אחת:
          {" "}<span className="font-bold">"עבור כל תו במחרוזת — בדוק אם הוא @"</span>. המחשב חוזר על זה בעצמו כמה פעמים שצריך.
        </p>
      </ConceptIntro>

      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(126,230,160,0.15)", border: "1px solid rgba(126,230,160,0.35)" }}
      >
        <span className="text-[20px] shrink-0">🕵️</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#219653" }}>אתגר בלשי</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "#5a4636" }}>
            מישהו הקליד "danaexample.com" בטעות — בלי @. איך התוכנה תדע שזה לא מייל תקין, בלי שתדעי מראש איפה ה-@ אמור להיות?
          </div>
        </div>
      </div>

      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "#5a4636" }}>
        עכשיו נבדוק אם למייל יש את התו <span className="font-bold" style={{ color: "#7c5cff" }}>"@"</span> — אבל אנחנו לא יודעים מראש איפה הוא נמצא במחרוזת.
      </p>
      <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(90,60,20,0.14)" }}>
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#241e38" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff8a80" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffd580" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#a5f3b8" }} />
          <span className="text-[11px] mr-2" style={{ color: "#b8aee0" }}>email_check.py</span>
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#2b2540", color: "#eae6ff", fontFamily: "'JetBrains Mono', monospace" }} dir="ltr">
          <div>
            <span style={{ color: "#ff9df5" }}>def</span>
            {" email_check("}
            <span style={{ color: "#c9b8ff" }}>email</span>
            {"):"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#c9b8ff" }}>at_sign</span>
            {" = "}
            <span style={{ color: "#ffd580" }}>False</span>
          </div>
          <div>
            {"    "}
            <span style={{ color: "#ff9df5" }}>for</span>
            {" "}
            <span style={{ color: "#c9b8ff" }}>char</span>
            {" "}
            <span style={{ color: "#ff9df5" }}>in</span>
            {" "}
            <span style={{ color: "#c9b8ff" }}>email</span>
            {":"}
          </div>
          <div>
            {"        "}
            <span style={{ color: "#ff9df5" }}>if</span>
            {" "}
            <span style={{ color: "#c9b8ff" }}>char</span>
            {" == "}
            <span style={{ color: "#a5f3b8" }}>"@"</span>
            {":"}
          </div>
          <div>
            {"            "}
            <span style={{ color: "#c9b8ff" }}>at_sign</span>
            {" = "}
            <span style={{ color: "#ffd580" }}>True</span>
          </div>
          <div>
            {"    "}
            <span style={{ color: "#ff9df5" }}>return</span>
            {" "}
            <span style={{ color: "#c9b8ff" }}>at_sign</span>
          </div>
        </div>
      </div>

      <DeepDive title="יש דרך קצרה יותר, וגם — הפתרון הזה לא מושלם">
        <p className="mb-3">
          פייתון בעצם נותנת קיצור מובנה בדיוק לזה: <span className="font-mono font-bold">if "@" in email:</span>
          {" "}עושה בדיוק את מה שהלולאה עושה, בשורה אחת. זה נקרא סגנון <span className="font-bold">"Pythonic"</span> —
          קצר וקריא. אז למה בכלל ללמד את הלולאה? כי היא מראה לך <span className="font-bold">מה קורה מאחורי הקלעים</span>{" "}
          כש-Python "מחפשת" תו במחרוזת — וההבנה הזאת תשרת אותך גם כשתצטרכי לעשות משהו שאין לו קיצור מוכן.
        </p>
        <p>
          שימי לב גם למגבלה: הקוד הנוכחי רק בודק שיש @ <span className="font-bold">איפשהו</span> — מייל כמו
          "<span className="font-mono">a@@b</span>" (שתי שקדות @) או "<span className="font-mono">@b.com</span>"
          (בלי שם לפני ה-@) יעברו את הבדיקה הזו בהצלחה, למרות שהם לא מיילים תקינים. בעולם האמיתי בודקים גם
          שיש בדיוק @ אחד, שיש טקסט לפניו ואחריו, ושיש נקודה בחלק שאחרי ה-@.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python For Loops", url: "https://www.w3schools.com/python/python_for_loops.asp", kind: "article" },
          { label: "וידאו: For Loops in Python are Easy", url: "https://www.youtube.com/watch?v=KWgYha0clzw", kind: "video" },
        ]}
      />
    </div>
  ),
  question: 'למה צריך לולאת FOR שעוברת על כל תו, ולא מספיק לבדוק רק תו אחד קבוע במייל?',
  options: [
    "כי ה-'@' יכול להימצא בכל מיקום שונה בכל מייל — לא ידוע מראש איפה",
    "כי Python לא יודעת לקרוא מחרוזות בלי לולאה",
    "כי לולאה רצה יותר מהר מבדיקה בודדת",
  ],
  correct: 0,
  okMsg: "בדיוק! ל-'name@domain.com' יש @ במיקום 4, ול-'a@b.com' במיקום 1. הלולאה בודקת כל תו בתורו כדי לא לפספס אותו לא משנה איפה הוא.",
  errMsg: "התשובה: מיקום ה-'@' משתנה מכתובת מייל אחת לשנייה — אין לו מיקום קבוע. לכן הלולאה עוברת על כל תו כדי לוודא שלא מפספסים אותו.",
  learned: "לולאת FOR עוברת על כל איבר במחרוזת בנפרד — שימושי כשלא יודעים מראש איפה למצוא משהו",
  level: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8.5 — משחק התאמה: מילות מפתח
// ─────────────────────────────────────────────────────────────────────────────

const S_MATCH1: MatchStep = {
  kind: "match",
  tag: "משחק התאמה",
  concept: "חזרה על מילות המפתח שלמדנו",
  context: (
    <div>
      <ConceptIntro title="חזרה על מילות המפתח שלמדנו" icon="🧠">
        <p>
          עד עכשיו פגשת ארבע מילות מפתח (keywords) שחוזרות בכל פונקציית בדיקה בפייתון. הן לא סתם מילים — כל אחת היא הוראה מדויקת למחשב, ובלעדיה הקוד פשוט לא ירוץ.
        </p>
        <p>
          לפני שממשיכים לשלב הבא — בואי נוודא שהמונחים יושבים טוב. לחצי על מילת מפתח משמאל, ואז על התפקיד המתאים לה מימין.
        </p>
      </ConceptIntro>

      <DeepDive title="keyword או פונקציה? יש הבדל, וזה חשוב">
        <p className="mb-3">
          שלוש מהמילים ששיחקת איתן — <span className="font-mono font-bold">def</span>,{" "}
          <span className="font-mono font-bold">return</span> ו-<span className="font-mono font-bold">for</span> — הן
          {" "}<span className="font-bold">מילות מפתח שמורות (keywords)</span> חלק משפת פייתון עצמה. בגלל זה
          אי אפשר לקרוא למשתנה <span className="font-mono">def = 5</span> — Python תזרוק שגיאה, כי המילה כבר תפוסה.
        </p>
        <p>
          <span className="font-mono font-bold">len()</span> לעומת זאת היא <span className="font-bold">פונקציה מובנית</span>{" "}
          (built-in function) — לא מילת מפתח. ההבדל הזה לא משנה לשימוש היומיומי, אבל הוא כן משנה אם אי פעם תרצי לדעת
          למה אפשר לכתוב <span className="font-mono">my_len = len</span> (להעתיק פונקציה למשתנה) אבל אי אפשר לעשות
          את זה עם <span className="font-mono">for</span> או <span className="font-mono">def</span>. בפייתון יש כ-35
          מילות מפתח שמורות בסך הכול — כדאי להכיר את הרשימה כדי לא "להיתקע" בהן בטעות בתור שם משתנה.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python Functions", url: "https://www.w3schools.com/python/python_functions.asp", kind: "article" },
          { label: "W3Schools — def Keyword", url: "https://www.w3schools.com/python/ref_keyword_def.asp", kind: "article" },
          { label: "וידאו: Functions in Python are Easy", url: "https://www.youtube.com/watch?v=89cGQjB5R4M", kind: "video" },
        ]}
      />
    </div>
  ),
  instruction: "התאימי כל מילת מפתח לתפקיד שלה:",
  pairs: [
    { left: "def", right: "מגדירה פונקציה חדשה" },
    { left: "return", right: "מחזירה תוצאה החוצה מהפונקציה" },
    { left: "len()", right: "סופרת כמה תווים יש במחרוזת" },
    { left: "for", right: "עוברת על כל תו/איבר בתורו" },
  ],
  okMsg: "כל הכבוד — ארבע מילות המפתח האלה הן הבסיס לכל פונקציית בדיקה שתכתבי מעכשיו.",
  errMsg: "כמעט! נסי שוב — כל מילת מפתח מתאימה לתפקיד אחד בלבד.",
  learned: "def / return / len() / for — ארבע אבני היסוד של פונקציית בדיקה",
  level: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9 — שילוב שתי בדיקות עם and
// ─────────────────────────────────────────────────────────────────────────────

const S9: ChoiceStep = {
  kind: "choice",
  tag: "שילוב תנאים",
  concept: "and — שתי בדיקות ביחד",
  context: (
    <div>
      <ConceptIntro title="and — שתי בדיקות ביחד" icon="🔗">
        <p>
          עד עכשיו כתבנו שתי פונקציות נפרדות — אחת בודקת מייל, אחת בודקת סיסמה. אבל כדי להתחבר לאתר, <span className="font-bold" style={{ color: "#7c5cff" }}>שתיהן</span> צריכות להיות תקינות.
        </p>
        <p>
          מילת המפתח <span className="font-mono font-bold">and</span> היא בדיוק הכלי לזה: היא מחברת שני תנאים לתנאי אחד גדול, שנכון (True) רק אם <span className="font-bold">שני הצדדים</span> שלו נכונים. אם ולו צד אחד הוא False — כל התנאי המשולב הופך ל-False, גם אם הצד השני היה תקין לגמרי.
        </p>
      </ConceptIntro>

      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(124,92,255,0.08)", border: "1px solid rgba(124,92,255,0.22)" }}
      >
        <span className="text-[20px] shrink-0">🔒</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#5f3dff" }}>מנעול כפול על הדלת</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "#5a4636" }}>
            תחשבי על דלת עם שני מנעולים — צריך לפתוח את שניהם כדי להיכנס. גם אם פתחת מנעול אחד מושלם, אם השני נעול — הדלת עדיין סגורה.
          </div>
        </div>
      </div>

      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "#5a4636" }}>
        עכשיו נחבר את שתי הפונקציות למסך התחברות אמיתי:
      </p>
      <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(90,60,20,0.14)" }}>
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#241e38" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff8a80" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffd580" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#a5f3b8" }} />
          <span className="text-[11px] mr-2" style={{ color: "#b8aee0" }}>login.py</span>
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#2b2540", color: "#eae6ff", fontFamily: "'JetBrains Mono', monospace" }} dir="ltr">
          <div>
            <span style={{ color: "#ff9df5" }}>if</span>
            {" "}
            <span style={{ color: "#7ee6ff" }}>email_check</span>
            {"("}
            <span style={{ color: "#c9b8ff" }}>email</span>
            {") "}
            <span style={{ color: "#ff9df5" }}>and</span>
            {" "}
            <span style={{ color: "#7ee6ff" }}>password_check</span>
            {"("}
            <span style={{ color: "#c9b8ff" }}>password</span>
            {"):"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#7ee6ff" }}>print</span>
            {"("}
            <span style={{ color: "#a5f3b8" }}>"Login OK!"</span>
            {")"}
          </div>
          <div>
            <span style={{ color: "#ff9df5" }}>else</span>
            {":"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#7ee6ff" }}>print</span>
            {"("}
            <span style={{ color: "#a5f3b8" }}>"Check your credentials!"</span>
            {")"}
          </div>
        </div>
      </div>

      <DeepDive title="פייתון לפעמים לא בכלל טורחת לבדוק את הצד השני — למה?">
        <p className="mb-3">
          זה נקרא <span className="font-bold">short-circuit evaluation</span> ("הערכת מעגל קצר"): פייתון בודקת
          תנאים מ<span className="font-bold">שמאל לימין</span>, ועוצרת ברגע שהיא כבר יודעת את התשובה הסופית. אם
          {" "}<span className="font-mono">email_check(email)</span> מחזירה <span className="font-mono">False</span>,
          פייתון כבר יודעת ש-<span className="font-mono">and</span> חייב להיות False — ולכן היא{" "}
          <span className="font-bold">אפילו לא מריצה</span> את <span className="font-mono">password_check(password)</span>!
        </p>
        <p>
          זה לא רק אופטימיזציה — לפעמים זה קריטי. תארי לך פונקציה שבודקת קודם "האם המשתמש קיים" ורק אז "האם הסיסמה
          שלו נכונה". אם לא היה short-circuit, הקוד היה יכול לנסות לבדוק סיסמה למשתמש שלא קיים בכלל ולקרוס. הטבלה
          המלאה של <span className="font-mono font-bold">and</span>: True and True → True. כל שילוב אחר → False.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python Logical Operators", url: "https://www.w3schools.com/python/python_if_logical.asp", kind: "article" },
          { label: "W3Schools — If AND", url: "https://www.w3schools.com/python/gloss_python_if_and.asp", kind: "article" },
          { label: "וידאו: Logical Operators in Python are Easy", url: "https://www.youtube.com/watch?v=W7luvtXeQTA", kind: "video" },
        ]}
      />
    </div>
  ),
  question: "email_check מחזירה True, אבל password_check מחזירה False. מה יודפס?",
  options: ['"Login OK!"', '"Check your credentials!"', "שתי ההודעות יחד"],
  correct: 1,
  okMsg: '`and` מחזיר True רק אם שני הצדדים True. פה password_check החזירה False — אז כל הביטוי False, ורצים ל-else.',
  errMsg: '"Check your credentials!" — `and` דורש ששני התנאים יהיו True יחד. אם רק אחד מהם False, כל התנאי נופל ל-else.',
  learned: "and מחזיר True רק אם כל התנאים בו מתקיימים יחד",
  level: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9.5 — סדרי את שורות הפונקציה login_check
// ─────────────────────────────────────────────────────────────────────────────

const S_SEQ2: SequenceStep = {
  kind: "sequence",
  tag: "הרכבת קוד",
  concept: "סדר השורות בפונקציה משנה הכל",
  context: (
    <div>
      <ConceptIntro title="סדר השורות בפונקציה משנה הכל" icon="🧱">
        <p>
          כל פונקציה בפייתון בנויה לפי מבנה קבוע, ובלי לשמור על הסדר הזה הקוד פשוט לא יעבוד:
        </p>
        <ol className="flex flex-col gap-[6px] pr-4 list-decimal">
          <li><span className="font-mono font-bold">def</span> — מגדיר את שם הפונקציה והמשתנים שהיא מקבלת</li>
          <li><span className="font-mono font-bold">if</span> — תנאי שבודק משהו</li>
          <li><span className="font-mono font-bold">return</span> — מחזיר תוצאה, בהתאם לתוצאה של התנאי</li>
        </ol>
      </ConceptIntro>

      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(255,207,112,0.18)", border: "1px solid rgba(255,207,112,0.30)" }}
      >
        <span className="text-[20px] shrink-0">🧩</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#8a5a12" }}>פאזל בקופסה</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "#5a4636" }}>
            קיבלת ארבע חתיכות קוד בערבוביה, בלי הוראות הרכבה. כל מה שיש לך זה ההיגיון של פייתון עצמה.
          </div>
        </div>
      </div>

      <p className="text-[13px] leading-[1.65] mb-4" style={{ color: "#5a4636" }}>
        עכשיו תורך לבנות פונקציה שלמה. השורות הבאות התערבבו — סדרי אותן לפי ההיגיון הנכון של <span className="font-mono font-bold" dir="ltr">login_check</span>:
      </p>

      <DeepDive title="מה קורה אם שוכחים return בכלל?">
        <p className="mb-3">
          נניח שכתבת פונקציה שלמה בלי אף <span className="font-mono font-bold">return</span> — פייתון לא תזרוק
          שגיאה! היא פשוט תחזיר <span className="font-mono font-bold">None</span> (ערך שמייצג "כלום") בשקט. זו
          אחת הסיבות הכי נפוצות ל-"באג שקט" — קוד שרץ בלי קריסה, אבל מחזיר תשובה לא נכונה.
        </p>
        <p>
          שימי לב גם ש-<span className="font-mono">login_check</span> יכולה לצאת דרך שני נתיבי{" "}
          <span className="font-mono font-bold">return</span> שונים — אחד בתוך ה-if ואחד מחוצה לו. זה נקרא
          {" "}<span className="font-bold">early return</span>, וזה בדיוק אותו רעיון שראית ב-<span className="font-mono">password_check</span>{" "}
          וב-<span className="font-mono">email_check</span> — ברגע שיש תשובה, יוצאים מהפונקציה, בלי להמשיך לרוץ.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python Functions", url: "https://www.w3schools.com/python/python_functions.asp", kind: "article" },
          { label: "Python Docs — Defining Functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions", kind: "article" },
          { label: "וידאו: Functions in Python are Easy", url: "https://www.youtube.com/watch?v=89cGQjB5R4M", kind: "video" },
        ]}
      />
    </div>
  ),
  instruction: "לחצי לפי הסדר הנכון:",
  items: [
    'return "Check your credentials!"',
    "def login_check(email, password):",
    'return "Login OK!"',
    "if email_check(email) and password_check(password):",
  ],
  correctOrder: [1, 3, 2, 0],
  okMsg: 'מצוין! קודם מגדירים את הפונקציה (def), אז בודקים את התנאי (if), ואז — בהתאם לתוצאה — מחזירים "Login OK!" או נופלים ל-"Check your credentials!".',
  errMsg: "הסדר הנכון: def login_check(...) → if email_check(...) and password_check(...): → return \"Login OK!\" → return \"Check your credentials!\". חייבים להגדיר את הפונקציה לפני שבודקים תנאי בתוכה.",
  learned: "פונקציה = def בראש, תנאי באמצע, return בסוף לכל מקרה",
  level: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9.7 — השלמה בהקלדה: המילה החסרה בתנאי המשולב
// ─────────────────────────────────────────────────────────────────────────────

const S_TYPE2: TypeStep = {
  kind: "type",
  tag: "השלימי בעצמך",
  concept: "הקלדה חופשית — לא רק בחירה",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-3" style={{ color: "#5a4636" }}>
        בשלב הקודם ראית איך <span className="font-mono font-bold">and</span> מחבר שני תנאים לתנאי אחד — עכשיו בואי נבדוק שזה נטמע. הפעם בלי אפשרויות לבחור מהן — תכתבי את המילה בעצמך.
      </p>
      <div className="rounded-2xl overflow-hidden mb-3" style={{ boxShadow: "0 4px 20px rgba(90,60,20,0.14)" }}>
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#241e38" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff8a80" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffd580" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#a5f3b8" }} />
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#2b2540", color: "#eae6ff", fontFamily: "'JetBrains Mono', monospace" }} dir="ltr">
          <div>
            <span style={{ color: "#ff9df5" }}>if</span>
            {" email_check(email) "}
            <span
              className="rounded px-1"
              style={{ background: "rgba(255,207,112,0.35)", color: "#ff7a59", border: "1.5px dashed #ff7a59" }}
            >
              ___
            </span>
            {" password_check(password):"}
          </div>
        </div>
      </div>

      <DeepDive title="ומה אם יש יותר משתי בדיקות?">
        <p>
          עם שתי בדיקות, <span className="font-mono font-bold">and</span> נוח. אבל מה אם צריך לבדוק חמישה תנאים
          יחד? לכתוב <span className="font-mono">a and b and c and d and e</span> עובד, אבל נהיה מסורבל. פייתון
          נותנת כלי מובנה בדיוק לזה: <span className="font-mono font-bold">all([a, b, c, d, e])</span> — מחזיר
          True רק אם <span className="font-bold">כל</span> האיברים ברשימה הם True. זה אותו עיקרון בדיוק כמו
          {" "}<span className="font-mono">and</span>, רק שמתאים גם כשיש הרבה תנאים.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python Logical Operators", url: "https://www.w3schools.com/python/python_if_logical.asp", kind: "article" },
          { label: "וידאו: Logical Operators in Python are Easy", url: "https://www.youtube.com/watch?v=W7luvtXeQTA", kind: "video" },
        ]}
      />
    </div>
  ),
  question: "איזו מילה חסרה כדי ששתי הבדיקות יידרשו יחד?",
  accepted: ["and"],
  placeholder: "כתבי את המילה כאן (אנגלית)",
  okMsg: '`and` — בדיוק המילה שדורשת ששני התנאים יהיו True יחד כדי להיכנס ל-if.',
  errMsg: 'המילה הנכונה היא `and`. רק היא דורשת ששני הצדדים יהיו True בו-זמנית.',
  learned: "and הוא מילת המפתח שמחברת שני תנאים לבדיקה משותפת",
  level: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10 — בונוס למתקדמים: הודעת שגיאה מדויקת
// ─────────────────────────────────────────────────────────────────────────────

const S10: ChoiceStep = {
  kind: "choice",
  tag: "בונוס למתקדמים",
  concept: "if/elif — הודעה מדויקת במקום הודעה כללית",
  context: (
    <div>
      <ConceptIntro title="if/elif — הודעה מדויקת במקום הודעה כללית" icon="🪜">
        <p>
          <span className="font-mono font-bold">if</span> תמיד נבדק ראשון. <span className="font-mono font-bold">elif</span> ("else if") הוא תנאי נוסף שנבדק <span className="font-bold" style={{ color: "#7c5cff" }}>רק אם</span> ה-if שלפניו נכשל — כמו שאלת המשך שנשאלת רק אם התשובה הראשונה הייתה "לא". אפשר לשרשר כמה elif שרוצים, וכל אחד נבדק רק אם כל מה שקדם לו נכשל.
        </p>
        <p>
          זה שונה מהותית מ-<span className="font-mono font-bold">and</span>: עם <span className="font-mono">and</span> מקבלים תשובה אחת ("תקין" / "לא תקין"), עם <span className="font-mono">if/elif</span> אפשר לתת <span className="font-bold">הודעה שונה לכל מקרה כשל בנפרד</span>.
        </p>
      </ConceptIntro>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(255,207,112,0.18)", border: "1px solid rgba(255,207,112,0.30)" }}
      >
        <span className="text-[20px] shrink-0">🎯</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#8a5a12" }}>בקשה מהתמיכה</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "#5a4636" }}>
            "'Check your credentials!' לא עוזר למשתמש — הוא לא יודע אם הטעות במייל או בסיסמה. אפשר לדייק?"
          </div>
        </div>
      </div>
      <p className="text-[13px] leading-[1.65] mb-5" style={{ color: "#5a4636" }}>
        כרגע יש רק בדיקה אחת משולבת עם <span className="font-mono font-bold">and</span> — אין דרך לדעת איזה חלק נכשל.
      </p>

      <DeepDive title="רגע — האם לדייק את ההודעה זה תמיד רעיון טוב?">
        <p className="mb-3">
          דווקא לא, ולא סתם: אתרים אמיתיים (בנקים, ג'ימייל, פייסבוק) <span className="font-bold">מתכוונים</span>{" "}
          לכתוב הודעה מעורפלת כמו "Check your credentials!" בכל מסך התחברות, ולא "האימייל לא קיים במערכת" או
          "הסיסמה שגויה". הסיבה: אם תוקף מנסה לנחש כתובות מייל של משתמשים אמיתיים, הודעה מדויקת "האימייל לא קיים"
          הייתה נותנת לו בדיוק את המידע שהוא צריך — אילו כתובות מייל <span className="font-bold">כן</span> רשומות
          במערכת. זה נקרא <span className="font-bold">user enumeration</span>, ונחשב פרצת אבטחה אמיתית.
        </p>
        <p>
          אז למה בכל זאת לומדים את זה? כי אותו רעיון בדיוק (if/elif עם הודעה שונה לכל מקרה) חשוב ומועיל מאוד
          {" "}<span className="font-bold">בטופסי הרשמה</span> (איפה שאין בעיה לומר "המייל כבר תפוס" או "הסיסמה
          קצרה מדי") — פשוט לא במסך התחברות. זו דוגמה טובה לכך שבתכנות הפתרון הטכני הנכון תלוי בהקשר, לא רק בקוד עצמו.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python Elif Statement", url: "https://www.w3schools.com/python/python_if_elif.asp", kind: "article" },
          { label: "W3Schools — If Elif Else", url: "https://www.w3schools.com/python/gloss_python_elif.asp", kind: "article" },
          { label: "וידאו: If Elif Else Statements in Python", url: "https://www.youtube.com/watch?v=rvLpDfOi9pQ", kind: "video" },
        ]}
      />
    </div>
  ),
  question: "מה השינוי הנדרש כדי שההודעה תציין בדיוק אם הבעיה במייל או בסיסמה?",
  options: [
    "לבדוק כל תנאי בנפרד עם if/elif נפרדים, ולהדפיס הודעה שונה לכל מקרה כשל",
    "להוסיף עוד לולאת FOR לבדיקת המייל",
    "להחליף את and ב-or כדי שתמיד יודפס Login OK",
  ],
  correct: 0,
  okMsg: 'נכון! `if not email_check(email): print("בעיה במייל")` ואז `elif not password_check(password): print("בעיה בסיסמה")` ואז `else: print("Login OK!")` — כל מקרה מקבל הודעה משלו.',
  errMsg: 'התשובה: לפרק את הבדיקה המשולבת ל-if/elif נפרדים — כל תנאי נבדק בעצמו ומדפיס הודעה ייעודית, במקום הודעה כללית אחת ל-and.',
  learned: "if/elif נפרדים מאפשרים לדייק את הודעת השגיאה במקום הודעה כללית אחת",
  level: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10.5 — משחק התאמה: תרחיש → הודעה נכונה
// ─────────────────────────────────────────────────────────────────────────────

const S_MATCH3: MatchStep = {
  kind: "match",
  tag: "משחק התאמה",
  concept: "if/elif בפעולה — כל תרחיש וההודעה שלו",
  context: (
    <div>
      <ConceptIntro title="if/elif בפעולה — כל תרחיש וההודעה שלו" icon="🎲">
        <p>
          זו הבחינה האמיתית של if/elif/else: לדמיין בראש איך התוכנית "רצה" על כל שילוב אפשרי של תוצאות, בלי להריץ אותה בפועל. זו בדיוק היכולת שמפתחים משתמשים בה כל יום — לקרוא קוד ולנבא מה יקרה, לפני שמריצים אותו.
        </p>
        <p>
          אחרי השדרוג ל-if/elif, לכל שילוב תוצאות יש הודעה משלו. התאימי כל תרחיש להודעה שתודפס בפועל:
        </p>
      </ConceptIntro>

      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(124,92,255,0.08)", border: "1px solid rgba(124,92,255,0.25)" }}
      >
        <span className="text-[20px] shrink-0">🎮</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#5f3dff" }}>סימולטור בראש</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "#5a4636" }}>
            בלי מחשב, בלי להריץ כלום — רק את, הקוד, והדמיון. ככה בודקים קוד "על הנייר" גם בראיונות עבודה.
          </div>
        </div>
      </div>

      <DeepDive title="למה זו בדיוק המיומנות שבודקים בראיונות עבודה?">
        <p>
          לקרוא קוד ולדעת לחזות מה יקרה בלי להריץ אותו נקרא <span className="font-bold">"tracing" (מעקב קוד)</span>,
          וזו אחת המיומנויות הכי נבדקות בראיונות למפתחי תוכנה — הרבה יותר מ"לשנן syntax". כשמראיינת נותנת לך קוד
          ושואלת "מה ידפיס?", היא בעצם בודקת בדיוק את מה שעשית עכשיו: לעקוב אחרי if, לדעת מתי elif "מדלג", ולחזות
          תוצאה נכונה. ככל שתתרגלי יותר תרגילים כאלה — כך יהיה לך קל יותר גם לדבג קוד אמיתי שכתבת בעצמך.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python Elif Statement", url: "https://www.w3schools.com/python/python_if_elif.asp", kind: "article" },
          { label: "וידאו: Python Elif and Logical Expressions — Visually Explained", url: "https://www.youtube.com/watch?v=BmEYxeuHg58", kind: "video" },
        ]}
      />
    </div>
  ),
  instruction: "התאימי תרחיש להודעה הנכונה:",
  pairs: [
    { left: "email_check=False, password_check=True", right: "בעיה במייל" },
    { left: "email_check=True, password_check=False", right: "בעיה בסיסמה" },
    { left: "email_check=True, password_check=True", right: "Login OK!" },
  ],
  okMsg: "בדיוק! הבדיקה הראשונה שנכשלת (if, ואז elif) קובעת איזו הודעה תודפס — וכשהכל True, מגיעים ל-else עם Login OK!.",
  errMsg: "נסי שוב — זכרי: if בודק מייל קודם, elif בודק סיסמה רק אם המייל תקין, ו-else רץ רק כששניהם תקינים.",
  learned: "if רץ ראשון, elif רק אם if נכשל, else רק אם כולם נכשלו/עברו",
  level: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10.7 — השלמה בהקלדה: מילת המפתח החסרה
// ─────────────────────────────────────────────────────────────────────────────

const S_TYPE3: TypeStep = {
  kind: "type",
  tag: "השלימי בעצמך",
  concept: "elif — בדיקה נוספת רק אם הקודמת נכשלה",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-3" style={{ color: "#5a4636" }}>
        זכרי מהשלב הקודם: <span className="font-mono font-bold">elif</span> נבדק רק כש-if שלפניו נכשל. סוגרים חזק: מה המילה שמאפשרת לבדוק תנאי נוסף — רק אם התנאי הקודם נכשל?
      </p>
      <div className="rounded-2xl overflow-hidden mb-3" style={{ boxShadow: "0 4px 20px rgba(90,60,20,0.14)" }}>
        <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#241e38" }}>
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff8a80" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ffd580" }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#a5f3b8" }} />
        </div>
        <div className="p-4 font-mono text-[13px] leading-[2.2]" style={{ background: "#2b2540", color: "#eae6ff", fontFamily: "'JetBrains Mono', monospace" }} dir="ltr">
          <div>
            <span style={{ color: "#ff9df5" }}>if</span>
            {" not email_check(email):"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#7ee6ff" }}>print</span>
            {'("בעיה במייל")'}
          </div>
          <div>
            <span
              className="rounded px-1"
              style={{ background: "rgba(255,207,112,0.35)", color: "#ff7a59", border: "1.5px dashed #ff7a59" }}
            >
              ___
            </span>
            {" not password_check(password):"}
          </div>
          <div>
            {"    "}
            <span style={{ color: "#7ee6ff" }}>print</span>
            {'("בעיה בסיסמה")'}
          </div>
        </div>
      </div>

      <DeepDive title="כמה elif אפשר לשרשר? ומה קורה בלי else בסוף?">
        <p className="mb-3">
          אין הגבלה — אפשר לשרשר כמה <span className="font-mono font-bold">elif</span> שרוצים אחרי ה-if
          הראשון: קודם בודקים אם המייל תקין, אחר כך אם הסיסמה תקינה, ואפשר להוסיף עוד ועוד תנאים באותו אופן.
          פייתון בודקת אותם <span className="font-bold">בסדר שכתבת אותם</span>, ועוצרת בראשון שמתקיים.
        </p>
        <p>
          שימי לב: <span className="font-mono font-bold">else</span> בסוף השרשרת הוא <span className="font-bold">אופציונלי</span>.
          בלעדיו, אם אף תנאי לא מתקיים — פשוט לא קורה כלום, הקוד ממשיך הלאה בלי להדפיס שום דבר. זו סיבה נוספת
          לכתוב תמיד <span className="font-mono">else</span> בסוף, כדי לוודא שיש טיפול לכל מקרה אפשרי.
        </p>
      </DeepDive>

      <LearnMore
        resources={[
          { label: "W3Schools — Python Elif Statement", url: "https://www.w3schools.com/python/python_if_elif.asp", kind: "article" },
          { label: "וידאו: If Elif Else Statements in Python", url: "https://www.youtube.com/watch?v=rvLpDfOi9pQ", kind: "video" },
        ]}
      />
    </div>
  ),
  question: "מה כותבים במקום ה-___?",
  accepted: ["elif"],
  placeholder: "כתבי את המילה כאן (אנגלית)",
  okMsg: "`elif` — נבדק רק אם ה-if שלפניו נכשל. זה מה שמונע בדיקה כפולה ומיותרת של המייל.",
  errMsg: "המילה הנכונה היא `elif`. היא רצה רק כש-if הקודם החזיר False — בדיוק המקרה שבו המייל כבר תקין ורוצים לבדוק את הסיסמה.",
  learned: "elif נבדק רק אם התנאי הקודם נכשל — שרשרת בדיקות יעילה",
  level: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// ALL STEPS — code
// ─────────────────────────────────────────────────────────────────────────────

const STEPS_CODE: Step[] = [
  // S0, S1, S2, S3, S4, S5, S6, — קיים, הושבת זמנית
  S7, S8, S_MATCH1,             // רמה 1: היכרות עם len/for + חיזוק אוצר מילים
  S9, S_TYPE2, S_SEQ2,          // רמה 2: and → תרגול הקלדה קל → סינתזה של פונקציה שלמה
  S10, S_TYPE3, S_MATCH3,       // רמה 3: elif → תרגול הקלדה קל → יישום על כמה תרחישים יחד
];

// ─────────────────────────────────────────────────────────────────────────────
// STEPS — data  (דאטה ואנליטיקס)
// ─────────────────────────────────────────────────────────────────────────────

const DA0: ChoiceStep = {
  kind: "choice",
  tag: "נקודת פתיחה",
  concept: "מי מנתחת דאטה?",
  context: (
    <div>
      <div
        className="rounded-2xl p-4 mb-5 flex gap-4 items-start"
        style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.18)" }}
      >
        <div
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[22px] font-black text-white"
          style={{ background: "#0d9488", ...HEEBO }}
        >
          ת
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: "#0d9488" }}>תמר, 29, מאשדוד</div>
          <div className="text-[12.5px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            "לפני 4 שנים הייתי מזכירה. לא ידעתי מה זה SQL. היום אני מנתחת נתוני לקוחות ב-Waze ומרוויחה ₪21,000. לא צריך להיות גאון — צריך להיות סקרן."
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
        לפני שנגלה מה זה דאטה — שאלה אחת:
      </p>
    </div>
  ),
  question: "מה לדעתך מאפיין דאטה אנליסטית מצליחה?",
  options: [
    "כישרון גבוה במתמטיקה",
    "סקרנות + יכולת לספר סיפורים מתוך מספרים",
    "תואר בסטטיסטיקה",
  ],
  correct: 1,
  okMsg: "בדיוק! מנתחי דאטה לא רק מחשבים — הם מספרים. הם לוקחים מספרים יבשים והופכים אותם להחלטות. תמר הוכיחה שלא צריך תואר — צריך את הסקרנות הנכונה.",
  errMsg: "בעצם לא — הכישרון הכי חשוב הוא לדעת לשאול 'למה?' ולספר מה הנתונים מגלים. תמר למדה Excel ו-SQL תוך שנה ונכנסה לתחום ללא תואר.",
  learned: "דאטה אנליסטית = מסיפורת מספרים לבני אדם",
};

const DA1: ChoiceStep = {
  kind: "choice",
  tag: "סוגי נתונים",
  concept: "מספרים vs קטגוריות",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כל נתון הוא אחד משניים — <span className="font-bold" style={{ color: "#0d9488" }}>מספר</span> שאפשר לחשב עליו, או <span className="font-bold" style={{ color: "#023e8a" }}>קטגוריה</span> שמסווגת לקבוצה.
        <br /><span className="text-[12px]" style={{ color: "rgba(0,0,0,0.45)" }}>למה זה חשוב? כי כלי ניתוח שונים עובדים על סוגים שונים.</span>
      </p>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.18)" }}>
          <div className="text-[12px] font-bold mb-2" style={{ color: "#0d9488" }}>📊 נתון מספרי</div>
          <div className="text-[11.5px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.6)" }}>
            אפשר לחשב ממוצע, סכום, מינימום:<br />
            • גיל: 27<br />
            • מחיר: ₪299<br />
            • כמות לחיצות: 4,820
          </div>
        </div>
        <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}>
          <div className="text-[12px] font-bold mb-2" style={{ color: "#023e8a" }}>🏷️ נתון קטגורי</div>
          <div className="text-[11.5px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.6)" }}>
            אפשר לסווג ולספור לפי קבוצה:<br />
            • מין: נקבה<br />
            • צבע עיניים: חום<br />
            • סוג מכשיר: Android
          </div>
        </div>
      </div>
    </div>
  ),
  question: "כמה אנשים לחצו על כפתור ההרשמה — איזה סוג נתון זה?",
  options: [
    "קטגורי — כי לחיצה היא פעולה, לא מספר",
    "מספרי — אפשר לספור: 0, 1, 2, 3 לחיצות",
    "לא ניתן לסווג",
  ],
  correct: 1,
  okMsg: "נכון! ספירת לחיצות היא מספר שלם — 0, 1, 2... כשיודעים את סוג הנתון, יודעים איזה גרף לבנות ואיזה חישוב לעשות. זה הצעד הראשון בכל ניתוח.",
  errMsg: "ספירת לחיצות היא מספר שלם שאפשר לחשב עליו — לא ניתן ללחוץ 2.7 פעמים. לחיצה היא משהו שסופרים, לכן זה נתון מספרי.",
  learned: "נתון מספרי = ספירה ומדידה | קטגורי = סיווג לקבוצות",
};

const DA2: SequenceStep = {
  kind: "sequence",
  tag: "תהליך הניתוח",
  concept: "4 שלבי ניתוח דאטה",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כל פרויקט דאטה עובר <span className="font-bold" style={{ color: "#0d9488" }}>4 שלבים קבועים.</span>
        <br />כמו מתכון — הסדר קריטי.
      </p>
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}
      >
        <div className="text-[12px] font-bold mb-2" style={{ color: "#0d9488" }}>דוגמה: Waze רוצה להבין למה משתמשים עוזבים</div>
        <div className="text-[12px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.6)" }}>
          ❓ שואלים "למה?"<br />
          📥 אוספים נתוני שימוש<br />
          📊 מנתחים ומציגים<br />
          💡 מסיקים ומציעים פתרון
        </div>
      </div>
    </div>
  ),
  instruction: "סדרי את שלבי ניתוח הדאטה — לחצי לפי הסדר הנכון:",
  items: [
    "הצגת ממצאים והמלצות",
    "הגדרת השאלה שרוצים לענות עליה",
    "ניתוח הנתונים וזיהוי מגמות",
    "איסוף נתונים ממקורות שונים",
  ],
  correctOrder: [1, 3, 2, 0],
  okMsg: "מושלם! שאלה → איסוף → ניתוח → המלצה. זה הסדר שכל דאטה אנליסט עובד לפיו. בלי שאלה ברורה בהתחלה — הנתונים לא יגידו כלום.",
  errMsg: "הסדר הנכון: קודם מגדירים את השאלה ← אז אוספים נתונים ← מנתחים ← ומציגים. לא ניתן לאסוף נתונים לפני שיודעים מה מחפשים!",
  learned: "שאלה → איסוף → ניתוח → המלצה",
};

const DA3: ChoiceStep = {
  kind: "choice",
  tag: "KPI",
  concept: "מדדי הצלחה",
  context: (
    <div>
      <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.18)" }}>
        <div className="text-[11px] font-black mb-1" style={{ color: "#0d9488" }}>מה זה KPI?</div>
        <div className="text-[12px] leading-relaxed" style={{ color: "rgba(0,0,0,0.62)" }}>
          KPI = מדד ביצועים (ראשי תיבות של Key Performance Indicator).
          <br />בעברית פשוטה: <span className="font-bold">"המספר שמראה לנו אם אנחנו בדרך הנכונה."</span>
          <br /><span style={{ color: "rgba(0,0,0,0.45)" }}>כמו קצב לב — מדד שבוחנים כדי לדעת אם הכל בסדר.</span>
        </div>
      </div>
      <div className="text-[12.5px] font-bold mb-1" style={{ color: "#023e8a" }}>
        דוגמה: "משפך" של אפליקציה
      </div>
      <div className="text-[11.5px] mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
        "משפך" = הדרך שעושה הגולש מכניסה לאתר עד רכישה. בכל שלב — חלק עוזבים.
      </div>
      <div className="rounded-xl p-4" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}>
        {[
          { label: "נכנסו לאתר", val: "10,000", w: "100%", note: "" },
          { label: "נרשמו בחינם", val: "1,000", w: "20%", note: "⬇ 90% יצאו בלי להירשם" },
          { label: "שילמו בסוף", val: "100", w: "4%", note: "⬇ 90% מהנרשמים לא שילמו" },
        ].map((row) => (
          <div key={row.label} className="mb-3 last:mb-0">
            <div className="flex justify-between mb-1">
              <span className="text-[11.5px] font-bold" style={{ color: "#023e8a" }}>{row.label}</span>
              <span className="text-[11px]" style={{ color: "#0d9488" }}>{row.val}</span>
            </div>
            <div className="h-[7px] rounded-full" style={{ background: "rgba(13,148,136,0.1)" }}>
              <div className="h-full rounded-full" style={{ width: row.w, background: "#0d9488" }} />
            </div>
            {row.note && <div className="text-[10px] mt-0.5" style={{ color: "rgba(220,38,38,0.6)" }}>{row.note}</div>}
          </div>
        ))}
      </div>
    </div>
  ),
  question: "כמה אחוז מהנכנסים לאתר בסוף שילמו?",
  options: ["10% (1,000 מתוך 10,000)", "1% (100 מתוך 10,000)", "100% (כי כולם ראו)"],
  correct: 1,
  okMsg: "נכון! 100 ÷ 10,000 = 1%. זה נקרא 'אחוז המרה' (Conversion Rate — אחוז האנשים שעשו את הפעולה שרצינו). אם יעלה ל-2% — ההכנסה מוכפלת בלי להוציא יותר על פרסום. זה KPI שאנליסטית עוקבת אחריו כל יום.",
  errMsg: "100 מתוך 10,000 = 1%. זה נקרא 'אחוז המרה' (Conversion Rate). זה KPI קריטי — כי אם עולה ל-2%, ההכנסה מוכפלת. אנליסטיות מחפשות כל הזמן מה יכול להעלות אותו.",
  learned: "אחוז המרה (Conversion Rate) = משלמים ÷ כניסות × 100",
};

const DA4: ChoiceStep = {
  kind: "choice",
  tag: "ניתוח אמיתי",
  concept: "נתונים → סיפור → החלטה",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(251,133,0,0.08)", border: "1px solid rgba(251,133,0,0.22)" }}
      >
        <span className="text-[20px] shrink-0">📱</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#c2410c" }}>מקרה אמיתי: אפליקציית קריאה</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>
            Blinkist — אפליקציה שמוכרת סיכומי ספרים במנוי חודשי (כמו Spotify, רק לספרים במקום מוזיקה). השיקו עיצוב חדש ובאותו זמן העלו מחיר. אחרי חודש — ירידה חדה במנויים (אנשים שמשלמים כל חודש).
          </div>
        </div>
      </div>
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        <div className="text-[11.5px] font-bold mb-2" style={{ color: "#023e8a" }}>מה גילתה הדאטה:</div>
        <div className="text-[12px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.6)" }}>
          • המשתמשים שעזבו: זמן קריאה קצר יותר בממוצע<br />
          • סוג מכשיר: מסכים קטנים יותר<br />
          • המשתמשים שנשארו: מסכים גדולים
        </div>
      </div>
      <p className="text-[13px]" style={{ color: "rgba(0,0,0,0.55)" }}>
        הניחוש הראשוני היה שהמחיר גרם לבריחה. אבל הדאטה סיפרה סיפור אחר...
      </p>
    </div>
  ),
  question: "מה הייתה המסקנה האמיתית?",
  options: [
    "העלאת המחיר גרמה לנטישה",
    "העיצוב החדש קשה לקריאה על מסכים קטנים",
    "המשתמשים העדיפו את האפליקציה הישנה",
  ],
  correct: 1,
  okMsg: "בדיוק! הנתונים הראו שמסכים קטנים = גופן קטן מדי בעיצוב החדש = עזיבה. Blinkist תיקנו את העיצוב ושלחו הנחה למשתמשים שעזבו. הדאטה הצילה את החברה.",
  errMsg: "המחיר לא היה הגורם! הדאטה הראתה שבדיוק משתמשי מסכים קטנים עזבו — בגלל שהטקסט בעיצוב החדש היה קטן מדי. בלי ניתוח דאטה, היו מורידים מחיר לשווא.",
  learned: "דאטה חושפת את ה'למה' האמיתי — לא רק את ה'מה'",
};

const DA5: ChoiceStep = {
  kind: "choice",
  tag: "CAC",
  concept: "עלות רכישת לקוח",
  context: (
    <div>
      <div className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(0,0,0,0.65)" }}>
        כמה עולה לחברה <span className="font-bold" style={{ color: "#0d9488" }}>להביא לקוח חדש</span>?
        <br />המספר הזה נקרא <span className="font-bold" style={{ color: "#0d9488" }}>CAC</span> — קיצור של Customer Acquisition Cost (עלות רכישת לקוח בעברית).
      </div>

      {/* Formula — Option B: clean fraction */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(2,62,138,0.05)", border: "1.5px solid rgba(2,62,138,0.12)" }}>
        <div className="text-[10.5px] font-black text-center mb-3" style={{ color: "#023e8a" }}>הנוסחה:</div>
        <div dir="ltr" className="flex items-center justify-center gap-3">
          <span className="text-[15px] font-black" style={{ color: "#fb8500" }}>CAC</span>
          <span className="text-[15px] font-black" style={{ color: "#023e8a" }}>=</span>
          <div className="text-center">
            <div className="text-[13px] font-black pb-1.5" style={{ color: "#0d9488", borderBottom: "2px solid rgba(2,62,138,0.25)" }}>
              הוצאות שיווק ומכירות
            </div>
            <div className="text-[13px] font-black pt-1.5" style={{ color: "#023e8a" }}>
              מספר לקוחות חדשים
            </div>
          </div>
        </div>
      </div>

      {/* Concrete example */}
      <div className="rounded-xl p-4" style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.2)" }}>
        <div className="text-[10.5px] font-black mb-2" style={{ color: "#0d9488" }}>דוגמה:</div>
        <div className="text-[12.5px] leading-[1.9]" style={{ color: "rgba(0,0,0,0.65)" }}>
          חברה הוציאה <span className="font-bold">₪50,000</span> על שיווק החודש
          <br />ורכשה <span className="font-bold">100 לקוחות חדשים</span>
          <br />→ <span className="font-black" style={{ color: "#0d9488" }}>50,000 ÷ 100 = ₪500 ללקוח</span>
        </div>
      </div>
    </div>
  ),
  question: "מה ה-CAC של החברה?",
  options: ["₪50 ללקוח", "₪500 ללקוח", "₪5,000 ללקוח"],
  correct: 1,
  okMsg: "נכון! 50,000 ÷ 100 = ₪500 לכל לקוח. עכשיו השאלה: כמה הלקוח שווה לחברה לאורך הזמן שהוא לקוח? (זה נקרא LTV — סך ההכנסה הממוצעת מלקוח). אם הוא משלם ₪200 בחודש ונשאר 3 חודשים — LTV של ₪600. כלומר, שילמנו ₪500 להביא אותו, ועשינו ₪600 — כדאי!",
  errMsg: "50,000 ÷ 100 לקוחות = ₪500 לכל לקוח. זה ה-CAC. הכלל: CAC חייב להיות נמוך מה-LTV (סך מה שהלקוח ישלם לאורך הזמן שהוא לקוח שלנו). לקוח שעולה ₪500 לרכוש, ומכניס ₪2,000 — עסקה מצוינת.",
  learned: "CAC = הוצאות שיווק ÷ לקוחות חדשים",
};

const DA6: ChoiceStep = {
  kind: "choice",
  tag: "הטיית נתונים",
  concept: "דאטה יכולה לשקר",
  context: (
    <div>
      {/* Story */}
      <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(2,62,138,0.06)", border: "1px solid rgba(2,62,138,0.14)" }}>
        <div className="text-[13px] font-black mb-1" style={{ color: "#023e8a" }}>📊 הבוס מרוצה. האנליסטית — פחות.</div>
        <div className="text-[12px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
          מנהל מכירות הציג לדירקטוריון גרף שמראה <span className="font-bold" style={{ color: "#023e8a" }}>"זינוק עצום"</span> בינואר–מרץ. כולם מחאו כפיים.
          <br />האנליסטית שאלה בשקט: <span className="font-bold">"מה הציר האנכי מציג?"</span>
        </div>
      </div>

      {/* What is Y-axis */}
      <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.25)" }}>
        <div className="text-[11px] font-black mb-1.5" style={{ color: "#c96800" }}>📐 מה זה ציר Y?</div>
        <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.62)" }}>
          בכל גרף יש <span className="font-bold">ציר X</span> — האופקי (בדרך כלל זמן: ינואר, פברואר...) ו<span className="font-bold">ציר Y</span> — האנכי שמראה את הערכים (מכירות, משתמשים, רווח...).
          <br /><span className="font-bold" style={{ color: "#b91c1c" }}>הטריק:</span> אם ציר Y לא מתחיל מ-0, גם שינוי קטן ייראה ענקי.
        </div>
      </div>

      {/* Two SVG charts */}
      <div className="flex gap-2.5 mb-3">
        {/* Chart A — honest */}
        <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(13,148,136,0.07)", border: "1.5px solid rgba(13,148,136,0.28)" }}>
          <div className="text-[10.5px] font-black mb-0.5" style={{ color: "#0d9488" }}>גרף א׳ ✓ ישר</div>
          <div className="text-[9.5px] mb-2" style={{ color: "rgba(0,0,0,0.4)" }}>ציר Y: 0 עד 100</div>
          <svg viewBox="0 0 110 85" width="100%" style={{ display: "block" }}>
            <line x1="22" y1="4" x2="22" y2="68" stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>
            <line x1="22" y1="68" x2="108" y2="68" stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>
            <text x="20" y="70" textAnchor="end" fontSize="6.5" fill="rgba(0,0,0,0.38)">0</text>
            <text x="20" y="38" textAnchor="end" fontSize="6.5" fill="rgba(0,0,0,0.38)">50</text>
            <text x="20" y="8"  textAnchor="end" fontSize="6.5" fill="rgba(0,0,0,0.38)">100</text>
            <line x1="22" y1="36" x2="108" y2="36" stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="3,3"/>
            {/* bars: values 47, 49, 50 → heights 47%, 49%, 50% of 64px */}
            <rect x="30" y={68 - 47*64/100} width="18" height={47*64/100} fill="#0d9488" rx="2"/>
            <rect x="56" y={68 - 49*64/100} width="18" height={49*64/100} fill="#0d9488" rx="2"/>
            <rect x="82" y={68 - 50*64/100} width="18" height={50*64/100} fill="#0d9488" rx="2"/>
            <text x="39" y="79" textAnchor="middle" fontSize="6.5" fill="rgba(0,0,0,0.38)">ינו׳</text>
            <text x="65" y="79" textAnchor="middle" fontSize="6.5" fill="rgba(0,0,0,0.38)">פבר׳</text>
            <text x="91" y="79" textAnchor="middle" fontSize="6.5" fill="rgba(0,0,0,0.38)">מרץ</text>
          </svg>
          <div className="text-[9.5px] text-center mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>עלייה קטנה — נראית כך</div>
        </div>

        {/* Chart B — misleading */}
        <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(220,38,38,0.06)", border: "1.5px solid rgba(220,38,38,0.28)" }}>
          <div className="text-[10.5px] font-black mb-0.5" style={{ color: "#b91c1c" }}>גרף ב׳ ✗ מטעה</div>
          <div className="text-[9.5px] mb-2" style={{ color: "rgba(0,0,0,0.4)" }}>ציר Y: 47 עד 50 בלבד!</div>
          <svg viewBox="0 0 110 85" width="100%" style={{ display: "block" }}>
            <line x1="22" y1="4" x2="22" y2="68" stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>
            <line x1="22" y1="68" x2="108" y2="68" stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>
            <text x="20" y="70" textAnchor="end" fontSize="6.5" fill="rgba(0,0,0,0.38)">47</text>
            <text x="20" y="38" textAnchor="end" fontSize="6" fill="rgba(0,0,0,0.38)">48.5</text>
            <text x="20" y="8"  textAnchor="end" fontSize="6.5" fill="rgba(0,0,0,0.38)">50</text>
            <line x1="22" y1="36" x2="108" y2="36" stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="3,3"/>
            {/* break indicator: axis doesn't start at 0 */}
            <path d="M 15 65 L 19 62 L 15 59 L 19 56" stroke="#ef4444" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
            {/* bars: values 47,49,50; range=3; height=(v-47)*64/3 */}
            <rect x="30" y={68 - Math.max((47-47)*64/3, 3)} width="18" height={Math.max((47-47)*64/3, 3)} fill="#ef4444" rx="2"/>
            <rect x="56" y={68 - (49-47)*64/3}              width="18" height={(49-47)*64/3}               fill="#ef4444" rx="2"/>
            <rect x="82" y={68 - (50-47)*64/3}              width="18" height={(50-47)*64/3}               fill="#ef4444" rx="2"/>
            <text x="39" y="79" textAnchor="middle" fontSize="6.5" fill="rgba(0,0,0,0.38)">ינו׳</text>
            <text x="65" y="79" textAnchor="middle" fontSize="6.5" fill="rgba(0,0,0,0.38)">פבר׳</text>
            <text x="91" y="79" textAnchor="middle" fontSize="6.5" fill="rgba(0,0,0,0.38)">מרץ</text>
          </svg>
          <div className="text-[9.5px] text-center mt-0.5" style={{ color: "#b91c1c" }}>אותה עלייה — נראית ענקית!</div>
        </div>
      </div>

      <div className="text-[11.5px] text-center font-bold" style={{ color: "rgba(0,0,0,0.38)" }}>
        אותם מספרים בדיוק. שני גרפים שונים לגמרי.
      </div>
    </div>
  ),
  question: "מה דרך הפעולה הנכונה כשרואים גרף מרשים?",
  options: [
    "לסמוך על הגרף — הנתונים לא משקרים",
    "לבדוק את ציר ה-Y — אולי הגרף חתוך ומגזים",
    "לדרוש גרף יפה יותר",
  ],
  correct: 1,
  okMsg: "בדיוק! תמיד בודקים את ציר ה-Y. אם הוא מתחיל מ-47 ולא מ-0 — הגרף יכול להראות קפיצה דרמטית שבפועל היא שינוי זניח. זה אחד התפקידים של דאטה אנליסט — לחשוף הטיות.",
  errMsg: "נתונים יכולים להיות מוצגים בצורה מטעה — גרף שמתחיל מ-47 ולא מ-0 יראה שינוי קטן כאילו הוא ענק. תמיד בדקי את ציר Y לפני שמסיקים מסקנות!",
  learned: "תמיד בדקי את ציר Y — גרף יכול לרמות",
};

const STEPS_DATA: Step[] = [DA0, DA1, DA2, DA3, DA4, DA5, DA6];

// ─────────────────────────────────────────────────────────────────────────────
// STEPS — marketing  (שיווק דיגיטלי)
// ─────────────────────────────────────────────────────────────────────────────

const MK0: ChoiceStep = {
  kind: "choice",
  tag: "נקודת פתיחה",
  concept: "מי מנהלת שיווק דיגיטלי?",
  context: (
    <div>
      <div
        className="rounded-2xl p-4 mb-5 flex gap-4 items-start"
        style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)" }}
      >
        <div
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[22px] font-black text-white"
          style={{ background: "#f97316", ...HEEBO }}
        >
          ש
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: "#c2410c" }}>שלומית, 31, מבאר שבע</div>
          <div className="text-[12.5px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            "הייתי מורה לאנגלית. מצאתי קורס SEO בלינקדאין, לקחתי אותו בלילות. תוך שנה עבדתי בחברת SaaS על שיווק תוכן. היום ₪17,000 בחודש ועובדת מהבית."
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
        שיווק דיגיטלי = לחבר את המוצר הנכון לאנשים הנכונים, בזמן הנכון, במקום הנכון.
      </p>
    </div>
  ),
  question: "מה הכי חשוב בשיווק דיגיטלי?",
  options: [
    "לדעת לעצב פוסטים יפים",
    "להבין מי הלקוח וממה הוא סובל",
    "לכתוב קוד לקמפיינים",
  ],
  correct: 1,
  okMsg: "בדיוק! שיווק טוב מתחיל בלהבין את הלקוח — מה כואב לו, מה הוא רוצה, היכן הוא מבלה את הזמן שלו. רק אז ניתן לפנות אליו נכון.",
  errMsg: "הפוך — הסקיל הכי חשוב הוא להבין את הלקוח. עיצוב ועריכה ניתן ללמוד, אבל הבנה עמוקה של הלקוח היא מה שהופך שיווק לאפקטיבי.",
  learned: "שיווק = הבנת הלקוח + חיבור למוצר",
};

const MK1: ChoiceStep = {
  kind: "choice",
  tag: "משפך שיווקי",
  concept: "Prospects → Leads → Customers",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כל לקוח עובר דרך <span className="font-bold" style={{ color: "#f97316" }}>המשפך השיווקי</span> — מ"לא מכיר אותנו" עד "שילם":
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {[
          { label: "Prospects — קהל יעד רחב", sub: "כולל שרואה פרסום שלנו", w: "100%", color: "#f97316" },
          { label: "Leads — לידים", sub: "השאירו פרטים / לחצו", w: "35%", color: "#fb923c" },
          { label: "Opportunities — הזדמנויות", sub: "בשיחה פעילה עם מכירות", w: "15%", color: "#fdba74" },
          { label: "Customers — לקוחות", sub: "שילמו!", w: "6%", color: "#fed7aa" },
        ].map((row) => (
          <div key={row.label}>
            <div className="text-[11px] font-bold mb-1" style={{ color: "#c2410c" }}>{row.label}</div>
            <div
              className="h-[28px] rounded-lg flex items-center px-3"
              style={{ width: row.w, background: row.color, minWidth: 80 }}
            >
              <span className="text-[10px] text-white font-bold">{row.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "מישהי לחצה על מודעה ב-Facebook ונרשמה לניוזלטר שלנו, אך לא קנתה. היא:",
  options: ["Prospect — עוד לא מכירה אותנו", "Lead — הביעה עניין", "Customer — לקוחה"],
  correct: 1,
  okMsg: "נכון! היא Lead — הביעה עניין (נרשמה), אבל עוד לא קנתה. תפקיד המכירות: להוביל אותה מ-Lead ל-Customer.",
  errMsg: "היא Lead — היא כבר הביעה עניין (לחצה + נרשמה), אבל עוד לא הפכה ללקוחה. Prospect הייתה אם רק ראתה את המודעה ולא עשתה כלום.",
  learned: "Lead = הביע עניין | Customer = שילם",
};

const MK2: SequenceStep = {
  kind: "sequence",
  tag: "תהליך המכירה",
  concept: "4 שלבי מכירה",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כל עסקה — מהקטנה לגדולה — עוברת <span className="font-bold" style={{ color: "#f97316" }}>4 שלבים בסדר מסוים.</span>
      </p>
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}
      >
        <div className="text-[12px] font-bold mb-2" style={{ color: "#c2410c" }}>דוגמה: מכירת מנוי ל-SaaS</div>
        <div className="text-[11.5px] leading-[1.9]" style={{ color: "rgba(0,0,0,0.6)" }}>
          בודקים אם הלקוח מתאים (גודל, תקציב)<br />
          יוצרים קשר ראשוני<br />
          מדגימים את המוצר (Demo)<br />
          סוגרים עסקה וחותמים חוזה
        </div>
      </div>
    </div>
  ),
  instruction: "סדרי את שלבי המכירה — לחצי לפי הסדר הנכון:",
  items: [
    "הדגמת המוצר ללקוח (Demo)",
    "בדיקת הלקוח — האם הוא מתאים?",
    "סגירת העסקה",
    "יצירת קשר ראשוני",
  ],
  correctOrder: [1, 3, 0, 2],
  okMsg: "מעולה! בדיקה → קשר ראשוני → Demo → סגירה. אי אפשר להדגים מוצר לפני שיצרת קשר, ואי אפשר לסגור לפני שהדגמת. הסדר קריטי.",
  errMsg: "הסדר הנכון: קודם בודקים שהלקוח מתאים ← יוצרים קשר ← מדגימים ← סוגרים. לדלג על שלב = עסקה אבודה.",
  learned: "בדיקה → קשר → Demo → סגירה",
};

const MK3: ChoiceStep = {
  kind: "choice",
  tag: "PPC vs SEO",
  concept: "שתי דרכים להביא לקוחות",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כשמחפשת "נעלי ריצה" בגוגל, תראי שני סוגים של תוצאות — ורוב האנשים לא שמים לב להבדל:
      </p>

      {/* Google SERP mockup */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <span className="text-[16px]">🔍</span>
          <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: "#fff", border: "1px solid #e2e8f0", color: "rgba(0,0,0,0.65)" }}>נעלי ריצה</span>
        </div>
        {[
          { title: "Nike Running IL — נעלי ריצה מקצועיות", url: "nike.com › running", paid: true },
          { title: "Adidas ישראל — ריצה · חינמי מ-₪299",   url: "adidas.co.il",      paid: true },
          { title: "10 נעלי הריצה הטובות ביותר 2025 — ביקורות", url: "running-il.com", paid: false },
          { title: "השוואת נעלי ריצה | כל הסוגים עם מחירים",    url: "shoes-compare.co.il", paid: false },
        ].map((r, i, arr) => (
          <div key={i} className="px-4 py-3" style={{ background: "#fff", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              {r.paid && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(249,115,22,0.12)", color: "#c2410c", border: "1px solid rgba(249,115,22,0.25)" }}>ממומן — PPC</span>
              )}
              {!r.paid && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(2,62,138,0.07)", color: "#1d4ed8", border: "1px solid rgba(2,62,138,0.15)" }}>אורגני — SEO</span>
              )}
              <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>{r.url}</span>
            </div>
            <div className="text-[12px] font-bold" style={{ color: "#1a0dab" }}>{r.title}</div>
          </div>
        ))}
      </div>

      {/* PPC */}
      <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}>
        <div className="flex flex-wrap items-baseline gap-x-2 mb-2">
          <span className="text-[15px] font-black" style={{ color: "#c2410c" }}>PPC</span>
          <span className="text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.45)" }}>Pay Per Click — תשלום על כל לחיצה</span>
        </div>
        <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
          📌 מציבים מודעה בגוגל ומשלמים <strong>רק כשמישהו לוחץ</strong> — בין ₪0.50 ל-₪50 ללחיצה.<br />
          ✓ מתחיל לעבוד מרגע שהעלית את הקמפיין<br />
          ✗ ברגע שהתקציב נגמר — נעלם
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
        <div className="flex flex-wrap items-baseline gap-x-2 mb-2">
          <span className="text-[15px] font-black" style={{ color: "#023e8a" }}>SEO</span>
          <span className="text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.45)" }}>Search Engine Optimization — קידום אורגני</span>
        </div>
        <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
          📌 כוונון האתר (תוכן, מהירות, קישורים) כך שגוגל <strong>"יאהב"</strong> אותו ויציג אותו גבוה.<br />
          ✓ חינמי — אחרי שמגיעים, התנועה ממשיכה<br />
          ✗ לוקח 3–6 חודשים להגיע לעמוד הראשון
        </div>
      </div>

      {/* Videos */}
      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>🎥 הסברים קצרים בעברית</div>
      <div className="grid grid-cols-2 gap-2 mb-1">
        {[
          { id: "j2oLpmLZ8BI", label: "מה זה SEO?" },
          { id: "Q2_ISoaj3yY", label: "מה זה גוגל אדס (PPC)?" },
        ].map(v => (
          <div key={v.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
            <div className="px-2 py-1.5 text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.55)" }}>{v.label}</div>
            <div className="relative" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.label}
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "עסק חדש שרוצה לקוחות *מחר* — מה עדיף?",
  options: ["SEO — כי זה חינמי לטווח ארוך", "PPC — כי נותן תוצאות מיידיות", "שניהם זהים"],
  correct: 1,
  okMsg: "נכון! PPC נותן תנועה מיידית — משלמים וזה מתחיל. SEO מושלם לטווח ארוך אבל לוקח 3-6 חודשים להראות תוצאות. אסטרטגיה טובה משלבת את שניהם.",
  errMsg: "PPC הוא הבחירה הנכונה לטווח קצר — משלמים על לחיצות ומיד מופיעים בראש גוגל. SEO מצוין אבל לוקח חודשים להתחיל לעבוד.",
  learned: "PPC = מיידי בתשלום | SEO = חינמי לטווח ארוך",
};

const MK4: ChoiceStep = {
  kind: "choice",
  tag: "CAC",
  concept: "עלות רכישת לקוח",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        אחד המדדים הכי חשובים בשיווק:
      </p>
      <div
        className="rounded-2xl p-4 mb-4 text-center"
        style={{ background: "#0f172a" }}
      >
        <div className="font-mono text-[14px] leading-[2]" style={{ color: "#e2e8f0" }} dir="ltr">
          <span style={{ color: "#fb923c" }}>CAC</span>{" = "}
          <span style={{ color: "#34d399" }}>הוצאות שיווק</span>
          {" ÷ "}
          <span style={{ color: "#fbbf24" }}>לקוחות חדשים</span>
        </div>
      </div>
      <div
        className="rounded-xl p-3 text-[12.5px]"
        style={{ background: "rgba(249,115,22,0.07)", color: "rgba(0,0,0,0.55)" }}
      >
        3 חברות, אותו תקציב: ₪30,000 על שיווק.<br />
        חברה א׳: 300 לקוחות. חברה ב׳: 60 לקוחות. חברה ג׳: 1,000 לקוחות.
      </div>
    </div>
  ),
  question: "איזו חברה הכי יעילה בשיווק?",
  options: ["חברה א׳ — CAC של ₪100", "חברה ב׳ — CAC של ₪500", "חברה ג׳ — CAC של ₪30"],
  correct: 2,
  okMsg: "נכון! חברה ג׳: 30,000 ÷ 1,000 = ₪30 לכל לקוח. CAC נמוך = שיווק יעיל. כמובן שצריך גם לבדוק שאיכות הלקוחות טובה ולא רק כמותם.",
  errMsg: "חברה ג׳ — 30,000 ÷ 1,000 לקוחות = CAC של ₪30 בלבד! כל לקוח עולה לה פחות. ככל שה-CAC נמוך יותר (ואיכות הלקוח גבוהה), השיווק יעיל יותר.",
  learned: "CAC = הוצאות ÷ לקוחות | ככל שנמוך — יותר יעיל",
};

const MK5: ChoiceStep = {
  kind: "choice",
  tag: "מיתוג",
  concept: "מותג = תחושה, לא רק לוגו",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.22)" }}
      >
        <span className="text-[20px] shrink-0">🤔</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#c2410c" }}>שאלה לחשוב עליה:</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>
            שתי תרופות לכאב ראש. מרכיבים זהים לחלוטין. אחת של "בלו פארם", השנייה של "אלטר". מחיר האחת: ₪12. השנייה: ₪48. מי קונה?
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
        מיתוג חזק גורם לנו לשלם יותר על אותו מוצר — בגלל <span className="font-bold" style={{ color: "#f97316" }}>תחושת האמון והיוקרה.</span>
      </p>
    </div>
  ),
  question: "מה הכי חשוב ביצירת מותג חזק?",
  options: [
    "לוגו מרשים וצבעים יפים",
    "יצירת תחושה עקבית של אמינות ויוקרה בכל נקודת מגע עם הלקוח",
    "פרסום רב בטלוויזיה",
  ],
  correct: 1,
  okMsg: "בדיוק! מותג = התחושה שלקוח מקבל בכל אינטראקציה. מהאתר, דרך שירות הלקוחות, עד האריזה. Apple לא מפורסמת בגלל הלוגו — אלא בגלל שכל נקודת מגע מרגישה מושלמת.",
  errMsg: "מיתוג הוא הרבה יותר מלוגו. זה התחושה שלקוח מקבל בכל מגע עם החברה — גרפיקה, שפה, שירות, חוויה. Apple, Nike ו-WIZ שוות מיליארדים בזכות מיתוג עקבי.",
  learned: "מותג = תחושה עקבית בכל נקודת מגע",
};

const MK6: ChoiceStep = {
  kind: "choice",
  tag: "B2B vs B2C",
  concept: "שני עולמות שיווק שונים",
  context: (
    <div>
      <div className="flex gap-3 mb-4">
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)" }}
        >
          <div className="text-[11.5px] font-bold mb-2" style={{ color: "#c2410c" }}>B2C</div>
          <div className="text-[11px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            Business to Consumer<br />
            מוכרים לאנשים פרטיים<br />
            <span className="font-bold">דוגמה: </span>Zara, Wolt, Netflix
          </div>
        </div>
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}
        >
          <div className="text-[11.5px] font-bold mb-2" style={{ color: "#023e8a" }}>B2B</div>
          <div className="text-[11px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            Business to Business<br />
            מוכרים לחברות אחרות<br />
            <span className="font-bold">דוגמה: </span>Monday.com, Wix, Salesforce
          </div>
        </div>
      </div>
      <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.38)" }}>
        B2B: תהליך מכירה ארוך (חודשים), עסקאות גדולות, מעט לקוחות.<br />
        B2C: תהליך מהיר (דקות), עסקאות קטנות, מיליוני לקוחות.
      </div>
    </div>
  ),
  question: "Monday.com מוכרת תוכנת ניהול פרויקטים לחברות גדולות. זה:",
  options: ["B2C — כי גם עובדים משתמשים בה", "B2B — כי הלקוח הוא חברה, לא אדם פרטי", "B2G — כי יש להם לקוחות ממשלתיים"],
  correct: 1,
  okMsg: "נכון! Monday.com מוכרת לחברות — אף שעובדים בודדים משתמשים בה, הלקוח שמשלם הוא הארגון. לכן B2B. תהליך המכירה ארוך ומורכב הרבה יותר מ-B2C.",
  errMsg: "B2B — Monday.com מוכרת ל*חברות*, לא לאנשים פרטיים. הלקוח שחותם על החוזה ומשלם הוא הארגון. זה מה שמגדיר B2B, גם אם עובדים בודדים הם המשתמשים הסופיים.",
  learned: "B2B = מוכרים לחברות | B2C = מוכרים לאנשים",
};

const STEPS_MARKETING: Step[] = [MK0, MK1, MK2, MK3, MK4, MK5, MK6];

// ─────────────────────────────────────────────────────────────────────────────
// STEPS — ai  (AI ובינה מלאכותית)
// ─────────────────────────────────────────────────────────────────────────────

const AI0: ChoiceStep = {
  kind: "choice",
  tag: "נקודת פתיחה",
  concept: "AI — מה זה באמת?",
  context: (
    <div>
      <div
        className="rounded-2xl p-4 mb-5 flex gap-4 items-start"
        style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)" }}
      >
        <div
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[22px] font-black text-white"
          style={{ background: "#7c3aed", ...HEEBO }}
        >
          מ
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: "#6d28d9" }}>מאיה, 33, מחיפה</div>
          <div className="text-[12.5px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            "הייתי מורה לביולוגיה. AI נראה לי כמו מדע בדיוני. גיליתי שמה שאנשי AI עושים זה ללמד מחשבים מדוגמאות — בדיוק כמו שאני לימדתי ילדים. היום אני Data Scientist ב-Intel."
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
        AI אמיתי ≠ רובוטים מהסרטים. AI = מחשבים שלמדו לזהות דפוסים מהרבה מאוד דוגמאות.
      </p>
    </div>
  ),
  question: "מה מייחד AI ממחשב רגיל?",
  options: [
    "הוא מחשב מהר יותר",
    "הוא לומד מדוגמאות ומשפר את עצמו — בלי שמתכנתים מחדש אותו",
    "הוא מחובר לאינטרנט",
  ],
  correct: 1,
  okMsg: "בדיוק! מחשב רגיל מריץ הוראות שנכתבו מראש. AI לומד מדוגמאות ומשנה את ה'חשיבה' שלו בהתאם — בדומה לאיך שאנחנו לומדים מניסיון.",
  errMsg: "הייחוד של AI הוא הלמידה — לא המהירות. AI יכול לראות מיליון תמונות של חתולים ואז לזהות חתול שמעולם לא ראה. מחשב רגיל צריך שמישהו יגדיר לו 'מה זה חתול' בדיוק.",
  learned: "AI = לומד מדוגמאות, לא מתוכנת בהוראות קשיחות",
};

const AI1: ChoiceStep = {
  kind: "choice",
  tag: "נתוני אימון",
  concept: "Training Data = הניסיון של ה-AI",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כדי ש-AI ילמד משהו — צריך להראות לו <span className="font-bold" style={{ color: "#7c3aed" }}>הרבה מאוד דוגמאות:</span>
      </p>
      <div className="flex flex-col gap-3 mb-4">
        {[
          { task: "לזהות ספאם", data: "מיליון מיילים שסומנו 'ספאם'/'לא ספאם'" },
          { task: "לתרגם עברית→אנגלית", data: "מיליארד משפטים מתורגמים" },
          { task: "לזהות סרטן", data: "100,000 תמונות רנטגן עם אבחנות" },
        ].map((r) => (
          <div
            key={r.task}
            className="rounded-xl p-3 flex items-start gap-3"
            style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)" }}
          >
            <span className="text-[16px] shrink-0">🎯</span>
            <div>
              <div className="text-[12px] font-bold" style={{ color: "#6d28d9" }}>{r.task}</div>
              <div className="text-[11px] mt-[2px]" style={{ color: "rgba(0,0,0,0.5)" }}>נתוני אימון: {r.data}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "AI לזיהוי פנים אומן רק על תמונות של אנשים בני 20-30. מה יקרה?",
  options: [
    "יזהה כולם מצוין — גיל לא משנה",
    "יתקשה לזהות ילדים וקשישים — כי לא ראה דוגמאות כאלה",
    "יתאים את עצמו אוטומטית",
  ],
  correct: 1,
  okMsg: "בדיוק! AI לא יכול לדעת דברים שלא היו בנתוני האימון שלו. זה בדיוק למה Google Photos אינפלואמסלי אימנה על אוכלוסייה מגוונת — כדי שיזהה פנים של כולם.",
  errMsg: "AI לא יכול 'להתאים את עצמו' לדברים שמעולם לא ראה. אם אומן על גיל 20-30, הוא יתקשה עם ילדים וקשישים. זו בעיית 'הטיית אימון' — אחת הבעיות הכי חשובות בתחום.",
  learned: "AI = תוצר ישיר של הנתונים שראה. נתונים מוטים = AI מוטה",
};

const AI2: SequenceStep = {
  kind: "sequence",
  tag: "תהליך ML",
  concept: "4 שלבים לבניית מודל AI",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        בניית כל מודל AI — מ-ChatGPT ועד פילטר ספאם — עוברת <span className="font-bold" style={{ color: "#7c3aed" }}>את אותם 4 שלבים.</span>
      </p>
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.13)" }}
      >
        <div className="text-[12px] font-bold mb-2" style={{ color: "#6d28d9" }}>דוגמה: AI שמנבא אם לקוח יעזוב</div>
        <div className="text-[11.5px] leading-[1.9]" style={{ color: "rgba(0,0,0,0.6)" }}>
          מאספים נתוני לקוחות שעזבו ושנשארו<br />
          מאמנים את המודל על הנתונים<br />
          בודקים כמה פעמים הוא טועה<br />
          משיקים את המודל בפרודקשן
        </div>
      </div>
    </div>
  ),
  instruction: "סדרי את שלבי בניית מודל AI — לחצי לפי הסדר:",
  items: [
    "פריסה — משיקים את המודל למשתמשים",
    "איסוף נתוני אימון",
    "הערכה — בודקים את דיוק המודל",
    "אימון — המודל לומד מהנתונים",
  ],
  correctOrder: [1, 3, 2, 0],
  okMsg: "מושלם! איסוף → אימון → הערכה → פריסה. אם הדיוק בשלב ההערכה נמוך — חוזרים לאסוף נתונים טובים יותר. זה ה-cycle של כל מפתח AI.",
  errMsg: "הסדר הנכון: קודם אוספים נתונים ← מאמנים ← בודקים דיוק ← ומשיקים. לא ניתן לאמן בלי נתונים, ולא כדאי לשחרר בלי לבדוק!",
  learned: "איסוף → אימון → הערכה → פריסה",
};

const AI3: ChoiceStep = {
  kind: "choice",
  tag: "רשת נוירונים",
  concept: "איך AI 'חושב'?",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        המוח שלנו מורכב מנוירונים שמעבירים אותות. AI מדמה זאת:
      </p>
      <div className="flex items-center justify-between gap-2 mb-5">
        {[
          { label: "קלט", items: ["📷 תמונה"], color: "#7c3aed" },
          { label: "שכבות נסתרות", items: ["קצוות", "צורות", "פנים"], color: "#a78bfa" },
          { label: "פלט", items: ["✅ חתול"], color: "#6d28d9" },
        ].map((col, ci) => (
          <div key={ci} className="flex flex-col items-center gap-2 flex-1">
            <div className="text-[9.5px] font-bold text-center" style={{ color: "rgba(0,0,0,0.38)" }}>{col.label}</div>
            {col.items.map((item, i) => (
              <div
                key={i}
                className="w-full rounded-lg px-2 py-[6px] text-center text-[10.5px] font-bold text-white"
                style={{ background: col.color }}
              >
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.38)" }}>
        שכבה 1 מזהה קצוות → שכבה 2 מרכיבה צורות → שכבה 3 מזהה פנים → פלט: חתול!
      </div>
    </div>
  ),
  question: "למה צריך כמה שכבות (layers) ולא שכבה אחת?",
  options: [
    "כדי שהמחשב יעבוד מהר יותר",
    "כדי ללמוד תכונות מורכבות שלב אחר שלב — מפשוט למורכב",
    "כי כך מחסכים בזיכרון",
  ],
  correct: 1,
  okMsg: "נכון! כל שכבה לומדת תכונה מורכבת יותר מהשכבה הקודמת. כמו שאנחנו לומדים קודם אותיות, אחר כך מילים, ואז משפטים — AI עובד אותו דבר.",
  errMsg: "שכבות מרובות מאפשרות ל-AI ללמוד מהפשוט למורכב. שכבה ראשונה מזהה קצוות, שנייה צורות, שלישית חפצים שלמים. בלי שכבות — לא ניתן ללמוד דפוסים מורכבים.",
  learned: "שכבות נוירונים = למידה מפשוט למורכב",
};

const AI4: ChoiceStep = {
  kind: "choice",
  tag: "Prompt Engineering",
  concept: "לדבר עם AI בצורה חכמה",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        האיכות של תשובת AI תלויה ישירות <span className="font-bold" style={{ color: "#7c3aed" }}>באיכות השאלה שאת שואלת.</span>
        <br />השוואה:
      </p>
      <div className="flex flex-col gap-3 mb-4">
        {[
          {
            label: "❌ Prompt חלש",
            text: '"תכתבי לי משהו על כלבים"',
            bg: "rgba(220,38,38,0.06)",
            border: "#dc262633",
          },
          {
            label: "✅ Prompt חזק",
            text: '"כתבי לי פסקה של 3 משפטים על כלבי לברדור — מתאים להסבר לילד בן 8, בעברית פשוטה"',
            bg: "rgba(34,197,94,0.06)",
            border: "#22c55e33",
          },
        ].map((r) => (
          <div
            key={r.label}
            className="rounded-xl p-3"
            style={{ background: r.bg, border: `1px solid ${r.border}` }}
          >
            <div className="text-[11px] font-bold mb-1" style={{ color: "rgba(0,0,0,0.5)" }}>{r.label}</div>
            <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.65)" }}>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "מה הכי חשוב ב-prompt טוב?",
  options: [
    "לכתוב בשפה פורמלית",
    "לציין הקשר, מטרה, קהל יעד ופורמט רצוי",
    "להשתמש במילות מפתח בלבד",
  ],
  correct: 1,
  okMsg: "נכון! ככל שה-prompt יותר ספציפי — הפלט יותר שימושי. Prompt Engineering הפך למקצוע בפני עצמו — חברות משלמות עשרות אלפי שקלים לאנשים שיודעים לשאול את ה-AI בצורה נכונה.",
  errMsg: "הקשר, מטרה וקהל יעד — אלה מה שהופכים prompt לאפקטיבי. AI לא 'מנחש' — הוא מייצר בדיוק מה שמבקשים ממנו. ככל שהבקשה ברורה יותר — התשובה טובה יותר.",
  learned: "Prompt טוב = הקשר + מטרה + קהל + פורמט",
};

const AI5: ChoiceStep = {
  kind: "choice",
  tag: "הטיית AI",
  concept: "AI יכול לטעות — ובגדול",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
      >
        <span className="text-[20px] shrink-0">⚠️</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#b91c1c" }}>מקרה אמיתי: Amazon Hiring AI</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.58)" }}>
            Amazon בנו AI לסינון קורות חיים. אחרי שנה גילו שהוא מעדיף מועמדים גברים ופוסל נשים. ביטלו אותו.
          </div>
        </div>
      </div>
      <p className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
        ה-AI אומן על קורות חיים של עובדים קיימים — שרובם היו גברים. הוא "למד" שגברים = מועמדים טובים.
      </p>
    </div>
  ),
  question: "מה הסיבה העיקרית להטיה (bias) ב-Amazon AI?",
  options: [
    "ה-AI לא היה חכם מספיק",
    "נתוני האימון שיקפו הטיה היסטורית בגיוס — AI שכפל אותה",
    "לא הסבירו ל-AI מה שוויון מגדרי",
  ],
  correct: 1,
  okMsg: "בדיוק! AI לא מבין 'מוסר' — הוא שכפל את הדפוס שמצא בנתונים. כשהנתונים הכילו הטיה, ה-AI למד את ההטיה. זו אחת הסוגיות האתיות הכי חשובות בתחום.",
  errMsg: "ה-AI היה 'חכם מדי' — הוא זיהה בדיוק את הדפוס בנתונים, שהיה מוטה מראש. AI לא יכול להבין שהנתונים לא הוגנים — זו אחריות של המפתחים.",
  learned: "AI מוטה = נתוני אימון מוטים. אחריות המפתחת!",
};

const AI6: ChoiceStep = {
  kind: "choice",
  tag: "כלים אמיתיים",
  concept: "AI בחיים האמיתיים",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        AI כבר לא עתיד — הוא כאן. כמה דוגמאות:
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {[
          { tool: "ChatGPT / Claude", use: "כתיבה, קוד, שאלות — שפה טבעית", icon: "💬" },
          { tool: "Midjourney / DALL-E", use: "יצירת תמונות מטקסט", icon: "🎨" },
          { tool: "GitHub Copilot", use: "כתיבת קוד אוטומטית למפתחים", icon: "👩‍💻" },
          { tool: "Waze / Google Maps", use: "ניבוי עומסים בזמן אמת", icon: "🗺️" },
        ].map((r) => (
          <div
            key={r.tool}
            className="flex items-center gap-3 rounded-xl px-3 py-2"
            style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.1)" }}
          >
            <span className="text-[18px] shrink-0">{r.icon}</span>
            <div>
              <div className="text-[12px] font-bold" style={{ color: "#6d28d9" }}>{r.tool}</div>
              <div className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>{r.use}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "חברת ביטוח רוצה לסווג תמונות של נזקי רכב אוטומטית. איזה סוג AI?",
  options: [
    "NLP — עיבוד שפה טבעית",
    "Computer Vision — ראייה ממוחשבת",
    "Generative AI — AI יצירתי",
  ],
  correct: 1,
  okMsg: "בדיוק! Computer Vision מיועד לניתוח תמונות. NLP לטקסט ושפה. Generative AI ליצירת תוכן חדש. כל תחום AI מתמחה בסוג נתונים אחר.",
  errMsg: "Computer Vision — AI שמתמחה בניתוח תמונות וזיהוי חזותי. NLP = שפה. Generative = יצירת תוכן. חשוב לבחור את הסוג הנכון לכל בעיה.",
  learned: "Computer Vision = תמונות | NLP = טקסט | GenAI = יצירה",
};

const STEPS_AI: Step[] = [AI0, AI1, AI2, AI3, AI4, AI5, AI6];

// ─────────────────────────────────────────────────────────────────────────────
// STEPS — cyber  (סייבר)
// ─────────────────────────────────────────────────────────────────────────────

const CY0: ChoiceStep = {
  kind: "choice",
  tag: "נקודת פתיחה",
  concept: "מהו מקצוע הסייבר?",
  context: (
    <div>
      <div
        className="rounded-2xl p-4 mb-5 flex gap-4 items-start"
        style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)" }}
      >
        <div
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[22px] font-black text-white"
          style={{ background: "#dc2626", ...HEEBO }}
        >
          ר
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: "#b91c1c" }}>רונית, 28, מראשון לציון</div>
          <div className="text-[12.5px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            "שירתתי ב-8200 אבל בלי ידע ספציפי בסייבר. לקחתי קורס Ethical Hacking. היום אני Penetration Tester בחברה שמגינה על בנקים — ₪28,000 בחודש."
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
        סייבר = לא רק הגנה. חלק גדול מהעבודה הוא <span className="font-bold" style={{ color: "#dc2626" }}>לחשוב כמו תוקף</span> כדי למצוא חולשות לפניו.
      </p>
    </div>
  ),
  question: "מה עושה Penetration Tester (בודק חדירות)?",
  options: [
    "מחסנת מחשבים מווירוסים",
    "תוקפת מערכות ברשות הלקוח — כדי למצוא חולשות לפני האקרים אמיתיים",
    "מנטרת רשתות 24/7",
  ],
  correct: 1,
  okMsg: "בדיוק! Pen Tester = האקר אתי. היא תוקפת את מערכות הלקוח — בהרשאה מלאה — ומדווחת על חולשות שמצאה. זה המקצוע הכי מבוקש בסייבר.",
  errMsg: "Pen Tester = האקרת בהרשאה. היא עושה בדיוק מה שהאקר עוין היה עושה — אבל בהרשאה, כדי שהחברה תוכל לתקן לפני שמישהו זדוני ינצל זאת.",
  learned: "Pen Tester = האקרת אתית — תוקפת כדי להגן",
};

const CY1: ChoiceStep = {
  kind: "choice",
  tag: "הנדסה חברתית",
  concept: "האדם = החוליה החלשה",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4"
        style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        <div className="text-[12.5px] font-bold mb-2" style={{ color: "#023e8a" }}>עובדה מפתיעה:</div>
        <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.65)" }}>
          <span className="font-bold" style={{ color: "#dc2626" }}>95%</span> מהפרצות אבטחה נגרמות מטעות אנוש — לא מחולשות טכניות.
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#dc2626" }}>Social Engineering</span> = ניצול אנשים, לא מחשבים.
        <br />קל יותר לגרום לעובד לתת סיסמה מאשר לפרוץ הצפנה.
      </p>
      <div
        className="rounded-xl p-3 text-[12px] leading-[1.7]"
        style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}
      >
        <span className="font-bold">"שלום, אני מ-IT.</span> המחשב שלך הועבר לרשימת ניהול חדשה — צריך את הסיסמה שלך לאימות מהיר."
      </div>
    </div>
  ),
  question: "המייל הזה הגיע ממנהל ה-IT. מה עושים?",
  options: [
    "נותנת את הסיסמה — IT ידוע ואמין",
    "מסרבת — IT לגיטימי לעולם לא מבקש סיסמה במייל",
    "בודקת אם המייל נראה רשמי",
  ],
  correct: 1,
  okMsg: "נכון! שום IT לגיטימי לא מבקש סיסמה. זו טכניקת Social Engineering קלאסית. הכלל: סיסמה = סוד שלא חולקים עם אף אחד, גם לא ה'IT'.",
  errMsg: "IT לגיטימי לעולם לא צריך את הסיסמה שלך. כשמישהו מבקש אותה — זה דגל אדום. הכלל הברזל: לא נותנים סיסמה, גם אם 'IT' ביקש בדחיפות.",
  learned: "IT אמיתי לעולם לא מבקש סיסמה — זה Phishing",
};

const CY2: SequenceStep = {
  kind: "sequence",
  tag: "Pen Testing",
  concept: "4 שלבי בדיקת חדירות",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        Pen Tester עובדת לפי תהליך מוגדר — כדי לא לפגוע במערכות האמיתיות:
      </p>
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.13)" }}
      >
        <div className="text-[12px] font-bold mb-2" style={{ color: "#b91c1c" }}>דוגמה: בדיקת אתר של בנק</div>
        <div className="text-[11.5px] leading-[1.9]" style={{ color: "rgba(0,0,0,0.6)" }}>
          מגדירות מה מותר לבדוק (הסכם עם הלקוח)<br />
          סורקות את האתר לחולשות ידועות<br />
          מנסות לנצל חולשה שנמצאה<br />
          כותבות דוח מפורט + המלצות תיקון
        </div>
      </div>
    </div>
  ),
  instruction: "סדרי את שלבי Pen Testing — לחצי לפי הסדר הנכון:",
  items: [
    "כתיבת דוח ממצאים והמלצות",
    "הגדרת היקף הבדיקה (מה מותר?)",
    "ניצול חולשה שנמצאה (Exploitation)",
    "סריקת המערכת לחולשות (Reconnaissance)",
  ],
  correctOrder: [1, 3, 2, 0],
  okMsg: "מעולה! הגדרה → סריקה → ניצול → דוח. בלי הגדרת היקף ברורה — Pen Tester עלולה לעשות נזק לא מכוון. הדוח בסוף הוא המוצר הסופי שהלקוח רכש.",
  errMsg: "הסדר: קודם מגדירות מה מותר ← סורקות ← מנסות לנצל ← כותבות דוח. בלי הסכם ראשוני — זה פריצה לא חוקית, לא Pen Testing!",
  learned: "הגדרה → סריקה → ניצול → דוח",
};

const CY3: ChoiceStep = {
  kind: "choice",
  tag: "Phishing",
  concept: "לזהות מייל מזויף",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        Phishing = מייל מזויף שמתחזה לגוף אמיתי. זהי ההתקפה הנפוצה ביותר בעולם.
        <br />בדקי את המייל הזה:
      </p>
      <div
        className="rounded-xl overflow-hidden mb-4"
        style={{ border: "1.5px solid rgba(220,38,38,0.25)" }}
      >
        <div className="px-3 py-2" style={{ background: "rgba(220,38,38,0.07)" }}>
          <div className="text-[10.5px] font-bold" style={{ color: "#b91c1c" }}>מייל חשוד</div>
        </div>
        <div className="p-3 text-[11.5px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.65)" }}>
          <div><span className="font-bold">מ:</span> security@paypa1.com</div>
          <div><span className="font-bold">נושא:</span> ⚠️ דחוף! חשבונך יוקפא תוך 24 שעות</div>
          <div className="mt-2">לחצי כאן לאימות מיידי: <span className="font-bold" style={{ color: "#dc2626" }}>http://paypa1-verify.ru/login</span></div>
        </div>
      </div>
    </div>
  ),
  question: "כמה סימני אזהרה יש במייל הזה?",
  options: [
    "אחד — הכתובת paypa1.com (1 במקום l)",
    "שניים — paypa1.com + כתובת .ru חשודה",
    "שלושה — paypa1 + .ru + דחיפות מלאכותית ('24 שעות')",
  ],
  correct: 2,
  okMsg: "מצאת את כולם! paypa1 (ספרה 1 במקום אות l) + כתובת רוסית (.ru) + דחיפות מלאכותית = Phishing קלאסי. Hackers משתמשים בדחיפות כי היא מונעת חשיבה ביקורתית.",
  errMsg: "שלושה סימנים: (1) paypa1 — ספרה 1 במקום אות l, (2) .ru — דומיין רוסי חשוד, (3) '24 שעות' — דחיפות מלאכותית שמונעת חשיבה. תמיד עצרי לנשום לפני שלוחצים!",
  learned: "Phishing = שגיאת כתיב + קישור חשוד + דחיפות",
};

const CY4: ChoiceStep = {
  kind: "choice",
  tag: "סיסמאות",
  concept: "מה הופך סיסמה לחזקה?",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        תוכנה שפורצת סיסמאות יכולה לנסות <span className="font-bold" style={{ color: "#dc2626" }}>מיליארד שילובים בשנייה.</span>
        <br />השוואה:
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {[
          { pass: "123456", time: "מיידי", strength: 0 },
          { pass: "Sarah2000!", time: "שעות", strength: 1 },
          { pass: "K8#mQ!vR2$", time: "מיליארד שנה", strength: 2 },
        ].map((r) => (
          <div
            key={r.pass}
            className="rounded-xl px-3 py-2 flex items-center justify-between"
            style={{
              background: ["rgba(220,38,38,0.07)", "rgba(251,133,0,0.07)", "rgba(34,197,94,0.07)"][r.strength],
              border: `1px solid ${["rgba(220,38,38,0.2)", "rgba(251,133,0,0.2)", "rgba(34,197,94,0.2)"][r.strength]}`,
            }}
          >
            <span className="font-mono text-[13px] font-bold" style={{ color: ["#b91c1c", "#c2410c", "#15803d"][r.strength] }}>
              {r.pass}
            </span>
            <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>נפרצת תוך: {r.time}</span>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "מה הכי חשוב לסיסמה חזקה?",
  options: [
    "להכיל תאריך יום הולדת שלך",
    "אורך + שילוב של אותיות/ספרות/סימנים אקראיים",
    "להשתמש בשם ועוד מספר",
  ],
  correct: 1,
  okMsg: "נכון! אורך ואקראיות = מה שהופך סיסמה לבלתי ניתנת לפריצה. 'K8#mQ!vR2$' קשה לזכור — לכן משתמשים ב-Password Manager (LastPass, 1Password).",
  errMsg: "תאריך יום הולדת + שם = מידע שהאקר יכול לגלות ממדיה חברתית. סיסמה חזקה = ארוכה + אקראית + שילוב סוגי תווים. לא צריכה להיות זכירה — Password Manager יעשה זאת בשבילך.",
  learned: "סיסמה חזקה = ארוכה + אקראית + מעורבת",
};

const CY5: ChoiceStep = {
  kind: "choice",
  tag: "CIA Triad",
  concept: "3 עמודי האבטחה",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כל מערכת אבטחה מגינה על 3 דברים:
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {[
          { letter: "C", name: "Confidentiality — סודיות", desc: "רק מי שמורשה יכול לראות מידע", ex: "הצפנת תיקים רפואיים" },
          { letter: "I", name: "Integrity — שלמות", desc: "המידע לא שונה ולא זויף", ex: "חתימה דיגיטלית על חוזה" },
          { letter: "A", name: "Availability — זמינות", desc: "המערכת עובדת כשצריכים אותה", ex: "אתר הבנק זמין 24/7" },
        ].map((r) => (
          <div
            key={r.letter}
            className="flex items-start gap-3 rounded-xl px-3 py-2"
            style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.13)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 text-[13px]"
              style={{ background: "#dc2626" }}
            >
              {r.letter}
            </div>
            <div>
              <div className="text-[11.5px] font-bold" style={{ color: "#b91c1c" }}>{r.name}</div>
              <div className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>{r.desc} · {r.ex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "האקרים הצליחו לשנות מחירים בחנות אונליין — הוסיפו 0 לכל מוצר. איזה עמוד נפגע?",
  options: [
    "Confidentiality — כי גנבו מידע",
    "Integrity — כי שינו את המידע",
    "Availability — כי האתר לא עבד",
  ],
  correct: 1,
  okMsg: "נכון! Integrity נפגעה — המידע (המחירים) שונה ללא הרשאה. האתר עדיין עבד (Availability בסדר) ולא גנבו מידע (Confidentiality בסדר), אבל הנתונים זויפו.",
  errMsg: "Integrity — שינוי לא מורשה של נתונים. האתר עבד (Availability) ולא חשפו מידע סודי (Confidentiality). אבל המחירים שונו — הנתונים כבר לא שלמים ואמינים.",
  learned: "C=סודיות | I=שלמות | A=זמינות — CIA Triad",
};

const CY6: ChoiceStep = {
  kind: "choice",
  tag: "תגובה לאירוע",
  concept: "מה עושים כשמתגלה פרצה?",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
      >
        <span className="text-[20px] shrink-0">🚨</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#b91c1c" }}>אירוע: גילוי פרצת אבטחה</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.58)" }}>
            מנהל ה-IT של חברה גדולה מגלה שהאקרים נמצאים ברשת מזה 3 ימים ואוספים נתוני לקוחות.
          </div>
        </div>
      </div>
      <p className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
        כשמתגלה פריצה — כל שנייה קובעת. מה הצעד <span className="font-bold" style={{ color: "#dc2626" }}>הראשון</span> שיש לנקוט?
      </p>
    </div>
  ),
  question: "מה הצעד הראשון בתגובה לאירוע אבטחה?",
  options: [
    "להודיע לתקשורת על הפרצה",
    "לבודד (Contain) את הנזק — לנתק מערכות נגועות מהרשת",
    "להגיש תלונה במשטרה",
  ],
  correct: 1,
  okMsg: "בדיוק! Containment ראשון — לעצור את הדימום לפני הכל. אחר כך: חקירה → ניקוי → שחזור → דיווח לרגולטור. תקשורת מגיעה מאוחר יותר — ורק אחרי שיש עובדות.",
  errMsg: "Contain ראשון! כמו פצע — קודם עוצרים דימום. נותקות מערכות נגועות מהרשת כדי שהתוקף לא ימשיך. רק אחר כך: חקירה, ניקוי, ואז דיווח לרגולטור ולקוחות.",
  learned: "תגובה לאירוע: Contain → Investigate → Clean → Report",
};

const STEPS_CYBER: Step[] = [CY0, CY1, CY2, CY3, CY4, CY5, CY6];

// ─────────────────────────────────────────────────────────────────────────────
// STEPS — ux  (עיצוב UX/UI)
// ─────────────────────────────────────────────────────────────────────────────

const UX0: ChoiceStep = {
  kind: "choice",
  tag: "נקודת פתיחה",
  concept: "UX — מה זה בעצם?",
  context: (
    <div>
      <div
        className="rounded-2xl p-4 mb-5 flex gap-4 items-start"
        style={{ background: "rgba(219,39,119,0.07)", border: "1px solid rgba(219,39,119,0.18)" }}
      >
        <div
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[22px] font-black text-white"
          style={{ background: "#db2777", ...HEEBO }}
        >
          ל
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: "#9d174d" }}>לילך, 26, מירושלים</div>
          <div className="text-[12.5px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            "למדתי מדעי חברה. לא ציירתי מימי. גיליתי שUX זה לא ציור — זה חשיבה על בני אדם. היום אני UX Researcher ב-Fiverr ומרוויחה ₪22,000."
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#db2777" }}>UX = User Experience</span> — חוויית המשתמש.
        <br />ההבדל בין אפליקציה שאנשים אוהבים לבין כזו שנוטשים.
      </p>
    </div>
  ),
  question: "מה תפקיד ה-UX Designer?",
  options: [
    "לצייר לוגואים ולבחור צבעים",
    "להבין את המשתמשים ולעצב חוויה שתפתור את הבעיות שלהם",
    "לכתוב קוד לאפליקציות",
  ],
  correct: 1,
  okMsg: "בדיוק! UX Designer מתחילה מחקר: מי המשתמשים? מה הם צריכים? מה מבלבל אותם? רק אחר כך מעצבת פתרון. זה יותר קרוב לפסיכולוגיה מאשר לציור.",
  errMsg: "UX הוא חשיבה, לא אמנות. UX Designer חוקרת משתמשים, מזהה בעיות, ומעצבת פתרונות שגורמים לאנשים להרגיש שהמוצר 'עובד לבד'. UI Designer עוסקת בחזות.",
  learned: "UX = חוויית משתמש | מחקר → עיצוב → בדיקה",
};

const UX1: ChoiceStep = {
  kind: "choice",
  tag: "משתמש vs עסק",
  concept: "לאזן בין שני צרכים",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        UX טוב מאזן בין <span className="font-bold" style={{ color: "#db2777" }}>צרכי המשתמש</span> לבין <span className="font-bold" style={{ color: "#023e8a" }}>יעדי העסק:</span>
      </p>
      <div className="flex gap-3 mb-5">
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(219,39,119,0.07)", border: "1px solid rgba(219,39,119,0.18)" }}
        >
          <div className="text-[12px] font-bold mb-2" style={{ color: "#9d174d" }}>משתמש רוצה:</div>
          <div className="text-[11px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>
            ✓ מהיר וקל<br />
            ✓ פחות קליקים<br />
            ✓ ללא הסחות דעת
          </div>
        </div>
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}
        >
          <div className="text-[12px] font-bold mb-2" style={{ color: "#023e8a" }}>עסק רוצה:</div>
          <div className="text-[11px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>
            ✓ יותר קניות<br />
            ✓ זמן שהייה ארוך<br />
            ✓ הרשמה לניוזלטר
          </div>
        </div>
      </div>
      <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.38)" }}>
        Dark Pattern = כשעסק מעצב בכוונה שמזיקה למשתמש (למשל: כפתור "ביטול" שקשה למצוא).
      </div>
    </div>
  ),
  question: "אפליקציה מסתירה את כפתור ביטול המנוי בתפריט עמוק ב-7 קליקים. זה:",
  options: [
    "UX טוב — כי שומר לקוחות",
    "Dark Pattern — מניפולציה שמזיקה למשתמש",
    "ניטרלי — כל אחד יכול לבטל אם רוצה",
  ],
  correct: 1,
  okMsg: "בדיוק! Dark Pattern = עיצוב מכוון שמנצל את המשתמש. Apple, Google ו-EU כבר אוסרים זאת בחוק. UX טוב יוצר אמון — וזה מה שגורם למשתמשים לחזור.",
  errMsg: "זה Dark Pattern — עיצוב שנועד לבלבל ולהכביד על המשתמש. UX טוב מאזן בין יעדי עסק לחוויית משתמש הוגנת. אגב — האיחוד האירופי כבר קנס חברות על כך.",
  learned: "Dark Pattern = UX שמנצל משתמשים. UX טוב = Win-Win",
};

const UX2: SequenceStep = {
  kind: "sequence",
  tag: "Design Thinking",
  concept: "5 שלבים לעיצוב נכון",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#db2777" }}>Design Thinking</span> — מתודולוגיית העיצוב של Stanford:
      </p>
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(219,39,119,0.05)", border: "1px solid rgba(219,39,119,0.12)" }}
      >
        <div className="text-[12px] font-bold mb-2" style={{ color: "#9d174d" }}>דוגמה: עיצוב מחדש של חדר מיון</div>
        <div className="text-[11.5px] leading-[1.9]" style={{ color: "rgba(0,0,0,0.6)" }}>
          מלווים חולים ומשפחות להבין מה מלחיץ אותם<br />
          מגדירים: "ההמתנה באי ודאות היא הבעיה"<br />
          מחשבים פתרונות יצירתיים<br />
          בונים מודל זול לבדיקה<br />
          בודקים עם משתמשים אמיתיים
        </div>
      </div>
    </div>
  ),
  instruction: "סדרי את שלבי Design Thinking — לחצי לפי הסדר הנכון:",
  items: [
    "בדיקה עם משתמשים (Test)",
    "אמפתיה — הבנת המשתמש (Empathize)",
    "הגדרת הבעיה (Define)",
    "פיתוח פרוטוטייפ מהיר (Prototype)",
  ],
  correctOrder: [1, 2, 3, 0],
  okMsg: "מושלם! אמפתיה → הגדרה → רעיונות → פרוטוטייפ → בדיקה. הסוד: הפרוטוטייפ לא חייב להיות מושלם — הוא רק לבדיקה. אחרי הבדיקה חוזרים ומשפרים.",
  errMsg: "הסדר: קודם מבינים המשתמש ← מגדירים הבעיה ← בונים פרוטוטייפ ← בודקים. לא ניתן להגדיר בעיה בלי להבין את המשתמש, ולא לבדוק בלי פרוטוטייפ.",
  learned: "Empathize → Define → Prototype → Test → חזור",
};

const UX3: ChoiceStep = {
  kind: "choice",
  tag: "User Journey",
  concept: "מיפוי מסע המשתמש",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#db2777" }}>User Journey Map</span> — מפה של כל הצעדים שמשתמש עושה:
      </p>
      <div className="mb-4">
        <div className="text-[11px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
          הזמנת אוכל באפליקציה:
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {["פתיחת האפליקציה", "חיפוש מסעדה", "בחירת מנות", "תשלום", "מעקב הזמנה", "קבלת האוכל"].map((step, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div
                className="rounded-lg px-2 py-2 text-center"
                style={{
                  background: i === 3 ? "rgba(220,38,38,0.1)" : "rgba(219,39,119,0.07)",
                  border: `1px solid ${i === 3 ? "rgba(220,38,38,0.3)" : "rgba(219,39,119,0.15)"}`,
                  minWidth: 52,
                }}
              >
                <div className="text-[9px] leading-[1.4]" style={{ color: i === 3 ? "#b91c1c" : "#9d174d" }}>
                  {step}
                </div>
                {i === 3 && <div className="text-[8px] font-bold mt-1" style={{ color: "#b91c1c" }}>😤</div>}
              </div>
              {i < 5 && <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.25)" }}>→</div>}
            </div>
          ))}
        </div>
        <div className="text-[10.5px] mt-2" style={{ color: "rgba(0,0,0,0.38)" }}>
          🔴 שלב התשלום — פריקשן גבוה: יש לחצן חזרה שמוחק את ההזמנה
        </div>
      </div>
    </div>
  ),
  question: "User Journey מגלה שמשתמשים נוטשים בשלב התשלום. מה בודקים קודם?",
  options: [
    "מוסיפות אנימציה יפה לכפתור",
    "מראיינות משתמשים ומבינות מה מבלבל בשלב התשלום",
    "מורידות את המחיר",
  ],
  correct: 1,
  okMsg: "נכון! קודם מבינים — רק אחר כך פותרים. אולי יש יותר מדי שדות? שגיאה מבלבלת? כפתור ביטול בולט? בלי מחקר — הפתרון עלול להחמיר את הבעיה.",
  errMsg: "ראיון משתמשים ראשון! ה-UX Designer לא מנחשת את הפתרון — היא מבינה את הבעיה. אולי הטופס ארוך מדי? חסרה אינדיקציה לביטחון? רק לאחר הבנה אפשר לפתור.",
  learned: "Friction בUser Journey = לחקור ולהבין לפני לתקן",
};

const UX4: ChoiceStep = {
  kind: "choice",
  tag: "שגיאות ידידותיות",
  concept: "טקסט שעוזר — לא מבלבל",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        הודעות שגיאה הן חלק חשוב מ-UX. השוואה:
      </p>
      <div className="flex flex-col gap-3 mb-4">
        {[
          {
            label: "❌ Bad UX",
            msg: "Error 404: Resource Not Found. HTTP Status Code Mismatch.",
            bg: "rgba(220,38,38,0.07)",
            border: "#dc262633",
          },
          {
            label: "✅ Good UX",
            msg: "הדף לא נמצא 😅\nנראה שהכתובת שגויה — נסי לחפש בדף הבית.",
            bg: "rgba(34,197,94,0.07)",
            border: "#22c55e33",
          },
        ].map((r) => (
          <div
            key={r.label}
            className="rounded-xl p-3"
            style={{ background: r.bg, border: `1px solid ${r.border}` }}
          >
            <div className="text-[10.5px] font-bold mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>{r.label}</div>
            <div className="text-[12px] whitespace-pre-line" style={{ color: "rgba(0,0,0,0.65)" }}>{r.msg}</div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "מה עושה הודעת שגיאה טובה?",
  options: [
    "מסבירה את הקוד הטכני של השגיאה",
    "מסבירה מה קרה בשפה אנושית + מציעה מה לעשות הלאה",
    "מורידה את הדף כדי לטעון מחדש",
  ],
  correct: 1,
  okMsg: "בדיוק! הודעת שגיאה טובה עונה על 3 שאלות: מה קרה? למה? מה עכשיו? בשפה שמשתמש מבין. לא 'HTTP 404' — אלא 'הדף לא קיים, כאן אפשר לחפש.'",
  errMsg: "הודעה טובה = שפה אנושית + מה עושים הלאה. 'Error 404' לא עוזר למשתמש. 'הדף לא נמצא — נסי לחפש כאן' — זה עוזר. UX כותב/ת את הטקסטים האלה.",
  learned: "UX Writing: שגיאה = מה קרה + למה + מה עכשיו",
};

const UX5: ChoiceStep = {
  kind: "choice",
  tag: "A/B Testing",
  concept: "נתונים מחליטים — לא דעות",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#db2777" }}>A/B Testing</span> = מציגות שתי גרסאות לשתי קבוצות ומודדות מה עובד טוב יותר.
      </p>
      <div className="flex gap-3 mb-4">
        {[
          { version: "גרסה A", cta: "הירשמי עכשיו", conv: "2.1%" },
          { version: "גרסה B", cta: "התחילי בחינם", conv: "3.8%" },
        ].map((v) => (
          <div
            key={v.version}
            className="flex-1 rounded-xl p-3 text-center"
            style={{ background: "rgba(219,39,119,0.07)", border: "1px solid rgba(219,39,119,0.15)" }}
          >
            <div className="text-[11px] font-bold mb-2" style={{ color: "#9d174d" }}>{v.version}</div>
            <div
              className="rounded-lg px-2 py-2 text-[11px] font-bold text-white mb-2"
              style={{ background: "#db2777" }}
            >
              {v.cta}
            </div>
            <div className="text-[12px] font-bold" style={{ color: "#023e8a" }}>המרה: {v.conv}</div>
          </div>
        ))}
      </div>
      <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.38)" }}>
        1,000 משתמשים ראו A, 1,000 ראו B. זה מה שהנתונים הראו.
      </div>
    </div>
  ),
  question: "איזו גרסה כדאי לאמץ?",
  options: [
    "גרסה A — 'הירשמי עכשיו' נשמע רשמי יותר",
    "גרסה B — המרה של 3.8% לעומת 2.1% = 81% יותר הרשמות",
    "צריך לבדוק עוד חודש לפני להחליט",
  ],
  correct: 1,
  okMsg: "נכון! הנתונים ברורים — גרסה B מייצרת 81% יותר הרשמות. כשיש נתוני A/B ברורים — הם מנצחים כל דעה. 'התחילי בחינם' מרגיש פחות מחייב וגורם ליותר אנשים לנסות.",
  errMsg: "גרסה B — 3.8% לעומת 2.1% זה הפרש עצום: 81% יותר המרות! בעולם UX — נתונים מנצחים דעות. זה למה A/B Testing הוא אחד הכלים הכי חשובים בתחום.",
  learned: "A/B Testing: נתונים מנצחים דעות אישיות",
};

const UX6: ChoiceStep = {
  kind: "choice",
  tag: "Mobile First",
  concept: "עיצוב למסך הנכון",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(219,39,119,0.08)", border: "1px solid rgba(219,39,119,0.2)" }}
      >
        <span className="text-[20px] shrink-0">📱</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#9d174d" }}>עובדה:</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>
            מעל <span className="font-bold">60% מהגלישה לאינטרנט</span> היא ממכשירים ניידים. בישראל — 68%.
          </div>
        </div>
      </div>
      <p className="text-[13.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
        <span className="font-bold" style={{ color: "#db2777" }}>Mobile First</span> = מעצבים קודם למסך הכי קטן, ואז מרחיבים לדסקטופ.
        <br />ולא להפך!
      </p>
      <div className="text-[11.5px] mt-3" style={{ color: "rgba(0,0,0,0.38)" }}>
        אפליקציה שמרגישה מבולגנת בנייד אבל יפה בדסקטופ = כישלון.
        <br />אפליקציה שמרגישה מנוקה בנייד ומתרחבת יפה לדסקטופ = הצלחה.
      </div>
    </div>
  ),
  question: "מה הסיבה העיקרית ל-Mobile First?",
  options: [
    "כי מסכי טלפון יפים יותר מדסקטופ",
    "כי רוב המשתמשים גולשים ממובייל — עדיף לעצב לרוב תחילה",
    "כי קל יותר לעצב לטלפון",
  ],
  correct: 1,
  okMsg: "בדיוק! כשרוב המשתמשים גולשים ממובייל — זה הקהל הראשי. עיצוב Mobile First מבטיח שהחוויה תהיה מושלמת עבורם. דסקטופ מקבל גרסה מורחבת — לא להפך.",
  errMsg: "Mobile First = לעצב לקהל הגדול ביותר ראשון. אם 60%+ גולשים ממובייל ועיצבת קודם לדסקטופ — עשית את העבודה בסדר הפוך. זה טעות ראשית שחברות עדיין עושות.",
  learned: "Mobile First = עיצוב לקהל הגדול ביותר ראשון",
};

const STEPS_UX: Step[] = [UX0, UX1, UX2, UX3, UX4, UX5, UX6];

// ─────────────────────────────────────────────────────────────────────────────
// SEQUENCE INTERACTION
// ─────────────────────────────────────────────────────────────────────────────

function SequenceInteraction({
  step,
  onAnswer,
  initialOrder,
  theme,
}: {
  step: SequenceStep;
  onAnswer: (order: number[], correct: boolean) => void;
  initialOrder?: number[];
  theme: SimTheme;
}) {
  const [sequence, setSequence] = useState<number[]>(initialOrder ?? []);
  const [submitted, setSubmitted] = useState(Boolean(initialOrder));

  function tapItem(i: number) {
    if (submitted || sequence.includes(i)) return;
    setSequence((prev) => [...prev, i]);
  }

  function submit() {
    if (submitted || sequence.length !== step.items.length) return;
    const isCorrect = sequence.every((idx, pos) => idx === step.correctOrder[pos]);
    setSubmitted(true);
    onAnswer(sequence, isCorrect);
  }

  function reset() {
    setSequence([]);
    setSubmitted(false);
  }

  const complete = sequence.length === step.items.length;

  return (
    <div style={{ fontFamily: theme.fontUI }}>
      <div className="text-[13.5px] font-bold mb-4" style={{ color: theme.textDark, ...HEEBO, fontFamily: theme.fontUI }}>
        {step.instruction}
      </div>

      <div className="flex flex-col gap-[9px] mb-4">
        {step.items.map((item, i) => {
          const rank = sequence.indexOf(i);
          const tapped = rank !== -1;
          return (
            <button
              key={i}
              type="button"
              disabled={tapped || submitted}
              onClick={() => tapItem(i)}
              className="text-right w-full"
            >
              <div
                className="rounded-xl px-4 py-[13px] flex items-center gap-3 transition-all"
                style={{
                  background: tapped ? theme.accentSoft : theme.cardBg,
                  border: `1.5px solid ${tapped ? theme.accent : theme.cardBorder}`,
                  opacity: tapped ? 1 : submitted ? 0.45 : 1,
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
                  style={{
                    background: tapped ? theme.accent : theme.progressTrack,
                    color: tapped ? "#fff" : theme.textFaint,
                  }}
                >
                  {tapped ? rank + 1 : "·"}
                </div>
                <span className="text-[13.5px] flex-1" style={{ color: tapped ? theme.textDark : theme.textMuted }}>
                  {item}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex items-center gap-3 mt-1">
          {sequence.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="text-[12px] font-bold"
              style={{ color: theme.textFaint }}
            >
              אפסי
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!complete}
            className="flex-1 py-[12px] rounded-xl text-[14px] font-bold transition-all"
            style={{
              background: complete ? theme.accentGradient : theme.progressTrack,
              color: complete ? "#fff" : theme.textFaint,
              fontFamily: theme.fontUI,
            }}
          >
            {complete ? "בדקי את הסדר ✓" : `בחרי עוד ${step.items.length - sequence.length}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHOICE INTERACTION
// ─────────────────────────────────────────────────────────────────────────────

function ChoiceInteraction({
  step,
  onAnswer,
  initialSelected,
  theme,
}: {
  step: ChoiceStep;
  onAnswer: (selected: number, correct: boolean) => void;
  initialSelected?: number;
  theme: SimTheme;
}) {
  const t = theme;
  const [selected, setSelected] = useState<number | null>(initialSelected ?? null);
  const revealed = selected !== null;

  function handleSelect(i: number) {
    if (revealed) return;
    setSelected(i);
    onAnswer(i, i === step.correct);
  }

  return (
    <div style={{ fontFamily: t.fontUI }}>
      <div className="text-[15px] font-bold mb-4" style={{ color: t.textDark, ...HEEBO, fontFamily: t.fontUI }}>
        {step.question}
      </div>
      <div className="flex flex-col gap-[9px]">
        {step.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOpt = i === step.correct;
          let bg = t.cardBg;
          let border = t.cardBorder;
          let color = t.textMuted;
          let suffix: React.ReactNode = null;

          if (revealed) {
            if (isCorrectOpt) {
              bg = t.successBg;
              border = t.successBorder;
              color = t.successText;
              suffix = <span className="text-[16px] shrink-0">✓</span>;
            } else if (isSelected) {
              bg = t.errorBg;
              border = t.errorBorder;
              color = t.errorText;
              suffix = <span className="text-[16px] shrink-0">✗</span>;
            } else {
              color = t.textFaint;
            }
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH INTERACTION — משחק התאמה
// ─────────────────────────────────────────────────────────────────────────────

// מסובבת את סדר הפריטים כך שאף פריט לא יישאר מול הזוג שלו — פשוט וקבוע (לא תלוי-רנדום)
function shuffledIndices(n: number): number[] {
  const rotateBy = n > 1 ? Math.ceil(n / 2) : 0;
  return Array.from({ length: n }, (_, i) => (i + rotateBy) % n);
}

function MatchInteraction({
  step,
  onAnswer,
  initialMistakes,
  theme,
}: {
  step: MatchStep;
  onAnswer: (mistakes: number, correct: boolean) => void;
  initialMistakes?: number;
  theme: SimTheme;
}) {
  const t = theme;
  const alreadyDone = initialMistakes !== undefined;
  const [rightOrder] = useState(() => shuffledIndices(step.pairs.length));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(
    () => (alreadyDone ? new Set(step.pairs.map((_, i) => i)) : new Set())
  );
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(initialMistakes ?? 0);
  const [done, setDone] = useState(alreadyDone);

  function pickLeft(i: number) {
    if (matched.has(i) || done) return;
    setSelectedLeft(i);
  }

  function pickRight(rightIdx: number) {
    if (selectedLeft === null || done) return;
    const isMatch = selectedLeft === rightIdx;
    if (isMatch) {
      const next = new Set(matched).add(selectedLeft);
      setMatched(next);
      setSelectedLeft(null);
      if (next.size === step.pairs.length) {
        setDone(true);
        onAnswer(mistakes, mistakes === 0);
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongFlash(rightIdx);
      setTimeout(() => setWrongFlash(null), 400);
      setSelectedLeft(null);
    }
  }

  return (
    <div style={{ fontFamily: t.fontUI }}>
      <div className="text-[13.5px] font-bold mb-4" style={{ color: t.textDark, ...HEEBO, fontFamily: t.fontUI }}>
        {step.instruction}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-[9px]">
          {step.pairs.map((pair, i) => {
            const isMatched = matched.has(i);
            const isSelected = selectedLeft === i;
            return (
              <button
                key={i}
                type="button"
                disabled={isMatched}
                onClick={() => pickLeft(i)}
                className="text-right w-full"
              >
                <div
                  className="rounded-xl px-3 py-[11px] text-[12.5px] font-mono transition-all"
                  style={{
                    background: isMatched ? t.successBg : isSelected ? t.accentSoft : t.cardBg,
                    border: `1.5px solid ${isMatched ? t.successBorder : isSelected ? t.accent : t.cardBorder}`,
                    color: isMatched ? t.successText : isSelected ? t.accent : t.textMuted,
                    opacity: isMatched ? 0.6 : 1,
                    fontFamily: t.fontCode,
                  }}
                  dir="ltr"
                >
                  {pair.left}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex-1 flex flex-col gap-[9px]">
          {rightOrder.map((origIdx) => {
            const isMatched = matched.has(origIdx);
            const isWrong = wrongFlash === origIdx;
            return (
              <button
                key={origIdx}
                type="button"
                disabled={isMatched}
                onClick={() => pickRight(origIdx)}
                className="text-right w-full"
              >
                <div
                  className="rounded-xl px-3 py-[11px] text-[12px] leading-[1.4] transition-all"
                  style={{
                    background: isMatched ? t.successBg : isWrong ? t.errorBg : t.cardBg,
                    border: `1.5px solid ${isMatched ? t.successBorder : isWrong ? t.errorBorder : t.cardBorder}`,
                    color: isMatched ? t.successText : isWrong ? t.errorText : t.textMuted,
                    opacity: isMatched ? 0.6 : 1,
                  }}
                >
                  {step.pairs[origIdx].right}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {!done && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11.5px]" style={{ color: t.textFaint }}>
            {matched.size} / {step.pairs.length} הותאמו
          </span>
          {mistakes > 0 && (
            <span className="text-[11.5px] font-bold" style={{ color: t.errorText }}>
              {mistakes} טעויות
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE INTERACTION — השלמה בהקלדה
// ─────────────────────────────────────────────────────────────────────────────

function TypeInteraction({
  step,
  onAnswer,
  initialValue,
  theme,
}: {
  step: TypeStep;
  onAnswer: (value: string, correct: boolean) => void;
  initialValue?: string;
  theme: SimTheme;
}) {
  const t = theme;
  const [value, setValue] = useState(initialValue ?? "");
  const [revealed, setRevealed] = useState(Boolean(initialValue));
  const [wasCorrect, setWasCorrect] = useState(() =>
    initialValue
      ? step.accepted.some((a) => a.trim().toLowerCase() === initialValue.trim().toLowerCase())
      : false
  );
  const [showHint, setShowHint] = useState(false);

  function submit() {
    if (revealed || !value.trim()) return;
    const normalized = value.trim().toLowerCase();
    const correct = step.accepted.some((a) => a.trim().toLowerCase() === normalized);
    setWasCorrect(correct);
    setRevealed(true);
    onAnswer(value, correct);
  }

  const answer = step.accepted[0];
  const hintText = answer[0] + "_".repeat(Math.max(answer.length - 1, 1));

  return (
    <div style={{ fontFamily: t.fontUI }}>
      <div className="text-[15px] font-bold mb-4" style={{ color: t.textDark, ...HEEBO, fontFamily: t.fontUI }}>
        {step.question}
      </div>
      <input
        type="text"
        dir="ltr"
        disabled={revealed}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={step.placeholder ?? "הקלידי כאן..."}
        className="w-full rounded-xl px-4 py-[14px] text-[14px] font-mono mb-2 outline-none"
        style={{
          background: t.cardBg,
          border: `1.5px solid ${revealed ? (wasCorrect ? t.successBorder : t.errorBorder) : t.cardBorder}`,
          color: revealed ? (wasCorrect ? t.successText : t.errorText) : t.textDark,
          fontFamily: t.fontCode,
        }}
      />
      {!revealed && (
        <div className="flex items-center justify-end mb-3 h-[18px]">
          {showHint ? (
            <span className="text-[11.5px] font-mono" style={{ color: t.textFaint }}>
              רמז: {hintText}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-[11.5px] font-bold"
              style={{ color: t.hintText }}
            >
              💡 הצג רמז
            </button>
          )}
        </div>
      )}
      {!revealed && (
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="w-full py-[12px] rounded-xl text-[14px] font-bold transition-all"
          style={{
            background: value.trim() ? t.accentGradient : t.progressTrack,
            color: value.trim() ? "#fff" : t.textFaint,
            fontFamily: t.fontUI,
          }}
        >
          בדקי
        </button>
      )}
      {revealed && !wasCorrect && (
        <div className="text-[12px] font-mono" style={{ color: t.textFaint }}>
          התשובה הנכונה: <span className="font-bold" style={{ color: t.successText }}>{answer}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT SCREEN — גרף צמיחה + קריירה
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN META — result screen content per domain
// ─────────────────────────────────────────────────────────────────────────────

const DOMAIN_META: Record<string, {
  simTitle: string;
  heroTexts: [string, string, string];
  skills: { label: string; val: number }[];
  careerText: string;
}> = {
  code: {
    simTitle: "טעימה — פיתוח",
    heroTexts: ["חשבת כמו מפתחת!", "בדרך הנכונה!", "ניצחת את השלב הראשון!"],
    skills: [
      { label: "הבנת מחשבים", val: 80 },
      { label: "חשיבה אלגוריתמית", val: 70 },
      { label: "הבנת פונקציות", val: 75 },
      { label: "קריאת קוד", val: 60 },
      { label: "ציד באגים", val: 55 },
    ],
    careerText: "כל הקוד שעברת היום — מפתחות ב-Wix, Monday.com, Fiverr ו-IDF Tech כותבות גרסאות מתקדמות שלו כל יום. מירב התחילה בדיוק מפה — ואחרי 14 חודשים קיבלה עבודה.",
  },
  data: {
    simTitle: "טעימה — דאטה",
    heroTexts: ["חשבת כמו אנליסטית!", "הדרך הנכונה לתובנות!", "ניצחת את השלב הראשון!"],
    skills: [
      { label: "סיווג נתונים", val: 75 },
      { label: "חשיבה אנליטית", val: 80 },
      { label: "קריאת גרפים", val: 65 },
      { label: "הבנת KPI", val: 70 },
      { label: "זיהוי הטיות", val: 60 },
    ],
    careerText: "כל ניתוח שעשית היום — דאטה אנליסטיות ב-Waze, Monday.com, Bank Hapoalim ו-IDF Tech עושות גרסאות מתקדמות שלו כל יום. תמר התחילה בדיוק מפה — ואחרי שנה קיבלה עבודה.",
  },
  marketing: {
    simTitle: "טעימה — שיווק",
    heroTexts: ["חשבת כמו משווקת!", "בדרך ללקוחות הנכונים!", "ניצחת את השלב הראשון!"],
    skills: [
      { label: "הבנת לקוחות", val: 80 },
      { label: "חשיבה אסטרטגית", val: 72 },
      { label: "שיווק דיגיטלי", val: 68 },
      { label: "ניתוח CAC", val: 75 },
      { label: "מיתוג", val: 65 },
    ],
    careerText: "כל המושגים שלמדת היום — אנשי שיווק ב-Monday.com, WalkMe, Wix ו-SimilarWeb משתמשים בהם כל יום. שלומית התחילה בדיוק מפה — בלי ניסיון טק — ואחרי שנה עבדה מהבית.",
  },
  ai: {
    simTitle: "טעימה — AI",
    heroTexts: ["חשבת כמו Data Scientist!", "בדרך להבנת ה-AI!", "ניצחת את השלב הראשון!"],
    skills: [
      { label: "הבנת AI", val: 78 },
      { label: "חשיבה על נתונים", val: 72 },
      { label: "Prompt Engineering", val: 68 },
      { label: "זיהוי הטיות AI", val: 75 },
      { label: "בחירת כלי נכון", val: 65 },
    ],
    careerText: "כל מה שגילית היום — Data Scientists ב-Intel, Mobileye, Google ו-Microsoft Israel עובדים איתו כל יום. מאיה התחילה כמורה לביולוגיה ואחרי שנה נכנסה ל-Intel. הרקע שלך — נכס.",
  },
  cyber: {
    simTitle: "טעימה — סייבר",
    heroTexts: ["חשבת כמו מגינת סייבר!", "בדרך הנכונה לאבטחה!", "ניצחת את השלב הראשון!"],
    skills: [
      { label: "זיהוי איומים", val: 78 },
      { label: "Social Engineering", val: 82 },
      { label: "ניתוח חולשות", val: 68 },
      { label: "אבטחת מידע", val: 73 },
      { label: "תגובה לאירועים", val: 65 },
    ],
    careerText: "כל מה שחווית היום — אנשי סייבר ב-Check Point, CyberArk, Wiz ו-IDF Tech עובדים איתו כל יום. רונית עברה מ-8200 ללא ניסיון סייבר ספציפי — ואחרי קורס נכנסה לתחום.",
  },
  ux: {
    simTitle: "טעימה — עיצוב UX",
    heroTexts: ["חשבת כמו UX Designer!", "בדרך הנכונה לעיצוב!", "ניצחת את השלב הראשון!"],
    skills: [
      { label: "הבנת משתמשים", val: 80 },
      { label: "Design Thinking", val: 75 },
      { label: "UX Writing", val: 68 },
      { label: "A/B Testing", val: 72 },
      { label: "Mobile First", val: 70 },
    ],
    careerText: "כל מה שחווית היום — UX Designers ב-Fiverr, Monday.com, WalkMe ו-IDF Tech עובדות איתו כל יום. לילך התחילה ממדעי חברה ואחרי שנה הפכה ל-UX Researcher.",
  },
};

function getSteps(domain: string): Step[] {
  if (domain === "data") return STEPS_DATA;
  if (domain === "marketing") return STEPS_MARKETING;
  if (domain === "ai") return STEPS_AI;
  if (domain === "cyber") return STEPS_CYBER;
  if (domain === "ux") return STEPS_UX;
  return STEPS_CODE; // default (code)
}

function getDomainMeta(domain: string) {
  return DOMAIN_META[domain] ?? DOMAIN_META.code;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function ResultScreen({ score, answers, nextDomain, domain }: { score: number; answers: boolean[]; nextDomain: string | null; domain: string }) {
  const theme = getTheme(domain);
  const playful = domain === "code";
  const steps = getSteps(domain);
  const meta = getDomainMeta(domain);
  const pct = Math.round((score / steps.length) * 100);

  const skills = meta.skills;

  return (
    <div className="px-[22px] pt-7 pb-36" style={{ fontFamily: theme.fontUI }}>
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="text-[52px] mb-2">{pct >= 80 ? "🎯" : pct >= 55 ? "💪" : "🌱"}</div>
        <div className="text-[26px] leading-tight" style={playful ? { color: theme.textDark, fontWeight: 800 } : { color: "#023e8a", ...HEEBO }}>
          {pct >= 80 ? meta.heroTexts[0] : pct >= 55 ? meta.heroTexts[1] : meta.heroTexts[2]}
        </div>
        <div className="text-[13px] mt-2" style={{ color: theme.textFaint }}>
          {score} מתוך {steps.length} · {meta.simTitle.replace("טעימה — ", "")}
        </div>
      </div>

      {/* Skills — 3-stage progress */}
      <div className="mb-7">
        <div className="text-[15px] font-black mb-1" style={{ color: theme.textDark }}>
          5 כישורים שגילית היום ✓
        </div>
        <div className="text-[11.5px] mb-4" style={{ color: "rgba(0,0,0,0.45)" }}>
          לפני הטעימה — לא הכרת אף אחד מהם
        </div>
        <div className="flex flex-col gap-3">
          {skills.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-[12px] font-bold shrink-0 w-[110px] text-right" style={{ color: theme.textDark }}>
                {s.label}
              </div>
              {/* Stage 1 — before */}
              <div className="rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0"
                style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.3)" }}>
                לא הכרתי
              </div>
              <div className="text-[10px] shrink-0" style={{ color: "rgba(0,0,0,0.2)" }}>→</div>
              {/* Stage 2 — NOW (highlighted) */}
              <div className="rounded-full px-3 py-1 text-[11px] font-black shrink-0 text-white"
                style={{ background: "#0d9488", boxShadow: "0 2px 8px rgba(13,148,136,0.35)" }}>
                ✓ גיליתי!
              </div>
              <div className="text-[10px] shrink-0" style={{ color: "rgba(0,0,0,0.2)" }}>→</div>
              {/* Stage 3 — future */}
              <div className="rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0"
                style={{ background: "rgba(13,148,136,0.08)", color: "rgba(13,148,136,0.45)", border: "1px dashed rgba(13,148,136,0.3)" }}>
                שולטת
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl px-4 py-2.5 text-center text-[11.5px] font-bold"
          style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488" }}>
          "שולטת" מגיעה עם הלימודים — כבר התחלת 🎯
        </div>
      </div>

      {/* What you learned */}
      <div className="mb-6">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textFaint }}
        >
          מושגים שהפנמת
        </div>
        <div className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: answers[i] ? theme.successBg : theme.accentSoft,
                border: `1px solid ${answers[i] ? theme.successBorder : theme.accent}55`,
              }}
            >
              <span style={{ color: answers[i] ? theme.successText : theme.textFaint, fontSize: 15 }}>
                {answers[i] ? "✓" : "○"}
              </span>
              <span className="text-[12px]" style={{ color: theme.textDark }}>
                {s.concept}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Career connection */}
      <div
        className="mb-7 rounded-2xl p-4"
        style={{ background: theme.hintBg, border: `1.5px solid ${theme.hintBorder}` }}
      >
        <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: playful ? theme.hintText : "#fb8500" }}>
          מה זה אומר לקריירה שלך
        </div>
        <div className="text-[13px] leading-[1.65]" style={{ color: theme.textMuted }}>
          {meta.careerText}
        </div>
      </div>

      {domain === "data" && (
        <>
          <button
            onClick={() => {
              try {
                const journey = JSON.parse(localStorage.getItem("data-journey") || "{}");
                localStorage.setItem("data-journey", JSON.stringify({ ...journey, sim: true }));
              } catch {/* ignore */}
              window.location.href = "/explore/data/learn";
            }}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "#0d9488", color: "#fff", fontFamily: "'Heebo', sans-serif" }}
          >
            רוצה לצלול עמוק יותר בדאטה ←
          </button>
          <button
            onClick={() => {
              try {
                const journey = JSON.parse(localStorage.getItem("data-journey") || "{}");
                localStorage.setItem("data-journey", JSON.stringify({ ...journey, sim: true }));
              } catch {/* ignore */}
              window.location.href = "/explore/data/courses";
            }}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: "1.5px solid #0d9488", color: "#0d9488", fontFamily: "'Heebo', sans-serif" }}
          >
            טעמתי מספיק מדאטה — קדימה לתחום הבא ←
          </button>
        </>
      )}

      {domain !== "data" && (
        <Link
          href={nextDomain ? `/explore/${nextDomain}` : "/explore"}
          className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-4"
          style={{
            background: theme.accentGradient,
            color: "#fff",
            fontFamily: theme.fontUI,
          }}
        >
          {nextDomain ? `לתחום הבא ←` : "חזרה למסלול ←"}
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIM FLOW
// ─────────────────────────────────────────────────────────────────────────────

// תשובה שנשמרת לכל שלב — כך אפשר לחזור אחורה ולראות מה נענה בלי לאבד ציון או להכפיל אותו
type StepResponse =
  | { kind: "choice"; selected: number; correct: boolean }
  | { kind: "sequence"; order: number[]; correct: boolean }
  | { kind: "match"; mistakes: number; correct: boolean }
  | { kind: "type"; value: string; correct: boolean };

function SimFlow({
  onComplete,
  domain,
  onStepIndexChange,
}: {
  onComplete: (score: number, answers: boolean[]) => void;
  domain: string;
  onStepIndexChange?: (i: number) => void;
}) {
  const theme = getTheme(domain);
  const playful = domain === "code";
  const steps = getSteps(domain);
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, StepResponse>>({});
  const feedbackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    onStepIndexChange?.(stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const step = steps[stepIndex];
  const current = responses[stepIndex];
  const answered = current !== undefined;
  const lastCorrect = current?.correct ?? false;
  const score = Object.values(responses).filter((r) => r.correct).length;
  const pct = Math.round(((stepIndex + 1) / steps.length) * 100);

  function recordResponse(response: StepResponse) {
    setResponses((prev) => ({ ...prev, [stepIndex]: response }));
    setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((s) => s + 1);
    } else {
      const correctness = steps.map((_, i) => responses[i]?.correct ?? false);
      onComplete(score, correctness);
    }
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  }

  return (
    <div className="pb-4" style={{ fontFamily: theme.fontUI }}>
      {playful ? (
        <div className="px-[22px] pt-3 mb-2">
          <div className="flex items-center gap-[10px]">
            <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: theme.accent }}>
              {stepIndex + 1} / {steps.length}
            </span>
            <div className="flex-1 h-[10px] rounded-full overflow-hidden" style={{ background: theme.progressTrack }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: theme.headerGradient }} />
            </div>
            <span className="text-[11px] whitespace-nowrap" style={{ color: theme.textFaint }}>
              {score} נכון עד כה
            </span>
          </div>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="text-[11.5px] font-bold mt-3"
              style={{ color: theme.accent }}
            >
              → חזרה לשלב הקודם
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-[5px] justify-center py-5">
            {steps.map((s, i) => {
              const levelColor = s.level === 2 ? "#fb8500" : s.level === 3 ? "#dc2626" : "#3b82f6";
              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    height: 7,
                    width: i === stepIndex ? 22 : 7,
                    background: i <= stepIndex ? levelColor : `${levelColor}2e`,
                  }}
                />
              );
            })}
          </div>

          {/* Level divider */}
          {step.level && step.level !== steps[stepIndex - 1]?.level && (
            <div className="px-[22px] mb-4">
              <div
                className="rounded-xl py-2 text-center text-[11.5px] font-bold uppercase tracking-widest"
                style={{ background: theme.headerGradient, color: "#fff", ...HEEBO }}
              >
                {LEVEL_LABELS[step.level]}
              </div>
            </div>
          )}

          {/* Tag */}
          <div className="px-[22px] mb-5">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-[10px] py-[4px] rounded-full"
                style={{ background: theme.accentSoft, color: theme.accent }}
              >
                {step.tag} · {stepIndex + 1} / {steps.length}
              </span>
              <span className="text-[11px]" style={{ color: theme.textFaint }}>
                {score} נכון עד כה
              </span>
            </div>
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-[11.5px] font-bold mt-2"
                style={{ color: theme.accent }}
              >
                → חזרה לשלב הקודם
              </button>
            )}
          </div>
        </>
      )}

      {/* Context */}
      <div className="px-[22px]">{step.context}</div>

      {/* Interaction */}
      <div className="px-[22px] mb-4">
        {step.kind === "sequence" ? (
          <SequenceInteraction
            key={stepIndex}
            step={step}
            initialOrder={current?.kind === "sequence" ? current.order : undefined}
            onAnswer={(order, correct) => recordResponse({ kind: "sequence", order, correct })}
            theme={theme}
          />
        ) : step.kind === "match" ? (
          <MatchInteraction
            key={stepIndex}
            step={step}
            initialMistakes={current?.kind === "match" ? current.mistakes : undefined}
            onAnswer={(mistakes, correct) => recordResponse({ kind: "match", mistakes, correct })}
            theme={theme}
          />
        ) : step.kind === "type" ? (
          <TypeInteraction
            key={stepIndex}
            step={step}
            initialValue={current?.kind === "type" ? current.value : undefined}
            onAnswer={(value, correct) => recordResponse({ kind: "type", value, correct })}
            theme={theme}
          />
        ) : (
          <ChoiceInteraction
            key={stepIndex}
            step={step}
            initialSelected={current?.kind === "choice" ? current.selected : undefined}
            onAnswer={(selected, correct) => recordResponse({ kind: "choice", selected, correct })}
            theme={theme}
          />
        )}
      </div>

      {/* Feedback */}
      {answered && (
        <div ref={feedbackRef} className="px-[22px]">
          <div
            className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-3"
            style={{
              background: lastCorrect ? theme.successBg : theme.accentSoft,
              border: `1px solid ${lastCorrect ? theme.successBorder : theme.accent}44`,
              color: lastCorrect ? theme.successText : theme.textDark,
            }}
          >
            {lastCorrect ? step.okMsg : step.errMsg}
          </div>

          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10.5px]" style={{ color: theme.textFaint }}>הפנמת:</span>
            <span
              className="text-[11px] font-bold px-[10px] py-[4px] rounded-full"
              style={{ background: theme.accentSoft, color: theme.accent }}
            >
              {step.learned}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px] mb-4"
            style={{ background: theme.accentGradient, fontFamily: theme.fontUI, boxShadow: playful ? "0 6px 16px rgba(95,61,255,.3)" : undefined }}
          >
            {stepIndex < steps.length - 1 ? "הבא ←" : "סיימתי — תראי תוצאות"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

function getNextDomain(currentDomain: string): string | null {
  try {
    const saved = localStorage.getItem("explore-ranking");
    if (!saved) return null;
    const ranking: string[] = JSON.parse(saved);
    const idx = ranking.indexOf(currentDomain);
    if (idx === -1 || idx === ranking.length - 1) return null;
    return ranking[idx + 1];
  } catch {
    return null;
  }
}

const IMPLEMENTED_DOMAINS = new Set(["code", "data", "marketing", "ai", "cyber", "ux"]);

export default function SimPage() {
  const { domain } = useParams();
  const domainStr = domain as string;
  const theme = getTheme(domainStr);
  const playful = domainStr === "code";
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [nextDomain, setNextDomain] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = getSteps(domainStr);
  const meta = getDomainMeta(domainStr);

  if (!IMPLEMENTED_DOMAINS.has(domainStr)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fbf9f5" }}>
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <div className="text-[40px]">🚧</div>
          <div className="text-[16px] font-bold text-navy" style={HEEBO}>הסימולציה בפיתוח</div>
          <Link href={`/explore/${domainStr}`} className="text-[13px] font-bold" style={{ color: "#023e8a" }}>
            ← חזרה לתחום
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  // רשימת הרמות הייחודיות (לפי סדר הופעה) — לניווט הצדדי בדסקטופ, בהשראת מוקאפ ה-Playful
  const levelList: { level: number; label: string }[] = [];
  steps.forEach((s) => {
    if (s.level && !levelList.some((l) => l.level === s.level)) {
      const parts = LEVEL_LABELS[s.level].split(" · ");
      levelList.push({ level: s.level, label: parts[1] ?? LEVEL_LABELS[s.level] });
    }
  });
  const currentLevel = steps[currentStepIndex]?.level;

  const sidebar = playful && !done && levelList.length > 0 && (
    <div
      className="hidden md:flex md:sticky md:top-0 md:h-screen w-[260px] shrink-0 flex-col gap-[22px] p-[28px] overflow-y-auto"
      style={{ background: theme.headerGradient, fontFamily: theme.fontUI }}
    >
      <Link href={`/explore/${domainStr}`} className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,.85)" }}>
        ← חזרה לתחום
      </Link>
      <div>
        <div className="text-[20px] font-extrabold" style={{ color: "#fff" }}>{meta.simTitle} 🚀</div>
        <div className="text-[11.5px] mt-1" style={{ color: "rgba(255,255,255,.85)" }}>
          התקדמות שלב-אחר-שלב עם דוגמאות אמיתיות
        </div>
      </div>
      <div className="flex flex-col gap-[10px] mt-1">
        {levelList.map((l, idx) => {
          const active = l.level === currentLevel;
          const passed = currentLevel !== undefined && l.level < currentLevel;
          return (
            <div key={l.level} className="flex items-center gap-[10px]" style={{ opacity: active || passed ? 1 : 0.55 }}>
              <span
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0"
                style={{
                  background: active || passed ? "#fff" : "rgba(255,255,255,.3)",
                  color: active || passed ? theme.accent : "#fff",
                }}
              >
                {passed ? "✓" : idx + 1}
              </span>
              <span className="text-[12.5px] font-bold" style={{ color: "#fff" }}>{l.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-auto mb-[15%] p-[14px] rounded-xl" style={{ background: "rgba(255,255,255,.18)" }}>
        <div className="text-[11px] font-bold mb-[6px]" style={{ color: "#fff" }}>🎯 ההתקדמות שלך</div>
        <div className="h-[8px] rounded-[5px] overflow-hidden" style={{ background: "rgba(255,255,255,.35)" }}>
          <div className="h-full rounded-[5px] transition-all duration-300" style={{ width: `${pct}%`, background: "#fff" }} />
        </div>
        <div className="text-[10.5px] font-semibold mt-[6px]" style={{ color: "rgba(255,255,255,.9)" }}>
          {currentStepIndex + 1} / {steps.length} שלבים
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.pageBg, fontFamily: theme.fontUI }}>
      {playful ? (
        <div className="md:hidden px-[22px] pt-[16px] pb-1 shrink-0">
          <Link
            href={`/explore/${domainStr}`}
            className="inline-flex items-center gap-1 text-[12.5px] font-bold px-3 py-[7px] rounded-full"
            style={{ background: theme.cardBg, color: theme.accent, border: `1.5px solid ${theme.cardBorder}` }}
          >
            ← חזרה לתחום
          </Link>
        </div>
      ) : (
        <div
          className="text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0"
          style={{ background: theme.headerGradient }}
        >
          <div className="max-w-[720px] mx-auto">
            <Link href={`/explore/${domainStr}`} className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
              ← חזרה לתחום
            </Link>
            <div className="text-[28px] md:text-[32px] leading-tight" style={HEEBO}>
              {done ? "סיימת!" : meta.simTitle}
            </div>
            <div className="text-[13px] mt-[6px]" style={{ opacity: 0.8 }}>
              {done ? "הנה מה שבנית היום" : `${steps.length} שלבים · מהמושג הראשון עד הכלים האמיתיים`}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex w-full">
        {sidebar}
        <div className={playful ? "flex-1 max-w-[880px] mx-auto w-full" : "flex-1 max-w-[720px] mx-auto w-full"}>
          {playful && !done && (
            <div className="px-[22px] md:px-9 pt-6 flex items-start justify-between gap-3 flex-wrap-reverse">
              <div>
                <div className="text-[22px] md:text-[26px] font-extrabold leading-tight" style={{ color: theme.textDark }}>
                  {meta.simTitle}
                </div>
                <div className="text-[12.5px] mt-1" style={{ color: theme.textFaint }}>
                  {steps.length} שלבים · מהמושג הראשון עד הכלים האמיתיים
                </div>
              </div>
              {currentLevel && (
                <span
                  className="text-[11.5px] font-bold px-[14px] py-[7px] rounded-full whitespace-nowrap"
                  style={{ background: theme.accentGradient, color: "#fff" }}
                >
                  ⭐ {LEVEL_LABELS[currentLevel]}
                </span>
              )}
            </div>
          )}
          {done ? (
            <ResultScreen score={score} answers={answers} nextDomain={nextDomain} domain={domainStr} />
          ) : (
            <SimFlow
              domain={domainStr}
              onStepIndexChange={setCurrentStepIndex}
              onComplete={(s, a) => {
                setScore(s);
                setAnswers(a);
                setNextDomain(getNextDomain(domainStr));
                setDone(true);
                // Save to Supabase
                const totalSteps = getSteps(domainStr).length;
                saveSimulationProgress(domainStr, totalSteps, true, s);
                updateTask(`sim-${domainStr}`, "done", 100);
              }}
            />
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
