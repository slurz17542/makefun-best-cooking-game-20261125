// main.ts — Wok Rush hand-in (Node 22, standard library only).
//
// The game itself is plain static files under game/ (game/index.html plus
// its ES modules, no library, no network request). This program hands it in:
// it copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there, using the vendored make.fun
// library to build the dossier the judge reads.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The entry is deterministic: both grader runs must write the same bytes.
// Nothing here reads the clock, the network or the environment beyond the
// output directory override, so the two runs agree byte for byte.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output directory: copy the game, then the screenshots.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) {
  throw new Error('screenshots/ is missing: take 3 or 4 screenshots of the game first');
}
const shots = readdirSync(shotsDir)
  .filter((name) => !name.startsWith('.'))
  .filter((name) => statSync(join(shotsDir, name)).isFile());
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (from the competition's gate): the text cap shapes
// the dossier's bytes; the other caps refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; more than 993 files
// in game/ or 48 MiB of game files in all, or a path under game/ over
// 1000 bytes). game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Wok Rush handed in: ${shots.length} screenshots, dossier written to ${out}`);
