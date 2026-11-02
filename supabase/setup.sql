-- =====================================================
-- MySpace — إعداد قاعدة بيانات Supabase (يُنفَّذ مرة واحدة)
-- انسخ كل هذا الملف والصقه في:
-- Supabase Dashboard > SQL Editor > New query > Run
-- السكربت قابل لإعادة التنفيذ بأمان (idempotent).
-- =====================================================

-- =====================================================
-- 1) جدول العناصر (الصور / الملفات / النصوص)
-- =====================================================
create table if not exists public.myspace_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('image', 'file', 'text')),
  title text not null,
  content text,
  mime_type text,
  size bigint,
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists myspace_items_user_created_idx
  on public.myspace_items (user_id, created_at desc);

alter table public.myspace_items enable row level security;

drop policy if exists "myspace: owner can select" on public.myspace_items;
create policy "myspace: owner can select"
  on public.myspace_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "myspace: owner can insert" on public.myspace_items;
create policy "myspace: owner can insert"
  on public.myspace_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "myspace: owner can delete" on public.myspace_items;
create policy "myspace: owner can delete"
  on public.myspace_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- 2) وعاء التخزين الخاص (Private bucket) للملفات الفعلية
-- =====================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('myspace', 'myspace', false, 52428800) -- الحد الأقصى 50MB لكل ملف
on conflict (id) do update
  set public = false,
      file_size_limit = 52428800;

-- سياسات التخزين: مسار كل ملف يبدأ بمعرف صاحب الحساب
drop policy if exists "myspace: owner can upload" on storage.objects;
create policy "myspace: owner can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'myspace'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "myspace: owner can read" on storage.objects;
create policy "myspace: owner can read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'myspace'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "myspace: owner can delete" on storage.objects;
create policy "myspace: owner can delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'myspace'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- =====================================================
-- 3) تفعيل المزامنة الفورية (Realtime) على جدول العناصر
-- =====================================================
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'myspace_items'
  ) then
    alter publication supabase_realtime add table public.myspace_items;
  end if;
end $$;

-- =====================================================
-- 4) الخصوصية: مساحة فردية — يُسمح بأول حساب فقط
--    (بعد إنشاء أول حساب، لن يستطيع أي شخص آخر إنشاء حساب
--     في هذا المشروع حتى لو عرف رابط الموقع)
-- =====================================================
create or replace function public.enforce_single_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from auth.users) > 1 then
    raise exception 'هذه المساحة خاصة بصاحبها، ولا يمكن إنشاء حسابات جديدة.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.enforce_single_user();
