// utils/analyze.js
// Turns a user's raw curriculum text into a structured, trackable plan.
// Two paths:
//   1. Serverless AI (preferred): POST /api/analyze
//   2. Heuristic fallback (always works, zero config)
// Both return the SAME shape so the UI doesn't care which path won.

export const DEFAULT_MISSION_DAYS = 90;
export const DEFAULT_ACTIVE_DAYS_PER_WEEK = 5;
export const DEFAULT_DAILY_HOUR_BUDGET = 1;

const DIFFICULTY_BASIC = /(basic|beginner|intro|fundament|getting started|hello world|setup|install|first|basics|101|prerequisite|pre-req)/i;
const DIFFICULTY_MASTERY = /(mastery|teach|explain|mentor|architect|architecture|ambiguous|novel|unsupervised|top\.of\.field|research|publish|tradeoff|trade-off|lead|principal|staff\.level|staff level)/i;
const DIFFICULTY_ADVANCED = /(advanced|expert|staff|system design|scale|distributed|production|deep dive|optimi[sz]ation|security|low\.level|low level)/i;
const TIER_RANK = { basic: 0, intermediate: 1, advanced: 2, mastery: 3 };

const DOMAIN_SIGNALS = [
  { id: "software", label: "Software engineering", score: (t) => (t.match(/\b(python|javascript|typescript|java|react|api|git|system design|algorithm|data structure|frontend|backend|sql|database|docker|kubernetes|ci\/cd)\b/gi) || []).length },
  { id: "math", label: "Mathematics", score: (t) => (t.match(/\b(laplace|fourier|pde|ode|calculus|matrix|eigenvalue|probability|statistics|theorem|integral|differential|vector|tensor|numerical method|complex analysis|stochastic)\b/gi) || []).length },
  { id: "data", label: "Data & ML", score: (t) => (t.match(/\b(machine learning|neural network|regression|classification|pandas|numpy|tensorflow|pytorch|dataset|feature engineering|clustering)\b/gi) || []).length },
  { id: "design", label: "Design", score: (t) => (t.match(/\b(figma|typography|color theory|ux|ui|wireframe|prototyp|accessibility|design system)\b/gi) || []).length },
];

function detectDomain(text) {
  const scores = DOMAIN_SIGNALS.map((d) => ({ id: d.id, label: d.label, s: d.score(text) }));
  scores.sort((a, b) => b.s - a.s);
  if (scores[0].s === 0) return { id: "generic", label: "your subject" };
  return { id: scores[0].id, label: scores[0].label };
}

function slug(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48); }
function inferDifficulty(text) {
  if (DIFFICULTY_MASTERY.test(text)) return "mastery";
  if (DIFFICULTY_ADVANCED.test(text)) return "advanced";
  if (DIFFICULTY_BASIC.test(text)) return "basic";
  return "intermediate";
}
function makeId(prefix, i) { return prefix + "-" + (i + 1); }
function parseHours(line) { const m = line.match(/\(?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*\)?/i); return m ? parseFloat(m[1]) : null; }
function stripHours(title) { return title.replace(/\s*\(?\s*\d+(?:\.\d+)?\s*(?:hours?|hrs?|h)\s*\)?\s*$/i, "").trim(); }

// ── MODULE DETECTION ──
// Detect Module/Unit/Chapter headers and capture the body paragraph that follows.
function extractModules(text) {
  // Must match "Module 1: Title (8 Hours)" style headers
  const RE = /^(Module|Unit|Chapter|Section|Week)\s+(\d+)\s*[:.\)]?\s*(.*?)(?:\s*\(?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*\)?)?\s*$/im;
  const lines = text.split(/\r?\n/);
  const modules = [];
  let cur = null, body = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { if (cur) body.push(""); continue; }
    const m = line.match(RE);
    if (m) {
      if (cur) { cur.body = body.filter(Boolean).join(" "); modules.push(cur); }
      cur = { type: m[1], number: parseInt(m[2], 10), title: (m[3] || "").trim(), hours: m[4] ? parseFloat(m[4]) : null };
      body = [];
    } else if (cur) {
      body.push(line);
    }
  }
  if (cur) { cur.body = body.filter(Boolean).join(" "); modules.push(cur); }
  return modules;
}

