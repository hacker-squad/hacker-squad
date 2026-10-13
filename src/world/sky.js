// Atmosphere: a plain distance haze that replaces three's fog chunk, so every fogged material (floor, props, crowd, hero,
// debris) fades toward scene.fog.color with distance — and, for the maps under an open sky, a sky dome (render-only).
// The key light is the map's: its world builder points it with setSun(azimuth, elevation) when it builds. SUN_DIR / SUN_AZ
// are what the engine modules read (post.js atmosphere pass, the Special-attack cameras that avoid shooting straight
// into it). The warehouse has no sun: there it is the big floodlight bank over the far wall.
// The dome (the forest) has three moods, blended by two uniforms: a clear morning (blue zenith, pale horizon, blocky
// white clouds) → `war` 0…1: the smoke of the battle (a brown overcast, an orange horizon, dark clouds) → `dark` 0…1:
// night (the boss wolf's howl: deep blue, stars, a full moon). horizon(war, dark, out) is the CPU twin of the dome's
// horizon colour: the world builder gives it to scene.fog so the far trees sink into the same sky they stand against.
import * as THREE from 'three';

export let SUN_AZ = 0.314;
export const SUN_DIR = new THREE.Vector3();
/** Point the key light (a map's world builder, on build). */
export function setSun(az, elev) {
  SUN_AZ = az;
  SUN_DIR.set(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev));
}
setSun(0.314, 0.5);

const lin = (hex) => new THREE.Color(hex);                          // sRGB hex → linear working colour
const v3 = (c, k = 1) => `vec3(${(c.r * k).toFixed(4)}, ${(c.g * k).toFixed(4)}, ${(c.b * k).toFixed(4)})`;
// [zenith, horizon, cloud lit, cloud shade] per mood
const DAY = [lin(0x2f7fd6), lin(0xb9e2ff), lin(0xffffff), lin(0xb8cfe6)];
const WAR = [lin(0x5c4a44), lin(0xf08a3c), lin(0x9a6a50), lin(0x3a2c2a)];
const NIGHT = [lin(0x060a1c), lin(0x1c2a52), lin(0x3a4a78), lin(0x10162c)];

/** Horizon colour for a mood (linear), × k. */
export function horizon(war, dark, out = new THREE.Color(), k = 1) {
  return out.copy(DAY[1]).lerp(WAR[1], war).lerp(NIGHT[1], dark).multiplyScalar(k);
}

/**
 * Replace three's fog chunks (must run before any material compiles). THREE.Fog(color, near, far) now means: haze starts
 * at `near` metres and reaches 63 % after a further `far` metres. The curve is exp(-x^1.6), not exp(-x): the mid field
 * stays legible as silhouettes while the far wall still sinks into the dark.
 */
export function installHaze() {
  THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n\tvarying vec3 vFogDir;\n#endif';
  THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n\tvFogDir = transpose( mat3( viewMatrix ) ) * mvPosition.xyz;\n#endif';
  THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
    uniform vec3 fogColor; varying vec3 vFogDir;
    uniform float fogNear; uniform float fogFar;
  #endif`;
  THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
    float fogDist = length( vFogDir );
    float fogFactor = 1.0 - exp( - pow( max( fogDist - fogNear, 0.0 ) / fogFar, 1.6 ) );
    gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
  #endif`;
}

/** The sky dome → { mesh, set(war, dark, time) }. */
export function createSky() {
  const u = { uTime: { value: 0 }, uWar: { value: 0 }, uDark: { value: 0 } };
  const mood = (i) => `mix(mix(${v3(DAY[i])}, ${v3(WAR[i])}, uWar), ${v3(NIGHT[i])}, uDark)`;
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uWar, uDark; varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.07 + vec2(17.1, 9.2); a *= 0.5; } return s; }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = mix(${mood(1)}, ${mood(0)}, smoothstep(0.0, 0.55, h));
        // the war's glow: a band of fire light low on the horizon, strongest up the field (+Z)
        c += vec3(0.9, 0.3, 0.06) * uWar * (1.0 - uDark * 0.6) * (1.0 - smoothstep(0.0, 0.2, h)) * (0.4 + 0.6 * max(d.z, 0.0));
        if (h > 0.0) {
          // blocky voxel clouds on a plane, drifting; the overcast thickens with the war
          vec2 uv = d.xz / (h + 0.12);
          uv = floor(uv * 8.0) / 8.0 + vec2(uTime * 0.006, uTime * 0.002);
          float n = fbm(uv * 0.5 + vec2(3.0, 7.0));
          float band = smoothstep(0.02, 0.12, h);
          float cov = smoothstep(0.56 - 0.2 * uWar, 0.7 - 0.2 * uWar, n) * band;
          float lit = smoothstep(0.55, 0.8, fbm(uv * 0.5 + vec2(3.2, 7.3)));
          c = mix(c, mix(${mood(3)}, ${mood(2)}, lit), cov * 0.9);
          // night: stars, and the full moon up the field
          float st = step(0.9965, hash(floor(d.xz / (h + 0.2) * 90.0)));
          c += vec3(1.6, 1.7, 2.0) * st * uDark * (1.0 - cov) * smoothstep(0.05, 0.3, h);
        }
        float m = dot(d, normalize(vec3(0.25, 0.42, 0.87)));
        c = mix(c, vec3(2.6, 2.7, 2.9), smoothstep(0.9982, 0.9987, m) * uDark);
        c += vec3(0.2, 0.26, 0.4) * pow(max(m, 0.0), 180.0) * uDark;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -1;
  return { mesh, set(war, dark, time) { u.uWar.value = war; u.uDark.value = dark; u.uTime.value = time; } };
}
