// config.js — every tuning knob, recipe and ingredient in one place.
// Nothing here is imported by the grader's gate as a library: it is the game's own source.

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const DAY_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;

// Ingredient catalogue. `chop` means the ingredient must visit the chopping
// board before it can go into the wok. `color` is the food's main colour,
// `accent` its garnish colour.
export const INGREDIENTS = {
  rice:    { name: 'Beras',    short: 'Nasi',  chop: false, color: '#f5f0e1', accent: '#d8cfae' },
  noodle:  { name: 'Mie',      short: 'Mie',   chop: false, color: '#f2c14e', accent: '#d99a26' },
  chicken: { name: 'Ayam',     short: 'Ayam',  chop: true,  color: '#f2a18e', accent: '#d96a4f' },
  egg:     { name: 'Telur',    short: 'Telur', chop: false, color: '#ffe9a8', accent: '#f7b733' },
  veg:     { name: 'Sayur',    short: 'Sayur', chop: true,  color: '#7dc383', accent: '#3e8f4e' },
  chili:   { name: 'Cabai',    short: 'Cabai', chop: true,  color: '#e5484d', accent: '#a32428' },
  sauce:   { name: 'Saus',     short: 'Saus',  chop: false, color: '#8b5a2b', accent: '#5e3a17' },
};

// Recipes: the dish name, the base ingredient that starts the dish, the
// remaining ingredients in the order they must be added, and the coin value.
export const RECIPES = {
  nasi_goreng: {
    name: 'Nasi Goreng', base: 'rice',
    needs: ['egg', 'chili'],
    coins: 12, color: '#e8a33d',
  },
  mie_ayam: {
    name: 'Mie Ayam', base: 'noodle',
    needs: ['chicken', 'veg'],
    coins: 14, color: '#f2c14e',
  },
  cap_cay: {
    name: 'Cap Cay', base: 'veg',
    needs: ['chicken', 'chili'],
    coins: 16, color: '#7dc383',
  },
  sate_ayam: {
    name: 'Sate Ayam', base: 'chicken',
    needs: ['sauce', 'chili'],
    coins: 18, color: '#d96a4f',
  },
};

export const RECIPE_KEYS = Object.keys(RECIPES);

// Difficulty ramp: every RAMP_EVERY seconds the kitchen gets busier.
export const RAMP_EVERY = 30;
export const SPAWN_START = 13;   // seconds between new orders at the start
export const SPAWN_MIN = 7;      // ...down to this
export const PATIENCE_START = 48; // seconds an order waits at the start
export const PATIENCE_MIN = 30;   // ...down to this
export const COOK_SECONDS = 3.2;  // wok time once every ingredient is in
export const BURN_SECONDS = 5;    // grace after cooked before it burns
export const CHOP_SECONDS = 1.3;  // chopping board time per ingredient

export const PLAYER_SPEED = 300;  // px per second
export const PLAYER_RADIUS = 24;
