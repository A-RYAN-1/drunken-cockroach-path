import { describe, expect, it } from 'vitest';
import { LISTED_MOVES, moves, summary } from './describe';
import { Simulation } from './sim';

const walk = () => new Simulation({ mode: 'walk', start: { x: 1, y: 1 }, seed: 7, size: 4 });

describe('summary', () => {
  it('names the mode, board, start, progress and position', () => {
    const sim = new Simulation({ mode: 'tour', start: { x: 2, y: 0 }, seed: 1, size: 5 });
    sim.step();
    expect(summary(sim)).toBe(
      `Tour on a board of 5 by 5 cells from column 2, row 0: 2 of 25 cells visited in 1 steps, now at column ${sim.current.x}, row ${sim.current.y}.`,
    );
  });
});

describe('moves', () => {
  it('names diagonal tour moves with both directions and never says jump', () => {
    const sim = new Simulation({ mode: 'tour', start: { x: 3, y: 4 }, seed: 1 });
    while (sim.step());
    const list = moves(sim);
    const last = sim.path[sim.path.length - 1];
    const before = sim.path[sim.path.length - 2];
    const word = (n: number, neg: string, pos: string) => (n < 0 ? neg : n > 0 ? pos : '');
    const dir = [word(last.y - before.y, 'up', 'down'), word(last.x - before.x, 'left', 'right')].filter(Boolean).join('-');
    expect(list[list.length - 1]).toBe(`Step 63: ${dir} to column ${last.x}, row ${last.y}`);
    expect(list.some((m) => /(up|down)-(left|right)/.test(m))).toBe(true);
    expect(list.some((m) => m.includes('jump'))).toBe(false);
  });

  it('is empty before the first step', () => {
    expect(moves(walk())).toEqual([]);
  });

  it('gives each move a direction that matches the path', () => {
    const sim = walk();
    for (let i = 0; i < 10; i++) sim.step();
    const list = moves(sim);
    expect(list).toHaveLength(10);
    sim.path.slice(1).forEach((c, i) => {
      const p = sim.path[i];
      const dir = c.x > p.x ? 'right' : c.x < p.x ? 'left' : c.y > p.y ? 'down' : 'up';
      expect(list[i]).toBe(`Step ${i + 1}: ${dir} to column ${c.x}, row ${c.y}`);
    });
  });

  it('keeps only the latest moves of a long run and numbers them by step', () => {
    const sim = walk();
    for (let i = 0; i < 200; i++) sim.step();
    const list = moves(sim);
    expect(list).toHaveLength(LISTED_MOVES);
    expect(list[0].startsWith('Step 151:')).toBe(true);
    expect(list[LISTED_MOVES - 1].startsWith('Step 200:')).toBe(true);
  });
});
