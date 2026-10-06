// Beast builder (content for the crowd view's officer-model hook, src/crowd/view.js header): part box lists in the crowd's
// soldier space (metres, feet at 0, facing +Z; pelvis 0.86 · neck +0.5 over the waist · shoulders ±0.235 @ +0.43 · hand
// −0.5 below the shoulder · knee −0.42) and weapon / off-hand box lists (weapon space: grip at the origin, +Z along the
// weapon; off-hand: the left hand frame). Wolves and foxes on two legs: fur, plate or leather, cloaks, tails.
// C keys: fur, furD, furL, eye, steel, steelD, mantle, cloak, blade, edge, pole, teeth, under, belt, buckle, boot,
// fox only: white (muzzle / chest / tail tip), sock (dark paws).
import { shade } from '../../../core/voxel.js';
import { hash01 } from '../../../core/rng.js';

export const b = (a, bb, c, paint) => ({ a, b: bb, c, paint });
export const box = (s, p, c, r) => ({ s, p, c, r });

/** Plate rows: dark lacing line every third voxel row, a lit top edge, alternate plates a touch darker. */
const plate = (C) => (x, y, z, i, j) => (j % 3 === 0 ? C.steelD : j % 3 === 2 ? shade(C.steel, 1.12) : (i + ((j / 3) | 0)) % 2 ? shade(C.steel, 0.9) : C.steel);
const fur = (C) => (x, y, z, i, j, k) => (hash01(i * 3, j, k) < 0.2 ? C.furD : hash01(k, i, j * 7) < 0.14 ? C.furL : C.fur);

/** Wolf head: skull, long muzzle, eyes under a heavy brow, tall ears, teeth at the jaw line, neck ruff. opts: muzzle /
 *  ear (m), mane (m, 0 = none), iron (a plate strapped over the muzzle), scar (a red stripe of war paint over one eye). */
export function wolfHead(C, { muzzle = 0.24, ear = 0.2, iron = false, mane = 0.1, scar = false } = {}) {
  const z1 = 0.08 + muzzle;
  const h = [
    b([-0.105, 0.02, -0.11], [0.105, 0.25, 0.1], fur(C)),                              // skull
    b([-0.06, 0.03, 0.08], [0.06, 0.13, z1], C.furL),                                  // muzzle
    b([-0.048, 0.13, 0.08], [0.048, 0.16, z1 - 0.04], C.fur),                           // muzzle ridge
    b([-0.03, 0.09, z1 - 0.01], [0.03, 0.135, z1 + 0.02], 0x121212, true),             // nose
    b([-0.062, 0.045, 0.1], [0.062, 0.062, z1 - 0.02], (x, y, z, i, j, k) => (k % 2 ? C.teeth : C.furD), true),   // teeth row
    b([-0.075, 0.15, 0.09], [-0.03, 0.18, 0.106], C.eye, true), b([0.03, 0.15, 0.09], [0.075, 0.18, 0.106], C.eye, true),
    b([-0.095, 0.18, 0.07], [0.095, 0.215, 0.12], C.furD),                              // heavy brow
    b([-0.105, 0.22, -0.05], [-0.04, 0.22 + ear, 0.02], C.furD), b([0.04, 0.22, -0.05], [0.105, 0.22 + ear, 0.02], C.furD),
    b([-0.09, 0.22 + ear * 0.55, -0.045], [-0.055, 0.22 + ear, 0.015], C.fur), b([0.055, 0.22 + ear * 0.55, -0.045], [0.09, 0.22 + ear, 0.015], C.fur),
    b([-0.13, -0.02, -0.13], [0.13, 0.08, 0.07], C.furD),                               // neck ruff
  ];
  if (mane) h.push(b([-0.14, 0.04, -0.16], [0.14, 0.2 + mane, -0.07], fur({ ...C, fur: C.furD, furD: shade(C.furD, 0.8), furL: C.fur })));
  if (iron) h.push(b([-0.07, 0.07, 0.09], [0.07, 0.15, z1 - 0.02], C.steel), b([-0.11, 0.1, -0.02], [0.11, 0.125, 0.1], C.steelD));
  if (scar) h.push(b([0.03, 0.08, 0.1], [0.06, 0.24, 0.125], 0xc02a1c, true), b([0.03, 0.2, 0.0], [0.06, 0.255, 0.11], 0xc02a1c, true));
  return h;
}

