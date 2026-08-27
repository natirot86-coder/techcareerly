"use client";

/**
 * צ'ק-אין אחרי פגישה — הרחבה של דפוס פגישה 1 לפגישות 2 ו-3 (נתי 27.8).
 *
 * העיקרון מ-12.8 נשאר: **לא** "האם הגעת" (נקרא כמו מבחן ואפשר לשקר) אלא
 * "איך היה" — שאלה טבעית אחרי פגישה. מופיע שעה אחרי המועד השמור מ-Cal,
 * ונעלם אחרי תשובה. "לא הצלחתי להגיע" = הסיגנל החזק ביותר ל-At Risk,
 * עם דרך חזרה מיידית (קביעה מחדש) — לא נזיפה.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { track as trackEvent } from "@vercel/analytics";
import { logEvent } from "@/lib/candidate";

const GREEN = "#059669";
const ORANGE = "#fb8500";

export default function MeetingCheckin({ n, title }: { n: 2 | 3; title: string }) {
  const [show, setShow] = useState(false);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(`meeting-${n}-attended`)) return;
      const at = localStorage.getItem(`meeting-${n}-at`);
      if (at && Date.now() > new Date(at).getTime() + 60 * 60 * 1000) setShow(true);
    } catch { /* ignore */ }
  }, [n]);

  function answer(result: "yes" | "missed") {
    try { localStorage.setItem(`meeting-${n}-attended`, result); } catch { /* ignore */ }
    trackEvent(`meeting${n}_checkin`, { result });
    logEvent(`meeting${n}_checkin`, { result });
    if (result === "missed") {
      try { localStorage.setItem("at-risk", `missed-meeting-${n}`); } catch { /* ignore */ }
      setMissed(true);
      return;
    }
    setShow(false);
  }

  if (!show) return null;

  if (missed) {
    return (
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff3e2" }}>
        <div className="text-[15px] font-black" style={{ color: "#7a4100" }}>לא נורא. זה קורה להרבה אנשים.</div>
        <p className="text-[13.5px] leading-[1.65] mt-1" style={{ color: "#7a4100" }}>
          אפשר לקבוע מועד חדש עכשיו — וזה לא משנה כלום בהמשך הדרך.
        </p>
        <Link href={`/contact?m=${n}`} className="block text-center mt-3 py-3 rounded-xl text-[14px] font-black text-white" style={{ background: ORANGE }}>
          לקבוע מועד חדש
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 mb-4 text-white" style={{ background: "#023e8a" }}>
      <div className="text-[16px] font-black">איך הייתה {title}?</div>
      <p className="text-[13.5px] leading-[1.6] mt-1" style={{ opacity: 0.88 }}>
        לפי היומן הפגישה כבר עברה — שתי שניות ונמשיך.
      </p>
      <div className="flex gap-2.5 mt-3">
        <button onClick={() => answer("yes")} className="flex-1 py-2.5 rounded-xl text-[14px] font-black text-white" style={{ background: GREEN }}>
          היה טוב
        </button>
        <button onClick={() => answer("missed")} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold text-white" style={{ background: "rgba(255,255,255,0.14)" }}>
          לא הצלחתי להגיע
        </button>
      </div>
    </div>
  );
}

/**
 * צ'ק-אין הסטודנט/ית — שלב 6 ראשוני (נתי 27.8): כחודש אחרי העלאת האישור,
 * שאלה אחת. "קשה לי" = הסיגנל הכי חשוב בשלב הזה — נשירה שקטה של החודש
 * הראשון, והרכזת היחידה שיכולה לתפוס אותה.
 */
export function StudentCheckin() {
  const [show, setShow] = useState(false);
  const [answered, setAnswered] = useState<"ok" | "hard" | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("student-checkin")) return;
      const at = localStorage.getItem("enrollment-doc-at");
      if (at && Date.now() > new Date(at).getTime() + 25 * 24 * 3600 * 1000) setShow(true);
    } catch { /* ignore */ }
  }, []);

  function answer(result: "ok" | "hard") {
    try { localStorage.setItem("student-checkin", result); } catch { /* ignore */ }
    trackEvent("student_checkin", { result });
    logEvent("student_checkin", { result });
    if (result === "hard") {
      try { localStorage.setItem("at-risk", "student-struggling"); } catch { /* ignore */ }
    }
    setAnswered(result);
  }

  if (!show) return null;

  if (answered === "hard") {
    return (
      <div className="rounded-2xl p-4 mt-4 text-right" style={{ background: "#fff3e2" }}>
        <div className="text-[15px] font-black" style={{ color: "#7a4100" }}>זה בדיוק הזמן לדבר עם הרכזת.</div>
        <p className="text-[13.5px] leading-[1.65] mt-1" style={{ color: "#7a4100" }}>
          החודשים הראשונים הם החלק הקשה באמת — ורוב מי שמחזיק בהם מחזיק עד הסוף.
          הרכזת ליוותה עשרות סטודנטים דרך זה. היא כבר יודעת שכדאי לה להתקשר.
        </p>
        <Link href="/contact" className="block text-center mt-3 py-3 rounded-xl text-[14px] font-black text-white" style={{ background: ORANGE }}>
          לדבר איתה עכשיו
        </Link>
      </div>
    );
  }
  if (answered === "ok") {
    return (
      <div className="rounded-2xl p-4 mt-4 text-right" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
        <div className="text-[15px] font-black">💪 מעולה. תמשיך/י ככה.</div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl p-4 mt-4 text-right" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
      <div className="text-[16px] font-black">עבר בערך חודש — איך הלימודים?</div>
      <div className="flex gap-2.5 mt-3">
        <button onClick={() => answer("ok")} className="flex-1 py-2.5 rounded-xl text-[14px] font-black" style={{ background: GREEN, color: "#fff" }}>
          מסתדר/ת 💪
        </button>
        <button onClick={() => answer("hard")} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          קשה לי
        </button>
      </div>
    </div>
  );
}
