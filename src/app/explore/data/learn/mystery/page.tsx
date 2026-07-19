"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Mini SQL Engine ──────────────────────────────────────────────────────────

type Val = string | number | null;
type Row = Record<string, Val>;
type DB = Record<string, Row[]>;
type QResult = { cols: string[]; rows: Row[] } | { error: string };

function prefixRow(row: Row, alias: string): Row {
  const out: Row = {};
  for (const k of Object.keys(row)) out[`${alias}.${k}`] = row[k];
  return out;
}

function getVal(row: Row, key: string): Val {
  return key in row ? row[key] : null;
}

function resolveColKey(expr: string): string {
  return expr.trim().toLowerCase();
}

function evalCondition(cond: string, row: Row): boolean {
  const m = cond.match(/^(.+?)\s*(!=|<>|>=|<=|>|<|=)\s*(.+)$/);
  if (!m) return true;
  const [, lhsRaw, op, rhsRaw] = m;
  const lhsKey = resolveColKey(lhsRaw);
  const rowVal = getVal(row, lhsKey);

  let rhsVal: Val;
  const rt = rhsRaw.trim();
  if (/^'.*'$/.test(rt) || /^".*"$/.test(rt)) rhsVal = rt.slice(1, -1);
  else if (!isNaN(Number(rt))) rhsVal = Number(rt);
  else rhsVal = rt;

  const lv = typeof rowVal === "string" ? rowVal.toLowerCase() : rowVal;
  const rv = typeof rhsVal === "string" ? rhsVal.toLowerCase() : rhsVal;

  switch (op) {
    case "=":  return lv == rv;
    case "!=": case "<>": return lv != rv;
    case ">":  return (lv as number) > (rv as number);
    case "<":  return (lv as number) < (rv as number);
    case ">=": return (lv as number) >= (rv as number);
    case "<=": return (lv as number) <= (rv as number);
    default:   return false;
  }
}

function evalWhere(where: string, row: Row): boolean {
  return where.split(/\s+AND\s+/i).every(c => evalCondition(c.trim(), row));
}

function runSQL(raw: string, db: DB): QResult {
  const sql = raw.trim().replace(/\s+/g, " ");
  if (!/^select\s/i.test(sql))
    return { error: "רק שאילתות SELECT נתמכות. לדוגמה: SELECT * FROM employees" };

  try {
    const up = sql.toUpperCase();

    const iFrom  = up.indexOf(" FROM ");
    if (iFrom < 0) throw new Error("חסרה FROM");

    const joinMatch = up.match(/\b(INNER |LEFT )?JOIN\b/);
    const iJoin = joinMatch ? up.indexOf(joinMatch[0]) : -1;
    const iOn   = iJoin >= 0 ? up.indexOf(" ON ", iJoin) : -1;
    const iWhere = up.indexOf(" WHERE ");
    const iOrder = up.indexOf(" ORDER BY ");
    const iLimit = up.indexOf(" LIMIT ");

    const selectStr = sql.slice(7, iFrom).trim();

    const fromEnd = [iJoin, iWhere, iOrder, iLimit].find(x => x > 0) ?? sql.length;
    const fromStr = sql.slice(iFrom + 6, fromEnd).trim();
    const [fromName, fromAlias] = fromStr.split(/\s+/);
    const mainTable = fromName.toLowerCase();
    const mainAlias = (fromAlias || fromName).toLowerCase();
    const aliasMap: Record<string, string> = { [mainAlias]: mainTable };

    if (!db[mainTable]) throw new Error(`טבלה לא נמצאה: "${mainTable}". הטבלאות הזמינות: ${Object.keys(db).join(", ")}`);

    let rows: Row[] = db[mainTable].map(r => prefixRow(r, mainAlias));

    // JOIN
    if (iJoin >= 0 && iOn >= 0) {
      const joinEnd = [iWhere, iOrder, iLimit].find(x => x > 0) ?? sql.length;
      const joinStr = sql.slice(iJoin + joinMatch![0].length, iOn).trim();
      const [jName, jAlias] = joinStr.split(/\s+/);
      const joinTable = jName.toLowerCase();
      const joinAlias = (jAlias || jName).toLowerCase();
      aliasMap[joinAlias] = joinTable;

      if (!db[joinTable]) throw new Error(`טבלה לא נמצאה: "${joinTable}"`);

      const onEnd = [iWhere, iOrder, iLimit].find(x => x > 0) ?? sql.length;
      const onStr = sql.slice(iOn + 4, onEnd).trim().toLowerCase();
      const [onL, onR] = onStr.split(/\s*=\s*/);

      const joinRows = db[joinTable].map(r => prefixRow(r, joinAlias));
      rows = rows.flatMap(mainRow => {
        const mainVal = getVal(mainRow, onL.trim()) ?? getVal(mainRow, onR.trim());
        return joinRows
          .filter(jr => getVal(jr, onR.trim()) === mainVal || getVal(jr, onL.trim()) === getVal(mainRow, onR.trim()))
          .map(jr => ({ ...mainRow, ...jr }));
      });
    }

    // WHERE
    const whereEnd = [iOrder, iLimit].find(x => x > 0) ?? sql.length;
    if (iWhere >= 0) {
      const whereStr = sql.slice(iWhere + 7, whereEnd).trim().toLowerCase();
      rows = rows.filter(r => evalWhere(whereStr, r));
    }

    // ORDER BY
    const orderEnd = iLimit >= 0 ? iLimit : sql.length;
    if (iOrder >= 0) {
      const orderStr = sql.slice(iOrder + 10, orderEnd).trim().toLowerCase();
      const parts = orderStr.split(/\s+/);
      const col = resolveColKey(parts[0]);
      const desc = parts[1]?.toUpperCase() === "DESC";
      rows = [...rows].sort((a, b) => {
        const av = getVal(a, col), bv = getVal(b, col);
        if (av === null) return 1; if (bv === null) return -1;
        return (av < bv ? -1 : av > bv ? 1 : 0) * (desc ? -1 : 1);
      });
    }

    // LIMIT
    if (iLimit >= 0) {
      const n = parseInt(sql.slice(iLimit + 7).trim());
      if (!isNaN(n)) rows = rows.slice(0, n);
    }

    // SELECT columns
    let cols: string[];
    let finalRows: Row[];

    if (selectStr === "*") {
      const allKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
      cols = allKeys.map(k => k.includes(".") ? k.split(".")[1] : k);
      finalRows = rows.map(r => {
        const clean: Row = {};
        allKeys.forEach((k, i) => { clean[cols[i]] = r[k]; });
        return clean;
      });
    } else {
      const exprs = selectStr.split(",").map(e => e.trim().toLowerCase());
      cols = exprs.map(e => {
        const asParts = e.split(/\s+as\s+/i);
        if (asParts[1]) return asParts[1].trim();
        return e.includes(".") ? e.split(".")[1] : e;
      });
      finalRows = rows.map(r => {
        const clean: Row = {};
        exprs.forEach((expr, i) => {
          const asParts = expr.split(/\s+as\s+/i);
          const colExpr = resolveColKey(asParts[0]);
          const v = getVal(r, colExpr);
          clean[cols[i]] = v !== null ? v : getVal(r, colExpr.split(".")[1] ?? colExpr);
        });
        return clean;
      });
    }

    return { cols, rows: finalRows };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "שגיאה לא ידועה" };
  }
}

