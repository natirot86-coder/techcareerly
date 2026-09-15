"use client";

/**
 * ניווט הצד של אזור הניהול — עד עכשיו כל מסך ניהול היה אי בפני עצמו,
 * עם קישור "← לאפליקציה"/"← למפה" משלו ובלי שום דרך לעבור בין לוחות
 * הניהול עצמם חוץ מהקלדת URL. זו הסיבה שנבנה: מבנה קבוע אחד עם תפריט
 * שמראה תמיד את כל שמונת המסכים ואיפה אתה נמצא ביניהם.
 *
 * לא נוגע בשערי ההזדהות של כל דף (AdminGate או הגרסה המוטבעת) — הם
 * נשארים בדיוק כמו שהיו. הסיידבר הוא רק שכבת ניווט מסביב לתוכן.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV as NAV } from "@/data/adminNav";

const NAVY = "#023e8a";
const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** הגרסה לדסקטופ — עמודה קבועה בצד ימין (RTL), תמיד גלויה */
export function AdminSidebar() {
  const isActive = useActive();
  return (
    <aside
      dir="rtl"
      className="hidden md:flex flex-col shrink-0 w-[230px] h-screen sticky top-0 overflow-y-auto"
      style={{ background: "#fff", borderInlineStart: "1px solid rgba(0,0,0,0.08)" }}
    >
      <Link href="/admin" className="block px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>Techcareerly</div>
        <div className="text-[17px] mt-0.5" style={{ color: NAVY, ...HEEBO }}>אזור ניהול</div>
      </Link>

      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-bold transition-colors"
              style={{
                color: active ? NAVY : "rgba(0,0,0,0.55)",
                background: active ? "rgba(2,62,138,0.08)" : "transparent",
              }}
            >
              <span className="text-[15px]" style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/map"
        className="mx-3 mb-5 px-3 py-2.5 rounded-xl text-[12px] font-bold text-center"
        style={{ color: "rgba(0,0,0,0.4)", background: "rgba(0,0,0,0.03)" }}
      >
        ← מפת האפליקציה
      </Link>
    </aside>
  );
}

/** הגרסה למובייל — פס עליון עם טאבים גוללים, כדי לא לגנוב עוד מסך גובה */
export function AdminTopBar() {
  const isActive = useActive();
  return (
    <div dir="rtl" className="md:hidden sticky top-0 z-40" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="text-[14px]" style={{ color: NAVY, ...HEEBO }}>אזור ניהול</div>
        <Link href="/map" className="text-[11px] font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>מפת האפליקציה ←</Link>
      </div>
      <nav className="flex gap-1.5 px-3 pb-2.5 overflow-x-auto">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap"
              style={{
                color: active ? "#fff" : "rgba(0,0,0,0.55)",
                background: active ? NAVY : "rgba(0,0,0,0.05)",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
