import { useEffect } from 'react';
import { chooseMove } from '../game/ai';
import type { Player } from '../game/types';
import type { GameState } from './gameReducer';

/** Pause before the computer moves, so its reply does not land the instant the player's disc does. */
export const BOT_DELAY_MS = 500;

interface UseBotOptions {
  enabled: boolean;
  botPlayer: Player;
  state: GameState;
  /** Whether the last disc played has finished falling. */
  settled: boolean;
  drop: (col: number) => void;
}

/**
 * Plays the computer's moves through the same `drop` the UI uses.
 * Returns whether it is currently the computer's turn.
 */
export function useBot({ enabled, botPlayer, state, settled, drop }: UseBotOptions): boolean {
  const botTurn = enabled && state.status === 'playing' && state.currentPlayer === botPlayer;

  useEffect(() => {
    if (!botTurn || !settled) return;
    const id = window.setTimeout(() => drop(chooseMove(state.board, botPlayer)), BOT_DELAY_MS);
    // Also cancels the move if the game is restarted or the mode changes while it is pending.
    return () => window.clearTimeout(id);
  }, [botTurn, settled, state.board, botPlayer, drop]);

  return botTurn;
}
