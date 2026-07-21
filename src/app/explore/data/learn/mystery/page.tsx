"use client";
import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────
type Val = string | number | null;
type Row = Record<string, Val>;
type DB  = Record<string, Row[]>;
type QResult = { cols: string[]; rows: Row[] } | { error: string };
type Phase = "intro" | "step1" | "step2" | "step3" | "step4" | "reveal";

// ─── Mini SQL Engine ──────────────────────────────────────────────────────────
function prefixRow(row: Row, alias: string): Row {
  const out: Row = {};
  for (const k of Object.keys(row)) out[`${alias}.${k}`] = row[k];
  return out;
}
function getVal(row: Row, key: string): Val {
  if (key in row) return row[key];
  // fallback: "last_login" matches "employees.last_login"
  const found = Object.keys(row).find(k => k.endsWith("." + key));
  return found !== undefined ? row[found] : null;
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
    case ">":  return typeof lv === "string" && typeof rv === "string" ? lv > rv : (lv as number) > (rv as number);
    case "<":  return typeof lv === "string" && typeof rv === "string" ? lv < rv : (lv as number) < (rv as number);
    case ">=": return typeof lv === "string" && typeof rv === "string" ? lv >= rv : (lv as number) >= (rv as number);
    case "<=": return typeof lv === "string" && typeof rv === "string" ? lv <= rv : (lv as number) <= (rv as number);
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
    if (iFrom < 0) throw new Error("חסרה מילת FROM");
    const joinMatch = up.match(/\b(INNER |LEFT )?JOIN\b/);
    const iJoin  = joinMatch ? up.indexOf(joinMatch[0]) : -1;
    const iOn    = iJoin >= 0 ? up.indexOf(" ON ", iJoin) : -1;
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
    if (!db[mainTable]) throw new Error(`טבלה לא נמצאה: "${mainTable}". הזמינות: ${Object.keys(db).join(", ")}`);
    let rows: Row[] = db[mainTable].map(r => prefixRow(r, mainAlias));
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
        return joinRows.filter(jr => {
          const v1 = getVal(mainRow, onL.trim()), v2 = getVal(jr, onR.trim());
          if (v1 !== null && v2 !== null) return v1 === v2;
          const v3 = getVal(mainRow, onR.trim()), v4 = getVal(jr, onL.trim());
          if (v3 !== null && v4 !== null) return v3 === v4;
          return false;
        }).map(jr => ({ ...mainRow, ...jr }));
      });
    }
    const whereEnd = [iOrder, iLimit].find(x => x > 0) ?? sql.length;
    if (iWhere >= 0) {
      const whereStr = sql.slice(iWhere + 7, whereEnd).trim().toLowerCase();
      rows = rows.filter(r => evalWhere(whereStr, r));
    }
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
    if (iLimit >= 0) {
      const n = parseInt(sql.slice(iLimit + 7).trim());
      if (!isNaN(n)) rows = rows.slice(0, n);
    }
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
    { id: 2, employee_id: 2, file_size_mb: 12,   destination: "gmail.com",        timestamp: "2024-01-07 16:30" },
    { id: 3, employee_id: 3, file_size_mb: 8,    destination: "drive.google.com", timestamp: "2024-01-07 09:45" },
    { id: 4, employee_id: 1, file_size_mb: 245,  destination: "github.com",       timestamp: "2024-01-08 00:15" },
    { id: 5, employee_id: 6, file_size_mb: 3,    destination: "drive.google.com", timestamp: "2024-01-07 14:35" },
  ],
  meetings: [
    { id: 1, employee_id: 5, meeting_type: "external", company: "DataRival Ltd",    date: "2024-01-05" },
    { id: 2, employee_id: 2, meeting_type: "external", company: "Creative Agency",   date: "2024-01-06" },
    { id: 3, employee_id: 7, meeting_type: "external", company: "Accountant Office", date: "2024-01-04" },
    { id: 4, employee_id: 1, meeting_type: "internal", company: "TechFlow",          date: "2024-01-08" },
    { id: 5, employee_id: 5, meeting_type: "external", company: "DataRival Ltd",     date: "2024-01-02" },
    { id: 6, employee_id: 3, meeting_type: "internal", company: "TechFlow",          date: "2024-01-07" },
  ],
};

const CULPRIT_ID = 5;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      "#fbf9f5",
  navy:    "#023e8a",
  teal:    "#0d9488",
  orange:  "#fb8500",
  codeBg:  "#1e293b",
  codeTop: "#0f172a",
  codeFg:  "#e2e8f0",
  muted:   "rgba(0,0,0,0.48)",
  border:  "rgba(0,0,0,0.08)",
};

