"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cal, { getCalApi } from "@calcom/embed-react";
import BottomNav from "@/components/ui/BottomNav";
import Link from "next/link";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

export default function ContactPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "contact" });
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "light",
      });
      cal("on", {
        action: "bookingSuccessful",
        callback: () => {
          localStorage.setItem("meeting-booked", "true");
          router.push("/contact/booked");
        },
      });
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0">
        <div className="max-w-[900px] mx-auto">
          <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה למסע
          </Link>
          <div className="text-[30px] md:text-[36px] leading-tight" style={HEEBO}>שיחה עם הרכזת</div>
          <div className="text-[13.5px] mt-[6px]" style={{ opacity: 0.72 }}>
            בחר/י תאריך ושעה — תוך שניות תקבל/י אישור ביומן
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="max-w-[900px] mx-auto w-full px-[22px] md:px-12 pt-5 pb-3">
        <div
          className="rounded-xl px-4 py-3.5 text-[12.5px] leading-[1.7]"
          style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.55)" }}
        >
          <span className="font-bold" style={{ color: "rgba(0,0,0,0.7)" }}>השיחה היא 30 דקות.</span>{" "}
          תביא/י את הסיכום שהכנת — זה יעזור לנו להגיע לאיפשהו אמיתי. אחרי האישור תקבל/י הזמנה ישירה ליומן.
        </div>
      </div>

      {/* Cal.com embed */}
      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-12 pb-24">
        <Cal
          namespace="contact"
          calLink="nati-rotstein-cpehqd/פגישה-שנייה-עם-רכזת-החשיפה"
          style={{ width: "100%", minHeight: "600px", borderRadius: "16px", overflow: "hidden" }}
          config={{ layout: "month_view", theme: "light" }}
        />
      </div>

      <BottomNav />
    </div>
  );
}
