// Voxel Connector: an oval jelly monster. One blob (on the rig's hips joint — the hips channels are its whole body) with
// two big eyes and a very large mouth — never shut, chewing slowly on its own clock — painted on its front, three black hairs on top, two little
// orange balls for hands (floating free: they ride the rig's two weapon joints, so a punch reaches as far as its clip
// says). No feet, no weapon: it hops and slides on its bottom.
// Render-only life (createConnectorSecondary): the jelly wobble (a spring on the blob's squash: it stretches in a jump,
// flattens on a landing or a slam, bounces with the run), the face (the slow chew, blinks on another clock, the mouth
// as wide as it goes on a shout, eyes blazing on Copy: Flash), the hairs swaying, and the Overclock's size — GIGA CONNECT
// blows the whole rig up 4.64× (a hundred times its volume).
// createCloneActor: one of its three clones (blue, pink, yellow — sim: ./musou.js) as its own little jelly: the same
// blob in another colour, hopping after its target, spinning up into a slam, popping in and out.
// The mask (Anonymous, ../anonymous/): a white Guy Fawkes mask — the one on logo.png: arched brows, two slit eyes, red
// cheeks, the curled moustache, the goatee, a black rim — a plate over the whole face, its own mesh on the blob (it
// squashes with the jelly). createConnectorModel(rig, true) wears it for good; on the plain model it waits pushed up
// out of sight until a screen sets rig.mask = 1 (the fighter select's secret), then flips down over the face.
import * as THREE from 'three';
import { vox } from '../../hero/model.js';
import { shade } from '../../core/voxel.js';
import { hash01 } from '../../core/rng.js';
import { HERO_SCALE } from '../../hero/rig.js';
import { ground } from '../../world/map.js';
import { B, hex, fighterMaterial } from '../shared/body.js';
import { MOVES } from './moves.js';
import { MUSOU_FRAMES } from './anims.js';

export const JC = {
  jelly: hex('#46e07a'), light: hex('#a6ffc4'), deep: hex('#1e8a4a'), gloss: hex('#eafff0'), orange: hex('#ff8a1e'), orangeD: hex('#d9620c'), orangeL: hex('#ffc070'),
  hair: hex('#16181c'), white: hex('#ffffff'), pupil: hex('#10131a'), mouth: hex('#4a0f1e'), tongue: hex('#ff6f8a'), tongueD: hex('#d94a6a'), tooth: hex('#fff6e6'), toothD: hex('#d8ccbc'), flash: hex('#fff7b0'),
};
const BV = 0.03, RX = 15, RY = 20, RZ = 13.5;                       // blob voxel (m), radii (voxels)
export const BLOB_Y = -0.06;                                          // blob centre under the hips joint (m)
/** GIGA CONNECT: linear scale at Overclock frame t (1 → 4.64 → 1): a hundred times the volume. */
export const GIANT = 4.64;
export function giantScale(t) {
  if (t <= 6 || t >= MUSOU_FRAMES - 2) return 1;
  if (t < 30) { const u = (t - 6) / 24, e = 1 - (1 - u) ** 3; return 1 + (GIANT - 1) * (e + 0.12 * Math.sin(u * Math.PI)); }   // a little overshoot
  if (t > MUSOU_FRAMES - 24) { const u = (MUSOU_FRAMES - 2 - t) / 22; return 1 + (GIANT - 1) * u * u; }
  return GIANT;
}

// ---------------------------------------------------------------- the blob, in its four faces
/** The clones' jellies (keys of JC that jelly() reads) and the glow of each one's material. */
export const CLONE_PAL = [
  { id: 'blue', jelly: hex('#4aa8ff'), light: hex('#b4deff'), deep: hex('#1e5aa8'), gloss: hex('#eef8ff'), glow: 0x0a2a6a, fx: [0.5, 1.6, 3.0] },
  { id: 'pink', jelly: hex('#ff7ac0'), light: hex('#ffc6e4'), deep: hex('#c83a8a'), gloss: hex('#fff0f8'), glow: 0x6a0a3a, fx: [3.0, 0.8, 1.9] },
  { id: 'yellow', jelly: hex('#ffd84a'), light: hex('#fff2b0'), deep: hex('#c8961e'), gloss: hex('#fffbe6'), glow: 0x6a4a00, fx: [3.0, 2.3, 0.5] },
];

