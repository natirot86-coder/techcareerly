/**
 * /admin/analytics — מה באמת קורה באפליקציה.
 *
 * הדף בנוי הפוך מדשבורד רגיל: **קודם השאלה, אחר כך הגרף.** כל כרטיס נושא
 * את שאלת המחקר שהוא עונה עליה ואת הסף שלנו — כדי שמספר לא ייקרא כ"נחמד
 * לדעת" אלא כתשובה לשאלה שהחלטנו מראש שהיא חשובה.
 *
 * **הספים מחולקים לשניים בכוונה:**
 *   `hard`  — יש לו בסיס. או החלטת מוצר מתועדת (72 שעות ← At Risk), או
 *             תוצאה מאומתת (התפלגות ההמלצות על 729 צירופים), או אריתמטיקה
 *             (דדליין שעבר הוא דדליין שעבר).
 *   `none`  — אין לנו בנצ'מרק, והמחזור הראשון הוא שיקבע את הבסיס. **כתוב
 *             במפורש שאין**, כי סף מומצא גרוע מאין סף: הוא נראה כמו ידע.
 *
 * כל גרף מצייר שלד גם בלי נתונים, כך שרואים מה עומד להגיע ומה חסר כדי שיגיע.
 * המקורות: supabase/migrations/001 — admin_stats().
 */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { JOURNEY_STAGES } from "@/components/ui/JourneyStrip";
import { DOMAIN_LABEL, type Domain } from "@/data/institutions";
import AdminGate from "@/components/AdminGate";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";
const RED = "#dc2626";
const MUTED = "rgba(0,0,0,0.1)";

type Stats = {
  candidates: number; onboarded: number; returning: number; at_risk: number;
  by_stage: Record<string, number>;
  sims_started: number; sims_completed: number;
  sims_by_domain: Record<string, number>;
  chosen_domains: Record<string, number>;
  interest_gap: number;
  paths_completed: number;
  recommendations: Record<string, number>;
  plan_open: number; plan_done: number; plan_overdue: number;
  events_7d: Record<string, number>;
  meetings: { m1: number; m2: number; m3: number } | null;
  blockers_opened: Record<string, number>;
  quiz_reach: Record<string, number>;
  scct_grid: { i: number; e: number; n: number }[];
  by_hour: Record<string, number>;
  stuck_3x: number;
  generated_at: string;
};

const TRACK_LABEL: Record<string, string> = { degree: "תואר", mahat: "מה״ט", bootcamp: "הכשרה" };

/** אומת על כל 729 הצירופים של שאלון שלב 4. חריגה מזה = השקלול לא מייצג */
const EXPECTED_MIX: Record<string, number> = { degree: 52, mahat: 10, bootcamp: 38 };

const QUIZ_LABELS = ["שעות", "כסף", "השכלה", "ילדים", "יציבות", "מיקום"];

/**
 * הצבירה של האירועים החדשים.
 *
 * לא ב-admin_stats() כי היא נכתבה לפני שהאירועים האלה היו קיימים, והוספה
 * שם דורשת מיגרציה. נצברת ב-/api/funnel בצד שרת, מאותו לוג בדיוק.
 */
type Funnels = {
  cohort: string;
  cohortCounts: Record<string, number>;
  sampled: number;
  sampledAll: number;
  simSteps: Record<string, { i: number; of: number; concept: string; n: number }[]>;
  scctSteps: Record<string, number>;
  blockers: Record<string, number>;
  solutions: Record<string, number>;
  meeting: { open: number; ready: number; failed: number; booked: number };
  tasksReopened: Record<string, number>;
};

const SCCT_Q: Record<string, string> = {
  interest_scale: "עניין",
  interest_open: "עניין — כתיבה",
  efficacy_scale: "מסוגלות",
  efficacy_open: "מסוגלות — כתיבה",
  outcome_scale: "ציפיות",
  outcome_open: "ציפיות — כתיבה",
};
const SCCT_ORDER = ["interest_scale", "interest_open", "efficacy_scale", "efficacy_open", "outcome_scale", "outcome_open"];

