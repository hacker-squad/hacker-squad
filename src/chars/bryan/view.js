// Bryan's effects view (render-only; reads game.musou = ./musou.js and the hero's move, never writes sim state).
//  · the road crew's props, voxel traffic cones and roadworks fences, on the frames of ./moves.js PROPS: the cone of Cone
//    Punt stood up and batted down the lane, the one that springs up on Pop-Up, the fence shoved along and heaved over on
//    Barricade, the three cones of Detour, the ring of cones of Cone Scatter
//  · the STOP flash (N3): a red cone down the lane and a red blink of the screen; Jackhammer: dust and a ring on every
//    beat, cracked tiles when the floor gives; the dash: dust off the shield's foot
//  · Overclock ROAD CLOSED: an amber vignette and the cut-in; four fence walls dropping round him; the cones raining into
//    the pen; the fences flying, the shock ring, rising tiles and a flash when the sign is slammed down
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { boxesGeometry } from '../../core/voxel.js';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { ground } from '../../world/map.js';
import { createFx } from '../shared/fx.js';
import { BRYAN_MUSOU as M, CONES } from './musou.js';
import { PROPS } from './moves.js';

const RED = [3.0, 0.5, 0.35], AMBER = [3.0, 2.0, 0.4], ORANGE = [3.0, 1.1, 0.25], WHITE = [2.8, 2.7, 2.4];
const D2R = Math.PI / 180, PANELS = [-3.9, -1.3, 1.3, 3.9];
const bx = (s, p, c) => ({ s, p, c });

/** A traffic cone (origin: the middle of its base, 0.65 m tall): a square foot, orange tiers, two white bands. */
function coneGeo() {
  const out = [bx([0.42, 0.05, 0.42], [0, 0.025, 0], 0xd8500c)];
  for (let i = 0; i < 7; i++) { const w = 0.3 - i * 0.036; out.push(bx([w, 0.086, w], [0, 0.05 + (i + 0.5) * 0.085, 0], i === 2 || i === 4 ? 0xf6f6f2 : 0xff6a1a)); }
  return boxesGeometry(out);
}
/** A roadworks fence panel (origin: the middle of its foot line, 2.6 m along X, 1.2 m tall): two feet, two posts, two
 *  red-and-white boards, an amber lamp on one post. */
function fenceGeo() {
  const out = [];
  for (const x of [-1.1, 1.1]) out.push(bx([0.14, 0.08, 0.6], [x, 0.04, 0], 0x3a3d46), bx([0.08, 1.1, 0.08], [x, 0.6, 0], 0xd8dce0));
  for (const y of [0.98, 0.56]) for (let k = 0; k < 6; k++) out.push(bx([0.4, 0.22, 0.05], [-1 + k * 0.4, y, 0], (k + (y > 0.8 ? 0 : 1)) % 2 ? 0xf6f6f2 : 0xee2e24));
  out.push(bx([0.14, 0.14, 0.14], [1.1, 1.22, 0], 0xffb02e));
  return boxesGeometry(out);
}
/** n instances of geo, laid out afresh every frame: begin() · put(x, y, z, ry, rx, scale) · end(). */
function instanced(root, geo, mat, n) {
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false; mesh.castShadow = true; mesh.count = 0; root.add(mesh);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), p = new THREE.Vector3(), s = new THREE.Vector3();
  let k = 0;
  return {
    begin() { k = 0; },
    put(x, y, z, ry = 0, rx = 0, sc = 1) { if (k < n && sc > 0.02) mesh.setMatrixAt(k++, m4.compose(p.set(x, y, z), q.setFromEuler(e.set(rx, ry, 0)), s.setScalar(sc))); },
    end() { mesh.count = k; mesh.instanceMatrix.needsUpdate = true; },
  };
}