const inside = (x, y, z) => { const w = 1 + 0.12 * Math.max(0, -(y + 0.5) / RY); return ((x + 0.5) / (RX * w)) ** 2 + ((y + 0.5) / RY) ** 2 + ((z + 0.5) / (RZ * w)) ** 2 <= 1; };
const jellyOf = (P) => (x, y, z) => {
  if (!inside(x, y, z)) return null;
  const u = (y + RY) / (2 * RY);                                      // 0 bottom → 1 top
  if (x < -3 && x > -11 && y > 8 && y < 16 && z > 2 && (x + y) % 5 !== 0 && hash01(x, y, 3) < 0.8) return P.gloss;   // the wet highlight
  if (hash01(x, y, z) < 0.035) return P.light;                       // bubbles
  return u > 0.78 ? P.light : u > 0.5 ? shade(P.jelly, 1.06) : u > 0.22 ? P.jelly : P.deep;
};
const EYE = { x: 6.5, y: 5.5, rx: 4.3, ry: 5.4 };
/** The face painted on the front: eyes 'idle' | 'blink' | 'flash', mouth open by `k` (0.3 … 1: it is never shut — it
 *  chews, slowly, all the time). → the colour at (x, y), or null. */
function facePaint(face, k) {
  return (x, y, z) => {
    if (z < 2) return null;
    const cx = x + 0.5, cy = y + 0.5;
    for (const s of [-1, 1]) {                                        // eyes
      const ex = (cx - s * EYE.x) / EYE.rx, ey = (cy - EYE.y) / EYE.ry, d = ex * ex + ey * ey;
      if (d > 1) continue;
      if (face === 'blink') return Math.abs(cy - EYE.y + 1) < 1 ? JC.pupil : null;
      if (face === 'flash') return d > 0.8 ? JC.orangeL : JC.flash;
      const qx = cx - s * (EYE.x - 0.9), qy = cy - (EYE.y - 0.4);      // the pupil: a tall oval toward the nose, one catch-light
      if (Math.abs(qx + 0.9) < 0.6 && Math.abs(qy - 1.3) < 0.6) return JC.white;
      if ((qx / 2.3) ** 2 + (qy / 3.2) ** 2 <= 1) return JC.pupil;
      return JC.white;
    }
    if (Math.abs(cx) > 10.5) return null;                            // mouth: the upper lip line stays, the jaw drops by k
    const top = -2.5 + 0.02 * cx * cx, gap = (10 - 0.055 * cx * cx) * k, bot = top - gap;
    // the big tongue: once the mouth is past half open it lolls out over the lower lip, further the wider the mouth
    if (gap > 3.2) {
      const hang = 1 + (gap - 3.2) * 0.55, half = 5.6 - Math.max(0, bot - cy) * 1.1;
      if (cy < bot + 4.2 && cy > bot - hang && Math.abs(cx) < half) return cy < bot - hang + 1.2 || Math.abs(cx) > half - 1.1 ? JC.tongueD : JC.tongue;
    }
    if (cy > top || cy < bot) return null;
    if (cy > top - 1.6) return Math.abs(Math.round(cx)) % 5 === 0 ? JC.toothD : JC.tooth;   // a tight top row: seams, no gaps
    if (cy < bot + 1.4) return Math.abs(Math.round(cx) + 2) % 5 === 0 ? JC.toothD : JC.tooth;   // bottom row on the jaw
    return JC.mouth;
  };
}
const blobGeo = (face, k, pal = JC) => vox([B([-18, -21, -17], [18, 21, 17], jellyOf(pal)), { a: [-13, -15, 2], b: [13, 13, 17], c: facePaint(face, k), paint: true }], BV, { jitter: 0.05, ao: 0.28 });
const EYES = ['idle', 'blink', 'flash'], MOUTH = [0.3, 0.5, 0.72, 1];   // the baked variants: 3 eye states × 4 jaw positions
/** Jaw position 0-3 of the slow chew at time t (s): one chew ≈ 5.4 s (drifting between ≈ 4.6 and 6.2 s, never in step
 *  with the blinks) — opens over 0.7 s, HOLDS open for ≈ 2.6 s, closes over 1 s, rests nearly shut for ≈ 1 s. */
