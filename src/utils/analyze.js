// utils/analyze.js
// Turns a user's raw curriculum text into a structured, trackable plan.
//
// Two paths:
//   1. Serverless AI (preferred): POST the raw text to /api/analyze, which calls a
//      free LLM (Google Gemini free tier) with a pacing-aware scheduling directive and
//      returns strict JSON. Falls back to the offline planner on any failure.
//   2. Heuristic fallback (always works, zero config): a pure, deterministic scheduler
//      that parses per-topic hour estimates, chains topics sequentially by hours, and
//      produces a real day-by-day / week-by-week plan. No network needed.
//
// Both return the SAME shape so the UI doesn't care which path won.
//
// NEW (pacing + relevance fix):
//   - Topics are NEVER all dumped into Week 1. A topic starts only after the prior
//     topic's hours are exhausted (buildSchedule).
//   - The plan respects activeDaysPerWeek + a daily-hour budget, not "one topic/week".
//   - Overflow past the mission window is surfaced, never silently absorbed.
//   - Taxonomy is derived from the detected subject domain, not a hardcoded
//     "DSA / Staff-level" software template.
//   - Offline path omits generic "Beyond mastery" filler; it prompts the user to add
//     an AI endpoint for subject-tailored suggestions.

// ---------------------------------------------------------------------------
// Tunable defaults (these mirror what the mission header shows in the UI).
// ---------------------------------------------------------------------------
export const DEFAULT_MISSION_DAYS = 90;
export const DEFAULT_ACTIVE_DAYS_PER_WEEK = 5;
export const DEFAULT_DAILY_HOUR_BUDGET = 1; // hours/day; user can raise this

/**
 * @typedef {Object} PlanItem
 * @property {string} id
 * @property {string} title
 * @property {string} [text]
 * @property {string} [phaseId]
 * @property {number} [week]
 * @property {'basic'|'intermediate'|'advanced'} [difficulty]
 * @property {'user'|'app'} source
 * @property {boolean} [milestone]
 * @property {string} [note]
 * @property {string} [track]           // 'core' | 'dsa' | 'bonus' (defaults 'core')
 * @property {number} [hours]           // estimated hours for this topic
 */

const DIFFICULTY_BASIC = /(basic|beginner|intro|fundament|getting started|hello world|setup|install|first|basics|101|prerequisite|pre-req)/i;
const DIFFICULTY_ADVANCED = /(advanced|expert|staff|principal|system design|architecture|scale|distributed|production|deep dive|optimi[sz]ation|security|leadership|low.level|low level)/i;

// Subject-domain detection so taxonomy + "beyond mastery" are subject-aware.
const DOMAIN_SIGNALS = [
  {
    id: "software",
    label: "Software engineering",
    score: (t) =>
      (t.match(/\b(python|javascript|typescript|java|react|api|git|system design|algorithm|data structure|frontend|backend|sql|database|docker|kubernetes|ci\/cd)\b/gi) || []).length,
  },
  {
    id: "math",
    label: "Mathematics",
    score: (t) =>
      (t.match(/\b(laplace|fourier|pde|ode|calculus|matrix|eigenvalue|probability|statistics|theorem|integral|differential|vector|tensor|numerical method|complex analysis|stochastic)\b/gi) || []).length,
  },
  {
    id: "data",
    label: "Data & ML",
    score: (t) =>
      (t.match(/\b(machine learning|neural network|regression|classification|pandas|numpy|tensorflow|pytorch|dataset|feature engineering|clustering)\b/gi) || []).length,
  },
  {
    id: "design",
    label: "Design",
    score: (t) =>
      (t.match(/\b(figma|typography|color theory|ux|ui|wireframe|prototyp|accessibility|design system)\b/gi) || []).length,
  },
];

function detectDomain(text) {
  const scores = DOMAIN_SIGNALS.map((d) => ({ id: d.id, label: d.label, s: d.score(text) }));
  scores.sort((a, b) => b.s - a.s);
  if (scores[0].s === 0) return { id: "generic", label: "your subject" };
  return { id: scores[0].id, label: scores[0].label };
}

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

