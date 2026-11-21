import { describe, expect, it } from 'vitest';
import { BASE_RATE, DEFAULT_SPEED_INDEX, SPEEDS, actionForKey, moveWindow, speedIndex, speedLabel, stepsPerSecond } from './replay';

describe('speeds', () => {
  it('offers 0.25x to 8x with 1x as the default', () => {
    expect(SPEEDS[0]).toBe(0.25);
    expect(SPEEDS[SPEEDS.length - 1]).toBe(8);
    expect(SPEEDS[DEFAULT_SPEED_INDEX]).toBe(1);
  });

  it('scales the base rate and labels the choice', () => {
    expect(stepsPerSecond(DEFAULT_SPEED_INDEX)).toBe(BASE_RATE);
    expect(stepsPerSecond(0)).toBe(BASE_RATE / 4);
    expect(stepsPerSecond(SPEEDS.length - 1)).toBe(BASE_RATE * 8);
    expect(speedLabel(0)).toBe('0.25x');
    expect(speedLabel(5)).toBe('8x');
  });

  it('clamps a stray index instead of reading past the list', () => {
    expect(speedIndex(-3)).toBe(0);
    expect(speedIndex(99)).toBe(SPEEDS.length - 1);
    expect(speedIndex(Number.NaN)).toBe(0);
    expect(stepsPerSecond(99)).toBe(stepsPerSecond(SPEEDS.length - 1));
  });
});

describe('actionForKey', () => {
  it('maps the replay keys and leaves the arrows to the board', () => {
    expect(actionForKey(',')).toBe('back');
    expect(actionForKey('.')).toBe('forward');
    expect(actionForKey('Home')).toBe('start');
    expect(actionForKey('End')).toBe('end');
    expect(actionForKey('[')).toBe('slower');
    expect(actionForKey(']')).toBe('faster');
    expect(actionForKey('ArrowLeft')).toBeNull();
    expect(actionForKey('ArrowRight')).toBeNull();
    expect(actionForKey('a')).toBeNull();
  });
});

describe('moveWindow', () => {
  it('lists every move while there are few', () => {
    expect(moveWindow(3, 10, 50)).toEqual({ first: 1, last: 10 });
    expect(moveWindow(0, 0, 50)).toEqual({ first: 1, last: 0 });
  });

  it('shows the latest moves while the replay is at the end', () => {
    expect(moveWindow(200, 200, 50)).toEqual({ first: 151, last: 200 });
  });

  it('keeps the current step inside the window and the window inside the steps', () => {
    for (const cursor of [0, 1, 10, 24, 25, 60, 99, 100]) {
      const { first, last } = moveWindow(cursor, 100, 50);
      expect(last - first + 1).toBe(50);
      expect(first).toBeGreaterThanOrEqual(1);
      expect(last).toBeLessThanOrEqual(100);
      if (cursor >= 1) {
        expect(cursor).toBeGreaterThanOrEqual(first);
        expect(cursor).toBeLessThanOrEqual(last);
      }
    }
  });
});
