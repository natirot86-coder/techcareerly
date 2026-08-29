import { supabase, supabaseEnabled } from "./supabase";
import { isCohort, type CohortId } from "@/data/journey";

export type Candidate = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  region: string | null;
  tech_interest_score: number | null;
  blockers: string[];
  current_stage: number;
  status: "active" | "at_risk" | "manual_intervention";
  chosen_domain: string | null;
  domain_selected_at: string | null;
  onboarding_completed_at: string | null;
  last_active_at: string;
  created_at: string;
  /** main = הקהל הרחב · alumni = בוגרי הכשרה של טק-קריירה (28.8) */
  cohort: CohortId;
};

export type OnboardingInput = {
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "other";
  age: number;
  region: string;
  techInterestScore: number;
  blockers: string[];
};

/**
 * מבטיח session — אם אין משתמש מחובר, נכנס כ-Anonymous.
 * זה נותן auth.uid() יציב עוד לפני שיש Phone Auth (שלב "מה צריך מישראל").
 * כשיתחבר Phone Auth אמיתי, אפשר לשדרג את אותו anonymous user עם
 * supabase.auth.updateUser + verifyOtp בלי לאבד את ה-id/הנתונים.
 */
/**
 * נרמול טלפון ישראלי לפורמט אחד: 972XXXXXXXXX.
 * בלעדיו "050-1234567" מהאונבורדינג ו-"+972501234567" מטופס Cal הם
 * שתי מחרוזות שונות — ואז אף התאמה לא תעבוד.
 */
export function normalizePhone(raw: string | null | undefined): string {
  const d = (raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("972")) return d;
  if (d.startsWith("0")) return "972" + d.slice(1);
  return d.length === 9 ? "972" + d : d;
}

export async function ensureCandidateId(): Promise<string | null> {
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  let candidateId = session?.user?.id ?? null;

  if (!candidateId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      console.error("ensureCandidateId failed", error);
      return null;
    }
    candidateId = data.user.id;
  }

  // כל טבלה תלויה (domain_rankings, tasks וכו') מצביעה ל-candidates.id — מבטיחים שהשורה קיימת
  // לפני שקוראים חוזר, כדי שלא ניפול על foreign key violation אם saveOnboarding עוד לא רץ.
  const { error: ensureError } = await supabase
    .from("candidates")
    .upsert({ id: candidateId }, { onConflict: "id", ignoreDuplicates: true });

  /*
   * הטלפון מ-Phone Auth יורד ל-candidates מנורמל — הוא המפתח שמאפשר
   * ל-webhook של Cal להתאים הזמנה למועמד. נכתב פעם אחת לכל מכשיר.
   */
  const authPhone = normalizePhone(session?.user?.phone);
  if (authPhone) {
    try {
      if (localStorage.getItem("phone-synced") !== authPhone) {
        await supabase.from("candidates").update({ phone: authPhone }).eq("id", candidateId);
        localStorage.setItem("phone-synced", authPhone);
      }
    } catch { /* ignore */ }
  }
  // אובייקט גולמי מתקפל ל-{} ב-overlay של Next — מדפיסים מחרוזת כדי שהשדות תמיד יראו
  if (ensureError) console.error(
    `ensureCandidateId: failed to ensure candidates row — code=${ensureError.code} message=${ensureError.message} details=${ensureError.details} hint=${ensureError.hint}`
  );

  return candidateId;
}

/* ─── קוהורט (28.8) ──────────────────────────────────────────────────────────
 *
 * מקור האמת הוא `candidates.cohort` בשרת. localStorage הוא **מטמון בלבד**:
 * הדליפה המסוכנת אינה הקישור (הוא עובר בוואטסאפ ותמיד ידלוף) אלא איבוד
 * הקוהורט באמצע המסע — ניקוי דפדפן או מכשיר חדש — שהיה מקפיץ אדם באמצע
 * פיילוט חזרה לשישה שלבים ולטאב טעימות. לכן קוראים מהשרת ומרעננים מטמון.
 *
 * הקריאה סינכרונית בכוונה: מסך שממתין לרשת כדי לדעת כמה שלבים לצייר היה
 * מהבהב. ברירת המחדל main, כלומר ההתנהגות הקיימת בדיוק.
 */
export function cachedCohort(): CohortId {
  try {
    const v = localStorage.getItem("cohort");
    return isCohort(v) ? v : "main";
  } catch { return "main"; }
}

