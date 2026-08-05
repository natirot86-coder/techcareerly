"use client";
import React, { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const BLUE = "#3b82f6";
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

// ─── Terminal ─────────────────────────────────────────────────────────────────

function Terminal({ lines }: { lines: { text: string; color?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.22)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>terminal — TechFlow NOC</span>
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
              style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
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
      className="flex-1 py-3 rounded-xl font-mono text-[12.5px] font-bold transition-all"
      style={{
        background: used ? "rgba(34,197,94,0.1)" : disabled ? "rgba(0,0,0,0.04)" : "rgba(59,130,246,0.08)",
        border: `1.5px solid ${used ? "#22c55e55" : disabled ? "rgba(0,0,0,0.08)" : "rgba(59,130,246,0.2)"}`,
        color: used ? "#15803d" : disabled ? "rgba(0,0,0,0.3)" : BLUE,
      }}>
      {used ? "✓ " : ""}{label}
    </button>
  );
}

// ─── Firewall log ─────────────────────────────────────────────────────────────

function FirewallLog() {
  const logs = [
    { time: "09:02:14", action: "BLOCK", ip: "185.220.101.47", dest: "aws.amazon.com:443", color: "#f87171" },
    { time: "09:02:15", action: "BLOCK", ip: "185.220.101.47", dest: "s3.amazonaws.com:443", color: "#f87171" },
    { time: "09:02:16", action: "BLOCK", ip: "185.220.101.47", dest: "ec2.amazonaws.com:443", color: "#f87171" },
    { time: "09:01:58", action: "ALLOW", ip: "10.0.1.15", dest: "aws.amazon.com:443", color: "#22c55e" },
    { time: "09:01:59", action: "ALLOW", ip: "10.0.1.20", dest: "aws.amazon.com:443", color: "#22c55e" },
    { time: "09:02:01", action: "ALLOW", ip: "10.0.1.22", dest: "aws.amazon.com:443", color: "#22c55e" },
  ];

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(59,130,246,0.15)" }}>
      <div className="px-4 py-2.5" style={{ background: "#0f172a" }}>
        <div className="font-mono text-[10px] flex gap-3" style={{ color: "#475569" }} dir="ltr">
          <span className="w-[58px]">TIME</span>
          <span className="w-[44px]">ACTION</span>
          <span className="w-[110px]">SOURCE IP</span>
          <span>DESTINATION</span>
        </div>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="px-4 py-2 font-mono text-[11.5px] flex gap-3 items-center"
          style={{ background: i % 2 === 0 ? "#0f172a" : "#0d1525", borderTop: "1px solid rgba(255,255,255,0.04)" }}
          dir="ltr">
          <span className="w-[58px] shrink-0" style={{ color: "#475569" }}>{log.time}</span>
          <span className="w-[44px] shrink-0 font-bold" style={{ color: log.color }}>{log.action}</span>
          <span className="w-[110px] shrink-0" style={{ color: "#94a3b8" }}>{log.ip}</span>
          <span style={{ color: "#cbd5e1" }}>{log.dest}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Change log ───────────────────────────────────────────────────────────────

function ChangeLog() {
  const entries = [
    { time: "08:47:12", user: "deploy-bot-v2", action: "Rule #42 MODIFIED", detail: "Block external IPs from AWS", color: "#f87171" },
    { time: "08:46:58", user: "deploy-bot-v2", action: "Deployment triggered", detail: "production-hotfix-v2.1.4", color: "#eab308" },
    { time: "08:44:33", user: "sarah@techflow.io", action: "PR #847 merged", detail: "fix: update rate limiting config", color: "#22c55e" },
    { time: "08:01:17", user: "ops-team", action: "Backup completed", detail: "All systems nominal", color: "#22c55e" },
  ];

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(59,130,246,0.15)" }}>
      <div className="px-4 py-2.5" style={{ background: "#0f172a" }}>
        <div className="font-mono text-[10px]" style={{ color: "#475569" }}>Firewall Change Log — today</div>
      </div>
      {entries.map((e, i) => (
        <div key={i} className="px-4 py-3"
          style={{ background: i === 0 ? "rgba(220,38,38,0.08)" : "#0f172a", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-start gap-3" dir="ltr">
            <span className="font-mono text-[10px] shrink-0 mt-0.5" style={{ color: "#475569" }}>{e.time}</span>
            <div className="flex-1">
              <div className="font-mono text-[11.5px] font-bold" style={{ color: e.color }}>{e.action}</div>
              <div className="text-[11px]" style={{ color: "#64748b" }}>
                {e.user} · {e.detail}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Post-Mortem ──────────────────────────────────────────────────────────────

function PostMortemMystery({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null]);

  const questions = [
    {
      q: "מה קרה?",
      options: ["שרת AWS חיצוני סיים תוקף", "Deploy אוטומטי שינה Firewall rule — חסם גישה חיצונית לAWS", "מתקפת DDoS על endpoints"],
      correct: 1, ok: "✓ בדיוק — deployment שינה Rule #42.", err: "✗ הגורם: deploy-bot-v2 שינה firewall rule."
    },
    {
      q: "מה הגורם השורשי?",
      options: ["ה-Engineers שכחו לחבר VPN", "שינוי Firewall rule בdeploy לא עבר code review ולא נבדק בstageing", "AWS שינתה מדיניות גישה"],
      correct: 1, ok: "✓ Root cause: deploy ללא review על firewall changes.", err: "✗ Root cause: rule בdeploy לא נבדק לפני production."
    },
    {
      q: "מה מונע הישנות?",
      options: ["לא לבצע deployments בשעות העבודה", "Review חובה על Firewall changes בPR + automated test שמוודא גישה לAWS לפני deploy", "להוריד automations לגמרי"],
      correct: 1, ok: "✓ גרייט! review + automated test = prevention.", err: "✗ הפתרון: לא לבטל אוטומציה — לשפר אותה עם guardrails."
    },
  ];

  return (
    <div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)" }}>
        <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: BLUE }}>INCIDENT REPORT — TechFlow</div>
        <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.45)" }}>
          Production down · Duration: 31 min · Revenue impact: ~$12,000
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

export default function NetworksMysteryPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [tool1Used, setTool1Used] = useState<string | null>(null);
  const [tool1Answered, setTool1Answered] = useState(false);
  const [score, setScore] = useState(0);

  function advance(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  function addScore() { setScore((s) => s + 1); }

  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: "#0f172a" }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/networks" className="text-[12px] font-bold" style={{ opacity: 0.65 }}>← יציאה</Link>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(251,133,0,0.2)", color: "#fb923c" }}>🔍 חקירה מתקדמת</span>
        </div>
        <div className="text-[20px]" style={HEEBO}>חקירת תקלה — TechFlow</div>
        {phase !== "intro" && phase !== "done" && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.6 }}>
              <span>שלב {phase as number} מתוך 5</span>
              <span>{score} ממצאים</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${((phase as number) / 5) * 100}%`, background: BLUE }} />
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
              {["ping", "traceroute", "nslookup", "DNS record", "Private IP"].map(t => (
                <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#15803d" }}>✓ {t}</span>
              ))}
            </div>
            <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.55)" }}>
              הפעם — שני כלים חדשים ובעיה שונה לחלוטין. לחצי למטה ללמוד עליהם.
            </div>
          </div>

          {/* New tools */}
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
            👆 כלים חדשים — לחצי לגלות
          </div>
          <div className="flex flex-wrap mb-5">
            <GlossaryChip term="curl" explanation={
              <span>
                שולח בקשת HTTP לשרת ומראה מה הוא עונה — כולל status code וheaders.<br /><br />
                <code style={{ color: BLUE, fontFamily: "monospace" }}>curl -I api.techflow.io</code><br />
                <span style={{ color: "rgba(0,0,0,0.5)" }}>הI- = הצג רק headers, לא את כל הtcontent</span><br /><br />
                למה שונה מping? ping בודק <em>רשת</em> (האם מגיע). curl בודק <em>אפליקציה</em> (מה עונה).
              </span>
            } />
            <GlossaryChip term="firewall logs" explanation={
              <span>
                יומן חומת האש — מתעד כל חיבור שנחסם או עבר.<br /><br />
                כל שורה מציגה: זמן · ALLOW/BLOCK · מי שלח · לאן<br /><br />
                אם חיבור נחסם ולא מובן למה — Firewall logs יראו בדיוק איזה חוק חסם אותו ומתי.
              </span>
            } />
            <GlossaryChip term="HTTP 403 Forbidden" explanation={
              <span>
                Status code שאומר: "הבקשה הגיעה לשרת — אבל הוא מסרב לענות עליה".<br /><br />
                שונה מ-404 (לא נמצא) ומ-500 (שגיאה פנימית).<br /><br />
                403 = <strong>יש חסימה מכוונת</strong>. לרוב: Firewall, הרשאות, או IP שאינו ברשימה הלבנה.
              </span>
            } />
            <GlossaryChip term="Connection Refused" explanation={
              <span>
                השרת <em>קיים</em> ומגיב — אבל מסרב לפתוח חיבור לפורט המבוקש.<br /><br />
                בניגוד ל-timeout (אין תגובה בכלל), כאן השרת מגיב: "לא, לא מדבר איתך".<br /><br />
                לרוב: Firewall rule שחוסם פורט, או שירות לא פעיל.
              </span>
            } />
          </div>

          {/* How this differs */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.18)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#c2410c" }}>🔍 הפעם — את בוחרת את הכלי</div>
            <div className="text-[12px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>
              ב-"יום בחיי" הצעדים היו מובחרים: ping → traceroute → nslookup.<br />
              כאן — <strong>אין סדר נכון אחד</strong>. את בוחרת מה לבדוק קודם.<br />
              כמו בלשת: כל כלי מגלה חלק אחר מהתמונה.
            </div>
          </div>

          {/* Dashboard */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
            המצב כרגע
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f172a" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>TechFlow — System Status</div>
              <div className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(220,38,38,0.2)", color: "#f87171" }}>INCIDENT</div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "AWS Console", status: "HTTP 403 Forbidden", color: "#f87171" },
                { label: "API calls", status: "Connection Refused", color: "#f87171" },
                { label: "Latency", status: "4,800ms (נורמל: 40ms)", color: "#eab308" },
                { label: "Team affected", status: "8 engineers מדווחות", color: "#f97316" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[12px] shrink-0" style={{ color: "#94a3b8" }}>{s.label}</span>
                  <span className="text-[12px] font-bold" style={{ color: s.color }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 text-[13px] leading-[1.7]"
            style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <span className="font-bold" style={{ color: NAVY }}>המשימה:</span>{" "}
            TechFlow — חברת SaaS. יום שני, 09:00. כל ה-team לא יכולה לגשת ל-AWS.
            מצאי מה חוסם — ותתקני לפני שלקוחות מבחינות.
          </div>

          <button onClick={() => advance(1)}
            className="w-full py-[14px] rounded-xl font-bold text-[15px]"
            style={{ background: BLUE, color: "#fff", fontFamily: "'Heebo', sans-serif" }}>
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
        const journey = JSON.parse(localStorage.getItem("networks-journey") || "{}");
        localStorage.setItem("networks-journey", JSON.stringify({ ...journey, mystery: true }));
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
              TechFlow חזרה לפעילות
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.4)" }}>
              Incident duration: 31 דקות · Revenue saved: ~$12,000
            </div>
          </div>

          <div className="mb-7">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>
              הכלים שהשתמשת
            </div>
            <div className="flex flex-col gap-2">
              {[
                ["curl -I", "גילוי 403 Forbidden — הגישה חסומה"],
                ["ping", "קישוריות OK — הבעיה לא ב-IP"],
                ["Firewall logs", "זיהוי BLOCK על IP 185.220.101.47"],
                ["Change log", "deploy-bot-v2 שינה Rule #42 ב-08:47"],
                ["Incident Report", "תיעוד + root cause + prevention"],
              ].map(([tool, desc]) => (
                <div key={tool} className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(34,197,94,0.07)", border: "1px solid #22c55e44" }}>
                  <span style={{ color: "#15803d" }}>✓</span>
                  <div>
                    <div className="font-mono text-[12.5px] font-bold" style={{ color: NAVY }}>{tool}</div>
                    <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(251,133,0,0.08)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>
              Incident Response — 2025
            </div>
            <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
              זה incident response אמיתי. בכל יום בתעשייה קורים incidents כאלו.
              Network Engineers שמכירים firewall logs, change logs וכלי אבחון —
              <span className="font-bold" style={{ color: NAVY }}> הם אלו שמחזירים את השירות תוך דקות, לא שעות.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/networks/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
            לכלי עיבוד החוויה ←
          </button>
          <button onClick={() => saveAndGo("/explore")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${BLUE}`, color: BLUE, fontFamily: "'Heebo', sans-serif" }}>
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
            <div className="text-[13.5px] leading-[1.7] mb-5" style={{ color: "rgba(0,0,0,0.62)" }}>
              8 Engineers לא מצליחות לגשת לAWS Console. API calls נכשלות.
              <br />
              <span className="font-bold" style={{ color: NAVY }}>בחרי כלי ראשון לאבחון:</span>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <div className="flex gap-2">
                <ToolButton label="ping aws.amazon.com"
                  onClick={() => { setTool1Used("ping"); }}
                  disabled={tool1Answered || (tool1Used !== null && tool1Used !== "ping")}
                  used={tool1Used === "ping"} />
                <ToolButton label="nslookup aws.amazon.com"
                  onClick={() => { setTool1Used("nslookup"); }}
                  disabled={tool1Answered || (tool1Used !== null && tool1Used !== "nslookup")}
                  used={tool1Used === "nslookup"} />
              </div>
              <ToolButton label="curl -I api.techflow.io"
                onClick={() => { setTool1Used("curl"); }}
                disabled={tool1Answered || (tool1Used !== null && tool1Used !== "curl")}
                used={tool1Used === "curl"} />
            </div>

            {/* Ping output */}
            {tool1Used === "ping" && (
              <div>
                <Terminal lines={[
                  { text: "$ ping aws.amazon.com", color: "#60a5fa" },
                  { text: "PING aws.amazon.com (52.119.224.10): 56 bytes" },
                  { text: "64 bytes: icmp_seq=0 ttl=120 time=38ms  ✓", color: "#22c55e" },
                  { text: "64 bytes: icmp_seq=1 ttl=120 time=41ms  ✓", color: "#22c55e" },
                  { text: "64 bytes: icmp_seq=2 ttl=120 time=37ms  ✓", color: "#22c55e" },
                  { text: "3 packets, 0% packet loss", color: "#22c55e" },
                ]} />
                <div className="flex flex-wrap gap-1 mb-4">
                  <GlossaryChip term="icmp_seq" explanation="מספר רץ של כל packet — עוזר לגלות אם packet ספציפי אבד בדרך." />
                  <GlossaryChip term="ttl=120" explanation={<span><strong>Time To Live</strong> — כמה hops הpacket מורשה לעבור לפני שנפסל.<br />120 = הגיע ליעד אחרי כ-8 hops.</span>} />
                  <GlossaryChip term="0% packet loss" explanation="כל הpackets הגיעו — הרשת הבסיסית (IP layer) תקינה. הבעיה בשכבה גבוהה יותר." />
                </div>
                <Q q="Ping מצליח. מה זה מלמד?"
                  options={["הכל בסדר — AWS עובד", "IP connectivity תקין — הבעיה לא ברמת הרשת הבסיסית", "AWS סיים לאחסן את הdomain"]}
                  correct={1}
                  okMsg="✓ Ping OK = connectivity בסיסית תקינה. הבעיה ברמה אחרת — ניסי curl."
                  errMsg="✗ Ping OK לא אומר שהכל עובד — הוא בודק רק IP connectivity."
                  onAnswer={(ok) => { if (ok) addScore(); setTool1Answered(true); }}
                />
              </div>
            )}

            {/* nslookup output */}
            {tool1Used === "nslookup" && (
              <div>
                <Terminal lines={[
                  { text: "$ nslookup aws.amazon.com", color: "#60a5fa" },
                  { text: "Server:   8.8.8.8" },
                  { text: "Address:  8.8.8.8#53" },
                  { text: "" },
                  { text: "Name: aws.amazon.com", color: "#94a3b8" },
                  { text: "Address: 52.119.224.10  ✓", color: "#22c55e" },
                ]} />
                <div className="flex flex-wrap gap-1 mb-4">
                  <GlossaryChip term="8.8.8.8" explanation="שרת DNS ציבורי של Google — אחד הנפוצים בעולם. מתרגם שמות לכתובות IP." />
                  <GlossaryChip term="#53" explanation={<span>פורט <strong>53</strong> הוא פורט ה-DNS הסטנדרטי — כמו קוד מדינה לסוג השירות.</span>} />
                  <GlossaryChip term="Address: 52.119.224.10" explanation="DNS החזיר IP תקין של AWS — ה-DNS עצמו לא הגורם לבעיה." />
                </div>
                <Q q="DNS תקין. מה הצעד הבא?"
                  options={["DNS תקין = הכל תקין, ממתינים לפתרון עצמוני", "DNS תקין — הבעיה לא בDNS. נבדוק רמת HTTP עם curl", "צריך לאפס את הDNS cache"]}
                  correct={1}
                  okMsg="✓ DNS OK = הבעיה לא שם. curl יראה אם HTTP עובד."
                  errMsg="✗ DNS תקין = זה לא הגורם. נמשיך לחקור עם curl."
                  onAnswer={(ok) => { if (ok) addScore(); setTool1Answered(true); }}
                />
              </div>
            )}

            {/* curl output */}
            {tool1Used === "curl" && (
              <div>
                <Terminal lines={[
                  { text: "$ curl -I api.techflow.io", color: "#60a5fa" },
                  { text: "HTTP/1.1 403 Forbidden", color: "#f87171" },
                  { text: "Date: Mon, 04 Aug 2025 09:03:11 GMT", color: "#94a3b8" },
                  { text: "Server: nginx", color: "#94a3b8" },
                  { text: "X-Forwarded-For: 185.220.101.47", color: "#eab308" },
                  { text: "Content-Length: 146", color: "#94a3b8" },
                ]} />
                <div className="flex flex-wrap gap-1 mb-4">
                  <GlossaryChip term="HTTP/1.1" explanation="פרוטוקול התקשורת של האינטרנט — השרת עונה בשפה הזו." />
                  <GlossaryChip term="403 Forbidden" explanation={<span>גישה נחסמה — השרת קיים ומגיב, אבל <strong>מסרב לתת גישה</strong>.<br />שונה מ-404 (לא נמצא) ומ-500 (שגיאה פנימית).</span>} />
                  <GlossaryChip term="nginx" explanation="web server נפוץ — מנהל HTTP requests ופועל כ-reverse proxy לפני האפליקציה." />
                  <GlossaryChip term="X-Forwarded-For" explanation={<span>Header שמזהה את <strong>ה-IP האמיתי של המשתמש</strong> — גם אחרי שעבר דרך proxy.<br /><code style={{ color: BLUE, fontSize: 11 }}>185.220.101.47</code> = ה-IP שנחסם.</span>} />
                </div>
                <Q q="403 Forbidden. מה זה אומר?"
                  options={["האתר לא קיים", "הגישה חסומה — מישהו/משהו מונע כניסה", "שגיאת שרת פנימית"]}
                  correct={1}
                  okMsg="✓ 403 = Access Denied. הFirewall חוסם את הגישה. נכנסי ללogs."
                  errMsg="✗ 403 Forbidden = גישה נחסמה. לא שגיאת שרת — חסימה."
                  onAnswer={(ok) => { if (ok) addScore(); setTool1Answered(true); }}
                />
              </div>
            )}

            {/* Continue button — outside all tool blocks, appears after answering */}
            {tool1Answered && (
              <button onClick={() => advance(2)}
                className="w-full py-[13px] rounded-xl font-bold text-[15px] mt-4 text-white"
                style={{ background: ORANGE, fontFamily: "'Heebo', sans-serif" }}>
                פתחי Firewall Logs ←
              </button>
            )}
          </div>
        )}

        {/* Phase 2 — Firewall Logs */}
        {phase === 2 && (
          <div>
            <div className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
              הFirewall חוסם משהו. בואי נראה את הlogs:
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
              FIREWALL LOGS — 09:00–09:05
            </div>
            <FirewallLog />
            <div className="flex flex-wrap gap-1 mb-4">
              <GlossaryChip term="BLOCK" explanation="הFirewall סירב לחיבור — הpacket לא עבר." />
              <GlossaryChip term="ALLOW" explanation="הFirewall אישר את החיבור — הpacket עבר." />
              <GlossaryChip term="185.220.101.47" explanation={<span>IP חיצוני (WAN) — לא שייך לרשת הפנימית.<br />זהו כנראה ה-IP הביתי של אחת מהEngineers שעובדת Remote.</span>} />
              <GlossaryChip term="10.0.1.x" explanation={<span><strong>Private IP range</strong> — 10.x.x.x שייך לרשת הפנימית בלבד.<br />אלו הEngineers שנמצאות פיזית במשרד — ולכן מקבלות ALLOW.</span>} />
            </div>
            <Q
              q="מה מייצג IP 185.220.101.47?"
              options={[
                "שרת AWS חיצוני",
                "IP חיצוני שהFirewall חוסם — אלו הEngineers שעובדות מהבית",
                "Attacker שמנסה לפרוץ",
              ]}
              correct={1}
              okMsg="✓ בדיוק! הFirewall חוסם גישה מ-IPs חיצוניים לAWS — אלו בדיוק הEngineers שעובדות Remote!"
              errMsg="✗ 185.x.x.x = IP חיצוני. ה-10.x.x.x (ALLOW) הם פנימיים. הבעיה: Firewall חוסם גישה Remote."
              onAnswer={(ok) => { if (ok) addScore(); }}
              nextLabel="פתחי Change Log ←"
              onNext={() => advance(3)}
            />
          </div>
        )}

        {/* Phase 3 — Change Log */}
        {phase === 3 && (
          <div>
            <div className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
              הFirewall שינה הגדרות. מתי ולמה? נבדוק את Change Log:
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>
              CHANGE LOG
            </div>
            <ChangeLog />
            <div className="flex flex-wrap gap-1 mb-4">
              <GlossaryChip term="Rule #42" explanation="חוק ספציפי בFirewall — לכל חוק יש מספר זיהוי, תנאי (מה לחסום), ופעולה (BLOCK/ALLOW)." />
              <GlossaryChip term="deploy-bot-v2" explanation={<span>bot אוטומטי שמבצע deployments ללא מעורבות אנושית ישירה.<br />יתרון: מהיר. סיכון: אם ה-PR לא נבדק — שינויים עלולים לגרום נזק.</span>} />
              <GlossaryChip term="production-hotfix-v2.1.4" explanation={<span><strong>hotfix</strong> = תיקון דחוף שמגיע ישירות לproduction (לא דרך staging).<br />לעיתים נוצרים ב-rush — ולכן חשוב לבדוק אותם היטב לפני deploy.</span>} />
            </div>
            <Q
              q="מה גרם לשינוי ב-Rule #42?"
              options={[
                "מישהו פרץ לFirewall ושינה ידנית",
                "deploy-bot-v2 שינה את ה-rule כחלק מdeployment אוטומטי",
                "AWS שינתה את מדיניות הגישה שלה",
              ]}
              correct={1}
              okMsg="✓ מצאת! deployment אוטומטי (production-hotfix-v2.1.4) שינה firewall rule ב-08:47 — בדיוק 15 דקות לפני הדיווחים."
              errMsg="✗ ב-08:47: deploy-bot-v2 שינה Rule #42. deployment אוטומטי = הגורם."
              onAnswer={(ok) => { if (ok) addScore(); }}
              nextLabel="לפתרון התקלה ←"
              onNext={() => advance(4)}
            />
          </div>
        )}

        {/* Phase 4 — The Fix */}
        {phase === 4 && (
          <div>
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid #22c55e44" }}>
              <div className="font-bold mb-1" style={{ color: "#15803d" }}>✓ זיהית את הגורם!</div>
              <div className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.65)" }}>
                Firewall Rule #42 שונה על ידי deploy-bot-v2 ב-08:47 — חסם גישה חיצונית לכל endpoints של AWS.
                Engineers שעובדות Remote מקבלות 403 Forbidden.
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              <GlossaryChip term="rollback" explanation={<span>חזרה לגרסה קודמת של הגדרה או קוד — הפתרון המהיר ביותר ל-incident.<br />Rule #42 → גרסה מלפני ה-deploy = גישה חוזרת מיד.</span>} />
              <GlossaryChip term="whitelist" explanation={<span><strong>רשימה לבנה</strong> — רשימת IPs שמורשים לעבור, ואכל השאר נחסמים.<br />בניגוד לblacklist (חוסמים ספציפיים, מאפשרים כל השאר).</span>} />
            </div>
            <Q
              q="מהו הפתרון הנכון?"
              options={[
                "לכבות את הFirewall לגמרי עד שהעניין מתבהר",
                "לשחזר Rule #42 לגרסה הקודמת + להוסיף whitelist לIPs של הTeam",
                "לחכות שAWS תתקן — זה בצידם",
              ]}
              correct={1}
              okMsg="✓ פתרון נכון ומדויק — rollback + whitelist = מהיר, בטוח, מדויק."
              errMsg="✗ לכבות Firewall = סיכון אבטחה. AWS לא אשמה — הבעיה אצלנו. Rollback + whitelist = הפתרון."
              onAnswer={(ok) => { if (ok) addScore(); }}
              nextLabel="לPost-Mortem ←"
              onNext={() => advance(5)}
            />
          </div>
        )}

        {/* Phase 5 — Post-Mortem */}
        {phase === 5 && (
          <div>
            <div className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
              הbug תוקן. TechFlow חזרה לפעילות. עכשיו — Post-Mortem Report.
            </div>
            <PostMortemMystery onDone={() => advance("done")} />
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
