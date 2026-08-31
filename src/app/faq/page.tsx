"use client";

/**
 * /faq — שאלות ותשובות (עיצוב מחדש לפי handoff קלוד-דיזיין, 27.8 — חלופה 1a).
 *
 * ארבע תשובות מבניות מקבלות ויזואליזציה בשפת הסרפנטינה הקיימת; שלוש
 * רגשיות נשארות טקסט בכוונה. שני תיקונים על ה-handoff (נתי 27.8):
 * הטקסטים מהקוד החי (נוסח הבעלות — "את/ה בוחר/ת אחרי שהתייעצת"), והפנייה
 * ממוגדרת — המשולב רק למי שטרם ענה. כל תשובה כאן נכתבה ידנית; אין מודל.
 */

import { useState, useEffect, useMemo } from "react";
import BottomNav from "@/components/ui/BottomNav";
import { logEvent, cachedCohort } from "@/lib/candidate";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";
const DASH = "#ddd6c9";

// ─── הוויזואליזציות ───────────────────────────────────────────────────────────

/** ש"1 — מפת המסע: סרפנטינה קומפקטית, 3 הפגישות כנקודות כתומות על הקו */
function FaqJourney() {
  const ROW1: [number, string][] = [[290, "פתיחת חשבון"], [170, "היכרות"], [50, "טעימות הייטק"]];
  const ROW2: [number, string][] = [[50, "בחירת מסלול"], [170, "מלגות והרשמה"], [290, "סטודנט/ית"]];
  return (
    <div className="rounded-[14px] p-3 mb-3" style={{ background: "#fbf9f5" }}>
      <svg viewBox="0 0 340 158" className="w-full" aria-hidden="true">
        <path d="M 290 38 L 50 38" fill="none" stroke={DASH} strokeWidth="2.5" strokeDasharray="5 6" />
        <path d="M 50 38 C 14 38, 14 108, 50 108" fill="none" stroke={DASH} strokeWidth="2.5" strokeDasharray="5 6" />
        <path d="M 50 108 L 290 108" fill="none" stroke={DASH} strokeWidth="2.5" strokeDasharray="5 6" />
        {/* הפגישות — אחרי היכרות, על הקשת (אחרי הטעימות), אחרי בחירת מסלול */}
        {[[110, 38], [23, 73], [110, 108]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5.5" fill={ORANGE} stroke="#fbf9f5" strokeWidth="2" />
        ))}
        {[...ROW1.map(([x, l], i) => ({ x, y: 38, n: i + 1, l })), ...ROW2.map(([x, l], i) => ({ x, y: 108, n: i + 4, l }))].map(st => (
          <g key={st.n}>
            <circle cx={st.x} cy={st.y} r="14" fill={NAVY} />
            <text x={st.x} y={st.y + 4.5} fontSize="12" fontWeight="800" fill="#fff" textAnchor="middle">{st.n}</text>
            <text x={st.x} y={st.y + 27} fontSize="10.5" fontWeight="600" fill={NAVY} textAnchor="middle">{st.l}</text>
          </g>
        ))}
      </svg>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="w-[11px] h-[11px] rounded-full shrink-0" style={{ background: ORANGE, border: "2px solid #fbf9f5" }} />
        <span className="text-[11px] font-bold" style={{ color: "#6b7280" }}>פגישה עם הרכזת</span>
      </div>
    </div>
  );
}

/** ש"2 — כרטיסיות טעימה: 2 = רף מינימלי, השאר הזמנה */
function FaqTastings() {
  return (
    <div className="rounded-[14px] p-3 mb-3" style={{ background: "#fbf9f5" }}>
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <div className="flex gap-1.5">
            {[0, 1].map(i => (
              <span key={i} className="w-10 h-12 rounded-lg flex items-center justify-center text-[16px] font-black"
                style={{ background: "#ecfdf5", border: `2px solid ${GREEN}`, color: GREEN }}>✓</span>
            ))}
          </div>
          <div className="text-[11px] font-bold mt-1.5" style={{ color: GREEN }}>הרף המינימלי</div>
        </div>
        <div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-10 h-12 rounded-lg flex items-center justify-center text-[16px] font-black"
                style={{ border: `2px dashed ${DASH}`, color: ORANGE }}>+</span>
            ))}
          </div>
          <div className="text-[11px] font-bold mt-1.5" style={{ color: "#6b7280" }}>+ כל אחת מחדדת</div>
        </div>
      </div>
    </div>
  );
}

