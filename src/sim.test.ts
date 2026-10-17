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
