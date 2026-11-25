// main.js — the game loop and the three screens (title, playing, game over).
// It wires input, world, orders and render together and nothing else.

import { DAY_SECONDS, VIEW_H, VIEW_W } from './config.js';
import { createInput } from './input.js';
import { createWorld, updateWorld, STATIONS } from './world.js';
import { render } from './render.js';
import { parseShot, stageShot } from './shots.js';
import { mulberry32 } from './random.js';
import { sfx } from './audio.js';

// Surface load errors into the DOM so a headless run can report them.
window.addEventListener('error', (e) => {
  document.body.dataset.error = String(e.message || e.error);
});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

const { shot, seed } = parseShot();
const world = createWorld(mulberry32(seed));
let screen = 'title';
let staged = false;

// Debug handle for headless play-testing (read-only state inspection).
window.__wokRush = { world, screen: () => screen };

if (shot) {
  // A staged screenshot: freeze the world in the requested moment.
  const result = stageShot(world, shot, seed);
  if (result) {
    screen = result;
    staged = true;
  }
}

function nearestStationKind() {
  // Same geometry as world.js: highlight the station the chef stands by.
  const p = world.player;
  let best = null, bestD = 1e9;
  for (const [kind, s] of Object.entries(STATIONS)) {
    const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestD) { bestD = d; best = kind; }
  }
  return bestD <= 78 ? best : null;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!staged) {
    if (screen === 'title') {
      if (input.startPressed || input.click) {
        screen = 'play';
        sfx.unlock();
      }
    } else if (screen === 'play') {
      updateWorld(world, input, dt);
      if (world.over) screen = 'over';
    } else if (screen === 'over') {
      if (input.restartPressed) {
        const fresh = createWorld(mulberry32((seed + 1) % 100000));
        Object.assign(world, fresh);
        world.dayLeft = DAY_SECONDS;
        screen = 'play';
      }
    }
  }

  render(ctx, world, screen, screen === 'play' ? nearestStationKind() : null);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
