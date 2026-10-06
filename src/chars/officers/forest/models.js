// Lieutenant + boss models (crowd view officer-model hook; ids used by the stage's OFF table, src/story/defense.js):
// lieutenants `alpha` (a pack alpha: spear and tower shield) and `raider` (a fox raider captain: sabre and buckler);
// bosses `vixen` · `fang` · `reynard` · `bigbad` (+ `bigbad_enraged`, the final phase swap) · `packwolf` (the boss wolf's
// own pack, called in mid-fight). Scale: the crowd officer is 1.22 ≈ 1.06 × hero. Original designs. Beaten, not killed:
// they kneel and raise the retreat horn.
import { shade } from '../../../core/voxel.js';
import { wolfHead, wolfBody, foxHead, foxBody, glaive, roundShield, box, HORN } from './kit.js';

const WOLF = { fur: 0x86888e, furD: 0x4c4e53, furL: 0xb0b2b8, eye: 0xe0a030, steel: 0x6c7076, steelD: 0x44474c, mantle: 0x6c6e74, cloak: 0x7a2018,
  blade: 0xb8bec6, edge: 0xe0e6ec, pole: 0x3d342c, teeth: 0xe6e2d8, under: 0x3a3c40, belt: 0x33302c, buckle: 0x6a6c70, boot: 0x222326 };
const FOX = { fur: 0xe07a2a, furD: 0xb85a1a, furL: 0xf09a4a, white: 0xf4ece0, sock: 0x2a201c, eye: 0x1a2a1a, steel: 0x7a5a3a, steelD: 0x4a3420,
  blade: 0xc8ced6, edge: 0xeef3f8, pole: 0x3a2418, teeth: 0xe8e2d8, under: 0x4a3420, belt: 0x3a2418, buckle: 0xc8a050, boot: 0x2a201c };
const sabre = (C, len = 0.9, glow = null) => [box([0.045, 0.045, 0.22], [0, 0, -0.02], C.pole), box([0.06, 0.16, 0.045], [0, 0, 0.11], C.buckle),
  box([0.024, 0.085, len * 0.55], [0, 0, 0.14 + len * 0.28], C.blade), box([0.024, 0.09, len * 0.35], [0, 0.035, 0.14 + len * 0.7], C.blade),
  box([0.024, 0.06, len * 0.14], [0, 0.085, 0.14 + len * 0.94], C.edge), ...(glow != null ? [box([0.03, 0.03, len * 0.8], [0, 0.0, 0.14 + len * 0.45], glow)] : [])];

// ---------------------------------------------------------------- alpha (lieutenant): a pack alpha, spear and tower shield
export const ALPHA = {
  parts: { ...wolfBody(WOLF, { bulk: 1.05, cape: true }), head: wolfHead(WOLF, { muzzle: 0.22, ear: 0.18, mane: 0.06 }) },
  weapon: [box([0.045, 0.045, 2.2], [0, 0, 0.45], WOLF.pole), box([0.06, 0.06, 0.05], [0, 0, -0.64], WOLF.steelD), box([0.07, 0.07, 0.05], [0, 0, 1.55], WOLF.steelD),
    box([0.09, 0.028, 0.2], [0, 0, 1.68], WOLF.blade), box([0.05, 0.028, 0.12], [0, 0, 1.82], WOLF.blade), box([0.024, 0.028, 0.06], [0, 0, 1.9], WOLF.edge)],
  offhand: [box([0.52, 0.92, 0.06], [0, 0.04, 0.12], WOLF.steel), box([0.56, 0.05, 0.07], [0, 0.5, 0.12], WOLF.steelD), box([0.56, 0.05, 0.07], [0, -0.42, 0.12], WOLF.steelD),
    box([0.04, 0.92, 0.07], [-0.27, 0.04, 0.12], WOLF.steelD), box([0.04, 0.92, 0.07], [0.27, 0.04, 0.12], WOLF.steelD), box([0.2, 0.3, 0.04], [0, 0.06, 0.16], 0xa82a1e)],
  scale: 1.22, tip: 1.9, voxel: 0.03, kneel: true, horn: HORN,
};

