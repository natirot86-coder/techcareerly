/**
 * GET /api/candidate/my-webinars — הוובינרים שהמשתתף/ת השתתף/ה בהם, מלוח אינטק
 * (נתי, 2.11). מאנדיי הוא המקור; כאן רק קוראים. הזהות מהטוקן ומהטלפון המאומת
 * בלבד — אי אפשר לבקש וובינרים של מישהו אחר, וטלפון שלא אומת לא מזהה אף שורה.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mondayBoard, normPhone } from "@/lib/monday";
import { parseWebinarColumn } from "@/lib/webinars";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: { user } } = await createClient(url, anon).auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  /* רק טלפון שאומת ב-SMS מזהה שורה בלוח */
  const phone = user.phone_confirmed_at ? normPhone(user.phone) : "";
  if (!phone) return NextResponse.json({ webinars: [] });

  const row = (await mondayBoard(null))?.find(r => r.phone === phone);
  return NextResponse.json({ webinars: parseWebinarColumn(row?.webinars).map(w => ({ topic: w.topic, day: w.day, domain: w.domain })) });
}
