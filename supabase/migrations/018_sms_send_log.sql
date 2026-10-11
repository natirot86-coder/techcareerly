-- 018 · יומן שליחות SMS (נתי, 12.10)
--
-- SMS הופך לחובה, ולכן 019 הופך ל**נקודת כשל יחידה**: אם הוא נופל, אף אחד
-- לא נכנס — ואנחנו נשמע על זה מרכזת שמשתתף התקשר אליה. כל שליחה נרשמת
-- כאן, ושלושה כשלונות ברצף שולחים התראה לנתי ולישראל.
--
-- ⚠️ בלי טלפון ובלי קוד — רק אם הצליח ולמה לא. אין סיבה להחזיק כאן מידע אישי.
-- ⚠️ RLS בלי מדיניות: רק השרת (service_role) קורא וכותב.
create table if not exists sms_send_log (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  ok        boolean not null,
  error     text,
  alerted   boolean not null default false
);
create index if not exists sms_send_log_at on sms_send_log (at desc);
alter table sms_send_log enable row level security;
