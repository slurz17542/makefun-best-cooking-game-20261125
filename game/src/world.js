// world.js — the kitchen itself: stations, the chef, the wok, the chopping
// board and the plating counter. All rules of play live here; render.js
// only draws what this module reports.

import {
  BURN_SECONDS, CHOP_SECONDS, COOK_SECONDS, DAY_SECONDS, INGREDIENTS,
  MAX_HEARTS, PLAYER_RADIUS, PLAYER_SPEED, RECIPES, RECIPE_KEYS,
} from './config.js';
import { createOrders, findMatchingOrder, serveValue, updateOrders } from './orders.js';
import { sfx } from './audio.js';

// Station rectangles (x, y, w, h) on the 1280x800 floor. The top 110px is
// the order board; everything below is walkable kitchen. The two pantries
// sit side by side along the top, both approached from the open floor
// below them, so every bin is close to a standing spot. (Stacking them
// vertically left the upper pantry's bins unreachable — the gap between
// the pantries is too narrow for the chef to stand in.)
export const STATIONS = {
  pantryA: { x: 30,  y: 130, w: 300, h: 110, label: 'Pantry Kering' },
  pantryB: { x: 360, y: 130, w: 380, h: 110, label: 'Pantry Segar' },
  board:   { x: 30,  y: 410, w: 200, h: 110, label: 'Talenan' },
  wok:     { x: 30,  y: 550, w: 200, h: 130, label: 'Wok' },
  plating: { x: 980, y: 350, w: 270, h: 110, label: 'Meja Saji' },
  serve:   { x: 980, y: 130, w: 270, h: 190, label: 'Jendela Antar' },
};

// Ingredient bins. Each pantry holds one row of bins; the chef reaches them
// from the floor right below the pantry, so every bin is close.
const BIN_SPOTS = {
  rice:    { pantry: 'pantryA', x: 40,  y: 150 },
  noodle:  { pantry: 'pantryA', x: 126, y: 150 },
  egg:     { pantry: 'pantryA', x: 212, y: 150 },
  chicken: { pantry: 'pantryB', x: 370, y: 150 },
  veg:     { pantry: 'pantryB', x: 456, y: 150 },
  chili:   { pantry: 'pantryB', x: 542, y: 150 },
  sauce:   { pantry: 'pantryB', x: 628, y: 150 },
};
export const BINS = Object.entries(BIN_SPOTS).map(([key, s]) => ({ key, ...s, w: 72, h: 74 }));

const FLOOR = { x: 16, y: 122, w: 1248, h: 662 };

function rectsOverlap(ax, ay, ar, bx, by, bw, bh) {
  return ax < bx + bw && ax + ar > bx && ay < by + bh && ay + ar > by;
}

export function createWorld(rng) {
  return {
    rng,
    time: 0,
    dayLeft: DAY_SECONDS,
    hearts: MAX_HEARTS,
    score: 0,
    coins: 0,
    combo: 0,
    lastServeAt: -99,
    bestCombo: 0,
    served: 0,
    expiredCount: 0,
    burntCount: 0,
    orders: createOrders(rng),
    player: { x: 640, y: 500, tx: null, ty: null, path: null, carrying: null, facing: 1 },
    board: { item: null, progress: 0 },   // { ing } while chopping
    wok: { items: [], recipe: null, cooking: 0, cooked: false, burnIn: 0, burnt: false, clearing: 0 },
    plating: { plate: null },             // { recipe } when a dish is ready
    toasts: [],                            // { text, t, color }
    hint: '',
    moving: false,
    over: false,
    won: false,
  };
}

export function toast(world, text, color = '#fff') {
  world.toasts.push({ text, t: 2.2, color });
  if (world.toasts.length > 4) world.toasts.shift();
}

function nearestStation(world) {
  const p = world.player;
  let best = null, bestD = 1e9;
  for (const [kind, s] of Object.entries(STATIONS)) {
    const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestD) { bestD = d; best = { kind, ...s, dist: d }; }
  }
  return bestD <= 78 ? best : null;
}

function binAt(world, x, y) {
  return BINS.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) ?? null;
}

function recipeForBase(base) {
  return RECIPE_KEYS.find((k) => RECIPES[k].base === base) ?? null;
}