/** מרענן את המטמון מהשרת. רץ ברקע ואינו חוסם רינדור */
export async function refreshCohort(): Promise<CohortId> {
  const c = await getCandidate();
  const v = isCohort(c?.cohort) ? c!.cohort : "main";
  try { localStorage.setItem("cohort", v); } catch { /* ignore */ }
  return v;
}

export async function getCandidate(): Promise<Candidate | null> {
  if (!supabase) return null;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return null;

  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle();

  if (error) {
    console.error("getCandidate failed", error);
    return null;
  }
  return data as Candidate | null;
}

export async function saveOnboarding(input: OnboardingInput): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;

  // שיוך מקישור אישי של רכזת (?coord=) — נקבע כבר בהרשמה, מאנדיי גובר בהמשך
  let coordinatorId: string | null = null;
  try { coordinatorId = localStorage.getItem("assigned-coord"); } catch { /* ignore */ }

  const { error } = await supabase.from("candidates").upsert({
    id: candidateId,
    ...(coordinatorId ? { coordinator_id: coordinatorId } : {}),
    first_name: input.firstName,
    last_name: input.lastName,
    gender: input.gender,
    age: input.age,
    region: input.region,
    tech_interest_score: input.techInterestScore,
    blockers: input.blockers,
    onboarding_completed_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  });

  if (error) console.error("saveOnboarding failed", error);
}

export async function updateCurrentStage(stage: number): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;

  const { error } = await supabase
    .from("candidates")
    .update({ current_stage: stage, last_active_at: new Date().toISOString() })
    .eq("id", candidateId);

  if (error) console.error("updateCurrentStage failed", error);
}

export async function getDomainRankings(): Promise<string[]> {
  if (!supabase) return [];
  const candidateId = await ensureCandidateId();
  if (!candidateId) return [];

  const { data, error } = await supabase
    .from("domain_rankings")
    .select("domain_id, rank")
    .eq("candidate_id", candidateId)
    .order("rank", { ascending: true });

  if (error) {
    console.error("getDomainRankings failed", error);
    return [];
  }
  return (data ?? []).map((row: { domain_id: string }) => row.domain_id);
}

export async function saveDomainRankings(domainIds: string[]): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;

  await supabase.from("domain_rankings").delete().eq("candidate_id", candidateId);

  if (domainIds.length === 0) return;

  const { error } = await supabase.from("domain_rankings").insert(
    domainIds.map((domainId, index) => ({
      candidate_id: candidateId,
      domain_id: domainId,
      rank: index + 1,
    }))
  );

  if (error) console.error("saveDomainRankings failed", error);
}

/**
 * שומר את התחום שנבחר דרך POST /api/domain-choice.
 * שולח את ה-access token של הסשן הנוכחי כדי שהשרת יזהה את המשתמש ויעדכן ב-Supabase.
 */
export async function saveChosenDomain(domainId: string): Promise<string | null> {
  if (!supabase) return "Supabase לא מוגדר — חסרים משתני סביבה";

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return "אין סשן פעיל";

  const response = await fetch("/api/domain-choice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domainId, accessToken: session.access_token }),
  });

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: "שגיאה בשמירת התחום" }));
    return error ?? "שגיאה בשמירת התחום";
  }
  return null;
}

/**
 * שולח קוד OTP למספר טלפון.
 * אם המשתמש הנוכחי הוא anonymous (למשל עשה Onboarding בלי להתחבר) —
 * שולחים דרך updateUser כדי לשדרג את אותו משתמש במקום, ולשמור על ה-id
 * (וכל הנתונים המקושרים אליו) בלי לאבד כלום.
 */
export async function sendPhoneOtp(phone: string): Promise<string | null> {
  if (!supabase) return "Supabase לא מוגדר — חסרים משתני סביבה";

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({ phone });
    return error?.message ?? null;
  }

  const { error } = await supabase.auth.signInWithOtp({ phone });
  return error?.message ?? null;
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<string | null> {
  if (!supabase) return "Supabase לא מוגדר — חסרים משתני סביבה";

  const { data: { session } } = await supabase.auth.getSession();
  const type = session?.user?.is_anonymous ? "phone_change" : "sms";

  const { error } = await supabase.auth.verifyOtp({ phone, token, type });
  return error?.message ?? null;
}

export async function isAnonymousSession(): Promise<boolean> {
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  return Boolean(session?.user?.is_anonymous);
}

