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

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { INSTITUTIONS, type Track } from "@/data/institutions";
import { visibleCourses } from "@/data/courses";
import { latLngOf, ISRAEL_CENTER, regionOf, type Region } from "@/data/regions";
import InstitutionCard from "./InstitutionCard";
import { qualityOf, QUALITY_META, QUALITY_RANK, type Quality } from "@/data/quality";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Spot = {
  city: string;
  pos: [number, number];
  /** הטוב ביותר שיושב כאן — הסיכה מייצגת אותו */
  best: Quality;
  mine: boolean;
  items: { id: string; name: string; where?: string; sub?: string; link?: string }[];
};

/** סיכה עגולה עם מונה — נבנית כ-HTML כדי לא לשאת קובצי תמונה */
function pinIcon(count: number, quality: Quality) {
  const size = count > 1 ? 34 : 28;
  const bg = QUALITY_META[quality].color;
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

export default function PinMap({ track, myRegions = [], inList, onToggleList }: {
  track?: Track;
  myRegions?: Region[];
  inList?: (name: string) => boolean;
  onToggleList?: (name: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const { spots, unplaced } = useMemo(() => {
    const byCity = new Map<string, Spot>();
    let unplaced = 0;

    const add = (city: string | undefined, item: Spot["items"][number]) => {
      const pos = latLngOf(city);
      if (!city || !pos) { unplaced++; return; }
      const cur = byCity.get(city);
      if (cur) cur.items.push(item);
      else byCity.set(city, {
        city, pos, best: "unverified",
        mine: myRegions.includes(regionOf(city)), items: [item],
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
    // הסיכה מייצגת את הטוב ביותר שיושב בעיר — אחרת מוסד מומלץ נעלם
    // מאחורי שכן לא מאומת שנוסף לפניו
    for (const spot of byCity.values()) {
      spot.best = pickedInsts(spot.city, track)
        .map(qualityOf)
        .sort((a, b) => QUALITY_RANK[a] - QUALITY_RANK[b])[0] ?? "unverified";
    }
    return { spots: [...byCity.values()], unplaced };
  }, [track, myRegions]);

  /** מה שלא ניתן למקם — ושתי הסיבות שונות לגמרי */
  const offMap = useMemo(() => {
    const covered = new Set(
      visibleCourses().filter(c => c.city || c.online).map(c => c.institutionId));
    const rest = INSTITUTIONS.filter(i =>
      i.status !== "hidden" && (!track || i.track === track) && !i.city && !covered.has(i.id));
    return {
      online: rest.filter(i => /אונליין|מרחוק/.test(i.location ?? "")),
      nationwide: rest.filter(i => /ברחבי הארץ|קמפוסים|מרכזים/.test(i.location ?? "")),
    };
  }, [track]);

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
            <Marker key={s.city} position={s.pos} icon={pinIcon(s.items.length, s.best)}>
              <Popup>
                <div dir="rtl" style={{ minWidth: 170, fontFamily: "'Heebo', sans-serif" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>
                    {s.city}{s.mine ? " · האזור שלך" : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#5c574e", margin: "3px 0 7px" }}>
                    {s.items.length === 1 ? s.items[0].name : `${s.items.length} מסלולים כאן`}
                  </div>
                  {/*
                    לא פותחים כאן את כל המידע — פופאפ קטן מדי, והמידע שלנו
                    (מסלול בלי פסיכומטרי, הדלת, למי לפנות) לא נכנס בו.
                    הלחיצה מביאה את הכרטיס המלא מתחת למפה.
                  */}
                  <button
                    onClick={() => setPicked(s.city)}
                    style={{
                      width: "100%", fontSize: 12, fontWeight: 700, padding: "6px 10px",
                      borderRadius: 8, border: "none", background: NAVY, color: "#fff", cursor: "pointer",
                    }}
                  >
                    לראות מה יש לנו עליהם ←
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/*
        מגירה ולא קופסה מתחת למפה: המפה תופסת 420 פיקסלים בטלפון, וכרטיס
        שנפתח מתחתיה נמצא מחוץ למסך — כלומר לוחצים על סיכה ונדמה שכלום
        לא קרה. המגירה מבטיחה שהתוצאה תיראה, ומשאירה את המפה גלויה מעליה
        כדי שאפשר יהיה ללחוץ על סיכה אחרת בלי לאבד הקשר.
      */}
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
                <div>
                  <div className="text-[15px] font-black" style={{ color: NAVY }}>{picked}</div>
                  <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>
                    {pickedInsts(picked, track).length} מסלולים · המומלצים למעלה
                  </div>
                </div>
                <button onClick={() => setPicked(null)} className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}>סגירה</button>
              </div>
            </div>
            <div style={{ overflowY: "auto", padding: "10px 12px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
              {pickedInsts(picked, track)
                .sort((a, b) => QUALITY_RANK[qualityOf(a)] - QUALITY_RANK[qualityOf(b)])
                .map((i, idx) => (
                  <InstitutionCard key={i.id} inst={i} defaultOpen={idx === 0}
                    inList={inList?.(i.name)}
                    onToggleList={onToggleList ? () => onToggleList(i.name) : undefined} />
                ))}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1">
        {(["recommended", "ok", "warn", "unverified"] as const).map(q => (
          <span key={q} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "rgba(0,0,0,0.55)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: QUALITY_META[q].color, display: "inline-block" }} />
            {QUALITY_META[q].label}
          </span>
        ))}
      </div>

      <div className="text-[11px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.45)" }}>
        <b>הסיכה מציינת עיר, לא בניין.</b> כתובת מדויקת יש לנו רק לחלק מהמוסדות,
        ובכל סיכה מופיע המספר שיושב באותה עיר.
      </div>

      {/*
        מה שלעולם לא יהיה על מפה — וזו לא הסתייגות אלא חלק מהתשובה.
        מפה שלא אומרת מה חסר ממנה היא מפה שמשקרת.
      */}
      {offMap.online.length > 0 && (
        <OffMap title="🌐 אפשר מהבית" tone="#047857"
          note="אלה לא על המפה כי אין להם מקום — לומדים אונליין. למי שעובד או שיש לו ילדים, זו לפעמים כל התשובה."
          items={offMap.online} inList={inList} onToggleList={onToggleList} />
      )}
      {offMap.nationwide.length > 0 && (
        <OffMap title="🇮🇱 פועלים בכל הארץ" tone={NAVY}
          note="יש להם סניפים או מרכזים בכל הארץ. לא בחרנו לך אחד — בדוק/י באתר איזה הכי קרוב אליך."
          items={offMap.nationwide} inList={inList} onToggleList={onToggleList} />
      )}
    </div>
  );
}

/** רשימה מקופלת של מה שלא ניתן למקם — עם אותו כרטיס מלא */
function OffMap({ title, note, tone, items, inList, onToggleList }: {
  title: string; note: string; tone: string;
  items: (typeof INSTITUTIONS)[number][];
  inList?: (name: string) => boolean;
  onToggleList?: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${tone}33` }}>
      <button onClick={() => setOpen(!open)} className="w-full text-right px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13.5px] font-black" style={{ color: tone }}>{title}</span>
          <span className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>
            {items.length} · {open ? "▲" : "▼"}
          </span>
        </div>
        <div className="text-[11px] leading-[1.65] mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>{note}</div>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {items.map(i => (
            <InstitutionCard key={i.id} inst={i}
              inList={inList?.(i.name)}
              onToggleList={onToggleList ? () => onToggleList(i.name) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

/** המוסדות שיושבים בעיר שנבחרה — כולל מי שהגיע דרך קורס */
function pickedInsts(city: string, track?: Track) {
  const ids = new Set<string>();
  for (const c of visibleCourses()) if (c.city === city) ids.add(c.institutionId);
  for (const i of INSTITUTIONS) {
    if (i.status === "hidden" || (track && i.track !== track)) continue;
    if (i.city === city) ids.add(i.id);
  }
  return [...ids]
    .map(id => INSTITUTIONS.find(i => i.id === id))
    .filter((i): i is (typeof INSTITUTIONS)[number] => !!i);
}
