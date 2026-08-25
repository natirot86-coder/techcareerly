"use client";

/**
 * AllPaths — "כל הדרכים מכאן", וריאנט 7a.
 * שלושה מסלולים זה לצד זה, כולם יוצאים מאותה נקודה — היום.
 *
 * שלושת הרעיונות שהעיצוב קיים כדי לשרת:
 *  1. רגע ההכנסה הוא הגיבור, לא סוף המסלול
 *  2. שלושת המסלולים לא מסתיימים באותו מקום — כרטיסי היעד שונים במשקל
 *  3. אורך הקו מייצג משך, דחוס בכוונה ולא בקנה מידה אמיתי
 */

import { type Domain, type Track as DataTrack } from "@/data/institutions";
// prep הוא אפיק הכנה, לא מסילת לימודים — שלוש המסילות בלבד כאן
type Track = Exclude<DataTrack, "prep">;
import { routesFor, stationYs, NO_ROUTE_NOTE, DEEPEN_NOTE } from "@/data/routes";

const GREEN = "#059669";
const GREEN_LIGHT = "#6ee7b7";
const GREEN_OPT_TEXT = "#0f9f74";
/**
 * גובה המסילה נגזר מהתוכן ולא קבוע — תווית של שתי מילים נשברת לשתי שורות
 * ותת-התווית ("₪ מכאן שכר") גלשה מתחת לכרטיס היעד.
 * הוא משותף לכל העמודות בתחום, אחרת כרטיסי היעד לא יתיישרו.
 */
const TRACK_MIN = 300;
const LABEL_ROOM = 62;

const STYLE: Record<Track, { name: string; color: string; tint: string }> = {
  degree: { name: "תואר", color: "#023e8a", tint: "#e8eef7" },
  bootcamp: { name: "הכשרה", color: "#fb8500", tint: "#fff1e0" },
  mahat: { name: "הנדסאי", color: "#64748b", tint: "#eef1f4" },
};

