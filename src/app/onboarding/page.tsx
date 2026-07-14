"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

const AGE_OPTIONS = ["18–22", "23–28", "29–35", "36+"];
const REGION_OPTIONS = ["מרכז", "צפון", "דרום", "ירושלים", "אחר"];
const DOMAINS = ["קוד", "סייבר", "דאטה", "AI", "עיצוב UX", "שיווק דיגיטלי", "רשתות", "QA", "אוטומציות"];

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-[10px] rounded-xl text-[13.5px] font-bold border transition-all"
      style={{
        background: selected ? "#fb8500" : "#fff",
        color: selected ? "#fff" : "#023e8a",
        borderColor: selected ? "#fb8500" : "rgba(2,62,138,0.18)",
      }}
    >
      {label}
    </button>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function OnboardingHeader({ step, onBack }: { step: Step; onBack?: () => void }) {
  return (
    <div className="bg-navy text-white px-[22px] pt-[26px] pb-[22px]">
      <div className="flex items-center gap-3 mb-4">
        {step > 1 && step < 4 && (
          <button
            type="button"
            onClick={onBack}
            className="text-[13px] opacity-70 hover:opacity-100"
          >
            חזרה
          </button>
        )}
        <div className="flex-1" />
        <div className="text-[11px] opacity-50 font-bold uppercase tracking-widest">
          techcareerly
        </div>
      </div>

      {/* 3-step dots (steps 1-3 only) */}
      {step < 4 && (
        <div className="flex items-center gap-0">
          {[1, 2, 3].map((n) => {
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center" style={{ flex: n < 3 ? 1 : "none" }}>
                <div
                  style={{
                    width: active ? 24 : 20,
                    height: active ? 24 : 20,
                    borderRadius: "50%",
                    background: done ? "#fb8500" : active ? "#fff" : "rgba(255,255,255,0.15)",
                    border: active ? "2px solid #fb8500" : "none",
                    flexShrink: 0,
                  }}
                />
                {n < 3 && (
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background: done ? "#fb8500" : "rgba(255,255,255,0.2)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({
  name,
  setName,
  age,
  setAge,
  region,
  setRegion,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  onNext: () => void;
}) {
  const valid = name.trim().length > 0 && age !== "" && region !== "";

  return (
    <div className="flex flex-col gap-6 px-[22px] py-6">
      {/* Title */}
      <div>
        <div
          className="text-[22px] font-bold text-navy mb-1"
          style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
        >
          ספרי לנו עליך
        </div>
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          שלוש שאלות קצרות ואנחנו מתחילים
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>
          איך קוראים לך?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם פרטי"
          className="w-full border rounded-xl px-4 py-3 text-[15px] outline-none bg-white"
          style={{
            borderColor: name ? "rgba(2,62,138,0.35)" : "rgba(2,62,138,0.18)",
            color: "#1c1c1c",
          }}
        />
      </div>

      {/* Age */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>
          כמה שנים יש לך?
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={age === opt} onClick={() => setAge(opt)} />
          ))}
        </div>
      </div>

      {/* Region */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>
          מאיפה את?
        </label>
        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={region === opt} onClick={() => setRegion(opt)} />
          ))}
        </div>
      </div>

      <Button variant="primary" onClick={onNext} disabled={!valid}>
        המשך
      </Button>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({
  name,
  score,
  setScore,
  onNext,
}: {
  name: string;
  score: number;
  setScore: (v: number) => void;
  onNext: () => void;
}) {
  const labels = ["בכלל לא", "", "", "", "קצת", "", "", "", "", "משוגעת על טק"];

  return (
    <div className="flex flex-col gap-6 px-[22px] py-6">
      <div>
        <div
          className="text-[22px] font-bold text-navy mb-1"
          style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
        >
          {name}, כמה את בעניין הטכנולוגיה?
        </div>
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          בכנות — אין תשובה נכונה או לא נכונה
        </div>
      </div>

      {/* Slider */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-[12px]" style={{ color: "rgba(0,0,0,0.45)" }}>
          <span>בכלל לא</span>
          <span>משוגעת על טק</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-orange h-2 rounded-full"
        />
        <div className="text-center">
          <span
            className="text-[28px] font-bold text-navy"
            style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
          >
            {score}
          </span>
          <span className="text-[13px] opacity-50 mr-2">מתוך 10</span>
          {labels[score - 1] && (
            <div className="text-[13px] mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
              {labels[score - 1]}
            </div>
          )}
        </div>
      </div>

      <Button variant="primary" onClick={onNext}>
        המשך
      </Button>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({
  name,
  domain,
  setDomain,
  onNext,
}: {
  name: string;
  domain: string;
  setDomain: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 px-[22px] py-6">
      <div>
        <div
          className="text-[22px] font-bold text-navy mb-1"
          style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
        >
          מה הכי מדליק אותך, {name}?
        </div>
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          בחרי תחום אחד שמושך אותך
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {DOMAINS.map((d) => (
          <Chip key={d} label={d} selected={domain === d} onClick={() => setDomain(d)} />
        ))}
      </div>

      <Button variant="primary" onClick={onNext} disabled={domain === ""}>
        המשך
      </Button>
    </div>
  );
}

// ─── Step 4 — Done ────────────────────────────────────────────────────────────
function Step4({ name, onDone }: { name: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 px-[22px] py-10 text-center">
      {/* Icon */}
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
        style={{ background: "#eef8f0", border: "2px solid #6fbf8a" }}
      >
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
          <path d="M2 12L12 22L30 2" stroke="#2e7d46" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Headline */}
      <div>
        <div
          className="text-[26px] font-bold text-navy"
          style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
        >
          הכל מוכן, {name}!
        </div>
        <div className="text-[14px] mt-2" style={{ color: "rgba(0,0,0,0.5)" }}>
          הרכזת שלנו תיצור איתך קשר תוך 24 שעות
        </div>
      </div>

      {/* What's next */}
      <div
        className="w-full rounded-xl p-5 text-right"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        <div className="text-[13px] font-bold text-navy mb-3">מה קורה עכשיו?</div>
        {[
          "הרכזת מקבלת את הפרופיל שלך ומכינה מסלול מותאם",
          "תקבלי הודעה לתיאום פגישת אינטייק",
          "יחד תחליטו על הצעד הבא",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-[1px]"
              style={{ background: "#023e8a", fontSize: 10, color: "#fff", fontWeight: 700 }}
            >
              {i + 1}
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.65)" }}>
              {item}
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" onClick={onDone}>
        למפת הדרכים שלי
      </Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [score, setScore] = useState(5);
  const [domain, setDomain] = useState("");

  // Skip if already done
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("onboarding-done")) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleDone() {
    localStorage.setItem("onboarding-done", "1");
    localStorage.setItem("user-name", name.trim());
    router.push("/dashboard");
  }

  const header = (
    <OnboardingHeader
      step={step}
      onBack={() => setStep((s) => (s - 1) as Step)}
    />
  );

  const stepContent = (
    <>
      {step === 1 && (
        <Step1
          name={name} setName={setName}
          age={age} setAge={setAge}
          region={region} setRegion={setRegion}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2
          name={name}
          score={score} setScore={setScore}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          name={name}
          domain={domain} setDomain={setDomain}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <Step4 name={name} onDone={handleDone} />
      )}
    </>
  );

  const BRANDING_BULLETS = ["הכרת עולם הטק", "התאמת מסלול אישי", "ליווי עד רישום"];

  return (
    <>
      {/* ====== MOBILE ====== */}
      <div className="md:hidden w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
        {header}
        <div className="flex-1 overflow-y-auto">{stepContent}</div>
      </div>

      {/* ====== DESKTOP ====== */}
      <div className="hidden md:flex w-full min-h-screen">
        {/* Branding panel — ימין (RTL first child) */}
        <aside className="w-[420px] shrink-0 bg-navy text-white flex flex-col justify-center px-14">
          <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-10">
            techcareerly
          </div>
          <div
            className="text-[32px] font-bold leading-tight mb-4"
            style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
          >
            מצאי את המסלול שלך להייטק
          </div>
          <div className="text-[15px] opacity-65 leading-relaxed mb-10">
            תוכנית טק-קריירה מלווה צעירות ממשפחות יוצאי אתיופיה למסלולי לימוד בהייטק.
          </div>
          {BRANDING_BULLETS.map((item) => (
            <div key={item} className="flex items-center gap-3 mb-4">
              <div
                className="w-[8px] h-[8px] rounded-full flex-shrink-0"
                style={{ background: "#fb8500" }}
              />
              <div className="text-[14px] opacity-80">{item}</div>
            </div>
          ))}
        </aside>

        {/* Form panel — שמאל (RTL second child) */}
        <main className="flex-1 bg-cream flex items-center justify-center p-10 overflow-y-auto">
          <div
            className="w-full max-w-[480px] bg-card rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(2,62,138,0.12)" }}
          >
            {header}
            {stepContent}
          </div>
        </main>
      </div>
    </>
  );
}
