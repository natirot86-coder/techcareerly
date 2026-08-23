-- סגל הרכזות עובר ל-DB (נתי 20.8): צוות התוכנית אינו טכני — עריכה בדף
-- ניהול התוכנית נשמרת מיד, בלי ייצוא JSON ובלי דיפלוי.
--
-- קריאה: כל מועמד מחובר (גם אנונימי) רואה רכזות פעילות — השם והטלפון
-- ממילא מוצגים לו באפליקציה. כתיבה: רק מצד השרת (SUPABASE_SECRET_KEY),
-- דרך דף מנהל התוכנית שמוגן בקוד הגישה.

create table if not exists coordinators (
  id text primary key,
  name text not null default '',
  location text default '',
  email text default '',
  phone text default '',           -- פורמט בינלאומי לוואטסאפ: 9725XXXXXXXX
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table coordinators enable row level security;

create policy "read active coordinators"
on coordinators for select to authenticated
using (active = true);

-- הרשומה הראשונה — נתי ממלא טלפון ואזור מדף הניהול
insert into coordinators (id, name, email, active)
values ('nati-rotstein', 'נתי רוטשטיין', 'nati@tech-career.org', true)
on conflict (id) do nothing;
