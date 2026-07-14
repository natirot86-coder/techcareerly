"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;
type Gender = "male" | "female" | "other" | "";

const REGION_OPTIONS = ["מרכז", "צפון", "דרום", "ירושלים", "אחר"];
const DOMAINS = ["קוד", "סייבר", "דאטה", "AI", "עיצוב UX", "שיווק דיגיטלי", "רשתות", "QA", "אוטומציות"];

// ─── Gender text helper ────────────────────────────────────────────────────────
function g(gender: Gender, male: string, female: string, neutral?: string): string {
  if (gender === "male") return male;
  if (gender === "female") return female;
  return neutral ?? `${male}/${female}`;
}

function sliderLabel(score: number, gender: Gender): string {
  if (score <= 2) return "מה זה בכלל...";
  if (score <= 4) return "שמעתי על זה, נראה לי";
  if (score <= 6) return g(gender, "משתמש אבל לא יוצר", "משתמשת אבל לא יוצרת", "משתמש/ת");
  if (score <= 8) return g(gender, "מתעניין רציני", "מתעניינת רצינית", "מתעניין/ת רציני/ת");
  return g(gender, "בלי טק אני לא מתפקד", "בלי טק אני לא מתפקדת", "בלי טק אני לא מתפקד/ת");
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
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

// ─── Text input ───────────────────────────────────────────────────────────────
function TextInput({
  value, onChange, placeholder, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-xl px-4 py-3 text-[15px] outline-none bg-white"
      style={{
        borderColor: value ? "rgba(2,62,138,0.35)" : "rgba(2,62,138,0.18)",
        color: "#1c1c1c",
      }}
    />
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function OnboardingHeader({ step, onBack }: { step: Step; onBack?: () => void }) {
  return (
    <div className="bg-navy text-white px-[22px] pt-[26px] pb-[22px]">
      <div className="flex items-center gap-3 mb-4">
        {step > 1 && step < 4 && (
          <button type="button" onClick={onBack} className="text-[13px] opacity-70 hover:opacity-100">
            חזרה
          </button>
        )}
        <div className="flex-1" />
        <div className="text-[11px] opacity-50 font-bold uppercase tracking-widest">techcareerly</div>
      </div>
      {step < 4 && (
        <div className="flex items-center">
          {[1, 2, 3].map((n) => {
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center" style={{ flex: n < 3 ? 1 : "none" }}>
                <div
                  style={{
                    width: active ? 24 : 20, height: active ? 24 : 20,
                    borderRadius: "50%",
                    background: done ? "#fb8500" : active ? "#fff" : "rgba(255,255,255,0.15)",
                    border: active ? "2px solid #fb8500" : "none",
                    flexShrink: 0,
                  }}
                />
                {n < 3 && <div style={{ height: 2, flex: 1, background: done ? "#fb8500" : "rgba(255,255,255,0.2)" }} />}
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
  firstName, setFirstName, lastName, setLastName,
  gender, setGender, age, setAge, region, setRegion, onNext,
}: {
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  gender: Gender; setGender: (v: Gender) => void;
  age: string; setAge: (v: string) => void;
  region: string; setRegion: (v: string) => void;
  onNext: () => void;
}) {
  const ageNum = parseInt(age, 10);
  const ageValid = !isNaN(ageNum) && ageNum >= 15 && ageNum <= 80;
  const valid = firstName.trim() && lastName.trim() && gender && ageValid && region;

  const title = gender
    ? g(gender, "קודם כל, ספר לנו עליך", "קודם כל, ספרי לנו עליך", "קודם כל, ספר/י לנו עליך")
    : "קודם כל, ספר/י לנו עליך";

  const regionLabel = g(gender, "מאיפה אתה?", "מאיפה את?", "מאיפה את/ה?");

  return (
    <div className="flex flex-col gap-5 px-[22px] py-6">
      <div>
        <div className="text-[22px] font-bold text-navy mb-1" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
          {title}
        </div>
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          שלוש שאלות קצרות ואנחנו בדרך
        </div>
      </div>

      {/* Names */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[12px] font-bold" style={{ color: "rgba(0,0,0,0.5)" }}>שם פרטי</label>
          <TextInput value={firstName} onChange={setFirstName} placeholder="שם פרטי" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[12px] font-bold" style={{ color: "rgba(0,0,0,0.5)" }}>שם משפחה</label>
          <TextInput value={lastName} onChange={setLastName} placeholder="שם משפחה" />
        </div>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>מגדר</label>
        <div className="flex gap-2">
          <Chip label="זכר" selected={gender === "male"} onClick={() => setGender("male")} />
          <Chip label="נקבה" selected={gender === "female"} onClick={() => setGender("female")} />
          <Chip label="אחר" selected={gender === "other"} onClick={() => setGender("other")} />
        </div>
      </div>

      {/* Age */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>גיל</label>
        <TextInput value={age} onChange={setAge} placeholder="לדוגמה: 24" type="number" />
        {age && !ageValid && (
          <div className="text-[12px]" style={{ color: "#c0392b" }}>גיל צריך להיות בין 15 ל-80</div>
        )}
      </div>

      {/* Region */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>{regionLabel}</label>
        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={region === opt} onClick={() => setRegion(opt)} />
          ))}
        </div>
      </div>

      <Button variant="primary" onClick={onNext} disabled={!valid}>המשך</Button>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({ firstName, gender, score, setScore, onNext }: {
  firstName: string; gender: Gender; score: number; setScore: (v: number) => void; onNext: () => void;
}) {
  const title = g(
    gender,
    `${firstName}, כמה אתה בעניין הטכנולוגיה?`,
    `${firstName}, כמה את בעניין הטכנולוגיה?`,
    `${firstName}, כמה את/ה בעניין הטכנולוגיה?`
  );
  const maxLabel = g(gender, "משוגע על טק", "משוגעת על טק", "משוגע/ת על טק");

  return (
    <div className="flex flex-col gap-6 px-[22px] py-6">
      <div>
        <div className="text-[22px] font-bold text-navy mb-1" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
          {title}
        </div>
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          בכנות. כל תשובה בסדר גמור — גם 1.
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-[12px]" style={{ color: "rgba(0,0,0,0.45)" }}>
          <span>בכלל לא</span>
          <span>{maxLabel}</span>
        </div>
        <input
          type="range" min={1} max={10} value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-orange h-2 rounded-full"
        />
        <div className="text-center">
          <span className="text-[28px] font-bold text-navy" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
            {score}
          </span>
          <span className="text-[13px] opacity-50 mr-2">מתוך 10</span>
          <div className="text-[13px] mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
            {sliderLabel(score, gender)}
          </div>
        </div>
      </div>

      <Button variant="primary" onClick={onNext}>המשך</Button>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({ firstName, domain, setDomain, onNext }: {
  firstName: string; domain: string; setDomain: (v: string) => void; onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-[22px] py-6">
      <div>
        <div className="text-[22px] font-bold text-navy mb-1" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
          שאלה אחרונה, {firstName}
        </div>
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          מה הכי מושך אותך? רק אחד — אנחנו יודעים שקשה לבחור.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DOMAINS.map((d) => (
          <Chip key={d} label={d} selected={domain === d} onClick={() => setDomain(d)} />
        ))}
      </div>

      <Button variant="primary" onClick={onNext} disabled={domain === ""}>המשך</Button>
    </div>
  );
}

// ─── Step 4 — Done ────────────────────────────────────────────────────────────
function Step4({ firstName, gender, onDone }: { firstName: string; gender: Gender; onDone: () => void }) {
  const receiveMsg = g(
    gender,
    "תקבל הודעה לתיאום פגישת אינטייק",
    "תקבלי הודעה לתיאום פגישת אינטייק",
    "תקבל/י הודעה לתיאום פגישת אינטייק"
  );

  const bullets = [
    "הרכזת מקבלת את הפרופיל שלך ומכינה מסלול מותאם",
    receiveMsg,
    "ביחד תחליטו על הצעד הבא",
  ];

  return (
    <div className="flex flex-col items-center gap-6 px-[22px] py-10 text-center">
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
        style={{ background: "#eef8f0", border: "2px solid #6fbf8a" }}
      >
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
          <path d="M2 12L12 22L30 2" stroke="#2e7d46" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div>
        <div className="text-[26px] font-bold text-navy" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
          זהו, {firstName}! הכל מוכן.
        </div>
        <div className="text-[14px] mt-2" style={{ color: "rgba(0,0,0,0.5)" }}>
          הרכזת מקבלת הודעה עכשיו ותיצור איתך קשר. בדרך כלל תוך יום, לפעמים מהר יותר.
        </div>
      </div>

      <div
        className="w-full rounded-xl p-5 text-right"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
      >
        <div className="text-[13px] font-bold text-navy mb-3">מה קורה עכשיו?</div>
        {bullets.map((item, i) => (
          <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-[1px]"
              style={{ background: "#023e8a", fontSize: 10, color: "#fff", fontWeight: 700 }}
            >
              {i + 1}
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.65)" }}>{item}</div>
          </div>
        ))}
      </div>

      <Button variant="primary" onClick={onDone}>למפת הדרכים שלי</Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [score, setScore] = useState(5);
  const [domain, setDomain] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("onboarding-done")) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleDone() {
    localStorage.setItem("onboarding-done", "1");
    localStorage.setItem("user-name", firstName.trim());
    router.push("/dashboard");
  }

  const header = (
    <OnboardingHeader step={step} onBack={() => setStep((s) => (s - 1) as Step)} />
  );

  const stepContent = (
    <>
      {step === 1 && (
        <Step1
          firstName={firstName} setFirstName={setFirstName}
          lastName={lastName} setLastName={setLastName}
          gender={gender} setGender={setGender}
          age={age} setAge={setAge}
          region={region} setRegion={setRegion}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2
          firstName={firstName} gender={gender}
          score={score} setScore={setScore}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          firstName={firstName}
          domain={domain} setDomain={setDomain}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <Step4 firstName={firstName} gender={gender} onDone={handleDone} />
      )}
    </>
  );

  const brandingTitle = g(gender, "מצא את המסלול שלך להייטק", "מצאי את המסלול שלך להייטק", "מצא/י את המסלול שלך להייטק");
  const brandingDesc = g(
    gender,
    "תוכנית טק-קריירה מלווה צעירים ממשפחות יוצאי אתיופיה למסלולי לימוד בהייטק.",
    "תוכנית טק-קריירה מלווה צעירות ממשפחות יוצאי אתיופיה למסלולי לימוד בהייטק.",
    "תוכנית טק-קריירה מלווה צעירים ממשפחות יוצאי אתיופיה למסלולי לימוד בהייטק."
  );

  return (
    <>
      {/* ====== MOBILE ====== */}
      <div className="md:hidden w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
        {header}
        <div className="flex-1 overflow-y-auto">{stepContent}</div>
      </div>

      {/* ====== DESKTOP ====== */}
      <div className="hidden md:flex w-full min-h-screen">
        {/* Branding panel — ימין (RTL) */}
        <aside className="w-[420px] shrink-0 bg-navy text-white flex flex-col justify-center px-14">
          <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-10">techcareerly</div>
          <div className="text-[32px] font-bold leading-tight mb-4" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
            {brandingTitle}
          </div>
          <div className="text-[15px] leading-relaxed mb-10" style={{ opacity: 0.65 }}>
            {brandingDesc}
          </div>
          {["הכרת עולם הטק", "התאמת מסלול אישי", "ליווי עד רישום"].map((item) => (
            <div key={item} className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#fb8500" }} />
              <div className="text-[14px]" style={{ opacity: 0.8 }}>{item}</div>
            </div>
          ))}
        </aside>

        {/* Form panel — שמאל (RTL) */}
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
