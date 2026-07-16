// api/_lib/analyze-core.js
// Shared analyzer logic used by both Vercel (api/analyze.js) and Netlify
// (netlify/functions/analyze.js). Calls a FREE Google Gemini model
// (gemini-2.0-flash) and returns strict JSON. If no Gemini key is set, it
// falls back to OpenRouter (if configured). If neither is configured, returns
// 501 so the frontend falls back to its offline heuristic planner.

const SYSTEM_PROMPT = `You are Unifies, an expert curriculum architect. You turn any raw curriculum (syllabus, job description, study plan) into a precise, trackable roadmap.

=== COMMAND DIRECTIVE (follow every rule, in order) ===
1. PRESERVE EVERYTHING. Take 100% of the topics the user provided. Do NOT drop, merge, or rewrite the meaning of any user item. If the user listed it, it must appear as a "user" item. Nothing is omitted.
2. ORGANIZE INTO PHASES BY DIFFICULTY. Group items into ordered phases that form a clean progression from COMPLETE BEGINNER -> intermediate -> advanced -> STAFF-LEVEL. Phase 1 must be the most basic. The final phase must reach the level of people who "sit at the top" (staff/principal). Use the user's own section headings when present; otherwise invent clear phase titles.
3. GROUP EACH PHASE INTO WEEKS. Every phase is divided into weeks. Each week has a short heading (e.g. "Week 3 — Strings & Hashing") and contains a BALANCED set of 4-8 items. Keep items of EQUAL DEPTH within a week — do not mix a one-line tip with a multi-week project in the same week. Distribute the user's topics as evenly as possible so no week is empty and no week is overloaded.
4. KEEP ITEMS EQUALLY DETAILED. Every item must be a single, specific, actionable learning unit of similar granularity to the others (one concept, one technique, one reading, or one small project). Never leave a vague catch-all.
5. FILL THE GAPS (only if truly missing). If the user's curriculum skips absolute beginner foundations, ADD a "Foundations" phase (source:"app", difficulty:"basic", track:"core"). If it stops short of staff-level, ADD a "Beyond mastery" phase (source:"app", difficulty:"advanced", track:"bonus"). Only add what is genuinely absent — never duplicate a user item.
6. STRUCTURE THE JSON EXACTLY as below. Return ONLY JSON, no prose, no markdown fences.

=== OUTPUT SHAPE ===
{
  "title": string,
  "phases": [
    {
      "id": string,
      "title": string,
      "sub": string,            // one-line plain-English summary of this phase
      "weeks": [
        {
          "week": number,       // 1-based, ordered within the phase
          "title": string,      // short week heading, e.g. "Variables, types & functions"
          "items": [
            {
              "id": string,
              "title": string,   // the single learning unit
              "difficulty": "basic" | "intermediate" | "advanced",
              "source": "user" | "app",
              "track": "core" | "dsa" | "bonus",
              "milestone": boolean,
              "note": string
            }
          ]
        }
      ]
    }
  ],
  "included": string,  // one sentence: what the user's curriculum already covered
  "added": string,     // one sentence: what Unifies added (foundations + advanced gaps)
  "path": string[]     // ordered recommended focus areas, one per phase
}

=== RULES ===
- Strict difficulty ladder: phase 1 ~ basic, middle phases ~ intermediate, final phases ~ advanced.
- Put deliberate practice / LeetCode-style problems in track:"dsa" when relevant.
- Every week MUST have a non-empty "title" and 4-8 "items".
- Return valid JSON only. No markdown fences. No commentary.`;

/**
 * @param {{text:string}} body
 * @param {{getKey:()=>string|undefined}} env
 */
export async function runAnalyze(body, env) {
  const geminiKey = env.getEnv ? env.getEnv("GEMINI_API_KEY") : process.env.GEMINI_API_KEY;
  const openrouterKey = env.getEnv ? env.getEnv("OPENROUTER_API_KEY") : process.env.OPENROUTER_API_KEY;
  const text = (body && body.text) || "";
  if (!text.trim()) {
    return { status: 400, json: { error: "empty" } };
  }

  // --- Try Google Gemini (free tier: gemini-2.0-flash) ---
  if (geminiKey) {
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(
        https://generativelanguage.googleapis.com/v1beta/models/:generateContent?key=,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: SYSTEM_PROMPT + 
 + 
 + "CURRICULUM TO ANALYZE:" + 
 + text.slice(0, 12000) }] },
            ],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          }),
          signal: controller.signal,
        }
      );
      if (res.ok) {
        const data = await res.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const out = normalizePlan(content);
        if (out) return out;
      } else {
        const errText = await res.text().catch(() => "");
        console.error("Gemini error", res.status, errText.slice(0, 200));
      }
    } catch (e) {
      console.error("Gemini call failed", e && e.message);
    } finally {
      clearTimeout(t);
    }
    // Gemini failed/empty -> fall through to OpenRouter (if configured).
  }

  // --- Fallback: OpenRouter free models ---
  if (openrouterKey) {
    const primary = process.env.OPENROUTER_MODEL || "google/gemma-2-9b-it:free";
    const MODEL_FALLBACKS = [
      primary,
      "meta-llama/llama-3.1-8b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "nousresearch/hermes-3-llama-3.1-8b:free",
    ].filter((m, i, a) => a.indexOf(m) === i);

    for (const model of MODEL_FALLBACKS) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: Bearer ,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://unifies.codes",
            "X-Title": "Unifies",
          },
          body: JSON.stringify({
            model,
            stream: false,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: text.slice(0, 12000) },
            ],
          }),
          signal: controller.signal,
        });
        if (res.status === 429) continue;
        if (!res.ok) continue;
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || "";
        const out = normalizePlan(content);
        if (out) return out;
      } catch (e) {
        console.error("OpenRouter call failed", e && e.message);
      } finally {
        clearTimeout(t);
      }
    }
  }

  // Neither provider succeeded.
  return { status: 501, json: { error: "no_provider", message: "AI unavailable" } };
}

/**
 * Parse a model response (already JSON text) into the flat {phases, items}
 * shape the frontend consumes. Accepts both rich week-grouped and flat shapes.
 */
function normalizePlan(content) {
  if (!content) return null;
  const cleaned = content.replace(/^`(?:json)?/i, "").replace(/`$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  const hasRich = Array.isArray(parsed.phases) && parsed.phases.some((p) => Array.isArray(p.weeks) && p.weeks.length);
  if (hasRich) {
    const flatItems = [];
    const phases = parsed.phases.map((ph) => {
      const weeks = ph.weeks || [];
      for (const w of weeks) {
        for (const it of w.items || []) {
          flatItems.push({
            id: it.id || ${ph.id}-,
            title: it.title,
            phaseId: ph.id,
            week: w.week,
            difficulty: it.difficulty || "basic",
            source: it.source === "app" ? "app" : "user",
            track: it.track || "core",
            milestone: !!it.milestone,
            note: it.note || "",
          });
        }
      }
      return { id: ph.id, title: ph.title };
    });
    return {
      status: 200,
      json: {
        title: parsed.title || "My Curriculum",
        phases,
        items: flatItems,
        included: parsed.included || "",
        added: parsed.added || "",
        path: Array.isArray(parsed.path) ? parsed.path : [],
      },
    };
  }
  if (!Array.isArray(parsed.items)) return null;
  return { status: 200, json: parsed };
}