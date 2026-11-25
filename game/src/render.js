// render.js — every pixel the player sees. Canvas 2D, flat colours and
// simple shapes only: no images, no fonts from the network, no emoji
// (headless fonts cannot be relied on for emoji).

import { INGREDIENTS, RECIPES, VIEW_H, VIEW_W } from './config.js';
import { BINS, STATIONS } from './world.js';
import { orderIngredientNames } from './orders.js';

const FLOOR_A = '#c99a63';
const FLOOR_B = '#bd8d55';
const WALL = '#8a5a33';
const COUNTER = '#7a5230';
const COUNTER_TOP = '#a9743f';
const BOARD_BG = '#2b2118';
const CARD = '#fff7e8';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700' : '400'} ${size}px 'DejaVu Sans', 'Liberation Sans', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

// --- food drawing --------------------------------------------------------

export function drawIngredient(ctx, key, x, y, r) {
  const ing = INGREDIENTS[key];
  ctx.save();
  ctx.translate(x, y);
  if (key === 'rice') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(0, 2, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.accent;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.arc(-r * 0.5 + i * r * 0.25, -r * 0.15 + (i % 2) * r * 0.3, r * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (key === 'noodle') {
    ctx.strokeStyle = ing.color; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.45);
      ctx.quadraticCurveTo(-r * 0.3, i * r * 0.45 - r * 0.5, 0, i * r * 0.45);
      ctx.quadraticCurveTo(r * 0.3, i * r * 0.45 + r * 0.5, r * 0.8, i * r * 0.45);
      ctx.stroke();
    }
  } else if (key === 'chicken') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(-r * 0.25, r * 0.1, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.15, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.accent;
    ctx.beginPath(); ctx.arc(-r * 0.25, r * 0.1, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.15, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (key === 'egg') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.accent;
    ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, Math.PI * 2); ctx.fill();
  } else if (key === 'veg') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(-0.5 + i * 0.5);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.3, r * 0.32, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = ing.accent; ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.moveTo(0, r * 0.7); ctx.lineTo(0, -r * 0.2); ctx.stroke();
  } else if (key === 'chili') {
    ctx.strokeStyle = ing.color; ctx.lineWidth = r * 0.42; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.62, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.strokeStyle = ing.accent; ctx.lineWidth = r * 0.16;
    ctx.beginPath(); ctx.moveTo(r * 0.45, -r * 0.62); ctx.quadraticCurveTo(r * 0.8, -r * 0.9, r * 0.55, -r * 1.05); ctx.stroke();
  } else if (key === 'sauce') {
    ctx.fillStyle = '#6b4423';
    rr(ctx, -r * 0.34, -r * 0.5, r * 0.68, r * 1.1, r * 0.18); ctx.fill();
    ctx.fillStyle = ing.color;
    rr(ctx, -r * 0.34, -r * 0.1, r * 0.68, r * 0.5, r * 0.12); ctx.fill();
    ctx.fillStyle = '#3d2712';
    rr(ctx, -r * 0.18, -r * 0.78, r * 0.36, r * 0.34, r * 0.08); ctx.fill();
  }
  ctx.restore();
}

export function drawPlate(ctx, recipeKey, x, y, r) {
  const rec = RECIPES[recipeKey];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rec.color;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.2, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.22, r * 0.18, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// --- stations --------------------------------------------------------------

function drawStationBase(ctx, s, label, active) {
  ctx.fillStyle = COUNTER;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = COUNTER_TOP;
  rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 9); ctx.fill();
  if (active) {
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 4;
    rr(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 4, 14); ctx.stroke();
  }
  text(ctx, label, s.x + 12, s.y + 22, 15, '#fff2d8');
}

function drawPantry(ctx, st, bins, active) {
  drawStationBase(ctx, st, st.label.toUpperCase() + ' — BAHAN', active);
  for (const b of bins) {
    const ing = INGREDIENTS[b.key];
    ctx.fillStyle = '#5d3d22';
    rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.fillStyle = '#f7ead0';
    rr(ctx, b.x + 3, b.y + 3, b.w - 6, b.h - 6, 6); ctx.fill();
    drawIngredient(ctx, b.key, b.x + b.w / 2, b.y + 30, 15);
    text(ctx, ing.short, b.x + b.w / 2, b.y + 66, 12, '#4a2f18', 'center');
  }
}

