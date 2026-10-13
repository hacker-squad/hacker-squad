// Ben's Overclock GOING APE (sim; interface of src/musou/musou.js). He swells into a gorilla and goes on the rampage.
// Timeline (Overclock frames t, 220 = control returns; hitstop pauses it):
//   0   activation: the world holds still, he beats his chest and grows (cut-in, 24 f; the render side swaps the body
//       and scales the rig: ./model.js apeScale)
//   30–140 the rampage: the player drives the gorilla with the stick (relative to the rampage camera; no stick: he
//       lumbers straight on) at 5.5 m/s over walkable ground, and every 16 f both fists come down 1.2 m ahead of him:
//       a 3.2 m blast (blow)
//   150–176 the chest beat: a shockwave every 8 f, a circle growing 3 → 6 m (spin reaction)
//   176–184 the leap: 2.4 m up and 2 m on
//   184 FINISHER: he lands on both fists — a ring blasts out to 8.5 m (launch tiers) under a rain of bananas
import { emit } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { clampWalk } from '../../world/map.js';
import { offSun, smooth, endMusou, gauge } from '../../musou/musou.js';
import { MUSOU_FRAMES } from './anims.js';
import * as dm from '../../core/dmath.js';

export const BEN_MUSOU = {
  activation: 24, rampage: [30, 140], speed: 5.5, drift: 1.2, poundEvery: 16, poundAhead: 1.2, beat: [150, 176], beatEvery: 8, beatR: [3, 6],
  leap: 176, leapH: 2.4, leapD: 2.0, finisher: 184, end: MUSOU_FRAMES, cost: 1 / 3,
  poundHit: { shape: 'circle', range: 3.2, dmg: 10, kb: 'blow', force: 7, lift: 3, hitstop: 2, yMax: 4 },
  beatHit: { shape: 'circle', dmg: 6, kb: 'spin', force: 4, lift: 2, hitstop: 0, yMax: 5 },
  waveR: 8.5, waveFrames: 14,
  waveHit: { shape: 'circle', range: 0, dmg: 46, kb: 'launch', force: 6, lift: 9, hitstop: 0, heavy: true, yMax: 5 },
};

