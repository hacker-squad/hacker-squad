// Clara's clips: attack clips per move id (./moves.js) through the shared clip kit (planted, baked feet), the Overclock clip,
// and the engine's locomotion clips (a broom carries like a spear). Authoring: P() over CL (her ready stance: the broom
// across the body, the burning bristles up and forward); the broom is the rig's weapon joint (origin = the lower grip,
// +Z along the stick to the bristles). pole(centre, yaw, elev, roll, at) = the stick through `centre`, `at` m from the
// grip. Contact poses sit on each move's first active frame.
import { P, clip, spearAbout, STANCE } from '../../hero/rig.js';
import { LOCO_CLIPS, runPose, rollPose } from '../../hero/anims/locomotion.js';
import { createClipKit } from '../shared/clipkit.js';
import { lungeAt } from '../../hero/moveset.js';
import { MOVES } from './moves.js';

const pole = (c, yaw, elev, roll = 0, at = 0.35) => spearAbout(c, yaw, elev, roll, at);
export const CL = { ...STANCE, spear: pole([-0.02, 1.04, 0.26], 20, 34), gripL: 0.5, hipsR: [0, -15, 0], chest: [4, 6, 0] };
const ENTRY = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5' };
const { clipF } = createClipKit(MOVES, ENTRY, CL);
const L = (id, f) => lungeAt(MOVES[id], f);
const lead = (id, f, z = 0.2, x = 0.2, yaw = 12) => [x, 0.08, 0.3 + z + L(id, f), 0, yaw];
const R = Math.PI / 180;
/** The broom held out at heading `yaw` (° off her facing, + = left), body twisted `tw`° with it. */
const out = (yaw, elev = -5, tw = yaw * 0.4, extra) => ({
  spear: pole([Math.sin(yaw * R) * 0.3, 1.08, 0.1 + Math.cos(yaw * R) * 0.3], yaw, elev),
  chest: [6, tw, 0], hipsR: [0, tw * 0.8, 0], spine: [6, tw * 0.3, 0], ...extra });
const OVER = { spear: pole([0, 1.6, 0.05], 0, 95), chest: [-10, 0, 0], head: [-8, 0, 0], hipsR: [0, 0, 0] };
const DOWN = (z = 0.55, elev = -30) => ({ spear: pole([0, 0.95, z], 0, elev), chest: [22, 0, 0], hips: [0, 0.78, 0.1], hipsR: [0, 0, 0] });
const THRUST = (z, extra) => ({ spear: pole([0, 1.12, z], 0, 0, 0, 0.5), chest: [10, 5, 0], hipsR: [0, -5, 0], hips: [0, 0.84, 0.1], ...extra });
const LOW = { spear: pole([0, 0.72, 0.6], 0, -40), chest: [20, 0, 0], hips: [0, 0.76, 0.06], hipsR: [0, 0, 0] };
const UP = { spear: pole([0, 1.66, 0.45], 0, 70), chest: [-12, 0, 0], head: [-10, 0, 0], hips: [0, 0.95, 0.05], hipsR: [0, 0, 0] };
/** Dragon Breath: the bristles held up before her mouth, the body leaning `lean`° into the breath. */
const BLOW = (lean, extra) => ({ spear: pole([0.04, 1.36, 0.3 + lean * 0.006], 0, 12, 0, 0.9), chest: [lean, 0, 0], spine: [lean * 0.4, 0, 0], head: [-lean * 0.3, 0, 0],
  hips: [0, 0.86, lean * 0.004], hipsR: [0, 0, 0], gripL: 0.4, ...extra });
/** The broom planted in the right hand, the left arm free: wound back (k 0) or flung forward (k 1) — a lob. */
const TOSS = (k, extra) => ({ spear: pole([-0.34, 1.2, 0.06], 0, 82), lfree: 1, armL: k ? [-120, 0, 12, 10] : [50, 0, 24, 70],
  chest: [k ? 12 : -6, k ? -24 : 22, 0], hipsR: [0, k ? -14 : 12, 0], hips: [0, k ? 0.84 : 0.88, k ? 0.06 : -0.02], ...extra });
const B = {};                                     // = CL (a key with no overrides)

