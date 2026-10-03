// Alex — character entry (contract: src/chars/index.js).
import { ALEX_KIT } from './kit.js';

// 20×20 portrait: wool cap, a dark face, big goggles with blue lenses, pink nose, a red scarf
const FACE = [
  '....................',
  '......WWWWWWWW......',
  '....WWWwWWWWwWWW....',
  '...WWWWWWWwWWWWWW...',
  '...WwWWWWWWWWWWwW...',
  '..WWWWWWWwWWWWWWWW..',
  '..WWSSSSSSSSSSSSWW..',
  '.FFSGGGGGSSGGGGGSFF.',
  'FFFSGLLlGGGGLLlGSFFF',
  '.FFSGLKLGSSGLKLGSFF.',
  '...SGLLLGFFGLLLGS...',
  '...FGGGGGFFGGGGGF...',
  '...FFFFFFFFFFFFFF...',
  '....FFFFNNNNFFFF....',
  '....FFFFFNNFFFFF....',
  '.....FFFFDDFFFF.....',
  '....WWFFFFFFFFWW....',
  '...RRRRRRRRRRRRRR...',
  '..WWRRRRRRRRRRrrWW..',
  '.WWWWWwWWWWWWrrWWWW.',
];
const PAL = { W: '#f6f2e8', w: '#ddd6c6', F: '#45403c', S: '#7a4a26', G: '#c8a050', L: '#6fe0ff', l: '#e8fbff', K: '#2e2a28', N: '#e89aa0', D: '#2e2a28',
  R: '#e0402a', r: '#b02a1c' };

export const ALEX = {
  id: 'alex',
  name: 'Alex', role: 'The Storm Chaser', tag: 'ALEX',
  motto: 'Rain or shine, I bring the weather',
  weapon: 'Umbrella',
  bio: ['A sheep who watches the sky through a pair of flight goggles and never leaves home without an umbrella — which, it turns out, is also a spear, a hook and a sail.',
    'Over from Sheep Village for the championship. Furled, the umbrella sweeps a whole rank; opened, it throws gales, calls a cloudburst down five metres away and carries him off as a whirlwind.'],
  stats: { atk: 4, def: 3, speed: 3, range: 5 }, musou: { name: 'Typhoon', desc: 'He rides the open umbrella as the eye of a twister — fly him with the stick — then the storm drop.' }, accent: '#5ac8ff',
  lines: {
    intro: 'Forecast for today: heavy hackers, with a strong chance of umbrella.',
    musouEnd: 'And that clears the sky.',
    copy: ['Here comes the rain', 'Hold on to your hats'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: ALEX_KIT,
};
