/**
 * /map — מפת ניווט ויזואלית של כל מסכי האפליקציה
 *
 * כל כרטיס = מסך אמיתי · לחיצה = פתיחת המסך · חצים = מעבר בין מסכים
 *
 * להוסיף מסך: הוסף node ל-NODES + edge ל-EDGES
 */
"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Node = {
  id: string;
  label: string;
  sub?: string;          // תיאור קצר
  url: string;
  cx: number;            // center X on canvas
  cy: number;            // center Y on canvas
  w: number;             // width
  h?: number;            // height (default 40)
  color: string;
  badge?: string;
  badgeColor?: string;
  /** "meeting" = נקודת מפגש אנושית ולא מסך. מצויר כגלולה מלאה ולא כמלבן */
  kind?: "meeting";
};

type Edge = {
  from: string;
  to: string;
  label?: string;        // תיאור המעבר (כפתור / פעולה)
  dashed?: boolean;
  color?: string;
};

// ─── Canvas ───────────────────────────────────────────────────────────────────

const W = 960;
const H = 1870;
const NH = 44;   // node height default

// ─── Nodes ────────────────────────────────────────────────────────────────────

const BASE = "https://hasifaapp.vercel.app";

const NODES: Node[] = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  { id: "login",      label: "כניסה",      sub: "SMS OTP",             url: `${BASE}/login`,      cx: 60,  cy: 190,  w: 82,  color: "#023e8a" },
  { id: "dashboard",  label: "דשבורד",     sub: "6 שלבים במסע",        url: `${BASE}/dashboard`,  cx: 792,  cy: 190,  w: 92, color: "#023e8a" },
  { id: "waiting", label: "מרחב ההמתנה", sub: "ציר + טעימה + הכנה", url: `${BASE}/waiting`, cx: 900, cy: 190, w: 100, color: "#0ea5e9", badge: "חדש", badgeColor: "#0ea5e9" },


  // ששת מסכי האונבורדינג (Step 0–5 בקוד). לא נפתחים ישירות — הזרימה רציפה
  { id: "ob-0", label: "פתיחה",       sub: "מה האפליקציה עושה", url: `${BASE}/onboarding`, cx: 165,  cy: 190, w: 92, color: "#3b82f6" },
  { id: "ob-1", label: "פרטים", sub: "שם · גיל · אזור", url: `${BASE}/onboarding`, cx: 268, cy: 190, w: 92, color: "#3b82f6" },
  { id: "ob-2", label: "עניין בטק",   sub: "סולם עצמי",     url: `${BASE}/onboarding`, cx: 371, cy: 190, w: 92, color: "#3b82f6" },
  { id: "ob-3", label: "חסמים",        sub: "מה עוצר אותך",    url: `${BASE}/onboarding`, cx: 474, cy: 190, w: 92, color: "#3b82f6" },
  { id: "ob-4", label: "סיום השאלון",  sub: "מה קורה עכשיו",   url: `${BASE}/onboarding`, cx: 577, cy: 190, w: 92, color: "#3b82f6" },
  { id: "ob-5", label: "סיור", sub: "שקופיות",       url: `${BASE}/onboarding`, cx: 683, cy: 190, w: 98, color: "#3b82f6" },

  // ── Bottom nav (soon) ─────────────────────────────────────────────────────
  { id: "chat",  label: "AI Co-pilot", sub: "בקרוב", url: `${BASE}/chat`,  cx: 625, cy: 62,  w: 105, color: "#6b7280", badge: "בקרוב", badgeColor: "#6b7280" },
  { id: "squad", label: "קהילה",       sub: "בקרוב", url: `${BASE}/squad`, cx: 750, cy: 62, w: 110, color: "#6b7280", badge: "בקרוב", badgeColor: "#6b7280" },
  { id: "admin", label: "ניהול מוסדות", sub: "29 מוסדות · פנימי", url: `${BASE}/admin/institutions`, cx: 110, cy: 62, w: 140, color: "#475569", badge: "ניהול", badgeColor: "#475569" },
  { id: "admin-funding", label: "ניהול מלגות", sub: "17 מלגות ותוכניות · פנימי", url: `${BASE}/admin/scholarships`, cx: 285, cy: 62, w: 155, color: "#475569", badge: "ניהול", badgeColor: "#475569" },
  { id: "reset", label: "בדיקה מההתחלה", sub: "מוחק הכל · פנימי", url: `${BASE}/reset`, cx: 900, cy: 62, w: 130, color: "#dc2626", badge: "ניקוי", badgeColor: "#dc2626" },
  { id: "admin-analytics", label: "אנליטיקות", sub: "מה קורה באפליקציה · פנימי", url: `${BASE}/admin/analytics`, cx: 460, cy: 62, w: 155, color: "#475569", badge: "ניהול", badgeColor: "#475569" },

  // ── Explore ───────────────────────────────────────────────────────────────
  { id: "explore", label: "חקר תחומים", sub: "דירוג 7 תחומים", url: `${BASE}/explore`, cx: 510, cy: 428, w: 140, color: "#fb8500" },

  // ── Domain pages ──────────────────────────────────────────────────────────
  { id: "d-code",      label: "קוד",       url: `${BASE}/explore/code`,      cx: 60,  cy: 523, w: 72, color: "#fb8500" },
  { id: "d-data",      label: "דאטה",      url: `${BASE}/explore/data`,      cx: 185, cy: 523, w: 72, color: "#fb8500" },
  { id: "d-marketing", label: "מרקטינג",   url: `${BASE}/explore/marketing`, cx: 320, cy: 523, w: 80, color: "#fb8500" },
  { id: "d-ai",        label: "AI",        url: `${BASE}/explore/ai`,        cx: 445, cy: 523, w: 60, color: "#fb8500" },
  { id: "d-cyber",     label: "סייבר",     url: `${BASE}/explore/cyber`,     cx: 560, cy: 523, w: 72, color: "#fb8500" },
  { id: "d-ux",        label: "UX",        url: `${BASE}/explore/ux`,        cx: 665, cy: 523, w: 60, color: "#fb8500" },
  { id: "d-networks",  label: "רשתות",     url: `${BASE}/explore/networks`,  cx: 790, cy: 523, w: 76, color: "#fb8500" },

  // ── Simulations ───────────────────────────────────────────────────────────
  { id: "s-code",      label: "sim / קוד",      url: `${BASE}/explore/code/sim`,      cx: 60,  cy: 618, w: 90,  color: "#d97706" },
  { id: "s-data",      label: "sim / דאטה",     url: `${BASE}/explore/data/sim`,      cx: 185, cy: 618, w: 90,  color: "#d97706" },
  { id: "s-marketing", label: "sim / מרקטינג",  url: `${BASE}/explore/marketing/sim`, cx: 320, cy: 618, w: 110, color: "#d97706" },
  { id: "s-ai",        label: "sim / AI",       url: `${BASE}/explore/ai/sim`,        cx: 445, cy: 618, w: 80,  color: "#d97706" },
  { id: "s-cyber",     label: "sim / סייבר",    url: `${BASE}/explore/cyber/sim`,     cx: 560, cy: 618, w: 100, color: "#d97706" },
  { id: "s-ux",        label: "sim / UX",       url: `${BASE}/explore/ux/sim`,        cx: 665, cy: 618, w: 80,  color: "#d97706" },
  { id: "s-networks",  label: "sim / רשתות",    url: `${BASE}/explore/networks/sim`,  cx: 790, cy: 618, w: 100, color: "#d97706" },

  // ── Learn — Data ──────────────────────────────────────────────────────────
  { id: "learn",      label: "מרכז למידה",     sub: "7 מודולים",        url: `${BASE}/explore/data/learn`,             cx: 185, cy: 723, w: 120, color: "#0d9488" },
  { id: "analytics",  label: "אנליטיקה בשטח",  sub: "5 שלבים",          url: `${BASE}/explore/data/learn/analytics`,   cx: 185, cy: 818, w: 120, color: "#0d9488" },
  { id: "mystery",    label: "תעלומת TechFlow", sub: "SQL חקירה",        url: `${BASE}/explore/data/learn/mystery`,     cx: 185, cy: 913, w: 130, color: "#0d9488" },
  { id: "experience", label: "כלי עיבוד חוויה", sub: "6 שאלות SCCT",    url: `${BASE}/explore/data/experience`,        cx: 185, cy: 1008, w: 140, color: "#0d9488", badge: "חדש", badgeColor: "#0d9488" },

  // ── Learn — Cyber ─────────────────────────────────────────────────────────
  { id: "cyber-day",        label: "יום בחיי SOC",      sub: "Ransomware response",      url: `${BASE}/explore/cyber/learn/day`,     cx: 560, cy: 723, w: 130, color: "#dc2626" },
  { id: "cyber-mystery",    label: "תעלומת הדלף",       sub: "Data breach forensics",    url: `${BASE}/explore/cyber/learn/mystery`, cx: 560, cy: 818, w: 130, color: "#dc2626" },
  { id: "cyber-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",             url: `${BASE}/explore/cyber/experience`,    cx: 560, cy: 913, w: 140, color: "#dc2626", badge: "חדש", badgeColor: "#dc2626" },

  // ── Learn — Networks ──────────────────────────────────────────────────────
  { id: "networks-day",        label: "יום בחיי",          sub: "Network Engineer · 5 שלבים",   url: `${BASE}/explore/networks/learn/day`,     cx: 790, cy: 723, w: 148, color: "#2563eb" },
  { id: "networks-mystery",    label: "תעלומת TechFlow",   sub: "Firewall · DNS · curl",         url: `${BASE}/explore/networks/learn/mystery`, cx: 790, cy: 818, w: 130, color: "#2563eb" },
  { id: "networks-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",                  url: `${BASE}/explore/networks/experience`,    cx: 790, cy: 913, w: 140, color: "#2563eb", badge: "חדש", badgeColor: "#2563eb" },

  // דפי הקורסים — המשך אמיתי למי שרוצה ללמוד עוד
  { id: "data-courses",     label: "קורסי דאטה",  sub: "העשרה חיצונית", url: `${BASE}/explore/data/courses`,     cx: 55,  cy: 1008, w: 100, color: "#0d9488" },
  { id: "networks-courses", label: "קורסי רשתות", sub: "קמפוס IL · Cisco", url: `${BASE}/explore/networks/courses`, cx: 790, cy: 1008, w: 118, color: "#2563eb" },

  // ── סיכום והכנה לפגישה 2 ─────────────────────────────────────────────────
  { id: "results", label: "סיכום הטעימות", sub: "הכנה לפגישה עם הרכזת", url: `${BASE}/explore/results`, cx: 510, cy: 1093, w: 165, color: "#fb8500" },

  // ── פגישה 2 עם הרכזת ─────────────────────────────────────────────────────
  { id: "booked",  label: "הפגישה נקבעה", sub: "מה להביא — משתנה לפי פגישה", url: `${BASE}/contact/booked`, cx: 500, cy: 308, w: 165, color: "#023e8a" },

  // (הפגישות ממוקמות כל אחת בשלב שלה)
  // הדף בוחר לבד לפי מצב המועמד; ?m= הוא לבדיקה ידנית

  { id: "m1", label: "פגישה 1", sub: "היכרות · אין מה להביא", url: `${BASE}/contact?m=1`, cx: 250, cy: 308, w: 150, color: "#0ea5e9", kind: "meeting" },
  { id: "m2", label: "פגישה 2", sub: "בחירת תחום", url: `${BASE}/contact?m=2`, cx: 510, cy: 1183, w: 140, color: "#0ea5e9", kind: "meeting" },
  { id: "m3", label: "פגישה 3", sub: "נעילת מסלול", url: `${BASE}/contact?m=3`, cx: 510, cy: 1578, w: 140, color: "#0ea5e9", kind: "meeting" },

  // ── שלב 4 — מסלול לימודים ────────────────────────────────────────────────
  { id: "paths", label: "מסלולי לימוד", sub: "9 מסכים — לחצו על כל אחד למטה", url: `${BASE}/paths`, cx: 510, cy: 1298, w: 215, color: "#7c3aed", badge: "שלב 4", badgeColor: "#7c3aed" },

  // ── שמונת המסכים של שלב 4 ────────────────────────────────────────────────
  // כל אחד נפתח ישירות עם נתוני דמו, בלי לעבור את כל הזרימה
  { id: "p-intro",        label: "פתיחה",          sub: "מה נעשה כאן",         url: `${BASE}/paths?reset=1`,                   cx: 110, cy: 1398, w: 110, color: "#8b5cf6" },
  { id: "p-quiz",         label: "6 שאלות",        sub: "מגבלות החיים",        url: `${BASE}/paths?demo=1&phase=quiz`,         cx: 280, cy: 1398, w: 115, color: "#8b5cf6" },
  { id: "p-result",       label: "המסלול המומלץ",  sub: "ניקוד משוקלל",        url: `${BASE}/paths?demo=1&phase=result`,       cx: 450, cy: 1398, w: 135, color: "#8b5cf6" },
  { id: "p-routes",       label: "כל הדרכים מכאן", sub: "3 מסלולים כקווי רכבת", url: `${BASE}/paths?demo=1&phase=routes`,       cx: 640, cy: 1398, w: 145, color: "#8b5cf6", badge: "חדש", badgeColor: "#8b5cf6" },
  { id: "p-blockers",     label: "מה עומד בדרך",   sub: "חסם ← פתרון + תאריך", url: `${BASE}/paths?demo=1&phase=blockers`,     cx: 840, cy: 1398, w: 140, color: "#fb8500", badge: "הלב", badgeColor: "#fb8500" },
  { id: "p-institutions", label: "מוסדות",         sub: "בניית רשימה",         url: `${BASE}/paths?demo=1&phase=institutions`, cx: 840, cy: 1493, w: 120, color: "#8b5cf6" },
  { id: "p-prep",         label: "שאלות לפגישה",   sub: "נוצרות מהתשובות",     url: `${BASE}/paths?demo=1&phase=prep`,         cx: 640, cy: 1493, w: 135, color: "#8b5cf6" },
  { id: "p-research",     label: "ערכת חקר",       sub: "אופציונלי",           url: `${BASE}/paths?demo=1&phase=research`,     cx: 430, cy: 1493, w: 115, color: "#8b5cf6" },
  { id: "p-done",         label: "סיכום",          sub: "לפני/בפגישה + CTA",   url: `${BASE}/paths?demo=1&phase=done`,         cx: 220, cy: 1493, w: 120, color: "#8b5cf6", badge: "סיום", badgeColor: "#8b5cf6" },

  // ── שלב 5 — לוגיסטיקה ומלגות ─────────────────────────────────────────────
  { id: "plan", label: "התוכנית שלי", sub: "5 מסכים — לחצו על כל אחד למטה", url: `${BASE}/plan`, cx: 510, cy: 1693, w: 215, color: "#059669", badge: "שלב 5", badgeColor: "#059669" },

  { id: "pl-intro", label: "פתיחה לשלב",  sub: "מה קורה כאן",          url: `${BASE}/plan?reset=1`,      cx: 130, cy: 1793, w: 125, color: "#10b981" },
  { id: "pl-plan",  label: "התוכנית",     sub: "עוגן + חודשים",        url: `${BASE}/plan?view=plan`,    cx: 320, cy: 1793, w: 130, color: "#10b981", badge: "הבית", badgeColor: "#10b981" },
  { id: "pl-money", label: "החשבון",      sub: "מספר במקום הרגעה",     url: `${BASE}/plan?view=money`,   cx: 520, cy: 1793, w: 140, color: "#fb8500", badge: "הלב", badgeColor: "#fb8500" },
  { id: "pl-docs",  label: "ארון מסמכים", sub: "סטטוס ומיקום בלבד",    url: `${BASE}/plan?view=docs`,    cx: 730, cy: 1793, w: 140, color: "#10b981" },
  { id: "pl-coord", label: "עדכון לרכזת", sub: "נבנה מעצמו · וואטסאפ", url: `${BASE}/plan?view=coord`,   cx: 900, cy: 1793, w: 145, color: "#10b981", badge: "סיום", badgeColor: "#10b981" },
];

