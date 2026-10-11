import { useState } from 'react';
import styles from './ModeSelector.module.css';

export type Mode = 'human' | 'computer';

const MODES: { value: Mode; label: string }[] = [
  { value: 'human', label: '2 Players' },
  { value: 'computer', label: 'vs Computer' },
];

interface ModeSelectorProps {
  mode: Mode;
  /** True while a game is under way, so switching would throw it away. */
  confirmSwitch: boolean;
  onChange: (mode: Mode) => void;
}

export function ModeSelector({ mode, confirmSwitch, onChange }: ModeSelectorProps) {
  const [pending, setPending] = useState<Mode | null>(null);

  const select = (next: Mode) => {
    if (next === mode) return;
    if (confirmSwitch) setPending(next);
    else onChange(next);
  };

  if (pending) {
    return (
      <div className={styles.confirm} role="group" aria-label="Confirm game mode change">
        <span>End this game and switch?</span>
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            onChange(pending);
            setPending(null);
          }}
        >
          Yes, switch
        </button>
        <button type="button" className={styles.link} onClick={() => setPending(null)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={styles.selector} role="radiogroup" aria-label="Game mode">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          className={styles.option}
          onClick={() => select(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
