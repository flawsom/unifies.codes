// netlify/functions/analyze.js — Netlify serverless function
import { runAnalyze } from "../../api/_lib/analyze-core.js";

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

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "method" }) };
  }
  const ip = (event.headers["x-forwarded-for"] || "anon").split(",")[0].trim();
  if (rateLimited(ip)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: "rate_limit", message: "Too many requests — try the offline planner in a moment." }),
    };
  }
  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "bad_json" }) };
  }
  const { status, json } = await runAnalyze(body, { getEnv: (k) => process.env[k] });
  return { statusCode: status, body: JSON.stringify(json) };
}
