"use client";

/**
 * תצוגת המפה — מוסדות וקורסים לפי אזור.
 *
 * **שלוש קבוצות ולא אחת**, וזו ההחלטה המרכזית כאן. מפה נאיבית משקרת
 * בשתי דרכים: היא מסתירה את מה שאין לו כתובת, והיא בוחרת סניף אקראי
 * למי שפועל בכל הארץ. לכן:
 *
 *   📍 **על המפה** — יש כתובת, אפשר לשאול "כמה זמן נסיעה ממני"
 *   🌐 **אונליין** — לא על המפה **בכוונה**. זו תכונה ולא חוסר: למי שיש
 *      ילדים או עבודה, "אפשר מהבית" הוא לפעמים כל התשובה
 *   🇮🇱 **בכל הארץ** — אורט (42 קמפוסים), ג׳ון ברייס, הפתוחה. לא נבחר
 *      להם סניף ולא נעמיד פנים שאנחנו יודעים איזה קרוב אליך
 *
 * וקבוצה רביעית קיימת **רק באדמין**: מי שאין לו מיקום כי לא בדקנו.
 * ההבדל בין "לא רלוונטי" ל"לא נבדק" חייב להיות גלוי לנתי ובלתי נראה
 * למועמד, ולכן `showUnchecked` הוא prop ולא ברירת מחדל.
 */

import { useState } from "react";
import { INSTITUTIONS, type Track } from "@/data/institutions";
import { visibleCourses } from "@/data/courses";
import { regionOf, REGION_LABEL, REGION_ORDER, type Region } from "@/data/regions";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";

type Item = {
  id: string;
  name: string;
  where?: string;
  city?: string;
  sub?: string;
  link?: string;
};

