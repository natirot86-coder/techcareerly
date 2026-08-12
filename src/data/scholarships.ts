/**
 * מלגות ותוכניות — מקור אמת אחד.
 *
 * **למה שתי הישויות באותו קובץ:** מבחינת המועמד אין הבדל. גם מלגה וגם תוכנית
 * הן "משהו שאני מגיש אליו, יש לו תאריך אחרון, ואם אתקבל זה משנה לי את התמונה
 * הכלכלית". ההבדל היחיד הוא בעומק:
 *
 *   `scholarship` — כסף. פר״ח, מרום, ייעוד.
 *   `program`     — כסף **ועוד**: ליווי, מנטורינג, מסלול קבלה חלופי, השמה.
 *                   TechLeaders, עתידים, אדמאס, קרן אור, סיקט.
 *
 * **תוכנית איננה מוסד.** קרן אור היא תוכנית, רייכמן הוא המוסד. אדמאס היא
 * תוכנית, תל אביב הוא המוסד. השדה `institutions` מקשר ל-institutions.ts.
 *
 * **תוכנית לעולם אינה רשומה ב-institutions.ts.** בגרסה קודמת סיקט ישבה שם
 * מוזגת לתוך בן-גוריון, ואדמאס לתוך תל אביב — וזו בדיוק אותה שגיאה שהקובץ
 * הזה נועד לתקן. היום: `bgu` הוא המוסד, `sicket` היא התוכנית שמצביעה אליו.
 *
 * **כללי תוכן** (זהים לאלה של institutions.ts):
 *   1. לא ממציאים. סכום שלא פורסם — `amount` נשאר undefined
 *   2. מה שלא אומת מול הגוף עצמו — `status: "needs-check"` + הערה ב-`notes`
 *   3. רצועות זמן ולא נקודות, כשהתאריך לא ודאי — `windowNote` במקום `closesAt`
 *
 * המקור לתאריכים ולכללי הצבירה: docs/research-findings.md, חלק א׳.
 */

import type { Track } from "./institutions";

export type FundingKind = "scholarship" | "program";
export type FundingStatus = "active" | "hidden" | "needs-check";

export type Funding = {
  id: string;
  name: string;
  kind: FundingKind;
  /** בשורה אחת — מה זה */
  what: string;
  /** מה שצריך לדעת לפני. המלכודת, החסימה, התנאי שלא כתוב בגדול */
  catch?: string;
  /** מי זכאי */
  who?: string;
  /** מה מקבלים בפועל */
  covers?: string[];

  /** יום/חודש. opensAt ריק = אין תאריך פתיחה מפורסם, רק דדליין */
  opensAt?: { d: number; m: number };
  closesAt?: { d: number; m: number };
  /** כשאין תאריכים מאומתים — מוצג כטקסט ולא כדדליין */
  windowNote?: string;

  /** רק אם אומת. אחרת undefined, ולא ממציאים */
  amount?: number;
  amountNote?: string;

  /** מזהי מלגות שהיא חוסמת */
  blocks?: string[];
  /** מזהי מוסדות מ-institutions.ts */
  institutions?: string[];
  /** ריק = רלוונטי לכל המסלולים */
  tracks?: Track[];

  link?: string;
  contact?: string;
  /** מזהי מסמכים מ-DOC_CATALOG */
  docs: string[];

  /** אושר על ידי נתי. נפרד מ-status בכוונה */
  approved?: boolean;
  status: FundingStatus;
  notes?: string;
  verified?: string;
};

