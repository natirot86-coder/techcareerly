"use client";

/**
 * /admin/events — לוח האירועים (נתי 27.8).
 *
 * ימים פתוחים, פאנלים וירידי לימודים — של התוכנית ושל מוסדות. הצוות
 * מעדכן לבד, כמו סגל הרכזות: שמירה מיידית ל-DB, בלי JSON ובלי קלוד באמצע.
 *
 * **התאריך מנהל:** אירוע שעבר נעלם מהמועמד מעצמו ונשאר כאן באפור, כדי
 * שאפשר יהיה לעדכן לו תאריך חדש במקום להקים מחדש. שיוך למוסד הוא רשות —
 * ריק = אירוע כללי לכולם; מלא = מודגש למי שבחר את המוסד הזה.
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { INSTITUTIONS } from "@/data/institutions";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Ev = {
  id: string; title: string; organizer: string; starts_at: string;
  city: string; link: string; note: string; institution_id: string; active: boolean;
};

const EMPTY = (): Ev => ({
  id: `ev-${Date.now()}`, title: "", organizer: "", starts_at: "",
  city: "", link: "", note: "", institution_id: "", active: true,
});

/** ISO ↔ הקלט של datetime-local (שעון מקומי) */
function toInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const toIso = (v: string) => (v ? new Date(v).toISOString() : "");

