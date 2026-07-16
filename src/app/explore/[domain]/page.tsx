"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Shared micro-components ──────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "rgba(0,0,0,0.35)", marginBottom: "10px",
      }}
    >
      {text}
    </div>
  );
}

function WowStat({ stat, label, sub, color }: { stat: string; label: string; sub: string; color: string }) {
  return (
    <div className="mb-7 rounded-2xl p-5" style={{ background: `${color}09`, border: `1.5px solid ${color}30` }}>
      <div className="text-[44px] leading-none font-black" style={{ color, ...HEEBO }}>{stat}</div>
      <div className="text-[13.5px] mt-2 font-bold" style={{ color: "#023e8a" }}>{label}</div>
      <div className="text-[11.5px] mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>{sub}</div>
    </div>
  );
}

function SimTeaser({ emoji, challenge }: { emoji: string; challenge: string }) {
  return (
    <div
      className="mb-7 rounded-2xl p-4"
      style={{ background: "rgba(251,133,0,0.06)", border: "1.5px dashed rgba(251,133,0,0.45)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[20px]">{emoji}</span>
        <span
          className="text-[10.5px] font-bold uppercase tracking-wide"
          style={{ color: "#fb8500" }}
        >
          מה מחכה לך בסימולציה
        </span>
      </div>
      <div className="text-[13px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>{challenge}</div>
    </div>
  );
}

function SalaryCard({ min, max }: { min: number; max: number }) {
  return (
    <div className="mb-7">
      <Label text="שכר ממוצע בישראל" />
      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.09)" }}
      >
        <div className="text-[26px]" style={{ color: "#023e8a", ...HEEBO }}>
          ₪{min.toLocaleString()} – ₪{max.toLocaleString()}
        </div>
        <div className="text-[11.5px] mt-[4px]" style={{ color: "rgba(0,0,0,0.4)" }}>
          לחודש · אחרי 2–5 שנות ניסיון
        </div>
      </div>
    </div>
  );
}

// ─── CODE ────────────────────────────────────────────────────────────────────
function CodeContent() {
  const [ran, setRan] = useState(false);

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(59,130,246,0.07)" }}>
        כל האפליקציה שאת משתמשת בה עכשיו — מישהי כתבה אותה.{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>זאת יכולה להיות את.</span>
      </div>

      <div className="mb-7">
        <Label text="הרצי קוד אמיתי — לחצי Run" />
        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(59,130,246,0.15)" }}>
          <div className="flex items-center gap-[6px] px-4 py-[10px]" style={{ background: "#1e293b" }}>
            <div className="w-[11px] h-[11px] rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-[11px] h-[11px] rounded-full" style={{ background: "#eab308" }} />
            <div className="w-[11px] h-[11px] rounded-full" style={{ background: "#22c55e" }} />
            <span className="text-[11px] mr-2" style={{ color: "#94a3b8" }}>hello.py</span>
          </div>
          <div className="p-4 font-mono text-[12px] leading-[1.85]" style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
            <div><span style={{ color: "#a78bfa" }}>def</span>{" "}<span style={{ color: "#60a5fa" }}>welcome</span>(name):</div>
            <div>{"  "}<span style={{ color: "#a78bfa" }}>return</span>{" "}<span style={{ color: "#34d399" }}>{`f"שלום {name}! הייטק מחכה לך 🚀"`}</span></div>
            <div className="mt-2"><span style={{ color: "#60a5fa" }}>print</span>(welcome(<span style={{ color: "#34d399" }}>"נועה"</span>))</div>
          </div>
          <button
            onClick={() => setRan(true)}
            className="w-full py-[11px] text-[13.5px] font-bold transition-all"
            style={{ background: ran ? "#16a34a" : "#3b82f6", color: "#fff", fontFamily: "'Heebo', sans-serif" }}
          >
            {ran ? "✓ קוד רץ בהצלחה!" : "▶  הרצי את הקוד"}
          </button>
          {ran && (
            <div className="px-4 py-3 font-mono text-[13px]" style={{ background: "#0d1117", color: "#22c55e" }} dir="ltr">
              {">"} שלום נועה! הייטק מחכה לך 🚀
            </div>
          )}
        </div>
        {ran && (
          <div className="text-[12px] text-center font-bold mt-2" style={{ color: "#3b82f6" }}>
            כתבת פקודה אמיתית — זה כל מה שצריך בשביל להתחיל 🎉
          </div>
        )}
      </div>

      <WowStat
        stat="19B$"
        label="WhatsApp נמכרה ב-19 מיליארד דולר לפייסבוק"
        sub="פותחה על ידי 2 מפתחים בלבד — תוך שנתיים"
        color="#3b82f6"
      />

      <SimTeaser
        emoji="🐛"
        challenge="בסימולציה: האפליקציה של הלקוח קורסת. יש לך 3 ניסיונות לאתר את הבאג ולתקן — לפני שהוא מתקשר למנהל שלך."
      />

      <SalaryCard min={13000} max={28000} />
    </>
  );
}

// ─── CYBER ───────────────────────────────────────────────────────────────────
function CyberContent() {
  const [picked, setPicked] = useState<number | null>(null);
  const ATTACK = 2;

  const logs = [
    { time: "09:14:02", user: "maya@corp.il", action: "LOGIN", ip: "84.228.17.4" },
    { time: "09:14:58", user: "maya@corp.il", action: "DOWNLOAD report.xlsx", ip: "84.228.17.4" },
    { time: "09:17:44", user: "maya@corp.il", action: "LOGIN FAILED × 3", ip: "193.47.82.1" },
  ];

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(220,38,38,0.07)" }}>
        כל יום נתקפות אלפי חברות בישראל. רוב האנשים לא יודעים.{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>את תהיי זאת שעוצרת את ההתקפה.</span>
      </div>

      <div className="mb-7">
        <Label text="זיהי את הכניסה החשודה — לחצי על השורה" />
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #dc262622", boxShadow: "0 4px 24px rgba(220,38,38,0.1)" }}>
          <div className="px-4 py-2 font-mono text-[10px] flex gap-3" style={{ background: "#1a0a0a", color: "#4b5563" }} dir="ltr">
            <span className="w-[72px]">TIME</span>
            <span className="flex-1">ACTION</span>
            <span>IP</span>
          </div>
          {logs.map((log, i) => {
            const isCorrect = i === ATTACK;
            const showResult = picked !== null;
            return (
              <button
                key={i}
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(i)}
                className="w-full"
              >
                <div
                  className="px-4 py-3 flex gap-3 items-start border-t font-mono text-[11px] text-right transition-all"
                  style={{
                    borderColor: "#dc262618",
                    background: showResult && isCorrect
                      ? "rgba(220,38,38,0.15)"
                      : picked === i
                      ? "rgba(220,38,38,0.08)"
                      : "#111",
                    color: "#d1d5db",
                  }}
                >
                  <span className="w-[72px] shrink-0 text-left" style={{ color: "#6b7280" }}>{log.time}</span>
                  <span className="flex-1 text-right" dir="rtl" style={{ color: "#e2e8f0" }}>{log.action}</span>
                  <span
                    className="shrink-0 px-[6px] py-[2px] rounded text-[10px] font-bold"
                    style={{
                      background: i < 2 ? "#16a34a22" : "#dc262622",
                      color: i < 2 ? "#22c55e" : "#f87171",
                    }}
                  >
                    {log.ip}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div
            className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{
              background: picked === ATTACK ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
              border: `1px solid ${picked === ATTACK ? "#16a34a44" : "#dc262644"}`,
              color: picked === ATTACK ? "#15803d" : "#b91c1c",
            }}
          >
            {picked === ATTACK
              ? "✓ מצוין! IP שונה לחלוטין לאותו משתמש = האקר שגנב סיסמה. מה עושים? נועלים חשבון + פותחים חקירה."
              : "✗ שים לב לשורה האחרונה — IP אחר לגמרי לאותו user. זה סימן קלאסי לפריצה."}
          </div>
        )}
      </div>

      <WowStat
        stat="#8"
        label="ישראל בדירוג הגלובלי של יצוא סייבר"
        sub="תעשייה של $11B — 45% מהשוק הגלובלי. הביקוש לא מפסיק לגדול."
        color="#dc2626"
      />

      <SimTeaser
        emoji="🔓"
        challenge="בסימולציה: תתבקשי לבצע penetration test על שרת בדיקה — ולדווח על הממצאים. כמה חולשות תמצאי?"
      />

      <SalaryCard min={15000} max={30000} />
    </>
  );
}

// ─── AI ──────────────────────────────────────────────────────────────────────
function AIContent() {
  const [progress, setProgress] = useState(0);
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);

  useEffect(() => {
    if (!training) return;
    const id = setInterval(() => {
      setProgress((p) => Math.min(Math.round(p + Math.random() * 7 + 2), 100));
    }, 100);
    return () => clearInterval(id);
  }, [training]);

  useEffect(() => {
    if (progress >= 100 && training) {
      setTraining(false);
      setTrained(true);
    }
  }, [progress, training]);

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(124,58,237,0.07)" }}>
        את כבר משתמשת ב-ChatGPT.{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>אבל האם ידעת שאפשר ללמד אותו מחדש — לפי הנתונים שלך?</span>
      </div>

      <div className="mb-7">
        <Label text="אמני מודל AI — לחצי להתחיל" />
        <div className="rounded-2xl p-5" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", boxShadow: "0 4px 24px rgba(124,58,237,0.1)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[13.5px] font-bold" style={{ color: "#5b21b6" }}>Image Classifier v1</div>
              <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>50,000 תמונות · 10 קטגוריות</div>
            </div>
            <div className="text-[26px] font-black" style={{ color: "#7c3aed", ...HEEBO }}>
              {trained ? "94.7%" : `${progress}%`}
            </div>
          </div>

          <div className="h-3 rounded-full mb-4 overflow-hidden" style={{ background: "#e9d5ff" }}>
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }}
            />
          </div>

          {trained ? (
            <div className="text-center">
              <div className="text-[15px] font-bold" style={{ color: "#16a34a" }}>✓ המודל מוכן! דיוק 94.7%</div>
              <div className="text-[11.5px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>מעכשיו הוא מסווג תמונות לבד — בלי עזרת אדם</div>
            </div>
          ) : (
            <button
              onClick={() => setTraining(true)}
              disabled={training}
              className="w-full py-[11px] rounded-xl text-[13.5px] font-bold text-white transition-all"
              style={{ background: training ? "#a78bfa" : "#7c3aed", fontFamily: "'Heebo', sans-serif" }}
            >
              {training ? `🧠 מאמנת... ${progress}%` : "🧠 התחלי אימון"}
            </button>
          )}
        </div>
      </div>

      <WowStat
        stat="100M"
        label="משתמשים ל-ChatGPT תוך 60 יום — שיא עולמי"
        sub="לשם השוואה: אינסטגרם לקחה 2.5 שנים. הAI מואץ ב-2025 יותר מאי פעם."
        color="#7c3aed"
      />

      <SimTeaser
        emoji="🤖"
        challenge="בסימולציה: תקבלי 500 ביקורות לקוחות מעורבבות. המשימה — ללמד מודל להבדיל חיובי משלילי. כמה דוגמאות תצטרכי?"
      />

      <SalaryCard min={18000} max={35000} />
    </>
  );
}

