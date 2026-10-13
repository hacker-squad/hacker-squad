// Ben's clips: attack clips per move id (./moves.js) through the shared clip kit (planted, baked feet), the Overclock clip,
// and the engine's locomotion clips carrying the bow (shared/loco.js). Authoring: P() over BN (his ready stance: the bow
// in the left paw across the body, the boomerang hanging in the right); the bow is the rig's weapon joint (origin = the
// grip, the limbs along ±Z, the arrow flies along local −Y: a vertical bow with elev 90 shoots straight ahead). The right
// arm is FK throughout (rfree 1, armR): it draws the string, lobs the fruit and throws the boomerang.
// pole(centre, yaw, elev, roll) = the bow's grip at `centre`. Contact poses sit on each move's first active frame.
import { P, clip, spearAbout, STANCE } from '../../hero/rig.js';
import { carry } from '../shared/loco.js';
import { createClipKit } from '../shared/clipkit.js';
import { lungeAt } from '../../hero/moveset.js';
import { MOVES } from './moves.js';

const pole = (c, yaw, elev, roll = 0) => spearAbout(c, yaw, elev, roll, 0);
const HANG = [14, 0, 10, 28];                                    // the right arm at his side, the boomerang in the fist
export const BN = { ...STANCE, spear: pole([0.0, 1.0, 0.24], 20, 42), gripL: 0, gripR: 0, rfree: 1, armR: HANG, hipsR: [0, -15, 0], chest: [4, 6, 0] };
const ENTRY = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5' };
const { clipF } = createClipKit(MOVES, ENTRY, BN);
const L = (id, f) => lungeAt(MOVES[id], f);
const lead = (id, f, z = 0.2, x = 0.2, yaw = 12) => [x, 0.08, 0.3 + z + L(id, f), 0, yaw];
const R = Math.PI / 180;
/** The bow swung out to heading `yaw` (° off his facing, + = left), the body twisted `tw`° with it. */
const out = (yaw, elev = -5, tw = yaw * 0.4, extra) => ({
  spear: pole([Math.sin(yaw * R) * 0.3, 1.08, 0.1 + Math.cos(yaw * R) * 0.3], yaw, elev),
  chest: [6, tw, 0], hipsR: [0, tw * 0.8, 0], spine: [6, tw * 0.3, 0], armR: [10 - tw * 0.3, 0, 14, 40], ...extra });
const OVER = { spear: pole([0, 1.6, 0.05], 0, 95), chest: [-10, 0, 0], head: [-8, 0, 0], hipsR: [0, 0, 0], armR: [-120, 0, 30, 30] };
const DOWN = (z = 0.55, elev = -30) => ({ spear: pole([0, 0.95, z], 0, elev), chest: [22, 0, 0], hips: [0, 0.78, 0.1], hipsR: [0, 0, 0], armR: [-40, 0, 20, 20] });
const LOW = { spear: pole([0, 0.72, 0.6], 0, -40), chest: [20, 0, 0], hips: [0, 0.76, 0.06], hipsR: [0, 0, 0], armR: [20, 0, 30, 60] };
const UP = { spear: pole([0, 1.66, 0.45], 0, 70), chest: [-12, 0, 0], head: [-10, 0, 0], hips: [0, 0.95, 0.05], hipsR: [0, 0, 0], armR: [-100, 0, 30, 20] };
/** Aiming: the bow vertical ahead of the chest, the right paw on the string — `draw` 0 (nocked) … 1 (at the cheek). */
const AIM = (draw, extra) => ({ spear: pole([0.08, 1.3, 0.42 - draw * 0.04], 0, 88), chest: [2, -14, 0], hipsR: [0, -20, 0], head: [0, 8, 0],
  armR: draw ? [-50, 0, 80, 150] : [-70, 0, 40, 70], hips: [0, 0.9, 0.02], ...extra });
