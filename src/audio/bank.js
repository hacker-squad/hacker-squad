// Offline-synthesised sound bank (OfflineAudioContext, no downloads): the synthesis helpers every audio module bakes with,
// and the sounds all seven fighters share — air whooshes by swing shape, blunt body impacts (a thump, a thwack, a punch:
// nobody here carries a blade; what the weapon is made of is layered on top from foley.js), body falls, dodge / landing,
// and the Overclock stingers. Baked once at boot into AudioBuffers and played back by audio.js with random rate / gain /
// pan, so 50+ hits per second stay cheap and never repeat back to back.
// The rest of the sound lives beside this file: foley.js (weapon materials and techniques), voices.js (the fighters'
// and the enemies' voices), music.js (one score per stage), kits.js (which fighter's move plays what).
// Audio variation uses Math.random: it must never touch the sim or visual RNG.
export const SR = 48000;
export const rnd = (a, b) => a + (b - a) * Math.random();
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

let NOISE = null;
export function noiseBuf() {
  if (!NOISE) {
    NOISE = new AudioBuffer({ length: SR * 3, sampleRate: SR, numberOfChannels: 1 });
    const d = NOISE.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return NOISE;
}

/** Stereo reverb impulse for the runtime convolver: 1.5 s of decaying noise that darkens over time. */
export function makeIR() {
  const sec = 1.5, decay = 3.4, n = Math.floor(sec * SR), b = new AudioBuffer({ length: n, sampleRate: SR, numberOfChannels: 2 });
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n, a = 0.75 - 0.6 * u;                 // one-pole lowpass closing over the tail
      lp += a * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-decay * u * sec) * (i < SR * 0.012 ? i / (SR * 0.012) : 1);
    }
  }
  return b;
}

// ---- node helpers (all take the offline context)
export function pts(p, t0, a, exp) {
  p.setValueAtTime(a[0][1], t0 + a[0][0]);
  for (let i = 1; i < a.length; i++) {
    if (exp) p.exponentialRampToValueAtTime(Math.max(1e-4, a[i][1]), t0 + a[i][0]);
    else p.linearRampToValueAtTime(a[i][1], t0 + a[i][0]);
  }
}
export function nz(oc, t, dur, rate = 1) {
  const s = oc.createBufferSource(); s.buffer = noiseBuf(); s.loop = true; s.playbackRate.value = rate;
  s.start(t, rnd(0, 2.5)); s.stop(t + dur); return s;
}
export function osc(oc, type, t, dur, f) {
  const o = oc.createOscillator(); o.type = type; if (f) o.frequency.value = f;
  o.start(t); o.stop(t + dur); return o;
}
export function filt(oc, type, f, q = 0.707) { const b = oc.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
export function gain(oc, v) { const g = oc.createGain(); g.gain.value = v; return g; }
export function env(oc, t0, a) { const g = oc.createGain(); g.gain.value = 0; pts(g.gain, t0, a); return g; }
/** Percussive envelope: linear attack, exponential-ish decay (time constant dec/4). */
export function perc(oc, t, a, dec, peak = 1) {
  const g = oc.createGain(); g.gain.value = 0;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + a, dec / 4);
  return g;
}
export function curve(oc, t, dur, fn) {                 // gain following fn(u), u ∈ [0,1]
  const g = oc.createGain(), c = new Float32Array(256);
  for (let i = 0; i < 256; i++) c[i] = fn(i / 255);
  g.gain.setValueCurveAtTime(c, t, dur); return g;
}
export function shaper(oc, drive) {
  const w = oc.createWaveShaper(), c = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(x * drive) / Math.tanh(drive); }
  w.curve = c; return w;
}
export function pan(oc, p) { const s = oc.createStereoPanner(); s.pan.value = p; return s; }
export function smp(oc, dst, buf, t, rate, g, p) {             // place a baked buffer inside another bake
  const s = oc.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate;
  s.connect(gain(oc, g)).connect(pan(oc, p)).connect(dst); s.start(t);
}

