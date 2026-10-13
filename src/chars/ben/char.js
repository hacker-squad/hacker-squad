// Ben — character entry (contract: src/chars/index.js).
import { BEN_KIT } from './kit.js';

// 20×20 portrait: the round brown head, the tan heart-shaped face with big dark eyes, the monocle over the right one and
// a wide grin, round ears, the green tee
const FACE = [
  '........BBBB........',
  '......BBBBBBBB......',
  '.....BBBBBBBBBB.....',
  '....BBBBBBBBBBBB....',
  '.EE.BBBBBBBBBBBB.EE.',
  'EeeEBBTTTTTTTTBBEeeE',
  'EeeEBBTTTTTTTTBBEeeE',
  'EeeEBTYYYYTTTTTBEeeE',
  '.EEBBTYKKYTTTKKTTBE.',
  '...BBTYKwYTTTKwTTB..',
  '...BBTYYYYTTTTTTTB..',
  '....BTYTTNNNNTTTTB..',
  '....BTYTTNTTNTTTTB..',
  '....BBYTTTTTTTTTB...',
  '.....BTTMMMMMMTTB...',
  '.....BBTTMMMMTTBB...',
  '......BBTTTTTTBB....',
  '.......BBBBBBBB.....',
  '..GGGGGGGGGGGGGGGG..',
  '.GGGGGGGyGGGGGGGGGG.',
];
const PAL = { B: '#6b4a2e', T: '#e8c49a', K: '#1a1410', w: '#ffffff', N: '#b88a60', M: '#5a2a22', E: '#6b4a2e', e: '#e8c49a', Y: '#ffd93a', G: '#2f7d3a', y: '#ffd93a' };

export const BEN = {
  id: 'ben',
  name: 'Ben', role: 'The Orchard Raider', tag: 'BEN',
  motto: 'Fruit is a food group and a weapon',
  weapon: 'Banana Bow & Boomerang',
  bio: ['A monkey with a bow carved from one enormous banana, a boomerang he never seems to lose, and a quiver full of whatever was ripe this morning.',
    'He fights at arm\'s length: arrows down the lane, the boomerang out and back, pineapples, melons, grapes and one durian nobody wants near them — and when the gauge is full, the gorilla comes out.'],
  stats: { atk: 3, def: 2, speed: 4, range: 5 }, musou: { name: 'Going Ape', desc: 'He swells into a gorilla: a rampage of ground pounds you steer, a chest-beat shockwave, then the leaping slam under a rain of bananas.' }, accent: '#ffd93a',
  lines: {
    intro: 'Fresh fruit, free delivery. Mind the peel.',
    intros: { defense: 'Nobody raids the orchard but me. Back off, wolves.' },
    musouEnd: 'Ook. That was the small one.',
    musouEnds: { defense: 'Ook. Back to the woods, pups.' },
    copy: ['Hold on to something', 'Banana time'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: BEN_KIT,
};
