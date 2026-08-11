/**
 * /admin/institutions — דף מאחורי הקלעים לניהול נתוני המוסדות.
 *
 * ⚠️ אין בקאנד. עריכות נשמרות ב-localStorage של הדפדפן הזה בלבד.
 * כדי שהשינוי יעלה לאפליקציה עצמה — מייצאים JSON ומחזירים אותו ל-src/data/institutions.ts
 */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { INSTITUTIONS, DOMAIN_LABEL, type Institution, type Track, type Domain } from "@/data/institutions";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const STORE_KEY = "admin-institutions-draft";

const TRACK_LABEL: Record<Track, string> = {
  degree: "תואר אקדמי",
  mahat: "מה״ט",
  bootcamp: "הכשרה טכנולוגית",
};

const STATUS_META: Record<Institution["status"], { label: string; color: string; bg: string }> = {
  active: { label: "פעיל", color: "#047857", bg: "rgba(5,150,105,0.1)" },
  "needs-check": { label: "דורש אימות", color: "#92400e", bg: "rgba(251,133,0,0.12)" },
  hidden: { label: "מוסתר", color: "#6b7280", bg: "rgba(0,0,0,0.06)" },
};

/** השדות הארוכים — נערכים ב-textarea */
const FIELDS: { key: keyof Institution; label: string; long?: boolean }[] = [
  { key: "name", label: "שם המוסד" },
  { key: "tag", label: "תגית" },
  { key: "link", label: "קישור" },
  { key: "location", label: "מיקום" },
  { key: "tuition", label: "שכר לימוד" },
  { key: "schedule", label: "מבנה הלימודים" },
  { key: "admission", label: "תנאי קבלה", long: true },
  { key: "noPsychometric", label: "קבלה ללא פסיכומטרי", long: true },
  { key: "support", label: "תמיכה ומעטפת", long: true },
  { key: "industry", label: "קשרי תעשייה והשמה", long: true },
  { key: "contactName", label: "איש קשר — שם" },
  { key: "contactPhone", label: "איש קשר — טלפון" },
  { key: "contactEmail", label: "איש קשר — מייל" },
  { key: "contactRole", label: "תפקיד / יחידה — לא מדור רישום!", long: true },
  { key: "openDays", label: "ימים פתוחים ואירועי חשיפה", long: true },
  { key: "why", label: "הטקסט שהמשתמש רואה", long: true },
  { key: "warn", label: "אזהרה אדומה (ריק = אין)", long: true },
  { key: "notes", label: "הערות פנימיות — לא מוצג למשתמש", long: true },
  { key: "verified", label: "אומת לאחרונה" },
];

