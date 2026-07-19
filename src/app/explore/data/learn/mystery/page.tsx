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

// ─── Hint messages based on query ─────────────────────────────────────────────
function getHint(sql: string): string | null {
  const up = sql.toUpperCase();
  if (up.includes("FROM EMPLOYEES") && !up.includes("WHERE"))
    return "💡 ראית את כל העובדים. עכשיו בדקי מי ניגש לטבלת המשתמשים: SELECT * FROM access_logs WHERE table_name = 'users'";
  if (up.includes("ACTION") && up.includes("EXPORT"))
    return "💡 מצאת מי ייצא נתונים. עכשיו בדקי אם הועבר קובץ גדול באותה תקופה: SELECT * FROM file_transfers WHERE file_size_mb > 1000";
  if (up.includes("FILE_SIZE_MB") && up.includes("1000"))
    return "💡 קובץ של 4.8GB הועבר ל-IP חיצוני. בדקי פגישות חיצוניות: SELECT * FROM meetings WHERE meeting_type = 'external'";
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
type Phase = "intro" | "investigate" | "accuse" | "reveal";

export default function MysteryPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<QResult | null>(null);
  const [history, setHistory] = useState<{ sql: string; result: QResult }[]>([]);
  const [clues, setClues] = useState<string[]>([]);
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

    // Detect clues
    const up = sql.toUpperCase();
    const newClues: string[] = [];

    if ("cols" in res) {
      if (up.includes("ACTION") && up.includes("EXPORT") && res.rows.some(r => r.action === "export" || r.action === "export")) {
        const who = res.rows.filter(r => String(r.action).toLowerCase() === "export");
        if (who.length > 0) newClues.push(`📤 יצוא נתונים: ${who.length} אירוע/ים מ-employee_id ${[...new Set(who.map(r => r.employee_id))].join(", ")}`);
      }
      if (up.includes("FILE_SIZE_MB") || (up.includes("FILE_TRANSFERS") && !up.includes("WHERE"))) {
        const big = res.rows.filter(r => (r.file_size_mb as number) > 1000);
        if (big.length > 0) newClues.push(`📦 העברת קובץ חשודה: ${big[0].file_size_mb}MB אל ${big[0].destination}`);
      }
      if (up.includes("MEETINGS") && res.rows.some(r => String(r.company).includes("DataRival"))) {
        const m = res.rows.filter(r => String(r.company).includes("DataRival"));
        newClues.push(`🤝 פגישות עם DataRival (מתחרה): ${m.length} פגישות, employee_id ${[...new Set(m.map(r => r.employee_id))].join(", ")}`);
      }
      if ((up.includes("JOIN") || up.includes("WHERE")) && res.rows.some(r => r.name === "יואב שפירא")) {
        newClues.push(`🔍 יואב שפירא מופיע בממצאים`);
      }
    }

    if (newClues.length > 0) {
      setClues(prev => {
        const merged = [...prev];
        newClues.forEach(c => { if (!merged.includes(c)) merged.push(c); });
        return merged;
      });
    }

    const h = getHint(sql);
    setHint(h);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  }

  function handleAccuse(id: number) {
    setAccusation(id);
    setPhase("reveal");
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "#0a0f1e" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-[680px] mx-auto w-full">
          <div className="text-[11px] font-bold tracking-widest mb-8" style={{ color: "rgba(13,148,136,0.7)" }}>
            TECHFLOW · TLV · 23:52
          </div>

          <div className="text-[28px] md:text-[36px] leading-tight text-white mb-6" style={HEEBO}>
            פרשת הדלפת הנתונים
          </div>

          <div className="text-[15px] leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
            יום שלישי, 23:47. קיבלת הודעת חירום מהמנכ"ל של TechFlow:<br /><br />
            <span style={{ color: "rgba(255,255,255,0.9)", fontStyle: "italic" }}>
              "מסד הנתונים שלנו הודלף לחברת DataRival — 50,000 לקוחות, כולל פרטי תשלום.
              המשטרה מגיעה בבוקר. אני צריך לדעת מי עשה את זה עד אז."
            </span>
          </div>

          <div className="rounded-2xl p-5 w-full mb-8" style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.25)" }}>
            <div className="text-[12px] font-bold mb-3" style={{ color: "#0d9488" }}>הגישה שקיבלת:</div>
            <div className="grid grid-cols-2 gap-3">
              {SCHEMA.map(s => (
                <div key={s.table} className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span className="font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{s.table}</span>
                  <br />{s.cols.join(", ")}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[13px] mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            תכתבי שאילתות SQL כדי לחקור את ה-DB. כשתמצאי מספיק ראיות — תאשימי.
          </div>

          <button
            onClick={() => setPhase("investigate")}
            className="w-full py-4 rounded-xl text-white font-bold text-[16px]"
            style={{ background: "#0d9488", ...HEEBO }}
          >
            קבלי גישה למערכות ←
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
        <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[26px] shrink-0">
          <div className="max-w-[680px] mx-auto">
            <div className="text-[20px] font-bold" style={HEEBO}>
              {correct ? "✓ גילית את האשם" : "✗ לא בדיוק..."}
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-[680px] mx-auto w-full px-[22px] md:px-0 py-8 flex flex-col gap-6">
          {/* Verdict */}
          <div className="rounded-2xl p-5" style={{
            background: correct ? "rgba(111,191,138,0.1)" : "rgba(192,57,43,0.08)",
            border: `1.5px solid ${correct ? "#6fbf8a" : "#c0392b"}`,
          }}>
            <div className="text-[15px] font-bold mb-2" style={{ color: correct ? "#2e7d46" : "#c0392b" }}>
              {correct ? "כל הכבוד — חשיבה אנליטית אמיתית!" : `האשם האמיתי היה יואב שפירא`}
            </div>
            <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.6)" }}>
              {correct
                ? "שילבת כמה מקורות מידע וזיהית את הדפוס. זה בדיוק מה שאנליסט דאטה עושה."
                : "קרוב, אבל חסרה ראייה מקשרת. ראי למטה את השרשרת המלאה."}
            </div>
          </div>

          {/* The evidence chain */}
          <div>
            <div className="text-[13px] font-bold mb-4" style={{ color: "rgba(0,0,0,0.55)" }}>שרשרת הראיות</div>
            <div className="flex flex-col gap-3">
              {[
                {
                  q: "SELECT * FROM access_logs WHERE action = 'export'",
                  finding: "יואב שפירא (employee_id: 5) ייצא את טבלת users פעמיים — ב-22:30 וב-23:58",
                  icon: "📤",
                },
                {
                  q: "SELECT * FROM file_transfers WHERE file_size_mb > 1000",
                  finding: "העברה של 4,823MB אל IP חיצוני (185.220.101.42) ב-00:03 — דקות אחרי הייצוא",
                  icon: "📦",
                },
                {
                  q: "SELECT * FROM meetings WHERE company = 'DataRival Ltd'",
                  finding: "שתי פגישות עם DataRival (המתחרה הישירה) בשבוע שלפני ההדלפה",
                  icon: "🤝",
                },
                {
                  q: "SELECT e.name FROM employees e JOIN access_logs a ON e.id = a.employee_id WHERE a.action = 'export'",
                  finding: "השאילתה הזו מחברת הכל — רק יואב שפירא מופיע בכל שלושת הממצאים",
                  icon: "🔍",
                },
              ].map((step, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)" }}>
                  <div className="flex items-start gap-3">
                    <div className="text-[20px] shrink-0">{step.icon}</div>
                    <div>
                      <div className="text-[11px] font-mono mb-1 px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.06)", color: "#0d9488" }}>
                        {step.q}
                      </div>
                      <div className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.65)" }}>{step.finding}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What we learned */}
          <div className="rounded-xl p-4" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
            <div className="text-[12px] font-bold mb-2" style={{ color: "#023e8a" }}>מה למדת?</div>
            <div className="text-[12.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
              בחקירה אמיתית, אנליסט דאטה לא מסתמך על מקור אחד. כאן נדרשו שלוש טבלאות שונות + JOIN כדי לזהות את הדפוס. כל ראיה בפני עצמה אינה מספיקה — יואב יכל היה לייצא לצרכים לגיטימיים, ה-IP יכל היה להיות שרת חברה. רק שילוב הכל יחד מוביל למסקנה.
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase("investigate"); setAccusation(null); }}
              className="flex-1 py-3 rounded-xl font-bold text-[14px] border"
              style={{ borderColor: "rgba(2,62,138,0.2)", color: "#023e8a" }}
            >
              חקרי שוב
            </button>
            <Link href="/explore/data/learn" className="flex-1">
              <button className="w-full py-3 rounded-xl font-bold text-[14px] text-white"
                style={{ background: "#023e8a" }}>
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
      <div className="px-[22px] md:px-12 pt-[20px] pb-[16px] shrink-0" style={{ background: "#0a0f1e" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/explore/data/learn" className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              ← חזרה
            </Link>
            <div className="text-[11px] font-bold tracking-widest" style={{ color: "rgba(13,148,136,0.7)" }}>
              TECHFLOW · חקירה פעילה
            </div>
          </div>
          <div className="text-[18px] font-bold text-white mt-2" style={HEEBO}>
            פרשת הדלפת הנתונים
          </div>
          <div className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            כתבי SQL לחקור · Ctrl+Enter להרצה · {clues.length} רמז{clues.length !== 1 ? "ים" : ""} נמצאו
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-[22px] md:px-0 py-5 flex flex-col md:flex-row gap-5 md:items-start">
        {/* Left: Editor + Results */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Schema reference */}
          <div className="rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-2"
            style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
            {SCHEMA.map(s => (
              <div key={s.table}>
                <div className="text-[11px] font-bold" style={{ color: "#0d9488" }}>{s.table}</div>
                <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.45)" }}>{s.cols.join(", ")}</div>
              </div>
            ))}
          </div>

          {/* SQL editor */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(13,148,136,0.3)" }}>
            <div className="px-3 py-1.5 text-[10px] font-bold"
              style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488" }}>
              SQL EDITOR · כתבי את השאילתה שלך
            </div>
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder={"SELECT * FROM employees"}
              className="w-full px-4 py-3 text-[13px] font-mono resize-none outline-none"
              style={{ background: "#fff", color: "#1c1c1c", direction: "ltr" }}
              dir="ltr"
            />
            <div className="px-3 py-2 flex justify-between items-center"
              style={{ background: "rgba(13,148,136,0.04)" }}>
              <div className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>Ctrl+Enter להרצה</div>
              <button
                onClick={handleRun}
                disabled={!sql.trim()}
                className="px-4 py-1.5 rounded-lg text-white text-[12px] font-bold disabled:opacity-40"
                style={{ background: "#0d9488" }}
              >
                ▶ הרץ
              </button>
            </div>
          </div>

          {/* Hint */}
          {hint && (
            <div className="rounded-xl px-4 py-3 text-[12px]"
              style={{ background: "rgba(251,133,0,0.07)", border: "1px solid rgba(251,133,0,0.2)", color: "rgba(0,0,0,0.6)" }}>
              {hint}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <div className="px-3 py-1.5 text-[10px] font-bold"
                style={{ background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.45)" }}>
                תוצאה
              </div>
              <div className="p-3">
                {"error" in result
                  ? <div className="text-[12px] font-mono" style={{ color: "#c0392b" }}>שגיאה: {result.error}</div>
                  : <ResultTable cols={result.cols} rows={result.rows} />}
              </div>
            </div>
          )}

          {/* Query history */}
          {history.length > 1 && (
            <div>
              <div className="text-[11px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.4)" }}>היסטוריה</div>
              <div className="flex flex-col gap-1">
                {history.slice(1, 5).map((h, i) => (
                  <button key={i} onClick={() => { setSql(h.sql); setResult(h.result); }}
                    className="text-[11px] font-mono text-right px-3 py-1.5 rounded-lg truncate"
                    style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.5)", direction: "ltr" }}>
                    {h.sql}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Clues + Accuse */}
        <div className="md:w-[260px] flex flex-col gap-4 shrink-0">
          {/* Clues */}
          <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
            <div className="text-[12px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.55)" }}>
              רמזים שנאספו {clues.length > 0 && `(${clues.length})`}
            </div>
            {clues.length === 0
              ? <div className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.35)" }}>
                  עדיין אין ממצאים. הריצי שאילתות לגלות ראיות.
                </div>
              : <div className="flex flex-col gap-2">
                  {clues.map((c, i) => (
                    <div key={i} className="text-[11.5px] leading-relaxed px-2 py-1.5 rounded-lg"
                      style={{ background: "rgba(13,148,136,0.07)", color: "rgba(0,0,0,0.65)" }}>
                      {c}
                    </div>
                  ))}
                </div>}
          </div>

          {/* Accuse */}
          {clues.length >= 2 && (
            <div className="rounded-xl p-4" style={{ background: "#fff", border: "1.5px solid rgba(192,57,43,0.2)" }}>
              <div className="text-[12px] font-bold mb-3" style={{ color: "#c0392b" }}>
                מי ביצע את ההדלפה?
              </div>
              <div className="flex flex-col gap-2">
                {SUSPECTS.map(s => (
                  <button key={s.id} onClick={() => handleAccuse(s.id)}
                    className="text-right px-3 py-2.5 rounded-xl text-[12.5px] font-bold border transition-all"
                    style={{
                      borderColor: "rgba(192,57,43,0.2)",
                      color: "#c0392b",
                      background: "rgba(192,57,43,0.03)",
                    }}>
                    {s.name}
                    <div className="text-[10px] font-normal" style={{ color: "rgba(0,0,0,0.4)" }}>{s.role}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {clues.length < 2 && (
            <div className="rounded-xl p-4 text-[12px]"
              style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.4)" }}>
              אסופי עוד ראיות לפני שתאשימי מישהו...
            </div>
          )}
        </div>
      </div>

      <div className="pb-[72px] md:pb-4" />
      <BottomNav />
    </div>
  );
}
