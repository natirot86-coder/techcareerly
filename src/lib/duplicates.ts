/**
 * src/lib/duplicates.ts — כפילויות בלוח אינטק (נתי, 2.11).
 *
 * האפליקציה **מציגה**, מאיה והרכז/ת **מחליטים**, והמחיקה נעשית במאנדיי. אחרי
 * מחיקה הרשימה מתעדכנת מעצמה (קוראים את הלוח בכל כניסה).
 *
 * שלוש רמות, כי לא כל התאמה היא כפילות:
 *   • sure  — אותו טלפון ואותו שם, או אותו מייל.
 *   • check — אותו טלפון, שמות שונים: איות אחר, או **טלפון משותף** (אחים, הורה).
 *   • weak  — אותו שם מלא בלבד. שמות חוזרים (פקדו) — לעיון, לא למחיקה.
 *
 * ⚠️ השורה שמוחקים אינה תמיד ריקה: הקישור שנשלח בוואטסאפ ובמייל נושא את
 * מזהה השורה (לחיצות והרשמה), ההיסטוריה שלנו נשמרת לפיה, ו**העדכונים במאנדיי
 * לא עוברים בין שורות**. לכן ההמלצה: להשאיר את השורה שהקישור יצא ממנה ושיש
 * בה יותר היסטוריה — ולהראות מה יש בשנייה ואין בראשונה.
 */
import { heKey } from "@/lib/monday";
import { phoneKey, emailKey } from "@/lib/personIdentity";

const BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const C = {
  phone: "text_mm7tmnqc", email: "text_mm7tase7", status: "color_mm7t1s7a", coord: "color_mm7t74m3",
  channel: "color_mm7tee80", source: "text_mm7t5f8a", city: "text_mm7tafps",
  mailed: "date_mm7tvfnx", clicked: "date_mm7ye5aa", firstCall: "date_mm8kc890", webinars: "dropdown_mm8qn0gc",
} as const;
type Key = keyof typeof C;

async function gql<T>(query: string): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[duplicates]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

export type DupRow = {
  id: string; name: string; createdAt: string; updates: number; inApp: boolean;
  fields: Record<Key, string>;
};
export type DupGroup = {
  level: "sure" | "check" | "weak";
  reason: string;
  rows: DupRow[];
  /** מזהה השורה שמומלץ להשאיר, והסיבות */
  keep: string; why: string[];
  /** לכל שורה אחרת: מה יש בה ואין בשורה שנשארת */
  wouldLose: Record<string, string[]>;
};

const LABEL: Record<Key, string> = {
  phone: "טלפון", email: "מייל", status: "סטטוס", coord: "רכז/ת", channel: "ערוץ", source: "איך הגיע/ה",
  city: "עיר", mailed: "מייל פתיחה נשלח", clicked: "לחץ/ה על הקישור", firstCall: "שיחה ראשונה", webinars: "וובינרים",
};
const STATUS_RANK = ["נרשמ/ה ללימודים", "סיימ/ה תהליך", "בתהליך פעיל", "נשלח קישור", "אין מענה 1", "לפני שיחה ראשונה"];

function score(r: DupRow): { n: number; why: string[] } {
  const why: string[] = []; let n = 0;
  if (r.fields.mailed) { n += 3; why.push("ממנה יצא מייל הפתיחה"); }
  if (r.fields.clicked) { n += 3; why.push("המשתתף/ת לחץ/ה על הקישור שלה"); }
  if (r.inApp) { n += 3; why.push("מחוברת למשתתף/ת באפליקציה"); }
  const rank = STATUS_RANK.indexOf(r.fields.status);
  if (rank >= 0) n += (STATUS_RANK.length - rank) / 2;
  if (r.updates) { n += Math.min(3, r.updates); why.push(`${r.updates} עדכונים/הערות במאנדיי`); }
  if (r.fields.coord) n += 1;
  n += Object.values(r.fields).filter(Boolean).length * 0.1;
  return { n, why };
}

