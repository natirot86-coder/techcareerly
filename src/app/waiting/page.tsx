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
 * 3. **טעימה אחת, אותה אחת לכולם.** לא בחירה מבין שבעה. בחירה היא כבר החלטה
 *    קטנה שמעגנת, וסימולציית ה-AI נבנתה בדיוק לתפקיד: שתי דקות, אפס ידע
 *    מוקדם, ואפס אפשרות כישלון. שבעת התחומים נפתחים בשלב 3, במקומם.
 *
 * הקצה של הציר משתנה: לפני קביעת פגישה הוא **קריאה לקבוע** — וזו הפעולה
 * החשובה במסך, לא הטעימה. אחרי הקביעה הוא כרטיס הפגישה.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { track as trackEvent } from "@vercel/analytics";
import { coordinatorFor } from "@/data/meetings";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";
const CREAM = "#fbf9f5";
const SAND = "#ece7de";
const MUTED = "#5c6473";
const FAINT = "#8a919d";

const HEEBO = { fontFamily: "'Heebo', sans-serif" };

type Screen = "home" | "taste" | "prep";
type Phase = "frame" | "label" | "test" | "done";

// ─── היצורים ─────────────────────────────────────────────────────────────────

type Size = "big" | "small";
type Color = "warm" | "cool";
type Fill = "solid" | "ring";
type Creature = { id: string; size: Size; color: Color; fill: Fill };

const TRAIN: Creature[] = [
  { id: "t1", size: "big",   color: "warm", fill: "solid" },
  { id: "t2", size: "small", color: "cool", fill: "solid" },
  { id: "t3", size: "big",   color: "cool", fill: "ring" },
  { id: "t4", size: "small", color: "warm", fill: "ring" },
  { id: "t5", size: "big",   color: "warm", fill: "ring" },
  { id: "t6", size: "small", color: "cool", fill: "ring" },
];

const TEST: Creature[] = [
  { id: "x1", size: "big",   color: "cool", fill: "solid" },
  { id: "x2", size: "small", color: "warm", fill: "solid" },
  { id: "x3", size: "big",   color: "warm", fill: "solid" },
];

const VALUE_WORD: Record<string, string> = {
  big: "לגדולים", small: "לקטנים",
  warm: "לכתומים", cool: "לכחולים",
  solid: "למלאים", ring: "לחלולים",
};

type Rule = { attr: "size" | "color" | "fill"; yes: string } | null;

/**
 * מסיק את הכלל מהתיוגים של המשתמש עצמו.
 *
 * לכל תכונה: מקבצים לפי ערך, וסופרים לכל ערך את הרוב (כן או לא). סכום הרוב
 * חלקי מספר התיוגים הוא "ציון הטוהר" של התכונה — כמה עקבי המשתמש היה לגביה.
 * התכונה הטהורה ביותר מנצחת.
 *
 * **אם לא סומן אף "כן" — אין כלל, והמערכת מנחשת "כן" תמיד.** בשום מצב אין
 * מסלול שבו המשתמש נכשל או מקבל הודעת שגיאה.
 */
function inferRule(labels: Record<string, boolean>): Rule {
  const tagged = TRAIN.filter(c => c.id in labels);
  if (tagged.length === 0) return null;

  let best: Rule = null;
  let bestScore = -1;

  for (const attr of ["size", "color", "fill"] as const) {
    const byValue = new Map<string, { yes: number; no: number }>();
    for (const c of tagged) {
      const v = c[attr];
      const acc = byValue.get(v) ?? { yes: 0, no: 0 };
      labels[c.id] ? acc.yes++ : acc.no++;
      byValue.set(v, acc);
    }
    const purity = [...byValue.values()].reduce((s, v) => s + Math.max(v.yes, v.no), 0) / tagged.length;
    const yesValue = [...byValue.entries()].sort((a, b) => (b[1].yes - b[1].no) - (a[1].yes - a[1].no))[0];
    if (purity > bestScore && yesValue && yesValue[1].yes > 0) {
      bestScore = purity;
      best = { attr, yes: yesValue[0] };
    }
  }
  return best;
}

