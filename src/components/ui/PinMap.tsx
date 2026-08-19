"use client";

/**
 * מפת סיכות אינטראקטיבית — זום, גרירה ומפת רחובות.
 *
 * **Leaflet עם אריחי OpenStreetMap**, ולא גוגל או מפבוקס: בלי מפתח API,
 * בלי חשבון חיוב, ובלי שכתובות המועמדים שלנו עוברות דרך ספק מסחרי.
 *
 * **הסיכות מציינות עיר ולא בניין**, כי כתובת מלאה יש לנו רק לשמונה
 * מוסדות. זה כתוב על המפה במפורש — עדיף סיכה מדויקת-לעיר שמסומנת ככזו,
 * מאשר סיכה שנראית מדויקת ואיננה. כמה מוסדות באותה עיר יושבים על אותה
 * נקודה, ולכן הסיכה נושאת מונה והלחיצה פותחת את כולם.
 *
 * נטען דינמית בלי SSR — Leaflet ניגש ל-window בזמן הייבוא.
 */

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { INSTITUTIONS, type Track } from "@/data/institutions";
import { visibleCourses } from "@/data/courses";
import { latLngOf, ISRAEL_CENTER, regionOf, type Region } from "@/data/regions";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Spot = {
  city: string;
  pos: [number, number];
  mine: boolean;
  items: { id: string; name: string; where?: string; sub?: string; link?: string }[];
};

/** סיכה עגולה עם מונה — נבנית כ-HTML כדי לא לשאת קובצי תמונה */
function pinIcon(count: number, mine: boolean) {
  const size = count > 1 ? 34 : 28;
  const bg = mine ? ORANGE : NAVY;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 4px;
      transform:rotate(-45deg);background:${bg};
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);color:#fff;font-size:${count > 9 ? 11 : 12}px;font-weight:800;font-family:sans-serif">${count}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

/** מרכז את המפה על מה שיש בפועל, במקום להתחיל בזום שרירותי */
function FitToSpots({ spots }: { spots: Spot[] }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length === 0) return;
    map.fitBounds(L.latLngBounds(spots.map(s => s.pos)), { padding: [36, 36], maxZoom: 11 });
  }, [spots, map]);
  return null;
}

export default function PinMap({ track, myRegions = [] }: {
  track?: Track;
  myRegions?: Region[];
}) {
  const { spots, unplaced } = useMemo(() => {
    const byCity = new Map<string, Spot>();
    let unplaced = 0;

    const add = (city: string | undefined, item: Spot["items"][number]) => {
      const pos = latLngOf(city);
      if (!city || !pos) { unplaced++; return; }
      const cur = byCity.get(city);
      if (cur) cur.items.push(item);
      else byCity.set(city, {
        city, pos, mine: myRegions.includes(regionOf(city)), items: [item],
      });
    };

    // קורס גובר על מוסד — המחזור נושא את המיקום האמיתי
    const courses = visibleCourses().filter(() => !track || track === "bootcamp");
    const covered = new Set(courses.filter(c => c.city || c.online).map(c => c.institutionId));
    for (const c of courses) {
      if (c.online) { unplaced++; continue; }
      add(c.city, {
        id: c.id, name: c.name,
        where: c.address ?? c.city,
        sub: INSTITUTIONS.find(i => i.id === c.institutionId)?.name.split(" — ")[0],
        link: c.link,
      });
    }
    for (const i of INSTITUTIONS) {
      if (i.status === "hidden" || (track && i.track !== track) || covered.has(i.id)) continue;
      add(i.city, {
        id: i.id, name: i.name.split(" — ")[0],
        where: i.address ?? i.city, sub: i.tag, link: i.link,
      });
    }
    return { spots: [...byCity.values()], unplaced };
  }, [track, myRegions]);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(2,62,138,0.12)" }}>
        <MapContainer
          center={ISRAEL_CENTER}
          zoom={8}
          scrollWheelZoom={false}
          style={{ height: 420, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToSpots spots={spots} />
          {spots.map(s => (
            <Marker key={s.city} position={s.pos} icon={pinIcon(s.items.length, s.mine)}>
              <Popup>
                <div dir="rtl" style={{ minWidth: 190, fontFamily: "'Heebo', sans-serif" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
                    {s.city}{s.mine ? " · האזור שלך" : ""}
                  </div>
                  {s.items.map(it => (
                    <div key={it.id} style={{ marginBottom: 7 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{it.name}</div>
                      <div style={{ fontSize: 11, color: "#5c574e", lineHeight: 1.5 }}>
                        {[it.where, it.sub].filter(Boolean).join(" · ")}
                      </div>
                      {it.link && (
                        <a href={it.link.startsWith("http") ? it.link : `https://${it.link}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>
                          לאתר ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="text-[11px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.45)" }}>
        <b>הסיכה מציינת עיר, לא בניין.</b> כתובת מדויקת יש לנו רק לחלק מהמוסדות,
        ובכל סיכה מופיע המספר שיושב באותה עיר.
        {unplaced > 0 && (
          <> {unplaced} מסלולים אינם על המפה — אונליין, פועלים בכל הארץ, או שטרם מיפינו להם מיקום.
          הם מופיעים בתצוגת <b>״לפי אזור״</b>.</>
        )}
      </div>
    </div>
  );
}
