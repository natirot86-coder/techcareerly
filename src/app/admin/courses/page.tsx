/**
 * /admin/courses — לוח הקורסים העטופים.
 *
 * קורס = מוסד × מעטפת: מי מלמד, ומי מממן/מלווה. זה המקום היחיד שבו רואים
 * את שני הצדדים יחד, ואת מצב המחזור — שנגזר מהתאריך ולא נשמר, כך שקורס
 * שפג מסומן כאן מעצמו ונעלם מהמועמד מעצמו.
 *
 * אותו מנגנון אישור כמו המוסדות והמלגות. ⚠️ אין בקאנד — עריכות בדפדפן זה
 * בלבד; ייצוא JSON חוזר ל-src/data/courses.ts.
 */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { COURSES, courseState, STATE_LABEL, type Course, type CourseState } from "@/data/courses";
import { INSTITUTIONS } from "@/data/institutions";
import { FUNDING } from "@/data/scholarships";
import AdminGate from "@/components/AdminGate";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const STORE_KEY = "admin-courses-draft";

const STATE_META: Record<CourseState, { color: string; bg: string }> = {
  open:    { color: "#047857", bg: "rgba(5,150,105,0.1)" },
  rolling: { color: "#0369a1", bg: "rgba(14,165,233,0.1)" },
  passed:  { color: "#b91c1c", bg: "rgba(220,38,38,0.1)" },
  stale:   { color: "#92400e", bg: "rgba(251,133,0,0.12)" },
  unknown: { color: "#6b7280", bg: "rgba(0,0,0,0.06)" },
};

const FIELDS: { key: keyof Course; label: string; long?: boolean }[] = [
  { key: "name", label: "שם הקורס" },
  { key: "what", label: "מה זה — בשורה אחת", long: true },
  { key: "who", label: "מי זכאי", long: true },
  { key: "cost", label: "עלות" },
  { key: "format", label: "מתכונת (משך · שעות · איפה)" },
  { key: "catch", label: "מה שצריך לדעת לפני", long: true },
  { key: "link", label: "דף הנחיתה (לא עמוד הבית!)" },
  { key: "startsAt", label: "תאריך פתיחה (YYYY-MM-DD, ריק = אין)" },
  { key: "cycleNote", label: "הערת מחזור (כשאין תאריך)" },
  { key: "notes", label: "הערות פנימיות", long: true },
  { key: "verified", label: "אומת לאחרונה (YYYY-MM-DD)" },
];