function AdminAnalyticsPage() {
  const [f, setF] = useState<Funnels | null>(null);
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /*
    הקוהורט שמוצג (28.8). ברירת המחדל main בכוונה — פיילוט
    שמדלג על הטעימות היה מצניח את אחוז ההמרה ונראה כמו רגרסיה.
  */
  const [cohort, setCohort] = useState("main");

  useEffect(() => {
    (async () => {
      if (!supabase) { setErr("no-env"); setLoading(false); return; }
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) setErr(error.message); else setS(data as Stats);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // הצבירה של האירועים החדשים — אותו קוד גישה של שאר לוחות הניהול
      const code = localStorage.getItem("coordinator-code");
      if (!code) return;
      const r = await fetch(`/api/funnel?cohort=${cohort}`, { headers: { "x-coordinator-code": code } });
      if (r.ok) setF(await r.json());
    })();
  }, [cohort]);

  const live = !!s;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 26, marginTop: 8, ...HEEBO }}>מה קורה באפליקציה</div>
          <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7 }}>
            {loading ? "טוען…" : live
              ? `עודכן ${new Date(s!.generated_at).toLocaleString("he-IL")}`
              : "ממתין לחיבור הבקאנד — כל גרף מציג את השלד שלו"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {[["/admin/institutions", "מוסדות"], ["/admin/scholarships", "מלגות"]].map(([h, l]) => (
              <Link key={h} href={h} style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.14)", color: "#fff" }}>{l}</Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 24px 60px" }}>
        {/*
          בורר קוהורט — מופיע רק כשבאמת יש יותר מאחד. כל עוד הפיילוט
          לא התחיל, המסך נראה בדיוק כמו קודם — ולא מוסיף פקד שאין לו משמעות.
        */}
        {f && Object.keys(f.cohortCounts ?? {}).length > 1 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#6b6558" }}>קהל:</span>
            {[["main", "הקהל הרחב"], ["alumni", "בוגרי טק-קריירה"], ["all", "הכל יחד"]].map(([id, label]) => {
              const n = id === "all" ? Object.values(f.cohortCounts).reduce((a, b) => a + b, 0) : (f.cohortCounts[id] ?? 0);
              const on = cohort === id;
              return (
                <button key={id} onClick={() => setCohort(id)}
                  style={{
                    fontSize: 12.5, fontWeight: 800, padding: "6px 12px", borderRadius: 999,
                    background: on ? NAVY : "#fff", color: on ? "#fff" : "#4a463e",
                    border: `1px solid ${on ? NAVY : "rgba(0,0,0,0.12)"}`, cursor: "pointer",
                  }}>
                  {label} <span style={{ opacity: 0.6 }}>{n}</span>
                </button>
              );
            })}
            <span style={{ fontSize: 11.5, color: "#8b8577" }}>
              הגרפים למטה מסננים לפי הבחירה. הכרטיסים העליונים (admin_stats) מציגים את כולם.
            </span>
          </div>
        )}
        {!live && !loading && (
          <Banner tone={err === "no-env" ? "danger" : "warn"}>
            {err === "no-env" ? (
              <><b>אין חיבור ל-Supabase בדפדפן הזה.</b> בפרודקשן המשתנים קיימים ותקינים.</>
            ) : (
              <>
                <b>הנתונים יגיעו ברגע שהבקאנד יחובר.</b> חסרים שני דברים, בסדר הזה:
                <br />
                <b>1.</b> להריץ פעם אחת את <code>supabase/migrations/001_stage4_stage5_analytics.sql</code> —
                Supabase Dashboard ← SQL Editor ← הדבקה ← Run. זה יוצר את <code>admin_stats()</code> שהדף קורא לה.
                <br />
                <b>2.</b> לחבר את הדפים לטבלאות. שלב 4 ושלב 5 עובדים היום על localStorage בלבד,
                ובתוך הסימולציות של שלב 3 אין אף קריאת אירוע — ולכן אי אפשר לדעת איפה נוטשים.
                <br />
                <span style={{ opacity: 0.65 }}>כל גרף למטה מצויר בשלד, ומראה מה בדיוק אמור להגיע לתוכו.</span>
              </>
            )}
          </Banner>
        )}

        <Banner tone="muted">
          <b>אזהרה שנשארת על המסך תמיד:</b> בנפח נמוך כל אחוז כאן הוא רעש — שני אנשים שנטשו
          נראים כמו 40%. הספים למטה מסומנים כ<b>מבוסס</b> רק כשיש להם בסיס אמיתי. השאר כתוב
          במפורש שאין לו בנצ׳מרק, כי סף מומצא גרוע מאין סף.
        </Banner>

        {/* ── כוכב הצפון ─────────────────────────────────────────────── */}
        <Card
          title="פאנל הפגישות"
          q="מתוך מי שהתקין את האפליקציה — כמה מגיעים לכל פגישה?"
          why="האפליקציה לא רושמת אף אחד. היא מביאה אותו מוכן לפגישה, והרכזת סוגרת. זה המספר החשוב ביותר במערכת, וכל השאר במעלה הזרם ממנו."
          threshold="none"
          thresholdText="אין בנצ׳מרק — המחזור הראשון קובע את הבסיס. מה שכן נדע מיד: איפה הנשירה הגדולה."
          needs="funnel_events · meeting_booked"
          live={live}
        >
          <Funnel
            steps={[
              { label: "התקינו", n: s?.candidates ?? 0 },
              { label: "השלימו שאלון", n: s?.onboarded ?? 0 },
              { label: "פגישה 1", n: s?.meetings?.m1 ?? 0 },
              { label: "פגישה 2", n: s?.meetings?.m2 ?? 0 },
              { label: "פגישה 3", n: s?.meetings?.m3 ?? 0 },
            ]}
            live={live}
          />
        </Card>

        <Card
          title="חזרה"
          q="האפליקציה חיה, או נפתחת פעם אחת ונזנחת?"
          why="לא זמן שהייה ולא עמודים לצפייה. חזרה. אפליקציה שנפתחת פעם אחת היא כישלון גם אם המסך הראשון מושלם."
          threshold="none"
          thresholdText="אין בנצ׳מרק. אבל אם פחות ממחצית חוזרים — הבעיה היא לא בתוכן, היא בסיבה לחזור."
          needs="candidates.last_active_at — מתעדכן בכל ניווט מ-17.8 (עד אז רק בהרשמה ובמעבר שלב)"
          live={live}
        >
          <Row>
            <Big label="חזרו יום אחרי" n={s?.returning ?? 0} of={s?.candidates} tone={GREEN} live={live} />
            <Big label="לא נכנסו 72 שעות" n={s?.at_risk ?? 0} tone={RED} live={live}
              note="סף מבוסס: 72 שעות ← At Risk אצל הרכזת (CLAUDE.md)" hard />
          </Row>
        </Card>

        <Card
          title="איפה כולם עומדים"
          q="יש שלב שאנשים נתקעים בו?"
          why="הצטברות בשלב אחד היא הדבר הראשון שכדאי להסתכל עליו — היא מצביעה על מסך ולא על אדם."
          threshold="none"
          thresholdText="אין סף. חריגה בולטת בשלב אחד היא הסימן, לא מספר מוחלט."
          needs="candidates.current_stage"
          live={live}
        >
          <Bars live={live} data={JOURNEY_STAGES.map(st => ({
            label: `${st.n}. ${st.short}`, n: s?.by_stage[String(st.n)] ?? 0,
          }))} />
        </Card>

        {/* ── שלב 3 ──────────────────────────────────────────────────── */}
        <Divider>שלב 3 · חשיפה</Divider>

        <Card
          title="מטריצת עניין מול מסוגלות"
          q="כמה אנשים מתעניינים בתחום אבל לא מאמינים שהם מסוגלים?"
          why="זה לא מדד פאנל — זה מדד שליחות. הרביע הכתום הוא בדיוק האדם שבשבילו הארגון קיים, ולדור ראשון להשכלה גבוהה תחושת המסוגלות נמוכה באופן שיטתי."
          threshold="hard"
          thresholdText="כל מי שברביע הכתום הוא הפניה לרכזת. הסף הוא אדם אחד, לא אחוז."
          needs="scct_scores · scct_step — מסונכרן. scct_step מראה באיזו מהשש עצרו"
          live={live}
        >
          <Quadrant grid={s?.scct_grid ?? []} live={live} />
          <div style={{ marginTop: 10 }}>
            <Big label="ברביע הכתום" n={s?.interest_gap ?? 0} tone={ORANGE} live={live} />
          </div>
        </Card>

        <Card
          title="סימולציות לפי תחום"
          q="איזה תחום מושך — ואיזה מושך ואז דוחה?"
          why="מי שפתח סימולציה ונטש באמצע אומר לך משהו על הסימולציה. מי שלא פתח בכלל אומר לך על המסגור. שתי בעיות שונות לגמרי שנראות זהות בדוח רגיל."
          threshold="none"
          thresholdText="אין סף. הפער בין נפתחו לבין הושלמו הוא הסיפור."
          needs="funnel_events · sim_step — נשלח מ-17.8 עם הצעד והמושג הנלמד, כך שאפשר לראות באיזה תרגיל נוטשים"
          live={live}
        >
          <Row>
            <Big label="נפתחו" n={s?.sims_started ?? 0} live={live} />
            <Big label="הושלמו" n={s?.sims_completed ?? 0} of={s?.sims_started} tone={GREEN} live={live} />
          </Row>
          <Bars live={live} data={(Object.keys(DOMAIN_LABEL) as Domain[]).map(d => ({
            label: DOMAIN_LABEL[d], n: s?.sims_by_domain[d] ?? 0,
          }))} />
        </Card>

        <Card
          title="באיזה צעד נוטשים — בתוך הסימולציה"
          q="איזה תרגיל מאבד אנשים?"
          why="נטישה אף פעם לא נרשמת: אין בנייד אירוע 'יצא'. היא מוסקת — הגיע לצעד N ולא ל-N+1. לכל צעד רשום גם המושג שנלמד בו, כי 'צעד 4' לא אומר לך מה לתקן ו'מהו JOIN' כן."
          threshold="none"
          thresholdText="אין סף. חפש/י את המדרגה — הצעד שאחריו המספר צונח."
          needs="funnel_events · sim_step"
          live={!!f}
        >
          {!f || Object.keys(f.simSteps).length === 0 ? (
            <Empty>עוד לא נרשמו צעדים. הנתון מתחיל להיאסף ממי שייכנס לסימולציה מ-17.8.</Empty>
          ) : (
            Object.entries(f.simSteps).map(([d, steps]) => (
              <div key={d} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
                  {DOMAIN_LABEL[d as Domain] ?? d}
                </div>
                <Funnel live steps={steps.map(st => ({ label: `${st.i}. ${st.concept || "צעד"}`, n: st.n }))} />
              </div>
            ))
          )}
        </Card>

        <Card
          title="באיזו שאלה עוצרים — כלי עיבוד החוויה"
          q="איזו מהשש קשה לענות עליה?"
          why="ההשערה שכדאי לבדוק ראשונה: שאלות המסוגלות. לשאול מישהו 'כמה את מאמינה שאת מסוגלת' זו שאלה קשה לדור ראשון, ואם שם נעצרים — זה ממצא על הקהל, לא על הכלי."
          threshold="none"
          thresholdText="אין סף. הירידה בין שאלה לשאלה היא הסיפור."
          needs="funnel_events · scct_step"
          live={!!f}
        >
          {!f || Object.keys(f.scctSteps).length === 0 ? (
            <Empty>עוד לא נרשמו תשובות. עד 17.8 נשמר רק הסיום, אז מי שעצר באמצע לא היה קיים.</Empty>
          ) : (
            <Funnel
              live
              steps={SCCT_ORDER.map(q => ({
                label: SCCT_Q[q],
                n: Object.entries(f.scctSteps)
                  .filter(([k]) => k.endsWith(`|${q}`))
                  .reduce((a, [, n]) => a + n, 0),
              }))}
            />
          )}
        </Card>

        <Card
          title="משפך תיאום הפגישה"
          q="כמה מהמגיעים ליומן באמת קובעים?"
          why="עד 17.8 נרשמה רק ההצלחה, ולכן מי שהגיע ליומן ויצא פשוט לא היה קיים. 'היומן נפל' מופרד בכוונה: בחיבור איטי המסך נראה שבור, המועמד לא ידווח על זה לאף אחד, והוא נספר כמי שלא רצה."
          threshold="none"
          thresholdText="אין סף מבוסס. כל נפילה שאיננה אפס דורשת בדיקה — זה כשל טכני, לא היסוס."
          needs="funnel_events · meeting_open · meeting_calendar_ready · meeting_booked"
          live={!!f}
        >
          {!f ? <Empty>ממתין לנתונים.</Empty> : (
            <>
              <Funnel live steps={[
                { label: "הגיעו למסך", n: f.meeting.open },
                { label: "היומן נטען", n: f.meeting.ready },
                { label: "קבעו פגישה", n: f.meeting.booked },
              ]} />
              {f.meeting.failed > 0 && (
                <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "#b91c1c" }}>
                  ⚠ אצל {f.meeting.failed} אנשים היומן לא נטען בכלל — כשל טכני, לא היסוס.
                </div>
              )}
            </>
          )}
        </Card>

        {/* ── שלב 4 ──────────────────────────────────────────────────── */}
        <Divider>שלב 4 · מסלול לימודים</Divider>

        <Card
          title="התפלגות ההמלצות"
          q="מנוע ההמלצה מתנהג כמו שתכננו, על הקהל האמיתי?"
          why="הקו האפור הוא מה שהסימולציה על כל 729 הצירופים חזתה. פער גדול אומר שהשקלול לא מייצג את הקהל שבא בפועל — ואם התואר יוצא נמוך, זה נוגד את העמדה שלנו במפורש."
          threshold="hard"
          thresholdText="מבוסס: תואר 52% · מה״ט 10% · הכשרה 38%. סטייה מעל 10 נקודות אחוז דורשת בדיקת השקלול."
          needs="paths_answers — מסונכרן מאז המיגרציה"
          live={live}
        >
          <Bars
            live={live}
            data={["degree", "mahat", "bootcamp"].map(t => ({
              label: TRACK_LABEL[t], n: s?.recommendations[t] ?? 0, ref: EXPECTED_MIX[t],
            }))}
            asPercent
          />
        </Card>

        <Card
          title="החסמים של הקהל"
          q="מה באמת עוצר אנשים?"
          why="הנתון היקר ביותר באפליקציה. הוא אומר לרכזות מה החסם האמיתי ולא המשוער, ואין שום דרך אחרת להשיג אותו — לא בשאלון ולא בשיחה."
          threshold="none"
          thresholdText="אין סף — הדירוג עצמו הוא התוצר. שלושת הראשונים הם מה שצריך לפתור. המדד הוא שכיחות: אילו חסמים יש לקהל, לא כמה לחצו."
          needs="funnel_events · paths_blocker_open — נרשם חסם לכל אחד שהוצג, כי מסך החסמים מציג את כולם פתוחים ואין בו פתיחה למדוד"
          live={live}
        >
          <Bars live={live} skeletonRows={5} data={Object.entries(s?.blockers_opened ?? {})
            .sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n }))} />
        </Card>

        <Card
          title="אילו מענים באמת נפתחו"
          q="המענים שכתבנו לחסמים — מישהו טורח לפתוח אותם?"
          why="החסמים אומרים מה עוצר אנשים. זה אומר אם התשובות שלנו רלוונטיות. מענה שאף אחד לא פותח הוא או לא מעניין או לא ברור — ובשני המקרים צריך לכתוב אותו מחדש."
          threshold="none"
          thresholdText="אין סף. מענה עם אפס פתיחות לאורך זמן הוא מועמד לשכתוב."
          needs="funnel_events · paths_solution_click"
          live={!!f}
        >
          {!f || Object.keys(f.solutions).length === 0 ? (
            <Empty>עוד לא נפתח אף מענה. נמדד מ-17.8.</Empty>
          ) : (
            <Bars live skeletonRows={5} data={Object.entries(f.solutions)
              .sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n }))} />
          )}
        </Card>

        <Card
          title="נטישה בשאלון, לפי שאלה"
          q="איזו שאלה מאבדת אנשים?"
          why="שש שאלות, וכל אחת יכולה להיות זו שמפילה. ההשערה שכדאי לבדוק ראשונה: שאלת הכסף. אם זה נכון — צריך לנסח אותה מחדש, וזו תובנה ששווה יותר מכל השאר בדף הזה."
          threshold="none"
          thresholdText="אין סף מוחלט. נפילה חדה בין שאלה לשאלה היא הסימן."
          needs="funnel_events · paths_question (האירוע קיים בקוד, חסר רק היעד)"
          live={live}
        >
          <Bars live={live} data={QUIZ_LABELS.map((label, i) => ({
            label: `${i + 1}. ${label}`, n: s?.quiz_reach[String(i + 1)] ?? 0,
          }))} />
        </Card>

        {/* ── שלב 5 ──────────────────────────────────────────────────── */}
        <Divider>שלב 5 · לוגיסטיקה ומלגות</Divider>

        <Card
          title="דדליינים שהוחמצו"
          q="מישהו פספס מלגה בגלל שלא הצליח להתחיל?"
          why="זה אות הפחד, נמדד בהתנהגות ובלי שאלה אחת. משימה שעברה את התאריך ונשארה פתוחה היא לא עצלות — היא משהו שנתקע, ולמלגה יש תאריך שלא חוזר."
          threshold="hard"
          thresholdText="מבוסס: הסף הוא אפס. כל דדליין שעבר עם משימה פתוחה הוא כסף שלא הגיע. ושלוש פתיחות בלי סגירה ← משימה דחופה לרכזת (CLAUDE.md)."
          needs="plan_tasks — מסונכרן. open_count נספר מ-17.8"
          live={live}
        >
          <Row>
            <Big label="עברו את התאריך ופתוחות" n={s?.plan_overdue ?? 0} tone={RED} live={live} hard
              note="סף מבוסס: אפס" />
            <Big label="נפתחו 3 פעמים בלי סגירה" n={s?.stuck_3x ?? 0} tone={RED} live={live} hard
              note="סף מבוסס: 3 ← התראה לרכזת" />
            <Big label="נסגרו" n={s?.plan_done ?? 0} tone={GREEN} live={live} />
          </Row>
        </Card>

        {/* ── תפעול ──────────────────────────────────────────────────── */}
        <Divider>תפעול</Divider>

        <Card
          title="שעות שימוש"
          q="מתי רכזות צריכות להיות זמינות?"
          why="הקהל שלנו עובד. אם השימוש מתרכז ב-22:00, זו החלטה תפעולית שנגזרת ישירות מנתון — ולא ניחוש על סמך שעות המשרד שלנו."
          threshold="none"
          thresholdText="אין סף — ההתפלגות עצמה היא התשובה."
          needs="funnel_events · created_at"
          live={live}
        >
          <Hours data={s?.by_hour ?? {}} live={live} />
        </Card>

        <Card
          title="אירועים בשבוע האחרון"
          q="מה בכלל נמדד?"
          why="הרשימה הזו היא גם בקרת שפיות על המדידה עצמה: אירוע שאמור להיות כאן ואינו — סימן שהחיבור נשבר."
          threshold="none"
          thresholdText="אין סף. היעדר אירוע שציפינו לו הוא הממצא."
          needs="funnel_events"
          live={live}
        >
          <Bars live={live} skeletonRows={4} data={Object.entries(s?.events_7d ?? {})
            .sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n }))} />
        </Card>
      </div>
    </div>
  );
}

