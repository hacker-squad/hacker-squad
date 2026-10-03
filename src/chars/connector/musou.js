// Connector's Overclock GIGA CONNECT (sim; interface of src/musou/musou.js). It blows itself up to a hundred times its
// size (the render side scales the rig 4.64×: ./model.js giantScale) and fights as a giant. Timeline (Overclock frames
// t, 250 = control returns; hitstop pauses it):
//   0   activation: the world holds still, it shudders and inflates (cut-in, 30 f); the ring round it is shoved clear
//   56 / 90 / 124  three giant hops, 5 m each, a 6 m slam under each landing. The player steers every hop: while the
//       giant squats before a take-off it turns to the stick (relative to the hop camera) and mu.aim marks where it
//       will land; the direction is locked as it leaves the floor. No stick: it hops straight on.
//   144–184 the giant spin: a 7 m circle, a tick every 8 f (spin reaction)
//   210 FINISHER: the belly flop — a ring blasts out to 10 m (launch tiers)
//   226 it lets the air out
// CLONE CALL — its second special. Overclock pressed in the air (one gauge segment, no pause): it pops, the ring round it is
// thrown back, and three clones — blue, pink, yellow — land round it and fight on their own for ten seconds. Clone Call
// (C6) calls the same three for five. A clone picks the nearest challenger within reach of Connector (each its own, where
// there are enough), hops after it and slams it: a spinning hop, a 2.1 m circle; with nothing to hit it keeps its place
// beside Connector. Clones can't be hurt and pop when their time is up. mu.clones is their state (render: ./model.js
// createCloneActor, ./view.js).
import { emit } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { clampWalk } from '../../world/map.js';
import { ST } from '../../crowd/crowd.js';
import { offSun, smooth, endMusou, gauge, auraShove, auraMove } from '../../musou/musou.js';
import { MUSOU_FRAMES } from './anims.js';
import { CLONE_CALL } from './moves.js';

export const CONNECTOR_MUSOU = {
  activation: 30, hops: [56, 90, 124], hopLen: 5, hopFrames: 16, hopR: 6, spin: [144, 184], spinEvery: 8, spinR: 7, finisher: 210, end: MUSOU_FRAMES, cost: 1 / 3,
  aura: { r0: 4.4, k: 0.35, frames: 12 },
  hopHit: { shape: 'circle', range: 6, dmg: 20, kb: 'blow', force: 9, lift: 6, hitstop: 4, heavy: true, yMax: 5 },
  spinHit: { shape: 'circle', range: 7, dmg: 8, kb: 'spin', force: 5, lift: 3, hitstop: 0, yMax: 6 },
  waveR: 10, waveFrames: 16,
  waveHit: { shape: 'circle', range: 0, dmg: 46, kb: 'launch', force: 7, lift: 10, hitstop: 0, heavy: true, yMax: 8 },
};

export const CLONE = {
  life: 600, callLife: 300, speed: 7, reach: 1.7, cd: 34, windup: 9, recover: 24, seek: 10, leash: 14, slots: [1.9, -1.9, Math.PI],
  hit: { shape: 'circle', range: 2.1, dmg: 9, kb: 'blow', force: 6, lift: 3, hitstop: 0 },
  pop: { shape: 'circle', range: 3.8, dmg: 14, kb: 'blow', force: 9, lift: 4, hitstop: 3, heavy: true },
};

