// Alex's effects view (render-only; reads game.musou = ./musou.js and the hero's move, never writes sim state).
//  · Gale (C1): pale wind fans pulsing out of the open umbrella, a wide blue one on the last gust
//  · Cloudburst (C4): streaks of rain hammering a spot 5 m ahead, then the bolt; Twister (C6): rings of wind round him
//  · Overclock TYPHOON: a storm-blue vignette and the cut-in; rain hammering down round him and the twister's rings while he
//    flies; the storm ring, rising droplets and a flash on the drop
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { ground } from '../../world/map.js';
import { createFx } from '../shared/fx.js';
import { ALEX_MUSOU as M } from './musou.js';
import { CLOUD } from './moves.js';

const WIND = [1.6, 2.4, 2.8], RAIN = [0.5, 1.5, 3.0], WHITE = [2.6, 2.7, 2.8], BOLT = [3.0, 2.9, 1.6], DROPS = 90;

export function createMusouView(scene, game) {
  const mu = game.musou, hero = game.hero;
  const fx = createFx(scene);
  const ov = createOverlay({ sub: 'Typhoon', seal: 'ALEX',
    css: { big: 'color:#f2fbff; text-shadow: 0 0 2vh rgba(90,200,255,.9), 0 0 5vh rgba(47,127,214,.6);', sub: 'color:#bfeaff; text-shadow: 0 0 1vh rgba(0,0,0,.7);',
      seal: 'background:#5ac8ff; box-shadow: 0 0 2vh rgba(90,200,255,.6);' } });
  ov.dim.style.background = 'radial-gradient(ellipse at 50% 55%, rgba(220,240,255,1) 25%, rgba(10,24,56,1) 100%)';
  ov.wash.style.background = 'radial-gradient(circle at 50% 60%, rgba(220,245,255,0.9), rgba(60,130,255,0.2) 70%)';

  // the downpour: instanced streaks falling in a 7 m disc round him
  const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.7, 0.03), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 1.3, 2.0), transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }), DROPS);
  rain.frustumCulled = false; rain.visible = false; fx.root.add(rain);
  const m4 = new THREE.Matrix4();

  let key = -1, flash = 0, time = 0;
  const subs = [on('musou:burst', (e) => {
    if (game.musou !== mu) return;
    fx.ring({ x: e.x, z: e.z, r0: 1, r1: M.waveR, life: 0.5, color: RAIN, a: 1.3 });
    fx.ring({ x: e.x, z: e.z, r0: 0.6, r1: M.waveR * 0.8, life: 0.7, color: WHITE, a: 1.0 });
    fx.tiles({ x: e.x, z: e.z, r: M.waveR * 0.8, n: 50, life: 1.4, color: RAIN });
    fx.sparks({ x: e.x, y: ground(e.x, e.z) + 0.4, z: e.z, n: 60, speed: 10, up: 7, life: 1.2, color: WHITE });
    flash = 1;
  })];

  return {
    update(dt) {
      time += dt;
      const t = mu.active ? mu.t : 0, gy = ground(hero.x, hero.z), fwdX = Math.sin(hero.yaw), fwdZ = Math.cos(hero.yaw);
      ov.show(ov.dim, mu.active ? 0.55 * ramp(t, 0, 8) * (1 - ramp(t, M.activation - 4, M.activation + 8)) : 0);
      ov.cut(t, 6, mu.active ? ramp(t, 6, 10) * (1 - ramp(t, M.activation + 4, M.activation + 14)) : 0, ramp(t, 6, 12));
      flash = Math.max(0, flash - dt * 2.2);
      ov.show(ov.wash, flash * 0.5);
      // one-shot effects keyed on the sim frame of the move / the Overclock (hitstop holds the frame: no double spawns)
      const k = hero.state === 'attack' ? hero.moveSeq * 1000 + hero.moveT : mu.active ? -t : -1e9;
      if (k !== key) {
        key = k;
        if (hero.state === 'attack' && hero.move === 'c1') {
          const f = hero.moveT, x = hero.x + fwdX * 0.9, z = hero.z + fwdZ * 0.9;
          if (f >= 20 && f <= 44 && (f - 20) % 8 === 0) fx.cone({ x, z, y: gy + 1.1, yaw: hero.yaw, range: 4.8, ang: 120, life: 0.3, color: WIND, a: 0.45, grow: 0.25 });
          if (f === 48) { fx.cone({ x, z, y: gy + 1.1, yaw: hero.yaw, range: 5.4, ang: 130, life: 0.45, color: RAIN, a: 0.9, grow: 0.3 });
            fx.sparks({ x: hero.x + fwdX * 3, y: gy + 1.2, z: hero.z + fwdZ * 3, n: 24, speed: 8, up: 3, life: 0.7, color: WHITE }); }
        }
        if (hero.state === 'attack' && hero.move === 'c4') {                // Cloudburst: rain on the spot, then the bolt
          const f = hero.moveT, x = hero.x + fwdX * CLOUD.at, z = hero.z + fwdZ * CLOUD.at, y = ground(x, z);
          if (f >= 18 && f <= 42 && (f - 18) % 3 === 0) {
            const a = f * 2.4, r = CLOUD.r * (0.25 + 0.7 * ((f * 0.618) % 1)), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
            fx.beam({ from: [px + 0.5, y + 6, pz], to: [px, y + 0.1, pz], w: 0.14, life: 0.14, color: RAIN, a: 0.8 });
            if ((f - 18) % 6 === 0) { fx.ring({ x, z, y: y + 0.1, r0: 0.4, r1: CLOUD.r, life: 0.3, color: RAIN, a: 0.6 }); fx.sparks({ x: px, y: y + 0.2, z: pz, n: 8, speed: 3, up: 4, life: 0.4, color: WHITE }); }
          }
          if (f === 46) {
            fx.beam({ from: [x + 0.6, y + 9, z + 0.3], to: [x, y + 0.1, z], w: 1.1, life: 0.3, color: BOLT, a: 1 });
            fx.ring({ x, z, y: y + 0.12, r0: 0.5, r1: CLOUD.r + 0.4, life: 0.4, color: BOLT, a: 1.2 });
            fx.sparks({ x, y: y + 0.4, z, n: 36, speed: 8, up: 7, life: 0.8, color: WHITE }); fx.tiles({ x, z, r: CLOUD.r, n: 16, life: 0.9, color: RAIN });
            flash = Math.max(flash, 0.5);
          }
        }
        if (hero.state === 'attack' && hero.move === 'c6') {                // Twister: the whirl round him as he travels
          const f = hero.moveT;
          if (f >= 12 && f <= 52 && (f - 12) % 8 === 0) fx.ring({ x: hero.x, z: hero.z, y: gy + 0.2 + ((f - 12) % 16 ? 1.0 : 0), r0: 0.8, r1: 3.0, life: 0.3, color: WIND, a: 0.8 });
          if (f === 60) { fx.ring({ x: hero.x, z: hero.z, y: gy + 0.12, r0: 0.6, r1: 4.2, life: 0.4, color: RAIN, a: 1.1 }); fx.tiles({ x: hero.x, z: hero.z, r: 3, n: 18, life: 1.0, color: WIND, rise: 4 }); }
        }
        if (mu.active && t >= M.flight[0] && t <= M.flight[1] && (t - M.flight[0]) % M.twEvery === 0) {   // the Overclock's twister
          const j = (t - M.flight[0]) / M.twEvery;
          fx.ring({ x: hero.x, z: hero.z, y: gy + 0.15, r0: 1, r1: M.twR, life: 0.35, color: WIND, a: 0.9 });
          fx.ring({ x: hero.x, z: hero.z, y: gy + 1.2 + (j % 3) * 0.8, r0: 0.6, r1: M.twR * 0.7, life: 0.4, color: RAIN, a: 0.6 });
          fx.sparks({ x: hero.x + Math.sin(j * 1.9) * 2.6, y: gy + 0.3, z: hero.z + Math.cos(j * 1.9) * 2.6, n: 10, speed: 5, up: 6, life: 0.6, color: WHITE });
        }
      }
      // the downpour
      const wet = mu.active && t >= M.activation - 4 && t < M.end - 6;
      rain.visible = wet;
      if (wet) {
        rain.material.opacity = 0.7 * ramp(t, M.activation - 4, M.activation + 8) * (1 - ramp(t, M.end - 20, M.end - 6));
        for (let i = 0; i < DROPS; i++) {
          const a = i * 2.399, r = 0.6 + 6.4 * ((i * 0.618) % 1), y = 6 - ((time * (9 + (i % 5)) + i * 1.7) % 6);
          rain.setMatrixAt(i, m4.makeTranslation(hero.x + Math.sin(a) * r, gy + y, hero.z + Math.cos(a) * r));
        }
        rain.instanceMatrix.needsUpdate = true;
      }
      fx.update(dt);
    },
    dispose() { fx.dispose(); ov.dispose(); void subs; },
  };
}