export async function findDuplicates(appPhones: Set<string>): Promise<DupGroup[] | null> {
  const ids = Object.values(C).map(c => `"${c}"`).join(",");
  const d = await gql<{ boards: { items_page: { cursor: string | null; items: { id: string; name: string; created_at: string; column_values: { id: string; text: string | null }[] }[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { cursor items { id name created_at column_values(ids: [${ids}]) { id text } } } } }`);
  const page = d?.boards?.[0]?.items_page;
  if (!page || page.cursor) return null;   // לוח שלא נקרא במלואו — לא מכריזים על כפילות או על היעדרה

  const rows: DupRow[] = page.items.map(it => {
    const fields = Object.fromEntries((Object.keys(C) as Key[]).map(k =>
      [k, (it.column_values.find(c => c.id === C[k])?.text ?? "").trim()])) as Record<Key, string>;
    return { id: it.id, name: it.name.trim(), createdAt: it.created_at, updates: 0, inApp: !!appPhones.has(phoneKey(fields.phone)) && !!phoneKey(fields.phone), fields };
  });

  /* קבוצות חזקות: טלפון או מייל משותף (גם בשרשרת) */
  const parent = rows.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const join = (a: number, b: number) => { parent[find(a)] = find(b); };
  const seen = new Map<string, number>();
  rows.forEach((r, i) => {
    for (const k of [phoneKey(r.fields.phone) && `p:${phoneKey(r.fields.phone)}`, emailKey(r.fields.email) && `e:${emailKey(r.fields.email)}`]) {
      if (!k) continue;
      if (seen.has(k)) join(i, seen.get(k)!); else seen.set(k, i);
    }
  });
  const strong = new Map<number, number[]>();
  rows.forEach((_, i) => strong.set(find(i), [...(strong.get(find(i)) ?? []), i]));

  const groups: { level: DupGroup["level"]; reason: string; idx: number[] }[] = [];
  const inStrong = new Set<number>();
  for (const idx of strong.values()) {
    if (idx.length < 2) continue;
    idx.forEach(i => inStrong.add(i));
    const rs = idx.map(i => rows[i]);
    const samePhone = new Set(rs.map(r => phoneKey(r.fields.phone)).filter(Boolean)).size === 1 && rs.every(r => phoneKey(r.fields.phone));
    const sameMail = rs.some((a, i) => rs.some((b, j) => i < j && emailKey(a.fields.email) && emailKey(a.fields.email) === emailKey(b.fields.email)));
    const sameName = new Set(rs.map(r => heKey(r.name))).size === 1;
    const reason = [samePhone && "אותו טלפון", sameMail && "אותו מייל", sameName && "אותו שם"].filter(Boolean).join(" · ") || "טלפון/מייל משותף";
    groups.push({ level: sameMail || sameName ? "sure" : "check", reason, idx });
  }
  /* חלש: אותו שם מלא (שתי מילים לפחות), שלא כבר בקבוצה חזקה משותפת */
  const byName = new Map<string, number[]>();
  rows.forEach((r, i) => { if (r.name.split(/\s+/).length >= 2) { const k = heKey(r.name); byName.set(k, [...(byName.get(k) ?? []), i]); } });
  for (const idx of byName.values()) {
    if (idx.length < 2) continue;
    if (new Set(idx.map(find)).size === 1) continue;   // כבר מכוסה בקבוצה חזקה
    groups.push({ level: "weak", reason: "אותו שם מלא, טלפון שונה", idx });
  }
  if (!groups.length) return [];

  /* עדכונים במאנדיי — רק לשורות שבקבוצות (מעט) */
  const involved = [...new Set(groups.flatMap(g => g.idx))];
  const u = await gql<{ items: { id: string; updates: { id: string }[] }[] }>(
    `{ items(ids: [${involved.map(i => rows[i].id).join(",")}]) { id updates(limit: 25) { id } } }`);
  const updatesOf = new Map((u?.items ?? []).map(it => [it.id, it.updates.length]));
  involved.forEach(i => { rows[i].updates = updatesOf.get(rows[i].id) ?? 0; });

  const order = { sure: 0, check: 1, weak: 2 };
  return groups.map(g => {
    const rs = g.idx.map(i => rows[i]);
    const scored = rs.map(r => ({ r, ...score(r) }))
      .sort((a, b) => b.n - a.n || a.r.createdAt.localeCompare(b.r.createdAt));
    const keep = scored[0];
    const wouldLose: Record<string, string[]> = {};
    for (const { r } of scored.slice(1)) {
      const lose = (Object.keys(C) as Key[])
        .filter(k => r.fields[k] && !keep.r.fields[k])
        .map(k => `${LABEL[k]}: ${r.fields[k]}`);
      if (r.updates) lose.push(`${r.updates} עדכונים/הערות במאנדיי — לא עוברים בין שורות, להעתיק ידנית`);
      if (r.fields.mailed || r.fields.clicked) lose.push("ממנה יצא קישור — מחיקה תנתק את מעקב הלחיצות וההרשמה");
      /* האפליקציה מוצאת את השורה לפי הטלפון שאומת — אם הוא רק כאן, הוא חייב לעבור */
      if (r.inApp && !keep.r.inApp) lose.push(`הטלפון כאן (${r.fields.phone}) הוא זה שבאפליקציה — לעדכן אותו בשורה שנשארת, אחרת האפליקציה לא תמצא אותה`);
      wouldLose[r.id] = lose;
    }
    return {
      level: g.level, reason: g.reason, rows: scored.map(s => s.r),
      keep: keep.r.id, why: keep.why.length ? keep.why : ["הכי הרבה מידע, והישנה יותר"],
      wouldLose,
    };
  }).sort((a, b) => order[a.level] - order[b.level]);
}

/* ── סימון בשורות עצמן (2.11) ────────────────────────────────────────────────
   עמודה "חשד לכפילות" בלוח: מי שעובד/ת במאנדיי רואה את החשד בשורה, בלי לפתוח
   את האפליקציה. רק "כמעט ודאי" ו"לבדיקה" — שם זהה בלבד אינו סיבה לסמן שורה.
   כותבים רק כשהטקסט השתנה, ומנקים כשהכפילות נפתרה (שורה שנמחקה, טלפון שתוקן). */
const COL_DUP = "text_mm8qbtb1";
/* "כפילות" — צבע ייחודי בלוח (נתי, 2.11): סגול כהה = כמעט ודאי, סגול = לבדיקה.
   סגול לא משמש לשום דבר אחר בלוח, אז הוא לא מתבלבל עם סטטוס */
const COL_DUP_FLAG = "color_mm8qrhk5";
const FLAG = { sure: "כמעט ודאי", check: "לבדיקה" } as const;

export async function markDuplicates(groups: DupGroup[], opts: { dry: boolean; limit?: number }) {
  const want = new Map<string, { text: string; flag: string }>();
  for (const g of groups) {
    if (g.level === "weak") continue;
    for (const r of g.rows) {
      const others = g.rows.filter(o => o.id !== r.id).map(o => o.id).join(", ");
      want.set(r.id, {
        text: `${FLAG[g.level]}: ${g.reason} · עם שורה ${others}${r.id === g.keep ? " · מומלץ להשאיר את זו" : ""}`,
        flag: FLAG[g.level],
      });
    }
  }
  const d = await gql<{ boards: { items_page: { items: { id: string; column_values: { id: string; text: string | null }[] }[] } }[] }>(
    `{ boards(ids: ${BOARD}) { items_page(limit: 500) { items { id column_values(ids: ["${COL_DUP}","${COL_DUP_FLAG}"]) { id text } } } } }`);
  const writes: { id: string; text: string; flag: string }[] = [];
  for (const it of d?.boards?.[0]?.items_page?.items ?? []) {
    const cv = (id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();
    const next = want.get(it.id) ?? { text: "", flag: "" };
    if (cv(COL_DUP) !== next.text || cv(COL_DUP_FLAG) !== next.flag) writes.push({ id: it.id, ...next });
  }
  const batch = opts.limit ? writes.slice(0, opts.limit) : writes;
  let written = 0;
  if (!opts.dry) for (const w of batch) {
    const r = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: { Authorization: process.env.MONDAY_TOKEN!, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify({
        query: `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v) { id } }`,
        variables: { b: BOARD, i: w.id, v: JSON.stringify({ [COL_DUP]: w.text, [COL_DUP_FLAG]: w.flag ? { label: w.flag } : null }) },
      }),
    });
    if (r.ok && !(await r.json()).errors) written++;
  }
  return { dry: opts.dry, writes: writes.length, written, sample: writes.slice(0, 5) };
}
