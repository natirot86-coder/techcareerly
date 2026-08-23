/**
 * GET/POST /api/roster — סגל הרכזות מה-DB (נתי 23.8: בלי JSON, צוות לא-טכני).
 *
 * אותו שער גישה כמו מסך הרכזת (COORDINATOR_CODE). הקריאה והכתיבה בצד שרת
 * עם המפתח הסודי; המועמדים קוראים רכזות פעילות ישירות דרך RLS.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function gate(req: NextRequest) {
  const code = process.env.COORDINATOR_CODE;
  if (!code) return NextResponse.json({ error: "COORDINATOR_CODE not configured" }, { status: 503 });
  if (req.headers.get("x-coordinator-code") !== code) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const client = db();
  if (!client) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });
  const { data, error } = await client.from("coordinators").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roster: data ?? [] });
}

export async function POST(req: NextRequest) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const client = db();
  if (!client) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as {
    id?: string; name?: string; location?: string; email?: string; phone?: string; active?: boolean;
  } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await client.from("coordinators").upsert({
    id: body.id,
    name: body.name ?? "",
    location: body.location ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    active: body.active ?? true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
