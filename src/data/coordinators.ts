/**
 * סגל הרכזות — מקור אמת יחיד לפרטי הקשר.
 *
 * מכאן נמשכים: הטלפון לוואטסאפ של "עדכון לרכזת", פרטי הקשר בדף מנהל
 * התוכנית, ובהמשך — השיוך רכזת↔מועמד. הקישורים ל-Cal.com נשארים
 * ב-meetings.ts כי הם עניין של פגישות, לא של אנשים.
 *
 * ⚠️ שדות ריקים = לא מולאו עדיין, לא "אין". נתי ממלא דרך /admin/program
 * (ייצוא JSON ← קלוד מכניס לקוד), או ישירות כאן.
 */

export type CoordinatorProfile = {
  id: string;
  name: string;
  /** אזור הפעילות — דרום/מרכז/צפון או עיר */
  location: string;
  /**
   * חייב להיות זהה למייל בחשבון ה-Cal.com של הרכזת — לפיו ה-webhook
   * מזהה איזו הזמנה שייכת לאיזו רכזת (webhook אחד משותף לכולן).
   */
  email: string;
  /** בפורמט בינלאומי לוואטסאפ: 9725XXXXXXXX */
  phone: string;
  active: boolean;
  /** קישורי היומן לשלוש הפגישות — מה שבא אחרי cal.com/ . ריק = ברירת המחדל מ-meetings.ts */
  cal_m1?: string;
  cal_m2?: string;
  cal_m3?: string;
};

export const COORDINATOR_ROSTER: CoordinatorProfile[] = [
  {
    id: "nati-rotstein",
    name: "נתי רוטשטיין",
    location: "",
    email: "nati@tech-career.org",
    phone: "",
    active: true,
  },
];

/** הרכזת של מועמד. עד שיש שדה שיוך ב-candidates — כולם אצל הראשונה הפעילה */
export function coordinatorProfileFor(_candidateId?: string | null): CoordinatorProfile {
  return COORDINATOR_ROSTER.find(c => c.active) ?? COORDINATOR_ROSTER[0];
}
