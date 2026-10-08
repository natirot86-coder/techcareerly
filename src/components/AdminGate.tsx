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
import { sendCoordinatorOtp, verifyCoordinatorOtp, saveLegacyCode, getCoordinatorIdentity, breakGlassActive, coordinatorSignOut } from "@/lib/coordinatorAuth";

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
  /* באנר קבוע כל עוד הכניסה היא בקוד החירום — חירום שנראה כמו חירום לא הופך לשגרה */
  const [emergency, setEmergency] = useState(false);
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

  /*
   * 🐛 **הכניסה בקוד נשברה ב-5.10 ברגע שהוספתי לה תפוגה של 24 שעות.** השרת
   * דורש `x-coordinator-since`, והבדיקה הזאת מעולם לא שלחה אותו — כי
   * `saveLegacyCode` (ששומר את החותמת) רץ רק **אחרי** שהאימות הצליח.
   * כלומר הקוד היה תקין לגמרי והמסך החזיר "קוד שגוי" לכולם. נתפס כשנתי
   * ניסה להיכנס מחו״ל.
   *
   * ⚠️ והלקח: **תפוגה שמסתמכת על ערך שהלקוח שולח חייבת להיבדק גם במסלול
   * שיוצר אותו.** `since` נשלח כאן כ"עכשיו", וזו האמת — זה בדיוק רגע
   * הכניסה.
   */
  async function verifyLegacy(c: string, since = Date.now()): Promise<boolean> {
    try {
      const r = await fetch("/api/admin-auth", {
        headers: { "x-coordinator-code": c, "x-coordinator-since": String(since) },
      });
      if (r.status === 503) { setLegacyError("הקוד עוד לא הוגדר בשרת (COORDINATOR_CODE)"); return false; }
      /*
        ⚠️ **ההודעה מהשרת ולא "קוד שגוי" גנרי** (8.10). נתי ניסה להיכנס
        מחו״ל, קיבל "קוד שגוי", והקוד היה תקין לגמרי — הכשל היה בחותמת
        שלא נשלחה. **הודעה גנרית שולחת לחפש במקום הלא נכון.**
      */
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        if (j?.error && j.error !== "unauthorized") setLegacyError(j.error);
      }
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
    /*
      כניסת חירום — תקפה 24 שעות בלבד (נתי, 5.10). הקוד נבנה כגיבוי ליום
      שבו ה-SMS לא עבד; 019 מחובר מ-4.10, וקוד שנשאר בדפדפן **לנצח** הוא
      מה שהפך גיבוי חירום לדרך הכניסה הרגילה — ואיתה גם "כל אחד רואה את
      של כולם", כי הקוד אינו זהות.
    */
    if (localStorage.getItem(LEGACY_KEY) && !breakGlassActive()) {
      localStorage.removeItem(LEGACY_KEY);
      localStorage.removeItem("coordinator-code-since");
      setLegacyError("כניסת החירום פגה אחרי 24 שעות — עדיף להיכנס עם הטלפון שלך");
      setShowLegacy(true);
      setState("locked");
      return;
    }
    const saved = localStorage.getItem(LEGACY_KEY);
    if (saved) {
      /* בטעינה — החותמת השמורה, אחרת התפוגה לא תתרחש לעולם */
      const ok = await verifyLegacy(saved, Number(localStorage.getItem("coordinator-code-since") ?? "0"));
      if (ok) { setState("open"); setEmergency(true); return; }
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

  if (state === "open") return (
    <>
      {/*
        באנר קבוע ולא התראה חולפת: כל עוד מישהו עובד בקוד החירום, **אין לנו
        מושג מי הוא** והוא רואה את כל הרכזות. זה בסדר לשעה של תקלה, וזה לא
        בסדר כברירת מחדל — ובאנר שלא נעלם הוא מה שמבדיל ביניהם.
      */}
      {emergency && (
        <div dir="rtl" style={{
          background: "#b91c1c", color: "#fff", padding: "9px 16px",
          fontSize: 12.5, fontWeight: 700, lineHeight: 1.6, textAlign: "center",
          fontFamily: "'Heebo', sans-serif",
        }}>
          נכנסת בקוד חירום — אין זהות אישית, והתצוגה כוללת את כל הרכזות.
          הכניסה תפוג תוך 24 שעות.{" "}
          <button onClick={() => { coordinatorSignOut().then(() => location.reload()); }}
            style={{ background: "none", border: "none", color: "#fff", textDecoration: "underline",
              cursor: "pointer", fontWeight: 900, fontFamily: "inherit", fontSize: "inherit" }}>
            כניסה עם הטלפון שלי
          </button>
        </div>
      )}
      {children}
    </>
  );
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
