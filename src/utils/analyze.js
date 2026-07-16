// utils/analyze.js
// Turns a user's raw curriculum text into a structured, trackable plan.
//
// Two paths:
//   1. Serverless AI (preferred): POST the raw text to /api/analyze, which calls a
//      free LLM (OpenRouter free model) and returns strict JSON. Rate-limited per IP.
//   2. Heuristic fallback (always works, zero config): a pure, deterministic parser
//      that splits the text into phases/weeks/items, infers difficulty, and fills the
//      gaps with foundational basics + advanced/staff-level items the user may have
//      missed. No network needed.
//
// Both return the SAME shape so the UI doesn't care which path won.

/**
 * @typedef {Object} PlanItem
 * @property {string} id
 * @property {string} title
 * @property {string} [phaseId]
 * @property {number} [week]
 * @property {'basic'|'intermediate'|'advanced'} [difficulty]
 * @property {'user'|'app'} source      // did the USER write it, or did UNIFIES add it
 * @property {boolean} [milestone]
 * @property {string} [note]
 * @property {string} [track]           // 'core' | 'dsa' | 'bonus' (defaults 'core')
 */

/**
 * @typedef {Object} Plan
 * @property {string} title
 * @property {Array<{id:string,title:string}>} phases
 * @property {PlanItem[]} items
 * @property {string} included   // what the user's curriculum already covered
 * @property {string} added      // what Unifies added (basics + advanced gaps)
 * @property {string[]} path     // recommended order of focus, human-readable
 */

const DIFFICULTY_BASIC = /(basic|beginner|intro|fundament|getting started|hello world|setup|install|first|basics|101|prerequisite|pre-req)/i;
const DIFFICULTY_ADVANCED = /(advanced|expert|staff|principal|system design|architecture|scale|distributed|production|deep dive|optimi[sz]ation|security|leadership|distributed systems|low.level|low level)/i;
const APP_FOUNDATION_TITLES = [
  "Set up your development environment (editor, terminal, package manager)",
  "Learn how to read documentation and search effectively",
  "Version control fundamentals with Git and GitHub",
  "Write your first small program and run it locally",
  "Understand how to debug and read error messages",
  "Build a habit of daily deliberate practice",
];
const APP_ADVANCED_TITLES = [
  "Design a system for scale (caching, queues, replication)",
  "Deepen one area into staff-level expertise",
  "Practice explaining trade-offs aloud (interview communication)",
  "Contribute to or study a large open-source codebase",
  "Write about what you learned (teaching solidifies mastery)",
];