/**
 * כניסה עם Google — מפנה לגוגל ואז חוזרת ל-redirectTo כשה-session כבר מוכן.
 * אם יש session אנונימי (המצב הרגיל לפני התחברות), מקשרים את חשבון Google
 * אליו עם linkIdentity במקום signInWithOAuth — בדיוק כמו phone_change אצל
 * sendPhoneOtp — כדי לשדרג את אותו משתמש בלי לאבד את ה-id והנתונים שלו.
 */
export async function signInWithGoogle(redirectTo: string): Promise<string | null> {
  if (!supabase) return "Supabase לא מוגדר — חסרים משתני סביבה";

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user?.is_anonymous) {
    const { error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } });
    return error?.message ?? null;
  }

  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  return error?.message ?? null;
}

export const supabaseReady = supabaseEnabled;

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type Task = {
  id: string;
  candidate_id: string;
  stage: number;
  task_key: string;
  label: string;
  status: "pending" | "in-progress" | "done";
  progress: number;
  fail_count: number;
};

// Default tasks to seed per stage on first visit
const STAGE_TASKS: Record<number, Array<{ task_key: string; label: string; status: Task["status"]; progress: number }>> = {
  1: [
    { task_key: "app-download",       label: "הורדת האפליקציה",           status: "done",        progress: 100 },
    { task_key: "base-questionnaire", label: "מילוי שאלון בסיס",           status: "done",        progress: 100 },
    { task_key: "awaiting-approval",  label: "המתנה לאישור הרכזת",         status: "in-progress", progress: 0   },
  ],
  2: [
    { task_key: "intake-meeting",   label: "הגעה למפגש הפתיחה",            status: "pending", progress: 0 },
    { task_key: "roadmap-signing",  label: "חתימה על מפת הדרכים האישית",   status: "pending", progress: 0 },
  ],
  3: [
    { task_key: "sim-code",    label: "השלמת סימולציית קוד",   status: "pending", progress: 0 },
    { task_key: "sim-data",    label: "השלמת סימולציית דאטה",  status: "pending", progress: 0 },
    { task_key: "sim-cyber",   label: "השלמת סימולציית סייבר", status: "pending", progress: 0 },
    { task_key: "sim-ai",      label: "השלמת סימולציית AI",    status: "pending", progress: 0 },
    { task_key: "sim-ux",      label: "השלמת סימולציית UX",    status: "pending", progress: 0 },
    { task_key: "sim-marketing", label: "השלמת סימולציית מרקטינג", status: "pending", progress: 0 },
  ],
  4: [
    { task_key: "research-institutes", label: "חקר מוסדות לימוד",            status: "pending", progress: 0 },
    { task_key: "compare-programs",    label: "השוואת תוכניות לימוד",         status: "pending", progress: 0 },
    { task_key: "third-meeting",       label: "מפגש שלישי עם הרכזת",          status: "pending", progress: 0 },
  ],
  5: [
    { task_key: "scholarship-check", label: "בדיקת זכאות למלגה",       status: "pending", progress: 0 },
    { task_key: "financial-docs",    label: "הכנת מסמכים פיננסיים",     status: "pending", progress: 0 },
    { task_key: "contact-institute", label: "יצירת קשר עם המוסד",       status: "pending", progress: 0 },
  ],
  6: [
    { task_key: "final-registration", label: "אימות רישום סופי", status: "pending", progress: 0 },
  ],
};

/**
 * Seed default tasks for a stage if none exist, then return all tasks for that stage.
 */
