import { describe, expect, it } from 'vitest';
import { coverExperiment, coverSteps, summarise } from './coverage';
import { Simulation } from './sim';

const start = { x: 0, y: 0 };

describe('coverSteps', () => {
  it('is repeatable for one seed', () => {
    expect(coverSteps(start, 7, 4)).toBe(coverSteps(start, 7, 4));
  });

  it('needs at least size*size - 1 steps', () => {
    for (let seed = 0; seed < 20; seed++) {
      expect(coverSteps(start, seed, 4)).toBeGreaterThanOrEqual(15);
    }
  });

  it('gives up with null at the cap', () => {
    expect(coverSteps(start, 1, 12, 10)).toBeNull();
  });

  it('agrees with the step-by-step simulation', () => {
    const expected = coverSteps(start, 3, 5);
    const sim = new Simulation({ mode: 'walk', start, seed: 3, size: 5 });
    expect(sim.coveredAt).toBeNull();
    while (sim.coveredAt === null) sim.step();
    expect(sim.coveredAt).toBe(expected);
    expect(sim.steps).toBe(expected);
  });
});

describe('simulation coverage', () => {
  it('stays null in tour mode and does not move once set', () => {
    const tour = new Simulation({ mode: 'tour', start, seed: 1, size: 4 });
    while (tour.step());
    expect(tour.coveredAt).toBeNull();
    const walk = new Simulation({ mode: 'walk', start, seed: 2, size: 3 });
    while (walk.coveredAt === null) walk.step();
    const at = walk.coveredAt;
    for (let i = 0; i < 50; i++) walk.step();
    expect(walk.coveredAt).toBe(at);
  });
});

describe('coverExperiment and summarise', () => {
  it('runs consecutive seeds and summarises them', () => {
    const runs = coverExperiment(start, 10, 5, 3);
    expect(runs.map((r) => r.seed)).toEqual([10, 11, 12, 13, 14]);
    const stats = summarise(runs);
    expect(stats).not.toBeNull();
    expect(stats!.covered).toBe(5);
    expect(stats!.min).toBeLessThanOrEqual(stats!.median);
    expect(stats!.median).toBeLessThanOrEqual(stats!.max);
    expect(stats!.mean).toBeGreaterThanOrEqual(stats!.min);
  });

  it('takes the median of an even count and skips uncovered runs', () => {
    const stats = summarise([
      { seed: 1, steps: 10 },
      { seed: 2, steps: 30 },
      { seed: 3, steps: null },
    ]);
    expect(stats).toEqual({ runs: 3, covered: 2, min: 10, median: 20, mean: 20, max: 30 });
  });

  it('returns null when nothing covered', () => {
    expect(summarise([{ seed: 1, steps: null }])).toBeNull();
    expect(summarise([])).toBeNull();
  });
});
