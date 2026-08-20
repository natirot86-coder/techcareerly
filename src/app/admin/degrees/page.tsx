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
  const [view, setView] = useState<"map3" | "matrix" | "list">("map3");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        /*
         * מיזוג, לא החלפה — אותו תיקון כמו בלוח המוסדות (20.8): טיוטה ישנה
         * דרסה את רשימת הקוד, ולכן תואר חדש שנכנס בקוד לא הופיע למי שערך פעם.
         * הבסיס תמיד הקוד הטרי; עריכות מקומיות יושבות עליו לפי id.
         */
        const stored: Degree[] = JSON.parse(saved);
        const editedById = new Map(stored.map(d => [d.id, d]));
        const codeIds = new Set(DEGREES.map(d => d.id));
        setItems([
          ...DEGREES.map(d => editedById.get(d.id) ?? d),
          ...stored.filter(d => !codeIds.has(d.id)),
        ]);
        setDirty(true);
      }
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
            {([["map3", "מיפוי"], ["matrix", "מטריצת כיסוי"], ["list", "עריכת תארים"]] as const).map(([v, l]) => (
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

      {view === "map3" && <Level3 items={items} onToggle={toggleInst} />}

      {view === "matrix" && <CoverageMatrix degrees={items} />}

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
                          title={inst.programIds?.length ? `דלתות: ${inst.programIds.map(progName).filter(Boolean).join(" · ")}` : undefined}
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
                    {inst.programIds?.length ? <> · {inst.programIds.length > 1 ? "דלתות" : "דלת"}: <b style={{ color: "#b45309" }}>{inst.programIds.map(progName).filter(Boolean).join(" · ")}</b></> : null}
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


// ─── רמה 3 — מוסדות ותוכניות של תואר נבחר (handoff 1a) ──────────────────────

const DOMAIN_COLOR: Record<Domain, string> = {
  data: "#0d9488", code: "#3b82f6", cyber: "#dc2626", networks: "#2563eb",
  ai: "#7c3aed", ux: "#db2777", marketing: "#f97316", qa: "#d97706",
};

const ENTRY_PILL: Record<string, { bg: string; fg: string }> = {
  low: { bg: "#e6f4ef", fg: "#059669" },
  medium: { bg: "#fdf1de", fg: "#b45309" },
  high: { bg: "#fbeaea", fg: "#dc2626" },
};

/**
 * הגישה שנבחרה ב-handoff: פרישה בתוך הדף. תחומים ← רשת תארים ← פאנל שמתמזג
 * עם כרטיס התואר הנבחר. ארבע קבוצות מוסדות, מהדלת החזקה לחלשה, מוסד מופיע
 * פעם אחת בלבד והחפיפות הופכות לתגים.
 *
 * התאמות מההחלטה המשותפת (16.8):
 * - ★ רק ל-partner — "דיברנו" לא מקנה כוכב
 * - קבוצה 4 נשענת על institution.degreeIds (המיפוי הבוליאני החדש); מוסד
 *   בלי מיפוי אך עם חפיפת תחום מוצג עם "לא מופה" — ריק אינו "לא מלמד"
 * - "אמת מול המוסד" מוסיף 📞 להערות בטיוטת לוח המלגות — נכנס לרשימת הטלפונים
 * - שמירה: localStorage + ייצוא JSON, כמו כל הלוחות, עד שיש שרת
 */
function Level3({ items, onToggle }: { items: Degree[]; onToggle: (degreeId: string, instId: string) => void }) {
  const [domain, setDomain] = useState<Domain>("data");
  const [degreeId, setDegreeId] = useState<string | null>(null);

  const color = DOMAIN_COLOR[domain];
  const degrees = items.filter(d => d.status === "active" && d.domains.includes(domain));
  const selected = degrees.find(d => d.id === degreeId) ?? null;

  return (
    <div style={{ maxWidth: 1100, margin: "16px auto 60px", padding: "0 24px" }}>
      <div style={{ background: "#f5f3ef", border: "1px solid #ddd8cf", borderRadius: 14, padding: 22 }}>

        {/* רמה 1 — תחומים */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DOMAINS.map(dom => {
            const n = items.filter(x => x.status === "active" && x.domains.includes(dom)).length;
            const on = domain === dom;
            return (
              <button key={dom} onClick={() => { setDomain(dom); setDegreeId(null); }}
                style={{
                  padding: "8px 14px", borderRadius: 9, fontSize: 13, border: "none", cursor: "pointer",
                  fontWeight: on ? 700 : 500, fontFamily: "'Heebo', sans-serif",
                  background: on ? DOMAIN_COLOR[dom] : `${DOMAIN_COLOR[dom]}1a`,
                  color: on ? "#fff" : DOMAIN_COLOR[dom],
                }}>
                {DOMAIN_LABEL[dom]}{n === 0 ? " · אין תארים ממופים" : ""}
              </button>
            );
          })}
        </div>

        {/* רמה 2 — רשת תארים */}
        {degrees.length === 0 ? (
          <div style={{ marginTop: 18, textAlign: "center", padding: 22, borderRadius: 12, border: `2px dashed ${color}`, color, fontSize: 14, fontWeight: 700, background: "#fff" }}>
            אין תארים ממופים לתחום {DOMAIN_LABEL[domain]} — זה ממצא, לא באג. משימת מחקר.
          </div>
        ) : (
          <>
            {/*
              הפאנל נפתח מתחת ל**שורה** של הכרטיס הנבחר, לא מתחת לכל הרשת.

              זה הלב של גישה 1a: הכרטיס הנבחר מתמזג ויזואלית עם הפאנל —
              פינות עליונות מעוגלות ובלי גבול תחתון. במוקאפ היו בדיוק ארבעה
              תארים, כלומר שורה אחת, ולכן זה עבד מעצמו. בנתונים האמיתיים יש
              7–10 תארים לתחום, והפאנל נפל מתחת לשורה השנייה — כך שהכרטיס
              הנבחר והפאנל היו מנותקים והחיבור החזותי, שהוא כל הרעיון, אבד.
            */}
            {Array.from({ length: Math.ceil(degrees.length / 4) },
              (_, ri) => degrees.slice(ri * 4, ri * 4 + 4)).map((row, ri) => (
              <div key={ri}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: ri === 0 ? 16 : 12 }}>
                  {row.map(d => {
              const on = degreeId === d.id;
              const ep = ENTRY_PILL[d.entryBar];
              const marked = d.recommendedAt?.length ?? 0;
              return (
                <button key={d.id} onClick={() => setDegreeId(on ? null : d.id)}
                  style={{
                    textAlign: "right", cursor: "pointer", padding: "14px 16px",
                    background: "#fff", fontFamily: "'Heebo', sans-serif",
                    border: on ? `2px solid ${color}` : "1px solid #e4dfd6",
                    borderBottom: on ? "none" : undefined,
                    borderRadius: on ? "12px 12px 0 0" : 12,
                    opacity: degreeId && !on ? 0.6 : 1,
                    boxShadow: on ? "0 2px 10px rgba(2,62,138,0.08)" : "none",
                  }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                    {d.recommended ? "✦ " : ""}{d.name}
                    <span style={{ fontSize: 12, color: "#8a877f", fontWeight: 400 }}> {d.kind}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#5c5a55", marginTop: 4 }}>
                    {d.salary ? `${(d.salary / 1000).toFixed(1)}K ₪ שכר · ` : ""}
                    {d.inTech ? <b style={{ color: "#059669" }}>{d.inTech}% בטק</b> : null}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, padding: "3px 9px", borderRadius: 999, background: ep.bg, color: ep.fg }}>
                      {ENTRY_LABEL[d.entryBar].label}
                    </span>
                    {marked > 0
                      ? <span style={{ fontSize: 12, padding: "3px 9px", borderRadius: 999, background: "#e6f4ef", color: "#059669", fontWeight: 700 }}>{marked} מוסדות סומנו</span>
                      : <span style={{ fontSize: 12, color: "#fb8500", fontWeight: 700 }}>טרם סומן מוסד</span>}
                  </div>
                </button>
              );
                  })}
                </div>
                {selected && row.some(d => d.id === selected.id) && (
                  <ExpansionPanel degree={selected} color={color} onToggle={onToggle} />
                )}
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}

type Row = {
  inst: (typeof INSTITUTIONS)[number];
  group: 1 | 2 | 3 | 4;
  program?: (typeof FUNDING)[number];
  unmappedOffering?: boolean;
  mappedElsewhere?: boolean;
};

function ExpansionPanel({ degree, color, onToggle }: {
  degree: Degree; color: string; onToggle: (degreeId: string, instId: string) => void;
}) {
  /*
   * שאלת נתי (16.8): "אז כל מוסד לא-ממופה יוצג בכל תואר?"
   * התשובה: הוא זכאי להופיע (ריק = לא יודעים, לא "לא מלמד") — אבל לא להציף.
   * מי שאומת שמלמד את התואר מוצג תמיד; הלא-ממופים מאחורי קיפול שנוקב במספרם.
   * ככל שממפים — הרעש קטן, והקיפול עצמו הוא תזכורת למפות.
   */
  const [showUnmapped, setShowUnmapped] = useState(false);
  /** בניית ארבע הקבוצות — נגזרת, לא state */
  const rows: Row[] = [];
  for (const inst of INSTITUTIONS) {
    if (inst.status === "hidden" || inst.track !== "degree") continue;
    const offersMapped = (inst.degreeIds?.length ?? 0) > 0;
    const offersThis = inst.degreeIds?.includes(degree.id) ?? false;
    const domainOverlap = inst.domains.some(dm => degree.domains.includes(dm));
    // מוסד רלוונטי: מלמד את התואר, או שאין מיפוי אבל יש חפיפת תחום
    if (offersMapped && !offersThis) continue;
    if (!offersMapped && !domainOverlap) continue;

    const program = (inst.programIds ?? []).map(id => FUNDING.find(f => f.id === id)).find(Boolean);
    const progOpen = program?.degreeIds?.includes(degree.id) ?? false;
    const progUnmapped = !!program && (program.degreeIds?.length ?? 0) === 0;
    const mappedElsewhere = !!program && (program.degreeIds?.length ?? 0) > 0 && !progOpen;
    const partner = inst.relationship === "partner" || program?.relationship === "partner";

    const group: Row["group"] = progOpen ? 1 : progUnmapped ? 2 : partner ? 3 : 4;
    rows.push({ inst, group, program, unmappedOffering: !offersMapped, mappedElsewhere });
  }
  rows.sort((a, b) => a.group - b.group);

  const marked = new Set(degree.recommendedAt ?? []);
  const g = (n: Row["group"]) => rows.filter(r => r.group === n);

  const MarkBtn = ({ instId }: { instId: string }) => {
    const on = marked.has(instId);
    return (
      <button onClick={() => onToggle(degree.id, instId)}
        style={{
          fontSize: 13, padding: "7px 13px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap",
          fontFamily: "'Heebo', sans-serif", alignSelf: "flex-start", flexShrink: 0,
          background: on ? "#059669" : "#fff",
          border: on ? "1px solid #059669" : "1px solid #ddd8cf",
          color: on ? "#fff" : NAVY, fontWeight: on ? 700 : 500,
        }}>
        {on ? "✓ מסומן" : "סמן כמומלץ"}
      </button>
    );
  };

  const Tags = ({ r }: { r: Row }) => (
    <span style={{ display: "inline-flex", gap: 6, marginRight: 8 }}>
      {(r.inst.relationship === "partner" || r.program?.relationship === "partner") && r.group !== 3 && (
        <span style={{ background: "#eaf0f8", color: NAVY, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>★ קשר ישיר</span>
      )}
      {r.mappedElsewhere && (
        <span style={{ background: "#f4f1ea", color: "#8a877f", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>התוכנית מופתה לתארים אחרים</span>
      )}
      {r.unmappedOffering && (
        <span style={{ background: "#fff7ed", color: "#b45309", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>לא אומת שמלמד את התואר</span>
      )}
    </span>
  );

  const GroupHead = ({ title, count, muted }: { title: string; count: number; muted?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 900, color: muted ? "#8a877f" : NAVY }}>{title}</span>
      <span style={{ fontSize: 12.5, color: "#8a877f" }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: "#eae5dc" }} />
    </div>
  );

  /** "אמת מול המוסד" — נרשם כ-📞 בטיוטת המלגות ונכנס לרשימת הטלפונים */
  function requestVerification(programId: string) {
    try {
      const KEY = "admin-scholarships-draft";
      const items = JSON.parse(localStorage.getItem(KEY) ?? "null") ?? FUNDING;
      const next = items.map((f: { id: string; notes?: string }) => f.id === programId
        ? { ...f, notes: `${f.notes ?? ""} 📞 לאמת: האם התוכנית פתוחה לתואר ${degree.name}.`.trim() }
        : f);
      localStorage.setItem(KEY, JSON.stringify(next));
      alert("נוסף לרשימת הטלפונים בלוח המלגות 📞");
    } catch { /* ignore */ }
  }

  return (
    <div style={{ background: "#fff", border: `2px solid ${color}`, borderRadius: "0 0 12px 12px", padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 20, marginTop: -1 }}>
      {rows.length === 0 && (
        <div style={{ textAlign: "center", color: "#fb8500", fontWeight: 700, fontSize: 14, padding: 10 }}>
          טרם סומן מוסד לתואר הזה
        </div>
      )}

      {g(1).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GroupHead title="תוכניות פתוחות לתואר הזה" count={g(1).length} />
          {g(1).map(r => (
            <div key={r.inst.id} style={{ border: "1px solid #cfe8e2", background: "#f4fbf9", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: NAVY }}>
                  <b>{r.inst.name.split(" — ")[0]}</b> · {r.program!.name.split(" — ")[0]}
                  <Tags r={r} />
                </div>
                <div style={{ fontSize: 13, color: "#5c5a55", marginTop: 3 }}>
                  {(r.program!.covers ?? []).slice(0, 3).join(" · ") || r.program!.what} — התוכנית מופתה לתואר הזה
                </div>
              </div>
              <MarkBtn instId={r.inst.id} />
            </div>
          ))}
        </div>
      )}

      {g(2).length > 0 && (
        <div style={{ border: "1px dashed #fb8500", background: "#fff7ed", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#b45309" }}>⚠️ תוכניות שלא אומתו לתואר הזה — {g(2).length}</div>
          <div style={{ fontSize: 13, color: "#7c4a11", lineHeight: 1.55 }}>
            המוסד רלוונטי, אבל לא סומן לאילו תארים התוכנית פתוחה. לא ידוע שהיא פתוחה לתואר הזה, ולא ידוע שהיא סגורה.
          </div>
          {g(2).map(r => (
            <div key={r.inst.id} style={{ background: "#fff", border: "1px solid #f5d8b3", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, color: NAVY }}><b>{r.inst.name.split(" — ")[0]}</b> · {r.program!.name.split(" — ")[0]}<Tags r={r} /></div>
                <div style={{ fontSize: 12.5, color: "#b45309", marginTop: 2 }}>לא אומת לתואר הזה</div>
              </div>
              <button onClick={() => requestVerification(r.program!.id)}
                style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 8, border: "1px solid #fb8500", color: "#b45309", background: "#fff", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Heebo', sans-serif" }}>
                אמת מול המוסד
              </button>
              <MarkBtn instId={r.inst.id} />
            </div>
          ))}
        </div>
      )}

      {g(3).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GroupHead title="★ קשר ישיר לעמותה — ללא תוכנית ייעודית" count={g(3).length} />
          {g(3).map(r => (
            <div key={r.inst.id} style={{ border: "1px solid #e4dfd6", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 15, color: NAVY }}>
                ★ <b>{r.inst.name.split(" — ")[0]}</b>
                <span style={{ fontSize: 13, color: "#8a877f" }}> · ללא תוכנית ייעודית</span>
                <Tags r={r} />
              </div>
              <MarkBtn instId={r.inst.id} />
            </div>
          ))}
        </div>
      )}

      {g(4).length > 0 && (() => {
        const verified = g(4).filter(r => !r.unmappedOffering);
        const unmapped = g(4).filter(r => r.unmappedOffering);
        const shown4 = showUnmapped ? g(4) : verified;
        return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GroupHead title="עוד מוסדות שמלמדים את התואר" count={verified.length} muted />
          {unmapped.length > 0 && (
            <button onClick={() => setShowUnmapped(!showUnmapped)}
              style={{ alignSelf: "flex-start", fontSize: 12.5, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px dashed #ddd8cf", background: "#fff", color: "#8a877f", cursor: "pointer", fontFamily: "'Heebo', sans-serif" }}>
              {showUnmapped ? "להסתיר" : "להציג"} עוד {unmapped.length} מוסדות בתחום שטרם מופו התארים שלהם
            </button>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {shown4.map(r => (
              <div key={r.inst.id} style={{ border: "1px solid #eae5dc", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#3c3a36" }}>
                  {r.inst.name.split(" — ")[0]}
                  <Tags r={r} />
                </div>
                <MarkBtn instId={r.inst.id} />
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      <div style={{ fontSize: 12, color: "#8a877f", lineHeight: 1.6 }}>
        בכנות: {degree.caveat}
      </div>
    </div>
  );
}


// ─── מטריצת הכיסוי — מה מופה ומה לא, במבט אחד ────────────────────────────────

/**
 * שורת מוסד × עמודת תואר. לחיצה על תא הופכת "מלמד"/"לא מופה" — ונשמרת
 * לטיוטת לוח המוסדות (admin-institutions-draft), כך שהייצוא זורם מאותו
 * מקום כמו כל עריכה אחרת.
 *
 * זה מסך העבודה של המיפוי הבוליאני: יושבים מול קטלוג המוסד, ומדליקים תאים.
 * שורה בלי אף תא = מוסד שלא מופה, והוא זה שמנפח את הקיפול ברמה 3.
 */
function CoverageMatrix({ degrees }: { degrees: Degree[] }) {
  const [insts, setInsts] = useState(() => INSTITUTIONS.filter(i => i.track === "degree" && i.status !== "hidden"));

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin-institutions-draft");
      if (saved) {
        const draft = JSON.parse(saved) as typeof INSTITUTIONS;
        setInsts(draft.filter(i => i.track === "degree" && i.status !== "hidden"));
      }
    } catch { /* ignore */ }
  }, []);

  function toggleCell(instId: string, degId: string) {
    setInsts(prev => {
      const next = prev.map(i => {
        if (i.id !== instId) return i;
        const cur = i.degreeIds ?? [];
        return { ...i, degreeIds: cur.includes(degId) ? cur.filter(x => x !== degId) : [...cur, degId] };
      });
      // שמירה לטיוטה המלאה — כולל מוסדות שאינם בתצוגה
      try {
        const saved = localStorage.getItem("admin-institutions-draft");
        const full = saved ? (JSON.parse(saved) as typeof INSTITUTIONS) : INSTITUTIONS;
        const merged = full.map(f => next.find(n => n.id === f.id) ?? f);
        localStorage.setItem("admin-institutions-draft", JSON.stringify(merged));
      } catch { /* ignore */ }
      return next;
    });
  }

  const degs = degrees.filter(d => d.status === "active");
  const unmapped = insts.filter(i => (i.degreeIds?.length ?? 0) === 0).length;

  return (
    <div style={{ maxWidth: 1100, margin: "16px auto 60px", padding: "0 24px" }}>
      <div style={{ background: "#fff", border: "1px solid #ddd8cf", borderRadius: 14, padding: 18, overflowX: "auto" }}>
        <div style={{ fontSize: 12.5, color: "#5c5a55", marginBottom: 12, lineHeight: 1.6 }}>
          לחיצה על תא = המוסד מלמד את התואר · נשמר לטיוטת לוח המוסדות (ייצוא משם) ·
          <b style={{ color: unmapped ? "#b45309" : "#059669" }}> {unmapped} מוסדות עדיין בלי אף מיפוי</b>
        </div>
        <table style={{ borderCollapse: "collapse", minWidth: 900, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 12, color: "#8a877f", fontWeight: 700 }}>מוסד</th>
              {degs.map(d => (
                <th key={d.id} style={{ padding: "6px 4px", fontSize: 10.5, color: NAVY, fontWeight: 700, maxWidth: 76 }}>
                  {d.recommended ? "✦ " : ""}{d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {insts.map(inst => {
              const empty = (inst.degreeIds?.length ?? 0) === 0;
              return (
                <tr key={inst.id} style={{ background: empty ? "#fff7ed" : undefined }}>
                  <td style={{ padding: "5px 8px", fontSize: 12.5, fontWeight: 700, color: empty ? "#b45309" : "#3c3a36", whiteSpace: "nowrap", borderTop: "1px solid #eae5dc" }}>
                    {inst.name.split(" — ")[0]}
                    {inst.relationship === "partner" ? " ★" : ""}
                    {empty ? " · לא מופה" : ""}
                  </td>
                  {degs.map(d => {
                    const on = inst.degreeIds?.includes(d.id) ?? false;
                    return (
                      <td key={d.id} style={{ borderTop: "1px solid #eae5dc", textAlign: "center", padding: 2 }}>
                        <button onClick={() => toggleCell(inst.id, d.id)}
                          aria-label={`${inst.name} — ${d.name}`}
                          style={{
                            width: 30, height: 26, borderRadius: 7, cursor: "pointer",
                            border: on ? "1px solid #059669" : "1px solid #e4dfd6",
                            background: on ? "#059669" : "#fff",
                            color: "#fff", fontSize: 13, fontWeight: 800,
                          }}>
                          {on ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GatedPage() {
  return <AdminGate><AdminDegreesPage /></AdminGate>;
}
