/**
 * CyberLinesSign — מסך "כל הדרכים מכאן" בשפה של שלט רציף.
 * עצמאי: React + Tailwind בלבד, בלי תלויות. RTL, רוחב מובייל.
 * כל התוכן מגיע ב-props כדי שאפשר יהיה להחליף תחום ומסלולים.
 */

const GREEN = "#059669";
const STEP = 46; // מרווח אחיד בין תחנות (סכמטי, לא בקנה מידה)

export const DEFAULT_LINES = [
  {
    id: "degree",
    badge: "קו 1",
    name: "תואר אקדמי",
    duration: "3-4 שנים",
    color: "#023e8a",
    tint: "#e8eef7",
    destination: "מהנדס/ת אבטחה",
    recommended: true,
    note: "נפתח למחקר, ארכיטקטורה ותפקידים בכירים",
    stations: [
      { label: "קבלה", transfer: { text: "מכינה", mode: "in" } },
      { label: "שנה א׳" },
      { label: "משרת סטודנט", income: true },
      { label: "תואר + ניסיון", terminal: true },
    ],
  },
  {
    id: "bootcamp",
    badge: "קו 2",
    name: "הכשרה טכנולוגית",
    duration: "6 חודשים",
    color: "#fb8500",
    tint: "#fff1e0",
    destination: "אנליסט/ית SOC",
    note: "כניסה מצוינת. להתקדם למחקר צריך להמשיך ללמוד",
    stations: [
      { label: "מיון" },
      { label: "הקורס" },
      { label: "הסמכות" },
      {
        label: "השמה",
        income: true,
        terminal: true,
        transfer: { text: "אפשר לחזור לתואר", mode: "out" },
      },
    ],
  },
  {
    id: "practical",
    badge: "קו 3",
    name: "מה״ט / הנדסאי",
    duration: "2-3 שנים",
    color: "#64748b",
    tint: "#eef1f4",
    destination: "הנדסאי/ת מערכות ואבטחה",
    note: "חזק בגופים ביטחוניים וממשלתיים",
    stations: [
      { label: "קבלה" },
      { label: "לימודי ערב" },
      { label: "תעודת הנדסאי" },
      {
        label: "השמה",
        income: true,
        terminal: true,
        transfer: { text: "מעבר חלקי לתואר", mode: "weak" },
      },
    ],
  },
];

function Transfer({ y, transfer, color }) {
  const weak = transfer.mode === "weak";
  return (
    <>
      <div
        className="absolute"
        style={{
          top: y + 5,
          right: 88,
          width: 12,
          height: 0,
          borderTop: weak
            ? "2px dashed #b9b3a8"
            : `2px solid ${transfer.mode === "out" ? color : "#8a8177"}`,
        }}
      />
      <div
        className="absolute text-left leading-tight"
        style={{
          top: y - 3,
          right: 0,
          width: 80,
          fontSize: 11,
          color: weak ? "#a09889" : "#5c554c",
        }}
      >
        {transfer.text}
      </div>
    </>
  );
}

