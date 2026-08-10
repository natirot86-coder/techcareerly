"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const RED = "#dc2626";
const NAVY = "#023e8a";

// ─── Phase order ──────────────────────────────────────────────────────────────

type Phase = "career" | "intro" | "priority" | "logs" | "toggles" | "terminal" | "postmortem" | "done";
const INTERACTIVE: Phase[] = ["priority", "logs", "toggles", "terminal", "postmortem"];

function phaseNum(p: Phase) { return INTERACTIVE.indexOf(p) + 1; }

// ─── Shared UI ────────────────────────────────────────────────────────────────

function GlossaryChip({ term, explanation }: { term: string; explanation: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block mb-1 mr-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
        style={{ background: open ? "rgba(220,38,38,0.14)" : "rgba(220,38,38,0.08)", border: `1px solid rgba(220,38,38,${open ? 0.3 : 0.18})`, color: RED, fontFamily: "monospace" }}
      >
        {term}
        <span style={{ fontSize: 9, fontFamily: "'Heebo', sans-serif", opacity: 0.65 }}>{open ? "▲" : "?"}</span>
      </button>
      {open && (
        <div className="rounded-xl px-3 py-2.5 mt-1.5 text-[12px] leading-[1.65]"
          style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.15)", color: "rgba(0,0,0,0.7)" }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

function RevealCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(220,38,38,0.18)" }}>
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3 text-right"
        style={{ background: open ? "rgba(220,38,38,0.06)" : "#fff" }}
        onClick={() => setOpen(!open)}>
        <span className="text-[20px]">{emoji}</span>
        <span className="text-[13px] font-bold flex-1" style={{ color: NAVY, ...HEEBO }}>{title}</span>
        <span style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12.5px] leading-[1.75]"
          style={{ color: "rgba(0,0,0,0.65)", background: "rgba(220,38,38,0.03)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function VideoEmbed({ id, label }: { id: string; label: string }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
      <div className="px-4 py-2.5" style={{ background: "rgba(0,0,0,0.04)" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>🎥 סרטון בעברית</div>
        <div className="text-[12px] font-bold" style={{ color: NAVY }}>{label}</div>
      </div>
      <div className="relative" style={{ paddingTop: "56.25%" }}>
        <iframe src={`https://www.youtube.com/embed/${id}`} title={label} allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} />
      </div>
    </div>
  );
}

function TerminalCard({ lines }: { lines: { text: string; color?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
      <div className="flex items-center gap-[6px] px-4 py-[9px]" style={{ background: "#1e293b" }}>
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#ef4444" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#eab308" }} />
        <div className="w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] mr-2" style={{ color: "#64748b" }}>terminal</span>
      </div>
      <div className="p-4 font-mono text-[12px] leading-[1.9]" style={{ background: "#0f172a" }} dir="ltr">
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.color ?? "#e2e8f0" }}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALERTS_FOR_PRIORITY = [
  { id: "ransomware", emoji: "🔴", title: "Ransomware indicators", sub: "FINANCE-PC-04", correct: 1 },
  { id: "outbound",   emoji: "🟠", title: "Unusual outbound traffic", sub: "MAIL-SERVER-02", correct: 2 },
  { id: "vpn",        emoji: "🟡", title: "Failed logins on VPN gateway", sub: "12 attempts", correct: 3 },
  { id: "cert",       emoji: "🔵", title: "Certificate expiry warning", sub: "API-GATEWAY — 7 days", correct: 4 },
];

const LOG_LINES = [
  { id: 0, time: "09:17:23", process: "vssadmin.exe",      action: "DELETE SHADOWS",         suspicious: true,  reason: "מחיקת Shadow Copies = ransomware מוחק גיבויים" },
  { id: 1, time: "09:17:24", process: "explorer.exe",       action: "reading files C:\\Users", suspicious: false, reason: "פעילות רגילה של Explorer" },
  { id: 2, time: "09:17:25", process: "svchost.exe",        action: "→ 172.16.0.1:80",        suspicious: false, reason: "תקשורת פנימית רגילה" },
  { id: 3, time: "09:17:26", process: "cmd.exe",            action: "ENCRYPT *.docx *.xlsx",  suspicious: true,  reason: "הצפנת קבצים = ransomware פעיל!" },
  { id: 4, time: "09:17:27", process: "chrome.exe",         action: "DNS request",            suspicious: false, reason: "גלישה רגילה" },
  { id: 5, time: "09:17:28", process: "unknown.exe",        action: "→ 185.220.101.47:4444",  suspicious: true,  reason: "C2 connection — פורט 4444 = command & control" },
  { id: 6, time: "09:17:29", process: "windows-update.exe", action: "network traffic",        suspicious: false, reason: "עדכון רגיל" },
  { id: 7, time: "09:17:30", process: "unknown.exe",        action: "→ FINANCE-PC-05",        suspicious: true,  reason: "Lateral movement — מתפשטים לעמדה נוספת!" },
];

const TOGGLE_ACTIONS = [
  { id: "isolate",     label: "בדדי את FINANCE-PC-04 מהרשת",     correct: true,  wrongMsg: "נכון! בידוד מהרשת עוצר את ההתפשטות" },
  { id: "block_ip",    label: "חסמי IP 185.220.101.47 בחומת אש",  correct: true,  wrongMsg: "נכון! זהו שרת ה-C2 של התוקף" },
  { id: "domain_down", label: "כבי את כל ה-domain controller",    correct: false, wrongMsg: "לא — זה ישבית את כל הארגון. בידוד ממוקד בלבד" },
  { id: "mem_dump",    label: "צלמי memory snapshot לפני כיבוי",  correct: true,  wrongMsg: "נכון! ה-dump ישמר ראיות לחקירה" },
  { id: "delete_files",label: "מחקי את הקבצים המוצפנים מיידית",  correct: false, wrongMsg: "לא — מחיקה מיידית מאבדת ראיות חשובות" },
  { id: "alert_ir",    label: "הודיעי ל-Incident Response Team",  correct: true,  wrongMsg: "נכון! Ransomware דורש תגובת צוות שלם" },
];

const PM_QUESTIONS = [
  {
    q: "מה גרם לransomware להיכנס?",
    options: ["שרת חיצוני תקף אוטומטית", "עובד פתח קובץ .exe ממייל פישינג", "תוקף פרץ דרך VPN"],
    correct: 1,
    okMsg: "נכון — 90% מהransomware מתחיל בפישינג. מייל שנראה לגיטימי, קובץ שנפתח, וה-malware רץ.",
  },
  {
    q: "מה הגורם השורשי שאיפשר את זה?",
    options: ["antivirus ישן בלבד", "חוסר MFA + antivirus לא מעודכן", "firewall לא מוגדר"],
    correct: 1,
    okMsg: "נכון — MFA היה מונע גישה גם אחרי גניבת סיסמה. EDR מעודכן היה עוצר את ה-malware לפני ההצפנה.",
  },
  {
    q: "מה מונע שזה יקרה שוב?",
    options: ["להחליף את כל המחשבים", "הכשרת פישינג + EDR + בידוד אוטומטי", "לחסום גישה לאינטרנט"],
    correct: 1,
    okMsg: "נכון — שילוב של הכשרה, כלים (EDR), ואוטומציה = ה-stack המינימלי של כל SOC.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CyberDay() {
  const [phase, setPhase] = useState<Phase>("career");
  const [score, setScore] = useState(0);

  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);
  const [prioritySubmitted, setPrioritySubmitted] = useState(false);
  const [priorityError, setPriorityError] = useState(false);

  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [logsSubmitted, setLogsSubmitted] = useState(false);

  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [togglesSubmitted, setTogglesSubmitted] = useState(false);

  const [termLines, setTermLines] = useState<string[]>([]);
  const [termDone, setTermDone] = useState(false);
  const termRef = useRef(false);
  const [termAns, setTermAns] = useState<number | null>(null);

  const [pmIdx, setPmIdx] = useState(0);
  const [pmPicked, setPmPicked] = useState<number | null>(null);
  const [pmDoneAll, setPmDoneAll] = useState(false);

  const TERM_LINES = [
    "> isolate.sh FINANCE-PC-04",
    "[✓] Network interface disabled",
    "[✓] PC isolated from domain",
    "",
    "> fw-block.sh 185.220.101.47",
    "[✓] Rule added to perimeter firewall",
    "[✓] All connections from IP terminated",
    "",
    "> mem-dump.sh FINANCE-PC-04",
    "[✓] 16GB snapshot saved: dump_2026-08-05_0919.raw",
    "[✓] Uploaded to SIEM for analysis",
  ];

  function go(next: Phase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase(next);
  }

  useEffect(() => {
    if (phase !== "terminal" || termRef.current) return;
    termRef.current = true;
    TERM_LINES.forEach((line, i) => {
      setTimeout(() => {
        setTermLines((prev) => [...prev, line]);
        if (i === TERM_LINES.length - 1) setTimeout(() => setTermDone(true), 400);
      }, i * 250);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function markDone() {
    try {
      const cur = JSON.parse(localStorage.getItem("cyber-journey") || "{}");
      localStorage.setItem("cyber-journey", JSON.stringify({ ...cur, day: true }));
    } catch {/* ignore */}
  }

  function tapPriority(id: string) {
    if (prioritySubmitted) return;
    if (priorityOrder.includes(id)) setPriorityOrder(priorityOrder.filter((x) => x !== id));
    else if (priorityOrder.length < ALERTS_FOR_PRIORITY.length) setPriorityOrder([...priorityOrder, id]);
  }

  function submitPriority() {
    const expected = [...ALERTS_FOR_PRIORITY].sort((a, b) => a.correct - b.correct).map((a) => a.id);
    const correct = priorityOrder.every((id, i) => id === expected[i]);
    if (correct) setScore(s => s + 1);
    setPrioritySubmitted(true);
    setPriorityError(!correct);
  }

  function toggleLog(id: number) {
    if (logsSubmitted) return;
    const s = new Set(selectedLogs);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedLogs(s);
  }

  function flipToggle(id: string) {
    if (togglesSubmitted) return;
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function nextPm() {
    if (pmIdx + 1 >= PM_QUESTIONS.length) { setPmDoneAll(true); }
    else { setPmIdx(pmIdx + 1); setPmPicked(null); }
  }

  // ─── Header ─────────────────────────────────────────────────────────────────

  const pNum = phaseNum(phase);
  const Header = (
    <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: RED }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/explore/cyber" className="text-[12px] font-bold" style={{ opacity: 0.82 }}>← יציאה</Link>
          {phase !== "career" && phase !== "done" && (
            <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              {score} נקודות
            </span>
          )}
        </div>
        <div className="text-[20px]" style={HEEBO}>יום בחיי SOC Analyst</div>
        {pNum > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.65 }}>
              <span>שלב {pNum} מתוך {INTERACTIVE.length}</span>
              <span>{score}/{INTERACTIVE.length} נקודות</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pNum / INTERACTIVE.length) * 100}%`, background: "#fff" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Done ───────────────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="min-h-screen flex flex-col pb-28" style={{ background: "#f8fafc" }}>
        {Header}
        <div className="max-w-[720px] mx-auto w-full px-[22px] pt-6">
          <div className="rounded-2xl p-5 mb-5 text-center"
            style={{ background: "rgba(220,38,38,0.06)", border: "1.5px solid rgba(220,38,38,0.2)" }}>
            <div className="text-[32px] mb-2">🔥</div>
            <div className="text-[20px] font-black mb-2" style={{ color: RED, ...HEEBO }}>בלמת את הRansomware</div>
            <div className="text-[13px] mb-1" style={{ color: "rgba(0,0,0,0.55)" }}>
              תוך 7 דקות. ממוצע בתעשייה לזיהוי ransomware: <span className="font-bold">21 יום.</span>
            </div>
            <div className="text-[22px] font-black mt-2" style={{ color: RED }}>{score}/{INTERACTIVE.length}</div>
          </div>

          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>מה עשית</div>
            {[
              "✓ תיעדוף alerts — Ransomware ראשון",
              "✓ ניתוח לוגים — זיהוי 4 indicators חשודים",
              "✓ בידוד ממוקד — עצירת ההתפשטות",
              "✓ Post-mortem — שורש, גורם, מניעה",
            ].map((line, i) => (
              <div key={i} className="text-[12px] mb-2" style={{ color: "#15803d" }}>{line}</div>
            ))}
            <div className="mt-3 pt-3 text-[12.5px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
              &quot;Incident response&quot; — זה מה שSOC Analyst עושה כשהאש מגיעה.
            </div>
          </div>

          {/* Real-world links */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>כלים אמיתיים שSOC משתמשים בהם</div>
            {[
              { label: "VirusTotal", sub: "בדיקת IPs וקבצים חשודים — חינמי ופתוח", url: "https://virustotal.com" },
              { label: "Shodan", sub: "מנוע חיפוש למכשירים מחוברים לאינטרנט", url: "https://shodan.io" },
              { label: "ANY.RUN", sub: "Sandbox לניתוח malware בזמן אמת", url: "https://any.run" },
              { label: "Have I Been Pwned", sub: "בדוק אם המייל שלך דלף בפריצה", url: "https://haveibeenpwned.com" },
            ].map((tool) => (
              <a key={tool.label} href={tool.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: "rgba(0,0,0,0.05)", textDecoration: "none" }}>
                <div>
                  <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{tool.label}</div>
                  <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>{tool.sub}</div>
                </div>
                <span style={{ color: RED, fontSize: 13 }}>↗</span>
              </a>
            ))}
          </div>

          <Link href="/explore/cyber/learn/mystery"
            className="block w-full py-4 rounded-2xl text-center text-[14.5px] font-black mb-3 transition-all active:scale-[0.98]"
            style={{ background: RED, color: "#fff", ...HEEBO }}>
            לתעלומת הדלף ←
          </Link>
          <Link href="/explore/cyber/experience"
            className="block w-full py-3.5 rounded-2xl text-center text-[13.5px] font-bold mb-6"
            style={{ background: "rgba(220,38,38,0.08)", color: RED }}>
            מיציתי את הטעימה ←
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Career ─────────────────────────────────────────────────────────────────

  if (phase === "career") {
    return (
      <div className="min-h-screen flex flex-col pb-28" style={{ background: "#f8fafc" }}>
        {Header}
        <div className="max-w-[720px] mx-auto w-full px-[22px] pt-6">
          <div className="text-[22px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>מה באמת עושה SOC Analyst?</div>
          <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.42)" }}>לפני שנצלול לתקרית אמיתית — בואי נבין את התפקיד</div>

          <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.12)" }}>
            <img src="/domains/soc-analyst.jpeg" alt="" className="w-full object-cover" style={{ height: "200px" }} />
          </div>

          {/* Typical day timeline */}
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>יום עבודה טיפוסי</div>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { time: "08:00", icon: "📊", task: "בדיקת dashboard — מה קרה בלילה? יש alerts שממתינים?" },
              { time: "09:30", icon: "🔍", task: "triage של alerts חדשים — מה דחוף? מה ניתן לסגור?" },
              { time: "11:00", icon: "🔥", task: "incident! מחשב עם indicators של ransomware — תגובה מיידית" },
              { time: "13:00", icon: "📝", task: "תיעוד: post-mortem על האירוע של הבוקר" },
              { time: "15:00", icon: "📚", task: "Threat Intelligence — קריאת דוחות על TTPים חדשים" },
              { time: "17:00", icon: "🤝", task: "handover לצוות הלילה — briefing על כל מה שקרה" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[11px] font-mono shrink-0 mt-0.5" style={{ color: RED }}>{item.time}</span>
                <span className="text-[16px] shrink-0">{item.icon}</span>
                <span className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.7)" }}>{item.task}</span>
              </div>
            ))}
          </div>

          {/* RevealCards */}
          <div className="mb-4">
            <RevealCard emoji="⚡" title="למה אנשים אוהבים את התפקיד הזה">
              <ul className="list-none space-y-2">
                {[
                  "כל יום שונה — אף incident לא זהה לאחר",
                  "עובדים ב-real-time על איומים אמיתיים",
                  "תחושת שליחות — את מגנה על אנשים ונתונים",
                  "נקודת כניסה מעולה לעולם הסייבר — אפשר להגיע ב-6 חודשים",
                  "שכר מתחיל של 12,000–16,000 ₪ אפילו ללא תואר",
                ].map((p, i) => <li key={i} className="flex gap-2"><span style={{ color: RED }}>✓</span>{p}</li>)}
              </ul>
            </RevealCard>

            <RevealCard emoji="🛠️" title="כלים שSOC Analyst משתמש בהם">
              <div className="space-y-2">
                {[
                  { tool: "SIEM", desc: "Splunk / Microsoft Sentinel — אוסף לוגים מכל הארגון ומדליק alerts" },
                  { tool: "EDR", desc: "CrowdStrike / SentinelOne — אנטי-וירוס דור חדש שרואה התנהגות" },
                  { tool: "Firewall logs", desc: "Palo Alto / Fortinet — כל חיבור שיצא/נכנס לארגון" },
                  { tool: "VirusTotal", desc: "בדיקת IPs, קבצים, domains חשודים — חינמי ופתוח" },
                  { tool: "Wireshark", desc: "ניתוח traffic ברשת ברמת ה-packet" },
                ].map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <code className="text-[11px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded" style={{ background: "#0f172a", color: "#f87171" }}>{r.tool}</code>
                    <span>{r.desc}</span>
                  </div>
                ))}
              </div>
            </RevealCard>

            <RevealCard emoji="🔥" title="אתגרים בתפקיד">
              <ul className="list-none space-y-2">
                {[
                  "עבודה במשמרות — כולל לילות וסופי שבוע",
                  "Alert fatigue — מאות alerts ביום, רובם false positives",
                  "לחץ גבוה ב-incidents קריטיים",
                  "צריך לעדכן ידע כל הזמן — הTTPs של התוקפים משתנים",
                ].map((p, i) => <li key={i} className="flex gap-2"><span style={{ color: "#d97706" }}>⚠️</span>{p}</li>)}
              </ul>
            </RevealCard>

            <RevealCard emoji="📈" title="נתיב קריירה מ-SOC">
              <div className="space-y-1.5">
                {[
                  { level: "SOC Tier 1", time: "כניסה", desc: "triage, alert handling, escalation" },
                  { level: "SOC Tier 2", time: "1-2 שנים", desc: "forensics, threat hunting" },
                  { level: "IR / DFIR", time: "3-5 שנים", desc: "Incident Response מורכב" },
                  { level: "Threat Intelligence", time: "5+ שנים", desc: "ניתוח TTPים ומחקר" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="shrink-0 w-2 h-2 rounded-full" style={{ background: RED, opacity: 0.6 }} />
                    <div className="flex-1">
                      <span className="font-bold text-[12px]" style={{ color: NAVY }}>{r.level}</span>
                      <span className="text-[11px] mx-2" style={{ color: "rgba(0,0,0,0.35)" }}>·</span>
                      <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.5)" }}>{r.desc}</span>
                    </div>
                    <span className="text-[10.5px]" style={{ color: RED }}>{r.time}</span>
                  </div>
                ))}
              </div>
            </RevealCard>
          </div>

          {/* Video */}
          <VideoEmbed id="zMsx8nWJLBE" label="מה זה SOC? — נקודת הכניסה לעולם הסייבר" />

          <button type="button" onClick={() => go("intro")}
            className="w-full py-4 rounded-2xl text-[14.5px] font-black mb-6 transition-all active:scale-[0.98]"
            style={{ background: RED, color: "#fff", ...HEEBO }}>
            קדימה לתקרית האמיתית ←
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Shared wrapper ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: "#f8fafc" }}>
      {Header}
      <div className="max-w-[720px] mx-auto w-full px-[22px] pt-6">

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <>
            {/* SOC Banner */}
            <div className="rounded-2xl px-4 py-3.5 mb-5 flex gap-3 items-start"
              style={{ background: "rgba(220,38,38,0.06)", border: "1.5px solid rgba(220,38,38,0.15)" }}>
              <span className="text-[22px] shrink-0">🖥️</span>
              <div>
                <div className="text-[12.5px] font-black mb-1" style={{ color: RED }}>SOC = Security Operations Center</div>
                <div className="text-[12px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
                  חדר הבקרה שמנטר את אבטחת הארגון 24/7. כ-SOC Analyst, את הראשונה שמקבלת alerts ומחליטה מה לעשות.
                </div>
              </div>
            </div>

            <div className="text-[22px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שני 09:17</div>
            <div className="text-[13px] mb-5" style={{ color: "rgba(0,0,0,0.5)" }}>
              ארבעה alerts הגיעו בו-זמנית. את SOC Analyst התורנית.
            </div>

            <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-bold" style={{ color: "#60a5fa" }}>🖥️ SOC Dashboard</span>
                <span className="text-[10px]" style={{ color: "#ef4444" }}>● LIVE</span>
              </div>
              <div className="p-4" style={{ background: "#111827" }}>
                {[
                  { emoji: "🔴", prio: "P1", title: "Ransomware indicators", host: "FINANCE-PC-04" },
                  { emoji: "🟠", prio: "P2", title: "Unusual outbound traffic", host: "MAIL-SERVER-02" },
                  { emoji: "🟡", prio: "P3", title: "Failed logins × 12 on VPN", host: "vpn.corp.il" },
                  { emoji: "🔵", prio: "P4", title: "Certificate expiry — 7 days", host: "API-GATEWAY" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b font-mono text-[11px]"
                    style={{ borderColor: "rgba(255,255,255,0.05)", color: "#d1d5db" }}>
                    <span className="text-[14px]">{a.emoji}</span>
                    <span style={{ color: "#94a3b8" }}>{a.prio}</span>
                    <span className="flex-1">{a.title}</span>
                    <span style={{ color: "#60a5fa" }}>{a.host}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => go("priority")}
              className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all active:scale-[0.98]"
              style={{ background: RED, color: "#fff", ...HEEBO }}>
              קחי את הcase ←
            </button>
          </>
        )}

        {/* ── PRIORITY ── */}
        {phase === "priority" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב א׳ — תיעדוף: מה קודם?</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>כשמגיעים כמה alerts בבת אחת — מחליטים מה דחוף.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>הכלל:</strong> threat פעיל (ransomware, פריצה) = P1 תמיד. בעיה שיכולה לחכות = P4.
            </div>

            <div className="mb-4">
              <GlossaryChip term="Ransomware" explanation="תוכנה זדונית שמצפינה קבצים ודורשת כופר. כל דקה = עוד קבצים מוצפנים." />
              <GlossaryChip term="P1 / P2 / P3 / P4" explanation="סולם עדיפויות: P1 = קריטי עכשיו. P4 = יכול לחכות. כל SOC מגדיר SLA לכל רמה." />
              <GlossaryChip term="Certificate expiry" explanation="תעודת SSL שתפוגה = שגיאת אבטחה. לא נעים, אבל לא emergency." />
            </div>

            <div className="text-[12px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>לחצי לפי סדר הטיפול (1 = ראשון):</div>

            <div className="flex flex-col gap-2 mb-4">
              {ALERTS_FOR_PRIORITY.map((a) => {
                const rank = priorityOrder.indexOf(a.id) + 1;
                const isSelected = rank > 0;
                const isCorrect = prioritySubmitted && a.correct === rank;
                const isWrong = prioritySubmitted && isSelected && !isCorrect;
                return (
                  <button key={a.id} type="button" onClick={() => tapPriority(a.id)} disabled={prioritySubmitted}
                    className="w-full rounded-2xl p-3.5 flex items-center gap-3 transition-all"
                    style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(220,38,38,0.06)" : "#fff", border: isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : isWrong ? "1.5px solid rgba(220,38,38,0.3)" : isSelected ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[14px] font-black"
                      style={{ background: isCorrect ? "#16a34a" : isWrong ? RED : isSelected ? RED : "rgba(0,0,0,0.06)", color: isSelected ? "#fff" : "rgba(0,0,0,0.3)" }}>
                      {isSelected ? rank : "—"}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[12.5px] font-bold" style={{ color: NAVY }}>{a.title}</span>
                        <span className="text-[16px]">{a.emoji}</span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>{a.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!prioritySubmitted ? (
              <button type="button" onClick={submitPriority} disabled={priorityOrder.length < ALERTS_FOR_PRIORITY.length}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: priorityOrder.length === ALERTS_FOR_PRIORITY.length ? RED : "rgba(0,0,0,0.06)", color: priorityOrder.length === ALERTS_FOR_PRIORITY.length ? "#fff" : "rgba(0,0,0,0.3)", ...HEEBO }}>
                {priorityOrder.length < ALERTS_FOR_PRIORITY.length ? `בחרי עוד ${ALERTS_FOR_PRIORITY.length - priorityOrder.length}` : "אשרי סדר עדיפויות"}
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: priorityError ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)", border: `1px solid ${priorityError ? "rgba(220,38,38,0.25)" : "rgba(22,163,74,0.25)"}`, color: priorityError ? "#b91c1c" : "#15803d" }}>
                  {priorityError ? "✗ לא בדיוק. Ransomware = threat פעיל = תמיד P1. Certificate expiry = ממתין = P4." : "✓ נכון — Ransomware פעיל הוא תמיד P1. Certificate expiry יכול לחכות."}
                </div>
                <button type="button" onClick={() => go("logs")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: RED, color: "#fff", ...HEEBO }}>
                  המשיכי לניתוח הלוגים ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── LOGS ── */}
        {phase === "logs" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ב׳ — ניתוח לוגים: מה קרה?</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>כל פעולה שמחשב עושה נרשמת בlog. בדקי מה FINANCE-PC-04 עשה בדקה הקריטית.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>מה לחפש:</strong> תהליכים שמצפינים קבצים, מוחקים גיבויים, או מתקשרים עם כתובות חיצוניות חשודות.
            </div>

            <div className="mb-4">
              <GlossaryChip term="vssadmin.exe" explanation={<span>כלי Windows שמנהל Shadow Copies (גיבויים אוטומטיים).<br /><code style={{ display: "block", background: "#0f172a", color: "#f87171", padding: "4px 8px", borderRadius: 6, fontSize: 10, direction: "ltr", fontFamily: "monospace" }}>DELETE SHADOWS</code>Ransomware מוחק גיבויים ראשון — כדי שלא תוכלי לשחזר.</span>} />
              <GlossaryChip term="svchost.exe" explanation="תהליך Windows לגיטימי — מריץ שירותי מערכת. ב-IP פנימי (172.x) = רגיל." />
              <GlossaryChip term="unknown.exe" explanation="קובץ הפעלה לא ידוע = דגל אדום. תוכנה לגיטימית תמיד יש לה שם ומוציאה." />
              <GlossaryChip term="פורט 4444" explanation={<span>פורט קלאסי ל-C2 (Command & Control).<br /><code style={{ display: "block", background: "#0f172a", color: "#f87171", padding: "4px 8px", borderRadius: 6, fontSize: 10, direction: "ltr", fontFamily: "monospace" }}>unknown.exe → 185.220.101.47:4444</code>חיבור לשרת התוקף מחוץ לארגון.</span>} />
            </div>

            <div className="text-[12px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.45)" }}>FINANCE-PC-04 — פעילות 09:17–09:18. סמני שורות חשודות:</div>

            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="px-3 py-2 flex gap-3 font-mono text-[9.5px]"
                style={{ background: "#1e293b", color: "#475569" }} dir="ltr">
                <span className="w-[60px]">TIME</span>
                <span className="w-[120px]">PROCESS</span>
                <span className="flex-1">ACTION</span>
              </div>
              {LOG_LINES.map((log) => {
                const isSelected = selectedLogs.has(log.id);
                const isCorrect = logsSubmitted && log.suspicious && isSelected;
                const isMissed = logsSubmitted && log.suspicious && !isSelected;
                const isFalsePos = logsSubmitted && !log.suspicious && isSelected;
                return (
                  <button key={log.id} type="button" onClick={() => toggleLog(log.id)} disabled={logsSubmitted}
                    className="w-full border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="px-3 py-2.5 flex gap-3 items-start font-mono text-[11px]"
                      style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isMissed ? "rgba(251,133,0,0.08)" : isFalsePos ? "rgba(220,38,38,0.08)" : isSelected ? "rgba(220,38,38,0.05)" : "#fff" }} dir="ltr">
                      <span className="w-[60px] shrink-0" style={{ color: "#6b7280" }}>{log.time}</span>
                      <span className="w-[120px] shrink-0 truncate" style={{ color: "#60a5fa" }}>{log.process}</span>
                      <span className="flex-1 text-left" style={{ color: isSelected ? RED : "#374151" }}>{log.action}</span>
                      {isSelected && !logsSubmitted && <span style={{ color: RED, fontSize: 12 }}>✓</span>}
                      {logsSubmitted && <span style={{ color: isCorrect ? "#16a34a" : isMissed ? "#d97706" : isFalsePos ? RED : "#16a34a", fontSize: 12 }}>{isCorrect ? "✓" : isMissed ? "!" : isFalsePos ? "✗" : "✓"}</span>}
                    </div>
                    {logsSubmitted && log.suspicious && (
                      <div className="px-3 py-1.5 text-[10.5px] text-right border-t"
                        style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.1)", color: "#b91c1c" }}>
                        ⚠️ {log.reason}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!logsSubmitted ? (
              <button type="button" onClick={() => { setLogsSubmitted(true); setScore(s => s + 1); }} disabled={selectedLogs.size === 0}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: selectedLogs.size > 0 ? RED : "rgba(0,0,0,0.06)", color: selectedLogs.size > 0 ? "#fff" : "rgba(0,0,0,0.3)", ...HEEBO }}>
                שלחי — {selectedLogs.size} שורות מסומנות
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-3 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                  ✓ ארבע שורות חשודות: מחיקת גיבויים, הצפנת קבצים, C2 connection, lateral movement.
                </div>
                <div className="mb-3">
                  <GlossaryChip term="lateral movement" explanation="כשתוקף מתפשט ממחשב למחשב ברשת — FINANCE-PC-05 הבאה בסכנה." />
                  <GlossaryChip term="C2 server" explanation={<span>Command & Control — שרת שהתוקף שולח ממנו פקודות ל-malware.<br /><code style={{ display: "block", background: "#0f172a", color: "#f87171", padding: "4px 8px", borderRadius: 6, fontSize: 10, direction: "ltr", fontFamily: "monospace" }}>185.220.101.47:4444</code></span>} />
                  <GlossaryChip term="shadow copy" explanation="גיבויים אוטומטיים של Windows. Ransomware מוחק אותם ראשון — כדי שלא תשחזרי." />
                </div>
                {/* Real-world link */}
                <a href="https://www.virustotal.com/gui/ip-address/185.220.101.47" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
                  style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", textDecoration: "none" }}>
                  <span className="text-[18px]">🌐</span>
                  <div>
                    <div className="text-[12px] font-bold" style={{ color: RED }}>בדקי את ה-IP ב-VirusTotal ↗</div>
                    <div className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>185.220.101.47 — כלי אמיתי שSOC משתמשים בו</div>
                  </div>
                </a>
                <button type="button" onClick={() => go("toggles")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: RED, color: "#fff", ...HEEBO }}>
                  המשיכי לבידוד ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── TOGGLES ── */}
        {phase === "toggles" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ג׳ — בידוד: עצירת ההתפשטות</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>Ransomware מתפשט בשניות. לפני שמנתחים — מבדדים.</div>

            <div className="rounded-xl px-4 py-3 mb-3 text-[12px] leading-[1.6]"
              style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)", color: "rgba(0,0,0,0.65)" }}>
              <strong style={{ color: NAVY }}>עיקרון:</strong> בידוד ממוקד — לא לכבות את כל הארגון. לחסום את הנגועים ולשמר ראיות.
            </div>

            <div className="mb-4">
              <GlossaryChip term="Network isolation" explanation="ניתוק המחשב הנגוע מהרשת — מונע התפשטות נוספת ותקשורת עם שרת C2." />
              <GlossaryChip term="חומת אש (Firewall)" explanation="מסנן תעבורת רשת. חסימת IP של C2 = חיתוך התקשורת בין ה-malware לתוקף." />
              <GlossaryChip term="Memory snapshot" explanation="צילום של ה-RAM ברגע זה — שומר עדות לפעילות ה-malware לניתוח לאחר מכן." />
              <GlossaryChip term="Incident Response Team" explanation="צוות מומחים שמגיע להכיל ולחקור תקרית גדולה. SOC Analyst קוראת להם כשהמקרה מורכב." />
            </div>

            <div className="text-[12px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>בחרי אילו פעולות לבצע:</div>

            <div className="flex flex-col gap-2 mb-4">
              {TOGGLE_ACTIONS.map((action) => {
                const isOn = !!toggles[action.id];
                const isCorrect = togglesSubmitted && isOn === action.correct;
                const isWrong = togglesSubmitted && isOn !== action.correct;
                return (
                  <button key={action.id} type="button" onClick={() => flipToggle(action.id)} disabled={togglesSubmitted}
                    className="w-full rounded-2xl p-3.5 flex items-center gap-3 transition-all"
                    style={{ background: isCorrect ? "rgba(22,163,74,0.08)" : isWrong ? "rgba(220,38,38,0.06)" : "#fff", border: isCorrect ? "1.5px solid rgba(22,163,74,0.25)" : isWrong ? "1.5px solid rgba(220,38,38,0.2)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="shrink-0 w-12 h-6 rounded-full relative transition-all"
                      style={{ background: isOn ? (togglesSubmitted ? (isCorrect ? "#16a34a" : RED) : RED) : "rgba(0,0,0,0.15)" }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: isOn ? "26px" : "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>{action.label}</div>
                      {togglesSubmitted && (
                        <div className="text-[11px] mt-0.5" style={{ color: isCorrect ? "#15803d" : "#b91c1c" }}>
                          {isCorrect ? (isOn ? "✓ נכון" : "✓ נכון לא להפעיל") : action.wrongMsg}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {!togglesSubmitted ? (
              <button type="button" onClick={() => { setTogglesSubmitted(true); setScore(s => s + 1); }}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: RED, color: "#fff", ...HEEBO }}>
                אשרי פעולות ←
              </button>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#15803d" }}>
                  ✓ בידוד ממוקד — לא shutdown כללי. snapshot לפני מחיקה. C2 נחסם.
                </div>
                <button type="button" onClick={() => go("terminal")}
                  className="w-full py-4 rounded-2xl text-[14.5px] font-black transition-all"
                  style={{ background: RED, color: "#fff", ...HEEBO }}>
                  הריצי את הפקודות ←
                </button>
              </>
            )}
          </>
        )}

        {/* ── TERMINAL ── */}
        {phase === "terminal" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ד׳ — ביצוע: הפקודות רצות</div>
            <div className="text-[13px] mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
              SOC Analyst לא כותבת קוד מאפס — משתמשת בסקריפטים מוכנים.
            </div>

            <TerminalCard lines={termLines.map((line) => ({ text: line, color: line.startsWith("[✓]") ? "#22c55e" : line.startsWith(">") ? "#60a5fa" : line === "" ? undefined : "#e2e8f0" }))} />

            {termDone && (
              <>
                <div className="mb-4">
                  <GlossaryChip term="memory snapshot" explanation="צילום של ה-RAM — שומר את כל הפעילות הנסתרת של ה-malware לחקירה פורנזית." />
                  <GlossaryChip term="SIEM" explanation="Security Information and Event Management — Splunk / Microsoft Sentinel. אוסף לוגים מכל הארגון." />
                  <GlossaryChip term="perimeter firewall" explanation="חומת האש על גבול הרשת הארגונית — מסנן תעבורה שנכנסת ויוצאת." />
                </div>

                <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>מה הצעד הבא אחרי בידוד ו-memory dump?</div>
                  {[
                    { label: "שחזרי מbackup נקי", correct: true, ok: "✓ נכון — אחרי ניתוח ה-dump, שחזור מbackup נקי.", err: "" },
                    { label: "עשי format מיידי", correct: false, ok: "", err: "✗ לא — Format מאבד את ה-dump וכל הראיות." },
                    { label: "חכי ותראי מה קורה", correct: false, ok: "", err: "✗ לא — Ransomware יכול להמשיך להצפין. עוצרים ומשחזרים." },
                  ].map((opt, i) => (
                    <TermAnswer key={i} opt={opt} idx={i} termAns={termAns} setTermAns={(n) => { setTermAns(n); if (opt.correct) setScore(s => s + 1); }} onNext={() => go("postmortem")} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── POSTMORTEM ── */}
        {phase === "postmortem" && (
          <>
            <div className="text-[18px] font-black mb-1" style={{ color: NAVY, ...HEEBO }}>שלב ה׳ — Post-Mortem: מה למדנו?</div>
            <div className="text-[13px] mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>אחרי כל תקרית — SOC עושה post-mortem: מה קרה, למה, ואיך מונעים שוב.</div>

            {pmIdx === 0 && (
              <div className="mb-4">
                <GlossaryChip term="Phishing" explanation="מייל מזויף שמתחזה לגורם לגיטימי. מטרתו לגרום לך לפתוח קובץ או ללחוץ על קישור." />
                <GlossaryChip term="MFA" explanation="Multi-Factor Authentication — אימות דו-שלבי. גם אם גנבו סיסמה, בלי הטלפון לא נכנסים." />
                <GlossaryChip term="EDR" explanation="Endpoint Detection & Response — אנטי-וירוס דור חדש שמנטר התנהגות בזמן אמת." />
              </div>
            )}

            <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{PM_QUESTIONS[pmIdx].q}</div>

            <div className="flex flex-col gap-2 mb-4">
              {PM_QUESTIONS[pmIdx].options.map((opt, i) => {
                const isCorrect = i === PM_QUESTIONS[pmIdx].correct;
                const isPicked = pmPicked === i;
                const showResult = pmPicked !== null;
                return (
                  <button key={i} type="button" onClick={() => { if (pmPicked === null) { setPmPicked(i); if (isCorrect) setScore(s => s + 1); } }} disabled={pmPicked !== null}
                    className="w-full rounded-2xl px-4 py-3.5 text-right transition-all"
                    style={{ background: showResult && isCorrect ? "rgba(22,163,74,0.08)" : showResult && isPicked && !isCorrect ? "rgba(220,38,38,0.08)" : "#fff", border: showResult && isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !isCorrect ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt}</span>
                    {showResult && isCorrect && <div className="text-[11.5px] mt-1.5" style={{ color: "#15803d" }}>{PM_QUESTIONS[pmIdx].okMsg}</div>}
                  </button>
                );
              })}
            </div>

            {pmPicked !== null && !pmDoneAll && (
              <button type="button" onClick={nextPm}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
                style={{ background: RED, color: "#fff", ...HEEBO }}>
                {pmIdx + 1 < PM_QUESTIONS.length ? `שאלה ${pmIdx + 2} מ-${PM_QUESTIONS.length} ←` : "סיום Post-Mortem ←"}
              </button>
            )}

            {pmDoneAll && (
              <button type="button" onClick={() => { markDone(); go("done"); }}
                className="w-full py-4 rounded-2xl text-[14.5px] font-black mt-4 transition-all"
                style={{ background: RED, color: "#fff", ...HEEBO }}>
                סיום — ראי את הסיכום ←
              </button>
            )}
          </>
        )}

      </div>
      <BottomNav />
    </div>
  );
}

// Helper: Terminal question answer
function TermAnswer({ opt, idx, termAns, setTermAns, onNext }: {
  opt: { label: string; correct: boolean; ok: string; err: string };
  idx: number; termAns: number | null; setTermAns: (n: number) => void; onNext: () => void;
}) {
  const isPicked = termAns === idx;
  const showResult = termAns !== null;
  const isCorrect = opt.correct;
  return (
    <div>
      <button type="button" onClick={() => { if (termAns === null) setTermAns(idx); }} disabled={showResult}
        className="w-full rounded-xl px-4 py-3 text-right mb-2 transition-all"
        style={{ background: showResult && isCorrect ? "rgba(22,163,74,0.08)" : showResult && isPicked && !isCorrect ? "rgba(220,38,38,0.08)" : "#f8fafc", border: showResult && isCorrect ? "1.5px solid rgba(22,163,74,0.3)" : showResult && isPicked && !isCorrect ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid rgba(0,0,0,0.07)" }}>
        <span className="text-[13px] font-bold" style={{ color: NAVY }}>{opt.label}</span>
        {showResult && isCorrect && <div className="text-[11.5px] mt-1" style={{ color: "#15803d" }}>{opt.ok}</div>}
        {showResult && isPicked && !isCorrect && <div className="text-[11.5px] mt-1" style={{ color: "#b91c1c" }}>{opt.err}</div>}
      </button>
      {showResult && isCorrect && isPicked && (
        <button type="button" onClick={onNext} className="w-full py-3.5 rounded-2xl text-[14px] font-black transition-all"
          style={{ background: RED, color: "#fff", fontFamily: "'Heebo', sans-serif", fontWeight: 900 }}>
          המשיכי לPost-Mortem ←
        </button>
      )}
    </div>
  );
}