function guess(rule: Rule, c: Creature): boolean {
  if (!rule) return true;
  return c[rule.attr] === rule.yes;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function WaitingPage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [phase, setPhase] = useState<Phase>("frame");
  const [labels, setLabels] = useState<Record<string, boolean>>({});
  const [hint, setHint] = useState(false);
  const [testIdx, setTestIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [tasteDone, setTasteDone] = useState(false);
  const [booked, setBooked] = useState(false);
  const [name, setName] = useState("");
  /** null = הפגישה עוד לא סומנה · "yes" = התקיימה · "missed" = לא הגיע */
  const [attended, setAttended] = useState<"yes" | "missed" | null>(null);
  /** האם המועד כבר עבר. כשאין מועד שמור — נשאר false, ומוצע קישור יזום */
  const [passed, setPassed] = useState(false);
  const [hasDate, setHasDate] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (v === "missed") {
      // הסיגנל החזק ביותר ל-At Risk בכל הפאנל, ואין דרך אחרת להשיג אותו
      localStorage.setItem("at-risk", "missed-meeting-1");
    }
  }

  useEffect(() => { window.scrollTo(0, 0); }, [screen, phase]);

  // מחסום. אין דרך להגיע לשתי הדקות בלי פגישה קבועה — גם לא בקישור ישיר
  useEffect(() => { if (screen === "taste" && !booked) setScreen("home"); }, [screen, booked]);

  // רמז אחרי 12 שניות בלי תיוג — כדי שאף אחד לא יישאר תקוע מול מסך ריק
  useEffect(() => {
    if (phase !== "label") return;
    if (Object.keys(labels).length > 0) { setHint(false); return; }
    hintTimer.current = setTimeout(() => setHint(true), 12000);
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current); };
  }, [phase, labels]);

  const rule = useMemo(() => inferRule(labels), [labels]);
  const count = Object.keys(labels).length;

  const label = (id: string, val: boolean) => setLabels({ ...labels, [id]: val });

  function answerTest(correct: boolean) {
    const nextHits = hits + (correct ? 1 : 0);
    setHits(nextHits);
    if (testIdx < TEST.length - 1) {
      setTestIdx(testIdx + 1);
    } else {
      /* התוצאה נאספת לרכזת — כדי שהיא לא תצטרך לשאול, והוא לא לזכור */
      const result = {
        rule: rule ? `${rule.attr}=${rule.yes}` : "none",
        ruleWord: rule ? VALUE_WORD[rule.yes] : null,
        labeled: count,
        hits: nextHits,
        at: new Date().toISOString(),
      };
      localStorage.setItem("waiting-taste", JSON.stringify(result));
      trackEvent("waiting_taste_done", { hits: nextHits, labeled: count });
      setTasteDone(true);
      setPhase("done");
    }
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: CREAM, ...HEEBO }}>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "28px 20px 36px" }}>
        {screen === "home" && (
          <Home
            name={name} who={who} booked={booked} tasteDone={tasteDone}
            attended={attended} passed={passed} hasDate={hasDate}
            onAttendance={markAttendance}
            onTaste={() => { setScreen("taste"); setPhase("frame"); trackEvent("waiting_taste_start"); }}
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
            <Back onClick={() => (phase === "frame" ? setScreen("home") : setPhase("frame"))} />

            {phase === "frame" && <Frame who={who} onStart={() => setPhase("label")} />}

            {phase === "label" && (
              <LabelPhase
                labels={labels} count={count} rule={rule} hint={hint}
                onLabel={label} onNext={() => setPhase("test")}
              />
            )}

            {phase === "test" && (
              <TestPhase
                creature={TEST[testIdx]} idx={testIdx} rule={rule} onAnswer={answerTest}
              />
            )}

            {phase === "done" && (
              <Done
                hits={hits} rule={rule} who={who}
                onPrep={() => setScreen("prep")}
                onHome={() => setScreen("home")}
              />
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
              שתי דקות — איך חושבים בהייטק
            </CardHead>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
              {tasteDone
                ? "כבר עשית את זה. אפשר לחזור מתי שבא לך."
                : booked
                  ? "לא תחום ולא בחירה — רעיון אחד שחוזר בכל ההייטק. אין ציון ואי אפשר להיכשל."
                  : "נפתח אחרי שתקבע את הפגישה. שתי דקות, בלי ציון ובלי מה להתכונן."}
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

// ─── מסגור ───────────────────────────────────────────────────────────────────

function Frame({ who, onStart }: { who: string; onStart: () => void }) {
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00", marginTop: 18 }}>בינה מלאכותית</div>
      <h1 style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.02em", marginTop: 4, color: "#1b1f27" }}>
        תלמד מערכת להבדיל בין שני דברים
      </h1>

      <div style={{ background: "#fff", borderRadius: 24, padding: 20, marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          "שתי דקות. אין ציון, אין תשובה נכונה, ואי אפשר להיכשל.",
          "המטרה היא להרגיש איך העולם הזה נראה מבפנים. לא לגלות מה מתאים לך.",
          `מה שתשים לב אליו, תוכל לספר ל${who} בפגישה.`,
        ].map(t => (
          <div key={t} style={{ fontSize: 16, lineHeight: 1.6, color: "#1b1f27" }}>{t}</div>
        ))}
      </div>

      <button onClick={onStart} style={btnPrimary}>יאללה, מתחילים</button>
    </>
  );
}

// ─── שלב התיוג ───────────────────────────────────────────────────────────────

function LabelPhase({
  labels, count, rule, hint, onLabel, onNext,
}: {
  labels: Record<string, boolean>; count: number; rule: Rule; hint: boolean;
  onLabel: (id: string, v: boolean) => void; onNext: () => void;
}) {
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00", marginTop: 18 }}>
        בינה מלאכותית · שלב 1 מתוך 2
      </div>
      <h1 style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.3, marginTop: 4, color: "#1b1f27" }}>
        תלמד את המערכת מה זה &quot;כן&quot;
      </h1>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
        עבור על היצורים וסמן. אתה מחליט מה כן ומה לא — אין תשובה נכונה.
      </p>

      {/* רמז נגד תקיעות. מופיע רק אם עברו 12 שניות בלי אף תיוג */}
      {hint && count === 0 && (
        <div style={{ background: "#fff3e2", color: "#7a4100", borderRadius: 20, padding: 16, marginTop: 14, fontSize: 15, lineHeight: 1.6 }}>
          אין פה טעות. תבחר משהו שמושך אותך — למשל כל הגדולים — ותסמן לפיו.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {TRAIN.map(c => {
          const v = labels[c.id];
          const border = v === undefined ? "#f0ebe2" : v ? GREEN : "#cfd6e2";
          return (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 10, background: "#fff",
              borderRadius: 20, padding: "12px 16px", border: `2px solid ${border}`,
              transition: "border-color .2s",
            }}>
              <div style={{ width: 64, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                <Blob c={c} />
              </div>
              <div style={{ display: "flex", gap: 8, marginRight: "auto" }}>
                <Pill on={v === true} onClick={() => onLabel(c.id, true)}
                  bgOn={GREEN} fgOn="#fff" bgOff="#e7f6f0" fgOff="#046c4e">כן</Pill>
                <Pill on={v === false} onClick={() => onLabel(c.id, false)}
                  bgOn="#5c6473" fgOn="#fff" bgOff="#f0f1f4" fgOff="#5c6473">לא</Pill>
              </div>
            </div>
          );
        })}
      </div>

      {/* משוב חי — המערכת "חושבת בקול" מהתיוגים שלו, וזה מה שהופך את זה למוחשי */}
      {count >= 2 && rule && (
        <div style={{ background: "#eaf0f9", borderRadius: 20, padding: 16, marginTop: 14, fontSize: 16, fontWeight: 500, color: NAVY, lineHeight: 1.6 }}>
          אני מתחילה להבין. נראה שאתה אומר כן {VALUE_WORD[rule.yes]}.
        </div>
      )}

      {count >= 4 && (
        <button onClick={onNext} style={btnPrimary}>עכשיו תן לה לנחש</button>
      )}
    </>
  );
}

function Pill({
  on, onClick, bgOn, fgOn, bgOff, fgOff, children,
}: {
  on: boolean; onClick: () => void; bgOn: string; fgOn: string; bgOff: string; fgOff: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px", borderRadius: 999, border: "none", cursor: "pointer",
        fontSize: 15, fontWeight: 700, ...HEEBO,
        background: on ? bgOn : bgOff, color: on ? fgOn : fgOff,
      }}
    >
      {children}
    </button>
  );
}