// ─── TechFlow Database ────────────────────────────────────────────────────────

const DB: DB = {
  employees: [
    { id: 1, name: "דני לוי",    department: "Engineering", access_level: "admin",      start_date: "2021-03-15", last_login: "2024-01-08 02:34" },
    { id: 2, name: "מיה כהן",    department: "Marketing",   access_level: "read",       start_date: "2022-06-01", last_login: "2024-01-07 16:22" },
    { id: 3, name: "אבי גולד",   department: "Support",     access_level: "read-write", start_date: "2020-11-10", last_login: "2024-01-07 09:15" },
    { id: 4, name: "רחל נוימן",  department: "Engineering", access_level: "admin",      start_date: "2023-01-05", last_login: "2024-01-06 11:43" },
    { id: 5, name: "יואב שפירא", department: "Data",        access_level: "read-write", start_date: "2021-08-20", last_login: "2024-01-08 01:17" },
    { id: 6, name: "נועה ברק",   department: "HR",          access_level: "read",       start_date: "2022-03-14", last_login: "2024-01-07 14:30" },
    { id: 7, name: "עמי טל",     department: "Finance",     access_level: "read",       start_date: "2023-05-01", last_login: "2024-01-05 10:22" },
    { id: 8, name: "שירה מזרחי", department: "Engineering", access_level: "admin",      start_date: "2019-07-18", last_login: "2024-01-03 16:45" },
  ],
  access_logs: [
    { id: 1,  employee_id: 3, table_name: "users",     action: "read",   timestamp: "2024-01-07 09:15" },
    { id: 2,  employee_id: 5, table_name: "users",     action: "read",   timestamp: "2024-01-07 11:32" },
    { id: 3,  employee_id: 5, table_name: "users",     action: "export", timestamp: "2024-01-07 23:58" },
    { id: 4,  employee_id: 1, table_name: "analytics", action: "read",   timestamp: "2024-01-08 00:12" },
    { id: 5,  employee_id: 2, table_name: "campaigns", action: "read",   timestamp: "2024-01-07 16:22" },
    { id: 6,  employee_id: 5, table_name: "payments",  action: "read",   timestamp: "2024-01-07 23:45" },
    { id: 7,  employee_id: 3, table_name: "tickets",   action: "write",  timestamp: "2024-01-07 09:20" },
    { id: 8,  employee_id: 4, table_name: "code_repo", action: "read",   timestamp: "2024-01-06 11:43" },
    { id: 9,  employee_id: 1, table_name: "users",     action: "read",   timestamp: "2024-01-05 14:10" },
    { id: 10, employee_id: 5, table_name: "users",     action: "export", timestamp: "2024-01-02 22:30" },
  ],
  file_transfers: [
    { id: 1, employee_id: 5, file_size_mb: 4823, destination: "185.220.101.42", timestamp: "2024-01-08 00:03" },
    { id: 2, employee_id: 2, file_size_mb: 12,   destination: "gmail.com",       timestamp: "2024-01-07 16:30" },
    { id: 3, employee_id: 3, file_size_mb: 8,    destination: "drive.google.com",timestamp: "2024-01-07 09:45" },
    { id: 4, employee_id: 1, file_size_mb: 245,  destination: "github.com",      timestamp: "2024-01-08 00:15" },
    { id: 5, employee_id: 6, file_size_mb: 3,    destination: "drive.google.com",timestamp: "2024-01-07 14:35" },
  ],
  meetings: [
    { id: 1, employee_id: 5, meeting_type: "external", company: "DataRival Ltd", date: "2024-01-05" },
    { id: 2, employee_id: 2, meeting_type: "external", company: "Creative Agency", date: "2024-01-06" },
    { id: 3, employee_id: 7, meeting_type: "external", company: "Accountant Office",date: "2024-01-04" },
    { id: 4, employee_id: 1, meeting_type: "internal", company: "TechFlow",       date: "2024-01-08" },
    { id: 5, employee_id: 5, meeting_type: "external", company: "DataRival Ltd",  date: "2024-01-02" },
    { id: 6, employee_id: 3, meeting_type: "internal", company: "TechFlow",       date: "2024-01-07" },
  ],
};

