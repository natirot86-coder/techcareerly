-- מי מלווה משתתפים — נפרד מהתפקיד (נתי, 8.10).
--
-- עד עכשיו דף הסגל הניח ששני הדברים זהים: מי שאינו 'coordinator' הוצג
-- תחת "גישת ניהול", בלי שדות יומן ובלי להופיע בבורר השיוך. ההנחה נשברה
-- ברגע שמאיה — manager — גם מלווה משתתפים.
--
-- אלה שני צירים שונים: **מה את רואה** (role) מול **האם את מלווה** (כאן).
-- נתי וישראל מנהלים את המוצר ואינם לוקחים אף אחד; מאיה עושה את שניהם.
alter table coordinators
  add column if not exists takes_participants boolean not null default true;

update coordinators set takes_participants = false
 where lower(email) in ('natirot.86@gmail.com', 'israel@tech-career.org');