function drawChoppingBoard(ctx, world, active) {
  const s = STATIONS.board;
  drawStationBase(ctx, s, 'TALENAN', active);
  ctx.fillStyle = '#e9c893';
  rr(ctx, s.x + 20, s.y + 32, s.w - 40, s.h - 44, 8); ctx.fill();
  const b = world.board;
  if (b.item) {
    drawIngredient(ctx, b.item.ing, s.x + s.w / 2, s.y + 62, 20);
    // chop progress bar
    ctx.fillStyle = '#4a2f18';
    rr(ctx, s.x + 30, s.y + s.h - 16, s.w - 60, 8, 4); ctx.fill();
    ctx.fillStyle = b.progress >= 1 ? '#7dc383' : '#f2c14e';
    rr(ctx, s.x + 30, s.y + s.h - 16, (s.w - 60) * Math.min(1, b.progress), 8, 4); ctx.fill();
    if (b.progress < 1) {
      // knife marks while chopping
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const n = 3 + Math.floor(b.progress * 6);
      for (let i = 0; i < n; i++) {
        const x = s.x + 40 + i * 14;
        ctx.beginPath(); ctx.moveTo(x, s.y + 42); ctx.lineTo(x + 8, s.y + 56); ctx.stroke();
      }
    } else {
      text(ctx, 'SIAP!', s.x + s.w / 2, s.y + 40, 13, '#3e8f4e', 'center');
    }
  } else {
    text(ctx, 'potong di sini', s.x + s.w / 2, s.y + 66, 13, '#8a6a44', 'center');
  }
}

function drawWok(ctx, world, active) {
  const s = STATIONS.wok;
  drawStationBase(ctx, s, 'WOK', active);
  const w = world.wok;
  const cx = s.x + s.w / 2, cy = s.y + 62;
  // stove ring
  ctx.fillStyle = '#3d2712';
  ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill();
  // wok bowl
  ctx.fillStyle = w.burnt ? '#2b2b2b' : '#4a4a52';
  ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = w.burnt ? '#1a1a1a' : '#33333a';
  ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.fill();
  if (w.items.length) {
    // ingredients bubbling in the wok
    const n = w.items.length;
    w.items.forEach((ing, i) => {
      const a = (i / Math.max(1, n)) * Math.PI * 2 + world.time * 0.6;
      drawIngredient(ctx, ing, cx + Math.cos(a) * 15, cy + Math.sin(a) * 10, 11);
    });
  }
  if (w.recipe) {
    text(ctx, RECIPES[w.recipe].name, cx, s.y + s.h - 8, 13, '#fff2d8', 'center');
  }
  if (w.cooking > 0 && !w.cooked && !w.burnt) {
    ctx.fillStyle = '#4a2f18';
    rr(ctx, s.x + 24, s.y + s.h - 26, s.w - 48, 10, 5); ctx.fill();
    ctx.fillStyle = '#ff9d3d';
    rr(ctx, s.x + 24, s.y + s.h - 26, (s.w - 48) * Math.min(1, w.cooking), 10, 5); ctx.fill();
    text(ctx, 'MEMASAK…', s.x + s.w - 12, s.y + 22, 12, '#ffe9a8', 'right');
  }
  if (w.cooked) {
    const blink = Math.sin(world.time * 8) > 0;
    text(ctx, w.burnIn < 2 ? 'ANGKAT!' : 'MATANG!', s.x + s.w - 12, s.y + 22, 14, blink ? '#ffd94d' : '#b8f5c8', 'right');
    ctx.fillStyle = '#4a2f18';
    rr(ctx, s.x + 24, s.y + s.h - 26, s.w - 48, 10, 5); ctx.fill();
    ctx.fillStyle = '#e5484d';
    rr(ctx, s.x + 24, s.y + s.h - 26, (s.w - 48) * Math.max(0, w.burnIn / 5), 10, 5); ctx.fill();
  }
  if (w.burnt) {
    text(ctx, 'GOSONG!', cx, s.y + 34, 14, '#ff9d9d', 'center');
    text(ctx, 'tekan E untuk bersihkan', cx, s.y + s.h - 8, 11, '#ffb3b3', 'center');
  }
  if (w.clearing > 0) text(ctx, 'membersihkan…', cx, s.y + 34, 12, '#ffe9a8', 'center');
}

function drawPlating(ctx, world, active) {
  const s = STATIONS.plating;
  drawStationBase(ctx, s, 'MEJA SAJI', active);
  if (world.plating.plate) {
    drawPlate(ctx, world.plating.plate.recipe, s.x + 60, s.y + 62, 30);
    text(ctx, RECIPES[world.plating.plate.recipe].name, s.x + 110, s.y + 58, 15, '#fff2d8');
    const blink = Math.sin(world.time * 6) > 0;
    text(ctx, 'PIRING SIAP!', s.x + 110, s.y + 82, 13, blink ? '#ffd94d' : '#b8f5c8');
  } else {
    text(ctx, 'hidangan matang muncul di sini', s.x + s.w / 2, s.y + 62, 13, '#d8b98a', 'center');
  }
}

