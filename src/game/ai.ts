import { COLS, CONNECT, ROWS } from './types';
import type { Board, Player } from './types';

/** How many moves ahead the computer looks. */
export const DEFAULT_DEPTH = 10;

const WIN_SCORE = 1_000_000;
/** Centre columns first: they are usually strongest, which makes the pruning far more effective. */
const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6];
/** Value of a window of four holding 0-3 discs of one side and none of the other. */
const WINDOW_VALUE = [0, 1, 6, 40];
const CENTRE_VALUE = 3;
const CENTRE = (COLS - 1) / 2;

const index = (row: number, col: number) => row * COLS + col;

/** Every run of four cells on the board, as cell indices. */
const WINDOWS: number[][] = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    for (const [dRow, dCol] of [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]) {
      const endRow = row + dRow * (CONNECT - 1);
      const endCol = col + dCol * (CONNECT - 1);
      if (endRow >= ROWS || endCol < 0 || endCol >= COLS) continue;
      WINDOWS.push(
        Array.from({ length: CONNECT }, (_, i) => index(row + dRow * i, col + dCol * i)),
      );
    }
  }
}

/** For each cell, the windows that pass through it. */
const WINDOWS_AT: number[][] = Array.from({ length: ROWS * COLS }, () => []);
WINDOWS.forEach((cells, w) => cells.forEach((cell) => WINDOWS_AT[cell].push(w)));

/** Two random 32-bit numbers per cell and side, combined into a fingerprint of the position. */
const FINGERPRINTS = (() => {
  // Fixed seed: the numbers only need to be well spread, and this keeps the search repeatable.
  let state = 0x9e3779b9;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  return Array.from({ length: ROWS * COLS * 2 * 2 }, next);
})();

const EXACT = 0;
const AT_LEAST = 1;
const AT_MOST = 2;
/** Makes stored scores positive so they can be packed into one number with the depth and kind. */
const SCORE_OFFSET = 2 * WIN_SCORE;

/**
 * The search works on its own mutable copy of the board (1 = the computer, -1 = its opponent)
 * because copying the board at every step is too slow. Per-window disc counts are kept up to
 * date as discs are placed and removed, so scoring a position and spotting a win are instant.
 */
class Search {
  /** Row the next disc would land on in each column; -1 when the column is full. */
  private readonly landing = new Int8Array(COLS);
  private readonly mine = new Int8Array(WINDOWS.length);
  private readonly theirs = new Int8Array(WINDOWS.length);
  /** Value of the position for the computer. */
  private score = 0;
  private keyLow = 0;
  private keyHigh = 0;
  /** Positions already searched, so the same position reached by another move order is not redone. */
  private readonly seen = new Map<number, number>();

  constructor(board: Board, player: Player) {
    this.landing.fill(ROWS - 1);
    // Bottom row first, so each column is filled in the order it was played.
    for (let row = ROWS - 1; row >= 0; row--) {
      for (let col = 0; col < COLS; col++) {
        const cell = board[row][col];
        if (cell !== null) this.play(col, cell === player ? 1 : -1);
      }
    }
  }

  canPlay(col: number): boolean {
    return this.landing[col] >= 0;
  }

  /** Drops a disc for `side` and returns whether it completes a line of four. */
  play(col: number, side: number): boolean {
    const cell = index(this.landing[col]--, col);
    const counts = side === 1 ? this.mine : this.theirs;
    let wins = false;
    for (const w of WINDOWS_AT[cell]) {
      this.score -= this.windowScore(w);
      if (++counts[w] === CONNECT) wins = true;
      this.score += this.windowScore(w);
    }
    if (col === CENTRE) this.score += side * CENTRE_VALUE;
    this.toggleFingerprint(cell, side);
    return wins;
  }

  undo(col: number, side: number): void {
    const cell = index(++this.landing[col], col);
    const counts = side === 1 ? this.mine : this.theirs;
    for (const w of WINDOWS_AT[cell]) {
      this.score -= this.windowScore(w);
      counts[w]--;
      this.score += this.windowScore(w);
    }
    if (col === CENTRE) this.score -= side * CENTRE_VALUE;
    this.toggleFingerprint(cell, side);
  }

