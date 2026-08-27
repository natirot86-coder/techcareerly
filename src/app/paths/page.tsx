"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import MeetingCheckin from "@/components/ui/MeetingCheckin";
import { visibleByTrack, visibleFor, INSTITUTIONS } from "@/data/institutions";
import { track as trackEvent } from "@vercel/analytics";
import JourneyStrip from "@/components/ui/JourneyStrip";
import AllPaths from "@/components/ui/AllPaths";
import TrackDetail from "@/components/ui/TrackDetail";
import { DOMAIN_LABEL, type Domain } from "@/data/institutions";
import { savePathsAnswers, saveChosenDomains, logEvent } from "@/lib/candidate";
import { visibleCourses, type Course } from "@/data/courses";
import { degreesFor, ENTRY_LABEL, type Degree } from "@/data/degrees";
import { FUNDING } from "@/data/scholarships";
import dynamic from "next/dynamic";
import InstitutionCard from "@/components/ui/InstitutionCard";
const DegreeMap = dynamic(() => import("@/components/ui/DegreeMap"), {
  ssr: false,
  loading: () => <div style={{ height: 260, borderRadius: 12, background: "rgba(2,62,138,0.04)" }} />,
});
const PinMap = dynamic(() => import("@/components/ui/PinMap"), {
  ssr: false,
  loading: () => <div style={{ height: 420, borderRadius: 16, background: "rgba(2,62,138,0.04)" }} />,
});
import { regionsForAnswer } from "@/data/regions";

