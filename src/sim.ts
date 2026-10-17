import { SIZE, createRng, randomStep, solveTour, visitCounts, type Cell } from './walk';

export type Mode = 'tour' | 'walk';

export interface Settings {
  mode: Mode;
  start: Cell;
  seed: number;
}

/**
 * One run of the cockroach. In "tour" mode the whole path is solved up front
 * and revealed one step at a time; in "walk" mode each step is drawn from the
 * seeded generator, so the same settings always replay the same walk.
 */
export class Simulation {
  readonly settings: Settings;
  /** Cells visited so far, start included. */
  readonly path: Cell[];
  /** True when the tour mode has no path from the start cell. */
  readonly unsolvable: boolean;
  private readonly rng: () => number;
  private readonly tour: Cell[] | null;

  constructor(settings: Settings) {
    this.settings = settings;
    this.path = [settings.start];
    this.rng = createRng(settings.seed);
    this.tour = settings.mode === 'tour' ? solveTour(settings.start) : null;
    this.unsolvable = settings.mode === 'tour' && this.tour === null;
  }

  /** Steps taken so far (the start cell is step 0). */
  get steps(): number {
    return this.path.length - 1;
  }

  get current(): Cell {
    return this.path[this.path.length - 1];
  }

  /** The tour is finished when every cell is visited; a walk never finishes. */
  get done(): boolean {
    return this.settings.mode === 'tour' && (this.unsolvable || this.path.length === SIZE * SIZE);
  }

  get visitedCells(): number {
    return visitCounts(this.path).flat().filter((n) => n > 0).length;
  }

  step(): boolean {
    if (this.done) return false;
    if (this.tour) this.path.push(this.tour[this.path.length]);
    else this.path.push(randomStep(this.current, this.rng));
    return true;
  }
}
