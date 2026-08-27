"use client";

/**
 * /waiting — מרחב ההמתנה לפגישה הראשונה.
 *
 * המצב: המועמד קיבל הודעה, הוריד, מילא שאלון. **הוא עוד לא פגש אף אחד.**
 * בין הרגע הזה לפגישה יש ימים או שבועות, וזה בדיוק המקום שבו מאבדים אנשים —
 * כשהמוטיבציה בשיא ואין מה לעשות איתה.
 *
 * שלושה כללים שנקבעו ואסור לשבור אותם בלי החלטה מפורשת:
 *
 * 1. **הטעימה היא תחנה, לא צומת.** היא חסומה מלמעלה בשאלון ומלמטה בפגישה
 *    על הציר, ולכן העין קוראת אותה כתחנה בדרך. זה פתרון מבני ולא ניסוחי,
 *    והוא מה שמונע ממנו להגיע לפגישה מעוגן בתחום שבחר לבד. שתי הגנות
 *    נוספות בקוד מסומנות "הגנת פיזור" — אין להסיר.
 *
 * 2. **אי אפשר להיכשל.** המערכת מסיקה כלל **מהתיוגים של המשתמש**, ולכן אין
 *    אמת נכונה שאפשר לפספס. בשלב הזה אין רכזת ואין כלי עיבוד — מי שייתקע
 *    יסיק "אני לא בנוי לזה", וזה ההפך הגמור מהמטרה.
 *
 * 3. **מבוא על העולם, לא על תחום** (נתי 24.8): סימולציית ה-AI הוחלפה במבוא
 *    לעולם ההייטק. היא נבנתה כשלא היה תחום AI בחקר; היום יש טעימת AI מלאה,
 *    והגרסה הקטנה כאן גנבה את רגע הגילוי של שלב 3. המבוא מדבר על העולם —
 *    כמה גדול, כמה משתלם (עם שורת אמת על הממוצע), אילו תפקידים, מה AI שינה,
 *    ומי כמוך כבר שם. **כל מספר מאומת** (רשות החדשנות 2026 / למ"ס 2025) —
 *    מספר בלי מקור לא נכנס. העומק על כל תחום נשאר בטעימות.
 *
 * הקצה של הציר משתנה: לפני קביעת פגישה הוא **קריאה לקבוע** — וזו הפעולה
 * החשובה במסך, לא הטעימה. אחרי הקביעה הוא כרטיס הפגישה.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { track as trackEvent } from "@vercel/analytics";
import { coordinatorFor } from "@/data/meetings";
import { logEvent } from "@/lib/candidate";
import BottomNav from "@/components/ui/BottomNav";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";
const CREAM = "#fbf9f5";
const SAND = "#ece7de";
const MUTED = "#5c6473";
const FAINT = "#8a919d";

const HEEBO = { fontFamily: "'Heebo', sans-serif" };

type Screen = "home" | "taste" | "prep";

// ─── תוכן המבוא — כל מספר עם מקור, אומת 24.8.2026 ────────────────────────────
// מקורות: רשות החדשנות — דוח מצב ההייטק 2026 (innovationisrael.org.il, חלק 1
// תעסוקה, נשלף ואומת ישירות) · למ"ס דרך bizportal 10.2025 · ynet · כלכליסט.

/** כתבות 2026 — אומתו בפתיחה ישירה; תמונות הורדו ל-public/articles */
const INTRO_ARTICLES = [
  {
    img: "/articles/intro-ai-jobs.jpg",
    summary: "אל תספידו את ההייטק: כך ה-AI ייצור אלפי משרות חדשות",
    source: "כלכליסט · 2.2026",
    href: "https://www.calcalist.co.il/calcalistech/article/ryy4o11q0011g",
  },
  {
    img: "/articles/intro-salary.jpg",
    summary: "השכר הממוצע בהייטק ממשיך לטפס — הנתונים החדשים",
    source: "גיקטיים · 1.2026",
    href: "https://www.geektime.co.il/tech-salary-survey-jan-2026/",
  },
  {
    img: "/articles/intro-stocks.jpg",
    summary: "שיא העושר: עובדי ההייטק מימשו ב-2025 מניות ב-50 מיליארד שקל",
    source: "כלכליסט · 1.2026",
    href: "https://www.calcalist.co.il/calcalistech/article/hy00wiukvwl",
  },
];

const INTRO_TOTAL = 7;

// ─────────────────────────────────────────────────────────────────────────────

