/**
 * Live orbital view of the N-Suns cluster.
 *
 * A representative sample of stars orbits the barycentre with Keplerian
 * shear (ω ∝ r^-3/2). The physics *driving the visuals* comes from the
 * ClusterModel: the compression slider shrinks orbits and boosts speeds as
 * v ∝ R^(-1/2) (virial theorem); when the model's collision time drops
 * below ~1 Myr, merger flashes fire at the model's actual collision rate
 * scale; when R < r_s the horizon appears and stars spiral in.
 *
 * The star count on screen is a sampled representation (you cannot draw
 * 10⁹ sprites in a panel) — all *rates and thresholds* are the real ones.
 */

import { useEffect, useRef } from 'react';
import { ClusterModel } from '../physics/cluster';

interface Star {
  angle: number;
  /** orbit radius as fraction of cluster radius (0..1), 3D-ish via depth */
  u: number;
  depth: number; // -1..1 flattening for pseudo-3D
  size: number;
  hue: number; // 0 = white-yellow, 1 = merged blue giant
  dead: boolean;
  spiral: number; // 0 = orbiting, >0 = fraction of infall progress
}

interface Ripple { x: number; y: number; t: number; }

const N_DISPLAY = 130;
const W = 356, H = 240;

export function ClusterCollapse({ model, logCompress }: { model: ClusterModel; logCompress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ model, logCompress });
  stateRef.current = { model, logCompress };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const stars: Star[] = Array.from({ length: N_DISPLAY }, () => ({
      angle: Math.random() * Math.PI * 2,
      u: Math.pow(Math.random(), 0.6), // denser toward the core
      depth: Math.random() * 2 - 1,
      size: 0.7 + Math.random() * 1.1,
      hue: 0,
      dead: false,
      spiral: 0,
    }));
    const ripples: Ripple[] = [];
    let bhRadius = 0; // rendered horizon radius, eased
    let lastFlash = 0;
    let raf = 0;
    let t = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { model: m, logCompress: lc } = stateRef.current;
      t += 1 / 60;

      // cluster radius on screen shrinks smoothly with compression (log-eased)
      const Rpx = 100 * (1 - (lc / 6) * 0.82);
      // virial speed-up: v ∝ 1/√R → ω visual multiplier (log-tamed for watchability)
      const speedMult = Math.pow(10, lc * 0.22);
      const colliding = m.collisionTimeYr < 1e6;
      const isBH = m.isBlackHole;
      const targetBh = isBH ? Math.max(8, (1 / Math.max(m.radiusOverSchwarzschild, 0.2)) * Rpx * 0.35) : 0;
      bhRadius += (Math.min(targetBh, 60) - bhRadius) * 0.04;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(2, 4, 10, 0.9)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;

      // faint cluster halo
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rpx * 1.2);
      halo.addColorStop(0, `rgba(120, 150, 255, ${colliding ? 0.12 : 0.06})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      // merger flashes at a rate reflecting the physics regime
      if (colliding && t - lastFlash > (m.collisionTimeYr < 1e3 ? 0.35 : 1.1)) {
        lastFlash = t;
        const victims = stars.filter((s) => !s.dead && s.spiral === 0 && s.u < 0.5);
        if (victims.length > 2) {
          const a = victims[Math.floor(Math.random() * victims.length)];
          const b = victims[Math.floor(Math.random() * victims.length)];
          if (a !== b) {
            b.dead = true;
            a.size = Math.min(a.size * 1.35, 4.2);
            a.hue = Math.min(a.hue + 0.45, 1);
            const r = a.u * Rpx;
            ripples.push({ x: cx + Math.cos(a.angle) * r, y: cy + Math.sin(a.angle) * r * 0.62, t: 0 });
          }
        }
      }

      // stars
      for (const s of stars) {
        if (s.dead) continue;
        const rFrac = Math.max(s.u, 0.06);
        // Keplerian shear: ω ∝ r^{-3/2}, plus global virial speed-up
        s.angle += (0.25 * speedMult * Math.pow(rFrac, -1.5)) / 60;

        // horizon swallows: stars inside 2.2× horizon begin an inward spiral
        let r = rFrac * Rpx;
        if (bhRadius > 2 && r < bhRadius * 2.6) s.spiral = Math.min(s.spiral + 0.012, 1);
        if (s.spiral > 0) {
          s.u *= 0.985;
          s.angle += 0.06; // ISCO speed-up
          r = Math.max(s.u, 0.01) * Rpx;
          if (r <= bhRadius * 0.55) { s.dead = true; continue; }
        }

        const x = cx + Math.cos(s.angle) * r;
        const y = cy + Math.sin(s.angle) * r * 0.62; // inclination
        const bright = 0.55 + 0.45 * Math.sin(s.depth * 3 + s.angle);

        // velocity vector (longer = faster)
        const vLen = Math.min(2 + speedMult * Math.pow(rFrac, -0.5) * 1.1, 16);
        const vx = -Math.sin(s.angle) * vLen;
        const vy = Math.cos(s.angle) * vLen * 0.62;
        ctx.strokeStyle = `rgba(140, 170, 255, ${0.25 * bright})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + vx, y + vy);
        ctx.stroke();

        // star dot: merged giants are big and blue
        const cr = Math.round(255 - s.hue * 120);
        const cg = Math.round(240 - s.hue * 40);
        ctx.fillStyle = `rgba(${cr}, ${cg}, 255, ${0.5 + 0.5 * bright})`;
        ctx.beginPath();
        ctx.arc(x, y, s.size * (1 + s.hue * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      // ripples (merger shockwaves)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += 1 / 60;
        if (rp.t > 1.2) { ripples.splice(i, 1); continue; }
        const rr = rp.t * 34;
        ctx.strokeStyle = `rgba(255, ${Math.round(190 - rp.t * 90)}, 90, ${0.7 * (1 - rp.t / 1.2)})`;
        ctx.lineWidth = 1.6 * (1 - rp.t / 1.4);
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // event horizon
      if (bhRadius > 1) {
        const glow = ctx.createRadialGradient(cx, cy, bhRadius * 0.6, cx, cy, bhRadius * 2.4);
        glow.addColorStop(0, 'rgba(255, 170, 90, 0.35)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.strokeStyle = 'rgba(150, 180, 255, 0.7)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // respawn budget: keep the view alive at low compression
      if (!isBH && !colliding) {
        for (const s of stars) {
          if (s.dead && Math.random() < 0.002) { s.dead = false; s.u = Math.pow(Math.random(), 0.6); s.hue = 0; s.size = 0.7 + Math.random() * 1.1; s.spiral = 0; }
        }
      }
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const m = model;
  const card = m.isBlackHole
    ? { text: 'Event horizon formed — R < r_s', calm: false }
    : m.virialBeta > 0.3
      ? { text: 'General-relativistic instability!', calm: false }
      : m.collisionTimeYr < 1e6
        ? { text: 'Runaway stellar collisions!', calm: false }
        : m.coreCollapseTimeYr < 13.8e9
          ? { text: 'Core collapse underway', calm: false }
          : { text: 'Stable orbits — held up by angular momentum', calm: true };

  return (
    <div className="viz-box">
      <div className="viz-title">Live cluster dynamics (sampled view)</div>
      <div className="viz-stage">
        <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} />
        <div className={`overlay-card ${card.calm ? 'calm' : ''}`}>{card.text}</div>
      </div>
      <div className="viz-caption">
        {N_DISPLAY} sampled stars stand in for {m.nStars.toExponential(0).replace('e+', '×10^')} —
        speeds, collision rate and the horizon threshold follow the computed model. Vectors show orbital velocity.
      </div>
    </div>
  );
}