function AdminCoursesPage() {
  const [items, setItems] = useState<Course[]>(COURSES);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) { setItems(JSON.parse(saved)); setDirty(true); }
    } catch { /* ignore */ }
  }, []);

  function persist(next: Course[]) {
    setItems(next);
    setDirty(true);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }
  const update = (id: string, key: keyof Course, value: string) =>
    persist(items.map(c => (c.id === id ? { ...c, [key]: value || undefined } : c)));
  const approve = (id: string) => { persist(items.map(c => (c.id === id ? { ...c, approved: true } : c))); flash("אושר"); };
  const reject = (id: string) => { persist(items.map(c => (c.id === id ? { ...c, approved: false, status: "hidden" as const } : c))); flash("נדחה והוסתר"); };
  function flash(m: string) { setToast(m); setTimeout(() => setToast(""), 1800); }
  function exportJson() {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    flash("הועתק — להדביק ב-src/data/courses.ts");
  }

  const pending = items.filter(c => c.approved === undefined);
  const instName = (id: string) => INSTITUTIONS.find(i => i.id === id)?.name ?? id;
  const progName = (id?: string) => (id ? FUNDING.find(f => f.id === id)?.name ?? id : null);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 26, marginTop: 8, ...HEEBO }}>קורסים עטופים</div>
          <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7 }}>
            {items.length} קורסים · כל אחד = מוסד + מעטפת
            {pending.length > 0 && <span style={{ color: ORANGE, fontWeight: 700 }}> · {pending.length} ממתינים לאישורך</span>}
          </div>
          <div style={{ fontSize: 11.5, marginTop: 8, opacity: 0.55, lineHeight: 1.6 }}>
            מצב המחזור נגזר מהתאריך — קורס שפג נעלם מהמועמד מעצמו ומסומן כאן באדום.
            <br />⚠️ אין בקאנד — לייצא JSON כדי שהעריכה תעלה לאפליקציה.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {[["/admin/institutions", "מוסדות"], ["/admin/scholarships", "מלגות ותוכניות"], ["/admin/analytics", "אנליטיקות"]].map(([h, l]) => (
              <Link key={h} href={h} style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.14)", color: "#fff" }}>{l}</Link>
            ))}
            <button onClick={exportJson} style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, border: "none", background: ORANGE, color: "#fff", cursor: "pointer" }}>
              ייצוא JSON
            </button>
            {dirty && (
              <button onClick={() => { localStorage.removeItem(STORE_KEY); setItems(COURSES); setDirty(false); flash("שוחזר"); }}
                style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", cursor: "pointer" }}>
                שחזור
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px 60px", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(c => {
          const st = courseState(c);
          const sm = STATE_META[st];
          const isOpen = openId === c.id;
          return (
            <div key={c.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${st === "passed" ? "rgba(220,38,38,0.35)" : "rgba(0,0,0,0.08)"}`, overflow: "hidden", opacity: c.status === "hidden" ? 0.55 : 1 }}>
              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => { setOpenId(isOpen ? null : c.id); setEditId(null); }}
                  style={{ flex: 1, minWidth: 220, textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1c1a16" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                    {instName(c.institutionId)}
                    {progName(c.programId) && <> · מעטפת: <b>{progName(c.programId)}</b></>}
                  </div>
                </button>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: sm.bg, color: sm.color }}>
                  {STATE_LABEL[st]}{c.startsAt ? ` · ${c.startsAt}` : ""}
                </span>
                {c.approved === true ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "rgba(5,150,105,0.12)", color: "#047857" }}>✓ אושר</span>
                ) : c.approved === false ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "rgba(0,0,0,0.06)", color: "#6b7280" }}>נדחה</span>
                ) : (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => approve(c.id)} style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 8, border: "none", background: "#047857", color: "#fff", cursor: "pointer" }}>✓ אשר</button>
                    <button onClick={() => reject(c.id)} style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "rgba(0,0,0,0.5)", cursor: "pointer" }}>✕ לא</button>
                  </span>
                )}
              </div>

              {isOpen && editId !== c.id && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "14px 16px", background: "#fcfbf9" }}>
                  {st === "passed" && (
                    <div style={{ background: "rgba(220,38,38,0.07)", color: "#b91c1c", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12.5, lineHeight: 1.7 }}>
                      <b>המחזור עבר ({c.startsAt}) — הקורס ירד מהמועמד מעצמו.</b> להשיג תאריך חדש או להסתיר.
                    </div>
                  )}
                  <div style={{ fontSize: 13.5, lineHeight: 1.8, color: "rgba(0,0,0,0.78)" }}>{c.what}</div>
                  {c.catch && (
                    <div style={{ background: "#fff7ec", color: "#8a4d00", borderRadius: 10, padding: 12, marginTop: 10, fontSize: 12.5, lineHeight: 1.7 }}>
                      <b>לדעת לפני · </b>{c.catch}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "6px 24px", marginTop: 12 }}>
                    {([["עלות", c.cost], ["מתכונת", c.format], ["מי זכאי", c.who],
                       ["מחזור", c.startsAt ?? c.cycleNote], ["אומת", c.verified]] as [string, string | undefined][])
                      .filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} style={{ padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: "rgba(0,0,0,0.35)" }}>{k}</div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(0,0,0,0.72)" }}>{v}</div>
                        </div>
                      ))}
                  </div>
                  {c.notes && (
                    <div style={{ background: "rgba(251,133,0,0.08)", color: "#92400e", borderRadius: 10, padding: 12, marginTop: 12, fontSize: 12.5, lineHeight: 1.7 }}>
                      <b>פנימי · </b>{c.notes}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button onClick={() => setEditId(c.id)} style={{ fontSize: 12.5, fontWeight: 800, padding: "8px 16px", borderRadius: 9, border: "none", background: ORANGE, color: "#fff", cursor: "pointer" }}>עריכה</button>
                    <a href={c.link} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 9, background: "rgba(2,62,138,0.07)", color: NAVY }}>
                      לדף הנחיתה ↗
                    </a>
                  </div>
                </div>
              )}

              {isOpen && editId === c.id && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "14px 16px", background: "#fcfbf9", display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={() => setEditId(null)} style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, padding: "6px 13px", borderRadius: 9, border: "none", background: "rgba(2,62,138,0.07)", color: NAVY, cursor: "pointer" }}>
                    ← סיום עריכה
                  </button>
                  {FIELDS.map(({ key, label, long }) => {
                    const val = (c[key] ?? "") as string;
                    return (
                      <label key={String(key)} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(0,0,0,0.5)" }}>{label}</span>
                        {long ? (
                          <textarea value={val} onChange={e => update(c.id, key, e.target.value)} rows={2}
                            style={{ fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }} />
                        ) : (
                          <input value={val} onChange={e => update(c.id, key, e.target.value)}
                            style={{ fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)", fontFamily: "inherit" }} />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 22, insetInline: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 99 }}>{toast}</div>
        </div>
      )}
    </div>
  );
}

/** הלוח עטוף בשער הניהול — קוד אחד לכל הלוחות, נבדק מול השרת */
export default function GatedPage() {
  return <AdminGate><AdminCoursesPage /></AdminGate>;
}
