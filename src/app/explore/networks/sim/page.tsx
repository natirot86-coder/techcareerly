"use client";
import React, { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const BLUE = "#3b82f6";
const NAVY = "#023e8a";
const ORANGE = "#fb8500";

// ─── Step types ───────────────────────────────────────────────────────────────

type ChoiceStep = {
  kind: "choice";
  tag: string;
  concept: string;
  context: React.ReactNode;
  question: string;
  options: string[];
  correct: number;
  okMsg: string;
  errMsg: string;
};

type SequenceStep = {
  kind: "sequence";
  tag: string;
  concept: string;
  context: React.ReactNode;
  instruction: string;
  items: string[];
  correctOrder: number[];
  okMsg: string;
  errMsg: string;
};

type Step = ChoiceStep | SequenceStep;

// ─── Steps ────────────────────────────────────────────────────────────────────

function TerminalCard({ lines }: { lines: { text: string; color?: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
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

const STEPS: Step[] = [
  // Step 1 — DNS
  {
    kind: "choice",
    tag: "DNS",
    concept: "DNS — תרגום שם לכתובת IP",
    context: (
      <div>
        <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
          הקלדת <span className="font-mono font-bold" style={{ color: NAVY }}>google.com</span> ולחצת Enter.
          <br />
          הדפדפן רוצה לתקשר עם שרת גוגל — אבל מחשבים לא מבינים שמות.{" "}
          <span className="font-bold" style={{ color: NAVY }}>הם מבינים רק כתובות IP.</span>
        </p>
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: BLUE }}>האנלוגיה:</div>
          <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.62)" }}>
            שם דומיין = שם של אדם<br />
            כתובת IP = מספר טלפון<br />
            DNS = מדריך הטלפונים שמתרגם שם למספר
          </div>
        </div>
      </div>
    ),
    question: "לאן הדפדפן פונה כדי לתרגם את google.com לכתובת IP?",
    options: [
      "ישירות לשרתי גוגל",
      "לשרת DNS",
      "לRouter הביתי בלבד",
    ],
    correct: 1,
    okMsg: "נכון! שרת DNS הוא כמו מדריך טלפונים דיגיטלי — google.com → 142.250.185.14. כל גלישה מתחילה בצעד הזה.",
    errMsg: "שרת DNS הוא הצעד הראשון — הוא מתרגם שם דומיין לכתובת IP. בלעדיו הדפדפן לא יודע לאן לפנות.",
  },
  // Step 2 — IP Address
  {
    kind: "choice",
    tag: "IP Address",
    concept: "IP Address — כתובת ייחודית לכל מכשיר",
    context: (
      <div>
        <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
          שרת DNS תרגם את <strong>google.com</strong> למספר. למה מספר? כי מחשבים לא מבינים שמות — הם עובדים עם כתובות מספריות.
        </p>

        {/* Terminal */}
        <TerminalCard lines={[
          { text: "$ nslookup google.com", color: "#60a5fa" },
          { text: "Server:   8.8.8.8" },
          { text: "" },
          { text: "Name:  google.com", color: "#94a3b8" },
          { text: "Address: 142.250.185.14", color: "#22c55e" },
        ]} />

        {/* What is IP */}
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
          <div className="text-[13px] font-black mb-1" style={{ color: NAVY }}>IP — Internet Protocol Address</div>
          <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.6)" }}>
            כתובת ייחודית שמזהה כל מכשיר המחובר לאינטרנט — בדיוק כמו כתובת דואר של בית.
            בלי IP, מידע שנשלח לא יודע לאן להגיע.
          </div>
        </div>

        {/* IPv4 visual breakdown */}
        <div className="rounded-xl p-4 mb-4" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>מבנה כתובת IPv4</div>
          <div className="flex items-center justify-center gap-1 mb-3" dir="ltr">
            {["142", "250", "185", "14"].map((n, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className="px-3 py-2 rounded-lg font-mono font-bold text-[15px]"
                    style={{ background: ["rgba(59,130,246,0.12)","rgba(99,102,241,0.12)","rgba(168,85,247,0.12)","rgba(236,72,153,0.12)"][i],
                      color: ["#2563eb","#4f46e5","#7c3aed","#db2777"][i], minWidth: 44, textAlign: "center" }}>{n}</div>
                </div>
                {i < 3 && <span className="text-[18px] font-black" style={{ color: "rgba(0,0,0,0.25)" }}>.</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="text-[11px] text-center" style={{ color: "rgba(0,0,0,0.4)" }}>
            4 מספרים · כל אחד בין 0 ל-255 · מופרדים בנקודות
          </div>
        </div>

        {/* Public vs Private */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>שני סוגי IP שחשוב להכיר</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="text-[11px] font-black mb-1" style={{ color: "#15803d" }}>🌐 Public IP</div>
            <div className="font-mono text-[10px] mb-1.5" style={{ color: "#15803d" }}>142.250.185.14</div>
            <div className="text-[10px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.5)" }}>
              נגיש מכל העולם.<br />שרתים, אתרים, ה-Router שלך
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.2)" }}>
            <div className="text-[11px] font-black mb-1" style={{ color: "#c2410c" }}>🏠 Private IP</div>
            <div className="font-mono text-[10px] mb-1.5" style={{ color: "#c2410c" }}>192.168.1.5</div>
            <div className="text-[10px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.5)" }}>
              פנימי בלבד — בית/משרד.<br />המחשב שלך, הטלפון שלך
            </div>
          </div>
        </div>

        {/* Real world examples */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>דוגמאות אמיתיות</div>
        <div className="rounded-xl overflow-hidden mb-1" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          {[
            { device: "💻 המחשב שלך (ברשת הבית)", ip: "192.168.1.5", type: "Private" },
            { device: "📦 הRouter שלך (בזק/HOT)", ip: "77.124.x.x", type: "Public" },
            { device: "🔍 שרת Google", ip: "142.250.185.14", type: "Public" },
            { device: "📱 הטלפון שלך (WiFi)", ip: "192.168.1.8", type: "Private" },
          ].map((ex, i, arr) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.65)" }}>{ex.device}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px]" style={{ color: NAVY }}>{ex.ip}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: ex.type === "Public" ? "rgba(34,197,94,0.1)" : "rgba(251,133,0,0.1)",
                    color: ex.type === "Public" ? "#15803d" : "#c2410c" }}>{ex.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    question: "יש שגיאה בדף נחיתה — המפתחת אומרת 'זה עובד אצלי'. מה הסיבה הסבירה ביותר?",
    options: [
      "המחשב שלה איטי יותר",
      "היא רואה גרסה ישנה מהcache",
      "ה-IP שלה (Private) שונה מה-IP של השרת (Public) — היא בודקת מחשב אחר",
    ],
    correct: 2,
    okMsg: "בדיוק! 'Works on my machine' — קלאסי. Private IP ≠ Public IP. היא בודקת על המחשב המקומי שלה (192.168.x.x), לא על השרת שנגיש לעולם.",
    errMsg: "הסיבה הנפוצה ביותר היא הבדל בין Private לPublic IP — המפתחת בודקת את האפליקציה על המחשב המקומי שלה, לא על השרת שהמשתמשים רואים.",
  },
  // Step 3 — Routing (Choice)
  {
    kind: "choice",
    tag: "Routing",
    concept: "Routing — המסלול של הPacket",
    context: (
      <div>
        <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
          עכשיו הדפדפן יודע לאן לפנות:{" "}
          <span className="font-mono font-bold" style={{ color: NAVY }}>142.250.185.14</span>
          <br />
          הבקשה יוצאת כ-<span className="font-bold" style={{ color: NAVY }}>packet</span> — חבילת מידע קטנה שעושה דרך ארוכה.
        </p>

        {/* Route visual */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(59,130,246,0.18)" }}>
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(59,130,246,0.08)", color: BLUE }}>
            המסלול של הPacket שלך
          </div>
          {[
            { emoji: "💻", label: "המחשב שלך", explain: "כאן הכל מתחיל" },
            { emoji: "📦", label: "Router ביתי", explain: "הקופסה הלבנה/שחורה בבית (בזק/HOT)" },
            { emoji: "🏢", label: "ספק האינטרנט (ISP)", explain: "חברת הסלולר / בזק — מחברים אותך לאינטרנט" },
            { emoji: "🌐", label: "Router מרכזי (Backbone)", explain: "שרתים ענקיים שמחזיקים את עמוד השדרה של האינטרנט" },
            { emoji: "🔍", label: "שרתי Google", explain: "היעד — מחזירים את דף הבית" },
          ].map((hop, i, arr) => (
            <div key={i}>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="text-[20px] shrink-0 mt-0.5">{hop.emoji}</span>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: NAVY }}>{hop.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>{hop.explain}</div>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="text-center text-[14px] py-1" style={{ color: "rgba(59,130,246,0.5)" }}>↓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    question: "כל Router בדרך מקבל החלטה. מה הוא עושה עם הPacket?",
    options: [
      "שומר אותו עד שיש מקום פנוי",
      "מעביר אותו הלאה לכיוון הנכון לפי כתובת היעד",
      "פותח אותו ובודק את התוכן",
    ],
    correct: 1,
    okMsg: "בדיוק! כל Router מסתכל על כתובת ה-IP ומחליט לאן להעביר הלאה — כמו שוטר תנועה בצומת. הPacket עובר 10–30 תחנות כאלה בדרך לגוגל.",
    errMsg: "Router לא שומר ולא קורא את התוכן — הוא רק מפנה. מסתכל על כתובת היעד ושולח לנתיב המהיר ביותר. כמו שוטר תנועה.",
  },
  // Step 4 — TCP
  {
    kind: "choice",
    tag: "TCP",
    concept: "TCP — חיבור אמין מקצה לקצה",
    context: (
      <div>
        {/* What is TCP */}
        <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[15px] font-black" style={{ color: BLUE }}>TCP</span>
            <span className="text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.42)" }}>Transmission Control Protocol — פרוטוקול בקרת העברה</span>
          </div>
          <div className="text-[12px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
            TCP הוא "שפת ההסכמה" בין שני מחשבים לפני שהם מתחילים להעביר נתונים.
            הוא מבטיח שכל packet יגיע, בסדר הנכון — ואם אחד אבד, הוא נשלח מחדש.
          </div>
        </div>

        {/* Analogy */}
        <div className="rounded-xl px-4 py-3 mb-4 flex gap-3" style={{ background: "rgba(251,133,0,0.06)", border: "1px solid rgba(251,133,0,0.18)" }}>
          <span className="text-[22px] shrink-0">📬</span>
          <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.65)" }}>
            <span className="font-bold">האנלוגיה:</span> TCP = דואר רשום עם אישור מסירה.<br />
            UDP (הפרוטוקול האחר) = גלויה — שולחים ומקווים שמגיעה.
          </div>
        </div>

        {/* Real-life examples */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>דוגמאות מהחיים</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { emoji: "💬", app: "WhatsApp", use: "TCP — כל הודעה חייבת להגיע" },
            { emoji: "🌐", app: "Chrome", use: "TCP — כל דף חייב להיות שלם" },
            { emoji: "🎮", app: "FPS Online", use: "UDP — מהירות > דיוק" },
            { emoji: "📞", app: "שיחת Zoom", use: "UDP — עדיף חטוף מאשר מאוחר" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="text-[18px] mb-1">{item.emoji}</div>
              <div className="text-[11.5px] font-bold mb-0.5" style={{ color: NAVY }}>{item.app}</div>
              <div className="text-[10px] leading-[1.5]" style={{ color: "rgba(0,0,0,0.45)" }}>{item.use}</div>
            </div>
          ))}
        </div>

        {/* The handshake */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>לחיצת יד משולשת — Three-Way Handshake</div>
        <TerminalCard lines={[
          { text: "Client → Server:  SYN     (אני רוצה להתחבר!)", color: "#60a5fa" },
          { text: "Server → Client:  SYN-ACK (מובן, מוכן!)",      color: "#22c55e" },
          { text: "Client → Server:  ACK     (מעולה, מתחילים)",   color: "#60a5fa" },
          { text: "✓ Connection Established",                       color: "#22c55e" },
        ]} />

        {/* Video */}
        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>🎥 הסבר קצר בעברית</div>
        <div className="rounded-2xl overflow-hidden mb-1" style={{ border: "1px solid rgba(59,130,246,0.2)" }}>
          <div className="relative" style={{ paddingTop: "56.25%" }}>
            <iframe
              src="https://www.youtube.com/embed/mkmYu_ZlUvs"
              title="הסבר על TCP ולחיצת יד משולשת"
              allowFullScreen
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </div>
      </div>
    ),
    question: "למה TCP מבצע לחיצת יד לפני שליחת הנתונים?",
    options: [
      "כדי לבדוק את מהירות החיבור",
      "לוודא שהחיבור יציב ושני הצדדים מוכנים לתקשורת",
      "כדי לאמת סיסמה ומשתמש",
    ],
    correct: 1,
    okMsg: "נכון! לחיצת יד = וידוא שהחיבור פתוח ואמין לפני שמתחילים לשלוח נתונים. TCP = ביטוח על כל packet.",
    errMsg: "TCP לא בודק מהירות — הוא מבטיח אמינות. הלחיצת יד מוודאת שהחיבור קיים ושני הצדדים מוכנים.",
  },
  // Step 5 — HTTP
  {
    kind: "choice",
    tag: "HTTP",
    concept: "HTTP — שפת התקשורת של הWeb",
    context: (
      <div>
        <p className="text-[13.5px] leading-[1.7] mb-4" style={{ color: "rgba(0,0,0,0.62)" }}>
          TCP פתח חיבור אמין. עכשיו הדפדפן ושרת גוגל צריכים <strong>לדבר</strong> — אבל באיזה שפה? כאן נכנס HTTP.
        </p>

        {/* What is HTTP */}
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
          <div className="text-[13px] font-black mb-1" style={{ color: NAVY }}>HTTP — HyperText Transfer Protocol</div>
          <div className="text-[12px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.6)" }}>
            <strong>פרוטוקול</strong> = שפה + כללים שמוסכמים מראש. HTTP הוא השפה שבה דפדפנים ושרתים מדברים — כמו שיחה מובנית: "תני לי את הדף", "הנה הדף".
          </div>
        </div>

        {/* HTTP vs HTTPS */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: "#dc2626" }}>🔓 HTTP</div>
            <div className="text-[10px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.5)" }}>
              תקשורת גלויה — כל אחד שמאזין ברשת יכול לקרוא את המידע
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="text-[12px] font-black mb-1" style={{ color: "#15803d" }}>🔒 HTTPS</div>
            <div className="text-[10px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.5)" }}>
              HTTP + הצפנה (TLS). כל אתר רציני היום משתמש ב-HTTPS
            </div>
          </div>
        </div>

        {/* Request/Response flow */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>שיחת HTTP — Request → Response</div>
        <TerminalCard lines={[
          { text: "── הדפדפן שואל (Request) ──────────────", color: "#64748b" },
          { text: "GET / HTTP/1.1", color: "#60a5fa" },
          { text: "Host: google.com", color: "#94a3b8" },
          { text: "Accept: text/html", color: "#94a3b8" },
          { text: "" },
          { text: "── גוגל עונה (Response) ────────────────", color: "#64748b" },
          { text: "HTTP/1.1 200 OK", color: "#22c55e" },
          { text: "Content-Type: text/html", color: "#94a3b8" },
          { text: "[HTML content — הדף עצמו...]", color: "#94a3b8" },
        ]} />

        {/* HTTP Methods */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>סוגי בקשות HTTP נפוצות</div>
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          {[
            { method: "GET", color: "#2563eb", desc: "תביא לי משהו", ex: "פתיחת דף אינטרנט" },
            { method: "POST", color: "#16a34a", desc: "שלח מידע חדש", ex: "הגשת טופס / כניסה לאתר" },
            { method: "PUT", color: "#d97706", desc: "עדכן משהו קיים", ex: "שמירת עריכה בפרופיל" },
            { method: "DELETE", color: "#dc2626", desc: "מחק", ex: "מחיקת פוסט" },
          ].map((m, i, arr) => (
            <div key={m.method} className="flex items-center gap-3 px-3 py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              <span className="font-mono font-black text-[11px] w-14 shrink-0" style={{ color: m.color }}>{m.method}</span>
              <span className="text-[11px] shrink-0" style={{ color: "rgba(0,0,0,0.65)" }}>{m.desc}</span>
              <span className="text-[10px] mr-auto" style={{ color: "rgba(0,0,0,0.35)" }}>{m.ex}</span>
            </div>
          ))}
        </div>

        {/* Status Codes */}
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>קודי תשובה (Status Codes) — מה הם אומרים?</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          {[
            { code: "200 OK",          color: "#15803d", bg: "rgba(34,197,94,0.05)",   desc: "הצלחה — הנה מה שביקשת" },
            { code: "301 Redirect",    color: "#d97706", bg: "rgba(251,191,36,0.05)",  desc: "הדף עבר — אני מפנה אותך" },
            { code: "404 Not Found",   color: "#9333ea", bg: "rgba(147,51,234,0.05)",  desc: "הדף לא קיים" },
            { code: "403 Forbidden",   color: "#dc2626", bg: "rgba(239,68,68,0.05)",   desc: "אין לך הרשאה" },
            { code: "500 Server Error",color: "#b91c1c", bg: "rgba(220,38,38,0.07)",   desc: "השרת קרס / שגיאה פנימית" },
          ].map((s, i, arr) => (
            <div key={s.code} className="flex items-center gap-3 px-3 py-2.5"
              style={{ background: s.bg, borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
              <span className="font-mono font-black text-[11px] w-28 shrink-0" style={{ color: s.color }}>{s.code}</span>
              <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.65)" }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    question: "פתחת אתר של לקוח — הדפדפן מציג שגיאה. איזה status code מעיד שהאתר עצמו קרס (ולא שהכתובת שגויה)?",
    options: [
      "404 — הדף לא נמצא",
      "500 — שגיאת שרת פנימית",
      "301 — הדף עבר",
    ],
    correct: 1,
    okMsg: "נכון! 500 = השרת קרס מבפנים — בעיה בקוד, בDB, בזיכרון. 404 = הכתובת לא קיימת. כNetwork Engineer, 500 מיידית מסמן שצריך לבדוק logs בשרת.",
    errMsg: "500 הוא הקוד שמעיד על קריסה פנימית של השרת. 404 = כתובת שגויה. ההבדל חשוב — 500 אומר שהשרת חי אבל יש בו שגיאה.",
  },
];

// ─── Choice step renderer ─────────────────────────────────────────────────────

function ChoiceStepUI({
  step,
  onAnswer,
}: {
  step: ChoiceStep;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  function handlePick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(i === step.correct);
  }

  const answered = picked !== null;

  return (
    <div>
      {step.context}
      <div className="text-[13.5px] font-bold mb-4" style={{ color: NAVY }}>{step.question}</div>
      <div className="flex flex-col gap-3 mb-4">
        {step.options.map((opt, i) => {
          const isCorrect = i === step.correct;
          const isPicked = i === picked;
          let bg = "#fff";
          let border = "1.5px solid rgba(0,0,0,0.08)";
          let textColor = "rgba(0,0,0,0.75)";

          if (answered) {
            if (isCorrect) { bg = "rgba(34,197,94,0.08)"; border = "1.5px solid #22c55e55"; textColor = "#15803d"; }
            else if (isPicked) { bg = "rgba(220,38,38,0.07)"; border = "1.5px solid #dc262644"; textColor = "#b91c1c"; }
            else { textColor = "rgba(0,0,0,0.35)"; }
          } else if (isPicked) {
            border = `1.5px solid ${BLUE}`;
          }

          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => handlePick(i)}
              className="text-right w-full"
            >
              <div className="rounded-xl px-4 py-3 text-[13px] leading-[1.5] transition-all"
                style={{ background: bg, border, color: textColor }}>
                {answered && isCorrect && "✓ "}{answered && isPicked && !isCorrect && "✗ "}{opt}
              </div>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-5"
          style={{
            background: picked === step.correct ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
            border: `1px solid ${picked === step.correct ? "#22c55e55" : "#dc262644"}`,
            color: picked === step.correct ? "#15803d" : "#b91c1c",
          }}>
          {picked === step.correct ? step.okMsg : step.errMsg}
        </div>
      )}
    </div>
  );
}

// ─── Sequence step renderer ───────────────────────────────────────────────────

function SequenceStepUI({
  step,
  onAnswer,
}: {
  step: SequenceStep;
  onAnswer: (correct: boolean) => void;
}) {
  const [order, setOrder] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  function handleTap(idx: number) {
    if (submitted) return;
    if (order.includes(idx)) {
      setOrder((o) => o.filter((x) => x !== idx));
    } else {
      const newOrder = [...order, idx];
      setOrder(newOrder);
      if (newOrder.length === step.items.length) {
        const isCorrect = newOrder.every((v, i) => v === step.correctOrder[i]);
        setCorrect(isCorrect);
        setSubmitted(true);
        onAnswer(isCorrect);
      }
    }
  }

  return (
    <div>
      {step.context}
      <div className="text-[13px] font-bold mb-3" style={{ color: NAVY }}>{step.instruction}</div>

      {/* Ordered list */}
      {order.length > 0 && (
        <div className="rounded-xl p-3 mb-3 flex flex-col gap-1.5"
          style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>הסדר שלך:</div>
          {order.map((idx, pos) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ background: BLUE }}>{pos + 1}</span>
              <span className="text-[12.5px]" style={{ color: NAVY }}>{step.items[idx]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Available items */}
      {!submitted && (
        <div className="flex flex-col gap-2 mb-4">
          {step.items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleTap(idx)}
              disabled={submitted}
              className="text-right rounded-xl px-4 py-3 text-[13px] transition-all"
              style={{
                background: order.includes(idx) ? "rgba(59,130,246,0.1)" : "#fff",
                border: `1.5px solid ${order.includes(idx) ? BLUE : "rgba(0,0,0,0.08)"}`,
                color: order.includes(idx) ? BLUE : "rgba(0,0,0,0.75)",
                opacity: order.includes(idx) ? 0.6 : 1,
              }}>
              {order.includes(idx) ? `✓ ${item}` : item}
            </button>
          ))}
        </div>
      )}

      {submitted && (
        <div className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.55] mb-5"
          style={{
            background: correct ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.07)",
            border: `1px solid ${correct ? "#22c55e55" : "#dc262644"}`,
            color: correct ? "#15803d" : "#b91c1c",
          }}>
          {correct ? step.okMsg : step.errMsg}
        </div>
      )}
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({ score, answers }: { score: number; answers: boolean[] }) {
  const pct = Math.round((score / STEPS.length) * 100);

  function saveAndGo(href: string) {
    try {
      const journey = JSON.parse(localStorage.getItem("networks-journey") || "{}");
      localStorage.setItem("networks-journey", JSON.stringify({ ...journey, sim: true }));
    } catch {/* ignore */}
    window.location.href = href;
  }

  return (
    <div className="px-[22px] pt-7 pb-36">
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="text-[52px] mb-2">{pct >= 80 ? "🌐" : pct >= 55 ? "💪" : "🌱"}</div>
        <div className="text-[26px] leading-tight mb-1" style={{ color: NAVY, ...HEEBO }}>
          {pct >= 80 ? "מעולה! הבנת את הבסיס" : pct >= 55 ? "כל packet מתחיל כך" : "התחלה טובה — זה מגיע"}
        </div>
        <div className="text-[13px]" style={{ color: "rgba(0,0,0,0.4)" }}>
          {score} מתוך {STEPS.length} · מה קורה כשלוחצים Enter?
        </div>
      </div>

      {/* Skills */}
      <div className="mb-7">
        <div className="text-[15px] font-black mb-1" style={{ color: NAVY }}>5 מושגי יסוד שהפנמת היום ✓</div>
        <div className="text-[11.5px] mb-4" style={{ color: "rgba(0,0,0,0.45)" }}>לפני הטעימה — לא הכרת אף אחד מהם</div>
        <div className="flex flex-col gap-3">
          {[
            { label: "DNS", desc: "תרגום שם לכתובת IP" },
            { label: "IP Address", desc: "כתובת ייחודית לכל מכשיר" },
            { label: "Routing", desc: "המסלול של הPacket" },
            { label: "TCP", desc: "חיבור אמין מקצה לקצה" },
            { label: "HTTP", desc: "שפת התקשורת של הWeb" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-[12px] font-bold shrink-0 w-[90px] text-right" style={{ color: NAVY }}>{s.label}</div>
              <div className="rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0"
                style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.3)" }}>לא הכרתי</div>
              <div className="text-[10px] shrink-0" style={{ color: "rgba(0,0,0,0.2)" }}>→</div>
              <div className="rounded-full px-3 py-1 text-[11px] font-black shrink-0 text-white"
                style={{ background: answers[i] ? BLUE : "rgba(59,130,246,0.4)", boxShadow: answers[i] ? "0 2px 8px rgba(59,130,246,0.35)" : "none" }}>
                {answers[i] ? "✓ גיליתי!" : "○ כמעט"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What you learned */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.35)" }}>
          מה קורה בפועל
        </div>
        <div className="flex flex-col gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: answers[i] ? "rgba(34,197,94,0.08)" : "rgba(59,130,246,0.07)", border: `1px solid ${answers[i] ? "#22c55e55" : `${BLUE}44`}` }}>
              <span style={{ color: answers[i] ? "#15803d" : "rgba(0,0,0,0.35)", fontSize: 15 }}>
                {answers[i] ? "✓" : "○"}
              </span>
              <span className="text-[12px]" style={{ color: NAVY }}>{s.concept}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career connection */}
      <div className="mb-7 rounded-2xl p-4"
        style={{ background: "rgba(251,133,0,0.08)", border: "1.5px solid rgba(251,133,0,0.22)" }}>
        <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>
          מה זה אומר לקריירה שלך
        </div>
        <div className="text-[13px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.65)" }}>
          כל פעם שאיש רשתות מאבחן תקלה — הוא עובר בדיוק את 5 השלבים האלו בראש.
          "לא עובד האינטרנט" → DNS? Routing? TCP? HTTP? — זו השפה של התחום.
        </div>
      </div>

      {/* CTAs */}
      <button
        onClick={() => saveAndGo("/explore/networks/learn/day")}
        className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3 text-white"
        style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
        ליום בחיי Network Engineer ←
      </button>
      <button
        onClick={() => saveAndGo("/explore/networks/experience")}
        className="block w-full text-center py-[14px] rounded-xl font-bold text-[15px] mb-3"
        style={{ background: "transparent", border: `1.5px solid ${BLUE}`, color: BLUE, fontFamily: "'Heebo', sans-serif" }}>
        מיציתי את הטעימה — קדימה ←
      </button>
    </div>
  );
}

// ─── Intro screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: BLUE }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/explore/networks" className="text-[12px] font-bold block mb-4" style={{ opacity: 0.82 }}>← חזרה</Link>
          <div className="text-[20px]" style={HEEBO}>מה קורה כשלוחצים Enter?</div>
          <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>לפני שמתחילים — 3 מושגי בסיס</div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
        <p className="text-[13.5px] leading-[1.7] mb-6" style={{ color: "rgba(0,0,0,0.55)" }}>
          כל פעם שאת גולשת — שלושה שחקנים מדברים ביניהם.
          בואי נכיר אותם לפני שנצלול לפנים.
        </p>

        {/* 3 concept cards */}
        <div className="flex flex-col gap-4 mb-7">
          {/* Browser */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid rgba(59,130,246,0.15)" }}>
            <div className="flex items-start gap-3">
              <div className="text-[28px] leading-none mt-0.5">🖥️</div>
              <div>
                <div className="text-[14px] font-black mb-0.5" style={{ color: NAVY }}>דפדפן — Browser</div>
                <div className="text-[12px] font-mono font-bold mb-1.5" style={{ color: BLUE }}>Chrome · Safari · Firefox</div>
                <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.55)" }}>
                  התוכנה על המחשב או הטלפון שלך. כשאת כותבת כתובת — הדפדפן שולח בקשה ומציג את התשובה.
                  <br /><span className="font-bold" style={{ color: "rgba(0,0,0,0.7)" }}>הדפדפן = הלקוח (Client)</span> — הוא מבקש, השרת עונה.
                </div>
              </div>
            </div>
          </div>

          {/* Server */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid rgba(2,62,138,0.15)" }}>
            <div className="flex items-start gap-3">
              <div className="text-[28px] leading-none mt-0.5">🗄️</div>
              <div>
                <div className="text-[14px] font-black mb-0.5" style={{ color: NAVY }}>שרת — Server</div>
                <div className="text-[12px] font-mono font-bold mb-1.5" style={{ color: NAVY }}>מחשב חזק שעובד 24/7</div>
                <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.55)" }}>
                  מחזיק את קבצי האתר ומגיב לבקשות. כשאת נכנסת ל-Google — שרת של גוגל שולח לך את הדף.
                  <br /><span className="font-bold" style={{ color: "rgba(0,0,0,0.7)" }}>שרת = נותן השירות</span> — הוא עונה, הדפדפן מציג.
                </div>
              </div>
            </div>
          </div>

          {/* Cloud */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid rgba(251,133,0,0.2)" }}>
            <div className="flex items-start gap-3">
              <div className="text-[28px] leading-none mt-0.5">☁️</div>
              <div>
                <div className="text-[14px] font-black mb-0.5" style={{ color: "#92400e" }}>שרת ענן — Cloud Server</div>
                <div className="text-[12px] font-mono font-bold mb-1.5" style={{ color: ORANGE }}>AWS · Azure · Google Cloud</div>
                <div className="text-[12px] leading-[1.65]" style={{ color: "rgba(0,0,0,0.55)" }}>
                  שרת שכור בדאטה סנטר גדול — לא בבית, לא במשרד. נגיש מכל העולם, עם גיבוי וזמינות גבוהה.
                  <br /><span className="font-bold" style={{ color: "rgba(0,0,0,0.7)" }}>רוב האתרים כיום רצים בענן</span>.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flow diagram */}
        <div className="rounded-2xl p-4 mb-7" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: BLUE }}>מה קורה כשלוחצים Enter</div>
          <div className="flex items-center justify-center gap-1 flex-wrap text-center" dir="ltr">
            {[
              { icon: "🖥️", label: "Browser" },
              { arrow: "→" },
              { icon: "🌐", label: "DNS" },
              { arrow: "→" },
              { icon: "📡", label: "Router" },
              { arrow: "→" },
              { icon: "🗄️", label: "Server" },
            ].map((item, i) =>
              "arrow" in item ? (
                <span key={i} className="text-[14px] font-black" style={{ color: "rgba(0,0,0,0.2)" }}>{item.arrow}</span>
              ) : (
                <div key={i} className="flex flex-col items-center px-1">
                  <div className="text-[20px]">{item.icon}</div>
                  <div className="text-[9px] font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>{item.label}</div>
                </div>
              )
            )}
          </div>
          <div className="text-[11px] text-center mt-3" style={{ color: "rgba(0,0,0,0.4)" }}>
            בסימולציה נעבור על כל שלב — DNS, Routing, TCP, HTTP
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-[14px] rounded-xl font-bold text-[15px] text-white"
          style={{ background: BLUE, fontFamily: "'Heebo', sans-serif" }}>
          קדימה, מתחילות! ←
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NetworksSimPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [stepAnswered, setStepAnswered] = useState(false);
  const [done, setDone] = useState(false);

  const step = STEPS[stepIndex];
  const pct = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  function handleAnswer(correct: boolean) {
    setStepAnswered(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[stepIndex] = correct;
      return next;
    });
  }

  function handleNext() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      setStepAnswered(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setStepAnswered(true);
    }
  }

  if (showIntro) {
    return <IntroScreen onStart={() => setShowIntro(false)} />;
  }

  if (done) {
    const score = answers.filter(Boolean).length;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
        {/* Header */}
        <div className="text-white px-[22px] pt-6 pb-5" style={{ background: BLUE }}>
          <div className="max-w-[720px] mx-auto">
            <Link href="/explore/networks" className="text-[12px] font-bold block mb-4" style={{ opacity: 0.82 }}>← חזרה</Link>
            <div className="text-[22px]" style={HEEBO}>מה קורה כשלוחצים Enter?</div>
            <div className="text-[12px] mt-1" style={{ opacity: 0.75 }}>סיכום הטעימה</div>
          </div>
        </div>
        <div className="flex-1 max-w-[720px] mx-auto w-full">
          <ResultScreen score={score} answers={answers} />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fbf9f5" }}>
      {/* Header */}
      <div className="text-white px-[22px] pt-6 pb-5 shrink-0" style={{ background: BLUE }}>
        <div className="max-w-[720px] mx-auto">
          <Link href="/explore/networks" className="text-[12px] font-bold block mb-4" style={{ opacity: 0.82 }}>← חזרה</Link>
          <div className="text-[20px]" style={HEEBO}>מה קורה כשלוחצים Enter?</div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ opacity: 0.65 }}>
              <span>שלב {stepIndex + 1} מתוך {STEPS.length}</span>
              <span>{step.tag}</span>
            </div>
            <div className="h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: "#fff" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-[22px] pt-6 pb-32">
        {/* Concept badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5"
          style={{ background: "rgba(59,130,246,0.08)", border: `1px solid rgba(59,130,246,0.18)` }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BLUE }}>מושג</span>
          <span className="text-[11px] font-bold" style={{ color: NAVY }}>{step.concept}</span>
        </div>

        {step.kind === "choice" && (
          <ChoiceStepUI
            key={stepIndex}
            step={step}
            onAnswer={handleAnswer}
          />
        )}
        {step.kind === "sequence" && (
          <SequenceStepUI
            key={stepIndex}
            step={step}
            onAnswer={handleAnswer}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 inset-x-0 flex gap-3 px-5 pb-[76px] pt-3"
        style={{ background: "linear-gradient(to top, #fbf9f5 80%, transparent)" }}>
        {stepIndex > 0 && (
          <button type="button" onClick={handleBack}
            className="py-[13px] px-5 rounded-xl font-bold text-[14px]"
            style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)", fontFamily: "'Heebo', sans-serif" }}>
            ← חזרה
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!stepAnswered}
          className="flex-1 py-[13px] rounded-xl font-bold text-[15px] text-white transition-all"
          style={{
            background: stepAnswered ? ORANGE : "rgba(0,0,0,0.1)",
            color: stepAnswered ? "#fff" : "rgba(0,0,0,0.3)",
            fontFamily: "'Heebo', sans-serif",
          }}>
          {stepIndex < STEPS.length - 1 ? "המשך ←" : "לסיכום ←"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
