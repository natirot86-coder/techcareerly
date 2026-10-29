/**
 * src/lib/intechDashboard.ts — היעדים של In-Tech, מחושבים כאן ומוצגים במאנדיי (נתי, 29.10).
 *
 * האפליקציה מחשבת ומאנדיי מציג: לוח ניהול פרטי ("ניהול In-Tech — יעדים"),
 * שורה לכל (צוות | רכז/ת) × חודש, ודשבורד רגיל של מאנדיי מעליו. כל הנוסחאות
 * כאן — כדי שלא יהיו שני דשבורדים עם שני מספרים לאותו דבר.
 *
 * ─── ההגדרות (סוכמו עם נתי 29.10) ───────────────────────────────────────────
 * • שנה: 1.7.2026–30.6.2027. יעד: 1,600 מתחילים · 800 נרשמים.
 * • **התחיל/ה** = הפגישה הראשונה ב-Cal (תאריך הפגישה, לא הקביעה — את מועד
 *   הקביעה של הוותיקות לא שמרנו). כולל סבב אוגוסט של סיון. בלי ביטולים,
 *   בלי "ראיון קורס" (אינו פגישת תוכנית), ורק פגישות שכבר קרו. נזקף לבעל/ת היומן.
 * • **נרשם/ה** = סטטוס "נרשמ/ה ללימודים" בלוח **או** אישור לימודים באפליקציה —
 *   המוקדם, פעם אחת לאדם (לפי טלפון). "דיווח בלבד" לא נספר לעולם.
 * • **שיחה ראשונה** = עמודת התאריך שנחתמת בלוח (intechHistory). ההמתנה =
 *   מיום הכניסה ללוח אינטק ועד אז. חציון, לא ממוצע.
 *
 * ─── המכסה ───────────────────────────────────────────────────────────────────
 * המכסה היא **של הצוות**, וכל רכז/ת מקבל/ת חלק לפי `quota_weight` — כך שמי
 * שמצטרף/ת או עוזב/ת לא שובר/ת חישוב שהניח צוות קבוע.
 * • מכסת החודש (מתגלגלת) = (יעד − מה שנעשה עד תחילת החודש) ÷ החודשים שנשארו.
 * • פער מצטבר = מה שנעשה − הקצב הבסיסי (יעד ÷ 12 לכל חודש). לא סכום המכסות
 *   המתגלגלות — הוא מתנפח מעצמו ככל שמפגרים, ואז פער של חודש נספר פעמיים.
 * • חודש שנגמר נכתב פעם אחת וננעל.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normPhone } from "@/lib/monday";
import { matchCoordinator, type CoordinatorRow } from "@/lib/coordinatorLookup";
import { BEFORE_FIRST_CALL, COL_FIRST_CALL, COL_STATUS, COL_COORD, ilDate } from "@/lib/intechHistory";

const INTECH_BOARD = process.env.MONDAY_INTECH_BOARD ?? "18433888639";
const COL_PHONE = "text_mm7tmnqc";
const REPORT_ONLY = "נרשמו ללימודים — דיווח בלבד";
const ENROLLED = "נרשמ/ה ללימודים";
const NO_ANSWER_PREFIX = "אין מענה";

const YEAR_START = "2026-07";
const MONTHS = 12;
const TARGET = { starts: 1600, enrolled: 800 };

/*
 * שני לוחות ולא אחד: לווידג'ט "מספר" של מאנדיי אין סינון, ולכן שורות צוות
 * ושורות רכזים באותו לוח היו נספרות פעמיים בכל סכום.
 */
type ColKey = "month" | "coord" | "starts" | "startsQuota" | "startsGap" | "enrolled" | "enrollQuota"
  | "enrollGap" | "firstCalls" | "medianWait" | "waitingNow" | "noAnswerNow" | "oldestWait"
  | "nextStartsQuota" | "nextEnrollQuota" | "locked" | "updated";
