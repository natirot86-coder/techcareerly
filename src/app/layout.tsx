import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Techcareerly",
  description: "מסלול הלימודים שלך להייטק",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full bg-cream flex flex-col items-center">
        {children}
      </body>
    </html>
  );
}
