// api/_lib/analyze-core.js
// Shared analyzer logic used by both Vercel (api/analyze.js) and Netlify
// (netlify/functions/analyze.js). Calls a FREE Google Gemini model
// (gemini-2.0-flash) and returns strict JSON. If no Gemini key is set, it
// falls back to OpenRouter (if configured). If neither is configured, returns
// 501 so the frontend falls back to its offline heuristic planner.

const SYSTEM_PROMPT = `You are Unifies, a curriculum architect. You do NOT summarize a syllabus - you RE-ENGINEER it into a fully leveled, evenly-distributed, week-by-week learning path from COMPLETE BEGINNER to MASTERY/top-level, using ONLY the material the user provides, restructured for progressive difficulty and balanced weekly load.

You must internally execute this 5-phase protocol and honor every rule. The app renders structured JSON, so emit ONLY the JSON shape at the bottom - but your reasoning must follow the protocol.

=== PHASE 1 - INGEST & INVENTORY ===
Extract a complete flat inventory of EVERY distinct topic, subtopic, skill, tool, reading, assignment, and deliverable named anywhere in the source. Note the original section label beside each for traceability. Flag ambiguous items rather than guessing.

=== PHASE 2 - CLASSIFY & LEVEL ===
Assign every inventory item to exactly one of four tiers (an item may appear in two tiers if it has a basic AND an advanced form - split it explicitly):
- "basic"        = Foundation (definitions, terminology, single-concept, no combination)
- "intermediate" = combining 2+ foundational concepts, applied exercises, standard tooling
- "advanced"     = edge cases, optimization, multi-system integration, debugging, design tradeoffs, AND Mastery (independent problem framing, teaching others, architecture-level decisions, novel/ambiguous scenarios, unsupervised top-of-field performance)

=== PHASE 3 - BALANCE & DISTRIBUTE ===
Distribute by COGNITIVE LOAD, not item count (one advanced topic can occupy what 3 basic ones would). Sequence tiers Foundation -> Intermediate -> Advanced/Mastery, allowing [REVIEW] spirals (label them). Do NOT front-load all easy content or back-load all hard content. Ramp smoothly. Every week must carry roughly equal cognitive weight; if a week is genuinely lighter, extend practice depth within it - never shrink the template.

=== PHASE 4 - STRUCTURE ===
Group items into PHASES (by tier band) then into WEEKS. Every week gets a descriptive title (never just "Week N") and 4-8 equally-detailed items. Respect prerequisites: a concept never appears before its foundation.

=== PHASE 5 - VERIFY & RECONCILE ===
Achieve 100% coverage of the Phase 1 inventory. If an item is genuinely non-learning (e.g., a logistics note), move it to "included"/"added" notes and say so - do not drop it silently.

=== NON-NEGOTIABLE RULES ===
1. ZERO OMISSION. Every syllabus topic, term, tool, reading, and assignment appears as a "user" item. Nothing dropped, merged into vagueness, or summarized away.
2. FULL TRACEABILITY. Put the original syllabus section/context in each item's "note" (e.g. "from Week 3: Linked Lists"). If you add supplementary content to fill a real gap, mark source:"app" and say so in "added".
3. NO FRONT/BACK-LOADING. Smooth difficulty ramp; identical template depth every week.
4. NO BACKGROUND ASSUMED. Start at true basics of the subject unless the syllabus explicitly states an entry level - then reflect that in "included".
5. PREREQUISITES RESPECTED. Never introduce a concept before its foundation.

=== OUTPUT SHAPE (return ONLY this JSON, no prose, no markdown fences) ===
{
  "title": string,
  "phases": [
    {
      "id": string,
      "title": string,
      "sub": string,
      "weeks": [
        {
          "week": number,
          "title": string,
          "items": [
            {
              "id": string,
              "title": string,
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
  "included": string,
  "added": string,
  "path": string[]
}

=== RULES ===
- Strict tier ladder: earliest phases ~ basic, middle ~ intermediate, final ~ advanced (includes Mastery).
- Put deliberate practice / LeetCode-style problems in track:"dsa" when relevant.
- Every week MUST have a non-empty "title" and 4-8 "items".
- Achieve 100% inventory coverage; surface any non-learning items in "included"/"added".
- Return valid JSON only. No markdown fences. No commentary.`;

/**
 * Parse a model response (already JSON text) into the flat {phases, items}
 * shape the frontend consumes. Accepts both rich week-grouped and flat shapes.
 */
function normalizePlan(content) {
  if (!content) return null;
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
  const hasRich =
    Array.isArray(parsed.phases) &&
    parsed.phases.some((p) => Array.isArray(p.weeks) && p.weeks.length);
  if (hasRich) {
    const flatItems = [];
    const phases = parsed.phases.map((ph) => {
      const weeks = ph.weeks || [];
      for (const w of weeks) {
        for (const it of w.items || []) {
          flatItems.push({
            id: it.id || `${ph.id}-${flatItems.length}`,
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
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text:
                      SYSTEM_PROMPT +
                      "\n\nCURRICULUM TO ANALYZE:\n" +
                      text.slice(0, 12000),
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
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
            Authorization: `Bearer ${openrouterKey}`,
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