function drawServe(ctx, world, active) {
  const s = STATIONS.serve;
  drawStationBase(ctx, s, 'JENDELA ANTAR', active);
  // counter window
  ctx.fillStyle = '#1e1610';
  rr(ctx, s.x + 16, s.y + 34, s.w - 32, 86, 8); ctx.fill();
  ctx.fillStyle = '#3d2b1a';
  rr(ctx, s.x + 16, s.y + 34, s.w - 32, 14, 8); ctx.fill();
  // a bell on the counter window's top-right corner
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(s.x + s.w - 34, s.y + 50, 11, Math.PI, 0); ctx.fill();
  ctx.fillRect(s.x + s.w - 45, s.y + 50, 22, 4);
  text(ctx, 'antar hidangan ke sini', s.x + s.w / 2, s.y + 152, 13, '#d8b98a', 'center');
  text(ctx, 'E untuk menyajikan', s.x + s.w / 2, s.y + 172, 12, '#fff2d8', 'center');
}

// --- chef --------------------------------------------------------------------

function drawChef(ctx, world) {
  const p = world.player;
  const bob = world.moving ? Math.sin(world.time * 12) * 1.5 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 22, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  // body / apron
  ctx.fillStyle = '#f5f0e1';
  ctx.beginPath(); ctx.arc(0, 6, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e5484d';
  rr(ctx, -14, 2, 28, 20, 6); ctx.fill();
  // head
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill();
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -28, 22, 7);
  // eyes face the moving direction
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(p.facing * 3 - 4, -17, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.facing * 3 + 4, -17, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // carried item floats above the chef
  const c = p.carrying;
  if (c) {
    const cy = p.y - 48 + Math.sin(world.time * 4) * 2;
    if (c.kind === 'ing') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(p.x, cy, 17, 0, Math.PI * 2); ctx.fill();
      drawIngredient(ctx, c.ing, p.x, cy, 12);
      if (c.chopped) {
        ctx.fillStyle = '#3e8f4e';
        ctx.beginPath(); ctx.arc(p.x + 12, cy - 12, 6, 0, Math.PI * 2); ctx.fill();
        text(ctx, '✓', p.x + 12, cy - 8, 9, '#fff', 'center');
      }
    } else {
      drawPlate(ctx, c.recipe, p.x, cy, 17);
    }
  }
}

// --- order board ---------------------------------------------------------------

function drawBoard(ctx, world) {
  ctx.fillStyle = BOARD_BG;
  rr(ctx, 8, 8, VIEW_W - 16, 104, 12); ctx.fill();

  // orders, left to right
  const orders = world.orders.list;
  orders.forEach((o, i) => {
    const x = 24 + i * 300, y = 18, w = 284, h = 84;
    const frac = Math.max(0, o.patience / o.maxPatience);
    const urgent = o.patience < 10;
    ctx.fillStyle = urgent && Math.sin(world.time * 8) > 0 ? '#5c2b2b' : CARD;
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.fillStyle = '#2b2118';
    text(ctx, `#${o.id}  ${o.name}`, x + 12, y + 22, 16, '#2b2118');
    text(ctx, `${o.coins} koin`, x + w - 12, y + 22, 13, '#8a5a33', 'right');
    // ingredient chips
    const names = orderIngredientNames(o);
    names.forEach((n, j) => {
      ctx.fillStyle = '#e8dcc4';
      rr(ctx, x + 12 + j * 62, y + 34, 56, 20, 9); ctx.fill();
      text(ctx, n, x + 40 + j * 62, y + 49, 11, '#4a2f18', 'center');
    });
    // patience bar
    ctx.fillStyle = '#d8cfae';
    rr(ctx, x + 12, y + 66, w - 24, 10, 5); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#f2c14e' : '#e5484d';
    rr(ctx, x + 12, y + 66, (w - 24) * frac, 10, 5); ctx.fill();
    text(ctx, `${Math.ceil(o.patience)} dtk`, x + w - 12, y + 66 + 9, 10, '#4a2f18', 'right');
  });
  if (!orders.length) {
    text(ctx, 'Belum ada pesanan — bersiap!', 24, 62, 16, '#d8b98a');
  }

  // right cluster: timer, coins, hearts, combo
  const rx = VIEW_W - 300;
  const mins = Math.floor(world.dayLeft / 60);
  const secs = Math.floor(world.dayLeft % 60);
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, rx, 44, 30, world.dayLeft < 30 ? '#ff9d9d' : '#fff2d8');
  text(ctx, 'SISA WAKTU', rx, 62, 11, '#d8b98a');
  text(ctx, `${world.coins} koin`, rx + 110, 40, 20, '#ffd94d');
  text(ctx, `skor ${world.score}`, rx + 110, 62, 11, '#d8b98a');
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < world.hearts ? '♥ ' : '♡ ';
  text(ctx, hearts, rx + 110, 88, 18, '#ff7d7d');
  if (world.combo > 1) text(ctx, `KOMBO x${world.combo}`, rx + 210, 88, 14, '#ffd94d');
}

