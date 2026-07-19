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
  return (data ?? []).map((row) => row.domain_id);
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
