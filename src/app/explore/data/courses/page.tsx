"use client";
import React from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const TEAL = "#0d9488";
const DARK = "#134e4a";
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
    title: "Data.Intro — מבוא לניתוח נתונים בפייתון",
    lang: "עברית",
    certified: true,
    rating: "4.8",
    students: "15,000+",
    description:
      "קורס ממשלתי חינמי בעברית. מכסה Python בסיסי, Pandas, ניקוי נתונים וויזואליזציה — נקודת כניסה מצוינת לתחום.",
    href: "https://campus.gov.il/en/course/cs-gov-cs-data-dataintro101-he/",
    highlight: "המומלץ ביותר להתחיל",
  },
  {
    emoji: "🎥",
    platform: "ramkedem.com",
    title: "קורס דאטה אנליסט למתחילים — רם קדם",
    lang: "עברית",
    certified: false,
    rating: "4.9",
    students: "עשרות אלפי לומדים",
    description:
      "קורס מבוא מובנה בעברית — חינמי לגמרי. מכסה Excel, SQL, Power BI, Tableau. אחד הקולות המובילים לדאטה אנליטיקס בישראל. נקודת כניסה מצוינת עם מסלול ברור.",
    href: "https://ramkedem.com/course/%d7%a7%d7%95%d7%a8%d7%a1-%d7%93%d7%90%d7%98%d7%94-%d7%90%d7%a0%d7%9c%d7%99%d7%a1%d7%98-%d7%9c%d7%9e%d7%aa%d7%97%d7%99%d7%9c%d7%99%d7%9d/",
  },
  {
    emoji: "🐱",
    platform: "Kaggle Learn",
    title: "Intro to Machine Learning / Python",
    lang: "אנגלית",
    certified: true,
    rating: "4.8",
    students: "3M+",
    description:
      "קורסים אינטראקטיביים קצרים ישירות בדפדפן — ללא התקנה. Python, Pandas, Visualization, ML. תעודת השלמה חינמית לכל קורס.",
    href: "https://www.kaggle.com/learn",
  },
  {
    emoji: "📊",
    platform: "Google / Coursera",
    title: "Google Data Analytics Certificate",
    lang: "אנגלית",
    certified: true,
    rating: "4.8",
    students: "2M+",
    description:
      "תוכנית מקיפה של גוגל: SQL, Tableau, R, ניתוח נתונים. ניתן לבקר (audit) בחינם. תעודה מוכרת בתעשייה.",
    href: "https://www.coursera.org/professional-certificates/google-data-analytics",
  },
];

export default function DataCoursesPage() {
  function goToExperience() {
    window.location.href = "/explore/data/experience";
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: TEAL }}>
        <div className="max-w-[720px] mx-auto">
          <Link
            href="/explore/data"
            className="text-[12px] font-bold block mb-4"
            style={{ opacity: 0.82 }}
          >
            ← חזרה
          </Link>
          <div className="text-[20px]" style={HEEBO}>
            קורסים חינמיים — דאטה
          </div>
          <div className="text-[12.5px] mt-1" style={{ opacity: 0.78 }}>
            כל הקורסים האלו חינמיים לחלוטין
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32" dir="rtl">
        <p className="text-[13.5px] leading-[1.7] mb-6" style={{ color: "rgba(0,0,0,0.55)" }}>
          עשית צעד ראשון מגניב. הנה איפה ממשיכים —{" "}
          <span className="font-bold" style={{ color: DARK }}>
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
                border: `1.5px solid rgba(13,148,136,0.13)`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {c.highlight && (
                <div
                  className="px-4 py-2 text-[11px] font-bold text-white"
                  style={{ background: TEAL }}
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
                      style={{ color: DARK, ...HEEBO }}
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
                        style={{ background: "rgba(13,148,136,0.08)", color: TEAL }}
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
                        background: `rgba(13,148,136,0.08)`,
                        color: TEAL,
                        border: `1px solid rgba(13,148,136,0.2)`,
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
          style={{ background: "rgba(13,148,136,0.05)", border: "1.5px solid rgba(13,148,136,0.18)" }}
        >
          <div
            className="text-[13px] leading-[1.6] mb-4"
            style={{ color: "rgba(0,0,0,0.55)" }}
          >
            <span className="font-bold" style={{ color: DARK }}>
              לפני שממשיכים הלאה
            </span>{" "}
            — שווה לקחת 5 דקות לעבד את מה שחווית. זה עוזר להבין אם התחום מדבר אליך.
          </div>
          <button
            onClick={goToExperience}
            className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: TEAL, fontFamily: "'Heebo', sans-serif" }}
          >
            קדימה לכלי עיבוד החוויה ←
          </button>
        </div>

        <Link
          href="/explore/data"
          className="block text-center text-[12px] font-bold"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          חזרה לתחום דאטה
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
