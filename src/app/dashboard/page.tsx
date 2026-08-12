"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavyHeader from "@/components/ui/NavyHeader";
import MonogramBadge from "@/components/ui/MonogramBadge";
import TaskCard from "@/components/ui/TaskCard";
import BottomNav from "@/components/ui/BottomNav";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import {
  getCandidate, updateCurrentStage, isAnonymousSession,
  getTasks, updateTask, getSimulationProgress,
  type Task, type Candidate,
} from "@/lib/candidate";

const FALLBACK_USER = "נועה";

// ─── Progress Summary ─────────────────────────────────────────────────────────
function ProgressSummary({ candidate, simCount, currentStage }: {
  candidate: Candidate; simCount: number; currentStage: number;
}) {
  const daysSince = candidate.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(candidate.created_at).getTime()) / 86400000))
    : 0;
  const pct = Math.round(((currentStage - 1) / 5) * 100);

  return (
    <div className="rounded-xl p-4 mb-4"
      style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}>
      <div className="text-[12px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>מה השלמת עד כה</div>
      <div className="flex flex-col gap-[6px] mb-3">
        {[
          { done: daysSince >= 0, label: `הצטרפת לפני ${daysSince === 0 ? "היום" : `${daysSince} ימים`}` },
          { done: !!candidate.onboarding_completed_at, label: "שאלון אישי הושלם" },
          { done: simCount > 0, label: `${simCount} מתוך 6 סימולציות הושלמו` },
          // היה כתוב כאן "אושרת על ידי הרכזת" — והרכזת לא אישרה כלום.
          // השלב עלה כשהמועמד לחץ על כפתור בעצמו. עכשיו זה מה שבאמת קרה.
          { done: currentStage >= 2, label: "קבעת פגישת היכרות" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[12.5px]">
            <span style={{ color: item.done ? "#6fbf8a" : "rgba(0,0,0,0.25)", fontSize: 14 }}>
              {item.done ? "✓" : "○"}
            </span>
            <span style={{ color: item.done ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.38)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="h-[5px] rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "#fb8500" }} />
      </div>
      <div className="text-[10.5px] mt-1.5" style={{ color: "rgba(0,0,0,0.4)" }}>
        שלב {currentStage} מתוך 6 · {pct}% הושלם
      </div>
    </div>
  );
}

// ─── Stage 1 ──────────────────────────────────────────────────────────────────
function Stage1() {
  return (
    <div className="flex flex-col gap-[10px]">
      {/*
        עד עכשיו ישב כאן "המתנה לאישור הרכזת" עם מספר וואטסאפ שלא קיים
        (972500000000) — כלומר המתנה פסיבית לאישור שאין לו איפה לקרות,
        והפעולה היחידה שהוצעה הובילה לשומקום.
        מה שבאמת פותח את ההמשך הוא קביעת הפגישה, וזה מה שמוצע כאן.
      */}
      <Link
        href="/contact?m=1"
        className="block rounded-xl p-4"
        style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.22)" }}
      >
        <div className="text-[13.5px] font-bold text-navy mb-[3px]">הצעד הבא: לקבוע פגישת היכרות</div>
        <div className="text-[12px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.5)" }}>
          שיחה של כ-45 דקות. לא מביאים כלום ואין מה להתכונן — רק מכירים ובונים תוכנית.
        </div>
        <div className="text-[12px] font-bold mt-2" style={{ color: "#fb8500" }}>
          לבחירת מועד ←
        </div>
      </Link>
      <Link href="/waiting" className="text-[12px] font-bold text-center py-2" style={{ color: "#023e8a" }}>
        מה מחכה לי בפגישה?
      </Link>

      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mt-1">המשימות שלך</div>
      <TaskCard label="הורדת האפליקציה" status="done" />
      <TaskCard label="מילוי שאלון בסיס" status="done" />
      <TaskCard label="קביעת פגישת היכרות" status="pending" />
    </div>
  );
}

