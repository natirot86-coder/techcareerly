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
    /* "כאן X" ולא "זו X" — הרכזים הם לא רק רכזות (שי, 22.11) */
    `היי${them ? " " + them : ""}, ${me ? `כאן ${me} מתוכנית` : "כאן תוכנית"} אינטק של טק-קריירה.`,
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

/* ── "ניסיתי להתקשר" (נתי, 22.11) ─────────────────────────────────────────────
   אחרי שיחה שלא נענתה — וואטסאפ מיד. הקישור מוכן בעמודה נפרדת בלוח, כדי
   שהצעד הזה יעלה לחיצה אחת ולא ניסוח. הנוסח משתנה לפי הסטטוס: מי שכבר
   ב"אין מענה 1…" מקבל/ת את נוסח הניסיון השני. בלי קישורים — המטרה כאן
   היא שיחה, לא הרשמה. */
export function waNoAnswerMessage(p: { participant: string; coordinator?: string | null; attempt: 1 | 2 }): string {
  const them = firstName(p.participant);
  const me = (p.coordinator ?? "").trim();
  return [
    `היי${them ? " " + them : ""}, ${me ? `כאן ${me} מתוכנית` : "כאן תוכנית"} אינטק של טק-קריירה — ליווי אישי בבחירת לימודים להייטק.`,
    "",
    p.attempt === 2
      ? "ניסיתי שוב להתקשר אליך ולא הצלחתי לתפוס."
      : "ניסיתי להתקשר אליך עכשיו ולא הצלחתי לתפוס.",
    "מתי נוח לך שנדבר? אפשר גם פשוט לענות כאן.",
  ].join("\n");
}

const CLOSED_STATUSES = ["סיימ/ה תהליך", "נרשמ/ה ללימודים", "נרשמו ללימודים", "לא מעוניין", "לא רלוונטי", "הופנה לגורם חיצוני"];

export function waNoAnswerLink(p: { phone: unknown; participant: string; coordinator?: string | null; status?: string | null }): string {
  const phone = waPhone(p.phone);
  if (!phone) return "";
  /* הניסיון השני רק אחרי שהראשון באמת יצא — "אין מענה 1" לבד עוד לא נשלח */
  const s = p.status ?? "";
  /* למי שסיים/ה, נרשם/ה או יצא/ה מהתהליך אין למי להתקשר — העמודה נשארת ריקה */
  if (CLOSED_STATUSES.some(c => s.startsWith(c))) return "";
  const attempt = s.startsWith("אין מענה") && s.includes("נשלח ווטסאפ") ? 2 : 1;
  return `https://wa.me/${phone}?text=${encodeURIComponent(waNoAnswerMessage({ ...p, attempt }))}`;
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
