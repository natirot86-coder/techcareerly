/**
 * /how-it-works — "מה מחכה לך" (נתי, 23.11).
 *
 * מפה של המסע ברמה גבוהה: לכל שלב — מה קורה באפליקציה, ומה עם הרכז/ת.
 * הרכז/ת פותח/ת אותה בפגישה הראשונה ושולח/ת קישור בסיכום.
 *
 * ⚠️ **נפתח בלי הרשמה ולא כותב כלום** — לא סשן, לא localStorage, לא אירוע.
 * לכן הוא ב-SKIP של ResumeTracker, ואין כאן BottomNav (שמניח משתתף/ת).
 * רכז/ת שפותח/ת אותו בזום לא הופך/ת למשתתף/ת.
 *
 * הכל נגזר מ-journey.ts: השמות, הסדר, הפגישות והתיאורים. ?cohort=alumni
 * מציג את מסע הבוגרים (בלי טעימות, שתי פגישות) — בלי לשמור דבר.
 */
import Link from "next/link";
import { journeyFor, isCohort, MEETING_NAMES, meetingLabelFor, STAGE_OVERVIEW } from "@/data/journey";

export const metadata = { title: "מה מחכה לך · Techcareerly" };

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 } as const;

export default async function HowItWorks({ searchParams }: { searchParams: Promise<{ cohort?: string }> }) {
  const q = await searchParams;
  const cohort = isCohort(q.cohort) ? q.cohort : "main";
  const stages = journeyFor(cohort);
  const meetingOf = (closes: string | null) => {
    const hit = (Object.entries(MEETING_NAMES) as [string, string][]).find(([, name]) => name === closes);
    return hit ? meetingLabelFor(cohort, Number(hit[0]) as 1 | 2 | 3) : null;
  };
  const meetings = stages.filter(s => s.closes).length;

  return (
    <div className="min-h-screen w-full" style={{ background: "#fbf9f5" }}>
      <div className="text-white px-[22px] pt-8 pb-9" style={{ background: NAVY }}>
        <div className="max-w-[720px] mx-auto">
          <div className="text-[12.5px] font-bold mb-2" style={{ color: ORANGE }}>אינטק · טק-קריירה</div>
          <h1 className="text-[32px] leading-tight m-0" style={HEEBO}>מה מחכה לך</h1>
          <p className="text-[15px] leading-[1.7] mt-2 mb-0" style={{ opacity: 0.85 }}>
            הדרך מהשיחה הראשונה ועד שנרשמים ללימודים: {stages.length} שלבים ו-{meetings} פגישות.
            בין פגישה לפגישה עושים משהו באפליקציה, ובפגישה מחליטים עליו יחד.
          </p>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-[18px] pt-6 pb-16">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.6)" }}>
          <span><b style={{ color: NAVY }}>📱 באפליקציה</b> · מה עושים בזמן שלכם</span>
          <span><b style={{ color: "#b45309" }}>🤝 עם הרכז/ת</b> · שיחות ופגישות</span>
        </div>

        <ol className="list-none m-0 p-0 flex flex-col">
          {stages.map((s, i) => {
            const o = STAGE_OVERVIEW[s.id];
            const m = meetingOf(s.closes);
            const last = i === stages.length - 1;
            return (
              <li key={s.id} className="grid gap-x-3.5" style={{ gridTemplateColumns: "34px minmax(0,1fr)" }}>
                <div className="flex flex-col items-center">
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[15px] shrink-0"
                    style={{ background: NAVY, ...HEEBO }}>{s.n}</div>
                  {!last && <div className="flex-1 w-[2px] my-1" style={{ background: "rgba(2,62,138,0.18)" }} />}
                </div>
                <div className={last ? "pb-2" : "pb-6"}>
                  <h2 className="text-[19px] leading-[34px] m-0" style={{ ...HEEBO, color: NAVY }}>{s.candidate}</h2>
                  {o && (
                    <div className="flex flex-col gap-2 mt-1.5">
                      <div className="rounded-xl px-3.5 py-2.5 text-[14.5px] leading-[1.65]"
                        style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)" }}>
                        <span className="font-bold" style={{ color: NAVY }}>📱 </span>
                        {cohort === "alumni" && o.alumniApp ? o.alumniApp : o.app}
                      </div>
                      <div className="rounded-xl px-3.5 py-2.5 text-[14.5px] leading-[1.65]"
                        style={m
                          ? { background: "rgba(251,133,0,0.09)", border: "1.5px solid rgba(251,133,0,0.4)" }
                          : { background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                        {m && <span className="inline-block text-[11.5px] font-black px-2 py-0.5 rounded-full ml-2 text-white"
                          style={{ background: ORANGE }}>פגישה {m}</span>}
                        <span className="font-bold" style={{ color: "#b45309" }}>🤝 </span>{o.people}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl px-4 py-4 mt-4 text-[14.5px] leading-[1.75]"
          style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.7)" }}>
          <div className="text-[15px] mb-1.5" style={{ ...HEEBO, color: NAVY }}>לאורך כל הדרך</div>
          <ul className="m-0 pr-5 flex flex-col gap-1">
            <li>הרכז/ת זמין/ה גם בוואטסאפ. לא צריך לחכות לפגישה כדי לשאול</li>
            <li>הפגישות בזום או פנים אל פנים. <b>לפגישות עדיף להגיע עם מחשב</b>, ולאפליקציה עצמה מה שנוח</li>
            <li>מדי פעם יש אירועים ותכנים למשתתפי התוכנית, והם מופיעים באפליקציה</li>
          </ul>
        </div>

        <Link href="/" className="block text-center mt-6 py-3.5 rounded-2xl text-white text-[15px]"
          style={{ background: ORANGE, ...HEEBO }}>
          לאפליקציה ←
        </Link>
      </div>
    </div>
  );
}
