// Bryan's kit (contract: src/chars/index.js): the stop-sign shield moveset (moves.js, anims.js), the voxel pig in his
// safety helmet (model.js), ROAD CLOSED (musou.js) and the effects view (view.js).
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { BRYAN_CLIPS, runPose, rollPose } from './anims.js';
import { createBryanModel, createBryanSecondary, SIGN, SIGN_SCALE } from './model.js';
import { SQUAT, squatFit } from '../shared/squat.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const BRYAN_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: BRYAN_CLIPS, feet: {},
  rig: SQUAT, fit: squatFit({ w: SIGN_SCALE, tip: SIGN.tip, butt: 0.16 }),   // a squat little pig: the clips are fitted to it
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 4,
  model: createBryanModel, secondary: createBryanSecondary,
  // the ribbon follows the sign's swings only (a bash, a stamp or a flash leaves no trail)
  trail: { base: SIGN.base, baseHeavy: SIGN.base, tip: SIGN.tip, moves: ['n2', 'n4', 'n6', 'c1', 'c4', 'c6', 'jatk', 'jc'] },
  // vfx.js heavy / charge palette: hazard yellow with a red edge (linear HDR)
  fx: {
    needle: [[3.0, 2.2, 0.4], [3.0, 0.6, 0.4], [3.0, 2.7, 1.2]],
    hot: [[0.62, 0.42, 0.05], [0.66, 0.48, 0.08], [0.7, 0.54, 0.14], [2.7, 2.1, 0.5]],
    burst: [0.62, 0.44, 0.06], flash: [2.8, 2.4, 1.2], slash: [3.0, 2.4, 0.7], pulse: [2.0, 1.4, 0.25],
    light: [1, 0.85, 0.4], crack: [2.8, 1.9, 0.4], wall: [1.5, 1.0, 0.2], ring: [2.5, 1.9, 0.5], shard: [3.0, 0.9, 0.5],
    glint: [2.8, 2.4, 1.0], glitter: [2.8, 2.4, 1.2],
    glow: [0x8a6a00, 0xffd21e, 0.3],
    trail: { white: [1.15, 1.08, 0.8], fringe: [1.0, 0.3, 0.1], hot: [1.7, 1.5, 0.8], glow: [1.6, 1.1, 0.15] },
  },
  createMusou, createMusouView,
};
