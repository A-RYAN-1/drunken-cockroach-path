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

describe('Simulation (replay cursor)', () => {
  it('shows the solver move at every index, whichever way the cursor got there', () => {
    const sim = new Simulation({ mode: 'tour', start, seed: 1 });
    const tour = [...sim.fullPath];
    expect(tour).toHaveLength(SIZE * SIZE);
    for (let i = 0; i < tour.length; i++) {
      sim.seek(i);
      expect(sim.steps).toBe(i);
      expect(sim.current).toEqual(tour[i]);
      expect(sim.path).toEqual(tour.slice(0, i + 1));
    }
    for (let i = tour.length - 1; i >= 0; i--) {
      expect(sim.current).toEqual(tour[i]);
      sim.back();
    }
    expect(sim.steps).toBe(0);
    expect(sim.back()).toBe(false);
  });

  it('is done only on the last cell and can be replayed after stepping back', () => {
    const sim = new Simulation({ mode: 'tour', start, seed: 1 });
    sim.seek(SIZE * SIZE - 1);
    expect(sim.done).toBe(true);
    expect(sim.step()).toBe(false);
    sim.back();
    expect(sim.done).toBe(false);
    expect(sim.step()).toBe(true);
    expect(sim.done).toBe(true);
  });

  it('clamps a seek to the steps that exist', () => {
    const sim = new Simulation({ mode: 'tour', start, seed: 1 });
    expect(sim.seek(-5)).toBe(0);
    expect(sim.seek(10_000)).toBe(SIZE * SIZE - 1);
    expect(sim.seek(Number.NaN)).toBe(0);
  });

  it('keeps a walk fixed when the cursor goes back and forward again', () => {
    const sim = new Simulation({ mode: 'walk', start, seed: 12 });
    for (let i = 0; i < 300; i++) sim.step();
    const seen = [...sim.path];
    for (let i = 0; i < 120; i++) sim.back();
    expect(sim.steps).toBe(180);
    expect(sim.generated).toBe(300);
    for (let i = 0; i < 120; i++) sim.step();
    expect(sim.path).toEqual(seen);
    const fresh = new Simulation({ mode: 'walk', start, seed: 12 });
    for (let i = 0; i < 301; i++) fresh.step();
    sim.step();
    expect(sim.path).toEqual(fresh.path);
  });

  it('cannot seek a walk past the steps generated so far', () => {
    const sim = new Simulation({ mode: 'walk', start, seed: 3 });
    for (let i = 0; i < 10; i++) sim.step();
    expect(sim.seek(50)).toBe(10);
  });

  it('reports the cover step only once the cursor has reached it', () => {
    const sim = new Simulation({ mode: 'walk', start: { x: 0, y: 0 }, seed: 5, size: 3 });
    let guard = 0;
    while (sim.coveredAt === null && guard++ < 5000) sim.step();
    const at = sim.coveredAt;
    expect(at).not.toBeNull();
    sim.seek((at as number) - 1);
    expect(sim.coveredAt).toBeNull();
    sim.seek(at as number);
    expect(sim.coveredAt).toBe(at);
    expect(sim.visitedCells).toBe(9);
  });

  it('counts visited cells at the cursor, not at the end', () => {
    const sim = new Simulation({ mode: 'tour', start, seed: 1 });
    sim.seek(10);
    expect(sim.visitedCells).toBe(11);
  });
});