/** Fox head: a narrow skull, a slim pointed muzzle with a white underside, white cheeks, big ears with black tips.
 *  opts: ear (m), hood (colour: a hood round the ears), patch (an eye patch), plume (colour: a feather behind one ear). */
export function foxHead(C, { ear = 0.2, hood = null, patch = false, plume = null } = {}) {
  const h = [
    b([-0.095, 0.03, -0.1], [0.095, 0.24, 0.09], fur(C)),                              // skull
    b([-0.12, 0.04, -0.02], [-0.085, 0.14, 0.09], C.white), b([0.085, 0.04, -0.02], [0.12, 0.14, 0.09], C.white),   // cheek tufts
    b([-0.045, 0.05, 0.08], [0.045, 0.14, 0.24], C.fur),                                // muzzle
    b([-0.045, 0.035, 0.08], [0.045, 0.085, 0.235], C.white),                           // its white underside
    b([-0.025, 0.1, 0.235], [0.025, 0.14, 0.262], 0x141210),                            // nose
    b([-0.075, 0.15, 0.085], [-0.03, 0.185, 0.1], C.eye, true), b([0.03, 0.15, 0.085], [0.075, 0.185, 0.1], C.eye, true),
    b([-0.085, 0.185, 0.07], [-0.02, 0.2, 0.1], C.furD, true), b([0.02, 0.185, 0.07], [0.085, 0.2, 0.1], C.furD, true),   // sly brows
    b([-0.115, 0.2, -0.05], [-0.035, 0.2 + ear, 0.01], C.fur), b([0.035, 0.2, -0.05], [0.115, 0.2 + ear, 0.01], C.fur),   // ears
    b([-0.1, 0.2 + ear * 0.6, -0.05], [-0.05, 0.2 + ear + 0.04, 0.01], C.sock), b([0.05, 0.2 + ear * 0.6, -0.05], [0.1, 0.2 + ear + 0.04, 0.01], C.sock),   // black tips
    b([-0.09, 0.22, 0.0], [-0.06, 0.2 + ear * 0.7, 0.014], C.white), b([0.06, 0.22, 0.0], [0.09, 0.2 + ear * 0.7, 0.014], C.white),   // inner ear
    b([-0.11, -0.02, -0.1], [0.11, 0.06, 0.08], C.white),                               // white ruff
  ];
  if (hood != null) h.push(b([-0.12, 0.0, -0.13], [0.12, 0.26, -0.04], hood), b([-0.12, 0.2, -0.13], [0.12, 0.27, 0.06], hood));
  if (patch) h.push(b([0.02, 0.14, 0.08], [0.085, 0.2, 0.108], 0x141210), b([-0.1, 0.2, -0.1], [0.1, 0.215, 0.1], 0x141210, true));
  if (plume != null) h.push(b([0.1, 0.16, -0.12], [0.13, 0.5, -0.06], plume), b([0.1, 0.42, -0.2], [0.13, 0.52, -0.1], shade(plume, 0.8)));
  return h;
}

/** A bushy tail off the back of the hips: C.fur with a tip (wolf: dark, fox: white). */
export const tail = (C, tip, len = 0.42, w = 0.07) => [b([-w, -0.2, -0.1 - len * 0.55], [w, -0.04, -0.08], C.fur), b([-w * 1.25, -0.14, -0.1 - len * 0.85], [w * 1.25, 0.06, -0.1 - len * 0.4], C.fur),
  b([-w, -0.06, -0.12 - len], [w, 0.1, -0.1 - len * 0.8], tip)];

