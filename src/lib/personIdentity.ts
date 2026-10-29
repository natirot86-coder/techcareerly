/**
 * src/lib/personIdentity.ts — מי הוא אותו אדם, ואיזו פגישה זו (נתי, 29.10).
 *
 * אנשים קובעים ב-Cal בשמות שונים ("נתן" / "נתן קבדה"), לפעמים עם טלפון
 * ולפעמים רק עם מייל. **השם אינו זהות** — טלפון או מייל כן. ומי שקבע פעם
 * עם טלפון ופעם בלי — מקושר דרך המייל: אדם = כל מה שמחובר בטלפון *או* במייל.
 *
 * מקור אחד לשני הצרכנים: מסך הפגישות של הרכז/ת (הקשר לכל פגישה) והדשבורד
 * (כמה *אנשים* התחילו). שתי הגדרות זהות שונות היו נותנות שני מספרים.
 */

export function phoneKey(raw: unknown): string {
  const d = String(raw ?? "").replace(/[^0-9]/g, "");
  if (!d) return "";
  if (d.startsWith("972")) return d;
  if (d.startsWith("0")) return "972" + d.slice(1);
  return d.length === 9 ? "972" + d : d;
}

export function emailKey(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

/**
 * מחזיר לכל פריט מזהה אדם. פריטים שחולקים טלפון או מייל — אותו מזהה,
 * גם בשרשרת (א' חולק טלפון עם ב', ב' מייל עם ג' ⇒ שלושתם אחד).
 * פריט בלי טלפון ובלי מייל מקבל מזהה משלו — לא מנחשים לפי שם.
 */
export function clusterPeople(items: { phone?: string | null; email?: string | null }[]): string[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    let c = x;
    while (parent.get(c) !== r) { const n = parent.get(c)!; parent.set(c, r); c = n; }
    return r;
  };
  const add = (x: string) => { if (!parent.has(x)) parent.set(x, x); };
  const union = (a: string, b: string) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };

  const keys = items.map((it, i) => {
    const ks = [phoneKey(it.phone) && `p:${phoneKey(it.phone)}`, emailKey(it.email) && `e:${emailKey(it.email)}`].filter(Boolean) as string[];
    if (!ks.length) ks.push(`i:${i}`);
    ks.forEach(add);
    for (let k = 1; k < ks.length; k++) union(ks[0], ks[k]);
    return ks[0];
  });
  return keys.map(find);
}

/**
 * איזו פגישה זו, לפי הכותרת ב-Cal. הכותרות השתנו לאורך הדרך ("פגישה ראשונה
 * עם רכז/ת", "פגישה 1:", "פגישת הכרות ומיפוי צרכים") — כולן כאן, במקום אחד.
 * סבב אוגוסט ("פגישת תוכנית חשיפה") וראיונות קורס ⇐ null: אינם שלב במסע.
 */
export function meetingKind(title: string | null | undefined): 1 | 2 | 3 | null {
  const t = title ?? "";
  if (/ראיון קורס/.test(t)) return null;
  if (/שלישית|פגישה 3/.test(t)) return 3;
  if (/שנייה|פגישה 2/.test(t)) return 2;
  if (/ראשונה|פגישה 1|היכרות|הכרות/.test(t)) return 1;
  return null;
}
