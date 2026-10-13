// Voxel Ben on the squat rig (src/chars/shared/squat.js): a little brown monkey — a tan heart-shaped face with big dark
// eyes and round ears, a gold monocle on a chain over the right eye, a green tee with a banana print, blue cargo shorts, bare paws and feet, a
// quiver of banana arrows over the right shoulder and a long curling tail. Weapons: the banana bow in the left paw
// (weapon joint: origin = the grip, the limbs along ±Z curving to the string on +Y, the arrow flies along −Y) and a
// boomerang in the right fist (a child of the hand joint).
// GOING APE (the Overclock): the whole body swaps for a gorilla — a barrel chest and a neck hump under a silver back,
// arms that hang past the knees ending in fists the size of his head, short bowed legs, a crested head with a heavy
// brow and a grey dish of a face — and the rig grows 2.1× (apeScale); the bow, boomerang, quiver and tail go away with the monkey.
// Render-only life (createBenSecondary): the tail (a spring chain), the boomerang vanishing from his fist while it flies
// (./moves.js boomerangOut: the view flies it), and the gorilla swap.
import * as THREE from 'three';
import { vox } from '../../hero/model.js';
import { hash01 } from '../../core/rng.js';
import { HERO_SCALE } from '../../hero/rig.js';
import { B, Pt, hex, fighterMaterial } from '../shared/body.js';
import { ball, limbs, buildSquat, V } from '../shared/squat.js';
import { createChains } from '../shared/chains.js';
import { MUSOU_FRAMES } from './anims.js';
import { boomerangOut } from './moves.js';

export const CC = {
  fur: hex('#6b4a2e'), furD: hex('#4e3520'), furL: hex('#8a6540'), skin: hex('#e8c49a'), skinD: hex('#c9a076'), eye: hex('#1a1410'), mouth: hex('#5a2a22'),
  gold: hex('#ffd93a'), goldD: hex('#c89a18'), glass: hex('#cfeeff'), tee: hex('#2f7d3a'), teeD: hex('#235c2b'), shorts: hex('#2a6fb8'), shortsD: hex('#1f528a'),
  yellow: hex('#ffd93a'), yellowD: hex('#d8a81c'), tipB: hex('#4a3418'), grip: hex('#3a2a1c'), string: hex('#f0e8d0'), wood: hex('#c88a4a'), woodD: hex('#a0652e'),
  fletch: hex('#46c860'), quiver: hex('#7a4a22'), quiverD: hex('#5a3418'),
  ape: hex('#2a262c'), apeD: hex('#1a161c'), apeL: hex('#3a353e'), silver: hex('#a2a2ac'), silverD: hex('#8a8a94'), apeSkin: hex('#5a5058'), apeSkinL: hex('#746a72'), apeNose: hex('#201c22'),
};
/** Bow model scale at his size, and its reach from the grip along ±Z (m): the limb tips (ground contact, the trail). */
export const BOW_SCALE = 0.75;
export const BOW = { tip: 0.56 * BOW_SCALE, butt: 0.56 * BOW_SCALE, string: 0.18 * BOW_SCALE };
/** GOING APE: the rig's scale at Overclock frame t (1 → APE → 1), and when the body is the gorilla's. */
export const APE = 2.1, SWAP = [14, MUSOU_FRAMES - 12];
export function apeScale(t) {
  if (t < 6) return 1;
  if (t < 30) { const u = (t - 6) / 24, e = 1 - (1 - u) ** 3; return 1 + (APE - 1) * (e + 0.1 * Math.sin(u * Math.PI)); }
  if (t > MUSOU_FRAMES - 24) { const u = Math.max(0, (MUSOU_FRAMES - 2 - t) / 22); return 1 + (APE - 1) * u * u; }
  return APE;
}
const fur = (x, y, z) => (hash01(x * 3, y, z) < 0.16 ? CC.furD : hash01(z, x, y * 5) < 0.1 ? CC.furL : CC.fur);
const apeFur = (x, y, z) => (hash01(x * 7, y, z) < 0.05 ? CC.apeL : CC.ape);

