"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

const DOMAINS = [
  { id: "code",      badge: "פ",  label: "פיתוח תוכנה",       color: "#3b82f6" },
  { id: "data",      badge: "ד",  label: "דאטה ואנליטיקס",    color: "#0d9488" },
  { id: "networks",  badge: "ר",  label: "רשתות ותקשורת",     color: "#2563eb" },
  { id: "cyber",     badge: "ס",  label: "סייבר",              color: "#dc2626" },
  { id: "ai",        badge: "AI", label: "AI ובינה מלאכותית",  color: "#7c3aed" },
  { id: "ux",        badge: "UX", label: "עיצוב UX/UI",        color: "#db2777" },
  { id: "marketing", badge: "ש",  label: "שיווק דיגיטלי",     color: "#f97316" },
  { id: "hardware",  badge: "ח",  label: "חומרה ואלקטרוניקה", color: "#7c2d12" },
];

type DomainResult = {
  id: string;
  badge: string;
  label: string;
  color: string;
  interest_scale: number;
  efficacy_scale: number;
  outcome_scale:  number;
  interest_open:  string;
  efficacy_open:  string;
  outcome_open:   string;
};

// ─── Scale bar ────────────────────────────────────────────────────────────────

function ScaleBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-[5px] rounded-full" style={{ background: "rgba(0,0,0,0.07)" }}>
        <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-4 text-left shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Auto-questions ────────────────────────────────────────────────────────────

function generateQuestions(results: DomainResult[]): string[] {
  const q: string[] = [];

  // High interest + low efficacy
  const gap = results.find(r => r.interest_scale >= 4 && r.efficacy_scale <= 2);
  if (gap) q.push(`מה יכול לעזור לי להרגיש יותר בטוח ב${gap.label}?`);

  // 2+ high-interest domains
  const topInterest = results.filter(r => r.interest_scale >= 4);
  if (topInterest.length >= 2)
    q.push(`מה ההבדל האמיתי בין ${topInterest[0].label} ל${topInterest[1].label} ביום-יום?`);

  // Low outcome
  const lowOut = results.find(r => r.outcome_scale <= 2);
  if (lowOut) q.push(`איך נראה יום עבודה אמיתי ב${lowOut.label}?`);

  q.push("מה צריך להתקיים כדי שאדע שבחרתי נכון?");

  return [...new Set(q)].slice(0, 3);
}

