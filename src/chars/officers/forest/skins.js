// Crowd skins (src/crowd/view.js skin hook): the invaders are two skins mixed in one horde — foe `wolf` (the big bad wolf
// pack: spears, captains, lamp-pole bearers) and foe2 `fox` (the allied fox force: the sabre-and-buckler raiders) — and
// ally `sheep`, the village flock that fights beside you. No humans on either side.
// Head frame: soldier head space (neck at y 0, crown ≈ 0.32, face toward +Z), metres. extra(C, b) → { part: boxes }
// adds boxes to a body part (the tails, on the hips).
// Weapon slots of the crowd rig: spear · sword (+ shield) · glaive (the squad captain) · pole (the bearer).
import { tail } from './kit.js';

const box = (s, p, c) => ({ s, p, c });

// ---------------------------------------------------------------- wolves: grey fur, dark iron, a red rag round the arm
const F = { fur: 0x6c6e74, furL: 0x9a9ca2, furD: 0x3a3c41, nose: 0x121212, amber: 0xe0a030 };
const WOLF_PAL = {
  armor: 0x4a4d52, hi: 0x6e7278, lace: 0x25272b, plate: 0x5a5e64, rivet: 0x7a7e84,
  cloth: 0x7a2018, pants: 0x2e3034, wrap: 0x5c5f64, wrapD: 0x3a3c40, boot: 0x222326,
  skin: F.fur, skinD: F.furD, eye: F.amber, brow: 0x2a2b2e,
  helm: 0x55585e, helmHi: 0x7c8086, band: 0x3c3e42, belt: 0x33302c, buckle: 0x6a6c70, bracer: 0x2e3034, tassel: 0xa82a1e,
  ...F,
};
const WOLF_OFF = { ...WOLF_PAL, armor: 0x3c4148, hi: 0x6a7078, lace: 0x1c1e22, plate: 0x4a5058, rivet: 0x8a9098, cloth: 0x5a1814,
  pants: 0x222428, helm: 0x3c4148, helmHi: 0x8a9098, capeA: 0x5a1814, capeB: 0x7a2018, fur: 0x55575e, furD: 0x2e3035 };

