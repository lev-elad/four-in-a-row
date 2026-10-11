import { describe, expect, it } from 'vitest';
import { boardFrom } from '../test/boards';
import { chooseMove } from './ai';
import { createBoard, dropDisc, findWinningLine, getLegalColumns } from './rules';
import { otherPlayer } from './types';
import type { Board, Player } from './types';

/** Small repeatable random number generator, so the simulated games are the same on every run. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Chooser = (board: Board, player: Player) => number;

/** Plays a full game and returns the winner, or 'draw'. */
function playGame(choosers: Record<Player, Chooser>, first: Player): Player | 'draw' {
  let board = createBoard();
  let player = first;
  for (;;) {
    const col = choosers[player](board, player);
    const result = dropDisc(board, col, player);
    if (!result) throw new Error(`${player} chose illegal column ${col}`);
    board = result.board;
    if (findWinningLine(board, result.position)) return player;
    if (getLegalColumns(board).length === 0) return 'draw';
    player = otherPlayer(player);
  }
}

describe('chooseMove', () => {
  it('takes a winning move when one is available', () => {
    const board = boardFrom(`
      .......
      .......
      .......
      .......
      222....
      111....
    `);
    expect(chooseMove(board, 'P1')).toBe(3);
    expect(chooseMove(board, 'P2')).toBe(3);
  });

  it('blocks the opponent from completing four', () => {
    const board = boardFrom(`
      .......
      .......
      ......1
      ......1
      .2....1
      .2....2
    `);
    const vertical = boardFrom(`
      .......
      .......
      .......
      1......
      1.2....
      1.2....
    `);
    expect(chooseMove(vertical, 'P2')).toBe(0);
    // Nothing to block here: column 6 is already capped by player 2.
    expect(getLegalColumns(board)).toContain(chooseMove(board, 'P2'));
  });

  it('prefers winning to blocking', () => {
    const board = boardFrom(`
      .......
      .......
      .......
      1.....2
      1.....2
      1.....2
    `);
    expect(chooseMove(board, 'P2')).toBe(6);
  });

  it('sees a trap two moves ahead', () => {
    // Playing column 1 or 4 makes an open-ended three that cannot be blocked on both sides.
    const board = boardFrom(`
      .......
      .......
      .......
      .......
      ..22...
      ..11...
    `);
    expect([1, 4]).toContain(chooseMove(board, 'P1'));
  });

  it('never chooses a full column and reports a full board', () => {
    const board = boardFrom(`
      221.221
      1122112
      2211221
      1122112
      2211221
      1122112
    `);
    expect(chooseMove(board, 'P1')).toBe(3);

    const full = boardFrom(`
      2211221
      1122112
      2211221
      1122112
      2211221
      1122112
    `);
    expect(chooseMove(full, 'P1')).toBe(-1);
  });

  it('opens in the centre column', () => {
    expect(chooseMove(createBoard(), 'P1')).toBe(3);
  });

  it('beats a player who moves at random', () => {
    const random = seededRandom(42);
    const randomPlayer: Chooser = (board) => {
      const legal = getLegalColumns(board);
      return legal[Math.floor(random() * legal.length)];
    };
    const computer: Chooser = (board, player) => chooseMove(board, player, { depth: 4, random });

    for (let game = 0; game < 30; game++) {
      const first: Player = game % 2 === 0 ? 'P1' : 'P2';
      expect(playGame({ P1: randomPlayer, P2: computer }, first)).toBe('P2');
    }
  });

  it('answers quickly at full strength', () => {
    const start = performance.now();
    chooseMove(createBoard(), 'P1');
    chooseMove(dropDisc(createBoard(), 3, 'P1')!.board, 'P2');
    expect(performance.now() - start).toBeLessThan(3000);
  });
});
