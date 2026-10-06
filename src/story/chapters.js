// Stage registry (seam). A stage = its data module (format: ./championship.js — SPK, OFF, BEATS, EPILOGUE, DEFEAT,
// script) + the fields below. The story director, the result and loading screens, the HUD and main.js read the active
// stage from here. The game has two missions — the Warehouse Championship and the Village Defense — each its own stage,
// map and cast of enemies; the player picks one on the title (co-op: the host, in the lobby). A new one registers with
// one import + one entry in LIST.
//   id                 CHAPTERS key (flow ctx.chapter, ?ch= dev param)
//   map                map id (src/world/map.js MAPS) the battle is fought on
//   cast               playable fighters (CHARS ids); the first of them the player didn't pick speaks the `who: 'ally'` lines
//   title {small, name, sub}   stage band (small: MISSION 1, name: the place, sub: the event); win / wins / lose / loses:
//                      the result screen's line after the fighters' names (plural / one fighter)
//   menu {label, sub}  the mission's line in the title menu and the co-op lobby; arena: the practice arena's name
//   theme              colour theme of the mission's screens — select, loading, HUD, pause menu, result ('forest'; none: the
//                      hacker neon — index.html body.forest, ui/hud.js PAL)
//   foes               what the enemies are called in HUD lines ("More … rush in")
//   sides {us, them, names {us, them}}   short tags for the HUD's control bar, and who its reinforcement banners name
//   allies [{ x, z, n, cols, hold }]   battle start: your squad's ranks (crowd.spawnAllies)
//   skin { foe, foe2, ally }  crowd skins (src/chars/officers/index.js SKINS); foe2: the skin the sword-and-shield
//                      soldiers wear instead of `foe` (two kinds of invader in one horde)
import * as championship from './championship.js';
import * as defense from './defense.js';
import { CHAR_ORDER } from '../chars/index.js';

const LIST = [
  {
    ...championship, id: 'championship', map: 'warehouse', cast: [...CHAR_ORDER],
    title: { small: 'MISSION 1', name: 'The Warehouse', sub: 'Hacker Championship', win: 'win the Hacker Championship', wins: 'wins the Hacker Championship',
      lose: 'leave the bracket', loses: 'leaves the bracket' },
    menu: { label: 'Warehouse Championship', sub: 'Knock out 1000 hackers and the four top hackers' }, arena: 'The Mainframe Core', foes: 'challengers',
    sides: { us: 'SQD', them: 'BLK', names: { us: 'Your squad', them: 'Black-hat' } },
    skin: { foe: 'blackhat', ally: 'whitehat' },
    // your squad, drawn up either side of the centre lane behind the start
    allies: [-1, 1].map((sx) => ({ x: sx * 6, z: -166, n: 10, cols: 5, hold: true })),
  },
  {
    ...defense, id: 'defense', map: 'forest', cast: [...CHAR_ORDER],
    title: { small: 'MISSION 2', name: 'The Forest', sub: 'Village Defense', win: 'save Sheep Village', wins: 'saves Sheep Village',
      lose: 'fall defending the village', loses: 'falls defending the village' },
    menu: { label: 'Village Defense', sub: 'Repel 1000 wolves and foxes and their four leaders' }, arena: 'The Battlefield', foes: 'invaders', theme: 'forest',
    sides: { us: 'FLOCK', them: 'PACK', names: { us: 'The flock', them: 'Pack' } },
    skin: { foe: 'wolf', foe2: 'fox', ally: 'sheep' },
    // the village flock, drawn up either side of the track behind the start
    allies: [-1, 1].map((sx) => ({ x: sx * 6, z: -166, n: 10, cols: 5, hold: true })),
  },
];

export const CHAPTERS = Object.fromEntries(LIST.map((c) => [c.id, c]));
export const CHAPTER_ORDER = LIST.map((c) => c.id);
export const DEFAULT_CHAPTER = CHAPTER_ORDER[0];

/** Stages a fighter can play (in order). */
export const chaptersFor = (charId) => CHAPTER_ORDER.filter((id) => CHAPTERS[id].cast.includes(charId));

/** Resolve a stage for (stage id?, char id): the named one, else the fighter's first, else the default. */
export function resolveChapter(id, charId) {
  return CHAPTERS[id] || CHAPTERS[chaptersFor(charId)[0]] || CHAPTERS[DEFAULT_CHAPTER];
}
