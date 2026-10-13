// Anonymous's kit (contract: src/chars/index.js) — the hidden fighter: Connector behind a Guy Fawkes mask. It is
// Connector's kit (../connector/: the same moves, clips, Overclock and effects) with every dial turned up, and the mask on
// the jelly, on its three clones and on the hundred-fold giant:
//   reach   every hitbox ×1.35 (ranges, line lengths and widths — its own, the giant's and the clones')
//   attack  every blow ×1.25
//   speed   the run and the dive roll ×1.25 (kit.run, hero/locomotion.js), lunges and the giant's hops with them; faster clones
//   defence it takes 0.7 of a blow (kit.guard, hero/hero.js)
import { CONNECTOR_KIT } from '../connector/kit.js';
import { createConnectorModel } from '../connector/model.js';
import { createMusou, CONNECTOR_MUSOU, CLONE } from '../connector/musou.js';

export const BOOST = { reach: 1.35, dmg: 1.25, run: 1.25, guard: 0.7 };
const r2 = (v) => Math.round(v * 100) / 100;
/** A hit record with Anonymous's reach and punch. */
const boost = (h) => {
  const o = { ...h, dmg: Math.round(h.dmg * BOOST.dmg) };
  for (const k of ['range', 'len', 'width']) if (h[k]) o[k] = r2(h[k] * BOOST.reach);
  return o;
};

const MOVES = Object.fromEntries(Object.entries(CONNECTOR_KIT.moves).map(([id, m]) => [id, { ...m,
  lunge: m.lunge.map(([a, b, d, e]) => [a, b, r2(d * BOOST.run), e]), hits: m.hits.map(boost) }]));

const M = { ...CONNECTOR_MUSOU, hopLen: r2(CONNECTOR_MUSOU.hopLen * BOOST.run), hopR: r2(CONNECTOR_MUSOU.hopR * BOOST.reach), spinR: r2(CONNECTOR_MUSOU.spinR * BOOST.reach),
  waveR: r2(CONNECTOR_MUSOU.waveR * BOOST.reach), hopHit: boost(CONNECTOR_MUSOU.hopHit), spinHit: boost(CONNECTOR_MUSOU.spinHit), waveHit: boost(CONNECTOR_MUSOU.waveHit) };
const K = { ...CLONE, speed: r2(CLONE.speed * BOOST.run), reach: r2(CLONE.reach * BOOST.reach), hit: boost(CLONE.hit), pop: boost(CLONE.pop) };

export const ANONYMOUS_KIT = {
  ...CONNECTOR_KIT,
  moves: MOVES,
  model: (rig) => createConnectorModel(rig, true),
  createMusou: (game) => createMusou(game, M, K),
  masked: true, reach: BOOST.reach, run: BOOST.run, guard: BOOST.guard,
};
