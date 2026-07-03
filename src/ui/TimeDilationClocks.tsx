/**
 * Einstein's Clocks: a base-station clock far from the hole and an
 * explorer clock at r/r_s. The explorer's hand turns at exactly
 * dτ/dt = √(1 − r_s/r) of the base rate — the same equation the
 * stats panel quotes, now visible. The astronaut and the signal
 * wave redshift as 1+z = 1/√(1−r_s/r).
 */

import { useEffect, useRef } from 'react';
import { mixRGB } from './color';

const W = 340, H = 190;

export function TimeDilationClocks({ rOverRs }: { rOverRs: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rRef = useRef(rOverRs);
  rRef.current = rOverRs;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let baseAngle = 0;
    let expAngle = 0;
    let raf = 0;
    let last = performance.now();

    const drawClock = (x: number, y: number, r: number, angle: number, label: string, dim: number) => {
      ctx.strokeStyle = `rgba(232, 236, 244, ${0.85 * dim + 0.15})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      // ticks
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.strokeStyle = `rgba(154, 164, 184, ${0.5 * dim + 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86);
        ctx.lineTo(x + Math.cos(a) * r * 0.96, y + Math.sin(a) * r * 0.96);
        ctx.stroke();
      }
      // hand
      ctx.strokeStyle = `rgba(106, 165, 255, ${0.9 * dim + 0.1})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle - Math.PI / 2) * r * 0.72, y + Math.sin(angle - Math.PI / 2) * r * 0.72);
      ctx.stroke();
      ctx.fillStyle = `rgba(232, 236, 244, ${dim})`;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + r + 16);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const r = Math.max(rRef.current, 1.0001);
      const factor = Math.sqrt(1 - 1 / r);        // dτ/dt
      const redshift = 1 / factor - 1;             // 1+z − 1

      baseAngle += dt * (Math.PI / 2);             // base: 1 rev / 4 s
      expAngle += dt * (Math.PI / 2) * factor;     // explorer: slowed by GR

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#03050b';
      ctx.fillRect(0, 0, W, H);

      const bx = 62, ex = W - 62, cyC = 74;

      // signal wave between clocks: wavelength stretches by (1+z)
      const lambda = 14 * (1 + Math.min(redshift, 6));
      const amp = 7;
      const waveT = now / 1000;
      const grad = ctx.createLinearGradient(ex, 0, bx, 0);
      const emitCol = mixRGB([1, 1, 1], [1, 0.35, 0.15], Math.min(redshift / 3, 1));
      grad.addColorStop(0, emitCol);
      grad.addColorStop(1, 'rgba(255, 120, 60, 0.75)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = ex - 30; x >= bx + 30; x -= 2) {
        // wavelength grows as the photon climbs out (right → left)
        const frac = (ex - 30 - x) / (ex - bx - 60);
        const localLambda = 14 + (lambda - 14) * frac;
        const phase = ((x / localLambda) * Math.PI * 2) + waveT * 4;
        const y = cyC + Math.sin(phase) * amp;
        if (x === ex - 30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // clocks
      drawClock(bx, cyC, 34, baseAngle, 'Base station (far away)', 1);
      drawClock(ex, cyC, 34, expAngle, `Explorer @ ${r.toFixed(2)} r_s`, Math.max(factor, 0.25));

      // astronaut: redshifted & fading with depth
      const astroCol = mixRGB([1, 1, 1], [0.9, 0.25, 0.1], Math.min(redshift / 2.5, 1), Math.max(factor, 0.15));
      ctx.fillStyle = astroCol;
      ctx.strokeStyle = astroCol;
      ctx.lineWidth = 2;
      const ax = ex, ay = H - 42;
      ctx.beginPath(); ctx.arc(ax, ay - 12, 6, 0, Math.PI * 2); ctx.fill();          // helmet
      ctx.beginPath(); ctx.moveTo(ax, ay - 6); ctx.lineTo(ax, ay + 8); ctx.stroke(); // body
      ctx.beginPath(); ctx.moveTo(ax - 8, ay); ctx.lineTo(ax + 8, ay); ctx.stroke(); // arms
      ctx.beginPath(); ctx.moveTo(ax, ay + 8); ctx.lineTo(ax - 6, ay + 18); ctx.moveTo(ax, ay + 8); ctx.lineTo(ax + 6, ay + 18); ctx.stroke();

      // readout
      ctx.fillStyle = 'rgba(154, 164, 184, 0.95)';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`dτ/dt = ${(factor * 100).toFixed(2)}%   ·   redshift z = ${redshift > 100 ? redshift.toExponential(1) : redshift.toFixed(2)}`, W / 2, H - 12);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="viz-box">
      <div className="viz-title">Einstein&apos;s clocks</div>
      <div className="viz-stage">
        <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: `${W}/${H}` }} />
      </div>
      <div className="viz-caption">
        Both clocks are honest: the explorer&apos;s hand turns at exactly √(1−r_s/r) of the base rate,
        and the radio signal stretches by 1+z as it climbs out of the well — move the distance slider above.
      </div>
    </div>
  );
}
