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

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const last = localStorage.getItem(LAST_LOCATION_KEY);
    if (last && last !== "/") {
      router.replace(last);
      return;
    }
    const onboarded = !!localStorage.getItem("onboarding") || !!localStorage.getItem("user-name");
    router.replace(onboarded ? "/dashboard" : "/onboarding");
  }, [router]);

  return null;
}
