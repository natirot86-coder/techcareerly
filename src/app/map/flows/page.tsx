/**
 * /map/flows — עותק א׳ של המפה: **מסודר לפי מסע, עם צילומים והסבר במילים.**
 *
 * בהשראת פורמט ה-handoff של KAYAN: פס לכל זרימה, מכשירים אמיתיים, ופסקת
 * נרטיב לצד כל אחת. הקהל הוא מי שרואה את האפליקציה בפעם הראשונה — רכזת
 * חדשה, תורם, מנכ״ל — שרוצה לדעת מה קורה לבנאדם, לא איך חילקנו מסכים.
 *
 * הצילומים ב-public/map-shots/ נוצרים אוטומטית מהאתר החי (viewport 390),
 * כדי שהדף לא יתיישן כמו מסמך שנבנה ביד. התוכן עצמו ב-src/data/map-flows.ts.
 */
"use client";
import Link from "next/link";
import { FLOWS } from "@/data/map-flows";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";

export default function MapFlowsPage() {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f1efe9" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 3, marginBottom: 6 }}>TECHCAREERLY</div>
          <div style={{ fontSize: 26, ...HEEBO }}>המסע — מסך אחרי מסך</div>
          <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.65 }}>
            צילומים חיים מהאפליקציה · לחיצה על מסך פותחת אותו · לקריאה מימין לשמאל
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link href="/map" style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.14)", color: "#fff" }}>
              לתרשים הזרימה ←
            </Link>
            <Link href="/map/grid" style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.14)", color: "#fff" }}>
              לתצוגת הגריד ←
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 32px 60px" }}>
        {FLOWS.map(flow => (
          <section key={flow.id} style={{ padding: "34px 0", borderBottom: "2px dashed rgba(0,0,0,0.1)" }}>
            {/* כותרת הזרימה */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "3px 11px", borderRadius: 999,
                background: flow.color, color: "#fff",
              }}>
                {flow.stage}
              </span>
              <h2 style={{ fontSize: 21, ...HEEBO, color: NAVY }}>{flow.title}</h2>
            </div>

            <div style={{ display: "flex", gap: 26, marginTop: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* ההסבר במילים — מה שאין במפה הראשית בכלל */}
              <p style={{
                width: 250, flexShrink: 0, fontSize: 13, lineHeight: 1.9,
                color: "rgba(0,0,0,0.62)", background: "#fff", borderRadius: 14,
                padding: "16px 18px", border: `1px solid ${flow.color}22`,
              }}>
                {flow.note}
              </p>

              {/* המסכים */}
              <div style={{ flex: 1, minWidth: 320, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {flow.screens.map((sc, i) => (
                  <a
                    key={sc.shot}
                    href={sc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", position: "relative" }}
                  >
                    {/* חץ בין מסכים, בכיוון קריאה */}
                    {i > 0 && (
                      <span style={{
                        position: "absolute", right: -14, top: 120, fontSize: 15,
                        color: flow.color, fontWeight: 900,
                      }}>
                        ←
                      </span>
                    )}
                    <div style={{
                      width: 168, borderRadius: 18, overflow: "hidden", background: "#fff",
                      border: "1px solid rgba(0,0,0,0.1)",
                      boxShadow: "0 4px 14px rgba(2,62,138,0.1)",
                      transition: "transform .12s",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/map-shots/${sc.shot}.png`}
                        alt={sc.label}
                        style={{ width: "100%", height: 250, objectFit: "cover", objectPosition: "top", display: "block" }}
                      />
                      <div style={{ padding: "9px 12px", borderTop: `2.5px solid ${flow.color}` }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1c1a16" }}>{sc.label}</div>
                        {sc.sub && <div style={{ fontSize: 10.5, color: "rgba(0,0,0,0.45)", marginTop: 1 }}>{sc.sub}</div>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ))}

        <div style={{ textAlign: "center", padding: "22px 0 0", fontSize: 10.5, color: "rgba(0,0,0,0.35)" }}>
          הצילומים נוצרים אוטומטית מהאתר החי · עדכון תוכן: src/data/map-flows.ts
        </div>
      </div>
    </div>
  );
}
