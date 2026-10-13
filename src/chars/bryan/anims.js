// Bryan's clips: attack clips per move id (./moves.js) through the shared clip kit (planted, baked feet), the Overclock clip,
// and the engine's locomotion with his own carry (the sign held up before him as a shield).
// The stop sign is the rig's weapon joint (spear channel: origin = the handle's lower grip, +Z = up the handle to the
// sign, whose two faces look along the joint's ±Y; the sign's centre is 0.62 m from the grip). Held upright (elev ≈ 85°)
// its face looks ahead: a shield. Both hands on the handle (gripR 0, gripL 0.2).
// A channel = [x, y, z (grip, root space), yaw (0 fwd, + left), elev (+ up), roll].
import { P, clip, STANCE } from '../../hero/rig.js';
import { createClipKit } from '../shared/clipkit.js';
import { carry } from '../shared/loco.js';
import { lungeAt } from '../../hero/moveset.js';
import { MOVES } from './moves.js';

const R = Math.PI / 180;
const GRIP = { gripR: 0, gripL: 0.2 };
const HOLD = { spear: [0.36, 0.9, 0.2, 38, 26, 0], ...GRIP };              // at rest: held low out on his left, his face clear of it
export const BY = { ...STANCE, ...HOLD, hipsR: [0, -10, 0], chest: [8, 4, 0], hips: [0, 0.88, 0] };
const ENTRY = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5' };
const { clipF } = createClipKit(MOVES, ENTRY, BY);
const L = (id, f) => lungeAt(MOVES[id], f);
const lead = (id, f, z = 0.2, x = 0.2, yaw = 12) => [x, 0.08, 0.3 + z + L(id, f), 0, yaw];

/** The sign upright before him, face to the enemy, the grip `z` m ahead (a bash when z is large). */
const wall = (z, e) => ({ spear: [0, 1.02, z, 0, 84, 0], chest: [8 + z * 16, 0, 0], hipsR: [0, 0, 0], hips: [0, 0.86, 0.04 + z * 0.12], ...e });
/** The sign swung out like a paddle at heading `yaw` (° off his facing, + = left), its flat leading, body twisted `tw`°. */
const out = (yaw, elev = 8, tw = yaw * 0.4, e) => ({
  spear: [Math.sin(yaw * R) * 0.32, 1.14, 0.06 + Math.cos(yaw * R) * 0.32, yaw, elev, 90],
  chest: [6, tw, 0], hipsR: [0, tw * 0.8, 0], spine: [6, tw * 0.3, 0], ...e });
const OVER = { spear: [0, 1.5, 0.1, 0, 100, 0], chest: [-12, 0, 0], head: [-8, 0, 0], hipsR: [0, 0, 0], hips: [0, 0.92, 0] };
const DOWN = (z = 0.5, elev = -18) => ({ spear: [0, 0.92, z, 0, elev, 0], chest: [24, 0, 0], hips: [0, 0.76, 0.1], hipsR: [0, 0, 0] });
/** STOP: the sign held up high at arm's length, face to the enemy, turned `yaw`° off his facing. */
const SHOW = (yaw = 0, e) => ({ spear: [Math.sin(yaw * R) * 0.3, 1.2, 0.2 + Math.cos(yaw * R) * 0.22, yaw, 86, 0], head: [-4, yaw * 0.5, 0], chest: [2, yaw * 0.4, 0],
  hipsR: [0, yaw * 0.3, 0], hips: [0, 0.9, 0.02], ...e });
const B = {};                                     // = BY (a key with no overrides)

