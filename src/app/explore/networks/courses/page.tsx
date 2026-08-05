"use client";
import React from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const BLUE = "#3b82f6";
const NAVY = "#023e8a";
const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

type Course = {
  emoji: string;
  platform: string;
  title: string;
  lang: "עברית" | "אנגלית" | "עברית / אנגלית";
  certified: boolean;
  rating?: string;
  students?: string;
  description: string;
  href: string;
  highlight?: string;
};

const COURSES: Course[] = [
  {
    emoji: "🏛️",
    platform: "Campus.gov.il",
    title: "מרושתים — רשתות ותקשורת",
    lang: "עברית",
    certified: true,
    rating: "4.8",
    students: "25,000+",
    description:
      "קורס ממשלתי חינמי בעברית. מכסה IP, DNS, TCP/IP, routing ומודל 5 שכבות — בדיוק מה שראית בטעימה, רק לעומק.",
    href: "https://campus.gov.il/course/cs-gov-cs-reshatot101/",
    highlight: "המומלץ ביותר להתחיל",
  },
  {
    emoji: "🔵",
    platform: "Cisco Networking Academy",
    title: "Introduction to Networks (CCNA 1)",
    lang: "אנגלית",
    certified: true,
    rating: "4.7",
    students: "5M+",
    description:
      "הקורס הבסיסי של ציסקו — הסמכה בינלאומית מוכרת. מקיף, מסודר, מלא סימולציות אינטראקטיביות. החלק הראשון חינמי לחלוטין.",
    href: "https://www.netacad.com/",
  },
  {
    emoji: "🎥",
    platform: "Professor Messer",
    title: "CompTIA Network+ Free Course",
    lang: "אנגלית",
    certified: false,
    rating: "4.9",
    students: "1M+ צפיות",
    description:
      "הקורס החינמי הנצפה ביותר ל-Network+. מעל 15 שעות וידאו, קצב נוח, הסברים מעמיקים. מאות לומדים מציינים שסיימו בהצלחה בזכותו.",
    href: "https://www.professormesser.com/",
  },
  {
    emoji: "🌐",
    platform: "Khan Academy",
    title: "How the Internet Works",
    lang: "עברית / אנגלית",
    certified: false,
    rating: "4.7",
    description:
      "הקדמה ויזואלית ומצוינת ל-IP, packets, routing ו-DNS — קצרה, ברורה, חינמית לחלוטין. מושלמת לחיזוק הבסיס.",
    href: "https://www.khanacademy.org/computing/computers-and-internet/xcae6f4a7ff015e7d:the-internet",
  },
];

export default function NetworksCoursesPage() {
  function goToExperience() {
    window.location.href = "/explore/networks/experience";
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: BLUE }}>
        <div className="max-w-[720px] mx-auto">
          <Link
            href="/explore/networks"
            className="text-[12px] font-bold block mb-4"
            style={{ opacity: 0.82 }}
          >
            ← חזרה
          </Link>
          <div className="text-[20px]" style={HEEBO}>
            קורסים חינמיים — רשתות
          </div>
          <div className="text-[12.5px] mt-1" style={{ opacity: 0.78 }}>
            כל הקורסים האלו חינמיים לחלוטין
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32" dir="rtl">
        <p className="text-[13.5px] leading-[1.7] mb-6" style={{ color: "rgba(0,0,0,0.55)" }}>
          עשית צעד ראשון מגניב. הנה איפה ממשיכים —{" "}
          <span className="font-bold" style={{ color: NAVY }}>
            כולם חינמיים, כולם מומלצים.
          </span>
        </p>

        {/* Course cards */}
        <div className="flex flex-col gap-4 mb-8">
          {COURSES.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#fff",
                border: `1.5px solid rgba(59,130,246,0.13)`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {c.highlight && (
                <div
                  className="px-4 py-2 text-[11px] font-bold text-white"
                  style={{ background: BLUE }}
                >
                  ⭐ {c.highlight}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-[26px] mt-0.5 shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: "rgba(0,0,0,0.35)" }}
                    >
                      {c.platform}
                    </div>
                    <div
                      className="text-[15px] font-black leading-[1.35] mb-2.5"
                      style={{ color: NAVY, ...HEEBO }}
                    >
                      {c.title}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span
                        className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}
                      >
                        ✓ חינמי
                      </span>
                      <span
                        className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(59,130,246,0.08)", color: BLUE }}
                      >
                        {c.lang}
                      </span>
                      {c.certified && (
                        <span
                          className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(251,133,0,0.1)", color: "#d97706" }}
                        >
                          תעודה
                        </span>
                      )}
                    </div>

                    {/* Rating row */}
                    {(c.rating || c.students) && (
                      <div className="flex items-center gap-3 mb-2.5">
                        {c.rating && (
                          <div className="flex items-center gap-1">
                            <span style={{ color: "#f59e0b", fontSize: 13 }}>★</span>
                            <span
                              className="text-[12px] font-bold"
                              style={{ color: "rgba(0,0,0,0.7)" }}
                            >
                              {c.rating}
                            </span>
                          </div>
                        )}
                        {c.students && (
                          <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                            {c.students} לומדים
                          </div>
                        )}
                      </div>
                    )}

                    <p
                      className="text-[12.5px] leading-[1.6] mb-3"
                      style={{ color: "rgba(0,0,0,0.55)" }}
                    >
                      {c.description}
                    </p>

                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold py-2 px-4 rounded-xl"
                      style={{
                        background: `rgba(59,130,246,0.08)`,
                        color: BLUE,
                        border: `1px solid rgba(59,130,246,0.2)`,
                      }}
                    >
                      לקורס ←
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to experience */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "rgba(59,130,246,0.05)", border: "1.5px solid rgba(59,130,246,0.18)" }}
        >
          <div
            className="text-[13px] leading-[1.6] mb-4"
            style={{ color: "rgba(0,0,0,0.55)" }}
          >
            <span className="font-bold" style={{ color: NAVY }}>
              לפני שממשיכים הלאה
            </span>{" "}
            — שווה לקחת 5 דקות לעבד את מה שחווית. זה עוזר להבין אם התחום מדבר אליך.
          </div>
          <button
            onClick={goToExperience}
            className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}
          >
            קדימה לכלי עיבוד החוויה ←
          </button>
        </div>

        <Link
          href="/explore/networks"
          className="block text-center text-[12px] font-bold"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          חזרה לתחום רשתות
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
