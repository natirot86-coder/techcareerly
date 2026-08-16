/**
 * /admin/degrees — לוח המטה: תחומים ← תארים ← מוסדות מומלצים.
 *
 * לכל תחום — התארים שמובילים אליו (מהנתונים הלאומיים המאומתים), ולצד כל
 * תואר: אילו מוסדות **נתי מסמן** כמומלצים ללמוד אותו בהם. הסימון שלו ולא
 * שלנו — אנחנו לא יודעים לאמת איזה מוסד "הכי טוב" לתואר; מי שכן יודע זה
 * מי שמדבר עם המוסדות. הסימון זורם ישירות לבוחר התארים שהמועמד רואה.
 *
 * בצד: רשימת מוסדות התואר עם הדלת (programId) והקשר שלנו — כדי לסמן
 * בהקשר, לא מהזיכרון.
 *
 * ⚠️ אין בקאנד — עריכה מקומית + ייצוא JSON חוזר ל-src/data/degrees.ts.
 */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DEGREES, ENTRY_LABEL, type Degree } from "@/data/degrees";
import { INSTITUTIONS, DOMAIN_LABEL, type Domain } from "@/data/institutions";
import { FUNDING } from "@/data/scholarships";
import AdminGate from "@/components/AdminGate";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const STORE_KEY = "admin-degrees-draft";

const DOMAINS: Domain[] = ["data", "code", "cyber", "networks", "ai", "ux", "marketing"];

