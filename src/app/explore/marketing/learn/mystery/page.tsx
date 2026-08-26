"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
// צבע התחום — שיווק דיגיטלי
const MKT = "#f97316";
const MKT_DARK = "#c2410c";
const NAVY = "#023e8a";

type Phase = "intro" | "audience" | "message" | "image" | "launch" | "iterate" | "done";
const PHASE_ORDER: Phase[] = ["audience", "message", "image", "launch", "iterate"];
function phaseNum(p: Phase) { return PHASE_ORDER.indexOf(p) + 1; }

// ─── מודל הסימולציה — מספרים להמחשה, מוצהרים כסימולציה במסך ─────────────────────

type AudienceId = "country" | "city" | "radius";
type MessageId  = "price" | "queue" | "generic";
type ImageId    = "chair" | "client" | "logo";

const AUDIENCES: { id: AudienceId; label: string; sub: string; feedback: string }[] = [
  {
    id: "country", label: "כל הארץ",
    sub: "מקסימום אנשים יראו את המודעה",
    feedback: "המון חשיפות — אבל מי שגר שעה נסיעה מהמספרה לא יבוא להסתפר. שימי לב מה זה עושה לפניות בתחזית.",
  },
  {
    id: "city", label: "כל העיר",
    sub: "כל מי שגר בעיר של יוסי",
    feedback: "כבר יותר הגיוני — אבל גם מהצד השני של העיר יש מספרות קרובות יותר. התחזית למטה מגיבה.",
  },
  {
    id: "radius", label: "2 ק\"מ סביב המספרה",
    sub: "השכונה והרחובות הסמוכים",
    feedback: "הדוכן עומד ברחוב של הלקוחות — כל שקל מוצג רק למי שיכול באמת לקפוץ להסתפר.",
  },
];

const MESSAGES: { id: MessageId; label: string; sub: string; clickMult: number; leadMult: number; feedback: string }[] = [
  {
    id: "price", label: "\"תספורת ב-50 ₪ החודש\"",
    sub: "צועקים מחיר",
    clickMult: 1.15, leadMult: 0.8,
    feedback: "מחיר מושך לחיצות — אבל מי שבא בגלל מחיר משווה מחירים, ולא תמיד קובע תור. עקבי אחרי הפניות בתחזית.",
  },
  {
    id: "queue", label: "\"קובעים תור בוואטסאפ — נכנסים בלי לחכות\"",
    sub: "צועקים את הכאב האמיתי: ההמתנה",
    clickMult: 1.0, leadMult: 1.35,
    feedback: "מי שאי פעם חיכה 40 דקות במספרה מרגיש שהמודעה הזו מדברת אליו — וגם ברור לו בדיוק מה לעשות: לשלוח הודעה.",
  },
  {
    id: "generic", label: "\"המספרה הכי טובה בעיר\"",
    sub: "צועקים סופרלטיב",
    clickMult: 0.7, leadMult: 0.55,
    feedback: "כל מספרה אומרת שהיא הכי טובה — הצעקה הזו נבלעת ברעש של השוק. התחזית למטה מרגישה את זה.",
  },
];

const IMAGES: { id: ImageId; label: string; sub: string; mult: number; feedback: string }[] = [
  {
    id: "chair", label: "הכיסא הריק במספרה",
    sub: "צילום נקי של העמדה",
    mult: 0.8,
    feedback: "נקי ומקצועי — אבל כיסא ריק מספר על מספרה ריקה. אנשים קונים את התוצאה, לא את הרהיט.",
  },
  {
    id: "client", label: "לקוח מרוצה אחרי תספורת",
    sub: "חיוך + תספורת טרייה",
    mult: 1.25,
    feedback: "זה מה שהלקוח הבא רוצה להיות — התמונה מוכרת את התוצאה. תמונות של אנשים אמיתיים כמעט תמיד מנצחות.",
  },
  {
    id: "logo", label: "הלוגו של המספרה",
    sub: "מיתוג על רקע שחור",
    mult: 0.95,
    feedback: "לוגו עובד למותג שכולם כבר מכירים. מספרה שכונתית צריכה להראות מה מקבלים — לא איך קוראים לה.",
  },
];

