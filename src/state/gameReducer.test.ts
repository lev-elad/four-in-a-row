import { describe, expect, it } from 'vitest';
import { boardFrom, DRAW_MOVES } from '../test/boards';
import { createInitialState, gameReducer } from './gameReducer';
import type { GameState } from './gameReducer';

function play(cols: number[], from: GameState = createInitialState()): GameState {
  return cols.reduce((state, col) => gameReducer(state, { type: 'DROP', col }), from);
}

describe('gameReducer', () => {
  it('alternates players after each legal move', () => {
    let state = createInitialState();
    expect(state.currentPlayer).toBe('P1');
    state = play([3], state);
    expect(state.currentPlayer).toBe('P2');
    expect(state.board[5][3]).toBe('P1');
    state = play([3], state);
    expect(state.currentPlayer).toBe('P1');
    expect(state.board[4][3]).toBe('P2');
    expect(state.moveCount).toBe(2);
  });

  it('ignores a move into a full column without changing the turn', () => {
    const state = play([0, 0, 0, 0, 0, 0]);
    const after = play([0], state);
    expect(after).toBe(state);
    expect(after.currentPlayer).toBe('P1');
  });

  it('declares the winner and keeps the winning cells', () => {
    const state = play([0, 1, 0, 1, 0, 1, 0]);
    expect(state.status).toBe('won');
    expect(state.winner).toBe('P1');
    expect(state.winningCells).toHaveLength(4);
    expect(state.winningCells.every((c) => c.col === 0)).toBe(true);
  });

  it('ignores moves after the game has ended', () => {
    const won = play([0, 1, 0, 1, 0, 1, 0]);
    expect(play([4], won)).toBe(won);
  });

  it('ends in a draw when the board fills with no four', () => {
    const beforeLast = play(DRAW_MOVES.slice(0, -1));
    expect(beforeLast.status).toBe('playing');
    const state = play(DRAW_MOVES.slice(-1), beforeLast);
    expect(state.moveCount).toBe(42);
    expect(state.status).toBe('draw');
    expect(state.winner).toBeNull();
  });

  it('counts a four made with the last free cell as a win, not a draw', () => {
    const state: GameState = {
      ...createInitialState(),
      currentPlayer: 'P1',
      moveCount: 41,
      board: boardFrom(`
        221122.
        1122111
        2211221
        1122111
        2211221
        1122112
      `),
    };
    const after = play([6], state);
    expect(after.status).toBe('won');
    expect(after.winner).toBe('P1');
  });

  it('starts a new game with an empty board and the other player first', () => {
    const won = play([0, 1, 0, 1, 0, 1, 0]);
    const second = gameReducer(won, { type: 'NEW_GAME' });
    expect(second.status).toBe('playing');
    expect(second.moveCount).toBe(0);
    expect(second.winningCells).toEqual([]);
    expect(second.startingPlayer).toBe('P2');
    expect(second.currentPlayer).toBe('P2');
    const third = gameReducer(second, { type: 'NEW_GAME' });
    expect(third.currentPlayer).toBe('P1');
  });

  it('starts a new game with a chosen starting player', () => {
    const state = gameReducer(createInitialState('P1'), { type: 'NEW_GAME', startingPlayer: 'P1' });
    expect(state.startingPlayer).toBe('P1');
    expect(state.currentPlayer).toBe('P1');
  });
});
