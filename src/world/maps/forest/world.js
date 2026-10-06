// The Forest's world builder (render-only; registered in the world registry, src/world/world.js). A green valley on a
// clear morning that the invasion turns into a battlefield: the Village Meadow (flowers, blossom trees, the sheep
// village's huts and fences), the Whispering Woods (great oaks, pines, mushrooms, moss) and the Battlefield (scorched
// earth, burnt trees, the wolves' tents, banners, bonfires and their war totem). Two log palisades cross the valley;
// their barricades (gates 'gateA' / 'gateB') sink into the ground when their gate opens.
// The mood follows the fight (`war` 0…1 from the K.O. count): the sky clouds over with smoke, the light turns from
// white morning sun to a low orange, petals in the air give way to embers. The boss wolf's howl (story fx.dark) brings
// the night: moonlight, and only the fires light the field.
// Story fx (src/chars/officers/bosses.js → game.story.fx): attack telegraphs (red discs filling up), impact rings,
// travelling shock waves, falling boulders. Never writes sim state.
// `look`: the forest's grade for the post chain (post.js setLook) — bright sunlit colour, cool shade under the trees.
import * as THREE from 'three';
import { GATES, MAP, smooth, noise2, walkIn, TERRAIN as G, PIECE_IDS, node } from '../../map.js';
import { buildGround } from '../../kit/terrain.js';
import { place, merge, propMaterial, bx, oak, pine, deadTree, bush, rock, boulder, flower, mushroom, stump, logPile, fence, hayBale, hut, well, lanternPost,
  palisade, barricade, tent, banner, bonfire, torch, weaponRack, crate, barrel, totem, LEAVES, AUTUMN, PETALS, LOG, LOG_D } from '../../kit/forest.js';
import { createSky, horizon, setSun, SUN_DIR } from '../../sky.js';
import { hash01 } from '../../../core/rng.js';

const SHADOW_BOX = 30;
const GATE_W = 9, GATE_H = 4.4;                                     // gap half width / barricade height
const WALLS = [['gateA', -110], ['gateB', -39]];
const RING_COL = { slam: [3.0, 0.6, 0.3], bash: [3.0, 1.2, 0.3], shock: [0.6, 2.0, 3.2], snare: [3.0, 1.6, 0.3], boulder: [3.0, 0.5, 0.4], pack: [1.6, 0.8, 3.0] };
// the sun: high, behind the defender's left shoulder — the invaders are front-lit
const SUN_AZ = -2.3, SUN_ELEV = 0.92;
const LOOK = {
  exposure: 0.8, tmContrast: 2.1, tmMidIn: 0.2, tmMidOut: 0.2, sat: 1.08,
  shadowTint: [0.9, 0.98, 1.14], highTint: [1.05, 1.01, 0.93],            // split tone: cool shade, warm sunlight
  hazeCool: [0.45, 0.6, 0.75], hazeWarm: [0.6, 0.62, 0.6], hazeStart: 20, hazeMax: 0.1, skyGain: 0.9, farGain: 0.9,
};
const BLOSSOM = [0xffa8c8, 0xff8fb6, 0xffc2d8], C3 = (h) => new THREE.Color(h);

/** How far the ground climbs outside the walk field: the banks the trees stand on. */
const rise = (x, z, out) => Math.min(5, out * 0.42) * (0.55 + 0.9 * noise2(x * 0.07, z * 0.07, 5));
const bankY = (x, z) => { const d = walkIn(x, z); return d > -0.6 ? 0 : rise(x, z, -d - 0.6); };

