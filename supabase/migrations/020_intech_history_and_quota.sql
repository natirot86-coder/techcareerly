-- 020 · היסטוריית הלוח ומשקל מכסה (נתי, 29.10)
--
-- הלוח של אינטק זוכר רק את הסטטוס *הנוכחי*. כדי לספור "כמה שיחות היו
-- בנובמבר" או "כמה זמן חיכו" צריך לדעת *מתי* כל דבר קרה — וספירה לפי
-- הסטטוס של היום היא ספירה שמשקרת: מי שהתחיל בנובמבר ועבר בדצמבר ל"לא
-- מעוניין" היה נעלם מנובמבר רטרואקטיבית.
--
-- המקור: יומן הפעילות של מאנדיי, שנקלט לכאן כל בוקר (reconcile-main).
-- ⚠️ מאנדיי שומר את היומן 90 יום בלבד — מה שלא נקלט עד אז אובד. לכן
-- הטבלה הזו היא ההיסטוריה, ומאנדיי רק המקור הזמני שלה.
-- המפתח הוא מזהה האירוע של מאנדיי עצמו — קליטה חוזרת של אותו חלון לא מכפילה.
create table if not exists intech_status_log (
  id          text primary key,           -- activity_logs.id
  item_id     bigint not null,
  column_id   text not null,              -- סטטוס משתתף / רכז/ת אחראי
  from_value  text,
  to_value    text,
  changed_at  timestamptz not null,
  user_id     bigint
);
create index if not exists intech_status_log_item on intech_status_log (item_id, column_id, changed_at);

-- צד שרת בלבד (מפתח סודי). בלי מדיניות = אין גישה מהדפדפן.
alter table intech_status_log enable row level security;

-- משקל במכסה הצוותית: 1 = משרה מלאה, 0 = לא נושא/ת מכסה.
-- המכסה היא של הצוות; כל רכז/ת מקבל/ת ממנה חלק לפי המשקל, כך שרכז/ת
-- שמצטרף/ת או עוזב/ת לא שובר/ת חישוב שנבנה על צוות קבוע.
alter table coordinators add column if not exists quota_weight numeric not null default 1;

-- מאיה מנהלת וכמעט לא מלווה (נתי, 29.10). לפי מזהה ולא לפי שם.
update coordinators set quota_weight = 0 where id = 'maya-rokani';
