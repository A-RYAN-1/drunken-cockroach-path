import { describe, expect, it } from 'vitest';
import { Simulation } from './sim';
import { SIZE } from './walk';

const start = { x: 2, y: 5 };

describe('Simulation (tour)', () => {
  it('reveals one cell per step and stops after 63 steps', () => {
    const sim = new Simulation({ mode: 'tour', start, seed: 1 });
    expect(sim.steps).toBe(0);
    let moved = 0;
    while (sim.step()) moved++;
    expect(moved).toBe(SIZE * SIZE - 1);
    expect(sim.done).toBe(true);
    expect(sim.visitedCells).toBe(SIZE * SIZE);
    expect(sim.step()).toBe(false);
  });

  it('ignores the seed', () => {
    const a = new Simulation({ mode: 'tour', start, seed: 1 });
    const b = new Simulation({ mode: 'tour', start, seed: 2 });
    while (a.step()) b.step();
    expect(a.path).toEqual(b.path);
  });
});

describe('Simulation (board size)', () => {
  it('tours every cell of a smaller and a larger board', () => {
    for (const size of [3, 5, 12]) {
      const sim = new Simulation({ mode: 'tour', start: { x: 1, y: 2 }, seed: 1, size });
      while (sim.step());
      expect(sim.size).toBe(size);
      expect(sim.visitedCells).toBe(size * size);
      expect(sim.unsolvable).toBe(false);
    }
  });

  it('keeps a random walk on the chosen board', () => {
    const sim = new Simulation({ mode: 'walk', start: { x: 0, y: 0 }, seed: 5, size: 4 });
    for (let i = 0; i < 1000; i++) sim.step();
    expect(sim.path.every((c) => c.x >= 0 && c.x < 4 && c.y >= 0 && c.y < 4)).toBe(true);
    expect(sim.visitedCells).toBeLessThanOrEqual(16);
  });

  it('defaults to the 8x8 board', () => {
    expect(new Simulation({ mode: 'walk', start, seed: 1 }).size).toBe(SIZE);
  });
});

describe('Simulation (walk)', () => {
  it('replays the same walk from the same settings', () => {
    const a = new Simulation({ mode: 'walk', start, seed: 12 });
    const b = new Simulation({ mode: 'walk', start, seed: 12 });
    for (let i = 0; i < 500; i++) {
      a.step();
      b.step();
    }
    expect(a.path).toEqual(b.path);
    expect(a.steps).toBe(500);
  });

  it('never finishes, and visits no more cells than the board has', () => {
    const sim = new Simulation({ mode: 'walk', start, seed: 3 });
    for (let i = 0; i < 2000; i++) expect(sim.step()).toBe(true);
    expect(sim.done).toBe(false);
    expect(sim.visitedCells).toBeLessThanOrEqual(SIZE * SIZE);
  });
});
