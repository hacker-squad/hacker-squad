// The score: one piece per place, synthesised offline (bank.js helpers) the first time it is needed and cached.
//   title      the menus and the co-op lobby — slow synthwave: a pad, a pulsing bass, a plucked arpeggio (A minor, 96 BPM)
//   warehouse  the Hacker Championship — electro: four-on-the-floor, an acid bass line, a chip arpeggio, a saw lead
//              (D minor, 128 BPM); its air is the hall: ventilation, mains hum, data chirps, the crowd round the ring
//   forest     the Village Defense — a folk dance: a frame drum, shaker and tambourine, a plucked lute, a low drone and a
//              wooden flute (D dorian, 112 BPM); its air is the wood: wind in the leaves, birds, the flock, far howls
// A score is layers that loop together — drums, music (harmony + bass), lead (the tune) — plus the place's ambience bed
// and two jingles (win / lose). audio.js mixes the layers: on a menu the tune plays plainly; in a battle the drums and
// the lead swell with the fighting (`mix`: per layer [quiet, added at full intensity]; the layers are peak-normalised,
// so these gains also even out how dense each one is) and a boss on the field holds them up. Layers of one score are the same number of samples long and start together, so they stay locked.
import { bake, bakeLoop, xfade, osc, nz, filt, gain, env, perc, pts, shaper, pan, smp, rnd, pick } from './bank.js';

const SR = 32000;                                           // the music's own rate: bright enough for hats, half the bake of 48 kHz
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** 'D4' / 'A#3' / 'Bb2' → Hz. */
const hz = (s) => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); return 440 * 2 ** ((SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12 - 69) / 12); };

