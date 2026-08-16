"use client";

/**
 * JourneyStrip — הפס שמראה איפה המשתמש עומד בכל המסע.
 *
 * שלושה דברים בבת אחת, במבט אחד:
 *   מה כבר עשית (הישג) · איפה את/ה עכשיו · מה נשאר (ומעט נשאר)
 *
 * הכניסה מדורגת בכוונה — הנקודות שהושלמו נדלקות אחת אחרי השנייה,
 * כדי שהעין תראה הצטברות של הישגים ולא סתם מצב סטטי.
 */

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

import { JOURNEY } from "@/data/journey";

/**
 * שמות השלבים מגיעים מ-src/data/journey.ts. `short` הוא מה שמופיע מתחת
 * לנקודה, `full` הוא השם המלא שהמועמד רואה — ולא שפת הארגון.
 */
export const JOURNEY_STAGES = JOURNEY.map(s => ({ n: s.n, short: s.short, full: s.candidate }));

export default function JourneyStrip({
  current,
  phaseLabel,
  phaseIndex,
  phaseTotal,
}: {
  /** השלב הנוכחי במסע, 1–6 */
  current: number;
  /** שם התת-שלב הנוכחי בתוך השלב */
  phaseLabel?: string;
  /** מיקום בתוך השלב — למד הדק התחתון */
  phaseIndex?: number;
  phaseTotal?: number;
}) {
  const doneCount = current - 1;
  const leftCount = JOURNEY_STAGES.length - current;
  const micro =
    phaseIndex !== undefined && phaseTotal
      ? Math.min(100, Math.round((phaseIndex / phaseTotal) * 100))
      : null;

  return (
    <div
      className="shrink-0"
      style={{
        background: "linear-gradient(180deg, #fffdf9 0%, #fdf7ee 100%)",
        borderBottom: "1px solid rgba(251,133,0,0.18)",
      }}
    >
      <div className="max-w-[720px] mx-auto px-[22px] pt-3 pb-2.5">
        {/* Achievement line — the point of the whole component */}
        <div className="flex items-baseline justify-between mb-2.5">
          <div className="text-[11.5px] font-black" style={{ color: "#92400e" }}>
            {doneCount > 0 ? `${doneCount} שלבים מאחוריך` : "יוצאים לדרך"}
          </div>
          <div className="text-[10.5px] font-bold" style={{ color: "rgba(0,0,0,0.32)" }}>
            {leftCount > 0 ? `עוד ${leftCount} אחרי זה` : "השלב האחרון"}
          </div>
        </div>

        {/* The track */}
        <div className="flex items-start" style={{ gap: 0 }}>
          {JOURNEY_STAGES.map((s, i) => {
            const done = s.n < current;
            const active = s.n === current;
            const size = active ? 26 : done ? 20 : 16;

            return (
              <div key={s.n} className="contents">
                {/* Node + label */}
                <div className="flex flex-col items-center" style={{ width: active ? 52 : 40 }}>
                  <div className="flex items-center justify-center" style={{ height: 28 }}>
                    <div
                      className={done || active ? "animate-pop-in" : undefined}
                      style={{
                        width: size,
                        height: size,
                        borderRadius: 999,
                        background: done ? ORANGE : active ? NAVY : "transparent",
                        border: done || active ? "none" : "1.5px solid rgba(0,0,0,0.16)",
                        boxShadow: active
                          ? `0 0 0 4px rgba(2,62,138,0.13), 0 2px 8px rgba(2,62,138,0.3)`
                          : done
                            ? "0 1px 4px rgba(251,133,0,0.35)"
                            : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animationDelay: `${i * 70}ms`,
                        opacity: done || active ? 0 : 1,
                        animationFillMode: "forwards",
                      }}
                    >
                      {done && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="M4 12.5l5.5 5.5L20 7" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {active && <div style={{ width: 7, height: 7, borderRadius: 999, background: "#fff" }} />}
                    </div>
                  </div>

                  <div
                    className="text-center leading-tight"
                    style={{
                      fontSize: active ? 10 : 9,
                      marginTop: 3,
                      fontWeight: active ? 900 : 700,
                      color: active ? NAVY : done ? "rgba(146,64,14,0.75)" : "rgba(0,0,0,0.26)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.short}
                  </div>
                </div>

                {/* Connector */}
                {i < JOURNEY_STAGES.length - 1 && (
                  <div
                    className="flex-1"
                    style={{
                      height: 2.5,
                      marginTop: 13,
                      borderRadius: 999,
                      background: s.n < current ? ORANGE : "rgba(0,0,0,0.1)",
                      opacity: s.n < current ? 0.55 : 1,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Where you are right now, in words */}
        {phaseLabel && (
          <div className="mt-2.5 text-[11.5px] leading-tight" style={{ color: "rgba(0,0,0,0.5)" }}>
            <span className="font-black" style={{ color: NAVY }}>
              עכשיו:
            </span>{" "}
            {phaseLabel}
          </div>
        )}
      </div>

      {/* Micro progress inside the current stage */}
      {micro !== null && (
        <div style={{ height: 3, background: "rgba(0,0,0,0.06)" }}>
          <div
            style={{
              height: "100%",
              width: `${micro}%`,
              background: ORANGE,
              transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      )}
    </div>
  );
}
