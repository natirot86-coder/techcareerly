"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { getDomainRankings, saveDomainRankings } from "@/lib/candidate";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Domain data ──────────────────────────────────────────────────────────────
const DOMAINS = [
  { id: "code",      badge: "פ",  label: "פיתוח תוכנה",       shortLabel: "פיתוח",  desc: "בונים אפליקציות, אתרים ומערכות",           color: "#3b82f6" },
  { id: "cyber",     badge: "ס",  label: "סייבר",              shortLabel: "סייבר",  desc: "מגנים על מידע ומערכות מפני תקיפות",         color: "#dc2626" },
  { id: "ai",        badge: "AI", label: "AI ובינה מלאכותית",  shortLabel: "AI",     desc: "מלמדים מחשבים לחשוב ולהחליט",              color: "#7c3aed" },
  { id: "ux",        badge: "UX", label: "עיצוב UX/UI",        shortLabel: "עיצוב",  desc: "יוצרים חוויות שמרגישות נכון",               color: "#db2777" },
  { id: "data",      badge: "ד",  label: "דאטה ואנליטיקס",    shortLabel: "דאטה",   desc: "מוצאים תובנות בתוך ים של מידע",             color: "#0d9488" },
  { id: "marketing", badge: "ש",  label: "שיווק דיגיטלי",     shortLabel: "שיווק",  desc: "מחברים מוצרים לאנשים הנכונים",              color: "#f97316" },
];

type Domain = (typeof DOMAINS)[number];

