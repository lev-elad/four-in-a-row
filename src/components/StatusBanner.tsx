import type { GameStatus, Player } from '../game/types';
import { Disc } from './Disc';
import styles from './StatusBanner.module.css';

interface StatusBannerProps {
  status: GameStatus;
  /** The player to move, or the winner once the game is won. */
  player: Player;
  playerName: string;
}

export function StatusBanner({ status, player, playerName }: StatusBannerProps) {
  return (
    <p className={`${styles.banner} ${status === 'playing' ? '' : styles.over}`} role="status">
      {status !== 'draw' && (
        <span className={styles.swatch}>
          <Disc player={player} />
        </span>
      )}
      <span className={styles.text}>
        {status === 'playing' && `${playerName}’s turn`}
        {status === 'won' && `${playerName} wins!`}
        {status === 'draw' && 'It’s a draw'}
      </span>
    </p>
  );
}
