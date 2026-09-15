"use client";

/**
 * "למה תואר" — מרחב ההמתנה של בוגרי טק-קריירה (8.9.2026).
 *
 * ─── למה זה קיים ─────────────────────────────────────────────────────────────
 *
 * המבוא להייטק נבנה למי שעוד לא בפנים: כמה עובדים יש, מה השכר, שחצי לא
 * כותבים קוד. **לבוגר שלנו כל שבעת הכרטיסים מיותרים** — הוא כבר בפנים,
 * הוא רואה את השכר בתלוש, והכרטיס האחרון מציג לו סיפור השראה על בוגר
 * טק-קריירה. הוא **הסיפור הזה**. זה לא סתם מיותר, זה אומר "לא הבנו מי אתה".
 *
 * השאלה שלו איננה "מה זה הייטק" אלא **"למה שאוותר על משכורת לארבע שנים"**,
 * וזה המסך היחיד שמכין את הפגישה עם סיוון. כל נתון כאן מאומת ומופיע גם
 * במערך שלה, כדי שהיא לא תצטרך להתחיל מאפס — ולא תסתור אותו.
 *
 * ⚠️ **אותו חוזה כמו במבוא:** אותם אירועים (`intro_step` / `intro_done`)
 * ואותו מפתח סיום (`waiting-taste`), כי הדשבורד, ה-reset והאנליטיקות כבר
 * קוראים אותם. הקוהורט מחליף **תוכן**, לא מדידה.
 */

import React, { useState } from "react";
import { DEGREES } from "@/data/degrees";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const MUTED = "#5c6473";
const HEEBO = { fontFamily: "'Heebo', sans-serif" };

export const WHY_DEGREE_TOTAL = 5;

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "16px", borderRadius: 18, border: "none",
  background: NAVY, color: "#fff", fontSize: 16.5, fontWeight: 700,
  cursor: "pointer", marginTop: 18, ...HEEBO,
};

const nextBtn = (onNext: () => void, label = "הבנתי, הלאה ←") => (
  <button onClick={onNext} style={btnPrimary}>{label}</button>
);

function Kicker({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00" }}>למה תואר, בכנות</div>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: WHY_DEGREE_TOTAL }, (_, i) => (
            <span key={i} style={{
              width: i === n - 1 ? 16 : 6, height: 6, borderRadius: 999,
              background: i < n ? ORANGE : "#e3ddd2", transition: "all .25s",
            }} />
          ))}
        </div>
      </div>
      <h1 style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.3, marginTop: 6, color: "#1b1f27" }}>{children}</h1>
    </>
  );
}

