"use client";

/**
 * TrackDetail — מסך העומק למסלול אחד בתחום אחד.
 *
 * מסך ההשוואה (AllPaths) נשאר דק בכוונה. כאן נמצא העומק.
 * הסדר לא שרירותי — הוא לפי מה שבאמת חוסם אנשים, מהקונקרטי לתודעתי:
 *
 *   1. איך זה נכנס לחיים שלי  ← הפער שזיהינו ומעולם לא נבנה
 *   2. האם אני בכלל יכול להיכנס
 *   3. כמה זה עולה ומי משלם
 *   4. מה קורה כשיהיה קשה     ← כאן יושבת תחושת המסוגלות
 *   5. לאן זה מוביל, ולאן לא
 *   6. מה אפשר אחרי
 *
 * הכל מורכב מנתונים קיימים — מוסדות ומסלולים — ולא נכתב מחדש.
 */

import { DOMAIN_LABEL, visibleFor, type Domain, type Track } from "@/data/institutions";
import { routesFor, DEEPEN_NOTE } from "@/data/routes";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";

const STYLE: Record<Track, { name: string; color: string; tint: string }> = {
  degree: { name: "תואר אקדמי", color: NAVY, tint: "#e8eef7" },
  bootcamp: { name: "הכשרה טכנולוגית", color: ORANGE, tint: "#fff1e0" },
  mahat: { name: "מה״ט / הנדסאי", color: "#64748b", tint: "#eef1f4" },
};

/** מימון רלוונטי לפי מסלול — מתוך מה שאומת במחקר */
const FUNDING: Record<Track, { name: string; detail: string }[]> = {
  degree: [
    { name: "מלגת מרום", detail: "ליוצאי אתיופיה. מדעי המחשב בקבוצת העדיפות העליונה. ההרשמה נפתחת בספטמבר ונסגרת בתחילת נובמבר." },
    { name: "עתידים לתעשייה", detail: "מלגת קיום חודשית, מחשב נייד, וסיוע בשכר לימוד — והשמה בתעשייה כבר מהסמסטר השלישי." },
    { name: "המינהל לסטודנטים עולים", detail: "למי שבארץ פחות מ-15 שנה: שכר לימוד, שיעורי עזר, חונך ומלגת קיום." },
  ],
  bootcamp: [
    { name: "טק-קריירה", detail: "כ-4,000 ₪ לקורס — חלקיק ממחיר השוק — כולל מלגת קיום ומגורים בקמפוס." },
    { name: "שוברי הכשרה מקצועית", detail: "יוצאי אתיופיה בקבוצת הזכאות הגבוהה ביותר — סבסוד של עד 90%, ועוד מענק השמה." },
  ],
  mahat: [
    { name: "האגף לחיילים משוחררים", detail: "90% מימון שכר הלימוד בלימודי הנדסאי במכללות שמה״ט מכיר. עד 5 שנים מהשחרור, ועד 10 לחיילים בודדים ולמשרתי מילואים." },
    { name: "עתידאים", detail: "מסלול הנדסאי מרוכז של 17 חודשים בשיתוף התעשייה, עם מלגת קיום והתמחות תוך כדי." },
  ],
};

/** מה קורה כשקשה — הסעיף שנוגע בתחושת המסוגלות */
const HARD_PART: Record<Track, { title: string; body: string }> = {
  degree: {
    title: "שנה א׳ היא החלק הקשה",
    body: "קורסי המתמטיקה הם המקום שבו רוב הנשירה קורית. זה לא עניין של כישרון — באוניברסיטת חיפה צמצמו את נשירת שנה א׳ בכמחצית, ומה שעשה את ההבדל היה רכז שיושב בתוך המחלקה, מכיר אותך בשם, ויודע מתי נעלמת.",
  },
  bootcamp: {
    title: "הקצב הוא האתגר",
    body: "קורס אינטנסיבי במחזור סגור — קשה לעצור באמצע, וקשה להדביק פער. כדאי להתחיל בתקופה שמאפשרת את זה, ולוודא מראש איזה ליווי יש אם נתקעים.",
  },
  mahat: {
    title: "שנתיים-שלוש בערב, אחרי יום עבודה",
    body: "זה המסלול שדורש את ההתמדה הארוכה ביותר במקביל לעבודה. שווה לבדוק מראש מה קורה אם צריך להאט קצב.",
  },
};

