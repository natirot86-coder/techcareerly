/**
 * רשימת מסכי הניהול — מקור אמת יחיד לסיידבר (AdminSidebar), לפס העליון
 * במובייל (AdminTopBar) ולדף הבית של האזור (/admin). קובץ נתונים רגיל
 * ולא "use client", כי /admin/page.tsx הוא Server Component: ייבוא ערך
 * (לא קומפוננטה) מקובץ "use client" נשבר בגבול ה-RSC.
 */
/*
  `owner: true` ⇒ מוצג רק לנתי ולישראל (8.10). האנליטיקות חסומות בשרת
  מאז 5.10, אבל הן נשארו בתפריט — כלומר סיון ראתה כפתור שמחזיר לה 403.
  **תפריט שמציג מה שאי אפשר ללחוץ עליו הוא תפריט שמלמדים להתעלם ממנו.**
*/
export const ADMIN_NAV = [
  { href: "/admin/analytics", icon: "📊", label: "אנליטיקות", owner: true },
  { href: "/admin/coordinator", icon: "🧭", label: "מי צריך אותי היום" },
  { href: "/admin/program", icon: "👥", label: "סגל ושיוך" },
  { href: "/admin/events", icon: "📅", label: "לוח האירועים" },
  { href: "/admin/institutions", icon: "🏛️", label: "מוסדות" },
  { href: "/admin/scholarships", icon: "💰", label: "מלגות ותוכניות" },
  { href: "/admin/courses", icon: "📚", label: "קורסים" },
  { href: "/admin/degrees", icon: "🎓", label: "תארים" },
] as const;
