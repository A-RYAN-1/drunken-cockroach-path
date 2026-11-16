import type { Cell } from './walk';
import learned from './learned-weights.json';

/**
 * What the learned move ordering looks at for one candidate next cell. The list
 * is the contract between the trainer (scripts/train-ordering.ts), the weights
 * file and the solver: change it and the weights must be trained again.
 */
export const FEATURE_NAMES = [
  'onward',
  'edgeDistance',
  'centreDistance',
  'deadEnds',
  'onwardTimesProgress',
] as const;

export interface OrderingWeights {
  features: readonly string[];
  mean: number[];
  scale: number[];
  weights: number[];
  /** How the weights were made: sizes and starts used, seed, date. */
  provenance: Record<string, unknown>;
}

export const LEARNED_WEIGHTS = learned as OrderingWeights;

/**
 * Features of moving to `c`. `openNeighbours` lists the unvisited cells one king
 * move from a cell; `placed` is how many cells the path holds before the move.
 */
export function features(
  c: Cell,
  openNeighbours: (cell: Cell) => Cell[],
  size: number,
  placed: number,
): number[] {
  const around = openNeighbours(c);
  const onward = around.length;
  // A neighbour whose only open neighbour is c itself is left with no way on once c is taken.
  const deadEnds = around.filter((n) => openNeighbours(n).length <= 1).length;
  const edgeDistance = Math.min(c.x, c.y, size - 1 - c.x, size - 1 - c.y);
  const mid = (size - 1) / 2;
  const centreDistance = Math.hypot(c.x - mid, c.y - mid) / size;
  const progress = placed / (size * size);
  return [onward, edgeDistance, centreDistance, deadEnds, onward * progress];
}

/** Lower is tried first, the same direction as Warnsdorff's count of onward moves. */
export function score(f: readonly number[], model: OrderingWeights = LEARNED_WEIGHTS): number {
  let total = 0;
  for (let i = 0; i < f.length; i++) total += (model.weights[i] * (f[i] - model.mean[i])) / model.scale[i];
  return total;
}
