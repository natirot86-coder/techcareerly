"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

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
};

type Step = ChoiceStep | SequenceStep;

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
// ALL STEPS — code
// ─────────────────────────────────────────────────────────────────────────────

const STEPS_CODE: Step[] = [S0, S1, S2, S3, S4, S5, S6];

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
  concept: "כמותי vs איכותי",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כל נתון בעולם שייך לאחת משתי קטגוריות:
      </p>
      <div className="flex gap-3 mb-5">
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.18)" }}
        >
          <div className="text-[12px] font-bold mb-2" style={{ color: "#0d9488" }}>כמותי (מספרי)</div>
          <div className="text-[11.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>
            ✓ גיל: 27<br />
            ✓ מחיר: ₪299<br />
            ✓ כמות קליקים: 4,820
          </div>
        </div>
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}
        >
          <div className="text-[12px] font-bold mb-2" style={{ color: "#023e8a" }}>איכותי (לא מספרי)</div>
          <div className="text-[11.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>
            ✓ מין: נקבה<br />
            ✓ צבע עיניים: חום<br />
            ✓ סוג מכשיר: Android
          </div>
        </div>
      </div>
    </div>
  ),
  question: "כמה אנשים לחצו על כפתור ההרשמה — זה נתון:",
  options: ["איכותי — כי זו פעולה", "כמותי-ספיר — ספירה שלמה", "כמותי-רציף — אפשר לחצי לחיצה"],
  correct: 1,
  okMsg: "נכון! ספירת לחיצות = מספר שלם — לא ניתן ללחוץ 2.7 פעמים. זה כמותי-ספיר. המחשבה הזו חשובה כי כל כלי ניתוח עובד אחרת על סוגי נתונים שונים.",
  errMsg: "כמותי-ספיר — מספר לחיצות הוא מספר שלם שאפשר לספור. לא ניתן ללחוץ '3.5 פעמים'. ההבחנה בין סוגי נתונים קריטית לבחירת הכלי הנכון לניתוח.",
  learned: "כמותי = מספרים | איכותי = קטגוריות | ספיר = שלמים",
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
  concept: "KPI = מדד הצלחה",
  context: (
    <div>
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        כל חברה מגדירה <span className="font-bold" style={{ color: "#0d9488" }}>KPI</span> — מדדים שמראים האם היא בדרך הנכונה.
      </p>
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        <div className="text-[11.5px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>
          משפך הרכישה של אפליקציה:
        </div>
        {[
          { label: "כניסות לאתר", val: "10,000", w: "100%" },
          { label: "נרשמו", val: "1,000", w: "20%" },
          { label: "שילמו", val: "100", w: "4%" },
        ].map((row) => (
          <div key={row.label} className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-[11.5px] font-bold" style={{ color: "#023e8a" }}>{row.label}</span>
              <span className="text-[11px]" style={{ color: "#0d9488" }}>{row.val}</span>
            </div>
            <div className="h-[7px] rounded-full" style={{ background: "rgba(13,148,136,0.1)" }}>
              <div className="h-full rounded-full" style={{ width: row.w, background: "#0d9488" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  question: "מהו שיעור ההמרה מכניסה לאתר עד תשלום?",
  options: ["10% (1,000 מתוך 10,000)", "1% (100 מתוך 10,000)", "100% (כי כולם ראו)"],
  correct: 1,
  okMsg: "נכון! 100 משלמים מתוך 10,000 כניסות = 1%. זה KPI קריטי — נקרא Conversion Rate. אם עלה ל-2%, ההכנסה מוכפלת. הדאטה אנליסטית מזהה מה גרם לשינוי.",
  errMsg: "100 ÷ 10,000 = 1%. זהו ה-Conversion Rate — אחוז האנשים שבסוף שילמו. KPI זה הוא אחד החשובים ביותר בכל עסק דיגיטלי.",
  learned: "Conversion Rate = משלמים ÷ כניסות × 100",
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
          <div className="text-[12.5px] font-bold" style={{ color: "#c2410c" }}>מקרה אמיתי: Blinkist</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>
            אפליקציית סיכומי ספרים. השיקו עיצוב חדש + העלו מחיר. אחרי חודש — ירידה חדה במנויים.
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
      <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        אחד ה-KPI החשובים בכל עסק:
        <br />
        <span className="font-bold" style={{ color: "#0d9488" }}>CAC — Customer Acquisition Cost</span>
        <br />
        כמה עולה לי להביא לקוח חדש?
      </p>
      <div
        className="rounded-2xl p-4 mb-4 text-center"
        style={{ background: "#0f172a" }}
      >
        <div className="font-mono text-[15px] leading-[2]" style={{ color: "#e2e8f0" }} dir="ltr">
          <span style={{ color: "#a78bfa" }}>CAC</span>
          {" = "}
          <div className="inline-block text-center">
            <div style={{ color: "#34d399" }}>הוצאות שיווק + מכירות</div>
            <div style={{ borderTop: "1px solid #475569", paddingTop: 4, color: "#fbbf24" }}>
              _______________
            </div>
          </div>
        </div>
      </div>
      <div
        className="rounded-xl p-3 text-[12.5px] leading-[1.6]"
        style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.55)" }}
      >
        חברה הוציאה ₪50,000 על שיווק ומכירות החודש ורכשה 100 לקוחות חדשים.
      </div>
    </div>
  ),
  question: "מה ה-CAC של החברה?",
  options: ["₪50 ללקוח", "₪500 ללקוח", "₪5,000 ללקוח"],
  correct: 1,
  okMsg: "נכון! 50,000 ÷ 100 = ₪500 לכל לקוח. עכשיו השאלה: כמה הלקוח שווה לחברה לאורך זמן? אם הוא משלם ₪200 בחודש — ה-CAC מוחזר תוך פחות מ-3 חודשים.",
  errMsg: "50,000 ÷ 100 לקוחות = ₪500 לכל לקוח. זה ה-CAC. הכלל: CAC חייב להיות נמוך מ-LTV (Lifetime Value — כמה הלקוח מכניס לחברה לאורך זמן).",
  learned: "CAC = הוצאות שיווק ÷ לקוחות חדשים",
};

const DA6: ChoiceStep = {
  kind: "choice",
  tag: "הטיית נתונים",
  concept: "דאטה יכולה לשקר",
  context: (
    <div>
      <div
        className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
      >
        <span className="text-[20px] shrink-0">⚠️</span>
        <div>
          <div className="text-[12.5px] font-bold" style={{ color: "#b91c1c" }}>הטיית נתונים</div>
          <div className="text-[12px] mt-[2px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.58)" }}>
            כשאופן הצגת הנתונים גורם לנו להסיק מסקנות שגויות
          </div>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        {[
          { title: "גרף א׳", y: "0–100", desc: "עלייה של 3 יחידות נראית קטנה" },
          { title: "גרף ב׳", y: "47–50", desc: "אותה עלייה נראית ענקית!" },
        ].map((g) => (
          <div
            key={g.title}
            className="flex-1 rounded-xl p-3"
            style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
          >
            <div className="text-[11px] font-bold mb-1" style={{ color: "#023e8a" }}>{g.title}</div>
            <div className="text-[10px] mb-1" style={{ color: "rgba(0,0,0,0.38)" }}>ציר Y: {g.y}</div>
            <div className="text-[10.5px] leading-[1.4]" style={{ color: "rgba(0,0,0,0.55)" }}>{g.desc}</div>
          </div>
        ))}
      </div>
      <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.38)" }}>
        שני הגרפים מציגים את אותם נתונים בדיוק — רק ציר Y שונה.
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
      <div className="flex gap-3 mb-5">
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}
        >
          <div className="text-[12px] font-bold mb-2" style={{ color: "#c2410c" }}>PPC</div>
          <div className="text-[10.5px] font-bold mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>Pay Per Click</div>
          <div className="text-[11px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            ✓ תוצאות מיידיות<br />
            ✓ משלמים על כל לחיצה<br />
            ✗ עוצר כשהתקציב נגמר
          </div>
        </div>
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}
        >
          <div className="text-[12px] font-bold mb-2" style={{ color: "#023e8a" }}>SEO</div>
          <div className="text-[10.5px] font-bold mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>Search Engine Opt.</div>
          <div className="text-[11px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
            ✓ תנועה חינמית לאורך זמן<br />
            ✓ בונה אמינות<br />
            ✗ לוקח חודשים לראות תוצאות
          </div>
        </div>
      </div>
      <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.38)" }}>
        גוגל מציג מודעות PPC בראש התוצאות (מסומן "ממומן"), ואת תוצאות SEO מתחתן.
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
}: {
  step: SequenceStep;
  onAnswer: (correct: boolean) => void;
}) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function tapItem(i: number) {
    if (submitted || sequence.includes(i)) return;
    setSequence((prev) => [...prev, i]);
  }

  function submit() {
    if (submitted || sequence.length !== step.items.length) return;
    const isCorrect = sequence.every((idx, pos) => idx === step.correctOrder[pos]);
    setSubmitted(true);
    onAnswer(isCorrect);
  }

  function reset() {
    setSequence([]);
    setSubmitted(false);
  }

  const complete = sequence.length === step.items.length;

  return (
    <div>
      <div className="text-[13.5px] font-bold mb-4" style={{ color: "#023e8a", ...HEEBO }}>
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
                  background: tapped ? "rgba(59,130,246,0.09)" : "#fff",
                  border: `1.5px solid ${tapped ? "#3b82f6" : "rgba(0,0,0,0.08)"}`,
                  opacity: tapped ? 1 : submitted ? 0.45 : 1,
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
                  style={{
                    background: tapped ? "#3b82f6" : "rgba(0,0,0,0.08)",
                    color: tapped ? "#fff" : "rgba(0,0,0,0.35)",
                  }}
                >
                  {tapped ? rank + 1 : "·"}
                </div>
                <span className="text-[13.5px] flex-1" style={{ color: tapped ? "#1e3a8a" : "rgba(0,0,0,0.68)" }}>
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
              style={{ color: "rgba(0,0,0,0.38)" }}
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
              background: complete ? "#023e8a" : "rgba(0,0,0,0.06)",
              color: complete ? "#fff" : "rgba(0,0,0,0.3)",
              fontFamily: "'Heebo', sans-serif",
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
}: {
  step: ChoiceStep;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected !== null;

  function handleSelect(i: number) {
    if (revealed) return;
    setSelected(i);
    onAnswer(i === step.correct);
  }

  return (
    <div>
      <div className="text-[15px] font-bold mb-4" style={{ color: "#023e8a", ...HEEBO }}>
        {step.question}
      </div>
      <div className="flex flex-col gap-[9px]">
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
              color = "rgba(0,0,0,0.3)";
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
    simTitle: "סימולציה — פיתוח",
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
    simTitle: "סימולציה — דאטה",
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
    simTitle: "סימולציה — שיווק",
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
    simTitle: "סימולציה — AI",
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
    simTitle: "סימולציה — סייבר",
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
    simTitle: "סימולציה — עיצוב UX",
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
  const steps = getSteps(domain);
  const meta = getDomainMeta(domain);
  const pct = Math.round((score / steps.length) * 100);

  const skills = meta.skills;

  return (
    <div className="px-[22px] pt-7 pb-36">
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="text-[52px] mb-2">{pct >= 80 ? "🎯" : pct >= 55 ? "💪" : "🌱"}</div>
        <div className="text-[26px] leading-tight" style={{ color: "#023e8a", ...HEEBO }}>
          {pct >= 80 ? meta.heroTexts[0] : pct >= 55 ? meta.heroTexts[1] : meta.heroTexts[2]}
        </div>
        <div className="text-[13px] mt-2" style={{ color: "rgba(0,0,0,0.42)" }}>
          {score} מתוך {steps.length} · {meta.simTitle.replace("סימולציה — ", "")}
        </div>
      </div>

      {/* Growth graph — skill bars */}
      <div className="mb-7">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "rgba(0,0,0,0.32)" }}
        >
          כישורים שרכשת היום
        </div>
        <div className="flex flex-col gap-3">
          {skills.map((s, i) => (
            <div key={i}>
              <div className="flex justify-between mb-[5px]">
                <span className="text-[12px] font-bold" style={{ color: "#023e8a" }}>{s.label}</span>
                <span className="text-[11px]" style={{ color: "#3b82f6" }}>{s.val}%</span>
              </div>
              <div className="h-[6px] rounded-full" style={{ background: "rgba(59,130,246,0.12)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.val}%`,
                    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                    transition: "width 1s ease-out",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-[11px] mt-3 text-right" style={{ color: "rgba(0,0,0,0.35)" }}>
          לפני הסימולציה — הכל היה 0%
        </div>
      </div>

      {/* What you learned */}
      <div className="mb-6">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "rgba(0,0,0,0.32)" }}
        >
          מושגים שהפנמת
        </div>
        <div className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: answers[i]
                  ? "rgba(34,197,94,0.07)"
                  : "rgba(59,130,246,0.06)",
                border: `1px solid ${answers[i] ? "#22c55e33" : "#3b82f633"}`,
              }}
            >
              <span style={{ color: answers[i] ? "#22c55e" : "#94a3b8", fontSize: 15 }}>
                {answers[i] ? "✓" : "○"}
              </span>
              <span className="text-[12px]" style={{ color: "#1e3a8a" }}>
                {s.concept}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Career connection */}
      <div
        className="mb-7 rounded-2xl p-4"
        style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.22)" }}
      >
        <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#fb8500" }}>
          מה זה אומר לקריירה שלך
        </div>
        <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
          {meta.careerText}
        </div>
      </div>

      <Link
        href={nextDomain ? `/explore/${nextDomain}` : "/explore"}
        className="block w-full text-center py-[14px] rounded-xl text-white font-bold text-[15px] mb-4"
        style={{ background: "#fb8500", fontFamily: "'Heebo', sans-serif" }}
      >
        {nextDomain ? `לתחום הבא ←` : "חזרה למסלול ←"}
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIM FLOW
// ─────────────────────────────────────────────────────────────────────────────

