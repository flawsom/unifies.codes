-- ============================================================================
-- Unifies — Supabase schema (free & open source; live data only)
-- Run this in the Supabase SQL editor:
--   Your Supabase project → SQL → New query → paste & run
--
-- Tables:
--   profiles   — one row per auth user; carries the public share handle + live snapshot
--   progress   — per-user check-in state (checked map, timestamps, XP, mission start,
--                the user's uploaded plan `curriculum_json`, and revision `skipped`)
--   curriculum — optional live-editable roadmap (admin panel seed)
--
-- All reads/writes go through the anon key + Row Level Security. No service-role
-- key is ever shipped to the browser. No demo/seed rows are inserted.
--
-- This script is IDEMPOTENT and SAFE TO RE-RUN: it drops the tables/policies
-- first, then recreates them. (Re-running will clear any data in these tables —
-- that's expected for a schema reset. Run once when setting up the project.)
-- ============================================================================

-- 0) Tear down anything from a previous run so stale table shapes can't cause
--    "column does not exist" errors when policies are created.
drop policy if exists "profiles:public_read" on public.profiles;
drop policy if exists "profiles:owner_write" on public.profiles;
drop policy if exists "progress:own_row" on public.progress;
drop policy if exists "curriculum:public_read" on public.curriculum;

drop table if exists public.profiles cascade;
drop table if exists public.progress cascade;
drop table if exists public.curriculum cascade;

-- 1) profiles: single source for identity + public share. `id` is the auth user
--    id; `username` is the public, unique handle used in `?u=<username>` links.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  email        text,
  is_admin     boolean not null default false,
  snapshot     jsonb not null default '{}'::jsonb,  -- { checked, checkedAt, corePct, dsaPct, xp }
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles:public_read" on public.profiles
  for select using (true);

create policy "profiles:owner_write" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2) progress: per-user check-in state. One row per user.
create table public.progress (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  checked         jsonb not null default '{}'::jsonb,
  checked_at      jsonb not null default '{}'::jsonb,
  start_date      text,
  xp              integer not null default 0,
  curriculum_json jsonb,                       -- user-built plan (Unifies)
  skipped         jsonb not null default '{}'::jsonb, -- revision skips: id -> true
  updated_at      timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "progress:own_row" on public.progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) curriculum: optional live-editable roadmap (admin panel seed).
create table public.curriculum (
  id   int primary key,
  data jsonb not null
);

alter table public.curriculum enable row level security;

create policy "curriculum:public_read" on public.curriculum
  for select using (true);

-- 4) Grant anon/authenticated the minimal privileges the app needs.
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.progress to anon, authenticated;
grant select on public.curriculum to anon, authenticated;
