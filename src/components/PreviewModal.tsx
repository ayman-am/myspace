import { useEffect, useState } from "react";
import { Check, Copy, Download, Loader2, X } from "lucide-react";
import type { SpaceItem } from "../types";
import { formatBytes, formatDateTime } from "../lib/utils";

interface PreviewModalProps {
  item: SpaceItem | null;
  url?: string;
  onClose: () => void;
  onDownload: (item: SpaceItem) => void;
}

export default function PreviewModal({ item, url, onClose, onDownload }: PreviewModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item) return;
    setCopied(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  async function copyText() {
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.content ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // المتصفح رفض القص — النص يبقى قابلًا للتحديد يدويًا
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-overlay grid place-items-center px-3 py-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl animate-rise overflow-hidden flex flex-col max-h-[88dvh]">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-neutral-200/70 dark:border-neutral-800">
          <div className="min-w-0 flex-1">
            <h2 dir="auto" className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
              {item.title}
            </h2>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {item.type === "text" ? "نص" : [formatBytes(item.size), formatDateTime(item.created_at)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center size-8 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {item.type === "image" ? (
            <div className="bg-neutral-100 dark:bg-neutral-900/60 grid place-items-center min-h-40">
              {url ? (
                <img src={url} alt={item.title} className="max-h-[60dvh] w-auto object-contain" />
              ) : (
                <Loader2 className="size-6 text-neutral-400 animate-spin" />
              )}
            </div>
          ) : (
            <div dir="auto" className="p-5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-200 select-text">
              {item.content}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3.5 border-t border-neutral-200/70 dark:border-neutral-800">
          {item.type === "text" && (
            <button
              onClick={copyText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 px-3.5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
          )}
          <button
            onClick={() => onDownload(item)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-strong text-white px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Download className="size-4" />
            تنزيل
          </button>
        </div>
      </div>
    </div>
  );
}
