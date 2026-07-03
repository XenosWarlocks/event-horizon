/**
 * Cosmic Devourer Simulator — the heart of "What If?" mode.
 *
 * A real gravitational simulation (SI units, semi-implicit Euler with
 * adaptive substepping) of a black hole disrupting and swallowing a
 * celestial system at three scales:
 *
 *   A. Near Earth   — Earth–Moon system + satellites vs a stellar-mass hole
 *   B. Solar System — the Sun + 8 planets vs a supermassive hole
 *   C. Galactic Core — S-star cluster orbiting the hole itself
 *
 * Physics implemented (all from the same equations as the stats panels):
 *   - Newtonian gravity from the massive sources (BH, Earth/Sun):
 *       a = -GM r̂ / r²
 *   - First post-Newtonian correction for orbits around the hole,
 *       a_GR = -3 G M h² r̂ / (c² r⁴),  h = |r × v|
 *     which produces the apsidal precession of S-star orbits (Will 1993).
 *   - Tidal disruption at the Roche-type radius for self-gravitating
 *     bodies: r_tide = R_body (2 M_BH / m_body)^(1/3) (Hills 1975).
 *     Small artificial satellites are strength-dominated, not
 *     self-gravity-dominated, so they are exempt (they are swallowed whole).
 *   - Gravitational time dilation dτ/dt = √(1 − r_s/r) slows a body's
 *     proper motion as it approaches the horizon (floored at 3% so the
 *     plunge completes in finite viewing time — marked approximation).
 *   - Redshift rendering: within a few capture radii the body's colour is
 *     blended toward red, then black (infinite redshift at the horizon).
 *   - Ingestion: crossing r_s adds the body's mass to the hole,
 *       M_BH → M_BH + m,  r_s ∝ M_BH  (the horizon visibly swells).
 *
 * Rendering approximations (documented for honesty):
 *   - Region B/C use a radial √-compression so Mercury and Neptune fit in
 *     one frame; physics runs in true coordinates.
 *   - The hole is drawn no smaller than a few pixels; capture is triggered
 *     at that visual radius when it exceeds r_s (the remaining plunge is
 *     below screen resolution and takes seconds anyway).
 */

import { useEffect, useRef, useState } from 'react';
import { G, C, M_SUN, M_EARTH, AU, YEAR } from '../physics/constants';
import { schwarzschildRadius } from '../physics/blackhole';
import { fmtLength, fmtTimeYears, sig } from '../physics/units';
import { LogSlider } from './components';

// ---------------------------------------------------------------- types

interface Vec { x: number; y: number; }

interface Body {
  name: string;
  massKg: number;
  /** physical radius [m] — used for the tidal-disruption radius */
  radiusM: number;
  pos: Vec;
  vel: Vec;
  drawPx: number;
  color: [number, number, number];
  /** gravitational source for other bodies (Earth, Sun) */
  isSource: boolean;
  /** strength-dominated (satellites): exempt from Roche shredding */
  noShred: boolean;
  alive: boolean;
  trail: Vec[];
}

interface Fragment { pos: Vec; vel: Vec; massKg: number; alive: boolean; }
interface Ripple { pos: Vec; t: number; hue: string; }

interface RegionCfg {
  id: string;
  label: string;
  /** reference length [m] and pixels at that length; √ compression flag */
  unitM: number;
  kPx: number;
  sqrtMap: boolean;
  defaultWarp: number;
  warpRange: [number, number];
  /** suggested black hole masses for this scale */
  suggested: Array<{ label: string; massSolar: number }>;
  /** does the hole sit at the centre (C) or fall in from outside (A, B)? */
  bhCentral: boolean;
  build: (bhMassKg: number) => { bodies: Body[]; bhPos: Vec; bhVel: Vec };
}

const W = 356, H = 300;

// ------------------------------------------------------------- helpers

const v = (x: number, y: number): Vec => ({ x, y });

