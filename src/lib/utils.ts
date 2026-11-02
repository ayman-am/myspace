import type { ItemKind } from "../types";

/** تصاريح ملفات الصور المعروفة أولًا (بدون SVG لأنه يمكن أن يحمل أكوادًا) */
const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "avif", "heic", "heif", "bmp",
]);

/** امتدادات ممنوعة: يمكن أن تُنفَّذ داخل المتصفح عند فتح الرابط */
const BLOCKED_EXTS = new Set([
  "html", "htm", "xhtml", "shtml", "svg", "svgz",
  "js", "mjs", "cjs", "jsx", "php", "phtml",
]);

/** أنواع MIME ممنوعة لنفس السبب */
const BLOCKED_MIMES = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
  "application/x-javascript",
  "application/ecmascript",
  "text/ecmascript",
]);

/** هل الملف من نوع قابل لتنفيذ أكواد داخل المتصفح؟ (يُرفض قبل الرفع) */
export function isDangerousFile(name: string, mime?: string | null): boolean {
  if (BLOCKED_EXTS.has(extOf(name))) return true;
  const m = (mime || "").toLowerCase();
  return m ? BLOCKED_MIMES.has(m) : false;
}

/** اسم ملف آمن للعرض والتنزيل: بلا رموز تحكم أو محارف تكسر الترويسات */
export function safeFilename(name: string, fallback = "ملف"): string {
  const cleaned = (name || "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f"\\/:*?<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}

/** امتداد الملف بأحرف صغيرة */
export function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** تمييز الصور عن الملفات */
export function detectKind(name: string, mime?: string | null): ItemKind {
  if (mime?.startsWith("image/")) return "image";
  if (IMAGE_EXTS.has(extOf(name))) return "image";
  return "file";
}

/** حجم مقروء بالعربية */
export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["بايت", "كيلوبايت", "ميغابايت", "غيغابايت"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const num = i === 0 ? value : value < 10 ? value.toFixed(1) : Math.round(value);
  return `${num} ${units[i]}`;
}

/** تاريخ ووقت الإضافة بالعربية */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** مقتطف نصي مكوَّن من سطر واحد */
export function excerpt(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max).trimEnd() + "…" : flat;
}

/** قص العنوان ليبدو جيدًا في البطاقة */
export function tidyTitle(name: string, max = 64): string {
  const clean = name.trim();
  return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}