// ---------------------------------------------------------------- raider (lieutenant): a fox raider captain, sabre and buckler
export const RAIDER = {
  parts: { ...foxBody(FOX, { bulk: 1.04, cape: 0x2f6a5a, sash: 0x2f6a5a }), head: foxHead(FOX, { ear: 0.2, patch: true }) },
  weapon: sabre(FOX, 0.95),
  offhand: roundShield(0xc8642a, 0x8a6238, 0.28),
  scale: 1.18, tip: 1.05, voxel: 0.03, kneel: true, horn: HORN,
};

// ---------------------------------------------------------------- VIXEN: the foxes' scout captain — a green hood, a snare pole
const VIX = { ...FOX, fur: 0xe8862e, furD: 0xc0621c, steel: 0x3f6a4a, steelD: 0x2a4a34 };
const SNARE_POLE = [box([0.04, 0.04, 2.0], [0, 0, 0.6], 0x4a3a26), box([0.06, 0.06, 0.06], [0, 0, -0.38], 0xc8a050), box([0.07, 0.07, 0.05], [0, 0, 1.6], 0xc8a050)];
const NOOSE = [box([0.03, 0.34, 0.03], [0, 0.14, 1.7], 0xe8dcc0), box([0.03, 0.03, 0.34], [0, 0.3, 1.86], 0xe8dcc0), box([0.03, 0.34, 0.03], [0, 0.14, 2.02], 0xe8dcc0),
  box([0.03, 0.03, 0.34], [0, -0.02, 1.86], 0xe8dcc0), box([0.07, 0.07, 0.07], [0, 0.3, 2.02], 0xffb02e)];
export const VIXEN = {
  parts: { ...foxBody(VIX, { bulk: 1.06, cape: 0x2f6a3a, sash: 0xffb02e }), head: foxHead(VIX, { ear: 0.22, hood: 0x2f6a3a, plume: 0xffb02e }) },
  weapon: [...SNARE_POLE, ...NOOSE],
  broken: { haft: [...SNARE_POLE], head: [box([0.34, 0.03, 0.34], [0, 0, 0], 0xe8dcc0), box([0.07, 0.07, 0.07], [0.16, 0.02, 0.16], shade(0xffb02e, 0.5))] },
  scale: 1.26, tip: 2.0, voxel: 0.028, kneel: true, horn: HORN,
};

// ---------------------------------------------------------------- IRON FANG: the pack's bruiser — an iron muzzle, a spiked maul, a shield
const IRO = { ...WOLF, fur: 0x62646a, furD: 0x34363b, furL: 0x8a8c92, eye: 0xd89a38, steel: 0x646a72, steelD: 0x3c4047, mantle: 0x5e6066, cloak: 0x5a1814, under: 0x2e3034 };
const MAUL_HAFT = [box([0.06, 0.06, 1.4], [0, 0, 0.4], 0x3a2a1e), box([0.09, 0.09, 0.14], [0, 0, -0.32], IRO.steelD), box([0.08, 0.08, 0.05], [0, 0, 1.06], IRO.steelD)];
const maulHead = (z) => [box([0.3, 0.3, 0.44], [0, 0, z], 0x4a4e56), box([0.34, 0.34, 0.08], [0, 0, z + 0.2], IRO.steel), box([0.34, 0.34, 0.08], [0, 0, z - 0.2], IRO.steel),
  ...[[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]].map(([x, y]) => box([x ? 0.14 : 0.08, y ? 0.14 : 0.08, 0.08], [x, y, z], 0xc8ced6))];   // spikes
export const FANG = {
  parts: { ...wolfBody(IRO, { bulk: 1.3, mantle: true, cape: true }), head: wolfHead(IRO, { muzzle: 0.25, ear: 0.16, iron: true, mane: 0.1 }) },
  weapon: [...MAUL_HAFT, ...maulHead(1.3)],
  cracked: [...MAUL_HAFT, ...maulHead(1.3), box([0.31, 0.012, 0.3], [0, 0.04, 1.3], 0x0a0a0a), box([0.012, 0.31, 0.2], [0.05, 0, 1.32], 0x0a0a0a),
    box([0.36, 0.36, 0.04], [0, 0, 1.53], 0xff5a2a)],                                  // cracks + the striking face glowing on rage
  crackAt: 0.25,
  broken: { haft: [...MAUL_HAFT], head: [box([0.16, 0.3, 0.4], [-0.1, 0, 0.15], 0x4a4e56), box([0.15, 0.3, 0.38], [0.12, -0.02, 0.1], 0x3e4248)] },
  offhand: roundShield(0x5a5e66, 0xa82a1e, 0.4),
  scale: 1.36, tip: 1.5, voxel: 0.028, kneel: true, horn: HORN,
};

