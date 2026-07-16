# Unifies

**Turn any curriculum into a smart, trackable study plan — from absolute beginner to staff-level.**

Unifies is a free, open-source study tracker. Paste *your* curriculum (a bootcamp syllabus, a job description, your own notes, or load the FAANG/FDE sample) and Unifies uses an AI (or a built-in offline planner) to structure it, fill the gaps with foundational basics and advanced/staff-level depth, and give you a trackable roadmap with streaks, heatmaps, insights, revision mode, and shareable profiles.

- **Guest mode** (no setup): progress is saved in your browser only (`localStorage`). No account, no backend.
- **Account mode** (optional, via [Supabase](https://supabase.com)): sign in with Google, your plan + progress syncs to the cloud per-account.

The app auto-detects which mode to run in based on whether Supabase env vars are set — nothing breaks if you skip the setup below.

Hosted at **[unifies.codes](https://unifies.codes)** · Open source at **[github.com/flawsom/unifies.codes](https://github.com/flawsom/unifies.codes)**

<!-- STATUS -->

![tests](https://img.shields.io/badge/tests-53/53%20passing-brightgreen)
![coverage](https://img.shields.io/badge/coverage-n%2Fa-blue)
![ci](https://img.shields.io/badge/CI-GitHub%20Actions-9cf)

> _Status auto-generated from the Vitest run: **53/53 tests passing** across **12 file(s)**, **n/a** line coverage. This block is updated by CI — do not edit by hand._

<!-- /STATUS -->

## Features

- **Bring your own curriculum** — paste raw text, upload a `.txt`/`.md`/`.csv`/`.json` file, or load the FAANG/FDE sample. Not locked to one path.
- **AI gap analysis** — Unifies (a free LLM via the `/api/analyze` serverless function, or a built-in offline planner) structures your curriculum, then **adds** what's missing: absolute basics for a true beginner and advanced/staff-level depth to reach the top. It shows exactly what *you* included vs what *Unifies added*, plus a recommended path.
- **Beginner → advanced, in one view** — every item is tagged basic / intermediate / advanced, so you see the full ladder from "set up your editor" to "design for scale".
- **Revision & skip (with caution)** — walk through what you haven't done. Confident you already know something? Skip it — but only after a clear caution that skipped items leave your tracker and can't be tested or counted. You can restore anytime.
- **Focus (Today) view** — anchors on your mission-start date to show the current plan day, the phase/week you're in, and the next unchecked item to tackle.
- **Insights dashboard** — per-track completion bars, overall completion with an ahead/on/behind-plan pace estimate, a 14-day activity sparkline, and your live level / XP / momentum.
- **GitHub-style activity heatmap + real streak counter** — every checkbox records a `checkedAt` timestamp, so the heatmap and current/longest streak are computed from genuine history, not reconstructed from localStorage. The streak has a one-day grace window so a single missed day doesn't wipe motivation.
- **Command palette (⌘K / Ctrl+K)** — fuzzy-jump to any of the ~106 curriculum items across every phase, week, and topic. Fully keyboard-operable with focus trapping.
- **Keyboard shortcuts help (⌘? / Ctrl+?)** — a built-in cheatsheet of every shortcut.
- **Milestone & level-up celebrations** — completing a phase or leveling up fires a celebratory toast, derived from real progress.
- **Shareable public profile + leaderboard** — generate a read-only `?u=<handle>` link anyone can open, with a compare view; a leaderboard ranks the top streaks and is filterable by track. Works cross-device via Supabase, with a localStorage fallback.
- **Gamification** — live XP and levels per checked item (milestones are worth more), plus a weekly momentum score, all derived from real progress.
- **Reliable sync with visible status** — a "Saved ✓ · time" indicator, an offline queue that flushes on reconnect, and a clear error state. No silent data loss.
- **Installable PWA + offline** — install to desktop/mobile; the app shell works offline and queues your checkboxes while disconnected, flushing on reconnect.
- **Opt-in notifications** — a single, non-spammy weekly-goal reminder you can disable anytime.
- **Import / export** — export your real progress as JSON or CSV; import to migrate from other trackers. No lock-in.
- **Light / dark theme** — toggle or follow the OS; respects `prefers-reduced-motion`. (The default look is the RawBlock brutalist design system: black-on-white, thick borders, zero rounding.)
- **Per-account cloud sync** (optional) — sign in with Google; your plan + progress syncs to Supabase and survives device switches.
- **Admin panel** — edit the live curriculum, manage accounts, and view/edit anyone's progress.
- **Accessibility-first** — skip-to-content link, ARIA roles, focus traps in modals, visible focus rings, reduced-motion support.
- **Tested codebase** — pure progress-stat helpers and components are covered by Vitest + Testing Library; an end-to-end Playwright suite covers the command palette, share flow, and UX surfaces.

> **Free & open source.** MIT-licensed, no accounts or trackers required, runs fully in guest mode with no backend. No paid tier, no analytics — just a portfolio-grade study tool.

## 📘 User Guide — how to use the app

This section is a complete walkthrough. You don't need to read the setup sections above to start — **open the app and begin immediately** in guest mode.

### 0. Bring your curriculum (first thing)

On first launch you'll see the **Unifies import screen**. You have three options:

- **Paste your curriculum** — drop in a syllabus, job description, or your own notes as plain text / markdown / CSV.
- **Upload a file** — `.txt`, `.md`, `.csv`, or `.json`.
- **Load the FAANG/FDE sample** — a ready-made 90-day route, if you just want to see how it works.

Click **"Analyze with Unifies AI"**. Unifies structures your text, then shows a **gap analysis**: what *your* curriculum already covered vs what Unifies **added** (foundational basics + advanced/staff-level gaps), plus a recommended path. Click **"Use this plan"** to start tracking. No AI key configured? It quietly uses the built-in offline planner instead — same result, no network.

### 1. Set your mission start

After your plan loads you'll see a short onboarding nudge. Click **"Set mission start"** and pick the day you begin. This anchors:

- the **Today / Focus view** (what day you're on and what to do next),
- your **streak** and **activity heatmap**,
- your **weekly momentum** and pace-vs-plan estimate.

You can change it anytime from the header or the Focus view.

### 2. Track your progress

Each curriculum item is a checkbox. Click it to mark it done — the app records the **exact time** (`checkedAt`) you completed it and shows a live **XP** gain. Click again to undo.

Everything is organized into the phases Unifies built from **your** curriculum (plus any foundations / advanced gaps it added). Items are tagged **basic / intermediate / advanced** so you can see the full ladder. There's also a **practice/DSA track** and a **"Beyond mastery" bonus** section when relevant.

### 3. The Focus (Today) view

At the top of the dashboard, the **Focus view** tells you:

- which plan **day** you're on,
- which **phase / week** that maps to,
- the **next unchecked item** you should tackle,
- and a quick **weekly goal** control (set "items per week" — defaults to a sensible pace).

It recalculates from your mission start, so it's always honest about where you are.

### 4. Insights dashboard

Right below Focus, **Insights** shows:

- per-track completion bars (core vs DSA vs bonus),
- overall completion and whether you're **ahead / on / behind plan**,
- a **14-day activity sparkline**,
- your **level, XP, and momentum %**.

### 5. Activity heatmap & streak

The GitHub-style **heatmap** colors each day by how much you did. Your **current streak** (with a one-day grace window so a single off-day doesn't reset you) and **longest streak** are computed from real `checkedAt` history. There's a **"Share progress ↗"** button right there.

### 6. Command palette (⌘K / Ctrl+K)

Press **⌘K** (macOS) or **Ctrl+K** (Windows/Linux) to fuzzy-search **all ~106 items** across every phase, week, and topic, then jump straight to the section. Fully keyboard-operable. Press **Escape** to close.

### 7. Keyboard shortcuts (⌘? / Ctrl+?)

Press **⌘?** or **Ctrl+?** (also **/**) to open a cheatsheet of every shortcut. Escape closes it.

### 7b. Revision & skip (with caution)

In the header, click **"Revision & skip"**. Unifies walks you through everything you haven't checked off yet. If you're *genuinely* confident you've already mastered an item, click **"I know this — skip"**. A **caution dialog** appears first, making clear that skipped items:

- leave your active tracker and your streak,
- are **not** counted toward completion,
- won't be surfaced for practice or testing,
- should only be skipped if you truly know them.

If you're unsure, just keep the item — checking it later is always safer than skipping something you half-know. You can **restore** any skipped item anytime.

### 8. Theme

Use the **sun/moon toggle** in the header to switch light/dark, or choose **system** to follow your OS. The app respects `prefers-reduced-motion`.

### 9. Share & compare (optional)

- Click **Share progress** (in the heatmap or Share panel) to publish a snapshot and get a `?u=<handle>` link you can send to anyone — it opens a **read-only** profile, no login needed.
- The **Leaderboard** ranks top streaks and is filterable by track (all / core / DSA).
- In **guest mode** this uses your browser's local cache; in **account mode** it syncs across devices via Supabase.

### 10. Account mode (optional, cloud sync)

If a Supabase project is configured (see setup below), click **Sign in with Google** to:

- sync progress per-account across devices,
- unlock the **Admin panel** (admins only) to edit the live curriculum and manage accounts,
- make your shared profile visible to others automatically.

Without it, the app runs fully in **guest mode** — your data stays in your browser.

### 11. Notifications (optional)

Opt in to browser notifications for a gentle **weekly-goal reminder**. It's a single, non-spammy nudge — you can disable it anytime from the header.

### 12. Import / export your data

- **Export** your real progress as **JSON** or **CSV** (header menu).
- **Import** a previously exported JSON to migrate devices or back up. There's no lock-in.

### 13. Install as an app (PWA)

The app is installable — on desktop click the browser's install icon (or menu → "Install app"); on mobile use "Add to Home Screen". It works **offline** for the app shell and **queues your checkboxes** while disconnected, flushing them the moment you're back online (with a visible "Saving… / Saved ✓ / offline" status).

### 14. Accessibility

- A **skip-to-content** link, visible focus rings, ARIA roles on modals, and focus traps keep it usable by keyboard and screen readers.
- All celebratory animations honor `prefers-reduced-motion`.

---

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
# Optional — account mode (leave blank to run in guest mode)
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Optional — Unifies AI analysis (serverless function only; never sent to browser)
# Get a FREE key at https://openrouter.ai/keys (no cost on the free models).
OPENROUTER_API_KEY=sk-or-...
```

Without `OPENROUTER_API_KEY`, the app still works: the `/api/analyze` function
returns 501 and the frontend uses its built-in **offline planner** instead of an LLM.

Restart `npm run dev` after editing this file.

### 3. Create the database tables

In the Supabase dashboard, go to **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:

- `profiles` — one row per account (email, display name, `is_admin` flag)
- `curriculum` — a single editable row holding the *default* topic tree, editable by admins (the Admin Panel edits this)
- `progress` — one row per account holding their checked items, start date, their **own uploaded plan** (`curriculum_json`), and revision skips (`skipped`)

All tables have row-level security enabled: users can only read/write their own data, admins can read/write everyone's.

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

## Deploy to a static host (Vercel or Netlify)

The app is a **pure static SPA** built by Vite into the `dist/` folder — no server
runtime, no API routes of its own. Both Vercel and Netlify host it for **free** on
their static tiers. The only "backend" you might wire up is an optional Supabase
project for account mode (cloud sync + shared profiles); without it the app runs
fully in **guest mode** and needs zero configuration.

> **Offline / PWA note:** the build emits a service worker (`sw.js`) and a web
> app manifest. Both hosts serve them automatically from `dist/`. To install the
> app, the page must be served over HTTPS (both hosts do this by default) and
> visited at least once so the SW can register.

### Shared prerequisites (do these once, whichever host)

1. **Build locally to confirm it works:**
   ```bash
   npm install
   npm run build
   # -> outputs to dist/
   ```
2. **(Only if using account mode)** have your Supabase **Project URL** and
   **anon public key** ready (from Supabase Dashboard → Project Settings → API).
   You'll paste them into the host's environment-variable UI next.
3. **(Only if using account mode)** after you know your production URL, add it to
   Supabase **Authentication → URL Configuration → Redirect URLs** (and Site URL),
   or Google sign-in will fail in production.

---

### Option A — Vercel

Vercel auto-detects Vite, and this repo also ships a [`vercel.json`](./vercel.json)
that pins the build settings + SPA fallback + security headers, so you mostly just
click through.

**A1. Deploy via the dashboard (recommended for first-timers):**
1. Push the repo to GitHub (see "Push to GitHub" below).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** →
   select this repo.
3. Vercel fills in the preset: **Framework Preset = Vite**, **Build Command =
   `npm run build`**, **Output Directory = `dist`**. (The `vercel.json` already
   declares these, so they'll match.)
4. **Environment Variables** (all optional — the app runs without any):
   - `VITE_SUPABASE_URL` = `https://YOUR-REF.supabase.co` (account mode)
   - `VITE_SUPABASE_ANON_KEY` = your anon key (account mode)
   - `OPENROUTER_API_KEY` = your free OpenRouter key (enables the AI analyzer; without it, the offline planner is used)
   - `OPENROUTER_MODEL` = *(optional)* override the free model, e.g. `meta-llama/llama-3.1-8b-instruct:free`
   Add them under **Project → Settings → Environment Variables**. Set them for
   **Production, Preview, and Development** so both the live site and preview
   deploys get them.
5. Click **Deploy**. After it finishes you get a `*.vercel.app` URL; you can later
   add a custom domain under **Project → Domains**.

**A2. Deploy via CLI:**
```bash
npm install -g vercel
vercel login
vercel            # first run: links the project, uses vercel.json
vercel --prod     # promote to production
# Add env vars non-interactively:
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add OPENROUTER_API_KEY production
```

**A3. SPA routing & headers.** `vercel.json` already contains:
- a `rewrites` rule sending every path to `index.html` (so the `?u=<handle>`
  shared-profile deep links and browser refreshes work),
- `Cache-Control: immutable` for `/assets/*` (hashed bundles) and `no-cache` for
  `sw.js` (so updates roll out promptly),
- baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`).

**A4. Preview deployments.** Every push to a non-`main` branch (or every PR) gets
its own preview URL automatically — great for reviewing changes before merge.

---

### Option B — Netlify

This repo ships a [`netlify.toml`](./netlify.toml) **and** a `public/_redirects`
file, both declaring the SPA fallback + headers, so Netlify "just works."

**B1. Deploy via the dashboard:**
1. Push the repo to GitHub.
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → select this repo.
3. **Build command = `npm run build`**, **Publish directory = `dist`**.
   (`netlify.toml` already sets these, so they'll be pre-filled.)
4. **Environment variables** (all optional): **Site configuration →
   Environment variables → Add a variable** for `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, and optionally
   `OPENROUTER_MODEL` (override the free model). Set the value for **all
   deploy contexts** (Production, Deploy Previews, Branch deploys).
5. Click **Deploy site**. You get a `*.netlify.app` URL; add a custom domain under
   **Domain settings**.

**B2. Deploy via CLI:**
```bash
npm install -g netlify-cli
npm run build
netlify login
netlify deploy --prod --dir=dist
# Env vars:
netlify env:set VITE_SUPABASE_URL "https://YOUR-REF.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
netlify env:set OPENROUTER_API_KEY "sk-or-..."
```

**B3. SPA routing & headers.** Two safeguards exist:
- `netlify.toml` `[[redirects]]` rule: `/*  ->  /index.html  200` (SPA fallback),
- `public/_redirects` (copied into `dist/`) as a belt-and-suspenders fallback.
Both guarantee that refreshing on `/?u=someone` or any deep link serves the app.

---

### Post-deploy checklist (account mode only)

- [ ] `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set in the host's env UI.
- [ ] The production URL is added to Supabase **Authentication → URL
      Configuration → Redirect URLs** (and Site URL).
- [ ] Google provider enabled in Supabase (see "Setting up accounts" above).
- [ ] Visit the live URL, click **Sign in with Google**, and confirm you land back
      on the app (not an error).
- [ ] Open the live URL in an incognito window and confirm guest mode works with no
      env vars (it always should).

### Guest mode (no Supabase) — fully supported

If you deploy **without** setting the two `VITE_SUPABASE_*` variables, the app
detects the missing config and runs entirely client-side: progress is stored in
`localStorage`, sharing uses the browser's local cache, and there's no sign-in.
This is the zero-cost, zero-config path and is perfectly fine for a portfolio demo.

## Continuous Integration & Deployment

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on every push/PR to
`main`:

- **test** — runs `npm run test:coverage` (Vitest + coverage) and commits the
  regenerated README status block back to `main` with `[skip ci]`.
- **e2e** — installs Playwright browsers and runs the Playwright suite against
  `npm run preview`.
- **build** — `npm run build` and uploads `dist/` as an artifact.
- **deploy** — only on push to `main` (not PRs), publishes `dist/` to **GitHub
  Pages** under `https://<user>.github.io/<repo>/`.

**Optional CI secrets** (Settings → Secrets and variables → Actions):
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. If set, CI builds against a real
project; if absent, the build still succeeds (guest mode). CI **never** receives
the service-role key.

> **Want Vercel/Netlify to deploy on push instead of GitHub Pages?** Either
> connect the repo in their dashboard (they auto-build on push), or replace the
> `deploy` job in `ci.yml` with a provider-specific action (e.g.
> `amondnet/vercel-action` or `nwtgck/actions-netlify`). The current file targets
> GitHub Pages so there's no vendor lock-in.

### Project Structure

```
unifies.codes/
├─ index.html                 # Vite entry, app title/favicon/theme-color
├─ vite.config.js             # React + VitePWA + Vitest config
├─ vercel.json                # Vercel build + SPA rewrite + headers + function
├─ netlify.toml               # Netlify build + SPA redirect + headers + function
├─ api/analyze.js             # Vercel serverless AI analyzer (OpenRouter free model)
├─ netlify/functions/analyze.js  # Netlify equivalent
├─ .env.example               # documents VITE_SUPABASE_* + OPENROUTER_API_KEY
├─ public/
│  ├─ icon.svg / favicon.svg  # PWA + tab icons (Unifies "U" mark)
│  └─ _redirects              # Netlify SPA fallback (copied to dist/)
├─ src/
│  ├─ main.jsx                # Auth + Toast providers
│  ├─ App.jsx                 # orchestrator: import gate, save machine, ⌘K/⌘?
│  ├─ data/curriculum.js      # generic curriculum model + FAANG/FDE sample
│  ├─ utils/                  # analyze (AI + heuristic), progressStats, share, io
│  ├─ hooks/                  # useTheme, useNotifications, useFocusTrap
│  ├─ components/             # CurriculumImport, RevisionView, Highlights,
│  │                          #   FocusView, Insights, ActivityHeatmap,
│  │                          #   CommandPalette, SharePanel, ShortcutsHelp, Toast
│  └─ *.test.js / *.test.jsx  # colocated unit + component tests
├─ e2e/                       # Playwright specs (import, palette, share, ux)
├─ docs/COMPETITIVE_REQUIREMENTS.md
├─ supabase/schema.sql        # profiles + progress (with curriculum_json, skipped)
```

## Notes

- In guest mode, progress is stored in the visitor's own browser (`localStorage`), scoped to whatever domain you deploy this to. Clearing browser data or switching browsers/devices resets it.
- In account mode, progress is stored per-account in Supabase Postgres and synced on every change (debounced ~500ms).
- Every resource link points to real, official documentation or well-known free resources (official docs sites, Real Python, LangChain/LangGraph docs, LeetCode/Codeforces/HackerRank, etc.) — nothing invented.
- To customize the bundled default curriculum (used before any admin edits are saved, and as the guest-mode content), edit the `DEFAULT_PHASES`, `DEFAULT_BONUS`, and `DEFAULT_PARALLEL_TRACK` arrays in `src/data/curriculum.js`. The same module exports `allItems`, the flat index the command palette searches.

## Tests

The progress-stat logic (counts, percentages, streaks, heatmap aggregation) is pure and unit-tested with [Vitest](https://vitest.dev):

```bash
npm test            # run the unit suite once
npm run test:watch  # watch mode
npm run test:coverage # unit suite + coverage report (text/json/html)
```

Tests live next to the code they cover (`src/utils/*.test.js`, `src/data/*.test.js`, `src/hooks/*.test.js`, `src/components/*.test.js`, `src/*.test.js`) and run in a `jsdom` environment. The pure progress-stat logic modules (`progressStats.js`, `curriculum.js`, `share.js`, `io.js`) are at or near 100% line coverage; the overall project coverage (including React components) is reported by the auto-generated status block above.

End-to-end tests cover the command palette, share flow, theme, and the UX surfaces (Focus view, Insights, shortcuts help, PWA manifest, celebrations) with [Playwright](https://playwright.dev):

```bash
npx playwright install chromium   # one-time browser download
npm run e2e                       # run against a production preview build
```

## Continuous Integration & Deployment

`.github/workflows/ci.yml` runs on every push/PR:
- **test** — Vitest unit suite **with coverage** (report uploaded as an artifact)
- **e2e** — Playwright suite against a production preview build
- **build** — produces the deployable `dist/` artifact
- **deploy** — on pushes to `main` only, publishes `dist/` to **GitHub Pages** automatically

So a broken build or a regressed command palette fails CI before it reaches `main`, and a green `main` ships to the live site on its own.

### Enable GitHub Pages (one time)
Repo **Settings → Pages → Build and deployment → Source: "GitHub Actions"**. The `deploy` job handles the rest. Note: the SPA fallback (`dist/404.html`) is generated automatically by the `postbuild` script so `?u=` share links and deep links work.
