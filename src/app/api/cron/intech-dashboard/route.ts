/**
 * GET /api/cron/intech-dashboard — מחשב את יעדי In-Tech וכותב ללוח הניהול
 * במאנדיי (ראה src/lib/intechDashboard.ts). רץ כל בוקר מתוך reconcile-main,
 * אחרי קליטת ההיסטוריה. `?dry` — מחזיר את השורות בלי לכתוב.
 */
import { NextRequest, NextResponse } from "next/server";
import { writeDashboard } from "@/lib/intechDashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await writeDashboard({ dry: req.nextUrl.searchParams.has("dry") }));
}
