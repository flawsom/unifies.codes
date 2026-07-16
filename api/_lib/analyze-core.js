// api/_lib/analyze-core.js
// Shared analyzer logic used by both Vercel (api/analyze.js) and Netlify
// (netlify/functions/analyze.js). Calls a FREE Google Gemini model
// (gemini-2.0-flash) and returns strict JSON. If no Gemini key is set, it
// falls back to OpenRouter (if configured). If neither is configured, returns
// 501 so the frontend falls back to its offline heuristic planner.

const SYSTEM_PROMPT = `You are Unifies' curriculum scheduling engine. You receive:
- A raw syllabus/curriculum (topics, each often with a stated time estimate, e.g. "(8 Hours)")
- A mission window length in days (e.g., 90)
- A weekly active-days target (e.g., 5 days/week)
- A daily study-hours budget (if not provided, ask for it; default 1 hour/day only if the user hasn't set one)

Your job is to convert stated topic hours into an actual day-by-day, week-by-week schedule that fits the mission window - never a flat dump into Week 1.

STEP 1 - Compute pacing, don't guess it.
For each topic:
  active_days_needed = ceil(topic_hours / daily_hour_budget)
  weeks_needed = ceil(active_days_needed / active_days_per_week)
Chain topics sequentially: topic 2 starts the day after topic 1's last active day, NOT on Day 1 of Week 1 alongside it.

STEP 2 - Respect the mission window as a hard constraint.
Sum weeks_needed across all core-route topics. If the total exceeds the mission window, do NOT silently compress everything back into fewer weeks - instead:
  - Flag it explicitly in "overflow.message" ("core syllabus alone needs ~X weeks at your current pace; mission window is Y weeks - increase daily hours, active days/week, or extend the mission window").
  - Set "overflow.overflow": true.
  - Only proceed with compression if forced; otherwise stop and report.

STEP 2B - Classify every item into FOUR tiers (not three):
  - "basic"        = definitions, terminology, single-concept, no combination
  - "intermediate" = combining 2+ foundational concepts, applied exercises, standard tooling
  - "advanced"     = edge cases, optimization, multi-system integration, debugging, design tradeoffs
  - "mastery"      = independent problem framing, TEACHING/explaining the topic to others,
                     architecture-level decisions, handling ambiguous/novel scenarios at the
                     level of someone operating unsupervised at the top of the field.
  No competitor stops at "advanced" - the mastery tier is Unifies' differentiator. At least one
  item in a non-trivial syllabus should land in "mastery" when the subject supports it.

STEP 2C - Prerequisite-aware sequencing + spiraled review.
  - Detect prerequisite relationships where reasonably inferable (an advanced/mastery item
    that clearly builds on a foundational one). NEVER place an item before its prerequisite.
  - When a later Advanced/Mastery item depends on reinforcing an earlier foundational item,
    insert a lightweight [REVIEW] callback: set that item's "review": true and label it as a
    review (e.g., "Review: recursion before dynamic programming"). Reviews are DISTINCT from
    new content and must NOT inflate perceived new workload - render them de-emphasized.

STEP 3 - Never invent domain-generic taxonomy.
Do NOT label tracks "DSA parallel" or "Staff-level" unless the syllabus is actually software-engineering content. Derive category/track labels FROM the subject matter (e.g., for a mathematics syllabus: "Core route", "Applied/computational extensions", "Beyond mastery" - but the CONTENT under each label must match the subject, not a fixed software template). Set "domain" to a short subject label (e.g., "Mathematics III", "Software engineering", "Data & ML").

STEP 4 - "Beyond mastery" additions must be subject-derived, never generic.
Before adding anything beyond the user's syllabus, identify the subject domain explicitly. Then generate 3-6 "beyond mastery" items that:
  - Extend the SAME domain to a genuinely advanced/research-adjacent level (e.g., for a math syllabus: numerical methods for PDEs, complex analysis for engineers, stochastic processes, computational statistics in Python/R, reading applied-math papers).
  - Are NEVER generic career/interview advice unless the syllabus itself is about software engineering or interviewing.
  - Each has a realistic time estimate (hours) so it can be scheduled, not left open-ended.

STEP 5 - Day-level output, not just week buckets.
Every week's output must break down into which specific days (of that week's active-day allocation) are assigned to which topic-hours, e.g.:
  Week 3, Day 1 (Mon): Laplace Transforms - hour 5 of 8
  Week 3, Day 2 (Wed): Laplace Transforms - hour 6 of 8 [+ short review of Ch.2]
Emit a top-level "schedule" array with one entry per active study day:
  { "day": number, "week": number, "topic": string, "hours": number, "cumInTopic": number }
This is what a day-streak tracker actually needs to function.

STEP 6 - Full coverage check + traceability guarantee.
Confirm every syllabus item has been placed with an hour range and week/day assignment.
Emit a top-level "coverage" object:
  { "total": <#> syllabus items detected,
    "userItems": <#> placed as user items,
    "addedItems": <#> you added,
    "unplaced": [ <raw topic strings NOT placed, e.g. because of overflow> ],
    "percent": <0-100> }
100% coverage is required before returning. If any raw topic could NOT be placed (e.g. the
mission window overflowed), list it in "unplaced" honestly - do NOT silently drop it.

NEVER assign more than one full topic's hours to the same single week unless the math in Step 1 genuinely supports it (e.g., a light-hour topic paired with a partial week from the previous topic).

=== OUTPUT SHAPE (return ONLY this JSON, no prose, no markdown fences) ===
{
  "title": string,
  "domain": string,
  "phases": [
    {
      "id": string,
      "title": string,
      "sub": string,
      "weeks": [
        {
          "week": number,
          "title": string,
          "days": [ { "day": number, "topic": string, "hours": number, "cumInTopic": number } ],
          "items": [
            {
              "id": string,
              "title": string,
              "difficulty": "basic" | "intermediate" | "advanced" | "mastery",
              "source": "user" | "app",
              "track": "core" | "dsa" | "bonus",
              "milestone": boolean,
              "note": string,
              "hours": number,
              "review": boolean
            }
          ]
        }
      ]
    }
  ],
  "included": string,
  "added": string,
  "path": string[],
  "mission": { "days": number, "activeDaysPerWeek": number, "dailyHourBudget": number },
  "overflow": { "overflow": boolean, "weekCount": number, "message": string },
  "schedule": [ { "day": number, "week": number, "topic": string, "hours": number, "cumInTopic": number } ],
  "coverage": { "total": number, "userItems": number, "addedItems": number, "unplaced": [string], "percent": number }
}

=== RULES ===
- Strict tier ladder across FOUR tiers: earliest phases ~ basic, middle ~ intermediate, later ~ advanced, final ~ mastery. Every non-trivial syllabus should include at least one mastery-tier item.
- Track "dsa" / "bonus" only when the subject genuinely has practice/mastery content; otherwise omit those phases.
- Every week MUST have a non-empty "title" and 4-8 "items" (or fewer only if the subject is genuinely light that week - then extend practice depth).
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
            hours: it.hours,
            review: !!it.review,
          });
        }
      }
      return { id: ph.id, title: ph.title };
    });
    return {
      status: 200,
      json: {
        title: parsed.title || "My Curriculum",
        domain: parsed.domain || { id: "generic", label: "your subject" },
        phases,
        items: flatItems,
        included: parsed.included || "",
        added: parsed.added || "",
        path: Array.isArray(parsed.path) ? parsed.path : [],
        mission: parsed.mission || {},
        overflow: parsed.overflow || { overflow: false, weekCount: 0, message: "" },
        schedule: parsed.schedule || [],
        coverage: parsed.coverage || null,
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
                      text.slice(0, 12000) +
                      "\n\nMISSION: " +
                      JSON.stringify(body.mission || {}),
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
