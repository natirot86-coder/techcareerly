import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import ResumeTracker from "@/components/ResumeTracker";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Techcareerly",
  description: "מסלול הלימודים שלך להייטק",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full bg-cream flex flex-col items-center md:items-stretch">
        {children}
        {/* זיכרון מיקום — Suspense כי useSearchParams מחייב זאת ברינדור סטטי */}
        <Suspense fallback={null}>
          <ResumeTracker />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
