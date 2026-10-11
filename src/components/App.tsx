import { useCallback, useEffect } from 'react';
import { COLS } from '../game/types';
import type { Player } from '../game/types';
import { useBot } from '../state/useBot';
import { useGame } from '../state/useGame';
import type { GameResult } from '../state/useGame';
import { usePersistentState } from '../state/usePersistentState';
import styles from './App.module.css';
import { Board } from './Board';
import { Controls } from './Controls';
import { ModeSelector } from './ModeSelector';
import type { Mode } from './ModeSelector';
import { MAX_NAME_LENGTH, PlayerPanel } from './PlayerPanel';
import { StatusBanner } from './StatusBanner';

type Names = Record<Player, string>;
interface Scores {
  P1: number;
  P2: number;
  draws: number;
}

const PLAYERS: Player[] = ['P1', 'P2'];
/** The side the computer plays in "vs Computer" mode. */
const COMPUTER: Player = 'P2';
const DEFAULT_NAMES: Names = { P1: 'Player 1', P2: 'Player 2' };
const NO_NAMES: Names = { P1: '', P2: '' };
const NO_SCORES: Scores = { P1: 0, P2: 0, draws: 0 };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNames = (value: unknown): value is Names =>
  isRecord(value) &&
  PLAYERS.every((p) => typeof value[p] === 'string' && value[p].length <= MAX_NAME_LENGTH);

const isScores = (value: unknown): value is Scores =>
  isRecord(value) &&
  ['P1', 'P2', 'draws'].every((key) => Number.isInteger(value[key]) && (value[key] as number) >= 0);

const isMode = (value: unknown): value is Mode => value === 'human' || value === 'computer';

export function App() {
  const [mode, setMode] = usePersistentState<Mode>('four-in-a-row:mode', 'human', isMode);
  const [names, setNames] = usePersistentState('four-in-a-row:names', NO_NAMES, isNames);
  // Each mode keeps its own tally, so beating the computer does not count against a friend.
  const [humanScores, setHumanScores] = usePersistentState(
    'four-in-a-row:scores',
    NO_SCORES,
    isScores,
  );
  const [computerScores, setComputerScores] = usePersistentState(
    'four-in-a-row:scores-computer',
    NO_SCORES,
    isScores,
  );
  const vsComputer = mode === 'computer';
  const scores = vsComputer ? computerScores : humanScores;
  const setScores = vsComputer ? setComputerScores : setHumanScores;

  const recordResult = useCallback(
    (result: GameResult) => {
      const key = result === 'draw' ? 'draws' : result;
      setScores((current) => ({ ...current, [key]: current[key] + 1 }));
    },
    [setScores],
  );
  const { state, settled, visibleStatus, drop, newGame } = useGame(recordResult);
  const computerTurn = useBot({ enabled: vsComputer, botPlayer: COMPUTER, state, settled, drop });

  /** A move made by a person: ignored while the computer is to move. */
  const playerDrop = useCallback(
    (col: number) => {
      if (!computerTurn) drop(col);
    },
    [computerTurn, drop],
  );

  // Number keys 1-7 drop into that column from anywhere outside a text field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLInputElement) return;
      const col = Number(event.key) - 1;
      if (Number.isInteger(col) && col >= 0 && col < COLS) playerDrop(col);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playerDrop]);

  const changeMode = (next: Mode) => {
    // The person always starts the first game after a switch.
    newGame('P1');
    setMode(next);
  };

  const isComputer = (player: Player) => vsComputer && player === COMPUTER;
  const won = visibleStatus === 'won';

  const statusMessage = () => {
    const player = state.currentPlayer;
    if (visibleStatus === 'draw') return 'It’s a draw';
    if (isComputer(player)) return won ? 'Computer wins!' : 'Computer is thinking…';
    const name = names[player].trim();
    if (vsComputer && !name) return won ? 'You win!' : 'Your turn';
    return won
      ? `${name || DEFAULT_NAMES[player]} wins!`
      : `${name || DEFAULT_NAMES[player]}’s turn`;
  };

  return (
    <main className={styles.app} data-opponent={vsComputer ? 'computer' : 'human'}>
      <h1 className={styles.title}>
        <span className={styles.logo} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        Four in a Row
      </h1>

      <ModeSelector
        mode={mode}
        confirmSwitch={state.status === 'playing' && state.moveCount > 0}
        onChange={changeMode}
      />

      <div className={styles.arena}>
        {PLAYERS.map((player) => (
          <PlayerPanel
            key={player}
            player={player}
            name={names[player]}
            defaultName={isComputer(player) ? 'Computer' : DEFAULT_NAMES[player]}
            nameLocked={isComputer(player)}
            turnLabel={isComputer(player) ? 'Thinking…' : 'Your turn'}
            wins={scores[player]}
            active={visibleStatus === 'playing' && state.currentPlayer === player}
            winner={won && state.winner === player}
            onNameChange={(name) => setNames((current) => ({ ...current, [player]: name }))}
          />
        ))}
        <Board
          board={state.board}
          currentPlayer={state.currentPlayer}
          canPlay={state.status === 'playing' && !computerTurn}
          winningCells={won ? state.winningCells : []}
          onDrop={playerDrop}
        />
      </div>

      <StatusBanner status={visibleStatus} player={state.currentPlayer} message={statusMessage()} />

      <Controls
        gameOver={visibleStatus !== 'playing'}
        draws={scores.draws}
        hasScores={scores.P1 + scores.P2 + scores.draws > 0}
        onNewGame={() => newGame()}
        onResetScores={() => setScores(NO_SCORES)}
      />
    </main>
  );
}
