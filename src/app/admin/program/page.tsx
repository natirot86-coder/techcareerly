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

import React, { useState, useEffect } from "react";
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
      setAssign(JSON.parse(localStorage.getItem(ASSIGN_KEY) ?? "{}"));
      const savedCode = sessionStorage.getItem("coordinator-code");
      if (savedCode) setCode(savedCode);
    } catch { /* ignore */ }
  }, []);

  /* הסגל נטען מה-DB ברגע שיש קוד — עריכה נשמרת מיד, בלי JSON (נתי 23.8) */
  async function loadRoster(c: string) {
    try {
      const res = await fetch("/api/roster", { headers: { "x-coordinator-code": c } });
      if (res.ok) {
        const data = await res.json();
        if (data.roster?.length) setRoster(data.roster);
      }
    } catch { /* ignore */ }
  }

  const saveTimer = { current: null as ReturnType<typeof setTimeout> | null };
  function persistRow(row: CoordinatorProfile) {
    const c = sessionStorage.getItem("coordinator-code") ?? code;
    fetch("/api/roster", {
      method: "POST",
      headers: { "content-type": "application/json", "x-coordinator-code": c },
      body: JSON.stringify(row),
    })
      .then(r => { if (!r.ok) setErr("שמירת הרכזת נכשלה — בדוק/י את הקוד"); else setToast("נשמר ✓"); })
      .then(() => setTimeout(() => setToast(""), 1500))
      .catch(() => setErr("אין חיבור לשרת — השינוי לא נשמר"));
  }
  function update(id: string, key: keyof CoordinatorProfile, value: string | boolean) {
    const next = roster.map(c => (c.id === id ? { ...c, [key]: value } : c));
    setRoster(next);
    // שמירה מרוסנת — כדי לא לירות בקשה על כל תו
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const row = next.find(c => c.id === id);
    if (row) saveTimer.current = setTimeout(() => persistRow(row), 700);
  }
  function addCoordinator() {
    const id = `coord-${Date.now()}`;
    const row = { id, name: "", location: "", email: "", phone: "", active: true, cal_m1: "", cal_m2: "", cal_m3: "" };
    setRoster([...roster, row]);
    persistRow(row);
  }
  function setAssignment(personId: string, coordId: string) {
    const next = { ...assign, [personId]: coordId };
    setAssign(next);
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(next));
    // השיוך האמיתי — במסד, דרך צד השרת. אם המיגרציה טרם רצה נקבל הודעה ברורה
    const c = sessionStorage.getItem("coordinator-code") ?? code;
    fetch("/api/coordinator", {
      method: "POST",
      headers: { "content-type": "application/json", "x-coordinator-code": c },
      body: JSON.stringify({ candidateId: personId, coordinatorId: coordId }),
    })
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setErr(j?.error ?? "השיוך נשמר מקומית בלבד");
        }
      })
      .catch(() => setErr("השיוך נשמר מקומית בלבד — אין חיבור לשרת"));
  }

  async function loadPeople() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/coordinator", { headers: { "x-coordinator-code": code } });
      if (!res.ok) throw new Error(res.status === 401 ? "קוד שגוי" : `שגיאה ${res.status}`);
      const data = await res.json();
      sessionStorage.setItem("coordinator-code", code);
      const all = [...(data.needsAttention ?? []), ...(data.quietList ?? [])];
      setPeople(all.map((q: { id: string; name: string; stage?: number; lastActive?: string | null }) => ({
        id: q.id, name: q.name || "ללא שם", stage: q.stage ?? 0, seenAt: (q as unknown as { lastActive?: string | null }).lastActive ?? null,
      })));
      // השיוך שכבר במסד גובר על מה שבדפדפן
      const fromDb: Record<string, string> = {};
      for (const q of all as { id: string; coordinatorId?: string | null }[]) {
        if (q.coordinatorId) fromDb[q.id] = q.coordinatorId;
      }
      if (Object.keys(fromDb).length) setAssign(prev => ({ ...prev, ...fromDb }));
      loadRoster(code);
      if (!all.length) setErr("החיבור עבד אבל אין עדיין נתוני משתתפים בתשובה");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
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
          style={{ background: "#ecfdf5", border: "1px solid #cfe9dd", color: "#065f46" }}>
          <b>מחובר למסד.</b> עריכת רכזת נשמרת אוטומטית תוך שנייה, והשיוך נכתב
          מיד — המועמד המשויך יקבל את הטלפון של הרכזת שלו בכפתור הוואטסאפ.
        </div>

        {/* ── סגל הרכזות ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[16px] font-black" style={{ color: NAVY }}>הרכזות</div>
            <div className="flex gap-2">
              <button onClick={addCoordinator} className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}>+ רכזת</button>

            </div>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
            <table className="w-full text-[12.5px]" style={{ background: "#fff" }}>
              <thead>
                <tr style={{ background: "rgba(2,62,138,0.05)", color: NAVY }}>
                  {["שם", "אזור", "מייל חשבון ה-Cal (לזיהוי הזמנות!)", "טלפון (גם 05… בסדר)", "פעילה", "משתתפים"].map(h => (
                    <th key={h} className="text-right px-3 py-2.5 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map(c => {
                  const count = Object.values(assign).filter(v => v === c.id).length;
                  return (
                    <React.Fragment key={c.id}>
                    <tr style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
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
                    {/* היומן האישי: כל רכזת עם חשבון Cal משלה. המייל למעלה חייב להיות
                        המייל של חשבון ה-Cal — לפיו המערכת מזהה את ההזמנות שלה */}
                    <tr>
                      <td colSpan={6} className="px-2 pb-2.5" style={{ background: "rgba(2,62,138,0.02)" }}>
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          <span className="text-[11.5px] font-bold whitespace-nowrap" style={{ color: "rgba(0,0,0,0.45)" }}>
                            יומן Cal (מה שאחרי cal.com/):
                          </span>
                          {([["cal_m1", "פגישה 1"], ["cal_m2", "פגישה 2"], ["cal_m3", "פגישה 3"]] as const).map(([k, label]) => (
                            <input
                              key={k}
                              value={c[k] ?? ""}
                              onChange={e => update(c.id, k, e.target.value)}
                              placeholder={label}
                              className="flex-1 min-w-[140px] px-2 py-1.5 rounded-lg text-[11.5px]"
                              style={{ border: "1px solid rgba(0,0,0,0.1)", direction: "ltr" }}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                    </React.Fragment>
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