const SCHEMA: { table: string; cols: string[] }[] = [
  { table: "employees",      cols: ["id", "name", "department", "access_level", "start_date", "last_login"] },
  { table: "access_logs",    cols: ["id", "employee_id", "table_name", "action", "timestamp"] },
  { table: "file_transfers", cols: ["id", "employee_id", "file_size_mb", "destination", "timestamp"] },
  { table: "meetings",       cols: ["id", "employee_id", "meeting_type", "company", "date"] },
];

// ─── Suspects ─────────────────────────────────────────────────────────────────
const SUSPECTS = [
  { id: 1, name: "דני לוי",    role: "מהנדס בכיר" },
  { id: 3, name: "אבי גולד",   role: "נציג תמיכה" },
  { id: 5, name: "יואב שפירא", role: "אנליסט דאטה" },
  { id: 8, name: "שירה מזרחי", role: "ארכיטקטית מערכות" },
];

const CULPRIT_ID = 5;

// ─── Investigation Guide ──────────────────────────────────────────────────────

type InvStep = { id: string; num: number; label: string; desc: string };

const INV_STEPS: InvStep[] = [
  { id: "employees", num: 1, label: "מפה את העובדים",        desc: "שם, מחלקה, access_level — מי בחברה ומה רמת הגישה שלהם?" },
  { id: "access",    num: 2, label: "בחני יומן גישה",         desc: "מי ניגש לאיזה טבלה ומתי? הסתכלי על access_logs" },
  { id: "export",    num: 3, label: "אתרי פעולות ייצוא",      desc: "action = 'export' היא פעולה חריגה — לא read אלא הוצאה של נתונים החוצה" },
  { id: "transfers", num: 4, label: "עקבי אחר הקבצים",        desc: "מה יצא פיזית מהארגון? file_size_mb, destination, timestamp" },
  { id: "meetings",  num: 5, label: "בדקי פגישות חיצוניות",  desc: "מי נפגש עם גורמים מחוץ לחברה לאחרונה? עם מי בדיוק?" },
  { id: "join",      num: 6, label: "חברי הכל ב-JOIN",         desc: "קשרי employee_id ↔ שם ↔ פעולה ↔ פגישה בשאילתה אחת" },
];

function detectSteps(sql: string): string[] {
  const up = sql.toUpperCase();
  const found: string[] = [];
  if (up.includes("FROM EMPLOYEES")) found.push("employees");
  if (up.includes("FROM ACCESS_LOGS")) found.push("access");
  if (up.includes("EXPORT")) found.push("export");
  if (up.includes("FILE_TRANSFERS") || up.includes("FILE_SIZE_MB")) found.push("transfers");
  if (up.includes("FROM MEETINGS") || up.includes("MEETING_TYPE")) found.push("meetings");
  if (up.includes("JOIN")) found.push("join");
  return found;
}

// ─── Evidence type ────────────────────────────────────────────────────────────

type Evidence = {
  id: string;
  icon: string;
  title: string;
  finding: string;
  meaning: string;
  next?: string;
};

// ─── Hint messages ────────────────────────────────────────────────────────────
function getHint(sql: string): string | null {
  const up = sql.toUpperCase();
  if (up.includes("FROM EMPLOYEES") && !up.includes("WHERE"))
    return "💡 רואים 8 עובדים. שימי לב ל-access_level ולמחלקה — מי בכלל יכול לייצא נתונים?\nהצעד הבא: SELECT * FROM access_logs WHERE table_name = 'users'";
  if (up.includes("FROM ACCESS_LOGS") && !up.includes("EXPORT") && !up.includes("WHERE"))
    return "💡 יומן גישה מלא. מה שמעניין הוא לא read — אלא export. נסי לסנן: SELECT * FROM access_logs WHERE action = 'export'";
  if (up.includes("EXPORT"))
    return "💡 מצאת ייצוא. שימי לב לשעות ול-employee_id. עכשיו בדקי מה יצא מהארגון: SELECT * FROM file_transfers ORDER BY file_size_mb DESC";
  if ((up.includes("FILE_TRANSFERS") || up.includes("FILE_SIZE_MB")) && !up.includes("FROM MEETINGS"))
    return "💡 קובץ של 4.8GB ל-IP חיצוני ברומניה — זה לא backup שגרתי. מישהו תיאם את זה מבחוץ?\nנסי: SELECT * FROM meetings WHERE meeting_type = 'external'";
  if (up.includes("FROM MEETINGS") && !up.includes("JOIN"))
    return "💡 ראית פגישות חיצוניות עם DataRival. עכשיו חברי הכל ב-JOIN:\nSELECT e.name, a.action, a.timestamp FROM employees e JOIN access_logs a ON e.id = a.employee_id WHERE a.action = 'export'";
  return null;
}