// ---- instruments: (oc, dst, t, …)
function kick(oc, d, t, g = 1, soft = false) {
  const o = osc(oc, 'sine', t, 0.4); pts(o.frequency, t, [[0, soft ? 110 : 165], [0.06, 52], [0.3, 42]], true);
  o.connect(perc(oc, t, 0.002, soft ? 0.22 : 0.3, g)).connect(shaper(oc, soft ? 1.2 : 2.2)).connect(d);
  if (!soft) nz(oc, t, 0.01).connect(filt(oc, 'highpass', 2500)).connect(perc(oc, t, 0.0005, 0.005, g * 0.35)).connect(d);
}
function clap(oc, d, t, g) {
  for (const dt of [0, 0.011, 0.023]) nz(oc, t + dt, 0.2).connect(filt(oc, 'bandpass', 1300, 1.1)).connect(perc(oc, t + dt, 0.001, dt === 0.023 ? 0.13 : 0.012, g)).connect(d);
}
function hat(oc, d, t, g, open = false) {
  nz(oc, t, open ? 0.3 : 0.06).connect(filt(oc, 'highpass', 7500, 0.9)).connect(perc(oc, t, 0.001, open ? 0.2 : 0.035, g)).connect(d);
}
function acid(oc, d, t, f, len, g, acc) {                   // saw through a squelching resonant lowpass
  const lp = filt(oc, 'lowpass', f * 3, 9); pts(lp.frequency, t, [[0, f * (acc ? 16 : 9)], [acc ? 0.16 : 0.1, f * 2.2]], true);
  const e = env(oc, t, [[0, 0], [0.004, g], [len * 0.8, g * 0.7], [len, 0]]);
  osc(oc, 'sawtooth', t, len + 0.02, f).connect(lp); osc(oc, 'square', t, len + 0.02, f / 2).connect(gain(oc, 0.4)).connect(lp);
  lp.connect(shaper(oc, 2)).connect(e).connect(d);
}
function chip(oc, d, t, f, g, dec = 0.12) {                 // square blip
  osc(oc, 'square', t, dec * 2, f).connect(filt(oc, 'lowpass', 4200)).connect(perc(oc, t, 0.002, dec, g)).connect(d);
}
function saws(oc, d, t, f, len, g, cut = 2600, att = 0.01) {   // three detuned saws: stabs, pads, leads
  const lp = filt(oc, 'lowpass', cut, 0.8), e = env(oc, t, [[0, 0], [att, g], [Math.max(att + 0.01, len * 0.75), g * 0.8], [len, 0]]);
  for (const c of [-11, 0, 12]) { const o = osc(oc, 'sawtooth', t, len + 0.02, f); o.detune.value = c; o.connect(lp); }
  lp.connect(e).connect(d);
}
function lead(oc, d, t, f, len, g) {                        // saw + square with a late vibrato
  const lp = filt(oc, 'lowpass', 3600, 2), e = env(oc, t, [[0, 0], [0.015, g], [len * 0.7, g * 0.75], [len, 0]]);
  const v = osc(oc, 'sine', t, len + 0.02, 5.6), vg = env(oc, t, [[0, 0], [0.12, 0], [Math.max(0.2, len), f * 0.012]]);
  v.connect(vg);
  for (const [ty, c, k] of [['sawtooth', -7, 1], ['square', 6, 0.5]]) { const o = osc(oc, ty, t, len + 0.02, f); o.detune.value = c; vg.connect(o.frequency); o.connect(gain(oc, k)).connect(lp); }
  lp.connect(e).connect(d);
}
function pluck(oc, d, t, f, g, dec = 0.5) {                 // a gut string: bright at the pick, mellow in the ring
  const lp = filt(oc, 'lowpass', 5000, 1); pts(lp.frequency, t, [[0, Math.min(9000, f * 12)], [0.12, f * 2.5], [dec, f * 1.2]], true);
  osc(oc, 'sawtooth', t, dec * 1.5, f).connect(gain(oc, 0.5)).connect(lp); osc(oc, 'triangle', t, dec * 1.5, f * 2.003).connect(gain(oc, 0.3)).connect(lp);
  lp.connect(perc(oc, t, 0.002, dec, g)).connect(d);
  nz(oc, t, 0.01).connect(filt(oc, 'bandpass', f * 4, 2)).connect(perc(oc, t, 0.0005, 0.006, g * 0.4)).connect(d);
}
function flute(oc, d, t, f, len, g) {                       // a wooden whistle: breath first, then the note
  const e = env(oc, t, [[0, 0], [0.05, g], [Math.max(0.06, len * 0.8), g * 0.85], [len, 0]]);
  const v = osc(oc, 'sine', t, len + 0.02, 5.2), vg = env(oc, t, [[0, 0], [0.15, 0], [Math.max(0.25, len), f * 0.01]]);
  v.connect(vg);
  for (const [r, k] of [[1, 1], [2, 0.22], [3, 0.08]]) { const o = osc(oc, 'sine', t, len + 0.02, f * r); if (r === 1) pts(o.frequency, t, [[0, f * 0.97], [0.04, f]], true); vg.connect(gain(oc, r)).connect(o.frequency); o.connect(gain(oc, k)).connect(e); }
  nz(oc, t, len + 0.02).connect(filt(oc, 'bandpass', f * 2, 1.5)).connect(env(oc, t, [[0, 0], [0.015, 0.5], [0.08, 0.1], [len, 0]])).connect(e);
  e.connect(d);
}
function pizz(oc, d, t, f, g) {
  osc(oc, 'sine', t, 0.5, f).connect(perc(oc, t, 0.003, 0.32, g)).connect(d);
  osc(oc, 'triangle', t, 0.3, f * 2).connect(perc(oc, t, 0.002, 0.12, g * 0.4)).connect(d);
}
function frameDrum(oc, d, t, g, hi = false) {               // goatskin on a hoop: a round thump, a tap near the rim
  const o = osc(oc, 'sine', t, 0.4); pts(o.frequency, t, [[0, hi ? 210 : 125], [hi ? 0.05 : 0.12, hi ? 150 : 72]], true);
  o.connect(perc(oc, t, 0.002, hi ? 0.09 : 0.2, g)).connect(shaper(oc, 1.5)).connect(d);
  nz(oc, t, 0.06).connect(filt(oc, 'bandpass', hi ? 1500 : 650, 1)).connect(perc(oc, t, 0.001, 0.025, g * 0.5)).connect(d);
}
function shaker(oc, d, t, g) { nz(oc, t, 0.09).connect(filt(oc, 'highpass', 5500, 0.8)).connect(perc(oc, t, 0.012, 0.035, g)).connect(d); }
function tamb(oc, d, t, g) {
  for (let i = 0; i < 5; i++) osc(oc, 'sine', t, 0.2, rnd(6200, 11000)).connect(perc(oc, t + i * 0.004, 0.001, rnd(0.06, 0.13), g / 5)).connect(d);
  nz(oc, t, 0.15).connect(filt(oc, 'highpass', 6500)).connect(perc(oc, t, 0.001, 0.08, g * 0.6)).connect(d);
}
/** A tune: [[bar (from 1), beat, beats long, note], …] played by `voice` (oc, d, t, hz, seconds, gain). */
function tune(oc, d, notes, bar, beat, voice, g, hold = 0.95) {
  for (const [b, at, len, note] of notes) voice(oc, d, (b - 1) * bar + at * beat, hz(note), len * beat * hold, g);
}
const widen = (oc, d, p) => { const n = pan(oc, p); n.connect(d); return n; };

