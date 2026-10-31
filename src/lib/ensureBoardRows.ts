/**
 * src/lib/ensureBoardRows.ts — כל מי שאימת/ה טלפון נמצא/ת בלוח אינטק (נתי, 31.10).
 *
 * שתי קריאות לאותה פונקציה: מיד אחרי שמירת ההרשמה (/api/candidate/ensure-board-row)
 * ובבדיקת הבוקר (reconcile-main). אירוע יכול להתפספס — הבדיקה היא ההגנה.
 * רק מאומתים ורק לא-בדיקה: סשן אנונימי אינו אדם, ושורה בלוח היא התחייבות
 * של רכז/ת להרים טלפון.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { mondayEnsureParticipant } from "@/lib/monday";

type Cand = {
  id: string; first_name: string | null; last_name: string | null; phone: string | null;
  gender: string | null; city: string | null; coordinator_id: string | null; created_at: string;
};
const COLS = "id, first_name, last_name, phone, gender, city, coordinator_id, created_at";

async function coordinatorNames(db: SupabaseClient) {
  const { data } = await db.from("coordinators").select("id, name");
  return new Map((data ?? []).map(r => [r.id as string, r.name as string]));
}

async function ensureOne(db: SupabaseClient, c: Cand, coordNames: Map<string, string>, dry = false) {
  if (!c.phone) return { result: "skipped" as const };
  const { data: u } = await db.auth.admin.getUserById(c.id);
  return mondayEnsureParticipant({
    phone: c.phone,
    email: u?.user?.email ?? null,
    name: [c.first_name, c.last_name].filter(Boolean).join(" "),
    coordinatorName: c.coordinator_id ? coordNames.get(c.coordinator_id) ?? null : null,
    gender: c.gender, city: c.city, when: c.created_at, dry,
  });
}

/** אחרי הרשמה — רק אם הטלפון אומת באמת (auth.users), לא "יש טלפון בשורה" */
export async function ensureBoardRowFor(db: SupabaseClient, candidateId: string) {
  const { data: u } = await db.auth.admin.getUserById(candidateId);
  if (!u?.user?.phone_confirmed_at) return { result: "skipped" as const, why: "phone not verified" };
  const { data: c } = await db.from("candidates").select(`${COLS}, is_test`).eq("id", candidateId).maybeSingle();
  if (!c || c.is_test) return { result: "skipped" as const, why: c ? "test" : "no candidate" };
  return ensureOne(db, c as Cand, await coordinatorNames(db));
}

/** בדיקת הבוקר — `dry` מחזיר מי *היה* נוצר; `limit` לכתיבה הדרגתית */
export async function ensureAllVerifiedOnBoard(db: SupabaseClient, opts: { dry: boolean; limit?: number }) {
  const { data } = await db.from("candidates").select(COLS)
    .eq("phone_verified", true).eq("is_test", false).not("phone", "is", null);
  const names = await coordinatorNames(db);
  const out = { checked: 0, created: [] as string[], wouldCreate: [] as string[], failed: [] as string[] };
  for (const c of (data ?? []) as Cand[]) {
    if (opts.limit !== undefined && out.created.length >= opts.limit) break;
    out.checked++;
    const r = await ensureOne(db, c, names, opts.dry);
    if (!r) out.failed.push(c.id);
    else if (r.result === "would-create") out.wouldCreate.push(c.first_name ?? c.id);
    else if (r.result === "created") out.created.push(c.first_name ?? c.id);
  }
  return out;
}