// ─── UX ──────────────────────────────────────────────────────────────────────
function UXContent() {
  const [voted, setVoted] = useState<"a" | "b" | null>(null);

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(219,39,119,0.07)" }}>
        כשאת עוזבת אפליקציה כי היא מעצבנת —{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>זאת אשמת ה-UX Designer. מישהי אחרת יכולה לתקן.</span>
      </div>

      <div className="mb-7">
        <Label text="A/B בדיקה אמיתית — איזה כפתור תלחצי?" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "a" as const, label: "כפתור A", text: "שלחי", bg: "#64748b", radius: 4, ctr: "2.1%", winner: false },
            { id: "b" as const, label: "כפתור B", text: "קבלי הצעה חינם!", bg: "#db2777", radius: 14, ctr: "8.7%", winner: true },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={voted !== null}
              onClick={() => setVoted(opt.id)}
              className="flex flex-col gap-2"
            >
              <div
                className="w-full rounded-2xl p-4 flex flex-col items-center gap-3 transition-all"
                style={{
                  background: voted === opt.id ? `${opt.bg}14` : "#fff",
                  border: `2px solid ${voted === opt.id || (voted !== null && opt.winner) ? opt.bg : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.35)" }}>{opt.label}</span>
                <div
                  className="w-full py-[10px] text-white text-[13px] font-bold text-center"
                  style={{ background: opt.bg, borderRadius: opt.radius, fontFamily: "'Heebo', sans-serif" }}
                >
                  {opt.text}
                </div>
                {voted !== null && (
                  <div className="text-center">
                    <div className="text-[22px] font-black" style={{ color: opt.bg, ...HEEBO }}>{opt.ctr}</div>
                    <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.38)" }}>Click-Through Rate</div>
                    {opt.winner && <div className="text-[14px] mt-1">🏆</div>}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        {voted && (
          <div
            className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{
              background: voted === "b" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
              border: `1px solid ${voted === "b" ? "#16a34a44" : "#dc262644"}`,
              color: voted === "b" ? "#15803d" : "#b91c1c",
            }}
          >
            {voted === "b"
              ? "✓ נכון! B ניצח — צבע, עיגול ופעולה ספציפית = פי 4 המרות. זה כוח ה-UX."
              : "✗ B ניצח בפועל — 'קבלי הצעה חינם' מבטיחה ערך. 'שלחי' לא אומרת כלום."}
          </div>
        )}
      </div>

      <WowStat
        stat="88%"
        label="מהמשתמשים לא יחזרו לאתר אחרי חוויה גרועה אחת"
        sub="UX טוב = לקוחות נאמנים. UX גרוע = מחיקה מהנייד."
        color="#db2777"
      />

      <SimTeaser
        emoji="🎨"
        challenge="בסימולציה: תקבלי wireframe גרוע של אפליקציית זימון תורים. המשימה — לזהות 3 בעיות UX ולהציע כל אחת כיצד לתקן."
      />

      <SalaryCard min={10000} max={22000} />
    </>
  );
}

// ─── DATA ────────────────────────────────────────────────────────────────────
function DataContent() {
  const [revealed, setRevealed] = useState(false);

  const bars = [
    { label: "ינו", val: 42, spike: false },
    { label: "פבר", val: 44, spike: false },
    { label: "מרץ", val: 41, spike: false },
    { label: "אפר", val: 43, spike: false },
    { label: "מאי", val: 68, spike: true },
    { label: "יוני", val: 91, spike: true },
  ];

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(13,148,136,0.07)" }}>
        מה גרם לחברה אחת לגדול פי 3 תוך חודשיים?{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>דאטה אנליסטית אחת גילתה — בשתי שאילתות.</span>
      </div>

      <div className="mb-7">
        <Label text="מה קרה פה? לחצי לגילוי" />
        <div
          className="rounded-2xl px-4 pt-5 pb-4"
          style={{ background: "#f0fdf9", border: "1px solid #99f6e4", boxShadow: "0 4px 24px rgba(13,148,136,0.1)" }}
        >
          <div className="text-[11px] font-bold mb-4" style={{ color: "#0d9488" }}>
            מכירות חודשיות (₪ אלפים)
          </div>
          <div className="flex items-end gap-2 h-[72px]">
            {bars.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all duration-700"
                  style={{
                    height: `${(b.val / 91) * 60}px`,
                    background: revealed && b.spike ? "#0d9488" : "#99f6e4",
                    border: revealed && b.spike ? "2px solid #0d9488" : "none",
                  }}
                />
                <span className="text-[8.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>{b.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setRevealed(true)}
            disabled={revealed}
            className="mt-4 w-full py-[10px] rounded-xl text-[13px] font-bold text-white transition-all"
            style={{ background: revealed ? "#16a34a" : "#0d9488", fontFamily: "'Heebo', sans-serif" }}
          >
            {revealed ? "✓ גילית את הסוד!" : "🔍 מה קרה במאי?"}
          </button>
        </div>
        {revealed && (
          <div
            className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{ background: "rgba(13,148,136,0.08)", border: "1px solid #99f6e488", color: "#065f46" }}
          >
            ✓ במאי פתחו קמפיין — אבל הדאטה גילתה ש-2 מוצרים בלבד מתוך 18 אחראים ל-89% מהצמיחה. ההמלצה: להעביר כל התקציב אליהם. תוצאה: +116% ביוני.
          </div>
        )}
      </div>

      <WowStat
        stat="2.5×"
        label="חברות data-driven צומחות פי 2.5 מהמתחרות"
        sub='McKinsey, 2024 — "הנתונים הם הנפט החדש של המאה ה-21"'
        color="#0d9488"
      />

      <SimTeaser
        emoji="📊"
        challenge="בסימולציה: קיבלת CSV עם 10,000 שורות. המשימה — לזהות את הסגמנט הרווחי ביותר ולהציג המלצה להנהלה תוך 5 דקות."
      />

      <SalaryCard min={12000} max={25000} />
    </>
  );
}

// ─── MARKETING ───────────────────────────────────────────────────────────────
function MarketingContent() {
  const [voted, setVoted] = useState<"a" | "b" | null>(null);

  const headlines = [
    { id: "a" as const, text: "נעליים חדשות לקיץ — 20% הנחה", ctr: "1.2%", winner: false },
    { id: "b" as const, text: "עצרי — הנעליים האלה הופכות את היום שלך", ctr: "4.8%", winner: true },
  ];

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(249,115,22,0.07)" }}>
        מוצר מעולה שאף אחד לא יודע עליו — לא קיים.{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>השיווק הוא מה שגורם לעולם לשמוע.</span>
      </div>

      <div className="mb-7">
        <Label text="איזו כותרת תמשוך יותר קליקים? לחצי" />
        <div className="flex flex-col gap-3">
          {headlines.map((h) => (
            <button
              key={h.id}
              type="button"
              disabled={voted !== null}
              onClick={() => setVoted(h.id)}
              className="text-right"
            >
              <div
                className="rounded-2xl px-4 py-4 transition-all"
                style={{
                  background: voted === h.id ? "rgba(249,115,22,0.1)" : "#fff",
                  border: `2px solid ${voted === h.id || (voted !== null && h.winner) ? "#f97316" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <div className="text-[14px] leading-[1.5]" style={{ color: "#1e293b" }}>{h.text}</div>
                {voted !== null && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-[6px] rounded-full flex-1" style={{ background: "#fed7aa" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: h.winner ? "80%" : "20%", background: "#f97316" }}
                      />
                    </div>
                    <span className="text-[14px] font-black shrink-0" style={{ color: h.winner ? "#c2410c" : "#9ca3af", ...HEEBO }}>
                      {h.ctr} CTR
                    </span>
                    {h.winner && <span>🏆</span>}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        {voted && (
          <div
            className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{
              background: voted === "b" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
              border: `1px solid ${voted === "b" ? "#16a34a44" : "#dc262644"}`,
              color: voted === "b" ? "#15803d" : "#b91c1c",
            }}
          >
            {voted === "b"
              ? "✓ כל הכבוד! B — 'עצרי' יוצרת סקרנות, 'הופכות את היום' מבטיחות ערך רגשי. זה שיווק."
              : "✗ B ניצחה — הנחה ב-A מושכת, אבל רגש + ערך ב-B = פי 4 קליקים."}
          </div>
        )}
      </div>

      <WowStat
        stat="$4,500"
        label="עלות הסרטון שהקים את Dollar Shave Club"
        sub="הביא $12M הכנסות תוך שנה — ומכירה ב-$1B ל-Unilever. שיווק נכון = הכל."
        color="#f97316"
      />

      <SimTeaser
        emoji="📢"
        challenge="בסימולציה: תקציב ₪2,000 לחודש, 3 ערוצים. המשימה — להחליט כיצד לפצל כדי להגיע ל-500 לידים. לכל החלטה יש מחיר."
      />

      <SalaryCard min={9000} max={20000} />
    </>
  );
}

// ─── Meta (header data) ───────────────────────────────────────────────────────
const META: Record<string, { badge: string; label: string; tagline: string; color: string }> = {
  code:      { badge: "פ",  label: "פיתוח תוכנה",      tagline: "הופכות רעיונות לאפליקציות ומוצרים שמשנים חיים",  color: "#3b82f6" },
  cyber:     { badge: "ס",  label: "סייבר",             tagline: "מגינות על מערכות קריטיות — מהבנק ועד הצבא",     color: "#dc2626" },
  ai:        { badge: "AI", label: "AI ובינה מלאכותית", tagline: "מלמדות מחשבים לחשוב, לראות ולהחליט",            color: "#7c3aed" },
  ux:        { badge: "UX", label: "עיצוב UX/UI",       tagline: "יוצרות חוויות שמרגישות נכון — כל קליק, כל מסך", color: "#db2777" },
  data:      { badge: "ד",  label: "דאטה ואנליטיקס",   tagline: "מוצאות תובנות חבויות שמשנות החלטות עסקיות",     color: "#0d9488" },
  marketing: { badge: "ש",  label: "שיווק דיגיטלי",    tagline: "מחברות מוצרים לאנשים הנכונים בזמן הנכון",       color: "#f97316" },
};

const CONTENT_MAP: Record<string, () => React.ReactElement> = {
  code:      CodeContent,
  cyber:     CyberContent,
  ai:        AIContent,
  ux:        UXContent,
  data:      DataContent,
  marketing: MarketingContent,
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DomainPage() {
  const { domain } = useParams();
  const meta = META[domain as string];
  const ContentComponent = CONTENT_MAP[domain as string];

  if (!meta || !ContentComponent) {
    return (
      <div className="flex justify-center min-h-screen" style={{ background: "#f2ede6" }}>
        <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col items-center justify-center gap-4">
          <div className="text-[16px] text-navy">תחום לא נמצא</div>
          <Link href="/explore" className="text-[14px] font-bold text-navy">← חזרה</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen" style={{ background: "#f2ede6" }}>
      <div className="w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">

        {/* Domain-colored header */}
        <div className="text-white px-[22px] pt-[26px] pb-[30px] shrink-0" style={{ background: meta.color }}>
          <Link href="/explore" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.82 }}>
            ← חזרה למסלול
          </Link>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px] mb-4"
            style={{ background: "rgba(255,255,255,0.2)", fontFamily: "'Heebo', sans-serif", color: "#fff" }}
          >
            {meta.badge}
          </div>
          <div className="text-[28px] leading-tight" style={HEEBO}>{meta.label}</div>
          <div className="text-[13px] mt-[6px]" style={{ opacity: 0.88 }}>{meta.tagline}</div>
        </div>

        {/* Unique content per domain */}
        <div className="flex-1 px-[22px] pt-6 pb-36 overflow-y-auto">
          <ContentComponent />
        </div>

        {/* Sticky CTA */}
        <div
          className="fixed bottom-[60px] inset-x-0 flex justify-center px-4 pb-3 pt-3"
          style={{ background: "linear-gradient(to top, #fbf9f5 80%, transparent)" }}
        >
          <Link
            href={`/explore/${domain}/sim`}
            className="block w-full max-w-[358px] text-center py-[14px] rounded-xl text-white font-bold text-[15px]"
            style={{ background: "#fb8500", fontFamily: "'Heebo', sans-serif" }}
          >
            קדימה לסימולציה ←
          </Link>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
