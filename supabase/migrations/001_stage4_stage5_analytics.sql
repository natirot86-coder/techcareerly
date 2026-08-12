-- ═══════════════════════════════════════════════════════════════════════════
-- Techcareerly — מיגרציה 001
--
-- מה יש כבר בבסיס הנתונים (אומת 12.8.2026 מול PostgREST):
--   candidates · tasks · simulation_progress · domain_rankings · chat_messages · nudges
--
-- מה שהמיגרציה הזו מוסיפה:
--   1. institutions      — מאגר המוסדות. היום הוא קבוע בקוד, ולכן עריכה
--                          ב-/admin/institutions נשמרת רק בדפדפן של הרכזת
--   2. scct_scores       — פלט כלי עיבוד החוויה של שלב 3. היום localStorage בלבד
--   3. paths_answers     — שלב 4: תשובות, המלצה ורשימת מוסדות. היום localStorage
--   4. plan_tasks        — שלב 5: משימות. היום localStorage
--   5. plan_documents    — שלב 5: ארון המסמכים. סטטוס ומיקום בלבד — **לא קבצים**
--   6. plan_applications — שלב 5: סטטוס הגשות למלגות
--   7. funnel_events     — לוג אירועים. הפער הגדול ביותר: שלב 3 עיוור לחלוטין
--   8. admin_stats()     — צבירה בלבד, בלי שום נתון מזהה
--
-- ⚠️ הארון לא שומר קבצים, במכוון. החזקת תעודות זהות, תלושי שכר ואישורי הכנסה
--    של מועמדים היא אחריות משפטית שלא מחזירים אחורה. אם זה ישתנה — לשנות גם
--    את הטקסט במסך, כי כרגע כתוב שם למועמד שהאפליקציה לא שומרת קבצים.
--
-- להרצה: Supabase Dashboard ← SQL Editor ← הדבקה ← Run.
-- אין צורך במפתח service_role ואין צורך בכלים חיצוניים.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. מוסדות ─────────────────────────────────────────────────────────────
-- המאגר הציבורי. קריאה לכולם, כתיבה רק למחוברים (בהמשך: רק לרכזות).

create table if not exists public.institutions (
  id              text primary key,
  name            text not null,
  track           text not null check (track in ('degree', 'mahat', 'bootcamp')),
  domains         text[] not null default '{}',
  why             text,
  warn            text,
  tag             text,
  tag_color       text,
  link            text,
  location        text,
  tuition         text,
  admission       text,
  no_psychometric text,
  support         text,
  industry        text,
  schedule        text,
  contact_name    text,
  contact_role    text,
  contact_phone   text,
  contact_email   text,
  open_days       text,
  -- אישור נפרד מ-status בכוונה: מוסד יכול להיות פעיל באתר ועדיין לא נסקר
  approved        boolean,
  status          text not null default 'active' check (status in ('active', 'hidden', 'needs-check')),
  notes           text,
  verified        text,
  updated_at      timestamptz not null default now()
);

alter table public.institutions enable row level security;

drop policy if exists "institutions readable by all" on public.institutions;
create policy "institutions readable by all"
  on public.institutions for select using (true);

drop policy if exists "institutions writable by authenticated" on public.institutions;
create policy "institutions writable by authenticated"
  on public.institutions for all to authenticated using (true) with check (true);

-- ─── 2. פלט כלי עיבוד החוויה (SCCT) ────────────────────────────────────────
-- עניין / מסוגלות / ציפיות תוצאה. מדד השליחות: עניין גבוה + מסוגלות נמוכה.

create table if not exists public.scct_scores (
  id               uuid primary key default gen_random_uuid(),
  candidate_id     uuid not null references public.candidates(id) on delete cascade,
  domain_id        text not null,
  interest         smallint check (interest between 1 and 5),
  self_efficacy    smallint check (self_efficacy between 1 and 5),
  outcome_expect   smallint check (outcome_expect between 1 and 5),
  note             text,
  created_at       timestamptz not null default now(),
  unique (candidate_id, domain_id)
);

-- ─── 3. שלב 4 — מסלולי לימוד ───────────────────────────────────────────────

create table if not exists public.paths_answers (
  candidate_id   uuid primary key references public.candidates(id) on delete cascade,
  answers        jsonb not null default '{}'::jsonb,
  recommendation text check (recommendation in ('degree', 'mahat', 'bootcamp')),
  scores         jsonb,
  shortlist      jsonb not null default '[]'::jsonb,
  research       jsonb not null default '{}'::jsonb,
  completed_at   timestamptz,
  updated_at     timestamptz not null default now()
);