/** The release: the bow rocks forward, the string hand flies back open. */
const LOOSE = (extra) => ({ ...AIM(1), spear: pole([0.08, 1.3, 0.46], 0, 84), armR: [-30, 0, 95, 60], ...extra });
/** Shooting straight up (Durian Drop): the bow laid back over the head, the arrow line to the sky. */
const SKY = (draw) => ({ spear: pole([0.06, 1.5, 0.2], 0, 176), chest: [-22, 0, 0], head: [-26, 0, 0], hipsR: [0, 0, 0], hips: [0, 0.92, -0.04],
  armR: draw ? [-20, 0, 70, 150] : [-60, 0, 60, 90] });
/** A lob with the free right paw: wound back (k 0) or flung forward (k 1); the bow stays out to his left. */
const TOSS = (k, extra) => ({ spear: pole([0.34, 1.1, 0.06], 30, 70), armR: k ? [-120, 0, 12, 10] : [50, 0, 24, 70],
  chest: [k ? 12 : -6, k ? 24 : -22, 0], hipsR: [0, k ? 14 : -12, 0], hips: [0, k ? 0.84 : 0.88, k ? 0.06 : -0.02], ...extra });
/** The boomerang: wound up across the body (k 0) and slung forward flat (k 1). */
const SLING = (k, extra) => ({ spear: pole([0.3, 1.0, 0.0], 40, 60), armR: k ? [-95, 0, 40, 10] : [20, 0, -20, 110],
  chest: [k ? 8 : -4, k ? 30 : -34, 0], hipsR: [0, k ? 16 : -16, 0], hips: [0, 0.88, k ? 0.06 : 0], ...extra });
const B = {};                                     // = BN (a key with no overrides)

