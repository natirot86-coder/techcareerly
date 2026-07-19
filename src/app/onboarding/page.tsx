"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { saveOnboarding } from "@/lib/candidate";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3 | 4 | 5;
type Gender = "male" | "female" | "other" | "";

const REGION_OPTIONS = ["מרכז", "צפון", "דרום", "ירושלים", "אחר"];
const BLOCKER_OPTIONS = [
  "לא ידעתי מאיפה להתחיל",
  "חשבתי שזה לא מתאים לי",
  "הכסף / המימון הדאיג אותי",
  "לא היה לי מי שיוביל אותי",
  "לא היה לי זמן",
  "פחד מכישלון",
];
const JOURNEY_LABELS = ["הרשמה לאפליקציה", "פגישת פתיחה", "טעימות הייטק", "מסלולי לימודים", "צ׳קליסט", "הרשמה ללימודים"];
const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Gender text helper ────────────────────────────────────────────────────────
function g(gender: Gender, male: string, female: string, neutral?: string): string {
  if (gender === "male") return male;
  if (gender === "female") return female;
  return neutral ?? `${male}/${female}`;
}

function sliderLabel(score: number, gender: Gender): string {
  if (score <= 2) return "מה זה בכלל...";
  if (score <= 4) return "שמעתי על זה, נראה לי";
  if (score <= 6) return g(gender, "מכיר, לא נכנסתי לעומק", "מכירה, לא נכנסתי לעומק", "מכיר/ה, לא נכנסתי לעומק");
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
  if (step === 0 || step === 4) return null;
  return (
    <div className="bg-navy text-white px-[22px] pt-[22px] pb-[20px]">
      <div className="flex items-center gap-3 mb-4">
        {step > 1 && (
          <button type="button" onClick={onBack} className="text-[13px] opacity-70 hover:opacity-100">
            חזרה
          </button>
        )}
        <div className="flex-1" />
        <div className="text-[11px] opacity-50 font-bold uppercase tracking-widest">techcareerly</div>
      </div>
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
    </div>
  );
}

