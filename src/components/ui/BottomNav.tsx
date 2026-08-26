"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { JOURNEY } from "@/data/journey";

/**
 * מגירת המסע (נתי 25.8) — טאב "המסע" פותח מגירת שלבים במקום לנווט לדשבורד:
 * שישה שלבים, שהושלם נפתח לתחנות שכבר עבר (חזרה-לאחור שמכבדת את הנעילות
 * מעצם המבנה), הנוכחי מוביל לפעולה הבאה, והעתידי נעול עם מנעול נראה.
 * גזירת השלב זהה לדשבורד — ממה שקרה, לא ממה שהוצהר.
 */
export function deriveStage(): number {
  const flag = (k: string) => localStorage.getItem(k) === "true";
  const has = (k: string) => !!localStorage.getItem(k);
  return has("enrollment-doc-path") ? 6
    : has("plan-tasks") || has("plan-intro-seen") ? 5
    : has("paths-quiz") || has("paths-journey") ? 4
    : has("waiting-taste") && flag("meeting-1-attended") ? 3
    : flag("meeting-1-booked") ? 2
    : 1;
}

/** התחנות שנפתחות בכל שלב שהושלם — רק מקומות שהוא באמת עבר בהם */
const STAGE_LINKS: Record<number, { label: string; href: string }[]> = {
  1: [{ label: "הפרטים שמילאת", href: "/onboarding" }],
  2: [
    { label: "מרחב ההמתנה והמבוא להייטק", href: "/waiting" },
    { label: "הכנה לפגישה", href: "/waiting" },
  ],
  3: [
    { label: "הטעימות — כל 9 התחומים", href: "/explore" },
    { label: "סיכום הטעימות שלך", href: "/explore/results" },
  ],
  4: [{ label: "המסלול, המוסדות והחסמים", href: "/paths" }],
  5: [
    { label: "המשימות שלך", href: "/plan" },
    { label: "החשבון — כמה זה באמת עולה", href: "/plan?view=money" },
    { label: "אישור הלימודים", href: "/enroll" },
  ],
  6: [{ label: "האישור שלך", href: "/enroll" }],
};

/** הפעולה הבאה של השלב הנוכחי — המסך הבא הוא הפעולה הבאה, גם כאן */
export const STAGE_CTA: Record<number, { label: string; href: string }> = {
  1: { label: "להשלמת הפתיחה ←", href: "/onboarding" },
  2: { label: "למרחב ההמתנה ←", href: "/waiting" },
  3: { label: "לטעימות ←", href: "/explore" },
  4: { label: "לבחירת המסלול ←", href: "/paths" },
  5: { label: "לתוכנית שלך ←", href: "/plan" },
  6: { label: "למסך הסטודנט ←", href: "/enroll" },
};

const DOMAIN_DOT: Record<string, string> = {
  code: "#3b82f6", data: "#0d9488", cyber: "#dc2626", networks: "#2563eb",
  qa: "#d97706", hardware: "#0891b2", ai: "#7c3aed", ux: "#db2777", marketing: "#f97316",
};

/** אילו תחומים המשתמש באמת טעם — מדגלי ה-journey של כל תחום */
function tastedDomains(): string[] {
  try {
    return Object.keys(DOMAIN_DOT).filter(d => {
      const j = JSON.parse(localStorage.getItem(`${d}-journey`) ?? "null");
      return j && (j.sim || j.day || j.mystery || j.experience || j.analytics);
    });
  } catch { return []; }
}

/**
 * הסרפנטינה של המשתתף (נתי 26.8): שתי שורות עם קשת מקווקה ביניהן —
 * ובקשת, הסתעפות הטעימות: דוט צבעוני לכל תחום שטעם, מתכנס חזרה לקו.
 * המפה אישית — כל משתמש רואה את הענפים שלו. לחיצה על תחנה שהושלמה
 * פותחת את הקישורים שלה ברשימה שמתחת; דוט מוביל לתחום עצמו.
 */
