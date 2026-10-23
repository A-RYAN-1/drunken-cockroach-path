export const SIZE = 8;

/** Smallest and largest board the page offers; the tour solves every start cell in this range. */
export const MIN_SIZE = 3;
export const MAX_SIZE = 12;

export interface Cell {
  x: number;
  y: number;
}

/** The eight moves of the original C++ solver, in its order. */
export const TOUR_MOVES: readonly Cell[] = [
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

/** Up, down, left and right: the drunken cockroach's moves. */
export const WALK_MOVES: readonly Cell[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

export function inBounds(c: Cell, size = SIZE): boolean {
  return c.x >= 0 && c.x < size && c.y >= 0 && c.y < size;
}

/** Extensions the search may use per attempt before it gives up on an ordering. */
export const TOUR_BUDGET = 300_000;

export interface TourOptions {
  size?: number;
  /**
   * "fixed" tries the moves in the original C++ order. "warnsdorff" tries the
   * neighbour with the fewest onward moves first (ties keep the original
   * order). "auto" runs "fixed" first and "warnsdorff" if that ran out of
   * budget: the original order explodes from one start cell (7,6) and
   * Warnsdorff from another (4,2), so together they cover the whole board.
   */
  order?: 'auto' | 'fixed' | 'warnsdorff';
  /** Give up (return null) after this many extensions, per ordering tried. */
  budget?: number;
}

/**
 * Backtracking search for a path that visits every cell of the board exactly
 * once, moving one cell in any of eight directions per step (the algorithm of
 * legacy/Drunken_Cockroach.cpp). Returns the cells in visiting order, or null
 * when no such path starts at `start` or the budget ran out.
 */
export function solveTour(start: Cell, options: TourOptions = {}): Cell[] | null {
  const { size = SIZE, order = 'auto', budget = TOUR_BUDGET } = options;
  if (!inBounds(start, size)) return null;
  if (order === 'auto') {
    return (
      solveTour(start, { size, order: 'fixed', budget }) ??
      solveTour(start, { size, order: 'warnsdorff', budget })
    );
  }
  const visited = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const path: Cell[] = [start];
  visited[start.y][start.x] = true;
  let used = 0;

  const open = (c: Cell) => inBounds(c, size) && !visited[c.y][c.x];
  const neighbours = (at: Cell): Cell[] =>
    TOUR_MOVES.map((m) => ({ x: at.x + m.x, y: at.y + m.y })).filter(open);
  const onward = (c: Cell) => neighbours(c).length;

  const extend = (at: Cell): boolean => {
    if (path.length === size * size) return true;
    if (++used > budget) return false;
    const next = neighbours(at);
    if (order === 'warnsdorff') next.sort((a, b) => onward(a) - onward(b));
    for (const c of next) {
      visited[c.y][c.x] = true;
      path.push(c);
      if (extend(c)) return true;
      path.pop();
      visited[c.y][c.x] = false;
    }
    return false;
  };

  return extend(start) ? path : null;
}

/** mulberry32: a small seeded generator, so a run can be reproduced. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One random step: picks uniformly among the moves that stay on the board. */
export function randomStep(at: Cell, rng: () => number, size = SIZE): Cell {
  const options = WALK_MOVES.map((m) => ({ x: at.x + m.x, y: at.y + m.y })).filter((c) =>
    inBounds(c, size),
  );
  return options[Math.floor(rng() * options.length)];
}

/** The first `steps` cells of a seeded random walk, starting cell included. */
export function randomWalk(start: Cell, steps: number, seed: number, size = SIZE): Cell[] {
  const rng = createRng(seed);
  const path: Cell[] = [start];
  for (let i = 0; i < steps; i++) path.push(randomStep(path[path.length - 1], rng, size));
  return path;
}

/** How many times each cell appears in the path, as a size x size grid. */
export function visitCounts(path: readonly Cell[], size = SIZE): number[][] {
  const counts = Array.from({ length: size }, () => new Array<number>(size).fill(0));
  for (const c of path) counts[c.y][c.x] += 1;
  return counts;
}

/** Cells of the board the path has not touched yet. */
export function unvisited(path: readonly Cell[], size = SIZE): number {
  return visitCounts(path, size).flat().filter((n) => n === 0).length;
}
