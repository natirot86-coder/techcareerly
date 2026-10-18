-- 019 · עריכת פרטי משתתף/ת — האפליקציה בעלים, מאנדיי מראה (נתי, 16.10)
--
-- ההחלטה: מאנדיי הוא נקודת ההתחלה (שורה, רכז/ת, "נשלח קישור"). **מרגע
-- שהמשתתף/ת מאמת/ת טלפון באפליקציה — האפליקציה בעלת הפרטים**, ומאנדיי
-- מקבל עותק. לפני כן אין לאפליקציה כלום, והלוח הוא הבעלים.
--
-- הנימוק של נתי: כשהלוח בעלים, כל שינוי בו חייב לחזור דרך webhook — וכל
-- כיוון שנכנס מבחוץ הוא מקום שבו דברים מתפספסים בשקט (ראה 8.10, 11.10).
-- כתיבה מהאפליקציה החוצה — אנחנו יוזמים, יודעים כשנכשלה, ומנסים שוב.

-- העיר עד היום חיה רק באירוע profile. כדי שהאפליקציה תהיה הבעלים שלה
-- היא צריכה להיות עמודה, אחרת אין מה לשקף ללוח.
alter table candidates add column if not exists city text;

update candidates c set city = nullif(trim(e.props->>'city'), '')
from (
  select distinct on (candidate_id) candidate_id, props
  from funnel_events where name = 'profile'
  order by candidate_id, created_at desc
) e
where e.candidate_id = c.id and c.city is null;

-- מי שינה מה ומתי. עד היום מאנדיי תיעד את זה בשבילנו; מרגע שהבעלות
-- אצלנו — האחריות אצלנו. בעיקר בשביל הטלפון: הוא הזהות.
create table if not exists participant_edits (
  id           bigserial primary key,
  at           timestamptz not null default now(),
  editor       text not null,
  item_id      text,
  candidate_id uuid,
  field        text not null,
  old_value    text,
  new_value    text
);
create index if not exists participant_edits_item on participant_edits (item_id, at desc);
alter table participant_edits enable row level security;  -- שרת בלבד
