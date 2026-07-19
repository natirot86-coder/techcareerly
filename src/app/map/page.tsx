/**
 * /map — מפת ניווט ויזואלית של כל מסכי האפליקציה
 *
 * כל כרטיס = מסך אמיתי · לחיצה = פתיחת המסך · חצים = מעבר בין מסכים
 *
 * להוסיף מסך: הוסף node ל-NODES + edge ל-EDGES
 */
"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Node = {
  id: string;
  label: string;
  sub?: string;          // תיאור קצר
  url: string;
  cx: number;            // center X on canvas
  cy: number;            // center Y on canvas
  w: number;             // width
  h?: number;            // height (default 40)
  color: string;
  badge?: string;
  badgeColor?: string;
};

type Edge = {
  from: string;
  to: string;
  label?: string;        // תיאור המעבר (כפתור / פעולה)
  dashed?: boolean;
  color?: string;
};

// ─── Canvas ───────────────────────────────────────────────────────────────────

const W = 920;
const H = 760;
const NH = 44;   // node height default

// ─── Nodes ────────────────────────────────────────────────────────────────────

const BASE = "https://hasifaapp.vercel.app";

const NODES: Node[] = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  { id: "login",      label: "כניסה",      sub: "SMS OTP",             url: `${BASE}/login`,      cx: 110,  cy: 60,  w: 90,  color: "#023e8a" },
  { id: "onboarding", label: "אונבורדינג", sub: "שאלון אישי",           url: `${BASE}/onboarding`, cx: 300,  cy: 60,  w: 110, color: "#023e8a" },
  { id: "dashboard",  label: "דשבורד",     sub: "6 שלבים במסע",        url: `${BASE}/dashboard`,  cx: 510,  cy: 60,  w: 110, color: "#023e8a" },

  // ── Bottom nav (soon) ─────────────────────────────────────────────────────
  { id: "chat",    label: "AI Co-pilot", sub: "בקרוב", url: `${BASE}/chat`,    cx: 770, cy: 20,  w: 110, color: "#6b7280", badge: "בקרוב", badgeColor: "#6b7280" },
  { id: "squad",   label: "קהילה",       sub: "בקרוב", url: `${BASE}/squad`,   cx: 770, cy: 80,  w: 110, color: "#6b7280", badge: "בקרוב", badgeColor: "#6b7280" },
  { id: "contact", label: "רכזת",        sub: "בקרוב", url: `${BASE}/contact`, cx: 770, cy: 140, w: 110, color: "#6b7280", badge: "בקרוב", badgeColor: "#6b7280" },

  // ── Explore ───────────────────────────────────────────────────────────────
  { id: "explore", label: "חקר תחומים", sub: "דירוג 6 תחומים", url: `${BASE}/explore`, cx: 510, cy: 190, w: 140, color: "#fb8500" },

  // ── Domain pages ──────────────────────────────────────────────────────────
  { id: "d-code",      label: "קוד",       url: `${BASE}/explore/code`,      cx: 60,  cy: 330, w: 72, color: "#fb8500" },
  { id: "d-data",      label: "דאטה",      url: `${BASE}/explore/data`,      cx: 185, cy: 330, w: 72, color: "#fb8500" },
  { id: "d-marketing", label: "מרקטינג",   url: `${BASE}/explore/marketing`, cx: 320, cy: 330, w: 80, color: "#fb8500" },
  { id: "d-ai",        label: "AI",        url: `${BASE}/explore/ai`,        cx: 445, cy: 330, w: 60, color: "#fb8500" },
  { id: "d-cyber",     label: "סייבר",     url: `${BASE}/explore/cyber`,     cx: 560, cy: 330, w: 72, color: "#fb8500" },
  { id: "d-ux",        label: "UX",        url: `${BASE}/explore/ux`,        cx: 665, cy: 330, w: 60, color: "#fb8500" },

  // ── Simulations ───────────────────────────────────────────────────────────
  { id: "s-code",      label: "sim / קוד",      url: `${BASE}/explore/code/sim`,      cx: 60,  cy: 440, w: 90,  color: "#d97706" },
  { id: "s-data",      label: "sim / דאטה",     url: `${BASE}/explore/data/sim`,      cx: 185, cy: 440, w: 90,  color: "#d97706" },
  { id: "s-marketing", label: "sim / מרקטינג",  url: `${BASE}/explore/marketing/sim`, cx: 320, cy: 440, w: 110, color: "#d97706" },
  { id: "s-ai",        label: "sim / AI",       url: `${BASE}/explore/ai/sim`,        cx: 445, cy: 440, w: 80,  color: "#d97706" },
  { id: "s-cyber",     label: "sim / סייבר",    url: `${BASE}/explore/cyber/sim`,     cx: 560, cy: 440, w: 100, color: "#d97706" },
  { id: "s-ux",        label: "sim / UX",       url: `${BASE}/explore/ux/sim`,        cx: 665, cy: 440, w: 80,  color: "#d97706" },

  // ── Learn (data only for now) ─────────────────────────────────────────────
  { id: "learn",   label: "מרכז למידה",   sub: "7 מודולים",       url: `${BASE}/explore/data/learn`,         cx: 185, cy: 560, w: 110, color: "#0d9488" },
  { id: "mystery", label: "פרשת TechFlow", sub: "SQL חקירה",      url: `${BASE}/explore/data/learn/mystery`, cx: 185, cy: 670, w: 130, color: "#0d9488", badge: "חדש", badgeColor: "#0d9488" },
];

