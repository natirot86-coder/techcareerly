"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const BLUE = "#3b82f6";
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Phase =
  | "career"
  | "intro"
  | "step-first"
  | "ping-result"
  | "trace-result"
  | "dns-result"
  | "fix-it"
  | "postmortem"
  | "done";

const PHASE_ORDER: Phase[] = [
  "step-first", "ping-result",
  "trace-result",
  "dns-result",
  "fix-it", "postmortem",
];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

// ─── Terminal ─────────────────────────────────────────────────────────────────

function Terminal({ lines }: { lines: { text: string; color?: string; label?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>terminal</span>
      </div>
      <div className="p-4 font-mono text-[12px] leading-[2]" style={{ background: "#0f172a" }} dir="ltr">
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-3">
            <span style={{ color: l.color ?? "#e2e8f0", flex: 1 }}>{l.text || "\u00a0"}</span>
            {l.label && (
              <span className="text-[10px] px-2 py-0.5 rounded shrink-0" dir="rtl"
                style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd", fontFamily: "'Heebo', sans-serif" }}>
                {l.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Question ─────────────────────────────────────────────────────────────────

function Question({
  q, options, correct, okMsg, errMsg, onAnswer, nextLabel, onNext,
}: {
  q: string; options: string[]; correct: number;
  okMsg: string; errMsg: string; onAnswer: (ok: boolean) => void;
  nextLabel?: string; onNext?: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(i === correct);
  }
  const answered = picked !== null;
  return (
    <div>
      <div className="text-[13.5px] font-bold mb-4" style={{ color: NAVY }}>{q}</div>
      <div className="flex flex-col gap-3 mb-4">
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
          <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-3"
            style={{
              background: picked === correct ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
              border: `1px solid ${picked === correct ? "#22c55e55" : "#dc262644"}`,
              color: picked === correct ? "#15803d" : "#b91c1c",
            }}>
            {picked === correct ? okMsg : errMsg}
          </div>
          {nextLabel && onNext && (
            <button onClick={onNext}
              className="w-full py-[13px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
              {nextLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── RevealCard ───────────────────────────────────────────────────────────────

function RevealCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(59,130,246,0.18)" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(59,130,246,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, fontFamily: "'Heebo', sans-serif" }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(59,130,246,0.03)" }}>
          {children}
        </div>
      )}
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
          background: open ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.06)",
          border: `1px solid rgba(59,130,246,${open ? 0.3 : 0.15})`,
          color: BLUE, fontFamily: "monospace",
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

// ─── Video embed ──────────────────────────────────────────────────────────────

function VideoEmbed({ id, label }: { id: string; label: string }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
      <div className="px-4 py-2.5" style={{ background: "rgba(0,0,0,0.04)" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>🎥 סרטון בעברית</div>
        <div className="text-[12px] font-bold" style={{ color: NAVY }}>{label}</div>
      </div>
      <div className="relative" style={{ paddingTop: "56.25%" }}>
        <iframe src={`https://www.youtube.com/embed/${id}`} title={label} allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} />
      </div>
    </div>
  );
}

// ─── PacketVisual ─────────────────────────────────────────────────────────────

function PacketVisual() {
  const [selected, setSelected] = useState<0 | 50 | 100 | null>(null);
  const scenarios: { loss: 0 | 50 | 100; label: string; color: string }[] = [
    { loss: 0,   label: "0% packet loss",   color: "#15803d" },
    { loss: 50,  label: "50% packet loss",  color: "#d97706" },
    { loss: 100, label: "100% packet loss", color: "#dc2626" },
  ];
  const returns = selected === 0 ? 4 : selected === 50 ? 2 : 0;
  const msgs: Record<number, string> = {
    0:   "כל הPackets חזרו — חיבור מושלם ✓",
    50:  "חצי מהPackets אבדו — יש בעיה ברשת ⚠️",
    100: "אף Packet לא חזר — החיבור חסום לחלוטין ✗",
  };
  return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="text-[11px] font-bold uppercase tracking-widest mb-3 text-center" style={{ color: "rgba(0,0,0,0.35)" }}>
        לחצי על תרחיש כדי לראות מה קורה
      </div>
      <div className="flex gap-2 mb-4 justify-center">
        {scenarios.map(s => (
          <button key={s.loss} onClick={() => setSelected(s.loss)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{ background: selected === s.loss ? s.color : "rgba(0,0,0,0.05)", color: selected === s.loss ? "#fff" : "rgba(0,0,0,0.5)" }}>
            {s.label}
          </button>
        ))}
      </div>
      {selected !== null && (
        <>
          <div className="flex justify-center gap-4 mb-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="text-[22px]">📦</div>
                <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i < returns
                    ? <span style={{ color: "#15803d", fontSize: 18, fontWeight: 900 }}>↩</span>
                    : <span style={{ color: "#dc2626", fontSize: 16, fontWeight: 900 }}>✗</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center text-[12.5px] font-bold py-2 rounded-lg"
            style={{
              background: selected === 0 ? "rgba(34,197,94,0.1)" : selected === 50 ? "rgba(234,179,8,0.1)" : "rgba(220,38,38,0.1)",
              color: selected === 0 ? "#15803d" : selected === 50 ? "#92400e" : "#b91c1c",
            }}>
            {msgs[selected]}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ClickableHops ────────────────────────────────────────────────────────────

const HOPS = [
  { n: 1, ip: "192.168.1.1",   ms: "1.2ms",  ok: true,  name: "Router ביתי",      desc: "הRouter שלך בבית — הצעד הראשון מחוץ למחשב שלך" },
  { n: 2, ip: "10.0.0.1",      ms: "3.1ms",  ok: true,  name: "ISP Gateway",       desc: "שער הכניסה לספק האינטרנט שלך (בזק/HOT/Partner)" },
  { n: 3, ip: "72.14.215.1",   ms: "8.4ms",  ok: true,  name: "ISP Backbone",      desc: "הגב של ספק האינטרנט — הרשת הפנימית המהירה שלהם" },
  { n: 4, ip: "108.170.246.1", ms: "11.2ms", ok: true,  name: "Backbone Router",   desc: "Router בין-אזורי. עד כאן הכל תקין." },
  { n: 5, ip: "* * *",         ms: "—",      ok: false, name: "⚠️ לא מגיב",         desc: "הPacket הגיע לנקודה הזו ולא חזר. כאן מתחילה הבעיה." },
  { n: 6, ip: "* * *",         ms: "—",      ok: false, name: "⚠️ לא מגיב",         desc: "גם כאן timeout. הבעיה בין hop 4 לשרת היעד." },
];

function ClickableHops() {
  const [openHop, setOpenHop] = useState<number | null>(null);
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>traceroute — לחצי על כל hop לפרטים</span>
      </div>
      <div style={{ background: "#0f172a" }}>
        {HOPS.map(h => (
          <div key={h.n}>
            <button className="w-full text-right px-4 py-2.5 transition-colors"
              style={{ background: openHop === h.n ? "rgba(59,130,246,0.12)" : "transparent" }}
              onClick={() => setOpenHop(openHop === h.n ? null : h.n)} dir="ltr">
              <div className="flex items-center gap-3 font-mono text-[12px]">
                <span style={{ color: "#64748b", minWidth: 14 }}>{h.n}</span>
                <span style={{ color: h.ok ? "#22c55e" : "#f87171", minWidth: 110 }}>{h.ip}</span>
                <span style={{ color: "#94a3b8", minWidth: 50 }}>{h.ok ? h.ms : ""}</span>
                <span style={{ color: h.ok ? "#22c55e" : "#f87171" }}>{h.ok ? "✓" : "⚠️"}</span>
              </div>
            </button>
            {openHop === h.n && (
              <div className="px-4 pb-3 pt-1" dir="rtl"
                style={{ background: "rgba(59,130,246,0.08)", borderTop: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="text-[12.5px] font-bold mb-1" style={{ color: h.ok ? "#93c5fd" : "#fca5a5" }}>{h.name}</div>
                <div className="text-[12px] leading-[1.6]" style={{ color: "#94a3b8" }}>{h.desc}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Timeline Reconstruction ──────────────────────────────────────────────────

const TIMELINE_CORRECT = [1, 2, 3, 4, 5, 6];
const TIMELINE_EVENTS = [
  { id: 1, time: "08:46", text: "Deployment אוטומטי ריצה ושינה DNS record בטעות" },
  { id: 2, time: "08:47", text: "Alert מופעל: checkout.acme-store.com UNREACHABLE" },
  { id: 3, time: "08:47", text: "ping → 100% packet loss" },
  { id: 4, time: "08:49", text: "traceroute → * * * ב-hops 5–6" },
  { id: 5, time: "08:51", text: "nslookup → Private IP 10.0.0.5 מתגלה" },
  { id: 6, time: "09:10", text: "DNS record מתוקן → האתר חוזר לחיים ✓" },
];
// Shuffled display order
const SHUFFLED = [3, 5, 1, 6, 2, 4];

function TimelineReconstruction({ onDone }: { onDone: () => void }) {
  const [clicked, setClicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  function clickEvent(id: number) {
    if (checked) return;
    if (clicked.includes(id)) {
      setClicked(clicked.filter(c => c !== id));
    } else if (clicked.length < 6) {
      setClicked([...clicked, id]);
    }
  }

  const isCorrect = checked && JSON.stringify(clicked) === JSON.stringify(TIMELINE_CORRECT);
  const score = checked ? clicked.filter((id, i) => id === TIMELINE_CORRECT[i]).length : 0;

  function reset() { setClicked([]); setChecked(false); }

  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>
        ✋ אינטראקטיבי — בני את הציר הזמני
      </div>
      <div className="text-[12.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
        לחצי על האירועים <strong>לפי הסדר הכרונולוגי הנכון</strong> — מה קרה ראשון, שני, שלישי...
      </div>

      {/* Events to order */}
      <div className="flex flex-col gap-2 mb-4">
        {SHUFFLED.map(id => {
          const ev = TIMELINE_EVENTS.find(e => e.id === id)!;
          const pos = clicked.indexOf(id);
          const selected = pos >= 0;
          let bg = "#fff", border = "1px solid rgba(0,0,0,0.08)", color = "rgba(0,0,0,0.7)";
          if (checked && selected) {
            const correct = clicked[pos] === TIMELINE_CORRECT[pos];
            bg = correct ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)";
            border = correct ? "1px solid #22c55e55" : "1px solid #dc262644";
            color = correct ? "#15803d" : "#b91c1c";
          } else if (selected) {
            bg = "rgba(59,130,246,0.08)"; border = "1.5px solid rgba(59,130,246,0.3)"; color = NAVY;
          }
          return (
            <button key={id} onClick={() => clickEvent(id)} disabled={checked} className="text-right w-full">
              <div className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                style={{ background: bg, border, color }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
                  style={{ background: selected ? (checked && clicked[pos] === TIMELINE_CORRECT[pos] ? "#22c55e" : checked ? "#dc2626" : BLUE) : "rgba(0,0,0,0.08)", color: selected ? "#fff" : "rgba(0,0,0,0.3)" }}>
                  {selected ? pos + 1 : ""}
                </div>
                <span className="text-[12.5px] flex-1">{ev.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Check button */}
      {!checked && clicked.length === 6 && (
        <button onClick={() => setChecked(true)} className="w-full py-3 rounded-xl font-bold text-[14px] mb-4"
          style={{ background: BLUE, color: "#fff", fontFamily: "'Heebo', sans-serif" }}>
          בדקי את הסדר ←
        </button>
      )}

      {/* Result */}
      {checked && (
        <div>
          <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
            style={{
              background: isCorrect ? "rgba(34,197,94,0.08)" : "rgba(59,130,246,0.06)",
              border: `1px solid ${isCorrect ? "#22c55e55" : "rgba(59,130,246,0.2)"}`,
              color: isCorrect ? "#15803d" : NAVY,
            }}>
            {isCorrect
              ? "✓ מושלם! הסדר הכרונולוגי מדויק. כך נראה Post-Mortem אמיתי."
              : `${score}/6 אירועים במקום הנכון. ${score >= 4 ? "כמעט! " : ""}הסדר הנכון מסומן בירוק.`}
          </div>

          {/* Correct timeline reveal */}
          {!isCorrect && (
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              {TIMELINE_EVENTS.map((ev, i) => (
                <div key={ev.id} className="flex items-start gap-3 px-3 py-2.5"
                  style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  <span className="text-[10px] font-mono shrink-0 mt-0.5" style={{ color: BLUE }}>{ev.time}</span>
                  <span className="text-[12px]" style={{ color: "rgba(0,0,0,0.7)" }}>{ev.text}</span>
                </div>
              ))}
            </div>
          )}

          {!isCorrect && (
            <button onClick={reset} className="w-full py-2.5 rounded-xl font-bold text-[13px] mb-4"
              style={{ border: `1.5px solid ${BLUE}`, color: BLUE, background: "transparent", fontFamily: "'Heebo', sans-serif" }}>
              נסי שוב ↺
            </button>
          )}

          <button onClick={onDone} className="w-full py-[13px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
            לסיכום ←
          </button>
        </div>
      )}

      {!checked && clicked.length < 6 && (
        <div className="text-center text-[11px] mt-2" style={{ color: "rgba(0,0,0,0.35)" }}>
          {clicked.length}/6 אירועים נבחרו
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// חוזרים בדיוק לשלב שבו נעצרנו, כולל הניקוד — אחרת מסך הסיכום מציג ניקוד שגוי
function loadSavedState(): { phase?: Phase; score?: number } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("networks-day-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function DayPage() {
  const [phase, setPhase] = useState<Phase>(() => loadSavedState().phase ?? "career");
  const [score, setScore] = useState(() => loadSavedState().score ?? 0);

  useEffect(() => {
    try { localStorage.setItem("networks-day-state", JSON.stringify({ phase, score })); } catch {/* ignore */}
  }, [phase, score]);

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }
  function answer(ok: boolean) { if (ok) setScore(s => s + 1); }

  function goBack() {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx > 0) go(PHASE_ORDER[idx - 1]);
    else if (phase === "step-first") go("intro");
    else if (phase === "intro") go("career");
  }
  const canGoBack = phase !== "career" && phase !== "done";

  const pNum = phaseNum(phase);
  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: BLUE }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/networks" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {canGoBack && (
            <button onClick={goBack} className="text-[12px] font-bold" style={{ opacity: 0.82, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
              שלב קודם ↩
            </button>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי Network Engineer</div>
        {pNum > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.65 }}>
              <span>שלב {pNum} מתוך {PHASE_ORDER.length}</span>
              <span>{score} נקודות</span>
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

  // ── Career ─────────────────────────────────────────────────────────────────
  if (phase === "career") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה Network Engineer?</div>
          <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנצלול לתקלה אמיתית — בואי נבין את התפקיד</div>

          <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.12)" }}>
            <img src="/domains/network-engineer.jpeg" alt="" className="w-full object-cover" style={{ height: "200px" }} />
          </div>

          {/* Timeline — נשאר גלוי */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "08:30", icon: "📊", task: "בדיקת dashboard — כל הרשתות ירוקות? יש alerts?" },
              { time: "09:00", icon: "🛠️", task: "טיפול בtickets: שינוי הרשאות VPN לעובד חדש" },
              { time: "11:00", icon: "📐", task: "תכנון: ישיבה על ארכיטקטורת רשת למשרד חדש" },
              { time: "13:30", icon: "🔥", task: "incident! שרת production לא נגיש — ping, traceroute, fix" },
              { time: "16:00", icon: "📝", task: "Post-mortem: תיעוד מה קרה, למה, ומה עשינו" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: "rgba(0,0,0,0.35)", minWidth: 34 }}>{item.time}</span>
                <span className="text-[16px] shrink-0">{item.icon}</span>
                <span className="text-[12.5px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.7)" }}>{item.task}</span>
              </div>
            ))}
          </div>

          {/* Salary — נשאר גלוי */}
          <div className="rounded-xl p-4 mb-5 flex gap-4 items-center" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div className="text-[28px]">💰</div>
            <div>
              <div className="text-[13px] font-black" style={{ color: NAVY }}>₪12,000 – ₪30,000 לחודש</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>NOC מתחיל · Network Engineer בכיר · Cloud Architect</div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>כניסה: CCNA / CompTIA Network+ · 6–12 חודשי לימוד</div>
            </div>
          </div>

          {/* Wow card — ריגוש וסיפוק — גלוי */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.08) 100%)", border: "1.5px solid rgba(59,130,246,0.2)" }}>
            <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>⚡ למה אנשים אוהבים את התפקיד הזה</div>
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: "🎯", text: "הרגע שהאתר חוזר לחיים — אחרי 20 דקות של אבחון, לחצת Enter ו-2.5 מיליון איש יכולים שוב לקנות. יש סיפוק שמעט תפקידים אחרים נותנים." },
                { emoji: "🌐", text: "את רואה את האינטרנט מבפנים — בעוד שכולם גולשים בלי לדעת מה קורה, את מבינה בדיוק איך כל בית, עסק ושרת מחוברים זה לזה." },
                { emoji: "🔍", text: "כל תקלה היא חידה — ping → traceroute → nslookup → 'אה! DNS Record שגוי'. גאוות הבלש שפתרה משהו שהטרידה חברה שלמה." },
                { emoji: "📈", text: "קריירה שמתפצלת לכיוונים מדהימים — Cloud, Security, אפילו Startup שבונה את תשתית הרשת הבאה." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[16px] shrink-0 mt-0.5">{item.emoji}</span>
                  <span className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.7)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RevealCards — שאר הפרטים */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>רוצי לדעת עוד? לחצי להרחבה</div>

          <RevealCard emoji="🏢" title="איפה עובדים ואיזה תפקידים קיימים?">
            <div className="flex flex-col gap-3">
              {[
                {
                  role: "NOC Technician", co: "בזק, Partner, HOT",
                  desc: "מוקד ניטור 24/7 — בודקת dashboards, מגיבה לalerts, פותחת tickets. זה תפקיד הכניסה הכי נפוץ. משמרות, עבודת צוות, ולמידה מהירה.",
                  badge: "כניסה: CompTIA Network+ · 6 חודשים",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=NOC+technician",
                },
                {
                  role: "Network Engineer", co: "Intel, Amdocs, בנקים",
                  desc: "תכנון ובנייה של תשתיות — מגדירה רשתות, בונה VPN, מנהלת switches ו-routers. עובדת על פרויקטים ולא רק תגובה לתקלות.",
                  badge: "אחרי 2–3 שנות ניסיון: CCNA",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Network+Engineer",
                },
                {
                  role: "Cloud Network Architect", co: "AWS, Azure, חברות SaaS",
                  desc: "רשתות ענן בסקייל עולמי — VPC, subnets, load balancers, CDN. המקצוע הכי מבוקש ב-2024 עם שכר גבוה במיוחד.",
                  badge: "אחרי 4–6 שנות ניסיון + AWS/Azure cert",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Cloud+Network",
                },
                {
                  role: "Security Network Engineer", co: "Check Point, ClearSky, IDF",
                  desc: "Firewall, VPN, IDS/IPS — שמירה על הרשת מפני פורצים. חוצה בין רשתות לסייבר, אחד מהתחומים הכי חמים בישראל.",
                  badge: "אחרי ניסיון ברשתות + Security cert",
                  link: "https://www.alljobs.co.il/Search/Upload/2/0/0/0?txt=Network+Security+Engineer",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.12)" }}>
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-black" style={{ color: BLUE }}>{item.role}</span>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>{item.co}</span>
                  </div>
                  <div className="text-[11.5px] leading-[1.65] mb-2" style={{ color: "rgba(0,0,0,0.6)" }}>{item.desc}</div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(59,130,246,0.1)", color: BLUE }}>
                      📍 {item.badge}
                    </span>
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-bold"
                      style={{ color: "rgba(0,0,0,0.35)", textDecoration: "underline" }}>
                      ראי משרות דומות ←
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </RevealCard>

          <RevealCard emoji="🔥" title="האתגרים האמיתיים של התפקיד">
            <div>
              {[
                { emoji: "📱", text: "On-call: תקלה ב-3 לילה — הטלפון מצלצל. חייבים לקפוץ. (לא בכל תפקיד — תלוי בחברה)" },
                { emoji: "💸", text: "לחץ incidents: כל דקה של downtime = עשרות אלפי ₪ הפסד לחברה. אבל גם — הסיפוק כשפותרים." },
                { emoji: "🔄", text: "שינויים בזהירות מירבית — שינוי קטן ברשת יכול להשפיע על אלפי משתמשים." },
                { emoji: "🧩", text: "מורכבות: רשתות גדולות הן פאזל של מאות רכיבים שצריכים לעבוד יחד." },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-2 ${i > 0 ? "mt-2.5 pt-2.5" : ""}`} style={i > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}}>
                  <span className="shrink-0">{item.emoji}</span>
                  <span className="text-[12px] leading-[1.6]">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealCard>

          <RevealCard emoji="🌫️" title="החלקים הפחות מסעירים (שאף אחד לא מספר עליהם)">
            <div className="text-[12px] leading-[1.75]">
              🟢 שעות ארוכות של monitoring — dashboard ירוק ולא קורה כלום<br />
              📋 כתיבת תיעוד טכני מפורט לכל שינוי<br />
              🔩 עדכון firmware לעשרות מכשירים — שגרתי ואיטי<br />
              📅 ישיבות SLA עם management על uptime percentages<br />
              🕳️ "אנחנו לא רואים אותך כשהכל עובד" — ההצלחה שקופה
            </div>
          </RevealCard>

          <RevealCard emoji="🎥" title="5 דברים שמהנדסי רשת לומדים בעבודה — בעברית (4 דק')">
            <VideoEmbed id="rrOPnWr3JSs" label="5 דברים שמהנדסי רשת לומדים בעבודה" />
          </RevealCard>

          <button onClick={() => go("intro")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white mt-2"
            style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
            הבנתי — קדימה לתקלה האמיתית ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-5" style={{ color: "rgba(0,0,0,0.62)" }}>
            יום שני. 08:47 בבוקר. את ה-Network Engineer התורנית.
          </div>
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
            style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <span style={{ fontSize: 14 }}>🖥️</span>
            <span className="text-[11.5px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>
              <strong style={{ color: NAVY }}>NOC</strong> = Network Operations Center — חדר הבקרה של כל רשתות הארגון.
              ה-Dashboard מציג בזמן אמת אם כל שירות עולה או נופל.
            </span>
          </div>

          <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f172a" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>NOC Dashboard</div>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(220,38,38,0.15)", border: "1px solid #dc262644" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f87171" }}>CRITICAL</span>
                </div>
                <div className="font-mono text-[12px]" style={{ color: "#e2e8f0" }}>checkout.acme-store.com — UNREACHABLE</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>08:47:03 · 0% uptime last 5 min</div>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#eab308" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#ca8a04" }}>WARNING</span>
                </div>
                <div className="font-mono text-[12px]" style={{ color: "#e2e8f0" }}>payments.acme-store.com — latency 8,200ms</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>08:46:51 · SLA threshold exceeded</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-4 mb-5 text-[13.5px] leading-[1.7]"
            style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
            הטלפון מתחיל לצלצל. אנשי Sales מתקשרים. checkout לא עובד — לקוחות לא יכולים לשלם.{" "}
            <span className="font-bold" style={{ color: NAVY }}>כל דקה = כסף שהולך לאיבוד.</span>
          </div>
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
            <div className="text-[12px] font-bold mb-2" style={{ color: "#c2410c" }}>🛠️ הכלים שישמשו אותנו</div>
            <div className="flex flex-col gap-1.5">
              {[
                { tool: "ping", desc: "בודק אם שרת מגיב בכלל" },
                { tool: "traceroute", desc: "מוצא איפה בדיוק הבעיה ברשת" },
                { tool: "nslookup", desc: "בודק לאיזה כתובת מצביע שם הדומיין" },
              ].map(({ tool, desc }) => (
                <div key={tool} className="flex items-center gap-2">
                  <code className="text-[11px] font-black px-2 py-0.5 rounded"
                    style={{ background: "rgba(251,133,0,0.12)", color: "#c2410c" }}>{tool}</code>
                  <span className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.6)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => go("step-first")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
            קחי את התקלה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Step First ─────────────────────────────────────────────────────────────
  if (phase === "step-first") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-5" style={{ color: "rgba(0,0,0,0.62)" }}>08:47. יש לך alert. עכשיו — מה הצעד הראשון?</div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f172a", border: "1px solid rgba(220,38,38,0.3)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f87171" }}>🔴 CRITICAL ALERT</div>
            <div className="font-mono text-[12.5px]" style={{ color: "#e2e8f0" }}>
              checkout.acme-store.com — UNREACHABLE<br />
              <span style={{ color: "#64748b" }}>0% uptime last 5 minutes</span>
            </div>
          </div>
          <GlossaryRow terms={[
            { term: "ping", explanation: "פקודה שבודקת: האם שרת מגיב? שולחת 4 חבילות קטנות ומחכה לתשובה. תוצאה תוך שניות." },
            { term: "hosting provider", explanation: "חברה שמספקת שרתים — AWS, בזק International, GoDaddy. ספקית השרת של acme-store." },
          ]} />
          <Question
            q="את Network Engineer התורנית. מה הצעד הראשון?"
            options={[
              "שלחי email לכל הdepartment שיש תקלה",
              "הריצי ping ל-checkout.acme-store.com",
              "התקשרי ישר לhosting provider",
            ]}
            correct={1}
            okMsg="✓ נכון — קודם מאספים נתונים בעצמנו. Ping נותן מידע ראשוני תוך שניות, בלי לסחוב אחרים לפני שיודעים מה קורה."
            errMsg="✗ לפני שפונים לאחרים — צריך להבין מה קורה. Ping הוא הצעד הראשון."
            onAnswer={ok => answer(ok)}
            nextLabel="הרץ Ping ←"
            onNext={() => go("ping-result")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Ping Result ────────────────────────────────────────────────────────────
  if (phase === "ping-result") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>הרצת ping. קראי כל שורה בתשומת לב:</div>
          <Terminal lines={[
            { text: "$ ping checkout.acme-store.com", color: "#60a5fa" },
            { text: "PING checkout.acme-store.com (185.42.11.8): 56 bytes", color: "#94a3b8", label: "גודל הpacket" },
            { text: "Request timeout for icmp_seq 0", color: "#f87171", label: "אין תגובה" },
            { text: "Request timeout for icmp_seq 1", color: "#f87171", label: "אין תגובה" },
            { text: "Request timeout for icmp_seq 2", color: "#f87171", label: "אין תגובה" },
            { text: "Request timeout for icmp_seq 3", color: "#f87171", label: "אין תגובה" },
            { text: "--- statistics ---", color: "#64748b" },
            { text: "4 packets tx, 0 received, 100% packet loss", color: "#f87171", label: "מאה אחוז אובדן!" },
          ]} />

          <GlossaryRow terms={[
            { term: "packet", explanation: "חבילת מידע — הדרך שבה מחשבים מעבירים נתונים. כל הודעה מחולקת לחבילות קטנות שנשלחות ברשת." },
            { term: "icmp_seq", explanation: "מספר סידורי של החבילה (icmp_seq 0 = חבילה ראשונה). מאפשר לדעת איזו חבילה לא חזרה." },
            { term: "Request timeout", explanation: "שלחנו חבילה — לא קיבלנו תשובה בזמן. יכול להיות חסימה, עומס, או שהשרת לא מגיב." },
            { term: "packet loss", explanation: "אחוז החבילות שנשלחו ולא חזרו. 0% = מצוין. 100% = לא חזרה אפילו חבילה אחת." },
            {
              term: "Firewall",
              explanation: (
                <span>
                  חומת אש — מערכת שחוסמת סוגי תעבורה ברשת לפי חוקים.<br /><br />
                  <strong>חשוב:</strong> Firewalls רבים חוסמים ICMP בכוונה (זה הפרוטוקול שping משתמש בו), כי פורצים משתמשים בו למיפוי רשתות.<br /><br />
                  לכן: <strong>ping שלא מגיב לא בהכרח = שרת מת</strong>. זה יכול פשוט אומר שה-Firewall מסנן.
                </span>
              )
            },
            {
              term: "latency / RTT",
              explanation: (
                <span>
                  <strong>Latency</strong> = עיכוב בתקשורת — כמה זמן לוקח למידע לעבור מנקודה א׳ לנקודה ב׳.<br /><br />
                  <strong>RTT (Round Trip Time)</strong> = זמן הלוך-חזור — כמה זמן לוקח לpacket לצאת ממחשב שלך, להגיע לשרת, ולחזור.<br /><br />
                  הקשר: RTT = latency × 2 (בערך). ping מדווח RTT כי הוא שולח ומחכה לחזרה.<br /><br />
                  🟢 0–30ms = מצוין · 🟡 30–100ms = סביר · 🔴 100ms+ = גבוה
                </span>
              )
            },
          ]} />

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#dc2626" }}>🔍 מה אנחנו יודעים עכשיו?</div>
            <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
              100% packet loss = הpackets שלחנו לא חזרו.<br />
              אבל זה <strong>לא בהכרח אומר שהשרת מת</strong> — הבעיה יכולה להיות <em>בדרך</em>.<br />
              כמו שאם מכתב לא הגיע — הבעיה אולי בדואר, לא בנמען.
            </div>
          </div>

          <RevealCard emoji="📦" title="רוצי לשחק עם תרחישים שונים של packet loss?">
            <PacketVisual />
          </RevealCard>

          <RevealCard emoji="🎥" title="Ping ו-Traceroute — הסבר בעברית (2 דקות)">
            <VideoEmbed id="7X8D5anJCRo" label="פינג וטרייסארטי — הסבר בעברית" />
          </RevealCard>

          <Question
            q="100% packet loss. מה המסקנה הנכונה?"
            options={[
              "השרת acme-store נמחק מהאינטרנט",
              "יש חסימה בדרך לשרת — לא בהכרח הוא עצמו קרס",
              "המחשב שלי לא מחובר לאינטרנט",
            ]}
            correct={1}
            okMsg="✓ בדיוק! packet loss = בעיה ב-path. צריך כלי שימפה את הדרך — traceroute. קדימה."
            errMsg="✗ 100% packet loss = חסימה בדרך. הבעיה יכולה להיות בכל router בין המחשב לשרת."
            onAnswer={ok => answer(ok)}
            nextLabel="הרץ Traceroute ←"
            onNext={() => go("trace-result")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Traceroute Result ──────────────────────────────────────────────────────
  if (phase === "trace-result") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
            ping הראה 100% packet loss — יש חסימה <em>איפשהו</em>. traceroute עוקב אחרי כל Router בדרך ומוצא <strong>איפה בדיוק</strong>.
          </div>

          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>לחצי על כל hop לפרטים</div>
          <ClickableHops />

          <GlossaryRow terms={[
            { term: "traceroute", explanation: "פקודת אבחון שעוקבת אחרי כל תחנה (hop) בדרך לשרת. שולחת packets עם TTL עולה — כך כל Router בדרך מגיב בתורו." },
            { term: "hop", explanation: "כל Router שה-packet עובר דרכו בדרך לשרת. כמו תחנות בנסיעה — hop 1 = הRouter הביתי, hop אחרון = השרת עצמו." },
            {
              term: "* * *",
              explanation: (
                <span>
                  הpacket הגיע לתחנה הזו — אבל לא קיבלנו תשובה חזרה. כך זה נראה בטרמינל:<br /><br />
                  <code style={{ display: "block", background: "#0f172a", color: "#f87171", padding: "8px 12px", borderRadius: 8, fontSize: 11, direction: "ltr", fontFamily: "monospace", marginBottom: 8 }}>
                    {"5  * * *           ⚠️"}<br />
                    {"6  * * *           ⚠️"}
                  </code>
                  הבעיה נמצאת <strong>בין hop 4 (שענה) לhop 5 (שלא ענה)</strong>. לפעמים * * * = Firewall שחוסם, לא בהכרח תקלה.
                </span>
              )
            },
          ]} />

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: "#92400e" }}>🔍 מה גילינו?</div>
            <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
              Hops 1–4 עובדים תקין. Hops 5–6 = * * *.<br />
              הבעיה נמצאת <strong>בין hop 4 לבין השרת הסופי</strong>.<br />
              זה מצמצם — אבל עדיין לא יודעים <em>מה בדיוק</em> חסום.
            </div>
          </div>

          <RevealCard emoji="📦" title="אנלוגיה — חבילה עם tracking">
            <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
              שלחת חבילה ולא הגיעה. ping = "לא הגיעה". traceroute = tracking מלא:<br />
              🟢 יצאה מבית שולח ✓<br />
              🟢 הגיעה למיון ת"א ✓<br />
              🟢 יצאה לאזור ✓<br />
              🔴 <strong>מרכז חלוקה בחיפה — לא הגיעה</strong><br />
              → הבעיה: מרכז החלוקה בחיפה
            </div>
          </RevealCard>

          <RevealCard emoji="🎥" title="Traceroute — הסבר בעברית (4 דק')">
            <VideoEmbed id="8f5RhuMhBwY" label="Traceroute: כנראה שאתם קוראים את התוצאות בצורה שגויה" />
          </RevealCard>

          <Question
            q="Hops 1–4 תקינים, hops 5–6 מציגים * * *. איפה הבעיה?"
            options={[
              "הRouter הביתי שלי מקולקל",
              "הבעיה נמצאת בדרך בין ה-backbone לשרת היעד",
              "שרת acme-store קרס לחלוטין",
            ]}
            correct={1}
            okMsg="✓ יודעים עכשיו: ISP → backbone = תקין. הבעיה לפני היעד. הכלי הבא — nslookup."
            errMsg="✗ Hops 1–4 תקינים, אז Router והISP בסדר. הבעיה לאחר hop 4."
            onAnswer={ok => answer(ok)}
            nextLabel="הרץ nslookup ←"
            onNext={() => go("dns-result")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── DNS Result ─────────────────────────────────────────────────────────────
  if (phase === "dns-result") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[13.5px] leading-[1.7] mb-3" style={{ color: "rgba(0,0,0,0.62)" }}>
            traceroute מצא שהבעיה לפני היעד. אולי DNS מפנה לכתובת שגויה? nslookup בודק בדיוק את זה.
          </div>

          <GlossaryRow terms={[
            { term: "nslookup", explanation: "Name Server Lookup — שואל את ה-DNS: 'לאיזה IP מצביע הדומיין הזה?' אם הכתובת שגויה — כולם מגיעים למקום הלא נכון." },
            { term: "DNS record", explanation: "רשומה שמקשרת שם דומיין לכתובת IP. כמו שורה בספר טלפונים: checkout.acme-store.com = 185.x.x.x. מישהו יכול לשנות אותה בטעות." },
            { term: "Private IP", explanation: "כתובות IP שקיימות רק בתוך רשת פנימית (10.x.x.x, 192.168.x.x). גולש מהאינטרנט לא יכול להגיע אליהן — הן 'בלתי נראות' מבחוץ." },
          ]} />

          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>הרצת nslookup. קראי את הפלט:</div>
          <Terminal lines={[
            { text: "$ nslookup checkout.acme-store.com", color: "#60a5fa" },
            { text: "Server:   8.8.8.8",                  color: "#94a3b8", label: "שרת DNS (Google)" },
            { text: "Address:  8.8.8.8#53",               color: "#94a3b8", label: "Port 53 = DNS" },
            { text: "" },
            { text: "Name:  checkout.acme-store.com",     color: "#94a3b8" },
            { text: "Address: 10.0.0.5",                  color: "#f87171", label: "⚠️ Private IP!" },
          ]} />
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(220,38,38,0.06)", border: "1.5px solid rgba(220,38,38,0.25)" }}>
            <div className="text-[13px] font-black mb-2" style={{ color: "#dc2626" }}>🎯 מצאת — DNS Bug!</div>
            <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
              <code style={{ color: "#dc2626" }}>10.0.0.5</code> = Private IP — קיים רק בתוך הרשת הפנימית של acme-store.<br />
              כשגולש מהאינטרנט ניגש לcheckout, הDNS מפנה אותו לכתובת שאינה נגישה מבחוץ.
              <strong> זו הסיבה לתקלה.</strong>
            </div>
          </div>
          <Question
            q="מה חשוד בכתובת 10.0.0.5 שהnslookup החזיר?"
            options={[
              "שרת ה-DNS 8.8.8.8 לא אמין",
              "10.0.0.5 הוא Private IP — לא נגיש מהאינטרנט. מישהו שינה DNS record בטעות",
              "חסר ה-IPv6 record (AAAA)",
            ]}
            correct={1}
            okMsg="✓ מצוין! מצאת את הבעיה — DNS record מצביע לכתובת פנימית שאינה נגישה. עכשיו — לתקן!"
            errMsg="✗ 10.x.x.x הוא Private IP range — לא נגיש מהאינטרנט. DNS מצביע לכתובת פנימית בטעות."
            onAnswer={ok => answer(ok)}
            nextLabel="לתיקון התקלה ←"
            onNext={() => go("fix-it")}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Fix It ─────────────────────────────────────────────────────────────────
  if (phase === "fix-it") {
    return <FixItPhase onDone={() => go("postmortem")} />;
  }

  // ── Postmortem ─────────────────────────────────────────────────────────────
  if (phase === "postmortem") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>Post-Mortem Report</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>כל incident מסתיים בתיעוד. זה מה שמבדיל צוות בוגר.</div>

          {/* Etymology card */}
          <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.18)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#c2410c" }}>🔤 מאיפה המילה הזו באה?</div>
            <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
              <strong>Post-Mortem</strong> = לטינית: <em>post</em> (אחרי) + <em>mortem</em> (מוות).<br />
              בתחום הרפואה/משפטי — ניתוח גופה שנועד להבין <em>מה גרם למוות</em>.<br /><br />
              הטק לקח את המונח וכיוון אותו ל-incidents:<br />
              כמו שרופא פתולוג מנתח גופה כדי להבין מה קרה — <strong>אנחנו מנתחים תקלה שנסגרה כדי להבין מה גרם לה</strong>.<br /><br />
              המטרה: לא למצוא אשמים — למצוא <em>שיפורים</em>.
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[13px] font-black mb-2" style={{ color: NAVY }}>מה כוללת Post-Mortem טובה?</div>
            <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
              📝 <strong>מה קרה</strong> — תיאור מדויק של האירוע<br />
              🔍 <strong>Root Cause</strong> — הגורם השורשי (לא הסימפטום)<br />
              ⏱️ <strong>Timeline</strong> — מתי בדיוק קרה כל דבר<br />
              🛡️ <strong>Prevention</strong> — מה ימנע הישנות<br /><br />
              <strong>עובדה:</strong> Google, Amazon ו-Meta מפרסמות Post-Mortems לציבור אחרי outages גדולים — שקיפות מלאה.
            </div>
          </div>

          <TimelineReconstruction onDone={() => go("done")} />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    function saveAndGo(href: string) {
      try {
        const journey = JSON.parse(localStorage.getItem("networks-journey") || "{}");
        localStorage.setItem("networks-journey", JSON.stringify({ ...journey, day: true }));
      } catch { /* ignore */ }
      window.location.href = href;
    }
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-7">
            <div className="text-[52px] mb-2">🛠️</div>
            <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>סגרת case תוך 23 דקות</div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.4)" }}>ממוצע בתעשייה: 47 דקות</div>
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>מה השתמשת היום</div>
            <div className="flex flex-col gap-2">
              {[
                { tool: "ping", desc: "בדיקת קישוריות — 100% packet loss", icon: "📡" },
                { tool: "traceroute", desc: "מיפוי מסלול — * * * ב-hops 5–6", icon: "🗺️" },
                { tool: "nslookup", desc: "גילוי שגיאת DNS — Private IP 10.0.0.5", icon: "🔍" },
                { tool: "DNS Fix", desc: "עדכון record ל-185.42.11.8 + אימות", icon: "🔧" },
                { tool: "Post-Mortem", desc: "תיעוד + root cause + prevention", icon: "📝" },
              ].map(({ tool, desc, icon }) => (
                <div key={tool} className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(34,197,94,0.07)", border: "1px solid #22c55e44" }}>
                  <span className="text-[18px]">{icon}</span>
                  <div>
                    <div className="text-[12.5px] font-bold font-mono" style={{ color: NAVY }}>{tool}</div>
                    <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real world incident */}
          <div className="rounded-2xl p-4 mb-6" style={{ background: "#0f172a" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>📰 זה קורה בעולם האמיתי</div>
            <div className="text-[12.5px] leading-[1.7] mb-3" style={{ color: "#e2e8f0" }}>
              <strong style={{ color: "#60a5fa" }}>Facebook/Meta — אוקטובר 2021</strong><br />
              שינוי configuration ב-BGP routing הוביל לתקלת DNS גלובלית — 6 שעות של downtime מוחלט.
              WhatsApp, Instagram, Facebook — הכל השבית.
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)", borderRight: "3px solid #3b82f6" }}>
              <div className="text-[11.5px] leading-[1.7] italic" style={{ color: "#94a3b8" }}>
                "The root cause of this outage was a faulty configuration change that affected DNS servers globally, making it impossible for users to resolve Facebook services."
              </div>
              <div className="text-[10px] mt-1.5" style={{ color: "#64748b" }}>— Meta Engineering Blog, Oct 4 2021</div>
            </div>
            <div className="text-[11.5px] mt-3 leading-[1.6]" style={{ color: "#94a3b8" }}>
              מה שעשית היום — ping, traceroute, nslookup, DNS fix, post-mortem — <strong style={{ color: "#e2e8f0" }}>זה בדיוק מה שהצוות של Meta עשה, רק בסקייל עולמי.</strong>
            </div>
          </div>

          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(251,133,0,0.08)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>מה זה אומר לקריירה שלך</div>
            <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
              לא כל יום יש תקלה — אבל כשיש,{" "}
              <span className="font-bold" style={{ color: NAVY }}>את זאת שמחזירה את האינטרנט.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/networks/learn/mystery")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
            לתעלומת הרשת ←
          </button>
          <button onClick={() => saveAndGo("/explore/networks/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${BLUE}`, color: BLUE, fontFamily: "'Heebo', sans-serif" }}>
            מיציתי את הטעימה — קדימה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}

// ─── Fix It Phase (separate component to avoid hook rules issues) ─────────────

function FixItPhase({ onDone }: { onDone: () => void }) {
  const BLUE = "#3b82f6";
  const NAVY = "#023e8a";
  const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
  const [picked, setPicked] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);

  const options = [
    { label: "Restart שרת הweb של checkout", why: "✗ הבעיה ב-DNS, לא בשרת. Restart לא יעזור." },
    { label: "עדכן DNS record: checkout.acme-store.com → 185.42.11.8", why: "✓ זה הפתרון — מחליפים את הPrivate IP בPublic IP הנכון." },
    { label: "הריצי traceroute שוב לאיסוף עוד נתונים", why: "✗ כבר יש מספיק נתונים. יודעים שהבעיה ב-DNS." },
  ];
  const correct = 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: BLUE }}>
        <div className="max-w-[720px] mx-auto">
          <div className="text-[20px]" style={HEEBO}>יום בחיי Network Engineer</div>
        </div>
      </div>
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
        <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מצאת — עכשיו מתקנים</div>
        <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>09:05. יודעת מה הבעיה — DNS record שגוי. מה עושים?</div>

        {/* DNS Control Panel mockup */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
          לוח ניהול DNS — acme-store.com
        </div>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 14 }}>🌐</span>
            <span className="text-[12px] font-bold" style={{ color: NAVY }}>DNS Records — acme-store.com</span>
          </div>
          {[
            { subdomain: "checkout", type: "A", value: "10.0.0.5", problem: true },
            { subdomain: "payments", type: "A", value: "185.42.12.3", problem: false },
            { subdomain: "api",      type: "A", value: "185.42.12.4", problem: false },
          ].map((r, i, arr) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", background: r.problem ? "rgba(220,38,38,0.04)" : "#fff" }}>
              <code className="text-[12px] font-bold w-20 shrink-0" style={{ color: r.problem ? "#dc2626" : NAVY }}>{r.subdomain}</code>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.45)" }}>{r.type}</span>
              <code className="text-[12px] flex-1" style={{ color: r.problem ? "#dc2626" : "rgba(0,0,0,0.6)" }}>{r.value}</code>
              {r.problem && <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>⚠️ שגוי</span>}
            </div>
          ))}
        </div>

        {/* Fix options */}
        <div className="text-[13.5px] font-bold mb-4" style={{ color: NAVY }}>מה הצעד הנכון?</div>
        <div className="flex flex-col gap-3 mb-4">
          {options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = i === correct;
            const answered = picked !== null;
            let bg = "#fff", border = "1.5px solid rgba(0,0,0,0.08)", color = "rgba(0,0,0,0.75)";
            if (answered) {
              if (isCorrect) { bg = "rgba(34,197,94,0.08)"; border = "1.5px solid #22c55e55"; color = "#15803d"; }
              else if (isPicked) { bg = "rgba(220,38,38,0.07)"; border = "1.5px solid #dc262644"; color = "#b91c1c"; }
              else { color = "rgba(0,0,0,0.3)"; }
            }
            return (
              <button key={i} type="button" disabled={answered} onClick={() => setPicked(i)} className="text-right w-full">
                <div className="rounded-xl px-4 py-3 text-[13px] transition-all" style={{ background: bg, border, color }}>
                  {opt.label}
                </div>
                {answered && (isPicked || isCorrect) && (
                  <div className="text-[11.5px] px-4 pt-1.5 text-right" style={{ color: isCorrect ? "#15803d" : "#b91c1c" }}>{opt.why}</div>
                )}
              </button>
            );
          })}
        </div>

        {/* After correct fix — show result + DNS propagation */}
        {picked === correct && !verified && (
          <div>
            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid #22c55e55" }}>
              <div className="text-[12px] font-black mb-2" style={{ color: "#15803d" }}>✓ DNS record עודכן!</div>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                {[
                  { subdomain: "checkout", value: "185.42.11.8", fixed: true },
                  { subdomain: "payments", value: "185.42.12.3", fixed: false },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5"
                    style={{ background: r.fixed ? "rgba(34,197,94,0.06)" : "#fff", borderBottom: i === 0 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <code className="text-[12px] font-bold w-20" style={{ color: r.fixed ? "#15803d" : NAVY }}>{r.subdomain}</code>
                    <code className="text-[12px]" style={{ color: r.fixed ? "#15803d" : "rgba(0,0,0,0.6)" }}>{r.value}</code>
                    {r.fixed && <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#15803d" }}>✓ תוקן</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <div className="text-[12px] font-black mb-2" style={{ color: NAVY }}>⏱️ חשוב: DNS Propagation</div>
              <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.65)" }}>
                שינוי DNS לא מיידי — לוקח עד <strong>48 שעות</strong> להתפשט לכל שרתי DNS בעולם.<br />
                בינתיים: ניתן לנקות DNS cache מקומי:
              </div>
              <div className="rounded-lg mt-2 p-2 font-mono text-[11px]" dir="ltr" style={{ background: "#0f172a", color: "#60a5fa" }}>
                # Mac: sudo dscacheutil -flushcache<br />
                # Windows: ipconfig /flushdns
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>אמתי — הריצי nslookup שוב</div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
              <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
                <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
                <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
                <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
              </div>
              <div className="p-4 font-mono text-[12px] leading-[2]" style={{ background: "#0f172a" }} dir="ltr">
                <div style={{ color: "#60a5fa" }}>$ nslookup checkout.acme-store.com</div>
                <div style={{ color: "#94a3b8" }}>Server:   8.8.8.8</div>
                <div></div>
                <div style={{ color: "#94a3b8" }}>Name:  checkout.acme-store.com</div>
                <div style={{ color: "#22c55e" }}>Address: 185.42.11.8 <span style={{ color: "#64748b" }}># ✓ Public IP — תוקן!</span></div>
              </div>
            </div>

            <button onClick={() => setVerified(true)} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: "#15803d", fontFamily: "'Heebo', sans-serif" }}>
              ✓ האתר חזר לחיים — לPost-Mortem ←
            </button>
          </div>
        )}

        {verified && (
          <button onClick={onDone} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
            לPost-Mortem ←
          </button>
        )}

        {picked !== null && picked !== correct && (
          <div className="text-center text-[12px] mt-3" style={{ color: "rgba(0,0,0,0.45)" }}>
            נסי שוב — בחרי את הפעולה הנכונה
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
