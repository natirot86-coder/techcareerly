"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — חומרה ואלקטרוניקה
const HW = "#7c2d12";
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Phase = "intro" | 1 | 2 | 3 | 4 | 5 | "done";

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block mb-1 mr-1">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
        style={{
          background: open ? "rgba(124,45,18,0.14)" : "rgba(124,45,18,0.06)",
          border: `1px solid rgba(124,45,18,${open ? 0.3 : 0.15})`,
          color: HW, fontFamily: "'Heebo', sans-serif",
        }}>
        {term}
        <span style={{ fontSize: 9, fontFamily: "'Heebo', sans-serif", opacity: 0.65 }}>{open ? "▲" : "?"}</span>
      </button>
      {open && (
        <div className="rounded-xl px-3 py-2.5 mt-1.5 text-[12px] leading-[1.65]"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.7)" }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

// ─── Terminal ─────────────────────────────────────────────────────────────────

function Terminal({ lines }: { lines: { text: string; color?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.22)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>hardware lab — PulseMed RMA</span>
      </div>
      <div className="p-4 font-mono text-[12px] leading-[2]" style={{ background: "#0f172a" }} dir="ltr">
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.color ?? "#e2e8f0" }}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Question ────────────────────────────────────────────────────────────────

function Q({
  q, options, correct, okMsg, errMsg, onAnswer, nextLabel, onNext,
}: {
  q: string; options: string[]; correct: number; okMsg: string; errMsg: string;
  onAnswer?: (ok: boolean) => void;
  nextLabel?: string; onNext?: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    onAnswer?.(i === correct);
  }

  const answered = picked !== null;

  return (
    <div className="mb-4">
      <div className="text-[13.5px] font-bold mb-4" style={{ color: NAVY }}>{q}</div>
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const isCorrect = i === correct;
          const isPicked = i === picked;
          let bg = "#fff", border = "1.5px solid rgba(0,0,0,0.08)", color = "rgba(0,0,0,0.75)";
          if (answered) {
            if (isCorrect) { bg = "rgba(34,197,94,0.08)"; border = "1.5px solid #22c55e55"; color = "#15803d"; }
            else if (isPicked) { bg = "rgba(220,38,38,0.07)"; border = "1.5px solid #dc262644"; color = "#b91c1c"; }
            else { color = "rgba(0,0,0,0.35)"; }
          }
          return (
            <button key={i} type="button" disabled={answered} onClick={() => pick(i)} className="text-right w-full">
              <div className="rounded-xl px-4 py-3 text-[13px] transition-all" style={{ background: bg, border, color }}>
                {answered && isCorrect && "✓ "}{answered && isPicked && !isCorrect && "✗ "}{opt}
              </div>
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <div className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{
              background: picked === correct ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
              border: `1px solid ${picked === correct ? "#22c55e55" : "#dc262644"}`,
              color: picked === correct ? "#15803d" : "#b91c1c",
            }}>
            {picked === correct ? okMsg : errMsg}
          </div>
          {nextLabel && onNext && (
            <button onClick={onNext}
              className="w-full py-[13px] rounded-xl font-bold text-[15px] mt-3 text-white"
              style={{ background: HW, fontFamily: "'Heebo', sans-serif" }}>
              {nextLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tool button ──────────────────────────────────────────────────────────────

function ToolButton({
  label, onClick, disabled, used,
}: { label: string; onClick: () => void; disabled: boolean; used: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || used}
      className="flex-1 py-3 rounded-xl text-[12.5px] font-bold transition-all"
      style={{
        background: used ? "rgba(34,197,94,0.1)" : disabled ? "rgba(0,0,0,0.04)" : "rgba(124,45,18,0.08)",
        border: `1.5px solid ${used ? "#22c55e55" : disabled ? "rgba(0,0,0,0.08)" : "rgba(124,45,18,0.2)"}`,
        color: used ? "#15803d" : disabled ? "rgba(0,0,0,0.3)" : HW,
        fontFamily: "'Heebo', sans-serif",
      }}>
      {used ? "✓ " : ""}{label}
    </button>
  );
}

// ─── Service Report (Post-Mortem של מעבדה) ───────────────────────────────────

function ServiceReport({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null]);

  const questions = [
    {
      q: "מה קרה?",
      options: [
        "המכשירים נפגעו מנפילות פיזיות בשטח",
        "קבל נפוח ליד ממיר המתח גרם למתח לא יציב — והמכשיר נכבה כשהתחמם",
        "באג ב-firmware כיבה את המכשירים אחרי שעה",
      ],
      correct: 1,
      ok: "✓ בדיוק — הקבל C7 איבד את היכולת לייצב את המתח כשהוא חם.",
      err: "✗ הראיות הצביעו על C7: נפוח בבדיקה חזותית, והמתח נופל כשמחממים רק אותו.",
    },
    {
      q: "מה הגורם השורשי?",
      options: [
        "הלקוחות השתמשו במכשיר בניגוד להוראות",
        "הקבל יושב צמוד לממיר המתח שמתחמם — חום כרוני מייבש קבלים ומקצר את חייהם",
        "אין גורם שורשי — קבלים פשוט מתקלקלים",
      ],
      correct: 1,
      ok: "✓ Root cause אמיתי: בעיית תכן — רכיב רגיש לחום שהושם צמוד למקור חום.",
      err: "✗ קבל שנפוח אחרי שנה איננו 'מזל רע' — הוא יושב צמוד לממיר שמתחמם. זו בעיית תכן.",
    },
    {
      q: "מה מונע הישנות?",
      options: [
        "להחליף קבלים בכל המכשירים כל חצי שנה",
        "בגרסת הלוח הבאה: להרחיק את הקבל ממקור החום ולבחור קבל בדירוג טמפרטורה גבוה יותר",
        "להוסיף למדריך אזהרה לא להפעיל את המכשיר יותר משעה",
      ],
      correct: 1,
      ok: "✓ מצוין! מתקנים את התכן, לא את הסימפטום — וכל הסדרה הבאה נולדת בריאה.",
      err: "✗ החלפות תקופתיות ואזהרות הן פלסטרים. הפתרון: לתקן את התכן — מרחק ממקור חום + דירוג טמפרטורה.",
    },
  ];

  return (
    <div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(124,45,18,0.05)", border: "1px solid rgba(124,45,18,0.12)" }}>
        <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: HW }}>SERVICE REPORT — PulseMed</div>
        <div className="text-[12px]" dir="rtl" style={{ color: "rgba(0,0,0,0.45)" }}>
          שישה מכשירים חזרו מהשטח · תקלה לא עקבית · האשם: קבל C7
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={i} className={i > step ? "opacity-40 pointer-events-none" : ""}>
          <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2 mt-4" style={{ color: "rgba(0,0,0,0.35)" }}>
            שדה {i + 1}/3
          </div>
          <Q
            q={q.q} options={q.options} correct={q.correct} okMsg={q.ok} errMsg={q.err}
            onAnswer={(ok) => {
              const next = [...answers]; next[i] = ok; setAnswers(next);
            }}
            nextLabel={i < 2 ? `שאלה ${i + 2}/3 ←` : "לסיכום ←"}
            onNext={() => { if (i < 2) setStep(i + 1); else onDone(); }}
          />
          {i < 2 && <div className="my-2" style={{ borderTop: "1px dashed rgba(0,0,0,0.08)" }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// חוזרים בדיוק לשלב שבו נעצרנו, כולל הניקוד והכלי שכבר הופעל — לא רק ה-phase
function loadSavedState(): { phase?: Phase; score?: number; tool1Used?: string | null; tool1Answered?: boolean } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("hardware-mystery-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function HardwareMysteryPage() {
  const [phase, setPhase] = useState<Phase>(() => loadSavedState().phase ?? "intro");
  const [tool1Used, setTool1Used] = useState<string | null>(() => loadSavedState().tool1Used ?? null);
  const [tool1Answered, setTool1Answered] = useState(() => loadSavedState().tool1Answered ?? false);
  const [score, setScore] = useState(() => loadSavedState().score ?? 0);

  useEffect(() => {
    try { localStorage.setItem("hardware-mystery-state", JSON.stringify({ phase, score, tool1Used, tool1Answered })); } catch {/* ignore */}
  }, [phase, score, tool1Used, tool1Answered]);

  function advance(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  function addScore() { setScore((s) => s + 1); }

  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: "#0f172a" }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/hardware" className="text-[12px] font-bold" style={{ opacity: 0.65 }}>← יציאה</Link>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(251,133,0,0.2)", color: "#fb923c" }}>🔍 חקירה מתקדמת</span>
        </div>
        <div className="text-[20px]" style={HEEBO}>תעלומת המכשיר החוזר — PulseMed</div>
        {phase !== "intro" && phase !== "done" && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.6 }}>
              <span>שלב {phase as number} מתוך 5</span>
              <span>{score} ממצאים</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${((phase as number) / 5) * 100}%`, background: "#fb923c" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Intro ───────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          {/* Bridge from day */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#15803d" }}>מה כבר יודעת מהשלב הקודם</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {["מולטימטר", "אוסצילוסקופ", "פס מתח", "לחמה קרה", "בדיקה חזותית"].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded font-bold"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#15803d" }}>✓ {t}</span>
              ))}
            </div>
            <div className="text-[12px]" dir="rtl" style={{ color: "rgba(0,0,0,0.55)" }}>
              הפעם — כלים חדשים ותעלומה עם שני חשודים. לחצי למטה ללמוד עליהם.
            </div>
          </div>

          {/* New tools */}
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
            👆 כלים חדשים — לחצי לגלות
          </div>
          <div className="flex flex-wrap mb-5">
            <GlossaryChip term="מדידת מתחים שלב-שלב" explanation={
              <span dir="rtl">
                במקום למדוד נקודה אחת — מודדים לאורך כל שרשרת החשמל: סוללה ← ממיר ← פס ← שבבים.<br /><br />
                כמו בדיקת צנרת: פותחים ברז אחרי ברז עד שמוצאים איפה הלחץ נעלם.<br />
                הנקודה שבה המתח "נשבר" — שם הבעיה.
              </span>
            } />
            <GlossaryChip term="בדיקה חזותית בהגדלה" explanation={
              <span dir="rtl">
                זכוכית מגדלת או מיקרוסקופ על הלוח — מחפשים סימנים פיזיים:<br /><br />
                <strong>קבל נפוח</strong> — הראש שלו אמור להיות שטוח; קבל שתפח או דולף = גוסס.<br />
                <strong>לחמה סדוקה</strong> — טבעת דקה סביב פין.<br />
                <strong>סימני חום</strong> — שינוי צבע חום על הלוח.
              </span>
            } />
            <GlossaryChip term="חימום/קירור מקומי" explanation={
              <span dir="rtl">
                טכניקת אבחון אמיתית: אקדח חום עדין או ספריי קירור — <strong>על רכיב אחד בכל פעם</strong>.<br /><br />
                אם התקלה מופיעה רק כשמחממים רכיב מסוים — הוא האשם.<br />
                כך מבדילים בין שני חשודים בלי לפרק כלום.
              </span>
            } />
            <GlossaryChip term="החלפת רכיב מבוקרת" explanation={
              <span dir="rtl">
                מחליפים <strong>רכיב אחד בלבד</strong> — ובודקים מחדש. אם התקלה נעלמה, הוא היה האשם.<br /><br />
                מחליפים חמישה דברים בבת אחת? התקלה אולי נעלמה — אבל לעולם לא תדעי ממה,
                ולא תוכלי לתקן את שאר המכשירים בסדרה.
              </span>
            } />
          </div>

          {/* How this differs */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.18)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#c2410c" }}>🔍 הפעם — את בוחרת את הכלי</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              ב"יום בחיי" הצעדים הובילו אותך: מולטימטר ← אוסצילוסקופ ← תיקון.<br />
              כאן — <strong>אין סדר נכון אחד</strong>. את בוחרת מאיפה להתחיל,
              וכל כלי מגלה חלק אחר מהתמונה. כמו בלשית — הראיות מצטברות.
            </div>
          </div>

          {/* Status dashboard */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
            המצב כרגע
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f172a" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>PulseMed — RMA Queue</div>
              <div className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(220,38,38,0.2)", color: "#f87171" }}>FIELD RETURN</div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "מכשירים שחזרו", status: "6 מוניטורים ניידים — אותה סדרת ייצור", color: "#f87171" },
                { label: "הסימפטום", status: "נכבה אחרי ~50 דקות עבודה", color: "#f87171" },
                { label: "הטריק", status: "אחרי קירור — עובד שוב, כאילו כלום", color: "#eab308" },
                { label: "בעמדת הבדיקה", status: "עובר את כל הבדיקות הקצרות ✓", color: "#f97316" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 px-3 py-2 rounded-xl" dir="rtl"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[12px] shrink-0" style={{ color: "#94a3b8" }}>{s.label}</span>
                  <span className="text-[12px] font-bold" style={{ color: s.color }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 text-[13px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(124,45,18,0.06)", border: "1px solid rgba(124,45,18,0.15)" }}>
            <span className="font-bold" style={{ color: NAVY }}>המשימה:</span>{" "}
            PulseMed — חברת מכשור רפואי. שישה מוניטורים חזרו מבתי חולים עם תקלה לא עקבית.
            עמדת הבדיקה לא מוצאת כלום. מצאי את הרכיב האשם — עם ראיות, לא ניחושים.
          </div>

          <button onClick={() => advance(1)}
            className="w-full py-[14px] rounded-xl font-bold text-[15px]"
            style={{ background: HW, color: "#fff", fontFamily: "'Heebo', sans-serif" }}>
            התחלי לחקור ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    function saveAndGo(href: string) {
      try {
        const journey = JSON.parse(localStorage.getItem("hardware-journey") || "{}");
        localStorage.setItem("hardware-journey", JSON.stringify({ ...journey, mystery: true }));
      } catch {/* ignore */}
      window.location.href = href;
    }

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-7">
            <div className="text-[52px] mb-2">🔍</div>
            <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>
              פענחת את התעלומה
            </div>
            <div className="text-[13px]" dir="rtl" style={{ color: "rgba(0,0,0,0.4)" }}>
              קבל אחד נפוח — ושישה מכשירים חוזרים לבתי החולים מתוקנים
            </div>
          </div>

          <div className="mb-7">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>
              הראיות שאספת
            </div>
            <div className="flex flex-col gap-2">
              {[
                ["שחזור התקלה", "המכשיר נכבה כשהוא חם — וחוזר אחרי קירור"],
                ["מדידת מתחים שלב-שלב", "המתח נשבר אחרי ממיר ה-5V"],
                ["בדיקה חזותית בהגדלה", "שני חשודים: קבל נפוח C7 ולחמה סדוקה J2"],
                ["חימום מקומי", "הראיה המכריעה — רק חימום C7 משחזר את התקלה"],
                ["החלפת רכיב מבוקרת", "C7 הוחלף · התקלה נעלמה · 6 המכשירים נבדקו"],
              ].map(([tool, desc]) => (
                <div key={tool} className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(34,197,94,0.07)", border: "1px solid #22c55e44" }}>
                  <span style={{ color: "#15803d" }}>✓</span>
                  <div>
                    <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{tool}</div>
                    <div className="text-[11.5px]" dir="rtl" style={{ color: "rgba(0,0,0,0.45)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real world */}
          <div className="rounded-2xl p-4 mb-6" style={{ background: "#0f172a" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>📰 זה קורה בעולם האמיתי</div>
            <div className="text-[12.5px] leading-[1.7] mb-3" dir="rtl" style={{ color: "#e2e8f0" }}>
              <strong style={{ color: "#fdba74" }}>"מגפת הקבלים" — תחילת שנות ה-2000</strong><br />
              אצוות קבלים עם אלקטרוליט פגום הגיעו למיליוני לוחות אם ומחשבים ברחבי העולם.
              הקבלים תפחו, דלפו וקרסו — שנים אחרי שהמוצרים נמכרו. אחת מתקלות הרכיבים
              המפורסמות בתולדות האלקטרוניקה.
            </div>
            <div className="text-[11.5px] mt-3 leading-[1.6]" dir="rtl" style={{ color: "#94a3b8" }}>
              מה שעשית היום — זיהוי קבל גוסס לפי ראיות ובדיקת כל האצווה —{" "}
              <strong style={{ color: "#e2e8f0" }}>זה בדיוק מה שטכנאים ומהנדסים בכל העולם עשו אז, מכשיר אחרי מכשיר.</strong>
            </div>
          </div>

          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(251,133,0,0.08)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>
              מה זה אומר עלייך
            </div>
            <div className="text-[13px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              עבדת כמו חוקרת תקלות אמיתית: שני חשודים, ראיה מכריעה, תיקון מבוקר.
              <span className="font-bold" style={{ color: NAVY }}> ככה בדיוק נראית עבודת מעבדה בתעשייה.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/hardware/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: HW, fontFamily: "'Heebo', sans-serif" }}>
            לכלי עיבוד החוויה ←
          </button>
          <button onClick={() => saveAndGo("/explore")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${HW}`, color: HW, fontFamily: "'Heebo', sans-serif" }}>
            לחקר תחומי הייטק נוספים ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Phases 1–5 ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {Header}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

        {/* Phase 1 — tool selection */}
        {phase === 1 && (
          <div>
            <div className="text-[13.5px] leading-[1.7] mb-5" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              מוניטור #M-2231 על השולחן. עובר את כל הבדיקות הקצרות — אבל בשטח הוא נכבה.
              <br />
              <span className="font-bold" style={{ color: NAVY }}>בחרי כלי ראשון לאבחון:</span>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <div className="flex gap-2">
                <ToolButton label="בדיקה חזותית בהגדלה"
                  onClick={() => { setTool1Used("visual"); }}
                  disabled={tool1Answered || (tool1Used !== null && tool1Used !== "visual")}
                  used={tool1Used === "visual"} />
                <ToolButton label="מדידת מתחים שלב-שלב"
                  onClick={() => { setTool1Used("voltage"); }}
                  disabled={tool1Answered || (tool1Used !== null && tool1Used !== "voltage")}
                  used={tool1Used === "voltage"} />
              </div>
              <ToolButton label="להריץ את המכשיר עד שהתקלה חוזרת"
                onClick={() => { setTool1Used("reproduce"); }}
                disabled={tool1Answered || (tool1Used !== null && tool1Used !== "reproduce")}
                used={tool1Used === "reproduce"} />
            </div>

            {/* Visual output */}
            {tool1Used === "visual" && (
              <div>
                <Terminal lines={[
                  { text: "VISUAL INSPECTION — M-2231 (x10 zoom)", color: "#60a5fa" },
                  { text: "power module area:", color: "#94a3b8" },
                  { text: "  C7 (capacitor): top slightly domed  ⚠️", color: "#eab308" },
                  { text: "  J2 (battery conn): dull solder ring ⚠️", color: "#eab308" },
                  { text: "  all other joints: shiny, clean  ✓", color: "#22c55e" },
                ]} />
                <div className="flex flex-wrap gap-1 mb-4">
                  <GlossaryChip term="קבל נפוח" explanation={<span dir="rtl">זוכרת? קבל = מיכל הרזרבה הקטן ששומר על לחץ (מתח) חלק. ראש הקבל אמור להיות שטוח לגמרי — כיפה קלה = המיכל תפח מלחץ פנימי, סימן שהוא גוסס. קבל כזה עדיין עובד... עד שלא.</span>} />
                  <GlossaryChip term="טבעת עמומה" explanation={<span dir="rtl">לחמה בריאה מבריקה. טבעת מט סביב פין = לחמה שהתעייפה או נסדקה — מגע חשמלי לא אמין.</span>} />
                </div>
                <Q q="הבדיקה החזותית מצאה שני ממצאים חשודים. מה נכון לעשות?"
                  options={[
                    "להחליף מיד את שניהם — כפול ליתר ביטחון",
                    "לרשום את שניהם כחשודים — וצריך ראיה נוספת שתכריע מי מהם גורם לתקלה",
                    "הראשון שנמצא הוא האשם — הקבל",
                  ]}
                  correct={1}
                  okMsg="✓ בדיוק! שני חשודים = עוד אין אשם. מי שמחליף את שניהם לא ידע מה היה שבור — ולא יוכל לבדוק נכון את חמשת המכשירים האחרים."
                  errMsg="✗ שני ממצאים ≠ שני אשמים. אם מחליפים הכל, לא לומדים כלום. צריך ראיה שמכריעה בין החשודים."
                  onAnswer={(ok) => { if (ok) addScore(); setTool1Answered(true); }}
                />
              </div>
            )}

            {/* Voltage output */}
            {tool1Used === "voltage" && (
              <div>
                <Terminal lines={[
                  { text: "VOLTAGE MAP — M-2231 (device warm, failing)", color: "#60a5fa" },
                  { text: "battery output:      7.41 V  ✓", color: "#22c55e" },
                  { text: "after fuse:          7.40 V  ✓", color: "#22c55e" },
                  { text: "5V regulator out:    4.12 V  ⚠️ (spec: 5.0V)", color: "#f87171" },
                  { text: "3.3V rail:           2.71 V  ⚠️ (starved)", color: "#f87171" },
                ]} />
                <div className="flex flex-wrap gap-1 mb-4">
                  <GlossaryChip term="ממיר מתח (Regulator)" explanation={<span dir="rtl">כמו וסת לחץ בכניסה לבית: מקבל לחץ גבוה מהקו (הסוללה — 7.4) ומוריד אותו ללחץ קבוע שהבית צריך (5). הוא מתחמם תוך כדי — זה חלק מהעבודה שלו.</span>} />
                  <GlossaryChip term="starved" explanation={<span dir="rtl">"מורעב" — כמו ברז שמקבל רק טפטוף, כי הלחץ נשבר עוד לפניו בצנרת. תקלה אחת במעלה הזרם גוררת את כל מה שאחריה.</span>} />
                </div>
                <Q q="המתח תקין עד הממיר — ונשבר אחריו. מה זה מלמד?"
                  options={[
                    "הסוללה חלשה וצריך להחליף אותה",
                    "הבעיה באזור ממיר ה-5V — שם ממוקדת החקירה",
                    "כל הלוח פגום ואין טעם לתקן",
                  ]}
                  correct={1}
                  okMsg="✓ מדויק! הסוללה נותנת 7.4V יפים. השבירה אחרי הממיר — הבעיה שם או ברכיבים שסביבו. עכשיו נסתכל מקרוב."
                  errMsg="✗ הסוללה מודדת 7.41V — תקינה. המתח נשבר אחרי ממיר ה-5V. שם החקירה ממשיכה."
                  onAnswer={(ok) => { if (ok) addScore(); setTool1Answered(true); }}
                />
              </div>
            )}

            {/* Reproduce output */}
            {tool1Used === "reproduce" && (
              <div>
                <Terminal lines={[
                  { text: "SOAK TEST — M-2231, full load", color: "#60a5fa" },
                  { text: "00:10  running, temp 26°C  ✓", color: "#22c55e" },
                  { text: "00:30  running, temp 38°C  ✓", color: "#22c55e" },
                  { text: "00:48  SHUTDOWN, temp 44°C  ✗", color: "#f87171" },
                  { text: "cooldown 15 min → powers on again", color: "#eab308" },
                ]} />
                <div className="flex flex-wrap gap-1 mb-4">
                  <GlossaryChip term="Soak Test" explanation={<span dir="rtl">בדיקת "השרייה" — מריצים את המכשיר שעות בעומס מלא, כמו בחיים האמיתיים. בדיקות קצרות מפספסות תקלות שלוקח להן זמן להתפתח — כמו זו.</span>} />
                  <GlossaryChip term="תקלה תלוית-חום" explanation={<span dir="rtl">תקלה שמופיעה רק בטמפרטורה גבוהה — משהו פיזי משתנה עם החום: מתכת מתרחבת, קבל חם מאבד קיבולת. הרמז: קירור מחזיר את המכשיר לחיים.</span>} />
                </div>
                <Q q="נכבה אחרי 48 דקות ב-44 מעלות — וחוזר אחרי קירור. מה למדנו?"
                  options={[
                    "המכשיר לא מיועד לעבוד יותר מ-45 דקות",
                    "התקלה תלוית-חום — משהו פיזי מפסיק לתפקד כשהוא מתחמם",
                    "הסוללה נגמרת אחרי 48 דקות",
                  ]}
                  correct={1}
                  okMsg="✓ שחזרת את התקלה במעבדה — הצעד שעמדת הבדיקה פספסה. עכשיו יודעים: מחפשים משהו שנשבר עם חום."
                  errMsg="✗ סוללה שנגמרת לא חוזרת אחרי קירור בלי טעינה. כיבוי בחום + חזרה בקור = תקלה תלוית-חום."
                  onAnswer={(ok) => { if (ok) addScore(); setTool1Answered(true); }}
                />
              </div>
            )}

            {tool1Answered && (
              <button onClick={() => advance(2)}
                className="w-full py-[13px] rounded-xl font-bold text-[15px] mt-4 text-white"
                style={{ background: ORANGE, fontFamily: "'Heebo', sans-serif" }}>
                אספי את כל הראיות יחד ←
              </button>
            )}
          </div>
        )}

        {/* Phase 2 — two suspects */}
        {phase === 2 && (
          <div>
            <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              שילוב כל הבדיקות (חזותית + מתחים + שחזור) מצייר תמונה — עם <strong>שני חשודים</strong>:
            </div>

            <div className="flex flex-col gap-3 mb-5">
              <div className="rounded-2xl p-4" style={{ background: "rgba(220,38,38,0.05)", border: "1.5px solid rgba(220,38,38,0.18)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[18px]">🫙</span>
                  <span className="text-[13px] font-black" style={{ color: "#dc2626" }}>חשוד 1: הקבל C7 — נפוח קלות</span>
                </div>
                <div className="text-[11.5px] leading-[1.6]" dir="rtl" style={{ color: "rgba(0,0,0,0.58)" }}>
                  יושב צמוד לממיר ה-5V. קבל חם מאבד את יכולת הייצוב — מתאים לנפילת המתח אחרי הממיר.
                </div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(234,179,8,0.06)", border: "1.5px solid rgba(234,179,8,0.25)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[18px]">🔗</span>
                  <span className="text-[13px] font-black" style={{ color: "#92400e" }}>חשוד 2: הלחמה J2 — טבעת עמומה</span>
                </div>
                <div className="text-[11.5px] leading-[1.6]" dir="rtl" style={{ color: "rgba(0,0,0,0.58)" }}>
                  מחבר הסוללה. לחמה קרה שמתנתקת בחום — בדיוק כמו בתקלה מהיום-בחיי. גם מתאים לתקלה תלוית-חום.
                </div>
              </div>
            </div>

            <Q
              q="שני חשודים, שניהם מתאימים לתקלה תלוית-חום. אבל יש ראיה אחת שכבר מפלילה יותר את אחד מהם. איזו?"
              options={[
                "הבדיקה החזותית — קבל נפוח נראה גרוע יותר מלחמה עמומה",
                "מפת המתחים — הסוללה נותנת 7.4V תקין דרך J2, והמתח נשבר רק אחרי הממיר, ליד C7",
                "אין ראיה כזאת — חייבים להחליף את שניהם",
              ]}
              correct={1}
              okMsg="✓ חדה! אם J2 היה מנתק — לא היה מגיע 7.4V בכלל. המתח נשבר אחרי הממיר — באזור של C7. אבל ראיה טובה רוצה אישור. נכריע עם חימום מקומי."
              errMsg="✗ 'נראה גרוע' זו תחושה, לא ראיה. מפת המתחים היא הראיה: 7.4V עובר דרך J2 תקין, והשבירה אחרי הממיר — ליד C7."
              onAnswer={(ok) => { if (ok) addScore(); }}
              nextLabel="לראיה המכריעה — חימום מקומי ←"
              onNext={() => advance(3)}
            />
          </div>
        )}

        {/* Phase 3 — decisive evidence */}
        {phase === 3 && (
          <div>
            <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              המכשיר קר ועובד. מכוונים אקדח חום עדין — <strong>רכיב אחד בכל פעם</strong> — ועוקבים אחרי המתח:
            </div>
            <Terminal lines={[
              { text: "LOCAL HEAT TEST — one component at a time", color: "#60a5fa" },
              { text: "", color: "#94a3b8" },
              { text: "heat J2 (solder joint) → 50°C:", color: "#94a3b8" },
              { text: "  5V out: 5.01V stable  ✓ no fault", color: "#22c55e" },
              { text: "", color: "#94a3b8" },
              { text: "heat C7 (capacitor) → 50°C:", color: "#94a3b8" },
              { text: "  5V out: 4.08V, ripple rising  ⚠️", color: "#f87171" },
              { text: "  device SHUTDOWN after 90 sec  ✗", color: "#f87171" },
              { text: "cool C7 → device recovers  ✓", color: "#eab308" },
            ]} />
            <div className="flex flex-wrap gap-1 mb-4">
              <GlossaryChip term="ripple" explanation={<span dir="rtl">"אדוות" — רעידות קטנות בלחץ (המתח) שאמור להיות חלק. מיכל הרזרבה (הקבל) הבריא מחליק אותן; מיכל גוסס נותן להן לגדול. ripple עולה = הקבל מאבד את התפקיד שלו.</span>} />
              <GlossaryChip term="בידוד משתנים" explanation={<span dir="rtl">העיקרון מאחורי הבדיקה: משנים דבר אחד בלבד (חום על רכיב אחד) ורואים מה קורה. אם משנים שני דברים — אי אפשר לדעת מי גרם למה.</span>} />
            </div>
            <Q
              q="חימום J2 — כלום. חימום C7 — התקלה חוזרת תוך 90 שניות. המסקנה?"
              options={[
                "שני הרכיבים תקולים — החום פשוט הגיע קודם ל-C7",
                "C7 הוא האשם: התקלה משוחזרת רק כשהוא חם — והלחמה J2 מזוכה",
                "אי אפשר להסיק — אולי האקדח חום קלקל את C7 עכשיו",
              ]}
              correct={1}
              okMsg="✓ תיק סגור! חימום נקודתי של C7 בלבד משחזר את התקלה, וקירורו מעלים אותה. J2 חומם באותה טמפרטורה ונשאר יציב — מזוכה."
              errMsg="✗ J2 חומם לאותה טמפרטורה ולא קרה כלום — הוא מזוכה. 50°C לא מקלקל קבל בריא; זו טמפרטורת עבודה רגילה. C7 הוא האשם."
              onAnswer={(ok) => { if (ok) addScore(); }}
              nextLabel="לתיקון ←"
              onNext={() => advance(4)}
            />
          </div>
        )}

        {/* Phase 4 — The Fix */}
        {phase === 4 && (
          <div>
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid #22c55e44" }}>
              <div className="font-bold mb-1" style={{ color: "#15803d" }}>✓ זיהית את האשם!</div>
              <div className="text-[12.5px]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
                הקבל C7 — נפוח, יושב צמוד לממיר שמתחמם, ומאבד את ייצוב המתח כשהוא חם.
                שישה מכשירים מאותה סדרת ייצור מחכים בתור.
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              <GlossaryChip term="ערך + דירוג טמפרטורה" explanation={<span dir="rtl">קבל מחליפים ברכיב עם אותו ערך חשמלי (קיבולת ומתח) — אבל אפשר לבחור <strong>דירוג טמפרטורה גבוה יותר</strong> (105°C במקום 85°C), שמחזיק מעמד ליד מקורות חום.</span>} />
              <GlossaryChip term="אצוות רכיבים" explanation={<span dir="rtl">רכיבים נקנים באצוות ייצור. אם קבל אחד מאצווה נכשל מוקדם — סביר ששאר האצווה באותו מצב. לכן בודקים את כל המכשירים שקיבלו רכיבים מאותה אצווה.</span>} />
            </div>
            <Q
              q="מהו התיקון הנכון?"
              options={[
                "להחליף את C7 ולשלוח את המכשיר מיד — הזמן דוחק",
                "להחליף את C7 בקבל בדירוג טמפרטורה גבוה יותר, לאמת בבדיקת חום, ולבדוק את חמשת המכשירים האחרים",
                "להוסיף מאוורר קטן שיקרר את C7 בכל המכשירים",
              ]}
              correct={1}
              okMsg="✓ מושלם: החלפה מבוקרת + אימות בתנאי התקלה + טיפול בכל הסדרה. מכשיר רפואי לא יוצא מהמעבדה על סמך 'כנראה בסדר'."
              errMsg="✗ לשלוח בלי אימות בחום = להחזיר את התקלה לבית החולים. מאוורר = פלסטר. מחליפים, מאמתים בחום, ובודקים את כל הסדרה."
              onAnswer={(ok) => { if (ok) addScore(); }}
              nextLabel="לדוח השירות ←"
              onNext={() => advance(5)}
            />
          </div>
        )}

        {/* Phase 5 — Service Report */}
        {phase === 5 && (
          <div>
            <div className="text-[13.5px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              C7 הוחלף בכל שישת המכשירים. כולם עברו בדיקת חום. עכשיו — דוח שירות,
              כדי שהתקלה הזאת לא תיוולד מחדש בסדרה הבאה.
            </div>
            <ServiceReport onDone={() => advance("done")} />
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
