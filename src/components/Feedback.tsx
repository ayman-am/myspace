import { Check, Loader2, TriangleAlert, WifiOff } from "lucide-react";
import type { UploadJob } from "../types";

/* ============ شريط مهام الرفع ============ */

export function UploadsBar({ jobs }: { jobs: UploadJob[] }) {
  if (jobs.length === 0) return null;
  const done = jobs.filter((j) => j.status !== "uploading").length;
  const pct = Math.round((done / jobs.length) * 100);
  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-80 z-40 bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-lg animate-toast p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          <Loader2 className="size-4 animate-spin text-accent" />
          {done < jobs.length ? "جارٍ رفع الملفات" : "انتهى الرفع"}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400" dir="ltr">
          {done}/{jobs.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-2.5 max-h-32 overflow-y-auto space-y-1.5">
        {jobs.map((j) => (
          <li key={j.key} className="flex items-center gap-2 text-xs">
            {j.status === "uploading" ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-neutral-400" />
            ) : j.status === "done" ? (
              <Check className="size-3.5 shrink-0 text-emerald-600" />
            ) : (
              <TriangleAlert className="size-3.5 shrink-0 text-red-500" />
            )}
            <span dir="auto" className="truncate flex-1 text-neutral-700 dark:text-neutral-300">{j.name}</span>
            <span className="text-[10px] text-neutral-400 shrink-0" dir="ltr">
              {j.status === "uploading" ? `${j.progress}%` : j.status === "done" ? "تم" : "فشل"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============ الإشعارات ============ */

export interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
}

const toastStyle: Record<Toast["kind"], string> = {
  success: "border-emerald-200 dark:border-emerald-900/70 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-surface",
  error: "border-red-200 dark:border-red-900/70 text-red-800 dark:text-red-300 bg-white dark:bg-surface",
  info: "border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-surface",
};

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2 w-min max-w-[92vw] sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          dir="auto"
          className={"animate-toast border rounded-xl shadow-lg px-4 py-2.5 text-sm font-medium " + toastStyle[t.kind]}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ============ لافتة لا يوجد اتصال ============ */

export function OfflineBanner({ offline }: { offline: boolean }) {
  if (!offline) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60">
      <WifiOff className="size-4" />
      لا يوجد اتصال بالإنترنت — سيتم المزامنة عند عودة الاتصال
    </div>
  );
}
