import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DRAW_MOVES } from '../test/boards';
import { App } from './App';

const column = (n: number) => screen.getByRole('button', { name: new RegExp(`^Column ${n},`) });
const land = () => act(() => vi.advanceTimersByTime(1000));

function play(columns: number[]) {
  for (const n of columns) {
    fireEvent.click(column(n));
    land();
  }
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('drops discs and alternates turns', () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Player 1’s turn');
    fireEvent.click(column(4));
    expect(screen.getByRole('status')).toHaveTextContent('Player 2’s turn');
    expect(column(4)).toHaveAccessibleName('Column 4, 1 of 6 discs');
  });

  it('announces the winner once the disc lands, scores it and locks the board', () => {
    render(<App />);
    play([1, 2, 1, 2, 1, 2]);
    fireEvent.click(column(1));
    expect(screen.getByRole('status')).not.toHaveTextContent('wins');
    land();
    expect(screen.getByRole('status')).toHaveTextContent('Player 1 wins!');
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveTextContent('1win');

    fireEvent.click(column(5));
    expect(column(5)).toHaveAccessibleName('Column 5, 0 of 6 discs');

    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByRole('status')).toHaveTextContent('Player 2’s turn');
    expect(column(1)).toHaveAccessibleName('Column 1, 0 of 6 discs');
  });

  it('still scores a win when a new game starts before the disc lands', () => {
    render(<App />);
    play([1, 2, 1, 2, 1, 2]);
    fireEvent.click(column(1));
    fireEvent.click(screen.getByRole('button', { name: 'New game' }));
    land();
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveTextContent('1win');
    expect(screen.getByRole('status')).toHaveTextContent('Player 2’s turn');
  });

  it('ends in a draw on a full board', () => {
    render(<App />);
    play(DRAW_MOVES.map((col) => col + 1));
    expect(screen.getByRole('status')).toHaveTextContent('It’s a draw');
    expect(screen.getByText(/Draws:/)).toHaveTextContent('Draws: 1');
  });

  it('uses player names and remembers names and scores', () => {
    const { unmount } = render(<App />);
    fireEvent.change(screen.getByLabelText('Player 1 name'), { target: { value: 'Dana' } });
    expect(screen.getByRole('status')).toHaveTextContent('Dana’s turn');
    play([1, 2, 1, 2, 1, 2, 1]);
    expect(screen.getByRole('status')).toHaveTextContent('Dana wins!');
    unmount();

    render(<App />);
    expect(screen.getByLabelText('Player 1 name')).toHaveValue('Dana');
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveTextContent('1win');

    fireEvent.click(screen.getByRole('button', { name: 'Reset scores' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }));
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveTextContent('0wins');
  });

  it('drops with the number keys', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '3' });
    expect(column(3)).toHaveAccessibleName('Column 3, 1 of 6 discs');
  });
});

describe('App against the computer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const discsOnBoard = () =>
    screen
      .getAllByRole('button', { name: /^Column \d,/ })
      .reduce(
        (sum, button) => sum + Number(/, (\d) of/.exec(button.getAttribute('aria-label')!)![1]),
        0,
      );
  const chooseMode = (name: string) => fireEvent.click(screen.getByRole('radio', { name }));
  /** Lets the falling disc land, then the computer think and its own disc land. */
  const computerReplies = () => {
    land();
    land();
    land();
  };

  it('replies to the player and locks the board while it thinks', () => {
    render(<App />);
    chooseMode('vs Computer');
    expect(screen.getByRole('region', { name: 'Computer' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Player 2 name')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Your turn');

    fireEvent.click(column(4));
    expect(screen.getByRole('status')).toHaveTextContent('Computer is thinking…');
    fireEvent.click(column(1));
    fireEvent.keyDown(window, { key: '2' });
    expect(discsOnBoard()).toBe(1);

    computerReplies();
    expect(discsOnBoard()).toBe(2);
    expect(screen.getByRole('status')).toHaveTextContent('Your turn');
  });

  it('moves first when it is its turn to start', () => {
    render(<App />);
    chooseMode('vs Computer');
    fireEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(screen.getByRole('status')).toHaveTextContent('Computer is thinking…');
    computerReplies();
    expect(discsOnBoard()).toBe(1);
    expect(screen.getByRole('status')).toHaveTextContent('Your turn');
  });

  it('wins against careless play and scores it separately from two-player games', () => {
    render(<App />);
    play([1, 2, 1, 2, 1, 2, 1]);
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveTextContent('1win');

    chooseMode('vs Computer');
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveTextContent('0wins');
    // The player keeps stacking column 1 and ignores every threat.
    for (let turn = 0; turn < 6 && !/wins!/.test(screen.getByRole('status').textContent!); turn++) {
      fireEvent.click(column(turn < 3 ? 1 : 7));
      computerReplies();
    }
    expect(screen.getByRole('status')).toHaveTextContent('Computer wins!');
    expect(screen.getByRole('region', { name: 'Computer' })).toHaveTextContent('1win');

    chooseMode('2 Players');
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveTextContent('1win');
    expect(screen.getByRole('region', { name: 'Player 2' })).toHaveTextContent('0wins');
  });

  it('asks before abandoning a game in progress, and remembers the mode', () => {
    const { unmount } = render(<App />);
    fireEvent.click(column(4));
    land();
    chooseMode('vs Computer');
    expect(screen.getByText('End this game and switch?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('radio', { name: '2 Players' })).toBeChecked();
    expect(discsOnBoard()).toBe(1);

    chooseMode('vs Computer');
    fireEvent.click(screen.getByRole('button', { name: 'Yes, switch' }));
    expect(screen.getByRole('radio', { name: 'vs Computer' })).toBeChecked();
    expect(discsOnBoard()).toBe(0);
    expect(screen.getByRole('status')).toHaveTextContent('Your turn');
    unmount();

    render(<App />);
    expect(screen.getByRole('radio', { name: 'vs Computer' })).toBeChecked();
  });
});
