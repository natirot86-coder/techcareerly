/**
 * POST /api/candidate/ensure-board-row — נקרא מהדפדפן מיד אחרי שמירת ההרשמה.
 * מי שאימת/ה טלפון ואין לו/ה שורה בלוח אינטק — מקבל/ת אחת, כדי שרכז/ת יראו
 * אותו/ה (ראה src/lib/ensureBoardRows.ts). הזהות מהטוקן בלבד: אי אפשר לבקש
 * שורה בשם מישהו אחר.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureBoardRowFor } from "@/lib/ensureBoardRows";

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
  return NextResponse.json({ ok: !!res, ...(res ?? { result: "monday unavailable" }) });
}
