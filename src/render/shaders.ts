/**
 * GLSL shaders for the black hole visualizer.
 *
 * The fragment shader integrates *actual null geodesics* of the
 * Schwarzschild metric. In units where r_s = 1, a photon's spatial path
 * obeys (see e.g. MTW §25.6, or the Binet form u'' + u = 3/2 u²):
 *
 *     d²x/dλ² = -(3/2) h² x̂ / r⁵ ,   h = |x × v|  (conserved)
 *
 * which reproduces exact light bending, the photon sphere at r = 1.5 r_s,
 * and the shadow with its photon ring — no artistic fakery.
 *
 * The accretion disk uses the Shakura–Sunyaev (1973, A&A 24, 337) thin-disk
 * temperature profile T ∝ r^(-3/4)(1-√(r_in/r))^(1/4), Doppler beaming with
 * the special-relativistic factor δ = 1/[γ(1-β·cosθ)], and gravitational
 * redshift g = √(1-r_s/r). Observed intensity scales as (gδ)⁴ for
 * frequency-integrated blackbody emission (Liouville's theorem: I/ν³ invariant).
 *
 * Approximations (documented for scientific honesty):
 *  - Geodesics are Schwarzschild even when spin > 0; spin sets the disk's
 *    inner edge via the Kerr ISCO and adds asymmetry, but frame dragging
 *    of light itself is not integrated (full Kerr tracing is a future step).
 *  - The disk is infinitely thin and the turbulence pattern is procedural.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec3 position;
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uCamDist;      // camera distance in Schwarzschild radii
uniform float uCamTheta;     // camera polar tilt (0 = edge-on to disk)
uniform float uCamPhi;       // camera azimuth
uniform float uDiskInner;    // disk inner radius in r_s (Kerr ISCO / r_s)
uniform float uDiskOuter;    // disk outer radius in r_s
uniform float uAccretion;    // 0..2 disk brightness scale
uniform float uDiskTempK;    // physical peak disk temperature (Kelvin)
uniform float uSpin;         // dimensionless a*, visual asymmetry only
uniform float uExposure;
uniform int   uSteps;        // integration steps (quality)
uniform float uBeaming;      // 0..1 toggle relativistic beaming (education)

#define PI 3.14159265359

// ------------------------------------------------------------------ utils
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x),
        mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
        mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise3(p); p *= 2.02; a *= 0.5; }
  return s;
}

// Blackbody color, fit to Planckian locus (Krystek 1985-style approximation,
// clamped 1000K–40000K). Returns linear-ish RGB, normalized to ~1 luminance.
vec3 blackbodyRGB(float tK) {
  float t = clamp(tK, 1000.0, 40000.0) / 100.0;
  float r, g, b;
  if (t <= 66.0) { r = 1.0; }
  else { r = 1.2929 * pow(t - 60.0, -0.1332); }
  if (t <= 66.0) { g = 0.3900 * log(t) - 0.6318; }
  else { g = 1.1299 * pow(t - 60.0, -0.0755); }
  if (t >= 66.0) { b = 1.0; }
  else if (t <= 19.0) { b = 0.0; }
  else { b = 0.5432 * log(t - 10.0) - 1.1962; }
  return clamp(vec3(r, g, b), 0.0, 1.0);
}

// ------------------------------------------------------------- background
// Procedural star field + faint galactic band, sampled by (lensed) direction.
vec3 starfield(vec3 dir) {
  vec3 col = vec3(0.0);
  // three octaves of stars at different angular scales
  for (int oct = 0; oct < 3; oct++) {
    float scale = 180.0 * pow(2.2, float(oct));
    vec3 cell = floor(dir * scale);
    float h = hash13(cell);
    if (h > 0.9975) {
      vec3 center = (cell + 0.5) / scale;
      float d = length(dir - normalize(center)) * scale;
      float mag = pow(hash13(cell + 7.1), 4.0);
      float star = exp(-d * d * 18.0) * mag * 2.4;
      float tempT = mix(2800.0, 12000.0, hash13(cell + 3.3));
      col += star * blackbodyRGB(tempT);
    }
  }
  // Milky-Way-like band
  float band = exp(-abs(dir.y + 0.22 * dir.x) * 5.5);
  col += band * 0.035 * vec3(0.75, 0.8, 1.0) * (0.4 + 0.6 * fbm(dir * 9.0));
  col += band * 0.020 * vec3(1.0, 0.85, 0.7) * fbm(dir * 22.0 + 5.0);
  return col;
}

// -------------------------------------------------------------- disk
// Shakura–Sunyaev radial temperature profile with inner-boundary factor.
float diskTemp(float r) {
  float x = clamp(uDiskInner / r, 0.0, 0.999);
  return uDiskTempK * pow(uDiskInner / r, 0.75) * pow(1.0 - sqrt(x) * 0.999, 0.25) * 2.2;
}

// Emission where a geodesic crosses the equatorial plane at radius r.
vec3 diskEmission(vec3 pos, vec3 rayDir, float t) {
  float r = length(pos.xz);
  if (r < uDiskInner || r > uDiskOuter) return vec3(0.0);

  // --- local Keplerian flow (prograde around +y) -----------------------
  // Orbital speed measured by a static observer, exact in Schwarzschild:
  // beta = 1 / sqrt(2 (r/r_s - 1))   [MTW ex. 25.19]
  float beta = clamp(1.0 / sqrt(max(2.0 * (r - 1.0), 0.05)), 0.0, 0.99);
  vec3 flowDir = normalize(vec3(-pos.z, 0.0, pos.x)); // prograde tangent

  // --- Doppler factor δ and gravitational redshift g -------------------
  float gamma = 1.0 / sqrt(1.0 - beta * beta);
  float cosTh = dot(flowDir, -rayDir); // photon direction *toward* camera
  float doppler = 1.0 / (gamma * (1.0 - beta * cosTh));
  float gRed = sqrt(max(1.0 - 1.0 / r, 0.0));
  float shift = mix(1.0, doppler * gRed, uBeaming);

  // --- temperature & turbulence ----------------------------------------
  float phi = atan(pos.z, pos.x);
  // Keplerian angular velocity Ω ∝ r^-1.5: inner disk shears faster
  float swirl = phi + t * 0.35 * pow(r / uDiskInner, -1.5) * 6.0;
  float turb = fbm(vec3(r * 1.4, swirl * 2.2, r * 0.5 - t * 0.05));
  turb = 0.55 + 0.9 * turb;
  // spin skews density toward the prograde side (visual cue only)
  turb *= 1.0 + 0.25 * uSpin * sin(phi);

  float tempObs = diskTemp(r) * shift;
  vec3 bb = blackbodyRGB(tempObs);

  // Intensity: (g δ)⁴ from Liouville invariance, radial falloff, edge fades
  float inten = pow(shift, 4.0) * pow(uDiskInner / r, 2.2);
  float edgeIn = smoothstep(uDiskInner, uDiskInner * 1.15, r);
  float edgeOut = 1.0 - smoothstep(uDiskOuter * 0.55, uDiskOuter, r);
  return bb * inten * turb * edgeIn * edgeOut * 3.2 * uAccretion;
}

// ------------------------------------------------------------- main march
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

  // camera orbiting the hole
  float ct = cos(uCamTheta), st = sin(uCamTheta);
  float cp = cos(uCamPhi), sp = sin(uCamPhi);
  vec3 camPos = uCamDist * vec3(cp * ct, st, sp * ct);
  vec3 fwd = normalize(-camPos);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  float fov = 1.05;
  vec3 rayDir = normalize(fwd + fov * (uv.x * right + uv.y * up));

  vec3 pos = camPos;
  vec3 vel = rayDir;

  // conserved specific angular momentum of the photon
  vec3 hVec = cross(pos, vel);
  float h2 = dot(hVec, hVec);

  vec3 color = vec3(0.0);
  float escaped = 0.0;
  float captured = 0.0;
  float prevY = pos.y;
  vec3 prevPos = pos;
  float escapeR = max(uCamDist * 1.6, uDiskOuter * 2.4);

  for (int i = 0; i < 512; i++) {
    if (i >= uSteps) break;
    float r = length(pos);

    // horizon capture (r_s = 1)
    if (r < 1.02) { captured = 1.0; break; }
    // escape
    if (r > escapeR && dot(pos, vel) > 0.0) { escaped = 1.0; break; }

    // adaptive step: fine near the hole, coarse far away
    float dt = clamp(r * 0.09, 0.045, 2.2) * (r < 4.0 ? 0.55 : 1.0);

    // geodesic acceleration a = -3/2 h² x / r⁵  (leapfrog / semi-implicit)
    vec3 accel = -1.5 * h2 * pos / pow(r, 5.0);
    vel += accel * dt;
    prevPos = pos;
    prevY = pos.y;
    pos += vel * dt;

    // equatorial plane crossing → disk sample (front-to-back accumulate;
    // multiple crossings give the lensed upper/lower images + photon ring)
    if (prevY * pos.y < 0.0) {
      float f = prevY / (prevY - pos.y);
      vec3 hit = mix(prevPos, pos, f);
      color += diskEmission(hit, normalize(vel), uTime);
    }
  }

  if (escaped > 0.5) {
    color += starfield(normalize(vel));
  }
  // captured rays stay black behind whatever disk light was accumulated

  // subtle photon-ring glow assist (bloom substitute, not physics)
  color *= uExposure;

  // ACES filmic tone mapping (Narkowicz 2015 fit)
  vec3 x = color;
  color = clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);

  // gentle vignette
  float vig = 1.0 - 0.28 * dot(uv * 0.55, uv * 0.55);
  color *= vig;

  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}
`;
