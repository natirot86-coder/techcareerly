import BottomNav from "./BottomNav";

interface Props {
  title: string;
  subtitle: string;
  icon: string;
}

export default function ComingSoon({ title, subtitle, icon }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[26px]">
        <div className="max-w-[900px] mx-auto text-[20px] md:text-[24px] font-bold"
          style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900 }}>
          {title}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 gap-5 text-center">
        <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full flex items-center justify-center"
          style={{ background: "#023e8a" }}>
          <span className="text-[28px] md:text-[36px] text-white">{icon}</span>
        </div>
        <div className="text-[28px] md:text-[36px] font-bold text-navy"
          style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900 }}>
          בקרוב
        </div>
        <div className="text-[14px] md:text-[16px] max-w-[400px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          {subtitle}
        </div>
        <div className="px-4 py-2 rounded-full text-[12px] font-bold"
          style={{ background: "#f2ede6", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(2,62,138,0.1)" }}>
          אנחנו עובדים על זה
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
