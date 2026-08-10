"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "המסע", icon: "⊞" },
  { href: "/explore", label: "חקר", icon: "⊙" },
  { href: "/chat", label: "Co-pilot", icon: "◎" },
  { href: "/squad", label: "קהילה", icon: "◈" },
  { href: "/contact", label: "רכזת", icon: "◉" },
];

export default function BottomNav() {
  const path = usePathname();
  const [exploreHref, setExploreHref] = useState("/explore");

  useEffect(() => {
    const booked = localStorage.getItem("meeting-booked") === "true";
    const inPaths = !!localStorage.getItem("paths-quiz") || !!localStorage.getItem("paths-journey");
    if (booked || inPaths) setExploreHref("/paths");
  }, []);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden flex border-t border-[rgba(2,62,138,0.1)] bg-card" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Logo */}
      <Link href="/dashboard" className="flex flex-col items-center justify-center py-2 px-2 shrink-0" style={{ width: "52px" }}>
        <img src="/logo_tech.png" alt="Techcareerly" className="object-contain" style={{ height: "30px" }} />
      </Link>
      {TABS.map((tab) => {
        const href = tab.href === "/explore" ? exploreHref : tab.href;
        const active = path.startsWith(href) || (href === "/paths" && path.startsWith("/explore"));
        return (
          <Link
            key={tab.href}
            href={href}
            className="flex-1 flex flex-col items-center py-3 gap-[3px]"
          >
            <span
              className="text-[18px]"
              style={{ color: active ? "#023e8a" : "rgba(0,0,0,0.3)" }}
            >
              {tab.icon}
            </span>
            <span
              className="text-[10.5px] font-bold"
              style={{ color: active ? "#023e8a" : "rgba(0,0,0,0.35)" }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
