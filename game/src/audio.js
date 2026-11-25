// audio.js — tiny synthesized sounds via WebAudio, no audio files.
// Everything is a short oscillator blip, so the game needs no network and
// no assets. Created lazily on the first user gesture.

let ctx = null;
let muted = false;

function ensure() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function blip(freq, dur, type, gain, when = 0) {
  const ac = ensure();
  if (!ac || muted) return;
  const t = ac.currentTime + when;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  unlock() { ensure(); },
  pickup() { blip(520, 0.07, 'triangle', 0.12); },
  chop() { blip(180, 0.05, 'square', 0.08); },
  drop() { blip(300, 0.06, 'triangle', 0.10); },
  ding() { blip(880, 0.18, 'sine', 0.14); blip(1318, 0.22, 'sine', 0.10, 0.08); },
  coin() { blip(988, 0.09, 'sine', 0.14); blip(1319, 0.16, 'sine', 0.12, 0.07); },
  bad() { blip(160, 0.18, 'sawtooth', 0.08); },
  burn() { blip(110, 0.3, 'sawtooth', 0.10); blip(82, 0.35, 'sawtooth', 0.08, 0.12); },
  toggleMute() { muted = !muted; return muted; },
};
