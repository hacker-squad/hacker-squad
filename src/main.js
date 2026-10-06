// Boot, flow and the fixed 60 Hz loop. Sim modules (hero, combat, crowd, Overclock, story, camera control yaw) advance
// only in step(); render-side modules read sim state in render() and never write it.
// Flow: title → select → loading → battle → result → title. Each non-battle state is a DOM screen (index.html #title
// #select #loading #result, modules below: createX(el, flow) → { enter(ctx), exit(), view? }; view(scene, camera, focus,
// dt) = optional render-only camera / stage hook run after the gameplay rig while that screen is up); the sim only steps
// in 'battle' and not paused (Esc: pause menu #menu). startBattle() resets the sim for a fighter / mode.
// flow.go() returns a promise that settles once the new state's materials are compiled and two frames have presented
// (menu.js inkWipe holds the cover until then; the page boots under it, inkBoot). Every screen change goes through the
// wipe; the HUD slides in on each battle entry (#hud.in).
// 'loading' (after TO BATTLE, or RETRY on the result) runs deploy(): once the card is fully uncovered, startBattle for the
// chosen fighter (flow.go('battle') then keeps it: no second reset under a visible field), compile, warm frames (the
// bar tracks those real stages), a minimum dwell, then the wipe on into the battle — the fighter on the field is the
// chosen one before anything of the field is seen again, and its kit's first draws never stall on screen.
// Select → loading also snaps the select stage's key-art frame of the fighter (snapArt) for the loading card and result.
// Co-op (two computers on the same Wi-Fi, or a friend over the internet): title → 'lobby' (ui/lobby.js: the two players meet through the relay in
// serve.mjs, net/session.js; the host picks the mission and the difficulty) → select (each picks a fighter) → loading →
// battle → result → back to the lobby with the same players (the host picks the next mission). The
// battle's ctx then carries { coop: the session, seats: who plays, chars: their fighters, me: this player's index among
// them, battle: its id, diffId }
// and the loop steps the sim through net/lockstep.js instead of straight from the local input: both machines run the
// same deterministic sim on every player's inputs (up to four players). A dropped connection is redialled and the battle
// carries on (a notice says so meanwhile); a player gone for good is taken off the field and the others play on — only
// the host leaving ends the session (title). The same works over the internet: `node serve.mjs --online` opens
// a public link to the host's server (the lobby shows it), and the lockstep's input delay follows the connection. Pausing holds both; the partner leaving ends the battle (title).
// Dev shortcut: ?go=story|free[&char=id][&ch=championship|defense] skips the screens straight into a battle; ?enemies=n sets the crowd size.
// Missions: the game has two (story/chapters.js) — the Warehouse Championship and the Village Defense. The title menu
// (co-op: the host, in the lobby) picks one; it travels as ctx.chapter through select → loading → battle → result.
// Seam: the battle's stage (story/chapters.js) picks the map (world/map.js setMap) and its world (world.js sync); the
// screens before a battle stand on a map too (stageMap: the title and the lobby in the warehouse, the fighter select on
// the mission's own map). A world brings its own grade for the post chain (post.setLook).
import * as THREE from 'three';
import { emit, on, collect } from './core/events.js';
import { createGame } from './core/game.js';
import { createInput } from './core/input.js';
import { createPost } from './post/post.js';
import { createWorld } from './world/world.js';
import { createHeroView } from './hero/hero.js';
import { createCrowdView } from './crowd/view.js';
import { createCameraRig } from './camera/camera.js';
import { createVfx } from './vfx/vfx.js';
import { createHud } from './ui/hud.js';
import { createAudio } from './audio/audio.js';
import { CHARS, DEFAULT_CHAR } from './chars/index.js';
import { createTitle, CONTROLS, GAME_TITLE } from './ui/title.js';
import { createSelect } from './ui/select.js';
import { createLoading } from './ui/loading.js';
import { inkWipe, inkBoot, wiping, afterWipe, createNav, sfx, replay } from './ui/menu.js';
import { createTouch } from './ui/touch.js';
import { createResult } from './story/result.js';
import { difficulty, DIFFS } from './core/difficulty.js';
import { quietOverlays } from './musou/overlay.js';
import { createSession } from './net/session.js';
import { createLockstep } from './net/lockstep.js';
import { createLobby } from './ui/lobby.js';
import { MAP, setMap } from './world/map.js';
import { resolveChapter, DEFAULT_CHAPTER, CHAPTER_ORDER } from './story/chapters.js';

