// Voxel Clara on the squat rig (src/chars/shared/squat.js): a little cat in a witch's costume — plum-dark fur, a white
// muzzle, big green-gold eyes, whiskers, ears poking up through the brim of a tall bent witch's hat (orange band, gold
// buckle), a purple dress with an orange belt and hem over a flared skirt, striped stockings and buckled boots. Weapon:
// a broom whose bristles are on fire (weapon joint: origin = the lower grip, the stick along +Z, the burning bristles at
// the far end, 1.08 m at her size).
// Render-only life (createClaraSecondary): the flame on the bristles flickering, her short cape and her tail (spring
// chains).
import * as THREE from 'three';
import { vox } from '../../hero/model.js';
import { boxesGeometry } from '../../core/voxel.js';
import { hash01 } from '../../core/rng.js';
import { B, Pt, hex, fighterMaterial } from '../shared/body.js';
import { ball, limbs, buildSquat } from '../shared/squat.js';
import { createChains } from '../shared/chains.js';

export const CC = {
  fur: hex('#3e3650'), furD: hex('#2a2438'), furL: hex('#5c5278'), white: hex('#f4eee6'), nose: hex('#f08a9a'), eye: hex('#d8f04a'), pupil: hex('#16121c'),
  hat: hex('#6a2fa8'), hatD: hex('#4a1f7a'), orange: hex('#ff8a1e'), orangeD: hex('#d8620c'), gold: hex('#ffd75e'), dress: hex('#5a2a8a'), dressD: hex('#421e68'),
  boot: hex('#2a1c38'), wood: hex('#8a5a2e'), woodD: hex('#6a4220'), straw: hex('#d8b45a'), strawD: hex('#b08a36'), ember: hex('#ff6a1e'), flame: hex('#ffc23a'),
};
/** Broom model scale at her size, and its anchors in weapon space (m): the bristles (trail), the flame. */
export const BROOM_SCALE = 0.75;
export const BROOM = { tip: 1.44 * BROOM_SCALE, base: 1.0 * BROOM_SCALE, butt: 0.3 * BROOM_SCALE };
const fur = (x, y, z) => (hash01(x * 3, y, z) < 0.16 ? CC.furD : hash01(z, x, y * 5) < 0.1 ? CC.furL : CC.fur);

/** Head (voxels of 3 cm, chin at y 0, facing +Z): the cat's round head, and the hat on top of it. */
export function head() {
  // the hat's cone: its axis leans back as it climbs, the tip flops to her left
  const cone = (x, y, z) => {
    const u = (y - 13) / 14, r = 6.6 * (1 - u) + 0.6, cx = Math.max(0, y - 21) * 0.7, cz = -1 - (y - 13) * 0.3;
    if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) > r) return null;
    return y < 16 ? CC.orange : hash01(x, y, z) < 0.12 ? CC.hatD : CC.hat;
  };
  return [
    ball([0, 7, 0], [8, 6.8, 6.8], fur),
    ball([0, 3.4, 5.6], [3.6, 2.6, 2.6], CC.white),                   // the white muzzle
    Pt([-1, 4, 7], [1, 5, 9], CC.nose), Pt([-1, 2, 6], [1, 3, 9], CC.pupil),             // nose, mouth
    Pt([-6, 6, 2], [-2, 10, 8], CC.eye), Pt([2, 6, 2], [6, 10, 8], CC.eye),              // big eyes, slit pupils, catch-lights
    Pt([-4, 6, 2], [-3, 10, 8], CC.pupil), Pt([3, 6, 2], [4, 10, 8], CC.pupil),
    Pt([-6, 9, 2], [-5, 10, 8], 0xffffff), Pt([2, 9, 2], [3, 10, 8], 0xffffff),
    B([-12, 4, 4], [-7, 5, 5], CC.white), B([7, 4, 4], [12, 5, 5], CC.white),            // whiskers
    B([-11, 2, 3], [-7, 3, 4], CC.white), B([7, 2, 3], [11, 3, 4], CC.white),
    B([-9, 10, -2], [-4, 15, 1], CC.fur), B([4, 10, -2], [9, 15, 1], CC.fur),            // ears, up through the brim
    B([-8, 15, -2], [-5, 18, 1], CC.fur), B([5, 15, -2], [8, 18, 1], CC.fur),
    Pt([-8, 12, 0], [-5, 16, 1], CC.nose), Pt([5, 12, 0], [8, 16, 1], CC.nose),
    // the witch's hat: the brim (the ears stand up through it), the band, the bent cone, the buckle
    B([-12, 12, -12], [12, 13, 11], (x, y, z) => (((x + 0.5) / 11.4) ** 2 + ((z + 1.5) / 10.6) ** 2 > 1 || (Math.abs(Math.abs(x + 0.5) - 6.5) < 2.5 && z > -3 && z < 1) ? null : CC.hatD)),
    B([-8, 13, -14], [14, 28, 8], cone),
    B([-2, 13, 4], [2, 16, 7], CC.gold), Pt([-1, 14, 6], [1, 15, 7], CC.orangeD),
  ];
}

