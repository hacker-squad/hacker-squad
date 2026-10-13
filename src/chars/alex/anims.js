// Alex's clips: attack clips per move id (./moves.js) through the shared clip kit (planted, baked feet), the Overclock clip,
// and the engine's locomotion clips (a furled umbrella carries like a spear). Authoring: P() over AX (his ready stance:
// umbrella across the body, tip up and forward); the umbrella is the rig's weapon joint (origin = the handle, +Z along the
// shaft, ferrule at 1.6 m). pole(centre, yaw, elev, roll, at) = the shaft through `centre`, `at` m from the handle.
// Contact poses sit on each move's first active frame.
import { P, clip, spearAbout, STANCE } from '../../hero/rig.js';
import { LOCO_CLIPS, runPose, rollPose } from '../../hero/anims/locomotion.js';
import { createClipKit } from '../shared/clipkit.js';
import { lungeAt } from '../../hero/moveset.js';
import { MOVES } from './moves.js';

const pole = (c, yaw, elev, roll = 0, at = 0.35) => spearAbout(c, yaw, elev, roll, at);
export const AX = { ...STANCE, spear: pole([-0.02, 1.02, 0.28], 14, 26), gripL: 0.6, hipsR: [0, -18, 0], chest: [4, 6, 0] };
const ENTRY = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5' };
const { clipF } = createClipKit(MOVES, ENTRY, AX);
const L = (id, f) => lungeAt(MOVES[id], f);
/** Lead-foot step landing `z` m ahead of the stance spot at move frame f (move-start coords include the lunge so far). */
const lead = (id, f, z = 0.2, x = 0.2, yaw = 12) => [x, 0.08, 0.3 + z + L(id, f), 0, yaw];
/** Umbrella held out level at heading `yaw` (° off his facing, + = left), body twisted `tw`° with it. */
const out = (yaw, elev = -5, tw = yaw * 0.4, extra) => ({
  spear: pole([Math.sin(yaw * Math.PI / 180) * 0.3, 1.08, 0.1 + Math.cos(yaw * Math.PI / 180) * 0.3], yaw, elev),
  chest: [6, tw, 0], hipsR: [0, tw * 0.8, 0], spine: [6, tw * 0.3, 0], ...extra });
const OVER = { spear: pole([0, 1.6, 0.05], 0, 95), chest: [-10, 0, 0], head: [-8, 0, 0], hipsR: [0, 0, 0] };
const DOWN = (z = 0.55, elev = -30) => ({ spear: pole([0, 0.95, z], 0, elev), chest: [22, 0, 0], hips: [0, 0.78, 0.1], hipsR: [0, 0, 0] });
const THRUST = (z, extra) => ({ spear: pole([0, 1.12, z], 0, 0, 90, 0.5), chest: [10, 5, 0], hipsR: [0, -5, 0], hips: [0, 0.84, 0.1], ...extra });
/** Braced behind the open umbrella: it points down the lane at chest height, both hands close behind the canopy, the
 *  body leaning `lean`° into the wind. */
const BRACE = (z = 0.3, lean = 10, extra) => ({ spear: pole([0, 1.16, z], 0, 6, 0, 0.5), chest: [lean, 0, 0], spine: [lean * 0.5, 0, 0], head: [-lean * 0.3, 0, 0],
  hips: [0, 0.84, 0.02 + lean * 0.004], hipsR: [0, 0, 0], gripL: 0.42, ...extra });
const B = {};                                     // = AX (a key with no overrides)

