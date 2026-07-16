# FDE Deployment Tracker

A 90-day interactive study tracker for becoming a Forward Deployed Engineer — Python fundamentals through Docker/Kubernetes, enterprise auth, RAG/agents, a continuous DSA practice track (LeetCode/Codeforces/HackerRank), and a staff-level "Beyond Day 90" bonus phase.

Two modes:

- **Guest mode** (no setup): progress is saved in your browser only (`localStorage`). No account, no backend.
- **Account mode** (optional, via [Supabase](https://supabase.com)): sign in with Google, your progress syncs to the cloud per-account, and admins get a control panel to edit the curriculum, manage accounts, and view/edit anyone's progress.

The app auto-detects which mode to run in based on whether Supabase env vars are set — nothing breaks if you skip the setup below.

## Run it locally

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`). This works immediately in guest mode.

## Setting up accounts (Google OAuth + admin panel)

This uses [Supabase](https://supabase.com) for auth and storage — it has a free tier and needs no server of your own.

### 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Once it's provisioned, go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Restart `npm run dev` after editing this file.

### 3. Create the database tables

In the Supabase dashboard, go to **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:

- `profiles` — one row per account (email, display name, `is_admin` flag)
- `curriculum` — a single editable row holding the whole topic tree, editable by admins
- `progress` — one row per account holding their checked items + start date

All three tables have row-level security enabled: users can only read/write their own data, admins can read/write everyone's.

### 4. Enable Google as an auth provider

1. In Supabase: **Authentication → Providers → Google** → toggle it on.
2. You'll need a Google OAuth Client ID/Secret. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create (or reuse) an OAuth 2.0 Client ID of type **Web application**.
   - Add this **Authorized redirect URI** (Supabase shows you the exact one, it looks like):
     `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Copy the generated **Client ID** and **Client Secret** into the Supabase Google provider settings and save.
3. In Supabase **Authentication → URL Configuration**, add your app's URL (e.g. `http://localhost:5173` for local dev, and your production URL once deployed) to **Site URL** and **Redirect URLs**.

### 5. Make yourself an admin

1. Run the app, click **Sign in with Google**, and complete the flow once. This auto-creates your `profiles` row.
2. Back in the Supabase SQL Editor, run:
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
3. Reload the app — you'll now see an **Admin** button next to your name.

### What the Admin Panel can do

- **Accounts** — list every signed-up account, promote/demote admins, reset a specific account's progress.
- **Topics** — edit the entire curriculum (phases, weeks, items, the bonus track, the DSA track) as JSON; every signed-in user reads this same live version. "Reset to bundled default" restores the version shipped in the code.
- **Progress** — pick any account and view or hand-edit their checked items and mission start date.

## Deploy to Vercel

**Option A — CLI (fastest):**
```bash
npm install -g vercel
vercel
```
Follow the prompts. Vercel auto-detects Vite; no config file needed. Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as project environment variables if you want account mode in production.

**Option B — GitHub import:**
1. Push this folder to a new GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Add the two `VITE_SUPABASE_*` env vars under Project Settings → Environment Variables.
5. Deploy.

## Deploy to Netlify

**Option A — CLI:**
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Option B — GitHub import:**
1. Push this folder to a new GitHub repo.
2. Go to [app.netlify.com](https://app.netlify.com) → Add new site → Import an existing project.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Add the two `VITE_SUPABASE_*` env vars under Site configuration → Environment variables.
5. Deploy.

Whichever host you use, remember to add its final URL to Supabase's **Authentication → URL Configuration → Redirect URLs**, or Google sign-in will fail there.

## Continuous Integration

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on every push/PR to `main`: installs dependencies and runs `npm run build`, uploading the `dist/` output as a build artifact. It optionally reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from repo secrets (**Settings → Secrets and variables → Actions**) if you want CI to build against a real project — this is optional, the build succeeds either way.

## Notes

- In guest mode, progress is stored in the visitor's own browser (`localStorage`), scoped to whatever domain you deploy this to. Clearing browser data or switching browsers/devices resets it.
- In account mode, progress is stored per-account in Supabase Postgres and synced on every change (debounced ~500ms).
- Every resource link points to real, official documentation or well-known free resources (official docs sites, Real Python, LangChain/LangGraph docs, LeetCode/Codeforces/HackerRank, etc.) — nothing invented.
- To customize the bundled default curriculum (used before any admin edits are saved, and as the guest-mode content), edit the `DEFAULT_PHASES`, `DEFAULT_BONUS`, and `DEFAULT_PARALLEL_TRACK` arrays at the top of `src/App.jsx`.