// ─── Journey Map SVG ──────────────────────────────────────────────────────────
function JourneyMap() {
  const pts = [
    { x: 28, y: 28 },
    { x: 90, y: 58 },
    { x: 156, y: 28 },
    { x: 222, y: 58 },
    { x: 286, y: 28 },
    { x: 340, y: 58 },
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
    <svg viewBox="0 0 368 98" className="w-full" fill="none" aria-hidden="true">
      {/* Road border */}
      <path d={pathD} stroke="rgba(2,62,138,0.15)" strokeWidth="14" strokeLinecap="round" />
      {/* Road surface */}
      <path d={pathD} stroke="rgba(2,62,138,0.05)" strokeWidth="10" strokeLinecap="round" />
      {/* Center dashes */}
      <path d={pathD} stroke="rgba(2,62,138,0.22)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 8" />

      {pts.map((p, i) => {
        const words = JOURNEY_LABELS[i].split(" ");
        return (
          <g key={i}>
            {/* Pin shadow */}
            <ellipse cx={p.x} cy={p.y + 12} rx={6} ry={2.5} fill="rgba(2,62,138,0.1)" />
            {/* Pin head */}
            <circle cx={p.x} cy={p.y - 10} r={12} fill="#023e8a" />
            {/* Pin tail */}
            <polygon
              points={`${p.x - 7},${p.y - 2} ${p.x + 7},${p.y - 2} ${p.x},${p.y + 12}`}
              fill="#023e8a"
            />
            {/* Number */}
            <text
              x={p.x} y={p.y - 10}
              textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize="10" fontWeight="800" fontFamily="sans-serif"
            >
              {i + 1}
            </text>
            {/* Label lines */}
            {words.map((word, wi) => (
              <text
                key={wi}
                x={p.x} y={p.y + 22 + wi * 12}
                textAnchor="middle"
                fill="rgba(2,62,138,0.5)"
                fontSize="8" fontWeight="700" fontFamily="sans-serif"
              >
                {word}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Wizard Tour (Step 5) ─────────────────────────────────────────────────────
type TourSlideDef = {
  tag: string;
  iconBg: string;
  bg: string;
  icon: "meeting" | "explore" | "checklist" | "app";
  headline: string;
  body?: string;
  appTabs?: { sym: string; label: string; desc: string }[];
};

const TOUR_SLIDES: TourSlideDef[] = [
  {
    tag: "שלב 2 — פגישת פתיחה",
    iconBg: "#023e8a",
    bg: "#dce8ff",
    icon: "meeting",
    headline: "הצעד הבא — מפגש עם הרכזת",
    body: "הרכזת תיצור איתך קשר לפגישת היכרות — מפגש פנים אל פנים. שיחה חופשית, לא ראיון. רק שתכירו ותצאו לדרך יחד.",
  },
  {
    tag: "שלב 3 — טעימות הייטק",
    iconBg: "#fb8500",
    bg: "#fff3e0",
    icon: "explore",
    headline: "לגלות מה מדליק אותך",
    body: "קוד, סייבר, AI, עיצוב, דאטה, שיווק דיגיטלי — תנסה/י כמה כיוונים בסימולציות קצרות ותגלה/י מה קורה לך. בלי לחץ לבחור מראש.",
  },
  {
    tag: "שלבים 4-5 — מסלול וצ׳קליסט",
    iconBg: "#2e7d46",
    bg: "#e8f5e9",
    icon: "checklist",
    headline: "מסלול + הכנה מלאה לרישום",
    body: "נמצא את מסגרת הלימודים הנכונה — אקדמאית, הנדסאים, הכשרה מקצועית. ונכין יחד הכל: מימון, מלגות, דיור, פסיכומטרי, תנאי קבלה.",
  },
  {
    tag: "מה יש לך כאן",
    iconBg: "#023e8a",
    bg: "#f2ede6",
    icon: "app",
    headline: "4 כלים לאורך כל הדרך",
    appTabs: [
      { sym: "⊞", label: "המסע", desc: "מעקב אחרי השלבים שלך" },
      { sym: "◎", label: "Co-pilot", desc: "AI שעוזר עם שאלות" },
      { sym: "◈", label: "קהילה", desc: "סטודנטים בדרך דומה" },
      { sym: "◉", label: "רכזת", desc: "מלווה אותך מהתחלה ועד הרשמה" },
    ],
  },
];

function TourIcon({ type, strokeColor }: { type: TourSlideDef["icon"]; strokeColor: string }) {
  if (type === "meeting") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="20" cy="18" r="10" fill="rgba(255,255,255,0.9)" />
        <circle cx="44" cy="18" r="10" fill="rgba(255,255,255,0.9)" />
        <path d="M4 48 C4 37 11 30 20 30 C26 30 31 33 33 39" stroke="rgba(255,255,255,0.9)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M31 48 C33 37 38 30 44 30 C53 30 60 37 60 48" stroke="rgba(255,255,255,0.9)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="44" r="5" fill="rgba(255,255,255,0.7)" />
      </svg>
    );
  }
  if (type === "explore") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M36 4L10 34H28L20 60L54 30H36L36 4Z" fill="rgba(255,255,255,0.9)" />
      </svg>
    );
  }
  if (type === "checklist") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="12" y="6" width="40" height="52" rx="5" fill="rgba(255,255,255,0.9)" />
        <path d="M20 26L27 33L42 18" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 42L27 49L42 34" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="26" height="26" rx="6" fill="rgba(255,255,255,0.9)" />
      <rect x="34" y="4" width="26" height="26" rx="6" fill="rgba(255,255,255,0.9)" />
      <rect x="4" y="34" width="26" height="26" rx="6" fill="rgba(255,255,255,0.9)" />
      <rect x="34" y="34" width="26" height="26" rx="6" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

function WizardTour({ gender, onDone }: { gender: Gender; onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const cur = TOUR_SLIDES[slide];
  const isLast = slide === TOUR_SLIDES.length - 1;

  function next() {
    if (isLast) onDone();
    else setSlide((s) => s + 1);
  }

  const ctaLabel = isLast
    ? g(gender, "יאללה, מתחיל!", "יאללה, מתחילה!", "יאללה, למסע!")
    : "הבא";

  return (
    <div className="flex flex-col min-h-full" style={{ background: cur.bg }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-[22px] pt-[20px] pb-4">
        <span className="text-[11px] font-bold tracking-wide" style={{ color: cur.iconBg, opacity: 0.8 }}>
          {cur.tag}
        </span>
        <button type="button" onClick={onDone} className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.3)" }}>
          דלג
        </button>
      </div>

      {/* Illustration */}
      <div
        className="mx-[22px] rounded-2xl flex items-center justify-center"
        style={{ height: 174, background: cur.iconBg }}
      >
        <TourIcon type={cur.icon} strokeColor={cur.bg} />
      </div>

      {/* Content */}
      <div className="flex-1 px-[22px] pt-5 flex flex-col gap-4">
        <div className="text-[24px] text-navy leading-tight" style={HEEBO}>{cur.headline}</div>
        {cur.body && (
          <div className="text-[14.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.6)" }}>{cur.body}</div>
        )}
        {cur.appTabs && (
          <div className="flex flex-col gap-[10px]">
            {cur.appTabs.map((tab) => (
              <div
                key={tab.label}
                className="flex items-center gap-3 rounded-xl px-4 py-[11px]"
                style={{ background: "rgba(255,255,255,0.75)" }}
              >
                <span className="text-[20px]" style={{ color: "#023e8a" }}>{tab.sym}</span>
                <div>
                  <div className="text-[13px] font-bold text-navy">{tab.label}</div>
                  <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>{tab.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-[22px] pb-8 pt-4 flex flex-col gap-4">
        <div className="flex justify-center gap-[6px]">
          {TOUR_SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slide ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: i === slide ? cur.iconBg : "rgba(0,0,0,0.15)",
                transition: "width 0.2s, background 0.2s",
              }}
            />
          ))}
        </div>
        <Button variant={isLast ? "orange" : "primary"} onClick={next}>{ctaLabel}</Button>
      </div>
    </div>
  );
}

// ─── Step 0 — Welcome ─────────────────────────────────────────────────────────
function Step0({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <div className="bg-navy px-[22px] pt-8 pb-10 text-white">
        <div className="text-[11px] opacity-40 font-bold uppercase tracking-widest mb-7">techcareerly</div>
        <div className="text-[38px] leading-[1.1] mb-5" style={HEEBO}>
          נמאס לך לשמוע<br />
          <span style={{ color: "#fb8500" }}>&quot;הייטק זה לא בשבילך&quot;?</span>
        </div>
        <div className="text-[15px] leading-relaxed" style={{ opacity: 0.8 }}>
          אנחנו כאן בדיוק בשביל זה. תהליך מובנה, רכזת אישית, ומסלול לימודים שמתאים לך — לא לכולם.
        </div>
      </div>

      {/* Journey */}
      <div className="px-[22px] py-7 flex flex-col gap-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.35)" }}>
            התהליך שלנו — 6 שלבים
          </div>
          <JourneyMap />
        </div>

        <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.45)" }}>
          כל שלב בקצב שלך, עם רכזת לאורך כל הדרך
        </div>

        <Button variant="orange" onClick={onNext}>יאללה, מתחילים</Button>

        <Link href="/login" className="text-center text-[13px] font-bold" style={{ color: "#023e8a", opacity: 0.6 }}>
          כבר יש לך חשבון? כניסה עם טלפון
        </Link>
      </div>
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
        <div className="text-[24px] text-navy mb-1" style={HEEBO}>{title}</div>
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
        <div className="text-[24px] text-navy mb-1" style={HEEBO}>{title}</div>
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
          <span className="text-[34px] font-bold text-navy" style={HEEBO}>{score}</span>
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

// ─── Step 3 — Barrier question ────────────────────────────────────────────────
function Step3({ firstName, gender, blockers, setBlockers, onNext }: {
  firstName: string; gender: Gender;
  blockers: string[]; setBlockers: (v: string[]) => void;
  onNext: () => void;
}) {
  const title = g(
    gender,
    `${firstName}, שאלה אחת אחרונה`,
    `${firstName}, שאלה אחת אחרונה`,
    `${firstName}, שאלה אחת אחרונה`
  );

  function toggle(item: string) {
    setBlockers(
      blockers.includes(item)
        ? blockers.filter((b) => b !== item)
        : [...blockers, item]
    );
  }

  return (
    <div className="flex flex-col gap-5 px-[22px] py-6">
      <div>
        <div className="text-[24px] text-navy mb-1" style={HEEBO}>{title}</div>
        <div className="text-[14px]" style={{ color: "rgba(0,0,0,0.5)" }}>
          מה עצר אותך עד היום מלהיכנס לתחום הטק? (אפשר לסמן כמה)
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {BLOCKER_OPTIONS.map((opt) => (
          <Chip key={opt} label={opt} selected={blockers.includes(opt)} onClick={() => toggle(opt)} />
        ))}
      </div>

      <Button variant="primary" onClick={onNext} disabled={blockers.length === 0}>המשך</Button>
    </div>
  );
}

// ─── Step 4 — Done ────────────────────────────────────────────────────────────
function Step4({ firstName, gender, blockers, onDone }: {
  firstName: string; gender: Gender; blockers: string[]; onDone: () => void;
}) {
  const blockerNote = blockers.length > 0
    ? "שמנו לב מה עצר אותך עד היום — הרכזת תתייחס לזה ישירות בפגישת הפתיחה."
    : null;

  const bullets = [
    "הרכזת תיצור איתך קשר לתיאום פגישת היכרות — מפגש פנים אל פנים",
    "בפגישה תכירו, תדברו על המסלול שלך, ותצאו לדרך יחד",
    "בינתיים — המסע שלך באפליקציה כבר פתוח",
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
        <div className="text-[28px] text-navy" style={HEEBO}>
          כל הכבוד, {firstName}!
        </div>
        <div className="text-[14px] mt-2" style={{ color: "rgba(0,0,0,0.5)" }}>
          קיבלנו את הפרטים שלך — זה כבר צעד שרוב האנשים לא עושים.
        </div>
        {blockerNote && (
          <div className="text-[13px] mt-2 font-bold" style={{ color: "#023e8a" }}>
            {blockerNote}
          </div>
        )}
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

      <Button variant="primary" onClick={onDone}>המשך</Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [score, setScore] = useState(5);
  const [blockers, setBlockers] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (new URLSearchParams(window.location.search).get("reset") === "1") {
        localStorage.removeItem("onboarding-done");
        return;
      }
      if (localStorage.getItem("onboarding-done")) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  function handleDone() {
    localStorage.setItem("onboarding-done", "1");
    localStorage.setItem("user-name", firstName.trim());
    saveOnboarding({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender || "other",
      age: parseInt(age, 10),
      region,
      techInterestScore: score,
      blockers,
    });
    router.push("/dashboard");
  }

  function goBack() {
    setStep((s) => (s - 1) as Step);
  }

  const header = <OnboardingHeader step={step} onBack={goBack} />;

  const stepContent = (
    <>
      {step === 0 && <Step0 onNext={() => setStep(1)} />}
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
          firstName={firstName} gender={gender}
          blockers={blockers} setBlockers={setBlockers}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <Step4 firstName={firstName} gender={gender} blockers={blockers} onDone={handleDone} />
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

  // Step 0 desktop: full navy hero centered
  if (step === 0) {
    return (
      <>
        {/* Mobile */}
        <div className="md:hidden w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
          <div className="flex-1 overflow-y-auto">
            <Step0 onNext={() => setStep(1)} />
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden md:flex w-full min-h-screen">
          {/* Left: navy hero */}
          <div className="w-1/2 bg-navy text-white flex flex-col justify-center px-16">
            <div className="text-[11px] opacity-40 font-bold uppercase tracking-widest mb-8">techcareerly</div>
            <div className="text-[48px] leading-[1.1] mb-6" style={HEEBO}>
              נמאס לך לשמוע<br />
              <span style={{ color: "#fb8500" }}>&quot;הייטק זה לא בשבילך&quot;?</span>
            </div>
            <div className="text-[16px] leading-relaxed mb-8" style={{ opacity: 0.75 }}>
              אנחנו כאן בדיוק בשביל זה. תהליך מובנה, רכזת אישית, ומסלול לימודים שמתאים לך — לא לכולם.
            </div>
          </div>
          {/* Right: journey + CTA */}
          <div className="w-1/2 bg-cream flex items-center justify-center p-12">
            <div className="w-full max-w-[400px]">
              <div className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color: "rgba(0,0,0,0.35)" }}>
                התהליך שלנו — 6 שלבים
              </div>
              <div className="mb-6">
                <JourneyMap />
              </div>
              <div className="text-[13px] mb-8" style={{ color: "rgba(0,0,0,0.45)" }}>
                כל שלב בקצב שלך, עם רכזת לאורך כל הדרך
              </div>
              <Button variant="orange" onClick={() => setStep(1)}>יאללה, מתחילים</Button>
              <Link
                href="/login"
                className="block text-center text-[13px] font-bold mt-4"
                style={{ color: "#023e8a", opacity: 0.6 }}
              >
                כבר יש לך חשבון? כניסה עם טלפון
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Step 4 desktop: centered card, no sidebar
  if (step === 4) {
    return (
      <>
        {/* Mobile */}
        <div className="md:hidden w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
          <div className="flex-1 overflow-y-auto">
            <Step4 firstName={firstName} gender={gender} blockers={blockers} onDone={() => setStep(5)} />
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden md:flex w-full min-h-screen bg-cream items-center justify-center p-10">
          <div className="w-full max-w-[480px] bg-card rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(2,62,138,0.12)" }}>
            <Step4 firstName={firstName} gender={gender} blockers={blockers} onDone={() => setStep(5)} />
          </div>
        </div>
      </>
    );
  }

  // Step 5 — Wizard Tour
  if (step === 5) {
    return (
      <>
        {/* Mobile */}
        <div className="md:hidden w-full max-w-[390px] min-h-screen flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
          <div className="flex-1 overflow-y-auto">
            <WizardTour gender={gender} onDone={handleDone} />
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden md:flex w-full min-h-screen bg-cream items-center justify-center p-10">
          <div className="w-full max-w-[480px] rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(2,62,138,0.12)" }}>
            <WizardTour gender={gender} onDone={handleDone} />
          </div>
        </div>
      </>
    );
  }

  // Steps 1–3: sidebar + form
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
        {header}
        <div className="flex-1 overflow-y-auto">{stepContent}</div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex w-full min-h-screen">
        {/* Branding panel */}
        <aside className="w-[400px] shrink-0 bg-navy text-white flex flex-col justify-center px-14">
          <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-10">techcareerly</div>
          <div className="text-[30px] leading-tight mb-4" style={HEEBO}>{brandingTitle}</div>
          <div className="text-[15px] leading-relaxed mb-10" style={{ opacity: 0.65 }}>{brandingDesc}</div>
          {["הכרת עולם הטק", "התאמת מסלול אישי", "ליווי עד רישום"].map((item) => (
            <div key={item} className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#fb8500" }} />
              <div className="text-[14px]" style={{ opacity: 0.8 }}>{item}</div>
            </div>
          ))}
        </aside>

        {/* Form panel */}
        <main className="flex-1 bg-cream flex items-center justify-center p-10 overflow-y-auto">
          <div className="w-full max-w-[480px] bg-card rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(2,62,138,0.12)" }}>
            {header}
            {stepContent}
          </div>
        </main>
      </div>
    </>
  );
}