function attacks() {
  const C = {};
  // ---- N1 bash: pull the shield in, drive it out (contact 12)
  C.n1 = clipF('n1', [
    [0, B],
    [7, wall(0.14, { chest: [2, 0, 0], hips: [0, 0.88, -0.04] })],
    [12, wall(0.52, { fL: lead('n1', 12, 0.3, 0.18, 10) }), 'snap'],
    [20, wall(0.48)],
    [32, B],
  ]);
  // ---- N2 swing: heave right, swing right → left (contact 13)
  C.n2 = clipF('n2', [
    [0, B],
    [9, { ...out(-100, 4, -45), spine: [4, -15, 0] }],
    [15, { ...out(60, 8, 30), spin: 20, fR: [-0.22, 0.08, -0.2 + L('n2', 15), 0, -40] }, 'snap'],
    [24, { ...out(100, 6, 45), spin: 30 }],
    [36, B],
  ]);
  // ---- N3 STOP: the sign up (8), thrust at them (10), held
  C.n3 = clipF('n3', [
    [0, B],
    [8, SHOW(0, { fL: lead('n3', 8, 0.15) })],
    [10, SHOW(0, { spear: [0, 1.22, 0.56, 0, 88, 0], chest: [10, 0, 0], hips: [0, 0.88, 0.06] }), 'snap'],
    [18, SHOW(0, { spear: [0, 1.22, 0.5, 0, 86, 0], chest: [8, 0, 0] })],
    [30, B],
  ]);
  // ---- N4 back swing left → right (contact 14)
  C.n4 = clipF('n4', [
    [0, B],
    [9, { ...out(110, 4, 45), hips: [0, 0.86, 0] }],
    [16, { ...out(-60, 8, -30), spin: -20, fL: lead('n4', 16, 0.25) }, 'snap'],
    [26, { ...out(-100, 6, -42), spin: -30 }],
    [38, B],
  ]);
  // ---- N5 ram: two steps behind the shield (contact 13)
  C.n5 = clipF('n5', [
    [0, B],
    [6, wall(0.18, { hips: [0, 0.86, -0.02] })],
    [13, wall(0.56, { fL: lead('n5', 13, 0.35) }), 'snap'],
    [22, wall(0.5)],
    [38, B],
  ]);
  // ---- N6 full spin, the sign at arm's length (contact 16)
  C.n6 = clipF('n6', [
    [0, B],
    [9, { ...out(-100, 4, -40), hips: [0, 0.84, 0] }],
    [16, { ...out(90, 8, 0), spin: 0, hips: [0, 0.8, 0.04] }, 'lin'],
    [24, { ...out(90, 8, 0), spin: -360, hips: [0, 0.78, 0.06] }, 'lin'],
    [36, { ...out(70, 2, 20), spin: -360, hips: [0, 0.76, 0.06], chest: [16, 20, 0] }, 'out'],
    [54, { spin: -360 }],
  ]);
  // ---- C1 Cone Punt: bend to stand the cone (8), wind the sign back like a club (18), bat it away (24)
  C.c1 = clipF('c1', [
    [0, B],
    [8, { spear: [0.34, 0.92, 0.1, 40, 50, 0], chest: [26, 0, 0], head: [10, 0, 0], hips: [0, 0.74, 0.06], hipsR: [0, 0, 0] }],
    [18, { ...out(-120, -8, -55), hips: [0, 0.82, 0], fL: lead('c1', 18, 0.2, 0.24, 15) }],
    [24, { ...out(50, -14, 30), spin: 15, hips: [0, 0.8, 0.06] }, 'snap'],
    [36, { ...out(110, 10, 48), spin: 25, hips: [0, 0.84, 0.05] }],
    [62, B],
  ]);
  // ---- C2 Pop-Up: the sign lifted upright (10), its post stamped on the floor (18)
  const STAMP = (y, e) => ({ spear: [0, y, 0.34, 0, 88, 0], hipsR: [0, 0, 0], ...e });
  C.c2 = clipF('c2', [
    [0, B],
    [10, STAMP(1.4, { chest: [-8, 0, 0], head: [-6, 0, 0], hips: [0, 0.94, 0], fL: lead('c2', 10, 0.25) })],
    [18, STAMP(0.84, { chest: [20, 0, 0], hips: [0, 0.74, 0.06] }), 'snap'],
    [36, STAMP(0.86, { chest: [18, 0, 0], hips: [0, 0.76, 0.06] })],
    [58, B],
  ]);
  // ---- C3 Barricade: both hands on the fence's top rail (16–42: the sign laid over it), the heave (48)
  const shove = (e) => wall(0.46, { chest: [26, 0, 0], head: [8, 0, 0], hips: [0, 0.8, 0.1], ...e });
  C.c3 = clipF('c3', [
    [0, B],
    [10, wall(0.16, { hips: [0, 0.8, -0.04], chest: [14, 0, 0] })],
    [16, shove(), 'snap'],
    [29, shove({ chest: [30, 0, 0] })],
    [42, shove()],
    [48, { spear: [0, 1.46, 0.5, 0, 62, 0], chest: [-12, 0, 0], head: [-8, 0, 0], hips: [0, 0.95, 0.08], hipsR: [0, 0, 0] }, 'snap'],
    [60, { spear: [0, 1.42, 0.46, 0, 66, 0], chest: [-8, 0, 0], hips: [0, 0.93, 0.06], hipsR: [0, 0, 0] }],
    [74, B],
  ]);
  // ---- C4 Detour: a kick out to the left (16), a kick out to the right (26), the third cone batted down the middle (38)
  C.c4 = clipF('c4', [
    [0, B],
    [10, { hipsR: [0, 30, 0], chest: [4, 20, 0], fR: [-0.2, 0.3, -0.25, 30, -20] }],
    [16, { hipsR: [0, 40, 0], chest: [-6, 24, 0], hips: [0, 0.9, -0.04], fR: [0.22, 0.42, 0.6, -30, 30] }, 'snap'],
    [21, { hipsR: [0, 0, 0], chest: [4, 0, 0], fR: [-0.24, 0.08, -0.1, 0, -20] }],
    [26, { hipsR: [0, -40, 0], chest: [-6, -24, 0], hips: [0, 0.9, -0.04], fL: [-0.22, 0.42, 0.6, -30, -30] }, 'snap'],
    [31, { ...out(-120, -8, -50), hips: [0, 0.82, 0], fL: lead('c4', 31, 0.2, 0.24, 15) }],
    [38, { ...out(50, -14, 30), spin: 15, hips: [0, 0.8, 0.06] }, 'snap'],
    [48, { ...out(100, 8, 45), spin: 20 }],
    [62, B],
  ]);
  // ---- C5 Jackhammer: the sign upright, its post pumped into the floor (18–42, a beat every 6), the last one driven home (50)
  const pump = (f) => [[f - 3, STAMP(1.06, { chest: [8, 0, 0], hips: [0, 0.84, 0.04] })], [f, STAMP(0.86, { chest: [18, 0, 0], hips: [0, 0.76, 0.06] }), 'snap']];
  C.c5 = clipF('c5', [
    [0, B],
    [12, STAMP(1.2, { chest: [0, 0, 0], hips: [0, 0.9, 0], fL: lead('c5', 12, 0.1, 0.26, 20) })],
    ...[18, 24, 30, 36, 42].flatMap(pump),
    [47, STAMP(1.5, { chest: [-12, 0, 0], head: [-8, 0, 0], hips: [0, 0.96, 0] })],
    [50, STAMP(0.8, { chest: [26, 0, 0], hips: [0, 0.7, 0.08] }), 'snap'],
    [64, STAMP(0.82, { chest: [22, 0, 0], hips: [0, 0.74, 0.08] })],
    [80, B],
  ]);
  // ---- C6 Cone Scatter: one great turn, the sign low and flat (12–36), heaved overhead (50), brought down (56)
  C.c6 = clipF('c6', [
    [0, B],
    [10, { ...out(-110, -6, -45), hips: [0, 0.8, 0] }],
    [14, { ...out(90, -10, 0), spin: 0, hips: [0, 0.76, 0.04] }, 'lin'],
    [36, { ...out(90, -10, 0), spin: -720, hips: [0, 0.76, 0.04] }, 'lin'],
    [50, { ...OVER, spin: -720 }, 'out'],
    [56, { ...DOWN(0.5, -20), spin: -720 }, 'snap'],
    [74, { ...DOWN(0.5, -20), spin: -720 }],
    [90, { spin: -720 }],
  ]);
  // ---- dash: head down behind the shield
  C.dash = clipF('dash', [
    [0, wall(0.26, { chest: [20, 0, 0], hips: [0, 0.82, 0.06] })],
    [14, wall(0.5, { chest: [26, 0, 0], hips: [0, 0.78, 0.1], fL: lead('dash', 14, 0.35) }), 'snap'],
    [30, wall(0.46, { chest: [22, 0, 0] })],
    [56, B],
  ]);
  // ---- jump attack: the sign swung through the air
  const AIR = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
  C.jatk = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR, ...out(-60, 20, -20) }, BY)],
    [7 / 26, P({ ...out(-110, 14, -40), hips: [0, 0.98, 0], footL: AIR.fL, footR: AIR.fR }, BY), 'out'],
    [11 / 26, P({ ...out(80, -10, 35), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, BY), 'snap'],
    [1, P({ ...out(60, -6, 25), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, BY)],
  ]);
  // ---- jump charge (Pile Driver): the sign overhead at the apex, plunge, flat on the ground
  const Lj = MOVES.jc.landFrame, Fj = MOVES.jc.frames, Dj = MOVES.jc.plunge[0];
  const hang = { ...OVER, hips: [0, 1.0, 0.04], footL: [0.16, 0.5, 0.14, -30, 10], footR: [-0.18, 0.42, -0.12, 20, -20] };
  const slam = { ...DOWN(0.5, -20), hips: [0, 0.62, 0.16], footL: [0.3, 0.08, 0.5, 0, 25], footR: [-0.3, 0.08, -0.3, 0, -50] };
  C.jc = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR }, BY)],
    [5 / Fj, P(hang, BY), 'out'],
    [(Dj - 1) / Fj, P(hang, BY)],
    [(Lj - 1) / Fj, P({ ...hang, spear: [0, 1.2, 0.36, 0, 10, 0], chest: [10, 0, 0] }, BY), 'in'],
    [Lj / Fj, P(slam, BY), 'snap'],
    [(Lj + 8) / Fj, P(slam, BY)],
    [MOVES.jc.cancel / Fj, P({ ...slam, hips: [0, 0.72, 0.1] }, BY), 'io'],
    [1, P({}, BY)],
  ], false, true);
  return C;
}