// ─── Stage 2 ──────────────────────────────────────────────────────────────────
function Stage2({ tasks }: { tasks: Task[] }) {
  return (
    <div className="flex flex-col gap-[10px]">
      {/* מרחב ההמתנה. עד עכשיו ישבו כאן שם רכזת ומועד מומצאים — הוסרו */}
      <Link
        href="/waiting"
        className="block rounded-xl p-4"
        style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.22)" }}
      >
        <div className="text-[13.5px] font-bold text-navy mb-[3px]">הדרך שלך עד הפגישה</div>
        <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          איפה את/ה עומד/ת, טעימה קצרה אחת, ומה מחכה בפגישה
        </div>
        <div className="text-[12px] font-bold mt-2" style={{ color: "#fb8500" }}>
          למרחב ההמתנה ←
        </div>
      </Link>
      {/* הכפתור "אישור הגעה למפגש" הוסר מכאן. הסימון עבר למרחב ההמתנה,
          שם הוא נשאל אחרי שהמועד עבר ובניסוח אנושי ("איך היה?") ולא
          כמשימה בירוקרטית שמופיעה עוד לפני שהפגישה קרתה */}
      <div className="bg-white border border-[rgba(2,62,138,0.08)] rounded-xl p-4">
        <div className="text-[12px] font-bold text-[rgba(0,0,0,0.45)] mb-1">אחרי הפגישה</div>
        <div className="text-[13px] text-[rgba(0,0,0,0.5)] leading-[1.7]">
          כשהמועד יעבור נשאל אותך איך היה, ואז ייפתחו שבעת התחומים של שלב החשיפה.
        </div>
      </div>
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mt-2">המשימות שלך</div>
      {tasks.length > 0 ? (
        tasks.map(t => <TaskCard key={t.task_key} label={t.label} status={t.status} progress={t.progress} />)
      ) : (
        <>
          <TaskCard label="הגעה למפגש הפתיחה" status="pending" />
          <TaskCard label="חתימה על מפת הדרכים האישית" status="pending" />
        </>
      )}
    </div>
  );
}

// ─── Stage 3 ──────────────────────────────────────────────────────────────────
const SIM_DOMAINS = [
  { key: "sim-code",      domain: "code",      label: "קוד" },
  { key: "sim-data",      domain: "data",      label: "דאטה" },
  { key: "sim-cyber",     domain: "cyber",     label: "סייבר" },
  { key: "sim-ai",        domain: "ai",        label: "AI" },
  { key: "sim-ux",        domain: "ux",        label: "UX" },
  { key: "sim-marketing", domain: "marketing", label: "מרקטינג" },
];

function Stage3({ tasks, simDone }: { tasks: Task[]; simDone: Record<string, boolean> }) {
  function statusFor(taskKey: string, domain: string): Task["status"] {
    const t = tasks.find(x => x.task_key === taskKey);
    if (t) return t.status;
    return simDone[domain] ? "done" : "pending";
  }

  const completed = SIM_DOMAINS.filter(s => statusFor(s.key, s.domain) === "done").length;

  return (
    <div className="flex flex-col gap-[10px]">
      <Link
        href="/explore"
        className="block rounded-xl p-4"
        style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.22)" }}
      >
        <div className="text-[13.5px] font-bold text-navy mb-[3px]">טעימות הייטק — 6 תחומים</div>
        <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          {completed > 0 ? `השלמת ${completed} מתוך 6 סימולציות` : "נסה סימולציות קצרות וגלה מה מדליק אותך"}
        </div>
        <div className="text-[12px] font-bold mt-2" style={{ color: "#fb8500" }}>
          {completed < 6 ? "כנס לחקור ←" : "ראה תוצאות ←"}
        </div>
      </Link>
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mt-1">ההתקדמות שלך</div>
      {SIM_DOMAINS.map(s => (
        <TaskCard
          key={s.key}
          label={`השלמת סימולציית ${s.label}`}
          status={statusFor(s.key, s.domain)}
          progress={statusFor(s.key, s.domain) === "done" ? 100 : 0}
        />
      ))}
    </div>
  );
}

