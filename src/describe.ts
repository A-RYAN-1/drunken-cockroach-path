import type { Simulation } from './sim';
import { moveWindow } from './replay';

/** shortcut: only the latest moves are listed, so a long walk stays readable; raise it if users ask for the full path. */
export const LISTED_MOVES = 50;

/** Compass words for one move; the tour also steps diagonally, e.g. "up-right". */
const direction = (dx: number, dy: number) =>
  [dy < 0 ? 'up' : dy > 0 ? 'down' : '', dx < 0 ? 'left' : dx > 0 ? 'right' : ''].filter(Boolean).join('-') || 'stay';

/** One sentence for the canvas label: mode, board, start, progress and where the cockroach stands. */
export function summary(sim: Simulation): string {
  const { mode, start } = sim.settings;
  const n = sim.size;
  const kind = mode === 'tour' ? 'Tour' : 'Random walk';
  const progress = `${sim.visitedCells} of ${n * n} cells visited in ${sim.steps} steps`;
  const now = `now at column ${sim.current.x}, row ${sim.current.y}`;
  return `${kind} on a board of ${n} by ${n} cells from column ${start.x}, row ${start.y}: ${progress}, ${now}.`;
}

/** The first step number of the listed moves, see moveWindow. */
const firstListed = (sim: Simulation) => moveWindow(sim.steps, sim.generated, LISTED_MOVES).first;

/**
 * The moves around the current step as text, oldest first, each with its direction; while the replay is at the
 * end these are the latest moves. Columns and rows count from 0.
 */
export function moves(sim: Simulation): string[] {
  const { first, last } = moveWindow(sim.steps, sim.generated, LISTED_MOVES);
  const path = sim.fullPath;
  const out: string[] = [];
  for (let i = first; i <= last; i++) {
    const a = path[i - 1];
    const b = path[i];
    const dir = direction(b.x - a.x, b.y - a.y);
    out.push(`Step ${i}: ${dir} to column ${b.x}, row ${b.y}`);
  }
  return out;
}

/** Index in `moves(sim)` of the step the cursor is on, or -1 at the start or when it is not listed. */
export function currentMoveIndex(sim: Simulation): number {
  const index = sim.steps - firstListed(sim);
  return sim.steps >= 1 && index >= 0 && index < LISTED_MOVES ? index : -1;
}
