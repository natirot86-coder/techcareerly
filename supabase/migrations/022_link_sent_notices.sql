-- 022 · תור ההודעות על "נשלח קישור" בלי רכז/ת (נתי, 31.10)
--
-- מי שמעדכן 15 שורות בבת אחת היה מקבל 15 מיילים — וכך מלמדים צוות להתעלם.
-- כל שורה נכנסת לתור, ומייל אחד יוצא למי שעדכן/ה, 45 שניות אחרי השינוי
-- האחרון שלו/ה. המפתח הוא השורה — הודעה אחת לכל משתתף/ת, לעולם.
-- `sent_at` נתפס באטומיות (update … where sent_at is null returning), כך
-- ששתי ריצות במקביל לא שולחות את אותה שורה פעמיים. מה שנתקע — הבדיקה היומית.
create table if not exists link_sent_notices (
  item_id     bigint primary key,
  user_email  text not null,
  user_name   text,
  item_name   text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index if not exists link_sent_notices_pending on link_sent_notices (user_email) where sent_at is null;
alter table link_sent_notices enable row level security;
