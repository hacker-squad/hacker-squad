// Lockstep for co-op. Every browser runs the whole sim (src/core/game.js: deterministic, fixed 60 Hz) and they exchange
// nothing but inputs: sim frame f is stepped only once the inputs of every player still in the battle are in hand for
// f, so all the sims stay identical step for step. A player's input is sampled L.delay frames ahead of the frame it
// applies to, sent at once, and queued locally for the same frame — so by the time a frame is due, the others' inputs
// for it have had L.delay frames to cross the network.
// The delay follows the connection (each side sizes its own; they need not agree): one way trip (half the round trip
// the session measures to the slowest player: the line's own time, S.rttLow) + a frame of margin — 2 frames (33 ms) on
// a LAN, ≈ 4-6 over a typical internet link, at most MAX. Re-judged every second: it goes up when the line got slower,
// and a frame at a time (up to 3 more) while the sim keeps having to wait for inputs (jitter); it comes back down once
// things are calm.
//   const L = createLockstep(S, game, sample, step)    S: net/session.js · sample() → inp (core/input.js) · step([inp per player])
//   L.start(seats, battle)     seats: the seats that play, in player order (game.players[i] ↔ seats[i]); battle: the id
//                              everyone got with `start` (inputs of another battle are dropped; inputs that arrive
//                              before this side has finished loading are kept)
//   L.tick() → stepped?        once per 1/60 s of wall time: samples + sends the local input, steps if it can
//   L.tick(true)               an extra tick to catch up (no sample: the wall clock has not moved)
//   L.behind()                 the others are ahead of us (their inputs are piling up): main.js ticks extra to catch up
//   L.catching()               …far ahead (FAR frames over the delay): this fighter stands aside until the sim is current
//   L.stop()
//   L.on · L.wait (ticks spent waiting for inputs: the HUD's "waiting" notice) · L.waitingFor (the seats whose input is
//   missing) · L.peerPaused (the one we wait for has paused: the host) · L.desync (this sim has drifted from the host's and waits for his
//   state) · L.resyncs (resyncs so far; L.onResync() is called after each) · L.broken (the host's state could not be
//   loaded here: no resync for this player) · L.checked (checksums compared and found equal so far) · L.delay (frames)
//   · L.stalls (ticks spent waiting, in all)
// A machine that stalls (the host's pause menu, a slow frame) simply stops sending; the others wait for it. A guest's
// pause menu does not stall him: his page keeps stepping and sending (inputs flagged `pause`, so his fighter stands
// still and untouchable in every sim) and the others play on. A hidden tab keeps stepping too (main.js ticks it from a
// worker's clock, flagging the inputs `away`: the fighter stands aside like a paused one).
// STAND-IN: a player whose inputs stop coming all the same (his device went to sleep, his phone locked, a browser
// that froze the page) does not hold the others for long either. Every input says which frame its sim is on (`g`), so
// the relay can see who is waiting on whom: once a player is quiet for serve.mjs's GRACE while someone waits on him, the
// relay stands in for him — it sends everyone, in his name, the AWAY input (SUB: no controls, fighter aside) for every
// frame the others reach, and logs them like his own. When he is heard from again (an input, or `awake`: this side saw
// its own stand-ins arrive while it was ticking) the relay stops standing in, tells
// him { t: 'go', f, from }: "your inputs count again from frame f on; from `from` to f they were stood in for" — this
// side takes SUB for its own inputs over that span (a frame already stepped with the real input: the sim has
// diverged → `need`: the host sends his state, as for any drift), moves `sent` to f and, while its sim is still far
// behind the others' (L.catching: the extra ticks main.js runs catch it up), keeps sending AWAY inputs at the wall
// clock's pace so the others never wait for it.
// A player who leaves for good (quit, closed the page, away longer than the relay holds his seat) does not stop the
// battle: the relay, which has seen every input, says where his end — { t: 'out', seat, f } — and on frame f every sim
// takes his fighter off the field (game.drop) and plays on without waiting for him.
// A dropped connection (the session redials it, net/session.js) loses whatever was on the way. The relay keeps every
// input of the battle, so once the line is back this side sends the relay the inputs of its own that it lacks and asks
// (`re`) for the others' from the last frame it holds without a gap: the battle carries on from the frame it stopped at.
// Every CHECK frames the players send a checksum of the sim (game.checksum). The sim is written to give the same bits in
// every browser engine (core/dmath.js) and to start every battle from the same blank state (game.start), so a mismatch
// should not happen; if one does (a different build of the game on one device, a bug), the sims have drifted apart and
// would only drift further. RESYNC: the host's sim is the reference. When a player's
// checksum differs from his, the host takes a snapshot of his whole sim (game.save, at the frame he is on) and sends it
// to everyone — { t: 'rs', e, f, k, n, d }: resync number e, in n parts. Each of the others loads it (game.load) as it
// arrives, wherever his own sim was: a sim that was ahead of the snapshot steps those frames again with the inputs it
// kept (KEEP frames; the relay has the rest), one that was behind jumps forward; from there all step on as before. The
// players' own inputs are untouched — nobody loses a press. Checksums carry the resync number they were taken under
// (their epoch), so one from before a resync is never held against the state after it; a player whose checksums stay
// on an old epoch missed the snapshot (his line was down) and is sent a new one. If the sims keep disagreeing, resyncs
// repeat — at most one every GAP[0] ms, GAP[1] once three have happened within 20 s.
import { ACTIONS } from '../core/input.js';

