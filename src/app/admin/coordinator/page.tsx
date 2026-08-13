/**
 * /admin/coordinator — מסך הרכזת: תור החילוץ.
 *
 * כוכב הצפון: **"מי צריך אותי היום."** לא CRM ולא טבלת כולם — רשימה ממוינת
 * לפי דחיפות, וכל שורה היא אדם + הסיגנל במילים + פעולה אחת.
 *
 * מה שבכוונה אין כאן: ציונים, אחוזים, השוואות בין מועמדים. המסך משרת
 * התערבות, לא הערכה — ברגע שרכזת מדרגת אנשים, המספרים הופכים למטרה.
 *
 * הנתונים מ-/api/coordinator (צד שרת, מפתח סודי). הגישה בקוד רכזת שנשמר
 * מקומית אחרי הזנה ראשונה — שכבת הגנה מינימלית עד שיהיה Auth אמיתי.
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const SEV_META: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "דחוף", color: "#b91c1c", bg: "rgba(220,38,38,0.08)" },
  2: { label: "שווה פנייה", color: "#92400e", bg: "rgba(251,133,0,0.09)" },
  3: { label: "שיחה מחזקת", color: "#0369a1", bg: "rgba(14,165,233,0.08)" },
};

const EVENT_LABEL: Record<string, string> = {
  meeting_booked: "קבע/ה פגישה",
  meeting1_checkin: "צ'ק-אין אחרי פגישה 1",
  paths_question: "ענה/תה על שאלה בשאלון המסלולים",
  paths_quiz_done: "סיים/ה את שאלון המסלולים",
  plan_money_opened: "פתח/ה את מסך החשבון",
  scct_done: "סיים/ה כלי עיבוד חוויה",
  sim_start: "נכנס/ה לסימולציה",
  waiting_taste_done: "סיים/ה את שתי הדקות",
  waiting_taste_start: "התחיל/ה את שתי הדקות",
  waiting_prep_open: "קרא/ה את ההכנה לפגישה",
  waiting_booked_self_declared: "סימן/ה 'כבר קבעתי'",
  plan_update_sent: "שלח/ה עדכון לרכזת",
  plan_intro_done: "נכנס/ה לשלב התוכנית",
};

type Person = {
  id: string; name: string; anonymous: boolean; region: string | null;
  stage: number; domain: string | null; lastActive: string;
  signals: { severity: 1 | 2 | 3; reason: string; action: string }[];
  timeline: { name: string; props: Record<string, unknown>; at: string }[];
};

export default function CoordinatorPage() {
  const [code, setCode] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [data, setData] = useState<{ needsAttention: Person[]; quiet: number; total: number; generatedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setCode(localStorage.getItem("coordinator-code")); }, []);

  const load = useCallback(async (c: string) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/coordinator", { headers: { "x-coordinator-code": c } });
      if (r.status === 401) { setError("קוד שגוי"); localStorage.removeItem("coordinator-code"); setCode(null); return; }
      if (r.status === 503) { setError((await r.json()).error); return; }
      if (!r.ok) { setError(`שגיאה ${r.status}`); return; }
      setData(await r.json());
    } catch { setError("שגיאת רשת"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (code) load(code); }, [code, load]);

  if (!code) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 360, width: "100%", background: "#fff", borderRadius: 18, padding: 26, border: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 20, ...HEEBO, color: NAVY }}>מסך הרכזת</div>
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", lineHeight: 1.7, marginTop: 8 }}>
            המסך מציג נתונים אישיים של מועמדים, ולכן דורש קוד גישה.
          </p>
          <input
            type="password" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && draft) { localStorage.setItem("coordinator-code", draft); setCode(draft); } }}
            placeholder="קוד רכזת"
            style={{ width: "100%", marginTop: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 15 }}
          />
          <button
            onClick={() => { if (draft) { localStorage.setItem("coordinator-code", draft); setCode(draft); } }}
            style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            כניסה
          </button>
          {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c" }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef" }}>
      <div style={{ background: NAVY, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link href="/map" style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>← למפת האפליקציה</Link>
          <div style={{ fontSize: 26, marginTop: 8, ...HEEBO }}>מי צריך אותי היום</div>
          {data && (
            <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.7 }}>
              {data.needsAttention.length} דורשים תשומת לב · {data.quiet} בסדר גמור · {data.total} סה״כ
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px 60px" }}>
        {error && (
          <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#b91c1c", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7 }}>
            {error === "SUPABASE_SECRET_KEY not configured" ? (
              <><b>המפתח הסודי עוד לא בוורסל.</b> Settings → Environment Variables → להוסיף SUPABASE_SECRET_KEY (הערך מ-Supabase → API Keys → server_side_app) ולעשות deploy.</>
            ) : error === "COORDINATOR_CODE not configured" ? (
              <><b>קוד הרכזת עוד לא הוגדר.</b> להוסיף COORDINATOR_CODE ב-Vercel — זה הקוד שרכזות יזינו כאן.</>
            ) : error}
          </div>
        )}

        {loading && <div style={{ padding: 30, textAlign: "center", color: "rgba(0,0,0,0.4)" }}>טוען…</div>}

        {data && data.needsAttention.length === 0 && !loading && (
          <div style={{ background: "#eef8f3", border: "1px solid #cfe9dd", color: "#08694c", borderRadius: 14, padding: 22, textAlign: "center", fontSize: 15, fontWeight: 700 }}>
            אף אחד לא תקוע כרגע 🎉
          </div>
        )}

        {data?.needsAttention.map(p => {
          const sev = SEV_META[p.signals[0]?.severity ?? 3];
          const isOpen = open === p.id;
          return (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${sev.color}33`, marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => setOpen(isOpen ? null : p.id)}
                style={{ width: "100%", textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: sev.bg, color: sev.color }}>{sev.label}</span>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: "#1c1a16" }}>{p.name}</span>
                  {p.anonymous && <span style={{ fontSize: 10.5, color: "rgba(0,0,0,0.35)" }}>(עוד לא השלים/ה שאלון)</span>}
                  <span style={{ fontSize: 11.5, color: "rgba(0,0,0,0.4)" }}>
                    שלב {p.stage}{p.region ? ` · ${p.region}` : ""}{p.domain ? ` · ${p.domain}` : ""}
                  </span>
                </div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                  {p.signals.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(0,0,0,0.7)" }}>
                      {s.severity === 1 ? "🔴" : s.severity === 2 ? "🟠" : "🔵"} {s.reason}
                    </div>
                  ))}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "12px 16px", background: "#fcfbf9" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,0.4)", marginBottom: 8 }}>
                    ציר הזמן — מה שקרה, מהחדש לישן. חמש דקות לפני שיחה, זה מה שקוראים
                  </div>
                  {p.timeline.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.4)" }}>אין עדיין אירועים</div>}
                  {p.timeline.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", fontSize: 12.5, color: "rgba(0,0,0,0.65)" }}>
                      <span style={{ color: "rgba(0,0,0,0.35)", flexShrink: 0, direction: "ltr" }}>
                        {new Date(e.at).toLocaleDateString("he-IL")} {new Date(e.at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>{EVENT_LABEL[e.name] ?? e.name}{e.props && Object.keys(e.props).length ? ` · ${Object.values(e.props).join(", ")}` : ""}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 11.5, color: "rgba(0,0,0,0.4)", lineHeight: 1.6 }}>
                    טלפון יופיע כאן כשיחובר Phone OTP — עד אז הזיהוי דרך השם והשלב.
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {data && (
          <button onClick={() => load(code)} style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.14)", background: "#fff", color: NAVY, cursor: "pointer" }}>
            רענון
          </button>
        )}
      </div>
    </div>
  );
}
