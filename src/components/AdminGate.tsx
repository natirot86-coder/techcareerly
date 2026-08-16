"use client";

/**
 * שער כניסה ללוחות הניהול. אותו קוד כמו מסך הרכזת (COORDINATOR_CODE),
 * נבדק מול השרת דרך /api/admin-auth ונשמר מקומית אחרי אימות מוצלח —
 * מזינים פעם אחת בכל דפדפן.
 */
import { useState, useEffect } from "react";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const KEY = "coordinator-code";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function verify(code: string): Promise<boolean> {
    try {
      const r = await fetch("/api/admin-auth", { headers: { "x-coordinator-code": code } });
      if (r.status === 503) { setError("הקוד עוד לא הוגדר בשרת (COORDINATOR_CODE)"); return false; }
      return r.ok;
    } catch { setError("שגיאת רשת"); return false; }
  }

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (!saved) { setState("locked"); return; }
    verify(saved).then(ok => {
      if (!ok) localStorage.removeItem(KEY);
      setState(ok ? "open" : "locked");
    });
  }, []);

  async function submit() {
    if (!draft) return;
    setError(null);
    if (await verify(draft)) {
      localStorage.setItem(KEY, draft);
      setState("open");
    } else {
      setError(e => e ?? "קוד שגוי");
    }
  }

  if (state === "open") return <>{children}</>;
  if (state === "checking") return <div style={{ minHeight: "100vh", background: "#f5f3ef" }} />;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 360, width: "100%", background: "#fff", borderRadius: 18, padding: 26, border: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 20, ...HEEBO, color: NAVY }}>אזור ניהול</div>
        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", lineHeight: 1.7, marginTop: 8 }}>
          עריכה ואישור של נתוני האפליקציה. מזינים את הקוד פעם אחת בדפדפן הזה.
        </p>
        <input
          type="password"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="קוד ניהול"
          autoFocus
          style={{ width: "100%", marginTop: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 15 }}
        />
        <button
          onClick={submit}
          style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontSize: 15, cursor: "pointer", ...HEEBO }}
        >
          כניסה
        </button>
        {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c" }}>{error}</div>}
      </div>
    </div>
  );
}
