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
  /**
   * לאילו תארים התוכנית פתוחה (מזהים מ-degrees.ts).
   * **ריק = לא מופה, לא "הכל"** — עד שנבדק, המסך אומר "לא אומת לאיזה תארים".
   * הנקודה של נתי (16.8): תוכנית במוסד אינה בהכרח פתוחה לכל התארים —
   * עתידים למשל מקבלת הנדסת מערכות מידע ותעו״נ אך פוסלת מנהל עסקים במפורש.
   */
  degreeIds?: string[];

  /**
   * התוכנית פתוחה **לכל תואר במוסד**.
   *
   * המצב השלישי שחסר: `degreeIds` ידע לומר "אלה התארים" או "ריק = לא נבדק",
   * ולא היה לו איך לומר "כולם". תוכניות ליווי קהילתיות — אדמאס בתל אביב,
   * סיקט בבן-גוריון — הן ברמת המוסד ולא ברמת התואר, ולשאול אותן "לאילו
   * תארים" זו שאלה שגויה. בלעדיו הן היו נשארות "לא אומת" לנצח, בצדק
   * טכני ובטעות מהותית. אומת 18.8.2026 מול deanstudents.tau.ac.il.
   *
   * **ריק עדיין אומר "לא נבדק" ולא "הכל"** — רק הדגל הזה אומר "הכל".
   */
  openToAllDegrees?: boolean;
  /**
   * המסלול שהתוכנית שייכת אליו. **חובה בתוכניות** — מעטפת של אקדמיה, של
   * מה״ט ושל הכשרה מקצועית הן דברים שונים, ואי אפשר להשוות ביניהן.
   * ריק = מלגה שרלוונטית לכל המסלולים.
   */
  tracks?: Track[];

  // ── ניקוד ─────────────────────────────────────────────────────────────────
  //
  // הדירוג לא מודד "איכות" אלא **מה מחזיק אדם עד הסוף**. לקהל שלנו הגורם
  // המכריע אינו איכות ההוראה אלא המעטפת: מי מחזיק אותך כשנהיה קשה, ומאיפה
  // מגיע הכסף בינתיים. קורס לבד = אתה לבד.
  //
  // ⚠️ אימות הוא **תקרה ולא משקל**: פריט needs-check לא יכול לעקוף פריט
  // מאומת, כמה שהמעטפת שלו נשמעת טוב. אחרת מספיק שיווק טוב כדי לנצח.

  /** ליווי אישי, רכז/ת, חונכות — עד ההשמה */
  support?: "full" | "partial" | "none";
  /** מאיפה מגיע הכסף בזמן הלימודים */
  money?: "free-plus-stipend" | "free" | "subsidised" | "deposit" | "paid";
  /** התחייבות להשמה מול סיוע בלבד */
  placement?: "committed" | "assisted" | "none";
  /** בלי תואר, בלי פסיכומטרי, ערב, או פריפריה — כמה מהם מתקיימים */
  access?: number;

  link?: string;
  contact?: string;
  /** מזהי מסמכים מ-DOC_CATALOG */
  docs: string[];

  /** הקשר שלנו — ראה ההסבר ב-institutions.ts. partner = מכירים אותנו ומצפים להפניות */
  relationship?: "none" | "contacted" | "partner";
  relationshipNote?: string;
  relationshipAt?: string;

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

  {
    id: "peripheria45",
    name: "גרים בפריפריה 45",
    kind: "scholarship",
    what:
      "מימון מלא של שנה א׳ בתואר — עד 12,017 ₪ — לתושבי אזורי עדיפות לאומית. המלגה מועברת לפיקדון האישי.",
    catch:
      "אין כפל בין מלגות הפריפריה של האגף — מממשים רק אחת מ-44/45/46. הזכאות דורשת כתובת רשומה בפריפריה בחמש מתוך שש השנים שלפני הלימודים. ולוחמי מילואים עם 100% מימון ממלגת מילואים אינם זכאים.",
    who:
      "משוחררים ומסיימי שירות לאומי-אזרחי מאזורי עדיפות לאומית · עד 5 שנים מהשחרור (בודדים ומילואימניקים — עד 10)",
    opensAt: { d: 3, m: 8 },
    amount: 12017,
    amountNote: "עד 100% משכר הלימוד האוניברסיטאי של שנה א׳, נכון לתשפ״ו. מועבר לפיקדון עד 31.3.2027",
    blocks: ["yeud44", "yeud46"],
    tracks: ["degree"],
    link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/Perypheria45.aspx",
    status: "active",
    notes: "אומת 13.8.2026 ישירות מאתר האגף. רק מוסדות מל״ג שהמדינה משתתפת בתקציבם.",
    docs: ["id", "discharge", "enrollment"],
    verified: "13.8.2026 — hachvana.mod.gov.il",
  },
  {
    id: "mashpiim",
    name: "משפיעים בלימודים — דמי קיום",
    kind: "scholarship",
    what:
      "12,000 ₪ דמי קיום ללוחמים ולתומכי לחימה משוחררים, תמורת 90 שעות עשייה חברתית ו-10 שעות הכשרה. מי שביצע 60+ ימי מילואים ב-2026 מקבל עוד 6,000 ₪ ישירות לחשבון.",
    who: "לוחמים ותומכי לחימה משוחררים, סטודנטים במוסדות מוכרים",
    amount: 12000,
    amountNote: "בשני תשלומים דרך האגודה למען החייל. תרומת קרן אדמונד דה רוטשילד",
    windowNote: "ההרשמה לתשפ״ו הסתיימה (3.9–31.12.2025). לעקוב אחרי מועדי תשפ״ז",
    tracks: ["degree", "mahat"],
    link: "https://www.hachvana.mod.gov.il/MainEducation/HachvanaScholarship/Pages/mashpim.aspx",
    status: "active",
    notes: "אומת 13.8.2026 מאתר האגף. דמי קיום — לא שכר לימוד — ולכן ככל הנראה מצטברת עם מלגות שכר לימוד. 📞 לאמת כפל.",
    docs: ["id", "discharge", "enrollment"],
    verified: "13.8.2026 — hachvana.mod.gov.il",
  },
  {
    id: "mahat-90",
    name: "מלגת הנדסאים — 90% משכר הלימוד",
    kind: "scholarship",
    what:
      "האגף מממן 90% משכר הלימוד של מה״ט ללומדי הנדסאי וטכנאי במכללות הטכנולוגיות — כולל מכינות קדם-הנדסאים למי שלא עומד בתנאי הקבלה.",
    catch:
      "הזכאות נבדקת דרך מוסד הלימודים במועד ההרשמה, לא בהגשה נפרדת. מי שמפסיק את הלימודים עלול להידרש להחזר.",
    who: "משוחררים עד 5 שנים · בודדים עד 10 שנים · מי שהזכאות שלו מסתיימת באמצע ממשיך לקבל אם לומד ברצף",
    amountNote: "90% משכר הלימוד שנקבע ע״י מה״ט, מועבר ישירות למכללה. מתעדכן מדי שנה",
    tracks: ["mahat"],
    link: "https://www.hachvana.mod.gov.il/MainEducation/PracticalEngineer/Pages/PracticalEngScholarship.aspx",
    status: "active",
    notes:
      "אומת 13.8.2026 מאתר האגף. **זה הנתון שהופך את מה״ט כמעט חינמי למשוחררים** — ויחד עם עתידאים (מימון מלא + מלגה חודשית) מסלול ההנדסאים ממומן כמעט לגמרי. כולל מכינות קדם-הנדסאים — כלומר גם דלת למי שאין לו תנאי קבלה.",
    docs: ["id", "discharge"],
    verified: "13.8.2026 — hachvana.mod.gov.il",
  },

  {
    id: "rothschild-ambassadors",
    name: "שגרירי רוטשילד",
    kind: "program",
    support: "full", money: "subsidised", placement: "none", access: 1,
    what: "תוכנית מנהיגות תלת-שנתית של קרן רוטשילד: מלגה + הכשרה + התמחות בארגוני חברה אזרחית, לסטודנטים בשבעה מוסדות.",
    catch: "הקבלה דורשת סף סוציו-אקונומי או פוטנציאל מנהיגותי, ותהליך מיון עם מרכז הערכה וראיון. שלוש שנים של מחויבות חברתית לצד הלימודים.",
    who: "סטודנטים בשנה א׳ (או שנותרו 3 שנות לימוד) באחד משבעה מוסדות",
    tracks: ["degree"],
    link: "https://rothschildcp.com/en/rothschild-ambassadors/",
    status: "needs-check",
    notes: "אומת חלקית 13.8.2026 — המבנה נכון, אך גובה המלגה ורשימת שבעת המוסדות לא אומתו. 📞 לאמת לפני הצגה. (כתבת Ynet ישנה דיברה על ~100 אלף ₪ מצטבר — לא להציג בלי אימות.)",
    docs: ["id", "income", "enrollment"],
  },
  {
    id: "isef",
    name: "ISEF",
    kind: "scholarship",
    what: "קרן מלגות ותיקה לסטודנטים מהפריפריה החברתית, עם ליווי וקהילה — לא רק כסף.",
    windowNote: "ההרשמה לתשפ״ו נסגרה ביולי 2026 — נפתחת שוב ביוני 2027",
    tracks: ["degree"],
    link: "https://www.isef.co.il/",
    status: "active",
    notes: "מ-docs/research-findings.md (אומת 11.8.2026). החלון סגור עכשיו — להזכיר למועמדים של השנה הבאה. 📞 לאמת סכומים ותנאי צבירה לקראת יוני 2027.",
    docs: ["id", "income", "enrollment"],
    verified: "11.8.2026",
  },
  {
    id: "edu-ministry-ethiopia",
    name: "מלגת משרד החינוך ליוצאי אתיופיה",
    kind: "scholarship",
    what: "מימון שכר לימוד ליוצאי הקהילה — קיומה כיום דורש אימות.",
    tracks: ["degree"],
    status: "hidden",
    notes: "🔴 שאלת נתי 13.8: האם עדיין קיימת? החיפוש לא החזיר אישור עדכני — ייתכן שהוחלפה או אוחדה במלגות מל״ג (מרום/הישגים) או במינהל הסטודנטים. לא להציג עד שמאומת מול משרד החינוך. 📞",
    docs: ["id"],
  },
  {
    id: "bgu-social",
    name: "מלגות מעורבות חברתית — בן-גוריון",
    kind: "scholarship",
    what: "המחלקה למעורבות חברתית בבן-גוריון מעניקה מלגות תמורת פעילות חברתית בקהילה הבאר-שבעית.",
    who: "סטודנטים בבן-גוריון",
    institutions: ["bgu"],
    tracks: ["degree"],
    link: "https://in.bgu.ac.il/Pages/social-involvement.aspx",
    status: "needs-check",
    notes: "שאלת נתי 13.8. מודל דומה לפר״ח — מלגה תמורת שעות. 📞 לאמת סכומים, היקף שעות, והאם מצטברת עם מרום/פר״ח. רלוונטי במיוחד כי בן-גוריון היא ההמלצה החזקה שלנו לדרום.",
    docs: ["id", "enrollment"],
  },

  // ─── תוכניות ───────────────────────────────────────────────────────────────
  {
    id: "techleaders",
    degreeIds: ["cs", "info-systems-eng", "ee", "statistics", "math"],
    support: "full", money: "free-plus-stipend", placement: "assisted", access: 2,
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
    institutions: ["bgu", "huji", "technion", "bar-ilan", "haifa", "ariel", "sce"],
    tracks: ["degree"],
    link: "https://www.techleaders.org.il/",
    status: "needs-check",
    notes:
      "⚠️ אומת 12.8.2026 מול האתר: המוסדות והרכיבים מדויקים. אבל (א) לא מפורסם שום סכום, ולכן אין amount; (ב) הדדליין שמופיע באתר הוא 18.10.2024 — כלומר העמוד לא עודכן או שנקרא מטמון ישן, ואסור להציג ממנו תאריך. 📞 לאמת מועד הרשמה לתשפ״ז. מוסדות המכינה הם בן-גוריון, העברית, הטכניון ובר-אילן — שלושה מהם עוד לא קיימים אצלנו ב-institutions.ts.",
    docs: ["id", "grades", "income"],
  },
  {
    id: "atudim",
    degreeIds: ["info-systems-eng", "industrial-eng", "cs", "ee"],
    support: "full", money: "free-plus-stipend", placement: "committed", access: 1,
    name: "עתידים לתעשייה",
    kind: "program",
    closesAt: { d: 31, m: 8 },
    what: "תוכנית מלווה לאורך התואר, כולל מלגת קיום והשמה בתעשייה.",
    catch:
      "היא חוסמת את פר״ח ואת כל מלגות מפעל הפיס — החלטה, לא תוספת. וחשוב: פתוחה להנדסת מערכות מידע ותעו״נ, אבל **פוסלת מנהל עסקים במפורש**.",
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
    // תוכנית ליווי ברמת המוסד — פתוחה לכל תואר, לא לתחום מסוים
    openToAllDegrees: true,
    support: "full", money: "subsidised", placement: "assisted", access: 2,
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
    support: "partial", money: "subsidised", placement: "none", access: 1,
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
    /**
     * אומת 18.8.2026 מול runi.ac.il: קרן אור מוגבלת לשלושה מסלולים בלבד —
     * מדעי המחשב, מנהל עסקים בהתמחות AccounTech, וכלכלה ויזמות בהתמחות
     * מדעי הנתונים. **רק מדעי המחשב ממופה כאן**; שני האחרים אינם תואמים
     * לאף תואר קנוני ברשימה שלנו, ולא ממציאים התאמה.
     */
    degreeIds: ["cs"],
  },
  {
    id: "sicket",
    // תוכנית ליווי ברמת המוסד — פתוחה לכל תואר, לא לתחום מסוים
    openToAllDegrees: true,
    support: "full", money: "subsidised", placement: "assisted", access: 2,
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
    support: "none", money: "free", placement: "committed", access: 1,
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
    id: "lohamim-hitech",
    name: "לוחמים להייטק",
    kind: "program",
    support: "full", money: "free-plus-stipend", placement: "committed", access: 2,
    what:
      "תוכנית ההפניה של עתידים ללוחמים משוחררים: עד 80% מימון שכר לימוד, דמי קיום חודשיים, ליווי אישי והשמה. משבצת למסלולים ב-IITC, סלע וקרנליוס — בלי צורך ברקע טכנולוגי.",
    catch:
      "ללוחמים ולוחמות בלבד — לא לכל מי ששירת. המיון: טופס, מבחן התאמה וראיון. עדיפות מפורשת לתושבי פריפריה.",
    who: "לוחמים בשירות, לקראת שחרור, או עד 5 שנים מהשחרור (עד 10 באישור הקרן ולמילואימניקים פעילים)",
    covers: ["עד 80% משכר הלימוד", "דמי קיום חודשיים לפי קריטריונים", "השתתפות עצמית מהפיקדון", "ליווי אישי והשמה"],
    institutions: ["iitc", "cornelius"],
    tracks: ["bootcamp"],
    link: "https://techidf.co.il/",
    status: "active",
    notes:
      "מופעלת על ידי עתידים עם Start-Up Nation Central והאגף. הקורסים המשובצים ב-courses.ts. דמי הקיום דווחו ~2,300 ₪ לחודש אך לא אומתו במקור רשמי — לא להציג סכום. מחזורים בספטמבר-אוקטובר.",
    docs: ["id", "discharge"],
    verified: "13.8.2026",
  },
  {
    id: "yoel",
    name: "תוכנית יואל — בר-אילן",
    kind: "program",
    what: "תוכנית ייעודית בבר-אילן שנתי הצביע עליה כדלת לקהל שלנו.",
    tracks: ["degree"],
    institutions: ["bar-ilan"],
    status: "needs-check",
    notes: "🔴 טרם נחקרה — נתי הזכיר אותה ב-11.8.2026 וזה עדיין חוב. לברר: מי זכאי, מה מקבלים, איך נרשמים. לא להציג למועמד עד אז.",
    docs: ["id"],
  },
  {
    id: "mod-hitech",
    name: "קורסי הייטק ממומנים — האגף לחיילים משוחררים",
    kind: "program",
    support: "partial", money: "subsidised", placement: "none", access: 2,
    what:
      "האגף מממן את רוב שכר הלימוד בשבעה קורסי הייטק, ומשאיר השתתפות עצמית של 980–2,000 ₪ שאפשר לשלם מהפיקדון — כלומר בפועל בלי הוצאה מהכיס.",
    catch:
      "בחלק מהקורסים מענק התמדה של 5,000 ₪ לאוכלוסיות מיוחדות — גדול מההשתתפות העצמית, כלומר הקורס יכול לצאת ברווח. רוב הקורסים בשעות בוקר.",
    who: "משוחררים עד 5 שנים מהשחרור · בודדים ומילואימניקים פעילים עד 10 שנים",
    covers: ["רוב שכר הלימוד", "השתתפות עצמית מהפיקדון", "מענק התמדה 5,000 ₪ בחלק מהקורסים"],
    tracks: ["bootcamp"],
    link: "https://www.hachvana.mod.gov.il/MainEducation/HighTech/Pages/default.aspx",
    contact: "*5266",
    status: "active",
    notes: "אומת 13.8.2026 ישירות מאתר האגף. הקורסים עצמם ב-courses.ts — מפעילים: ITQ, קרנליוס, אנליזה, בנתיבי אודי, Mission AI.",
    docs: ["id", "discharge"],
    verified: "13.8.2026 — hachvana.mod.gov.il",
  },
  {
    id: "atidaim",
    name: "עתידאים",
    kind: "program",
    support: "full", money: "free-plus-stipend", placement: "committed", access: 3,
    what:
      "המעטפת של מה״ט: תואר הנדסאי בשיתוף התעשייה, במימון מלא ועם מלגה חודשית לכל תקופת הלימודים.",
    catch:
      "התוכנית בנויה סביב מעסיק ספציפי — התמחות והשמה מולו. שווה לברר איזה מעסיק פתוח במחזור הקרוב לפני שנרשמים.",
    who:
      "צעירים מהפריפריה. **מתקבלים גם עם בגרות חלקית** — ציון עובר בשלושה מקצועות (מתמטיקה 3 יח״ל, אנגלית 3 יח״ל, עברית 2 יח״ל), מכינת רענון במתמטיקה וראיון אישי",
    covers: ["מימון מלא של הלימודים", "מלגה חודשית לכל התקופה", "התנסות מעשית בתעשייה", "ליווי והשמה"],
    tracks: ["mahat"],
    link: "https://www.atidaim.co.il/",
    status: "needs-check",
    notes:
      "בשיתוף מה״ט והיחידה להכוונת חיילים משוחררים. אומת 13.8.2026 ממקורות משניים — 📞 לאמת מול עתידים: גובה המלגה, אילו מעסיקים פתוחים במחזור הקרוב, ואילו מסלולי הנדסאי רלוונטיים לטק (ראינו מכטרוניקה, אינטל וחברת החשמל). **הכניסה עם בגרות חלקית היא הנתון החשוב ביותר כאן** ודורשת אימות ישיר.",
    docs: ["id", "grades", "income"],
  },
  {
    id: "hackeru-miluim",
    support: "partial", money: "subsidised", placement: "committed", access: 2,
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

// ─── דירוג ───────────────────────────────────────────────────────────────────

/**
 * הניקוד גלוי בכוונה: הוא מחזיר גם **את הסיבות**, לא רק מספר.
 *
 * דירוג הוא טענה — "זה טוב יותר בשבילך" — וצריך להיות אפשר להגן עליה מול
 * מועמד ומול רכזת. מספר בלי נימוק נקרא כשרירותי, ומי שנמצא מתחת לקיפול
 * פשוט לא קיים.
 */
export type Score = { total: number; reasons: string[]; capped: boolean };

const SUPPORT_PTS = { full: 4, partial: 2, none: 0 } as const;
const MONEY_PTS = {
  "free-plus-stipend": 4, free: 3, subsidised: 2, deposit: 2, paid: 0,
} as const;
const PLACEMENT_PTS = { committed: 2, assisted: 1, none: 0 } as const;

const MONEY_WORD: Record<NonNullable<Funding["money"]>, string> = {
  "free-plus-stipend": "ללא עלות + מלגת קיום",
  free: "ללא עלות",
  subsidised: "מסובסד",
  deposit: "נכנס לפיקדון החייל המשוחרר",
  paid: "בתשלום מלא",
};

/** תקרה לפריט שלא אומת מול הגוף עצמו */
export const UNVERIFIED_CAP = 6;

export function scoreFunding(f: Funding): Score {
  const reasons: string[] = [];
  let total = 0;

  if (f.support) {
    total += SUPPORT_PTS[f.support];
    if (f.support === "full") reasons.push("מעטפת מלאה — ליווי אישי עד ההשמה");
    else if (f.support === "partial") reasons.push("ליווי חלקי");
  }
  if (f.money) {
    total += MONEY_PTS[f.money];
    if (f.money !== "paid") reasons.push(MONEY_WORD[f.money]);
  }
  if (f.placement) {
    total += PLACEMENT_PTS[f.placement];
    if (f.placement === "committed") reasons.push("התחייבות להשמה");
  }
  if (f.access) {
    total += Math.min(3, f.access);
    reasons.push("נגיש — בלי חסמי כניסה גבוהים");
  }
  // הקשר שלנו: +2 לשותף פעיל, +1 אחרי שיחה. בכוונה קטן ממשקל המעטפת (4) —
  // אחרת נמליץ על מי שענה לטלפונים שלנו במקום על מי שטוב למועמד
  if (f.relationship === "partner") {
    total += 2;
    reasons.push("מכירים אותנו — יש כתובת ישירה שתלווה אותך פנימה");
  } else if (f.relationship === "contacted") {
    total += 1;
  }

  const capped = f.status === "needs-check" && total > UNVERIFIED_CAP;
  if (capped) {
    total = UNVERIFIED_CAP;
    reasons.push("⚠️ לא אומת מול הגוף עצמו — הניקוד מוגבל");
  }
  return { total, reasons, capped };
}

/** התוכניות של מסלול מסוים, מהגבוה לנמוך */
export function programsFor(track: Track): { funding: Funding; score: Score }[] {
  return visibleFunding()
    .filter(f => f.kind === "program" && f.tracks?.includes(track))
    .map(f => ({ funding: f, score: scoreFunding(f) }))
    .sort((a, b) => b.score.total - a.score.total);
}

export const TRACK_TITLE: Record<Track, string> = {
  degree: "תואר אקדמי",
  mahat: "מה״ט — הנדסאים",
  bootcamp: "הכשרה מקצועית",
};
