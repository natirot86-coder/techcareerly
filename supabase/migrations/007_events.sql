-- אירועים: ימים פתוחים, פאנלים, ירידי לימודים (נתי 27.8).
-- ישות אחת, שלושה חלונות (קהילה · שלב 5 לפי המוסד שנבחר · מגירת המסע).
-- התאריך מנהל: אירוע שעבר נעלם מהמועמד מעצמו — אין מה לתחזק ידנית.
create table if not exists events (
  id           text primary key,
  title        text not null,
  organizer    text default '',            -- מי מארגן: התוכנית / שם מוסד
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  city         text default '',            -- ריק = אונליין
  link         text default '',            -- הרשמה / פרטים
  note         text default '',
  -- שיוך אופציונלי למוסד. ריק = אירוע כללי שמוצג לכולם;
  -- מלא = מודגש אישית למי שבחר את המוסד הזה בשער.
  institution_id text default '',
  active       bool default true,
  created_at   timestamptz default now()
);

alter table events enable row level security;

-- כל מועמד קורא אירועים פעילים; כתיבה רק דרך צד השרת (service key)
drop policy if exists events_read on events;
create policy events_read on events for select using (active = true);
