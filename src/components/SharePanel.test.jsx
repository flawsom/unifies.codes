// Component test for the share panel. In the test env Supabase is unconfigured,
// so the leaderboard must show an honest empty state — never demo/seed rows.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SharePanel from './SharePanel';

describe('<SharePanel />', () => {
  it('renders a dialog with a handle input', () => {
    render(
      <SharePanel
        open
        onClose={() => {}}
        user={null}
        checked={{}}
        checkedAt={{}}
        corePct={0}
        dsaPct={0}
        xp={0}
      />
    );
    expect(screen.getByRole('dialog', { name: /share your fde route/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/pick a handle/i)).toBeInTheDocument();
  });

  it('shows an honest empty leaderboard (no demo data)', () => {
    render(
      <SharePanel
        open
        onClose={() => {}}
        user={null}
        checked={{}}
        checkedAt={{}}
        corePct={0}
        dsaPct={0}
        xp={0}
      />
    );
    expect(screen.getByText(/no shared routes yet/i)).toBeInTheDocument();
  });
});