export const chew = (t) => {
  const u = (t / 5.4 + 0.12 * Math.sin(t * 0.37)) % 1;                // the chew's phase; its rate wanders but never reverses
  const o = u < 0.13 ? u / 0.13 : u < 0.62 ? 1 : u < 0.8 ? 1 - (u - 0.62) / 0.18 : 0;
  return Math.max(0, Math.min(3, Math.floor(o * 3.999)));
};

// ---------------------------------------------------------------- the mask
const MK = { white: hex('#f6f4ee'), ink: hex('#16181c'), red: hex('#e0202a') };
const MASK_Y = [-16, 13], MASK_Z = 7, MASK_T = 2;                    // rows it covers; the plate never sits further back than MASK_Z; its thickness
/** Half-width (voxels) of the mask at row y: a rounded brow, straight temples, a long oval chin. */
const maskHalf = (y) => { const c = y + 0.5; return c > 9.5 ? 12 - 0.25 * (c - 9.5) ** 2 : c > 1 ? 12 : 12 * Math.sqrt(Math.max(0, 1 - ((1 - c) / 17.2) ** 2)); };
const inMask = (x, y) => y >= MASK_Y[0] && y <= MASK_Y[1] && Math.abs(x + 0.5) < maskHalf(y);
/** The mask's drawing at column (x, y) (k = voxels from its centre line): → colour, or null off the mask. */
function maskPaint(x, y, glow) {
  if (!inMask(x, y)) return null;
  if (!inMask(x - 1, y) || !inMask(x + 1, y) || !inMask(x, y - 1) || !inMask(x, y + 1)) return MK.ink;   // the rim
  const k = Math.floor(Math.abs(x + 0.5));
  if ((y === 9 && k >= 3 && k <= 7) || (y === 8 && (k === 2 || k === 8))) return MK.ink;                  // arched brows
  if ((y === 4 || y === 3) && k >= 2 && k <= 7) return glow ? JC.flash : MK.ink;                         // the eye slits
  if ((y === 0 || y === -1) && k >= 6 && k <= 9) return MK.red;                                           // cheeks
  if ((y === -4 && k === 9) || (y === -5 && (k === 0 || k === 8)) || (y === -6 && (k === 1 || k === 7)) || (y === -7 && k >= 2 && k <= 6)) return MK.ink;   // the moustache: two curls off a peak
  if (k === 0 && y <= -10 && y >= -14) return MK.ink;                                                     // the goatee
  return MK.white;
}
/** The blob's front surface at column (x, y) (voxels; -99: the column misses the blob). */
const frontZ = (x, y) => { for (let z = 17; z >= -17; z--) if (inside(x, y, z)) return z; return -99; };
const maskBuild = (glow) => {
  const front = new Map(), at = (x, y) => { const key = x * 64 + y; if (!front.has(key)) front.set(key, frontZ(x, y)); return front.get(key); };
  return vox([B([-13, MASK_Y[0], MASK_Z - 1], [13, MASK_Y[1] + 1, 20], (x, y, z) => {
    const s = at(x, y);
    return z > s && z <= Math.max(s, MASK_Z) + MASK_T ? maskPaint(x, y, glow) : null;                   // a plate standing just proud of the jelly
  })], BV, { jitter: 0.03, ao: 0.2 });
};
let MASKS = null;
/** The mask's two geometries (shared by every wearer): plain, and `glow` — the eye slits blazing on Copy: Flash. */
const maskGeo = () => MASKS || (MASKS = { on: maskBuild(false), glow: maskBuild(true) });
const maskMaterial = () => fighterMaterial({ roughness: 0.38, metalness: 0, emissive: new THREE.Color(0x3a3834), emissiveIntensity: 0.3 }, 0.35, 0.9);

