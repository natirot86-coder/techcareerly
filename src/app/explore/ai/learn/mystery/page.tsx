"use client";
import React, { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — AI ובינה מלאכותית
const AI = "#7c3aed";
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type DecisionId = "promises" | "tone" | "handoff";
type Phase = "intro" | "hub" | DecisionId | "demo" | "done";

// ─── Chat (וואטסאפ בסגנון terminal — התשובות של העוזר) ────────────────────────

type ChatLine = { from: "customer" | "ai" | "note"; text: string; label?: string; labelColor?: string };

function Chat({ title, lines }: { title: string; lines: ChatLine[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>{title}</span>
      </div>
      <div className="p-4 flex flex-col gap-2.5" style={{ background: "#0f172a" }} dir="rtl">
        {lines.map((l, i) => {
          if (l.from === "note") {
            return (
              <div key={i} className="text-center text-[11px] leading-[1.6] px-2 py-1" style={{ color: "#94a3b8", fontStyle: "italic" }}>
                {l.text}
              </div>
            );
          }
          const isAi = l.from === "ai";
          return (
            <div key={i} className={`flex flex-col ${isAi ? "items-end" : "items-start"}`}>
              <div className="text-[9.5px] mb-0.5 px-1" style={{ color: "#64748b" }}>
                {isAi ? "🤖 העוזר שלך" : "👤 מטופל/ת"}
              </div>
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-[1.6]"
                style={{
                  background: isAi ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.09)",
                  color: isAi ? "#ddd6fe" : "#e2e8f0",
                  ...(isAi ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 }),
                }}>
                {l.text}
              </div>
              {l.label && (
                <span className="text-[10px] px-2 py-0.5 rounded mt-1"
                  style={{ background: "rgba(255,255,255,0.06)", color: l.labelColor ?? "#94a3b8", fontFamily: "'Heebo', sans-serif" }}>
                  {l.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block mb-1 mr-1">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
        style={{
          background: open ? "rgba(124,58,237,0.14)" : "rgba(124,58,237,0.06)",
          border: `1px solid rgba(124,58,237,${open ? 0.3 : 0.15})`,
          color: AI, fontFamily: "'Heebo', sans-serif",
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

// ─── Decision — בחירת כלל ← רואים את התשובה של העוזר שנוצרת ממנו ──────────────

type DecisionOption = { rule: string; reply: string; good: boolean; verdict: string };

function Decision({
  situation, customerMsg, options, onDone,
}: {
  situation: string;
  customerMsg: string;
  options: DecisionOption[];
  onDone: (firstTryOk: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [failedOnce, setFailedOnce] = useState(false);

  const opt = picked !== null ? options[picked] : null;

  return (
    <div>
      <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>{situation}</div>

      <Chat title="whatsapp — מרפאת שיניים חיוך" lines={[{ from: "customer", text: customerMsg }]} />

      <div className="text-[13.5px] font-bold mb-3" style={{ color: NAVY }}>איזה כלל את כותבת לעוזר בתדריך?</div>
      <div className="flex flex-col gap-3 mb-4">
        {options.map((o, i) => {
          const isPicked = picked === i;
          let bg = "#fff", border = "1.5px solid rgba(0,0,0,0.08)", color = "rgba(0,0,0,0.75)";
          if (picked !== null) {
            if (isPicked && o.good) { bg = "rgba(34,197,94,0.08)"; border = "1.5px solid #22c55e55"; color = "#15803d"; }
            else if (isPicked) { bg = "rgba(220,38,38,0.07)"; border = "1.5px solid #dc262644"; color = "#b91c1c"; }
            else { color = "rgba(0,0,0,0.35)"; }
          }
          return (
            <button key={i} type="button" disabled={picked !== null} onClick={() => setPicked(i)} className="text-right w-full">
              <div className="rounded-xl px-4 py-3 text-[13px] transition-all" style={{ background: bg, border, color }}>
                {isPicked && (o.good ? "✓ " : "✗ ")}{o.rule}
              </div>
            </button>
          );
        })}
      </div>

      {opt && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
            עם הכלל הזה — כך העוזר יענה:
          </div>
          <Chat title="מה שהמטופל/ת יקבל" lines={[
            { from: "ai", text: opt.reply, label: opt.good ? "✓ ככה נראה כלל טוב" : "⚠️ כאן זה מתפוצץ", labelColor: opt.good ? "#86efac" : "#fca5a5" },
          ]} />
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6] mb-4" dir="rtl"
            style={{
              background: opt.good ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
              border: `1px solid ${opt.good ? "#22c55e55" : "#dc262644"}`,
              color: opt.good ? "#15803d" : "#b91c1c",
            }}>
            {opt.verdict}
          </div>
          {opt.good ? (
            <button onClick={() => onDone(!failedOnce)}
              className="w-full py-[13px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
              ההגדרה נשמרה — חזרה ללוח ←
            </button>
          ) : (
            <button onClick={() => { setPicked(null); setFailedOnce(true); }}
              className="w-full py-[13px] rounded-xl font-bold text-[15px]"
              style={{ border: `1.5px solid ${AI}`, color: AI, background: "transparent", fontFamily: "'Heebo', sans-serif" }}>
              נסי כלל אחר ↺
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── הגדרות שלושת התחומים ─────────────────────────────────────────────────────

const DECISIONS: Record<DecisionId, {
  emoji: string; title: string; sub: string;
  situation: string; customerMsg: string; options: DecisionOption[];
}> = {
  promises: {
    emoji: "🤝",
    title: "מה מותר לו להבטיח",
    sub: "מטופל עם כאב רוצה הבטחה — מה העוזר באמת יכול לתת?",
    situation: "ההודעה הראשונה שתבחן את העוזר — מטופל עם כאב שדורש ודאות:",
    customerMsg: "אני חייב תור דחוף היום!! כואב לי נורא. תבטיחו לי שד״ר לוי תקבל אותי היום?",
    options: [
      {
        rule: "קודם מרגיעים: העוזר מבטיח שד״ר לוי תקבל אותו היום ותפתור את הכאב",
        reply: "אל דאגה! ד״ר לוי תקבל אותך היום ותסדר לך את הכאב 🙏",
        good: false,
        verdict: "✗ שתי הבטחות שאין לעוזר שליטה עליהן: אם היומן מלא — הבטחת שווא לאדם שסובל, ו״תסדר את הכאב״ זו כמעט הבטחה רפואית. עובד חדש שמבטיח בשם הבוס — מסבך את הבוס.",
      },
      {
        rule: "העוזר מציע רק מה שבאמת בידיו: התור הפנוי הקרוב ביומן, ובמקרה דחוף — רותם המזכירה מתקשרת",
        reply: "ממש מצטער לשמוע שכואב 🙏 התור הפנוי הקרוב הוא היום ב-17:30 — לשריין לך? ואם דחוף יותר, רותם מהמרפאה יכולה להתקשר אליך עכשיו.",
        good: true,
        verdict: "✓ בדיוק. העוזר מבטיח רק מה שקיים ביומן באמת — ומשאיר דלת פתוחה לבן-אדם. אמפתיה כן, הבטחות שווא לא.",
      },
      {
        rule: "העוזר לא מתחייב לכלום: שיתקשרו למרפאה",
        reply: "אני לא יכול לדעת. תתקשר למרפאה.",
        good: false,
        verdict: "✗ זה עוזר שלא עוזר. המטופל כבר בוואטסאפ — לזרוק אותו לטלפון זה בדיוק מה שהמרפאה רצתה להפסיק. בין ״להבטיח הכול״ ל״כלום״ יש דרך אמצע: להציע את מה שבאמת יש.",
      },
    ],
  },
  tone: {
    emoji: "😤",
    title: "איך עונה ללקוח כועס",
    sub: "מטופלת רותחת מהמתנה של אתמול — מילה לא נכונה תהפוך לצילום מסך",
    situation: "עכשיו הודעה מסוג אחר — לא שאלה, רגש. שימי לב שאין כאן מה ״לפתור״:",
    customerMsg: "חיכיתי אתמול 40 דקות בקליניקה!!! שערורייה. אני שוקלת להחליף מרפאה.",
    options: [
      {
        rule: "העוזר מתנצל בשם המרפאה ומבטיח שזה לא יקרה שוב",
        reply: "אנחנו מתנצלים מאוד! מבטיחים שזה לא יקרה שוב 🙏",
        good: false,
        verdict: "✗ שוב הבטחה שאין לו שליטה עליה — עיכובים קורים, ובפעם הבאה צילום המסך הזה יחכה. התנצלות כן, הבטחה לעתיד — רק בן-אדם יכול לתת.",
      },
      {
        rule: "העוזר מסביר שהעיכוב היה מוצדק — טיפולים מתארכים לפעמים",
        reply: "העיכובים אצלנו נדירים ונובעים מטיפולים מורכבים. לא הוגן לקרוא לזה שערורייה.",
        good: false,
        verdict: "✗ עוזר AI שמתווכח עם לקוחה כועסת — הדרך הקצרה ביותר לצילום מסך ויראלי. גם אם הוא צודק בעובדות, הוא הפסיד את המטופלת.",
      },
      {
        rule: "העוזר מכיר ברגש, לא מתווכח ולא מבטיח — ומעביר לבן-אדם",
        reply: "אני שומע אותך — לחכות 40 דקות זה באמת מתסכל 🙏 אני מעביר את הפנייה שלך לרותם והיא תחזור אלייך עוד היום. חשוב לנו שתישארי איתנו.",
        good: true,
        verdict: "✓ בדיוק. הכרה ברגש בלי להתווכח על העובדות ובלי להבטיח — והעברה לבן-אדם. כעס הוא לא שאלה שעונים עליה, הוא סימן שצריך אדם.",
      },
    ],
  },
  handoff: {
    emoji: "🙋",
    title: "מתי מעביר לבן-אדם",
    sub: "ההגדרה הכי חשובה במרפאה — איפה עובר הגבול של העוזר",
    situation: "ההודעה הרגישה ביותר שתגיע — כאן ההגדרה שלך קובעת הכול:",
    customerMsg: "אחרי העקירה אתמול יש לי דימום שלא נעצר. מה לעשות?",
    options: [
      {
        rule: "העוזר נותן הוראות עזרה ראשונה — יש מספיק מידע כזה ברשת",
        reply: "לחץ על המקום עם גזה סטרילית למשך 20 דקות. אם לא נעצר, נסה קרח ו...",
        good: false,
        verdict: "✗ עצרי. ייעוץ רפואי מעוזר וואטסאפ — גם אם ההוראות נכונות, האחריות על המרפאה, והעוזר לא יודע מה הוא לא יודע. במרפאה זו הגדר שאין לחצות: רפואה ← בן-אדם. תמיד.",
      },
      {
        rule: "העוזר קובע לו תור להמשך השבוע — בשביל זה הוא קיים",
        reply: "אין בעיה! קבעתי לך תור ליום חמישי ב-10:00 לבדיקה 😊",
        good: false,
        verdict: "✗ דימום עכשיו לא מחכה ליום חמישי. העוזר חייב להבדיל בין ״רוצה תור״ לבין ״מצוקה עכשיו״ — וההודעה הזו היא מצוקה.",
      },
      {
        rule: "העוזר מזהה מילים של מצוקה רפואית — ומעביר מיד לבן-אדם, עם הנחיה ברורה",
        reply: "זה חשוב — ואני לא הכתובת לשאלות רפואיות. אני מעביר אותך עכשיו לצוות המרפאה שיחזור אליך מיד. אם מרגישים החמרה — חייגו 101.",
        good: true,
        verdict: "✓ זו ההגדרה הכי חשובה שכתבת היום: העוזר יודע להגיד ״אני לא הכתובת״ ולהעביר מיד. עוזר טוב נמדד בדיוק ברגעים שבהם הוא עוצר.",
      },
    ],
  },
};

const DECISION_ORDER: DecisionId[] = ["promises", "tone", "handoff"];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AiMysteryPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [done, setDone] = useState<Record<DecisionId, boolean>>({ promises: false, tone: false, handoff: false });
  const [score, setScore] = useState(0);

  const doneCount = DECISION_ORDER.filter(id => done[id]).length;

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: "#0f172a" }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/ai" className="text-[12px] font-bold" style={{ opacity: 0.65 }}>← יציאה</Link>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(124,58,237,0.25)", color: "#c4b5fd" }}>🛠️ מיני-פרויקט</span>
        </div>
        <div className="text-[20px]" style={HEEBO}>מיני-פרויקט: העוזר של המרפאה</div>
        {phase !== "intro" && phase !== "done" && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.6 }}>
              <span>{doneCount} מתוך 3 הגדרות הושלמו</span>
              <span>{score} החלטות מדויקות</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / 3) * 100}%`, background: AI }} />
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
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#15803d" }}>מה כבר יש לך מהשלב הקודם</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {["תדריך (פרומפט)", "גדרות", "זיהוי הזיה", "בדיקה על שאלות אמיתיות"].map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded font-bold"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#15803d", fontFamily: "'Heebo', sans-serif" }}>✓ {t}</span>
              ))}
            </div>
            <div className="text-[12px]" dir="rtl" style={{ color: "rgba(0,0,0,0.55)" }}>
              במאפייה למדת ליד רמי. הפעם — הפרויקט שלך, מההתחלה ועד הדגמה חיה.
            </div>
          </div>

          {/* New concepts */}
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
            👆 מושגים חדשים — לחצי לגלות
          </div>
          <div className="flex flex-wrap mb-5">
            <GlossaryChip term="העברה לבן-אדם" explanation={
              <span>
                הרגע שבו העוזר עוצר ואומר ״כאן נכנס בן-אדם״ — ומעביר את השיחה לצוות.<br /><br />
                עוזר טוב נמדד לא רק במה שהוא עונה — אלא <strong>במה שהוא יודע לא לענות</strong>.
                באנגלית קוראים לזה Handoff.
              </span>
            } />
            <GlossaryChip term="תחום רגיש" explanation={
              <span>
                עסק שבו טעות של העוזר היא לא פדיחה — היא נזק אמיתי.
                מרפאה היא תחום רגיש: <strong>שאלה רפואית לעולם לא נענית על ידי העוזר</strong>.<br /><br />
                בתחום רגיש הגדרות קודמות לכל תכונה אחרת.
              </span>
            } />
            <GlossaryChip term="טון" explanation={
              <span>
                איך העוזר נשמע — לא רק מה הוא אומר. מול לקוח כועס, הטון קובע יותר מהתוכן:
                הכרה ברגש מרגיעה, ויכוח מצית.<br /><br />
                גם את הטון כותבים בתדריך — הוא לא ״קורה מעצמו״.
              </span>
            } />
          </div>

          {/* How this differs */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.18)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#c2410c" }}>🛠️ הפעם — את קובעת את הסדר</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.6)" }}>
              ב״יום בחיי״ הצעדים היו סלולים: תדריך ← פדיחה ← גדרות ← בדיקה.<br />
              כאן יש <strong>שלוש הגדרות לבנות — ואין סדר נכון אחד</strong>. את בוחרת במה לטפל קודם.
              כשכל השלוש מוכנות — מריצים את העוזר בשיחה אמיתית.
            </div>
          </div>

          {/* The client brief */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-start gap-3">
              <span className="text-[26px]">🦷</span>
              <div dir="rtl">
                <div className="text-[12.5px] font-black mb-1" style={{ color: NAVY }}>הלקוח החדש שלך: מרפאת שיניים ״חיוך״</div>
                <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
                  ד״ר נועה לוי, רופאה אחת · רותם, מזכירה אחת · שעות קבלה: ראשון–חמישי 09:00–19:00.<br />
                  הבקשה: עוזר וואטסאפ שקובע תורים ועונה על שאלות —{" "}
                  <strong>כי רותם לא מספיקה לענות לטלפונים ולוואטסאפ בו-זמנית.</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 text-[13px] leading-[1.7]" dir="rtl"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <span className="font-bold" style={{ color: NAVY }}>שימי לב:</span>{" "}
            מרפאה היא לא מאפייה. חלה שלא קיימת זו פדיחה — עצה רפואית שגויה זה נזק.
            שלוש ההגדרות שתכתבי עכשיו הן ההבדל.
          </div>

          <button onClick={() => go("hub")}
            className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
            ללוח ההגדרות ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Hub — בחירה חופשית של סדר ההגדרות ───────────────────────────────────────
  if (phase === "hub") {
    const allDone = doneCount === 3;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>לוח ההגדרות של העוזר</div>
          <div className="text-[13px] mb-5" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>
            {allDone
              ? "כל שלוש ההגדרות מוכנות — העוזר שלך מוכן להרצת ניסיון."
              : "בחרי במה לטפל קודם — אין סדר נכון אחד. כל הגדרה נבחנת מול הודעה אמיתית."}
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {DECISION_ORDER.map(id => {
              const d = DECISIONS[id];
              const isDone = done[id];
              return (
                <button key={id} onClick={() => !isDone && go(id)} disabled={isDone} className="text-right w-full">
                  <div className="rounded-2xl px-4 py-4 flex items-center gap-3 transition-all"
                    style={{
                      background: isDone ? "rgba(34,197,94,0.07)" : "#fff",
                      border: isDone ? "1.5px solid #22c55e55" : "1.5px solid rgba(124,58,237,0.25)",
                      boxShadow: isDone ? "none" : "0 2px 12px rgba(124,58,237,0.08)",
                    }}>
                    <span className="text-[24px] shrink-0">{d.emoji}</span>
                    <div className="flex-1" dir="rtl">
                      <div className="text-[13.5px] font-black" style={{ color: isDone ? "#15803d" : NAVY }}>
                        {isDone ? "✓ " : ""}{d.title}
                      </div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>{d.sub}</div>
                    </div>
                    <span className="text-[16px] font-bold shrink-0" style={{ color: isDone ? "#22c55e" : AI }}>
                      {isDone ? "✓" : "←"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {allDone && (
            <button onClick={() => go("demo")}
              className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: ORANGE, fontFamily: "'Heebo', sans-serif" }}>
              הרצת ניסיון — העוזר שלך בשיחה חיה ←
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Decision phases ─────────────────────────────────────────────────────────
  if (phase === "promises" || phase === "tone" || phase === "handoff") {
    const id = phase;
    const d = DECISIONS[id];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>{d.emoji} {d.title}</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>{d.sub}</div>
          <Decision
            situation={d.situation}
            customerMsg={d.customerMsg}
            options={d.options}
            onDone={(firstTryOk) => {
              if (firstTryOk) setScore(s => s + 1);
              setDone(prev => ({ ...prev, [id]: true }));
              go("hub");
            }}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Demo — העוזר שלך בשיחה חיה ─────────────────────────────────────────────
  if (phase === "demo") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>הרצת ניסיון — שיחה אמיתית</div>
          <div className="text-[13px] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.42)" }}>
            ערב ראשון של העוזר באוויר. מטופלת כותבת ב-20:30 — אחרי ששעות הקבלה נגמרו:
          </div>

          <Chat title="whatsapp — מרפאת שיניים חיוך · 20:30" lines={[
            { from: "customer", text: "היי, אפשר לקבוע תור לניקוי אבנית?" },
            { from: "ai", text: "בשמחה! 😊 הפנוי הקרוב: יום שלישי ב-11:00 או יום חמישי ב-16:30 — מה נוח לך?", label: "✓ מציע רק מה שקיים ביומן — ההגדרה שלך", labelColor: "#86efac" },
            { from: "customer", text: "יום חמישי. ותגידו — הניקוי כואב? יש משהו לקחת לפני?" },
            { from: "ai", text: "שיריינתי לך יום חמישי 16:30 ✓ ולגבי כאב והכנה — זו שאלה לד״ר לוי, אני מעביר לה ותקבלי תשובה לפני התור.", label: "✓ שאלה רפואית ← בן-אדם — ההגדרה שלך", labelColor: "#86efac" },
            { from: "customer", text: "אה ודרך אגב, בפעם שעברה חיכיתי המון וזה עצבן אותי." },
            { from: "ai", text: "מבין אותך, המתנה ארוכה באמת מתסכלת 🙏 מעביר את זה לרותם שתחזור אלייך — חשוב לנו שיהיה לך נוח אצלנו.", label: "✓ מכיר ברגש, לא מתווכח, מעביר — ההגדרה שלך", labelColor: "#86efac" },
            { from: "customer", text: "מעולה, תודה! נתראה בחמישי 😊" },
          ]} />

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#15803d" }}>✓ שלוש ההגדרות שלך — בפעולה בשיחה אחת</div>
            <div className="text-[12px] leading-[1.8]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              🤝 <strong>הבטחות</strong> — הציע רק תורים שקיימים ביומן, בלי ״אל דאגה הכול יסתדר״<br />
              🙋 <strong>העברה לבן-אדם</strong> — שאלה רפואית עברה מיד לד״ר לוי<br />
              😤 <strong>טון</strong> — תלונה קיבלה הכרה ברגש והעברה לרותם, בלי ויכוח ובלי הבטחות
            </div>
          </div>

          {/* Payoff */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f172a" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>🌅 למחרת בבוקר</div>
            <div className="text-[12.5px] leading-[1.75]" dir="rtl" style={{ color: "#e2e8f0" }}>
              רותם פותחת את המחשב ב-08:50. במקום תיבה של שיחות שלא נענו —{" "}
              <strong style={{ color: "#c4b5fd" }}>רשימת תורים מסודרת שנקבעו בערב</strong>, שאלה אחת מסומנת
              ״לד״ר לוי — לפני התור של חמישי״, ופנייה אחת ״לחזור אליה היום״.
            </div>
            <div className="text-[11.5px] mt-3 leading-[1.6]" dir="rtl" style={{ color: "#94a3b8" }}>
              ההודעות של 20:30 בערב — אלה שפעם פשוט הלכו לאיבוד — הפכו למטופלים עם תור.{" "}
              <strong style={{ color: "#e2e8f0" }}>זה מה שהעוזר שלך שווה למרפאה.</strong>
            </div>
          </div>

          <button onClick={() => go("done")}
            className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
            לסיכום המיני-פרויקט ←
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
        const journey = JSON.parse(localStorage.getItem("ai-journey") || "{}");
        localStorage.setItem("ai-journey", JSON.stringify({ ...journey, mystery: true }));
      } catch {/* ignore */}
      window.location.href = href;
    }

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-7">
            <div className="text-[52px] mb-2">🦷</div>
            <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>
              בנית עוזר למרפאה אמיתית
            </div>
            <div className="text-[13px]" dir="rtl" style={{ color: "rgba(0,0,0,0.4)" }}>
              שלוש הגדרות · הרצת ניסיון אחת · מזכירה אחת שמתחילה את הבוקר אחרת
            </div>
          </div>

          <div className="mb-7">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>
              מה הגדרת בפרויקט
            </div>
            <div className="flex flex-col gap-2">
              {[
                ["מה מותר להבטיח", "רק מה שקיים ביומן — אמפתיה כן, הבטחות שווא לא"],
                ["תגובה לכעס", "הכרה ברגש, בלי ויכוח, בלי הבטחות — והעברה לבן-אדם"],
                ["העברה לבן-אדם", "שאלה רפואית או מצוקה — העוזר עוצר ומעביר מיד"],
                ["הרצת ניסיון", "שיחה שלמה שבה שלוש ההגדרות עבדו יחד"],
              ].map(([tool, desc]) => (
                <div key={tool} className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(34,197,94,0.07)", border: "1px solid #22c55e44" }}>
                  <span style={{ color: "#15803d" }}>✓</span>
                  <div dir="rtl">
                    <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{tool}</div>
                    <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(251,133,0,0.08)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>
              מה זה אומר לקריירה שלך
            </div>
            <div className="text-[13px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              מה שעשית כאן — להחליט מה מותר להבטיח, איך נשמעים מול כעס, ומתי עוצרים ומעבירים לבן-אדם —
              זו בדיוק העבודה של מיישמי AI בעסקים אמיתיים.{" "}
              <span className="font-bold" style={{ color: NAVY }}>הכלי משתנה כל שנה. השיפוט הזה — נשאר.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/ai/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: AI, fontFamily: "'Heebo', sans-serif" }}>
            לכלי עיבוד החוויה ←
          </button>
          <button onClick={() => saveAndGo("/explore")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${AI}`, color: AI, fontFamily: "'Heebo', sans-serif" }}>
            לחקר תחומי הייטק נוספים ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}