// ─── Stage 4 ──────────────────────────────────────────────────────────────────
function Stage4() {
  const [quizDone, setQuizDone] = useState(false);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [pathsDone, setPathsDone] = useState(false);

  useEffect(() => {
    try {
      setQuizDone(!!localStorage.getItem("paths-quiz"));
      setShortlistCount(JSON.parse(localStorage.getItem("paths-shortlist") || "[]").length);
      setPathsDone(!!localStorage.getItem("paths-journey"));
    } catch { /* empty storage */ }
  }, []);

  return (
    <div className="flex flex-col gap-[10px]">
      <Link
        href="/paths"
        className="block rounded-xl p-4"
        style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.22)" }}
      >
        <div className="text-[13.5px] font-bold text-navy mb-[3px]">
          {pathsDone ? "מסלול הלימודים שלך" : "חקר מסלולי לימוד"}
        </div>
        <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          {pathsDone
            ? "השלמת את החקר — הרשימה והשאלות שמורות אצלך"
            : shortlistCount > 0
              ? `${shortlistCount} מוסדות ברשימה שלך`
              : "מה חשוב לך? איזה מסלול מתאים? אילו מוסדות?"}
        </div>
        <div className="text-[12px] font-bold mt-2" style={{ color: "#fb8500" }}>
          {pathsDone ? "לסיכום שלי ←" : shortlistCount > 0 ? "להמשיך מאיפה שעצרת ←" : "קדימה לבחירת מסלול לימודים ←"}
        </div>
      </Link>
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mt-2">המשימות שלך</div>
      <TaskCard label="מיפוי מה חשוב לי במסלול" status={quizDone ? "done" : "pending"} progress={quizDone ? 100 : 0} />
      <TaskCard label="חקר מוסדות ובניית רשימה" status={shortlistCount > 0 ? "done" : "pending"} progress={shortlistCount > 0 ? 100 : 0} />
      <TaskCard label="שאלות לפגישה השלישית" status={pathsDone ? "done" : "pending"} progress={pathsDone ? 100 : 0} />
    </div>
  );
}

// ─── Stage 5 ──────────────────────────────────────────────────────────────────
function Stage5() {
  const [openCount, setOpenCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    try {
      const tasks = JSON.parse(localStorage.getItem("plan-tasks") || "[]") as { status: string }[];
      setOpenCount(tasks.filter(t => t.status === "open").length);
      setDoneCount(tasks.filter(t => t.status === "done").length);
      setDocCount(JSON.parse(localStorage.getItem("plan-docs") || "[]").length);
      setStarted(!!localStorage.getItem("plan-intro-seen"));
    } catch { /* empty storage */ }
  }, []);

  return (
    <div className="flex flex-col gap-[10px]">
      <Link
        href="/plan"
        className="block rounded-xl p-4"
        style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.22)" }}
      >
        <div className="text-[13.5px] font-bold text-navy mb-[3px]">התוכנית שלי</div>
        <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          {started
            ? openCount > 0
              ? `${openCount} משימות פתוחות${doneCount > 0 ? ` · ${doneCount} כבר סגורות` : ""}`
              : "אין משימות פתוחות כרגע"
            : "מלגות, הרשמה, כסף ומגורים — לפי חודשים, פעולה אחת בכל פעם"}
        </div>
        <div className="text-[12px] font-bold mt-2" style={{ color: "#fb8500" }}>
          {started ? "להמשיך מאיפה שעצרת ←" : "לראות את התוכנית ←"}
        </div>
      </Link>
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mt-2">המשימות שלך</div>
      <TaskCard label="לראות את החשבון — כמה זה עולה וכמה המלגות מכסות" status={started ? "done" : "pending"} progress={started ? 100 : 0} />
      <TaskCard label="להגיש למלגות שהחלון שלהן פתוח" status={doneCount > 0 ? "done" : "pending"} progress={doneCount > 0 ? 100 : 0} />
      <TaskCard label="לאסוף את המסמכים שביקשו ממך" status={docCount > 0 ? "done" : "pending"} progress={docCount > 0 ? 100 : 0} />
    </div>
  );
}