const TARGET_BOARD: Record<"team" | "coords", { board: string; group: string; col: Record<ColKey, string> }> = {
  team: {
    board: "18437652475", group: "group_mm8kjmxr",
    col: {
      month: "date_mm8knmy8", coord: "color_mm8ktv09",
      starts: "numeric_mm8kccx5", startsQuota: "numeric_mm8k16g0", startsGap: "numeric_mm8kjc5",
      enrolled: "numeric_mm8kh0v", enrollQuota: "numeric_mm8kn0h9", enrollGap: "numeric_mm8knjxm",
      firstCalls: "numeric_mm8k4yb4", medianWait: "numeric_mm8kg898",
      waitingNow: "numeric_mm8km7k7", noAnswerNow: "numeric_mm8kv6c9", oldestWait: "numeric_mm8k7f6r",
      nextStartsQuota: "numeric_mm8k1j5q", nextEnrollQuota: "numeric_mm8k2pss",
      locked: "boolean_mm8kf45a", updated: "text_mm8kn6dj",
    },
  },
  coords: {
    board: "18437653634", group: "group_mm8keq80",
    col: {
      month: "date_mm8kznn8", coord: "color_mm8kx6st",
      starts: "numeric_mm8kcsn6", startsQuota: "numeric_mm8k5h8w", startsGap: "numeric_mm8k21sb",
      enrolled: "numeric_mm8krzmn", enrollQuota: "numeric_mm8kkagr", enrollGap: "numeric_mm8k5tmp",
      firstCalls: "numeric_mm8kfcjf", medianWait: "numeric_mm8kafb",
      waitingNow: "numeric_mm8kzmx9", noAnswerNow: "numeric_mm8kwge0", oldestWait: "numeric_mm8kknkh",
      nextStartsQuota: "numeric_mm8kzayb", nextEnrollQuota: "numeric_mm8knkzq",
      locked: "boolean_mm8k3fwp", updated: "text_mm8k5aqx",
    },
  },
};

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) return null;
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) { console.error("[intechDashboard]", JSON.stringify(j.errors).slice(0, 300)); return null; }
  return j.data as T;
}

/* ── חודשים ─────────────────────────────────────────────────────────────── */

const monthOf = (d: Date | string) => ilDate(typeof d === "string" ? new Date(d) : d).slice(0, 7);
const yearMonths = (() => {
  const [y, m] = YEAR_START.split("-").map(Number);
  return Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
})();
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};
const round1 = (x: number) => Math.round(x * 10) / 10;

/* ── איסוף ──────────────────────────────────────────────────────────────── */

type Coord = CoordinatorRow & { quota_weight: number; created_at: string };
type Event = { person: string; month: string; coord: string | null };

type BoardItem = { id: string; created_at: string; column_values: { id: string; text: string | null }[] };

async function boardItems(): Promise<BoardItem[] | null> {
  const d = await gql<{ boards: { items_page: { cursor: string | null; items: BoardItem[] } }[] }>(
    `{ boards(ids: ${INTECH_BOARD}) { items_page(limit: 500) { cursor items { id created_at column_values(ids: ["${COL_STATUS}","${COL_COORD}","${COL_PHONE}","${COL_FIRST_CALL}"]) { id text } } } } }`);
  const p = d?.boards[0]?.items_page;
  if (!p || p.cursor) return null;   // יותר מ-500 שורות — לא מחשבים חצי לוח בשקט
  return p.items;
}

async function starts(db: SupabaseClient, now: Date): Promise<Event[]> {
  const { data } = await db.from("cal_bookings")
    .select("trigger, title, start_time, coordinator_id, attendee_phone, attendee_email");
  const first = new Map<string, { at: string; coord: string | null }>();
  for (const b of data ?? []) {
    if (b.trigger === "BOOKING_CANCELLED" || !b.start_time) continue;
    if ((b.title ?? "").includes("ראיון קורס")) continue;
    if (Date.parse(b.start_time) > now.getTime()) continue;
    const person = normPhone(b.attendee_phone) || (b.attendee_email ?? "").trim().toLowerCase();
    if (!person) continue;
    const cur = first.get(person);
    if (!cur || b.start_time < cur.at) first.set(person, { at: b.start_time, coord: b.coordinator_id });
  }
  return [...first].map(([person, v]) => ({ person, month: monthOf(v.at), coord: v.coord }));
}