// ---- title: A minor, 96 BPM, 8 bars (20 s)
function title() {
  const beat = 60 / 96, bar = beat * 4, len = bar * 8, s16 = beat / 4;
  const CH = [['A2', ['A3', 'C4', 'E4']], ['F2', ['F3', 'A3', 'C4']], ['C3', ['G3', 'C4', 'E4']], ['G2', ['G3', 'B3', 'D4']],
    ['A2', ['A3', 'C4', 'E4']], ['F2', ['F3', 'A3', 'C4']], ['C3', ['G3', 'C4', 'E4']], ['E2', ['G#3', 'B3', 'E4']]];
  const TUNE = [[1, 0, 2, 'E5'], [1, 2, 1, 'C5'], [1, 3, 1, 'A4'], [2, 0, 3, 'C5'], [2, 3, 1, 'A4'], [3, 0, 2, 'G4'], [3, 2, 2, 'E5'], [4, 0, 4, 'D5'],
    [5, 0, 2, 'E5'], [5, 2, 1, 'A5'], [5, 3, 1, 'G5'], [6, 0, 3, 'F5'], [6, 3, 1, 'C5'], [7, 0, 2, 'E5'], [7, 2, 2, 'G5'], [8, 0, 4, 'E5']];
  return {
    len, tail: 2,
    drums: (oc, d) => { for (let b = 0; b < 32; b++) { const t = b * beat; kick(oc, d, t, b % 4 === 0 ? 0.8 : 0.5, true); hat(oc, d, t + beat / 2, 0.12); if (b % 4 === 3) hat(oc, d, t + beat * 0.75, 0.07); if (b % 2) clap(oc, d, t, 0.14); } },
    music: (oc, d) => {
      const L = widen(oc, d, -0.5), R = widen(oc, d, 0.5);
      CH.forEach(([root, tri], bi) => {
        const t = bi * bar;
        tri.forEach((nt, j) => saws(oc, j % 2 ? L : R, t, hz(nt), bar * 1.25, 0.11, 1100, 0.5));        // pad, overlapping the next bar
        for (let i = 0; i < 8; i++) acid(oc, d, t + i * beat / 2, hz(root), beat * 0.4, i % 2 ? 0.16 : 0.26, false);
        const arp = [0, 1, 2, 1, 2, 1, 0, 1];
        for (let i = 0; i < 16; i++) { const f = hz(tri[arp[i % 8]]) * (i % 8 > 3 ? 4 : 2), tt = t + i * s16; chip(oc, i % 2 ? L : R, tt, f, 0.09); chip(oc, i % 2 ? R : L, tt + s16 * 3, f, 0.035); }
      });
    },
    lead: (oc, d) => tune(oc, d, TUNE, bar, beat, (o, dd, t, f, l, g) => { saws(o, dd, t, f, l, g, 2200, 0.06); saws(o, dd, t + beat * 0.75, f, l * 0.6, g * 0.3, 1500, 0.06); }, 0.2),
    jingle: () => null,
    mix: { menu: { drums: 0.45, music: 0.5, lead: 0.3 }, battle: { drums: [0.3, 0.3], music: [0.3, 0.1], lead: [0.2, 0.1] } },
  };
}