// Split a module's body paragraph into atomic topic items.
// Sentence boundaries first, then commas/semicolons within each sentence.
// Protects parenthetical groups (e.g., "(e.g., ODE, PDE)") from being split.
function segmentModuleBody(body) {
  if (!body || !body.trim()) return [];
  // Protect parenthetical content by replacing it with a placeholder before splitting
  const parens = [];
  const cleaned = body.replace(/\([^)]*\)/g, (m) => { parens.push(m); return "\x00PAREN" + (parens.length - 1) + "\x00"; });
  const sentences = cleaned.split(/(?<=\.)\s+(?=[A-Z0-9])/).map(s => s.trim()).filter(Boolean);
  const items = [];
  for (const sent of sentences) {
    for (const part of sent.split(/\s*[,;]\s*/).filter(Boolean)) {
      let c = part.replace(/^and\s+/i, "").replace(/\.+$/, "").trim();
      // Restore parenthetical content
      c = c.replace(/\x00PAREN(\d+)\x00/g, (_, d) => parens[parseInt(d, 10)] || "");
      if (c.length < 4) continue;
      items.push(c.charAt(0).toUpperCase() + c.slice(1));
    }
  }
  return items;
}

// ── OUTPUT VALIDATION (Directive §6) ──
// Post-processing check: no single topic entry should contain delimiter-separated concepts.
// If one slipped through, re-split it into multiple items.
function validateSegmentedOutput(topics) {
  const out = [];
  for (const t of topics) {
    const raw = t.name;
    // Only flag entries that are clearly a multi-concept list (long enough, has delimiters)
    if (raw.length > 15 && (raw.includes(",") || raw.includes(";"))) {
      // Split on comma or semicolon into distinct concept phrases
      const splits = raw.split(/\s*[,;]\s*/).map(p => p.charAt(0).toUpperCase() + p.slice(1).trim()).filter(p => p.length >= 4);
      if (splits.length > 1) {
        for (const s of splits) {
          out.push({ ...t, name: s });
        }
        continue;
      }
    }
    out.push(t);
  }
  return out;
}

// ── SUPPLEMENTAL ITEM GENERATION ──
function generateFoundationItems(domain) {
  const lib = {
    software: [{text:"Setting up your development environment",hours:3},{text:"Version control with Git basics",hours:3},{text:"Command line fundamentals",hours:2},{text:"Code editors and productivity tools",hours:2}],
    math: [{text:"Prerequisite algebra review",hours:4},{text:"Basic function concepts and graphing",hours:3},{text:"Fundamental theorem understanding",hours:3}],
    data: [{text:"Data types and basic statistics review",hours:3},{text:"Setting up Python data environment",hours:2},{text:"Reading and parsing data files",hours:3}],
    design: [{text:"Design principles and visual hierarchy",hours:3},{text:"Color theory basics",hours:2},{text:"Typography fundamentals",hours:2}],
  };
  const items = lib[domain.id] || [{text:"Core concepts and terminology",hours:3},{text:"Fundamental principles and frameworks",hours:3},{text:"Getting started with the basics",hours:2}];
  return items.map(b => ({ name: b.text, hours: b.hours, difficulty: "basic", source: "app", phaseTitle: "Foundations", review: false }));
}

function generateAdvancedItems(domain) {
  const lib = {
    software: [{text:"System architecture and design patterns",difficulty:"advanced",hours:6},{text:"Performance optimization and profiling",difficulty:"advanced",hours:5},{text:"Security best practices and threat modeling",difficulty:"advanced",hours:5},{text:"Teaching and mentoring explaining tradeoffs to peers",difficulty:"mastery",hours:4}],
    math: [{text:"Advanced problem-solving strategies",difficulty:"advanced",hours:5},{text:"Research paper reading and application",difficulty:"advanced",hours:5},{text:"Novel problem framing and solution design",difficulty:"mastery",hours:4}],
    data: [{text:"Model optimization and hyperparameter tuning",difficulty:"advanced",hours:6},{text:"Deploying ML models to production",difficulty:"advanced",hours:5},{text:"Architecting end-to-end data pipelines",difficulty:"mastery",hours:5}],
    design: [{text:"Design system architecture and tokens",difficulty:"advanced",hours:5},{text:"Accessibility-first design patterns",difficulty:"advanced",hours:4},{text:"Leading design critique and mentoring juniors",difficulty:"mastery",hours:4}],
  };
  const items = lib[domain.id] || [{text:"Advanced applications and edge cases",difficulty:"advanced",hours:5},{text:"Performance and optimization strategies",difficulty:"advanced",hours:4},{text:"Architecting solutions for complex problems",difficulty:"mastery",hours:4}];
  return items.map(a => ({ name: a.text, hours: a.hours, difficulty: a.difficulty, source: "app", phaseTitle: "Advanced & Mastery", review: false }));
}