// ---------------------------------------------------------------- REYNARD: the fox chief — a long crimson coat, a plumed brow, a gilded sabre
const REY = { ...FOX, fur: 0xd8701e, furD: 0xa84e12, steel: 0x5a2a22, steelD: 0x3a1a16, buckle: 0xe0b450, eye: 0x2a6a3a };
const REY_BLADE = sabre({ ...REY, pole: 0x2a1410 }, 1.3, 0xffc23a);
export const REYNARD = {
  parts: { ...foxBody(REY, { bulk: 1.12, coat: 0x8a1c22, trim: 0xe0b450 }), head: foxHead(REY, { ear: 0.22, patch: true, plume: 0xf4ece0 }) },
  weapon: REY_BLADE,
  broken: { haft: REY_BLADE.slice(0, 2), head: [box([0.5, 0.03, 0.09], [0, 0, 0], REY.blade), box([0.3, 0.03, 0.08], [0.3, 0, 0.12], REY.edge)] },
  offhand: [box([0.08, 0.08, 0.3], [0, 0, 0.14], 0xe0b450), box([0.14, 0.14, 0.12], [0, 0.02, 0.34], 0xc8a050)],   // the signal horn that calls the volleys
  scale: 1.3, tip: 1.45, voxel: 0.028, kneel: true, horn: HORN,
};

// ---------------------------------------------------------------- the BIG BAD WOLF: the boss wolf — near-black fur, a heavy mantle, a long
// ragged cloak, a great glaive. Final phase: the cloak is thrown off, bare chest and war paint, red eyes (bigbad_enraged).
const BBW = { fur: 0x3e4046, furD: 0x1e1f24, furL: 0x6a6c74, eye: 0xffb02e, steel: 0x4a5058, steelD: 0x30353c, mantle: 0x5a5c63, cloak: 0x6a1410,
  blade: 0xc8ced6, edge: 0xeef3f8, pole: 0x2a1f1a, teeth: 0xf0ece2, under: 0x26282c, belt: 0x2a2b2e, buckle: 0xc8a050, boot: 0x1e1f24 };
const G = glaive(BBW, { butt: -0.6, collar: 1.8, len: 0.6, h: 0.19, heavy: 1.2 });
export const BIGBAD = {
  parts: { ...wolfBody(BBW, { bulk: 1.18, mantle: true, cloak: true }), head: wolfHead(BBW, { muzzle: 0.27, ear: 0.2, mane: 0.14, scar: true }) },
  weapon: G.weapon, cracked: G.cracked, crackAt: 0.2, broken: G.broken,
  scale: 1.46, tip: 2.4, voxel: 0.026, kneel: true, horn: HORN,
};
const RAGE = { ...BBW, eye: 0xff2a1a, fur: 0x34363b };
export const BIGBAD_ENRAGED = { ...BIGBAD, parts: { ...wolfBody(RAGE, { bulk: 1.22, mantle: true, bare: true }), head: wolfHead(RAGE, { muzzle: 0.27, ear: 0.2, mane: 0.16, scar: true }) } };

// ---------------------------------------------------------------- pack wolf: one of the boss wolf's own — dark fur, war paint, twin-edged spear
const PCK = { ...BBW, fur: 0x4a4c54, mantle: 0x3a3c42 };
export const PACKWOLF = {
  parts: { ...wolfBody(PCK, { bulk: 1.02, bare: true }), head: wolfHead(PCK, { muzzle: 0.23, ear: 0.19, mane: 0.08, scar: true }) },
  weapon: glaive(PCK, { butt: -0.5, collar: 1.4, len: 0.4, h: 0.13 }).weapon,
  scale: 1.1, tip: 1.8, voxel: 0.03, kneel: false,
};
