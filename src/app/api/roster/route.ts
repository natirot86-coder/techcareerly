/**
 * GET/POST /api/roster — סגל הרכזות מה-DB (נתי 23.8: בלי JSON, צוות לא-טכני).
 *
 * שער גישה: verifyCoordinator (7.9) — קוד חירום משותף, או זהות אישית
 * מ-OTP. הקריאה והכתיבה בצד שרת עם המפתח הסודי; המועמדים קוראים רכזות
 * פעילות ישירות דרך RLS.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCoordinator } from "@/lib/serverCoordinatorAuth";

export const dynamic = "force-dynamic";

async function gate(req: NextRequest) {
  const auth = await verifyCoordinator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return null;
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const blocked = await gate(req);
  if (blocked) return blocked;
  const client = db();
  if (!client) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });
  const { data, error } = await client.from("coordinators").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roster: data ?? [] });
}

export async function POST(req: NextRequest) {
  const blocked = await gate(req);
  if (blocked) return blocked;
  const client = db();
  if (!client) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as {
    id?: string; name?: string; location?: string; email?: string; phone?: string; active?: boolean;
    cal_m1?: string; cal_m2?: string; cal_m3?: string;
  } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await client.from("coordinators").upsert({
    id: body.id,
    name: body.name ?? "",
    location: body.location ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    active: body.active ?? true,
    // קישורי Cal פר-פגישה — מה שבא אחרי cal.com/ . המועמד המשויך מקבל את היומן של הרכזת שלו
    cal_m1: body.cal_m1 ?? "",
    cal_m2: body.cal_m2 ?? "",
    cal_m3: body.cal_m3 ?? "",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