// ── OUTPUT BUILDER ──
function buildPlanOutput(opt) {
  const { userTopics, schedule, overflow, weekCount, domain, title, missionDays, activeDaysPerWeek, dailyHourBudget, addedDescription, includedDescription, phasesData } = opt;
  const items = [], tws = {};
  for (const s of schedule) { (tws[s.topic] = tws[s.topic] || new Set()).add(s.week); }
  userTopics.forEach((t, i) => {
    const w = Array.from(tws[t.name] || []);
    const pw = w.length ? Math.min(...w) : 1;
    items.push({ id: makeId(t.source === "app" ? "a" : "u", i), title: t.name, text: t.name, phaseId: (t.phaseId || (t.phaseTitle ? slug(t.phaseTitle) : null)) || "p1", week: pw, difficulty: t.difficulty, source: t.source || "user", track: "core", hours: t.hours, review: !!t.review, note: t.phaseTitle ? "from " + t.phaseTitle : "" });
  });
  const pn = new Set(schedule.map(s => s.topic));
  const unplaced = userTopics.filter(t => !pn.has(t.name)).map(t => t.name);
  const coverage = { total: userTopics.length, userItems: userTopics.filter(t => t.source === "user").length, addedItems: userTopics.filter(t => t.source === "app").length, unplaced, percent: userTopics.length ? Math.round((userTopics.length - unplaced.length) / userTopics.length * 100) : 100 };
  let phases;
  if (phasesData && phasesData.length > 0) { phases = phasesData; }
  else {
    const wm = {};
    for (const s of schedule) { (wm[s.week] = wm[s.week] || new Map()); wm[s.week].set(s.day, { day: s.day, topic: s.topic, hours: s.hours, cumInTopic: s.cumInTopic }); }
    const weeks = Object.keys(wm).map(Number).sort((a, b) => a - b).map(w => {
      const dl = wm[w] ? Array.from(wm[w].values()).sort((a, b) => a.day - b.day) : [];
      const tt = [...new Set(dl.map(d => d.topic))];
      return { week: w, title: tt.length === 1 ? tt[0] : tt.length + " topics", days: dl, items: items.filter(it => it.week === w) };
    });
    phases = [{ id: "p1", title: domain.label + " — core route", sub: "Paced over " + (weekCount || 1) + " week(s) · " + activeDaysPerWeek + " active days/wk · " + dailyHourBudget + "h/day", weeks }];
  }
  const included = includedDescription || "Your syllabus covered " + userTopics.filter(t => t.source === "user").length + " topic(s).";
  const added = addedDescription || "Offline planner: no generic beyond mastery was added. For subject-tailored advanced suggestions, configure an AI endpoint.";
  return { title: title || "My Curriculum", phases, items, included, added, path: phases.map(p => p.title), domain, mission: { days: missionDays, activeDaysPerWeek, dailyHourBudget }, overflow, schedule, coverage };
}

