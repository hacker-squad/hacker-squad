// Bryan's Overclock ROAD CLOSED (sim; interface of src/musou/musou.js). He closes the road round himself and drops the
// depot's whole stock of cones into it; he does not move. Timeline (Overclock frames t, 210 = control returns; hitstop
// pauses it):
//   0   activation: the world holds still, he raises the sign (cut-in, 24 f)
//   32 / 42 / 52 / 62  he shows the sign to the front, the right, the back, the left: a fence wall 11 m wide drops 5.5 m
//       out on each side and knocks whoever stands under it into the pen
//   76–148 cones rain into the pen, one every 6 f (13 of them, a 2.6 m blast each, spin reaction)
//   176 FINISHER: the sign slammed flat — the fences fly, a shock ring blasts out to 8.5 m (launch tiers)
// mu.wall(k) / mu.cone(k): where wall k stands and cone k lands (the render side reads them too: ./view.js).
import { emit } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { clampWalk } from '../../world/map.js';
import { offSun, smooth, endMusou, gauge } from '../../musou/musou.js';
import { MUSOU_FRAMES } from './anims.js';

export const BRYAN_MUSOU = {
  activation: 24, walls: [32, 42, 52, 62], wallD: 5.5, wallW: 11, wallDrop: 8, rain: [76, 148], rainEvery: 6, rainR: 4.6, coneFall: 12, finisher: 176,
  end: MUSOU_FRAMES, cost: 1 / 3,
  wallHit: { shape: 'line', len: 2.8, width: 11, off: -1.4, dmg: 16, kb: 'push', force: 8, lift: 2, hitstop: 2 },
  coneHit: { shape: 'circle', range: 2.6, dmg: 15, kb: 'spin', force: 4, lift: 3, hitstop: 0 },
  waveR: 8.5, waveFrames: 14,
  waveHit: { shape: 'circle', range: 0, dmg: 46, kb: 'launch', force: 6, lift: 9, hitstop: 0, heavy: true, yMax: 5 },
};
export const CONES = Math.floor((BRYAN_MUSOU.rain[1] - BRYAN_MUSOU.rain[0]) / BRYAN_MUSOU.rainEvery) + 1;

export function createMusou(game) {
  const M = BRYAN_MUSOU;
  const mu = { active: false, t: 0, wasReady: false, seq: 0, ax: 0, az: 0, yaw0: 0, waveR: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };
  let startMusou = 0;

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; };
  /** Wall k (0 front, 1 right, 2 back, 3 left): [x, z, yaw] — its centre and the yaw that looks into the pen. */
  mu.wall = (k) => { const a = mu.yaw0 - k * Math.PI / 2; return [mu.ax + Math.sin(a) * M.wallD, mu.az + Math.cos(a) * M.wallD, a + Math.PI]; };
  /** Cone k's landing point: a sunflower spread over the pen, clamped to walkable ground. */
  mu.cone = (k) => { const a = mu.yaw0 + k * 2.39996, r = M.rainR * Math.sqrt((k + 0.5) / CONES); return clampWalk(mu.ax + Math.sin(a) * r, mu.az + Math.cos(a) * r, 0.3); };

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = Math.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.seq++;
    mu.yaw0 = h.yaw; mu.ax = h.x; mu.az = h.z;
    startMusou = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'mu_bryan'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    emit('musou:start', { x: h.x, z: h.z, activation: M.activation, burstAt: M.finisher, contact: M.walls[0] });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');

  mu.stepHero = () => {
    const h = game.hero, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musouClip = 'mu_bryan'; h.musouT = t / M.end;
    h.musou = Math.max(0, startMusou - h.musouMax * M.cost * Math.min(1, t / M.walls[0]));
    if (t < M.activation) { game.freeze = Math.max(game.freeze, 2); return; }
    M.walls.forEach((f, k) => {                                      // the four fence walls
      if (t !== f) return;
      const [x, z, yaw] = mu.wall(k), n = hitAt(M.wallHit, x, z, yaw, -2100 - k, false);
      emit('musou:hit', { x, y: 0.8, z, stage: k ? 'rush' : 'contact', yaw, n });
    });
    const [r0, r1] = M.rain;                                         // the cones
    if (t >= r0 && t <= r1 && (t - r0) % M.rainEvery === 0) {
      const k = (t - r0) / M.rainEvery, [x, z] = mu.cone(k), n = hitAt(M.coneHit, x, z, h.yaw, -2500 - k, false);
      if (n) emit('musou:hit', { x, y: 0.6, z, stage: 'rush', yaw: h.yaw, n: k });
    }
    const w = t - M.finisher;
    if (w >= 0 && w <= M.waveFrames) {                               // the shock ring from the slammed sign
      const u = w / M.waveFrames;
      mu.waveR = M.waveR * (1 - (1 - u) * (1 - u) * (1 - u)) + 0.8;
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, hitstop: w === 0 ? 5 : 0, heavy: w < 2 }, h.x, h.z, h.yaw, -3000, false);
      if (w === 0) emit('musou:burst', { count: n, x: h.x, z: h.z });
      else if (n) { const a = w * 2.4, R = mu.waveR * 0.9; emit('musou:hit', { x: h.x + Math.sin(a) * R, y: 0.4, z: h.z + Math.cos(a) * R, stage: 'wave', yaw: a, n: w }); }
    }
    if (t >= M.end) endMusou(mu, h, startMusou, M.cost);
  };

  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, o = shot;
    o.shake = 0.4; o.side = 0;
    if (t < M.activation) {                                          // front three-quarter, above head height, slow push-in
      const u = t / M.activation;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.8), dist: 4.6 - 0.7 * u, pitch: 0.3, fov: 44, height: 1.1, side: 0.1 });
    } else if (t < M.rain[0] - 6) {                                  // pulling back and up over his shoulder as the walls come down
      const u = smooth(Math.min(1, (t - M.activation) / 30));
      Object.assign(o, { id: 2, yaw: offSun(mu.yaw0 + 0.4), dist: 6 + 6 * u, pitch: 0.3 + 0.2 * u, fov: 58, height: 1.6 + 1.4 * u, shake: 0.7 });
    } else if (t < M.finisher - 6) {                                 // high over the pen: the cones coming down
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 - 0.5), dist: 13, pitch: 0.62, fov: 58, height: 2.4, shake: 0.6 });
    } else {                                                          // the finisher: low wide shot, the fences flying, the ring bursting out
      const u = smooth((t - M.finisher + 6) / (M.end - M.finisher + 6));
      Object.assign(o, { id: 4, yaw: offSun(mu.yaw0 - 0.5), dist: 9.5 + 1.5 * u, pitch: 0.1 + 0.05 * u, fov: 58, height: 1.6 + 0.3 * u, shake: 0.8 });
    }
    return o;
  };

  gauge(mu, game, M.cost);
  return mu;
}
