// The sim, assembled: one game object shared by the browser (main.js) and the headless runner (bench/sim.mjs).
//   const game = createGame(enemies)
//   game.start({ chars: [CHARS id per player], mode, chapter, diff, me })   battle reset — deterministic from here: both
//                                              RNGs reseeded, frame 0, nothing carried over from the battle before (not
//                                              even in a slot nobody uses: co-op players come with different histories,
//                                              and their sims must be equal bit for bit — bench/resync.mjs checks it).
//                                              The sim's maths is the same in every browser engine: core/dmath.js
//   game.step([inp per player])                one fixed step; inp = { mx, my, orbit, tilt, pressed: {}, held: {} }
//   game.drop(i)                               co-op: player i left the battle — his fighter is off the field from this
//                                              step on (hero.gone: counted as down for good; the others play on)
//   game.checksum()                            hash of the sim state (lockstep: both machines must agree, net/lockstep.js)
//   game.save() → snapshot / game.load(snapshot)   the whole sim state as JSON-safe data, and back into a game running
//                                              the same battle (same fighters, mission, difficulty, crowd size): a
//                                              co-op resync — the host's state replaces a drifted player's. Every sim
//                                              module packs its own state (core/snap.js); state that is not in the
//                                              snapshot would drift again — a module that grows state adds it there
//                                              (bench/resync.mjs checks a load against the run it was taken from)
// Players (solo: one, co-op: up to four): game.players[i] = { i, hero, musou, cam, hitstop }. The engine was written for one
// hero, so game.hero / game.musou / game.cam / game.hitstop stay — they read the player *in use*: game.use(i) picks
// him (game.pi). Rule: whatever steps, hurts or rewards a hero runs under that hero's player (step() below, combat's
// enemyStrike, the bosses' area blows); between steps the player in use is the local one (game.me), so the render
// side (HUD, camera rig, vfx trail, audio) follows the fighter this machine controls. game.view = the local player;
// game.mine() = "the player in use is the local one" (render-side listeners: is this event mine or my partner's?).
// Shared by both players: the crowd, combat, the story, game.freeze (an Overclock's activation holds the whole field).
import { rng, vrng } from './rng.js';
import { difficulty } from './difficulty.js';
import { emit } from './events.js';
import { createHero } from '../hero/hero.js';
import { createCrowd } from '../crowd/crowd.js';
import { createCombat } from '../combat/combat.js';
import { createCamSim } from '../camera/camera.js';
import { CHARS, DEFAULT_CHAR } from '../chars/index.js';
import { spawnPoint, setMap, clampWalk } from '../world/map.js';
import { resolveChapter } from '../story/chapters.js';
import { createStory } from '../story/index.js';
import { pack, restore } from './snap.js';
import * as dm from './dmath.js';

const HERO_SKIP = ['char', 'kit'], MU_SKIP = ['M', 'K'];         // references to static data: never part of a snapshot

