-- תפקיד ותוצאת פגישה (נתי 4.10).
--
-- ── 1. תפקיד ─────────────────────────────────────────────────────────────────
-- עד היום לכל מי שנכנס לאזור הניהול היה אותו כוח: או זהות רכזת (רואה את
-- שלה), או קוד החירום המשותף (רואה הכל). מאיה מנהלת את הרכזות וצריכה לראות
-- את כולן — **בלי לחלוק קוד חירום**, שהוא בדיוק מה שמוחק את התיעוד של מי
-- עשה מה.
alter table coordinators add column if not exists role text not null default 'coordinator';
-- 'coordinator' = רואה את המועמדים שלה · 'manager' = רואה את כולם ויכול
-- לצפות בתצוגה של רכזת מסוימת

-- ── 2. תוצאת פגישה ───────────────────────────────────────────────────────────
-- Cal יודע מתי נקבעה פגישה, מתי בוטלה ומתי הוזזה — ה-webhook כבר קולט את
-- שלושתם. **מה ש-Cal לעולם לא יידע הוא אם היא באמת התקיימה**, וזו בדיוק
-- השכבה הראשונה והזולה ביותר בשער פגישה 2 (27.8): הרכזת כבר ביומן, וסימון
-- אחד שלה חוסך מהמועמד להיתקע מול מסך נעול.
alter table cal_bookings add column if not exists outcome text;
-- null = טרם סומן · 'happened' · 'no_show' · 'cancelled'
alter table cal_bookings add column if not exists outcome_at timestamptz;
alter table cal_bookings add column if not exists outcome_by text;
alter table cal_bookings add column if not exists outcome_note text;

create index if not exists cal_bookings_coordinator_idx on cal_bookings (coordinator_id, start_time desc);
