// Tests for the pure progress-stat helpers. These are the functions that drive
// the header stat cards, the streak counter, and the GitHub-style heatmap.
// Keeping them pure (no React, no I/O) makes them fast, deterministic, and the
// single source of truth the UI renders.
import { describe, it, expect } from 'vitest';
import {
  countDone,
  totals,
  corePercent,
  dsaPercent,
  overallPercent,
  todayStr,
  daySetFromCheckedAt,
  currentStreak,
  longestStreak,
  activeLast7,
  momentumPercent,
  buildHeatmap,
  xpForItem,
  totalXp,
  levelFromXp,
} from '../utils/progressStats';
import { allItems } from '../data/curriculum';

describe('countDone / totals', () => {
  it('starts at zero when nothing is checked', () => {
    const { coreDone, dsaDone, bonusDone } = countDone({});
    expect(coreDone).toBe(0);
    expect(dsaDone).toBe(0);
    expect(bonusDone).toBe(0);
  });

  it('counts checked phase + parallel + bonus items', () => {
    const checked = {
      // two phase items, one dsa, one bonus
      p1w1i1: true,
      p1w1i2: true,
      dsa1: true,
      bi1: true,
    };
    const { coreDone, dsaDone, bonusDone } = countDone(checked);
    expect(coreDone).toBe(2);
    expect(dsaDone).toBe(1);
    expect(bonusDone).toBe(1);
  });

  it('totals reflect the bundled curriculum size', () => {
    const t = totals();
    expect(t.coreTotal).toBeGreaterThan(0);
    expect(t.dsaTotal).toBe(15);
    expect(t.bonusTotal).toBe(9);
  });
});

describe('percentages', () => {
  it('corePercent is 0 with nothing checked', () => {
    expect(corePercent({})).toBe(0);
  });

  it('dsaPercent rounds to nearest integer', () => {
    // 1 of 15 ~= 7%
    expect(dsaPercent({ dsa1: true })).toBe(7);
  });

  it('overallPercent spans all three tracks', () => {
    const checked = { p1w1i1: true, p1w1i2: true, dsa1: true, bi1: true };
    const { coreTotal, dsaTotal, bonusTotal } = totals();
    const total = coreTotal + dsaTotal + bonusTotal;
    const expected = Math.round((4 / total) * 100);
    expect(overallPercent(checked)).toBe(expected);
  });
});

describe('todayStr', () => {
  it('formats as YYYY-MM-DD in local time', () => {
    const d = new Date(2026, 0, 9); // Jan 9, 2026 (local)
    expect(todayStr(d)).toBe('2026-01-09');
  });

  it('zero-pads month and day', () => {
    expect(todayStr(new Date(2026, 2, 3))).toBe('2026-03-03');
  });
});

describe('daySetFromCheckedAt', () => {
  it('maps each item timestamp to a day string', () => {
    const checkedAt = {
      a: new Date(2026, 0, 1, 9).toISOString(),
      b: new Date(2026, 0, 1, 23).toISOString(), // same local day
      c: new Date(2026, 0, 2, 0).toISOString(),
    };
    const set = daySetFromCheckedAt(checkedAt);
    expect(set.has('2026-01-01')).toBe(true);
    expect(set.has('2026-01-02')).toBe(true);
  });
});

describe('streak logic', () => {
  it('currentStreak is 0 with no activity', () => {
    expect(currentStreak(new Set())).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const today = todayStr();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = todayStr(y);
    const yy = new Date();
    yy.setDate(yy.getDate() - 2);
    const twoDaysAgo = todayStr(yy);
    expect(currentStreak(new Set([today, yesterday, twoDaysAgo]))).toBe(3);
  });

  it('tolerates a gap yesterday but counts back from today', () => {
    const today = todayStr();
    const twoDaysAgo = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return todayStr(d);
    })();
    // yesterday missing, but the 1-day grace window bridges it -> today + twoDaysAgo
    expect(currentStreak(new Set([today, twoDaysAgo]))).toBe(2);
  });

  it('longestStreak finds the max run', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10', '2026-01-11'];
    expect(longestStreak(new Set(days))).toBe(3);
  });

  it('activeLast7 counts days active in the trailing week', () => {
    const today = todayStr();
    const d1 = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); })();
    const d3 = (() => { const d = new Date(); d.setDate(d.getDate() - 3); return todayStr(d); })();
    expect(activeLast7(new Set([today, d1, d3]))).toBe(3);
  });
});

describe('buildHeatmap', () => {
  it('returns week-columns of day cells', () => {
    const columns = buildHeatmap({});
    expect(Array.isArray(columns)).toBe(true);
    expect(columns[0].length).toBe(7); // each column is a week
  });

  it('aggregates counts per day from checkedAt', () => {
    // Use dates inside the trailing 17-week window so they appear in the grid.
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d) => todayStr(d);
    const checkedAt = {
      a: today.toISOString(),
      b: today.toISOString(), // second item same day
      c: yesterday.toISOString(),
    };
    const columns = buildHeatmap(checkedAt);
    const flat = columns.flat();
    const day0 = flat.find((c) => c.date === fmt(today));
    const day1 = flat.find((c) => c.date === fmt(yesterday));
    expect(day0.count).toBe(2);
    expect(day1.count).toBe(1);
  });
});

describe('grace-day streak + gamification', () => {
  it('survives a single missed day (graceDays=1)', () => {
    const today = todayStr();
    const twoDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 2); return todayStr(d); })();
    // yesterday missed -> the grace window bridges it, so today + twoDaysAgo = 2
    expect(currentStreak(new Set([today, twoDaysAgo]), 1)).toBe(2);
  });

  it('counts today as a 1-day streak even if the prior history is old', () => {
    const today = todayStr();
    const threeDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 3); return todayStr(d); })();
    // today is a live check-in => streak is at least 1; the 3-day-old entry is
    // separate history and doesn't extend it (gap > grace window).
    expect(currentStreak(new Set([today, threeDaysAgo]), 1)).toBe(1);
  });

  it('bridges a single missed day (grace)', () => {
    const today = todayStr();
    const twoDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 2); return todayStr(d); })();
    // yesterday missed, but within the grace window -> today + twoDaysAgo count.
    expect(currentStreak(new Set([today, twoDaysAgo]), 1)).toBe(2);
  });

  it('xpForItem awards more for milestone items', () => {
    expect(xpForItem({ text: 'Two Sum' })).toBe(10);
    expect(xpForItem({ text: '🎯 Milestone: build the thing' })).toBe(50);
  });

  it('totalXp sums per checked item', () => {
    const checked = { p1w1i1: true, dsa1: true };
    expect(totalXp(checked, allItems)).toBe(20);
  });

  it('levelFromXp ramps and reports progress', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(120).level).toBe(2);
  });

  it('momentumPercent is 0..100', () => {
    const today = todayStr();
    const d1 = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); })();
    expect(momentumPercent(new Set([today, d1]))).toBe(29);
  });
});

describe('curriculum index (command palette source)', () => {
  it('flattens every item with phase context', () => {
    expect(allItems.length).toBeGreaterThan(0);
    const sample = allItems.find((i) => i.id === 'dsa1');
    expect(sample.phaseId).toBe('dsa');
    expect(sample.phaseTitle).toContain('DSA');
  });
});