function attacks() {
  const C = {};
  C.n1 = clipF('n1', [[0, B], [5, out(-80, 10, -32)], [9, out(50, 0, 24, { fL: lead('n1', 9, 0.2) }), 'snap'], [15, out(70, -2, 30)], [24, B]]);
  C.n2 = clipF('n2', [[0, B], [5, out(85, 8, 32)], [9, out(-50, 0, -24, { fR: [-0.18, 0.08, 0.05 + L('n2', 9), 0, -20] }), 'snap'], [15, out(-70, -2, -30)], [24, B]]);
  // N3 Boomerang Flick: wound up (6), slung (10), the paw waits open (14–20), catches it (21)
  C.n3 = clipF('n3', [[0, B], [6, SLING(0)], [10, SLING(1, { fL: lead('n3', 10, 0.25) }), 'snap'], [14, SLING(1, { armR: [-80, 0, 50, 30] })],
    [20, SLING(1, { armR: [-80, 0, 50, 30] })], [23, { armR: [-40, 0, 30, 90], chest: [4, 10, 0] }, 'snap'], [34, B]]);
  C.n4 = clipF('n4', [[0, B], [5, out(100, -16, 36, { hips: [0, 0.82, 0] })], [10, out(-70, -18, -30, { hips: [0, 0.8, 0.04], fL: lead('n4', 10, 0.2) }), 'snap'],
    [16, out(-90, -16, -34, { hips: [0, 0.82, 0.03] })], [26, B]]);
  // N5 banana arrow: nocked (4), drawn (8), loosed (9)
  C.n5 = clipF('n5', [[0, B], [4, AIM(0)], [8, AIM(1)], [9, LOOSE({ fL: lead('n5', 9, 0.15) }), 'snap'], [16, LOOSE()], [28, B]]);
  // N6 Monkey Flip: the bow flung up as he hops (8), tucked in the air (12), down on the ring (16)
  C.n6 = clipF('n6', [[0, B], [4, LOW], [8, { ...UP, hips: [0, 1.0, 0.06], fL: lead('n6', 8, 0.2) }, 'snap'],
    [12, { ...OVER, hips: [0, 1.12, 0.1], chest: [30, 0, 0], footL: [0.18, 0.4, 0.2, -40, 10], footR: [-0.18, 0.4, 0.1, -40, -10] }],
    [16, { ...DOWN(0.5, -34), hips: [0, 0.66, 0.14], chest: [34, 0, 0] }, 'snap'], [30, DOWN(0.5, -30)], [44, B]]);
  // C1 Banana Split: a long slow draw (8–19), the release (20), held
  C.c1 = clipF('c1', [[0, B], [8, AIM(0)], [19, AIM(1, { head: [0, 6, 0] })], [20, LOOSE({ fL: lead('c1', 20, 0.1) }), 'snap'], [34, LOOSE()], [50, B]]);
  // C2 Pineapple Grenade: wound back (4), lobbed (8), watching it (14–30)
  C.c2 = clipF('c2', [[0, B], [4, TOSS(0)], [8, TOSS(1, { fL: lead('c2', 8, 0.2) }), 'snap'], [14, TOSS(1, { head: [-10, 0, 0] })], [30, TOSS(1, { head: [-6, 0, 0] })], [48, B]]);
  // C3 Melon Bounce: the melon dropped (6), he springs off it (14): up, then down
  C.c3 = clipF('c3', [[0, B], [6, { ...TOSS(1), armR: [-60, 0, 20, 20], chest: [26, 0, 0], hips: [0, 0.8, 0.08] }], [10, LOW],
    [14, { ...UP, hips: [0, 1.08, 0.05], footL: [0.18, 0.3, 0.2, -30, 10], footR: [-0.18, 0.3, 0.0, -30, -10], fL: lead('c3', 14, 0.25) }, 'snap'],
    [22, { ...UP, hips: [0, 1.0, 0.05] }], [30, DOWN(0.5, -20)], [44, B]]);
  // C4 Boomerang Orbit: slung flat (8), he turns with it (12–44), catches it (46)
  C.c4 = clipF('c4', [[0, B], [5, SLING(0)], [8, SLING(1, { fL: lead('c4', 8, 0.2) }), 'snap'], [12, SLING(1, { armR: [-80, 0, 60, 30] })],
    [44, SLING(1, { armR: [-80, 0, 60, 30], spin: -360 }), 'lin'], [46, { ...out(60, 0, 24), armR: [-40, 0, 30, 90], spin: -360 }, 'snap'], [60, { spin: -360 }]]);
  // C5 Grape Shot: a quick draw (8), then the string hand flicks on every arrow (14–34), the bunch (40)
  const vol = (f, drawn) => [f, drawn ? AIM(1) : LOOSE()];
  C.c5 = clipF('c5', [[0, B], [8, AIM(0)], [13, AIM(1)], [14, LOOSE({ fL: lead('c5', 14, 0.15) }), 'snap'], vol(17, 1), vol(18, 0), vol(21, 1), vol(22, 0), vol(25, 1), vol(26, 0),
    vol(29, 1), vol(30, 0), vol(33, 1), vol(34, 0), [39, AIM(1, { chest: [8, -14, 0] })], [40, LOOSE({ chest: [-4, -14, 0] }), 'snap'], [48, LOOSE()], [58, B]]);
  // C6 Durian Drop: the bow laid back (6), drawn (9), loosed to the sky (10); he looks up (14–36), ducks under the drop (40)
  C.c6 = clipF('c6', [[0, B], [6, SKY(0)], [9, SKY(1)], [10, { ...SKY(0), armR: [-10, 0, 90, 40] }, 'snap'], [16, { ...SKY(0), armR: [-10, 0, 90, 40], head: [-40, 0, 0] }],
    [36, { ...UP, head: [-30, 0, 0] }], [40, { ...LOW, head: [10, 0, 0], armR: [-30, 0, 30, 100], fL: lead('c6', 40, 0.1) }, 'snap'], [60, LOW], [84, B]]);
  // Dash: a cartwheel with the bow out
  C.dash = clipF('dash', [[0, { spear: pole([-0.15, 1.0, 0.3], -20, -20), chest: [12, -10, 0], hips: [0, 0.86, 0.06] }], [6, out(-80, 6, -30)],
    [10, out(50, -2, 24, { hips: [0, 0.96, 0.04] }), 'snap'], [13, out(90, 4, 34, { spin: -180, hips: [0, 1.0, 0.04] })], [16, out(-60, -2, -28, { spin: -360 }), 'snap'],
    [26, out(-80, -2, -32, { spin: -360 })], [40, { spin: -360 }]]);
  const AIR = { footL: [0.16, 0.36, 0.2, -20, 10], footR: [-0.18, 0.3, -0.12, 20, -20], hips: [0, 0.95, 0] };
  C.jatk = clip([[0, P({ ...AIR, ...out(-70, 14, -28) }, BN)], [4 / 18, P({ ...AIR, ...out(60, -8, 28) }, BN), 'snap'], [9 / 18, P({ ...AIR, ...out(-60, -8, -28) }, BN), 'snap'],
    [1, P({ ...AIR, ...out(-70, -6, -30) }, BN)]]);
  // Banana Peel: he flings the peel down (6), dives after it feet first (22), lands crouched (28) and slides, the bow trailing behind
  const Lj = MOVES.jc.landFrame, Fj = MOVES.jc.frames, Dj = MOVES.jc.plunge[0];
  const dive = { ...AIR, ...out(-150, 20, -20), chest: [30, 0, 0], footL: [0.16, 0.2, 0.5, -60, 10], footR: [-0.18, 0.2, 0.4, -60, -10] };
  const slide = { ...out(-160, 10, -24), hips: [0, 0.6, 0.12], chest: [36, 0, 0], armR: [-80, 0, 40, 20], footL: [0.26, 0.08, 0.5, 0, 10], footR: [-0.26, 0.08, 0.1, 0, -10] };
  C.jc = clip([[0, P(AIR, BN)], [6 / Fj, P({ ...AIR, ...TOSS(1), hips: [0, 1.0, 0.02] }, BN), 'out'], [(Dj - 1) / Fj, P(dive, BN)], [(Lj - 1) / Fj, P(dive, BN), 'in'],
    [Lj / Fj, P(slide, BN), 'snap'], [(Lj + 14) / Fj, P(slide, BN)], [MOVES.jc.cancel / Fj, P({ ...slide, hips: [0, 0.74, 0.1] }, BN), 'io'], [1, P({}, BN)]], false, true);
  return C;
}