// --- screens ------------------------------------------------------------------

function drawFloor(ctx) {
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 22; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(16 + x * 57, 122 + y * 48, 57, 48);
    }
  }
  // wall strip above the floor
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 112, VIEW_W, 10);
  // a rug in the middle of the kitchen
  ctx.fillStyle = '#a33d3d';
  rr(ctx, 480, 420, 320, 130, 12); ctx.fill();
  ctx.strokeStyle = '#d8b98a'; ctx.lineWidth = 3;
  rr(ctx, 494, 434, 292, 102, 8); ctx.stroke();
}

function drawToasts(ctx, world) {
  world.toasts.forEach((t, i) => {
    const alpha = Math.min(1, t.t);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20,14,8,0.85)';
    const w = ctx.measureText(t.text).width + 28;
    rr(ctx, VIEW_W - 24 - w, 128 + i * 34, w, 28, 14); ctx.fill();
    text(ctx, t.text, VIEW_W - 24 - w + 14, 128 + i * 34 + 19, 14, t.color);
    ctx.globalAlpha = 1;
  });
}

function drawHint(ctx, world) {
  ctx.fillStyle = 'rgba(20,14,8,0.8)';
  rr(ctx, 16, VIEW_H - 34, VIEW_W - 32, 26, 13); ctx.fill();
  text(ctx, world.hint, VIEW_W / 2, VIEW_H - 16, 14, '#fff2d8', 'center', false);
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'WOK RUSH', VIEW_W / 2, 220, 84, '#ffd94d', 'center');
  text(ctx, '— Dapur Kilat —', VIEW_W / 2, 258, 26, '#fff2d8', 'center');
  text(ctx, 'Masak cepat, sajikan tepat waktu, jangan sampai gosong!', VIEW_W / 2, 310, 20, '#ffe9a8', 'center', false);
  const lines = [
    'WASD / panah — jalan   •   Klik — jalan ke titik   •   E / Spasi — pakai stasiun',
    '1. Ambil bahan di Pantry   2. Potong di Talenan (ayam, sayur, cabai)',
    '3. Masukkan ke Wok sesuai resep   4. Angkat ke Meja Saji   5. Antar ke Jendela Antar',
    'Pesanan yang kedaluwarsa mengurangi hati. 3 hati habis = hari berakhir.',
  ];
  lines.forEach((l, i) => text(ctx, l, VIEW_W / 2, 370 + i * 30, 17, '#fff2d8', 'center', false));
  const blink = Math.sin(Date.now() / 300) > 0;
  if (blink) text(ctx, 'Tekan ENTER atau KLIK untuk mulai', VIEW_W / 2, 540, 24, '#ffd94d', 'center');
  text(ctx, 'Nasi Goreng • Mie Ayam • Cap Cay • Sate Ayam', VIEW_W / 2, 590, 16, '#d8b98a', 'center', false);
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, world.won ? 'HARI SELESAI!' : 'DAPUR TUTUP!', VIEW_W / 2, 240, 64, world.won ? '#b8f5c8' : '#ff9d9d', 'center');
  text(ctx, `Hidangan tersaji: ${world.served}   •   Koin: ${world.coins}   •   Skor: ${world.score}`, VIEW_W / 2, 320, 22, '#fff2d8', 'center', false);
  text(ctx, `Kombo terbaik: x${Math.max(1, world.bestCombo)}   •   Pesanan hangus: ${world.expiredCount}   •   Wok gosong: ${world.burntCount}`, VIEW_W / 2, 356, 18, '#d8b98a', 'center', false);
  const blink = Math.sin(Date.now() / 300) > 0;
  if (blink) text(ctx, 'Tekan R untuk main lagi', VIEW_W / 2, 440, 24, '#ffd94d', 'center');
}

// --- main entry ---------------------------------------------------------------

export function render(ctx, world, screen, activeStation) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawPantry(ctx, STATIONS.pantryA, BINS.filter((b) => b.pantry === 'pantryA'), activeStation === 'pantryA');
  drawPantry(ctx, STATIONS.pantryB, BINS.filter((b) => b.pantry === 'pantryB'), activeStation === 'pantryB');
  drawBoardStation(ctx, world, activeStation === 'board');
  drawWok(ctx, world, activeStation === 'wok');
  drawPlating(ctx, world, activeStation === 'plating');
  drawServe(ctx, world, activeStation === 'serve');
  drawChef(ctx, world);
  drawBoard(ctx, world);
  drawToasts(ctx, world);
  drawHint(ctx, world);
  if (screen === 'title') drawTitle(ctx);
  if (screen === 'over') drawGameOver(ctx, world);
}

function drawBoardStation(ctx, world, active) {
  drawChoppingBoard(ctx, world, active);
}
