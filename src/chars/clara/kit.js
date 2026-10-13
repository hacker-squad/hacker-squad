// Clara's kit (contract: src/chars/index.js): the burning-broom moveset (moves.js, anims.js), the squat voxel cat in her
// witch's costume (model.js), WITCHING HOUR (musou.js) and the effects view — fire, bats and pumpkins (view.js).
// Locomotion physics, dodge ghosts and roll are shared (hero.js); the locomotion clips are the engine's (a broom carries
// like a spear), fitted to the squat rig.
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { CLARA_CLIPS, runPose, rollPose } from './anims.js';
import { createClaraModel, createClaraSecondary, BROOM, BROOM_SCALE } from './model.js';
import { SQUAT, squatFit } from '../shared/squat.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const CLARA_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: CLARA_CLIPS, feet: {},
  rig: SQUAT, fit: squatFit({ w: BROOM_SCALE, tip: BROOM.tip, butt: BROOM.butt }),
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 3,
  model: createClaraModel, secondary: createClaraSecondary,
  trail: { base: BROOM.base * 0.8, baseHeavy: BROOM.base * 0.6, tip: BROOM.tip + 0.2 },   // the ribbon is the burning bristles' sweep
  // vfx.js heavy / charge palette: fire with a violet edge (linear HDR)
  fx: {
    needle: [[3.0, 1.5, 0.4], [2.0, 0.7, 3.0], [3.0, 2.4, 1.0]],
    hot: [[0.62, 0.26, 0.05], [0.66, 0.32, 0.08], [0.7, 0.4, 0.12], [2.8, 1.5, 0.4]],
    burst: [0.62, 0.28, 0.06], flash: [2.8, 2.0, 1.2], slash: [3.0, 1.6, 0.5], pulse: [2.0, 0.9, 0.25],
    light: [1, 0.7, 0.4], crack: [2.8, 1.3, 0.4], wall: [1.5, 0.7, 0.2], ring: [2.6, 1.4, 0.5], shard: [2.0, 0.8, 3.0],
    glint: [2.8, 2.0, 1.0], glitter: [2.8, 2.0, 1.4],
    glow: [0x8a3a00, 0xff8a1e, 0.3],
    trail: { white: [1.3, 0.95, 0.5], fringe: [1.0, 0.25, 0.02], hot: [1.9, 1.2, 0.45], glow: [1.7, 0.7, 0.15] },
  },
  createMusou, createMusouView,
};