export default function GeoView({
  track, myRegions = [], showUnchecked = false,
}: {
  track?: Track;
  /** האזורים שהמועמד הצהיר עליהם — מסומנים, לא מסננים */
  myRegions?: Region[];
  showUnchecked?: boolean;
}) {
  const [open, setOpen] = useState<Region | null>(myRegions[0] ?? null);

  const insts = INSTITUTIONS.filter(i => i.status !== "hidden" && (!track || i.track === track));

  /*
   * קורס גובר על מוסד: המחזור נושא את המיקום האמיתי. מוסד שכל הקורסים
   * שלו כבר מופיעים לא מוצג פעמיים.
   */
  const courses = visibleCourses().filter(c => !track || track === "bootcamp");
  const coveredByCourse = new Set(courses.filter(c => c.city || c.online).map(c => c.institutionId));

  const online: Item[] = [
    ...courses.filter(c => c.online).map(c => ({
      id: c.id, name: c.name, sub: instName(c.institutionId), link: c.link,
    })),
    ...insts.filter(i => !i.city && !coveredByCourse.has(i.id) && /אונליין|מרחוק/.test(i.location ?? ""))
      .map(i => ({ id: i.id, name: i.name, sub: i.location, link: i.link })),
  ];

  const nationwide: Item[] = insts
    .filter(i => !i.city && !coveredByCourse.has(i.id) && /ברחבי הארץ|קמפוסים|מרכזים/.test(i.location ?? ""))
    .map(i => ({ id: i.id, name: i.name, sub: i.location, link: i.link }));

  const unchecked: Item[] = insts
    .filter(i => !i.city && !coveredByCourse.has(i.id)
      && !/אונליין|מרחוק|ברחבי הארץ|קמפוסים|מרכזים/.test(i.location ?? ""))
    .map(i => ({ id: i.id, name: i.name, sub: i.location, link: i.link }));

  const byRegion = new Map<Region, Item[]>();
  const push = (r: Region, it: Item) => byRegion.set(r, [...(byRegion.get(r) ?? []), it]);

  for (const c of courses) {
    if (!c.city || c.online) continue;
    push(regionOf(c.city), {
      id: c.id, name: c.name, city: c.city,
      where: c.address ?? c.city, sub: instName(c.institutionId), link: c.link,
    });
  }
  for (const i of insts) {
    if (!i.city || coveredByCourse.has(i.id)) continue;
    push(regionOf(i.city), {
      id: i.id, name: i.name, city: i.city, where: i.address ?? i.city, sub: i.tag, link: i.link,
    });
  }

  const pinned = REGION_ORDER.filter(r => r !== "unknown" && (byRegion.get(r)?.length ?? 0) > 0);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[11.5px] leading-[1.7]" style={{ color: "rgba(0,0,0,0.5)" }}>
        מסודר מצפון לדרום. מה שאפשר לעשות מהבית ומה שפועל בכל הארץ מופיעים בנפרד למטה —
        <b> הם לא חסרים, הם פשוט לא שייכים לאזור אחד.</b>
      </div>

      {pinned.map(r => {
        const items = byRegion.get(r)!;
        const mine = myRegions.includes(r);
        const isOpen = open === r;
        return (
          <div key={r} className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: `1px solid ${mine ? `${ORANGE}55` : "rgba(2,62,138,0.1)"}` }}>
            <button onClick={() => setOpen(isOpen ? null : r)}
              className="w-full text-right px-4 py-3 flex items-center justify-between gap-2">
              <span className="text-[14px] font-black" style={{ color: NAVY }}>
                📍 {REGION_LABEL[r]}
                {mine && <span className="text-[10.5px] font-bold mr-2 px-2 py-0.5 rounded-full"
                  style={{ background: `${ORANGE}18`, color: "#92400e" }}>האזור שלך</span>}
              </span>
              <span className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                {items.length} · {isOpen ? "▲" : "▼"}
              </span>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 flex flex-col gap-1.5">
                {items.map(it => <Row key={it.id} item={it} />)}
              </div>
            )}
          </div>
        );
      })}

      {online.length > 0 && (
        <Bucket title="🌐 אפשר מהבית" tone="#047857"
          note="אלה לא על המפה כי אין להם מקום — לומדים אונליין. למי שעובד או שיש לו ילדים, זו לפעמים כל התשובה."
          items={online} />
      )}

      {nationwide.length > 0 && (
        <Bucket title="🇮🇱 פועלים בכל הארץ" tone={NAVY}
          note="יש להם סניפים או מרכזים בכל הארץ. לא בחרנו לך אחד — בדוק/י באתר איזה הכי קרוב אליך."
          items={nationwide} />
      )}

      {showUnchecked && unchecked.length > 0 && (
        <Bucket title="⚠️ בלי מיקום — לא נבדק" tone="#b45309"
          note="לא אונליין ולא ארצי — פשוט לא בדקנו איפה הם. מוצג באדמין בלבד."
          items={unchecked} />
      )}
    </div>
  );
}

function Bucket({ title, note, items, tone }: {
  title: string; note: string; items: Item[]; tone: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${tone}33` }}>
      <button onClick={() => setOpen(!open)} className="w-full text-right px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-black" style={{ color: tone }}>{title}</span>
          <span className="text-[11.5px]" style={{ color: "rgba(0,0,0,0.4)" }}>
            {items.length} · {open ? "▲" : "▼"}
          </span>
        </div>
        <div className="text-[11px] leading-[1.65] mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>{note}</div>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {items.map(it => <Row key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}

function Row({ item }: { item: Item }) {
  const href = item.link
    ? (item.link.startsWith("http") ? item.link : `https://${item.link}`)
    : undefined;
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="rounded-xl px-3 py-2 block"
      style={{ background: "rgba(2,62,138,0.03)", border: "1px solid rgba(2,62,138,0.06)" }}
    >
      <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>
        {item.name.split(" — ")[0]}{href ? " ↗" : ""}
      </div>
      <div className="text-[11px] mt-0.5 leading-[1.6]" style={{ color: "rgba(0,0,0,0.5)" }}>
        {[item.where, item.sub].filter(Boolean).join(" · ")}
      </div>
    </Wrapper>
  );
}

function instName(id: string): string {
  return INSTITUTIONS.find(i => i.id === id)?.name.split(" — ")[0] ?? id;
}
