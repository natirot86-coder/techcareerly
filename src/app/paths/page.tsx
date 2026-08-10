"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Phase = "intro" | "quiz" | "result" | "institutions" | "prep" | "done";
type Track = "bootcamp" | "mahat" | "degree";
type QuizAnswers = { time: string; budget: string; education: string; kids: string; timeline: string; location: string };
type ShortlistItem = { name: string; track: Track };

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
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
    q: "תוך כמה זמן אתה רוצה להתחיל לעבוד בהייטק?",
    opts: [
      { val: "A", label: "שנה–שנתיים", sub: "אני רוצה להיכנס לשוק מהר" },
      { val: "B", label: "2–3 שנים", sub: "בסדר עם לימוד מסודר" },
      { val: "C", label: "4 שנים ויותר", sub: "אני בונה לטווח ארוך" },
    ],
  },
  {
    key: "location" as keyof QuizAnswers,
    q: "איפה אתה גר?",
    opts: [
      { val: "A", label: "מרכז הארץ", sub: "גוש דן, ת״א, ירושלים" },
      { val: "B", label: "צפון / דרום / פריפריה", sub: "נגישות למוסדות מוגבלת" },
      { val: "C", label: "גמיש / מרחוק", sub: "יכול/ה לנסוע או ללמוד אונליין" },
    ],
  },
];

type Institution = { name: string; why: string; tag: string; link: string; tagColor: string };
const INSTITUTIONS: Record<Track, Institution[]> = {
  bootcamp: [
    { name: "Campus IL", why: "קורסים ממשלתיים בעברית — חינמיים לחלוטין. מומלץ כנקודת התחלה לכל תחום.", tag: "חינמי", link: "https://campus.gov.il", tagColor: "#059669" },
    { name: "ITC — Israel Tech Challenge", why: "אחוזי השמה גבוהים, מלגות ייעודיות לקהלים מגוונים, תוכנית מלאה עם ליווי.", tag: "מלגות", link: "https://www.itc.tech", tagColor: ORANGE },
    { name: "John Bryce", why: "מוסד ותיק ומוכר בתעשייה, נוכחות ברחבי הארץ, קורסי ערב גמישים.", tag: "גמיש", link: "https://www.johnbryce.co.il", tagColor: "#2563eb" },
    { name: "HackerU / Elevation", why: "מתמחים בסייבר ופיתוח, חיבור ישיר למעסיקים, bootcamp מואץ.", tag: "שוק עבודה", link: "https://www.hackeru.com", tagColor: "#7c3aed" },
    { name: "Developers Institute", why: "Bootcamp מלא עם ליווי קריירה אישי לאורך כל הדרך.", tag: "ליווי", link: "https://www.developers.org.il", tagColor: NAVY },
  ],
  mahat: [
    { name: "אורט ישראל", why: "רשת ענפה ברחבי הארץ, לימודי ערב, מוכרת מאוד על ידי מעסיקים.", tag: "נפוץ", link: "https://www.ort.org.il", tagColor: "#2563eb" },
    { name: "מכון טכנולוגי חולון (HIT)", why: "מוכר, תוכניות הנדסאים ומהנדסים, קרוב למרכז.", tag: "מוכר", link: "https://www.hit.ac.il", tagColor: NAVY },
    { name: "מכללת שנקר", why: "חזקה בעיצוב ו-UX, מוכרת בתעשיית הטק.", tag: "UX/Design", link: "https://www.shenkar.ac.il", tagColor: "#db2777" },
    { name: "סמי שמעון (SCE)", why: "מיקום דרום, קהל מגוון, לימודי ערב, נגיש לפריפריה.", tag: "פריפריה", link: "https://www.sce.ac.il", tagColor: "#059669" },
  ],
  degree: [
    { name: "האוניברסיטה הפתוחה", why: "ללא פסיכומטרי, לימוד גמיש מהבית, תואר מוכר — מומלצת בחום לקהל שלנו.", tag: "⭐ ממולץ", link: "https://www.openu.ac.il", tagColor: ORANGE },
    { name: "אוניברסיטת בן-גוריון", why: "חזקה בסייבר ורשתות, רלוונטית לתושבי הדרום והפריפריה.", tag: "סייבר", link: "https://www.bgu.ac.il", tagColor: "#dc2626" },
    { name: "מכללת רייכמן (IDC)", why: "תואר מוכר, סביבה יזמית, מלגות לקהלים שונים.", tag: "יזמות", link: "https://www.runi.ac.il", tagColor: "#7c3aed" },
    { name: "אוניברסיטת אריאל", why: "תנאי קבלה נגישים יחסית, פריסה גיאוגרפית רחבה.", tag: "נגיש", link: "https://www.ariel.ac.il", tagColor: "#059669" },
  ],
};

