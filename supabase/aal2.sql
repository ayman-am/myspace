-- =====================================================
-- MySpace — فرض التحقق بخطوتين على مستوى قاعدة البيانات (خطوة اختيارية أخيرة)
--
-- نفّذ هذا الملف *بعد* تفعيل التحقق بخطوتين من داخل الموقع
-- (أيقونة الدرع ← تفعيل التحقق بخطوتين) والتأكد من أن الدخول يعمل.
--
-- ما يفعله: يمنع قاعدة البيانات والتخزين من قبول أي جلسة مرّت بكلمة المرور
-- فقط، حتى لو وصل أحدهم إلى التوكن. من دون هذا الملف تبقى الحماية في الواجهة.
--
-- آمن قبل التفعيل أيضًا: إذا لم يكن للحساب عامل تحقق مؤكَّد، تمر الطلبات عاديًا.
-- للتراجع: أعد تنفيذ ملف setup.sql كاملًا — يعيد السياسات كما كانت.
-- =====================================================

-- -----------------------------------------------------
-- 1) هل لدى المستخدم الحالي عامل تحقق مؤكَّد؟
-- -----------------------------------------------------
create or replace function public.myspace_has_verified_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.mfa_factors f
    where f.user_id = auth.uid()
      and f.status = 'verified'
  );
$$;

-- -----------------------------------------------------
-- 2) هل الجلسة الحالية مقبولة؟ (aal2 إن كان هناك عامل، وإلا نعم)
-- -----------------------------------------------------
create or replace function public.myspace_aal2_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not public.myspace_has_verified_mfa()
      or coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

revoke all on function public.myspace_has_verified_mfa() from public;
revoke all on function public.myspace_aal2_ok() from public;
grant execute on function public.myspace_aal2_ok() to authenticated;

-- -----------------------------------------------------
-- 3) سياسات الجدول مع شرط aal2
-- -----------------------------------------------------
drop policy if exists "myspace: owner can select" on public.myspace_items;
create policy "myspace: owner can select"
  on public.myspace_items for select
  to authenticated
  using (auth.uid() = user_id and public.myspace_aal2_ok());

drop policy if exists "myspace: owner can insert" on public.myspace_items;
create policy "myspace: owner can insert"
  on public.myspace_items for insert
  to authenticated
  with check (auth.uid() = user_id and public.myspace_aal2_ok());

drop policy if exists "myspace: owner can delete" on public.myspace_items;
create policy "myspace: owner can delete"
  on public.myspace_items for delete
  to authenticated
  using (auth.uid() = user_id and public.myspace_aal2_ok());

-- -----------------------------------------------------
-- 4) سياسات التخزين مع شرط aal2
-- -----------------------------------------------------
drop policy if exists "myspace: owner can upload" on storage.objects;
create policy "myspace: owner can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'myspace'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.myspace_aal2_ok()
  );

drop policy if exists "myspace: owner can read" on storage.objects;
create policy "myspace: owner can read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'myspace'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.myspace_aal2_ok()
  );

drop policy if exists "myspace: owner can delete" on storage.objects;
create policy "myspace: owner can delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'myspace'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.myspace_aal2_ok()
  );

-- -----------------------------------------------------
-- 5) تحقق سريع (يجب أن تظهر كل القيم true)
-- -----------------------------------------------------
select
  (select count(*) = 6 from pg_policies
     where (schemaname = 'public' and tablename = 'myspace_items')
        or (schemaname = 'storage' and tablename = 'objects')) as six_policies,
  (select count(*) = 3 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and coalesce(qual, '') || coalesce(with_check, '') like '%myspace_aal2_ok%') as storage_gated,
  (select count(*) = 3 from pg_policies
     where schemaname = 'public' and tablename = 'myspace_items'
       and coalesce(qual, '') || coalesce(with_check, '') like '%myspace_aal2_ok%') as table_gated,
  (select not exists (select 1 from pg_policies
     where schemaname = 'public' and tablename = 'myspace_items' and cmd = 'UPDATE')) as no_update_policy;