// ─── Journey Map SVG (same style as onboarding) ───────────────────────────────
function DomainJourneyMap({ ranked }: { ranked: Domain[] }) {
  const pts = [
    { x: 340, y: 30 },
    { x: 278, y: 60 },
    { x: 212, y: 30 },
    { x: 146, y: 60 },
    { x: 82,  y: 30 },
    { x: 28,  y: 60 },
  ];

  const pathD = pts
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const mx = Math.round((prev.x + p.x) / 2);
      return `C ${mx} ${prev.y} ${mx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 368 104" className="w-full" fill="none" aria-hidden="true">
      {/* Road border */}
      <path d={pathD} stroke="rgba(2,62,138,0.13)" strokeWidth="14" strokeLinecap="round" />
      {/* Center dashes */}
      <path d={pathD} stroke="rgba(2,62,138,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 8" />

      {pts.map((p, i) => {
        const domain = ranked[i];
        const isFirst = i === 0;
        const pinColor = isFirst ? "#fb8500" : "#023e8a";
        const alpha = isFirst ? 1 : 0.45;

        return (
          <g key={i} style={{ opacity: alpha }}>
            {/* Pin shadow */}
            <ellipse cx={p.x} cy={p.y + 13} rx={6} ry={2.5} fill="rgba(2,62,138,0.1)" />
            {/* Pin head */}
            <circle cx={p.x} cy={p.y - 10} r={12} fill={pinColor} />
            {/* Pin tail */}
            <polygon
              points={`${p.x - 7},${p.y - 2} ${p.x + 7},${p.y - 2} ${p.x},${p.y + 13}`}
              fill={pinColor}
            />
            {/* Rank number */}
            <text
              x={p.x} y={p.y - 10}
              textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize="9" fontWeight="800" fontFamily="sans-serif"
            >
              {i + 1}
            </text>
            {/* Domain short label */}
            <text
              x={p.x} y={p.y + 26}
              textAnchor="middle"
              fill="rgba(2,62,138,0.65)"
              fontSize="8" fontWeight="700" fontFamily="sans-serif"
            >
              {domain.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Phase = "rank" | "path";

export default function ExplorePage() {
  const [ranking, setRanking] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("rank");

  // Restore ranking from localStorage on mount (ציור מיידי)
  useEffect(() => {
    const saved = localStorage.getItem("explore-ranking");
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      setRanking(parsed);
      if (parsed.length === DOMAINS.length) setPhase("path");
    }
  }, []);

  // דרוס עם המצב האמיתי מ-Supabase ברגע שהוא מגיע
  useEffect(() => {
    getDomainRankings().then((saved) => {
      if (saved.length === 0) return;
      setRanking(saved);
      if (saved.length === DOMAINS.length) setPhase("path");
    });
  }, []);

  function toggleRank(id: string) {
    const next = ranking.includes(id)
      ? ranking.filter((r) => r !== id)
      : [...ranking, id];
    setRanking(next);
    localStorage.setItem("explore-ranking", JSON.stringify(next));
    saveDomainRankings(next);
  }

  function getRank(id: string): number | null {
    const idx = ranking.indexOf(id);
    return idx === -1 ? null : idx + 1;
  }

  const allRanked = ranking.length === DOMAINS.length;
  const rankedDomains = ranking.map((id) => DOMAINS.find((d) => d.id === id)!);
  const firstDomain = rankedDomains[0];

  // ── Phase 2: Path view ──────────────────────────────────────────────────────
  if (phase === "path") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {/* Header */}
        <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0">
          <div className="max-w-[900px] mx-auto">
            <button
              type="button"
              onClick={() => { setPhase("rank"); localStorage.removeItem("explore-ranking"); setRanking([]); saveDomainRankings([]); }}
              className="text-[12px] font-bold block mb-5"
              style={{ opacity: 0.6 }}
            >
              ← שנה סדר
            </button>
            <div className="text-[30px] md:text-[36px] leading-tight" style={HEEBO}>המסלול שלך</div>
            <div className="text-[13.5px] mt-[6px]" style={{ opacity: 0.72 }}>
              מתחילים מהתחום הכי מעניין — מתקדמים בסדר
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-[900px] mx-auto w-full px-[22px] md:px-12 pt-6 pb-20 md:grid md:grid-cols-2 md:gap-10 md:items-start">
          {/* Journey map */}
          <div className="pb-2 md:pb-0">
            <DomainJourneyMap ranked={rankedDomains} />
            <div className="text-[11.5px] mt-3 text-center" style={{ color: "rgba(0,0,0,0.38)" }}>
              הסימון הכתום = מתחילים כאן. שאר התחומים ייפתחו בזה אחר זה.
            </div>
          </div>

          {/* First domain highlight + CTA */}
          <div className="pt-5 md:pt-0 flex flex-col gap-4">
            <div className="text-[11.5px] font-bold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.38)" }}>
              מתחילים עם
            </div>
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: `${firstDomain.color}13`, border: `1.5px solid ${firstDomain.color}45` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-[14px] shrink-0"
                style={{ background: firstDomain.color, fontFamily: "'Heebo', sans-serif" }}
              >
                {firstDomain.badge}
              </div>
              <div>
                <div className="text-[16px] text-navy" style={HEEBO}>{firstDomain.label}</div>
                <div className="text-[12px] mt-[2px]" style={{ color: "rgba(0,0,0,0.5)" }}>{firstDomain.desc}</div>
              </div>
            </div>
            <Link
              href={`/explore/${firstDomain.id}`}
              className="block w-full text-center py-[14px] rounded-xl text-white font-bold text-[15px]"
              style={{ background: "#fb8500", fontFamily: "'Heebo', sans-serif" }}
            >
              קדימה — נתחיל!
            </Link>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ── Phase 1: Ranking view ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0">
        <div className="max-w-[900px] mx-auto">
          <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה למסע
          </Link>
          <div className="text-[30px] md:text-[36px] leading-tight" style={HEEBO}>טעימות הייטק</div>
          <div className="text-[13.5px] mt-[6px]" style={{ opacity: 0.72 }}>
            דרג לפי עניין — מה הכי מסקרן אותך?
          </div>
        </div>
      </div>

      {/* Instruction banner */}
      <div className="max-w-[900px] mx-auto w-full px-[22px] md:px-12 pt-5 pb-3">
        <div
          className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
          style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.55)" }}
        >
          לחץ/י לפי הסדר — מה שהכי מסקרן קודם. נבנה לך מסלול שמתחיל משם.
        </div>
      </div>

      {/* Domain cards */}
      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-12 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {DOMAINS.map((domain) => {
            const rank = getRank(domain.id);
            const isRanked = rank !== null;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => toggleRank(domain.id)}
                className="text-right block h-full"
              >
                <div
                  className="rounded-2xl p-4 flex flex-col gap-[10px] min-h-[164px] transition-all duration-150"
                  style={{
                    background: isRanked ? `${domain.color}10` : "#fff",
                    border: isRanked ? `1.5px solid ${domain.color}55` : "1px solid rgba(2,62,138,0.06)",
                    boxShadow: isRanked ? "none" : "0 2px 14px rgba(2,62,138,0.07)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-black text-[13px] shrink-0"
                      style={{ background: domain.color, fontFamily: "'Heebo', sans-serif" }}
                    >
                      {domain.badge}
                    </div>
                    {isRanked && (
                      <div
                        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[11px] font-black"
                        style={{ background: "#fb8500" }}
                      >
                        {rank}
                      </div>
                    )}
                  </div>
                  <div className="text-[14.5px] text-navy leading-tight" style={HEEBO}>{domain.label}</div>
                  <div className="text-[11.5px] leading-[1.5] flex-1" style={{ color: "rgba(0,0,0,0.45)" }}>{domain.desc}</div>
                  <div className="text-[11px] font-bold" style={{ color: isRanked ? domain.color : "rgba(0,0,0,0.22)" }}>
                    {isRanked ? `מקום ${rank} — לחץ לביטול` : "לחץ לדירוג"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 md:bottom-0 inset-x-0 flex justify-center px-4 pb-[72px] md:pb-4 pt-3"
        style={{ background: "linear-gradient(to top, #fbf9f5 75%, transparent)" }}
      >
        <button
          type="button"
          onClick={() => { setPhase("path"); localStorage.setItem("explore-ranking", JSON.stringify(ranking)); }}
          disabled={!allRanked}
          className="w-full max-w-[500px] py-[14px] rounded-xl text-white font-bold text-[15px] transition-all"
          style={{ background: allRanked ? "#023e8a" : "rgba(2,62,138,0.22)", fontFamily: "'Heebo', sans-serif" }}
        >
          {allRanked ? "בנה את המסלול שלי ←" : `עוד ${6 - ranking.length} לדירוג`}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
