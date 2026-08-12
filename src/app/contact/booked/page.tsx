"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MEETING_META, type MeetingNum } from "@/data/meetings";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

const DOMAINS = [
  { id: "data",      label: "דאטה ואנליטיקס",   color: "#0d9488" },
  { id: "cyber",     label: "סייבר",              color: "#dc2626" },
  { id: "networks",  label: "רשתות ותקשורת",     color: "#2563eb" },
  { id: "code",      label: "פיתוח תוכנה",       color: "#3b82f6" },
  { id: "ai",        label: "AI ובינה מלאכותית",  color: "#7c3aed" },
  { id: "ux",        label: "עיצוב UX/UI",        color: "#db2777" },
  { id: "marketing", label: "שיווק דיגיטלי",     color: "#f97316" },
];

/** מה יקרה בפגישה — שונה לכל אחת מהשלוש */
const WHAT_HAPPENS: Record<MeetingNum, { emoji: string; text: string }[]> = {
  1: [
    { emoji: "☕", text: "נכיר. הרכז/ת ישאל/תשאל מאיפה את/ה מגיע/ה ומה מביא אותך לכאן" },
    { emoji: "🗺️", text: "נבנה יחד תוכנית עבודה — מה הצעדים, ובאיזה קצב" },
    { emoji: "🔍", text: "בסוף ייפתח לך חקר תחומי ההייטק, ותוכל/י להתחיל לטעום" },
  ],
  2: [
    { emoji: "🎯", text: "הרכז/ת יקרא/תקרא את הסיכום שהכנת — הפגישה מתחילה כבר ממקום מעמיק" },
    { emoji: "🔍", text: "ביחד תבחנו את התחומים שהכי דיברו אליך — מה מאחורי האינטרס, מה הספקות" },
    { emoji: "🗺️", text: "בסוף תצא/י עם תחום נבחר, וייפתח לך חקר מסלולי הלימוד" },
  ],
  3: [
    { emoji: "🎓", text: "תעברו יחד על המוסדות שברשימה ועל השאלות שהכנת" },
    { emoji: "✅", text: "תינעל החלטה — איזה מסלול ובאיזה מוסד" },
    { emoji: "📋", text: "בסוף ייפתח לך השלב שמסדר את ההרשמה, המלגות והלוגיסטיקה" },
  ],
};

/** לאן ממשיכים אחרי כל פגישה */
const NEXT: Record<MeetingNum, { stage: string; title: string; body: string; href: string; cta: string }> = {
  /*
   * הכפתור הזה הוא **מה שנפתח בזכות הקביעה** — ולכן הוא הפעולה הראשית בכל
   * אחד משלושת המסכים. עד הקביעה הוא נעול; אחריה הוא הדרך קדימה.
   *
   * לפגישה 1 הוא מוביל למרחב ההמתנה ולא ל-/explore: שם יש **טעימה אחת**,
   * וזו המשמעת שמונעת ממנו להגיע לפגישה מעוגן בתחום שבחר לבד.
   */
  1: {
    stage: "נפתח עכשיו",
    title: "מרחב ההמתנה נפתח",
    body: "שתי דקות שנותנות תחושה איך חושבים בהייטק — לא תחום ולא בחירה. אין ציון ואי אפשר להיכשל. וגם מה בדיוק מחכה לך בפגישה.",
    href: "/waiting",
    cta: "למרחב ההמתנה ←",
  },
  2: {
    stage: "נפתח עכשיו",
    title: "חקר מסלולי הלימוד נפתח",
    body: "אפשר להתחיל כבר עכשיו לבדוק איזה מסלול לימודים מתאים לך — תואר, מה״ט או הכשרה טכנולוגית. תגיע/י לפגישה עם רשימת מוסדות ושאלות מוכנות, וזה יחסוך זמן יקר.",
    href: "/paths",
    cta: "לחקר מסלולי לימוד ←",
  },
  3: {
    stage: "נפתח עכשיו",
    title: "המלגות וההרשמה נפתחו",
    body: "למלגות יש תאריכים אחרונים, וחלקם קרובים. שווה לראות כבר עכשיו מה נסגר מתי, וכמה זה באמת עולה אחרי המלגות.",
    href: "/plan",
    cta: "לתוכנית שלי ←",
  },
};

