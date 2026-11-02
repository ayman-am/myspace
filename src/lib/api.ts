import type { SpaceItem } from "../types";
import {
  BUCKET,
  MAX_BATCH,
  MAX_FILE_BYTES,
  SIGNED_URL_TTL_SECONDS,
  supabase,
} from "./supabase";
import { detectKind, extOf, isDangerousFile, safeFilename } from "./utils";

/** رسالة عربية مختصرة لخطأ شائع — بدون كشف تفاصيل داخلية */
export function friendlyError(err: unknown, prefix: string): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const m = msg.toLowerCase();
  if (m.includes("signature") || m.includes("jwt")) return prefix + ": انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجددًا.";
  if (m.includes("payload too large") || m.includes("size")) return prefix + ": الملف أكبر من الحد المسموح (50 ميغابايت).";
  if (m.includes("invalid key")) return prefix + ": اسم الملف يحتوي رموزًا غير مدعومة في التخزين.";
  if (m.includes("mime")) return prefix + ": نوع هذا الملف غير مسموح لأسباب أمنية.";
  if (m.includes("network") || m.includes("fetch")) return prefix + ": تحقق من اتصالك بالإنترنت.";
  if (m.includes("row-level security")) return prefix + ": لا تملك صلاحية القيام بهذا الإجراء.";
  return prefix + ": حدث خطأ غير متوقع، حاول مرة أخرى.";
}

/** مفتاح تخزين آمن (ASCII) — يعتمد على UUID والامتداد فقط، والاسم الأصلي يبقى في قاعدة البيانات */
export function storageKey(userId: string, id: string, fileName: string): string {
  const rawExt = extOf(fileName).replace(/[^a-z0-9]/g, "");
  const ext = rawExt ? `.${rawExt.slice(0, 12)}` : "";
  return `${userId}/${id}/${id}${ext}`;
}

/** رفع ملف واحد إلى التخزين المركزي ثم إضافة سجله إلى قاعدة البيانات */
export async function uploadOne(
  userId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<SpaceItem> {
  const id = crypto.randomUUID();
  const path = storageKey(userId, id, file.name);

  const bucket = supabase!.storage.from(BUCKET);
  // uploadFile يدعم تتبع التقدم إن توفر؛ وإلا نستخدم upload العادي
  const anyBucket = bucket as unknown as Record<string, unknown>;
  if (typeof anyBucket.uploadFile === "function") {
    await anyBucket.uploadFile.call(anyBucket, path, file, {
      onProgress: (p: { percentage?: number }) =>
        onProgress(Math.min(100, Math.round(p.percentage ?? 0))),
    });
  } else {
    onProgress(60);
    const { error } = await bucket.upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
    });
    if (error) throw error;
    onProgress(100);
  }

  const row = {
    id,
    user_id: userId,
    type: detectKind(file.name, file.type),
    title: safeFilename(file.name, "ملف"),
    content: null,
    mime_type: file.type || null,
    size: file.size,
    storage_path: path,
  };

  const { data, error } = await supabase!
    .from("myspace_items")
    .insert(row)
    .select()
    .single();
  if (error) {
    // نحذف الملف المرفوع حتى لا يبقى يتيمًا
    await supabase!.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data as SpaceItem;
}

/** التحقق الأولي من صحة الدفعة قبل الرفع (يرمي خطأ عربي واضح) */
export function validateBatch(files: File[]): void {
  if (files.length === 0) throw new Error("لم يتم اختيار أي ملف.");
  if (files.length > MAX_BATCH)
    throw new Error(`يمكنك رفع ${MAX_BATCH} ملفًا كحد أقصى في كل مرة.`);
  const dangerous = files.find((f) => isDangerousFile(f.name, f.type));
  if (dangerous)
    throw new Error(
      `الملف «${dangerous.name}» من نوع يُنفّذ أكوادًا داخل المتصفح، ولذلك مرفوض لأمانك.`,
    );
  const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
  if (tooBig) throw new Error(`الملف «${tooBig.name}» أكبر من 50 ميغابايت.`);
}

/** رابط توقيع مؤقت (Signed URL) لعرض ملف أو تنزيله */
export async function getSignedUrl(
  path: string,
  opts?: { download?: boolean | string },
): Promise<string | null> {
  const download =
    typeof opts?.download === "string"
      ? safeFilename(opts.download, "ملف")
      : (opts?.download ?? false);

  const { data, error } = await supabase!.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, { download });
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** حذف عنصر: سجل قاعدة البيانات + الملف الفعلي من التخزين */
export async function deleteItem(item: SpaceItem): Promise<void> {
  if (item.storage_path) {
    const { error: stErr } = await supabase!.storage
      .from(BUCKET)
      .remove([item.storage_path]);
    if (stErr && !stErr.message.toLowerCase().includes("not found")) throw stErr;
  }
  const { error } = await supabase!
    .from("myspace_items")
    .delete()
    .eq("id", item.id);
  if (error) throw error;
}

/** تنزيل الملف في المتصفح عبر رابط موقّع */
export async function downloadItem(item: SpaceItem): Promise<void> {
  if (!item.storage_path) return;
  const name = safeFilename(item.title, "ملف");
  const url = await getSignedUrl(item.storage_path, { download: name });
  if (!url) throw new Error("تعذر إنشاء رابط التنزيل.");
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
