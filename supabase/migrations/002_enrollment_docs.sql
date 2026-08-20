-- אחסון אישורי לימודים/הרשמה — האסמכתא שמשרד העבודה דורש (נתי 20.8.2026).
-- חריג מכוון להחלטת 13.8 ("הארון לא שומר קבצים"): מסמך אחד בלבד, כי הוא
-- תנאי לדיווח למממן. שאר המסמכים נשארים סטטוס-בלבד.
--
-- להרצה בדשבורד של Supabase → SQL Editor. אחרי ההרצה אין צורך בדיפלוי.

insert into storage.buckets (id, name, public)
values ('enrollment-docs', 'enrollment-docs', false)
on conflict (id) do nothing;

-- כל מועמד (גם אנונימי) כותב וקורא רק בתיקייה של עצמו: <auth.uid()>/...
create policy "enrollment own upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'enrollment-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "enrollment own read"
on storage.objects for select to authenticated
using (bucket_id = 'enrollment-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "enrollment own replace"
on storage.objects for update to authenticated
using (bucket_id = 'enrollment-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- הרכזת קוראת דרך /api עם SUPABASE_SECRET_KEY — עוקף RLS, אין צורך בפוליסי.