// "(8 Hours)" / "8h" / "8 hrs" / "8 hours" / "8H"
function parseHours(line) {
  const m = line.match(/\(?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*\)?/i);
  return m ? parseFloat(m[1]) : null;
}

// Strip the trailing hour estimate from a topic title for cleaner display.
function stripHours(title) {
  return title.replace(/\s*\(?\s*\d+(?:\.\d+)?\s*(?:hours?|hrs?|h)\s*\)?\s*$/i, "").trim();
}

/**
 * Deterministic day-by-day scheduler (the buildSchedule from the spec).
 * Chains topics sequentially by hours; never starts topic N until topic N-1's
 * hours are exhausted. Respects an active-day mask + daily hour budget.
 *
 * @param {Array<{name:string, hours:number}>} topics
 * @param {number} missionDays
 * @param {number} activeDaysPerWeek
 * @param {number} dailyHourBudget
 * @returns {{schedule: Array<{day:number,week:number,topic:string,hours:number,cumInTopic:number}>, overflow: {overflow:boolean, weekCount:number, message:string}, weekCount:number}}
 */
export function buildSchedule(topics, missionDays, activeDaysPerWeek, dailyHourBudget) {
  const isActiveDay = (day) => ((day - 1) % 7) < activeDaysPerWeek; // first N days of each week active
  const schedule = [];
  let currentDay = 1;
  let overflowTopic = null;

  for (const topic of topics) {
    let hoursRemaining = topic.hours;
    let cumInTopic = 0;
    while (hoursRemaining > 0) {
      if (isActiveDay(currentDay)) {
        const hoursToday = Math.min(dailyHourBudget, hoursRemaining);
        cumInTopic += hoursToday;
        schedule.push({
          day: currentDay,
          week: Math.ceil(currentDay / 7),
          topic: topic.name,
          hours: hoursToday,
          cumInTopic,
        });
        hoursRemaining -= hoursToday;
      }
      currentDay += 1;
      if (currentDay > missionDays) {
        overflowTopic = topic.name;
        break;
      }
    }
    if (overflowTopic) break;
  }

  const weekCount = schedule.length ? Math.max(...schedule.map((s) => s.week)) : 0;
  const overflow = { overflow: !!overflowTopic, weekCount, message: "" };
  if (overflowTopic) {
    overflow.message = `Your pace fits the first ${weekCount} week(s) inside the ${missionDays}-day mission, but "${overflowTopic}" and later topics don't fit. Raise your daily hours, add active days/week, or extend the mission window.`;
  }
  return { schedule, overflow, weekCount };
}

/**
 * Pure, deterministic structuring of raw curriculum text with REAL pacing.
 * No network. This is the offline fallback AND the baseline the AI extends.
 * @param {string} raw
 * @param {{missionDays?:number, activeDaysPerWeek?:number, dailyHourBudget?:number}} [opts]
 * @returns {Plan}
 */
