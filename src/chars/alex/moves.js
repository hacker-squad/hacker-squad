// Alex — umbrella moveset (data only; format: src/hero/moves.js header). Mid-heavy: the furled umbrella reaches far and
// sweeps wide like a staff, and when it opens it throws wind and rain at range. All timings in 60 Hz sim frames.
// N-string hit onsets 22–26 sf apart (onset spacing = cancel_k + tell_k+1 − tell_k): n1 11 → n2 35 → n3 59 → n4 83 → n5 107
// → n6 131. Charges: C1 Gale (the umbrella snaps open: a wide fan of wind, 4.8 m, the last gust blows the rank away) ·
// C2 hook launcher · C3 wide 270° sweep · C4 Cloudburst (a cloud called down on a spot 5 m ahead: rain, then the
// lightning) · C5 Thunder Drop (overhead smash + shockwave) · C6 Twister (he travels 4 m as a whirlwind under the open
// umbrella, whirling the ranks off their feet, then throws them up).
import { prepMoves } from '../../hero/moveset.js';

const ONCE = 99;
export const MOVES = {
  // N1 jab: step in, both hands drive the ferrule straight out
  n1: { frames: 30, next: 'n2', charge: 'c2', cancel: 23, branch: 16, dodgeCancel: 15, steer: 5, lunge: [[4, 12, 0.5]],
    hits: [{ f: [11, 14], every: ONCE, shape: 'line', len: 2.6, width: 1.1, dmg: 14, kb: 'push', force: 5, hitstop: 3 }] },
  // N2 wide sweep: the umbrella swings right → left at waist height
  n2: { frames: 34, next: 'n3', charge: 'c3', cancel: 24, branch: 19, dodgeCancel: 18, steer: 4, lunge: [[6, 14, 0.35]],
    hits: [{ f: [12, 17], sweep: 1, shape: 'arc', range: 2.5, ang: 200, dmg: 16, kb: 'blow', force: 7, lift: 2, hitstop: 3 }] },
  // N3 rising flick: the tip dips low in front and flicks up through the front rank
  n3: { frames: 32, next: 'n4', charge: 'c4', cancel: 24, branch: 17, dodgeCancel: 16, steer: 5, lunge: [[6, 12, 0.4]],
    hits: [{ f: [12, 15], every: ONCE, shape: 'arc', range: 2.2, ang: 120, dmg: 16, kb: 'push', force: 5, lift: 3, hitstop: 3 }] },
  // N4 overhead chop: umbrella up over the head, down two-handed in front
  n4: { frames: 36, next: 'n5', charge: 'c5', cancel: 24, branch: 18, dodgeCancel: 18, steer: 6, lunge: [[4, 12, 0.45]],
    hits: [{ f: [13, 16], every: ONCE, shape: 'arc', range: 2.6, ang: 100, dmg: 18, kb: 'push', force: 6, hitstop: 4 }] },
  // N5 backhand sweep left → right
  n5: { frames: 38, next: 'n6', charge: 'c6', cancel: 23, branch: 20, dodgeCancel: 20, steer: 4, lunge: [[4, 12, 0.4]],
    hits: [{ f: [14, 19], sweep: -1, shape: 'arc', range: 2.6, ang: 220, dir: -20, dmg: 17, kb: 'blow', force: 8, lift: 3, hitstop: 3 }] },
  // N6 full spin: one planted 360° turn, the umbrella at arm's length, low finish held
  n6: { frames: 50, next: 'n1', charge: 'c1', cancel: 40, dodgeCancel: 22, steer: 6, lunge: [[2, 12, 0.7]], armor: true,
    hits: [{ f: [14, 20], sweep: -1, dir: -180, shape: 'circle', range: 2.8, dmg: 26, kb: 'blow', force: 12, lift: 6, hitstop: 7, heavy: true }] },

  // C1 Gale: braces, the umbrella snaps open into the wind — a wide fan of gusts rattles the ranks, the last one blows them
  // right off the floor
  c1: { frames: 66, cancel: 58, dodgeCancel: 52, steer: 14, armor: true,
    hits: [{ f: [20, 44], every: 8, shape: 'arc', range: 4.8, ang: 120, dmg: 5, kb: 'flinch', force: 3, hitstop: 1 },
      { f: [48, 51], every: ONCE, shape: 'arc', range: 5.2, ang: 130, dmg: 20, kb: 'blow', force: 16, lift: 5, hitstop: 6, heavy: true }] },
  // C2 (N1 → C) hook launcher: crouch, the tip low, rip it straight up under the ring
  c2: { frames: 60, cancel: 52, dodgeCancel: 42, steer: 10, lunge: [[4, 12, 0.5]], armor: true,
    hits: [{ f: [15, 18], every: ONCE, shape: 'arc', range: 2.8, ang: 120, dmg: 18, kb: 'launch', force: 2, lift: 10, hitstop: 6, heavy: true }] },
  // C3 (N2 → C) wide 270° sweep: chambered far right, the umbrella sweeps round the front and the left flank
  c3: { frames: 66, cancel: 58, dodgeCancel: 46, steer: 12, lunge: [[10, 20, 0.6]], armor: true,
    hits: [{ f: [18, 28], sweep: 1, sweepN: 8, shape: 'arc', range: 3.4, ang: 270, dmg: 22, kb: 'blow', force: 10, lift: 4, hitstop: 5, heavy: true }] },
  // C4 (N3 → C) Cloudburst: the umbrella pointed at the roof — a cloud bursts over a spot 5 m ahead and hammers it with
  // rain, then the lightning comes down
  c4: { frames: 66, cancel: 58, dodgeCancel: 50, steer: 12, armor: true,
    hits: [{ f: [18, 42], every: 6, shape: 'line', len: 4.6, width: 4.6, off: 2.8, dmg: 6, kb: 'flinch', force: 1, hitstop: 1 },
      { f: [46, 48], every: ONCE, shape: 'line', len: 5, width: 5, off: 2.6, dmg: 24, kb: 'launch', force: 3, lift: 9, hitstop: 5, heavy: true }] },
  // C5 (N4 → C) Thunder Drop: raised high, brought down two-handed; a shockwave ring bursts out of the impact
  c5: { frames: 76, cancel: 68, dodgeCancel: 54, steer: 14, lunge: [[4, 14, 0.5]], armor: true,
    hits: [{ f: [24, 27], every: ONCE, shape: 'arc', range: 2.8, ang: 90, dmg: 18, kb: 'push', force: 6, hitstop: 4 },
      { f: [36, 39], every: ONCE, shape: 'circle', range: 4.6, dmg: 26, kb: 'blow', force: 13, lift: 6, hitstop: 7, heavy: true }] },
  // C6 (N5 → C) Twister: three turns under the open umbrella carry him 4 m through the ranks, whirling them off their
  // feet; the last heave throws everything round him into the air
  c6: { frames: 92, cancel: 84, dodgeCancel: 72, steer: 8, lunge: [[10, 54, 4.0, 'lin']], armor: true,
    hits: [{ f: [12, 52], shape: 'circle', range: 3.0, dmg: 5, kb: 'spin', force: 3, lift: 2, hitstop: 0, every: 8 },
      { f: [60, 64], every: ONCE, shape: 'circle', range: 4.2, dmg: 26, kb: 'launch', force: 4, lift: 10, hitstop: 8, heavy: true }] },

  // Dash attack (run + attack): running low sweep, a step of drift after it
  dash: { frames: 56, cancel: 48, dodgeCancel: 28, steer: 3, lunge: [[0, 22, 4.6, 'lin'], [22, 32, 1.2]],
    hits: [{ f: [18, 24], sweep: 1, shape: 'arc', range: 3.0, ang: 200, dmg: 18, kb: 'blow', force: 10, lift: 3, hitstop: 4, heavy: true }] },
  // Jump attack: a swipe every 12 sf while hovering
  jatk: { frames: 24, air: true, hover: 2.4, next: 'jatk', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
    hits: [{ f: [6, 10], every: ONCE, shape: 'arc', range: 3.2, ang: 200, dmg: 12, kb: 'flinch', force: 3, hitstop: 2, yMax: 4.5 }] },
  // Jump charge (Parasol Drop): hangs under the open umbrella at the apex, folds it, plunges, slams the ground
  jc: { frames: 56, air: true, hover: 3, landFrame: 36, hang: [6, 30], plunge: [30, -60], cancel: 50, dodgeCancel: 40, steer: 12, armor: true,
    hits: [{ f: [36, 39], every: ONCE, shape: 'circle', range: 4.2, dmg: 22, kb: 'launch', force: 5, lift: 8, hitstop: 7, heavy: true }] },
};

export const AIR_CHAIN_MAX = 8;
/** Moves the umbrella opens on (render-only, ./model.js): [first frame, last frame] it is open. */
export const OPEN_MOVES = { c1: [16, 58], c6: [10, 54], jc: [4, 29] };
/** Cloudburst (render-only, ./view.js): metres ahead of him the cloud bursts, its radius. */
export const CLOUD = { at: 5.1, r: 2.4 };
prepMoves(MOVES);