function getSoftLean(results: DomainResult[]): DomainResult | null {
  if (results.length < 2) return null;
  const sorted = [...results].sort(
    (a, b) => (b.interest_scale + b.efficacy_scale) - (a.interest_scale + a.efficacy_scale)
  );
  const diff = sorted[0].interest_scale + sorted[0].efficacy_scale
             - sorted[1].interest_scale - sorted[1].efficacy_scale;
  return diff >= 2 ? sorted[0] : null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [results, setResults] = useState<DomainResult[]>([]);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    const collected: DomainResult[] = [];
    for (const d of DOMAINS) {
      try {
        const journey = JSON.parse(localStorage.getItem(`${d.id}-journey`) || "{}");
        if (!journey.experience) continue;
        const exp = JSON.parse(localStorage.getItem(`${d.id}-experience`) || "{}");
        if (!exp.interest_scale) continue;
        collected.push({
          ...d,
          interest_scale: Number(exp.interest_scale) || 0,
          efficacy_scale: Number(exp.efficacy_scale) || 0,
          outcome_scale:  Number(exp.outcome_scale)  || 0,
          interest_open:  String(exp.interest_open  || ""),
          efficacy_open:  String(exp.efficacy_open  || ""),
          outcome_open:   String(exp.outcome_open   || ""),
        });
      } catch { /* skip */ }
    }
    collected.sort(
      (a, b) => (b.interest_scale + b.efficacy_scale) - (a.interest_scale + a.efficacy_scale)
    );
    setResults(collected);
    setReady(true);
  }, []);

  if (!ready) return null;

  // ── 0 completions ────────────────────────────────────────────────────────────
  if (results.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
        <div className="text-white px-[22px] pt-6 pb-6" style={{ background: NAVY }}>
          <Link href="/explore" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.7 }}>← חזרה לטעימות</Link>
          <div className="text-[22px]" style={HEEBO}>הכנה לפגישה</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32 text-center">
          <div className="text-[44px] mb-4">🗺️</div>
          <div className="text-[18px] font-black mb-2" style={{ color: NAVY, ...HEEBO }}>עוד לא ניסית תחום</div>
          <div className="text-[13px] mb-6" style={{ color: "rgba(0,0,0,0.5)" }}>
            כדי שיהיה מה לסכם — צריך לנסות לפחות טעימה אחת
          </div>
          <Link href="/explore"
            className="px-7 py-3.5 rounded-xl text-white font-black text-[14px] transition-all active:scale-[0.98]"
            style={{ background: NAVY, ...HEEBO }}>
            לטעימות הייטק ←
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const questions = generateQuestions(results);
  const lean      = getSoftLean(results);
  const tensions  = results.filter(r => r.interest_scale >= 4 && r.efficacy_scale <= 2);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>

      {/* ── Header ── */}
      <div className="text-white px-[22px] pt-6 pb-6 shrink-0" style={{ background: NAVY }}>
        <div className="max-w-[680px] mx-auto">
          <Link href="/explore" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.7 }}>
            ← חזרה לטעימות
          </Link>
          <div className="text-[22px]" style={HEEBO}>הכנה לפגישה עם הרכזת</div>
          <div className="text-[12.5px] mt-1" style={{ opacity: 0.72 }}>
            {results.length} {results.length === 1 ? "תחום שניסית" : "תחומים שניסית"} · מה שאספת
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[680px] mx-auto w-full px-5 pt-5 pb-32">

        {/* ── 1-domain nudge ── */}
        {results.length === 1 && (
          <div className="rounded-2xl px-4 py-3.5 mb-5 flex items-start gap-3"
            style={{ background: `${ORANGE}10`, border: `1.5px solid ${ORANGE}30` }}>
            <span className="text-[18px] shrink-0 mt-0.5">💡</span>
            <div className="text-[12.5px] leading-[1.6]" style={{ color: "#92400e" }}>
              <span className="font-bold">נסי תחום נוסף לפני הפגישה.</span>{" "}
              לפחות שתי טעימות — כדי שיהיה על מה לדון ולרכזת מה להשוות. יותר? עוד יותר טוב.
            </div>
          </div>
        )}

        {/* ── Domain cards ── */}
        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
          מה הרגשת בכל תחום
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {results.map((r, idx) => {
            const isTop      = idx === 0 && results.length >= 2;
            const lowEfficacy = r.efficacy_scale <= 2;
            const quotes = [
              { label: "עניין",   text: r.interest_open },
              { label: "ביטחון", text: r.efficacy_open },
              { label: "עתיד",   text: r.outcome_open  },
            ].filter(q => q.text.trim());

            return (
              <div key={r.id} className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", border: `1.5px solid ${r.color}22`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

                {/* Domain header */}
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ background: `${r.color}0d`, borderBottom: `1px solid ${r.color}18` }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-black shrink-0"
                      style={{ background: r.color, ...HEEBO }}>{r.badge}</div>
                    <span className="text-[15px] font-black" style={{ color: NAVY, ...HEEBO }}>{r.label}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {isTop && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${ORANGE}18`, color: ORANGE }}>
                        מוביל
                      </span>
                    )}
                    {lowEfficacy && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.45)" }}>
                        ביטחון עוד לא שם
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3.5">
                  {/* Scale bars */}
                  <div className="flex flex-col gap-2 mb-3.5">
                    {[
                      { label: "עניין",   icon: "✨", value: r.interest_scale },
                      { label: "ביטחון", icon: "💪", value: r.efficacy_scale },
                      { label: "עתיד",   icon: "🔭", value: r.outcome_scale  },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-[11px] w-16 shrink-0" style={{ color: "rgba(0,0,0,0.45)" }}>
                          {item.icon} {item.label}
                        </span>
                        <ScaleBar value={item.value} color={r.color} />
                      </div>
                    ))}
                  </div>

                  {/* Open-text quotes */}
                  {quotes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {quotes.map(q => (
                        <div key={q.label} className="rounded-xl px-3 py-2.5"
                          style={{ background: `${r.color}07`, border: `1px solid ${r.color}18` }}>
                          <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1"
                            style={{ color: r.color }}>{q.label}</div>
                          <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>
                            &ldquo;{q.text}&rdquo;
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tensions ── */}
        {tensions.length > 0 && (
          <div className="rounded-2xl p-4 mb-5"
            style={{ background: `${ORANGE}08`, border: `1.5px solid ${ORANGE}28` }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2.5" style={{ color: ORANGE }}>
              שמתי לב — שווה לדון בפגישה
            </div>
            <div className="flex flex-col gap-2">
              {tensions.map(r => (
                <div key={r.id} className="text-[12.5px] leading-[1.6]" style={{ color: "#78350f" }}>
                  ב<span className="font-bold">{r.label}</span> — יש עניין גבוה אבל ביטחון נמוך.
                  זה לא בעיה, זו שאלה: מה צריך להשתנות כדי שהביטחון יגיע?
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Questions for meeting ── */}
        {results.length >= 2 && (
          <div className="rounded-2xl p-4 mb-5"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>
              שאלות לפגישה — הביאי אותן
            </div>
            <div className="flex flex-col gap-3">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-white mt-0.5"
                    style={{ background: NAVY, ...HEEBO }}>{i + 1}</div>
                  <div className="text-[12.5px] leading-[1.55]" style={{ color: NAVY }}>{q}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Soft lean ── */}
        {lean && (
          <div className="rounded-2xl p-4 mb-5"
            style={{ background: `${lean.color}08`, border: `1.5px solid ${lean.color}28` }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: lean.color }}>
              כיוון ראשוני — לא מסקנה
            </div>
            <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
              על פי מה שכתבת, נשמע שאת נמשכת יותר ל
              <span className="font-black" style={{ color: lean.color }}> {lean.label}</span>.{" "}
              הביאי את זה לפגישה ותראי אם זה מתחבר — הרכזת תוכל לאתגר את זה, לאשש, או להציע זווית אחרת.
            </div>
          </div>
        )}

        {/* ── What the counselor adds ── */}
        <div className="rounded-2xl p-4 mb-6"
          style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.18)" }}>
          <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "#15803d" }}>
            מה הרכזת תוסיף — מה שרק היא יכולה לתת
          </div>
          {[
            "איך נראה יום עבודה אמיתי בתחום — לא מה שכתוב באתרים",
            "אילו קורסים מתאימים למצב שלך — עלויות, זמן, מיקום",
            "האם הציפיות שלך תואמות את מציאות שוק העבודה",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className="text-[13px] shrink-0 mt-0.5" style={{ color: "#16a34a" }}>✓</span>
              <span className="text-[12.5px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.6)" }}>{item}</span>
            </div>
          ))}
        </div>

        {/* ── CTAs ── */}
        <Link href="/contact"
          className="block w-full py-4 rounded-2xl text-center text-[15px] font-black mb-3 transition-all active:scale-[0.98]"
          style={{ background: ORANGE, color: "#fff", ...HEEBO }}>
          לתיאום פגישה עם הרכזת ←
        </Link>
        <Link href="/explore"
          className="block w-full py-3.5 rounded-2xl text-center text-[13px] font-bold"
          style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}>
          לנסות תחום נוסף
        </Link>

      </div>
      <BottomNav />
    </div>
  );
}
