-- Techcareerly — Supabase schema
-- מריצים את כל הקובץ הזה פעם אחת ב-Supabase SQL Editor (או supabase db push)
-- כל הטבלאות משתמשות ב-auth.users כמקור זהות: candidates.id === auth.uid()
-- זה תומך גם ב-Anonymous Auth (לפני שיש OTP) וגם בהרשמה מלאה בעתיד —
-- כשמועמד עובר מ-anonymous ל-Phone Auth מאומת, ה-uid נשאר זהה (Supabase identity linking).

create extension if not exists "pgcrypto";

-- ─── candidates ────────────────────────────────────────────────────────────
-- שורה אחת למועמד = נתוני האונבורדינג + מיקום נוכחי במסע (6 שלבים)
create table if not exists candidates (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  gender text check (gender in ('male', 'female', 'other')),
  age int check (age between 15 and 80),
  region text,
  tech_interest_score int check (tech_interest_score between 1 and 10),
  blockers text[] not null default '{}',
  current_stage int not null default 1 check (current_stage between 1 and 6),
  status text not null default 'active' check (status in ('active', 'at_risk', 'manual_intervention')),
  onboarding_completed_at timestamptz,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ─── tasks ──────────────────────────────────────────────────────────────────
-- צ'קליסט המשימות בכל שלב (מוצג כ-TaskCard בדשבורד)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  stage int not null check (stage between 1 and 6),
  task_key text not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'in-progress', 'done')),
  progress int not null default 0 check (progress between 0 and 100),
  fail_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique (candidate_id, task_key)
);

-- ─── domain_rankings ────────────────────────────────────────────────────────
-- דירוג התחומים ממסך ה-Explore (code/cyber/ai/ux/data/marketing)
create table if not exists domain_rankings (
  candidate_id uuid not null references candidates(id) on delete cascade,
  domain_id text not null,
  rank int not null check (rank between 1 and 6),
  created_at timestamptz not null default now(),
  primary key (candidate_id, domain_id)
);

-- ─── simulation_progress ────────────────────────────────────────────────────
-- התקדמות בסימולציות עצמן (Data/Marketing/AI/Cyber/UX/Code)
create table if not exists simulation_progress (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  domain_id text not null,
  step int not null default 0,
  completed boolean not null default false,
  score int,
  updated_at timestamptz not null default now(),
  unique (candidate_id, domain_id)
);

-- ─── chat_messages ──────────────────────────────────────────────────────────
-- היסטוריית ה-AI Co-pilot + סנטימנט (בסיס ל-Nudge Logic)
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative', 'frustrated')),
  created_at timestamptz not null default now()
);

-- ─── nudges ─────────────────────────────────────────────────────────────────
-- לוג ההתראות שנשלחות לרכזת (דרך Make.com → Monday.com)
create table if not exists nudges (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('inactivity_72h', 'task_failure_3x', 'negative_sentiment')),
  payload jsonb not null default '{}',
  sent_to_monday boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_tasks_candidate on tasks (candidate_id);
create index if not exists idx_domain_rankings_candidate on domain_rankings (candidate_id);
create index if not exists idx_simulation_progress_candidate on simulation_progress (candidate_id);
create index if not exists idx_chat_messages_candidate on chat_messages (candidate_id, created_at);
create index if not exists idx_nudges_candidate on nudges (candidate_id, created_at);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- כל מועמד (כולל anonymous) רואה ורושם רק את הנתונים של עצמו.
-- הרכזת/Make.com ניגשים דרך ה-service_role key שעוקף RLS — לא צריך פוליסי נפרד.

alter table candidates enable row level security;
alter table tasks enable row level security;
alter table domain_rankings enable row level security;
alter table simulation_progress enable row level security;
alter table chat_messages enable row level security;
alter table nudges enable row level security;

create policy "candidates_select_own" on candidates for select using (auth.uid() = id);
create policy "candidates_insert_own" on candidates for insert with check (auth.uid() = id);
create policy "candidates_update_own" on candidates for update using (auth.uid() = id);

create policy "tasks_select_own" on tasks for select using (auth.uid() = candidate_id);
create policy "tasks_insert_own" on tasks for insert with check (auth.uid() = candidate_id);
create policy "tasks_update_own" on tasks for update using (auth.uid() = candidate_id);

create policy "domain_rankings_select_own" on domain_rankings for select using (auth.uid() = candidate_id);
create policy "domain_rankings_insert_own" on domain_rankings for insert with check (auth.uid() = candidate_id);
create policy "domain_rankings_update_own" on domain_rankings for update using (auth.uid() = candidate_id);
create policy "domain_rankings_delete_own" on domain_rankings for delete using (auth.uid() = candidate_id);

create policy "simulation_progress_select_own" on simulation_progress for select using (auth.uid() = candidate_id);
create policy "simulation_progress_insert_own" on simulation_progress for insert with check (auth.uid() = candidate_id);
create policy "simulation_progress_update_own" on simulation_progress for update using (auth.uid() = candidate_id);

create policy "chat_messages_select_own" on chat_messages for select using (auth.uid() = candidate_id);
create policy "chat_messages_insert_own" on chat_messages for insert with check (auth.uid() = candidate_id);

-- nudges: לקריאה/כתיבה רק מ-service_role (Make.com) — אין פוליסי למועמד עצמו.
