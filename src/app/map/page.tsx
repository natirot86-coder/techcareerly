/**
 * /map — מפת מסכי האפליקציה
 *
 * כדי להוסיף מסך חדש: הוסף אובייקט ל-SCREENS_MAP בקבוצה הרלוונטית.
 * כדי להוסיף קבוצה חדשה: הוסף entry ל-GROUPS.
 */

import Link from "next/link";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// ─── Data ────────────────────────────────────────────────────────────────────

type Screen = {
  label: string;        // שם המסך
  url: string;          // URL מלא
  desc?: string;        // תיאור קצר
  badge?: string;       // "בקרוב" / "חדש" / "מתקדם"
  badgeColor?: string;
};

type Group = {
  id: string;
  title: string;
  color: string;        // צבע הקבוצה
  screens: Screen[];
  note?: string;        // הערה על הקבוצה
};

const BASE = "https://hasifaapp.vercel.app";

const GROUPS: Group[] = [
  {
    id: "auth",
    title: "כניסה והרשמה",
    color: "#023e8a",
    screens: [
      { label: "כניסה", url: `${BASE}/login`, desc: "SMS OTP · מסך ראשון" },
      { label: "אונבורדינג", url: `${BASE}/onboarding`, desc: "שאלון אישי · 5 שלבים · שמור לDB" },
    ],
  },
  {
    id: "dashboard",
    title: "דשבורד — מפת הדרכים",
    color: "#023e8a",
    note: "6 שלבים במסע המועמד",
    screens: [
      { label: "דשבורד", url: `${BASE}/dashboard`, desc: "שלב 1–6 · progress summary · משימות מ-Supabase" },
    ],
  },
  {
    id: "bottom-nav",
    title: "ניווט תחתון",
    color: "#6b7280",
    screens: [
      { label: "AI Co-pilot", url: `${BASE}/chat`,    desc: "צ׳אט עם AI", badge: "בקרוב", badgeColor: "#6b7280" },
      { label: "קהילה",       url: `${BASE}/squad`,   desc: "Squad ועמיתים", badge: "בקרוב", badgeColor: "#6b7280" },
      { label: "רכזת",        url: `${BASE}/contact`, desc: "יצירת קשר", badge: "בקרוב", badgeColor: "#6b7280" },
    ],
  },
  {
    id: "explore",
    title: "חקר תחומים",
    color: "#fb8500",
    note: "שלב 3 במסע",
    screens: [
      { label: "דירוג תחומים", url: `${BASE}/explore`, desc: "בחר ודרג 6 תחומים לפי עניין" },
      { label: "קוד",          url: `${BASE}/explore/code`,      desc: "פיתוח Full Stack" },
      { label: "דאטה",         url: `${BASE}/explore/data`,      desc: "Data Analytics" },
      { label: "מרקטינג",      url: `${BASE}/explore/marketing`, desc: "Digital Marketing" },
      { label: "AI",           url: `${BASE}/explore/ai`,        desc: "Artificial Intelligence" },
      { label: "סייבר",        url: `${BASE}/explore/cyber`,     desc: "Cybersecurity" },
      { label: "UX",           url: `${BASE}/explore/ux`,        desc: "UX Design" },
    ],
  },
  {
    id: "simulations",
    title: "סימולציות",
    color: "#fb8500",
    note: "4 שלבים לכל תחום · שמור ל-simulation_progress",
    screens: [
      { label: "סימולציית קוד",      url: `${BASE}/explore/code/sim` },
      { label: "סימולציית דאטה",     url: `${BASE}/explore/data/sim` },
      { label: "סימולציית מרקטינג",  url: `${BASE}/explore/marketing/sim` },
      { label: "סימולציית AI",       url: `${BASE}/explore/ai/sim` },
      { label: "סימולציית סייבר",    url: `${BASE}/explore/cyber/sim` },
      { label: "סימולציית UX",       url: `${BASE}/explore/ux/sim` },
    ],
  },
  {
    id: "learn",
    title: "מרכז למידה — דאטה",
    color: "#0d9488",
    note: "זמין מדף התחום של דאטה",
    screens: [
      { label: "7 מודולים",          url: `${BASE}/explore/data/learn`,         desc: "חקירה, גרפים, חיזוי, מיון, בנייה, החלטה" },
      { label: "פרשת TechFlow",      url: `${BASE}/explore/data/learn/mystery`, desc: "SQL בדפדפן · חקר DB · האשמה", badge: "חדש", badgeColor: "#0d9488" },
    ],
  },
];

// ─── Flow arrows (connections between groups) ─────────────────────────────────

const FLOW: { from: string; to: string; label?: string }[] = [
  { from: "auth",        to: "dashboard",   label: "לאחר אונבורדינג" },
  { from: "dashboard",   to: "bottom-nav",  label: "ניווט תחתון" },
  { from: "dashboard",   to: "explore",     label: "שלב 3" },
  { from: "explore",     to: "simulations", label: "כפתור בדף התחום" },
  { from: "explore",     to: "learn",       label: "כפתור בדף דאטה" },
];

// ─── Screen Card ─────────────────────────────────────────────────────────────

