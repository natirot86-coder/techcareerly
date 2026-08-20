/**
 * /admin/coordinator — מסך הרכזת: תור החילוץ.
 *
 * כוכב הצפון: **"מי צריך אותי היום."** לא CRM ולא טבלת כולם — רשימה ממוינת
 * לפי דחיפות, וכל שורה היא אדם + הסיגנל במילים + פעולה אחת.
 *
 * מה שבכוונה אין כאן: ציונים, אחוזים, השוואות בין מועמדים. המסך משרת
 * התערבות, לא הערכה — ברגע שרכזת מדרגת אנשים, המספרים הופכים למטרה.
 *
 * הנתונים מ-/api/coordinator (צד שרת, מפתח סודי). הגישה בקוד רכזת שנשמר
 * מקומית אחרי הזנה ראשונה — שכבת הגנה מינימלית עד שיהיה Auth אמיתי.
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const SEV_META: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "דחוף", color: "#b91c1c", bg: "rgba(220,38,38,0.08)" },
  2: { label: "שווה פנייה", color: "#92400e", bg: "rgba(251,133,0,0.09)" },
  3: { label: "שיחה מחזקת", color: "#0369a1", bg: "rgba(14,165,233,0.08)" },
};


const DOMAIN_HE: Record<string, string> = {
  data: "דאטה", cyber: "סייבר", networks: "רשתות", code: "קוד",
  qa: "בדיקות תוכנה", ai: "AI", ux: "UX", marketing: "שיווק דיגיטלי",
};

/** שש שאלות כלי עיבוד החוויה — כדי שנדע *באיזו* מהן נעצרו */
const SCCT_HE: Record<string, string> = {
  interest_scale: "שאלת העניין",
  interest_open: "העניין — בכתיבה חופשית",
  efficacy_scale: "שאלת המסוגלות",
  efficacy_open: "המסוגלות — בכתיבה חופשית",
  outcome_scale: "שאלת הציפיות",
  outcome_open: "הציפיות — בכתיבה חופשית",
};

type Ev = { name: string; props: Record<string, unknown>; at: string };

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const dom = (v: unknown) => DOMAIN_HE[s(v)] ?? s(v);

/**
 * אירוע → משפט בעברית.
 *
 * הרכזת קוראת את זה חמש דקות לפני שיחה, אז אין כאן שמות אירועים ואין
 * JSON — רק מה קרה. מה שאין לו ניסוח מוצג כמו שהוא, כדי שאירוע חדש
 * לא ייעלם מהמסך בשקט.
 */
function describe(e: Ev): string {
  const p = e.props ?? {};
  switch (e.name) {
    case "meeting_booked":         return `קבע/ה את פגישה ${s(p.n)}`;
    case "meeting_self_declared":  return `הצהיר/ה שכבר קבע/ה את פגישה ${s(p.n)} — אין לזה אישור ביומן`;
    case "meeting_open":           return `נכנס/ה למסך תיאום פגישה ${s(p.n)}`;
    case "meeting_calendar_ready": return `היומן נטען`;
    case "meeting1_checkin":       return s(p.result) === "missed" ? "סימן/ה שלא הצליח/ה להגיע לפגישה" : "סימן/ה שהפגישה הייתה טובה";
    case "sim_start":              return `נכנס/ה לסימולציית ${dom(p.domain)}`;
    case "sim_step":               return `סימולציית ${dom(p.domain)} — צעד ${s(p.i)} מתוך ${s(p.of)}${p.concept ? ` · ${s(p.concept)}` : ""}`;
    case "scct_done":              return `סיים/ה את כלי עיבוד החוויה ב${dom(p.domain)}`;
    case "scct_step":              return `כלי עיבוד החוויה ב${dom(p.domain)} — ${SCCT_HE[s(p.q)] ?? s(p.q)}`;
    case "paths_question":         return `ענה/תה על שאלה ${s(p.answered)} בשאלון המסלולים`;
    case "paths_quiz_done":        return `סיים/ה את השאלון — ההמלצה שיצאה: ${s(p.recommendation)}`;
    case "paths_blocker_open":     return `הוצג לו/ה החסם: ${s(p.blocker)}`;
    case "paths_solution_click":   return `פתח/ה פתרון: ${s(p.solution)}`;
    case "plan_money_opened":      return "פתח/ה את מסך החשבון";
    case "plan_task_open":         return `חזר/ה למשימה "${s(p.task)}" — פעם ${s(p.count)}`;
    case "plan_update_sent":       return "שלח/ה עדכון לרכזת";
    case "plan_intro_done":        return "נכנס/ה לשלב התוכנית";
    case "waiting_taste_start":    return "התחיל/ה את שתי הדקות";
    case "waiting_taste_done":     return "סיים/ה את שתי הדקות";
    case "waiting_prep_open":      return "קרא/ה את ההכנה לפגישה";
    case "waiting_booked_self_declared": return "סימן/ה 'כבר קבעתי'";
    default: {
      const extra = Object.values(p).map(s).filter(Boolean).join(" · ");
      return extra ? `${e.name} · ${extra}` : e.name;
    }
  }
}

