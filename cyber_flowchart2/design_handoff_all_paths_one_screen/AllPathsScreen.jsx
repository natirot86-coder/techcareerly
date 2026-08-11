/**
 * AllPathsScreen — "כל הדרכים מכאן": three study paths compared on ONE mobile screen.
 * React + Tailwind, standalone, RTL. All content comes in via props.
 *
 * Track geometry note: station Y positions are authored per path (`y`, in px) so that
 * line LENGTH communicates duration — degree longest, practical engineer next,
 * bootcamp shortest. They are deliberately compressed, NOT a true time scale.
 */

const GREEN = "#059669";       // income is certain from here
const GREEN_SOFT = "#6ee7b7";  // earning is possible from here (optional station)
const GREEN_TEXT = "#0f9f74";
const TRACK_HEIGHT = 300;      // shared, so the three destination cards align
const COL_WIDTH = 110;

export const DEFAULT_PATHS = [
  {
    id: "degree",
    name: "תואר",
    duration: "3-4 שנים",
    color: "#023e8a",
    tint: "#e8eef7",
    recommended: true,
    destination: "מהנדס/ת אבטחה",
    prep: { height: 46, label: "פסיכומטרי · מכינה · בגרויות" }, // dashed: not everyone needs it
    stations: [
      { label: "קבלה", y: 46 },
      { label: "משרת סטודנט", y: 120, optional: true },
      { label: "תואר + ניסיון", y: 214 },
      { label: "השמה", y: 262, income: true },
    ],
  },
  {
    id: "bootcamp",
    name: "הכשרה",
    duration: "6 חודשים",
    color: "#fb8500",
    tint: "#fff1e0",
    destination: "אנליסט/ית SOC",
    stations: [
      { label: "מיון", y: 0 },
      { label: "קבלה", y: 30 },
      { label: "הקורס", y: 62 },
      { label: "השמה", y: 118, income: true },
    ],
  },
  {
    id: "practical",
    name: "הנדסאי",
    duration: "2-3 שנים",
    color: "#64748b",
    tint: "#eef1f4",
    destination: "הנדסאי/ת מערכות ואבטחה",
    stations: [
      { label: "קבלה", y: 0 },
      { label: "תעודת הנדסאי", y: 150 },
      { label: "השמה", y: 190, income: true },
    ],
  },
];