function Chips({ options, picked, onPick }: { options: string[]; picked: string | null; onPick: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      {options.map(o => (
        <button key={o} onClick={() => !picked && onPick(o)}
          style={{
            padding: "13px 16px", borderRadius: 16, textAlign: "right", cursor: picked ? "default" : "pointer",
            fontSize: 16, fontWeight: 700, ...HEEBO, transition: "all .2s",
            background: picked === o ? NAVY : "#fff",
            color: picked === o ? "#fff" : "#1b1f27",
            border: picked === o ? "none" : "1.5px solid #e3ddd2",
            opacity: picked && picked !== o ? 0.45 : 1,
          }}>
          {o}
        </button>
      ))}
    </div>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#fff", borderRadius: 22, padding: 18, marginTop: 14, border: "1px solid rgba(2,62,138,0.08)" }}>
    {children}
  </div>
);

/* ─── 1. מה זה תואר, מול ההכשרה שהוא כבר עשה ─────────────────────────────── */
function WhatItIs({ onNext }: { onNext: () => void }) {
  const rows = [
    ["אורך", "כחצי שנה", "3–4 שנים"],
    ["המטרה", "עבודה ראשונה", "להבין למה זה עובד"],
    ["הדרך", "מעשי מהיום הראשון", "תיאוריה קודם"],
    ["בסוף", "מיומנות וקשרים", "תעודה שלא פגה"],
  ];
  return (
    <>
      <Kicker n={1}>כבר עשית הכשרה. תואר הוא חיה אחרת.</Kicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
        זו לא "הכשרה ארוכה יותר" — וההבדל הזה הוא בדיוק מה שמפיל אנשים בחודש השלישי.
      </p>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: "10px 12px", fontSize: 14 }}>
          <div />
          <div style={{ fontWeight: 800, color: MUTED, fontSize: 12.5 }}>ההכשרה שעשית</div>
          <div style={{ fontWeight: 800, color: NAVY, fontSize: 12.5 }}>תואר</div>
          {rows.map(([k, a, b]) => (
            <React.Fragment key={k}>
              <div style={{ fontWeight: 700, color: MUTED, fontSize: 12.5 }}>{k}</div>
              <div style={{ color: "#1b1f27" }}>{a}</div>
              <div style={{ color: "#1b1f27", fontWeight: 700 }}>{b}</div>
            </React.Fragment>
          ))}
        </div>
      </Card>
      <div style={{ background: "#fff3e2", borderRadius: 20, padding: 18, marginTop: 14 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: "#7a4100" }}>מה שחשוב לדעת מראש</div>
        <p style={{ fontSize: 15, color: "#7a4100", lineHeight: 1.65, marginTop: 6 }}>
          בשנה הראשונה זה לא ירגיש כמו ההכשרה. הרבה מתמטיקה, מעט קוד, וזה ירגיש
          רחוק מהעבודה — <b>וזה בכוונה.</b> מי שיודע את זה מראש עובר את זה;
          מי שלא, חושב שטעה ועוזב.
        </p>
      </div>
      {nextBtn(onNext)}
    </>
  );
}

/* ─── 2. מה זה נותן — ניחוש לפני חשיפה ───────────────────────────────────── */
function WhatItGives({ onNext }: { onNext: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const RIGHT = "בערך 36 אלף ₪";
  /* הנתונים מגיעים מ-degrees.ts — לא מוקלדים כאן, כדי שלא יתפצלו ממנו */
  const pick = (id: string) => DEGREES.find(d => d.id === id);
  const rows = ["cs", "info-systems-eng", "industrial-eng"]
    .map(pick)
    .filter((d): d is NonNullable<typeof d> => !!d);
  return (
    <>
      <Kicker n={2}>נחש: כמה מרוויח בוגר מדעי המחשב?</Kicker>
      <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6, marginTop: 6 }}>
        חמש-שש שנים אחרי סיום התואר — לא בשנה הראשונה.
      </p>
      <Chips options={["בערך 22 אלף ₪", "בערך 28 אלף ₪", RIGHT]} picked={picked} onPick={setPicked} />
      {picked && (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: picked === RIGHT ? "#046c4e" : "#b35e00", marginTop: 14 }}>
            {picked === RIGHT ? "בול 🎯" : "גבוה ממה שנדמה:"}
          </div>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "9px 10px", fontSize: 13.5 }}>
              <div style={{ fontWeight: 800, color: MUTED, fontSize: 12 }}>תואר</div>
              <div style={{ fontWeight: 800, color: MUTED, fontSize: 12 }}>בהייטק</div>
              <div style={{ fontWeight: 800, color: MUTED, fontSize: 12 }}>שכר</div>
              {rows.map(d => (
                <React.Fragment key={d.id}>
                  <div style={{ fontWeight: 700, color: "#1b1f27" }}>{d.name}</div>
                  <div style={{ color: "#1b1f27" }}>{d.inTech}%</div>
                  <div style={{ color: "#1b1f27", fontWeight: 700 }}>
                    {d.salary?.toLocaleString("he-IL")} ₪
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Card>
          {/*
            השורה השלישית איננה טעות — היא מה שהופך את השתיים הראשונות לאמינות.
            "מספרים אומרים מה הם, או שהם לא מוצגים" (19.8).
          */}
          <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.65, marginTop: 12 }}>
            שים לב לשורה האחרונה: לתעשייה וניהול יש הכי הרבה מועסקים — אבל רק
            חצי מגיעים להייטק, ולכן גם השכר הנמוך ביותר. <b>לא כל תואר שווה
            אותו דבר, וזה בדיוק מה שתבחר עם סיוון.</b>
          </p>
          {nextBtn(onNext)}
        </>
      )}
    </>
  );
}