export default function WaitingPage() {
  const [screen, setScreen] = useState<Screen>("home");
  /** 0..INTRO_TOTAL-1 — הכרטיס הנוכחי במבוא; INTRO_TOTAL = מסך הסיום */
  const [introIdx, setIntroIdx] = useState(0);
  const [tasteDone, setTasteDone] = useState(false);
  const [booked, setBooked] = useState(false);
  const [name, setName] = useState("");
  /** null = הפגישה עוד לא סומנה · "yes" = התקיימה · "missed" = לא הגיע */
  const router = useRouter();
  const [attended, setAttended] = useState<"yes" | "missed" | null>(null);
  /** האם המועד כבר עבר. כשאין מועד שמור — נשאר false, ומוצע קישור יזום */
  const [passed, setPassed] = useState(false);
  const [hasDate, setHasDate] = useState(false);

  const coordinator = coordinatorFor();
  const who = coordinator.firstName;

  useEffect(() => {
    try {
      setTasteDone(!!localStorage.getItem("waiting-taste"));
      setBooked(localStorage.getItem("meeting-1-booked") === "true" ||
                localStorage.getItem("meeting-booked") === "true");
      const ob = JSON.parse(localStorage.getItem("onboarding") || "{}");
      if (ob.firstName) setName(ob.firstName);

      const a = localStorage.getItem("meeting-1-attended");
      if (a === "yes" || a === "missed") setAttended(a);

      // שעה אחרי המועד — הפגישה מאחורינו בכל מקרה, גם אם לא התקיימה
      const at = localStorage.getItem("meeting-1-at");
      if (at) {
        setHasDate(true);
        setPassed(Date.now() > new Date(at).getTime() + 60 * 60 * 1000);
      }
    } catch { /* empty storage */ }
  }, []);

  function markAttendance(v: "yes" | "missed") {
    localStorage.setItem("meeting-1-attended", v);
    setAttended(v);
    trackEvent("meeting1_checkin", { result: v });
    logEvent("meeting1_checkin", { result: v });
    if (v === "missed") {
      // הסיגנל החזק ביותר ל-At Risk בכל הפאנל, ואין דרך אחרת להשיג אותו
      localStorage.setItem("at-risk", "missed-meeting-1");
      return;
    }
    // "היה טוב" ← ישר לטעימות. המסך הבא הוא הפעולה הבאה, לא כרטיס
    // שמכריז שהיא נפתחה (אותו עיקרון כמו סוף האונבורדינג — נתי 20.8)
    router.push("/explore");
  }

  useEffect(() => { window.scrollTo(0, 0); }, [screen, introIdx]);

  // מחסום. אין דרך להגיע לשתי הדקות בלי פגישה קבועה — גם לא בקישור ישיר
  useEffect(() => { if (screen === "taste" && !booked) setScreen("home"); }, [screen, booked]);

  /** צעד במבוא — נטישה מוסקת מ"הגיע לכרטיס N ולא ל-N+1", כרגיל */
  function introNext() {
    const next = introIdx + 1;
    logEvent("intro_step", { n: String(next + 1) });
    if (next >= INTRO_TOTAL) {
      // אותו מפתח כמו קודם — הדשבורד וה-reset כבר קוראים אותו
      localStorage.setItem("waiting-taste", JSON.stringify({ intro: true, at: new Date().toISOString() }));
      trackEvent("intro_done");
      logEvent("intro_done", {});
      setTasteDone(true);
    }
    setIntroIdx(Math.min(next, INTRO_TOTAL));
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: CREAM, ...HEEBO }}>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "28px 20px 110px" }}>
        {screen === "home" && (
          <Home
            name={name} who={who} booked={booked} tasteDone={tasteDone}
            attended={attended} passed={passed} hasDate={hasDate}
            onAttendance={markAttendance}
            onTaste={() => {
              setScreen("taste"); setIntroIdx(0);
              trackEvent("intro_start"); logEvent("intro_step", { n: "1" });
            }}
            onPrep={() => { setScreen("prep"); trackEvent("waiting_prep_open"); }}
            onAlreadyBooked={() => {
              localStorage.setItem("meeting-1-booked", "true");
              setBooked(true);
              trackEvent("waiting_booked_self_declared");
            }}
          />
        )}

        {screen === "taste" && (
          <>
            <Back onClick={() => (introIdx === 0 ? setScreen("home") : setIntroIdx(introIdx - 1))} />
            {introIdx < INTRO_TOTAL ? (
              <IntroCard idx={introIdx} who={who} onNext={introNext} />
            ) : (
              <IntroDone who={who} onPrep={() => setScreen("prep")} onHome={() => setScreen("home")} />
            )}
          </>
        )}

        {screen === "prep" && (
          <>
            <Back onClick={() => setScreen("home")} />
            <Prep who={who} booked={booked} onHome={() => setScreen("home")} />
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

// ─── דף הבית — הציר ──────────────────────────────────────────────────────────

function Home({
  name, who, booked, tasteDone, onTaste, onPrep, onAlreadyBooked,
  attended, passed, hasDate, onAttendance,
}: {
  name: string; who: string; booked: boolean; tasteDone: boolean;
  onTaste: () => void; onPrep: () => void; onAlreadyBooked: () => void;
  attended: "yes" | "missed" | null; passed: boolean; hasDate: boolean;
  onAttendance: (v: "yes" | "missed") => void;
}) {
  /* אחרי הפגישה הציר לא נגמר — הוא מתקדם. אותו מסך הופך מחדר המתנה לגשר */
  const done = attended === "yes";
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 500, color: MUTED }}>היי{name ? ` ${name}` : ""},</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.02em", marginTop: 4, color: "#1b1f27" }}>
        הנה הדרך שלך
        <br />
        עד הפגישה.
      </h1>

      <div style={{ marginTop: 26 }}>
        <Station color={GREEN} tag="הושלם" tagColor={GREEN} title="מילאת שאלון" sub="הצעד הראשון כבר מאחוריך" />

        <Station color={ORANGE} tag="אתה כאן" tagColor="#b35e00" title="ימי ההמתנה" glow>
          {/*
            נעול עד שנקבעה פגישה — ובכוונה **נראה** ולא מוסתר.
            מנעול שרואים הוא תמריץ לקבוע; היעדר הוא רק היעדר.

            והנימוק לנעילה עצמה: מסך המסגור אומר "מה שתשים לב אליו תוכל לספר
            בפגישה". בלי פגישה קבועה המשפט הזה ריק, והשתי דקות הופכות ממשהו
            שמוביל למקום — למשחקון.

            **וזה לא "טעימה".** טעימה היא על תחום, והיא שייכת לשלב 3 שם היא
            אמורה לעזור להחליט. זו על **רעיון** שחוצה תחומים, ולכן שם אחר.
          */}
          <Card dim={!booked}>
            <CardHead dot={booked ? ORANGE : "#cfd6e2"}>
              שבע דקות — העולם שאתה נכנס אליו
            </CardHead>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
              {tasteDone
                ? "כבר עברת על זה. אפשר לחזור מתי שבא לך."
                : booked
                  ? "כמה גדול ההייטק, כמה משלמים בו באמת, ואילו תפקידים יש בו חוץ ממתכנתים. מספרים אמיתיים, בלי מבחן."
                  : "נפתח אחרי שתקבע את הפגישה. שבע דקות קריאה — תגיע לפגישה כשאתה כבר מכיר את העולם."}
            </p>
            {booked ? (
              <button
                onClick={onTaste}
                style={{
                  width: "100%", marginTop: 14, padding: 13, borderRadius: 999, border: "none",
                  fontSize: 16, fontWeight: 700, cursor: "pointer",
                  background: tasteDone ? "#fff" : ORANGE,
                  color: tasteDone ? "#b35e00" : "#fff",
                  boxShadow: tasteDone ? `inset 0 0 0 1.5px ${ORANGE}` : "none",
                }}
              >
                {tasteDone ? "לעשות שוב" : "יאללה, מתחילים"}
              </button>
            ) : (
              <div style={{
                marginTop: 14, padding: 13, borderRadius: 999, textAlign: "center",
                background: "#f0f1f4", color: FAINT, fontSize: 15, fontWeight: 700,
              }}>
                נפתח אחרי קביעת הפגישה
              </div>
            )}
          </Card>

          {/* פתוח תמיד, גם לפני קביעה — זה בדיוק מה שמוריד את החשש שמונע
              ממנו לקבוע. לנעול אותו היה לנעול את התרופה מאחורי המחלה */}
          <Card>
            <CardHead dot={GREEN}>שנייה לפני שנפגשים</CardHead>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
              מה תהיה השיחה, ומה שווה לחשוב עליו. שלוש דקות קריאה.
            </p>
            <button
              onClick={onPrep}
              style={{
                width: "100%", marginTop: 14, padding: 12, borderRadius: 999,
                background: "#fff", color: "#046c4e", border: `1.5px solid ${GREEN}`,
                fontSize: 16, fontWeight: 700, cursor: "pointer",
              }}
            >
              מה מחכה לי בפגישה
            </button>
          </Card>
        </Station>

        <Station
          color={done ? GREEN : NAVY}
          tag={done ? "הושלם" : "היעד"}
          tagColor={done ? GREEN : NAVY}
          last={!done}
          title={booked ? `פגישה ראשונה עם ${who}` : "הפגישה הראשונה"}
        >
          {done ? null : attended === "missed" ? (
            /* לא נזיפה ולא מסך שקט — ישר הדרך חזרה */
            <div style={{ background: "#fff3e2", borderRadius: 22, padding: 20, marginTop: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#7a4100" }}>לא נורא. זה קורה להרבה אנשים.</div>
              <p style={{ fontSize: 15, color: "#7a4100", lineHeight: 1.6, marginTop: 6 }}>
                אפשר לקבוע מועד חדש עכשיו, וזה לא משנה כלום בהמשך הדרך.
              </p>
              <Link
                href="/contact?m=1"
                style={{
                  display: "block", textAlign: "center", marginTop: 14, padding: 14,
                  borderRadius: 999, background: ORANGE, color: "#fff", fontSize: 16, fontWeight: 700,
                }}
              >
                לקבוע מועד חדש
              </Link>
            </div>
          ) : booked && (passed || !hasDate) ? (
            /*
              הצ׳ק-אין. **לא** "האם הגעת" — זו שאלה שנקראת כמו מבחן ואפשר
              לשקר בה. "איך היה" היא שאלה טבעית אחרי פגישה, והיא גם
              הסיגנל היחיד שיש לנו ל-At Risk בשלב הזה.
            */
            <div style={{ background: NAVY, color: "#fff", borderRadius: 22, padding: 20, marginTop: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>איך היה?</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.9, marginTop: 6 }}>
                {hasDate ? "לפי היומן הפגישה כבר עברה." : "אם הפגישה כבר הייתה — שתי שניות ונמשיך."}
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  onClick={() => onAttendance("yes")}
                  style={{ flex: 1, padding: 13, borderRadius: 999, border: "none", background: GREEN, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", ...HEEBO }}
                >
                  היה טוב
                </button>
                <button
                  onClick={() => onAttendance("missed")}
                  style={{ flex: 1, padding: 13, borderRadius: 999, background: "rgba(255,255,255,0.14)", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", ...HEEBO }}
                >
                  לא הצלחתי להגיע
                </button>
              </div>
            </div>
          ) : booked ? (
            <div style={{ background: NAVY, color: "#fff", borderRadius: 22, padding: 20, marginTop: 12 }}>
              <div style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.92 }}>
                הפרטים המדויקים נשלחו אליך למייל ונכנסו ליומן.
              </div>
              <div style={{ background: "rgba(255,255,255,0.13)", borderRadius: 14, padding: 12, marginTop: 12, fontSize: 15 }}>
                שיחת היכרות. אתה לא מביא כלום.
              </div>
            </div>
          ) : (
            /* לפני קביעה — זו הפעולה החשובה במסך, ולכן היא הכתומה היחידה */
            <div style={{ background: NAVY, color: "#fff", borderRadius: 22, padding: 20, marginTop: 12 }}>
              <div style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.92 }}>
                עוד לא קבעת. זו שיחת היכרות של כ-45 דקות — ואתה לא מביא אליה כלום.
              </div>
              <Link
                href="/contact?m=1"
                style={{
                  display: "block", textAlign: "center", marginTop: 14, padding: 14,
                  borderRadius: 999, background: ORANGE, color: "#fff", fontSize: 16, fontWeight: 700,
                }}
              >
                לקבוע את הפגישה
              </Link>
              {/*
                פלט ידני, וחובה שיהיה.
                הזיהוי היום מגיע מאירוע של Cal.com שנורה רק בהטמעה שלנו, באותו
                סשן ובאותו מכשיר. מי שקבע מהמייל, מטלפון אחר, או שניקה דפדפן —
                לא יזוהה. ומכיוון שזה השער היחיד, כישלון זיהוי **נועל בן אדם
                בחוץ**. מי שלוחץ כאן בלי שקבע משקר לעצמו — מחיר זול בהרבה.
                יורד ברגע שה-webhook של Cal.com יעבוד.
              */}
              <button
                onClick={onAlreadyBooked}
                style={{
                  display: "block", width: "100%", marginTop: 10, background: "none",
                  border: "none", color: "rgba(255,255,255,0.75)", fontSize: 13.5,
                  fontWeight: 600, cursor: "pointer", textDecoration: "underline", ...HEEBO,
                }}
              >
                כבר קבעתי פגישה
              </button>
            </div>
          )}
        </Station>

        {/* התחנה הרביעית מופיעה רק אחרי שהפגישה התקיימה. זו התשובה ל"מה
            קורה למחרת": הציר לא נגמר בפגישה, הוא ממשיך — ואותו מסך הופך
            מחדר המתנה לגשר לשלב הבא */}
        {done && (
          <Station color={ORANGE} tag="אתה כאן" tagColor="#b35e00" title="חקר תחומי ההייטק" glow last>
            <Card>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6 }}>
                עכשיו נפתחים שבעת התחומים — הפעם באמת כדי להבין מה מדבר אליך.
                אין מגבלה, אפשר לנסות כמה שבא לך.
              </p>
              <Link
                href="/explore"
                style={{
                  display: "block", textAlign: "center", width: "100%", marginTop: 14,
                  padding: 13, borderRadius: 999, background: ORANGE, color: "#fff",
                  fontSize: 16, fontWeight: 700,
                }}
              >
                לחקר התחומים
              </Link>
            </Card>
          </Station>
        )}
      </div>
    </>
  );
}

