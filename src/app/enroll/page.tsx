"use client";

/**
 * /enroll — קו הסיום של המסע (נתי 25.8).
 *
 * למה מסך ייעודי ולא כרטיס בארון המסמכים: אישור הלימודים הוא לא "עוד
 * מסמך" — הוא האסמכתא שמשרד העבודה דורש והרגע שהופך מועמד לסטודנט.
 * קבור בארון הוא נקרא כרשות; כאן הוא טקס סיום. ההעלאה מקדמת לשלב 6.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { StudentCheckin } from "@/components/ui/MeetingCheckin";
import { uploadEnrollmentDoc, enrollmentDocUrl, logEvent } from "@/lib/candidate";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";

export default function EnrollPage() {
  const [state, setState] = useState<"none" | "uploading" | "done" | "error">("none");
  const [justDone, setJustDone] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem("enrollment-doc-path")) setState("done"); } catch { /* ignore */ }
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("uploading");
    const path = await uploadEnrollmentDoc(file);
    if (path) {
      setState("done");
      setJustDone(true);
      // חותמת ההעלאה — ממנה נגזר צ'ק-אין "איך החודש הראשון" (נתי 27.8)
      try { localStorage.setItem("enrollment-doc-at", new Date().toISOString()); } catch { /* ignore */ }
      logEvent("student_stage", {});
    } else setState("error");
  }

  async function view() {
    const url = await enrollmentDocUrl();
    if (url) window.open(url, "_blank");
  }

  const done = state === "done";

  return (
    <div dir="rtl" className="min-h-screen pb-28" style={{ background: done ? NAVY : "#fbf9f5", fontFamily: "'Heebo', sans-serif", transition: "background .6s" }}>
      {done ? (
        /* ── הרגע שבשבילו כל המסע ── */
        <div className="max-w-[480px] mx-auto px-6 pt-20 text-center text-white">
          <div className="text-[64px]">🎓</div>
          <h1 className="text-[30px] font-black leading-tight mt-4">
            {justDone ? "זהו. את/ה סטודנט/ית." : "האישור שלך שמור — את/ה סטודנט/ית."}
          </h1>
          <p className="text-[15px] leading-[1.8] mt-4" style={{ opacity: 0.85 }}>
            מהודעת SMS ראשונה ועד אישור לימודים ביד — עברת את כל הדרך,
            ועכשיו מתחיל החלק שבשבילו עשינו את הכל.
            <br /><br />
            <b>וחשוב שתדע/י: זה לא שלום.</b> הרכזת נשארת איתך גם בלימודים,
            כל מה שפתחת באפליקציה נשאר פתוח — המלגות, החשבון, המשימות —
            ואפשר לחזור ולהיעזר בכל שלב, מתי שתרצה/י.
          </p>
          <div className="flex flex-col gap-3 mt-10">
            <button onClick={view} className="w-full py-3.5 rounded-2xl text-[15px] font-black" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              לפתוח את האישור
            </button>
            <label className="w-full py-3 rounded-2xl text-[13.5px] font-bold cursor-pointer" style={{ color: "rgba(255,255,255,0.65)" }}>
              להחליף בגרסה עדכנית
              <input type="file" accept="image/*,.pdf" onChange={onFile} className="hidden" />
            </label>
            <Link href="/" className="w-full py-3.5 rounded-2xl text-[15px] font-black" style={{ background: ORANGE, color: "#fff" }}>
              למסע — שלב 6 ✓
            </Link>
          </div>
          <StudentCheckin />
        </div>
      ) : (
        <div className="max-w-[480px] mx-auto px-6 pt-12">
          <div className="text-[12px] font-black" style={{ color: ORANGE }}>הצעד האחרון במסע</div>
          <h1 className="text-[27px] font-black leading-tight mt-1" style={{ color: NAVY }}>
            נרשמת ללימודים?
            <br />
            זה הרגע לעדכן אותנו 🎓
          </h1>
          <p className="text-[14.5px] leading-[1.8] mt-3" style={{ color: "rgba(0,0,0,0.6)" }}>
            אישור לימודים / הרשמה מהמוסד — צילום או PDF. זה המסמך היחיד
            שמעלים לאפליקציה: משרד העבודה, שמלווה ומממן את התוכנית, צריך
            את האסמכתא. ההעלאה מעבירה אותך לשלב 6 — סטודנט/ית —
            והליווי ממשיך איתך גם שם.
          </p>
          <label className="block w-full mt-8 py-4 rounded-2xl text-[16px] font-black text-center cursor-pointer text-white" style={{ background: state === "uploading" ? "#f0a95e" : ORANGE }}>
            {state === "uploading" ? "מעלה…" : "העלאת האישור 🎓"}
            <input type="file" accept="image/*,.pdf" onChange={onFile} className="hidden" />
          </label>
          {state === "error" && (
            <div className="text-[12.5px] mt-3 font-bold text-center" style={{ color: "#b91c1c" }}>
              ההעלאה נכשלה — נסה/י שוב, ואם זה חוזר ספר/י לרכזת. המסמך לא אבד לך.
            </div>
          )}
          <div className="text-[12.5px] leading-[1.7] mt-6 text-center" style={{ color: "rgba(0,0,0,0.4)" }}>
            עוד לא נרשמת? המשימות בתוכנית מחכות —{" "}
            <Link href="/plan" className="font-bold" style={{ color: NAVY }}>חזרה לתוכנית ←</Link>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
