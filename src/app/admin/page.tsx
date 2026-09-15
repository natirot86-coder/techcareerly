/**
 * /admin — הבית של אזור הניהול.
 *
 * עד עכשיו לא היה כאן דף בכלל — "← לאפליקציה" מתוך program/events היה
 * קישור מת. עכשיו זה הנחיתה הטבעית: אותם שמונה מסכים כמו בסיידבר,
 * כרטיסים במקום שורות תפריט, בשביל מי שמעדיף לראות הכל בבת אחת.
 */
import Link from "next/link";
import { ADMIN_NAV } from "@/data/adminNav";

const NAVY = "#023e8a";
const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

export default function AdminHome() {
  return (
    <div dir="rtl" className="px-6 py-8 md:px-10 md:py-10">
      <div className="text-[13px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>
        Techcareerly
      </div>
      <div className="text-[26px] mb-1" style={{ color: NAVY, ...HEEBO }}>אזור ניהול</div>
      <div className="text-[13.5px] mb-7" style={{ color: "rgba(0,0,0,0.5)" }}>
        שמונה לוחות — כל אחד עם שער ההזדהות שלו
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-[860px]">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          >
            <span className="text-[24px] shrink-0">{item.icon}</span>
            <span className="text-[13.5px] font-bold" style={{ color: NAVY }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
