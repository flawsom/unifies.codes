-- ============================================================================
-- FDE Deployment Tracker — Supabase schema
-- Run this once in your Supabase project's SQL editor (or via `supabase db push`).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per account, auto-created when someone signs in
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone can read their own profile; admins can read all profiles.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Only admins can update profiles (e.g. to grant/revoke admin).
create policy "profiles_update_admin_only"
  on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Auto-create a profile row whenever a new auth user signs up (e.g. via Google OAuth).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- curriculum: a single editable row holding the whole topic tree (phases,
-- bonus track, DSA parallel track) as JSON. Readable by everyone (including
-- guests), writable only by admins.
-- ---------------------------------------------------------------------------
create table if not exists public.curriculum (
  id int primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint curriculum_singleton check (id = 1)
);

alter table public.curriculum enable row level security;

create policy "curriculum_select_anyone"
  on public.curriculum for select
  using (true);

create policy "curriculum_upsert_admin_only"
  on public.curriculum for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "curriculum_update_admin_only"
  on public.curriculum for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ---------------------------------------------------------------------------
-- progress: one row per account holding their checked items + mission start date.
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  checked jsonb not null default '{}'::jsonb,
  start_date text default '',
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "progress_select_own_or_admin"
  on public.progress for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "progress_insert_own_or_admin"
  on public.progress for insert
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "progress_update_own_or_admin"
  on public.progress for update
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "progress_delete_own_or_admin"
  on public.progress for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------------------------------------------------------------------------
-- After running this file:
-- 1. Sign in to the app once with the Google account you want as the admin.
-- 2. In the SQL editor, run:
--      update public.profiles set is_admin = true where email = 'you@example.com';
-- 3. (Optional) Seed the curriculum row with the app's bundled default the
--    first time you open the Admin Panel → Topics tab → "Save curriculum".
-- ============================================================================