const params = new URLSearchParams(location.search);
// mobile quality tier: coarse pointers get 150 enemies, no MSAA / DoF, half-res bloom; ?hq forces full.
// The canvas renders at CSS-pixel resolution (DPR 1), inside the tier's DPR ≤ 1.5 cap.
const MOBILE = !params.has('hq') && matchMedia('(pointer: coarse)').matches;
const ENEMIES = Math.max(0, Math.min(2000, params.get('enemies') ? Number(params.get('enemies')) | 0 : MOBILE ? 150 : 300));

const canvas = document.getElementById('c');
let vw = innerWidth, vh = innerHeight;

const post = createPost({ canvas, width: vw, height: vh, mobile: MOBILE });
const scene = new THREE.Scene();
const world = createWorld(scene);
post.setLook(world.look);

// ---- sim
// mode: 'story' (the championship) | 'free' (practice), set by startBattle; the hero's fighter / kit: game.hero.char / game.hero.kit
// (the players — one, or two in co-op — and what game.hero / game.musou / game.cam mean: core/game.js)
const game = createGame(ENEMIES);
const input = createInput();
createTouch(input.virt, game, MOBILE);

// ---- render side
const crowdView = createCrowdView(scene, game);
const camRig = createCameraRig(game, vw, vh);
const vfx = createVfx(scene, game, world);
// kit views, one set per player (hero model + secondary + ghosts, the Overclock's and the moves' effects): rebuilt when
// a player's kit changes. The partner's Overclock keeps its 3D effects but not the screen overlay (quietOverlays).
const views = [];
const dropView = (v) => { v.off(); v.heroView.dispose(); v.musouView.dispose(); };
function buildViews() {
  game.players.forEach((p, i) => {
    const v = views[i], local = i === game.me;
    if (v && v.hero === p.hero && v.mu === p.musou && v.local === local) return;
    if (v) dropView(v);
    game.use(i); quietOverlays(!local);
    const [[heroView, musouView], off] = collect(() => [createHeroView(scene, p.hero), p.hero.kit.createMusouView(scene, game, camRig.camera)]);
    quietOverlays(false);
    views[i] = { hero: p.hero, mu: p.musou, local, heroView, musouView, off };
  });
  while (views.length > game.players.length) dropView(views.pop());
  game.use(game.me);
}
buildViews();
// hud: camera passed so boss name / HP tags can be projected over their heads (read-only)
const hud = createHud(document.getElementById('hud'), game, camRig.camera);
createAudio(game);

/** One sim step on the players' inputs (solo: the local one; co-op: both, from the lockstep). */
function step(inputs) {
  game.step(inputs);
  vfx.afterStep();
}

let lastRenderFrame = 0;
/** real: wall-clock dt while a screen is up (the field idles behind it: fires, flags, cloth keep moving); battle: sim time. */
function render(real) {
  const dt = real ?? Math.min(10, Math.max(0, (game.frame - lastRenderFrame) / 60));
  lastRenderFrame = game.frame;
  const shown = state !== 'title' && state !== 'select' && state !== 'lobby';   // no fighter chosen yet: the field stands empty
  for (const v of views) { v.heroView.root.visible = shown && !v.hero.gone; v.heroView.update(Math.min(dt, 0.1)); }   // (gone: he left the co-op battle)
  crowdView.update(dt, camRig.camera);
  vfx.update(dt);
  camRig.update(dt);
  screens[state]?.view?.(scene, camRig.camera, camRig.focus, dt);   // ui lane: a screen may frame the idle field itself
  world.update(dt, camRig.focus, game);
  views.forEach((v, i) => { game.use(i); v.musouView.update(dt); });
  game.use(game.me);
  post.render(scene, camRig.camera, game.frame / 60, camRig.focus, vfx.flash);   // post-fx: DoF focus + screen flash
  hud.update();
}

/** New battle: { char: CHARS id, mode: 'story' | 'free', chapter?: CHAPTERS id }; co-op adds { chars: both fighters,
 *  me: this player's seat, diffId }. game.start makes the stage's map active and resets every sim module (deterministic
 *  from here); then the world is rebuilt if another map was on screen and the kit views on a fighter change. */