function circularOrbit(parentMass: number, parentPos: Vec, parentVel: Vec, r: number, phase: number): { pos: Vec; vel: Vec } {
  const speed = Math.sqrt((G * parentMass) / r);
  return {
    pos: v(parentPos.x + Math.cos(phase) * r, parentPos.y + Math.sin(phase) * r),
    vel: v(parentVel.x - Math.sin(phase) * speed, parentVel.y + Math.cos(phase) * speed),
  };
}

function body(partial: Partial<Body> & Pick<Body, 'name' | 'massKg' | 'radiusM' | 'pos' | 'vel' | 'drawPx' | 'color'>): Body {
  return { isSource: false, noShred: false, alive: true, trail: [], ...partial };
}

// ------------------------------------------------------------- regions

const PLANETS: Array<[string, number, number, number, [number, number, number]]> = [
  // name, mass kg, semi-major AU, draw px, color
  ['Mercury', 3.301e23, 0.387, 2.2, [200, 190, 180]],
  ['Venus', 4.867e24, 0.723, 3.2, [235, 200, 150]],
  ['Earth', 5.972e24, 1.0, 3.4, [127, 196, 255]],
  ['Mars', 6.417e23, 1.524, 2.6, [255, 140, 100]],
  ['Jupiter', 1.898e27, 5.203, 6.0, [255, 196, 154]],
  ['Saturn', 5.683e26, 9.537, 5.2, [240, 220, 170]],
  ['Uranus', 8.681e25, 19.19, 4.2, [170, 220, 235]],
  ['Neptune', 1.024e26, 30.07, 4.2, [138, 184, 255]],
];

