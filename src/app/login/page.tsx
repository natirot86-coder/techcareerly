"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { sendPhoneOtp, verifyPhoneOtp, signInWithGoogle, supabaseReady } from "@/lib/candidate";
import { LAST_LOCATION_KEY } from "@/components/ResumeTracker";

const HEEBO = { fontFamily: "'Heebo', sans-serif", fontWeight: 900 };

// מספר בדיקה קבוע — עוקף את Supabase (שימושי כל עוד Phone provider לא מוגדר בדשבורד)
const TEST_PHONE = "+972545603636";
const TEST_CODE = "12345";

function toE164(localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "");
  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  return `+972${withoutLeadingZero}`;
}

function TextInput({
  value, onChange, placeholder, type = "text", dir = "rtl",
}: { value: string; onChange: (v: string) => void; placeholder: string; type?: string; dir?: "rtl" | "ltr" }) {
  return (
    <input
      type={type}
      dir={dir}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-xl px-4 py-3 text-[15px] outline-none bg-white text-center tracking-wide"
      style={{ borderColor: value ? "rgba(2,62,138,0.35)" : "rgba(2,62,138,0.18)", color: "#1c1c1c" }}
    />
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.27-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

function IsraelFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" className="shrink-0" aria-hidden="true">
      <rect width="20" height="14" fill="#fff" stroke="rgba(2,62,138,0.15)" />
      <rect y="2" width="20" height="1.6" fill="#0038b8" />
      <rect y="10.4" width="20" height="1.6" fill="#0038b8" />
      <path
        d="M10 5.1 L10.87 6.65 H9.13 Z M10 8.9 L9.13 7.35 H10.87 Z"
        fill="none"
        stroke="#0038b8"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2" dir="ltr">
      <div
        className="flex items-center gap-2 px-3 rounded-xl border shrink-0"
        style={{ borderColor: "rgba(2,62,138,0.18)", background: "rgba(2,62,138,0.04)" }}
      >
        <IsraelFlag />
        <span className="text-[15px] font-bold" style={{ color: "#023e8a" }}>+972</span>
      </div>
      <input
        type="tel"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="50-1234567"
        className="flex-1 min-w-0 border rounded-xl px-4 py-3 text-[15px] outline-none bg-white tracking-wide"
        style={{ borderColor: value ? "rgba(2,62,138,0.35)" : "rgba(2,62,138,0.18)", color: "#1c1c1c" }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneValid = phone.replace(/\D/g, "").length >= 9;
  const codeValid = code.trim().length >= 4;

  // אחרי אימות מוצלח — חוזרים בדיוק לאיפה שהיו (כמו דף הבית), לא תמיד לדשבורד.
  // מי שנזרק ל-login מסך פנימי (טוקן שפג באמצע /paths למשל) חוזר לאותו מסך.
  function goAfterLogin() {
    const last = localStorage.getItem(LAST_LOCATION_KEY);
    router.push(last && last !== "/" ? last : "/dashboard");
  }

  async function handleSendOtp() {
    if (toE164(phone) === TEST_PHONE) {
      setStep("otp");
      return;
    }

    setLoading(true);
    setError(null);
    const err = await sendPhoneOtp(toE164(phone));
    setLoading(false);
    if (err) { setError(err); return; }
    setStep("otp");
  }

  // אותה מטרה כמו goAfterLogin, אבל כתובת מלאה — ה-redirect חוזר מגוגל כטעינת דף מחדש
  function afterLoginUrl(): string {
    const last = localStorage.getItem(LAST_LOCATION_KEY);
    return `${window.location.origin}${last && last !== "/" ? last : "/dashboard"}`;
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    const err = await signInWithGoogle(afterLoginUrl());
    if (err) { setGoogleLoading(false); setError(err); }
    // בהצלחה — הדפדפן כבר מופנה לגוגל, אין צורך לאפס loading
  }

  async function handleVerify() {
    if (toE164(phone) === TEST_PHONE) {
      if (code.trim() !== TEST_CODE) { setError("קוד שגוי"); return; }
      goAfterLogin();
      return;
    }

    setLoading(true);
    setError(null);
    const err = await verifyPhoneOtp(toE164(phone), code.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    goAfterLogin();
  }

  const card = (
    <div className="flex flex-col min-h-full">
      <div className="bg-navy px-[22px] pt-8 pb-10 text-white">
        <div className="text-[11px] opacity-40 font-bold uppercase tracking-widest mb-7">techcareerly</div>
        <div className="text-[30px] leading-tight" style={HEEBO}>
          {step === "phone" ? "כניסה עם מספר טלפון" : "הזן את הקוד שקיבלת"}
        </div>
        <div className="text-[14px] mt-3 leading-relaxed" style={{ opacity: 0.75 }}>
          {step === "phone"
            ? "נשלח לך קוד אימות ב-SMS"
            : `שלחנו קוד למספר ${toE164(phone)}`}
        </div>
      </div>

      <div className="flex-1 px-[22px] py-7 flex flex-col gap-4">
        {!supabaseReady && (
          <div className="text-[13px] rounded-xl px-4 py-3" style={{ background: "rgba(192,57,43,0.08)", color: "#c0392b" }}>
            החיבור ל-Supabase עדיין לא מוגדר (.env.local) — כניסה עם טלפון לא זמינה כרגע.
          </div>
        )}

        {step === "phone" ? (
          <>
            <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>מספר טלפון</label>
            <PhoneInput value={phone} onChange={setPhone} />
            {error && <div className="text-[12.5px]" style={{ color: "#c0392b" }}>{error}</div>}
            <Button variant="orange" onClick={handleSendOtp} disabled={!phoneValid || loading || !supabaseReady}>
              {loading ? "שולח..." : "שלח קוד אימות"}
            </Button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.1)" }} />
              <span className="text-[12px] font-bold" style={{ color: "rgba(0,0,0,0.35)" }}>או</span>
              <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.1)" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || !supabaseReady}
              className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-[14.5px] font-bold border transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ borderColor: "rgba(0,0,0,0.15)", color: "#1c1c1c", background: "#fff" }}
            >
              <GoogleLogo />
              {googleLoading ? "מעביר לגוגל..." : "המשך עם Google"}
            </button>
          </>
        ) : (
          <>
            <label className="text-[13px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>קוד אימות</label>
            <TextInput value={code} onChange={setCode} placeholder="123456" type="text" dir="ltr" />
            {error && <div className="text-[12.5px]" style={{ color: "#c0392b" }}>{error}</div>}
            <Button variant="primary" onClick={handleVerify} disabled={!codeValid || loading}>
              {loading ? "מאמת..." : "אימות והמשך"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setCode(""); setError(null); }}
              className="text-[13px] font-bold"
              style={{ color: "rgba(0,0,0,0.4)" }}
            >
              שינוי מספר טלפון
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden w-full max-w-[390px] min-h-screen bg-card flex flex-col shadow-[0_20px_50px_rgba(2,62,138,0.16)]">
        {card}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex w-full min-h-screen bg-cream items-center justify-center p-10">
        <div className="w-full max-w-[480px] bg-card rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(2,62,138,0.12)" }}>
          {card}
        </div>
      </div>
    </>
  );
}