// ─── כרטיס ────────────────────────────────────────────────────────────────────

function Card({
  title, q, why, threshold, thresholdText, needs, live, children,
}: {
  title: string; q: string; why: string;
  threshold: "hard" | "none"; thresholdText: string;
  needs: string; live: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)", padding: 18, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 17, ...HEEBO, color: NAVY }}>{title}</div>
        {!live && (
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)" }}>
            ממתין לנתונים
          </span>
        )}
      </div>

      {/* השאלה קודמת לגרף בכוונה */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1a16", marginTop: 8, lineHeight: 1.5 }}>{q}</div>
      <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.5)", marginTop: 4, lineHeight: 1.65 }}>{why}</div>

      <div style={{ margin: "14px 0 4px" }}>{children}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
        <div style={{
          fontSize: 12, lineHeight: 1.6, padding: "8px 11px", borderRadius: 9,
          background: threshold === "hard" ? "rgba(5,150,105,0.07)" : "rgba(0,0,0,0.035)",
          color: threshold === "hard" ? "#08694c" : "rgba(0,0,0,0.5)",
        }}>
          <b>{threshold === "hard" ? "סף מבוסס · " : "אין בנצ׳מרק · "}</b>
          {thresholdText}
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(0,0,0,0.38)", lineHeight: 1.6 }}>
          מקור: <code>{needs}</code>
        </div>
      </div>
    </div>
  );
}

