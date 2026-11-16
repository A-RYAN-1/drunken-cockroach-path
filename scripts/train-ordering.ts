// Fits the move-ordering weights from solved tours and writes src/learned-weights.json.
//   npx tsx scripts/train-ordering.ts
//
// Training data: every start cell of boards 4x4 to 7x7, solved by the backtracking solver with
// the Warnsdorff order (tours the heuristic finds, with its few backtracks).
// Each step of a solved tour is one decision: the cell taken against the other open cells.
// The model is a softmax over candidates with a linear score (lower is better), fitted by
// full-batch gradient descent from the Warnsdorff weights. Boards 8x8 and larger are never
// trained on, so scripts/compare-orderings.ts measures them as unseen.
import { writeFileSync } from 'node:fs';
import { FEATURE_NAMES } from '../src/ordering';
import { EPOCHS, L2, RATE, TRAIN_SIZES, collectDecisions, fit } from '../src/training';

{
  const decisions = collectDecisions(TRAIN_SIZES);
  const model = fit(decisions);
  const round = (v: number) => Math.round(v * 1e6) / 1e6;
  const out = {
    features: [...FEATURE_NAMES],
    mean: model.mean.map(round),
    scale: model.scale.map(round),
    weights: model.weights.map(round),
    provenance: {
      trainedOn: `every start cell of boards ${TRAIN_SIZES.join(', ')} (tours found with the Warnsdorff order)`,
      decisions: model.decisions,
      method: `softmax over candidates, linear score, ${EPOCHS} full-batch steps, rate ${RATE}, L2 ${L2}, start at Warnsdorff weights; no randomness`,
      meanLoss: round(model.loss),
      date: new Date().toISOString().slice(0, 10),
    },
  };
  writeFileSync(new URL('../src/learned-weights.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify(out, null, 2));
}
