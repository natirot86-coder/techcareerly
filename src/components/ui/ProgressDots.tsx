interface Props {
  currentStage: number; // 1-6
}

const LABELS = ["הרשמה", "אינטייק", "חשיפה", "מסלול", "מימון", "רישום"];

export default function ProgressDots({ currentStage }: Props) {
  return (
    <div>
      {/* Dots row */}
      <div className="flex items-center">
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const done = n < currentStage;
          const active = n === currentStage;
          const size = active ? 26 : 22;

          return (
            <div key={n} className="flex items-center" style={{ flex: n < 6 ? 1 : "none" }}>
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: done ? "#fb8500" : active ? "#fff" : "rgba(255,255,255,0.15)",
                  border: active ? "2px solid #fb8500" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: active ? "#023e8a" : done ? "#fff" : "rgba(255,255,255,0.5)",
                  flexShrink: 0,
                }}
              >
                {n}
              </div>
              {n < 6 && (
                <div
                  style={{
                    height: 2,
                    flex: 1,
                    background: done ? "#fb8500" : "rgba(255,255,255,0.2)",
                    margin: "0 -1px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex mt-[7px]">
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const active = n === currentStage;
          return (
            <div key={n} style={{ flex: n < 6 ? 1 : "none" }} className="flex justify-start">
              <span
                className="text-[8px] font-bold leading-none"
                style={{ color: "#fff", opacity: active ? 1 : 0.45 }}
              >
                {LABELS[n - 1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
