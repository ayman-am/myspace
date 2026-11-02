/** نوع العنصر المدعوم */
export type ItemKind = "image" | "file" | "text";

/** عنصر واحد داخل المسافة، مطابق لجدول myspace_items */
export interface SpaceItem {
  id: string;
  user_id: string;
  type: ItemKind;
  title: string;
  content: string | null;
  mime_type: string | null;
  size: number | null;
  storage_path: string | null;
  created_at: string;
}

/** مهمة رفع نشطة تُعرض في شريط التقدم */
export interface UploadJob {
  key: string;
  name: string;
  status: "uploading" | "done" | "failed";
  progress: number; // 0..100
}

/** حالة الاتصال الحي */
export type RealtimeState = "connecting" | "live" | "offline";
