# MySpace — مساحة تخزين ومزامنة شخصية

**مساحة ويب خاصة بك: ارفع الصور والملفات، أو اكتب نصًا، وستجدها متزامنة فورًا على أي جهاز —
هاتف، حاسوب، لوحي — عند فتح الرابط نفسه وتسجيل الدخول بالحساب نفسه.**

عربي بالكامل (RTL)، بسيط، وسريع، ومصمّم لشخص واحد: مساحتك أنت، لا شبكة اجتماعية ولا تعليقات ولا متعدد المستخدمين.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-149eca.svg)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Storage%20%2B%20Realtime-3ecf8e.svg)](https://supabase.com)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aymanjrmh/myspace&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY)

---

## ✨ المزايا

- **ثلاثة أنواع من المحتوى:** صور، ملفات (PDF/Word/ZIP/صوت…)، ونصوص.
- **رفع متعدد:** حتى 20 ملفًا في دفعة واحدة + سحب وإفلات + منتقي ملفات الجوال.
- **مزامنة حقيقية:** قاعدة بيانات مركزية + Realtime، فما ترفعه من الجوال يظهر على الحاسوب خلال ثانية دون تحديث.
- **معاينات:** صور مصغّرة، معاينة كاملة، وأيقونة حسب نوع الملف.
- **تنزيل بالاسم الأصلي** عبر روابط موقّعة مؤقتة.
- **واجهة عربية RTL** متجاوبة مع الوضع الداكن، وحالات تحميل/فراغ/خطأ واضحة.
- **خصوصية بالتصميم:** RLS على مستوى الصفوف، وعاء تخزين خاص، وجلسة فردية واحدة.

## 🚀 تجربة مباشرة

**https://myspace-coral.vercel.app**

> هذا الرابط هو المساحة الشخصية للمشرف على المشروع، والتسجيل فيه **مغلق بعد أول حساب**.
> لتجربة التطبيق لحسابك، انشر نسختك الخاصة بخطوات «التشغيل السريع» أدناه.

## 🧱 البنية

| الجزء | التقنية |
|---|---|
| الواجهة | React 19 + TypeScript + Vite + Tailwind CSS 4 (RTL كامل) |
| قاعدة البيانات | Supabase Postgres + Row Level Security (RLS) |
| تخزين الملفات | Supabase Storage — وعاء خاص (Private) + روابط موقّعة (Signed URLs) |
| المزامنة الفورية | Supabase Realtime (Postgres Changes) |
| المصادقة | Email + Password (حساب فردي؛ يُغلق التسجيل بعد أول حساب) |
| الاستضافة | Vercel (نشر تلقائي عبر GitHub Actions) |

## ⚡ التشغيل السريع (نسختك الخاصة)

### 1) أنشئ مشروع Supabase

1. أنشئ مشروعًا جديدًا على [supabase.com](https://supabase.com) (الخطة المجانية تكفي).
2. افتح **SQL Editor** والصق محتوى الملف [`supabase/setup.sql`](supabase/setup.sql) كاملًا ثم **Run**.
   ينفّذ السكربت:
   - إنشاء جدول `myspace_items` + تفعيل RLS وسياساته.
   - إنشاء وعاء تخزين خاص `myspace` بحد 50MB للملف + سياساته.
   - تفعيل Realtime على الجدول.
   - تفعيل حماية «أول حساب فقط» (`enforce_single_user`).

### 2) المفاتيح

من لوحة Supabase: **Project Settings → API**، وانسخ `Project URL` و `anon public`:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> مفتاح `anon` مفتاح «قابل للنشر» وليس سريًا — الحماية الحقيقية تأتي من RLS.
> **لا تضع مفتاح `service_role` في الواجهة أبدًا.**

### 3) التشغيل محليًا

```bash
npm install
npm run dev
```

افتح الموقع واضغط «إنشاء المساحة» وأدخل بريدك وكلمة مرور من 6 أحرف على الأقل؛
هذه لحظة إنشاء حسابك الوحيد، وبعدها يُغلق التسجيل تلقائيًا.

### 4) النشر

**أسهل طريقة:** زر «Deploy with Vercel» أعلى الصفحة، وأضف المتغيرين `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`.

**أو عبر GitHub Actions** (المستخدم في هذا المستودع): راجع [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)،
وأضف في `Settings → Secrets and variables → Actions`:

| السر | القيمة |
|---|---|
| `VERCEL_TOKEN` | توكن من [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VITE_SUPABASE_URL` | رابط مشروعك |
| `VITE_SUPABASE_ANON_KEY` | مفتاح anon |

بعدها كل `git push` إلى `main` يبني وينشر تلقائيًا.

> ملاحظة تقنية: سير النشر يحذف مجلد `.git` قبل التحميل إلى Vercel، لأن Vercel يرفض النشرات
> التي يكون فيها «مؤلف الكوميت» غير مصرّح له على المشروع (حالة `BLOCKED` / `TEAM_ACCESS_REQUIRED`).

## 🔒 نموذج الأمان

- **RLS مفعّل** على `myspace_items`: كل صف مرتبط بـ `auth.uid()`، ولا يمكن قراءة أو تعديل صفوف مستخدم آخر.
- **وعاء تخزين خاص:** لا وصول عام؛ كل عرض/تنزيل يمرّ برابط موقّع صالح لمدة ساعة.
- **مسار تخزين آمن:** `{userId}/{uuid}/{uuid}.{ext}` — أسماء ملفات ASCII، مع حفظ الاسم الأصلي في `title`
  (يمنع رفض أسماء الملفات العربية/ذات المسافات).
- **حساب واحد فقط:** محفّز `enforce_single_user` يمنع إنشاء أي حساب ثانٍ.
- **التحقق من النوع والحجم** في الواجهة قبل الرفع، مع حد أقصى 50MB مضبوط أيضًا في وعاء التخزين.
- لا أسرار في الواجهة: مفتاح anon فقط، ولا وجود لـ `service_role` في أي ملف.

## 🧪 سيناريوهات التحقق

1. من الهاتف: ارفع صورة → تأكد من ظهورها.
2. من الحاسوب: افتح الرابط نفسه والحساب نفسه → تظهر الصورة فورًا بفضل Realtime.
3. ارفع PDF من الحاسوب → يظهر على الهاتف دون تحديث يدوي.
4. اكتب نصًا من الهاتف واحفظه → افتحه من الحاسوب.
5. ارفع عدة ملفات دفعة واحدة → تحقق من شريط التقدم وظهورها جميعًا.
6. أعد تحميل الصفحة → المحتوى باقٍ (قاعدة بيانات وليس ذاكرة متصفح).
7. بدون تسجيل دخول → لا يظهر شيء. محاولة إنشاء حساب ثانٍ → مرفوضة.

## ⚙️ الحدود والإعدادات

| الإعداد | القيمة | مكان التغيير |
|---|---|---|
| الحد الأقصى للملف | 50MB | `supabase/setup.sql` + `src/lib/supabase.ts` |
| عدد الملفات بالدفعة | 20 | `src/lib/api.ts` |
| مدة رابط التوقيع | ساعة | `src/lib/api.ts` |

## 🗂️ هيكل المشروع

```
src/
  App.tsx                 الجلسة، الحالة، الرفع، Realtime
  components/             AuthScreen, Header, UploadZone, ItemGrid, PreviewModal, TextDialog…
  lib/api.ts              رفع/توقيع/تنزيل/حذف + مفاتيح التخزين الآمنة
  lib/supabase.ts         عميل Supabase والإعدادات
supabase/setup.sql        الجدول + RLS + الوعاء + Realtime + الحساب الفردي
.github/workflows/        النشر التلقائي على Vercel
```

## 🤝 المساهمة

الاقتراحات والتحسينات مرحّب بها: افتح Issue أو أرسل Pull Request.
يرجى الحفاظ على طابع المشروع: **بسيط، عربي، خاص، وبلا مزايا اجتماعية**.

## 📄 الترخيص

[MIT](LICENSE) — استخدمه وعدّله وانشره بحرية مع ذكر المصدر.

---

## English

**MySpace** is a private, Arabic-first (RTL) personal storage & sync web app: upload images, files,
or plain text, and see everything synced instantly across your phone, laptop, and tablet in real time.

- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 · Supabase (Postgres + RLS + private Storage + Realtime) · Vercel.
- **Security:** row-level security, private bucket with signed URLs, upload validation, single-account lock.
- **Setup:** run `supabase/setup.sql` in your Supabase project, add `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` to `.env`, then `npm install && npm run dev`.

Licensed under MIT.