function Station({
  color, tag, tagColor, title, sub, glow, last, children,
}: {
  color: string; tag: string; tagColor: string; title: string; sub?: string;
  glow?: boolean; last?: boolean; children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 16, height: 16, borderRadius: 999, background: color, marginTop: 4,
          boxShadow: glow ? "0 0 0 6px #fff3e2" : "none",
        }} />
        {!last && <div style={{ width: 2, flex: 1, background: SAND, marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: last ? 0 : 26, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: tagColor }}>{tag}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1b1f27", marginTop: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 14, color: FAINT, marginTop: 2 }}>{sub}</div>}
        {children}
      </div>
    </div>
  );
}

function Card({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 22, padding: 18, marginTop: 12,
      boxShadow: dim ? "none" : "0 2px 12px rgba(2,62,138,0.07)",
      border: dim ? "1px dashed #d8dbe2" : "none",
      opacity: dim ? 0.82 : 1,
    }}>
      {children}
    </div>
  );
}

function CardHead({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: dot, flexShrink: 0 }} />
      <span style={{ fontSize: 17, fontWeight: 700, color: "#1b1f27" }}>{children}</span>
    </div>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: NAVY, fontSize: 15, fontWeight: 700, padding: 0, cursor: "pointer", ...HEEBO }}>
      ← חזרה
    </button>
  );
}

