import { ReactNode } from "react";

type Variant = "primary" | "orange" | "outline";

interface Props {
  children: ReactNode;
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

const styles: Record<Variant, string> = {
  primary: "bg-navy text-white",
  orange: "bg-orange text-white",
  outline: "bg-white text-navy border border-[rgba(2,62,138,0.2)]",
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
  fullWidth = true,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${styles[variant]}
        ${fullWidth ? "w-full" : ""}
        text-center py-4 rounded-xl text-[15px] font-bold cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-opacity
      `}
    >
      {children}
    </button>
  );
}
