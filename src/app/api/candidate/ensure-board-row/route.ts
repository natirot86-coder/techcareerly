/**
 * POST /api/candidate/ensure-board-row — נקרא מהדפדפן מיד אחרי שמירת ההרשמה.
 * מי שאימת/ה טלפון ואין לו/ה שורה בלוח אינטק — מקבל/ת אחת, כדי שרכז/ת יראו
 * אותו/ה (ראה src/lib/ensureBoardRows.ts). הזהות מהטוקן בלבד: אי אפשר לבקש
 * שורה בשם מישהו אחר.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureBoardRowFor } from "@/lib/ensureBoardRows";
import { syncAdminLinks } from "@/lib/adminLinks";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon || !secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: { user } } = await createClient(url, anon).auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const res = await ensureBoardRowFor(db, user.id);
  /* קישור למסך הרכזים בשורה — מיד, ולא רק בבוקר (23.11) */
  if (process.env.ADMIN_LINKS_LIVE === "1") await syncAdminLinks(db, { dry: false, candidateId: user.id });
  return NextResponse.json({ ok: !!res, ...(res ?? { result: "monday unavailable" }) });
}
