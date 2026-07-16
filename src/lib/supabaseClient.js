// Thin wrapper that creates the Supabase client ONLY when both env vars exist.
// If they're missing OR invalid, we degrade to guest mode (null client) instead
// of throwing — so a misconfiguration never blanks the whole app. Config is
// resolved at runtime (build-time VITE_ vars or a /api/config host endpoint).
import { createClient } from "@supabase/supabase-js";
import { getRuntimeConfig } from "./runtimeConfig";

const _rt = typeof window !== "undefined" ? window.__UNIFIES_CONFIG__ : null;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (_rt && _rt.url);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (_rt && _rt.key);

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (e) {
    // Bad key/url: fall back to guest mode rather than crashing the app.
    console.warn("Supabase client init failed; running in guest mode.", e);
    supabase = null;
  }
}

export { supabase };