function wokNeeds(world) {
  const w = world.wok;
  if (!w.recipe) return [];
  const r = RECIPES[w.recipe];
  const all = [r.base, ...r.needs];
  return all.filter((ing) => !w.items.includes(ing));
}

// --- interactions -----------------------------------------------------------

function interact(world) {
  const p = world.player;
  const st = nearestStation(world);
  if (!st) return;
  const w = world.wok;

  if (st.kind === 'pantryA' || st.kind === 'pantryB') {
    if (p.carrying) { toast(world, 'Tangan penuh!', '#ffb3b3'); return; }
    const bin = binAt(world, p.x, p.y) ?? nearestBin(world);
    if (!bin) return;
    p.carrying = { kind: 'ing', ing: bin.key, chopped: false };
    sfx.pickup();
    return;
  }

  if (st.kind === 'board') {
    if (world.board.item) {
      if (p.carrying) { toast(world, 'Talenan lagi dipakai!', '#ffb3b3'); return; }
      p.carrying = { kind: 'ing', ing: world.board.item.ing, chopped: true };
      world.board.item = null;
      world.board.progress = 0;
      sfx.pickup();
      return;
    }
    if (!p.carrying || p.carrying.kind !== 'ing') return;
    const ing = INGREDIENTS[p.carrying.ing];
    if (!ing.chop) { toast(world, `${ing.name} tidak perlu dipotong`, '#ffe9a8'); return; }
    if (p.carrying.chopped) { toast(world, 'Sudah dipotong!', '#ffe9a8'); return; }
    world.board.item = { ing: p.carrying.ing };
    world.board.progress = 0;
    p.carrying = null;
    sfx.chop();
    return;
  }

  if (st.kind === 'wok') {
    if (w.burnt) {
      if (p.carrying) { toast(world, 'Tangan penuh — kosongkan dulu!', '#ffb3b3'); return; }
      w.clearing = 1;
      return;
    }
    if (w.cooked) {
      if (p.carrying) { toast(world, 'Tangan penuh!', '#ffb3b3'); return; }
      if (world.plating.plate) { toast(world, 'Meja saji penuh!', '#ffb3b3'); return; }
      world.plating.plate = { recipe: w.recipe };
      world.wok = { items: [], recipe: null, cooking: 0, cooked: false, burnIn: 0, burnt: false, clearing: 0 };
      sfx.pickup();
      toast(world, 'Hidangan siap di meja saji!', '#b8f5c8');
      return;
    }
    if (!p.carrying || p.carrying.kind !== 'ing') return;
    const ing = p.carrying.ing;
    if (!p.carrying.chopped && INGREDIENTS[ing].chop) {
      toast(world, `${INGREDIENTS[ing].name} harus dipotong dulu!`, '#ffe9a8');
      return;
    }
    if (!w.recipe) {
      const r = recipeForBase(ing);
      if (!r) { toast(world, 'Bukan bahan utama!', '#ffb3b3'); return; }
      w.recipe = r;
      w.items.push(ing);
      p.carrying = null;
      sfx.drop();
      return;
    }
    const needs = wokNeeds(world);
    if (!needs.includes(ing)) {
      toast(world, 'Bahan tidak cocok untuk hidangan ini!', '#ffb3b3');
      sfx.bad();
      return;
    }
    w.items.push(ing);
    p.carrying = null;
    sfx.drop();
    if (wokNeeds(world).length === 0) {
      w.cooking = 0.0001; // cooking starts
      toast(world, 'Memasak… awasi wok!', '#ffe9a8');
    }
    return;
  }

  if (st.kind === 'plating') {
    if (world.plating.plate) {
      if (p.carrying) { toast(world, 'Tangan penuh!', '#ffb3b3'); return; }
      p.carrying = { kind: 'plate', recipe: world.plating.plate.recipe };
      world.plating.plate = null;
      sfx.pickup();
    }
    return;
  }

  if (st.kind === 'serve') {
    if (!p.carrying || p.carrying.kind !== 'plate') return;
    const order = findMatchingOrder(world.orders, p.carrying.recipe);
    if (!order) {
      toast(world, 'Tidak ada pesanan ini!', '#ffb3b3');
      sfx.bad();
      return;
    }
    const value = serveValue(order);
    const gap = world.time - world.lastServeAt;
    world.combo = gap <= 10 ? world.combo + 1 : 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.lastServeAt = world.time;
    const mult = Math.min(2, 1 + 0.1 * (world.combo - 1));
    const earned = Math.round(value * mult);
    world.coins += earned;
    world.score += earned;
    world.served += 1;
    world.orders.list = world.orders.list.filter((o) => o.id !== order.id);
    p.carrying = null;
    sfx.coin();
    toast(world, `+${earned} koin — ${order.name} tersaji!${world.combo > 1 ? ` Kombo x${world.combo}!` : ''}`, '#b8f5c8');
  }
}