/** אין נתונים — ומסבירים למה, כדי שאפס לא ייקרא כממצא */
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.42)", lineHeight: 1.7, padding: "6px 0" }}>
      {children}
    </div>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 10px" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(0,0,0,0.4)", letterSpacing: "0.04em" }}>{children}</div>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
    </div>
  );
}

function Banner({ tone, children }: { tone: "warn" | "danger" | "muted"; children: React.ReactNode }) {
  const st = tone === "warn"
    ? { bg: "#fff7ec", bd: "#f5dcb8", fg: "#8a4d00" }
    : tone === "danger"
      ? { bg: "rgba(220,38,38,0.06)", bd: "rgba(220,38,38,0.2)", fg: "#b91c1c" }
      : { bg: "#f6f3ec", bd: "rgba(0,0,0,0.07)", fg: "rgba(0,0,0,0.55)" };
  return (
    <div style={{ background: st.bg, border: `1px solid ${st.bd}`, color: st.fg, borderRadius: 12, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.75, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
      {children}
    </div>
  );
}

function Big({ label, n, of, tone, live, note, hard }: {
  label: string; n: number; of?: number; tone?: string; live: boolean; note?: string; hard?: boolean;
}) {
  const pct = of && of > 0 ? Math.round((n / of) * 100) : null;
  return (
    <div style={{ padding: "13px 14px", borderRadius: 12, background: "#fcfbf9", border: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, color: live ? (tone ?? "#1c1a16") : "rgba(0,0,0,0.16)" }}>
        {live ? n : "—"}
        {live && pct !== null && <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.35)" }}> · {pct}%</span>}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(0,0,0,0.6)", marginTop: 3, lineHeight: 1.4 }}>{label}</div>
      {note && (
        <div style={{ fontSize: 11, color: hard ? "#08694c" : "rgba(0,0,0,0.4)", marginTop: 4, lineHeight: 1.5 }}>{note}</div>
      )}
    </div>
  );
}

