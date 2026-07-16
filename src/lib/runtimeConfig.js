// Resolves Supabase config. The synchronous FALLBACK_CONFIG guarantees the app
// is configured at module-load time (sign-in works with no host env setup).
// initRuntimeConfig() may later upgrade to build-time env or a /api/analyze
// endpoint value if the host provides one. The anon key is public by design.
export const FALLBACK_CONFIG = {
  url: "https://smggxiugcqwfjqtynlnc.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ2d4aXVnY3F3ZmpxdHlubG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzQ4MTMsImV4cCI6MjA5OTc1MDgxM30.p8sqoW_zPnHopPuQE4W_3_o9ONon4i9GZ1UTRkTZUsU",
};

let _override = null;

export function getRuntimeConfig() {
  if (_override) return _override;
  const rt = typeof window !== "undefined" ? window.__UNIFIES_CONFIG__ : null;
  return rt || FALLBACK_CONFIG;
}

// Optional upgrade path: if the host sets VITE_ vars or a /api/analyze endpoint,
// prefer those over the committed fallback.
export async function initRuntimeConfig() {
  const fromEnv = {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
  if (fromEnv.url && fromEnv.key) {
    _override = fromEnv;
    if (typeof window !== "undefined") window.__UNIFIES_CONFIG__ = fromEnv;
    return _override;
  }
  try {
    const res = await fetch("/api/analyze", { headers: { accept: "application/json" } });
    if (res.ok) {
      const d = await res.json();
      if (d && d.url && d.key) {
        _override = { url: d.url, key: d.key };
        if (typeof window !== "undefined") window.__UNIFIES_CONFIG__ = _override;
        return _override;
      }
    }
  } catch (e) {
    console.warn("runtime config fetch failed; using committed fallback", e);
  }
  return FALLBACK_CONFIG;
}
