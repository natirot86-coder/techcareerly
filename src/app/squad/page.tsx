"use client";

/**
 * /squad — קהילה (נתי 28.8): מסך השראה הפך למסך חיבור.
 *
 * הגרסה הקודמת הציגה סיפורי בוגרים מכתבות. זו השראה, לא קהילה — והיא גם
 * כבר נמצאת במבוא להייטק. **קהילה היא מקום שאפשר להיכנס אליו ולפגוש בו
 * מישהו**, ולכן במסך הזה יש רק דברים שאפשר ללחוץ עליהם ולהגיע לאנשים:
 * אירועים קרובים · קבוצות וואטסאפ ופייסבוק · ובקשה לדבר עם בוגר.
 *
 * ⚠️ **ערוץ בלי קישור לא מוצג** (חוץ מקבוצות סגורות, שנכנסים אליהן דרך
 * הרכזת ולכן אין להן קישור מלכתחילה). קישור מת נראה כמו קהילה נטושה,
 * וזה גרוע יותר ממסך קצר.
 */

import { useEffect, useState } from "react";
import BottomNav from "@/components/ui/BottomNav";
import EventsList, { useEvents } from "@/components/ui/EventsList";
import { CHANNELS } from "@/data/community";
import { myCoordinator } from "@/lib/candidate";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const WA = "#25d366";
const FB = "#1877f2";

/* אייקונים inline — לוגו מקובץ חיצוני היה נשבר בשקט ומשאיר ריבוע ריק */
function Icon({ kind }: { kind: string }) {
  const bg = kind === "facebook" ? FB : kind === "telegram" ? "#29a9eb" : WA;
  return (
    <div className="shrink-0 rounded-xl grid place-items-center" style={{ width: 42, height: 42, background: bg }}>
      <svg viewBox="0 0 24 24" width="23" height="23" fill="#fff" aria-hidden="true">
        {kind === "facebook" ? (
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
        ) : kind === "telegram" ? (
          <path d="M21.9 4.3 18.9 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.4-4.9 9-8.1c.4-.3-.1-.5-.6-.2L7 11.3l-4.7-1.5c-1-.3-1-1 .2-1.5l18.3-7c.9-.3 1.6.2 1.3 1.5Z" />
        ) : (
          <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.2-.5-4.6-1.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
        )}
      </svg>
    </div>
  );
}

export default function SquadPage() {
  const events = useEvents();
  const [gender, setGender] = useState<string | null>(null);
  const [coord, setCoord] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    try { setGender(localStorage.getItem("user-gender")); } catch { /* ignore */ }
    myCoordinator().then(c => { if (c?.phone) setCoord({ name: c.name, phone: c.phone }); }).catch(() => {});
  }, []);
  const g = (m: string, f: string) => (gender === "female" ? f : m);

  /** קישור וואטסאפ לרכזת עם ההודעה כבר כתובה — הרבה יותר קל מלנסח מאפס */
  const waCoord = (text: string) =>
    coord ? `https://wa.me/${coord.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}` : "/contact";

  const shown = CHANNELS.filter(c => c.link || c.viaCoordinator);

  return (
    <div dir="rtl" className="min-h-screen pb-28" style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}>
      <div className="px-5 pt-10 pb-5" style={{ background: NAVY, color: "#fff" }}>
        <h1 className="text-[24px] font-black">קהילה</h1>
        <div className="text-[13.5px] mt-1" style={{ opacity: 0.75 }}>
          {g("אתה לא לבד בדרך הזאת", "את לא לבד בדרך הזאת")} — כאן נפגשים
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-5 pt-5 flex flex-col gap-6">

        {/* ── מה קרוב ─────────────────────────────────────────────── */}
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

        {/* ── קבוצות ──────────────────────────────────────────────── */}
        {shown.length > 0 && (
          <section>
            <div className="text-[12px] font-black mb-2" style={{ color: ORANGE }}>הקבוצות שלנו</div>
            <div className="flex flex-col gap-2.5">
              {shown.map(c => {
                const closed = !c.link && c.viaCoordinator;
                const href = closed
                  ? waCoord(`היי${coord ? " " + coord.name.split(" ")[0] : ""}, אשמח להצטרף ל${c.title} 🙂`)
                  : c.link;
                return (
                  <a key={c.id} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", textDecoration: "none", boxShadow: "0 2px 10px rgba(2,62,138,0.04)" }}>
                    <Icon kind={c.icon} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-black leading-snug" style={{ color: NAVY }}>{c.title}</div>
                      <p className="text-[13px] leading-[1.6] mt-0.5" style={{ color: "#5c6473" }}>{c.what}</p>
                      <div className="text-[12.5px] font-bold mt-1.5" style={{ color: closed ? ORANGE : NAVY }}>
                        {/* קבוצה סגורה איננה קבוצה נעולה — פשוט מצרפים דרך הרכזת */}
                        {closed ? "לבקש מהרכזת לצרף אותי ←" : "להצטרפות ↗"}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ── בוגר ────────────────────────────────────────────────── */}
        <section>
          <div className="text-[12px] font-black mb-2" style={{ color: ORANGE }}>לדבר עם מי שכבר עשה את זה</div>
          <div className="rounded-2xl px-4 py-4" style={{ background: "#fff", border: `1.5px solid ${ORANGE}33` }}>
            <p className="text-[13.5px] leading-[1.7]" style={{ color: "#3d4653" }}>
              יש בוגרי טק-קריירה שעובדים היום בהייטק — בפיתוח, ב-QA, בסייבר, בדאטה. חלקם מוכנים
              לדבר עם מי שנמצא עכשיו בהתחלה: איך זה באמת נראה, מה היה קשה, ומה {g("היה עוזר לו", "היה עוזר לה")} לדעת מראש.
              <br />
              <span className="font-bold" style={{ color: NAVY }}>הרכזת מחברת</span> — {g("תכתוב", "תכתבי")} לה באיזה תחום {g("אתה מתעניין", "את מתעניינת")}.
            </p>
            <a href={waCoord(`היי${coord ? " " + coord.name.split(" ")[0] : ""}, אשמח לדבר עם בוגר שעובד בהייטק 🙂`)}
              target="_blank" rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2.5 rounded-xl text-[13.5px] font-black"
              style={{ background: ORANGE, color: "#fff", textDecoration: "none" }}>
              {coord ? `לכתוב ל${coord.name.split(" ")[0]} ←` : "לכתוב לרכזת ←"}
            </a>
          </div>
        </section>

        {/*
          היעדר הוא מידע: אם אין עדיין אף ערוץ פתוח, אומרים את זה במפורש
          במקום להשאיר מסך שנראה כאילו לא נטען
        */}
        {!shown.length && !events.length && (
          <div className="text-[12.5px] leading-[1.7] text-center px-3" style={{ color: "rgba(0,0,0,0.4)" }}>
            הקבוצות והאירועים ייפתחו כאן בקרוב. בינתיים — הרכזת היא הדלת.
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
