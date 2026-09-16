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
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADMIN_NAV as NAV } from "@/data/adminNav";
import { coordinatorSignOut, getLoginLabel } from "@/lib/coordinatorAuth";

const NAVY = "#023e8a";
const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** נקרא רק ב-mount, אחרי הידרציה — הזהות יושבת ב-localStorage בלבד */
function useLoginLabel() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => { setLabel(getLoginLabel()); }, []);
  return label;
}

/*
 * ניווט מלא (לא router.push) בכוונה: AdminGate יושב ב-layout מעל כל מסכי
 * הניהול ובודק הרשאה פעם אחת ב-mount בלבד. ניווט בצד הלקוח לא ממחזר אותו,
 * ולכן ה"open" היה נשאר דלוק גם אחרי שה-session כבר נמחק. רענון מלא מבטיח
 * ש-AdminGate ייבדק מחדש ויציג את מסך הנעילה.
 */
async function handleSignOut() {
  await coordinatorSignOut();
  window.location.href = "/admin";
}

/** הגרסה לדסקטופ — עמודה קבועה בצד ימין (RTL), תמיד גלויה */
export function AdminSidebar() {
  const isActive = useActive();
  const loginLabel = useLoginLabel();
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

      <div className="mx-3 mb-5 flex flex-col gap-2">
        <Link
          href="/map"
          className="px-3 py-2.5 rounded-xl text-[12px] font-bold text-center"
          style={{ color: "rgba(0,0,0,0.4)", background: "rgba(0,0,0,0.03)" }}
        >
          ← מפת האפליקציה
        </Link>

        {/*
          אישור זהות אישי (16.9) — best practice בסיסי בכל פאנל ניהול: מי
          שרואה מסך צריך לדעת *מי* מזוהה כרגע, לא רק שהוא בפנים. מקובץ
          עם ההתנתקות כי זו פינת ה"חשבון", לא הניווט.
        */}
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {loginLabel && (
            <div className="flex items-center gap-2 px-3 text-[11.5px] font-bold" style={{ color: "rgba(0,0,0,0.45)" }}>
              <span>👤</span>
              {/* בלי פועל מגודר ("מחוברת/מחובר") — לא ידוע המגדר של כל רכזת/רכז בסגל */}
              <span className="truncate">{loginLabel}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 py-2.5 rounded-xl text-[12px] font-bold text-center"
            style={{ color: "#b91c1c", background: "rgba(185,28,28,0.06)" }}
          >
            התנתקות
          </button>
        </div>
      </div>
    </aside>
  );
}

/** הגרסה למובייל — פס עליון עם טאבים גוללים, כדי לא לגנוב עוד מסך גובה */
export function AdminTopBar() {
  const isActive = useActive();
  const loginLabel = useLoginLabel();
  return (
    <div dir="rtl" className="md:hidden sticky top-0 z-40" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px]" style={{ color: NAVY, ...HEEBO }}>אזור ניהול</div>
          {/* אישור זהות אישי (16.9) — אותו עיקרון כמו בסיידבר, בלי פועל מגודר */}
          {loginLabel && (
            <div className="text-[10.5px] font-bold truncate" style={{ color: "rgba(0,0,0,0.4)" }}>
              👤 {loginLabel}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/map" className="text-[11px] font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>מפת האפליקציה ←</Link>
          <button type="button" onClick={handleSignOut} className="text-[11px] font-bold" style={{ color: "#b91c1c" }}>
            התנתקות
          </button>
        </div>
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
