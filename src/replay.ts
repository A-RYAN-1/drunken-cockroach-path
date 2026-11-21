/** Playback speeds offered by the replay controls, as multiples of BASE_RATE. */
export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
export const DEFAULT_SPEED_INDEX = 2;
/** Steps per second at 1x. */
export const BASE_RATE = 10;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Index into SPEEDS, clamped, so a stray value never reads past the list. */
export function speedIndex(value: number): number {
  return clamp(Math.round(value) || 0, 0, SPEEDS.length - 1);
}

export function stepsPerSecond(index: number): number {
  return BASE_RATE * SPEEDS[speedIndex(index)];
}

export function speedLabel(index: number): string {
  return `${SPEEDS[speedIndex(index)]}x`;
}

export type ReplayAction = 'back' | 'forward' | 'start' | 'end' | 'slower' | 'faster';

const KEYS: Record<string, ReplayAction> = {
  ',': 'back',
  '.': 'forward',
  Home: 'start',
  End: 'end',
  '[': 'slower',
  ']': 'faster',
};

/** The replay action for a key, or null. The arrow keys are not here: on the board they move the start cell. */
export function actionForKey(key: string): ReplayAction | null {
  return KEYS[key] ?? null;
}

/**
 * The step numbers (1-based, inclusive) of the move list: `listed` moves that
 * contain the current step, or the latest ones while the replay is at the end.
 * An empty list is first 1, last 0.
 */
export function moveWindow(cursor: number, generated: number, listed: number): { first: number; last: number } {
  if (generated <= listed) return { first: 1, last: generated };
  const first = clamp(cursor - Math.floor(listed / 2), 1, generated - listed + 1);
  return { first, last: first + listed - 1 };
}
