/**
 * סימולציית תמהיל ההמלצות — הכלי שכל שינוי משקל חייב לעבור בו.
 *
 * למה הוא קיים: ב-19.8 הוספת שאלה בלי לבדוק הורידה את התואר מ-52% ל-48%
 * בלי שאיש שם לב. הסימולציה מריצה את **כל** צירופי התשובות ומדווחת את
 * התמהיל, כדי שאף שינוי לא ישנה את העמדה של המוצר בשקט.
 *
 * המשקלים נקראים מ-`src/app/paths/page.tsx` בזמן ריצה — אין כאן העתק
 * שיכול להתיישן. הרצה:  node scripts/sim-tracks.mjs
 */
import { readFileSync } from "node:fs";

const SRC = "src/app/paths/page.tsx";
const TARGET = { degree: 52, mahat: 10, bootcamp: 38 }; // היעד שנקבע 11.8

const src = readFileSync(SRC, "utf8");

/** חילוץ בלוק בין `const NAME ... = {` לבין `};` בעמודה 0 */
function block(name) {
  const start = src.indexOf(`const ${name}`);
  if (start < 0) throw new Error(`לא נמצא ${name} ב-${SRC}`);
  const open = src.indexOf("{", start);
  const end = src.indexOf("\n};", open);
  return src.slice(open, end + 2);
}

/** ניקוי TypeScript/הערות כדי שאפשר יהיה להעריך כאובייקט JS */
function toObject(text) {
  const clean = text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\bas const\b/g, "");
  return Function(`"use strict"; return (${clean});`)();
}

const WEIGHTS = toObject(block("WEIGHTS: Partial"));

/** אילו אפשרויות קיימות בכל שאלה — נגזר מהמשקלים עצמם + A/B/C כברירת מחדל */
const KEYS = ["time", "budget", "education", "kids", "when", "timeline", "location", "aim"];
const OPTIONS = Object.fromEntries(KEYS.map(k => [k, ["A", "B", "C"]]));

function recommend(answers) {
  const score = { degree: 5, mahat: 0, bootcamp: 0 };
  for (const key of Object.keys(WEIGHTS)) {
    const delta = WEIGHTS[key]?.[answers[key]];
    if (!delta) continue;
    for (const t of Object.keys(delta)) score[t] += delta[t] ?? 0;
  }
  if (score.degree >= score.mahat && score.degree >= score.bootcamp) return "degree";
  return score.mahat >= score.bootcamp ? "mahat" : "bootcamp";
}

// כל הצירופים
const counts = { degree: 0, mahat: 0, bootcamp: 0 };
let total = 0;
const walk = (i, acc) => {
  if (i === KEYS.length) {
    counts[recommend(acc)]++;
    total++;
    return;
  }
  for (const opt of OPTIONS[KEYS[i]]) walk(i + 1, { ...acc, [KEYS[i]]: opt });
};
walk(0, {});

const pct = t => ((counts[t] / total) * 100).toFixed(1);
const LABEL = { degree: "תואר", mahat: 'מה"ט', bootcamp: "הכשרה" };

console.log(`\nצירופים שנבדקו: ${total.toLocaleString()}\n`);
for (const t of ["degree", "mahat", "bootcamp"]) {
  const p = Number(pct(t));
  const gap = (p - TARGET[t]).toFixed(1);
  const sign = gap > 0 ? "+" : "";
  console.log(
    `${LABEL[t].padEnd(8)} ${String(p).padStart(5)}%   (יעד ${String(TARGET[t]).padStart(2)}%  →  ${sign}${gap})`
  );
}
console.log("");
