"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import JourneyStrip from "@/components/ui/JourneyStrip";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const ORANGE = "#fb8500";
const NAVY = "#023e8a";

const DOMAINS = [
  { id: "code",      badge: "פ",  label: "פיתוח תוכנה",      desc: "בונים אפליקציות, אתרים ומערכות",         color: "#3b82f6", img: "/domains/domain-code.jpeg" },
  { id: "data",      badge: "ד",  label: "דאטה ואנליטיקס",   desc: "מוצאים תובנות בתוך ים של מידע",           color: "#0d9488", img: "/domains/domain-data.jpeg" },
  { id: "networks",  badge: "ר",  label: "רשתות ותקשורת",    desc: "בונים את התשתית שמחזיקה את האינטרנט",     color: "#2563eb", img: "/domains/domain-networks.jpeg" },
  { id: "hardware",  badge: "ח",  label: "חומרה ואלקטרוניקה", desc: "בונים את השבבים והמכשירים עצמם — כולל מכטרוניקה", color: "#7c2d12", img: "/domains/domain-code.jpeg" },
  { id: "cyber",     badge: "ס",  label: "סייבר",             desc: "מגנים על מידע ומערכות מפני תקיפות",       color: "#dc2626", img: "/domains/domain-cyber.jpeg" },
  { id: "ai",        badge: "AI", label: "AI ובינה מלאכותית", desc: "מלמדים מחשבים לחשוב ולהחליט",             color: "#7c3aed", img: "/domains/domain-ai.jpeg" },
  { id: "ux",        badge: "UX", label: "עיצוב UX/UI",       desc: "יוצרים חוויות שמרגישות נכון",             color: "#db2777", img: "/domains/domain-ux.jpeg" },
  { id: "marketing", badge: "ש",  label: "שיווק דיגיטלי",    desc: "מחברים מוצרים לאנשים הנכונים",            color: "#f97316", img: "/domains/domain-marketing.jpeg" },
  { id: "qa",        badge: "QA", label: "בדיקות תוכנה",     desc: "תופסים באגים לפני שהלקוחות מוצאים אותם", color: "#d97706", img: "/domains/domain-qa.jpeg" },
];

