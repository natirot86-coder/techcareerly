"use client";
import { useEffect, useState } from "react";

interface Props {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // fade in
    const t1 = setTimeout(() => setVisible(true), 10);
    // fade out after 2.5s
    const t2 = setTimeout(() => setVisible(false), 2500);
    // unmount after transition
    const t3 = setTimeout(onDone, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed top-4 inset-x-4 z-[60] rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: "#eef8f0",
        border: "1px solid #6fbf8a",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        transition: "opacity 0.4s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#2e7d46" }}
      >
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-[13.5px] font-bold" style={{ color: "#2e7d46" }}>
        {message}
      </span>
    </div>
  );
}
