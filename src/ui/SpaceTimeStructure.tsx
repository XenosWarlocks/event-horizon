/**
 * Cross-section (poloidal slice) of the Kerr geometry, drawn to scale in
 * gravitational radii r_g = GM/c². Everything is computed from the metric:
 *
 *   horizon      r₊ = r_g (1 + √(1−a*²))                    [MTW §33]
 *   ergosphere   r_E(θ) = r_g (1 + √(1−a*² cos²θ))          [MTW §33.4]
 *   photon sph.  1.5 r_s (Schwarzschild value, dashed)      [MTW §25.6]
 *   ISCO         Bardeen–Press–Teukolsky 1972 formula
 *   singularity  point (a*=0) or ring of radius a*·r_g (a*>0)
 *
 * The shape morphs with the spin slider; the scale bar tracks the mass.
 */

import { useMemo, useState } from 'react';
import { iscoRadiusKerr, kerrHorizonRadius, schwarzschildRadius } from '../physics/blackhole';
import { M_SUN } from '../physics/constants';
import { fmtLength } from '../physics/units';
import { VizBox } from './components';

const TIPS: Record<string, string> = {
  ergosphere:
    'Ergosphere — spacetime here is dragged around faster than light. You cannot stand still, but you can still escape. Energy can be mined from it (Penrose process).',
  horizon:
    'Event horizon (r₊) — the one-way surface. Inside, all futures point toward the singularity. Nothing, including light, returns.',
  photon:
    'Photon sphere (1.5 r_s, non-spinning value) — light itself orbits here. Unstable: a nudge sends photons in or out, creating the bright photon ring.',
  isco:
    'ISCO — innermost stable circular orbit. Gas can orbit no closer; inside this edge it spirals in within a few orbits. Sets the accretion disk\'s inner rim.',
  singularity:
    'Singularity — where curvature diverges in classical GR. With spin it becomes a ring of radius a*·r_g. Widely expected to be resolved by quantum gravity.',
};

export function SpaceTimeStructure({ massSolar, spin }: { massSolar: number; spin: number }) {
  const [tip, setTip] = useState<string | null>(null);

  // geometry in units of r_g, positive-x half; SVG center (0,0)
  const geo = useMemo(() => {
    const m = massSolar * M_SUN;
    const rg = schwarzschildRadius(m) / 2;
    const a = Math.min(spin, 0.998);
    const rPlus = kerrHorizonRadius(m, a) / rg;         // 1..2 r_g
    const isco = iscoRadiusKerr(m, a, true) / rg;       // 1.24..6 r_g
    const photon = 3;                                    // 1.5 r_s = 3 r_g
    // ergosphere polar outline r_E(θ) = 1 + sqrt(1 - a² cos²θ)
    const pts: string[] = [];
    for (let i = 0; i <= 96; i++) {
      const th = (i / 96) * 2 * Math.PI;
      const r = 1 + Math.sqrt(Math.max(0, 1 - a * a * Math.cos(th) * Math.cos(th)));
      pts.push(`${(r * Math.sin(th)).toFixed(3)},${(-r * Math.cos(th)).toFixed(3)}`);
    }
    return { rg, a, rPlus, isco, photon, ergoPath: `M${pts.join('L')}Z` };
  }, [massSolar, spin]);

  const S = 26; // px per r_g
  const W = 340, H = 250;

  return (
    <VizBox
      title="Spacetime structure (to scale, side view)"
      tip={tip}
      caption={
        <>Scale: 1 r_g = GM/c² = <b style={{ color: 'var(--text-dim)' }}>{fmtLength(geo.rg)}</b> at this mass. Hover the regions. Vertical line = spin axis.</>
      }
    >
      <svg viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} onMouseLeave={() => setTip(null)}>
        {/* spin axis + equatorial plane guides */}
        <line x1={0} y1={-H / 2 + 8} x2={0} y2={H / 2 - 8} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
        <line x1={-W / 2 + 8} y1={0} x2={W / 2 - 8} y2={0} stroke="rgba(255,255,255,0.05)" />

        {/* accretion disk from ISCO outward */}
        <g className="viz-region" onMouseEnter={() => setTip(TIPS.isco)}>
          <rect x={geo.isco * S} y={-3.5} width={Math.max(W / 2 - 10 - geo.isco * S, 4)} height={7} rx={3.5} fill="url(#diskGradR)" />
          <rect x={-(W / 2 - 10)} y={-3.5} width={Math.max(W / 2 - 10 - geo.isco * S, 4)} height={7} rx={3.5} fill="url(#diskGradL)" />
          <circle cx={geo.isco * S} cy={0} r={4.5} fill="#ffb46a" />
          <circle cx={-geo.isco * S} cy={0} r={4.5} fill="#ffb46a" />
        </g>

        {/* ergosphere */}
        <g transform={`scale(${S})`} className="viz-region" onMouseEnter={() => setTip(TIPS.ergosphere)}>
          <path d={geo.ergoPath} fill="rgba(160, 106, 255, 0.16)" stroke="rgba(180, 140, 255, 0.55)" strokeWidth={1.4 / S} style={{ transition: 'd 0.2s' }} />
        </g>

        {/* photon sphere (dashed) */}
        <circle
          className="viz-region"
          onMouseEnter={() => setTip(TIPS.photon)}
          cx={0} cy={0} r={geo.photon * S}
          fill="none" stroke="rgba(255, 226, 150, 0.5)" strokeWidth={1.2} strokeDasharray="5 5"
        />

        {/* horizon */}
        <circle
          className="viz-region"
          onMouseEnter={() => setTip(TIPS.horizon)}
          cx={0} cy={0} r={geo.rPlus * S}
          fill="#000" stroke="rgba(120, 160, 255, 0.65)" strokeWidth={1.6}
          style={{ transition: 'r 0.25s' }}
        />

        {/* singularity: point or ring */}
        <g className="viz-region" onMouseEnter={() => setTip(TIPS.singularity)}>
          {geo.a < 0.02 ? (
            <circle cx={0} cy={0} r={2.4} fill="#fff" />
          ) : (
            <ellipse cx={0} cy={0} rx={geo.a * S} ry={Math.max(geo.a * S * 0.22, 1.6)} fill="none" stroke="#fff" strokeWidth={1.6} />
          )}
        </g>

        {/* labels */}
        <text x={geo.rPlus * S + 5} y={-geo.rPlus * S * 0.5} className="viz-label" fill="rgba(120,160,255,0.9)" fontSize={10}>r₊</text>
        <text x={4} y={-(1 + Math.sqrt(1)) * S - 5} fill="rgba(180,140,255,0.9)" fontSize={10}>ergosphere</text>
        <text x={geo.photon * S * 0.72} y={-geo.photon * S * 0.72} fill="rgba(255,226,150,0.8)" fontSize={10}>photon sphere</text>
        <text x={geo.isco * S + 8} y={-8} fill="rgba(255,180,106,0.9)" fontSize={10}>ISCO</text>

        <defs>
          <linearGradient id="diskGradR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,200,120,0.95)" />
            <stop offset="1" stopColor="rgba(255,120,60,0.15)" />
          </linearGradient>
          <linearGradient id="diskGradL" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="rgba(255,120,60,0.15)" />
            <stop offset="1" stopColor="rgba(255,200,120,0.95)" />
          </linearGradient>
        </defs>
      </svg>
    </VizBox>
  );
}
