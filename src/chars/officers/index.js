// Crowd skins + lieutenant / boss models registry (content for the crowd view's hook, src/crowd/view.js header). The
// stage picks skins with `skin: { foe, foe2, ally }` (story/chapters.js; foe2: the skin the sword-and-shield soldiers
// wear instead of `foe`); officers with `model: key` in their OFF entry. New skins / models register here with one import
// + one entry. ./ = the warehouse's hackers, ./forest/ = the Village Defense's wolves, foxes and sheep.
import { BLACKHAT, WHITEHAT } from './skins.js';
import { SYSOP, PHISH, TROJAN, RANSOM, ROOT, ROOT_UNMASKED, FORK } from './models.js';
import { WOLF, FOX, SHEEP } from './forest/skins.js';
import { ALPHA, RAIDER, VIXEN, FANG, REYNARD, BIGBAD, BIGBAD_ENRAGED, PACKWOLF } from './forest/models.js';

export const SKINS = { blackhat: BLACKHAT, whitehat: WHITEHAT, wolf: WOLF, fox: FOX, sheep: SHEEP };
export const OFFICER_MODELS = { sysop: SYSOP, phish: PHISH, trojan: TROJAN, ransom: RANSOM, root: ROOT, root_unmasked: ROOT_UNMASKED, fork: FORK,
  alpha: ALPHA, raider: RAIDER, vixen: VIXEN, fang: FANG, reynard: REYNARD, bigbad: BIGBAD, bigbad_enraged: BIGBAD_ENRAGED, packwolf: PACKWOLF };