/** Head (voxels of 3 cm, chin at y 0, facing +Z): the round monkey head, the tan face, ears, the monocle and a tuft. */
export function head() {
  return [
    ball([0, 7, 0], [7.5, 7, 7], fur),
    ball([0, 5.5, 4.4], [5.6, 5.2, 3.4], CC.skin),                                       // the heart-shaped face
    B([-2, 9, 5], [2, 11, 7], CC.fur),                                                   // the fur dips between the brows
    Pt([-5, 6, 3], [-2, 9, 8], CC.eye), Pt([2, 6, 3], [5, 9, 8], CC.eye),               // big dark eyes, catch-lights
    Pt([-4, 8, 3], [-3, 9, 8], 0xffffff), Pt([3, 8, 3], [4, 9, 8], 0xffffff),
    Pt([-2, 4, 6], [-1, 5, 9], CC.skinD), Pt([1, 4, 6], [2, 5, 9], CC.skinD),           // nostrils
    Pt([-3, 2, 6], [3, 3, 9], CC.mouth), Pt([-2, 1, 6], [2, 2, 9], CC.skinD),           // a wide grin
    ball([-9, 8, 0], [2.6, 3, 1.6], fur), ball([9, 8, 0], [2.6, 3, 1.6], fur),           // round ears, tan inside
    Pt([-10, 7, 0], [-8, 10, 2], CC.skin), Pt([8, 7, 0], [10, 10, 2], CC.skin),
    // the monocle: a gold rim round the right eye, a pale glass in it, the chain down the cheek to the collar
    B([-6, 5, 8], [-1, 10, 9], (x, y) => { const r = Math.hypot(x + 3.5, y + 0.5 - 7.5); return r > 2.9 ? null : r > 2 ? (hash01(x, y, 1) < 0.3 ? CC.goldD : CC.gold) : y === 9 || x === -2 ? CC.glass : null; }),
    B([-7, 7, 7], [-6, 8, 9], CC.gold), B([-7, 3, 7], [-6, 7, 8], (x, y) => (y % 2 ? CC.goldD : CC.gold)), B([-7, 0, 6], [-6, 3, 7], (x, y) => (y % 2 ? CC.goldD : CC.gold)),
    B([-1, 14, -2], [1, 17, 0], fur), B([0, 16, -1], [2, 18, 1], fur),                   // the tuft
  ];
}

/** Body parts on the squat rig (voxels of 2.5 cm): the tee with the banana print over cargo shorts, bare limbs. */
function body() {
  const tee = (x, y, z) => {
    if (y < -4) return (x + 40) % 5 === 0 ? CC.shortsD : CC.shorts;                             // the shorts
    if (y === -4) return CC.shortsD;                                                            // the waistband
    if (z > 3 && Math.abs(x + 0.5 - (y - 1) * 0.6) < 1.3 && y > -2 && y < 5) return CC.yellow;    // a banana, printed askew
    return (y + 30) % 6 === 0 ? CC.teeD : CC.tee;
  };
  const shorts = (x, y) => ((y + 20) % 4 === 0 ? CC.shortsD : CC.shorts);
  return {
    spine: [ball([0, 1, 0], [8, 9, 7.2], tee), B([-9, -9, -8], [9, -5, 8], shorts), B([-10, -7, -3], [-8, -4, 2], CC.shortsD), B([8, -7, -3], [10, -4, 2], CC.shortsD)],   // the barrel, the shorts' legs and pockets
    chest: [B([-5, 2, -4], [5, 5, 5], CC.teeD),
      B([-7, -6, -10], [-3, 6, -7], (x, y) => (y === 6 || y === -6 ? CC.quiverD : CC.quiver)),  // the quiver, over the right shoulder
      B([-6, 6, -9], [-5, 14, -8], CC.yellow), B([-5, 6, -10], [-4, 13, -9], CC.yellowD), B([-7, 7, -9], [-6, 12, -8], CC.yellow),
      Pt([-6, 12, -9], [-5, 14, -8], CC.fletch), Pt([-5, 11, -10], [-4, 13, -9], CC.fletch), Pt([-7, 10, -9], [-6, 12, -8], CC.fletch)],
    ...limbs({ arm: fur, sleeve: CC.tee, hand: CC.skin, leg: fur, foot: CC.skin, sole: CC.skinD }),
  };
}

// ---------------------------------------------------------------- the gorilla (hidden until the Overclock)
/** Gorilla parts on the same joints (voxels of 2.5 cm): the barrel body and neck hump under a silver saddle, shoulders
 *  like boulders, arms thickened and run on past the wrist so they hang to the knees, fists the size of the head, short
 *  bowed legs on broad flat feet. */
