"use client";

/**
 * אירועים — רכיב אחד לשלושת החלונות (נתי 27.8): קהילה, שלב 5, מגירת המסע.
 *
 * העיקרון: **התאריך מנהל.** ה-API מחזיר רק אירועים שטרם עברו, ולכן אין
 * כאן שום סינון ידני ואירוע ישן לא יכול להישאר תקוע על המסך.
 *
 * `highlightInstitution` מדגיש את מי ששייך למוסד שהמועמד בחר — אירוע ללא
 * שיוך מוצג לכולם. לחיצה נמדדת (`event_click`): התעניינות ביום פתוח היא
 * מסיגנלי המחויבות החזקים שיש, ושווה לרכזת לפני פגישה.
 */

import { useState, useEffect } from "react";
import { logEvent } from "@/lib/candidate";

export type AppEvent = {
  id: string; title: string; organizer: string; starts_at: string;
  city: string; link: string; note: string; institution_id: string;
};

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

/** משיכת האירועים הקרובים — פעם אחת לכל מסך */
export function useEvents(): AppEvent[] {
  const [events, setEvents] = useState<AppEvent[]>([]);
  useEffect(() => {
    fetch("/api/events")
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => { /* אין אירועים — פשוט לא מציגים כלום */ });
  }, []);
  return events;
}

export function whenText(iso: string): string {
  const d = new Date(iso);
  const days = Math.ceil((+d - Date.now()) / 86400000);
  const date = d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  const rel = days <= 0 ? "היום" : days === 1 ? "מחר" : days <= 7 ? `בעוד ${days} ימים` : "";
  return rel ? `${rel} · ${date}, ${time}` : `${date}, ${time}`;
}

export default function EventsList({
  events, highlightInstitution, limit,
}: {
  events: AppEvent[];
  highlightInstitution?: string | null;
  limit?: number;
}) {
  const shown = limit ? events.slice(0, limit) : events;
  if (!shown.length) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {shown.map(ev => {
        const mine = !!highlightInstitution && ev.institution_id === highlightInstitution;
        const body = (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="text-[14.5px] font-black leading-snug" style={{ color: NAVY }}>{ev.title}</div>
              {mine && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(251,133,0,0.14)", color: "#b35e00" }}>
                  המוסד שלך
                </span>
              )}
            </div>
            <div className="text-[12.5px] font-bold mt-1" style={{ color: ORANGE }}>{whenText(ev.starts_at)}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>
              {[ev.organizer, ev.city || "אונליין"].filter(Boolean).join(" · ")}
            </div>
            {ev.note && <div className="text-[12px] mt-1.5" style={{ color: "rgba(0,0,0,0.45)" }}>{ev.note}</div>}
            {ev.link && <div className="text-[12.5px] font-bold mt-2" style={{ color: NAVY }}>לפרטים והרשמה ↗</div>}
          </>
        );
        const style = {
          background: "#fff",
          border: mine ? `1.5px solid ${ORANGE}` : "1px solid rgba(0,0,0,0.08)",
          textDecoration: "none",
        };
        return ev.link ? (
          <a key={ev.id} href={ev.link} target="_blank" rel="noopener noreferrer"
            onClick={() => logEvent("event_click", { id: ev.id, title: ev.title })}
            className="block rounded-2xl px-4 py-3.5" style={style}>
            {body}
          </a>
        ) : (
          <div key={ev.id} className="rounded-2xl px-4 py-3.5" style={style}>{body}</div>
        );
      })}
    </div>
  );
}
