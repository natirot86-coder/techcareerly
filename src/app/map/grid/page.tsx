/**
 * /map/grid — עותק ב׳ של המפה: **גריד וויירפריים, בסגנון flowchart מוצרי.**
 *
 * בהשראת התמונה השנייה ששלח נתי: כל מסך הוא כרטיס תמונה קטן על גריד רך,
 * צפוף וסורק-במבט — הקהל הוא הצוות עצמו. לעומת /map/flows אין כאן נרטיב;
 * לעומת /map (התרשים) יש כאן **מראה אמיתי** של כל מסך במקום מלבן צבעוני.
 *
 * אותם צילומים מ-public/map-shots/ ואותו תוכן מ-map-flows.ts — מקור אחד,
 * שלוש תצוגות.
 */
"use client";
import Link from "next/link";
import { FLOWS } from "@/data/map-flows";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";

export default function MapGridPage() {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f7fafd" }}>
      <div style={{ textAlign: "center", padding: "38px 24px 8px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#5b9bd5" }}>TECHCAREERLY</div>
        <h1 style={{ fontSize: 30, ...HEEBO, color: "#1a2b4a", marginTop: 8 }}>
          כל המסכים, במבט אחד.
        </h1>
        <p style={{ fontSize: 13.5, color: "rgba(0,0,0,0.45)", marginTop: 8, lineHeight: 1.7 }}>
          כל כרטיס הוא מסך חי — לחיצה פותחת אותו.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
          <Link href="/map" style={{ fontSize: 12, fontWeight: 700, padding: "6px 13px", borderRadius: 8, background: "#e8f0fa", color: NAVY }}>
            לתרשים הזרימה ←
          </Link>
          <Link href="/map/flows" style={{ fontSize: 12, fontWeight: 700, padding: "6px 13px", borderRadius: 8, background: "#e8f0fa", color: NAVY }}>
            למסע עם הסבר ←
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 32px 70px" }}>
        {FLOWS.map(flow => (
          <div key={flow.id} style={{ marginTop: 34 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: flow.color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#1a2b4a" }}>{flow.title}</span>
              <span style={{ fontSize: 11.5, color: "rgba(0,0,0,0.35)", fontWeight: 600 }}>{flow.stage}</span>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 18,
            }}>
              {flow.screens.map(sc => (
                <a
                  key={sc.shot}
                  href={sc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      borderRadius: 12, overflow: "hidden", background: "#fff",
                      border: "1px solid #dde7f2",
                      boxShadow: "0 2px 8px rgba(26,43,74,0.06)",
                      transition: "transform .12s, box-shadow .12s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "translateY(-3px)";
                      el.style.boxShadow = "0 8px 20px rgba(26,43,74,0.14)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "none";
                      el.style.boxShadow = "0 2px 8px rgba(26,43,74,0.06)";
                    }}
                  >
                    <div style={{ height: 6, background: flow.color, opacity: 0.75 }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/map-shots/${sc.shot}.png`}
                      alt={sc.label}
                      style={{ width: "100%", height: 148, objectFit: "cover", objectPosition: "top", display: "block" }}
                    />
                    <div style={{ padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1a2b4a" }}>{sc.label}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
