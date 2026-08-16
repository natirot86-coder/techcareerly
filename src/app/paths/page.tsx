"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { visibleByTrack } from "@/data/institutions";
import { track as trackEvent } from "@vercel/analytics";
import JourneyStrip from "@/components/ui/JourneyStrip";
import AllPaths from "@/components/ui/AllPaths";
import TrackDetail from "@/components/ui/TrackDetail";
import { DOMAIN_LABEL, type Domain } from "@/data/institutions";
import { savePathsAnswers, logEvent } from "@/lib/candidate";
import { visibleCourses, type Course } from "@/data/courses";
import { degreesFor, ENTRY_LABEL, type Degree } from "@/data/degrees";
import { FUNDING } from "@/data/scholarships";

/** שם התת-שלב שמוצג בפס ההתקדמות */
const PHASE_LABEL: Record<string, string> = {
  intro: "מבינים מה עומד על הפרק",
  quiz: "עונים על 6 שאלות",
  result: "המסלול שמתאים לך",
  routes: "איך מגיעים למשרה ראשונה",
  blockers: "מפרקים את החסמים",
  institutions: "בוחרים מוסדות",
  prep: "שאלות לפגישה",
  research: "חקר עצמי מול המוסדות",
  done: "סיימת את השלב",
};

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Phase = "intro" | "quiz" | "result" | "routes" | "blockers" | "institutions" | "prep" | "research" | "done";

/** תשובות מהחקר העצמי מול המוסדות */
type Answer = "yes" | "no" | "unknown";
type ResearchEntry = { status: "todo" | "done" | "dropped"; answers: Record<string, Answer>; note: string };

const RESEARCH_QUESTIONS: { id: string; q: string }[] = [
  { id: "route", q: "יש מסלול קבלה שמתאים למצב שלי" },
  { id: "money", q: "יש מלגה שאני עשוי/ה להיות זכאי/ת לה" },
  { id: "support", q: "יש ליווי אקדמי וחונכות בשנה א׳" },
  { id: "event", q: "יש יום פתוח או אירוע חשיפה קרוב" },
];

const ANSWER_META: Record<Answer, { label: string; color: string; bg: string }> = {
  yes: { label: "כן", color: "#047857", bg: "rgba(5,150,105,0.12)" },
  no: { label: "לא", color: "#b91c1c", bg: "rgba(220,38,38,0.1)" },
  unknown: { label: "לא ידעו", color: "#92400e", bg: "rgba(251,133,0,0.14)" },
};
type Track = "bootcamp" | "mahat" | "degree";
type QuizAnswers = { time: string; budget: string; education: string; kids: string; timeline: string; location: string };
type ShortlistItem = { name: string; track: Track };

// ─── Data ─────────────────────────────────────────────────────────────────────

type QuizQuestion = {
  key: keyof QuizAnswers;
  q: string;
  note?: string;
  opts: { val: string; label: string; sub: string }[];
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: "time" as keyof QuizAnswers,
    q: "כמה שעות בשבוע אתה יכול להקדיש ללימודים?",
    opts: [
      { val: "A", label: "5–10 שעות", sub: "בין עבודה, משפחה וחיים" },
      { val: "B", label: "15–20 שעות", sub: "ערבים וסופי שבוע" },
      { val: "C", label: "30+ שעות", sub: "אני פנוי/ה ללמוד ברצינות" },
    ],
  },
  {
    key: "budget" as keyof QuizAnswers,
    q: "מה האפשרות הכלכלית שלך ללימודים?",
    opts: [
      { val: "A", label: "זקוק/ה למלגה", sub: "בלי מלגה זה לא מציאותי עבורי" },
      { val: "B", label: "עד 30,000 ₪", sub: "יכול/ה להשתתף בחלק מהעלות" },
      { val: "C", label: "הכסף לא המגבלה", sub: "אני בוחר/ת לפי איכות" },
    ],
  },
  {
    key: "education" as keyof QuizAnswers,
    q: "מה ההשכלה הנוכחית שלך?",
    opts: [
      { val: "A", label: "תיכון / בגרות חלקית", sub: "בלי בגרות מלאה" },
      { val: "B", label: "בגרות מלאה", sub: "יש לי תעודת בגרות" },
      { val: "C", label: "תואר ראשון ומעלה", sub: "כבר סיימתי לימודים אקדמיים" },
    ],
  },
  {
    key: "kids" as keyof QuizAnswers,
    q: "יש לך ילדים קטנים (מתחת לגיל 6)?",
    opts: [
      { val: "A", label: "כן — מגביל מאוד", sub: "ההתחייבות היומית שלי גדולה" },
      { val: "B", label: "יש ילדים אבל מסתדר/ת", sub: "יש עזרה / גן / מסגרת" },
      { val: "C", label: "אין — אני גמיש/ה", sub: "יכול/ה להקדיש זמן כרצוני" },
    ],
  },
  {
    key: "timeline" as keyof QuizAnswers,
    q: "כמה זמן את/ה יכול/ה להחזיק כלכלית עד שההכנסה מההייטק מגיעה?",
    note: "חשוב לדעת לפני שעונים: בתואר לא מחכים ארבע שנים לעבודה. משרת סטודנט נפתחת כבר מסוף שנה א׳ — בתשלום, ונחשבת ניסיון אמיתי. היא תחרותית ולא מובטחת, אבל היא הופכת את התואר לארבע שנים של הכנסה חלקית, לא של אפס.",
    opts: [
      { val: "A", label: "אני חייב/ת הכנסה תוך שנה", sub: "אין לי רשת ביטחון כלכלית" },
      { val: "B", label: "שנה וחצי–שנתיים", sub: "אפשרי אם אני עובד/ת במקביל" },
      { val: "C", label: "יש לי יציבות", sub: "אני יכול/ה להשקיע לטווח ארוך" },
    ],
  },
  {
    key: "location" as keyof QuizAnswers,
    q: "איפה את/ה גר/ה?",
    note: "אנחנו מחפשים לך מסגרת פרונטלית. לימוד מרחוק נשמע נוח, אבל הרבה יותר קשה להתמיד בו — הכיתה, המרצה והחברים ללימודים הם מה שמחזיק אנשים בפנים כשנהיה קשה.",
    opts: [
      { val: "A", label: "מרכז הארץ", sub: "גוש דן, ת״א, ירושלים" },
      { val: "B", label: "צפון / דרום / פריפריה", sub: "פחות מוסדות בטווח נסיעה" },
      { val: "C", label: "מוכן/ה לנסוע", sub: "המיקום לא יעצור אותי" },
    ],
  },
];


const TRACK_META: Record<Track, { emoji: string; label: string; duration: string; cost: string; entry: string; pros: string[]; cons: string[] }> = {
  bootcamp: {
    emoji: "⚡",
    label: "הכשרה טכנולוגית",
    duration: "6–12 חודשים",
    cost: "מחינם ועד 45,000 ₪ — תלוי לגמרי איפה",
    entry: "מבחן מיון וראיון. בחלק מהמסלולים אפשר בלי בגרות מלאה",
    pros: [
      "טק-קריירה: כ-4,000 ₪ בלבד, עם מלגת קיום ומגורים — ו-88–90 אחוזי השמה, בוגרים בצ׳ק פוינט, Wix, אינטל ובזק",
      "נכנסים לשוק תוך פחות משנה ומתחילים להרוויח, במקום לחכות שלוש שנים",
      "ברשתות, בתשתיות ובסייבר ההסמכות המקצועיות — CCNA, AWS — שוקלות אצל מעסיקים לא פחות מתעודה. וזה בדיוק מה שקורס טוב נותן",
      "שוברי הכשרה מקצועית: יוצאי אתיופיה בקבוצת הזכאות הגבוהה ביותר — סבסוד של עד 90 אחוז",
      "לומדים בדיוק את מה שעושים בעבודה, בלי קורסי חובה שלא קשורים",
    ],
    cons: [
      "לא כל הקורסים דומים, וזה ההבדל הכי חשוב להבין: טק-קריירה ותפוח הם חריגים — חינם או מסובסד, עם סינון וליווי צמוד. קורס מסחרי יכול לעלות עשרות אלפים בלי מלגה, בלי סינון, ובלי שיפרסמו נתוני השמה בכלל",
      "המקומות מוגבלים — מחזור הוא 15 עד 25 איש, עם מבחן, ראיון וועדת קבלה. לא כולם מתקבלים, וכדאי שתהיה תוכנית נוספת",
      "תעודה לא אקדמית — חוסמת חלק מהמשרות, וגם את הקידום בהמשך",
      "פחות בסיס תיאורטי. לא מרגישים את זה בהתחלה — מרגישים כשרוצים להתקדם",
    ],
  },
  mahat: {
    emoji: "🏫",
    label: "מה\"ט / הנדסאי",
    duration: "2–3 שנים, לרוב בערב",
    cost: "25,000–65,000 ₪",
    entry: "בגרות מלאה עם מתמטיקה — כמעט מה שתואר דורש",
    pros: [
      "אם שירתת — האגף לחיילים משוחררים מממן 90 אחוז משכר הלימוד בלימודי הנדסאי במכללות שמה״ט מכיר. עד 5 שנים מהשחרור, ועד 10 שנים לחיילים בודדים ולמשרתי מילואים פעילים. זו ההטבה הגדולה ביותר במסלול הזה",
      "בגופים ביטחוניים וממשלתיים — רפאל, אלביט, התעשייה האווירית, חברת חשמל — יש דירוג הנדסאים. התעודה נכנסת לטבלת שכר ולמסלול קידום מסודר. לתעודת קורס אין שם מעמד בכלל",
      "תוכנית עתידאים: מסלול הנדסאי מרוכז של 17 חודשים בשיתוף התעשייה, עם מלגת קיום, השתתפות בשכר לימוד, התמחות תוך כדי הלימודים ומעטפת נגד נשירה. מיועדת במיוחד לצעירים מהפריפריה",
      "באלקטרוניקה ובמכטרוניקה אין קיצור דרך — לא קיים קורס של חצי שנה שמכשיר לזה. כאן זה מה\"ט או כלום",
      "לימודי ערב שמאפשרים להמשיך לעבוד ביום לאורך כל התקופה",
    ],
    cons: [
      "דורש כמעט מה שתואר דורש ולוקח כמעט אותו זמן — אבל נותן פחות. אם את/ה עומד/ת בתנאים, שווה לבדוק תואר קודם",
      "משרות סטודנט כמעט לא פתוחות להנדסאים — המודעות מבקשות תואר. זה בדיוק היתרון הגדול שמפסידים כאן",
      "בחברות מוצר תוכנה הרבה סינונים כתובים פשוט ״B.Sc נדרש״ — וקורות חיים נופלים לפני שמישהו קרא אותם",
      "המעבר לתואר בהמשך חלקי — לרוב פטור מכמה קורסים, לא קפיצה לשנה ב׳. לא כדאי לתכנן על סמך זה",
      "מי שלא שירת מפסיד את המימון הגדול — מלגת ה-90 אחוז היא של האגף לחיילים משוחררים, ורוב שאר הכסף הגדול בנוי סביב תארים אקדמיים",
    ],
  },
  degree: {
    emoji: "🎓",
    label: "תואר אקדמי",
    duration: "3–4 שנים · משרת סטודנט משנה ב׳",
    cost: "40,000–130,000 ₪ (לפני מלגות)",
    entry: "בגרות + פסיכומטרי — בחלק מהמכללות יש קבלה ללא פסיכומטרי",
    pros: [
      "משרת סטודנט נפתחת כבר בסוף שנה א׳ — לא צריך לחכות לסיום התואר כדי להתחיל להרוויח ולצבור ניסיון",
      "המשרות שנפתחות אחרי תואר שוות יותר — בשכר, בתוכן ובסיכויי הקידום",
      "הסיכוי להתקבל בכלל גדל משמעותית — התואר עובר סינון ראשוני שקורות חיים אחרים נתקעים בו",
      "מה שעוברים במהלך התואר בונה חוסן ודרך חשיבה — זה משנה אנשים, לא רק את קורות החיים",
      "לומדים בקבוצה, עם מרצים וחברים — וזה מה שמחזיק כשקשה",
    ],
    cons: [
      "משרות סטודנט תחרותיות מאוד כרגע — לא מובטחות, ורוב המשרות דורשות שתישאר לפחות שנה עד סיום התואר. מי שמחכה לשנה ד׳ מפספס את החלון",
      "הארוך והיקר מבין השלושה",
      "פסיכומטרי ברוב האוניברסיטאות",
      "שנה א׳ קשה — קורסי המתמטיקה הם המקום שבו רוב הנשירה קורית",
      "גם עם משרת סטודנט, ההכנסה בשנתיים הראשונות חלקית",
    ],
  },
};