function startBattle({ char = DEFAULT_CHAR, chars = [char], me = 0, mode = 'story', chapter, diffId, coop: coopBattle } = {}) {
  game.start({ chars, mode, chapter, me, diff: DIFFS.find((d) => d.id === diffId) || difficulty() });
  if (world.sync()) post.setLook(world.look);
  lastRenderFrame = 0;
  buildViews();
  for (const v of views) v.heroView.reset();
  const ch = game.hero.char, two = !!coopBattle;
  menu.querySelector('.t').innerHTML = `${ch.name}<i>${ch.role}</i>`;
  menu.querySelector('.sub').textContent = `Paused · ${two ? `Co-op · ${game.story.chapter.title.sub}` : mode === 'story' ? game.story.chapter.title.sub : 'Practice'} · ${game.diff.name}${two ? ' · the others wait' : ''}`;
  menu.style.setProperty('--acc', ch.accent);
  document.title = `${ch.name} — ${GAME_TITLE}`;
  emit('scenario', { mode, char: ch.id, chapter: game.chapter });
}

addEventListener('resize', () => {
  vw = innerWidth; vh = innerHeight;
  post.setSize(vw, vh);
  camRig.resize(vw, vh);
  render();
});

// ---- flow + pause menu (index.html #menu, battle only): the sim waits while it is open or while a screen is up
const $ = (id) => document.getElementById(id);
const menu = $('menu'), hudEl = $('hud');
// the bindings mid-battle too
menu.querySelector('.hint').insertAdjacentHTML('beforebegin', `<table>${CONTROLS.map(([n, kb, pad]) => `<tr><td>${n}</td><td>${kb}</td><td class="pad">${pad}</td></tr>`).join('')}</table>`);
let paused = false, state = null, ctx = {}, hold = false;   // hold: loading, no renders until the new kit is compiled
// pause menu: RESUME focused on open, ↑/↓ / pad move, Enter / A confirm, Esc / B resume. QUIT asks once (Sure?), a
// second confirm wipes to the title.
const mBtns = [$('go'), $('quit')], quitEl = $('quit');
let mCur = 0, quitArm = false;
const armQuit = (v) => {
  quitArm = v; quitEl.classList.toggle('arm', v);
  quitEl.innerHTML = v ? 'Sure? <small>Progress is lost · press again</small>' : 'Quit <small>Back to the title</small>';
};
const mFocus = (i) => {
  mCur = (i + mBtns.length) % mBtns.length;
  mBtns.forEach((b, k) => b.classList.toggle('on', k === mCur));
  if (mCur !== 1 && quitArm) armQuit(false);
};
const mOk = () => {
  if (mCur === 0) return setPaused(false);
  if (!quitArm) { sfx('ok'); return armQuit(true); }
  sfx('back'); mNav.stop();
  leaveCoop();
  inkWipe(() => flow.go('title'));
};
const mNav = createNav({ move: (d) => { mFocus(mCur + d); sfx('move'); }, ok: mOk, back: () => setPaused(false) });
const setPaused = (v) => {
  if (lock.on && v !== paused) coop.send({ t: 'pause', on: v }, true);   // co-op: the partner's game waits, and says why
  paused = v; menu.hidden = !v; hudEl.hidden = v; input.sample();   // sample(): drop keys pressed on the menu
  if (v) { mFocus(0); armQuit(false); mNav.start(); } else mNav.stop();
};
mBtns.forEach((b, i) => {
  b.addEventListener('pointerenter', () => { if (mCur !== i) { mFocus(i); sfx('move'); } });
  b.addEventListener('click', () => { mFocus(i); mOk(); });
});
/** The map a screen stands on (no battle running): the stage's world is built if another one is up, and the field of
 *  the battle before is cleared off it. */
function stageMap(chapter) {
  const CH = resolveChapter(chapter);
  if (MAP.id === CH.map) return;
  setMap(CH.map);
  game.crowd.reset();
  if (world.sync()) post.setLook(world.look);
}
const flow = {
  /** Enter a flow state: 'title' | 'select' | 'loading' | 'battle' | 'result' (ctx: see each screen module). */
  go(s, c = {}) {
    if (s === 'loading' && state === 'select') c.art = arts[c.char] = snapArt();
    if (screens[state]) { screens[state].exit(); $(state).hidden = true; }
    const set = state === 'loading';                           // deploy() already started this battle (its field is on screen)
    state = s; ctx = c;
    lock.stop();
    game.live = s === 'battle' || s === 'result' || s === 'loading';     // world: a battle's mood and effects (the menus stand on a calm field)
    if (s === 'title' || s === 'lobby') stageMap(DEFAULT_CHAPTER); else if (s === 'select') stageMap(c.chapter);
    // the mission's colour theme (index.html body.forest): from the fighter select to the result; the title and lobby keep the hacker look
    document.body.classList.toggle('forest', s !== 'title' && s !== 'lobby' && resolveChapter(c.chapter).theme === 'forest');
    if (s === 'battle') { if (!set) startBattle(c); if (c.coop) { coop.unkeep('again'); lock.start(c.seats, c.battle); } setPaused(false); replay(hudEl, 'in'); }
    else { setPaused(false); hudEl.hidden = true; $(s).hidden = false; screens[s].enter(c); }
    emit('flow', { state: s, ctx: c });
    if (s === 'loading') { deploy(c); return nextFrame(); }
    return warm();
  },
};
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Compile every material in the scene (hidden pools included) for this camera, in parallel where the GPU has
 *  KHR_parallel_shader_compile, then let two frames present: the screen's first draws don't stall. */
