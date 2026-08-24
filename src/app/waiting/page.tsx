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
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "28px 20px 36px" }}>
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

/** מספר גדול + שורת מקור. המקור מוצג — מספר בלי מקור נקרא כפרסומת */
function BigStat({ kicker, stat, sub, source }: { kicker: string; stat: string; sub: string; source: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 24, padding: 22, marginTop: 16 }}>
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
      <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00", marginTop: 18 }}>
        העולם שאתה נכנס אליו · {n} מתוך {INTRO_TOTAL}
      </div>
      <h1 style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.3, marginTop: 4, color: "#1b1f27" }}>{children}</h1>
    </>
  );
}

function IntroCard({ idx, who, onNext }: { idx: number; who: string; onNext: () => void }) {
  const next = (label = "הבנתי, הלאה ←") => (
    <button onClick={onNext} style={btnPrimary}>{label}</button>
  );

  switch (idx) {
    case 0: return (
      <>
        <IntroKicker n={1}>כמה גדול הדבר הזה?</IntroKicker>
        <BigStat
          kicker="עובדים בהייטק הישראלי"
          stat="+400,000"
          sub="בערך אחד מכל תשעה עובדים במשק. זו לא נישה של מעטים — זו תעשייה שלמה, והיא כל הזמן מחפשת אנשים חדשים."
          source="רשות החדשנות, דוח מצב ההייטק 2026 — 11.4% מהמועסקים ב-2025"
        />
        {next()}
      </>
    );

    case 1: return (
      <>
        <IntroKicker n={2}>וכמה משלמים בו?</IntroKicker>
        <BigStat
          kicker="שכר חודשי ממוצע בהייטק"
          stat="כ-32,000 ₪"
          sub="יותר מפי שניים מהשכר הממוצע בשאר המשק (כ-13,600 ₪)."
          source="נתוני הלמ״ס, סוף 2025"
        />
        {/* שורת האמת — בלעדיה המספר מרחיק ("לא בשבילי") או מייצר ציפייה שגויה */}
        <div style={{ background: "#fff3e2", borderRadius: 20, padding: 16, marginTop: 12, fontSize: 15, lineHeight: 1.65, color: "#7a4100" }}>
          <b>חשוב לקרוא את המספר נכון:</b> זה ממוצע על כולם — כולל אנשים עם 15
          שנות ניסיון. מתחילים נמוך מזה, ועולים מהר יותר מכמעט כל מקצוע אחר.
        </div>
        {next()}
      </>
    );

    case 2: return (
      <>
        <IntroKicker n={3}>וזה לא רק מתכנתים</IntroKicker>
        <BigStat
          kicker="כמה מעובדי ההייטק כותבים קוד"
          stat="בערך חצי"
          sub="כל השאר עובדים בתפקידים שאינם פיתוח — ניהול מוצר, עיצוב, נתונים, שיווק, מכירות, בדיקות ותמיכה."
          source="רשות החדשנות 2026 — 49% במשרות מו״פ, 110 אלף במשרות מוצר"
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {["ניהול מוצר", "עיצוב UX", "אנליזת נתונים", "שיווק דיגיטלי", "QA", "מכירות", "תמיכה"].map(t => (
            <span key={t} style={{ background: "#fff", borderRadius: 999, padding: "7px 13px", fontSize: 13.5, fontWeight: 600, color: NAVY }}>{t}</span>
          ))}
        </div>
        {next()}
      </>
    );

    case 3: return (
      <>
        <IntroKicker n={4}>והוא גם לא רק בחברות הייטק</IntroKicker>
        <div style={{ background: "#fff", borderRadius: 24, padding: 20, marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 16, lineHeight: 1.65, color: "#1b1f27" }}>
            אנשי טכנולוגיה עובדים גם בבנקים, בקופות חולים, בממשלה ובכל ארגון גדול.
            ההבדל פשוט:
          </div>
          <div style={{ background: "#eaf0f9", borderRadius: 16, padding: 14, fontSize: 15, lineHeight: 1.6, color: NAVY }}>
            <b>בחברת הייטק</b> — הטכנולוגיה היא המוצר עצמו. שם בדרך כלל השכר
            הגבוה יותר וקצב הלמידה המהיר יותר.
          </div>
          <div style={{ background: "#f4f5f7", borderRadius: 16, padding: 14, fontSize: 15, lineHeight: 1.6, color: "#3f4a5c" }}>
            <b>בארגון רגיל</b> — הטכנולוגיה משרתת את העסק. לרוב יציב יותר,
            ולפעמים קל יותר להתקבל למשרה ראשונה דרכו.
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED }}>
            שני העולמות פתוחים לך — ובהמשך המסע נדבר בדיוק על ההבדל הזה.
          </div>
        </div>
        {next()}
      </>
    );

    case 4: return (
      <>
        <IntroKicker n={5}>איך בכלל נולד מוצר?</IntroKicker>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
          כל אפליקציה שיש לך בטלפון עברה דרך שרשרת של אנשים — וכל חוליה היא מקצוע:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {[
            ["💡", "מנהל/ת מוצר", "מחליט/ה מה בונים ולמה"],
            ["🎨", "מעצב/ת UX", "מצייר/ת איך זה ייראה וירגיש"],
            ["💻", "מפתחים/ות", "כותבים את הקוד שמפעיל הכל"],
            ["📊", "אנשי דאטה", "מודדים מה עובד ומה לא"],
            ["🔍", "QA", "מוצאים את התקלות לפני הלקוחות"],
            ["🛡️", "סייבר", "שומרים שאף אחד לא יפרוץ"],
            ["🔌", "רשתות וחומרה", "הברזלים והחיבורים שהכל רץ עליהם"],
            ["📣", "שיווק", "דואגים שהעולם ישמע על זה"],
          ].map(([e, role, what]) => (
            <div key={role} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 16, padding: "11px 14px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{e}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1b1f27" }}>{role}</div>
                <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.45 }}>{what}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#eaf0f9", borderRadius: 18, padding: 14, marginTop: 12, fontSize: 14.5, lineHeight: 1.6, color: NAVY, fontWeight: 600 }}>
          אחרי הפגישה תתנסה בכמה מהתפקידים האלה בעצמך — ותרגיש מה מדבר אליך.
        </div>
        {next()}
      </>
    );

    case 5: return (
      <>
        <IntroKicker n={6}>ומה עם כל ה-AI הזה?</IntroKicker>
        <div style={{ background: "#fff", borderRadius: 24, padding: 20, marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 16, lineHeight: 1.65, color: "#1b1f27" }}>
            בלי לייפות: ה-AI באמת משנה את התעשייה. יש פחות משרות של כתיבת קוד
            טהורה — ויותר משרות של עבודה <b>עם</b> AI, ניהול מוצר ותפקידים שסביב הקוד.
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.65, color: MUTED }}>
            בשנת 2025 מספר המשרות הפנויות בהייטק דווקא <b>עלה ב-12%</b> — הביקוש
            לא נעלם, הוא משנה צורה.
          </div>
          <div style={{ background: "#e7f6f0", borderRadius: 16, padding: 14, fontSize: 15, lineHeight: 1.6, color: "#046c4e", fontWeight: 600 }}>
            השורה התחתונה של המעסיקים: מי שיודע לעבוד עם AI שווה יותר, לא פחות.
            ומי שנכנס לתעשייה עכשיו — לומד את זה מהיום הראשון.
          </div>
          <div style={{ fontSize: 12.5, color: FAINT }}>רשות החדשנות, דוח 2026 — משרות פנויות +12.1% ב-2025</div>
        </div>
        {/* סרטון מאומת (oEmbed 24.8): TechMonster — בעברית, בדיוק על השאלה הזאת */}
        <a
          href="https://www.youtube.com/watch?v=qo0iIqyYc_k"
          target="_blank" rel="noopener noreferrer"
          style={{ display: "block", background: "#fff", borderRadius: 20, overflow: "hidden", marginTop: 12, textDecoration: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://i.ytimg.com/vi/qo0iIqyYc_k/hqdefault.jpg" alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1b1f27", lineHeight: 1.4 }}>
              ▶ האם ללמוד תכנות בעידן ה-AI: מה המעסיקים באמת מחפשים?
            </div>
            <div style={{ fontSize: 12.5, color: FAINT, marginTop: 3 }}>TechMonster · יוטיוב · בעברית</div>
          </div>
        </a>
        {next()}
      </>
    );

    default: return (
      <>
        <IntroKicker n={7}>אנשים כמוך כבר שם</IntroKicker>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
          לא סטטיסטיקה — אנשים אמיתיים שעברו בדיוק את הדרך שאתה מתחיל עכשיו:
        </p>
        {[
          {
            name: "יהונתן",
            story: "עבד כמאבטח בחברת הייטק. אחרי הכשרה בטק-קריירה חזר לאותו בניין — הפעם כאיש הייטק.",
            source: "ynet, הכתבה המלאה",
            href: "https://www.ynet.co.il/articles/0,7340,L-5456028,00.html",
          },
          {
            name: "עמנואל",
            story: "עלה מאתיופיה בגיל צעיר — ותוך שנים ספורות כבר עבד כבודק תוכנה (QA) בחברת הייטק תל-אביבית.",
            source: "ynet, הכתבה המלאה",
            href: "https://www.ynet.co.il/activism/article/rjhmifnqn",
          },
        ].map(x => (
          <div key={x.name} style={{ background: "#fff", borderRadius: 20, padding: 18, marginTop: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{x.name}</div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "#1b1f27", marginTop: 6 }}>{x.story}</p>
            <a href={x.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, fontWeight: 700, color: NAVY }}>
              {x.source} ↗
            </a>
          </div>
        ))}
        <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6, marginTop: 12 }}>
          {who} ליוותה אנשים כאלה בדיוק — וזה מה שמחכה לך בפגישה.
        </p>
        {next("סיימתי את המבוא ✓")}
      </>
    );
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
          מה הפתיע אותך מכל מה שקראת? תגיד את זה ל{who} — זו פתיחה מצוינת לשיחה.
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