// ---------------------------------------------------------------- Overclock: ROAD CLOSED (210 frames)
// 0 the sign raised (cut-in) · 32 / 42 / 52 / 62 he shows the sign to the four sides, a fence wall drops on each · 76–148
// the sign held high, waved: the cones rain into the pen · 168 heaved up · 176 slammed flat: the fences fly, the shock ring
const MF = 210;
const mk = (f, spec, e) => [f / MF, P(spec, BY), e];
const FEET = { footL: [0.24, 0.08, 0.14, 0, 20], footR: [-0.24, 0.08, -0.14, 0, -20] };
const side = (k) => SHOW(0, { spear: [0, 1.22, 0.54, 0, 88, 0], hips: [0, 0.86, 0.08], chest: [12, 0, 0], spin: -90 * k, ...FEET });
const wave = (yaw, k) => ({ spear: [Math.sin(yaw * R) * 0.2, 1.52, 0.14, yaw, 96, 0], chest: [-10, yaw * 0.3, 0], head: [-14, 0, 0], hipsR: [0, 0, 0], hips: [0, 0.92 + k, 0],
  spin: -360, ...FEET });
export const MUSOU_FRAMES = MF;
export const MUSOU_CLIPS = {
  mu_bryan: clip([
    mk(0, {}),
    mk(24, SHOW(0, { spear: [0, 1.36, 0.2, 0, 92, 0], chest: [-8, 0, 0], head: [-8, 0, 0], ...FEET })),
    mk(32, side(0), 'snap'), mk(38, side(0)),
    mk(42, side(1), 'snap'), mk(48, side(1)),
    mk(52, side(2), 'snap'), mk(58, side(2)),
    mk(62, side(3), 'snap'), mk(68, side(3)),
    mk(76, wave(0, 0)),
    ...[0, 1, 2, 3, 4, 5].flatMap((k) => [mk(82 + k * 12, wave(-24, 0.02), 'io'), mk(88 + k * 12, wave(24, -0.02), 'io')]),
    mk(160, wave(0, 0)),
    mk(168, { ...OVER, spear: [0, 1.54, 0.12, 0, 104, 0], spin: -360, ...FEET }),
    mk(176, { ...DOWN(0.5, -20), chest: [26, 0, 0], hips: [0, 0.7, 0.12], spin: -360, ...FEET }, 'snap'),
    mk(196, { ...DOWN(0.5, -18), chest: [22, 0, 0], hips: [0, 0.74, 0.1], spin: -360, ...FEET }),
    mk(210, { spin: -360 }),
  ], false, true),
};

// key art (title, loading card): the sign stood upright at his left side like a road worker on duty, the right fist on his hip
const KEYART = { spear: [0.46, 0.98, 0.1, 8, 87, 0], gripL: 0.06, rfree: 1, armR: [10, 0, 38, 95], hipsR: [0, -6, 0], chest: [-2, -8, 0], head: [-4, -4, 0] };

const LOCO = carry({ stance: HOLD, run: { ...HOLD, spear: [0.34, 0.94, 0.16, 36, 36, 0] }, bob: 0.012 });
export const BRYAN_CLIPS = { ...LOCO.clips, ...attacks(), ...MUSOU_CLIPS, keyart: clip([[0, P(KEYART, BY)], [1, P(KEYART, BY)]]) };
export const runPose = LOCO.runPose, rollPose = LOCO.rollPose;
