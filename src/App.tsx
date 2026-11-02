import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  IDLE_LOGOUT_MS,
  isConfigured,
  MAX_TEXT_CHARS,
  MAX_TITLE_CHARS,
  SIGNED_URL_REFRESH_MS,
  supabase,
} from "./lib/supabase";
import { safeFilename } from "./lib/utils";
import {
  deleteItem,
  downloadItem,
  friendlyError,
  getSignedUrl,
  uploadOne,
  validateBatch,
} from "./lib/api";
import type { RealtimeState, SpaceItem, UploadJob } from "./types";
import AuthScreen from "./components/AuthScreen";
import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import TextDialog from "./components/TextDialog";
import ItemGrid from "./components/ItemGrid";
import PreviewModal from "./components/PreviewModal";
import { OfflineBanner, Toasts, UploadsBar, type Toast } from "./components/Feedback";
import { EmptyState, LoadError, LoadingSkeleton, RealtimeBadge } from "./components/States";
import { SetupScreen, Splash } from "./components/Screens";
import MfaGate from "./components/MfaGate";
import SecurityDialog from "./components/SecurityDialog";
import { getAssurance } from "./lib/mfa";

/* ==================== الوضع الداكن ==================== */

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("myspace-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("myspace-theme", dark ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute("content", dark ? "#0b0c10" : "#f7f7f8");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

/* ==================== قفل الجلسة عند الخمول ==================== */

/** يسجّل الخروج تلقائيًا بعد مدة من عدم النشاط (جهاز منسي مفتوحًا) */
function useIdleLogout(onLogout: () => void, timeoutMs: number) {
  useEffect(() => {
    let timer = 0;
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onLogout, timeoutMs);
    };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    const onVisible = () => {
      if (!document.hidden) reset();
    };
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onLogout, timeoutMs]);
}

/* ==================== الجذر: جلسة المستخدم ==================== */

