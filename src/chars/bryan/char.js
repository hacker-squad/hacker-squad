// Bryan — character entry (contract: src/chars/index.js).
import { BRYAN_KIT } from './kit.js';

// 20×20 portrait: a yellow safety helmet with its peak, pink face, a big snout, rosy cheeks, the hi-vis vest
const FACE = [
  '....................',
  '.......YYyYYY.......',
  '.....YYYYyYYYYY.....',
  '....YYYYYyYYYYYY....',
  '...YYYYYYyYYYYYYY...',
  '...YYYYYYyYYYYYYY...',
  '..yyyyyyyyyyyyyyyy..',
  '.yyyyyyyyyyyyyyyyyy.',
  '.EEPPPPPPPPPPPPPPEE.',
  'EEEPPKKPPPPPPKKPPEEE',
  '.EEPPKKPPPPPPKKPPEE.',
  '...PPPPSSSSSSPPPP...',
  '...PBBSSNSSNSSBBP...',
  '...PBBSSNSSNSSBBP...',
  '...PPPPSSSSSSPPPP...',
  '....PPPPMMMMPPPP....',
  '.....PPPPPPPPPP.....',
  '...VVVVPPPPPPVVVV...',
  '..VVLLLLLLLLLLLLVV..',
  '.VVVVVVVVDDVVVVVVVV.',
];
const PAL = { Y: '#ffd21e', y: '#d8a80e', P: '#f4a6ae', E: '#dc8892', K: '#2a1c1e', S: '#f9c0c4', N: '#a85a66', B: '#f08a98', M: '#a85a66',
  V: '#ff7a1e', L: '#e8f47a', D: '#d8620c' };

export const BRYAN = {
  id: 'bryan',
  name: 'Bryan', role: 'The Road Block', tag: 'BRYAN',
  motto: 'Nothing gets past the sign',
  weapon: 'Stop-Sign Shield, Cones & Fences',
  bio: ['A pig from the Sheep Village road crew: yellow safety helmet, hi-vis vest, the STOP sign he never puts down — and a depot\'s worth of traffic cones and roadworks fences.',
    'Slow to wind up and impossible to move: the sign bashes a rank flat, cones fly down the lane and spring up underfoot, and a fence shoved through the crowd takes the whole rank with it.'],
  stats: { atk: 5, def: 5, speed: 2, range: 4 }, musou: { name: 'Road Closed', desc: 'Four fence walls pen the crowd in, thirteen cones rain into the pen, then the slam.' }, accent: '#ffd21e',
  lines: {
    intro: 'Road\'s closed, boys. Read the sign.',
    intros: { defense: 'Valley road\'s closed, wolves. Read the sign.' },
    musouEnd: 'Detour\'s that way. Mind how you go.',
    musouEnds: { defense: 'Detour\'s back to the hills. Mind how you go.' },
    copy: ['Read the sign', 'Road closed'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: BRYAN_KIT,
};
