import { Loader2 } from "lucide-react";
import { BrandMark } from "./AuthScreen";

/** شاشة تظهر قبل ضبط مفتاح .env محليًا (لا تظهر أبدًا على Vercel بعد ضبط المتغيرات) */
export function SetupScreen() {
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-lg bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-6 animate-rise">
        <div className="flex items-center gap-3 mb-4">
          <BrandMark />
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">MySpace</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">لم يتم ضبط مفاتيح Supabase بعد</p>
          </div>
        </div>
        <ol className="text-sm text-neutral-600 dark:text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
          <li>أنشئ مشروعًا في supabase.com وشغّل سكربت <code dir="ltr" className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">supabase/setup.sql</code></li>
          <li>انسخ ملف <code dir="ltr" className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">.env.example</code> إلى <code dir="ltr" className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">.env</code></li>
          <li>ضع رابط المشروع ومفتاح anon فيه (من Settings → API) وأعد تشغيل الخادم.</li>
        </ol>
        <pre dir="ltr" className="mt-4 text-xs font-mono bg-neutral-100 dark:bg-neutral-800/70 rounded-xl p-3 overflow-x-auto">{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}</pre>
      </div>
    </main>
  );
}

/** شاشة تحميل أولية أثناء استرجاع الجلسة */
export function Splash() {
  return (
    <main className="min-h-dvh grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <BrandMark />
        <Loader2 className="size-5 text-neutral-400 animate-spin" />
      </div>
    </main>
  );
}

