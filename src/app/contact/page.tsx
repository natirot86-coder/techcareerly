"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cal, { getCalApi } from "@calcom/embed-react";
import BottomNav from "@/components/ui/BottomNav";
import Link from "next/link";
import { calLinkFor, currentMeeting, MEETING_META, type MeetingNum } from "@/data/meetings";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

/**
 * מחלץ את מועד תחילת הפגישה מהמטען של Cal.com.
 * המבנה לא יציב בין גרסאות, ולכן סורקים כמה שמות מקובלים ומחזירים null
 * אם אף אחד לא נמצא — עדיף בלי מועד מאשר עם מועד שגוי.
 */
function extractStart(e: unknown): string | null {
  const seen = new Set<unknown>();
  const KEYS = ["startTime", "start", "date", "when", "bookingStartTime"];

  const walk = (v: unknown, depth: number): string | null => {
    if (!v || typeof v !== "object" || depth > 5 || seen.has(v)) return null;
    seen.add(v);
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (KEYS.includes(k) && typeof val === "string") {
        const d = new Date(val);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
      const nested = walk(val, depth + 1);
      if (nested) return nested;
    }
    return null;
  };

  return walk(e, 0);
}

export default function ContactPage() {
  const router = useRouter();
  /** null עד שיודעים — כדי לא לטעון את היומן של הפגישה הלא נכונה ואז להחליף */
  const [meeting, setMeeting] = useState<MeetingNum | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("m");
    const n = param && ["1", "2", "3"].includes(param)
      ? (Number(param) as MeetingNum)
      : currentMeeting(localStorage);
    setMeeting(n);
  }, []);

  useEffect(() => {
    if (!meeting) return;
    (async () => {
      const cal = await getCalApi({ namespace: "contact" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view", theme: "light" });
      cal("on", {
        action: "bookingSuccessful",
        callback: (e: unknown) => {
          localStorage.setItem("meeting-booked", "true");
          localStorage.setItem(`meeting-${meeting}-booked`, "true");
          localStorage.setItem(`meeting-${meeting}-booked-at`, new Date().toISOString());

          /*
           * שומרים את **מועד הפגישה** ולא רק את העובדה שנקבעה.
           *
           * זה מה שמאפשר לאפליקציה לדעת לבד שהפגישה עברה, בלי שאף אחד יסמן:
           * לא המועמד (שאלה מוזרה, וגם אפשר לשקר בה) ולא הרכזת (אין לה איפה).
           *
           * המבנה של המטען משתנה בין גרסאות של Cal.com, ולכן מנסים כמה
           * מקומות ולא מניחים אף אחד. אם לא נמצא מועד — לא ממציאים אחד;
           * מרחב ההמתנה יציע במקום זה קישור יזום ("הפגישה כבר הייתה?").
           */
          const at = extractStart(e);
          if (at) localStorage.setItem(`meeting-${meeting}-at`, at);

          // פגישה 1 נוחתת ישירות במרחב ההמתנה: הציר שם כבר מציג את האישור
          // ואת "מה יקרה בפגישה", ומסך אישור נפרד היה מסך כפול.
          // לפגישות 2 ו-3 אין מרחב המתנה, ולכן שם מסך האישור נשאר.
          router.push(meeting === 1 ? "/waiting" : `/contact/booked?m=${meeting}`);
        },
      });
    })();
  }, [router, meeting]);

  const meta = meeting ? MEETING_META[meeting] : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0">
        <div className="max-w-[900px] mx-auto">
          <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה למסע
          </Link>
          <div className="text-[12px] font-bold mb-1.5" style={{ color: "#fb8500" }}>
            {meeting ? `פגישה ${meeting} מתוך 3` : ""}
          </div>
          <div className="text-[30px] md:text-[36px] leading-tight" style={HEEBO}>
            {meta?.title ?? "שיחה עם הרכזת"}
          </div>
          <div className="text-[13.5px] mt-[6px]" style={{ opacity: 0.72 }}>
            {meta?.sub ?? "בחר/י תאריך ושעה — תוך שניות תקבל/י אישור ביומן"}
          </div>
        </div>
      </div>

      {/* מה קורה בפגישה, ומה להביא אליה */}
      {meta && (
        <div className="max-w-[900px] mx-auto w-full px-[22px] md:px-12 pt-5 pb-3">
          <div
            className="rounded-xl px-4 py-3.5 text-[12.5px] leading-[1.7]"
            style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.55)" }}
          >
            <span className="font-bold" style={{ color: "rgba(0,0,0,0.7)" }}>{meta.what}</span>
            <br />
            {meta.bring}
          </div>
        </div>
      )}

      {/* Cal.com embed */}
      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-12 pb-24">
        {meeting && (
          <Cal
            namespace="contact"
            calLink={calLinkFor(meeting)}
            style={{ width: "100%", minHeight: "600px", borderRadius: "16px", overflow: "hidden" }}
            config={{ layout: "month_view", theme: "light" }}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
