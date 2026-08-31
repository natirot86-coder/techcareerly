/**
 * /map — מפת ניווט ויזואלית של כל מסכי האפליקציה
 *
 * כל כרטיס = מסך אמיתי · לחיצה = פתיחת המסך · חצים = מעבר בין מסכים
 *
 * להוסיף מסך: הוסף node ל-NODES + edge ל-EDGES
 */
"use client";

import { useState } from "react";
import { INSTITUTIONS, DOMAIN_LABEL } from "@/data/institutions";
import { FUNDING } from "@/data/scholarships";
import { COURSES } from "@/data/courses";

/*
  המספרים על המפה נגזרים מהנתונים ולא מוקלדים (28.8) — הם אמרו
  "29 מוסדות" ו"17 מלגות" בזמן שבקוד היו 88 ו-39. מספר שמוקלד
  נכון ביום שכתבו אותו ושגוי מחר, ואיש לא מרענן תווית על מפת ניווט.
*/
const N_INST = INSTITUTIONS.length;
const N_FUND = FUNDING.length;
const N_COURSE = COURSES.length;
const N_DOMAIN = Object.keys(DOMAIN_LABEL).length;

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
  /**
   * לאיזה מסע הצומת שייך. חסר = **לשניהם**, וזה הרוב המכריע —
   * המפה אמורה להראות בעין שהאפליקציה אחת ושני המסעות חולקים כמעט הכל.
   */
  only?: Cohort[];
};

type Cohort = "main" | "alumni";

type Edge = {
  from: string;
  to: string;
  only?: Cohort[];
  label?: string;        // תיאור המעבר (כפתור / פעולה)
  dashed?: boolean;
  color?: string;
};

// ─── Canvas ───────────────────────────────────────────────────────────────────

const W = 1300;
const H = 1900;
const NH = 44;   // node height default

// ─── Nodes ────────────────────────────────────────────────────────────────────

const BASE = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://hasifaapp.vercel.app";

/*
  כל עץ החשיפה — תחומים, סימולציות ומרכזי הלמידה — שייך לקהל הרחב בלבד.
  לתייג שלושים צמתים אחד-אחד היה מזמין שכחה, ולכן זה נגזר מהמזהה: המבנה
  כבר מקודד את השיוך, ואין רשימה שנייה שיכולה להתיישן.
*/
const EXPLORE_TREE = /^(d-|s-|code-|cyber-|networks-|qa-|mkt-|ai-|ux-|hw-)|^(learn|analytics|mystery|experience|results)$/;

export function nodeCohorts(id: string, only?: Cohort[]): Cohort[] {
  if (only) return only;
  return EXPLORE_TREE.test(id) ? ["main"] : ["main", "alumni"];
}