const MIN = 2, MAX = 15, CHECK = 60, FRAME = 1000 / 60;
const KEEP = 900;                    // frames of the others' inputs kept behind the sim (a resync may step them again)
const PART = 200000;                 // a snapshot crosses in messages of at most this many characters (the relay passes 1 MB)
const GAP = [1500, 6000], LOST = 3000;   // ms between two resyncs · a checksum still on the old epoch this long after one: it was missed
const bits = (o) => ACTIONS.reduce((n, a, k) => n | (o[a] ? 1 << k : 0), 0);
const flags = (n) => Object.fromEntries(ACTIONS.map((a, k) => [a, !!(n >> k & 1)]));
// d[6]: 1 the player has his pause menu open (a guest: the battle runs on and his fighter stands untouchable, game.js);
// 2 he is away (hidden tab, catching up, or the relay standing in for him): the same for the sim, AWAY on the others' cards
const pack = (i) => [i.mx, i.my, i.orbit, i.tilt, bits(i.pressed), bits(i.held), i.pause ? (i.away ? 2 : 1) : 0];
const unpack = (d) => ({ mx: d[0], my: d[1], orbit: d[2], tilt: d[3], pressed: flags(d[4]), held: flags(d[5]), pause: !!d[6], away: d[6] === 2 });
const NONE = [0, 0, 0, 0, 0, 0, 0];
export const SUB = [0, 0, 0, 0, 0, 0, 2];                    // the input the relay stands in with (serve.mjs: the same bytes)
const FAR = 30;                                             // frames behind the others' inputs (over the delay) that count as catching up

