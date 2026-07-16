// Thin wrapper that creates the Supabase client synchronously. Config is
// resolved in priority order: runtime override (set by initRuntimeConfig) ->
// build-time VITE_ env -> committed public fallback. The anon key is public by
// design (it ships in the client bundle regardless), so a committed fallback
// guarantees sign-in works with zero host-env setup. If the key/url is invalid
// we still create the client (Supabase handles bad creds gracefully) but guard
// so a crash never blanks the app.
import { createClient } from "@supabase/supabase-js";
import { FALLBACK_CONFIG, getRuntimeConfig } from "./runtimeConfig";

const cfg = getRuntimeConfig() || FALLBACK_CONFIG;

export const isSupabaseConfigured = !!(cfg && cfg.url && cfg.key);

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(cfg.url, cfg.key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (e) {
    console.warn("Supabase client init failed; running in guest mode.", e);
    supabase = null;
  }
}

export { supabase };
