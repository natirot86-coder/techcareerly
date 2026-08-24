-- קישורי Cal.com פר-רכזת + זיהוי רכזת בהזמנות (24.8.2026).
-- קישור לכל אחת משלוש הפגישות; המועמד המשויך מקבל את היומן של הרכזת שלו.
alter table coordinators add column if not exists cal_m1 text default '';
alter table coordinators add column if not exists cal_m2 text default '';
alter table coordinators add column if not exists cal_m3 text default '';
-- ההזמנה מה-webhook משויכת לרכזת לפי מייל ה-organizer
alter table cal_bookings add column if not exists coordinator_id text;
alter table cal_bookings add column if not exists organizer_email text default '';
