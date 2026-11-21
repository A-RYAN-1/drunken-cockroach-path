import { SIZE, createRng, randomStep, solveTour, visitCounts, type Cell } from './walk';

export type Mode = 'tour' | 'walk';

export interface Settings {
  mode: Mode;
  start: Cell;
  seed: number;
  /** Cells per side; defaults to the 8x8 board. */
  size?: number;
}

/**
 * One run of the cockroach, with a cursor that can move both ways. In "tour"
 * mode the whole path is solved up front; in "walk" mode each new step is drawn
 * from the seeded generator the first time the cursor reaches it, so the same
 * settings always give the same walk and stepping back never changes it.
 */
export class Simulation {
  readonly settings: Settings;
  /** True when the tour mode has no path from the start cell. */
  readonly unsolvable: boolean;
  /** Cells per side of this run's board. */
  readonly size: number;
  private readonly rng: () => number;
  /** Every cell that exists so far, start included. */
  private readonly trace: Cell[];
  private position = 0;
  private covered: number | null = null;
  private readonly seen: Uint8Array;
  private distinct = 1;

  constructor(settings: Settings) {
    this.settings = settings;
    this.size = settings.size ?? SIZE;
    this.rng = createRng(settings.seed);
    const tour = settings.mode === 'tour' ? solveTour(settings.start, { size: this.size }) : null;
    this.unsolvable = settings.mode === 'tour' && tour === null;
    this.trace = tour ?? [settings.start];
    this.seen = new Uint8Array(this.size ** 2);
    this.seen[settings.start.y * this.size + settings.start.x] = 1;
  }

  /** Steps shown so far (the start cell is step 0). */
  get steps(): number {
    return this.position;
  }

  /** How many steps exist: the whole tour, or the walk generated so far. */
  get generated(): number {
    return this.trace.length - 1;
  }

  /** Every step that exists, including the ones after the cursor. */
  get fullPath(): readonly Cell[] {
    return this.trace;
  }

  /** Cells visited up to the cursor, start included. */
  get path(): Cell[] {
    return this.position === this.generated ? this.trace : this.trace.slice(0, this.position + 1);
  }

  get current(): Cell {
    return this.trace[this.position];
  }

  /** Step at which a walk first stood on every cell, once the cursor has reached it; null before (and in tour mode). */
  get coveredAt(): number | null {
    return this.covered !== null && this.covered <= this.position ? this.covered : null;
  }

  /** The tour is finished when the cursor is on its last cell; a walk never finishes. */
  get done(): boolean {
    return this.settings.mode === 'tour' && this.position === this.generated;
  }

  get visitedCells(): number {
    return visitCounts(this.path, this.size).flat().filter((n) => n > 0).length;
  }

  /** One step forward: along the steps that exist, else a new walk step. False when the tour is done. */
  step(): boolean {
    if (this.done) return false;
    if (this.position === this.generated) this.extend();
    this.position++;
    return true;
  }

  /** One step back. False at the start. */
  back(): boolean {
    if (this.position === 0) return false;
    this.position--;
    return true;
  }

  /** Moves the cursor to a step, clamped to the steps that exist, and returns where it ended. */
  seek(target: number): number {
    const to = Math.min(this.generated, Math.max(0, Math.floor(target) || 0));
    this.position = to;
    return to;
  }

  private extend(): void {
    const next = randomStep(this.trace[this.trace.length - 1], this.rng, this.size);
    this.trace.push(next);
    const i = next.y * this.size + next.x;
    if (!this.seen[i]) {
      this.seen[i] = 1;
      this.distinct++;
      if (this.distinct === this.size ** 2) this.covered = this.generated;
    }
  }
}
