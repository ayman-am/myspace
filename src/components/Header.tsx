import { LogOut, Moon, Plus, Sun, Type } from "lucide-react";

interface HeaderProps {
  onOpenPicker: () => void;
  onOpenText: () => void;
  onLogout: () => void;
  dark: boolean;
  onToggleDark: () => void;
  subtitle: string;
}

export default function Header({
  onOpenPicker,
  onOpenText,
  onLogout,
  dark,
  onToggleDark,
  subtitle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/70 dark:border-neutral-800/80 bg-page/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
        <div className="size-9 sm:size-10 shrink-0 grid place-items-center rounded-xl bg-accent text-white shadow-md shadow-accent/25 text-lg font-bold select-none">
          M
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 leading-tight truncate">
            MySpace
          </h1>
          <p className="hidden sm:block text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {subtitle}
          </p>
        </div>

        <button
          onClick={onOpenText}
          title="كتابة نص جديد"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Type className="size-4" />
          <span>نص جديد</span>
        </button>
        <button
          onClick={onOpenPicker}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-strong text-white px-3 sm:px-4 py-2 text-sm font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="size-4" />
          <span className="sm:hidden">إضافة</span>
          <span className="hidden sm:inline">إضافة محتوى</span>
        </button>

        <button
          onClick={onToggleDark}
          title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
          className="hidden sm:grid place-items-center size-9 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </button>
        <button
          onClick={onLogout}
          title="تسجيل الخروج"
          className="grid place-items-center size-8 sm:size-9 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
        >
          <LogOut className="size-4.5" />
        </button>
      </div>
    </header>
  );
}
