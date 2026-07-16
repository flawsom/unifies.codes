// src/lib/supabaseClient.js
// Thin wrapper that creates the Supabase client ONLY when both env vars exist.
// If they're missing OR invalid, we degrade to guest mode (null client) instead
// of throwing — so a misconfiguration never blanks the whole app.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
