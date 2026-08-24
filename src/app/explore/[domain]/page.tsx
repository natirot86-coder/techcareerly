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

function JobMarketBlock({ color, demand, hitech, nonHitech, ai }: {
  color: string; demand: string; hitech: string; nonHitech: string; ai: string;
}) {
  return (
    <div className="mb-7">
      <Label text="שוק העבודה" />
      <div className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${color}20` }}>
        <div className="text-[13px] font-bold mb-3 pb-3 leading-[1.55]"
          style={{ color: "#023e8a", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {demand}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl px-3 py-2.5" style={{ background: `${color}09`, border: `1px solid ${color}18` }}>
            <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(0,0,0,0.3)" }}>הייטק</div>
            <div className="text-[11.5px] font-bold leading-[1.5]" style={{ color }}>{hitech}</div>
          </div>
          <div className="rounded-xl px-3 py-2.5"
            style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}>
            <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(0,0,0,0.3)" }}>מחוץ להייטק</div>
            <div className="text-[11.5px] font-bold leading-[1.5]" style={{ color: "#023e8a" }}>{nonHitech}</div>
          </div>
        </div>
        <div className="rounded-xl px-3 py-2.5"
          style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.18)" }}>
          <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#d97706" }}>
            🤖 AI ועתיד התפקיד
          </div>
          <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.58)" }}>{ai}</div>
        </div>
      </div>
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
          מה מחכה לך בטעימה
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

/**
 * מפת המסע הנעולה של תחום — הסטנדרט מ-28.7: השלבים נפתחים בהדרגה
 * (sim → day → mystery → experience). ההתקדמות נקראת מ-`${id}-journey`,
 * שכל דף כותב אליו בסיומו (הסימולציה הדינמית כותבת sim בעצמה).
 * תבנית משותפת לתחומים החדשים (ai/ux/marketing) — בוותיקים המפה עדיין inline.
 */
function TasteJourney({ id, color, title, steps }: {
  id: string;
  color: string;
  title: string;
  steps: { emoji: string; title: string; sub: string; href: string; doneKey: string; lockedBy: string | null }[];
}) {
  const [journey, setJourney] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${id}-journey`);
      if (saved) setJourney(JSON.parse(saved));
    } catch {/* ignore */}
  }, [id]);

  const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)).join(",");
  const tint = (a: number) => `rgba(${rgb},${a})`;

  return (
    <div className="mb-7">
      <Label text={title} />
      <div className="flex flex-col gap-2">
        {steps.map((step, i, arr) => {
          const isDone = !!journey[step.doneKey];
          const isLocked = step.lockedBy ? !journey[step.lockedBy] : false;
          const highlight = i === 0 && !journey["sim"];

          return (
            <div key={step.doneKey}>
              <Link href={isLocked ? "#" : step.href} className="block" onClick={isLocked ? (e) => e.preventDefault() : undefined}>
                <div className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                  style={{
                    background: isDone ? tint(0.06) : highlight ? color : "#fff",
                    border: isDone ? `1.5px solid ${tint(0.2)}` : isLocked ? "1px solid rgba(0,0,0,0.06)" : highlight ? "none" : "1px solid rgba(0,0,0,0.08)",
                    opacity: isLocked ? 0.55 : 1,
                    boxShadow: highlight ? `0 4px 20px ${tint(0.25)}` : "none",
                  }}
                >
                  <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                    style={{ background: isDone ? color : highlight ? "rgba(255,255,255,0.25)" : tint(0.1), color: isDone || highlight ? "#fff" : color }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{isLocked ? "🔒" : step.emoji}</span>
                      <span className="text-[12.5px] font-bold"
                        style={{ color: isDone ? color : highlight ? "#fff" : "#023e8a" }}>
                        {step.title}
                      </span>
                      {highlight && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>התחלי כאן</span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      {isLocked ? (
                        <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                          זמין אחרי שלב {i}
                        </span>
                      ) : (() => {
                        const parts = step.sub.split(/ · (~\d+.*)$/);
                        return (
                          <>
                            <div className="text-[11px]" dir="rtl"
                              style={{ color: highlight ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.4)" }}>
                              {parts[0]}
                            </div>
                            {parts[1] && (
                              <div className="text-[10px] mt-0.5 font-bold" dir="rtl"
                                style={{ color: highlight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.28)" }}>
                                ⏱ {parts[1]}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <span className="text-[16px] font-bold shrink-0"
                    style={{ color: isDone ? color : highlight ? "#fff" : isLocked ? "rgba(0,0,0,0.2)" : color }}>
                    {isLocked ? "🔒" : "←"}
                  </span>
                </div>
              </Link>
              {i < arr.length - 1 && (
                <div className="flex justify-center my-1">
                  <div className="w-[1.5px] h-3"
                    style={{ background: isDone ? tint(0.4) : tint(0.2) }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CODE ────────────────────────────────────────────────────────────────────
function CodeContent() {
  const [ran, setRan] = useState(false);
  const [name, setName] = useState("נועה");
  const [journey, setJourney] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("code-journey");
      if (saved) setJourney(JSON.parse(saved));
    } catch {/* ignore */}
  }, []);

  const BLUE = "#3b82f6";

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(59,130,246,0.07)" }}>
        כל האפליקציה שאת משתמשת בה עכשיו — מישהי כתבה אותה.{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>זאת יכולה להיות את.</span>
      </div>

      <div className="mb-7">
        <Label text="הרצי קוד אמיתי — אפשר לערוך את השם, ואז Run" />
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
            <div className="mt-2">
              <span style={{ color: "#60a5fa" }}>print</span>(welcome("
              <span
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  setName(e.currentTarget.textContent || "");
                  setRan(false);
                }}
                className="outline-none"
                style={{
                  color: "#34d399",
                  borderBottom: "1px dashed rgba(52,211,153,0.55)",
                  cursor: "text",
                  padding: "0 1px",
                }}
              >
                נועה
              </span>
              "))
            </div>
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
              {">"} שלום {name || "?"}! הייטק מחכה לך 🚀
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

      {/* Industry context block */}
      <div className="mb-7">
        <Label text="פיתוח תוכנה — הקשר תעשייה" />
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(59,130,246,0.12)" }}>
          <div className="mb-3">
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>תפקידים מרכזיים</div>
            <div className="flex flex-wrap gap-1.5">
              {["Frontend Developer", "Backend Engineer", "Fullstack", "DevOps / Platform", "Mobile Developer"].map(r => (
                <span key={r} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.08)", color: BLUE }}>{r}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.1)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>שכר</div>
              <div className="text-[14px] font-black" style={{ color: BLUE, ...HEEBO }}>₪13K – ₪28K</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>לחודש · אחרי ניסיון</div>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>נתיב כניסה</div>
              <div className="text-[11px] font-bold" style={{ color: "#023e8a" }}>Bootcamp · CS · עצמאי</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>שישה עד שמונה עשר חודשים</div>
            </div>
          </div>
        </div>
      </div>

      <JobMarketBlock
        color={BLUE}
        demand="עשרות אלפי משרות — הסקטור הגדול ביותר בהייטק הישראלי"
        hitech="Frontend · Backend · Fullstack · DevOps · Mobile"
        nonHitech="בנקים · ממשל · ביטחון · כל ארגון גדול"
        ai="כלי AI (GitHub Copilot, Claude) מכפילים פרודוקטיביות. הדגש עובר מ'לכתוב קוד' ל'לנהל ולאמת קוד שAI כתב'. מפתח שמשלב AI — שווה יותר, לא פחות."
      />

      {/* News article cards */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על פיתוח תוכנה בישראל</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/code-calcalist.jpg",
              summary: "מחפשים עבודה ראשונה בהייטק? כך תרכבו על גל ה-AI — ותתקבלו",
              source: "כלכליסט",
              href: "https://www.calcalist.co.il/calcalistech/article/rjuxvcrgzl",
            },
            {
              img: "/articles/code-globes.jpg",
              summary: "האוניברסיטה של החיים: ההייטק נאלץ לחפש עובדים כבר באקדמיה",
              source: "גלובס",
              href: "https://www.globes.co.il/news/article.aspx?did=1001215490",
            },
            {
              img: "/articles/code-geektime.jpg",
              summary: "יצאנו לבדוק: מה באמת המעסיקים מחפשים אצל סטודנטים?",
              source: "Geektime",
              href: "https://www.geektime.co.il/tech-students-career-ai-cyber-2025/",
            },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(59,130,246,0.12)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}
            >
              <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(59,130,246,0.06)" }}>
                {a.img ? (
                  <img
                    src={a.img}
                    alt={a.summary}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span className="text-[28px]">📰</span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] mb-3 flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
                <div className="flex justify-end">
                  <span className="text-[11px] font-bold" style={{ color: BLUE }}>קריאה ←</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <SimTeaser
        emoji="🐛"
        challenge="בטעימה: האפליקציה של הלקוח קורסת. יש לך 3 ניסיונות לאתר את הבאג ולתקן — לפני שהוא מתקשר למנהל שלך."
      />

      {/* Journey map */}
      <div className="mb-7">
        <Label text="המסלול שלך בפיתוח תוכנה" />
        <div className="flex flex-col gap-2">
          {[
            {
              num: "1", emoji: "🐛",
              title: "טעימה — debug הבאג של הלקוח",
              sub: "JavaScript runtime · שלושה ניסיונות לאתר ולתקן · ~10 דק'",
              href: "/explore/code/sim",
              doneKey: "sim" as const, lockedBy: null,
            },
            {
              num: "2", emoji: "🛠️",
              title: "יום בחיי מפתח",
              sub: "triage · code review · git flow · post-mortem · ~15 דק'",
              href: "/explore/code/learn/day",
              doneKey: "day" as const, lockedBy: "sim" as const,
            },
            {
              num: "3", emoji: "🕵️",
              title: "תעלומת הקוד",
              sub: "regression בפרודקשן — git log, blame, logs · ~20 דק'",
              href: "/explore/code/learn/mystery",
              doneKey: "mystery" as const, lockedBy: "day" as const,
            },
            {
              num: "4", emoji: "💭",
              title: "כלי עיבוד החוויה",
              sub: "שש שאלות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'",
              href: "/explore/code/experience",
              doneKey: "experience" as const, lockedBy: "mystery" as const,
            },
          ].map((step, i, arr) => {
            const isDone = !!journey[step.doneKey];
            const isLocked = step.lockedBy ? !journey[step.lockedBy] : false;
            const isFirst = i === 0;
            const highlight = isFirst && !journey["sim"];

            return (
              <div key={step.num}>
                <Link href={isLocked ? "#" : step.href} className="block" onClick={isLocked ? (e) => e.preventDefault() : undefined}>
                  <div className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                    style={{
                      background: isDone ? "rgba(59,130,246,0.06)" : highlight ? BLUE : "#fff",
                      border: isDone ? "1.5px solid rgba(59,130,246,0.2)" : isLocked ? "1px solid rgba(0,0,0,0.06)" : highlight ? "none" : "1px solid rgba(0,0,0,0.08)",
                      opacity: isLocked ? 0.55 : 1,
                      boxShadow: highlight ? "0 4px 20px rgba(59,130,246,0.25)" : "none",
                    }}
                  >
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                      style={{ background: isDone ? BLUE : highlight ? "rgba(255,255,255,0.25)" : "rgba(59,130,246,0.1)", color: isDone || highlight ? "#fff" : BLUE }}>
                      {isDone ? "✓" : step.num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{isLocked ? "🔒" : step.emoji}</span>
                        <span className="text-[12.5px] font-bold"
                          style={{ color: isDone ? BLUE : highlight ? "#fff" : "#023e8a" }}>
                          {step.title}
                        </span>
                        {highlight && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>התחלי כאן</span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        {isLocked ? (
                          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                            זמין אחרי שלב {parseInt(step.num) - 1}
                          </span>
                        ) : (() => {
                          const parts = step.sub.split(/ · (~\d+.*)$/);
                          return (
                            <>
                              <div className="text-[11px]" dir="rtl"
                                style={{ color: highlight ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.4)" }}>
                                {parts[0]}
                              </div>
                              {parts[1] && (
                                <div className="text-[10px] mt-0.5 font-bold" dir="rtl"
                                  style={{ color: highlight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.28)" }}>
                                  ⏱ {parts[1]}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <span className="text-[16px] font-bold shrink-0"
                      style={{ color: isDone ? BLUE : highlight ? "#fff" : isLocked ? "rgba(0,0,0,0.2)" : BLUE }}>
                      {isLocked ? "🔒" : "←"}
                    </span>
                  </div>
                </Link>
                {i < arr.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-[1.5px] h-3"
                      style={{ background: isDone ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.2)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SalaryCard min={13000} max={28000} />
    </>
  );
}

// ─── CYBER ───────────────────────────────────────────────────────────────────
function CyberContent() {
  const [picked, setPicked] = useState<number | null>(null);
  const [journey, setJourney] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("cyber-journey");
      if (saved) setJourney(JSON.parse(saved));
    } catch {/* ignore */}
  }, []);

  const ATTACK = 2;
  const RED = "#dc2626";

  const logs = [
    { time: "09:14:02", user: "maya@corp.il", action: "LOGIN", ip: "84.228.17.4" },
    { time: "09:14:58", user: "maya@corp.il", action: "DOWNLOAD report.xlsx", ip: "84.228.17.4" },
    { time: "09:17:44", user: "maya@corp.il", action: "LOGIN FAILED × 3", ip: "193.47.82.1" },
  ];

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(220,38,38,0.07)" }}>
        כל יום נתקפות מאות חברות בישראל.{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>
          SOC Analyst היא זאת שמזהה, עוצרת ומדווחת — לפני שהנזק מתפשט.
        </span>
      </div>

      <div className="mb-7">
        <Label text="זיהי את הכניסה החשודה — לחצי על השורה" />
        <div className="rounded-xl px-4 py-3 mb-3 flex gap-2 items-start"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
          <span className="text-[16px] shrink-0">🔍</span>
          <div className="text-[12.5px] leading-[1.55]" style={{ color: "#b91c1c" }}>
            <span className="font-bold">כל שלוש השורות הן אותו user.</span>{" "}
            אבל אחת מהן חשודה — למה?
          </div>
        </div>
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
              ? "✓ מצוין! IP שונה לחלוטין לאותו user = מישהי גנבה סיסמה. מה עושים? נועלים חשבון + פותחים חקירה."
              : "✗ שימי לב לשורה האחרונה — IP אחר לגמרי, ניסיונות כושלים. זה סימן קלאסי לפריצה."}
          </div>
        )}
      </div>

      <WowStat
        stat="3.5M+"
        label="מחסור במקצועני סייבר בעולם"
        sub="כל חברה צריכה מישהי שמגנה עליה — הביקוש עולה בהרבה על ההיצע"
        color={RED}
      />

      {/* Two career paths */}
      <div className="mb-7">
        <Label text="שני נתיבי קריירה בסייבר" />
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-4" style={{ background: "rgba(220,38,38,0.05)", border: "1.5px solid rgba(220,38,38,0.18)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[18px]">🎓</span>
              <span className="text-[13px] font-black" style={{ color: RED }}>נתיב מהיר: SOC Analyst</span>
            </div>
            <div className="text-[11.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.58)" }}>
              קורס הכשרה · שישה חודשים · ₪12,000–₪18,000 לחודש{"\n"}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["CompTIA Security+", "eJPT", "TryHackMe SOC Level 1"].map(c => (
                <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.1)", color: RED }}>{c}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "rgba(2,62,138,0.04)", border: "1.5px solid rgba(2,62,138,0.12)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[18px]">🔬</span>
              <span className="text-[13px] font-black" style={{ color: "#023e8a" }}>נתיב עמוק: Pentester / Security Researcher</span>
            </div>
            <div className="text-[11.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.58)" }}>
              תואר + ניסיון עצמאי · שנים · ₪20,000–₪40,000 לחודש
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["OSCP", "CEH", "Bug Bounty"].map(c => (
                <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(2,62,138,0.08)", color: "#023e8a" }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Industry context */}
      <div className="mb-7">
        <Label text="סייבר — הקשר תעשייה" />
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(220,38,38,0.12)" }}>
          <div className="mb-3">
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>תפקידים מרכזיים</div>
            <div className="flex flex-wrap gap-1.5">
              {["SOC Analyst", "Security Analyst", "Incident Responder", "Penetration Tester", "Security Engineer"].map(r => (
                <span key={r} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.08)", color: RED }}>{r}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>שכר</div>
              <div className="text-[14px] font-black" style={{ color: RED, ...HEEBO }}>₪12K – ₪40K</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>לחודש · לפי נתיב</div>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>נתיב כניסה מהיר</div>
              <div className="text-[11px] font-bold" style={{ color: "#023e8a" }}>Security+ · eJPT</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>שישה חודשים הכשרה</div>
            </div>
          </div>
        </div>
      </div>

      <JobMarketBlock
        color={RED}
        demand="מחסור קריטי בישראל ובעולם — הביקוש עולה על ההיצע בפער גדול"
        hitech="SOC Analyst · Security Engineer · Pentester · Bug Bounty"
        nonHitech="בנקים (חובה רגולטורית) · ממשל · בריאות · אנרגיה · ביטחון"
        ai="AI מגביר גם את ההתקפות וגם את הצורך במגינים. אנשי סייבר שמשלבים AI בארסנל שלהם — יכסו יותר שטח ויגלו יותר איומים. הביקוש לא יקטן."
      />

      {/* News article cards */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על הסייבר בישראל</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/cyber-boom.jpeg",
              summary: "ה-AI מחליף מפתחים — ויוצר בום בביקוש לאנשי סייבר",
              source: "כלכליסט",
              href: "https://www.calcalist.co.il/calcalistech/article/hkqnr8zlme",
            },
            {
              img: "/articles/cyber-investment.jpeg",
              summary: "יוני 2026: הסייבר הישראלי גייס 922 מיליון דולר בחודש אחד",
              source: "Israel Defense",
              href: "https://www.israeldefense.co.il/node/69457",
            },
            {
              img: "/articles/cyber-salary.jpeg",
              summary: "שכר ממוצע של 18,455 ₪ לחודש — אחד מהגבוהים בהייטק",
              source: "RT-ED",
              href: "https://rt-ed.co.il/articles/cybersecurity-salary/",
            },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(220,38,38,0.12)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}
            >
              <div className="overflow-hidden" style={{ aspectRatio: "16/9", background: "rgba(220,38,38,0.06)" }}>
                <img
                  src={a.img}
                  alt={a.summary}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] mb-3 flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
                <div className="flex justify-end">
                  <span className="text-[11px] font-bold" style={{ color: "#dc2626" }}>קריאה ←</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <SimTeaser
        emoji="🛡️"
        challenge="בטעימה תהיי SOC Analyst לדקות ספורות — תקבלי 5 alerts אמיתיים ותחליטי: ALLOW, INVESTIGATE, או BLOCK"
      />

      {/* Journey map */}
      <div className="mb-7">
        <Label text="המסלול שלך בסייבר" />
        <div className="flex flex-col gap-2">
          {[
            {
              num: "1", emoji: "🛡️",
              title: "טעימה — triage של SOC Analyst",
              sub: "חמישה alerts אמיתיים · ALLOW / INVESTIGATE / BLOCK · ~8 דק'",
              href: "/explore/cyber/sim",
              doneKey: "sim" as const, lockedBy: null,
            },
            {
              num: "2", emoji: "🔥",
              title: "יום בחיי SOC Analyst",
              sub: "Ransomware response · triage · logs · בידוד · ~15 דק'",
              href: "/explore/cyber/learn/day",
              doneKey: "day" as const, lockedBy: "sim" as const,
            },
            {
              num: "3", emoji: "🕵️",
              title: "תעלומת הדלף — CyberSec Inc.",
              sub: "חקירת data breach · זיהוי הגורם · ~20 דק'",
              href: "/explore/cyber/learn/mystery",
              doneKey: "mystery" as const, lockedBy: "day" as const,
            },
            {
              num: "4", emoji: "💭",
              title: "כלי עיבוד החוויה",
              sub: "שש שאלות · ~5 דק'",
              href: "/explore/cyber/experience",
              doneKey: "experience" as const, lockedBy: "mystery" as const,
            },
          ].map((step, i, arr) => {
            const isDone = !!journey[step.doneKey];
            const isLocked = step.lockedBy ? !journey[step.lockedBy] : false;
            const isFirst = i === 0;
            const highlight = isFirst && !journey["sim"];

            return (
              <div key={step.num}>
                <Link href={isLocked ? "#" : step.href} className="block" onClick={isLocked ? (e) => e.preventDefault() : undefined}>
                  <div className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                    style={{
                      background: isDone ? "rgba(220,38,38,0.06)" : highlight ? RED : "#fff",
                      border: isDone ? "1.5px solid rgba(220,38,38,0.2)" : isLocked ? "1px solid rgba(0,0,0,0.06)" : highlight ? "none" : "1px solid rgba(0,0,0,0.08)",
                      opacity: isLocked ? 0.55 : 1,
                      boxShadow: highlight ? "0 4px 20px rgba(220,38,38,0.25)" : "none",
                    }}
                  >
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                      style={{ background: isDone ? RED : highlight ? "rgba(255,255,255,0.25)" : "rgba(220,38,38,0.1)", color: isDone || highlight ? "#fff" : RED }}>
                      {isDone ? "✓" : step.num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{isLocked ? "🔒" : step.emoji}</span>
                        <span className="text-[12.5px] font-bold"
                          style={{ color: isDone ? RED : highlight ? "#fff" : "#023e8a" }}>
                          {step.title}
                        </span>
                        {highlight && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>התחלי כאן</span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        {isLocked ? (
                          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                            זמין אחרי שלב {parseInt(step.num) - 1}
                          </span>
                        ) : (() => {
                          const parts = step.sub.split(/ · (~\d+.*)$/);
                          return (
                            <>
                              <div className="text-[11px]" dir="rtl"
                                style={{ color: highlight ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.4)" }}>
                                {parts[0]}
                              </div>
                              {parts[1] && (
                                <div className="text-[10px] mt-0.5 font-bold" dir="rtl"
                                  style={{ color: highlight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.28)" }}>
                                  ⏱ {parts[1]}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <span className="text-[16px] font-bold shrink-0"
                      style={{ color: isDone ? RED : highlight ? "#fff" : isLocked ? "rgba(0,0,0,0.2)" : RED }}>
                      {isLocked ? "🔒" : "←"}
                    </span>
                  </div>
                </Link>
                {i < arr.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-[1.5px] h-3"
                      style={{ background: isDone ? "rgba(220,38,38,0.4)" : "rgba(220,38,38,0.2)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SalaryCard min={12000} max={40000} />
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

      {/* כתבות מאומתות (23.8, סוכן אימות — URL + תאריך + og:image).
          מדורי תוכן שיווקי מסומנים בשדה המקור — לא מסתירים. */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על AI בישראל</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/ai-salary.jpg",
              summary: "עובדים עם התמחות AI משתכרים כ-43,000 ₪ — פער של 9% מעל שאר ההייטק",
              source: "Geektime · 7.2026",
              href: "https://www.geektime.co.il/israel-tech-salary-report-q1-2026/",
            },
            {
              img: "/articles/ai-roles.jpg",
              summary: "תפקידי ה-AI החדשים: איך מתקבלים — ומה השכר",
              source: "כלכליסט",
              href: "https://www.calcalist.co.il/calcalistech/article/h1pjlbofzg",
            },
            {
              img: "/articles/ai-hiring.jpg",
              summary: "לא עוצרות: החברות האלה מגייסות עכשיו לתפקידי AI",
              source: "Geektime · 3.2026",
              href: "https://www.geektime.co.il/ai-dev-job-offers-326/",
            },
          ].map((a) => (
            <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}>
              <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.04)" }}>
                <img src={a.img} alt={a.summary} className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <SimTeaser
        emoji="🤖"
        challenge="בטעימה: תקבלי 500 ביקורות לקוחות מעורבבות. המשימה — ללמד מודל להבדיל חיובי משלילי. כמה דוגמאות תצטרכי?"
      />

      <TasteJourney
        id="ai"
        color="#7c3aed"
        title="המסלול שלך ב-AI"
        steps={[
          { emoji: "🤖", title: "טעימה — אמני מודל בעצמך", sub: "ללמד מודל להבדיל ביקורת חיובית משלילית · ~10 דק'", href: "/explore/ai/sim", doneKey: "sim", lockedBy: null },
          { emoji: "🥐", title: "יום בחיי מיישמ/ת AI", sub: "הצ'אטבוט של המאפייה — תדריך, הזיות, גדרות · ~15 דק'", href: "/explore/ai/learn/day", doneKey: "day", lockedBy: "sim" },
          { emoji: "🛠️", title: "מיני-פרויקט — העוזר של המרפאה", sub: "שלוש הגדרות שהופכות AI כללי לעוזר אמיתי · ~20 דק'", href: "/explore/ai/learn/mystery", doneKey: "mystery", lockedBy: "day" },
          { emoji: "💭", title: "כלי עיבוד החוויה", sub: "שש שאלות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'", href: "/explore/ai/experience", doneKey: "experience", lockedBy: "mystery" },
        ]}
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

      {/* כתבות מאומתות (23.8, סוכן אימות — URL + תאריך + og:image).
          מדורי תוכן שיווקי מסומנים בשדה המקור — לא מסתירים. */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על עיצוב מוצר בישראל</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/ux-figma.jpg",
              summary: "ענקית העיצוב פיגמה רוכשת סטארטאפ ישראלי צעיר ב-200 מיליון דולר",
              source: "Geektime · 10.2025",
              href: "https://www.geektime.co.il/figma-acquires-israeli-startup-weavy/",
            },
            {
              img: "/articles/ux-product.jpg",
              summary: "עידן חדש לאנשי מוצר: ה-AI פותח ביקוש למי שמקימים מוצרים שלמים",
              source: "TheMarker · תוכן שיווקי",
              href: "https://www.themarker.com/labels/technologies/2026-02-16/ty-article-labels/0000019c-647b-d631-a3de-7dffb03d0000",
            },
            {
              img: "/articles/ux-triolla.jpg",
              summary: "מי הן חברות עיצוב ה-UX/UI המובילות בישראל?",
              source: "כלכליסט · תוכן שיווקי",
              href: "https://www.calcalist.co.il/article/h1cu4k5nlx",
            },
          ].map((a) => (
            <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}>
              <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.04)" }}>
                <img src={a.img} alt={a.summary} className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <SimTeaser
        emoji="🎨"
        challenge="בטעימה: תקבלי wireframe גרוע של אפליקציית זימון תורים. המשימה — לזהות 3 בעיות UX ולהציע כל אחת כיצד לתקן."
      />

      <TasteJourney
        id="ux"
        color="#db2777"
        title="המסלול שלך ב-UX/UI"
        steps={[
          { emoji: "🎨", title: "טעימה — תקני את ה-wireframe", sub: "שלוש בעיות UX באפליקציית זימון תורים · ~10 דק'", href: "/explore/ux/sim", doneKey: "sim", lockedBy: null },
          { emoji: "🛒", title: "יום בחיי מעצב/ת מוצר", sub: "60% נוטשים בשדה הטלפון — למצוא למה ולתקן · ~15 דק'", href: "/explore/ux/learn/day", doneKey: "day", lockedBy: "sim" },
          { emoji: "🛠️", title: "מיני-פרויקט — עצבי את מסך הקבלה", sub: "מסך לגמ\"ח שכונתי שגם רחל בת ה-72 מבינה · ~20 דק'", href: "/explore/ux/learn/mystery", doneKey: "mystery", lockedBy: "day" },
          { emoji: "💭", title: "כלי עיבוד החוויה", sub: "שש שאלות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'", href: "/explore/ux/experience", doneKey: "experience", lockedBy: "mystery" },
        ]}
      />

      <SalaryCard min={10000} max={22000} />
    </>
  );
}

// ─── DATA ────────────────────────────────────────────────────────────────────
function DataContent() {
  const [revealed, setRevealed] = useState(false);
  const [journey, setJourney] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("data-journey");
      if (saved) setJourney(JSON.parse(saved));
    } catch {/* ignore */}
  }, []);

  const bars = [
    { label: "ינו", val: 42, spike: false },
    { label: "פבר", val: 44, spike: false },
    { label: "מרץ", val: 41, spike: false },
    { label: "אפר", val: 43, spike: false },
    { label: "מאי", val: 68, spike: true },
    { label: "יוני", val: 91, spike: true },
  ];

  const TEAL = "#0d9488";

  return (
    <>
      {/* Hook */}
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(13,148,136,0.07)" }}>
        מה גרם לחברה אחת לגדול פי 3 תוך חודשיים?{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>דאטה אנליסטית אחת גילתה — בשתי שאילתות.</span>
      </div>

      {/* Interactive chart */}
      <div className="mb-7">
        <Label text="מה קרה פה? לחצי לגילוי" />
        <div
          className="rounded-2xl px-4 pt-5 pb-4"
          style={{ background: "#f0fdf9", border: "1px solid #99f6e4", boxShadow: "0 4px 24px rgba(13,148,136,0.1)" }}
        >
          <div className="text-[11px] font-bold mb-4" style={{ color: TEAL }}>מכירות חודשיות (₪ אלפים)</div>
          <div className="flex items-end gap-2 h-[72px]">
            {bars.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all duration-700"
                  style={{
                    height: `${(b.val / 91) * 60}px`,
                    background: revealed && b.spike ? TEAL : "#99f6e4",
                    border: revealed && b.spike ? `2px solid ${TEAL}` : "none",
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
            style={{ background: revealed ? "#16a34a" : TEAL, fontFamily: "'Heebo', sans-serif" }}
          >
            {revealed ? "✓ גילית את הסוד!" : "🔍 מה קרה במאי?"}
          </button>
        </div>
        {revealed && (
          <div className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{ background: "rgba(13,148,136,0.08)", border: "1px solid #99f6e488", color: "#065f46" }}>
            ✓ במאי פתחו קמפיין — אבל הדאטה גילתה ש-2 מוצרים בלבד מתוך 18 אחראים ל-89% מהצמיחה. ההמלצה: להעביר כל התקציב אליהם. תוצאה: +116% ביוני.
          </div>
        )}
      </div>

      {/* What does a data analyst do */}
      <div className="mb-7">
        <Label text="מה עושה אנליסטית דאטה?" />
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(13,148,136,0.12)" }}>
          <div className="flex flex-col gap-3 mb-4">
            {[
              ["🔍", "מגדירה שאלה עסקית", "לא 'למה המכירות ירדו' אלא 'מה ההמרה לפי מכשיר בQ1?'"],
              ["🧹", "אוספת ומנקה נתונים", "80% מהזמן — בלי נתונים נקיים אין תוצאות אמיתיות"],
              ["📊", "מוצאת דפוסים וחריגות", "הגרף שמספר סיפור שאף אחד אחר לא ראה"],
              ["💡", "מציגה המלצה להנהלה", "לא רק 'מה קרה' — אלא 'מה לעשות עכשיו'"],
            ].map(([icon, title, sub]) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-[18px] shrink-0">{icon}</span>
                <div>
                  <div className="text-[12.5px] font-bold" style={{ color: "#023e8a" }}>{title}</div>
                  <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="text-[10.5px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>כלי עבודה</div>
            <div className="flex flex-wrap gap-1.5">
              {["SQL", "Python", "Excel", "Tableau", "Power BI", "Google Sheets"].map(t => (
                <span key={t} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(13,148,136,0.08)", color: TEAL }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="text-[10.5px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>תעשיות מובילות</div>
            <div className="flex flex-wrap gap-1.5">
              {["פינטק", "e-commerce", "בריאות", "ממשלה", "ביטוח", "תקשורת"].map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(2,62,138,0.06)", color: "#023e8a" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <WowStat
        stat="2.5×"
        label="חברות data-driven צומחות פי 2.5 מהמתחרות"
        sub='McKinsey, 2024 — "הנתונים הם הנפט החדש של המאה ה-21"'
        color={TEAL}
      />

      {/* כתבות מאומתות (20.8, סוכן אימות — URL + תאריך + og:image) */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על עולם הדאטה בישראל</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/data-salary-2026.jpg",
              summary: "דוח חדש: דאטה אנליסט זינק 14% ל-31,000 ₪ — מהמרוויחים הגדולים של גל ה-AI",
              source: "Geektime · 7.2026",
              href: "https://www.geektime.co.il/israel-tech-salary-report-q1-2026/",
            },
            {
              img: "/articles/data-analyst-vs.jpg",
              summary: "הקרב על הנתונים: האם כדאי להיות דאטה סיינטיסט או אנליסט",
              source: "כלכליסט",
              href: "https://www.calcalist.co.il/calcalistech/article/bkcl0eza1e",
            },
            {
              img: "/articles/data-salary-2025.jpg",
              summary: "Data Engineer בצד המנצח: ביקוש לתשתיות דאטה ל-AI מזניק את השכר",
              source: "Geektime",
              href: "https://www.geektime.co.il/israeli-tech-salary-2025/",
            },
          ].map((a) => (
            <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(13,148,136,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}>
              <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.04)" }}>
                <img src={a.img} alt={a.summary} className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <JobMarketBlock
        color={TEAL}
        demand="אחד הכותרים הנפוצים ביותר בישראל — ביקוש גבוה ויציב"
        hitech="אנליסט/ית מוצר · אנליסט/ית דאטה · בונה דוחות (BI)"
        nonHitech="בנקים (ניהול סיכון) · ביטוח · קמעונאות · בריאות · ממשלה"
        ai="ה-AI לא מחליף אנליסטים — הוא עוזר להם להספיק פי שניים-שלושה. ולכן הביקוש דווקא עולה: גם חברות קטנות יכולות עכשיו להרשות לעצמן איש דאטה."
      />

      {/* Video — מה זה דאטה אנליסט */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1.5px solid rgba(13,148,136,0.2)" }}>
        <div className="px-4 pt-3 pb-2" style={{ background: "rgba(13,148,136,0.06)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#0d9488" }}>🎥 ראי לפני שממשיכים</div>
          <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>מה זה דאטה אנליסט — 60 שניות</div>
        </div>
        <div className="relative w-full" style={{ paddingTop: "56.25%", background: "#000" }}>
          <iframe
            src="https://www.youtube.com/embed/vemlok2E87o"
            title="מה זה דאטה אנליסט ב-60 שניות"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </div>

      {/* Journey map */}
      <div className="mb-7">
        <Label text="המסלול שלך בדאטה" />
        <div className="flex flex-col gap-2">
          {[
            {
              num: "1",
              emoji: "📊",
              title: "טעימה — חשבי כמו אנליסטית",
              sub: "CSV עם נתונים אמיתיים · 8 שלבים · ~10 דק'",
              href: "/explore/data/sim",
              doneKey: "sim" as const,
              lockedBy: null,
            },
            /* מרכז הלמידה ירד מהשרשרת (נתי 24.8) — הזרימה ישרה: sim ←
               אנליטיקה ← תעלומה. שבעת המודולים נשארים נגישים מהמפה כרשות */
            {
              num: "2",
              emoji: "🔬",
              title: "אנליטיקה בשטח — 5 שלבים",
              sub: "שאלת מחקר · ניקוי נתונים · AI Prompting · המנכ\"ל · ~15 דק'",
              href: "/explore/data/learn/analytics",
              doneKey: "analytics" as const,
              lockedBy: "sim" as const,
            },
            {
              num: "3",
              emoji: "🕵️",
              title: "תעלומת SQL — מתקדם",
              sub: "חקירת הדלפה בסטארטאפ · כתיבת שאילתות אמיתיות · ~15 דק'",
              href: "/explore/data/learn/mystery",
              doneKey: "mystery" as const,
              lockedBy: "analytics" as const,
            },
            {
              num: "4",
              emoji: "💭",
              title: "כלי עיבוד החוויה",
              sub: "6 שאלות קצרות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'",
              href: "/explore/data/experience",
              doneKey: "experience" as const,
              lockedBy: "mystery" as const,
            },
          ].map((step, i, arr) => {
            const isDone = step.doneKey ? !!journey[step.doneKey] : false;
            const isLocked = step.lockedBy ? !journey[step.lockedBy] : false;
            const isFirst = i === 0;
            const highlight = isFirst && !journey["sim"];

            return (
              <div key={step.num}>
                <Link href={isLocked ? "#" : step.href} className="block" onClick={isLocked ? (e) => e.preventDefault() : undefined}>
                  <div
                    className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                    style={{
                      background: isDone ? "rgba(13,148,136,0.06)" : highlight ? TEAL : "#fff",
                      border: isDone
                        ? "1.5px solid rgba(13,148,136,0.2)"
                        : isLocked
                        ? "1px solid rgba(0,0,0,0.06)"
                        : highlight
                        ? "none"
                        : "1px solid rgba(0,0,0,0.08)",
                      opacity: isLocked ? 0.55 : 1,
                      boxShadow: highlight ? "0 4px 20px rgba(13,148,136,0.25)" : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                      style={{
                        background: isDone ? TEAL : highlight ? "rgba(255,255,255,0.25)" : "rgba(13,148,136,0.1)",
                        color: isDone || highlight ? "#fff" : TEAL,
                      }}
                    >
                      {isDone ? "✓" : step.num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{isLocked ? "🔒" : step.emoji}</span>
                        <span
                          className="text-[12.5px] font-bold"
                          style={{ color: isDone ? TEAL : highlight ? "#fff" : "#023e8a" }}
                        >
                          {step.title}
                        </span>
                        {highlight && (
                          <span
                            className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
                          >
                            התחלי כאן
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        {isLocked ? (
                          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                            זמין אחרי שלב {parseInt(step.num) - 1}
                          </span>
                        ) : (() => {
                          const parts = step.sub.split(/ · (~\d+.*)$/);
                          return (
                            <>
                              <div className="text-[11px]" dir="rtl"
                                style={{ color: highlight ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.4)" }}>
                                {parts[0]}
                              </div>
                              {parts[1] && (
                                <div className="text-[10px] mt-0.5 font-bold" dir="rtl"
                                  style={{ color: highlight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.28)" }}>
                                  ⏱ {parts[1]}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <span
                      className="text-[16px] font-bold shrink-0"
                      style={{ color: isDone ? TEAL : highlight ? "#fff" : isLocked ? "rgba(0,0,0,0.2)" : TEAL }}
                    >
                      {isLocked ? "🔒" : "←"}
                    </span>
                  </div>
                </Link>
                {i < arr.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div
                      className="w-[1.5px] h-3"
                      style={{ background: isDone ? "rgba(13,148,136,0.4)" : "rgba(13,148,136,0.2)" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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

      {/* כתבות מאומתות (23.8, סוכן אימות — URL + תאריך + og:image).
          מדורי תוכן שיווקי מסומנים בשדה המקור — לא מסתירים. */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על שיווק בהייטק</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/mkt-trends.jpg",
              summary: "2026 מסמנת נקודת מפנה בעולם השיווק — 5 המגמות שיובילו",
              source: "גלובס · 1.2026",
              href: "https://www.globes.co.il/news/article.aspx?did=1001531113",
            },
            {
              img: "/articles/mkt-ai.jpg",
              summary: "איך מנהלי שיווק הולכים לעבוד עם AI ב-2026?",
              source: "Geektime",
              href: "https://www.geektime.co.il/ai-in-marketing-event-231225/",
            },
            {
              img: "/articles/mkt-secure.jpg",
              summary: "בכירי השיווק לא חוששים שה-AI תגזול את תפקידם — והם צודקים",
              source: "גלובס",
              href: "https://www.globes.co.il/news/article.aspx?did=1001497446",
            },
          ].map((a) => (
            <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}>
              <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.04)" }}>
                <img src={a.img} alt={a.summary} className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <SimTeaser
        emoji="📢"
        challenge="בטעימה: תקציב ₪2,000 לחודש, 3 ערוצים. המשימה — להחליט כיצד לפצל כדי להגיע ל-500 לידים. לכל החלטה יש מחיר."
      />

      <TasteJourney
        id="marketing"
        color="#f97316"
        title="המסלול שלך בשיווק דיגיטלי"
        steps={[
          { emoji: "📢", title: "טעימה — פצלי את התקציב", sub: "2,000 ₪ · שלושה ערוצים · יעד 500 לידים · ~10 דק'", href: "/explore/marketing/sim", doneKey: "sim", lockedBy: null },
          { emoji: "🏋️", title: "יום בחיי מנהל/ת שיווק", sub: "הסטודיו של מיכל — 667 ₪ לפנייה, ואיך מורידים ל-91 · ~15 דק'", href: "/explore/marketing/learn/day", doneKey: "day", lockedBy: "sim" },
          { emoji: "🛠️", title: "מיני-פרויקט — קמפיין ב-300 ₪", sub: "המספרה של יוסי — קהל, מסר, תמונה, ואיטרציה · ~20 דק'", href: "/explore/marketing/learn/mystery", doneKey: "mystery", lockedBy: "day" },
          { emoji: "💭", title: "כלי עיבוד החוויה", sub: "שש שאלות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'", href: "/explore/marketing/experience", doneKey: "experience", lockedBy: "mystery" },
        ]}
      />

      <SalaryCard min={9000} max={20000} />
    </>
  );
}

// ─── NETWORKS ────────────────────────────────────────────────────────────────
function NetworksContent() {
  const [pingLines, setPingLines] = useState<string[]>([]);
  const [pinging, setPinging] = useState(false);
  const [pingDone, setPingDone] = useState(false);
  const [journey, setJourney] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("networks-journey");
      if (saved) setJourney(JSON.parse(saved));
    } catch {/* ignore */}
  }, []);

  const BLUE = "#3b82f6";

  const lines = [
    "PING google.com (142.250.185.14): 56 bytes",
    "64 bytes: icmp_seq=0 ttl=118 time=11.4ms",
    "64 bytes: icmp_seq=1 ttl=118 time=10.9ms",
    "64 bytes: icmp_seq=2 ttl=118 time=12.1ms",
    "--- google.com ping statistics ---",
    "3 packets transmitted, 3 received, 0% loss",
  ];

  function runPing() {
    if (pinging || pingDone) return;
    setPinging(true);
    lines.forEach((line, i) => {
      setTimeout(() => {
        setPingLines((prev) => [...prev, line]);
        if (i === lines.length - 1) { setPinging(false); setPingDone(true); }
      }, i * 380);
    });
  }

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(59,130,246,0.07)" }}>
        כל פעם שאת גולשת לאתר, שולחת הודעה או מדברת ב-Zoom —{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>מישהי בנתה את הרשת שמאפשרת את זה.</span>
      </div>

      {/* 4 Core Concepts with analogies */}
      <div className="mb-7">
        <Label text="4 מושגי יסוד — עם אנלוגיות" />
        <div className="flex flex-col gap-2">
          {[
            {
              emoji: "🏠", term: "IP Address", color: BLUE,
              analogy: "כתובת הבית של כל מכשיר",
              explain: "כמו שלכל בית יש כתובת, לכל מחשב יש מספר ייחודי. 142.250.185.14 זו כתובת ה-IP של גוגל.",
            },
            {
              emoji: "📖", term: "DNS", color: "#7c3aed",
              analogy: "ספר הטלפונים של האינטרנט",
              explain: "כותבים \"google.com\" — ה-DNS מתרגם לכתובת IP. בלי DNS היינו צריכים לזכור מספרים במקום שמות.",
            },
            {
              emoji: "📦", term: "Packet", color: "#0d9488",
              analogy: "מעטפה בדואר",
              explain: "כל הודעה נחתכת לחתיכות קטנות שנוסעות בנפרד ומתאחדות ביעד — כמו שולחים פאזל חתיכה חתיכה.",
            },
            {
              emoji: "🚦", term: "Router", color: "#f97316",
              analogy: "שוטר תנועה בצומת",
              explain: "הרשת מלאה בצמתים. ה-Router בכל צומת מחליט לאן לשלוח את ה-packet — שמאל, ישר, ימין?",
            },
          ].map(({ emoji, term, color, analogy, explain }) => (
            <div key={term} className="rounded-xl p-3.5 flex gap-3"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="text-[22px] shrink-0 mt-0.5">{emoji}</span>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-black" style={{ color, fontFamily: "'Heebo', sans-serif" }}>{term}</span>
                  <span className="text-[11px] font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>= {analogy}</span>
                </div>
                <div className="text-[11.5px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.5)" }}>{explain}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ping simulator — analogy first */}
      <div className="mb-7">
        <Label text="נסי את זה בעצמך — שלחי Ping לגוגל" />
        <div className="rounded-xl px-4 py-3 mb-3 flex gap-2 items-start"
          style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <span className="text-[16px] shrink-0">🚪</span>
          <div className="text-[12.5px] leading-[1.55]" style={{ color: "#1d4ed8" }}>
            <span className="font-bold">Ping = דפיקה על דלת.</span>{" "}
            שולחים הודעה לגוגל ומודדים כמה זמן לקח לה לחזור. אם חזרה — הדרך פתוחה.
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(59,130,246,0.13)" }}>
          <div className="flex items-center gap-[6px] px-4 py-[10px]" style={{ background: "#1e293b" }}>
            <div className="w-[11px] h-[11px] rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-[11px] h-[11px] rounded-full" style={{ background: "#eab308" }} />
            <div className="w-[11px] h-[11px] rounded-full" style={{ background: "#22c55e" }} />
            <span className="text-[11px] mr-2" style={{ color: "#94a3b8" }}>terminal</span>
          </div>
          <div className="p-4 font-mono text-[12px] leading-[1.9] min-h-[80px]" style={{ background: "#0f172a", color: "#e2e8f0" }} dir="ltr">
            <div style={{ color: "#60a5fa" }}>$ ping google.com</div>
            {pingLines.map((line, i) => {
              let color = "#e2e8f0";
              let annotation = "";
              if (line.includes("0% loss")) { color = "#22c55e"; annotation = "  ← אפס אבידות!"; }
              else if (line.includes("statistics")) color = "#94a3b8";
              else if (line.includes("142.250")) annotation = "  ← כתובת IP של גוגל";
              else if (line.includes("time=")) annotation = "  ← 11ms = מהירות התגובה";
              return (
                <div key={i}>
                  <span style={{ color }}>{line}</span>
                  {annotation && <span style={{ color: "#475569", fontSize: "10px" }}>{annotation}</span>}
                </div>
              );
            })}
            {pinging && <div style={{ color: "#60a5fa" }}>▌</div>}
          </div>
          <button
            onClick={runPing}
            disabled={pinging || pingDone}
            className="w-full py-[11px] text-[13.5px] font-bold transition-all"
            style={{ background: pingDone ? "#16a34a" : BLUE, color: "#fff", fontFamily: "'Heebo', sans-serif" }}
          >
            {pingDone ? "✓ גוגל ענתה — הדרך פתוחה!" : pinging ? "שולחת דפיקות לגוגל..." : "▶  דפקי על הדלת של גוגל ←"}
          </button>
        </div>
        {pingDone && (
          <div className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)", color: "#15803d" }}>
            3 דפיקות נשלחו וחזרו תוך 11 אלפיות שנייה. זה הכלי הראשון שכל Network Engineer מריצה כשמשהו לא עובד.
          </div>
        )}
      </div>

      {/* What does a network engineer do */}
      <div className="mb-7">
        <Label text="מה זה בכלל Network Engineer?" />
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(59,130,246,0.12)" }}>

          {/* One-liner */}
          <div className="text-[13.5px] leading-[1.65] mb-4" style={{ color: "#1e3a5f" }}>
            כל פעם שאתה שולח הודעה, צופה בסרטון או משלם אונליין — יש מישהו שבנה את הצינורות שמאפשרים את זה.{" "}
            <span className="font-black" style={{ color: BLUE }}>זה Network Engineer.</span>
          </div>

          {/* A day in the life */}
          <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>יום בחיים</div>
          <div className="flex flex-col gap-3 mb-4">
            {[
              { time: "08:30", icon: "☕", text: "מגיעה למשרד, פותחת את לוח הניטור — בודקת שכל הרשת ירוקה" },
              { time: "09:15", icon: "🔴", text: "alert: שרת בסניף ת\"א לא מגיב. מריצה ping → traceroute → מאתרת שה-switch קרס" },
              { time: "10:30", icon: "🔧", text: "מחליפה ציוד, מגדירה מחדש את ה-VLAN, מחזירה את הסניף לאוויר" },
              { time: "14:00", icon: "📐", text: "ישיבת תכנון: איך מרחיבים את הרשת ל-3 סניפים חדשים ברחבי הארץ" },
              { time: "16:00", icon: "🛡️", text: "עדכון חוקי Firewall — חוסמת IP חשוד שניסה לסרוק את הרשת" },
            ].map(({ time, icon, text }) => (
              <div key={time} className="flex gap-3 items-start">
                <div className="text-[10px] font-black shrink-0 mt-0.5 w-10 text-left" style={{ color: "rgba(0,0,0,0.3)", fontFamily: "monospace" }}>{time}</div>
                <span className="text-[15px] shrink-0">{icon}</span>
                <div className="text-[12px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>{text}</div>
              </div>
            ))}
          </div>

          {/* Why important */}
          <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: BLUE }}>למה זה חשוב?</div>
            <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
              בלי Network Engineer — אין אינטרנט, אין Zoom, אין בנקאות אונליין, אין טיסות. כל ארגון עם יותר מ-10 מחשבים צריך מישהו שישמור על הקישוריות. זו תשתית קריטית ממש כמו חשמל ומים.
            </div>
          </div>

          {/* Who fits */}
          <div className="mb-4">
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(0,0,0,0.3)" }}>מי מתחבר לתחום הזה?</div>
            <div className="flex flex-col gap-1.5">
              {[
                ["🧩", "אנשים שאוהבים לפתור תעלומות", "כשמשהו לא עובד — הם רוצים לדעת למה"],
                ["🔌", "כאלה שסקרנים לגבי 'איך הדברים עובדים'", "לא רק לגלוש — להבין מה קורה מתחת לפני השטח"],
                ["📋", "מסודרים ומתודיים", "רשת טובה דורשת תיעוד, תכנון וסבלנות"],
                ["🚨", "שאוהבים לחץ טוב", "כשהרשת קורסת — הם הכבאים. זה דחוף, זה חשוב, זה מספק"],
              ].map(([icon, title, sub]) => (
                <div key={title} className="flex items-start gap-2.5">
                  <span className="text-[16px] shrink-0">{icon}</span>
                  <div>
                    <div className="text-[12px] font-bold" style={{ color: "#023e8a" }}>{title}</div>
                    <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools + industries */}
          <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="text-[10.5px] font-bold mb-2 uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.3)" }}>כלי עבודה</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["Cisco IOS", "Wireshark", "ping / traceroute", "Firewall", "VPN", "AWS Networking"].map(t => (
                <span key={t} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(59,130,246,0.08)", color: BLUE }}>{t}</span>
              ))}
            </div>
            <div className="text-[10.5px] font-bold mb-2 uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.3)" }}>תעשיות מובילות</div>
            <div className="flex flex-wrap gap-1.5">
              {["בנקאות", "ממשלה", "בריאות", "טלקום", "ענן (Cloud)", "ביטחון"].map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(2,62,138,0.06)", color: "#023e8a" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <WowStat
        stat="99.99%"
        label="זמינות שרשתות ארגוניות חייבות לספק"
        sub="0.01% downtime = 52 דקות בשנה. כל דקה עולה לחברה גדולה ~$5,600."
        color={BLUE}
      />

      <JobMarketBlock
        color={BLUE}
        demand="ביקוש גבוה ויציב — כל ארגון עם תשתית דיגיטלית צריך מומחה רשת"
        hitech="Cloud Architect · Network Engineer · Infrastructure · DevOps"
        nonHitech="בנקים · בתי חולים · ממשלה · צבא · טלקום (Bezeq, Partner, Cellcom)"
        ai="AI מאוטמט ניטור רוטיני — אבל troubleshooting, ארכיטקטורת רשת ואבטחה עדיין דורשים שיפוט אנושי. מהנדסי רשת שמשלבים AI בכלי האבחון שלהם יהיו שווים יותר."
      />

      {/* Video */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ border: `1.5px solid rgba(59,130,246,0.2)` }}>
        <div className="px-4 pt-3 pb-2" style={{ background: "rgba(59,130,246,0.06)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: BLUE }}>🎥 ראי לפני שממשיכים</div>
          <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>סרטון של ~2 דק' — מבוא לאיך עובד האינטרנט</div>
        </div>
        <div className="aspect-video">
          <iframe
            src="https://www.youtube.com/embed/ad8EOsXFuxE"
            title="מבוא - איך עובד האינטרנט?"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>

      {/* כתבות מאומתות (20.8, סוכן אימות — URL + תאריך + og:image) */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על תשתיות ורשתות בישראל</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/net-datacenters.jpg",
              summary: "פעילות הדאטה סנטרס בישראל צפויה להכפיל את עצמה תוך חמש שנים",
              source: "TheMarker · 1.2026",
              href: "https://www.themarker.com/markets/2026-01-15/ty-article/.premium/0000019b-bda3-decf-a99f-bffbaea40000",
            },
            {
              img: "/articles/net-power.jpg",
              summary: "40+ דאטה סנטרים בדרך: האם ישראל הופכת למעצמת תשתיות?",
              source: "Geektime",
              href: "https://www.geektime.co.il/can-israel-become-a-data-center-powerhouse/",
            },
            {
              img: "/articles/net-nvidia.jpg",
              summary: "עם 10,000 עובדים: הקמפוס הענק של אנבידיה נבנה סביב לב הרשתות שלה",
              source: "כלכליסט",
              href: "https://www.calcalist.co.il/calcalistech/article/sj11wgxxze",
            },
          ].map((a) => (
            <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(37,99,235,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}>
              <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.04)" }}>
                <img src={a.img} alt={a.summary} className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <SimTeaser
        emoji="🌐"
        challenge="בטעימה תשלחי בקשה לשרת של גוגל ותראי בדיוק מה קורה בין הרגע שלחצת Enter לרגע שהדף נפתח — DNS, Routing, TCP/IP, HTTP — אחד אחד"
      />

      {/* Journey map */}
      <div className="mb-7">
        <Label text="המסלול שלך ברשתות" />
        <div className="flex flex-col gap-2">
          {[
            {
              num: "1", emoji: "🌐",
              title: "טעימה — מה קורה כשלוחצים Enter?",
              sub: "חמש תחנות: DNS, IP, Routing, TCP, HTTP · ~10 דק'",
              href: "/explore/networks/sim",
              doneKey: "sim" as const, lockedBy: null,
            },
            {
              num: "2", emoji: "🛠️",
              title: "יום בחיי Network Engineer",
              sub: "תקלה אמיתית — ping, traceroute, nslookup, Post-Mortem · ~15 דק'",
              href: "/explore/networks/learn/day",
              doneKey: "day" as const, lockedBy: "sim" as const,
            },
            {
              num: "3", emoji: "🕵️",
              title: "חקירת תקלה — TechFlow",
              sub: "חקירת תקלה בחברת SaaS — curl, firewall logs · ~20 דק'",
              href: "/explore/networks/learn/mystery",
              doneKey: "mystery" as const, lockedBy: "day" as const,
            },
            {
              num: "4", emoji: "💭",
              title: "כלי עיבוד החוויה",
              sub: "שש שאלות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'",
              href: "/explore/networks/experience",
              doneKey: "experience" as const, lockedBy: "mystery" as const,
            },
          ].map((step, i, arr) => {
            const isDone = !!journey[step.doneKey];
            const isLocked = step.lockedBy ? !journey[step.lockedBy] : false;
            const isFirst = i === 0;
            const highlight = isFirst && !journey["sim"];

            return (
              <div key={step.num}>
                <Link href={isLocked ? "#" : step.href} className="block" onClick={isLocked ? (e) => e.preventDefault() : undefined}>
                  <div className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                    style={{
                      background: isDone ? "rgba(59,130,246,0.06)" : highlight ? BLUE : "#fff",
                      border: isDone ? "1.5px solid rgba(59,130,246,0.2)" : isLocked ? "1px solid rgba(0,0,0,0.06)" : highlight ? "none" : "1px solid rgba(0,0,0,0.08)",
                      opacity: isLocked ? 0.55 : 1,
                      boxShadow: highlight ? "0 4px 20px rgba(59,130,246,0.25)" : "none",
                    }}
                  >
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                      style={{ background: isDone ? BLUE : highlight ? "rgba(255,255,255,0.25)" : "rgba(59,130,246,0.1)", color: isDone || highlight ? "#fff" : BLUE }}>
                      {isDone ? "✓" : step.num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{isLocked ? "🔒" : step.emoji}</span>
                        <span className="text-[12.5px] font-bold"
                          style={{ color: isDone ? BLUE : highlight ? "#fff" : "#023e8a" }}>
                          {step.title}
                        </span>
                        {highlight && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>התחלי כאן</span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        {isLocked ? (
                          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                            זמין אחרי שלב {parseInt(step.num) - 1}
                          </span>
                        ) : (() => {
                          const parts = step.sub.split(/ · (~\d+.*)$/);
                          return (
                            <>
                              <div className="text-[11px]" dir="rtl"
                                style={{ color: highlight ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.4)" }}>
                                {parts[0]}
                              </div>
                              {parts[1] && (
                                <div className="text-[10px] mt-0.5 font-bold" dir="rtl"
                                  style={{ color: highlight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.28)" }}>
                                  ⏱ {parts[1]}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <span className="text-[16px] font-bold shrink-0"
                      style={{ color: isDone ? BLUE : highlight ? "#fff" : isLocked ? "rgba(0,0,0,0.2)" : BLUE }}>
                      {isLocked ? "🔒" : "←"}
                    </span>
                  </div>
                </Link>
                {i < arr.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-[1.5px] h-3"
                      style={{ background: isDone ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.2)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SalaryCard min={12000} max={30000} />
    </>
  );
}

// ─── QA ──────────────────────────────────────────────────────────────────────
function QAContent() {
  const [picked, setPicked] = useState<number | null>(null);
  const [journey, setJourney] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("qa-journey");
      if (saved) setJourney(JSON.parse(saved));
    } catch {/* ignore */}
  }, []);

  const AMBER = "#d97706";
  const BUGGY_ROW = 2;

  const cart = [
    { label: "חולצה × 2 — ₪49.90 ליחידה", total: "₪99.80" },
    { label: "מכנסיים × 1", total: "₪129.90" },
    { label: "סה\"כ לתשלום", total: "₪199.80" },
  ];

  return (
    <>
      <div className="mb-6 rounded-2xl p-4 text-[13.5px] leading-[1.7]" style={{ background: "rgba(217,119,6,0.08)" }}>
        כל אפליקציה יוצאת עם באגים — השאלה היא רק כמה מהם הלקוחות רואים.{" "}
        <span className="font-black" style={{ color: "#023e8a" }}>
          בודקת QA היא זו שתופסת אותם קודם.
        </span>
      </div>

      <div className="mb-7">
        <Label text="מצאי את הבאג — לחצי על השורה החשודה" />
        <div className="rounded-xl px-4 py-3 mb-3 flex gap-2 items-start"
          style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
          <span className="text-[16px] shrink-0">🧾</span>
          <div className="text-[12.5px] leading-[1.55]" style={{ color: "#92400e" }}>
            <span className="font-bold">זו קבלה מעגלת קניות אמיתית.</span>{" "}
            שורה אחת בה לא מסתכמת נכון — איזו?
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(217,119,6,0.2)", boxShadow: "0 4px 24px rgba(217,119,6,0.1)" }}>
          {cart.map((row, i) => {
            const isCorrect = i === BUGGY_ROW;
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
                  className="px-4 py-3 flex items-center justify-between border-t text-[13px] text-right transition-all"
                  style={{
                    borderColor: "rgba(0,0,0,0.06)",
                    background: showResult && isCorrect
                      ? "rgba(22,163,74,0.08)"
                      : picked === i
                      ? "rgba(220,38,38,0.06)"
                      : "#fff",
                    fontWeight: i === 2 ? 700 : 400,
                  }}
                >
                  <span style={{ color: "#1c1c1c" }}>{row.label}</span>
                  <span style={{ color: "#1c1c1c" }}>{row.total}</span>
                </div>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div
            className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
            style={{
              background: picked === BUGGY_ROW ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
              border: `1px solid ${picked === BUGGY_ROW ? "#16a34a44" : "#dc262644"}`,
              color: picked === BUGGY_ROW ? "#15803d" : "#b91c1c",
            }}
          >
            {picked === BUGGY_ROW
              ? "✓ מדויק! ₪99.80 + ₪129.90 = ₪229.70 — לא ₪199.80. פער של ₪30 בכל הזמנה. QA טובה בודקת גם חשבון פשוט, לא רק אם המסך נטען."
              : "✗ שימי לב לסכום הכולל: ₪99.80 + ₪129.90 אמור להיות ₪229.70, לא ₪199.80. זה בדיוק סוג הבאג שבדיקה ידנית תופסת תוך שניות."}
          </div>
        )}
      </div>

      <WowStat
        stat="100×"
        label="באג שנתפס אחרי ההשקה עולה עד פי 100 מבאג שנתפס בשלב התכנון"
        sub="כלל אצבע ותיק בתעשייה — ככל שתופסים באג מוקדם יותר, התיקון זול יותר"
        color={AMBER}
      />

      {/* Industry context block */}
      <div className="mb-7">
        <Label text="בדיקות תוכנה — הקשר תעשייה" />
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(217,119,6,0.15)" }}>
          <div className="mb-3">
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>תפקידים מרכזיים</div>
            <div className="flex flex-wrap gap-1.5">
              {["QA Engineer", "Manual Tester", "QA Automation Engineer", "SDET", "Test Lead"].map(r => (
                <span key={r} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(217,119,6,0.1)", color: AMBER }}>{r}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>שכר</div>
              <div className="text-[14px] font-black" style={{ color: AMBER, ...HEEBO }}>₪11K – ₪24K</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>לחודש · לפי נתיב (ידני/אוטומציה)</div>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>נתיב כניסה</div>
              <div className="text-[11px] font-bold" style={{ color: "#023e8a" }}>קורס QA · בלי צורך בקוד</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>שלושה עד חמישה חודשים</div>
            </div>
          </div>
        </div>
      </div>

      <JobMarketBlock
        color={AMBER}
        demand="נקודת כניסה מהירה להייטק — כמעט כל חברת תוכנה צריכה בודקת איכות"
        hitech="QA Engineer · Automation Engineer · SDET · Test Lead"
        nonHitech="פינטק · e-commerce · בריאות דיגיטלית · ממשלה"
        ai="כלי AI מייצרים מקרי בדיקה ומזהים אנומליות אוטומטית — אבל שיפוט על מה 'חשוב לבדוק' ואילו מקרי קצה מסוכנים עדיין דורש בודקת אנושית. QA שמשלבת AI בתהליך העבודה — עובדת מהר יותר, לא מיותרת."
      />

      {/* News article cards */}
      <div className="mb-5">
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#023e8a" }}>כתבות אחרונות על בדיקות תוכנה בישראל</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              img: "/articles/qa-calcalist.jpg",
              summary: "בדיקות תוכנה נשארות מהתפקידים המבוקשים בהייטק — בחלק מהמקומות אין דרישה לתואר או ניסיון קודם",
              source: "כלכליסט",
              href: "https://www.calcalist.co.il/calcalistech/article/s1ceulqgf",
            },
            {
              img: "/articles/qa-geektime.jpg",
              summary: "כשכולם בצוות אחראים על איכות — תפקיד ה-QA עובר ממבצעת בדיקות למתכננת אסטרטגיית איכות ואוטומציה",
              source: "Geektime",
              href: "https://www.geektime.co.il/the-future-of-qa/",
            },
            {
              img: "/articles/qa-israelit.jpg",
              summary: "העתיד של בדיקות תוכנה: איך AI ו-TestOps משנים את הדרך שבה בודקים איכות מוצר",
              source: "Israel IT",
              href: "https://www.israel-it.org/single-post/%D7%9E%D7%94%D7%A4%D7%9B%D7%AA-%D7%94%D7%91%D7%99%D7%A0%D7%94-%D7%94%D7%9E%D7%9C%D7%90%D7%9B%D7%95%D7%AA%D7%99%D7%AA-%D7%91%D7%9E%D7%92%D7%96%D7%A8-%D7%94%D7%A6%D7%99%D7%91%D7%95%D7%A8%D7%99%D7%94%D7%99%D7%AA%D7%A8%D7%95%D7%A0%D7%95%D7%AA-%D7%94%D7%90%D7%A1%D7%98%D7%A8%D7%98%D7%92%D7%99%D7%99%D7%9D-%D7%A9%D7%9C-%D7%94%D7%98%D7%9E%D7%A2%D7%AA-%D7%9E%D7%95%D7%93%D7%9C%D7%99-gpt-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-1-1-2",
            },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
              style={{ background: "#fff", border: "1px solid rgba(217,119,6,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}
            >
              <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(217,119,6,0.06)" }}>
                <img
                  src={a.img}
                  alt={a.summary}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                <div className="text-[12px] font-bold leading-[1.4] mb-3 flex-1" style={{ color: "#023e8a" }}>{a.summary}</div>
                <div className="flex justify-end">
                  <span className="text-[11px] font-bold" style={{ color: AMBER }}>קריאה ←</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <SimTeaser
        emoji="🐞"
        challenge="בטעימה: שבעה מקרים קצרים — מציאת מקרה בדיקה טוב, סידור מחזור חיי באג, הבחנה בין Severity ל-Priority, ועוד."
      />

      {/* Journey map */}
      <div className="mb-7">
        <Label text="המסלול שלך ב-QA" />
        <div className="flex flex-col gap-2">
          {[
            {
              num: "1", emoji: "🐞",
              title: "טעימה — מצאי את הבאג",
              sub: "שבעה מקרים · מקרי בדיקה · Bug lifecycle · Severity/Priority · ~10 דק'",
              href: "/explore/qa/sim",
              doneKey: "sim" as const, lockedBy: null,
            },
            {
              num: "2", emoji: "🛠️",
              title: "יום בחיי QA Engineer",
              sub: "triage · כתיבת מקרי בדיקה · דיווח באג · regression · ~15 דק'",
              href: "/explore/qa/learn/day",
              doneKey: "day" as const, lockedBy: "sim" as const,
            },
            {
              num: "3", emoji: "🕵️",
              title: "תעלומה: איך זה עבר את ה-QA?",
              sub: "חקירת coverage ולוגי CI — למה הבאג לא נתפס · ~20 דק'",
              href: "/explore/qa/learn/mystery",
              doneKey: "mystery" as const, lockedBy: "day" as const,
            },
            {
              num: "4", emoji: "💭",
              title: "כלי עיבוד החוויה",
              sub: "שש שאלות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'",
              href: "/explore/qa/experience",
              doneKey: "experience" as const, lockedBy: "mystery" as const,
            },
          ].map((step, i, arr) => {
            const isDone = !!journey[step.doneKey];
            const isLocked = step.lockedBy ? !journey[step.lockedBy] : false;
            const isFirst = i === 0;
            const highlight = isFirst && !journey["sim"];

            return (
              <div key={step.num}>
                <Link href={isLocked ? "#" : step.href} className="block" onClick={isLocked ? (e) => e.preventDefault() : undefined}>
                  <div className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                    style={{
                      background: isDone ? "rgba(217,119,6,0.06)" : highlight ? AMBER : "#fff",
                      border: isDone ? "1.5px solid rgba(217,119,6,0.2)" : isLocked ? "1px solid rgba(0,0,0,0.06)" : highlight ? "none" : "1px solid rgba(0,0,0,0.08)",
                      opacity: isLocked ? 0.55 : 1,
                      boxShadow: highlight ? "0 4px 20px rgba(217,119,6,0.25)" : "none",
                    }}
                  >
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                      style={{ background: isDone ? AMBER : highlight ? "rgba(255,255,255,0.25)" : "rgba(217,119,6,0.1)", color: isDone || highlight ? "#fff" : AMBER }}>
                      {isDone ? "✓" : step.num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{isLocked ? "🔒" : step.emoji}</span>
                        <span className="text-[12.5px] font-bold"
                          style={{ color: isDone ? AMBER : highlight ? "#fff" : "#023e8a" }}>
                          {step.title}
                        </span>
                        {highlight && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>התחלי כאן</span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        {isLocked ? (
                          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                            זמין אחרי שלב {parseInt(step.num) - 1}
                          </span>
                        ) : (() => {
                          const parts = step.sub.split(/ · (~\d+.*)$/);
                          return (
                            <>
                              <div className="text-[11px]" dir="rtl"
                                style={{ color: highlight ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.4)" }}>
                                {parts[0]}
                              </div>
                              {parts[1] && (
                                <div className="text-[10px] mt-0.5 font-bold" dir="rtl"
                                  style={{ color: highlight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.28)" }}>
                                  ⏱ {parts[1]}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <span className="text-[16px] font-bold shrink-0"
                      style={{ color: isDone ? AMBER : highlight ? "#fff" : isLocked ? "rgba(0,0,0,0.2)" : AMBER }}>
                      {isLocked ? "🔒" : "←"}
                    </span>
                  </div>
                </Link>
                {i < arr.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-[1.5px] h-3"
                      style={{ background: isDone ? "rgba(217,119,6,0.4)" : "rgba(217,119,6,0.2)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SalaryCard min={11000} max={24000} />
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
  networks:  { badge: "ר",  label: "רשתות ותקשורת",    tagline: "בונות את התשתית שמחזיקה את האינטרנט — כל רגע", color: "#3b82f6" },
  qa:        { badge: "QA", label: "בדיקות תוכנה",     tagline: "תופסות את הבאגים לפני שהלקוחות מוצאים אותם",   color: "#d97706" },
};

const CONTENT_MAP: Record<string, () => React.ReactElement> = {
  code:      CodeContent,
  cyber:     CyberContent,
  ai:        AIContent,
  ux:        UXContent,
  data:      DataContent,
  marketing: MarketingContent,
  networks:  NetworksContent,
  qa:        QAContent,
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DomainPage() {
  const { domain } = useParams();
  const meta = META[domain as string];
  const ContentComponent = CONTENT_MAP[domain as string];

  if (!meta || !ContentComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fbf9f5" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-[16px] text-navy">תחום לא נמצא</div>
          <Link href="/explore" className="text-[14px] font-bold text-navy">← חזרה</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Domain-colored header */}
      <div className="text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0" style={{ background: meta.color }}>
        <div className="max-w-[900px] mx-auto">
          <Link href="/explore" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.82 }}>
            ← חזרה למסלול
          </Link>
          <div className="md:flex md:items-center md:gap-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px] mb-4 md:mb-0 shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", fontFamily: "'Heebo', sans-serif", color: "#fff" }}
            >
              {meta.badge}
            </div>
            <div>
              <div className="text-[28px] md:text-[36px] leading-tight" style={HEEBO}>{meta.label}</div>
              <div className="text-[13px] md:text-[15px] mt-[6px]" style={{ opacity: 0.88 }}>{meta.tagline}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] md:px-6 pt-6 pb-28">
        <ContentComponent />
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 inset-x-0 flex justify-center px-4 pb-[72px] md:pb-4 pt-3"
        style={{ background: "linear-gradient(to top, #fbf9f5 80%, transparent)" }}
      >
        <Link
          href={`/explore/${domain}/sim`}
          className="block w-full max-w-[500px] text-center py-[14px] rounded-xl text-white font-bold text-[15px]"
          style={{ background: "#fb8500", fontFamily: "'Heebo', sans-serif" }}
        >
          קדימה לטעימה ←
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