export default function App() {
  const [init, setInit] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [aal, setAal] = useState<{ current: string | null; next: string | null } | null>(null);
  const [aalChecked, setAalChecked] = useState(false);
  const { dark, toggle } = useTheme();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const checkAssurance = useCallback(async () => {
    const level = await getAssurance();
    setAal(level);
    setAalChecked(true);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setInit(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.access_token) {
        supabase!.realtime.setAuth(data.session.access_token);
      }
      setInit(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (s?.access_token) supabase!.realtime.setAuth(s.access_token);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // فحص مستوى تأكيد الجلسة (هل يحتاج رمز التحقق؟)
  useEffect(() => {
    if (!session) {
      setAal(null);
      setAalChecked(false);
      return;
    }
    void checkAssurance();
  }, [session, checkAssurance]);

  const logout = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  // إنهاء الجلسة على كل الأجهزة (مفيد إذا فُقد الجهاز)
  const logoutAll = useCallback(async () => {
    if (!window.confirm("تسجيل الخروج من كل الأجهزة، بما فيها هذا الجهاز؟")) return;
    await supabase?.auth.signOut({ scope: "global" });
  }, []);

  if (init) return <Splash />;
  if (!supabase || !isConfigured) return <SetupScreen />;
  if (!session) return (
    <>
      <AuthScreen onToast={notify} />
      <Toasts toasts={toasts} />
    </>
  );

  // انتظار فحص مستوى التأمين قبل عرض المحتوى
  if (!aalChecked) return <Splash />;

  // مصادقة ثنائية مفعّلة وكلمة المرور وحدها لا تكفي
  if (aal?.next === "aal2" && aal.current !== "aal2")
    return (
      <>
        <MfaGate onDone={checkAssurance} onLogout={logout} />
        <Toasts toasts={toasts} />
      </>
    );

  return (
    <>
      <Workspace
        session={session}
        dark={dark}
        onToggleDark={toggle}
        onNotify={notify}
        onLogout={logout}
        onLogoutAll={logoutAll}
      />
      <Toasts toasts={toasts} />
    </>
  );
}

/* ==================== مساحة العمل ==================== */

interface WorkspaceProps {
  session: Session;
  dark: boolean;
  onToggleDark: () => void;
  onNotify: (kind: Toast["kind"], text: string) => void;
  onLogout: () => void;
  onLogoutAll: () => void;
}

function Workspace({
  session,
  dark,
  onToggleDark,
  onNotify,
  onLogout,
  onLogoutAll,
}: WorkspaceProps) {
  const uid = session.user.id;

  const [items, setItems] = useState<SpaceItem[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [preview, setPreview] = useState<SpaceItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rt, setRt] = useState<RealtimeState>("connecting");
  const [offline, setOffline] = useState(!navigator.onLine);

  const pickerRef = useRef<HTMLInputElement>(null);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  // مراجع حديثة تُستخدم داخل المؤقتات دون إعادة اشتراك
  const urlsRef = useRef<Record<string, string>>({});
  const itemsRef = useRef<SpaceItem[]>([]);
  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // قفل تلقائي للجلسة عند ترك الجهاز مفتوحًا
  useIdleLogout(onLogout, IDLE_LOGOUT_MS);

  /* ---------- جلب روابط توقيع مؤقتة للصور فقط ---------- */
  const refreshUrls = useCallback(async (list: SpaceItem[], force = false) => {
    const media = list.filter(
      (i) => i.type === "image" && i.storage_path && (force || !urlsRef.current[i.id]),
    );
    if (media.length === 0) return;
    const entries = await Promise.all(
      media.map(async (i) => {
        try {
          return [i.id, await getSignedUrl(i.storage_path!)] as const;
        } catch {
          return [i.id, null] as const;
        }
      }),
    );
    setUrls((prev) => {
      const next = { ...prev };
      for (const [id, u] of entries) if (u) next[id] = u;
      return next;
    });
  }, []);

  /* ---------- تجديد الروابط قبل انتهاء صلاحيتها ---------- */
  useEffect(() => {
    const timer = window.setInterval(
      () => void refreshUrls(itemsRef.current, true),
      SIGNED_URL_REFRESH_MS,
    );
    return () => window.clearInterval(timer);
  }, [refreshUrls]);

  /* ---------- إضافة/إزالة محلية مع منع التكرار (سجل واحد من الحقيقة) ---------- */
  const upsertLocal = useCallback((item: SpaceItem) => {
    setItems((prev) => (prev.some((x) => x.id === item.id) ? prev : [item, ...prev]));
    if (item.type === "image" && item.storage_path) {
      getSignedUrl(item.storage_path).then((u) => {
        if (u) setUrls((prev) => ({ ...prev, [item.id]: u }));
      });
    }
  }, []);

  const removeLocal = useCallback((id: string) => {
    setPreview((p) => (p?.id === id ? null : p));
    setItems((prev) => prev.filter((x) => x.id !== id));
    setUrls((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /* ---------- تحميل أولي ---------- */
  const loadItems = useCallback(async () => {
    setStatus("loading");
    setLoadError(null);
    const { data, error } = await supabase!
      .from("myspace_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError(error.message);
      setStatus("error");
      return;
    }
    const list = (data ?? []) as SpaceItem[];
    setItems(list);
    setStatus("ready");
    refreshUrls(list);
  }, [refreshUrls]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  /* ---------- المزامنة الفورية (Realtime) بين الأجهزة ---------- */
  useEffect(() => {
    let cancelled = false;
    const channel = supabase!
      .channel(`myspace-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "myspace_items",
          filter: `user_id=eq.${uid}`,
        },
        (change) => {
          if (change.eventType === "INSERT") {
            upsertLocal(change.new as SpaceItem);
          } else if (change.eventType === "DELETE") {
            removeLocal((change.old as { id: string }).id);
          } else if (change.eventType === "UPDATE") {
            removeLocal((change.new as SpaceItem).id);
            upsertLocal(change.new as SpaceItem);
          }
        },
      )
      .subscribe((state) => {
        if (cancelled) return;
        setRt(
          state === "SUBSCRIBED"
            ? "live"
            : state === "CHANNEL_ERROR" || state === "CLOSED" || state === "TIMED_OUT"
              ? "connecting"
              : "connecting",
        );
      });
    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [uid, upsertLocal, removeLocal]);

  /* ---------- حالة الاتصال بالإنترنت ---------- */
  useEffect(() => {
    const goOnline = () => {
      setOffline(false);
      if (rt !== "live") loadItems(); // مزامنة عند عودة الاتصال
    };
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt, loadItems]);

  /* ---------- رفع الملفات ---------- */
  const uploadFiles = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList);
      try {
        validateBatch(files);
      } catch (e) {
        onNotify("error", (e as Error).message);
        return;
      }

      const batch: UploadJob[] = files.map((f, i) => ({
        key: `${Date.now()}-${i}`,
        name: f.name,
        status: "uploading",
        progress: 0,
      }));
      setJobs((prev) => [...prev, ...batch]);

      for (let i = 0; i < files.length; i++) {
        const key = batch[i].key;
        // تقدم تقديري سلس أثناء الرفع (المكتبة لا توفر نسبة دقيقة)
        const ticker = window.setInterval(() => {
          setJobs((prev) =>
            prev.map((j) =>
              j.key === key && j.status === "uploading" && j.progress < 90
                ? { ...j, progress: Math.min(90, j.progress + 3 + Math.random() * 5) }
                : j,
            ),
          );
        }, 350);
        try {
          const item = await uploadOne(uid, files[i], () => {});
          window.clearInterval(ticker);
          setJobs((prev) =>
            prev.map((j) => (j.key === key ? { ...j, status: "done", progress: 100 } : j)),
          );
          upsertLocal(item);
        } catch (e) {
          window.clearInterval(ticker);
          setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, status: "failed" } : j)));
          onNotify("error", friendlyError(e, `فشل رفع «${files[i].name}»`));
        }
      }

      const succeeded = batch.length;
      setTimeout(() => {
        setJobs((prev) => prev.filter((j) => !batch.some((b) => b.key === j.key)));
      }, 1800);
      if (succeeded === files.length) {
        onNotify("success", `تم رفع ${succeeded} عنصر${succeeded > 1 ? "ًا" : ""} وستمتزامن فورًا مع بقية أجهزتك.`);
      } else {
        onNotify("info", "انتهى الرفع: بعض الملفات لم تنجح، راجع تفاصيل الشريط السفلي.");
      }
    },
    [uid, onNotify, upsertLocal],
  );

  /* ---------- حفظ نص ---------- */
  const saveText = useCallback(
    async (title: string, content: string): Promise<boolean> => {
      try {
        const clean = content.replace(/\r\n/g, "\n").trim();
        if (!clean) {
          onNotify("error", "لا يمكن حفظ نص فارغ.");
          return false;
        }
        if (clean.length > MAX_TEXT_CHARS) {
          onNotify("error", `النص طويل جدًا (الحد ${MAX_TEXT_CHARS.toLocaleString("ar")} حرف).`);
          return false;
        }
        const cleanTitle = safeFilename(title, "").slice(0, MAX_TITLE_CHARS);
        const fallbackTitle = clean.replace(/\s+/g, " ").slice(0, 40);
        const { data, error } = await supabase!
          .from("myspace_items")
          .insert({
            user_id: uid,
            type: "text",
            title: cleanTitle || fallbackTitle || "نص",
            content: clean,
          })
          .select()
          .single();
        if (error) throw error;
        upsertLocal(data as SpaceItem);
        onNotify("success", "تم حفظ النص.");
        return true;
      } catch (e) {
        onNotify("error", friendlyError(e, "تعذر حفظ النص"));
        return false;
      }
    },
    [uid, onNotify, upsertLocal],
  );

  /* ---------- حذف عنصر ---------- */
  const handleDelete = useCallback(
    async (item: SpaceItem) => {
      if (!window.confirm(`حذف «${item.title}» نهائيًا؟`)) return;
      setBusyId(item.id);
      try {
        await deleteItem(item);
        removeLocal(item.id);
      } catch (e) {
        onNotify("error", friendlyError(e, "تعذر الحذف"));
      } finally {
        setBusyId(null);
      }
    },
    [onNotify, removeLocal],
  );

  /* ---------- تنزيل ---------- */
  const handleDownload = useCallback(
    async (item: SpaceItem) => {
      try {
        if (item.type === "text") {
          const blob = new Blob([item.content ?? ""], {
            type: "text/plain;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${safeFilename(item.title, "نص")}.txt`;
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          return;
        }
        await downloadItem(item);
      } catch (e) {
        onNotify("error", friendlyError(e, "تعذر التنزيل"));
      }
    },
    [onNotify],
  );

  const openPicker = () => pickerRef.current?.click();

  const subtitle = useMemo(
    () => (session?.user?.email ? `مساحتك الخاصة لملفاتك ونصوصك · ${session.user.email}` : "مساحتك الخاصة لملفاتك ونصوصك"),
    [session],
  );

  return (
    <div className="min-h-dvh flex flex-col">
      <Header
        onOpenPicker={openPicker}
        onOpenText={() => setTextDialogOpen(true)}
        onOpenSecurity={() => setSecurityOpen(true)}
        onLogout={onLogout}
        dark={dark}
        onToggleDark={onToggleDark}
        subtitle={subtitle}
      />
      <OfflineBanner offline={offline} />

      <input
        ref={pickerRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-5 sm:py-7 space-y-6 sm:space-y-8">
        <UploadZone onPick={(f) => void uploadFiles(f)} onOpenText={() => setTextDialogOpen(true)} />

        <section>
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">محتواي</h2>
            <RealtimeBadge state={rt} />
          </div>

          {status === "loading" ? (
            <LoadingSkeleton />
          ) : status === "error" ? (
            <LoadError message={loadError ?? "خطأ غير معروف"} onRetry={() => void loadItems()} />
          ) : items.length === 0 ? (
            <EmptyState onFirstAdd={openPicker} />
          ) : (
            <ItemGrid
              items={items}
              urls={urls}
              onOpenImage={(i) => setPreview(i)}
              onOpenText={(i) => setPreview(i)}
              onDownload={handleDownload}
              onDelete={handleDelete}
              busyId={busyId}
            />
          )}
        </section>
      </main>

      <footer className="py-5 px-4 text-center text-[11px] text-neutral-400 dark:text-neutral-600 space-y-2">
        <p>MySpace · الترتيب من الأحدث إلى الأقدم · سياسة RLS تحفظ خصوصية ملفاتك</p>
        <button
          onClick={onLogoutAll}
          className="underline decoration-dotted underline-offset-4 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
        >
          تسجيل الخروج من كل الأجهزة
        </button>
      </footer>

      <TextDialog open={textDialogOpen} onClose={() => setTextDialogOpen(false)} onSave={saveText} />
      <SecurityDialog open={securityOpen} onClose={() => setSecurityOpen(false)} onNotify={onNotify} />
      <PreviewModal
        item={preview}
        url={preview && preview.type === "image" ? urls[preview.id] : undefined}
        onClose={() => setPreview(null)}
        onDownload={handleDownload}
      />
      <UploadsBar jobs={jobs} />
    </div>
  );
}
