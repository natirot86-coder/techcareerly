-- סימון רשומות בדיקה (נתי 4.10).
--
-- מסך הרכזת הראה שמונה "מועמדים" שכולם בדיקות: שתי רשומות של סיון, אחת
-- של ישראל, שתי הקלדות ג׳יבריש ושלוש ריקות. סינון לא יכול לפתור את זה —
-- אי אפשר להבדיל "שדגלח ראר" משם אמיתי — ולכן צריך סימון מפורש.
--
-- ⚠️ **מסמנים ולא מוחקים.** רשומת בדיקה היא עדיין ראיה: היא מוכיחה
-- שהזרימה עבדה, והאירועים שלה מזינים אנליטיקות. מחיקה הייתה מוחקת גם את זה.
alter table candidates add column if not exists is_test boolean not null default false;
create index if not exists candidates_is_test_idx on candidates (is_test) where is_test;

-- הרשומות שזוהו ב-4.10: ג׳יבריש מקלדת וריקות שהשלימו אונבורדינג
update candidates set is_test = true
where id in (
  'b88925b6-c9c9-45cd-a7e6-97c5c41f4e59',
  'e620a62f-c3e8-4e16-a085-f2604a7ccaac',
  'dd0884ce-0f43-4414-a1a6-ce077e3cb53a',
  'c8e89a75-58d8-4071-9860-58df8ec71aa3',
  '6c1e5f45-2d8d-45b8-9c46-ee1827753fee',
  'a727ffbf-163f-4d01-a794-61979dff171e',
  '4da3c8d0-27fd-4e4c-a735-a4d3d76c6614',
  '1f389ab5-ade7-4605-93da-44f716501970'
);

/*
  כלל אוטומטי לעתיד: **טלפון של רכזת לעולם אינו מועמד אמיתי.**
  סיון וישראל בודקים עם המכשירים שלהם, וזה יקרה שוב בכל בדיקה.
  מוטב לגזור את זה מהנתונים מאשר לזכור לסמן ידנית.
*/
update candidates c set is_test = true
from coordinators co
where coalesce(co.phone,'') <> ''
  and regexp_replace(co.phone, '\D', '', 'g') <> ''
  and c.phone = regexp_replace(
        case when co.phone like '0%' then '972' || substring(co.phone from 2) else co.phone end,
        '\D', '', 'g');
