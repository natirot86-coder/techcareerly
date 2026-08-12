/**
 * /admin/scholarships — לוח המלגות והתוכניות.
 *
 * מקביל ל-/admin/institutions, ובכוונה: אותו מנגנון אישור, אותו ייצוא JSON,
 * אותה אזהרה. ⚠️ אין בקאנד — עריכות נשמרות ב-localStorage של הדפדפן הזה בלבד.
 * כדי שהשינוי יעלה לאפליקציה — מייצאים JSON ומחזירים אותו ל-src/data/scholarships.ts
 *
 * הפרדה מכוונת: **מוסד** הוא איפה לומדים, **תוכנית** היא ממה מתפרנסים.
 * רייכמן מוסד, קרן אור תוכנית. תל אביב מוסד, אדמאס תוכנית.
 */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FUNDING, KIND_LABEL, type Funding, type FundingKind } from "@/data/scholarships";
import { INSTITUTIONS } from "@/data/institutions";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const STORE_KEY = "admin-scholarships-draft";

const STATUS_META: Record<Funding["status"], { label: string; color: string; bg: string }> = {
  active: { label: "פעיל", color: "#047857", bg: "rgba(5,150,105,0.1)" },
  "needs-check": { label: "דורש אימות", color: "#92400e", bg: "rgba(251,133,0,0.12)" },
  hidden: { label: "מוסתר", color: "#6b7280", bg: "rgba(0,0,0,0.06)" },
};

const FIELDS: { key: keyof Funding; label: string; long?: boolean }[] = [
  { key: "name", label: "שם" },
  { key: "what", label: "מה זה — בשורה אחת", long: true },
  { key: "who", label: "מי זכאי", long: true },
  { key: "catch", label: "המלכודת / מה שלא כתוב בגדול", long: true },
  { key: "amountNote", label: "הערה על הסכום", long: true },
  { key: "windowNote", label: "חלון הגשה כטקסט (כשאין תאריך ודאי)", long: true },
  { key: "link", label: "קישור" },
  { key: "contact", label: "איש קשר" },
  { key: "notes", label: "הערות פנימיות — לא מוצג למשתמש", long: true },
  { key: "verified", label: "אומת לאחרונה" },
];

