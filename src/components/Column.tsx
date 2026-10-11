import type { CSSProperties } from 'react'
import { ROWS } from '../game/types'
import type { Cell, Player } from '../game/types'
import styles from './Column.module.css'
import { Disc } from './Disc'

interface ColumnProps {
  col: number
  /** The column's cells, top row first. */
  cells: Cell[]
  currentPlayer: Player
  /** False once the game is over. */
  canPlay: boolean
  /** Rows of this column that are part of the winning line. */
  winningRows: number[]
  gameWon: boolean
  onDrop: (col: number) => void
}

export function Column({
  col,
  cells,
  currentPlayer,
  canPlay,
  winningRows,
  gameWon,
  onDrop,
}: ColumnProps) {
  const landingRow = cells.lastIndexOf(null)
  const count = ROWS - 1 - landingRow
  const playable = canPlay && landingRow >= 0

  return (
    <button
      type="button"
      className={styles.column}
      aria-label={`Column ${col + 1}, ${count} of ${ROWS} discs${landingRow < 0 ? ', full' : ''}`}
      aria-disabled={!playable}
      onClick={() => playable && onDrop(col)}
    >
      {cells.map((cell, row) => (
        <span key={row} className={styles.cell}>
          <span className={styles.hole} />
          {cell ? (
            <span className={styles.faller} style={{ '--row': row } as CSSProperties}>
              <span className={styles.inner}>
                <Disc
                  player={cell}
                  winning={winningRows.includes(row)}
                  dimmed={gameWon && !winningRows.includes(row)}
                />
              </span>
            </span>
          ) : (
            playable &&
            row === landingRow && (
              <span className={styles.preview}>
                <span className={styles.inner}>
                  <Disc player={currentPlayer} />
                </span>
              </span>
            )
          )}
        </span>
      ))}
    </button>
  )
}
