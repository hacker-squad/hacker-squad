// Ben — banana-bow + boomerang moveset (data only; format: src/hero/moves.js header). A trickster at range: short swats
// with the bow up close, the boomerang out and back, banana arrows down the lane — and a fruit for every charge.
// All timings in 60 Hz sim frames. N-string hit onsets: n1 8 → n2 26 → n3 46 (out) / 56 (back) → n4 72 → n5 91 → n6 117.
// Charges: C1 Banana Split (one arrow that splits into a fan of three, 5.5 m) · C2 Pineapple Grenade (lobbed 3.5 m ahead,
// the burst then the spikes) · C3 Melon Bounce (a watermelon dropped underfoot: launcher) · C4 Boomerang Orbit (it
// circles him for half a second, then comes back hard) · C5 Grape Shot (a volley of grape arrows down a 5 m lane, the
// last one heavy) · C6 Durian Drop (an arrow straight up; the durian comes down 3.2 m ahead, then the stench lingers).
import { prepMoves } from '../../hero/moveset.js';

const ONCE = 99;
export const MOVES = {
  n1: { frames: 24, next: 'n2', charge: 'c2', cancel: 18, branch: 12, dodgeCancel: 12, steer: 5, lunge: [[4, 10, 0.3]],
    hits: [{ f: [8, 11], every: ONCE, shape: 'arc', range: 2.0, ang: 130, dir: 10, dmg: 8, kb: 'push', force: 3, hitstop: 2 }] },
  n2: { frames: 24, next: 'n3', charge: 'c3', cancel: 18, branch: 12, dodgeCancel: 12, steer: 5, lunge: [[3, 10, 0.3]],
    hits: [{ f: [8, 11], every: ONCE, shape: 'arc', range: 2.0, ang: 130, dir: -10, dmg: 8, kb: 'push', force: 3, hitstop: 2 }] },
  // N3 Boomerang Flick: thrown down a 3.6 m lane, it cuts on the way out and again on the way back
  n3: { frames: 34, next: 'n4', charge: 'c4', cancel: 26, branch: 22, dodgeCancel: 22, steer: 6, lunge: [[2, 8, 0.2]],
    hits: [{ f: [10, 11], every: ONCE, shape: 'line', len: 3.6, width: 1.3, dmg: 7, kb: 'flinch', force: 3, hitstop: 2 },
      { f: [20, 21], every: ONCE, shape: 'line', len: 3.6, width: 1.3, dmg: 7, kb: 'flinch', force: 3, hitstop: 2 }] },
  // N4 low sweep left → right with the bow
  n4: { frames: 26, next: 'n5', charge: 'c5', cancel: 18, branch: 13, dodgeCancel: 13, steer: 5, lunge: [[3, 9, 0.35]],
    hits: [{ f: [8, 11], sweep: -1, shape: 'arc', range: 2.1, ang: 160, dmg: 9, kb: 'flinch', force: 3, hitstop: 2 }] },
  // N5 banana arrow: drawn and loosed point-blank down a 4.2 m lane
  n5: { frames: 28, next: 'n6', charge: 'c6', cancel: 18, branch: 13, dodgeCancel: 12, steer: 6,
    hits: [{ f: [9, 10], every: ONCE, shape: 'line', len: 4.2, width: 1.0, dmg: 10, kb: 'push', force: 5, hitstop: 2 }] },
  // N6 Monkey Flip: the bow swung up as he hops, then he comes down on the ring with both feet and the bow
  n6: { frames: 44, next: 'n1', charge: 'c1', cancel: 34, dodgeCancel: 26, steer: 6, lunge: [[4, 16, 1.4]], armor: true,
    hits: [{ f: [8, 10], every: ONCE, shape: 'arc', range: 2.2, ang: 140, dmg: 8, kb: 'flinch', force: 3, hitstop: 2 },
      { f: [16, 19], every: ONCE, shape: 'circle', range: 2.4, dmg: 18, kb: 'blow', force: 10, lift: 5, hitstop: 5, heavy: true }] },

  // C1 Banana Split: a long draw, one arrow that splits into a fan of three 5.5 m down the lane
  c1: { frames: 50, cancel: 44, dodgeCancel: 24, steer: 16, armor: true,
    hits: [{ f: [20, 21], every: ONCE, shape: 'arc', range: 5.5, ang: 64, dmg: 14, kb: 'blow', force: 9, lift: 3, hitstop: 4, heavy: true }] },
  // C2 (N1 → C) Pineapple Grenade: lobbed 3.5 m ahead; the burst, then the spikes
  c2: { frames: 48, cancel: 42, dodgeCancel: 32, steer: 10, armor: true,
    hits: [{ f: [22, 23], every: ONCE, shape: 'line', len: 3.0, width: 3.0, off: 2.0, dmg: 20, kb: 'blow', force: 10, lift: 5, hitstop: 5, heavy: true },
      { f: [28, 29], every: ONCE, shape: 'line', len: 4.0, width: 4.0, off: 1.5, dmg: 6, kb: 'flinch', force: 3, hitstop: 1 }] },
  // C3 (N2 → C) Melon Bounce: a watermelon dropped under the ring — it bounces, and so does everyone round it (launcher)
  c3: { frames: 44, cancel: 38, dodgeCancel: 30, steer: 10, lunge: [[4, 12, 0.4]], armor: true,
    hits: [{ f: [14, 17], every: ONCE, shape: 'circle', range: 2.4, dmg: 14, kb: 'launch', force: 2, lift: 10, hitstop: 5, heavy: true }] },
  // C4 (N3 → C) Boomerang Orbit: it circles him at 3.4 m nicking the ring, then comes home through everything in front
  c4: { frames: 60, cancel: 54, dodgeCancel: 48, steer: 10, lunge: [[6, 40, 1.0]], armor: true,
    hits: [{ f: [12, 36], every: 6, shape: 'circle', range: 3.4, dmg: 5, kb: 'spin', force: 3, lift: 1, hitstop: 1 },
      { f: [44, 45], every: ONCE, shape: 'arc', range: 3.2, ang: 180, dmg: 16, kb: 'blow', force: 9, lift: 4, hitstop: 5, heavy: true }] },
  // C5 (N4 → C) Grape Shot: six grape arrows down a 5 m lane, then the whole bunch
  c5: { frames: 58, cancel: 52, dodgeCancel: 44, steer: 14, armor: true,
    hits: [{ f: [14, 34], every: 4, shape: 'line', len: 5.0, width: 1.4, dmg: 5, kb: 'flinch', force: 2, hitstop: 1 },
      { f: [40, 41], every: ONCE, shape: 'line', len: 5.6, width: 1.8, dmg: 16, kb: 'blow', force: 10, lift: 4, hitstop: 5, heavy: true }] },
  // C6 (N5 → C) Durian Drop: an arrow straight up; the durian lands 3.2 m ahead (launcher), and the stench hangs there
  c6: { frames: 84, cancel: 76, dodgeCancel: 72, steer: 8, armor: true,
    hits: [{ f: [40, 41], every: ONCE, shape: 'line', len: 4.0, width: 4.0, off: 1.2, dmg: 28, kb: 'launch', force: 5, lift: 9, hitstop: 7, heavy: true },
      { f: [48, 72], every: 8, shape: 'line', len: 4.4, width: 4.4, off: 1.0, dmg: 4, kb: 'flinch', force: 1, hitstop: 0 }] },

  // Dash attack: a cartwheel with the bow out
  dash: { frames: 40, cancel: 34, dodgeCancel: 20, steer: 3, lunge: [[0, 16, 3.6, 'lin'], [16, 22, 0.8]],
    hits: [{ f: [10, 13], every: ONCE, shape: 'arc', range: 2.3, ang: 160, dmg: 10, kb: 'flinch', force: 4, hitstop: 2 },
      { f: [16, 19], every: ONCE, shape: 'arc', range: 2.3, ang: 160, dmg: 14, kb: 'blow', force: 8, lift: 3, hitstop: 3 }] },
  // Jump attack: a swat in the air
  jatk: { frames: 18, air: true, hover: 2.3, next: 'jatk', charge: 'jc', cancel: 10, dodgeCancel: 99, steer: 3,
    hits: [{ f: [4, 7], every: ONCE, shape: 'arc', range: 2.5, ang: 200, dmg: 8, kb: 'flinch', force: 3, hitstop: 1, yMax: 4.5 }] },
  // Jump charge (Banana Peel): he drops a peel, dives after it, lands on it and slides 2.2 m through the ring
  jc: { frames: 52, air: true, hover: 3, landFrame: 28, hang: [6, 22], plunge: [22, -60], cancel: 46, dodgeCancel: 40, steer: 12, armor: true,
    lunge: [[28, 42, 2.2, 'lin']],
    hits: [{ f: [28, 30], every: ONCE, shape: 'circle', range: 2.6, dmg: 16, kb: 'launch', force: 4, lift: 8, hitstop: 6, heavy: true },
      { f: [32, 42], every: 3, shape: 'line', len: 2.0, width: 1.6, dmg: 5, kb: 'push', force: 6, hitstop: 1 }] },
};

