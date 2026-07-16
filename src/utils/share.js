// Resolves / publishes a public share profile for the `?u=<username>` link.
// Uses the single `profiles` table (username is the unique public handle).
// All reads are public (RLS); writes require the owner (auth.uid() = id).
// No demo/seed data is ever inserted — snapshots come only from real users.
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const SHARED_KEY = "fde-tracker-shared-v1";

// Build a live snapshot from the user's real progress. Pure — no I/O.
export function buildSnapshot({ checked, checkedAt, corePct, dsaPct, xp }) {
  return { checked, checkedAt, corePct, dsaPct, xp: xp || 0 };
}

// Read a shared profile by handle. Tries Supabase first (works for anyone,
// anywhere), then the local cache (so links still resolve offline).
export async function resolveSharedUser(username) {
  if (!username) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, snapshot")
        .eq("username", username)
        .maybeSingle();
      if (data?.snapshot) {
        return {
          username: data.username,
          displayName: data.display_name,
          ...data.snapshot,
        };
      }
    } catch {
      // fall through to local cache
    }
  }

  try {
    const raw = localStorage.getItem(SHARED_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      if (all[username]) {
        return { username, ...all[username] };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Publish the current user's snapshot under a handle. Persists locally (always
// works offline) and upserts to Supabase `profiles` so the link works globally.
// `userId` is required for the Supabase write (owner check via RLS).
export async function publishShare({ username, userId, displayName, snapshot }) {
  // Local cache (offline-safe).
  try {
    const raw = localStorage.getItem(SHARED_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[username] = { displayName, ...snapshot };
    localStorage.setItem(SHARED_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase
        .from("profiles")
        .upsert(
          { id: userId, username, display_name: displayName, snapshot },
          { onConflict: "id" }
        );
    } catch {
      // local cache still works
    }
  }

  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?u=${encodeURIComponent(username)}`;
}
