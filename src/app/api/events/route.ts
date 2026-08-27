/**
 * GET/POST /api/events — אירועים: ימים פתוחים, פאנלים, ירידי לימודים (נתי 27.8).
 *
 * הקריאה פתוחה (המועמד רואה אירועים), הכתיבה מאחורי COORDINATOR_CODE כמו
 * שאר לוחות הניהול. **התאריך מנהל:** ה-GET מחזיר רק אירועים שטרם עברו,
 * ולכן אירוע ישן נעלם מהמועמד מעצמו ואין מה לתחזק ידנית. הכל מאותה ישות
 * אחת — שיוך למוסד הוא שדה אופציונלי, לא סוג נפרד.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const client = db();
  if (!client) return NextResponse.json({ events: [] });

  // ?all=1 (עם קוד) — גם אירועים שעברו, לתחזוקה בלוח הניהול
  const wantAll = req.nextUrl.searchParams.get("all") === "1"
    && req.headers.get("x-coordinator-code") === process.env.COORDINATOR_CODE;

  let q = client.from("events").select("*").eq("active", true).order("starts_at");
  if (!wantAll) q = q.gte("starts_at", new Date().toISOString());

  const { data, error } = await q;
  if (error) return NextResponse.json({ events: [], error: error.message });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: NextRequest) {
  const code = process.env.COORDINATOR_CODE;
  if (!code) return NextResponse.json({ error: "COORDINATOR_CODE not configured" }, { status: 503 });
  if (req.headers.get("x-coordinator-code") !== code) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const client = db();
  if (!client) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const b = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!b?.id || !b?.title || !b?.starts_at) {
    return NextResponse.json({ error: "id, title, starts_at required" }, { status: 400 });
  }
  const { error } = await client.from("events").upsert({
    id: String(b.id),
    title: String(b.title),
    organizer: String(b.organizer ?? ""),
    starts_at: String(b.starts_at),
    city: String(b.city ?? ""),
    link: String(b.link ?? ""),
    note: String(b.note ?? ""),
    institution_id: String(b.institution_id ?? ""),
    active: b.active !== false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