const REGIONS: RegionCfg[] = [
  {
    id: 'earth',
    label: 'Near Earth',
    unitM: 3.844e8, // Moon distance
    kPx: 46,
    sqrtMap: false,
    defaultWarp: 60,
    warpRange: [0.1, 1e6],
    suggested: [
      { label: '10 M☉ stellar', massSolar: 10 },
      { label: '62 M☉ (GW150914 remnant)', massSolar: 62 },
      { label: '100 M☉', massSolar: 100 },
    ],
    bhCentral: false,
    build: () => {
      const earth = body({
        name: 'Earth', massKg: M_EARTH, radiusM: 6.371e6,
        pos: v(0, 0), vel: v(0, 0), drawPx: 9, color: [127, 196, 255], isSource: true,
      });
      const moonOrb = circularOrbit(M_EARTH, earth.pos, earth.vel, 3.844e8, 2.4);
      const moon = body({
        name: 'the Moon', massKg: 7.342e22, radiusM: 1.737e6,
        ...moonOrb, drawPx: 4.4, color: [207, 201, 189],
      });
      const sats = [1.2e8, 1.8e8].map((r, i) => {
        const o = circularOrbit(M_EARTH, earth.pos, earth.vel, r, i * 2.2);
        return body({
          name: `Satellite ${i + 1}`, massKg: 1e4, radiusM: 3,
          ...o, drawPx: 1.4, color: [230, 235, 245], noShred: true,
        });
      });
      // hole drifts in from the right edge, aimed slightly off-centre;
      // the system then free-falls toward it (~30 min of simulated time)
      return { bodies: [earth, moon, ...sats], bhPos: v(3.9 * 3.844e8, -0.8 * 3.844e8), bhVel: v(-250, 40) };
    },
  },
  {
    id: 'solar',
    label: 'Solar System',
    unitM: AU,
    kPx: 24,
    sqrtMap: true,
    defaultWarp: 1e5,
    warpRange: [10, 1e8],
    suggested: [
      { label: 'Sgr A* (4.3×10⁶)', massSolar: 4.297e6 },
      { label: 'M87* (6.5×10⁹)', massSolar: 6.5e9 },
    ],
    bhCentral: false,
    build: () => {
      const sun = body({
        name: 'the Sun', massKg: M_SUN, radiusM: 6.957e8,
        pos: v(0, 0), vel: v(0, 0), drawPx: 7.5, color: [255, 217, 122], isSource: true,
      });
      const planets = PLANETS.map(([name, m, aAu, px, col], i) => {
        const o = circularOrbit(M_SUN, sun.pos, sun.vel, aAu * AU, i * 1.7);
        return body({
          name, massKg: m,
          radiusM: Math.cbrt(m / 5000) * 0.62, // rocky/gas mean density proxy for Roche radius
          ...o, drawPx: px, color: col as [number, number, number],
        });
      });
      return { bodies: [sun, ...planets], bhPos: v(48 * AU, -22 * AU), bhVel: v(-4000, 900) };
    },
  },
  {
    id: 'galactic',
    label: 'Galactic Core',
    unitM: AU,
    kPx: 2.55,
    sqrtMap: true,
    defaultWarp: 1e8,
    warpRange: [1e4, 1e10],
    suggested: [
      { label: 'Sgr A* (4.3×10⁶)', massSolar: 4.297e6 },
      { label: 'TON 618 (4×10¹⁰)', massSolar: 4.07e10 },
    ],
    bhCentral: true,
    build: (bhMassKg) => {
      // S-star-like cluster: eccentric orbits, some plunging
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const bodies: Body[] = [];
      for (let i = 0; i < 16; i++) {
        const aM = (250 + rnd() * 1600) * AU;
        // three deep plungers whose pericentre dips to the danger zone
        const e = i < 3 ? 0.97 + rnd() * 0.025 : 0.3 + rnd() * 0.55;
        const rApo = aM * (1 + e);
        const vApo = Math.sqrt((G * bhMassKg * (1 - e)) / (aM * (1 + e)));
        const phi = rnd() * Math.PI * 2;
        const dir = rnd() > 0.35 ? 1 : -1;
        const mass = (0.8 + rnd() * 14) * M_SUN;
        const tK = 3200 + rnd() * 12000;
        const col: [number, number, number] = tK > 8000 ? [190, 210, 255] : tK > 5500 ? [255, 244, 220] : [255, 190, 140];
        bodies.push(body({
          name: `S${i + 1}`, massKg: mass,
          radiusM: 6.957e8 * Math.pow(mass / M_SUN, 0.57),
          pos: v(Math.cos(phi) * rApo, Math.sin(phi) * rApo),
          vel: v(-Math.sin(phi) * vApo * dir, Math.cos(phi) * vApo * dir),
          drawPx: 1.8 + Math.log10(mass / M_SUN + 1) * 2.2,
          color: col,
        }));
      }
      return { bodies, bhPos: v(0, 0), bhVel: v(0, 0) };
    },
  },
];

// ------------------------------------------------------------ component

