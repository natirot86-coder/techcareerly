"use client";

/**
 * שלב 5 — לוגיסטיקה ומלגות.
 *
 * מה שהוחלט כאן ואסור לשבור בלי החלטה מפורשת:
 *
 * **אין מסך חששות ואין שאלון עליהם.** שאלון שלב 4 מודד נסיבות, לא פחד —
 * שני אנשים עונים "אני זקוק למלגה" ואחד מהם משותק. לגזור פחד מנסיבה זה
 * לגזור סטריאוטיפ ולהגיש אותו למי שלא ביקש. במקום זה שני מנגנונים:
 * משימה בגודל ישיבה אחת (ב-data/plan.ts), וחשבון אמיתי במקום נחמה (מסך money).
 * הפחד עצמו נמדד בהתנהגות ועובר לרכזת — לא מאובחן ולא מטופל כאן.
 *
 * **האפליקציה לא שומרת קבצים.** הארון עוקב אחרי סטטוס ומיקום בלבד.
 * החזקת תעודות זהות ותלושי שכר של מועמדים היא אחריות שלא מחזירים אחורה,
 * ולא בשלב שאין בו עדיין הרשאות מסודרות. אם זה משתנה — לשנות גם את הטקסט.
 *
 * **סרגל ניווט אחד.** BottomNav הוא הניווט של האפליקציה. הניווט הפנימי כאן
 * הוא מקטעים בראש התוכן, לא סרגל תחתון שני.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import JourneyStrip from "@/components/ui/JourneyStrip";
import { track as trackEvent } from "@vercel/analytics";
import { syncPlanTasks, syncPlanDocuments, syncPlanApplications, logEvent } from "@/lib/candidate";
import type { Track } from "@/data/institutions";
import {
  BUDGETED_TUITION, SCHOLARSHIPS, RECOMMENDED_STACK, DOC_CATALOG,
  AREA_LABEL, buildPlan, monthKey, monthLabel, dueText, daysUntil,
  nextOccurrence, type PlanTask, type TaskArea,
} from "@/data/plan";

const NAVY = "#023e8a";
const ORANGE = "#fb8500";
const GREEN = "#059669";
const RED = "#dc2626";
const SURFACE = "#fbf9f5";
const BORDER = "#ece7dc";

type View = "intro" | "plan" | "money" | "docs" | "coord" | "rejected";

const VIEW_LABEL: Record<string, string> = {
  plan: "התוכנית שלי",
  money: "החשבון",
  docs: "המסמכים",
  coord: "לרכזת",
};

type PlanDoc = { id: string; name: string; have: boolean; locations: string[] };
type AppStatus = "waiting" | "accepted" | "rejected";

const LS = {
  tasks: "plan-tasks",
  docs: "plan-docs",
  apps: "plan-apps",
  intro: "plan-intro-seen",
  sent: "plan-last-sent",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [view, setView] = useState<View>("plan");
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [docs, setDocs] = useState<PlanDoc[]>([]);
  const [apps, setApps] = useState<Record<string, AppStatus>>({});
  const [sheet, setSheet] = useState(false);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [showDone, setShowDone] = useState(false);

  // — טעינה ראשונית. אם אין תוכנית, בונים אותה מנתוני שלב 4 —
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      Object.values(LS).forEach(k => localStorage.removeItem(k));
      window.history.replaceState({}, "", "/plan");
    }

    let t = read<PlanTask[]>(LS.tasks, []);
    if (t.length === 0) {
      const quiz = read<Record<string, string>>("paths-quiz", {});
      const shortlist = read<{ name: string; track: Track }[]>("paths-shortlist", []);
      t = buildPlan(quiz, shortlist);
      localStorage.setItem(LS.tasks, JSON.stringify(t));
    }
    setTasks(t);
    setDocs(read<PlanDoc[]>(LS.docs, []));
    setApps(read<Record<string, AppStatus>>(LS.apps, {}));

    const v = params.get("view") as View | null;
    const remembered = localStorage.getItem("plan-last-view") as View | null;
    if (v) setView(v);
    else if (!localStorage.getItem(LS.intro)) setView("intro");
    else if (remembered && remembered !== "intro" && remembered !== "rejected") setView(remembered);
    setReady(true);
  }, []);

  const saveTasks = (next: PlanTask[]) => {
    setTasks(next);
    localStorage.setItem(LS.tasks, JSON.stringify(next));
    syncPlanTasks(next); // שיקוף — fire-and-forget, לא חוסם UI
  };
  const saveDocs = (next: PlanDoc[]) => {
    setDocs(next);
    localStorage.setItem(LS.docs, JSON.stringify(next));
    syncPlanDocuments(next);
  };
  const saveApps = (next: Record<string, AppStatus>) => {
    setApps(next);
    localStorage.setItem(LS.apps, JSON.stringify(next));
    syncPlanApplications(next);
  };

  const open = tasks.filter(t => t.status === "open");
  const done = tasks.filter(t => t.status === "done");

  /** הפעולה הדחופה: הדדליין הקרוב ביותר. אם אין — הבאה בתור. הכרטיס לא נעלם */
  const anchor = useMemo(() => {
    const withDue = open.filter(t => t.due).sort((a, b) => (a.due! < b.due! ? -1 : 1));
    return withDue[0] ?? open[0] ?? null;
  }, [open]);

  const toggle = (id: string) =>
    saveTasks(tasks.map(t => {
      if (t.id !== id) return t;
      const nowDone = t.status !== "done";
      return { ...t, status: nowDone ? "done" : "open", doneAt: nowDone ? new Date().toISOString() : null };
    }));

  /**
   * פתיחת משימה — האות ההתנהגותי של שלב 5.
   *
   * הסכמנו לא לשאול אנשים על פחדים אלא למדוד אותם בהתנהגות, וזו המדידה:
   * מי שפותח את אותה משימה שוב ושוב בלי לסגור אותה תקוע במשהו, ולא יבקש
   * עזרה מעצמו. שלוש פתיחות מעבירות אותו לתור החילוץ של הרכזת.
   */
  const noteOpen = (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t || t.status === "done") return;
    const count = (t.openCount ?? 0) + 1;
    saveTasks(tasks.map(x => (x.id === id ? { ...x, openCount: count } : x)));
    logEvent("plan_task_open", { task: id, area: t.area, count: String(count) });
  };

  /*
   * חזרה למשימה העוגן — הסיגנל החזק יותר.
   *
   * המשימה הדחופה מוצגת פתוחה בראש המסך, אז אין עליה "לחיצת פתיחה".
   * מה שכן אומר משהו הוא לחזור אליה בהזדמנות אחרת ולמצוא אותה עדיין
   * פתוחה. מרוסן לפעם בשעה לכל משימה, כדי שמעבר בין טאבים לא ייחשב.
   */
  const counted = useRef(false);
  useEffect(() => {
    if (!ready || !anchor || counted.current) return;
    counted.current = true;
    try {
      const key = `plan-seen-${anchor.id}`;
      const prev = Number(localStorage.getItem(key) ?? 0);
      if (Date.now() - prev < 60 * 60 * 1000) return;
      localStorage.setItem(key, String(Date.now()));
    } catch { return; }
    noteOpen(anchor.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, anchor]);

  const remove = (id: string) => saveTasks(tasks.filter(t => t.id !== id));

  /** "אחר כך" — דוחה את המשימה ליום הבא, והעוגן עובר לבאה בתור */
  const snooze = (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const base = t.due ? new Date(t.due) : new Date();
    base.setDate(base.getDate() + 1);
    saveTasks(tasks.map(x => (x.id === id ? { ...x, due: base.toISOString() } : x)));
  };

  if (!ready) return <div style={{ background: SURFACE, minHeight: "100vh" }} />;

  if (view === "intro")
    return (
      <Intro
        onStart={() => {
          localStorage.setItem(LS.intro, "1");
          trackEvent("plan_intro_done");
          setView("plan");
        }}
      />
    );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: SURFACE }} dir="rtl">
      <JourneyStrip current={5} phaseLabel={VIEW_LABEL[view] ?? "לוגיסטיקה ומלגות"} />

      {/* ניווט פנימי — מקטעים, לא סרגל שני */}
      <div className="max-w-[560px] w-full mx-auto px-4 pt-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(2,62,138,0.06)" }}>
          {(["plan", "money", "docs", "coord"] as const).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); localStorage.setItem("plan-last-view", v); }}
              className="flex-1 py-2 rounded-lg text-[12.5px] font-bold transition-colors"
              style={{
                background: view === v ? "#fff" : "transparent",
                color: view === v ? NAVY : "rgba(0,0,0,0.45)",
                boxShadow: view === v ? "0 1px 3px rgba(2,62,138,0.12)" : "none",
              }}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[560px] w-full mx-auto flex-1 pb-28">
        {view === "plan" && (
          <PlanView
            anchor={anchor}
            open={open}
            done={done}
            openMonths={openMonths}
            setOpenMonths={setOpenMonths}
            showDone={showDone}
            setShowDone={setShowDone}
            onToggle={toggle}
            onOpen={noteOpen}
            onRemove={remove}
            onSnooze={snooze}
            onMoney={() => setView("money")}
            onAdd={(title, area) =>
              saveTasks([
                ...tasks,
                { id: `u-${Date.now()}`, title, area, due: null, source: "user", status: "open" },
              ])
            }
            onIntro={() => setView("intro")}
          />
        )}

        {view === "money" && <MoneyOnce />}

        {view === "docs" && (
          <DocsView
            docs={docs}
            onOpenSheet={() => setSheet(true)}
            onRemove={id => saveDocs(docs.filter(d => d.id !== id))}
          />
        )}

        {view === "coord" &&
          (rejectedId ? (
            <RejectedView
              id={rejectedId}
              onUndo={() => {
                const next = { ...apps };
                delete next[rejectedId];
                saveApps(next);
                setRejectedId(null);
              }}
              onBack={() => setRejectedId(null)}
            />
          ) : (
            <CoordView
              tasks={tasks}
              docs={docs}
              apps={apps}
              onStatus={(id, s) => {
                saveApps({ ...apps, [id]: s });
                if (s === "rejected") setRejectedId(id);
              }}
            />
          ))}
      </div>

      {sheet && (
        <AddDocSheet
          onClose={() => setSheet(false)}
          onSave={(name, have, locations) => {
            if (have) {
              saveDocs([...docs, { id: `d-${Date.now()}`, name, have: true, locations }]);
            } else {
              saveTasks([
                ...tasks,
                {
                  id: `u-${Date.now()}`,
                  title: `להוציא: ${name}`,
                  note: DOC_CATALOG.find(d => d.name === name)?.where,
                  area: "registration",
                  due: null,
                  source: "user",
                  status: "open",
                },
              ]);
            }
            setSheet(false);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

// ─── 2a — מסך פתיחה ───────────────────────────────────────────────────────────

function Intro({ onStart }: { onStart: () => void }) {
  const seen = typeof window !== "undefined" && !!localStorage.getItem(LS.intro);
  return (
    <div className="min-h-screen flex flex-col" style={{ background: NAVY, color: "#fff" }} dir="rtl">
      <div className="max-w-[560px] w-full mx-auto flex-1 flex flex-col px-6 pt-7 pb-7">
        {/* שישה מקטעים — כי המסע הוא שישה שלבים, וזה החמישי */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div
              key={n}
              style={{
                width: 26, height: 4, borderRadius: 999,
                background: n <= 5 ? ORANGE : "rgba(255,255,255,0.25)",
                opacity: n < 5 ? 0.55 : 1,
              }}
            />
          ))}
        </div>

        <div className="text-[13px] font-bold mt-[22px]" style={{ color: ORANGE, letterSpacing: "0.04em" }}>
          שלב 5 מתוך 6
        </div>

        <h1 className="text-[30px] font-extrabold mt-2" style={{ lineHeight: 1.25 }}>
          בחרת מסלול.
          <br />
          עכשיו מסדרים את הדרך אליו.
        </h1>

        <div className="flex flex-col gap-3 mt-[22px]">
          {[
            "השלב הזה נמשך כמה חודשים — לא ישיבה אחת. אין מה לסיים היום.",
            "יש כאן ארבעה דברים: המלגות, ההרשמה, הכסף, ואיפה תגור.",
            "לחלק מהם יש תאריך אחרון. את הקרוב תראה בראש המסך בכל פעם שתיכנס.",
          ].map(t => (
            <div key={t} className="flex gap-3">
              <div style={{ width: 8, height: 8, borderRadius: 999, background: ORANGE, marginTop: 8, flexShrink: 0 }} />
              <div className="text-[16px]" style={{ lineHeight: 1.55, color: "#e4ecf7" }}>{t}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-[18px] rounded-2xl" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="text-[16px] font-extrabold mb-1.5">התוכנית כבר מוכנה</div>
          <div className="text-[15px]" style={{ lineHeight: 1.55, color: "#dbe6f5" }}>
            בנינו אותה ממה שענית בשלב הקודם ומהמוסדות שבחרת. אם משהו לא נכון לך — תמחק אותו.
            זו התוכנית שלך.
          </div>
        </div>

        <div className="flex-1 min-h-[24px]" />

        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl text-[17px] font-extrabold"
          style={{ background: ORANGE, color: "#fff" }}
        >
          {seen ? "חזרה לתוכנית" : "לראות את התוכנית שלי"}
        </button>
        <div className="text-center text-[14px] mt-2.5" style={{ color: "#a9c1e0" }}>
          לוקח 3 דקות לעבור עליה
        </div>
      </div>
    </div>
  );
}

// ─── 2b — התוכנית שלי ─────────────────────────────────────────────────────────

function PlanView({
  anchor, open, done, openMonths, setOpenMonths, showDone, setShowDone,
  onToggle, onOpen, onRemove, onSnooze, onMoney, onAdd, onIntro,
}: {
  anchor: PlanTask | null;
  open: PlanTask[];
  done: PlanTask[];
  openMonths: Record<string, boolean>;
  setOpenMonths: (v: Record<string, boolean>) => void;
  showDone: boolean;
  setShowDone: (v: boolean) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
  onSnooze: (id: string) => void;
  onMoney: () => void;
  onAdd: (title: string, area: TaskArea) => void;
  onIntro: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  /** קיבוץ לפי חודש, ולא לפי תחום — כדי שתחום בלי משימות החודש לא יופיע כשורה ריקה */
  const groups = useMemo(() => {
    const withDue = open.filter(t => t.due);
    const noDue = open.filter(t => !t.due);
    const map = new Map<string, PlanTask[]>();
    for (const t of withDue) {
      const k = monthKey(t.due!);
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    const sorted = [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (noDue.length) sorted.push(["none", noDue]);
    return sorted;
  }, [open]);

  const todayKey = monthKey(new Date().toISOString());

  return (
    <div className="pt-4">
      <div className="px-5 flex items-baseline justify-between mb-3">
        <h1 className="text-[22px] font-extrabold" style={{ color: NAVY }}>התוכנית שלי</h1>
        <button onClick={onIntro} className="text-[12.5px] font-bold" style={{ color: NAVY, opacity: 0.7 }}>
          מה זה השלב הזה?
        </button>
      </div>

      {/* כרטיס עוגן — פעולה אחת. לעולם לא נעלם */}
      {anchor ? (
        <div className="mx-4 p-[18px] rounded-[18px] flex flex-col gap-3" style={{ background: NAVY, color: "#fff" }}>
          <div className="flex items-center gap-2.5">
            {anchor.due && (
              <span
                className="px-2.5 py-1 rounded-full text-[12px] font-bold"
                style={{ background: daysUntil(new Date(anchor.due)) <= 7 ? RED : "rgba(255,255,255,0.16)" }}
              >
                {dueText(anchor.due)}
              </span>
            )}
            <span className="text-[12px]" style={{ color: "#b9cdea" }}>הכי דחוף</span>
          </div>
          <div className="text-[21px] font-extrabold" style={{ lineHeight: 1.3 }}>{anchor.title}</div>
          {anchor.note && (
            <div className="text-[14px]" style={{ lineHeight: 1.55, color: "#dbe6f5" }}>{anchor.note}</div>
          )}
          <div className="flex gap-2.5">
            <button
              onClick={() => (anchor.id === "m-math" ? onMoney() : onToggle(anchor.id))}
              className="flex-1 py-3 rounded-xl text-[15px] font-bold"
              style={{ background: ORANGE }}
            >
              {anchor.id === "m-math" ? "לראות את החשבון" : "סיימתי את זה"}
            </button>
            <button
              onClick={() => onSnooze(anchor.id)}
              className="px-4 py-3 rounded-xl text-[15px]"
              style={{ background: "rgba(255,255,255,0.14)" }}
            >
              אחר כך
            </button>
          </div>
        </div>
      ) : (
        <div
          className="mx-4 p-5 rounded-[18px] text-center"
          style={{ background: "#eef8f3", border: "1px solid #cfe9dd", color: "#08694c" }}
        >
          <div className="text-[16px] font-extrabold mb-1">אין משימות פתוחות</div>
          <div className="text-[14px]">כשיצוץ משהו חדש הוא יופיע כאן.</div>
        </div>
      )}

      <div className="px-5 pt-6 pb-2.5 text-[13px] font-bold" style={{ color: "#8a8377", letterSpacing: "0.04em" }}>
        כל התוכנית
      </div>

      <div className="px-4 flex flex-col gap-5">
        {groups.map(([key, items]) => {
          const isNow = key === todayKey;
          const isNone = key === "none";
          const far = !isNow && !isNone && key > todayKey && items.length > 0 && openMonths[key] !== true
            && [...groups].findIndex(g => g[0] === key) > 1;

          return (
            <div key={key}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  style={{
                    width: 10, height: 10, borderRadius: 999,
                    background: isNone ? "#cfc9bd" : isNow ? RED : "#fb8500",
                  }}
                />
                <div className="text-[17px] font-extrabold" style={{ color: "#1c1a16" }}>
                  {isNone ? "בלי תאריך" : monthLabel(key)}
                </div>
                <div className="text-[13px]" style={{ color: "#8a8377" }}>
                  {isNow ? "החודש" : isNone ? "מתי שנוח" : ""}
                </div>
              </div>

              {far ? (
                <button
                  onClick={() => setOpenMonths({ ...openMonths, [key]: true })}
                  className="w-full p-4 rounded-2xl flex items-center justify-between"
                  style={{ background: "#f6f3ec", border: "1px dashed #ddd6c8" }}
                >
                  <span className="text-[14px]" style={{ color: "#7a746a" }}>{items.length} משימות</span>
                  <span className="text-[14px] font-bold" style={{ color: NAVY }}>לפתוח</span>
                </button>
              ) : (
                <div
                  className="flex flex-col gap-2.5"
                  style={{
                    borderRight: `2px solid ${isNow ? "#f0d5d5" : BORDER}`,
                    marginRight: 4,
                    paddingRight: 16,
                  }}
                >
                  {items.map(t => (
                    <TaskRow key={t.id} task={t} compact={!isNow && !isNone} onToggle={onToggle} onOpen={onOpen} onRemove={onRemove} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* "כבר סגור" — בתחתית, מקופל, ירוק. ראיה להתקדמות בלי לדחוף את הדחוף למטה */}
      {done.length > 0 && (
        <div className="mx-4 mt-5">
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full p-4 rounded-2xl flex items-center justify-between"
            style={{ background: "#eef8f3", border: "1px solid #cfe9dd" }}
          >
            <span className="text-[14px] font-bold" style={{ color: "#08694c" }}>
              כבר סגור · {done.length}
            </span>
            <span className="text-[14px] font-bold" style={{ color: GREEN }}>
              {showDone ? "לסגור" : "לפתוח"}
            </span>
          </button>
          {showDone && (
            <div className="flex flex-col gap-2 mt-2.5">
              {done.map(t => (
                <button
                  key={t.id}
                  onClick={() => onToggle(t.id)}
                  className="p-3 rounded-xl text-right flex items-center gap-2.5"
                  style={{ background: "#fff", border: `1px solid ${BORDER}` }}
                >
                  <span style={{ color: GREEN }}>✓</span>
                  <span className="text-[14px]" style={{ color: "#7a746a", textDecoration: "line-through" }}>
                    {t.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* הוספה */}
      <div className="mx-4 mt-4 mb-5">
        {adding ? (
          <div className="p-4 rounded-2xl flex flex-col gap-2.5" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="מה צריך לעשות?"
              className="w-full p-3 rounded-xl text-[15px] outline-none"
              style={{ border: "1px solid #d8d2c6" }}
            />
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  if (draft.trim()) onAdd(draft.trim(), "registration");
                  setDraft("");
                  setAdding(false);
                }}
                className="flex-1 py-3 rounded-xl text-[15px] font-bold text-white"
                style={{ background: ORANGE }}
              >
                להוסיף
              </button>
              <button onClick={() => setAdding(false)} className="px-4 py-3 rounded-xl text-[15px]" style={{ background: "#f4f1ea" }}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full p-3.5 rounded-2xl text-[14px] font-bold"
            style={{ border: "1px dashed #ddd6c8", color: "#8a8377" }}
          >
            להוסיף משימה
          </button>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task, compact, onToggle, onOpen, onRemove,
}: {
  task: PlanTask;
  compact: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const urgent = task.due ? daysUntil(new Date(task.due)) <= 7 : false;

  // פתיחה נספרת, סגירה לא — מה שמעניין הוא כמה פעמים חזר אליה
  const handleExpand = () => {
    if (!expanded) onOpen(task.id);
    setExpanded(!expanded);
  };

  if (compact)
    return (
      <button
        onClick={handleExpand}
        className="w-full p-3.5 rounded-[14px] text-right"
        style={{ background: "#fff", border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold flex-1" style={{ color: "#1c1a16" }}>{task.title}</span>
          <span className="px-2.5 py-[3px] rounded-full text-[11px] font-bold shrink-0" style={{ background: "#f4f1ea", color: "#7a746a" }}>
            {AREA_LABEL[task.area]}
          </span>
        </div>
        {expanded && task.note && (
          <div className="text-[13px] mt-2" style={{ color: "#5c574e", lineHeight: 1.55 }}>{task.note}</div>
        )}
      </button>
    );

  return (
    <div
      className="p-3.5 rounded-[14px] flex gap-3"
      style={{ background: "#fff", border: `1px solid ${urgent ? "#f3d2d2" : BORDER}` }}
    >
      <button
        onClick={() => onToggle(task.id)}
        aria-label="סימון כבוצע"
        className="shrink-0 flex items-center justify-center"
        style={{ width: 44, height: 44, marginRight: -11, marginTop: -11, marginBottom: -11 }}
      >
        <span style={{ width: 22, height: 22, borderRadius: 7, border: "2px solid #d8d2c6", display: "block" }} />
      </button>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="text-[16px] font-bold" style={{ color: "#1c1a16" }}>{task.title}</div>
        {task.due && (
          <div className="text-[13px] font-semibold" style={{ color: urgent ? RED : "#7a746a" }}>
            {dueText(task.due)}
          </div>
        )}
        {task.note && (
          <div className="text-[13px]" style={{ color: "#5c574e", lineHeight: 1.55 }}>{task.note}</div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="px-2.5 py-[3px] rounded-full text-[11px] font-bold" style={{ background: "#f4f1ea", color: "#7a746a" }}>
            {AREA_LABEL[task.area]}
          </span>
          <button onClick={() => onRemove(task.id)} className="text-[12px]" style={{ color: "#a8a196" }}>
            למחוק
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── החשבון — מספר במקום הרגעה ────────────────────────────────────────────────

/** עוטף שרושם פתיחה אחת של מסך החשבון — אחד ממדדי שלב 5 באנליטיקות */
function MoneyOnce() {
  useEffect(() => { logEvent("plan_money_opened"); }, []);
  return <MoneyView />;
}


function MoneyView() {
  const perach = SCHOLARSHIPS.find(s => s.id === "perach")!;
  const gap = BUDGETED_TUITION - (perach.amount ?? 0);

  return (
    <div className="pt-4 px-4 pb-6 flex flex-col gap-4">
      <div className="px-1">
        <h1 className="text-[22px] font-extrabold" style={{ color: NAVY }}>כמה זה באמת עולה</h1>
        <p className="text-[15px] mt-1.5" style={{ color: "#5c574e", lineHeight: 1.55 }}>
          המספרים כאן הם מה שאומת מול הגופים עצמם. מה שלא פורסם — כתוב שלא פורסם.
        </p>
      </div>

      <div className="p-[18px] rounded-[18px]" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
        <Row label="שכר לימוד לשנה, במוסד מתוקצב" value={`${BUDGETED_TUITION.toLocaleString("he-IL")} ₪`} />
        <div style={{ height: 1, background: BORDER, margin: "12px 0" }} />
        <Row label="פר״ח מכסה עד" value={`${perach.amount!.toLocaleString("he-IL")} ₪`} tone={GREEN} />
        <div className="text-[12.5px] mt-1" style={{ color: "#8a8377" }}>{perach.amountNote}</div>
        <div style={{ height: 1, background: BORDER, margin: "12px 0" }} />
        <Row label="נשאר" value={`${gap.toLocaleString("he-IL")} ₪`} bold />
        <div className="text-[13.5px] mt-2.5" style={{ color: "#5c574e", lineHeight: 1.55 }}>
          וזה עוד לפני מרום, שנוספת על פר״ח. מרום מחשבת אחוז משכר הלימוד לפי דירוג
          המקצוע — <b>הסכום לתשפ״ז יפורסם בספטמבר</b>, ולכן לא כתוב כאן מספר.
        </div>
      </div>

      <div className="p-[18px] rounded-[18px]" style={{ background: "#fff7ec", border: "1px solid #f5dcb8" }}>
        <div className="text-[15px] font-extrabold mb-1.5" style={{ color: "#b35f00" }}>
          המלגות לא מתחברות אוטומטית
        </div>
        <div className="text-[14px]" style={{ color: "#4b4740", lineHeight: 1.6 }}>
          חלק מהן חוסמות אחת את השנייה, וזה לא כתוב במקום אחד. הצירוף שעובד למועמד
          טיפוסי: <b>{RECOMMENDED_STACK.map(id => SCHOLARSHIPS.find(s => s.id === id)?.name).join(" ← ")}</b>.
        </div>
      </div>

      <div className="text-[13px] font-bold px-1" style={{ color: "#8a8377", letterSpacing: "0.04em" }}>
        כל המלגות, לפי סדר הסגירה
      </div>

      <div className="flex flex-col gap-2.5">
        {SCHOLARSHIPS.map(s => {
          const closes = s.closesAt ? nextOccurrence(s.closesAt.d, s.closesAt.m) : null;
          const d = closes ? daysUntil(closes) : null;
          return (
            <div key={s.id} className="p-4 rounded-[14px]" style={{ background: "#fff", border: `1px solid ${d !== null && d <= 14 ? "#f3d2d2" : BORDER}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-[16px] font-bold" style={{ color: "#1c1a16" }}>{s.name}</div>
                {closes ? (
                  <span
                    className="px-2.5 py-1 rounded-full text-[11.5px] font-bold shrink-0"
                    style={{
                      background: d !== null && d <= 14 ? RED : "#f4f1ea",
                      color: d !== null && d <= 14 ? "#fff" : "#7a746a",
                    }}
                  >
                    {dueText(closes.toISOString())}
                  </span>
                ) : null}
              </div>
              <div className="text-[13.5px] mt-1.5" style={{ color: "#5c574e", lineHeight: 1.55 }}>{s.what}</div>
              {s.windowNote && (
                <div className="text-[13px] mt-1.5" style={{ color: "#8a8377" }}>{s.windowNote}</div>
              )}
              {s.catch && (
                <div className="text-[13.5px] mt-2 p-2.5 rounded-lg" style={{ background: "#fff7ec", color: "#8a4d00", lineHeight: 1.55 }}>
                  {s.catch}
                </div>
              )}
              {s.status === "needs-check" && (
                <div className="text-[12.5px] mt-2" style={{ color: "#8a8377" }}>
                  ⚠︎ הפרטים לא אומתו מול הגוף עצמו — לשאול את הרכזת
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-[14px] text-[13px]" style={{ background: "#f6f3ec", border: `1px solid ${BORDER}`, color: "#5c574e", lineHeight: 1.6 }}>
        הרשימה הזו חלקית — יש מלגות שלא מצאנו, ותנאים משתנים משנה לשנה. אם שמעת על
        מלגה שלא מופיעה כאן, זה לא אומר שהיא לא קיימת. שווה לשאול את הרכזת.
      </div>
    </div>
  );
}

function Row({ label, value, tone, bold }: { label: string; value: string; tone?: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[14.5px]" style={{ color: "#5c574e" }}>{label}</span>
      <span
        className="shrink-0"
        style={{ fontSize: bold ? 22 : 18, fontWeight: bold ? 800 : 700, color: tone ?? (bold ? NAVY : "#1c1a16") }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── 3 — ארון המסמכים ─────────────────────────────────────────────────────────

function DocsView({
  docs, onOpenSheet, onRemove,
}: {
  docs: PlanDoc[];
  onOpenSheet: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="pt-4 px-4 pb-6 flex flex-col gap-4">
      <div className="px-1">
        <h1 className="text-[22px] font-extrabold" style={{ color: NAVY }}>ארון המסמכים</h1>
        <p className="text-[15px] mt-1.5" style={{ color: "#5c574e", lineHeight: 1.55 }}>
          כאן אתה מסמן אילו מסמכים כבר יש לך ואיפה הם שמורים.
        </p>
      </div>

      {docs.length === 0 ? (
        <>
          {/* מצב ריק — לא מציגים רשימה מוכנה של מסמכים חסרים. שישה מסמכים שאין
              לו זה שישה כישלונות במסך אחד. הוא מוסיף רק מה שביקשו ממנו בפועל */}
          <div className="p-[22px] rounded-[18px] flex flex-col gap-3.5" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
            <div className="text-[17px] font-extrabold" style={{ color: "#1c1a16" }}>הארון ריק — וזה בסדר</div>
            <div className="text-[15px]" style={{ color: "#4b4740", lineHeight: 1.6 }}>
              כשמוסד או מלגה מבקשים ממך מסמך, תוסיף אותו לכאן. בפעם הבאה שיבקשו את אותו
              מסמך — הוא כבר יהיה מסומן, ותדע איפה הוא.
            </div>
            <button onClick={onOpenSheet} className="w-full py-3.5 rounded-xl text-[16px] font-bold text-white" style={{ background: ORANGE }}>
              להוסיף מסמך
            </button>
          </div>

          <div className="p-4 rounded-2xl" style={{ background: "#fff7ec", border: "1px solid #f5dcb8" }}>
            <div className="text-[15px] font-extrabold mb-1" style={{ color: "#b35f00" }}>שווה לדעת</div>
            <div className="text-[14px]" style={{ color: "#4b4740", lineHeight: 1.6 }}>
              חלק מהמסמכים לא נמצאים אצלך בבית וצריך להוציא אותם — אישור שחרור, גיליון
              ציונים, אישור הכנסה. אם אתה יודע שתצטרך אחד מהם, כדאי להתחיל מוקדם.
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="p-[18px] rounded-[18px]" style={{ background: GREEN, color: "#fff" }}>
            <div className="text-[22px] font-extrabold">{docs.length} מסמכים בארון</div>
            <div className="text-[15px] mt-1.5" style={{ color: "#e3f6ee", lineHeight: 1.5 }}>
              בהגשה הבאה לא תתחיל מאפס — תדע מה יש לך ואיפה הוא.
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {docs.map(d => (
              <div key={d.id} className="p-3.5 rounded-[13px] flex items-center gap-3" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: GREEN, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold" style={{ color: "#1c1a16" }}>{d.name}</div>
                  {d.locations.length > 0 && (
                    <div className="text-[13px]" style={{ color: "#7a746a" }}>{d.locations.join(" · ")}</div>
                  )}
                </div>
                <button onClick={() => onRemove(d.id)} className="text-[12.5px] shrink-0" style={{ color: "#a8a196" }}>
                  למחוק
                </button>
              </div>
            ))}
          </div>

          <button onClick={onOpenSheet} className="w-full p-3.5 rounded-2xl text-[14px] font-bold" style={{ border: "1px dashed #ddd6c8", color: "#8a8377" }}>
            להוסיף מסמך
          </button>
        </>
      )}

      <div className="p-3.5 rounded-[14px] text-[14px]" style={{ background: "#f6f3ec", border: `1px solid ${BORDER}`, color: "#5c574e", lineHeight: 1.55 }}>
        האפליקציה לא שומרת קבצים — רק את מה שסימנת כאן. המסמכים עצמם נשארים אצלך.
      </div>
    </div>
  );
}

// ─── 3c — הוספת מסמך ──────────────────────────────────────────────────────────

const LOCATIONS = ["בטלפון", "במייל", "מודפס בבית", "בדרייב", "אצל ההורים"];

function AddDocSheet({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (name: string, have: boolean, locations: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [have, setHave] = useState<boolean | null>(null);
  const [locs, setLocs] = useState<string[]>([]);
  const known = DOC_CATALOG.find(d => d.name === name);

  const toggleLoc = (l: string) => setLocs(locs.includes(l) ? locs.filter(x => x !== l) : [...locs, l]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end" style={{ background: "rgba(2,62,138,0.35)" }} onClick={onClose} dir="rtl">
      <div
        className="w-full max-w-[560px] mx-auto p-5 pb-6 flex flex-col gap-4"
        style={{ background: SURFACE, borderRadius: "24px 24px 0 0", maxHeight: "88vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 44, height: 5, borderRadius: 999, background: "#ddd6c8", margin: "0 auto" }} />

        <div className="text-[21px] font-extrabold" style={{ color: NAVY }}>איזה מסמך ביקשו ממך?</div>

        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="שם המסמך"
          className="w-full p-3.5 rounded-[13px] text-[16px] outline-none"
          style={{ background: "#fff", border: "1px solid #d8d2c6" }}
        />

        <div className="flex flex-wrap gap-2">
          {DOC_CATALOG.map(d => (
            <button
              key={d.id}
              onClick={() => setName(d.name)}
              className="px-3 py-2 rounded-full text-[13px] font-bold"
              style={{
                background: name === d.name ? NAVY : "#f4f1ea",
                color: name === d.name ? "#fff" : "#4b4740",
                border: name === d.name ? "none" : "1px solid #e7e2d9",
              }}
            >
              {d.name}
            </button>
          ))}
        </div>

        {known?.where && (
          <div className="p-3 rounded-xl text-[13.5px]" style={{ background: "#fff7ec", color: "#8a4d00", lineHeight: 1.55 }}>
            מאיפה מוציאים: {known.where}
          </div>
        )}

        <div className="text-[16px] font-bold" style={{ color: "#1c1a16" }}>כבר יש לך אותו?</div>
        <div className="flex gap-2.5">
          {[
            { v: true, l: "כן, יש לי" },
            { v: false, l: "עוד אין לי" },
          ].map(o => (
            <button
              key={o.l}
              onClick={() => setHave(o.v)}
              className="flex-1 py-3 rounded-xl text-[15px] font-bold"
              style={{
                background: have === o.v ? (o.v ? GREEN : NAVY) : "#fff",
                color: have === o.v ? "#fff" : "#4b4740",
                border: have === o.v ? "none" : "1px solid #d8d2c6",
              }}
            >
              {o.l}
            </button>
          ))}
        </div>

        {have === true && (
          <>
            <div className="text-[16px] font-bold" style={{ color: "#1c1a16" }}>איפה הוא שמור?</div>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(l => (
                <button
                  key={l}
                  onClick={() => toggleLoc(l)}
                  className="px-3.5 py-2 rounded-full text-[14px] font-bold"
                  style={{
                    background: locs.includes(l) ? NAVY : "#fff",
                    color: locs.includes(l) ? "#fff" : "#4b4740",
                    border: locs.includes(l) ? "none" : "1px solid #d8d2c6",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        )}

        {have === false && (
          <div className="p-3.5 rounded-xl text-[14px]" style={{ background: "#f6f3ec", color: "#5c574e", lineHeight: 1.55 }}>
            נוסיף את זה כמשימה בתוכנית, כדי שלא תשכח להוציא אותו.
          </div>
        )}

        <button
          disabled={!name.trim() || have === null}
          onClick={() => onSave(name.trim(), have === true, locs)}
          className="w-full py-4 rounded-[13px] text-[16px] font-extrabold text-white"
          style={{ background: !name.trim() || have === null ? "#c9c3b8" : ORANGE }}
        >
          {have === false ? "להוסיף כמשימה" : "לשמור בארון"}
        </button>
      </div>
    </div>
  );
}

// ─── 4a — סיכום לרכזת ─────────────────────────────────────────────────────────

function CoordView({
  tasks, docs, apps, onStatus,
}: {
  tasks: PlanTask[];
  docs: PlanDoc[];
  apps: Record<string, AppStatus>;
  onStatus: (id: string, s: AppStatus) => void;
}) {
  const done = tasks.filter(t => t.status === "done");
  const stuck = tasks.filter(t => t.status === "open" && t.due && daysUntil(new Date(t.due)) < 0);
  const next = tasks
    .filter(t => t.status === "open" && t.due && daysUntil(new Date(t.due)) >= 0)
    .sort((a, b) => (a.due! < b.due! ? -1 : 1))[0];

  const [excluded, setExcluded] = useState<string[]>([]);
  const lines = useMemo(() => {
    const out: { id: string; text: string }[] = [];
    done.forEach(t => out.push({ id: t.id, text: `✓ ${t.title}` }));
    Object.entries(apps).forEach(([id, s]) => {
      const name = SCHOLARSHIPS.find(x => x.id === id)?.name ?? id;
      out.push({
        id: `a-${id}`,
        text: s === "accepted" ? `✓ התקבלתי ל${name}` : s === "rejected" ? `✕ לא התקבלתי ל${name}` : `⋯ ממתין לתשובה מ${name}`,
      });
    });
    if (docs.length) out.push({ id: "docs", text: `יש לי ${docs.length} מסמכים מוכנים` });
    stuck.forEach(t => out.push({ id: `st-${t.id}`, text: `תקוע: ${t.title}` }));
    if (next) out.push({ id: "next", text: `הדדליין הבא: ${next.title} — ${dueText(next.due!)}` });
    return out;
  }, [tasks, docs, apps]);

  const included = lines.filter(l => !excluded.includes(l.id));
  const message = `עדכון מהאפליקציה:\n\n${included.map(l => l.text).join("\n")}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="pt-4 px-4 pb-6 flex flex-col gap-4">
      <div className="px-1">
        <h1 className="text-[22px] font-extrabold" style={{ color: NAVY }}>עדכון לרכזת</h1>
        <p className="text-[15px] mt-1.5" style={{ color: "#5c574e", lineHeight: 1.55 }}>
          נבנה מעצמו ממה שסימנת. אתה רואה בדיוק מה יישלח, ויכול להוריד שורות.
        </p>
      </div>

      {/* סטטוס הגשות. האדום מרוסן בכוונה — נקודה על רקע לבן ולא כרטיס אדום,
          כדי שדחייה תיקרא כמצב לגיטימי ולא ככישלון */}
      <div className="text-[13px] font-bold px-1" style={{ color: "#8a8377", letterSpacing: "0.04em" }}>
        מה קרה עם ההגשות
      </div>
      <div className="flex flex-col gap-2">
        {RECOMMENDED_STACK.map(id => {
          const s = SCHOLARSHIPS.find(x => x.id === id)!;
          const st = apps[id];
          const style =
            st === "accepted"
              ? { background: "#eef8f3", border: "1px solid #cfe9dd", dot: GREEN, color: "#08694c" }
              : st === "waiting"
                ? { background: "#fff7ec", border: "1px solid #f5dcb8", dot: ORANGE, color: "#8a4d00" }
                : st === "rejected"
                  ? { background: "#fff", border: `1px solid ${BORDER}`, dot: RED, color: "#1c1a16" }
                  : { background: "#fff", border: `1px solid ${BORDER}`, dot: "#cfc9bd", color: "#7a746a" };
          return (
            <div key={id} className="p-3.5 rounded-[13px]" style={{ background: style.background, border: style.border }}>
              <div className="flex items-center gap-3">
                <span style={{ width: 18, height: 18, borderRadius: 999, background: style.dot, flexShrink: 0 }} />
                <span className="text-[15px] font-semibold flex-1" style={{ color: style.color }}>
                  {s.name}
                  {st === "accepted" && " — התקבלתי"}
                  {st === "waiting" && " — ממתין לתשובה"}
                  {st === "rejected" && " — לא התקבלתי"}
                </span>
              </div>
              <div className="flex gap-2 mt-2.5">
                {([
                  ["waiting", "הגשתי"],
                  ["accepted", "התקבלתי"],
                  ["rejected", "לא התקבלתי"],
                ] as const).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => onStatus(id, v)}
                    className="flex-1 py-2 rounded-lg text-[12.5px] font-bold"
                    style={{
                      background: st === v ? NAVY : "#f4f1ea",
                      color: st === v ? "#fff" : "#4b4740",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[13px] font-bold px-1 mt-1" style={{ color: "#8a8377", letterSpacing: "0.04em" }}>
        מה יישלח
      </div>
      {lines.length === 0 ? (
        <div className="p-4 rounded-[14px] text-[14px]" style={{ background: "#f6f3ec", border: `1px solid ${BORDER}`, color: "#5c574e" }}>
          עוד אין מה לעדכן. סמן משימה שסיימת, והיא תופיע כאן.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lines.map(l => {
            const off = excluded.includes(l.id);
            return (
              <button
                key={l.id}
                onClick={() => setExcluded(off ? excluded.filter(x => x !== l.id) : [...excluded, l.id])}
                className="p-3.5 rounded-[13px] text-right flex items-center gap-3"
                style={{ background: "#fff", border: `1px solid ${BORDER}`, opacity: off ? 0.4 : 1 }}
              >
                <span className="text-[14.5px] flex-1" style={{ color: "#1c1a16", textDecoration: off ? "line-through" : "none" }}>
                  {l.text}
                </span>
                <span className="text-[12px] shrink-0" style={{ color: "#a8a196" }}>{off ? "להחזיר" : "להוריד"}</span>
              </button>
            );
          })}
        </div>
      )}

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackEvent("plan_update_sent");
          localStorage.setItem(LS.sent, new Date().toISOString());
        }}
        className="w-full py-4 rounded-[14px] text-[17px] font-extrabold text-white text-center"
        style={{ background: included.length ? GREEN : "#c9c3b8", pointerEvents: included.length ? "auto" : "none" }}
      >
        לשלוח לרכזת בוואטסאפ
      </a>
      <div className="text-center text-[13px] -mt-2" style={{ color: "#8a8377" }}>
        נפתח אצלך בוואטסאפ. אתה בוחר את הרכזת ואתה שולח.
      </div>
    </div>
  );
}

// ─── 4b — לא התקבלתי ──────────────────────────────────────────────────────────

function RejectedView({ id, onUndo, onBack }: { id: string; onUndo: () => void; onBack: () => void }) {
  const s = SCHOLARSHIPS.find(x => x.id === id);
  const blockedBy = s?.blocks ?? [];

  /** מה שעדיין פתוח — לפי סדר הסגירה, בלי מה שהמלגה הזו חסמה ממילא */
  const stillOpen = SCHOLARSHIPS.filter(x => {
    if (x.id === id || blockedBy.includes(x.id)) return false;
    if (!x.closesAt) return !!x.opensAt || !!x.windowNote;
    return daysUntil(nextOccurrence(x.closesAt.d, x.closesAt.m)) >= 0;
  }).slice(0, 3);

  return (
    <div className="pt-4 px-4 pb-6 flex flex-col gap-4">
      <div className="text-[13px] font-bold px-1" style={{ color: "#8a8377" }}>{s?.name}</div>
      <h1 className="text-[24px] font-extrabold px-1" style={{ color: NAVY, lineHeight: 1.3 }}>
        לא התקבלת לזו.
        <br />
        אלה עדיין פתוחות.
      </h1>
      <p className="text-[15px] px-1" style={{ color: "#5c574e", lineHeight: 1.55 }}>
        המסמכים שהכנת נשארים בארון. בהגשה הבאה לא תתחיל מאפס.
      </p>

      <div className="flex flex-col gap-2.5">
        {stillOpen.map((x, i) => {
          const closes = x.closesAt ? nextOccurrence(x.closesAt.d, x.closesAt.m) : null;
          return (
            <div
              key={x.id}
              className="p-4 rounded-[14px] flex items-center gap-3"
              style={{ background: "#fff", border: `1px solid ${i === 0 ? "#f3d2d2" : BORDER}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-bold" style={{ color: "#1c1a16" }}>{x.name}</div>
                <div className="text-[13px] mt-0.5" style={{ color: "#7a746a" }}>
                  {closes ? dueText(closes.toISOString()) : x.windowNote ?? "החלון עוד פתוח"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl" style={{ background: "#eef8f3", border: "1px solid #cfe9dd" }}>
        <div className="text-[15px] font-extrabold mb-1" style={{ color: "#08694c" }}>שווה לספר לרכזת</div>
        <div className="text-[14px]" style={{ color: "#17614a", lineHeight: 1.55 }}>
          לפעמים יש מסלול נוסף שלא מפורסם, או הגשה מחדש במחזור הבא. היא תדע.
        </div>
      </div>

      <button onClick={onBack} className="w-full py-4 rounded-[14px] text-[16px] font-bold text-white" style={{ background: NAVY }}>
        חזרה לעדכון
      </button>
      <button onClick={onUndo} className="text-center text-[13px]" style={{ color: "#8a8377" }}>
        לבטל את הסימון
      </button>
    </div>
  );
}
