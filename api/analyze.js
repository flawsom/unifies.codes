// api/analyze.js  — Vercel serverless function
import { runAnalyze } from "./_lib/analyze-core.js";

// Tiny in-memory rate limiter (per IP). Serverless instances are ephemeral, so
// this is a best-effort guard, not a hard guarantee — pair with the host's own
// rate limiting for production. 8 requests / 10 minutes per IP.
const hits = new Map();
const WINDOW = 10 * 60 * 1000;
const MAX = 8;

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX;
}

export default async function handler(req, res) {
  // GET returns public runtime config (Supabase URL/key from host env, with or
  // without the VITE_ prefix) so the SPA can enable sign-in without a rebuild.
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).json({
      url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
      key: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
      hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method" });
    return;
  }
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "anon";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate_limit", message: "Too many requests — try the offline planner in a moment." });
    return;
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { status, json } = await runAnalyze(body, { getEnv: (k) => process.env[k] });
  res.status(status).json(json);
}