/** Wolf body in plate. opts: bulk (width ×), mantle (fur over the shoulders), cloak (to the ankles, ragged hem), cape
 *  (short), bare (no breastplate: a fur chest with war paint). */
export function wolfBody(C, { bulk = 1, mantle = false, cloak = false, cape = false, bare = false } = {}) {
  const w = (v) => v * bulk, P = bare ? fur(C) : plate(C);
  const p = {};
  p.hips = [
    b([-w(0.16), -0.1, -0.1], [w(0.16), 0.06, 0.1], C.under),
    b([-w(0.175), -0.01, -0.115], [w(0.175), 0.07, 0.115], C.belt),
    b([-0.04, 0.0, 0.11], [0.04, 0.07, 0.14], C.buckle),
    b([-w(0.16), -0.36, 0.095], [w(0.16), 0.0, 0.14], plate(C)), b([-w(0.16), -0.36, -0.14], [w(0.16), 0.0, -0.095], plate(C)),   // tassets
    b([-w(0.2), -0.3, -0.09], [-w(0.15), 0.0, 0.09], plate(C)), b([w(0.15), -0.3, -0.09], [w(0.2), 0.0, 0.09], plate(C)),
    ...(cloak ? [] : tail(C, C.furD)),
  ];
  p.torso = [
    b([-w(0.155), -0.04, -0.105], [w(0.155), 0.2, 0.105], P),
    b([-w(0.185), 0.18, -0.125], [w(0.185), 0.46, 0.125], P),
    b([-w(0.31), 0.29, -0.14], [-w(0.14), 0.47, 0.14], plate(C)), b([w(0.14), 0.29, -0.14], [w(0.31), 0.47, 0.14], plate(C)),   // shoulder plates
    b([-0.12, 0.44, -0.11], [0.12, 0.5, 0.11], C.under),
  ];
  if (bare) p.torso.push(b([-w(0.19), 0.3, 0.1], [w(0.19), 0.34, 0.13], 0xc02a1c, true), b([-0.03, 0.1, 0.1], [0.03, 0.44, 0.13], 0xc02a1c, true),   // war paint
    b([-w(0.2), 0.0, -0.13], [w(0.2), 0.06, 0.13], C.belt));
  else p.torso.push(b([-w(0.13), 0.24, 0.12], [w(0.13), 0.42, 0.15], shade(C.steel, 1.08)));
  if (mantle) p.torso.push(b([-w(0.34), 0.38, -0.17], [w(0.34), 0.56, 0.16], fur({ ...C, fur: C.mantle })),
    b([-w(0.28), 0.5, -0.15], [w(0.28), 0.6, 0.12], fur({ ...C, fur: C.mantle })));
  if (cloak) p.torso.push(b([-w(0.25), -0.92, -0.2], [w(0.25), 0.48, -0.145], (x, y, z, i, j) =>
    (y < -0.84 && hash01(i, 11, 3) < 0.45 ? null : i === 0 || x > w(0.24) ? shade(C.cloak, 1.3) : C.cloak)));
  if (cape) p.torso.push(b([-w(0.21), -0.4, -0.2], [w(0.21), 0.46, -0.145], (x, y, z, i, j) => (j % 5 === 0 ? shade(C.cloak, 1.25) : C.cloak)));
  p.arm = [
    b([-0.06, -0.24, -0.065], [0.06, 0.03, 0.065], bare ? C.fur : C.under),
    b([-0.066, -0.46, -0.07], [0.066, -0.22, 0.07], plate(C)),                         // vambrace
    b([-0.05, -0.56, -0.055], [0.05, -0.46, 0.055], C.furD),                           // clawed hand
    b([-0.05, -0.58, 0.03], [0.05, -0.54, 0.06], C.teeth, true),
  ];
  p.thigh = [b([-0.075, -0.43, -0.078], [0.075, 0.02, 0.078], C.under)];
  p.shin = [
    b([-0.068, -0.3, -0.072], [0.068, 0.02, 0.072], plate(C)),                         // greave
    b([-0.075, -0.42, -0.08], [0.075, -0.29, 0.14], C.boot),
    b([-0.06, -0.42, 0.13], [0.06, -0.38, 0.16], C.teeth),                             // claws
  ];
  return p;
}