export function heuristicStructure(raw, opts = {}) {
  const text = (raw || "").trim();
  const missionDays = opts.missionDays || DEFAULT_MISSION_DAYS;
  const activeDaysPerWeek = opts.activeDaysPerWeek || DEFAULT_ACTIVE_DAYS_PER_WEEK;
  const dailyHourBudget = opts.dailyHourBudget || DEFAULT_DAILY_HOUR_BUDGET;

  if (!text) {
    return {
      title: "My Curriculum",
      phases: [],
      items: [],
      included: "",
      added: "",
      path: [],
      domain: { id: "generic", label: "your subject" },
      mission: { days: missionDays, activeDaysPerWeek, dailyHourBudget },
      overflow: { overflow: false, weekCount: 0, message: "" },
      schedule: [],
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const domain = detectDomain(text);
  const userTopics = []; // {name, hours, difficulty}
  let currentPhaseTitle = null;

  for (const line of lines) {
    // Skip pure structural headers for topic extraction; capture phase title if present.
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1 && line.length < 80) {
      currentPhaseTitle = h1[1].trim();
      continue;
    }
    const headingMatch = line.match(/^(phase|module|section|unit)\s*\d*\s*[:\-]?\s*(.*)$/i);
    if (headingMatch && line.length < 80) {
      currentPhaseTitle = (headingMatch[2] || (headingMatch[1] + " " + headingMatch[2])).trim() || currentPhaseTitle;
      continue;
    }
    // Topic line (may be a bullet / numbered item, possibly with "(8 Hours)").
    const itemMatch = line.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    const rawTitle = itemMatch ? itemMatch[2].trim() : line;
    if (!rawTitle) continue;
    const hours = parseHours(rawTitle);
    const title = stripHours(rawTitle);
    if (!title) continue;
    userTopics.push({
      name: title,
      hours: hours != null ? hours : 4, // assume 4h if no estimate given
      difficulty: inferDifficulty(title),
      phaseTitle: currentPhaseTitle,
    });
  }

  if (userTopics.length === 0) {
    // No parseable topics — fall back to treating the whole text as one topic.
    userTopics.push({ name: text.slice(0, 120), hours: 4, difficulty: "intermediate", phaseTitle: null });
  }

  const { schedule, overflow, weekCount } = buildSchedule(
    userTopics.map((t) => ({ name: t.name, hours: t.hours })),
    missionDays,
    activeDaysPerWeek,
    dailyHourBudget
  );

  // Group schedule by week -> day assignments, and assign each topic its weeks.
  const weeksMap = {};
  for (const s of schedule) {
    (weeksMap[s.week] = weeksMap[s.week] || new Map());
    weeksMap[s.week].set(s.day, {
      day: s.day,
      topic: s.topic,
      hours: s.hours,
      cumInTopic: s.cumInTopic,
    });
  }

  // Build item objects per topic, tagging with the week(s) it spans.
  const items = [];
  const topicWeekSpans = {};
  for (const s of schedule) {
    (topicWeekSpans[s.topic] = topicWeekSpans[s.topic] || new Set()).add(s.week);
  }
  userTopics.forEach((t, i) => {
    const weeks = Array.from(topicWeekSpans[t.name] || []);
    const primaryWeek = weeks.length ? Math.min(...weeks) : 1;
    items.push({
      id: makeId("u", i),
      title: t.name,
      text: t.name,
      phaseId: "p1",
      week: primaryWeek,
      difficulty: t.difficulty,
      source: "user",
      track: "core",
      hours: t.hours,
      note: t.phaseTitle ? `from ${t.phaseTitle}` : "",
    });
  });

  // Build the single "Core route" phase with week cards carrying day-level data.
  const weeks = Object.keys(weeksMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((w) => {
      const dayMap = weeksMap[w];
      const dayList = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
      const topicsThisWeek = [...new Set(dayList.map((d) => d.topic))];
      return {
        week: w,
        title: topicsThisWeek.length === 1 ? topicsThisWeek[0] : `${topicsThisWeek.length} topics`,
        days: dayList,
        items: items.filter((it) => it.week === w),
      };
    });

  const phase = {
    id: "p1",
    title: `${domain.label} — core route`,
    sub: `Paced over ${weekCount || 1} week(s) · ${activeDaysPerWeek} active days/wk · ${dailyHourBudget}h/day`,
    weeks,
  };

  const included = `Your syllabus covered ${userTopics.length} topic(s). Unifies kept every topic and paced it across ${weekCount || 0} week(s) using your ${missionDays}-day mission window.`;
  const added = `Offline planner: no generic "beyond mastery" was added. For subject-tailored advanced suggestions, configure an AI endpoint (Settings → add GEMINI_API_KEY).`;

  return {
    title: "My Curriculum",
    phases: [phase],
    items,
    included,
    added,
    path: [phase.title],
    domain,
    mission: { days: missionDays, activeDaysPerWeek, dailyHourBudget },
    overflow,
    schedule,
  };
}

/**
 * Call the serverless AI analyzer. Falls back to heuristic on any failure.
 * @param {string} raw
 * @param {{onStatus?: (s:string)=>void, missionDays?:number, activeDaysPerWeek?:number, dailyHourBudget?:number}} [opts]
 * @returns {Promise<{plan: Plan, via: 'ai'|'heuristic', rateLimited?: boolean}>}
 */
export async function analyzeCurriculum(raw, opts = {}) {
  const { onStatus } = opts;
  const text = (raw || "").trim();
  if (!text) {
    return { plan: heuristicStructure("", opts), via: "heuristic" };
  }

  if (onStatus) onStatus("Asking Unifies AI to structure your plan…");
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        mission: {
          days: opts.missionDays || DEFAULT_MISSION_DAYS,
          activeDaysPerWeek: opts.activeDaysPerWeek || DEFAULT_ACTIVE_DAYS_PER_WEEK,
          dailyHourBudget: opts.dailyHourBudget || DEFAULT_DAILY_HOUR_BUDGET,
        },
      }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (res.status === 429) {
      if (onStatus) onStatus("AI is busy right now — using the offline planner instead.");
      return { plan: heuristicStructure(text, opts), via: "heuristic", rateLimited: true };
    }
    if (!res.ok) {
      return { plan: heuristicStructure(text, opts), via: "heuristic" };
    }
    const data = await res.json();
    const hasRich = Array.isArray(data.phases) && data.phases.some((p) => Array.isArray(p.weeks) && p.weeks.length);
    const hasFlat = Array.isArray(data.items) && data.items.length > 0;
    if (!data || (!hasRich && !hasFlat)) {
      return { plan: heuristicStructure(text, opts), via: "heuristic" };
    }
    if (hasRich) {
      // AI returned the paced, week-grouped shape. Pass through as-is.
      return {
        plan: {
          title: data.title || "My Curriculum",
          phases: data.phases,
          items: data.items || [],
          included: data.included || "",
          added: data.added || "",
          path: Array.isArray(data.path) ? data.path : [],
          domain: data.domain || { id: "generic", label: "your subject" },
          mission: data.mission || opts,
          overflow: data.overflow || { overflow: false, weekCount: 0, message: "" },
          schedule: data.schedule || [],
        },
        via: "ai",
      };
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
      hours: it.hours || undefined,
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
        domain: data.domain || { id: "generic", label: "your subject" },
        mission: data.mission || opts,
        overflow: data.overflow || { overflow: false, weekCount: 0, message: "" },
        schedule: data.schedule || [],
      },
      via: "ai",
    };
  } catch (err) {
    if (onStatus) onStatus("Using the offline planner (no AI endpoint).");
    return { plan: heuristicStructure(text, opts), via: "heuristic" };
  }
}

