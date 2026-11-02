import { useEffect, useState } from "react";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { listVerifiedFactors, mfaError, verifyTotp } from "../lib/mfa";

interface MfaGateProps {
  onDone: () => void;
  onLogout: () => void;
}

/** شاشة تأكيد بخطوتين — تظهر بعد كلمة المرور عندما تكون المصادقة الثنائية مفعّلة */
export default function MfaGate({ onDone, onLogout }: MfaGateProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listVerifiedFactors()
      .then((f) => {
        // لا يوجد عامل مؤكَّد فعليًا → لا داعي للبوابة
        if (alive && f.length === 0) onDone();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [onDone]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const factors = await listVerifiedFactors();
      if (factors.length === 0) {
        onDone();
        return;
      }
      await verifyTotp(factors[0].id, code);
      onDone();
    } catch (err) {
      setError(mfaError(err));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm animate-rise">
        <div className="flex flex-col items-center text-center gap-3 mb-7">
          <span className="size-12 grid place-items-center rounded-2xl bg-accent/10 text-accent">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">خطوة التحقق الثانية</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة على هاتفك.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">رمز التحقق</span>
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="mt-1.5 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3.5 py-3 text-center text-xl tracking-[0.5em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || code.length < 6}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-50 text-white px-4 py-3 text-sm font-semibold shadow-sm transition-colors"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          تأكيد ودخول
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <LogOut className="size-3.5" />
          تسجيل الخروج
        </button>
      </form>
    </main>
  );
}
