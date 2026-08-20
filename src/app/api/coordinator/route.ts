/**
 * GET /api/coordinator — הנתונים למסך הרכזת.
 *
 * רץ בצד שרת עם המפתח הסודי (SUPABASE_SECRET_KEY), כי ה-RLS מגביל כל מועמד
 * לשורה שלו — והרכזת צריכה לראות את כולם. **המפתח לעולם לא מגיע לדפדפן.**
 *
 * כוכב הצפון של המסך: "מי צריך אותי היום" — תור חילוץ, לא CRM. לכן ה-API
 * מחזיר סיגנלים ממוינים לפי דחיפות, וכל סיגנל נושא את הסיבה שלו במילים.
 *
 * שער גישה: COORDINATOR_CODE ב-env. לא מערכת הרשאות אמיתית — שכבת הגנה
 * מינימלית עד שיהיה Auth לרכזות. בלי הקוד ב-env — המסלול נעול לגמרי.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Signal = {
  severity: 1 | 2 | 3; // 1 = הכי דחוף
  reason: string;
  action: "call" | "whatsapp" | "watch";
};

export async function GET(req: NextRequest) {
  const code = process.env.COORDINATOR_CODE;
  if (!code) {
    return NextResponse.json({ error: "COORDINATOR_CODE not configured" }, { status: 503 });
  }
  if (req.headers.get("x-coordinator-code") !== code) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY not configured" }, { status: 503 });
  }

  const db = createClient(url, secret, { auth: { persistSession: false } });

  const [candidates, events, tasks, scct, ranks] = await Promise.all([
    db.from("candidates")
      .select("id, first_name, last_name, region, current_stage, last_active_at, created_at, chosen_domain")
      .order("last_active_at", { ascending: false }),
    db.from("funnel_events")
      .select("candidate_id, name, props, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    db.from("plan_tasks")
      .select("candidate_id, title, due_date, status, open_count"),
    db.from("scct_scores")
      .select("candidate_id, domain_id, interest, self_efficacy"),
    // לאן הוא הלך: הדירוג מהחשיפה. מוצג לצד התחום שנבחר בסוף
    db.from("domain_rankings")
      .select("candidate_id, domain_id, rank")
      .order("rank", { ascending: true }),
  ]);

  const err = candidates.error ?? events.error ?? tasks.error ?? scct.error ?? ranks.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  const now = Date.now();
  const DAY = 86400000;

  /**
   * תאריך בטוח.
   *
   * `new Date("משהו לא תקין").toISOString()` **זורק RangeError**, ובמסלול
   * הזה שגיאה אחת מפילה את כל התשובה — כלומר שורה פגומה אחת מחשיכה את
   * המסך לכל הרכזות. מחזיר 0 במקום להתפוצץ.
   */
  const ms = (v: unknown): number => {
    const t = v ? new Date(v as string).getTime() : NaN;
    return Number.isFinite(t) ? t : 0;
  };
  const iso = (t: number): string | null =>
    Number.isFinite(t) && t > 0 ? new Date(t).toISOString() : null;

  let skipped = 0;

  const queue = (candidates.data ?? []).flatMap(c => {
   try {
    const signals: Signal[] = [];
    const myEvents = (events.data ?? []).filter(e => e.candidate_id === c.id);
    const myTasks = (tasks.data ?? []).filter(t => t.candidate_id === c.id);
    const myScct = (scct.data ?? []).filter(s => s.candidate_id === c.id);
    const myRanks = (ranks.data ?? []).filter(r => r.candidate_id === c.id).map(r => r.domain_id as string);

    // 1 — פספוס פגישה: הסיגנל החזק ביותר בפאנל
    const missed = myEvents.find(e => e.name === "meeting1_checkin" && (e.props as { result?: string })?.result === "missed");
    if (missed) {
      const days = Math.floor((now - ms(missed.created_at)) / DAY);
      signals.push({ severity: 1, reason: `סימן/ה "לא הצלחתי להגיע" לפגישת ההיכרות${days > 0 ? ` — לפני ${days} ימים` : " — היום"}`, action: "call" });
    }

    /*
     * 2 — עצר בשער בחירת הכיוון: ראה את המסך ולא בחר.
     * האופציה "עוד לא סגור" הוסרה בכוונה (נתי 20.8) — ולכן מי שעומד מול
     * השער בלי לבחור חייב להפוך לסיגנל, אחרת לקחנו את פתח המילוט
     * בלי לשים שם רכזת.
     */
    const gate = myEvents.find(e => e.name === "paths_domain_gate");
    const committedDomain = myEvents.some(e => e.name === "domain_committed") || !!c.chosen_domain;
    if (gate && !committedDomain) {
      const days = Math.floor((now - ms(gate.created_at)) / DAY);
      if (days >= 2) {
        signals.push({ severity: 2, reason: `הגיע/ה לבחירת הכיוון בשלב 4 ולא בחר/ה — ${days} ימים. שווה שיחה על התחום`, action: "call" });
      }
    }

    // 1 — דדליין מלגה שעבר עם משימה פתוחה: כסף שלא יחזור
    for (const t of myTasks) {
      if (t.status === "open" && t.due_date && ms(t.due_date) < now) {
        signals.push({ severity: 1, reason: `דדליין עבר והמשימה פתוחה: ${t.title}`, action: "call" });
      }
    }

    /*
     * שתי שתיקות שונות — וזו החשובה מבין השתיים היא השנייה.
     *
     * "נכנס" = last_active_at, שנוגעים בו בכל ניווט. אבל השדה נכתב מהשעון
     * של המכשיר, ואצל חלק מהאנשים הוא שגוי — ולכן לוקחים את המקסימום מול
     * האירוע האחרון, שמקבל חותמת מהשרת ואי אפשר לטעות בו.
     *
     * "עשה משהו" = האירוע המשמעותי האחרון. מי שנעלם לגמרי אולי סתם עסוק;
     * מי שנכנס שוב ושוב ולא מצליח להתקדם הוא מי שנתקע ולא יבקש עזרה
     * מעצמו. זה הכי קרוב שנגיע לראות חיכוך דרך המסך.
     */
    const lastEventAt = myEvents.length ? ms(myEvents[0].created_at) : 0;
    const seenAt = Math.max(ms(c.last_active_at), lastEventAt);
    const idleDays = (now - seenAt) / DAY;

    const doing = myEvents.find(e => e.name !== "app_open");
    const actionDays = doing ? (now - ms(doing.created_at)) / DAY : Infinity;

    if (idleDays >= 3 && c.current_stage >= 2) {
      signals.push({ severity: 2, reason: `לא נכנס/ה ${Math.floor(idleDays)} ימים`, action: "whatsapp" });
    } else if (idleDays < 2 && c.current_stage >= 2) {
      // נכנס, אבל לא זז — הסיגנל של "תקוע", לא של "נעלם"
      if (!doing) {
        const since = Math.floor((now - ms(c.created_at)) / DAY);
        signals.push({
          severity: 2,
          reason: `נכנס/ה אבל עוד לא התחיל/ה כלום${since > 0 ? ` — ${since} ימים מאז ההרשמה` : ""}`,
          action: "call",
        });
      } else if (actionDays >= 5) {
        signals.push({
          severity: 2,
          reason: `נכנס/ה לאחרונה אבל לא התקדם/ה ${Math.floor(actionDays)} ימים — כנראה תקוע/ה`,
          action: "call",
        });
      }
    }

    // 2 — משימה שנפתחה 3 פעמים בלי להיסגר: משהו תקוע
    for (const t of myTasks) {
      if (t.status === "open" && (t.open_count ?? 0) >= 3) {
        signals.push({ severity: 2, reason: `נפתחה 3 פעמים בלי להיסגר: ${t.title}`, action: "whatsapp" });
      }
    }

    // 3 — מדד השליחות: עניין גבוה, מסוגלות נמוכה. שיחה מחזקת, לא חילוץ
    for (const s of myScct) {
      if ((s.interest ?? 0) >= 4 && (s.self_efficacy ?? 0) <= 2) {
        signals.push({ severity: 3, reason: `עניין גבוה (${s.interest}) ומסוגלות נמוכה (${s.self_efficacy}) ב${s.domain_id} — שווה שיחה מחזקת`, action: "whatsapp" });
      }
    }

    const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "מועמד/ת ללא שם";
    return [{
      id: c.id,
      name,
      anonymous: !c.first_name,
      region: c.region,
      stage: c.current_stage,
      domain: c.chosen_domain,
      ranked: myRanks,
      lastActive: iso(seenAt),
      lastAction: doing?.created_at ?? null,
      signals: signals.sort((a, b) => a.severity - b.severity),
      topSeverity: signals.length ? Math.min(...signals.map(s => s.severity)) : 9,
      // ציר הזמן — למסך הפרט: מה קרה, בסדר הפוך
      timeline: myEvents.slice(0, 40).map(e => ({ name: e.name, props: e.props, at: e.created_at })),
    }];
   } catch (e) {
    // שורה פגומה לא מפילה את המסך — היא מדולגת ונספרת, כדי שלא תיעלם בשקט
    console.error("coordinator: skipping candidate", c.id, e);
    skipped++;
    return [];
   }
  });

  queue.sort((a, b) => a.topSeverity - b.topSeverity || ms(b.lastActive) - ms(a.lastActive));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    needsAttention: queue.filter(q => q.signals.length > 0),
    quiet: queue.filter(q => q.signals.length === 0).length,
    total: queue.length,
    skipped, // שורות שלא ניתן היה לחשב — 0 במצב תקין
  });
}
