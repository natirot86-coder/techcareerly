interface Props {
  currentStage: number; // 1-6
}

const STAGES = ["טרום אינטייק", "אינטייק", "חשיפה", "מסלול לימודים", "לוגיסטיקה", "רישום"];

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
      {/* Caption */}
      <div className="text-center mt-2 text-[11.5px] opacity-75">
        שלב {currentStage} מתוך 6 · {STAGES[currentStage - 1]}
      </div>
    </div>
  );
}
