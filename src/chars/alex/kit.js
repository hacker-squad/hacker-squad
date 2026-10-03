// Alex's kit (contract: src/chars/index.js): the umbrella moveset (moves.js, anims.js), the squat voxel sheep and its umbrella
// (model.js), TYPHOON (musou.js) and the effects view (view.js). Locomotion physics, dodge ghosts and roll are shared
// (hero.js); the locomotion clips are the engine's (a furled umbrella carries like a spear).
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { ALEX_CLIPS, runPose, rollPose } from './anims.js';
import { createAlexModel, createAlexSecondary, UMB, UMB_SCALE } from './model.js';
import { SQUAT, squatFit } from '../shared/squat.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const ALEX_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: ALEX_CLIPS, feet: {},
  rig: SQUAT, fit: squatFit({ w: UMB_SCALE, tip: UMB.tip, butt: UMB.butt }),   // a squat little sheep: the clips are fitted to it
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 4,
  model: createAlexModel, secondary: createAlexSecondary,
  trail: { base: 0.9 * UMB_SCALE, baseHeavy: 0.6 * UMB_SCALE, tip: UMB.tip },                // umbrella ribbon: distances along the shaft (vfx.js)
  // vfx.js heavy / charge palette: sky blue with a white edge (linear HDR)
  fx: {
    needle: [[0.6, 2.2, 3.0], [1.4, 2.0, 3.0], [2.2, 2.8, 3.0]],
    hot: [[0.08, 0.36, 0.6], [0.1, 0.42, 0.66], [0.16, 0.5, 0.72], [0.9, 2.0, 2.8]],
    burst: [0.1, 0.38, 0.6], flash: [1.6, 2.4, 2.8], slash: [0.9, 2.1, 3.0], pulse: [0.3, 1.1, 2.0],
    light: [0.55, 0.85, 1], crack: [0.6, 1.7, 2.8], wall: [0.3, 0.8, 1.5], ring: [0.8, 1.8, 2.6], shard: [1.4, 2.2, 2.8],
    glint: [1.3, 2.3, 2.8], glitter: [1.5, 2.3, 2.9],
    glow: [0x0a4a8a, 0x5ac8ff, 0.3],
    trail: { white: [0.85, 1.05, 1.15], fringe: [0.15, 0.6, 1.0], hot: [1.1, 1.55, 1.7], glow: [0.3, 1.0, 1.6] },
  },
  createMusou, createMusouView,
};
