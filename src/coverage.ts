import { SIZE, createRng, randomStep, type Cell } from './walk';

/** Walks longer than this are reported as not covered rather than run forever. */
export const COVER_CAP = 2_000_000;

/**
 * Steps a seeded random walk needs before it has stood on every cell of the
 * board, or null when it has not managed it within `cap` steps.
 */
export function coverSteps(start: Cell, seed: number, size = SIZE, cap = COVER_CAP): number | null {
  const rng = createRng(seed);
  const seen = new Uint8Array(size * size);
  let at = start;
  seen[at.y * size + at.x] = 1;
  let left = size * size - 1;
  for (let step = 1; step <= cap; step++) {
    at = randomStep(at, rng, size);
    const i = at.y * size + at.x;
    if (!seen[i]) {
      seen[i] = 1;
      if (--left === 0) return step;
    }
  }
  return left === 0 ? 0 : null;
}

export interface CoverRun {
  seed: number;
  steps: number | null;
}

export interface CoverStats {
  runs: number;
  covered: number;
  min: number;
  median: number;
  mean: number;
  max: number;
}

/** Cover time for `count` consecutive seeds starting at `firstSeed`. */
export function coverExperiment(start: Cell, firstSeed: number, count: number, size = SIZE, cap = COVER_CAP): CoverRun[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = firstSeed + i;
    return { seed, steps: coverSteps(start, seed, size, cap) };
  });
}

/** Summary of the runs that covered the board; null when none did. */
export function summarise(runs: readonly CoverRun[]): CoverStats | null {
  const steps = runs.flatMap((r) => (r.steps === null ? [] : [r.steps])).sort((a, b) => a - b);
  if (steps.length === 0) return null;
  const mid = steps.length >> 1;
  const median = steps.length % 2 ? steps[mid] : (steps[mid - 1] + steps[mid]) / 2;
  const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
  return { runs: runs.length, covered: steps.length, min: steps[0], median, mean, max: steps[steps.length - 1] };
}