export function createGame(enemies) {
  const game = { frame: 0, freeze: 0, mode: 'free', diff: difficulty(), players: [], pi: 0, me: 0 };   // diff: core/difficulty.js, fixed per battle
  let P = null;                                                 // the player in use
  Object.defineProperties(game, {
    hero: { get: () => P.hero },
    musou: { get: () => P.musou },
    cam: { get: () => P.cam },
    hitstop: { get: () => P.hitstop, set: (v) => { P.hitstop = v; } },
    view: { get: () => game.players[game.me] },
  });
  game.use = (i) => { P = game.players[i]; game.pi = i; };
  game.mine = () => game.pi === game.me;
  /** Team K.O. total (the stage's goals count everyone's). */
  game.kos = () => { let n = 0; for (const p of game.players) n += p.hero.kos; return n; };

  function addPlayer() {
    const p = { i: game.players.length, hitstop: 0, cam: createCamSim(), hero: null, musou: null };
    game.players.push(p);
    if (!P) P = p;
    p.hero = createHero(game); p.hero.pi = p.i;
    p.musou = p.hero.kit.createMusou(game);                     // the fighter's Overclock (rebuilt with the kit in start())
    p.mu0 = pack(p.musou, MU_SKIP);                             // …as it was made: what start() puts it back to
  }
  addPlayer();
  game.crowd = createCrowd(game, enemies);
  game.combat = createCombat(game);
  game.story = createStory(game);

  game.start = ({ chars = [DEFAULT_CHAR], mode = 'story', chapter, diff = difficulty(), me = 0 } = {}) => {
    const list = chars.map((id) => CHARS[id] || CHARS[DEFAULT_CHAR]), CH = resolveChapter(chapter, list[0].id);
    setMap(CH.map);
    while (game.players.length < list.length) addPlayer();
    game.players.length = list.length;
    const p = spawnPoint(mode);
    Object.assign(game, { mode, chapter: CH.id, frame: 0, freeze: 0, diff, me: Math.min(me, list.length - 1) });
    vrng.seed(7936); rng.seed(1);
    game.players.forEach((q, i) => {
      game.use(i);
      // co-op: side by side across the lane
      const side = ((list.length - 1) / 2 - i) * 2.6;
      const [x, z] = side ? clampWalk(p.x + dm.cos(p.yaw) * side, p.z - dm.sin(p.yaw) * side) : [p.x, p.z];
      if (list[i].kit !== q.hero.kit) { q.musou = list[i].kit.createMusou(game); q.mu0 = pack(q.musou, MU_SKIP); }
      q.hero.reset({ ...p, x, z, char: list[i] });
      q.hitstop = 0; q.cam.reset(p.yaw); q.cam.tilt = p.tilt || 0;
    });
    game.use(0);
    game.crowd.reset(); game.combat.reset();
    // (an Overclock back to the state it was made in: nothing of the battle before is left on it)
    game.players.forEach((q, i) => { game.use(i); q.musou.reset(); restore(q.musou, q.mu0, { skip: MU_SKIP }); q.musou.seq = 0; });
    game.use(0);
    game.story.reset({ mode, chars: list.map((c) => c.id), chapter: CH.id });
    game.use(game.me);
  };

  game.step = (inputs) => {
    const L = game.players;
    for (let i = 0; i < L.length; i++) { if (L[i].hero.gone) continue; game.use(i); L[i].cam.step(game, inputs[i]); L[i].hero.step(inputs[i]); }
    game.combat.step();
    game.crowd.step();
    for (let i = 0; i < L.length; i++) { if (L[i].hero.gone) continue; game.use(i); L[i].musou.step(); }
    game.story.step();
    game.frame++;
    game.use(game.me);
  };

  game.drop = (i) => {
    const p = game.players[i];
    if (!p || p.hero.gone) return;
    game.use(i);
    Object.assign(p.hero, { gone: true, dead: true, hp: 0, move: null, state: 'idle', stateT: 0, vx: 0, vz: 0, combo: 0, comboT: 0, iframes: 0 });
    p.hitstop = 0; p.musou.reset();
    emit('hero:gone', { i, x: p.hero.x, z: p.hero.z });
    game.use(game.me);
  };

  game.save = () => ({
    v: 1, frame: game.frame, freeze: game.freeze, timeScale: game.timeScale ?? 1, mode: game.mode, chapter: game.chapter, diff: game.diff.id,
    chars: game.players.map((p) => p.hero.char.id), rng: rng.state(),
    players: game.players.map((p) => ({ hitstop: p.hitstop, cam: pack(p.cam), hero: pack(p.hero, HERO_SKIP), musou: pack(p.musou, MU_SKIP) })),
    crowd: game.crowd.save(), combat: game.combat.save(), story: game.story.save(),
  });
  game.load = (s) => {
    const L = game.players;
    if (!s || s.v !== 1 || s.mode !== game.mode || s.chapter !== game.chapter || s.diff !== game.diff.id || s.players.length !== L.length ||
      s.chars.some((id, i) => id !== L[i].hero.char.id)) throw new Error('snapshot of another battle');
    game.crowd.load(s.crowd);                                      // (the one that can refuse — a different crowd size — goes first)
    Object.assign(game, { frame: s.frame, freeze: s.freeze, timeScale: s.timeScale });
    rng.seed(s.rng);
    L.forEach((p, i) => {
      const q = s.players[i];
      p.hitstop = q.hitstop;
      restore(p.cam, q.cam); restore(p.hero, q.hero, { skip: HERO_SKIP, keep: ['anim'] }); restore(p.musou, q.musou, { skip: MU_SKIP });
    });
    game.combat.load(s.combat); game.story.load(s.story);
    game.use(game.me);
  };

  const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
  game.checksum = () => {
    let h = 2166136261;
    const add = (v) => { f64[0] = v; h = Math.imul(h ^ u32[0], 16777619); h = Math.imul(h ^ u32[1], 16777619); };
    add(game.frame); add(rng.state()); add(game.freeze);
    for (const { hero: q, cam, hitstop } of game.players) for (const v of [q.x, q.y, q.z, q.yaw, q.hp, q.musou, q.kos, q.combo, cam.yaw, hitstop]) add(v);
    const c = game.crowd;
    for (let i = 0; i < c.T; i++) { add(c.x[i]); add(c.z[i]); add(c.hp[i]); add(c.st[i]); }
    return h >>> 0;
  };
  return game;
}
