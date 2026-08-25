"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { saveSimulationProgress, updateTask, logEvent } from "@/lib/candidate";

const HEEBO  = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const RED    = "#dc2626";
const NAVY   = "#023e8a";
const ORANGE = "#fb8500";

// ─── Types ────────────────────────────────────────────────────────────────────

type Verdict = "ALLOW" | "INVESTIGATE" | "BLOCK";
type Phase   = "intro" | "sim" | "learned" | "done";

type RealIncident = { text: string; href: string; source: string } | null;

type Alert = {
  id: number;
  severity: "🔴" | "🟠" | "🟡" | "🟢";
  header: string;
  concept: string;
  details: { label: string; value: string }[];
  hint: string;
  correct: Verdict;
  okMsg: string;
  errMsg: Record<Verdict, string>;
  incident: RealIncident;
  chips?: { term: string; explain: string }[];
};

// ─── Alert data (easy → hard) ─────────────────────────────────────────────────

const ALERTS: Alert[] = [
  {
    id: 1,
    severity: "🟢",
    header: "Data transfer: 4.7GB | Source: DB-SERVER | Dest: 10.0.0.87",
    concept: "כתובת IP שמתחילה ב-10.x.x.x היא תמיד פנימית — בתוך הרשת של הארגון שלכם. תנועה פנימית בזמן מתוכנן = בדרך כלל לגיטימית.",
    details: [
      { label: "Destination", value: "10.0.0.87 = BACKUP-SERVER (internal)" },
      { label: "Time",        value: "03:00 — scheduled backup window" },
      { label: "Frequency",   value: "Daily — consistent with baseline" },
      { label: "Protocol",    value: "Encrypted backup protocol" },
    ],
    hint: "10.0.0.87 — מה כתובת IP שמתחילה ב-10 מסמנת?",
    correct: "ALLOW",
    okMsg: "✓ נכון — 10.x.x.x = IP פנימי. Transfer בזמן backup מתוזמן = פעולה רגילה.",
    errMsg: {
      BLOCK:       "✗ לא — 10.0.0.87 הוא BACKUP-SERVER פנימי. חסימת backup תגרום לנזק.",
      INVESTIGATE: "✗ לא נדרש — IP פנימי, זמן מתוזמן, backup יומי עקבי. ALLOW.",
      ALLOW: "",
    },
    incident: null,
    chips: [
      { term: "SIEM", explain: "Security Information and Event Management — מערכת שמרכזת ומנתחת אירועי אבטחה מכל הרשת ומייצרת alerts אוטומטיים. זו המערכת שמאכילה אותך בעבודה." },
      { term: "10.x.x.x", explain: "IP שמתחיל ב-10 = כתובת פנימית לארגון. תנועה כזו לא יוצאת לאינטרנט." },
      { term: "scheduled window", explain: "חלון זמן מתוכנן — פעולה שמוגדרת מראש לשעה קבועה, כמו backup בשעה 03:00 כל לילה." },
      { term: "baseline", explain: "קו הבסיס — מה שנחשב 'נורמלי' ברשת. תנועה שתואמת baseline = לא חשודה." },
    ],
  },
  {
    id: 2,
    severity: "🟡",
    header: "Port scan detected | IP: 8.8.8.8 | Ports: 53, 443",
    concept: "8.8.8.8 הוא שרת DNS הפומבי של Google — אחד ה-IPs המוכרים ביותר באינטרנט. Port 53 = DNS, Port 443 = HTTPS — שניהם סטנדרטיים.",
    details: [
      { label: "IP Owner",  value: "Google LLC" },
      { label: "Ports",     value: "53 (DNS) · 443 (HTTPS)" },
      { label: "Frequency", value: "Routine — once every 24h" },
      { label: "History",   value: "Known Google infrastructure" },
    ],
    hint: "8.8.8.8 — IP מוכר מאוד. של מי הוא?",
    correct: "ALLOW",
    okMsg: "✓ נכון — 8.8.8.8 הוא שרת DNS של גוגל. פעולה לגיטימית.",
    errMsg: {
      BLOCK:       "✗ לא — 8.8.8.8 = Google DNS. חסימתו תשבש גלישה באינטרנט.",
      INVESTIGATE: "✗ לא צריך — 8.8.8.8 הוא Google DNS ידוע. ALLOW ישיר.",
      ALLOW: "",
    },
    incident: null,
    chips: [
      { term: "port scan", explain: "סריקת פורטים — בדיקה אוטומטית אילו שירותים פתוחים על שרת. יכול להיות כלי ניהול לגיטימי, לא בהכרח מתקפה." },
      { term: "Port 53", explain: "פורט DNS — ממיר שמות אתרים (google.com) לכתובות IP. כל גלישה מתחילה כאן." },
      { term: "Port 443", explain: "פורט HTTPS — גלישה מאובטחת עם הצפנה. כמעט כל אתר מודרני מגיב על פורט זה." },
    ],
  },
  {
    id: 3,
    severity: "🔴",
    header: "Failed logins: 2,847 attempts in 3 min | IP: 91.108.4.15",
    concept: "Brute force attack = ניסיון לפרוץ חשבון ע\"י ניסוי אוטומטי של אלפי סיסמאות בשניות. אדם לא יכול לנסות 2,847 פעמים ב-3 דקות — זה בוט.",
    details: [
      { label: "ISP",         value: "Unknown — unregistered block" },
      { label: "Country",     value: "RU" },
      { label: "Attempts",    value: "2,847 in 3 minutes — all failed" },
      { label: "Target user", value: "admin" },
    ],
    hint: "2,847 ניסיונות ב-3 דקות — האם אדם יכול לעשות את זה?",
    correct: "BLOCK",
    okMsg: "✓ נכון — brute force אוטומטי על חשבון admin. בלוק מיידי.",
    errMsg: {
      ALLOW:       "✗ לא — 2,847 ניסיונות מ-IP זר ב-3 דקות = brute force. חייבים לחסום.",
      INVESTIGATE: "✗ קרוב — אבל 2,847 ניסיונות מ-IP זר הם חד-משמעיים. BLOCK מיידי.",
      BLOCK: "",
    },
    incident: {
      text: "בדיוק כך פרצו ב-2020 לחברת הביטוח שירביט — אלפי ניסיונות סיסמה אוטומטיים, פרטי 160,000 לקוחות דלפו.",
      href: "https://www.geektime.co.il/shirbit-hack-attack/",
      source: "Geektime",
    },
    chips: [
      { term: "ISP", explain: "Internet Service Provider — ספק האינטרנט. ISP לא ידוע = IP שלא ניתן לאתר מיהו הבעלים האמיתי." },
      { term: "brute force", explain: "מתקפת כוח גס — בוט שמנסה אוטומטית אלפי שילובי סיסמה בשניות. אדם לא יכול לנסות 2,847 פעמים ב-3 דקות." },
    ],
  },
  {
    id: 4,
    severity: "🟠",
    header: "Failed logins: 3 attempts | IP: 195.12.34.56 | User: admin",
    concept: "3 ניסיונות בלבד — יכול להיות עובד ששכח סיסמה. אבל: IP לא מוכר + חשבון admin בעל הרשאות גבוהות = אין להתעלם.",
    details: [
      { label: "Attempts",    value: "3 in 10 seconds" },
      { label: "IP History",  value: "First time seen" },
      { label: "Blacklist",   value: "Not listed" },
      { label: "Target user", value: "admin — high-privilege account" },
    ],
    hint: "3 ניסיונות לא מוכיחים מתקפה — אבל מה מיוחד בחשבון admin?",
    correct: "INVESTIGATE",
    okMsg: "✓ נכון — 3 ניסיונות לא מצדיקים בלוק, אבל IP חדש + user admin = חייבים לחקור.",
    errMsg: {
      BLOCK: "✗ יתכן — אבל 3 ניסיונות לא מספיקים לבלוק אוטומטי. INVESTIGATE קודם.",
      ALLOW: "✗ לא — IP חדש שמנסה admin הוא חשוד. לא מאפשרים בלי לבדוק.",
      INVESTIGATE: "",
    },
    incident: {
      text: "בפריצה לשירביט: המידע המדליף הראה שהתוקפים 'בדקו' כניסות בצורה שקטה עוד לפני המתקפה הגדולה.",
      href: "https://www.geektime.co.il/shirbit-hackers-keep-dumping-data-say-theres-a-demand-for-it-and-leak-conversation-with-negotiator/",
      source: "Geektime",
    },
    chips: [
      { term: "IP History", explain: "האם ה-IP נראה אצלנו קודם? IP חדש לחלוטין שניגש לחשבון admin = חשוד יותר מ-IP מוכר." },
      { term: "Blacklist", explain: "רשימה שחורה של IPs ידועים כזדוניים. IP שלא ברשימה לא אומר שהוא בטוח — פשוט לא ידוע." },
    ],
  },
  {
    id: 5,
    severity: "🔴",
    header: "Suspicious process: cmd.exe spawned by iis.exe | WEB-SERVER-01",
    concept: "Webshell = קוד זדוני שהוחדר לשרת web ומאפשר שליטה עליו מרחוק. IIS הוא שרת web של Microsoft. כשהוא פותח cmd.exe (שורת פקודה) — זה סימן קלאסי לפריצה.",
    details: [
      { label: "Parent",  value: "iis.exe (IIS web server)" },
      { label: "Child",   value: "cmd.exe (Windows command shell)" },
      { label: "Pattern", value: "Web server spawning shell = webshell indicator" },
      { label: "Timing",  value: "02:47 — off-hours" },
    ],
    hint: "מדוע שרת web לא אמור לפתוח command shell?",
    correct: "INVESTIGATE",
    okMsg: "✓ נכון — IIS שפותח cmd.exe = דגל אדום חמור. חוקרים לפני שחוסמים — webshell עלול להיות פעיל.",
    errMsg: {
      BLOCK: "✗ קרוב — אבל קודם חוקרים. BLOCK על שרת production עלול לשבש שירות.",
      ALLOW: "✗ בשום אופן לא — IIS שפותח cmd.exe = סימן קלאסי לפריצה.",
      INVESTIGATE: "",
    },
    incident: {
      text: "בדיוק הדפוס הזה שימש ב-SolarWinds 2020 — webshell בשם SUPERNOVA איפשר לתוקפים שליטה על אלפי ארגונים ממשלתיים.",
      href: "https://www.israeldefense.co.il/node/47084",
      source: "Israel Defense",
    },
    chips: [
      { term: "webshell", explain: "קוד זדוני שמוחדר לשרת web ומאפשר שליטה עליו מרחוק. המתקפן שולח פקודות דרך HTTP רגיל — קשה לזיהוי." },
      { term: "IIS", explain: "Internet Information Services — שרת ה-web של Microsoft. תפקידו לשרת דפים, לא לפתוח command shell." },
      { term: "off-hours", explain: "שעות לא עסקיות — 02:47 בלילה. פעילות אוטומטית לגיטימית (backup, updates) מתוכננת מראש. פעילות לא מתוכננת בשעות אלה = דגל אדום." },
    ],
  },
];

