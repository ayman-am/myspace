import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string | undefined;

/** هل تم ضبط مفاتيح Supabase؟ (مفاتيح anon قابلة للنشر وليست سرية) */
export const isConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes("."),
);

/** عميل Supabase — null فقط قبل ضبط ملف .env محليًا */
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/** اسم وعاء التخزين المركزي (يُنشأ في setup.sql) */
export const BUCKET = "myspace";
/** الحد الأقصى لحجم الملف الواحد بالبايت (50MB، مطابق لإعداد الوعاء) */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
/** أقصى عدد ملفات في دفعة واحدة */
export const MAX_BATCH = 20;
/** مدة صلاحية رابط التوقيع (10 دقائق) — أقصر = أقل تعرّضًا للتسريب */
export const SIGNED_URL_TTL_SECONDS = 600;
/** إعادة توقيع روابط الصور قبل انتهائها (8 دقائق) */
export const SIGNED_URL_REFRESH_MS = 8 * 60 * 1000;
/** قفل الجلسة تلقائيًا بعد هذه المدة من عدم النشاط */
export const IDLE_LOGOUT_MS = 30 * 60 * 1000;
/** أقصى طول للنصوص المحفوظة */
export const MAX_TEXT_CHARS = 50_000;
/** أقصى طول للعنوان */
export const MAX_TITLE_CHARS = 120;

if (!isConfigured) {
  console.warn(
    "[MySpace] لم يتم ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY بعد.",
  );
}