export const _internal = { detectDomain, parseHours, stripHours, inferDifficulty, slug, buildSchedule };
export { inferDifficulty };

/**
 * Convert an analyzed Plan into the app's existing curriculum shape
 * ({ phases, bonus, parallelTrack }) so NO rendering code has to change.
 *
 * Accepts EITHER shape:
 *   - Rich (AI or offline scheduler): plan.phases[].weeks[].items[] (each week may
 *     carry `days` for day-level rendering).
 *   - Flat (legacy): plan.phases[] + plan.items[] (grouped by phaseId/week).
 * @param {Plan & {via?:string}} plan
 */
export function planToCurriculum(plan) {
  const phases = plan.phases || [];
  const items = plan.items || [];
  const richPhases = phases.filter((p) => Array.isArray(p.weeks) && p.weeks.length);

  const normItem = (it, phaseId, week, weekTitle) => ({
    id: it.id || makeId(phaseId || "p", Math.random()),
    title: String(it.title || "").trim(),
    text: String(it.text || it.title || "").trim(),
    phaseId: it.phaseId || phaseId,
    week: it.week != null ? Number(it.week) : week != null ? Number(week) : undefined,
    weekTitle: it.weekTitle || weekTitle || null,
    difficulty: it.difficulty || inferDifficulty(it.title || ""),
    source: it.source === "app" ? "app" : "user",
    milestone: !!it.milestone,
    note: it.note || "",
    track: it.track || "core",
    hours: it.hours || undefined,
  });

  const buildPhase = (ph, phItems) => {
    if (Array.isArray(ph.weeks) && ph.weeks.length) {
      const weeks = ph.weeks
        .slice()
        .sort((a, b) => (a.week || 0) - (b.week || 0))
        .map((w) => ({
          week: w.week || 1,
          title: w.title || "",
          days: Array.isArray(w.days) ? w.days : undefined,
          items: (w.items || []).map((it) => normItem(it, ph.id, w.week, w.title)),
        }));
      const code = String(ph.id).replace(/\D/g, "") || "0";
      return { id: ph.id, code: code.padStart(2, "0"), title: ph.title, sub: ph.sub || "", weeks };
    }
    const weeksMap = {};
    for (const it of phItems) {
      const w = it.week || 1;
      (weeksMap[w] = weeksMap[w] || []).push(it);
    }
    const weeks = Object.keys(weeksMap)
      .sort((a, b) => a - b)
      .map((w) => ({ week: Number(w), title: "", items: weeksMap[w].map((it) => normItem(it, ph.id, w)) }));
    const code = String(ph.id).replace(/\D/g, "") || "0";
    return { id: ph.id, code: code.padStart(2, "0"), title: ph.title, sub: ph.sub || "", weeks };
  };

  const byPhase = {};
  for (const it of items) {
    (byPhase[it.phaseId] = byPhase[it.phaseId] || []).push(it);
  }

  const mainPhases = [];
  let bonusItems = [];
  let dsaItems = [];

  const isBonus = (ph, phItems) =>
    ph.id === "app-advanced" ||
    /beyond|staff|advanced/i.test(ph.title || "") ||
    (phItems.length > 0 && phItems.every((i) => i.track === "bonus"));

  if (richPhases.length) {
    for (const ph of richPhases) {
      const allPhItems = ph.weeks.flatMap((w) => w.items || []);
      if (isBonus(ph, allPhItems)) {
        for (const w of ph.weeks) for (const it of w.items || []) bonusItems.push(normItem(it, ph.id, w.week, w.title));
        continue;
      }
      const dsa = allPhItems.filter((i) => i.track === "dsa");
      const nonDsa = allPhItems.filter((i) => i.track !== "dsa");
      if (dsa.length) dsaItems.push(...dsa.map((it) => normItem(it, ph.id)));
      if (nonDsa.length) mainPhases.push(buildPhase(ph, nonDsa));
    }
  } else {
    for (const ph of phases) {
      const phItems = byPhase[ph.id] || [];
      if (isBonus(ph, phItems)) {
        bonusItems.push(...phItems);
        continue;
      }
      const dsa = phItems.filter((i) => i.track === "dsa");
      const nonDsa = phItems.filter((i) => i.track !== "dsa");
      if (dsa.length) dsaItems.push(...dsa.map((it) => normItem(it, ph.id)));
      if (nonDsa.length) mainPhases.push(buildPhase(ph, nonDsa));
    }
  }

  const domain = plan.domain || { id: "generic", label: "your subject" };
  const coreItems = items.filter((i) => i.track !== "bonus" && i.track !== "dsa");

  const bonusTitle = bonusItems.length
    ? `Beyond mastery — ${domain.label}`
    : "Beyond mastery (added by Unifies)";
  const parallelTitle = dsaItems.length ? `Practice track — ${domain.label}` : "Practice track";

  return {
    title: plan.title || "My Curriculum",
    phases: mainPhases.length
      ? mainPhases
      : [
          {
            id: "p1",
            code: "01",
            title: `${domain.label} — core route`,
            sub: "",
            weeks: [{ week: 1, title: "", items: coreItems.map((it) => normItem(it, "p1", 1)) }],
          },
        ],
    bonus: {
      id: "bonus",
      title: bonusTitle,
      weeks: bonusItems.length ? [{ week: null, title: "", items: bonusItems }] : [],
    },
    parallelTrack: { id: "dsa", title: parallelTitle, note: "", items: dsaItems },
    _meta: {
      included: plan.included || "",
      added: plan.added || "",
      path: plan.path || [],
      via: plan.via || "heuristic",
      domain,
      mission: plan.mission || {},
      overflow: plan.overflow || { overflow: false, weekCount: 0, message: "" },
      schedule: plan.schedule || [],
    },
  };
}
