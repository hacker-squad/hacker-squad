// Deterministic maths for the sim. Co-op runs the whole battle on every device and the sims must agree to the last bit
// (net/lockstep.js). The language only promises that for + − × ÷, Math.sqrt and the rounding / comparing functions;
// Math.sin, cos, atan2, hypot, pow and the ** operator are "implementation-approximated" — each browser engine has its
// own, and they differ in the last bit now and then (a phone's Safari beside a laptop's Chrome), which is all it takes
// for two sims to drift apart. So the sim uses these instead: the same functions written out in exact arithmetic only,
// hence the same result in every engine.
//   sin, cos, atan2   the fdlibm algorithms, as V8's portable build has them: bit for bit what Node's Math returns, so the
//                     headless runs (bench/) give the results they always gave. (Chrome itself ships another sin / cos —
//                     about one result in forty differs in the last bit: engines disagree even within one family.)
//   hypot(x, y)       scaled sum of squares, as V8 does it (two arguments — the sim never needs more)
//   sq(x)             x * x: what the sim writes instead of x ** 2
// RULE: sim code — everything that runs inside game.step, and whatever builds the data it reads (the maps' grids, move
// tables) — never calls Math.sin / cos / tan / asin / acos / atan / atan2 / hypot / pow / exp / log* / cbrt, nor uses
// **. bench/dmath.mjs holds the list of sim files and fails if one of them does; it also checks these functions against
// the engine's own (accuracy) and against a fixed fingerprint (the same bits on every engine).
// The render side (models, clips, effects, cameras' rigs) keeps the native Math: nothing there feeds back into the sim.
const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
const HI = new Uint8Array(new Float64Array([1]).buffer)[7] === 0x3f ? 1 : 0, LO = 1 - HI;   // word order of this machine
/** High 32 bits of x (sign, exponent, top of the mantissa), as a signed int — fdlibm's GET_HIGH_WORD. */
const hiWord = (x) => { f64[0] = x; return u32[HI] | 0; };
const fromWords = (hi, lo) => { u32[HI] = hi; u32[LO] = lo; return f64[0]; };

// ---------------------------------------------------------------- sin, cos (fdlibm k_sin.c, k_cos.c, e_rem_pio2.c)
const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
  S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
/** sin on [-π/4, π/4] of x + y (y: the tail of x; iy = 0: y is 0). */
function kSin(x, y, iy) {
  const ix = hiWord(x) & 0x7fffffff;
  if (ix < 0x3e400000 && (x | 0) === 0) return x;                    // |x| < 2^-27
  const z = x * x, v = z * x, r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
  return iy === 0 ? x + v * (S1 + z * r) : x - ((z * (0.5 * y - v * r) - y) - v * S1);
}
const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
  C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
/** cos on [-π/4, π/4] of x + y. */
function kCos(x, y) {
  const ix = hiWord(x) & 0x7fffffff;
  if (ix < 0x3e400000 && (x | 0) === 0) return 1;
  const z = x * x, r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
  if (ix < 0x3fd33333) return 1 - (0.5 * z - (z * r - x * y));
  const qx = ix > 0x3fe90000 ? 0.28125 : fromWords(ix - 0x00200000, 0);
  const hz = 0.5 * z - qx, a = 1 - qx;
  return a - (hz - (z * r - x * y));
}
const INVPIO2 = 6.36619772367581382433e-01, PIO2_1 = 1.57079632673412561417e+00, PIO2_1T = 6.07710050650619224932e-11,
  PIO2_2 = 6.07710050630396597660e-11, PIO2_2T = 2.02226624879595063154e-21, PIO2_3 = 2.02226624871116645580e-21,
  PIO2_3T = 8.47842766036889956997e-32;
// high words of n·π/2, n = 1 … 32: an argument that starts like one of them may cancel badly and takes the long way
const NPIO2_HW = [0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB, 0x402C463A, 0x402F6A7A, 0x4031475C,
  0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB, 0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C,
  0x4042D97C, 0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB];