/** Render fn into a buffer, normalised to `peak` (0: kept at its rendered level), trailing silence trimmed. */
export async function bake(dur, fn, ch = 1, peak = 0.9, trim = true, sr = SR) {
  const oc = new OfflineAudioContext(ch, Math.ceil(dur * sr), sr);
  fn(oc, oc.destination);
  const b = await oc.startRendering();
  let m = 0;
  for (let c = 0; c < ch; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); }
  const k = m > 0 && peak ? peak / m : 1, fade = Math.floor(sr * 0.006);
  let last = 0;                                              // trim trailing silence (< -66 dBFS)
  if (!trim) last = b.length - 1;
  else for (let c = 0; c < ch; c++) { const d = b.getChannelData(c); for (let i = d.length - 1; i > last; i--) if (Math.abs(d[i]) * k > 5e-4) { last = i; break; } }
  const len = Math.min(b.length, last + fade + 1), o = new AudioBuffer({ length: len, sampleRate: sr, numberOfChannels: ch });
  for (let c = 0; c < ch; c++) {
    const d = o.getChannelData(c);
    d.set(b.getChannelData(c).subarray(0, len));
    for (let i = 0; i < len; i++) d[i] *= k;
    for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
  }
  return o;
}
/** Hold a baked sound's loudness down to `max` RMS (in place): a bare sine at full peak is far louder than a click. */
export function tame(b, max = 0.2) {
  let sq = 0, k = 0;
  for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) sq += d[i] * d[i]; k += d.length; }
  const r = Math.sqrt(sq / Math.max(1, k));
  if (r > max) for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= max / r; }
  return b;
}
/** Loop: render len + tail, fold the tail back onto the start (layers must cross-fade over [0,tail) / [len,len+tail)).
 *  Ambience loops render at 24 kHz (dark distance layers); the music asks for more (music.js). Layers of one score share
 *  len and sr, so they are the same number of samples long and stay locked. */
export async function bakeLoop(len, tail, fn, sr = 24000) {
  const b = await bake(len + tail, fn, 2, 0.9, false, sr), n = Math.round(len * sr), out = new AudioBuffer({ length: n, sampleRate: sr, numberOfChannels: 2 });
  for (let c = 0; c < 2; c++) {
    const s = b.getChannelData(c), d = out.getChannelData(c);
    d.set(s.subarray(0, n));
    for (let i = n; i < s.length; i++) d[i - n] += s[i];
  }
  return out;
}
export const xfade = (len, tail) => (oc, t0 = 0) => curve(oc, t0, len + tail, (u) => {   // equal-power in/out for folded loops
  const s = u * (len + tail);
  return s < tail ? Math.sin(Math.PI / 2 * s / tail) : s > len ? Math.cos(Math.PI / 2 * (s - len) / tail) : 1;
});

// ---- formant voice
// Male vowel formants (shouted: F1 raised). 'A' = "uh".
const VOW = { a: [820, 1220, 2700, 3500], A: [660, 1180, 2550, 3400], e: [540, 1820, 2550, 3450], i: [340, 2250, 3000, 3700],
  o: [590, 930, 2550, 3400], u: [390, 820, 2350, 3300] };
const BW = [95, 120, 170, 260], FG = [1, 0.8, 0.42, 0.22];

/**
 * o = { t, k (pitch scale), f0:[[s,hz]], vow:[[s,'a']], amp:[[s,v]], asp:[[s,v]] (attack breath), growl (0..1 sub-harmonic
 *       roughness), fric:[t, dur, gain, hpHz] (s/t/g burst), jit, gain, fk (formant scale),
 *       breath (0..1, default 0.35: aspiration riding the voiced envelope + a broadband rasp — a shout is half air),
 *       vib:[hz, depth] (pitch wobble, default a faint 5-7 Hz), trem:[hz, depth] (loudness flutter: a bleat, a purr) }
 */
