"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cal, { getCalApi } from "@calcom/embed-react";
import BottomNav from "@/components/ui/BottomNav";
import Link from "next/link";
import { calLinkFor, currentMeeting, MEETING_META, genderMeetingWhat, type MeetingNum } from "@/data/meetings";
import { logEvent, myCoordinator } from "@/lib/candidate";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

/**
 * מחלץ את מועד תחילת הפגישה מהמטען של Cal.com.
 * המבנה לא יציב בין גרסאות, ולכן סורקים כמה שמות מקובלים ומחזירים null
 * אם אף אחד לא נמצא — עדיף בלי מועד מאשר עם מועד שגוי.
 */
function extractStart(e: unknown): string | null {
  const seen = new Set<unknown>();
  const KEYS = ["startTime", "start", "date", "when", "bookingStartTime"];

  const walk = (v: unknown, depth: number): string | null => {
    if (!v || typeof v !== "object" || depth > 5 || seen.has(v)) return null;
    seen.add(v);
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (KEYS.includes(k) && typeof val === "string") {
        const d = new Date(val);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
      const nested = walk(val, depth + 1);
      if (nested) return nested;
    }
    return null;
  };

  return walk(e, 0);
}

export default function ContactPage() {
  const router = useRouter();
  /** null עד שיודעים — כדי לא לטעון את היומן של הפגישה הלא נכונה ואז להחליף */
  const [meeting, setMeeting] = useState<MeetingNum | null>(null);
  /**
   * היומן של הרכזת המשויכת (מהסגל ב-DB). null = עוד בודקים, "" = אין לה
   * קישור משלה — נופלים לברירת המחדל מ-meetings.ts. הרינדור מחכה לבדיקה
   * כדי לא לטעון יומן של רכזת אחת ואז להחליף לשנייה מול העיניים.
   */
  const [assignedCal, setAssignedCal] = useState<string | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("m");
    const n = param && ["1", "2", "3"].includes(param)
      ? (Number(param) as MeetingNum)
      : currentMeeting(localStorage);
    setMeeting(n);
    myCoordinator()
      .then(c => {
        setAssignedCal(c?.calLinks[n] ?? "");
        if (c?.phone) setCoord({ name: c.name, phone: c.phone });
      })
      .catch(() => setAssignedCal(""));
  }, []);

  useEffect(() => {
    if (!meeting) return;
    (async () => {
      /*
       * מדידת מסך התיאום — עד היום נרשמה רק ההצלחה.
       *
       * מי שהגיע ליומן, הסתכל ויצא פשוט לא היה קיים בנתונים, ולכן לא הייתה
       * שום דרך לדעת אם מסך הפגישה מפיל אנשים. היומן עצמו הוא חלון מוטמע
       * ואנחנו לא רואים לתוכו — אבל ההפרש בין "הגיע" ל"קבע" הוא בדיוק
       * המספר החשוב, ו-linkReady מפריד בין "לא רצה" ל"היומן לא נטען אצלו",
       * שקורה בחיבור איטי ונראה למועמד כמו מסך שבור.
       */
      logEvent("meeting_open", { n: String(meeting) });

      // המקור המדויק למועד, אם Cal שלח אותו. משמש כברירה ראשונה על פני החיטוט
      let startFromV2: string | null = null;

      const cal = await getCalApi({ namespace: "contact" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view", theme: "light" });
      cal("on", {
        action: "linkReady",
        callback: () => logEvent("meeting_calendar_ready", { n: String(meeting) }),
      });
      /*
       * היומן לא נטען — כישלון שנראה למועמד כמו מסך ריק ושבור, והוא לעולם
       * לא ידווח עליו. בלי האירוע הזה הוא נספר כמי ש"לא רצה לקבוע".
       */
      cal("on", {
        action: "linkFailed",
        callback: (e: unknown) => {
          const d = (e as { detail?: { data?: { code?: string; msg?: string } } })?.detail?.data;
          logEvent("meeting_calendar_failed", { n: String(meeting), code: d?.code ?? "", msg: d?.msg ?? "" });
        },
      });
      /*
       * מועד הפגישה מהמקור המתועד. הגרסה הישנה (bookingSuccessful) עוטפת
       * את המטען במבנה שמשתנה בין גרסאות, ולכן extractStart מחטט בו — כאן
       * startTime הוא שדה מוצהר. לא רושם meeting_booked כדי לא לספור פעמיים;
       * רק משפר את התאריך, שממנו נגזר "איך היה?" אחרי הפגישה.
       */
      cal("on", {
        action: "bookingSuccessfulV2",
        callback: (e: unknown) => {
          const start = (e as { detail?: { data?: { startTime?: string } } })?.detail?.data?.startTime;
          if (start) startFromV2 = start;
        },
      });
      cal("on", {
        action: "bookingSuccessful",
        callback: (e: unknown) => {
          localStorage.setItem("meeting-booked", "true");
          localStorage.setItem(`meeting-${meeting}-booked`, "true");
          localStorage.setItem(`meeting-${meeting}-booked-at`, new Date().toISOString());
          // כוכב הצפון: פאנל הפגישות באנליטיקות נבנה מהאירוע הזה
          logEvent("meeting_booked", { n: String(meeting) });

          /*
           * שומרים את **מועד הפגישה** ולא רק את העובדה שנקבעה.
           *
           * זה מה שמאפשר לאפליקציה לדעת לבד שהפגישה עברה, בלי שאף אחד יסמן:
           * לא המועמד (שאלה מוזרה, וגם אפשר לשקר בה) ולא הרכזת (אין לה איפה).
           *
           * המבנה של המטען משתנה בין גרסאות של Cal.com, ולכן מנסים כמה
           * מקומות ולא מניחים אף אחד. אם לא נמצא מועד — לא ממציאים אחד;
           * מרחב ההמתנה יציע במקום זה קישור יזום ("הפגישה כבר הייתה?").
           */
          const at = startFromV2 ?? extractStart(e);
          if (at) localStorage.setItem(`meeting-${meeting}-at`, at);

          // פגישה 1 נוחתת ישירות במרחב ההמתנה: הציר שם כבר מציג את האישור
          // ואת "מה יקרה בפגישה", ומסך אישור נפרד היה מסך כפול.
          // לפגישות 2 ו-3 אין מרחב המתנה, ולכן שם מסך האישור נשאר.
          router.push(meeting === 1 ? "/waiting" : `/contact/booked?m=${meeting}`);
        },
      });
    })();
  }, [router, meeting]);

  /**
   * "כבר קבעתי" — מעבר בלי לתפוס תור ביומן.
   *
   * נועד בעיקר להדגמת האפליקציה, אבל יש לו גם שימוש אמיתי: לפי המודל
   * הרכזת יכולה לקבוע את הפגישה בעצמה בטלפון, ואז אין לאדם מה לקבוע כאן.
   *
   * **לא רושם meeting_booked בכוונה.** זה המדד שכל המערכת נמדדת בו, וכפתור
   * שנלחץ בכל הדגמה היה מנפח אותו. האירוע הנפרד גם אומר לרכזת משהו נכון:
   * הוא הצהיר שקבע, ואין לזה אישור ביומן.
   *
   * מועד הפגישה לא נשמר — אנחנו לא יודעים אותו, ולא ממציאים. מרחב ההמתנה
   * כבר יודע לטפל במצב הזה ומציע במקום זה "הפגישה כבר הייתה?".
   */
  function selfDeclare() {
    if (!meeting) return;
    localStorage.setItem("meeting-booked", "true");
    localStorage.setItem(`meeting-${meeting}-booked`, "true");
    localStorage.setItem(`meeting-${meeting}-booked-at`, new Date().toISOString());
    logEvent("meeting_self_declared", { n: String(meeting) });
    router.push(meeting === 1 ? "/waiting" : `/contact/booked?m=${meeting}`);
  }

  const meta = meeting ? MEETING_META[meeting] : null;

  /*
   * welcome=1 — הגעה ישירה מסוף האונבורדינג. המשפט האישי הוא כל המעבר:
   * בלי מסך ביניים, בלי מפה — רק מי אתה ומה הצעד. השם מ-localStorage.
   */
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  /** הרכזת המשויכת מהסגל — כפתור הוואטסאפ מופיע רק כשיש לה טלפון */
  const [coord, setCoord] = useState<{ name: string; phone: string } | null>(null);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("welcome") === "1") {
        setWelcomeName(localStorage.getItem("user-name") || "");
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[30px] shrink-0">
        <div className="max-w-[900px] mx-auto">
          <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>
            ← חזרה למסע
          </Link>
          <div className="text-[12px] font-bold mb-1.5" style={{ color: "#fb8500" }}>
            {meeting ? `פגישה ${meeting} מתוך 3` : ""}
          </div>
          <div className="text-[30px] md:text-[36px] leading-tight" style={HEEBO}>
            {meta?.title ?? "שיחה עם הרכזת"}
          </div>
          <div className="text-[13.5px] mt-[6px]" style={{ opacity: 0.72 }}>
            {meta?.sub ?? "בחר/י תאריך ושעה — תוך שניות תקבל/י אישור ביומן"}
          </div>
        </div>
      </div>

      {welcomeName !== null && (
        <div className="max-w-[900px] mx-auto w-full px-[22px] md:px-12 pt-5">
          <div
            className="rounded-xl px-4 py-3.5 text-[13px] leading-[1.75]"
            style={{ background: "rgba(251,133,0,0.08)", border: "1px solid rgba(251,133,0,0.2)", color: "rgba(0,0,0,0.65)" }}
          >
            <span className="font-black" style={{ color: "#92400e" }}>
              {welcomeName ? `נעים להכיר, ${welcomeName} 👋` : "נעים להכיר 👋"}
            </span>{" "}
            סיימת את הצעד הראשון. עכשיו הדבר היחיד שנשאר כדי לצאת לדרך —
            לבחור מועד לפגישת ההיכרות עם הרכזת.
          </div>
        </div>
      )}

      {/* וואטסאפ לרכזת (נתי 25.8) — שאלה מהירה לא צריכה לחכות לפגישה.
          מופיע רק כשיש טלפון בסגל; ההודעה הפותחת מוכנה כדי להוריד את
          מחסום "מה כותבים" */}
      {coord && (
        <div className="max-w-[900px] mx-auto w-full px-[22px] md:px-12 pt-5">
          <a
            href={`https://wa.me/${coord.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`היי ${coord.name.split(" ")[0]}, זו שאלה מהאפליקציה 🙂 `)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => logEvent("wa_click", {})}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{ background: "#e7f6f0", border: "1.5px solid rgba(37,211,102,0.45)", textDecoration: "none" }}
          >
            <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="16" fill="#25D366" />
              <path fill="#fff" d="M23.1 8.9A9.9 9.9 0 0 0 6.5 20.6L5.1 26l5.5-1.4a9.9 9.9 0 0 0 12.5-15.7zm-7.1 15a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.8zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.5 3.9 1.7.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3z" />
            </svg>
            <div>
              <div className="text-[14px] font-black" style={{ color: "#04543a" }}>
                שאלה מהירה? {coord.name.split(" ")[0]} בוואטסאפ
              </div>
              <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.5)" }}>
                לא צריך לחכות לפגישה — אפשר פשוט לכתוב
              </div>
            </div>
            <span className="mr-auto text-[16px]" style={{ color: "#25D366" }}>←</span>
          </a>
        </div>
      )}

      {/* מה קורה בפגישה, ומה להביא אליה */}
      {meta && (
        <div className="max-w-[900px] mx-auto w-full px-[22px] md:px-12 pt-5 pb-3">
          <div
            className="rounded-xl px-4 py-3.5 text-[12.5px] leading-[1.7]"
            style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.55)" }}
          >
            <span className="font-bold" style={{ color: "rgba(0,0,0,0.7)" }}>{genderMeetingWhat(meeting!, typeof window !== "undefined" ? localStorage.getItem("user-gender") : null)}</span>
            <br />
            {meta.bring}
          </div>
        </div>
      )}

      {/* Cal.com embed */}
      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-12 pb-24">
        {meeting && assignedCal !== null && (
          <Cal
            namespace="contact"
            calLink={assignedCal || calLinkFor(meeting)}
            style={{ width: "100%", minHeight: "600px", borderRadius: "16px", overflow: "hidden" }}
            config={{ layout: "month_view", theme: "light" }}
          />
        )}

        {/* מעבר בלי לקבוע. מושתק בכוונה — היומן למעלה הוא הפעולה הראשית */}
        {meeting && (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <button
              onClick={selfDeclare}
              className="w-full py-3 rounded-xl text-[14px] font-bold"
              style={{ background: "rgba(2,62,138,0.06)", color: "#023e8a" }}
            >
              כבר קבעתי פגישה — להמשיך ←
            </button>
            <div className="text-[11.5px] leading-[1.7] mt-2 text-center" style={{ color: "rgba(0,0,0,0.4)" }}>
              לא נשריין לך תור ביומן. אם עוד לא קבעת — בחר/י תאריך למעלה.
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
