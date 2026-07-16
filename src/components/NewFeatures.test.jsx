// Component tests for the new UX features: FocusView, Insights, Toast.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';
import Insights from './Insights';
import FocusView from './FocusView';
import { DEFAULT_PHASES, DEFAULT_BONUS } from '../data/curriculum';

const daySet = new Set(['2026-07-16']);

function Harness() {
  const { notify, celebrate } = useToast();
  return (
    <div>
      <button onClick={() => notify('hi')}>n</button>
      <button onClick={() => celebrate('yay')}>c</button>
    </div>
  );
}

describe('<Toast />', () => {
  it('renders a notify toast', () => {
    render(<ToastProvider><Harness /></ToastProvider>);
    fireEvent.click(screen.getByText('n'));
    expect(screen.getByText('hi')).toBeInTheDocument();
  });
  it('renders a celebrate toast with emoji', () => {
    render(<ToastProvider><Harness /></ToastProvider>);
    fireEvent.click(screen.getByText('c'));
    expect(screen.getByText(/yay/)).toBeInTheDocument();
  });
});

describe('<Insights />', () => {
  it('shows track completion and level/xp', () => {
    render(
      <Insights
        coreDone={5}
        coreTotal={10}
        dsaDone={2}
        dsaTotal={15}
        bonusDone={1}
        bonusTotal={9}
        daySet={daySet}
        dayInfo={{ elapsed: 10, remaining: 80 }}
        xp={120}
        lvl={{ level: 2, intoLevel: 20, neededForNext: 150, pct: 13 }}
        startDate="2026-07-01"
      />
    );
    expect(screen.getByText(/Insights/)).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // level
  });
});

describe('<FocusView />', () => {
  it('prompts to set mission start when missing', () => {
    render(<FocusView PHASES={DEFAULT_PHASES} BONUS={DEFAULT_BONUS} checked={{}} startDate="" onToggle={() => {}} onJump={() => {}} />);
    expect(screen.getByText(/Set your/i)).toBeInTheDocument();
  });

  it('shows the current plan day and a suggested next item', () => {
    // start 9 days ago => day 10 => phase p2 (weeks 4-6), week index 0
    const start = new Date();
    start.setDate(start.getDate() - 9);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    render(
      <FocusView
        PHASES={DEFAULT_PHASES}
        BONUS={DEFAULT_BONUS}
        checked={{}}
        startDate={startStr}
        onToggle={() => {}}
        onJump={() => {}}
      />
    );
    expect(screen.getByText(/Day 10 of 90/)).toBeInTheDocument();
    expect(screen.getByText(/Suggested next/i)).toBeInTheDocument();
  });
});