export function voice(oc, dst, o) {
  const t = o.t || 0, k = o.k || 1, fk = o.fk || 1;
  const len = o.amp[o.amp.length - 1][0] + 0.03;
  const f0 = o.f0.map(([u, f]) => [u, f * k]);
  const src = env(oc, t, o.amp);
  const g1 = osc(oc, 'sawtooth', t, len); pts(g1.frequency, t, f0, true);
  const jit = gain(oc, f0[0][1] * (o.jit ?? 0.035));
  nz(oc, t, len).connect(filt(oc, 'lowpass', 28)).connect(jit).connect(g1.frequency);
  const vib = osc(oc, 'sine', t, len, o.vib ? o.vib[0] : rnd(5, 7)), vg = gain(oc, f0[0][1] * (o.vib ? o.vib[1] : 0.014));
  vib.connect(vg).connect(g1.frequency);
  g1.connect(src);
  let voiced = src;
  if (o.growl) {                                  // phase-ish locked sub-harmonic AM → strained, rough shout
    const am = gain(oc, 1 - o.growl * 0.5), m = osc(oc, 'sine', t, len), md = gain(oc, o.growl * 0.5);
    pts(m.frequency, t, f0.map(([u, f]) => [u, f * 0.5]), true);
    m.connect(md).connect(am.gain); src.connect(am); voiced = am;
  }
  const asp = env(oc, t, o.asp || [[0, 0], [0.01, 0]]);
  nz(oc, t, len).connect(asp);
  const out = gain(oc, o.gain ?? 1), br = o.breath ?? 0.35;
  if (o.trem) osc(oc, 'sine', t, len, o.trem[0]).connect(gain(oc, o.trem[1] * (o.gain ?? 1))).connect(out.gain);
  const air = env(oc, t, o.amp.map(([u, v]) => [u, v * br * 2.5]));      // breath through the formants (noise is ≈ -8 dB vs saw)
  nz(oc, t, len).connect(air);
  for (let j = 0; j < 4; j++) {
    const b = filt(oc, 'bandpass', 1000, VOW[o.vow[0][1]][j] * fk / BW[j]);
    pts(b.frequency, t, o.vow.map(([u, v]) => [u, VOW[v][j] * fk]));
    const g = gain(oc, FG[j]);
    voiced.connect(b); asp.connect(b); air.connect(b); b.connect(g).connect(out);
  }
  nz(oc, t, len).connect(filt(oc, 'bandpass', 3200, 0.6)).connect(env(oc, t, o.amp.map(([u, v]) => [u, v * br * 0.22]))).connect(out);   // rasp
  voiced.connect(filt(oc, 'lowpass', 380)).connect(gain(oc, 0.35)).connect(out);   // chest / fundamental
  if (o.fric) {
    const [ft, fd, fg, ff] = o.fric;
    nz(oc, t, len).connect(filt(oc, 'highpass', ff || 3800, 0.9))
      .connect(env(oc, t, [[0, 0], [ft, 0], [ft + 0.006, fg], [ft + fd, 0]])).connect(out);
  }
  out.connect(dst);
}

// ---- whooshes: body band sweep + high "tear" + a narrow whistle (+ sub for heavy)
export function whoosh(oc, dst, { dur, lo, hi, pk, q, tear, whistle, sub = 0, pulses = 0 }) {
  const shape = (u) => {
    let e = u < pk ? (u / pk) ** 1.3 : (1 - (u - pk) / (1 - pk)) ** 1.7;   // quick rise: the whoosh reads from its first frames
    if (pulses) e *= 0.3 + 0.7 * Math.sin(Math.PI * u * pulses) ** 2;
    return e;
  };
  const sw = [[0, lo], [dur * pk, hi], [dur, lo * 1.25]];
  const b = filt(oc, 'bandpass', lo, q); pts(b.frequency, 0, sw, true);
  nz(oc, 0, dur).connect(b).connect(curve(oc, 0, dur, shape)).connect(dst);
  if (tear) nz(oc, 0, dur).connect(filt(oc, 'highpass', 3600)).connect(curve(oc, 0, dur, (u) => shape(u) ** 3 * tear)).connect(dst);
  if (whistle) {
    const w = filt(oc, 'bandpass', lo * 2, 16); pts(w.frequency, 0, sw.map(([u, f]) => [u, f * 1.9]), true);
    nz(oc, 0, dur).connect(w).connect(curve(oc, 0, dur, (u) => shape(u) * whistle * 4)).connect(dst);
  }
  if (sub) {
    const s = osc(oc, 'sine', 0, dur); pts(s.frequency, 0, [[0, 120], [dur, 52]], true);
    s.connect(curve(oc, 0, dur, (u) => shape(u) * sub)).connect(dst);
  }
}

