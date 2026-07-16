// Resolves Supabase config at runtime so the app works even when the
// VITE_* build-time vars are missing or set after deploy. It tries the
// build-time env first, then falls back to a serverless /api/config
// endpoint that reads the host's server env (no VITE_ prefix required).
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
    const res = await fetch("/api/runtime-config", { headers: { accept: "application/json" } });
    if (res.ok) {
      const d = await res.json();
      if (d && d.url && d.key) {
        _resolved = { url: d.url, key: d.key };
        if (typeof window !== "undefined") window.__UNIFIES_CONFIG__ = _resolved;
        return _resolved;
      }
    }
  } catch (e) {
    console.warn("runtime config fetch failed; guest mode", e);
  }
  _resolved = null;
  return null;
}
