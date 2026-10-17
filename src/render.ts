import { SIZE, visitCounts, type Cell } from './walk';
import type { Simulation } from './sim';

const TRAIL_LENGTH = 250;

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Draws the board, the visited cells, the trail and the cockroach. */
export function draw(canvas: HTMLCanvasElement, sim: Simulation): void {
  const ratio = window.devicePixelRatio || 1;
  const side = canvas.clientWidth;
  if (canvas.width !== Math.round(side * ratio)) {
    canvas.width = Math.round(side * ratio);
    canvas.height = Math.round(side * ratio);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const cell = side / SIZE;
  const centre = (c: Cell) => ({ x: (c.x + 0.5) * cell, y: (c.y + 0.5) * cell });

  ctx.fillStyle = css('--board');
  ctx.fillRect(0, 0, side, side);

  const counts = visitCounts(sim.path);
  const most = Math.max(1, ...counts.flat());
  const walk = sim.settings.mode === 'walk';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = counts[y][x];
      if (n === 0) continue;
      ctx.globalAlpha = walk ? 0.18 + 0.72 * (n / most) : 0.55;
      ctx.fillStyle = css('--visited');
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = css('--grid');
  ctx.lineWidth = 1;
  for (let i = 0; i <= SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, side);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(side, i * cell);
    ctx.stroke();
  }

  const trail = sim.path.slice(-TRAIL_LENGTH);
  if (trail.length > 1) {
    ctx.strokeStyle = css('--trail');
    ctx.lineWidth = Math.max(2, cell * 0.05);
    ctx.globalAlpha = 0.85;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    trail.forEach((c, i) => {
      const p = centre(c);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (!walk) {
    ctx.font = `600 ${cell * 0.24}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    sim.path.forEach((c, i) => {
      const p = centre(c);
      ctx.fillStyle = css('--board');
      ctx.beginPath();
      ctx.arc(p.x, p.y, cell * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = css('--text');
      ctx.fillText(String(i + 1), p.x, p.y + 1);
    });
  }

  const s = centre(sim.path[0]);
  ctx.strokeStyle = css('--accent');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(s.x, s.y, cell * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  const c = centre(sim.current);
  ctx.fillStyle = css('--accent');
  ctx.beginPath();
  if (walk) {
    ctx.arc(c.x, c.y, cell * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineWidth = 4;
    ctx.arc(c.x, c.y, cell * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  }
}
