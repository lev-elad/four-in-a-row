import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { GameStatus, Player } from '../game/types';
import { createInitialState, gameReducer } from './gameReducer';

export type GameResult = Player | 'draw';

const DROP_BASE_MS = 200;
const DROP_PER_ROW_MS = 50;

/** How long a disc takes to fall to the given row; mirrors the CSS drop animation. */
export function dropDurationMs(row: number): number {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 0;
  return DROP_BASE_MS + row * DROP_PER_ROW_MS;
}

/**
 * Game state plus the timing of the falling disc: the result of a move
 * (win or draw) is only revealed, and reported to onGameEnd, once the disc has landed.
 */
export function useGame(onGameEnd: (result: GameResult) => void) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState());
  const [landedCount, setLandedCount] = useState(0);
  const timers = useRef(new Set<number>());
  const finishPending = useRef<(() => void) | null>(null);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
  };
  useEffect(() => clearTimers, []);

  const drop = useCallback(
    (col: number) => {
      const next = gameReducer(state, { type: 'DROP', col });
      if (next === state || !next.lastMove) return;
      dispatch({ type: 'DROP', col });

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (next.status === 'won' && next.winner) onGameEnd(next.winner);
        else if (next.status === 'draw') onGameEnd('draw');
      };
      if (next.status !== 'playing') finishPending.current = finish;

      const id = window.setTimeout(() => {
        timers.current.delete(id);
        setLandedCount((count) => Math.max(count, next.moveCount));
        finish();
      }, dropDurationMs(next.lastMove.row));
      timers.current.add(id);
    },
    [state, onGameEnd],
  );

  const newGame = useCallback(() => {
    clearTimers();
    // A game that ended while its last disc was still falling still counts.
    finishPending.current?.();
    finishPending.current = null;
    setLandedCount(0);
    dispatch({ type: 'NEW_GAME' });
  }, []);

  const settled = landedCount >= state.moveCount;
  const visibleStatus: GameStatus = settled ? state.status : 'playing';

  return { state, visibleStatus, drop, newGame };
}
