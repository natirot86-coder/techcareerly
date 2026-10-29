/**
 * GET /api/cron/intech-history — קליטת יומן הפעילות של לוח אינטק + השלמת
 * "שיחה ראשונה" (ראה src/lib/intechHistory.ts).
 *
 * רץ כל בוקר מתוך reconcile-main (חלון של 3 ימים — חפיפה מכוונת, הקליטה
 * אידמפוטנטית). כאן הוא נפרד כדי שאפשר יהיה להריץ שחזור וכתיבה הדרגתית
 * בלי להפעיל גם את שאר הבדיקה היומית:
 *   ?from=2026-07-01  חלון הקליטה (ברירת מחדל: 3 ימים אחורה)
 *   ?backfill         משלים גם יציאות ישנות (אחרת רק מחלון הקליטה) — כתיבה גורפת, באישור
 *   ?dry              כותב להיסטוריה אצלנו, **לא נוגע בלוח** — מחזיר כמה ודוגמאות
 *   ?limit=1          כותב ללוח רק N שורות
 */
import { NextRequest, NextResponse } from "next/server";
import { ingestActivity, stampFirstCalls, COL_STATUS, BEFORE_FIRST_CALL } from "@/lib/intechHistory";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/*
 * 8 השורות של 4.10 בערב (20:58–21:21) סומנו "בתהליך פעיל" מהחשבון של
 * האפליקציה, בהרצה חד-פעמית — לא שיחה. 4.10 אינו התאריך שבו ההמתנה שלהן
 * נגמרה, ולכן הן לא נחתמות (תאריך שגוי מעוות את זמן ההמתנה יותר מריק).
 */
const APP_USER = 33064689;
/* הרגע שבו ה-webhook התחיל לחתום (29.10). כל מה שלפניו — שחזור מפורש בלבד */
const AUTO_STAMP_SINCE = "2026-10-29T12:00:00Z";
const SETUP_RUN = { from: "2026-10-04T17:00:00Z", to: "2026-10-04T19:00:00Z" };

export async function syncIntechHistory(opts: { from?: string; dry: boolean; limit?: number; backfill?: boolean }) {
  const from = opts.from ?? new Date(Date.now() - 3 * 864e5).toISOString();
  const ingest = await ingestActivity(from);
  const stamp = await stampFirstCalls({
    dry: opts.dry, limit: opts.limit,
    /* בלי backfill — רק יציאות מחלון הקליטה, כלומר מה שה-webhook פספס לאחרונה,
       ולעולם לא מלפני שהחתימה האוטומטית הופעלה: מה שקדם לה הוא השחזור, באישור */
    since: opts.backfill ? undefined : new Date(Math.max(Date.parse(from), Date.parse(AUTO_STAMP_SINCE))),
    skipItems: await setupRunItems(),
  });
  return { from, ingest, stamp };
}

async function setupRunItems(): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return new Set();
  const { createClient } = await import("@supabase/supabase-js");
  const { data } = await createClient(url, key, { auth: { persistSession: false } })
    .from("intech_status_log").select("item_id")
    .eq("user_id", APP_USER).eq("column_id", COL_STATUS).eq("from_value", BEFORE_FIRST_CALL)
    .gte("changed_at", SETUP_RUN.from).lte("changed_at", SETUP_RUN.to);
  return new Set((data ?? []).map(r => String(r.item_id)));
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const p = req.nextUrl.searchParams;
  const from = p.get("from");
  const limit = p.get("limit");
  const res = await syncIntechHistory({
    from: from ? new Date(from).toISOString() : undefined,
    dry: p.has("dry"),
    backfill: p.has("backfill"),
    limit: limit === null ? undefined : Number(limit) || undefined,
  });
  return NextResponse.json({ ok: true, ...res });
}
