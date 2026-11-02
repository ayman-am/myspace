import { useRef, useState } from "react";
import { FileUp, Loader2, Type } from "lucide-react";

interface UploadZoneProps {
  onPick: (files: FileList) => void;
  onOpenText: () => void;
}

export default function UploadZone({ onPick, onOpenText }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  return (
    <section>
      <div
        role="button"
        tabIndex={0}
        aria-label="منطقة رفع الملفات"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current--;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (e.dataTransfer.files.length > 0) onPick(e.dataTransfer.files);
        }}
        className={
          "rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
          (dragging
            ? "border-accent bg-accent-soft"
            : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-surface hover:border-accent/60 hover:bg-accent-soft/40")
        }
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) onPick(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mx-auto mb-3 size-12 grid place-items-center rounded-2xl bg-accent-soft text-accent">
          {dragging ? <Loader2 className="size-6" /> : <FileUp className="size-6" />}
        </div>
        <p className="text-sm sm:text-base font-semibold text-neutral-800 dark:text-neutral-100">
          {dragging ? "أفلت الملفات هنا" : "اسحب ملفاتك هنا أو اضغط للاختيار"}
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          صور، PDF، مستندات، أرشيف… حتى 50 ميغابايت لكل ملف، وتصل حتى 20 ملفًا دفعة واحدة
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenText();
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 px-3.5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Type className="size-4" />
          كتابة نص جديد
        </button>
      </div>
    </section>
  );
}