function apeBody() {
  const saddle = (x, y, z) => (z < -3 && y > -6 && y < 5 && (Math.abs(x + 0.5) < 9 || hash01(x, y, z * 3) < 0.5) ? (y === -6 || y === 4 ? CC.silverD : CC.silver) : apeFur(x, y, z));
  const belly = (x, y, z) => (z > 5 && y < 1 && Math.abs(x + 0.5) < 5 ? CC.apeSkin : saddle(x, y, z));
  const shoulders = (x, y, z) => (((x + 0.5) / 14) ** 2 + ((y - 2.5) / 5.5) ** 2 + ((z + 0.5) / 8) ** 2 > 1 ? null : apeFur(x, y, z));
  const p = {
    spine: [ball([0, 1, -1], [12, 11, 10], belly)],
    chest: [B([-14, -3, -8], [14, 8, 8], shoulders), Pt([-6, -2, 5], [6, 5, 8], CC.apeSkin),          // the shoulders, the bare chest
      B([-6, 6, -9], [6, 12, 0], (x, y, z) => (y > 9 && z < -4 ? CC.silverD : apeFur(x, y, z))), B([-4, 11, -7], [4, 14, -2], apeFur)],   // the neck hump
  };
  for (const s of ['R', 'L']) {
    p['upperArm' + s] = [B([-4, -8, -4], [4, 2, 4], apeFur), B([-5, -2, -4], [5, 2, 4], apeFur)];
    p['foreArm' + s] = [B([-4, -10, -4], [5, 0, 5], apeFur), B([-4, -7, -4], [5, -4, 5], apeFur)];
    p['hand' + s] = [B([-5, -6, -4], [5, 1, 4], CC.apeSkin), Pt([-5, -6, -4], [5, -5, 4], CC.apeSkinL), Pt([-5, -3, 4], [5, 1, 4], CC.apeSkinL), Pt([-5, -6, -4], [5, -4, -4], CC.apeNose)];
    p['thigh' + s] = [B([-4, -7, -4], [5, 1, 5], apeFur)];
    p['shin' + s] = [B([-4, -7, -4], [5, 0, 5], apeFur)];
    p['foot' + s] = [B([-4, -2, -4], [4, 1, 7], CC.apeSkin), B([-4, -2, -4], [4, -1, 8], CC.apeSkinL), Pt([-4, -2, 6], [4, 1, 7], CC.apeNose)];
  }
  return p;
}
/** The gorilla's head (voxels of 3 cm, chin at y 0, facing +Z): small for the body, a sagittal crest running back, the
 *  brow ridge shading deep-set eyes, a grey dish of a face with a wide flat nose and a heavy muzzle. */
function apeHead() {
  return [
    ball([0, 6, 1], [7, 6.5, 7.5], apeFur),
    B([-2, 10, -6], [2, 15, 2], (x, y, z) => (y - z > 14 ? null : apeFur(x, y, z))), B([-1, 14, -5], [1, 16, -1], apeFur),   // the crest, sloping back
    ball([0, 4.5, 5.6], [5.8, 5, 3], CC.apeSkin),                                            // the face dish
    ball([0, 1.8, 6.6], [4.6, 2.8, 2.8], CC.apeSkinL),                                       // the muzzle
    B([-6, 7, 3], [6, 9, 8], (x, y, z) => (z > 6 && Math.abs(x + 0.5) < 1.5 ? CC.apeSkin : apeFur(x, y, z))),   // the brow ridge
    Pt([-4, 5, 5], [-2, 7, 9], CC.eye), Pt([2, 5, 5], [4, 7, 9], CC.eye),                    // deep-set eyes, a glint
    Pt([-3, 6, 5], [-2, 7, 9], 0xd8d0c8), Pt([3, 6, 5], [4, 7, 9], 0xd8d0c8),
    Pt([-3, 3, 8], [3, 4, 10], CC.apeNose), Pt([-3, 2, 8], [-1, 3, 10], CC.apeNose), Pt([1, 2, 8], [3, 3, 10], CC.apeNose),   // the wide flat nose and its nostrils
    Pt([-3, 0, 8], [3, 1, 10], CC.apeD), B([-4, -1, 4], [4, 1, 8], CC.apeSkinL),              // the mouth, the jaw
    Pt([-8, 5, -1], [-7, 7, 1], CC.apeSkin), Pt([7, 5, -1], [8, 7, 1], CC.apeSkin),           // small ears
  ];
}

