-- =====================================================
-- MySpace — تقوية الأمان (يُنفَّذ مرة واحدة بعد setup.sql)
-- الصق الملف كاملًا في: Supabase Dashboard > SQL Editor > New query > Run
-- قابل لإعادة التنفيذ بأمان.
-- =====================================================

-- -----------------------------------------------------
-- 1) سحب أي صلاحية عن الزوار غير المسجلين نهائيًا
--    (RLS كافٍ، لكن هذا حزام أمان إضافي)
-- -----------------------------------------------------
revoke all on table public.myspace_items from anon;
grant select, insert, delete on table public.myspace_items to authenticated;

-- -----------------------------------------------------
-- 2) قيود تمنع البيانات الشاذة أو الضخمة
-- -----------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'myspace_title_len') then
    alter table public.myspace_items
      add constraint myspace_title_len check (char_length(title) between 1 and 200);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'myspace_content_len') then
    alter table public.myspace_items
      add constraint myspace_content_len
      check (content is null or char_length(content) <= 100000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'myspace_size_cap') then
    alter table public.myspace_items
      add constraint myspace_size_cap
      check (size is null or (size >= 0 and size <= 52428800));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'myspace_kind_consistency') then
    alter table public.myspace_items
      add constraint myspace_kind_consistency check (
        (type = 'text' and storage_path is null)
        or (type in ('image', 'file') and storage_path is not null)
      );
  end if;

  -- مسار التخزين يجب أن يبدأ بمعرّف صاحب الصف نفسه
  if not exists (select 1 from pg_constraint where conname = 'myspace_path_belongs_to_owner') then
    alter table public.myspace_items
      add constraint myspace_path_belongs_to_owner check (
        storage_path is null
        or storage_path like (user_id::text || '/%')
      );
  end if;
end $$;

-- -----------------------------------------------------
-- 3) لا تعديل على الصفوف إطلاقًا (لا سياسة UPDATE = لا تحديث)
-- -----------------------------------------------------
drop policy if exists "myspace: owner can update" on public.myspace_items;

-- -----------------------------------------------------
-- 4) منع استدعاء دالة القفل من الخارج
-- -----------------------------------------------------
revoke execute on function public.enforce_single_user() from public;
revoke execute on function public.enforce_single_user() from anon;
revoke execute on function public.enforce_single_user() from authenticated;

-- -----------------------------------------------------
-- 5) منع أنواع الملفات القابلة لتنفيذ أكواد (html / svg / js)
--    على مستوى وعاء التخزين نفسه، وليس الواجهة فقط
-- -----------------------------------------------------
update storage.buckets
set allowed_mime_types = array[
  -- صور (بدون SVG)
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
  'image/heic', 'image/heif', 'image/bmp',
  -- مستندات
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/json',
  -- أرشيفات
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  -- صوت وفيديو
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm',
  'audio/aac', 'audio/x-m4a',
  'video/mp4', 'video/webm', 'video/quicktime',
  -- أي نوع آخر يُخزَّن كبيانات خام ولا يُفتح داخل المتصفح
  'application/octet-stream'
]
where id = 'myspace';

-- -----------------------------------------------------
-- 6) تحقق سريع (يجب أن تكون كل القيم true)
-- -----------------------------------------------------
-- select relrowsecurity from pg_class where oid = 'public.myspace_items'::regclass;
-- select count(*) = 0 from pg_policies
--   where schemaname = 'public' and tablename = 'myspace_items' and cmd = 'UPDATE';
-- select public from storage.buckets where id = 'myspace';   -- يجب false
-- select allowed_mime_types from storage.buckets where id = 'myspace';