// ─── כרטיסי המבוא ────────────────────────────────────────────────────────────
// v2 (24.8): ניחוש-לפני-חשיפה במקום קריאה פסיבית. מי שניחש קודם — זוכר
// את המספר ומופתע ממנו. אין ניחוש שגוי שמעניש: טעות מקבלת "רוב האנשים
// מנחשים ככה" והחשיפה עושה את העבודה. כמו תמיד כאן — אי אפשר להיכשל.

/** מספר גדול + שורת מקור. המקור מוצג — מספר בלי מקור נקרא כפרסומת */
function BigStat({ kicker, stat, sub, source }: { kicker: string; stat: string; sub: string; source: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 24, padding: 22, marginTop: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00" }}>{kicker}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: NAVY, marginTop: 4, letterSpacing: "-0.02em" }}>{stat}</div>
      <div style={{ fontSize: 16, color: "#1b1f27", lineHeight: 1.55, marginTop: 6 }}>{sub}</div>
      <div style={{ fontSize: 12.5, color: FAINT, marginTop: 10 }}>{source}</div>
    </div>
  );
}

function IntroKicker({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00" }}>העולם שאתה נכנס אליו</div>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: INTRO_TOTAL }, (_, i) => (
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

/** צ'יפ ניחוש — אחרי בחירה הצ'יפים קופאים והחשיפה מופיעה */
function GuessChips({ options, picked, onPick }: { options: string[]; picked: string | null; onPick: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      {options.map(o => (
        <button
          key={o}
          onClick={() => !picked && onPick(o)}
          style={{
            padding: "13px 16px", borderRadius: 16, textAlign: "right", cursor: picked ? "default" : "pointer",
            fontSize: 16, fontWeight: 700, ...HEEBO, transition: "all .2s",
            background: picked === o ? NAVY : "#fff",
            color: picked === o ? "#fff" : "#1b1f27",
            border: picked === o ? "none" : "1.5px solid #e3ddd2",
            opacity: picked && picked !== o ? 0.45 : 1,
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const introNextBtn = (onNext: () => void, label = "הבנתי, הלאה ←") => (
  <button onClick={onNext} style={btnPrimary}>{label}</button>
);

// כרטיס 1 — כמה גדול: ניחוש ← חשיפה
function IntroSize({ onNext }: { onNext: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const RIGHT = "יותר מ-400 אלף";
  return (
    <>
      <IntroKicker n={1}>נחש: כמה אנשים עובדים בהייטק הישראלי?</IntroKicker>
      <GuessChips options={["בערך 40 אלף", "בערך 150 אלף", RIGHT]} picked={picked} onPick={setPicked} />
      {picked && (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: picked === RIGHT ? "#046c4e" : "#b35e00", marginTop: 14 }}>
            {picked === RIGHT ? "בול 🎯 רוב האנשים מנחשים הרבה פחות." : "רוב האנשים מנחשים ככה — והאמת מפתיעה:"}
          </div>
          <BigStat
            kicker="עובדים בהייטק הישראלי"
            stat="+400,000"
            sub="בערך אחד מכל תשעה עובדים במשק. זו לא נישה של מעטים — זו תעשייה שלמה, והיא כל הזמן מחפשת אנשים חדשים."
            source="רשות החדשנות, דוח מצב ההייטק 2026 — 11.4% מהמועסקים ב-2025"
          />
          {introNextBtn(onNext)}
        </>
      )}
    </>
  );
}

// כרטיס 2 — כמה משלמים: ניחוש ← עמודות שגדלות מול העיניים
function IntroSalary({ onNext }: { onNext: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    if (picked) { const t = setTimeout(() => setGrow(true), 150); return () => clearTimeout(t); }
  }, [picked]);
  const RIGHT = "יותר מ-30 אלף";
  return (
    <>
      <IntroKicker n={2}>ונחש: כמה מרוויחים שם בממוצע בחודש?</IntroKicker>
      <GuessChips options={["בערך 15 אלף ₪", "בערך 22 אלף ₪", RIGHT + " ₪"]} picked={picked} onPick={setPicked} />
      {picked && (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: picked.startsWith(RIGHT) ? "#046c4e" : "#b35e00", marginTop: 14 }}>
            {picked.startsWith(RIGHT) ? "בדיוק 🎯" : "גבוה ממה שנדמה:"}
          </div>
          <div style={{ background: "#fff", borderRadius: 24, padding: 20, marginTop: 10 }}>
            {[
              ["הייטק", "כ-32,000 ₪", 100, NAVY],
              ["שאר המשק", "כ-13,600 ₪", 42, "#b9c3d4"],
            ].map(([label, val, w, color]) => (
              <div key={label as string} style={{ marginTop: label === "הייטק" ? 0 : 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5, fontWeight: 700, color: "#1b1f27" }}>
                  <span>{label}</span><span style={{ color: color as string }}>{val}</span>
                </div>
                <div style={{ height: 14, borderRadius: 999, background: "#f0ede6", marginTop: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 999, background: color as string,
                    width: grow ? `${w}%` : "4%", transition: "width .9s cubic-bezier(.2,.8,.2,1)",
                  }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize: 12.5, color: FAINT, marginTop: 12 }}>נתוני הלמ״ס, סוף 2025 — יותר מפי שניים</div>
          </div>
          {/* שורת האמת — בלעדיה המספר מרחיק ("לא בשבילי") או מייצר ציפייה שגויה */}
          <div style={{ background: "#fff3e2", borderRadius: 20, padding: 16, marginTop: 12, fontSize: 15, lineHeight: 1.65, color: "#7a4100" }}>
            <b>חשוב לקרוא את המספר נכון:</b> זה ממוצע על כולם — כולל אנשים עם 15
            שנות ניסיון. מתחילים נמוך מזה, ועולים מהר יותר מכמעט כל מקצוע אחר.
          </div>
          {introNextBtn(onNext)}
        </>
      )}
    </>
  );
}

// כרטיס 3 — מי עובד בהייטק: הופכים כרטיסים, מגלים שכולם
function IntroWho({ onNext }: { onNext: () => void }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const PEOPLE: [string, string, string][] = [
    ["🎨", "מעצבת", "מעצבת את המסכים של האפליקציה"],
    ["🗣️", "איש מכירות", "מוכר את המוצר לחברות בחו״ל"],
    ["📊", "אנליסטית", "מנתחת מה המשתמשים באמת עושים"],
    ["🧭", "מנהל מוצר", "מחליט מה בונים ולמה"],
    ["💻", "מתכנתת", "כותבת את הקוד"],
    ["🔍", "בודק תוכנה", "מוצא את התקלות לפני הלקוחות"],
  ];
  const count = Object.keys(flipped).length;
  return (
    <>
      <IntroKicker n={3}>מי מהאנשים האלה עובד בהייטק?</IntroKicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 6 }}>לחץ על כל אחד כדי לגלות.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        {PEOPLE.map(([e, role, what]) => {
          const on = flipped[role];
          return (
            <button
              key={role}
              onClick={() => setFlipped({ ...flipped, [role]: true })}
              style={{
                borderRadius: 18, padding: "14px 12px", textAlign: "center", cursor: on ? "default" : "pointer",
                background: on ? "#e7f6f0" : "#fff", border: on ? "1.5px solid #a7dcc8" : "1.5px solid #e3ddd2",
                transition: "all .25s", ...HEEBO,
              }}
            >
              <div style={{ fontSize: 24 }}>{e}</div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1b1f27", marginTop: 4 }}>{role}</div>
              <div style={{ fontSize: 12, lineHeight: 1.45, marginTop: 4, color: on ? "#046c4e" : FAINT, fontWeight: on ? 700 : 500 }}>
                {on ? `✓ בהייטק — ${what}` : "לחץ לגילוי"}
              </div>
            </button>
          );
        })}
      </div>
      {count >= 3 && (
        <>
          <BigStat
            kicker="התשובה: כולם"
            stat="בערך חצי"
            sub="מעובדי ההייטק בכלל לא כותבים קוד — מוצר, עיצוב, נתונים, שיווק, מכירות, בדיקות ותמיכה."
            source="רשות החדשנות 2026 — 49% במשרות מו״פ, 110 אלף במשרות מוצר"
          />
          {introNextBtn(onNext)}
        </>
      )}
    </>
  );
}

/** צ'יפ חברה: הלוגו עצמו כשקיים (בגודל קריא), שם כשאין (נתי 27.8) */
function FirmChip({ id, label, lit }: { id: string; label: string; lit: boolean }) {
  const [hasLogo, setHasLogo] = useState(true);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: lit ? "#fff" : "#f4f5f7", borderRadius: 12,
      padding: hasLogo ? "7px 12px" : "6px 12px", minHeight: 34,
      border: "1px solid rgba(0,0,0,0.06)",
    }}>
      {hasLogo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={`/logos/${id}.png`} alt={label} title={label}
          style={{ height: 20, maxWidth: 84, objectFit: "contain", display: "block" }}
          onError={() => setHasLogo(false)} />
      ) : (
        <span style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{label}</span>
      )}
    </span>
  );
}

// כרטיס 4 — שני עולמות: בחירה בלי תשובה נכונה
function IntroWhere({ onNext }: { onNext: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <>
      <IntroKicker n={4}>איפה היית רוצה לעבוד?</IntroKicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 6 }}>
        אנשי טכנולוגיה עובדים גם בבנקים, בקופות חולים ובממשלה — לא רק בחברות הייטק. בחר מה מדבר אליך:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {([
          ["🚀", "בחברת הייטק", "הטכנולוגיה היא המוצר עצמו. בדרך כלל שכר גבוה יותר וקצב למידה מהיר יותר.", ["google|גוגל", "intel|אינטל", "wix|Wix", "mobileye|מובילאיי", "checkpoint|צ'ק פוינט"]],
          ["🏦", "בארגון גדול ויציב", "הטכנולוגיה משרתת את העסק — בנק, קופת חולים, ממשלה. לרוב יציב יותר, ולפעמים קל יותר להתקבל למשרה ראשונה.", ["hapoalim|בנק הפועלים", "clalit|כללית", "iec|חברת חשמל", "elal|אל על"]],
        ] as [string, string, string, string[]][]).map(([e, t, d, firms]) => {
          const on = picked === t;
          return (
            <button
              key={t}
              onClick={() => setPicked(t as string)}
              style={{
                textAlign: "right", borderRadius: 20, padding: 16, cursor: "pointer", ...HEEBO,
                background: on ? "#eaf0f9" : "#fff",
                border: on ? `1.5px solid ${NAVY}` : "1.5px solid #e3ddd2",
                transition: "all .2s",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1b1f27" }}>{e} {t}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: MUTED, marginTop: 4 }}>{d}</div>
              {/* לוגואים בגודל מכובד (נתי 27.8): הלוגו הוא הצ'יפ — הטקסט
                  מוצג רק כשאין קובץ לוגו (כללית, חברת חשמל) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10, alignItems: "center" }}>
                {firms.map(f => {
                  const [id, label] = f.split("|");
                  return <FirmChip key={id} id={id} label={label} lit={on} />;
                })}
              </div>
            </button>
          );
        })}
      </div>
      {picked === "בחברת הייטק" && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginTop: 12 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1b1f27", marginBottom: 10 }}>
            ובתוך ההייטק עצמו יש שני עולמות:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "#fff7ec", borderRadius: 14, padding: 12, fontSize: 13.5, lineHeight: 1.6, color: "#1b1f27" }}>
              <b>🌱 סטארטאפ</b> — חברה קטנה שבונה משהו חדש. לומדים המון ומהר,
              נוגעים בהכל — אבל פחות יציב, וסטארטאפים גם נסגרים.
            </div>
            <div style={{ background: "#eaf0f9", borderRadius: 14, padding: 12, fontSize: 13.5, lineHeight: 1.6, color: "#1b1f27" }}>
              <b>🏢 חברה גדולה / תאגיד</b> — כמו גוגל או אינטל. מסודר, יציב,
              יש ממי ללמוד ומסלולי קידום — אבל התפקיד ממוקד יותר והקצב רגוע יותר.
            </div>
          </div>
        </div>
      )}
      {picked && (
        <>
          <div style={{ background: "#e7f6f0", borderRadius: 20, padding: 16, marginTop: 12, fontSize: 15, lineHeight: 1.65, color: "#046c4e" }}>
            <b>בחירה טובה — ואין פה תשובה נכונה.</b> שני העולמות פתוחים לך,
            והדרך אליהם עוברת דרך אותם לימודים. את הבחירה האמיתית תעשה
            בהמשך המסע, עם הרבה יותר מידע.
          </div>
          {introNextBtn(onNext)}
        </>
      )}
    </>
  );
}

// כרטיס 5 — שרשרת המוצר דרך אפליקציה שכולם מכירים (נתי 24.8: עוגן קונקרטי).
// Waze: ישראלית, בשימוש יומיומי אצל קהל היעד, וכל תפקיד מקבל דוגמה מוחשית.
function IntroChain({ onNext }: { onNext: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const CHAIN: [string, string, string][] = [
    ["💡", "מנהל/ת מוצר", "החליט/ה ש-Waze תזהיר על ניידת משטרה — כי זה מה שנהגים באמת רוצים"],
    ["🎨", "מעצב/ת UX", "עיצב/ה מסך שמבינים במבט אחד — גם כשנוהגים ב-90 קמ״ש"],
    ["💻", "מפתחים/ות", "כתבו את הקוד שמחשב לך מסלול מחדש תוך שניות כשפספסת יציאה"],
    ["📊", "אנשי דאטה", "הפקקים שאתה רואה מגיעים מהנתונים של הנהגים עצמם — מישהו בנה את זה"],
    ["🔍", "QA", "בדקו מה קורה כשה-GPS נעלם באמצע מנהרה"],
    ["🛡️", "סייבר", "דואגים שאף אחד לא יוכל לעקוב אחרי המיקום שלך"],
    ["🔌", "רשתות וחומרה", "השרתים שעונים למיליוני נהגים בו-זמנית בשעת פקק"],
    ["📣", "שיווק", "הפכו אפליקציה ישראלית קטנה לשם עולמי"],
  ];
  return (
    <>
      <IntroKicker n={5}>מי בנה את Waze?</IntroKicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 6 }}>
        האפליקציה שמנווטת אותך כל יום נבנתה בישראל — על ידי שרשרת של אנשים,
        וכל חוליה בה היא מקצוע. לחץ על תחנה כדי לראות מה עשו שם:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {CHAIN.map(([e, role, what], i) => {
          const on = open[role];
          return (
            <button
              key={role}
              onClick={() => setOpen({ ...open, [role]: !on })}
              style={{
                display: "flex", alignItems: "center", gap: 12, textAlign: "right",
                background: on ? "#eaf0f9" : "#fff", borderRadius: 16, padding: "12px 14px",
                border: "none", cursor: "pointer", transition: "background .2s", ...HEEBO,
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: 999, background: on ? NAVY : "#f0ede6",
                color: on ? "#fff" : FAINT, fontSize: 12.5, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{e}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#1b1f27" }}>{role}</span>
                {on && <span style={{ display: "block", fontSize: 13.5, color: NAVY, lineHeight: 1.5, marginTop: 2, fontWeight: 600 }}>{what}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {/* עוגן ה-wow: עובדה ציבורית מאומתת (2013) שממחישה לאן שרשרת כזאת מגיעה */}
      <div style={{ background: "#fff", borderRadius: 18, padding: 14, marginTop: 12, fontSize: 14.5, lineHeight: 1.65, color: "#1b1f27" }}>
        💰 בסוף, גוגל קנתה את Waze ביותר מ<b>מיליארד דולר</b> — אפליקציה
        שהתחילה מכמה ישראלים עם רעיון.
      </div>
      <div style={{ background: "#eaf0f9", borderRadius: 18, padding: 14, marginTop: 10, fontSize: 14.5, lineHeight: 1.6, color: NAVY, fontWeight: 600 }}>
        אחרי הפגישה תתנסה בכמה מהתפקידים האלה בעצמך — ותרגיש מה מדבר אליך.
      </div>
      {introNextBtn(onNext)}
    </>
  );
}

// כרטיס 6 — AI על כל התעשייה: בחר תפקיד ← ראה מה השתנה בו (נתי 24.8)
function IntroAI({ onNext }: { onNext: () => void }) {
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string | null>(null);
  const ROLES: [string, string, string][] = [
    ["💻", "מפתחים", "כלי AI כותבים חלק מהקוד. המפתח הפך למי שמכוון, בודק ומאמת — פחות להקליד, יותר להחליט."],
    ["📣", "שיווק", "טקסטים, תמונות וקמפיינים נוצרים בעזרת AI ברגעים — והמשווק מתפנה לאסטרטגיה: למי, מתי ולמה."],
    ["🎨", "עיצוב", "סקיצות ראשונות מיוצרות בשניות. המעצב מתמקד בשאלה הקשה באמת — מה המשתמש צריך."],
    ["📊", "דאטה", "ה-AI מנתח מהר — אבל מישהו צריך לשאול את השאלות הנכונות, ולתפוס אותו כשהוא ממציא."],
    ["🎧", "תמיכה ושירות", "צ'אטבוטים עונים על הפשוטות — האנשים מטפלים בבעיות המורכבות, ומלמדים את הבוט."],
    ["🔍", "QA", "ה-AI מייצר בדיקות אוטומטיות — והבודק מתכנן מה בכלל צריך לבדוק ואיפה זה יישבר."],
  ];
  const count = Object.keys(seen).length;
  return (
    <>
      <IntroKicker n={6}>ומה עם כל ה-AI הזה?</IntroKicker>
      <p style={{ fontSize: 15, color: "#1b1f27", lineHeight: 1.65, marginTop: 6 }}>
        בלי לייפות: ה-AI באמת משנה את התעשייה — <b>את כולה, לא רק את המתכנתים.</b>{" "}
        לחץ על תפקיד כדי לראות מה השתנה בו:
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
        {ROLES.map(([e, role]) => {
          const on = active === role;
          const was = seen[role];
          return (
            <button
              key={role}
              onClick={() => { setActive(role); setSeen({ ...seen, [role]: true }); }}
              style={{
                borderRadius: 999, padding: "9px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", ...HEEBO,
                background: on ? NAVY : "#fff", color: on ? "#fff" : was ? "#046c4e" : "#1b1f27",
                border: on ? "none" : was ? "1.5px solid #a7dcc8" : "1.5px solid #e3ddd2",
                transition: "all .2s",
              }}
            >
              {e} {role}{was && !on ? " ✓" : ""}
            </button>
          );
        })}
      </div>
      {active && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 18, marginTop: 12, fontSize: 15, lineHeight: 1.7, color: "#1b1f27" }}>
          {ROLES.find(r => r[1] === active)?.[2]}
        </div>
      )}
      {count >= 2 && (
        <>
          <div style={{ background: "#eaf0f9", borderRadius: 20, padding: 16, marginTop: 12, fontSize: 15, lineHeight: 1.65, color: NAVY }}>
            <b>ונולדו גם תפקידים חדשים לגמרי:</b> מיישמי AI בעסקים, בוני
            סוכנים חכמים, מנהלי מוצר AI — תפקידים שלפני שלוש שנים לא היו קיימים.
          </div>
          <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginTop: 10 }}>
            <div style={{ fontSize: 15, lineHeight: 1.65, color: "#1b1f27" }}>
              והמספרים? התמהיל משתנה — פחות משרות של כתיבת קוד טהורה, יותר משרות
              מוצר ועבודה עם AI. אבל הביקוש לא נעלם: מספר המשרות הפנויות בהייטק{" "}
              <b>עלה ב-12% ב-2025.</b>
            </div>
            <div style={{ fontSize: 12.5, color: FAINT, marginTop: 8 }}>רשות החדשנות, דוח 2026 — משרות פנויות +12.1%</div>
          </div>
          <div style={{ background: "#e7f6f0", borderRadius: 20, padding: 16, marginTop: 10, fontSize: 15, lineHeight: 1.6, color: "#046c4e", fontWeight: 600 }}>
            השורה התחתונה: מי שנכנס לתעשייה עכשיו לומד לעבוד עם AI מהיום
            הראשון — וזה בדיוק היתרון שלך על מי שכבר בפנים.
          </div>
          {introNextBtn(onNext)}
        </>
      )}
    </>
  );
}

