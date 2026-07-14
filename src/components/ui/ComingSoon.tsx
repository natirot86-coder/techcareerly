import BottomNav from "./BottomNav";

interface Props {
  title: string;
  subtitle: string;
  icon: string;
}

export default function ComingSoon({ title, subtitle, icon }: Props) {
  return (
    <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
      {/* Header */}
      <div className="bg-navy text-white px-[22px] pt-[26px] pb-[26px]">
        <div
          className="text-[20px] font-bold"
          style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
        >
          {title}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-[84px] gap-5 text-center">
        {/* Icon circle */}
        <div
          className="w-[80px] h-[80px] rounded-full flex items-center justify-center"
          style={{ background: "#023e8a" }}
        >
          <span className="text-[28px] text-white">{icon}</span>
        </div>

        {/* Title */}
        <div
          className="text-[28px] font-bold text-navy"
          style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
        >
          בקרוב
        </div>

        {/* Subtitle */}
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          {subtitle}
        </div>

        {/* Badge */}
        <div
          className="px-4 py-2 rounded-full text-[12px] font-bold"
          style={{
            background: "#f2ede6",
            color: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(2,62,138,0.1)",
          }}
        >
          אנחנו עובדים על זה
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
