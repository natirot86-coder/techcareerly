"use client";

/**
 * כרטיס מוסד — **רכיב אחד לכל המסכים**.
 *
 * הוא מוצג בפאנל התואר, בקטלוג, ומתחת למפה. שלוש גרסאות של אותו כרטיס
 * היו נפרדות בזמן, וזה בדיוק הבאג שתיקנו כבר פעמיים בשבוע הזה.
 *
 * **למה המידע שלנו קודם, ורק בסופו קישור לאתר:**
 *   · אנחנו מחזיקים דברים שהאתר שלהם לעולם לא יגיד — מסלול קבלה בלי
 *     פסיכומטרי, הדלת הפתוחה, האזהרה הכנה, ולמי לפנות
 *   · **איש הקשר הוא יחידת התמיכה ולא מדור הרישום.** שם עונים "אינך
 *     עומד בתנאים" ולא מכירים מסלולי קבלה חלופיים, ושיחה כזו יכולה
 *     לסיים מסע. לשלוח לשם בלי הכנה זה לשלוח לדלת הלא נכונה
 *   · כל קישור חיצוני הוא יציאה. מי שעוזב בלי הקשר עלול לשפוט את
 *     המוסד לפי מה שהמוסד מספר על עצמו
 */

import { useState } from "react";
import { INSTITUTIONS } from "@/data/institutions";
import { FUNDING } from "@/data/scholarships";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

export type Inst = (typeof INSTITUTIONS)[number];

export default function InstitutionCard({
  inst, star, doors = [], inList, onToggleList, defaultOpen = false,
}: {
  inst: Inst;
  /** ✦ — סימון "מומלץ ללמוד כאן" */
  star?: boolean;
  /** הדלתות הפתוחות לתואר הנבחר. ריק במסכים שאין בהם תואר */
  doors?: (typeof FUNDING)[number][];
  inList?: boolean;
  onToggleList?: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const many = doors.length >= 2;

  const rows: [string, string | undefined][] = [
    ["למה דווקא כאן", inst.why],
    ["תנאי קבלה", inst.admission],
    ["בלי פסיכומטרי", inst.noPsychometric],
    ["מעטפת ותמיכה", inst.support],
    ["קשרי תעשייה", inst.industry],
    ["מבנה הלימודים", inst.schedule],
    ["ימים פתוחים", inst.openDays],
  ];
  const contact = [inst.contactName, inst.contactRole, inst.contactPhone, inst.contactEmail]
    .filter(Boolean).join(" · ");

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: many ? "rgba(5,150,105,0.06)" : star ? "rgba(251,133,0,0.06)" : "rgba(2,62,138,0.03)",
        border: `1px solid ${many ? "rgba(5,150,105,0.35)" : star ? "rgba(251,133,0,0.2)" : "rgba(2,62,138,0.07)"}`,
      }}
    >
      <button onClick={() => setOpen(!open)} className="w-full text-right px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12.5px] font-bold" style={{ color: NAVY }}>
            {star ? "✦ " : ""}{inst.name.split(" — ")[0]}
          </span>
          <span className="text-[10.5px] shrink-0" style={{ color: "rgba(0,0,0,0.35)" }}>
            {open ? "לסגור ▲" : "עוד ▼"}
          </span>
        </div>
        {doors.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {many && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "#059669", color: "#fff" }}>
                שתי דרכים להיכנס
              </span>
            )}
            {doors.map(f => (
              <span key={f.id} className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(251,133,0,0.1)", color: "#92400e" }}>
                דרך {f.name.split(" — ")[0]}
              </span>
            ))}
          </div>
        )}
        <div className="text-[11px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.5)" }}>
          {inst.address ?? inst.location}{inst.tuition ? ` · ${inst.tuition.split(".")[0]}` : ""}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2" style={{ borderTop: "1px dashed rgba(0,0,0,0.1)", paddingTop: 10 }}>
          {inst.warn && (
            <div className="rounded-lg px-3 py-2 text-[11px] leading-[1.65]" style={{ background: "rgba(220,38,38,0.06)", color: "#991b1b" }}>
              ⚠️ {inst.warn}
            </div>
          )}
          {rows.filter(([, v]) => v && v.trim()).map(([k, v]) => (
            <div key={k} className="text-[11px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>
              <b style={{ color: NAVY }}>{k}:</b> {v}
            </div>
          ))}
          {contact && (
            <div className="text-[11px] leading-[1.7] rounded-lg px-3 py-2" style={{ background: "rgba(5,150,105,0.06)", color: "#047857" }}>
              <b>למי לפנות:</b> {contact}
            </div>
          )}
          <div className="flex gap-2">
            {inst.link && (
              <a href={inst.link.startsWith("http") ? inst.link : `https://${inst.link}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 text-[11.5px] font-bold px-3 py-2 rounded-lg text-center"
                style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}>
                לאתר הרשמי ↗
              </a>
            )}
            {onToggleList && (
              <button onClick={onToggleList}
                className="flex-1 text-[11.5px] font-bold px-3 py-2 rounded-lg"
                style={{
                  background: inList ? `${ORANGE}18` : "rgba(0,0,0,0.04)",
                  color: inList ? ORANGE : "rgba(0,0,0,0.5)",
                  border: inList ? `1px solid ${ORANGE}40` : "1px solid rgba(0,0,0,0.08)",
                }}>
                {inList ? "✓ ברשימה שלי" : "+ הוסף לרשימה"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
