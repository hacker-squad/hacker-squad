// Map render kit — props as box lists (render-only). A prop builder returns boxes in its own frame (metres, origin on
// the ground at its centre, +Z = its front); place() moves them into the world, merge() bakes a list into one geometry
// (src/core/voxel.js boxesGeometry: { s: [w, h, d], p: [cx, cy, cz], c, r? }). A prop with lights returns
// { body, lit }: `lit` boxes go into an unlit bright mesh so they bloom (flames, lanterns, glowing eyes).
// Forest set: oaks, pines, burnt trees, bushes, rocks, flowers, mushrooms, stumps, log piles; the sheep village's huts,
// fences, hay bales, well and lantern posts; the wolves' palisades, barricades, tents, banners, bonfires, torches, weapon
// racks and the war totem.
import * as THREE from 'three';
import { boxesGeometry, shade } from '../../core/voxel.js';
import { hash01 } from '../../core/rng.js';

export const bx = (s, p, c, r) => ({ s, p, c, r });
const _qy = new THREE.Quaternion(), _ql = new THREE.Quaternion(), _e = new THREE.Euler(), _Y = new THREE.Vector3(0, 1, 0);
/** Boxes of a prop frame → world: rotate by yaw about Y (composed with each box's own rotation), scale k, lift y, move. */
export function place(boxes, x, y, z, yaw = 0, k = 1) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  _qy.setFromAxisAngle(_Y, yaw);
  return boxes.map((q) => {
    const [px, py, pz] = q.p;
    let r = [0, yaw, 0];
    if (q.r) { _ql.setFromEuler(_e.set(q.r[0], q.r[1], q.r[2], 'XYZ')); _ql.premultiply(_qy); _e.setFromQuaternion(_ql, 'XYZ'); r = [_e.x, _e.y, _e.z]; }
    return { s: q.s.map((v) => v * k), p: [x + (px * c + pz * s) * k, y + py * k, z + (-px * s + pz * c) * k], c: q.c, r };
  });
}
export const merge = (boxes) => boxesGeometry(boxes);
export const propMaterial = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0, ...o });

export const BARK = 0x6b4a2e, BARK_D = 0x4a3220, LOG = 0x8a6238, LOG_D = 0x5e4226, THATCH = 0xd8b45a, PLASTER = 0xf0e6cc, STONE = 0x8a9096, STONE_D = 0x5e646a;
export const CHAR = 0x2a2422, EMBER = 0xff6a1e, FLAME = 0xffc23a, WOLF_RED = 0xa82a1e;
export const LEAVES = [0x4fa83a, 0x3f9434, 0x62b848, 0x358a3e, 0x7cc452];
export const AUTUMN = [0xd8902a, 0xc8642a, 0xe0b23a];
export const PETALS = [0xff6f8a, 0xffd23e, 0xffffff, 0xb07cff, 0xff9a3e, 0x6fc8ff];

/** A broad-leaf tree: trunk, roots, a canopy of stacked leaf blocks. h = trunk height (m), r = canopy radius. */
export function oak(h = 5, r = 2.6, seed = 0, leaves = LEAVES) {
  const w = 0.28 + r * 0.13, out = [bx([w, h, w], [0, h / 2, 0], BARK), bx([w * 1.6, 0.5, w * 1.6], [0, 0.25, 0], BARK_D)];
  const L = (k) => leaves[Math.floor(hash01(seed, k, 7) * leaves.length) % leaves.length];
  out.push(bx([r * 2, r * 1.1, r * 2], [0, h + r * 0.45, 0], L(0)), bx([r * 1.4, r * 0.8, r * 1.4], [0, h + r * 1.2, 0], L(1)));
  for (let k = 0; k < 5; k++) {
    const a = k * 1.26 + hash01(seed, k) * 0.8, d = r * (0.7 + hash01(seed, k, 2) * 0.35), s = r * (0.75 + hash01(seed, k, 3) * 0.5);
    out.push(bx([s, s * 0.8, s], [Math.sin(a) * d, h + r * (0.2 + hash01(seed, k, 4) * 0.6), Math.cos(a) * d], L(k + 2)));
  }
  out.push(bx([w * 0.5, 0.2, r * 0.9], [0, h * 0.72, r * 0.3], BARK_D, [0.5, hash01(seed, 9) * 6, 0]));   // a branch
  return out;
}

