// Clara's effects view (render-only; reads game.musou = ./musou.js and the hero's move, never writes sim state).
//  · fire on the broom's moves: embers off every swat, a tongue of flame down the lane on the fire jab, a ring per turn
//    of Fire Wheel, a pillar on Cauldron Pop, the flame cones of Dragon Breath, a ring of fire under the Broom Dive
//  · her bats: three always circle her hat; the whole swarm joins on Bat Swarm (C6) and pours out in the Overclock
//  · pumpkins: the three lobbed bombs of Pumpkin Toss (C5) and of the Overclock fly their arcs and burst; the Great Pumpkin
//    falls on the finisher
//  · Overclock WITCHING HOUR: a violet vignette and the cut-in, the swarm widening round her, the three blasts, then the ring
//    of fire, rising embers and a flash
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { vox } from '../../hero/model.js';
import { boxesGeometry } from '../../core/voxel.js';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { ground } from '../../world/map.js';
import { createFx } from '../shared/fx.js';
import { B, Pt } from '../shared/body.js';
import { ball } from '../shared/squat.js';
import { CLARA_MUSOU as M } from './musou.js';
import { MOVES, TOSSES } from './moves.js';

const FIRE = [3.0, 1.3, 0.3], HOT = [3.0, 2.3, 0.8], VIOLET = [1.9, 0.7, 3.0], BATS = 26;
const bx = (s, p, c) => ({ s, p, c });

/** A jack-o'-lantern (voxels of 4 cm, centred): ribbed orange, a carved face lit from inside, a green stalk. */
function pumpkinGeo() {
  const skin = (x) => ((x + 40) % 3 === 0 ? 0xd8620c : 0xff8a1e), LIT = 0xffe36a;
  return vox([
    ball([0, 0, 0], [6.4, 5.2, 6.4], skin),
    B([-1, 5, -1], [1, 8, 1], 0x4f8f3e), B([1, 7, -1], [3, 8, 1], 0x4f8f3e),
    Pt([-4, 1, 3], [-1, 3, 8], LIT), Pt([1, 1, 3], [4, 3, 8], LIT), Pt([-3, 3, 3], [-2, 4, 8], LIT), Pt([2, 3, 3], [3, 4, 8], LIT),   // eyes
    Pt([-4, -3, 3], [4, -2, 8], LIT), Pt([-3, -4, 3], [-1, -3, 8], LIT), Pt([1, -4, 3], [3, -3, 8], LIT), Pt([-1, -2, 3], [1, -1, 8], LIT),   // a jagged grin
  ], 0.04, { jitter: 0.05, ao: 0.3 });
}