/* ─── 3. התקרה — הטיעון האמיתי למי שכבר בפנים ────────────────────────────── */
function Ceiling({ onNext }: { onNext: () => void }) {
  return (
    <>
      <Kicker n={3}>אתה כבר בפנים. אז בשביל מה?</Kicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, marginTop: 8 }}>
        השאלה איננה כמה אתה מרוויח היום, אלא <b>לאן אפשר להגיע בלי תואר.</b>
      </p>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["מ-QA לפיתוח", "המעבר הזה נחסם הכי הרבה בלי רקע פורמלי"],
            ["מיישום לארכיטקטורה", "מי שמתכנן מערכות נשאל איפה למד"],
            ["לתפקידי הובלה", "שם התואר מפסיק להיות נחמד ומתחיל להיות תנאי סף"],
          ].map(([t, s]) => (
            <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: ORANGE, fontWeight: 900, fontSize: 17, lineHeight: 1.3 }}>←</span>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: "#1b1f27" }}>{t}</div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55, marginTop: 2 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, marginTop: 14 }}>
        ועוד משהו: <b>תעודת קורס נמדדת מול הטכנולוגיה של השנה. תואר לא פג.</b>
      </p>
      <p style={{ fontSize: 15, color: "#046c4e", lineHeight: 1.65, marginTop: 12, fontWeight: 700 }}>
        ואת החלק הקשה כבר עשית — הכניסה להייטק. תואר כשאתה כבר בפנים ומרוויח
        הוא הרבה יותר קל מתואר מאפס.
      </p>
      {nextBtn(onNext)}
    </>
  );
}

/* ─── 4. בלי לוותר על המשכורת ────────────────────────────────────────────── */
function Alongside({ onNext }: { onNext: () => void }) {
  return (
    <>
      <Kicker n={4}>"ארבע שנים בלי משכורת" — זה פשוט לא נכון</Kicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, marginTop: 8 }}>
        יש מסלולים שרצים לצד עבודה מלאה. אלה מוסדות שבדקנו אחד-אחד:
      </p>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["מכללת ספיר", "ימים א׳-ב׳-ג׳ בלבד · תואר 3 שנים"],
            ["המכללה למנהל", "ערב במדעי המחשב · תשעה סמסטרים במקום שישה"],
            ["HIT חולון", "אחר הצהריים וערב"],
            ["סמי שמעון", "באר שבע ואשדוד · כולל ערב"],
            ["האקדמית רמת גן", "יום, ובנוסף ערב במדעי המחשב"],
            ["האוניברסיטה הפתוחה", "קצב עצמאי לגמרי, בלי פסיכומטרי"],
          ].map(([n, s]) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, flexShrink: 0 }}>{n}</div>
              <div style={{ fontSize: 13.5, color: MUTED, textAlign: "left", lineHeight: 1.5 }}>{s}</div>
            </div>
          ))}
        </div>
      </Card>
      {/* אומרים את האמת גם כשהיא לא נוחה — אחרת אנחנו מוכרים */}
      <div style={{ background: "#fff3e2", borderRadius: 20, padding: 18, marginTop: 14 }}>
        <p style={{ fontSize: 14.5, color: "#7a4100", lineHeight: 1.65 }}>
          <b>על האוניברסיטה הפתוחה בכנות:</b> היעדר המסגרת הוא בדיוק המקור
          לאחוזי הנשירה הגבוהים שלה. מצוינת למי שיודע לנהל את עצמו, ומלכודת
          למי שלא. שווה לדבר על זה עם סיוון לפני שמחליטים.
        </p>
      </div>
      {nextBtn(onNext)}
    </>
  );
}