// כרטיס 7 — ייצוג: סיפורים אמיתיים, לא סטטיסטיקה
function IntroPeople({ who, onNext }: { who: string; onNext: () => void }) {
  return (
    <>
      <IntroKicker n={7}>אנשים כמוך כבר שם</IntroKicker>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
        לא סטטיסטיקה — אנשים אמיתיים שעברו בדיוק את הדרך שאתה מתחיל עכשיו:
      </p>
      {/* פורמט כרטיסי הכתבות מדפי התחומים (נתי 25.8): תמונת הפרומו של
          הכתבה עצמה — רק כשהיא קיימת. לכתבה הישנה של יהונתן אין תמונת
          פרומו, ולא ממציאים לו אחת */}
      {[
        {
          name: "עמנואל — בודק תוכנה (QA) בחברת הייטק תל-אביבית",
          story: "עלה מאתיופיה בגיל צעיר — ותוך שנים ספורות כבר עבד בהייטק.",
          source: "ynet · 2023",
          href: "https://www.ynet.co.il/activism/article/rjhmifnqn",
          img: "/articles/story-emanuel.jpg",
        },
        {
          name: "יהונתן — מהשמירה בכניסה לבניין, אל ההייטק שבתוכו",
          story: "עבד כמאבטח בחברת הייטק. אחרי הכשרה בטק-קריירה חזר לאותו בניין — הפעם כאיש הייטק.",
          source: "ynet · 2019",
          href: "https://www.ynet.co.il/articles/0,7340,L-5456028,00.html",
          img: null as string | null,
        },
      ].map(x => (
        <a key={x.href} href={x.href} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", background: "#fff", borderRadius: 20, overflow: "hidden", marginTop: 12, textDecoration: "none", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {x.img && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={x.img} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <div style={{ padding: "13px 16px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(0,0,0,0.38)", textTransform: "uppercase" }}>{x.source}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.45, marginTop: 4 }}>{x.name}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5c6473", marginTop: 4 }}>{x.story}</p>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginTop: 6 }}>לכתבה המלאה ↗</div>
          </div>
        </a>
      ))}
      <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6, marginTop: 12 }}>
        {who} ליוותה אנשים כאלה בדיוק — וזה מה שמחכה לך בפגישה.
      </p>
      {introNextBtn(onNext, "סיימתי את המבוא ✓")}
    </>
  );
}