function attacks() {
  const C = {};
  C.n1 = clipF('n1', [[0, B], [5, out(-80, 10, -32)], [9, out(50, 0, 24, { fL: lead('n1', 9, 0.2) }), 'snap'], [15, out(70, -2, 30)], [24, B]]);
  C.n2 = clipF('n2', [[0, B], [5, out(85, 8, 32)], [9, out(-50, 0, -24, { fR: [-0.18, 0.08, 0.05 + L('n2', 9), 0, -20] }), 'snap'], [15, out(-70, -2, -30)], [24, B]]);
  C.n3 = clipF('n3', [[0, B], [8, LOW], [13, { spear: pole([0, 1.34, 0.55], 0, 34), chest: [0, 0, 0], hips: [0, 0.9, 0.08], hipsR: [0, 0, 0], fL: lead('n3', 13, 0.3) }, 'snap'],
    [18, UP], [30, B]]);
  C.n4 = clipF('n4', [[0, B], [5, out(100, -16, 36, { hips: [0, 0.82, 0] })], [10, out(-70, -18, -30, { hips: [0, 0.8, 0.04], fL: lead('n4', 10, 0.2) }), 'snap'],
    [16, out(-90, -16, -34, { hips: [0, 0.82, 0.03] })], [26, B]]);
  C.n5 = clipF('n5', [[0, B], [5, { spear: pole([-0.06, 1.14, -0.2], 0, 4, 0, 0.5), chest: [0, -18, 0], hipsR: [0, -32, 0], hips: [0, 0.87, -0.04] }],
    [9, THRUST(0.82, { fL: lead('n5', 9, 0.3) }), 'snap'], [16, THRUST(0.76)], [28, B]]);
  C.n6 = clipF('n6', [[0, B], [6, out(-100, 0, -40, { hips: [0, 0.86, 0] })], [16, out(90, -4, 0, { spin: -360, hips: [0, 0.84, 0.04] }), 'lin'],
    [19, { ...OVER, spin: -360 }], [22, { ...DOWN(0.56, -28), spin: -360 }, 'snap'], [34, { ...DOWN(0.56, -28), spin: -360 }], [44, { spin: -360 }]]);
  // C1 Fire Wheel: three turns forward, the burning broom out
  C.c1 = clipF('c1', [[0, B], [8, out(90, -4, 0)], [44, out(90, -4, 0, { spin: -1080 }), 'lin'], [50, { spin: -1080 }]]);
  // C2 Scorch: up over the hat (9), down (15)
  C.c2 = clipF('c2', [[0, B], [9, { ...OVER, hips: [0, 0.94, 0] }], [15, { ...DOWN(0.6, -24), fL: lead('c2', 15, 0.3) }, 'snap'], [27, DOWN(0.6, -26)], [40, B]]);
  // C3 Cauldron Pop: crouch low, rip the bristles up
  C.c3 = clipF('c3', [[0, B], [8, LOW], [13, { ...UP, fL: lead('c3', 13, 0.25) }, 'snap'], [26, UP], [44, B]]);
  // C4 Dragon Breath: a deep breath (10), blown across the bristles (14–30), the last one from the toes (34)
  C.c4 = clipF('c4', [[0, B], [10, BLOW(-14)], [14, BLOW(8, { fL: lead('c4', 14, 0.2, 0.22, 14) }), 'snap'], [22, BLOW(12)], [30, BLOW(6)],
    [32, BLOW(-8)], [35, BLOW(24, { hips: [0, 0.82, 0.1] }), 'snap'], [44, BLOW(20, { hips: [0, 0.82, 0.1] })], [56, B]]);
  // C5 Pumpkin Toss: three lobs with the free hand
  C.c5 = clipF('c5', [[0, B], [8, TOSS(0)], [13, TOSS(1), 'snap'], [18, TOSS(0)], [23, TOSS(1), 'snap'], [29, TOSS(0)], [35, TOSS(1, { hips: [0, 0.82, 0.1] }), 'snap'],
    [46, TOSS(1)], [60, B]]);
  // C6 Bat Swarm: four turns with the broom held high, then it comes down
  C.c6 = clipF('c6', [[0, B], [8, out(90, 24, 0)], [54, out(90, 24, 0, { spin: -1440 }), 'lin'], [59, { ...OVER, spin: -1440, hips: [0, 0.94, 0] }, 'out'],
    [62, { ...DOWN(0.58, -30), spin: -1440 }, 'snap'], [74, { ...DOWN(0.58, -30), spin: -1440 }], [84, { spin: -1440 }]]);
  C.dash = clipF('dash', [[0, { spear: pole([-0.15, 1.0, 0.3], -20, -20), chest: [12, -10, 0], hips: [0, 0.86, 0.06] }], [6, out(-80, 6, -30)],
    [10, out(50, -2, 24), 'snap'], [13, out(90, 4, 34)], [16, out(-60, -2, -28), 'snap'], [26, out(-80, -2, -32)], [40, B]]);
  const AIR = { footL: [0.16, 0.36, 0.2, -20, 10], footR: [-0.18, 0.3, -0.12, 20, -20], hips: [0, 0.95, 0] };
  C.jatk = clip([[0, P({ ...AIR, ...out(-70, 14, -28) }, CL)], [4 / 18, P({ ...AIR, ...out(60, -8, 28) }, CL), 'snap'], [9 / 18, P({ ...AIR, ...out(-60, -8, -28) }, CL), 'snap'],
    [1, P({ ...AIR, ...out(-70, -6, -30) }, CL)]]);
  // Broom Dive: she sits the broom (the stick level under her, knees tucked), noses it down, and rides it into the ground
  const Lj = MOVES.jc.landFrame, Fj = MOVES.jc.frames, Dj = MOVES.jc.plunge[0];
  const ride = (elev) => ({ spear: [0, 0.76, -0.3, 0, elev, 0], gripL: 0.3, hips: [0, 1.0, 0.02], hipsR: [0, 0, 0], chest: [10 - elev * 0.4, 0, 0],
    footL: [0.2, 0.52, 0.12, -30, 10], footR: [-0.2, 0.5, 0.06, -30, -10] });
  const land = { ...DOWN(0.58, -30), hips: [0, 0.64, 0.14], footL: [0.3, 0.08, 0.4, 0, 25], footR: [-0.3, 0.08, -0.3, 0, -50] };
  C.jc = clip([[0, P(AIR, CL)], [5 / Fj, P(ride(8), CL), 'out'], [(Dj - 1) / Fj, P(ride(4), CL)], [(Lj - 1) / Fj, P(ride(-34), CL), 'in'],
    [Lj / Fj, P(land, CL), 'snap'], [(Lj + 8) / Fj, P(land, CL)], [MOVES.jc.cancel / Fj, P({ ...land, hips: [0, 0.74, 0.1] }, CL), 'io'], [1, P({}, CL)]], false, true);
  return C;
}

