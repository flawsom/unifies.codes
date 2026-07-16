// api/_lib/analyze-core.js
// Shared analyzer logic used by both Vercel (api/analyze.js) and Netlify
// (netlify/functions/analyze.js). Calls a FREE OpenRouter model and returns
// strict JSON. If no API key is configured, returns 501 so the frontend falls
// back to its offline heuristic planner.

const FREE_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-2-9b-it:free";

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

    // Accept EITHER shape:
    //  - Rich (preferred): parsed.phases[].weeks[].items[]
    //  - Flat (legacy): parsed.items[]
    const hasRich = Array.isArray(parsed.phases) && parsed.phases.some((p) => Array.isArray(p.weeks) && p.weeks.length);
    if (hasRich) {
      // Normalize the rich week-grouped shape into the flat {phases, items}
      // form the frontend already consumes.
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
