// Ben's effects view (render-only; reads game.musou = ./musou.js and the hero's move, never writes sim state).
//  · the fruit in flight: banana arrows (N5, the fan of Banana Split, straight up on Durian Drop), grape arrows and the
//    bunch (Grape Shot), the lobbed pineapple (C2) and watermelon (C3), the durian falling (C6), the banana peel (jump
//    charge) — voxel meshes on pooled flights, each bursting where it lands (./moves.js SHOTS / LOBS / DURIAN tables)
//  · the boomerang: flown out and back on N3, round him on Boomerang Orbit (FLIGHTS; the model hides the one in his fist)
//  · Overclock GOING APE: a yellow vignette and the cut-in, a puff as the body swaps, a blast under every ground pound,
//    the chest-beat rings, the landing ring, and a rain of bananas
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { vox } from '../../hero/model.js';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { ground } from '../../world/map.js';
import { createFx } from '../shared/fx.js';
import { B, Pt } from '../shared/body.js';
import { ball } from '../shared/squat.js';
import { BEN_MUSOU as M } from './musou.js';
import { MOVES, FLIGHTS, LOBS, SHOTS, DURIAN } from './moves.js';
import { CC, BOW_SCALE, SWAP, boomerangGeo } from './model.js';

const YEL = [3.0, 2.4, 0.5], GRN = [0.8, 3.0, 0.9], BROWN = [1.6, 0.9, 0.3], PINK = [3.0, 0.9, 1.0], PURPLE = [1.8, 0.6, 3.0], RAIN = 28;
const GRAPE = 0x7a3fb8, GRAPE_D = 0x5a2a90, LEAF = 0x46c860, LEAF_D = 0x2f8a40, RIND = 0x3e8a3a, RIND_D = 0x2a6a28, FLESH = 0xe84a6a, DUR = 0x9ab040, DUR_D = 0x6a8028;

// ---- the fruit (voxels; every projectile's nose is its +Z)
const FRUIT = {
  banana: () => vox([B([-1, -1, -12], [1, 2, 13], (x, y, z) => { const u = (z + 0.5) / 12, yc = 1.6 * u * u; if (Math.abs(y + 0.5 - yc) > 1 || Math.abs(x + 0.5) > 1) return null; return z > 10 ? CC.tipB : z < -9 ? LEAF : x >= 0 ? CC.yellowD : CC.yellow; })], 0.02, { jitter: 0.02 }),
  grape: () => vox([B([0, 0, -12], [1, 1, 10], CC.woodD), ball([0.5, 0.5, 11], [2.2, 2.2, 2.2], (x, y) => ((x + y) % 2 ? GRAPE : GRAPE_D)), B([0, 0, -12], [1, 1, -9], LEAF)], 0.02, { jitter: 0.02 }),
  bunch: () => vox([B([0, 0, -8], [1, 1, 2], CC.woodD), ...[[0, 0, 4], [-3, 1, 3], [3, 0, 2], [0, 3, 2], [0, -3, 3], [-2, -2, 6], [2, 2, 6], [0, 0, 8]].map(([x, y, z]) => ball([x, y, z], [2.6, 2.6, 2.6], (a, b) => ((a + b + 40) % 3 ? GRAPE : GRAPE_D))),
    B([-2, 2, -8], [3, 3, -4], LEAF)], 0.025, { jitter: 0.03 }),
  pineapple: () => vox([ball([0, 0, 0], [4.2, 4.2, 6], (x, y, z) => ((x + y + z + 60) % 3 === 0 ? CC.tipB : (x - y + 60) % 2 ? CC.yellowD : CC.yellow)),
    ...[[-2, 0], [2, 0], [0, -2], [0, 2], [0, 0]].map(([x, y]) => B([x, y, 6], [x + 1, y + 1, 11 + Math.abs(x + y)], (a, b, c) => (c % 2 ? LEAF : LEAF_D)))], 0.03, { jitter: 0.03 }),
  melon: () => vox([ball([0, 0, 0], [6, 6, 7.2], (x, y, z) => (Math.abs((Math.atan2(x + 0.5, y + 0.5) * 4 / Math.PI + 20) % 2 - 1) < 0.35 ? RIND_D : RIND))], 0.03, { jitter: 0.03 }),
  durian: () => vox([ball([0, 0, 0], [6, 6, 6.5], (x, y, z) => (((x + y * 2 + z * 3) % 4 === 0) ? DUR_D : DUR)),
    ...[[6, 0, 0], [-6, 0, 0], [0, 6, 0], [0, -6, 0], [0, 0, 6], [0, 0, -6], [4, 4, 2], [-4, 4, -2], [4, -4, -2], [-4, -4, 2], [4, 2, -4], [-2, 4, 4], [2, -4, 4], [-4, -2, -4]].map(([x, y, z]) => B([x, y, z], [x + 1, y + 1, z + 1], DUR_D)),
    ...[[7, 0, 0], [-7, 0, 0], [0, 7, 0], [0, -7, 0], [0, 0, 7], [0, 0, -7]].map(([x, y, z]) => B([x, y, z], [x + 1, y + 1, z + 1], CC.tipB))], 0.03, { jitter: 0.04 }),
  peel: () => vox([B([-1, 0, -6], [1, 1, 0], CC.yellowD), B([-5, 0, 0], [-1, 1, 6], CC.yellow), B([1, 0, 0], [5, 1, 6], CC.yellow), B([-1, 0, 0], [1, 1, 7], CC.yellow), Pt([-5, 0, 4], [5, 1, 7], CC.skin)], 0.025, { jitter: 0.02 }),
  boomerang: boomerangGeo,
};

