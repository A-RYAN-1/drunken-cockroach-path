import './style.css';
import { draw } from './render';
import { Simulation, type Mode } from './sim';
import { SIZE } from './walk';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};

const canvas = $<HTMLCanvasElement>('board');
const startX = $<HTMLInputElement>('start-x');
const startY = $<HTMLInputElement>('start-y');
const seedInput = $<HTMLInputElement>('seed');
const seedRow = $('seed-row');
const speed = $<HTMLInputElement>('speed');
const speedOut = $('speed-out');
const playBtn = $<HTMLButtonElement>('play');
const stepBtn = $<HTMLButtonElement>('step');
const message = $('message');
const modeInputs = document.querySelectorAll<HTMLInputElement>('input[name="mode"]');

const MAX_SEED = 2 ** 32 - 1;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const readInt = (el: HTMLInputElement, lo: number, hi: number, fallback: number) => {
  const n = Math.floor(Number(el.value));
  return Number.isFinite(n) && el.value !== '' ? clamp(n, lo, hi) : fallback;
};

function currentMode(): Mode {
  return Array.from(modeInputs).find((i) => i.checked)?.value === 'walk' ? 'walk' : 'tour';
}

/** Settings live in the URL hash, so a link replays the same run. */
function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get('mode') === 'walk') modeInputs.forEach((i) => (i.checked = i.value === 'walk'));
  if (params.has('x')) startX.value = String(clamp(Math.floor(Number(params.get('x'))) || 0, 0, SIZE - 1));
  if (params.has('y')) startY.value = String(clamp(Math.floor(Number(params.get('y'))) || 0, 0, SIZE - 1));
  if (params.has('seed')) seedInput.value = String(clamp(Math.floor(Number(params.get('seed'))) || 0, 0, MAX_SEED));
}

function writeHash(sim: Simulation) {
  const { mode, start, seed } = sim.settings;
  const params = new URLSearchParams({ mode, x: String(start.x), y: String(start.y) });
  if (mode === 'walk') params.set('seed', String(seed));
  history.replaceState(null, '', `#${params}`);
}

let sim: Simulation;
let running = false;
let timer = 0;
let lastFrame = 0;
let owed = 0;

function build() {
  stop();
  sim = new Simulation({
    mode: currentMode(),
    start: { x: readInt(startX, 0, SIZE - 1, 0), y: readInt(startY, 0, SIZE - 1, 0) },
    seed: readInt(seedInput, 0, MAX_SEED, 1),
  });
  seedRow.hidden = sim.settings.mode !== 'walk';
  writeHash(sim);
  refresh();
}

function refresh() {
  draw(canvas, sim);
  $('stat-steps').textContent = String(sim.steps);
  $('stat-cells').textContent = `${sim.visitedCells} / ${SIZE * SIZE}`;
  $('stat-pos').textContent = `${sim.current.x}, ${sim.current.y}`;
  if (sim.unsolvable) message.textContent = 'No path through every cell exists from this start.';
  else if (sim.done) message.textContent = `Done: every cell visited in ${sim.steps} steps.`;
  else message.textContent = '';
  playBtn.textContent = running ? 'Pause' : sim.steps > 0 ? 'Resume' : 'Start';
  playBtn.disabled = sim.done;
  stepBtn.disabled = sim.done;
}

function stop() {
  running = false;
  cancelAnimationFrame(timer);
}

function frame(now: number) {
  if (!running) return;
  owed += ((now - lastFrame) / 1000) * Number(speed.value);
  lastFrame = now;
  const due = Math.min(Math.floor(owed), 500);
  owed -= Math.floor(owed);
  for (let i = 0; i < due; i++) if (!sim.step()) break;
  if (sim.done) running = false;
  refresh();
  if (running) timer = requestAnimationFrame(frame);
}

function toggle() {
  if (sim.done) return;
  if (running) {
    stop();
    refresh();
    return;
  }
  running = true;
  lastFrame = performance.now();
  owed = 0;
  refresh();
  timer = requestAnimationFrame(frame);
}

playBtn.addEventListener('click', toggle);
stepBtn.addEventListener('click', () => {
  stop();
  sim.step();
  refresh();
});
$('reset').addEventListener('click', build);
$('new-seed').addEventListener('click', () => {
  seedInput.value = String(Math.floor(Math.random() * 1_000_000));
  build();
});
modeInputs.forEach((i) => i.addEventListener('change', build));
[startX, startY, seedInput].forEach((i) => i.addEventListener('change', build));
speed.addEventListener('input', () => {
  speedOut.textContent = `${speed.value} steps/s`;
});
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  startX.value = String(clamp(Math.floor(((e.clientX - r.left) / r.width) * SIZE), 0, SIZE - 1));
  startY.value = String(clamp(Math.floor(((e.clientY - r.top) / r.height) * SIZE), 0, SIZE - 1));
  build();
});
window.addEventListener('hashchange', () => {
  readHash();
  build();
});
window.addEventListener('resize', () => draw(canvas, sim));
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => draw(canvas, sim));

readHash();
speedOut.textContent = `${speed.value} steps/s`;
build();
