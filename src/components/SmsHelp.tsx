"use client";

/**
 * "לא מגיע קוד?" — אדם במקום מבוי סתום (נתי, 12.10).
 *
 * SMS הוא הדרך היחידה להיכנס. מי שהקוד לא מגיע אליו מקבל כאן את הרכז/ת
 * שלו בשם, וכפתור וואטסאפ עם ההודעה כבר כתובה — ניסוח הבקשה מאפס הוא
 * החסם, כמו בבקשה לדבר עם בוגר (28.8). הלחיצה גם שולחת לרכז/ת מייל עם
 * הטלפון שהוקלד, כדי שהיא תדע גם אם הוא לא שלח בסוף. ראה /api/candidate/sms-help.
 *
 * מופיע **רק אחרי כישלון אמיתי** — שגיאת שליחה או קוד שלא הגיע תוך 45 שניות.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

async function call(body: Record<string, unknown>) {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  const r = await fetch("/api/candidate/sms-help", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) return null;
  return (await r.json()) as { coordinator: { firstName: string; phone: string } | null };
}

export default function SmsHelp({ phone, name, where }: { phone: string; name?: string; where: string }) {
  const [coord, setCoord] = useState<{ firstName: string; phone: string } | null>(null);

  useEffect(() => {
    call({ phone, notify: false }).then(r => setCoord(r?.coordinator ?? null)).catch(() => {});
  }, [phone]);

  const who = coord?.firstName || "הרכז/ת";
  const text = `היי ${coord?.firstName ?? ""}, ניסיתי להיכנס לאפליקציה של טק-קריירה ולא הגיע לי קוד אימות ב-SMS. המספר שלי: ${phone}`;

  return (
    <div className="w-full rounded-2xl px-4 py-4 text-right"
      style={{ background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.35)" }}>
      <div className="text-[14.5px] font-extrabold" style={{ color: "#0f5132" }}>
        לא מגיע קוד? {who} כאן כדי לעזור לך להיכנס
      </div>
      <div className="text-[13px] mt-1 leading-[1.6]" style={{ color: "rgba(0,0,0,0.6)" }}>
        לפעמים ההודעה מתעכבת או שהמספר הוקלד עם טעות. כתבו ל{coord ? who : "רכז/ת"} — ההודעה כבר מוכנה.
      </div>
      {coord?.phone && (
        <a
          href={`https://wa.me/${coord.phone}?text=${encodeURIComponent(text)}`}
          target="_blank" rel="noopener noreferrer"
          onClick={() => { void call({ phone, name, where, notify: true }); }}
          className="mt-3 flex items-center justify-center rounded-xl py-3 text-[15px] font-extrabold text-white"
          style={{ background: "#25d366" }}
        >
          לכתוב ל{who} בוואטסאפ
        </a>
      )}
    </div>
  );
}
