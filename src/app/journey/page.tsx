"use client";

/**
 * /journey — המסע המפורט (נתי 27.8).
 *
 * החליף את מגירת השלבים. הלקח מהדשבורד שביטלנו: הוא לא נכשל כי היה
 * מסך, אלא כי היה **דל** — שש כותרות בלי תוכן. כאן כל שלב נפתח לתחנות
 * שקרו באמת ("טעמת דאטה", "נפגשת עם נתי"), ולכן יש סיבה לחזור אליו.
 *
 * **שפה של מועמד, לא של ניטור.** אותן תחנות שהרכזת רואה, אבל אצלה
 * "תקוע 5 ימים" ואצלו "הצעד הבא". מי שהמסוגלות שלו נמוכה לא צריך מסך
 * ששופט אותו — הוא צריך לראות כמה כבר עשה.
 *
 * הכל נגזר ממה שקרה (localStorage), לא ממה שהוצהר — כמו בכל המוצר.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import EventsList, { useEvents } from "@/components/ui/EventsList";
import { JOURNEY } from "@/data/journey";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";

const DOMAIN_HE: Record<string, string> = {
  code: "פיתוח תוכנה", data: "דאטה", cyber: "סייבר", networks: "רשתות",
  qa: "בדיקות תוכנה", hardware: "חומרה", ai: "AI", ux: "עיצוב UX", marketing: "שיווק דיגיטלי",
};

type Stop = { label: string; done: boolean; href?: string };
type Stage = { n: number; title: string; stops: Stop[] };

/** קריאה בטוחה — המסך רץ גם כשאין כלום ב-storage */
function reader() {
  const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
  const has = (k: string) => !!get(k);
  const flag = (k: string) => get(k) === "true";
  const json = (k: string) => { try { return JSON.parse(get(k) ?? "null"); } catch { return null; } };
  return { get, has, flag, json };
}

function buildStages(): { stages: Stage[]; current: number } {
  const { get, has, flag, json } = reader();

  // אילו תחומים באמת נגע בהם — התחנות האישיות של שלב 3
  const tasted = Object.keys(DOMAIN_HE).filter(d => {
    const j = json(`${d}-journey`);
    return j && (j.sim || j.day || j.mystery || j.experience || j.analytics);
  });

  const m1 = get("meeting-1-attended") === "yes";
  const m2 = get("meeting-2-attended") === "yes" || has("paths-domains");
  const m3 = flag("meeting-3-booked");
  const enrolled = has("enrollment-doc-path");

  const stages: Stage[] = [
    {
      n: 1, title: JOURNEY[0].candidate,
      stops: [{ label: "מילאת את השאלון הראשוני", done: has("onboarding") || has("user-name"), href: "/onboarding" }],
    },
    {
      n: 2, title: JOURNEY[1].candidate,
      stops: [
        { label: "קבעת את פגישת ההיכרות", done: flag("meeting-1-booked"), href: "/contact?m=1" },
        { label: "עברת את המבוא לעולם ההייטק", done: has("waiting-taste"), href: "/waiting" },
        { label: "נפגשת עם הרכזת", done: m1 },
      ],
    },
    {
      n: 3, title: JOURNEY[2].candidate,
      stops: [
        ...tasted.map(d => ({ label: `טעמת ${DOMAIN_HE[d]}`, done: true, href: `/explore/${d}` })),
        ...(tasted.length < 2
          ? [{ label: `עוד ${2 - tasted.length} טעימות והפגישה נפתחת`, done: false, href: "/explore" }]
          : []),
        { label: "סיכמת את הטעימות", done: has("explore-results"), href: "/explore/results" },
      ],
    },
    {
      n: 4, title: JOURNEY[3].candidate,
      stops: [
        { label: "נפגשתם ובחרת תחום", done: m2 },
        { label: "ענית על שאלון המסלולים", done: has("paths-quiz"), href: "/paths" },
        { label: "חקרת מוסדות ושמרת רשימה", done: has("paths-shortlist"), href: "/paths" },
        { label: "קבעת את פגישת בחירת המסלול", done: m3, href: "/contact?m=3" },
      ],
    },
    {
      n: 5, title: JOURNEY[4].candidate,
      stops: [
        { label: "בחרת מוסד לימודים", done: has("plan-inst-main"), href: "/plan" },
        { label: "ראית כמה זה עולה ואילו מלגות מגיעות לך", done: has("plan-picked"), href: "/plan?view=money" },
        { label: "נרשמת ללימודים", done: enrolled, href: "/enroll" },
      ],
    },
    {
      n: 6, title: JOURNEY[5].candidate,
      stops: [{ label: "אישור הלימודים שלך שמור", done: enrolled, href: "/enroll" }],
    },
  ];

  // השלב הנוכחי = הראשון שלא הושלם במלואו
  const current = stages.find(s => s.stops.some(t => !t.done))?.n ?? 6;
  return { stages, current };
}

