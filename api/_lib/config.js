// api/_lib/config.js
// Returns public Supabase config to the browser at runtime. This lets the app
// pick up the host's environment variables (SUPABASE_URL / SUPABASE_ANON_KEY,
// with or without the VITE_ prefix) WITHOUT requiring a rebuild — so adding or
// fixing the keys in the host dashboard takes effect on the next page load.
export function getPublicConfig() {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  return {
    url,
    key,
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
  };
}
