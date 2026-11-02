import { Inbox, RefreshCw } from "lucide-react";
import type { RealtimeState } from "../types";

/** بطاقات هيكلية أثناء تحميل المحتوى أول مرة */
export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-surface p-4 h-44 animate-pulse"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <div className="size-11 rounded-xl bg-neutral-200 dark:bg-neutral-800 mb-3" />
          <div className="h-3.5 rounded bg-neutral-200 dark:bg-neutral-800 w-3/4 mb-2" />
          <div className="h-3 rounded bg-neutral-200/70 dark:bg-neutral-800/70 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** خطأ تحميل قاعدة البيانات */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-8 text-center">
      <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">تعذر الاتصال بالخادم</p>
      <p className="text-xs text-red-700/80 dark:text-red-400/80 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
      >
        <RefreshCw className="size-4" />
        إعادة المحاولة
      </button>
    </div>
  );
}

/** المساحة فارغة */
export function EmptyState({ onFirstAdd }: { onFirstAdd: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-10 sm:p-14 text-center">
      <div className="mx-auto mb-4 size-14 grid place-items-center rounded-2xl bg-accent-soft text-accent">
        <Inbox className="size-7" />
      </div>
      <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
        لا توجد ملفات حتى الآن
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
        ارفع صورة أو ملفًا، أو اكتب نصًا — وسيظهر فورًا هنا وعلى جميع أجهزتك.
      </p>
      <button
        onClick={onFirstAdd}
        className="rounded-xl bg-accent hover:bg-accent-strong text-white px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        إضافة أول محتوى
      </button>
    </div>
  );
}

/** مؤشر حالة المزامنة الفورية */
export function RealtimeBadge({ state }: { state: RealtimeState }) {
  const cfg: Record<RealtimeState, { label: string; dot: string; text: string }> = {
    live: { label: "مزامنة فورية مفعّلة", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
    connecting: { label: "جارٍ ضبط المزامنة الفورية…", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
    offline: { label: "المزامنة تعيد الاتصال…", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  };
  const c = cfg[state];
  return (
    <span className={"inline-flex items-center gap-1.5 text-[11px] font-medium " + c.text}>
      <span className={"relative flex size-2 " + (state === "live" ? "" : "")}>
        <span className={`absolute inline-flex size-full rounded-full opacity-60 ${c.dot} ${state === "live" ? "animate-ping" : ""}`} />
        <span className={`relative inline-flex size-2 rounded-full ${c.dot}`} />
      </span>
      {c.label}
    </span>
  );
}
