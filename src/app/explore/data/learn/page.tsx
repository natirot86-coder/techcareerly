"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const TEAL = "#0d9488";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE METADATA
// ─────────────────────────────────────────────────────────────────────────────

const MODULES = [
  { id: 0, emoji: "🔍", title: "בלשית הנתונים",   type: "חקירה",          minutes: 5 },
  { id: 1, emoji: "📊", title: "גרף שבור",         type: "זיהוי שגיאה",   minutes: 3 },
  { id: 2, emoji: "💬", title: "מה הסיפור?",       type: "תובנה",          minutes: 3 },
  { id: 3, emoji: "🔮", title: "חזי את הנתון",     type: "חיזוי",          minutes: 3 },
  { id: 4, emoji: "🗂️", title: "שמרי / זרקי",     type: "מיון נתונים",   minutes: 4 },
  { id: 5, emoji: "📋", title: "בנאית הדשבורד",    type: "בנייה",          minutes: 5 },
  { id: 6, emoji: "🏢", title: "יועצת ה-CEO",      type: "החלטה עסקית",  minutes: 6 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 0 — בלשית הנתונים (Investigation / tap-to-reveal)
// ─────────────────────────────────────────────────────────────────────────────

const CLUES = [
  {
    id: "sales",
    icon: "📉",
    title: "גרף מכירות שבועי",
    summary: "ירידה חדה של 30% בשבוע האחרון",
    detail: "יאנ 82K → פבר 85K → מרץ 91K → אפר 64K\nירידה חדה החלה בשבוע הראשון של אפריל.",
  },
  {
    id: "traffic",
    icon: "📱",
    title: "מקורות תנועה לאתר",
    summary: "62% מהגולשים מגיעים ממובייל",
    detail: "Mobile: 62%  |  Desktop: 31%  |  Tablet: 7%\nגידול של 18% בתנועת מובייל ב-3 חודשים אחרונים.",
  },
  {
    id: "conversion",
    icon: "📈",
    title: "שיעור המרה לפי מכשיר",
    summary: "פערים גדולים בין מובייל לדסקטופ",
    detail: "Desktop: 4.2% המרה\nMobile: 1.1% המרה\nTablet: 2.8% המרה\n62% מהתנועה — אבל רק 1.1% קונים!",
  },
  {
    id: "reviews",
    icon: "⭐",
    title: "ביקורות לקוחות (חודש אחרון)",
    summary: "שיא של תלונות על חוויית מובייל",
    detail: "\"האתר לא נטען טוב בטלפון\" — 34 ביקורות\n\"כפתור הקנייה נעלם\" — 19 ביקורות\n\"נסיון לשלם — לא עבד\" — 28 ביקורות",
  },
];

const CONCLUSIONS = [
  { text: "מחיר המוצרים גבוה מדי — לקוחות לא קונים", correct: false },
  { text: "חוויית המובייל גרועה — 62% מגיעים ממובייל אבל רק 1.1% קונים", correct: true },
  { text: "המתחרים השיקו קמפיין מוצלח יותר", correct: false },
];

function Module0({ onComplete }: { onComplete: () => void }) {
  const [revealed, setRevealead] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"clues" | "conclude" | "done">("clues");
  const [chosen, setChosen] = useState<number | null>(null);

  const allRevealed = revealed.size === CLUES.length;

  function revealClue(id: string) {
    setRevealead(prev => new Set([...prev, id]));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.6)" }}>
        חנות אונליין — מכירות ירדו 30% בחודש האחרון. יש לך 4 ראיות. לחצי על כל אחת לחשוף את הנתונים.
      </div>

      {phase === "clues" && (
        <>
          <div className="flex flex-col gap-3">
            {CLUES.map(clue => {
              const isOpen = revealed.has(clue.id);
              return (
                <button
                  key={clue.id}
                  type="button"
                  onClick={() => revealClue(clue.id)}
                  className="text-right w-full"
                >
                  <div
                    className="rounded-xl p-4 transition-all duration-200"
                    style={{
                      background: isOpen ? "rgba(13,148,136,0.06)" : "#fff",
                      border: isOpen ? `1.5px solid ${TEAL}40` : "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-[22px] shrink-0">{clue.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-[13.5px] font-bold" style={{ color: "#023e8a", ...HEEBO }}>{clue.title}</div>
                          {!isOpen && (
                            <div className="text-[11px] px-2 py-1 rounded-full font-bold"
                              style={{ background: "rgba(13,148,136,0.1)", color: TEAL }}>
                              לחשיפה
                            </div>
                          )}
                        </div>
                        {isOpen ? (
                          <pre className="text-[12px] mt-2 leading-[1.7] whitespace-pre-wrap"
                            style={{ color: "rgba(0,0,0,0.65)", fontFamily: "inherit" }}>
                            {clue.detail}
                          </pre>
                        ) : (
                          <div className="text-[12px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>{clue.summary}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {allRevealed && (
            <button
              type="button"
              onClick={() => setPhase("conclude")}
              className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
              style={{ background: TEAL, ...HEEBO }}
            >
              ראיתי הכל — מה המסקנה? ←
            </button>
          )}
          {!allRevealed && (
            <div className="text-center text-[12px]" style={{ color: "rgba(0,0,0,0.35)" }}>
              {CLUES.length - revealed.size} ראיות נותרו לחשיפה
            </div>
          )}
        </>
      )}

      {phase === "conclude" && (
        <div className="flex flex-col gap-3">
          <div className="text-[15px] font-bold mb-1" style={{ color: "#023e8a", ...HEEBO }}>
            מה לדעתך גרם לירידה במכירות?
          </div>
          {CONCLUSIONS.map((c, i) => {
            const isSelected = chosen === i;
            const showResult = chosen !== null;
            return (
              <button
                key={i}
                type="button"
                disabled={showResult}
                onClick={() => { setChosen(i); setPhase("done"); }}
                className="text-right w-full"
              >
                <div
                  className="rounded-xl px-4 py-3 text-[13px] leading-[1.6] transition-all"
                  style={{
                    background: !showResult ? "#fff"
                      : isSelected && c.correct ? "rgba(34,197,94,0.08)"
                      : isSelected && !c.correct ? "rgba(220,38,38,0.07)"
                      : c.correct ? "rgba(34,197,94,0.04)"
                      : "#fff",
                    border: !showResult ? "1px solid rgba(0,0,0,0.08)"
                      : isSelected && c.correct ? "1.5px solid rgba(34,197,94,0.4)"
                      : isSelected && !c.correct ? "1.5px solid rgba(220,38,38,0.3)"
                      : c.correct ? "1.5px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(0,0,0,0.06)",
                    color: "rgba(0,0,0,0.75)",
                  }}
                >
                  {c.text}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {phase === "done" && chosen !== null && (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl px-4 py-4 text-[13px] leading-[1.7]"
            style={{
              background: CONCLUSIONS[chosen].correct ? "rgba(34,197,94,0.07)" : "rgba(220,38,38,0.06)",
              border: `1.5px solid ${CONCLUSIONS[chosen].correct ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.25)"}`,
              color: CONCLUSIONS[chosen].correct ? "#1a6b34" : "#b02020",
            }}
          >
            {CONCLUSIONS[chosen].correct
              ? "✓ מצוין! הראיה המכריעה: ציר ה-Conversion לפי מכשיר. 62% מהגולשים ממובייל — אבל רק 1.1% קונים (לעומת 4.2% בדסקטופ). הבעיה טכנית, לא תמחורית."
              : "✗ לא בדיוק. הסתכלי על ראיה 3: Desktop 4.2% לעומת Mobile 1.1%. 62% מהתנועה היא מובייל — שם הבעיה."}
          </div>
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
            style={{ background: "rgba(13,148,136,0.06)", color: "rgba(0,0,0,0.6)" }}>
            <span className="font-bold">מה למדת:</span> אנליסטית טובה לא מסתפקת בנתון אחד — היא מצלבת מקורות. כאן: תנועה + המרה + ביקורות = תמונה מלאה.
          </div>
          <button type="button" onClick={onComplete}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: TEAL, ...HEEBO }}>
            סיימתי ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — גרף שבור (Spot the Error)
// ─────────────────────────────────────────────────────────────────────────────

const BAD_BARS = [
  { label: "ינואר", val: 97 },
  { label: "פברואר", val: 98 },
  { label: "מרץ", val: 100 },
  { label: "אפריל", val: 102 },
];

const GOOD_BARS = [
  { label: "ינואר", val: 97 },
  { label: "פברואר", val: 98 },
  { label: "מרץ", val: 100 },
  { label: "אפריל", val: 102 },
];

const BAR_AREA_H = 72; // px — fixed height for bars

function BarChart({ bars, yMin, yMax, color, label }: {
  bars: { label: string; val: number }[];
  yMin: number; yMax: number;
  color: string; label: string;
}) {
  const range = yMax - yMin;
  return (
    <div>
      <div className="text-[11px] font-bold mb-2 text-center" style={{ color: "rgba(0,0,0,0.5)" }}>{label}</div>
      <div className="flex items-end gap-2 px-1" style={{ height: `${BAR_AREA_H + 28}px` }}>
        {bars.map((b, i) => {
          const barH = Math.max(((b.val - yMin) / range) * BAR_AREA_H, 3);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div className="text-[9px]" style={{ color: "rgba(0,0,0,0.5)" }}>{b.val}</div>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${barH}px`, background: color }}
              />
              <div className="text-[9px]" style={{ color: "rgba(0,0,0,0.45)" }}>{b.label}</div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] mt-1 px-1" style={{ color: "rgba(0,0,0,0.35)" }}>
        <span>↑ {yMax}</span>
        <span>{yMin} ↓</span>
      </div>
    </div>
  );
}

const ERROR_OPTIONS = [
  { text: "הצבעים לא ידידותיים לעיוורי צבעים", correct: false },
  { text: "ציר ה-Y מתחיל מ-95 ולא מ-0 — שינוי קטן נראה ענק", correct: true },
  { text: "חסר כותרת לגרף", correct: false },
];

function Module1({ onComplete }: { onComplete: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const showResult = chosen !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.6)" }}>
        הגרף הזה הוצג לדירקטוריון. מה הבעיה בו?
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <BarChart bars={BAD_BARS} yMin={95} yMax={103} color="#0d9488" label="מכירות חודשיות (₪ אלפים)" />
      </div>

      <div className="flex flex-col gap-[9px]">
        {ERROR_OPTIONS.map((opt, i) => {
          const isSelected = chosen === i;
          return (
            <button
              key={i}
              type="button"
              disabled={showResult}
              onClick={() => setChosen(i)}
              className="text-right w-full"
            >
              <div
                className="rounded-xl px-4 py-3 text-[13px] leading-[1.6] transition-all"
                style={{
                  background: !showResult ? "#fff"
                    : isSelected && opt.correct ? "rgba(34,197,94,0.08)"
                    : isSelected && !opt.correct ? "rgba(220,38,38,0.07)"
                    : opt.correct ? "rgba(34,197,94,0.04)"
                    : "#fff",
                  border: !showResult ? "1px solid rgba(0,0,0,0.08)"
                    : isSelected && opt.correct ? "1.5px solid rgba(34,197,94,0.4)"
                    : isSelected && !opt.correct ? "1.5px solid rgba(220,38,38,0.3)"
                    : opt.correct ? "1.5px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(0,0,0,0.06)",
                  color: "rgba(0,0,0,0.75)",
                }}
              >
                {opt.text}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl px-4 py-4 text-[13px] leading-[1.7]"
            style={{
              background: ERROR_OPTIONS[chosen].correct ? "rgba(34,197,94,0.07)" : "rgba(220,38,38,0.06)",
              border: `1.5px solid ${ERROR_OPTIONS[chosen].correct ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.25)"}`,
              color: ERROR_OPTIONS[chosen].correct ? "#1a6b34" : "#b02020",
            }}>
            {ERROR_OPTIONS[chosen].correct
              ? "✓ נכון! זו שגיאה קלאסית בויזואליזציה — Truncated Y-axis. שינוי של 5% נראה כמו עלייה דרמטית של 300%."
              : "✗ לא זו הבעיה העיקרית. שימי לב לציר Y — הוא מתחיל ב-95, לא ב-0!"}
          </div>

          <div className="text-[12px] font-bold mb-1" style={{ color: "rgba(0,0,0,0.5)" }}>גרף מתוקן (ציר מ-0):</div>
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid rgba(34,197,94,0.3)" }}>
            <BarChart bars={GOOD_BARS} yMin={0} yMax={110} color="#0d9488" label="מכירות חודשיות (₪ אלפים)" />
          </div>

          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
            style={{ background: "rgba(13,148,136,0.06)", color: "rgba(0,0,0,0.6)" }}>
            <span className="font-bold">מה למדת:</span> תמיד שאלי "מאיפה מתחיל ציר Y?" — גרפים עם ציר חתוך מגזימים בפערים ויכולים להטעות.
          </div>
          <button type="button" onClick={onComplete}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: TEAL, ...HEEBO }}>
            סיימתי ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — מה הסיפור? (Insight Extraction)
// ─────────────────────────────────────────────────────────────────────────────

const TREND_DATA = [
  { label: "יאנ", val: 42 },
  { label: "פבר", val: 38 },
  { label: "מרץ", val: 51 },
  { label: "אפר", val: 55 },
  { label: "מאי", val: 53 },
  { label: "יונ", val: 60 },
  { label: "יול", val: 65 },
  { label: "אוג", val: 91 },
  { label: "ספט", val: 72 },
];

function LineChart({ data }: { data: { label: string; val: number }[] }) {
  const max = Math.max(...data.map(d => d.val));
  const min = Math.min(...data.map(d => d.val));
  const range = max - min;
  const W = 320; const H = 90; const PAD = 16;
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + ((max - d.val) / range) * (H - PAD * 2),
    label: d.label,
    val: d.val,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ direction: "ltr" }}>
      <path d={pathD} stroke={TEAL} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={p.val === 91 ? "#fb8500" : TEAL} />
          <text x={p.x} y={H + 14} textAnchor="middle" fontSize="8" fill="rgba(0,0,0,0.45)">{p.label}</text>
        </g>
      ))}
      <text x={pts[7].x} y={pts[7].y - 9} textAnchor="middle" fontSize="8" fill="#fb8500" fontWeight="bold">שיא!</text>
    </svg>
  );
}

const INSIGHTS = [
  { text: "המכירות עלו במהלך השנה", correct: false, why: "נכון חלקית, אבל לא מסביר את הירידה בספטמבר ולא מספיק ספציפי לקבלת החלטה." },
  { text: "ספטמבר היה חודש גרוע — כדאי לבדוק מה קרה", correct: false, why: "נכון אבל חסר הקשר — לא מסביר למה ספטמבר נמוך ביחס לאוגוסט." },
  { text: "אוגוסט היה שיא (91K), אבל הטרנד ירד בספטמבר — ייתכן עונתיות שדורשת בדיקה", correct: true, why: "✓ מצוין! משפט תובנה טוב כולל: מה קרה, מתי, ומה כדאי לבדוק אחר כך." },
];

function Module2({ onComplete }: { onComplete: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const showResult = chosen !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.6)" }}>
        ראי את הגרף הבא. איזה משפט מסכם הכי טוב את הסיפור שהנתונים מספרים?
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="text-[11px] font-bold mb-3 text-center" style={{ color: "rgba(0,0,0,0.45)" }}>מכירות חודשיות 2024 (₪ אלפים)</div>
        <LineChart data={TREND_DATA} />
      </div>

      <div className="flex flex-col gap-[9px]">
        {INSIGHTS.map((opt, i) => {
          const isSelected = chosen === i;
          return (
            <button key={i} type="button" disabled={showResult} onClick={() => setChosen(i)} className="text-right w-full">
              <div
                className="rounded-xl px-4 py-3 text-[13px] leading-[1.6] transition-all"
                style={{
                  background: !showResult ? "#fff"
                    : isSelected && opt.correct ? "rgba(34,197,94,0.08)"
                    : isSelected && !opt.correct ? "rgba(220,38,38,0.07)"
                    : opt.correct ? "rgba(34,197,94,0.04)"
                    : "#fff",
                  border: !showResult ? "1px solid rgba(0,0,0,0.08)"
                    : isSelected && opt.correct ? "1.5px solid rgba(34,197,94,0.4)"
                    : isSelected && !opt.correct ? "1.5px solid rgba(220,38,38,0.3)"
                    : opt.correct ? "1.5px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(0,0,0,0.06)",
                  color: "rgba(0,0,0,0.75)",
                }}
              >
                {opt.text}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && chosen !== null && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl px-4 py-4 text-[13px] leading-[1.7]"
            style={{
              background: INSIGHTS[chosen].correct ? "rgba(34,197,94,0.07)" : "rgba(251,133,0,0.07)",
              border: `1.5px solid ${INSIGHTS[chosen].correct ? "rgba(34,197,94,0.3)" : "rgba(251,133,0,0.3)"}`,
              color: INSIGHTS[chosen].correct ? "#1a6b34" : "#7a4500",
            }}>
            {INSIGHTS[chosen].why}
          </div>
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
            style={{ background: "rgba(13,148,136,0.06)", color: "rgba(0,0,0,0.6)" }}>
            <span className="font-bold">מה למדת:</span> תובנה טובה = מה קרה + מתי + מה כדאי לעשות אחר כך. לא רק "עלה" או "ירד".
          </div>
          <button type="button" onClick={onComplete}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: TEAL, ...HEEBO }}>
            סיימתי ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — חזי את הנתון הבא (Prediction)
// ─────────────────────────────────────────────────────────────────────────────

const PAST_DATA = [
  { label: "ינואר", val: 12000 },
  { label: "פברואר", val: 9500 },
  { label: "מרץ", val: 15000 },
  { label: "אפריל", val: 13000 },
];

const RANGES = [
  { label: "מתחת ל-9,000", min: 0, max: 9000, correct: false },
  { label: "9,000 – 12,000", min: 9000, max: 12000, correct: false },
  { label: "12,000 – 16,000", min: 12000, max: 16000, correct: true },
  { label: "מעל 16,000", min: 16000, max: 99999, correct: false },
];

function Module3({ onComplete }: { onComplete: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const showResult = chosen !== null;
  const REAL = 14200;

  const allData = [...PAST_DATA, { label: "מאי (חיזוי)", val: REAL }];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.6)" }}>
        ראי את נתוני המכירות של 4 חודשים. מה לדעתך יהיה הנתון של מאי?
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="text-[11px] font-bold mb-3 text-center" style={{ color: "rgba(0,0,0,0.45)" }}>מכירות ₪ (ינואר–אפריל)</div>
        <div className="flex items-end gap-2" style={{ height: "100px" }}>
          {PAST_DATA.map((d, i) => {
            const barH = Math.max((d.val / 16000) * BAR_AREA_H, 3);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="text-[9px]" style={{ color: "rgba(0,0,0,0.5)" }}>{(d.val / 1000).toFixed(1)}K</div>
                <div className="w-full rounded-t-md" style={{ height: `${barH}px`, background: TEAL }} />
                <div className="text-[9px]" style={{ color: "rgba(0,0,0,0.45)" }}>{d.label}</div>
              </div>
            );
          })}
          <div className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="text-[9px]" style={{ color: "rgba(0,0,0,0.3)" }}>?</div>
            <div className="w-full rounded-t-md flex items-center justify-center"
              style={{ height: `${BAR_AREA_H * 0.6}px`, background: "rgba(0,0,0,0.06)", border: "2px dashed rgba(0,0,0,0.15)" }}>
              <span className="text-[14px]">?</span>
            </div>
            <div className="text-[9px]" style={{ color: "rgba(0,0,0,0.45)" }}>מאי</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[9px]">
        {RANGES.map((r, i) => {
          const isSelected = chosen === i;
          return (
            <button key={i} type="button" disabled={showResult} onClick={() => setChosen(i)} className="text-right w-full">
              <div
                className="rounded-xl px-4 py-3 text-[13px] leading-[1.6] transition-all font-bold"
                style={{
                  background: !showResult ? "#fff"
                    : isSelected && r.correct ? "rgba(34,197,94,0.08)"
                    : isSelected && !r.correct ? "rgba(220,38,38,0.07)"
                    : r.correct ? "rgba(34,197,94,0.04)"
                    : "#fff",
                  border: !showResult ? "1px solid rgba(0,0,0,0.08)"
                    : isSelected && r.correct ? "1.5px solid rgba(34,197,94,0.4)"
                    : isSelected && !r.correct ? "1.5px solid rgba(220,38,38,0.3)"
                    : r.correct ? "1.5px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(0,0,0,0.06)",
                  color: "rgba(0,0,0,0.75)",
                }}
              >
                {r.label}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && chosen !== null && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl px-4 py-4 text-[13px] leading-[1.7]"
            style={{
              background: RANGES[chosen].correct ? "rgba(34,197,94,0.07)" : "rgba(220,38,38,0.06)",
              border: `1.5px solid ${RANGES[chosen].correct ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.25)"}`,
              color: RANGES[chosen].correct ? "#1a6b34" : "#b02020",
            }}>
            {RANGES[chosen].correct
              ? `✓ נכון! מאי עמד על ₪${REAL.toLocaleString()}. הטרנד הכולל עולה, גם אם יש תנודות.`
              : `✗ מאי עמד על ₪${REAL.toLocaleString()}. הטרנד הכולל עולה — גם אם פברואר היה חלש, זה לא מנבא ירידה מתמשכת.`}
          </div>

          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid rgba(34,197,94,0.3)" }}>
            <div className="text-[11px] font-bold mb-3 text-center" style={{ color: "rgba(0,0,0,0.45)" }}>מכירות ₪ (ינואר–מאי בפועל)</div>
            <div className="flex items-end gap-2" style={{ height: "100px" }}>
              {allData.map((d, i) => {
                const barH = Math.max((d.val / 16000) * BAR_AREA_H, 3);
                const isReal = i === 4;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div className="text-[9px]" style={{ color: "rgba(0,0,0,0.5)" }}>{(d.val / 1000).toFixed(1)}K</div>
                    <div className="w-full rounded-t-md" style={{ height: `${barH}px`, background: isReal ? "#fb8500" : TEAL }} />
                    <div className="text-[9px]" style={{ color: isReal ? "#fb8500" : "rgba(0,0,0,0.45)" }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
            style={{ background: "rgba(13,148,136,0.06)", color: "rgba(0,0,0,0.6)" }}>
            <span className="font-bold">מה למדת:</span> אנליסטיות משתמשות ב-Trend analysis — הסתכלות על כיוון הכולל, לא רק הנקודה האחרונה. פברואר חלש לא חייב להיות סיגנל.
          </div>
          <button type="button" onClick={onComplete}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: TEAL, ...HEEBO }}>
            סיימתי ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — שמרי / זרקי (Binary Sort)
// ─────────────────────────────────────────────────────────────────────────────

const SORT_ITEMS = [
  { text: '53% מהלקוחות ציינו "מחיר גבוה" בסקר עזיבה', keep: true },
  { text: "ממוצע טמפרטורה בעיר היה 28° החודש", keep: false },
  { text: "עמוד הנחיתה הראשי נטען ב-8 שניות (ממוצע 2.3)", keep: true },
  { text: "המנכ״ל אוהב את הצבע הכחול", keep: false },
  { text: "מתחרה מרכזי הוריד מחיר ב-20% בחודש שעבר", keep: true },
  { text: "מספר העובדים בחברה גדל ב-5 בחודש האחרון", keep: false },
  { text: "שיעור ה-Churn עלה מ-7% ל-12% ב-3 חודשים", keep: true },
  { text: "הלוגו של החברה שונה לפני 3 שנים", keep: false },
];

function Module4({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<boolean[]>([]);
  const done = index >= SORT_ITEMS.length;

  function decide(keep: boolean) {
    setDecisions(prev => [...prev, keep]);
    setIndex(prev => prev + 1);
  }

  const correctCount = done
    ? decisions.filter((d, i) => d === SORT_ITEMS[i].keep).length
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.6)" }}>
        שאלת המחקר: <span className="font-bold">"למה לקוחות עוזבים?"</span>
        <br />לכל נקודת מידע — החליטי: האם זה רלוונטי לשאלה?
      </div>

      {!done && (
        <>
          <div className="text-[11px] text-center font-bold" style={{ color: "rgba(0,0,0,0.35)" }}>
            {index + 1} מתוך {SORT_ITEMS.length}
          </div>
          <div className="rounded-2xl p-6 text-center min-h-[120px] flex items-center justify-center"
            style={{ background: "#fff", border: "1.5px solid rgba(13,148,136,0.2)" }}>
            <div className="text-[14.5px] leading-[1.7]" style={{ color: "#023e8a", ...HEEBO }}>
              {SORT_ITEMS[index].text}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => decide(false)}
              className="flex-1 py-4 rounded-xl font-bold text-[15px]"
              style={{ background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.25)", color: "#b02020", ...HEEBO }}>
              זרקי ✗
            </button>
            <button type="button" onClick={() => decide(true)}
              className="flex-1 py-4 rounded-xl font-bold text-[15px]"
              style={{ background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(34,197,94,0.3)", color: "#1a6b34", ...HEEBO }}>
              שמרי ✓
            </button>
          </div>
        </>
      )}

      {done && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl px-4 py-4 text-center"
            style={{ background: "rgba(13,148,136,0.07)", border: `1.5px solid ${TEAL}40` }}>
            <div className="text-[32px] font-black" style={{ color: TEAL, ...HEEBO }}>{correctCount}/{SORT_ITEMS.length}</div>
            <div className="text-[13px] mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>נקודות סיווגת נכון</div>
          </div>

          <div className="flex flex-col gap-2">
            {SORT_ITEMS.map((item, i) => {
              const userDecision = decisions[i];
              const correct = userDecision === item.keep;
              return (
                <div key={i}
                  className="rounded-xl px-3 py-3 flex items-start gap-3 text-[12px]"
                  style={{
                    background: correct ? "rgba(34,197,94,0.05)" : "rgba(220,38,38,0.05)",
                    border: `1px solid ${correct ? "rgba(34,197,94,0.2)" : "rgba(220,38,38,0.2)"}`,
                  }}>
                  <span className="shrink-0 font-bold" style={{ color: correct ? "#1a6b34" : "#b02020" }}>
                    {correct ? "✓" : "✗"}
                  </span>
                  <div>
                    <div style={{ color: "rgba(0,0,0,0.7)" }}>{item.text}</div>
                    <div className="mt-1 font-bold" style={{ color: item.keep ? "#1a6b34" : "#b02020" }}>
                      {item.keep ? "רלוונטי — קשור לסיבות עזיבה" : "לא רלוונטי לשאלה הזו"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
            style={{ background: "rgba(13,148,136,0.06)", color: "rgba(0,0,0,0.6)" }}>
            <span className="font-bold">מה למדת:</span> לפני כל ניתוח — מגדירים שאלת מחקר ברורה. כל נתון שלא קשור ישירות לשאלה = רעש שמבלבל.
          </div>
          <button type="button" onClick={onComplete}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: TEAL, ...HEEBO }}>
            סיימתי ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — בנאית הדשבורד (Build — Select 3 from 8)
// ─────────────────────────────────────────────────────────────────────────────

const METRICS = [
  { id: "conversion", label: "שיעור המרה (%)", desc: "כמה מבקרים הפכו ללקוחות", expert: true, why: "המדד הישיר ביותר לביצועי המכירות" },
  { id: "age", label: "גיל ממוצע לקוחות", desc: "דמוגרפיה של הלקוחות", expert: false, why: "לא רלוונטי לירידה חדה — ודאי לא ישתנה תוך חודש" },
  { id: "revenue", label: "הכנסות לפי ערוץ", desc: "אתר / אפליקציה / חנות", expert: true, why: "מזהה מאיפה הירידה — הכרחי לאבחון" },
  { id: "nps", label: "NPS — שביעות רצון", desc: "ניקוד לקוחות 1-10", expert: true, why: "מראה אם הלקוחות מרוצים — אינדיקטור עתידי" },
  { id: "color", label: "צבע אתר פופולרי", desc: "עיצוב מועדף על הגולשים", expert: false, why: "מעניין לעיצוב, לא לאבחון ירידת מכירות" },
  { id: "pages", label: "מספר עמודים שנצפו", desc: "כמה עמודים גולש ממוצע מבקר", expert: false, why: "לא ישיר — יכול להיות גבוה גם כשאין מכירות" },
  { id: "new_vs_return", label: "לקוחות חדשים vs חוזרים", desc: "פיצול סוגי הלקוחות", expert: false, why: "מעניין לטווח ארוך, לא הכי קריטי לאבחון מיידי" },
  { id: "dwell", label: "זמן שהייה בדף", desc: "כמה זמן מבלים בממוצע", expert: false, why: "לא מספיק — אפשר לשהות הרבה ועדיין לא לקנות" },
];

function Module5({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const MAX = 3;

  function toggle(id: string) {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= MAX) return prev;
      next.add(id);
      return next;
    });
  }

  const expertIds = new Set(METRICS.filter(m => m.expert).map(m => m.id));
  const matchCount = [...selected].filter(id => expertIds.has(id)).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.6)" }}>
        <span className="font-bold">סיטואציה:</span> פגישת הנהלה בעוד 10 דקות — ירידה במכירות. בחרי בדיוק 3 מדדים לדשבורד שתציגי.
      </div>

      {!submitted && (
        <div className="text-center text-[12px] font-bold" style={{ color: selected.size === MAX ? TEAL : "rgba(0,0,0,0.35)" }}>
          {selected.size}/{MAX} נבחרו
        </div>
      )}

      <div className="flex flex-col gap-[9px]">
        {METRICS.map(m => {
          const isSelected = selected.has(m.id);
          const isExpert = m.expert;
          return (
            <button key={m.id} type="button" onClick={() => toggle(m.id)} disabled={submitted} className="text-right w-full">
              <div
                className="rounded-xl px-4 py-3 transition-all"
                style={{
                  background: !submitted
                    ? isSelected ? `${TEAL}12` : "#fff"
                    : isSelected && isExpert ? "rgba(34,197,94,0.08)"
                    : isSelected && !isExpert ? "rgba(220,38,38,0.07)"
                    : isExpert ? "rgba(34,197,94,0.04)"
                    : "#fff",
                  border: !submitted
                    ? isSelected ? `1.5px solid ${TEAL}50` : "1px solid rgba(0,0,0,0.08)"
                    : isSelected && isExpert ? "1.5px solid rgba(34,197,94,0.4)"
                    : isSelected && !isExpert ? "1.5px solid rgba(220,38,38,0.3)"
                    : isExpert ? "1.5px solid rgba(34,197,94,0.25)"
                    : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13.5px] font-bold" style={{ color: "#023e8a" }}>{m.label}</div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>{m.desc}</div>
                  </div>
                  {isSelected && !submitted && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: TEAL }}>
                      <span className="text-white text-[11px] font-black">✓</span>
                    </div>
                  )}
                  {submitted && (
                    <span className="text-[12px] shrink-0 mt-0.5">
                      {isExpert ? "✓" : "—"}
                    </span>
                  )}
                </div>
                {submitted && (
                  <div className="text-[11.5px] mt-2" style={{ color: isExpert ? "#1a6b34" : "rgba(0,0,0,0.4)" }}>
                    {m.why}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!submitted && selected.size === MAX && (
        <button type="button" onClick={() => setSubmitted(true)}
          className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
          style={{ background: TEAL, ...HEEBO }}>
          הגישי לדשבורד ←
        </button>
      )}

      {submitted && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl px-4 py-4 text-center"
            style={{ background: "rgba(13,148,136,0.07)", border: `1.5px solid ${TEAL}40` }}>
            <div className="text-[28px] font-black" style={{ color: TEAL, ...HEEBO }}>{matchCount}/3</div>
            <div className="text-[13px] mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>מדדים שחופפים לבחירת המומחית</div>
          </div>
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
            style={{ background: "rgba(13,148,136,0.06)", color: "rgba(0,0,0,0.6)" }}>
            <span className="font-bold">מה למדת:</span> המדדים הנכונים: המרה (מה לא עובד), הכנסות לפי ערוץ (איפה הבעיה), ו-NPS (האם הלקוחות עדיין מרוצים). פחות מדדים, יותר ממוקדים = החלטות טובות יותר.
          </div>
          <button type="button" onClick={onComplete}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: TEAL, ...HEEBO }}>
            סיימתי ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6 — יועצת ה-CEO (Decision Advisor)
// ─────────────────────────────────────────────────────────────────────────────

const CEO_QUESTIONS = [
  { id: "churn", q: "מה שיעור ה-Churn שלנו?", a: "שיעור העזיבה עלה ל-18% (נורמה בענף: 7%). כ-1 מכל 5 לקוחות עוזב." },
  { id: "cac", q: "כמה עולה לנו להביא לקוח חדש (CAC)?", a: "₪420 לרכישת לקוח חדש. ב-12 חודשים אחרונים עלה ב-38%." },
  { id: "exit", q: "מה אמרו לקוחות שעזבו?", a: '67% ציינו "מחיר גבוה" כסיבה העיקרית. 22% — "מצאתי אלטרנטיבה זולה יותר".' },
  { id: "competitor", q: "מה עושים המתחרים?", a: "המתחרה המרכזי זול ב-15%. הוא השיק מנוי שנתי עם 20% הנחה לפני חודשיים." },
  { id: "margin", q: "מה שולי הרווח שלנו?", a: "שולי רווח נטו: 8% — נמוך. הורדת מחיר של 20% תכניס אותנו להפסד." },
  { id: "seasonal", q: "יש עונתיות בנתונים?", a: "כן — ינואר וספטמבר תמיד חלשים ב-15-20%. עכשיו ינואר." },
];

const CEO_DECISIONS = [
  { text: "כן — להוריד מחיר ב-20%", outcome: "הורדת המחיר הגדילה לקוחות ב-12%, אבל הרווח הנקי ירד ל-2% בלבד. החברה נכנסה לקשיים תזרימיים." },
  { text: "לא — לשמור על המחיר הנוכחי", outcome: "שמרו על מחיר אבל הוסיפו ערך: הרחבת תמיכה + 30 ימי ניסיון. Churn ירד ל-12% ב-3 חודשים." },
  { text: "הורדה חלקית — 10% עם תוספת ערך", outcome: "הפתרון הטוב ביותר: 10% הנחה + פיצ'רים חדשים. הלקוחות חזרו, הרווח נשמר ב-5%." },
];

function Module6({ onComplete }: { onComplete: () => void }) {
  const [askedIds, setAskedIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"ask" | "decide" | "result">("ask");
  const [decision, setDecision] = useState<number | null>(null);
  const MAX_Q = 3;

  function askQuestion(id: string) {
    if (askedIds.size >= MAX_Q) return;
    setAskedIds(prev => new Set([...prev, id]));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-4 flex gap-3 items-start"
        style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
        <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-black text-[14px]"
          style={{ background: "#023e8a", ...HEEBO }}>מ</div>
        <div>
          <div className="text-[12px] font-bold" style={{ color: "#023e8a" }}>מנכ״ל החברה</div>
          <div className="text-[13px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.7)" }}>
            "המכירות ירדו שוב. אני חושב להוריד מחיר ב-20%. מה את חושבת?"
          </div>
        </div>
      </div>

      {phase === "ask" && (
        <>
          <div className="text-[12.5px] leading-[1.6]"
            style={{ color: "rgba(0,0,0,0.6)" }}>
            לפני שתחליטי — בחרי <span className="font-bold">עד {MAX_Q} שאלות</span> לשאול את הנתונים:
          </div>
          <div className="text-center text-[11px] font-bold" style={{ color: askedIds.size === MAX_Q ? TEAL : "rgba(0,0,0,0.3)" }}>
            {askedIds.size}/{MAX_Q} שאלות נשאלו
          </div>

          <div className="flex flex-col gap-[9px]">
            {CEO_QUESTIONS.map(q => {
              const isAsked = askedIds.has(q.id);
              const disabled = !isAsked && askedIds.size >= MAX_Q;
              return (
                <button key={q.id} type="button"
                  disabled={disabled}
                  onClick={() => askQuestion(q.id)}
                  className="text-right w-full">
                  <div
                    className="rounded-xl px-4 py-3 transition-all"
                    style={{
                      background: isAsked ? "rgba(13,148,136,0.06)" : disabled ? "rgba(0,0,0,0.03)" : "#fff",
                      border: isAsked ? `1.5px solid ${TEAL}45` : "1px solid rgba(0,0,0,0.08)",
                      opacity: disabled ? 0.45 : 1,
                    }}
                  >
                    <div className="text-[13px] font-bold" style={{ color: "#023e8a" }}>{q.q}</div>
                    {isAsked && (
                      <div className="text-[12px] mt-2 leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>
                        → {q.a}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {askedIds.size > 0 && (
            <button type="button" onClick={() => setPhase("decide")}
              className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
              style={{ background: TEAL, ...HEEBO }}>
              {askedIds.size === MAX_Q ? "הגיע הזמן להחליט ←" : `המשך עם ${askedIds.size} שאלות ←`}
            </button>
          )}
        </>
      )}

      {phase === "decide" && (
        <>
          <div className="text-[14px] font-bold" style={{ color: "#023e8a", ...HEEBO }}>
            בהתבסס על הנתונים שראית — מה ההמלצה שלך?
          </div>
          <div className="flex flex-col gap-[9px]">
            {CEO_DECISIONS.map((d, i) => (
              <button key={i} type="button" onClick={() => { setDecision(i); setPhase("result"); }} className="text-right w-full">
                <div className="rounded-xl px-4 py-3 text-[13px] leading-[1.6]"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.75)" }}>
                  {d.text}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "result" && decision !== null && (
        <div className="flex flex-col gap-4">
          <div className="text-[14px] font-bold" style={{ color: "#023e8a", ...HEEBO }}>מה קרה בפועל:</div>
          <div
            className="rounded-xl px-4 py-4 text-[13px] leading-[1.7]"
            style={{
              background: decision === 2 ? "rgba(34,197,94,0.07)" : decision === 1 ? "rgba(251,133,0,0.07)" : "rgba(220,38,38,0.06)",
              border: `1.5px solid ${decision === 2 ? "rgba(34,197,94,0.3)" : decision === 1 ? "rgba(251,133,0,0.3)" : "rgba(220,38,38,0.25)"}`,
              color: "rgba(0,0,0,0.75)",
            }}
          >
            {CEO_DECISIONS[decision].outcome}
          </div>
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
            style={{ background: "rgba(13,148,136,0.06)", color: "rgba(0,0,0,0.6)" }}>
            <span className="font-bold">מה למדת:</span> הנתון הקריטי היה שולי הרווח (8%). הורדת מחיר ב-20% הייתה מוחקת אותם לחלוטין. אנליסטית לא רק מצגת נתונים — היא מחברת ביניהם להחלטה.
          </div>
          <button type="button" onClick={onComplete}
            className="w-full py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: TEAL, ...HEEBO }}>
            סיימתי ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DataLearnPage() {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem("data-learn-progress");
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  function completeModule(id: number) {
    const next = new Set([...completed, id]);
    setCompleted(next);
    localStorage.setItem("data-learn-progress", JSON.stringify([...next]));
    setActiveModule(null);
  }

  const MODULE_COMPONENTS = [
    (onComplete: () => void) => <Module0 onComplete={onComplete} />,
    (onComplete: () => void) => <Module1 onComplete={onComplete} />,
    (onComplete: () => void) => <Module2 onComplete={onComplete} />,
    (onComplete: () => void) => <Module3 onComplete={onComplete} />,
    (onComplete: () => void) => <Module4 onComplete={onComplete} />,
    (onComplete: () => void) => <Module5 onComplete={onComplete} />,
    (onComplete: () => void) => <Module6 onComplete={onComplete} />,
  ];

  // ── Active module view ──────────────────────────────────────────────────────
  if (activeModule !== null) {
    const mod = MODULES[activeModule];
    return (
      <div className="min-h-screen" style={{ background: "#f2ede6" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-[22px] md:px-[48px] pt-[22px] pb-[22px]" style={{ background: TEAL }}>
          <div className="max-w-[860px] mx-auto">
            <button type="button" onClick={() => setActiveModule(null)}
              className="text-[12px] font-bold block mb-3 text-white" style={{ opacity: 0.7 }}>
              ← חזרה למרכז
            </button>
            <div className="flex items-center gap-3">
              <div className="text-[28px]">{mod.emoji}</div>
              <div>
                <div className="text-[22px] md:text-[26px] text-white leading-tight" style={HEEBO}>{mod.title}</div>
                <div className="text-[12px] text-white mt-1" style={{ opacity: 0.75 }}>
                  {mod.type} · {mod.minutes} דק׳
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[680px] mx-auto px-[22px] md:px-6 pt-6 pb-16">
          {MODULE_COMPONENTS[activeModule](() => completeModule(activeModule))}
        </div>

        <BottomNav />
      </div>
    );
  }

  // ── Module list view ────────────────────────────────────────────────────────
  const completedCount = completed.size;

  return (
    <div className="min-h-screen" style={{ background: "#f2ede6" }}>
      {/* Header */}
      <div className="px-[22px] md:px-[48px] pt-[26px] pb-[26px]" style={{ background: TEAL }}>
        <div className="max-w-[860px] mx-auto">
          <Link href="/explore/data" className="text-[12px] font-bold block mb-4 text-white" style={{ opacity: 0.7 }}>
            ← חזרה לדאטה
          </Link>
          <div className="md:flex md:items-end md:justify-between md:gap-8">
            <div>
              <div className="text-[28px] md:text-[36px] text-white leading-tight" style={HEEBO}>מרכז למידה</div>
              <div className="text-[13px] md:text-[15px] text-white mt-1" style={{ opacity: 0.75 }}>
                דאטה ואנליטיקס — 7 חוויות שונות
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-5 md:mt-0 md:min-w-[260px]">
              <div className="flex justify-between text-[11px] text-white mb-2" style={{ opacity: 0.75 }}>
                <span>{completedCount} הושלמו</span>
                <span>{MODULES.length - completedCount} נותרו</span>
              </div>
              <div className="h-[6px] rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / MODULES.length) * 100}%`, background: "#fb8500" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module grid */}
      <div className="max-w-[860px] mx-auto px-4 md:px-[48px] pt-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {MODULES.map(mod => {
            const isDone = completed.has(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id)}
                className="text-right"
              >
                <div
                  className="rounded-2xl p-4 flex flex-col gap-[10px] min-h-[148px] md:min-h-[164px] transition-all duration-150"
                  style={{
                    background: isDone ? `${TEAL}0d` : "#fff",
                    border: isDone ? `1.5px solid ${TEAL}50` : "1px solid rgba(2,62,138,0.06)",
                    boxShadow: isDone ? "none" : "0 2px 14px rgba(2,62,138,0.07)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-[24px]">{mod.emoji}</div>
                    {isDone && (
                      <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center"
                        style={{ background: TEAL }}>
                        <span className="text-white text-[10px] font-black">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[13px] md:text-[13.5px] leading-tight" style={{ color: "#023e8a", ...HEEBO }}>
                    {mod.title}
                  </div>
                  <div className="text-[11px] mt-auto" style={{ color: "rgba(0,0,0,0.38)" }}>
                    {mod.type} · {mod.minutes} דק׳
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {completedCount === MODULES.length && (
          <div className="mt-5 rounded-2xl p-5 text-center"
            style={{ background: `${TEAL}0d`, border: `1.5px solid ${TEAL}40` }}>
            <div className="text-[28px] mb-2">🎉</div>
            <div className="text-[16px] font-black" style={{ color: TEAL, ...HEEBO }}>סיימת את כל המודולים!</div>
            <div className="text-[12.5px] mt-2" style={{ color: "rgba(0,0,0,0.5)" }}>
              חווית 7 סוגי עבודה שאנליסטיות עושות כל יום.
            </div>
          </div>
        )}

        {/* Advanced: Analytics Mission */}
        <Link href="/explore/data/learn/analytics" className="block mt-5">
          <div className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "#fff", border: "1.5px solid rgba(13,148,136,0.25)" }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[18px]">📊</span>
                <div className="text-[13px] font-black" style={{ color: "#023e8a", fontFamily: "'Heebo', sans-serif", fontWeight: 900 }}>מה שאנליסטית באמת עושה</div>
              </div>
              <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>
                5 שלבים · שאלת מחקר · ניקוי · גרפים · AI · המנכ״ל
              </div>
            </div>
            <div className="text-[18px] font-bold shrink-0" style={{ color: "#0d9488" }}>←</div>
          </div>
        </Link>

        {/* Advanced: SQL Mystery */}
        <Link href="/explore/data/learn/mystery" className="block mt-3">
          <div className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "#0a0f1e", border: "1.5px solid rgba(13,148,136,0.3)" }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[18px]">🕵️</span>
                <div className="text-[13px] font-black text-white" style={HEEBO}>מודול חקירה מתקדם — SQL</div>
              </div>
              <div className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                מסד נתונים אמיתי · כתיבת שאילתות · פרשת הדלפה בסטארטאפ
              </div>
            </div>
            <div className="text-[18px] font-bold shrink-0" style={{ color: "#0d9488" }}>←</div>
          </div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
