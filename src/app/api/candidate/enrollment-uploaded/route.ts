/**
 * /api/candidate/enrollment-uploaded — אישור לימודים הועלה ⇐ "נרשמ/ה ללימודים" בלוח (נתי, 23.11).
 *
 * POST (משתתף/ת, Bearer): נקרא מיד אחרי ההעלאה. **לא סומך על הלקוח:** בודק
 * בעצמו שיש קובץ בתיקייה של המשתמש/ת ושהטלפון אומת, ורק אז כותב ללוח.
 * GET (CRON_SECRET): כל מי שכבר העלה/תה — `?dry` מחזיר מה *היה* משתנה,
 * בלעדיו כותב. אותה פונקציה בשני המסלולים.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mondayMarkEnrolled } from "@/lib/monday";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function admin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function hasDoc(db: SupabaseClient, userId: string) {
  const { data } = await db.storage.from("enrollment-docs").list(userId, { limit: 1 });
  return !!data?.length;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const db = admin();
  if (!token || !db) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!user.phone_confirmed_at) return NextResponse.json({ ok: true, skipped: "phone not verified" });
  if (!(await hasDoc(db, user.id))) return NextResponse.json({ ok: true, skipped: "no document" });
  const { data: c } = await db.from("candidates").select("is_test").eq("id", user.id).maybeSingle();
  if (c?.is_test) return NextResponse.json({ ok: true, skipped: "test" });
  const res = await mondayMarkEnrolled({ phone: user.phone, email: user.email });
  return NextResponse.json({ ok: !!res, ...(res ?? { result: "monday unavailable" }) });
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await syncEnrollments(req.nextUrl.searchParams.has("dry")));
}

/** כל מי שהעלה/תה אישור — גם מבדיקת הבוקר, למקרה שהקריאה אחרי ההעלאה נכשלה */
export async function syncEnrollments(dry: boolean) {
  const db = admin();
  if (!db) return { skipped: "no db" };
  const { data: folders } = await db.storage.from("enrollment-docs").list("", { limit: 1000 });
  const out: { result: string; from?: string }[] = [];
  for (const f of folders ?? []) {
    if (!(await hasDoc(db, f.name))) continue;
    const { data: u } = await db.auth.admin.getUserById(f.name);
    if (!u?.user?.phone_confirmed_at) { out.push({ result: "phone not verified" }); continue; }
    const { data: c } = await db.from("candidates").select("is_test").eq("id", f.name).maybeSingle();
    if (c?.is_test) { out.push({ result: "test" }); continue; }
    const r = await mondayMarkEnrolled({ phone: u.user.phone, email: u.user.email, dry });
    out.push({ result: r?.result ?? "monday unavailable", from: r?.from });
  }
  return { dry, withDocs: out.length, results: out };
}