// ─── ResultTable ──────────────────────────────────────────────────────────────
function ResultTable({ cols, rows }: { cols: string[]; rows: Row[] }) {
  if (rows.length === 0)
    return (
      <div className="text-[12px] text-center py-5 rounded-xl"
           style={{ background: "rgba(0,0,0,0.03)", color: T.muted, border: `1px solid ${T.border}` }}>
        אין תוצאות — 0 שורות
      </div>
    );
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] border-collapse min-w-max">
          <thead>
            <tr style={{ background: "rgba(13,148,136,0.08)" }}>
              {cols.map(c => (
                <th key={c} className="text-right px-3 py-2 font-bold border-b"
                  style={{ borderColor: "rgba(13,148,136,0.15)", color: T.teal, whiteSpace: "nowrap" }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isExport   = r["action"] === "export";
              const isBigFile  = typeof r["file_size_mb"] === "number" && (r["file_size_mb"] as number) > 1000;
              const isRival    = r["company"] === "DataRival Ltd";
              const suspicious = isExport || isBigFile || isRival;
              return (
                <tr key={i} style={{
                  background: suspicious
                    ? "rgba(251,133,0,0.06)"
                    : i % 2 === 0 ? "transparent" : "rgba(13,148,136,0.02)"
                }}>
                  {cols.map(c => (
                    <td key={c} className="px-3 py-2 border-b"
                      style={{
                        borderColor: "rgba(0,0,0,0.05)",
                        whiteSpace: "nowrap",
                        color:      suspicious ? T.orange : "#1c1c1c",
                        fontWeight: suspicious ? 700 : 400,
                      }}>
                      {r[c] === null
                        ? <span style={{ color: "rgba(0,0,0,0.3)" }}>NULL</span>
                        : String(r[c])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] px-3 py-2 text-right" style={{ color: T.muted }}>
        {rows.length} שורות
      </div>
    </div>
  );
}

// ─── StepProgress ─────────────────────────────────────────────────────────────
function StepProgress({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = [
    { num: 1, label: "SELECT" },
    { num: 2, label: "WHERE" },
    { num: 3, label: "JOIN" },
    { num: 4, label: "שאילתה מלאה" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 py-5">
      {steps.map((s, i) => {
        const done   = s.num < current;
        const active = s.num === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all"
              style={{
                background: active ? T.teal : done ? "rgba(13,148,136,0.1)" : "rgba(0,0,0,0.05)",
                color:      active ? "white" : done ? T.teal : "rgba(0,0,0,0.35)",
                border:     active ? "none" : done ? "1px solid rgba(13,148,136,0.25)" : `1px solid ${T.border}`,
              }}>
              {done ? "✓ " : `${s.num}. `}{s.label}
            </div>
            {i < 3 && (
              <div className="w-5 h-px" style={{ background: done ? T.teal : "rgba(0,0,0,0.12)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CodeBlock (illustrative, in narrative) ───────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  return (
    <div className="my-3 rounded-xl overflow-hidden" dir="ltr">
      <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px]"
           style={{ background: T.codeTop, color: "rgba(255,255,255,0.28)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color: "#4ade80" }}>●</span>
        <span style={{ color: "#fbbf24" }}>●</span>
        <span style={{ color: "#f87171" }}>●</span>
        <span className="mr-1">SQL</span>
      </div>
      <pre className="px-4 py-3 text-[13px] font-mono leading-relaxed overflow-x-auto m-0"
           style={{ background: T.codeBg, color: T.codeFg }}>
        {code}
      </pre>
    </div>
  );
}

// ─── SqlEditor ────────────────────────────────────────────────────────────────
function SqlEditor({
  value,
  onChange,
  onRun,
  readOnly = false,
  placeholder = "כתבי SQL כאן...",
  rows: textareaRows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  readOnly?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(13,148,136,0.3)" }}>
      <div className="flex items-center justify-between px-4 py-2.5"
           style={{ background: T.codeTop, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "#f87171" }}>●</span>
          <span style={{ color: "#fbbf24" }}>●</span>
          <span style={{ color: "#4ade80" }}>●</span>
          <span className="text-[11px] font-mono mr-1" style={{ color: "rgba(255,255,255,0.28)" }}>
            {readOnly ? "SQL — לחצי הרצי לראות תוצאות" : "SQL Editor — כתבי את השאילתה"}
          </span>
        </div>
        <button
          onClick={onRun}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95"
          style={{ background: T.teal, color: "white" }}>
          ▶ הרצי
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        dir="ltr"
        spellCheck={false}
        rows={textareaRows}
        className="w-full resize-none font-mono text-[13px] leading-relaxed outline-none p-4 block"
        style={{
          background:  T.codeBg,
          color:       T.codeFg,
          caretColor:  T.teal,
          cursor:      readOnly ? "default" : "text",
          minHeight:   "100px",
        }}
      />
    </div>
  );
}

// ─── JoinDiagram (visual for step 3) ─────────────────────────────────────────
function JoinDiagram() {
  return (
    <div className="rounded-xl p-3 my-3" style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)" }}>
      <div className="text-[11px] font-bold mb-2 text-center" style={{ color: T.muted }}>
        איך JOIN עובד:
      </div>
      <div className="flex items-stretch gap-2">
        {/* employees table */}
        <div className="flex-1 rounded-lg overflow-hidden text-[10.5px]" dir="ltr"
             style={{ border: `1px solid rgba(2,62,138,0.3)` }}>
          <div className="px-2 py-1.5 font-bold font-mono text-center"
               style={{ background: "rgba(2,62,138,0.1)", color: T.navy, borderBottom: "1px solid rgba(2,62,138,0.12)" }}>
            employees
          </div>
          <div className="px-2 py-1 font-mono font-bold text-[9.5px]"
               style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <span style={{ color: T.orange }}>id</span> | name
          </div>
          {[
            { id: 5, name: "יואב שפ'", hi: true },
            { id: 1, name: "דני לוי",  hi: false },
            { id: 2, name: "מיה כהן",  hi: false },
          ].map(r => (
            <div key={r.id} className="px-2 py-1 font-mono"
                 style={{ background: r.hi ? "rgba(13,148,136,0.07)" : "transparent", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <span style={{ color: T.orange, fontWeight: 700 }}>{r.id}</span> | {r.name}
            </div>
          ))}
        </div>

        {/* connector arrow */}
        <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 px-1">
          <div className="text-[9px] font-mono font-bold" style={{ color: T.teal }}>e.id</div>
          <div className="text-[20px] leading-none" style={{ color: T.teal }}>↔</div>
          <div className="text-[9px] font-mono font-bold text-center leading-tight" style={{ color: T.teal }}>emp_id</div>
        </div>

        {/* access_logs table */}
        <div className="flex-1 rounded-lg overflow-hidden text-[10.5px]" dir="ltr"
             style={{ border: `1px solid rgba(251,133,0,0.3)` }}>
          <div className="px-2 py-1.5 font-bold font-mono text-center"
               style={{ background: "rgba(251,133,0,0.1)", color: T.orange, borderBottom: "1px solid rgba(251,133,0,0.12)" }}>
            access_logs
          </div>
          <div className="px-2 py-1 font-mono font-bold text-[9.5px]"
               style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <span style={{ color: T.orange }}>emp_id</span> | action
          </div>
          {[
            { empId: 5, action: "export", hi: true },
            { empId: 5, action: "read",   hi: false },
            { empId: 1, action: "read",   hi: false },
          ].map((r, i) => (
            <div key={i} className="px-2 py-1 font-mono"
                 style={{ background: r.hi ? "rgba(251,133,0,0.08)" : "transparent", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <span style={{ color: T.orange, fontWeight: 700 }}>{r.empId}</span> |{" "}
              <span style={{ color: r.hi ? T.orange : "inherit", fontWeight: r.hi ? 700 : 400 }}>
                {r.action}{r.hi ? " ⚠️" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center text-[10px] mt-2.5 font-medium" style={{ color: T.teal }}>
        JOIN מחבר שורות שבהן employees.id = access_logs.employee_id
      </div>
    </div>
  );
}

// ─── Shared card wrapper ──────────────────────────────────────────────────────
function NCard({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: "navy" | "teal" | "orange";
}) {
  const borderLeft =
    accent === "navy"   ? `3px solid ${T.navy}` :
    accent === "teal"   ? `3px solid ${T.teal}` :
    accent === "orange" ? `3px solid ${T.orange}` : "none";
  return (
    <div className="rounded-xl p-5"
         style={{ background: "white", borderLeft, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      {children}
    </div>
  );
}

// ─── Step layout (narrative left, editor right) ───────────────────────────────
function StepLayout({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-5 mt-2">
      <div className="lg:w-[370px] shrink-0 flex flex-col gap-4">{left}</div>
      <div className="flex-1 flex flex-col gap-4">{right}</div>
    </div>
  );
}

// ─── INTRO PHASE ──────────────────────────────────────────────────────────────
function IntroPhase({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-[660px] mx-auto py-8 flex flex-col gap-5">

      {/* Case file card */}
      <NCard accent="navy">
        <div className="text-[11px] font-bold mb-3 flex items-center gap-2"
             style={{ color: T.orange }}>
          <span>● אירוע פעיל</span>
          <span style={{ color: "rgba(0,0,0,0.2)" }}>|</span>
          <span style={{ color: T.muted }}>תיק #2024-0108 · ת״א · 03:00</span>
        </div>
        <div className="text-[22px] font-black mb-3 leading-tight"
             style={{ fontFamily: "'Noto Serif Hebrew', serif", color: T.navy }}>
          מי גנב את הנתונים?
        </div>
        <p className="text-[14px] leading-relaxed" style={{ color: "#2c2c2c" }}>
          ה-CEO של TechFlow קיבל את הטלפון ב-3 לפנות בוקר.{" "}
          מישהו מהעובדים העביר <strong>4.8 ג&apos;יגה-בייט</strong> של נתוני לקוחות לכתובת IP לא מוכרת.
        </p>
        <p className="text-[14px] leading-relaxed mt-2" style={{ color: "#2c2c2c" }}>
          &quot;מצאי את האחראי,&quot; הוא אמר. &quot;עד הבוקר.&quot;
        </p>
        <p className="text-[14px] leading-relaxed mt-2" style={{ color: "#2c2c2c" }}>
          יש לך גישה למסוף הנתונים הפנימי של החברה. המידע מסודר בטבלאות — כמו גיליונות אקסל שמחוברים אחד לשני.
          כדי לחקור, תכתבי <strong>SQL</strong>.
        </p>
      </NCard>

      {/* SQL explanation — inline in narrative */}
      <NCard accent="teal">
        <div className="text-[13px] font-black mb-2" style={{ color: T.teal }}>
          SQL — מה זה ולמה זה עוצמתי?
        </div>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
          SQL זה שפה לשאול שאלות לנתונים. כמו שגוגל מחזיר תוצאות לחיפוש — SQL מחזיר שורות מטבלה.
        </p>
        <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: "#2c2c2c" }}>
          למשל, הסוכנת פתחה את המסוף וכתבה:
        </p>
        <CodeBlock code={"SELECT * FROM employees"} />
        <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
          <strong>SELECT</strong> = &quot;תביאי לי&quot;.{" "}
          <strong>*</strong> = &quot;את הכל&quot;.{" "}
          <strong>FROM employees</strong> = &quot;מהטבלה employees&quot;.
        </p>
        <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: "#2c2c2c" }}>
          3 מילים. תשובה מיידית: שמות 8 העובדים, מחלקות, רמות גישה — הכל.
        </p>
      </NCard>

      {/* Step overview */}
      <div className="rounded-xl p-4"
           style={{ background: "rgba(2,62,138,0.04)", border: `1px solid rgba(2,62,138,0.12)` }}>
        <div className="text-[12px] font-bold mb-3" style={{ color: T.navy }}>
          בארבעה שלבים תחקרי כמו אנליסטית:
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { step: 1, label: "SELECT", desc: "שאלי את הטבלה הראשונה" },
            { step: 2, label: "WHERE",  desc: "סנני לפי תנאים" },
            { step: 3, label: "JOIN",   desc: "חברי בין טבלאות" },
            { step: 4, label: "שאילתה מלאה", desc: "הגישי את ההאשמה" },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-2.5 p-2.5 rounded-lg"
                 style={{ background: "white", border: `1px solid ${T.border}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                   style={{ background: T.teal, color: "white" }}>
                {s.step}
              </div>
              <div>
                <div className="text-[11px] font-black" style={{ color: T.navy }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: T.muted }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-4 rounded-xl text-[15px] font-black transition-all active:scale-98"
        style={{ background: T.navy, color: "white" }}>
        כנסי לחדר החקירות ←
      </button>
    </div>
  );
}

// ─── STEP 1: SELECT ───────────────────────────────────────────────────────────
function Step1Phase({ onNext }: { onNext: () => void }) {
  const defaultSql = "SELECT * FROM employees";
  const [sql, setSql]       = useState(defaultSql);
  const [result, setResult] = useState<QResult | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  const ran     = result !== null && !("error" in result);
  const correct = answer === "Data";

  function handleRun() {
    setResult(runSQL(sql, DB));
  }

  return (
    <>
      <StepProgress current={1} />
      <StepLayout
        left={
          <>
            <NCard accent="navy">
              <div className="text-[12px] font-black mb-1" style={{ color: T.teal }}>שלב 1 — SELECT</div>
              <div className="text-[17px] font-black mb-3" style={{ color: T.navy }}>
                מפי את השחקנים
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
                הסוכנת נכנסה למסוף. &quot;תחילי מהבסיס,&quot; היא חשבה. &quot;מי בכלל עובד כאן?&quot;
              </p>
              <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: "#2c2c2c" }}>
                היא כתבה שאילתה:
              </p>
              <CodeBlock code={"SELECT * FROM employees"} />
              <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
                ושמות כל העובדים הופיעו על המסך — שם, מחלקה, רמת גישה.
              </p>
            </NCard>

            <div className="rounded-xl p-4"
                 style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
              <div className="text-[11px] font-bold mb-2" style={{ color: T.teal }}>פירוק השאילתה:</div>
              <div className="flex flex-col gap-1.5 text-[12px] font-mono">
                {[
                  { kw: "SELECT", def: "תביאי לי (את הנתונים)" },
                  { kw: "*",      def: "הכל (כל העמודות)" },
                  { kw: "FROM",   def: "מ..." },
                  { kw: "employees", def: "שם הטבלה" },
                ].map(item => (
                  <div key={item.kw} className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-bold text-[11px] min-w-[80px] text-center"
                          style={{ background: "rgba(2,62,138,0.1)", color: T.navy }}>
                      {item.kw}
                    </span>
                    <span style={{ color: T.muted }}>= {item.def}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        }
        right={
          <>
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={handleRun}
              readOnly
            />

            {result && "error" in result && (
              <div className="rounded-xl p-3 text-[12px]"
                   style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
                שגיאה: {result.error}
              </div>
            )}

            {ran && !("error" in result) && (
              <>
                <ResultTable cols={result.cols} rows={result.rows} />

                {/* Quiz */}
                <div className="rounded-xl p-4"
                     style={{ background: "white", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div className="text-[13px] font-bold mb-3" style={{ color: T.navy }}>
                    מצאת {result.rows.length} עובדים. איזו מחלקה עוסקת ישירות בנתונים?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Engineering", "Marketing", "Data", "HR"].map(d => (
                      <button
                        key={d}
                        onClick={() => setAnswer(d)}
                        className="px-4 py-2 rounded-lg text-[12px] font-bold transition-all"
                        style={{
                          background: answer === d
                            ? (d === "Data" ? T.teal : "rgba(239,68,68,0.1)")
                            : "rgba(0,0,0,0.04)",
                          color: answer === d
                            ? (d === "Data" ? "white" : "#dc2626")
                            : "#2c2c2c",
                          border: answer === d
                            ? (d === "Data" ? "none" : "1px solid rgba(239,68,68,0.3)")
                            : `1px solid ${T.border}`,
                        }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  {correct && (
                    <div className="mt-3 text-[12.5px] leading-relaxed"
                         style={{ color: T.teal }}>
                      בדיוק — מחלקת <strong>Data</strong> מטפלת בנתונים הרגישים ביותר.
                      עובד אחד שם: <strong>יואב שפירא</strong>. כדאי להכיר אותו.
                    </div>
                  )}
                </div>

                {correct && (
                  <button onClick={onNext}
                    className="w-full py-3.5 rounded-xl text-[14px] font-black transition-all active:scale-98"
                    style={{ background: T.teal, color: "white" }}>
                    שלב הבא — WHERE ←
                  </button>
                )}
              </>
            )}
          </>
        }
      />
    </>
  );
}

// ─── STEP 2: WHERE ────────────────────────────────────────────────────────────
function Step2Phase({ onNext }: { onNext: () => void }) {
  const defaultSql = "SELECT name, last_login\nFROM employees\nWHERE last_login > '2024-01-07 22:00'";
  const [sql, setSql]       = useState(defaultSql);
  const [result, setResult] = useState<QResult | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);

  const ran     = result !== null && !("error" in result);
  const correct = answer === 2;

  function handleRun() {
    setResult(runSQL(sql, DB));
  }

  return (
    <>
      <StepProgress current={2} />
      <StepLayout
        left={
          <>
            <NCard accent="teal">
              <div className="text-[12px] font-black mb-1" style={{ color: T.teal }}>שלב 2 — WHERE</div>
              <div className="text-[17px] font-black mb-3" style={{ color: T.navy }}>
                מי התחבר בלילה?
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
                יואב שפירא — אנליסט דאטה. גישה לנתונים הרגישים ביותר.
                ה-CEO אמר שהדליפה הייתה לילה של ה-7 לינואר.
              </p>
              <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: "#2c2c2c" }}>
                הסוכנת הוסיפה סינון:
              </p>
              <CodeBlock code={"SELECT name, last_login\nFROM employees\nWHERE last_login > '2024-01-07 22:00'"} />
              <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
                <strong>WHERE</strong> זה &quot;בתנאי ש-&quot;. רק שורות שעומדות בתנאי יוחזרו.
              </p>
            </NCard>

            <div className="rounded-xl p-4"
                 style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
              <div className="text-[11px] font-bold mb-2" style={{ color: T.teal }}>מבנה WHERE:</div>
              <div className="font-mono text-[12px] px-3 py-2 rounded-lg mb-3"
                   style={{ background: "rgba(2,62,138,0.07)", color: T.navy }}>
                WHERE <span style={{ color: T.orange }}>עמודה</span>{" "}
                <span style={{ color: T.teal }}>&gt;</span>{" "}
                <span style={{ color: "#16a34a" }}>&apos;ערך&apos;</span>
              </div>
              <div className="text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
                אפשר גם: = (שווה), &lt; (קטן מ-), != (לא שווה).
                אפשר לשנות את הזמן בעורך ולהריץ שוב — תתנסי!
              </div>
            </div>
          </>
        }
        right={
          <>
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={handleRun}
              rows={5}
            />

            {result && "error" in result && (
              <div className="rounded-xl p-3 text-[12px]"
                   style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
                שגיאה: {result.error}
              </div>
            )}

            {ran && !("error" in result) && (
              <>
                <ResultTable cols={result.cols} rows={result.rows} />

                <div className="rounded-xl p-4"
                     style={{ background: "white", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div className="text-[13px] font-bold mb-3" style={{ color: T.navy }}>
                    כמה עובדים התחברו אחרי 22:00 בלילה?
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => setAnswer(n)}
                        className="w-12 h-10 rounded-lg text-[13px] font-black transition-all"
                        style={{
                          background: answer === n
                            ? (n === 2 ? T.teal : "rgba(239,68,68,0.1)")
                            : "rgba(0,0,0,0.04)",
                          color: answer === n
                            ? (n === 2 ? "white" : "#dc2626")
                            : "#2c2c2c",
                          border: answer === n
                            ? (n === 2 ? "none" : "1px solid rgba(239,68,68,0.3)")
                            : `1px solid ${T.border}`,
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  {correct && (
                    <div className="mt-3 text-[12.5px] leading-relaxed"
                         style={{ color: T.teal }}>
                      נכון — <strong>2 עובדים</strong> התחברו אחרי 22:00: דני לוי ויואב שפירא.
                      אבל מה הם <em>עשו</em> בפנים? לזה צריך עוד טבלה.
                    </div>
                  )}
                </div>

                {correct && (
                  <button onClick={onNext}
                    className="w-full py-3.5 rounded-xl text-[14px] font-black transition-all active:scale-98"
                    style={{ background: T.teal, color: "white" }}>
                    שלב הבא — JOIN ←
                  </button>
                )}
              </>
            )}
          </>
        }
      />
    </>
  );
}

// ─── STEP 3: JOIN ─────────────────────────────────────────────────────────────
function Step3Phase({ onNext }: { onNext: () => void }) {
  const defaultSql =
    "SELECT e.name, a.action, a.timestamp\nFROM employees e\nJOIN access_logs a ON e.id = a.employee_id\nWHERE a.timestamp > '2024-01-07 22:00'";
  const [sql, setSql]       = useState(defaultSql);
  const [result, setResult] = useState<QResult | null>(null);

  const [answer, setAnswer] = useState<string | null>(null);

  const ran = result !== null && !("error" in result);
  const foundExport = ran && !("error" in result) &&
    (result as { cols: string[]; rows: Row[] }).rows.some(r => r["action"] === "export");
  const correct = answer === "שיואב שפירא ייצא נתונים בחצות";

  function handleRun() {
    setResult(runSQL(sql, DB));
    setAnswer(null);
  }

  return (
    <>
      <StepProgress current={3} />
      <StepLayout
        left={
          <>
            <NCard accent="orange">
              <div className="text-[12px] font-black mb-1" style={{ color: T.orange }}>שלב 3 — JOIN</div>
              <div className="text-[17px] font-black mb-3" style={{ color: T.navy }}>
                הרגע שמשנה הכל
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
                ידענו שדני ויואב התחברו בלילה. אבל מה הם <em>עשו</em>?
                הפעולות נשמרות בטבלה נפרדת — <strong>access_logs</strong>.
              </p>
              <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: "#2c2c2c" }}>
                &quot;כאן SQL עושה מה שאקסל לא יכול,&quot; היא חשבה — וכתבה:
              </p>
              <CodeBlock code={"SELECT e.name, a.action, a.timestamp\nFROM employees e\nJOIN access_logs a ON e.id = a.employee_id\nWHERE a.timestamp > '2024-01-07 22:00'"} />
            </NCard>

            <div className="rounded-xl p-4"
                 style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: T.teal }}>מה קורה כאן?</div>
              <JoinDiagram />
              <div className="text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
                JOIN מחבר שורות לפי מספר משותף.
                כל שורה ב-access_logs יש לה employee_id —
                JOIN מצמיד אותה לשורת העובד המתאימה.
              </div>
            </div>
          </>
        }
        right={
          <>
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={handleRun}
              rows={6}
            />

            {result && "error" in result && (
              <div className="rounded-xl p-3 text-[12px]"
                   style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
                שגיאה: {result.error}
              </div>
            )}

            {ran && !("error" in result) && (
              <>
                <ResultTable
                  cols={(result as { cols: string[]; rows: Row[] }).cols}
                  rows={(result as { cols: string[]; rows: Row[] }).rows}
                />

                {foundExport && (
                  <div className="rounded-xl p-4"
                       style={{ background: "white", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div className="text-[13px] font-bold mb-3" style={{ color: T.navy }}>
                      מה גילה ה-JOIN שלא יכולת לראות בטבלת employees לבד?
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: "a", text: "שדני לוי קרא נתונים מסווגים" },
                        { id: "b", text: "שיואב שפירא ייצא נתונים בחצות" },
                        { id: "c", text: "שיש 3 עובדים חשודים בסה\"כ" },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => setAnswer(opt.text)}
                          className="text-right px-4 py-2.5 rounded-lg text-[12.5px] font-medium transition-all"
                          style={{
                            background: answer === opt.text
                              ? (correct ? "rgba(13,148,136,0.1)" : "rgba(239,68,68,0.06)")
                              : "rgba(0,0,0,0.03)",
                            color: answer === opt.text
                              ? (correct ? T.teal : "#dc2626")
                              : "#2c2c2c",
                            border: answer === opt.text
                              ? (correct ? "1px solid rgba(13,148,136,0.3)" : "1px solid rgba(239,68,68,0.25)")
                              : `1px solid ${T.border}`,
                          }}>
                          {opt.text}
                        </button>
                      ))}
                    </div>
                    {correct && (
                      <div className="mt-3 text-[12.5px] leading-relaxed pt-3"
                           style={{ color: T.teal, borderTop: "1px solid rgba(13,148,136,0.15)" }}>
                        בדיוק. שאילתה אחת חיברה שתי טבלאות בשנייה —
                        ומצאת את מה שאחרת היה לוקח שעות לאתר ידנית.
                        זו העוצמה של JOIN.
                      </div>
                    )}
                  </div>
                )}

                {foundExport && correct && (
                  <button onClick={onNext}
                    className="w-full py-3.5 rounded-xl text-[14px] font-black transition-all active:scale-98"
                    style={{ background: T.orange, color: "white" }}>
                    שלב הסופי — הגישי האשמה ←
                  </button>
                )}
              </>
            )}
          </>
        }
      />
    </>
  );
}

// ─── STEP 4: FULL QUERY ───────────────────────────────────────────────────────
type HintCard = { title: string; question: string; tip: string; template: string };

const HINT_CARDS: HintCard[] = [
  {
    title: "רמז 1 — איזו טבלה? 💭",
    question: "בטבלאות שיש לך, איפה נמצאת העמודה file_size_mb?",
    tip: "התחילי בלהביא את כל השורות מהטבלה שמכילה אותה:",
    template: "SELECT *\nFROM file_transfers",
  },
  {
    title: "רמז 2 — חברי שם + העברה 🔗",
    question: "רואה employee_id בטבלת file_transfers? זה הגשר לטבלת employees.",
    tip: "JOIN מחבר אותן כמו שלמדת בשלב 3:",
    template:
      "SELECT employees.name, file_transfers.file_size_mb, file_transfers.destination\nFROM employees\nJOIN file_transfers ON employees.id = file_transfers.employee_id",
  },
  {
    title: "רמז 3 — זווית נוספת 🤝",
    question: "מה אם הוא תיאם את הדליפה עם גורם חיצוני מראש?",
    tip: "בדקי פגישות חיצוניות — אותו עיקרון JOIN:",
    template:
      "SELECT employees.name, meetings.company, meetings.date\nFROM employees\nJOIN meetings ON employees.id = meetings.employee_id\nWHERE meetings.meeting_type = 'external'",
  },
];

function Step4Phase({ onReveal }: { onReveal: () => void }) {
  const [sql, setSql]         = useState("");
  const [result, setResult]   = useState<QResult | null>(null);
  const [hintsShown, setHintsShown] = useState(0);

  const ran = result !== null && !("error" in result);

  function isSuccess(r: QResult): boolean {
    if ("error" in r || r.rows.length === 0) return false;
    return r.rows.some(row =>
      row["destination"] === "185.220.101.42" ||
      row["company"] === "DataRival Ltd" ||
      row["file_size_mb"] === 4823
    );
  }

  const success = ran && isSuccess(result);

  function handleRun() {
    if (!sql.trim()) return;
    setResult(runSQL(sql, DB));
  }

  return (
    <>
      <StepProgress current={4} />
      <StepLayout
        left={
          <>
            <NCard accent="navy">
              <div className="text-[12px] font-black mb-1" style={{ color: T.navy }}>שלב 4 — שאילתה מלאה</div>
              <div className="text-[17px] font-black mb-3" style={{ color: T.navy }}>
                הגישי את ההאשמה
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "#2c2c2c" }}>
                יואב ייצא נתונים בחצות. אבל להאשמה צריך <em>הוכחות מוצקות</em>:
              </p>
              <ul className="mt-2 text-[13px] leading-loose" style={{ color: "#2c2c2c" }}>
                <li>כמה נתונים יצאו? (<code className="text-[11px] px-1 rounded" style={{ background: "rgba(0,0,0,0.06)" }}>file_transfers</code>)</li>
                <li>לאן? (<code className="text-[11px] px-1 rounded" style={{ background: "rgba(0,0,0,0.06)" }}>destination</code>)</li>
                <li>האם תיאם מבחוץ? (<code className="text-[11px] px-1 rounded" style={{ background: "rgba(0,0,0,0.06)" }}>meetings</code>)</li>
              </ul>
            </NCard>

            <div className="rounded-xl p-4"
                 style={{ background: "rgba(2,62,138,0.04)", border: `1px solid rgba(2,62,138,0.12)` }}>
              <div className="text-[11px] font-bold mb-2" style={{ color: T.navy }}>הטבלאות שיש לך:</div>
              <div className="flex flex-col gap-1.5 text-[11.5px] font-mono" style={{ color: T.muted }}>
                {[
                  { name: "employees",      cols: "id, name, department" },
                  { name: "access_logs",    cols: "employee_id, action, timestamp" },
                  { name: "file_transfers", cols: "employee_id, file_size_mb, destination" },
                  { name: "meetings",       cols: "employee_id, meeting_type, company" },
                ].map(t => (
                  <div key={t.name} className="flex gap-2">
                    <span className="font-bold" style={{ color: T.navy, minWidth: "110px" }}>{t.name}</span>
                    <span style={{ color: T.muted }}>{t.cols}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* hint cards — revealed one by one */}
            {HINT_CARDS.slice(0, hintsShown).map((h, i) => (
              <div key={i} className="rounded-xl p-4 flex flex-col gap-2"
                   style={{ background: "rgba(2,62,138,0.04)", border: `1px solid rgba(2,62,138,0.14)` }}>
                <div className="text-[12px] font-black" style={{ color: T.navy }}>{h.title}</div>
                <div className="text-[12.5px] font-medium" style={{ color: "#2c2c2c" }}>{h.question}</div>
                <div className="text-[11.5px]" style={{ color: T.muted }}>{h.tip}</div>
                <pre className="rounded-lg px-3 py-2 text-[11.5px] font-mono overflow-x-auto m-0"
                     style={{ background: T.codeBg, color: T.codeFg }}>{h.template}</pre>
                <button
                  onClick={() => setSql(h.template)}
                  className="self-start px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{ background: "rgba(2,62,138,0.1)", color: T.navy, border: `1px solid rgba(2,62,138,0.2)` }}>
                  טעני לעורך ←
                </button>
              </div>
            ))}

            {hintsShown < HINT_CARDS.length && (
              <button
                onClick={() => setHintsShown(h => h + 1)}
                className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-all"
                style={{ background: "rgba(2,62,138,0.06)", color: T.navy, border: `1px solid rgba(2,62,138,0.18)` }}>
                {hintsShown === 0 ? "תני לי רמז 💡" : "רמז נוסף 💡"}
              </button>
            )}
          </>
        }
        right={
          <>
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={handleRun}
              placeholder={"SELECT ...\nFROM ...\nJOIN ... ON ...\nWHERE ..."}
              rows={7}
            />

            {result && "error" in result && (
              <div className="rounded-xl p-4"
                   style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="text-[12px] font-bold mb-1" style={{ color: "#dc2626" }}>שגיאת SQL:</div>
                <div className="text-[12px] font-mono" style={{ color: "#dc2626" }}>{result.error}</div>
                <div className="text-[11.5px] mt-2" style={{ color: T.muted }}>
                  בדקי את שמות הטבלאות והעמודות — הן צריכות להיות זהות למה שמופיע בטבלה משמאל.
                </div>
              </div>
            )}

            {ran && !("error" in result) && (
              <ResultTable
                cols={(result as { cols: string[]; rows: Row[] }).cols}
                rows={(result as { cols: string[]; rows: Row[] }).rows}
              />
            )}

            {ran && !("error" in result) && !success && (
              <div className="rounded-xl p-3 text-[12.5px]"
                   style={{ background: "rgba(0,0,0,0.03)", border: `1px solid ${T.border}`, color: T.muted }}>
                קרוב... תחפשי נתונים שמצביעים על מישהו ספציפי.
                נסי לחפש העברות קבצים גדולות מאוד, או פגישות עם חברות מתחרות.
              </div>
            )}

            {success && (
              <div className="rounded-xl p-4"
                   style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.3)" }}>
                <div className="text-[14px] font-black mb-1" style={{ color: T.teal }}>
                  מצאת את ההוכחה!
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "#2c2c2c" }}>
                  SQL חיבר את כל הנקודות בשאילתה אחת — מה שהיה לוקח שעות בידני
                  נמצא תוך שניות.
                </p>
              </div>
            )}

            {success && (
              <button onClick={onReveal}
                className="w-full py-3.5 rounded-xl text-[14px] font-black transition-all active:scale-98"
                style={{ background: T.navy, color: "white" }}>
                גלי מי האשם ←
              </button>
            )}
          </>
        }
      />
    </>
  );
}

// ─── REVEAL PHASE ─────────────────────────────────────────────────────────────
function RevealPhase() {
  const culprit = DB.employees.find(e => e.id === CULPRIT_ID)!;
  const transfers = DB.file_transfers.filter(f => f.employee_id === CULPRIT_ID);
  const meetings  = DB.meetings.filter(m => m.employee_id === CULPRIT_ID && m.meeting_type === "external");

  return (
    <div className="max-w-[620px] mx-auto py-8 flex flex-col gap-5">
      {/* Verdict */}
      <div className="rounded-2xl p-6 text-center"
           style={{ background: T.navy, color: "white" }}>
        <div className="text-[13px] opacity-60 mb-2">תיק #2024-0108 — תוצאה</div>
        <div className="text-[28px] font-black mb-1"
             style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
          {String(culprit.name)}
        </div>
        <div className="text-[14px] opacity-75 mb-4">{String(culprit.department)} — {String(culprit.access_level)}</div>
        <div className="inline-block px-4 py-1.5 rounded-full text-[12px] font-bold"
             style={{ background: T.orange }}>
          מורשע בגניבת נתונים
        </div>
      </div>

      {/* Evidence */}
      <NCard accent="orange">
        <div className="text-[13px] font-black mb-3" style={{ color: T.orange }}>ראיות שמצאת:</div>
        <div className="flex flex-col gap-3">
          {transfers.map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] shrink-0"
                   style={{ background: "rgba(251,133,0,0.12)" }}>📤</div>
              <div>
                <div className="text-[13px] font-bold" style={{ color: "#1c1c1c" }}>
                  העביר {String(t.file_size_mb)} MB ל-{String(t.destination)}
                </div>
                <div className="text-[11px]" style={{ color: T.muted }}>{String(t.timestamp)}</div>
              </div>
            </div>
          ))}
          {meetings.map((m, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] shrink-0"
                   style={{ background: "rgba(251,133,0,0.12)" }}>🤝</div>
              <div>
                <div className="text-[13px] font-bold" style={{ color: "#1c1c1c" }}>
                  פגישה חיצונית עם {String(m.company)}
                </div>
                <div className="text-[11px]" style={{ color: T.muted }}>{String(m.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </NCard>

      {/* SQL recap */}
      <div className="rounded-xl p-4"
           style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.2)" }}>
        <div className="text-[13px] font-black mb-2" style={{ color: T.teal }}>מה למדת:</div>
        <div className="flex flex-col gap-2">
          {[
            { kw: "SELECT", desc: "בחרי אילו עמודות להציג" },
            { kw: "WHERE",  desc: "סנני לפי תנאים" },
            { kw: "JOIN",   desc: "חברי נתונים משתי טבלאות" },
          ].map(item => (
            <div key={item.kw} className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded font-bold font-mono text-[11px] shrink-0"
                    style={{ background: "rgba(13,148,136,0.1)", color: T.teal }}>
                {item.kw}
              </span>
              <span className="text-[12.5px]" style={{ color: "#2c2c2c" }}>{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="text-[12.5px] mt-3 pt-3 leading-relaxed"
             style={{ color: "#2c2c2c", borderTop: `1px solid rgba(13,148,136,0.15)` }}>
          עם 3 מושגים בלבד ניתחת מאגר נתונים שלם וזיהית עבריין — זו העוצמה של SQL.
        </div>
      </div>

      <Link href="/explore/data/learn"
        className="block w-full py-3.5 rounded-xl text-[14px] font-black text-center transition-all"
        style={{ background: T.teal, color: "white" }}>
        חזרה למרכז למידה ←
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MysteryPage() {
  const [phase, setPhase] = useState<Phase>("intro");

  return (
    <div dir="rtl" style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Heebo', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: T.navy }}>
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/explore/data/learn"
            className="text-[12px] transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            ← חזרה
          </Link>
          <div className="text-[13px] font-bold" style={{ color: "white" }}>
            חקירת SQL — TechFlow Security
          </div>
          <div className="text-[11px] font-bold" style={{ color: T.orange }}>
            ● תיק #2024-0108
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[960px] mx-auto px-4 pb-28">
        {phase === "intro"   && <IntroPhase  onStart={() => setPhase("step1")} />}
        {phase === "step1"   && <Step1Phase  onNext={() => setPhase("step2")} />}
        {phase === "step2"   && <Step2Phase  onNext={() => setPhase("step3")} />}
        {phase === "step3"   && <Step3Phase  onNext={() => setPhase("step4")} />}
        {phase === "step4"   && <Step4Phase  onReveal={() => setPhase("reveal")} />}
        {phase === "reveal"  && <RevealPhase />}
      </div>

      <BottomNav />
    </div>
  );
}