// ─── Learned concepts ─────────────────────────────────────────────────────────

const CONCEPTS = [
  { emoji: "🟢", term: "10.x.x.x", explain: "כתובת IP שמתחילה ב-10 = פנימית לארגון. תנועה פנימית בזמן מתוכנן = לגיטימי." },
  { emoji: "🌐", term: "8.8.8.8 = Google DNS", explain: "IP ציבורי ידוע של Google. SOC Analyst טובה מזהה IPs ידועים ולא חוסמת אותם." },
  { emoji: "🤖", term: "Brute Force", explain: "בוט שמנסה אלפי סיסמאות בדקות. 2,847 ניסיונות ב-3 דקות = אוטומציה. BLOCK מיידי." },
  { emoji: "⚠️", term: "Gray Area", explain: "3 ניסיונות לא = מתקפה. אבל IP חדש + חשבון admin = לא מתעלמים. INVESTIGATE תמיד." },
  { emoji: "🐚", term: "Webshell", explain: "שרת web שפותח cmd.exe = דגל אדום. התוקף כבר בפנים ושולט. חוקרים לפני שחוסמים." },
];

// ─── Components ───────────────────────────────────────────────────────────────

function VerdictButton({ label, color, bg, onClick, disabled }: {
  label: Verdict; color: string; bg: string; onClick: () => void; disabled: boolean;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all active:scale-[0.97]"
      style={{ background: bg, color, border: `1.5px solid ${color}30`, fontFamily: "'Heebo', sans-serif" }}>
      {label}
    </button>
  );
}