/** Wolf head: skull, long muzzle, pointed ears, an iron skull cap (grunts) or a heavy mane (officers). */
function wolfHead(C, officer, b) {
  const h = [
    b([-0.1, 0.02, -0.1], [0.1, 0.24, 0.1], C.fur),                                   // skull
    b([-0.055, 0.03, 0.08], [0.055, 0.12, 0.25], C.furL),                             // muzzle
    b([-0.045, 0.12, 0.08], [0.045, 0.155, 0.21], C.fur),                             // muzzle ridge
    b([-0.028, 0.09, 0.245], [0.028, 0.13, 0.27], C.nose, true),                     // nose
    b([-0.05, 0.05, 0.2], [0.05, 0.065, 0.255], 0xe6e2d8, true),                      // teeth
    b([-0.07, 0.15, 0.095], [-0.035, 0.18, 0.106], C.eye, true), b([0.035, 0.15, 0.095], [0.07, 0.18, 0.106], C.eye, true),
    b([-0.085, 0.18, 0.09], [-0.02, 0.205, 0.106], C.furD, true), b([0.02, 0.18, 0.09], [0.085, 0.205, 0.106], C.furD, true),
    b([-0.105, 0.23, -0.045], [-0.045, 0.39, 0.02], C.furD), b([0.045, 0.23, -0.045], [0.105, 0.39, 0.02], C.furD),   // ears
    b([-0.125, -0.02, -0.12], [0.125, 0.07, 0.07], C.furD),                            // neck ruff
  ];
  if (officer) h.push(b([-0.14, 0.04, -0.15], [0.14, 0.2, -0.06], C.furD), b([-0.12, 0.2, -0.13], [0.12, 0.27, -0.03], C.furD));   // mane
  else h.push(b([-0.112, 0.2, -0.112], [0.112, 0.255, 0.09], C.helm), b([-0.03, 0.255, -0.03], [0.03, 0.28, 0.03], C.helmHi));   // iron cap
  return h;
}
const SHAFT = 0x3d342c, STEEL = 0x8a8e94, DARK = 0x2e3034;
const WOLF_WEAPONS = {
  spear: [box([0.042, 0.042, 2.0], [0, 0, 0.38], SHAFT), box([0.065, 0.065, 0.06], [0, 0, -0.62], DARK), box([0.07, 0.07, 0.05], [0, 0, 1.4], DARK),
    box([0.1, 0.1, 0.08], [0, -0.02, 1.34], 0xa82a1e),
    box([0.085, 0.028, 0.16], [0, 0, 1.5], STEEL), box([0.05, 0.028, 0.12], [0, 0, 1.63], STEEL), box([0.025, 0.028, 0.06], [0, 0, 1.71], STEEL)],
  // the foxes' sabre: a curved blade (this slot is theirs: every sword soldier is a fox)
  sword: [box([0.04, 0.04, 0.2], [0, 0, -0.02], 0x3a2418), box([0.05, 0.13, 0.04], [0, 0, 0.1], 0xc8a050),
    box([0.02, 0.07, 0.4], [0, 0.0, 0.32], 0xc8ced6), box([0.02, 0.075, 0.26], [0, 0.03, 0.62], 0xc8ced6), box([0.02, 0.05, 0.12], [0, 0.075, 0.8], 0xe0e6ec)],
  glaive: [box([0.05, 0.05, 2.3], [0, 0, 0.45], SHAFT), box([0.08, 0.08, 0.06], [0, 0, 1.6], DARK), box([0.14, 0.14, 0.1], [0, 0, 1.52], 0xa82a1e),
    box([0.028, 0.16, 0.5], [0, 0.05, 1.9], STEEL), box([0.028, 0.1, 0.14], [0, 0.11, 2.2], STEEL)],
  // the bearer's standard: a red rag on a crossbar under a wolf skull
  pole: [box([0.055, 0.055, 3.3], [0, 0, 0.8], SHAFT), box([0.7, 0.045, 0.045], [0, 0, 2.3], SHAFT), box([0.6, 0.03, 0.5], [0, 0, 2.02], 0xa82a1e),
    box([0.2, 0.03, 0.2], [-0.2, 0, 1.7], 0xa82a1e), box([0.2, 0.03, 0.14], [0.2, 0, 1.72], 0xa82a1e),
    box([0.2, 0.18, 0.2], [0, 0, 2.5], 0xe8e2d0), box([0.12, 0.1, 0.16], [0, 0.12, 2.46], 0xe8e2d0), box([0.05, 0.05, 0.16], [-0.08, 0, 2.66], 0xe8e2d0), box([0.05, 0.05, 0.16], [0.08, 0, 2.66], 0xe8e2d0)],
  shield: { rim: 0x8a6238, a: 0xc8642a, b: 0xb0561e, boss: 0xe8e2d0, ring: 0x3a2418, far: 0xb85e24 },                // the foxes' hide buckler
};
export const WOLF = { palette: WOLF_PAL, officerPalette: WOLF_OFF, head: wolfHead,
  crest: (C, b) => [b([-0.15, 0.175, -0.15], [0.15, 0.235, 0.15], 0x3a3d42), b([-0.035, 0.24, -0.25], [0.035, 0.4, 0.02], 0xa82a1e)],
  extra: (C, b) => ({ hips: tail(C, C.furD) }),
  weapons: WOLF_WEAPONS, flag: null };

// ---------------------------------------------------------------- foxes: orange fur, white chest, dark socks, leather
const X = { fur: 0xe07a2a, furL: 0xf09a4a, furD: 0xb85a1a, white: 0xf4ece0, sock: 0x2a201c };
const FOX_PAL = {
  armor: 0x7a5a3a, hi: 0x9a7650, lace: 0x4a3420, plate: 0x8a6842, rivet: 0xc8a050,
  cloth: 0x2f6a5a, pants: X.fur, wrap: X.sock, wrapD: X.sock, boot: X.sock,
  skin: X.sock, skinD: 0x1a1412, eye: 0x1a2a1a, brow: X.furD,
  helm: X.fur, helmHi: X.furL, band: 0x2f6a5a, belt: 0x3a2418, buckle: 0xc8a050, bracer: 0x4a3420, tassel: 0x2f6a5a,
  ...X,
};
/** Fox head: narrow skull, a slim muzzle white underneath, white cheeks, tall black-tipped ears, a teal bandana. */
function foxHead(C, officer, b) {
  return [
    b([-0.092, 0.03, -0.095], [0.092, 0.24, 0.09], C.fur),                             // skull
    b([-0.118, 0.04, -0.02], [-0.085, 0.14, 0.09], C.white), b([0.085, 0.04, -0.02], [0.118, 0.14, 0.09], C.white),   // cheek tufts
    b([-0.044, 0.05, 0.08], [0.044, 0.14, 0.24], C.fur),                               // muzzle
    b([-0.044, 0.035, 0.08], [0.044, 0.085, 0.235], C.white),
    b([-0.025, 0.1, 0.235], [0.025, 0.14, 0.26], 0x141210),                            // nose
    b([-0.072, 0.15, 0.085], [-0.03, 0.185, 0.1], C.eye, true), b([0.03, 0.15, 0.085], [0.072, 0.185, 0.1], C.eye, true),
    b([-0.115, 0.2, -0.05], [-0.035, 0.4, 0.01], C.fur), b([0.035, 0.2, -0.05], [0.115, 0.4, 0.01], C.fur),             // ears
    b([-0.1, 0.33, -0.05], [-0.05, 0.44, 0.01], C.sock), b([0.05, 0.33, -0.05], [0.1, 0.44, 0.01], C.sock),             // black tips
    b([-0.098, 0.2, -0.1], [0.098, 0.245, 0.095], C.band),                             // bandana
    b([-0.11, -0.02, -0.1], [0.11, 0.06, 0.08], C.white),                              // white ruff
  ];
}
export const FOX = { palette: FOX_PAL, head: foxHead, extra: (C, b) => ({ hips: tail(C, C.white, 0.5, 0.085), torso: [b([-0.09, 0.26, 0.1], [0.09, 0.46, 0.15], C.white)] }) };