export default function AdminInstitutionsPage() {
  const [items, setItems] = useState<Institution[]>(INSTITUTIONS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Track | "all">("all");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) { setItems(JSON.parse(saved)); setDirty(true); }
    } catch { /* ignore */ }
  }, []);

  function persist(next: Institution[]) {
    setItems(next);
    setDirty(true);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }

  function update(id: string, key: keyof Institution, value: string) {
    persist(items.map(i => (i.id === id ? { ...i, [key]: value } : i)));
  }

  function toggleDomain(id: string, d: Domain) {
    persist(items.map(i =>
      i.id === id
        ? { ...i, domains: i.domains.includes(d) ? i.domains.filter(x => x !== d) : [...i.domains, d] }
        : i
    ));
  }

  function setStatus(id: string, status: Institution["status"]) {
    persist(items.map(i => (i.id === id ? { ...i, status } : i)));
  }

  function remove(id: string) {
    const inst = items.find(i => i.id === id);
    if (!inst) return;
    if (!confirm(`למחוק לצמיתות את "${inst.name}"?\n\nאם המטרה היא רק להוריד אותו מהאפליקציה — עדיף לסמן "מוסתר" ולא למחוק.`)) return;
    persist(items.filter(i => i.id !== id));
  }

  function addNew() {
    const id = `new-${Date.now()}`;
    persist([{
      id, name: "מוסד חדש", track: filter === "all" ? "degree" : filter,
      why: "", tag: "חדש", tagColor: NAVY, link: "",
      location: "", tuition: "", admission: "", noPsychometric: "",
      support: "", industry: "", schedule: "",
      contactName: "", contactRole: "", contactPhone: "", contactEmail: "", openDays: "",
      domains: [],
      status: "needs-check", notes: "", verified: "",
    }, ...items]);
    setOpenId(id);
  }

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2600); }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
      flash("ה-JSON הועתק ✓ — שלח אותו לקלוד כדי להעלות לאפליקציה");
    } catch {
      flash("ההעתקה נכשלה — נסה כפתור ההורדה");
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(a ? blob : blob);
    a.download = "institutions.json";
    a.click();
    URL.revokeObjectURL(a.href);
    flash("הקובץ ירד ✓");
  }

  function reset() {
    if (!confirm("לשחזר את הנתונים כפי שהם באפליקציה עכשיו?\nכל העריכות שלא ייצאת יימחקו.")) return;
    localStorage.removeItem(STORE_KEY);
    setItems(INSTITUTIONS);
    setDirty(false);
    flash("שוחזר למקור");
  }

  const shown = filter === "all" ? items : items.filter(i => i.track === filter);
  const counts = {
    active: items.filter(i => i.status === "active").length,
    check: items.filter(i => i.status === "needs-check").length,
    hidden: items.filter(i => i.status === "hidden").length,
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#f5f3ef" }}>
      {/* Header */}
      <div style={{ background: NAVY }} className="text-white px-6 py-6">
        <div className="max-w-[1000px] mx-auto">
          <Link href="/paths" className="text-[12px] font-bold" style={{ opacity: 0.6 }}>← לאפליקציה</Link>
          <div className="text-[26px] mt-3" style={HEEBO}>ניהול מוסדות</div>
          <div className="text-[12.5px] mt-1" style={{ opacity: 0.7 }}>
            {items.length} מוסדות · {counts.active} פעילים · {counts.check} דורשים אימות · {counts.hidden} מוסתרים
          </div>
        </div>
      </div>

      {/* The honest limitation */}
      <div className="px-6 pt-5">
        <div className="max-w-[1000px] mx-auto rounded-xl px-4 py-3.5 flex items-start gap-3"
          style={{ background: "rgba(251,133,0,0.1)", border: "1.5px solid rgba(251,133,0,0.3)" }}>
          <span className="text-[18px] shrink-0">⚠️</span>
          <div className="text-[12.5px] leading-[1.7]" style={{ color: "#92400e" }}>
            <span className="font-black">אין עדיין בקאנד, אז מה שנערך כאן נשמר רק בדפדפן הזה.</span>{" "}
            המשתמשים באפליקציה עדיין רואים את הגרסה המקורית. כדי להעלות שינויים באמת —
            ערוך כאן, לחץ <span className="font-bold">״העתק JSON״</span>, ושלח לקלוד. זה ייכנס לקוד ויעלה לאוויר.
            {dirty && <span className="block mt-1.5 font-black">יש לך שינויים שעוד לא ייצאת.</span>}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pt-4 pb-2 sticky top-0 z-20" style={{ background: "#f5f3ef" }}>
        <div className="max-w-[1000px] mx-auto flex flex-wrap gap-2 items-center">
          {(["all", "degree", "mahat", "bootcamp"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: filter === t ? NAVY : "#fff",
                color: filter === t ? "#fff" : "rgba(0,0,0,0.55)",
                border: "1px solid rgba(2,62,138,0.15)",
              }}>
              {t === "all" ? `הכל (${items.length})` : `${TRACK_LABEL[t]} (${items.filter(i => i.track === t).length})`}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={addNew} className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "#fff", color: NAVY, border: "1px solid rgba(2,62,138,0.2)" }}>+ מוסד חדש</button>
          <button onClick={reset} className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "#fff", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.12)" }}>שחזור</button>
          <button onClick={downloadJson} className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "#fff", color: NAVY, border: "1px solid rgba(2,62,138,0.2)" }}>הורד קובץ</button>
          <button onClick={copyJson} className="text-[12px] font-black px-4 py-1.5 rounded-lg text-white"
            style={{ background: ORANGE }}>העתק JSON</button>
        </div>
      </div>

      {/* Rows */}
      <div className="px-6 pb-16">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-2.5">
          {shown.map(inst => {
            const open = openId === inst.id;
            const st = STATUS_META[inst.status];
            return (
              <div key={inst.id} className="rounded-xl overflow-hidden"
                style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)", opacity: inst.status === "hidden" ? 0.6 : 1 }}>
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setOpenId(open ? null : inst.id)} className="flex-1 text-right flex items-center gap-3 min-w-0">
                    <span className="text-[13px]" style={{ color: "rgba(0,0,0,0.3)", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
                    <span className="text-[13.5px] font-black truncate" style={{ color: NAVY }}>{inst.name}</span>
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <span className="text-[11px] shrink-0" style={{ color: "rgba(0,0,0,0.35)" }}>{TRACK_LABEL[inst.track]}</span>
                    {inst.warn && <span className="text-[11px] shrink-0">⚠️</span>}
                  </button>
                  <select value={inst.status} onChange={e => setStatus(inst.id, e.target.value as Institution["status"])}
                    className="text-[11.5px] font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{ border: "1px solid rgba(0,0,0,0.12)", background: "#fff" }}>
                    <option value="active">פעיל</option>
                    <option value="needs-check">דורש אימות</option>
                    <option value="hidden">מוסתר</option>
                  </select>
                  <button onClick={() => remove(inst.id)} className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                    style={{ color: "#dc2626", background: "rgba(220,38,38,0.07)" }}>מחק</button>
                </div>

                {/* Editor */}
                {open && (
                  <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="mb-3 flex flex-wrap gap-5 items-start">
                      <div>
                        <label className="text-[11px] font-black block mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>מסלול</label>
                        <select value={inst.track} onChange={e => update(inst.id, "track", e.target.value)}
                          className="text-[12.5px] px-2.5 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.14)" }}>
                          {(Object.keys(TRACK_LABEL) as Track[]).map(t => <option key={t} value={t}>{TRACK_LABEL[t]}</option>)}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[280px]">
                        <label className="text-[11px] font-black block mb-1.5" style={{ color: "rgba(0,0,0,0.45)" }}>
                          תחומים רלוונטיים — קובע למי המוסד יוצג
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(DOMAIN_LABEL) as Domain[]).map(d => {
                            const on = inst.domains.includes(d);
                            return (
                              <button
                                key={d}
                                onClick={() => toggleDomain(inst.id, d)}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                                style={{
                                  background: on ? NAVY : "#fff",
                                  color: on ? "#fff" : "rgba(0,0,0,0.4)",
                                  border: `1px solid ${on ? NAVY : "rgba(0,0,0,0.14)"}`,
                                }}
                              >
                                {DOMAIN_LABEL[d]}
                              </button>
                            );
                          })}
                        </div>
                        {inst.domains.length === 0 && (
                          <div className="text-[11px] mt-1.5 font-bold" style={{ color: "#b91c1c" }}>
                            בלי תחום המוסד לא יוצג לאף אחד
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
                      {FIELDS.map(f => (
                        <div key={String(f.key)} style={{ gridColumn: f.long ? "1 / -1" : undefined }}>
                          <label className="text-[11px] font-black block mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>{f.label}</label>
                          {f.long ? (
                            <textarea
                              value={(inst[f.key] as string) ?? ""}
                              onChange={e => update(inst.id, f.key, e.target.value)}
                              rows={f.key === "notes" || f.key === "why" || f.key === "warn" ? 3 : 2}
                              className="w-full text-[12.5px] leading-[1.6] px-2.5 py-2 rounded-lg"
                              style={{ border: "1px solid rgba(0,0,0,0.14)", resize: "vertical", fontFamily: "inherit" }}
                            />
                          ) : (
                            <input
                              value={(inst[f.key] as string) ?? ""}
                              onChange={e => update(inst.id, f.key, e.target.value)}
                              className="w-full text-[12.5px] px-2.5 py-2 rounded-lg"
                              style={{ border: "1px solid rgba(0,0,0,0.14)", fontFamily: "inherit" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-[13px] font-bold z-50"
          style={{ background: NAVY, boxShadow: "0 6px 24px rgba(0,0,0,0.25)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
