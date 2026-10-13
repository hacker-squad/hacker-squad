// Bryan — stop-sign shield moveset (data only; format: src/hero/moves.js header). Heavy: slow wind-ups, wide arcs, hard
// hits; the sign is a shield he bashes, swings and slams with — and he is road crew: his charges put traffic cones and
// roadworks fences on the floor. All timings in 60 Hz sim frames.
// N-string hit onsets: n1 12 → n2 37 → n3 59 (the STOP) → n4 83 → n5 107 → n6 134.
// Charges: C1 Cone Punt (a cone batted 9 m down the lane) · C2 Pop-Up (a cone springs up under the front rank: launcher)
// · C3 Barricade (a fence shoved 3.6 m through the ranks, then heaved over) · C4 Detour (three cones in a fan) ·
// C5 Jackhammer (the post hammered into the floor, then the floor gives) · C6 Cone Scatter (rings of cones skid out,
// then the slam). The cones and fences are drawn by ./view.js from the frames in PROPS below.
import { prepMoves } from '../../hero/moveset.js';

const ONCE = 99;
export const MOVES = {
  // N1 bash: both arms drive the sign's face straight into the front rank
  n1: { frames: 32, next: 'n2', charge: 'c2', cancel: 24, branch: 17, dodgeCancel: 16, steer: 5, lunge: [[4, 13, 0.5]],
    hits: [{ f: [12, 15], every: ONCE, shape: 'line', len: 2.6, width: 1.5, dmg: 16, kb: 'push', force: 6, hitstop: 3 }] },
  // N2 swing: the sign heaved round right → left
  n2: { frames: 36, next: 'n3', charge: 'c3', cancel: 25, branch: 20, dodgeCancel: 19, steer: 4, lunge: [[6, 14, 0.35]],
    hits: [{ f: [13, 18], sweep: 1, shape: 'arc', range: 2.7, ang: 190, dmg: 18, kb: 'blow', force: 8, lift: 2, hitstop: 3 }] },
  // N3 STOP: the sign thrust up in their faces, one red flash down the lane — light damage, everyone in it staggers
  n3: { frames: 30, next: 'n4', charge: 'c4', cancel: 22, branch: 14, dodgeCancel: 14, steer: 6,
    hits: [{ f: [10, 12], every: ONCE, shape: 'arc', range: 3.8, ang: 100, dmg: 8, kb: 'flinch', force: 2, hitstop: 2 }] },
  // N4 back swing left → right
  n4: { frames: 38, next: 'n5', charge: 'c5', cancel: 26, branch: 20, dodgeCancel: 20, steer: 5, lunge: [[4, 13, 0.4]],
    hits: [{ f: [14, 19], sweep: -1, shape: 'arc', range: 2.7, ang: 200, dir: -10, dmg: 18, kb: 'blow', force: 8, lift: 3, hitstop: 3 }] },
  // N5 ram: two steps behind the shield
  n5: { frames: 38, next: 'n6', charge: 'c6', cancel: 24, branch: 19, dodgeCancel: 19, steer: 5, lunge: [[3, 14, 0.9]],
    hits: [{ f: [13, 17], every: ONCE, shape: 'line', len: 3.2, width: 1.6, dmg: 18, kb: 'push', force: 7, lift: 1, hitstop: 4 }] },
  // N6 full spin: one planted turn, the sign at arm's length
  n6: { frames: 54, next: 'n1', charge: 'c1', cancel: 44, dodgeCancel: 24, steer: 6, lunge: [[2, 12, 0.6]], armor: true,
    hits: [{ f: [16, 22], sweep: -1, dir: -180, shape: 'circle', range: 3.0, dmg: 30, kb: 'blow', force: 13, lift: 6, hitstop: 7, heavy: true }] },

  // C1 Cone Punt: a cone stood on the floor and batted down the lane with the sign — it skids 9 m through the ranks
  c1: { frames: 62, cancel: 54, dodgeCancel: 40, steer: 14, armor: true,
    hits: [{ f: [24, 25], every: ONCE, shape: 'line', len: 3.0, width: 1.9, off: 0.6, dmg: 14, kb: 'push', force: 7, lift: 1, hitstop: 3 },
      { f: [28, 29], every: ONCE, shape: 'line', len: 3.0, width: 1.9, off: 3.4, dmg: 14, kb: 'push', force: 7, lift: 1, hitstop: 0 },
      { f: [32, 33], every: ONCE, shape: 'line', len: 3.4, width: 2.6, off: 6.2, dmg: 22, kb: 'blow', force: 12, lift: 5, hitstop: 0, heavy: true }] },
  // C2 (N1 → C) Pop-Up: the sign's post stamped on the floor — a cone springs up under the front rank (launcher)
  c2: { frames: 58, cancel: 50, dodgeCancel: 40, steer: 10, lunge: [[4, 13, 0.4]], armor: true,
    hits: [{ f: [18, 21], every: ONCE, shape: 'line', len: 2.6, width: 2.6, off: 0.5, dmg: 20, kb: 'launch', force: 2, lift: 10, hitstop: 6, heavy: true }] },
  // C3 (N2 → C) Barricade: a roadworks fence dropped across the lane and shoved 3.6 m through the ranks, then heaved over
  c3: { frames: 74, cancel: 66, dodgeCancel: 56, steer: 12, lunge: [[16, 42, 3.6, 'lin']], armor: true,
    hits: [{ f: [16, 42], every: 6, shape: 'line', len: 1.9, width: 4.4, off: 0.4, dmg: 7, kb: 'push', force: 7, lift: 1, hitstop: 1 },
      { f: [48, 51], every: ONCE, shape: 'line', len: 3.6, width: 4.6, off: 0.4, dmg: 22, kb: 'blow', force: 12, lift: 5, hitstop: 6, heavy: true }] },
  // C4 (N3 → C) Detour: three cones sent out in a fan — one kicked left, one kicked right, the last batted down the middle
  c4: { frames: 62, cancel: 54, dodgeCancel: 44, steer: 14, armor: true,
    hits: [{ f: [16, 17], every: ONCE, shape: 'arc', range: 6, ang: 34, dir: 36, dmg: 13, kb: 'blow', force: 8, lift: 3, hitstop: 2 },
      { f: [26, 27], every: ONCE, shape: 'arc', range: 6, ang: 34, dir: -36, dmg: 13, kb: 'blow', force: 8, lift: 3, hitstop: 2 },
      { f: [38, 40], every: ONCE, shape: 'arc', range: 6.5, ang: 40, dmg: 20, kb: 'blow', force: 12, lift: 4, hitstop: 5, heavy: true }] },
  // C5 (N4 → C) Jackhammer: the sign's post driven into the floor again and again — the ring rattles, then the floor gives
  c5: { frames: 80, cancel: 72, dodgeCancel: 58, steer: 14, armor: true,
    hits: [{ f: [18, 42], every: 6, shape: 'circle', range: 3.2, dmg: 5, kb: 'flinch', force: 1, hitstop: 1 },
      { f: [50, 53], every: ONCE, shape: 'circle', range: 4.6, dmg: 26, kb: 'launch', force: 4, lift: 9, hitstop: 7, heavy: true }] },
  // C6 (N5 → C) Cone Scatter: one great turn with the sign flat sends a ring of cones skidding out, wider and wider; then
  // the sign comes down on whoever is left
  c6: { frames: 90, cancel: 82, dodgeCancel: 66, steer: 8, armor: true,
    hits: [{ f: [20, 21], every: ONCE, shape: 'circle', range: 3.0, dmg: 12, kb: 'push', force: 5, hitstop: 4 },
      { f: [28, 29], every: ONCE, shape: 'circle', range: 4.6, dmg: 9, kb: 'push', force: 6, hitstop: 0 },
      { f: [36, 37], every: ONCE, shape: 'circle', range: 6.2, dmg: 9, kb: 'push', force: 6, hitstop: 0 },
      { f: [56, 60], every: ONCE, shape: 'circle', range: 4.4, dmg: 28, kb: 'blow', force: 15, lift: 6, hitstop: 8, heavy: true }] },

  // Dash attack: a running ram
  dash: { frames: 56, cancel: 48, dodgeCancel: 30, steer: 3, lunge: [[0, 22, 4.8, 'lin'], [22, 32, 1.2]],
    hits: [{ f: [14, 24], every: 5, shape: 'line', len: 2.6, width: 1.8, dmg: 12, kb: 'blow', force: 10, lift: 3, hitstop: 3, heavy: true }] },
  // Jump attack: the sign swung through the air
  jatk: { frames: 26, air: true, hover: 2.4, next: 'jatk', charge: 'jc', cancel: 13, dodgeCancel: 99, steer: 3,
    hits: [{ f: [7, 11], every: ONCE, shape: 'arc', range: 3.0, ang: 200, dmg: 13, kb: 'flinch', force: 3, hitstop: 2, yMax: 4.5 }] },
  // Jump charge (Pile Driver): the sign overhead at the apex, he comes down on it flat
  jc: { frames: 58, air: true, hover: 3, landFrame: 36, hang: [6, 30], plunge: [30, -60], cancel: 52, dodgeCancel: 42, steer: 12, armor: true,
    hits: [{ f: [36, 39], every: ONCE, shape: 'circle', range: 4.4, dmg: 24, kb: 'launch', force: 5, lift: 8, hitstop: 7, heavy: true }] },
};

export const AIR_CHAIN_MAX = 6;
/** Prop cues (render-only, ./view.js), move frames: when the cone / fence of each charge appears, leaves and lands. */
export const PROPS = {
  c1: { set: 8, hit: 24, land: 35, len: 9.6 },
  c2: { pop: 18, at: 1.7 },
  c3: { drop: 8, push: [16, 42], heave: 48, at: 1.25 },
  c4: { kicks: [[16, 36], [26, -36], [38, 0]], flight: 10, len: 6 },
  c5: { ticks: [18, 42, 6], burst: 50 },
  c6: { out: 20, flight: 17, len: 6.2, n: 8, slam: 56 },
};
prepMoves(MOVES);
