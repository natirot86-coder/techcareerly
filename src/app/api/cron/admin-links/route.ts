/**
 * GET /api/cron/admin-links — "פתח במסך הרכזים" בלוח אינטק (ראה src/lib/adminLinks.ts).
 * רץ גם מתוך reconcile-main (כש-ADMIN_LINKS_LIVE=1); כאן להרצה ידנית:
 * `?dry` — כמה שורות היו נכתבות + 5 דוגמאות · `?limit=1` — כתיבה הדרגתית.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncAdminLinks } from "@/lib/adminLinks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return NextResponse.json({ error: "no db" }, { status: 503 });
  const p = req.nextUrl.searchParams;
  const limit = p.get("limit");
  return NextResponse.json(await syncAdminLinks(createClient(url, key, { auth: { persistSession: false } }), {
    dry: p.has("dry"),
    limit: limit === null ? undefined : Number(limit) || undefined,
  }));
}