/**
 * כיווץ רצפים.
 *
 * מי שעבר 12 צעדים בסימולציה ייצר 12 שורות שמציפות את הציר. האירועים
 * מגיעים מהחדש לישן, ולכן הראשון ברצף הוא **הרחוק ביותר שהגיע אליו** —
 * בדיוק מה שמעניין: איפה עצר.
 */
function compact(events: Ev[]): Ev[] {
  const out: Ev[] = [];
  for (const e of events) {
    const prev = out[out.length - 1];
    const sameRun =
      prev && prev.name === e.name &&
      (e.name === "sim_step" || e.name === "scct_step" || e.name === "paths_blocker_open") &&
      s(prev.props?.domain) === s(e.props?.domain);
    if (!sameRun) out.push(e);
  }
  return out;
}

/**
 * חלוקה לביקורים.
 *
 * פער של יותר מחצי שעה בין אירועים = יצא וחזר. זה מה שמאפשר להגיד
 * "היה כאן ארבע פעמים" ו"הביקור הזה ארך 12 דקות" — ובעיקר לזהות מי
 * שחוזר שוב ושוב לאותה נקודה בלי לעבור אותה.
 *
 * מה שהמדידה הזו **לא** יודעת: כמה זמן הוא ישב וקרא אחרי האירוע האחרון
 * בביקור. אין בנייד אירוע "יצא", ולכן משך ביקור הוא תמיד הערכת חסר.
 */
const SESSION_GAP = 30 * 60 * 1000;

function sessions(events: Ev[]): Ev[][] {
  const out: Ev[][] = [];
  let run: Ev[] = [];
  for (const e of events) { // מגיעים מהחדש לישן
    const prev = run[run.length - 1];
    if (prev && +new Date(prev.at) - +new Date(e.at) > SESSION_GAP) { out.push(run); run = []; }
    run.push(e);
  }
  if (run.length) out.push(run);
  return out;
}

/** מיקום בתוך המסע — הצעד/השאלה, בלי התחום. משמש לזיהוי "חזר לאותו מקום" */
function spot(e: Ev): string | null {
  if (e.name === "sim_step") return `sim:${s(e.props?.domain)}:${s(e.props?.i)}`;
  if (e.name === "scct_step") return `scct:${s(e.props?.domain)}:${s(e.props?.q)}`;
  if (e.name === "paths_question") return `quiz:${s(e.props?.answered)}`;
  return null;
}

function minutes(ms: number): string {
  const m = Math.round(ms / 60000);
  return m < 1 ? "פחות מדקה" : `${m} דקות`;
}

/**
 * "בקצרה" — המשפט שהרכזת קוראת אם היא קוראת רק דבר אחד.
 *
 * חמש דקות לפני שיחה אין זמן לקרוא ציר זמן. הציר הוא הגיבוי; זה הכותרת.
 */