// Dark SIEM dashboard widget for intro
function SiemWidget() {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
      {/* Title bar */}
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[9px] h-[9px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[9px] h-[9px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[9px] h-[9px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-auto" style={{ color: "#64748b" }}>SOC Dashboard — Live  08:47 AM</span>
      </div>
      {/* Metrics row */}
      <div className="flex border-b" style={{ background: "#0f172a", borderColor: "#1e293b" }}>
        {[
          { label: "Total alerts today", value: "847", color: "#94a3b8" },
          { label: "Critical", value: "3", color: "#ef4444" },
          { label: "Your queue", value: "5", color: "#fb923c" },
        ].map((m) => (
          <div key={m.label} className="flex-1 px-3 py-2.5 text-center border-r" style={{ borderColor: "#1e293b" }}>
            <div className="font-mono font-bold text-[18px]" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[9px] uppercase tracking-widest" style={{ color: "#475569" }}>{m.label}</div>
          </div>
        ))}
      </div>
      {/* Live feed */}
      <div className="p-3 font-mono text-[11px] leading-[2]" style={{ background: "#0f172a" }}>
        {[
          { color: "#ef4444", text: "🔴 CRITICAL  | 91.108.4.15 | Failed logins: 2,847 in 3min" },
          { color: "#fb923c", text: "🟠 WARNING   | 195.12.34.56 | Failed login: admin account" },
          { color: "#facc15", text: "🟡 NOTICE    | 8.8.8.8 | Port scan detected" },
          { color: "#22c55e", text: "🟢 INFO      | 10.0.0.87 | Backup transfer started" },
        ].map((l, i) => (
          <div key={i} style={{ color: l.color }} dir="ltr">{l.text}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Intro phase ──────────────────────────────────────────────────────────────

function IntroPhase({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: RED }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/explore/cyber" className="text-[12px] font-bold block mb-4" style={{ opacity: 0.82 }}>← חזרה</Link>
          <div className="text-[20px]" style={HEEBO}>Alert Triage</div>
          <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>לפני שמתחילים — דקה להכרת המושגים</div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full px-5 pt-6 pb-32">
        {/* SOC room photo */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          <img src="/soc-room.png" alt="Security Operations Center" className="w-full" style={{ display: "block" }} />
        </div>

        <SiemWidget />

        {/* SOC explanation */}
        <div className="rounded-2xl px-4 py-4 mb-4"
          style={{ background: "rgba(220,38,38,0.06)", border: "1.5px solid rgba(220,38,38,0.15)" }}>
          <div className="text-[13px] font-black mb-1.5" style={{ color: RED, ...HEEBO }}>🖥️ מה זה SOC?</div>
          <div className="text-[12.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>
            <span className="font-bold" style={{ color: NAVY }}>Security Operations Center</span> — חדר הבקרה שמנטר אבטחה 24/7. כ-SOC Analyst, האחריות שלך לטפל בכל alert שעולה.
          </div>
        </div>

        {/* 3 verdicts */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>שלוש ההחלטות שלך</div>
          <div className="flex flex-col gap-2.5">
            {[
              { verdict: "✅ ALLOW", color: "#15803d", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.2)", desc: "תנועה לגיטימית — עוברת. לא כל alert הוא מתקפה." },
              { verdict: "🔍 INVESTIGATE", color: "#92400e", bg: "rgba(251,133,0,0.08)", border: "rgba(251,133,0,0.2)", desc: "חשוד — צריך לחקור. אין מספיק מידע לבלוק, אי אפשר להתעלם." },
              { verdict: "🚫 BLOCK", color: RED, bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)", desc: "מסוכן וברור — חוסמים מיידית. אין ספק." },
            ].map((v) => (
              <div key={v.verdict} className="rounded-xl px-3 py-2.5"
                style={{ background: v.bg, border: `1px solid ${v.border}` }}>
                <div className="text-[12px] font-black mb-0.5" style={{ color: v.color }}>{v.verdict}</div>
                <div className="text-[11.5px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div className="rounded-2xl px-4 py-3 mb-6"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
          <div className="text-[12.5px] leading-[1.6]" style={{ color: NAVY }}>
            💡 <span className="font-bold">הטריק:</span> לא הכל מסוכן, לא הכל בטוח.
            SOC Analyst צריכה <span className="font-bold">לחשוב</span> — לא לחסום הכל ולא לאפשר הכל.
          </div>
        </div>

        <button type="button" onClick={onStart}
          className="block w-full py-4 rounded-2xl text-[15px] font-black transition-all active:scale-[0.98]"
          style={{ background: RED, color: "#fff", ...HEEBO }}>
          מוכנה — נתחיל ←
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── ChipTip — inline glossary chip with tap-to-reveal ───────────────────────

function ChipTip({ term, explain }: { term: string; explain: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10.5px] font-bold px-2 py-0.5 rounded-full transition-all"
        style={{
          background: open ? "rgba(2,62,138,0.12)" : "rgba(2,62,138,0.06)",
          color: NAVY,
          border: "1px solid rgba(2,62,138,0.18)",
        }}>
        {term} {open ? "▲" : "▼"}
      </button>
      {open && (
        <span className="block mt-1 text-[11px] leading-[1.45] px-2 py-1.5 rounded-xl"
          style={{ background: "rgba(2,62,138,0.06)", color: "rgba(0,0,0,0.65)" }}>
          {explain}
        </span>
      )}
    </span>
  );
}

// ─── Single alert view ────────────────────────────────────────────────────────

function AlertView({
  alert, alertIdx, total, answer, onVerdict, onNext,
}: {
  alert: Alert;
  alertIdx: number;
  total: number;
  answer: { verdict: Verdict; correct: boolean } | null;
  onVerdict: (v: Verdict) => void;
  onNext: () => void;
}) {
  const [hintVisible, setHintVisible] = useState(false);
  const pct = ((alertIdx) / total) * 100;
  const isAnswered = !!answer;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      {/* Colored header */}
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: RED }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/explore/cyber" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.82 }}>← חזרה</Link>

          {/* SIEM metrics */}
          <div className="flex gap-4 mb-3 text-[11px]" style={{ opacity: 0.8 }} dir="ltr">
            <span>Total today: <strong>847</strong></span>
            <span style={{ color: "#fca5a5" }}>Critical: <strong>3</strong></span>
            <span style={{ color: "#fdba74" }}>Queue: <strong>{total - alertIdx}</strong></span>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.7 }}>
            <span>Alert {alertIdx + 1} מתוך {total}</span>
            <span>{alert.severity} {alert.severity === "🔴" ? "Critical" : alert.severity === "🟠" ? "Warning" : alert.severity === "🟡" ? "Notice" : "Info"}</span>
          </div>
          <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "#fff" }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-5 pt-5 pb-32">

        {/* Alert header card */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex items-start gap-3">
            <span className="text-[22px] shrink-0">{alert.severity}</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>
                INCOMING ALERT
              </div>
              <div className="font-mono text-[11.5px] font-bold leading-[1.55]" style={{ color: NAVY }} dir="ltr">
                {alert.header}
              </div>
            </div>
          </div>
        </div>

        {/* Concept mini-lesson */}
        <div className="rounded-2xl px-4 py-3 mb-4"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(2,62,138,0.5)" }}>💡 מושג</div>
          <div className="text-[12.5px] leading-[1.55]" style={{ color: NAVY }}>{alert.concept}</div>
        </div>

        {/* Alert anatomy — first alert only */}
        {alertIdx === 0 && (
          <div className="rounded-2xl px-4 py-3 mb-4"
            style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(2,62,138,0.5)" }}>
              📋 ה-alert הראשון שלך — כך קוראים את הטבלה
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Destination", desc: "לאן הגיעה התנועה — IP, שרת, שירות. 10.x.x.x = פנימי. שאר = חיצוני" },
                { label: "Time", desc: "מתי קרה האירוע. backup בשעה 03:00 מתוכנן? לילה בלי תכנון = חשוד" },
                { label: "Frequency", desc: "כמה פעמים — פעם ראשונה? כל יום? אלפי פעמים ב-3 דקות?" },
              ].map((f) => (
                <div key={f.label} className="flex gap-2.5 items-baseline">
                  <span className="font-mono text-[10px] font-bold shrink-0 w-[90px]" style={{ color: NAVY }}>{f.label}</span>
                  <span className="text-[11px] leading-[1.45]" style={{ color: "rgba(0,0,0,0.58)" }}>{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details table */}
        <div className="rounded-2xl overflow-hidden mb-3"
          style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
          <div className="px-4 py-2.5 border-b" style={{ background: "#f8fafc", borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>
              Alert Details
            </div>
          </div>
          {alert.details.map((d, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b"
              style={{ borderColor: "rgba(0,0,0,0.05)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wide shrink-0 w-24 text-left pt-0.5"
                style={{ color: "rgba(0,0,0,0.35)" }}>{d.label}</span>
              <span className="font-mono text-[11.5px] text-right flex-1" style={{ color: NAVY }}>{d.value}</span>
            </div>
          ))}
        </div>

        {/* GlossaryChips — per alert */}
        {alert.chips && alert.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {alert.chips.map((g) => (
              <ChipTip key={g.term} term={g.term} explain={g.explain} />
            ))}
          </div>
        )}

        {/* Hint toggle */}
        {!isAnswered && (
          <button type="button" onClick={() => setHintVisible(!hintVisible)}
            className="w-full py-2.5 rounded-xl text-[12px] font-bold mb-3 transition-all"
            style={{
              background: hintVisible ? "rgba(251,133,0,0.1)" : "transparent",
              border: "1.5px dashed rgba(251,133,0,0.4)",
              color: "#92400e",
            }}>
            {hintVisible ? "🙈 הסתר רמז" : "💡 אני תקועה — תן רמז"}
          </button>
        )}
        {hintVisible && !isAnswered && (
          <div className="rounded-xl px-3 py-2.5 mb-3"
            style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
            <div className="text-[12px] leading-[1.5]" style={{ color: "#92400e" }}>🤔 {alert.hint}</div>
          </div>
        )}

        {/* Verdict buttons */}
        {!isAnswered ? (
          <div className="flex gap-2">
            <VerdictButton label="ALLOW" color="#15803d" bg="rgba(22,163,74,0.1)"
              onClick={() => onVerdict("ALLOW")} disabled={false} />
            <VerdictButton label="INVESTIGATE" color="#92400e" bg="rgba(251,133,0,0.1)"
              onClick={() => onVerdict("INVESTIGATE")} disabled={false} />
            <VerdictButton label="BLOCK" color={RED} bg="rgba(220,38,38,0.1)"
              onClick={() => onVerdict("BLOCK")} disabled={false} />
          </div>
        ) : (
          <div>
            {/* Feedback */}
            <div className="rounded-xl px-4 py-3 mb-3 text-[12.5px] leading-[1.55]"
              style={{
                background: answer.correct ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${answer.correct ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}`,
                color: answer.correct ? "#15803d" : "#b91c1c",
              }}>
              {answer.correct ? alert.okMsg : alert.errMsg[answer.verdict]}
            </div>

            {/* Real incident */}
            {alert.incident && (
              <a href={alert.incident.href} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 mb-4 transition-all active:scale-[0.99]"
                style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)", textDecoration: "none" }}>
                <span className="text-[16px] shrink-0">🌐</span>
                <div className="flex-1">
                  <div className="text-[11.5px] leading-[1.5] mb-1" style={{ color: NAVY }}>{alert.incident.text}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.3)" }}>
                    {alert.incident.source} — קראי את הכתבה ←
                  </div>
                </div>
              </a>
            )}

            {/* Next */}
            <button type="button" onClick={onNext}
              className="block w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
              style={{ background: RED, color: "#fff", ...HEEBO }}>
              {alertIdx + 1 < ALERTS.length ? `לalert הבא ← (${alertIdx + 2}/${ALERTS.length})` : "לסיכום מה למדתי ←"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

// ─── Learned phase ────────────────────────────────────────────────────────────

function LearnedPhase({ answers, onDone }: {
  answers: Record<number, { verdict: Verdict; correct: boolean }>;
  onDone: () => void;
}) {
  const score = Object.values(answers).filter((a) => a.correct).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: RED }}>
        <div className="max-w-[720px] mx-auto">
          <div className="text-[20px]" style={HEEBO}>מה למדת היום</div>
          <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>5 מושגים שכל SOC Analyst צריכה לדעת</div>
          <div className="mt-3 h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div className="h-full rounded-full" style={{ width: "100%", background: "#fff" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full px-5 pt-5 pb-32">
        {/* Score */}
        <div className="rounded-2xl p-4 mb-5 text-center"
          style={{ background: score >= 4 ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.06)", border: `1.5px solid ${score >= 4 ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>
          <div className="text-[28px] mb-1">{score >= 4 ? "🛡️" : "📚"}</div>
          <div className="text-[22px] font-black" style={{ color: score >= 4 ? "#15803d" : RED, ...HEEBO }}>
            {score}/{ALERTS.length} נכון
          </div>
          <div className="text-[12px] mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
            {score === 5 ? "מושלם — SOC Analyst בפוטנציאל!" : score >= 3 ? "לא רע — עוד קצת ניסיון ואת שם" : "לא נורא — זה בדיוק מה שהטעימה בשבילה"}
          </div>
        </div>

        {/* Concepts */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
          5 מושגים שלקחת מכאן
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {CONCEPTS.map((c, i) => (
            <div key={i} className="rounded-2xl p-4"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-start gap-3">
                <span className="text-[20px] shrink-0">{c.emoji}</span>
                <div>
                  <div className="text-[13px] font-black mb-1" style={{ color: NAVY }}>{c.term}</div>
                  <div className="text-[12px] leading-[1.55]" style={{ color: "rgba(0,0,0,0.6)" }}>{c.explain}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={onDone}
          className="block w-full py-4 rounded-2xl text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
          style={{ background: RED, color: "#fff", ...HEEBO }}>
          לסיכום הסופי ←
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── Done phase ───────────────────────────────────────────────────────────────

function DonePhase({ answers }: { answers: Record<number, { verdict: Verdict; correct: boolean }> }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: RED }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/explore/cyber" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.82 }}>← חזרה</Link>
          <div className="text-[20px]" style={HEEBO}>Alert Triage — הושלם</div>
          <div className="mt-3 h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div className="h-full rounded-full" style={{ width: "100%", background: "#fff" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full px-5 pt-5 pb-32">
        <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
            מה עשית
          </div>
          <div className="flex flex-col gap-2">
            {ALERTS.map((a) => {
              const ans = answers[a.id];
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <span className="text-[14px] shrink-0">{a.severity}</span>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold" style={{ color: NAVY }}>{a.header.split("|")[0].trim()}</div>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0"
                    style={{
                      background: ans?.correct ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                      color: ans?.correct ? "#15803d" : RED,
                    }}>
                    {ans?.verdict} {ans?.correct ? "✓" : "✗"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Link href="/explore/cyber/learn/day"
          className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
          style={{ background: RED, color: "#fff", ...HEEBO }}>
          ליום בחיי SOC Analyst ←
        </Link>
        <Link href="/explore/cyber/experience"
          className="block w-full py-3.5 rounded-2xl text-center text-[13.5px] font-bold mb-6"
          style={{ background: "rgba(220,38,38,0.08)", color: RED }}>
          מיציתי את הטעימה ←
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// חוזרים בדיוק לשלב שבו נעצרנו — כולל האינדקס והתשובות, כי הניקוד ב-"learned"/"done" נגזר מ-answers
function loadSavedState(): { phase?: Phase; alertIdx?: number; answers?: Record<number, { verdict: Verdict; correct: boolean }> } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("cyber-sim-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function CyberSim() {
  // תחילת סימולציה — בלי זה אי אפשר להבדיל נטישה באמצע מאי-פתיחה
  useEffect(() => { logEvent("sim_start", { domain: "cyber" }); }, []);

  const [phase, setPhase]       = useState<Phase>(() => loadSavedState().phase ?? "intro");
  const [alertIdx, setAlertIdx] = useState(() => loadSavedState().alertIdx ?? 0);
  const [answers, setAnswers]   = useState<Record<number, { verdict: Verdict; correct: boolean }>>(() => loadSavedState().answers ?? {});

  useEffect(() => {
    try { localStorage.setItem("cyber-sim-state", JSON.stringify({ phase, alertIdx, answers })); } catch {/* ignore */}
  }, [phase, alertIdx, answers]);

  // איפה נוטשים בתוך הסימולציה — נטישה מוסקת מ"הגיע להתראה N ולא ל-N+1"
  useEffect(() => {
    if (phase === "intro") return;
    const a = ALERTS[alertIdx];
    if (a) logEvent("sim_step", {
      domain: "cyber",
      i: String(alertIdx + 1),
      of: String(ALERTS.length),
      concept: a.header,
      kind: "alert",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertIdx, phase]);

  function handleVerdict(verdict: Verdict) {
    const alert = ALERTS[alertIdx];
    const isCorrect = verdict === alert.correct;
    setAnswers((prev) => ({ ...prev, [alert.id]: { verdict, correct: isCorrect } }));
  }

  function handleNext() {
    if (alertIdx + 1 < ALERTS.length) {
      setAlertIdx((i) => i + 1);
    } else {
      // All done — save to localStorage then go to learned
      try {
        const cur = JSON.parse(localStorage.getItem("cyber-journey") || "{}");
        localStorage.setItem("cyber-journey", JSON.stringify({ ...cur, sim: true }));
      } catch {/* ignore */}
      // הסימולציות הייעודיות נבנו בנפרד מהדף הגנרי ולכן פספסו את השמירה לבקאנד
      const score = Object.values(answers).filter(a => a.correct).length;
      saveSimulationProgress("cyber", ALERTS.length, true, score);
      updateTask("sim-cyber", "done", 100);
      setPhase("learned");
    }
  }

  if (phase === "intro")   return <IntroPhase onStart={() => setPhase("sim")} />;
  if (phase === "learned") return <LearnedPhase answers={answers} onDone={() => setPhase("done")} />;
  if (phase === "done")    return <DonePhase answers={answers} />;

  return (
    <AlertView
      key={alertIdx}
      alert={ALERTS[alertIdx]}
      alertIdx={alertIdx}
      total={ALERTS.length}
      answer={answers[ALERTS[alertIdx].id] ?? null}
      onVerdict={handleVerdict}
      onNext={handleNext}
    />
  );
}