// ---- warehouse: D minor, 128 BPM, 8 bars (15 s)
function warehouse(cast) {
  const beat = 60 / 128, bar = beat * 4, len = bar * 8, s16 = beat / 4;
  const CH = [['D2', ['D4', 'F4', 'A4']], ['D2', ['D4', 'F4', 'A4']], ['Bb1', ['D4', 'F4', 'Bb4']], ['C2', ['E4', 'G4', 'C5']],
    ['D2', ['D4', 'F4', 'A4']], ['D2', ['F4', 'A4', 'D5']], ['Bb1', ['D4', 'F4', 'Bb4']], ['A1', ['C#4', 'E4', 'A4']]];
  const BASS = 'x.xx.xX.x.xx.xXx';                         // 16ths: x root, X an octave up (accented)
  const TUNE = [[1, 0, 1.5, 'D5'], [1, 1.5, 0.5, 'F5'], [1, 2, 1, 'A5'], [1, 3, 0.5, 'G5'], [1, 3.5, 0.5, 'F5'], [2, 0, 1, 'E5'], [2, 1, 1, 'D5'], [2, 2, 2, 'A4'],
    [3, 0, 1.5, 'D5'], [3, 1.5, 0.5, 'F5'], [3, 2, 1, 'Bb5'], [3, 3, 1, 'A5'], [4, 0, 1, 'G5'], [4, 1, 1, 'E5'], [4, 2, 1, 'C5'], [4, 3, 1, 'E5'],
    [5, 0, 1.5, 'A5'], [5, 1.5, 0.5, 'G5'], [5, 2, 1, 'F5'], [5, 3, 1, 'D5'], [6, 0, 0.5, 'F5'], [6, 0.5, 0.5, 'G5'], [6, 1, 1, 'A5'], [6, 2, 2, 'D6'],
    [7, 0, 1, 'Bb5'], [7, 1, 1, 'A5'], [7, 2, 1, 'G5'], [7, 3, 1, 'F5'], [8, 0, 1.5, 'E5'], [8, 1.5, 0.5, 'C#5'], [8, 2, 1, 'E5'], [8, 3, 1, 'A5']];
  return {
    len, tail: 1.2,
    drums: (oc, d) => {
      for (let b = 0; b < 32; b++) {
        const t = b * beat;
        kick(oc, d, t, 1);
        if (b % 2) clap(oc, d, t, 0.5);
        for (let i = 0; i < 4; i++) hat(oc, widen(oc, d, i % 2 ? 0.3 : -0.3), t + i * s16, i === 2 ? 0.3 : 0.13, i === 2);
        if (b % 8 === 7) for (let i = 0; i < 4; i++) clap(oc, d, t + i * s16, 0.15 + i * 0.08);            // a roll into the next phrase
      }
    },
    music: (oc, d) => {
      const L = widen(oc, d, -0.6), R = widen(oc, d, 0.6);
      CH.forEach(([root, tri], bi) => {
        const t = bi * bar, f = hz(root);
        [...BASS].forEach((c, i) => { if (c !== '.') acid(oc, d, t + i * s16, c === 'X' ? f * 2 : f, s16 * 0.9, c === 'X' ? 0.42 : 0.36, c === 'X' || i === 0); });
        const arp = [0, 1, 2, 1];
        for (let i = 0; i < 16; i++) { const fa = hz(tri[arp[i % 4]]) * (i % 8 > 3 ? 2 : 1), tt = t + i * s16; chip(oc, i % 2 ? L : R, tt, fa, 0.085, 0.09); chip(oc, i % 2 ? R : L, tt + s16 * 3, fa, 0.03, 0.09); }
      });
    },
    lead: (oc, d) => {
      const L = widen(oc, d, -0.4), R = widen(oc, d, 0.4);
      CH.forEach(([, tri], bi) => { for (const at of [1.5, 3.5]) tri.forEach((nt, j) => saws(oc, j % 2 ? L : R, bi * bar + at * beat, hz(nt), beat * 0.4, 0.09, 3000)); });   // off-beat stabs
      tune(oc, d, TUNE, bar, beat, lead, 0.2);
    },
    bed: (oc, d) => {                                       // the hall: air handlers, mains hum, data chirps, the crowd round the ring
      const xf = xfade(16, 2);
      nz(oc, 0, 18, 0.3).connect(filt(oc, 'lowpass', 140)).connect(xf(oc)).connect(gain(oc, 0.5)).connect(d);
      nz(oc, 0, 18).connect(filt(oc, 'bandpass', 900, 0.4)).connect(xf(oc)).connect(gain(oc, 0.08)).connect(d);
      for (const f of [100, 200, 300]) osc(oc, 'sine', 0, 18, f).connect(xf(oc)).connect(gain(oc, 0.03 * 100 / f)).connect(d);
      const far = filt(oc, 'lowpass', 3000); far.connect(d);
      for (let i = 0; i < 46; i++) smp(oc, far, pick(cast.crowd), rnd(0, 16), rnd(0.85, 1.15), rnd(0.25, 0.9), rnd(-1, 1));
      for (let i = 0; i < 60; i++) { const t = rnd(0, 16), f = pick([1760, 2093, 2637, 3136, 3520]); osc(oc, 'square', t, 0.05, f).connect(perc(oc, t, 0.001, 0.02, rnd(0.008, 0.025))).connect(pan(oc, rnd(-0.9, 0.9))).connect(d); }
      for (let i = 0; i < 160; i++) { const t = rnd(0, 16); nz(oc, t, 0.014).connect(filt(oc, 'bandpass', rnd(2200, 4200), 2)).connect(perc(oc, t, 0.0005, rnd(0.004, 0.01), rnd(0.03, 0.09))).connect(pan(oc, rnd(-0.9, 0.9))).connect(d); }   // keys
    },
    jingle: (win) => (oc, d) => {                           // chip fanfare up in D major / a slide down in D minor
      const seq = win ? [['D5', 0, 0.12], ['F#5', 0.12, 0.12], ['A5', 0.24, 0.12], ['D6', 0.36, 0.3], ['A5', 0.66, 0.12], ['D6', 0.78, 0.9]] : [['D5', 0, 0.3], ['C5', 0.3, 0.3], ['Bb4', 0.6, 0.3], ['A4', 0.9, 1.1]];
      for (const [nt, t, l] of seq) { lead(oc, d, t, hz(nt), l, 0.5); chip(oc, d, t, hz(nt) * 2, 0.2, 0.1); acid(oc, d, t, hz(nt) / 4, l, 0.5, true); }
      if (win) { kick(oc, d, 0, 1); kick(oc, d, 0.78, 1); clap(oc, d, 0.78, 0.5); for (const nt of ['D4', 'F#4', 'A4']) saws(oc, d, 0.78, hz(nt), 1.3, 0.2, 2800); }
    },
    mix: { menu: { drums: 0.12, music: 0.36, lead: 0.55, bed: 0.1 }, battle: { drums: [0.14, 0.34], music: [0.22, 0.14], lead: [0.1, 0.5], bed: [0.16, 0.3] } },
  };
}

