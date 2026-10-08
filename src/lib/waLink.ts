/**
 * src/lib/waLink.ts — ההודעה שהרכזת שולחת בוואטסאפ, בנויה מראש.
 *
 * ─── למה בכלל ────────────────────────────────────────────────────────────────
 *
 * הקהל הזה נייד, הגימייל שלו עמוס, ומייל אוטומטי עם קישור יש לו סיכוי אמיתי
 * לנחות בספאם. וואטסאפ מגיע מיד — **ומגיע מהמספר של הרכזת**, שהוא בדיוק
 * ההבדל בין "הודעה ממערכת" ל"הודעה מבן אדם שדיברתי איתו לפני חמש דקות".
 *
 * ⚠️ `wa.me` **פותח צ'אט עם טקסט מוכן, לא שולח.** זו תכונה ולא מגבלה: היא
 * קוראת, מתקנת אם צריך, ולוחצת שליחה בעצמה.
 *
 * ⚠️ **נבנה מחדש כשמשתנה הרכז/ת** — הקישור ליומן הוא פר-רכזת, ולכן הודעה
 * שנוצרה פעם אחת בלבד הייתה שולחת מועמד ליומן של מישהי אחרת.
 *
 * ⚠️ **אין קישור בלי טלפון תקין.** wa.me עם מספר שגוי פותח צ'אט עם אדם זר.
 */

const APP_URL = "https://hasifaapp.vercel.app";

/** שם פרטי בלבד — "היי אדיר סמואל" נשמע כמו טופס */
const firstName = (full: string) => (full ?? "").trim().split(/\s+/)[0] ?? "";

/** 9725XXXXXXXX בלבד — נייד ישראלי. כל השאר אינו ראוי לקישור wa.me */
export function waPhone(raw: unknown): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  const n = d.startsWith("972") ? d : d.startsWith("0") ? "972" + d.slice(1) : d.length === 9 ? "972" + d : d;
  return /^9725\d{8}$/.test(n) ? n : "";
}

export function waMessage(p: {
  participant: string;
  coordinator?: string | null;
  calPath?: string | null;
  /* קישורים נמדדים (8.10) — ראה /api/r. חסרים ⇒ נופלים לקישור הישיר */
  appUrl?: string | null;
  calUrl?: string | null;
}): string {
  const them = firstName(p.participant);
  const me = (p.coordinator ?? "").trim();
  const cal = (p.calPath ?? "").trim();

  /*
    שלוש שורות ולא יותר. הודעת וואטסאפ ארוכה נקראת כמו פרסומת, ומה שצריך
    לקרות כאן הוא שתי לחיצות: להיכנס לאפליקציה, ולקבוע פגישה.
  */
  const lines = [
    /* בלי אימוג׳ים (נתי, 8.10) — ההודעה מרכזת ולא שיווקית */
    `היי${them ? " " + them : ""}, זו ${me || "הרכזת"} מתוכנית אינטק של טק-קריירה.`,
    "",
    `נעים להכיר! זה הקישור לאפליקציה שדיברנו עליה — נכנסים עם מספר הטלפון הזה:`,
    p.appUrl || APP_URL,
    "",
  ];
  if (cal) {
    lines.push("וכאן קובעים את הפגישה הראשונה שלנו, בזמן שנוח לך:",
      p.calUrl || (cal.startsWith("http") ? cal : `https://cal.com/${cal}`), "");
  }
  lines.push("מחכה לראות אותך בפנים");
  return lines.join("\n");
}

/** הקישור המלא, או מחרוזת ריקה אם אין טלפון שאפשר לפתוח איתו צ'אט */
export function waLink(p: {
  phone: unknown;
  participant: string;
  coordinator?: string | null;
  calPath?: string | null;
  appUrl?: string | null;
  calUrl?: string | null;
}): string {
  const phone = waPhone(p.phone);
  if (!phone) return "";
  /*
   * ⚠️ **בלי יומן — אין הודעה** (נתי, 5.10). כל כולה של ההודעה
   * הראשונה היא להביא אותו לקבוע פגישה; הודעה בלי הקישור משאירה
   * את הפעולה העיקרית בחוץ, והרכזת תצטרך להדביק אותו בעצמה — זה
   * בדיוק החיכוך שהכפתור בא להסיר.
   * החוסר עצמו מוצג ב-/admin/program, כדי שלא יישאר שדה ריק שאיש לא מבין.
   */
  if (!(p.calPath ?? "").trim()) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(waMessage(p))}`;
}