const TRACK_META: Record<Track, { emoji: string; label: string; duration: string; cost: string; entry: string; pros: string[]; cons: string[] }> = {
  bootcamp: {
    emoji: "⚡",
    label: "הכשרה טכנולוגית",
    duration: "6–12 חודשים",
    cost: "15,000–45,000 ₪ (לפני מלגות)",
    entry: "לרוב ללא בגרות מלאה — ראיון / מבחן כניסה",
    pros: ["נכנסים לשוק תוך שנה", "מיומנויות מעשיות מיידיות", "גמישות שעות — ערב ולילה", "אפשר ללא בגרות מלאה", "מלגות רבות זמינות"],
    cons: ["תעודה לא אקדמית — חסם לתפקידים בכירים", "לא כל מעסיק מכיר", "פחות בסיס תיאורטי"],
  },
  mahat: {
    emoji: "🏫",
    label: "מה\"ט / מכללה טכנולוגית",
    duration: "2–3 שנים (לרוב ערב)",
    cost: "25,000–65,000 ₪",
    entry: "בגרות מלאה (לרוב עם מתמטיקה 3 יח\"ל)",
    pros: ["תעודת הנדסאי/טכנאי — מוכרת בתעשייה", "בסיס תיאורטי + מעשי", "לימוד ערב — אפשר לעבוד במקביל", "ביניים בין bootcamp לתואר"],
    cons: ["דורש בגרות מלאה + מתמטיקה", "2-3 שנים — לא מהיר", "פחות גמיש מ-bootcamp"],
  },
  degree: {
    emoji: "🎓",
    label: "תואר אקדמי",
    duration: "3–4 שנים",
    cost: "40,000–130,000 ₪",
    entry: "בגרות + פסיכומטרי (בחלק מהמוסדות — ניתן ללא פסיכו)",
    pros: ["תואר מוכר בכל תעשייה", "פתיחות לתפקידים בכירים ומחקר", "גמישות קריירה מקסימלית", "הכרה בינלאומית"],
    cons: ["4 שנים — הכי ארוך", "הכי יקר", "פסיכומטרי ברוב המוסדות", "פחות מעשי בהתחלה"],
  },
};

// ─── Logic ────────────────────────────────────────────────────────────────────

function recommendTrack(q: QuizAnswers): Track {
  if (q.time === "A" || q.budget === "A" || q.timeline === "A" || q.education === "A") return "bootcamp";
  if (q.time === "C" && q.timeline === "C" && q.education !== "A") return "degree";
  return "mahat";
}

function buildReason(q: QuizAnswers, track: Track): string {
  const reasons: string[] = [];
  if (track === "bootcamp") {
    if (q.time === "A") reasons.push("יש לך זמן מוגבל");
    if (q.budget === "A") reasons.push("אתה מחפש/ת מלגה");
    if (q.timeline === "A") reasons.push("רוצה להיכנס לשוק מהר");
    if (q.education === "A") reasons.push("אין בגרות מלאה");
    return `בגלל ש${reasons.join(", ")} — הכשרה טכנולוגית היא הדרך הכי ריאלית עבורך עכשיו.`;
  }
  if (track === "degree") {
    return "יש לך זמן, גמישות כלכלית ובגרות מלאה — תואר אקדמי יפתח לך את הדלתות הרחבות ביותר בקריירה.";
  }
  return "יש לך בגרות וזמן סביר — מה\"ט נותן לך הכרה פורמלית עם גמישות של לימוד ערב.";
}

