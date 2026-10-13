// Anonymous — character entry (contract: src/chars/index.js). The hidden fighter: not on the roster — on the fighter
// select, hold Shift for three seconds on Connector's card and it puts the mask on (src/ui/select.js).
import { ANONYMOUS_KIT } from './kit.js';

// 20×20 portrait: Connector — the green oval, three hairs, two orange hands — behind the white mask of logo.png
const FACE = [
  '......K..K..K.......',
  '......K..K..K.......',
  '.......K.K.K........',
  '......LLLLLLL.......',
  '....LLKKKKKKKLL.....',
  '...LKKWWWWWWWKKL....',
  '..JKWWWWWWWWWWWKJ...',
  '..JKWKKKWWWKKKWKJ...',
  '.JJKWWWWWWWWWWWKJJ..',
  '.JJKWKKKWWWKKKWKJJ..',
  '.JJKWRRWWWWWRRWKJJ..',
  '.JJKWWWWWWWWWWWKJJ..',
  'OOJKWKWWWKWWWKWKJOO.',
  'OOJJKWKKKWKKKWKJJOO.',
  'OOJJKWWWWWWWWWKJJOO.',
  '.JJJJKWWWKWWWKJJJJ..',
  '.DDJJJKWWKWWKJJDDD..',
  '..DDDJJKKKKKJJDDD...',
  '...DDDDDDDDDDDDD....',
  '....................',
];
const PAL = { K: '#16181c', L: '#a6ffc4', J: '#46e07a', D: '#1e8a4a', W: '#f6f4ee', R: '#e0202a', O: '#ff8a1e' };

export const ANONYMOUS = {
  id: 'anonymous',
  name: 'Anonymous', role: 'The Legion', tag: 'ANONYMOUS',
  motto: 'We are Legion',
  weapon: 'Itself, masked',
  bio: ['Nobody knows what it is — and now nobody knows who: the green jelly behind a white mask with arched brows, red cheeks and a curled moustache.',
    'Everything Connector does, turned all the way up: it hits harder, shrugs off more, runs faster and reaches wider — and its three clones and the hundred-fold giant wear the mask too.'],
  stats: { atk: 5, def: 5, speed: 5, range: 5 }, musou: { name: 'Giga Connect', desc: 'The mask, 100× bigger: three giant hops you steer, a spin, the belly flop. In the air: three masked clones for ten seconds.' }, accent: '#eef2f5',
  lines: {
    intro: 'We are Anonymous. We are Legion. Expect us. Bloop!',
    intros: { defense: 'We are Anonymous. We do not forgive wolves. Bloop!' },
    musouEnd: 'Pffff… we were never here.',
    musouEnds: { defense: 'Pffff… the wolves saw nothing.' },
    copy: ['We are Legion', 'One hundred times'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: ANONYMOUS_KIT,
};