/** פאנל יורד. ברוחב יחסי לשלב הראשון, כדי שהנשירה תיראה ולא רק תיקרא */
function Funnel({ steps, live }: { steps: { label: string; n: number }[]; live: boolean }) {
  const top = Math.max(1, steps[0]?.n ?? 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map((st, i) => {
        const w = live ? Math.max(4, (st.n / top) * 100) : 100 - i * 18;
        const drop = i > 0 && live && steps[i - 1].n > 0
          ? Math.round((1 - st.n / steps[i - 1].n) * 100) : null;
        return (
          <div key={st.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 96, fontSize: 12.5, fontWeight: 700, color: "rgba(0,0,0,0.6)", flexShrink: 0 }}>{st.label}</div>
            <div style={{ flex: 1, height: 26, background: "rgba(0,0,0,0.035)", borderRadius: 7, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${w}%`, borderRadius: 7,
                background: live ? NAVY : MUTED,
                opacity: live ? 1 - i * 0.12 : 1,
                transition: "width .5s",
              }} />
            </div>
            <div style={{ width: 30, fontSize: 13, fontWeight: 800, textAlign: "left", color: live ? "#1c1a16" : "rgba(0,0,0,0.16)" }}>
              {live ? st.n : "—"}
            </div>
            <div style={{ width: 44, fontSize: 11, fontWeight: 700, textAlign: "left", color: drop && drop > 0 ? RED : "transparent" }}>
              {drop && drop > 0 ? `−${drop}%` : "·"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** עמודות. `ref` מצייר קו ייחוס אפור — הצפי מול המצוי */
function Bars({ data, live, asPercent, skeletonRows = 0 }: {
  data: { label: string; n: number; ref?: number }[];
  live: boolean; asPercent?: boolean; skeletonRows?: number;
}) {
  const rows = data.length > 0 ? data
    : Array.from({ length: skeletonRows || 3 }, (_, i) => ({ label: "—", n: 0, ref: undefined as number | undefined }));
  const total = rows.reduce((a, b) => a + b.n, 0);
  const max = asPercent ? 100 : Math.max(1, ...rows.map(r => r.n));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {rows.map((d, i) => {
        const val = asPercent && total > 0 ? Math.round((d.n / total) * 100) : d.n;
        const w = live ? (val / max) * 100 : 0;
        return (
          <div key={d.label + i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 110, fontSize: 12.5, fontWeight: 700, color: "rgba(0,0,0,0.6)", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {d.label}
            </div>
            <div style={{ flex: 1, height: 20, borderRadius: 6, background: "rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${w}%`, background: ORANGE, borderRadius: 6, transition: "width .4s" }} />
              {d.ref !== undefined && (
                <>
                  <div style={{ position: "absolute", top: 0, bottom: 0, right: `${(d.ref / max) * 100}%`, width: 2, background: "rgba(0,0,0,0.35)" }} />
                  <div style={{ position: "absolute", top: 3, right: `calc(${(d.ref / max) * 100}% + 5px)`, fontSize: 9.5, fontWeight: 700, color: "rgba(0,0,0,0.45)", whiteSpace: "nowrap" }}>
                    צפי {d.ref}%
                  </div>
                </>
              )}
            </div>
            <div style={{ width: 40, textAlign: "left", fontSize: 13, fontWeight: 800, color: live ? "#1c1a16" : "rgba(0,0,0,0.16)" }}>
              {live ? (asPercent ? `${val}%` : val) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * מטריצת SCCT 5×5. ציר אופקי = עניין, ציר אנכי = מסוגלות.
 * הרביע הכתום — עניין 4–5 ומסוגלות 1–2 — הוא הקהל שבשבילו הארגון קיים,
 * ולכן הוא מודגש גם כשהוא ריק.
 */
function Quadrant({ grid, live }: { grid: { i: number; e: number; n: number }[]; live: boolean }) {
  const at = (i: number, e: number) => grid.find(g => g.i === i && g.e === e)?.n ?? 0;
  const max = Math.max(1, ...grid.map(g => g.n));

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 10, color: "rgba(0,0,0,0.4)", fontWeight: 700, paddingBlock: 2 }}>
        <span>מסוגלות 5</span>
        <span>1</span>
      </div>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 42px)", gridTemplateRows: "repeat(5, 34px)", gap: 3 }}>
          {[5, 4, 3, 2, 1].map(e =>
            [1, 2, 3, 4, 5].map(i => {
              const n = at(i, e);
              const target = i >= 4 && e <= 2;
              return (
                <div key={`${i}-${e}`} style={{
                  borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                  background: live && n > 0
                    ? (target ? `rgba(251,133,0,${0.25 + 0.6 * (n / max)})` : `rgba(2,62,138,${0.12 + 0.5 * (n / max)})`)
                    : target ? "rgba(251,133,0,0.09)" : "rgba(0,0,0,0.035)",
                  border: target ? "1.5px dashed rgba(251,133,0,0.55)" : "1px solid transparent",
                  color: n > 0 ? "#fff" : "rgba(0,0,0,0.2)",
                }}>
                  {live && n > 0 ? n : ""}
                </div>
              );
            })
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(0,0,0,0.4)", fontWeight: 700, marginTop: 4 }}>
          <span>עניין 1</span>
          <span>5</span>
        </div>
        <div style={{ fontSize: 11.5, color: "#8a4d00", marginTop: 8, lineHeight: 1.6, maxWidth: 330 }}>
          הרביע המקווקו — <b>עניין גבוה, מסוגלות נמוכה</b>. כל אדם שנופל שם הוא הפניה לרכזת.
        </div>
      </div>
    </div>
  );
}

/** היסטוגרמה של 24 שעות. שעות הערב מודגשות — שם הקהל שלנו פנוי */
function Hours({ data, live }: { data: Record<string, number>; live: boolean }) {
  const vals = Array.from({ length: 24 }, (_, h) => data[String(h)] ?? 0);
  const max = Math.max(1, ...vals);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 90 }}>
        {vals.map((n, h) => {
          const evening = h >= 19 || h < 2;
          return (
            <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
              <div style={{
                height: live ? `${Math.max(2, (n / max) * 100)}%` : "6%",
                background: live ? (evening ? ORANGE : NAVY) : MUTED,
                borderRadius: "3px 3px 0 0",
                opacity: live ? 0.85 : 1,
                transition: "height .4s",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(0,0,0,0.4)", fontWeight: 700, marginTop: 5 }}>
        <span>00:00</span><span>08:00</span><span>16:00</span><span>23:00</span>
      </div>
      <div style={{ fontSize: 11.5, color: "rgba(0,0,0,0.45)", marginTop: 8, lineHeight: 1.6 }}>
        הכתום הוא 19:00–02:00. אם רוב השימוש שם — <b>שעות הזמינות של הרכזות לא מתאימות לקהל.</b>
      </div>
    </div>
  );
}

/** הלוח עטוף בשער הניהול — קוד אחד לכל הלוחות, נבדק מול השרת */
export default function GatedPage() {
  return <AdminGate><AdminAnalyticsPage /></AdminGate>;
}