function SimFlow({ onComplete, domain }: { onComplete: (score: number, answers: boolean[]) => void; domain: string }) {
  const steps = getSteps(domain);
  const [stepIndex, setStepIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const feedbackRef = React.useRef<HTMLDivElement>(null);

  const step = steps[stepIndex];

  function handleAnswer(correct: boolean) {
    setLastCorrect(correct);
    setAnswered(true);
    if (correct) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, correct]);
    setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((s) => s + 1);
      setAnswered(false);
      setLastCorrect(false);
    } else {
      onComplete(score, answers);
    }
  }

  return (
    <div className="pb-4">
      {/* Progress */}
      <div className="flex items-center gap-[5px] justify-center py-5">
        {steps.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              height: 7,
              width: i === stepIndex ? 22 : 7,
              background:
                i < stepIndex
                  ? "#3b82f6"
                  : i === stepIndex
                  ? "#3b82f6"
                  : "rgba(59,130,246,0.18)",
            }}
          />
        ))}
      </div>

      {/* Tag */}
      <div className="px-[22px] mb-5">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-[10px] py-[4px] rounded-full"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
          >
            {step.tag} · {stepIndex + 1} / {steps.length}
          </span>
          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.32)" }}>
            {score} נכון עד כה
          </span>
        </div>
      </div>

      {/* Context */}
      <div className="px-[22px]">{step.context}</div>

      {/* Interaction */}
      <div className="px-[22px] mb-4">
        {step.kind === "sequence" ? (
          <SequenceInteraction key={stepIndex} step={step} onAnswer={handleAnswer} />
        ) : (
          <ChoiceInteraction key={stepIndex} step={step} onAnswer={handleAnswer} />
        )}
      </div>

      {/* Feedback */}
      {answered && (
        <div ref={feedbackRef} className="px-[22px]">
          <div
            className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-3"
            style={{
              background: lastCorrect ? "rgba(34,197,94,0.07)" : "rgba(59,130,246,0.07)",
              border: `1px solid ${lastCorrect ? "#22c55e44" : "#3b82f644"}`,
              color: lastCorrect ? "#15803d" : "#1e40af",
            }}
          >
            {lastCorrect
              ? (step as ChoiceStep | SequenceStep).okMsg
              : (step as ChoiceStep | SequenceStep).errMsg}
          </div>

          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.32)" }}>הפנמת:</span>
            <span
              className="text-[11px] font-bold px-[10px] py-[4px] rounded-full"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
            >
              {step.learned}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px] mb-4"
            style={{ background: "#023e8a", fontFamily: "'Heebo', sans-serif" }}
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
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [nextDomain, setNextDomain] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0">
        <div className="max-w-[720px] mx-auto">
          <Link href={`/explore/${domainStr}`} className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה לתחום
          </Link>
          <div className="text-[28px] md:text-[32px] leading-tight" style={HEEBO}>
            {done ? "סיימת!" : meta.simTitle}
          </div>
          <div className="text-[13px] mt-[6px]" style={{ opacity: 0.72 }}>
            {done ? "הנה מה שבנית היום" : `${steps.length} שלבים · מהמושג הראשון עד הכלים האמיתיים`}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full">
        {done ? (
          <ResultScreen score={score} answers={answers} nextDomain={nextDomain} domain={domainStr} />
        ) : (
          <SimFlow
            domain={domainStr}
            onComplete={(s, a) => {
              setScore(s);
              setAnswers(a);
              setNextDomain(getNextDomain(domainStr));
              setDone(true);
            }}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
