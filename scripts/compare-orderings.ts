// Compares move orderings on every start cell of every board size and writes
// docs/move-ordering-results.md and .json.   npx tsx scripts/compare-orderings.ts
//
// Each ordering runs alone (no fallback) with the same extension budget per start cell.
// Boards 4 to 7 were used to train the learned ordering; 3 and 8 to 12 are unseen.
import { mkdirSync, writeFileSync } from 'node:fs';
import { LEARNED_WEIGHTS } from '../src/ordering';
import { TOUR_BUDGET, solveTourStats } from '../src/walk';
import { TRAIN_SIZES } from '../src/training';

const ORDERS = ['fixed', 'warnsdorff', 'learned'] as const;
const SIZES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface Row {
  size: number;
  order: string;
  starts: number;
  solved: number;
  medianExtensions: number;
  worstExtensions: number;
  totalExtensions: number;
  totalMs: number;
  trained: boolean;
}

const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const rows: Row[] = [];
for (const size of SIZES) {
  for (const order of ORDERS) {
    const extensions: number[] = [];
    let solved = 0;
    const began = performance.now();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const run = solveTourStats({ x, y }, { size, order, budget: TOUR_BUDGET });
        extensions.push(run.extensions);
        if (run.path) solved++;
      }
    }
    rows.push({
      size,
      order,
      starts: size * size,
      solved,
      medianExtensions: median(extensions),
      worstExtensions: Math.max(...extensions),
      totalExtensions: extensions.reduce((a, b) => a + b, 0),
      totalMs: Math.round(performance.now() - began),
      trained: order === 'learned' && TRAIN_SIZES.includes(size),
    });
  }
}

const date = new Date().toISOString().slice(0, 10);
const table = [
  '| board | order | start cells solved | median extensions | worst extensions | total ms |',
  '|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.size}x${r.size} | ${r.order}${r.trained ? ' (trained on this size)' : ''} | ${r.solved} of ${r.starts} | ${r.medianExtensions} | ${r.worstExtensions.toLocaleString('en-US')} | ${r.totalMs} |`,
  ),
].join('\n');

const text = `# Move ordering results

Measured ${date} (Node ${process.version}, one run each). Every start cell of every board size, each ordering alone with a budget of ${TOUR_BUDGET.toLocaleString('en-US')} extensions per start cell; "start cells solved" counts the starts that finished within that budget. An extension is one cell the search adds to the path, so fewer is a faster search independent of the machine; total ms is wall time and varies by machine.

- **fixed**: the original C++ order of the eight moves.
- **warnsdorff**: the neighbour with the fewest onward moves first.
- **learned**: candidates ranked by a linear score of ${LEARNED_WEIGHTS.features.join(', ')}, fitted offline on solved tours of boards ${TRAIN_SIZES.join(', ')} (${LEARNED_WEIGHTS.provenance.decisions} decisions; \`scripts/train-ordering.ts\`). Boards ${SIZES.filter((s) => !TRAIN_SIZES.includes(s)).join(', ')} are unseen.

${table}

## What the numbers say

Imitating Warnsdorff did not beat Warnsdorff. On boards it was trained on (4 to 7) the learned order matches it, because it learned mostly the same rule: the onward-move count carries the largest weight. On unseen boards it is worse, not better: it solves fewer start cells than plain Warnsdorff on 8x8 to 12x12 (see the table). The extra features it picked up (distance to the edge and centre, dead ends, progress) did not transfer from small boards, and a rule that matches the training decisions can still search badly, because one wrong early choice costs the whole budget.

A first attempt trained on tours the original order found as well (the default solver tries the fixed order first) did worse still: 39 of 49 start cells on 7x7, a size it trained on, and 40 of 81 on 9x9. It is not kept; only the Warnsdorff-labelled model is in the repository. The tour solver the page uses is unchanged (the original order, then Warnsdorff as the fallback), because that pair already solves every start cell of every board from 3x3 to 12x12 (measured in DC-F1) and no single ordering in the table does.

Limits: one linear model with five features, one training recipe tried twice, boards up to 12x12, a budget of ${TOUR_BUDGET.toLocaleString('en-US')} extensions, one timing run per cell of the table.

Regenerate: \`npx tsx scripts/train-ordering.ts\` then \`npx tsx scripts/compare-orderings.ts\`.
`;
mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/move-ordering-results.md', import.meta.url), text);
writeFileSync(
  new URL('../docs/move-ordering-results.json', import.meta.url),
  JSON.stringify({ date, budget: TOUR_BUDGET, weights: LEARNED_WEIGHTS, rows }, null, 2) + '\n',
);
console.log(table);
