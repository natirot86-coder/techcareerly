-- קוהורט — פיילוט האקדמיה לבוגרי טק-קריירה (נתי 28.8).
--
-- 'main'   = הקהל הרחב. שישה שלבים, שלוש פגישות, שלושה מסלולים.
-- 'alumni' = בוגרי הכשרה של טק-קריירה. חמישה שלבים (בלי טעימות),
--            שתי פגישות, תואר בלבד.
--
-- ⚠️ ברירת המחדל היא 'main', ולכן כל מי שכבר במערכת ממשיך בדיוק כמו קודם.
-- זו התכונה שהופכת את הפיילוט לבטוח: היעדר ערך = ההתנהגות הקיימת.
--
-- ⚠️ והשדה חי כאן ולא ב-localStorage בכוונה. הדליפה המסוכנת איננה הקישור
-- (הוא מועבר בוואטסאפ ותמיד ידלוף) אלא **אובדן הקוהורט באמצע המסע** —
-- ניקוי דפדפן או מכשיר חדש — שהיה קופץ אדם באמצע פיילוט חזרה לשישה שלבים.
alter table candidates add column if not exists cohort text not null default 'main';
create index if not exists candidates_cohort_idx on candidates (cohort);

-- רשימת הבוגרים מיובאת ממאנדיי. **הזהות קובעת את הקוהורט, לא הקישור**:
-- מי שנרשם מכל קישור שהוא ומספרו כאן — מקבל alumni אוטומטית.
-- הטלפון מנורמל (972XXXXXXXXX), כמו ב-candidates.phone.
create table if not exists alumni_roster (
  phone       text primary key,
  name        text not null default '',
  -- מה למד אצלנו ומתי סיים — קלט לתוכן, לא רק לשיוך
  course      text not null default '',
  finished_at date,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

-- הרשימה נקראת רק בצד שרת עם המפתח הסודי (הרשמה + לוח ניהול).
-- אין לה מדיניות ציבורית: רשימת טלפונים של בוגרים איננה נתון שנחשף לדפדפן.
alter table alumni_roster enable row level security;