const ballGeo = (r, c, cL, cD, sx = 1, sy = 1, sz = 1) => vox([B([-7, -7, -8], [7, 7, 8], (x, y, z) => {
  const d = ((x + 0.5) / (r * sx)) ** 2 + ((y + 0.5) / (r * sy)) ** 2 + ((z + 0.5) / (r * sz)) ** 2;
  return d > 1 ? null : y > r * sy * 0.35 && x < 0 ? cL : y < -r * sy * 0.4 ? cD : c;
})], BV, { jitter: 0.05, ao: 0.3 });
const hairGeo = (k) => vox([B([0, 0, 0], [1, 8 + k, 1], JC.hair), B([1, 7 + k, 0], [3, 8 + k, 1], JC.hair), B([2, 5 + k, 0], [3, 7 + k, 1], JC.hair)], BV, { off: [-0.5, 0, -0.5], jitter: 0.02, ao: 0.1 });

/** masked: the model wears the mask for good (Anonymous); else it carries it hidden (rig.mask puts it on). */
export function createConnectorModel(rig, masked = false) {
  const mat = fighterMaterial({ roughness: 0.28, metalness: 0, emissive: new THREE.Color(0x0a5a2a), emissiveIntensity: 0.18 }, 0.35, 1.1);
  const ballMat = fighterMaterial({ roughness: 0.4, emissive: new THREE.Color(0x5a2400), emissiveIntensity: 0.2 }, 0.35, 0.9);
  const meshes = {};
  const add = (parent, geo, name, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; parent.add(o); meshes[name] = o; return o; };
  const faces = {};
  for (const e of EYES) MOUTH.forEach((k, i) => { faces[e + i] = blobGeo(e, k); });
  const blob = add(rig.joints.hips, faces.idle3, 'blob', mat);
  blob.position.y = BLOB_Y;
  const hairMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.5 });
  const hairs = [-1, 0, 1].map((k) => {
    const h = add(blob, hairGeo(k === 0 ? 2 : 0), 'hair' + k, hairMat);
    h.position.set(k * 0.11, 0.58 - Math.abs(k) * 0.03, 0.02); h.rotation.z = -k * 0.4; h.rotation.y = k ? 0 : Math.PI;
    return h;
  });
  const hand = ballGeo(4.2, JC.orange, JC.orangeL, JC.orangeD);
  add(rig.joints.weapon, hand, 'handR', ballMat); add(rig.joints.weaponL, hand, 'handL', ballMat);
  const mask = new THREE.Mesh(maskGeo().on, maskMaterial());
  mask.castShadow = true; mask.visible = masked; blob.add(mask);
  if (masked) meshes.mask = mask;                                     // part of the body (dodge afterimages) only when it is worn
  rig.connector = { blob, hairs, faces, mask, masked };
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: wobble, face, hairs, the giant
const OPEN_MOVES = { c1: [16, 50], n6: [20, 36], c2: [12, 30], c3: [8, 60], c5: [6, 66], c6: [10, 60], dash: [4, 30], jc: [4, 44], n4: [8, 18] };
const SLAMS = ['n6', 'c5', 'c6', 'jc'];

