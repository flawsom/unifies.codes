// Resolves Supabase config at runtime so the app works even when the
// VITE_* build-time vars are missing. Resolution order:
//   1) build-time env (import.meta.env.VITE_SUPABASE_*)
//   2) runtime /api/analyze endpoint (host server env, no VITE_ prefix needed)
//   3) committed fallback (the public anon key — safe to ship in the client)
// The anon key is public by design (it's shipped in the bundle regardless),
// so a committed fallback guarantees sign-in works without host env setup.
const FALLBACK = {
  url: "https://smggxiugcqwfjqtynlnc.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ2d4aXVnY3F3ZmpxdHlubG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzQ4MTMsImV4cCI6MjA5OTc1MDgxM30.p8sqoW_zPnHopPuQE4W_3_o9ONon4i9GZ1UTRkTZUsU",
};

let _resolved = null;

export function getRuntimeConfig() {
  if (_resolved) return _resolved;
  const rt = typeof window !== "undefined" ? window.__UNIFIES_CONFIG__ : null;
  return rt || null;
}

export async function initRuntimeConfig() {
  // 1) build-time env (preferred)
  const fromEnv = {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
  if (fromEnv.url && fromEnv.key) {
    _resolved = fromEnv;
    if (typeof window !== "undefined") window.__UNIFIES_CONFIG__ = fromEnv;
    return _resolved;
  }
  // 2) runtime endpoint (host server env — survives deploys/config changes)
  try {
    const res = await fetch("/api/analyze", { headers: { accept: "application/json" } });
    if (res.ok) {
      const d = await res.json();
      if (d && d.url && d.key) {
        _resolved = { url: d.url, key: d.key };
        if (typeof window !== "undefined") window.__UNIFIES_CONFIG__ = _resolved;
        return _resolved;
      }
    }
  } catch (e) {
    console.warn("runtime config fetch failed; using committed fallback", e);
  }
  // 3) committed public fallback
  _resolved = FALLBACK;
  if (typeof window !== "undefined") window.__UNIFIES_CONFIG__ = _resolved;
  return _resolved;
}

