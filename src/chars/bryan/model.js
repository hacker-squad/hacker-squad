// Voxel Bryan on the squat rig (src/chars/shared/squat.js): a stout little pig — pink, a big round head with a snout,
// rosy cheeks and flop ears under a yellow safety helmet, a barrel belly in an orange hi-vis vest with reflective bands
// over denim dungarees, work gloves and boots, a curly tail. Weapon: a road crew's STOP sign carried as a shield (weapon
// joint: origin = the handle's grip, the red octagon 0.54 m across at his size on the end of it, STOP on both faces so
// it reads from in front and from behind him).
import { vox } from '../../hero/model.js';
import { B, Pt, hex, fighterMaterial } from '../shared/body.js';
import { ball, limbs, buildSquat } from '../shared/squat.js';

export const YC = {
  pink: hex('#f4a6ae'), pinkD: hex('#dc8892'), snout: hex('#f9c0c4'), nostril: hex('#a85a66'), eye: 0x2a1c1e, blush: hex('#f08a98'),
  helmet: hex('#ffd21e'), helmetD: hex('#d8a80e'), vest: hex('#ff7a1e'), vestD: hex('#d8620c'), band: hex('#e8f47a'), denim: hex('#3a5a9a'), denimD: hex('#2c4678'),
  glove: hex('#d8b070'), boot: hex('#5a3a22'), sole: hex('#2a1c12'),
  red: hex('#ee2e24'), white: hex('#f6f6f2'), steel: hex('#aeb6c0'), steelD: hex('#7a828c'), tape: hex('#1c1d22'),
};
const inBall = (x, y, z, c, r) => ((x + 0.5 - c[0]) / r[0]) ** 2 + ((y + 0.5 - c[1]) / r[1]) ** 2 + ((z + 0.5 - c[2]) / r[2]) ** 2 <= 1;

/** Head (voxels of 3 cm, chin at y 0, facing +Z). */
export function head() {
  const C = [0, 10, 0];
  return [
    ball([0, 7, 0], [8, 7, 7], YC.pink),
    B([-3, 2, 5], [3, 7, 10], YC.snout),                              // the snout
    Pt([-2, 3, 9], [-1, 6, 10], YC.nostril), Pt([1, 3, 9], [2, 6, 10], YC.nostril),
    Pt([-6, 8, 2], [-4, 10, 8], YC.eye), Pt([4, 8, 2], [6, 10, 8], YC.eye),              // eyes, a catch-light in each
    Pt([-6, 9, 2], [-5, 10, 8], 0xffffff), Pt([4, 9, 2], [5, 10, 8], 0xffffff),
    Pt([-8, 3, 1], [-5, 6, 8], YC.blush), Pt([5, 3, 1], [8, 6, 8], YC.blush),            // rosy cheeks
    Pt([-2, 0, 3], [2, 1, 8], YC.nostril), Pt([-3, 1, 3], [-2, 2, 8], YC.nostril), Pt([2, 1, 3], [3, 2, 8], YC.nostril),   // a smile under the snout
    B([-11, 7, -1], [-7, 11, 2], YC.pinkD), B([7, 7, -1], [11, 11, 2], YC.pinkD),        // flop ears, out under the brim
    B([-12, 6, 0], [-9, 8, 3], YC.pink), B([9, 6, 0], [12, 8, 3], YC.pink),
    // the safety helmet: shell, the brim and its peak, the ridge front to back
    B([-10, 10, -10], [10, 18, 10], (x, y, z) => (inBall(x, y, z, C, [9, 6.6, 8.6]) ? YC.helmet : null)),
    B([-11, 10, -10], [11, 11, 10], (x, y, z) => (inBall(x, 10, z, C, [10.4, 1, 9.6]) ? YC.helmetD : null)),
    B([-6, 10, 8], [6, 11, 13], YC.helmet),
    B([-1, 10, -10], [1, 19, 10], (x, y, z) => (inBall(x, y, z, C, [1.4, 7.5, 9.4]) ? YC.helmetD : null)),
  ];
}

