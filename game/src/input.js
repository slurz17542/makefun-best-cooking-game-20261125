// input.js — keyboard (WASD / arrows + E / Space / Enter / R) and mouse
// (click to walk, click a nearby station to use it). One small object the
// rest of the game reads every frame; it owns no game logic.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    // mouse position in canvas pixels, and a queued click (consumed by the game)
    mouseX: 0,
    mouseY: 0,
    click: null,
    interactPressed: false,
    startPressed: false,
    restartPressed: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
    if (e.code === 'KeyE' || e.code === 'Space') { input.interactPressed = true; e.preventDefault(); }
    if (e.code === 'Enter') { input.startPressed = true; }
    if (e.code === 'KeyR') { input.restartPressed = true; }
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]);
  });

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    input.mouseX = p.x; input.mouseY = p.y;
    input.click = { x: p.x, y: p.y };
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toCanvas(e);
    input.mouseX = p.x; input.mouseY = p.y;
  });

  // The game calls this once per frame after reading the edge-triggered flags.
  input.endFrame = () => {
    input.click = null;
    input.interactPressed = false;
    input.startPressed = false;
    input.restartPressed = false;
  };

  input.axis = () => {
    let x = 0, y = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) y -= 1;
    if (keys.has('down')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  };

  return input;
}