  /** A window only counts for a side while the other side has no disc in it. */
  private windowScore(w: number): number {
    if (this.theirs[w] === 0) return WINDOW_VALUE[this.mine[w]];
    if (this.mine[w] === 0) return -WINDOW_VALUE[this.theirs[w]];
    return 0;
  }

  private toggleFingerprint(cell: number, side: number): void {
    const at = (cell * 2 + (side === 1 ? 0 : 1)) * 2;
    this.keyLow ^= FINGERPRINTS[at];
    this.keyHigh ^= FINGERPRINTS[at + 1];
  }

  /**
   * Best achievable score for `side`, who is about to move, looking `depth` moves ahead.
   * Alpha-beta pruning skips branches that cannot change the result.
   */
  negamax(depth: number, alpha: number, beta: number, side: number): number {
    if (depth === 0) return this.score * side;

    // 53 bits of fingerprint plus the depth: a different position sharing a key is vanishingly rare.
    const key = ((this.keyHigh & 0x1ffff) * 0x100000000 + (this.keyLow >>> 0)) * 16 + depth;
    const stored = this.seen.get(key);
    if (stored !== undefined) {
      const kind = stored & 3;
      const score = (stored - kind) / 4 - SCORE_OFFSET;
      if (kind === EXACT) return score;
      if (kind === AT_LEAST && score >= beta) return score;
      if (kind === AT_MOST && score <= alpha) return score;
    }

    // A win is worth more the sooner it happens, so the computer finishes games and delays losses.
    for (const col of COLUMN_ORDER) {
      if (!this.canPlay(col)) continue;
      const wins = this.play(col, side);
      this.undo(col, side);
      if (wins) return WIN_SCORE + depth;
    }

    const alphaAtStart = alpha;
    let best = -Infinity;
    for (const col of COLUMN_ORDER) {
      if (!this.canPlay(col)) continue;
      this.play(col, side);
      const score = -this.negamax(depth - 1, -beta, -alpha, -side);
      this.undo(col, side);

      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    // No legal move: the board is full, which is a draw.
    if (best === -Infinity) return 0;

    const kind = best <= alphaAtStart ? AT_MOST : best >= beta ? AT_LEAST : EXACT;
    this.seen.set(key, (best + SCORE_OFFSET) * 4 + kind);
    return best;
  }
}

export interface ChooseMoveOptions {
  depth?: number;
  /** Source of randomness for choosing between equally good moves; injectable for tests. */
  random?: () => number;
}

/**
 * The column the computer plays for `player`, or -1 if the board is full.
 * Looks `depth` moves ahead; between equally good moves it prefers the centre.
 */
export function chooseMove(
  board: Board,
  player: Player,
  { depth = DEFAULT_DEPTH, random = Math.random }: ChooseMoveOptions = {},
): number {
  const search = new Search(board, player);
  let bestScore = -Infinity;
  let bestColumns: number[] = [];

  for (const col of COLUMN_ORDER) {
    if (!search.canPlay(col)) continue;
    // The window starts just below the best score so far, so that ties come back as exact scores.
    const score = search.play(col, 1)
      ? WIN_SCORE + depth
      : -search.negamax(depth - 1, -Infinity, -(bestScore - 1), -1);
    search.undo(col, 1);

    if (score > bestScore) {
      bestScore = score;
      bestColumns = [col];
    } else if (score === bestScore) {
      bestColumns.push(col);
    }
  }

  if (bestColumns.length === 0) return -1;
  // Between equally good moves, stay as close to the centre as possible; chance decides left or right.
  const distance = (col: number) => Math.abs(col - CENTRE);
  const closest = Math.min(...bestColumns.map(distance));
  const candidates = bestColumns.filter((col) => distance(col) === closest);
  return candidates[Math.floor(random() * candidates.length)];
}
