import { supabase } from "./supabase";

export interface Assurance {
  current: string | null;
  next: string | null;
}

/** مستوى تأكيد الجلسة: aal1 = كلمة مرور فقط، aal2 = كلمة مرور + رمز التحقق */
export async function getAssurance(): Promise<Assurance> {
  if (!supabase) return { current: null, next: null };
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return { current: null, next: null };
  return { current: data.currentLevel, next: data.nextLevel };
}

export interface TotpFactor {
  id: string;
  friendlyName: string;
}

/** العوامل المؤكَّدة فقط (جهاز مصادقة فعّال) */
export async function listVerifiedFactors(): Promise<TotpFactor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp ?? [])
    .filter((f) => f.status === "verified")
    .map((f) => ({ id: f.id, friendlyName: f.friendly_name ?? "تطبيق المصادقة" }));
}

/** بدء تسجيل عامل TOTP: يعيد صورة QR والسر اليدوي */
export async function enrollTotp(): Promise<{ id: string; qr: string; secret: string }> {
  if (!supabase) throw new Error("غير مهيأ");
  // تنظيف أي محاولات سابقة غير مكتملة حتى لا تتكدس العوامل
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const factor of existing?.all ?? []) {
    if (factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "MySpace",
  });
  if (error || !data) throw error ?? new Error("تعذر بدء التسجيل");
  return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

/** التحقق من رمز مكوّن من 6 أرقام لعامل محدد */
export async function verifyTotp(factorId: string, code: string): Promise<void> {
  if (!supabase) throw new Error("غير مهيأ");
  const clean = code.replace(/\D/g, "").slice(0, 6);
  const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
  if (chErr || !challenge) throw chErr ?? new Error("تعذر بدء التحقق");
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: clean,
  });
  if (error) throw error;
}

/** إزالة كل عوامل التحقق (يتطلب جلسة aal2) */
export async function removeAllFactors(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  for (const factor of data?.all ?? []) {
    const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (unErr) throw unErr;
  }
}

/** رسالة عربية موجزة لأخطاء التحقق */
export function mfaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const m = msg.toLowerCase();
  if (m.includes("invalid") || m.includes("code")) return "الرمز غير صحيح أو انتهت صلاحيته. جرّب الرمز الحالي.";
  if (m.includes("aal2")) return "يجب تأكيد الرمز أولًا.";
  if (m.includes("fetch") || m.includes("network")) return "تعذر الاتصال، تحقق من الإنترنت.";
  if (m.includes("too many") || m.includes("rate")) return "محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.";
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