function generateQuestions(q: QuizAnswers, shortlist: ShortlistItem[]): string[] {
  const qs: string[] = [];
  if (q.budget === "A") qs.push("אילו מלגות קיימות עבורי ספציפית — ואיך מגישים בקשה?");
  if (q.location === "B") qs.push("יש אפשרויות לימוד מרחוק שמתאימות לאזור שלי?");
  if (q.education === "A") qs.push("אין לי בגרות מלאה — מה המסלול הריאלי עבורי עכשיו?");
  if (q.kids === "A") qs.push("יש תוכניות עם שעות גמישות שמתאימות להורים?");
  if (shortlist.length >= 2) qs.push(`מה ההבדל האמיתי בין ${shortlist[0].name} ל-${shortlist[1].name}?`);
  qs.push("כמה זמן בממוצע לוקח לבוגרים למצוא עבודה ראשונה אחרי הלימודים?");
  qs.push("יש בוגרים מהקהילה שלי שעשו את זה ואפשר להתחבר אליהם?");
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

function JourneyProgress({ phaseIndex, total }: { phaseIndex: number; total: number }) {
  return (
    <>
      <div className="px-[22px] py-2 flex items-center gap-3" style={{ background: "rgba(251,133,0,0.07)", borderBottom: "1px solid rgba(251,133,0,0.12)" }}>
        <div className="flex gap-[5px]">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-1.5 rounded-full" style={{ width: n === 4 ? "22px" : "14px", background: n < 4 ? ORANGE : n === 4 ? ORANGE : "rgba(0,0,0,0.12)", opacity: n < 4 ? 0.45 : 1 }} />
          ))}
        </div>
        <span className="text-[11px] font-bold" style={{ color: "#92400e" }}>שלב 4 מתוך 6 — מסלול לימודים</span>
      </div>
      <div className="h-[3px]" style={{ background: "rgba(0,0,0,0.07)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${Math.round((phaseIndex / total) * 100)}%`, background: ORANGE }} />
      </div>
    </>
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

  useEffect(() => {
    try {
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
    } else {
      const rec = recommendTrack(next);
      setActiveTrack(rec);
      setPhase("result");
      localStorage.setItem("paths-phase", "result");
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
  }

  const PHASE_ORDER: Phase[] = ["intro", "quiz", "result", "institutions", "prep", "done"];
  const phaseIndex = PHASE_ORDER.indexOf(phase);

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
      { n: 1, title: "6 שאלות על החיים שלך", sub: "כמה זמן יש לך, מה התקציב, מה המצב המשפחתי — שתי דקות" },
      { n: 2, title: "המסלול שמתאים לך", sub: "המלצה מנומקת + השוואה מלאה של שלושת המסלולים" },
      { n: 3, title: "מוסדות לימוד אמיתיים", sub: "רשימה מומלצת — תבחר/י עד שלושה שמעניינים אותך" },
      { n: 4, title: "שאלות מוכנות לפגישה", sub: "שאלות שנבנות מהתשובות שלך — לפגישה השלישית עם הרכזת" },
    ];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyProgress phaseIndex={0} total={QUIZ_QUESTIONS.length} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">

          {/* Where you are in the journey */}
          <div
            className="rounded-2xl px-5 py-4 mb-5"
            style={{ background: "rgba(251,133,0,0.07)", border: "1.5px solid rgba(251,133,0,0.22)" }}
          >
            <div className="text-[12px] font-black mb-1.5" style={{ ...HEEBO, color: "#92400e" }}>
              איפה את/ה נמצא/ת עכשיו
            </div>
            <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.6)" }}>
              טעמת תחומים, עיבדת את החוויה ונפגשת עם הרכזת. יש לך כיוון.
              <br />
              עכשיו השאלה השתנתה — כבר לא <span className="font-bold">״מה מעניין אותי״</span> אלא{" "}
              <span className="font-bold">״איך אני באמת לומד/ת את זה״</span>.
            </div>
          </div>

          {/* The three tracks — teaser */}
          <div className="text-[19px] leading-tight mb-2" style={{ ...HEEBO, color: NAVY }}>
            שלוש דרכים להיכנס להייטק
          </div>
          <div className="text-[12.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
            אין מסלול נכון אחד. יש מסלול שמתאים לחיים שלך — לזמן שיש לך, לכסף, למשפחה ולקצב שאת/ה צריך/ה.
          </div>

          <div className="flex gap-2.5 mb-5">
            {(["bootcamp", "mahat", "degree"] as Track[]).map(t => (
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
            <div className="text-[12px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>
              השאלות הן על המציאות שלך — לא מבחן ואין תשובות נכונות. ככל שתענה/י בכנות,
              ההמלצה תהיה שווה יותר. אפשר לחזור ולשנות בכל שלב.
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
        <JourneyProgress phaseIndex={qIndex} total={QUIZ_QUESTIONS.length} />
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
            שאלה {qIndex + 1} מתוך {QUIZ_QUESTIONS.length}
          </div>
          <div className="text-[20px] leading-tight mb-6" style={{ ...HEEBO, color: NAVY }}>{current.q}</div>
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
        <JourneyProgress phaseIndex={2} total={QUIZ_QUESTIONS.length} />
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

          {/* 3 path comparison */}
          <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>השוואת שלושת המסלולים</div>

          {(["bootcamp", "mahat", "degree"] as Track[]).map(track => {
            const m = TRACK_META[track];
            const isRec = track === recommended;
            return (
              <RevealCard key={track} emoji={m.emoji} title={`${m.label}${isRec ? " ✦ מומלץ לך" : ""}`}>
                <div className="pt-2">
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
            onClick={() => { setActiveTrack(recommended); goToPhase("institutions"); }}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-black mt-2 active:scale-[0.98] transition-transform"
            style={{ background: NAVY, ...HEEBO }}
          >
            לחקר מוסדות ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Institutions ───────────────────────────────────────────────────────────
  if (phase === "institutions") {
    const tracks: { key: Track; label: string; emoji: string }[] = [
      { key: "bootcamp", label: "הכשרה", emoji: "⚡" },
      { key: "mahat", label: "מה\"ט", emoji: "🏫" },
      { key: "degree", label: "תואר", emoji: "🎓" },
    ];
    const list = INSTITUTIONS[activeTrack];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyProgress phaseIndex={3} total={QUIZ_QUESTIONS.length} />
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
          <RevealCard emoji="💰" title="מלגות לקהל שלנו — חשוב לקרוא">
            <ul className="list-none space-y-2 pt-2">
              {[
                "קרן אהרן — מלגות לסטודנטים ממשפחות בעלות צרכים",
                "ג'וינט ישראל — תוכניות לימוד ועידוד ליוצאי אתיופיה",
                "משרד הקליטה — סיוע להשתלבות בלימודים",
                "Campus IL — קורסים ממשלתיים חינמיים / מסובסדים",
                "רוב המוסדות מציעים מלגות פנימיות — שאלו ישירות באדמיסיות",
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: ORANGE }}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RevealCard>

          {/* Institution cards */}
          <div className="text-[13px] font-black mb-3" style={{ color: NAVY }}>
            מוסדות — {TRACK_META[activeTrack].label}
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

  // ── Prep ───────────────────────────────────────────────────────────────────
  if (phase === "prep") {
    const questions = generateQuestions(answers, shortlist);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <JourneyProgress phaseIndex={5} total={QUIZ_QUESTIONS.length} />
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
          <div className="flex flex-col gap-3 mb-6">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl px-4 py-3.5 flex items-start gap-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5" style={{ background: ORANGE }}>
                  {i + 1}
                </div>
                <span className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.75)" }}>{q}</span>
              </div>
            ))}
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

  // ── Done ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {Header}
      <JourneyProgress phaseIndex={6} total={QUIZ_QUESTIONS.length} />
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-8 pb-32">
        <div className="text-center mb-8">
          <div className="text-[56px] mb-3">🗺️</div>
          <div className="text-[22px] leading-tight mb-1" style={{ ...HEEBO, color: NAVY }}>המפה שלך מוכנה</div>
          <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.45)" }}>הרשימה והשאלות שמורות — בפגישה 3 נועלים מסלול</div>
        </div>

        <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(251,133,0,0.06)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
          <div className="text-[13px] font-black mb-3" style={{ color: "#92400e" }}>מה הכנת</div>
          <div className="flex flex-col gap-2">
            {[
              `מסלול מומלץ: ${TRACK_META[recommended].label}`,
              `${shortlist.length} מוסד/ות ברשימה שלי`,
              "שאלות מוכנות לפגישה 3",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: ORANGE }}>✓</span>
                <span className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.7)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Link href="/dashboard" className="block w-full py-4 text-center text-white text-[15px] font-black rounded-2xl mb-3 active:scale-[0.98] transition-transform" style={{ background: NAVY, ...HEEBO }}>
          חזרה למסע ←
        </Link>
        <button onClick={() => goToPhase("institutions")} className="w-full py-3.5 text-center text-[13.5px] font-bold rounded-2xl" style={{ background: "rgba(2,62,138,0.06)", color: NAVY }}>
          לעדכן את הרשימה
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
