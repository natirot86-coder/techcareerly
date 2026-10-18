"use client";

/**
 * עריכת פרטי משתתף/ת — טופס אחד לכולם (נתי, 16.10).
 *
 * מי שעוד לא נכנס לאפליקציה והמשתתף/ת שכבר בפנים נערכים **באותו טופס**.
 * השרת (/api/participant) מחליט לאן זה נכתב: ללוח, או לאפליקציה ומשם עותק
 * ללוח. הטופס לא צריך לדעת, והרכזת לא צריכה לדעת.
 *
 * ⚠️ רק פרטים — לא בחירות. תחום ומסלול שייכים למשתתף/ת (נתי).
 * ⚠️ טלפון מאומת מוצג נעול, עם ההסבר למה.
 */
import { useEffect, useState } from "react";
import { coordinatorAuthHeaders } from "@/lib/coordinatorAuth";

const NAVY = "#023e8a";

type Values = {
  firstName: string; lastName: string; gender: string; city: string;
  email: string; phone: string; coordinatorId: string | null;
};
type Loaded = {
  itemId: string | null; candidateId: string | null; owner: "app" | "board";
  phoneVerified: boolean; values: Values; canAssign: boolean; staff: { id: string; name: string }[];
};

export default function ParticipantEdit({ itemId, candidateId, onClose, onSaved }: {
  itemId?: string; candidateId?: string; onClose: () => void; onSaved: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<Values | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");

  useEffect(() => {
    (async () => {
      const qs = itemId ? `itemId=${encodeURIComponent(itemId)}` : `candidateId=${encodeURIComponent(candidateId ?? "")}`;
      const r = await fetch(`/api/participant?${qs}`, { headers: await coordinatorAuthHeaders() });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j) { setErr(j?.error ?? "לא הצלחנו לטעון את הפרטים"); return; }
      setLoaded(j);
      const v = j.values as Values;
      /* בתצוגה הטלפון מקומי (05…) — כך מקלידים אותו */
      setDraft({ ...v, phone: v.phone ? "0" + v.phone.slice(3) : "" });
    })().catch(() => setErr("אין חיבור לשרת"));
  }, [itemId, candidateId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  async function save() {
    if (!loaded || !draft) return;
    setSaving(true); setErr(""); setWarn("");
    try {
      const v = loaded.values;
      const localPhone = v.phone ? "0" + v.phone.slice(3) : "";
      /* שולחים רק מה שהשתנה — כך היומן מתעד שינויים ולא שמירות */
      const body: Record<string, unknown> = { itemId: loaded.itemId ?? undefined, candidateId: loaded.candidateId ?? undefined };
      (["firstName", "lastName", "gender", "city", "email"] as const).forEach(k => { if (draft[k] !== v[k]) body[k] = draft[k]; });
      if (!loaded.phoneVerified && draft.phone !== localPhone) body.phone = draft.phone;
      if (loaded.canAssign && draft.coordinatorId !== v.coordinatorId) body.coordinatorId = draft.coordinatorId;
      const r = await fetch("/api/participant", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...(await coordinatorAuthHeaders()) },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) { setErr(j?.error ?? "השמירה נכשלה"); return; }
      if (j?.boardWarning) { setWarn(j.boardWarning); setTimeout(onSaved, 2500); return; }
      onSaved();
    } catch {
      setErr("אין חיבור לשרת — השינוי לא נשמר");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, input: React.ReactNode, hint?: string) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#8d867a" }}>
      {label}
      {input}
      {hint && <span style={{ fontSize: 11, fontWeight: 500, color: "#a39d91", lineHeight: 1.5 }}>{hint}</span>}
    </label>
  );
  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)",
    fontSize: 14, fontFamily: "'Heebo', sans-serif", color: "#1c1a16", background: "#fff",
  };
  const set = (k: keyof Values) => (e: { target: { value: string } }) =>
    setDraft(d => d ? { ...d, [k]: e.target.value } : d);

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY, fontFamily: "'Heebo', sans-serif" }}>עריכת פרטי משתתף/ת</div>
          {loaded && (
            <div style={{ fontSize: 12, color: "#8d867a", marginTop: 4, lineHeight: 1.6 }}>
              {loaded.owner === "app"
                ? "נכנס/ה לאפליקציה — השינוי נשמר באפליקציה ומתעדכן גם בלוח."
                : "עוד לא נכנס/ה לאפליקציה — השינוי נשמר בלוח אינטק."}
            </div>
          )}
        </div>

        {!draft && !err && <div style={{ fontSize: 13, color: "#8d867a" }}>טוען…</div>}

        {draft && loaded && (<>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {field("שם פרטי", <input value={draft.firstName} onChange={set("firstName")} style={inputStyle} />)}
            {field("שם משפחה", <input value={draft.lastName} onChange={set("lastName")} style={inputStyle} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {field("מגדר", (
              <select value={draft.gender} onChange={set("gender")} style={inputStyle}>
                <option value="">לא צוין</option>
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
                <option value="other">אחר</option>
              </select>
            ))}
            {field("עיר מגורים", <input value={draft.city} onChange={set("city")} style={inputStyle} />)}
          </div>
          {field("טלפון",
            <input value={draft.phone} onChange={set("phone")} dir="ltr" disabled={loaded.phoneVerified}
              style={{ ...inputStyle, textAlign: "left", ...(loaded.phoneVerified ? { background: "#f5f3ee", color: "#8d867a" } : {}) }} />,
            loaded.phoneVerified
              ? "✓ אומת ב-SMS. זו הזהות של המשתתף/ת ולכן לא נערכת מכאן."
              : "לא אומת ב-SMS — אפשר לתקן אם הוקלד עם טעות.")}
          {field("מייל", <input value={draft.email} onChange={set("email")} dir="ltr" style={{ ...inputStyle, textAlign: "left" }} />)}
          {loaded.canAssign && field("רכז/ת", (
            <select value={draft.coordinatorId ?? ""} onChange={e => setDraft(d => d ? { ...d, coordinatorId: e.target.value || null } : d)} style={inputStyle}>
              <option value="">טרם שויך/ה</option>
              {loaded.staff.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ))}
        </>)}

        {err && <div style={{ fontSize: 12.5, color: "#dc2626", fontWeight: 700, lineHeight: 1.6 }}>{err}</div>}
        {warn && <div style={{ fontSize: 12.5, color: "#b45309", fontWeight: 700, lineHeight: 1.6 }}>{warn}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={save} disabled={saving || !draft}
            style={{ flex: 1, padding: 11, borderRadius: 12, border: "none", background: NAVY, color: "#fff", fontSize: 14.5, fontWeight: 900, cursor: saving ? "default" : "pointer", opacity: saving || !draft ? 0.6 : 1, fontFamily: "'Heebo', sans-serif" }}>
            {saving ? "שומר…" : "שמירה"}
          </button>
          <button onClick={onClose} disabled={saving}
            style={{ flex: 1, padding: 11, borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "#5b5648", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: "'Heebo', sans-serif" }}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
