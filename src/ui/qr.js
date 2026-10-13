// QR code (ISO 18004) for the co-op lobby: the link a friend opens, as a picture a phone's camera reads — the audience
// at a pitch scans the screen and is in the game. Byte mode, error correction M (a projected or photographed screen is
// a noisy read), versions 1–10 (up to 213 characters: the tunnel links are ~50), the mask chosen by the standard
// penalty score. No dependency: the game loads nothing from outside (serve.mjs).
//   qrSvg(text) → an <svg> string: one path, 1 unit per module, a 4-module quiet zone, scales to any size crisp
//   qrModules(text) → { size, dark(x, y) }      the raw matrix (tests, or another renderer)
const EC = [                                                 // level M, versions 1–10: [ec codewords per block, [blocks, data codewords]...]
  null, [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]], [16, [4, 27]], [18, [4, 31]],
  [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]]];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// ---- GF(256), Reed–Solomon
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x = x << 1 ^ (x & 0x80 ? 0x11d : 0); }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
function rsRemainder(data, n) {
  const gen = [1];                                           // ∏ (x − α^i), i < n
  for (let i = 0; i < n; i++) {
    gen.push(0);                                             // × x, then + α^i × the old polynomial (highest degree first)
    for (let j = gen.length - 1; j > 0; j--) gen[j] ^= mul(gen[j - 1], EXP[i]);
  }
  const rem = new Uint8Array(n);
  for (const b of data) {
    const f = b ^ rem[0];
    rem.copyWithin(0, 1); rem[n - 1] = 0;
    for (let j = 0; j < n; j++) rem[j] ^= mul(gen[j + 1], f);
  }
  return rem;
}

// ---- the codewords: mode + count + bytes + terminator + padding, then the blocks' error correction, interleaved
function codewords(text) {
  const bytes = new TextEncoder().encode(text);
  let v = 1;
  for (; v <= 10; v++) {
    const cap = EC[v].slice(1).reduce((s, [n, d]) => s + n * d, 0) * 8;
    if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap) break;
  }
  if (v > 10) throw new Error('qr: text too long');
  const cci = v < 10 ? 8 : 16, [ecn, ...groups] = EC[v], total = groups.reduce((s, [n, d]) => s + n * d, 0);
  const bits = [];
  const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push(val >> i & 1); };
  put(4, 4); put(bytes.length, cci); for (const b of bytes) put(b, 8);
  put(0, Math.min(4, total * 8 - bits.length)); while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < total; pad ^= 0xec ^ 0x11) data.push(pad);
  const blocks = [];
  for (let k = 0, [, ...gs] = EC[v], gi = 0; gi < gs.length; gi++) for (let b = 0; b < gs[gi][0]; b++, k += gs[gi][1]) blocks.push(data.slice(k, k + gs[gi][1]));
  const out = [], longest = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < longest; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
  const ecs = blocks.map((b) => rsRemainder(b, ecn));
  for (let i = 0; i < ecn; i++) for (const e of ecs) out.push(e[i]);
  return { v, out };
}

// ---- the matrix
export function qrModules(text) {
  const { v, out } = codewords(text), size = v * 4 + 17;
  const m = Array.from({ length: size }, () => new Uint8Array(size)), fn = Array.from({ length: size }, () => new Uint8Array(size));
  const set = (x, y, d) => { if (x >= 0 && y >= 0 && x < size && y < size) { m[y][x] = d ? 1 : 0; fn[y][x] = 1; } };
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const r = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, r !== 2 && r !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const al = ALIGN[v];
  for (const cy of al) for (const cx of al) {
    if ((cx < 9 && cy < 9) || (cx > size - 10 && cy < 9) || (cx < 9 && cy > size - 10)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const format = (bits) => {                                 // the 15 format bits in both places (also reserves them)
    const b = (i) => bits >> i & 1;
    for (let i = 0; i <= 5; i++) set(8, i, b(i));
    set(8, 7, b(6)); set(8, 8, b(7)); set(7, 8, b(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, b(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, b(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, b(i));
    set(8, size - 8, 1);
  };
  format(0);
  if (v >= 7) {
    let rem = v;
    for (let i = 0; i < 12; i++) rem = rem << 1 ^ (rem >>> 11) * 0x1f25;
    const bits = v << 12 | rem;
    for (let i = 0; i < 18; i++) { const a = size - 11 + i % 3, b = Math.floor(i / 3); set(a, b, bits >> i & 1); set(b, a, bits >> i & 1); }
  }
  // the data, zigzag up and down in two-column bands from the right, skipping the timing column
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fn[y][x]) { m[y][x] = i < out.length * 8 ? out[i >> 3] >> (7 - (i & 7)) & 1 : 0; i++; }
    }
  }
  // the mask: the eight tried, the least penalised kept
  const MASK = [(x, y) => (x + y) % 2, (x, y) => y % 2, (x) => x % 3, (x, y) => (x + y) % 3, (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2,
    (x, y) => x * y % 2 + x * y % 3, (x, y) => (x * y % 2 + x * y % 3) % 2, (x, y) => ((x + y) % 2 + x * y % 3) % 2];
  const apply = (k) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASK[k](x, y) === 0) m[y][x] ^= 1; };
  const penalty = () => {
    let p = 0, dark = 0;
    const runs = (get) => {                                  // rule 1 (runs ≥ 5) and rule 3 (finder-like 1:1:3:1:1 with light 4 beside) along a line
      for (let a = 0; a < size; a++) {
        let run = 0, last = -1; const hist = [0, 0, 0, 0, 0, 0, 0];
        const push = (n) => { hist.shift(); hist.push(n); };
        const fl = () => { if (hist[1] && hist[1] === hist[2] && hist[2] === hist[4] && hist[4] === hist[5] && hist[3] === hist[1] * 3 && (hist[0] >= 4 || hist[6] >= 4)) p += 40; };
        for (let b = 0; b <= size; b++) {
          const c = b < size ? get(a, b) : -1;
          if (c === last) run++;
          else { if (run >= 5) p += run - 2; if (last === 1) { push(run); } else if (last === 0) { push(run); fl(); } run = 1; last = c; }
        }
        push(4); fl();                                        // the edge counts as light
      }
    };
    runs((a, b) => m[a][b]); runs((a, b) => m[b][a]);
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
    for (const row of m) for (const c of row) dark += c;
    p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return p;
  };
  let best = 0, bestP = Infinity;
  for (let k = 0; k < 8; k++) {
    apply(k); format((((0 << 3) | k) << 10 | fmtRem(k)) ^ 0x5412);
    const p = penalty(); if (p < bestP) { bestP = p; best = k; }
    apply(k);
  }
  apply(best); format(((best << 10) | fmtRem(best)) ^ 0x5412);
  return { size, dark: (x, y) => m[y][x] === 1, rows: m };
}
function fmtRem(mask) {                                      // BCH(15,5) remainder of the format data (level M = 00, mask)
  let rem = mask;
  for (let i = 0; i < 10; i++) rem = rem << 1 ^ (rem >>> 9) * 0x537;
  return rem;
}

export function qrSvg(text) {
  const { size, rows } = qrModules(text);
  let d = '';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (rows[y][x]) d += `M${x + 4} ${y + 4}h1v1h-1z`;
  const n = size + 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code: ${text.replace(/[<>&"]/g, '')}"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
