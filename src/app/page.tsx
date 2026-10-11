"use client";

/**
 * דף הבית מחזיר אותך לאיפה שהיית — לא לתחילת הדרך.
 *
 * עד 14.8.2026 היה כאן redirect קבוע לאונבורדינג, כלומר כל חזרה לאפליקציה
 * התחילה מאפס. עכשיו: מי ששמור לו מיקום חוזר אליו; מי שסיים אונבורדינג
 * אבל בלי מיקום שמור מגיע לדשבורד; ורק מי שחדש לגמרי מתחיל באונבורדינג.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LAST_LOCATION_KEY } from "@/components/ResumeTracker";
import { deriveStage, STAGE_CTA } from "@/components/ui/BottomNav";
import { restoreProgressFromServer } from "@/lib/candidate";

// /dashboard בוטל (נתי 25.8) ומפנה עכשיו בחזרה ל-"/" — מי שיש לו עדיין את
// הדף הזה שמור כמיקום אחרון (כל מי שביקר שם לפני הביטול) היה נכנס ללולאת
// redirect אינסופית: "/" -> /dashboard -> "/" -> /dashboard...
const RETIRED_LOCATIONS = ["/dashboard"];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const last = localStorage.getItem(LAST_LOCATION_KEY);
    if (last && last !== "/" && !RETIRED_LOCATIONS.some(r => last.startsWith(r))) {
      router.replace(last);
      return;
    }
    const onboarded = !!localStorage.getItem("onboarding") || !!localStorage.getItem("user-name");
    if (onboarded) { router.replace(STAGE_CTA[deriveStage()].href); return; }
    /*
      ⚠️ **דפדפן ריק אינו "אדם חדש"** (סיון, 11.10). משתתף בפגישה 2 נכנס עם
      הטלפון בדפדפן אחר ונשלח מכאן לאונבורדינג — כי הבדיקה הייתה רק מקומית.
      קודם שואלים את השרת; רק מי שאין לו הרשמה שם הוא באמת חדש.
    */
    restoreProgressFromServer().then(ok => {
      router.replace(ok ? STAGE_CTA[deriveStage()].href : "/onboarding");
    });
  }, [router]);

  return null;
}
