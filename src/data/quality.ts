/**
 * צבע הסיכה — לפי **מה שאנחנו יודעים**, לא לפי טעם.
 *
 * ארבעה מצבים, וכל אחד נגזר משדה קיים ולא משיפוט חופשי. זה חשוב במיוחד
 * כאן: צבע על מפה הוא אמירה פומבית על מוסד, וצריך שנוכל להגן על כל אחת
 * מהן מול המוסד עצמו.
 *
 *   🟢 **מומלץ** — שותף שמכיר אותנו, או שנתי סימן אותו כמומלץ לתואר
 *   🔴 **לא וואו** — יש עליו `warn` כתוב ומאומת. **אדום אינו "לדעתנו
 *      חלש"** אלא "יש לנו אזהרה ספציפית בכתב", והיא מוצגת בכרטיס
 *   ⚪ **לא מאומת** — `needs-check`, או שטרם אושר. אפור אינו שלילה
 *   🟡 **סבבה** — פעיל, מאושר, בלי אזהרה. ברירת המחדל
 *
 * הסדר קובע: אזהרה גוברת על המלצה. מוסד שסומן מומלץ ויש עליו אזהרה
 * יופיע אדום — כי האזהרה היא המידע החדש, וההמלצה כבר ידועה.
 */

import { INSTITUTIONS } from "./institutions";
import { DEGREES } from "./degrees";

export type Quality = "recommended" | "ok" | "warn" | "unverified";

export const QUALITY_META: Record<Quality, { color: string; label: string; note: string }> = {
  recommended: {
    color: "#059669",
    label: "מומלץ",
    note: "שותף שמכיר אותנו, או מסומן כמומלץ לתואר",
  },
  ok: {
    color: "#eab308",
    label: "בסדר",
    note: "פעיל ומאושר, בלי הערות מיוחדות",
  },
  warn: {
    color: "#dc2626",
    label: "יש מה לדעת",
    note: "יש עלינו אזהרה כתובה — כתובה בכרטיס עצמו",
  },
  unverified: {
    color: "#9ca3af",
    label: "טרם אומת",
    note: "לא בדקנו לעומק. אפור אינו שלילה",
  },
};

/** המוסדות שנתי סימן כמומלצים לתואר כלשהו */
const RECOMMENDED_IDS = new Set(DEGREES.flatMap(d => d.recommendedAt ?? []));

export function qualityOf(inst: (typeof INSTITUTIONS)[number]): Quality {
  if (inst.warn && inst.warn.trim()) return "warn";
  if (inst.status === "needs-check") return "unverified";
  if (inst.relationship === "partner" || RECOMMENDED_IDS.has(inst.id)) return "recommended";
  if (inst.approved === undefined) return "unverified";
  return "ok";
}

/** סדר תצוגה — מה שכדאי לו קודם, ולא סדר הקוד */
export const QUALITY_RANK: Record<Quality, number> = {
  recommended: 0,
  ok: 1,
  warn: 2,
  unverified: 3,
};