export function createConnectorSecondary(scene, rig, mat, hero) {
  const C = rig.connector, blob = C.blob;
  let t = 0, y = 1, v = 0, face = '', lastMove = -1;
  let mk = C.masked ? 1 : 0;                                          // the mask: 0 pushed up out of sight … 1 over the face
  return {
    reset() { y = 1; v = 0; mk = (rig.mask ?? (C.masked ? 1 : 0)) ? 1 : 0; },
    update(dt) {
      t += dt;
      const h = hero;
      // ---- squash target from what it is doing; a spring follows it (k 170, damping 12: two or three wobbles)
      let want = 1 + 0.03 * Math.sin(t * 2.4);
      let nf = (t % 3.4) < 0.12 || (t % 7.9) < 0.1 ? 'blink' : 'idle', jaw = chew(t);   // eyes; the jaw chews on its own clock
      if (h) {
        if (h.dead) { want = 0.5; nf = 'blink'; jaw = 1; }
        else if (h.state === 'run') want = 1 + 0.08 * Math.sin(h.runPhase * 2) * Math.min(1, h.speed / 8);
        else if (h.state === 'jump') want = h.vy > 0 ? 1.16 : 1.06;
        else if (h.state === 'land') want = 0.8;
        else if (h.state === 'hurt') { want = 0.88; jaw = 3; }
        else if (h.state === 'musou') { want = 1; jaw = 3; }
        else if (h.state === 'attack') {
          const m = MOVES[h.move], o = OPEN_MOVES[h.move];
          if (h.moveSeq !== lastMove) { lastMove = h.moveSeq; v += 1.6; }                    // every move starts with a wobble
          if (o && h.moveT >= o[0] && h.moveT <= o[1]) jaw = 3;                                // a shout: as wide as it goes
          if (h.move === 'c4' && h.moveT >= 12 && h.moveT <= 44) nf = 'flash';
          if (SLAMS.includes(h.move)) for (const w of m.hits) if (h.moveT >= w.f[0] && h.moveT < w.f[0] + 6) want = 0.72;   // flat on a slam
        }
      }
      const n = Math.max(1, Math.min(4, Math.round(dt * 120)));
      for (let i = 0; i < n && dt > 0; i++) { const s = dt / n; v += (170 * (want - y) - 12 * v) * s; y += v * s; }
      y = Math.max(0.4, Math.min(1.5, y));
      const xz = 1 / Math.sqrt(y);
      blob.scale.set(xz, y, xz);
      blob.position.y = BLOB_Y + (y - 1) * 0.56;                      // its bottom stays where it was
      // ---- the mask: flips down from the top of the head over 0.3 s (and back up); under it the mouth stays shut
      const wantM = (rig.mask ?? (C.masked ? 1 : 0)) ? 1 : 0;
      if (mk !== wantM) mk = Math.max(0, Math.min(1, mk + Math.sign(wantM - mk) * dt * 3.4));
      C.mask.visible = mk > 0;
      if (mk > 0) {
        const e = 1 - (1 - mk) ** 3, G = maskGeo(), g = nf === 'flash' ? G.glow : G.on;
        C.mask.rotation.x = -(1 - e) * 1.25; C.mask.scale.setScalar(0.55 + 0.45 * e + 0.12 * Math.sin(e * Math.PI));
        if (C.mask.geometry !== g) C.mask.geometry = g;
        if (mk > 0.6) jaw = 0;
      }
      const key = nf + jaw;
      if (key !== face) { face = key; blob.geometry = C.faces[key]; }
      C.hairs.forEach((m, k) => {
        const sway = Math.sin(t * 2.2 + k * 1.3) * 0.12 + v * 0.06;
        m.rotation.z = -(k - 1) * 0.4 + sway; m.rotation.x = (h ? -Math.min(0.6, h.speed * 0.05) : 0) + Math.sin(t * 1.7 + k) * 0.06;
      });
      // ---- GIGA CONNECT: the whole rig, a hundred times the volume
      const g = h && h.state === 'musou' ? giantScale((h.musouT || 0) * MUSOU_FRAMES) : 1;
      if (g !== 1) { rig.root.scale.setScalar(HERO_SCALE * g); }
      rig.root.updateMatrixWorld(true);
    },
  };
}