// ---- impacts
export function clank(oc, dst, t = 0, base = rnd(700, 1500), g = 1, dec = rnd(0.12, 0.3)) {
  [1, 2.76, 5.4, 8.93].forEach((r, j) => {
    if (base * r > 18000) return;
    osc(oc, 'sine', t, dec * 2, base * r * rnd(0.985, 1.015)).connect(perc(oc, t, 0.001, dec / (1 + j * 0.6), g / (1 + j * 0.8))).connect(dst);
  });
  nz(oc, t, 0.01).connect(filt(oc, 'highpass', 3000)).connect(perc(oc, t, 0.0005, 0.008, g * 0.6)).connect(dst);
}
export function grains(oc, dst, t, span, n, lp, g) {
  for (let i = 0; i < n; i++) {
    const ti = t + Math.random() * span;
    nz(oc, ti, 0.03).connect(filt(oc, 'bandpass', rnd(600, lp), 1.2)).connect(perc(oc, ti, 0.0008, rnd(0.008, 0.025), g * rnd(0.5, 1))).connect(dst);
  }
}
function impact(oc, dst, { heavy = false }) {
  const T = heavy ? 1.0 : 0.4;
  nz(oc, 0, 0.012).connect(filt(oc, 'highpass', 1800)).connect(perc(oc, 0, 0.0005, 0.007, 0.8)).connect(dst);          // click
  nz(oc, 0, 0.15).connect(filt(oc, 'bandpass', rnd(1700, 2600), 0.9)).connect(perc(oc, 0, 0.001, rnd(0.03, 0.05), 0.55)).connect(dst);  // smack
  const b = osc(oc, 'sine', 0, T);                                                                                    // body thump
  pts(b.frequency, 0, [[0, heavy ? rnd(115, 135) : rnd(150, 195)], [heavy ? 0.28 : 0.1, heavy ? 36 : 56]], true);
  b.connect(perc(oc, 0, 0.002, heavy ? 0.5 : 0.11, 1)).connect(shaper(oc, heavy ? 3.5 : 1.8)).connect(gain(oc, heavy ? 1.0 : 0.6)).connect(dst);   // light: tight, so flurry ticks separate
  nz(oc, 0, 0.12).connect(filt(oc, 'bandpass', rnd(420, 680), 1.3)).connect(perc(oc, 0.001, 0.002, heavy ? 0.09 : 0.05, heavy ? 1.1 : 0.9)).connect(dst);   // "thwack": low-mid body
  nz(oc, 0, 0.2).connect(filt(oc, 'lowpass', heavy ? 900 : 1300)).connect(perc(oc, 0, 0.002, heavy ? 0.16 : 0.08, 0.9)).connect(dst);  // cloth punch
  grains(oc, dst, 0.004, heavy ? 0.12 : 0.06, heavy ? 8 : 3, heavy ? 2200 : 2800, 0.5);                           // scuffle
  if (heavy) {
    const s = osc(oc, 'sine', 0, T); pts(s.frequency, 0, [[0, 70], [0.6, 30]], true);
    s.connect(perc(oc, 0.005, 0.004, 0.7, 0.9)).connect(dst);
    nz(oc, 0, 0.8).connect(filt(oc, 'bandpass', 380, 0.8)).connect(perc(oc, 0.01, 0.005, 0.35, 0.5)).connect(dst);
  }
}
function crunch(oc, dst) {                                   // small extra-victim grain for mass hits
  nz(oc, 0, 0.01).connect(filt(oc, 'highpass', 2000)).connect(perc(oc, 0, 0.0005, 0.006, 0.8)).connect(dst);
  const b = osc(oc, 'sine', 0, 0.12); pts(b.frequency, 0, [[0, rnd(190, 260)], [0.06, 75]], true);
  b.connect(perc(oc, 0, 0.001, 0.06, 0.8)).connect(shaper(oc, 2)).connect(dst);
  grains(oc, dst, 0.002, 0.04, 4, 3200, 0.8);
}
function mass(oc, dst) {                                    // many bodies struck at once: a tight cluster of cracks + one fat thump
  for (let i = 0; i < 5; i++) {
    const t = i ? rnd(0.004, 0.03) : 0;
    nz(oc, t, 0.06).connect(filt(oc, 'bandpass', rnd(1300, 3800), 1.1)).connect(perc(oc, t, 0.0008, rnd(0.02, 0.045), i ? rnd(0.4, 0.75) : 1))
      .connect(pan(oc, i ? rnd(-0.6, 0.6) : 0)).connect(dst);
  }
  const b = osc(oc, 'sine', 0, 0.22); pts(b.frequency, 0, [[0, rnd(105, 140)], [0.09, 46]], true);
  b.connect(perc(oc, 0, 0.002, 0.13, 1)).connect(shaper(oc, 3)).connect(gain(oc, 0.8)).connect(dst);
  nz(oc, 0, 0.12).connect(filt(oc, 'lowpass', 1200)).connect(perc(oc, 0, 0.002, 0.07, 0.8)).connect(dst);
  nz(oc, 0, 0.1).connect(filt(oc, 'bandpass', rnd(380, 620), 1.2)).connect(perc(oc, 0.002, 0.002, 0.06, 0.9)).connect(dst);
  grains(oc, dst, 0.008, 0.05, 6, 3000, 0.45);
}
function fall(oc, dst, heavy) {                               // body hits the ground: thump + dirt
  const b = osc(oc, 'sine', 0, 0.3); pts(b.frequency, 0, [[0, heavy ? 95 : 120], [0.12, 42]], true);
  b.connect(perc(oc, 0, 0.002, 0.15, 1)).connect(shaper(oc, 2)).connect(dst);
  nz(oc, 0, 0.25).connect(filt(oc, 'lowpass', 900)).connect(perc(oc, 0, 0.002, 0.12, 0.8)).connect(dst);
  grains(oc, dst, 0.01, 0.12, 6, 4500, 0.35);
}

