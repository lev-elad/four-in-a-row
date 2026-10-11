import { useCallback, useEffect } from 'react'
import { COLS } from '../game/types'
import type { Player } from '../game/types'
import { useGame } from '../state/useGame'
import type { GameResult } from '../state/useGame'
import { usePersistentState } from '../state/usePersistentState'
import styles from './App.module.css'
import { Board } from './Board'
import { Controls } from './Controls'
import { MAX_NAME_LENGTH, PlayerPanel } from './PlayerPanel'
import { StatusBanner } from './StatusBanner'

type Names = Record<Player, string>
interface Scores {
  P1: number
  P2: number
  draws: number
}

const PLAYERS: Player[] = ['P1', 'P2']
const DEFAULT_NAMES: Names = { P1: 'Player 1', P2: 'Player 2' }
const NO_NAMES: Names = { P1: '', P2: '' }
const NO_SCORES: Scores = { P1: 0, P2: 0, draws: 0 }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNames = (value: unknown): value is Names =>
  isRecord(value) &&
  PLAYERS.every((p) => typeof value[p] === 'string' && value[p].length <= MAX_NAME_LENGTH)

const isScores = (value: unknown): value is Scores =>
  isRecord(value) &&
  ['P1', 'P2', 'draws'].every((key) => Number.isInteger(value[key]) && (value[key] as number) >= 0)

export function App() {
  const [names, setNames] = usePersistentState('four-in-a-row:names', NO_NAMES, isNames)
  const [scores, setScores] = usePersistentState('four-in-a-row:scores', NO_SCORES, isScores)

  const recordResult = useCallback(
    (result: GameResult) => {
      const key = result === 'draw' ? 'draws' : result
      setScores((current) => ({ ...current, [key]: current[key] + 1 }))
    },
    [setScores],
  )
  const { state, visibleStatus, drop, newGame } = useGame(recordResult)

  // Number keys 1-7 drop into that column from anywhere outside a text field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLInputElement) return
      const col = Number(event.key) - 1
      if (Number.isInteger(col) && col >= 0 && col < COLS) drop(col)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drop])

  const displayName = (player: Player) => names[player].trim() || DEFAULT_NAMES[player]
  const won = visibleStatus === 'won'

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>
        <span className={styles.logo} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        Four in a Row
      </h1>

      <div className={styles.arena}>
        {PLAYERS.map((player) => (
          <PlayerPanel
            key={player}
            player={player}
            name={names[player]}
            defaultName={DEFAULT_NAMES[player]}
            wins={scores[player]}
            active={visibleStatus === 'playing' && state.currentPlayer === player}
            winner={won && state.winner === player}
            onNameChange={(name) => setNames((current) => ({ ...current, [player]: name }))}
          />
        ))}
        <Board
          board={state.board}
          currentPlayer={state.currentPlayer}
          canPlay={state.status === 'playing'}
          winningCells={won ? state.winningCells : []}
          onDrop={drop}
        />
      </div>

      <StatusBanner
        status={visibleStatus}
        player={state.currentPlayer}
        playerName={displayName(state.currentPlayer)}
      />

      <Controls
        gameOver={visibleStatus !== 'playing'}
        draws={scores.draws}
        hasScores={scores.P1 + scores.P2 + scores.draws > 0}
        onNewGame={newGame}
        onResetScores={() => setScores(NO_SCORES)}
      />
    </main>
  )
}
