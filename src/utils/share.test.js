// Tests for the share helpers. Supabase is OFF in the test env (no env vars),
// so we exercise the localStorage fallback path: publishing stores a snapshot
// and returns a `?u=` link; resolving reads it back.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Ensure Supabase is treated as unconfigured so the localStorage path runs.
vi.mock('../lib/supabaseClient', () => ({
  isSupabaseConfigured: false,
  supabase: null,
}));

import { publishShare, resolveSharedUser } from './share';

describe('share helpers (localStorage path)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('publishShare stores a snapshot and returns a ?u= link', async () => {
    const url = await publishShare({
      username: 'jane',
      snapshot: {
        checked: { p1w1i1: true },
        checkedAt: { p1w1i1: new Date().toISOString() },
        corePct: 50,
        dsaPct: 10,
      },
    });
    expect(url).toContain('?u=jane');

    const raw = localStorage.getItem('unifies-shared-v1');
    expect(raw).toBeTruthy();
    const all = JSON.parse(raw);
    expect(all.jane.corePct).toBe(50);
  });

  it('resolveSharedUser reads back a previously published snapshot', async () => {
    await publishShare({
      username: 'jane',
      snapshot: {
        checked: { p1w1i1: true },
        checkedAt: {},
        corePct: 50,
        dsaPct: 10,
      },
    });
    const user = await resolveSharedUser('jane');
    expect(user).not.toBeNull();
    expect(user.username).toBe('jane');
    expect(user.corePct).toBe(50);
  });

  it('resolveSharedUser returns null for an unknown handle', async () => {
    const user = await resolveSharedUser('nobody');
    expect(user).toBeNull();
  });
});
