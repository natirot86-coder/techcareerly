"use client";

/**
 * שאלון הכניסה של בוגרי טק-קריירה — הווריאציה היחידה של שלב 4 (31.8).
 *
 * ─── למה קובץ נפרד, ולמה רק זה ────────────────────────────────────────────
 *
 * שלב 4 של הקהל הרחב שואל שמונה שאלות ומריץ אותן במנוע משקלים שמכויל
 * ל-52/10/38 בין תואר, מה״ט והכשרה. לבוגרים **אין מה לשקלל** — יש מסלול אחד.
 * ולכן זו זרימה משלהם, בקובץ משלה, ו-`WEIGHTS` לא נוגעים בו בכלל.
 *
 * ⚠️ **אבל היא כותבת את אותו חוזה.** `paths-quiz` נשמר עם אותם מפתחות ואותם
 * ערכי A/B/C, כי שלב 5 גוזר מ-`quiz.time` את שעות הפנאי לחשבון המלגות
 * (`plan/page.tsx`) ובונה מ-`quiz` את כל רשימת המשימות (`buildPlan`). שאלון
 * עם ערכים אחרים היה שובר את שניהם **בשקט**. זה הכלל שמונע התנגשות, והוא
 * הסיבה שאפשר להריץ שתי זרימות באותה אפליקציה.
 *
 * מה שקורה אחרי: הבוגר עובר ישר למסך המוסדות והתארים הקיים. מסך ההשוואה
 * בין שלושה מסלולים מדולג — השוואה של מסלול אחד איננה השוואה.
 */

import { useState } from "react";
import { DOMAIN_LABEL, type Domain } from "@/data/institutions";
import { HAVE_CHIPS } from "@/data/degrees";
import { logEvent, savePathsAnswers } from "@/lib/candidate";
import { track as trackEvent } from "@vercel/analytics";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 } as const;

type Opt = { id: string; label: string; sub?: string };
type Q = { key: string; title: string; note?: string; opts: Opt[] };