export default function BookedPage() {
  const [doneDomains, setDoneDomains] = useState<{ label: string; color: string }[]>([]);
  const [m, setM] = useState<MeetingNum>(2);

  useEffect(() => {
    /*
     * בלי `?m=` הדף היה מציג תמיד את גרסת פגישה 2 — כולל למי שהגיע לכאן
     * אחרי פגישה 1 או 3, למשל מהפניה של Cal.com עצמו או מסימנייה.
     * כשאין פרמטר נגזרים מהדגלים: הפגישה **הגבוהה ביותר שנקבעה** היא זו
     * שהרגע נקבעה, ולכן היא הרלוונטית.
     */
    const param = new URLSearchParams(window.location.search).get("m");
    if (param && ["1", "2", "3"].includes(param)) {
      setM(Number(param) as MeetingNum);
    } else {
      const booked = ([3, 2, 1] as MeetingNum[])
        .find(n => localStorage.getItem(`meeting-${n}-booked`) === "true");
      setM(booked ?? 1);
    }

    const done = DOMAINS.filter(d => {
      try {
        return JSON.parse(localStorage.getItem(`${d.id}-journey`) || "{}").experience === true;
      } catch { return false; }
    });
    setDoneDomains(done);
  }, []);

  const meta = MEETING_META[m];
  const next = NEXT[m];
  const showSummary = m > 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="text-white px-[22px] pt-[26px] pb-[30px] shrink-0" style={{ background: NAVY }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה למסע
          </Link>
          <div className="text-[12px] font-bold mb-1.5" style={{ color: ORANGE }}>
            פגישה {m} מתוך 3 · {meta.title}
          </div>
          <div className="text-[28px] leading-tight" style={HEEBO}>הפגישה נקבעה 🎉</div>
          <div className="text-[13px] mt-[6px]" style={{ opacity: 0.72 }}>
            פרטים הגיעו למייל — נתראה בקרוב
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-7 pb-32">

        {/* Big success visual */}
        <div
          className="rounded-2xl px-6 py-8 mb-5 text-center"
          style={{ background: "rgba(251,133,0,0.06)", border: "1.5px solid rgba(251,133,0,0.25)" }}
        >
          <div className="text-[56px] mb-3">✅</div>
          <div className="text-[18px] mb-1" style={{ ...HEEBO, color: "#92400e" }}>
            הצעד הכי חשוב — נעשה.
          </div>
          <div className="text-[13px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.5)" }}>
            רוב האנשים חושבים על זה לאורך זמן.<br />
            את/ה קבעת פגישה. זה משהו.
          </div>
        </div>

        {/* מה להביא. בפגישה 1 אין מה להביא, וזה נאמר במפורש — היא בניית אמון,
            לא בירוקרטיה, ורשימת הכנות תהפוך אותה למבחן */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)", boxShadow: "0 2px 12px rgba(2,62,138,0.06)" }}
        >
          <div className="text-[13px] font-black mb-4" style={{ ...HEEBO, color: NAVY }}>
            מה להביא לפגישה
          </div>

          {!showSummary ? (
            <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.6)" }}>
              {meta.bring}
              <br />
              <br />
              אין תשובות נכונות ואין מה להוכיח. אם יש לך שאלות — תביא/י אותן.
              גם &quot;אני לא יודע/ת מאיפה מתחילים&quot; היא נקודת התחלה מצוינת.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                  style={{ background: ORANGE }}
                >1</div>
                <div>
                  <div className="text-[12.5px] font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
                    {m === 3 ? "רשימת המוסדות והשאלות" : "הסיכום שהכנת"}
                  </div>
                  <div className="text-[11.5px] mt-0.5 leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
                    כבר שמור אצלך — תפתח/י אותו לפני הפגישה בתור תזכורת
                  </div>
                  <Link
                    href={m === 3 ? "/paths?demo=0&phase=done" : "/explore/results"}
                    className="inline-block mt-1.5 text-[11px] font-bold px-3 py-1 rounded-lg"
                    style={{ background: "rgba(251,133,0,0.1)", color: ORANGE }}
                  >
                    {m === 3 ? "לסיכום מסלולי הלימוד ←" : "לסיכום הטעימות ←"}
                  </Link>
                </div>
              </div>

              {m === 2 && doneDomains.length > 0 && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                    style={{ background: ORANGE }}
                  >2</div>
                  <div>
                    <div className="text-[12.5px] font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
                      התחומים שניסית
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {doneDomains.map(d => (
                        <span
                          key={d.label}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ background: d.color }}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                  style={{ background: ORANGE }}
                >{m === 2 && doneDomains.length > 0 ? 3 : 2}</div>
                <div>
                  <div className="text-[12.5px] font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
                    ראש פתוח ושאלות
                  </div>
                  <div className="text-[11.5px] mt-0.5 leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
                    אין תשובות נכונות ולא צפויות. כל שאלה — כולל &quot;אני לא יודע/ת&quot; — היא נקודת התחלה טובה
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* What will happen in the meeting */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}
        >
          <div className="text-[13px] font-black mb-3" style={{ ...HEEBO, color: NAVY }}>
            מה יקרה בפגישה
          </div>
          <div className="flex flex-col gap-3">
            {WHAT_HAPPENS[m].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[18px] shrink-0">{item.emoji}</span>
                <span className="text-[12.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Keep moving */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.25)" }}
        >
          <div className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: ORANGE }}>
            {next.stage}
          </div>
          <div className="text-[16px] leading-tight mb-2" style={{ ...HEEBO, color: "#92400e" }}>
            {next.title}
          </div>
          <div className="text-[12.5px] leading-[1.75] mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
            {next.body}
          </div>
          <Link
            href={next.href}
            className="block w-full py-4 text-center font-black text-[15px] text-white rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: ORANGE, ...HEEBO }}
          >
            {next.cta}
          </Link>
        </div>

        <Link
          href="/dashboard"
          className="block w-full py-3.5 text-center font-bold text-[13.5px] rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}
        >
          חזרה למסע
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