const MONTHS = ["", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function windowText(f: Funding): string {
  if (f.windowNote) return f.windowNote;
  const o = f.opensAt ? `${f.opensAt.d} ב${MONTHS[f.opensAt.m]}` : null;
  const c = f.closesAt ? `${f.closesAt.d} ב${MONTHS[f.closesAt.m]}` : null;
  if (o && c) return `${o} — ${c}`;
  if (c) return `עד ${c}`;
  if (o) return `נפתח ${o}`;
  return "אין תאריכים";
}

export default function AdminScholarshipsPage() {
  const [items, setItems] = useState<Funding[]>(FUNDING);
  const [openId, setOpenId] = useState<string | null>(null);
  /** קריאה קודם, עריכה רק בבקשה מפורשת — ראה ההערה ב-/admin/institutions */
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FundingKind | "all" | "pending">("all");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) { setItems(JSON.parse(saved)); setDirty(true); }
    } catch { /* ignore */ }
  }, []);

  function persist(next: Funding[]) {
    setItems(next);
    setDirty(true);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }

  function update(id: string, key: keyof Funding, value: string) {
    persist(items.map(i => (i.id === id ? { ...i, [key]: value } : i)));
  }

  function setStatus(id: string, status: Funding["status"]) {
    persist(items.map(i => (i.id === id ? { ...i, status } : i)));
  }

  /** אישור נפרד מ-status בכוונה: פריט יכול להיות פעיל באתר ועדיין לא נסקר */
  function approve(id: string) {
    persist(items.map(i => (i.id === id ? { ...i, approved: true } : i)));
    flash("אושר");
  }
  function reject(id: string) {
    persist(items.map(i => (i.id === id ? { ...i, approved: false, status: "hidden" } : i)));
    flash("נדחה והוסתר");
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  function exportJson() {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    flash("הועתק — להדביק ב-src/data/scholarships.ts");
  }

  function reset() {
    localStorage.removeItem(STORE_KEY);
    setItems(FUNDING);
    setDirty(false);
    flash("חזרה לנתוני המקור");
  }

  const pending = items.filter(i => i.approved === undefined);
  const shown =
    filter === "pending" ? pending
      : filter === "all" ? items
        : items.filter(i => i.kind === filter);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      {/* Header */}
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 26, marginTop: 8, ...HEEBO }}>מלגות ותוכניות</div>
          <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7 }}>
            {items.length} פריטים · {items.filter(i => i.kind === "scholarship").length} מלגות ·{" "}
            {items.filter(i => i.kind === "program").length} תוכניות
            {pending.length > 0 && (
              <span style={{ color: ORANGE, fontWeight: 700 }}> · {pending.length} ממתינים לאישורך</span>
            )}
          </div>
          <div style={{ fontSize: 11.5, marginTop: 8, opacity: 0.55, lineHeight: 1.6 }}>
            מוסד הוא איפה לומדים; תוכנית היא ממה מתפרנסים. רייכמן מוסד, קרן אור תוכנית.
            <br />
            ⚠️ אין בקאנד — עריכות נשמרות בדפדפן הזה בלבד. לייצא JSON כדי שזה יעלה לאפליקציה.
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "10px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {([
            ["pending", `ממתינים לאישור (${pending.length})`],
            ["all", `הכל (${items.length})`],
            ["scholarship", "מלגות"],
            ["program", "תוכניות"],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: filter === v ? (v === "pending" ? ORANGE : NAVY) : "rgba(0,0,0,0.05)",
                color: filter === v ? "#fff" : "rgba(0,0,0,0.6)",
              }}
            >
              {label}
            </button>
          ))}
          <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
            <Link
              href="/admin/courses"
              style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, background: "rgba(2,62,138,0.08)", color: NAVY }}
            >
              ללוח הקורסים ←
            </Link>
            <Link
              href="/admin/institutions"
              style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, background: "rgba(2,62,138,0.08)", color: NAVY }}
            >
              ללוח המוסדות ←
            </Link>
            <button onClick={exportJson} style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "none", background: ORANGE, color: "#fff", cursor: "pointer" }}>
              ייצוא JSON
            </button>
            {dirty && (
              <button onClick={reset} style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "rgba(0,0,0,0.5)", cursor: "pointer" }}>
                איפוס
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px 60px", display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", fontSize: 13.5, color: "rgba(0,0,0,0.4)" }}>
            אין פריטים שממתינים לאישור. הכל נסקר.
          </div>
        )}

        {shown.map(f => {
          const st = STATUS_META[f.status];
          const isOpen = openId === f.id;
          const linked = (f.institutions ?? [])
            .map(id => INSTITUTIONS.find(i => i.id === id)?.name ?? id);

          return (
            <div key={f.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
              {/* Row */}
              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                  style={{ flex: 1, minWidth: 200, textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1c1a16" }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                    {KIND_LABEL[f.kind]} · {windowText(f)}
                    {linked.length > 0 && ` · ${linked.join(", ")}`}
                  </div>
                </button>

                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: st.bg, color: st.color }}>
                  {st.label}
                </span>

                {f.approved === true ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "rgba(5,150,105,0.12)", color: "#047857" }}>
                    ✓ אושר
                  </span>
                ) : f.approved === false ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "rgba(0,0,0,0.06)", color: "#6b7280" }}>
                    נדחה
                  </span>
                ) : (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => approve(f.id)} style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 8, border: "none", background: "#047857", color: "#fff", cursor: "pointer" }}>
                      ✓ אשר
                    </button>
                    <button onClick={() => reject(f.id)} style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "rgba(0,0,0,0.5)", cursor: "pointer" }}>
                      ✕ לא
                    </button>
                  </span>
                )}
              </div>

              {/* Read view */}
              {isOpen && editId !== f.id && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "14px 16px", background: "#fcfbf9" }}>
                  {f.status === "needs-check" && f.notes && (
                    <div style={{ background: "rgba(251,133,0,0.09)", color: "#92400e", borderRadius: 10, padding: 13, marginBottom: 12, fontSize: 12.5, lineHeight: 1.75 }}>
                      <b>מה נשאר לאמת · </b>{f.notes}
                    </div>
                  )}
                  <div style={{ fontSize: 13.5, lineHeight: 1.8, color: "rgba(0,0,0,0.78)" }}>{f.what}</div>
                  {f.catch && (
                    <div style={{ background: "#fff7ec", color: "#8a4d00", borderRadius: 10, padding: 13, marginTop: 10, fontSize: 12.5, lineHeight: 1.75 }}>
                      <b>המלכודת · </b>{f.catch}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "6px 24px", marginTop: 12 }}>
                    {([
                      ["חלון הגשה", windowText(f)],
                      ["מי זכאי", f.who ?? ""],
                      ["סכום", f.amount ? `${f.amount.toLocaleString("he-IL")} ₪` : (f.amountNote ?? "")],
                      ["מוסדות", linked.join(" · ")],
                      ["איש קשר", f.contact ?? ""],
                      ["אומת", f.verified ?? "לא אומת"],
                    ] as [string, string][]).filter(([, v]) => v && v.trim()).map(([k, v]) => (
                      <div key={k} style={{ padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: "rgba(0,0,0,0.35)" }}>{k}</div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(0,0,0,0.72)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {f.covers && f.covers.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {f.covers.map(c => (
                        <span key={c} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 99, background: "rgba(5,150,105,0.1)", color: "#047857", fontWeight: 600 }}>{c}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                    <button onClick={() => setEditId(f.id)} style={{ fontSize: 12.5, fontWeight: 800, padding: "8px 16px", borderRadius: 9, border: "none", background: ORANGE, color: "#fff", cursor: "pointer" }}>
                      עריכה
                    </button>
                    {f.link && (
                      <a href={f.link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 9, background: "rgba(2,62,138,0.07)", color: NAVY }}>
                        לאתר ↗
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Editor */}
              {isOpen && editId === f.id && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "14px 16px", background: "#fcfbf9", display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={() => setEditId(null)} style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, padding: "6px 13px", borderRadius: 9, border: "none", background: "rgba(2,62,138,0.07)", color: NAVY, cursor: "pointer" }}>
                    ← סיום עריכה
                  </button>
                  {/* מה שהמועמד מקבל בפועל — קריאה בלבד, כי זו רשימה ולא טקסט */}
                  {f.covers && f.covers.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 5 }}>מה מקבלים</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {f.covers.map(c => (
                          <span key={c} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 99, background: "rgba(5,150,105,0.1)", color: "#047857", fontWeight: 600 }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {f.blocks && f.blocks.length > 0 && (
                    <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(220,38,38,0.07)", fontSize: 12, color: "#b91c1c", lineHeight: 1.6 }}>
                      <b>חוסמת:</b> {f.blocks.map(b => items.find(i => i.id === b)?.name ?? b).join(" · ")}
                    </div>
                  )}

                  {FIELDS.map(({ key, label, long }) => {
                    const val = (f[key] ?? "") as string;
                    return (
                      <label key={String(key)} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(0,0,0,0.5)" }}>{label}</span>
                        {long ? (
                          <textarea
                            value={val}
                            onChange={e => update(f.id, key, e.target.value)}
                            rows={2}
                            style={{ fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }}
                          />
                        ) : (
                          <input
                            value={val}
                            onChange={e => update(f.id, key, e.target.value)}
                            style={{ fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)", fontFamily: "inherit" }}
                          />
                        )}
                      </label>
                    );
                  })}

                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(0,0,0,0.5)" }}>סטטוס:</span>
                    {(["active", "needs-check", "hidden"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(f.id, s)}
                        style={{
                          fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 8, cursor: "pointer",
                          border: f.status === s ? "none" : "1px solid rgba(0,0,0,0.14)",
                          background: f.status === s ? STATUS_META[s].color : "#fff",
                          color: f.status === s ? "#fff" : "rgba(0,0,0,0.55)",
                        }}
                      >
                        {STATUS_META[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 22, insetInline: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 99 }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
