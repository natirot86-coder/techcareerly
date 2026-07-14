type BadgeColor = "navy" | "orange" | "charcoal";

const BG: Record<BadgeColor, string> = {
  navy: "#023e8a",
  orange: "#fb8500",
  charcoal: "#1c1c1c",
};

interface Props {
  initials: string;
  color?: BadgeColor;
  size?: number;
}

export default function MonogramBadge({ initials, color = "navy", size = 44 }: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: BG[color],
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans Hebrew', sans-serif",
        fontSize: size * 0.3,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
