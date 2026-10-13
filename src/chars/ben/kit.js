// Ben's kit (contract: src/chars/index.js): the banana-bow + boomerang moveset (moves.js, anims.js), the squat voxel
// monkey with the gorilla inside him (model.js), GOING APE (musou.js) and the effects view — fruit, the boomerang, the
// rampage (view.js). Locomotion physics, dodge ghosts and roll are shared (hero.js); the locomotion clips are the
// engine's carrying the bow (shared/loco.js), fitted to the squat rig.
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { BEN_CLIPS, runPose, rollPose } from './anims.js';
import { createBenModel, createBenSecondary, BOW, BOW_SCALE } from './model.js';
import { SQUAT, squatFit } from '../shared/squat.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const BEN_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: BEN_CLIPS, feet: {},
  rig: SQUAT, fit: squatFit({ w: BOW_SCALE, tip: BOW.tip, butt: BOW.butt }),
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 3,
  model: createBenModel, secondary: createBenSecondary,
  // the ribbon is the bow's limbs sweeping (lower tip → upper tip), only on the swats: shots and throws leave no cut
  trail: { base: -BOW.butt * 0.7, baseHeavy: -BOW.butt * 0.9, tip: BOW.tip + 0.1, moves: ['n1', 'n2', 'n4', 'n6', 'dash', 'jatk', 'c3'] },
  // vfx.js heavy / charge palette: banana yellow with a leaf-green edge (linear HDR)
  fx: {
    needle: [[3.0, 2.4, 0.5], [0.8, 3.0, 0.9], [3.0, 2.0, 0.8]],
    hot: [[0.62, 0.5, 0.08], [0.66, 0.54, 0.1], [0.7, 0.58, 0.14], [2.8, 2.3, 0.5]],
    burst: [0.62, 0.5, 0.08], flash: [2.8, 2.5, 1.2], slash: [3.0, 2.4, 0.5], pulse: [2.0, 1.6, 0.3],
    light: [1, 0.9, 0.4], crack: [2.8, 2.2, 0.5], wall: [1.5, 1.2, 0.2], ring: [2.6, 2.2, 0.5], shard: [0.8, 3.0, 0.9],
    glint: [2.8, 2.5, 1.0], glitter: [2.8, 2.6, 1.4],
    glow: [0x7a5a00, 0xffd93a, 0.3],
    trail: { white: [1.3, 1.2, 0.5], fringe: [0.4, 1.0, 0.3], hot: [1.9, 1.6, 0.45], glow: [1.7, 1.4, 0.15] },
  },
  createMusou, createMusouView,
};