function nearestBin(world) {
  const p = world.player;
  let best = null, bestD = 1e9;
  for (const b of BINS) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestD) { bestD = d; best = b; }
  }
  // Bins sit inside the solid pantry, so the chef reaches them from the
  // pantry's edge: 170px covers the farthest bin centre from the floor.
  return bestD <= 170 ? best : null;
}

// --- click-to-move pathfinding --------------------------------------------
// Straight-line clicks get stuck on station corners (the chef slides along
// a counter and never rounds the bend), so clicks route through A* on a
// 16px grid over the walkable floor, then the path is string-pulled into
// straight legs. Keyboard movement bypasses the path entirely.
const CELL = 16;
const WALK = { x0: FLOOR.x + PLAYER_RADIUS, y0: FLOOR.y + PLAYER_RADIUS, x1: FLOOR.x + FLOOR.w - PLAYER_RADIUS, y1: FLOOR.y + FLOOR.h - PLAYER_RADIUS };

function cellBlocked(x, y) {
  for (const s of Object.values(STATIONS)) {
    if (x >= s.x - PLAYER_RADIUS && x <= s.x + s.w + PLAYER_RADIUS &&
        y >= s.y - PLAYER_RADIUS && y <= s.y + s.h + PLAYER_RADIUS) return true;
  }
  return false;
}

function losClear(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(d / 8));
  for (let i = 1; i <= n; i++) {
    if (cellBlocked(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
  }
  return true;
}

export function findPath(sx, sy, tx, ty) {
  tx = Math.max(WALK.x0, Math.min(WALK.x1, tx));
  ty = Math.max(WALK.y0, Math.min(WALK.y1, ty));
  const cols = Math.ceil((WALK.x1 - WALK.x0) / CELL);
  const rows = Math.ceil((WALK.y1 - WALK.y0) / CELL);
  const toCell = (x, y) => [
    Math.max(0, Math.min(cols - 1, Math.floor((x - WALK.x0) / CELL))),
    Math.max(0, Math.min(rows - 1, Math.floor((y - WALK.y0) / CELL))),
  ];
  const cellXY = (c, r) => [WALK.x0 + (c + 0.5) * CELL, WALK.y0 + (r + 0.5) * CELL];
  const [sc, sr] = toCell(sx, sy);
  let [tc, tr] = toCell(tx, ty);
  if (cellBlocked(...cellXY(tc, tr))) {
    // Target inside a station: take the nearest free cell to it.
    let found = null;
    for (let ring = 1; ring <= 24 && !found; ring++) {
      for (let dr = -ring; dr <= ring && !found; dr++) {
        for (let dc = -ring; dc <= ring && !found; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
          const nc = tc + dc, nr = tr + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          if (!cellBlocked(...cellXY(nc, nr))) found = [nc, nr];
        }
      }
    }
    if (!found) return null;
    [tc, tr] = found;
  }
  const key = (c, r) => r * cols + c;
  const open = [{ c: sc, r: sr, g: 0, f: 0, parent: null }];
  const best = new Map([[key(sc, sr), 0]]);
  const closed = new Set();
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.c, cur.r);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.c === tc && cur.r === tr) {
      const cells = [];
      for (let n = cur; n; n = n.parent) cells.push(n);
      cells.reverse();
      const pts = cells.map((n) => { const [x, y] = cellXY(n.c, n.r); return { x, y }; });
      pts[0] = { x: sx, y: sy };
      pts[pts.length - 1] = { x: tx, y: ty };
      const out = [pts[0]];
      let i = 0;
      while (i < pts.length - 1) {
        let j = pts.length - 1;
        while (j > i + 1 && !losClear(pts[i].x, pts[i].y, pts[j].x, pts[j].y)) j--;
        out.push(pts[j]);
        i = j;
      }
      return out;
    }
    for (const [dc, dr, cost] of DIRS) {
      const nc = cur.c + dc, nr = cur.r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const [cx, cy] = cellXY(nc, nr);
      if (cellBlocked(cx, cy)) continue;
      if (dc && dr) {
        if (cellBlocked(...cellXY(cur.c + dc, cur.r))) continue;
        if (cellBlocked(...cellXY(cur.c, cur.r + dr))) continue;
      }
      const ng = cur.g + cost;
      const nk = key(nc, nr);
      if (best.has(nk) && best.get(nk) <= ng) continue;
      best.set(nk, ng);
      const dx = Math.abs(nc - tc), dy = Math.abs(nr - tr);
      const h = Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
      open.push({ c: nc, r: nr, g: ng, f: ng + h, parent: cur });
    }
  }
  return null;
}

