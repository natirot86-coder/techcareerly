/**
 * בונה את /guides/handbook.html מהמקור docs/handbook/handbook.html (23.11).
 * המקור הוא קטע HTML (כמו שהארטיפקט מקבל); כאן עוטפים אותו בדף עצמאי עם
 * charset, viewport, RTL ו-noindex. **לא עורכים את הקובץ ב-public** — עורכים
 * את המקור ומריצים: node scripts/build-handbook.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync("docs/handbook/handbook.html", "utf8");
const i = src.indexOf('<div class="wrap"');
const head = src.slice(0, i), body = src.slice(i).replaceAll('src="img/', 'src="handbook-img/');
writeFileSync("public/guides/handbook.html", `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
${head}
<style>body{margin:0}img{max-width:100%}</style>
</head>
<body>
${body}
</body>
</html>
`);
console.log("built public/guides/handbook.html");
