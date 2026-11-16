# Move ordering results

Measured 2026-11-16 (Node v24.20.0, one run each). Every start cell of every board size, each ordering alone with a budget of 300,000 extensions per start cell; "start cells solved" counts the starts that finished within that budget. An extension is one cell the search adds to the path, so fewer is a faster search independent of the machine; total ms is wall time and varies by machine.

- **fixed**: the original C++ order of the eight moves.
- **warnsdorff**: the neighbour with the fewest onward moves first.
- **learned**: candidates ranked by a linear score of onward, edgeDistance, centreDistance, deadEnds, onwardTimesProgress, fitted offline on solved tours of boards 4, 5, 6, 7 (4325 decisions; `scripts/train-ordering.ts`). Boards 3, 8, 9, 10, 11, 12 are unseen.

| board | order | start cells solved | median extensions | worst extensions | total ms |
|---|---|---|---|---|---|
| 3x3 | fixed | 9 of 9 | 11 | 28 | 1 |
| 3x3 | warnsdorff | 9 of 9 | 8 | 8 | 0 |
| 3x3 | learned | 9 of 9 | 8 | 8 | 0 |
| 4x4 | fixed | 16 of 16 | 15 | 1,174 | 1 |
| 4x4 | warnsdorff | 16 of 16 | 15 | 15 | 1 |
| 4x4 | learned (trained on this size) | 16 of 16 | 15 | 15 | 1 |
| 5x5 | fixed | 24 of 25 | 29 | 300,032 | 47 |
| 5x5 | warnsdorff | 25 of 25 | 24 | 24 | 1 |
| 5x5 | learned (trained on this size) | 25 of 25 | 24 | 24 | 2 |
| 6x6 | fixed | 35 of 36 | 38 | 300,070 | 39 |
| 6x6 | warnsdorff | 36 of 36 | 35 | 35 | 2 |
| 6x6 | learned (trained on this size) | 36 of 36 | 35 | 35 | 4 |
| 7x7 | fixed | 48 of 49 | 108 | 300,097 | 38 |
| 7x7 | warnsdorff | 49 of 49 | 48 | 48 | 3 |
| 7x7 | learned (trained on this size) | 49 of 49 | 48 | 48 | 7 |
| 8x8 | fixed | 63 of 64 | 67 | 300,140 | 45 |
| 8x8 | warnsdorff | 63 of 64 | 63 | 300,135 | 89 |
| 8x8 | learned | 49 of 64 | 63 | 300,126 | 1955 |
| 9x9 | fixed | 80 of 81 | 156 | 300,182 | 70 |
| 9x9 | warnsdorff | 80 of 81 | 80 | 300,179 | 116 |
| 9x9 | learned | 68 of 81 | 80 | 300,165 | 1683 |
| 10x10 | fixed | 97 of 100 | 104 | 300,235 | 108 |
| 10x10 | warnsdorff | 95 of 100 | 99 | 300,233 | 417 |
| 10x10 | learned | 81 of 100 | 99 | 300,220 | 2565 |
| 11x11 | fixed | 109 of 121 | 491 | 300,295 | 738 |
| 11x11 | warnsdorff | 115 of 121 | 120 | 300,287 | 539 |
| 11x11 | learned | 104 of 121 | 120 | 300,271 | 2343 |
| 12x12 | fixed | 141 of 144 | 149 | 300,354 | 110 |
| 12x12 | warnsdorff | 132 of 144 | 143 | 300,352 | 1016 |
| 12x12 | learned | 105 of 144 | 143 | 300,313 | 5339 |

## What the numbers say

Imitating Warnsdorff did not beat Warnsdorff. On boards it was trained on (4 to 7) the learned order matches it, because it learned mostly the same rule: the onward-move count carries the largest weight. On unseen boards it is worse, not better: it solves fewer start cells than plain Warnsdorff on 8x8 to 12x12 (see the table). The extra features it picked up (distance to the edge and centre, dead ends, progress) did not transfer from small boards, and a rule that matches the training decisions can still search badly, because one wrong early choice costs the whole budget.

A first attempt trained on tours the original order found as well (the default solver tries the fixed order first) did worse still: 39 of 49 start cells on 7x7, a size it trained on, and 40 of 81 on 9x9. It is not kept; only the Warnsdorff-labelled model is in the repository. The tour solver the page uses is unchanged (the original order, then Warnsdorff as the fallback), because that pair already solves every start cell of every board from 3x3 to 12x12 (measured in DC-F1) and no single ordering in the table does.

Limits: one linear model with five features, one training recipe tried twice, boards up to 12x12, a budget of 300,000 extensions, one timing run per cell of the table.

Regenerate: `npx tsx scripts/train-ordering.ts` then `npx tsx scripts/compare-orderings.ts`.