function buildPhasesFromModules(modules, domain, missionDays, activeDaysPerWeek, dailyHourBudget) {
  let allTopics = [];
  const phaseDataItems = [];
  for (const mod of modules) {
    const mt = segmentModuleBody(mod.body);
    if (mt.length === 0) mt.push(mod.title || mod.type + " " + mod.number);
    const ps = slug(mod.type + "-" + mod.number + "-" + mod.title) || "phase-" + mod.number;
    const pt = mod.type + " " + mod.number + ": " + mod.title;
    const mi = mt.map(topic => ({ name: topic, hours: mod.hours ? Math.max(1, Math.round(mod.hours / mt.length)) : 2, difficulty: inferDifficulty(topic), source: "user", phaseTitle: pt, phaseSlug: ps, review: false }));
    allTopics.push(...mi);
    phaseDataItems.push({ items: mi, phaseTitle: pt, phaseSlug: ps, modHours: mod.hours });
  }
  phaseDataItems.sort((a, b) => { const an = parseInt((a.phaseSlug.match(/\d+/) || ["0"])[0], 10); const bn = parseInt((b.phaseSlug.match(/\d+/) || ["0"])[0], 10); return an - bn; });
  const { schedule, overflow, weekCount } = buildSchedule(allTopics.map(t => ({ name: t.name, hours: t.hours })), missionDays, activeDaysPerWeek, dailyHourBudget);
  const wm = {};
  for (const s of schedule) { (wm[s.week] = wm[s.week] || new Map()); wm[s.week].set(s.day, { day: s.day, topic: s.topic, hours: s.hours, cumInTopic: s.cumInTopic }); }
  const phases = [];
  for (const pd of phaseDataItems) {
    const mnames = new Set(pd.items.map(t => t.name));
    const rw = new Set();
    for (const s of schedule) { if (mnames.has(s.topic)) rw.add(s.week); }
    const sw = Array.from(rw).sort((a, b) => a - b);
    const wo = sw.map(w => {
      const dl = wm[w] ? Array.from(wm[w].values()).sort((a, b) => a.day - b.day) : [];
      const tt = [...new Set(dl.map(d => d.topic))];
      const pi = pd.items.filter(t => mnames.has(t.name)).map((t, idx) => ({ id: makeId("m" + pd.phaseSlug, idx), title: t.name, text: t.name, phaseId: pd.phaseSlug, week: w, difficulty: t.difficulty, source: "user", track: "core", hours: t.hours, review: false, note: "from " + pd.phaseTitle }));
      return { week: w, title: tt.length === 1 ? tt[0] : tt.length + " topics", days: dl, items: pi };
    });
    const num = (pd.phaseSlug.match(/\d+/) || [String(phases.length + 1)])[0];
    phases.push({ id: pd.phaseSlug, code: String(num).padStart(2, "0"), title: pd.phaseTitle, sub: pd.modHours ? pd.modHours + " hours · " + sw.length + " week(s)" : sw.length + " week(s)", weeks: wo });
  }
  return { phases, allTopics, schedule, overflow, weekCount };
}

// ── SCHEDULER ──
export function buildSchedule(topics, missionDays, activeDaysPerWeek, dailyHourBudget) {
  const isActiveDay = (day) => ((day - 1) % 7) < activeDaysPerWeek;
  const schedule = [];
  let currentDay = 1, overflowTopic = null;
  for (const topic of topics) {
    let hoursRemaining = topic.hours, cumInTopic = 0;
    while (hoursRemaining > 0) {
      if (isActiveDay(currentDay)) {
        const hoursToday = Math.min(dailyHourBudget, hoursRemaining);
        cumInTopic += hoursToday;
        schedule.push({ day: currentDay, week: Math.ceil(currentDay / 7), topic: topic.name, hours: hoursToday, cumInTopic });
        hoursRemaining -= hoursToday;
      }
      currentDay += 1;
      if (currentDay > missionDays) { overflowTopic = topic.name; break; }
    }
    if (overflowTopic) break;
  }
  const weekCount = schedule.length ? Math.max(...schedule.map(s => s.week)) : 0;
  const overflow = { overflow: !!overflowTopic, weekCount, message: "" };
  if (overflowTopic) overflow.message = 'Your pace fits the first ' + weekCount + ' week(s) inside the ' + missionDays + '-day mission, but "' + overflowTopic + '" and later topics do not fit. Raise your daily hours, add active days/week, or extend the mission window.';
  return { schedule, overflow, weekCount };
}