-- ─── 4. שלב 5 — לוגיסטיקה ומלגות ───────────────────────────────────────────

create table if not exists public.plan_tasks (
  id           text not null,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title        text not null,
  note         text,
  area         text not null check (area in ('scholarship', 'registration', 'housing', 'money')),
  due_date     date,
  source       text not null default 'generated' check (source in ('generated', 'user')),
  status       text not null default 'open' check (status in ('open', 'done')),
  -- כמה פעמים המשימה נפתחה בלי שנסגרה. אות התנהגותי, לא שאלון
  open_count   integer not null default 0,
  done_at      timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (candidate_id, id)
);

-- סטטוס ומיקום בלבד. אין fileRef ואין bucket — ראה האזהרה בראש הקובץ.
create table if not exists public.plan_documents (
  id           text not null,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  name         text not null,
  have         boolean not null default false,
  locations    text[] not null default '{}',
  created_at   timestamptz not null default now(),
  primary key (candidate_id, id)
);

create table if not exists public.plan_applications (
  funding_id   text not null,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  status       text not null check (status in ('draft', 'submitted', 'waiting', 'accepted', 'rejected')),
  decided_at   timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (candidate_id, funding_id)
);

-- ─── 5. לוג אירועים ────────────────────────────────────────────────────────
-- הפער הגדול ביותר היום: שלב 3 כולו בלי מדידה, ולכן אי אפשר לדעת איפה נוטשים
-- בתוך סימולציה — רק אם הושלמה. name לדוגמה: 'sim_step', 'sim_abandon',
-- 'paths_question', 'plan_money_opened'.

create table if not exists public.funnel_events (
  id           bigserial primary key,
  candidate_id uuid references public.candidates(id) on delete cascade,
  name         text not null,
  props        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists funnel_events_name_created_idx
  on public.funnel_events (name, created_at desc);
create index if not exists funnel_events_candidate_idx
  on public.funnel_events (candidate_id);

-- ─── 6. RLS — כל מועמד רואה רק את עצמו ─────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'scct_scores', 'paths_answers', 'plan_tasks',
    'plan_documents', 'plan_applications', 'funnel_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (candidate_id = auth.uid()) with check (candidate_id = auth.uid())', t);
  end loop;
end $$;

-- ─── 7. צבירה לדף הניהול ───────────────────────────────────────────────────
--
-- SECURITY DEFINER כדי לעקוף RLS — אחרת דף האנליטיקות לא יוכל לצבור כלום,
-- כי כל מועמד רואה רק את השורה שלו. הפונקציה מחזירה **ספירות בלבד**:
-- אין ממנה דרך להוציא שם, טלפון או שורה של מועמד ספציפי.
--
-- ⚠️ המספרים האלה חסרי משמעות סטטיסטית בנפח נמוך. השימוש הכן הראשון הוא
--    לצפות במסעות בודדים, לא להסיק אחוזים משני אנשים.