function attacks() {
  const C = {};
  // ---- N1 jab: chamber back at the hip, drive it straight out (contact 11)
  C.n1 = clipF('n1', [
    [0, B],
    [7, { spear: pole([-0.05, 1.1, -0.2], 0, 4, 90, 0.5), chest: [0, -15, 0], hipsR: [0, -35, 0], hips: [0, 0.86, -0.05] }],
    [11, THRUST(0.8, { fL: lead('n1', 11, 0.3, 0.18, 10) }), 'snap'],
    [18, THRUST(0.75)],
    [30, B],
  ]);
  // ---- N2 wide sweep: chamber right, sweep right → left (contact 12)
  C.n2 = clipF('n2', [
    [0, B],
    [8, { spear: pole([0.3, 1.15, 0.05], 110, 8), chest: [0, 45, 0], hipsR: [0, 30, 0], spine: [4, 15, 0] }],
    [14, { spear: pole([-0.2, 1.08, 0.25], -110, 2), chest: [6, -40, 0], hipsR: [0, -40, 0], spin: -30, fR: [-0.22, 0.08, -0.2 + L('n2', 14), 0, -40] }, 'snap'],
    [22, { spear: pole([-0.25, 1.05, 0], -150, 0), chest: [4, -50, 0], hipsR: [0, -45, 0], spin: -45 }],
    [34, B],
  ]);
  // ---- N3 rising flick: the tip dips low in front, flicks up (contact 12)
  C.n3 = clipF('n3', [
    [0, B],
    [8, { spear: pole([0, 0.8, 0.55], 0, -38), chest: [18, 0, 0], hips: [0, 0.8, 0.06], hipsR: [0, 0, 0] }],
    [12, { spear: pole([0, 1.3, 0.55], 0, 30), chest: [2, 0, 0], hips: [0, 0.88, 0.08], hipsR: [0, 0, 0], fL: lead('n3', 12, 0.25) }, 'snap'],
    [16, { spear: pole([0, 1.55, 0.45], 0, 60), chest: [-8, 0, 0], head: [-6, 0, 0], hips: [0, 0.92, 0.06], hipsR: [0, 0, 0] }],
    [32, B],
  ]);
  // ---- N4 overhead chop (contact 13)
  C.n4 = clipF('n4', [
    [0, B],
    [8, { ...OVER, hips: [0, 0.92, 0] }],
    [13, { ...DOWN(0.6, -22), chest: [20, 0, 0], fL: lead('n4', 13, 0.3) }, 'snap'],
    [22, { ...DOWN(0.6, -24), chest: [18, 0, 0] }],
    [36, B],
  ]);
  // ---- N5 backhand sweep left → right (contact 14)
  C.n5 = clipF('n5', [
    [0, B],
    [8, { ...out(120, 0, 45), hips: [0, 0.86, 0] }],
    [12, { ...out(40, -6, 15), hips: [0, 0.84, 0.05], fL: lead('n5', 12, 0.25) }, 'lin'],
    [18, { ...out(-100, -4, -40) }, 'snap'],
    [26, { ...out(-110, -2, -42) }],
    [38, B],
  ]);
  // ---- N6 full spin, umbrella at arm's length, low finish (contact 14)
  C.n6 = clipF('n6', [
    [0, B],
    [8, { ...out(-100, 0, -40), hips: [0, 0.84, 0] }],
    [14, { ...out(90, -6, 0), spin: 0, hips: [0, 0.8, 0.04] }, 'lin'],
    [22, { ...out(90, -6, 0), spin: -360, hips: [0, 0.78, 0.06] }, 'lin'],
    [32, { ...out(80, -12, 20), spin: -360, hips: [0, 0.76, 0.06], chest: [16, 20, 0] }, 'out'],
    [50, { spin: -360 }],
  ]);
  // ---- C1 Gale: chamber at the hip (10), the umbrella snaps open ahead (18), braced and shaking in the wind (20–44),
  // the last gust shoved forward (48), recover
  C.c1 = clipF('c1', [
    [0, B],
    [10, { spear: pole([-0.05, 1.1, -0.15], 0, 8, 0, 0.5), chest: [0, -10, 0], hipsR: [0, -20, 0], hips: [0, 0.88, -0.04] }],
    [18, BRACE(0.3, 12, { fL: lead('c1', 18, 0.15, 0.24, 15) }), 'snap'],
    [26, BRACE(0.26, 16)],
    [34, BRACE(0.32, 10)],
    [44, BRACE(0.26, 16)],
    [48, BRACE(0.62, 24, { hips: [0, 0.8, 0.12] }), 'snap'],
    [56, BRACE(0.58, 22, { hips: [0, 0.8, 0.12] })],
    [66, B],
  ]);
  // ---- C2 hook launcher: crouch, tip low → rip it up (contact 15)
  C.c2 = clipF('c2', [
    [0, B],
    [8, { spear: pole([0, 0.7, 0.6], 0, -40), chest: [20, 0, 0], hips: [0, 0.76, 0.06], hipsR: [0, 0, 0] }],
    [11, { spear: pole([0, 0.68, 0.62], 0, -44), chest: [22, 0, 0], hips: [0, 0.74, 0.07], hipsR: [0, 0, 0], fL: lead('c2', 11, 0.3) }],
    [16, { spear: pole([0, 1.7, 0.45], 0, 72), chest: [-12, 0, 0], head: [-10, 0, 0], hips: [0, 0.95, 0.05], hipsR: [0, 0, 0] }, 'snap'],
    [32, { spear: pole([0, 1.72, 0.42], 0, 76), chest: [-10, 0, 0], head: [-8, 0, 0], hips: [0, 0.93, 0.05], hipsR: [0, 0, 0] }],
    [60, B],
  ]);
  // ---- C3 wide 270° sweep (window 18–28)
  C.c3 = clipF('c3', [
    [0, B],
    [10, { ...out(-150, 2, -55), hips: [0, 0.84, 0] }],
    [16, { ...out(-150, 0, -58), hips: [0, 0.82, 0.02], fL: lead('c3', 16, 0.35, 0.26, 20) }],
    [28, { ...out(40, -4, 30), spin: 60, hips: [0, 0.8, 0.06] }, 'lin'],
    [34, { ...out(60, -6, 36), spin: 80, hips: [0, 0.8, 0.06] }, 'out'],
    [50, { ...out(60, -8, 30), spin: 80, hips: [0, 0.82, 0.05] }],
    [66, B],
  ]);
  // ---- C4 Cloudburst: the umbrella swung up (10) and held pointing at the roof ahead, the free hand out (16–44); on the
  // lightning (46) it is whipped down
  const CALL = (elev, e) => ({ spear: pole([0.06, 1.46, 0.22], 0, elev), chest: [-8, 8, 0], head: [-16, 0, 0], hipsR: [0, 0, 0], lfree: 1, armL: [-70, 0, 30, 20], ...e });
  C.c4 = clipF('c4', [
    [0, B],
    [10, CALL(84, { hips: [0, 0.94, 0] })],
    [16, CALL(58, { fL: lead('c4', 16, 0.25) }), 'snap'],
    [30, CALL(64, { hips: [0, 0.92, 0.02] })],
    [44, CALL(58)],
    [46, { ...DOWN(0.6, -28), lfree: 1, armL: [-30, 0, 30, 30] }, 'snap'],
    [56, { ...DOWN(0.6, -26), lfree: 1, armL: [-30, 0, 30, 30] }],
    [66, B],
  ]);
  // ---- C5 Thunder Drop: raise (14), smash (24), hold, wave at 36
  C.c5 = clipF('c5', [
    [0, B],
    [14, { ...OVER, spear: pole([0.02, 1.72, 0.2], 0, 92), hips: [0, 0.95, 0] }],
    [20, { ...OVER, spear: pole([0.02, 1.76, 0.22], 0, 94), hips: [0, 0.96, 0] }],
    [24, { ...DOWN(0.6, -34), chest: [24, 0, 0], hips: [0, 0.74, 0.1], fL: lead('c5', 24, 0.3, 0.24, 18) }, 'snap'],
    [40, { ...DOWN(0.6, -36), chest: [26, 0, 0], hips: [0, 0.72, 0.1] }],
    [60, { ...DOWN(0.6, -34), chest: [20, 0, 0], hips: [0, 0.76, 0.08] }],
    [76, B],
  ]);
  // ---- C6 Twister: full spin ×3 under the open umbrella, held high and tilted into the turn, then the heave
  const WHIRL = { spear: pole([0.12, 1.5, 0.12], 90, 62), chest: [-4, 0, 8], head: [-6, 0, 0], hipsR: [0, 0, 0] };
  C.c6 = clipF('c6', [
    [0, B],
    [8, { ...out(-100, 0, -40), hips: [0, 0.84, 0] }],
    [12, { ...WHIRL, spin: 0, hips: [0, 0.9, 0.04] }, 'lin'],
    [52, { ...WHIRL, spin: -1080, hips: [0, 0.9, 0.04] }, 'lin'],
    [57, { ...OVER, spin: -1080, hips: [0, 0.94, 0] }, 'out'],
    [60, { ...DOWN(0.6, -30), spin: -1080 }, 'snap'],
    [76, { ...DOWN(0.6, -30), spin: -1080 }],
    [92, { spin: -1080 }],
  ]);
  // ---- dash: running carry, low sweep (contact 18)
  C.dash = clipF('dash', [
    [0, { spear: pole([-0.15, 1.0, 0.3], -20, -20), chest: [12, -10, 0], hips: [0, 0.86, 0.06] }],
    [12, { ...out(-120, -4, -45), hips: [0, 0.84, 0.05] }],
    [18, { ...out(90, -10, 40), hips: [0, 0.8, 0.08], fL: lead('dash', 18, 0.35) }, 'snap'],
    [32, { ...out(100, -8, 40), hips: [0, 0.82, 0.08] }],
    [56, B],
  ]);
  // ---- jump attack: tucked, a swipe
  const AIR = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
  C.jatk = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR, spear: pole([-0.2, 1.3, 0], -60, 30) }, AX)],
    [6 / 24, P({ ...out(-110, 10, -40), hips: [0, 0.98, 0], footL: AIR.fL, footR: AIR.fR }, AX), 'out'],
    [10 / 24, P({ ...out(80, -20, 35), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, AX), 'snap'],
    [1, P({ ...out(60, -15, 25), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, AX)],
  ]);
  // ---- jump charge (Parasol Drop): hanging under the open umbrella at the apex, plunge, slam the ground
  const Lj = MOVES.jc.landFrame, Fj = MOVES.jc.frames, Dj = MOVES.jc.plunge[0];
  const hang = { ...OVER, spear: pole([0, 1.5, 0.05], 0, 90), hips: [0, 1.0, 0.04], footL: [0.16, 0.5, 0.14, -30, 10], footR: [-0.18, 0.42, -0.12, 20, -20] };
  const slam = { spear: pole([0, 0.95, 0.6], 0, -40, 0, 0.5), chest: [22, 0, 0], hips: [0, 0.62, 0.16], hipsR: [0, 0, 0],
    footL: [0.3, 0.08, 0.5, 0, 25], footR: [-0.3, 0.08, -0.3, 0, -50] };
  C.jc = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR }, AX)],
    [5 / Fj, P(hang, AX), 'out'],
    [(Dj - 1) / Fj, P(hang, AX)],
    [(Lj - 1) / Fj, P({ ...hang, spear: pole([0, 1.3, 0.4], 0, -20), chest: [10, 0, 0] }, AX), 'in'],
    [Lj / Fj, P(slam, AX), 'snap'],
    [(Lj + 8) / Fj, P(slam, AX)],
    [MOVES.jc.cancel / Fj, P({ ...slam, hips: [0, 0.72, 0.1] }, AX), 'io'],
    [1, P({}, AX)],
  ], false, true);
  return C;
}

