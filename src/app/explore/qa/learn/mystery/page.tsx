"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const AMBER = "#d97706";
const NAVY = "#023e8a";

type Phase = "intro" | "clue1" | "clue2" | "clue3" | "conclusion" | "done";
const PHASE_ORDER: Phase[] = ["clue1", "clue2", "clue3", "conclusion"];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

// ─── Question — one simple multiple-choice with feedback ──────────────────────

function Question({
  q, options, correct, okMsg, errMsg, nextLabel, onNext, onAnswer,
}: {
  q: string; options: string[]; correct: number;
  okMsg: string; errMsg: string; nextLabel: string; onNext: () => void;
  onAnswer: (ok: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    onAnswer(i === correct);
  }

  return (
    <div>
      <div className="text-[14.5px] font-bold mb-4" style={{ color: NAVY }}>{q}</div>
      <div className="flex flex-col gap-2.5 mb-4">
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
              <div className="rounded-2xl px-4 py-3.5 text-[13.5px] leading-[1.5] transition-all" style={{ background: bg, border, color }}>
                {answered && isCorrect && "✓ "}{answered && isPicked && !isCorrect && "✗ "}{opt}
              </div>
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <div className="rounded-2xl px-4 py-3.5 text-[13px] leading-[1.6] mb-4"
            style={{
              background: picked === correct ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
              border: `1px solid ${picked === correct ? "#22c55e55" : "#dc262644"}`,
              color: picked === correct ? "#15803d" : "#b91c1c",
            }}>
            {picked === correct ? okMsg : errMsg}
          </div>
          <button onClick={onNext}
            className="w-full py-4 rounded-2xl font-black text-[14.5px] text-white transition-all active:scale-[0.98]"
            style={{ background: AMBER, ...HEEBO }}>
            {nextLabel}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// חוזרים בדיוק לשלב שבו נעצרנו, כולל הניקוד — אחרת מסך הסיכום מציג 0/N שגוי
function loadSavedState(): { phase?: Phase; score?: number } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("qa-mystery-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function QAMystery() {
  const [phase, setPhase] = useState<Phase>(() => loadSavedState().phase ?? "intro");
  const [score, setScore] = useState(() => loadSavedState().score ?? 0);

  useEffect(() => {
    try { localStorage.setItem("qa-mystery-state", JSON.stringify({ phase, score })); } catch {/* ignore */}
  }, [phase, score]);

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  function markDone() {
    try {
      const cur = JSON.parse(localStorage.getItem("qa-journey") || "{}");
      localStorage.setItem("qa-journey", JSON.stringify({ ...cur, mystery: true }));
    } catch {/* ignore */}
  }

  function answered(ok: boolean) {
    if (ok) setScore((s) => s + 1);
  }

  const pNum = phase === "done" ? PHASE_ORDER.length : phaseNum(phase);

  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: AMBER }}>
      <div className="max-w-[640px] mx-auto">
        <Link href="/explore/qa" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.82 }}>
          ← חזרה ל-QA
        </Link>
        <div className="text-[19px]" style={HEEBO}>איך הבאג הזה עבר בדיקה?</div>
        <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>3 רמזים פשוטים · TechFlow</div>
        {pNum > 0 && (
          <div className="mt-3 h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(pNum / PHASE_ORDER.length) * 100}%`, background: "#fff" }} />
          </div>
        )}
      </div>
    </div>
  );

  // ─── Done ─────────────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
        {Header}
        <div className="flex-1 max-w-[640px] mx-auto w-full px-5 pt-6 pb-32">
          <div className="rounded-2xl p-5 mb-5 text-center"
            style={{ background: "rgba(217,119,6,0.06)", border: "1.5px solid rgba(217,119,6,0.2)" }}>
            <div className="text-[32px] mb-2">🕵️</div>
            <div className="text-[20px] font-black mb-2" style={{ color: AMBER, ...HEEBO }}>
              פענחת את התעלומה
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.55)" }}>
              {score}/{PHASE_ORDER.length} תשובות נכונות בפעם הראשונה
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>מה גילית</div>
            {[
              "✓ יש מקרה אחד שאף פעם לא נבדק — תשלום עם קוד הנחה לא קיים",
              "✓ הוא דולג 'זמנית' לפני חודשיים, ואף אחת לא חזרה אליו",
              "✓ בדיוק המקרה הזה הוא מה שקרה ללקוחה בפועל",
            ].map((line, i) => (
              <div key={i} className="text-[12.5px] mb-2 leading-[1.5]" style={{ color: "#15803d" }}>{line}</div>
            ))}
            <div className="mt-3 pt-3 text-[12.5px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
              זה בדיוק מה שבודקת QA עושה: לא רק לבדוק דברים חדשים — גם לוודא ששום דבר לא נשכח בדרך.
            </div>
          </div>

          <Link href="/explore/qa/experience"
            className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
            style={{ background: AMBER, color: "#fff", ...HEEBO }}>
            לכלי עיבוד החוויה ←
          </Link>
          <Link href="/explore/qa"
            className="block w-full py-3.5 rounded-2xl text-center text-[13px] font-bold"
            style={{ background: "rgba(217,119,6,0.08)", color: AMBER }}>
            מיציתי — חזרה ל-QA ←
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      {Header}

      <div className="flex-1 max-w-[640px] mx-auto w-full px-5 pt-5 pb-32">

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <>
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(217,119,6,0.05)", border: "1.5px solid rgba(217,119,6,0.15)" }}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: AMBER }}>
                🏢 TechFlow
              </div>
              <div className="text-[13px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)" }}>
                לקוחה ניסתה להזין קוד הנחה — והאתר חייב אותה בסכום שגוי. הכל כבר תוקן. עכשיו נבין ביחד: <span className="font-bold" style={{ color: AMBER }}>איך זה בכלל הגיע ללקוחות?</span>
              </div>
            </div>

            <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[13px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)" }}>
                יש לך <span className="font-bold" style={{ color: NAVY }}>3 רמזים פשוטים</span>. כל רמז — סיפור קצר ושאלה אחת. בסוף תחליטי מה באמת קרה.
              </div>
            </div>

            <button type="button" onClick={() => go("clue1")}
              className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
              style={{ background: AMBER, color: "#fff", ...HEEBO }}>
              רמז ראשון ←
            </button>
          </>
        )}

        {/* ── CLUE 1 ── */}
        {phase === "clue1" && (
          <>
            <div className="text-[12px] font-bold mb-2" style={{ color: AMBER }}>רמז 1 מתוך 3</div>
            <div className="text-[17px] font-black mb-4" style={{ color: NAVY, ...HEEBO }}>מה בדקו לפני שהאתר עלה?</div>

            <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
                רשימת הבדיקות שנעשו
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { text: "להתחבר לאתר", done: true },
                  { text: "להוסיף מוצר לעגלה", done: true },
                  { text: "לשלם עם קוד הנחה תקין", done: true },
                  { text: "לשלם עם קוד הנחה שלא קיים", done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: item.done ? "rgba(34,197,94,0.06)" : "rgba(0,0,0,0.03)" }}>
                    <span className="text-[16px] shrink-0">{item.done ? "✅" : "⬜"}</span>
                    <span className="text-[13px]" style={{ color: item.done ? "#15803d" : "rgba(0,0,0,0.45)" }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Question
              q="לפי הרשימה, מה לא נבדק לפני השחרור?"
              options={["התחברות לאתר", "תשלום עם קוד הנחה שלא קיים", "הוספת מוצר לעגלה"]}
              correct={1}
              okMsg="✓ נכון! בדיוק המקרה הזה לא היה ברשימת הבדיקות."
              errMsg="✗ לא בדיוק. תראי שוב את הרשימה — לשלושה יש ✅. לרביעי אין."
              onAnswer={answered}
              nextLabel="רמז שני ←"
              onNext={() => go("clue2")}
            />
          </>
        )}

        {/* ── CLUE 2 ── */}
        {phase === "clue2" && (
          <>
            <div className="text-[12px] font-bold mb-2" style={{ color: AMBER }}>רמז 2 מתוך 3</div>
            <div className="text-[17px] font-black mb-4" style={{ color: NAVY, ...HEEBO }}>למה זה לא נבדק?</div>

            <div className="rounded-2xl p-4 mb-5 flex gap-3 items-start"
              style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}>
              <span className="text-[24px] shrink-0">🗒️</span>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#92400e" }}>
                  פתק מלפני חודשיים
                </div>
                <div className="text-[13px] leading-[1.65]" style={{ color: "#7c4a03" }}>
                  &quot;הבדיקה הזו נכשלת לפעמים בלי סיבה ברורה. בואו נדלג עליה כרגע — ונחזור לזה מאוחר יותר.&quot;
                </div>
              </div>
            </div>

            <Question
              q="מה קרה בסוף עם ה'מאוחר יותר'?"
              options={["מישהי חזרה לבדיקה למחרת ותיקנה אותה", "אף אחת לא חזרה לבדיקה הזו יותר", "הבדיקה לא הייתה חשובה מלכתחילה"]}
              correct={1}
              okMsg="✓ נכון — 'נחזור לזה מאוחר יותר' הפך לעולם לא. זה קורה המון: משהו נדחה 'לזמנית' ופשוט נשכח."
              errMsg="✗ לא. אף אחת לא חזרה לבדיקה הזו — היא נשארה מדולגת חודשיים, בדיוק עד שהבאג הגיע ללקוחות."
              onAnswer={answered}
              nextLabel="רמז שלישי ←"
              onNext={() => go("clue3")}
            />
          </>
        )}

        {/* ── CLUE 3 ── */}
        {phase === "clue3" && (
          <>
            <div className="text-[12px] font-bold mb-2" style={{ color: AMBER }}>רמז 3 מתוך 3</div>
            <div className="text-[17px] font-black mb-4" style={{ color: NAVY, ...HEEBO }}>מה הלקוחה בעצם חוותה?</div>

            <div className="rounded-2xl p-4 mb-5 flex gap-3 items-start"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <span className="text-[24px] shrink-0">💬</span>
              <div className="text-[13px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)" }}>
                הלקוחה הזינה קוד הנחה שלא קיים. במקום שהאתר יגיד לה &quot;קוד לא תקין&quot; — הוא חייב אותה בסכום שגוי.
              </div>
            </div>

            <Question
              q="האם זה בדיוק המקרה שראית ברשימה בתור 'לא נבדק'?"
              options={["כן — בדיוק אותו מקרה", "לא — זה משהו אחר לגמרי"]}
              correct={0}
              okMsg="✓ נכון — זה בדיוק המקרה שדולג בבדיקות, ומעולם לא נבדק בפועל."
              errMsg="✗ בעצם כן — קוד הנחה שלא קיים הוא בדיוק המקרה שדולג ברמז הראשון."
              onAnswer={answered}
              nextLabel="לפתרון התעלומה ←"
              onNext={() => go("conclusion")}
            />
          </>
        )}

        {/* ── CONCLUSION ── */}
        {phase === "conclusion" && (
          <>
            <div className="text-[17px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>אז למה הבאג הזה הגיע ללקוחות?</div>
            <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.5)" }}>שלושת הרמזים מספיקים כדי לענות.</div>

            <Question
              q="בחרי את התשובה הנכונה:"
              options={[
                "המתכנתת שכתבה את הקוד לא הייתה מספיק טובה",
                "בדיקה חשובה דולגה 'זמנית' כי הייתה בעייתית — ואף אחת לא חזרה אליה",
                "אי אפשר בכלל למנוע באגים כאלה",
              ]}
              correct={1}
              okMsg="✓ מדויק! זו לא אשמת אדם אחד — זה מה שקורה כשמשהו 'זמני' נשכח. בדיוק בשביל זה QA טובה עוקבת גם אחרי בדיקות שדולגו, לא רק כותבת בדיקות חדשות."
              errMsg="✗ לא בדיוק. התשובה: בדיקה חשובה דולגה זמנית בגלל בעיה, ואף אחת לא חזרה אליה אחר כך — זה קרה בתהליך, לא באדם אחד."
              onAnswer={answered}
              nextLabel="סיום — ראי את הסיכום ←"
              onNext={() => { markDone(); go("done"); }}
            />
          </>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
