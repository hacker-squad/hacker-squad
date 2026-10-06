// Clara's Overclock WITCHING HOUR (sim; interface of src/musou/musou.js). Timeline (Overclock frames t, 220 = control returns;
// hitstop pauses it):
//   0   activation: the world holds still, she raises the broom over her hat (cut-in, 22 f)
//   30–100  the bats: she turns twice and a swarm pours out of the broom — a circle growing 3 → 6.5 m, a nip every 8 f
//           (spin reaction)
//   120 / 136 / 152  three pumpkin bombs land ahead of her (BOMBS, in her facing frame at the start): 3.4 m blasts
//   180 FINISHER: the broom comes down and the Great Pumpkin lands on the spot — a ring of fire blasts out to 8 m
import { emit } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { offSun, smooth, endMusou, gauge } from '../../musou/musou.js';
import { MUSOU_FRAMES } from './anims.js';
import * as dm from '../../core/dmath.js';

/** Where the pumpkins land: [metres to her left, metres ahead]. */
export const BOMBS = [[0, 4.2], [2.8, 5.6], [-2.8, 5.6]];
export const CLARA_MUSOU = {
  activation: 22, bats: [30, 100], batsEvery: 8, batR: [3, 6.5], bombs: [120, 136, 152], bombFlight: 12, bombR: 3.4, finisher: 180, end: MUSOU_FRAMES, cost: 1 / 3,
  batHit: { shape: 'circle', dmg: 7, kb: 'spin', force: 4, lift: 2, hitstop: 0, yMax: 5 },
  bombHit: { shape: 'circle', range: 3.4, dmg: 24, kb: 'blow', force: 11, lift: 6, hitstop: 3, heavy: true },
  waveR: 8, waveFrames: 14,
  waveHit: { shape: 'circle', range: 0, dmg: 44, kb: 'launch', force: 6, lift: 9, hitstop: 0, heavy: true, yMax: 5 },
};

export function createMusou(game) {
  const M = CLARA_MUSOU;
  const mu = { active: false, t: 0, wasReady: false, seq: 0, ax: 0, az: 0, yaw0: 0, waveR: 0, batR: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; mu.batR = 0; };
  /** Bomb k's landing point in the world (render side too: ./view.js). */
  mu.bomb = (k) => { const [x, z] = BOMBS[k], c = dm.cos(mu.yaw0), s = dm.sin(mu.yaw0); return [mu.ax + x * c + z * s, mu.az - x * s + z * c]; };

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = dm.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.batR = 0; mu.seq++;
    mu.yaw0 = h.yaw; mu.ax = h.x; mu.az = h.z;
    mu.m0 = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'mu_clara'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    emit('musou:start', { x: h.x, z: h.z, activation: M.activation, burstAt: M.finisher, contact: M.bats[0] });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');

  mu.stepHero = () => {
    const h = game.hero, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musouClip = 'mu_clara'; h.musouT = t / M.end;
    h.musou = Math.max(0, mu.m0 - h.musouMax * M.cost * Math.min(1, t / M.bats[0]));
    if (t < M.activation) { game.freeze = Math.max(game.freeze, 2); return; }
    const [b0, b1] = M.bats;                                         // the bats: a growing circle of nips
    mu.batR = t >= b0 && t <= b1 + 10 ? M.batR[0] + (M.batR[1] - M.batR[0]) * Math.min(1, (t - b0) / (b1 - b0)) : 0;
    if (t >= b0 && t <= b1 && (t - b0) % M.batsEvery === 0) {
      const k = (t - b0) / M.batsEvery, n = hitAt({ ...M.batHit, range: mu.batR }, h.x, h.z, h.yaw, -2100 - k, false);
      if (n) { const a = k * 1.9; emit('musou:hit', { x: h.x + dm.sin(a) * mu.batR * 0.7, y: 1.4, z: h.z + dm.cos(a) * mu.batR * 0.7, stage: 'rush', yaw: a, n: k }); }
    }
    M.bombs.forEach((f, j) => {                                      // three pumpkin bombs
      if (t !== f) return;
      const [x, z] = mu.bomb(j), n = hitAt(M.bombHit, x, z, h.yaw, -2500 - j, false);
      emit('musou:hit', { x, y: 0.8, z, stage: 'contact', yaw: h.yaw, n });
    });
    const w = t - M.finisher;
    if (w >= 0 && w <= M.waveFrames) {                               // the ring of fire under the Great Pumpkin
      const u = w / M.waveFrames;
      mu.waveR = M.waveR * (1 - (1 - u) * (1 - u) * (1 - u)) + 0.8;
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, hitstop: w === 0 ? 5 : 0, heavy: w < 2 }, h.x, h.z, h.yaw, -3000, false);
      if (w === 0) emit('musou:burst', { count: n, x: h.x, z: h.z });
      else if (n) { const a = w * 2.4, R = mu.waveR * 0.9; emit('musou:hit', { x: h.x + dm.sin(a) * R, y: 0.4, z: h.z + dm.cos(a) * R, stage: 'wave', yaw: a, n: w }); }
    }
    if (t >= M.end) endMusou(mu, h, mu.m0, M.cost);
  };

  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, o = shot;
    o.shake = 0.4; o.side = 0;
    if (t < M.activation) {                                          // front three-quarter, a slow push-in
      const u = t / M.activation;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.8), dist: 4.0 - 0.6 * u, pitch: 0.24, fov: 44, height: 0.9, side: 0.1 });
    } else if (t < M.bombs[0] - M.bombFlight - 8) {                   // wide and high: the swarm
      const u = smooth(Math.min(1, (t - M.activation) / 24));
      Object.assign(o, { id: 2, yaw: offSun(mu.yaw0 + 0.35), dist: 5 + 4.5 * u, pitch: 0.24 + 0.1 * u, fov: 56, height: 1.4 + 0.8 * u, shake: 0.5 });
    } else if (t < M.finisher - 6) {                                 // behind and above her: the pumpkins landing ahead
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 + 0.2), dist: 8, pitch: 0.34, fov: 58, height: 2.4, shake: 0.7 });
    } else {                                                          // the finisher: low wide shot, the ring bursting out
      const u = smooth((t - M.finisher + 6) / (M.end - M.finisher + 6));
      Object.assign(o, { id: 4, yaw: offSun(mu.yaw0 - 0.5), dist: 9 + 1.5 * u, pitch: 0.1 + 0.05 * u, fov: 58, height: 1.6 + 0.3 * u, shake: 0.8 });
    }
    return o;
  };

  gauge(mu, game, M.cost);
  return mu;
}
