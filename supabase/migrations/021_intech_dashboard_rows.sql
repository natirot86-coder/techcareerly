-- 021 · לוח הניהול של In-Tech במאנדיי — איזו שורה שם שייכת לאיזה (רכז/ת × חודש)
--
-- החישוב רץ אצלנו (היסטוריה + Cal + אישורי לימודים) ונכתב ללוח ניהול
-- פרטי במאנדיי, שעליו יושב הדשבורד. ההתאמה לשורה שם **לפי מזהה ולא לפי
-- שם** — שם שורה אפשר לשנות ביד, מזהה לא.
-- `locked` — חודש שנגמר ונכתב פעם אחת לא נדרס: שינוי משקל במרץ לא מזיז את ינואר.
create table if not exists intech_dashboard_rows (
  key        text primary key,          -- "team:2026-10" / "sivan-mekonen:2026-10"
  item_id    bigint not null,
  locked     boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table intech_dashboard_rows enable row level security;