export async function getTasks(stage: number): Promise<Task[]> {
  if (!supabase) return [];
  const candidateId = await ensureCandidateId();
  if (!candidateId) return [];

  const defaults = STAGE_TASKS[stage] ?? [];

  // Upsert defaults — ignore if already exist (on_conflict = task_key per candidate)
  if (defaults.length > 0) {
    await supabase.from("tasks").upsert(
      defaults.map((t) => ({
        candidate_id: candidateId,
        stage,
        task_key: t.task_key,
        label: t.label,
        status: t.status,
        progress: t.progress,
      })),
      { onConflict: "candidate_id,task_key", ignoreDuplicates: true }
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("stage", stage)
    .order("updated_at", { ascending: true });

  if (error) { console.error("getTasks failed", error); return []; }
  return (data ?? []) as Task[];
}

export async function updateTask(
  taskKey: string,
  status: Task["status"],
  progress?: number
): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (progress !== undefined) patch.progress = progress;

  const { error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("candidate_id", candidateId)
    .eq("task_key", taskKey);

  if (error) console.error("updateTask failed", error);
}

// ─── Simulation progress ─────────────────────────────────────────────────────

export type SimProgress = {
  domain_id: string;
  step: number;
  completed: boolean;
  score: number | null;
};

export async function getSimulationProgress(domainId: string): Promise<SimProgress | null> {
  if (!supabase) return null;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return null;

  const { data, error } = await supabase
    .from("simulation_progress")
    .select("domain_id, step, completed, score")
    .eq("candidate_id", candidateId)
    .eq("domain_id", domainId)
    .maybeSingle();

  if (error) { console.error("getSimulationProgress failed", error); return null; }
  return data as SimProgress | null;
}

export async function saveSimulationProgress(
  domainId: string,
  step: number,
  completed: boolean,
  score?: number
): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;

  const { error } = await supabase.from("simulation_progress").upsert({
    candidate_id: candidateId,
    domain_id: domainId,
    step,
    completed,
    score: score ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "candidate_id,domain_id" });

  if (error) console.error("saveSimulationProgress failed", error);
}

// ─── Stage 3-5 sync + funnel events (14.8.2026, אחרי המיגרציה) ────────────────

/**
 * אירוע פאנל — fire-and-forget. לעולם לא מפיל את ה-UI: מדידה היא תוצר
 * לוואי, לא תנאי. זה מה שממלא את funnel_events שדף האנליטיקות קורא.
 */
export function logEvent(name: string, props: Record<string, unknown> = {}): void {
  if (!supabase) return;
  ensureCandidateId().then(candidateId => {
    if (!candidateId) return;
    supabase!.from("funnel_events")
      .insert({ candidate_id: candidateId, name, props })
      .then(({ error }) => { if (error) console.error("logEvent failed", error); });
  });
}

/**
 * נגיעה — "מתי האדם היה כאן בפעם האחרונה".
 *
 * נקרא מ-ResumeTracker בכל ניווט, כלומר גם עצם פתיחת האפליקציה נספרת.
 * **מרוסן לפעם בשעה** דרך חותמת ב-localStorage: אנחנו סופרים ימים, לא
 * לחיצות, ואין שום סיבה לכתוב לבסיס הנתונים על כל מסך.
 *
 * למה זה קיים בכלל: עד היום last_active_at התעדכן רק בהרשמה ובמעבר שלב,
 * כך שמי שנכנס כל יום ולא עבר שלב נראה לרכזת כאילו נעלם מיום ההרשמה.
 * הסיגנל שנראה הכי אמין במסך היה בעצם השקרי ביותר.
 *
 * הערה על השעון: הזמן נכתב מהמכשיר, ואצל חלק מהאנשים הוא שגוי. לכן
 * /api/coordinator לוקח את המקסימום בין השדה הזה לבין האירוע האחרון
 * ב-funnel_events, שמקבל חותמת מהשרת.
 */
const TOUCH_KEY = "last-touch-at";
const TOUCH_EVERY_MS = 60 * 60 * 1000;

/**
 * סנכרון התקדמות הטעימות לשרת (נתי 20.8 — מפת המסע של הרכזת).
 *
 * סיום day/mystery/experience נכתב עד היום רק ל-localStorage, ולכן מפה
 * שתציג אותו אצל הרכזת הייתה מציגה ריק גם למי שסיים. במקום לתקן שנים-עשר
 * כפתורי "מיציתי" שונים — נקודת סנכרון אחת שרואה את הדגלים מכל תחום,
 * מדווחת רק הפרשים (taste_done), ותופסת רטרואקטיבית גם השלמות עבר.
 */
export function syncTasteProgress(): void {
  if (!supabase || typeof window === "undefined") return;
  try {
    const domains = ["code", "data", "cyber", "networks", "hardware", "ai", "ux", "marketing", "qa"];
    const steps = ["sim", "day", "mystery", "experience", "analytics"];
    const synced: Record<string, boolean> = JSON.parse(localStorage.getItem("taste-synced") ?? "{}");
    let changed = false;
    for (const d of domains) {
      const raw = localStorage.getItem(`${d}-journey`);
      if (!raw) continue;
      const j = JSON.parse(raw) as Record<string, unknown>;
      for (const step of steps) {
        const key = `${d}.${step}`;
        if (j[step] === true && !synced[key]) {
          logEvent("taste_done", { domain: d, step });
          synced[key] = true;
          changed = true;
        }
      }
    }
    if (changed) localStorage.setItem("taste-synced", JSON.stringify(synced));
  } catch { /* ignore */ }
}

export function touchActivity(): void {
  if (!supabase || typeof window === "undefined") return;
  try {
    const prev = Number(localStorage.getItem(TOUCH_KEY) ?? 0);
    if (Date.now() - prev < TOUCH_EVERY_MS) return;
    localStorage.setItem(TOUCH_KEY, String(Date.now()));
  } catch { /* מצב פרטי — ממשיכים בלי ריסון */ }

  ensureCandidateId().then(candidateId => {
    if (!candidateId) return;
    supabase!.from("candidates")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", candidateId)
      .then(({ error }) => { if (error) console.error("touchActivity failed", error); });
  });
}

/** ציוני SCCT מכלי עיבוד החוויה. הסקאלות באפליקציה הן 1–5 */
export async function saveScctScore(
  domainId: string,
  interest: number | null,
  selfEfficacy: number | null,
  outcomeExpect: number | null,
  note?: string
): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;
  const { error } = await supabase.from("scct_scores").upsert({
    candidate_id: candidateId,
    domain_id: domainId,
    interest: interest ?? null,
    self_efficacy: selfEfficacy ?? null,
    outcome_expect: outcomeExpect ?? null,
    note: note ?? null,
  }, { onConflict: "candidate_id,domain_id" });
  if (error) console.error("saveScctScore failed", error);
}

