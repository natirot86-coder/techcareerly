/**
 * GET /api/cron/ensure-board-rows — כל מאומת/ת שאין לו/ה שורה בלוח אינטק
 * מקבל/ת אחת (ראה src/lib/ensureBoardRows.ts). רץ גם מתוך reconcile-main;
 * כאן נפרד בשביל הרצה ידנית: `?dry` מחזיר מי *היה* נוצר, `?limit=1` הדרגתי.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureAllVerifiedOnBoard } from "@/lib/ensureBoardRows";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return NextResponse.json({ error: "no db" }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const p = req.nextUrl.searchParams;
  const limit = p.get("limit");
  return NextResponse.json(await ensureAllVerifiedOnBoard(db, {
    dry: p.has("dry"),
    limit: limit === null ? undefined : Number(limit) || undefined,
  }));
}