function MeetingCard({ doneCount }: { doneCount: number }) {
  const unlocked = doneCount >= 2;

  const copyByState = [
    "שיחה בלי טעימות = 20 דקות של 'לא יודע מה אני רוצה'. שיחה אחרי 2 טעימות = שיחה שמגיעה לאיפשהו.",
    "כמעט שם — עוד טעימה אחת ואפשר לדבר ברצינות.",
    "אפשר לקבוע — וכל טעימה נוספת תחדד את הבחירה בפגישה.",
  ];
  const copy = doneCount === 0 ? copyByState[0] : doneCount === 1 ? copyByState[1] : copyByState[2];

  return (
    <div
      className="mb-4 rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: unlocked ? "rgba(251,133,0,0.06)" : "#fff",
        border: unlocked ? "1.5px solid rgba(251,133,0,0.4)" : "1px solid rgba(0,0,0,0.08)",
        boxShadow: unlocked ? "0 2px 16px rgba(251,133,0,0.12)" : "0 1px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Card body */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span className="text-[18px]">{unlocked ? "🎯" : "🔒"}</span>
            <div className="text-[14px]" style={{ ...HEEBO, color: unlocked ? "#92400e" : "rgba(0,0,0,0.55)" }}>
              שיחה עם הרכזת
            </div>
          </div>
          {/*
            ריבוע לכל תחום עם טעימה אמיתית (4 היום) — לא רק למינימום.
            שני ריבועים אמרו "המשימה היא 2" והסלילו לעצור שם; קו הסף אחרי
            השניים הראשונים אומר את שתי האמיתות: 2 פותחות, השאר מחדדות.
          */}
          <div className="flex items-center gap-1.5">
            {[0, 1].map((i) => {
              const filled = doneCount > i;
              return (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black transition-all duration-300"
                  style={{
                    background: filled ? ORANGE : "rgba(0,0,0,0.07)",
                    color: "white",
                  }}
                >
                  {filled ? "✓" : ""}
                </div>
              );
            })}
            <div className="w-px h-6 mx-1" style={{ background: "rgba(0,0,0,0.18)" }} />
            {[2, 3].map((i) => {
              const filled = doneCount > i;
              return (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black transition-all duration-300"
                  style={{
                    background: filled ? ORANGE : "rgba(0,0,0,0.055)",
                    color: "white",
                    border: filled ? "none" : "1px dashed rgba(0,0,0,0.12)",
                  }}
                >
                  {filled ? "✓" : ""}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[10.5px] mb-1 text-left" style={{ color: "rgba(0,0,0,0.35)" }}>
          שתי טעימות פותחות את הפגישה · השאר מחדדות
        </div>

        <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.45)" }}>
          {copy}
        </div>
      </div>

      {/* Button */}
      {unlocked ? (
        <Link
          href="/explore/results"
          className="block w-full py-3.5 text-center font-black text-[14px] text-white transition-all active:scale-[0.98]"
          style={{ background: ORANGE, ...HEEBO }}
        >
          הכנה לפגישה עם הרכזת ←
        </Link>
      ) : (
        <div
          className="py-3.5 text-center text-[12.5px] font-bold"
          style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.22)" }}
        >
          נפתח אחרי {Math.max(0, 2 - doneCount)} טעימות נוספות
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const done = DOMAINS
      .filter(d => {
        try { return JSON.parse(localStorage.getItem(`${d.id}-journey`) || "{}").experience === true; }
        catch { return false; }
      })
      .map(d => d.id);
    setCompleted(done);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0">
        <div className="max-w-[900px] mx-auto">
          <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה למסע
          </Link>
          <div className="text-[30px] md:text-[36px] leading-tight" style={HEEBO}>טעימות הייטק</div>
          <div className="text-[13.5px] mt-[6px]" style={{ opacity: 0.72 }}>
            בחר/י מה מסקרן — נסה/י טעימה קצרה, תגלה/י מה מדבר אליך
          </div>
        </div>
      </div>

      <JourneyStrip current={3} phaseLabel="טעימות הייטק" />

      <div className="max-w-[900px] mx-auto w-full px-[22px] md:px-12">

        {/* How it works */}
        <div
          className="mt-5 mb-4 rounded-xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: "rgba(2,62,138,0.05)" }}
        >
          <img src="/domains/ice-cream.jpeg" alt="" className="w-20 h-28 object-cover rounded-xl shrink-0" />
          <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.55)" }}>
            <span className="font-bold" style={{ color: "rgba(0,0,0,0.7)" }}>בגלידריה חדשה — טועמים לפני שמזמינים.</span>{" "}
            קריירה? אותו דבר. כל כרטיס = טעימה קצרה מהתחום האמיתי (~15–20 דקות).
            אין סדר נכון ואין בוחן בסוף 😄
          </div>
        </div>

        {/* Meeting card — always visible, locks/unlocks at 2 */}
        <MeetingCard doneCount={completed.length} />

      </div>

      {/* Domain cards */}
      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-12 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {DOMAINS.map((domain) => {
            const isDone = completed.includes(domain.id);
            return (
              <Link key={domain.id} href={`/explore/${domain.id}`} className="block h-full">
                <div
                  className="rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: isDone ? `${domain.color}10` : "#fff",
                    border: isDone ? `1.5px solid ${domain.color}55` : "1px solid rgba(2,62,138,0.06)",
                    boxShadow: isDone ? "none" : "0 2px 14px rgba(2,62,138,0.07)",
                  }}
                >
                  {/* Image */}
                  <div className="relative w-full" style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                    <img
                      src={domain.img}
                      alt={domain.label}
                      className="w-full h-full object-cover"
                    />
                    {isDone && (
                      <div
                        className="absolute top-2 left-2 w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[11px] font-black"
                        style={{ background: domain.color }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                  {/* Text */}
                  <div className="p-3 flex flex-col gap-[6px] flex-1">
                    <div className="text-[14px] text-navy leading-tight" style={HEEBO}>{domain.label}</div>
                    <div className="text-[11px] leading-[1.5] flex-1" style={{ color: "rgba(0,0,0,0.45)" }}>{domain.desc}</div>
                    <div
                      className="text-[11px] font-bold"
                      style={{ color: isDone ? domain.color : "rgba(0,0,0,0.22)" }}
                    >
                      {isDone ? "✓ עשית — כניסה חוזרת" : "לטעימה →"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