export function createMusou(game) {
  const M = CONNECTOR_MUSOU;
  const mu = { active: false, t: 0, wasReady: false, seq: 0, ax: 0, az: 0, yaw0: 0, waveR: 0, hx: 0, hz: 0, aim: null, ax1: 0, az1: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };
  const push = [];
  let startMusou = 0;

  mu.clones = [0, 1, 2].map((k) => ({ k, on: false, x: 0, z: 0, yaw: 0, life: 0, age: 0, cd: 0, atk: 0, tgt: -1, spd: 0 }));
  let lastCall = -1;

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; mu.aim = null; push.length = 0; lastCall = -1; for (const q of mu.clones) q.on = false; };

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = Math.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.aim = null; mu.seq++;
    mu.yaw0 = h.yaw; mu.ax = h.x; mu.az = h.z; mu.hx = h.x; mu.hz = h.z;
    startMusou = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'mu_connector'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    auraShove(game.crowd, h, M.aura, push);                          // room to grow
    emit('musou:start', { x: h.x, z: h.z, activation: M.activation, burstAt: M.finisher, contact: M.hops[0] });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');

  /** The view yaw of the hop camera (shot 2 below): the stick steers the hops relative to it. */
  const hopYaw = () => offSun(mu.yaw0 + 0.5);
  const landing = (yaw) => clampWalk(mu.hx + Math.sin(yaw) * M.hopLen, mu.hz + Math.cos(yaw) * M.hopLen, 0.3);

  mu.stepHero = (inp) => {
    const h = game.hero, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musouClip = 'mu_connector'; h.musouT = t / M.end;
    h.musou = Math.max(0, startMusou - h.musouMax * M.cost * Math.min(1, t / M.hops[0]));
    if (t <= M.aura.frames) auraMove(game.crowd, push, t / M.aura.frames);
    if (t < M.activation) { game.freeze = Math.max(game.freeze, 2); return; }
    mu.aim = null;
    M.hops.forEach((f, j) => {                                       // three giant hops, each one where the stick points
      const f0 = f - M.hopFrames, w0 = j ? M.hops[j - 1] : M.activation;
      if (t >= w0 && t <= f0) {                                      // squatting: it turns to the stick, the landing spot follows
        const [sx, sz, smag] = inp ? stickDir(inp, hopYaw()) : [0, 0, 0];
        if (smag) h.yaw = Math.atan2(sx, sz);
        mu.hx = h.x; mu.hz = h.z;
        [mu.ax1, mu.az1] = landing(h.yaw);
      }
      if (t >= w0 && t < f) mu.aim = [mu.ax1, mu.az1];
      if (t > f0 && t <= f) {
        const u = (t - f0) / M.hopFrames;
        h.x = mu.hx + (mu.ax1 - mu.hx) * u; h.z = mu.hz + (mu.az1 - mu.hz) * u;
      }
      if (t !== f) return;
      const n = hitAt(M.hopHit, h.x, h.z, h.yaw, -2100 - j, false);
      emit('musou:hit', { x: h.x, y: 0.6, z: h.z, stage: j ? 'rush' : 'contact', yaw: h.yaw, n });
    });
    const [s0, s1] = M.spin;                                         // the giant spin
    if (t >= s0 && t <= s1 && (t - s0) % M.spinEvery === 0) {
      const k = (t - s0) / M.spinEvery, n = hitAt(M.spinHit, h.x, h.z, h.yaw, -2500 - k, false);
      if (n) { const a = k * 1.3; emit('musou:hit', { x: h.x + Math.sin(a) * 4, y: 1.2, z: h.z + Math.cos(a) * 4, stage: 'rush', yaw: a, n: k }); }
    }
    const w = t - M.finisher;
    if (w >= 0 && w <= M.waveFrames) {                               // the belly flop's ring
      const u = w / M.waveFrames;
      mu.waveR = M.waveR * (1 - (1 - u) * (1 - u) * (1 - u)) + 1.5;
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, hitstop: w === 0 ? 6 : 0, heavy: w < 2 }, h.x, h.z, h.yaw, -3000, false);
      if (w === 0) emit('musou:burst', { count: n, x: h.x, z: h.z });
      else if (n) { const a = w * 2.4, R = mu.waveR * 0.9; emit('musou:hit', { x: h.x + Math.sin(a) * R, y: 0.4, z: h.z + Math.cos(a) * R, stage: 'wave', yaw: a, n: w }); }
    }
    if (t >= M.end) endMusou(mu, h, startMusou, M.cost);
  };

  // the cameras stand well back: it is eight metres tall
  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, o = shot;
    o.shake = 0.5; o.side = 0;
    if (t < M.activation) {                                          // low, in front of it, pulling back as it grows
      const u = smooth(t / M.activation);
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.85), dist: 4.5 + 9 * u, pitch: 0.18 - 0.1 * u, fov: 50, height: 1.2 + 2.2 * u, side: 0.1 });
    } else if (t < M.spin[0] - 6) {                                  // behind and to the side: the hops (the yaw the stick steers by)
      Object.assign(o, { id: 2, yaw: hopYaw(), dist: 15, pitch: 0.2, fov: 58, height: 3.6, shake: 0.9 });
    } else if (t < M.finisher - 8) {                                 // high and wide: the spin
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 - 0.4), dist: 17, pitch: 0.34, fov: 58, height: 4.5, shake: 0.6 });
    } else {                                                          // the belly flop: low and wide, then back in as it shrinks
      const u = smooth((t - M.finisher + 8) / (M.end - M.finisher + 8));
      Object.assign(o, { id: 4, yaw: offSun(mu.yaw0 - 0.6), dist: 17 - 7 * u, pitch: 0.1 + 0.06 * u, fov: 58, height: 3.2 - 1.4 * u, shake: 1 });
    }
    return o;
  };

  // ---------------------------------------------------------------- the clones
  /** Three clones round the hero for `life` frames (already out: their time is topped up). */
  function callClones(life) {
    const h = game.hero;
    for (const q of mu.clones) {
      if (!q.on) {
        const a = h.yaw + CLONE.slots[q.k];
        [q.x, q.z] = clampWalk(h.x + Math.sin(a) * 2.2, h.z + Math.cos(a) * 2.2, 0.3);
        Object.assign(q, { on: true, yaw: h.yaw, age: 0, cd: 12 + q.k * 6, atk: 0, tgt: -1, spd: 0 });
      }
      q.life = Math.max(q.life, life);
    }
  }
  /** The challenger clone q goes for: the nearest one standing within the leash of the hero, others' targets last. */
  function pick(q) {
    const c = game.crowd, h = game.hero;
    let best = -1, bd = 1e9;
    for (let i = 0; i < c.N; i++) {
      const s = c.st[i];
      if (s === ST.OFF || s === ST.DEAD || c.y[i] > 1 || (c.x[i] - h.x) ** 2 + (c.z[i] - h.z) ** 2 > CLONE.leash ** 2) continue;
      let d = Math.hypot(c.x[i] - q.x, c.z[i] - q.z);
      for (const o of mu.clones) if (o !== q && o.on && o.tgt === i) d += 4;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function stepClones() {
    const h = game.hero, c = game.crowd;
    if (h.state === 'attack' && h.move === 'c6' && h.moveT === CLONE_CALL && h.moveSeq !== lastCall) { lastCall = h.moveSeq; callClones(CLONE.callLife); }
    if (game.freeze > 0) return;
    for (const q of mu.clones) {
      if (!q.on) continue;
      if (--q.life <= 0 || h.dead) { q.on = false; continue; }
      q.age++;
      if (q.cd > 0) q.cd--;
      if (q.atk > 0) {                                               // a slam in progress: it lands on the wind-up's last frame
        if (q.atk === CLONE.windup) game.combat.strike(CLONE.hit, q.x, q.z, q.yaw, -7000 - q.k, true, 'clone');
        if (++q.atk > CLONE.recover) q.atk = 0;
        q.spd = 0;
        continue;
      }
      const lost = q.tgt >= 0 && (c.st[q.tgt] === ST.OFF || c.st[q.tgt] === ST.DEAD);
      if (lost || (game.frame + q.k * 3) % CLONE.seek === 0) q.tgt = pick(q);
      let tx, tz, stop;
      if (q.tgt >= 0) { tx = c.x[q.tgt]; tz = c.z[q.tgt]; stop = CLONE.reach; }
      else { const a = h.yaw + CLONE.slots[q.k]; tx = h.x + Math.sin(a) * 2.2; tz = h.z + Math.cos(a) * 2.2; stop = 0.4; }
      const dx = tx - q.x, dz = tz - q.z, d = Math.hypot(dx, dz);
      q.spd = d > stop ? 1 : 0;
      if (q.spd) { const s = Math.min(CLONE.speed / 60, d - stop * 0.9); [q.x, q.z] = clampWalk(q.x + dx / d * s, q.z + dz / d * s, 0.3); }
      if (d > 0.05 && (q.spd || q.tgt >= 0)) q.yaw = Math.atan2(dx, dz);
      if (q.tgt >= 0 && d <= stop + 0.2 && !q.cd) { q.atk = 1; q.cd = CLONE.cd; }
    }
  }
  /** Overclock pressed in the air: Clone Call (hero.js asks every step the Overclock itself did not start; never takes the hero over). */
  mu.stepSpecial = () => {
    const h = game.hero;
    if (!h.musouBuf || !mu.ready() || h.grounded || h.dead || h.state === 'hurt') return false;
    h.musouBuf = 0;
    h.musou = Math.max(0, h.musou - h.musouMax * M.cost);
    h.iframes = Math.max(h.iframes, 24);
    callClones(CLONE.life);
    const n = game.combat.strike(CLONE.pop, h.x, h.z, h.yaw, -7100, true, 'musou');
    emit('musou:hit', { x: h.x, y: 1.0, z: h.z, stage: 'contact', yaw: h.yaw, n });
    emit('connector:clones', { x: h.x, z: h.z });
    return false;
  };

  gauge(mu, game, M.cost, stepClones);
  return mu;
}
