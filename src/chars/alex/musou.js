// Alex's Overclock TYPHOON (sim; interface of src/musou/musou.js). He opens the umbrella, the wind takes it, and he rides
// it across the floor as the eye of his own storm. Timeline (Overclock frames t, 210 = control returns; hitstop pauses it):
//   0   activation: the world holds still, he opens the umbrella to the sky (cut-in, 24 f)
//   30–150 the flight: he hangs under the spinning umbrella 1.5 m off the floor and the player flies him with the stick
//       (relative to the flight camera; no stick: he drifts straight on) at 6.5 m/s over walkable ground; the twister
//       round him catches a 4.4 m circle every 8 f (spin reaction)
//   160 the umbrella folds, he drops
//   180 FINISHER: the umbrella slammed into the ground, a storm ring blasts out to 8 m (launch tiers)
import { emit } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { clampWalk } from '../../world/map.js';
import { offSun, smooth, endMusou, gauge } from '../../musou/musou.js';
import { MUSOU_FRAMES } from './anims.js';

export const ALEX_MUSOU = {
  activation: 24, flight: [30, 150], speed: 6.5, drift: 2.5, lift: 1.5, twEvery: 8, twR: 4.4, finisher: 180, end: MUSOU_FRAMES, cost: 1 / 3,
  twHit: { shape: 'circle', range: 4.4, dmg: 8, kb: 'spin', force: 4, lift: 3, hitstop: 0, yMax: 5 },
  waveR: 8, waveFrames: 14,
  waveHit: { shape: 'circle', range: 0, dmg: 46, kb: 'launch', force: 6, lift: 9, hitstop: 0, heavy: true, yMax: 5 },
};

export function createMusou(game) {
  const M = ALEX_MUSOU;
  const mu = { active: false, t: 0, wasReady: false, seq: 0, ax: 0, az: 0, yaw0: 0, waveR: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };
  let startMusou = 0;

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; };

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = Math.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.seq++;
    mu.yaw0 = h.yaw; mu.ax = h.x; mu.az = h.z;
    startMusou = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'mu_alex'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    emit('musou:start', { x: h.x, z: h.z, activation: M.activation, burstAt: M.finisher, contact: M.flight[0] });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');
  /** The view yaw of the flight camera (shot 2 below): the stick flies him relative to it. */
  const flightYaw = () => offSun(mu.yaw0 + 0.3);

  mu.stepHero = (inp) => {
    const h = game.hero, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musouClip = 'mu_alex'; h.musouT = t / M.end;
    h.musou = Math.max(0, startMusou - h.musouMax * M.cost * Math.min(1, t / M.flight[0]));
    if (t < M.activation) { game.freeze = Math.max(game.freeze, 2); return; }
    const [f0, f1] = M.flight;
    h.y = M.lift * smooth(Math.min(1, Math.max(0, (t - f0 + 6) / 12))) * (1 - smooth(Math.min(1, Math.max(0, (t - f1 - 8) / 14))));
    if (t >= f0 && t <= f1) {                                        // the flight: where the stick points, else straight on
      const [sx, sz, smag] = inp ? stickDir(inp, flightYaw()) : [0, 0, 0];
      if (smag) h.yaw = Math.atan2(sx, sz);
      const v = (smag ? M.speed * smag : M.drift) / 60;
      [h.x, h.z] = clampWalk(h.x + Math.sin(h.yaw) * v, h.z + Math.cos(h.yaw) * v, 0.3);
      if ((t - f0) % M.twEvery === 0) {
        const k = (t - f0) / M.twEvery, n = hitAt(M.twHit, h.x, h.z, h.yaw, -2100 - k, false);
        if (n) { const a = k * 1.9; emit('musou:hit', { x: h.x + Math.sin(a) * 2.6, y: 1.2, z: h.z + Math.cos(a) * 2.6, stage: k ? 'rush' : 'contact', yaw: a, n: k }); }
      }
    }
    const w = t - M.finisher;
    if (w >= 0 && w <= M.waveFrames) {                               // the storm ring from the drop
      const u = w / M.waveFrames;
      mu.waveR = M.waveR * (1 - (1 - u) * (1 - u) * (1 - u)) + 0.8;
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, hitstop: w === 0 ? 5 : 0, heavy: w < 2 }, h.x, h.z, h.yaw, -3000, false);
      if (w === 0) emit('musou:burst', { count: n, x: h.x, z: h.z });
      else if (n) { const a = w * 2.4, R = mu.waveR * 0.9; emit('musou:hit', { x: h.x + Math.sin(a) * R, y: 0.4, z: h.z + Math.cos(a) * R, stage: 'wave', yaw: a, n: w }); }
    }
    if (t >= M.end) { h.y = 0; endMusou(mu, h, startMusou, M.cost); }
  };

  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, o = shot;
    o.shake = 0.4; o.side = 0;
    if (t < M.activation) {                                          // front three-quarter, above head height, slow push-in
      const u = t / M.activation;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.8), dist: 4.6 - 0.7 * u, pitch: 0.3, fov: 44, height: 1.1, side: 0.1 });
    } else if (t < M.finisher - 8) {                                 // behind and above: the flight (the yaw the stick steers by)
      const u = smooth(Math.min(1, (t - M.activation) / 20));
      Object.assign(o, { id: 2, yaw: flightYaw(), dist: 6 + 5 * u, pitch: 0.3 + 0.14 * u, fov: 58, height: 1.6 + 1.0 * u, shake: 0.5 });
    } else {                                                          // the finisher: low wide shot, the ring bursting out
      const u = smooth((t - M.finisher + 8) / (M.end - M.finisher + 8));
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 - 0.5), dist: 8.5 + 1.5 * u, pitch: 0.08 + 0.05 * u, fov: 58, height: 1.6 + 0.3 * u, shake: 0.7 });
    }
    return o;
  };

  gauge(mu, game, M.cost);
  return mu;
}
