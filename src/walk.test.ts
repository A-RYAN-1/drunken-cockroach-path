import { describe, expect, it } from 'vitest';
import {
  SIZE,
  createRng,
  inBounds,
  randomStep,
  randomWalk,
  solveTour,
  unvisited,
  visitCounts,
  type Cell,
} from './walk';

const adjacent8 = (a: Cell, b: Cell) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;
const adjacent4 = (a: Cell, b: Cell) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

describe('solveTour', () => {
  it('finds a path from every one of the 64 start cells', () => {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        expect(solveTour({ x, y }), `start ${x},${y}`).not.toBeNull();
      }
    }
  });

  it('visits every cell exactly once, one king move at a time', () => {
    const path = solveTour({ x: 3, y: 4 })!;
    expect(path).toHaveLength(SIZE * SIZE);
    expect(new Set(path.map((c) => `${c.x},${c.y}`)).size).toBe(SIZE * SIZE);
    path.forEach((c, i) => {
      expect(inBounds(c)).toBe(true);
      if (i > 0) expect(adjacent8(path[i - 1], c)).toBe(true);
    });
  });

  it('starts at the requested cell and is deterministic', () => {
    const a = solveTour({ x: 0, y: 0 })!;
    expect(a[0]).toEqual({ x: 0, y: 0 });
    expect(solveTour({ x: 0, y: 0 })).toEqual(a);
  });

  it('the original move order alone runs out of budget from 7,6; auto still solves it', () => {
    expect(solveTour({ x: 7, y: 6 }, { order: 'fixed' })).toBeNull();
    expect(solveTour({ x: 7, y: 6 })).toHaveLength(SIZE * SIZE);
  });

  it('Warnsdorff ordering alone solves the start the original order cannot', () => {
    expect(solveTour({ x: 7, y: 6 }, { order: 'warnsdorff' })).toHaveLength(SIZE * SIZE);
  });

  it('rejects a start outside the board', () => {
    expect(solveTour({ x: -1, y: 0 })).toBeNull();
    expect(solveTour({ x: 0, y: SIZE })).toBeNull();
  });

  it('solves the smallest boards', () => {
    expect(solveTour({ x: 0, y: 0 }, { size: 1 })).toHaveLength(1);
    expect(solveTour({ x: 0, y: 0 }, { size: 2 })).toHaveLength(4);
  });
});

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('gives different sequences for different seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it('stays in [0, 1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randomWalk', () => {
  it('is reproducible from its seed and differs between seeds', () => {
    const start = { x: 4, y: 4 };
    expect(randomWalk(start, 200, 99)).toEqual(randomWalk(start, 200, 99));
    expect(randomWalk(start, 200, 99)).not.toEqual(randomWalk(start, 200, 100));
  });

  it('takes one up/down/left/right step at a time and never leaves the board', () => {
    const path = randomWalk({ x: 0, y: 0 }, 5000, 5);
    expect(path).toHaveLength(5001);
    path.forEach((c, i) => {
      expect(inBounds(c)).toBe(true);
      if (i > 0) expect(adjacent4(path[i - 1], c)).toBe(true);
    });
  });

  it('can always move, even from a corner', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const next = randomStep({ x: 0, y: 0 }, rng);
      expect(adjacent4({ x: 0, y: 0 }, next)).toBe(true);
    }
  });

  it('with zero steps is just the start', () => {
    expect(randomWalk({ x: 2, y: 2 }, 0, 1)).toEqual([{ x: 2, y: 2 }]);
  });
});

describe('visitCounts and unvisited', () => {
  it('counts repeat visits per cell', () => {
    const counts = visitCounts([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ]);
    expect(counts[0][0]).toBe(2);
    expect(counts[0][1]).toBe(1);
    expect(counts.flat().reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('counts the cells not yet touched', () => {
    expect(unvisited([{ x: 0, y: 0 }])).toBe(SIZE * SIZE - 1);
    expect(unvisited(solveTour({ x: 0, y: 0 })!)).toBe(0);
  });
});