// ---------------------------------------------------------------- Overclock: GOING APE (220 frames)
// Both arms FK (lfree / rfree 1: the bow and the boomerang are away, the gorilla fights bare-fisted — ./model.js swaps the
// body). 0–24 he beats his chest while he swells · 30–140 the rampage: a ground pound every 16 f (knuckles down, arms up
// between) · 150–176 the chest beat, standing tall · 176 crouch, 180 the leap, 184 the slam · 200–220 up and back in stance
const MF = 220;
const mk = (f, spec, e) => [f / MF, P({ lfree: 1, rfree: 1, ...spec }, BN), e];
const WIDE = { footL: [0.26, 0.08, 0.14, 0, 20], footR: [-0.26, 0.08, -0.14, 0, -20] };
const strideA = { footL: [0.22, 0.08, 0.34, 0, 12], footR: [-0.22, 0.08, -0.3, 0, -12] }, strideB = { footL: [0.22, 0.08, -0.3, 0, 12], footR: [-0.22, 0.08, 0.34, 0, -12] };
const ARMS = (l, r) => ({ armL: l, armR: r || l });
const BEAT_L = ARMS([-70, 0, 20, 140], [-100, 0, 40, 120]), BEAT_R = ARMS([-100, 0, 40, 120], [-70, 0, 20, 140]);
const RAISED = { ...ARMS([-160, 0, 30, 30]), chest: [-10, 0, 0], head: [-10, 0, 0], hips: [0, 0.98, 0], hipsR: [0, 0, 0] };
const POUND = { ...ARMS([-60, 0, 20, 20]), chest: [36, 0, 0], head: [10, 0, 0], hips: [0, 0.72, 0.12], hipsR: [0, 0, 0] };
const TALL = { chest: [-12, 0, 0], head: [-12, 0, 0], hips: [0, 0.98, 0], hipsR: [0, 0, 0], ...WIDE };
export const MUSOU_FRAMES = MF;
export const MUSOU_CLIPS = {
  mu_ben: clip([
    mk(0, { lfree: 0, rfree: 1 }),
    mk(10, { ...ARMS([-150, 0, 60, 20]), chest: [-14, 0, 0], head: [-14, 0, 0], hips: [0, 0.98, 0], hipsR: [0, 0, 0], ...WIDE }),
    mk(16, { ...BEAT_L, chest: [-6, 0, 0], ...WIDE }, 'snap'), mk(20, { ...BEAT_R, chest: [-6, 0, 0], ...WIDE }, 'snap'), mk(24, { ...BEAT_L, chest: [-6, 0, 0], ...WIDE }, 'snap'),
    ...[30, 46, 62, 78, 94, 110, 126].flatMap((p, k) => [mk(p - 8, { ...RAISED, ...(k % 2 ? strideB : strideA) }), mk(p, { ...POUND, ...(k % 2 ? strideB : strideA) }, 'snap'), mk(p + 5, { ...POUND, ...(k % 2 ? strideB : strideA) })]),
    mk(140, { ...RAISED, ...WIDE }),
    ...[150, 158, 166, 174].flatMap((f, k) => [mk(f, { ...(k % 2 ? BEAT_R : BEAT_L), ...TALL }, 'snap'), mk(f + 4, { ...(k % 2 ? BEAT_L : BEAT_R), ...TALL }, 'snap')]),
    mk(177, { ...ARMS([40, 0, 30, 60]), chest: [30, 0, 0], hips: [0, 0.68, 0.06], hipsR: [0, 0, 0], ...WIDE }),
    mk(180, { ...ARMS([-170, 0, 20, 20]), chest: [-10, 0, 0], hips: [0, 1.1, 0.02], hipsR: [0, 0, 0], footL: [0.2, 0.4, 0.12, -40, 10], footR: [-0.2, 0.4, 0.0, -40, -10] }, 'out'),
    mk(184, { ...ARMS([-50, 0, 20, 10]), chest: [40, 0, 0], head: [6, 0, 0], hips: [0, 0.64, 0.14], hipsR: [0, 0, 0], ...WIDE }, 'snap'),
    mk(200, { ...ARMS([-50, 0, 20, 10]), chest: [36, 0, 0], hips: [0, 0.68, 0.12], hipsR: [0, 0, 0], ...WIDE }),
    mk(220, { lfree: 0, rfree: 1 }),
  ], false, true),
};
// key art (title, loading card): the bow raised in the left paw, the boomerang held high in the right
const KEYART = { spear: pole([0.3, 1.5, 0.2], 10, 80), armR: [-150, 0, 30, 20], hipsR: [0, 8, 0], chest: [-4, 10, 0], head: [-6, 8, 0] };

// locomotion: the engine's clips carrying the bow in the left paw, the right arm swinging free
const LOCO = carry({ stance: { spear: BN.spear, gripL: 0, gripR: 0, rfree: 1, armR: HANG }, run: { spear: pole([0.06, 1.0, 0.3], 10, 50), gripL: 0, gripR: 0, rfree: 1, armR: [30, 0, 16, 80] } });
export const BEN_CLIPS = { ...LOCO.clips, ...attacks(), ...MUSOU_CLIPS, keyart: clip([[0, P(KEYART, BN)], [1, P(KEYART, BN)]]) };
export const { runPose, rollPose } = LOCO;