// --- per-frame update -------------------------------------------------------

export function updateWorld(world, input, dt) {
  if (world.over) return;
  world.time += dt;
  world.dayLeft -= dt;
  if (world.dayLeft <= 0) {
    world.dayLeft = 0;
    world.over = true;
    world.won = world.hearts > 0;
    return;
  }

  const expired = updateOrders(world.orders, dt);
  for (const id of expired) {
    world.expiredCount += 1;
    world.hearts -= 1;
    world.combo = 0;
    sfx.bad();
    toast(world, 'Pesanan hangus! -1 hati', '#ff9d9d');
    if (world.hearts <= 0) {
      world.over = true;
      world.won = false;
      return;
    }
  }

  // Chopping board progress.
  if (world.board.item) {
    world.board.progress += dt / CHOP_SECONDS;
    if (world.board.progress >= 1) {
      world.board.progress = 1;
      // stays as a chopped item waiting to be picked up
    }
  }

  // Wok: cooking, then burn grace, then burnt.
  const w = world.wok;
  if (w.clearing > 0) {
    w.clearing -= dt;
    if (w.clearing <= 0) {
      world.wok = { items: [], recipe: null, cooking: 0, cooked: false, burnIn: 0, burnt: false, clearing: 0 };
      world.burntCount += 1;
      toast(world, 'Wok dibersihkan', '#ffe9a8');
    }
  } else if (w.cooking > 0 && !w.cooked) {
    w.cooking += dt / COOK_SECONDS;
    if (w.cooking >= 1) {
      w.cooking = 1;
      w.cooked = true;
      w.burnIn = BURN_SECONDS;
      sfx.ding();
      toast(world, 'Matang! Angkat sebelum gosong!', '#b8f5c8');
    }
  } else if (w.cooked) {
    w.burnIn -= dt;
    if (w.burnIn <= 0) {
      w.burnt = true;
      w.cooked = false;
      sfx.burn();
      toast(world, 'Gosong! Bersihkan wok (E)', '#ff9d9d');
    }
  }

  // Toasts fade.
  for (const t of world.toasts) t.t -= dt;
  world.toasts = world.toasts.filter((t) => t.t > 0);

  // --- player movement ---
  const p = world.player;
  const axis = input.axis();
  world.moving = false;
  if (axis.x !== 0 || axis.y !== 0) {
    // Keyboard overrides any click path.
    world.moving = true;
    p.tx = null; p.ty = null; p.path = null;
    p.facing = axis.x !== 0 ? Math.sign(axis.x) : p.facing;
    movePlayer(world, axis.x * PLAYER_SPEED * dt, axis.y * PLAYER_SPEED * dt);
  } else if (input.click) {
    // Click to move: walk to the point, or to a station's approach point,
    // routing around counters with the pathfinder.
    let tx = input.click.x, ty = input.click.y;
    const st = Object.entries(STATIONS).find(([, s]) =>
      input.click.x >= s.x && input.click.x <= s.x + s.w &&
      input.click.y >= s.y && input.click.y <= s.y + s.h);
    if (st) {
      const s = st[1];
      tx = Math.max(s.x - 10, Math.min(p.x, s.x + s.w + 10));
      ty = Math.max(s.y - 10, Math.min(p.y, s.y + s.h + 10));
      if (nearestStation(world)?.kind === st[0]) interact(world);
    }
    p.tx = tx; p.ty = ty;
    p.path = findPath(p.x, p.y, tx, ty);
  }
  if (p.path && p.path.length) {
    const wp = p.path[0];
    const dx = wp.x - p.x, dy = wp.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      p.path.shift();
      if (!p.path.length) { p.path = null; p.tx = null; p.ty = null; }
    } else {
      world.moving = true;
      const step = Math.min(d, PLAYER_SPEED * dt);
      p.facing = dx !== 0 ? Math.sign(dx) : p.facing;
      movePlayer(world, (dx / d) * step, (dy / d) * step);
    }
  } else if (p.tx !== null && p.ty !== null) {
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) { p.tx = null; p.ty = null; }
    else {
      world.moving = true;
      const step = Math.min(d, PLAYER_SPEED * dt);
      p.facing = dx !== 0 ? Math.sign(dx) : p.facing;
      movePlayer(world, (dx / d) * step, (dy / d) * step);
    }
  }
  if (input.interactPressed) interact(world);

  // Contextual hint for the nearest station.
  world.hint = hintFor(world);
}