// ─── Result Table ─────────────────────────────────────────────────────────────
function ResultTable({ cols, rows }: { cols: string[]; rows: Row[] }) {
  if (rows.length === 0) return (
    <div className="text-[12px] text-center py-4" style={{ color: "rgba(0,0,0,0.4)" }}>
      אין תוצאות (0 שורות)
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] border-collapse min-w-max">
        <thead>
          <tr style={{ background: "rgba(13,148,136,0.12)" }}>
            {cols.map(c => (
              <th key={c} className="text-right px-3 py-2 font-bold border-b"
                style={{ borderColor: "rgba(13,148,136,0.2)", color: "#0d9488", whiteSpace: "nowrap" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(13,148,136,0.03)" }}>
              {cols.map(c => (
                <td key={c} className="px-3 py-2 border-b"
                  style={{ borderColor: "rgba(0,0,0,0.06)", whiteSpace: "nowrap", color: "#1c1c1c" }}>
                  {r[c] === null ? <span style={{ color: "rgba(0,0,0,0.3)" }}>NULL</span> : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[11px] mt-1 text-right" style={{ color: "rgba(0,0,0,0.38)" }}>
        {rows.length} שורות
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Phase = "intro" | "investigate" | "reveal";

export default function MysteryPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<QResult | null>(null);
  const [history, setHistory] = useState<{ sql: string; result: QResult }[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [accusation, setAccusation] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (phase === "investigate") textareaRef.current?.focus();
  }, [phase]);

  function handleRun() {
    if (!sql.trim()) return;
    const res = runSQL(sql, DB);
    setResult(res);
    setHistory(prev => [{ sql, result: res }, ...prev].slice(0, 10));

    // Track investigation steps
    const steps = detectSteps(sql);
    if (steps.length > 0) {
      setCompletedSteps(prev => { const n = new Set(prev); steps.forEach(s => n.add(s)); return n; });
    }

    // Detect evidence
    if ("cols" in res) {
      const up = sql.toUpperCase();
      const newEv: Evidence[] = [];

      if (up.includes("EXPORT")) {
        const rows = res.rows.filter(r => String(r.action).toLowerCase() === "export");
        if (rows.length > 0) {
          const ids = [...new Set(rows.map(r => r.employee_id))].join(", ");
          newEv.push({
            id: "export", icon: "📤", title: "ייצוא נתונים חשוד",
            finding: `${rows.length} פעולות export על טבלת users — employee_id: ${ids}`,
            meaning: "ייצוא מלא של טבלת המשתמשים הוא פעולה חריגה שאינה שגרתית. בוצעה פעמיים באותו לילה — ב-22:30 וב-23:58. פעמיים ייצוא באותו ערב מרמז על כוונה מוקדמת.",
            next: "עקבי אחר מה יצא פיזית מהארגון: SELECT * FROM file_transfers ORDER BY file_size_mb DESC",
          });
        }
      }

      if (up.includes("FILE_TRANSFERS") || up.includes("FILE_SIZE_MB")) {
        const big = res.rows.filter(r => (r.file_size_mb as number) > 1000);
        if (big.length > 0) newEv.push({
          id: "transfer", icon: "📦", title: "העברת קובץ חריגה",
          finding: `קובץ ${Number(big[0].file_size_mb).toLocaleString()}MB → ${big[0].destination} בשעה ${big[0].timestamp}`,
          meaning: "4,823MB = בדיוק הנפח של 50,000 רשומות לקוח כולל פרטי תשלום. ה-IP 185.220.101.42 שייך לשרת VPN אנונימי. ההעברה בוצעה 5 דקות לאחר הייצוא האחרון — תזמון מדויק מדי להיות מקרה.",
          next: "מישהו תיאם זאת עם גורם חיצוני. בדקי: SELECT * FROM meetings WHERE meeting_type = 'external'",
        });
      }

      if (up.includes("FROM MEETINGS") || up.includes("MEETING_TYPE")) {
        const dr = res.rows.filter(r => String(r.company).includes("DataRival"));
        if (dr.length > 0) {
          const ids = [...new Set(dr.map(r => r.employee_id))].join(", ");
          newEv.push({
            id: "meetings", icon: "🤝", title: "קשר עם המתחרה הישירה",
            finding: `${dr.length} פגישות עם DataRival Ltd — employee_id: ${ids}`,
            meaning: "DataRival Ltd הציעה לרכוש את TechFlow לפני 3 חודשים — ונדחתה. פגישות בלתי מתועדות של עובד בדרגה נמוכה (לא ניהול) עם המתחרה — חריגות מאוד.",
            next: "חברי שם ← פעולה: SELECT e.name, a.action FROM employees e JOIN access_logs a ON e.id = a.employee_id WHERE a.action = 'export'",
          });
        }
      }

      if (up.includes("JOIN") && res.rows.some(r => r.name === "יואב שפירא")) {
        newEv.push({
          id: "yoav", icon: "🔍", title: "החשוד מזוהה",
          finding: "יואב שפירא, אנליסט דאטה — מופיע בכל שלוש נקודות הזמן",
          meaning: "ייצוא ב-23:58 → קובץ 4.8GB ב-00:03 → שתי פגישות עם DataRival בשבוע שלפני. הדפוס הפלילי מלא.",
        });
      }

      if (newEv.length > 0) {
        setEvidence(prev => {
          const merged = [...prev];
          newEv.forEach(e => { if (!merged.find(x => x.id === e.id)) merged.push(e); });
          return merged;
        });
      }
    }

    setHint(getHint(sql));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleRun(); }
  }

  function handleAccuse(id: number) { setAccusation(id); setPhase("reveal"); }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "#0a0f1e" }}>
        <div className="flex-1 max-w-[720px] mx-auto w-full px-6 py-10 flex flex-col gap-6">

          {/* Status bar */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold tracking-widest" style={{ color: "rgba(13,148,136,0.6)" }}>TECHFLOW SECURITY CONSOLE</div>
            <div className="text-[10px] font-mono" style={{ color: "rgba(255,80,80,0.8)" }}>● INCIDENT ACTIVE</div>
          </div>

          {/* Title */}
          <div>
            <div className="text-[10px] font-mono mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>CASE #2024-0108 · TOP SECRET · TLV · 23:47</div>
            <div className="text-[34px] md:text-[44px] leading-tight text-white mb-2" style={HEEBO}>
              פרשת הדלפת<br />הנתונים
            </div>
          </div>

          {/* Situation report */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)" }}>
            <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "rgba(192,57,43,0.8)" }}>SITUATION REPORT</div>
            <div className="text-[13.5px] leading-relaxed text-white mb-4">
              מסד הנתונים הראשי של TechFlow — <strong>50,000 לקוחות כולל פרטי תשלום</strong> — הגיע לידי DataRival Ltd, המתחרה הישירה שלנו.
            </div>
            <div className="rounded-xl px-4 py-3 text-[13px] leading-relaxed" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.7)", fontStyle: "italic", borderRight: "3px solid rgba(192,57,43,0.5)" }}>
              "הם צלצלו אלינו היום בערב ו'הציעו לקנות' את החברה. כשסירבנו, שלחו לנו קובץ שמוכיח שיש להם גישה לכל הנתונים שלנו. המשטרה מגיעה בבוקר. אני צריך שם עד אז."
              <div className="mt-2 text-[10px] not-italic" style={{ color: "rgba(255,255,255,0.4)" }}>— אדם בן-דוד, מנכ"ל TechFlow</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[10px] font-bold tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>TIMELINE · 48 שעות אחרונות</div>
            <div className="flex flex-col gap-3">
              {[
                { time: "07.01 · 16:00", event: "DataRival מציעה לרכוש את TechFlow — נדחית", c: "#6b7280" },
                { time: "08.01 · 22:30", event: "גישה חריגה לטבלת users — ייצוא ראשון",       c: "#fb8500" },
                { time: "08.01 · 23:58", event: "ייצוא שני של כל הטבלה",                      c: "#fb8500" },
                { time: "09.01 · 00:03", event: "קובץ 4.8GB יוצא לכתובת IP חיצונית",          c: "#c0392b" },
                { time: "09.01 · 08:15", event: "DataRival מציגה ראיות — קריאת חירום",         c: "#c0392b" },
              ].map(({ time, event, c }) => (
                <div key={time} className="flex gap-3 items-center">
                  <div className="text-[9px] font-mono shrink-0 w-[90px]" style={{ color: "rgba(255,255,255,0.3)" }}>{time}</div>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                  <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>{event}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Role */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)" }}>
            <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "#0d9488" }}>YOUR ROLE</div>
            <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              את ה-<strong style={{ color: "#0d9488" }}>Forensic Data Analyst</strong> של TechFlow. יש לך גישה מלאה לכל מסדי הנתונים.
              4 שעות עד הבוקר. המשימה: לאתר מי ביצע את ההדלפה, לאסוף ראיות, ולהגיש דוח.
            </div>
          </div>

          {/* DB Access */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>AVAILABLE DATABASES</div>
            <div className="grid grid-cols-2 gap-3">
              {SCHEMA.map(s => (
                <div key={s.table} className="rounded-xl p-3" style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
                  <div className="text-[11px] font-bold font-mono mb-1" style={{ color: "#0d9488" }}>{s.table}</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{s.cols.join(", ")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How to start */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>HOW TO INVESTIGATE</div>
            <div className="text-[12.5px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
              כתבי שאילתות SQL על מסדי הנתונים. אפשר להשתמש ב-WHERE, JOIN, ORDER BY, LIMIT.
              כדאי להתחיל מלמפות את כל העובדים:
            </div>
            <div className="rounded-xl px-4 py-3 font-mono text-[12px]" style={{ background: "rgba(0,0,0,0.4)", color: "#0d9488" }}>
              SELECT * FROM employees
            </div>
            <div className="text-[11.5px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              כשתמצאי מספיק ראיות — תוכלי להאשים. מדריך חקירה יופיע לצד העורך.
            </div>
          </div>

          <button
            onClick={() => setPhase("investigate")}
            className="w-full py-4 rounded-2xl text-white font-bold text-[15px]"
            style={{ background: "#0d9488", ...HEEBO }}
          >
            כנסי לחדר החקירות ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Reveal ─────────────────────────────────────────────────────────────────
  if (phase === "reveal") {
    const correct = accusation === CULPRIT_ID;
    return (
      <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        <div className="px-[22px] md:px-12 pt-[26px] pb-[26px] shrink-0" style={{ background: "#0a0f1e" }}>
          <div className="max-w-[720px] mx-auto">
            <div className="text-[10px] font-mono mb-2" style={{ color: "rgba(13,148,136,0.5)" }}>TECHFLOW · CASE #2024-0108 · CLOSED</div>
            <div className="text-[22px] font-bold text-white" style={HEEBO}>
              {correct ? "✓ זיהית את האשמ/ת — חקירה הושלמה" : "✗ לא בדיוק — הנה מה שהחמצת"}
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] md:px-0 py-8 flex flex-col gap-6">

          {/* Verdict */}
          <div className="rounded-2xl p-5" style={{
            background: correct ? "rgba(111,191,138,0.08)" : "rgba(192,57,43,0.08)",
            border: `1.5px solid ${correct ? "#6fbf8a" : "#c0392b"}`,
          }}>
            <div className="text-[15px] font-bold mb-2" style={{ color: correct ? "#2e7d46" : "#c0392b" }}>
              {correct ? "כל הכבוד — ניתוח אנליטי מדויק!" : "האשמ/ת: יואב שפירא, אנליסט דאטה"}
            </div>
            <div className="text-[13px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
              {correct
                ? "חיברת מספר מקורות מידע עצמאיים לתמונה אחת קוהרנטית. זה בדיוק מה שחוקר/ת דאטה עושה: לא להסתמך על ראיה אחת, אלא לבנות שרשרת שאי אפשר להתכחש לה."
                : "יואב שפירא — אנליסט דאטה, מחלקת Data, גישת read-write. פוטר ב-2024 לאחר גילוי ההדלפה. ייצא טבלת לקוחות פעמיים, העביר 4.8GB לשרת חיצוני, ונפגש עם DataRival פעמיים בשבוע שלפני."}
            </div>
          </div>

          {/* Crime Timeline */}
          <div>
            <div className="text-[12px] font-bold mb-4" style={{ color: "rgba(0,0,0,0.45)" }}>ציר הזמן של הפשע</div>
            <div className="flex flex-col">
              {[
                { time: "07.01 · 16:00", event: "DataRival מציעה לרכוש את TechFlow", detail: "ההצעה נדחית על ידי הדירקטוריון. יואב שפירא נוכח בישיבה כסיוע טכני.", c: "#6b7280" },
                { time: "07.01 · 17:30", event: "יואב יוצר קשר עם נציג DataRival", detail: "לא מתועד בפגישות הרשמיות — נמצא בנתוני meetings בחקירה.", c: "#fb8500" },
                { time: "08.01 · 22:30", event: "ייצוא ראשון — export מ-users", detail: "employee_id 5 מריץ export. לא מדווח לניהול.", c: "#c0392b" },
                { time: "08.01 · 23:58", event: "ייצוא שני — כל טבלת הלקוחות", detail: "50,000 רשומות מלאות כולל פרטי תשלום. נשמרות locally.", c: "#c0392b" },
                { time: "09.01 · 00:03", event: "קובץ 4,823MB → 185.220.101.42", detail: "שרת VPN אנונימי. ה-IP נרשם לפני שבוע — תכנון מוקדם.", c: "#c0392b" },
                { time: "09.01 · 08:15", event: "DataRival מציגה ראיות לגישה לנתונים", detail: "נתונים מוצגים כ-proof of concept. מחיר הדרישה: 2M$.", c: "#023e8a" },
              ].map((item, i, arr) => (
                <div key={i} className="flex gap-4 pb-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full border-2 mt-1" style={{ borderColor: item.c, background: "#fbf9f5" }} />
                    {i < arr.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(0,0,0,0.1)" }} />}
                  </div>
                  <div className="pb-1">
                    <div className="text-[10px] font-mono mb-0.5" style={{ color: "rgba(0,0,0,0.32)" }}>{item.time}</div>
                    <div className="text-[12.5px] font-bold mb-0.5" style={{ color: item.c }}>{item.event}</div>
                    <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence chain */}
          <div>
            <div className="text-[12px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>שאילתות שהיו מגלות הכל</div>
            <div className="flex flex-col gap-3">
              {[
                { q: "SELECT * FROM access_logs WHERE action = 'export'", finding: "2 ייצואים, employee_id: 5", icon: "📤" },
                { q: "SELECT * FROM file_transfers WHERE file_size_mb > 1000", finding: "קובץ 4,823MB → IP חיצוני, 5 דקות אחרי הייצוא", icon: "📦" },
                { q: "SELECT * FROM meetings WHERE company = 'DataRival Ltd'", finding: "2 פגישות, employee_id: 5, בשבוע שלפני ההדלפה", icon: "🤝" },
                { q: "SELECT e.name, a.action FROM employees e JOIN access_logs a ON e.id = a.employee_id WHERE a.action = 'export'", finding: "יואב שפירא — השם מאחורי employee_id 5", icon: "🔍" },
              ].map((step, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: "rgba(13,148,136,0.04)", border: "1px solid rgba(13,148,136,0.12)" }}>
                  <div className="flex items-start gap-3">
                    <div className="text-[16px] shrink-0">{step.icon}</div>
                    <div className="min-w-0">
                      <div className="font-mono text-[10.5px] px-2 py-1 rounded mb-1.5 break-all" style={{ background: "rgba(0,0,0,0.05)", color: "#0d9488" }}>{step.q}</div>
                      <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.6)" }}>→ {step.finding}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lessons */}
          <div className="rounded-xl p-5" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-bold mb-3" style={{ color: "#023e8a" }}>מה למדת — כישורים אמיתיים</div>
            <div className="flex flex-col gap-3">
              {[
                { skill: "JOIN", lesson: "employee_id לבדו לא אומר כלום — JOIN עם employees חושף את השם מאחורי המספר" },
                { skill: "WHERE מדויק", lesson: "FROM access_logs חוזר 10 שורות; WHERE action='export' — 2 שורות קריטיות" },
                { skill: "קורלציה", lesson: "כל ראיה בפני עצמה אינה מספיקה — שלוש טבלאות יחד יוצרות תמונה שלמה" },
                { skill: "ORDER BY", lesson: "ORDER BY file_size_mb DESC מייד מצביע על הקובץ הענק שמזנק מעל כל השאר" },
              ].map(({ skill, lesson }) => (
                <div key={skill} className="flex gap-3 items-start">
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 mt-0.5"
                    style={{ background: "rgba(2,62,138,0.1)", color: "#023e8a" }}>{skill}</div>
                  <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.6)" }}>{lesson}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase("investigate"); setAccusation(null); setEvidence([]); setCompletedSteps(new Set()); setSql(""); setResult(null); setHistory([]); setHint(null); }}
              className="flex-1 py-3 rounded-xl font-bold text-[14px] border"
              style={{ borderColor: "rgba(2,62,138,0.2)", color: "#023e8a" }}
            >
              חקרי מחדש
            </button>
            <Link href="/explore/data/learn" className="flex-1">
              <button className="w-full py-3 rounded-xl font-bold text-[14px] text-white" style={{ background: "#023e8a" }}>
                חזרה למרכז הלמידה
              </button>
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Investigate ────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="px-[22px] md:px-12 pt-[18px] pb-[14px] shrink-0" style={{ background: "#0a0f1e" }}>
        <div className="max-w-[960px] mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <Link href="/explore/data/learn" className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>← חזרה</Link>
            <div className="text-[9px] font-mono" style={{ color: "rgba(13,148,136,0.6)" }}>
              TECHFLOW · ACTIVE · {completedSteps.size}/{INV_STEPS.length} שלבים הושלמו
            </div>
          </div>
          <div className="text-[16px] font-bold text-white" style={HEEBO}>פרשת הדלפת הנתונים — חדר החקירות</div>
          <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
            כתבי SQL · Ctrl+Enter להרצה · {evidence.length} ראיה{evidence.length !== 1 ? "ות" : ""} נאספ{evidence.length !== 1 ? "ו" : "ה"}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[960px] mx-auto w-full px-[22px] md:px-0 py-5 flex flex-col md:flex-row gap-5 md:items-start">

        {/* Left: Editor + Results */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Schema */}
          <div className="rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-2"
            style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
            {SCHEMA.map(s => (
              <div key={s.table}>
                <div className="text-[11px] font-bold font-mono" style={{ color: "#0d9488" }}>{s.table}</div>
                <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.42)" }}>{s.cols.join(", ")}</div>
              </div>
            ))}
          </div>

          {/* SQL Editor */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(13,148,136,0.3)" }}>
            <div className="px-3 py-1.5 text-[10px] font-bold flex gap-2 items-center"
              style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488" }}>
              SQL EDITOR
              <span style={{ color: "rgba(0,0,0,0.3)", fontWeight: 400 }}>· כתבי שאילתה, Ctrl+Enter להרצה</span>
            </div>
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder={"SELECT * FROM employees"}
              className="w-full px-4 py-3 text-[13px] font-mono resize-none outline-none"
              style={{ background: "#fff", color: "#1c1c1c", direction: "ltr" }}
              dir="ltr"
            />
            <div className="px-3 py-2 flex justify-between items-center" style={{ background: "rgba(13,148,136,0.04)" }}>
              <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.32)" }}>employees · access_logs · file_transfers · meetings</div>
              <button onClick={handleRun} disabled={!sql.trim()}
                className="px-4 py-1.5 rounded-lg text-white text-[12px] font-bold disabled:opacity-40"
                style={{ background: "#0d9488" }}>▶ הרץ</button>
            </div>
          </div>

          {/* Hint */}
          {hint && (
            <div className="rounded-xl px-4 py-3 text-[12px] leading-relaxed whitespace-pre-line"
              style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.2)", color: "rgba(0,0,0,0.65)" }}>
              {hint}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <div className="px-3 py-1.5 text-[10px] font-bold flex justify-between"
                style={{ background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.42)" }}>
                <span>תוצאה</span>
                {"cols" in result && <span>{result.rows.length} שורות</span>}
              </div>
              <div className="p-3">
                {"error" in result
                  ? <div className="text-[12px] font-mono" style={{ color: "#c0392b" }}>שגיאה: {result.error}</div>
                  : <ResultTable cols={result.cols} rows={result.rows} />}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div>
              <div className="text-[11px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.38)" }}>היסטוריית שאילתות</div>
              <div className="flex flex-col gap-1">
                {history.slice(1, 5).map((h, i) => (
                  <button key={i} onClick={() => { setSql(h.sql); setResult(h.result); }}
                    className="text-[11px] font-mono text-left px-3 py-1.5 rounded-lg truncate"
                    style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.48)", direction: "ltr" }}>
                    {h.sql}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Mission Guide + Evidence + Accuse */}
        <div className="md:w-[275px] flex flex-col gap-4 shrink-0">

          {/* Mission Guide */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#fff" }}>
            <div className="px-4 py-2.5 text-[10px] font-bold"
              style={{ background: "rgba(2,62,138,0.04)", color: "rgba(0,0,0,0.45)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              מדריך חקירה · {completedSteps.size}/{INV_STEPS.length} הושלמו
            </div>
            {INV_STEPS.map(step => {
              const done = completedSteps.has(step.id);
              return (
                <div key={step.id} className="px-4 py-3 flex gap-3 items-start" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                    style={{ background: done ? "#0d9488" : "rgba(0,0,0,0.07)", color: done ? "#fff" : "rgba(0,0,0,0.3)" }}>
                    {done ? "✓" : step.num}
                  </div>
                  <div>
                    <div className="text-[11.5px] font-bold mb-0.5" style={{ color: done ? "#0d9488" : "rgba(0,0,0,0.65)" }}>{step.label}</div>
                    <div className="text-[10px] leading-relaxed" style={{ color: "rgba(0,0,0,0.38)" }}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evidence */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#fff" }}>
            <div className="px-4 py-2.5 text-[10px] font-bold"
              style={{ background: "rgba(13,148,136,0.04)", color: "rgba(0,0,0,0.45)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              ראיות שנאספו {evidence.length > 0 && `(${evidence.length})`}
            </div>
            {evidence.length === 0
              ? <div className="px-4 py-4 text-[11px]" style={{ color: "rgba(0,0,0,0.35)" }}>
                  הריצי שאילתות כדי לגלות ראיות. מדריך החקירה למעלה מראה מאיפה להתחיל.
                </div>
              : evidence.map((e, i) => (
                <div key={e.id} className="px-4 py-3" style={{ borderBottom: i < evidence.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[15px]">{e.icon}</span>
                    <span className="text-[11.5px] font-bold" style={{ color: "#0d9488" }}>{e.title}</span>
                  </div>
                  <div className="text-[10.5px] font-mono px-2 py-1 rounded mb-1.5"
                    style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.55)" }}>{e.finding}</div>
                  <div className="text-[11px] leading-relaxed mb-1.5" style={{ color: "rgba(0,0,0,0.52)" }}>{e.meaning}</div>
                  {e.next && (
                    <div className="text-[10.5px] px-2 py-1 rounded" style={{ background: "rgba(251,133,0,0.07)", color: "rgba(0,0,0,0.48)" }}>
                      💡 {e.next}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Accuse */}
          {evidence.length >= 2
            ? <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(192,57,43,0.25)", background: "#fff" }}>
                <div className="px-4 py-2.5 text-[10px] font-bold"
                  style={{ background: "rgba(192,57,43,0.05)", color: "#c0392b", borderBottom: "1px solid rgba(192,57,43,0.1)" }}>
                  מי ביצע את ההדלפה?
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {SUSPECTS.map(s => (
                    <button key={s.id} onClick={() => handleAccuse(s.id)}
                      className="text-right px-3 py-2.5 rounded-xl text-[12px] font-bold border"
                      style={{ borderColor: "rgba(192,57,43,0.2)", color: "#c0392b", background: "rgba(192,57,43,0.03)" }}>
                      {s.name}
                      <div className="text-[10px] font-normal mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>{s.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            : <div className="rounded-xl p-4 text-[11.5px]"
                style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.13)", color: "rgba(0,0,0,0.38)" }}>
                אספי לפחות 2 ראיות לפני שמאשימים...
              </div>}
        </div>
      </div>

      <div className="pb-[72px] md:pb-4" />
      <BottomNav />
    </div>
  );
}
