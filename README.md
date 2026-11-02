# MySpace

**One private place for your photos, files and notes — on your phone, your laptop, and everything in between.**

[العربية](README.ar.md) · MIT

---

Most storage apps are built for teams. Shared folders, invites, comments, seat-based plans. What you actually wanted was probably simpler: open a link on any device and find your stuff where you left it.

That's why MySpace is single-user on purpose. You create one account, and sign-ups close right after. Nobody can join, nothing is public, and there is no feed to scroll. It's a locker, not a social network.

## What it does

Upload from the file picker, drag and drop, or just type a note. Then watch it show up on your other device — usually in under a second, without hitting refresh.

- Photos, PDFs, archives, audio — any file up to 50 MB
- Up to 20 files in one batch, with a progress bar that reflects the real upload
- Plain text as a first-class content type, not a workaround
- Inline image previews, download with the original filename
- Arabic RTL interface, dark mode, and it behaves on a phone browser

## What it doesn't do

No chat. No comments. No share links. No multiple users. No AI. Nothing that needs a moderation policy or a terms-of-service novel.

If it's not about keeping your own things in one place, it's out of scope.

## How it's built

- **Frontend:** React 19 + TypeScript + Vite, styled with Tailwind CSS 4
- **Data:** Supabase Postgres with row-level security
- **Files:** Supabase Storage, private bucket, signed URLs only
- **Live updates:** Supabase Realtime (Postgres changes)
- **Hosting:** Vercel, deployed by the GitHub Actions workflow in this repo

## Run your own copy

Takes about ten minutes, and everything here runs on free tiers.

1. Create a project on [supabase.com](https://supabase.com).
2. Open the SQL Editor, paste all of [`supabase/setup.sql`](supabase/setup.sql), and run it.
   That creates the table, the policies, the private bucket, realtime, and the single-account lock.
3. Copy the Project URL and the anon key from **Project Settings → API**, then:

   ```bash
   cp .env.example .env
   npm install
   npm run dev
   ```

4. Open the app and create your account. First account, only account — after that, registration is closed.

**Deploying:** click the button below, or push to GitHub and let the included workflow build it.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aymanjrmh/myspace&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY)

> The live copy at https://myspace-coral.vercel.app is the maintainer's own space. Sign-ups are closed there by design, so deploy your own to try it.

## Security, in plain terms

Full details, and the settings only you can switch on, in [SECURITY.md](SECURITY.md).

- Every row is tied to `auth.uid()`, and RLS is on — you can't read or touch another user's data even with the public key.
- The bucket is private. Every view and download goes through a signed URL that expires after an hour.
- Storage paths are ASCII (`{userId}/{uuid}/{uuid}.{ext}`), while the original filename lives in the database. That detail exists because Arabic and spaced filenames get rejected by the storage API otherwise.
- A database trigger (`enforce_single_user`) rejects any second account.
- The frontend only ever holds the publishable anon key. No `service_role` key anywhere in the repo.

## Things you'll probably want to change

| Setting | Default | Where |
|---|---|---|
| Max file size | 50 MB | `supabase/setup.sql` and `src/lib/supabase.ts` |
| Files per batch | 20 | `src/lib/api.ts` |
| Signed URL lifetime | 1 hour | `src/lib/api.ts` |

## Layout

```
src/App.tsx            session, state, uploads, realtime channel
src/components/        auth screen, header, upload zone, cards, preview, text dialog
src/lib/api.ts         upload / sign / download / delete, storage keys
supabase/setup.sql     table, RLS, bucket, realtime, single-user trigger
.github/workflows/     deploy to Vercel on push
```

## Found a bug?

Open an issue with what you did, what you expected, and what happened. Screenshots help.

If this saved you some time, a star helps other people find it.

## License

[MIT](LICENSE). Use it, change it, ship it.
