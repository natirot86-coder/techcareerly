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
  type Task,
} from "@/lib/candidate";

const FALLBACK_USER = "נועה";

// ─── Stage 1 ──────────────────────────────────────────────────────────────────
function Stage1() {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mb-1">המשימות שלך</div>
      <TaskCard label="הורדת האפליקציה" status="done" />
      <TaskCard label="מילוי שאלון בסיס" status="done" />
      <TaskCard label="המתנה לאישור הרכזת" status="in-progress" />

      {/* Upgraded waiting card */}
      <div
        className="rounded-xl p-4 mt-2 flex flex-col gap-3"
        style={{
          background: "rgba(2,62,138,0.04)",
          border: "1px solid rgba(2,62,138,0.1)",
        }}
      >
        <div>
          <div className="text-[13.5px] font-bold text-navy">הרכזת שלנו בטיפול בבקשתך</div>
          <div className="text-[12.5px] mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
            בדרך כלל מגיבים תוך יום עסקים
          </div>
        </div>
        <a
          href="https://wa.me/972500000000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border rounded-xl px-4 py-[10px] text-[13px] font-bold"
          style={{ borderColor: "rgba(2,62,138,0.2)", color: "#023e8a", background: "#fff" }}
        >
          שלחי הודעת WhatsApp לרכזת
        </a>
      </div>
    </div>
  );
}

// ─── Stage 2 ──────────────────────────────────────────────────────────────────
function Stage2({ onConfirm, tasks }: { onConfirm: () => void; tasks: Task[] }) {
  const meetingTask = tasks.find(t => t.task_key === "intake-meeting");
  const confirmed = meetingTask?.status === "done";

  function handleConfirm() {
    updateTask("intake-meeting", "done", 100);
    onConfirm();
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="bg-white border border-[rgba(2,62,138,0.08)] rounded-xl p-4">
        <div className="text-[12px] font-bold text-[rgba(0,0,0,0.45)] mb-1">המפגש הקרוב שלך</div>
        <div className="text-[15px] font-bold text-navy">מפגש אינטייק עם דנה</div>
        <div className="text-[13px] text-[rgba(0,0,0,0.5)] mt-1">יום ב׳ · 14:00 · פגישה פרונטלית</div>
        <div className="mt-3">
          <Button variant={confirmed ? "outline" : "orange"} onClick={handleConfirm}>
            {confirmed ? "הגעה אושרה ✓" : "אישור הגעה למפגש"}
          </Button>
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
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="bg-[rgba(2,62,138,0.05)] border border-[rgba(2,62,138,0.12)] rounded-xl p-4">
        <div className="text-[12px] font-bold text-[rgba(0,0,0,0.45)] mb-1">התחום שנבחר</div>
        <div className="text-[15px] font-bold text-navy">פיתוח Full Stack</div>
      </div>
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mt-2">המשימות שלך</div>
      <TaskCard label="חקר מוסדות לימוד" status="pending" />
      <TaskCard label="השוואת תוכניות לימוד" status="pending" />
      <TaskCard label="מפגש שלישי עם הרכזת" status="pending" />
    </div>
  );
}

// ─── Stage 5 ──────────────────────────────────────────────────────────────────
function Stage5() {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mb-1">המשימות שלך</div>
      <TaskCard label="בדיקת זכאות למלגה" status="pending" />
      <TaskCard label="הכנת מסמכים פיננסיים" status="pending" />
      <TaskCard label="יצירת קשר עם המוסד" status="pending" />
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
  const pathname = usePathname();

  // קרא שם מ-localStorage (מ-Onboarding) — ציור מיידי לפני שה-DB עונה
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user-name");
      if (saved) setUserName(saved);
    }
  }, []);

  // דרוס עם המצב האמיתי מ-Supabase ברגע שהוא מגיע
  useEffect(() => {
    getCandidate().then((candidate) => {
      if (!candidate) return;
      if (candidate.first_name) setUserName(candidate.first_name);
      setCurrentStage(candidate.current_stage);
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
      case 2: return <Stage2 onConfirm={() => setShowToast(true)} tasks={tasks} />;
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