/** ש"3 — ציר שלוש הפגישות: מה סוגרים ומה מביאים */
function FaqMeetings() {
  const M = [
    { n: 1, name: "היכרות", close: "תוכנית אישית", bring: "כלום" },
    { n: 2, name: "בחירת תחום", close: "התחום שלך", bring: "תובנות מהטעימות" },
    { n: 3, name: "בחירת מסלול", close: "מוסד ומימון", bring: "מסלולים ששמרת" },
  ];
  return (
    <div className="rounded-[14px] p-3 mb-3 relative" style={{ background: "#fbf9f5" }}>
      <div className="absolute right-6 left-6" style={{ top: 25, borderTop: `2.5px dashed ${DASH}` }} />
      <div className="flex justify-between relative">
        {M.map(m => (
          <div key={m.n} className="flex flex-col items-center text-center" style={{ width: "32%" }}>
            <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[13px] font-black text-white" style={{ background: ORANGE }}>{m.n}</span>
            <div className="text-[12px] font-bold mt-1.5" style={{ color: NAVY }}>{m.name}</div>
            <div className="text-[10.5px] leading-snug mt-1" style={{ color: "#37414f" }}>סוגרים: {m.close}</div>
            <div className="text-[10.5px] leading-snug" style={{ color: "#6b7280" }}>מביאים: {m.bring}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ש"4 — משוואת העלות: המספר היחיד הוא 0 ₪ */
function FaqEquation() {
  return (
    <div className="rounded-[14px] p-3 mb-3 flex flex-col gap-2" style={{ background: "#fbf9f5" }}>
      <div className="flex items-center gap-2 text-[13.5px] font-bold" style={{ color: "#37414f" }}>
        הליווי =
        <span className="px-3 py-1 rounded-full text-[13.5px] font-black" style={{ background: "#ecfdf5", color: GREEN }}>0 ₪</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[13.5px] font-bold" style={{ color: "#37414f" }}>
        הלימודים = תלוי מסלול −
        <span className="px-3 py-1 rounded-full text-[13.5px] font-black" style={{ background: "#fff7ed", color: "#b35e00" }}>מלגות</span>
      </div>
    </div>
  );
}

// ─── התוכן — ממוגדר ───────────────────────────────────────────────────────────

type Pick3 = (male: string, female: string, other: string) => string;
/** true = בוגר/ת טק-קריירה: חמישה שלבים, שתי פגישות, בלי טעימות */
type IsAlumni = boolean;

function buildFaq(p: Pick3, alum: IsAlumni): { q: string; a: string; viz?: React.ReactNode }[] {
  return [
    {
      q: "איך נראה כל התהליך, מההתחלה ועד הסוף?",
      viz: <FaqJourney />,
      a: alum
        ? "חמישה שלבים: פתיחת חשבון ← פגישת היכרות עם הרכזת ← בחירת מסלול לימודים ← מלגות והרשמה ← סטודנט/ית. **שלב הטעימות מדולג** — כבר עשית הכשרה טכנולוגית אצלנו, ואין צורך לגלות מה זה סייבר. שתי פגישות עם הרכזת מחלקות את הדרך. הקצב שלך — יש מי שעובר הכל בחודש ויש מי שלוקח שלושה."
        : "שישה שלבים: פתיחת חשבון ← פגישת היכרות עם הרכזת ← טעימות הייטק (מתנסים בתחומים) ← בחירת מסלול לימודים ← מלגות והרשמה ← סטודנט/ית. שלוש פגישות עם הרכזת מחלקות את הדרך, וכל שלב באפליקציה מכין אותך לפגישה הבאה. הקצב שלך — יש מי שעובר הכל בחודש ויש מי שלוקח שלושה.",
    },
    /* שאלת הטעימות אינה קיימת אצל בוגרים — שלב הטעימות אינו במסע שלהם */
    ...(alum ? [] : [
      {
        q: "כמה טעימות צריך לעשות?",
        viz: <FaqTastings />,
        a: "לפחות שתיים — כדי שיהיה לך את מה להשוות. אין מספר נכון: יש תשעה תחומים, וכל טעימה לוקחת בערך 40 דקות. מי שמסיים שתיים ומרגיש שמצא — מצוין. מי שרוצה לטעום חמש — גם מצוין. הכלי בסוף כל טעימה (שש שאלות) הוא מה שהופך את ההתנסות לתובנה בפגישה.",
      },
    ]),
    {
      q: alum ? "מה קורה בכל אחת משתי הפגישות?" : "מה קורה בכל אחת משלוש הפגישות?",
      viz: <FaqMeetings />,
      a: alum
        ? p(
            "פגישה 1 — היכרות: איפה אתה היום, מה השתנה מאז שסיימת אצלנו, ומה תואר יכול לפתוח לך. לא מביאים כלום. פגישה 2 — בחירת מסלול: אתה בוחר מוסד ותואר, ומתכננים יחד את ההרשמה והמימון.",
            "פגישה 1 — היכרות: איפה את היום, מה השתנה מאז שסיימת אצלנו, ומה תואר יכול לפתוח לך. לא מביאים כלום. פגישה 2 — בחירת מסלול: את בוחרת מוסד ותואר, ומתכננים יחד את ההרשמה והמימון.",
            "פגישה 1 — היכרות: איפה את/ה היום, מה השתנה מאז שסיימת אצלנו, ומה תואר יכול לפתוח לך. לא מביאים כלום. פגישה 2 — בחירת מסלול: את/ה בוחר/ת מוסד ותואר, ומתכננים יחד את ההרשמה והמימון.",
          )
        : p(
        "פגישה 1 — היכרות: מי אתה, מה מעניין אותך, בניית תוכנית. לא מביאים כלום. פגישה 2 — בחירת תחום: עוברים על מה שגילית בטעימות — מה אהבת, מה פחות — ובסוף אתה בוחר תחום, אחרי שהתייעצת. פגישה 3 — בחירת מסלול: אתה בוחר מוסד ומסלול, ומתכננים יחד את ההרשמה והמימון. כל פגישה סוגרת שלב ופותחת את הבא.",
        "פגישה 1 — היכרות: מי את, מה מעניין אותך, בניית תוכנית. לא מביאים כלום. פגישה 2 — בחירת תחום: עוברים על מה שגילית בטעימות — מה אהבת, מה פחות — ובסוף את בוחרת תחום, אחרי שהתייעצת. פגישה 3 — בחירת מסלול: את בוחרת מוסד ומסלול, ומתכננים יחד את ההרשמה והמימון. כל פגישה סוגרת שלב ופותחת את הבא.",
        "פגישה 1 — היכרות: מי את/ה, מה מעניין אותך, בניית תוכנית. לא מביאים כלום. פגישה 2 — בחירת תחום: עוברים על מה שגילית בטעימות — מה אהבת, מה פחות — ובסוף את/ה בוחר/ת תחום, אחרי שהתייעצת. פגישה 3 — בחירת מסלול: את/ה בוחר/ת מוסד ומסלול, ומתכננים יחד את ההרשמה והמימון. כל פגישה סוגרת שלב ופותחת את הבא.",
      ),
    },
    {
      q: "זה עולה כסף?",
      viz: <FaqEquation />,
      a: p(
        "הליווי של התוכנית — לא. הלימודים עצמם תלויים במסלול שתבחר, ובדיוק בשביל זה יש את שלב המלגות: רוב המשתתפים לא משלמים את המחיר המלא, וחלק מהמסלולים כמעט חינמיים. את המספרים המדויקים תראה בשלב 5, מותאמים למסלול שלך.",
        "הליווי של התוכנית — לא. הלימודים עצמם תלויים במסלול שתבחרי, ובדיוק בשביל זה יש את שלב המלגות: רוב המשתתפים לא משלמים את המחיר המלא, וחלק מהמסלולים כמעט חינמיים. את המספרים המדויקים תראי בשלב 5, מותאמים למסלול שלך.",
        "הליווי של התוכנית — לא. הלימודים עצמם תלויים במסלול שתבחר/י, ובדיוק בשביל זה יש את שלב המלגות: רוב המשתתפים לא משלמים את המחיר המלא, וחלק מהמסלולים כמעט חינמיים. את המספרים המדויקים תראה/י בשלב 5, מותאמים למסלול שלך.",
      ),
    },
    {
      q: "פספסתי פגישה / נעלמתי לכמה שבועות. מה עכשיו?",
      a: p(
        "כלום לא נסגר. קובעים מועד חדש ביומן וממשיכים בדיוק מאיפה שעצרת — האפליקציה זוכרת הכל. זה קורה להרבה אנשים, והרכזת מעדיפה שתחזור באיחור מאשר שלא תחזור בכלל.",
        "כלום לא נסגר. קובעים מועד חדש ביומן וממשיכים בדיוק מאיפה שעצרת — האפליקציה זוכרת הכל. זה קורה להרבה אנשים, והרכזת מעדיפה שתחזרי באיחור מאשר שלא תחזרי בכלל.",
        "כלום לא נסגר. קובעים מועד חדש ביומן וממשיכים בדיוק מאיפה שעצרת — האפליקציה זוכרת הכל. זה קורה להרבה אנשים, והרכזת מעדיפה שתחזור/י באיחור מאשר שלא תחזור/י בכלל.",
      ),
    },
    {
      q: p(
        "אני לא בטוח שאני מתאים להייטק. שווה בכלל להתחיל?",
        "אני לא בטוחה שאני מתאימה להייטק. שווה בכלל להתחיל?",
        "אני לא בטוח/ה שאני מתאים/ה להייטק. שווה בכלל להתחיל?",
      ),
      a: "בדיוק בשביל הספק הזה התהליך קיים. לא צריך רקע, לא צריך להיות גאון במתמטיקה, ובערך חצי מעובדי ההייטק בכלל לא כותבים קוד. הטעימות נותנות לך לנסות באמת לפני שמחליטים — ואי אפשר להיכשל בהן.",
    },
    {
      q: "שאלה על מלגה / מוסד / כסף — למי פונים?",
      a: "לרכזת, וזו לא התחמקות: הזכאויות משתנות לפי השירות שלך, היישוב, המסלול והשנה — ותשובה כללית עלולה להטעות. הרכזת רואה את התמונה שלך ותיתן תשובה מדויקת. אפשר לשלוח לה הודעה מכל מסך דרך 'קשר'.",
    },
  ];
}

// ─── המסך ─────────────────────────────────────────────────────────────────────

export default function FaqPage() {
  /* שאלה ראשונה פתוחה כברירת מחדל — הסרפנטינה היא כרטיס הביקור של המסך */
  const [open, setOpen] = useState<number | null>(0);
  const [gender, setGender] = useState<string | null>(null);
  /* בוגרי טק-קריירה: חמישה שלבים ושתי פגישות — התשובות משתנות בהתאם */
  const [alum, setAlum] = useState(false);
  useEffect(() => {
    try {
      setGender(localStorage.getItem("user-gender"));
      setAlum(cachedCohort() === "alumni");
    } catch { /* ignore */ }
  }, []);

  const faq = useMemo(() => buildFaq(
    (m, f, o) => (gender === "male" ? m : gender === "female" ? f : o), alum
  ), [gender, alum]);

  return (
    <div dir="rtl" className="min-h-screen pb-28" style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}>
      <div className="px-5 pt-10 pb-5" style={{ background: NAVY, color: "#fff" }}>
        <h1 className="text-[24px] font-black">שאלות ותשובות</h1>
        <div className="text-[13.5px] mt-1" style={{ opacity: 0.75 }}>כל מה ששואלים אותנו — במקום אחד</div>
      </div>
      <div className="max-w-[560px] mx-auto px-5 pt-5 flex flex-col gap-3">
        {faq.map((f, i) => {
          const on = open === i;
          return (
            <div key={i} className="rounded-[18px] overflow-hidden" style={{ background: "#fff", border: `1px solid ${on ? ORANGE : "#ede8db"}` }}>
              <button
                aria-expanded={on}
                onClick={() => {
                  setOpen(on ? null : i);
                  if (!on) logEvent("faq_open", { q: f.q });
                }}
                className="w-full flex items-center justify-between gap-3 text-right px-4"
                style={{ minHeight: 52 }}
              >
                <span className="text-[15px] font-semibold py-3" style={{ color: NAVY }}>{f.q}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 transition-transform duration-200"
                  style={{ transform: on ? "rotate(180deg)" : "none" }}>
                  <path d="M6 9l6 6 6-6" stroke={ORANGE} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {on && (
                <div className="px-4 pb-4">
                  {f.viz}
                  <div className="text-[13.5px] leading-[1.8]" style={{ color: "#37414f" }}>{f.a}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
