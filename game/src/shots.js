// shots.js — deterministic staging for screenshots. A `?shot=` query puts
// the game into one readable moment and freezes time, so a headless browser
// captures exactly that state. These are real renders of the game's own
// code, the same trick the kit's starter uses with its shots.json.
//   ?shot=start  — title screen over the kitchen
//   ?shot=play   — mid-service: two orders, wok mid-assembly, timer running
//   ?shot=serve  — a plate ready on the counter, matching order waiting
//   ?shot=rush   — three orders, one almost out of patience, wok cooking
// `?seed=` picks the RNG seed (default 7). Returns the shot name or null.

import { RECIPES } from './config.js';
import { mulberry32 } from './random.js';

export function parseShot() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot'),
    seed: Number(q.get('seed') ?? 7) || 7,
  };
}

export function stageShot(world, shot, seed) {
  const rng = mulberry32(seed);
  world.rng = rng;
  world.orders.rng = rng;
  if (shot === 'start') {
    return 'title';
  }
  if (shot === 'play') {
    // Two orders on the board, wok holding rice + egg for Nasi Goreng.
    world.orders.list = [
      { id: 1, recipe: 'nasi_goreng', name: 'Nasi Goreng', patience: 34, maxPatience: 48, coins: 12 },
      { id: 2, recipe: 'mie_ayam', name: 'Mie Ayam', patience: 22, maxPatience: 48, coins: 14 },
    ];
    world.orders.spawnIn = 6;
    world.wok.recipe = 'nasi_goreng';
    world.wok.items = ['rice', 'egg'];
    world.player.x = 280; world.player.y = 615; // beside the wok, about to add chili
    world.player.carrying = { kind: 'ing', ing: 'chili', chopped: true };
    world.dayLeft = 118;
    world.coins = 24;
    world.score = 24;
    world.served = 2;
    world.hint = 'E: tambah Cabai ke wok';
    return 'play';
  }
  if (shot === 'serve') {
    // A finished plate on the counter and its order waiting at the window.
    world.orders.list = [
      { id: 1, recipe: 'mie_ayam', name: 'Mie Ayam', patience: 26, maxPatience: 48, coins: 14 },
      { id: 2, recipe: 'cap_cay', name: 'Cap Cay', patience: 40, maxPatience: 48, coins: 16 },
    ];
    world.plating.plate = { recipe: 'mie_ayam' };
    world.player.x = 940; world.player.y = 405; // beside the plating counter, plate ready
    world.dayLeft = 96;
    world.coins = 40;
    world.score = 40;
    world.served = 3;
    world.combo = 2;
    world.hint = 'E: ambil piring — lalu antar ke Jendela Antar';
    return 'play';
  }
  if (shot === 'rush') {
    // Three orders, one nearly expired, wok cooking, chef carrying chicken.
    world.orders.list = [
      { id: 1, recipe: 'sate_ayam', name: 'Sate Ayam', patience: 6, maxPatience: 44, coins: 18 },
      { id: 2, recipe: 'nasi_goreng', name: 'Nasi Goreng', patience: 18, maxPatience: 44, coins: 12 },
      { id: 3, recipe: 'cap_cay', name: 'Cap Cay', patience: 31, maxPatience: 44, coins: 16 },
    ];
    world.wok.recipe = 'cap_cay';
    world.wok.items = ['veg', 'chicken', 'chili'];
    world.wok.cooking = 0.55;
    world.player.x = 280; world.player.y = 615; // beside the wok, carrying chicken
    world.player.carrying = { kind: 'ing', ing: 'chicken', chopped: true };
    world.dayLeft = 58;
    world.coins = 74;
    world.score = 74;
    world.served = 5;
    world.combo = 3;
    world.toasts.push({ text: '+18 koin — Sate Ayam tersaji! Kombo x3!', t: 2.2, color: '#b8f5c8' });
    world.hint = 'Wok sedang memasak — awasi jangan sampai gosong!';
    return 'play';
  }
  return null;
}