export const AIR_CHAIN_MAX = 12;
// ---- render-side tables (./view.js, ./model.js): where the fruit flies, in move frames
/** The boomerang's flights: move → [leaves the hand, farthest / orbit end, back in the hand, metres out]. */
export const FLIGHTS = { n3: [4, 11, 21, 3.6], c4: [8, 44, 46, 3.4] };
/** Is the boomerang in the air on frame f of move id (the hand model hides it, the view flies it)? */
export const boomerangOut = (id, f) => { const F = FLIGHTS[id]; return !!F && f >= F[0] && f < F[2]; };
/** Lobbed fruit: move → [the frame it leaves his hand, the frame it lands, metres ahead, arc height (m)]. */
export const LOBS = { c2: [8, 22, 3.5, 2.6], c3: [6, 14, 1.2, 1.4] };
/** Arrows: move → [[frame, metres, yaw offset (°), kind]] — kind: banana | grape | bunch | up. */
export const SHOTS = {
  n5: [[9, 4.2, 0, 'banana']],
  c1: [[20, 5.5, -26, 'banana'], [20, 5.5, 0, 'banana'], [20, 5.5, 26, 'banana']],
  c5: [...[14, 18, 22, 26, 30, 34].map((f) => [f, 5.0, 0, 'grape']), [40, 5.6, 0, 'bunch']],
  c6: [[10, 0, 0, 'up']],
};
/** Durian Drop: [the arrow goes up, the durian lands, metres ahead, the height it falls from]. */
export const DURIAN = [10, 40, 3.2, 11];
prepMoves(MOVES);
