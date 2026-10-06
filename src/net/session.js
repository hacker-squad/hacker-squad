// Co-op session: up to four players — computers on the same Wi-Fi, or, when the host started `node serve.mjs --online`,
// friends anywhere through the public link the server opened. The page that served the game (serve.mjs) also runs a
// relay — a WebSocket at /coop with a seat per player; this module is the browser's end of it. Seat 0 is the host (the
// first one in): he picks the difficulty and gives the start. When the host leaves, the session is over for everyone;
// when anyone else leaves, the others carry on.
//   const S = createSession()
//   S.join() → Promise                 take a seat (rejects: 'full' = every seat is taken, 'busy' = a game is under way,
//                                      'offline' = no relay — the game was not started with `node serve.mjs`)
//   S.leave()                          give the seat back (the others are told)
//   S.send(msg) / S.sub(type, fn)      a message to / from the other players ({ t: type, ... }, JSON; a received one
//                                      carries s = the sender's seat)
//   S.send(msg, true)                  …and keep it: the latest kept message of each type is sent again after a
//                                      reconnect (state the others must not miss: a pick, the start, a pause);
//                                      S.unkeep(type) drops one
//   S.sub('peer', fn({ seat, on }))    a player arrived / left for good (seat 0 leaving ends the session: 'ended' follows)
//   S.sub('away', fn) / S.sub('resume', fn({ mine, have }))   a connection — mine (S.away) or another player's
//                                      (S.awaySeats) — dropped / is back. A dropped line is redialled every 1.5 s for
//                                      40 s (the relay holds the seat for 45); what was sent meanwhile is lost — after
//                                      'resume' the kept messages go out again and the lockstep re-sends / asks again
//                                      for inputs (have = { b, f }: the last of my inputs the relay holds)
//   S.sub('ended', fn(why))            the session is over: 'host' (the host left) | 'lost' (my line could not be
//                                      brought back). The seat is already given back.
//   S.on, S.seat, S.host, S.max, S.seats (the seats taken, mine included, ascending), S.peer (anyone else here?),
//   S.urls (addresses for computers on the same Wi-Fi), S.link (the public address, or null; S.sub('link', fn))
//   S.rtt / S.rttLow     round trip in ms to the slowest of the others: smoothed / the best of the last 5 s — what the
//                        line itself takes, without the moments a busy page answered late (0 = not known yet).
//                        Measured twice a second (ping / pong); the lockstep sizes its input delay from it, the HUD
//                        shows it.
// Messages between the players (who sends them): cfg { diff, enemies } host, lobby · select { diff } host: everyone goes
// to the fighter select · ping { n } / pong { n, to } (this module) · pick { char, ready } everyone · start { seats,
// chars, diff, b } host: everyone loads battle b · i { b, f, d } / ck { b, f, h, e } / rs { b, e, f, k, n, d } lockstep (./lockstep.js) · pause
// { on } · again (result: back to the lobby, seats kept) · here (a guest is back in the lobby: the host answers with cfg
// / select). To / from the relay itself: hb, bye, re, out, open (serve.mjs).
export function createSession() {
  const S = { on: false, seat: -1, host: false, peer: false, max: 4, seats: [], awaySeats: [], urls: [], link: null, rtt: 0, rttLow: 0, away: false };
  const subs = {}, kept = {};
  let ws = null, key = null, heard = 0, redial = 0;
  const URL0 = () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/coop`;
  const fire = (t, a) => { for (const fn of subs[t] || []) fn(a); };
  S.sub = (t, fn) => { (subs[t] ||= []).push(fn); };
  S.send = (m, keep = false) => { if (keep) kept[m.t] = m; if (ws && ws.readyState === 1) ws.send(JSON.stringify({ ...m, s: S.seat })); };
  S.unkeep = (t) => { delete kept[t]; };
  /** The other players' seats. */
  S.others = () => S.seats.filter((k) => k !== S.seat);
  // round trips: a ping every 500 ms, answered at once by every other page; the slowest player counts
  const rt = {};                                            // seat → { rtt, recent: [] }
  const tally = () => {
    S.rtt = S.rttLow = 0;
    for (const k of S.others()) { const q = rt[k]; if (q && q.recent.length) { S.rtt = Math.max(S.rtt, q.rtt); S.rttLow = Math.max(S.rttLow, Math.min(...q.recent)); } }
  };
  const forget = (k) => { if (k === undefined) for (const q in rt) delete rt[q]; else delete rt[k]; tally(); };
  setInterval(() => { if (S.on && S.peer && !S.away) S.send({ t: 'ping', n: performance.now() }); }, 500);
  S.sub('ping', (m) => S.send({ t: 'pong', n: m.n, to: m.s }));
  S.sub('pong', (m) => {
    const ms = performance.now() - m.n;
    if (m.to !== S.seat || !(ms >= 0 && ms < 60000)) return;
    const q = rt[m.s] || (rt[m.s] = { rtt: 0, recent: [] });
    q.recent.push(ms); if (q.recent.length > 10) q.recent.shift();
    q.rtt = q.rtt ? q.rtt + (ms - q.rtt) * 0.25 : ms;
    tally();
  });
  // heartbeat with the relay itself: a line that has gone silent for 7 s is dead even if nothing closed it
  let beat = 0;
  setInterval(() => {
    const now = performance.now(), late = now - beat > 3500;
    beat = now;
    if (!S.on || S.away || !ws) return;
    if (late) heard = now;                                   // this page was busy (a load, a hidden tab), not the line
    if (now - heard > 7000) return dropped(ws);
    if (ws.readyState === 1) ws.send('{"t":"hb"}');
  }, 2000);
  addEventListener('pagehide', () => { if (ws && ws.readyState === 1) ws.send('{"t":"bye"}'); });   // closing the page = leaving

  const detach = (w) => { w.onclose = w.onerror = w.onmessage = null; try { w.close(); } catch {} };
  S.leave = () => {
    const w = ws;
    ws = null; key = null; clearTimeout(redial);
    Object.assign(S, { on: false, seat: -1, host: false, peer: false, away: false, seats: [], awaySeats: [] }); forget();
    for (const t in kept) delete kept[t];
    if (w) { if (w.readyState === 1) w.send('{"t":"bye"}'); detach(w); }
  };
  const end = (why) => { S.leave(); fire('ended', why); };
  /** Who is here, from a hello: seats / awaySeats (events for whoever came or went while this side was not listening). */
  function roster(list, quiet) {
    const was = S.seats, now = list.map((q) => q.seat).sort((a, b) => a - b);
    S.seats = now; S.awaySeats = list.filter((q) => q.away).map((q) => q.seat); S.peer = now.length > 1;
    if (quiet) return true;
    for (const k of was) if (!now.includes(k)) { forget(k); fire('peer', { seat: k, on: false }); if (k === 0 && S.seat !== 0) { end('host'); return false; } }
    for (const k of now) if (!was.includes(k)) fire('peer', { seat: k, on: true });
    return true;
  }
  /** A message from the relay or another player, once the seat is ours. */
  function got(m) {
    if (m.t === 'peer') {
      S.seats = S.seats.filter((k) => k !== m.seat); S.awaySeats = S.awaySeats.filter((k) => k !== m.seat);
      if (m.on) S.seats = [...S.seats, m.seat].sort((a, b) => a - b); else forget(m.seat);
      S.peer = S.seats.length > 1;
      fire('peer', { seat: m.seat, on: !!m.on });
      if (!m.on && m.seat === 0) end('host');
    }
    else if (m.t === 'link') { S.link = m.url || null; fire('link', S.link); }
    else if (m.t === 'away') { if (!S.awaySeats.includes(m.seat)) S.awaySeats.push(m.seat); forget(m.seat); fire('away', m.seat); }
    else if (m.t === 'back') { S.awaySeats = S.awaySeats.filter((k) => k !== m.seat); again({ mine: false }); }
    else if (m.t !== 'hb') fire(m.t, m);
  }
  /** A line is whole again (mine or another player's): what must not be missed goes out again. */
  function again(info) {
    for (const t in kept) S.send(kept[t]);
    fire('resume', info);
  }
  const listen = (w) => {
    w.onmessage = (e) => { if (ws !== w) return; heard = performance.now(); let m; try { m = JSON.parse(e.data); } catch { return; } got(m); };
    w.onclose = w.onerror = () => dropped(w);
  };
  /** My line dropped: redial the seat (the relay holds it) every 1.5 s, for 40 s. */
  function dropped(w) {
    if (ws !== w || !S.on) return;
    detach(w); ws = null;
    S.away = true; forget(); fire('away', S.seat);
    const t0 = performance.now();
    const dial = () => {
      if (!S.on || !S.away) return;
      if (performance.now() - t0 > 40000) return end('lost');
      let n, settled = false;
      const retry = () => { if (settled) return; settled = true; detach(n); if (S.on && S.away) redial = setTimeout(dial, 1500); };
      try { n = new WebSocket(`${URL0()}?seat=${S.seat}&key=${key}`); } catch { redial = setTimeout(dial, 1500); return; }
      n.onerror = n.onclose = retry;
      n.onmessage = (e) => {
        let m; try { m = JSON.parse(e.data); } catch { return; }
        if (settled || !S.on || !S.away) return;
        settled = true;
        if (m.t !== 'hello' || !m.back) { detach(n); return end('lost'); }      // the seat is gone (held too long, relay restarted)
        ws = n; heard = performance.now(); listen(n);
        S.away = false; S.link = m.link || null;
        if (roster(m.seats || [])) again({ mine: true, have: m.have });
      };
      setTimeout(retry, 5000);                               // no answer: this attempt is dead too
    };
    dial();
  }
  /** Dev / tests: cut the line as a network drop would. */
  S.drop = () => { if (ws) dropped(ws); };

  S.join = () => new Promise((res, rej) => {
    S.leave();
    let w, done = false;
    const fail = (why) => { if (!done) { done = true; if (ws === w) { ws = null; detach(w); } rej(new Error(why)); } };
    try { w = ws = new WebSocket(URL0()); } catch { return rej(new Error('offline')); }
    w.onerror = w.onclose = () => fail('offline');
    w.onmessage = (e) => {
      if (ws !== w || done) return;
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === 'full') return fail(m.why === 'busy' ? 'busy' : 'full');
      if (m.t !== 'hello') return;
      done = true; key = m.key; heard = performance.now();
      Object.assign(S, { on: true, seat: m.seat, host: m.seat === 0, max: m.max || 4, urls: m.urls || [], link: m.link || null });
      roster(m.seats || [], true);
      listen(w); res();
    };
  });
  return S;
}
