import type { KeyboardEvent } from 'react';
import { COLS } from '../game/types';
import type { Board as BoardCells, Player, Position } from '../game/types';
import styles from './Board.module.css';
import { Column } from './Column';

interface BoardProps {
  board: BoardCells;
  currentPlayer: Player;
  canPlay: boolean;
  /** Empty until a win is revealed. */
  winningCells: Position[];
  onDrop: (col: number) => void;
}

export function Board({ board, currentPlayer, canPlay, winningCells, onDrop }: BoardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const columns = Array.from(event.currentTarget.querySelectorAll('button'));
    const index = columns.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next = index + (event.key === 'ArrowRight' ? 1 : -1);
    columns[Math.max(0, Math.min(COLS - 1, next))].focus();
  };

  return (
    <div className={styles.board} role="group" aria-label="Game board" onKeyDown={handleKeyDown}>
      {Array.from({ length: COLS }, (_, col) => (
        <Column
          key={col}
          col={col}
          cells={board.map((row) => row[col])}
          currentPlayer={currentPlayer}
          canPlay={canPlay}
          winningRows={winningCells.filter((cell) => cell.col === col).map((cell) => cell.row)}
          gameWon={winningCells.length > 0}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
}
