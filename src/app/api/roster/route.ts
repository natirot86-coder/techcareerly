/**
 * GET/POST/DELETE /api/roster — סגל הרכזות מה-DB (נתי 23.8: בלי JSON, צוות לא-טכני).
 *
 * שער גישה: verifyCoordinator (7.9) — קוד חירום משותף, או זהות אישית
 * מ-OTP. הקריאה והכתיבה בצד שרת עם המפתח הסודי; המועמדים קוראים רכזות
 * פעילות ישירות דרך RLS.
 *
 * DELETE נוסף 24.9 — עד עכשיו לא הייתה שום דרך למחוק רשומה שנוצרה בטעות
 * (בדיוק מה שקרה עם מירוץ "+ רכזת" לפני שהמודל עם האישור נבנה).
 */
import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/candidate";
import { drainPendingWelcome } from "@/app/api/monday-webhook/route";
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
    cal_m1?: string; cal_m2?: string; cal_m3?: string; takes_participants?: boolean;
  } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  /* היה לה קישור יומן לפני השמירה? ⇒ אם לא והיום כן, יש תור להתרוקן */
  const { data: before } = await client.from("coordinators")
    .select("cal_m1").eq("id", body.id).maybeSingle();
  const hadCal = !!(before?.cal_m1 ?? "").trim();

  const { error } = await client.from("coordinators").upsert({
    id: body.id,
    name: body.name ?? "",
    location: body.location ?? "",
    email: body.email ?? "",
    /*
      ⚠️ **מנרמלים בכתיבה ולא רק בקריאה** (4.10). הטופס מבטיח לצוות
      ש"גם 05... בסדר", ובפועל נשמרו שם שני פורמטים — 0509632170 לצד
      972545603636. ההשוואה בכניסה מנרמלת משני הצדדים ולכן זה עבד, אבל
      כל צרכן חדש שישווה ישירות היה נשבר בשקט. פורמט אחד בטבלה.
    */
    phone: normalizePhone(body.phone),
    active: body.active ?? true,
    // קישורי Cal פר-פגישה — מה שבא אחרי cal.com/ . המועמד המשויך מקבל את היומן של הרכזת שלו
    cal_m1: body.cal_m1 ?? "",
    cal_m2: body.cal_m2 ?? "",
    cal_m3: body.cal_m3 ?? "",
    takes_participants: body.takes_participants ?? true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  /*
   * ── הכיוון השלישי של מייל הפתיחה (נתי, 5.10) ──────────────────────────────
   * המייל דורש שלושה: סטטוס "נשלח קישור" · רכז/ת · **קישור יומן**. השניים
   * הראשונים קורים במאנדיי ויש להם webhook; השלישי קורה כאן. בלי זה, מי
   * שסומן בזמן שלרכזת לא היה יומן היה ממתין לנצח — והרכזת הייתה בטוחה
   * ששלחה. עכשיו הוספת הקישור משחררת את התור מעצמה.
   */
  const nowHasCal = !!(body.cal_m1 ?? "").trim();
  let drained = 0;
  if (!hadCal && nowHasCal && body.name) {
    try { drained = await drainPendingWelcome(body.name); }
    catch (e) { console.error("[roster] drain failed", e); }
  }
  return NextResponse.json({ ok: true, ...(drained ? { drained } : {}) });
}

export async function DELETE(req: NextRequest) {
  const blocked = await gate(req);
  if (blocked) return blocked;
  const client = db();
  if (!client) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  /* היה לה קישור יומן לפני השמירה? ⇒ אם לא והיום כן, יש תור להתרוקן */
  const { data: before } = await client.from("coordinators")
    .select("cal_m1").eq("id", body.id).maybeSingle();
  const hadCal = !!(before?.cal_m1 ?? "").trim();

  const { error } = await client.from("coordinators").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