/*
  שש שאלות, כולן במכה אחת של הקשה. הניסוח נבדק מול המערך של סיוון:
  "מה מסתדר לך" ולא "מה מכריח אותך" — לבוגר שמרוויח היום בהייטק העבודה
  היא ההישג ולא הכלוב, ולמסגר אותה כמגבלה מזמין "אז אני מוגבל".
*/
const QUESTIONS: Q[] = [
  {
    key: "work",
    title: "איפה את/ה היום מבחינת עבודה?",
    opts: [
      { id: "tech", label: "עובד/ת בהייטק" },
      { id: "seeking", label: "מחפש/ת עבודה בהייטק" },
      { id: "other", label: "עובד/ת, אבל לא בתחום" },
    ],
  },
  {
    key: "avail",
    title: "כמה מהשבוע אפשר לפנות ללימודים?",
    note: "זה מה שקובע אילו מסלולים נציג — לא כמה מוכשר/ת את/ה",
    opts: [
      { id: "full", label: "יום שלם, רוב השבוע", sub: "פנוי/ה ללמוד" },
      { id: "days", label: "יומיים-שלושה בשבוע", sub: "לצד עבודה" },
      { id: "evening", label: "ערב בלבד, או קצב עצמאי משלי" },
      /*
        האפשרות הרביעית איננה היסוס אלא מצב אמיתי — והיא הקהל שהפיילוט נועד
        לו. בלעדיה הוא בוחר "ערב" מתוך זהירות, ומסתירים ממנו בדיוק את
        המסלולים שנועדו לו.
      */
      { id: "open", label: "שוקל/ת לשנות את מצב העבודה", sub: "בשביל המסלול הנכון" },
    ],
  },
  {
    key: "money",
    title: "מה אפשרי מבחינה כלכלית?",
    note: "כמעט תמיד יש מלגות. השאלה היא רק מאיפה מתחילים",
    opts: [
      { id: "need", label: "אני צריך/ה מלגה — אחרת זה לא ריאלי" },
      { id: "some", label: "אפשר להשתתף חלקית" },
      { id: "ok", label: "הכסף הוא לא המגבלה העיקרית" },
    ],
  },
  {
    /*
      ⚠️ **אותה רשימה בדיוק כמו בקהל הרחב** (`HAVE_CHIPS` ב-degrees.ts).
      בגרסה הראשונה קיצרתי אותה לחמש אפשרויות — וזו הייתה טעות: הצ׳יפים
      האלה מזינים את חישוב תנאי הכניסה ואת מסך החסמים, ורשימה מקוצרת
      הייתה גורמת לשתי הזרימות לחשב אחרת על אותו אדם. בוגר עם מתמטיקה
      3 יחידות היה נופל ל"אף אחד מאלה" ומקבל תמונת חסמים שגויה.
    */
    key: "edu",
    title: "מה יש לך ביד?",
    note: "אפשר לסמן כמה. אין תשובה שפוסלת — לכל מצב יש מסלול",
    opts: [...HAVE_CHIPS, { id: "none", label: "אף אחד מאלה" }],
  },
  {
    key: "where",
    title: "איפה נוח ללמוד?",
    opts: [
      { id: "center", label: "מרכז" },
      { id: "far", label: "צפון, דרום או פריפריה" },
      { id: "flex", label: "גמיש — אפשר לנסוע או ללמוד מרחוק" },
    ],
  },
  {
    /*
      תחום — **מסננת ולא שער.** נתי (28.8): הבוגרים כבר מכירים את העולם,
      ולשער כאן אין את ההצדקה שיש לו בקהל הרחב. "להראות הכל" היא אפשרות
      מלאה ולא פשרה, ואפשר לשנות בכל רגע במסך עצמו.
    */
    key: "domain",
    title: "איזה תחום הכי מעניין אותך?",
    note: "רק כדי לסדר את הרשימה. אפשר לשנות בכל רגע, וגם לראות הכל",
    opts: [
      ...(["code", "data", "cyber", "qa", "networks", "ai"] as Domain[]).map(d => ({
        id: d, label: DOMAIN_LABEL[d],
      })),
      { id: "all", label: "להראות לי הכל", sub: "עוד לא סגרתי על תחום" },
    ],
  },
];

/** מיפוי לחוזה של `paths-quiz` — הערכים חייבים להישאר A/B/C */
function toContract(a: Record<string, string>, chips: string[]) {
  /* שעות: ערב וקצב עצמאי אינם "מעט שעות" אלא **פריסה אחרת** — שניהם B */
  const time = a.avail === "full" || a.avail === "open" ? "C" : "B";
  const budget = a.money === "need" ? "A" : a.money === "some" ? "B" : "C";
  const location = a.where === "center" ? "A" : a.where === "far" ? "B" : "C";
  /* אותה גזירה בדיוק כמו בקהל הרחב: education נגזר מהצ׳יפים ולא נשמר בנפרד */
  const education = chips.includes("degree") ? "C"
    : chips.includes("bagrut") ? "B" : "A";
  /* `has` הוא מה שמסך החסמים ובוחר התארים קוראים — אותו פורמט בדיוק */
  return { time, budget, location, education, has: chips.filter(c => c !== "none").join(",") };
}