const NODES: Node[] = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  { id: "login",      label: "כניסה",      sub: "SMS OTP",             url: `${BASE}/login`,      cx: 65,  cy: 195,  w: 82,  color: "#023e8a" },
  { id: "dashboard",  label: "מסך המסע", sub: "סרפנטינה · תחנות שקרו באמת", url: `${BASE}/journey`,  cx: 920,  cy: 195,  w: 120, color: "#023e8a", badge: "עודכן", badgeColor: "#023e8a" },
  { id: "waiting", label: "מרחב ההמתנה", sub: "ציר + מבוא להייטק + הכנה", url: `${BASE}/waiting`, cx: 1060, cy: 195, w: 110, color: "#0ea5e9", badge: "עודכן", badgeColor: "#0ea5e9" },


  // ששת מסכי האונבורדינג (Step 0–5 בקוד). לא נפתחים ישירות — הזרימה רציפה
  { id: "ob-0", label: "פתיחה",       sub: "מה האפליקציה עושה", url: `${BASE}/onboarding`, cx: 185,  cy: 195, w: 92, color: "#3b82f6" },
  { id: "ob-1", label: "פרטים", sub: "שם · גיל · אזור", url: `${BASE}/onboarding`, cx: 305, cy: 195, w: 92, color: "#3b82f6" },
  { id: "ob-2", label: "עניין בטק",   sub: "סולם עצמי",     url: `${BASE}/onboarding`, cx: 425, cy: 195, w: 92, color: "#3b82f6" },
  { id: "ob-3", label: "חסמים",        sub: "מה עוצר אותך",    url: `${BASE}/onboarding`, cx: 545, cy: 195, w: 92, color: "#3b82f6" },
  { id: "ob-4", label: "סיום השאלון",  sub: "מה קורה עכשיו",   url: `${BASE}/onboarding`, cx: 665, cy: 195, w: 92, color: "#3b82f6" },
  { id: "ob-5", label: "סיור", sub: "שקופיות",       url: `${BASE}/onboarding`, cx: 790, cy: 195, w: 98, color: "#3b82f6" },

  // ── Bottom nav (soon) ─────────────────────────────────────────────────────
  { id: "chat",  label: "שאלות ותשובות", sub: "במקום צ'אט ה-AI — תשובות שנכתבו ידנית", url: `${BASE}/faq`,  cx: 940, cy: 122,  w: 130, color: "#023e8a", badge: "חדש", badgeColor: "#023e8a" },
  { id: "squad", label: "קהילה",       sub: "אירועים · קבוצות · בוגר", url: `${BASE}/squad`, cx: 1075, cy: 122, w: 110, color: "#023e8a" },
  { id: "admin", label: "ניהול מוסדות", sub: `${N_INST} מוסדות · פנימי`, url: `${BASE}/admin/institutions`, cx: 85, cy: 62, w: 140, color: "#475569", badge: "ניהול", badgeColor: "#475569" },
  { id: "admin-funding", label: "ניהול מלגות", sub: `${N_FUND} מלגות ותוכניות · פנימי`, url: `${BASE}/admin/scholarships`, cx: 250, cy: 62, w: 155, color: "#475569", badge: "ניהול", badgeColor: "#475569" },
  { id: "reset", label: "בדיקה מההתחלה", sub: "מוחק הכל · פנימי", url: `${BASE}/reset`, cx: 1045, cy: 62, w: 130, color: "#dc2626", badge: "ניקוי", badgeColor: "#dc2626" },
  { id: "admin-degrees", label: "תחומים ותארים", sub: "מיפוי תואר×מוסד · פנימי", url: `${BASE}/admin/degrees`, cx: 730, cy: 62, w: 140, color: "#475569", badge: "ניהול", badgeColor: "#475569" },
  { id: "admin-coordinator", label: "מסך הרכזת", sub: "מי צריך אותי היום · פנימי", url: `${BASE}/admin/coordinator`, cx: 885, cy: 62, w: 135, color: "#475569", badge: "ניהול", badgeColor: "#475569" },
  { id: "admin-courses", label: "ניהול קורסים", sub: `${N_COURSE} קורסים · פנימי`, url: `${BASE}/admin/courses`, cx: 575, cy: 62, w: 140, color: "#475569", badge: "ניהול", badgeColor: "#475569" },
  { id: "admin-analytics", label: "אנליטיקות", sub: "מה קורה באפליקציה · פנימי", url: `${BASE}/admin/analytics`, cx: 415, cy: 62, w: 155, color: "#475569", badge: "ניהול", badgeColor: "#475569" },

  // ── Explore ───────────────────────────────────────────────────────────────
  { id: "explore", only: ["main"], label: "חקר תחומים", sub: `דירוג ${N_DOMAIN} תחומים`, url: `${BASE}/explore`, cx: 575, cy: 455, w: 140, color: "#fb8500" },

  // ── Domain pages ──────────────────────────────────────────────────────────
  { id: "d-code",      label: "קוד",       url: `${BASE}/explore/code`,      cx: 70,  cy: 555, w: 72, color: "#fb8500" },
  { id: "d-data",      label: "דאטה",      url: `${BASE}/explore/data`,      cx: 215, cy: 555, w: 72, color: "#fb8500" },
  { id: "d-marketing", label: "מרקטינג",   url: `${BASE}/explore/marketing`, cx: 360, cy: 555, w: 80, color: "#fb8500" },
  { id: "d-ai",        label: "AI",        url: `${BASE}/explore/ai`,        cx: 505, cy: 555, w: 60, color: "#fb8500" },
  { id: "d-cyber",     label: "סייבר",     url: `${BASE}/explore/cyber`,     cx: 650, cy: 555, w: 72, color: "#fb8500" },
  { id: "d-ux",        label: "UX",        url: `${BASE}/explore/ux`,        cx: 795, cy: 555, w: 60, color: "#fb8500" },
  { id: "d-networks",  label: "רשתות",     url: `${BASE}/explore/networks`,  cx: 940, cy: 555, w: 76, color: "#fb8500" },
  { id: "d-qa",        label: "QA",        url: `${BASE}/explore/qa`,        cx: 1085, cy: 555, w: 60, color: "#fb8500" },
  { id: "d-hardware",  label: "חומרה",     url: `${BASE}/explore/hardware`,  cx: 1230, cy: 555, w: 72, color: "#fb8500" },

  // ── Simulations ───────────────────────────────────────────────────────────
  { id: "s-code",      label: "sim / קוד",      url: `${BASE}/explore/code/sim`,      cx: 70,  cy: 655, w: 90,  color: "#d97706" },
  { id: "s-data",      label: "sim / דאטה",     url: `${BASE}/explore/data/sim`,      cx: 215, cy: 655, w: 90,  color: "#d97706" },
  { id: "s-marketing", label: "sim / מרקטינג",  url: `${BASE}/explore/marketing/sim`, cx: 360, cy: 655, w: 110, color: "#d97706" },
  { id: "s-ai",        label: "sim / AI",       url: `${BASE}/explore/ai/sim`,        cx: 505, cy: 655, w: 80,  color: "#d97706" },
  { id: "s-cyber",     label: "sim / סייבר",    url: `${BASE}/explore/cyber/sim`,     cx: 650, cy: 655, w: 100, color: "#d97706" },
  { id: "s-ux",        label: "sim / UX",       url: `${BASE}/explore/ux/sim`,        cx: 795, cy: 655, w: 80,  color: "#d97706" },
  { id: "s-networks",  label: "sim / רשתות",    url: `${BASE}/explore/networks/sim`,  cx: 940, cy: 655, w: 100, color: "#d97706" },
  { id: "s-qa",        label: "sim / QA",       url: `${BASE}/explore/qa/sim`,        cx: 1085, cy: 655, w: 90,  color: "#d97706" },
  { id: "s-hardware",  label: "sim / חומרה",    url: `${BASE}/explore/hardware/sim`,  cx: 1230, cy: 655, w: 100, color: "#d97706" },

  // ── Learn — Code ──────────────────────────────────────────────────────────
  { id: "code-day",        label: "יום בחיי מפתח",   sub: "triage · review",     url: `${BASE}/explore/code/learn/day`,     cx: 70, cy: 760, w: 115, color: "#3b82f6" },
  { id: "code-mystery",    label: "תעלומת הקוד",     sub: "git blame · regression", url: `${BASE}/explore/code/learn/mystery`, cx: 70, cy: 855, w: 110, color: "#3b82f6" },
  { id: "code-experience", label: "עיבוד חוויה",     sub: "6 שאלות SCCT",        url: `${BASE}/explore/code/experience`,    cx: 70, cy: 950, w: 115, color: "#3b82f6", badge: "חדש", badgeColor: "#3b82f6" },

  // ── Learn — Data ──────────────────────────────────────────────────────────
    { id: "learn",      label: "מרכז למידה",     sub: "רשות · 7 מודולים", url: `${BASE}/explore/data/learn`,             cx: 287, cy: 605, w: 118, color: "#0d9488" },
  { id: "analytics",  label: "אנליטיקה בשטח",  sub: "5 שלבים",          url: `${BASE}/explore/data/learn/analytics`,   cx: 215, cy: 760, w: 120, color: "#0d9488" },
  { id: "mystery",    label: "תעלומת TechFlow", sub: "SQL חקירה",        url: `${BASE}/explore/data/learn/mystery`,     cx: 215, cy: 855, w: 130, color: "#0d9488" },
  { id: "experience", label: "כלי עיבוד חוויה", sub: "6 שאלות SCCT",    url: `${BASE}/explore/data/experience`,        cx: 215, cy: 950, w: 140, color: "#0d9488", badge: "חדש", badgeColor: "#0d9488" },

  // ── Learn — Cyber ─────────────────────────────────────────────────────────
  { id: "cyber-day",        label: "יום בחיי SOC",      sub: "Ransomware response",      url: `${BASE}/explore/cyber/learn/day`,     cx: 650, cy: 760, w: 130, color: "#dc2626" },
  { id: "cyber-mystery",    label: "תעלומת הדלף",       sub: "Data breach forensics",    url: `${BASE}/explore/cyber/learn/mystery`, cx: 650, cy: 855, w: 130, color: "#dc2626" },
  { id: "cyber-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",             url: `${BASE}/explore/cyber/experience`,    cx: 650, cy: 950, w: 140, color: "#dc2626", badge: "חדש", badgeColor: "#dc2626" },

  // ── Learn — Networks ──────────────────────────────────────────────────────
  { id: "networks-day",        label: "יום בחיי",          sub: "Network Engineer‏ · 5 שלבים",   url: `${BASE}/explore/networks/learn/day`,     cx: 940, cy: 760, w: 148, color: "#2563eb" },
  { id: "networks-mystery",    label: "תעלומת TechFlow",   sub: "Firewall · DNS · curl",         url: `${BASE}/explore/networks/learn/mystery`, cx: 940, cy: 855, w: 130, color: "#2563eb" },
  { id: "networks-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",                  url: `${BASE}/explore/networks/experience`,    cx: 940, cy: 950, w: 140, color: "#2563eb", badge: "חדש", badgeColor: "#2563eb" },


  // ── Learn — QA ────────────────────────────────────────────────────────────
  { id: "qa-day",        label: "יום בחיי QA",       sub: "triage · test review",   url: `${BASE}/explore/qa/learn/day`,     cx: 1085, cy: 760, w: 130, color: "#d97706" },
  { id: "qa-mystery",    label: "איך זה עבר QA?",    sub: "coverage · CI history",  url: `${BASE}/explore/qa/learn/mystery`, cx: 1085, cy: 855, w: 135, color: "#d97706" },
  { id: "qa-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",           url: `${BASE}/explore/qa/experience`,    cx: 1085, cy: 950, w: 140, color: "#d97706", badge: "חדש", badgeColor: "#d97706" },

  // ── Learn — Marketing (טעימה מלאה 24.8 — מיני-פרויקט במקום תעלומה) ────────
  { id: "mkt-day",        label: "יום בחיי שיווק",   sub: "הסטודיו של מיכל",     url: `${BASE}/explore/marketing/learn/day`,     cx: 360, cy: 760, w: 125, color: "#f97316" },
  { id: "mkt-mystery",    label: "קמפיין ב-300 ₪",   sub: "מיני-פרויקט · מספרה", url: `${BASE}/explore/marketing/learn/mystery`, cx: 360, cy: 855, w: 125, color: "#f97316" },
  { id: "mkt-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",        url: `${BASE}/explore/marketing/experience`,    cx: 360, cy: 950, w: 140, color: "#f97316", badge: "חדש", badgeColor: "#f97316" },

  // ── Learn — AI (טעימה מלאה 24.8) ──────────────────────────────────────────
  { id: "ai-day",        label: "יום בחיי מיישם AI", sub: "הצ'אטבוט של המאפייה",  url: `${BASE}/explore/ai/learn/day`,     cx: 505, cy: 760, w: 140, color: "#7c3aed" },
  { id: "ai-mystery",    label: "העוזר של המרפאה",   sub: "מיני-פרויקט · 3 הגדרות", url: `${BASE}/explore/ai/learn/mystery`, cx: 505, cy: 855, w: 130, color: "#7c3aed" },
  { id: "ai-experience", label: "כלי עיבוד חוויה",   sub: "6 שאלות SCCT",          url: `${BASE}/explore/ai/experience`,    cx: 505, cy: 950, w: 140, color: "#7c3aed", badge: "חדש", badgeColor: "#7c3aed" },

  // ── Learn — UX (טעימה מלאה 24.8) ──────────────────────────────────────────
  { id: "ux-day",        label: "יום בחיי מעצב/ת",  sub: "60% נוטשים בטלפון",     url: `${BASE}/explore/ux/learn/day`,     cx: 795, cy: 760, w: 130, color: "#db2777" },
  { id: "ux-mystery",    label: "מסך הקבלה לגמ\"ח", sub: "מיני-פרויקט · רחל 72",  url: `${BASE}/explore/ux/learn/mystery`, cx: 795, cy: 855, w: 130, color: "#db2777" },
  { id: "ux-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",          url: `${BASE}/explore/ux/experience`,    cx: 795, cy: 950, w: 140, color: "#db2777", badge: "חדש", badgeColor: "#db2777" },

  // ── Learn — Hardware (20.8 — שני הכובעים: מעבדה + תכנון) ──────────────────
  { id: "hw-day",        label: "יום בחיי חומרה",   sub: "מעבדה + תכנון",       url: `${BASE}/explore/hardware/learn/day`,     cx: 1230, cy: 760, w: 130, color: "#0891b2" },
  { id: "hw-mystery",    label: "אצוות הקבלים",     sub: "תעלומת ייצור",        url: `${BASE}/explore/hardware/learn/mystery`, cx: 1230, cy: 855, w: 120, color: "#0891b2" },
  { id: "hw-experience", label: "כלי עיבוד חוויה",  sub: "6 שאלות SCCT",        url: `${BASE}/explore/hardware/experience`,    cx: 1230, cy: 950, w: 140, color: "#0891b2", badge: "חדש", badgeColor: "#0891b2" },

  // ── סיכום והכנה לפגישה 2 ─────────────────────────────────────────────────
  { id: "results", label: "סיכום הטעימות", sub: "הכנה לפגישה עם הרכזת", url: `${BASE}/explore/results`, cx: 575, cy: 1150, w: 165, color: "#fb8500" },

  // ── פגישה 2 עם הרכזת ─────────────────────────────────────────────────────
  { id: "booked",  label: "הפגישה נקבעה", sub: "מה להביא — משתנה לפי פגישה", url: `${BASE}/contact/booked`, cx: 660, cy: 358, w: 165, color: "#023e8a" },

  // (הפגישות ממוקמות כל אחת בשלב שלה)
  // הדף בוחר לבד לפי מצב המועמד; ?m= הוא לבדיקה ידנית

  { id: "m1", label: "פגישה 1", sub: "היכרות · אין מה להביא", url: `${BASE}/contact?m=1`, cx: 330, cy: 358, w: 150, color: "#0ea5e9", kind: "meeting" },
  { id: "m2", only: ["main"], label: "פגישה 2", sub: "בחירת תחום", url: `${BASE}/contact?m=2`, cx: 575, cy: 1245, w: 140, color: "#0ea5e9", kind: "meeting" },
  { id: "m3", label: "פגישה 3", sub: "נעילת מסלול", url: `${BASE}/contact?m=3`, cx: 575, cy: 1645, w: 140, color: "#0ea5e9", kind: "meeting" },

  // ── שלב 4 — מסלול לימודים ────────────────────────────────────────────────
  { id: "paths", label: "מסלולי לימוד", sub: "9 מסכים — לחצו על כל אחד למטה", url: `${BASE}/paths`, cx: 575, cy: 1365, w: 215, color: "#7c3aed", badge: "שלב 4", badgeColor: "#7c3aed" },

  // ── שמונת המסכים של שלב 4 ────────────────────────────────────────────────
  // כל אחד נפתח ישירות עם נתוני דמו, בלי לעבור את כל הזרימה
  { id: "p-intro",        label: "פתיחה",          sub: "מה נעשה כאן",         url: `${BASE}/paths?reset=1`,                   cx: 120, cy: 1465, w: 110, color: "#8b5cf6" },
  { id: "p-quiz", only: ["main"],         label: "6 שאלות",        sub: "מגבלות החיים",        url: `${BASE}/paths?demo=1&phase=quiz`,         cx: 300, cy: 1465, w: 115, color: "#8b5cf6" },
  { id: "p-result", only: ["main"],       label: "המסלול המומלץ",  sub: "ניקוד משוקלל",        url: `${BASE}/paths?demo=1&phase=result`,       cx: 490, cy: 1465, w: 135, color: "#8b5cf6" },
  { id: "p-routes", only: ["main"],       label: "כל הדרכים מכאן", sub: "3 מסלולים כקווי רכבת", url: `${BASE}/paths?demo=1&phase=routes`,       cx: 700, cy: 1465, w: 145, color: "#8b5cf6", badge: "חדש", badgeColor: "#8b5cf6" },
  { id: "p-blockers",     label: "מה עומד בדרך",   sub: "חסם ← פתרון + תאריך", url: `${BASE}/paths?demo=1&phase=blockers`,     cx: 930, cy: 1465, w: 140, color: "#fb8500", badge: "הלב", badgeColor: "#fb8500" },
  { id: "p-institutions", label: "מוסדות",         sub: "בניית רשימה",         url: `${BASE}/paths?demo=1&phase=institutions`, cx: 930, cy: 1560, w: 120, color: "#8b5cf6" },
  { id: "p-prep",         label: "שאלות לפגישה",   sub: "נוצרות מהתשובות",     url: `${BASE}/paths?demo=1&phase=prep`,         cx: 700, cy: 1560, w: 135, color: "#8b5cf6" },
  { id: "p-research",     label: "ערכת חקר",       sub: "אופציונלי",           url: `${BASE}/paths?demo=1&phase=research`,     cx: 470, cy: 1560, w: 115, color: "#8b5cf6" },
  { id: "p-done",         label: "סיכום",          sub: "לפני/בפגישה + CTA",   url: `${BASE}/paths?demo=1&phase=done`,         cx: 240, cy: 1560, w: 120, color: "#8b5cf6", badge: "סיום", badgeColor: "#8b5cf6" },

  /*
    ── מסע הבוגרים ──────────────────────────────────────────────────────────
    הווריאציה היחידה. משם ואילך הוא ממשיך באותם מסכים בדיוק כמו כולם.
  */
  { id: "a-intake", only: ["alumni"], label: "שאלון בוגרים", sub: "6 שאלות · בלי מנוע משקלים", url: `${BASE}/paths?demo=1&cohort=alumni`, cx: 130, cy: 1622, w: 150, color: "#0f7a52", badge: "בוגרים", badgeColor: "#0f7a52" },

  // ── שלב 5 — לוגיסטיקה ומלגות ─────────────────────────────────────────────
  { id: "plan", label: "התוכנית שלי", sub: "5 מסכים — לחצו על כל אחד למטה", url: `${BASE}/plan`, cx: 575, cy: 1755, w: 215, color: "#059669", badge: "שלב 5", badgeColor: "#059669" },

  { id: "pl-intro", label: "פתיחה לשלב",  sub: "מה קורה כאן",          url: `${BASE}/plan?reset=1`,      cx: 145, cy: 1850, w: 125, color: "#10b981" },
  { id: "pl-plan",  label: "התוכנית",     sub: "עוגן + חודשים",        url: `${BASE}/plan?view=plan`,    cx: 350, cy: 1850, w: 130, color: "#10b981", badge: "הבית", badgeColor: "#10b981" },
  { id: "pl-money", label: "החשבון",      sub: "מספר במקום הרגעה",     url: `${BASE}/plan?view=money`,   cx: 575, cy: 1850, w: 140, color: "#fb8500", badge: "הלב", badgeColor: "#fb8500" },
  { id: "pl-docs",  label: "ארון מסמכים", sub: "סטטוס ומיקום בלבד",    url: `${BASE}/plan?view=docs`,    cx: 800, cy: 1850, w: 140, color: "#10b981" },
  { id: "pl-coord", label: "עדכון לרכזת", sub: "נבנה מעצמו · וואטסאפ", url: `${BASE}/plan?view=coord`,   cx: 1005, cy: 1850, w: 145, color: "#10b981" },
  { id: "enroll", label: "קו הסיום — אישור לימודים", sub: "העלאה = שלב 6 · האסמכתא למשרד העבודה", url: `${BASE}/enroll`, cx: 1180, cy: 1850, w: 175, color: "#023e8a", badge: "חדש", badgeColor: "#fb8500" },
];