/** A conifer: trunk and four shrinking tiers. */
export function pine(h = 8, r = 2, seed = 0) {
  const out = [bx([0.4, h * 0.45, 0.4], [0, h * 0.22, 0], BARK_D)], G = [0x2f6e3a, 0x27603a, 0x3a7e42];
  for (let k = 0; k < 4; k++) {
    const u = k / 3, s = r * 2 * (1 - u * 0.72), y = h * (0.3 + u * 0.56);
    out.push(bx([s, h * 0.2, s], [0, y, 0], G[(seed + k) % 3], [0, k * 0.4 + hash01(seed, k) * 0.5, 0]));
  }
  out.push(bx([0.3, h * 0.12, 0.3], [0, h * 0.98, 0], G[seed % 3]));
  return out;
}

/** A burnt tree: a black leaning trunk, bare forked branches, a few embers still glowing in the bark. → { body, lit } */
export function deadTree(h = 6, seed = 0) {
  const body = [bx([0.7, h, 0.7], [0, h / 2, 0], CHAR, [0.05, 0, 0.06]), bx([1.1, 0.5, 1.1], [0, 0.25, 0], 0x1a1614)], lit = [];
  for (let k = 0; k < 4; k++) {
    const a = k * 1.6 + hash01(seed, k) * 0.9, L = 1.4 + hash01(seed, k, 2) * 1.6, y = h * (0.55 + k * 0.12);
    body.push(bx([0.22, L, 0.22], [Math.sin(a) * L * 0.36, y, Math.cos(a) * L * 0.36], CHAR, [Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]));
  }
  for (let k = 0; k < 3; k++) lit.push(bx([0.08, 0.14, 0.08], [(hash01(seed, k, 5) - 0.5) * 0.7, 0.6 + hash01(seed, k, 6) * (h - 1.5), 0.36], EMBER));
  return { body, lit };
}

export const bush = (s = 1, c = LEAVES[1], seed = 0) => [bx([s * 1.3, s * 0.8, s * 1.1], [0, s * 0.4, 0], c), bx([s * 0.8, s * 0.6, s * 0.9], [s * 0.35, s * 0.8, (hash01(seed, 1) - 0.5) * s * 0.4], shade(c, 1.12)),
  bx([s * 0.7, s * 0.5, s * 0.7], [-s * 0.4, s * 0.7, s * 0.15], shade(c, 0.9))];

export const rock = (s = 1, seed = 0, c = STONE) => [bx([s * 1.3, s * 0.8, s], [0, s * 0.36, 0], c, [0, hash01(seed, 1) * 3, 0.08]),
  bx([s * 0.8, s * 0.6, s * 0.8], [s * 0.3, s * 0.72, -s * 0.1], shade(c, 1.12), [0.1, hash01(seed, 2) * 3, 0]), bx([s * 0.6, s * 0.3, s * 0.7], [-s * 0.5, s * 0.15, s * 0.25], STONE_D)];

/** A big mossy boulder for a 2.2 m cut-out. */
export const boulder = (seed = 0) => [bx([2.3, 1.7, 2.1], [0, 0.85, 0], STONE, [0, 0.3 + seed, 0.05]), bx([1.5, 1.0, 1.5], [0.2, 1.9, -0.1], shade(STONE, 1.1), [0.08, 1 + seed, 0]),
  bx([1.6, 0.14, 1.5], [0.2, 2.44, -0.1], 0x5a9a3e, [0.08, 1 + seed, 0]), bx([1.2, 0.6, 1.0], [-0.9, 0.3, 0.8], STONE_D, [0, seed * 2, 0])];

export const flower = (c = PETALS[0], h = 0.34) => [bx([0.04, h, 0.04], [0, h / 2, 0], 0x3f8a34), bx([0.16, 0.08, 0.16], [0, h, 0], c), bx([0.06, 0.1, 0.06], [0, h + 0.02, 0], 0xffe07a)];
export const mushroom = (s = 1, c = 0xd8402a) => [bx([0.14 * s, 0.3 * s, 0.14 * s], [0, 0.15 * s, 0], 0xf0e6d0), bx([0.46 * s, 0.16 * s, 0.46 * s], [0, 0.36 * s, 0], c),
  bx([0.3 * s, 0.1 * s, 0.3 * s], [0, 0.48 * s, 0], c), bx([0.08 * s, 0.03 * s, 0.08 * s], [0.1 * s, 0.45 * s, 0.1 * s], 0xffffff), bx([0.08 * s, 0.03 * s, 0.08 * s], [-0.12 * s, 0.45 * s, -0.06 * s], 0xffffff)];
