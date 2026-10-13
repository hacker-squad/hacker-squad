// Clara — burning-broom moveset (data only; format: src/hero/moves.js header). The fastest of the four: a short-gap
// N-string of swats with the broom's burning bristles, dodge cancels right after the hit, and witchcraft on the
// charges — fire, pumpkins and bats. All timings in 60 Hz sim frames.
// N-string hit onsets 18 sf apart: n1 8 → n2 26 → n3 44 → n4 62 → n5 80 → n6 98.
// Charges: C1 Fire Wheel (a spinning advance, four hits) · C2 Scorch (an overhead chop of flame) · C3 Cauldron Pop (a
// pillar of fire under the ring: launcher) · C4 Dragon Breath (she blows across the bristles: a cone of flame, 4.6 m) ·
// C5 Pumpkin Toss (three pumpkin bombs lobbed down the lane) · C6 Bat Swarm (a long spin inside a cloud of bats, then
// the burst).
import { prepMoves } from '../../hero/moveset.js';

const ONCE = 99;
export const MOVES = {
  n1: { frames: 24, next: 'n2', charge: 'c2', cancel: 18, branch: 12, dodgeCancel: 12, steer: 5, lunge: [[4, 10, 0.3]],
    hits: [{ f: [8, 11], every: ONCE, shape: 'arc', range: 2.0, ang: 130, dir: 10, dmg: 8, kb: 'push', force: 3, hitstop: 2 }] },
  n2: { frames: 24, next: 'n3', charge: 'c3', cancel: 14, branch: 12, dodgeCancel: 12, steer: 5, lunge: [[3, 10, 0.3]],
    hits: [{ f: [8, 11], every: ONCE, shape: 'arc', range: 2.0, ang: 130, dir: -10, dmg: 8, kb: 'push', force: 3, hitstop: 2 }] },
  // N3 rising flick: the bristles dip and flare up through the front rank
  n3: { frames: 30, next: 'n4', charge: 'c4', cancel: 22, branch: 16, dodgeCancel: 16, steer: 5, lunge: [[5, 14, 0.4]],
    hits: [{ f: [12, 15], every: ONCE, shape: 'arc', range: 2.2, ang: 150, dmg: 14, kb: 'blow', force: 6, lift: 2, hitstop: 3 }] },
  // N4 low sweep left → right
  n4: { frames: 26, next: 'n5', charge: 'c5', cancel: 18, branch: 13, dodgeCancel: 13, steer: 5, lunge: [[3, 9, 0.35]],
    hits: [{ f: [8, 11], sweep: -1, shape: 'arc', range: 2.1, ang: 160, dmg: 9, kb: 'flinch', force: 3, hitstop: 2 }] },
  // N5 fire jab: the broom thrust out, a tongue of flame carries down a 3.6 m lane
  n5: { frames: 28, next: 'n6', charge: 'c6', cancel: 18, branch: 13, dodgeCancel: 12, steer: 5, lunge: [[4, 10, 0.5]],
    hits: [{ f: [8, 11], every: ONCE, shape: 'line', len: 3.6, width: 1.3, dmg: 10, kb: 'push', force: 5, hitstop: 2 }] },
  // N6 spin and burst: one turn with the broom out, then it is slammed down in a puff of flame
  n6: { frames: 44, next: 'n1', charge: 'c1', cancel: 34, dodgeCancel: 24, steer: 6, lunge: [[2, 12, 0.8]], armor: true,
    hits: [{ f: [8, 14], every: ONCE, shape: 'circle', range: 2.2, dmg: 10, kb: 'flinch', force: 3, hitstop: 2 },
      { f: [22, 26], every: ONCE, shape: 'circle', range: 2.6, dmg: 18, kb: 'blow', force: 10, lift: 5, hitstop: 5, heavy: true }] },

  // C1 Fire Wheel: three turns forward with the burning broom out, four hits
  c1: { frames: 50, cancel: 44, dodgeCancel: 44, steer: 12, lunge: [[8, 44, 1.6]], armor: true,
    hits: [14, 24, 34, 43].map((f) => ({ f: [f, f + 1], every: ONCE, shape: 'circle', range: 2.2, dmg: 6, kb: 'spin', force: 4, lift: 2, hitstop: 1 })) },
  // C2 (N1 → C) Scorch: the broom up over her hat and down in a sheet of flame
  c2: { frames: 40, cancel: 34, dodgeCancel: 26, steer: 10, lunge: [[6, 14, 0.6]], armor: true,
    hits: [{ f: [14, 18], every: ONCE, shape: 'arc', range: 2.6, ang: 120, dmg: 18, kb: 'blow', force: 9, lift: 4, hitstop: 5, heavy: true }] },
  // C3 (N2 → C) Cauldron Pop: crouch, the bristles ripped up — a pillar of fire under the ring (launcher)
  c3: { frames: 44, cancel: 38, dodgeCancel: 30, steer: 10, lunge: [[4, 12, 0.5]], armor: true,
    hits: [{ f: [12, 15], every: ONCE, shape: 'arc', range: 2.3, ang: 140, dmg: 14, kb: 'launch', force: 2, lift: 10, hitstop: 5, heavy: true }] },
  // C4 (N3 → C) Dragon Breath: she holds the burning bristles to her lips and blows — a cone of flame, the last breath
  // blows the lane away
  c4: { frames: 56, cancel: 48, dodgeCancel: 40, steer: 14, armor: true,
    hits: [{ f: [14, 30], every: 4, shape: 'arc', range: 4.6, ang: 60, dmg: 5, kb: 'flinch', force: 2, hitstop: 1 },
      { f: [34, 37], every: ONCE, shape: 'arc', range: 5.2, ang: 70, dmg: 18, kb: 'blow', force: 11, lift: 3, hitstop: 5, heavy: true }] },
  // C5 (N4 → C) Pumpkin Toss: three pumpkin bombs lobbed ahead, each a little farther; the third one launches
  c5: { frames: 60, cancel: 52, dodgeCancel: 46, steer: 10, armor: true,
    hits: [[20, 1.2], [30, 3.2], [42, 5.2]].map(([f, off], k) => ({ f: [f, f + 2], every: ONCE, shape: 'line', len: 3.2, width: 3.4, off, dmg: k === 2 ? 18 : 12,
      kb: k === 2 ? 'launch' : 'blow', force: k === 2 ? 4 : 7, lift: k === 2 ? 9 : 3, hitstop: k === 2 ? 5 : 2, heavy: k === 2 })) },
  // C6 (N5 → C) Bat Swarm: a long spin inside a cloud of bats that nips the ring, then the broom comes down and they scatter
  c6: { frames: 84, cancel: 76, dodgeCancel: 66, steer: 8, lunge: [[8, 56, 1.4]], armor: true,
    hits: [{ f: [10, 54], shape: 'circle', range: 2.8, dmg: 5, kb: 'flinch', force: 0.8, hitstop: 1, every: 8 },
      { f: [62, 66], every: ONCE, shape: 'circle', range: 3.8, dmg: 26, kb: 'launch', force: 5, lift: 9, hitstop: 7, heavy: true }] },

  // Dash attack: a running double swat
  dash: { frames: 40, cancel: 34, dodgeCancel: 20, steer: 3, lunge: [[0, 16, 3.6, 'lin'], [16, 22, 0.8]],
    hits: [{ f: [10, 13], every: ONCE, shape: 'arc', range: 2.3, ang: 160, dmg: 10, kb: 'flinch', force: 4, hitstop: 2 },
      { f: [16, 19], every: ONCE, shape: 'arc', range: 2.3, ang: 160, dmg: 14, kb: 'blow', force: 8, lift: 3, hitstop: 3 }] },
  // Jump attack: quick swats in the air
  jatk: { frames: 18, air: true, hover: 2.3, next: 'jatk', charge: 'jc', cancel: 10, dodgeCancel: 99, steer: 3,
    hits: [{ f: [4, 7], every: ONCE, shape: 'arc', range: 2.5, ang: 200, dmg: 8, kb: 'flinch', force: 3, hitstop: 1, yMax: 4.5 }] },
  // Jump charge (Broom Dive): she sits the broom at the apex, then rides it down into the ground
  jc: { frames: 50, air: true, hover: 3, landFrame: 32, hang: [6, 26], plunge: [26, -60], cancel: 44, dodgeCancel: 36, steer: 12, armor: true,
    hits: [{ f: [32, 35], every: ONCE, shape: 'circle', range: 3.8, dmg: 18, kb: 'launch', force: 5, lift: 8, hitstop: 6, heavy: true }] },
};

export const AIR_CHAIN_MAX = 12;
/** Pumpkin Toss (render-only, ./view.js): [the frame a pumpkin leaves her hand, the frame it lands, metres ahead]. */
export const TOSSES = [[12, 20, 2.8], [22, 30, 4.8], [34, 42, 6.8]];
prepMoves(MOVES);