// ---------------------------------------------------------------- the village flock (allies): wool, dark faces, farm tools
const SHEEP_PAL = {
  armor: 0xf2efe6, hi: 0xffffff, lace: 0xd8d2c4, plate: 0xf2efe6, rivet: 0xe8e2d4,
  cloth: 0x3f8a5a, pants: 0x4a4036, wrap: 0xf2efe6, wrapD: 0xd8d0c0, boot: 0x2a2622,
  skin: 0x2f2d2a, skinD: 0x1f1d1b, eye: 0xe8e2d0, brow: 0x1a1816,
  helm: 0xf2efe6, helmHi: 0xfffaf0, band: 0x3f8a5a, tassel: 0xefe9dc, belt: 0x5a4632, buckle: 0xd8b040, bracer: 0xf2efe6,
};
/** Sheep head: a long dark face, light eyes, a wool cap, ears out to the sides, a wool ruff. */
function sheepHead(C, officer, b) {
  return [
    b([-0.075, 0.02, -0.06], [0.075, 0.22, 0.12], C.skin),                             // face
    b([-0.055, 0.03, 0.1], [0.055, 0.12, 0.19], C.skin),                               // muzzle
    b([-0.03, 0.08, 0.185], [0.03, 0.11, 0.196], C.skinD, true),                      // nose
    b([-0.07, 0.15, 0.1], [-0.035, 0.175, 0.126], C.eye, true), b([0.035, 0.15, 0.1], [0.07, 0.175, 0.126], C.eye, true),
    b([-0.11, 0.17, -0.11], [0.11, 0.31, 0.1], C.helm),                               // wool cap
    b([-0.07, 0.3, -0.07], [0.07, 0.35, 0.07], C.helmHi),                             // tuft
    b([-0.17, 0.14, -0.02], [-0.09, 0.18, 0.04], C.skin), b([0.09, 0.14, -0.02], [0.17, 0.18, 0.04], C.skin),   // ears
    b([-0.11, -0.01, -0.1], [0.11, 0.06, 0.08], C.wrap),                               // wool ruff
  ];
}
const WOOD = 0x6b4a2b, IRON = 0x707478;
const SHEEP_WEAPONS = {
  spear: [box([0.04, 0.04, 1.9], [0, 0, 0.35], WOOD), box([0.22, 0.03, 0.03], [0, 0, 1.3], IRON),     // pitchfork
    box([0.025, 0.025, 0.3], [-0.1, 0, 1.45], IRON), box([0.025, 0.025, 0.34], [0, 0, 1.47], IRON), box([0.025, 0.025, 0.3], [0.1, 0, 1.45], IRON)],
  sword: [box([0.04, 0.04, 0.55], [0, 0, 0.18], WOOD), box([0.16, 0.035, 0.3], [0, 0, 0.6], IRON)],   // shovel
  glaive: [box([0.045, 0.045, 2.3], [0, 0, 0.45], WOOD), box([0.03, 0.03, 0.22], [0, 0.08, 1.6], IRON), box([0.03, 0.12, 0.03], [0, 0.04, 1.7], IRON)],   // shepherd's hook
  // the flock's lantern on a pole
  pole: [box([0.05, 0.05, 3.2], [0, 0, 0.8], WOOD), box([0.55, 0.04, 0.04], [0.22, 0, 2.35], WOOD), box([0.015, 0.015, 0.12], [0.45, 0, 2.28], 0x2a2018),
    box([0.24, 0.24, 0.28], [0.45, 0, 2.08], 0xffd27a), box([0.18, 0.18, 0.04], [0.45, 0, 2.24], 0x2a2018), box([0.18, 0.18, 0.04], [0.45, 0, 1.93], 0x2a2018)],
  shield: { rim: 0x8a6a3c, a: 0xb89058, b: 0xa07c48, boss: 0x6b4a2b, ring: 0x8a6a3c, far: 0xa07c48 },   // a woven basket lid
};
export const SHEEP = { palette: SHEEP_PAL, head: sheepHead, weapons: SHEEP_WEAPONS, flag: null };
