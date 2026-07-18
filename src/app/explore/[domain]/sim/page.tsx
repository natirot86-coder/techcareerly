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
            <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.28)" }}>→</div>
            <div
              className="rounded-xl px-3 py-2 text-[12px] font-bold text-center flex-1"
              style={{ background: "#3b82f6", color: "#fff" }}
            >
              create_greeting
            </div>
            <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.28)" }}>→</div>
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
// ALL STEPS
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: Step[] = [S0, S1, S2, S3, S4, S5, S6];

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

function ResultScreen({ score, answers }: { score: number; answers: boolean[] }) {
  const pct = Math.round((score / STEPS.length) * 100);
  const great = score >= 5;

  // Skill bars — what they built up
  const skills = [
    { label: "הבנת מחשבים", val: 80 },
    { label: "חשיבה אלגוריתמית", val: 70 },
    { label: "הבנת פונקציות", val: 75 },
    { label: "קריאת קוד", val: 60 },
    { label: "ציד באגים", val: 55 },
  ];

  return (
    <div className="px-[22px] pt-7 pb-36">
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="text-[52px] mb-2">{pct >= 80 ? "🎯" : pct >= 55 ? "💪" : "🌱"}</div>
        <div className="text-[26px] leading-tight" style={{ color: "#023e8a", ...HEEBO }}>
          {pct >= 80
            ? "חשבת כמו מפתחת!"
            : pct >= 55
            ? "בדרך הנכונה!"
            : "ניצחת את השלב הראשון!"}
        </div>
        <div className="text-[13px] mt-2" style={{ color: "rgba(0,0,0,0.42)" }}>
          {score} מתוך {STEPS.length} · פיתוח תוכנה
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
          {STEPS.map((s, i) => (
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
          כל הקוד שעברת היום — מפתחות ב-
          <span className="font-bold" style={{ color: "#023e8a" }}>Wix, Monday.com, Fiverr ו-IDF Tech</span>
          {" "}כותבות גרסאות מתקדמות שלו כל יום. מירב התחילה בדיוק מפה — ואחרי 14 חודשים קיבלה עבודה.
        </div>
      </div>

      <Link
        href="/explore"
        className="block w-full text-center py-[14px] rounded-xl text-white font-bold text-[15px] mb-4"
        style={{ background: "#fb8500", fontFamily: "'Heebo', sans-serif" }}
      >
        המשך במסלול ←
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIM FLOW
// ─────────────────────────────────────────────────────────────────────────────

function SimFlow({ onComplete }: { onComplete: (score: number, answers: boolean[]) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const feedbackRef = React.useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];

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
    if (stepIndex < STEPS.length - 1) {
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
        {STEPS.map((_, i) => (
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
            {step.tag} · {stepIndex + 1} / {STEPS.length}
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
            {stepIndex < STEPS.length - 1 ? "הבא ←" : "סיימתי — תראי תוצאות"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SimPage() {
  const { domain } = useParams();
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  if (domain !== "code") {
    return (
      <div className="flex justify-center min-h-screen" style={{ background: "#f2ede6" }}>
        <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col items-center justify-center gap-4 px-8">
          <div className="text-[40px]">🚧</div>
          <div className="text-[16px] font-bold text-navy text-center" style={HEEBO}>הסימולציה בפיתוח</div>
          <Link href={`/explore/${domain}`} className="text-[13px] font-bold" style={{ color: "#023e8a" }}>
            ← חזרה לתחום
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen" style={{ background: "#f2ede6" }}>
      <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
        <div className="bg-navy text-white px-[22px] pt-[26px] pb-[30px] shrink-0">
          <Link href={`/explore/${domain}`} className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה לתחום
          </Link>
          <div className="text-[28px] leading-tight" style={HEEBO}>
            {done ? "סיימת!" : "סימולציה — פיתוח"}
          </div>
          <div className="text-[13px] mt-[6px]" style={{ opacity: 0.72 }}>
            {done ? "הנה מה שבנית היום" : `${STEPS.length} שלבים · מהמושג הראשון עד קוד אמיתי`}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {done ? (
            <ResultScreen score={score} answers={answers} />
          ) : (
            <SimFlow
              onComplete={(s, a) => {
                setScore(s);
                setAnswers(a);
                setDone(true);
              }}
            />
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
