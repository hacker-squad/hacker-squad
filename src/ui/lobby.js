// Co-op lobby (#lobby, ui lane): where the players (two to four) meet before a co-op mission. Entering takes a seat on the
// relay (net/session.js). The first player in is the host: the card shows what the other player opens — the public link
// for a friend elsewhere when the server runs with --online (S.link), and the address for a computer on the same Wi-Fi;
// a click copies one. Whoever is in when the host confirms plays (the relay then closes the lobby). Then — once the partner is in — he picks the mission
// (Warehouse Championship / Village Defense, story/chapters.js), then the difficulty, and confirms; everyone goes on to
// the fighter select. The guests see the host's picks follow along. Esc: back from the difficulty to the mission, else
// leaves (the seat is given back).
// After a co-op mission (result → PLAY AGAIN) everyone comes back here with their seats (enter({ coop, chapter, diffId })):
// the host picks the next mission and difficulty — the same one again or the other — and nobody has to join again. The
// relay opens the free seats to newcomers meanwhile (`open`); a guest who arrives after the host's pick asks for it (`here`).
// The host's card also shows the address as a QR code (ui/qr.js) — the public link when there is one, else the
// same-network one — so a phone in the audience scans the screen and is in the lobby (the game plays on a phone held
// sideways: ui/touch.js). A click on it fills the screen with it (and the link in big type) for a projector; click / Esc back.
// Nothing here needs the internet: the relay is the host's own computer, so with the Wi-Fi router (or a phone hotspot,
// or a cable) alone the same-network address works — only the public link (--online) needs a way out.
// The two crowds must be the same size (the sims are stepped in lockstep): a guest whose page runs another crowd size
// (a phone's lighter tier, a ?enemies= switch) reloads itself with the host's and comes straight back here (?coop).
// Screen contract: createLobby(el, flow, S, enemies) → { enter(ctx), exit() } (src/main.js header). S: the session.
import { createNav, sfx, inkWipe, wiping, afterWipe, stamp, clearStamp, replay } from './menu.js';
import { DIFFS, difficulty } from '../core/difficulty.js';
import { CHAPTERS, CHAPTER_ORDER } from '../story/chapters.js';
import { qrSvg } from './qr.js';

