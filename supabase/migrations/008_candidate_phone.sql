-- זיהוי מועמד <-> הזמנת Cal (נתי 27.8).
-- הטלפון הוא המפתח המשותף היחיד בין האפליקציה ל-Cal: המועמד מתחבר איתו
-- (Phone Auth של ישראל), וגם מקליד אותו בטופס ההזמנה. נשמר מנורמל
-- (972XXXXXXXXX) כדי ש-050 ו-+972-50 ייפגשו.
alter table candidates add column if not exists phone text default '';
create index if not exists candidates_phone_idx on candidates (phone);

-- ההזמנה נושאת את הטלפון שהוקלד בטופס, ואת המועמד שהותאם לו (אם הותאם)
alter table cal_bookings add column if not exists attendee_phone text default '';
alter table cal_bookings add column if not exists candidate_id text;