function movePlayer(world, dx, dy) {
  const p = world.player;
  const solids = Object.values(STATIONS);
  const tryMove = (nx, ny) => {
    if (nx < FLOOR.x + PLAYER_RADIUS || nx > FLOOR.x + FLOOR.w - PLAYER_RADIUS) return false;
    if (ny < FLOOR.y + PLAYER_RADIUS || ny > FLOOR.y + FLOOR.h - PLAYER_RADIUS) return false;
    for (const s of solids) {
      const cx = Math.max(s.x, Math.min(nx, s.x + s.w));
      const cy = Math.max(s.y, Math.min(ny, s.y + s.h));
      if (Math.hypot(nx - cx, ny - cy) < PLAYER_RADIUS - 2) return false;
    }
    return true;
  };
  if (tryMove(p.x + dx, p.y)) p.x += dx;
  if (tryMove(p.x, p.y + dy)) p.y += dy;
}

function hintFor(world) {
  const p = world.player;
  const st = nearestStation(world);
  if (!st) return 'WASD / panah: jalan • Klik: jalan ke titik • E: pakai stasiun';
  const w = world.wok;
  switch (st.kind) {
    case 'pantryA':
    case 'pantryB': return p.carrying ? 'Tangan penuh — antar bahan ke talenan / wok' : 'E: ambil bahan';
    case 'board':
      if (world.board.item) return world.board.progress >= 1 ? 'E: ambil bahan yang sudah dipotong' : 'Memotong… tunggu sebentar';
      if (p.carrying?.kind === 'ing') return INGREDIENTS[p.carrying.ing].chop ? 'E: taruh di talenan untuk dipotong' : 'Bahan ini tidak perlu dipotong';
      return 'Talenan — potong ayam, sayur, cabai di sini';
    case 'wok':
      if (w.burnt) return 'E: bersihkan wok yang gosong';
      if (w.cooked) return 'E: angkat hidangan ke meja saji';
      if (w.cooking > 0) return 'Memasak… jangan sampai gosong!';
      if (p.carrying?.kind === 'ing') {
        if (!w.recipe) return 'E: masukkan bahan utama ke wok';
        const needs = wokNeeds(world);
        return needs.length ? `E: tambah ${needs.map((n) => INGREDIENTS[n].short).join(', ')}` : 'E: masukkan bahan';
      }
      return w.recipe ? `Wok: ${RECIPES[w.recipe].name} — kurang: ${wokNeeds(world).map((n) => INGREDIENTS[n].short).join(', ')}` : 'Wok — masak hidangan di sini';
    case 'plating': return world.plating.plate ? 'E: ambil piring' : 'Meja saji — hidangan matang muncul di sini';
    case 'serve': return p.carrying?.kind === 'plate' ? 'E: antar hidangan!' : 'Jendela antar — bawa piring ke sini';
    default: return '';
  }
}