async function enrollments(db: SupabaseClient, items: BoardItem[], coords: Coord[]): Promise<{ events: Event[]; undated: number }> {
  const byPerson = new Map<string, { at: string; coord: string | null }>();
  const put = (person: string, at: string, coord: string | null) => {
    const cur = byPerson.get(person);
    if (!cur || at < cur.at) byPerson.set(person, { at, coord: coord ?? cur?.coord ?? null });
  };

  /* מהלוח: הפעם הראשונה שהסטטוס הפך ל"נרשמ/ה ללימודים" */
  const { data: log } = await db.from("intech_status_log").select("item_id, changed_at")
    .eq("column_id", COL_STATUS).eq("to_value", ENROLLED).order("changed_at");
  const firstLog = new Map<string, string>();
  for (const r of log ?? []) if (!firstLog.has(String(r.item_id))) firstLog.set(String(r.item_id), r.changed_at);
  let undated = 0;
  for (const it of items) {
    const v = (id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();
    const at = firstLog.get(it.id);
    if (!at) { if (v(COL_STATUS) === ENROLLED) undated++; continue; }
    const person = normPhone(v(COL_PHONE)) || `item:${it.id}`;
    put(person, at, matchCoordinator(coords, v(COL_COORD))?.id ?? null);
  }

  /* מהאפליקציה: אישור לימודים שהועלה (תיקייה לכל מועמד/ת) */
  const { data: folders } = await db.storage.from("enrollment-docs").list("", { limit: 1000 });
  const ids = (folders ?? []).map(f => f.name).filter(Boolean);
  if (ids.length) {
    const { data: cands } = await db.from("candidates").select("id, phone, coordinator_id, is_test").in("id", ids);
    for (const c of cands ?? []) {
      if (c.is_test) continue;
      const { data: files } = await db.storage.from("enrollment-docs").list(c.id, { limit: 100 });
      const at = (files ?? []).map(f => f.created_at).filter(Boolean).sort()[0];
      if (at) put(normPhone(c.phone) || `cand:${c.id}`, at, c.coordinator_id);
    }
  }
  return { events: [...byPerson].map(([person, v]) => ({ person, month: monthOf(v.at), coord: v.coord })), undated };
}

/* ── החישוב ──────────────────────────────────────────────────────────────── */

export type DashRow = {
  key: string; group: "team" | "coords"; name: string; month: string; coordLabel: string;
  values: Record<ColKey, number | string | boolean | null>;
};

export async function computeDashboard(now = new Date()) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return { error: "no db" as const };
  const db = createClient(url, key, { auth: { persistSession: false } });

  const [items, coordRes] = await Promise.all([
    boardItems(),
    db.from("coordinators").select("id, name, phone, cal_m1, cal_m2, cal_m3, takes_participants, is_intake, quota_weight, created_at").eq("active", true),
  ]);
  if (!items) return { error: "monday unavailable or board > 500 rows" as const };
  const coords = (coordRes.data ?? []) as Coord[];
  const staff = coords.filter(c => c.takes_participants);

  const live = items.filter(it => (it.column_values.find(c => c.id === COL_STATUS)?.text ?? "") !== REPORT_ONLY);
  const v = (it: BoardItem, id: string) => (it.column_values.find(c => c.id === id)?.text ?? "").trim();
  const coordOf = (it: BoardItem) => matchCoordinator(coords, v(it, COL_COORD))?.id ?? null;

  const startEv = (await starts(db, now)).filter(e => yearMonths.includes(e.month));
  const enroll = await enrollments(db, live, coords);
  const enrollEv = enroll.events.filter(e => yearMonths.includes(e.month));

  /* שיחות ראשונות והמתנה — מהעמודה שנחתמת בלוח */
  const calls = live.flatMap(it => {
    const d = v(it, COL_FIRST_CALL);
    return d ? [{ month: d.slice(0, 7), coord: coordOf(it), wait: daysBetween(ilDate(new Date(it.created_at)), d) }] : [];
  });
  const today = ilDate(now);
  const waiting = live.filter(it => v(it, COL_STATUS) === BEFORE_FIRST_CALL)
    .map(it => ({ coord: coordOf(it), days: daysBetween(ilDate(new Date(it.created_at)), today) }));
  const noAnswer = live.filter(it => v(it, COL_STATUS).startsWith(NO_ANSWER_PREFIX)).map(it => coordOf(it));

  const current = monthOf(now);
  const curIdx = yearMonths.indexOf(current);
  const upTo = curIdx < 0 ? (current < yearMonths[0] ? -1 : MONTHS - 1) : curIdx;

  /* מתי כל רכז/ת "קיים/ת" — המוקדם מבין הצטרפות לסגל והפגישה הראשונה שלו/ה.
     סיון עבדה באוגוסט ונרשמה לסגל בספטמבר; לפי ההצטרפות בלבד היה נמחק לה חודש */
  const activeFrom = new Map(staff.map(c => {
    const firstOwn = startEv.filter(e => e.coord === c.id).map(e => e.month).sort()[0];
    const joined = monthOf(c.created_at);
    return [c.id, firstOwn && firstOwn < joined ? firstOwn : joined];
  }));
  const shareIn = (cid: string, m: string) => {
    const act = staff.filter(c => (activeFrom.get(c.id) ?? "9999") <= m && Number(c.quota_weight) > 0);
    const total = act.reduce((s, c) => s + Number(c.quota_weight), 0);
    const me = act.find(c => c.id === cid);
    return me && total ? Number(me.quota_weight) / total : 0;
  };

  const count = (ev: Event[], m: string, cid?: string) => ev.filter(e => e.month === m && (cid === undefined || e.coord === cid)).length;
  const stamp = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" }).format(now);

  const rows: DashRow[] = [];
  for (let i = 0; i <= upTo; i++) {
    const m = yearMonths[i];
    const isCur = m === current;
    const doneBefore = { s: startEv.filter(e => e.month < m).length, e: enrollEv.filter(e => e.month < m).length };
    const doneThrough = { s: doneBefore.s + count(startEv, m), e: doneBefore.e + count(enrollEv, m) };
    const left = MONTHS - i;
    const teamQuota = { s: Math.max(0, TARGET.starts - doneBefore.s) / left, e: Math.max(0, TARGET.enrolled - doneBefore.e) / left };
    const nextQuota = left > 1
      ? { s: Math.max(0, TARGET.starts - doneThrough.s) / (left - 1), e: Math.max(0, TARGET.enrolled - doneThrough.e) / (left - 1) }
      : { s: 0, e: 0 };
    const pace = { s: TARGET.starts / MONTHS, e: TARGET.enrolled / MONTHS };
    const label = `${m.slice(5)}.${m.slice(0, 4)}`;

    const callsIn = (cid?: string) => calls.filter(c => c.month === m && (cid === undefined || c.coord === cid));
    const snapshot = (cid?: string) => isCur ? {
      waitingNow: waiting.filter(w => cid === undefined || w.coord === cid).length,
      noAnswerNow: noAnswer.filter(c => cid === undefined || c === cid).length,
      oldestWait: Math.max(0, ...waiting.filter(w => cid === undefined || w.coord === cid).map(w => w.days)),
    } : { waitingNow: null, noAnswerNow: null, oldestWait: null };

    rows.push({
      key: `team:${m}`, group: "team", name: `צוות · ${label}`, month: m, coordLabel: "צוות",
      values: {
        month: `${m}-01`, coord: "צוות",
        starts: count(startEv, m), startsQuota: round1(teamQuota.s),
        startsGap: round1(doneThrough.s - pace.s * (i + 1)),
        enrolled: count(enrollEv, m), enrollQuota: round1(teamQuota.e),
        enrollGap: round1(doneThrough.e - pace.e * (i + 1)),
        firstCalls: callsIn().length, medianWait: median(callsIn().map(c => c.wait)),
        ...snapshot(),
        nextStartsQuota: isCur ? round1(nextQuota.s) : null, nextEnrollQuota: isCur ? round1(nextQuota.e) : null,
        locked: !isCur, updated: stamp,
      },
    });

    for (const c of staff) {
      if ((activeFrom.get(c.id) ?? "9999") > m) continue;
      /* פער אישי מול הקצב הבסיסי × החלק שלו/ה בכל חודש עד עכשיו */
      let gapS = 0, gapE = 0;
      for (let k = 0; k <= i; k++) {
        const mk = yearMonths[k], sh = shareIn(c.id, mk);
        gapS += count(startEv, mk, c.id) - pace.s * sh;
        gapE += count(enrollEv, mk, c.id) - pace.e * sh;
      }
      const sh = shareIn(c.id, m);
      const first = c.name.split(" ")[0];
      rows.push({
        key: `${c.id}:${m}`, group: "coords", name: `${first} · ${label}`, month: m, coordLabel: first,
        values: {
          month: `${m}-01`, coord: first,
          starts: count(startEv, m, c.id), startsQuota: round1(teamQuota.s * sh), startsGap: round1(gapS),
          enrolled: count(enrollEv, m, c.id), enrollQuota: round1(teamQuota.e * sh), enrollGap: round1(gapE),
          firstCalls: callsIn(c.id).length, medianWait: median(callsIn(c.id).map(x => x.wait)),
          ...snapshot(c.id),
          nextStartsQuota: isCur ? round1(nextQuota.s * sh) : null, nextEnrollQuota: isCur ? round1(nextQuota.e * sh) : null,
          locked: !isCur, updated: stamp,
        },
      });
    }
  }

  return {
    rows,
    notes: {
      startsInYear: startEv.length, startsUnassigned: startEv.filter(e => !staff.some(c => c.id === e.coord)).length,
      enrolledInYear: enrollEv.length, enrolledUndated: enroll.undated,
      firstCalls: calls.length, waitingNow: waiting.length,
    },
  };
}