function Sign({ line, heroStyle }) {
  const ys = [0, ...line.stations.map((_, i) => (i + 1) * STEP)];
  const lastY = ys[ys.length - 1];
  const incomeIndex = line.stations.findIndex((s) => s.income);
  const incomeY = incomeIndex >= 0 ? ys[incomeIndex + 1] + 6 : null;
  const greenFrom = heroStyle === "line" ? incomeY : null;
  const lastHasTransfer = Boolean(line.stations[line.stations.length - 1]?.transfer);
  const trackHeight = lastY + (lastHasTransfer ? 74 : 40);

  return (
    <div
      className="rounded-[18px] px-[18px] pt-4 pb-3.5"
      style={{
        background: "#fbf9f5",
        border: line.recommended
          ? `1.5px solid ${line.color}`
          : "1px solid #e6e0d6",
        boxShadow: "0 6px 20px rgba(2,62,138,.07)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-4 w-4 rounded"
          style={{ background: line.color }}
        />
        <div className="text-[13px] font-bold" style={{ color: line.color }}>
          {line.badge} · {line.name}
        </div>
        <div className="me-auto text-xs" style={{ color: "#8a8177" }}>
          {line.duration}
        </div>
        {line.recommended && (
          <div
            className="rounded-[10px] px-[7px] py-0.5 text-[10.5px] font-bold"
            style={{ color: line.color, background: line.tint }}
          >
            מומלץ
          </div>
        )}
      </div>

      <div className="mt-2.5 text-[21px] font-black leading-tight text-[#1a1a1a]">
        <span className="text-[15px] font-semibold" style={{ color: "#8a8177" }}>
          מגיעים ל
        </span>
        <br />
        {line.destination}
      </div>

      <div className="relative mt-4" style={{ height: trackHeight }}>
        <div
          className="absolute"
          style={{
            top: 6,
            right: 100,
            width: 4,
            height: (greenFrom || lastY + 6) - 6,
            background: line.color,
          }}
        />
        {greenFrom && (
          <div
            className="absolute"
            style={{
              top: greenFrom,
              right: 100,
              width: 4,
              height: lastY + 6 - greenFrom,
              background: GREEN,
            }}
          />
        )}

        <div
          className="absolute box-border rounded-full"
          style={{
            top: 0,
            right: 96,
            width: 12,
            height: 12,
            background: "#fbf9f5",
            border: `3px solid ${line.color}`,
          }}
        />
        <div className="absolute" style={{ top: -3, right: 124 }}>
          <span
            className="rounded px-[9px] py-[3px] text-xs font-bold text-white"
            style={{ background: line.color }}
          >
            אתה כאן
          </span>
        </div>

        {line.stations.map((s, i) => {
          const y = ys[i + 1];
          const size = s.income ? (heroStyle === "line" ? 16 : 20) : 12;
          const nameColor =
            s.income && heroStyle === "line" ? GREEN : "#1a1a1a";
          const transferY = s.income ? y + 30 : y;
          return (
            <div key={s.label}>
              <div
                className="absolute box-border rounded-full"
                style={{
                  top: y - (size - 12) / 2,
                  right: 102 - size / 2,
                  width: size,
                  height: size,
                  background: s.income ? GREEN : "#fbf9f5",
                  border: `3px solid ${s.income ? "#fbf9f5" : line.color}`,
                }}
              />
              <div
                className="absolute leading-tight"
                style={{
                  top: y - 5,
                  right: 124,
                  width: 206,
                  fontSize: 17,
                  fontWeight: s.terminal || s.income ? 900 : 500,
                  color: nameColor,
                }}
              >
                {s.label}
              </div>

              {s.income && heroStyle === "dot" && (
                <div
                  className="absolute text-left font-bold leading-tight"
                  style={{ top: y - 11, right: 0, width: 88, fontSize: 11.5, color: GREEN }}
                >
                  מכאן מתחילים להרוויח
                </div>
              )}
              {s.income && heroStyle === "line" && (
                <div
                  className="absolute text-left font-bold leading-tight"
                  style={{ top: y - 4, right: 0, width: 88, fontSize: 11.5, color: GREEN }}
                >
                  מכאן מרוויחים
                </div>
              )}
              {s.income && heroStyle === "chip" && (
                <>
                  <div
                    className="absolute"
                    style={{ top: y + 4, right: 88, width: 12, height: 2, background: GREEN }}
                  />
                  <div
                    className="absolute rounded px-2 py-[3px] text-[11.5px] font-bold text-white"
                    style={{ top: y - 4, right: 8, background: GREEN }}
                  >
                    ₪ שכר
                  </div>
                </>
              )}

              {s.transfer && (
                <Transfer y={transferY} transfer={s.transfer} color={line.color} />
              )}
            </div>
          );
        })}
      </div>

      <div
        className="pt-[11px] text-[13px] leading-relaxed"
        style={{ borderTop: "1px solid #ece6dc", color: "#5c554c" }}
      >
        {line.note}
      </div>
    </div>
  );
}

/**
 * @param {string}  title      כותרת המסך
 * @param {Array}   lines      מסלולים (ראה DEFAULT_LINES)
 * @param {string}  heroStyle  סימון תחנת ההכנסה: "dot" | "line" | "chip"
 */
export default function CyberLinesSign({
  title = "כל הדרכים מכאן",
  lines = DEFAULT_LINES,
  heroStyle = "dot",
}) {
  return (
    <div
      dir="rtl"
      className="mx-auto w-[390px] px-[18px] pb-6 pt-6"
      style={{ background: "#f2ede4", fontFamily: "Heebo, 'Noto Sans Hebrew', sans-serif" }}
    >
      <h1 className="px-0.5 pb-[18px] text-[26px] font-black text-[#1a1a1a]">
        {title}
      </h1>
      <div className="flex flex-col gap-4">
        {lines.map((line) => (
          <Sign key={line.id} line={line} heroStyle={heroStyle} />
        ))}
      </div>
    </div>
  );
}
