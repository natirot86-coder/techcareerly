"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { JOURNEY } from "@/data/journey";
import { useEvents, whenText } from "@/components/ui/EventsList";

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

/** הפעולה הבאה של השלב הנוכחי — המסך הבא הוא הפעולה הבאה, גם כאן */
export const STAGE_CTA: Record<number, { label: string; href: string }> = {
  1: { label: "להשלמת הפתיחה ←", href: "/onboarding" },
  2: { label: "למרחב ההמתנה ←", href: "/waiting" },
  3: { label: "לטעימות ←", href: "/explore" },
  4: { label: "לבחירת המסלול ←", href: "/paths" },
  5: { label: "לתוכנית שלך ←", href: "/plan" },
  6: { label: "למסך הסטודנט ←", href: "/enroll" },
};

const TABS = [
  { href: "/journey", label: "המסע", icon: "⊞" },
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
