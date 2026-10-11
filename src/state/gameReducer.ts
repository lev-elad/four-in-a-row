import { createBoard, dropDisc, findWinningLine, isBoardFull } from '../game/rules';
import { otherPlayer } from '../game/types';
import type { Board, GameStatus, Player, Position } from '../game/types';

export interface GameState {
  board: Board;
  currentPlayer: Player;
  startingPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningCells: Position[];
  lastMove: Position | null;
  moveCount: number;
}

export type GameAction = { type: 'DROP'; col: number } | { type: 'NEW_GAME' };

export function createInitialState(startingPlayer: Player = 'P1'): GameState {
  return {
    board: createBoard(),
    currentPlayer: startingPlayer,
    startingPlayer,
    status: 'playing',
    winner: null,
    winningCells: [],
    lastMove: null,
    moveCount: 0,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'DROP': {
      if (state.status !== 'playing') return state;
      const result = dropDisc(state.board, action.col, state.currentPlayer);
      if (!result) return state;

      const next = {
        ...state,
        board: result.board,
        lastMove: result.position,
        moveCount: state.moveCount + 1,
      };
      const winningCells = findWinningLine(result.board, result.position);
      if (winningCells) {
        return { ...next, status: 'won', winner: state.currentPlayer, winningCells };
      }
      if (isBoardFull(result.board)) {
        return { ...next, status: 'draw' };
      }
      return { ...next, currentPlayer: otherPlayer(state.currentPlayer) };
    }
    case 'NEW_GAME':
      return createInitialState(otherPlayer(state.startingPlayer));
  }
}