/** מפת-העל לדסקטופ: שתי שורות, קשת מקווקה ביניהן, לחיצה גוללת לשלב */
function Serpentine({ stages, current }: { stages: Stage[]; current: number }) {
  const DASH = "#ddd6c9";
  const POS: [number, number][] = [[500, 46], [305, 46], [110, 46], [110, 150], [305, 150], [500, 150]];
  const go = (n: number) => document.getElementById(`stage-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  return (
    <svg viewBox="0 0 580 210" className="w-full mb-6 hidden md:block" aria-hidden="false">
      <path d="M 500 46 L 110 46" fill="none" stroke={DASH} strokeWidth="2.5" strokeDasharray="5 6" />
      <path d="M 110 46 C 52 46, 52 150, 110 150" fill="none" stroke={DASH} strokeWidth="2.5" strokeDasharray="5 6" />
      <path d="M 110 150 L 500 150" fill="none" stroke={DASH} strokeWidth="2.5" strokeDasharray="5 6" />
      {stages.map((st, i) => {
        const [x, y] = POS[i];
        const done = st.stops.every(t => t.done);
        const isCurrent = st.n === current;
        const total = st.stops.length;
        const got = st.stops.filter(t => t.done).length;
        return (
          <g key={st.n} onClick={() => go(st.n)} style={{ cursor: "pointer" }}>
            {isCurrent && <circle cx={x} cy={y} r="25" fill="rgba(251,133,0,0.16)" />}
            <circle cx={x} cy={y} r="18" fill={done ? GREEN : isCurrent ? ORANGE : "#eceae4"} />
            <text x={x} y={y + 5.5} fontSize={done ? "16" : "13"} fontWeight="900"
              fill={done || isCurrent ? "#fff" : "#a8a195"} textAnchor="middle">
              {done ? "✓" : isCurrent ? st.n : "🔒"}
            </text>
            <text x={x} y={y + 36} fontSize="12.5" fontWeight="800"
              fill={done || isCurrent ? NAVY : "#a8a195"} textAnchor="middle">
              {st.title}
            </text>
            {!done && (
              <text x={x} y={y + 51} fontSize="10.5" fontWeight="700" fill="#a8a195" textAnchor="middle">
                {got}/{total} תחנות
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function JourneyPage() {
  const [data, setData] = useState<{ stages: Stage[]; current: number } | null>(null);
  const [name, setName] = useState("");
  const events = useEvents();

  useEffect(() => {
    setData(buildStages());
    try {
      const ob = JSON.parse(localStorage.getItem("onboarding") || "{}");
      setName(ob.firstName || localStorage.getItem("user-name") || "");
    } catch { /* ignore */ }
  }, []);

  if (!data) return <div style={{ minHeight: "100vh", background: "#fbf9f5" }} />;

  const allStops = data.stages.flatMap(s => s.stops);
  const doneCount = allStops.filter(s => s.done).length;

  return (
    <div dir="rtl" className="min-h-screen pb-28" style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}>
      <div className="px-5 pt-10 pb-6" style={{ background: NAVY, color: "#fff" }}>
        <div className="max-w-[620px] mx-auto">
          <h1 className="text-[26px] font-black">
            {name ? `המסע של ${name}` : "המסע שלך"}
          </h1>
          <div className="text-[13.5px] mt-1.5" style={{ opacity: 0.8 }}>
            {doneCount} תחנות כבר מאחוריך · שלב {data.current} מתוך 6
          </div>
          {/* פס התקדמות אחד — הישג לפני רשימה */}
          <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.18)" }}>
            <div className="h-full rounded-full" style={{ width: `${(doneCount / allStops.length) * 100}%`, background: ORANGE, transition: "width .6s" }} />
          </div>
        </div>
      </div>

      <div className="max-w-[620px] md:max-w-[720px] mx-auto px-5 pt-5">
        <Serpentine stages={data.stages} current={data.current} />

        {/* אירוע קרוב — מה שדורש פעולה בזמן, לפני הציר */}
        {!!events.length && (
          <div className="mb-5">
            <div className="text-[12px] font-black mb-2" style={{ color: ORANGE }}>קרוב אליך</div>
            <EventsList events={events} limit={1} />
          </div>
        )}

        {data.stages.map((stage, si) => {
          const stageDone = stage.stops.every(s => s.done);
          const isCurrent = stage.n === data.current;
          const isFuture = stage.n > data.current;
          return (
            <div key={stage.n} id={`stage-${stage.n}`} className="flex gap-3.5" style={{ scrollMarginTop: 16 }}>
              {/* הציר — נקודה וקו, בדיוק כמו במרחב ההמתנה */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-4 h-4 rounded-full mt-1.5"
                  style={{
                    background: stageDone ? GREEN : isCurrent ? ORANGE : "#e3ddd2",
                    boxShadow: isCurrent ? "0 0 0 5px #fff3e2" : "none",
                  }} />
                {si < data.stages.length - 1 && (
                  <div className="w-[2px] flex-1" style={{ background: "#ece7de", marginTop: 4 }} />
                )}
              </div>

              <div className="flex-1 pb-7 min-w-0">
                <div className="text-[12px] font-black" style={{ color: stageDone ? GREEN : isCurrent ? "#b35e00" : "#a8a195" }}>
                  {stageDone ? "הושלם" : isCurrent ? "אתה כאן" : `שלב ${stage.n}`}
                </div>
                <div className="text-[18px] font-black mt-0.5" style={{ color: isFuture ? "#a8a195" : "#1b1f27" }}>
                  {stage.title}
                </div>

                <div className="flex flex-col gap-1.5 mt-2.5">
                  {stage.stops.map(stop => {
                    const inner = (
                      <>
                        <span className="text-[13px] shrink-0" style={{ color: isFuture ? "#c9c4ba" : stop.done ? GREEN : ORANGE }}>
                          {isFuture ? "🔒" : stop.done ? "✓" : "○"}
                        </span>
                        <span className="text-[13.5px] leading-snug" style={{ color: isFuture ? "#a8a195" : stop.done ? "#1b1f27" : "#5c6473" }}>
                          {stop.label}
                        </span>
                        {stop.done && stop.href && !isFuture && (
                          <span className="text-[12px] mr-auto shrink-0" style={{ color: NAVY }}>←</span>
                        )}
                      </>
                    );
                    const cls = "flex items-center gap-2 rounded-xl px-3 py-2.5";
                    const style = {
                      background: "#fff",
                      border: `1px solid ${stop.done ? "rgba(5,150,105,0.22)" : "rgba(0,0,0,0.07)"}`,
                      opacity: isFuture ? 0.6 : 1,
                      textDecoration: "none",
                    };
                    // רק תחנות שכבר עברת בהן נלחצות — הנעילות נשמרות מעצם המבנה
                    return stop.href && (stop.done || isCurrent) && !isFuture ? (
                      <Link key={stop.label} href={stop.href} className={cls} style={style}>{inner}</Link>
                    ) : (
                      <div key={stop.label} className={cls} style={style}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <div className="text-[12px] text-center pb-4" style={{ color: "rgba(0,0,0,0.35)" }}>
          כל מה שעברת נשאר פתוח — אפשר לחזור לכל תחנה מתי שרוצים
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
