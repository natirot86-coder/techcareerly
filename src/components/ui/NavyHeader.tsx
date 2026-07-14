import ProgressDots from "./ProgressDots";

interface Props {
  userName: string;
  currentStage: number;
}

export default function NavyHeader({ userName, currentStage }: Props) {
  return (
    <div className="bg-navy text-white px-[22px] pt-[26px] pb-[30px]">
      <div className="text-[13px] opacity-70">ברוכה הבאה, {userName}</div>
      <div
        className="text-[20px] font-bold mt-1"
        style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
      >
        מפת הדרכים שלך
      </div>
      <div className="mt-5">
        <ProgressDots currentStage={currentStage} />
      </div>
    </div>
  );
}
