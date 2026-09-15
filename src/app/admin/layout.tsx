import type { Metadata } from "next";
import { AdminSidebar, AdminTopBar } from "@/components/admin/AdminSidebar";
import AdminGate from "@/components/AdminGate";

/** דפי ניהול פנימיים — לא לאינדוקס ולא למעקב במנועי חיפוש */
export const metadata: Metadata = {
  title: "ניהול — Techcareerly",
  robots: { index: false, follow: false, nocache: true },
};

/*
 * השער עבר לכאן (7.9.2026) — מקום אחד במקום שמונה. עד עכשיו חמישה
 * דפים עטפו את עצמם ב-AdminGate ושלושה בנו גרסה מוטבעת משלהם, כל אחד
 * עם אותה בדיקה בדיוק. עכשיו כל מסך בתוך /admin סומך על כך שהוא כבר
 * מאחורי שער — הסיידבר גם הוא בפנים, כי אין טעם להראות ניווט לפני
 * שיודעים מי מסתכל.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      {/* w-full נחוץ: ה-body הגלובלי הוא flex items-center במובייל, וכל ילד
          בלי רוחב מפורש מתכווץ לתוכן שלו במקום למתוח על כל המסך */}
      <div className="flex min-h-screen w-full" style={{ background: "#fbf9f5" }}>
        <AdminSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopBar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </AdminGate>
  );
}
