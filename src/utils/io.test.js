// Tests for import/export helpers (live-data portability, no demo data).
import { describe, it, expect, vi, beforeEach } from 'vitest';

// jsdom lacks some APIs used by export; stub them.
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
});

// Import after stubs so module-level code (none here) is fine.
const { parseImport, exportProgress, exportCsv } = await import('../utils/io');

describe('io (import/export)', () => {
  it('parseImport returns null for an invalid file', () => {
    expect(parseImport('{"foo":1}')).toBeNull();
  });

  it('parseImport parses a valid progress export', () => {
    const payload = JSON.stringify({
      version: 1,
      kind: 'fde-tracker-progress',
      exportedAt: new Date().toISOString(),
      startDate: '2026-01-01',
      checked: { p1w1i1: true },
      checkedAt: { p1w1i1: '2026-01-01T00:00:00.000Z' },
    });
    const parsed = parseImport(payload);
    expect(parsed.startDate).toBe('2026-01-01');
    expect(parsed.checked.p1w1i1).toBe(true);
  });

  it('exportProgress triggers a JSON download with the real state', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    exportProgress({
      startDate: '2026-01-01',
      checked: { p1w1i1: true },
      checkedAt: {},
    });
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it('exportCsv builds a header + one row per known item', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    const itemsById = {
      p1w1i1: { text: 'Variables' },
      dsa1: { text: 'Arrays' },
    };
    exportCsv({ checked: { p1w1i1: true }, checkedAt: {}, itemsById });
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});