// בסיס לשבוע קמפיין ב-300 ₪ (סימולציה)
const AUDIENCE_BASE: Record<AudienceId, { imp: number; clicks: number; leads: number }> = {
  country: { imp: 58000, clicks: 520, leads: 1 },
  city:    { imp: 15000, clicks: 260, leads: 5 },
  radius:  { imp: 4200,  clicks: 175, leads: 9 },
};

function project(aud: AudienceId | null, msg: MessageId | null, img: ImageId | null) {
  if (!aud) return null;
  const base = AUDIENCE_BASE[aud];
  const m = msg ? MESSAGES.find(x => x.id === msg)! : null;
  const i = img ? IMAGES.find(x => x.id === img)! : null;
  const clicks = Math.round(base.clicks * (m?.clickMult ?? 1) * (i?.mult ?? 1));
  const leads  = Math.round(base.leads  * (m?.leadMult  ?? 1) * (i?.mult ?? 1));
  return {
    imp: base.imp,
    clicks,
    leads,
    costPerLead: leads > 0 ? Math.round(300 / leads) : null,
  };
}

// ─── ResultsPanel — לוח תוצאות חי ─────────────────────────────────────────────

function ResultsPanel({
  aud, msg, img, title,
}: { aud: AudienceId | null; msg: MessageId | null; img: ImageId | null; title?: string }) {
  const p = project(aud, msg, img);
  const rows = p ? [
    { k: "חשיפות", v: p.imp.toLocaleString(), note: "כמה יראו", color: "#e2e8f0" },
    { k: "קליקים", v: p.clicks.toLocaleString(), note: "כמה ילחצו", color: "#e2e8f0" },
    { k: "פניות בוואטסאפ", v: String(p.leads), note: "כמה יקבעו תור", color: p.leads >= 8 ? "#22c55e" : p.leads >= 4 ? "#eab308" : "#f87171" },
    {
      k: "עלות לפנייה",
      v: p.costPerLead !== null ? `₪${p.costPerLead}` : "—",
      note: p.costPerLead !== null ? "300 ₪ ÷ פניות" : "אין פניות",
      color: p.costPerLead === null ? "#f87171" : p.costPerLead <= 40 ? "#22c55e" : p.costPerLead <= 80 ? "#eab308" : "#f87171",
    },
  ] : [];
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
      <div className="flex items-center justify-between px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <span className="text-[11px] font-bold" dir="rtl" style={{ color: "#94a3b8", fontFamily: "'Heebo', sans-serif" }}>
          {title ?? "תחזית לשבוע קמפיין · 300 ₪"}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded" dir="rtl"
          style={{ background: "rgba(249,115,22,0.2)", color: "#fdba74", fontFamily: "'Heebo', sans-serif" }}>
          סימולציה — להמחשה
        </span>
      </div>
      <div className="p-4" style={{ background: "#0f172a" }}>
        {!p ? (
          <div className="text-[12px] text-center py-3" dir="rtl" style={{ color: "#64748b", fontFamily: "'Heebo', sans-serif" }}>
            בחרי קהל — והלוח יתחיל לחשב
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map(r => (
              <div key={r.k} className="flex items-center gap-3">
                <span className="text-[11px] font-bold" dir="rtl" style={{ color: "#94a3b8", fontFamily: "'Heebo', sans-serif", minWidth: 96 }}>{r.k}</span>
                <span className="font-mono text-[14px] font-bold" dir="ltr" style={{ color: r.color }}>{r.v}</span>
                <span className="text-[10px] mr-auto" dir="rtl" style={{ color: "#64748b", fontFamily: "'Heebo', sans-serif" }}>{r.note}</span>
              </div>
            ))}
            {(!msg || !img) && (
              <div className="text-[10px] mt-1" dir="rtl" style={{ color: "#64748b", fontFamily: "'Heebo', sans-serif" }}>
                {!msg ? "המסר עוד לא נבחר · " : ""}{!img ? "התמונה עוד לא נבחרה · " : ""}התחזית תתעדכן עם כל בחירה
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DecisionPicker — בחירה חיה בלי נכון/לא-נכון, הדאטה מגיבה ────────────────────

function DecisionPicker<T extends string>({
  options, picked, onPick,
}: {
  options: { id: T; label: string; sub: string; feedback: string }[];
  picked: T | null;
  onPick: (id: T) => void;
}) {
  const fb = picked ? options.find(o => o.id === picked)?.feedback : null;
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-3 mb-3">
        {options.map(o => {
          const sel = picked === o.id;
          return (
            <button key={o.id} type="button" onClick={() => onPick(o.id)} className="text-right w-full">
              <div className="rounded-xl px-4 py-3 transition-all"
                style={{
                  background: sel ? "rgba(249,115,22,0.08)" : "#fff",
                  border: `2px solid ${sel ? MKT : "rgba(0,0,0,0.08)"}`,
                }}>
                <div className="text-[13.5px] font-bold" dir="rtl" style={{ color: sel ? MKT_DARK : "rgba(0,0,0,0.75)" }}>
                  {sel && "✓ "}{o.label}
                </div>
                <div className="text-[11px] mt-0.5" dir="rtl" style={{ color: "rgba(0,0,0,0.4)" }}>{o.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
      {fb && (
        <div className="rounded-xl px-4 py-3 text-[12px] leading-[1.65]" dir="rtl"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
          💬 {fb}
        </div>
      )}
    </div>
  );
}

// ─── GlossaryChip ─────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block mb-1 mr-1">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
        style={{
          background: open ? "rgba(249,115,22,0.14)" : "rgba(249,115,22,0.06)",
          border: `1px solid rgba(249,115,22,${open ? 0.35 : 0.18})`,
          color: MKT_DARK, fontFamily: "'Heebo', sans-serif",
        }}>
        {term}
        <span style={{ fontSize: 9, fontFamily: "'Heebo', sans-serif", opacity: 0.65 }}>{open ? "▲" : "?"}</span>
      </button>
      {open && (
        <div className="rounded-xl px-3 py-2.5 mt-1.5 text-[12px] leading-[1.65]"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.7)" }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

function GlossaryRow({ terms }: { terms: { term: string; explanation: React.ReactNode }[] }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.32)" }}>
        👆 לחצי על מונח לקבל הסבר
      </div>
      <div className="flex flex-wrap">
        {terms.map(t => <GlossaryChip key={t.term} term={t.term} explanation={t.explanation} />)}
      </div>
    </div>
  );
}

// ─── Iterate helpers ──────────────────────────────────────────────────────────

type IterateConfig = {
  dataSentence: string;
  question: string;
  options: string[];
  correct: number;
  okMsg: string;
  errMsg: string;
  apply: (a: AudienceId, m: MessageId, i: ImageId) => { aud: AudienceId; msg: MessageId; img: ImageId; bonusLeads: number };
};

function buildIterate(aud: AudienceId, msg: MessageId, img: ImageId): IterateConfig {
  if (aud !== "radius") {
    return {
      dataSentence: aud === "country"
        ? "הדאטה אחרי שבוע: המון קליקים — אבל כמעט כל הלוחצים גרים רחוק מדי, ואף אחד מהם לא קבע תור."
        : "הדאטה אחרי שבוע: קליקים יפים — אבל רוב הפניות הגיעו דווקא מהרחובות הקרובים. השאר הסתכלו והמשיכו הלאה.",
      question: "מה משנים בסבב הבא?",
      options: ["את התמונה — אולי היא לא בולטת מספיק", "את הקהל — מצמצמים לסביבה הקרובה של המספרה", "כלום — נותנים לזה עוד שבוע"],
      correct: 1,
      okMsg: "✓ בדיוק — הדוכן צריך לעמוד ברחוב של הלקוחות. צימצמת ל-2 ק\"מ סביב המספרה.",
      errMsg: "✗ הדאטה מצביעה על מרחק: מי שלוחץ לא יכול להגיע. מצמצמים את הקהל ל-2 ק\"מ סביב המספרה.",
      apply: (_a, m, i) => ({ aud: "radius", msg: m, img: i, bonusLeads: 0 }),
    };
  }
  if (msg !== "queue") {
    return {
      dataSentence: msg === "price"
        ? "הדאטה אחרי שבוע: הרבה קליקים — אבל מעט קובעים תור. אנשים שבאים בגלל מחיר משווים מחירים וממשיכים."
        : "הדאטה אחרי שבוע: מעט קליקים. \"הכי טובה בעיר\" — כולם אומרים את זה, אף אחד לא עוצר בגלל זה.",
      question: "מה משנים בסבב הבא?",
      options: ["את המסר — מדברים על התור בוואטסאפ בלי המתנה", "את הקהל — מרחיבים חזרה לכל העיר", "מוסיפים עוד 300 ₪ לתקציב"],
      correct: 0,
      okMsg: "✓ בדיוק — הכאב האמיתי של לקוחות מספרה הוא ההמתנה. המסר החדש אומר מה מקבלים ומה עושים עכשיו.",
      errMsg: "✗ להרחיב קהל או להוסיף כסף = עוד מאותה בעיה. הדאטה אומרת שהצעקה לא עובדת — עוברים למסר של תור-בלי-המתנה.",
      apply: (a, _m, i) => ({ aud: a, msg: "queue", img: i, bonusLeads: 0 }),
    };
  }
  if (img !== "client") {
    return {
      dataSentence: img === "chair"
        ? "הדאטה אחרי שבוע: המסר עובד, אבל אנשים גוללים מעבר למודעה — תמונת הכיסא הריק לא עוצרת אף אחד."
        : "הדאטה אחרי שבוע: המסר עובד, אבל המודעה לא עוצרת את הגלילה — לוגו לא מספר לאף אחד מה הוא יקבל.",
      question: "מה משנים בסבב הבא?",
      options: ["את הקהל — אולי 2 ק\"מ זה צר מדי", "את המחיר — מוסיפים הנחה לכותרת", "את התמונה — לקוח מרוצה אחרי תספורת"],
      correct: 2,
      okMsg: "✓ בדיוק — התמונה מוכרת את התוצאה. לקוח אמיתי עם תספורת טרייה זה מה שהלקוח הבא רוצה להיות.",
      errMsg: "✗ הקהל והמסר כבר עובדים — הדאטה מצביעה על התמונה. מחליפים ללקוח מרוצה אחרי תספורת.",
      apply: (a, m, _i) => ({ aud: a, msg: m, img: "client", bonusLeads: 0 }),
    };
  }
  return {
    dataSentence: "הדאטה אחרי שבוע: הקמפיין עובד יפה — ורוב הפניות הגיעו בין 18:00 ל-21:00, כשאנשים חוזרים מהעבודה ונזכרים שצריך תספורת.",
    question: "מה עושים עם התובנה הזו?",
    options: ["מזיזים את רוב התקציב היומי לשעות הערב", "מרחיבים את הקהל לכל העיר — הקמפיין הרי עובד", "לא נוגעים — שלא יתקלקל"],
    correct: 0,
    okMsg: "✓ בדיוק — אותו תקציב, מרוכז בשעות שבהן אנשים באמת קובעים תור. ככה סוחטים עוד פניות בלי שקל נוסף.",
    errMsg: "✗ להרחיב קהל = לחזור לבעיית הדוכן ברחוב הלא נכון, ו\"לא לגעת\" משאיר כסף על הרצפה. מזיזים את התקציב לשעות הערב.",
    apply: (a, m, i) => ({ aud: a, msg: m, img: i, bonusLeads: 3 }),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// חוזרים בדיוק לאיפה שנעצרנו — לא רק לשלב, אלא גם לבחירות הקמפיין שכבר נבחרו
type FinalCampaignState = { aud: AudienceId; msg: MessageId; img: ImageId; bonusLeads: number };
type SavedMysteryState = {
  phase?: Phase; aud?: AudienceId | null; msg?: MessageId | null; img?: ImageId | null;
  iterPicked?: number | null; iterApplied?: boolean; finalState?: FinalCampaignState | null;
};
function loadSavedState(): SavedMysteryState {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("marketing-mystery-state");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function MarketingMysteryPage() {
  const [phase, setPhase] = useState<Phase>(() => loadSavedState().phase ?? "intro");
  const [aud, setAud] = useState<AudienceId | null>(() => loadSavedState().aud ?? null);
  const [msg, setMsg] = useState<MessageId | null>(() => loadSavedState().msg ?? null);
  const [img, setImg] = useState<ImageId | null>(() => loadSavedState().img ?? null);
  const [iterPicked, setIterPicked] = useState<number | null>(() => loadSavedState().iterPicked ?? null);
  const [iterApplied, setIterApplied] = useState(() => loadSavedState().iterApplied ?? false);
  const [finalState, setFinalState] = useState<FinalCampaignState | null>(() => loadSavedState().finalState ?? null);

  useEffect(() => {
    try {
      localStorage.setItem("marketing-mystery-state", JSON.stringify({
        phase, aud, msg, img, iterPicked, iterApplied, finalState,
      } satisfies SavedMysteryState));
    } catch {/* ignore */}
  }, [phase, aud, msg, img, iterPicked, iterApplied, finalState]);

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }
  function goBack() {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx > 0) go(PHASE_ORDER[idx - 1]);
    else if (phase === "audience") go("intro");
  }
  const canGoBack = phase !== "intro" && phase !== "done";

  const pNum = phaseNum(phase);
  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: MKT }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/marketing" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {canGoBack && (
            <button onClick={goBack} className="text-[12px] font-bold" style={{ opacity: 0.82, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
              שלב קודם ↩
            </button>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>מיני-פרויקט: השק/י קמפיין ב-300 ₪</div>
        {pNum > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.65 }}>
              <span>שלב {pNum} מתוך {PHASE_ORDER.length}</span>
              <span>תקציב: 300 ₪</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pNum / PHASE_ORDER.length) * 100}%`, background: "#fff" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          {/* Bridge card — מה כבר יודעים מהשלב הקודם */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.2)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: "#15803d" }}>✓ מה את כבר יודעת מ"יום בחיי"</div>
            <div className="text-[12px] leading-[1.85]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              ✓ לקרוא לוח קמפיין — חשיפות ← קליקים ← פניות<br />
              ✓ קהל = איפה עומד הדוכן — קרוב מנצח את גדול<br />
              ✓ מסר = מה צועקים — קונקרטי מנצח מילים גדולות
            </div>
          </div>

          {/* מה שונה הפעם */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(249,115,22,0.06)", border: "1.5px solid rgba(249,115,22,0.2)" }}>
            <div className="text-[12px] font-black mb-2" style={{ color: MKT_DARK }}>🚀 הפעם זה אחרת</div>
            <div className="text-[12.5px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              ביום-בחיי תיקנת קמפיין שבור של מישהו אחר. הפעם — <strong>את בונה קמפיין מאפס</strong>:
              שלוש החלטות, תקציב אמיתי-בגודלו של 300 ₪, ולוח תוצאות שמגיב לכל בחירה שלך.
              אין תשובה אחת נכונה מראש — <strong>הדאטה תגיד לך מה עבד</strong>, ואז תשני. בדיוק כמו בעבודה.
            </div>
          </div>

          {/* הלקוח */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>הלקוח שלך</div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[28px]">💈</span>
              <div dir="rtl">
                <div className="text-[14px] font-black" style={{ color: NAVY }}>המספרה של יוסי</div>
                <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>מספרה שכונתית · ותיקה · בלי נוכחות דיגיטלית</div>
              </div>
            </div>
            <div className="text-[12.5px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              "יש לי לקוחות קבועים, אבל הצעירים כבר לא נכנסים סתם מהרחוב.
              יש לי <strong>300 ₪</strong> לנסות את הפייסבוק הזה. אם יבואו אנשים — נמשיך. תבני לי משהו?"
            </div>
          </div>

          {/* כלים חדשים */}
          <div className="text-[12px] font-bold mb-2" dir="rtl" style={{ color: NAVY }}>🛠️ מושגים חדשים שיצטרפו הפעם</div>
          <GlossaryRow terms={[
            {
              term: "טווח ק\"מ (רדיוס)",
              explanation: <span dir="rtl">במקום לבחור עיר — מציירים מעגל סביב כתובת העסק, והמודעה מוצגת רק למי שבתוכו. הכלי המרכזי של עסק שכונתי: הדוכן עומד בדיוק ברחוב הנכון.</span>,
            },
            {
              term: "קריאייטיב",
              explanation: <span dir="rtl">כך קוראים בתעשייה למודעה עצמה — הצירוף של תמונה + כותרת. אותו קהל בדיוק יכול לקבל קריאייטיב מנצח או קריאייטיב שנבלע ברעש.</span>,
            },
            {
              term: "איטרציה",
              explanation: <span dir="rtl">סבב שיפור: מריצים ← קוראים את הדאטה ← משנים דבר אחד ← מריצים שוב. ככה קמפיינים משתפרים באמת — לא בניחוש מושלם מהתחלה, אלא בצעדים מדודים.</span>,
            },
          ]} />

          <button onClick={() => go("audience")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
            מתחילים — ההחלטה הראשונה ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Audience ────────────────────────────────────────────────────────────────
  if (phase === "audience") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 1 — איפה שמים את הדוכן?</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>מי בכלל יראה את המודעה של יוסי? בחרי — והלוח למטה יגיב</div>

          <DecisionPicker options={AUDIENCES} picked={aud} onPick={setAud} />
          <ResultsPanel aud={aud} msg={msg} img={img} />

          {aud && (
            <button onClick={() => go("message")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
              נעול. עכשיו — מה צועקים? ←
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Message ─────────────────────────────────────────────────────────────────
  if (phase === "message") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 2 — מה צועקים?</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>הכותרת של המודעה. שימי לב מה כל בחירה עושה לפניות בלוח</div>

          <DecisionPicker options={MESSAGES} picked={msg} onPick={setMsg} />
          <ResultsPanel aud={aud} msg={msg} img={img} />

          {msg && (
            <button onClick={() => go("image")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
              נעול. עכשיו — התמונה ←
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Image ───────────────────────────────────────────────────────────────────
  if (phase === "image") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>החלטה 3 — מה רואים?</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>התמונה עוצרת את הגלילה — או שלא. בחרי וצפי בלוח</div>

          <DecisionPicker options={IMAGES} picked={img} onPick={setImg} />
          <ResultsPanel aud={aud} msg={msg} img={img} />

          {img && (
            <button onClick={() => go("launch")} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
              style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
              הקמפיין מוכן — לחצי להשקה 🚀
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Launch ──────────────────────────────────────────────────────────────────
  if (phase === "launch" && aud && msg && img) {
    const p = project(aud, msg, img)!;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-5">
            <div className="text-[44px] mb-1">🚀</div>
            <div className="text-[22px] leading-tight" style={{ color: NAVY, ...HEEBO }}>הקמפיין באוויר — עבר שבוע</div>
            <div className="text-[13px] mt-1" style={{ color: "rgba(0,0,0,0.42)" }}>300 ₪ הושקעו. אלה התוצאות:</div>
          </div>

          <ResultsPanel aud={aud} msg={msg} img={img} title="תוצאות בפועל · שבוע · 300 ₪" />

          {/* מה נבחר */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>הקמפיין שלך</div>
            <div className="text-[12.5px] leading-[1.9]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              📍 קהל: <strong>{AUDIENCES.find(a => a.id === aud)!.label}</strong><br />
              📣 מסר: <strong>{MESSAGES.find(m => m.id === msg)!.label}</strong><br />
              🖼️ תמונה: <strong>{IMAGES.find(i => i.id === img)!.label}</strong>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: NAVY }}>עכשיו החלק שמפריד חובבים ממקצוענים</div>
            <div className="text-[12px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.62)" }}>
              {p.leads >= 8
                ? "התוצאות טובות — אבל מנהלת קמפיינים טובה לא עוצרת כשעובד. היא שואלת את הדאטה: מה אפשר לסחוט עוד מאותו תקציב?"
                : "התוצאות לא מספיק טובות — וזה בסדר גמור. אף קמפיין לא נולד מושלם. עכשיו קוראים את הדאטה, משנים דבר אחד, ומריצים שוב."}
              {" "}<strong>זו האיטרציה.</strong>
            </div>
          </div>

          <button onClick={() => { setIterPicked(null); go("iterate"); }} className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
            style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
            קראי את הדאטה — סבב שיפור ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Iterate ─────────────────────────────────────────────────────────────────
  if (phase === "iterate" && aud && msg && img) {
    const cfg = buildIterate(aud, msg, img);
    const before = project(aud, msg, img)!;
    const applied = cfg.apply(aud, msg, img);
    const afterBase = project(applied.aud, applied.msg, applied.img)!;
    const afterLeads = afterBase.leads + applied.bonusLeads;
    const answered = iterPicked !== null;
    const pickedCorrect = iterPicked === cfg.correct;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>סבב שיפור — הדאטה מדברת</div>
          <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.42)" }}>משנים דבר אחד בכל פעם — ככה יודעים מה עשה את ההבדל</div>

          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: "#92400e" }}>📊 מה הדאטה אומרת</div>
            <div className="text-[12.5px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>{cfg.dataSentence}</div>
          </div>

          <div className="text-[13.5px] font-bold mb-4" style={{ color: NAVY }}>{cfg.question}</div>
          <div className="flex flex-col gap-3 mb-4">
            {cfg.options.map((opt, i) => {
              const isCorrect = i === cfg.correct;
              const isPicked = i === iterPicked;
              let bg = "#fff", border = "1.5px solid rgba(0,0,0,0.08)", color = "rgba(0,0,0,0.75)";
              if (answered) {
                if (isCorrect) { bg = "rgba(34,197,94,0.08)"; border = "1.5px solid #22c55e55"; color = "#15803d"; }
                else if (isPicked) { bg = "rgba(220,38,38,0.07)"; border = "1.5px solid #dc262644"; color = "#b91c1c"; }
                else { color = "rgba(0,0,0,0.35)"; }
              }
              return (
                <button key={i} type="button" disabled={answered} onClick={() => setIterPicked(i)} className="text-right w-full">
                  <div className="rounded-xl px-4 py-3 text-[13px] transition-all" style={{ background: bg, border, color }}>
                    {answered && isCorrect && "✓ "}{answered && isPicked && !isCorrect && "✗ "}{opt}
                  </div>
                </button>
              );
            })}
          </div>

          {answered && (
            <>
              <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-4"
                style={{
                  background: pickedCorrect ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
                  border: `1px solid ${pickedCorrect ? "#22c55e55" : "#dc262644"}`,
                  color: pickedCorrect ? "#15803d" : "#b91c1c",
                }}>
                {pickedCorrect ? cfg.okMsg : cfg.errMsg}
              </div>

              {/* לפני ← אחרי */}
              <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
                <div className="px-4 py-[9px]" style={{ background: "#1e293b" }}>
                  <span className="text-[11px] font-bold" dir="rtl" style={{ color: "#94a3b8", fontFamily: "'Heebo', sans-serif" }}>
                    שבוע נוסף אחרי השינוי · סימולציה
                  </span>
                </div>
                <div className="p-4" style={{ background: "#0f172a" }}>
                  <div className="flex items-center justify-center gap-4" dir="rtl">
                    <div className="text-center">
                      <div className="text-[10px] mb-1" style={{ color: "#64748b", fontFamily: "'Heebo', sans-serif" }}>לפני</div>
                      <div className="font-mono text-[22px] font-bold" style={{ color: "#eab308" }}>{before.leads}</div>
                      <div className="text-[10px]" style={{ color: "#64748b", fontFamily: "'Heebo', sans-serif" }}>פניות</div>
                    </div>
                    <div className="text-[20px]" style={{ color: "#64748b" }}>←</div>
                    <div className="text-center">
                      <div className="text-[10px] mb-1" style={{ color: "#64748b", fontFamily: "'Heebo', sans-serif" }}>אחרי</div>
                      <div className="font-mono text-[22px] font-bold" style={{ color: "#22c55e" }}>{afterLeads}</div>
                      <div className="text-[10px]" style={{ color: "#64748b", fontFamily: "'Heebo', sans-serif" }}>פניות</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-center mt-3" dir="rtl" style={{ color: "#94a3b8", fontFamily: "'Heebo', sans-serif" }}>
                    אותם 300 ₪ — שינוי אחד מדויק שהדאטה הצביעה עליו
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setFinalState(applied); setIterApplied(true); go("done"); }}
                className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
                style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
                לסיכום הקמפיין ←
              </button>
            </>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === "done" && aud && msg && img) {
    const fs = finalState ?? { aud, msg, img, bonusLeads: 0 };
    const p = project(fs.aud, fs.msg, fs.img)!;
    const leads = p.leads + fs.bonusLeads;
    const costPerLead = leads > 0 ? Math.round(300 / leads) : null;

    function saveAndGo(href: string) {
      try {
        const journey = JSON.parse(localStorage.getItem("marketing-journey") || "{}");
        localStorage.setItem("marketing-journey", JSON.stringify({ ...journey, mystery: true }));
      } catch { /* ignore */ }
      window.location.href = href;
    }

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {Header}
        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
          <div className="text-center mb-6">
            <div className="text-[52px] mb-2">💈</div>
            <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>השקת קמפיין. באמת.</div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.4)" }}>מאפס — דרך דאטה — לסבב שיפור. זה כל המחזור.</div>
          </div>

          {/* סיכום קמפיין */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div className="px-4 py-3" style={{ background: MKT }}>
              <span className="text-[12px] font-black text-white" style={{ fontFamily: "'Heebo', sans-serif" }}>📋 סיכום הקמפיין — המספרה של יוסי</span>
            </div>
            <div className="p-4" style={{ background: "#fff" }}>
              <div className="text-[12.5px] leading-[2]" dir="rtl" style={{ color: "rgba(0,0,0,0.7)" }}>
                📍 קהל: <strong>{AUDIENCES.find(a => a.id === fs.aud)!.label}</strong>{iterApplied && fs.aud !== aud ? " (שונה בסבב השיפור)" : ""}<br />
                📣 מסר: <strong>{MESSAGES.find(m => m.id === fs.msg)!.label}</strong>{iterApplied && fs.msg !== msg ? " (שונה בסבב השיפור)" : ""}<br />
                🖼️ תמונה: <strong>{IMAGES.find(i => i.id === fs.img)!.label}</strong>{iterApplied && fs.img !== img ? " (שונתה בסבב השיפור)" : ""}
                {fs.bonusLeads > 0 && (<><br />⏰ תקציב: <strong>מרוכז בשעות הערב</strong> (התובנה מהדאטה)</>)}
              </div>
              <div className="rounded-xl p-3 mt-3 flex items-center justify-around" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }} dir="rtl">
                <div className="text-center">
                  <div className="text-[18px] font-black" style={{ color: NAVY, ...HEEBO }}>₪300</div>
                  <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.4)" }}>הושקעו</div>
                </div>
                <div className="text-center">
                  <div className="text-[18px] font-black" style={{ color: "#15803d", ...HEEBO }}>{leads}</div>
                  <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.4)" }}>פניות בוואטסאפ</div>
                </div>
                <div className="text-center">
                  <div className="text-[18px] font-black" style={{ color: MKT_DARK, ...HEEBO }}>{costPerLead !== null ? `₪${costPerLead}` : "—"}</div>
                  <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.4)" }}>לפנייה</div>
                </div>
              </div>
              <div className="text-[10px] mt-2 text-center" style={{ color: "rgba(0,0,0,0.35)" }}>
                המספרים — סימולציה להמחשת העיקרון, לא הבטחת תוצאות
              </div>
            </div>
          </div>

          {/* זו בדיוק העבודה */}
          <div className="mb-7 rounded-2xl p-4"
            style={{ background: "rgba(249,115,22,0.08)", border: "1.5px solid rgba(249,115,22,0.22)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: MKT_DARK }}>זו בדיוק העבודה</div>
            <div className="text-[13px] leading-[1.7]" dir="rtl" style={{ color: "rgba(0,0,0,0.65)" }}>
              מה שעשית בעשר הדקות האלה — לבחור קהל, לנסח מסר, לבחור תמונה, לקרוא דאטה ולשנות דבר אחד מדויק —
              זה מה שמנהלת קמפיינים עושה כל יום. ההבדל היחיד: התקציבים גדלים, והלקוחות משלמים.{" "}
              <span className="font-bold" style={{ color: NAVY }}>אם נהנית מהמחזור הזה — יש כאן כיוון ששווה לבדוק לעומק.</span>
            </div>
          </div>

          <button onClick={() => saveAndGo("/explore/marketing/experience")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
            style={{ background: MKT, fontFamily: "'Heebo', sans-serif" }}>
            מיציתי את הטעימה — לכלי עיבוד החוויה ←
          </button>
          <button onClick={() => saveAndGo("/explore/marketing")}
            className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
            style={{ background: "transparent", border: `1.5px solid ${MKT}`, color: MKT_DARK, fontFamily: "'Heebo', sans-serif" }}>
            חזרה למפת התחום
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}
