import type { Player } from '../game/types';
import { Disc } from './Disc';
import styles from './PlayerPanel.module.css';

export const MAX_NAME_LENGTH = 16;

interface PlayerPanelProps {
  player: Player;
  /** The name as typed, possibly empty while editing. */
  name: string;
  defaultName: string;
  wins: number;
  active: boolean;
  winner: boolean;
  onNameChange: (name: string) => void;
}

export function PlayerPanel({
  player,
  name,
  defaultName,
  wins,
  active,
  winner,
  onNameChange,
}: PlayerPanelProps) {
  const className = [
    styles.panel,
    player === 'P1' ? styles.p1 : styles.p2,
    (active || winner) && styles.active,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={className} aria-label={defaultName}>
      <span className={styles.swatch}>
        <Disc player={player} />
      </span>
      <input
        className={styles.name}
        value={name}
        placeholder={defaultName}
        maxLength={MAX_NAME_LENGTH}
        aria-label={`${defaultName} name`}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onNameChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={(event) => onNameChange(event.target.value.trim())}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
        }}
      />
      <p className={styles.score}>
        <span className={styles.wins}>{wins}</span>
        <span className={styles.winsLabel}>{wins === 1 ? 'win' : 'wins'}</span>
      </p>
      <span className={styles.tag} aria-hidden="true">
        {winner ? 'Winner' : active ? 'Your turn' : ' '}
      </span>
    </section>
  );
}
