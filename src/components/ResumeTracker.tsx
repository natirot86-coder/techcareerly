"use client";

/**
 * זיכרון מיקום — "המערכת מחזירה אותך בדיוק לאיפה שהיית".
 *
 * כל ניווט נשמר ל-localStorage, ודף הבית (/) מחזיר לשם במקום לזרוק את
 * כולם לאונבורדינג. בלי זה, מי שסגר את האפליקציה באמצע שלב 4 חזר למסך
 * הפתיחה — וחוויית "המערכת שכחה אותי" היא בדיוק ההפך ממה שמסע מלווה
 * אמור להרגיש.
 *
 * מה לא נשמר: מסכי ניהול ומפה (פנימיים), reset (בכוונה), login (נקודת
 * כניסה, לא מיקום), ודף הבית עצמו. השחזור ברמת path+query — עומק פנימי
 * (שלב בשאלון, טאב בתוכנית) הוא באחריות כל דף, שכבר שומר אותו בעצמו.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { touchActivity, syncTasteProgress, updateCurrentStage } from "@/lib/candidate";

/**
 * גזירת השלב — הועברה לכאן מהדשבורד כשהוא בוטל (נתי 25.8): הוא היה
 * המקום היחיד שסנכרן את השלב ל-DB, ומסך הרכזת היה מפסיק להתעדכן בלעדיו.
 * מונוטוני עולה בלבד, ונשלח רק כשהשלב באמת השתנה.
 */
function deriveStage(): number {
  const flag = (k: string) => localStorage.getItem(k) === "true";
  const has = (k: string) => !!localStorage.getItem(k);
  return has("enrollment-doc-path") ? 6
    : has("plan-tasks") || has("plan-intro-seen") ? 5
    : has("paths-quiz") || has("paths-journey") ? 4
    : has("waiting-taste") && flag("meeting-1-attended") ? 3
    : flag("meeting-1-booked") ? 2
    : 1;
}

const SKIP = ["/admin", "/map", "/reset", "/login", "/api"];
export const LAST_LOCATION_KEY = "last-location";

export default function ResumeTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    if (SKIP.some(p => pathname.startsWith(p))) return;
    /* קישור ההרשמה האישי של רכזת (נתי 27.8): ?coord=<id> בכל כניסה
       נשמר — וההרשמה תשייך את המועמד אליה מהרגע הראשון (יומן, וואטסאפ) */
    const coord = search.get("coord");
    if (coord) { try { localStorage.setItem("assigned-coord", coord); } catch { /* ignore */ } }

    // ?reset ו-?demo הם מצבי בדיקה — לא מיקום אמיתי ולא פעילות אמיתית
    const qs = search.toString();
    if (/(^|&)(reset|demo)=/.test(qs)) return;

    /*
     * "מתי הוא היה כאן לאחרונה" — מרוסן לפעם בשעה בתוך touchActivity.
     * יושב כאן כי זה הרכיב היחיד שרואה כל ניווט, כולל הטעינה הראשונה:
     * מי שפתח את האפליקציה והסתכל דקה נספר, גם אם לא לחץ על כלום.
     */
    touchActivity();
    // התקדמות הטעימות עולה לשרת מכל ניווט — הפרשים בלבד
    syncTasteProgress();

    // סנכרון השלב לרכזת — רק כשהוא עלה
    try {
      const derived = deriveStage();
      const prev = Number(localStorage.getItem("stage-synced") ?? 0);
      if (derived > prev) {
        localStorage.setItem("stage-synced", String(derived));
        updateCurrentStage(derived);
      }
    } catch { /* ignore */ }

    if (pathname === "/") return; // נקודת מעבר, לא מיקום לחזור אליו
    localStorage.setItem(LAST_LOCATION_KEY, qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, search]);

  return null;
}
