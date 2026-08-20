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
import { coursesNeedingAttention, STATE_LABEL } from "@/data/courses";
import { FUNDING } from "@/data/scholarships";
import AdminGate from "@/components/AdminGate";

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

function AdminInstitutionsPage() {
  const [items, setItems] = useState<Institution[]>(INSTITUTIONS);
  const [openId, setOpenId] = useState<string | null>(null);
  /**
   * פתיחת מוסד מציגה **קריאה**, לא טופס.
   * אישור הוא משימה של קריאה: השאלה היא "זה מה שאנחנו רוצים שהוא יראה?",
   * ואי אפשר לענות עליה כשמולך 19 שדות קלט. עריכה היא מצב נפרד ומכוון.
   */
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Track | "all" | "pending" | "calls">("all");
  const [query, setQuery] = useState("");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        /*
         * מיזוג, לא החלפה. קודם הרשימה השמורה החליפה את רשימת הקוד כולה —
         * ולכן מוסד חדש שנכנס בקוד לא הופיע אצל מי שערך פעם משהו (נתי ראה
         * 69 כשבקוד היו 81). הבסיס תמיד הקוד הטרי; עריכות יושבות עליו לפי id.
         */
        const stored: Institution[] = JSON.parse(saved);
        const editedById = new Map(stored.map(i => [i.id, i]));
        const codeIds = new Set(INSTITUTIONS.map(i => i.id));
        setItems([
          ...INSTITUTIONS.map(i => editedById.get(i.id) ?? i),
          ...stored.filter(i => !codeIds.has(i.id)),
        ]);
        setDirty(true);
      }
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

  function approve(id: string) {
    persist(items.map(i => (i.id === id ? { ...i, approved: true } : i)));
  }

  function reject(id: string) {
    persist(items.map(i => (i.id === id ? { ...i, approved: false, status: "hidden" } : i)));
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
      id, name: "מוסד חדש", track: (filter === "all" || filter === "pending" || filter === "calls") ? "degree" : filter,
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

  const pending = items.filter(i => i.approved === undefined);
  /** רשימת הטלפונים: כל מוסד שההערות שלו מסמנות 📞 — חוב מחקר שהפך למשימה */
  const calls = items.filter(i => i.status !== "hidden" && (i.notes ?? "").includes("📞"));
  const shown = (filter === "pending"
    ? pending
    : filter === "calls" ? calls
    : filter === "all" ? items : items.filter(i => i.track === filter)
  ).filter(i => !query || i.name.includes(query) || (i.notes ?? "").includes(query) || (i.why ?? "").includes(query));
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
            {pending.length > 0 && <span className="font-black"> · {pending.length} ממתינים לאישורך</span>}
          </div>
        </div>
      </div>

      {/* The honest limitation */}
      <div className="px-6 pt-5">
        <div className="max-w-[1000px] mx-auto rounded-xl px-4 py-3.5 flex items-start gap-3"
          style={{ background: "rgba(251,133,0,0.1)", border: "1.5px solid rgba(251,133,0,0.3)" }}>
          <span className="text-[18px] shrink-0">⚠️</span>
          <div className="text-[12.5px] leading-[1.7]" style={{ color: "#92400e" }}>
            <span className="font-black">הקטלוג יושב בקוד, לא בבסיס הנתונים — לכן עריכה כאן נשמרת רק בדפדפן הזה.</span>{" "}
            המשתמשים באפליקציה עדיין רואים את הגרסה המקורית. כדי להעלות שינויים באמת —
            ערוך כאן, לחץ <span className="font-bold">״העתק JSON״</span>, ושלח לקלוד. זה ייכנס לקוד ויעלה לאוויר.
            {dirty && <span className="block mt-1.5 font-black">יש לך שינויים שעוד לא ייצאת.</span>}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pt-4 pb-2 sticky top-0 z-20" style={{ background: "#f5f3ef" }}>
        <div className="max-w-[1000px] mx-auto flex flex-wrap gap-2 items-center">
          <button onClick={() => setFilter("pending")}
            className="text-[12px] font-black px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: filter === "pending" ? ORANGE : "#fff",
              color: filter === "pending" ? "#fff" : ORANGE,
              border: `1.5px solid ${ORANGE}`,
            }}>
            ממתינים לאישור ({pending.length})
          </button>
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
          <button onClick={() => setFilter("calls")}
            className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
            style={{ background: filter === "calls" ? "#047857" : "#fff", color: filter === "calls" ? "#fff" : "#047857", border: "1.5px solid #047857" }}>
            📞 לטלפן ({calls.length})
          </button>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="חיפוש…"
            className="text-[12px] px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.13)", width: 120 }} />
          <div className="flex-1" />
          <Link href="/admin/courses" className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>ללוח הקורסים ←</Link>
          <Link href="/admin/scholarships" className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>ללוח המלגות ←</Link>
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

      {/* פס פעולה — מה שדורש טיפול, במקום שבו אתה ממילא נמצא */}
      <AttentionStrip pendingCount={pending.length} needsCheck={items.filter(i => i.status === "needs-check").length} />

      {/* Rows — מקובצים לפי מסלול. תואר קודם, כי עליו אנחנו ממליצים */}
      <div className="px-6 pb-16">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-2.5">
          {(filter === "all" || filter === "pending"
            ? (["degree", "mahat", "bootcamp"] as Track[]).flatMap(t => {
                const group = shown.filter(i => i.track === t);
                return group.length ? [{ __header: t } as unknown as Institution, ...group] : [];
              })
            : shown
          ).map(inst => {
            if ((inst as unknown as { __header?: Track }).__header) {
              const t = (inst as unknown as { __header: Track }).__header;
              const programs = FUNDING.filter(f => f.kind === "program" && f.status !== "hidden" && f.tracks?.includes(t)).length;
              return (
                <div key={`h-${t}`} className="flex items-center gap-3 pt-4 pb-0.5">
                  <span className="text-[14px] font-black" style={{ color: NAVY }}>{TRACK_LABEL[t]}</span>
                  <span className="text-[11px] font-bold" style={{ color: "rgba(0,0,0,0.35)" }}>
                    {shown.filter(i => i.track === t).length} מוסדות · {programs} תוכניות מעטפת
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(2,62,138,0.12)" }} />
                </div>
              );
            }
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
                  {filter === "calls" && (
                    <span className="text-[11px] w-full pr-9 pb-1 block" style={{ color: "#047857" }}>
                      {(inst.notes ?? "").split("📞")[1]?.split(".")[0]?.trim() ?? ""}
                      {inst.contactPhone ? ` · ${inst.contactPhone}` : " · אין טלפון רשום"}
                    </span>
                  )}
                  <select value={inst.status} onChange={e => setStatus(inst.id, e.target.value as Institution["status"])}
                    className="text-[11.5px] font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{ border: "1px solid rgba(0,0,0,0.12)", background: "#fff" }}>
                    <option value="active">פעיל</option>
                    <option value="needs-check">דורש אימות</option>
                    <option value="hidden">מוסתר</option>
                  </select>
                  {inst.approved === undefined ? (
                    <>
                      <button onClick={() => approve(inst.id)} className="text-[12px] font-black px-3 py-1 rounded-lg shrink-0"
                        style={{ color: "#fff", background: "#047857" }}>✓ אשר</button>
                      <button onClick={() => reject(inst.id)} className="text-[12px] font-bold px-3 py-1 rounded-lg shrink-0"
                        style={{ color: "#b91c1c", background: "rgba(220,38,38,0.08)" }}>✕ לא</button>
                    </>
                  ) : inst.approved ? (
                    <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                      style={{ color: "#047857", background: "rgba(5,150,105,0.1)" }}>✓ אושר</span>
                  ) : (
                    <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                      style={{ color: "rgba(0,0,0,0.4)", background: "rgba(0,0,0,0.05)" }}>נדחה</span>
                  )}
                  <button onClick={() => remove(inst.id)} className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                    style={{ color: "#dc2626", background: "rgba(220,38,38,0.07)" }}>מחק</button>
                </div>

                {/* Read view — מה שהמועמד רואה, ומה שנשאר לאמת */}
                {open && editId !== inst.id && (
                  <div className="px-4 pb-4 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    {/* השאלה הפתוחה היא הפעולה הבאה, ולכן היא ראשונה ולא קבורה */}
                    {inst.status === "needs-check" && inst.notes && (
                      <div className="rounded-xl p-3.5 mb-3 text-[12.5px] leading-[1.75]"
                        style={{ background: "rgba(251,133,0,0.09)", color: "#92400e" }}>
                        <span className="font-black">מה נשאר לאמת · </span>{inst.notes}
                      </div>
                    )}
                    {inst.warn && (
                      <div className="rounded-xl p-3.5 mb-3 text-[12.5px] leading-[1.75]"
                        style={{ background: "rgba(220,38,38,0.07)", color: "#b91c1c" }}>
                        <span className="font-black">אזהרה למועמד · </span>{inst.warn}
                      </div>
                    )}

                    <div className="rounded-xl p-4 mb-3" style={{ background: "#fcfbf9", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="text-[11px] font-black mb-2" style={{ color: "rgba(0,0,0,0.4)" }}>
                        מה שהמועמד רואה
                      </div>
                      <div className="text-[13px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.75)" }}>{inst.why}</div>
                      <a href={inst.link} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-2.5 text-[12px] font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}>
                        לאתר הרשמי ↗
                      </a>
                    </div>

                    <div className="grid gap-x-6 gap-y-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
                      {([
                        ["מיקום", inst.location], ["עיר", inst.city ?? ""], ["כתובת", inst.address ?? ""], ["שכר לימוד", inst.tuition],
                        ["מבנה הלימודים", inst.schedule], ["תנאי קבלה", inst.admission],
                        ["ללא פסיכומטרי", inst.noPsychometric], ["תמיכה ומעטפת", inst.support],
                        ["קשרי תעשייה", inst.industry], ["ימים פתוחים", inst.openDays],
                      ] as [string, string][]).filter(([, v]) => v && v.trim()).map(([k, v]) => (
                        <div key={k} className="py-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                          <div className="text-[10.5px] font-black" style={{ color: "rgba(0,0,0,0.35)" }}>{k}</div>
                          <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.72)" }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {(inst.contactName || inst.contactPhone || inst.contactEmail) && (
                      <div className="rounded-xl p-3.5 mt-3 text-[12.5px] leading-[1.8]"
                        style={{ background: "rgba(5,150,105,0.06)", color: "#065f46" }}>
                        <span className="font-black">איש קשר · </span>
                        {[inst.contactName, inst.contactRole, inst.contactPhone, inst.contactEmail]
                          .filter(Boolean).join(" · ")}
                      </div>
                    )}

                    {/* הקשר שלנו — הגורם היחיד שאנחנו שולטים בו. שובר שוויון, לא תחליף למעטפת */}
                    <div className="rounded-xl p-3 mt-3 flex flex-wrap items-center gap-2"
                      style={{ background: inst.relationship === "partner" ? "rgba(5,150,105,0.07)" : "rgba(0,0,0,0.03)" }}>
                      <span className="text-[11px] font-black" style={{ color: "rgba(0,0,0,0.5)" }}>הקשר שלנו:</span>
                      {([["none", "אין"], ["contacted", "דיברנו"], ["partner", "שותפות פעילה ★"]] as const).map(([v, l]) => (
                        <button key={v}
                          onClick={() => persist(items.map(i => i.id === inst.id
                            ? { ...i, relationship: v, relationshipAt: new Date().toISOString().slice(0, 10) } : i))}
                          className="text-[11.5px] font-bold px-3 py-1 rounded-lg"
                          style={{
                            background: (inst.relationship ?? "none") === v ? "#047857" : "#fff",
                            color: (inst.relationship ?? "none") === v ? "#fff" : "rgba(0,0,0,0.55)",
                            border: "1px solid rgba(0,0,0,0.12)",
                          }}>
                          {l}
                        </button>
                      ))}
                      {inst.relationshipAt && (
                        <span className="text-[10.5px]" style={{
                          color: (Date.now() - new Date(inst.relationshipAt).getTime()) > 180 * 86400000 ? "#b91c1c" : "rgba(0,0,0,0.4)",
                        }}>
                          עודכן {inst.relationshipAt}
                          {(Date.now() - new Date(inst.relationshipAt).getTime()) > 180 * 86400000 && " · לרענן — עברה חצי שנה"}
                        </span>
                      )}
                      <input
                        value={inst.relationshipNote ?? ""}
                        onChange={e => update(inst.id, "relationshipNote", e.target.value)}
                        placeholder="מי מכיר אותנו שם ומה סוכם"
                        className="flex-1 min-w-[180px] text-[11.5px] px-2.5 py-1.5 rounded-lg"
                        style={{ border: "1px solid rgba(0,0,0,0.12)" }}
                      />
                    </div>

                    <div className="flex items-center gap-3 mt-3.5">
                      <button onClick={() => setEditId(inst.id)} className="text-[12.5px] font-black px-4 py-2 rounded-lg"
                        style={{ background: ORANGE, color: "#fff" }}>עריכה</button>
                      <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.35)" }}>
                        {inst.verified ? `אומת: ${inst.verified}` : "לא אומת"}
                        {" · "}{inst.domains.map(d => DOMAIN_LABEL[d]).join(" · ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Editor */}
                {open && editId === inst.id && (
                  <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <button onClick={() => setEditId(null)} className="text-[12px] font-bold my-2.5 px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}>← סיום עריכה</button>
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

/**
 * מה שדורש פעולה — כולל **קורסים שהמחזור שלהם עבר**, שכבר ירדו מהמועמד
 * מעצמם ומחכים כאן לתאריך חדש. זה הפינג: לא מייל ולא התראה, אלא המסך
 * שהאדמין ממילא פותח.
 */
function AttentionStrip({ pendingCount, needsCheck }: { pendingCount: number; needsCheck: number }) {
  const courses = coursesNeedingAttention();
  if (!pendingCount && !needsCheck && !courses.length) return null;
  return (
    <div className="px-6 pt-3">
      <div className="max-w-[1000px] mx-auto rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5 items-center"
        style={{ background: "rgba(251,133,0,0.08)", border: "1px solid rgba(251,133,0,0.25)" }}>
        <span className="text-[12px] font-black" style={{ color: "#92400e" }}>דורש טיפול:</span>
        {pendingCount > 0 && (
          <span className="text-[12px] font-bold" style={{ color: "#92400e" }}>{pendingCount} ממתינים לאישור</span>
        )}
        {needsCheck > 0 && (
          <span className="text-[12px] font-bold" style={{ color: "#92400e" }}>{needsCheck} דורשים אימות</span>
        )}
        {courses.map(({ course, state }) => (
          <span key={course.id} className="text-[12px]" style={{ color: "#b91c1c" }}>
            <b>{course.name}</b> — {STATE_LABEL[state]}
          </span>
        ))}
      </div>
    </div>
  );
}

/** הלוח עטוף בשער הניהול — קוד אחד לכל הלוחות, נבדק מול השרת */
export default function GatedPage() {
  return <AdminGate><AdminInstitutionsPage /></AdminGate>;
}