export function createMusou(game) {
  const M = BEN_MUSOU;
  const mu = { active: false, t: 0, wasReady: false, seq: 0, ax: 0, az: 0, yaw0: 0, waveR: 0, beatR: 0, pounds: 0, px: 0, pz: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; mu.beatR = 0; mu.pounds = 0; };

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = dm.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.beatR = 0; mu.pounds = 0; mu.seq++;
    mu.yaw0 = h.yaw; mu.ax = h.x; mu.az = h.z;
    mu.m0 = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'mu_ben'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    emit('musou:start', { x: h.x, z: h.z, activation: M.activation, burstAt: M.finisher, contact: M.rampage[0] });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');
  /** The view yaw of the rampage camera (shot 2 below): the stick drives him relative to it. */
  const rampYaw = () => offSun(mu.yaw0 + 0.3);

  mu.stepHero = (inp) => {
    const h = game.hero, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musouClip = 'mu_ben'; h.musouT = t / M.end;
    h.musou = Math.max(0, mu.m0 - h.musouMax * M.cost * Math.min(1, t / M.rampage[0]));
    if (t < M.activation) { game.freeze = Math.max(game.freeze, 2); return; }
    const [r0, r1] = M.rampage;
    if (t >= r0 && t <= r1) {                                        // the rampage: where the stick points, else straight on
      const [sx, sz, smag] = inp ? stickDir(inp, rampYaw()) : [0, 0, 0];
      if (smag) h.yaw = dm.atan2(sx, sz);
      const v = (smag ? M.speed * smag : M.drift) / 60;
      [h.x, h.z] = clampWalk(h.x + dm.sin(h.yaw) * v, h.z + dm.cos(h.yaw) * v, 0.3);
      if ((t - r0) % M.poundEvery === 0) {                           // both fists down ahead of him
        const k = (t - r0) / M.poundEvery;
        mu.px = h.x + dm.sin(h.yaw) * M.poundAhead; mu.pz = h.z + dm.cos(h.yaw) * M.poundAhead; mu.pounds = k + 1;
        const n = hitAt(M.poundHit, mu.px, mu.pz, h.yaw, -2100 - k, false);
        emit('musou:hit', { x: mu.px, y: 0.3, z: mu.pz, stage: k ? 'rush' : 'contact', yaw: h.yaw, n });
      }
    }
    const [b0, b1] = M.beat;                                         // the chest beat: a growing circle of shockwaves
    mu.beatR = t >= b0 && t <= b1 + 8 ? M.beatR[0] + (M.beatR[1] - M.beatR[0]) * Math.min(1, (t - b0) / (b1 - b0)) : 0;
    if (t >= b0 && t <= b1 && (t - b0) % M.beatEvery === 0) {
      const k = (t - b0) / M.beatEvery, n = hitAt({ ...M.beatHit, range: mu.beatR }, h.x, h.z, h.yaw, -2500 - k, false);
      if (n) { const a = k * 1.9; emit('musou:hit', { x: h.x + dm.sin(a) * mu.beatR * 0.7, y: 1.0, z: h.z + dm.cos(a) * mu.beatR * 0.7, stage: 'rush', yaw: a, n: k }); }
    }
    if (t >= M.leap && t <= M.finisher) {                            // the leap: a parabola 2.4 m high, 2 m on
      const u = (t - M.leap) / (M.finisher - M.leap);
      h.y = M.leapH * 4 * u * (1 - u);
      if (t < M.finisher) [h.x, h.z] = clampWalk(h.x + dm.sin(h.yaw) * M.leapD / (M.finisher - M.leap), h.z + dm.cos(h.yaw) * M.leapD / (M.finisher - M.leap), 0.3);
    }
    const w = t - M.finisher;
    if (w >= 0 && w <= M.waveFrames) {                               // the ring from the landing
      const u = w / M.waveFrames;
      mu.waveR = M.waveR * (1 - (1 - u) * (1 - u) * (1 - u)) + 0.8;
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, hitstop: w === 0 ? 5 : 0, heavy: w < 2 }, h.x, h.z, h.yaw, -3000, false);
      if (w === 0) emit('musou:burst', { count: n, x: h.x, z: h.z });
      else if (n) { const a = w * 2.4, R = mu.waveR * 0.9; emit('musou:hit', { x: h.x + dm.sin(a) * R, y: 0.4, z: h.z + dm.cos(a) * R, stage: 'wave', yaw: a, n: w }); }
    }
    if (t >= M.end) { h.y = 0; endMusou(mu, h, mu.m0, M.cost); }
  };

  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, o = shot;
    o.shake = 0.4; o.side = 0;
    if (t < M.activation) {                                          // front three-quarter, pulling back as he grows
      const u = t / M.activation;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.8), dist: 3.6 + 1.6 * u, pitch: 0.2 + 0.1 * u, fov: 44, height: 0.9 + 0.9 * u, side: 0.1, shake: 0.3 + u });
    } else if (t < M.beat[0] - 6) {                                  // behind and above: the rampage (the yaw the stick drives by)
      const u = smooth(Math.min(1, (t - M.activation) / 20));
      Object.assign(o, { id: 2, yaw: rampYaw(), dist: 7 + 3.5 * u, pitch: 0.3 + 0.1 * u, fov: 58, height: 2.4 + 0.8 * u, shake: 0.6 });
    } else if (t < M.leap - 2) {                                     // a three-quarter shot from behind, closer: the chest beat
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 + 0.9), dist: 7, pitch: 0.26, fov: 52, height: 2.4, shake: 0.5 });
    } else {                                                          // the finisher: low wide shot, the ring bursting out
      const u = smooth((t - M.leap + 2) / (M.end - M.leap + 2));
      Object.assign(o, { id: 4, yaw: offSun(mu.yaw0 - 0.5), dist: 9 + 2 * u, pitch: 0.1 + 0.05 * u, fov: 58, height: 1.8 + 0.3 * u, shake: 0.8 });
    }
    return o;
  };

  gauge(mu, game, M.cost);
  return mu;
}