function summarize(p: Person): string[] {
  const out: string[] = [];
  const visits = sessions(p.timeline);
  if (visits.length) {
    const total = visits.reduce((sum, v) => sum + (+new Date(v[0].at) - +new Date(v[v.length - 1].at)), 0);
    out.push(`${visits.length} כניסות · ${minutes(total)} בסך הכל`);
  }

  // איפה עצר — הצעד הרחוק ביותר בכל סימולציה/כלי, מהאירוע החדש ביותר
  const furthest = p.timeline.find(e => e.name === "sim_step" || e.name === "scct_step");
  if (furthest) out.push(`עצר/ה ב: ${describe(furthest)}`);

  // חזר לאותה נקודה בשתי כניסות נפרדות — סימן לחיכוך, לא לשכחה
  const seen = new Map<string, number>();
  visits.forEach((v, i) => v.forEach(e => {
    const k = spot(e);
    if (k && seen.get(k) !== i) seen.set(k, seen.has(k) ? -1 : i);
  }));
  if ([...seen.values()].some(v => v === -1)) out.push("חזר/ה לאותה נקודה ביותר מכניסה אחת");

  return out;
}

/** "לפני 3 ימים" / "היום" — כמה זמן עבר, במילים */
function ago(iso: string | null): string {
  if (!iso) return "עוד לא";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "היום";
  if (days === 1) return "אתמול";
  return `לפני ${days} ימים`;
}

type Person = {
  id: string; name: string; anonymous: boolean; region: string | null;
  stage: number; domain: string | null; ranked: string[]; lastActive: string | null; lastAction: string | null;
  signals: { severity: 1 | 2 | 3; reason: string; action: string }[];
  checklist: { label: string; done: boolean; detail?: string }[];
  timeline: Ev[];
};