const TWO_PI = 6.283185307179586, BIG = 0x413921fb;                  // |x| up to ≈ 2^19 · π/2 reduces exactly; beyond: see reduce()
let y0 = 0, y1 = 0;                                                   // reduce() out: the remainder and its tail
/** x = n · π/2 + (y0 + y1), |y0 + y1| ≤ π/4 → n. */
function reduce(x) {
  const hx = hiWord(x), ix = hx & 0x7fffffff;
  if (ix <= 0x3fe921fb) { y0 = x; y1 = 0; return 0; }
  if (ix < 0x4002d97c) {                                              // |x| < 3π/4: n = ±1
    if (hx > 0) {
      let z = x - PIO2_1;
      if (ix !== 0x3ff921fb) { y0 = z - PIO2_1T; y1 = (z - y0) - PIO2_1T; }
      else { z -= PIO2_2; y0 = z - PIO2_2T; y1 = (z - y0) - PIO2_2T; }
      return 1;
    }
    let z = x + PIO2_1;
    if (ix !== 0x3ff921fb) { y0 = z + PIO2_1T; y1 = (z - y0) + PIO2_1T; }
    else { z += PIO2_2; y0 = z + PIO2_2T; y1 = (z - y0) + PIO2_2T; }
    return -1;
  }
  let t = Math.abs(x);
  const n = (t * INVPIO2 + 0.5) | 0, fn = n;
  let r = t - fn * PIO2_1, w = fn * PIO2_1T;
  if (n < 32 && ix !== NPIO2_HW[n - 1]) y0 = r - w;
  else {
    const j = ix >> 20;
    y0 = r - w;
    if (j - ((hiWord(y0) >> 20) & 0x7ff) > 16) {                      // a second, then a third slice of π/2
      t = r; w = fn * PIO2_2; r = t - w; w = fn * PIO2_2T - ((t - r) - w); y0 = r - w;
      if (j - ((hiWord(y0) >> 20) & 0x7ff) > 49) { t = r; w = fn * PIO2_3; r = t - w; w = fn * PIO2_3T - ((t - r) - w); y0 = r - w; }
    }
  }
  y1 = (r - y0) - w;
  if (hx < 0) { y0 = -y0; y1 = -y1; return -n; }
  return n;
}
// (an angle past 2^19 · π/2 — the sim keeps its angles wrapped, none comes near — is first taken modulo the double
// nearest 2π: exact arithmetic, so still the same everywhere, only no longer accurate to the last bit)
const fold = (x) => ((hiWord(x) & 0x7fffffff) > BIG ? x % TWO_PI : x);

export function sin(x) {
  if (x !== x || x === Infinity || x === -Infinity) return NaN;
  x = fold(x);
  if ((hiWord(x) & 0x7fffffff) <= 0x3fe921fb) return kSin(x, 0, 0);
  switch (reduce(x) & 3) {
    case 0: return kSin(y0, y1, 1);
    case 1: return kCos(y0, y1);
    case 2: return -kSin(y0, y1, 1);
    default: return -kCos(y0, y1);
  }
}
export function cos(x) {
  if (x !== x || x === Infinity || x === -Infinity) return NaN;
  x = fold(x);
  if ((hiWord(x) & 0x7fffffff) <= 0x3fe921fb) return kCos(x, 0);
  switch (reduce(x) & 3) {
    case 0: return kCos(y0, y1);
    case 1: return -kSin(y0, y1, 1);
    case 2: return -kCos(y0, y1);
    default: return kSin(y0, y1, 1);
  }
}

// ---------------------------------------------------------------- atan2 (fdlibm s_atan.c, e_atan2.c)
const ATAN_HI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
const ATAN_LO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
const AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
  9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
  4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];
