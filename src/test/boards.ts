import type { Board } from '../game/types'

/** Builds a board from six strings of seven characters: '1', '2' or '.'; top row first. */
export function boardFrom(rows: string[]): Board {
  return rows.map((row) => [...row].map((ch) => (ch === '1' ? 'P1' : ch === '2' ? 'P2' : null)))
}

/** A legal 42-move game that fills the board with no four in a row. */
export const DRAW_MOVES = [
  ...Array(6).fill(0),
  ...Array(6).fill(1),
  4,
  ...Array(6).fill(2),
  ...Array(6).fill(3),
  ...Array(5).fill(4),
  5,
  ...Array(6).fill(6),
  ...Array(5).fill(5),
] as number[]
