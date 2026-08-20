"use client";

/**
 * מפה קטנה בתוך פאנל התואר — **רק המוסדות שמלמדים את התואר הנבחר.**
 *
 * במסלול האקדמי בוחרים קודם תואר ואז מוסד, ולכן מפה ברמה העליונה
 * מתעלמת מהבחירה ומציגה מוסדות שאינם רלוונטיים. כאן היא ממוקדת.
 *
 * ולמה בכלל מפה לתואר, אם לתואר הגיאוגרפיה שווה פחות מאשר להכשרה:
 * כי גם כשהתואר זהה בכל מקום, **המרחק מהבית הוא עדיין מה שיקבע אם
 * אפשר להחזיק שלוש שנים** — במיוחד למי שממשיך לעבוד או שיש לו ילדים.
 *
 * 20.8: לחיצה על סיכה פותחת מגירה עם הכרטיס המלא — אותה התנהגות כמו
 * במפה הגדולה. קודם הסיכה פתחה בועית שאמרה "הפרטים למטה", והמשתמש
 * נבלע ברשימה. וגם מקרא הצבעים נוסף — צבע בלי מקרא הוא סתם קישוט.
 */

import { useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { INSTITUTIONS } from "@/data/institutions";
import { latLngOf, ISRAEL_CENTER } from "@/data/regions";
import { qualityOf, QUALITY_META } from "@/data/quality";
import InstitutionCard from "@/components/ui/InstitutionCard";

const NAVY = "#023e8a";

type Inst = (typeof INSTITUTIONS)[number];

/** אותו קוד צבע כמו במפה הגדולה — ירוק מומלץ, אדום יש מה לדעת, אפור לא אומת */
const dot = (color: string) => L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);
    background:${color};border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.3)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

export default function DegreeMap({ insts, inList, onToggleList }: {
  insts: Inst[];
  inList?: (name: string) => boolean;
  onToggleList?: (name: string) => void;
}) {
  const [picked, setPicked] = useState<Inst | null>(null);

  const placed = insts
    .map(i => ({ inst: i, pos: latLngOf(i.city) }))
    .filter((x): x is { inst: Inst; pos: [number, number] } => !!x.pos);

  if (placed.length === 0) {
    return (
      <div className="text-[11px] leading-[1.7] px-3 py-2.5 rounded-xl"
        style={{ background: "rgba(251,133,0,0.06)", color: "#92400e" }}>
        אין עדיין מיקום ממופה למוסדות של התואר הזה — <b>זה אומר שלא בדקנו, לא שאין.</b>
      </div>
    );
  }

  const center: [number, number] = placed.length === 1 ? placed[0].pos : ISRAEL_CENTER;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(2,62,138,0.12)" }}>
        <MapContainer center={center} zoom={placed.length === 1 ? 11 : 7}
          scrollWheelZoom={false} style={{ height: 260, width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {placed.map(({ inst, pos }) => (
            <Marker key={inst.id} position={pos} icon={dot(QUALITY_META[qualityOf(inst)].color)}
              eventHandlers={{ click: () => setPicked(inst) }} />
          ))}
        </MapContainer>
      </div>

      {/* מקרא הצבעים — כמו במפה הגדולה */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1">
        {(["recommended", "ok", "warn", "unverified"] as const).map(q => (
          <span key={q} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "rgba(0,0,0,0.55)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: QUALITY_META[q].color, display: "inline-block" }} />
            {QUALITY_META[q].label}
          </span>
        ))}
      </div>

      {placed.length < insts.length && (
        <div className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>
          {insts.length - placed.length} מוסדות אינם על המפה — טרם מיפינו להם יישוב.
        </div>
      )}

      {/* מגירת הכרטיס — הסיכה פותחת את המוסד עצמו, לא שולחת לרשימה */}
      {picked && (
        <>
          <div onClick={() => setPicked(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000 }} />
          <div
            dir="rtl"
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1001,
              maxHeight: "72vh", display: "flex", flexDirection: "column",
              background: "#fbf9f5", borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.22)",
            }}
          >
            <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ width: 44, height: 5, borderRadius: 999, background: "#ddd6c8", margin: "0 auto 10px" }} />
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-black" style={{ color: NAVY }}>
                  {picked.name.split(" — ")[0]}
                </div>
                <button onClick={() => setPicked(null)} className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}>סגירה</button>
              </div>
            </div>
            <div style={{ overflowY: "auto", padding: "10px 12px 22px" }}>
              <InstitutionCard inst={picked} defaultOpen
                inList={inList?.(picked.name)}
                onToggleList={onToggleList ? () => onToggleList(picked.name) : undefined} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
