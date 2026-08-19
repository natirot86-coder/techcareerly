/**
 * קורסים — הישות השלישית.
 *
 * מוסד הוא מי שמלמד. תוכנית היא מי שמממן ומפנה. **קורס הוא הדבר הקונקרטי**:
 * מחזור עם תאריך, מחיר, תנאי זכאות, ודף נחיתה משלו.
 *
 * למה זה נחוץ: מה שהמועמד צריך הוא לא "IITC" אלא "קורס רשתות והגנת סייבר של
 * IITC בשיתוף לוחמים להייטק". האתר הכללי מציג עשרים קורסים ושיווק גנרי; דף
 * הקמפיין מציג את הקורס האחד עם תנאי הזכאות הנכונים. מי ששולחים לעמוד הבית
 * צריך למצוא את זה שוב לבד, והוא לא ימצא.
 *
 * ─── שני כללים שמגבילים את זה בכוונה ───────────────────────────────────────
 *
 * 1. **רק הכשרות מקצועיות.** בתואר המוסד הוא היחידה — נרשמים לאוניברסיטה ואז
 *    בוחרים מחלקה. בהכשרה הקורס הוא היחידה.
 *
 * 2. **קורס מקבל שורה רק כשהוא טוב יותר מהעמוד הכללי** — שיתוף פעולה, דף
 *    נחיתה ייעודי, או תנאי זכאות ספציפיים. לא ייבוא קטלוג. ל-IITC לבדה יש
 *    קטלוג שלם, ו-34 מוסדות זה כבר יותר ממה שמספיקים לאמת.
 *
 * ─── מחזורים פגים, וזה הסיכון האמיתי ────────────────────────────────────────
 *
 * ראינו את זה בטבלת שירות התעסוקה: כל חמשת התאריכים שפורסמו כבר עברו.
 * **מועמד שלוחץ על קורס שהתחיל לפני שלושה חודשים מסיק שהוא תמיד מאחר.**
 *
 * לכן המחזור הוא מצב נגזר ולא שדה: `courseState()` מחשב מהתאריך, וקורס שעבר
 * **נעלם מהמועמד מעצמו** ומופיע אצל האדמין כפעולה. לא מוחקים ולא ממציאים
 * תאריך חדש — שואלים.
 */

import type { Domain } from "./institutions";

export type CourseState = "open" | "passed" | "rolling" | "unknown" | "stale";

export type Course = {
  id: string;
  name: string;
  /** מזהה מ-institutions.ts — מי מלמד */
  institutionId: string;
  /** מזהה מ-scholarships.ts — מי מממן או מפנה. ריק = הקורס עומד בפני עצמו */
  programId?: string;
  /** הדף שאליו שולחים בפועל. לא עמוד הבית של המוסד */
  link: string;

  /** ISO. ריק = אין מחזור מפורסם */
  startsAt?: string;

  /**
   * איפה המחזור הזה באמת נפגש.
   *
   * **על הקורס ולא על המוסד, וזה לא קפדנות.** בנתיבי אודי, קווליטסט
   * וטק-קריירה מפעילים מחזורים בערים שונות בלי קשר לכתובת המשרד —
   * "יש סניף אורט באשקלון" אינו "קורס הסייבר רץ באשקלון". מיקום הוא
   * מאפיין של המחזור בדיוק כמו התאריך, והוא נקרא מאותו דף נחיתה.
   *
   * `online: true` אינו היעדר מיקום — הוא **התשובה**. למי שיש ילדים
   * או עבודה, "אפשר מהבית" יכול להיות כל ההבדל בין אפשרי ללא אפשרי.
   */
  city?: string;
  address?: string;
  online?: boolean;
  /** כשאין תאריך: איך נרשמים בכל זאת */
  cycleNote?: string;

  what: string;
  who?: string;
  cost?: string;
  format?: string;
  /** מה שצריך לדעת לפני */
  catch?: string;
  /**
   * מעסיקים בקצה הקורס — בשמם. הקדימות העליונה בתצוגת המועמד (הכרעת נתי
   * 17.8): קורס שנגמר אצל מעסיק ששמו ידוע שווה יותר מכל ליווי-השמה כללי.
   * ממולא רק כשהמעסיק נקוב במקור — לא "ליווי השמה" גנרי.
   */
  employerAtEnd?: string;
  domains: Domain[];

  approved?: boolean;
  status: "active" | "hidden";
  notes?: string;
  /** ISO. קורס שלא אומת חצי שנה חשוד גם אם התאריך שלו עתידי */
  verified?: string;
};

/** מעבר לזה, גם קורס עם תאריך עתידי נחשב לא אמין */
export const STALE_DAYS = 180;