export function createLobby(el, flow, S, enemies) {
  el.innerHTML = `
    <div class="t-veil"></div>
    <div class="t-band">
      <div class="t-logo"><i class="t-chip">2–4 players · local network or internet</i><h1><span data-t="CO-OP"><b>CO-OP</b></span></h1>
        <p class="t-sub"><span>Either mission, together</span></p></div>
      <div class="lb-card"><div class="lb-text"><h3></h3><p class="lb-st"></p><div class="lb-url"></div><p class="lb-rtt"></p></div>
        <button class="lb-qr" hidden><span class="lb-qr-img"></span><b>Scan to join</b><small></small><i></i></button></div>
      <nav class="t-menu t-dif lb-dif"><p class="lb-h">Mission</p>${CHAPTER_ORDER.map((id, i) => `<button data-m="${i}" style="--i:${i}"><b>${CHAPTERS[id].menu.label}</b><small>${CHAPTERS[id].menu.sub}</small></button>`).join('')}
        <p class="lb-h">Difficulty</p>${DIFFS.map((d, i) => `<button data-d="${i}" style="--i:${i}"><b>${d.name}</b><small>${d.line}</small></button>`).join('')}</nav>
    </div>
    <footer class="ui-foot"></footer>`;
  const $ = (s) => el.querySelector(s), dbtns = [...el.querySelectorAll('.lb-dif button[data-d]')], mbtns = [...el.querySelectorAll('.lb-dif button[data-m]')];
  let live = false, busy = false, dcur = 1, mcur = 0, step = 0, err = '', sel = null;   // step: the host is on 0 the mission, 1 the difficulty · sel: the host's `select`, once given
  let qrFor = null;                                           // the address the QR code on the card shows (drawn once per address)
  const paintQr = (show) => {
    const q = $('.lb-qr'), u = show ? (S.link || S.urls[0] || location.origin) : null;
    q.hidden = !u; if (!u) { el.classList.remove('scan'); return; }
    if (u === qrFor) return;
    qrFor = u;
    $('.lb-qr-img').innerHTML = qrSvg(`${u}/?coop`);
    $('.lb-qr small').textContent = S.link ? 'friends anywhere — any phone, its own network too' : 'phones on the same Wi-Fi / local network';
    $('.lb-qr i').textContent = `${u}/?coop`;
  };

  const paint = () => {
    const host = S.host, n = S.seats.length, ready = S.on && S.peer;
    el.classList.toggle('guest', S.on && !host); el.classList.toggle('ready', ready); el.classList.toggle('err', !!err);
    $('.lb-card h3').textContent = err ? 'Co-op is not available' : !S.on ? 'Connecting…' : host ? 'You are player 1 — the host' : `You are player ${S.seat + 1}`;
    const who = S.seats.map((k) => `P${k + 1}${k === S.seat ? ' (you)' : ''}`).join(' · ');
    $('.lb-st').textContent = err || (!S.on ? '' : ready
      ? `In the lobby: ${who} — ${n} of ${S.max}. ` + (host ? `Pick the mission and the difficulty to go on${n < S.max ? ', or wait for more players' : ''}.` : 'Player 1 is picking the mission and the difficulty…')
      : host ? (S.link ? 'Waiting for players (up to 4). Send your friends the link (click to copy); on the same Wi-Fi or local network the address under it works too:'
        : 'Waiting for players (up to 4). On the other computers (same Wi-Fi or local network — no internet needed), open this address (click to copy):') : 'Waiting for player 1…');
    const row = (u, tag) => `<button data-u="${u}/?coop"><b>${u}/?coop</b><small>${tag}</small></button>`;
    const share = !err && S.on && host && n < S.max && !busy;
    paintQr(share);
    $('.lb-url').innerHTML = share
      ? (S.link ? row(S.link, 'for friends anywhere') : '') + (S.urls.length ? S.urls.map((u) => row(u, 'same Wi-Fi / local network')).join('') : S.link ? '' : row(location.origin, 'this server'))
        + (S.link ? '' : '<p>Friends somewhere else? Start the game with <kbd>node serve.mjs --online</kbd> to get a link for them.</p>')
      : '';
    $('.lb-rtt').textContent = ready && S.rtt ? `Connection: ${Math.round(S.rtt)} ms round trip${S.rtt > 250 ? ' — slow: the controls will feel late' : ''}` : '';
    dbtns.forEach((b, i) => b.classList.toggle('on', i === dcur)); mbtns.forEach((b, i) => b.classList.toggle('on', i === mcur));
    el.classList.toggle('pick-m', step === 0); el.classList.toggle('pick-d', step === 1);
    $('.ui-foot').innerHTML = (ready && host ? `<span><kbd>↑</kbd><kbd>↓</kbd>${step ? 'Difficulty' : 'Mission'}</span><span><kbd>Enter</kbd><kbd class="pad">A</kbd>Confirm</span>` : '')
      + `<span><kbd>Esc</kbd><kbd class="pad">B</kbd>Back</span>`;
  };
  const cfg = () => { if (S.host && S.peer) S.send({ t: 'cfg', diff: dcur, ch: mcur, step, enemies }, true); };
  const dfocus = (i) => {
    if (busy || !S.host || !S.peer) return;
    if (step) dcur = (i + dbtns.length) % dbtns.length; else mcur = (i + mbtns.length) % mbtns.length;
    sfx('move'); paint(); cfg();
  };
  const toSelect = (i, m) => {
    busy = true; dcur = i; mcur = m; step = 1; paint();
    stamp(dbtns[dcur], 'OK');
    const go = () => { if (live) inkWipe(() => flow.go('select', { mode: 'story', coop: S, diffId: DIFFS[dcur].id, chapter: CHAPTER_ORDER[mcur] || CHAPTER_ORDER[0] })); };
    setTimeout(() => { if (live) afterWipe(go); }, 380);      // (a guest may still be on the wipe in from the result)
  };
  const ok = () => {
    if (busy || !live) return;
    if (wiping()) return afterWipe(ok);
    if (err) return back();
    if (!S.host || !S.peer) return;
    if (!step) { step = 1; sfx('ok'); paint(); return cfg(); }
    S.send(sel = { t: 'select', diff: dcur, ch: mcur }, true);
    toSelect(dcur, mcur);
  };
  const back = () => {
    if (busy || !live) return;
    if (wiping()) return afterWipe(back);
    if (el.classList.contains('scan')) { el.classList.remove('scan'); sfx('back'); return; }
    if (step && S.host && S.peer && !err) { step = 0; sfx('back'); paint(); return cfg(); }
    busy = true; sfx('back'); S.leave();
    inkWipe(() => flow.go('title'));
  };
  const join = () => {
    err = ''; paint();
    S.join().then(() => { if (!live) return S.leave(); paint(); cfg(); }, (e) => {
      if (!live) return;
      err = e.message === 'full' ? 'Every seat is taken (four players).' : e.message === 'busy' ? 'A game is already under way. Ask the host to open a new lobby when it is over.'
        : 'This page was not started by the game\'s own server. Start it with "node serve.mjs" and open the address it prints.';
      paint();
    });
  };
  // the partner came or went; a guest whose host left takes a fresh seat (and becomes the host)
  // someone came or went; a guest whose host left (or whose line is gone for good) takes a fresh seat
  S.sub('peer', (e) => { if (!live || busy) return; paint(); cfg(); if (e.on) sfx('ok'); });
  S.sub('ended', () => { if (live) { busy = false; clearStamp(el); join(); } });
  S.sub('link', () => { if (live) paint(); });
  S.sub('pong', () => { if (live && !busy && !$('.lb-rtt').textContent) paint(); });
  S.sub('cfg', (m) => {
    if (!live || S.host) return;
    if (m.enemies !== enemies) { S.leave(); location.replace(`${location.pathname}?coop&enemies=${m.enemies}`); return; }
    dcur = m.diff; mcur = m.ch | 0; step = m.step ? 1 : 0; paint();
  });
  S.sub('select', (m) => { if (live && !busy && !S.host) toSelect(m.diff, m.ch | 0); });
  // a guest back from a mission after the host: the picks so far, or the `select` he missed (the host already on the
  // fighter select answers from there: main.js)
  S.sub('here', () => { if (!live || !S.host) return; if (busy && sel) S.send(sel); else cfg(); });

  const nav = createNav({ move: (d) => dfocus((step ? dcur : mcur) + d), ok, back });
  el.addEventListener('pointerover', (e) => { const b = e.target.closest('.lb-dif button'); if (b && b.dataset.d !== undefined && step && +b.dataset.d !== dcur) dfocus(+b.dataset.d); });
  el.addEventListener('click', (e) => {                     // an address: copy it
    const u = e.target.closest('.lb-url button');
    if (!u) return;
    const done = () => { u.classList.add('ok'); sfx('ok'); setTimeout(() => u.classList.remove('ok'), 1500); };
    try { navigator.clipboard.writeText(u.dataset.u).then(done, () => {}); } catch {}
  });
  el.addEventListener('click', (e) => {                     // the QR code: big for the room / back to the card
    if (!e.target.closest('.lb-qr')) return;
    el.classList.toggle('scan'); sfx(el.classList.contains('scan') ? 'ok' : 'back');
  });
  el.addEventListener('click', (e) => {                     // a mission: picked, on to the difficulty · a difficulty: picked and confirmed
    const b = e.target.closest('.lb-dif button');
    if (!b || !S.host || !S.peer || busy) return;
    if (b.dataset.m !== undefined) { mcur = +b.dataset.m; step = 1; sfx('ok'); paint(); return cfg(); }
    dcur = +b.dataset.d; step = 1; cfg(); ok();
  });

  return {
    enter(c = {}) {
      live = true; busy = false; clearStamp(el); step = 0; sel = null;
      replay(el, 'in');
      nav.start();
      if (!c.coop || !S.on) { dcur = DIFFS.indexOf(difficulty()); return join(); }
      // back from a mission, seats kept: the cursor on what was just played
      dcur = Math.max(0, DIFFS.findIndex((d) => d.id === c.diffId)); mcur = Math.max(0, CHAPTER_ORDER.indexOf(c.chapter)); err = '';
      S.unkeep('select');                                    // (the last mission's: a reconnect must not send it again)
      paint();
      if (S.host) { S.send({ t: 'open' }); cfg(); } else S.send({ t: 'here' });
    },
    exit() { live = false; nav.stop(); el.classList.remove('scan'); },
  };
}
