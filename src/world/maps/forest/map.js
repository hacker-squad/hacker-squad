// The Forest — map definition for the map registry (src/world/map.js: format and API). One valley, three clearings in a
// row along +Z, joined by two gaps in the wolves' log palisades. Flat ground (h 0) on the walk field; the banks round it
// rise into the trees (render side). The clearings' edges are irregular (edge noise): a forest floor, not a room. The
// Battlefield is centred on the origin (the practice arena spawns its field round the origin).
//   meadow  Village Meadow     z -182 … -112   56 m wide   flowers, the village fence and huts behind the start
//   woods   Whispering Woods   z -108 …  -40   48 m wide   six great oaks and two boulders stand in the way (carved)
//   field   The Battlefield    z  -36 …   40   64 m wide   the wolves' war camp: four burnt trees, the war totem at the far end
// Gates: 'gateA' (meadow → woods, z ≈ -110) and 'gateB' (woods → field, z ≈ -39), 18 m gaps closed by log barricades.
const sq = (x, z, r) => [x - r, z - r, x + r, z + r];
const OAKS = [[-13, -97], [13, -91], [-13, -79], [13, -73], [-13, -61], [13, -55]].map(([x, z]) => sq(x, z, 1.3));
const BOULDERS = [[-5.5, -86], [6, -64]].map(([x, z]) => sq(x, z, 1.1));
const STUMPS = [[-18, -16], [18, -16], [-18, 16], [18, 16]].map(([x, z]) => sq(x, z, 1));     // burnt trees on the battlefield
const TOTEM = [-5, 27, 5, 37];                                      // the wolves' war totem and its bonfire
const HUTS = [[-28, -176, -24.4, -164], [24.4, -160, 28, -148], [-28, -140, -24.4, -128], [24.4, -132, 28, -120]];   // village huts and hay on the meadow's edge

export default {
  id: 'forest',
  name: 'The Forest',
  zones: [
    { id: 'meadow', name: 'Village Meadow', x: 0, z: -147, w: 56, d: 70 },
    { id: 'woods', name: 'Whispering Woods', x: 0, z: -74, w: 48, d: 68 },
    { id: 'field', name: 'The Battlefield', x: 0, z: 2, w: 64, d: 76 },
  ],
  grid: [-64, -200, 64, 56],
  pieces: [
    { id: 'meadow', rect: [-26.4, -180.6, 26.4, -112], h: 0, edge: 1.2 },
    { id: 'gateA', rect: [-9, -114, 9, -106], h: 0 },
    { id: 'woods', rect: [-22.2, -108, 22.2, -40], h: 0, edge: 1.2 },
    { id: 'gateB', rect: [-9, -42, 9, -34], h: 0 },
    { id: 'field', rect: [-30.2, -36, 30.2, 38.6], h: 0, edge: 1.4 },
  ],
  carve: [...OAKS, ...BOULDERS, ...STUMPS, TOTEM, ...HUTS],
  propCarve: [...OAKS, ...BOULDERS, ...STUMPS, TOTEM, ...HUTS],
  route: [[0, -180], [0, -147], [0, -110], [0, -74], [0, -38], [0, 0], [0, 24]],
  gates: {
    gateA: { rect: [-10, -112, 10, -108], open: true, name: 'the first barricade' },
    gateB: { rect: [-10, -41, 10, -37], open: true, name: 'the second barricade' },
  },
  spawn: { story: { x: 0, z: -174, yaw: 0, tilt: -0.06 }, free: { x: 0, z: 0, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -12, n: 16, cols: 4 },
  stage: 'meadow',
  hq: [0, 30], hqName: 'CAMP',
  // render data shared with the world builder (./world.js)
  oaks: OAKS, boulders: BOULDERS, stumps: STUMPS, totem: TOTEM, huts: HUTS,
  /** Minimap: the dirt track, the great oaks and boulders, the burnt trees, the war totem, the village huts. */
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(214,178,110,0.16)';
    g.fillRect(X(1.5), Y(40), 3 * PPM, 222 * PPM);
    const blocks = (list, c) => { g.fillStyle = c; for (const r of list) g.fillRect(X(r[2]), Y(r[3]), (r[2] - r[0]) * PPM, (r[3] - r[1]) * PPM); };
    blocks(OAKS, 'rgba(120,210,90,0.7)');
    blocks(BOULDERS, 'rgba(170,176,180,0.6)');
    blocks(STUMPS, 'rgba(120,96,80,0.8)');
    blocks([TOTEM], 'rgba(255,110,60,0.85)');
    blocks(HUTS, 'rgba(232,214,160,0.5)');
  },
};
