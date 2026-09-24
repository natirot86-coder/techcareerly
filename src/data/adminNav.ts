/**
 * רשימת מסכי הניהול — מקור אמת יחיד לסיידבר (AdminSidebar), לפס העליון
 * במובייל (AdminTopBar) ולדף הבית של האזור (/admin). קובץ נתונים רגיל
 * ולא "use client", כי /admin/page.tsx הוא Server Component: ייבוא ערך
 * (לא קומפוננטה) מקובץ "use client" נשבר בגבול ה-RSC.
 */
export const ADMIN_NAV = [
  { href: "/admin/analytics", icon: "📊", label: "אנליטיקות" },
  { href: "/admin/coordinator", icon: "🧭", label: "מי צריך אותי היום" },
  { href: "/admin/program", icon: "👥", label: "סגל ושיוך" },
  { href: "/admin/events", icon: "📅", label: "לוח האירועים" },
  { href: "/admin/institutions", icon: "🏛️", label: "מוסדות" },
  { href: "/admin/scholarships", icon: "💰", label: "מלגות ותוכניות" },
  { href: "/admin/courses", icon: "📚", label: "קורסים" },
  { href: "/admin/degrees", icon: "🎓", label: "תארים" },
] as const;