function slug(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function inferDifficulty(text) {
  if (DIFFICULTY_ADVANCED.test(text)) return "advanced";
  if (DIFFICULTY_BASIC.test(text)) return "basic";
  return "intermediate";
}

function makeId(prefix, i) {
  return `${prefix}-${i + 1}`;
}

/**
 * Pure, deterministic structuring of raw curriculum text.
 * No network. This is the offline fallback AND the baseline that the AI extends.
 * @param {string} raw
 * @returns {Plan}
 */
export function heuristicStructure(raw) {
  const text = (raw || "").trim();
  if (!text) {
    return {
      title: "My Curriculum",
      phases: [],
      items: [],
      included: "",
      added: "",
      path: [],
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const phases = [];
  const items = [];
  let currentPhase = null;
  let currentWeek = null;
  let phaseIdx = 0;
  let userItemCount = 0;

  const pushPhase = (title) => {
    const id = `p${phaseIdx + 1}`;
    phases.push({ id, title });
    currentPhase = id;
    phaseIdx += 1;
    currentWeek = null;
    return id;
  };

  for (const line of lines) {
    // Section heading: "# Title", "## Title", all-caps short line, or "Phase N:"
    const headingMatch = line.match(/^#+\s+(.*)$/) || line.match(/^(phase|module|section|week|unit)\s*\d*[:\-]?\s*(.*)$/i);
    if (headingMatch && line.length < 80) {
      const title = (headingMatch[1] || headingMatch[2] || line).trim();
      if (title) pushPhase(title);
      continue;
    }

    // Week marker: "Week 3" / "W3"
    const weekMatch = line.match(/^w(?:eek)?\s*(\d+)/i);
    if (weekMatch) {
      currentWeek = parseInt(weekMatch[1], 10);
      continue;
    }

    // Bullet / numbered list item
    const itemMatch = line.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    const title = itemMatch ? itemMatch[2].trim() : line;
    if (!title) continue;

    if (!currentPhase) pushPhase("Part 1");
    const id = makeId(currentPhase, items.length);
    items.push({
      id,
      title,
      text: title,
      phaseId: currentPhase,
      week: currentWeek || undefined,
      difficulty: inferDifficulty(title),
      source: "user",
      track: "core",
    });
    userItemCount += 1;
  }

  // If there were no structure markers, treat the whole thing as one phase of items.
  if (phases.length === 0) {
    pushPhase("Curriculum");
  }

  // --- Unifies adds: foundational basics (if not obviously present) ---
  const hasBasic = items.some((i) => i.difficulty === "basic");
  const addedItems = [];
  if (!hasBasic) {
    const fid = "app-basics";
    phases.unshift({ id: fid, title: "Foundations (added by Unifies)" });
    APP_FOUNDATION_TITLES.forEach((t, i) => {
      addedItems.push({
        id: `${fid}-${i + 1}`,
        title: t,
        text: t,
        phaseId: fid,
        difficulty: "basic",
        source: "app",
        track: "core",
        note: "Unifies added this because your curriculum started mid-level.",
      });
    });
  }

  // --- Unifies adds: advanced / staff-level gaps ---
  const hasAdvanced = items.some((i) => i.difficulty === "advanced");
  if (!hasAdvanced) {
    const aid = "app-advanced";
    phases.push({ id: aid, title: "Beyond mastery (added by Unifies)" });
    APP_ADVANCED_TITLES.forEach((t, i) => {
      addedItems.push({
        id: `${aid}-${i + 1}`,
        title: t,
        text: t,
        phaseId: aid,
        difficulty: "advanced",
        source: "app",
        track: "bonus",
        note: "Unifies added this to push you from competent to staff-level.",
      });
    });
  }

  const allItems = [...addedItems, ...items];

  const included = `Your curriculum already covered ${userItemCount} item(s) across ${phases.filter((p) => p.id.startsWith("p")).length} part(s). Unifies kept every item you provided and organized it.`;
  const added = `Unifies added ${addedItems.length} item(s): ${
    hasBasic ? "" : "foundational basics so a complete beginner isn't lost; "
  }${hasAdvanced ? "" : "advanced/staff-level gaps to reach the top."}`.trim();

  const path = phases
    .filter((p) => p.id.startsWith("p") || p.id.startsWith("app-"))
    .map((p) => p.title);

  return {
    title: "My Curriculum",
    phases,
    items: allItems,
    included,
    added,
    path,
  };
}

/**
 * Call the serverless AI analyzer. Falls back to heuristic on any failure.
 * @param {string} raw
 * @param {{onStatus?: (s:string)=>void}} [opts]
 * @returns {Promise<{plan: Plan, via: 'ai'|'heuristic', rateLimited?: boolean}>}
 */
export async function analyzeCurriculum(raw, opts = {}) {
  const { onStatus } = opts;
  const text = (raw || "").trim();
  if (!text) {
    return { plan: heuristicStructure(""), via: "heuristic" };
  }

  if (onStatus) onStatus("Asking Unifies AI to structure your plan…");
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (res.status === 429) {
      if (onStatus) onStatus("AI is busy right now — using the offline planner instead.");
      return { plan: heuristicStructure(text), via: "heuristic", rateLimited: true };
    }
    if (!res.ok) {
      return { plan: heuristicStructure(text), via: "heuristic" };
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      return { plan: heuristicStructure(text), via: "heuristic" };
    }
    // Normalize: ensure ids, source defaults, track default.
    const items = data.items.map((it, i) => ({
      id: it.id || makeId(it.phaseId || "p", i),
      title: String(it.title || "").trim(),
      text: String(it.title || "").trim(),
      phaseId: it.phaseId,
      week: it.week || undefined,
      difficulty: it.difficulty || inferDifficulty(it.title || ""),
      source: it.source === "app" ? "app" : "user",
      milestone: !!it.milestone,
      note: it.note || "",
      track: it.track || "core",
    }));
    const phases = Array.isArray(data.phases) ? data.phases : [];
    return {
      plan: {
        title: data.title || "My Curriculum",
        phases,
        items,
        included: data.included || "",
        added: data.added || "",
        path: Array.isArray(data.path) ? data.path : [],
      },
      via: "ai",
    };
  } catch (err) {
    if (onStatus) onStatus("Using the offline planner (no AI endpoint).");
    return { plan: heuristicStructure(text), via: "heuristic" };
  }
}

export const _internal = { APP_FOUNDATION_TITLES, APP_ADVANCED_TITLES, inferDifficulty, slug };
export { inferDifficulty };

/**
 * Convert an analyzed Plan into the app's existing curriculum shape
 * ({ phases, bonus, parallelTrack }) so NO rendering code has to change.
 * Items keep their {id,title,week,phaseId,milestone,source,difficulty,track}.
 * @param {Plan & {via?:string}} plan
 */
export function planToCurriculum(plan) {
  const phases = plan.phases || [];
  const items = plan.items || [];
  const byPhase = {};
  for (const it of items) {
    (byPhase[it.phaseId] = byPhase[it.phaseId] || []).push(it);
  }

  const toPhase = (ph, phItems) => {
    const weeksMap = {};
    for (const it of phItems) {
      const w = it.week || 1;
      (weeksMap[w] = weeksMap[w] || []).push(it);
    }
    const weeks = Object.keys(weeksMap)
      .sort((a, b) => a - b)
      .map((w) => ({ week: Number(w), title: "", items: weeksMap[w] }));
    const code = String(ph.id).replace(/\D/g, "") || "0";
    return {
      id: ph.id,
      code: code.padStart(2, "0"),
      title: ph.title,
      sub: "",
      weeks,
    };
  };

  const mainPhases = [];
  let bonusItems = [];
  let dsaItems = [];
  for (const ph of phases) {
    const phItems = byPhase[ph.id] || [];
    const isBonus =
      ph.id === "app-advanced" ||
      /beyond|staff|advanced/i.test(ph.title) ||
      (phItems.length > 0 && phItems.every((i) => i.track === "bonus"));
    if (isBonus) {
      bonusItems.push(...phItems);
      continue;
    }
    const dsa = phItems.filter((i) => i.track === "dsa");
    const nonDsa = phItems.filter((i) => i.track !== "dsa");
    if (dsa.length) dsaItems.push(...dsa);
    if (nonDsa.length) mainPhases.push(toPhase(ph, nonDsa));
  }
  for (const it of items) {
    if (it.track === "dsa" && !dsaItems.includes(it)) dsaItems.push(it);
  }

  const coreItems = items.filter((i) => i.track !== "bonus" && i.track !== "dsa");

  return {
    title: plan.title || "My Curriculum",
    phases: mainPhases.length
      ? mainPhases
      : [
          {
            id: "p1",
            code: "01",
            title: "Curriculum",
            sub: "",
            weeks: [{ week: 1, title: "", items: coreItems }],
          },
        ],
    bonus: {
      id: "bonus",
      title: "Beyond mastery (added by Unifies)",
      weeks: bonusItems.length ? [{ week: null, title: "", items: bonusItems }] : [],
    },
    parallelTrack: { id: "dsa", title: "Practice track", items: dsaItems },
    _meta: {
      included: plan.included || "",
      added: plan.added || "",
      path: plan.path || [],
      via: plan.via || "heuristic",
    },
  };
}