/** Fox body: slim, a leather jerkin over a white chest, dark socks, the big white-tipped tail. opts: bulk, coat (colour:
 *  a long coat to the knee), trim, cape (colour), sash (colour). */
export function foxBody(C, { bulk = 1, coat = null, trim = null, cape = null, sash = null } = {}) {
  const w = (v) => v * bulk, L = (x, y, z, i, j) => (j % 4 === 0 ? shade(C.steel, 0.8) : C.steel);
  const p = {};
  p.hips = [
    b([-w(0.15), -0.1, -0.095], [w(0.15), 0.06, 0.095], C.under),
    b([-w(0.165), -0.01, -0.11], [w(0.165), 0.06, 0.11], C.belt),
    b([-0.035, 0.0, 0.105], [0.035, 0.06, 0.13], C.buckle),
    b([-w(0.15), -0.26, 0.09], [w(0.15), 0.0, 0.125], L), b([-w(0.15), -0.26, -0.125], [w(0.15), 0.0, -0.09], L),   // leather skirt
    ...(coat != null ? [] : tail(C, C.white, 0.52, 0.085)),
  ];
  p.torso = [
    b([-w(0.145), -0.04, -0.1], [w(0.145), 0.2, 0.1], L),
    b([-w(0.17), 0.18, -0.115], [w(0.17), 0.46, 0.115], L),
    b([-w(0.09), 0.26, 0.105], [w(0.09), 0.46, 0.13], C.white),                          // white chest fur
    b([-w(0.25), 0.33, -0.12], [-w(0.15), 0.47, 0.12], fur(C)), b([w(0.15), 0.33, -0.12], [w(0.25), 0.47, 0.12], fur(C)),   // shoulders
    b([-0.1, 0.44, -0.1], [0.1, 0.5, 0.1], C.fur),
  ];
  if (sash != null) p.torso.push(b([-w(0.18), 0.02, -0.12], [w(0.18), 0.1, 0.125], sash), b([w(0.06), -0.2, 0.11], [w(0.14), 0.04, 0.13], sash));
  if (coat != null) {
    p.torso.push(b([-w(0.19), -0.06, -0.13], [w(0.19), 0.47, 0.125], (x, y, z) => (z > 0.1 && Math.abs(x) < 0.06 ? null : coat)),
      b([-0.11, 0.4, -0.14], [0.11, 0.53, 0.06], trim ?? shade(coat, 1.4)));           // high collar
    p.hips.push(b([-w(0.2), -0.5, -0.15], [w(0.2), 0.04, 0.15], (x, y, z) => (z > 0.12 && Math.abs(x) < 0.07 ? null : y < -0.46 ? trim ?? shade(coat, 1.4) : coat)),
      ...tail(C, C.white, 0.6, 0.09).map((q) => ({ ...q, a: [q.a[0], q.a[1] - 0.12, q.a[2] - 0.08], b: [q.b[0], q.b[1] - 0.12, q.b[2] - 0.08] })));
  }
  if (cape != null) p.torso.push(b([-w(0.2), -0.34, -0.19], [w(0.2), 0.46, -0.135], (x, y, z, i, j) => (y < -0.28 && hash01(i, 5, 2) < 0.4 ? null : j % 6 === 0 ? shade(cape, 0.8) : cape)));
  p.arm = [
    b([-0.052, -0.24, -0.056], [0.052, 0.03, 0.056], coat ?? C.fur),
    b([-0.056, -0.46, -0.06], [0.056, -0.22, 0.06], coat != null ? coat : L),
    b([-0.045, -0.56, -0.05], [0.045, -0.46, 0.05], C.sock),                            // dark paws
  ];
  if (coat != null) p.arm.push(b([-0.06, -0.47, -0.064], [0.06, -0.43, 0.064], trim ?? shade(coat, 1.4)));
  p.thigh = [b([-0.066, -0.43, -0.07], [0.066, 0.02, 0.07], C.fur)];
  p.shin = [b([-0.06, -0.3, -0.064], [0.06, 0.02, 0.064], C.sock), b([-0.066, -0.42, -0.074], [0.066, -0.29, 0.13], C.sock),
    b([-0.055, -0.42, 0.12], [0.055, -0.38, 0.15], C.teeth)];
  return p;
}