// ─── Edges ────────────────────────────────────────────────────────────────────

const EDGES: Edge[] = [
  // Auth flow
  { from: "login",      to: "onboarding", label: "הרשמה" },
  { from: "onboarding", to: "dashboard",  label: "סיום שאלון" },

  // Dashboard → bottom nav
  { from: "dashboard", to: "chat",    dashed: true, color: "#6b7280" },
  { from: "dashboard", to: "squad",   dashed: true, color: "#6b7280" },
  { from: "dashboard", to: "contact", dashed: true, color: "#6b7280" },

  // Dashboard → explore (stage 3)
  { from: "dashboard", to: "explore", label: "שלב 3 — כנס לחקור" },

  // Explore → domains
  { from: "explore", to: "d-code" },
  { from: "explore", to: "d-data" },
  { from: "explore", to: "d-marketing" },
  { from: "explore", to: "d-ai" },
  { from: "explore", to: "d-cyber" },
  { from: "explore", to: "d-ux" },

  // Domains → sims
  { from: "d-code",      to: "s-code",      label: "קדימה לסימולציה" },
  { from: "d-data",      to: "s-data",      label: "קדימה לסימולציה" },
  { from: "d-marketing", to: "s-marketing", label: "קדימה לסימולציה" },
  { from: "d-ai",        to: "s-ai",        label: "קדימה לסימולציה" },
  { from: "d-cyber",     to: "s-cyber",     label: "קדימה לסימולציה" },
  { from: "d-ux",        to: "s-ux",        label: "קדימה לסימולציה" },

  // Data domain → learn
  { from: "d-data", to: "learn", label: "מרכז למידה", color: "#0d9488" },

  // Learn → mystery
  { from: "learn", to: "mystery", label: "מודול SQL", color: "#0d9488" },

  // Sim → next domain (conceptual)
  { from: "s-code", to: "explore", label: "תחום הבא", dashed: true, color: "#d97706" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getNode(id: string): Node | undefined {
  return NODES.find(n => n.id === id);
}

function nodeRect(n: Node) {
  const h = n.h ?? NH;
  return { left: n.cx - n.w / 2, top: n.cy - h / 2, w: n.w, h };
}

// SVG path between two nodes (bottom-center of from → top-center of to)
function edgePath(from: Node, to: Node): string {
  const fh = from.h ?? NH;
  const th = to.h ?? NH;

  const x1 = from.cx;
  const y1 = from.cy + fh / 2 + 2;
  const x2 = to.cx;
  const y2 = to.cy - th / 2 - 2;

  // Straight vertical
  if (Math.abs(x1 - x2) < 10) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // Cubic bezier for curved connections
  const cy1 = y1 + Math.abs(y2 - y1) * 0.45;
  const cy2 = y2 - Math.abs(y2 - y1) * 0.45;
  return `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`;
}

// ─── Node Component ───────────────────────────────────────────────────────────

function FlowNode({ node }: { node: Node }) {
  const r = nodeRect(node);
  const hasSubtitle = !!node.sub;
  const h = hasSubtitle ? 52 : 40;

  return (
    <a
      href={node.url}
      target="_blank"
      rel="noopener noreferrer"
      title={node.label + (node.sub ? " — " + node.sub : "")}
      style={{
        position: "absolute",
        left: r.left,
        top: node.cy - h / 2,
        width: r.w,
        height: h,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        background: "#fff",
        border: `2px solid ${node.color}`,
        boxShadow: `0 2px 8px ${node.color}22`,
        textDecoration: "none",
        cursor: "pointer",
        transition: "transform 0.12s, box-shadow 0.12s",
        zIndex: 2,
        padding: "0 6px",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.06)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 16px ${node.color}44`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 2px 8px ${node.color}22`;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: node.color, textAlign: "center", lineHeight: 1.2, fontFamily: "'Heebo', sans-serif" }}>
          {node.label}
        </span>
        {node.badge && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 99,
            background: node.badgeColor || node.color, color: "#fff", whiteSpace: "nowrap",
          }}>
            {node.badge}
          </span>
        )}
      </div>
      {node.sub && (
        <div style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", marginTop: 2, textAlign: "center" }}>
          {node.sub}
        </div>
      )}
    </a>
  );
}

// ─── SVG Arrows ──────────────────────────────────────────────────────────────