/**
 * Degree first — that is the recommendation, and the order says so.
 * מה"ט last on purpose: it fits a narrow career shape (defence, government,
 * hardware) rather than hi-tech broadly, so it should not read as a third
 * equal pillar.
 */
const TRACK_ORDER: Track[] = ["degree", "bootcamp", "mahat"];

// ─── Deadlines ────────────────────────────────────────────────────────────────
// ⚠️ תחזוקה שנתית: התאריכים חוזרים כל שנה אך משתנים מדי פעם. לאמת לפני כל שנת לימודים.

const HE_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

/** m/d = opening. closeM/closeD (optional) = closing, so an open window reads as open. */
type AnnualDate = { m: number; d: number; label: string; closeM?: number; closeD?: number };

/** Next occurrence of an annual date, so advice stays correct year-round. */
function nextAnnual(m: number, d: number): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = new Date(now.getFullYear(), m - 1, d);
  return thisYear >= today ? thisYear : new Date(now.getFullYear() + 1, m - 1, d);
}

function daysUntil(m: number, d: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((nextAnnual(m, d).getTime() - today.getTime()) / 86400000);
}

/** True while today sits inside this year's open→close window. */
function isOpenNow(a: AnnualDate): boolean {
  if (a.closeM === undefined || a.closeD === undefined) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const y = now.getFullYear();
  const open = new Date(y, a.m - 1, a.d);
  // a window may wrap past new year (e.g. November → February)
  const close = new Date(a.closeM < a.m ? y + 1 : y, a.closeM - 1, a.closeD);
  if (today >= open && today <= close) return true;
  // also check the window that opened last year and is still running
  const prevOpen = new Date(y - 1, a.m - 1, a.d);
  const prevClose = new Date(a.closeM < a.m ? y : y - 1, a.closeM - 1, a.closeD);
  return today >= prevOpen && today <= prevClose;
}

function whenText(a: AnnualDate): string {
  if (isOpenNow(a)) {
    return `פתוח עכשיו — נסגר ב-${a.closeD} ב${HE_MONTHS[a.closeM! - 1]}`;
  }
  const days = daysUntil(a.m, a.d);
  const date = `${a.d} ב${HE_MONTHS[a.m - 1]}`;
  if (days === 0) return `${a.label} היום — ${date}`;
  if (days === 1) return `${a.label} מחר — ${date}`;
  if (days <= 60) return `${a.label} בעוד ${days} ימים — ${date}`;
  return `${a.label} ב-${date}`;
}

/** Urgent = opening soon, or open right now. */
function isUrgent(a: AnnualDate): boolean {
  return isOpenNow(a) || daysUntil(a.m, a.d) <= 60;
}

// ─── Blockers ─────────────────────────────────────────────────────────────────
// כל חסם שהמשתמש הודה בו מקבל כאן פתרון קונקרטי עם שם ותאריך — לא רשימה גנרית.

type Solution = { name: string; detail: string; link?: string; date?: AnnualDate };
type Blocker = {
  id: string;
  applies: (q: QuizAnswers) => boolean;
  said: string;      // בלשון המשתמש
  heading: string;   // מה שאנחנו אומרים בחזרה
  lead: string;
  solutions: Solution[];
};

