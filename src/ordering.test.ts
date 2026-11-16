import { describe, expect, it } from 'vitest';
import { collectDecisions, fit, TRAIN_SIZES } from './training';
import { FEATURE_NAMES, LEARNED_WEIGHTS, features, score } from './ordering';
import { TOUR_MOVES, inBounds, solveTour, solveTourStats, type Cell } from './walk';

const king = (a: Cell, b: Cell) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;

function openOn(size: number, visited: Cell[]) {
  const taken = new Set(visited.map((c) => `${c.x},${c.y}`));
  return (c: Cell): Cell[] =>
    TOUR_MOVES.map((m) => ({ x: c.x + m.x, y: c.y + m.y })).filter(
      (n) => inBounds(n, size) && !taken.has(`${n.x},${n.y}`),
    );
}

describe('features', () => {
  it('describes a corner and a centre cell of an empty 8x8 board', () => {
    const open = openOn(8, []);
    const corner = features({ x: 0, y: 0 }, open, 8, 0);
    const centre = features({ x: 3, y: 3 }, open, 8, 0);
    expect(corner).toHaveLength(FEATURE_NAMES.length);
    expect(corner[0]).toBe(3); // onward moves from a corner
    expect(centre[0]).toBe(8);
    expect(corner[1]).toBe(0); // edge distance
    expect(centre[1]).toBe(3);
  });

  it('counts a neighbour left with no way on as a dead end', () => {
    // Only the top row is open. Taking (1,0) leaves (0,0) and (2,0) with no onward move.
    const open = openOn(3, [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
    expect(features({ x: 1, y: 0 }, open, 3, 6)[3]).toBe(2);
    expect(features({ x: 0, y: 0 }, open, 3, 6)[3]).toBe(0); // (1,0) still has (2,0) on
  });
});

describe('the weights file', () => {
  it('matches the feature list and has finite numbers', () => {
    expect(LEARNED_WEIGHTS.features).toEqual([...FEATURE_NAMES]);
    for (const list of [LEARNED_WEIGHTS.mean, LEARNED_WEIGHTS.scale, LEARNED_WEIGHTS.weights]) {
      expect(list).toHaveLength(FEATURE_NAMES.length);
      expect(list.every(Number.isFinite)).toBe(true);
    }
    expect(LEARNED_WEIGHTS.scale.every((s) => s > 0)).toBe(true);
  });

  it('is what the training script produces from its own data', () => {
    const model = fit(collectDecisions(TRAIN_SIZES));
    model.weights.forEach((w, i) => expect(w).toBeCloseTo(LEARNED_WEIGHTS.weights[i], 4));
  }, 30_000);

  it('scores a candidate with fewer onward moves lower when only that weight is on', () => {
    const only = { ...LEARNED_WEIGHTS, mean: [0, 0, 0, 0, 0], scale: [1, 1, 1, 1, 1], weights: [1, 0, 0, 0, 0] };
    expect(score([2, 0, 0, 0, 0], only)).toBeLessThan(score([5, 0, 0, 0, 0], only));
  });
});

describe('the learned order', () => {
  it('still returns real tours: every cell once, king moves, from every start of boards 3 to 7', () => {
    for (let size = 3; size <= 7; size++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const path = solveTour({ x, y }, { size, order: 'learned' });
          expect(path, `size ${size} start ${x},${y}`).not.toBeNull();
          expect(path).toHaveLength(size * size);
          expect(new Set(path!.map((c) => `${c.x},${c.y}`)).size).toBe(size * size);
          path!.slice(1).forEach((c, i) => expect(king(path![i], c)).toBe(true));
        }
      }
    }
  });

  it('reports the search it did, and the default auto order is unchanged', () => {
    const run = solveTourStats({ x: 0, y: 0 }, { size: 5, order: 'warnsdorff' });
    expect(run.path).not.toBeNull();
    expect(run.extensions).toBe(24);
    expect(solveTour({ x: 7, y: 6 })).not.toBeNull();
  });
});
