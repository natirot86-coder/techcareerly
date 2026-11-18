/**
 * GET /api/cron/bounces — מיילי פתיחה שחזרו (ראה src/lib/bounces.ts).
 * רץ כל בוקר מתוך reconcile-main (3 ימים אחורה); כאן להרצה ידנית:
 * `?days=30` חלון · `?dry` מחזיר מה *היה* נכתב.
 */
import { NextRequest, NextResponse } from "next/server";
import { scanBounces } from "@/lib/bounces";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const p = req.nextUrl.searchParams;
  return NextResponse.json(await scanBounces({ days: Number(p.get("days")) || 3, dry: p.has("dry") }));
}