// ─── Edges ────────────────────────────────────────────────────────────────────

const EDGES: Edge[] = [
  // Auth flow
  { from: "login",      to: "onboarding" },
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
  { from: "dashboard", to: "chat",  color: "#023e8a" },
  { from: "plan", to: "enroll", label: "נרשמת? ←", color: "#fb8500" },
  { from: "dashboard", to: "squad", color: "#023e8a" },

  // Dashboard → explore (stage 3)
  { from: "dashboard", to: "explore", label: "נפתח אחרי הפגישה" },

  // Explore → domains
  { from: "explore", to: "d-code" },
  { from: "explore", to: "d-data" },
  { from: "explore", to: "d-marketing" },
  { from: "explore", to: "d-ai" },
  { from: "explore", to: "d-cyber" },
  { from: "explore", to: "d-ux" },
  { from: "explore", to: "d-networks" },
  { from: "explore", to: "d-qa" },
  { from: "explore", to: "d-hardware" },

  // Domains → sims
  { from: "d-code",      to: "s-code" },
  { from: "d-data",      to: "s-data" },
  { from: "d-marketing", to: "s-marketing" },
  { from: "d-ai",        to: "s-ai" },
  { from: "d-cyber",     to: "s-cyber" },
  { from: "d-ux",        to: "s-ux" },
  { from: "d-networks",  to: "s-networks" },
  { from: "d-qa",        to: "s-qa" },
  { from: "d-hardware",  to: "s-hardware" },

  // Code learn flow (sequential)
  { from: "s-code",         to: "code-day", color: "#3b82f6" },
  { from: "code-day",       to: "code-mystery", color: "#3b82f6" },
  { from: "code-mystery",   to: "code-experience", color: "#3b82f6" },

  // Data domain → learn


  // Data learn flow (sequential)
  { from: "s-data",    to: "analytics",  label: "אנליטיקה",     color: "#0d9488" },
  { from: "s-data",    to: "learn",      label: "רשות", color: "#0d9488", dashed: true },
  { from: "analytics", to: "mystery",     color: "#0d9488" },
  { from: "mystery",   to: "experience",     color: "#0d9488" },

  // Cyber learn flow (sequential)
  { from: "s-cyber",         to: "cyber-day",  color: "#dc2626" },
  { from: "cyber-day",       to: "cyber-mystery",  color: "#dc2626" },
  { from: "cyber-mystery",   to: "cyber-experience",  color: "#dc2626" },

  // Networks learn flow (sequential)
  { from: "s-networks",        to: "networks-day",          color: "#2563eb" },
  { from: "networks-day",      to: "networks-mystery",          color: "#2563eb" },
  { from: "networks-mystery",  to: "networks-experience",          color: "#2563eb" },

  // QA learn flow (sequential)
  { from: "s-qa",        to: "qa-day", color: "#d97706" },
  { from: "s-marketing",  to: "mkt-day", color: "#f97316" },
  { from: "mkt-day",      to: "mkt-mystery", color: "#f97316" },
  { from: "mkt-mystery",  to: "mkt-experience", color: "#f97316" },
  { from: "s-ai",         to: "ai-day", color: "#7c3aed" },
  { from: "ai-day",       to: "ai-mystery", color: "#7c3aed" },
  { from: "ai-mystery",   to: "ai-experience", color: "#7c3aed" },
  { from: "s-ux",         to: "ux-day", color: "#db2777" },
  { from: "ux-day",       to: "ux-mystery", color: "#db2777" },
  { from: "ux-mystery",   to: "ux-experience", color: "#db2777" },
  { from: "s-hardware",   to: "hw-day", color: "#0891b2" },
  { from: "hw-day",       to: "hw-mystery", color: "#0891b2" },
  { from: "hw-mystery",   to: "hw-experience", color: "#0891b2" },
  { from: "qa-day",      to: "qa-mystery", color: "#d97706" },
  { from: "qa-mystery",  to: "qa-experience", color: "#d97706" },

  // כלי עיבוד החוויה → סיכום (נפתח אחרי 2+ תחומים)
  { from: "experience",          to: "results", label: "2+ תחומים ←", color: "#fb8500" },
  { from: "cyber-experience",    to: "results", color: "#fb8500", dashed: true },
  { from: "networks-experience", to: "results", color: "#fb8500", dashed: true },
  { from: "code-experience",     to: "results", color: "#fb8500", dashed: true },
  { from: "qa-experience",       to: "results", color: "#fb8500", dashed: true },

  // סיכום → פגישה 2 → אישור
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
type EdgeGeom = { d: string; lx: number; ly: number };

/**
 * מסלול הקשת + נקודת התווית.
 *
 * קשתות קדימה מצוירות כ**מרפק מעוגל** — ירידה אנכית, קטע אופקי באמצע הדרך,
 * וירידה לתוך היעד — במקום קו אלכסוני שחוצה מלבנים וטקסט. התווית יושבת על
 * הקטע האופקי, ששם אין תוכן מתחתיה.
 */
function edgeGeom(from: Node, to: Node): EdgeGeom {
  const fh = from.h ?? NH;
  const th = to.h ?? NH;
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;

  // אותה שורה — צד אל צד
  const isHorizontal = Math.abs(dy) <= 30 || (Math.abs(dx) > 150 && Math.abs(dy) < 100);
  if (isHorizontal) {
    const x1 = dx > 0 ? from.cx + from.w / 2 + 2 : from.cx - from.w / 2 - 2;
    const x2 = dx > 0 ? to.cx - to.w / 2 - 2 : to.cx + to.w / 2 + 2;
    return { d: `M ${x1} ${from.cy} L ${x2} ${to.cy}`, lx: (x1 + x2) / 2, ly: (from.cy + to.cy) / 2 - 9 };
  }

  // קשת חוזרת (מעלה) — עוקפת משמאל
  if (dy < 0) {
    const x1 = from.cx - from.w / 2 - 2;
    const y1 = from.cy;
    const x2 = to.cx - to.w / 2 - 2;
    const y2 = to.cy + th / 2;
    const midX = Math.min(x1, x2) - 40;
    return { d: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`, lx: midX + 12, ly: (y1 + y2) / 2 };
  }

  // קדימה — מרפק מעוגל דרך אמצע הגובה
  const x1 = from.cx;
  const y1 = from.cy + fh / 2 + 2;
  const x2 = to.cx;
  const y2 = to.cy - th / 2 - 2;
  const midY = (y1 + y2) / 2;

  if (Math.abs(dx) < 8) {
    return { d: `M ${x1} ${y1} L ${x2} ${y2}`, lx: x1, ly: midY };
  }

  const sx = Math.sign(x2 - x1);
  const r = Math.max(4, Math.min(14, Math.abs(x2 - x1) / 2 - 2, (y2 - y1) / 2 - 2));
  const d = [
    `M ${x1} ${y1}`,
    `L ${x1} ${midY - r}`,
    `Q ${x1} ${midY} ${x1 + sx * r} ${midY}`,
    `L ${x2 - sx * r} ${midY}`,
    `Q ${x2} ${midY} ${x2} ${midY + r}`,
    `L ${x2} ${y2}`,
  ].join(" ");
  return { d, lx: (x1 + x2) / 2, ly: midY };
}

// ─── Node Component ───────────────────────────────────────────────────────────

function FlowNode({ node, dim }: { node: Node; dim?: boolean }) {
  const r = nodeRect(node);
  const hasSubtitle = !!node.sub;
  const h = hasSubtitle ? 52 : 40;

  return (
    <a
      /* מטושטש ולא מוסתר: העין צריכה לראות **מה משותף ומה בלעדי** */
      data-dim={dim ? "1" : undefined}
      href={node.url}
      target="_blank"
      rel="noopener noreferrer"
      title={node.label + (node.sub ? " — " + node.sub : "")}
      style={{
        position: "absolute",
        opacity: dim ? 0.1 : 1,
        pointerEvents: dim ? "none" : undefined,
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
        transition: "transform 0.12s, box-shadow 0.12s, opacity 0.18s",
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

function Arrows({ cohort }: { cohort: Cohort | "both" }) {
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }}
    >
      <defs>
        {/* Arrowhead markers per color */}
        {["#023e8a", "#fb8500", "#d97706", "#0d9488", "#6b7280", "#2563eb", "#dc2626", "#7c3aed", "#3b82f6"].map(c => (
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
        /* קשת שאחד מקצותיה אינו במסע הנבחר — מיטשטשת יחד איתו */
        const inJourney = cohort === "both" ||
          (nodeCohorts(from.id, from.only).includes(cohort) &&
           nodeCohorts(to.id, to.only).includes(cohort) &&
           (!edge.only || edge.only.includes(cohort)));

        const color = edge.color || from.color;
        const markerId = `arrow-${color.replace("#", "")}`;
        const { d, lx, ly } = edgeGeom(from, to);

        return (
          <g key={i} opacity={inJourney ? 1 : 0.08}>
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
              <>
                {/* עד עכשיו ה-rect ישב בתוך <text> — SVG לא חוקי, ולכן מעולם
                    לא צויר והכתב שכב ישירות על הקווים. אחים, לא מקוננים. */}
                <rect
                  x={lx - edge.label.length * 3.2 - 5}
                  y={ly - 7.5}
                  width={edge.label.length * 6.4 + 10}
                  height={15}
                  rx={7.5}
                  fill="#fff"
                  stroke={color}
                  strokeOpacity={0.25}
                  strokeWidth={1}
                />
                <text
                  x={lx}
                  y={ly + 3}
                  textAnchor="middle"
                  fontSize={8}
                  fill={color}
                  fontFamily="'Heebo', sans-serif"
                  fontWeight="bold"
                >
                  {edge.label}
                </text>
              </>
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
  { label: "שלב 1 · טרום אינטייק — פתיחת חשבון", top: 158, color: "#023e8a" },
  { label: "שלב 2 · אינטייק — היכרות, נסגר בפגישה", top: 272, color: "#0ea5e9" },
  { label: "שלב 3 · חשיפה — 8 תחומים, נסגר בפגישה", top: 395, color: "#fb8500" },
  { label: "שלב 4 · מסלול לימודים — נסגר בפגישה", top: 1305, color: "#7c3aed" },
  { label: "שלב 5 · לוגיסטיקה ומלגות", top: 1695, color: "#059669" },
];

// ─── Section Labels ───────────────────────────────────────────────────────────
// תוויות עמודה בתוך רצועה — לא הפרדה בין רצועות

const LABELS = [
  { text: "דפי תחום (×8) — לחיצה על תחום פותחת אותו", x: 8, y: 520, color: "#fb8500" },
  { text: "סימולציות (×8)", x: 8, y: 622, color: "#d97706" },
  { text: "מרכזי למידה — יום בחיי ← תעלומה ← עיבוד חוויה", x: 8, y: 726, color: "#0d9488" },
  { text: "תשעת מסכי שלב 4 — ?demo=1&phase=", x: 8, y: 1430, color: "#8b5cf6" },
  { text: "חמשת מסכי שלב 5 — ?view=", x: 8, y: 1815, color: "#10b981" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MapPage() {
  /*
    בורר המסע (נתי 1.9). לא קנבס שני — **אותו קנבס, הדגשה אחרת**. זה מה
    שמראה בעין את מה שקשה להסביר במילים: אפליקציה אחת, שני מסעות, וכמעט
    הכל משותף. מה שאינו במסע הנבחר מיטשטש ולא נעלם, כדי שרואים גם את
    הבלעדי וגם את המשותף.
  */
  const [cohort, setCohort] = useState<Cohort | "both">("both");
  const totalScreens = NODES.length;
  const inCohort = (c: Cohort) => NODES.filter(n => nodeCohorts(n.id, n.only).includes(c)).length;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      {/* Header */}
      <div style={{ background: "#023e8a", color: "#fff", padding: "24px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 3, marginBottom: 6 }}>TECHCAREERLY</div>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Heebo', sans-serif" }}>מפת האפליקציה</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 2 }}>
            <a href="/map/flows" style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.14)", color: "#fff" }}>
              מסע עם צילומים והסבר ←
            </a>
            <a href="/map/grid" style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.14)", color: "#fff" }}>
              גריד כל המסכים ←
            </a>
          </div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.65 }}>
            {totalScreens} מסכים · לחיצה = פתיחת המסך · חצים = מעבר ניווט אמיתי
          </div>

          {/* שני מסעי לקוח, אפליקציה אחת */}
          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, opacity: 0.6 }}>מסע לקוח:</span>
            {([
              ["both", "שניהם", totalScreens],
              ["main", "הקהל הרחב", inCohort("main")],
              ["alumni", "בוגרי טק-קריירה", inCohort("alumni")],
            ] as const).map(([id, label, n]) => {
              const on = cohort === id;
              return (
                <button key={id} onClick={() => setCohort(id)}
                  style={{
                    fontSize: 12, fontWeight: 800, padding: "6px 13px", borderRadius: 999, cursor: "pointer",
                    background: on ? "#fff" : "rgba(255,255,255,0.12)",
                    color: on ? "#023e8a" : "#fff",
                    border: `1px solid ${on ? "#fff" : "rgba(255,255,255,0.25)"}`,
                  }}>
                  {label} <span style={{ opacity: 0.55 }}>{n}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, marginTop: 7, opacity: 0.6, lineHeight: 1.6 }}>
            אפליקציה אחת, שני מסעים. הבוגרים מדלגים על שלב הטעימות ועל פגישה 2,
            ומקבלים שאלון קצר משלהם — <b>כל השאר זהה</b>.
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
            { color: "#3b82f6", label: "מרכז למידה — קוד" },
            { color: "#2563eb", label: "מרכז למידה — רשתות" },
            { color: "#dc2626", label: "מרכז למידה — סייבר" },
            { color: "#d97706", label: "מרכז למידה — QA" },
            { color: "#7c3aed", label: "שלב 4 — מסלול לימודים" },
            { color: "#059669", label: "שלב 5 — לוגיסטיקה ומלגות" },
            { color: "#475569", label: "ניהול פנימי" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(0,0,0,0.55)" }}>
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
            <Arrows cohort={cohort} />

            {/* Nodes (HTML layer) */}
            {NODES.map(node => (
              <FlowNode key={node.id} node={node}
                dim={cohort !== "both" && !nodeCohorts(node.id, node.only).includes(cohort)} />
            ))}
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
