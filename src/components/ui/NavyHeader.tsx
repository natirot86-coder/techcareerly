import MonogramBadge from "./MonogramBadge";
import ProgressDots from "./ProgressDots";

interface Props {
  userName: string;
  currentStage: number;
}

export default function NavyHeader({ userName, currentStage }: Props) {
  return (
    <div className="bg-navy text-white px-[22px] pt-[26px] pb-[30px]">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-[13px] opacity-70">ברוכה הבאה, {userName}</div>
          <div
            className="text-[20px] font-bold mt-1"
            style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900 }}
          >
            המסע שלי
          </div>
        </div>
        <MonogramBadge initials={userName[0] ?? "נ"} color="orange" size={40} />
      </div>
      <div className="mt-5">
        <ProgressDots currentStage={currentStage} />
      </div>
    </div>
  );
}
