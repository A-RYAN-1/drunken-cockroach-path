// Training data and the fitting step of the learned move ordering (see scripts/train-ordering.ts).
import { FEATURE_NAMES, features } from './ordering';
import { TOUR_MOVES, inBounds, solveTour, type Cell } from './walk';

export const TRAIN_SIZES = [4, 5, 6, 7];
export const EPOCHS = 600;
export const RATE = 0.2;
export const L2 = 1e-3;

interface Decision {
  rows: number[][];
  chosen: number;
}

export function collectDecisions(sizes: number[], order: 'auto' | 'warnsdorff' = 'warnsdorff'): Decision[] {
  const decisions: Decision[] = [];
  for (const size of sizes) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const path = solveTour({ x, y }, { size, order });
        if (!path) continue;
        const visited = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
        const open = (c: Cell): Cell[] =>
          TOUR_MOVES.map((m) => ({ x: c.x + m.x, y: c.y + m.y })).filter(
            (n) => inBounds(n, size) && !visited[n.y][n.x],
          );
        visited[y][x] = true;
        for (let i = 1; i < path.length; i++) {
          const candidates = open(path[i - 1]);
          if (candidates.length > 1) {
            decisions.push({
              rows: candidates.map((c) => features(c, open, size, i)),
              chosen: candidates.findIndex((c) => c.x === path[i].x && c.y === path[i].y),
            });
          }
          visited[path[i].y][path[i].x] = true;
        }
      }
    }
  }
  return decisions;
}

export function fit(decisions: Decision[]) {
  const all = decisions.flatMap((d) => d.rows);
  const dims = FEATURE_NAMES.length;
  const mean = Array.from({ length: dims }, (_, j) => all.reduce((s, r) => s + r[j], 0) / all.length);
  const scale = Array.from({ length: dims }, (_, j) => {
    const variance = all.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / all.length;
    return Math.sqrt(variance) || 1;
  });
  const z = decisions.map((d) => ({
    chosen: d.chosen,
    rows: d.rows.map((r) => r.map((v, j) => (v - mean[j]) / scale[j])),
  }));
  const w = new Array<number>(dims).fill(0);
  w[0] = 1; // start from Warnsdorff: fewest onward moves first
  let loss = 0;
  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    const grad = new Array<number>(dims).fill(0);
    loss = 0;
    for (const d of z) {
      const logits = d.rows.map((r) => -r.reduce((s, v, j) => s + v * w[j], 0));
      const top = Math.max(...logits);
      const exps = logits.map((l) => Math.exp(l - top));
      const total = exps.reduce((a, b) => a + b, 0);
      loss -= Math.log(exps[d.chosen] / total);
      d.rows.forEach((r, k) => {
        const p = exps[k] / total - (k === d.chosen ? 1 : 0);
        for (let j = 0; j < dims; j++) grad[j] += -p * r[j];
      });
    }
    for (let j = 0; j < dims; j++) w[j] -= RATE * (grad[j] / z.length + L2 * w[j]);
  }
  return { mean, scale, weights: w, loss: loss / z.length, decisions: z.length };
}

