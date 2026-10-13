// Voxel Alex on the squat rig (src/chars/shared/squat.js): a round little sheep — a barrel of cream wool, a head nearly
// as big as the body with a dark face in the wool, droopy ears, big flight goggles with sky-blue lenses strapped round
// it, stubby dark legs and hooves, a red scarf. Weapon: an umbrella (weapon joint: 1.15 m from the handle to the ferrule
// at his size, a hooked wooden handle behind the grip, a blue-and-white canopy).
// The canopy is two meshes: furled round the shaft, and open (a dome 0.8 m across). createAlexSecondary opens it on the
// moves listed in ./moves.js OPEN_MOVES and during the Overclock, with a quick pop (and holds it open for the key art:
// rig.show); the scarf's tail is a spring chain.
import { vox } from '../../hero/model.js';
import { shade } from '../../core/voxel.js';
import { hash01 } from '../../core/rng.js';
import { B, Pt, hex, fighterMaterial } from '../shared/body.js';
import { ball, limbs, buildSquat } from '../shared/squat.js';
import { createChains } from '../shared/chains.js';
import { OPEN_MOVES } from './moves.js';
import { MUSOU_FRAMES, MUSOU_OPEN } from './anims.js';

export const XC = {
  wool: hex('#f6f2e8'), woolD: hex('#ddd6c6'), face: hex('#45403c'), faceD: hex('#2e2a28'), nose: hex('#e89aa0'), hoof: hex('#2a2624'), hoofL: hex('#5a524c'),
  strap: hex('#7a4a26'), frame: hex('#c8a050'), lens: hex('#6fe0ff'), lensL: hex('#e8fbff'), scarf: hex('#e0402a'), scarfD: hex('#b02a1c'),
  blue: hex('#2f7fd6'), blueD: hex('#1f5aa6'), white: hex('#f4f6fa'), wood: hex('#8a5a2e'), steel: hex('#aeb6c0'),
};
/** Umbrella model scale at his size, and its anchors in weapon space (m): trail + VFX. */
export const UMB_SCALE = 0.72;
export const UMB = { tip: 1.6 * UMB_SCALE, butt: 0.2 * UMB_SCALE };
/** Wool: cream with a few darker curls and bright tufts (stable hash, no RNG). */
const wool = (x, y, z) => (hash01(x * 3, y, z) < 0.18 ? XC.woolD : hash01(z, x, y * 5) < 0.12 ? 0xffffff : XC.wool);

/** Head (voxels of 3 cm, chin at y 0, facing +Z): a ball of wool with the dark face showing in front. */
export function head() {
  const skin = (x, y, z) => (z > 1 && y > 0 && y < 11 && Math.abs(x + 0.5) < 5.6 - Math.max(0, y - 8) * 0.9 ? XC.face : wool(x, y, z));
  return [
    ball([0, 7.5, 0], [7.6, 7.5, 7], skin),
    B([-3, 1, 5], [3, 6, 10], XC.face),                               // muzzle
    Pt([-1, 4, 9], [1, 6, 10], XC.nose), Pt([-1, 2, 9], [1, 3, 10], XC.faceD),   // nose, mouth
    B([-11, 6, -1], [-7, 9, 2], XC.face), B([7, 6, -1], [11, 9, 2], XC.face),    // droopy ears, pink inside
    Pt([-10, 7, 1], [-8, 8, 2], XC.nose), Pt([8, 7, 1], [10, 8, 2], XC.nose),
    ball([0, 15, 1], [3.6, 2.6, 3.4], wool),                          // a tuft on top
    Pt([-9, 8, -8], [9, 10, 8], XC.strap),                            // the goggles' strap, right round the head
    B([-7, 6, 5], [-1, 12, 8], XC.frame), B([1, 6, 5], [7, 12, 8], XC.frame), B([-1, 8, 6], [1, 10, 8], XC.frame),   // frames, bridge
    Pt([-6, 7, 7], [-2, 11, 8], XC.lens), Pt([2, 7, 7], [6, 11, 8], XC.lens),            // glass
    Pt([-4, 8, 7], [-2, 10, 8], XC.faceD), Pt([2, 8, 7], [4, 10, 8], XC.faceD),          // an eye behind each
    Pt([-6, 10, 7], [-5, 11, 8], XC.lensL), Pt([5, 10, 7], [6, 11, 8], XC.lensL),        // catch-lights
  ];
}

/** Body parts on the squat rig (voxels of 2.5 cm). */
function body() {
  return {
    spine: [ball([0, 1, 0], [8.4, 9, 7.4], wool), ball([0, -3, -8], [2.6, 2.6, 2.6], wool)],                 // the barrel, the tail puff
    chest: [B([-6, 2, -5], [6, 5, 6], XC.scarf), B([2, -2, 5], [5, 3, 8], XC.scarf), Pt([2, -2, 7], [5, -1, 8], XC.scarfD)],   // the scarf and its knot
    ...limbs({ arm: XC.face, sleeve: wool, hand: XC.hoof, leg: XC.face, foot: XC.hoof, sole: XC.hoofL }),
  };
}

