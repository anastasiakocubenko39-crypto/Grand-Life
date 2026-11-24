-- «Гранд Лайф» — база даних Supabase.
-- Усі об'єкти мають префікс grandlife_, тож файл можна безпечно виконати в проєкті,
-- де вже є інші таблиці. Повторний запуск нічого не ламає.
-- Supabase → SQL Editor → New query → вставити весь файл → Run.

-- Хто адмін: тільки ці адреси з ПІДТВЕРДЖЕНОЮ поштою (той самий список, що adminEmails у config.js).
create or replace function public.grandlife_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and lower(u.email) in ('igor.grandlife@gmail.com', 'anastasiakocubenko39@gmail.com')
  );
$$;

-- Об'єкти нерухомості. Усі поля об'єкта лежать у data (jsonb), як раніше у Firebase.
create table if not exists public.grandlife_properties (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.grandlife_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists grandlife_properties_touch on public.grandlife_properties;
create trigger grandlife_properties_touch before update on public.grandlife_properties
  for each row execute function public.grandlife_touch();

alter table public.grandlife_properties enable row level security;
drop policy if exists "grandlife read" on public.grandlife_properties;
drop policy if exists "grandlife admin insert" on public.grandlife_properties;
drop policy if exists "grandlife admin update" on public.grandlife_properties;
drop policy if exists "grandlife admin delete" on public.grandlife_properties;
create policy "grandlife read" on public.grandlife_properties for select using (true);
create policy "grandlife admin insert" on public.grandlife_properties for insert to authenticated with check (public.grandlife_is_admin());
create policy "grandlife admin update" on public.grandlife_properties for update to authenticated using (public.grandlife_is_admin()) with check (public.grandlife_is_admin());
create policy "grandlife admin delete" on public.grandlife_properties for delete to authenticated using (public.grandlife_is_admin());
grant select on public.grandlife_properties to anon, authenticated;
grant insert, update, delete on public.grandlife_properties to authenticated;

-- Фото: публічний бакет, завантажувати й видаляти може лише адмін. До 10 МБ на файл.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grandlife-photos', 'grandlife-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "grandlife photos read" on storage.objects;
drop policy if exists "grandlife photos insert" on storage.objects;
drop policy if exists "grandlife photos update" on storage.objects;
drop policy if exists "grandlife photos delete" on storage.objects;
create policy "grandlife photos read" on storage.objects for select using (bucket_id = 'grandlife-photos');
create policy "grandlife photos insert" on storage.objects for insert to authenticated with check (bucket_id = 'grandlife-photos' and public.grandlife_is_admin());
create policy "grandlife photos update" on storage.objects for update to authenticated using (bucket_id = 'grandlife-photos' and public.grandlife_is_admin());
create policy "grandlife photos delete" on storage.objects for delete to authenticated using (bucket_id = 'grandlife-photos' and public.grandlife_is_admin());