// ─── Edges ────────────────────────────────────────────────────────────────────

const EDGES: Edge[] = [
  // Auth flow
  { from: "login",      to: "onboarding", label: "הרשמה" },
  { from: "login", to: "ob-0", color: "#3b82f6" },
  { from: "ob-0", to: "ob-1", color: "#3b82f6" },
  { from: "ob-1", to: "ob-2", color: "#3b82f6" },
  { from: "ob-2", to: "ob-3", color: "#3b82f6" },
  { from: "ob-3", to: "ob-4", color: "#3b82f6" },
  { from: "ob-4", to: "ob-5", color: "#3b82f6" },
  { from: "ob-5", to: "dashboard", color: "#3b82f6" },
  { from: "dashboard", to: "waiting", color: "#3b82f6" },
  { from: "waiting",   to: "m1",      label: "לקבוע", color: "#0ea5e9" },

  // Dashboard → bottom nav
  { from: "dashboard", to: "chat",  dashed: true, color: "#6b7280" },
  { from: "dashboard", to: "squad", dashed: true, color: "#6b7280" },

  // Dashboard → explore (stage 3)
  { from: "dashboard", to: "explore", label: "שלב 3 — כנס לחקור" },

  // Explore → domains
  { from: "explore", to: "d-code" },
  { from: "explore", to: "d-data" },
  { from: "explore", to: "d-marketing" },
  { from: "explore", to: "d-ai" },
  { from: "explore", to: "d-cyber" },
  { from: "explore", to: "d-ux" },
  { from: "explore", to: "d-networks" },

  // Domains → sims
  { from: "d-code",      to: "s-code",      label: "קדימה לסימולציה" },
  { from: "d-data",      to: "s-data",      label: "קדימה לסימולציה" },
  { from: "d-marketing", to: "s-marketing", label: "קדימה לסימולציה" },
  { from: "d-ai",        to: "s-ai",        label: "קדימה לסימולציה" },
  { from: "d-cyber",     to: "s-cyber",     label: "קדימה לסימולציה" },
  { from: "d-ux",        to: "s-ux",        label: "קדימה לסימולציה" },
  { from: "d-networks",  to: "s-networks",  label: "קדימה לסימולציה" },

  // Data domain → learn
  { from: "d-data",    to: "learn",      label: "מרכז למידה",   color: "#0d9488" },
  { from: "s-data",    to: "learn",      label: "מיציתי ←",     color: "#0d9488", dashed: true },

  // Data learn flow (sequential)
  { from: "learn",     to: "analytics",  label: "אנליטיקה",     color: "#0d9488" },
  { from: "analytics", to: "mystery",    label: "מיציתי ←",     color: "#0d9488" },
  { from: "mystery",   to: "experience", label: "מיציתי ←",     color: "#0d9488" },

  // Cyber learn flow (sequential)
  { from: "s-cyber",         to: "cyber-day",         label: "מיציתי ←",  color: "#dc2626" },
  { from: "cyber-day",       to: "cyber-mystery",     label: "מיציתי ←",  color: "#dc2626" },
  { from: "cyber-mystery",   to: "cyber-experience",  label: "מיציתי ←",  color: "#dc2626" },

  // Networks learn flow (sequential)
  { from: "s-networks",        to: "networks-day",        label: "מיציתי ←",          color: "#2563eb" },
  { from: "networks-day",      to: "networks-mystery",    label: "מיציתי ←",          color: "#2563eb" },
  { from: "networks-mystery",  to: "networks-experience", label: "מיציתי ←",          color: "#2563eb" },

  // Sim → next domain (conceptual)
  { from: "s-code", to: "explore", label: "תחום הבא", dashed: true, color: "#d97706" },

  // כלי עיבוד החוויה → סיכום (נפתח אחרי 2+ תחומים)
  { from: "experience",          to: "results", label: "2+ תחומים ←", color: "#fb8500" },
  { from: "cyber-experience",    to: "results", color: "#fb8500", dashed: true },
  { from: "networks-experience", to: "results", color: "#fb8500", dashed: true },

  // סיכום → פגישה 2 → אישור
  { from: "experience", to: "data-courses", label: "ללמוד עוד", dashed: true, color: "#0d9488" },
  { from: "networks-experience", to: "networks-courses", label: "ללמוד עוד", dashed: true, color: "#2563eb" },
  { from: "results", to: "m2", label: "לקביעת פגישה", color: "#0ea5e9" },
  { from: "m1", to: "booked",  label: "אישור Cal.com", color: "#023e8a" },

  // אישור → שלב 4 (דרך הדשבורד או כפתור "חקר" בניווט)
  { from: "m2", to: "paths", label: "לחקר מסלולים", color: "#7c3aed" },

  // שמונת המסכים של שלב 4, לפי הסדר
  { from: "paths",          to: "p-intro",        color: "#8b5cf6" },
  { from: "p-intro",        to: "p-quiz",         color: "#8b5cf6" },
  { from: "p-quiz",         to: "p-result",       color: "#8b5cf6" },
  { from: "p-result",       to: "p-routes",       color: "#8b5cf6" },
  { from: "p-routes",       to: "p-blockers",     color: "#8b5cf6" },
  { from: "p-blockers",     to: "p-institutions", color: "#fb8500" },
  { from: "p-institutions", to: "p-prep",         color: "#8b5cf6" },
  { from: "p-prep",         to: "p-research",     label: "אופציונלי", dashed: true, color: "#8b5cf6" },
  { from: "p-research",     to: "p-done",         color: "#8b5cf6" },
  { from: "p-done",         to: "m3",        label: "קביעת פגישה 3", color: "#0ea5e9" },

  // פגישה 3 נועלת מסלול → שלב 5
  { from: "m3", to: "plan", label: "אחרי שהמסלול ננעל", color: "#059669" },

  // חמשת המסכים של שלב 5
  { from: "plan",     to: "pl-intro", color: "#10b981" },
  { from: "pl-intro", to: "pl-plan",  color: "#10b981" },
  { from: "pl-plan",  to: "pl-money", label: "הכסף", color: "#fb8500" },
  { from: "pl-plan",  to: "pl-docs",  color: "#10b981" },
  { from: "pl-docs",  to: "pl-coord", color: "#10b981" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getNode(id: string): Node | undefined {
  return NODES.find(n => n.id === id);
}

function nodeRect(n: Node) {
  const h = n.h ?? NH;
  return { left: n.cx - n.w / 2, top: n.cy - h / 2, w: n.w, h };
}

// SVG path between two nodes — straight lines, smart entry/exit points
function edgePath(from: Node, to: Node): string {
  const fh = from.h ?? NH;
  const th = to.h ?? NH;
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;

  // Horizontal connections: same row OR side-panel (large dx, small dy)
  const isHorizontal = Math.abs(dy) <= 30 || (Math.abs(dx) > 150 && Math.abs(dy) < 100);
  if (isHorizontal) {
    const x1 = dx > 0 ? from.cx + from.w / 2 + 2 : from.cx - from.w / 2 - 2;
    const x2 = dx > 0 ? to.cx - to.w / 2 - 2 : to.cx + to.w / 2 + 2;
    return `M ${x1} ${from.cy} L ${x2} ${to.cy}`;
  }

  // Back-edge (going upward) — curve around left side
  if (dy < 0) {
    const x1 = from.cx - from.w / 2 - 2;
    const y1 = from.cy;
    const x2 = to.cx - to.w / 2 - 2;
    const y2 = to.cy + th / 2;
    const midX = Math.min(x1, x2) - 40;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }

  // Forward vertical/diagonal: bottom-center → top-center, straight line
  const x1 = from.cx;
  const y1 = from.cy + fh / 2 + 2;
  const x2 = to.cx;
  const y2 = to.cy - th / 2 - 2;
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

// ─── Node Component ───────────────────────────────────────────────────────────

function FlowNode({ node }: { node: Node }) {
  const r = nodeRect(node);
  const hasSubtitle = !!node.sub;
  const h = hasSubtitle ? 52 : 40;

  return (
    <a
      href={node.url}
      target="_blank"
      rel="noopener noreferrer"
      title={node.label + (node.sub ? " — " + node.sub : "")}
      style={{
        position: "absolute",
        left: r.left,
        top: node.cy - h / 2,
        width: r.w,
        height: h,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: node.kind === "meeting" ? 999 : 10,
        background: node.kind === "meeting" ? `${node.color}1a` : "#fff",
        border: node.kind === "meeting" ? `2.5px solid ${node.color}` : `2px solid ${node.color}`,
        boxShadow: `0 2px 8px ${node.color}22`,
        textDecoration: "none",
        cursor: "pointer",
        transition: "transform 0.12s, box-shadow 0.12s",
        zIndex: 2,
        padding: "0 6px",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.06)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 16px ${node.color}44`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 2px 8px ${node.color}22`;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: node.color, textAlign: "center", lineHeight: 1.2, fontFamily: "'Heebo', sans-serif" }}>
          {node.label}
        </span>
        {node.badge && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 99,
            background: node.badgeColor || node.color, color: "#fff", whiteSpace: "nowrap",
          }}>
            {node.badge}
          </span>
        )}
      </div>
      {node.sub && (
        <div style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", marginTop: 2, textAlign: "center" }}>
          {node.sub}
        </div>
      )}
    </a>
  );
}

