import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AuthScreenProps {
  onToast: (kind: "info" | "error", text: string) => void;
}

export default function AuthScreen({ onToast }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapAuthError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes("invalid login")) return "البريد أو كلمة المرور غير صحيحة.";
    if (m.includes("already registered")) return "هذا البريد مسجَّل مسبقًا، جرّب تسجيل الدخول.";
    if (m.includes("anonymous sign") || m.includes("signups not allowed") || m.includes("هذه المساحة"))
      return "هذه المساحة خاصة بصاحبها، ولا يمكن إنشاء حسابات جديدة.";
    if (m.includes("failed to fetch") || m.includes("network")) return "تعذر الاتصال بالخادم، تحقق من الإنترنت.";
    if (m.includes("rate limit")) return "محاولات كثيرة جدًا، انتظر قليلًا ثم أعد المحاولة.";
    return msg || "حدث خطأ غير متوقع.";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError("أدخل بريدًا صحيحًا وكلمة مرور من 6 أحرف على الأقل.");
      return;
    }
    setBusy(true);
    const { error: err } = mode === "login"
      ? await supabaseAuth.signIn(email.trim(), password)
      : await supabaseAuth.signUp(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(mapAuthError(err.message));
      return;
    }
    if (mode === "signup") {
      onToast("info", "تم إنشاء مساحتك الخاصة. يمكنك الآن الدخول من أي جهاز بنفس الرابط.");
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-sm animate-rise">
        <div className="flex flex-col items-center text-center gap-3 mb-7">
          <BrandMark />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">MySpace</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            مساحتك الخاصة لملفاتك ونصوصك — دخول بكلمة مرور، ومزامنة تلقائية بين جميع أجهزتك.
          </p>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-5">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-sm font-medium mb-5">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={
                  "rounded-lg py-2 transition-colors " +
                  (mode === m
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")
                }
              >
                {m === "login" ? "تسجيل الدخول" : "إنشاء المساحة"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">البريد الإلكتروني</span>
              <input
                type="email"
                dir="ltr"
                autoComplete="email"
                aria-label="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="mt-1.5 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-neutral-400"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">كلمة المرور</span>
              <input
                type="password"
                dir="ltr"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-label="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-neutral-400"
              />
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-accent hover:bg-accent-strong text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "دخول" : "إنشاء مساحتي"}
            </button>
          </form>

          {mode === "signup" && (
            <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              ملاحظة: المساحة فردية. يُسمح بإنشاء أول حساب فقط، ثم يُغلق التسجيل ولا
              يعمل إلا مع كلمة المرور الخاصة بك.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export function BrandMark() {
  return (
    <div className="size-14 grid place-items-center rounded-2xl bg-accent text-white shadow-md shadow-accent/25 text-2xl font-bold select-none">
      M
    </div>
  );
}

/** غلاف بسيط لواجهة المصادقة */
const supabaseAuth = {
  signIn: (email: string, password: string) =>
    supabase!.auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string) =>
    supabase!.auth.signUp({ email, password }),
};