export function createMusouView(scene, game) {
  const mu = game.musou, hero = game.hero;
  const fx = createFx(scene);
  const ov = createOverlay({ sub: 'Road Closed', seal: 'BRYAN',
    css: { big: 'color:#fff6e0; text-shadow: 0 0 2vh rgba(255,210,30,.9), 0 0 5vh rgba(216,38,30,.6);', sub: 'color:#ffe9a0; text-shadow: 0 0 1vh rgba(0,0,0,.7);',
      seal: 'background:#ffd21e; box-shadow: 0 0 2vh rgba(255,210,30,.6);' } });
  ov.dim.style.background = 'radial-gradient(ellipse at 50% 55%, rgba(255,240,210,1) 25%, rgba(48,20,0,1) 100%)';
  ov.wash.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,120,100,0.9), rgba(255,60,40,0.3) 75%)';
  const propMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, emissive: new THREE.Color(0xff5a10), emissiveIntensity: 0.25 });
  const cones = instanced(fx.root, coneGeo(), propMat, 40), fences = instanced(fx.root, fenceGeo(), propMat, 20);
  const CS = 1.6;                                                    // the cones are drawn a little over life size: they must read in a crowd

  // props of the charges: { t, life (s), draw(u, o) } — aged with the sim's dt, so hitstop holds them
  const items = [];
  const add = (life, draw, end) => items.push({ t: 0, life, draw, end });
  const dust = (x, z, n, color = AMBER) => fx.sparks({ x, y: ground(x, z) + 0.15, z, n, speed: 3.5, up: 2.5, life: 0.45, color });
  const burst = (x, z, r, color = ORANGE) => { fx.ring({ x, z, y: ground(x, z) + 0.12, r0: 0.3, r1: r, life: 0.32, color, a: 1.1 }); dust(x, z, 12, color); };
  /** A cone sent skidding from d0 to d1 m out along world yaw `a` from (x0, z0) in `frames`, tumbling, hopping `h` m. */
  const skid = (x0, z0, a, d0, d1, frames, h = 0.35) => add(frames / 60, (u) => {
    const d = d0 + (d1 - d0) * u, x = x0 + Math.sin(a) * d, z = z0 + Math.cos(a) * d;
    cones.put(x, ground(x, z) + 0.25 + Math.abs(Math.sin(u * Math.PI * 2)) * h, z, a, u * 14, CS);
  }, () => burst(x0 + Math.sin(a) * d1, z0 + Math.cos(a) * d1, 1.6));

  let flash = 0, key = -1;
  const blink = (v) => { flash = Math.max(flash, v); };
  const subs = [on('musou:burst', (e) => {
    if (game.musou !== mu) return;
    fx.ring({ x: e.x, z: e.z, r0: 1, r1: M.waveR, life: 0.5, color: AMBER, a: 1.3 });
    fx.ring({ x: e.x, z: e.z, r0: 0.6, r1: M.waveR * 0.8, life: 0.7, color: RED, a: 1.0 });
    fx.tiles({ x: e.x, z: e.z, r: M.waveR * 0.8, n: 50, life: 1.4, color: AMBER });
    fx.sparks({ x: e.x, y: ground(e.x, e.z) + 0.4, z: e.z, n: 70, speed: 10, up: 7, life: 1.2, color: WHITE });
    blink(1);
  })];

  return {
    update(dt) {
      const t = mu.active ? mu.t : 0, gy = ground(hero.x, hero.z), yaw = hero.yaw, fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
      const ahead = (d) => [hero.x + fwdX * d, hero.z + fwdZ * d];
      ov.show(ov.dim, mu.active ? 0.55 * ramp(t, 0, 8) * (1 - ramp(t, M.activation - 4, M.activation + 8)) : 0);
      ov.cut(t, 6, mu.active ? ramp(t, 6, 10) * (1 - ramp(t, M.activation + 4, M.activation + 14)) : 0, ramp(t, 6, 12));
      flash = Math.max(0, flash - dt * 4);
      ov.show(ov.wash, flash * 0.45);
      const k = hero.state === 'attack' ? hero.moveSeq * 1000 + hero.moveT : mu.active ? -t : -1e9;
      if (k !== key) {
        key = k;
        if (hero.state === 'attack') {
          const f = hero.moveT, id = hero.move, hx = hero.x, hz = hero.z;
          if (id === 'n3' && f === 10) { fx.cone({ x: hx + fwdX * 0.6, z: hz + fwdZ * 0.6, y: gy + 1.5, yaw, range: 3.8, ang: 100, life: 0.22, color: RED, a: 0.8, grow: 0.5 }); blink(0.3); }
          if (id === 'dash' && f >= 4 && f <= 24 && f % 3 === 0) dust(...ahead(0.7), 5);
          if (id === 'c1') {
            const c = PROPS.c1, [x, z] = ahead(1.0);
            if (f === c.set) add((c.hit - c.set) / 60, (u) => cones.put(x, ground(x, z), z, yaw, 0, CS * Math.min(1, u * 4)));
            if (f === c.hit) { skid(hx, hz, yaw, 1.0, c.len, c.land - c.hit, 0.5); burst(x, z, 1.4, WHITE); }
          }
          if (id === 'c2' && f === PROPS.c2.pop) {
            const [x, z] = ahead(PROPS.c2.at);
            add(0.7, (u) => cones.put(x, ground(x, z) + Math.sin(u * Math.PI) * 3.4, z, yaw + u * 9, 0, CS * 1.5 * Math.min(1, u * 6, (1 - u) * 5)));
            burst(x, z, 2.4); fx.tiles({ x, z, r: 1.4, n: 10, life: 0.7, color: AMBER });
          }
          if (id === 'c3' && f === PROPS.c3.drop) {
            const c = PROPS.c3, f0 = f;
            add((c.heave + 16 - f0) / 60, (u, o) => {
              const fr = f0 + o.t * 60, v = Math.max(0, (fr - c.heave) / 16), d = c.at + v * 3.4, x = hero.x + Math.sin(hero.yaw) * d, z = hero.z + Math.cos(hero.yaw) * d;
              const drop = Math.max(0, 1 - (fr - f0) / (c.push[0] - f0));
              fences.put(x, ground(x, z) + drop * drop * 2.2 + Math.sin(Math.min(1, v) * Math.PI) * 1.3, z, hero.yaw, v * 1.7, 1.5 * (1 - v * v * v));
            });
          }
          if (id === 'c3' && f > PROPS.c3.push[0] && f <= PROPS.c3.push[1] && f % 3 === 0) dust(...ahead(PROPS.c3.at), 5);
          if (id === 'c3' && f === PROPS.c3.heave) burst(...ahead(2.6), 3, AMBER);
          if (id === 'c4') for (const [kf, dir] of PROPS.c4.kicks) if (f === kf) { skid(hx, hz, yaw + dir * D2R, 0.8, PROPS.c4.len, PROPS.c4.flight); dust(...ahead(0.8), 6, WHITE); }
          if (id === 'c5') {
            const [f0, f1, ev] = PROPS.c5.ticks, [x, z] = ahead(0.6);
            if (f >= f0 && f <= f1 && (f - f0) % ev === 0) { fx.ring({ x, z, y: gy + 0.12, r0: 0.3, r1: 3.2, life: 0.25, color: AMBER, a: 0.7 }); dust(x, z, 8, WHITE); }
            if (f === PROPS.c5.burst) { fx.ring({ x, z, y: gy + 0.12, r0: 0.5, r1: 4.6, life: 0.4, color: RED, a: 1.2 }); fx.tiles({ x, z, r: 3.4, n: 26, life: 1.0, color: AMBER }); dust(x, z, 24, WHITE); }
          }
          if (id === 'c6') {
            const c = PROPS.c6;
            if (f === c.out) for (let j = 0; j < c.n; j++) skid(hx, hz, yaw + j * Math.PI * 2 / c.n, 1.2, c.len, c.flight);
            if (f === c.slam) { fx.ring({ x: hx, z: hz, y: gy + 0.12, r0: 0.5, r1: 4.4, life: 0.4, color: AMBER, a: 1.2 }); fx.tiles({ x: hx, z: hz, r: 3, n: 18, life: 0.9, color: RED }); }
          }
        }
        if (mu.active) {
          M.walls.forEach((f, j) => { if (t === f) { const [x, z] = mu.wall(j); fx.ring({ x, z, y: ground(x, z) + 0.12, r0: 0.6, r1: 4.5, life: 0.35, color: RED, a: 1.1 }); dust(x, z, 20); blink(0.35); } });
          if (t >= M.rain[0] && t <= M.rain[1] && (t - M.rain[0]) % M.rainEvery === 0) burst(...mu.cone((t - M.rain[0]) / M.rainEvery), M.coneHit.range);
        }
      }
      cones.begin(); fences.begin();
      for (let i = items.length - 1; i >= 0; i--) {
        const o = items[i];
        o.t += dt;
        if (o.t >= o.life) { o.end?.(); items.splice(i, 1); } else o.draw(o.t / o.life, o);
      }
      if (mu.active) {
        // the walls: each drops over its last frames, stands, then flies outwards on the finisher
        const v = Math.max(0, (t - M.finisher) / 24), out = v * 7, up = Math.sin(Math.min(1, v) * Math.PI) * 3;
        if (v < 1) M.walls.forEach((f, j) => {
          const u = (t - (f - M.wallDrop)) / M.wallDrop;
          if (u < 0) return;
          const [wx, wz, wy] = mu.wall(j), fall = Math.max(0, 1 - u), tx = Math.cos(wy), tz = -Math.sin(wy);
          for (const s of PANELS) {
            const x = wx + tx * s - Math.sin(wy) * out, z = wz + tz * s - Math.cos(wy) * out;
            fences.put(x, ground(x, z) + fall * fall * 10 + up, z, wy, -v * 2.2, 1.5 * (1 - v * v));
          }
        });
        // the cones: each falls over its last frames, bounces where it lands, shrinks away
        for (let j = 0; j < CONES; j++) {
          const land = M.rain[0] + j * M.rainEvery, a = t - land;
          if (a < -M.coneFall || a > 26) continue;
          const [x, z] = mu.cone(j), u = Math.max(0, -a / M.coneFall);
          const y = a < 0 ? u * 11 : Math.abs(Math.sin(a * 0.35)) * 0.8 * Math.max(0, 1 - a / 18);
          cones.put(x, ground(x, z) + y, z, j * 1.3 + a * 0.2, a < 0 ? u * 5 : 0, CS * 1.7 * (a > 16 ? Math.max(0, 1 - (a - 16) / 10) : 1));
        }
      }
      cones.end(); fences.end();
      fx.update(dt);
    },
    dispose() { fx.dispose(); ov.dispose(); void subs; },
  };
}