function DrawerSerpentine({ stageNow, onPick, onClose }: {
  stageNow: number; onPick: (n: number) => void; onClose: () => void;
}) {
  const [tasted, setTasted] = useState<string[]>([]);
  useEffect(() => { setTasted(tastedDomains()); }, []);
  const shown = tasted.slice(0, 5);
  const extra = tasted.length - shown.length;
  // תחנות: שורה עליונה ימין←שמאל, קשת, שורה תחתונה שמאל←ימין
  const POS: [number, number][] = [[295, 50], [177, 50], [60, 50], [60, 165], [177, 165], [295, 165]];
  const dotY = (i: number) => 76 + i * (64 / Math.max(shown.length - 1, 1));
  return (
    <svg viewBox="0 0 340 215" className="w-full mb-2" aria-hidden="false">
      {/* הדרך */}
      <path d="M 295 50 L 60 50" fill="none" stroke="#ddd6c9" strokeWidth="3" strokeDasharray="5 7" />
      <path d="M 60 50 C 14 50, 14 165, 60 165" fill="none" stroke="#ddd6c9" strokeWidth="3" strokeDasharray="5 7" />
      <path d="M 60 165 L 295 165" fill="none" stroke="#ddd6c9" strokeWidth="3" strokeDasharray="5 7" />
      {/* הסתעפות הטעימות — מהתחנה השלישית, מתכנסת לרביעית */}
      {shown.map((d, i) => (
        <g key={d}>
          <path d={`M 60 58 C 38 ${dotY(i) - 8}, 38 ${dotY(i) - 8}, 30 ${dotY(i)}`} fill="none" stroke={DOMAIN_DOT[d]} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.55" />
          <path d={`M 30 ${dotY(i)} C 38 ${dotY(i) + 8}, 44 157, 60 160`} fill="none" stroke={DOMAIN_DOT[d]} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.55" />
          <a href={`/explore/${d}`} onClick={onClose}>
            <circle cx="30" cy={dotY(i)} r="6.5" fill={DOMAIN_DOT[d]} />
          </a>
        </g>
      ))}
      {extra > 0 && <text x="12" y={dotY(shown.length - 1) + 4} fontSize="8.5" fontWeight="800" fill="#8a919d">+{extra}</text>}
      {shown.length > 0 && <text x="30" y="212" fontSize="8.5" fontWeight="700" fill="#a8a195" textAnchor="middle">הטעימות שלך</text>}
      {/* התחנות */}
      {JOURNEY.map((st, i) => {
        const [x, y] = POS[i];
        const done = st.n < stageNow;
        const current = st.n === stageNow;
        return (
          <g key={st.n} onClick={() => done && onPick(st.n)} style={{ cursor: done ? "pointer" : "default" }}>
            {current && <circle cx={x} cy={y} r="21" fill="rgba(251,133,0,0.18)" />}
            <circle cx={x} cy={y} r="15" fill={done ? "#059669" : current ? "#fb8500" : "#eceae4"} />
            <text x={x} y={y + 4.5} fontSize={done ? "13" : "11"} fontWeight="900" fill={done || current ? "#fff" : "#a8a195"} textAnchor="middle">
              {done ? "✓" : current ? st.n : "🔒"}
            </text>
            <text x={x} y={y + 33} fontSize="10" fontWeight="800" fill={done || current ? "#023e8a" : "#a8a195"} textAnchor="middle">
              {st.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function JourneyDrawer({ onClose }: { onClose: () => void }) {
  const [stageNow, setStageNow] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { try { setStageNow(deriveStage()); } catch { /* ignore */ } }, []);
  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(2,20,40,0.45)" }} />
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 inset-x-0 md:top-14 md:bottom-auto md:right-6 md:left-auto md:w-[380px] rounded-t-3xl md:rounded-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto"
        style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-[17px] font-black" style={{ color: "#023e8a" }}>המסע שלך</div>
          <button onClick={onClose} className="text-[14px] font-bold px-2" style={{ color: "rgba(0,0,0,0.4)" }}>✕ סגירה</button>
        </div>
        {/* הסרפנטינה — מפת הדרכים האישית: תחנה שהושלמה נלחצת ופותחת את
            הקישורים שלה ברשימה; דוטים = התחומים שטעם, בצבעיהם (נתי 26.8) */}
        <div className="text-[12px] font-bold mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>
          {stageNow > 1 ? `${stageNow - 1} מתוך 6 כבר מאחוריך` : "מתחילים — 6 שלבים לפניך"}
        </div>
        <DrawerSerpentine stageNow={stageNow} onPick={n => setOpen(open === n ? null : n)} onClose={onClose} />
        <div className="flex flex-col gap-2">
          {JOURNEY.map(s => {
            const done = s.n < stageNow;
            const current = s.n === stageNow;
            const expanded = open === s.n;
            return (
              <div key={s.n} className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", border: current ? "1.5px solid #fb8500" : "1px solid rgba(0,0,0,0.08)", opacity: !done && !current ? 0.55 : 1 }}>
                <button
                  onClick={() => (done ? setOpen(expanded ? null : s.n) : undefined)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right"
                  style={{ cursor: done ? "pointer" : "default" }}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                    style={{ background: done ? "#059669" : current ? "#fb8500" : "rgba(0,0,0,0.08)", color: done || current ? "#fff" : "rgba(0,0,0,0.35)" }}>
                    {done ? "✓" : s.n}
                  </span>
                  <span className="flex-1 text-[14.5px] font-bold" style={{ color: done || current ? "#023e8a" : "rgba(0,0,0,0.45)" }}>
                    {s.candidate}
                    {current && <span className="text-[10.5px] font-black mr-2 px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,133,0,0.12)", color: "#b35e00" }}>את/ה כאן</span>}
                  </span>
                  <span className="text-[13px]" style={{ color: "rgba(0,0,0,0.3)" }}>
                    {done ? (expanded ? "−" : "+") : current ? "" : "🔒"}
                  </span>
                </button>
                {expanded && done && (
                  <div className="px-4 pb-3 flex flex-col gap-1.5">
                    {(STAGE_LINKS[s.n] ?? []).map(l => (
                      <Link key={l.label} href={l.href} onClick={onClose}
                        className="text-[13px] font-bold rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(2,62,138,0.05)", color: "#023e8a" }}>
                        {l.label} ←
                      </Link>
                    ))}
                  </div>
                )}
                {current && (
                  <div className="px-4 pb-3.5">
                    <Link href={STAGE_CTA[s.n].href} onClick={onClose}
                      className="block text-center text-[14px] font-black rounded-xl py-2.5 text-white"
                      style={{ background: "#fb8500" }}>
                      {STAGE_CTA[s.n].label}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-[11.5px] text-center mt-3" style={{ color: "rgba(0,0,0,0.35)" }}>
          שלבים שעברת נפתחים לחזרה · הבאים נפתחים כשמגיעים אליהם
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { href: "/dashboard", label: "המסע", icon: "⊞" },
  { href: "/explore", label: "חקר", icon: "⊙" },
  /* הצ'אט ירד (נתי 25.8): ייעוץ מגיע מהרכזת, לא ממודל בלי שליטה.
     במקומו — שאלות ותשובות סגורות על התהליך, שכל מילה בהן נכתבה ידנית */
  { href: "/faq", label: "שאלות", icon: "?" },
  { href: "/squad", label: "קהילה", icon: "◈" },
  { href: "/contact", label: "רכזת", icon: "◉" },
];

export default function BottomNav() {
  const path = usePathname();
  const [exploreHref, setExploreHref] = useState("/explore");
  const [journeyOpen, setJourneyOpen] = useState(false);

  useEffect(() => {
    // הטאב "חקר" מוביל למקום שבו המשתמש באמת נמצא במסע, ולא לדף קבוע.
    // נבדק מהמאוחר למוקדם.
    //
    // ⚠️ `meeting-booked` הוא דגל היסטורי מהתקופה שבה הייתה במערכת פגישה אחת
    // בלבד — פגישה 2. מאז הוא נדלק גם לפגישה 1, ולכן **אסור להסתמך עליו כאן**:
    // מי שקבע פגישת היכרות היה מגיע לשלב 4 לפני שדיבר עם אדם אחד.
    // הדגלים הממוספרים הם המקור היחיד.
    const ls = (k: string) => localStorage.getItem(k) === "true";
    const inPlan = !!localStorage.getItem("plan-intro-seen") || !!localStorage.getItem("plan-tasks");
    const inPaths = !!localStorage.getItem("paths-quiz") || !!localStorage.getItem("paths-journey");
    const met2 = ls("meeting-2-booked") || ls("meeting-3-booked");
    const met1 = ls("meeting-1-booked");

    if (inPlan) setExploreHref("/plan");
    else if (inPaths || met2) setExploreHref("/paths");
    else if (met1) setExploreHref("/waiting");
  }, []);

  /* התווית מתחלפת עם היעד (נתי 25.8): "חקר" שמוביל לתוכנית שלב 5 היא
     תווית שמשקרת. הטאב תמיד אומר מה באמת מחכה מאחוריו */
  const exploreLabel =
    exploreHref === "/plan" ? "תוכנית"
    : exploreHref === "/paths" ? "מסלול"
    : exploreHref === "/waiting" ? "הכנה"
    : "חקר";

  const hrefFor = (t: (typeof TABS)[number]) => (t.href === "/explore" ? exploreHref : t.href);
  const labelFor = (t: (typeof TABS)[number]) => (t.href === "/explore" ? exploreLabel : t.label);
  const visibleTabs = TABS.filter(t => !(t.href === "/explore" && exploreHref === "/waiting"));
  const isActive = (href: string) =>
    path.startsWith(href) ||
    ((href === "/paths" || href === "/plan" || href === "/waiting") && path.startsWith("/explore"));

  return (
    <>
    {/*
      סרגל עליון לדסקטופ. עד עכשיו הניווט כולו ישב ב-BottomNav שמוסתר ב-md,
      כלומר בדסקטופ לא היה ניווט בכלל — וגם הלוגו נעלם איתו.
    */}
    <header className="hidden md:flex fixed top-0 inset-x-0 z-50 items-center gap-6 px-8 py-2.5 bg-card border-b border-[rgba(2,62,138,0.1)]">
      <Link href="/" className="shrink-0">
        <img src="/logo_tech.png" alt="Techcareerly" className="object-contain" style={{ height: "34px" }} />
      </Link>
      <nav className="flex items-center gap-1">
        {visibleTabs.map(tab => {
          const href = hrefFor(tab);
          const active = isActive(href);
          const style = {
            color: active ? "#023e8a" : "rgba(0,0,0,0.45)",
            background: active ? "rgba(2,62,138,0.07)" : "transparent",
          };
          const cls = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors";
          /* "המסע" פותח את מגירת השלבים — לא מנווט (נתי 25.8) */
          if (tab.href === "/dashboard") {
            return (
              <button key={tab.href} onClick={() => setJourneyOpen(true)} className={cls} style={style}>
                <span className="text-[14px]">{tab.icon}</span>
                {labelFor(tab)}
              </button>
            );
          }
          return (
            <Link key={tab.href} href={href} className={cls} style={style}>
              <span className="text-[14px]">{tab.icon}</span>
              {labelFor(tab)}
            </Link>
          );
        })}
      </nav>
    </header>
    {/* המרווח שמפצה על הסרגל הקבוע עבר ל-globals.css, על ה-body.
        כאן הוא היה חסר תועלת: BottomNav מרונדר בתחתית כל דף, ולכן המרווח
        ישב מתחת לתוכן במקום מעליו והסרגל חתך את ראש המסך */}

    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden flex border-t border-[rgba(2,62,138,0.1)] bg-card" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Logo */}
      <Link href="/" className="flex flex-col items-center justify-center py-2 px-2 shrink-0" style={{ width: "52px" }}>
        <img src="/logo_tech.png" alt="Techcareerly" className="object-contain" style={{ height: "30px" }} />
      </Link>
      {visibleTabs.map((tab) => {
        const href = hrefFor(tab);
        const active = isActive(href);
        const inner = (
          <>
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
              {labelFor(tab)}
            </span>
          </>
        );
        if (tab.href === "/dashboard") {
          return (
            <button key={tab.href} onClick={() => setJourneyOpen(true)} className="flex-1 flex flex-col items-center py-3 gap-[3px]">
              {inner}
            </button>
          );
        }
        return (
          <Link
            key={tab.href}
            href={href}
            className="flex-1 flex flex-col items-center py-3 gap-[3px]"
          >
            {inner}
          </Link>
        );
      })}
    </nav>
    {journeyOpen && <JourneyDrawer onClose={() => setJourneyOpen(false)} />}

    {/* הפס הצדי — רק במסכים רחבים באמת, כדי לא לדחוק את התוכן */}
    <JourneyRail />
    </>
  );
}

function JourneyRail() {
  const [stageNow, setStageNow] = useState(0);
  useEffect(() => { try { setStageNow(deriveStage()); } catch { /* ignore */ } }, []);
  if (!stageNow) return null;
  return (
    <aside
      dir="rtl"
      className="journey-rail hidden min-[1200px]:flex fixed right-0 top-14 bottom-0 w-[225px] flex-col gap-1.5 p-5 overflow-y-auto z-40"
      style={{ background: "linear-gradient(180deg, #023e8a 0%, #03318f 100%)", fontFamily: "'Heebo', sans-serif" }}
    >
      <div className="text-[11px] font-black tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
        המסע שלך · {stageNow > 1 ? `${stageNow - 1} מתוך 6 מאחוריך` : "6 שלבים"}
      </div>
      {JOURNEY.map(st => {
        const done = st.n < stageNow;
        const current = st.n === stageNow;
        return (
          <div key={st.n} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
            style={{ background: current ? "rgba(251,133,0,0.18)" : "transparent", opacity: done || current ? 1 : 0.45 }}>
            <span className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
              style={{ background: done ? "#fff" : current ? "#fb8500" : "rgba(255,255,255,0.25)", color: done ? "#023e8a" : "#fff" }}>
              {done ? "✓" : st.n}
            </span>
            <span className="text-[12.5px] font-bold" style={{ color: "#fff" }}>
              {st.candidate}
            </span>
            {!done && !current && <span className="mr-auto text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>🔒</span>}
          </div>
        );
      })}
      <Link
        href={STAGE_CTA[stageNow]?.href ?? "/"}
        className="mt-3 text-center text-[13px] font-black rounded-xl py-2.5"
        style={{ background: "#fb8500", color: "#fff" }}
      >
        {STAGE_CTA[stageNow]?.label ?? "להמשיך ←"}
      </Link>
      <div className="mt-auto text-[10.5px] leading-[1.6] pt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
        שלבים שעברת נשארים פתוחים — לוחצים על "המסע" למעלה כדי לחזור אליהם
      </div>
    </aside>
  );
}