/** Body parts on the squat rig (voxels of 2.5 cm): the vest over the dungarees' bib, a pot belly. */
function body() {
  const coat = (x, y, z) => {
    if (y < -3) return YC.denim;
    if (y === -3) return YC.denimD;
    if (z > 0 && ((Math.abs(x + 0.5) < 4 && y < 2) || (Math.abs(x + 0.5) > 3 && Math.abs(x + 0.5) < 5))) return YC.denim;   // bib and straps
    return y === 0 || y === 5 ? YC.band : YC.vest;
  };
  return {
    spine: [ball([0, 1, 0.6], [8.8, 9, 8], coat), ball([0, -2, -8.5], [1.6, 1.6, 1.6], YC.pink), B([0, 0, -11], [2, 2, -9], YC.pinkD)],   // + the curly tail
    chest: [B([-5, 3, -4], [5, 6, 5], YC.pink)],                                                         // a short neck
    ...limbs({ arm: YC.pink, sleeve: YC.vest, hand: YC.glove, leg: YC.denim, shin: YC.boot, foot: YC.boot, sole: YC.sole, wide: true }),
  };
}

// ---------------------------------------------------------------- the stop sign (weapon space: origin = the grip, +Z = up the handle)
const SV = 0.02, R = 17, ZC = 31;                                    // voxel (m), octagon half-width (voxels), its centre along the handle
const GLYPH = {
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
};
/** STOP in 5 × 7 pixel letters, 23 columns wide: true where column c (0 = the S's left edge), row r (0 = top) is inked. */
const ink = (c, r) => c >= 0 && c < 23 && r >= 0 && r < 7 && c % 6 < 5 && GLYPH['STOP'[Math.floor(c / 6)]][r][c % 6] === '#';
function signGeo() {
  const face = (x, y, z) => {
    const dx = Math.abs(x + 0.5), dz = Math.abs(z + 0.5 - ZC);
    if (dx > R || dz > R || dx + dz > R * 1.414) return null;         // the octagon
    if (dx > R - 2 || dz > R - 2 || dx + dz > R * 1.414 - 2.6) return YC.white;   // its white border
    // the front face (−Y) reads from in front of him, the back face (+Y) from behind: the letters run the other way there
    const c = y < 0 ? x + 12 : 10 - x;
    return ink(c, ZC + 3 - z) ? YC.white : YC.red;
  };
  return vox([
    B([-1, -1, -8], [1, 1, ZC], (x, y, z) => (z < 12 ? ((z + 8) % 4 === 0 ? 0x3a3d46 : YC.tape) : YC.steel)),   // the handle: taped grip, steel post
    B([-2, -2, -9], [2, 2, -7], YC.steelD),
    B([-R, -1, ZC - R], [R, 1, ZC + R], face),
    B([-2, 1, ZC - 8], [2, 2, ZC + 8], YC.steelD), B([-2, -2, 12], [2, 2, 15], YC.steelD),                    // the bracket behind the plate
  ], SV, { jitter: 0.03, ao: 0.25 });
}
/** Sign model scale at his size, and its anchors in weapon space (m): the plate edge to edge (trail), its centre. */
export const SIGN_SCALE = 0.8;
export const SIGN = { tip: (ZC + R) * SV * SIGN_SCALE, base: (ZC - R) * SV * SIGN_SCALE, centre: ZC * SV * SIGN_SCALE };

export function createBryanModel(rig) {
  const mat = fighterMaterial({ roughness: 0.75 });
  const { meshes, add } = buildSquat(rig, mat, body(), head());
  add(rig.joints.weapon, signGeo(), 'sign', fighterMaterial({ roughness: 0.5, metalness: 0.1 }, 0.55, 0.7)).scale.setScalar(SIGN_SCALE);
  return { meshes, material: mat };
}

export function createBryanSecondary() {
  return { reset() {}, update() {} };
}