// ---------------------------------------------------------------- the bow (weapon space: origin = the grip, limbs along ±Z, string on +Y)
const BV = 0.02;
function bowGeo() {
  return vox([
    B([-3, -2, -28], [3, 12, 29], (x, y, z) => {                                          // a banana: thick at the grip, curling to the tips
      const u = Math.abs(z + 0.5) / 28.5, yc = 9 * u * u, r = 2.6 - 1.0 * u;
      if (Math.hypot(x + 0.5, y + 0.5 - yc) > r) return null;
      if (u > 0.9) return CC.tipB;
      if (Math.abs(z + 0.5) < 3.5) return CC.grip;
      return x >= 0 && y + 0.5 > yc ? CC.yellowD : hash01(x, y, z) < 0.08 ? CC.tipB : CC.yellow;
    }),
    B([0, 10, -27], [1, 11, 28], CC.string),                                               // the string, tip to tip
  ], BV, { jitter: 0.03, ao: 0.3 });
}
/** The boomerang (hand space: one tip in the fist, the arm down the forearm's line, the elbow bending forward). */
export function boomerangGeo() {
  const paint = (x, y, z) => ((y + z + 40) % 5 === 0 ? CC.yellow : (x + 40) % 3 === 0 ? CC.woodD : CC.wood);
  return vox([B([-1, -17, -1], [1, 1, 1], paint), B([-1, -19, 0], [1, -15, 15], paint)], BV, { jitter: 0.03, ao: 0.25 });
}

export function createBenModel(rig) {
  const mat = fighterMaterial({ roughness: 0.8 }, 0.5, 1.0);
  const { meshes, add } = buildSquat(rig, mat, body(), head());
  const bow = add(rig.joints.weapon, bowGeo(), 'bow', fighterMaterial({ roughness: 0.6 }, 0.4, 0.8));
  bow.scale.setScalar(BOW_SCALE);
  const boomerang = add(rig.joints.handR, boomerangGeo(), 'boomerang');
  boomerang.scale.setScalar(BOW_SCALE);
  // the gorilla: its own meshes on the same joints (not in `meshes`: the dodge ghosts copy only the monkey), hidden
  const apeMat = fighterMaterial({ roughness: 0.9 }, 0.55, 1.1), apes = [];
  const mesh = (parent, geo) => { const m = new THREE.Mesh(geo, apeMat); m.castShadow = true; m.receiveShadow = true; m.visible = false; parent.add(m); apes.push(m); return m; };
  for (const [joint, boxes] of Object.entries(apeBody())) mesh(rig.joints[joint], vox(boxes, V, { off: /foreArm|thigh|shin/.test(joint) ? [-0.5, 0, -0.5] : [0, 0, 0], jitter: 0, ao: 0.22 }));
  mesh(rig.joints.head, vox(apeHead(), 0.03, { jitter: 0, ao: 0.26 }));
  rig.ben = { monkey: Object.values(meshes), apes, boomerang };
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: the tail, the boomerang in flight, the gorilla
const tailSeg = (i, n) => vox([B([-1, -3, -1], [1, 0, 1], i === n - 1 ? CC.skin : CC.fur)], 0.03, { jitter: 0.05, ao: 0.2 });

export function createBenSecondary(scene, rig, mat, hero) {
  const tail = new THREE.Group();
  scene.add(tail);
  const chains = createChains(tail, rig, mat), M = rig.ben;
  chains.add(rig.joints.hips, { anchor: [0, -0.05, -0.17], rest: [0, 0.8, -1], n: 7, len: 0.065, stiff: 0.28, drag: 0.12, wind: 0.5, cone: 80, sway: 0.25, seg: tailSeg });
  let ape = false;
  const swap = (on) => { ape = on; for (const m of M.monkey) m.visible = !on; for (const m of M.apes) m.visible = on; tail.visible = !on; };
  return {
    reset() { chains.reset(); swap(false); },
    update(dt) {
      chains.update(dt);
      const h = hero, t = h && h.state === 'musou' ? (h.musouT || 0) * MUSOU_FRAMES : -1;
      const want = t >= SWAP[0] && t < SWAP[1];
      if (want !== ape) swap(want);
      M.boomerang.visible = !ape && !(h && h.state === 'attack' && boomerangOut(h.move, h.moveT));
      const g = t >= 0 ? apeScale(t) : 1;                              // GOING APE: the rig grows about the ground point
      if (g !== 1) rig.root.scale.setScalar(HERO_SCALE * g);
      rig.root.updateMatrixWorld(true);
    },
  };
}
