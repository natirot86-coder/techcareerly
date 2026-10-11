-- 017 · ההתקדמות של המשתתף/ת בשרת (נתי, 12.10)
--
-- כל ההתקדמות חיה עד היום ב-localStorage — בדפדפן אחד. דפדפן אחר (טלפון
-- חדש, או הדפדפן של וואטסאפ מול כרום) התחיל מאפס, ומשתתף בפגישה 2 נזרק
-- למסך הפתיחה. ההחלטה: **השרת הוא מקור האמת**, והדפדפן רק עותק שנבנה ממנו.
--
-- טבלה אחת של מפתח⇐ערך, ולא טבלה לכל מסך: 114 מפתחות ב-47 קבצים. לשכתב
-- כל מסך היה שבועות ומקור לבאגים חדשים; כך **אף מסך לא משתנה**, ומפתח
-- שיתווסף מחר מסתנכרן מעצמו (הסנכרון מחריג, לא מונה).
--
-- ⚠️ RLS: כל אחד/ת קורא/ת וכותב/ת רק את השורות שלו/ה — גם משתמש אנונימי
-- (ב-Supabase הוא authenticated עם auth.uid משלו).

create table if not exists candidate_state (
  candidate_id uuid not null references candidates(id) on delete cascade,
  key          text not null,
  value        text not null,
  updated_at   timestamptz not null default now(),
  primary key (candidate_id, key)
);

alter table candidate_state enable row level security;

drop policy if exists "own state" on candidate_state;
create policy "own state" on candidate_state
  for all to authenticated
  using (candidate_id = auth.uid())
  with check (candidate_id = auth.uid());

-- האיחוד (016) חייב להעביר גם את ההתקדמות — אחרת מי שאימת טלפון היה
-- מקבל את השורה ואת האירועים, אבל לא את המקום שבו עצר.
create or replace function public.claim_candidate(p_new uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone text;
  v_old uuid;
  v_count int;
  v_new candidates%rowtype;
  v_old_row candidates%rowtype;
begin
  -- 1. רק משתמש שהטלפון שלו אומת ב-SMS
  select regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') into v_phone
    from auth.users u where u.id = p_new and u.phone_confirmed_at is not null;
  if coalesce(v_phone, '') = '' then return jsonb_build_object('claimed', false, 'why', 'not verified'); end if;

  -- 2. רשומות אחרות על אותו טלפון שאין מאחוריהן אימות
  select count(*) into v_count
    from candidates c left join auth.users u on u.id = c.id
   where c.id <> p_new
     and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone
     and (u.id is null or u.phone_confirmed_at is null);
  if v_count = 0 then return jsonb_build_object('claimed', false, 'why', 'nothing to claim'); end if;

  -- כמה? לוקחים את מי שסיים הרשמה, ואם יש יותר מאחת כזו — לא מנחשים
  select count(*) into v_count
    from candidates c left join auth.users u on u.id = c.id
   where c.id <> p_new
     and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone
     and (u.id is null or u.phone_confirmed_at is null)
     and c.onboarding_completed_at is not null;
  if v_count > 1 then return jsonb_build_object('claimed', false, 'why', 'ambiguous'); end if;

  select c.id into v_old
    from candidates c left join auth.users u on u.id = c.id
   where c.id <> p_new
     and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone
     and (u.id is null or u.phone_confirmed_at is null)
   order by (c.onboarding_completed_at is not null) desc, c.last_active_at desc nulls last
   limit 1;

  -- 3. החדשה חייבת להיות ריקה — שתי היסטוריות הן החלטה של רכז/ת, לא של קוד
  select * into v_new from candidates where id = p_new;
  if found and (v_new.onboarding_completed_at is not null or coalesce(v_new.first_name, '') <> '') then
    return jsonb_build_object('claimed', false, 'why', 'both have history', 'old', v_old);
  end if;
  if not found then insert into candidates (id) values (p_new); end if;

  -- 4. טבלאות עם ייחודיות לפי מועמד: החדשה ריקה, אז מפנים לה מקום
  delete from paths_answers       where candidate_id = p_new;
  delete from domain_rankings     where candidate_id = p_new;
  delete from simulation_progress where candidate_id = p_new;
  delete from scct_scores         where candidate_id = p_new;
  delete from tasks               where candidate_id = p_new;
  delete from candidate_state     where candidate_id = p_new;

  update paths_answers       set candidate_id = p_new where candidate_id = v_old;
  update domain_rankings     set candidate_id = p_new where candidate_id = v_old;
  update simulation_progress set candidate_id = p_new where candidate_id = v_old;
  update scct_scores         set candidate_id = p_new where candidate_id = v_old;
  update tasks               set candidate_id = p_new where candidate_id = v_old;
  update candidate_state     set candidate_id = p_new where candidate_id = v_old;
  update funnel_events       set candidate_id = p_new where candidate_id = v_old;
  update plan_tasks          set candidate_id = p_new where candidate_id = v_old;
  update plan_documents      set candidate_id = p_new where candidate_id = v_old;
  update plan_applications   set candidate_id = p_new where candidate_id = v_old;
  update chat_messages       set candidate_id = p_new where candidate_id = v_old;
  update nudges              set candidate_id = p_new where candidate_id = v_old;
  update cal_bookings        set candidate_id = p_new::text where candidate_id = v_old::text;

  -- 5. פרטי ההרשמה עוברים לשורה המאומתת
  select * into v_old_row from candidates where id = v_old;
  update candidates set
    first_name = v_old_row.first_name, last_name = v_old_row.last_name,
    gender = v_old_row.gender, age = v_old_row.age, region = v_old_row.region,
    tech_interest_score = v_old_row.tech_interest_score, blockers = v_old_row.blockers,
    current_stage = v_old_row.current_stage, status = v_old_row.status,
    onboarding_completed_at = v_old_row.onboarding_completed_at,
    last_active_at = greatest(v_old_row.last_active_at, now()),
    created_at = least(v_old_row.created_at, coalesce(v_new.created_at, now())),
    chosen_domain = v_old_row.chosen_domain, domain_selected_at = v_old_row.domain_selected_at,
    coordinator_id = coalesce(v_new.coordinator_id, v_old_row.coordinator_id),
    cohort = v_old_row.cohort, is_test = v_old_row.is_test,
    phone = v_phone, phone_verified = true
  where id = p_new;

  delete from candidates where id = v_old;

  return jsonb_build_object('claimed', true, 'from', v_old);
end;
$$;

revoke all on function public.claim_candidate(uuid) from public, anon, authenticated;
grant execute on function public.claim_candidate(uuid) to service_role;
