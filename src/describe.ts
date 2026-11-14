import type { Simulation } from './sim';

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

/** The latest moves as text, oldest first, each with its direction. Columns and rows count from 0. */
export function moves(sim: Simulation): string[] {
  const first = Math.max(1, sim.path.length - LISTED_MOVES);
  const out: string[] = [];
  for (let i = first; i < sim.path.length; i++) {
    const a = sim.path[i - 1];
    const b = sim.path[i];
    const dir = direction(b.x - a.x, b.y - a.y);
    out.push(`Step ${i}: ${dir} to column ${b.x}, row ${b.y}`);
  }
  return out;
}
