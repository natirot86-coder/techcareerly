/**
 * GET /api/cron/duplicates — מסמן "חשד לכפילות" בלוח אינטק (src/lib/duplicates.ts).
 * `?dry` מחזיר כמה ודוגמאות בלי לכתוב. רץ בבדיקת הבוקר רק כש-DUP_MARK_LIVE=1
 * (אחרי שנתי אישר את ההרצה הראשונה).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { findDuplicates, markDuplicates } from "@/lib/duplicates";
import { phoneKey } from "@/lib/personIdentity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function runDuplicateMarks(dry: boolean) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return { error: "no db" };
  const { data } = await createClient(url, key, { auth: { persistSession: false } })
    .from("candidates").select("phone, phone_verified, is_test").eq("phone_verified", true);
  const verified = new Set((data ?? []).filter(c => !c.is_test).map(c => phoneKey(c.phone)).filter(Boolean));
  const groups = await findDuplicates(verified);
  if (!groups) return { error: "monday unavailable" };
  return markDuplicates(groups, { dry });
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runDuplicateMarks(req.nextUrl.searchParams.has("dry")));
}