const BLOCKERS: Blocker[] = [
  {
    id: "bagrut",
    applies: q => q.education === "A",
    said: "אין לי בגרות מלאה",
    heading: "זה חוסם את התואר היום — ולא לתמיד",
    lead: "מכינה קדם-אקדמית היא שנה אחת שסוגרת בדיוק את הפער, ולרוב היא מסובסדת מאוד או חינמית. בחלק מהמקומות היא גם מחליפה את הפסיכומטרי.",
    solutions: [
      { name: "מלגת פריפריה — האגף לחיילים משוחררים (ייעוד 44)", detail: "שכר לימוד מלא לשנה א׳ למשוחררים שלומדים באזור עדיפות לאומית, בלי שום שעות התנדבות. שימו לב: לא נרשמים — המוסד מדווח עליכם, ואתם רק חותמים על כתב התחייבות באזור האישי. בלי החתימה לא משולם כלום.", link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/Perypheria44.aspx", date: { m: 8, d: 15, label: "החתימה נסגרת" } },
      { name: "עתידים לתעשייה והייטק", detail: "המעטפת הגדולה ביותר שמצאנו — כ-77,000 ₪ לאורך התואר: שכר לימוד מדורג, מלגת קיום חודשית ומחשב. להנדסה, מדעי המחשב ופיזיקה בממוצע 75 ומעלה, עם עדיפות מפורשת לבני הקהילה ולפריפריה. רק כ-150 מתקבלים.", link: "https://www.atidimtaasya.com/", date: { m: 8, d: 31, label: "ההגשה נסגרת" } },
      { name: "מושל (Moshal)", detail: "שכר לימוד מלא ועוד דמי קיום של 58,500 עד 78,000 ₪ לכל התואר, עם ליווי קריירה ואנגלית עסקית. לדור ראשון להשכלה גבוהה בשנה א׳. הקריטריון כלכלי ולא עדתי — ומאשרת במפורש הגשה במקביל לכל מלגה אחרת.", link: "https://moshalprogram.org.il/candidates/", date: { m: 9, d: 10, label: "ההגשה נסגרת" } },
      { name: "מלגת מרום", detail: "ייעודית ליוצאי אתיופיה, והייטק מדורג אצלה גבוה. מתשפ״ז בוטלה חובת ההתנדבות — במפורש כדי לאפשר לצבור אותה יחד עם פר״ח. הסכום והתנאים לתשפ״ז יפורסמו רק בספטמבר.", link: "https://che.org.il/scholarships/marom/", date: { m: 9, d: 9, label: "ההרשמה נפתחת", closeM: 11, closeD: 10 } },
      { name: "מלגת פר״ח", detail: "כ-7,000 ₪ במזומן תמורת 100 שעות חונכות, ופתוחה גם ללומדים בבתי ספר להנדסאים. אפשר לצבור עם מרום. חשוב: זה כל הקודם זוכה — כדאי להירשם ביום שהיא נפתחת.", link: "https://www.perach.org.il/", date: { m: 9, d: 3, label: "ההרשמה נפתחת" } },
      { name: "מלגת פריפריה לבוגרי מכינה (ייעוד 46)", detail: "עד 50% שכר לימוד לשלוש שנות התואר, לבוגרי מכינה קדם-אקדמית ממומנת שמתגוררים באזור עדיפות. אפשר לקבל רק מלגת פריפריה אחת — או 44 או 46.", link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/Perypheria46.aspx", date: { m: 8, d: 3, label: "ההגשה נפתחה", closeM: 10, closeD: 31 } },
      { name: "קרן גרוס", detail: "עד 10,000 ₪ בשנה למשוחררים עד חמש שנים, ויוצאי אתיופיה מצוינים אצלה כאוכלוסיית יעד. שימו לב: היא לא מתאפשרת יחד עם מלגה אחרת מעל 5,000 ₪ — זו בחירה, לא תוספת.", link: "https://www.gruss.org.il/blank", date: { m: 9, d: 15, label: "ההגשה נפתחת", closeM: 12, closeD: 15 } },
      { name: "קרן חנן עינור", detail: "2,000 עד 7,000 ₪ ליוצאי אתיופיה, בלי התנדבות. חשוב במיוחד: היא מכסה גם לימודי הנדסאי ולימודי תעודה, ולא רק תואר.", date: { m: 11, d: 1, label: "חלון ההגשה נפתח", closeM: 11, closeD: 22 } },
      { name: "האגף לחיילים משוחררים — מסלול הנדסאים", detail: "90% משכר הלימוד ללימודי הנדסאי וטכנאי, כולל מכינה. נרשמים דרך המכללה לאורך כל השנה, בלי טופס נפרד. שנה ג׳ אינה ממומנת.", },
      { name: "הישגים (אלומה)", detail: "לא מלגה אלא ייעוץ וליווי אישיים בחינם — בחירת מוסד, תנאי קבלה, פסיכומטרי ומימון. ערוץ טוב להתחיל בו כשלא ברור מאיפה מתחילים.", link: "https://hesegim.org.il/" },
    ],
  },
  {
    id: "money",
    applies: q => q.budget === "A" || q.budget === "B",
    said: "בלי מלגה זה לא מציאותי עבורי",
    heading: "כמעט אף אחד לא משלם את המחיר המלא",
    lead: "יש הרבה יותר כסף לתארים מאשר לקורסים. הרבה יותר. וחלק מהמלגות אפשר לצבור יחד — מרום ופר״ח למשל תוכננו במפורש להשתלב. אלה התוכניות שרלוונטיות לך, עם התאריכים.",
    solutions: [
      { name: "מלגת מרום", detail: "ליוצאי אתיופיה שבארץ 15+ שנים או ילידי הארץ. מדעי המחשב נמצאים בקבוצת העדיפות העליונה שלה. מתשפ״ז בוטלה חובת ההתנדבות — אפשר לצבור אותה יחד עם מלגות אחרות.", link: "https://che.org.il/scholarships/marom/", date: { m: 9, d: 9, label: "ההרשמה נפתחת", closeM: 11, closeD: 10 } },
      { name: "עתידים לתעשייה והייטק", detail: "מלגת קיום חודשית, מחשב נייד, סיוע בשכר לימוד — והשמה בתעשייה כבר מהסמסטר השלישי. עדיפות לפריפריה ולקהילות מיוצגות-חסר. ההרשמה פתוחה.", link: "https://www.atidimtaasya.com/" },
      { name: "המינהל לסטודנטים עולים", detail: "למי שבארץ פחות מ-15 שנה: מימון שכר לימוד, שיעורי עזר, חונך אישי ומלגת קיום חודשית. זה המסלול המשלים למרום — לא מקבלים את שניהם.", date: { m: 11, d: 1, label: "מועד לסמסטר א׳" } },
      { name: "שוברים להכשרה מקצועית", detail: "יוצאי אתיופיה נמצאים בקבוצת הזכאות הגבוהה ביותר — סבסוד של עד 90% מעלות הקורס ועוד מענק השמה. נדרשת הפניה ממרכז הכוון או שירות התעסוקה." },
      { name: "האגף לחיילים משוחררים", detail: "אם שירתת ואת/ה שוקל/ת מסלול הנדסאי — האגף מממן 90% משכר הלימוד במכללות שמה״ט מכיר. עד 5 שנים מהשחרור, ועד 10 שנים לחיילים בודדים ולמשרתי מילואים פעילים.", link: "https://www.hachvana.mod.gov.il/MainEducation/PracticalEngineer/Pages/PracticalEngScholarship.aspx" },
    ],
  },
  {
    id: "runway",
    applies: q => q.timeline === "A",
    said: "אני חייב/ת הכנסה תוך שנה",
    heading: "זה החסם האמיתי — ויש לו שני פתרונות",
    lead: "לא נמכור לך אשליה: תואר עם אפס הכנסה לשלוש שנים הוא לא ריאלי כשמפרנסים. אבל יש שתי דרכים שכן עובדות.",
    solutions: [
      { name: "תואר עם מלגת קיום", detail: "עתידים משלמת מלגת קיום חודשית ומכניסה אותך לעבודה בתעשייה כבר מהסמסטר השלישי. בשילוב מרום, זה הופך את התואר משלוש שנים בלי הכנסה לשלוש שנים עם הכנסה חלקית.", link: "https://www.atidimtaasya.com/" },
      { name: "להתחיל בהכשרה, לחזור לתואר", detail: "טק-קריירה נותנת קורס חינם עם מלגת קיום ומגורים, וכ-88% השמה. נכנסים לשוק, מתחילים להרוויח — ואז חוזרים לתואר כשכבר יש משכורת. הרבה בוגרים עושים בדיוק את זה, וזה הרבה יותר קל מהכיוון הזה.", link: "https://www.tech-career.org" },
    ],
  },
  {
    id: "hours",
    applies: q => q.time === "A" || q.kids === "A",
    said: "הזמן שלי מוגבל מאוד",
    heading: "יש מסגרות שנבנו בדיוק סביב זה",
    lead: "לא כל תואר דורש חמישה ימים בקמפוס. יש תוכניות פרונטליות שמכוונות למי שעובד או מגדל ילדים.",
    solutions: [
      { name: "מכללת ספיר", detail: "לימודים בשלושה ימים בלבד — א׳, ב׳, ג׳. השילוב הטוב ביותר שמצאנו למי שעובד במקביל.", link: "https://www.sapir.ac.il/ba/computer_science" },
      { name: "HIT חולון", detail: "לימודי אחר הצהריים וערב. שימו לב — מעל גיל 30 נדרשת מכינה.", link: "https://www.hit.ac.il" },
      { name: "מסלולי מה״ט בערב", detail: "אורט וסמי שמעון מפעילים תוכניות הנדסאי בערב, שמאפשרות לעבוד ביום לאורך כל התקופה." },
    ],
  },
  {
    id: "location",
    applies: q => q.location === "B",
    said: "אני גר/ה בפריפריה",
    heading: "יש מוסדות טובים קרוב אליך",
    lead: "לא צריך לעבור למרכז. חלק מהמסלולים החזקים ביותר לקהילה נמצאים דווקא בדרום ובצפון, וחלקם מסבסדים מעונות ונסיעות.",
    solutions: [
      { name: "בן-גוריון — באר שבע", detail: "תוכנית סיקט מסבסדת מעונות ומחזירה הוצאות נסיעה, ופארק ההייטק גב-ים צמוד לקמפוס.", link: "https://www.bgu.ac.il/welcome/ba/scholarship-lobby/sicket/" },
      { name: "ספיר — שדרות · אשקלון · SCE", detail: "שלושה מוסדות בדרום עם סף קבלה נגיש ושכר לימוד מתוקצב." },
      { name: "אוניברסיטת חיפה", detail: "לצפון — הסף הייעודי הנמוך בארץ לקהילה, והמעטפת המפותחת ביותר שנמצאה.", link: "https://dekanat.haifa.ac.il/" },
    ],
  },
  {
    id: "psychometric",
    applies: q => q.education !== "A",
    said: "הפסיכומטרי",
    heading: "יש היום יותר דרכים לעקוף אותו מאי פעם",
    lead: "הפסיכומטרי כבר לא השער היחיד. אלה מסלולים אמיתיים שקיימים היום — רובם לא מוכרים מספיק.",
    solutions: [
      { name: "סף ייעודי לקהילה", detail: "באוניברסיטת חיפה: פסיכומטרי 400 בתוספת ראיון אישי — הסף הנמוך בארץ. בבן-גוריון, תוכנית סיקט שוקלת ציון של עד 100 נקודות מתחת לסף הרגיל." },
      { name: "קבלה על בסיס בגרות בלבד", detail: "אפקה, ספיר (ממוצע 95), אשקלון (ממוצע 85) ו-HIT (ממוצע 102) מקבלים בלי פסיכומטרי בכלל." },
      { name: "קרן אור — רייכמן", detail: "מדעי המחשב ללא פסיכומטרי, בלי צורך בציוני בגרות גבוהים, ובמימון כמעט מלא. הקריטריון הוא כלכלי-חברתי.", link: "https://www.runi.ac.il/admissions/undergraduate/scholarships/keren-or" },
      { name: "ראויים לקידום", detail: "מנגנון העדפה מתקנת שמוסיף עד 60 נקודות לפי אזור מגורים, בית ספר והשכלת ההורים. פועל מול שש האוניברסיטאות. חשוב: הטיפול לוקח כחודשיים — צריך להגיש מוקדם.", link: "https://kidum-edu.org.il/reuim-lekidum/" },
    ],
  },
  {
    id: "belief",
    applies: () => true,
    said: "אני לא בטוח/ה שאני מסוגל/ת",
    heading: "זה החסם שאף אחד לא מודה בו — והוא הכי נפוץ",
    lead: "שנה א׳ באמת קשה. המתמטיקה היא המקום שבו אנשים נופלים. אבל נשירה היא לא עניין של כישרון — היא עניין של מי עומד לידך כשנתקעת.",
    solutions: [
      { name: "זה עובד, ויש לזה הוכחה", detail: "באוניברסיטת חיפה צמצמו את נשירת שנה א׳ במדעי המחשב בכמחצית. מה שעשה את ההבדל לא היה סינון קפדני יותר — אלא רכז שיושב בתוך המחלקה, מכיר אותך בשם ויודע מתי אתה נעלם." },
      { name: "מה לוודא שקיים במוסד", detail: "חונכות אישית, שיעורי תגבור, יועץ אקדמי שאפשר לתפוס, והתאמות בבחינות. אלה קיימים כמעט בכל מקום — אבל רק מי ששואל מקבל אותם." },
      { name: "את/ה לא הראשון/ה", detail: "תשעה מכל עשרה בוגרי תואר יוצאי אתיופיה הם דור ראשון להשכלה גבוהה במשפחתם. כולם עברו בדיוק את הרגע הזה של ״אולי זה לא בשבילי״." },
    ],
  },
];

// ─── Logic ────────────────────────────────────────────────────────────────────

/**
 * Weighted scoring — deliberately not a veto.
 * The degree starts ahead: it opens the most doors, raises the odds of being
 * hired at all, and a student job from year 2 means income arrives long before
 * graduation. Only real constraints move the recommendation away from it, and
 * every tie goes to the degree.
 */
const WEIGHTS: Record<keyof QuizAnswers, Record<string, Partial<Record<Track, number>>>> = {
  // ההשכלה הנוכחית — השער האמיתי
  education: {
    A: { degree: -6, mahat: -2, bootcamp: 4 },
    B: { degree: 1, mahat: 1 },
    C: { degree: 2 },
  },
  // רשת ביטחון כלכלית — כמה זמן אפשר להחזיק עד שההכנסה מגיעה
  timeline: {
    A: { degree: -5, mahat: 2, bootcamp: 4 },
    B: { mahat: 2, bootcamp: 1 },
    C: { degree: 3 },
  },
  // שעות פנויות בשבוע
  time: {
    A: { degree: -3, mahat: 2, bootcamp: 2 },
    B: { degree: 1, mahat: 1 },
    C: { degree: 3 },
  },
  // תקציב — חסם רך יותר ממה שהוא נראה: תשתית המלגות לתארים היא הרחבה ביותר
  budget: {
    A: { mahat: 1, bootcamp: 1 },
    B: { degree: 1, mahat: 1 },
    C: { degree: 2 },
  },
  kids: {
    A: { degree: -2, mahat: 1, bootcamp: 2 },
    B: { mahat: 1 },
    C: { degree: 1 },
  },
  location: {
    A: { degree: 1 },
    B: { mahat: 1, bootcamp: 1 },
    C: { degree: 1 },
  },
};

function scoreTracks(q: QuizAnswers): Record<Track, number> {
  const score: Record<Track, number> = { degree: 5, mahat: 0, bootcamp: 0 };
  (Object.keys(WEIGHTS) as (keyof QuizAnswers)[]).forEach(key => {
    const delta = WEIGHTS[key][q[key]];
    if (!delta) return;
    (Object.keys(delta) as Track[]).forEach(t => { score[t] += delta[t] ?? 0; });
  });
  return score;
}

function recommendTrack(q: QuizAnswers): Track {
  const s = scoreTracks(q);
  if (s.degree >= s.mahat && s.degree >= s.bootcamp) return "degree";
  return s.mahat >= s.bootcamp ? "mahat" : "bootcamp";
}

function buildReason(q: QuizAnswers, track: Track): string {
  const reasons: string[] = [];

  if (track === "degree") {
    if (q.education === "C") reasons.push("כבר יש לך רקע אקדמי");
    else if (q.education === "B") reasons.push("יש לך בגרות מלאה");
    if (q.timeline === "C") reasons.push("יש לך יציבות כלכלית");
    else if (q.timeline === "B") reasons.push("את/ה יכול/ה להחזיק עד משרת הסטודנט");
    if (q.time === "C") reasons.push("יש לך זמן להשקיע");
    const why = reasons.length ? `${reasons.join(", ")} — ` : "";
    return `${why}תואר הוא המסלול שפותח לך הכי הרבה דלתות, וגם זה שמעלה הכי הרבה את הסיכוי להתקבל לעבודה הראשונה. משרת סטודנט משנה ב׳ אומרת שההכנסה מתחילה הרבה לפני הסיום.`;
  }

  if (track === "mahat") {
    if (q.time === "A" || q.kids === "A") reasons.push("הזמן שלך מוגבל");
    if (q.timeline === "B") reasons.push("את/ה צריך/ה הכנסה בתוך שנתיים");
    const why = reasons.length ? `בגלל ש${reasons.join(", ")} — ` : "";
    return `${why}מה״ט יכול להתאים לך — אבל חשוב שתדע/י שהוא מתאים לסוג קריירה מסוים. הוא חזק במיוחד בגופים ביטחוניים וממשלתיים, שבהם לתעודת הנדסאי יש דירוג שכר רשמי, ובחומרה ואלקטרוניקה שאין אליהן קיצור דרך. אם היעד שלך הוא חברת תוכנה או סטארטאפ — שווה מאוד לבחון קודם תואר, כי מה״ט דורש כמעט אותם תנאים ולוקח כמעט אותו זמן.`;
  }

  if (q.education === "A") reasons.push("אין עדיין בגרות מלאה");
  if (q.timeline === "A") reasons.push("את/ה צריך/ה הכנסה בתוך שנה");
  if (q.time === "A") reasons.push("יש לך מעט שעות פנויות");
  const why = reasons.length ? `בגלל ש${reasons.join(", ")} — ` : "";
  return `${why}הכשרה טכנולוגית היא הדרך הריאלית להתחיל עכשיו. חשוב שתדע/י: זו נקודת פתיחה, לא תקרה. הרבה בוגרים חוזרים לתואר אחרי שהם כבר עובדים ומרוויחים — ואז זה הרבה יותר קל.`;
}

function generateQuestions(q: QuizAnswers, shortlist: ShortlistItem[], track: Track): string[] {
  const qs: string[] = [];

  if (q.education === "A") {
    qs.push("אין לי בגרות מלאה — איזו מכינה קדם-אקדמית פותחת לי תואר, כמה היא עולה ומתי היא נפתחת?");
  }
  if (track === "degree" || q.education !== "A") {
    qs.push("אילו מוסדות באמת מחוברים לחברות שמגייסות משרות סטודנט — ומה נדרש כדי להתקבל לאחת?");
  }
  if (q.budget === "A") {
    qs.push("אילו מלגות קיימות עבורי ספציפית, כמה הן מכסות ומה תאריכי ההגשה?");
  }
  if (q.timeline === "A" || q.kids === "A") {
    qs.push("איך מחזיקים כלכלית בשנתיים הראשונות? יש שילוב של מלגה ועבודה חלקית שבאמת עובד?");
  }
  if (q.location === "B") {
    qs.push("אילו מוסדות פרונטליים יש בטווח נסיעה סביר ממני, ויש הסעות או סיוע בדיור?");
  }
  qs.push("שנה א׳ נחשבת הקשה ביותר — איזה ליווי אקדמי וחונכות יש במוסד אם אני נתקע/ת?");
  if (shortlist.length >= 2) {
    qs.push(`מה ההבדל האמיתי בין ${shortlist[0].name} ל-${shortlist[1].name} מבחינת השמה ותמיכה?`);
  }
  qs.push("יש בוגרים מהקהילה שלי שעשו בדיוק את זה ואפשר לדבר איתם?");

  return qs.slice(0, 6);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RevealCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ border: "1px solid rgba(2,62,138,0.1)", background: "#fff" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-right"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[18px]">{emoji}</span>
          <span className="text-[13px] font-bold" style={{ color: NAVY }}>{title}</span>
        </div>
        <span className="text-[16px]" style={{ color: "rgba(0,0,0,0.3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && <div className="px-4 pb-4 text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>{children}</div>}
    </div>
  );
}


// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PathsPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({ time: "", budget: "", education: "", kids: "", timeline: "", location: "" });
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [activeTrack, setActiveTrack] = useState<Track>("bootcamp");
  const [quizStarted, setQuizStarted] = useState(false);
  const [research, setResearch] = useState<Record<string, ResearchEntry>>({});
  const [meetingBooked, setMeetingBooked] = useState(false);
  /** ציוני העניין מכלי עיבוד החוויה בשלב 3 */
  const [domainInterest, setDomainInterest] = useState<Partial<Record<Domain, number>>>({});
  const [domainChoice, setDomainChoice] = useState<"one" | "two" | "open" | null>(null);
  const [chosenDomain, setChosenDomain] = useState<Domain | null>(null);
  /** מסלול שנבחר במסך ההשוואה — null = מציגים את ההשוואה */
  const [openTrack, setOpenTrack] = useState<{ domain: Domain; track: Track } | null>(null);
  /** התחום שמוצג כרגע. תחום אחד על המסך, השאר במרחק לחיצה */
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);
  const [thinking, setThinking] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateResearch(id: string, patch: Partial<ResearchEntry>) {
    setResearch(prev => {
      const cur = prev[id] ?? { status: "todo" as const, answers: {}, note: "" };
      const next = { ...prev, [id]: { ...cur, ...patch } };
      try { localStorage.setItem("paths-research", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      // ?reset=1 — מנקה את ההתקדמות ומתחיל מאפס. שימושי לבדיקות.
      if (params.has("reset")) {
        ["paths-quiz", "paths-shortlist", "paths-phase", "paths-journey", "paths-research"].forEach(k => localStorage.removeItem(k));
        window.history.replaceState({}, "", "/paths");
        return;
      }

      // ?demo=1&phase=done — קפיצה ישירה למסך מסוים עם נתונים לדוגמה, לצורך סקירה.
      // לא נשמר ל-localStorage כדי לא ללכלך התקדמות אמיתית.
      if (params.has("demo")) {
        const demo: QuizAnswers = { time: "B", budget: "A", education: "B", kids: "B", timeline: "B", location: "B" };
        setAnswers(demo);
        setQuizStarted(true);
        setQIndex(QUIZ_QUESTIONS.length - 1);
        setShortlist([
          { name: "אוניברסיטת בן-גוריון — תוכנית סיקט", track: "degree" },
          { name: "מכללת ספיר", track: "degree" },
        ]);
        setActiveTrack(recommendTrack(demo));
        setDomainInterest({ cyber: 5, networks: 4, code: 3 });
        setDomainChoice("open");
        setResearch({
          "bgu": {
            status: "done",
            answers: { route: "yes", money: "yes", support: "yes", event: "unknown" },
            note: "דיברתי עם שושי מהיחידה. אמרה שעם הפסיכומטרי שלי אפשר להגיש דרך סיקט.",
          },
        });
      }

      const wanted = params.get("phase") as Phase | null;
      if (wanted) { setPhase(wanted); return; }

      const savedQ = localStorage.getItem("paths-quiz");
      if (savedQ) {
        const parsed: QuizAnswers = JSON.parse(savedQ);
        setAnswers(parsed);
        setQuizStarted(QUIZ_QUESTIONS.some(q => parsed[q.key]));
        // resume at the first unanswered question
        const firstOpen = QUIZ_QUESTIONS.findIndex(q => !parsed[q.key]);
        if (firstOpen > 0) setQIndex(firstOpen);
      }
      const savedS = localStorage.getItem("paths-shortlist");
      if (savedS) setShortlist(JSON.parse(savedS));
      const savedR = localStorage.getItem("paths-research");
      if (savedR) setResearch(JSON.parse(savedR));
      setMeetingBooked(localStorage.getItem("meeting-booked") === "true");

      // ציוני העניין משלב 3 — מה שכלי עיבוד החוויה שמר לכל תחום
      const interest: Partial<Record<Domain, number>> = {};
      (Object.keys(DOMAIN_LABEL) as Domain[]).forEach(d => {
        try {
          const raw = localStorage.getItem(`${d}-experience`);
          if (!raw) return;
          const score = JSON.parse(raw)?.interest_scale;
          if (typeof score === "number") interest[d] = score;
        } catch { /* ignore */ }
      });
      setDomainInterest(interest);

      const savedChoice = localStorage.getItem("paths-domain-choice");
      if (savedChoice === "one" || savedChoice === "two" || savedChoice === "open") setDomainChoice(savedChoice);
      const savedDomain = localStorage.getItem("paths-domain") as Domain | null;
      if (savedDomain) setChosenDomain(savedDomain);
      const savedPhase = localStorage.getItem("paths-phase") as Phase | null;
      if (savedPhase) setPhase(savedPhase);
    } catch { /* ignore */ }
  }, []);

  const recommended = recommendTrack(answers);
  const reason = buildReason(answers, recommended);
  const allAnswered = QUIZ_QUESTIONS.every(q => answers[q.key]);

  function answer(key: keyof QuizAnswers, val: string) {
    const next = { ...answers, [key]: val };
    setAnswers(next);
    localStorage.setItem("paths-quiz", JSON.stringify(next));
    if (qIndex < QUIZ_QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
      // איזו שאלה מאבדת אנשים — ברזולוציה של שאלה בודדת
      trackEvent("paths_question", { answered: qIndex + 1 });
      logEvent("paths_question", { answered: String(qIndex + 1) });
    } else {
      const rec = recommendTrack(next);
      setActiveTrack(rec);
      setPhase("result");
      localStorage.setItem("paths-phase", "result");
      trackEvent("paths_phase", { phase: "result" });
      trackEvent("paths_recommendation", { track: rec });
      // שיקוף לסופאבייס — מהיום מועמד שמחליף טלפון לא מאבד את התשובות
      savePathsAnswers({ answers: next as unknown as Record<string, string>, recommendation: rec });
      logEvent("paths_quiz_done", { recommendation: rec });
    }
  }

  function addToShortlist(item: ShortlistItem) {
    if (shortlist.length >= 3 || shortlist.find(s => s.name === item.name)) return;
    const next = [...shortlist, item];
    setShortlist(next);
    localStorage.setItem("paths-shortlist", JSON.stringify(next));
  }

  function removeFromShortlist(name: string) {
    const next = shortlist.filter(s => s.name !== name);
    setShortlist(next);
    localStorage.setItem("paths-shortlist", JSON.stringify(next));
  }

  function goToPhase(p: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(p);
    localStorage.setItem("paths-phase", p);
    // מודדים את המשפך כדי לדעת איפה באמת נוטשים, לא לנחש
    trackEvent("paths_phase", { phase: p });
  }

  const PHASE_ORDER: Phase[] = ["intro", "quiz", "result", "routes", "blockers", "institutions", "prep", "research", "done"];
  const phaseIndex = PHASE_ORDER.indexOf(phase);

  /**
   * התחומים שמוצגים בצירים.
   * מדורגים לפי עניין ולא לפי מסוגלות — דירוג לפי מסוגלות היה מסתיר
   * מהמשתמש בדיוק את התחום שהוא הכי רוצה, כי אצל דור ראשון להשכלה גבוהה
   * תחושת המסוגלות נמוכה באופן שיטתי ולא מוצדק.
   */
  const topDomains: { id: Domain; interest: number }[] = (() => {
    if (domainChoice === "one" && chosenDomain) {
      return [{ id: chosenDomain, interest: domainInterest[chosenDomain] ?? 0 }];
    }
    const scored = (Object.keys(DOMAIN_LABEL) as Domain[])
      .filter(d => domainInterest[d] !== undefined)
      .map(d => ({ id: d, interest: domainInterest[d] ?? 0 }))
      .sort((a, b) => b.interest - a.interest);
    return scored.slice(0, domainChoice === "two" ? 2 : 3);
  })();

  /** התחום המוצג — הנבחר, או המעניין ביותר כברירת מחדל */
  const shown = topDomains.find(d => d.id === activeDomain) ?? topDomains[0] ?? null;

  /** התחומים שמנחים את שכבת ההצעות: הנבחר אם יש, אחרת המובילים מהחקר */
  const chosenDomains: Domain[] = chosenDomain
    ? [chosenDomain]
    : topDomains.slice(0, 3).map(d => d.id);

  const Header = (
    <div className="text-white px-[22px] pt-[26px] pb-[30px] shrink-0" style={{ background: NAVY }}>
      <div className="max-w-[720px] mx-auto">
        <Link href="/dashboard" className="text-[12px] font-bold block mb-5" style={{ opacity: 0.6 }}>← חזרה למסע</Link>
        <div className="text-[28px] leading-tight" style={HEEBO}>מסלול לימודים</div>
        <div className="text-[13px] mt-[6px]" style={{ opacity: 0.72 }}>שלב 4 — בחירת הדרך שלך להייטק</div>
      </div>
    </div>
  );

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const STEPS = [
      { n: 1, title: "6 שאלות על החיים שלך", sub: "כמה זמן יש לך, כמה כסף, מה קורה בבית. שתי דקות" },
      { n: 2, title: "המסלול שמתאים לך", sub: "נגיד לך מה אנחנו ממליצים, ולמה דווקא זה" },
      { n: 3, title: "מה עומד בדרך — ומה פותר את זה", sub: "לכל חסם יש מענה. עם שם ועם תאריך" },
      { n: 4, title: "מוסדות ושאלות לפגישה", sub: "תבחר/י איפה לחקור, ותצא/י עם שאלות מוכנות לרכזת" },
    ];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.intro} phaseIndex={0} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          {/* Where you are in the journey */}
          <div
            className="rounded-2xl px-5 py-4 mb-5"
            style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.22)" }}
          >
            <div className="text-[12px] font-black mb-1.5" style={{ ...HEEBO, color: "#92400e" }}>
              איפה את/ה נמצא/ת עכשיו
            </div>
            <div className="text-[13px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.62)" }}>
              טעמת כמה תחומים. נפגשת עם הרכזת. יש לך כיוון.
              <br /><br />
              עד עכשיו שאלנו <span className="font-bold">מה מעניין אותך</span>.
              <br />
              עכשיו נשאל <span className="font-bold">איך לומדים את זה בפועל</span>.
            </div>
          </div>

          {/* The three tracks — teaser */}
          <div className="text-[19px] leading-tight mb-2" style={{ ...HEEBO, color: NAVY }}>
            שלוש דרכים להיכנס להייטק
          </div>
          <div className="text-[13px] leading-[1.8] mb-4" style={{ color: "rgba(0,0,0,0.55)" }}>
            אין מסלול אחד נכון. יש מסלול שמתאים לחיים שלך.
            <br />
            לזמן שיש לך. לכסף. למשפחה.
          </div>

          <div className="flex gap-2.5 mb-5">
            {TRACK_ORDER.map(t => (
              <div
                key={t}
                className="flex-1 rounded-2xl px-3 py-4 text-center"
                style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)", boxShadow: "0 2px 10px rgba(2,62,138,0.05)" }}
              >
                <div className="text-[24px] mb-1.5">{TRACK_META[t].emoji}</div>
                <div className="text-[11.5px] font-bold leading-tight mb-1" style={{ color: NAVY }}>
                  {TRACK_META[t].label}
                </div>
                <div className="text-[10.5px] leading-tight" style={{ color: "rgba(0,0,0,0.42)" }}>
                  {TRACK_META[t].duration}
                </div>
              </div>
            ))}
          </div>

          {/* What happens here */}
          <div
            className="rounded-2xl p-5 mb-5"
            style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)", boxShadow: "0 2px 12px rgba(2,62,138,0.06)" }}
          >
            <div className="text-[13px] font-black mb-4" style={{ ...HEEBO, color: NAVY }}>
              מה נעשה כאן — ארבעה צעדים
            </div>
            <div className="flex flex-col gap-3.5">
              {STEPS.map(s => (
                <div key={s.n} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                    style={{ background: ORANGE }}
                  >
                    {s.n}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>{s.title}</div>
                    <div className="text-[11.5px] mt-0.5 leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Honest framing */}
          <div
            className="rounded-2xl px-4 py-3.5 mb-6 flex items-start gap-3"
            style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}
          >
            <span className="text-[17px] shrink-0 mt-0.5">🤝</span>
            <div className="text-[12.5px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.6)" }}>
              זה לא מבחן. אין תשובות נכונות.
              <br />
              ככל שתענה/י בכנות, ההמלצה תהיה שווה יותר. ואפשר לשנות בכל רגע.
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => goToPhase("quiz")}
            className="block w-full py-4 text-center font-black text-[15px] text-white rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: ORANGE, ...HEEBO }}
          >
            {quizStarted ? "להמשיך מאיפה שעצרתי ←" : "בוא נתחיל — 6 שאלות ←"}
          </button>

          {allAnswered && (
            <button
              onClick={() => goToPhase("result")}
              className="block w-full py-3.5 mt-3 text-center font-bold text-[13.5px] rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}
            >
              כבר עניתי — לתוצאה שלי
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    const current = QUIZ_QUESTIONS[qIndex];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={`שאלה ${qIndex + 1} מתוך ${QUIZ_QUESTIONS.length}`} phaseIndex={qIndex + 1} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
            שאלה {qIndex + 1} מתוך {QUIZ_QUESTIONS.length}
          </div>
          <div className="text-[20px] leading-tight mb-4" style={{ ...HEEBO, color: NAVY }}>{current.q}</div>
          {current.note && (
            <div
              className="rounded-2xl px-4 py-3.5 mb-5 flex items-start gap-3"
              style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.2)" }}
            >
              <span className="text-[16px] shrink-0 mt-0.5">💡</span>
              <div className="text-[12px] leading-[1.7]" style={{ color: "#92400e" }}>{current.note}</div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {current.opts.map(opt => (
              <button
                key={opt.val}
                onClick={() => answer(current.key, opt.val)}
                className="w-full rounded-2xl px-5 py-4 text-right transition-all active:scale-[0.98]"
                style={{ background: "#fff", border: "1.5px solid rgba(2,62,138,0.1)", boxShadow: "0 2px 10px rgba(2,62,138,0.06)" }}
              >
                <div className="text-[14px] font-bold" style={{ color: NAVY }}>{opt.label}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>{opt.sub}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => (qIndex > 0 ? setQIndex(qIndex - 1) : goToPhase("intro"))}
            className="mt-6 text-[12px] font-bold"
            style={{ color: "rgba(0,0,0,0.35)" }}
          >
            {qIndex > 0 ? "↩ שאלה קודמת" : "↩ חזרה להסבר"}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === "result") {
    const meta = TRACK_META[recommended];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.result} phaseIndex={2} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          {/* Recommendation card */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.3)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#92400e" }}>המסלול המומלץ לך</div>
            <div className="text-[22px] mb-1" style={HEEBO}>{meta.emoji} {meta.label}</div>
            <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>{reason}</div>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-[11.5px] font-bold px-3 py-1 rounded-full" style={{ background: "rgba(251,133,0,0.15)", color: "#92400e" }}>⏱ {meta.duration}</span>
              <span className="text-[11.5px] font-bold px-3 py-1 rounded-full" style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>💰 {meta.cost}</span>
            </div>
            <div className="mt-2.5 text-[11.5px]" style={{ color: "rgba(0,0,0,0.45)" }}>תנאי קבלה: {meta.entry}</div>
          </div>

          {/* Bagrut gateway — the honest first step when the degree door is closed */}
          {answers.education === "A" && (
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "rgba(2,62,138,0.05)", border: "1.5px solid rgba(2,62,138,0.18)" }}
            >
              <div className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: NAVY }}>
                לפני שממשיכים — דלת שנראית סגורה ולא באמת סגורה
              </div>
              <div className="text-[16px] leading-tight mb-2" style={{ ...HEEBO, color: NAVY }}>
                אין בגרות מלאה? יש גשר לתואר
              </div>
              <div className="text-[12.5px] leading-[1.75] mb-3" style={{ color: "rgba(0,0,0,0.62)" }}>
                בלי בגרות מלאה התואר לא זמין לך <span className="font-bold">היום</span> — אבל זה לא אומר לוותר עליו.
                <span className="font-bold"> מכינה קדם-אקדמית</span> היא שנה אחת שסוגרת בדיוק את הפער הזה,
                ובחלק גדול מהמקרים היא מסובסדת מאוד או חינמית. אחריה נכנסים לתואר — לפעמים גם בלי פסיכומטרי.
              </div>
              <div className="rounded-xl p-3.5 mb-3" style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.12)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-[13px] font-black" style={{ color: NAVY }}>תוכנית יואל — בר-אילן</div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${ORANGE}18`, color: ORANGE }}>מכינה + מעטפת</span>
                </div>
                <div className="text-[11.5px] leading-[1.65] mb-2" style={{ color: "rgba(0,0,0,0.55)" }}>
                  המכינה המובילה בארץ ליוצאי אתיופיה. לא רק לימודים — תגבורים אישיים שבועיים, סדנאות מיומנויות,
                  מרכז למידה באנגלית, רכז/ת קבוצה צמוד/ה, ומלגה שמסייעת במגורים במעונות.
                  זו בדיוק המעטפת שמבדילה בין להתחיל לבין לסיים.
                </div>
                <a
                  href="https://mechina-kda.biu.ac.il/Ethiopian_immigrants_in_academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11.5px] font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}
                >
                  לאתר התוכנית ↗
                </a>
              </div>
              <div className="text-[12px] leading-[1.75] px-3.5 py-3 rounded-xl" style={{ background: "rgba(251,133,0,0.09)", color: "#92400e" }}>
                שנה של מכינה נשמעת כמו עיכוב. בפועל היא לרוב ההשקעה הכי משתלמת במסלול כולו —
                היא מחליפה תעודה שנתקעת בסינון בתעודה שפותחת דלתות. <span className="font-bold">תשאל/י על זה את הרכזת בפגישה.</span>
              </div>
            </div>
          )}

          {/* 3 path comparison */}
          <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>השוואת שלושת המסלולים</div>

          {TRACK_ORDER.map(track => {
            const m = TRACK_META[track];
            const isRec = track === recommended;
            return (
              <RevealCard key={track} emoji={m.emoji} title={`${m.label}${isRec ? " ✦ מומלץ לך" : ""}`}>
                <div className="pt-2">
                  {track === "mahat" && (
                    <div className="rounded-xl px-3.5 py-3 mb-3 text-[12px] leading-[1.7]"
                      style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.62)" }}>
                      <span className="font-bold">שווה לדעת לפני שקוראים:</span> מה״ט מתאים בעיקר לסוג קריירה מסוים —
                      גופים ביטחוניים וממשלתיים, חומרה ואלקטרוניקה. אם היעד שלך הוא חברת תוכנה או סטארטאפ,
                      תואר או הכשרה טכנולוגית כמעט תמיד יתאימו לך יותר.
                    </div>
                  )}
                  <div className="flex gap-3 mb-3 flex-wrap">
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: "rgba(0,0,0,0.05)" }}>⏱ {m.duration}</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: "rgba(0,0,0,0.05)" }}>💰 {m.cost}</span>
                  </div>
                  <div className="mb-3">
                    <div className="text-[11px] font-black mb-1.5" style={{ color: "#059669" }}>✅ יתרונות</div>
                    {m.pros.map((p, i) => <div key={i} className="text-[12px] mb-1">• {p}</div>)}
                  </div>
                  <div>
                    <div className="text-[11px] font-black mb-1.5" style={{ color: "#dc2626" }}>❌ חסרונות</div>
                    {m.cons.map((c, i) => <div key={i} className="text-[12px] mb-1">• {c}</div>)}
                  </div>
                </div>
              </RevealCard>
            );
          })}

          <button
            onClick={() => goToPhase("routes")}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black mt-2 active:scale-[0.98] transition-transform"
            style={{ background: NAVY, ...HEEBO }}
          >
            איך זה נראה בתחום שלי ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Routes to a first job ──────────────────────────────────────────────────
  if (phase === "routes") {
    const knownDomains = (Object.keys(DOMAIN_LABEL) as Domain[]).filter(d => domainInterest[d] !== undefined);

    function chooseDomain(c: "one" | "two" | "open", d?: Domain) {
      setDomainChoice(c);
      localStorage.setItem("paths-domain-choice", c);
      if (d) { setChosenDomain(d); localStorage.setItem("paths-domain", d); }
      else { setChosenDomain(null); localStorage.removeItem("paths-domain"); }
      trackEvent("paths_domain_choice", { choice: c });
    }

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.routes} phaseIndex={3} phaseTotal={8} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          <div className="text-[22px] leading-tight mb-2" style={{ ...HEEBO, color: NAVY }}>
            איך מגיעים למשרה ראשונה
          </div>
          <div className="text-[13px] leading-[1.8] mb-6" style={{ color: "rgba(0,0,0,0.55)" }}>
            לא כל דרך מגיעה לאותו מקום.
            <br />
            הנה איך זה נראה בפועל — מהיום ועד המשכורת הראשונה.
          </div>

          {/* One question, instead of guessing how settled he is */}
          {!domainChoice && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "#fff", border: "1.5px solid rgba(2,62,138,0.15)" }}>
              <div className="text-[16px] leading-tight mb-3" style={{ ...HEEBO, color: NAVY }}>
                יש לך כבר תחום שאת/ה די בטוח/ה בו?
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => chooseDomain("two")}
                  className="w-full rounded-xl px-4 py-3 text-right"
                  style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}
                >
                  <div className="text-[13px] font-bold" style={{ color: NAVY }}>מתלבט/ת בין שניים</div>
                </button>
                <button
                  onClick={() => chooseDomain("open")}
                  className="w-full rounded-xl px-4 py-3 text-right"
                  style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}
                >
                  <div className="text-[13px] font-bold" style={{ color: NAVY }}>עוד לא סגור/ה</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>נראה לך כמה אפשרויות</div>
                </button>
                {knownDomains.length > 0 && (
                  <>
                    <div className="text-[11.5px] font-bold mt-2 mb-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                      כן — והתחום הוא:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {knownDomains.map(d => (
                        <button
                          key={d}
                          onClick={() => chooseDomain("one", d)}
                          className="text-[12px] font-bold px-3 py-1.5 rounded-lg"
                          style={{ background: `${ORANGE}12`, color: "#92400e", border: `1px solid ${ORANGE}35` }}
                        >
                          {DOMAIN_LABEL[d]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Nobody explored anything — be honest instead of showing an empty screen */}
          {domainChoice && topDomains.length === 0 && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
              <div className="text-[15px] mb-2" style={{ ...HEEBO, color: "#92400e" }}>עוד לא טעמת אף תחום</div>
              <div className="text-[12.5px] leading-[1.8] mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
                בלי זה אנחנו לא יודעים מה מדליק אותך — וזה בדיוק מה שקובע איזה מסלול נכון.
                שווה לחזור לטעימות, זה לוקח כמה דקות לתחום.
              </div>
              <Link
                href="/explore"
                className="block w-full py-3 text-center text-white text-[14px] font-black rounded-xl"
                style={{ background: ORANGE, ...HEEBO }}
              >
                לטעימות ←
              </Link>
            </div>
          )}

          {/* One domain per section — comparison, or the open track's detail */}
          {openTrack ? (
            <TrackDetail
              domain={openTrack.domain}
              track={openTrack.track}
              onBack={() => setOpenTrack(null)}
              onInstitutions={() => { setActiveTrack(openTrack.track); goToPhase("institutions"); }}
            />
          ) : shown ? (
            <div className="mb-8 mx-auto w-full max-w-[390px] md:max-w-[640px]">
              {/* Switcher — one domain on screen at a time, the others a tap away */}
              {topDomains.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {topDomains.map(d => {
                    const on = d.id === shown.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => { setActiveDomain(d.id); trackEvent("paths_domain_switch", { domain: d.id }); }}
                        className="shrink-0 rounded-xl px-3 py-2 text-right transition-all"
                        style={{
                          background: on ? NAVY : "#fff",
                          border: `1px solid ${on ? NAVY : "rgba(0,0,0,0.12)"}`,
                        }}
                      >
                        <div className="text-[12.5px] font-black" style={{ color: on ? "#fff" : "rgba(0,0,0,0.6)" }}>
                          {DOMAIN_LABEL[d.id]}
                        </div>
                        <div className="flex gap-[3px] mt-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} style={{
                              width: 6, height: 6, borderRadius: 999,
                              background: n <= d.interest ? (on ? "#fff" : ORANGE) : (on ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.12)"),
                            }} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3 mb-3">
                <div className="text-[19px] font-black" style={{ color: "#1a1a1a" }}>
                  {DOMAIN_LABEL[shown.id]}
                </div>
                {shown.interest ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10.5px] font-bold" style={{ color: "#8a8177" }}>העניין שלך</span>
                    <div className="flex gap-[3px]">
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} style={{
                          width: 7, height: 7, borderRadius: 999,
                          background: n <= shown.interest ? ORANGE : "rgba(0,0,0,0.12)",
                        }} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* authored at 390; on desktop the whole block widens together so the
                  heading and the diagram stay on one measure */}
              <div>
                <AllPaths
                  domain={shown.id}
                  onSelect={t => { setOpenTrack({ domain: shown.id, track: t }); window.scrollTo({ top: 0, behavior: "smooth" }); trackEvent("paths_track_open", { domain: shown.id, track: t }); }}
                />
              </div>
            </div>
          ) : null}

          {topDomains.length > 1 && (
            <div className="rounded-2xl px-4 py-3.5 mb-5 flex items-start gap-3" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}>
              <span className="text-[17px] shrink-0 mt-0.5">💡</span>
              <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.6)" }}>
                שים/י לב לעניין שלך ולא רק למה שקצר וזול. <span className="font-bold">מה שמעניין אותך הוא מה שיחזיק אותך כשיהיה קשה</span> —
                וזה משפיע על הסיכוי לסיים יותר מכל דבר אחר.
              </div>
            </div>
          )}

          {domainChoice && !openTrack && (
            <>
              <button
                onClick={() => goToPhase("blockers")}
                className="w-full py-4 rounded-2xl text-white text-[15px] font-black active:scale-[0.98] transition-transform"
                style={{ background: NAVY, ...HEEBO }}
              >
                מה עומד בדרך שלי ←
              </button>
              <button
                onClick={() => { setDomainChoice(null); localStorage.removeItem("paths-domain-choice"); }}
                className="w-full mt-3 text-[12px] font-bold"
                style={{ color: "rgba(0,0,0,0.35)" }}
              >
                ↩ לשנות את התחומים
              </button>
            </>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Blockers ───────────────────────────────────────────────────────────────
  if (phase === "blockers") {
    const mine = BLOCKERS.filter(b => b.applies(answers));

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.blockers} phaseIndex={3} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          <div className="text-[22px] leading-tight mb-2" style={{ ...HEEBO, color: NAVY }}>
            מה עומד בדרך — ומה פותר את זה
          </div>
          <div className="text-[13px] leading-[1.8] mb-6" style={{ color: "rgba(0,0,0,0.58)" }}>
            אלה החסמים שסיפרת עליהם. לכל אחד יש מענה אמיתי — עם שם ועם תאריך.
            <br />
            מה שנשאר פתוח, תיקח/י לרכזת.
          </div>

          {mine.map((b, i) => (
            <div
              key={b.id}
              className="rounded-2xl p-5 mb-4"
              style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)", boxShadow: "0 2px 12px rgba(2,62,138,0.06)" }}
            >
              {/* What they said */}
              <div className="flex items-start gap-2.5 mb-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                >{i + 1}</div>
                <div
                  className="text-[13px] leading-[1.5] px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.5)" }}
                >
                  ״{b.said}״
                </div>
              </div>

              {/* Our answer */}
              <div className="text-[16px] leading-tight mb-2" style={{ ...HEEBO, color: NAVY }}>
                {b.heading}
              </div>
              <div className="text-[12.5px] leading-[1.75] mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
                {b.lead}
              </div>

              {/* Concrete solutions */}
              <div className="flex flex-col gap-3">
                {b.solutions.map(s => (
                  <div key={s.name} className="rounded-xl px-4 py-3" style={{ background: "rgba(251,133,0,0.05)", border: "1px solid rgba(251,133,0,0.15)" }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-[12.5px] font-black" style={{ color: "#92400e" }}>{s.name}</div>
                      {s.date && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                          style={{
                            background: isUrgent(s.date) ? ORANGE : "rgba(0,0,0,0.08)",
                            color: isUrgent(s.date) ? "#fff" : "rgba(0,0,0,0.5)",
                          }}
                        >
                          {whenText(s.date)}
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.6)" }}>{s.detail}</div>
                    {s.link && (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}
                      >
                        לפרטים ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Honest closing */}
          <div
            className="rounded-2xl px-4 py-4 mb-6 flex items-start gap-3"
            style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.1)" }}
          >
            <span className="text-[18px] shrink-0 mt-0.5">🤝</span>
            <div className="text-[12.5px] leading-[1.8]" style={{ color: "rgba(0,0,0,0.6)" }}>
              אף אחד לא מסדר את כל זה לבד. וגם לא צריך.
              <br />
              הרכזת עושה את זה כל יום — היא תדע לאיזו מלגה את/ה זכאי/ת ומה להגיש קודם.
              <span className="font-bold"> את/ה רק צריך/ה להגיע.</span>
            </div>
          </div>

          <button
            onClick={() => { setActiveTrack(recommended); goToPhase("institutions"); }}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black active:scale-[0.98] transition-transform"
            style={{ background: NAVY, ...HEEBO }}
          >
            עכשיו נבחר מוסדות ←
          </button>

          <button
            onClick={() => goToPhase("result")}
            className="w-full mt-3 text-[12px] font-bold"
            style={{ color: "rgba(0,0,0,0.35)" }}
          >
            ↩ חזרה למסלול המומלץ
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Institutions ───────────────────────────────────────────────────────────
  if (phase === "institutions") {
    const tracks: { key: Track; label: string; emoji: string }[] = [
      { key: "degree", label: "תואר", emoji: "🎓" },
      { key: "bootcamp", label: "הכשרה", emoji: "⚡" },
      { key: "mahat", label: "מה\"ט", emoji: "🏫" },
    ];
    const list = visibleByTrack(activeTrack);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.institutions} phaseIndex={4} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-5 pb-32">

          {/* Track tabs */}
          <div className="flex gap-2 mb-5">
            {tracks.map(t => {
              const isRec = t.key === recommended;
              const isActive = t.key === activeTrack;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTrack(t.key)}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                  style={{
                    background: isActive ? NAVY : "#fff",
                    color: isActive ? "#fff" : "rgba(0,0,0,0.55)",
                    border: isRec && !isActive ? `1.5px solid ${ORANGE}` : isActive ? "none" : "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {t.emoji} {t.label}{isRec ? " ✦" : ""}
                </button>
              );
            })}
          </div>

          {/* Scholarships banner */}
          <RevealCard emoji="💰" title="מימון — הרבה יותר זמין ממה שנדמה">
            <div className="pt-2">
              <div className="text-[12px] leading-[1.7] mb-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(251,133,0,0.09)", color: "#92400e" }}>
                כמעט אף אחד לא משלם את המחיר המלא. אלה התוכניות שקיימות ופעילות —
                הרכזת תעזור לך למפות למה את/ה זכאי/ת ולהגיש בזמן.
              </div>
              <ul className="list-none space-y-2.5">
                {[
                  { t: "מלגת מרום (מל״ג)", d: "ליוצאי אתיופיה שבארץ 15+ שנים או ילידי הארץ. מדעי המחשב נמצאים בקבוצת העדיפות העליונה. ההרשמה לתשפ״ז נפתחת ב-9 בספטמבר 2026 ונסגרת בתחילת נובמבר — אל תפספסו." },
                  { t: "המינהל לסטודנטים עולים", d: "למי שבארץ פחות מ-15 שנה: מימון שכר לימוד, שיעורי עזר, חונך אישי ומלגת קיום חודשית. זה המסלול המשלים למרום — לא מקבלים את שניהם." },
                  { t: "עתידים לתעשייה והייטק", d: "ההרשמה לתשפ״ז פתוחה, כ-150 מקומות. מלגת קיום חודשית, מחשב נייד, סיוע בשכר לימוד — והשמה בתעשייה כבר מהסמסטר השלישי. עדיפות לפריפריה ולקהילות מיוצגות-חסר." },
                  { t: "שוברים להכשרה מקצועית", d: "יוצאי אתיופיה נמצאים בקבוצת הזכאות הגבוהה ביותר — סבסוד של עד 90% מעלות הקורס, ועוד מענק השמה. נדרשת הפניה ממרכז הכוון או שירות התעסוקה." },
                  { t: "הישגים / אלומה", d: "ייעוץ והכוונה אישיים בחינם עוד לפני ההרשמה — בחירת מוסד, תנאי קבלה, פסיכומטרי ומימון. שימו לב: מרום דורשת ייעוץ דרכם." },
                  { t: "קרן חנן עינור", d: "מלגת שכר לימוד ליוצאי אתיופיה, כולל להנדסאים ולימודי תעודה, ללא חובת התנדבות. חלון ההגשה קצר — נובמבר." },
                  { t: "מלגות פנימיות של המוסד", d: "כמעט לכל מוסד יש מלגות משלו שלא מפורסמות טוב. תמיד לשאול ישירות במדור הרישום." },
                ].map((item, i) => (
                  <li key={i}>
                    <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{item.t}</div>
                    <div className="text-[11.5px] leading-[1.65] mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>{item.d}</div>
                  </li>
                ))}
              </ul>
              <div className="text-[11px] leading-[1.6] mt-3 pt-2.5" style={{ color: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                הסכומים והתנאים משתנים משנה לשנה. מה שכתוב כאן נועד לכוון אתכם לשאלות הנכונות —
                את המספרים המדויקים תקבלו מהרכזת ומאתרי התוכניות.
              </div>
            </div>
          </RevealCard>

          {/*
            שכבת ההצעות — לפני הקטלוג. הכלל: מה שלמעלה אנחנו יודעים להגיד
            למה; מה שבקיפול קיים ולא נבדק לעומק. בהכשרה ההצעה היא קורס
            עטוף (מוסד × מעטפת); בתואר — התואר עצמו, כי פער של 12,000 ₪
            בחודש עובר בין שני תארים שנשמעים אותו דבר.
          */}
          {activeTrack === "bootcamp" && <WrappedCourses domains={chosenDomains} />}
          {activeTrack === "degree" && <DegreePicker domains={chosenDomains} />}

          {/* Institution cards — הקטלוג */}
          <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>
            {activeTrack === "bootcamp" ? "עוד מוסדות והכשרות — בלי מעטפת שמיפינו" :
             activeTrack === "degree" ? "המוסדות — איפה לומדים את זה" :
             `מוסדות — ${TRACK_META[activeTrack].label}`}
          </div>
          <div className="flex flex-col gap-3 mb-5">
            {list.map(inst => {
              const inList = shortlist.find(s => s.name === inst.name);
              return (
                <div key={inst.name} className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.09)", boxShadow: "0 2px 10px rgba(2,62,138,0.05)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="text-[14px] font-black" style={{ color: NAVY }}>{inst.name}</div>
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${inst.tagColor}18`, color: inst.tagColor }}>{inst.tag}</span>
                  </div>
                  <div className="text-[12px] leading-[1.6] mb-3" style={{ color: "rgba(0,0,0,0.55)" }}>{inst.why}</div>
                  {inst.warn && (
                    <div
                      className="rounded-xl px-3.5 py-3 mb-3 flex items-start gap-2.5"
                      style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)" }}
                    >
                      <span className="text-[14px] shrink-0 mt-0.5">⚠️</span>
                      <div className="text-[11.5px] leading-[1.65]" style={{ color: "#991b1b" }}>{inst.warn}</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={inst.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11.5px] font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}
                    >
                      לאתר הרשמי ↗
                    </a>
                    <button
                      onClick={() => inList ? removeFromShortlist(inst.name) : addToShortlist({ name: inst.name, track: activeTrack })}
                      className="text-[11.5px] font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: inList ? `${ORANGE}18` : "rgba(0,0,0,0.04)",
                        color: inList ? ORANGE : "rgba(0,0,0,0.45)",
                        border: inList ? `1px solid ${ORANGE}40` : "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      {inList ? "✓ ברשימה שלי" : "+ הוסף לרשימה"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shortlist summary */}
          {shortlist.length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(251,133,0,0.06)", border: "1.5px solid rgba(251,133,0,0.25)" }}>
              <div className="text-[12px] font-black mb-2" style={{ color: "#92400e" }}>הרשימה שלי ({shortlist.length}/3)</div>
              <div className="flex flex-col gap-1.5">
                {shortlist.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.7)" }}>• {item.name}</span>
                    <button onClick={() => removeFromShortlist(item.name)} className="text-[11px]" style={{ color: "rgba(0,0,0,0.3)" }}>הסר</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => goToPhase("prep")}
            disabled={shortlist.length === 0}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black active:scale-[0.98] transition-all"
            style={{ background: shortlist.length > 0 ? NAVY : "rgba(0,0,0,0.15)", ...HEEBO, cursor: shortlist.length > 0 ? "pointer" : "not-allowed" }}
          >
            {shortlist.length > 0 ? "לשאלות לפגישה 3 ←" : "הוסף לפחות מוסד אחד לרשימה"}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Research kit ───────────────────────────────────────────────────────────
  if (phase === "research") {
    const all = TRACK_ORDER.flatMap(t => visibleByTrack(t));
    const picked = shortlist
      .map(s => all.find(i => i.name === s.name))
      .filter((i): i is NonNullable<typeof i> => Boolean(i));
    const doneCount = picked.filter(i => research[i.id]?.status === "done").length;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.research} phaseIndex={6} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          <div className="text-[22px] leading-tight mb-2" style={{ ...HEEBO, color: NAVY }}>ערכת החקר שלך</div>
          <div className="text-[12.5px] leading-[1.75] mb-5" style={{ color: "rgba(0,0,0,0.55)" }}>
            תתקשר/י, תיכנס/י ליום פתוח, ותסמן/י כאן מה גילית. אין חובה לעשות הכל —
            אפילו מוסד אחד משנה את הפגישה.
          </div>

          {/* The inoculation — the most important thing on this screen */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: NAVY }}>
            <div className="text-[13px] font-black mb-2 text-white">לפני שמתקשרים — משהו שחשוב לדעת</div>
            <div className="text-[12.5px] leading-[1.8]" style={{ color: "rgba(255,255,255,0.82)" }}>
              אם יגידו לך <span className="font-bold">״אתה לא עומד בתנאים״</span> — זו לא תשובה סופית,
              וזה לא אומר שנגמר. זה אומר שהמסלול <span className="font-bold">הישיר</span> סגור.
              יש מסלולי קבלה שהפקידים במדור הרישום פשוט לא מכירים — מכינות, סף מוזל לקהילה, ראויים לקידום.
              <br /><br />
              <span className="font-bold" style={{ color: "#ffd9a8" }}>
                תרשום/י בדיוק מה אמרו לך ותביא/י את זה לפגישה. זה מידע שימושי, לא דחייה.
              </span>
            </div>
          </div>

          {/* Opening line */}
          <div className="rounded-2xl p-4 mb-6" style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: NAVY }}>משפט פתיחה שאפשר להקריא</div>
            <div className="text-[12.5px] leading-[1.7] px-3.5 py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.035)", color: "rgba(0,0,0,0.7)" }}>
              ״שלום, אני מתעניין/ת בתואר במדעי המחשב ורוצה לברר <span className="font-bold">אילו מסלולי קבלה קיימים
              חוץ מהמסלול הרגיל</span> — ואם יש ליווי או מלגות לסטודנטים מהקהילה האתיופית.״
            </div>
            <div className="text-[11.5px] leading-[1.6] mt-2.5" style={{ color: "rgba(0,0,0,0.45)" }}>
              השאלה מנוסחת כך בכוונה — היא מזמינה תשובה רחבה במקום בדיקה אם את/ה עומד/ת בסף.
            </div>
          </div>

          {/* Per institution */}
          {picked.map(inst => {
            const e = research[inst.id] ?? { status: "todo" as const, answers: {}, note: "" };
            const dropped = e.status === "dropped";
            return (
              <div
                key={inst.id}
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: "#fff",
                  border: `1px solid ${e.status === "done" ? "rgba(5,150,105,0.3)" : "rgba(2,62,138,0.1)"}`,
                  opacity: dropped ? 0.55 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="text-[14.5px] font-black" style={{ color: NAVY, textDecoration: dropped ? "line-through" : "none" }}>
                    {inst.name}
                  </div>
                  {e.status === "done" && <span className="text-[11px] font-bold shrink-0" style={{ color: "#047857" }}>✓ בררתי</span>}
                  {dropped && <span className="text-[11px] font-bold shrink-0" style={{ color: "rgba(0,0,0,0.4)" }}>ירד מהרשימה</span>}
                </div>

                {/* Who to call — the right person, not the switchboard */}
                <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(2,62,138,0.04)" }}>
                  <div className="text-[11px] font-black mb-1.5" style={{ color: NAVY }}>למי לפנות</div>
                  {inst.contactRole || inst.contactName ? (
                    <>
                      <div className="text-[12.5px] font-bold" style={{ color: "rgba(0,0,0,0.72)" }}>
                        {inst.contactName ? `${inst.contactName} — ` : ""}{inst.contactRole}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {inst.contactPhone && (
                          <a href={`tel:${inst.contactPhone.replace(/-/g, "")}`}
                            className="text-[12px] font-black px-3 py-1.5 rounded-lg text-white" style={{ background: "#059669" }}>
                            📞 {inst.contactPhone}
                          </a>
                        )}
                        {inst.contactEmail && (
                          <a href={`mailto:${inst.contactEmail}`}
                            className="text-[11.5px] font-bold px-3 py-1.5 rounded-lg" style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>
                            ✉️ מייל
                          </a>
                        )}
                        <a href={inst.link} target="_blank" rel="noopener noreferrer"
                          className="text-[11.5px] font-bold px-3 py-1.5 rounded-lg" style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>
                          אתר ↗
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.5)" }}>
                      אין לנו עדיין איש קשר ישיר כאן. אפשר להתחיל מהאתר —
                      <span className="font-bold"> ולבקש מהרכזת בפגישה את המספר של יחידת התמיכה</span>, לא של מדור הרישום.
                      <div className="mt-2">
                        <a href={inst.link} target="_blank" rel="noopener noreferrer"
                          className="inline-block text-[11.5px] font-bold px-3 py-1.5 rounded-lg" style={{ background: "rgba(2,62,138,0.08)", color: NAVY }}>
                          לאתר המוסד ↗
                        </a>
                      </div>
                    </div>
                  )}
                  {inst.openDays && (
                    <div className="text-[12px] leading-[1.6] mt-2.5 px-3 py-2 rounded-lg" style={{ background: "rgba(251,133,0,0.1)", color: "#92400e" }}>
                      🗓 {inst.openDays}
                    </div>
                  )}
                </div>

                {/* Tap answers */}
                <div className="flex flex-col gap-2.5 mb-3">
                  {RESEARCH_QUESTIONS.map(rq => (
                    <div key={rq.id} className="flex items-center justify-between gap-2">
                      <span className="text-[12px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.65)" }}>{rq.q}</span>
                      <div className="flex gap-1 shrink-0">
                        {(Object.keys(ANSWER_META) as Answer[]).map(a => {
                          const on = e.answers[rq.id] === a;
                          const m = ANSWER_META[a];
                          return (
                            <button
                              key={a}
                              onClick={() => updateResearch(inst.id, { answers: { ...e.answers, [rq.id]: a } })}
                              className="text-[10.5px] font-bold px-2 py-1 rounded-lg transition-all"
                              style={{
                                background: on ? m.bg : "rgba(0,0,0,0.03)",
                                color: on ? m.color : "rgba(0,0,0,0.3)",
                                border: `1px solid ${on ? m.color + "50" : "rgba(0,0,0,0.07)"}`,
                              }}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <textarea
                  value={e.note}
                  onChange={ev => updateResearch(inst.id, { note: ev.target.value })}
                  placeholder="מה עוד שווה לזכור? מחיר, תאריכים, שם של מי שדיברת איתו…"
                  rows={2}
                  className="w-full text-[12.5px] leading-[1.6] px-3 py-2.5 rounded-xl mb-3"
                  style={{ border: "1px solid rgba(0,0,0,0.12)", resize: "vertical", fontFamily: "inherit", background: "#fff" }}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => updateResearch(inst.id, { status: e.status === "done" ? "todo" : "done" })}
                    className="flex-1 text-[12px] font-bold py-2 rounded-lg"
                    style={{ background: e.status === "done" ? "rgba(5,150,105,0.12)" : "rgba(2,62,138,0.06)", color: e.status === "done" ? "#047857" : NAVY }}
                  >
                    {e.status === "done" ? "✓ בררתי" : "סמן שבררתי"}
                  </button>
                  <button
                    onClick={() => updateResearch(inst.id, { status: dropped ? "todo" : "dropped" })}
                    className="text-[12px] font-bold py-2 px-3 rounded-lg"
                    style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.45)" }}
                  >
                    {dropped ? "החזר" : "ירד לי מהרשימה"}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Comparison — only once there is something to compare */}
          {doneCount >= 2 && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: "#fff", border: "1.5px solid rgba(2,62,138,0.18)" }}>
              <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>ההשוואה שלך</div>
              <div style={{ overflowX: "auto" }}>
                <table className="w-full text-[11.5px]" style={{ borderCollapse: "collapse", minWidth: "440px" }}>
                  <thead>
                    <tr>
                      <th className="text-right p-2 font-black" style={{ color: "rgba(0,0,0,0.4)" }}></th>
                      {picked.filter(i => research[i.id]?.status === "done").map(i => (
                        <th key={i.id} className="p-2 font-black text-center" style={{ color: NAVY }}>{i.name.split(" — ")[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RESEARCH_QUESTIONS.map(rq => (
                      <tr key={rq.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <td className="p-2 font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>{rq.q}</td>
                        {picked.filter(i => research[i.id]?.status === "done").map(i => {
                          const a = research[i.id]?.answers[rq.id];
                          return (
                            <td key={i.id} className="p-2 text-center font-bold"
                              style={{ color: a ? ANSWER_META[a].color : "rgba(0,0,0,0.2)" }}>
                              {a ? ANSWER_META[a].label : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              try {
                localStorage.setItem("paths-journey", JSON.stringify({ quiz: true, shortlist: true, prep: true, research: doneCount > 0 }));
              } catch { /* ignore */ }
              goToPhase("done");
            }}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black mb-3 active:scale-[0.98] transition-transform"
            style={{ background: NAVY, ...HEEBO }}
          >
            סיימתי — שמור הכל ←
          </button>

          <button onClick={() => goToPhase("prep")} className="w-full text-[12px] font-bold" style={{ color: "rgba(0,0,0,0.35)" }}>
            ↩ חזרה לשאלות לפגישה
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Prep ───────────────────────────────────────────────────────────────────
  if (phase === "prep") {
    const questions = generateQuestions(answers, shortlist, recommended);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.prep} phaseIndex={5} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          <div className="text-[22px] leading-tight mb-1" style={{ ...HEEBO, color: NAVY }}>שאלות לפגישה 3</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.45)" }}>נוצרו על פי התשובות שלך — הביאי אותן לפגישה עם הרכזת</div>

          {/* Shortlist recap */}
          <div className="rounded-xl px-4 py-3 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.1)" }}>
            <div className="text-[11px] font-black mb-1.5" style={{ color: NAVY }}>המוסדות שבחרת לחקור</div>
            {shortlist.map(s => (
              <div key={s.name} className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.65)" }}>• {s.name} ({TRACK_META[s.track].label})</div>
            ))}
          </div>

          {/* Questions */}
          <div className="flex flex-col gap-3 mb-7">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl px-4 py-3.5 flex items-start gap-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5" style={{ background: ORANGE }}>
                  {i + 1}
                </div>
                <span className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.75)" }}>{q}</span>
              </div>
            ))}
          </div>

          {/* ── Optional research mission ── */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(251,133,0,0.06)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
            <div className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: ORANGE }}>
              אופציונלי — אבל שווה הרבה
            </div>
            <div className="text-[17px] leading-tight mb-2" style={{ ...HEEBO, color: "#92400e" }}>
              רוצה להגיע לפגישה עם תשובות במקום שאלות?
            </div>
            <div className="text-[12.5px] leading-[1.75] mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
              אפשר לברר חלק מזה בעצמך — בטלפון, ביום פתוח או באירוע זום. זה לוקח כמה דקות לכל מוסד,
              ומי שעושה את זה מגיע לפגישה חזק בהרבה. <span className="font-bold">אפשר גם לדלג ולהמשיך — זה לא חובה.</span>
            </div>
            <button
              onClick={() => goToPhase("research")}
              className="w-full py-3.5 rounded-xl text-white text-[14px] font-black active:scale-[0.98] transition-transform"
              style={{ background: ORANGE, ...HEEBO }}
            >
              לערכת החקר ←
            </button>
          </div>

          <button
            onClick={() => {
              try {
                localStorage.setItem("paths-journey", JSON.stringify({ quiz: true, shortlist: true, prep: true }));
              } catch { /* ignore */ }
              goToPhase("done");
            }}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black mb-3 active:scale-[0.98] transition-transform"
            style={{ background: NAVY, ...HEEBO }}
          >
            סיימתי — שמור הכל ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Done — the summary the user returns to ─────────────────────────────────
  const myBlockers = BLOCKERS.filter(b => b.applies(answers));
  // מועדים שנופלים בקרוב — אלה לא מחכים לפגישה
  const urgent = myBlockers
    .flatMap(b => b.solutions.filter(s => s.date && isUrgent(s.date)).map(s => ({ ...s, from: b.said })))
    .slice(0, 3);
  const questions = generateQuestions(answers, shortlist, recommended);
  const researched = Object.values(research).filter(r => r.status === "done").length;

  function summaryText(): string {
    const L: string[] = ["הסיכום שלי משלב מסלולי הלימוד:", ""];
    L.push(`המסלול שהומלץ לי: ${TRACK_META[recommended].label}`);
    if (shortlist.length) L.push(`מוסדות שבחרתי לחקור: ${shortlist.map(s => s.name).join(" · ")}`);
    if (researched) L.push(`בררתי בעצמי מול ${researched} מוסדות`);
    if (myBlockers.length) L.push("", "מה שעומד בדרך שלי:", ...myBlockers.map(b => `• ${b.said}`));
    if (questions.length) L.push("", "שאלות שאני רוצה לשאול:", ...questions.map(q => `• ${q}`));
    return L.join("\n");
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {Header}
      <JourneyStrip current={4} phaseLabel={PHASE_LABEL.done} phaseIndex={7} phaseTotal={7} />
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-7 pb-32">

        {/* Achievement */}
        <div className="text-center mb-6">
          <div className="text-[52px] mb-2">🗺️</div>
          <div className="text-[22px] leading-tight mb-1.5" style={{ ...HEEBO, color: NAVY }}>יש לך מפה</div>
          <div className="text-[13px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.5)" }}>
            הגעת לכאן לבד. עכשיו יש לך כיוון, רשימה ושאלות.
          </div>
        </div>

        {/* The decision */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.25)" }}>
          <div className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: ORANGE }}>ההחלטה שלך</div>
          <div className="text-[18px] mb-1" style={HEEBO}>{TRACK_META[recommended].emoji} {TRACK_META[recommended].label}</div>
          {shortlist.length > 0 && (
            <div className="text-[12.5px] leading-[1.7] mt-2" style={{ color: "rgba(0,0,0,0.6)" }}>
              <span className="font-bold">המוסדות שבחרת:</span> {shortlist.map(s => s.name).join(" · ")}
            </div>
          )}
          {researched > 0 && (
            <div className="text-[12px] mt-2 font-bold" style={{ color: "#047857" }}>
              ✓ בררת בעצמך מול {researched} מוסדות — זה יורגש בפגישה
            </div>
          )}
        </div>

        {/* Before the meeting — deadlines do not wait */}
        {urgent.length > 0 && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", border: "1.5px solid rgba(220,38,38,0.28)" }}>
            <div className="text-[13px] font-black mb-1" style={{ color: "#b91c1c" }}>לפני הפגישה — זה לא מחכה</div>
            <div className="text-[12px] leading-[1.7] mb-3" style={{ color: "rgba(0,0,0,0.55)" }}>
              למועדים האלה יש תאריך. אם הם ייסגרו לפני שנפגשתם, הם ייסגרו.
            </div>
            <div className="flex flex-col gap-2.5">
              {urgent.map(s => (
                <div key={s.name} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{s.name}</div>
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-bold" style={{ color: ORANGE }}>לפרטים ↗</a>
                    )}
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 rounded-full shrink-0 text-white whitespace-nowrap" style={{ background: "#dc2626" }}>
                    {whenText(s.date!)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* At the meeting */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)" }}>
          <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>מה תיקח/י לפגישה</div>
          <div className="flex flex-col gap-2">
            {[
              `ההמלצה: ${TRACK_META[recommended].label}`,
              shortlist.length ? `${shortlist.length} מוסדות לבדוק לעומק` : "רשימת מוסדות פתוחה",
              `${questions.length} שאלות מוכנות`,
              myBlockers.length ? `${myBlockers.length} חסמים שכבר מיפית` : "",
            ].filter(Boolean).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: ORANGE }}>✓</span>
                <span className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.68)" }}>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={copySummary}
            className="w-full mt-4 py-2.5 text-[12.5px] font-bold rounded-xl"
            style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}
          >
            {copied ? "✓ הועתק — אפשר לשלוח לרכזת" : "העתקת הסיכום לשליחה לרכזת"}
          </button>
        </div>

        {/* State-aware CTA */}
        {meetingBooked ? (
          <>
            <div className="rounded-2xl p-5 mb-3 text-center" style={{ background: "rgba(5,150,105,0.07)", border: "1.5px solid rgba(5,150,105,0.25)" }}>
              <div className="text-[15px] mb-1" style={{ ...HEEBO, color: "#047857" }}>✓ הפגישה שלך כבר קבועה</div>
              <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.55)" }}>
                כל מה שנשאר הוא להגיע עם מה שהכנת כאן.
              </div>
            </div>
            {/* הגשר לשלב 5 — רק אחרי שהמסלול ננעל בפגישה, כדי שלא ייכנס
                ללוגיסטיקה של מסלול שעוד לא נבחר */}
            <Link
              href="/plan"
              className="block w-full py-4 text-center text-white text-[15px] font-black rounded-2xl mb-2.5 active:scale-[0.98] transition-transform"
              style={{ background: ORANGE, ...HEEBO }}
            >
              נעלת מסלול? להתחיל לסדר את הדרך אליו ←
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/contact"
              className="block w-full py-4 text-center text-white text-[15px] font-black rounded-2xl mb-2.5 active:scale-[0.98] transition-transform"
              style={{ background: ORANGE, ...HEEBO }}
            >
              לקביעת הפגישה עם הרכזת ←
            </Link>
            <div className="text-[11.5px] text-center mb-4" style={{ color: "rgba(0,0,0,0.4)" }}>
              את/ה לא מחליט/ה על תואר עכשיו. רק קובע/ת שיחה.
            </div>
          </>
        )}

        {/* The honest exit for whoever is not ready */}
        {!meetingBooked && (
          <>
            {!thinking ? (
              <button
                onClick={() => setThinking(true)}
                className="w-full py-3 text-center text-[13px] font-bold rounded-2xl mb-3"
                style={{ background: "rgba(2,62,138,0.05)", color: NAVY }}
              >
                אני צריך/ה לחשוב על זה
              </button>
            ) : (
              <div className="rounded-2xl p-5 mb-3" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.12)" }}>
                <div className="text-[15px] mb-2" style={{ ...HEEBO, color: NAVY }}>זה בסדר גמור.</div>
                <div className="text-[12.5px] leading-[1.8] mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
                  זו החלטה גדולה ואין שום סיבה לקבל אותה היום. שווה לישון על זה ולדבר בבית.
                  <br /><br />
                  הכל שמור — תוכל/י לחזור לכאן מתי שתרצה/י והכל יחכה בדיוק ככה.
                </div>
                <div className="text-[12px] leading-[1.75] px-3.5 py-3 rounded-xl" style={{ background: "rgba(251,133,0,0.09)", color: "#92400e" }}>
                  ורק שיהיה ברור — <span className="font-bold">פגישה היא לא התחייבות.</span> אפשר לקבוע, לשמוע,
                  ולהחליט אחר כך שזה לא הזמן. זה קורה, וזה לגיטימי.
                </div>
              </div>
            )}
          </>
        )}

        <button onClick={() => goToPhase("institutions")} className="w-full py-3 text-center text-[12.5px] font-bold rounded-2xl mb-2" style={{ background: "transparent", color: "rgba(0,0,0,0.4)" }}>
          לעדכן את הרשימה
        </button>
        <Link href="/dashboard" className="block w-full py-3 text-center text-[12.5px] font-bold rounded-2xl" style={{ color: "rgba(0,0,0,0.4)" }}>
          חזרה למסע
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── שכבת ההצעות ─────────────────────────────────────────────────────────────

/**
 * קורסים עטופים — ההצעה של מסלול ההכשרה.
 * כל קורס = מוסד × מעטפת, עם הסיבות במילים. מה שאין לו מעטפת נשאר בקטלוג
 * שמתחת — קיים, ומוסבר למה הוא שם.
 */
function WrappedCourses({ domains }: { domains: Domain[] }) {
  const courses = visibleCourses().filter(c =>
    domains.length === 0 || c.domains.some(d => domains.includes(d)));
  if (courses.length === 0) return null;

  const progName = (id?: string) => (id ? FUNDING.find(f => f.id === id)?.name : null);
  const progRel = (id?: string) => (id ? FUNDING.find(f => f.id === id)?.relationship : undefined);

  return (
    <div className="mb-6">
      <div className="text-[13px] font-black mb-1" style={{ color: NAVY }}>
        קורסים עם מעטפת — ההמלצות שלנו
      </div>
      <div className="text-[11.5px] mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>
        לכל אחד מהם יש גוף שמממן, מלווה או מתחייב להשמה — וכתוב בדיוק מה.
      </div>
      <div className="flex flex-col gap-3">
        {courses.map((c: Course) => (
          <a key={c.id} href={c.link} target="_blank" rel="noopener noreferrer"
            className="block rounded-2xl p-4 active:scale-[0.99] transition-transform"
            style={{ background: "#fff", border: "1.5px solid rgba(251,133,0,0.35)", boxShadow: "0 2px 10px rgba(251,133,0,0.08)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-[14px] font-black" style={{ color: NAVY }}>{c.name}</div>
              {progRel(c.programId) === "partner" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(5,150,105,0.1)", color: "#047857" }}>
                  ★ מכירים אותנו
                </span>
              )}
            </div>
            {progName(c.programId) && (
              <div className="text-[11.5px] font-bold mt-0.5" style={{ color: "#b45309" }}>
                המעטפת: {progName(c.programId)}
              </div>
            )}
            <div className="text-[12px] leading-[1.65] mt-1.5" style={{ color: "rgba(0,0,0,0.6)" }}>{c.what}</div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {c.cost && <Chip13 text={c.cost.split("—")[0].split("·")[0].trim()} color="#047857" />}
              {c.format && <Chip13 text={c.format.split("·")[0].trim()} color="#0369a1" />}
              {c.who && <Chip13 text={c.who.split("·")[0].trim()} color="#6b7280" />}
            </div>
            {c.catch && (
              <div className="text-[11px] leading-[1.6] mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(251,133,0,0.07)", color: "#92400e" }}>
                לדעת לפני: {c.catch}
              </div>
            )}
            <div className="text-[11.5px] font-bold mt-2.5" style={{ color: ORANGE }}>לדף הקורס ←</div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * בוחר התארים — ההצעה של מסלול האקדמיה.
 * ההחלטה האמיתית היא התואר, לא המוסד: פער של 12,000 ₪ בחודש עובר בין
 * תארים שנשמעים אותו דבר. הנתונים לאומיים (עבודאטה / משרד העבודה),
 * וההסתייגות הכנה מוצגת תמיד. המוסדות שמתחת הם הכתובת — לא ההחלטה.
 */
function DegreePicker({ domains }: { domains: Domain[] }) {
  const degrees = domains.length
    ? [...new Map(domains.flatMap(d => degreesFor(d)).map(d => [d.id, d])).values()]
    : [];
  if (degrees.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-[13px] font-black mb-1" style={{ color: NAVY }}>
        קודם בוחרים תואר — אחר כך מוסד
      </div>
      <div className="text-[11.5px] mb-3 leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
        שני תארים שנשמעים אותו דבר יכולים להוביל לשכר שונה ב-12,000 ₪ בחודש.
        אלה התארים שמובילים לתחום שלך, עם המספרים האמיתיים.
      </div>
      <div className="flex flex-col gap-3">
        {degrees.slice(0, 4).map((d: Degree) => {
          const bar = ENTRY_LABEL[d.entryBar];
          return (
            <div key={d.id} className="rounded-2xl p-4"
              style={{
                background: "#fff",
                border: d.recommended ? "1.5px solid rgba(251,133,0,0.4)" : "1px solid rgba(2,62,138,0.09)",
                boxShadow: "0 2px 10px rgba(2,62,138,0.05)",
              }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[14px] font-black" style={{ color: NAVY }}>{d.name}</span>
                  <span className="text-[10.5px] mr-1.5" style={{ color: "rgba(0,0,0,0.35)" }}>{d.kind}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${bar.color}14`, color: bar.color }}>
                  {bar.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {d.salary && <Stat13 label="שכר אחרי 5-6 שנים" value={`${d.salary.toLocaleString("he-IL")} ₪`} />}
                {d.employment && <Stat13 label="מועסקים" value={`${d.employment}%`} />}
                {d.inTech && <Stat13 label="מגיעים לטק" value={`${d.inTech}%`} strong={d.inTech >= 60} />}
              </div>

              <div className="text-[12px] leading-[1.65] mt-2" style={{ color: "rgba(0,0,0,0.6)" }}>
                <b>פותח:</b> {d.leadsTo}
              </div>
              {d.recommended && (
                <div className="text-[11.5px] leading-[1.65] mt-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(251,133,0,0.08)", color: "#92400e" }}>
                  ✦ {d.recommended}
                </div>
              )}
              <div className="text-[11px] leading-[1.6] mt-2" style={{ color: "rgba(0,0,0,0.45)" }}>
                בכנות: {d.caveat}
              </div>
              <div className="text-[11px] leading-[1.6] mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>
                <b>הכניסה:</b> {d.entryNote}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[11px] leading-[1.7] mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(2,62,138,0.04)", color: "rgba(0,0,0,0.5)" }}>
        הבחירה הסופית נעשית יחד עם הרכזת בפגישה — כאן המפה, לא ההחלטה.
        המוסדות שלמטה הם איפה לומדים את התארים האלה.
      </div>
    </div>
  );
}

function Chip13({ text, color }: { text: string; color: string }) {
  return (
    <span className="text-[10.5px] font-bold px-2 py-1 rounded-lg" style={{ background: `${color}12`, color }}>
      {text}
    </span>
  );
}

function Stat13({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>
      {label}: <b style={{ color: strong ? "#047857" : "#1c1a16", fontSize: 12.5 }}>{value}</b>
    </span>
  );
}
