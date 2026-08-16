/**
 * הזרימות של המפה — **מסודר לפי מסע, לא לפי שלב.**
 *
 * המפה הראשית (/map) מסודרת לפי שלב, וזה נכון למבנה המוצר. אבל למי שרואה
 * את האפליקציה בפעם הראשונה — רכזת חדשה, תורם, מנכ״ל — "מסע" נקרא הרבה
 * יותר טוב מ"שלב": הוא רוצה לדעת מה קורה לבנאדם, ולא איך חילקנו את זה.
 *
 * ולכן יש כאן גם `note` לכל זרימה: **פסקת הסבר במילים**, שחסרה לגמרי במפה
 * הראשית ושם יש רק תוויות של שתי מילים על חצים.
 *
 * `shot` הוא שם הקובץ ב-public/map-shots/ — נוצר אוטומטית מהאתר החי, כדי
 * שהמפה המצולמת תתרענן בפקודה אחת ולא תתיישן כמו מסמך שנבנה ביד.
 */

export type FlowScreen = {
  shot: string;
  label: string;
  sub?: string;
  url: string;
};

export type Flow = {
  id: string;
  title: string;
  stage: string;
  color: string;
  /** ההסבר שמופיע לצד הזרימה */
  note: string;
  screens: FlowScreen[];
};

const B = "https://hasifaapp.vercel.app";