/* ── כתיבה ללוח הניהול ──────────────────────────────────────────────────── */

function columnValues(r: DashRow) {
  const out: Record<string, unknown> = {};
  const col = TARGET_BOARD[r.group].col;
  for (const [k, val] of Object.entries(r.values) as [ColKey, DashRow["values"][ColKey]][]) {
    const id = col[k];
    if (k === "month") out[id] = { date: val };
    else if (k === "coord") out[id] = { label: val };
    else if (k === "locked") out[id] = val ? { checked: "true" } : null;
    else if (k === "updated") out[id] = val;
    else out[id] = val === null ? "" : String(val);
  }
  return out;
}

/**
 * כותב את השורות. חודש נעול שכבר נכתב — לא נוגעים בו. שורה שנמחקה בלוח
 * ביד נוצרת מחדש (המזהה השמור כבר לא קיים שם).
 */
export async function writeDashboard(opts: { dry: boolean }) {
  const res = await computeDashboard();
  if ("error" in res) return res;
  if (opts.dry) return { dry: true, notes: res.notes, rows: res.rows };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.SUPABASE_SECRET_KEY!;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: known } = await db.from("intech_dashboard_rows").select("key, item_id, locked");
  const map = new Map((known ?? []).map(k => [k.key, k]));
  const existing = await gql<{ boards: { items_page: { items: { id: string }[] } }[] }>(
    `{ boards(ids: [${TARGET_BOARD.team.board}, ${TARGET_BOARD.coords.board}]) { items_page(limit: 500) { items { id } } } }`);
  const alive = new Set((existing?.boards ?? []).flatMap(b => b.items_page.items.map(i => i.id)));

  let created = 0, updated = 0, skippedLocked = 0;
  const failed: string[] = [];
  for (const r of res.rows) {
    const k = map.get(r.key);
    const exists = k && alive.has(String(k.item_id));
    if (exists && k.locked) { skippedLocked++; continue; }
    const vals = JSON.stringify(columnValues(r));
    if (exists) {
      const u = await gql<{ change_multiple_column_values: { id: string } }>(
        `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v, create_labels_if_missing: true) { id } }`,
        { b: TARGET_BOARD[r.group].board, i: String(k.item_id), v: vals });
      if (!u) { failed.push(r.key); continue; }
      updated++;
    } else {
      const c = await gql<{ create_item: { id: string } }>(
        `mutation ($b: ID!, $g: String!, $n: String!, $v: JSON!) { create_item(board_id: $b, group_id: $g, item_name: $n, column_values: $v, create_labels_if_missing: true) { id } }`,
        { b: TARGET_BOARD[r.group].board, g: TARGET_BOARD[r.group].group, n: r.name, v: vals });
      if (!c) { failed.push(r.key); continue; }
      created++;
      await db.from("intech_dashboard_rows").upsert({ key: r.key, item_id: Number(c.create_item.id), locked: false, updated_at: new Date().toISOString() });
    }
    if (r.values.locked) await db.from("intech_dashboard_rows").update({ locked: true }).eq("key", r.key);
  }
  return { notes: res.notes, created, updated, skippedLocked, failed };
}