// ─── Stage 6 ──────────────────────────────────────────────────────────────────
function Stage6() {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="bg-[#eef8f0] border border-[#6fbf8a] rounded-xl p-4">
        <div className="text-[13px] font-bold text-[#2e7d46]">כמעט שם! נשאר רק צעד אחד</div>
      </div>
      <TaskCard label="אימות רישום סופי" status="pending" />
      <div className="mt-2">
        <Button variant="orange">העלאת אישור רישום</Button>
      </div>
    </div>
  );
}

// ─── Secure account banner (משתמש Anonymous) ──────────────────────────────────
function SecureAccountBanner() {
  return (
    <Link
      href="/login"
      className="block rounded-xl p-3 mb-3"
      style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}
    >
      <div className="text-[12.5px] font-bold text-navy">אבטח את החשבון שלך עם מספר טלפון ←</div>
      <div className="text-[11.5px] mt-[2px]" style={{ color: "rgba(0,0,0,0.5)" }}>
        כדי לא לאבד את ההתקדמות שלך אם תחליף מכשיר או תנקה את הדפדפן
      </div>
    </Link>
  );
}

// ─── Desktop sidebar tabs ─────────────────────────────────────────────────────
const DESKTOP_TABS = [
  { href: "/dashboard", label: "המסע שלי", icon: "⊞" },
  { href: "/explore", label: "חקר תחומים", icon: "⊙" },
  { href: "/chat", label: "AI Co-pilot", icon: "◎" },
  { href: "/squad", label: "קהילה", icon: "◈" },
  { href: "/contact", label: "רכזת", icon: "◉" },
];