export const COURSES: Course[] = [
  {
    id: "iitc-cyber-networks",
    name: "רשתות תקשורת והגנת סייבר",
    institutionId: "iitc",
    programId: "lohamim-hitech",
    link: "https://iitc.co.il/soldiers/cyber-and-communication/",
    startsAt: "2026-10-25",
    what: "בוטקאמפ רשתות וסייבר לחיילים משוחררים, עם מלגת קיום, חונכות אישית וליווי השמה עד השתלבות מלאה.",
    who: "חיילים ומשוחררים",
    cost: "לא אומת — כולל מלגת קיום",
    format: "ראשון–חמישי 9:00–16:30, רמת גן · עד 24 תלמידים בכיתה",
    catch: "לימודי יום מלאים — לא מתאים למי שעובד.",
    domains: ["cyber", "networks"],
    status: "active",
    notes: "📞 לאמת עלות, גובה מלגת הקיום ומועד המחזור הבא.",
    verified: "2026-08-12",
  },
  {
    id: "itq-cyber",
    name: "קורס סייבר מורחב",
    institutionId: "itq",
    programId: "taasuka-innovation",
    link: "https://itqco.com/6051-lp/",
    startsAt: "2026-06-21",
    what: "הכשרה מסובסדת לתפקידי SOC ואינטגרציה. אחד משני המסלולים היחידים בערוץ הממשלתי שלא דורשים תואר או פסיכומטרי.",
    who: "רקע במחשבים ואנגלית טובה",
    cost: "5,800 ₪, מסובסד",
    format: "10 שבועות · שלושה בקרים בשבוע · אונליין בזום",
    catch: "בוקר ומרחוק — לא מתאים למי שעובד ביום, וקשה יותר להתמיד בלי כיתה.",
    domains: ["cyber", "networks"],
    status: "active",
    notes: "טבלת שירות התעסוקה מציגה פתח תקווה היברידי ו-10.6; אתר ITQ מציג אונליין ו-21.6. לפי הכלל — אתר הגוף גובר.",
    verified: "2026-08-12",
  },
  {
    id: "infinity-devops",
    name: "DevOps Pro",
    institutionId: "infinity-labs",
    programId: "taasuka-innovation",
    link: "https://www.taasuka.gov.il/he/Applicants/innovationtaasukacourses",
    startsAt: "2026-05-31",
    what: "המסלול היחיד ללא עלות בערוץ הממשלתי שלא דורש תואר.",
    who: "רקע בקוד או מערכות",
    cost: "ללא עלות, בכפוף להתחייבות תעסוקתית",
    format: "22 שבועות · רמת גן או חיפה",
    catch: "22 שבועות זה מתחת לחצי שנה — ולכן הוא לא שולל הבטחת הכנסה, בניגוד למסלולים הארוכים של אותו ערוץ.",
    domains: ["code"],
    status: "active",
    notes: "📞 לאמת מועד המחזור הבא ואת נוסח ההתחייבות התעסוקתית.",
    verified: "2026-08-12",
  },
  {
    id: "hackeru-miluim-it",
    name: "נבחרת המילואים — ניהול רשתות IT",
    employerAtEnd: "נס טכנולוגיות · OMC · מלם תים",
    institutionId: "elevation",
    programId: "hackeru-miluim",
    link: "https://bit.ly/4q3EJWT",
    cycleNote: "מספר מקומות מוגבל לזכאים — להשאיר פרטים ולבדוק התאמה",
    what: "הכשרה לתפקידי ניהול רשתות IT, עם חיבור ישיר לנס טכנולוגיות, OMC ומלם תים.",
    who: "משרתי ומשרתות מילואים",
    cost: "500 ₪, מסובסד",
    format: "חודשיים וחצי · לימודי בוקר",
    catch: "לימודי בוקר, ומספר המקומות מוגבל.",
    domains: ["networks"],
    status: "active",
    notes: "⚠️ הגיע מפרסום שיווקי ולא אומת מול HackerU. שווה לבדוק אם לתוכנית החירום של הג׳וינט יש מסלולים נוספים.",
    verified: "2026-08-12",
  },

  // ── קורסי האגף לחיילים משוחררים ──────────────────────────────────────────
  // אומתו 13.8.2026 ישירות מאתר האגף. **המודל זהה בכולם:** רוב שכר הלימוד
  // ממומן, נשארת השתתפות עצמית קטנה שאפשר לשלם מהפיקדון האישי — כלומר
  // בפועל **בלי הוצאה מהכיס.** זכאות: משוחררים עד 5 שנים, בודדים
  // ומילואימניקים פעילים עד 10 שנים.
  {
    id: "mod-mission-ai",
    name: "Mission AI — בניית מערכות AI ואוטומציה",
    institutionId: "elevation", // המכשירים: Elevation והאקדמית כנרת
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/ai-course1.aspx",
    startsAt: "2026-10-25",
    online: true,
    what: "בונים וצוותים סוכני AI וכלי אוטומציה. אונליין ובערב — אחד הבודדים שמתאים למי שעובד ביום.",
    who: "משוחררים עד 5 שנים · בודדים ומילואימניקים פעילים עד 10 שנים. אין צורך בידע מוקדם בתכנות",
    cost: "980 ₪ השתתפות עצמית — ניתן לממן מהפיקדון",
    format: "כ-4 חודשים · אונליין בזום · ראשון ורביעי 17:00–20:00",
    catch: "פתיחת הקורס מותנית במספר מינימלי של נרשמים.",
    domains: ["ai", "code"],
    status: "active",
    verified: "2026-08-13",
  },
  {
    id: "mod-itq-cyber",
    name: "אבטחת מידע וסייבר — ITQ",
    institutionId: "itq",
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/cybersecuritycourse.aspx",
    startsAt: "2026-10-25",
    what: "הכשרה לתפקידי אנליסט אבטחת מידע וסייבר.",
    who: "משוחררים עד 5 שנים · בודדים ומילואימניקים פעילים עד 10 שנים",
    cost: "1,000 ₪ השתתפות עצמית — ניתן לממן מהפיקדון. **מענק התמדה 5,000 ₪ לאוכלוסיות מיוחדות**",
    format: "כ-3.5 חודשים",
    domains: ["cyber"],
    status: "active",
    notes: "מענק ההתמדה גדול פי חמישה מההשתתפות העצמית — כלומר הקורס יכול לצאת ברווח.",
    verified: "2026-08-13",
  },
  {
    id: "mod-cornelius-cyber",
    name: "מיישם הגנת סייבר — קרנליוס",
    institutionId: "cornelius",
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/cyber-security-implementation-course.aspx",
    startsAt: "2026-10-25",
    what: "הכשרה מעשית למיישם הגנת סייבר.",
    who: "משוחררים עד 5 שנים · בודדים ומילואימניקים פעילים עד 10 שנים",
    cost: "1,000 ₪ השתתפות עצמית — ניתן לממן מהפיקדון. מענק התמדה 5,000 ₪ לאוכלוסיות מיוחדות",
    format: "כ-4 חודשים · בוקר, ארבעה ימים בשבוע 09:00–16:00",
    catch: "לימודי בוקר ארבעה ימים בשבוע — לא מתאים למי שעובד.",
    domains: ["cyber"],
    status: "active",
    verified: "2026-08-13",
  },
  {
    id: "mod-analiza-data",
    name: "Data Science — אנליזה",
    institutionId: "analiza",
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/ProfessionalTraining/Pages/data-SCIENCE-course.aspx",
    startsAt: "2026-10-25",
    what: "מדעי הנתונים — הכשרה מלאה במימון האגף.",
    who: "משוחררים עד 5 שנים · בודדים ומילואימניקים פעילים עד 10 שנים",
    cost: "1,000 ₪ השתתפות עצמית, ופחות ללוחמים ולבודדים — ניתן לממן מהפיקדון",
    format: "כ-3 חודשים · ארבעה ימים בשבוע 09:30–15:00",
    catch: "שעות בוקר — לא מתאים למי שעובד ביום.",
    domains: ["data"],
    status: "active",
    verified: "2026-08-13",
  },
  {
    id: "mod-netivei-devops",
    name: "DevOps — בנתיבי אודי",
    institutionId: "netivei-udi",
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/netiveiudi.aspx",
    startsAt: "2026-11-01",
    city: "באר שבע",
    address: "דרך המשחררים 7, באר שבע", // אומת 19.8 מדף הנחיתה
    what: "הכשרת DevOps מלאה, בהפעלת עמותה.",
    who: "משוחררים עד 5 שנים · בודדים ומילואימניקים פעילים עד 10 שנים",
    cost: "2,000 ₪ השתתפות עצמית · ללוחמים ולבודדים 1,000 ₪ — ניתן לממן מהפיקדון",
    format: "כ-4.5 חודשים",
    domains: ["code", "networks"],
    status: "active",
    verified: "2026-08-13",
  },
  {
    id: "mod-ai-implementation",
    name: "הטמעת מערכות AI",
    institutionId: "cornelius", // אומת 19.8: דף הנחיתה נוקב במכללת קרנליוס, ראשל״צ
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/ai-course.aspx",
    startsAt: "2026-10-25",
    city: "ראשון לציון",
    address: "יוסף לישנסקי 27, ראשון לציון", // אומת 19.8 מדף הנחיתה
    what: "הטמעת מערכות בינה מלאכותית בארגונים.",
    who: "משוחררים עד 5 שנים · בודדים ומילואימניקים פעילים עד 10 שנים",
    cost: "1,500 ₪ השתתפות עצמית, ופחות ללוחמים ולבודדים — ניתן לממן מהפיקדון",
    format: "כשלושה חודשים וחצי",
    domains: ["ai"],
    status: "active",
    notes: "📞 לאמת מי מפעיל את הקורס בפועל — האגף לא מציין מכללה.",
    verified: "2026-08-19",
  },
  {
    id: "mod-itq-devnet",
    name: "DEVNET — מומחה תשתיות CISCO · ITQ",
    institutionId: "itq",
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/DEVNET-course.aspx",
    startsAt: "2026-09-22",
    what: "מומחה תשתיות CISCO — וכולל מימון של שלוש הסמכות בינלאומיות, בהן CCNA.",
    who: "משוחררים עד 5 שנים · בודדים ומילואימניקים פעילים עד 10 שנים",
    cost: "2,000 ₪ השתתפות עצמית · לאוכלוסיות מיוחדות 1,400 ₪ — ניתן לממן מהפיקדון",
    format: "כ-4.5 חודשים",
    catch: "שלוש הסמכות CISCO בינלאומיות נשארות איתך גם אם לא תמצא עבודה מיד — זה נכס בפני עצמו.",
    domains: ["networks", "cyber"],
    status: "active",
    verified: "2026-08-13",
  },
  {
    id: "mod-netivei-cyber",
    name: "סייבר — בנתיבי אודי",
    institutionId: "netivei-udi",
    programId: "mod-hitech",
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/netiveiudi.aspx",
    cycleNote: "לא אומת — לברר מול העמותה",
    what: "מקורות משניים מייחסים לעמותה גם הכשרת סייבר, לצד ה-DevOps.",
    who: "חיילים משוחררים — בחלק מהמסלולים חינם לגמרי לתושבי העוטף, הדרום והצפון",
    cost: "לא אומת",
    domains: ["cyber"],
    status: "hidden",
    notes: "🔴 מוסתר עד אימות: הכתבה שמצאנו מערבבת בין ׳Cyber Research Experts׳ של Infinity Labs לבין קורסי העמותה, ואי אפשר לדעת מה של מי. 📞 שיחה אחת לעמותה סוגרת את זה — וגם את שאלת החינם לעוטף.",
    verified: "2026-08-13",
  },
];

