-- קביעות מ-Cal.com דרך ה-webhook (23.8.2026). זיהוי מועמד ידני עד שיש
-- Phone Auth — הרכזת רואה שם+מייל+מועד ומצליבה בעצמה.
create table if not exists cal_bookings (
  id bigint generated always as identity primary key,
  trigger text not null default '',
  title text default '',
  start_time timestamptz,
  attendee_name text default '',
  attendee_email text default '',
  raw jsonb,
  created_at timestamptz not null default now()
);
alter table cal_bookings enable row level security;
-- אין פוליסי קריאה לציבור בכוונה: רק צד השרת (המפתח הסודי) קורא וכותב.