export const FUNDING: Funding[] = [
  // ─── מלגות ─────────────────────────────────────────────────────────────────
  {
    id: "yeud44",
    name: "ייעוד 44 — לומדים בפריפריה",
    kind: "scholarship",
    closesAt: { d: 15, m: 8 },
    what: "מלגה לסטודנטים שגרים בפריפריה ולומדים במוסד מתוקצב.",
    catch:
      "לא נרשמים אליה. המוסד מדווח עליך אוטומטית, ואתה רק חותם על כתב התחייבות באזור האישי. בלי החתימה לא משולם כלום — אפשר להיות זכאי, לא לדעת, ולהפסיד.",
    who: "מגורים ביישוב פריפריאלי + לימודים במוסד מתוקצב",
    blocks: ["yeud46"],
    status: "active",
    docs: ["id", "enrollment"],
    verified: "11.8.2026",
  },
  {
    id: "memadim",
    name: "ממדים ללימודים",
    kind: "scholarship",
    closesAt: { d: 31, m: 8 },
    what: "מלגה לחיילים ולחיילות משוחררים. מחזור נוסף נפתח בערך בנובמבר.",
    who: "חיילים משוחררים",
    status: "active",
    docs: ["id", "discharge"],
    verified: "11.8.2026",
  },
  {
    id: "perach",
    name: "פר״ח",
    kind: "scholarship",
    opensAt: { d: 2, m: 9 },
    what: "מלגה תמורת חונכות. הקומבו המובנה עם מרום.",
    catch: "כל הקודם זוכה. להירשם ביום הפתיחה עצמו, לא אחריו.",
    amount: 10000,
    amountNote: "לפי תנאי תשפ״ו. תנאי תשפ״ז יפורסמו בספטמבר",
    status: "active",
    docs: ["id", "enrollment"],
    verified: "11.8.2026",
  },
  {
    id: "mushal",
    name: "מלגת מושל",
    kind: "scholarship",
    closesAt: { d: 10, m: 9 },
    what: "מלגה שמאשרת במפורש הגשה במקביל לכל מלגה אחרת.",
    status: "active",
    docs: ["id", "income", "enrollment"],
    verified: "11.8.2026",
  },
  {
    id: "marom",
    name: "מרום",
    kind: "scholarship",
    opensAt: { d: 9, m: 9 },
    closesAt: { d: 10, m: 11 },
    what: "מלגת מל״ג. עובדת יחד עם פר״ח — חובת ההתנדבות בוטלה במפורש כדי לאפשר את זה.",
    catch:
      "אחד מקריטריוני הניקוד הוא ייעוץ בתוכנית הישגים עד סוף מאי. מי שלא עבר ייעוץ מפסיד נקודות במלגה עצמה.",
    amountNote: "אחוז משכר הלימוד לפי דירוג המקצוע. הסכום לתשפ״ז יפורסם בספטמבר",
    blocks: ["olim"],
    status: "active",
    docs: ["id", "income", "enrollment"],
    verified: "11.8.2026",
  },
  {
    id: "yeud46",
    name: "ייעוד 46 — בוגרי מכינה",
    kind: "scholarship",
    opensAt: { d: 3, m: 8 },
    closesAt: { d: 31, m: 10 },
    what: "מלגת פריפריה לבוגרי מכינה קדם-אקדמית.",
    catch: "אפשר לקבל מלגת פריפריה אחת בלבד — או זו או ייעוד 44.",
    who: "בוגרי מכינה קדם-אקדמית",
    blocks: ["yeud44"],
    status: "active",
    docs: ["id", "enrollment"],
    verified: "11.8.2026",
  },
  {
    id: "olim",
    name: "המינהל לסטודנטים עולים",
    kind: "scholarship",
    closesAt: { d: 10, m: 11 },
    what: "סיוע בשכר לימוד דרך משרד העלייה והקליטה.",
    catch: "לא מצטברת עם מרום — שתיהן ממשלתיות.",
    blocks: ["marom"],
    status: "active",
    docs: ["id", "enrollment"],
    verified: "11.8.2026",
  },
  {
    id: "gross",
    name: "קרן גרוס",
    kind: "scholarship",
    opensAt: { d: 15, m: 9 },
    closesAt: { d: 15, m: 12 },
    what: "מלגה עצמאית.",
    catch:
      "שוללת כל מקור מימון אחר מעל 4,999 ₪. כלומר זו בחירה במקום מלגות אחרות, לא תוספת עליהן.",
    status: "active",
    docs: ["id", "income"],
    verified: "11.8.2026",
  },
  {
    id: "einor",
    name: "קרן חנן עינור",
    kind: "scholarship",
    opensAt: { d: 1, m: 11 },
    closesAt: { d: 22, m: 11 },
    what: "מכסה גם לימודי הנדסאי ותעודה — לא רק תואר.",
    status: "needs-check",
    notes: "הסכומים הגיעו מאגרגטורים בלבד ולא מהאתר של הקרן. לאמת לפני שמציגים מספר.",
    docs: ["id", "income"],
  },
  {
    id: "haznek",
    name: "הזנק לעתיד",
    kind: "scholarship",
    closesAt: { d: 31, m: 12 },
    what: "מלגה לסטודנטים בשנה הראשונה.",
    status: "active",
    docs: ["id", "enrollment", "income"],
    verified: "11.8.2026",
  },
  {
    id: "milgo",
    name: "מל-GO",
    kind: "scholarship",
    windowNote: "בערך דצמבר–ינואר. התאריכים לתשפ״ז עוד לא פורסמו",
    what: "מכסה מכינה, הנדסאי וטכנאי — לא רק תואר.",
    status: "needs-check",
    notes: "תאריכי תשפ״ז לא פורסמו. לבדוק שוב בדצמבר.",
    docs: ["id", "income"],
  },

  // ─── תוכניות ───────────────────────────────────────────────────────────────
  {
    id: "techleaders",
    name: "TechLeaders",
    kind: "program",
    what:
      "תוכנית של קרן מייקל וסוזן דל ומל״ג/ות״ת, שמלווה ממכינה קדם-אקדמית, דרך התואר, ועד הקריירה הראשונה בהייטק.",
    catch:
      "מיועדת לתארי STEM בלבד, ומחייבת התחייבות להשלים את התואר. הכניסה היא בשלב המכינה — מי שכבר בתואר לא ייכנס דרך השער הזה.",
    who: "בשלב מכינה או קדם-מכינה, גיל 18+, קריטריוני הכנסה ומגורים, יכולת אקדמית גבוהה",
    covers: [
      "שכר לימוד",
      "מלגת מחיה אישית לאורך כל התואר",
      "מחשב נייד",
      "חונכות וייעוץ אקדמי",
      "תוכנית פיתוח קריירה",
      "תמיכה רגשית",
    ],
    // ארבעה מוסדות במכינה; בתואר נוספים עוד ארבעה
    institutions: ["bgu", "haifa", "ariel", "sce"],
    tracks: ["degree"],
    link: "https://www.techleaders.org.il/",
    status: "needs-check",
    notes:
      "⚠️ אומת 12.8.2026 מול האתר: המוסדות והרכיבים מדויקים. אבל (א) לא מפורסם שום סכום, ולכן אין amount; (ב) הדדליין שמופיע באתר הוא 18.10.2024 — כלומר העמוד לא עודכן או שנקרא מטמון ישן, ואסור להציג ממנו תאריך. 📞 לאמת מועד הרשמה לתשפ״ז. מוסדות המכינה הם בן-גוריון, העברית, הטכניון ובר-אילן — שלושה מהם עוד לא קיימים אצלנו ב-institutions.ts.",
    docs: ["id", "grades", "income"],
  },
  {
    id: "atudim",
    name: "עתידים לתעשייה",
    kind: "program",
    closesAt: { d: 31, m: 8 },
    what: "תוכנית מלווה לאורך התואר, כולל מלגת קיום והשמה בתעשייה.",
    catch:
      "היא חוסמת את פר״ח ואת כל מלגות מפעל הפיס. כלומר זו לא תוספת — זו החלטה בין עתידים לבין הקומבו מרום + פר״ח.",
    covers: ["מלגת שכר לימוד", "מלגת קיום", "ליווי אישי", "השמה בתעשייה"],
    amount: 77000,
    amountNote: "מצטבר לאורך התוכנית, כולל מלגת קיום",
    blocks: ["perach"],
    tracks: ["degree"],
    status: "active",
    docs: ["id", "grades", "income"],
    verified: "11.8.2026",
  },
  {
    id: "tau-admas",
    name: "אדמאס — אוניברסיטת תל אביב",
    kind: "program",
    what:
      "תוכנית ייעודית ליוצאי אתיופיה בתל אביב: מסלול קבלה חלופי, מלגות שכר לימוד ומחיה, וליווי לאורך התואר.",
    who: "יוצאי אתיופיה",
    covers: ["מסלול קבלה חלופי", "מלגת שכר לימוד", "מלגת מחיה", "ליווי אקדמי"],
    institutions: ["tau-admas"],
    tracks: ["degree"],
    link: "https://deanstudents.tau.ac.il/advancement/ethiopian-students",
    status: "active",
    notes:
      "לא להתבלבל עם מלגת אדמס (Adams) של האקדמיה הלאומית למדעים — היא לדוקטורנטים ובהצעה בלבד.",
    docs: ["id", "grades", "income"],
    verified: "11.8.2026",
  },
  {
    id: "runi-keren-or",
    name: "קרן אור — אוניברסיטת רייכמן",
    kind: "program",
    what: "מלגה משמעותית שמורידה את שכר הלימוד ברייכמן לרמה קרובה למתוקצב, עם ליווי.",
    institutions: ["runi-keren-or"],
    tracks: ["degree"],
    link: "https://www.runi.ac.il/admissions/undergraduate/scholarships/keren-or",
    status: "active",
    notes: "רייכמן הוא המוסד; קרן אור היא התוכנית שמאפשרת ללמוד בו.",
    docs: ["id", "income", "grades"],
    verified: "11.8.2026",
  },
  {
    id: "sicket",
    name: "סיקט — אוניברסיטת בן-גוריון",
    kind: "program",
    what:
      "מסלול קבלה חלופי בבן-גוריון: פסיכומטרי עד 100 נקודות מתחת לסף, רכז אישי לאורך התואר, ומלגה.",
    covers: ["מסלול קבלה חלופי", "רכז אישי לאורך התואר", "קרן דוד — עד 12,000 ₪"],
    institutions: ["bgu"],
    tracks: ["degree"],
    contact: "שושי קסאי 08-6461781",
    status: "active",
    docs: ["id", "grades", "income"],
    verified: "11.8.2026",
  },
  {
    id: "taasuka-innovation",
    name: "המסלול המסובסד — שירות התעסוקה ורשות החדשנות",
    kind: "program",
    what:
      "ערוץ מימון ממשלתי שמסבסד הכשרות טק. אין לו כיתות משלו — הוא מממן קורסים של ITQ ושל Infinity Labs.",
    catch:
      "🔴 שתי מלכודות. ראשית, שלושה מחמשת הקורסים דורשים תואר STEM ופסיכומטרי 680–700 — כלומר ״חינם״ אינו נגיש לרוב הקהל שלנו. שנית, קורס ארוך מששה חודשים שולל זכאות להבטחת הכנסה, ולכן קורס בלי עלות עלול לעלות למי שאין לו רשת ביטחון את ההכנסה שלו.",
    who: "תושב ישראל מגיל 18, שאינו מועסק בתפקיד טכנולוגי",
    covers: ["מימון מלא או חלקי של שכר הלימוד", "התחייבות תעסוקתית בסיום"],
    windowNote: "כל התאריכים שפורסמו כבר עברו. מועדי המחזור הבא לא פורסמו",
    institutions: ["itq", "infinity-labs"],
    tracks: ["bootcamp"],
    link: "https://www.taasuka.gov.il/he/Applicants/innovationtaasukacourses",
    contact: "*9687 · 077-2718800",
    status: "needs-check",
    notes:
      "היה רשום בטעות ב-institutions.ts כאילו היה גוף הכשרה. שני הקורסים היחידים שלא דורשים תואר ופסיכומטרי: ITQ סייבר (5,800 ₪) ו-DevOps Pro של Infinity Labs (ללא עלות). 📞 לאמת מועדי מחזור הבא ואת נוסח ההתחייבות התעסוקתית.",
    docs: ["id", "discharge"],
  },
  {
    id: "hackeru-miluim",
    name: "נבחרת המילואים — HackerU והג׳וינט",
    kind: "program",
    what:
      "הכשרה מסובסדת לתפקידי ניהול רשתות IT, עם חיבור ישיר למעסיקים: נס טכנולוגיות, OMC ומלם תים.",
    catch: "לזכאים בלבד ומספר המקומות מוגבל. לימודי בוקר — לא מתאים למי שעובד ביום.",
    who: "משרתי ומשרתות מילואים",
    covers: ["הכשרה של חודשיים וחצי", "חיבור למעסיקים שותפים"],
    amount: 500,
    amountNote: "עלות למשתתף, מסובסדת",
    tracks: ["bootcamp"],
    link: "https://bit.ly/4q3EJWT",
    status: "needs-check",
    notes:
      "⚠️ הגיע מנתי 12.8.2026 מפרסום שיווקי, ולא אומת מול HackerU. לאמת: תאריכי מחזור, הגדרת הזכאות, והאם התוכנית עדיין פתוחה. שווה לבדוק אם לתוכנית החירום של הג׳וינט יש מסלולים נוספים — זה קצה חוט למאגר.",
    docs: ["id", "discharge"],
  },
];

/**
 * הקומבו המומלץ למועמד טיפוסי (משוחרר, יליד הארץ, הורה יליד אתיופיה).
 * מקור: docs/research-findings.md — "המלצת צבירה למועמד טיפוסי".
 */
export const RECOMMENDED_STACK = ["yeud44", "marom", "perach"];

/** מה שמוצג למועמד: פעיל או ממתין לאימות. מוסתר לא מוצג */
export function visibleFunding(): Funding[] {
  return FUNDING.filter(f => f.status !== "hidden");
}

export function fundingFor(track: Track): Funding[] {
  return visibleFunding().filter(f => !f.tracks || f.tracks.includes(track));
}

export const KIND_LABEL: Record<FundingKind, string> = {
  scholarship: "מלגה",
  program: "תוכנית",
};