/** שלב 4 — התשובות, ההמלצה והרשימה. upsert על שורת המועמד */
export async function savePathsAnswers(patch: {
  answers?: Record<string, string>;
  recommendation?: "degree" | "mahat" | "bootcamp";
  scores?: Record<string, number>;
  shortlist?: unknown[];
  research?: Record<string, unknown>;
  completed?: boolean;
}): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;
  const row: Record<string, unknown> = { candidate_id: candidateId, updated_at: new Date().toISOString() };
  if (patch.answers) row.answers = patch.answers;
  if (patch.recommendation) row.recommendation = patch.recommendation;
  if (patch.scores) row.scores = patch.scores;
  if (patch.shortlist) row.shortlist = patch.shortlist;
  if (patch.research) row.research = patch.research;
  if (patch.completed) row.completed_at = new Date().toISOString();
  const { error } = await supabase.from("paths_answers").upsert(row, { onConflict: "candidate_id" });
  if (error) console.error("savePathsAnswers failed", error);
}

/**
 * הרכזת של המועמד — מה-DB (טבלת coordinators + השיוך בשורת המועמד).
 * בלי שיוך — הרכזת הפעילה הראשונה. RLS מתיר למועמד לקרוא רכזות פעילות.
 */
export type MyCoordinator = {
  name: string;
  phone: string;
  /** קישורי Cal פר-פגישה (מה שאחרי cal.com/). ריק = לרכזת אין יומן משלה — נופלים לברירת המחדל */
  calLinks: { 1: string; 2: string; 3: string };
};

export async function myCoordinator(): Promise<MyCoordinator | null> {
  if (!supabase) return null;
  try {
    const candidateId = await ensureCandidateId();
    if (!candidateId) return null;
    const { data: rows } = await supabase
      .from("coordinators")
      .select("id, name, phone, cal_m1, cal_m2, cal_m3")
      .eq("active", true)
      .order("created_at");
    if (!rows?.length) return null;
    const { data: cand } = await supabase
      .from("candidates")
      .select("coordinator_id")
      .eq("id", candidateId)
      .maybeSingle();
    const mine = cand?.coordinator_id ? rows.find(r => r.id === cand.coordinator_id) : null;
    const row = mine ?? rows[0];
    /* נרמול לוואטסאפ: מקבלים 050... או 972... — ומחזירים תמיד בינלאומי */
    const digits = (row.phone ?? "").replace(/\D/g, "");
    const phone = digits.startsWith("0") ? "972" + digits.slice(1) : digits;
    return {
      name: row.name ?? "",
      phone,
      calLinks: { 1: row.cal_m1 ?? "", 2: row.cal_m2 ?? "", 3: row.cal_m3 ?? "" },
    };
  } catch {
    return null;
  }
}

/**
 * אישור הלימודים — המסמך היחיד שאנחנו כן שומרים (נתי 20.8): האסמכתא
 * שמשרד העבודה דורש. כל מועמד כותב רק לתיקייה של עצמו (RLS לפי auth.uid).
 */
