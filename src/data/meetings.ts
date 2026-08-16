/**
 * שלוש הפגישות עם רכז/ת החשיפה.
 *
 * המבנה מכוון לכך שהוספת רכזות תהיה **החלפת נתון ולא שינוי קוד**: כשיגיע
 * הגוגל-שיטס, הוא ימלא את COORDINATORS ו-DEFAULT_COORDINATOR ייקבע לפי
 * השיוך של המועמד. עד אז יש רכזת אחת, והכל מצביע אליה.
 *
 * calLink הוא מה שבא **אחרי** cal.com/ — כולל שם המשתמש והסלאג.
 */

export type MeetingNum = 1 | 2 | 3;

export type Coordinator = {
  id: string;
  name: string;
  /**
   * שם פרטי בלבד — כך הוא מופיע למועמד. "פגישה ראשונה עם נתי" הוא משפט אחר
   * לגמרי מ"פגישה ראשונה עם הרכזת", והחום הזה שווה שדה נפרד.
   */
  firstName: string;
  /** calLink לכל אחת משלוש הפגישות */
  links: Record<MeetingNum, string>;
};

export const COORDINATORS: Record<string, Coordinator> = {
  "nati-rotstein": {
    id: "nati-rotstein",
    name: "נתי רוטשטיין",
    firstName: "נתי",
    links: {
      1: "nati-rotstein-cpehqd/פגישה-עם-רכז-ת-החשיפה-היכרות-תוכנית-עבודה-ויציאה-לחקר-תחומי-הייטק",
      2: "nati-rotstein-cpehqd/פגישה-עם-רכז-ת-החשיפה-בחירת-תחום-הייטק-ויציאה-לחקר-מסלולי-לימוד",
      3: "nati-rotstein-cpehqd/פגישה-עם-רכז-ת-החשיפה-בחירת-מסלול-לימודים-והכנה-להרשמה-ללימודים",
    },
  },
};

export const DEFAULT_COORDINATOR = "nati-rotstein";

/** מה קורה בכל פגישה — הטקסט שמוצג למועמד לפני הבחירה ביומן */
export const MEETING_META: Record<MeetingNum, { title: string; sub: string; what: string; bring: string }> = {
  1: {
    title: "פגישת היכרות",
    sub: "נכיר, נבנה תוכנית עבודה, ותצא לחקור תחומי הייטק",
    what: "שיחה של היכרות. נבין מאיפה את/ה מגיע/ה, מה מעניין אותך, ומה הצעד הראשון.",
    // פגישה 1 היא היחידה שאליה לא מביאים כלום — היא בניית אמון, לא בירוקרטיה
    bring: "לא צריך להביא כלום ואין מה להתכונן. בוא/י כמו שאת/ה.",
  },
  2: {
    title: "בחירת תחום",
    sub: "נחליט על תחום ההייטק, ותצא לחקור מסלולי לימוד",
    what: "נעבור על מה שגילית בטעימות, ונבחר יחד את התחום שאליו הולכים.",
    bring: "תביא/י את הסיכום שהכנת בחקר התחומים.",
  },
  3: {
    title: "בחירת מסלול",
    sub: "נחליט על מסלול הלימודים ונתכונן להרשמה",
    what: "ננעל מסלול ומוסד, ונסדר את מה שצריך כדי להירשם בפועל.",
    bring: "תביא/י את רשימת המוסדות והשאלות שהכנת בשלב מסלולי הלימוד.",
  },
};

export function calLinkFor(meeting: MeetingNum, coordinatorId = DEFAULT_COORDINATOR): string {
  return (COORDINATORS[coordinatorId] ?? COORDINATORS[DEFAULT_COORDINATOR]).links[meeting];
}

/**
 * הרכז/ת שמשויכ/ת למועמד. כרגע יש אחד לכולם, ולכן זו החזרה של ברירת המחדל —
 * אבל כל מי שצריך שם קורא דרך כאן, כך שכשיגיע השיוך האמיתי (שדה ב-candidates
 * או הגוגל-שיטס) זה שינוי במקום אחד.
 */
export function coordinatorFor(_candidateId?: string | null): Coordinator {
  return COORDINATORS[DEFAULT_COORDINATOR];
}

/**
 * איזו פגישה רלוונטית עכשיו, לפי מה שהמועמד כבר עשה.
 *
 * הבדיקה היא מהמאוחר למוקדם: מי שסיים את שלב 4 צריך את פגישה 3, גם אם
 * מסיבה כלשהי לא סומנה לו פגישה 2.
 */
export function currentMeeting(ls: Pick<Storage, "getItem">): MeetingNum {
  const has = (k: string) => {
    const v = ls.getItem(k);
    return !!v && v !== "[]" && v !== "null";
  };
  if (has("paths-journey") || has("paths-shortlist")) return 3;
  if (has("paths-quiz") || has("explore-results") || has("data-experience") ||
      has("cyber-experience") || has("networks-experience")) return 2;
  return 1;
}
