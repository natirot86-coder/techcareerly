"use client";

/**
 * דף מנהל התוכנית — סגל הרכזות והשיוך למשתתפים (נתי 20.8).
 *
 * שתי טבלאות: הרכזות (שם · אזור · מייל · טלפון) והמשתתפים עם שיוך רכזת.
 * המשתתפים נמשכים מאותו API של מסך הרכזת (אותו קוד גישה).
 *
 * ⚠️ השיוך נשמר כרגע בדפדפן הזה בלבד + ייצוא JSON — בדיוק כמו לוחות
 * המוסדות. הצעד האמיתי הוא עמודת coordinator_id ב-candidates (SQL אצל
 * נתי) — ואז השיוך יזין גם את הטלפון שכל מועמד רואה. עד אז כולם משויכים
 * לרכזת הפעילה הראשונה.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { COORDINATOR_ROSTER, type CoordinatorProfile } from "@/data/coordinators";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const ROSTER_KEY = "admin-roster-draft";
const ASSIGN_KEY = "admin-assignments";

type Person = { id: string; name: string; stage: number; seenAt: string | null };

export default function ProgramAdmin() {
  const [roster, setRoster] = useState<CoordinatorProfile[]>(COORDINATOR_ROSTER);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [people, setPeople] = useState<Person[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROSTER_KEY);
      if (saved) {
        // מיזוג, לא החלפה — אותו לקח כמו בלוחות המוסדות והתארים
        const stored: CoordinatorProfile[] = JSON.parse(saved);
        const byId = new Map(stored.map(c => [c.id, c]));
        const codeIds = new Set(COORDINATOR_ROSTER.map(c => c.id));
        setRoster([
          ...COORDINATOR_ROSTER.map(c => byId.get(c.id) ?? c),
          ...stored.filter(c => !codeIds.has(c.id)),
        ]);
      }
      setAssign(JSON.parse(localStorage.getItem(ASSIGN_KEY) ?? "{}"));
      const savedCode = sessionStorage.getItem("coordinator-code");
      if (savedCode) setCode(savedCode);
    } catch { /* ignore */ }
  }, []);

  function saveRoster(next: CoordinatorProfile[]) {
    setRoster(next);
    localStorage.setItem(ROSTER_KEY, JSON.stringify(next));
  }
  function update(id: string, key: keyof CoordinatorProfile, value: string | boolean) {
    saveRoster(roster.map(c => (c.id === id ? { ...c, [key]: value } : c)));
  }
  function addCoordinator() {
    const id = `coord-${Date.now()}`;
    saveRoster([...roster, { id, name: "", location: "", email: "", phone: "", active: true }]);
  }
  function setAssignment(personId: string, coordId: string) {
    const next = { ...assign, [personId]: coordId };
    setAssign(next);
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(next));
  }

  async function loadPeople() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/coordinator?code=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error(res.status === 401 ? "קוד שגוי" : `שגיאה ${res.status}`);
      const data = await res.json();
      sessionStorage.setItem("coordinator-code", code);
      const all = [...(data.needsAttention ?? []), ...(data.quietList ?? [])];
      setPeople(all.map((q: { id: string; name: string; stage?: number; lastActive?: string | null }) => ({
        id: q.id, name: q.name || "ללא שם", stage: q.stage ?? 0, seenAt: (q as unknown as { lastActive?: string | null }).lastActive ?? null,
      })));
      if (!all.length) setErr("החיבור עבד אבל אין עדיין נתוני משתתפים בתשובה");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  function exportJson() {
    const payload = JSON.stringify({ roster, assignments: assign }, null, 2);
    navigator.clipboard.writeText(payload).then(() => {
      setToast("הועתק — לשלוח לקלוד להטמעה בקוד");
      setTimeout(() => setToast(""), 2500);
    });
  }

  const nameOf = (id: string) => roster.find(c => c.id === id)?.name || "—";

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}>
      <div className="text-white px-6 pt-6 pb-7" style={{ background: NAVY }}>
        <div className="max-w-[1000px] mx-auto">
          <Link href="/admin" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.6 }}>← לאפליקציה</Link>
          <div className="text-[26px] font-black">ניהול תוכנית חשיפה</div>
          <div className="text-[13px] mt-1" style={{ opacity: 0.72 }}>
            סגל הרכזות · שיוך משתתפים · {roster.filter(c => c.active).length} רכזות פעילות
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-6 flex flex-col gap-6">

        <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.7]"
          style={{ background: "#fff7ec", border: "1px solid #f5dcb8", color: "#8a4d00" }}>
          <b>השיוך נשמר בדפדפן הזה + ייצוא JSON.</b> החיבור המלא — עמודת שיוך
          במסד — ממתין להרצת SQL (אצל נתי). עד אז כל המועמדים רואים את פרטי
          הרכזת הפעילה הראשונה ברשימה.
        </div>

        {/* ── סגל הרכזות ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[16px] font-black" style={{ color: NAVY }}>הרכזות</div>
            <div className="flex gap-2">
              <button onClick={addCoordinator} className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}>+ רכזת</button>
              <button onClick={exportJson} className="text-[12px] font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ background: ORANGE }}>העתק JSON</button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
            <table className="w-full text-[12.5px]" style={{ background: "#fff" }}>
              <thead>
                <tr style={{ background: "rgba(2,62,138,0.05)", color: NAVY }}>
                  {["שם", "אזור", "מייל", "טלפון (9725…)", "פעילה", "משתתפים"].map(h => (
                    <th key={h} className="text-right px-3 py-2.5 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map(c => {
                  const count = Object.values(assign).filter(v => v === c.id).length;
                  return (
                    <tr key={c.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      {(["name", "location", "email", "phone"] as const).map(k => (
                        <td key={k} className="px-2 py-1.5">
                          <input
                            value={c[k]}
                            onChange={e => update(c.id, k, e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-[12.5px]"
                            style={{ border: "1px solid rgba(0,0,0,0.1)", direction: k === "email" || k === "phone" ? "ltr" : "rtl" }}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-center">
                        <input type="checkbox" checked={c.active} onChange={e => update(c.id, "active", e.target.checked)} />
                      </td>
                      <td className="px-3 py-1.5 font-black text-center" style={{ color: NAVY }}>{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── המשתתפים והשיוך ── */}
        <div>
          <div className="text-[16px] font-black mb-2" style={{ color: NAVY }}>המשתתפים</div>
          {people.length === 0 ? (
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
              <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                המשתתפים נמשכים מאותו חיבור של מסך הרכזת — אותו קוד גישה.
              </div>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="קוד גישה"
                  type="password"
                  className="flex-1 px-3 py-2.5 rounded-xl text-[13px]"
                  style={{ border: "1px solid rgba(0,0,0,0.15)", direction: "ltr" }}
                />
                <button onClick={loadPeople} disabled={loading || !code}
                  className="px-5 py-2.5 rounded-xl text-white text-[13px] font-black"
                  style={{ background: loading || !code ? "rgba(0,0,0,0.2)" : NAVY }}>
                  {loading ? "טוען…" : "טעינה"}
                </button>
              </div>
              {err && <div className="text-[12px] font-bold" style={{ color: "#b91c1c" }}>{err}</div>}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <table className="w-full text-[12.5px]" style={{ background: "#fff" }}>
                <thead>
                  <tr style={{ background: "rgba(2,62,138,0.05)", color: NAVY }}>
                    {["שם", "שלב", "נראה לאחרונה", "רכזת"].map(h => (
                      <th key={h} className="text-right px-3 py-2.5 font-black">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {people.map(p => (
                    <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <td className="px-3 py-2 font-bold">{p.name}</td>
                      <td className="px-3 py-2">{p.stage || "—"}</td>
                      <td className="px-3 py-2" style={{ color: "rgba(0,0,0,0.5)" }}>
                        {p.seenAt ? new Date(p.seenAt).toLocaleDateString("he-IL") : "—"}
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={assign[p.id] ?? ""}
                          onChange={e => setAssignment(p.id, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg text-[12.5px]"
                          style={{ border: "1px solid rgba(0,0,0,0.1)", background: assign[p.id] ? "rgba(5,150,105,0.06)" : "#fff" }}
                        >
                          <option value="">— לא משויך —</option>
                          {roster.filter(c => c.active).map(c => (
                            <option key={c.id} value={c.id}>{nameOf(c.id)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-white text-[13px] font-bold"
          style={{ background: NAVY }}>{toast}</div>
      )}
    </div>
  );
}