function Blob({ c, scale = 1 }: { c: Creature; scale?: number }) {
  const size = (c.size === "big" ? 54 : 30) * scale;
  const col = c.color === "warm" ? ORANGE : NAVY;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: c.fill === "solid" ? col : "transparent",
      border: c.fill === "ring" ? `${5 * scale}px solid ${col}` : "none",
      transition: "all .2s",
    }} />
  );
}

// ─── שלב הניחוש ──────────────────────────────────────────────────────────────

function TestPhase({
  creature, idx, rule, onAnswer,
}: {
  creature: Creature; idx: number; rule: Rule; onAnswer: (correct: boolean) => void;
}) {
  const g = guess(rule, creature);
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00", marginTop: 18 }}>
        בינה מלאכותית · שלב 2 מתוך 2
      </div>
      <h1 style={{ fontSize: 27, fontWeight: 800, marginTop: 4, color: "#1b1f27" }}>עכשיו תורה</h1>
      <p style={{ fontSize: 15, color: MUTED, marginTop: 8 }}>
        יצור חדש שהיא לא ראתה. {idx + 1} מתוך {TEST.length}
      </p>

      <div style={{
        background: "#fff", borderRadius: 26, padding: 26, marginTop: 18,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        <Blob c={creature} scale={1.5} />
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1b1f27" }}>
          היא מנחשת: {g ? "כן" : "לא"}. צדקה?
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={() => onAnswer(false)}
          style={{ flex: 1, padding: 15, borderRadius: 999, background: "#fff", color: NAVY, border: "1px solid #cfd6e2", fontSize: 16, fontWeight: 700, cursor: "pointer", ...HEEBO }}
        >
          פספסה
        </button>
        <button
          onClick={() => onAnswer(true)}
          style={{ flex: 1, padding: 15, borderRadius: 999, background: GREEN, color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", ...HEEBO }}
        >
          קלעה
        </button>
      </div>

      <div style={{ textAlign: "center", fontSize: 14, color: FAINT, marginTop: 12 }}>
        גם כשהיא טועה זה בסדר. ככה מערכות לומדות.
      </div>
    </>
  );
}

// ─── סיום ────────────────────────────────────────────────────────────────────

function Done({
  hits, rule, who, onPrep, onHome,
}: {
  hits: number; rule: Rule; who: string; onPrep: () => void; onHome: () => void;
}) {
  return (
    <>
      <h1 style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.3, marginTop: 18, color: "#1b1f27" }}>
        לימדת מערכת כלל.
      </h1>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
        בלי שורת קוד אחת.
        <br />
        {hits === TEST.length ? "היא קלעה בכל שלוש." : `היא קלעה ב-${hits} מתוך ${TEST.length}. גם ככה לומדים.`}
      </p>

      <div style={{ background: "#fff", borderRadius: 24, padding: 20, marginTop: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#b35e00" }}>מה שעשית נקרא</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: "#1b1f27" }}>לימוד מכונה מדוגמאות</div>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
          נתת דוגמאות, המערכת מצאה את הכלל, ואז ניחשה על משהו חדש.
          {rule && <> הכלל שהיא מצאה אצלך: <b>כן {VALUE_WORD[rule.yes]}</b>.</>}
        </p>
      </div>

      {/* הגנת פיזור — אין להסיר. היא מונעת ממנו לצאת מכאן עם "אז זה AI".
          מפזרת בפועל ולא רק מסתייגת */}
      <div style={{ background: "#eaf0f9", borderRadius: 24, padding: 20, marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>אותו רעיון עובד גם ב־</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {["דאטה ואנליטיקס", "סייבר", "שיווק דיגיטלי"].map(t => (
            <span key={t} style={{ background: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: NAVY }}>
              {t}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 12 }}>
          רוב הדברים בהייטק נוגעים זה בזה. אף אחד לא בוחר עכשיו.
        </p>
      </div>

      <div style={{ background: "#fff3e2", borderRadius: 24, padding: 20, marginTop: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#7a4100" }}>שווה להביא לפגישה</div>
        <p style={{ fontSize: 15, color: "#7a4100", lineHeight: 1.6, marginTop: 6 }}>
          מה שמת לב שאתה עושה כדי להחליט? {who} תדע לקחת את זה הלאה.
        </p>
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
