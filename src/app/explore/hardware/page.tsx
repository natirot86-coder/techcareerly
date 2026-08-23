"use client";
import React, { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — זהה לצבע שכבר מוגדר ב-/explore וב-results
const HW = "#7c2d12";
const NAVY = "#023e8a";

// ─── Shared micro-components (מקבילים ל-[domain]/page.tsx) ────────────────────

function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "rgba(0,0,0,0.35)", marginBottom: "10px",
      }}
    >
      {text}
    </div>
  );
}

function WowStat({ stat, label, sub, color }: { stat: string; label: string; sub: string; color: string }) {
  return (
    <div className="mb-7 rounded-2xl p-5" style={{ background: `${color}09`, border: `1.5px solid ${color}30` }}>
      <div className="text-[44px] leading-none font-black" style={{ color, ...HEEBO }}>{stat}</div>
      <div className="text-[13.5px] mt-2 font-bold" style={{ color: NAVY }}>{label}</div>
      <div className="text-[11.5px] mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>{sub}</div>
    </div>
  );
}

function JobMarketBlock({ color, demand, hitech, nonHitech, ai }: {
  color: string; demand: string; hitech: string; nonHitech: string; ai: string;
}) {
  return (
    <div className="mb-7">
      <Label text="שוק העבודה" />
      <div className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${color}20` }}>
        <div className="text-[13px] font-bold mb-3 pb-3 leading-[1.55]"
          style={{ color: NAVY, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {demand}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl px-3 py-2.5" style={{ background: `${color}09`, border: `1px solid ${color}18` }}>
            <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(0,0,0,0.3)" }}>הייטק</div>
            <div className="text-[11.5px] font-bold leading-[1.5]" style={{ color }}>{hitech}</div>
          </div>
          <div className="rounded-xl px-3 py-2.5"
            style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}>
            <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(0,0,0,0.3)" }}>מחוץ להייטק</div>
            <div className="text-[11.5px] font-bold leading-[1.5]" style={{ color: NAVY }}>{nonHitech}</div>
          </div>
        </div>
        <div className="rounded-xl px-3 py-2.5"
          style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.18)" }}>
          <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#d97706" }}>
            🤖 AI ועתיד התפקיד
          </div>
          <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.58)" }}>{ai}</div>
        </div>
      </div>
    </div>
  );
}

function SimTeaser({ emoji, challenge }: { emoji: string; challenge: string }) {
  return (
    <div
      className="mb-7 rounded-2xl p-4"
      style={{ background: "rgba(251,133,0,0.06)", border: "1.5px dashed rgba(251,133,0,0.45)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[20px]">{emoji}</span>
        <span
          className="text-[10.5px] font-bold uppercase tracking-wide"
          style={{ color: "#fb8500" }}
        >
          מה מחכה לך בטעימה
        </span>
      </div>
      <div className="text-[13px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.65)" }}>{challenge}</div>
    </div>
  );
}

// ─── Video embed ──────────────────────────────────────────────────────────────

function VideoEmbed({ id, label, source }: { id: string; label: string; source?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-7" style={{ border: "1.5px solid rgba(124,45,18,0.2)" }}>
      <div className="px-4 pt-3 pb-2" style={{ background: "rgba(124,45,18,0.06)" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: HW }}>🎥 סרטון בעברית{source ? ` · ${source}` : ""}</div>
        <div className="text-[12px] font-bold" style={{ color: NAVY }}>{label}</div>
      </div>
      <div className="relative" style={{ paddingTop: "56.25%" }}>
        <iframe src={`https://www.youtube.com/embed/${id}`} title={label} allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HardwareDomainPage() {
  const [picked, setPicked] = useState<number | null>(null);
  const [journey, setJourney] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("hardware-journey");
      if (saved) setJourney(JSON.parse(saved));
    } catch {/* ignore */}
  }, []);

  // מיני-אינטראקציה: שלושה פסי מתח — אחד מהם לא תקין. לחיצה מגלה.
  const FAULTY = 2;
  const rails = [
    { rail: "12V rail", expected: "12.00V", measured: "12.02V", ok: true },
    { rail: "5V rail", expected: "5.00V", measured: "4.98V", ok: true },
    { rail: "3.3V rail", expected: "3.30V", measured: "2.41V", ok: false },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Domain-colored header */}
      <div className="text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0" style={{ background: HW }}>
        <div className="max-w-[900px] mx-auto">
          <Link href="/explore" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.82 }}>
            ← חזרה למסלול
          </Link>
          <div className="md:flex md:items-center md:gap-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px] mb-4 md:mb-0 shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", fontFamily: "'Heebo', sans-serif", color: "#fff" }}
            >
              ח
            </div>
            <div>
              <div className="text-[28px] md:text-[36px] leading-tight" style={HEEBO}>חומרה ואלקטרוניקה</div>
              <div className="text-[13px] md:text-[15px] mt-[6px]" style={{ opacity: 0.88 }}>
                בונים את השבבים והלוחות שכל התוכנה בעולם רצה עליהם
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] md:px-6 pt-6 pb-28">
        {/* Hook — היי-לבל קודם (נתי 23.8): מה זה בכלל חומרה, לפני כל מספר */}
        <div className="mb-4 rounded-2xl p-5 text-[14px] leading-[1.85]" style={{ background: "rgba(124,45,18,0.07)" }}>
          <div className="text-[16px] mb-2 font-black" style={{ color: NAVY }}>מה זה בכלל חומרה?</div>
          תסתכלו על הטלפון שלכם. האפליקציות, המסך, המצלמה — הכל עובד כי בפנים יש
          לוח קטן עם שבבים ורכיבים. <b>זו החומרה: הגוף הפיזי שכל התוכנה רצה עליו.</b>{" "}
          בלי הלוח הזה אין אפליקציה ואין מסך. אותו סיפור ברכב, במכשיר בבית החולים, במזגן החכם.
          <div className="mt-2">
            אנשי החומרה מתכננים את הלוחות האלה, בונים אותם, ומגלים למה לוח מסוים
            לא עובד. <span className="font-black" style={{ color: NAVY }}>זה התחום שבו נוגעים במוצר בידיים.</span>
          </div>
        </div>

        {/* Interactive teaser — find the faulty rail */}
        <div className="mb-7">
          <Label text="רגע של טעימה — בלי שום ידע מוקדם" />
          <div className="rounded-xl px-4 py-3 mb-3 flex gap-2 items-start"
            style={{ background: "rgba(124,45,18,0.06)", border: "1px solid rgba(124,45,18,0.15)" }}>
            <span className="text-[16px] shrink-0">🔎</span>
            <div className="text-[12.5px] leading-[1.55]" dir="rtl" style={{ color: HW }}>
              <span className="font-bold">חשמל בלוח מתנהג כמו מים בצינורות.</span>{" "}
              מכשיר לא נדלק, ומדדנו את ה״לחץ״ בשלושת ה״צינורות״ שלו. אחד מספק
              פחות ממה שהוא אמור — תמצאו אותו?
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(124,45,18,0.2)", boxShadow: "0 4px 24px rgba(124,45,18,0.1)" }}>
            <div className="px-4 py-2 font-mono text-[10px] flex gap-3" style={{ background: "#1a120a", color: "#4b5563" }} dir="ltr">
              <span className="w-[70px]">RAIL</span>
              <span className="flex-1">EXPECTED</span>
              <span>MEASURED</span>
            </div>
            {rails.map((r, i) => {
              const isFaulty = i === FAULTY;
              const showResult = picked !== null;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => setPicked(i)}
                  className="w-full"
                >
                  <div
                    className="px-4 py-3 flex gap-3 items-center border-t font-mono text-[11.5px] transition-all"
                    dir="ltr"
                    style={{
                      borderColor: "rgba(124,45,18,0.15)",
                      background: showResult && isFaulty
                        ? "rgba(220,38,38,0.15)"
                        : picked === i
                        ? "rgba(124,45,18,0.1)"
                        : "#111",
                      color: "#d1d5db",
                    }}
                  >
                    <span className="w-[70px] shrink-0 text-left" style={{ color: "#94a3b8" }}>{r.rail}</span>
                    <span className="flex-1 text-left" style={{ color: "#64748b" }}>{r.expected}</span>
                    <span
                      className="shrink-0 px-[6px] py-[2px] rounded text-[11px] font-bold"
                      style={{
                        background: r.ok ? "#16a34a22" : "#dc262622",
                        color: r.ok ? "#22c55e" : "#f87171",
                      }}
                    >
                      {r.measured}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div
              className="mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-[1.55]"
              style={{
                background: picked === FAULTY ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${picked === FAULTY ? "#16a34a44" : "#dc262644"}`,
                color: picked === FAULTY ? "#15803d" : "#b91c1c",
              }}
            >
              {picked === FAULTY
                ? "✓ מדויק! פס שאמור לתת 3.3V ומודד 2.41V = השבבים לא מקבלים מספיק מתח. עכשיו מתחיל האבחון — למה המתח נופל? זו בדיוק העבודה."
                : "✗ שימי לב לשורה האחרונה — 3.3V rail מודד 2.41V. פער כזה בין צפוי למדוד הוא הרמז הראשון של כל תקלת חומרה."}
            </div>
          )}
        </div>

        {/* סרטון מאומת (ASR) — רן לוי, 4:46. אחרי הטיזר: המשתמש בדיוק לחץ על קריאת מתח */}
        <VideoEmbed
          id="M5mPxAr6pLg"
          label="מה ההבדל בין חשמל AC ו-DC? — ב-5 דקות"
          source="רן לוי"
        />

        <WowStat
          stat="15.3B$"
          label="אינטל רכשה את מובילאיי הישראלית ב-15.3 מיליארד דולר"
          sub="חברת שבבים לרכב אוטונומי שנוסדה בירושלים — העסקה הגדולה בתולדות ההייטק הישראלי בזמנה (2017)"
          color={HW}
        />

        {/* סרטון מאומת (ASR) — כאן 11, 5:05. מוצמד בכוונה ל-WowStat של מובילאיי */}
        <VideoEmbed
          id="0sM98dn5Gss"
          label="עסקת הענק בתולדות ההייטק — אינטל ומובילאיי"
          source="כאן 11"
        />

        {/* Industry context block — לפני SimTeaser, לפי הסטנדרט */}
        <div className="mb-7">
          <Label text="חומרה ואלקטרוניקה — הקשר תעשייה" />
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(124,45,18,0.12)" }}>
            <div className="mb-3">
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>מי מפתחת שבבים וחומרה בישראל</div>
              <div className="flex flex-wrap gap-1.5">
                {["Intel", "Nvidia", "Apple", "Mobileye", "מערכת הביטחון והתעשיות הביטחוניות"].map(c => (
                  <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(124,45,18,0.08)", color: HW }}>{c}</span>
                ))}
              </div>
            </div>
            <div className="mb-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.3)" }}>תפקידים מרכזיים</div>
              <div className="flex flex-wrap gap-1.5">
                {["מהנדס/ת חומרה", "מהנדס/ת אלקטרוניקה", "הנדסאי/ת אלקטרוניקה", "הנדסאי/ת מכטרוניקה", "טכנאי/ת מעבדה"].map(r => (
                  <span key={r} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}>{r}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(124,45,18,0.05)", border: "1px solid rgba(124,45,18,0.1)" }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>נתיב כניסה</div>
                <div className="text-[11px] font-bold" dir="rtl" style={{ color: NAVY }}>תואר הנדסת חשמל · הנדסאי מה״ט</div>
                <div className="text-[10px] mt-0.5" dir="rtl" style={{ color: "rgba(0,0,0,0.4)" }}>הנדסאי כשנתיים · תואר ארבע שנים</div>
              </div>
              <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>שכר</div>
                <div className="text-[11px] font-bold" style={{ color: NAVY }}>נתוני שכר — בכרטיסי התארים בשלב 4</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>שם המספרים מאומתים ומוסברים</div>
              </div>
            </div>
          </div>
        </div>

        {/* Honesty block — אין דלת בוטקאמפ */}
        <div className="mb-7 rounded-2xl p-4" style={{ background: "rgba(2,62,138,0.04)", border: "1.5px solid rgba(2,62,138,0.12)" }}>
          <div className="text-[12px] font-black mb-2" style={{ color: NAVY }}>🚪 חשוב לדעת לפני שנכנסים — בכנות</div>
          <div className="text-[12.5px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
            בניגוד לפיתוח תוכנה או QA — <strong>לחומרה אין דלת של בוטקאמפ קצר.</strong>{" "}
            הכניסה לתחום עוברת דרך תואר בהנדסת חשמל או מסלול הנדסאי אלקטרוניקה/מכטרוניקה של מה״ט.
            זה מסלול ארוך יותר — אבל הוא גם מה שהופך את המקצוע ליציב ומבוקש:
            אי אפשר ללמוד אותו בשלושה חודשים, ולכן מי שבפנים — נשארים צריכים אותו.
          </div>
        </div>

        {/* הנדסאי מול מהנדס — שתי דלתות אמיתיות. שכר: למ״ס בלבד, תמיד עם אופק הזמן */}
        <div className="mb-7">
          <Label text="שתי דלתות לתחום — הנדסאי מול מהנדס" />
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-4" style={{ background: "rgba(124,45,18,0.05)", border: "1.5px solid rgba(124,45,18,0.18)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[18px]">🛠️</span>
                <span className="text-[13px] font-black" style={{ color: HW }}>הנדסאי/ת אלקטרוניקה (מה״ט) — הדלת הקצרה</span>
              </div>
              <div className="text-[11.5px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.58)" }}>
                בונה, בודק/ת ומאתר/ת תקלות במעבדה ובקו הייצור — <strong>עבודת ביצוע ואיתור</strong>.
                בדיוק מה שעשית בטעימה וב"יום בחיי".
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["כשנתיים", "מימון 90% מהאגף לחיילים משוחררים", "חזק בתעשייה הביטחונית"].map(c => (
                  <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(124,45,18,0.1)", color: HW }}>{c}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "rgba(2,62,138,0.04)", border: "1.5px solid rgba(2,62,138,0.12)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[18px]">📐</span>
                <span className="text-[13px] font-black" style={{ color: NAVY }}>מהנדס/ת (תואר הנדסת חשמל) — דלת התכנון</span>
              </div>
              <div className="text-[11.5px] leading-[1.65]" dir="rtl" style={{ color: "rgba(0,0,0,0.58)" }}>
                מתכנן/ת את המעגל והשבב עצמם — <strong>עבודת תכנון ופיתוח</strong>.
                מחליט/ה אילו רכיבים, איפה, ואיך הכל יעבוד יחד — וההנדסאים בונים ובודקים את מה שתוכנן.
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["ארבע שנים", "פותח את תפקידי התכנון", "התקרה הגבוהה של התחום"].map(c => (
                  <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>{c}</span>
                ))}
              </div>
            </div>
            {/* שכר מאומת (למ״ס) — המספר תמיד עם האופק, אחרת הוא נקרא כמשכורת התחלתית */}
            <div className="rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>
                שכר חודשי 5–6 שנים אחרי הסיום, בהייטק (למ״ס)
              </div>
              <div className="text-[13px] font-black" dir="rtl" style={{ color: NAVY, ...HEEBO }}>
                בוגרי תואר 22–27.7 אלף ₪ · הנדסאים 13.5–20.7 אלף ₪
              </div>
              <div className="text-[11px] mt-1.5 leading-[1.6]" dir="rtl" style={{ color: "rgba(0,0,0,0.45)" }}>
                שתי הדלתות אמיתיות — הפער הוא מידע לבחירה, לא איום.
                ומי שנכנס/ת דרך הדלת הקצרה יכול/ה להמשיך משם לתואר.
              </div>
            </div>
          </div>
        </div>

        <JobMarketBlock
          color={HW}
          demand="ישראל היא אחד ממרכזי פיתוח השבבים המובילים בעולם — אינטל, Nvidia, Apple ומובילאיי מחזיקות כאן מרכזי פיתוח"
          hitech="תכנון שבבים · לוחות אלקטרוניים · בדיקות (Validation) · מעבדה"
          nonHitech="תעשייה ביטחונית · מכשור רפואי · רכב · תעשייה ואנרגיה"
          ai="AI לא מחליף ידיים במעבדה — מישהו צריך לתכנן, להרכיב ולמדוד את השבבים שה-AI עצמו רץ עליהם. דווקא מהפכת ה-AI מגדילה את הביקוש לחומרה: כל מודל צריך מעבדים."
        />

        {/* News article cards — כתבות 2026 מאומתות (URL + תאריך + og:image).
            הרכב מכוון (נתי 20.8): אחת על גיוסים (אנבידיה), ושתיים כלליות על
            השוק — היקף משרות ושכר (דוח אתוסיה) והביקוש הביטחוני. לא מוסיפים
            אינטל (אין כתבה חיובית מ-2026) ולא Hailo (חדשות שליליות). */}
        <div className="mb-5">
          <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>מה אומרים עליהם</div>
          <div className="text-[14px] font-bold mb-3" style={{ color: NAVY }}>כתבות אחרונות על תעשיית השבבים בישראל</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                img: "/articles/hw-nvidia.jpg",
                summary: "אנבידיה תגייס השנה אלף עובדים. כך תתקבלו לעבודה שם",
                source: "TheMarker · 5.5.2026",
                href: "https://www.themarker.com/magazine/2026-05-05/ty-article-magazine/.highlight/0000019d-ec75-dd9a-a79d-ecfd56430000",
              },
              {
                img: "/articles/hw-jobs.jpg",
                summary: "המשבר בהייטק? התחום הזה רק גדל ומתפוצץ — 1,718 משרות חומרה פתוחות",
                source: "mako נקסטר · 24.7.2026",
                href: "https://www.mako.co.il/nexter-news/Article-3a6061958b56f91027.htm",
              },
              {
                img: "/articles/hw-defense.jpg",
                summary: "הביקוש לעובדים בתעשיות הביטחוניות גובר על השפעות השקל וה-AI",
                source: "כלכליסט · 7.7.2026",
                href: "https://www.calcalist.co.il/calcalistech/article/sjzl008tmfl",
              },
            ].map((a) => (
              <a
                key={a.href}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98]"
                style={{ background: "#fff", border: "1px solid rgba(124,45,18,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none" }}
              >
                <div className="overflow-hidden flex items-center justify-center" style={{ aspectRatio: "16/9", background: "rgba(124,45,18,0.06)" }}>
                  {a.img ? (
                    <img
                      src={a.img}
                      alt={a.summary}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-[28px]">📰</span>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <div className="text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{a.source}</div>
                  <div className="text-[12px] font-bold leading-[1.4] mb-3 flex-1" style={{ color: NAVY }}>{a.summary}</div>
                  <div className="flex justify-end">
                    <span className="text-[11px] font-bold" style={{ color: HW }}>קריאה ←</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <SimTeaser
          emoji="🔧"
          challenge="בטעימה: פס הייצור מדווח ש-3% מהלוחות נכשלים בבדיקה. את קוראת את פלט עמדת הבדיקה, מבודדת איזו אצוות רכיבים אשמה — ומחליטה מה עושים עם הייצור."
        />

        {/* Journey map — מפת מסע נעולה */}
        <div className="mb-7">
          <Label text="המסלול שלך בחומרה ואלקטרוניקה" />
          <div className="flex flex-col gap-2">
            {[
              {
                num: "1", emoji: "🔧",
                title: "טעימה — תקלה בפס הייצור",
                sub: "שלושה אחוזים מהלוחות נכשלים — קריאת פלט, בידוד אצווה, החלטה · ~8 דק'",
                href: "/explore/hardware/sim",
                doneKey: "sim" as const, lockedBy: null,
              },
              {
                num: "2", emoji: "🔬",
                title: "יום בחיי מהנדסת חומרה",
                sub: "בוקר: אבחון לוח שנכשל לסירוגין · אחר הצהריים: שלוש החלטות תכנון · ~20 דק'",
                href: "/explore/hardware/learn/day",
                doneKey: "day" as const, lockedBy: "sim" as const,
              },
              {
                num: "3", emoji: "🕵️",
                title: "תעלומת המכשיר החוזר",
                sub: "תקלה לא עקבית מהשטח — חקירה עם ראיות, לא ניחושים · ~20 דק'",
                href: "/explore/hardware/learn/mystery",
                doneKey: "mystery" as const, lockedBy: "day" as const,
              },
              {
                num: "4", emoji: "💭",
                title: "כלי עיבוד החוויה",
                sub: "שש שאלות — מה הרגשת? מה הדליק? מה אחר כך? · ~5 דק'",
                href: "/explore/hardware/experience",
                doneKey: "experience" as const, lockedBy: "mystery" as const,
              },
            ].map((step, i, arr) => {
              const isDone = !!journey[step.doneKey];
              const isLocked = step.lockedBy ? !journey[step.lockedBy] : false;
              const isFirst = i === 0;
              const highlight = isFirst && !journey["sim"];

              return (
                <div key={step.num}>
                  <Link href={isLocked ? "#" : step.href} className="block" onClick={isLocked ? (e) => e.preventDefault() : undefined}>
                    <div className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                      style={{
                        background: isDone ? "rgba(124,45,18,0.06)" : highlight ? HW : "#fff",
                        border: isDone ? "1.5px solid rgba(124,45,18,0.2)" : isLocked ? "1px solid rgba(0,0,0,0.06)" : highlight ? "none" : "1px solid rgba(0,0,0,0.08)",
                        opacity: isLocked ? 0.55 : 1,
                        boxShadow: highlight ? "0 4px 20px rgba(124,45,18,0.25)" : "none",
                      }}
                    >
                      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                        style={{ background: isDone ? HW : highlight ? "rgba(255,255,255,0.25)" : "rgba(124,45,18,0.1)", color: isDone || highlight ? "#fff" : HW }}>
                        {isDone ? "✓" : step.num}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px]">{isLocked ? "🔒" : step.emoji}</span>
                          <span className="text-[12.5px] font-bold"
                            style={{ color: isDone ? HW : highlight ? "#fff" : NAVY }}>
                            {step.title}
                          </span>
                          {highlight && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>התחלי כאן</span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          {isLocked ? (
                            <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                              זמין אחרי שלב {parseInt(step.num) - 1}
                            </span>
                          ) : (() => {
                            const parts = step.sub.split(/ · (~\d+.*)$/);
                            return (
                              <>
                                <div className="text-[11px]" dir="rtl"
                                  style={{ color: highlight ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.4)" }}>
                                  {parts[0]}
                                </div>
                                {parts[1] && (
                                  <div className="text-[10px] mt-0.5 font-bold" dir="rtl"
                                    style={{ color: highlight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.28)" }}>
                                    ⏱ {parts[1]}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <span className="text-[16px] font-bold shrink-0"
                        style={{ color: isDone ? HW : highlight ? "#fff" : isLocked ? "rgba(0,0,0,0.2)" : HW }}>
                        {isLocked ? "🔒" : "←"}
                      </span>
                    </div>
                  </Link>
                  {i < arr.length - 1 && (
                    <div className="flex justify-center my-1">
                      <div className="w-[1.5px] h-3"
                        style={{ background: isDone ? "rgba(124,45,18,0.4)" : "rgba(124,45,18,0.2)" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 inset-x-0 flex justify-center px-4 pb-[72px] md:pb-4 pt-3"
        style={{ background: "linear-gradient(to top, #fbf9f5 80%, transparent)" }}
      >
        <Link
          href="/explore/hardware/sim"
          className="block w-full max-w-[500px] text-center py-[14px] rounded-xl text-white font-bold text-[15px]"
          style={{ background: "#fb8500", fontFamily: "'Heebo', sans-serif" }}
        >
          קדימה לטעימה ←
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