/** Body parts on the squat rig (voxels of 2.5 cm): the dress over a flared skirt, striped stockings. */
function body() {
  const dress = (x, y, z) => {
    if (y === -1 || y === 0) return z > 6 && Math.abs(x + 0.5) < 1.5 ? CC.gold : CC.orange;      // belt and buckle
    if (z > 0 && y > 3 && Math.abs(x + 0.5) < 3) return CC.white;                                // a white bib of fur
    return (y + 30) % 5 === 0 ? CC.dressD : CC.dress;
  };
  const skirt = (x, y, z) => {
    const r = 8.6 + (-3 - y) * 0.42;
    if (((x + 0.5) / r) ** 2 + ((z + 0.5) / (r * 0.9)) ** 2 > 1) return null;
    return y === -9 ? ((x + z + 40) % 4 < 2 ? CC.orange : CC.orangeD) : (x + 40) % 4 === 0 ? CC.dressD : CC.dress;   // pleats, an orange hem
  };
  const stocking = (x, y) => ((y + 20) % 4 < 2 ? CC.orange : CC.dress);
  return {
    spine: [ball([0, 1, 0], [8, 9, 7.2], dress), B([-12, -9, -11], [12, -3, 11], skirt)],
    chest: [B([-5, 2, -4], [5, 5, 5], CC.orange), B([-3, 1, 5], [-1, 4, 7], CC.orange), B([1, 1, 5], [3, 4, 7], CC.orange), Pt([-1, 2, 5], [1, 3, 7], CC.gold)],   // a collar and its bow
    ...limbs({ arm: fur, sleeve: CC.dress, cuff: CC.orange, hand: CC.furL, leg: stocking, foot: CC.boot, sole: CC.pupil }),
  };
}

// ---------------------------------------------------------------- the broom (weapon space: origin = the grip, +Z = the bristles)
const BV = 0.02;
function broomGeo() {
  return vox([
    B([-1, -1, -15], [1, 1, 52], (x, y, z) => ((z + 15) % 14 === 0 ? CC.woodD : CC.wood)),                       // the stick
    B([-3, -3, 49], [3, 3, 54], (x, y, z) => (z % 2 ? CC.orange : CC.gold)),                                     // the binding
    B([-6, -6, 54], [6, 6, 72], (x, y, z) => {                                                                   // the bristles: straw, charred and glowing at the tips
      const r = 2.6 + (z - 54) * 0.16;
      if (Math.hypot(x + 0.5, y + 0.5) > r || hash01(x, y, 7) < (z - 60) * 0.05) return null;
      return z > 67 ? (hash01(x, y, z) < 0.5 ? CC.ember : CC.flame) : z > 63 ? (hash01(x, y, z) < 0.4 ? CC.pupil : CC.strawD) : hash01(x, y, 3) < 0.35 ? CC.strawD : CC.straw;
    }),
  ], BV, { jitter: 0.05, ao: 0.3 });
}
const bx = (s, p, c) => ({ s, p, c });
/** The flame on the bristles (weapon space, unlit and bright so it blooms): three tongues. */
const flameGeo = () => boxesGeometry([bx([0.2, 0.2, 0.26], [0, 0, 1.46], CC.ember), bx([0.13, 0.13, 0.26], [0.02, 0.03, 1.64], CC.flame), bx([0.07, 0.07, 0.2], [-0.02, 0.05, 1.8], 0xffe9a0)]);

export function createClaraModel(rig) {
  const mat = fighterMaterial({ roughness: 0.8 }, 0.5, 1.0);            // a strong fill and rim: dark fur, dark dress
  const { meshes, add } = buildSquat(rig, mat, body(), head());
  add(rig.joints.weapon, broomGeo(), 'broom', fighterMaterial({ roughness: 0.7, emissive: new THREE.Color(0x3a1400), emissiveIntensity: 0.4 }, 0.4, 0.7)).scale.setScalar(BROOM_SCALE);
  const flame = new THREE.Mesh(flameGeo(), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(2.4, 2.0, 1.6), transparent: true, opacity: 0.9, depthWrite: false }));
  rig.joints.weapon.add(flame);
  rig.clara = { flame };
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: the flame, the cape, the tail
const capeSeg = (i, n) => vox([B([-5 - i, -4, 0], [5 + i, 0, 1], (x, y) => (i === n - 1 && y === -4 ? CC.orange : (x + 40) % 4 === 0 ? CC.dressD : CC.hatD))], 0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
const tailSeg = (i, n) => vox([B([-1, -3, -1], [1, 0, 1], i === n - 1 ? CC.white : CC.fur)], 0.03, { jitter: 0.05, ao: 0.2 });

export function createClaraSecondary(scene, rig, mat) {
  const chains = createChains(scene, rig, mat), { flame } = rig.clara;
  chains.add(rig.joints.chest, { anchor: [0, 0.07, -0.13], rest: [0, -1, -0.5], n: 4, len: 0.09, stiff: 0.06, drag: 0.1, wind: 1.4, cone: 100, sway: 0.25, seg: capeSeg });
  chains.add(rig.joints.hips, { anchor: [0, -0.06, -0.18], rest: [0, 0.7, -1], n: 5, len: 0.08, stiff: 0.3, drag: 0.12, wind: 0.5, cone: 70, sway: 0.2, seg: tailSeg });
  let t = 0;
  return {
    reset() { chains.reset(); },
    update(dt) {
      t += dt;
      chains.update(dt);
      const f = 0.8 + 0.2 * Math.sin(t * 23) * Math.sin(t * 13.7), s = BROOM_SCALE;
      flame.scale.set(s * (0.9 + 0.2 * Math.sin(t * 17)), s * (0.9 + 0.2 * Math.cos(t * 19)), s * f);
      flame.position.z = 1.46 * s * (1 - f);                          // it stretches from the bristles, not from the grip
      flame.rotation.z = t * 5;
    },
  };
}
