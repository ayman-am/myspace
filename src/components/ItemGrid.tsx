import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  File,
  FileArchive,
  FileCode2,
  FileSpreadsheet,
  FileText,
  ImageOff,
  Loader2,
  Presentation,
  Trash2,
} from "lucide-react";
import type { SpaceItem } from "../types";
import { excerpt, formatBytes, formatDateTime, extOf } from "../lib/utils";

interface ItemGridProps {
  items: SpaceItem[];
  urls: Record<string, string>;
  onOpenImage: (item: SpaceItem) => void;
  onOpenText: (item: SpaceItem) => void;
  onDownload: (item: SpaceItem) => void;
  onDelete: (item: SpaceItem) => void;
  busyId: string | null;
}

const extColors: Record<string, string> = {
  pdf: "text-red-500 bg-red-50 dark:bg-red-950/40",
  doc: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  docx: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  xls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  xlsx: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  csv: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  ppt: "text-orange-500 bg-orange-50 dark:bg-orange-950/40",
  pptx: "text-orange-500 bg-orange-50 dark:bg-orange-950/40",
  zip: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  rar: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  "7z": "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
};

function iconFor(item: SpaceItem) {
  const ext = extOf(item.title || "");
  if (ext === "pdf") return { Icon: FileText, cls: extColors.pdf };
  if (["doc", "docx", "txt", "rtf"].includes(ext)) return { Icon: FileText, cls: extColors.docx };
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: FileSpreadsheet, cls: extColors.xlsx };
  if (["ppt", "pptx"].includes(ext)) return { Icon: Presentation, cls: extColors.pptx };
  if (["zip", "rar", "7z", "gz"].includes(ext)) return { Icon: FileArchive, cls: extColors.zip };
  if (["js", "ts", "json", "html", "css", "py", "xml"].includes(ext)) return { Icon: FileCode2, cls: "text-sky-600 bg-sky-50 dark:bg-sky-950/40" };
  return { Icon: File, cls: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800" };
}

export default function ItemGrid({
  items, urls, onOpenImage, onOpenText, onDownload, onDelete, busyId,
}: ItemGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          url={urls[item.id]}
          onOpenImage={onOpenImage}
          onOpenText={onOpenText}
          onDownload={onDownload}
          onDelete={onDelete}
          busy={busyId === item.id}
        />
      ))}
    </div>
  );
}

interface CardProps {
  item: SpaceItem;
  url?: string;
  busy?: boolean;
  onOpenImage: (i: SpaceItem) => void;
  onOpenText: (i: SpaceItem) => void;
  onDownload: (i: SpaceItem) => void;
  onDelete: (i: SpaceItem) => void;
}

function Thumb({ url, title }: { url?: string; title: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (url) {
      setFailed(false);
      return;
    }
    const timer = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(timer);
  }, [url]);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={title}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    );
  }

  if (failed) {
    return (
      <div className="size-full grid place-items-center text-neutral-400 dark:text-neutral-500">
        <div className="flex flex-col items-center gap-1.5">
          <ImageOff className="size-5" />
          <span className="text-[10px]">تعذر تحميل المعاينة</span>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full grid place-items-center text-neutral-400 dark:text-neutral-600">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}

function ItemCard({ item, url, busy, onOpenImage, onOpenText, onDownload, onDelete }: CardProps) {
  const meta =
    (item.type === "text" ? null : formatBytes(item.size)) ??
    null;
  const actions = (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onDownload(item); }}
        title="تنزيل"
        className="grid place-items-center size-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Download className="size-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
        title="حذف"
        disabled={busy}
        className="grid place-items-center size-8 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </div>
  );

  if (item.type === "image") {
    return (
      <article
        onClick={() => onOpenImage(item)}
        className="bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-accent/40 transition-all cursor-pointer overflow-hidden animate-rise group"
      >
        <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800/60 relative">
          <Thumb url={url} title={item.title} />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 grid place-items-center">
            <span className="size-10 rounded-full bg-white/90 dark:bg-neutral-900/90 grid place-items-center text-neutral-800 dark:text-neutral-100">
              <Eye className="size-5" />
            </span>
          </div>
        </div>
        <div className="p-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3 dir="auto" className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{item.title}</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {meta && `${meta} · الساعة `}{formatDateTime(item.created_at)}
            </p>
          </div>
          {actions}
        </div>
      </article>
    );
  }

  if (item.type === "text") {
    return (
      <article
        onClick={() => onOpenText(item)}
        className="bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-accent/40 transition-all cursor-pointer p-4 flex flex-col gap-2 animate-rise"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{item.title}</h3>
          <span className="shrink-0 mt-0.5 size-1.5 rounded-full bg-accent/70" aria-hidden />
        </div>
        <p dir="auto" className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-4 flex-1 whitespace-pre-wrap">
          {excerpt(item.content, 200)}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{formatDateTime(item.created_at)}</span>
          {actions}
        </div>
      </article>
    );
  }

  // ملف
  const { Icon, cls } = iconFor(item);
  const isPdf = extOf(item.title || "") === "pdf";
  return (
    <article
      onClick={() => (isPdf ?? false) && onDownload(item)}
      className="bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-accent/40 transition-all p-4 flex flex-col gap-3 animate-rise"
    >
      <div className="flex items-center gap-3">
        <span className={"size-11 shrink-0 grid place-items-center rounded-xl " + cls}>
          <Icon className="size-5.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 dir="auto" className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{item.title}</h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {[formatBytes(item.size), formatDateTime(item.created_at)].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onDownload(item)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Download className="size-3.5" />
          تنزيل
        </button>
        {actions}
      </div>
    </article>
  );
}