export const FLOWS: Flow[] = [
  {
    id: "entry",
    title: "מהודעה עד קביעת פגישה",
    stage: "שלב 1–2",
    color: "#023e8a",
    note:
      "הרכז/ת פותח/ת את המספר, והמועמד מקבל קישור. הוא נכנס עם הטלפון, עונה על שאלון קצר — פרטים, כמה הטק מעניין אותו, ומה עצר אותו עד היום — ומגיע לדשבורד. משם הפעולה היחידה שמוצעת לו היא לבחור מועד לפגישת ההיכרות, ישר מהאפליקציה. עד שלא קבע, מרחב ההמתנה נעול חלקית.",
    screens: [
      { shot: "login", label: "כניסה", sub: "טלפון + קוד", url: `${B}/login` },
      { shot: "onboarding", label: "שאלון", sub: "6 מסכים", url: `${B}/onboarding` },
      { shot: "dashboard", label: "דשבורד", sub: "מפת המסע", url: `${B}/dashboard` },
      { shot: "contact-m1", label: "בחירת מועד", sub: "Cal.com", url: `${B}/contact?m=1` },
    ],
  },
  {
    id: "waiting",
    title: "מרחב ההמתנה",
    stage: "שלב 2 — היכרות",
    color: "#0ea5e9",
    note:
      "בין הקביעה לפגישה יש ימים או שבועות, וזה המקום שבו מאבדים אנשים. המסך בנוי כציר: השאלון מאחור, הפגישה מלפנים, והמועמד באמצע. ההכנה לפגישה פתוחה מיד — היא מורידה את החשש שמונע ממנו לקבוע. שתי הדקות נעולות עד הקביעה, ומוצגות כנעולות. שעה אחרי מועד הפגישה המסך שואל ״איך היה?״, ומשם הציר ממשיך לשלב הבא.",
    screens: [
      { shot: "waiting", label: "הציר", sub: "לפני קביעה", url: `${B}/waiting` },
      { shot: "booked-m1", label: "אישור", sub: "פגישות 2–3", url: `${B}/contact/booked?m=1` },
    ],
  },
  {
    id: "explore",
    title: "טעימות הייטק",
    stage: "שלב 3 — חשיפה",
    color: "#fb8500",
    note:
      "אחרי פגישת ההיכרות נפתחים שבעת התחומים. בכל תחום: סימולציה קצרה, מרכז למידה עם יום-בחיי ותעלומה, וכלי עיבוד חוויה ששואל שש שאלות על עניין, תחושת מסוגלות וציפיות. הפער בין עניין גבוה למסוגלות נמוכה הוא מה שמעניין אותנו — זה בדיוק האדם שבשבילו הארגון קיים. בסוף השלב סיכום שמוכן לפגישה השנייה.",
    screens: [
      { shot: "explore", label: "בחירת תחום", sub: "7 תחומים", url: `${B}/explore` },
      { shot: "d-networks", label: "דף תחום", sub: "רשתות", url: `${B}/explore/networks` },
      { shot: "s-networks", label: "סימולציה", sub: "תקלת רשת", url: `${B}/explore/networks/sim` },
      { shot: "networks-day", label: "יום בחיי", sub: "Network Engineer", url: `${B}/explore/networks/learn/day` },
      { shot: "networks-mystery", label: "תעלומה", sub: "Firewall · DNS", url: `${B}/explore/networks/learn/mystery` },
      { shot: "networks-exp", label: "עיבוד חוויה", sub: "6 שאלות SCCT", url: `${B}/explore/networks/experience` },
      { shot: "results", label: "סיכום", sub: "לפגישה 2", url: `${B}/explore/results` },
    ],
  },
  {
    id: "paths",
    title: "בחירת מסלול",
    stage: "שלב 4",
    color: "#7c3aed",
    note:
      "תשעה מסכים שמביאים אדם שעדיין לא סגור לנקודה שבה הוא רואה מסלול אחד קונקרטי. שש שאלות על מגבלות החיים, ואז מנוע ניקוד משוקלל שממליץ — ואנחנו ממליצים על תואר במפורש, כי הוא מעלה את סיכויי הקבלה ומשרת סטודנט מתחילה כבר מסוף שנה א׳. אחרי ההמלצה: השוואת המסלולים כקווי רכבת, מסך החסמים (הלב של השלב), בניית רשימת מוסדות, ושאלות מוכנות לפגישה השלישית.",
    screens: [
      { shot: "p-intro", label: "פתיחה", sub: "מה נעשה כאן", url: `${B}/paths?reset=1` },
      { shot: "p-quiz", label: "6 שאלות", sub: "מגבלות החיים", url: `${B}/paths?demo=1&phase=quiz` },
      { shot: "p-result", label: "ההמלצה", sub: "ניקוד משוקלל", url: `${B}/paths?demo=1&phase=result` },
      { shot: "p-routes", label: "כל הדרכים", sub: "3 מסלולים", url: `${B}/paths?demo=1&phase=routes` },
      { shot: "p-blockers", label: "מה עומד בדרך", sub: "חסם ← פתרון", url: `${B}/paths?demo=1&phase=blockers` },
      { shot: "p-institutions", label: "מוסדות", sub: "בניית רשימה", url: `${B}/paths?demo=1&phase=institutions` },
      { shot: "p-done", label: "סיכום", sub: "לפגישה 3", url: `${B}/paths?demo=1&phase=done` },
    ],
  },
  {
    id: "plan",
    title: "מלגות והרשמה",
    stage: "שלב 5",
    color: "#059669",
    note:
      "אחרי שהמסלול ננעל בפגישה השלישית. התוכנית מסודרת לפי חודשים, ובראשה כרטיס עוגן אחד עם הפעולה הדחופה ביותר — כל משימה בגודל ישיבה אחת, כי הפחד גדל עם גודל המשימה. מסך החשבון נותן את המספר במקום הרגעה: כמה זה עולה, כמה המלגות מכסות, ומה נשאר. ארון המסמכים עוקב אחרי סטטוס ומיקום בלבד — האפליקציה לא שומרת קבצים. והעדכון לרכזת נבנה מעצמו ונשלח בוואטסאפ.",
    screens: [
      { shot: "pl-intro", label: "פתיחה לשלב", sub: "מה קורה כאן", url: `${B}/plan?reset=1` },
      { shot: "pl-plan", label: "התוכנית", sub: "עוגן + חודשים", url: `${B}/plan?view=plan` },
      { shot: "pl-money", label: "החשבון", sub: "מספר, לא נחמה", url: `${B}/plan?view=money` },
      { shot: "pl-docs", label: "ארון מסמכים", sub: "סטטוס ומיקום", url: `${B}/plan?view=docs` },
      { shot: "pl-coord", label: "עדכון לרכזת", sub: "נבנה מעצמו", url: `${B}/plan?view=coord` },
    ],
  },
  {
    id: "admin",
    title: "ניהול פנימי",
    stage: "רוחבי",
    color: "#475569",
    note:
      "לא חלק ממסע המועמד. לוח המוסדות ולוח המלגות מנוהלים ידנית ומאושרים אחד-אחד — מוסד הוא איפה לומדים, תוכנית היא ממה מתפרנסים. דף האנליטיקות מציג לכל גרף את שאלת המחקר שהוא עונה עליה ואת הסף שלנו, ומסמן במפורש איפה אין לנו בנצ׳מרק. מסך האיפוס מנקה את הדפדפן כדי לבדוק את המסע מההתחלה.",
    screens: [
      { shot: "admin-inst", label: "מוסדות", sub: "34 · אישור", url: `${B}/admin/institutions` },
      { shot: "admin-funding", label: "מלגות ותוכניות", sub: "18 · אישור", url: `${B}/admin/scholarships` },
      { shot: "admin-analytics", label: "אנליטיקות", sub: "שאלות מחקר", url: `${B}/admin/analytics` },
      { shot: "reset", label: "איפוס", sub: "בדיקה מאפס", url: `${B}/reset` },
    ],
  },
];
