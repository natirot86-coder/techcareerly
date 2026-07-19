import { supabase, supabaseEnabled } from "./supabase";

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
export async function ensureCandidateId(): Promise<string | null> {
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("ensureCandidateId failed", error);
    return null;
  }
  return data.user.id;
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

  const { error } = await supabase.from("candidates").upsert({
    id: candidateId,
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
