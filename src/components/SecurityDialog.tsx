import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, ShieldOff, X } from "lucide-react";
import {
  enrollTotp,
  listVerifiedFactors,
  mfaError,
  removeAllFactors,
  verifyTotp,
} from "../lib/mfa";

interface SecurityDialogProps {
  open: boolean;
  onClose: () => void;
  onNotify: (kind: "success" | "info" | "error", text: string) => void;
}

type EnrollState = { id: string; qr: string; secret: string } | null;

export default function SecurityDialog({ open, onClose, onNotify }: SecurityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<EnrollState>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const factors = await listVerifiedFactors();
      setEnabled(factors.length > 0);
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setEnroll(null);
    setCode("");
    setError(null);
    setCopied(false);
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function startEnroll() {
    setBusy(true);
    setError(null);
    try {
      const info = await enrollTotp();
      setEnroll(info);
      setCode("");
    } catch (err) {
      setError(mfaError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    if (!enroll || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyTotp(enroll.id, code);
      setEnroll(null);
      setEnabled(true);
      setCode("");
      onNotify("success", "تم تفعيل التحقق بخطوتين. ستحتاج رمز التطبيق عند كل دخول.");
    } catch (err) {
      setError(mfaError(err));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (busy) return;
    if (
      !window.confirm(
        "إيقاف التحقق بخطوتين؟ سيصبح الدخول بكلمة المرور فقط. نوصي بإبقائه مفعّلًا.",
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await removeAllFactors();
      setEnabled(false);
      setEnroll(null);
      onNotify("info", "تم إيقاف التحقق بخطوتين.");
    } catch (err) {
      setError(mfaError(err));
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!enroll) return;
    try {
      await navigator.clipboard.writeText(enroll.secret);
      setCopied(true);
      onNotify("success", "تم نسخ المفتاح. احفظه في مكان آمن.");
    } catch {
      onNotify("error", "تعذر النسخ، اكتبه يدويًا.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-overlay grid place-items-center px-4 py-6"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl animate-rise flex flex-col max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/70 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-50">الأمان</h2>
          <button
            onClick={onClose}
            disabled={busy}
            className="grid place-items-center size-8 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <span
              className={
                "size-10 shrink-0 grid place-items-center rounded-xl " +
                (enabled
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400")
              }
            >
              {enabled ? <ShieldCheck className="size-5" /> : <ShieldOff className="size-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                التحقق بخطوتين: {loading ? "..." : enabled ? "مفعّل" : "غير مفعّل"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-0.5">
                {enabled
                  ? "كل دخول يحتاج كلمة المرور + رمز من تطبيق المصادقة."
                  : "أضف طبقة ثانية: لو عرف أحد كلمة مرورك، لن يستطيع الدخول بدون رمز هاتفك."}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          {!enabled && !enroll && (
            <button
              onClick={startEnroll}
              disabled={busy || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-50 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              تفعيل التحقق بخطوتين
            </button>
          )}

          {enroll && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-700 dark:text-neutral-200">
                امسح الرمز بتطبيق مثل <span className="font-medium">Google Authenticator</span> أو{" "}
                <span className="font-medium">Authy</span> أو <span className="font-medium">1Password</span>.
              </p>
              <div className="grid place-items-center bg-white rounded-xl border border-neutral-200 p-3">
                <img src={enroll.qr} alt="رمز QR للتحقق بخطوتين" className="size-44" />
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 p-3">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                  أو أدخل المفتاح يدويًا (احفظه في مكان آمن — بدونه قد تفقد الدخول):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs break-all font-mono text-neutral-800 dark:text-neutral-100" dir="ltr">
                    {enroll.secret}
                  </code>
                  <button
                    onClick={() => void copySecret()}
                    title="نسخ المفتاح"
                    className="grid place-items-center size-8 shrink-0 rounded-lg text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                  >
                    {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  أدخل الرمز الظاهر في التطبيق
                </span>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3.5 py-2.5 text-center text-lg tracking-[0.4em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => void confirmEnroll()}
                  disabled={busy || code.length < 6}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-50 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                  تأكيد وتفعيل
                </button>
                <button
                  onClick={() => {
                    setEnroll(null);
                    setCode("");
                    setError(null);
                  }}
                  disabled={busy}
                  className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {enabled && (
            <button
              onClick={() => void disable()}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldOff className="size-4" />}
              إيقاف التحقق بخطوتين
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
