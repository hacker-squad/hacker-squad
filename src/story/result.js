// Battle result (#result): the battlefield stays frozen behind a dark wash; the hero's portrait and a big VICTORY /
// KNOCKED OUT, then the tallies count up one by one (K.O.s, max chain, time, damage taken), the rank stamps in (win:
// S / A / B / C, rules in index.js rank()), and the stage's closing lines for this fighter (story/chapters.js: EPILOGUE
// { <char id>: [lines] }; DEFEAT: a line with {name} = the hero).
// Win → CONTINUE (title). Defeat → RETRY (the loading card, then straight back into the battle) or TITLE.
// Every exit is a wipe (ui lane menu.js). ctx.art (the fighter's key-art still, main.js snapArt) fills the right side.
// Keys (menu.js createNav, + gamepad): Enter / Space press the focused button (← → move between them), Esc → title.
// Co-op (ctx.coop = the session): the tallies are the team's, with a K.O. row per fighter; PLAY AGAIN takes every player
// back to the lobby with their seats (the others are told: `again`), where the host picks the next mission and difficulty
// (ui/lobby.js); TITLE leaves the session.
// ctx in: { win, stats: { kos, time, hpMax, maxChain, dmg, rank? }, mode, char, chapter, diff (core/difficulty.js tier) }.
import { CHARS, DEFAULT_CHAR, paintPortrait } from '../chars/index.js';
import { resolveChapter } from './chapters.js';
import { inkWipe, afterWipe, createNav } from '../ui/menu.js';

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function createResult(el, flow) {
  let ctx = {}, raf = 0, gone = false;
  // one exit per visit; pressed while this screen is still being uncovered it is queued (afterWipe), not dropped
  const leave = (mid) => { if (!gone) { gone = true; afterWipe(() => inkWipe(mid)); } };
  const quit = () => leave(() => { ctx.coop?.leave(); return flow.go('title'); });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'again') { ctx.coop.send({ t: 'again' }, true); leave(() => flow.go('lobby', { coop: ctx.coop, diffId: ctx.diffId, chapter: ctx.chapter })); }
    else if (b.dataset.act === 'retry') leave(() => flow.go('loading', { mode: ctx.mode, char: ctx.char, chapter: ctx.chapter, art: ctx.art, retry: true }));
    else quit();
  });
  const nav = createNav({
    move: (d) => { const bs = [...el.querySelectorAll('button')], i = bs.indexOf(document.activeElement); bs[(i + d + bs.length) % bs.length]?.focus(); },
    ok: () => (el.querySelector('button:focus') || el.querySelector('button'))?.click(),
    back: quit,
  });

  return {
    enter(c) {
      ctx = c; gone = false;
      const { win, stats: s } = c, ch = CHARS[c.char] || CHARS[DEFAULT_CHAR], CH = resolveChapter(c.chapter, ch.id), E = CH.EPILOGUE || {};
      const epi = E[ch.id] || Object.values(E)[0] || [], T = CH.title;
      const lose = (CH.DEFEAT || '{name} is knocked out.').replace('{name}', ch.name);
      const rows = [
        ['K.O. count', s.kos, (v) => v],
        ...(c.coop && s.by ? s.by.map((q) => [`· ${(CHARS[q.char] || ch).name}`, q.kos, (v) => v]) : []),
        ['Max chain', s.maxChain, (v) => v],
        ['Time', s.time, mmss],
        ['Damage taken', Math.round(s.dmg || 0), (v) => v],
      ];
      el.className = `scr ${win ? 'win' : 'lose'}${c.art ? ' art' : ''}`;
      el.style.setProperty('--art', c.art ? `url("${c.art}")` : 'none');
      el.style.setProperty('--acc', ch.accent);
      el.innerHTML = `<div class="rs">
        <div class="rs-head"><div class="rs-badge"><canvas width="20" height="20"></canvas></div>
          <div><small>${T.small} · ${T.name} · ${T.sub}</small><h2>${win ? 'Victory' : 'Knocked out'}</h2>
            <em>${c.coop && s.by ? s.by.map((q) => (CHARS[q.char] || ch).name).join(', ').replace(/, ([^,]*)$/, ' & $1') : ch.name} ${c.coop && s.by && s.by.length > 1 ? (win ? T.win : T.lose) : win ? T.wins : T.loses}</em>${c.diff ? `<span class="rs-dif">${c.diff.name}</span>` : ''}</div></div>
        <div class="rs-body">
          <table class="rs-stats">${rows.map(([n], i) => `<tr style="--i:${i}"><th>${n}</th><td>0</td></tr>`).join('')}</table>
          ${win && s.rank ? `<div class="rs-rank r${s.rank}"><span>Rank</span><b>${s.rank}</b></div>` : ''}
        </div>
        <div class="rs-epi">${win ? epi.map((l) => `<p>${l}</p>`).join('') : `<p>${lose}</p>`}</div>
        <div class="rs-btns">${c.coop ? '<button data-act="again">Play again</button><button data-act="title" class="sub">Title</button>' : win
          ? '<button data-act="title">Continue</button>'
          : '<button data-act="retry">Retry</button><button data-act="title" class="sub">Title</button>'}</div>
      </div>
      <footer class="ui-foot">${win && !c.coop ? '' : '<span><kbd>←</kbd><kbd>→</kbd>Select</span>'}
        <span><kbd>Enter</kbd>Confirm</span><span><kbd>Esc</kbd>Title</span></footer>`;
      paintPortrait(el.querySelector('canvas'), ch);
      // tallies count up in turn (0.7 s each, 0.35 s apart, after the title lands)
      const tds = [...el.querySelectorAll('.rs-stats td')], t0 = performance.now() + 700;
      const tick = (now) => {
        let busy = false;
        rows.forEach(([, v, fmt], i) => {
          const u = Math.max(0, Math.min(1, (now - t0 - i * 350) / 700));
          if (u < 1) busy = true;
          tds[i].textContent = fmt(Math.round(v * (1 - (1 - u) ** 3)));
        });
        if (busy) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      setTimeout(() => { if (!el.hidden) el.querySelector('button')?.focus({ preventScroll: true }); }, 50);
      nav.start();
    },
    exit() { cancelAnimationFrame(raf); nav.stop(); },
  };
}
