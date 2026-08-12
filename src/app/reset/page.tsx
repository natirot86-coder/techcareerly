"use client";

/**
 * /reset — מחיקת כל המצב המקומי, כדי לבדוק את המסע מההתחלה.
 *
 * כל האפליקציה רצה היום על localStorage, ולכן בדיקה חוזרת בלי ניקוי מציגה
 * מסכים של מישהו שכבר באמצע הדרך: מרחב ההמתנה נפתח כאילו נקבעה פגישה,
 * הדשבורד קופץ לשלב 4, וטעימות מסומנות כהושלמו.
 *
 * ⚠️ הניקוי כולל את סשן ההזדהות של Supabase. אחרי ניקוי נוצר מועמד אנונימי
 * חדש — וזה מה שרוצים בבדיקה, אבל זה אומר שהנתונים הישנים נשארים בבסיס
 * הנתונים בלי דרך לחזור אליהם מהדפדפן.
 *
 * לא מנקה אוטומטית בטעינה, בכוונה: מי שנוחת כאן בטעות לא מאבד כלום.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const RED = "#dc2626";

/** קבוצות המצב, לפי שלב במסע — כדי שיהיה ברור מה בדיוק נמחק */
const GROUPS: { label: string; keys: string[] }[] = [
  { label: "זהות והרשמה", keys: ["user-name", "onboarding"] },
  { label: "פגישות", keys: [
    "meeting-booked", "meeting-1-booked", "meeting-2-booked", "meeting-3-booked",
    "meeting-1-booked-at", "meeting-2-booked-at", "meeting-3-booked-at",
    "meeting-1-at", "meeting-2-at", "meeting-3-at", "meeting-1-attended", "at-risk",
  ] },
  { label: "מרחב ההמתנה", keys: ["waiting-taste"] },
  { label: "שלב 3 — חשיפה", keys: [
    "data-journey", "cyber-journey", "networks-journey", "code-journey",
    "ai-journey", "ux-journey", "marketing-journey",
    "data-experience", "cyber-experience", "networks-experience",
    "explore-results", "paths-domain", "paths-domain-choice",
  ] },
  { label: "שלב 4 — מסלולי לימוד", keys: [
    "paths-quiz", "paths-shortlist", "paths-research", "paths-journey", "paths-phase",
  ] },
  { label: "שלב 5 — לוגיסטיקה", keys: [
    "plan-tasks", "plan-docs", "plan-apps", "plan-intro-seen", "plan-last-sent",
  ] },
  { label: "טיוטות ניהול", keys: ["admin-institutions-draft", "admin-scholarships-draft"] },
];

export default function ResetPage() {
  const [found, setFound] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

  function scan() {
    const counts: Record<string, number> = {};
    for (const g of GROUPS) {
      counts[g.label] = g.keys.filter(k => localStorage.getItem(k) !== null).length;
    }
    setFound(counts);
    setTotal(localStorage.length);
  }

  useEffect(scan, []);

  function wipe() {
    // clear() ולא מחיקה לפי מפתחות — כדי לתפוס גם את סשן Supabase
    // ואת כל מה שנוסף מאז ולא רשום ברשימה שלמעלה
    localStorage.clear();
    sessionStorage.clear();
    setDone(true);
    scan();
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "'Heebo', sans-serif" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 25, fontWeight: 900, marginTop: 8 }}>בדיקה מההתחלה</div>
          <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7, lineHeight: 1.6 }}>
            מוחק את כל מה ששמור בדפדפן הזה, כדי שהמסע ייראה כמו של מועמד חדש לגמרי.
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 24px 60px" }}>
        {done ? (
          <>
            <div style={{ background: "#eef8f3", border: "1px solid #cfe9dd", borderRadius: 14, padding: 18, color: "#08694c" }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>נוקה ✓</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, marginTop: 6 }}>
                הדפדפן הזה נקי. אפשר להתחיל את המסע מההתחלה.
              </div>
            </div>
            <Link
              href="/login"
              style={{
                display: "block", textAlign: "center", marginTop: 14, padding: 15,
                borderRadius: 12, background: ORANGE, color: "#fff", fontSize: 16, fontWeight: 800,
              }}
            >
              להתחיל מהכניסה ←
            </Link>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {[["/onboarding", "לשאלון"], ["/dashboard", "לדשבורד"], ["/waiting", "למרחב ההמתנה"]].map(([h, l]) => (
                <Link key={h} href={h} style={{ flex: 1, textAlign: "center", padding: 11, borderRadius: 10, background: "#fff", border: "1px solid rgba(0,0,0,0.12)", color: NAVY, fontSize: 13, fontWeight: 700 }}>
                  {l}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ background: "#fff7ec", border: "1px solid #f5dcb8", borderRadius: 14, padding: 16, color: "#8a4d00", fontSize: 13, lineHeight: 1.75 }}>
              <b>מה נמחק:</b> כל המצב המקומי, כולל סשן ההזדהות. אחרי הניקוי ייווצר מועמד
              אנונימי חדש — הנתונים הישנים יישארו בבסיס הנתונים, אבל לא תהיה אליהם דרך חזרה
              מהדפדפן הזה.
              <br />
              <b>מה לא נמחק:</b> שום דבר שהעלית לאתר. המוסדות, המלגות והקוד לא מושפעים.
            </div>

            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 16, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.45)", marginBottom: 10 }}>
                מה שמור אצלך כרגע · {total} מפתחות בסך הכל
              </div>
              {GROUPS.map(g => (
                <div key={g.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <span style={{ fontSize: 13.5, color: found[g.label] ? "#1c1a16" : "rgba(0,0,0,0.35)" }}>{g.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: found[g.label] ? ORANGE : "rgba(0,0,0,0.25)" }}>
                    {found[g.label] ? `${found[g.label]} פריטים` : "ריק"}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={wipe}
              style={{
                width: "100%", marginTop: 14, padding: 15, borderRadius: 12, border: "none",
                background: RED, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              למחוק הכל ולהתחיל מאפס
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "rgba(0,0,0,0.4)", marginTop: 8 }}>
              משפיע רק על הדפדפן הזה. אפשר גם פשוט לפתוח חלון גלישה פרטית.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
