/**
 * src/lib/coordinatorLookup.ts — מתווית רכז/ת בלוח לשורה בטבלת coordinators.
 * צד שרת בלבד (מפתח סודי).
 *
 * ─── למה זה קובץ ולא ארבע שורות ilike (11.10) ───────────────────────────────
 *
 * ארבעה מקומות תרגמו את התווית מהלוח לרכז/ת לפי **שם מלא מדויק**: קישור
 * הוואטסאפ, מייל הפתיחה, הסנכרון לאפליקציה וקישור היומן הנמדד. בלוח שי
 * רשום "שי אדמקה" ובסגל "שי איאסו" — אותו אדם, שני חלקים של אותו שם — ולכן
 * אצלו **כל הארבעה נכשלו בשקט**: קישור בלי יומן, מייל שממתין לנצח, ושיוך
 * באפליקציה **שנמחק** בכל שינוי בלוח. אותה בעיה כמו "סיוון" מול "סיון",
 * שכבר נפתרה ב-monday.ts — אבל רק שם.
 *
 * הכלל: שם מלא קודם, ואחריו **שם פרטי — רק אם הוא חד-משמעי**. שתי רכזות
 * באותו שם פרטי ⇒ null. ניחוש כאן היה משייך אדם לרכז/ת הלא נכון/ה, וזה
 * גרוע משדה ריק — אותו עיקרון כמו "עדיף שדה ריק על תווית כפולה".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { heKey } from "@/lib/monday";

export type CoordinatorRow = {
  id: string;
  name: string;
  phone: string | null;
  cal_m1: string | null;
  cal_m2: string | null;
  cal_m3: string | null;
  takes_participants: boolean | null;
  is_intake: boolean | null;
};

const COLS = "id, name, phone, cal_m1, cal_m2, cal_m3, takes_participants, is_intake";

export async function activeCoordinators(db: SupabaseClient): Promise<CoordinatorRow[]> {
  const { data } = await db.from("coordinators").select(COLS).eq("active", true).neq("name", "");
  return (data ?? []) as CoordinatorRow[];
}

export function matchCoordinator(rows: CoordinatorRow[], label: string): CoordinatorRow | null {
  const want = heKey(label.trim());
  if (!want) return null;
  const full = rows.filter(r => heKey(r.name) === want);
  if (full.length === 1) return full[0];
  const first = heKey(want.split(/\s+/)[0]);
  const byFirst = rows.filter(r => heKey(r.name.split(/\s+/)[0]) === first);
  return byFirst.length === 1 ? byFirst[0] : null;
}

/** קיצור לשימוש חד-פעמי: תווית ⇒ שורה */
export async function coordinatorByLabel(db: SupabaseClient, label: string): Promise<CoordinatorRow | null> {
  if (!label.trim()) return null;
  return matchCoordinator(await activeCoordinators(db), label);
}

/** קישור יומן מלא מנתיב שנשמר בסגל (מה שבא אחרי cal.com/) */
export function calUrl(path: string | null | undefined): string | null {
  const p = (path ?? "").trim();
  return p ? (p.startsWith("http") ? p : `https://cal.com/${p}`) : null;
}
