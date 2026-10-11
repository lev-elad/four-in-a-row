import { useState } from 'react';
import styles from './Controls.module.css';

interface ControlsProps {
  gameOver: boolean;
  draws: number;
  hasScores: boolean;
  onNewGame: () => void;
  onResetScores: () => void;
}

export function Controls({ gameOver, draws, hasScores, onNewGame, onResetScores }: ControlsProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={`${styles.button} ${gameOver ? styles.primary : ''}`}
        onClick={onNewGame}
      >
        {gameOver ? 'Play again' : 'New game'}
      </button>

      <div className={styles.scores}>
        <span className={styles.draws}>
          Draws: <strong>{draws}</strong>
        </span>
        {confirming ? (
          <span className={styles.confirm}>
            Reset all scores?
            <button
              type="button"
              className={styles.link}
              onClick={() => {
                onResetScores();
                setConfirming(false);
              }}
            >
              Yes, reset
            </button>
            <button type="button" className={styles.link} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={styles.link}
            disabled={!hasScores}
            onClick={() => setConfirming(true)}
          >
            Reset scores
          </button>
        )}
      </div>
    </div>
  );
}
