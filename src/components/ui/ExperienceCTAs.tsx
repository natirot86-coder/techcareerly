"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY  = "#023e8a";
const ORANGE = "#fb8500";

const ALL_DOMAINS = ["code","data","networks","cyber","hardware","ai","ux","marketing","qa"];

function countCompleted(): number {
  return ALL_DOMAINS.filter(id => {
    try {
      return JSON.parse(localStorage.getItem(`${id}-journey`) || "{}").experience === true;
    } catch { return false; }
  }).length;
}

export function ExperienceCTAs({ domainId, domainLabel }: { domainId: string; domainLabel: string }) {
  const [completed, setCompleted] = useState(0);

  useEffect(() => { setCompleted(countCompleted()); }, []);

  if (completed >= 2) {
    return (
      <>
        <div className="rounded-2xl px-4 py-3.5 mb-4 flex items-start gap-3"
          style={{ background: `${ORANGE}10`, border: `1.5px solid ${ORANGE}30` }}>
          <span className="text-[18px] shrink-0 mt-0.5">🎯</span>
          <div className="text-[12.5px] leading-[1.6]" style={{ color: "#92400e" }}>
            <span className="font-bold">ניסית {completed} תחומים — מספיק לשיחה עם הרכזת.</span>{" "}
            הכיני סיכום ובואי עם שאלות.
          </div>
        </div>
        <Link href="/explore/results"
          className="block w-full py-4 rounded-xl text-center font-black text-[15px] text-white mb-3 transition-all active:scale-[0.98]"
          style={{ background: ORANGE, ...HEEBO }}>
          הכנה לפגישה עם הרכזת ←
        </Link>
        <Link href="/explore"
          className="block w-full py-3.5 rounded-xl text-center font-bold text-[14px] mb-4"
          style={{ border: "1.5px solid rgba(2,62,138,0.2)", color: NAVY }}>
          לחקר תחום נוסף
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/explore"
        className="block w-full py-4 rounded-xl text-center font-black text-[15px] text-white mb-3 transition-all active:scale-[0.98]"
        style={{ background: NAVY, ...HEEBO }}>
        לחקר תחומי הייטק נוספים ←
      </Link>
      <Link href={`/explore/${domainId}`}
        className="block w-full py-3.5 rounded-xl text-center font-bold text-[14px] mb-4"
        style={{ border: "1.5px solid rgba(2,62,138,0.2)", color: NAVY }}>
        חזרה לטעימת {domainLabel}
      </Link>
    </>
  );
}