export function createMusouView(scene, game) {
  const mu = game.musou, hero = game.hero;
  const fx = createFx(scene);
  const ov = createOverlay({ sub: 'Witching Hour', seal: 'CLARA',
    css: { big: 'color:#fff0e0; text-shadow: 0 0 2vh rgba(255,138,30,.9), 0 0 5vh rgba(150,70,255,.7);', sub: 'color:#ffd0a0; text-shadow: 0 0 1vh rgba(0,0,0,.7);',
      seal: 'background:#c58aff; box-shadow: 0 0 2vh rgba(197,138,255,.6);' } });
  ov.dim.style.background = 'radial-gradient(ellipse at 50% 55%, rgba(240,220,255,1) 25%, rgba(30,8,52,1) 100%)';
  ov.wash.style.background = 'radial-gradient(circle at 50% 60%, rgba(255,230,180,0.9), rgba(255,120,30,0.25) 70%)';

  // ---- bats: body + two wings per bat (instanced), flapping about the body's long axis
  const batMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  const inst = (boxes) => { const m = new THREE.InstancedMesh(boxesGeometry(boxes), batMat, BATS); m.frustumCulled = false; m.count = 0; fx.root.add(m); return m; };
  const body = inst([bx([0.1, 0.1, 0.16], [0, 0, 0], 0x2a1838), bx([0.03, 0.05, 0.03], [-0.035, 0.07, 0.04], 0x2a1838), bx([0.03, 0.05, 0.03], [0.035, 0.07, 0.04], 0x2a1838),
    bx([0.022, 0.022, 0.01], [-0.025, 0.01, 0.082], 0xffb02e), bx([0.022, 0.022, 0.01], [0.025, 0.01, 0.082], 0xffb02e)]);
  const wing = (s) => inst([bx([0.2, 0.02, 0.14], [s * 0.14, 0, 0], 0x4a2a68), bx([0.14, 0.02, 0.1], [s * 0.3, 0, -0.02], 0x3a2052)]);
  const wingL = wing(1), wingR = wing(-1), pres = new Float32Array(BATS);
  const mB = new THREE.Matrix4(), mW = new THREE.Matrix4(), mR = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const h01 = (i, k) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

  // ---- pumpkins: four lobbed bombs and the Great Pumpkin
  const pGeo = pumpkinGeo();
  const pMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, emissive: new THREE.Color(0xff6a10), emissiveIntensity: 0.55 });
  const bombs = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(pGeo, pMat); m.visible = false; m.castShadow = true; fx.root.add(m); return { m, t: 0, life: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), r: 0 }; });
  const great = new THREE.Mesh(pGeo, pMat); great.visible = false; great.castShadow = true; fx.root.add(great);
  const lob = (to, frames, r) => {
    const b = bombs.find((o) => o.t >= o.life) || bombs[0];
    b.from.set(hero.x + Math.sin(hero.yaw) * 0.4, ground(hero.x, hero.z) + 1.2, hero.z + Math.cos(hero.yaw) * 0.4);
    b.to.set(to[0], ground(to[0], to[1]) + 0.3, to[1]); b.t = 0; b.life = frames / 60; b.r = r; b.m.visible = true;
  };
  const blast = (x, z, r) => {
    const y = ground(x, z);
    fx.ring({ x, z, y: y + 0.12, r0: 0.4, r1: r, life: 0.4, color: FIRE, a: 1.3 });
    fx.ring({ x, z, y: y + 0.6, r0: 0.3, r1: r * 0.7, life: 0.5, color: HOT, a: 0.9 });
    fx.sparks({ x, y: y + 0.5, z, n: 34, speed: 8, up: 7, life: 0.9, color: FIRE });
    fx.tiles({ x, z, r: r * 0.7, n: 14, life: 0.9, color: HOT });
  };

  let key = -1, flash = 0, time = 0;
  const subs = [on('musou:burst', (ev) => {
    if (game.musou !== mu) return;
    fx.ring({ x: ev.x, z: ev.z, r0: 1, r1: M.waveR, life: 0.5, color: FIRE, a: 1.3 });
    fx.ring({ x: ev.x, z: ev.z, r0: 0.6, r1: M.waveR * 0.8, life: 0.7, color: VIOLET, a: 1.1 });
    fx.tiles({ x: ev.x, z: ev.z, r: M.waveR * 0.8, n: 50, life: 1.4, color: HOT });
    fx.sparks({ x: ev.x, y: ground(ev.x, ev.z) + 0.4, z: ev.z, n: 80, speed: 11, up: 8, life: 1.3, color: FIRE });
    flash = 1;
  })];

  return {
    update(dt) {
      time += dt;
      const t = mu.active ? mu.t : 0, gy = ground(hero.x, hero.z), fwdX = Math.sin(hero.yaw), fwdZ = Math.cos(hero.yaw);
      const at = (d) => [hero.x + fwdX * d, hero.z + fwdZ * d];
      ov.show(ov.dim, mu.active ? 0.55 * ramp(t, 0, 8) * (1 - ramp(t, M.activation - 4, M.activation + 8)) : 0);
      ov.cut(t, 6, mu.active ? ramp(t, 6, 10) * (1 - ramp(t, M.activation + 4, M.activation + 14)) : 0, ramp(t, 6, 12));
      flash = Math.max(0, flash - dt * 2.2);
      ov.show(ov.wash, flash * 0.5);
      const move = hero.state === 'attack' ? hero.move : null, f = hero.moveT;
      // one-shot effects keyed on the sim frame of the move / the Overclock (hitstop holds the frame: no double spawns)
      const k = move ? hero.moveSeq * 1000 + f : mu.active ? -t : -1e9;
      if (k !== key) {
        key = k;
        const cone = (range, ang, color, a, life = 0.28) => fx.cone({ x: hero.x + fwdX * 0.7, z: hero.z + fwdZ * 0.7, y: gy + 0.9, yaw: hero.yaw, range, ang, life, color, a, grow: 0.3 });
        const embers = (d, n = 8, up = 3) => { const [x, z] = at(d); fx.sparks({ x, y: gy + 0.8, z, n, speed: 4, up, life: 0.5, color: FIRE }); };
        if (move) {
          const m = MOVES[move];
          if (/^n[1-4]$|^dash$|^jatk$/.test(move)) for (const w of m.hits) if (f === w.f[0]) embers(1.3);
          if (move === 'n5' && f === 8) { const [x0, z0] = at(0.9), [x1, z1] = at(4); fx.beam({ from: [x0, gy + 0.8, z0], to: [x1, gy + 0.7, z1], w: 0.5, life: 0.22, color: FIRE, a: 1 }); embers(3, 12); }
          if (move === 'n6' && f === 22) { fx.ring({ x: hero.x, z: hero.z, y: gy + 0.12, r0: 0.5, r1: 2.6, life: 0.35, color: FIRE, a: 1.2 }); embers(0.6, 16, 5); }
          if (move === 'c1' && [14, 24, 34, 43].includes(f)) fx.ring({ x: hero.x, z: hero.z, y: gy + 0.7, r0: 0.6, r1: 2.3, life: 0.28, color: f === 43 ? HOT : FIRE, a: 1.1 });
          if (move === 'c2' && f === 14) { cone(2.7, 120, FIRE, 1, 0.3); embers(1.6, 16, 5); }
          if (move === 'c3' && f === 12) { const [x, z] = at(1.4); fx.beam({ from: [x, gy + 0.1, z], to: [x, gy + 4.2, z], w: 1.1, life: 0.4, color: FIRE, a: 1 });
            fx.ring({ x, z, y: gy + 0.12, r0: 0.3, r1: 1.8, life: 0.3, color: HOT, a: 1 }); embers(1.4, 20, 8); }
          if (move === 'c4' && f >= 14 && f <= 30 && (f - 14) % 4 === 0) { cone(4.6, 60, f % 8 ? HOT : FIRE, 0.6, 0.24); embers(2 + (f - 14) * 0.14, 6); }
          if (move === 'c4' && f === 34) { cone(5.3, 70, FIRE, 1, 0.42); embers(3.5, 22, 5); }
          if (move === 'c5') for (const [f0, f1, d] of TOSSES) { if (f === f0) lob(at(d), f1 - f0, 2.2); }
          if (move === 'c6' && f === 62) { fx.ring({ x: hero.x, z: hero.z, y: gy + 0.12, r0: 0.6, r1: 3.8, life: 0.4, color: VIOLET, a: 1.2 }); embers(0.5, 26, 6); }
          if (move === 'jc' && f === MOVES.jc.landFrame) { fx.ring({ x: hero.x, z: hero.z, y: gy + 0.12, r0: 0.6, r1: 3.8, life: 0.4, color: FIRE, a: 1.2 });
            fx.tiles({ x: hero.x, z: hero.z, r: 2.6, n: 14, life: 0.8, color: HOT }); }
        }
        if (mu.active) {
          if (t >= M.bats[0] && t <= M.bats[1] && (t - M.bats[0]) % 16 === 0) fx.ring({ x: hero.x, z: hero.z, y: gy + 1.2, r0: 1, r1: mu.batR, life: 0.4, color: VIOLET, a: 0.7 });
          M.bombs.forEach((fr, j) => { if (t === fr - M.bombFlight) lob(mu.bomb(j), M.bombFlight, M.bombR); });
        }
      }
      // pumpkins in flight; each bursts where it lands
      for (const b of bombs) {
        if (b.t >= b.life) continue;
        b.t += dt;
        const u = Math.min(1, b.t / b.life);
        b.m.position.lerpVectors(b.from, b.to, u); b.m.position.y += Math.sin(u * Math.PI) * 2.2;
        b.m.rotation.set(time * 9, time * 5, 0);
        if (b.t >= b.life) { b.m.visible = false; blast(b.to.x, b.to.z, b.r); }
      }
      // the Great Pumpkin: falls over the last 14 frames before the finisher, squashes on the ground, gone in the burst
      const gp = mu.active && t >= M.finisher - 14 && t < M.finisher + 6;
      great.visible = gp;
      if (gp) {
        const u = Math.min(1, (t - (M.finisher - 14)) / 14), sq = t >= M.finisher ? 1 - 0.12 * (t - M.finisher) : 1;
        great.position.set(hero.x + fwdX * 2.4, gy + 1.1 + (1 - u * u) * 13, hero.z + fwdZ * 2.4);
        great.scale.set(5 / Math.sqrt(Math.max(0.2, sq)), 5 * Math.max(0.2, sq), 5 / Math.sqrt(Math.max(0.2, sq)));
        great.rotation.set(0, hero.yaw + Math.PI, 0);
      }
      // bats: three keep her company; the swarm on Bat Swarm and in the Overclock
      const swarm = (move === 'c6' && f >= 8 && f <= 62) || (mu.active && t >= M.bats[0] - 6 && t <= M.bats[1] + 14);
      const R = mu.active && mu.batR ? mu.batR : move === 'c6' ? 2.8 : 1.0;
      let n = 0;
      for (let i = 0; i < BATS; i++) {
        pres[i] += ((swarm || (i < 3 && !hero.dead) ? 1 : 0) - pres[i]) * Math.min(1, dt * 6);
        if (pres[i] < 0.03) continue;
        const a = time * (swarm ? 3.2 + h01(i, 1) * 2.4 : 1.2 + i * 0.3) * (i % 2 ? 1 : -1) + i * 2.4, r = i < 3 && !swarm ? 0.75 : R * (0.4 + 0.6 * h01(i, 2));
        const y = gy + (i < 3 && !swarm ? 1.75 + i * 0.12 : 0.6 + 1.9 * h01(i, 3)) + Math.sin(time * 5 + i) * 0.12 + (1 - pres[i]) * 2.5;
        const sc = (i < 3 ? 1 : 0.85 + 0.5 * h01(i, 4)) * pres[i];
        mB.compose(p3.set(hero.x + Math.sin(a) * r, y, hero.z + Math.cos(a) * r), q.setFromEuler(e.set(0, a + (i % 2 ? Math.PI / 2 : -Math.PI / 2), 0)), s3.set(sc, sc, sc));
        const flap = Math.sin(time * 24 + i * 1.7) * 0.7;
        body.setMatrixAt(n, mB);
        wingL.setMatrixAt(n, mW.multiplyMatrices(mB, mR.makeRotationZ(flap)));
        wingR.setMatrixAt(n, mW.multiplyMatrices(mB, mR.makeRotationZ(-flap)));
        n++;
      }
      for (const m of [body, wingL, wingR]) { m.count = n; m.instanceMatrix.needsUpdate = true; }
      fx.update(dt);
    },
    dispose() { fx.dispose(); ov.dispose(); void subs; },
  };
}
