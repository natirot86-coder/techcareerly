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
 */

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { INSTITUTIONS } from "@/data/institutions";
import { latLngOf, ISRAEL_CENTER } from "@/data/regions";
import { qualityOf, QUALITY_META } from "@/data/quality";

const NAVY = "#023e8a";

type Inst = (typeof INSTITUTIONS)[number];

/** אותו קוד צבע כמו במפה הגדולה — ירוק מומלץ, אדום יש מה לדעת, אפור לא אומת */
const dot = (color: string) => L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);
    background:${color};border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.3)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
});

export default function DegreeMap({ insts }: { insts: Inst[] }) {
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
            <Marker key={inst.id} position={pos} icon={dot(QUALITY_META[qualityOf(inst)].color)}>
              <Popup>
                <div dir="rtl" style={{ minWidth: 150, fontFamily: "'Heebo', sans-serif" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>
                    {inst.name.split(" — ")[0]}
                  </div>
                  <div style={{ fontSize: 11, color: "#5c574e", marginTop: 2, lineHeight: 1.5 }}>
                    {inst.address ?? inst.city}
                  </div>
                  <div style={{ fontSize: 11, color: "#5c574e", marginTop: 4 }}>
                    הפרטים המלאים בכרטיס שמתחת למפה
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {placed.length < insts.length && (
        <div className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>
          {insts.length - placed.length} מוסדות אינם על המפה — טרם מיפינו להם יישוב.
        </div>
      )}
    </div>
  );
}
