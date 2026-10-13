// Clara — character entry (contract: src/chars/index.js).
import { CLARA_KIT } from './kit.js';

// 20×20 portrait: the bent witch's hat with its orange band, ears through the brim, big green-gold eyes, a white muzzle
const FACE = [
  '............HH......',
  '...........HHHH.....',
  '..........HHHHh.....',
  '.........HHHHHH.....',
  '........HHHHHHHH....',
  '.......OOOOOOOOOO...',
  '..F...OOOOGGOOOOO.F.',
  '.FFhhhhhhhhhhhhhhFF.',
  'hhhhhhhhhhhhhhhhhhhh',
  '.FPFFFFFFFFFFFFFFPF.',
  '..FFEEEKFFFFKEEEFF..',
  '..FFEEEKFFFFKEEEFF..',
  '..FFEwEKFFFFKEwEFF..',
  'WWFFFFFFWNNWFFFFFFWW',
  '..FFFFWWWNNWWWFFFF..',
  'WWFFFFWWWKKWWWFFFFWW',
  '...FFFFWWWWWWFFFF...',
  '....OOOOOGGOOOOO....',
  '..DDDDDDDDDDDDDDDD..',
  '.DDDdDDDDDDDDDDdDDD.',
];
const PAL = { H: '#6a2fa8', h: '#4a1f7a', O: '#ff8a1e', G: '#ffd75e', F: '#3e3650', P: '#f08a9a', E: '#d8f04a', K: '#16121c', w: '#ffffff', W: '#f4eee6',
  N: '#f08a9a', D: '#5a2a8a', d: '#421e68' };

export const CLARA = {
  id: 'clara',
  name: 'Clara', role: 'The Hearth Witch', tag: 'CLARA',
  motto: 'Double, double, hackers in trouble',
  weapon: 'Burning Broom',
  bio: ['The Sheep Village cat, in the witch\'s costume she refuses to take off after Halloween: a bent hat, a little cape, striped stockings — and a broom whose bristles never stop burning.',
    'The quickest paws in the bracket: every swat trails fire, her breath is a cone of flame, and she keeps pumpkins and a swarm of bats up her sleeve.'],
  stats: { atk: 3, def: 2, speed: 5, range: 4 }, musou: { name: 'Witching Hour', desc: 'A swarm of bats pours out, three pumpkin bombs burst, then the Great Pumpkin lands.' }, accent: '#c58aff',
  lines: {
    intro: 'Double, double, hackers in trouble. Fire burn — you get the idea.',
    intros: { defense: 'Double, double, wolves in trouble. Fire burn — you get the idea.' },
    musouEnd: 'Happy Halloween. Now shoo.',
    musouEnds: { defense: 'Happy Halloween, wolves. Now shoo.' },
    copy: ['Bats, if you please', 'Trick or treat'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: CLARA_KIT,
};