export const stump = (s = 1) => [bx([0.9 * s, 0.6 * s, 0.9 * s], [0, 0.3 * s, 0], BARK), bx([0.7 * s, 0.04, 0.7 * s], [0, 0.62 * s, 0], 0xd8b88a), bx([1.2 * s, 0.2, 0.3], [0, 0.1, 0.3], BARK_D, [0, 0.6, 0])];
export const logPile = (L = 2.4) => [[-0.3, 0.2], [0.3, 0.2], [0, 0.6]].map(([x, y], k) => bx([0.5, 0.5, L - k * 0.2], [x, y + 0.05, 0], k === 2 ? LOG : LOG_D))
  .concat([[-0.3, 0.2], [0.3, 0.2], [0, 0.6]].map(([x, y]) => bx([0.36, 0.36, 0.02], [x, y + 0.05, L / 2], 0xd8b88a)));

/** Village fence along X (length L): posts and two rails. */
export function fence(L = 4) {
  const out = [], n = Math.max(2, Math.round(L / 1.3));
  for (let k = 0; k <= n; k++) out.push(bx([0.14, 1.0, 0.14], [-L / 2 + k * L / n, 0.5, 0], LOG));
  out.push(bx([L, 0.1, 0.07], [0, 0.78, 0], shade(LOG, 1.15)), bx([L, 0.1, 0.07], [0, 0.42, 0], shade(LOG, 1.15)));
  return out;
}
export const hayBale = () => [bx([1.3, 0.9, 0.9], [0, 0.45, 0], 0xe0c060), bx([1.32, 0.08, 0.92], [0, 0.3, 0], 0xb89038), bx([1.32, 0.08, 0.92], [0, 0.62, 0], 0xb89038)];

/** A sheep-village hut: plastered walls, a stepped thatch roof, a round door and window, a little chimney. */
export function hut(w = 3, seed = 0) {
  const door = [0x6fa8d8, 0xd86a5a, 0x7abf6a, 0xe0a83a][seed % 4];
  const out = [bx([w, 2.0, w], [0, 1.0, 0], PLASTER), bx([w + 0.1, 0.3, w + 0.1], [0, 0.15, 0], STONE)];
  for (let k = 0; k < 4; k++) out.push(bx([w + 0.8 - k * 0.85, 0.5, w + 0.8 - k * 0.85], [0, 2.2 + k * 0.48, 0], k % 2 ? shade(THATCH, 0.88) : THATCH));
  out.push(bx([0.8, 1.3, 0.08], [0, 0.65, w / 2 + 0.02], door), bx([0.5, 0.3, 0.09], [0, 1.42, w / 2 + 0.02], door), bx([0.1, 0.1, 0.1], [0.22, 0.7, w / 2 + 0.07], 0xffe07a));
  out.push(bx([0.6, 0.6, 0.08], [-w * 0.3, 1.3, w / 2 + 0.02], 0x8fc8e8), bx([0.7, 0.08, 0.1], [-w * 0.3, 0.96, w / 2 + 0.03], LOG));
  out.push(bx([0.08, 0.6, 0.6], [w / 2 + 0.02, 1.3, 0], 0x8fc8e8), bx([0.4, 0.9, 0.4], [w * 0.25, 3.5, -w * 0.2], STONE_D));
  return out;
}
export const well = () => [bx([1.4, 0.8, 1.4], [0, 0.4, 0], STONE), bx([1.0, 0.1, 1.0], [0, 0.82, 0], 0x2a5a8a), bx([0.12, 1.8, 0.12], [-0.7, 1.3, 0], LOG), bx([0.12, 1.8, 0.12], [0.7, 1.3, 0], LOG),
  bx([1.9, 0.14, 1.2], [0, 2.3, 0], THATCH, [0.35, 0, 0]), bx([1.9, 0.14, 1.2], [0, 2.3, 0], shade(THATCH, 0.85), [-0.35, 0, 0]), bx([0.26, 0.3, 0.26], [0, 1.3, 0], LOG_D)];
/** Lantern post → { body, lit }. */
export const lanternPost = (h = 2.6) => ({ body: [bx([0.14, h, 0.14], [0, h / 2, 0], LOG_D), bx([0.7, 0.1, 0.1], [0.3, h - 0.1, 0], LOG_D), bx([0.3, 0.06, 0.3], [0.58, h - 0.22, 0], 0x2a2018), bx([0.3, 0.06, 0.3], [0.58, h - 0.62, 0], 0x2a2018)],
  lit: [bx([0.24, 0.34, 0.24], [0.58, h - 0.42, 0], 0xffd27a)] });

