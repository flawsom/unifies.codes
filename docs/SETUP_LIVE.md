# Go live: cloud sync (Supabase) + AI (OpenRouter)

This guide turns on the two **optional** features of Unifies:

1. **Account mode / cloud sync** — sign in with Google, your plan + progress syncs per-account across devices. (Without this the app still works fully in **guest mode**.)
2. **AI curriculum analysis** — the "Analyze with Unifies AI" button calls a **free** LLM. (Without the key it silently uses the built-in offline planner.)

Neither requires a paid plan. Both are configured with env vars on your host — **no code changes**.

---

## Step 1 — Create a Supabase project

1. Go to https://supabase.com → **New project**.
2. Pick a name (e.g. `unifies`), a strong DB password (save it), and a region close to you.
3. Wait ~1 minute for it to provision.

## Step 2 — Run the schema

1. In your Supabase project: **SQL Editor → New query**.
2. Open [`supabase/schema.sql`](../supabase/schema.sql) in this repo, copy its **entire** contents, paste into the query box.
3. Click **Run**. The script drops and recreates the tables + RLS policies, so it's safe to re-run. You'll see `Success. No rows returned` (no data is inserted). If you ever hit a `column "id" does not exist` error, just re-run this script — it resets the schema to the correct shape.

This creates:
- `profiles` — one row per account (public share handle + live snapshot)
- `progress` — per account: checked items, start date, **your uploaded plan** (`curriculum_json`), and **revision skips** (`skipped`)
- `curriculum` — the admin-editable default roadmap
- Row-level security so users only touch their own rows.

## Step 3 — Turn on Google sign-in

1. **Authentication → Providers → Google** → enable.
2. Create OAuth credentials in https://console.cloud.google.com → **APIs & Services → Credentials → OAuth client ID** (type: Web application).
   - Authorized redirect URI: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
3. Paste the **Client ID** and **Client secret** into the Supabase Google provider box → **Save**.
4. In Google Cloud Console, the OAuth client's **Authorized redirect URI** must be Supabase's callback (not your app):
   `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`

## Step 3.5 — Auth URL Configuration (Site URL + Redirect URLs)

This is required or Google sign-in will fail after login. Go to
**Authentication → URL Configuration** and set:

- **Site URL** (the default fallback when no redirect URL matches):
  ```
  https://unifies.codes
  ```
  > For local-only testing you may temporarily use `http://localhost:5173`, but
  > for the live app it must be the production domain `https://unifies.codes`.

- **Redirect URLs** → click **Add URL** and add **both**:
  ```
  http://localhost:5173
  https://unifies.codes
  ```
  Optionally add preview-deploy hosts so PR previews can also sign in:
  ```
  https://*.vercel.app
  https://*.netlify.app
  ```

Then click **Save changes**.

**Why:** after Google authenticates, Supabase redirects the user to one of these
allowed URLs. If the post-login URL isn't in this allow-list, Supabase rejects it
and sign-in fails. `localhost:5173` is Vite's dev port (not `3000`); `unifies.codes`
is the deployed site.

> Note: the Google-side **Authorized redirect URI** (Step 3.4) is Supabase's own
> `/auth/v1/callback` — that is different from Supabase's **Redirect URLs** above.
> Keep them straight: Google → Supabase callback; Supabase → your app URLs.

## Step 4 — Copy the two Supabase keys

1. **Project Settings → API**:
   - **Project URL** → e.g. `https://<YOUR-PROJECT-REF>.supabase.co`
   - **anon public** key → a JWT starting with `eyJ...`
2. Keep these handy for Step 6.

---

## Step 5 — Get a FREE OpenRouter key (for the AI)

1. Sign up at https://openrouter.ai (free).
2. **Keys** → **Create key**. Copy it (starts with `sk-or-...`).
3. The default model is a **free** one (`google/gemma-2-9b-it:free`). No cost. You can optionally override with `OPENROUTER_MODEL`.

> The key is used **only** by the `/api/analyze` serverless function and is **never** sent to the browser.

---

## Step 6 — Add env vars on your host

### Vercel
- Project → **Settings → Environment Variables** → add for **Production, Preview, Development**:
  - `VITE_SUPABASE_URL` = `https://<YOUR-PROJECT-REF>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `<anon key>`
  - `OPENROUTER_API_KEY` = `sk-or-...`
  - (optional) `OPENROUTER_MODEL` = `google/gemma-2-9b-it:free`

Or via CLI:
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add OPENROUTER_API_KEY production
```

### Netlify
- **Site configuration → Environment variables** → add for **all deploy contexts**:
  - `VITE_SUPABASE_URL` = `https://<YOUR-PROJECT-REF>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `<anon key>`
  - `OPENROUTER_API_KEY` = `sk-or-...`
  - (optional) `OPENROUTER_MODEL` = `google/gemma-2-9b-it:free`

Or via CLI:
```bash
netlify env:set VITE_SUPABASE_URL "https://<YOUR-PROJECT-REF>.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "<anon key>"
netlify env:set OPENROUTER_API_KEY "sk-or-..."
```

> For **local dev**, copy `.env.example` to `.env.local` and fill the same three values, then `npm run dev`.

## Step 7 — Redeploy

After adding env vars, **redeploy** (Vercel/Netlify auto-redeploy on save; or push a commit / click "Redeploy"). The app reads the vars at build time.

---

## How to verify it's live

1. Open the deployed URL. You should see the **Unifies import screen**.
2. Paste a syllabus → **Analyze with Unifies AI** → it should now say **"Structured by AI"** (not "offline planner") in the gap-analysis preview.
3. Click **Sign in with Google** → after redirect, your plan + checkmarks sync. Reload on another device → same state.
4. Check an item → it appears on your `?u=<handle>` shared profile.

## Security notes
- Only the **anon** Supabase key and the **OpenRouter** key live on the host. **Never** put the Supabase **service-role** key in `VITE_*` or host env vars — it bypasses RLS.
- If you ever exposed a key, rotate it immediately in the provider dashboard.