export function createMusouView(scene, game) {
  const mu = game.musou, hero = game.hero;
  const fx = createFx(scene);
  const ov = createOverlay({ sub: 'Going Ape', seal: 'BEN',
    css: { big: 'color:#fff8d0; text-shadow: 0 0 2vh rgba(255,217,58,.9), 0 0 5vh rgba(70,200,96,.7);', sub: 'color:#ffe9a0; text-shadow: 0 0 1vh rgba(0,0,0,.7);',
      seal: 'background:#ffd93a; box-shadow: 0 0 2vh rgba(255,217,58,.6);' } });
  ov.dim.style.background = 'radial-gradient(ellipse at 50% 55%, rgba(255,246,210,1) 25%, rgba(40,30,6,1) 100%)';
  ov.wash.style.background = 'radial-gradient(circle at 50% 60%, rgba(255,240,180,0.9), rgba(120,220,80,0.25) 70%)';

  // ---- projectiles: pooled meshes, one geometry per fruit, flown by a path(u, out) and burst by land(x, z)
  const geos = Object.fromEntries(Object.entries(FRUIT).map(([k, f]) => [k, f()]));
  const fMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7 });
  const pool = [...Array(14)].map(() => { const m = new THREE.Mesh(geos.banana, fMat); m.visible = false; m.castShadow = true; fx.root.add(m); return { m, t: 1, life: 1, path: null, land: null, spin: 0, kind: '' }; });
  const _p = new THREE.Vector3(), _d = new THREE.Vector3();
  /** Fly `kind` for `frames` along path(u, pos) (u 0..1); land(x, z) fires where it ends. */
  const fly = (kind, frames, path, land = null, spin = 0, scale = 1) => {
    const f = pool.find((o) => o.t >= o.life) || pool[0];
    Object.assign(f, { t: 0, life: frames / 60, path, land, spin, kind });
    f.m.geometry = geos[kind]; f.m.visible = true; f.m.scale.setScalar(scale); f.m.rotation.set(0, 0, 0);
    path(0, f.m.position);
    return f;
  };
  const gy = () => ground(hero.x, hero.z);
  const fwd = () => [Math.sin(hero.yaw), Math.cos(hero.yaw)];
  const at = (d, side = 0) => { const [fx_, fz] = fwd(); return [hero.x + fx_ * d + fz * side, hero.z + fz * d - fx_ * side]; };
  const bowAt = () => { const [x, z] = at(0.45, 0.1); return [x, gy() + 0.75, z]; };
  const line = (from, to) => (u, out) => out.set(from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] + (to[2] - from[2]) * u);
  const lob = (from, to, h) => (u, out) => { line(from, to)(u, out); out.y += Math.sin(u * Math.PI) * h; };
  /** An arrow of `kind` from the bow `dist` m down the lane, `off`° off his facing. */
  const shoot = (kind, dist, off, color) => {
    const a = hero.yaw + off * Math.PI / 180, [x0, y0, z0] = bowAt(), x1 = hero.x + Math.sin(a) * dist, z1 = hero.z + Math.cos(a) * dist, y1 = ground(x1, z1) + 0.6;
    fly(kind, Math.max(4, dist / 0.7), line([x0, y0, z0], [x1, y1, z1]), kind === 'bunch' ? (x, z) => { fx.ring({ x, z, y: ground(x, z) + 0.3, r0: 0.3, r1: 1.8, life: 0.35, color: PURPLE, a: 1.1 }); fx.sparks({ x, y: ground(x, z) + 0.8, z, n: 30, speed: 6, up: 5, life: 0.6, color: PURPLE }); } : null, 0, kind === 'bunch' ? 1.4 : 1);
    fx.beam({ from: [x0, y0, z0], to: [x1 * 0.6 + x0 * 0.4, y0, z1 * 0.6 + z0 * 0.4], w: kind === 'bunch' ? 0.4 : 0.14, life: 0.14, color, a: 0.9 });
  };
  const splat = (x, z, r, color, color2 = GRN, n = 34) => {
    const y = ground(x, z);
    fx.ring({ x, z, y: y + 0.12, r0: 0.4, r1: r, life: 0.4, color, a: 1.3 });
    fx.ring({ x, z, y: y + 0.6, r0: 0.3, r1: r * 0.7, life: 0.5, color: color2, a: 0.8 });
    fx.sparks({ x, y: y + 0.5, z, n, speed: 7, up: 7, life: 0.8, color });
    fx.tiles({ x, z, r: r * 0.7, n: 12, life: 0.9, color: color2 });
  };

  // ---- the banana rain of the finisher (instanced)
  const rainMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7 });
  const rain = new THREE.InstancedMesh(geos.banana, rainMat, RAIN); rain.frustumCulled = false; rain.count = 0; fx.root.add(rain);
  const h01 = (i, k) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  const mR = new THREE.Matrix4(), qR = new THREE.Quaternion(), eR = new THREE.Euler(), sR = new THREE.Vector3(1.6, 1.6, 1.6);
  let rainAt = -1, rx = 0, rz = 0;                                   // when the rain started (time), and where

  let key = -1, flash = 0, time = 0, lastF = -1, sub = 0;
  const subs = [on('musou:burst', (ev) => {
    if (game.musou !== mu) return;
    fx.ring({ x: ev.x, z: ev.z, r0: 1, r1: M.waveR, life: 0.5, color: YEL, a: 1.3 });
    fx.ring({ x: ev.x, z: ev.z, r0: 0.6, r1: M.waveR * 0.8, life: 0.7, color: GRN, a: 1.0 });
    fx.tiles({ x: ev.x, z: ev.z, r: M.waveR * 0.8, n: 50, life: 1.4, color: BROWN });
    fx.sparks({ x: ev.x, y: ground(ev.x, ev.z) + 0.4, z: ev.z, n: 80, speed: 11, up: 8, life: 1.3, color: YEL });
    flash = 1; rainAt = time; rx = ev.x; rz = ev.z;
  })];

  return {
    update(dt) {
      time += dt;
      const t = mu.active ? mu.t : 0, g0 = gy(), [fwX, fwZ] = fwd();
      ov.show(ov.dim, mu.active ? 0.55 * ramp(t, 0, 8) * (1 - ramp(t, M.activation - 4, M.activation + 8)) : 0);
      ov.cut(t, 6, mu.active ? ramp(t, 6, 10) * (1 - ramp(t, M.activation + 4, M.activation + 14)) : 0, ramp(t, 6, 12));
      flash = Math.max(0, flash - dt * 2.2);
      ov.show(ov.wash, flash * 0.5);
      const move = hero.state === 'attack' ? hero.move : null, f = hero.moveT;
      // one-shot effects keyed on the sim frame of the move / the Overclock (hitstop holds the frame: no double spawns)
      const k = move ? hero.moveSeq * 1000 + f : mu.active ? -t : -1e9;
      if (k !== key) {
        key = k;
        const puff = (d, n = 6, color = YEL) => { const [x, z] = at(d); fx.sparks({ x, y: g0 + 0.7, z, n, speed: 4, up: 3, life: 0.4, color }); };
        if (move) {
          const m = MOVES[move];
          if (/^n[124]$|^dash$|^jatk$/.test(move)) for (const w of m.hits) if (f === w.f[0]) puff(1.3);
          if (move === 'n3' && (f === 10 || f === 20)) puff(f === 10 ? 3.2 : 1.6, 6, BROWN);
          if (move === 'n6' && f === 16) { fx.ring({ x: hero.x, z: hero.z, y: g0 + 0.12, r0: 0.5, r1: 2.4, life: 0.35, color: YEL, a: 1.2 }); fx.tiles({ x: hero.x, z: hero.z, r: 1.6, n: 10, life: 0.8, color: BROWN }); }
          for (const [sf, dist, off, kind] of SHOTS[move] || []) {
            if (f !== sf) continue;
            if (kind === 'up') { const [x0, y0, z0] = bowAt(); fly('banana', 12, line([x0, y0, z0], [x0, y0 + 12, z0])); fx.beam({ from: [x0, y0, z0], to: [x0, y0 + 7, z0], w: 0.14, life: 0.3, color: YEL, a: 0.9 }); }
            else shoot(kind, dist, off, kind === 'banana' ? YEL : PURPLE);
          }
          if (move === 'c1' && f === 20) { const [x, z] = at(0.8); fx.cone({ x, z, y: g0 + 0.8, yaw: hero.yaw, range: 5.4, ang: 64, life: 0.3, color: YEL, a: 0.8, grow: 0.4 }); puff(0.8, 12); }
          const LB = LOBS[move];
          if (LB && f === LB[0]) {
            const [, f1, d, hgt] = LB, [x1, z1] = at(d), [hx, hz] = at(0.3, -0.25);
            fly(move === 'c2' ? 'pineapple' : 'melon', f1 - f, lob([hx, g0 + 0.9, hz], [x1, ground(x1, z1) + 0.25, z1], hgt),
              move === 'c2' ? (x, z) => splat(x, z, 3.0, YEL, GRN, 40) : (x, z) => { splat(x, z, 2.6, PINK, GRN, 30); fx.ring({ x, z, y: ground(x, z) + 0.3, r0: 0.3, r1: 1.6, life: 0.6, color: GRN, a: 0.7 }); }, 9, move === 'c2' ? 1.1 : 1.3);
          }
          if (move === 'c2' && f === 28) { const [x, z] = at(3.5); fx.ring({ x, z, y: g0 + 0.5, r0: 1, r1: 4.2, life: 0.4, color: GRN, a: 0.9 }); fx.sparks({ x, y: g0 + 0.6, z, n: 26, speed: 10, up: 4, life: 0.5, color: GRN }); }
          if (move === 'c4') {
            if (f >= 12 && f <= 36 && (f - 12) % 6 === 0) fx.ring({ x: hero.x, z: hero.z, y: g0 + 0.9, r0: 3.0, r1: 3.7, life: 0.25, color: YEL, a: 0.5 });
            if (f === 44) { const [x, z] = at(0.7); fx.cone({ x, z, y: g0 + 0.9, yaw: hero.yaw, range: 3.2, ang: 180, life: 0.3, color: YEL, a: 0.9, grow: 0.3 }); puff(1.5, 14, BROWN); }
          }
          if (move === 'c6') {
            if (f === DURIAN[1] - 10) { const [x, z] = at(DURIAN[2]), y = ground(x, z); fly('durian', 10, line([x, y + DURIAN[3], z], [x, y + 0.3, z]), (lx, lz) => { splat(lx, lz, 4.2, GRN, BROWN, 60); fx.ring({ x: lx, z: lz, y: ground(lx, lz) + 0.12, r0: 0.5, r1: 3.2, life: 0.6, color: BROWN, a: 1.2 }); flash = Math.max(flash, 0.5); }, 4, 1.4); }
            if (f >= 48 && f <= 72 && (f - 48) % 8 === 0) { const [x, z] = at(DURIAN[2]), y = ground(x, z); fx.ring({ x, z, y: y + 0.4, r0: 1, r1: 2.6, life: 0.6, color: GRN, a: 0.5 }); fx.tiles({ x, z, r: 2.0, n: 8, life: 1.1, color: GRN, y: y + 0.3, rise: 1.4 }); }
          }
          if (move === 'jc' && f === 6) { const [x1, z1] = at(2.2), [hx, hz] = at(0.3, -0.25); fly('peel', MOVES.jc.landFrame - 6, lob([hx, hero.y + g0 + 0.8, hz], [x1, ground(x1, z1) + 0.05, z1], 0.6), null, 6); }
          if (move === 'jc' && f === MOVES.jc.landFrame) {
            const [x1, z1] = at(2.4);
            fx.ring({ x: hero.x, z: hero.z, y: g0 + 0.12, r0: 0.6, r1: 2.6, life: 0.4, color: YEL, a: 1.2 });
            fx.beam({ from: [hero.x, g0 + 0.08, hero.z], to: [x1, ground(x1, z1) + 0.08, z1], w: 0.6, life: 0.5, color: YEL, a: 0.8 });
            fx.tiles({ x: hero.x, z: hero.z, r: 1.8, n: 12, life: 0.8, color: BROWN });
          }
        }
        if (mu.active) {
          if (t === SWAP[0]) { fx.ring({ x: hero.x, z: hero.z, y: g0 + 0.12, r0: 0.5, r1: 2.4, life: 0.4, color: YEL, a: 1.2 }); fx.tiles({ x: hero.x, z: hero.z, r: 1.4, n: 18, life: 1.0, color: BROWN }); fx.sparks({ x: hero.x, y: g0 + 1.0, z: hero.z, n: 30, speed: 5, up: 5, life: 0.6, color: YEL }); flash = Math.max(flash, 0.6); }
          const [r0, r1] = M.rampage;
          if (t >= r0 && t <= r1 && (t - r0) % M.poundEvery === 0) { fx.ring({ x: mu.px, z: mu.pz, y: ground(mu.px, mu.pz) + 0.12, r0: 0.4, r1: M.poundHit.range, life: 0.35, color: BROWN, a: 1.2 }); fx.tiles({ x: mu.px, z: mu.pz, r: 2.0, n: 12, life: 0.9, color: BROWN }); fx.sparks({ x: mu.px, y: ground(mu.px, mu.pz) + 0.3, z: mu.pz, n: 16, speed: 6, up: 5, life: 0.5, color: YEL }); }
          const [b0, b1] = M.beat;
          if (t >= b0 && t <= b1 && (t - b0) % M.beatEvery === 0) fx.ring({ x: hero.x, z: hero.z, y: g0 + 1.0, r0: 1, r1: mu.beatR, life: 0.4, color: YEL, a: 0.7 });
          if (t === M.leap) fx.tiles({ x: hero.x, z: hero.z, r: 1.6, n: 14, life: 0.8, color: BROWN });
        }
      }
      // the boomerang: out and back (N3), round him (Boomerang Orbit) — a smooth frame clock over the held sim frame
      if (f !== lastF) { lastF = f; sub = 0; } else sub = Math.min(1, sub + dt * 60);
      const F = move && FLIGHTS[move];
      let boom = null;
      if (F && f >= F[0] && f < F[2]) {
        boom = pool.find((o) => o.kind === 'boomerang' && o.t < o.life) || fly('boomerang', 600, (u, out) => out, null, 0, BOW_SCALE);
        boom.t = 0; boom.life = 1;                                    // kept alive while it flies; dropped the frame it is caught
        const ft = Math.min(F[2], f + sub), [f0, f1, f2, Rr] = F;
        let x, z, y = g0 + 1.0;
        if (move === 'n3') { const u = ft < f1 ? (ft - f0) / (f1 - f0) : 1 - (ft - f1) / (f2 - f1); [x, z] = at(0.4 + (Rr - 0.4) * u, 0.2 * (1 - u)); y += 0.3 * Math.sin(u * Math.PI); }
        else { const o = ft < 12 ? (ft - f0) / (12 - f0) : ft > f1 ? 1 - (ft - f1) / (f2 - f1) : 1, a = ft < 12 ? 0 : ft > f1 ? 2 * Math.PI * 1.5 : 2 * Math.PI * 1.5 * (ft - 12) / (f1 - 12); x = hero.x + Math.sin(hero.yaw + a) * Rr * o; z = hero.z + Math.cos(hero.yaw + a) * Rr * o; y += 0.1 * Math.sin(ft * 0.4); }
        boom.m.position.set(x, y, z); boom.m.rotation.set(Math.PI / 2, time * 40, 0);
      } else for (const o of pool) if (o.kind === 'boomerang' && o.t < o.life) { o.t = o.life; o.m.visible = false; }
      // the fruit in flight; each bursts where it lands
      for (const o of pool) {
        if (o === boom || o.t >= o.life) continue;
        o.t += dt;
        const u = Math.min(1, o.t / o.life);
        o.path(Math.min(1, u + 0.02), _d); o.path(u, o.m.position);
        if (_d.distanceToSquared(o.m.position) > 1e-6) o.m.lookAt(_d);
        if (o.spin) o.m.rotateZ(time * o.spin);
        if (o.t >= o.life) { o.m.visible = false; if (o.land) o.land(o.m.position.x, o.m.position.z); }
      }
      // the banana rain: 28 bananas tumble down over the ring after the landing, lie a moment, and are gone
      let n = 0;
      if (rainAt >= 0 && time - rainAt < 2.6) {
        for (let i = 0; i < RAIN; i++) {
          const t0 = h01(i, 1) * 0.6, u = (time - rainAt - t0) / 0.7;
          if (u < 0 || u > 2.4) continue;
          const a = h01(i, 2) * Math.PI * 2, r = 1.5 + h01(i, 3) * 6.5, x = rx + Math.sin(a) * r, z = rz + Math.cos(a) * r, y = ground(x, z);
          const fall = Math.min(1, u), yy = y + 0.1 + (1 - fall * fall) * 9, fade = u > 1.8 ? 1 - (u - 1.8) / 0.6 : 1;
          mR.compose(_p.set(x, yy, z), qR.setFromEuler(eR.set(fall < 1 ? time * 9 + i : 1.4, a + i, fall < 1 ? time * 6 : 0.3)), sR.set(1.6 * fade, 1.6 * fade, 1.6 * fade));
          rain.setMatrixAt(n++, mR);
        }
      }
      rain.count = n; if (n) rain.instanceMatrix.needsUpdate = true;
      fx.update(dt);
    },
    dispose() { fx.dispose(); ov.dispose(); void subs; },
  };
}
