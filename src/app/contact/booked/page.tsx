"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

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

const WHAT_HAPPENS = [
  { emoji: "🎯", text: "הרכזת תקרא את הסיכום שהכנת מראש — הפגישה מתחילה כבר ממקום מעמיק" },
  { emoji: "🔍", text: "ביחד תבחנו את התחומים שהכי דיברו אליך — מה מאחורי האינטרס, מה הספקות" },
  { emoji: "🗺️", text: "בסוף תצא עם כיוון ברור לשלב הבא — לא 'לחשוב על זה', אלא צעד קונקרטי" },
];

export default function BookedPage() {
  const [doneDomains, setDoneDomains] = useState<{ label: string; color: string }[]>([]);

  useEffect(() => {
    const done = DOMAINS.filter(d => {
      try {
        return JSON.parse(localStorage.getItem(`${d.id}-journey`) || "{}").experience === true;
      } catch { return false; }
    });
    setDoneDomains(done);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="text-white px-[22px] pt-[26px] pb-[30px] shrink-0" style={{ background: NAVY }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה למסע
          </Link>
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

        {/* What to bring */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)", boxShadow: "0 2px 12px rgba(2,62,138,0.06)" }}
        >
          <div className="text-[13px] font-black mb-4" style={{ ...HEEBO, color: NAVY }}>
            מה להביא לפגישה
          </div>

          <div className="flex flex-col gap-3">
            {/* The summary they prepared */}
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                style={{ background: ORANGE }}
              >1</div>
              <div>
                <div className="text-[12.5px] font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
                  הסיכום שהכנת
                </div>
                <div className="text-[11.5px] mt-0.5 leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
                  הסיכום כבר שמור אצלך — תפתח/י אותו לפני הפגישה בתור תזכורת
                </div>
                <Link
                  href="/explore/results"
                  className="inline-block mt-1.5 text-[11px] font-bold px-3 py-1 rounded-lg"
                  style={{ background: "rgba(251,133,0,0.1)", color: ORANGE }}
                >
                  לסיכום הטעימות ←
                </Link>
              </div>
            </div>

            {/* Domains done */}
            {doneDomains.length > 0 && (
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

            {/* Open mind */}
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                style={{ background: ORANGE }}
              >{doneDomains.length > 0 ? 3 : 2}</div>
              <div>
                <div className="text-[12.5px] font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
                  ראש פתוח ושאלות
                </div>
                <div className="text-[11.5px] mt-0.5 leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
                  אין תשובות נכונות ולא צפויות. כל שאלה — כולל "אני לא יודע/ת" — היא נקודת התחלה טובה
                </div>
              </div>
            </div>
          </div>
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
            {WHAT_HAPPENS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[18px] shrink-0">{item.emoji}</span>
                <span className="text-[12.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Keep moving — stage 4 */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.25)" }}
        >
          <div className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: ORANGE }}>
            השלב הבא · שלב 4
          </div>
          <div className="text-[16px] leading-tight mb-2" style={{ ...HEEBO, color: "#92400e" }}>
            לא חייבים לחכות לפגישה
          </div>
          <div className="text-[12.5px] leading-[1.75] mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
            אפשר להתחיל כבר עכשיו לבדוק איזה מסלול לימודים מתאים לך — אקדמיה, מה״ט או הכשרה
            טכנולוגית. תגיע/י לפגישה עם רשימת מוסדות ושאלות מוכנות, וזה יחסוך זמן יקר.
          </div>
          <Link
            href="/paths"
            className="block w-full py-4 text-center font-black text-[15px] text-white rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: ORANGE, ...HEEBO }}
          >
            לחקר מסלולי לימוד ←
          </Link>
        </div>

        {/* CTAs */}
        <Link
          href="/dashboard"
          className="block w-full py-3.5 text-center font-bold text-[13.5px] rounded-2xl mb-3 active:scale-[0.98] transition-transform"
          style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}
        >
          חזרה למסע
        </Link>

        <Link
          href="/explore"
          className="block w-full py-3.5 text-center font-bold text-[13.5px] rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}
        >
          לחקור עוד תחומים
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
