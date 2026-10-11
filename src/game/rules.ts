import { COLS, CONNECT, ROWS } from './types'
import type { Board, Cell, Player, Position } from './types'

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
}

/** Lowest empty row in the column, or null if the column is full or invalid. */
export function getLandingRow(board: Board, col: number): number | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row
  }
  return null
}

export function getLegalColumns(board: Board): number[] {
  const columns: number[] = []
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === null) columns.push(col)
  }
  return columns
}

/** Returns the new board and where the disc landed, or null if the move is illegal. */
export function dropDisc(
  board: Board,
  col: number,
  player: Player,
): { board: Board; position: Position } | null {
  const row = getLandingRow(board, col)
  if (row === null) return null
  const next = board.map((cells) => cells.slice())
  next[row][col] = player
  return { board: next, position: { row, col } }
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const

/**
 * Cells of every line of four or more that passes through the last disc played,
 * or null if that disc did not win.
 */
export function findWinningLine(board: Board, last: Position): Position[] | null {
  const player = board[last.row]?.[last.col]
  if (!player) return null

  const winning: Position[] = []
  for (const [dRow, dCol] of DIRECTIONS) {
    const line: Position[] = [last]
    for (const sign of [1, -1]) {
      let row = last.row + dRow * sign
      let col = last.col + dCol * sign
      while (board[row]?.[col] === player) {
        line.push({ row, col })
        row += dRow * sign
        col += dCol * sign
      }
    }
    if (line.length >= CONNECT) {
      for (const cell of line) {
        if (!winning.some((w) => w.row === cell.row && w.col === cell.col)) winning.push(cell)
      }
    }
  }
  return winning.length > 0 ? winning : null
}

export function isBoardFull(board: Board): boolean {
  return getLegalColumns(board).length === 0
}