async function warm() {
  screens[state]?.view?.(scene, camRig.camera, camRig.focus, 0);   // a screen's stage (select: every fighter's model) exists now
  await post.compile(scene, camRig.camera);
  await nextFrame(); await nextFrame();
}
/** Key-art still of the fighter focused on the select stage, taken under full cover: one render in the select screen's
 *  key-art framing, read back in the same task (no preserveDrawingBuffer needed). Cached per fighter (retry reuses it). */
const arts = {};
function snapArt() {
  const S = screens.select;
  S.keyart(true); render(0); S.keyart(false);
  try { return canvas.toDataURL('image/jpeg', 0.9); } catch { return null; }
}
/** Under the loading card: the chosen fighter's battle, compiled and rendered a few frames, then the wipe on into it.
 *  Runs only once the card is fully uncovered (the synchronous build would otherwise freeze the wipe over it); each
 *  stage is labelled on the card and the bar gets two frames to start moving before the main thread blocks. */
async function deploy(c) {
  const L = screens.loading;
  hold = true;
  while (wiping()) await nextFrame();
  if (state !== 'loading') return;
  const t0 = performance.now(), stage = async (p, label) => { L.progress(p, label); await nextFrame(); await nextFrame(); };
  await stage(0.18, 'Logging in the fighter');
  startBattle(c);
  await stage(0.5, `Spawning the ${game.story.chapter.foes}`);
  await post.compile(scene, camRig.camera);
  await stage(0.82, `Warming up ${game.story.chapter.title.name.toLowerCase()}`);
  hold = false;                                    // the loop renders the field behind the card: shadow / first-draw variants
  for (let i = 0; i < 4; i++) await nextFrame();
  L.progress(1);
  await sleep(Math.max(500, 1300 - (performance.now() - t0)));   // the card stays readable >= 1.3 s once revealed
  if (state !== 'loading') return;
  L.ready(); sfx('ok');
  await sleep(450);
  if (state !== 'loading') return;
  inkWipe(() => flow.go('battle', c));
}
// ---- co-op: the session with the partner (net/session.js) and the lockstep that steps the battle (net/lockstep.js)
const coop = createSession();
const lock = createLockstep(coop, game, () => input.sample(), step);
const toast = $('toast'), syncEl = $('sync');
let toastT = 0;
const notice = (text) => { toast.textContent = text; toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, 5000); };
const leaveCoop = () => { lock.stop(); coop.leave(); };
// the sims drifted apart and the host's state was handed round (net/lockstep.js): said once, in passing
// (at most every 20 s: two engines that keep disagreeing resync again and again)
let resyncSaid = -1e9;
lock.onResync = () => {
  if (state !== 'battle' || performance.now() - resyncSaid < 20000) return;
  resyncSaid = performance.now();
  notice(coop.host ? 'Out of sync — game resynced' : 'Out of sync — resynced with the host');
};
/** The session is over — the host left, or this player's own line could not be brought back: out of a battle / the
 *  fighter select / the result, back to the title. The lobby looks after itself (it takes a fresh seat). */
coop.sub('ended', (why) => {
  lock.stop();
  if (state === 'lobby' || !ctx.coop) return;
  mNav.stop();
  notice(why === 'host' ? 'The host left the game' : 'Connection lost');
  const go = () => inkWipe(() => flow.go('title'));
  if (wiping()) afterWipe(go); else go();
});
// anyone else leaving: the others carry on (in a battle the lockstep takes his fighter off the field, net/lockstep.js)
coop.sub('peer', (e) => { if (!e.on && e.seat !== 0 && ctx.coop && state !== 'lobby') notice(`Player ${e.seat + 1} left the game`); });
// a guest who missed the start (his line was down when it went out) is still choosing: the start again
coop.sub('pick', () => { if ((state === 'loading' || state === 'battle') && ctx.coop && coop.host && ctx.start) coop.send(ctx.start); });
coop.sub('again', () => { if (state === 'result' && ctx.coop) afterWipe(() => inkWipe(() => flow.go('lobby', { coop, diffId: ctx.diffId, chapter: ctx.chapter }))); });
// a guest who reached the lobby after the host had picked the next mission and moved on: the pick again
coop.sub('here', () => { if (state === 'select' && ctx.coop && coop.host) coop.send({ t: 'select', diff: Math.max(0, DIFFS.findIndex((d) => d.id === ctx.diffId)), ch: Math.max(0, CHAPTER_ORDER.indexOf(resolveChapter(ctx.chapter).id)) }); });
const names = (list) => list.map((k) => `player ${k + 1}`).join(', ');

