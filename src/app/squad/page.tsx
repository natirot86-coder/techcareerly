"use client";

/**
 * /squad — קהילה (נתי 27.8): מסך "בקרוב" הפך למסך חי.
 *
 * שני דברים, ושניהם אמיתיים: **מה קרוב** — ימים פתוחים, פאנלים וירידי
 * לימודים מלוח האירועים (התאריך מנהל, אירוע שעבר נעלם מעצמו); ו**מי כבר
 * שם** — סיפורי בוגרים מכתבות שפורסמו, עם שם וקישור לכתבה המלאה.
 *
 * הכלל שלנו על ייצוג: אדם אמיתי = כתבה אמיתית. אין כאן דמויות מומצאות
 * ואין ציטוטים שכתבנו בעצמנו — רק מה שפורסם, עם התמונה מהכתבה עצמה.
 */

import BottomNav from "@/components/ui/BottomNav";
import EventsList, { useEvents } from "@/components/ui/EventsList";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

/** אומת 24.8 — שתי כתבות ynet שנפתחו ונקראו. מסגור הישג, לא רחמים. */
const STORIES = [
  {
    name: "עמנואל — בודק תוכנה (QA) בחברת הייטק תל-אביבית",
    story: "עלה מאתיופיה בגיל צעיר — ותוך שנים ספורות כבר עבד בהייטק.",
    source: "ynet · 2023",
    href: "https://www.ynet.co.il/activism/article/rjhmifnqn",
    img: "/articles/story-emanuel.jpg",
  },
  {
    name: "יהונתן — מהשמירה בכניסה לבניין, אל ההייטק שבתוכו",
    story: "עבד כמאבטח בחברת הייטק. אחרי הכשרה בטק-קריירה חזר לאותו בניין — הפעם כאיש הייטק.",
    source: "ynet · 2019",
    href: "https://www.ynet.co.il/articles/0,7340,L-5456028,00.html",
    img: "/articles/story-yehonatan.jpg",
  },
];

export default function SquadPage() {
  const events = useEvents();

  return (
    <div dir="rtl" className="min-h-screen pb-28" style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}>
      <div className="px-5 pt-10 pb-5" style={{ background: NAVY, color: "#fff" }}>
        <h1 className="text-[24px] font-black">קהילה</h1>
        <div className="text-[13.5px] mt-1" style={{ opacity: 0.75 }}>
          מה קורה בקרוב, ומי כבר עשה את הדרך הזאת
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-5 pt-5 flex flex-col gap-6">
        <section>
          <div className="text-[12px] font-black mb-2" style={{ color: ORANGE }}>מה קרוב</div>
          {events.length ? (
            <EventsList events={events} />
          ) : (
            <div className="rounded-2xl px-4 py-4 text-[13px] leading-[1.7]"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.5)" }}>
              אין כרגע אירועים מתוכננים. כשייקבע יום פתוח, פאנל או יריד לימודים — הוא יופיע כאן,
              וגם הרכזת תעדכן אותך.
            </div>
          )}
        </section>

        <section>
          <div className="text-[12px] font-black mb-2" style={{ color: ORANGE }}>מי כבר שם</div>
          <div className="flex flex-col gap-3">
            {STORIES.map(s => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt="" className="w-full object-cover" style={{ aspectRatio: "16/9" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="px-4 py-3">
                  <div className="text-[10.5px] font-black tracking-widest uppercase" style={{ color: "rgba(0,0,0,0.38)" }}>{s.source}</div>
                  <div className="text-[15px] font-black leading-snug mt-1" style={{ color: NAVY }}>{s.name}</div>
                  <p className="text-[13.5px] leading-[1.6] mt-1" style={{ color: "#5c6473" }}>{s.story}</p>
                  <div className="text-[13px] font-bold mt-1.5" style={{ color: NAVY }}>לכתבה המלאה ↗</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
