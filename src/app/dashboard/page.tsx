"use client";
import { useState } from "react";
import NavyHeader from "@/components/ui/NavyHeader";
import TaskCard from "@/components/ui/TaskCard";
import BottomNav from "@/components/ui/BottomNav";
import Button from "@/components/ui/Button";

// Mock state — ישראל יחבר ל-Supabase
const MOCK_USER = { name: "נועה", stage: 1 };

// --- Stage 1 ---
function Stage1() {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mb-1">המשימות שלך</div>
      <TaskCard label="הורדת האפליקציה" status="done" />
      <TaskCard label="מילוי שאלון בסיס" status="done" />
      <TaskCard label="המתנה לאישור הרכזת" status="in-progress" />
      <div className="border border-dashed border-[rgba(2,62,138,0.2)] rounded-xl p-4 mt-2 text-center text-[13px] text-[rgba(0,0,0,0.5)]">
        הרכזת תיצור איתך קשר בקרוב
      </div>
    </div>
  );
}

// --- Stage 2 ---
function Stage2() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="bg-white border border-[rgba(2,62,138,0.08)] rounded-xl p-4">
        <div className="text-[12px] font-bold text-[rgba(0,0,0,0.45)] mb-1">המפגש הקרוב שלך</div>
        <div className="text-[15px] font-bold text-navy">מפגש אינטייק עם דנה</div>
        <div className="text-[13px] text-[rgba(0,0,0,0.5)] mt-1">יום ב׳ · 14:00 · פגישה פרונטלית</div>
        <div className="mt-3">
          <Button
            variant={confirmed ? "outline" : "orange"}
            onClick={() => setConfirmed(true)}
          >
            {confirmed ? "הגעה אושרה ✓" : "אישור הגעה למפגש"}
          </Button>
        </div>
      </div>
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mt-2">המשימות שלך</div>
      <TaskCard label="הגעה למפגש הפתיחה" status="pending" />
      <TaskCard label="חתימה על מפת הדרכים האישית" status="pending" />
    </div>
  );
}

// --- Stage 3 ---
function Stage3() {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-[13px] font-bold text-[rgba(0,0,0,0.55)] mb-1">המשימות שלך</div>
      <TaskCard label="השלמת סימולציית קוד" status="done" progress={100} />
      <TaskCard label="השלמת סימולציית סייבר" status="pending" progress={60} />
      <TaskCard label="קריאה על תחום הדאטה" status="pending" progress={0} />
    </div>
  );
}

// --- Stage 4 ---
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

// --- Stage 5 ---
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

// --- Stage 6 ---
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

const STAGE_COMPONENTS: Record<number, React.ReactNode> = {
  1: <Stage1 />,
  2: <Stage2 />,
  3: <Stage3 />,
  4: <Stage4 />,
  5: <Stage5 />,
  6: <Stage6 />,
};

export default function DashboardPage() {
  // בפרודקשן: currentStage יגיע מ-Supabase
  const [currentStage, setCurrentStage] = useState(MOCK_USER.stage);

  return (
    <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
      <NavyHeader userName={MOCK_USER.name} currentStage={currentStage} />

      <div className="flex-1 px-[22px] py-6">
        {STAGE_COMPONENTS[currentStage]}
      </div>

      {/* Dev-only stage switcher — להסרה בפרודקשן */}
      {process.env.NODE_ENV === "development" && (
        <div className="px-4 pb-2 flex gap-1 flex-wrap justify-center">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setCurrentStage(s)}
              className="text-[10px] px-2 py-1 rounded border border-navy text-navy"
              style={{ background: s === currentStage ? "#023e8a" : undefined, color: s === currentStage ? "#fff" : undefined }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