// ---------------------------------------------------------------- Overclock: WITCHING HOUR (220 frames)
// 0 the broom raised over her hat (cut-in) · 30–100 she turns twice with it held high: the bats pour out · 104 / 120 /
// 136 three pumpkins lobbed · 172 the broom up · 180 it comes down: the Great Pumpkin lands
const MF = 220;
const mk = (f, spec, e) => [f / MF, P(spec, CL), e];
const FEET = { footL: [0.24, 0.08, 0.14, 0, 20], footR: [-0.24, 0.08, -0.14, 0, -20] };
export const MUSOU_FRAMES = MF;
export const MUSOU_CLIPS = {
  mu_clara: clip([
    mk(0, {}),
    mk(22, { ...OVER, spear: pole([0, 1.62, 0.1], 0, 88), ...FEET }),
    mk(30, { ...out(90, 26, 0), ...FEET }),
    mk(100, { ...out(90, 26, 0), spin: -720, ...FEET }, 'lin'),
    mk(104, TOSS(0, { spin: -720, ...FEET })), mk(110, TOSS(1, { spin: -720, ...FEET }), 'snap'),
    mk(120, TOSS(0, { spin: -720, ...FEET })), mk(126, TOSS(1, { spin: -720, ...FEET }), 'snap'),
    mk(136, TOSS(0, { spin: -720, ...FEET })), mk(142, TOSS(1, { spin: -720, ...FEET }), 'snap'),
    mk(160, { spin: -720, ...FEET }),
    mk(172, { ...OVER, spear: pole([0.02, 1.76, 0.2], 0, 94), hips: [0, 0.97, 0], spin: -720, ...FEET }),
    mk(180, { ...DOWN(0.6, -34), chest: [26, 0, 0], hips: [0, 0.7, 0.12], spin: -720, ...FEET }, 'snap'),
    mk(204, { ...DOWN(0.6, -32), chest: [22, 0, 0], hips: [0, 0.74, 0.1], spin: -720, ...FEET }),
    mk(220, { spin: -720 }),
  ], false, true),
};
// key art (title, loading card): the broom stood at her right side, the left paw on her hip
const KEYART = { spear: pole([-0.36, 1.3, 0.06], -4, 84), lfree: 1, armL: [10, 0, 38, 95], hipsR: [0, 8, 0], chest: [-2, 10, 0], head: [-4, 6, 0] };

export const CLARA_CLIPS = { ...LOCO_CLIPS, ...attacks(), ...MUSOU_CLIPS, keyart: clip([[0, P(KEYART, CL)], [1, P(KEYART, CL)]]) };
export { runPose, rollPose };
