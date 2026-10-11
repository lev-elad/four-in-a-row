import type { GameStatus, Player } from '../game/types';
import { Disc } from './Disc';
import styles from './StatusBanner.module.css';

interface StatusBannerProps {
  status: GameStatus;
  /** The player to move, or the winner once the game is won. */
  player: Player;
  message: string;
}

export function StatusBanner({ status, player, message }: StatusBannerProps) {
  return (
    <p className={`${styles.banner} ${status === 'playing' ? '' : styles.over}`} role="status">
      {status !== 'draw' && (
        <span className={styles.swatch}>
          <Disc player={player} />
        </span>
      )}
      <span className={styles.text}>{message}</span>
    </p>
  );
}