// ─── מחזור ───────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.round(
    (new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() -
      new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 86400000
  );
}

/**
 * המצב נגזר מהתאריך ולא נשמר, כדי שלא יהיה שדה שצריך לזכור לעדכן.
 *
 * `passed` — המחזור התחיל. הקורס יורד מהמועמד **מיד**, בלי חסד: עדיף שלא
 *            יראה אותו מאשר שיגלה שאיחר.
 * `stale`  — יש תאריך עתידי, אבל לא אומת יותר מחצי שנה. מוצג למועמד, ומסומן
 *            לאדמין — כי דף שלא נבדק חצי שנה כבר לא בהכרח נכון.
 */
export function courseState(c: Course, today = new Date()): CourseState {
  if (c.startsAt) {
    const start = new Date(c.startsAt);
    if (daysBetween(today, start) < 0) return "passed";
  }
  if (c.verified && daysBetween(new Date(c.verified), today) > STALE_DAYS) return "stale";
  if (c.startsAt) return "open";
  if (c.cycleNote) return "rolling";
  return "unknown";
}

export const STATE_LABEL: Record<CourseState, string> = {
  open: "מחזור פתוח",
  passed: "המחזור עבר",
  rolling: "הרשמה מתגלגלת",
  unknown: "אין מידע על מחזור",
  stale: "לא אומת מזמן",
};

/** מה שהמועמד רואה. קורס שהמחזור שלו עבר נעלם מעצמו */
export function visibleCourses(today = new Date()): Course[] {
  return COURSES.filter(c => c.status !== "hidden" && courseState(c, today) !== "passed");
}

export function coursesFor(institutionId: string, today = new Date()): Course[] {
  return visibleCourses(today).filter(c => c.institutionId === institutionId);
}

/**
 * מה שדורש פעולה מהאדמין. **זה ה"פינג"** — הרשימה הזו נספרת ומוצגת כמונה
 * בלוחות הניהול, כדי שקורס שפג לא יישכח בשקט.
 *
 * התראה אמיתית במייל או בוואטסאפ תדרוש cron בצד שרת; עד אז המונה הוא
 * המנגנון, והוא לפחות לא תלוי בכך שמישהו יזכור לבדוק.
 */
export function coursesNeedingAttention(today = new Date()): { course: Course; state: CourseState }[] {
  return COURSES
    .map(course => ({ course, state: courseState(course, today) }))
    .filter(({ course, state }) =>
      course.status !== "hidden" && (state === "passed" || state === "stale" || state === "unknown"));
}