function PathColumn({ path, onSelect }) {
  const stations = path.stations;
  const incomeY = stations.find((s) => s.income)?.y ?? 0;
  const optionalY = stations.find((s) => s.optional)?.y ?? null;
  const lastY = stations[stations.length - 1].y;
  const start = path.prep ? path.prep.height : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(path.id)}
      className="text-right"
      style={{ width: COL_WIDTH, background: "none", border: 0, padding: 0, font: "inherit" }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-[3px]" style={{ background: path.color }} />
        <div className="text-[13px] font-black" style={{ color: path.color }}>{path.name}</div>
      </div>
      <div className="mb-3 text-[10.5px]" style={{ color: "#8a8177" }}>
        {path.duration}{path.recommended ? " · מומלץ" : ""}
      </div>

      <div className="relative" style={{ height: TRACK_HEIGHT }}>
        {path.prep && (
          <>
            <div
              className="absolute"
              style={{ top: 6, right: 14, width: 0, height: path.prep.height,
                       borderRight: `4px dotted ${path.color}`, opacity: 0.5 }}
            />
            <div
              className="absolute leading-snug"
              style={{ top: 0, right: 30, width: 78, fontSize: 9.5, color: "#8a8177" }}
            >
              {path.prep.label}
            </div>
          </>
        )}

        {/* studying */}
        <div className="absolute" style={{ top: start + 6, right: 14, width: 4,
             height: (optionalY ?? incomeY) - start, background: path.color }} />
        {/* earning is possible */}
        {optionalY !== null && (
          <div className="absolute" style={{ top: optionalY + 6, right: 14, width: 4,
               height: incomeY - optionalY, background: GREEN_SOFT }} />
        )}
        {/* earning for certain */}
        <div className="absolute" style={{ top: incomeY + 6, right: 14, width: 4,
             height: Math.max(0, lastY - incomeY), background: GREEN }} />
        {/* already working, beyond the last station */}
        {lastY < TRACK_HEIGHT - 14 && (
          <div className="absolute" style={{ top: lastY + 6, right: 15, width: 2,
               height: TRACK_HEIGHT - 14 - lastY, background: GREEN, opacity: 0.35 }} />
        )}

        {stations.map((s) => {
          const isEnd = s.y === lastY;
          const size = s.income ? 16 : s.optional ? 14 : 11;
          const dotStyle = s.income
            ? { background: GREEN, border: "3px solid #fbf9f5" }
            : s.optional
            ? { background: "#fbf9f5", border: `2.5px dashed ${GREEN}` }
            : { background: "#fbf9f5", border: `3px solid ${path.color}` };
          return (
            <div key={s.label}>
              <div
                className="absolute box-border rounded-full"
                style={{ top: s.y + (s.income ? 3 : s.optional ? 4 : 6), right: 16 - size / 2,
                         width: size, height: size, ...dotStyle }}
              />
              <div
                className="absolute leading-tight"
                style={{ top: s.y, right: 30, width: 78, fontSize: 12.5,
                         fontWeight: s.income || isEnd ? 900 : s.optional ? 600 : 500,
                         color: s.income ? GREEN : s.optional ? GREEN_TEXT : "#1a1a1a" }}
              >
                {s.label}
                {s.income && (
                  <div className="mt-0.5 text-[10.5px] font-bold leading-tight">₪ מכאן שכר</div>
                )}
                {s.optional && (
                  <div className="mt-0.5 text-[10px] font-semibold leading-tight" style={{ color: GREEN_TEXT }}>
                    אפשרי · כבר בשכר
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="box-border rounded-xl px-[11px] py-2.5"
        style={{ background: path.recommended ? path.color : path.tint,
                 border: path.recommended ? "none" : "1px solid #e6e0d6", minHeight: 74 }}
      >
        <div className="text-[9.5px]" style={{ color: path.recommended ? "rgba(255,255,255,.75)" : "#8a8177" }}>
          מגיעים ל
        </div>
        <div className="mt-0.5 text-[13px] font-black leading-tight"
             style={{ color: path.recommended ? "#fff" : "#1a1a1a" }}>
          {path.destination}
        </div>
      </div>
    </button>
  );
}

function LegendRow({ swatch, children }) {
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0">{swatch}</div>
      <div className="text-xs leading-snug" style={{ color: "#5c554c" }}>{children}</div>
    </div>
  );
}

/**
 * @param {string}   title     כותרת המסך
 * @param {string}   subtitle  שורת משנה
 * @param {Array}    paths     המסלולים (ראה DEFAULT_PATHS)
 * @param {Function} onSelect  (pathId) => void — לחיצה על מסלול פותחת מסך פירוט
 */
export default function AllPathsScreen({
  title = "כל הדרכים מכאן",
  subtitle = "שלושה מסלולים, מסך אחד.",
  paths = DEFAULT_PATHS,
  onSelect,
}) {
  return (
    <div
      dir="rtl"
      className="mx-auto box-border w-[390px] overflow-hidden px-4 pb-5 pt-[26px]"
      style={{ minHeight: 844, background: "#f2ede4",
               fontFamily: "Heebo, 'Noto Sans Hebrew', sans-serif" }}
    >
      <h1 className="text-2xl font-black" style={{ color: "#1a1a1a" }}>{title}</h1>
      <p className="mt-1 text-[13px]" style={{ color: "#5c554c" }}>{subtitle}</p>

      <div className="my-[14px] flex items-center gap-2.5 rounded-[10px] px-[11px] py-[7px]"
           style={{ background: "#e6e0d4" }}>
        <span className="rounded px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: "#1a1a1a" }}>
          אתה כאן
        </span>
        <span className="text-[13px] font-semibold" style={{ color: "#1a1a1a" }}>
          היום · אותה נקודת התחלה
        </span>
      </div>

      <div className="flex items-start gap-[14px]">
        {paths.map((p) => (
          <PathColumn key={p.id} path={p} onSelect={onSelect} />
        ))}
      </div>

      <div className="mt-[14px] flex flex-col gap-[7px] pt-3" style={{ borderTop: "1px solid #ddd5c7" }}>
        <LegendRow swatch={<div className="h-3.5 w-3.5 rounded-full" style={{ background: GREEN }} />}>
          ירוק מלא = מכאן מקבלים שכר.
        </LegendRow>
        <LegendRow swatch={<div className="box-border h-3.5 w-3.5 rounded-full"
                                style={{ background: "#fbf9f5", border: `2.5px dashed ${GREEN}` }} />}>
          ירוק בהיר = אפשר להתחיל להרוויח כבר בזמן הלימודים.
        </LegendRow>
        <LegendRow swatch={<div className="w-3.5" style={{ height: 0, borderTop: "3px dotted #8a8177" }} />}>
          מקווקו אפור = שלב שלא כולם צריכים.
        </LegendRow>
      </div>
    </div>
  );
}
