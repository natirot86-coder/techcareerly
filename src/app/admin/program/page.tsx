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

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { COORDINATOR_ROSTER, type CoordinatorProfile } from "@/data/coordinators";
import { coordinatorAuthHeaders } from "@/lib/coordinatorAuth";
import { DOMAIN_LABEL, type Domain } from "@/data/institutions";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const ROSTER_KEY = "admin-roster-draft";
const ASSIGN_KEY = "admin-assignments";

type Person = {
  id: string; name: string; stage: number; seenAt: string | null;
  anonymous: boolean; region: string | null; domain: string | null; phone: string | null;
};

export default function ProgramAdmin() {
  const [roster, setRoster] = useState<CoordinatorProfile[]>(COORDINATOR_ROSTER);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  // חיפוש באיזור השיוך (16.9) — לפי שם, אזור, תחום או טלפון
  const [search, setSearch] = useState("");

  useEffect(() => {
    try { setAssign(JSON.parse(localStorage.getItem(ASSIGN_KEY) ?? "{}")); } catch { /* ignore */ }
  }, []);

  /*
   * הסגל נטען מה-DB — עריכה נשמרת מיד, בלי JSON (נתי 23.8).
   *
   * תוקן 16.9: "הוספת רכזת לא עובד" — התקלה הייתה מירוץ. loadPeople קורא
   * ל-loadRoster ברקע ב-mount, ואם מישהו לחץ "+ רכזת" בחלון הזמן הזה
   * (בדיוק מה שקורה כשזו הפעולה הראשונה בעמוד), ה-GET הזה היה מחליף את
   * כל ה-state ומוחק את השורה החדשה מהתצוגה — גם אם ה-POST שלה כבר נשלח
   * ואפילו הצליח, כי ה-GET נשלח *לפני* שהוא הגיע לשרת. עכשיו ממזגים לפי
   * id במקום להחליף: שורה מקומית שעוד אין לה תשובה מהשרת נשמרת.
   */
  const loadRoster = useCallback(async () => {
    try {
      const headers = await coordinatorAuthHeaders();
      const res = await fetch("/api/roster", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.roster?.length) {
          setRoster(prev => {
            const fresh: CoordinatorProfile[] = data.roster;
            const freshIds = new Set(fresh.map(c => c.id));
            const pendingLocal = prev.filter(c => !freshIds.has(c.id));
            return [...fresh, ...pendingLocal];
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const saveTimer = { current: null as ReturnType<typeof setTimeout> | null };
  async function persistRow(row: CoordinatorProfile) {
    const headers = { "content-type": "application/json", ...(await coordinatorAuthHeaders()) };
    fetch("/api/roster", { method: "POST", headers, body: JSON.stringify(row) })
      .then(r => { if (!r.ok) setErr("שמירת הרכזת נכשלה — ההזדהות עלולה לפוג, נסה/י לרענן"); else setToast("נשמר ✓"); })
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
  async function setAssignment(personId: string, coordId: string) {
    const next = { ...assign, [personId]: coordId };
    setAssign(next);
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(next));
    // השיוך האמיתי — במסד, דרך צד השרת. אם המיגרציה טרם רצה נקבל הודעה ברורה
    const headers = { "content-type": "application/json", ...(await coordinatorAuthHeaders()) };
    fetch("/api/coordinator", { method: "POST", headers, body: JSON.stringify({ candidateId: personId, coordinatorId: coordId }) })
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setErr(j?.error ?? "השיוך נשמר מקומית בלבד");
        }
      })
      .catch(() => setErr("השיוך נשמר מקומית בלבד — אין חיבור לשרת"));
  }

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const headers = await coordinatorAuthHeaders();
      const res = await fetch("/api/coordinator", { headers });
      if (!res.ok) throw new Error(res.status === 401 ? "ההזדהות פגה — נסה/י לרענן" : `שגיאה ${res.status}`);
      const data = await res.json();
      const all = [...(data.needsAttention ?? []), ...(data.quietList ?? [])];
      setPeople(all.map((q: {
        id: string; name: string; stage?: number; lastActive?: string | null;
        anonymous?: boolean; region?: string | null; domain?: string | null; phone?: string | null;
      }) => ({
        id: q.id, name: q.name || "ללא שם", stage: q.stage ?? 0, seenAt: q.lastActive ?? null,
        anonymous: !!q.anonymous, region: q.region ?? null, domain: q.domain ?? null, phone: q.phone ?? null,
      })));
      // השיוך שכבר במסד גובר על מה שבדפדפן
      const fromDb: Record<string, string> = {};
      for (const q of all as { id: string; coordinatorId?: string | null }[]) {
        if (q.coordinatorId) fromDb[q.id] = q.coordinatorId;
      }
      if (Object.keys(fromDb).length) setAssign(prev => ({ ...prev, ...fromDb }));
      loadRoster();
      if (!all.length) setErr("החיבור עבד אבל אין עדיין נתוני משתתפים בתשובה");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, [loadRoster]);

  // השער עבר ל-AdminGate ברמת ה-layout (7.9) — טוענים אוטומטית, בלי כפתור קוד
  useEffect(() => { loadPeople(); }, [loadPeople]);

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
          <div className="flex flex-col gap-3">
            {roster.map(c => {
              const count = Object.values(assign).filter(v => v === c.id).length;
              return (
                <div key={c.id} className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: "#fff", border: `1px solid ${c.active ? "rgba(2,62,138,0.12)" : "rgba(0,0,0,0.08)"}`, opacity: c.active ? 1 : 0.6 }}>

                  {/* שם + פעילה + מונה משתתפים — שורת הזיהוי, מודגשת יותר משאר השדות */}
                  <div className="flex items-center gap-3">
                    <input
                      value={c.name}
                      onChange={e => update(c.id, "name", e.target.value)}
                      placeholder="שם הרכזת"
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg text-[14px] font-black"
                      style={{ border: "1px solid rgba(0,0,0,0.12)", color: NAVY }}
                    />
                    <label className="flex items-center gap-1.5 text-[12px] font-bold shrink-0" style={{ color: "rgba(0,0,0,0.55)" }}>
                      <input type="checkbox" checked={c.active} onChange={e => update(c.id, "active", e.target.checked)} />
                      פעילה
                    </label>
                    <div className="text-[12px] font-black shrink-0 px-2.5 py-1 rounded-full" style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}>
                      {count} משתתפים
                    </div>
                  </div>

                  {/* פרטי קשר — כל שדה עם תווית משלו, כדי שהכיתוב הארוך (מייל ה-Cal, פורמט הטלפון) לא ידחוק שדות אחרים */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label className="text-[11px] font-bold flex flex-col gap-1" style={{ color: "rgba(0,0,0,0.45)" }}>
                      אזור
                      <input
                        value={c.location}
                        onChange={e => update(c.id, "location", e.target.value)}
                        className="px-2.5 py-2 rounded-lg text-[12.5px] font-normal"
                        style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#1c1a16" }}
                      />
                    </label>
                    <label className="text-[11px] font-bold flex flex-col gap-1" style={{ color: "rgba(0,0,0,0.45)" }}>
                      מייל חשבון ה-Cal (לזיהוי הזמנות!)
                      <input
                        value={c.email}
                        onChange={e => update(c.id, "email", e.target.value)}
                        dir="ltr"
                        className="px-2.5 py-2 rounded-lg text-[12.5px] font-normal"
                        style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#1c1a16" }}
                      />
                    </label>
                    <label className="text-[11px] font-bold flex flex-col gap-1" style={{ color: "rgba(0,0,0,0.45)" }}>
                      טלפון (גם 05… בסדר)
                      <input
                        value={c.phone}
                        onChange={e => update(c.id, "phone", e.target.value)}
                        dir="ltr"
                        className="px-2.5 py-2 rounded-lg text-[12.5px] font-normal"
                        style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#1c1a16" }}
                      />
                    </label>
                  </div>

                  {/* קישור ההרשמה האישי — מועמד שנכנס דרכו משויך לרכזת מהרגע הראשון */}
                  <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(2,62,138,0.03)", border: "1px solid rgba(2,62,138,0.08)" }}>
                    <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1" style={{ color: "rgba(0,0,0,0.4)" }}>קישור הזמנה אישי</div>
                    <code className="text-[11.5px] font-bold select-all block truncate" dir="ltr" style={{ color: NAVY }}>
                      {`https://hasifaapp.vercel.app/onboarding?coord=${c.id}`}
                    </code>
                  </div>

                  {/* היומן האישי: כל רכזת עם חשבון Cal משלה. המייל למעלה חייב להיות
                      המייל של חשבון ה-Cal — לפיו המערכת מזהה את ההזמנות שלה */}
                  <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(2,62,138,0.03)", border: "1px solid rgba(2,62,138,0.08)" }}>
                    <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "rgba(0,0,0,0.4)" }}>יומן Cal (מה שאחרי cal.com/)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {([["cal_m1", "פגישה 1"], ["cal_m2", "פגישה 2"], ["cal_m3", "פגישה 3"]] as const).map(([k, label]) => (
                        <input
                          key={k}
                          value={c[k] ?? ""}
                          onChange={e => update(c.id, k, e.target.value)}
                          placeholder={label}
                          dir="ltr"
                          className="px-2.5 py-2 rounded-lg text-[11.5px]"
                          style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#fff" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── המשתתפים והשיוך ── */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="text-[16px] font-black" style={{ color: NAVY }}>המשתתפים</div>
            {people.length > 0 && (
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש — שם, טלפון, אזור או תחום"
                className="px-3 py-1.5 rounded-lg text-[12.5px] w-full sm:w-[260px]"
                style={{ border: "1px solid rgba(0,0,0,0.15)" }}
              />
            )}
          </div>
          {people.length === 0 ? (
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
              <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                {loading ? "טוען משתתפים…" : err || "אין עדיין נתוני משתתפים"}
              </div>
              {!loading && (
                <button onClick={() => loadPeople()} className="self-start px-4 py-2 rounded-xl text-white text-[13px] font-black" style={{ background: NAVY }}>
                  נסה/י שוב
                </button>
              )}
            </div>
          ) : (() => {
            const q = search.trim().toLowerCase();
            const filtered = !q ? people : people.filter(p =>
              p.name.toLowerCase().includes(q) ||
              p.id.toLowerCase().includes(q) ||
              (p.phone ?? "").toLowerCase().includes(q) ||
              (p.region ?? "").toLowerCase().includes(q) ||
              (p.domain ?? "").toLowerCase().includes(q)
            );
            return (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              {q && (
                <div className="px-3 py-2 text-[11.5px]" style={{ background: "rgba(2,62,138,0.04)", color: "rgba(0,0,0,0.5)" }}>
                  {filtered.length} מתוך {people.length}
                </div>
              )}
              <table className="w-full text-[12.5px]" style={{ background: "#fff" }}>
                <thead>
                  <tr style={{ background: "rgba(2,62,138,0.05)", color: NAVY }}>
                    {["מזהה", "טלפון", "אזור · תחום", "שלב", "נראה לאחרונה", "רכזת"].map(h => (
                      <th key={h} className="text-right px-3 py-2.5 font-black">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-4 text-center" style={{ color: "rgba(0,0,0,0.4)" }}>אין תוצאות ל"{search}"</td></tr>
                  )}
                  {filtered.map(p => (
                    <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <td className="px-3 py-2 font-bold">
                        {p.name}
                        {/* מזהה קצר למועמד/ת ללא שם (16.9) — בלעדיו כמה שורות "מועמד/ת ללא שם" נראות זהות */}
                        {p.anonymous && <span className="font-bold" style={{ color: "rgba(0,0,0,0.35)" }}> #{p.id.slice(-4)}</span>}
                      </td>
                      <td className="px-3 py-2" dir="ltr" style={{ color: "rgba(0,0,0,0.6)" }}>
                        {p.phone ? `+${p.phone}` : "—"}
                      </td>
                      <td className="px-3 py-2" style={{ color: "rgba(0,0,0,0.6)" }}>
                        {[p.region, p.domain ? (DOMAIN_LABEL[p.domain as Domain] ?? p.domain) : null].filter(Boolean).join(" · ") || "—"}
                      </td>
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
            );
          })()}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-white text-[13px] font-bold"
          style={{ background: NAVY }}>{toast}</div>
      )}
    </div>
  );
}
