// orders.js — the order board: spawning orders, their patience clocks,
// matching a finished plate to an order, and the coins a serve earns.

import { INGREDIENTS, MAX_ORDERS, PATIENCE_MIN, PATIENCE_START, RAMP_EVERY, RECIPES, RECIPE_KEYS, SPAWN_MIN, SPAWN_START } from './config.js';
import { pick } from './random.js';

let nextId = 1;

export function createOrders(rng) {
  return {
    rng,
    list: [],
    spawnIn: 1.5, // first order arrives quickly so the game starts moving
    elapsed: 0,
  };
}

function patienceFor(elapsed) {
  const step = Math.floor(elapsed / RAMP_EVERY);
  return Math.max(PATIENCE_MIN, PATIENCE_START - step * 4);
}

function spawnInterval(elapsed) {
  const step = Math.floor(elapsed / RAMP_EVERY);
  return Math.max(SPAWN_MIN, SPAWN_START - step * 1.5);
}

export function spawnOrder(state) {
  const key = pick(state.rng, RECIPE_KEYS);
  const recipe = RECIPES[key];
  state.list.push({
    id: nextId++,
    recipe: key,
    name: recipe.name,
    patience: patienceFor(state.elapsed),
    maxPatience: patienceFor(state.elapsed),
    coins: recipe.coins,
  });
}

export function updateOrders(state, dt) {
  state.elapsed += dt;
  if (state.list.length < MAX_ORDERS) {
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnOrder(state);
      state.spawnIn = spawnInterval(state.elapsed);
    }
  }
  // Returns the ids of orders whose patience ran out this frame.
  const expired = [];
  for (const o of state.list) {
    o.patience -= dt;
    if (o.patience <= 0) expired.push(o.id);
  }
  if (expired.length) state.list = state.list.filter((o) => !expired.includes(o.id));
  return expired;
}

// What a finished plate holds: the recipe key plus its full ingredient list.
export function plateContents(recipeKey) {
  const r = RECIPES[recipeKey];
  return [r.base, ...r.needs];
}

export function findMatchingOrder(state, recipeKey) {
  return state.list.find((o) => o.recipe === recipeKey) ?? null;
}

// Coins for a serve: base value plus a patience bonus (up to +50%).
export function serveValue(order) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  return Math.round(order.coins * (1 + 0.5 * frac));
}

export function orderIngredientNames(order) {
  const r = RECIPES[order.recipe];
  return [r.base, ...r.needs].map((k) => INGREDIENTS[k].short);
}
