// Squat cartoon proportions for the animal fighters (Alex, Bryan, Clara): a rig with a short barrel body, stubby legs
// and arms and room for a head nearly half the figure's height, a pose fit that maps the engine's clips (authored for a
// 1.7 m figure: hips at 0.9 m, hands round 1.0–1.6 m) onto it, and the voxel parts shared by the three models.
//   kit.rig = SQUAT                       bone lengths (src/hero/rig.js createRig)
//   kit.fit = squatFit({ w, tip, butt })  w: the weapon model's scale (grip spacing along the shaft follows it),
//                                         tip / butt: its reach from the grip (m) for ground contact
// Standing: hips 0.39 m, shoulders 0.65 m, the head joint (chin) 0.69 m; the head itself is ≈ 0.45 m of voxels on top.
// The fit keeps every angle (leans, twists, weapon aim) and rescales positions: the pelvis' travel, the feet's stride
// and lift, the weapon grips about the shoulder line — pushed 0.17 m forward so they clear the belly.
import { CH } from '../../hero/rig.js';
import { vox, V } from '../../hero/model.js';
import { B, buildBody } from './body.js';

export const SQUAT = { thigh: 0.17, shin: 0.17, upper: 0.17, fore: 0.17, spineUp: 0.04, chestUp: 0.12, neck: 0.12, headUp: 0.02,
  shoulderX: 0.19, shoulderY: 0.1, hipX: 0.11, hipY: -0.04 };
const HIPS = 0.39, SHOULDERS = 0.66;

export function squatFit({ w = 0.75, tip = 1.2, butt = 0.3 } = {}) {
  const weapon = (p, b) => { p[b] *= 0.6; p[b + 1] = SHOULDERS + (p[b + 1] - 1.42) * 0.45; p[b + 2] = 0.17 + p[b + 2] * 0.5; };
  return (p) => {
    p[0] *= 0.6; p[1] = HIPS + (p[1] - 0.9) * 0.45; p[2] *= 0.6;
    for (const b of [CH.footL, CH.footR]) { p[b] *= 0.8; p[b + 1] = 0.05 + (p[b + 1] - 0.08) * 0.55; p[b + 2] *= 0.5; }
    weapon(p, CH.spear); weapon(p, CH.spearL);
    p[CH.gripR] *= w; p[CH.gripL] *= w;
    p[CH.reach] = tip; p[CH.reach + 1] = butt;
    return p;
  };
}

/** An ellipsoid of voxels: centre c, radii r (voxels); col: colour | fn(x, y, z) → colour | null. */
export function ball(c, r, col) {
  const lo = c.map((v, k) => Math.floor(v - r[k]) - 1), hi = c.map((v, k) => Math.ceil(v + r[k]) + 1);
  return B(lo, hi, (x, y, z) => (((x + 0.5 - c[0]) / r[0]) ** 2 + ((y + 0.5 - c[1]) / r[1]) ** 2 + ((z + 0.5 - c[2]) / r[2]) ** 2 > 1 ? null
    : typeof col === 'function' ? col(x, y, z) : col));
}

/** Limb parts on the squat rig (voxels of V = 2.5 cm; each bone is 7 long). o: arm, sleeve? (colour of the upper arm's
 *  top half), cuff?, hand, leg, shin (default leg), foot, sole?, wide? (thicker legs). */
export function limbs(o) {
  const p = {}, t = o.wide ? 1 : 0;
  for (const s of ['R', 'L']) {
    p['upperArm' + s] = [B([-2, -7, -2], [2, 1, 2], o.arm)];
    if (o.sleeve != null) p['upperArm' + s].push(B([-3, -3, -3], [3, 1, 3], o.sleeve));
    p['foreArm' + s] = [B([-2, -7, -2], [3, 0, 3], o.arm)];
    if (o.cuff != null) p['foreArm' + s].push(B([-2, -7, -2], [3, -5, 3], o.cuff));
    p['hand' + s] = [B([-2, -2, -2], [2, 2, 2], o.hand)];
    p['thigh' + s] = [B([-2 - t, -7, -2 - t], [3 + t, 1, 3 + t], o.leg)];
    p['shin' + s] = [B([-2 - t, -7, -2 - t], [3 + t, 0, 3 + t], o.shin ?? o.leg)];
    p['foot' + s] = [B([-3, -2, -3], [3, 1, 5], o.foot), B([-3, -2, -3], [3, -1, 6], o.sole ?? o.foot)];
  }
  return p;
}

/** Meshes the squat model: parts { joint: boxes } (the barrel goes on `spine`, a collar / shoulders on `chest`), and the
 *  head boxes (chin at y 0, facing +Z) at voxel size hv. → { meshes, add } (shared/body.js buildBody). */
export function buildSquat(rig, mat, parts, head, hv = 0.03) {
  const out = buildBody(rig, mat, parts, null);
  out.add(rig.joints.head, vox(head, hv, { jitter: 0.05, ao: 0.36 }), 'head');
  return out;
}
export { V };
