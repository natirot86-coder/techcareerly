/**
 * src/lib/stateSync.ts — ההתקדמות של המשתתף/ת: השרת הוא המקור, הדפדפן עותק.
 *
 * ─── למה (נתי, 12.10) ────────────────────────────────────────────────────────
 *
 * עד היום כל ההתקדמות חיה ב-localStorage, ודפדפן אחר התחיל מאפס. ההחלטה:
 * **השרת הוא מקור האמת.** הדפדפן ממשיך להחזיק עותק — כדי שמסך ייטען מיד גם
 * בקליטה חלשה — אבל העותק נבנה מהשרת, ונמחק בלי שום נזק.
 *
 * ─── איך ─────────────────────────────────────────────────────────────────────
 *
 * **אף מסך לא משתנה.** 114 מפתחות ב-47 קבצים ממשיכים לכתוב ל-localStorage
 * כרגיל; כאן משווים מול מה שסונכרן בפעם האחרונה ושולחים רק את ההפרש.
 * **מחריגים ולא מונים** — מפתח שיתווסף מחר מסתנכרן מעצמו, ואין רשימה
 * שנייה שתצא מסנכרון עם הקוד (הלקח של "שתי רשימות" מ-31.8).
 *
 * `__state-synced` שומר **מה סונכרן ולמי**. אם הזהות התחלפה (אנונימי ⇐
 * מאומת, או התנתקות) — כל מה שבדפדפן נחשב חדש ונשלח לזהות הנוכחית.
 *
 * מיזוג במשיכה: מפתח שהשתנה כאן ועוד לא נשלח **נשאר** (הפעולה האחרונה של
 * האדם במכשיר הזה); כל השאר נלקח מהשרת. לכל משתתף יש רק אותו עצמו, אז
 * "האחרון גובר" מספיק — אין שני אנשים שעורכים את אותו דבר.
 */
import { supabase } from "./supabase";

const META = "__state-synced";

/*
  מה **לא** של המשתתף/ת: התחברות, כניסת רכזת, טיוטות של מסכי ניהול, ודגלים
  של המכשיר עצמו (phone-synced קובע אם *המכשיר הזה* כבר שלח טלפון; אם יגיע
  מהשרת, מכשיר חדש ידלג על השיוך לקוהורט ועל האיחוד).
*/
const EXCLUDE: RegExp[] = [
  /^sb-/, /^supabase/, /^__/, /^coordinator-/, /^admin-/,
  /^assigned-coord$/, /^phone-synced$/, /^stage-synced$/, /^last-touch-at$/,
  /^vercel/, /^debug/, /^ph_/,
];

const included = (k: string) => !EXCLUDE.some(r => r.test(k));

type Meta = { uid: string; v: Record<string, string> };

function readMeta(uid: string): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(META) ?? "null") as Meta | null;
    if (m && m.uid === uid && m.v) return m;
  } catch { /* ignore */ }
  return { uid, v: {} };
}

function writeMeta(m: Meta) {
  try { localStorage.setItem(META, JSON.stringify(m)); } catch { /* מלא — הסנכרון הבא ינסה שוב */ }
}

function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !included(k)) continue;
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  }
  return out;
}