function atan(x) {
  const hx = hiWord(x), ix = hx & 0x7fffffff;
  let id;
  if (ix >= 0x44100000) {                                             // |x| ≥ 2^66
    if (x !== x) return NaN;
    return hx > 0 ? ATAN_HI[3] + ATAN_LO[3] : -ATAN_HI[3] - ATAN_LO[3];
  }
  if (ix < 0x3fdc0000) {                                              // |x| < 0.4375
    if (ix < 0x3e200000) return x;                                    // |x| < 2^-29
    id = -1;
  } else {
    x = Math.abs(x);
    if (ix < 0x3ff30000) {                                            // |x| < 1.1875
      if (ix < 0x3fe60000) { id = 0; x = (2 * x - 1) / (2 + x); }     // 7/16 ≤ |x| < 11/16
      else { id = 1; x = (x - 1) / (x + 1); }                         // 11/16 ≤ |x| < 19/16
    } else if (ix < 0x40038000) { id = 2; x = (x - 1.5) / (1 + 1.5 * x); }   // |x| < 2.4375
    else { id = 3; x = -1 / x; }
  }
  const z = x * x, w = z * z;
  const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
  const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
  if (id < 0) return x - x * (s1 + s2);
  const r = ATAN_HI[id] - ((x * (s1 + s2) - ATAN_LO[id]) - x);
  return hx < 0 ? -r : r;
}
const PI_O_4 = 7.8539816339744827900e-01, PI_O_2 = 1.5707963267948965580e+00, PI = 3.1415926535897931160e+00, PI_LO = 1.2246467991473531772e-16;
export function atan2(y, x) {
  if (x !== x || y !== y) return NaN;
  if (x === 1) return atan(y);
  const hx = hiWord(x), ix = hx & 0x7fffffff, hy = hiWord(y), iy = hy & 0x7fffffff;
  let m = ((hy >> 31) & 1) | ((hx >> 30) & 2);                        // 2 · sign(x) + sign(y)
  if (y === 0) return m === 0 || m === 1 ? y : m === 2 ? PI : -PI;
  if (x === 0) return hy < 0 ? -PI_O_2 : PI_O_2;
  if (x === Infinity || x === -Infinity) {
    if (y === Infinity || y === -Infinity) return m === 0 ? PI_O_4 : m === 1 ? -PI_O_4 : m === 2 ? 3 * PI_O_4 : -3 * PI_O_4;
    return m === 0 ? 0 : m === 1 ? -0 : m === 2 ? PI : -PI;
  }
  if (y === Infinity || y === -Infinity) return hy < 0 ? -PI_O_2 : PI_O_2;
  const k = (iy - ix) >> 20;
  let z;
  if (k > 60) { z = PI_O_2 + 0.5 * PI_LO; m &= 1; }                   // |y / x| > 2^60
  else if (hx < 0 && k < -60) z = 0;                                  // 0 > |y| / x > -2^-60
  else z = atan(Math.abs(y / x));
  return m === 0 ? z : m === 1 ? -z : m === 2 ? PI - (z - PI_LO) : (z - PI_LO) - PI;
}

// ---------------------------------------------------------------- hypot, sq
/** √(x² + y²) without overflow: both scaled by the larger first. */
export function hypot(x, y) {
  if (x === Infinity || x === -Infinity || y === Infinity || y === -Infinity) return Infinity;
  if (x !== x || y !== y) return NaN;
  x = Math.abs(x); y = Math.abs(y);
  const max = x > y ? x : y;
  if (max === 0) return 0;
  const a = x / max, b = y / max, sum = a * a + b * b;
  return Math.sqrt(sum) * max;
}
export const sq = (x) => x * x;

// ---------------------------------------------------------------- fingerprint
/** A hash of these functions' results, bit for bit, over a fixed spread of arguments: the same eight hex digits in every
 *  engine (bench/dmath.mjs holds the value). In a browser console: (await import('/src/core/dmath.js')).fingerprint() */
export function fingerprint() {
  let s = 0x9e3779b9, h = 2166136261;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const add = (v) => { f64[0] = v; h = Math.imul(h ^ u32[LO], 16777619); h = Math.imul(h ^ u32[HI], 16777619); };
  const SCALE = [1, 7, 30, 400, 1e4, 5e5, 1e-3, 1e-9];
  for (let i = 0; i < 200000; i++) {
    const x = (rnd() * 2 - 1) * SCALE[i & 7], y = (rnd() * 2 - 1) * SCALE[(i >> 3) & 7];
    add(sin(x)); add(cos(x)); add(atan2(y, x)); add(hypot(x, y)); add(sq(x));
  }
  for (let n = -64; n <= 64; n++) { const x = n * 0.7853981633974483; add(sin(x)); add(cos(x)); add(atan2(n, 64 - n)); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