/** The wooden tally board: the live K.O. count against the goal, redrawn when it changes. */
function tallyBoard() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160;
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  let shown = -1;
  const draw = (kos, goal) => {
    if (kos === shown) return;
    shown = kos;
    g.fillStyle = '#6b4a2e'; g.fillRect(0, 0, 512, 160);
    for (let y = 0; y < 160; y += 32) { g.fillStyle = (y / 32) % 2 ? '#7a5636' : '#63432a'; g.fillRect(0, y, 512, 30); }
    g.strokeStyle = '#3a2816'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 152);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffe9b0'; g.font = '900 28px "Arial Black", Arial, sans-serif';
    g.fillText('INVADERS SENT PACKING', 256, 34);
    g.fillStyle = kos >= goal ? '#9aff7a' : '#fff6e0'; g.font = '900 82px "Arial Black", Arial, sans-serif';
    g.fillText(`${Math.min(kos, 9999)} / ${goal}`, 256, 102);
    tex.needsUpdate = true;
  };
  draw(0, 1000);
  return { tex, draw };
}

export function buildForest(scene, root) {
  setSun(SUN_AZ, SUN_ELEV);
  const sky = createSky();
  root.add(sky.mesh);
  scene.background = new THREE.Color(0x9fd0f0);
  scene.fog = new THREE.Fog(horizon(0, 0), 70, 230);
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6f8f4a, 2.5);
  root.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 3.2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 180 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);

  // ---- ground: meadow grass, the dirt track up the valley, moss and leaf litter under the oaks, scorched earth on the
  // battlefield, darker forest floor on the banks
  const GRASS = [0x7cc452, 0x6ab446, 0x8fd45e], MOSS = [0x5a9e46, 0x4f8f3e, 0x66aa4e], DIRT = [0xb08a5a, 0x9a7648], ASH = [0xa08a64, 0x8c7654, 0xb09a70];
  const pick = (a, n) => a[Math.min(a.length - 1, Math.floor(n * a.length))];
  buildGround(root, {
    roughness: 0.95, metalness: 0, jitter: 0.1, rise,
    colorAt(x, z, y, inside, out) {
      const n = noise2(x * 0.16, z * 0.16, 3), m = noise2(x * 0.5 + 9, z * 0.5, 8);
      if (inside < -0.6) return z > -44 ? pick([0x6a7a44, 0x5a6a3c, 0x76804a], m) : pick([0x3f7a34, 0x356a30, 0x4a8a3a], m);
      const id = PIECE_IDS[G.own[node(x, z)]];
      const track = Math.abs(x + (noise2(z * 0.05, 1, 11) - 0.5) * 3) < 2.0 + n * 1.2;
      if (id === 'gateA' || id === 'gateB') return pick(DIRT, m);
      if (id === 'field') {
        if (noise2(x * 0.09 + 30, z * 0.09, 21) > 0.68) return m > 0.5 ? 0x4a3e36 : 0x5a4c40;      // burn scars
        if (inside < 3 && m > 0.45) return 0x7a9a46;                                              // grass holding on at the edge
        return track ? pick([0xb89a6c, 0xa68a5e], m) : pick(ASH, n);
      }
      if (track) return pick(DIRT, m);
      if (id === 'woods') return noise2(x * 0.3, z * 0.3, 17) > 0.66 ? 0x8a7a3e : pick(MOSS, n);  // leaf litter in the moss
      return m > 0.86 ? 0xa2e070 : pick(GRASS, n);                                                 // meadow, clover patches
    },
  });

  // boxes are bucketed along z (52 m chunks), so a view up the valley only draws the chunks in frame
  const buckets = [], lit = [];
  const put = (list, x, y, z, yaw = 0, k = 1) => { const b = Math.max(0, Math.min(4, Math.floor((z + 200) / 52))); (buckets[b] || (buckets[b] = [])).push(...place(list, x, y, z, yaw, k)); };
  const putLit = (p, x, y, z, yaw = 0, k = 1) => { put(p.body, x, y, z, yaw, k); lit.push(...place(p.lit, x, y, z, yaw, k)); };
  const fires = [], keep = [];                                      // fire spots (lights, embers) · spots the tree scatter leaves clear
  const fire = (x, y, z, s = 1) => fires.push({ position: new THREE.Vector3(x, y, z), s });
  const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];

  // ---- set pieces on the field (carved out of the walk field: src/world/maps/forest/map.js)
  MAP.oaks.forEach((r, k) => { const [x, z] = mid(r); put(oak(7 + (k % 3) * 0.8, 4.2, k * 7 + 1), x, 0, z, k * 1.3); });
  MAP.boulders.forEach((r, k) => { const [x, z] = mid(r); put(boulder(k), x, 0, z); });
  MAP.stumps.forEach((r, k) => { const [x, z] = mid(r); putLit(deadTree(7 + k % 2, k * 5 + 2), x, 0, z, k * 0.9); });
  putLit(totem(4.4, 12), 0, 0, 33.6);
  putLit(bonfire(1.5), 0, 0, 28.8); fire(0, 1.6, 28.8, 2);
  MAP.huts.forEach((r, k) => {
    const [x, z] = mid(r), sx = Math.sign(x);
    put(hut(3.0, k), x, 0, z - 2.6, -sx * Math.PI / 2);
    put(hayBale(), x, 0, z + 2.2, 0.2 * k); put(hayBale(), x + sx * 0.1, 0, z + 3.9, 1.3); put(hayBale(), x, 0.9, z + 3.0, 0.4);
    put(fence(3.4), x - sx * 1.75, 0, z + 4.4, Math.PI / 2);
  });

  // ---- the sheep village behind the start: huts round a well, fences, lantern posts
  for (const [x, z, yaw, k] of [[-17, -189, 0.3, 1], [-7, -192, 0, 2], [6, -191.5, -0.1, 3], [17, -188.5, -0.35, 0], [-26, -186, 0.7, 2], [26, -186, -0.7, 1]]) {
    put(hut(3.4, k), x, bankY(x, z), z, yaw + Math.PI, 1.15); keep.push([x, z, 4.2]);
  }
  put(well(), 0, bankY(0, -185.5), -185.5); keep.push([0, -185.5, 3]);
  for (let k = -5; k <= 5; k++) if (Math.abs(k) > 1) put(fence(4.2), k * 4.4, bankY(k * 4.4, -182.6), -182.6);
  for (const x of [-4.6, 4.6]) putLit(lanternPost(), x, bankY(x, -182.4), -182.4, x > 0 ? Math.PI : 0);

  // ---- the palisades and their barricades
  for (const [, z] of WALLS) {
    for (const sx of [-1, 1]) {
      put(palisade(26, 4.8, z + sx), sx * (GATE_W + 13.4), 0, z); keep.push([sx * 16, z, 4], [sx * 24, z, 4], [sx * 32, z, 4]);
      put([bx([0.9, 6.4, 0.9], [0, 3.2, 0], LOG_D), bx([1.1, 0.4, 1.1], [0, 6.5, 0], LOG)], sx * (GATE_W + 0.5), 0, z);
      putLit(torch(2.6), sx * (GATE_W + 1.2), 0, z - 1.1); fire(sx * (GATE_W + 1.2), 3, z - 1.1, 0.7);
    }
    put([bx([GATE_W * 2 + 2, 0.5, 0.6], [0, 6.0, 0], LOG)], 0, 0, z);
    put(banner(), -GATE_W - 2.6, 0, z - 0.8); put(banner(), GATE_W + 2.6, 0, z - 0.8);
  }

  // ---- the wolves' war camp round the battlefield: tents and bonfires on the banks, banners, torches, racks, crates
  for (const [x, z, s] of [[-37, -22, 1.2], [37, -18, 1.1], [-38, 2, 1.3], [38, 6, 1.2], [-37, 24, 1.1], [37, 28, 1.3], [-14, 45, 1.2], [14, 46, 1.3], [0, 47, 1.5]]) {
    put(tent(s, [0x8a6a4a, 0x7a5a40, 0x9a7650][Math.abs(Math.round(x + z)) % 3]), x, bankY(x, z) - 0.2, z, Math.atan2(-x, -z)); keep.push([x, z, 4]);
  }
  for (const [x, z] of [[-34, -8], [34, 16], [22, 42]]) { putLit(bonfire(1), x, bankY(x, z), z); fire(x, bankY(x, z) + 1.2, z, 1.2); keep.push([x, z, 2.5]); }
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) {
    const z = -30 + k * 12.5, x = sx * 32.4;
    put(banner(k % 2 ? 0xa82a1e : 0x8a2018, 5 + (k % 3) * 0.5), x, bankY(x, z), z, sx * 0.3); keep.push([x, z, 1.6]);
    if (k % 2) { putLit(torch(2.4), x - sx * 0.2, bankY(x, z + 6), z + 6); fire(x - sx * 0.2, 2.8, z + 6, 0.7); }
  }
  for (const [x, z, yaw] of [[-32.6, -30, 1.57], [32.6, -4, -1.57], [-32.6, 12, 1.57], [10, 39.6, 0], [-10, 39.6, 0]]) put(weaponRack(), x, bankY(x, z), z, yaw);
  for (let k = 0; k < 16; k++) {
    const sx = k % 2 ? 1 : -1, z = -34 + hash01(k, 3) * 70, x = sx * (32 + hash01(k, 5) * 1.6);
    put(k % 3 === 0 ? barrel() : crate(0.7 + hash01(k, 4) * 0.5, k % 4 ? LOG : 0x5e4a36), x, bankY(x, z), z, hash01(k, 6) * 3);
  }
  // small fires still burning on the scorched ground (no collision: they are knee high)
  for (let k = 0; k < 9; k++) {
    const x = (hash01(k, 31) - 0.5) * 52, z = -30 + hash01(k, 32) * 54;
    if (walkIn(x, z) < 1.5 || Math.hypot(x, z) < 5) continue;
    lit.push(...place([bx([0.5, 0.3, 0.5], [0, 0.15, 0], 0xff6a1e), bx([0.3, 0.4, 0.3], [0.04, 0.44, 0], 0xffc23a)], x, 0, z, k));
    put([bx([1.0, 0.1, 1.0], [0, 0.04, 0], 0x1a1614, [0, k, 0]), bx([0.9, 0.16, 0.16], [0.1, 0.1, 0.1], 0x2a2422, [0, k * 2, 0])], x, 0, z);
    fire(x, 0.7, z, 0.5);
  }

  // ---- the trees on the banks: blossom and broad-leaf round the meadow, tall oaks and pines round the woods, pines,
  // autumn and burnt trees round the battlefield. A jittered 4 m grid over everything within 28 m of the walk edge.
  const clear = (x, z) => keep.some(([kx, kz, r]) => (x - kx) ** 2 + (z - kz) ** 2 < r * r);
  for (let gz = -198; gz <= 54; gz += 4) for (let gx = -62; gx <= 62; gx += 4) {
    const h1 = hash01(gx, gz, 1), h2 = hash01(gx, gz, 2), h3 = hash01(gx, gz, 3), seed = Math.round(h1 * 997);
    const x = gx + (h1 - 0.5) * 3, z = gz + (h2 - 0.5) * 3, d = walkIn(x, z);
    if (d > -2.4 || d < -30 || clear(x, z)) continue;
    const y = bankY(x, z) - 0.25, near = d > -9, yaw = h3 * 6.28;
    if (z < -112) {
      if (h3 < 0.14) continue;
      if (h3 < 0.3) put(oak(3.2 + h2 * 1.6, 2 + h1, seed, BLOSSOM), x, y, z, yaw);
      else if (h3 < 0.84) put(oak(3.6 + h2 * 2.6, 2.2 + h1 * 1.4, seed), x, y, z, yaw);
      else put(pine(7 + h2 * 4, 2 + h1, seed), x, y, z, yaw);
    } else if (z < -40) {
      if (h3 < 0.06) continue;
      if (h3 < 0.55) put(oak(5.5 + h2 * 3.5, 2.8 + h1 * 1.6, seed, [0x3f9434, 0x358a3e, 0x2f7e3a, 0x4fa83a]), x, y, z, yaw);
      else put(pine(9 + h2 * 6, 2.2 + h1 * 1.2, seed), x, y, z, yaw);
    } else {
      if (h3 < 0.2) continue;
      if (near && h3 < 0.5) putLit(deadTree(4.5 + h2 * 3, seed), x, y, z, yaw);
      else if (h3 < 0.62) put(oak(4 + h2 * 3, 2.2 + h1 * 1.2, seed, AUTUMN), x, y, z, yaw);
      else put(pine(8 + h2 * 5, 2 + h1, seed), x, y, z, yaw);
    }
  }
  // ---- undergrowth just outside the walk edge (bushes, rocks, stumps, logs) and, on the walk field itself, things too
  // small to block anyone: flowers in the meadow, mushrooms and ferns in the woods
  for (let gz = -196; gz <= 52; gz += 2.5) for (let gx = -60; gx <= 60; gx += 2.5) {
    const h1 = hash01(gx * 4, gz * 4, 41), h2 = hash01(gx * 4, gz * 4, 42), h3 = hash01(gx * 4, gz * 4, 43);
    const x = gx + (h1 - 0.5) * 2.2, z = gz + (h2 - 0.5) * 2.2, d = walkIn(x, z);
    if (d < -4.5 || clear(x, z)) continue;
    if (d < -0.9) {
      const y = bankY(x, z) - 0.1;
      if (h3 < 0.3) put(bush(0.8 + h1 * 0.7, z > -40 ? [0x5a6a34, 0x6a5a30][h2 > 0.5 ? 1 : 0] : LEAVES[Math.floor(h2 * 5) % 5], gx), x, y, z, h1 * 6);
      else if (h3 < 0.42) put(rock(0.6 + h2 * 0.8, gx + gz), x, y, z, h1 * 6);
      else if (h3 < 0.48) put(stump(0.8 + h1 * 0.5), x, y, z, h2 * 6);
      else if (h3 < 0.52) put(logPile(2 + h1), x, y, z, h2 * 6);
      continue;
    }
    if (d < 0.6 || Math.abs(x) < 3.5) continue;
    if (z < -112) { if (h3 < 0.5) put(flower(PETALS[Math.floor(h1 * 6) % 6], 0.24 + h2 * 0.2), x, 0, z, h1 * 6, 1.25); }
    else if (z < -40) {
      if (h3 < 0.16) put(mushroom(0.7 + h1 * 0.9, h2 > 0.7 ? 0xe8b23a : 0xd8402a), x, 0, z, h1 * 6);
      else if (h3 < 0.3) put([bx([0.5, 0.26, 0.08], [0, 0.13, 0], 0x4f9a3e, [0, 0, 0.3]), bx([0.5, 0.26, 0.08], [0, 0.13, 0], 0x3f8a36, [0, 1.6, -0.3])], x, 0, z, h1 * 6);
    } else if (h3 < 0.07) put([bx([0.3, 0.12, 0.3], [0, 0.06, 0], 0x4a4038, [0, h1 * 3, 0]), bx([0.06, 0.5, 0.06], [0.1, 0.2, 0], 0x3d342c, [0.9, h2 * 6, 0])], x, 0, z);   // rubble, a broken spear
  }

  const propMat = propMaterial();
  for (const b of buckets) if (b && b.length) { const m = new THREE.Mesh(merge(b), propMat); m.castShadow = m.receiveShadow = true; root.add(m); }
  const litMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.9, 1.9, 1.9), fog: true });
  root.add(new THREE.Mesh(merge(lit), litMat));

  // ---- the tally boards: over both barricades and on the village side of the start
  const board = tallyBoard(), boardMat = new THREE.MeshBasicMaterial({ map: board.tex, color: new THREE.Color(0.9, 0.9, 0.9) });
  for (const [x, y, z, w] of [[0, 7.6, -110.4, 9], [0, 7.6, -39.4, 9]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 160 / 512), boardMat);
    m.position.set(x, y, z); m.rotation.y = Math.PI; root.add(m);
  }

  // ---- the barricades: they sink into the ground when their gate opens
  const leafGeo = merge(barricade(GATE_W * 2, GATE_H));
  const leaves = WALLS.map(([id, z]) => {
    const m = new THREE.Mesh(leafGeo, propMat); m.position.set(0, 0, z); m.castShadow = true; root.add(m);
    return { id, m, k: 0 };
  });

  // ---- lights: the three nearest fires; a key on the select / title stage
  const lights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xff9a4a, 0, 26, 1.6); root.add(l); return l; });
  const stageKey = new THREE.PointLight(0xfff4e0, 22, 14, 2); stageKey.position.set(-6, 3, -146); stageKey.name = 'stage-key'; root.add(stageKey);

  // ---- the air: petals over the meadow, embers over the battlefield (one cloud of points round the camera focus)
  const MOTES = 220, mp = new Float32Array(MOTES * 3), ms = Float32Array.from({ length: MOTES * 4 }, (_, i) => hash01(i, 77));
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const moteMat = new THREE.PointsMaterial({ size: 0.11, transparent: true, opacity: 0.9, depthWrite: false, fog: false, color: new THREE.Color(2.2, 1.6, 1.9) });
  const motes = new THREE.Points(mg, moteMat); motes.frustumCulled = false; root.add(motes);

  // ---- story fx pools
  const addMat = (c, o = 0) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const flat = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 4; root.add(m); return m; };
  const ringGeo = new THREE.RingGeometry(0.88, 1, 64, 1), discGeo = new THREE.CircleGeometry(1, 48), edgeGeo = new THREE.RingGeometry(0.96, 1, 64, 1);
  const rings = [...Array(16)].map(() => flat(ringGeo, addMat(0xffffff)));
  const warnFill = [...Array(14)].map(() => flat(discGeo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0, depthWrite: false, fog: false })));
  const warnEdge = [...Array(14)].map(() => flat(edgeGeo, addMat(new THREE.Color(3, 0.5, 0.4))));
  const dropGeo = merge(rock(0.9, 3, 0x6a6460));
  const dropMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, emissive: new THREE.Color(0xff4a1a), emissiveIntensity: 0.5 });
  const drops = [...Array(14)].map(() => { const m = new THREE.Mesh(dropGeo, dropMat); m.visible = false; root.add(m); return m; });

  const SUN = [C3(0xfff2d8), C3(0xffb070), C3(0x8aa4ff)], HEMI_S = [C3(0xcfe6ff), C3(0xe0b090), C3(0x2a3a6a)], HEMI_G = [C3(0x6f8f4a), C3(0x6a5a40), C3(0x1a2030)];
  const MOTE = [C3(0xffd0e0).multiplyScalar(1.6), new THREE.Color(3.2, 1.2, 0.3)];
  const tmp = new THREE.Vector3();
  let t = 0, dark = 0, war = 0;
  return {
    fires, look: LOOK,
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, 0, Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp); sun.position.copy(SUN_DIR).multiplyScalar(80).add(tmp);
      const live = !!(game && game.live), fx = live && game.story && game.story.fx;
      // the mood: war from the K.O. count (practice: the battlefield as it stands at the end), night on the howl
      const goal = (game && game.story.chapter && game.story.chapter.GOAL) || 1000;
      const wantWar = !live ? 0 : game.mode === 'free' ? 0.85 : smooth(60, goal * 0.9, game.kos());
      war += (wantWar - war) * Math.min(1, dt * 0.6);
      dark += ((fx && fx.dark ? 1 : 0) - dark) * Math.min(1, dt * 1.2);
      sky.set(war, dark, t);
      horizon(war, dark, scene.fog.color, 0.92);
      sun.color.copy(SUN[0]).lerp(SUN[1], war).lerp(SUN[2], dark); sun.intensity = 3.2 - 0.7 * war - 1.7 * dark;
      hemi.color.copy(HEMI_S[0]).lerp(HEMI_S[1], war).lerp(HEMI_S[2], dark); hemi.groundColor.copy(HEMI_G[0]).lerp(HEMI_G[1], war).lerp(HEMI_G[2], dark);
      hemi.intensity = 2.5 - 0.4 * war - 1.2 * dark;
      const flick = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 7.3);
      litMat.color.setScalar((1.7 + 0.9 * dark) * flick);
      const near = fires.slice().sort((a, b) => a.position.distanceToSquared(focus) - b.position.distanceToSquared(focus));
      lights.forEach((l, n) => {
        const f = near[n];
        if (!f) { l.intensity = 0; return; }
        l.position.copy(f.position);
        l.intensity = (30 + 70 * dark + 20 * war) * f.s * flick * (1 - smooth(26, 44, f.position.distanceTo(focus)));
      });
      stageKey.intensity = 22;
      // petals → embers
      const hot = Math.max(war, dark);
      moteMat.color.copy(MOTE[0]).lerp(MOTE[1], hot); moteMat.blending = hot > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
      for (let i = 0; i < MOTES; i++) {
        const a = ms[i * 4], b = ms[i * 4 + 1], c = ms[i * 4 + 2], d = ms[i * 4 + 3], up = hot > 0.5 ? 1 : -1;
        const y = ((b * 7 + up * t * (0.25 + c * 0.5)) % 7 + 7) % 7;
        mp[i * 3] = focus.x + (a - 0.5) * 44 + Math.sin(t * (0.5 + d) + i) * 0.8; mp[i * 3 + 1] = y + 0.2; mp[i * 3 + 2] = focus.z + (c - 0.5) * 44 + Math.cos(t * 0.4 + i * 1.7) * 0.8;
      }
      mg.attributes.position.needsUpdate = true;
      // barricades
      for (const L of leaves) {
        L.k += ((GATES[L.id] && GATES[L.id].open ? 1 : 0) - L.k) * Math.min(1, dt * 1.4);
        L.m.position.y = -L.k * (GATE_H + 1.2); L.m.visible = L.k < 0.97;
      }
      if (game) board.draw(live ? game.kos() | 0 : 0, goal);
      // story fx
      const now = fx ? fx.now || 0 : 0;
      const W = (fx && fx.warn) || [];
      warnFill.forEach((m, k) => {
        const w = W[k], e = warnEdge[k], on = !!w && now >= w.t0 && now <= w.t1;
        m.visible = e.visible = on;
        if (!on) return;
        const u = (now - w.t0) / Math.max(1, w.t1 - w.t0);
        m.position.set(w.x, 0.06, w.z); m.scale.setScalar(Math.max(0.05, w.r * u)); m.material.opacity = 0.26 + 0.24 * u;
        e.position.set(w.x, 0.07, w.z); e.scale.setScalar(w.r); e.material.opacity = 0.6 + 0.4 * Math.sin(now * 0.6);
      });
      const R = (fx && fx.rings) || [];
      rings.forEach((m, k) => {
        const r = R[k];
        m.visible = !!r && now - r.t < (r.life || 40) && now >= r.t;
        if (!m.visible) return;
        const u = (now - r.t) / (r.life || 40), c = RING_COL[r.kind] || RING_COL.slam;
        const rad = r.r1 ? r.r + (r.r1 - r.r) * u : r.r * (0.35 + 0.65 * (1 - (1 - u) ** 3));
        m.position.set(r.x, 0.1, r.z); m.scale.setScalar(rad); m.material.color.setRGB(c[0], c[1], c[2]); m.material.opacity = (r.r1 ? 1 : 1.1) * (1 - u * u);
      });
      const D = (fx && fx.drops) || [];
      drops.forEach((m, k) => {
        const d = D[k];
        m.visible = !!d && now >= d.t0 && now < d.t;
        if (!m.visible) return;
        const u = (now - d.t0) / Math.max(1, d.t - d.t0);
        m.position.set(d.x, 0.2 + (1 - u) * (1 - u) * 14, d.z); m.rotation.set(now * 0.2 + k, now * 0.13, 0);
      });
    },
  };
}