function ScreenCard({ screen, groupColor }: { screen: Screen; groupColor: string }) {
  return (
    <a
      href={screen.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-3 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "#fff",
        border: `1px solid ${groupColor}22`,
        boxShadow: `0 1px 6px ${groupColor}11`,
        textDecoration: "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-bold" style={{ color: "#1c1c1c" }}>{screen.label}</div>
        {screen.badge && (
          <div className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: screen.badgeColor || groupColor }}>
            {screen.badge}
          </div>
        )}
      </div>
      {screen.desc && (
        <div className="text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(0,0,0,0.45)" }}>
          {screen.desc}
        </div>
      )}
      <div className="text-[10px] mt-1.5 font-mono truncate" style={{ color: groupColor, opacity: 0.7 }}>
        {screen.url.replace("https://hasifaapp.vercel.app", "")}
      </div>
    </a>
  );
}

// ─── Group Card ──────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: Group }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${group.color}22` }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ background: `${group.color}11` }}>
        <div className="text-[13px] font-bold" style={{ color: group.color, ...HEEBO }}>
          {group.title}
        </div>
        {group.note && (
          <div className="text-[10.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>{group.note}</div>
        )}
      </div>
      {/* Screens */}
      <div className="p-3 flex flex-col gap-2" style={{ background: `${group.color}04` }}>
        {group.screens.map(s => (
          <ScreenCard key={s.url} screen={s} groupColor={group.color} />
        ))}
      </div>
    </div>
  );
}

// ─── Arrow ───────────────────────────────────────────────────────────────────

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1 shrink-0">
      <div className="w-[1px] h-[12px]" style={{ background: "rgba(0,0,0,0.15)" }} />
      <div className="text-[18px] leading-none" style={{ color: "rgba(0,0,0,0.25)" }}>↓</div>
      {label && (
        <div className="text-[9px] px-2 py-0.5 rounded-full mt-0.5"
          style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MapPage() {
  // Build a lookup for FLOW arrows
  const arrowAfter: Record<string, string | undefined> = {};
  FLOW.forEach(f => { arrowAfter[f.from] = f.label; });

  return (
    <div className="min-h-screen" style={{ background: "#f5f3ef" }}>
      {/* Header */}
      <div className="bg-navy text-white px-[22px] md:px-12 pt-[26px] pb-[26px]">
        <div className="max-w-[900px] mx-auto">
          <div className="text-[11px] font-bold opacity-50 tracking-widest mb-2">TECHCAREERLY</div>
          <div className="text-[26px] md:text-[32px] leading-tight" style={HEEBO}>מפת האפליקציה</div>
          <div className="text-[13px] mt-1" style={{ opacity: 0.65 }}>
            כל מסך · לחיצה פותחת את המסך · {GROUPS.reduce((acc, g) => acc + g.screens.length, 0)} מסכים סה״כ
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-[22px] md:px-12 py-8">

        {/* Main flow — vertical on mobile, two columns on desktop */}
        <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start">

          {/* Left column: main user journey */}
          <div>
            <div className="text-[11px] font-bold mb-3 tracking-wide" style={{ color: "rgba(0,0,0,0.4)" }}>
              מסע המשתמש הראשי
            </div>
            <div className="flex flex-col">
              {["auth", "dashboard"].map((id, i, arr) => {
                const group = GROUPS.find(g => g.id === id)!;
                const isLast = i === arr.length - 1;
                return (
                  <div key={id}>
                    <GroupCard group={group} />
                    {!isLast && <Arrow label={arrowAfter[id]} />}
                  </div>
                );
              })}
            </div>

            {/* Bottom nav branching */}
            <Arrow label="ניווט תחתון" />
            <GroupCard group={GROUPS.find(g => g.id === "bottom-nav")!} />
          </div>

          {/* Right column: explore + learn */}
          <div>
            <div className="text-[11px] font-bold mb-3 tracking-wide mt-8 md:mt-0" style={{ color: "rgba(0,0,0,0.4)" }}>
              חקר תחומים ולמידה (שלב 3)
            </div>
            <div className="flex flex-col gap-0">
              {["explore", "simulations", "learn"].map((id, i, arr) => {
                const group = GROUPS.find(g => g.id === id)!;
                const isLast = i === arr.length - 1;
                const flow = FLOW.find(f => f.from === (arr[i - 1] ?? "") && f.to === id);
                return (
                  <div key={id}>
                    {i > 0 && <Arrow label={flow?.label} />}
                    <GroupCard group={group} />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Legend */}
        <div className="mt-10 pt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <div className="text-[11px] font-bold mb-3" style={{ color: "rgba(0,0,0,0.4)" }}>מקרא</div>
          <div className="flex flex-wrap gap-3">
            {[
              { color: "#023e8a", label: "Auth + Dashboard" },
              { color: "#fb8500", label: "חקר תחומים + סימולציות" },
              { color: "#0d9488", label: "מרכז למידה" },
              { color: "#6b7280", label: "בקרוב" },
            ].map(({ color, label }) => (
              <div key={color} className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(0,0,0,0.5)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
          <div className="text-[10px] mt-4" style={{ color: "rgba(0,0,0,0.35)" }}>
            לעדכון: src/app/map/page.tsx → הוסף ל-GROUPS
          </div>
        </div>
      </div>
    </div>
  );
}