// ---------------------------------------------------------------- Overclock: TYPHOON (210 frames)
// 0 the umbrella raised and opened to the sky (cut-in) · 30–150 he hangs under it as it spins, feet off the floor (the sim
// lifts and flies him: ./musou.js) · 160 it folds · 170 heaved up · 180 the drop: slammed into the ground, the storm ring
const MF = 210, TURNS = -360 * 8;
const mk = (f, spec, e) => [f / MF, P(spec, AX), e];
const FEET = { footL: [0.24, 0.08, 0.14, 0, 20], footR: [-0.24, 0.08, -0.14, 0, -20] };
const SKY = (e) => ({ spear: pole([0, 1.55, 0.1], 0, 86), chest: [-10, 0, 0], head: [-12, 0, 0], hipsR: [0, 0, 0], ...FEET, ...e });
const HANG = (spin, k = 0) => SKY({ spear: pole([0, 1.7, 0.06], 0, 90), hips: [0, 0.98, 0.02], chest: [-6, 0, 6 * k], footL: [0.14, 0.34 + 0.06 * k, 0.12, -30, 10],
  footR: [-0.16, 0.3 - 0.06 * k, -0.1, 20, -20], spin });
export const MUSOU_FRAMES = MF;
export const MUSOU_CLIPS = {
  mu_alex: clip([
    mk(0, {}),
    mk(24, SKY()),
    mk(30, HANG(0), 'out'),
    ...[1, 2, 3, 4, 5, 6, 7].map((k) => mk(30 + k * 15, HANG(TURNS * k / 8, k % 2 ? 1 : -1), 'lin')),
    mk(150, HANG(TURNS), 'lin'),
    mk(170, { ...OVER, spear: pole([0.02, 1.76, 0.2], 0, 94), hips: [0, 0.97, 0], spin: TURNS, ...FEET }),
    mk(180, { ...DOWN(0.6, -36), chest: [26, 0, 0], hips: [0, 0.7, 0.12], spin: TURNS, ...FEET }, 'snap'),
    mk(198, { ...DOWN(0.6, -34), chest: [22, 0, 0], hips: [0, 0.74, 0.1], spin: TURNS, ...FEET }),
    mk(210, { spin: TURNS }),
  ], false, true),
};
// key art (title, loading card): the open umbrella over his right shoulder like a parasol, the left hand on his hip
const KEYART = { spear: pole([-0.34, 1.5, 0.08], -4, 80), lfree: 1, armL: [10, 0, 38, 95], hipsR: [0, 8, 0], chest: [-2, 10, 0], head: [-4, 6, 0] };
/** Overclock frames the umbrella is open on (render-only, ./model.js). */
export const MUSOU_OPEN = [16, 160];

export const ALEX_CLIPS = { ...LOCO_CLIPS, ...attacks(), ...MUSOU_CLIPS, keyart: clip([[0, P(KEYART, AX)], [1, P(KEYART, AX)]]) };
export { runPose, rollPose };
