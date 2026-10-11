import { describe, expect, it } from 'vitest';
import { boardFrom } from '../test/boards';
import {
  createBoard,
  dropDisc,
  findWinningLine,
  getLandingRow,
  getLegalColumns,
  isBoardFull,
} from './rules';
import { COLS, ROWS } from './types';
import type { Board, Position } from './types';

const sorted = (cells: Position[] | null) => cells?.map((c) => `${c.row},${c.col}`).sort() ?? null;

function anyWin(board: Board): boolean {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (findWinningLine(board, { row, col })) return true;
    }
  }
  return false;
}

describe('createBoard', () => {
  it('creates an empty 7x6 board', () => {
    const board = createBoard();
    expect(board).toHaveLength(6);
    expect(board.every((row) => row.length === 7 && row.every((c) => c === null))).toBe(true);
    expect(getLegalColumns(board)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('dropDisc', () => {
  it('lands on the bottom row, then stacks upwards', () => {
    const first = dropDisc(createBoard(), 3, 'P1')!;
    expect(first.position).toEqual({ row: 5, col: 3 });
    const second = dropDisc(first.board, 3, 'P2')!;
    expect(second.position).toEqual({ row: 4, col: 3 });
    expect(second.board[5][3]).toBe('P1');
    expect(second.board[4][3]).toBe('P2');
  });

  it('does not mutate the board it was given', () => {
    const board = createBoard();
    dropDisc(board, 0, 'P1');
    expect(board[5][0]).toBeNull();
  });

  it('rejects a full column and columns outside the board', () => {
    let board = createBoard();
    for (let i = 0; i < 6; i++) board = dropDisc(board, 2, i % 2 ? 'P2' : 'P1')!.board;
    expect(getLandingRow(board, 2)).toBeNull();
    expect(dropDisc(board, 2, 'P1')).toBeNull();
    expect(getLegalColumns(board)).toEqual([0, 1, 3, 4, 5, 6]);
    expect(dropDisc(board, -1, 'P1')).toBeNull();
    expect(dropDisc(board, 7, 'P1')).toBeNull();
  });
});

describe('findWinningLine', () => {
  it('finds a horizontal four at the right edge', () => {
    const board = boardFrom(`
      .......
      .......
      .......
      .......
      .......
      2221111
    `);
    expect(sorted(findWinningLine(board, { row: 5, col: 4 }))).toEqual([
      '5,3',
      '5,4',
      '5,5',
      '5,6',
    ]);
  });

  it('finds a vertical four at the top of a column', () => {
    const board = boardFrom(`
      2......
      2......
      2......
      2......
      1......
      1......
    `);
    expect(sorted(findWinningLine(board, { row: 0, col: 0 }))).toEqual([
      '0,0',
      '1,0',
      '2,0',
      '3,0',
    ]);
  });

  it('finds a rising diagonal', () => {
    const board = boardFrom(`
      .......
      .......
      ...1...
      ..12...
      .122...
      1222...
    `);
    expect(sorted(findWinningLine(board, { row: 3, col: 2 }))).toEqual([
      '2,3',
      '3,2',
      '4,1',
      '5,0',
    ]);
  });

  it('finds a falling diagonal into the bottom-right corner', () => {
    const board = boardFrom(`
      .......
      .......
      ...2...
      ...12..
      ...112.
      ...1112
    `);
    expect(sorted(findWinningLine(board, { row: 5, col: 6 }))).toEqual([
      '2,3',
      '3,4',
      '4,5',
      '5,6',
    ]);
  });

  it('returns all five cells when the disc joins a line of five', () => {
    const board = boardFrom(`
      .......
      .......
      .......
      .......
      .......
      .11111.
    `);
    expect(findWinningLine(board, { row: 5, col: 3 })).toHaveLength(5);
  });

  it('returns both lines when one disc completes two', () => {
    const board = boardFrom(`
      .......
      .......
      ...1...
      ...1...
      ...1...
      1111...
    `);
    expect(findWinningLine(board, { row: 5, col: 3 })).toHaveLength(7);
  });

  it('does not count three in a row', () => {
    const board = boardFrom(`
      .......
      .......
      .......
      .......
      .......
      111.1..
    `);
    expect(findWinningLine(board, { row: 5, col: 2 })).toBeNull();
    expect(findWinningLine(board, { row: 5, col: 3 })).toBeNull();
  });

  it('does not wrap from the end of one row to the start of the next', () => {
    const board = boardFrom(`
      .......
      .......
      .......
      .......
      11....2
      22...11
    `);
    expect(anyWin(board)).toBe(false);
  });

  it('finds no winner on a full drawn board', () => {
    const board = boardFrom(`
      2211221
      1122112
      2211221
      1122112
      2211221
      1122112
    `);
    expect(isBoardFull(board)).toBe(true);
    expect(anyWin(board)).toBe(false);
  });
});