// ---------------------------------------------------------------- a clone: its own little jelly
/** One clone of palette `pal` under `scene` → { update(dt, q) } (q: its sim record, ./musou.js; render-only).
 *  masked: Anonymous's clones wear its mask (and keep their mouths shut under it). */
export function createCloneActor(scene, pal, masked = false) {
  const S = HERO_SCALE * 0.8, root = new THREE.Group();
  root.visible = false; scene.add(root);
  const mat = fighterMaterial({ roughness: 0.28, metalness: 0, emissive: new THREE.Color(pal.glow), emissiveIntensity: 0.35 }, 0.35, 1.1);
  const ballMat = fighterMaterial({ roughness: 0.4, emissive: new THREE.Color(0x5a2400), emissiveIntensity: 0.2 }, 0.35, 0.9);
  const hairMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.5 });
  const geo = masked ? { calm: blobGeo('idle', 0.3, pal) } : { calm: blobGeo('idle', 0.5, pal), shout: blobGeo('idle', 1, pal), blink: blobGeo('blink', 0.5, pal) };
  if (masked) geo.shout = geo.blink = geo.calm;
  const mesh = (g, m, parent = root) => { const o = new THREE.Mesh(g, m); o.castShadow = true; parent.add(o); return o; };
  const blob = mesh(geo.calm, mat);
  if (masked) mesh(maskGeo().on, maskMaterial(), blob);
  [-1, 0, 1].forEach((k) => { const h = mesh(hairGeo(k === 0 ? 2 : 0), hairMat, blob); h.position.set(k * 0.11, 0.58 - Math.abs(k) * 0.03, 0.02); h.rotation.z = -k * 0.4; });
  const hand = ballGeo(4.2, JC.orange, JC.orangeL, JC.orangeD), hands = [mesh(hand, ballMat), mesh(hand, ballMat)];
  let t = pal.glow % 7, phase = 0, k = 0;
  return {
    update(dt, q, windup) {
      t += dt;
      // presence: pops in over its first frames, shrinks away over its last
      const want = q.on ? Math.min(1, q.age / 8, q.life / 20) : 0;
      k += (want - k) * Math.min(1, dt * 20);
      root.visible = k > 0.02;
      if (!root.visible) return;
      if (q.spd) phase += dt * 15;
      // a strike: a spinning hop up over the wind-up, flat on the ground when it lands
      const u = q.atk > 0 && q.atk <= windup ? q.atk / windup : 0, flat = q.atk > windup ? Math.max(0, 1 - (q.atk - windup) / 8) : 0;
      const hop = q.atk > 0 ? Math.sin(u * Math.PI) * 0.9 : q.spd ? Math.abs(Math.sin(phase)) * 0.3 : 0.03 * Math.sin(t * 2.4);
      const sy = 1 + 0.14 * Math.sin(u * Math.PI) - 0.34 * flat + (q.spd && !q.atk ? 0.08 * Math.sin(phase * 2) : 0), sx = 1 / Math.sqrt(sy);
      root.position.set(q.x, ground(q.x, q.z) + hop * S, q.z);
      root.rotation.y = q.yaw + u * Math.PI * 2;
      root.scale.setScalar(S * (0.15 + 0.85 * k));
      blob.scale.set(sx, sy, sx); blob.position.y = 0.76 + (sy - 1) * 0.56;
      const g = q.atk > 0 ? geo.shout : (t % 3.1) < 0.12 ? geo.blink : geo.calm;
      if (blob.geometry !== g) blob.geometry = g;
      const sw = q.spd ? Math.sin(phase) * 0.3 : 0, up = u ? 0.5 * Math.sin(u * Math.PI) : -0.3 * flat;
      hands[0].position.set(-0.66, 0.92 + up, 0.12 + sw); hands[1].position.set(0.66, 0.92 + up, 0.12 - sw);
    },
  };
}
