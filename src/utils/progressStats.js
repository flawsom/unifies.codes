// Pure progress-stat helpers. No React, no side effects => trivially testable.
// Operates on two maps:
//   checked:   { [itemId]: true }
//   checkedAt: { [itemId]: ISO timestamp }   (when each item was last checked)
import { DEFAULT_PHASES, DEFAULT_BONUS, DEFAULT_PARALLEL_TRACK } from "../data/curriculum.js";

function allPhaseItems() {
  const out = [];
  for (const phase of DEFAULT_PHASES) {
    for (const w of phase.weeks) out.push(...w.items);
  }
  return out;
}
const PHASE_ITEMS = allPhaseItems();
const PARALLEL_ITEMS = DEFAULT_PARALLEL_TRACK.items;
const BONUS_ITEMS = DEFAULT_BONUS.weeks.flatMap((w) => w.items);

// Counts used by the header stat cards.
export function countDone(checked) {
  const coreDone = PHASE_ITEMS.filter((i) => checked[i.id]).length;
  const dsaDone = PARALLEL_ITEMS.filter((i) => checked[i.id]).length;
  const bonusDone = BONUS_ITEMS.filter((i) => checked[i.id]).length;
  return { coreDone, dsaDone, bonusDone };
}

export function totals() {
  return {
    coreTotal: PHASE_ITEMS.length,
    dsaTotal: PARALLEL_ITEMS.length,
    bonusTotal: BONUS_ITEMS.length,
  };
}

export function corePercent(checked) {
  const { coreDone } = countDone(checked);
  const { coreTotal } = totals();
  return coreTotal ? Math.round((coreDone / coreTotal) * 100) : 0;
}

export function dsaPercent(checked) {
  const { dsaDone } = countDone(checked);
  const { dsaTotal } = totals();
  return dsaTotal ? Math.round((dsaDone / dsaTotal) * 100) : 0;
}

// "YYYY-MM-DD" in local time (not UTC) so streaks match what the user sees.
export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Build a set of day-strings from a checkedAt map.
export function daySetFromCheckedAt(checkedAt) {
  const set = new Set();
  for (const id of Object.keys(checkedAt || {})) {
    set.add(todayStr(new Date(checkedAt[id])));
  }
  return set;
}

// Current streak: consecutive days (ending today or within `graceDays`) with
// >=1 check-in. While walking backward we tolerate up to `graceDays` *consecutive*
// missed days, so a single missed day doesn't wipe the streak — the #1 complaint
// in habit apps. (e.g. checked today + 2 days ago, yesterday missed => streak 2.)
export function currentStreak(daySet, graceDays = 1) {
  const days = new Set(daySet);
  const today = new Date();
  let streak = 0;
  let misses = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 3650; i++) {
    if (days.has(todayStr(cursor))) {
      streak += 1;
      misses = 0;
    } else {
      misses += 1;
      if (misses > graceDays) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Longest streak over the whole history.
export function longestStreak(daySet) {
  const days = Array.from(new Set(daySet)).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && dayDiff(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

function dayDiff(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000);
}

// Count how many of the last 7 days had activity (for the heatmap header).
export function activeLast7(daySet) {
  const days = new Set(daySet);
  const today = new Date();
  let active = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(todayStr(d))) active += 1;
  }
  return active;
}

// Build a GitHub-style activity grid for the last `weeks` weeks (default 17).
// Returns columns of days; each cell has { date, count } where count is the
// number of items checked that day. Used by <ActivityHeatmap/>.
export function buildHeatmap(checkedAt, weeks = 17) {
  const byDay = new Map();
  for (const id of Object.keys(checkedAt || {})) {
    const key = todayStr(new Date(checkedAt[id]));
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }
  const today = new Date();
  const totalDays = weeks * 7;
  // End on today; start on the Sunday on/before (today - totalDays + 1).
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(today.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay()); // back up to Sunday
  const cells = [];
  const cur = new Date(start);
  while (cur <= end) {
    const key = todayStr(cur);
    cells.push({ date: key, count: byDay.get(key) || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  // chunk into weeks (columns of 7)
  const columns = [];
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));
  return columns;
}

// Overall percent across all items (phases + dsa + bonus).
export function overallPercent(checked) {
  const { coreDone, dsaDone, bonusDone } = countDone(checked);
  const { coreTotal, dsaTotal, bonusTotal } = totals();
  const total = coreTotal + dsaTotal + bonusTotal;
  if (!total) return 0;
  return Math.round(((coreDone + dsaDone + bonusDone) / total) * 100);
}

// --- Gamification (live, derived — never stored as "demo" data) ---

export const XP_PER_ITEM = 10;
export const XP_PER_MILESTONE = 50;

export function xpForItem(item) {
  if (!item) return XP_PER_ITEM;
  return /milestone/i.test(item.text || "") ? XP_PER_MILESTONE : XP_PER_ITEM;
}

export function totalXp(checked, items) {
  let xp = 0;
  for (const item of items || []) {
    if (checked[item.id]) xp += xpForItem(item);
  }
  return xp;
}

export function levelFromXp(xp) {
  let level = 1;
  let needed = 100;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed += 50;
  }
  return { level, intoLevel: remaining, neededForNext: needed, pct: Math.round((remaining / needed) * 100) };
}

export function momentumPercent(daySet) {
  return Math.round((activeLast7(daySet) / 7) * 100);
}