function IntroCard({ idx, who, onNext }: { idx: number; who: string; onNext: () => void }) {
  switch (idx) {
    case 0: return <IntroSize onNext={onNext} />;
    case 1: return <IntroSalary onNext={onNext} />;
    case 2: return <IntroWho onNext={onNext} />;
    case 3: return <IntroWhere onNext={onNext} />;
    case 4: return <IntroChain onNext={onNext} />;
    case 5: return <IntroAI onNext={onNext} />;
    default: return <IntroPeople who={who} onNext={onNext} />;
  }
}

// ─── סיום המבוא ──────────────────────────────────────────────────────────────

function IntroDone({ who, onPrep, onHome }: { who: string; onPrep: () => void; onHome: () => void }) {
  return (
    <>
      <h1 style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.3, marginTop: 18, color: "#1b1f27" }}>
        עכשיו יש לך את התמונה.
      </h1>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
        תעשייה של יותר מ-400 אלף איש, עם עשרות סוגי תפקידים — ואנשים
        שהתחילו בדיוק מאיפה שאתה. את השאר תעשה עם {who}.
      </p>

      <div style={{ background: "#fff3e2", borderRadius: 24, padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#7a4100" }}>שווה להביא לפגישה</div>
        <p style={{ fontSize: 15, color: "#7a4100", lineHeight: 1.6, marginTop: 6 }}>
          מה הפתיע אותך מכל מה שראית? תגיד את זה ל{who} — זו פתיחה מצוינת לשיחה.
        </p>
      </div>

      {/* כתבות טריות — למי שרוצה עוד. כולן נפתחו ואומתו */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00", marginBottom: 8 }}>מה כותבים העיתונים בחודשים האחרונים</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INTRO_ARTICLES.map(a => (
            <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 18, overflow: "hidden", textDecoration: "none", alignItems: "stretch" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.img} alt="" style={{ width: 96, objectFit: "cover", flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div style={{ padding: "10px 12px 10px 4px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1b1f27", lineHeight: 1.45 }}>{a.summary}</div>
                <div style={{ fontSize: 12, color: FAINT, marginTop: 4 }}>{a.source}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* צלילה למי שרוצה — פרק מלא, עם תווית אורך כנה. ירד מכרטיס 6 בכוונה:
          21 דקות בתוך מבוא של 7 גונבות את הקצב; כאן זה מתנה, לא מטלה */}
      <a
        href="https://www.youtube.com/watch?v=qo0iIqyYc_k"
        target="_blank" rel="noopener noreferrer"
        style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 18, overflow: "hidden", textDecoration: "none", marginTop: 16, alignItems: "stretch" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://i.ytimg.com/vi/qo0iIqyYc_k/hqdefault.jpg" alt="" style={{ width: 96, objectFit: "cover", flexShrink: 0 }} />
        <div style={{ padding: "10px 12px 10px 4px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1b1f27", lineHeight: 1.45 }}>
            ▶ רוצה לצלול? "האם ללמוד תכנות בעידן ה-AI" — שיחה מלאה בעברית
          </div>
          <div style={{ fontSize: 12, color: FAINT, marginTop: 4 }}>TechMonster · פרק פודקאסט מלא (21 דק׳) · יוטיוב</div>
        </div>
      </a>

      <button onClick={onPrep} style={{ ...btnPrimary, background: NAVY }}>להכנה לפגישה</button>
      <button
        onClick={onHome}
        style={{ width: "100%", marginTop: 10, padding: 14, borderRadius: 999, background: "#fff", color: NAVY, border: "1px solid #cfd6e2", fontSize: 16, fontWeight: 700, cursor: "pointer", ...HEEBO }}
      >
        חזרה לדף הבית
      </button>
    </>
  );
}

// ─── הכנה לפגישה ─────────────────────────────────────────────────────────────

function Prep({ who, booked, onHome }: { who: string; booked: boolean; onHome: () => void }) {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.02em", marginTop: 18, color: "#1b1f27" }}>
        לפגישה הזאת
        <br />
        אתה לא מביא כלום.
      </h1>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 10 }}>
        אין מסמכים, אין שיעורי בית, ואין מה להוכיח. {who} רוצה להכיר אותך.
      </p>

      <div style={{ background: "#fff", borderRadius: 24, padding: 20, marginTop: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1b1f27", marginBottom: 12 }}>על מה תהיה השיחה</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "מאיפה אתה, ומה עשית עד היום.",
            "מה מעניין אותך, גם אם עוד לא ברור לך בדיוק.",
            "מה אתה רוצה מהתקופה הקרובה.",
          ].map(t => (
            <div key={t} style={{ display: "flex", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: ORANGE, marginTop: 9, flexShrink: 0 }} />
              <span style={{ fontSize: 16, lineHeight: 1.6, color: "#1b1f27" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* המענה לחשש מהישפטות — בלי לקרוא לחשש בשמו */}
      <div style={{ background: "#e7f6f0", borderRadius: 24, padding: 22, marginTop: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#046c4e" }}>אין שאלה שאפשר ליפול בה</div>
        <p style={{ fontSize: 15, color: "#065f46", lineHeight: 1.6, marginTop: 6 }}>
          אם משהו לא ברור, אפשר להגיד &quot;עוד לא חשבתי על זה&quot;. זו תשובה מצוינת.
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 24, padding: 20, marginTop: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1b1f27" }}>מה שווה לחשוב עליו</div>
        <div style={{ fontSize: 14, color: FAINT, marginTop: 2, marginBottom: 12 }}>בראש. לא צריך לכתוב.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            `מה בא לך ש${who} ידע עליך?`,
            "מה עשית פעם ונהנית ממנו — לא חייב מחשבים.",
            "מה הכי בא לך לשאול אותו?",
          ].map(t => (
            <div key={t} style={{ border: "1px solid #eee9e0", borderRadius: 18, padding: 16, fontSize: 16, fontWeight: 500, color: "#1b1f27" }}>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* מסלול חזרה למי שלא יכול להגיע. בלעדיו אי-הגעה היא סוף הדרך */}
      <div style={{ textAlign: "center", fontSize: 15, color: FAINT, lineHeight: 1.7, marginTop: 22 }}>
        {booked ? (
          <>
            נתראה בקרוב. פשוט תגיע.
            <br />
            <Link href="/contact?m=1" style={{ color: NAVY, fontWeight: 700, fontSize: 14 }}>
              לא מתאים לך המועד? אפשר לשנות
            </Link>
          </>
        ) : (
          <Link href="/contact?m=1" style={{ color: NAVY, fontWeight: 700 }}>לקבוע את הפגישה ←</Link>
        )}
      </div>

      <button onClick={onHome} style={{ ...btnPrimary, background: NAVY }}>חזרה לדף הבית</button>
    </>
  );
}

const btnPrimary: React.CSSProperties = {
  width: "100%", marginTop: 18, padding: 14, borderRadius: 999, border: "none",
  background: ORANGE, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
  ...HEEBO,
};