export function createLockstep(S, game, sample, step) {
  const L = { on: false, wait: 0, waitingFor: [], peerPaused: false, desync: false, resyncs: 0, broken: false, onResync: null, checked: 0, delay: 3, stalls: 0 };
  let me = 0, seats = [], gone = [], battle = -1, sent = 0, mine = {}, sums = {}, ticks = 0, waited = 0, calm = 0;
  // resync: the number of the state this sim is on · (host) when the last snapshots went out · the parts of one arriving
  let epoch = 0, syncAt = -1e9, recent = [], parts = null;
  // what has arrived for a battle (the newest one heard of): the others' inputs / checksums by seat, who is out since when
  const fresh = (b) => ({ b, q: {}, top: {}, sums: {}, out: {} });
  let net = fresh(-1);
  const of = (b) => { if (net.b < b) net = fresh(b); return net.b === b ? net : null; };
  const paused = {};                                         // seat → has the pause menu open
  const linkDown = () => S.away || S.awaySeats.length > 0;
  function check(f) {
    const theirs = net.sums[f];
    if (sums[f] === undefined || !theirs) return;
    let drift = false;
    for (const k in theirs) {
      const [h, e] = theirs[k];
      if (S.host) {                                          // the host's sim is the reference: he judges everyone's
        if (e < 0) continue;                                 // (a player who could not load a snapshot: nothing more to send him)
        if (e !== epoch) { if (performance.now() - syncAt > LOST) drift = true; }   // still on the state before the last resync: it never reached him
        else if (h !== sums[f]) drift = true;
        else L.checked++;
      } else if (Number(k) === seats[0] && e === epoch) { if (h !== sums[f]) L.desync = true; else L.checked++; }   // the others only compare with the host
    }
    delete net.sums[f];
    if (drift) resync();
  }
  /** Host: a player's sim has drifted — everyone gets this sim's state, as of the frame it is on. */
  function resync() {
    const now = performance.now();
    recent = recent.filter((t) => now - t < 20000);
    if (now - syncAt < GAP[recent.length >= 3 ? 1 : 0]) return;   // (the next checksum asks again)
    let text;
    try { text = JSON.stringify(game.save()); } catch (e) { console.error(e); return; }
    epoch++; syncAt = now; recent.push(now); L.resyncs++;
    const n = Math.ceil(text.length / PART);
    for (let k = 0; k < n; k++) S.send({ t: 'rs', b: battle, e: epoch, f: game.frame, k, n, d: text.slice(k * PART, (k + 1) * PART) });
    L.onResync?.();
  }
  S.sub('rs', (m) => {
    if (!L.on || S.host || L.broken || m.b !== battle || !(m.e > epoch)) return;
    if (!parts || parts.e !== m.e) parts = { e: m.e, got: 0, d: [] };
    if (parts.d[m.k] === undefined) { parts.d[m.k] = m.d; parts.got++; }
    if (parts.got < m.n) return;
    const text = parts.d.join('');
    parts = null;
    try { game.load(JSON.parse(text)); }
    catch (e) { console.error(e); L.broken = L.desync = true; return; }   // not the same game on both sides: it cannot be mended
    epoch = m.e; sums = {}; L.desync = false; L.resyncs++;
    seats.forEach((k, i) => { gone[i] = !!game.players[i].hero.gone; });   // (who has left is part of the state)
    ask();                                                   // the others' inputs from the snapshot's frame on, where they are no longer kept
    L.onResync?.();
  });
  // (sub: the relay stood in — in my own name too: that input is what everyone plays for me on that frame)
  S.sub('i', (m) => {
    const n = of(m.b);
    if (!n) return;
    if (m.s === S.seat) { if (m.sub && L.on && m.b === battle) stoodIn(m.f, m.f + 1); return; }
    if (L.on && m.b === battle && m.f < game.frame) return;   // (a frame sent again that was already played)
    (n.q[m.s] ||= {})[m.f] = m.d; if (!(m.f <= n.top[m.s])) n.top[m.s] = m.f;
  });
  /** The relay stood in for me on frames [a, b): SUB is my input there. A frame already stepped here with the real
   *  one: this sim has diverged from everyone's — the host's state puts it right (`need`; the host just resyncs). */
  let diverged = false, held = 0;                            // held: the relay stood in for me up to this frame — not mine to send
  function stoodIn(a, b) {
    for (let f = a; f < b; f++) {
      if (mine[f] && mine[f][6] === 2) continue;             // (an AWAY input of my own: the same to the sim)
      if (f < game.frame) diverged = true;
      mine[f] = SUB;
    }
    held = Math.max(held, b);
  }
  // the relay stops standing in: my inputs count again from frame m.f (the ones I queued past it are void)
  S.sub('go', (m) => {
    if (!L.on || m.b !== battle) return;
    stoodIn(m.from, m.f);
    if (sent < m.f) sent = m.f;
    if (diverged) { diverged = false; L.desync = true; if (S.host) resync(); else S.send({ t: 'need', b: battle }); }
  });
  S.sub('need', (m) => { if (L.on && S.host && m.b === battle) resync(); });
  S.sub('out', (m) => { const n = of(m.b); if (n && n.out[m.seat] === undefined) n.out[m.seat] = m.f; });
  S.sub('ck', (m) => { const n = of(m.b); if (!n) return; (n.sums[m.f] ||= {})[m.s] = [m.h, m.e ?? 0]; if (L.on && m.b === battle) check(m.f); });
  S.sub('pause', (m) => { paused[m.s] = !!m.on; });
  S.sub('peer', (e) => { if (!e.on) delete paused[e.seat]; });
  // after a reconnect (or a late start): "I hold seat k's inputs up to frame top[k]" → the relay sends the rest again
  const ask = () => {
    const tops = {};
    for (const k of seats) { if (k === S.seat) continue; let f = game.frame; const q = net.q[k] || {}; while (q[f]) f++; tops[k] = f - 1; }
    S.send({ t: 're', b: battle, tops });
  };
  S.sub('resume', (e) => {
    if (!L.on) return;
    if (e && e.mine) {                                       // what the relay lacks of my own inputs (sent while the line was down)
      const from = e.have && e.have.b === battle ? e.have.f + 1 : 0;
      for (let f = Math.max(0, from); f < sent; f++) S.send({ t: 'i', b: battle, f, d: mine[f] });
    }
    ask();
  });

  /** The delay the link asks for: the one way trip + a frame of margin (3 while the round trip is not known yet). */
  const wanted = () => (S.rttLow ? Math.max(MIN, Math.min(MAX, Math.ceil(S.rttLow / 2 / FRAME) + 1)) : 3);
  /** Once a second: up at once (the link slowed down; or inputs keep arriving late: one more frame, up to 3 over what
   *  the round trip asks for), down after 3 calm seconds. */
  function retune() {
    const w = wanted();
    if (w > L.delay) { L.delay = w; calm = 0; }
    else if (waited > 6 && !L.peerPaused && !linkDown() && L.delay < Math.min(MAX, w + 3)) { L.delay++; calm = 0; }
    else if (waited <= 1 && w < L.delay && ++calm >= 3) { L.delay -= Math.max(1, (L.delay - w) >> 1); calm = 0; }
    waited = 0;
  }
  // (g: the frame this sim is on — the relay reads from it who is waiting on whom)
  const put = (d) => { mine[sent] = d; S.send({ t: 'i', b: battle, f: sent, d, g: game.frame }); sent++; };
  L.start = (list, b) => {
    seats = list.slice(); me = seats.indexOf(S.seat); gone = seats.map(() => false);
    battle = b; sent = 0; mine = {}; sums = {}; of(b);
    Object.assign(L, { on: true, wait: 0, peerPaused: false, desync: false, resyncs: 0, broken: false, checked: 0, delay: wanted(), stalls: 0 });
    epoch = 0; syncAt = -1e9; recent = []; parts = null; diverged = false; held = 0;
    L.waitingFor.length = 0; ticks = waited = calm = 0;
    while (sent < L.delay) put(NONE);                            // the first frames: nobody touched the pad yet
    ask();                                                       // (anything of the others' lost while this side was loading)
  };
  L.stop = () => { L.on = false; L.wait = 0; L.waitingFor.length = 0; };
  /** The lowest of the others' input frontiers (-1: none heard of). */
  const front = () => { let top = Infinity; seats.forEach((k, i) => { if (i !== me && !gone[i]) top = Math.min(top, net.top[k] ?? -1); }); return top < Infinity ? top : -1; };
  L.behind = () => L.on && front() - game.frame > L.delay + 1;
  L.catching = () => L.on && front() - game.frame > L.delay + FAR;
  const inputs = [];
  L.tick = (catchup = false) => {
    const f = game.frame;
    if (!catchup) {
      if (++ticks % 60 === 0) retune();
      // the relay stood in for me past what I sent: those frames are settled — and I am here again, let it know (it
      // answers `go`; said again while its stand-ins keep coming, until it has heard)
      if (sent < held) { sent = held; S.send({ t: 'awake', b: battle }); }
      // the delay just grew: the frames in between repeat this sample without its presses · it shrank: no sample this tick
      if (sent <= f + L.delay) { const d = pack(sample()); put(d); while (sent <= f + L.delay) put([d[0], d[1], 0, 0, 0, d[5], d[6]]); }
      // catching up (back from a stand-in): the others are far ahead; one AWAY input per wall tick keeps my frontier
      // ahead of theirs so they never wait for me while this sim steps the frames in between (nothing is sampled: a
      // press now would land on a frame I cannot see yet)
      else if (L.catching() && sent <= front() + L.delay + FAR) put(SUB);
    }
    L.waitingFor.length = 0;
    for (let i = 0; i < seats.length; i++) {
      const k = seats[i];
      if (!gone[i] && net.out[k] !== undefined && f >= net.out[k]) { gone[i] = true; game.drop(i); }   // he left: off the field, on this frame everywhere
      inputs[i] = i === me ? mine[f] : gone[i] ? NONE : net.q[k] && net.q[k][f];
      if (!inputs[i]) L.waitingFor.push(k);
    }
    if (L.waitingFor.length) {
      L.wait++; L.peerPaused = L.waitingFor.some((k) => paused[k]);
      if (!L.peerPaused && !linkDown()) { waited++; L.stalls++; }
      return false;
    }
    L.wait = 0; L.peerPaused = false;
    inputs.length = seats.length;
    // (mine stays: a reconnect may need it again; the others' stay KEEP frames: a resync may step them again)
    for (let i = 0; i < seats.length; i++) { if (i !== me && !gone[i]) delete net.q[seats[i]][f - KEEP]; inputs[i] = unpack(inputs[i]); }
    step(inputs);
    if (game.frame % CHECK === 0) {
      const k = game.frame;
      sums[k] = game.checksum(); S.send({ t: 'ck', b: battle, f: k, h: sums[k], e: L.broken ? -1 : epoch }); check(k);
      delete sums[k - CHECK * 10]; delete net.sums[k - CHECK * 10];
    }
    return true;
  };
  return L;
}
