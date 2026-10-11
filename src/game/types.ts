export const ROWS = 6
export const COLS = 7
export const CONNECT = 4

export type Player = 'P1' | 'P2'
export type Cell = Player | null

/** board[row][col], row 0 is the top row. */
export type Board = Cell[][]

export interface Position {
  row: number
  col: number
}

export type GameStatus = 'playing' | 'won' | 'draw'

export function otherPlayer(player: Player): Player {
  return player === 'P1' ? 'P2' : 'P1'
}