export async function uploadEnrollmentDoc(file: File): Promise<string | null> {
  if (!supabase) return null;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return null;
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${candidateId}/enrollment-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("enrollment-docs").upload(path, file, { upsert: true });
  if (error) { console.error("uploadEnrollmentDoc failed", error); return null; }
  logEvent("enrollment_doc_uploaded", {});
  try { localStorage.setItem("enrollment-doc-path", path); } catch { }
  return path;
}

/** קישור חתום לצפייה חוזרת — שעה אחת, מספיק לפתיחה */
export async function enrollmentDocUrl(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const path = localStorage.getItem("enrollment-doc-path");
    if (!path) return null;
    const { data, error } = await supabase.storage.from("enrollment-docs").createSignedUrl(path, 3600);
    if (error) { console.error("enrollmentDocUrl failed", error); return null; }
    return data.signedUrl;
  } catch { return null; }
}

/** הכיוון שנבחר בשער שלב 4 — עד שני תחומים, מופרדים בפסיק */
export async function saveChosenDomains(domains: string[]): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;
  const { error } = await supabase
    .from("candidates")
    .update({ chosen_domain: domains.join(",") })
    .eq("id", candidateId);
  if (error) console.error("saveChosenDomains failed", error);
}

/**
 * שלב 5 — סנכרון המשימות. localStorage נשאר מקור האמת המקומי; זה השיקוף
 * שהרכזת והאנליטיקות רואים.
 *
 * **עודכן 17.8: upsert במקום מחיקה-והכנסה.** הגרסה הקודמת מחקה את כל
 * השורות בכל שמירה, ולכן open_count התאפס בכל פעם — כלומר הסיגנל
 * "נפתחה שלוש פעמים ולא נסגרה" לא יכול היה לירות גם אם מישהו היה סופר.
 * שורות שנמחקו מקומית עדיין נמחקות, אבל לפי הפרש ולא בגריפה.
 */
export async function syncPlanTasks(tasks: Array<{
  id: string; title: string; note?: string; area: string;
  due: string | null; source: string; status: string;
  openCount?: number; doneAt?: string | null;
}>): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;

  if (tasks.length) {
    const { error } = await supabase.from("plan_tasks").upsert(tasks.map(t => ({
      candidate_id: candidateId,
      id: t.id,
      title: t.title,
      note: t.note ?? null,
      area: t.area,
      due_date: t.due ? t.due.slice(0, 10) : null,
      source: t.source,
      status: t.status,
      open_count: t.openCount ?? 0,
      // מתי נסגרה בפועל — לא מתי סונכרנה
      done_at: t.status === "done" ? (t.doneAt ?? new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    })), { onConflict: "candidate_id,id" });
    if (error) console.error("syncPlanTasks upsert failed", error);
  }

  // מה שנמחק מקומית — נמחק גם כאן, אבל רק הוא
  const { data: existing } = await supabase
    .from("plan_tasks").select("id").eq("candidate_id", candidateId);
  const local = new Set(tasks.map(t => t.id));
  const stale = (existing ?? []).map(r => r.id as string).filter(id => !local.has(id));
  if (stale.length) {
    await supabase.from("plan_tasks").delete().eq("candidate_id", candidateId).in("id", stale);
  }
}

export async function syncPlanDocuments(docs: Array<{
  id: string; name: string; have: boolean; locations: string[];
}>): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;
  await supabase.from("plan_documents").delete().eq("candidate_id", candidateId);
  if (!docs.length) return;
  const { error } = await supabase.from("plan_documents").insert(
    docs.map(d => ({ candidate_id: candidateId, id: d.id, name: d.name, have: d.have, locations: d.locations }))
  );
  if (error) console.error("syncPlanDocuments failed", error);
}

export async function syncPlanApplications(apps: Record<string, string>): Promise<void> {
  if (!supabase) return;
  const candidateId = await ensureCandidateId();
  if (!candidateId) return;
  const rows = Object.entries(apps).map(([fundingId, status]) => ({
    candidate_id: candidateId,
    funding_id: fundingId,
    status,
    decided_at: status === "accepted" || status === "rejected" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }));
  if (!rows.length) return;
  const { error } = await supabase.from("plan_applications")
    .upsert(rows, { onConflict: "candidate_id,funding_id" });
  if (error) console.error("syncPlanApplications failed", error);
}