// ---- stingers
export function bell(oc, dst, t, f, g, dec) {
  [1, 2.0, 2.76, 3.9, 5.4].forEach((r, j) => osc(oc, 'sine', t, dec * 2, f * r).connect(perc(oc, t, 0.002, dec / (1 + j * 0.5), g / (1 + j * 0.9))).connect(dst));
}
/** Energy sparkle: a short inharmonic ring (≤ 0.4 s, so it never sits as a tone) plus scattered bright noise glints that thin out. */
export function shimmer(oc, dst, t, n, lo, hi, g, dec) {
  for (let i = 0; i < 5; i++) {
    const f = lo * (hi / lo) ** Math.random();
    osc(oc, 'sine', t, 0.5, f).connect(perc(oc, t, 0.002, rnd(0.2, 0.4), g / 5)).connect(pan(oc, rnd(-0.6, 0.6))).connect(dst);
  }
  for (let i = 0; i < n * 3; i++) {
    const ti = t + dec * Math.random() ** 1.8;
    nz(oc, ti, 0.04).connect(filt(oc, 'bandpass', rnd(lo * 2, hi), 4)).connect(perc(oc, ti, 0.001, rnd(0.015, 0.04), g * rnd(0.3, 0.8)))
      .connect(pan(oc, rnd(-0.8, 0.8))).connect(dst);
  }
}
/** Bake the shared bank into B progressively (combat sounds first): B.name = AudioBuffer | AudioBuffer[]. */
export async function buildBank(B = {}) {
  const n = (k, f) => Promise.all(Array.from({ length: k }, f));
  const put = (keys, ps) => Promise.all(ps).then((v) => keys.forEach((k, i) => { B[k] = v[i]; }));
  await put(['slash', 'thrust', 'spin', 'heavy', 'hit', 'hitHeavy', 'crunch', 'mass'], [
    n(6, () => bake(0.3, (oc, d) => whoosh(oc, d, { dur: rnd(0.2, 0.27), lo: rnd(420, 560), hi: rnd(2000, 2800), pk: rnd(0.4, 0.5), q: 1.3, tear: 0.3, whistle: rnd(0.05, 0.12) }))),
    n(6, () => bake(0.2, (oc, d) => whoosh(oc, d, { dur: rnd(0.12, 0.16), lo: rnd(800, 1000), hi: rnd(3400, 4400), pk: 0.35, q: 1.1, tear: 0.6, whistle: rnd(0.08, 0.15) }))),
    n(4, () => bake(0.5, (oc, d) => whoosh(oc, d, { dur: rnd(0.38, 0.46), lo: rnd(320, 420), hi: rnd(1700, 2200), pk: 0.5, q: 1.4, tear: 0.3, whistle: 0.1, pulses: 2 }))),
    n(4, () => bake(0.5, (oc, d) => whoosh(oc, d, { dur: rnd(0.36, 0.44), lo: rnd(230, 290), hi: rnd(1400, 1800), pk: 0.5, q: 1.2, tear: 0.3, whistle: 0.06, sub: 0.9 }))),
    n(12, () => bake(0.45, (oc, d) => impact(oc, d, {}))),
    n(5, () => bake(1.1, (oc, d) => impact(oc, d, { heavy: true }))),
    n(8, () => bake(0.14, (oc, d) => crunch(oc, d))),
    n(6, () => bake(0.3, (oc, d) => mass(oc, d), 2)),
  ]);
  await put(['fall', 'blow', 'enemySwing', 'dodge', 'land'], [
    n(5, (_, i) => bake(0.35, (oc, d) => fall(oc, d, i < 2))),
    n(3, () => bake(0.6, (oc, d) => whoosh(oc, d, { dur: 0.5, lo: 180, hi: 900, pk: 0.18, q: 0.9, tear: 0.2, whistle: 0, sub: 0.7 }))),
    n(3, () => bake(0.25, (oc, d) => whoosh(oc, d, { dur: 0.2, lo: 600, hi: 2000, pk: 0.45, q: 1.2, tear: 0.2, whistle: 0.05 }))),
    n(3, () => bake(0.35, (oc, d) => {                       // dodge: a rush of air and two scuffs of the shoes
      whoosh(oc, d, { dur: 0.28, lo: 300, hi: 1300, pk: 0.4, q: 0.8, tear: 0.12, whistle: 0 });
      for (const t of [0.01, 0.19]) nz(oc, t, 0.06).connect(filt(oc, 'bandpass', rnd(2500, 3800), 0.9)).connect(perc(oc, t, 0.002, 0.04, 0.5)).connect(d);
    })),
    n(2, () => bake(0.4, (oc, d) => { fall(oc, d, true); })),
  ]);
  // Overclock stingers
  await put(['ready', 'flash', 'boom'], [
    bake(2.2, (oc, d) => {
      bell(oc, d, 0, 1046, 0.6, 1.6);
      [1568, 2093, 2637, 3136].forEach((f, i) => osc(oc, 'triangle', 0.05 + i * 0.06, 0.8, f).connect(perc(oc, 0.05 + i * 0.06, 0.002, 0.5, 0.25)).connect(d));
      nz(oc, 0, 0.8).connect(filt(oc, 'highpass', 6000)).connect(perc(oc, 0, 0.01, 0.5, 0.2)).connect(d);
    }, 2),
    bake(2.0, (oc, d) => {                                   // activation: bright crack, metallic shimmer, sub drop
      nz(oc, 0, 0.6).connect(filt(oc, 'highpass', 1500)).connect(perc(oc, 0, 0.001, 0.35, 0.9)).connect(d);
      shimmer(oc, d, 0, 14, 1200, 8000, 0.9, 1.3);
      const s = osc(oc, 'sine', 0, 1.4); pts(s.frequency, 0, [[0, 78], [0.9, 30]], true);
      s.connect(perc(oc, 0, 0.004, 1.0, 1)).connect(shaper(oc, 3)).connect(d);
      whoosh(oc, d, { dur: 0.7, lo: 300, hi: 5000, pk: 0.15, q: 0.9, tear: 0.5, whistle: 0.2 });
    }, 2),
    bake(3.4, (oc, d) => {                                   // finishing blast: crack + saturated sub + wide explosion wash
      nz(oc, 0, 0.3).connect(filt(oc, 'highpass', 1200)).connect(perc(oc, 0, 0.0008, 0.15, 1.4)).connect(d);
      nz(oc, 0, 0.5).connect(filt(oc, 'bandpass', 700, 0.7)).connect(perc(oc, 0, 0.002, 0.3, 1.2)).connect(shaper(oc, 2.5)).connect(d);
      const s = osc(oc, 'sine', 0, 3); pts(s.frequency, 0, [[0, 66], [2.2, 22]], true);
      s.connect(perc(oc, 0, 0.004, 2.2, 0.9)).connect(shaper(oc, 4)).connect(d);
      for (const p of [-0.6, 0.6]) {
        const lp = filt(oc, 'lowpass', 9000, 0.9); pts(lp.frequency, 0, [[0, 9000], [2.4, 160]], true);
        nz(oc, 0, 3.2).connect(lp).connect(perc(oc, 0, 0.003, 1.8, 1.3)).connect(pan(oc, p)).connect(d);
      }
      shimmer(oc, d, 0.02, 18, 1800, 9000, 0.6, 1.6);
      nz(oc, 0, 3.2, 0.2).connect(filt(oc, 'lowpass', 110)).connect(perc(oc, 0.05, 0.1, 2.6, 1.4)).connect(d);
      grains(oc, d, 0.05, 1.2, 60, 3500, 0.35);
    }, 2),
  ]);
  return B;
}