async function currentUid(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

let pushing: Promise<void> | null = null;

/** שולח לשרת את מה שהשתנה מאז הסנכרון האחרון. לא יוצר מועמד — רק מסנכרן קיים. */
export function pushState(): Promise<void> {
  if (pushing) return pushing;
  pushing = (async () => {
    try {
      if (!supabase || typeof window === "undefined") return;
      const uid = await currentUid();
      if (!uid) return;
      const meta = readMeta(uid);
      const snap = snapshot();
      const changed = Object.keys(snap).filter(k => snap[k] !== meta.v[k]);
      const removed = Object.keys(meta.v).filter(k => !(k in snap));
      if (!changed.length && !removed.length) return;

      if (changed.length) {
        const now = new Date().toISOString();
        const { error } = await supabase.from("candidate_state").upsert(
          changed.map(key => ({ candidate_id: uid, key, value: snap[key], updated_at: now })),
          { onConflict: "candidate_id,key" },
        );
        /*
          23503 = אין עדיין שורת מועמד לזהות הזאת (למשל מסך רכזת, או רגע לפני
          ההרשמה). לא יוצרים אחת מכאן — זה היה הופך כל דפדפן של רכזת למועמד.
        */
        if (error) { if (error.code !== "23503") console.error("pushState failed", error.message); return; }
        for (const k of changed) meta.v[k] = snap[k];
      }
      if (removed.length) {
        /* מחיקה מקומית מכוונת (/reset) — נמחקת גם בשרת, אחרת היא חוזרת */
        const { error } = await supabase.from("candidate_state").delete()
          .eq("candidate_id", uid).in("key", removed);
        if (!error) for (const k of removed) delete meta.v[k];
      }
      writeMeta(meta);
    } catch (e) {
      console.error("pushState", e);
    } finally {
      pushing = null;
    }
  })();
  return pushing;
}

/**
 * מושך מהשרת וממזג לדפדפן. מחזיר כמה מפתחות נכתבו — 0 בדפדפן מעודכן,
 * הרבה בדפדפן ריק. אחרי המשיכה שולח את מה שנשאר מקומי ולא נשלח.
 */
export async function pullState(): Promise<number> {
  if (!supabase || typeof window === "undefined") return 0;
  try {
    const uid = await currentUid();
    if (!uid) return 0;
    /*
      ⚠️ תמונת מצב לפני הקריאה לשרת — ראה ההערה על changedWhileFetching
      למטה. חייב להילקח *כאן*, לפני ה-await, ולא אחריו.
    */
    const pre = snapshot();
    const { data, error } = await supabase.from("candidate_state")
      .select("key, value").eq("candidate_id", uid);
    if (error || !data) return 0;
    const meta = readMeta(uid);
    /*
      ⚠️ **זהות חדשה בדפדפן הזה ⇒ השרת גובר** (QA 16.10). מה שנכתב כאן לפני
      הכניסה נכתב בזהות אחרת (אנונימית) — למשל last-location="/onboarding"
      מהרגע שדפדפן ריק נשלח להרשמה. כשהמקומי גבר, המשתתף נחת בהרשמה **ודחף
      אותה לשרת**, כך שגם המכשיר הישן שלו היה שולח אותו לשם.
    */
    const freshIdentity = Object.keys(meta.v).length === 0;
    let wrote = 0;
    for (const { key, value } of data as { key: string; value: string }[]) {
      if (!included(key)) continue;
      const local = localStorage.getItem(key);
      /*
        ⚠️ נתפס (26.10, "הטעימות לא נשמרות כשנכנסת מחדש"): הבקשה הזאת
        התחילה, ו*בזמן* שהיא הייתה בדרך המשתתף/ת פעל/ה — למשל נכנס/ה
        טרי ומיד השלים/ה צעד טעימה. freshIdentity היה גובר על כל בדיקה
        ומוחק בשקט את הפעולה הטרייה ביותר, בלי שום עקבה. ה-pre, שנלקח
        *לפני* ה-await, חושף את זה: המקומי השתנה מאז שהבקשה נשלחה ⇒
        הוא גובר תמיד, גם בזהות טרייה.
      */
      const changedWhileFetching = local !== (pre[key] ?? null);
      /* השתנה כאן ועוד לא נשלח ⇒ הפעולה האחרונה של האדם במכשיר הזה גוברת */
      const dirty = changedWhileFetching || (!freshIdentity && local !== null && local !== meta.v[key] && local !== value);
      if (dirty) continue;
      if (local !== value) { localStorage.setItem(key, value); wrote++; }
      meta.v[key] = value;
    }
    writeMeta(meta);
    void pushState();
    return wrote;
  } catch (e) {
    console.error("pullState", e);
    return 0;
  }
}