// ── MAIN HEURISTIC ──
export function heuristicStructure(raw, opts) {
  opts = opts || {};
  const text = (raw || "").trim();
  const missionDays = opts.missionDays || DEFAULT_MISSION_DAYS;
  const activeDaysPerWeek = opts.activeDaysPerWeek || DEFAULT_ACTIVE_DAYS_PER_WEEK;
  const dailyHourBudget = opts.dailyHourBudget || DEFAULT_DAILY_HOUR_BUDGET;

  if (!text) return { title: "My Curriculum", phases: [], items: [], included: "", added: "", path: [], domain: { id: "generic", label: "your subject" }, mission: { days: missionDays, activeDaysPerWeek, dailyHourBudget }, overflow: { overflow: false, weekCount: 0, message: "" }, schedule: [] };

  const domain = detectDomain(text);

  // ── PATH 1: Module-aware ──
  const modules = extractModules(text);
  if (modules.length > 0) {
    const { phases: modulePhases, allTopics } = buildPhasesFromModules(modules, domain, missionDays, activeDaysPerWeek, dailyHourBudget);
    const hasBasic = allTopics.some(t => t.difficulty === "basic");
    const hasAdvanced = allTopics.some(t => t.difficulty === "advanced" || t.difficulty === "mastery");
    let fullTopics = allTopics.slice();
    const parts = [];
    if (!hasBasic) { fullTopics = generateFoundationItems(domain).concat(fullTopics); parts.push("Foundational basics"); }
    if (!hasAdvanced) { fullTopics = fullTopics.concat(generateAdvancedItems(domain)); parts.push("Advanced & Mastery content"); }
    const desc = parts.length ? "Unifies added: " + parts.join(", ") + "." : "";

    // ── Output validation (directive §6): check no day entry has leftover delimiters ──
    fullTopics = validateSegmentedOutput(fullTopics);

    const { schedule, overflow, weekCount } = buildSchedule(fullTopics.map(t => ({ name: t.name, hours: t.hours })), missionDays, activeDaysPerWeek, dailyHourBudget);
    const inc = "Your syllabus covered " + fullTopics.filter(t => t.source === "user").length + " topic(s) across " + modules.length + " module(s).";
    return buildPlanOutput({ userTopics: fullTopics, schedule, overflow, weekCount, domain, title: "My Curriculum", missionDays, activeDaysPerWeek, dailyHourBudget, addedDescription: desc, includedDescription: inc, phasesData: modulePhases });
  }

  // ── PATH 2: Line-by-line (unstructured text with optional headings) ──
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const headingTopics = {};
  const headingOrder = [];
  let currentPhaseTitle = null;

  for (const line of lines) {
    const h1 = line.match(/^#+\s+(.*)$/);
    if (h1) {
      currentPhaseTitle = h1[1].trim();
      if (line.length < 80 && currentPhaseTitle && !headingTopics[currentPhaseTitle]) {
        headingTopics[currentPhaseTitle] = []; headingOrder.push(currentPhaseTitle);
      }
      continue;
    }
    const hm = line.match(/^(Phase|Section|Unit)\s*\d*\s*[:.\-]?\s*(.*)$/i);
    if (hm && line.length < 80) {
      currentPhaseTitle = (hm[2] || hm[1] + " " + (hm[2] || "")).trim();
      if (currentPhaseTitle && !headingTopics[currentPhaseTitle]) { headingTopics[currentPhaseTitle] = []; headingOrder.push(currentPhaseTitle); }
      continue;
    }
    const itMatch = line.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    const rawTitle = itMatch ? itMatch[2].trim() : line;
    if (!rawTitle) continue;
    const hours = parseHours(rawTitle);
    const title = stripHours(rawTitle);
    if (!title) continue;
    const topic = { name: title, hours: hours !== null ? hours : 4, difficulty: inferDifficulty(title), phaseTitle: currentPhaseTitle || null, review: /(review|recap|revisit|spiral|refresh|reinforce)/i.test(title), source: "user" };
    if (currentPhaseTitle && headingTopics[currentPhaseTitle]) headingTopics[currentPhaseTitle].push(topic);
    else { if (!headingTopics.__main) { headingTopics.__main = []; headingOrder.push("__main"); } headingTopics.__main.push(topic); }
  }

  let userTopics = [];
  for (const h of headingOrder) userTopics.push(...(headingTopics[h] || []));
  if (userTopics.length === 0) userTopics.push({ name: text.slice(0, 120), hours: 4, difficulty: "intermediate", phaseTitle: null, review: false, source: "user" });

  // Prerequisite-aware sort
  const orderSeen = new Map();
  userTopics.forEach((t, i) => { if (!orderSeen.has(t.name)) orderSeen.set(t.name, i); });
  userTopics.sort((a, b) => { const r = (TIER_RANK[a.difficulty] || 1) - (TIER_RANK[b.difficulty] || 1); return r !== 0 ? r : ((orderSeen.get(a.name) || 0) - (orderSeen.get(b.name) || 0)); });

  // Add supplemental items if tiers are missing
  const hasBasic = userTopics.some(t => t.difficulty === "basic");
  const hasAdvanced = userTopics.some(t => t.difficulty === "advanced" || t.difficulty === "mastery");
  let fullTopics = userTopics.slice();
  const parts = [];
  if (!hasBasic) { fullTopics = generateFoundationItems(domain).concat(fullTopics); parts.push("Foundational basics"); }
  if (!hasAdvanced) { fullTopics = fullTopics.concat(generateAdvancedItems(domain)); parts.push("Advanced & Mastery content"); }
  const desc = parts.length ? "Unifies added: " + parts.join(", ") + "." : "";

  // ── Output validation (directive §6): re-split any topic with leftover delimiters ──
  fullTopics = validateSegmentedOutput(fullTopics);

  const { schedule, overflow, weekCount } = buildSchedule(fullTopics.map(t => ({ name: t.name, hours: t.hours })), missionDays, activeDaysPerWeek, dailyHourBudget);

  // Build phases from heading groups + supplemental phases
  const phasesData = [];
  let phaseIndex = 0;

  // Foundation phase (if added)
  if (!hasBasic) {
    const fi = generateFoundationItems(domain);
    const fnames = new Set(fi.map(t => t.name));
    const fwm = {};
    for (const s of schedule) { if (fnames.has(s.topic)) { (fwm[s.week] = fwm[s.week] || new Map()); fwm[s.week].set(s.day, { day: s.day, topic: s.topic, hours: s.hours, cumInTopic: s.cumInTopic }); } }
    const fsw = Object.keys(fwm).map(Number).sort((a, b) => a - b);
    const fwo = fsw.map(w => {
      const dl = fwm[w] ? Array.from(fwm[w].values()).sort((a, b) => a.day - b.day) : [];
      const tt = [...new Set(dl.map(d => d.topic))];
      const pi = fi.map((t, idx) => ({ id: makeId("phfoundations", idx), title: t.name, text: t.name, phaseId: "foundations", week: w, difficulty: "basic", source: "app", track: "core", hours: t.hours, review: false, note: "from Foundations" }));
      return { week: w, title: tt.length === 1 ? tt[0] : tt.length + " topics", days: dl, items: pi };
    });
    if (fwo.length > 0) { phasesData.push({ id: "foundations", code: String(++phaseIndex).padStart(2, "0"), title: "Foundations", sub: fsw.length + " week(s)", weeks: fwo }); }
  }

  // User heading-based phases
  if (headingOrder.length > 0 && headingOrder[0] !== "__main") {
    for (const h of headingOrder) {
      const pt = headingTopics[h] || [];
      if (pt.length === 0) continue;
      const pnames = new Set(pt.map(t => t.name));
      const wm = {};
      for (const s of schedule) { if (pnames.has(s.topic)) { (wm[s.week] = wm[s.week] || new Map()); wm[s.week].set(s.day, { day: s.day, topic: s.topic, hours: s.hours, cumInTopic: s.cumInTopic }); } }
      const sw = Object.keys(wm).map(Number).sort((a, b) => a - b);
      const wo = sw.map(w => {
        const dl = wm[w] ? Array.from(wm[w].values()).sort((a, b) => a.day - b.day) : [];
        const tt = [...new Set(dl.map(d => d.topic))];
        const pi = pt.filter(t => pnames.has(t.name)).map((t, idx) => ({ id: makeId("ph" + slug(h), idx), title: t.name, text: t.name, phaseId: slug(h), week: w, difficulty: t.difficulty, source: t.source, track: "core", hours: t.hours, review: !!t.review, note: "from " + h }));      return { week: w, title: tt.length === 1 ? tt[0] : tt.length + " topics", days: dl, items: pi };
    });
      phasesData.push({ id: slug(h), code: String(++phaseIndex).padStart(2, "0"), title: h, sub: sw.length + " week(s)", weeks: wo });
    }
  }

  // Advanced phase (if added)
  if (!hasAdvanced) {
    const ai = generateAdvancedItems(domain);
    const anames = new Set(ai.map(t => t.name));
    const awm = {};
    for (const s of schedule) { if (anames.has(s.topic)) { (awm[s.week] = awm[s.week] || new Map()); awm[s.week].set(s.day, { day: s.day, topic: s.topic, hours: s.hours, cumInTopic: s.cumInTopic }); } }
    const asw = Object.keys(awm).map(Number).sort((a, b) => a - b);
    const awo = asw.map(w => {
      const dl = awm[w] ? Array.from(awm[w].values()).sort((a, b) => a.day - b.day) : [];
      const tt = [...new Set(dl.map(d => d.topic))];
      const pi = ai.map((t, idx) => ({ id: makeId("phadvanced", idx), title: t.name, text: t.name, phaseId: "advanced", week: w, difficulty: t.difficulty, source: "app", track: "core", hours: t.hours, review: false, note: "from Advanced & Mastery" }));
      return { week: w, title: tt.length === 1 ? tt[0] : tt.length + " topics", days: dl, items: pi };
    });
    if (awo.length > 0) { phasesData.push({ id: "advanced", code: String(++phaseIndex).padStart(2, "0"), title: "Advanced & Mastery", sub: asw.length + " week(s)", weeks: awo }); }
  }

  const inc = "Your syllabus covered " + fullTopics.filter(t => t.source === "user").length + " topic(s).";
  return buildPlanOutput({ userTopics: fullTopics, schedule, overflow, weekCount, domain, title: "My Curriculum", missionDays, activeDaysPerWeek, dailyHourBudget, addedDescription: desc, includedDescription: inc, phasesData: phasesData.length > 0 ? phasesData : null });
}

// ── AI ANALYZE ──
export async function analyzeCurriculum(raw, opts) {
  opts = opts || {};
  const { onStatus } = opts;
  const text = (raw || "").trim();
  if (!text) return { plan: heuristicStructure("", opts), via: "heuristic" };

  if (onStatus) onStatus("Asking Unifies AI to structure your plan\u2026");
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mission: { days: opts.missionDays || DEFAULT_MISSION_DAYS, activeDaysPerWeek: opts.activeDaysPerWeek || DEFAULT_ACTIVE_DAYS_PER_WEEK, dailyHourBudget: opts.dailyHourBudget || DEFAULT_DAILY_HOUR_BUDGET } }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (res.status === 429) {
      if (onStatus) onStatus("AI is busy right now \u2014 using the offline planner instead.");
      return { plan: heuristicStructure(text, opts), via: "heuristic", rateLimited: true };
    }
    if (!res.ok) return { plan: heuristicStructure(text, opts), via: "heuristic" };

    const data = await res.json();
    const hasRich = Array.isArray(data.phases) && data.phases.some(p => Array.isArray(p.weeks) && p.weeks.length);
    const hasFlat = Array.isArray(data.items) && data.items.length > 0;
    if (!data || (!hasRich && !hasFlat)) return { plan: heuristicStructure(text, opts), via: "heuristic" };

    if (hasRich) {
      return { plan: { title: data.title || "My Curriculum", phases: data.phases, items: data.items || [], included: data.included || "", added: data.added || "", path: Array.isArray(data.path) ? data.path : [], domain: data.domain || { id: "generic", label: "your subject" }, mission: data.mission || opts, overflow: data.overflow || { overflow: false, weekCount: 0, message: "" }, schedule: data.schedule || [], coverage: data.coverage || null }, via: "ai" };
    }

    const items = data.items.map((it, i) => ({ id: it.id || makeId(it.phaseId || "p", i), title: String(it.title || "").trim(), text: String(it.title || "").trim(), phaseId: it.phaseId, week: it.week || undefined, difficulty: it.difficulty || inferDifficulty(it.title || ""), source: it.source === "app" ? "app" : "user", milestone: !!it.milestone, note: it.note || "", track: it.track || "core", hours: it.hours || undefined, review: !!it.review }));
    return { plan: { title: data.title || "My Curriculum", phases: Array.isArray(data.phases) ? data.phases : [], items, included: data.included || "", added: data.added || "", path: Array.isArray(data.path) ? data.path : [], domain: data.domain || { id: "generic", label: "your subject" }, mission: data.mission || opts, overflow: data.overflow || { overflow: false, weekCount: 0, message: "" }, schedule: data.schedule || [], coverage: data.coverage || null }, via: "ai" };
  } catch (err) {
    if (onStatus) onStatus("Using the offline planner (no AI endpoint).");
    return { plan: heuristicStructure(text, opts), via: "heuristic" };
  }
}