/** Log palisade along X (length L, height h): pointed logs side by side, two lashings. */
export function palisade(L = 10, h = 4.5, seed = 0) {
  const out = [], n = Math.max(1, Math.round(L / 0.62));
  for (let k = 0; k < n; k++) {
    const x = -L / 2 + (k + 0.5) * L / n, hh = h * (0.9 + hash01(seed, k) * 0.16), c = k % 3 === 0 ? LOG_D : hash01(seed, k, 2) < 0.3 ? shade(LOG, 0.9) : LOG;
    out.push(bx([L / n * 0.96, hh, 0.6], [x, hh / 2, 0], c), bx([L / n * 0.5, 0.4, 0.34], [x, hh + 0.18, 0], shade(c, 1.15)));
  }
  out.push(bx([L, 0.22, 0.72], [0, h * 0.3, 0], 0x3a2c1e), bx([L, 0.22, 0.72], [0, h * 0.7, 0], 0x3a2c1e));
  return out;
}
/** A log barricade leaf (w × h): crossed logs behind a row of sharpened stakes; origin at its bottom centre. */
export function barricade(w = 18, h = 5) {
  const out = [], n = Math.round(w / 0.9);
  for (let k = 0; k < n; k++) {
    const x = -w / 2 + (k + 0.5) * w / n;
    out.push(bx([0.5, h, 0.5], [x, h / 2, 0], k % 2 ? LOG : LOG_D), bx([0.26, 0.5, 0.26], [x, h + 0.2, 0], shade(LOG, 1.2)));
    out.push(bx([0.2, 0.2, 2.0], [x, 1.0, -0.9], shade(LOG, 1.1), [0.6, 0, 0]));                 // stakes leaning toward the village
  }
  for (const y of [h * 0.3, h * 0.72]) out.push(bx([w, 0.34, 0.66], [0, y, 0], 0x3a2c1e));
  out.push(bx([w * 0.7, 0.3, 0.7], [0, h * 0.5, 0.05], LOG_D, [0, 0, 0.42]), bx([w * 0.7, 0.3, 0.7], [0, h * 0.5, 0.05], LOG_D, [0, 0, -0.42]));
  return out;
}

/** A hide tent: a stepped pyramid, a dark door flap, a pole with a red rag. */
export function tent(s = 1, c = 0x8a6a4a) {
  const out = [];
  for (let k = 0; k < 5; k++) out.push(bx([(3.4 - k * 0.68) * s, 0.56 * s, (3.4 - k * 0.68) * s], [0, (0.28 + k * 0.54) * s, 0], k % 2 ? shade(c, 0.86) : c));
  out.push(bx([0.9 * s, 1.3 * s, 0.1], [0, 0.65 * s, -1.66 * s], 0x1e1612), bx([0.1, 3.6 * s, 0.1], [0, 1.8 * s, 0], LOG_D), bx([0.7 * s, 0.4 * s, 0.04], [0.38 * s, 3.3 * s, 0], WOLF_RED));
  return out;
}
/** A war banner: a tall pole, a crossbar, a ragged cloth with a fang mark. */
export function banner(c = WOLF_RED, h = 5) {
  return [bx([0.14, h, 0.14], [0, h / 2, 0], LOG_D), bx([1.4, 0.1, 0.1], [0, h - 0.3, 0], LOG_D), bx([1.2, 1.5, 0.05], [0, h - 1.1, 0], c), bx([0.4, 0.5, 0.05], [-0.4, h - 2.05, 0], c),
    bx([0.4, 0.34, 0.05], [0.4, h - 2.0, 0], c), bx([0.16, 0.5, 0.07], [-0.2, h - 1.0, 0], 0xf0e6d0), bx([0.16, 0.5, 0.07], [0.2, h - 1.0, 0], 0xf0e6d0)];
}
/** A bonfire → { body, lit }: a ring of stones, crossed logs, flames. */
export function bonfire(s = 1) {
  const body = [], lit = [];
  for (let k = 0; k < 8; k++) body.push(bx([0.34 * s, 0.24 * s, 0.34 * s], [Math.sin(k * 0.785) * 0.9 * s, 0.12 * s, Math.cos(k * 0.785) * 0.9 * s], k % 2 ? STONE : STONE_D));
  for (let k = 0; k < 4; k++) body.push(bx([0.2 * s, 1.4 * s, 0.2 * s], [Math.sin(k * 1.57) * 0.3 * s, 0.55 * s, Math.cos(k * 1.57) * 0.3 * s], CHAR, [Math.cos(k * 1.57) * 0.5, 0, -Math.sin(k * 1.57) * 0.5]));
  lit.push(bx([0.7 * s, 0.6 * s, 0.7 * s], [0, 0.5 * s, 0], EMBER), bx([0.46 * s, 0.7 * s, 0.46 * s], [0.05 * s, 1.0 * s, 0], FLAME), bx([0.24 * s, 0.6 * s, 0.24 * s], [-0.05 * s, 1.55 * s, 0.04 * s], 0xffe9a0));
  return { body, lit };
}
export const torch = (h = 2.4) => ({ body: [bx([0.12, h, 0.12], [0, h / 2, 0], LOG_D), bx([0.26, 0.2, 0.26], [0, h, 0], CHAR)], lit: [bx([0.2, 0.3, 0.2], [0, h + 0.25, 0], EMBER), bx([0.12, 0.26, 0.12], [0, h + 0.5, 0], FLAME)] });
export const weaponRack = () => [bx([0.12, 1.4, 0.12], [-0.9, 0.7, 0], LOG_D), bx([0.12, 1.4, 0.12], [0.9, 0.7, 0], LOG_D), bx([2.0, 0.1, 0.1], [0, 1.2, 0], LOG_D),
  ...[-0.6, -0.2, 0.2, 0.6].map((x, k) => bx([0.06, 2.0, 0.06], [x, 1.0, 0.1], 0x3d342c, [0.12, 0, 0])), ...[-0.6, -0.2, 0.2, 0.6].map((x) => bx([0.1, 0.3, 0.04], [x, 2.05, -0.02], 0xb8bec6, [0.12, 0, 0]))];