/** צ'קליסט התהליך — קודם לציר האירועים: הרכזת צריכה "איפה הוא במסע", לא לוג */
function Checklist({ items }: { items: { label: string; done: boolean; detail?: string }[] }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "4px 0 12px" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
          <span style={{
            width: 16, height: 16, borderRadius: 999, flexShrink: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: it.done ? "#059669" : "rgba(0,0,0,0.08)", color: "#fff", fontSize: 10, fontWeight: 900,
          }}>{it.done ? "✓" : ""}</span>
          <span style={{ color: it.done ? "#1c1a16" : "rgba(0,0,0,0.4)", fontWeight: it.done ? 700 : 500 }}>
            {it.label}{it.detail ? ` — ${it.detail}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CoordinatorPage() {
  const [code, setCode] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [data, setData] = useState<{ needsAttention: Person[]; quiet: number; quietList?: Person[]; total: number; generatedAt: string } | null>(null);
  // ברירת המחדל היא תור החילוץ — ההחלטה מ-14.8. הרשימה המלאה היא טאב, לא הבית
  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setCode(localStorage.getItem("coordinator-code")); }, []);

  const load = useCallback(async (c: string) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/coordinator", { headers: { "x-coordinator-code": c } });
      if (r.status === 401) { setError("קוד שגוי"); localStorage.removeItem("coordinator-code"); setCode(null); return; }
      if (r.status === 503) { setError((await r.json()).error); return; }
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        setError(body?.error ? `שגיאה ${r.status} — ${body.error}` : `שגיאה ${r.status}. אם זה קרה בזמן עדכון של האתר, רענון אמור לפתור`);
        return;
      }
      setData(await r.json());
    } catch { setError("שגיאת רשת"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (code) load(code); }, [code, load]);

  if (!code) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 360, width: "100%", background: "#fff", borderRadius: 18, padding: 26, border: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 20, ...HEEBO, color: NAVY }}>מסך הרכזת</div>
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", lineHeight: 1.7, marginTop: 8 }}>
            המסך מציג נתונים אישיים של מועמדים, ולכן דורש קוד גישה.
          </p>
          <input
            type="password" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && draft) { localStorage.setItem("coordinator-code", draft); setCode(draft); } }}
            placeholder="קוד רכזת"
            style={{ width: "100%", marginTop: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 15 }}
          />
          <button
            onClick={() => { if (draft) { localStorage.setItem("coordinator-code", draft); setCode(draft); } }}
            style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            כניסה
          </button>
          {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c" }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 26, marginTop: 8, ...HEEBO }}>מי צריך אותי היום</div>
          {data && (
            <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7 }}>
              {data.needsAttention.length} דורשים תשומת לב · {data.quiet} בסדר גמור · {data.total} סה״כ
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px 60px" }}>
        {error && (
          <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#b91c1c", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7 }}>
            {error === "SUPABASE_SECRET_KEY not configured" ? (
              <><b>המפתח הסודי עוד לא בוורסל.</b> Settings → Environment Variables → להוסיף SUPABASE_SECRET_KEY (הערך מ-Supabase → API Keys → server_side_app) ולעשות deploy.</>
            ) : error === "COORDINATOR_CODE not configured" ? (
              <><b>קוד הרכזת עוד לא הוגדר.</b> להוסיף COORDINATOR_CODE ב-Vercel — זה הקוד שרכזות יזינו כאן.</>
            ) : error}
          </div>
        )}

        {data && (
          <div style={{ display: "flex", gap: 6, background: "rgba(2,62,138,0.06)", borderRadius: 12, padding: 4, marginBottom: 14 }}>
            {([["queue", "מי צריך אותי היום"], ["all", `כל המשתתפים (${data.total})`]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setTab(v)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 800, fontFamily: "'Heebo', sans-serif",
                  background: tab === v ? "#fff" : "transparent",
                  color: tab === v ? NAVY : "rgba(0,0,0,0.45)",
                  boxShadow: tab === v ? "0 1px 3px rgba(2,62,138,0.12)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {loading && <div style={{ padding: 30, textAlign: "center", color: "rgba(0,0,0,0.4)" }}>טוען…</div>}

        {tab === "queue" && data && data.needsAttention.length === 0 && !loading && (
          <div style={{ background: "#eef8f3", border: "1px solid #cfe9dd", color: "#08694c", borderRadius: 14, padding: 22, textAlign: "center", fontSize: 15, fontWeight: 700 }}>
            אף אחד לא תקוע כרגע 🎉
          </div>
        )}

        {tab === "queue" && data?.needsAttention.map(p => {
          const sev = SEV_META[p.signals[0]?.severity ?? 3];
          const isOpen = open === p.id;
          return (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${sev.color}33`, marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => setOpen(isOpen ? null : p.id)}
                style={{ width: "100%", textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: sev.bg, color: sev.color }}>{sev.label}</span>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: "#1c1a16" }}>{p.name}</span>
                  {p.anonymous && <span style={{ fontSize: 10.5, color: "rgba(0,0,0,0.35)" }}>(עוד לא השלים/ה שאלון)</span>}
                  <span style={{ fontSize: 11.5, color: "rgba(0,0,0,0.4)" }}>
                    שלב {p.stage}{p.region ? ` · ${p.region}` : ""}{p.domain ? ` · ${p.domain}` : ""}
                  </span>
                </div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                  {p.signals.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(0,0,0,0.7)" }}>
                      {s.severity === 1 ? "🔴" : s.severity === 2 ? "🟠" : "🔵"} {s.reason}
                    </div>
                  ))}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "12px 16px", background: "#fcfbf9" }}>
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
                    <span style={{ color: "rgba(0,0,0,0.5)" }}>
                      נכנס/ה: <b style={{ color: "#1c1a16" }}>{ago(p.lastActive)}</b>
                    </span>
                    <span style={{ color: "rgba(0,0,0,0.5)" }}>
                      התקדם/ה: <b style={{ color: "#1c1a16" }}>{ago(p.lastAction)}</b>
                    </span>
                  </div>

                  <Checklist items={p.checklist ?? []} />

                  {/* בקצרה — מה שקוראים אם קוראים רק שורה אחת */}
                  {summarize(p).map((line, i) => (
                    <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#1c1a16", lineHeight: 1.7 }}>· {line}</div>
                  ))}

                  {p.ranked.length > 0 && (
                    <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.6)", marginTop: 6, lineHeight: 1.7 }}>
                      דירג/ה: {p.ranked.map(dom).join(" › ")}
                      {p.domain ? ` · בחר/ה בסוף: ${dom(p.domain)}` : ""}
                    </div>
                  )}

                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,0.4)", margin: "14px 0 8px" }}>
                    הביקורים — מהאחרון לראשון, ובתוך כל ביקור לפי הסדר שקרה
                  </div>
                  {p.timeline.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.4)" }}>אין עדיין אירועים</div>}

                  {sessions(p.timeline).map((visit, vi) => {
                    const end = new Date(visit[0].at);
                    const start = new Date(visit[visit.length - 1].at);
                    const took = +end - +start;
                    return (
                      <div key={vi} style={{ marginTop: vi ? 12 : 0, borderRight: `2px solid ${vi === 0 ? ORANGE : "rgba(0,0,0,0.08)"}`, paddingRight: 10 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: NAVY, opacity: 0.7 }}>
                          {start.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" })}
                          {" · "}
                          <span style={{ direction: "ltr", display: "inline-block" }}>
                            {start.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {took > 60000 ? ` · ${minutes(took)}` : ""}
                        </div>
                        {compact(visit).reverse().map((e, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, padding: "3px 0", fontSize: 12.5, color: "rgba(0,0,0,0.72)", lineHeight: 1.6 }}>
                            <span style={{ color: "rgba(0,0,0,0.28)", flexShrink: 0, direction: "ltr", minWidth: 36 }}>
                              {new Date(e.at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span>{describe(e)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 12, fontSize: 11.5, color: "rgba(0,0,0,0.4)", lineHeight: 1.6 }}>
                    רצף צעדים באותה סימולציה מכווץ לשורה אחת. משך ביקור הוא הערכת חסר —
                    אין דרך לדעת כמה זמן הוא קרא אחרי הפעולה האחרונה.
                    <br />
                    טלפון יופיע כאן כשיהיה שדה טלפון — עד אז הזיהוי דרך השם והשלב.
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tab === "all" && data && (() => {
          const everyone = [...data.needsAttention, ...(data.quietList ?? [])]
            .sort((a, b) => (b.stage ?? 0) - (a.stage ?? 0));
          return everyone.map(p => {
            const isOpen = open === p.id;
            const doneCount = (p.checklist ?? []).filter(c => c.done).length;
            const total = (p.checklist ?? []).length || 9;
            return (
              <div key={p.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", marginBottom: 8, overflow: "hidden" }}>
                <button onClick={() => setOpen(isOpen ? null : p.id)}
                  style={{ width: "100%", textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: "#1c1a16" }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: "rgba(0,0,0,0.45)" }}>שלב {p.stage || "—"}</span>
                    {p.signals.length > 0 && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: "#b91c1c" }}>● {p.signals.length} סיגנלים</span>
                    )}
                    <span style={{ marginRight: "auto", fontSize: 11.5, fontWeight: 800, color: NAVY }}>
                      {doneCount}/{total}
                    </span>
                  </div>
                  {/* פס התקדמות דק — סריקה של שנייה על כל הרשימה */}
                  <div style={{ height: 4, borderRadius: 999, background: "rgba(0,0,0,0.06)", marginTop: 8 }}>
                    <div style={{ height: "100%", width: `${(doneCount / total) * 100}%`, borderRadius: 999, background: doneCount === total ? "#059669" : ORANGE }} />
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ paddingTop: 10 }}>
                      <Checklist items={p.checklist ?? []} />
                    </div>
                    {summarize(p).map((line, i2) => (
                      <div key={i2} style={{ fontSize: 12.5, fontWeight: 700, color: "#1c1a16", lineHeight: 1.7 }}>· {line}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()}

        {data && (
          <button onClick={() => load(code)} style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.14)", background: "#fff", color: NAVY, cursor: "pointer" }}>
            רענון
          </button>
        )}
      </div>
    </div>
  );
}
