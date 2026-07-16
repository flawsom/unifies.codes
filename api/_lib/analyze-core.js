// api/_lib/analyze-core.js
// Shared analyzer logic used by both Vercel (api/analyze.js) and Netlify
// (netlify/functions/analyze.js). Calls a FREE OpenRouter model and returns
// strict JSON. If no API key is configured, returns 501 so the frontend falls
// back to its offline heuristic planner.

const FREE_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-2-9b-it:free";

const SYSTEM_PROMPT = `You are Unifies, an expert curriculum architect.
Given a user's raw curriculum text (a syllabus, job description, or study plan),
return ONLY strict JSON with this exact shape and no prose:

{
  "title": string,
  "phases": [ { "id": string, "title": string } ],
  "items": [
    {
      "id": string,
      "title": string,
      "phaseId": string,        // must match a phase id above
      "week": number | null,
      "difficulty": "basic" | "intermediate" | "advanced",
      "source": "user" | "app", // "app" only for things Unifies adds
      "track": "core" | "dsa" | "bonus",
      "milestone": boolean,
      "note": string
    }
  ],
  "included": string,  // one sentence: what the user's curriculum already covered
  "added": string,     // one sentence: what Unifies added (foundations + advanced gaps)
  "path": string[]     // ordered recommended focus areas
}

Rules:
- Keep EVERY item the user wrote (source:"user"). Do not drop or rewrite their meaning.
- If the curriculum is missing absolute basics for a beginner, ADD foundational
  items (source:"app", difficulty:"basic", track:"core") in a "Foundations" phase.
- If it is missing advanced / staff-level depth, ADD items (source:"app",
  difficulty:"advanced", track:"bonus") in a "Beyond mastery" phase.
- Infer difficulty from keywords. Put deliberate practice / LeetCode-style work in
  track:"dsa" when relevant.
- Return valid JSON only. No markdown fences.`;

/**
 * @param {{text:string}} body
 * @param {{getKey:()=>string|undefined}} env
 */
export async function runAnalyze(body, env) {
  const key = env.getEnv ? env.getEnv("OPENROUTER_API_KEY") : process.env.OPENROUTER_API_KEY;
  if (!key) {
    return { status: 501, json: { error: "no_key", message: "AI not configured" } };
  }
  const text = (body && body.text) || "";
  if (!text.trim()) {
    return { status: 400, json: { error: "empty" } };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://unifies.codes",
        "X-Title": "Unifies",
      },
      body: JSON.stringify({
        model: FREE_MODEL,
        stream: false,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, 12000) },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { status: 502, json: { error: "upstream", status: res.status, detail: errText.slice(0, 200) } };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    // Strip accidental code fences if the model added them.
    const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.items)) {
      return { status: 502, json: { error: "bad_shape" } };
    }
    return { status: 200, json: parsed };
  } catch (e) {
    return { status: 502, json: { error: "analyze_failed", message: String(e && e.message || e) } };
  } finally {
    clearTimeout(t);
  }
}