export default function AllPaths({
  domain,
  onSelect,
}: {
  domain: Domain;
  onSelect: (track: Track) => void;
}) {
  const routes = routesFor(domain);
  const missing = (["degree", "bootcamp", "mahat"] as Track[])
    .filter(t => !routes.some(r => r.track === t) && NO_ROUTE_NOTE[domain]?.[t]);
  const hasNonDegree = routes.some(r => r.track !== "degree");
  /**
   * ברוב התחומים אין שלושה מסלולים. מותחים את הקיימים במקום להשאיר מקום ריק:
   * מקום ריק נקרא כתקלה, וסימון "חסר כאן" מתקשר רק עם מי שכבר יודע
   * שאמורים להיות שלושה. עם תקרה — עמודה בודדת רחבה מדי שוברת את
   * הדקדוק של הקו האנכי. ההיעדר מוסבר במילים מתחת, שם זה עובד.
   */
  const colClass =
    routes.length === 1 ? "max-w-[210px] md:max-w-[300px]"
    : routes.length === 2 ? "max-w-[172px] md:max-w-[260px]"
    : "max-w-[130px] md:max-w-[196px]";
  const trackH = Math.max(
    TRACK_MIN,
    ...routes.map(r => {
      const ys = stationYs(r);
      return ys[ys.length - 1] + LABEL_ROOM;
    })
  );

  return (
    <div>
      {/* Shared start point */}
      <div
        className="flex items-center gap-[9px] rounded-[10px] px-[11px] py-[7px] mb-4"
        style={{ background: "#e6e0d4" }}
      >
        <span className="rounded px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: "#1a1a1a" }}>
          אתה כאן
        </span>
        <span className="text-[13px] font-semibold" style={{ color: "#1a1a1a" }}>
          היום · אותה נקודת התחלה
        </span>
      </div>

      {/* Columns */}
      <div className="flex items-start justify-center gap-3">
        {routes.map(route => {
          const st = STYLE[route.track];
          const ys = stationYs(route);
          const lastY = ys[ys.length - 1];
          const incomeIdx = route.stations.findIndex(s => s.income);
          const optIdx = route.stations.findIndex(s => s.optional);
          const incomeY = incomeIdx >= 0 ? ys[incomeIdx] : lastY;
          const optY = optIdx >= 0 ? ys[optIdx] : null;
          const start = route.prep ? route.prep.height : 0;
          const solidTo = optY ?? incomeY;

          return (
            <button
              key={route.track}
              onClick={() => onSelect(route.track)}
              className={`text-right flex-1 active:scale-[0.98] transition-transform ${colClass}`}
            >
              {/* Header */}
              <div className="flex items-center gap-1.5">
                <div className="rounded-[3px]" style={{ width: 12, height: 12, background: st.color }} />
                <div className="text-[13px] font-black" style={{ color: st.color }}>{st.name}</div>
              </div>
              <div className="text-[10.5px] mb-3" style={{ color: "#8a8177" }}>
                {route.span}{route.track === "degree" ? " · מומלץ" : ""}
              </div>

              {/* Track */}
              <div className="relative" style={{ height: trackH }}>
                {/* prep — dashed, because not everyone needs it */}
                {route.prep && (
                  <>
                    <div className="absolute" style={{
                      top: 6, right: 14, height: route.prep.height,
                      borderRight: `4px dotted ${st.color}`, opacity: 0.5,
                    }} />
                    <div className="absolute leading-[1.3]" style={{
                      top: 0, right: 30, left: 2, fontSize: 11, color: "#8a8177",
                    }}>
                      {route.prep.label}
                    </div>
                  </>
                )}

                {/* solid → light green (possible) → full green (certain) → faded (already working) */}
                <div className="absolute" style={{
                  top: start + 6, right: 14, width: 4,
                  height: Math.max(0, solidTo - start), background: st.color,
                }} />
                {optY !== null && (
                  <div className="absolute" style={{
                    top: optY + 6, right: 14, width: 4,
                    height: Math.max(0, incomeY - optY), background: GREEN_LIGHT,
                  }} />
                )}
                <div className="absolute" style={{
                  top: incomeY + 6, right: 14, width: 4,
                  height: Math.max(0, lastY - incomeY), background: GREEN,
                }} />
                <div className="absolute" style={{
                  top: lastY + 6, right: 15, width: 2,
                  height: Math.max(0, trackH - 14 - lastY), background: GREEN, opacity: 0.35,
                }} />

                {route.stations.map((s, i) => {
                  const y = ys[i];
                  const size = s.income ? 16 : s.optional ? 14 : 11;
                  const right = s.income ? 8 : s.optional ? 9 : 10.5;
                  const top = y + (s.income ? 3 : s.optional ? 4 : 6);
                  return (
                    <div key={s.label}>
                      <div className="absolute box-border rounded-full" style={{
                        top, right, width: size, height: size,
                        background: s.income ? GREEN : "#fbf9f5",
                        border: s.income
                          ? "3px solid #fbf9f5"
                          : s.optional
                            ? `2.5px dashed ${GREEN}`
                            : `3px solid ${st.color}`,
                      }} />
                      <div className="absolute leading-[1.25]" style={{
                        top: y, right: 30, left: 2, fontSize: 12.5,
                        fontWeight: s.income ? 900 : s.optional ? 600 : 500,
                        color: s.income ? GREEN : s.optional ? GREEN_OPT_TEXT : "#1a1a1a",
                      }}>
                        {s.label}
                        {s.income && <div className="text-[10.5px] font-bold mt-0.5">₪ מכאן שכר</div>}
                        {s.optional && (
                          <div className="text-[10px] font-semibold mt-0.5" style={{ color: GREEN_OPT_TEXT }}>
                            אפשרי · כבר בשכר
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Destination — recommended one carries more visual weight on purpose */}
              <div className="rounded-[12px] px-[11px] py-2.5" style={{
                minHeight: 74,
                background: route.track === "degree" ? st.color : st.tint,
                border: route.track === "degree" ? "none" : "1px solid #e6e0d6",
              }}>
                <div className="text-[9.5px]" style={{ color: route.track === "degree" ? "rgba(255,255,255,.75)" : "#8a8177" }}>
                  מגיעים ל
                </div>
                <div className="text-[13px] font-black leading-[1.25] mt-0.5" style={{
                  color: route.track === "degree" ? "#fff" : "#1a1a1a",
                }}>
                  {route.destination}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Deepening — reframed: not "going back", moving forward */}
      {hasNonDegree && (
        <div className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}>
          <span className="text-[14px] shrink-0" style={{ color: "#023e8a" }}>↗</span>
          <div className="text-[12px] leading-[1.65]" style={{ color: "#5c554c" }}>{DEEPEN_NOTE}</div>
        </div>
      )}

      {/* Legend — three visual codes need saying out loud */}
      <div className="mt-3.5 pt-3 flex flex-col gap-[7px]" style={{ borderTop: "1px solid #ddd5c7" }}>
        {[
          { mark: <div style={{ width: 14, height: 14, borderRadius: 999, background: GREEN }} />, text: "ירוק מלא = מכאן מקבלים שכר." },
          { mark: <div style={{ width: 14, height: 14, borderRadius: 999, background: "#fbf9f5", border: `2.5px dashed ${GREEN}` }} />, text: "ירוק בהיר = אפשר להתחיל להרוויח כבר בזמן הלימודים." },
          { mark: <div style={{ width: 14, height: 0, borderTop: "3px dotted #8a8177" }} />, text: "מקווקו אפור = שלב שלא כולם צריכים." },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="shrink-0 flex items-center justify-center" style={{ width: 16 }}>{l.mark}</div>
            <div className="text-[12px]" style={{ color: "#5c554c" }}>{l.text}</div>
          </div>
        ))}
      </div>

      {/* Absence is information */}
      {missing.map(t => (
        <div key={t} className="mt-3 rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: "rgba(0,0,0,0.028)", border: "1px dashed #ded8ce" }}>
          <span className="text-[12px] shrink-0 mt-0.5" style={{ opacity: 0.35 }}>✕</span>
          <div>
            <div className="text-[12.5px] font-bold" style={{ color: "#8a8177" }}>{STYLE[t].name} — לא בתחום הזה</div>
            <div className="text-[11.5px] leading-[1.55] mt-0.5" style={{ color: "#a09889" }}>{NO_ROUTE_NOTE[domain]?.[t]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
