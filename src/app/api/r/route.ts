/**
 * GET /api/r — הקישור שנשלח למשתתף עובר דרך כאן, נרשם, וממשיך ליעד.
 *
 * ─── למה לא פיקסל פתיחה ──────────────────────────────────────────────────────
 *
 * "האם פתח את המייל" נמדד רק בתמונה שקופה, **והמספר שיוצא משקר לשני
 * הכיוונים**: ג'ימייל טוען תמונות מראש בשרתים שלו (נרשם "נפתח" למי שלא
 * פתח), ואאוטלוק חוסם אותן כברירת מחדל (נרשם "לא נפתח" למי שקרא הכל).
 * מספר שנראה כמו נתון ומתנהג כמו רעש הוא בדיוק מה שהחלטנו לא להכניס.
 *
 * **לחיצה, לעומת זאת, היא עובדה.** והיא מפרידה בין שלושה אנשים שנראים
 * היום זהים לחלוטין: מי שלא פתח כלום · **מי שלחץ ונטש** · ומי שנכנס וקבע.
 * האמצעי הוא הכי חשוב ואנחנו עיוורים אליו: היום הוא נראה בדיוק כמו
 * הראשון, ומקבל אותה שיחת טלפון.
 *
 * ─── מה נרשם ומה בכוונה לא ───────────────────────────────────────────────────
 *
 * ⚠️ המזהה בקישור הוא **שורה בלוח**, לא אדם ולא טלפון. הוא משמש **לשיוך
 * בלבד ולעולם לא לקוהורט** — מה שהאדם מקבל נקבע מהטלפון שאיתו נכנס, כמו
 * שהיה (28.8). הקישור יעבור הלאה בוואטסאפ ותמיד ידלוף, וזה בסדר גמור:
 * מי שילחץ עליו יירשם כלחיצה על שורה של מישהו אחר, ולא יקבל דבר.
 *
 * ⚠️ **הלחיצה לא חוסמת את ההפניה.** כישלון ברישום מחזיר redirect רגיל —
 * אדם שלוחץ על הקישור חייב להגיע ליעד גם אם מאנדיי למטה.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const COL = {
  coord: "color_mm7t74m3",
  clicked: "date_mm7ye5aa",
  via: "text_mm7y5tm2",
} as const;

const APP_URL = "https://hasifaapp.vercel.app";
const CHANNEL: Record<string, string> = { wa: "וואטסאפ", mail: "מייל" };

async function monday<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors) { console.error("[r]", JSON.stringify(j.errors).slice(0, 200)); return null; }
    return j.data as T;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const item = (q.get("i") ?? "").replace(/\D/g, "");
  const target = q.get("t") === "cal" ? "cal" : "app";
  const via = CHANNEL[q.get("c") ?? ""] ?? "";

  /* ה-redirect נבנה לפני כל רישום — הוא חייב לקרות גם אם הכל למטה נופל */
  let dest = APP_URL;

  try {
    if (item && target === "cal") {
      const d = await monday<{ items: { column_values: { id: string; text: string | null }[] }[] }>(
        `{ items(ids: [${item}]) { column_values(ids: ["${COL.coord}"]) { id text } } }`
      );
      const coordName = (d?.items?.[0]?.column_values?.[0]?.text ?? "").trim();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SECRET_KEY;
      if (coordName && url && key) {
        const db = createClient(url, key, { auth: { persistSession: false } });
        const { data } = await db.from("coordinators").select("cal_m1").ilike("name", coordName).limit(1);
        const p = (data?.[0]?.cal_m1 ?? "").trim();
        /* בלי יומן — לאפליקציה. עדיף שיגיע למשהו מאשר לדף שגיאה */
        if (p) dest = p.startsWith("http") ? p : `https://cal.com/${p}`;
      }
    }

    if (item) {
      const today = new Date().toISOString().slice(0, 10);
      /* הראשונה בלבד — רוצים לדעת **אם** נכנס ומאיפה, לא לספור קליקים */
      const cur = await monday<{ items: { column_values: { id: string; text: string | null }[] }[] }>(
        `{ items(ids: [${item}]) { column_values(ids: ["${COL.clicked}"]) { id text } } }`
      );
      if (!(cur?.items?.[0]?.column_values?.[0]?.text ?? "").trim()) {
        await monday(
          `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
          { b: BOARD, i: item, v: JSON.stringify({
            [COL.clicked]: { date: today },
            ...(via ? { [COL.via]: `${via} · ${target === "cal" ? "יומן" : "אפליקציה"}` } : {}),
          }) }
        );
      }
    }
  } catch (e) { console.error("[r] tracking failed", e); }

  return NextResponse.redirect(dest, 302);
}

/** הקישור שנשלח בפועל — `channel` קובע מאיזה ערוץ נספור */
export function trackedUrl(itemId: string | number | null | undefined,
                           target: "app" | "cal", channel: "wa" | "mail"): string | null {
  if (!itemId) return null;
  return `${APP_URL}/api/r?i=${itemId}&t=${target}&c=${channel}`;
}
