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

const DOMAINS: Domain[] = ["data", "code", "cyber", "networks", "ai", "ux", "marketing", "qa"];

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


// ─── תרשים — תחום נפתח לתארים שלו ────────────────────────────────────────────

const DOMAIN_COLOR: Record<Domain, string> = {
  data: "#0d9488", code: "#3b82f6", cyber: "#dc2626", networks: "#2563eb",
  ai: "#7c3aed", ux: "#db2777", marketing: "#f97316", qa: "#d97706",
};

/**
 * חשיפה הדרגתית במקום ספגטי: כל שבעת התחומים גלויים תמיד, ולחיצה על תחום
 * פורשת מתחתיו — עם קווי חיבור — רק את התארים שמובילים אליו.
 * תחום ריק מסומן במסגרת מקווקוות: חור אקדמי, לא באג.
 */
function DegreeDiagram({ items }: { items: Degree[] }) {
  const [selected, setSelected] = useState<Domain>("data");
  const active = items.filter(d => d.status === "active");
  const degrees = active.filter(d => d.domains.includes(selected));
  const color = DOMAIN_COLOR[selected];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px 60px" }}>
      {/* שורת התחומים — כולם, תמיד */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {DOMAINS.map(dom => {
          const n = active.filter(d => d.domains.includes(dom)).length;
          const on = selected === dom;
          return (
            <button key={dom} onClick={() => setSelected(dom)}
              style={{
                padding: "12px 18px", borderRadius: 14, cursor: "pointer", minWidth: 118,
                border: n === 0 ? `2px dashed ${DOMAIN_COLOR[dom]}` : "none",
                background: n === 0 ? "#fff" : on ? DOMAIN_COLOR[dom] : `${DOMAIN_COLOR[dom]}1a`,
                color: n === 0 ? DOMAIN_COLOR[dom] : on ? "#fff" : DOMAIN_COLOR[dom],
                boxShadow: on ? `0 6px 18px ${DOMAIN_COLOR[dom]}55` : "none",
                transform: on ? "translateY(-2px)" : "none",
                transition: "all .15s",
              }}>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Heebo', sans-serif" }}>{DOMAIN_LABEL[dom]}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 2, opacity: 0.85 }}>
                {n === 0 ? "אין מסלול אקדמי!" : `${n} תארים`}
              </div>
            </button>
          );
        })}
      </div>

      {/* מניפת התארים של התחום הנבחר */}
      {degrees.length === 0 ? (
        <div style={{ marginTop: 30, textAlign: "center", padding: 26, background: "#fff", borderRadius: 16, border: `2px dashed ${color}`, color, fontSize: 14, fontWeight: 700 }}>
          לתחום {DOMAIN_LABEL[selected]} אין תארים ממופים — זה החור האקדמי שלנו, וזו משימת מחקר.
        </div>
      ) : (
        <div style={{ position: "relative", marginTop: 8 }}>
          {/* קווי החיבור — גזע ומזלג */}
          <svg width="100%" height="46" style={{ display: "block" }}>
            <line x1="50%" y1="0" x2="50%" y2="18" stroke={color} strokeWidth="2.5" />
            <line x1={degrees.length === 1 ? "50%" : "12%"} y1="18" x2={degrees.length === 1 ? "50%" : "88%"} y2="18" stroke={color} strokeWidth="2" opacity="0.55" />
            {degrees.map((_, i) => {
              const n = degrees.length;
              const x = n === 1 ? 50 : 12 + (i * 76) / (n - 1);
              return <line key={i} x1={`${x}%`} y1="18" x2={`${x}%`} y2="46" stroke={color} strokeWidth="2" opacity="0.55" />;
            })}
          </svg>

          <div style={{
            display: "grid", gap: 12,
            gridTemplateColumns: `repeat(${Math.min(degrees.length, 4)}, minmax(0, 1fr))`,
          }}>
            {degrees.map(d => {
              const bar = ENTRY_LABEL[d.entryBar];
              const marked = d.recommendedAt?.length ?? 0;
              return (
                <div key={d.id} style={{
                  background: "#fff", borderRadius: 14, padding: 14,
                  border: d.recommended ? `2px solid ${ORANGE}` : "1px solid rgba(0,0,0,0.1)",
                  borderTop: `3px solid ${color}`,
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, lineHeight: 1.35 }}>
                    {d.recommended ? "✦ " : ""}{d.name}
                    <span style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", fontWeight: 400 }}> {d.kind}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 8, fontSize: 11 }}>
                    {d.salary && <span><b style={{ fontSize: 13, color: "#1c1a16" }}>{(d.salary / 1000).toFixed(1)}K ₪</b> <span style={{ color: "rgba(0,0,0,0.4)" }}>שכר</span></span>}
                    {d.inTech && <span><b style={{ fontSize: 13, color: d.inTech >= 60 ? "#047857" : "#1c1a16" }}>{d.inTech}%</b> <span style={{ color: "rgba(0,0,0,0.4)" }}>בטק</span></span>}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${bar.color}14`, color: bar.color }}>{bar.label}</span>
                  </div>
                  <div style={{ fontSize: 10.5, marginTop: 8, color: marked ? "#047857" : "#92400e", fontWeight: 700 }}>
                    {marked ? `✓ ${marked} מוסדות סומנו` : "טרם סומן מוסד"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* תארים רחבים — הבונוס של התצוגה */}
          <div style={{ marginTop: 14, fontSize: 11.5, color: "rgba(0,0,0,0.5)", lineHeight: 1.7, background: "#fff", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(0,0,0,0.06)" }}>
            <b>תארים רחבים</b> (פותחים גם תחומים אחרים — ביטוח למי שמתלבט):{" "}
            {degrees.filter(d => d.domains.length >= 3).map(d => `${d.name} (${d.domains.length} תחומים)`).join(" · ") || "אין בתחום הזה"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GatedPage() {
  return <AdminGate><AdminDegreesPage /></AdminGate>;
}
