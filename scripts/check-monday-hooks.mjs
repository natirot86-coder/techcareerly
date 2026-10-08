/**
 * בדיקה שכל עמודה שהקוד מגיב עליה באמת רשומה כ-webhook.
 * הבאג של 8.10: המטפל נכתב לעמודת הסטטוס, ומאנדיי מעולם לא נתבקש להודיע.
 */
import { readFileSync } from "node:fs";
const MT = readFileSync("C:/Users/user/.monday-token", "utf8").trim();
const WANT = {
  "18433888639": {
    "color_mm7t1s7a": "סטטוס משתתף → מייל פתיחה + קישור",
    "color_mm7tahjd": "מסלול באפליקציה → alumni_roster",
    "color_mm7t74m3": "רכז/ת → קישור ומייל",
    "text_mm7tmnqc": "טלפון → קישור וואטסאפ",
    "__create_item": "שורה חדשה → קישור",
    "__change_name": "שינוי שם → קישור",
  },
  "18396761860": { "color_mm4ms1kq": "החלטה סופית → יצירת שורה באינטק" },
};
async function gql(q){const r=await fetch("https://api.monday.com/v2",{method:"POST",
 headers:{Authorization:MT,"Content-Type":"application/json","API-Version":"2024-10"},body:JSON.stringify({query:q})});
 const j=await r.json(); if(j.errors) throw new Error(JSON.stringify(j.errors).slice(0,300)); return j.data;}
let bad = 0;
for (const [board, want] of Object.entries(WANT)) {
  const have = (await gql(`{ webhooks(board_id: ${board}) { event config } }`)).webhooks;
  console.log(`\nלוח ${board}`);
  for (const [key, what] of Object.entries(want)) {
    const ok = key.startsWith("__")
      ? have.some(w => w.event === key.slice(2))
      : have.some(w => (w.config ?? "").includes(key));
    if (!ok) bad++;
    console.log(`  ${ok ? "✅" : "❌ חסר"}  ${what}`);
  }
}
console.log(bad ? `\n⚠️ ${bad} טריגרים חסרים` : "\nכל הטריגרים רשומים.");
process.exit(bad ? 1 : 0);