export default function EventsAdmin() {
  const [code, setCode] = useState("");
  const [events, setEvents] = useState<Ev[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("coordinator-code");
      if (saved) { setCode(saved); load(saved); }
    } catch { /* ignore */ }
  }, []);

  async function load(c: string) {
    setErr("");
    try {
      const res = await fetch("/api/events?all=1", { headers: { "x-coordinator-code": c } });
      if (!res.ok) throw new Error("קוד שגוי");
      const data = await res.json();
      sessionStorage.setItem("coordinator-code", c);
      setEvents(data.events ?? []);
      setLoaded(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    }
  }

  function persist(row: Ev) {
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", "x-coordinator-code": code },
      body: JSON.stringify(row),
    })
      .then(r => {
        if (!r.ok) setErr("השמירה נכשלה — בדוק/י את הקוד");
        else { setToast("נשמר ✓"); setTimeout(() => setToast(""), 1500); }
      })
      .catch(() => setErr("אין חיבור לשרת — השינוי לא נשמר"));
  }

  function update(id: string, key: keyof Ev, value: string | boolean) {
    const next = events.map(e => (e.id === id ? { ...e, [key]: value } : e));
    setEvents(next);
    if (timer.current) clearTimeout(timer.current);
    const row = next.find(e => e.id === id);
    // שמירה מרוסנת, ורק כשיש מינימום שמותר לשמור
    if (row && row.title && row.starts_at) timer.current = setTimeout(() => persist(row), 700);
  }

  const past = (e: Ev) => !!e.starts_at && new Date(e.starts_at).getTime() < Date.now();
  const degrees = INSTITUTIONS.filter(i => i.track === "degree");
  const field = "w-full mt-1 px-3 py-2 rounded-lg text-[13.5px] font-normal";
  const fieldStyle = { border: "1px solid rgba(0,0,0,0.12)", color: "#1c1a16" };
  const labelStyle = { color: "rgba(0,0,0,0.5)" };

  if (!loaded) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}>
        <div className="w-full max-w-[380px] rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="text-[18px] font-black mb-1" style={{ color: NAVY }}>לוח האירועים</div>
          <p className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
            ימים פתוחים, פאנלים וירידי לימודים. אותו קוד גישה של מסך הרכזת.
          </p>
          <input
            type="password" value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load(code)}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] mb-3"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }}
          />
          <button onClick={() => load(code)} className="w-full py-2.5 rounded-xl text-[14px] font-black text-white" style={{ background: NAVY }}>
            כניסה
          </button>
          {err && <div className="text-[12.5px] mt-3 font-bold" style={{ color: "#b91c1c" }}>{err}</div>}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#fbf9f5", fontFamily: "'Heebo', sans-serif" }}>
      <div className="text-white px-6 pt-6 pb-7" style={{ background: NAVY }}>
        <div className="max-w-[1000px] mx-auto">
          <Link href="/admin" className="text-[12px] font-bold block mb-3" style={{ opacity: 0.6 }}>← לאפליקציה</Link>
          <div className="text-[26px] font-black">לוח האירועים</div>
          <div className="text-[13px] mt-1" style={{ opacity: 0.72 }}>
            {events.filter(e => !past(e)).length} קרובים · {events.filter(past).length} שעברו
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-6 flex flex-col gap-4">
        <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.7]" style={{ background: "#ecfdf5", border: "1px solid #cfe9dd", color: "#065f46" }}>
          <b>נשמר אוטומטית.</b> אירוע שהתאריך שלו עבר נעלם מהמועמדים מעצמו ונשאר כאן באפור —
          אפשר פשוט לעדכן לו תאריך חדש. <b>שיוך למוסד הוא רשות:</b> בלי שיוך האירוע מוצג לכולם,
          ועם שיוך הוא מודגש למי שבחר את המוסד הזה.
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[16px] font-black" style={{ color: NAVY }}>אירועים</div>
          <button
            onClick={() => setEvents([EMPTY(), ...events])}
            className="text-[12.5px] font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}
          >
            + אירוע
          </button>
        </div>

        {events.length === 0 && (
          <div className="rounded-2xl p-6 text-center text-[13.5px]" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.45)" }}>
            עוד אין אירועים. לחצו על &quot;+ אירוע&quot; כדי להוסיף את הראשון.
          </div>
        )}

        {events.map(ev => (
          <div key={ev.id} className="rounded-2xl p-4"
            style={{ background: "#fff", border: `1px solid ${past(ev) ? "rgba(0,0,0,0.06)" : "rgba(2,62,138,0.15)"}`, opacity: past(ev) ? 0.6 : 1 }}>
            {past(ev) && <div className="text-[11.5px] font-black mb-2" style={{ color: "#8a8377" }}>עבר — לא מוצג למועמדים</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <label className="text-[11.5px] font-bold" style={labelStyle}>
                כותרת
                <input value={ev.title} onChange={e => update(ev.id, "title", e.target.value)}
                  placeholder="יום פתוח בבן-גוריון" className={field} style={fieldStyle} />
              </label>
              <label className="text-[11.5px] font-bold" style={labelStyle}>
                מי מארגן
                <input value={ev.organizer} onChange={e => update(ev.id, "organizer", e.target.value)}
                  placeholder="תוכנית החשיפה / שם המוסד" className={field} style={fieldStyle} />
              </label>
              <label className="text-[11.5px] font-bold" style={labelStyle}>
                מתי
                <input type="datetime-local" value={toInput(ev.starts_at)}
                  onChange={e => update(ev.id, "starts_at", toIso(e.target.value))} className={field} style={fieldStyle} />
              </label>
              <label className="text-[11.5px] font-bold" style={labelStyle}>
                עיר (ריק = אונליין)
                <input value={ev.city} onChange={e => update(ev.id, "city", e.target.value)}
                  placeholder="באר שבע" className={field} style={fieldStyle} />
              </label>
              <label className="text-[11.5px] font-bold" style={labelStyle}>
                קישור להרשמה / פרטים
                <input value={ev.link} onChange={e => update(ev.id, "link", e.target.value)}
                  placeholder="https://" dir="ltr" className={field} style={fieldStyle} />
              </label>
              <label className="text-[11.5px] font-bold" style={labelStyle}>
                שיוך למוסד (רשות)
                <select value={ev.institution_id} onChange={e => update(ev.id, "institution_id", e.target.value)}
                  className={field} style={{ ...fieldStyle, background: "#fff" }}>
                  <option value="">— אירוע כללי, מוצג לכולם —</option>
                  {degrees.map(i => <option key={i.id} value={i.id}>{i.name.split(" — ")[0]}</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-[12.5px] font-bold shrink-0" style={{ color: "rgba(0,0,0,0.55)" }}>
                <input type="checkbox" checked={ev.active} onChange={e => update(ev.id, "active", e.target.checked)} />
                פעיל
              </label>
              <input value={ev.note} onChange={e => update(ev.id, "note", e.target.value)}
                placeholder="הערה קצרה (רשות)" className="flex-1 px-3 py-2 rounded-lg text-[12.5px]"
                style={{ border: "1px solid rgba(0,0,0,0.1)" }} />
            </div>
          </div>
        ))}

        {err && <div className="text-[13px] font-bold" style={{ color: "#b91c1c" }}>{err}</div>}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-[13px] font-black text-white" style={{ background: ORANGE }}>
          {toast}
        </div>
      )}
    </div>
  );
}
