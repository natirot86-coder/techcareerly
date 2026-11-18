-- 020 · תג חופשי למשתתף/ת + ת.ז. לאינטייק פרונטלי (נתי, 18.11)
--
-- tag: מילוי חופשי, ריק כברירת מחדל — לא מחליף קוהורט/רכז/ת/סטטוס, רק
-- מסמן מאיפה/איך האדם נכנס (למשל אינטייק פרונטלי באירוע מסוים). מי שכבר
-- קיים נשאר ריק אוטומטית — אין backfill, וזו בדיוק הסיבה שזה בטוח.
--
-- national_id: נאסף באינטייק פרונטלי לפני שיש לאדם משתמש אפליקציה בכלל.
-- ⚠️ לא נכנס ל-select של /api/coordinator בכוונה — נתון רגיש יותר משם/טלפון,
-- ואין לו היום שום צורך תצוגתי. נגיש רק מצד שרת עם SUPABASE_SECRET_KEY.
alter table candidates add column if not exists tag text;
alter table candidates add column if not exists national_id text;