const screens = {
  title: createTitle($('title'), flow), select: createSelect($('select'), flow), loading: createLoading($('loading')),
  result: createResult($('result'), flow), lobby: createLobby($('lobby'), flow, coop, ENEMIES),
};
on('story:end', (e) => inkWipe(() => flow.go('result', { ...ctx, win: e.win, stats: e.stats, diff: game.diff })));
addEventListener('keydown', (e) => {
  // opens; the menu's own nav (registered first) closes it and marks the key handled
  if (state === 'battle' && !paused && e.code === 'Escape' && !e.defaultPrevented) setPaused(true);
});
// Leaving the window pauses a solo battle. In co-op a pause holds the partner too, so only a deliberate one counts: the
// mouse lock given up with Esc while the window keeps the focus (input.js reports it as a blur) — not a click on another
// window (checked a moment later: the lock can go before the focus does).
addEventListener('blur', () => {
  if (state !== 'battle') return;
  if (!lock.on) return setPaused(true);
  setTimeout(() => { if (state === 'battle' && lock.on && document.hasFocus() && !document.pointerLockElement) setPaused(true); }, 200);
});

// ---- loop
let acc = 0, last = performance.now();
const frame = (now) => {
  requestAnimationFrame(frame);
  // clamp at 0 too: the first rAF timestamp can precede the performance.now() taken at module init
  const d = Math.min(0.1, Math.max(0, (now - last) / 1000));
  acc += d * (game.timeScale ?? 1); last = now;                                  // story: victory slow-mo
  // co-op: a dropped connection is being redialled (net/session.js) — said on every screen; the battle waits by itself
  const down = coop.away ? 'Connection lost — reconnecting…' : coop.awaySeats.length ? `${names(coop.awaySeats)} lost the connection — waiting for them…`.replace(/^p/, 'P') : '';
  if (down) { if (syncEl.textContent !== down) syncEl.textContent = down; syncEl.hidden = false; }
  else if (state !== 'battle' && !syncEl.hidden) syncEl.hidden = true;
  if (paused) { acc = 0; input.sample(); return; }
  if (state !== 'battle') { acc = 0; input.sample(); if (!hold) render(d); return; }     // screens: the field idles behind them
  let n = 0;
  if (lock.on) {
    // co-op: a tick steps only when both players' inputs for the frame are in; a partner who is ahead is caught up with
    while (acc >= 1 / 60 && n < 4 && state === 'battle') { lock.tick(); acc -= 1 / 60; n++; }
    while (n < 6 && state === 'battle' && lock.on && lock.behind()) { lock.tick(); n++; }
    const waiting = lock.wait > 45, who = names(lock.waitingFor).replace(/^p/, 'P'), text = !waiting ? '' : lock.peerPaused ? `${who} paused the game` : `Waiting for ${names(lock.waitingFor)}…`;
    if (!down) {
      if (syncEl.hidden === waiting) syncEl.hidden = !waiting;
      if (waiting && syncEl.textContent !== text) syncEl.textContent = text;
    }
    hudEl.classList.toggle('desync', lock.desync && !lock.broken); hudEl.classList.toggle('nosync', lock.broken);
    game.ping = Math.round(coop.rtt);                             // HUD: the round trip, on the partner's card
  } else {
    if (!down && !syncEl.hidden) syncEl.hidden = true;
    // (a co-op battle whose session just ended holds still until the wipe to the title covers it)
    if (!ctx.coop) while (acc >= 1 / 60 && n < 4 && state === 'battle') { step([input.sample()]); acc -= 1 / 60; n++; }
  }
  if (n >= 4) acc = 0;
  render();
};

const dev = params.get('go');
// the page opens under full cover (index.html): the first screen is built and compiled under it, then the wipe sweeps off
inkBoot(() => params.has('coop') ? flow.go('lobby') : dev ? flow.go('battle', { mode: dev === 'free' ? 'free' : 'story', char: params.get('char') || DEFAULT_CHAR, chapter: params.get('ch') || undefined }) : flow.go('title'));
requestAnimationFrame(frame);
