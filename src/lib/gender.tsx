"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── פנייה לפי מגדר המשתתף/ת ─────────────────────────────────────────────────
// המגדר נשמר באונבורדינג ב-localStorage("user-gender") ומשוחזר מהשרת.
// עד שהוא נטען (או אם אין) — הצורה המשולבת ("לחץ/י"), כמו באונבורדינג.
//
// שתי דרכים לכתוב טקסט מגדרי:
//   · במחרוזת: "[[סדר|סדרי]] את השלבים"  ← נפתר ב-gt(text, gender)
//     צורה שלישית אופציונלית לניטרלי: "[[מוכן|מוכנה|מוכן/ה]]"
//   · ב-JSX:   <G m="סדר" f="סדרי" />       ← קורא את המגדר מה-context
//
// מה כן ומה לא: פנייה ישירה למשתתף/ת ושם התפקיד כשהוא מייצג אותו/ה
// ("חשבת כמו [[בודק|בודקת]] QA") — לפי המגדר. דמויות בסיפור (הדס, המפתחת
// שכתבה בסלאק) — נשארות כפי שנכתבו.

export type Gender = "male" | "female" | "other";

const GenderCtx = createContext<Gender | null>(null);

export function useStoredGender(): Gender | null {
  const [gender, setGender] = useState<Gender | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem("user-gender");
      if (v === "male" || v === "female" || v === "other") setGender(v);
    } catch { /* ignore */ }
  }, []);
  return gender;
}

// value — כשהדף כבר קרא את המגדר בעצמו (useStoredGender), כדי שלא ייקרא פעמיים
export function GenderProvider({ value, children }: { value?: Gender | null; children: React.ReactNode }) {
  const stored = useStoredGender();
  return <GenderCtx.Provider value={value !== undefined ? value : stored}>{children}</GenderCtx.Provider>;
}

export function useGender(): Gender | null {
  return useContext(GenderCtx);
}

export function g(gender: Gender | null, m: string, f: string, n?: string): string {
  if (gender === "male") return m;
  if (gender === "female") return f;
  if (n !== undefined) return n;
  // "לחץ"+"לחצי" ⇐ "לחץ/י" — כמו באונבורדינג (אות סופית נחשבת כרגילה); אחרת שתי הצורות במלואן
  const stem = m.slice(0, -1) + (FINAL_TO_REGULAR[m.slice(-1)] ?? m.slice(-1));
  return f.startsWith(stem) && f.length > stem.length ? `${m}/${f.slice(stem.length)}` : `${m}/${f}`;
}

const FINAL_TO_REGULAR: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

const TOKEN = /\[\[([^\[\]|]*)\|([^\[\]|]*)(?:\|([^\[\]|]*))?\]\]/g;

export function gt(text: string, gender: Gender | null): string {
  return text.replace(TOKEN, (_, m: string, f: string, n?: string) => g(gender, m, f, n));
}

export function G({ m, f, n }: { m: string; f: string; n?: string }) {
  return <>{g(useGender(), m, f, n)}</>;
}
