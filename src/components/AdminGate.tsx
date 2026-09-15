"use client";

/**
 * שער כניסה ללוחות הניהול (נבנה מחדש 7.9.2026).
 *
 * עד עכשיו הדרך היחידה הייתה קוד משותף אחד לכל הרכזות — לא זהות, סיסמה.
 * עכשיו הדרך הראשית היא כניסה עם מספר טלפון + קוד SMS, בדיוק כמו שמועמד/ת
 * נכנסים — מותאם מול טבלת הרכזות בשרת (src/lib/serverCoordinatorAuth.ts).
 * הקוד הישן נשאר כגיבוי חירום מקופל, לא נעלם: אם ה-SMS נופל או רכזת
 * חדשה עוד לא הוזנה בסגל, עדיין אפשר להיכנס.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sendCoordinatorOtp, verifyCoordinatorOtp, saveLegacyCode, getCoordinatorIdentity } from "@/lib/coordinatorAuth";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };
const NAVY = "#023e8a";
const LEGACY_KEY = "coordinator-code";

function toE164(localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "");
  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  return `+972${withoutLeadingZero}`;
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [showLegacy, setShowLegacy] = useState(false);

  // מצב הכניסה עם טלפון
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // מצב הגיבוי הישן
  const [draft, setDraft] = useState("");
  const [legacyError, setLegacyError] = useState<string | null>(null);

  async function verifyLegacy(c: string): Promise<boolean> {
    try {
      const r = await fetch("/api/admin-auth", { headers: { "x-coordinator-code": c } });
      if (r.status === 503) { setLegacyError("הקוד עוד לא הוגדר בשרת (COORDINATOR_CODE)"); return false; }
      return r.ok;
    } catch { setLegacyError("שגיאת רשת"); return false; }
  }

  async function checkAccess() {
    // קודם ננסה session אישי — אם יש רכזת מזוהה מכניסה קודמת בדפדפן הזה
    if (supabase && getCoordinatorIdentity()) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          const r = await fetch("/api/admin-auth", { headers: { Authorization: `Bearer ${session.access_token}` } });
          if (r.ok) { setState("open"); return; }
        } catch { /* נופלים לניסיון הבא */ }
      }
    }
    // גיבוי חירום — הקוד הישן
    const saved = localStorage.getItem(LEGACY_KEY);
    if (saved) {
      const ok = await verifyLegacy(saved);
      if (ok) { setState("open"); return; }
      localStorage.removeItem(LEGACY_KEY);
    }
    setState("locked");
  }

  useEffect(() => { checkAccess(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const phoneValid = phone.replace(/\D/g, "").length >= 9;
  const codeValid = code.trim().length >= 4;

  async function handleSendOtp() {
    setLoading(true);
    setError(null);
    const err = await sendCoordinatorOtp(toE164(phone));
    setLoading(false);
    if (err) { setError(err); return; }
    setStep("otp");
  }

  async function handleVerify() {
    setLoading(true);
    setError(null);
    const err = await verifyCoordinatorOtp(toE164(phone), code.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    setState("open");
  }

  async function submitLegacy() {
    if (!draft) return;
    setLegacyError(null);
    if (await verifyLegacy(draft)) {
      saveLegacyCode(draft);
      setState("open");
    } else {
      setLegacyError(e => e ?? "קוד שגוי");
    }
  }

  if (state === "open") return <>{children}</>;
  if (state === "checking") return <div style={{ minHeight: "100vh", background: "#f5f3ef" }} />;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 360, width: "100%", background: "#fff", borderRadius: 18, padding: 26, border: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 20, ...HEEBO, color: NAVY }}>כניסת רכזת</div>
        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", lineHeight: 1.7, marginTop: 8 }}>
          {step === "phone" ? "הזינו את מספר הטלפון הרשום בסגל הרכזות" : `שלחנו קוד למספר ${toE164(phone)}`}
        </p>

        {step === "phone" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }} dir="ltr">
              <div style={{ display: "flex", alignItems: "center", padding: "0 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", background: "rgba(2,62,138,0.04)", fontSize: 14, fontWeight: 700, color: NAVY }}>
                +972
              </div>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && phoneValid) handleSendOtp(); }}
                placeholder="50-1234567"
                style={{ flex: 1, minWidth: 0, padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 15 }}
              />
            </div>
            {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c" }}>{error}</div>}
            <button
              onClick={handleSendOtp}
              disabled={!phoneValid || loading}
              style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontSize: 15, cursor: phoneValid ? "pointer" : "not-allowed", opacity: phoneValid ? 1 : 0.5, ...HEEBO }}
            >
              {loading ? "שולח..." : "שליחת קוד"}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              dir="ltr"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && codeValid) handleVerify(); }}
              placeholder="12345"
              autoFocus
              style={{ width: "100%", marginTop: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 15, textAlign: "center" }}
            />
            {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c" }}>{error}</div>}
            <button
              onClick={handleVerify}
              disabled={!codeValid || loading}
              style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontSize: 15, cursor: codeValid ? "pointer" : "not-allowed", opacity: codeValid ? 1 : 0.5, ...HEEBO }}
            >
              {loading ? "מאמת..." : "כניסה"}
            </button>
            <button
              onClick={() => { setStep("phone"); setCode(""); setError(null); }}
              style={{ width: "100%", marginTop: 8, padding: 8, border: "none", background: "transparent", color: "rgba(0,0,0,0.4)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            >
              שינוי מספר טלפון
            </button>
          </>
        )}

        <button
          onClick={() => setShowLegacy(v => !v)}
          style={{ width: "100%", marginTop: 18, padding: 0, border: "none", background: "transparent", color: "rgba(0,0,0,0.35)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", textAlign: "center" }}
        >
          {showLegacy ? "▲ הסתרה" : "▾ יש לי קוד גישה זמני"}
        </button>

        {showLegacy && (
          <div style={{ marginTop: 10, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <input
              type="password"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitLegacy(); }}
              placeholder="קוד גישה זמני"
              style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 15 }}
            />
            <button
              onClick={submitLegacy}
              style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", background: "transparent", color: "rgba(0,0,0,0.6)", fontSize: 13.5, cursor: "pointer", ...HEEBO }}
            >
              כניסה עם קוד זמני
            </button>
            {legacyError && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c" }}>{legacyError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