export const _internal = { detectDomain, parseHours, stripHours, inferDifficulty, slug, buildSchedule, extractModules, segmentModuleBody, validateSegmentedOutput };
export { extractModules, segmentModuleBody };
export { inferDifficulty };

// ── PLAN TO CURRICULUM ──
export function planToCurriculum(plan) {
  const phases = plan.phases || [];
  const items = plan.items || [];
  const richPhases = phases.filter(p => Array.isArray(p.weeks) && p.weeks.length);

  const normItem = (it, phaseId, week, weekTitle) => ({
    id: it.id || makeId(phaseId || "p", Math.random()),
    title: String(it.title || "").trim(), text: String(it.text || it.title || "").trim(),
    phaseId: it.phaseId || phaseId, week: it.week != null ? Number(it.week) : week != null ? Number(week) : undefined,
    weekTitle: it.weekTitle || weekTitle || null, difficulty: it.difficulty || inferDifficulty(it.title || ""),
    source: it.source === "app" ? "app" : "user", milestone: !!it.milestone, note: it.note || "",
    track: it.track || "core", hours: it.hours || undefined, review: !!it.review,
  });

  const buildPhase = (ph, phItems) => {
    if (Array.isArray(ph.weeks) && ph.weeks.length) {
      const weeks = ph.weeks.slice().sort((a, b) => (a.week || 0) - (b.week || 0)).map(w => ({ week: w.week || 1, title: w.title || "", days: Array.isArray(w.days) ? w.days : undefined, items: (w.items || []).map(it => normItem(it, ph.id, w.week, w.title)) }));
      const code = String(ph.id).replace(/\D/g, "") || "0";
      return { id: ph.id, code: code.padStart(2, "0"), title: ph.title, sub: ph.sub || "", weeks };
    }
    const wm = {};
    for (const it of phItems) { const w = it.week || 1; (wm[w] = wm[w] || []).push(it); }
    const weeks = Object.keys(wm).sort((a, b) => a - b).map(w => ({ week: Number(w), title: "", items: wm[w].map(it => normItem(it, ph.id, w)) }));
    const code = String(ph.id).replace(/\D/g, "") || "0";
    return { id: ph.id, code: code.padStart(2, "0"), title: ph.title, sub: ph.sub || "", weeks };
  };

  const byPhase = {};
  for (const it of items) { (byPhase[it.phaseId] = byPhase[it.phaseId] || []).push(it); }

  const mainPhases = [], bonusItems = [], dsaItems = [];

  const isBonus = (ph, phItems) => ph.id === "app-advanced" || /beyond|staff|advanced/i.test(ph.title || "") || (phItems.length > 0 && phItems.every(i => i.track === "bonus"));

  if (richPhases.length) {
    for (const ph of richPhases) {
      const all = ph.weeks.flatMap(w => w.items || []);
      if (isBonus(ph, all)) { for (const w of ph.weeks) for (const it of w.items || []) bonusItems.push(normItem(it, ph.id, w.week, w.title)); continue; }
      const dsa = all.filter(i => i.track === "dsa");
      const non = all.filter(i => i.track !== "dsa");
      if (dsa.length) dsaItems.push(...dsa.map(it => normItem(it, ph.id)));
      if (non.length) mainPhases.push(buildPhase(ph, non));
    }
  } else {
    for (const ph of phases) {
      const phItems = byPhase[ph.id] || [];
      if (isBonus(ph, phItems)) { bonusItems.push(...phItems); continue; }
      const dsa = phItems.filter(i => i.track === "dsa");
      const non = phItems.filter(i => i.track !== "dsa");
      if (dsa.length) dsaItems.push(...dsa.map(it => normItem(it, ph.id)));
      if (non.length) mainPhases.push(buildPhase(ph, non));
    }
  }

  const domain = plan.domain || { id: "generic", label: "your subject" };
  const coreItems = items.filter(i => i.track !== "bonus" && i.track !== "dsa");
  const bonusTitle = bonusItems.length ? "Beyond mastery \u2014 " + domain.label : "Beyond mastery (added by Unifies)";
  const parallelTitle = dsaItems.length ? "Practice track \u2014 " + domain.label : "Practice track";

  return {
    title: plan.title || "My Curriculum",
    phases: mainPhases.length ? mainPhases : [{ id: "p1", code: "01", title: domain.label + " — core route", sub: "", weeks: [{ week: 1, title: "", items: coreItems.map(it => normItem(it, "p1", 1)) }] }],
    bonus: { id: "bonus", title: bonusTitle, weeks: bonusItems.length ? [{ week: null, title: "", items: bonusItems }] : [] },
    parallelTrack: { id: "dsa", title: parallelTitle, note: "", items: dsaItems },
    _meta: { included: plan.included || "", added: plan.added || "", path: plan.path || [], via: plan.via || "heuristic", domain, mission: plan.mission || {}, overflow: plan.overflow || { overflow: false, weekCount: 0, message: "" }, schedule: plan.schedule || [], coverage: plan.coverage || { total: items.length, userItems: items.filter(i => i.source === "user").length, addedItems: items.filter(i => i.source === "app").length, unplaced: [], percent: 100 } },
  };
}
