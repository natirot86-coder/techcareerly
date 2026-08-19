/**
 * אזורים — הגיאוגרפיה כפי שהיא נקראת למועמד.
 *
 * **למה זה כאן ולא קואורדינטות:** מפת סיכות דורשת קואורדינטות ושרת
 * אריחים חיצוני. מה שהמועמד באמת שואל אינו "איפה זה על המפה" אלא
 * **"יש משהו קרוב אליי"** — ולזה אזור עונה טוב יותר מנקודה, כי הוא גם
 * מתלכד עם שאלת המיקום בשאלון (מרכז / פריפריה / גמיש).
 *
 * החלוקה לפי מחוזות הלמ״ס, כדי שלא נמציא סיווג משלנו. יישוב שלא ברשימה
 * ייפול ל-`unknown` וייספר בנפרד — **ריק הוא ממצא, לא ברירת מחדל.**
 *
 * הקואורדינטות יגיעו בשלב הבא מקובץ היישובים של הלמ״ס (data.gov.il),
 * ואז אפשר יהיה להוסיף מפה אמיתית מעל אותה חלוקה.
 */

export type Region = "north" | "haifa" | "center" | "tel-aviv" | "jerusalem" | "south" | "unknown";

export const REGION_LABEL: Record<Region, string> = {
  north: "צפון",
  haifa: "חיפה והסביבה",
  center: "מרכז והשפלה",
  "tel-aviv": "תל אביב וגוש דן",
  jerusalem: "ירושלים והסביבה",
  south: "דרום",
  unknown: "לא סווג",
};

/** סדר התצוגה — מצפון לדרום, כמו מפה */
export const REGION_ORDER: Region[] = [
  "north", "haifa", "center", "tel-aviv", "jerusalem", "south", "unknown",
];

/**
 * יישוב → אזור. מכסה את מה שיש במאגר בפועל, ולא את כל 1,200 היישובים
 * בארץ — אין טעם לשאת רשימה שאיננו משתמשים בה.
 */
const CITY_REGION: Record<string, Region> = {
  // צפון
  "קריית שמונה": "north",
  "כרמיאל": "north",
  "צמח": "north",
  "טבריה": "north",
  "נוף הגליל": "north",
  "עכו": "north",
  "צפת": "north",
  // חיפה והסביבה
  "חיפה": "haifa",
  "חדרה": "haifa",
  "זכרון יעקב": "haifa",
  "אור עקיבא": "haifa",
  // מרכז והשפלה
  "מדרשת רופין": "center",
  "רחובות": "center",
  "ראשון לציון": "center",
  "פתח תקווה": "center",
  "נתניה": "center",
  "כפר סבא": "center",
  "רעננה": "center",
  "הוד השרון": "center",
  "לוד": "center",
  "רמלה": "center",
  "נס ציונה": "center",
  "יבנה": "center",
  "אריאל": "center",
  "מודיעין": "center",
  // תל אביב וגוש דן
  "תל אביב-יפו": "tel-aviv",
  "רמת גן": "tel-aviv",
  "חולון": "tel-aviv",
  "בת ים": "tel-aviv",
  "הרצליה": "tel-aviv",
  "בני ברק": "tel-aviv",
  "קריית אונו": "tel-aviv",
  "גבעתיים": "tel-aviv",
  // ירושלים
  "ירושלים": "jerusalem",
  "בית שמש": "jerusalem",
  "מעלה אדומים": "jerusalem",
  // דרום
  "באר שבע": "south",
  "אשקלון": "south",
  "אשדוד": "south",
  "שדרות": "south",
  "אחווה": "south",
  "קריית גת": "south",
  "נתיבות": "south",
  "אופקים": "south",
  "דימונה": "south",
  "ערד": "south",
  "אילת": "south",
};

export function regionOf(city?: string): Region {
  if (!city) return "unknown";
  return CITY_REGION[city] ?? "unknown";
}

/**
 * האזור שהמועמד הצהיר עליו בשאלון, מתורגם לאזורים שלנו.
 * "מרכז" בשאלון הוא גוש דן + מרכז + ירושלים; "פריפריה" הוא צפון ודרום.
 */
export function regionsForAnswer(answer?: string): Region[] {
  if (answer === "A") return ["tel-aviv", "center", "jerusalem"];
  if (answer === "B") return ["north", "haifa", "south"];
  return []; // גמיש, או שלא ענה — הכל רלוונטי
}