export default function AlumniIntake({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [chips, setChips] = useState<string[]>([]);
  const q = QUESTIONS[i];

  function pick(optId: string) {
    if (q.key === "edu") {
      /* "אף אחד מאלה" מנקה את השאר, ובחירה אחרת מנקה אותו */
      setChips(prev => optId === "none" ? ["none"]
        : prev.filter(c => c !== "none").includes(optId)
          ? prev.filter(c => c !== optId && c !== "none")
          : [...prev.filter(c => c !== "none"), optId]);
      return;
    }
    const next = { ...ans, [q.key]: optId };
    setAns(next);
    logEvent("alumni_intake_step", { q: q.key, answer: optId });
    if (i + 1 < QUESTIONS.length) setI(i + 1);
    else finish(next, chips);
  }

  function finish(a: Record<string, string>, c: string[]) {
    const contract = toContract(a, c);
    try {
      /* החוזה — מה ששלב 5 וכל שאר המסכים קוראים */
      localStorage.setItem("paths-quiz", JSON.stringify(contract));
      localStorage.setItem("paths-edu-chips", JSON.stringify(c));
      /* מה שייחודי לבוגרים: מזין את מסננת המסלולים ואת מסך הרכזת */
      localStorage.setItem("alumni-intake", JSON.stringify({ ...a, chips: c }));
      /* אצלם המסלול ידוע מראש — אין מסך השוואה, ואין מה לשקלל */
      localStorage.setItem("paths-track", "degree");
      /*
        המסך הבא נשמר, ולא רק נקבע ב-state: בלעדיו מי שחוזר לאפליקציה
        אחרי שסיים את השאלון היה נוחת על מסך המבוא של הקהל הרחב —
        "שלוש הדרכים" — שאיננו רלוונטי לו בכלל.
      */
      localStorage.setItem("paths-phase", "institutions");
      const doms: Domain[] = a.domain === "all"
        ? (["code", "data", "cyber", "qa", "networks", "ai"] as Domain[])
        : [a.domain as Domain];
      localStorage.setItem("paths-domains", JSON.stringify(doms));
    } catch { /* ignore */ }
    savePathsAnswers({ answers: contract, recommendation: "degree" }).catch(() => {});
    trackEvent("alumni_intake_done", { availability: a.avail, work: a.work });
    logEvent("alumni_intake_done", {
      availability: a.avail, work: a.work, domain: a.domain,
    });
    onDone();
  }

  const isEdu = q.key === "edu";
  const selected = (id: string) => (isEdu ? chips.includes(id) : ans[q.key] === id);

  return (
    <div className="flex-1 max-w-[560px] mx-auto w-full px-[22px] pt-7 pb-32">
      <div className="text-[11px] font-black tracking-widest mb-2" style={{ color: ORANGE }}>
        שאלה {i + 1} מתוך {QUESTIONS.length}
      </div>
      <h1 className="text-[22px] leading-tight mb-1.5" style={{ ...HEEBO, color: NAVY }}>{q.title}</h1>
      {q.note && (
        <p className="text-[13px] leading-[1.7] mb-5" style={{ color: "rgba(0,0,0,0.5)" }}>{q.note}</p>
      )}

      <div className="flex flex-col gap-2.5 mt-4">
        {q.opts.map(o => {
          const on = selected(o.id);
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              className="text-right px-4 py-3.5 rounded-2xl active:scale-[0.99] transition-transform"
              style={{
                background: on ? "rgba(251,133,0,0.08)" : "#fff",
                border: `1.5px solid ${on ? ORANGE : "rgba(2,62,138,0.1)"}`,
                boxShadow: on ? "none" : "0 2px 10px rgba(2,62,138,0.05)",
              }}
            >
              <div className="text-[15px] font-black" style={{ color: NAVY }}>
                {isEdu && on ? "✓ " : ""}{o.label}
              </div>
              {o.sub && (
                <div className="text-[12.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>{o.sub}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* שאלת הצ׳יפים היא היחידה שצריכה אישור — בשאר, ההקשה היא התשובה */}
      {isEdu && (
        <button
          onClick={() => {
            const next = { ...ans, edu: chips.join(",") };
            setAns(next);
            logEvent("alumni_intake_step", { q: "edu", answer: chips.join(",") || "none" });
            if (i + 1 < QUESTIONS.length) setI(i + 1); else finish(next, chips);
          }}
          className="w-full mt-5 py-4 rounded-2xl text-white text-[15px] font-black"
          style={{ background: NAVY, ...HEEBO }}
        >
          ממשיכים ←
        </button>
      )}

      {i > 0 && (
        <button onClick={() => setI(i - 1)} className="w-full mt-4 text-[12.5px] font-bold"
          style={{ color: "rgba(0,0,0,0.35)" }}>
          ↩ לשאלה הקודמת
        </button>
      )}
    </div>
  );
}