// ─── Dev switcher ─────────────────────────────────────────────────────────────
function DevSwitcher({ currentStage, setCurrentStage }: { currentStage: number; setCurrentStage: (s: number) => void }) {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <div className="px-4 py-2 flex gap-1 flex-wrap justify-center items-center">
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <button
          key={s}
          onClick={() => setCurrentStage(s)}
          className="text-[10px] px-2 py-1 rounded border border-navy text-navy"
          style={{
            background: s === currentStage ? "#023e8a" : undefined,
            color: s === currentStage ? "#fff" : undefined,
          }}
        >
          {s}
        </button>
      ))}
      <a
        href="/onboarding?reset=1"
        className="text-[10px] px-2 py-1 rounded border ml-2"
        style={{ borderColor: "#fb8500", color: "#fb8500" }}
      >
        אונבורדינג ↺
      </a>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [currentStage, setCurrentStage] = useState(1);
  const [userName, setUserName] = useState(FALLBACK_USER);
  const [showToast, setShowToast] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [simDone, setSimDone] = useState<Record<string, boolean>>({});
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const pathname = usePathname();

  // קרא שם מ-localStorage (מ-Onboarding) — ציור מיידי לפני שה-DB עונה
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user-name");
      if (saved) setUserName(saved);
    }
  }, []);

  /**
   * השלב נגזר מקביעת הפגישות, ולא מאישור של רכזת.
   *
   * הסיבה: אין לרכזת שום מקום לאשר בו — אין מאנדיי ואין מסך רכזת. עד עכשיו
   * מי שקידם את השלב היה המועמד עצמו בלחיצה על "אישור הגעה", כלומר השער
   * היה פיקציה: הוא לא עצר אף אחד, אבל כן שיקר למי שבאמת המתין.
   *
   * מה שמקדם הוא **פעולה אמיתית שקרתה**: פגישה שנקבעה.
   * לוקחים את המקסימום בין מה שנגזר לבין מה ששמור בסופאבייס, כדי שרכזת
   * שתקדם ידנית בעתיד לא תידרס.
   */
  useEffect(() => {
    const flag = (k: string) => localStorage.getItem(k) === "true";
    const has = (k: string) => !!localStorage.getItem(k);
    // ⚠️ קביעת פגישה איננה השתתפות בה. לכן שלב 2 נגזר מהקביעה, אבל שלב 3
    // ומעלה נגזרים ממה שהמועמד **עשה בפועל** — ולא מהזמנה ביומן.
    const derived =
      has("plan-tasks") || has("plan-intro-seen") ? 5
        : has("paths-quiz") || has("paths-journey") ? 4
          : has("waiting-taste") && flag("meeting-1-attended") ? 3
            : flag("meeting-1-booked") ? 2
              : 1;
    setCurrentStage(s => Math.max(s, derived));

    getCandidate().then((c) => {
      if (!c) return;
      setCandidate(c);
      if (c.first_name) setUserName(c.first_name);
      setCurrentStage(Math.max(c.current_stage, derived));
      if (derived > c.current_stage) updateCurrentStage(derived);
    });
    isAnonymousSession().then(setIsAnonymous);
    // Load sim progress for stage 3
    Promise.all(SIM_DOMAINS.map(s => getSimulationProgress(s.domain))).then(results => {
      const map: Record<string, boolean> = {};
      results.forEach((r, i) => { if (r?.completed) map[SIM_DOMAINS[i].domain] = true; });
      setSimDone(map);
    });
  }, []);

  // Load tasks whenever stage changes
  useEffect(() => {
    getTasks(currentStage).then(setTasks);
  }, [currentStage]);

  function handleSetCurrentStage(stage: number) {
    setCurrentStage(stage);
    updateCurrentStage(stage);
  }

  function renderStage() {
    switch (currentStage) {
      case 1: return <Stage1 />;
      case 2: return <Stage2 tasks={tasks} />;
      case 3: return <Stage3 tasks={tasks} simDone={simDone} />;
      case 4: return <Stage4 />;
      case 5: return <Stage5 />;
      case 6: return <Stage6 />;
      default: return null;
    }
  }

  return (
    <>
      {showToast && (
        <Toast
          message="הגעתך אושרה! נתראה ביום ב׳"
          onDone={() => setShowToast(false)}
        />
      )}

      {/* ====== MOBILE ====== */}
      <div className="md:hidden w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
        <NavyHeader userName={userName} currentStage={currentStage} />
        <div className="flex-1 px-[22px] py-6 pb-[84px]">
          {isAnonymous && <SecureAccountBanner />}
          {candidate && <ProgressSummary candidate={candidate} simCount={Object.values(simDone).filter(Boolean).length} currentStage={currentStage} />}
          {renderStage()}
        </div>
        <DevSwitcher currentStage={currentStage} setCurrentStage={handleSetCurrentStage} />
      </div>

      {/* ====== DESKTOP ====== */}
      <div className="hidden md:flex w-full min-h-screen">
        {/* Sidebar (RTL: first child = right) */}
        <aside className="w-[240px] shrink-0 bg-navy text-white flex flex-col sticky top-0 h-screen overflow-y-auto">
          <div className="px-7 pt-10 pb-6 border-b border-[rgba(255,255,255,0.1)]">
            <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-5">
              techcareerly
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[13px] opacity-60 mb-1">ברוכה הבאה,</div>
                <div
                  className="text-[20px] font-bold"
                  style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
                >
                  {userName}
                </div>
              </div>
              <MonogramBadge initials={userName[0] ?? "נ"} color="orange" size={38} />
            </div>
          </div>

          <nav className="flex-1 py-4">
            {DESKTOP_TABS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 py-[11px] text-[14px] font-medium"
                  style={{
                    paddingRight: "28px",
                    paddingLeft: "28px",
                    borderLeft: active ? "3px solid #fb8500" : "3px solid transparent",
                    background: active ? "rgba(255,255,255,0.1)" : undefined,
                    color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  }}
                >
                  <span className="text-[17px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-7 pb-7 text-[11px] opacity-25">© 2026 טק-קריירה</div>
        </aside>

        {/* Main (RTL: second child = left) */}
        <main className="flex-1 bg-cream overflow-y-auto">
          <div className="max-w-[680px] mx-auto py-10 px-8">
            <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(2,62,138,0.1)] mb-6">
              <NavyHeader userName={userName} currentStage={currentStage} />
            </div>
            <div className="bg-card rounded-2xl px-8 py-6 shadow-[0_2px_8px_rgba(2,62,138,0.06)]">
              {isAnonymous && <SecureAccountBanner />}
              {renderStage()}
            </div>
            <DevSwitcher currentStage={currentStage} setCurrentStage={handleSetCurrentStage} />
          </div>
        </main>
      </div>

      <BottomNav />
    </>
  );
}
