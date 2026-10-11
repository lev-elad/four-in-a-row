import type { Player } from '../game/types';
import styles from './Disc.module.css';

interface DiscProps {
  player: Player;
  /** Part of the winning line: gets a pulsing ring. */
  winning?: boolean;
  /** Faded out, used for the non-winning discs once a game is won. */
  dimmed?: boolean;
}

/** A player's disc. Fills its parent, which sets the size. */
export function Disc({ player, winning = false, dimmed = false }: DiscProps) {
  const className = [
    styles.disc,
    player === 'P1' ? styles.p1 : styles.p2,
    winning && styles.winning,
    dimmed && styles.dimmed,
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={className} aria-hidden="true" />;
}
