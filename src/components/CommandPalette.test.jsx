// Component test for the command palette: keyboard open, filter, select, Esc.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette from './CommandPalette';
import { allItems } from '../data/curriculum';

function setup(open = true) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(
    <CommandPalette open={open} onClose={onClose} items={allItems} checked={{}} onSelect={onSelect} />
  );
  return { onSelect, onClose };
}

describe('<CommandPalette />', () => {
  it('renders nothing when closed', () => {
    setup(false);
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('filters by query and shows matches', () => {
    const { onSelect } = setup();
    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: 'RAG' } });
    const items = screen.getAllByTestId('command-palette-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].textContent).toMatch(/RAG/);
  });

  it('selects the first match on Enter', () => {
    const { onSelect } = setup();
    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: 'RAG' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const { onClose } = setup();
    const input = screen.getByTestId('command-palette-input');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an honest empty state for no matches (no demo data)', () => {
    setup();
    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: 'zzzqqq_nomatch' } });
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });
});