/** A glaive along +Z: shaft from `butt` to the collar at `collar`, a curved blade of length `len` beyond it. Returns the
 *  whole weapon plus its broken halves (haft in hand; head with its own origin at the collar) and a cracked variant. */
export function glaive(C, { butt = -0.6, collar = 1.8, len = 0.55, h = 0.16, heavy = 1 } = {}) {
  const shaft = [box([0.05 * heavy, 0.05 * heavy, collar - butt], [0, 0, (collar + butt) / 2], C.pole),
    box([0.07, 0.07, 0.05], [0, 0, butt], C.steelD), box([0.065, 0.065, 0.04], [0, 0, butt + 1.0], C.steelD)];
  const collarB = box([0.09 * heavy, 0.09 * heavy, 0.08], [0, 0, collar + 0.04], C.steelD);
  const blade = (z0) => {
    const out = [], n = 6;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1), z = z0 + 0.08 + u * (len - 0.08), hh = h * heavy * (0.55 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.12))), cy = 0.02 + 0.1 * u * u;
      out.push(box([0.026, hh, len / n + 0.01], [0, cy + hh / 2 - 0.02, z], C.blade), box([0.028, 0.025, len / n + 0.01], [0, cy + hh - 0.02, z], C.edge));
    }
    return out;
  };
  const crack = [box([0.1, 0.012, 0.012], [0, 0.03, collar + 0.02], 0x0a0a0a), box([0.012, 0.06, 0.012], [0.02, 0.0, collar + 0.05], 0x0a0a0a)];
  return {
    weapon: [...shaft, collarB, ...blade(collar)],
    cracked: [...shaft, collarB, ...crack, ...blade(collar)],
    broken: { haft: [...shaft], head: [{ ...collarB, p: [0, 0, 0.04] }, ...blade(0)] },
  };
}

/** Round shield in the left hand frame (a disc of boxes, a rim, a centre boss). */
export function roundShield(c, rim, r = 0.34, zo = 0.12) {
  const out = [];
  for (let k = -3; k <= 3; k++) { const h = Math.sqrt(Math.max(0, 1 - (k / 3.5) ** 2)) * r * 2; out.push(box([r * 2 / 7 + 0.005, h, 0.035], [k * r * 2 / 7, 0.05, zo], k % 2 ? c : shade(c, 0.92))); }
  out.push(box([r * 2 + 0.02, 0.03, 0.04], [0, 0.05 + r, zo], rim), box([r * 2 + 0.02, 0.03, 0.04], [0, 0.05 - r, zo], rim), box([0.1, 0.1, 0.03], [0, 0.05, zo + 0.03], rim));
  return out;
}

/** The retreat horn, raised in the left hand while kneeling (hand frame: forearm axis −Y, palm toward +Z). */
export const HORN = [box([0.07, 0.07, 0.18], [0, -0.02, 0.1], 0xd8cdb0), box([0.09, 0.09, 0.08], [0, 0.02, 0.22], 0xc2b690), box([0.11, 0.11, 0.04], [0, 0.05, 0.28], 0x8a7c5c)];