/* ─── 5. משרת סטודנט — התואר כתשובה של שנה ולא של שלוש ──────────────────── */
function StudentJob({ onNext }: { onNext: () => void }) {
  return (
    <>
      <Kicker n={5}>ומשהו שרוב האנשים לא יודעים</Kicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, marginTop: 8 }}>
        ברגע שאתה סטודנט נפתח לך שוק עבודה שסגור בפניך היום:
        <b> משרות סטודנט</b> — שחברות מגייסות אליהן בכוונה, ברף כניסה נמוך
        יותר, כצינור גיוס לתפקיד מלא.
      </p>
      <Card>
        <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, lineHeight: 1.25 }}>
          נפתח בדרך כלל מסוף שנה א׳
        </div>
        <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
          כלומר התואר איננו רק תשובה של שלוש שנים — הוא פותח דלת חדשה
          כבר בתוך שנה.
        </p>
      </Card>
      <div style={{ background: "#f4f1ea", borderRadius: 20, padding: 18, marginTop: 14 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "#5c574e" }}>ובלי להבטיח יותר מדי</div>
        <p style={{ fontSize: 14, color: "#5c574e", lineHeight: 1.65, marginTop: 6 }}>
          "מסוף שנה א׳" זו רצועת זמן ולא הבטחה, אין לנו נתון מאומת על השכר
          שם — ולפני זה צריך לעבור את שנה א׳, שהיא בדיוק המקום הקשה.
          <b> בשנה הזאת צריך ממה לחיות, וזו שיחה שכדאי לפתוח עם סיוון.</b>
        </p>
      </div>
      {nextBtn(onNext, "סיימתי ✓")}
    </>
  );
}


export function WhyDegreeCard({ idx, onNext }: { idx: number; onNext: () => void }) {
  switch (idx) {
    case 0: return <WhatItIs onNext={onNext} />;
    case 1: return <WhatItGives onNext={onNext} />;
    case 2: return <Ceiling onNext={onNext} />;
    case 3: return <Alongside onNext={onNext} />;
    default: return <StudentJob onNext={onNext} />;
  }
}

export function WhyDegreeDone({ who, onPrep, onHome }: { who: string; onPrep: () => void; onHome: () => void }) {
  return (
    <>
      <h1 style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.3, marginTop: 18, color: "#1b1f27" }}>
        עכשיו יש לך את התמונה.
      </h1>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
        תואר הוא לא נכון לכל אחד, ואולי גם לא לך — את זה תבינו יחד עם {who}.
        מה שכן: עכשיו אתה יודע מה השאלות.
      </p>

      <div style={{ background: "#fff3e2", borderRadius: 24, padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#7a4100" }}>שווה להביא לפגישה</div>
        <ul style={{ fontSize: 15, color: "#7a4100", lineHeight: 1.7, marginTop: 8, paddingInlineStart: 18 }}>
          <li>כמה מהשבוע אתה באמת יכול לפנות</li>
          <li>אם אתה שוקל לשנות את מצב העבודה — או בכלל לא</li>
          <li>מה הכי הפתיע אותך ממה שקראת כאן</li>
        </ul>
      </div>

      <button onClick={onPrep} style={btnPrimary}>מה עוד כדאי להכין לפגישה ←</button>
      <button onClick={onHome} style={{
        width: "100%", padding: 14, borderRadius: 18, border: "none", background: "transparent",
        color: MUTED, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 6, ...HEEBO,
      }}>
        חזרה למרחב ההמתנה
      </button>
    </>
  );
}
