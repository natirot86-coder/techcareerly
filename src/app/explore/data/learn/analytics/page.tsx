"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── design tokens ───────────────────────────────────────────────────────────
const TEAL   = "#0d9488";
const NAVY   = "#023e8a";
const ORANGE = "#fb8500";
const CREAM  = "#f2ede6";
const HEEBO  = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Phase type ──────────────────────────────────────────────────────────────
type Phase = "intro" | 1 | 2 | 3 | 4 | 5 | "done";

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Research Question
// ─────────────────────────────────────────────────────────────────────────────
const RQ_OPTIONS = [
  { id: "a", text: "למה המכירות ירדו?", correct: false, feedback: "השאלה הזו רחבה מדי — אין לה גבולות בזמן, אין מדד ספציפי, ואין כיוון ברור לחקירה." },
  { id: "b", text: "מה הגורם לירידה של 18% בהמרת ניסיון לרכישה בקרב משתמשים שנרשמו ב-Q1 2024, בהשוואה ל-Q4 2023?", correct: true, feedback: "מצוין! השאלה ספציפית: מדד ברור (המרה 18%), אוכלוסייה מוגדרת (נרשמו ב-Q1), תקופת זמן מוגדרת, ולהשוואה מול בסיס." },
  { id: "c", text: "האם הלקוחות אוהבים את המוצר?", correct: false, feedback: 'השאלה סובייקטיבית ולא מדידה. "אוהבים" אינו מדד כמותי — לא ניתן לנתח נתונים לשאלה כזו.' },
  { id: "d", text: "כמה משתמשים חדשים הצטרפו החודש?", correct: false, feedback: "זו שאלה תיאורית — היא עונה על \"מה קרה\" אך לא על \"למה\" או \"מה לעשות\". אנליטיקה טובה שואלת שאלות שמובילות להחלטה." },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Data Cleaning
// ─────────────────────────────────────────────────────────────────────────────
type DataIssue = "duplicate" | "null" | "outlier" | "wrong_type" | "ok";

interface DataRow {
  id: number;
  name: string;
  age: string;
  purchase: string;
  issue: DataIssue;
  issueLabel: string;
  action: string;
}

const DIRTY_DATA: DataRow[] = [
  { id: 1, name: "ירון כהן",   age: "34",   purchase: "249",    issue: "ok",         issueLabel: "",               action: "" },
  { id: 2, name: "מיטל לוי",  age: "NULL", purchase: "180",    issue: "null",        issueLabel: "ערך חסר (NULL)", action: "מחקי שורה או החלפי בממוצע" },
  { id: 3, name: "ירון כהן",   age: "34",   purchase: "249",    issue: "duplicate",   issueLabel: "שורה כפולה",    action: "הסירי את הכפילות — השאירי שורה אחת" },
  { id: 4, name: "נועה ברנר",  age: "2847", purchase: "95",     issue: "outlier",     issueLabel: "ערך חריג",       action: "בדקי אם זו שגיאת הקלדה — 28 או 47?" },
  { id: 5, name: "רועי שמש",   age: "29",   purchase: "אלפיים", issue: "wrong_type",  issueLabel: "סוג שגוי",      action: "הפכי למספר: 2000" },
  { id: 6, name: "ענת גבע",    age: "41",   purchase: "310",    issue: "ok",          issueLabel: "",               action: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Chart Selection
// ─────────────────────────────────────────────────────────────────────────────
const MONTHLY_DATA = [
  { month: "יאנ", users: 1200 },
  { month: "פבר", users: 980 },
  { month: "מרץ", users: 1450 },
  { month: "אפר", users: 1320 },
  { month: "מאי", users: 1680 },
  { month: "יוני", users: 2100 },
];

const CATEGORY_DATA = [
  { category: "מובייל", value: 62 },
  { category: "דסקטופ", value: 31 },
  { category: "טאבלט", value: 7 },
];

const SCATTER_DATA = [
  { x: 5, y: 120 }, { x: 12, y: 340 }, { x: 3, y: 80 }, { x: 18, y: 500 },
  { x: 7, y: 190 }, { x: 22, y: 620 }, { x: 9, y: 240 }, { x: 15, y: 410 },
  { x: 1, y: 40 },  { x: 25, y: 700 },
];

type ChartType = "line" | "bar" | "pie" | "scatter";

const CHART_SCENARIO = {
  question: "רוצה להציג את מגמת הגידול במשתמשים פעילים לאורך 6 חודשים. איזה גרף?",
  correct: "line" as ChartType,
  options: [
    { type: "line" as ChartType,    emoji: "📈", label: "גרף קו",    why: "מציג מגמה לאורך זמן — בחירה מושלמת למגמות חודשיות." },
    { type: "bar" as ChartType,     emoji: "📊", label: "גרף עמודות", why: "מתאים להשוואה בין קטגוריות — פחות ברור לזמן רציף." },
    { type: "pie" as ChartType,     emoji: "🥧", label: "גרף עוגה",   why: "מציג חלוקה באחוזים — לא מתאים למגמות." },
    { type: "scatter" as ChartType, emoji: "✦",  label: "גרף פיזור",  why: "מציג קשר בין שני משתנים — לא רלוונטי כאן." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — AI Prompt Evaluation
// ─────────────────────────────────────────────────────────────────────────────
const AI_PROMPTS = [
  {
    id: "a",
    label: "פרומפט א׳",
    text: "תנתח לי את הנתונים",
    correct: false,
    score: 1,
    feedback: "פרומפט חלש — אין הקשר, אין מטרה, אין פורמט. ה-AI לא יודע מה לנתח, בשביל מה, או מה המטרה.",
    tags: ["חסר הקשר", "אין מטרה", "אין פורמט"],
  },
  {
    id: "b",
    label: "פרומפט ב׳",
    text: "אני אנליסטית דאטה בחברת SaaS. יש לי נתוני שימוש של 500 לקוחות: תדירות כניסה יומית, זמן שהייה, ומספר תכונות שהשתמשו בהן. תזהה 3 דפוסי שימוש שונים ותסביר מה מייחד כל קבוצה. הפלט: טבלה עם שם דפוס + מאפיינים + ממוצעים.",
    correct: true,
    score: 10,
    feedback: "פרומפט מעולה! יש הקשר (SaaS, 500 לקוחות), מטרה ברורה (3 דפוסים), נתונים מוגדרים, ופורמט פלט ספציפי. ככה ה-AI מייצר תוצאות שמיש.",
    tags: ["הקשר ברור", "מטרה ספציפית", "פורמט מוגדר"],
  },
  {
    id: "c",
    label: "פרומפט ג׳",
    text: "בבקשה עזרי לי להבין למה לקוחות עוזבים",
    correct: false,
    score: 3,
    feedback: "פרומפט בינוני — יש כיוון (Churn) אבל אין נתונים, אין הקשר ספציפי, ואין פורמט. ה-AI יתן תשובה כללית שלא תועיל לניתוח אמיתי.",
    tags: ["כיוון קיים", "חסר נתונים", "חסר פורמט"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — CEO Decision
// ─────────────────────────────────────────────────────────────────────────────
const CEO_FINDINGS = [
  { icon: "📉", text: "המרה ירדה מ-8.2% ל-4.1% בין Q4 2023 ל-Q1 2024" },
  { icon: "📱", text: "67% מהמשתמשים מגיעים ממובייל — אך המרת מובייל רק 1.8%" },
  { icon: "⏱️", text: "זמן טעינה ממוצע ממובייל: 6.2 שניות (benchmark: 2-3 שניות)" },
  { icon: "🔄", text: "72% מהמשתמשים שנטשו — עשו זאת בשלב ה-checkout" },
];

const CEO_OPTIONS = [
  {
    id: "a",
    text: "להוסיף הנחה של 20% לכל המשתמשים",
    correct: false,
    feedback: "הנחה לא תפתור בעיית ביצועים טכניים. אם המשתמש לא הגיע ל-checkout, ההנחה לא רלוונטית. פתרון יקר לבעיה הלא נכונה.",
  },
  {
    id: "b",
    text: "לשפר את ביצועי המובייל ב-checkout — זמן טעינה ו-UX",
    correct: true,
    feedback: "בדיוק! הנתונים מצביעים על בעיית ביצועים מובייל ספציפית ב-checkout. פתרון ממוקד בנקודת הכשל — זו אנליטיקה שמובילה להחלטה נכונה.",
  },
  {
    id: "c",
    text: "להפסיק לשווק למשתמשי מובייל",
    correct: false,
    feedback: "לא נכון — 67% מהתנועה היא מובייל, הפסקת שיווק תפגע קשות. הבעיה אינה ערוץ הרכישה אלא חוויית המוצר.",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// CHART PREVIEW COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════
function LinePreview() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={MONTHLY_DATA} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} />
        <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
        <Line type="monotone" dataKey="users" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3, fill: TEAL }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarPreview() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={MONTHLY_DATA} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} />
        <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
        <Bar dataKey="users" fill={NAVY} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PiePreview() {
  const COLORS = [TEAL, NAVY, ORANGE];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={CATEGORY_DATA} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name} ${value}%`}
          labelLine={false} style={{ fontSize: 9 }}>
          {CATEGORY_DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScatterPreview() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <ScatterChart margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis type="number" dataKey="x" name="ימים" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} />
        <YAxis type="number" dataKey="y" name="הוצאה" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={SCATTER_DATA} fill={ORANGE} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

const CHART_PREVIEW: Record<ChartType, React.ReactNode> = {
  line:    <LinePreview />,
  bar:     <BarPreview />,
  pie:     <PiePreview />,
  scatter: <ScatterPreview />,
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AnalyticsPage() {
  const [phase, setPhase]   = useState<Phase>("intro");
  const [score, setScore]   = useState(0); // out of 5

  // Phase 1
  const [rqAnswer, setRqAnswer]           = useState<string | null>(null);
  const [rqSubmitted, setRqSubmitted]     = useState(false);

  // Phase 2
  const [identifiedRows, setIdentifiedRows] = useState<Set<number>>(new Set());
  const [p2Done, setP2Done]               = useState(false);

  // Phase 3
  const [chartPick, setChartPick]         = useState<ChartType | null>(null);
  const [previewChart, setPreviewChart]   = useState<ChartType>("line");
  const [chartSubmitted, setChartSubmitted] = useState(false);

  // Phase 4
  const [promptPick, setPromptPick]       = useState<string | null>(null);
  const [promptSubmitted, setPromptSubmitted] = useState(false);

  // Phase 5
  const [ceoPick, setCeoPick]             = useState<string | null>(null);
  const [ceoSubmitted, setCeoSubmitted]   = useState(false);

  // ── helpers ────────────────────────────────────────────────────────────────
  function advanceTo(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  const dirtyRows = DIRTY_DATA.filter(r => r.issue !== "ok");
  const identifiedAll = dirtyRows.every(r => identifiedRows.has(r.id));

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen" style={{ background: CREAM, fontFamily: "'Heebo', sans-serif" }}>

      {/* HEADER */}
      <div className="px-5 pt-6 pb-6" style={{ background: NAVY }}>
        <div className="max-w-[600px] mx-auto">
          <Link href="/explore/data/learn" className="text-[11px] font-bold block mb-3 text-white" style={{ opacity: 0.65 }}>
            ← חזרה למרכז הלמידה
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-[28px]">📊</div>
            <div>
              <div className="text-[20px] font-black text-white leading-tight" style={HEEBO}>מה שאנליסטית באמת עושה</div>
              <div className="text-[12px] text-white mt-0.5" style={{ opacity: 0.65 }}>5 שלבים · אנליטיקה בשטח</div>
            </div>
          </div>
          {phase !== "intro" && phase !== "done" && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-white mb-1.5" style={{ opacity: 0.6 }}>
                <span>שלב {phase as number} מתוך 5</span>
                <span>{score} נקודות</span>
              </div>
              <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${((phase as number) / 5) * 100}%`, background: ORANGE }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[600px] mx-auto px-4 py-6 pb-24">

        {/* ── INTRO ─────────────────────────────────────────────────────────── */}
        {phase === "intro" && (
          <div>
            {/* Card 1: Mini-example walkthrough */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[15px] font-black mb-2" style={{ color: NAVY, ...HEEBO }}>
                מה עושה אנליסטית דאטה בעבודה אמיתית?
              </div>
              <div className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(0,0,0,0.65)" }}>
                היא מקבלת שאלה עסקית, חוקרת נתונים — ומביאה המלצה ברורה למנהל.
                הנה דוגמה מלאה, מתחילה לסוף:
              </div>

              <div className="rounded-xl p-4" style={{ background: `${TEAL}07`, border: `1.5px solid ${TEAL}20` }}>
                <div className="text-[10.5px] font-black mb-3 tracking-wider" style={{ color: TEAL }}>
                  דוגמה — חנות ביגוד אונליין: מכירות ירדו 20%
                </div>

                {/* Example Step 1 */}
                <div className="flex gap-3 mb-3.5">
                  <div className="w-[24px] h-[24px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5" style={{ background: TEAL }}>1</div>
                  <div>
                    <div className="text-[12px] font-black mb-0.5" style={{ color: NAVY }}>הגדרת שאלה</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                      המנהל אמר: <span className="font-bold" style={{ color: NAVY }}>"מכירות ירדו."</span><br />
                      האנליסטית שאלה: <span className="font-bold" style={{ color: NAVY }}>"אילו קטגוריות ירדו, ובאיזה שבוע?"</span><br />
                      <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>שאלה מדויקת = ניתוח ממוקד</span>
                    </div>
                  </div>
                </div>

                {/* Example Step 2 */}
                <div className="flex gap-3 mb-3.5">
                  <div className="w-[24px] h-[24px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5" style={{ background: TEAL }}>2</div>
                  <div>
                    <div className="text-[12px] font-black mb-0.5" style={{ color: NAVY }}>ניקוי נתונים</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                      קיבלה קובץ Excel עם 2,000 שורות — 150 תאריכים חסרים, 80 שורות כפולות.<br />
                      ניקתה אותן לפני שהתחילה לנתח.<br />
                      <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>נתונים מלוכלכים = מסקנות שגויות</span>
                    </div>
                  </div>
                </div>

                {/* Example Step 3 */}
                <div className="flex gap-3 mb-3.5">
                  <div className="w-[24px] h-[24px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5" style={{ background: TEAL }}>3</div>
                  <div>
                    <div className="text-[12px] font-black mb-0.5" style={{ color: NAVY }}>ניתוח וגרף</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                      בנתה גרף עמודות לפי קטגוריה.<br />
                      גילתה: <span className="font-bold" style={{ color: NAVY }}>נעליים ירדו 45%</span> — כל השאר יציב.<br />
                      <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>הגרף הנכון חושף את הסיפור</span>
                    </div>
                  </div>
                </div>

                {/* Example Step 4 */}
                <div className="flex gap-3 mb-3.5">
                  <div className="w-[24px] h-[24px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5" style={{ background: TEAL }}>4</div>
                  <div>
                    <div className="text-[12px] font-black mb-0.5" style={{ color: NAVY }}>שאלת AI (בינה מלאכותית)</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                      כתבה פרומפט (הוראה לכלי AI): <span className="font-bold" style={{ color: NAVY }}>"נתוני נעליים לפי שבוע — מה גרם לירידה בשבוע 3?"</span><br />
                      ה-AI הציע 3 כיוונים לבדיקה.<br />
                      <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>פרומפט טוב = תשובה שימושית</span>
                    </div>
                  </div>
                </div>

                {/* Example Step 5 */}
                <div className="flex gap-3">
                  <div className="w-[24px] h-[24px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5" style={{ background: ORANGE }}>5</div>
                  <div>
                    <div className="text-[12px] font-black mb-0.5" style={{ color: NAVY }}>המלצה עסקית</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                      הציגה למנהל: <span className="font-bold" style={{ color: NAVY }}>"הסניקרסים שהוסרו ב-10 ביוני היו 60% מהמכירות — צריך להחזיר אותם."</span><br />
                      <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>זה ההבדל בין נתון להחלטה</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: What you'll do today */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[14px] font-black mb-3" style={{ color: NAVY, ...HEEBO }}>מה תעבדי היום — 5 שלבים</div>
              {[
                ["1", "שאלת המחקר",   "מה בדיוק שואלים לפני שנוגעים בנתונים"],
                ["2", "ניקוי נתונים", "מה עושים כשהנתונים מגיעים עם שגיאות"],
                ["3", "הגרף הנכון",   "איך בוחרים איך להציג מידע"],
                ["4", "AI כלי עבודה", "איך כותבים פרומפטים (הוראות לכלי AI) שמביאות תוצאות"],
                ["5", "לפני המנהל",   "איך הופכים נתונים להמלצה ברורה"],
              ].map(([num, title, sub]) => (
                <div key={num} className="flex items-start gap-3 mb-2.5 last:mb-0">
                  <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black text-white"
                    style={{ background: TEAL }}>{num}</div>
                  <div>
                    <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{title}</div>
                    <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => advanceTo(1)}
              className="w-full py-3.5 rounded-xl text-[14px] font-black text-white"
              style={{ background: NAVY, ...HEEBO }}>
              מתחילים — שלב 1 ←
            </button>
          </div>
        )}

        {/* ── PHASE 1 — Research Question ───────────────────────────────────── */}
        {phase === 1 && (
          <div>
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: TEAL }}>שלב 1 — שאלת המחקר</div>
              <div className="text-[15px] font-black mb-3" style={{ color: NAVY, ...HEEBO }}>לפני שנוגעים בנתונים</div>
              <div className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(0,0,0,0.65)" }}>
                המנכ"ל אמר: <span className="font-bold" style={{ color: NAVY }}>"ירידה במכירות — בדקי!"</span>
                <br />
                <span className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>
                  כל אנליסטית יודעת שלפני שפותחים קובץ אקסל — צריך לנסח שאלת מחקר חדה.
                </span>
              </div>
              <div className="rounded-xl p-3.5 mb-4" style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}25` }}>
                <div className="text-[11.5px] font-bold mb-1" style={{ color: TEAL }}>שאלת מחקר טובה היא:</div>
                <div className="text-[11px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                  ✓ ספציפית — מה בדיוק שואלים<br />
                  ✓ מדידה — ניתן לענות עם נתונים<br />
                  ✓ מוגבלת בזמן ובאוכלוסייה<br />
                  ✓ מובילה להחלטה
                </div>
              </div>
              <div className="text-[12.5px] font-bold mb-3" style={{ color: NAVY }}>
                איזו שאלה מחקר הכי טובה למצב הזה?
              </div>
              <div className="flex flex-col gap-2.5">
                {RQ_OPTIONS.map(opt => {
                  const isSelected = rqAnswer === opt.id;
                  const showResult = rqSubmitted;
                  const isCorrect = opt.correct;
                  let borderColor = "rgba(2,62,138,0.12)";
                  let bg = "#fff";
                  if (showResult && isSelected && isCorrect)  { borderColor = TEAL;   bg = `${TEAL}0d`; }
                  if (showResult && isSelected && !isCorrect) { borderColor = "#e53e3e"; bg = "#fff5f5"; }
                  if (showResult && !isSelected && isCorrect) { borderColor = TEAL;   bg = `${TEAL}08`; }
                  return (
                    <button key={opt.id} onClick={() => !rqSubmitted && setRqAnswer(opt.id)}
                      className="text-right rounded-xl p-3.5 transition-all duration-150"
                      style={{ background: isSelected && !showResult ? `${NAVY}0a` : bg, border: `1.5px solid ${isSelected && !showResult ? NAVY : borderColor}` }}>
                      <div className="text-[12.5px] leading-snug" style={{ color: NAVY }}>{opt.text}</div>
                      {showResult && (isSelected || isCorrect) && (
                        <div className="mt-2 text-[11px] leading-snug" style={{ color: isCorrect ? TEAL : "#e53e3e" }}>
                          {isCorrect ? "✓ " : "✗ "}{opt.feedback}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!rqSubmitted ? (
              <button
                onClick={() => {
                  if (!rqAnswer) return;
                  setRqSubmitted(true);
                  const chosen = RQ_OPTIONS.find(o => o.id === rqAnswer);
                  if (chosen?.correct) setScore(s => s + 1);
                }}
                disabled={!rqAnswer}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition-opacity"
                style={{ background: NAVY, opacity: rqAnswer ? 1 : 0.4, ...HEEBO }}>
                בדקי תשובה
              </button>
            ) : (
              <button onClick={() => advanceTo(2)}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white"
                style={{ background: NAVY, ...HEEBO }}>
                שלב 2 — ניקוי נתונים ←
              </button>
            )}
          </div>
        )}

        {/* ── PHASE 2 — Data Cleaning ───────────────────────────────────────── */}
        {phase === 2 && (
          <div>
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: TEAL }}>שלב 2 — ניקוי נתונים</div>
              <div className="text-[15px] font-black mb-2" style={{ color: NAVY, ...HEEBO }}>הנתונים הגיעו — ועכשיו?</div>
              <div className="text-[12.5px] leading-relaxed mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
                מחלקת ה-IT שלחה קובץ עם נתוני לקוחות. בנתונים האלה יש 4 בעיות קלאסיות.
                <br />
                <span className="font-bold" style={{ color: NAVY }}>לחצי על כל שורה חשודה</span> כדי לגלות מה הבעיה ומה עושים.
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(2,62,138,0.1)" }}>
                <table className="w-full text-right">
                  <thead>
                    <tr style={{ background: `${NAVY}08` }}>
                      {["שם", "גיל", "רכישה (₪)"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[11px] font-bold" style={{ color: NAVY }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DIRTY_DATA.map(row => {
                      const isIdentified = identifiedRows.has(row.id);
                      const hasProblem = row.issue !== "ok";
                      return (
                        <React.Fragment key={row.id}>
                          <tr
                            onClick={() => {
                              if (!hasProblem || p2Done) return;
                              setIdentifiedRows(prev => new Set([...prev, row.id]));
                            }}
                            className="transition-all duration-150"
                            style={{
                              cursor: hasProblem && !p2Done ? "pointer" : "default",
                              background: isIdentified ? `${TEAL}0d` : hasProblem ? "#fff8f0" : "#fff",
                              borderBottom: "1px solid rgba(2,62,138,0.06)",
                            }}>
                            <td className="px-3 py-2.5 text-[12px]" style={{ color: NAVY }}>
                              {row.name}
                              {hasProblem && !isIdentified && (
                                <span className="mr-1.5 text-[10px] font-bold" style={{ color: ORANGE }}>!</span>
                              )}
                              {isIdentified && (
                                <span className="mr-1.5 text-[10px]" style={{ color: TEAL }}>✓</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-[12px]" style={{ color: row.issue === "null" || row.issue === "outlier" ? "#e53e3e" : "rgba(0,0,0,0.6)" }}>
                              {row.age}
                            </td>
                            <td className="px-3 py-2.5 text-[12px]" style={{ color: row.issue === "wrong_type" ? "#e53e3e" : "rgba(0,0,0,0.6)" }}>
                              {row.purchase}
                            </td>
                          </tr>
                          {isIdentified && (
                            <tr style={{ background: `${TEAL}0a` }}>
                              <td colSpan={3} className="px-3 py-2 text-[11px]" style={{ color: TEAL }}>
                                <span className="font-bold">{row.issueLabel}:</span> {row.action}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-[11px] text-center" style={{ color: "rgba(0,0,0,0.4)" }}>
                {identifiedRows.size < dirtyRows.length
                  ? `זיהית ${identifiedRows.size} מתוך 4 בעיות`
                  : "זיהית את כל הבעיות! 🎉"}
              </div>
            </div>

            {!p2Done ? (
              <button
                onClick={() => {
                  setP2Done(true);
                  if (identifiedAll) setScore(s => s + 1);
                }}
                disabled={!identifiedAll}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition-opacity"
                style={{ background: NAVY, opacity: identifiedAll ? 1 : 0.4, ...HEEBO }}>
                {identifiedAll ? "סיימתי לנקות — המשיכי" : `זיהי עוד ${dirtyRows.length - identifiedRows.size} בעיות`}
              </button>
            ) : (
              <>
                <div className="rounded-xl p-3.5 mb-3" style={{ background: `${TEAL}0d`, border: `1.5px solid ${TEAL}30` }}>
                  <div className="text-[12px] font-bold mb-1" style={{ color: TEAL }}>
                    {identifiedAll ? "🎉 מצוין — זיהית את כל 4 הבעיות!" : "טוב! ראי מה פספסת:"}
                  </div>
                  <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                    בממוצע, <span className="font-bold">20-40% מזמן עבודת אנליסטית</span> הולך לניקוי נתונים.
                    נתונים לא נקיים = מסקנות שגויות = החלטות גרועות.
                  </div>
                </div>
                <button onClick={() => advanceTo(3)}
                  className="w-full py-3.5 rounded-xl text-[14px] font-black text-white"
                  style={{ background: NAVY, ...HEEBO }}>
                  שלב 3 — הגרף הנכון ←
                </button>
              </>
            )}
          </div>
        )}

        {/* ── PHASE 3 — Chart Selection ─────────────────────────────────────── */}
        {phase === 3 && (
          <div>
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: TEAL }}>שלב 3 — הגרף הנכון</div>
              <div className="text-[15px] font-black mb-2" style={{ color: NAVY, ...HEEBO }}>ויזואליזציה שמספרת סיפור</div>
              <div className="text-[12.5px] leading-relaxed mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
                {CHART_SCENARIO.question}
              </div>

              {/* Chart preview area */}
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex gap-2 mb-3">
                  {(["line", "bar", "pie", "scatter"] as ChartType[]).map(t => {
                    const opt = CHART_SCENARIO.options.find(o => o.type === t)!;
                    return (
                      <button key={t} onClick={() => setPreviewChart(t)}
                        className="flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all duration-150"
                        style={{
                          background: previewChart === t ? NAVY : "transparent",
                          color: previewChart === t ? "#fff" : "rgba(0,0,0,0.45)",
                          border: `1px solid ${previewChart === t ? NAVY : "rgba(0,0,0,0.1)"}`,
                        }}>
                        {opt.emoji} {opt.label}
                      </button>
                    );
                  })}
                </div>
                {CHART_PREVIEW[previewChart]}
              </div>

              <div className="text-[12.5px] font-bold mb-2.5" style={{ color: NAVY }}>
                איזה גרף הכי מתאים למגמה חודשית?
              </div>
              <div className="flex flex-col gap-2">
                {CHART_SCENARIO.options.map(opt => {
                  const isSelected = chartPick === opt.type;
                  const showResult = chartSubmitted;
                  const isCorrect = opt.type === CHART_SCENARIO.correct;
                  let borderColor = "rgba(2,62,138,0.12)";
                  let bg = "#fff";
                  if (showResult && isSelected && isCorrect)  { borderColor = TEAL;   bg = `${TEAL}0d`; }
                  if (showResult && isSelected && !isCorrect) { borderColor = "#e53e3e"; bg = "#fff5f5"; }
                  if (showResult && !isSelected && isCorrect) { borderColor = TEAL;   bg = `${TEAL}08`; }
                  return (
                    <button key={opt.type}
                      onClick={() => {
                        if (!chartSubmitted) { setChartPick(opt.type); setPreviewChart(opt.type); }
                      }}
                      className="text-right rounded-xl p-3 transition-all duration-150"
                      style={{ background: isSelected && !showResult ? `${NAVY}0a` : bg, border: `1.5px solid ${isSelected && !showResult ? NAVY : borderColor}` }}>
                      <div className="text-[12.5px]" style={{ color: NAVY }}>{opt.emoji} {opt.label}</div>
                      {showResult && (isSelected || isCorrect) && (
                        <div className="mt-1.5 text-[11px] leading-snug" style={{ color: isCorrect ? TEAL : "#e53e3e" }}>
                          {isCorrect ? "✓ " : "✗ "}{opt.why}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!chartSubmitted ? (
              <button
                onClick={() => {
                  if (!chartPick) return;
                  setChartSubmitted(true);
                  if (chartPick === CHART_SCENARIO.correct) setScore(s => s + 1);
                }}
                disabled={!chartPick}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition-opacity"
                style={{ background: NAVY, opacity: chartPick ? 1 : 0.4, ...HEEBO }}>
                בדקי תשובה
              </button>
            ) : (
              <button onClick={() => advanceTo(4)}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white"
                style={{ background: NAVY, ...HEEBO }}>
                שלב 4 — AI כלי עבודה ←
              </button>
            )}
          </div>
        )}

        {/* ── PHASE 4 — AI Prompt Evaluation ───────────────────────────────── */}
        {phase === 4 && (
          <div>
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: TEAL }}>שלב 4 — AI כלי עבודה</div>
              <div className="text-[15px] font-black mb-2" style={{ color: NAVY, ...HEEBO }}>הפרומפט קובע הכל</div>
              <div className="text-[12.5px] leading-relaxed mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
                החלטת להשתמש ב-AI לניתוח דפוסי שימוש. שלוש קולגות כתבו שלושה פרומפטים שונים.
                <br />
                <span className="font-bold" style={{ color: NAVY }}>איזה פרומפט יביא את התוצאה הכי שימושית?</span>
              </div>
              <div className="flex flex-col gap-3">
                {AI_PROMPTS.map(prompt => {
                  const isSelected = promptPick === prompt.id;
                  const showResult = promptSubmitted;
                  const isCorrect = prompt.correct;
                  let borderColor = "rgba(2,62,138,0.12)";
                  let bg = "#fff";
                  if (showResult && isSelected && isCorrect)  { borderColor = TEAL;   bg = `${TEAL}0d`; }
                  if (showResult && isSelected && !isCorrect) { borderColor = "#e53e3e"; bg = "#fff5f5"; }
                  if (showResult && !isSelected && isCorrect) { borderColor = TEAL;   bg = `${TEAL}08`; }
                  return (
                    <button key={prompt.id} onClick={() => !promptSubmitted && setPromptPick(prompt.id)}
                      className="text-right rounded-xl p-4 transition-all duration-150"
                      style={{ background: isSelected && !showResult ? `${NAVY}0a` : bg, border: `1.5px solid ${isSelected && !showResult ? NAVY : borderColor}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[11px] font-bold" style={{ color: TEAL }}>{prompt.label}</div>
                        {showResult && (
                          <div className="flex gap-1">
                            {prompt.tags.map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: isCorrect ? `${TEAL}15` : `${NAVY}10`, color: isCorrect ? TEAL : "#666" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="rounded-lg px-3 py-2.5 text-[11.5px] leading-relaxed text-right"
                        style={{ background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.7)", fontFamily: "monospace", direction: "rtl" }}>
                        "{prompt.text}"
                      </div>
                      {showResult && (isSelected || isCorrect) && (
                        <div className="mt-2.5 text-[11px] leading-snug" style={{ color: isCorrect ? TEAL : "#e53e3e" }}>
                          {isCorrect ? "✓ " : "✗ "}{prompt.feedback}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!promptSubmitted ? (
              <button
                onClick={() => {
                  if (!promptPick) return;
                  setPromptSubmitted(true);
                  const chosen = AI_PROMPTS.find(p => p.id === promptPick);
                  if (chosen?.correct) setScore(s => s + 1);
                }}
                disabled={!promptPick}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition-opacity"
                style={{ background: NAVY, opacity: promptPick ? 1 : 0.4, ...HEEBO }}>
                בדקי תשובה
              </button>
            ) : (
              <button onClick={() => advanceTo(5)}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white"
                style={{ background: NAVY, ...HEEBO }}>
                שלב 5 — לפני המנכ״ל ←
              </button>
            )}
          </div>
        )}

        {/* ── PHASE 5 — CEO Decision ────────────────────────────────────────── */}
        {phase === 5 && (
          <div>
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: TEAL }}>שלב 5 — לפני המנכ״ל</div>
              <div className="text-[15px] font-black mb-2" style={{ color: NAVY, ...HEEBO }}>הסיפור שהנתונים מספרים</div>
              <div className="text-[12.5px] leading-relaxed mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
                ניתחת, ניקית, ויזואליזת. עכשיו הישיבה עם המנכ"ל. הממצאים:
              </div>

              {/* Findings */}
              <div className="flex flex-col gap-2 mb-5">
                {CEO_FINDINGS.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: `${NAVY}06`, border: `1px solid ${NAVY}12` }}>
                    <div className="text-[18px] shrink-0">{f.icon}</div>
                    <div className="text-[12px] leading-snug" style={{ color: NAVY }}>{f.text}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart showing mobile vs desktop conversion */}
              <div className="rounded-xl p-3 mb-5" style={{ background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="text-[11px] font-bold mb-2" style={{ color: NAVY }}>המרה לפי ערוץ:</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={[
                    { name: "דסקטופ", rate: 6.8 },
                    { name: "מובייל", rate: 1.8 },
                    { name: "טאבלט", rate: 3.2 },
                  ]} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.5)" }} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} formatter={(v) => [`${v}%`, "המרה"]} />
                    <Bar dataKey="rate" fill={NAVY} radius={[4, 4, 0, 0]}>
                      <Cell fill="#e53e3e" />
                      <Cell fill={TEAL} />
                      <Cell fill={TEAL} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-[10px] text-center mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>אדום = בעיה עיקרית</div>
              </div>

              <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>
                המנכ"ל שואל: "מה ההמלצה שלך?"
              </div>
              <div className="flex flex-col gap-2.5">
                {CEO_OPTIONS.map(opt => {
                  const isSelected = ceoPick === opt.id;
                  const showResult = ceoSubmitted;
                  const isCorrect = opt.correct;
                  let borderColor = "rgba(2,62,138,0.12)";
                  let bg = "#fff";
                  if (showResult && isSelected && isCorrect)  { borderColor = TEAL;   bg = `${TEAL}0d`; }
                  if (showResult && isSelected && !isCorrect) { borderColor = "#e53e3e"; bg = "#fff5f5"; }
                  if (showResult && !isSelected && isCorrect) { borderColor = TEAL;   bg = `${TEAL}08`; }
                  return (
                    <button key={opt.id} onClick={() => !ceoSubmitted && setCeoPick(opt.id)}
                      className="text-right rounded-xl p-3.5 transition-all duration-150"
                      style={{ background: isSelected && !showResult ? `${NAVY}0a` : bg, border: `1.5px solid ${isSelected && !showResult ? NAVY : borderColor}` }}>
                      <div className="text-[12.5px] leading-snug" style={{ color: NAVY }}>{opt.text}</div>
                      {showResult && (isSelected || isCorrect) && (
                        <div className="mt-2 text-[11px] leading-snug" style={{ color: isCorrect ? TEAL : "#e53e3e" }}>
                          {isCorrect ? "✓ " : "✗ "}{opt.feedback}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!ceoSubmitted ? (
              <button
                onClick={() => {
                  if (!ceoPick) return;
                  setCeoSubmitted(true);
                  const chosen = CEO_OPTIONS.find(o => o.id === ceoPick);
                  if (chosen?.correct) setScore(s => s + 1);
                }}
                disabled={!ceoPick}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition-opacity"
                style={{ background: NAVY, opacity: ceoPick ? 1 : 0.4, ...HEEBO }}>
                זו המלצתי
              </button>
            ) : (
              <button onClick={() => advanceTo("done")}
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white"
                style={{ background: NAVY, ...HEEBO }}>
                לסיכום ←
              </button>
            )}
          </div>
        )}

        {/* ── DONE ──────────────────────────────────────────────────────────── */}
        {phase === "done" && (
          <div>
            <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 14px rgba(2,62,138,0.07)" }}>
              <div className="text-[48px] mb-3">
                {score >= 4 ? "🏆" : score >= 2 ? "⭐" : "💡"}
              </div>
              <div className="text-[22px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>
                {score >= 4 ? "אנליסטית מעולה!" : score >= 2 ? "על הדרך הנכונה" : "בסיס טוב להתחיל"}
              </div>
              <div className="text-[14px] mb-5" style={{ color: "rgba(0,0,0,0.5)" }}>
                {score} מתוך 5 נכון
              </div>

              {/* Score bar */}
              <div className="h-[8px] rounded-full mb-6" style={{ background: "rgba(2,62,138,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(score / 5) * 100}%`, background: score >= 4 ? TEAL : score >= 2 ? ORANGE : "#e53e3e" }} />
              </div>

              {/* What you covered */}
              <div className="text-right">
                <div className="text-[12px] font-bold mb-3" style={{ color: NAVY }}>מה כיסית היום:</div>
                {[
                  ["✓", "שאלת מחקר", "נסחת שאלה ספציפית, מדידה, ועם כיוון להחלטה"],
                  ["✓", "ניקוי נתונים", "זיהית כפולות, ערכי null, חריגים, וסוגים שגויים"],
                  ["✓", "ויזואליזציה", "בחרת גרף מתאים לסוג הנתון שיש לך"],
                  ["✓", "AI Prompting", "למדת מה הופך פרומפט לכלי עבודה אמיתי"],
                  ["✓", "המלצה עסקית", "תרגמת נתונים להחלטה שהמנכ\"ל יכול לפעול לפיה"],
                ].map(([check, title, sub]) => (
                  <div key={title} className="flex items-start gap-3 mb-3">
                    <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black text-white"
                      style={{ background: TEAL }}>{check}</div>
                    <div>
                      <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{title}</div>
                      <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl p-3.5 text-right" style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}25` }}>
                <div className="text-[11.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
                  אנליסטית דאטה לא עובדת רק עם מספרים — היא <span className="font-bold" style={{ color: TEAL }}>מספרת סיפורים שמובילים להחלטות</span>.
                  זה מה שעשית עכשיו.
                </div>
              </div>
            </div>

            <Link href="/explore/data/learn" className="block">
              <button className="w-full py-3.5 rounded-xl text-[14px] font-black text-white mb-3"
                style={{ background: NAVY, ...HEEBO }}>
                ← חזרה למרכז הלמידה
              </button>
            </Link>
            <Link href="/explore/data/learn/mystery" className="block">
              <button className="w-full py-3.5 rounded-xl text-[14px] font-black"
                style={{ background: "transparent", border: `2px solid ${NAVY}30`, color: NAVY, ...HEEBO }}>
                מודול SQL — חקירת ההדלפה 🕵️
              </button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