export default function TrackDetail({
  domain, track, onBack, onInstitutions,
}: {
  domain: Domain; track: Track;
  onBack: () => void;
  onInstitutions: () => void;
}) {
  const st = STYLE[track];
  const route = routesFor(domain).find(r => r.track === track);
  const insts = visibleFor(track, [domain]);
  const schedules = insts.filter(i => i.schedule && i.schedule !== "לא אומת");
  const entryRoutes = insts.filter(i => i.noPsychometric && i.noPsychometric !== "לא נמצא");
  const thin = insts.length <= 1 || insts.every(i => i.status === "needs-check");

  if (!route) return null;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-5 mb-3.5" style={{ background: "#fff", border: "1px solid rgba(2,62,138,0.1)" }}>
      <div className="text-[13px] font-black mb-2.5" style={{ color: NAVY }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="text-[12px] font-bold mb-4" style={{ color: "rgba(0,0,0,0.4)" }}>
        ↩ לכל הדרכים
      </button>

      {/* What this is */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: st.tint, border: `1.5px solid ${st.color}30` }}>
        <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: st.color }}>
          {DOMAIN_LABEL[domain]}
        </div>
        <div className="text-[20px] leading-tight" style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900, color: "#1a1a1a" }}>
          {st.name}
        </div>
        <div className="text-[12.5px] mt-1.5" style={{ color: "rgba(0,0,0,0.55)" }}>
          {route.span} · מגיעים ל<span className="font-bold">{route.destination}</span>
        </div>
      </div>

      {/* Thin content — say so rather than look authoritative */}
      {thin && (
        <div className="rounded-xl px-4 py-3 mb-4 text-[12px] leading-[1.65]"
          style={{ background: "rgba(251,133,0,0.08)", border: "1px solid rgba(251,133,0,0.2)", color: "#92400e" }}>
          את התחום הזה אנחנו עדיין מכירים פחות טוב מהאחרים. מה שכתוב כאן נכון, אבל חלקי —
          <span className="font-bold"> שווה לשאול את הרכזת דווקא על זה.</span>
        </div>
      )}

      {/* 1 — the life-fit gap */}
      <Section title="איך זה נכנס לשבוע שלך">
        {schedules.length ? (
          <div className="flex flex-col gap-2.5">
            {schedules.map(i => (
              <div key={i.id} className="text-[12.5px] leading-[1.6]">
                <span className="font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>{i.name}</span>
                <div style={{ color: "rgba(0,0,0,0.55)" }}>{i.schedule}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>
            מבנה הלימודים משתנה בין מוסדות. זו שאלה טובה לרכזת.
          </div>
        )}
      </Section>

      {/* 2 — can I even get in */}
      <Section title="האם אני יכול/ה להיכנס">
        {entryRoutes.length ? (
          <div className="flex flex-col gap-2.5">
            {entryRoutes.slice(0, 4).map(i => (
              <div key={i.id} className="text-[12.5px] leading-[1.6]">
                <span className="font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>{i.name}</span>
                <div style={{ color: "rgba(0,0,0,0.55)" }}>{i.noPsychometric}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[12.5px]" style={{ color: "rgba(0,0,0,0.5)" }}>תנאי הקבלה משתנים בין מוסדות.</div>
        )}
        {track === "degree" && (
          <div className="text-[12px] leading-[1.65] mt-3 px-3.5 py-2.5 rounded-xl"
            style={{ background: "rgba(2,62,138,0.05)", color: "rgba(0,0,0,0.6)" }}>
            אין בגרות מלאה? מכינה קדם-אקדמית היא שנה אחת שסוגרת בדיוק את הפער, ולרוב היא מסובסדת מאוד.
          </div>
        )}
      </Section>

      {/* 3 — money */}
      <Section title="כמה זה עולה — ומי משלם">
        <div className="flex flex-col gap-3">
          {FUNDING[track].map(f => (
            <div key={f.name}>
              <div className="text-[12.5px] font-black" style={{ color: "#92400e" }}>{f.name}</div>
              <div className="text-[11.5px] leading-[1.6] mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>{f.detail}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 4 — self-efficacy */}
      <Section title={HARD_PART[track].title}>
        <div className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(0,0,0,0.62)" }}>
          {HARD_PART[track].body}
        </div>
        <div className="text-[12px] leading-[1.65] mt-3 px-3.5 py-2.5 rounded-xl"
          style={{ background: `${GREEN}0e`, color: "#065f46" }}>
          מה לוודא שקיים במוסד: חונכות אישית, שיעורי תגבור, יועץ אקדמי שאפשר לתפוס, והתאמות בבחינות.
          אלה קיימים כמעט בכל מקום — אבל רק מי ששואל מקבל אותם.
        </div>
      </Section>

      {/* 5 — where it leads, and where it doesn't */}
      <Section title="לאן זה מוביל">
        <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.62)" }}>
          <span className="font-bold">{route.destination}</span> — {route.note}
        </div>
      </Section>

      {/* 6 — what comes after */}
      {track !== "degree" && (
        <div className="rounded-2xl p-5 mb-3.5 flex items-start gap-3"
          style={{ background: "rgba(2,62,138,0.05)", border: "1px solid rgba(2,62,138,0.12)" }}>
          <span className="text-[16px] shrink-0" style={{ color: NAVY }}>↗</span>
          <div>
            <div className="text-[13px] font-black mb-1" style={{ color: NAVY }}>ומה אחרי</div>
            <div className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.6)" }}>{DEEPEN_NOTE}</div>
          </div>
        </div>
      )}

      {/* Alumni — the piece that is still missing */}
      <div className="rounded-2xl p-5 mb-3.5 text-center"
        style={{ background: "rgba(0,0,0,0.025)", border: "1px dashed #ded8ce" }}>
        <div className="text-[13px] font-bold mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>
          בקרוב — בוגרים שעשו בדיוק את זה
        </div>
        <div className="text-[11.5px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.38)" }}>
          מאיפה התחילו, איפה כמעט ויתרו, ומה החזיק אותם
        </div>
      </div>

      <button
        onClick={onInstitutions}
        className="w-full py-4 rounded-2xl text-white text-[15px] font-black active:scale-[0.98] transition-transform"
        style={{ background: NAVY, fontFamily: "'Heebo', sans-serif" }}
      >
        לראות מוסדות במסלול הזה ←
      </button>
    </div>
  );
}
