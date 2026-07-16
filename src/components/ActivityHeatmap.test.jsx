// Component test for the activity heatmap + streak display.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityHeatmap from './ActivityHeatmap';

describe('<ActivityHeatmap />', () => {
  const columns = [
    [
      { date: '2026-07-10', count: 0 },
      { date: '2026-07-11', count: 2 },
      { date: '2026-07-12', count: 0 },
      { date: '2026-07-13', count: 0 },
      { date: '2026-07-14', count: 0 },
      { date: '2026-07-15', count: 0 },
      { date: '2026-07-16', count: 0 },
    ],
  ];

  it('shows the current and longest streak', () => {
    render(<ActivityHeatmap columns={columns} streak={4} longest={12} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders a "Share progress" action when not read-only', () => {
    render(<ActivityHeatmap columns={columns} streak={1} longest={1} onShare={() => {}} />);
    expect(screen.getByText(/Share progress/)).toBeInTheDocument();
  });

  it('hides the share action in read-only mode', () => {
    render(<ActivityHeatmap columns={columns} streak={1} longest={1} readOnly />);
    expect(screen.queryByText(/Share progress/)).not.toBeInTheDocument();
  });
});