export function CosmicDevourer({
  massSolar, onMassChange,
}: {
  massSolar: number;
  onMassChange: (m: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [regionId, setRegionId] = useState('earth');
  const [running, setRunning] = useState(true);
  const [warp, setWarp] = useState(REGIONS[0].defaultWarp);
  const [resetTick, setResetTick] = useState(0);

  const ctl = useRef({ running: true, warp: 60, stepOnce: false });
  ctl.current.running = running;
  ctl.current.warp = warp;

  const region = REGIONS.find((r) => r.id === regionId)!;

  // switching region adopts its natural time warp
  const pickRegion = (id: string) => {
    const r = REGIONS.find((x) => x.id === id)!;
    setRegionId(id);
    setWarp(r.defaultWarp);
  };

  // adopt a scale-appropriate hole when the current mass makes no sense here
  // (e.g. arriving at "Near Earth" with an M87*-mass hole selected: everything
  // would already be inside the horizon before the first frame)
  const SENSIBLE: Record<string, [number, number]> = {
    earth: [3, 1e4], solar: [1e5, 1e11], galactic: [1e6, 1e11],
  };
  useEffect(() => {
    const [lo, hi] = SENSIBLE[regionId];
    if (massSolar < lo || massSolar > hi) {
      onMassChange(REGIONS.find((r) => r.id === regionId)!.suggested[0].massSolar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const cfg = REGIONS.find((r) => r.id === regionId)!;
    let bhMass = massSolar * M_SUN;
    const bhMass0 = bhMass;
    const world = cfg.build(bhMass);
    const bodies = world.bodies;
    const bh = { pos: world.bhPos, vel: world.bhVel };
    const fragments: Fragment[] = [];
    const ripples: Ripple[] = [];
    let simTime = 0;
    let devoured = 0;
    let eventMsg = '';
    let eventUntil = 0;
    let raf = 0;
    let lastNow = performance.now();

    const announce = (msg: string, now: number) => { eventMsg = msg; eventUntil = now + 4200; };

    // ---------- projection (camera follows the primary, then the hole)
    const cam = { x: cfg.bhCentral ? 0 : bodies[0].pos.x, y: cfg.bhCentral ? 0 : bodies[0].pos.y };
    const project = (p: Vec): [number, number] => {
      const dx = p.x - cam.x, dy = p.y - cam.y;
      const r = Math.hypot(dx, dy);
      if (r < 1) return [W / 2, H / 2];
      const rpx = cfg.sqrtMap ? cfg.kPx * Math.sqrt(r / cfg.unitM) : cfg.kPx * (r / cfg.unitM);
      return [W / 2 + (dx / r) * rpx, H / 2 + (dy / r) * rpx];
    };
    const lengthToPx = (m: number) =>
      cfg.sqrtMap ? cfg.kPx * Math.sqrt(m / cfg.unitM) : cfg.kPx * (m / cfg.unitM);
    const pxToLength = (px: number) =>
      cfg.sqrtMap ? cfg.unitM * Math.pow(px / cfg.kPx, 2) : cfg.unitM * (px / cfg.kPx);

    // ---------- physics core
    const accelOn = (p: Vec, vel: Vec, out: Vec) => {
      out.x = 0; out.y = 0;
      // the hole (Newtonian + 1PN precession term)
      {
        const dx = bh.pos.x - p.x, dy = bh.pos.y - p.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);
        if (r > 1) {
          const h = Math.abs((p.x - bh.pos.x) * vel.y - (p.y - bh.pos.y) * vel.x);
          const aN = (G * bhMass) / r2;
          const aGR = (3 * G * bhMass * h * h) / (C * C * r2 * r2);
          const a = aN + aGR;
          out.x += (dx / r) * a; out.y += (dy / r) * a;
        }
      }
      // massive non-BH sources (Earth / Sun)
      for (const s of bodies) {
        if (!s.isSource || !s.alive) continue;
        const dx = s.pos.x - p.x, dy = s.pos.y - p.y;
        const r2 = dx * dx + dy * dy;
        if (r2 < s.radiusM * s.radiusM) continue; // inside the source: skip
        const r = Math.sqrt(r2);
        const a = (G * s.massKg) / r2;
        out.x += (dx / r) * a; out.y += (dy / r) * a;
      }
    };

    const tmpA: Vec = { x: 0, y: 0 };

    const step = (dt: number, now: number) => {
      const rs = schwarzschildRadius(bhMass);
      const captureR = Math.max(rs, pxToLength(6));

      // sources move too (Earth/Sun fall toward the hole)
      for (const b of bodies) {
        if (!b.alive) continue;
        // gravitational time dilation slows proper motion near the horizon
        const rToBh = Math.hypot(b.pos.x - bh.pos.x, b.pos.y - bh.pos.y);
        const dil = rToBh > rs ? Math.max(Math.sqrt(1 - rs / rToBh), 0.03) : 0.03;
        const dtb = dt * dil;
        accelOn(b.pos, b.vel, tmpA);
        b.vel.x += tmpA.x * dtb; b.vel.y += tmpA.y * dtb;
        b.pos.x += b.vel.x * dtb; b.pos.y += b.vel.y * dtb;
      }
      // the hole is nudged by the massive sources (momentum exchange cue)
      for (const s of bodies) {
        if (!s.isSource || !s.alive) continue;
        const dx = s.pos.x - bh.pos.x, dy = s.pos.y - bh.pos.y;
        const r2 = dx * dx + dy * dy; const r = Math.sqrt(r2);
        if (r < 1) continue;
        const a = (G * s.massKg) / r2;
        bh.vel.x += (dx / r) * a * dt; bh.vel.y += (dy / r) * a * dt;
      }
      bh.pos.x += bh.vel.x * dt; bh.pos.y += bh.vel.y * dt;

      // fragments: test particles around the hole
      for (const f of fragments) {
        if (!f.alive) continue;
        const dx = bh.pos.x - f.pos.x, dy = bh.pos.y - f.pos.y;
        const r2 = dx * dx + dy * dy; const r = Math.sqrt(r2);
        if (r < captureR) {
          f.alive = false;
          bhMass += f.massKg; // conservation: the stream feeds the hole
          continue;
        }
        const a = (G * bhMass) / r2;
        f.vel.x += (dx / r) * a * dt; f.vel.y += (dy / r) * a * dt;
        f.pos.x += f.vel.x * dt; f.pos.y += f.vel.y * dt;
      }

      // disruption & ingestion checks
      for (const b of bodies) {
        if (!b.alive) continue;
        const r = Math.hypot(b.pos.x - bh.pos.x, b.pos.y - bh.pos.y);

        if (r < captureR) {
          b.alive = false;
          devoured++;
          bhMass += b.massKg;
          ripples.push({ pos: { ...bh.pos }, t: 0, hue: '255,190,110' });
          const rTide = b.radiusM * Math.cbrt((2 * bhMass) / b.massKg);
          announce(
            rTide < rs && !b.noShred
              ? `${b.name} crossed the horizon INTACT — tides were too gentle to tear it first`
              : `${b.name} devoured — the horizon grows to ${fmtLength(schwarzschildRadius(bhMass))}`,
            now,
          );
          continue;
        }

        // Roche-type tidal disruption for self-gravitating bodies
        if (!b.noShred) {
          const rTide = b.radiusM * Math.cbrt((2 * bhMass) / b.massKg);
          if (r < rTide && rTide > captureR * 1.05) {
            b.alive = false;
            ripples.push({ pos: { ...b.pos }, t: 0, hue: '255,120,60' });
            announce(`${b.name} spaghettified at r = ${fmtLength(r)} — outside the horizon (r_s = ${fmtLength(rs)})`, now);
            // the body shears into a tidal stream
            const n = 14;
            const speed = Math.hypot(b.vel.x, b.vel.y) || 1;
            const tx = b.vel.x / speed, ty = b.vel.y / speed;
            for (let i = 0; i < n; i++) {
              const off = (i / (n - 1) - 0.5) * 2;
              fragments.push({
                pos: v(b.pos.x + tx * off * b.radiusM * 4, b.pos.y + ty * off * b.radiusM * 4),
                vel: v(b.vel.x * (1 + off * 0.045), b.vel.y * (1 + off * 0.045)),
                massKg: b.massKg / n,
                alive: true,
              });
            }
          }
        }
      }
    };

    // ---------- render
    const draw = (now: number) => {
      const rs = schwarzschildRadius(bhMass);
      const captureR = Math.max(rs, pxToLength(6));

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#03050b';
      ctx.fillRect(0, 0, W, H);

      // camera: track primary while alive, else the hole
      const primary = cfg.bhCentral ? null : bodies[0];
      const target = primary && primary.alive ? primary.pos : bh.pos;
      cam.x += (target.x - cam.x) * 0.06;
      cam.y += (target.y - cam.y) * 0.06;

      // trails
      for (const b of bodies) {
        if (b.trail.length < 2) continue;
        ctx.beginPath();
        for (let i = 0; i < b.trail.length; i++) {
          const [x, y] = project(b.trail[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0.22)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // fragments (tidal streams — magma-hot debris)
      for (const f of fragments) {
        if (!f.alive) continue;
        const [x, y] = project(f.pos);
        ctx.fillStyle = 'rgba(255, 150, 70, 0.85)';
        ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
      }

      // bodies with stretch + redshift
      for (const b of bodies) {
        if (!b.alive) continue;
        const [x, y] = project(b.pos);
        const rBh = Math.hypot(b.pos.x - bh.pos.x, b.pos.y - bh.pos.y);

        // redshift: natural → red → black approaching the capture radius
        let [cr, cg, cb] = b.color;
        const zone = 4 * captureR;
        if (rBh < zone) {
          const t = Math.min(Math.max((zone - rBh) / (zone - captureR), 0), 1);
          if (t < 0.6) {
            const k = t / 0.6;
            cr = cr + (255 - cr) * k; cg = cg * (1 - k * 0.75); cb = cb * (1 - k * 0.9);
          } else {
            const k = (t - 0.6) / 0.4;
            cr = 255 * (1 - k); cg = cg * 0.25 * (1 - k); cb = 0;
          }
        }

        // tidal stretch: elongate toward the hole as r → r_tide
        let stretch = 1;
        if (!b.noShred) {
          const rTide = b.radiusM * Math.cbrt((2 * bhMass) / b.massKg);
          if (rBh < 2.6 * rTide) stretch = 1 + Math.min((2.6 * rTide / rBh - 1) * 1.4, 2.6);
        }
        const ang = Math.atan2(bh.pos.y - b.pos.y, bh.pos.x - b.pos.x);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.scale(stretch, 1 / Math.sqrt(stretch));
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, b.drawPx * 2.2);
        glow.addColorStop(0, `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, 0.95)`);
        glow.addColorStop(0.55, `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, 0.5)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, b.drawPx * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${cr | 0}, ${cg | 0}, ${cb | 0})`;
        ctx.beginPath();
        ctx.arc(0, 0, b.drawPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += 1 / 60;
        if (rp.t > 1.3) { ripples.splice(i, 1); continue; }
        const [x, y] = project(rp.pos);
        ctx.strokeStyle = `rgba(${rp.hue}, ${0.8 * (1 - rp.t / 1.3)})`;
        ctx.lineWidth = 2 * (1 - rp.t / 1.5);
        ctx.beginPath();
        ctx.arc(x, y, rp.t * 46, 0, Math.PI * 2);
        ctx.stroke();
      }

      // the hole: accretion glow + photon ring + horizon disc
      {
        const [x, y] = project(bh.pos);
        const rPx = Math.max(lengthToPx(rs), 6);
        const swell = 1 + Math.max((bhMass / bhMass0 - 1) * 8, 0); // exaggerated cue for tiny gains
        const drawR = Math.min(rPx * Math.min(swell, 1.35), 150);
        const glow = ctx.createRadialGradient(x, y, drawR * 0.7, x, y, drawR * 3);
        glow.addColorStop(0, 'rgba(255, 175, 95, 0.5)');
        glow.addColorStop(0.35, 'rgba(255, 120, 60, 0.16)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, drawR * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, drawR * 1.12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 205, 140, 0.95)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
      }

      // HUD
      ctx.font = '10.5px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(154, 164, 184, 0.95)';
      ctx.fillText(`t = ${fmtTimeYears(simTime / YEAR)}`, 10, 18);
      ctx.fillText(`devoured: ${devoured}`, 10, 33);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(207, 224, 255, 0.95)';
      ctx.fillText(`M = ${sig(bhMass / M_SUN)} M☉`, W - 10, 18);
      ctx.fillText(`r_s = ${fmtLength(rs)}`, W - 10, 33);

      if (now < eventUntil && eventMsg) {
        ctx.textAlign = 'center';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 190, 130, 0.95)';
        const pad = Math.min(1, (eventUntil - now) / 600);
        ctx.globalAlpha = pad;
        ctx.fillText(eventMsg, W / 2, H - 14, W - 24);
        ctx.globalAlpha = 1;
      }
    };

    // ---------- main loop with adaptive substepping
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dtReal = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;

      const { running: run, warp: wp, stepOnce } = ctl.current;
      if (run || stepOnce) {
        ctl.current.stepOnce = false;
        let dtSim = wp * (stepOnce && !run ? 1 / 60 : dtReal);

        // stability: substep so no body moves a large fraction of its
        // local dynamical time sqrt(r³/GM) per step
        let minDyn = Infinity;
        for (const b of bodies) {
          if (!b.alive) continue;
          const rB = Math.hypot(b.pos.x - bh.pos.x, b.pos.y - bh.pos.y);
          minDyn = Math.min(minDyn, Math.sqrt(Math.pow(Math.max(rB, 1), 3) / (G * bhMass)));
          for (const s of bodies) {
            if (!s.isSource || s === b || !s.alive) continue;
            const rP = Math.hypot(b.pos.x - s.pos.x, b.pos.y - s.pos.y);
            minDyn = Math.min(minDyn, Math.sqrt(Math.pow(Math.max(rP, 1), 3) / (G * s.massKg)));
          }
        }
        const steps = Math.min(Math.max(Math.ceil(dtSim / (0.02 * minDyn)), 1), 2500);
        const h = dtSim / steps;
        for (let i = 0; i < steps; i++) step(h, now);
        simTime += dtSim;

        // trails (world coordinates, drawn through the projector);
        // dead bodies' trails drain away instead of lingering
        for (const b of bodies) {
          if (b.alive) {
            b.trail.push({ ...b.pos });
            if (b.trail.length > 46) b.trail.shift();
          } else if (b.trail.length) {
            b.trail.splice(0, 2);
          }
        }
      }
      draw(now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // rebuild the world when the region, hole mass, or reset button changes
  }, [regionId, massSolar, resetTick]);

  return (
    <div className="viz-box">
      <div className="viz-title">Cosmic Devourer — live gravitational simulation</div>

      <div className="chips" style={{ marginBottom: 10 }}>
        {REGIONS.map((r) => (
          <button key={r.id} className={`chip ${r.id === regionId ? 'active' : ''}`} onClick={() => pickRegion(r.id)}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="viz-stage">
        <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} />
      </div>

      <div className="sim-controls">
        <button className="action-btn" onClick={() => setRunning(!running)}>
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button className="action-btn" onClick={() => { ctl.current.stepOnce = true; }} disabled={running}>
          ⏭ Step
        </button>
        <button className="action-btn" onClick={() => setResetTick((t) => t + 1)}>
          ↺ Reset
        </button>
      </div>

      <LogSlider
        label="Time warp"
        value={Math.min(Math.max(warp, region.warpRange[0]), region.warpRange[1])}
        min={region.warpRange[0]}
        max={region.warpRange[1]}
        onChange={setWarp}
        format={(v) => `${sig(v)}×`}
      />
      <div className="viz-caption" style={{ marginTop: 0 }}>
        1 second of viewing ≈ {fmtTimeYears(warp / YEAR)} of simulated time.
      </div>

      <div className="chips" style={{ marginTop: 8 }}>
        {region.suggested.map((s) => (
          <button
            key={s.label}
            className={`chip ${Math.abs(Math.log10(s.massSolar / massSolar)) < 0.02 ? 'active' : ''}`}
            onClick={() => onMassChange(s.massSolar)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="viz-caption">
        Real Newtonian + first-order GR gravity in SI units. Tearing happens at the Hills/Roche radius
        r_tide = R·(2M/m)^⅓; bodies inside 2 r_s redshift to black and stall (dτ/dt = √(1−r_s/r), floored at 3% so
        the plunge completes). Distances use a √ zoom at the larger scales; capture triggers at the drawn hole
        when the true horizon is below pixel size. Every devoured mass grows M and r_s.
      </div>
    </div>
  );
}