// ---- forest: D dorian, 112 BPM, 8 bars (17.1 s)
function forest(cast) {
  const beat = 60 / 112, bar = beat * 4, len = bar * 8, e8 = beat / 2;
  const CH = [['D2', 'D3 A3 D4 F4 A4 F4 D4 A3'], ['C2', 'C3 G3 C4 E4 G4 E4 C4 G3'], ['D2', 'D3 A3 D4 F4 A4 F4 D4 A3'], ['A1', 'A2 E3 A3 C4 E4 C4 A3 E3'],
    ['F2', 'F3 C4 F4 A4 C5 A4 F4 C4'], ['C2', 'C3 G3 C4 E4 G4 E4 C4 G3'], ['D2', 'D3 A3 D4 F4 C3 G3 C4 E4'], ['D2', 'D3 A3 D4 F4 A4 F4 D4 A3']];
  const TUNE = [[1, 0, 1, 'A4'], [1, 1, 1, 'D5'], [1, 2, 0.5, 'E5'], [1, 2.5, 0.5, 'F5'], [1, 3, 1, 'E5'], [2, 0, 1.5, 'E5'], [2, 1.5, 0.5, 'D5'], [2, 2, 1, 'C5'], [2, 3, 1, 'G4'],
    [3, 0, 1, 'A4'], [3, 1, 1, 'D5'], [3, 2, 0.5, 'F5'], [3, 2.5, 0.5, 'G5'], [3, 3, 1, 'A5'], [4, 0, 0.5, 'A5'], [4, 0.5, 0.5, 'G5'], [4, 1, 1, 'E5'], [4, 2, 2, 'C5'],
    [5, 0, 1, 'F5'], [5, 1, 1, 'A5'], [5, 2, 1.5, 'C6'], [5, 3.5, 0.5, 'A5'], [6, 0, 1, 'G5'], [6, 1, 1, 'E5'], [6, 2, 1, 'G5'], [6, 3, 0.5, 'E5'], [6, 3.5, 0.5, 'D5'],
    [7, 0, 0.5, 'F5'], [7, 0.5, 0.5, 'E5'], [7, 1, 1, 'D5'], [7, 2, 0.5, 'E5'], [7, 2.5, 0.5, 'D5'], [7, 3, 1, 'C5'], [8, 0, 3, 'D5']];
  const DRUM = 'D..dD.d.D.dDD.dd';                          // 16ths: D the skin, d a tap by the rim
  return {
    len, tail: 1.5,
    drums: (oc, d) => {
      for (let b = 0; b < 8; b++) for (let i = 0; i < 16; i++) {
        const t = b * bar + i * beat / 4, c = DRUM[i];
        if (c === 'D') frameDrum(oc, d, t, i % 8 === 0 ? 1 : 0.75); else if (c === 'd') frameDrum(oc, widen(oc, d, 0.2), t, 0.45, true);
        if (i % 2 === 0) shaker(oc, widen(oc, d, -0.4), t, i % 4 ? 0.22 : 0.12);
        if (i === 4 || i === 12) tamb(oc, widen(oc, d, 0.4), t, 0.3);
      }
    },
    music: (oc, d) => {
      const L = widen(oc, d, -0.35), R = widen(oc, d, 0.35);
      CH.forEach(([root, arp], bi) => {
        const t = bi * bar;
        pizz(oc, d, t, hz(root), 0.5); pizz(oc, d, t + beat * 2, hz(root) * (bi === 6 ? 0.89 : 1.5), 0.35); pizz(oc, d, t + beat * 3.5, hz(root), 0.25);
        arp.split(' ').forEach((nt, i) => pluck(oc, i % 2 ? L : R, t + i * e8, hz(nt), i % 4 ? 0.2 : 0.28));
      });
      const dr = filt(oc, 'lowpass', 700, 0.7), xf = xfade(len, 1.5); dr.connect(xf(oc)).connect(d);           // a hurdy-gurdy drone under it all
      for (const [nt, c] of [['D2', -5], ['D2', 6], ['A2', 0]]) { const o = osc(oc, 'sawtooth', 0, len + 1.5, hz(nt)); o.detune.value = c; o.connect(gain(oc, 0.035)).connect(dr); }
    },
    lead: (oc, d) => { tune(oc, d, TUNE, bar, beat, flute, 0.3); tune(oc, widen(oc, d, 0.5), TUNE.filter(([b]) => b > 4), bar, beat, (o, dd, t, f, l, g) => pluck(o, dd, t, f / 2, g, 0.35), 0.16); },
    bed: (oc, d) => {                                       // the wood: wind in the leaves, birds, the flock, the pack far off
      const xf = xfade(16, 2);
      const wl = filt(oc, 'bandpass', 700, 0.5), wg = gain(oc, 0.3);
      osc(oc, 'sine', 0, 18, 1 / 8).connect(gain(oc, 350)).connect(wl.frequency); osc(oc, 'sine', 0, 18, 1 / 5.33).connect(gain(oc, 0.12)).connect(wg.gain);
      nz(oc, 0, 18).connect(wl).connect(xf(oc)).connect(wg).connect(d);
      const lv = gain(oc, 0.07); osc(oc, 'sine', 0, 18, 1 / 4).connect(gain(oc, 0.05)).connect(lv.gain);
      nz(oc, 0, 18).connect(filt(oc, 'highpass', 4500, 0.7)).connect(xf(oc)).connect(lv).connect(d);          // leaves
      for (let i = 0; i < 22; i++) {                        // birds: a few quick falling whistles each
        const t0 = rnd(0, 15.3), f = rnd(2600, 4600), p = pan(oc, rnd(-0.9, 0.9)), g = rnd(0.02, 0.06), k = 2 + Math.floor(Math.random() * 4); p.connect(d);
        for (let j = 0; j < k; j++) { const t = t0 + j * rnd(0.09, 0.14), o = osc(oc, 'sine', t, 0.1); pts(o.frequency, t, [[0, f * rnd(1, 1.25)], [0.07, f * rnd(0.75, 0.95)]], true); o.connect(perc(oc, t, 0.008, 0.05, g)).connect(p); }
      }
      const far = filt(oc, 'lowpass', 2600); far.connect(d);
      for (let i = 0; i < 26; i++) smp(oc, far, pick(cast.crowd), rnd(0, 13.5), rnd(0.85, 1.1), rnd(0.15, 0.6), rnd(-1, 1));
      for (let i = 0; i < 5; i++) {                         // the flock answers
        const t = rnd(0, 15), b = rnd(300, 380), o = osc(oc, 'sawtooth', t, 0.5, b), bp = filt(oc, 'bandpass', 1700, 2), e = env(oc, t, [[0, 0], [0.04, 0.05], [0.35, 0.04], [0.45, 0]]);
        osc(oc, 'sine', t, 0.5, 10).connect(gain(oc, b * 0.05)).connect(o.frequency); o.connect(bp).connect(e).connect(pan(oc, rnd(-0.8, 0.8))).connect(far);
      }
    },
    jingle: (win) => (oc, d) => {                           // the flute skips up to the tonic / sinks to a low D
      const seq = win ? [['D5', 0, 0.16], ['F#5', 0.16, 0.16], ['A5', 0.32, 0.16], ['D6', 0.48, 0.34], ['B5', 0.82, 0.16], ['D6', 0.98, 1.0]] : [['A4', 0, 0.36], ['G4', 0.36, 0.36], ['F4', 0.72, 0.36], ['D4', 1.08, 1.2]];
      for (const [nt, t, l] of seq) { flute(oc, d, t, hz(nt), l, 0.5); pluck(oc, d, t, hz(nt) / 2, 0.4, 0.5); }
      if (win) { for (const t of [0, 0.48, 0.98]) frameDrum(oc, d, t, 0.9); tamb(oc, d, 0.98, 0.4); for (const nt of ['D3', 'A3', 'F#4']) pluck(oc, d, 0.98, hz(nt), 0.4, 1.2); }
      else pizz(oc, d, 1.08, hz('D2'), 0.7);
    },
    mix: { menu: { drums: 0.12, music: 0.85, lead: 0.2, bed: 0.14 }, battle: { drums: [0.2, 0.45], music: [0.55, 0.3], lead: [0.05, 0.16], bed: [0.2, 0.3] } },
  };
}

const SCORES = { title, warehouse, forest };
const baked = new Map();
/** Bake a score (cached promise): { id, drums, music, lead, bed?, win?, lose?, mix }. cast: the place's enemy voices
 *  (voices.js bakeCast — the ambience is built from them); the title needs none. */
export function bakeScore(id, cast) {
  if (!baked.has(id)) baked.set(id, (async () => {
    const S = SCORES[id](cast), loop = (fn) => bakeLoop(S.len, S.tail, fn, SR);
    const [drums, music, lead, bed, win, lose] = await Promise.all([loop(S.drums), loop(S.music), loop(S.lead),
      S.bed ? bakeLoop(16, 2, S.bed) : null, S.jingle(true) && bake(2.6, S.jingle(true), 2, 0.8, true, SR), S.jingle(false) && bake(2.6, S.jingle(false), 2, 0.8, true, SR)]);
    return { id, drums, music, lead, bed, win, lose, mix: S.mix };
  })());
  return baked.get(id);
}
/** The score of a flow state: the menus' own, or the stage's (by its map id). */
export const scoreOf = (map) => (SCORES[map] ? map : 'warehouse');
