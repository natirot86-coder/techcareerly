/**
 * מה-אם: השוואת תרחישים לשאלת הזמן (27.8).
 *
 * הרקע: המחקר על מה"ט הראה ש"כמה שעות בשבוע" כמעט לא מבדיל בין המסלולים —
 * מסלול ערב נע בין 8 ל-20 שעות, הכשרה היברידית 8–15, ותואר תלוי בתמהיל
 * הרצאות/למידה עצמית שאיש לא מפרסם. השאלות `when` (מתי פנוי) ו-`timeline`
 * (לכמה זמן אפשר להחזיק) כבר מודדות את מה שבאמת מבדיל.
 *
 * הסקריפט מריץ את כל הצירופים בכמה תרחישים ומדווח תמהיל, כדי שההחלטה
 * תתקבל על נתונים ולא על תחושה.  הרצה: node scripts/sim-what-if.mjs
 */
import { readFileSync } from "node:fs";

const SRC = "src/app/paths/page.tsx";
const TARGET = { degree: 52, mahat: 10, bootcamp: 38 };
const src = readFileSync(SRC, "utf8");

function block(name) {
  const start = src.indexOf(`const ${name}`);
  const open = src.indexOf("{", start);
  const end = src.indexOf("\n};", open);
  return src.slice(open, end + 2);
}
function toObject(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/\bas const\b/g, "");
  return Function(`"use strict"; return (${clean});`)();
}

const BASE = toObject(block("WEIGHTS: Partial"));
const KEYS = ["time", "budget", "education", "kids", "when", "timeline", "location", "aim"];

function run(weights, keys) {
  const counts = { degree: 0, mahat: 0, bootcamp: 0 };
  let total = 0;
  const walk = (i, acc) => {
    if (i === keys.length) {
      const score = { degree: 5, mahat: 0, bootcamp: 0 };
      for (const k of Object.keys(weights)) {
        const d = weights[k]?.[acc[k]];
        if (d) for (const t of Object.keys(d)) score[t] += d[t] ?? 0;
      }
      const pick = score.degree >= score.mahat && score.degree >= score.bootcamp
        ? "degree" : score.mahat >= score.bootcamp ? "mahat" : "bootcamp";
      counts[pick]++; total++;
      return;
    }
    for (const o of ["A", "B", "C"]) walk(i + 1, { ...acc, [keys[i]]: o });
  };
  walk(0, {});
  return { counts, total };
}

const LABEL = { degree: "תואר", mahat: 'מה"ט', bootcamp: "הכשרה" };
function report(name, weights, keys) {
  const { counts, total } = run(weights, keys);
  const line = ["degree", "mahat", "bootcamp"].map(t => {
    const p = ((counts[t] / total) * 100).toFixed(1);
    const gap = (p - TARGET[t]).toFixed(1);
    return `${LABEL[t]} ${String(p).padStart(5)}% (${gap > 0 ? "+" : ""}${gap})`;
  }).join("   ");
  console.log(`${name.padEnd(34)} ${line}   [${total.toLocaleString()} צירופים]`);
}

console.log(`\nיעד: תואר 52% · מה"ט 10% · הכשרה 38%\n`);
report("1. המצב היום", BASE, KEYS);

// תרחיש 2: מחיקת שאלת השעות לגמרי (7 שאלות)
const noTime = { ...BASE };
delete noTime.time;
report("2. בלי שאלת השעות", noTime, KEYS.filter(k => k !== "time"));

// תרחיש 3: השעות נשארות אבל בלי משקל (שאלה אינפורמטיבית לרכזת בלבד)
const timeZero = { ...BASE, time: {} };
report("3. השעות נשאלות, לא מנקדות", timeZero, KEYS);

// תרחיש 4: היפוך ההיגיון — הכשרת בוקר תובענית, אז מעט שעות לא מתגמל אותה
const timeFixed = {
  ...BASE,
  time: {
    A: { mahat: 2, degree: -1 },     // מעט שעות → ערב/משולב, לא הכשרה אינטנסיבית
    B: { degree: 1, mahat: 1 },
    C: { degree: 2, bootcamp: 2 },   // הרבה שעות → גם הכשרת בוקר מלאה נפתחת
  },
};
report("4. משקלי שעות מתוקנים", timeFixed, KEYS);
console.log("");

/*
 * תרחיש 5 — הטווחים לפי המציאות שנתי תיאר (27.8):
 *   עד 15 ש'  = לא מספיק לאף מסלול  → סיגנל אמת, לא המלצה
 *   15–20 ש'  = מספיק להרצאות בלבד  → בדיוק הטווח של מה"ט ערב (14–21 מאומת)
 *               ושל הכשרה היברידית; תואר מלא לא ריאלי בו
 *   20+  ש'   = הרצאות + למידה עצמית → הכל פתוח
 */
const timeReal = {
  ...BASE,
  time: {
    A: { mahat: 1 },                 // אין מסלול שבאמת נכנס לזה — כמעט לא מנקד
    B: { mahat: 2, bootcamp: 1, degree: -1 },
    C: { degree: 2, bootcamp: 1 },
  },
};
report("5. טווחים לפי המציאות", timeReal, KEYS);

// 5ב — כמו 5, אבל בלי עונש לתואר בטווח האמצעי
const timeRealSoft = {
  ...BASE,
  time: {
    A: { mahat: 1 },
    B: { mahat: 2, bootcamp: 1 },
    C: { degree: 2, bootcamp: 1 },
  },
};
report("5ב. אותו דבר, בלי עונש לתואר", timeRealSoft, KEYS);
console.log("");

/*
 * תרחיש 6 — תרחיש 5, ובנוסף: מה"ט מקבל את הניקוד שלו מהמקום הנכון.
 * "רק בערב" הוא הסיגנל האמיתי למה"ט (המסלול המשולב בנוי בדיוק לזה,
 * ו-14–21 שעות ערב + שישי אומתו בשמונה מוסדות) — ולא "מעט שעות פנויות".
 */
const timeRealWhen = {
  ...timeReal,
  when: {
    B: { degree: -1, mahat: 3, bootcamp: 1 },
    C: { degree: 1 },
  },
};
report("6. + מה\"ט מחוזק ב'רק בערב'", timeRealWhen, KEYS);
console.log("");