create or replace function public.admin_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'candidates',        (select count(*) from candidates),
    'onboarded',         (select count(*) from candidates where onboarding_completed_at is not null),
    'returning',         (select count(*) from candidates
                            where last_active_at > created_at + interval '1 day'),
    'at_risk',           (select count(*) from candidates
                            where last_active_at < now() - interval '72 hours'),
    'by_stage',          (select coalesce(jsonb_object_agg(current_stage::text, n), '{}'::jsonb)
                            from (select current_stage, count(*) n from candidates
                                  group by current_stage) s),
    'by_status',         (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                            from (select status, count(*) n from candidates
                                  group by status) s),
    'sims_started',      (select count(*) from simulation_progress),
    'sims_completed',    (select count(*) from simulation_progress where completed),
    'sims_by_domain',    (select coalesce(jsonb_object_agg(domain_id, n), '{}'::jsonb)
                            from (select domain_id, count(*) n from simulation_progress
                                  where completed group by domain_id) s),
    'chosen_domains',    (select coalesce(jsonb_object_agg(chosen_domain, n), '{}'::jsonb)
                            from (select chosen_domain, count(*) n from candidates
                                  where chosen_domain is not null group by chosen_domain) s),
    -- מדד השליחות: עניין גבוה מול מסוגלות נמוכה. מי שכאן הוא בדיוק
    -- האדם שבשבילו הארגון קיים
    'interest_gap',      (select count(*) from scct_scores
                            where interest >= 4 and self_efficacy <= 2),
    'paths_completed',   (select count(*) from paths_answers where completed_at is not null),
    'recommendations',   (select coalesce(jsonb_object_agg(recommendation, n), '{}'::jsonb)
                            from (select recommendation, count(*) n from paths_answers
                                  where recommendation is not null group by recommendation) s),
    'plan_open',         (select count(*) from plan_tasks where status = 'open'),
    'plan_done',         (select count(*) from plan_tasks where status = 'done'),
    -- אות הפחד, נמדד בהתנהגות: משימה שעברה את התאריך ונשארה פתוחה
    'plan_overdue',      (select count(*) from plan_tasks
                            where status = 'open' and due_date < current_date),
    'events_7d',         (select coalesce(jsonb_object_agg(name, n), '{}'::jsonb)
                            from (select name, count(*) n from funnel_events
                                  where created_at > now() - interval '7 days'
                                  group by name) s),

    -- ── פאנל הפגישות — כוכב הצפון של האפליקציה ──────────────────────────
    -- האפליקציה לא רושמת אף אחד. היא מביאה אותו מוכן לפגישה, והרכזת סוגרת.
    -- לכן זה המספר החשוב ביותר בכל המערכת, וכל השאר במעלה הזרם ממנו.
    'meetings',          (select jsonb_build_object(
                            'm1', count(*) filter (where props->>'n' = '1'),
                            'm2', count(*) filter (where props->>'n' = '2'),
                            'm3', count(*) filter (where props->>'n' = '3'))
                            from (select distinct candidate_id, props from funnel_events
                                  where name = 'meeting_booked') s),

    -- ── חסמים ──────────────────────────────────────────────────────────────
    -- הנתון היקר ביותר באפליקציה: מה באמת עוצר אנשים. אין דרך אחרת להשיג אותו.
    'blockers_opened',   (select coalesce(jsonb_object_agg(b, n), '{}'::jsonb)
                            from (select props->>'blocker' b, count(*) n
                                  from funnel_events
                                  where name = 'paths_blocker_open'
                                    and props->>'blocker' is not null
                                  group by 1) s),

    -- ── נטישה בתוך שאלון שלב 4, לפי שאלה ───────────────────────────────────
    -- ההשערה שכדאי לבדוק ראשונה: שאלת הכסף היא זו שמאבדת אנשים
    'quiz_reach',        (select coalesce(jsonb_object_agg(q, n), '{}'::jsonb)
                            from (select props->>'answered' q, count(distinct candidate_id) n
                                  from funnel_events
                                  where name = 'paths_question'
                                  group by 1) s),

    -- ── מטריצת SCCT, 5×5 ───────────────────────────────────────────────────
    -- עניין מול מסוגלות. הרביע של עניין גבוה + מסוגלות נמוכה הוא הקהל שלנו.
    'scct_grid',         (select coalesce(jsonb_agg(jsonb_build_object(
                              'i', interest, 'e', self_efficacy, 'n', n)), '[]'::jsonb)
                            from (select interest, self_efficacy, count(*) n
                                  from scct_scores
                                  where interest is not null and self_efficacy is not null
                                  group by 1, 2) s),

    -- ── שעות שימוש ─────────────────────────────────────────────────────────
    -- הקהל שלנו עובד. אם השימוש מתרכז בשעות הערב — זה משנה מתי רכזות
    -- צריכות להיות זמינות. החלטה תפעולית שנגזרת ישירות מנתון.
    'by_hour',           (select coalesce(jsonb_object_agg(h::text, n), '{}'::jsonb)
                            from (select extract(hour from created_at at time zone 'Asia/Jerusalem')::int h,
                                         count(*) n
                                  from funnel_events
                                  where created_at > now() - interval '30 days'
                                  group by 1) s),

    -- ── משימה שנכשלה שלוש פעמים ────────────────────────────────────────────
    -- הסף מ-CLAUDE.md: שלוש פתיחות בלי סגירה ← משימה דחופה לרכזת
    'stuck_3x',          (select count(*) from plan_tasks
                            where status = 'open' and open_count >= 3),

    'generated_at',      now()
  );
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to anon, authenticated;