/** שם התת-שלב שמוצג בפס ההתקדמות */
const PHASE_LABEL: Record<string, string> = {
  domain: "בוחרים כיוון",
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

type Phase = "domain" | "intro" | "quiz" | "result" | "routes" | "blockers" | "institutions" | "prep" | "research" | "done";

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
type QuizAnswers = {
  time: string; budget: string; education: string; kids: string; when: string; timeline: string; location: string; aim: string;
  /**
   * מה יש לאדם ביד — רשימה מופרדת בפסיקים.
   *
   * החליפה שאלה של תשובה אחת ("בגרות מלאה?"), שהייתה גסה מדי: מי שיש לו
   * 5 יחידות מתמטיקה ופסיכומטרי ומי שיש לו בגרות עם 3 יחידות קיבלו בדיוק
   * אותה המלצה. תנאי הקבלה האמיתיים גרנולריים — 4 יח׳ בציון 80 או 5 יח׳
   * בציון 70 — ובלי זה המסך אומר "בגרות מלאה ✓" למי שאינו עומד בתנאים.
   *
   * **הציון בפסיכומטרי לא נשאל בכוונה.** מספר על מסך מזמין שיפוט עצמי,
   * ואצל מי שתחושת המסוגלות שלו כבר נמוכה זו נקודת הנטישה — וזה בדיוק
   * הפער שהארגון קיים בשבילו. מי שיש לו ציון יודע אותו, והרכזת תשאל.
   */
  has?: string;
};

/** מה שאפשר לסמן. הכל בניסוח חיובי — "מה יש לך", לא "מה חסר לך" */
const HAVE_CHIPS: { id: string; label: string }[] = [
  { id: "bagrut",  label: "בגרות מלאה" },
  { id: "math3",   label: "מתמטיקה 3 יח׳" },
  { id: "math4",   label: "מתמטיקה 4 יח׳" },
  { id: "math5",   label: "מתמטיקה 5 יח׳" },
  { id: "science", label: "פיזיקה או ביולוגיה מורחב" },
  { id: "english", label: "אנגלית 4–5 יח׳" },
  { id: "psycho",  label: "יש לי פסיכומטרי ואני מרוצה מהציון" },
  { id: "psycho-low", label: "יש לי פסיכומטרי ואני לא מרוצה מהציון" },
  { id: "degree",  label: "כבר יש לי תואר ראשון" },
];

const hasOf = (a: QuizAnswers) => (a.has ?? "").split(",").filter(Boolean);

/**
 * האם עומדים בתנאי הכניסה לתואר — נגזר מרמת החסם, בלי להמציא נתון חדש.
 * מחזיר את מה שחסר, כדי שאפשר יהיה לומר לו מה להשלים ולא רק "לא עומד".
 */
function missingFor(bar: "low" | "medium" | "high", have: string[]): string[] {
  const miss: string[] = [];
  if (!have.includes("bagrut") && !have.includes("degree")) miss.push("בגרות מלאה");
  const math = have.includes("math4") || have.includes("math5");
  if ((bar === "medium" || bar === "high") && !math) miss.push("מתמטיקה 4 יח׳ ומעלה");
  if (bar === "high" && !have.includes("psycho")) miss.push("פסיכומטרי");
  return miss;
}
type ShortlistItem = { name: string; track: Track };

// ─── Data ─────────────────────────────────────────────────────────────────────

type QuizQuestion = {
  key: keyof QuizAnswers;
  q: string;
  note?: string;
  /** בחירה מרובה — צ׳יפים במקום תשובה אחת */
  multi?: true;
  opts: { val: string; label: string; sub: string }[];
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: "time" as keyof QuizAnswers,
    q: "כמה שעות בשבוע את/ה יכול/ה להקדיש ללימודים?",
    note: "לספור גם את הלמידה העצמית, לא רק את השיעורים — ברוב המסלולים היא החלק הגדול.",
    opts: [
      { val: "A", label: "פחות מ-15 שעות", sub: "בין עבודה, משפחה וחיים" },
      { val: "B", label: "15–20 שעות", sub: "מספיק לשיעורים, בלי הרבה מרווח ללמידה עצמית" },
      { val: "C", label: "20+ שעות", sub: "גם שיעורים וגם למידה עצמית" },
    ],
  },
  {
    key: "budget" as keyof QuizAnswers,
    q: "כמה תוכל/י לשלם מהכיס, לשנה?",
    note: "רק על שכר לימוד. כמה זמן אפשר להחזיק בלי הכנסה — זו שאלה נפרדת בהמשך.",
    opts: [
      { val: "A", label: "כמעט כלום", sub: "גם כמה מאות שקלים זה מאמץ אמיתי" },
      { val: "B", label: "עד כמה אלפי שקלים", sub: "מספיק לקורס מסובסד, או לסגור את הפער שמלגה משאירה" },
      { val: "C", label: "עד שכר לימוד מלא — כ-12,000 ₪ לשנה", sub: "אפשר לממן תואר מתוקצב גם בלי מלגה" },
    ],
  },
  {
    key: "has" as keyof QuizAnswers,
    q: "מה יש לך ביד?",
    note: "אפשר לסמן כמה. לא סימנת כלום? גם זה בסדר גמור — יש מסלולים שמתחילים בדיוק מכאן, ונראה לך אותם.",
    multi: true,
    opts: [],
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
    key: "when" as keyof QuizAnswers,
    q: "מתי את/ה פנוי/ה ללמוד?",
    note: "זו לא שאלה על כמות שעות אלא על מתי הן. מוסד עם מסלול ערב ומוסד שלומדים בו בבוקר הם שתי אפשרויות שונות לגמרי, וזה גם מה שקובע אם אפשר להמשיך לעבוד.",
    opts: [
      { val: "A", label: "בעיקר בבוקר", sub: "אני פנוי/ה ביום — ואפשר ללמוד במסלול רגיל" },
      { val: "B", label: "רק בערב", sub: "אני עובד/ת ביום ולא יכול/ה להפסיק" },
      { val: "C", label: "גמיש/ה", sub: "אפשר לסדר את זה כך או כך" },
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
    key: "aim" as keyof QuizAnswers,
    q: "מה חשוב לך יותר?",
    note: "אין כאן תשובה נכונה. שתי הדרכים לגיטימיות, והן פשוט מובילות למקומות שונים.",
    opts: [
      { val: "A", label: "להתחיל לעבוד מוקדם ככל האפשר", sub: "גם אם קשת התפקידים בהתחלה צרה יותר" },
      { val: "B", label: "לפתוח את מגוון התפקידים והשכר", sub: "גם אם זה לוקח יותר זמן" },
      { val: "C", label: "עוד לא יודע/ת", sub: "וזה בסדר — נחזור לזה עם הרכזת" },
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
    cost: "מ-980 ₪ ועד כ-6,000 — וחלק חינם",
    entry: "מבחן מיון וראיון. בחלק מהמסלולים אפשר בלי בגרות מלאה",
    pros: [
      "טק-קריירה: עלות סמלית שנגבית מהפיקדון, עם מלגת קיום ומגורים — ו-88 אחוזי השמה, בוגרים בצ׳ק פוינט, Wix, אינטל ובזק",
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
    duration: "שנתיים ביום · שלוש בערב",
    cost: "כ-9,300–11,100 ₪ לשנה לפני מלגות (יסוד + נלווים)",
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
    cost: "12,203 ₪ לשנה לפני מלגות — מחיר מפוקח (תשפ״ז)",
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

/** תמונות אווירה למסלולים (נתי 27.8) — לא עדויות, ולכן בלי שמות */
const TRACK_PHOTO: Record<Track, string> = {
  degree: "/tracks/track-degree.jpeg",
  bootcamp: "/tracks/track-bootcamp.jpeg",
  mahat: "/tracks/track-mahat.jpeg",
};

/**
 * מסך התוצאה (1a — "רשת שוויונית עם כתר", handoff 24.8): שלושה כרטיסים
 * שווי-גודל, ההמלצה מסומנת בכתר במקומה הקבוע. התוכן verbatim מה-handoff
 * המאושר, למעט מחיר מה"ט שתוקן למאומת (9,300–11,100 — בעיצוב היה מספר
 * שלא נמצא לו מקור). בדיוק שלוש שורות השוואה — לא להוסיף.
 */
const RESULT_CARD: Record<Track, {
  emoji: string; label: string; tagA: string; tagB: string;
  income: string; cost: string; entry: string;
  plus: string; minus: string; fit: string;
  mini: { income: string; cost: string; entry: string };
}> = {
  degree: {
    emoji: "🎓", label: "תואר אקדמי", tagA: "3–4 שנים", tagB: "משרה מלאה",
    income: "משרת סטודנט מסוף שנה א׳",
    cost: "12,203 ₪ לפני מלגות (מחיר מפוקח) — ורוב המלגות בנויות סביבו",
    entry: "בגרות מלאה; יש מסלולים בלי פסיכומטרי",
    plus: "מעלה משמעותית את הסיכוי להיכנס להייטק עצמו — לחברות הטכנולוגיה, ולא רק לתפקידים טכנולוגיים בבנקים וארגונים אחרים",
    minus: "שלוש שנים בלי משכורת מלאה — אבל משרת סטודנט ומלגות סוגרות חלק גדול",
    fit: "מתאים למי שיכול להשקיע עכשיו — זו ההשקעה שמחזירה הכי הרבה לאורך זמן",
    mini: { income: "משרת סטודנט מסוף שנה א׳", cost: "12,203 ₪ לפני מלגות", entry: "בגרות מלאה" },
  },
  bootcamp: {
    emoji: "💻", label: "הכשרה טכנולוגית", tagA: "6–12 חודשים", tagB: "אינטנסיבי קצר",
    income: "ג'וניור מיד בסיום, והתחרות על המשרה הראשונה אמיתית",
    cost: "980–6,000 ₪ במסלולים שאנחנו מציגים",
    entry: "ברוב המסלולים בלי דרישות קדם",
    plus: "הדרך הקצרה ביותר למשרה ראשונה בהייטק",
    minus: "התחרות על המשרה הראשונה אמיתית — אבל ליווי השמה ותיק עבודות טוב מקטינים את הפער",
    fit: "מתאים למי שחייב להגיע מהר לשוק עכשיו — ותואר יכול לחכות ולהגיע אחר כך",
    mini: { income: "ג'וניור מיד בסיום", cost: "980–6,000 ₪", entry: "בלי דרישות קדם" },
  },
  mahat: {
    emoji: "⚙️", label: "הנדסאי (מה\"ט)", tagA: "שנתיים ביום · שלוש בערב", tagB: "משלב עבודה",
    income: "עבודה במקביל ללימודי ערב",
    cost: "כ-9,300–11,100 ₪ לפני מלגות, ולחיילים משוחררים האגף מממן 90%",
    entry: "בגרות חלקית מספיקה, בלי פסיכומטרי",
    plus: "ממשיכים לעבוד ולהתפרנס לאורך כל הלימודים",
    minus: "מוכר פחות מתואר אקדמי אצל חלק מהמעסיקים — אבל אפשר להשלים ממנו לתואר בהמשך",
    // המסגור הקבוע של מה"ט (11.8) חי כאן: קריירה ביטחונית/ממשלתית/חומרה
    fit: "מתאים למי שמכוון לקריירה ביטחונית, ממשלתית או לחומרה — וחייב הכנסה שוטפת בקצב יציב",
    mini: { income: "עבודה במקביל ללימודים", cost: "9,300–11,100 ₪ לפני מלגות", entry: "בגרות חלקית" },
  },
};

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

type Solution = { name: string; detail: string; link?: string; date?: AnnualDate; group?: string };
type Blocker = {
  id: string;
  applies: (q: QuizAnswers) => boolean;
  said: string;      // בלשון המשתמש
  heading: string;   // מה שאנחנו אומרים בחזרה
  lead: string;
  /** שורת אמת שמופיעה לפני הפתרונות — כשהמציאות מחייבת סיוג */
  truth?: string;
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
      { name: "מכינה קדם-אקדמית במימון מלא — האגף לחיילים משוחררים", detail: "שכר לימוד מלא + דמי קיום למכינה שסוגרת את פער הבגרות — לא יורד מהפיקדון, ויוצאי אתיופיה באוכלוסיות המועדפות. תנאי: 80 אחוז נוכחות. ואם הזכאות נגמרת באמצע — ממשיכים לממן עד סוף המכינה.", link: "https://www.hachvana.mod.gov.il/MainEducation/TwelveYearsStudies/Pages/PreAcademic.aspx" },
      { name: "מכינת בראודה — כמעט חינם, ופטור מפסיכומטרי ב-85+", detail: "כל הרשמה היא גם בקשת מלגה (משרד החינוך + הקרן), ובוגרים בממוצע 85+ מתקבלים לתואר הנדסי בלי פסיכומטרי. יש גם מסלול מואץ של 4.5 חודשים.", link: "https://w3.braude.ac.il/department/mechina/" },
      { name: "מלגת פריפריה — האגף לחיילים משוחררים (ייעוד 44)", detail: "שכר לימוד מלא לשנה א׳ למשוחררים שלומדים באזור עדיפות לאומית, בלי שום שעות התנדבות. שימו לב: לא נרשמים — המוסד מדווח עליכם, ואתם רק חותמים על כתב התחייבות באזור האישי. בלי החתימה לא משולם כלום.", link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/Perypheria44.aspx", date: { m: 8, d: 15, label: "החתימה נסגרת" } },
      { name: "עתידים לתעשייה והייטק", detail: "המעטפת הגדולה ביותר שמצאנו — כ-77,000 ₪ לאורך התואר: שכר לימוד מדורג, מלגת קיום חודשית ומחשב. להנדסה, מדעי המחשב ופיזיקה בממוצע 75 ומעלה, עם עדיפות מפורשת לבני הקהילה ולפריפריה. רק כ-150 מתקבלים.", link: "https://www.atidimtaasya.com/", date: { m: 8, d: 31, label: "ההגשה נסגרת" } },
      { name: "מושל (Moshal)", detail: "שכר לימוד מלא ועוד דמי קיום של 58,500 עד 78,000 ₪ לכל התואר, עם ליווי קריירה ואנגלית עסקית. לדור ראשון להשכלה גבוהה בשנה א׳. הקריטריון כלכלי ולא עדתי — ומאשרת במפורש הגשה במקביל לכל מלגה אחרת.", link: "https://moshalprogram.org.il/candidates/", date: { m: 9, d: 10, label: "ההגשה נסגרת" } },
      { name: "מלגת מרום", detail: "ייעודית ליוצאי אתיופיה, והייטק מדורג אצלה גבוה. מתשפ״ז בוטלה חובת ההתנדבות — במפורש כדי לאפשר לצבור אותה יחד עם פר״ח. הסכום והתנאים לתשפ״ז יפורסמו רק בספטמבר.", link: "https://che.org.il/scholarships/marom/", date: { m: 9, d: 9, label: "ההרשמה נפתחת", closeM: 11, closeD: 10 } },
      { name: "מלגת פר״ח", detail: "כ-7,000 ₪ במזומן תמורת 100 שעות חונכות, ופתוחה גם ללומדים בבתי ספר להנדסאים. אפשר לצבור עם מרום. חשוב: זה כל הקודם זוכה — כדאי להירשם ביום שהיא נפתחת.", link: "https://www.perach.org.il/", date: { m: 9, d: 3, label: "ההרשמה נפתחת" } },
      { name: "מלגת פריפריה לבוגרי מכינה (ייעוד 46)", detail: "עד 50% שכר לימוד לשלוש שנות התואר, לבוגרי מכינה קדם-אקדמית ממומנת שמתגוררים באזור עדיפות. אפשר לקבל רק מלגת פריפריה אחת — או 44 או 46.", link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/Perypheria46.aspx", date: { m: 8, d: 3, label: "ההגשה נפתחה", closeM: 10, closeD: 31 } },
      { name: "קרן גרוס", detail: "עד 10,000 ₪ בשנה למשוחררים עד חמש שנים, ויוצאי אתיופיה מצוינים אצלה כאוכלוסיית יעד. שימו לב: היא לא מתאפשרת יחד עם מלגה אחרת מעל 5,000 ₪ — זו בחירה, לא תוספת.", link: "https://www.gruss.org.il/blank", date: { m: 9, d: 15, label: "ההגשה נפתחת", closeM: 12, closeD: 15 } },
      { name: "קרן חנן עינור", detail: "2,000 עד 7,000 ₪ ליוצאי אתיופיה, בלי התנדבות. חשוב במיוחד: היא מכסה גם לימודי הנדסאי ולימודי תעודה, ולא רק תואר.", date: { m: 11, d: 1, label: "חלון ההגשה נפתח", closeM: 11, closeD: 22 } },
      { name: "האגף לחיילים משוחררים — מסלול הנדסאים", detail: "90% משכר הלימוד ללימודי הנדסאי וטכנאי, כולל מכינה. נרשמים דרך המכללה לאורך כל השנה, בלי טופס נפרד. שנה ג׳ אינה ממומנת.", link: "https://www.hachvana.mod.gov.il/MainEducation/PracticalEngineer/Pages/PracticalEngScholarship.aspx" },
      { name: "הישגים (אלומה)", detail: "לא מלגה אלא ייעוץ וליווי אישיים בחינם — בחירת מוסד, תנאי קבלה, פסיכומטרי ומימון. ערוץ טוב להתחיל בו כשלא ברור מאיפה מתחילים.", link: "https://hesegim.org.il/" },
    ],
  },
  {
    id: "money",
    applies: q => q.budget === "A" || q.budget === "B",
    said: "בלי מלגה זה לא מציאותי עבורי",
    heading: "כמעט אף אחד לא משלם את המחיר המלא",
    lead: "יש הרבה יותר כסף לתארים מאשר לקורסים. הרבה יותר. וחלק מהמלגות אפשר לצבור יחד — מרום ופר״ח למשל תוכננו במפורש להשתלב. חילקנו לפי מסלול — כדי שתראה/י ישר את מה שרלוונטי לכיוון שלך.",
    solutions: [
      { group: "לתואר", name: "מלגת מרום", detail: "ליוצאי אתיופיה שבארץ 15+ שנים או ילידי הארץ. מדעי המחשב נמצאים בקבוצת העדיפות העליונה שלה. מתשפ״ז בוטלה חובת ההתנדבות — אפשר לצבור אותה יחד עם מלגות אחרות.", link: "https://che.org.il/scholarships/marom/", date: { m: 9, d: 9, label: "ההרשמה נפתחת", closeM: 11, closeD: 10 } },
      { group: "לתואר", name: "עתידים לתעשייה והייטק", detail: "מלגת קיום חודשית, מחשב נייד, סיוע בשכר לימוד — והשמה בתעשייה כבר מהסמסטר השלישי. עדיפות לפריפריה ולקהילות מיוצגות-חסר. ההרשמה פתוחה.", link: "https://www.atidimtaasya.com/" },
      { group: "לתואר", name: "המינהל לסטודנטים עולים", detail: "למי שבארץ פחות מ-15 שנה: מימון שכר לימוד, שיעורי עזר, חונך אישי ומלגת קיום חודשית. זה המסלול המשלים למרום — לא מקבלים את שניהם.", date: { m: 11, d: 1, label: "מועד לסמסטר א׳" } },
      { group: "להכשרה מקצועית", name: "שוברים להכשרה מקצועית", detail: "יוצאי אתיופיה נמצאים בקבוצת הזכאות הגבוהה ביותר — סבסוד של עד 90% מעלות הקורס ועוד מענק השמה. נדרשת הפניה ממרכז הכוון או שירות התעסוקה.", link: "https://www.gov.il/he/service/vouchers-for-professional-training" },
      { group: "להנדסאים (מה״ט)", name: "האגף לחיילים משוחררים", detail: "אם שירתת ואת/ה שוקל/ת מסלול הנדסאי — האגף מממן 90% משכר הלימוד במכללות שמה״ט מכיר. עד 5 שנים מהשחרור, ועד 10 שנים לחיילים בודדים ולמשרתי מילואים פעילים.", link: "https://www.hachvana.mod.gov.il/MainEducation/PracticalEngineer/Pages/PracticalEngScholarship.aspx" },
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
    applies: q => q.time === "A" || q.kids === "A" || q.when === "B",
    said: "הזמן שלי מוגבל מאוד",
    heading: "יש מסגרות שנבנו בדיוק סביב זה",
    lead: "לא כל תואר דורש חמישה ימים בקמפוס. יש תוכניות פרונטליות שמכוונות למי שעובד או מגדל ילדים.",
    /* אמת לפני פתרונות (נתי 27.8): מתחת ל-15 שעות אין מסלול שבאמת נכנס.
       לתת המלצה כאילו כן — זו הרגעה במקום חשבון. */
    truth: "אם יש לך פחות מ-15 שעות פנויות בשבוע — כדאי לדעת שזה מתחת למה שכל המסלולים דורשים בפועל, כולל הלמידה העצמית. זה לא אומר שאי אפשר: זה אומר שכדאי לדבר עם הרכזת על מה אפשר לשנות, או להתחיל מהכנה קצרה במקום ממסלול מלא.",
    solutions: [
      { name: "מכללת ספיר", detail: "לימודים בשלושה ימים בלבד — א׳, ב׳, ג׳. השילוב הטוב ביותר שמצאנו למי שעובד במקביל.", link: "https://www.sapir.ac.il/ba/computer_science" },
      { name: "HIT חולון", detail: "לימודי אחר הצהריים וערב. שימו לב — מעל גיל 30 נדרשת מכינה.", link: "https://www.hit.ac.il" },
      { name: "מסלולי מה״ט משולבים", detail: "אורט (סינגלובסקי, בראודה), רופין הטכנולוגית והמכללה הטכנולוגית באר שבע מפעילים הנדסאי בערב — 2–3 ערבים בשבוע ולרוב גם שישי בבוקר, שלוש שנים במקום שנתיים. אותן שעות לימוד בדיוק, רק פרוסות אחרת. (סמי שמעון ו-HIT הם מוסדות אקדמיים ואינם מפעילים מה\"ט — אומת 27.8.)" },
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
      {
        name: "מלגת פריפריה 45 — שנה א׳ במימון מלא",
        detail:
          "כל שכר הלימוד של שנה ראשונה (כ-12,200 ₪; בדף האגף עדיין רשומה התקרה הקודמת 12,017). הזכאות נקבעת לפי **כתובת המגורים שלך** — חמש מתוך שש השנים שלפני תחילת הלימודים באזור עדיפות לאומית, ולא לפי איפה תלמד. **זו שאלה אחת לרכזת: האם היישוב שלך ברשימה.** שים/י לב: אין כפל בין 44, 45 ו-46 — מממשים אחת.",
        link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/Perypheria45.aspx",
        date: { m: 10, d: 31, label: "ההגשה נסגרת" },
      },
      {
        name: "ייעוד 44 — לומדים בפריפריה",
        detail:
          "אותו סכום, **וכלל הפוך**: כאן קובע איפה **המוסד** נמצא, לא איפה אתה גר. לכן מי שגר במרכז ולומד בבאר שבע יכול להיות זכאי לזו ולא לאחרת. **לא נרשמים אליה** — המוסד מדווח ואתה רק חותם באזור האישי.",
        link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/Perypheria44.aspx",
        date: { m: 8, d: 15, label: "החתימה נסגרת" },
      },
      { name: "אוניברסיטת חיפה", detail: "לצפון — הסף הייעודי הנמוך בארץ לקהילה, והמעטפת המפותחת ביותר שנמצאה.", link: "https://dekanat.haifa.ac.il/" },
    ],
  },
  {
    id: "psychometric",
    /*
     * קודם הוא נורה לכל מי שיש לו בגרות — גם למי שיש לו פסיכומטרי
     * מצוין. עכשיו הוא נורה בדיוק למי שאין לו, או שאמר שאינו מרוצה מהציון.
     * "מרוצה" הוא הערכה עצמית ולא מספר, וזה הנכון כאן: מי שמרגיש
     * שהציון שלו לא מספיק צריך לראות מסלולים חלופיים בלי קשר למספר.
     */
    applies: q => {
      const h = (q.has ?? "").split(",").filter(Boolean);
      return q.education !== "A" && (!h.includes("psycho") || h.includes("psycho-low"));
    },
    said: "הפסיכומטרי",
    heading: "יש היום יותר דרכים לעקוף אותו מאי פעם",
    lead: "הפסיכומטרי כבר לא השער היחיד. אלה מסלולים אמיתיים שקיימים היום — רובם לא מוכרים מספיק.",
    solutions: [
      { name: "סף ייעודי לקהילה", detail: "באוניברסיטת חיפה: פסיכומטרי 400 בתוספת ראיון אישי — הסף הנמוך בארץ. בבן-גוריון, תוכנית סיקט שוקלת ציון של עד 100 נקודות מתחת לסף הרגיל.", link: "https://dekanat.haifa.ac.il/student-services/academic-excellence/students-from-the-ethiopian-community/" },
      { name: "מכינת חיפה — אפיק מעבר בלי פסיכומטרי בכלל", detail: "בוגרי המכינה האוניברסיטאית בחיפה מתקבלים לתואר לפי ממוצע המכינה — בלי מבחן פסיכומטרי (קמפוס חיפה, לפי ספים לכל חוג). לוחמים פטורים משכר הלימוד של המכינה.", link: "https://mechina.haifa.ac.il/" },
      { name: "הפסיכומטרי של המדינה — קורס הכנה חינם", detail: "קורס מלא של המדינה בשיתוף מאל״ו (מחברת הבחינה): 3 חודשים, סימולציות אמיתיות, בחינם. מי שבכל זאת ניגש לפסיכומטרי — שלא ישלם אלפי שקלים על קורס.", link: "https://campus.gov.il/course/mse-gov-psychometry-he/" },
      { name: "קבלה על בסיס בגרות בלבד", detail: "אפקה, ספיר (ממוצע 95), אשקלון (ממוצע 95) ו-HIT (ממוצע 102) מקבלים בלי פסיכומטרי בכלל. שימו לב: בכולם יש תנאי מתמטיקה נלווה." },
      { name: "קרן אור — רייכמן", detail: "מדעי המחשב ללא פסיכומטרי, בלי צורך בציוני בגרות גבוהים, ובמימון כמעט מלא. הקריטריון הוא כלכלי-חברתי.", link: "https://www.runi.ac.il/admissions/undergraduate/scholarships/keren-or" },
      { name: "ראויים לקידום", detail: "האגודה קובעת ציון זכאות של עד 60 נקודות לפי אזור מגורים, בית ספר והשכלת ההורים — ומ-30 ומעלה כל אחת משש האוניברסיטאות נותנת הקלה משלה בתנאי הקבלה. הטיפול לוקח כחודשיים — צריך להגיש מוקדם.", link: "https://kidum-edu.org.il/reuim-lekidum/" },
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
// has אינו משקלל ישירות — education נגזר ממנו, והוא זה שמניע את הניקוד
const WEIGHTS: Partial<Record<keyof QuizAnswers, Record<string, Partial<Record<Track, number>>>>> = {
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
  /*
   * שעות פנויות בשבוע — כוילו מחדש 27.8 מול המציאות:
   * פחות מ-15 אינו מספיק לאף מסלול (ולכן כמעט לא מנקד — זה חסם, לא
   * העדפה); 15–20 הוא בדיוק הטווח של מה"ט משולב (14–21 מאומת) ושל
   * הכשרה היברידית; 20+ פותח את התואר ואת ההכשרה האינטנסיבית, שדורשת
   * דווקא הכי הרבה שעות — ההפך ממה שהמשקלים הישנים הניחו.
   */
  time: {
    A: { mahat: 1 },
    B: { mahat: 2, bootcamp: 1, degree: -1 },
    C: { degree: 2, bootcamp: 1 },
  },
  // תקציב — חסם רך יותר ממה שהוא נראה: תשתית המלגות לתארים היא הרחבה ביותר
  budget: {
    // "כמעט כלום" היה דוחף להכשרה — וזה הפוך מהמציאות:
    // שכר הלימוד המפוקח הוא 12,203 ₪ בתשפ״ז, וכל מערך המלגות בנוי סביב התואר
    A: { degree: 1 },
    B: { degree: 1, mahat: 1 },
    C: { degree: 2 },
  },
  kids: {
    A: { degree: -2, mahat: 1, bootcamp: 2 },
    C: { degree: 1 },
  },
  // מתי פנוי — לא כמה. "רק בערב" סוגר מוסדות שלומדים בהם ביום
  when: {
    /*
     * "רק בערב" הוא הסיגנל האמיתי של מה"ט ולא "מעט שעות": המסלול
     * המשולב בנוי בדיוק לעובד ביום (2–3 ערבים + שישי בבוקר, אומת
     * בשמונה מוסדות). העונש לתואר נשאר מוקל — מסלולי ערב קיימים.
     */
    B: { degree: -1, mahat: 3, bootcamp: 1 },
    C: { degree: 1 },
  },
  /*
   * שאיפה, לא מגבלה — והשאלה היחידה שהתואר יכול לזכות בה.
   *
   * כל שאר השאלות מודדות מה עוצר את האדם, ולכן הן יכולות רק להוריד
   * מהתואר. הפער בין המסלולים מגובה: שכירים בני 25–35 בהייטק, מקצועות
   * STEM בביקוש גבוה, 2019 — בוגרי תואר 22–27.7 אלף ₪, בוגרי הנדסאות
   * 13.5–20.7. מקור: כהן קובץ׳, זרוע העבודה, עיבוד לנתוני הלמ״ס.
   */
  aim: {
    A: { bootcamp: 3, mahat: 1 },
    B: { degree: 3 },
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
    const table = WEIGHTS[key];
    const val = q[key];
    if (!table || val === undefined) return;
    const delta = table[val];
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
    if (q.time === "A" || q.kids === "A" || q.when === "B") reasons.push("הזמן שלך מוגבל");
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

/** שומר את סדר ההופעה — הסדר בדאטה הוא הסדר למשתמש */
function groupSolutions(solutions: Solution[]): [string, Solution[]][] {
  const out: [string, Solution[]][] = [];
  for (const sol of solutions) {
    const g = sol.group ?? "";
    const found = out.find(([k]) => k === g);
    if (found) found[1].push(sol);
    else out.push([g, [sol]]);
  }
  return out;
}

/**
 * אריח פתרון מכווץ — שם ותאריך בלבד, והפירוט נפתח בלחיצה.
 *
 * המסך הכיל עד עשרה פתרונות פתוחים ברצף והפך לגלילה אינסופית;
 * שניים בשורה מקצרים אותו בלי לוותר על מילה מהפירוט.
 * בונוס מדידה: הפתיחה עצמה היא סיגנל עניין שקודם לא היה קיים.
 */
function SolutionTile({ s, blockerId }: { s: Solution; blockerId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!open) logEvent("paths_solution_open", { blocker: blockerId, solution: s.name });
        setOpen(o => !o);
      }}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
      className="rounded-xl px-3 py-2.5 cursor-pointer select-none"
      style={{
        gridColumn: open ? "1 / -1" : undefined,
        background: open ? "rgba(251,133,0,0.09)" : "rgba(251,133,0,0.05)",
        border: "1px solid rgba(251,133,0,0.15)",
      }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="text-[11.5px] font-black leading-[1.45]" style={{ color: "#92400e" }}>{s.name}</div>
        <span className="text-[13px] font-black shrink-0" style={{ color: "#92400e", opacity: 0.55 }}>
          {open ? "סגירה ✕" : "+"}
        </span>
      </div>
      {s.date && (
        <span
          className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{
            background: isUrgent(s.date) ? ORANGE : "rgba(0,0,0,0.08)",
            color: isUrgent(s.date) ? "#fff" : "rgba(0,0,0,0.5)",
          }}
        >
          {whenText(s.date)}
        </span>
      )}
      {open && (
        <>
          <div className="text-[11.5px] leading-[1.65] mt-2" style={{ color: "rgba(0,0,0,0.62)" }}>{s.detail}</div>
          {s.link && (
            <a
              href={s.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => {
                e.stopPropagation();
                logEvent("paths_solution_click", { blocker: blockerId, solution: s.name });
              }}
              className="inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(2,62,138,0.07)", color: NAVY }}
            >
              לפרטים ↗
            </a>
          )}
        </>
      )}
    </div>
  );
}

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
  const [answers, setAnswers] = useState<QuizAnswers>({ time: "", budget: "", education: "", kids: "", when: "", timeline: "", location: "", aim: "" });
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [activeTrack, setActiveTrack] = useState<Track>("bootcamp");
  /** מסך התוצאה (1a): איזה כרטיס פתוח במצב פירוט ("להכיר את המסלול הזה") */
  const [detailTrack, setDetailTrack] = useState<Track | null>(null);
  /*
   * במסלול האקדמי הקטלוג המלא מקופל כברירת מחדל: קודם בוחרים תואר, והמוסדות
   * נפתחים בתוך התואר. רשימה שטוחה של כל המוסדות לצד רשימת התארים הייתה שתי
   * רשימות מוערמות בלי קשר ביניהן — וזה מה שהיה כאן קודם.
   */
  const [showAllInst, setShowAllInst] = useState(false);
  const [view2, setView2] = useState<"list" | "map">("list");
  const [quizStarted, setQuizStarted] = useState(false);
  const [research, setResearch] = useState<Record<string, ResearchEntry>>({});
  const [meetingBooked, setMeetingBooked] = useState(false);
  /** ציוני העניין מכלי עיבוד החוויה בשלב 3 */
  const [domainInterest, setDomainInterest] = useState<Partial<Record<Domain, number>>>({});
  const [domainChoice, setDomainChoice] = useState<"one" | "two" | "open" | null>(null);
  const [chosenDomain, setChosenDomain] = useState<Domain | null>(null);
  // הבחירה המפורשת מהשער — עד שניים. מקור האמת החדש; השדות הוותיקים נשמרים כגישור
  const [pickedDomains, setPickedDomains] = useState<Domain[]>([]);
  /*
   * מצב הכנה — לפני שפגישה 2 התקיימה (נתי 20.8): השאלון והיכרות עם שלוש
   * הדרכים פתוחים, כי אילוצי חיים ואוריינות מסלולים לא תלויים בתחום.
   * בחירת התחום, המוסדות והחסמים נעולים — זו העבודה של הפגישה עם הרכזת.
   * "התקיימה" נגזרת מהמועד שנשמר בקביעה, לא מלחיצת כפתור.
   */
  const [prepMode, setPrepMode] = useState(false);
  /** עבר מועד פגישה 2 וטרם נענתה שאלת השער — מציגים אותה במקום המנעול */
  const [askMeeting2, setAskMeeting2] = useState(false);
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
        ["paths-quiz", "paths-shortlist", "paths-phase", "paths-journey", "paths-research", "paths-domains", "paths-domain", "paths-domain-choice"].forEach(k => localStorage.removeItem(k));
        window.history.replaceState({}, "", "/paths");
        return;
      }

      // ?demo=1&phase=done — קפיצה ישירה למסך מסוים עם נתונים לדוגמה, לצורך סקירה.
      // לא נשמר ל-localStorage כדי לא ללכלך התקדמות אמיתית.
      if (params.has("demo")) {
        const demo: QuizAnswers = { time: "B", budget: "A", education: "B", kids: "B", when: "C", timeline: "B", location: "B", aim: "B" };
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
      /*
       * דווקא המפתח הספציפי של פגישה 3. הדגל הכללי meeting-booked נדלק
       * בכל קביעה שהיא — וגרם למסך הסיום להכריז שפגישה 3 קבועה
       * למי שקבע רק את פגישה 1 (הבאג שישראל תפס, 20.8).
       */
      setMeetingBooked(localStorage.getItem("meeting-3-booked") === "true");

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
      let picked: Domain[] = [];
      try { picked = JSON.parse(localStorage.getItem("paths-domains") ?? "[]"); } catch { }
      if (picked.length) setPickedDomains(picked);
      const savedPhase = localStorage.getItem("paths-phase") as Phase | null;
      if (savedPhase) setPhase(savedPhase);
      /*
       * פגישה 2 "התקיימה" = שעה אחרי המועד שנשמר בקביעה. מי שכבר בחר תחומים
       * נשאר פתוח גם בלי מועד (לא נועלים אחורה), ודמו עוקף את הנעילה.
       */
      let m2Done = picked.length > 0 || !!savedChoice;
      let ask = false;
      try {
        const attended = localStorage.getItem("meeting-2-attended");
        const at = localStorage.getItem("meeting-2-at");
        const since = at ? Date.now() - new Date(at).getTime() : -1;
        const HOUR = 3600e3, WEEK = 7 * 24 * HOUR;

        if (attended === "yes") m2Done = true;              // שכבה 2 — אמר שנפגשו
        else if (attended === "missed") m2Done = false;     // אמר שלא — נשאר סגור
        else if (since > WEEK) m2Done = true;               // שכבה 3 — רשת ביטחון
        else if (since > HOUR) ask = true;                  // עברה שעה — שואלים
      } catch { }
      setAskMeeting2(ask);
      if (params.has("demo")) m2Done = true;
      setPrepMode(!m2Done);

      /*
       * השער: מי שטרם בחר כיוון מתחיל בבחירה. זו החלטה מכוונת (נתי, 20.8) —
       * בחירת התחום היא שער משמעותי ולא העשרה. אין בו "עוד לא סגור":
       * מי שעוצר מולו נמדד (paths_domain_gate בלי domain_committed) ומגיע לרכזת.
       * ובמצב הכנה השער לא מוצג בכלל — בחירת התחום שייכת לפגישה.
       */
      if (m2Done && !picked.length && !savedChoice && (!savedPhase || savedPhase === "intro")) setPhase("domain");

      // ?phase= הוא כלי בדיקה מפורש — הוא גובר על השחזור ועל השער
      if (wanted) setPhase(wanted);
    } catch { /* ignore */ }
  }, []);

  // מדידת השער: הגעה בלי בחירה היא הסיגנל שמחליף את האופציה שהוסרה
  useEffect(() => {
    if (phase === "domain") {
      trackEvent("paths_domain_gate");
      logEvent("paths_domain_gate", {});
    }
  }, [phase]);

  function commitDomains(list: Domain[]) {
    if (!list.length) return;
    setPickedDomains(list);
    localStorage.setItem("paths-domains", JSON.stringify(list));
    // גישור לשדות הוותיקים שכל שאר המסכים נשענים עליהם
    const legacy = list.length === 1 ? "one" : "two";
    setDomainChoice(legacy);
    localStorage.setItem("paths-domain-choice", legacy);
    setChosenDomain(list[0]);
    localStorage.setItem("paths-domain", list[0]);
    saveChosenDomains(list);
    trackEvent("domain_committed", { domains: list.join(",") });
    logEvent("domain_committed", { domains: list.join(",") });
    goToPhase("intro");
  }

  const recommended = recommendTrack(answers);
  const reason = buildReason(answers, recommended);
  const allAnswered = QUIZ_QUESTIONS.every(q => answers[q.key]);

  /**
   * שמירת הצ׳יפים, וגזירת education ממנה.
   *
   * education נשאר כי מנוע הניקוד ומסך החסמים בנויים עליו — עדיף לגזור
   * ערך אחד מהרשימה מאשר לפזר את אותה שאלה בשני מקומות שייפרדו בזמן.
   */
  function answerHave(picked: string[]) {
    const education = picked.includes("degree") ? "C" : picked.includes("bagrut") ? "B" : "A";
    const next = { ...answers, has: picked.join(","), education };
    setAnswers(next);
    localStorage.setItem("paths-quiz", JSON.stringify(next));
    if (qIndex < QUIZ_QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
      trackEvent("paths_question", { answered: qIndex + 1 });
      logEvent("paths_question", { answered: String(qIndex + 1) });
    } else {
      const rec = recommendTrack(next);
      setActiveTrack(rec);
      goToPhase("result");
    }
  }

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

    /*
     * שכיחות החסמים — הנתון היקר ביותר באפליקציה.
     *
     * מסך החסמים מציג את כולם פתוחים, ולכן אין בו "פתיחה" למדוד. במקום
     * זה נרשם חסם אחד לכל חסם ש**הוצג** לאדם, וזה בעצם המדד הנכון יותר:
     * לא כמה לחצו, אלא **אילו חסמים באמת יש לקהל שלנו**. אין שום דרך
     * אחרת להשיג את זה. השם נשאר paths_blocker_open כי admin_stats()
     * כבר מצטבר לפיו, ושינוי שם היה מחייב מיגרציה נוספת בשביל מילה.
     */
    if (p === "blockers") {
      BLOCKERS.filter(b => b.applies(answers))
        .forEach(b => logEvent("paths_blocker_open", { blocker: b.id }));
    }
  }

  const PHASE_ORDER: Phase[] = ["domain", "intro", "quiz", "result", "routes", "blockers", "institutions", "prep", "research", "done"];
  const phaseIndex = PHASE_ORDER.indexOf(phase);

  /**
   * התחומים שמוצגים בצירים.
   * מדורגים לפי עניין ולא לפי מסוגלות — דירוג לפי מסוגלות היה מסתיר
   * מהמשתמש בדיוק את התחום שהוא הכי רוצה, כי אצל דור ראשון להשכלה גבוהה
   * תחושת המסוגלות נמוכה באופן שיטתי ולא מוצדק.
   */
  const topDomains: { id: Domain; interest: number }[] = (() => {
    if (pickedDomains.length) {
      return pickedDomains.map(d => ({ id: d, interest: domainInterest[d] ?? 0 }));
    }
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
  const chosenDomains: Domain[] = pickedDomains.length
    ? pickedDomains
    : chosenDomain
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

  // ── Prep lock — לפני פגישה 2 החלקים תלויי-התחום נעולים ─────────────────
  if (prepMode && ["domain", "blockers", "institutions", "prep", "research"].includes(phase)) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel="הכנה לפגישה" phaseIndex={0} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-8 pb-32">
          {askMeeting2 ? (
            /*
              שאלת השער. שתי אפשרויות בלבד ואין "דלג" — זו שאלה של שנייה,
              ודילוג היה מרוקן אותה מתוכן. מי שעונה "כן" נפתח מיד, כי
              לתקוע מישהו שכן היה בפגישה זה הנזק הגדול מכולם.
            */
            <>
              <div className="text-[34px] mb-3">👋</div>
              <div className="text-[20px] leading-[1.4] mb-2" style={{ ...HEEBO, color: NAVY }}>
                לפני שממשיכים — הפגישה כבר הייתה?
              </div>
              <div className="text-[13px] leading-[1.85] mb-6" style={{ color: "rgba(0,0,0,0.58)" }}>
                לפי היומן המועד עבר. שנייה אחת, ונמשיך בדיוק למקום הנכון.
              </div>
              <button
                onClick={() => {
                  localStorage.setItem("meeting-2-attended", "yes");
                  trackEvent("meeting2_checkin", { result: "yes" });
                  logEvent("meeting2_checkin", { result: "yes" });
                  setAskMeeting2(false);
                  setPrepMode(false);
                }}
                className="w-full py-4 rounded-2xl text-white text-[15px] font-black active:scale-[0.98] transition-transform"
                style={{ background: ORANGE, ...HEEBO }}
              >
                כן, נפגשנו — להמשיך ←
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("meeting-2-attended", "missed");
                  localStorage.setItem("at-risk", "missed-meeting-2");
                  trackEvent("meeting2_checkin", { result: "missed" });
                  logEvent("meeting2_checkin", { result: "missed" });
                  setAskMeeting2(false);
                }}
                className="w-full mt-3 py-3.5 rounded-2xl text-[14px] font-bold"
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.6)" }}
              >
                עוד לא / לא הצלחתי להגיע
              </button>
            </>
          ) : (
          <>
          <div className="text-[34px] mb-3">🔒</div>
          <div className="text-[20px] leading-[1.4] mb-2" style={{ ...HEEBO, color: NAVY }}>
            החלק הזה נפתח אחרי הפגישה
          </div>
          <div className="text-[13px] leading-[1.85] mb-6" style={{ color: "rgba(0,0,0,0.58)" }}>
            את התחום בוחרים <b>יחד עם הרכזת</b> בפגישה — ומשם נפתחים המוסדות,
            החסמים וההכנה לפגישה השלישית.
            <br />
            מה שכן פתוח כבר עכשיו: השאלון והיכרות עם שלוש הדרכים — ככה מגיעים
            לפגישה עם תמונה מלאה.
          </div>
          <button
            onClick={() => goToPhase("intro")}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black active:scale-[0.98] transition-transform"
            style={{ background: ORANGE, ...HEEBO }}
          >
            להכנה — השאלון ושלוש הדרכים ←
          </button>
          <Link
            href="/explore"
            className="block text-center w-full mt-3 text-[12px] font-bold"
            style={{ color: "rgba(0,0,0,0.4)" }}
          >
            רוצה לטעום עוד תחום לפני הפגישה? ←
          </Link>
          {/* מי שאמר "לא הגעתי" — הדרך חזרה, לא מסך מת */}
          {localStorage.getItem("meeting-2-attended") === "missed" && (
            <Link
              href="/contact?m=2"
              className="block text-center w-full mt-4 py-3.5 rounded-2xl text-[14px] font-black"
              style={{ background: "#fff3e2", color: "#7a4100" }}
            >
              לקבוע מועד חדש לפגישה ←
            </Link>
          )}
          </>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Domain gate — שער בחירת הכיוון (נתי 20.8: שער מפורש, בלי מילוט) ──────
  if (phase === "domain") {
    const tasted = (Object.keys(DOMAIN_LABEL) as Domain[])
      .filter(d => domainInterest[d] !== undefined)
      .sort((a, b) => (domainInterest[b] ?? 0) - (domainInterest[a] ?? 0));
    const untasted = (Object.keys(DOMAIN_LABEL) as Domain[]).filter(d => !tasted.includes(d));
    const allDomains = [...tasted, ...untasted];
    const toggle = (d: Domain) =>
      setPickedDomains(prev =>
        prev.includes(d) ? prev.filter(x => x !== d) : prev.length >= 2 ? prev : [...prev, d]);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.domain} phaseIndex={0} phaseTotal={8} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-7 pb-32">
          <div className="text-[22px] leading-[1.35] mb-2" style={{ ...HEEBO, color: NAVY }}>
            חקר התחומים מאחוריך — מכאן מתחילים לבנות את הדרך
          </div>
          <div className="text-[13px] leading-[1.8] mb-6" style={{ color: "rgba(0,0,0,0.58)" }}>
            מה הכיוון שלך? <b>אפשר להוסיף עוד אחד שמעניין אותך.</b>
          </div>

          <div className="flex flex-col gap-2.5 mb-6">
            {allDomains.map(d => {
              const on = pickedDomains.includes(d);
              const seen = domainInterest[d] !== undefined;
              return (
                <button
                  key={d}
                  onClick={() => toggle(d)}
                  className="w-full rounded-xl px-4 py-3.5 text-right transition-all"
                  style={{
                    background: on ? "rgba(2,62,138,0.07)" : "#fff",
                    border: on ? `2px solid ${NAVY}` : "1px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-black" style={{ color: on ? NAVY : "rgba(0,0,0,0.7)" }}>
                        {DOMAIN_LABEL[d]}
                      </span>
                      {/* הסדר מוצהר — ולא נקבע בשקט לפי סדר הלחיצה */}
                      {on && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={pickedDomains[0] === d
                            ? { background: NAVY, color: "#fff" }
                            : { background: "rgba(2,62,138,0.1)", color: NAVY }}>
                          {pickedDomains[0] === d ? "הכיוון העיקרי" : "מעניין אותי גם"}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      {seen && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${ORANGE}15`, color: "#92400e" }}>
                          טעמת ✓
                        </span>
                      )}
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                        style={{ background: on ? NAVY : "rgba(0,0,0,0.12)" }}
                      >{on ? "✓" : ""}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {pickedDomains.length === 2 && (
            <button
              onClick={() => setPickedDomains([pickedDomains[1], pickedDomains[0]])}
              className="w-full mb-4 py-2.5 rounded-xl text-[12.5px] font-bold"
              style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.2)", color: NAVY }}
            >
              ⇅ להחליף — {DOMAIN_LABEL[pickedDomains[1]]} יהיה הכיוון העיקרי
            </button>
          )}

          <button
            onClick={() => commitDomains(pickedDomains)}
            disabled={pickedDomains.length === 0}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black active:scale-[0.98] transition-transform"
            style={{ background: pickedDomains.length ? ORANGE : "rgba(0,0,0,0.15)", ...HEEBO }}
          >
            נבנה את הדרך ←
          </button>
          <div className="text-[11px] text-center mt-3" style={{ color: "rgba(0,0,0,0.4)" }}>
            הבחירה מלווה אותך בהמשך השלב — ואפשר לחזור ולשנות אותה
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const STEPS = [
      { n: 1, title: `${QUIZ_QUESTIONS.length} שאלות על החיים שלך`, sub: "כמה זמן וכסף יש לך, מה יש לך ביד, ומה חשוב לך. שתי דקות" },
      { n: 2, title: "המסלול שמתאים לך", sub: "נגיד לך מה אנחנו ממליצים, ולמה דווקא זה" },
      { n: 3, title: "מה עומד בדרך — ומה פותר את זה", sub: "לכל חסם יש מענה. עם שם ועם תאריך" },
      { n: 4, title: "מוסדות ושאלות לפגישה", sub: "תבחר/י איפה לחקור, ותצא/י עם שאלות מוכנות לרכזת" },
    ];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.intro} phaseIndex={0} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <MeetingCheckin n={2} title="פגישת בחירת התחום" />

          {prepMode && (
            <div
              className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.7]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.6)" }}
            >
              <b style={{ color: NAVY }}>את בחירת התחום תעשו יחד בפגישה.</b>{" "}
              כאן בונים את התמונה — האילוצים שלך ושלוש הדרכים להייטק.
            </div>
          )}

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

          {/*
            שלושת הכרטיסים עם פנים (נתי 27.8): כרטיסי אייקון גנריים לא
            אמרו כלום. תמונת אווירה של מישהו מהקהילה בכל מסלול עושה את
            העבודה של "אנשים כמוני עושים את זה" בלי משפט אחד. אלה תמונות
            אווירה מוצהרות ולא עדויות — ולכן אין לידן שמות (הסיפורים
            האמיתיים עם שם וקישור נשארים במבוא בלבד).
          */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {TRACK_ORDER.map(t => (
              <div
                key={t}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)", boxShadow: "0 2px 10px rgba(2,62,138,0.05)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={TRACK_PHOTO[t]}
                  alt=""
                  className="w-full object-cover"
                  style={{ aspectRatio: "4/3", objectPosition: "center 30%" }}
                />
                <div className="px-2.5 py-2.5 text-center flex-1 flex flex-col justify-center">
                  <div className="text-[11.5px] font-bold leading-tight mb-0.5" style={{ color: NAVY }}>
                    {TRACK_META[t].label}
                  </div>
                  <div className="text-[10.5px] leading-tight" style={{ color: "rgba(0,0,0,0.42)" }}>
                    {TRACK_META[t].duration}
                  </div>
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
            {quizStarted ? "להמשיך מאיפה שעצרתי ←" : `בוא נתחיל — ${QUIZ_QUESTIONS.length} שאלות ←`}
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
          {current.multi ? (
            <>
              <div className="flex flex-wrap gap-2">
                {HAVE_CHIPS.map(c => {
                  const on = chips.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        // זוג הפסיכומטרי הדדית בלעדי — סימון אחד מבטל את השני
                        const PAIR: Record<string, string> = { psycho: "psycho-low", "psycho-low": "psycho" };
                        const drop = PAIR[c.id];
                        setChips(on
                          ? chips.filter(x => x !== c.id)
                          : [...chips.filter(x => x !== drop), c.id]);
                      }}
                      className="px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-[0.97]"
                      style={{
                        background: on ? NAVY : "#fff",
                        color: on ? "#fff" : NAVY,
                        border: `1.5px solid ${on ? NAVY : "rgba(2,62,138,0.14)"}`,
                      }}
                    >
                      {on ? "✓ " : ""}{c.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => answerHave(chips)}
                className="w-full mt-5 rounded-2xl py-4 text-[15px] font-black"
                style={{ background: ORANGE, color: "#fff" }}
              >
                המשך ←
              </button>
            </>
          ) : (
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
          )}
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
    /*
     * מסך התוצאה בעיצוב 1a — "רשת שוויונית עם כתר" (handoff מאושר 24.8):
     * שלושה כרטיסים שווי-גודל בסדר קבוע (תואר · הכשרה · מה"ט), ההמלצה
     * מקבלת כתר + נימוק אישי + CTA מלא — במקומה, בלי לשנות סדר. בחירה
     * במסלול לא-מומלץ לגיטימית ובלי חיכוך, אבל נמדדת (track_choice) —
     * סיגנל לרכזת לפני פגישה 3.
     */
    const chooseTrack = (t: Track) => {
      setActiveTrack(t);
      logEvent("track_choice", { track: t, followed: t === recommended ? "recommended" : "other" });
      trackEvent("track_choice", { track: t });
      goToPhase("routes");
    };
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.result} phaseIndex={2} phaseTotal={7} />
        <div className="flex-1 max-w-[1060px] mx-auto w-full px-[22px] pt-6 pb-32">

          {/* Header */}
          <div className="mb-5">
            <div className="text-[12px] font-black mb-1" style={{ color: ORANGE }}>שלב 4 · תוצאת השאלון</div>
            <div className="text-[27px] leading-tight" style={{ ...HEEBO, color: NAVY }}>המסלול שמתאים לך</div>
            <div className="text-[14px] mt-1" style={{ color: "#5d6b7a" }}>
              על סמך התשובות שלך — המלצה אחת, ושני מסלולים נוספים להשוואה מהירה
            </div>
          </div>

          {/* נימוק אישי — במובייל מעל הטבלה (בדסקטופ הוא בתוך הכרטיס המומלץ) */}
          <div className="sm:hidden rounded-xl px-4 py-3 mb-4 text-[13px] leading-[1.6]"
            style={{ background: "#fff", border: "1px solid #fdd9ae", color: "#7a3c00" }}>
            {reason}
          </div>

          {/* מובייל: שלושתם במסך אחד — לחיצה קופצת לכרטיס המלא */}
          <div className="sm:hidden grid grid-cols-3 gap-[7px] mb-5" dir="rtl">
            {TRACK_ORDER.map(t => {
              const c = RESULT_CARD[t];
              const isRec = t === recommended;
              return (
                <button
                  key={t}
                  onClick={() => document.getElementById(`track-card-${t}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="rounded-xl overflow-hidden text-right flex flex-col"
                  style={{ background: "#fff", border: isRec ? "2px solid #fb8500" : "2px solid #ece5d8" }}
                >
                  <div className="px-2 py-1.5 text-[10.5px] font-black text-center"
                    style={{ background: isRec ? "#fb8500" : "#eef3fb", color: isRec ? "#fff" : NAVY }}>
                    {isRec ? "👑 ההמלצה" : " "}
                  </div>
                  <div className="px-2 pt-2 text-center text-[18px]">{c.emoji}</div>
                  <div className="px-2 pt-1 text-center text-[12px] font-black leading-tight" style={{ color: NAVY }}>{c.label}</div>
                  <div className="px-2 pt-0.5 pb-1.5 text-center text-[10px]" style={{ color: "#5d6b7a" }}>{c.tagA}</div>
                  <div className="px-2 pb-2 flex flex-col gap-1 mt-auto">
                    <div className="text-[10px] leading-snug" style={{ color: "#3f4f63" }}>⏳ {c.mini.income}</div>
                    <div className="text-[10px] leading-snug" style={{ color: "#3f4f63" }}>💰 {c.mini.cost} לשנה</div>
                    <div className="text-[10px] leading-snug" style={{ color: "#3f4f63" }}>🚪 {c.mini.entry}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => chooseTrack(recommended)}
            className="sm:hidden w-full py-3.5 rounded-2xl text-white text-[15px] font-black mb-6 active:scale-[0.98] transition-transform"
            style={{ background: ORANGE, ...HEEBO }}
          >
            נמשיך עם {RESULT_CARD[recommended].label} ←
          </button>

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

          {/* שלושת הכרטיסים — רשת בדסקטופ, ערימה במובייל (המומלץ ראשון) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            {TRACK_ORDER.map(track => {
              const c = RESULT_CARD[track];
              const m = TRACK_META[track];
              const isRec = track === recommended;
              const detailOpen = detailTrack === track;
              return (
                <div
                  key={track}
                  id={`track-card-${track}`}
                  className={`rounded-2xl overflow-hidden flex flex-col bg-white ${isRec ? "order-first sm:order-none" : ""}`}
                  style={{
                    border: isRec ? "2px solid #fb8500" : "2px solid #ece5d8",
                    boxShadow: "0 2px 10px rgba(30,25,15,0.05)",
                    scrollMarginTop: 80,
                  }}
                >
                  {isRec && (
                    <div className="px-4 py-[7px] text-[12.5px] font-black text-white" style={{ background: ORANGE }}>
                      👑 ההמלצה שלנו בשבילך
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[24px]">{c.emoji}</span>
                      <span className="text-[18px] font-black" style={{ color: NAVY }}>{c.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#eef3fb", color: NAVY }}>{c.tagA}</span>
                      <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ border: "1px solid #d8dfe9", color: "#3f4f63" }}>{c.tagB}</span>
                    </div>

                    {/* נימוק אישי — רק במומלץ */}
                    {isRec && (
                      <div className="rounded-xl px-3.5 py-3 mb-3 text-[13.5px] leading-[1.6] max-sm:hidden"
                        style={{ background: "#fff8ee", border: "1px solid #fdd9ae", color: "#7a3c00" }}>
                        {reason}
                      </div>
                    )}

                    {/* שלוש שורות ההשוואה הקבועות — לא להוסיף רביעית */}
                    <div className="flex flex-col gap-2.5 mb-3">
                      {([
                        ["⏳", "מתי מתחילה הכנסה", c.income],
                        ["💰", "כמה עולה בשנה", c.cost],
                        ["🚪", "מה צריך כדי להיכנס", c.entry],
                      ] as const).map(([ic, label, val]) => (
                        <div key={label} className="flex items-start gap-2">
                          <span className="text-[15px] shrink-0">{ic}</span>
                          <div>
                            <div className="text-[11.5px] font-black" style={{ color: "#94908a" }}>{label}</div>
                            <div className="text-[13.5px] leading-snug" style={{ color: "#1e2f42" }}>{val}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* שורת אמת: ✓ תמיד, ✕ תמיד עם המקטין שלו */}
                    <div className="flex flex-col gap-1.5 mb-3">
                      <div className="rounded-[10px] px-3 py-2 text-[12.5px] leading-[1.55]" style={{ background: "#e8f6ef", color: "#04543a" }}>✓ {c.plus}</div>
                      <div className="rounded-[10px] px-3 py-2 text-[12.5px] leading-[1.55]" style={{ background: "#fdeede", color: "#8a4a09" }}>✕ {c.minus}</div>
                    </div>

                    {/* פירוט מלא — "להכיר את המסלול הזה" פותח את התוכן העמוק הקיים */}
                    {detailOpen && (
                      <div className="mb-3 rounded-xl p-3" style={{ background: "#fbf9f5", border: "1px solid #ece5d8" }}>
                        <div className="text-[11px] font-black mb-1.5" style={{ color: "#059669" }}>✅ מה זה נותן</div>
                        {m.pros.map((p, i) => <div key={i} className="text-[12px] leading-[1.6] mb-1.5" style={{ color: "#1e2f42" }}>• {p}</div>)}
                        <div className="text-[11px] font-black mb-1.5 mt-3" style={{ color: "#8a4a09" }}>⚖️ מה חשוב לדעת</div>
                        {m.cons.map((con, i) => <div key={i} className="text-[12px] leading-[1.6] mb-1.5" style={{ color: "#1e2f42" }}>• {con}</div>)}
                      </div>
                    )}

                    <div className="text-[12.5px] leading-[1.55] mb-3 mt-auto" style={{ color: "#6d675c" }}>{c.fit}</div>

                    {/* CTA — המומלץ מלא, האחרים בלי חיכוך ובלי אישור נוסף */}
                    {isRec ? (
                      <button
                        onClick={() => chooseTrack(track)}
                        className="w-full py-[13px] rounded-[14px] text-white text-[15.5px] font-black active:scale-[0.98] transition-transform"
                        style={{ background: ORANGE, ...HEEBO }}
                      >
                        נמשיך עם זה ←
                      </button>
                    ) : detailOpen ? (
                      <button
                        onClick={() => chooseTrack(track)}
                        className="w-full py-[12px] rounded-[14px] text-[14px] font-black active:scale-[0.98] transition-transform"
                        style={{ background: NAVY, color: "#fff", ...HEEBO }}
                      >
                        נמשיך עם {c.label} ←
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDetailTrack(track);
                          logEvent("track_detail_open", { track });
                        }}
                        className="w-full py-[12px] rounded-[14px] text-[14px] font-black transition-colors"
                        style={{ background: "#fff", border: "1.5px solid #023e8a", color: NAVY }}
                      >
                        להכיר את המסלול הזה
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Routes to a first job ──────────────────────────────────────────────────
  if (phase === "routes") {
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

          {/* השאלה הישנה ישבה כאן; הבחירה עברה לשער בכניסה לשלב (נתי 20.8) */}
          {!domainChoice && pickedDomains.length === 0 && prepMode && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(2,62,138,0.04)", border: "1.5px solid rgba(2,62,138,0.12)" }}>
              <div className="text-[15px] mb-2" style={{ ...HEEBO, color: NAVY }}>עד כאן ההכנה — ואת ההמשך פותחים יחד 🎯</div>
              <div className="text-[12.5px] leading-[1.8] mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
                בפגישה תבחרו תחום עם הרכזת, ומיד אחריה ייפתחו כאן המוסדות, החסמים
                וההכנה לפגישה השלישית. אתה מגיע אליה מוכן — עם האילוצים ממופים ושלוש הדרכים מוכרות.
              </div>
              <Link
                href="/explore"
                className="block text-center text-[12px] font-bold"
                style={{ color: "rgba(0,0,0,0.4)" }}
              >
                רוצה לטעום עוד תחום לפני הפגישה? ←
              </Link>
            </div>
          )}
          {!domainChoice && pickedDomains.length === 0 && !prepMode && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "#fff", border: "1.5px solid rgba(2,62,138,0.15)" }}>
              <div className="text-[14px] font-bold mb-3" style={{ color: NAVY }}>עוד לא בחרת כיוון — נתחיל שם</div>
              <button
                onClick={() => goToPhase("domain")}
                className="w-full py-3 rounded-xl text-white text-[13px] font-black"
                style={{ background: NAVY }}
              >
                לבחירת הכיוון ←
              </button>
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
                onClick={() => {
                  setDomainChoice(null); localStorage.removeItem("paths-domain-choice");
                  setPickedDomains([]); localStorage.removeItem("paths-domains");
                  goToPhase("domain");
                }}
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

              {/* אמת לפני פתרונות — מוצגת רק כשהיא באמת חלה */}
              {b.truth && answers.time === "A" && (
                <div className="text-[12.5px] leading-[1.75] mb-4 px-3.5 py-3 rounded-xl"
                  style={{ background: "rgba(251,133,0,0.09)", color: "#92400e" }}>
                  {b.truth}
                </div>
              )}

              {/*
                אריחים מכווצים במקום כרטיסים פתוחים — המסך התארך מדי.
                וכשחסם חוצה מסלולים (כסף), הפתרונות מקובצים לפי מסלול —
                מי שמכוון להכשרה לא צריך לצלול בין מלגות אקדמיה.
              */}
              <div className="flex flex-col gap-3">
                {groupSolutions(b.solutions).map(([group, items]) => (
                  <div key={group || "all"}>
                    {group && (
                      <div className="text-[11px] font-black mb-1.5" style={{ color: NAVY, opacity: 0.7 }}>
                        {group}
                      </div>
                    )}
                    <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      {items.map(sol => <SolutionTile key={sol.name} s={sol} blockerId={b.id} />)}
                    </div>
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

          {/* לא דורסים את הבחירה ממסך התוצאה — מי שבחר מסלול לא-מומלץ ממשיך איתו */}
          <button
            onClick={() => goToPhase("institutions")}
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
    /*
     * מי שבחר שני תחומים בשער רואה כאן בורר תחום — כל המסך מסונן לתחום
     * אחד בכל רגע (נתי 20.8): תחום ← אפיק ← ובאקדמיה תואר ← מוסדות.
     */
    const focusDomain: Domain | null = pickedDomains.length > 1
      ? (activeDomain && pickedDomains.includes(activeDomain) ? activeDomain : pickedDomains[0])
      : null;
    const instDomains: Domain[] = focusDomain ? [focusDomain] : chosenDomains;
    const list = focusDomain ? visibleFor(activeTrack, [focusDomain]) : visibleByTrack(activeTrack);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyStrip current={4} phaseLabel={PHASE_LABEL.institutions} phaseIndex={4} phaseTotal={7} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-5 pb-32">

          {/* התחום תמיד נראה למעלה (נתי 23.8): עם שניים — בורר; עם אחד — שורת הקשר */}
          {pickedDomains.length <= 1 && chosenDomains.length > 0 && (
            <div className="text-[12.5px] font-bold mb-3 px-1" style={{ color: "rgba(0,0,0,0.5)" }}>
              מחפשים מסלול ל: <span style={{ color: NAVY, fontWeight: 900 }}>{chosenDomains.slice(0, 2).map(d => DOMAIN_LABEL[d]).join(" · ")}</span>
            </div>
          )}
          {pickedDomains.length > 1 && (
            <div className="flex gap-2 mb-3">
              {pickedDomains.map(d => {
                const on = d === focusDomain;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      if (!on) {
                        // מדד ההתלבטות: כמה מחליפים תחום תוך כדי חקר המוסדות
                        logEvent("domain_switch", { to: d });
                        trackEvent("domain_switch", { to: d });
                      }
                      setActiveDomain(d);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all"
                    style={{
                      background: on ? ORANGE : "#fff",
                      color: on ? "#fff" : "#92400e",
                      border: on ? "none" : "1.5px solid rgba(251,133,0,0.35)",
                    }}
                  >
                    {DOMAIN_LABEL[d]}
                  </button>
                );
              })}
            </div>
          )}

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
          {/*
            תצוגת אזור — "יש משהו קרוב אליי" היא השאלה שהמסך הזה לא ענה עליה
            עד היום, למרות ששאלנו אותה בשאלון ולא עשינו עם התשובה כלום.
          */}
          {activeTrack !== "degree" && (
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "rgba(2,62,138,0.06)" }}>
            {([["list", "רשימה"], ["map", "מפה"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setView2(v)}
                className="flex-1 py-2 rounded-lg text-[12.5px] font-bold"
                style={{
                  background: view2 === v ? "#fff" : "transparent",
                  color: view2 === v ? NAVY : "rgba(0,0,0,0.45)",
                  boxShadow: view2 === v ? "0 1px 3px rgba(2,62,138,0.12)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>
          )}

          {view2 === "map" && activeTrack !== "degree" ? (
            <PinMap track={activeTrack} myRegions={regionsForAnswer(answers.location)}
              inList={n => shortlist.some(s => s.name === n)}
              onToggleList={(name) => shortlist.find(s => s.name === name)
                ? removeFromShortlist(name)
                : addToShortlist({ name, track: activeTrack })} />
          ) : (
          <>
          {activeTrack === "bootcamp" && <WrappedCourses domains={instDomains} />}
          {activeTrack === "degree" && <DegreePicker domains={instDomains} have={hasOf(answers)}
            list={shortlist.map(s => s.name)}
            onToggleList={(name) => shortlist.find(s => s.name === name)
              ? removeFromShortlist(name)
              : addToShortlist({ name, track: "degree" })} />}

          {/* Institution cards — הקטלוג */}
          {activeTrack === "degree" && !showAllInst ? (
            <button
              onClick={() => setShowAllInst(true)}
              className="w-full mb-5 px-3 py-2.5 rounded-xl text-[12px] font-bold"
              style={{ background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.45)" }}
            >
              להציג את כל {list.length} המוסדות במסלול האקדמי — בלי קשר לתואר
            </button>
          ) : (
          <>
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
          </>
          )}

          </>
          )}

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
          {/*
            "ההחלטה שלך" מציגה את מה שהוא בחר — לא את מה שהמלצנו (נתי 20.8).
            קודם הכרטיס שם את ההמלצה שלנו תחת הכותרת "ההחלטה שלך", והמועמד
            היה מגיע לפגישה 3 עם החלטה שלא באמת קיבל. ההמלצה מוצגת בנפרד.
          */}
          {shortlist.length > 0 ? (() => {
            const myTracks = Array.from(new Set(shortlist.map(x => x.track)));
            const matches = myTracks.includes(recommended);
            return (
              <>
                <div className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: ORANGE }}>הבחירות שלך</div>
                <div className="text-[18px] mb-1" style={HEEBO}>
                  {myTracks.map(t => `${TRACK_META[t].emoji} ${TRACK_META[t].label}`).join(" · ")}
                </div>
                <div className="text-[12.5px] leading-[1.7] mt-2" style={{ color: "rgba(0,0,0,0.6)" }}>
                  <span className="font-bold">המוסדות שבחרת:</span> {shortlist.map(x => x.name).join(" · ")}
                </div>
                <div className="text-[11.5px] mt-2" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {matches
                    ? `✓ תואם את ההמלצה שלנו (${TRACK_META[recommended].label})`
                    : `ההמלצה שלנו הייתה ${TRACK_META[recommended].label} — ההבדל הוא בדיוק שיחה לפגישה.`}
                </div>
              </>
            );
          })() : (
            <>
              <div className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: ORANGE }}>ההמלצה שלנו</div>
              <div className="text-[18px] mb-1" style={HEEBO}>{TRACK_META[recommended].emoji} {TRACK_META[recommended].label}</div>
              <div className="text-[12px] mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
                עוד לא סימנת מוסדות — אפשר לחזור ולסמן, או להשאיר את הבחירה לפגישה עצמה.
              </div>
            </>
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
    domains.length === 0 || c.domains.some(d => domains.includes(d)))
    // מעסיק בקצה = הקדימות העליונה (הכרעת נתי 17.8): קורס שנגמר אצל מעסיק
    // ששמו ידוע שווה יותר מכל ליווי-השמה כללי
    .sort((a, b) => (b.employerAtEnd ? 1 : 0) - (a.employerAtEnd ? 1 : 0));
  if (courses.length === 0) return null;

  const progName = (id?: string) => (id ? FUNDING.find(f => f.id === id)?.name : null);
  const progRel = (id?: string) => (id ? FUNDING.find(f => f.id === id)?.relationship : undefined);
  const instName = (id: string) => INSTITUTIONS.find(i => i.id === id)?.name?.split(" — ")[0];

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
            {/* מי מלמד + מי עוטף — בשורה אחת, כמו שמועמד היה מסביר לחבר */}
            <div className="text-[11.5px] font-bold mt-0.5" style={{ color: "#b45309" }}>
              {instName(c.institutionId)}
              {progName(c.programId) ? ` · בשיתוף ${progName(c.programId)?.split(" — ")[0]}` : ""}
            </div>
            {c.employerAtEnd && (
              <div className="text-[11.5px] font-black mt-1 px-2.5 py-1 rounded-lg inline-block"
                style={{ background: "rgba(5,150,105,0.1)", color: "#047857" }}>
                💼 מעסיק בקצה: {c.employerAtEnd}
              </div>
            )}
            <div className="text-[12px] leading-[1.65] mt-1.5" style={{ color: "rgba(0,0,0,0.6)" }}>{c.what}</div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {c.cost && <Chip13 text={c.cost.split("—")[0].split("·")[0].trim()} color="#047857" />}
              {/* איפה זה בפועל — שיקול מרכזי, ובמיוחד למי שלא גר במרכז */}
              {courseWhere(c) && <Chip13 text={`📍 ${courseWhere(c)}`} color={NAVY} />}
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
/**
 * בוחר התארים — רשת מצומצמת להשוואה, ולחיצה פותחת את המוסדות של אותו תואר.
 *
 * קודם היו כאן כרטיסים פתוחים ברוחב מלא, ומתחתיהם קטלוג מוסדות שלא היה לו
 * שום קשר לתואר שנבחר. כלומר שתי רשימות מוערמות, ולחיצה על תואר לא עשתה כלום.
 *
 * הכרטיס המצומצם נושא **שלושה מספרים בלבד** — שכר, אחוז שמגיעים לטק, וחסם
 * הכניסה. זה מה שהופך רשת להשוואה ולא לתפריט: פער של 12,000 ₪ בחודש עובר
 * בין שני תארים שנשמעים כמעט אותו דבר, והוא חייב להיראות בלי ללחוץ.
 *
 * הפאנל נפתח מתחת ל**שורה** של הכרטיס הנבחר כדי שהחיבור החזותי יישמר —
 * אותו לקח בדיוק ממסך המטה, שם הפאנל נפל מתחת לכל הרשת ואיבד את הקשר.
 */
function DegreePicker({ domains, have, list, onToggleList }: {
  domains: Domain[]; have: string[]; list?: string[]; onToggleList?: (name: string) => void;
}) {
  const degrees = domains.length
    ? [...new Map(domains.flatMap(d => degreesFor(d)).map(d => [d.id, d])).values()]
    : [];
  const [openId, setOpenId] = useState<string | null>(null);
  if (degrees.length === 0) return null;

  const shown = degrees.slice(0, 6);
  const selected = shown.find(d => d.id === openId) ?? null;
  const rows = Array.from({ length: Math.ceil(shown.length / 2) }, (_, i) => shown.slice(i * 2, i * 2 + 2));

  return (
    <div className="mb-6">
      <div className="text-[13px] font-black mb-1" style={{ color: NAVY }}>
        קודם בוחרים תואר — אחר כך מוסד
      </div>
      <div className="text-[11.5px] mb-3 leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
        שני תארים שנשמעים אותו דבר יכולים להוביל לשכר שונה ב-12,000 ₪ בחודש.
        לחיצה על תואר פותחת את המוסדות שמלמדים אותו.
      </div>

      {rows.map((row, ri) => (
        <div key={ri}>
          <div className="grid grid-cols-2 gap-2.5" style={{ marginTop: ri ? 10 : 0 }}>
            {row.map(d => {
              const bar = ENTRY_LABEL[d.entryBar];
              const on = selected?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setOpenId(on ? null : d.id)}
                  className="text-right p-3"
                  style={{
                    background: "#fff",
                    border: on ? `1.5px solid ${ORANGE}` : "1px solid rgba(2,62,138,0.1)",
                    borderBottom: on ? "none" : undefined,
                    borderRadius: on ? "14px 14px 0 0" : 14,
                    opacity: selected && !on ? 0.55 : 1,
                    boxShadow: on ? "none" : "0 2px 10px rgba(2,62,138,0.05)",
                  }}
                >
                  <div className="text-[13px] font-black leading-tight" style={{ color: NAVY }}>
                    {d.recommended ? "✦ " : ""}{d.name}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>{d.kind}</div>
                  {/*
                    מספר בלי כיתוב מלא הוא מספר שמטעה. "75% בטק" נקרא כמו
                    "סיכוי למצוא עבודה", ושכר בלי אופק נקרא כמשכורת התחלתית —
                    וזו בדיוק האכזבה שתגיע בשנה הראשונה. המקור: עבודאטה, משרד העבודה.
                  */}
                  <div className="mt-2 flex flex-col gap-1.5">
                    {d.salary && (
                      <div className="leading-[1.25]">
                        <span className="text-[13px] font-black" style={{ color: "#1c1a16" }}>
                          {d.salary.toLocaleString("he-IL")} ₪
                        </span>
                        <span className="block text-[9.5px]" style={{ color: "rgba(0,0,0,0.42)" }}>
                          שכר חודשי, 5–6 שנים אחרי התואר
                        </span>
                      </div>
                    )}
                    {d.inTech && (
                      <div className="leading-[1.25]">
                        <span className="text-[13px] font-black" style={{ color: "#047857" }}>{d.inTech}%</span>
                        <span className="block text-[9.5px]" style={{ color: "rgba(0,0,0,0.42)" }}>
                          ממסיימי התואר עובדים בהייטק
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5"
                    style={{ background: `${bar.color}14`, color: bar.color }}
                  >
                    {bar.label}
                  </span>
                </button>
              );
            })}
          </div>

          {selected && row.some(d => d.id === selected.id) && (
            <DegreeDetail degree={selected} have={have} list={list} onToggleList={onToggleList} />
          )}
        </div>
      ))}

      <div className="text-[11px] leading-[1.7] mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(2,62,138,0.04)", color: "rgba(0,0,0,0.5)" }}>
        הבחירה הסופית נעשית יחד עם הרכזת בפגישה — כאן המפה, לא ההחלטה.
      </div>
    </div>
  );
}

/**
 * הדלתות שפתוחות **לתואר הזה** במוסד הזה.
 *
 * תוכנית ליווי ברמת המוסד (אדמאס, סיקט) פתוחה לכל תואר. תוכנית עם רשימת
 * תארים נחשבת רק אם התואר ברשימה. **תוכנית שלא נבדקה אינה נספרת כדלת** —
 * ריק אומר "לא בדקנו", ואסור להציג למועמד הזדמנות שאיננו יודעים שקיימת.
 */
function openDoors(inst: (typeof INSTITUTIONS)[number], degreeId: string) {
  return (inst.programIds ?? [])
    .map(id => FUNDING.find(f => f.id === id))
    .filter((f): f is (typeof FUNDING)[number] => !!f && f.status !== "hidden")
    .filter(f => f.openToAllDegrees || (f.degreeIds ?? []).includes(degreeId));
}


/** הפאנל של תואר נבחר: מה הוא פותח, ההסתייגות, ואיפה לומדים אותו */
function DegreeDetail({ degree: d, have, list, onToggleList }: {
  degree: Degree; have: string[]; list?: string[]; onToggleList?: (name: string) => void;
}) {
  const [showRest, setShowRest] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const recommended = (d.recommendedAt ?? [])
    .map(id => INSTITUTIONS.find(i => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i && i.status !== "hidden")
    .sort((a, b) => openDoors(b, d.id).length - openDoors(a, d.id).length);

  /*
   * שאר המוסדות שמלמדים את התואר. **ריק = לא מופה, לא "לא מלמד"** — ולכן
   * מוסד בלי מיפוי לא מוצג כאן כאילו הוא לא רלוונטי, אלא בקיפול נפרד.
   */
  const teaches = INSTITUTIONS.filter(
    i => i.track === "degree" && i.status !== "hidden" &&
         (i.degreeIds ?? []).includes(d.id) && !recommended.some(r => r.id === i.id)
  ).sort((a, b) => openDoors(b, d.id).length - openDoors(a, d.id).length);
  const unmapped = INSTITUTIONS.filter(
    i => i.track === "degree" && i.status !== "hidden" && (i.degreeIds?.length ?? 0) === 0
  );

  const Row = ({ inst, star }: { inst: (typeof INSTITUTIONS)[number]; star?: boolean }) =>
    <InstitutionCard inst={inst} star={star} doors={openDoors(inst, d.id)}
      inList={list?.includes(inst.name)} onToggleList={onToggleList ? () => onToggleList(inst.name) : undefined} />;

  return (
    <div
      className="p-4 flex flex-col gap-2.5"
      style={{ background: "#fff", border: `1.5px solid ${ORANGE}`, borderRadius: "0 0 14px 14px", marginTop: -1 }}
    >
      <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.6)" }}>
        <b>פותח:</b> {d.leadsTo}
      </div>
      {d.recommended && (
        <div className="text-[11.5px] leading-[1.65] px-2.5 py-2 rounded-lg" style={{ background: "rgba(251,133,0,0.08)", color: "#92400e" }}>
          ✦ {d.recommended}
        </div>
      )}
      <div className="text-[11px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
        בכנות: {d.caveat}
      </div>
      <div className="text-[11px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.45)" }}>
        <b>הכניסה:</b> {d.entryNote}
      </div>

      {/* עומד בתנאים? נגזר ממה שסימן, ואומר מה חסר ולא רק "לא" */}
      {have.length > 0 && (() => {
        const miss = missingFor(d.entryBar, have);
        return miss.length === 0 ? (
          <div className="rounded-xl px-3 py-2.5 text-[11.5px] font-bold leading-[1.7]"
            style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.25)", color: "#047857" }}>
            ✓ לפי מה שסימנת, את/ה עומד/ת בתנאי הכניסה לתואר הזה
          </div>
        ) : (
          <div className="rounded-xl px-3 py-2.5 text-[11.5px] leading-[1.7]"
            style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.25)", color: "#92400e" }}>
            <b>חסר לך: {miss.join(" · ")}</b>
            <br />
            זה לא סוף הדרך — יש קורסי קדם ומכינות שסוגרים בדיוק את זה, והם מופיעים במסך החסמים.
          </div>
        );
      })()}

      {/*
        האתגר — רק כאן, בפאנל שנפתח, ולעולם לא על הכרטיס המצומצם.
        כרטיס נסרק בשנייה ומשמש לסינון; פאנל נקרא רק אחרי שמישהו
        כבר התעניין. ועם האתגר תמיד מה שמקטין אותו — אחרת זו הרתעה.
      */}
      {d.challenge && (
        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(2,62,138,0.04)", border: "1px solid rgba(2,62,138,0.08)" }}>
          <div className="text-[11.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
            <b style={{ color: NAVY }}>האתגר:</b> {d.challenge}
          </div>
          {d.challengeHelp && (
            <div className="text-[11px] leading-[1.65] mt-1.5 pt-1.5" style={{ color: "#047857", borderTop: "1px dashed rgba(0,0,0,0.08)" }}>
              <b>מה מקטין אותו:</b> {d.challengeHelp} · ותוכניות הליווי קיימות בדיוק בשביל שנה א׳
            </div>
          )}
        </div>
      )}
      {d.salary && (
        <div className="text-[11px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.45)" }}>
          <b>על השכר:</b> {d.salary.toLocaleString("he-IL")} ₪ הוא הממוצע חמש-שש שנים אחרי התואר,
          לפי נתוני עבודאטה של משרד העבודה. המשרה הראשונה משלמת פחות, ומשרת
          סטודנט עוד פחות — זה לאן מגיעים, לא מאיפה מתחילים.
        </div>
      )}

      <div className="pt-2 mt-0.5" style={{ borderTop: "1px dashed rgba(0,0,0,0.1)" }}>
        <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>איפה לומדים את זה</div>
        {/*
          כלל 5 של שלב 4: **היעדר הוא מידע**, ומנוסח כ"לא מצאנו" ולא כ"לא קיים".
          המיפוי שלנו חלקי, ובלי המשפט הזה המסך מציג שני מוסדות בפריפריה כאילו
          אלה כל האפשרויות — ומי שגר במרכז מסיק שאין לו מסלול.
        */}
        <div className="text-[10.5px] leading-[1.65] mb-2.5" style={{ color: "rgba(0,0,0,0.45)" }}>
          אלה המוסדות שכבר מיפינו לתואר הזה, והרשימה חלקית.
          {" "}<b>אם אין כאן משהו באזור שלך — זה לא אומר שאין</b>, זה אומר שעוד לא בדקנו.
          הרכזת תשלים את זה בפגישה.
        </div>

        {/*
          המפה כאן ולא ברמה העליונה: במסלול התואר בוחרים קודם תואר, ומפה
          שמציגה את כל מוסדות המסלול מתעלמת מהבחירה. כאן היא מציגה בדיוק
          את מי שמלמד את התואר הזה.
        */}
        {(recommended.length + teaches.length) > 0 && (
          <div className="mb-3">
            <button onClick={() => setShowMap(!showMap)}
              className="w-full py-2 rounded-xl text-[11.5px] font-bold"
              style={{ background: "rgba(2,62,138,0.05)", color: NAVY }}>
              {showMap ? "לסגור את המפה ▲" : "🗺 לראות על המפה איפה לומדים את התואר הזה"}
            </button>
            {showMap && (
              <div className="mt-2">
                <DegreeMap insts={[...recommended, ...teaches]}
                  inList={n => (list ?? []).includes(n)}
                  onToggleList={onToggleList} />
              </div>
            )}
          </div>
        )}

        {recommended.length === 0 && teaches.length === 0 ? (
          <div className="text-[11.5px] leading-[1.7]" style={{ color: "#92400e" }}>
            עוד לא מיפינו מוסדות לתואר הזה. זה לא אומר שאין — זה אומר שעוד לא בדקנו,
            והרכזת תשלים את זה בפגישה.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recommended.map(i => <Row key={i.id} inst={i} star />)}
            {teaches.map(i => <Row key={i.id} inst={i} />)}
          </div>
        )}

        {unmapped.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowRest(!showRest)}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg w-full"
              style={{ background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.45)" }}
            >
              {showRest ? "לסגור" : `עוד ${unmapped.length} מוסדות שטרם בדקנו אם מלמדים את התואר הזה`}
            </button>
            {showRest && (
              <div className="flex flex-col gap-1.5 mt-2">
                {unmapped.map(i => (
                  <a
                    key={i.id}
                    href={i.link?.startsWith("http") ? i.link : `https://${i.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl px-3 py-2 flex items-baseline justify-between gap-2"
                    style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <span className="text-[12px] font-bold" style={{ color: NAVY }}>
                      {i.name.split(" — ")[0]}
                    </span>
                    <span className="text-[10.5px]" style={{ color: "rgba(0,0,0,0.42)" }}>
                      {i.city ?? i.location} · לאתר ↗
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/**
 * איפה הקורס באמת מתקיים.
 *
 * נגזר מהמוסד כברירת מחדל, אבל **זה זמני**: גופים כמו בנתיבי אודי,
 * קווליטסט וטק-קריירה מפעילים מחזורים בערים שונות בלי קשר לכתובת
 * המשרד שלהם. הכתובת הנכונה שייכת למחזור, כמו התאריך — ותעבור
 * לשדה על הקורס עצמו.
 */
function courseWhere(c: Course): string | null {
  if (c.online) return "אונליין — אפשר מהבית";
  if (c.address ?? c.city) return c.address ?? c.city!;
  // נפילה למוסד רק כשלמחזור אין מיקום משלו, וזו הערכה ולא עובדה
  const inst = INSTITUTIONS.find(i => i.id === c.institutionId);
  return inst?.address ?? inst?.city ?? null;
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
