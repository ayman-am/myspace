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

if (!isConfigured) {
  console.warn(
    "[MySpace] لم يتم ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY بعد.",
  );
}