function AdminDegreesPage() {
  const [items, setItems] = useState<Degree[]>(DEGREES);
  const [activeDomain, setActiveDomain] = useState<Domain>("data");
  const [view, setView] = useState<"list" | "diagram">("list");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) { setItems(JSON.parse(saved)); setDirty(true); }
    } catch { /* ignore */ }
  }, []);

  function persist(next: Degree[]) {
    setItems(next);
    setDirty(true);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }
  function flash(m: string) { setToast(m); setTimeout(() => setToast(""), 1800); }
  function exportJson() {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    flash("הועתק — להדביק ב-src/data/degrees.ts");
  }

  /** סימון/ביטול מוסד מומלץ לתואר */
  function toggleInst(degreeId: string, instId: string) {
    persist(items.map(d => {
      if (d.id !== degreeId) return d;
      const cur = d.recommendedAt ?? [];
      return { ...d, recommendedAt: cur.includes(instId) ? cur.filter(x => x !== instId) : [...cur, instId] };
    }));
  }

  const degreeInsts = INSTITUTIONS.filter(i => i.track === "degree" && i.status !== "hidden");
  const domainDegrees = items.filter(d => d.domains.includes(activeDomain));
  const progName = (id?: string) => (id ? FUNDING.find(f => f.id === id)?.name?.split(" — ")[0] : null);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 26, marginTop: 8, ...HEEBO }}>תחומים ← תארים ← מוסדות</div>
          <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7 }}>
            {items.length} תארים · הסימון "מומלץ ב-" זורם ישירות למסך שהמועמד רואה
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {[["/admin/institutions", "מוסדות"], ["/admin/scholarships", "מלגות"], ["/admin/courses", "קורסים"]].map(([h, l]) => (
              <Link key={h} href={h} style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.14)", color: "#fff" }}>{l}</Link>
            ))}
            <button onClick={exportJson} style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, border: "none", background: ORANGE, color: "#fff", cursor: "pointer" }}>
              ייצוא JSON
            </button>
            {dirty && (
              <button onClick={() => { localStorage.removeItem(STORE_KEY); setItems(DEGREES); setDirty(false); flash("שוחזר"); }}
                style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", cursor: "pointer" }}>
                שחזור
              </button>
            )}
          </div>
        </div>
      </div>

      {/* טאבי תחומים + מתג תצוגה */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "10px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 9, background: "rgba(0,0,0,0.05)", marginLeft: 10 }}>
            {([["list", "רשימה"], ["diagram", "תרשים"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  fontSize: 12, fontWeight: 700, padding: "5px 13px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: view === v ? "#fff" : "transparent",
                  color: view === v ? NAVY : "rgba(0,0,0,0.5)",
                  boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}>
                {l}
              </button>
            ))}
          </div>
          {view === "list" && DOMAINS.map(d => (
            <button key={d} onClick={() => setActiveDomain(d)}
              style={{
                fontSize: 12.5, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: activeDomain === d ? NAVY : "rgba(0,0,0,0.05)",
                color: activeDomain === d ? "#fff" : "rgba(0,0,0,0.6)",
              }}>
              {DOMAIN_LABEL[d]} ({items.filter(x => x.domains.includes(d)).length})
            </button>
          ))}
        </div>
      </div>

      {view === "diagram" && <DegreeDiagram items={items} />}

      {view === "list" && (
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px 60px", display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* עמודה ראשית: התארים של התחום */}
        <div style={{ flex: 2, minWidth: 400, display: "flex", flexDirection: "column", gap: 12 }}>
          {domainDegrees.length === 0 && (
            <div style={{ padding: 26, textAlign: "center", color: "rgba(0,0,0,0.4)", fontSize: 13.5, background: "#fff", borderRadius: 14 }}>
              אין תארים ממופים לתחום הזה — וזה כבר ממצא: לתחום {DOMAIN_LABEL[activeDomain]} אין כרגע מסלול אקדמי ברור אצלנו.
            </div>
          )}
          {domainDegrees.map(d => {
            const bar = ENTRY_LABEL[d.entryBar];
            return (
              <div key={d.id} style={{ background: "#fff", borderRadius: 14, border: d.recommended ? "1.5px solid rgba(251,133,0,0.4)" : "1px solid rgba(0,0,0,0.08)", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>{d.kind}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: `${bar.color}14`, color: bar.color }}>{bar.label}</span>
                  {d.recommended && <span style={{ fontSize: 10.5, color: "#b45309", fontWeight: 700 }}>✦ המלצת האפליקציה</span>}
                </div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", marginTop: 5 }}>
                  {d.salary ? `${d.salary.toLocaleString("he-IL")} ₪ · ` : ""}{d.employment ? `${d.employment}% מועסקים · ` : ""}{d.inTech ? `${d.inTech}% בטק` : ""}
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.6)", marginTop: 6, lineHeight: 1.65 }}>{d.leadsTo}</div>

                {/* המוסדות המומלצים — הסימון של נתי */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "rgba(0,0,0,0.5)", marginBottom: 7 }}>
                    מומלץ ללמוד ב- <span style={{ fontWeight: 400 }}>(לחיצה מסמנת · זה מה שהמועמד יראה)</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {degreeInsts.map(inst => {
                      const on = d.recommendedAt?.includes(inst.id);
                      return (
                        <button key={inst.id} onClick={() => toggleInst(d.id, inst.id)}
                          title={inst.programId ? `דלת: ${progName(inst.programId)}` : undefined}
                          style={{
                            fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 99, cursor: "pointer",
                            border: on ? "none" : "1px solid rgba(0,0,0,0.13)",
                            background: on ? "#047857" : "#fff",
                            color: on ? "#fff" : "rgba(0,0,0,0.55)",
                          }}>
                          {inst.name.split(" — ")[0]}
                          {inst.relationship === "partner" ? " ★" : ""}
                        </button>
                      );
                    })}
                  </div>
                  {(d.recommendedAt?.length ?? 0) === 0 && (
                    <div style={{ fontSize: 11, color: "#92400e", marginTop: 6 }}>
                      עוד לא סומן — המועמד רואה את התואר בלי המלצת מוסד.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* עמודת צד: מוסדות התואר, עם הדלת והקשר — ההקשר לסימון */}
        <div style={{ flex: 1, minWidth: 260, position: "sticky", top: 64 }}>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", padding: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: NAVY, marginBottom: 10 }}>
              מוסדות התואר ({degreeInsts.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto" }}>
              {degreeInsts.map(inst => (
                <div key={inst.id} style={{ padding: "8px 10px", borderRadius: 10, background: "#fcfbf9", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1c1a16" }}>
                    {inst.name}
                    {inst.relationship === "partner" && <span style={{ color: "#047857" }}> ★</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: "rgba(0,0,0,0.45)", marginTop: 2, lineHeight: 1.5 }}>
                    {inst.location}
                    {inst.programId && <> · דלת: <b style={{ color: "#b45309" }}>{progName(inst.programId)}</b></>}
                    {inst.status === "needs-check" && " · ⚠️ לא אומת"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 22, insetInline: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 99 }}>{toast}</div>
        </div>
      )}
    </div>
  );
}


// ─── תרשים — תחומים ← תארים ──────────────────────────────────────────────────

const DOMAIN_COLOR: Record<Domain, string> = {
  data: "#0d9488", code: "#3b82f6", cyber: "#dc2626", networks: "#2563eb",
  ai: "#7c3aed", ux: "#db2777", marketing: "#f97316",
};

/**
 * תרשים דו-צדדי: תחומים בימין (כיוון הקריאה), תארים בשמאל, קשת לכל שיוך.
 *
 * מה שהתרשים חושף והרשימה מסתירה:
 * 1. **רוחב התואר** — תואר שמזין 4 תחומים (מערכות מידע הנדסית) שווה יותר
 *    למי שעוד מתלבט מאשר תואר צר. ברשימה זה בלתי נראה.
 * 2. **תחומים דלים** — UX ושיווק כמעט בלי קשתות: החורים האקדמיים שלנו, בקול.
 * לחיצה על צומת מדגישה רק את הקשתות שלו.
 */
function DegreeDiagram({ items }: { items: Degree[] }) {
  const [focus, setFocus] = useState<string | null>(null);

  const active = items.filter(d => d.status === "active");
  const W = 1040, ROW_D = 92, ROW_G = 64, TOP = 46;
  const H = Math.max(DOMAINS.length * ROW_D, active.length * ROW_G) + TOP + 40;
  const domY = (i: number) => TOP + i * ROW_D + 20;
  const degY = (i: number) => TOP + i * ROW_G + 20;
  const DOM_X = W - 190, DEG_X = 240;

  const isDim = (dom: Domain, degId: string) =>
    focus !== null && focus !== dom && focus !== degId;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px 60px" }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)", padding: 16, overflowX: "auto" }}>
        <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginBottom: 6 }}>
          עובי הקשת = ✦ מומלץ · לחיצה על תחום או תואר מדגישה את הקשרים שלו · תחום בלי קשתות = חור אקדמי
        </div>
        <svg width={W} height={H} style={{ minWidth: W, display: "block" }} direction="ltr">
          {/* קשתות */}
          {active.map((d, di) =>
            d.domains.map(dom => {
              const domI = DOMAINS.indexOf(dom);
              if (domI < 0) return null;
              const y1 = domY(domI), y2 = degY(di);
              const dim = isDim(dom, d.id);
              return (
                <path
                  key={d.id + dom}
                  d={`M ${DOM_X} ${y1} C ${DOM_X - 160} ${y1}, ${DEG_X + 160} ${y2}, ${DEG_X} ${y2}`}
                  fill="none"
                  stroke={DOMAIN_COLOR[dom]}
                  strokeWidth={d.recommended ? 3 : 1.5}
                  opacity={dim ? 0.06 : d.recommended ? 0.75 : 0.4}
                />
              );
            })
          )}

          {/* תחומים — ימין */}
          {DOMAINS.map((dom, i) => {
            const n = active.filter(d => d.domains.includes(dom)).length;
            const dim = focus !== null && focus !== dom &&
              !active.some(d => d.id === focus && d.domains.includes(dom));
            // (תחום מודגש אם הוא בפוקוס, או אם התואר שבפוקוס מזין אותו)
            return (
              <g key={dom} opacity={dim ? 0.25 : 1} style={{ cursor: "pointer" }}
                onClick={() => setFocus(focus === dom ? null : dom)}>
                <rect x={DOM_X} y={domY(i) - 20} width={168} height={44} rx={12}
                  fill={n === 0 ? "#fff" : DOMAIN_COLOR[dom]}
                  stroke={DOMAIN_COLOR[dom]} strokeWidth={1.5}
                  strokeDasharray={n === 0 ? "5 4" : undefined} />
                <text x={DOM_X + 84} y={domY(i) - 1} textAnchor="middle" fontSize={13.5} fontWeight={800}
                  fill={n === 0 ? DOMAIN_COLOR[dom] : "#fff"} fontFamily="'Heebo', sans-serif">
                  {DOMAIN_LABEL[dom]}
                </text>
                <text x={DOM_X + 84} y={domY(i) + 15} textAnchor="middle" fontSize={10}
                  fill={n === 0 ? "#b91c1c" : "rgba(255,255,255,0.8)"} fontFamily="'Heebo', sans-serif" fontWeight={700}>
                  {n === 0 ? "אין מסלול אקדמי ממופה!" : `${n} תארים`}
                </text>
              </g>
            );
          })}

          {/* תארים — שמאל */}
          {active.map((d, i) => {
            const focusIsDomain = (DOMAINS as string[]).includes(focus ?? "");
            const dim = focus !== null && focus !== d.id &&
              (!focusIsDomain || !d.domains.includes(focus as Domain));
            const bar = ENTRY_LABEL[d.entryBar];
            const marked = d.recommendedAt?.length ?? 0;
            return (
              <g key={d.id} opacity={dim ? 0.25 : 1} style={{ cursor: "pointer" }}
                onClick={() => setFocus(focus === d.id ? null : d.id)}>
                <rect x={10} y={degY(i) - 22} width={DEG_X - 10} height={48} rx={12}
                  fill="#fff" stroke={d.recommended ? ORANGE : "rgba(0,0,0,0.15)"} strokeWidth={d.recommended ? 2 : 1} />
                <text x={DEG_X - 12} y={degY(i) - 4} textAnchor="end" fontSize={12.5} fontWeight={800}
                  fill={NAVY} fontFamily="'Heebo', sans-serif" direction="rtl">
                  {d.recommended ? "✦ " : ""}{d.name}
                </text>
                <text x={DEG_X - 12} y={degY(i) + 14} textAnchor="end" fontSize={9.5}
                  fill="rgba(0,0,0,0.45)" fontFamily="'Heebo', sans-serif" direction="rtl">
                  {d.salary ? `${(d.salary / 1000).toFixed(1)}K ₪ · ` : ""}{bar.label}
                  {marked > 0 ? ` · ${marked} מוסדות סומנו` : " · טרם סומן מוסד"}
                </text>
                <circle cx={22} cy={degY(i) + 2} r={5} fill={bar.color} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function GatedPage() {
  return <AdminGate><AdminDegreesPage /></AdminGate>;
}
