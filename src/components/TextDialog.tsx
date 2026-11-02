import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

interface TextDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<boolean>;
}

export default function TextDialog({ open, onClose, onSave }: TextDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setBusy(false);
      setTimeout(() => contentRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function save() {
    if (busy || !content.trim()) return;
    setBusy(true);
    const ok = await onSave(title.trim(), content.trim());
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-overlay grid place-items-center px-4 py-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl animate-rise flex flex-col max-h-[85dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/70 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-50">نص جديد</h2>
          <button
            onClick={onClose}
            className="grid place-items-center size-8 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="العنوان (اختياري)"
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-neutral-400"
          />
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب نصك هنا…"
            rows={8}
            className="w-full resize-y rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-neutral-400 min-h-36"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-200/70 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={save}
            disabled={busy || !content.trim()}
            className="rounded-xl bg-accent hover:bg-accent-strong text-white px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            حفظ النص
          </button>
        </div>
      </div>
    </div>
  );
}