// ---------------------------------------------------------------- the umbrella (weapon space: origin = the handle, +Z = the ferrule)
const UV = 0.02;
const sector = (x, y) => (Math.floor((Math.atan2(y + 0.5, x + 0.5) / Math.PI + 1) * 4) & 1 ? XC.blue : XC.white);
function shaftGeo() {
  return vox([
    B([-1, -1, -9], [1, 1, 80], (x, y, z) => (z < 10 ? XC.wood : z >= 72 ? XC.steel : shade(XC.steel, 0.7))),   // handle, shaft, ferrule
    B([-1, -7, -10], [1, 1, -8], XC.wood), B([-1, -7, -8], [1, -5, -3], XC.wood),                          // the hook
    B([-2, -2, 9], [2, 2, 12], XC.frame), B([-2, -2, 70], [2, 2, 73], XC.frame),                             // runner, top notch
  ], UV, { jitter: 0.04, ao: 0.3 });
}
function furledGeo() {
  return vox([B([-4, -4, 16], [4, 4, 70], (x, y, z) => {
    const r = 3.4 - (z - 16) / 54 * 1.9;
    if (Math.hypot(x + 0.5, y + 0.5) > r) return null;
    return z >= 38 && z < 41 ? XC.strap : z < 18 ? XC.blueD : sector(x, y);
  })], UV, { jitter: 0.04, ao: 0.25 });
}
/** The open canopy: a shell dome, its apex at the top notch, eight panels. */
function canopyGeo() {
  const R = 28, Z0 = 46, D = 24, rad = (z) => R * Math.sqrt(Math.max(0, 1 - ((z - Z0) / D) ** 2));
  return vox([B([-R - 1, -R - 1, Z0], [R + 1, R + 1, Z0 + D + 1], (x, y, z) => {
    const d = Math.hypot(x + 0.5, y + 0.5);
    if (d > rad(z) || d < rad(z + 1) - 1.2) return null;
    return z === Z0 ? XC.blueD : sector(x, y);
  })], UV, { jitter: 0.03, ao: 0.2 });
}

export function createAlexModel(rig) {
  const mat = fighterMaterial({ roughness: 0.85 }, 0.3, 0.7);
  const { meshes, add } = buildSquat(rig, mat, body(), head());
  const wm = fighterMaterial({ roughness: 0.45, metalness: 0.15 }, 0.3, 0.7);
  add(rig.joints.weapon, shaftGeo(), 'umbrella', wm).scale.setScalar(UMB_SCALE);
  const furled = add(rig.joints.weapon, furledGeo(), 'furled', wm);
  const canopy = add(rig.joints.weapon, canopyGeo(), 'canopy', wm);
  furled.scale.setScalar(UMB_SCALE); canopy.visible = false;
  rig.alex = { furled, canopy };
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: the canopy opening, the scarf tail
const scarfSeg = (i, n) => vox([B([-2, -4, 0], [2, 0, 1], (x, y) => (i === n - 1 && y === -4 ? XC.scarfD : XC.scarf))], 0.02, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.15 });

export function createAlexSecondary(scene, rig, mat, hero) {
  const chains = createChains(scene, rig, mat);
  chains.add(rig.joints.chest, { anchor: [0.09, 0.02, 0.18], rest: [0.3, -1, 0.3], n: 4, len: 0.07, stiff: 0.05, drag: 0.1, wind: 1.6, face: [0, 0, 1], cone: 110, sway: 0.3,
    seg: scarfSeg });
  const { furled, canopy } = rig.alex;
  let k = 0;
  return {
    reset() { chains.reset(); k = 0; },
    update(dt) {
      chains.update(dt);
      let want = rig.show ? 1 : 0;                                      // key art (ui/stage.js): held open
      if (hero && !hero.dead) {
        const w = hero.state === 'attack' && OPEN_MOVES[hero.move];
        if (w && hero.moveT >= w[0] && hero.moveT <= w[1]) want = 1;
        if (hero.state === 'musou') { const t = (hero.musouT || 0) * MUSOU_FRAMES; if (t >= MUSOU_OPEN[0] && t <= MUSOU_OPEN[1]) want = 1; }
      }
      k += (want - k) * Math.min(1, dt * 22);
      canopy.visible = k > 0.06; furled.visible = k < 0.6;
      if (canopy.visible) canopy.scale.set(UMB_SCALE * (0.2 + 0.8 * k), UMB_SCALE * (0.2 + 0.8 * k), UMB_SCALE * (0.75 + 0.25 * k));
    },
  };
}
