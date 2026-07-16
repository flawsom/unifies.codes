// api/runtime-config.js — Vercel serverless function
// Returns public Supabase config to the browser at runtime so the app can pick
// up host env vars (SUPABASE_URL / SUPABASE_ANON_KEY, with or without VITE_
// prefix) without requiring a rebuild.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).json({
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    key: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
  });
}