export const crate = (s = 1, c = LOG) => [bx([s, s, s], [0, s / 2, 0], c), bx([s + 0.02, 0.08 * s, s + 0.02], [0, s * 0.5, 0], shade(c, 0.7)), bx([0.12 * s, s + 0.02, s + 0.02], [0, s / 2, 0], shade(c, 0.82))];
export const barrel = (c = 0x7a5230) => [bx([0.6, 0.9, 0.6], [0, 0.45, 0], c), bx([0.64, 0.06, 0.64], [0, 0.25, 0], 0x3a3a3e), bx([0.64, 0.06, 0.64], [0, 0.66, 0], 0x3a3a3e)];

/** The wolves' war totem (w × h): stacked carved wolf heads with glowing eyes, bone trophies, a horned crown.
 *  → { body, lit }. Front = −Z (it glares down the field at the village). */
export function totem(w = 5, h = 13) {
  const body = [bx([w + 2.4, 1.0, w + 2.4], [0, 0.5, 0], STONE_D), bx([w + 1.2, 0.6, w + 1.2], [0, 1.3, 0], STONE)], lit = [];
  const n = 3, hh = (h - 1.6) / n;
  for (let k = 0; k < n; k++) {
    const y = 1.6 + k * hh, s = w * (1 - k * 0.12), c = [0x5e4226, 0x6b4a2e, 0x4a3220][k];
    body.push(bx([s, hh, s], [0, y + hh / 2, 0], c));
    body.push(bx([s * 0.5, hh * 0.3, s * 0.5], [0, y + hh * 0.34, -s * 0.62], shade(c, 1.15)));          // muzzle
    body.push(bx([s * 0.22, hh * 0.1, 0.2], [0, y + hh * 0.45, -s * 0.88], 0x141210));                    // nose
    for (const sx of [-1, 1]) {
      body.push(bx([s * 0.2, hh * 0.34, s * 0.16], [sx * s * 0.36, y + hh * 1.02, -s * 0.2], shade(c, 0.8)));   // ears
      body.push(bx([s * 0.1, hh * 0.16, 0.16], [sx * s * 0.14, y + hh * 0.2, -s * 0.9], 0xf0e6d0));     // fangs
      lit.push(bx([s * 0.18, hh * 0.1, 0.1], [sx * s * 0.26, y + hh * 0.66, -s * 0.52], k === n - 1 ? 0xff3a2a : 0xffb02e));   // eyes
    }
    body.push(bx([s + 0.3, 0.3, s + 0.3], [0, y + 0.15, 0], WOLF_RED));
  }
  for (const sx of [-1, 1]) body.push(bx([0.5, 3.4, 0.5], [sx * w * 0.36, h + 1.3, 0], 0xe8dcc0, [0, 0, -sx * 0.5]), bx([0.34, 1.6, 0.34], [sx * w * 0.62, h + 3.0, 0], 0xf0e6d0, [0, 0, -sx * 0.1]));
  return { body, lit };
}
