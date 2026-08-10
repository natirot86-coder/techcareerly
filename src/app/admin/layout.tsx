import type { Metadata } from "next";

/** דפי ניהול פנימיים — לא לאינדוקס ולא למעקב במנועי חיפוש */
export const metadata: Metadata = {
  title: "ניהול — Techcareerly",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
