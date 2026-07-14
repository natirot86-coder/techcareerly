type TaskStatus = "done" | "pending" | "in-progress";

interface Props {
  label: string;
  status: TaskStatus;
  progress?: number; // 0-100, for stage 3 tasks
}

function CheckIcon() {
  return (
    <div className="w-[22px] h-[22px] rounded-[7px] bg-navy flex items-center justify-center flex-shrink-0">
      <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
        <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function EmptyBox() {
  return (
    <div className="w-[22px] h-[22px] rounded-[7px] border-2 border-[rgba(2,62,138,0.25)] flex-shrink-0" />
  );
}

export default function TaskCard({ label, status, progress }: Props) {
  return (
    <div className="flex items-center gap-3 bg-white border border-[rgba(2,62,138,0.08)] rounded-xl px-4 py-[14px]">
      {status === "done" ? <CheckIcon /> : <EmptyBox />}
      <div className="flex-1">
        <span
          className="text-[13.5px]"
          style={{
            color: status === "done" ? "rgba(0,0,0,0.4)" : "#1c1c1c",
            textDecoration: status === "done" ? "line-through" : "none",
          }}
        >
          {label}
        </span>
        {progress !== undefined && status !== "done" && (
          <div className="mt-2 h-[3px] rounded-full bg-[rgba(2,62,138,0.1)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: progress === 100 ? "#023e8a" : "#fb8500",
              }}
            />
          </div>
        )}
      </div>
      {status === "in-progress" && (
        <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-[#fff6ea] text-[#8a5000] border border-orange flex-shrink-0">
          בתהליך
        </span>
      )}
    </div>
  );
}