// ─── SVG Arrows ──────────────────────────────────────────────────────────────

function Arrows() {
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }}
    >
      <defs>
        {/* Arrowhead markers per color */}
        {["#023e8a", "#fb8500", "#d97706", "#0d9488", "#6b7280", "#2563eb", "#dc2626", "#7c3aed", "#8b5cf6"].map(c => (
          <marker
            key={c}
            id={`arrow-${c.replace("#", "")}`}
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 7 3.5, 0 7" fill={c} opacity={0.7} />
          </marker>
        ))}
      </defs>

      {EDGES.map((edge, i) => {
        const from = getNode(edge.from);
        const to = getNode(edge.to);
        if (!from || !to) return null;

        const color = edge.color || from.color;
        const markerId = `arrow-${color.replace("#", "")}`;
        const d = edgePath(from, to);

        // Mid point for label
        const fh = from.h ?? NH;
        const th = to.h ?? NH;
        const x1 = from.cx, y1 = from.cy + fh / 2;
        const x2 = to.cx,   y2 = to.cy - th / 2;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={edge.dashed ? 1.5 : 2}
              strokeDasharray={edge.dashed ? "5 4" : undefined}
              opacity={edge.dashed ? 0.45 : 0.7}
              markerEnd={`url(#${markerId})`}
            />
            {edge.label && (
              <text
                x={mx}
                y={my}
                textAnchor="middle"
                fontSize={8}
                fill={color}
                opacity={0.8}
                fontFamily="'Heebo', sans-serif"
                fontWeight="bold"
              >
                <rect x={mx - 28} y={my - 8} width={56} height={11} fill="white" rx={3} opacity={0.85} />
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Bands ────────────────────────────────────────────────────────────────────
//
// הקנבס מחולק לרצועות אופקיות. **הרצועה הראשונה היא לא חלק ממסע המועמד** —
// היא הכלים הרוחביים (ניהול פנימי, ומסכים שרלוונטיים לאורך כל המסע). הפרדה
// ויזואלית ברורה, כי בלעדיה מסכי הניהול נראים כמו תחנה במסע והם לא.

type Band = { label: string; top: number; color: string; cross?: boolean };

const BANDS: Band[] = [
  { label: "כלים רוחביים — פנימי, לאורך כל המסע", top: 14, color: "#475569", cross: true },
  { label: "שלב 1 · טרום אינטייק — הרשמה והמתנה", top: 116, color: "#023e8a" },
  { label: "שלב 2 · אינטייק — פגישת ההיכרות", top: 250, color: "#0ea5e9" },
  { label: "שלב 3 · חשיפה — טעימות הייטק", top: 370, color: "#fb8500" },
  { label: "שלב 4 · מסלול לימודים", top: 1236, color: "#7c3aed" },
  { label: "שלב 5 · לוגיסטיקה ומלגות", top: 1630, color: "#059669" },
];

// ─── Section Labels ───────────────────────────────────────────────────────────
// תוויות עמודה בתוך רצועה — לא הפרדה בין רצועות

const LABELS = [
  { text: "דפי תחום (×7)",   x: 10,  y: 362, color: "#fb8500" },
  { text: "סימולציות (×7)",  x: 10,  y: 462, color: "#d97706" },
  { text: "מרכז למידה דאטה",   x: 10,  y: 575, color: "#0d9488" },
  { text: "מרכז למידה סייבר",  x: 370, y: 575, color: "#dc2626" },
  { text: "מרכז למידה רשתות", x: 660, y: 575, color: "#2563eb" },
  { text: "תשעת המסכים — ?demo=1&phase= פותח כל אחד ישירות", x: 10, y: 1300, color: "#8b5cf6" },
  { text: "חמשת המסכים — ?view= פותח כל אחד ישירות", x: 10, y: 1600, color: "#10b981" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const totalScreens = NODES.length;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      {/* Header */}
      <div style={{ background: "#023e8a", color: "#fff", padding: "24px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 3, marginBottom: 6 }}>TECHCAREERLY</div>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Heebo', sans-serif" }}>מפת האפליקציה</div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.65 }}>
            {totalScreens} מסכים · לחיצה = פתיחת המסך · חצים = מעבר ניווט אמיתי
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "10px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { color: "#023e8a", label: "Auth + Dashboard" },
            { color: "#fb8500", label: "חקר תחומים" },
            { color: "#d97706", label: "סימולציות" },
            { color: "#0d9488", label: "מרכז למידה" },
            { color: "#2563eb", label: "מרכז למידה — רשתות" },
            { color: "#dc2626", label: "מרכז למידה — סייבר" },
            { color: "#7c3aed", label: "שלב 4 — מסלול לימודים" },
            { color: "#059669", label: "שלב 5 — לוגיסטיקה ומלגות" },
            { color: "#475569", label: "ניהול פנימי" },
            { color: "#6b7280", label: "בקרוב" },
          ].map(({ color, label }) => (
            <div key={color} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(0,0,0,0.55)" }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, background: color }} />
              {label}
            </div>
          ))}
          <div style={{ marginRight: "auto", fontSize: 10, color: "rgba(0,0,0,0.35)" }}>
            עדכון: src/app/map/page.tsx
          </div>
        </div>
      </div>

      {/* Diagram */}
      <div style={{ overflowX: "auto", padding: "24px 16px 40px" }}>
        <div style={{ minWidth: W, margin: "0 auto", maxWidth: W + 40 }}>
          <div style={{ position: "relative", width: W, height: H, margin: "0 auto" }}>
            {/* Background section labels */}
            <svg
              width={W}
              height={H}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }}
            >
              {/* רצועות. הרוחבית מקבלת רקע וקו מלא — כדי שיהיה ברור שהיא לא
                  תחנה במסע אלא משהו שיושב מעליו */}
              {BANDS.map((b, i) => {
                const next = BANDS[i + 1]?.top ?? H;
                return (
                  <g key={b.label}>
                    {b.cross && (
                      <rect x={0} y={b.top} width={W} height={next - b.top - 8} fill={b.color} opacity={0.035} rx={10} />
                    )}
                    <line
                      x1={0} y1={b.top} x2={W} y2={b.top}
                      stroke={b.color}
                      strokeWidth={b.cross ? 1.5 : 1}
                      strokeDasharray={b.cross ? undefined : "5 4"}
                      opacity={b.cross ? 0.35 : 0.28}
                    />
                    <rect
                      x={W - 22 - b.label.length * 5.6} y={b.top - 9}
                      width={b.label.length * 5.6 + 24} height={18}
                      rx={9} fill="#f5f3ef"
                    />
                    <text
                      x={W - 16} y={b.top + 4}
                      textAnchor="start" direction="rtl"
                      fontSize={10} fill={b.color} fontWeight={800}
                      fontFamily="'Heebo', sans-serif" opacity={0.75}
                    >
                      {b.label}
                    </text>
                  </g>
                );
              })}

              {LABELS.map(l => (
                <text key={l.text} x={l.x} y={l.y + 10} fontSize={9} fill={l.color} fontWeight={700}
                  fontFamily="'Heebo', sans-serif" opacity={0.6}>
                  {l.text}
                </text>
              ))}
            </svg>

            {/* Arrows (SVG layer) */}
            <Arrows />

            {/* Nodes (HTML layer) */}
            {NODES.map(node => <FlowNode key={node.id} node={node} />)}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ textAlign: "center", padding: "12px 0 32px", fontSize: 10, color: "rgba(0,0,0,0.3)" }}>
        דף זה מתעדכן ידנית · להוספת מסך: NODES + EDGES ב-src/app/map/page.tsx
      </div>
    </div>
  );
}
