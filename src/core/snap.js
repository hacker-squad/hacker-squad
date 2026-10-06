// Sim state as data — what a co-op resync sends from the host to a player whose sim has drifted (net/lockstep.js; the
// whole snapshot: core/game.js save / load; each sim module packs its own state with these).
//   pack(v, skip?)                 → a JSON-safe deep copy of the data in v: numbers (NaN, ±Infinity and -0 survive),
//                                    strings, booleans, null, arrays, typed arrays (bit-exact, base64), plain objects.
//                                    Functions are left out, and so are the keys in `skip` (references to static data:
//                                    a hero's kit, an Overclock's number table).
//   fresh(d)                       → the value back, all new objects
//   restore(target, d, { skip?, keep? })   puts a packed object back INTO target: typed arrays are filled in place
//                                    (whoever holds them keeps reading the right numbers), everything else is replaced
//                                    by fresh copies — state may point at static data (a beat's line, an officer's
//                                    name), which must never be written through. Data keys target has and d lacks are
//                                    removed (functions and `skip` keys stay). keep: keys of nested objects that are
//                                    restored in place too (objects the render side holds on to).
const TYPES = { Float64Array, Float32Array, Int32Array, Uint32Array, Int16Array, Uint16Array, Int8Array, Uint8Array };
const typeOf = (v) => { for (const k in TYPES) if (v instanceof TYPES[k]) return k; return null; };
function b64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function bytes(s) {
  const b = atob(s), u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
const isPacked = (d, k) => d !== null && typeof d === 'object' && k in d;

export function pack(v, skip) {
  if (v === undefined) return { $u: 1 };
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? v : { $n: Object.is(v, -0) ? '-0' : String(v) };
  if (typeof v !== 'object') throw new Error(`snap: cannot pack a ${typeof v}`);
  if (ArrayBuffer.isView(v)) {
    const t = typeOf(v);
    if (!t) throw new Error('snap: unknown typed array');
    return { $a: t, b: b64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
  }
  if (Array.isArray(v)) return Array.from(v, (q) => (typeof q === 'function' ? null : pack(q)));
  const p = Object.getPrototypeOf(v);
  if (p !== Object.prototype && p !== null) throw new Error(`snap: not plain data (${v.constructor && v.constructor.name})`);
  const o = {};
  for (const k of Object.keys(v)) {
    if (typeof v[k] === 'function' || v[k] === undefined || (skip && skip.includes(k))) continue;
    o[k] = pack(v[k]);
  }
  return o;
}

export function fresh(d) {
  if (d === null || typeof d !== 'object') return d;
  if (isPacked(d, '$u')) return undefined;
  if (isPacked(d, '$n')) return d.$n === '-0' ? -0 : Number(d.$n);
  if (isPacked(d, '$a')) { const u = bytes(d.b); return new TYPES[d.$a](u.buffer, 0, u.byteLength / TYPES[d.$a].BYTES_PER_ELEMENT); }
  if (Array.isArray(d)) return d.map(fresh);
  const o = {};
  for (const k in d) o[k] = fresh(d[k]);
  return o;
}

export function restore(target, d, { skip = [], keep = [] } = {}) {
  for (const k of Object.keys(target)) if (!(k in d) && typeof target[k] !== 'function' && !skip.includes(k)) delete target[k];
  for (const k in d) {
    const v = d[k], cur = target[k];
    if (isPacked(v, '$a') && cur instanceof TYPES[v.$a]) {
      const src = fresh(v);
      if (src.length !== cur.length) throw new Error(`snap: ${k} holds ${cur.length}, the snapshot ${src.length}`);
      cur.set(src);
    } else if (keep.includes(k) && cur && typeof cur === 'object' && v && typeof v === 'object' && !Array.isArray(v)) restore(cur, v);
    else target[k] = fresh(v);
  }
  return target;
}
