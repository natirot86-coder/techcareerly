"use client";
import React, { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — עיצוב UX/UI
const PINK = "#db2777";
const NAVY = "#023e8a";

type Phase = "intro" | "decide-message" | "decide-buttons" | "decide-label" | "result";

const PHASE_ORDER: Phase[] = ["decide-message", "decide-buttons", "decide-label", "result"];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

// ─── בחירות העיצוב ────────────────────────────────────────────────────────────

type MessageChoice = "warm" | "formal" | "generic";
type ButtonsChoice = "one" | "three";
type LabelChoice = "request" | "need-help";

type Choices = {
  message: MessageChoice | null;
  buttons: ButtonsChoice | null;
  label: LabelChoice | null;
};

const HEADLINES: Record<MessageChoice, string> = {
  warm: "צריכים משהו? השכנים כאן.",
  formal: "גמ״ח שכונתי — פלטפורמה קהילתית לשיתוף ציוד ועזרה הדדית",
  generic: "ברוכים הבאים לאפליקציה!",
};

const LABELS: Record<LabelChoice, string> = {
  request: "שלח בקשה",
  "need-help": "אני צריך/ה עזרה",
};

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block mb-1 mr-1">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
        style={{
          background: open ? "rgba(219,39,119,0.14)" : "rgba(219,39,119,0.06)",
          border: `1px solid rgba(219,39,119,${open ? 0.3 : 0.15})`,
          color: PINK, fontFamily: "'Heebo', sans-serif",
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

function GlossaryRow({ terms }: { terms: { term: string; explanation: React.ReactNode }[] }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
        👆 לחצי על מונח לקבל הסבר
      </div>
      <div className="flex flex-wrap">
        {terms.map(t => <GlossaryChip key={t.term} term={t.term} explanation={t.explanation} />)}
      </div>
    </div>
  );
}

// ─── DesignChoice — בחירה עם טרייד-אופים, לא נכון/לא-נכון ─────────────────────
// אפשר להתחרט ולבחור מחדש עד שממשיכים — כמו בעבודה אמיתית.

function DesignChoice<T extends string>({
  q, options, picked, onPick, nextLabel, onNext,
}: {
  q: string;
  options: { value: T; title: string; preview?: string; feedback: React.ReactNode }[];
  picked: T | null;
  onPick: (v: T) => void;
  nextLabel: string;
  onNext: () => void;
}) {
  const chosen = options.find(o => o.value === picked) ?? null;
  return (
    <div>
      <div className="text-[13.5px] font-bold mb-1.5" style={{ color: NAVY }}>{q}</div>
      <div className="text-[11px] mb-4" style={{ color: "rgba(0,0,0,0.4)" }}>
        אין תשובה נכונה — יש שיקולים. אפשר לבחור, לקרוא מה זה נותן ומה זה עולה, ולהתחרט.
      </div>
      <div className="flex flex-col gap-3 mb-4">
        {options.map(opt => {
          const isPicked = opt.value === picked;
          return (
            <button key={opt.value} type="button" onClick={() => onPick(opt.value)} className="text-right w-full">
              <div className="rounded-xl px-4 py-3 transition-all"
                style={{
                  background: isPicked ? "rgba(219,39,119,0.07)" : "#fff",
                  border: isPicked ? `1.5px solid ${PINK}` : "1.5px solid rgba(0,0,0,0.08)",
                }}>
                <div className="text-[13px] font-bold" style={{ color: isPicked ? PINK : "rgba(0,0,0,0.75)" }}>
                  {isPicked && "● "}{opt.title}
                </div>
                {opt.preview && (
                  <div className="text-[11.5px] mt-1 leading-[1.5]" style={{ color: "rgba(0,0,0,0.45)" }}>
                    "{opt.preview}"
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {chosen && (
        <>
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.7] mb-3" dir="rtl"
            style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.14)", color: "rgba(0,0,0,0.7)" }}>
            {chosen.feedback}
          </div>
          <button onClick={onNext}
            className="w-full py-[13px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
            {nextLabel}
          </button>
        </>
      )}
    </div>
  );
}

// ─── LiveScreen — המסך שנבנה מהבחירות, מתעדכן בזמן אמת ────────────────────────

function LiveScreen({ choices, big }: { choices: Choices; big?: boolean }) {
  const label = choices.label ? LABELS[choices.label] : "— הכפתור עוד לא נוסח —";
  const showThree = choices.buttons === "three";
  return (
    <div className="mx-auto" style={{ maxWidth: big ? 300 : 250 }}>
      <div className="rounded-[24px] p-[7px]" style={{ background: "#1e293b", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
        <div className="rounded-[18px] overflow-hidden" style={{ background: "#fffdf8" }} dir="rtl">
          {/* כותרת האפליקציה */}
          <div className="px-3 py-2.5 text-center" style={{ background: "#0f766e" }}>
            <span className="text-[12px] font-black text-white">🤝 גמ״ח השכונה</span>
          </div>
          <div className="px-4 pt-6 pb-5 text-center">
            {/* הכותרת הראשית — החלטה 1 */}
            {choices.message ? (
              <div className="font-black leading-[1.45] mb-6"
                style={{
                  color: NAVY,
                  fontSize: choices.message === "formal" ? 13 : 17,
                  fontFamily: "'Heebo', sans-serif",
                }}>
                {HEADLINES[choices.message]}
              </div>
            ) : (
              <div className="rounded-xl py-4 px-3 mb-6 text-[11px]"
                style={{ border: "1.5px dashed rgba(0,0,0,0.2)", color: "rgba(0,0,0,0.35)" }}>
                כאן תבוא הכותרת — עוד לא הוחלט
              </div>
            )}

            {/* הכפתורים — החלטות 2 + 3 */}
            {choices.buttons === null ? (
              <div className="rounded-xl py-3 px-3 text-[11px]"
                style={{ border: "1.5px dashed rgba(0,0,0,0.2)", color: "rgba(0,0,0,0.35)" }}>
                כאן יבואו הכפתורים — עוד לא הוחלט
              </div>
            ) : showThree ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-xl py-2.5 text-[12px] font-bold text-white" style={{ background: "#0f766e" }}>{label}</div>
                <div className="rounded-xl py-2.5 text-[12px] font-bold" style={{ border: "1.5px solid #0f766e", color: "#0f766e" }}>אני רוצה לעזור</div>
                <div className="rounded-xl py-2.5 text-[12px] font-bold" style={{ border: "1.5px solid rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.5)" }}>מה זה הגמ״ח?</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl py-4 text-[14px] font-black text-white" style={{ background: "#0f766e" }}>{label}</div>
                <div className="text-[10px] underline" style={{ color: "rgba(0,0,0,0.4)" }}>רוצה דווקא לעזור לשכנים? לחצו כאן</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-center text-[10px] font-bold mt-2" style={{ color: "rgba(0,0,0,0.35)" }}>
        המסך שלך — מתעדכן עם כל החלטה
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UxMysteryPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [choices, setChoices] = useState<Choices>({ message: null, buttons: null, label: null });

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (next === "result") {
      // סימון סיום המיני-פרויקט — מפתח המסע של התחום
      try {
        const journey = JSON.parse(localStorage.getItem("ux-journey") || "{}");
        localStorage.setItem("ux-journey", JSON.stringify({ ...journey, mystery: true }));
      } catch { /* ignore */ }
    }
    setPhase(next);
  }

  function goBack() {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx > 0) go(PHASE_ORDER[idx - 1]);
    else if (phase === "decide-message") go("intro");
  }
  const canGoBack = phase !== "intro" && phase !== "result";

  const pNum = phaseNum(phase);
  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: PINK }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/ux" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {canGoBack && (
            <button onClick={goBack} className="text-[12px] font-bold" style={{ opacity: 0.82, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
              שלב קודם ↩
            </button>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>מיני-פרויקט: עצב/י את מסך הקבלה</div>
        {pNum > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.65 }}>
              <span>החלטה {Math.min(pNum, 3)} מתוך 3</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pNum / PHASE_ORDER.length) * 100}%`, background: "#fff" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          {/* גשר — מה כבר יש לך מהשלב הקודם */}
          <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#15803d" }}>✅ מה שכבר יש לך מהיום-בחיי</div>
            <div className="text-[12px] leading-[1.85]" style={{ color: "rgba(0,0,0,0.65)" }}>
              ✓ לקרוא מפת נטישה — לדעת איפה אנשים עוזבים<br />
              ✓ מיקרו-קופי — משפט קטן שעונה בדיוק על החשש<br />
              ✓ היררכיה — לבקש עכשיו רק מה שחייבים
            </div>
          </div>

          {/* מסגור שונה — הפעם את יוצרת */}
          <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "rgba(219,39,119,0.06)", border: "1.5px solid rgba(219,39,119,0.2)" }}>
            <div className="text-[13px] font-black mb-1.5" style={{ color: NAVY }}>🎨 הפעם זה שונה: לא מתקנים — יוצרים</div>
            <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.68)" }}>
              ביום-בחיי תיקנת מסך קיים והייתה תשובה נכונה. הפעם את מעצבת מסך חדש מאפס —
              <strong> ואין תשובה נכונה. יש שיקולים.</strong> כל בחירה נותנת משהו ועולה משהו,
              והעבודה היא לבחור בעיניים פקוחות. ככה זה באמת בתפקיד.
            </div>
          </div>

          {/* הפרויקט */}
          <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: NAVY }}>📋 הפרויקט</div>
            <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.68)" }}>
              הגמ״ח השכונתי — שכנים שמשאילים זה לזה ציוד, מביאים קניות ועוזרים בקטנות —
              עובר לאפליקציה. רוב המשתמשים: <strong>אנשים מבוגרים</strong>, חלקם בפעם הראשונה
              שלהם באפליקציה שאינה וואטסאפ. המשימה שלך: <strong style={{ color: PINK }}>לעצב את מסך
              הקבלה</strong> — המסך הראשון שהם יראו. שלוש החלטות בונות אותו.
            </div>
          </div>

          {/* הפרסונה — למי מעצבים */}
          <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[20px]" style={{ background: "rgba(2,62,138,0.08)" }}>👵</div>
              <div>
                <div className="text-[13px] font-black" style={{ color: NAVY }}>רחל, בת 72</div>
                <div className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>המשתמשת שמעצבים בשבילה</div>
              </div>
            </div>
            <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
              גרה לבד בקומה שלישית בלי מעלית. שולחת וואטסאפ לנכדים, וזהו פחות או יותר.
              האותיות הקטנות מקשות עליה, מילים באנגלית מרתיעות אותה —
              והכי חשוב: <strong>היא לא אוהבת "להטריח"</strong>. אם המסך יבלבל אותה
              או יביך אותה — היא תסגור ותוותר, בשקט.
            </div>
          </div>

          {/* כלים חדשים */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>🛠️ מושגים חדשים לפרויקט הזה</div>
          <GlossaryRow terms={[
            { term: "פרסונה", explanation: "דמות מייצגת של המשתמש שמעצבים בשבילו — עם שם, גיל והרגלים. רחל היא הפרסונה שלנו. כשמתלבטים בין אפשרויות, שואלים: מה רחל הייתה מבינה? לא \"מה יפה בעיניי\"." },
            { term: "עומס קוגניטיבי", explanation: "כמה המוח צריך לעבוד כדי להבין מסך. כל אפשרות נוספת, כל מילה מסובכת — מוסיפות עומס. אצל משתמשים שאינם רגילים לאפליקציות, עומס גבוה = סגירת האפליקציה." },
            { term: "נגישות", explanation: "עיצוב שעובד גם למי שרואה פחות טוב, ידיים פחות יציבות, או פחות ניסיון דיגיטלי. בפועל: אותיות גדולות, ניגודיות חזקה, כפתורים גדולים ומרווחים. לא תוספת נחמדה — תנאי כניסה." },
          ]} />

          {/* המסך הריק */}
          <div className="mb-5">
            <LiveScreen choices={choices} />
          </div>

          <button onClick={() => go("decide-message")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
            להחלטה הראשונה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Decision 1 — המסר ──────────────────────────────────────────────────────
  if (phase === "decide-message") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 1 — מה הדבר האחד שהמסך צריך להגיד?</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            לרחל יש בערך שלוש שניות של סבלנות במסך הראשון. משפט אחד יתפוס אותן.
            בחרי — ותראי אותו מופיע על המסך למטה.
          </div>

          <DesignChoice
            q="איזו כותרת תקבל את רחל?"
            options={[
              {
                value: "warm" as MessageChoice,
                title: "החם והפשוט",
                preview: HEADLINES.warm,
                feedback: <span><strong style={{ color: NAVY }}>מה זה נותן:</strong> חמש מילים, בגובה העיניים, ורחל מיד מבינה בשביל מה זה — שכנים שעוזרים. <strong style={{ color: NAVY }}>מה זה עולה:</strong> לא מוסבר איך זה עובד ומי מאחורי זה — מי שחשדן יצטרך עוד מידע בהמשך. לרוב, בשביל מסך ראשון — זו עסקה משתלמת.</span>,
              },
              {
                value: "formal" as MessageChoice,
                title: "הרשמי והמלא",
                preview: HEADLINES.formal,
                feedback: <span><strong style={{ color: NAVY }}>מה זה נותן:</strong> מדויק, מכובד, ומסביר הכל — אף אחד לא יגיד שהוסתר ממנו משהו. <strong style={{ color: NAVY }}>מה זה עולה:</strong> "פלטפורמה קהילתית" היא לא מילה שרחל משתמשת בה. תשע מילים ארוכות = עומס, וכל מילה שדורשת פענוח היא עוד סיבה לסגור. שימי לב גם איך זה מקטין את האותיות במסך.</span>,
              },
              {
                value: "generic" as MessageChoice,
                title: "החגיגי והכללי",
                preview: HEADLINES.generic,
                feedback: <span><strong style={{ color: NAVY }}>מה זה נותן:</strong> נעים, חגיגי, אי אפשר לטעות בו. <strong style={{ color: NAVY }}>מה זה עולה:</strong> הוא לא אומר כלום — אפשר להדביק אותו על כל אפליקציה בעולם. השאלה שרחל שואלת בשלוש השניות היא "מה אני עושה עכשיו?" — והמשפט הזה לא עונה עליה.</span>,
              },
            ]}
            picked={choices.message}
            onPick={v => setChoices(c => ({ ...c, message: v }))}
            nextLabel="ההחלטה התקבלה — לכפתורים ←"
            onNext={() => go("decide-buttons")}
          />

          <div className="mt-6">
            <LiveScreen choices={choices} />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Decision 2 — כפתור אחד או שלושה ────────────────────────────────────────
  if (phase === "decide-buttons") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 2 — כפתור אחד או שלושה?</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            לגמ״ח יש שלושה שימושים: לבקש עזרה, להציע עזרה, ולהבין מה זה בכלל.
            כמה כפתורים שמים במסך הראשון?
          </div>

          <DesignChoice
            q="מה רחל תראה מתחת לכותרת?"
            options={[
              {
                value: "one" as ButtonsChoice,
                title: "כפתור אחד גדול — והשאר בקטן למטה",
                feedback: <span><strong style={{ color: NAVY }}>מה זה נותן:</strong> דרך אחת ברורה. אפס התלבטות — רחל יודעת בדיוק על מה ללחוץ, והכפתור גדול מספיק גם ליד פחות יציבה. <strong style={{ color: NAVY }}>מה זה עולה:</strong> מי שנכנסה דווקא כדי לעזור תצטרך למצוא את הקישור הקטן. זה מחיר אמיתי — אבל מי שבאה לעזור בדרך כלל מחפשת בסבלנות; מי שזקוקה לעזרה — פחות.</span>,
              },
              {
                value: "three" as ButtonsChoice,
                title: "שלושה כפתורים — כל האפשרויות גלויות",
                feedback: <span><strong style={{ color: NAVY }}>מה זה נותן:</strong> הכל על השולחן — גם המבקשת, גם המתנדבת, גם הסקרנית מוצאות את הדרך שלהן מיד. <strong style={{ color: NAVY }}>מה זה עולה:</strong> שלוש החלטות במסך הראשון = עומס קוגניטיבי. אצל משתמשים מבוגרים, ריבוי אפשרויות הוא סיבה מרכזית לקפוא — או לסגור. אם בוחרים בזה, חובה שהראשון יבלוט בבירור מהשאר.</span>,
              },
            ]}
            picked={choices.buttons}
            onPick={v => setChoices(c => ({ ...c, buttons: v }))}
            nextLabel="ההחלטה התקבלה — לניסוח ←"
            onNext={() => go("decide-label")}
          />

          <div className="mt-6">
            <LiveScreen choices={choices} />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Decision 3 — ניסוח הכפתור ──────────────────────────────────────────────
  if (phase === "decide-label") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[16px] mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 3 — איך מנסחים את הכפתור הראשי?</div>
          <div className="text-[13px] leading-[1.7] mb-4" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            זה נראה כמו פרט שולי — שתי מילים על כפתור. אבל זה בדיוק המיקרו-קופי
            שלמדת עליו, ובאפליקציה הזו יש לו משקל רגשי: מה זה דורש מרחל להגיד על עצמה?
          </div>

          <DesignChoice
            q='"שלח בקשה" מול "אני צריך/ה עזרה" — מה על הכפתור?'
            options={[
              {
                value: "request" as LabelChoice,
                title: "שלח בקשה",
                feedback: <span><strong style={{ color: NAVY }}>מה זה נותן:</strong> נייטרלי. "בקשה" לא דורשת מרחל להצהיר שום דבר על עצמה — היא פשוט מבקשת משהו, כמו כולם. <strong style={{ color: NAVY }}>מה זה עולה:</strong> קצת קר וטופסי, כמעט כמו פנייה לעירייה. אבל הנה תובנה מפתיעה מהתחום: לפעמים הניסוח המתחשב ביותר הוא דווקא הפחות אישי — כי הוא לא מבקש מאף אחד להודות במשהו.</span>,
              },
              {
                value: "need-help" as LabelChoice,
                title: "אני צריך/ה עזרה",
                feedback: <span><strong style={{ color: NAVY }}>מה זה נותן:</strong> חם, אנושי, ישיר — בדיוק רוח הגמ״ח. אין ספק מה הכפתור עושה. <strong style={{ color: NAVY }}>מה זה עולה:</strong> כדי ללחוץ עליו, רחל צריכה להגיד על עצמה "אני צריכה עזרה" — ולאישה שכל חייה הסתדרה לבד ולא אוהבת להטריח, זו מילה יקרה מאוד. יש אנשים שלא ילחצו — לא כי לא הבינו, אלא כי הבינו מצוין.</span>,
              },
            ]}
            picked={choices.label}
            onPick={v => setChoices(c => ({ ...c, label: v }))}
            nextLabel="סיימתי — תראו לי את המסך שלי ←"
            onNext={() => go("result")}
          />

          <div className="mt-6">
            <LiveScreen choices={choices} />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  const summaryLines = [
    choices.message === "warm" ? "כותרת חמה ופשוטה — חמש מילים בגובה העיניים"
      : choices.message === "formal" ? "כותרת רשמית ומלאה — מדויקת, במחיר של עומס"
      : "כותרת חגיגית וכללית — נעימה, בלי לכוון לפעולה",
    choices.buttons === "one" ? "כפתור אחד גדול — דרך אחת ברורה, המתנדבות בקישור קטן"
      : "שלושה כפתורים — הכל גלוי, במחיר של יותר התלבטות",
    choices.label === "request" ? "\"שלח בקשה\" — נייטרלי, לא דורש מרחל להצהיר כלום"
      : "\"אני צריך/ה עזרה\" — חם וישיר, במחיר רגשי למי שקשה לה לבקש",
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {Header}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-8 pb-32">
        <div className="text-center mb-6">
          <div className="text-[46px] mb-2">🎉</div>
          <div className="text-[24px] leading-tight mb-2" style={{ color: NAVY, ...HEEBO }}>
            זה המסך שעיצבת
          </div>
          <div className="text-[13px]" dir="rtl" style={{ color: "rgba(0,0,0,0.5)" }}>
            שלוש החלטות — ומסך קבלה שלם, שנבנה בשביל רחל
          </div>
        </div>

        <div className="mb-6">
          <LiveScreen choices={choices} big />
        </div>

        {/* סיכום הבחירות שלה — הבחירות שלה, לא "הנכונות" */}
        <div className="rounded-2xl p-4 mb-4" dir="rtl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="text-[12px] font-black mb-2.5" style={{ color: NAVY }}>ההחלטות שקיבלת:</div>
          {summaryLines.map((t, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
              <span style={{ color: PINK }}>●</span>
              <span className="text-[12.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>{t}</span>
            </div>
          ))}
        </div>

        {/* ככה בדיוק עובד מעצב מוצר */}
        <div className="rounded-2xl p-4 mb-4" dir="rtl"
          style={{ background: "linear-gradient(135deg, rgba(219,39,119,0.08) 0%, rgba(168,85,247,0.08) 100%)", border: "1.5px solid rgba(219,39,119,0.2)" }}>
          <div className="text-[13px] font-black mb-2" style={{ color: NAVY }}>💡 ככה בדיוק עובד מעצב מוצר</div>
          <div className="text-[12.5px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.68)" }}>
            מה שעשית עכשיו — זה התפקיד: הכרת את רחל (פרסונה), שקלת כל בחירה במונחים של
            מה היא נותנת ומה היא עולה, וחשבת גם על המחיר הרגשי של שתי מילים על כפתור.
            <strong> אין עיצוב מושלם — יש עיצוב שנבחר בעיניים פקוחות, ואז נבדק על אנשים אמיתיים.</strong>{" "}
            הצעד הבא בעבודה אמיתית? להראות את המסך הזה לחמש רחלות — ולראות מה קורה.
          </div>
        </div>

        <div className="rounded-xl p-3.5 mb-6 text-[12px] leading-[1.65]" dir="rtl"
          style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.6)" }}>
          🛒 ובמונחי החנות שליוותה אותנו: סידרת חנות שלמה — החלטת מה רואים בכניסה,
          כמה מעברים פותחים, ואיזה שלט תולים. עכשיו מחכים ללקוחות.
        </div>

        <Link href="/explore/ux/experience"
          className="block w-full py-[14px] rounded-xl font-bold text-[15px] text-white mb-3 text-center"
          style={{ background: PINK, fontFamily: "'Heebo', sans-serif" }}>
          להמשך — מה זה עשה לך? כלי עיבוד החוויה ←
        </Link>
        <Link href="/explore/ux"
          className="block w-full py-[13px] rounded-xl font-bold text-[14px] text-center"
          style={{ border: `1.5px solid ${PINK}`, color: PINK, fontFamily: "'Heebo', sans-serif" }}>
          חזרה למפת התחום
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