function Arrows() {
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }}
    >
      <defs>
        {/* Arrowhead markers per color */}
        {["#023e8a", "#fb8500", "#d97706", "#0d9488", "#6b7280"].map(c => (
          <marker
            key={c}
            id={`arrow-${c.replace("#", "")}`}
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 7 3.5, 0 7" fill={c} opacity={0.7} />
          </marker>
        ))}
      </defs>

      {EDGES.map((edge, i) => {
        const from = getNode(edge.from);
        const to = getNode(edge.to);
        if (!from || !to) return null;

        const color = edge.color || from.color;
        const markerId = `arrow-${color.replace("#", "")}`;
        const d = edgePath(from, to);

        // Mid point for label
        const fh = from.h ?? NH;
        const th = to.h ?? NH;
        const x1 = from.cx, y1 = from.cy + fh / 2;
        const x2 = to.cx,   y2 = to.cy - th / 2;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={edge.dashed ? 1.5 : 2}
              strokeDasharray={edge.dashed ? "5 4" : undefined}
              opacity={edge.dashed ? 0.45 : 0.7}
              markerEnd={`url(#${markerId})`}
            />
            {edge.label && (
              <text
                x={mx}
                y={my}
                textAnchor="middle"
                fontSize={8}
                fill={color}
                opacity={0.8}
                fontFamily="'Heebo', sans-serif"
                fontWeight="bold"
              >
                <rect x={mx - 28} y={my - 8} width={56} height={11} fill="white" rx={3} opacity={0.85} />
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Section Labels ───────────────────────────────────────────────────────────

const LABELS = [
  { text: "כניסה והרשמה",     x: 10,  y: 10, color: "#023e8a" },
  { text: "ניווט תחתון",      x: 680, y: 10, color: "#6b7280" },
  { text: "חקר תחומים",       x: 10,  y: 195, color: "#fb8500" },
  { text: "דפי תחום (×6)",    x: 10,  y: 285, color: "#fb8500" },
  { text: "סימולציות (×6)",    x: 10,  y: 395, color: "#d97706" },
  { text: "מרכז למידה — דאטה", x: 10,  y: 515, color: "#0d9488" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const totalScreens = NODES.length;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      {/* Header */}
      <div style={{ background: "#023e8a", color: "#fff", padding: "24px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 3, marginBottom: 6 }}>TECHCAREERLY</div>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Heebo', sans-serif" }}>מפת האפליקציה</div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.65 }}>
            {totalScreens} מסכים · לחיצה = פתיחת המסך · חצים = מעבר ניווט אמיתי
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "10px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { color: "#023e8a", label: "Auth + Dashboard" },
            { color: "#fb8500", label: "חקר תחומים" },
            { color: "#d97706", label: "סימולציות" },
            { color: "#0d9488", label: "מרכז למידה" },
            { color: "#6b7280", label: "בקרוב" },
          ].map(({ color, label }) => (
            <div key={color} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(0,0,0,0.55)" }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, background: color }} />
              {label}
            </div>
          ))}
          <div style={{ marginRight: "auto", fontSize: 10, color: "rgba(0,0,0,0.35)" }}>
            עדכון: src/app/map/page.tsx
          </div>
        </div>
      </div>

      {/* Diagram */}
      <div style={{ overflowX: "auto", padding: "24px 16px 40px" }}>
        <div style={{ minWidth: W, margin: "0 auto", maxWidth: W + 40 }}>
          <div style={{ position: "relative", width: W, height: H, margin: "0 auto" }}>
            {/* Background section labels */}
            <svg
              width={W}
              height={H}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }}
            >
              {/* Section separators */}
              <line x1={0} y1={110} x2={650} y2={110} stroke="rgba(0,0,0,0.07)" strokeWidth={1} strokeDasharray="4 3" />
              <line x1={0} y1={275} x2={W}  y2={275} stroke="rgba(0,0,0,0.07)" strokeWidth={1} strokeDasharray="4 3" />
              <line x1={0} y1={385} x2={730} y2={385} stroke="rgba(0,0,0,0.07)" strokeWidth={1} strokeDasharray="4 3" />
              <line x1={0} y1={505} x2={320} y2={505} stroke="rgba(0,0,0,0.07)" strokeWidth={1} strokeDasharray="4 3" />
              <line x1={0} y1={615} x2={320} y2={615} stroke="rgba(0,0,0,0.07)" strokeWidth={1} strokeDasharray="4 3" />

              {LABELS.map(l => (
                <text key={l.text} x={l.x} y={l.y + 10} fontSize={9} fill={l.color} fontWeight={700}
                  fontFamily="'Heebo', sans-serif" opacity={0.6}>
                  {l.text}
                </text>
              ))}
            </svg>

            {/* Arrows (SVG layer) */}
            <Arrows />

            {/* Nodes (HTML layer) */}
            {NODES.map(node => <FlowNode key={node.id} node={node} />)}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ textAlign: "center", padding: "12px 0 32px", fontSize: 10, color: "rgba(0,0,0,0.3)" }}>
        דף זה מתעדכן ידנית · להוספת מסך: NODES + EDGES ב-src/app/map/page.tsx
      </div>
    </div>
  );
}
