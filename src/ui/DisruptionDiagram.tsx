/**
 * Two visual companions for "What if it appeared here?":
 *
 *  A. Solar-System disruption diagram (top-down, log-radial scale):
 *     planet orbits turn red & eccentric when they fall outside the Sun's
 *     Hill radius against the intruder; the intruder carries its own
 *     tidal-disruption zone.
 *
 *  B. Night-sky projection: the black hole's shadow (√27·r_s across,
 *     Synge 1966) drawn at true angular scale next to the full Moon
 *     (0.52° ≈ 9.04 mrad), over a mountain silhouette.
 */

import { useMemo } from 'react';
import { PlacementResult } from '../physics/comparison';
import { AU } from '../physics/constants';
import { fmtLength, sig } from '../physics/units';

const PLANETS = [
  { name: 'Earth', au: 1, color: '#7fc4ff' },
  { name: 'Jupiter', au: 5.2, color: '#ffc49a' },
  { name: 'Neptune', au: 30.1, color: '#8ab8ff' },
];

/** log-radial mapping: 0.5 AU → 26 px, 60 AU → 120 px */
function rpx(au: number): number {
  const t = (Math.log10(Math.max(au, 0.5)) - Math.log10(0.5)) / (Math.log10(60) - Math.log10(0.5));
  return 26 + t * 94;
}

export function DisruptionDiagram({ result, massSolar }: { result: PlacementResult; massSolar: number }) {
  const W = 340, HA = 240, HB = 210;
  const cx = W / 2, cy = HA / 2;

  const distAu = result.distanceM / AU;
  const intruderOnMap = distAu <= 60;
  const intruderR = intruderOnMap ? rpx(distAu) : 128;
  const hillAu = result.sunHillRadius / AU;
  const hillPx = Math.min(rpx(Math.max(hillAu, 0.5)), 132);

  // night sky: Moon angular diameter 9.04 mrad → 20 px reference
  const MOON_PX = 20;
  const moonAngular = 9.04e-3;
  const shadowPx = useMemo(() => {
    const px = (result.shadowAngularDiameter / moonAngular) * MOON_PX;
    return Math.min(px, 900); // beyond this it just fills the sky
  }, [result.shadowAngularDiameter]);
  const shadowVisible = shadowPx >= 0.8;

  const stars = useMemo(() => {
    // deterministic star field
    let seed = 42;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    return Array.from({ length: 90 }, () => ({ x: rnd() * W, y: rnd() * (HB - 60), r: 0.4 + rnd() * 1.1, o: 0.3 + rnd() * 0.7 }));
  }, []);

  return (
    <>
      {/* ---------------- Panel A: orbital stability ---------------- */}
      <div className="viz-box">
        <div className="viz-title">Solar-System stability (log scale)</div>
        <div className="viz-stage">
          <svg viewBox={`0 0 ${W} ${HA}`}>
            {/* Sun's shrinking Hill sphere */}
            <circle cx={cx} cy={cy} r={hillPx} fill="rgba(255, 217, 122, 0.05)" stroke="rgba(255, 217, 122, 0.4)" strokeWidth={1} strokeDasharray="3 4" style={{ transition: 'r 0.4s' }} />
            <text x={cx + 4} y={cy - hillPx - 4} fill="rgba(255,217,122,0.75)" fontSize={9.5}>Sun&apos;s sphere of influence</text>

            {/* planet orbits */}
            {PLANETS.map((p) => {
              const stripped = p.au * AU > result.sunHillRadius;
              const r = rpx(p.au);
              return (
                <g key={p.name}>
                  {stripped ? (
                    <ellipse cx={cx + r * 0.18} cy={cy} rx={r * 1.12} ry={r * 0.86} fill="none" stroke="#ff7a6a" strokeWidth={1.3} strokeDasharray="4 4" style={{ transition: 'all 0.4s' }} />
                  ) : (
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={p.color} strokeWidth={1.1} opacity={0.75} />
                  )}
                  <text x={cx + r * (stripped ? 1.14 : 1) * 0.7071 + 3} y={cy - r * 0.7071 - 3} fill={stripped ? '#ff9a8c' : p.color} fontSize={9.5}>{p.name}{stripped ? ' ⚠' : ''}</text>
                </g>
              );
            })}

            {/* Sun */}
            <circle cx={cx} cy={cy} r={5} fill="#ffd97a" />

            {/* intruder */}
            <g style={{ transition: 'transform 0.4s' }} transform={`translate(${cx + intruderR}, ${cy})`}>
              {/* tidal danger zone (scaled cue, grows with mass) */}
              <circle r={Math.min(6 + Math.log10(Math.max(massSolar, 1)) * 2.4, 30)} fill="rgba(255, 80, 60, 0.12)" stroke="rgba(255, 100, 80, 0.5)" strokeWidth={1} strokeDasharray="2 3" />
              <circle r={5.5} fill="#000" stroke="rgba(150, 180, 255, 0.9)" strokeWidth={1.5} />
              {!intruderOnMap && <text x={-30} y={-14} fill="#ff9a8c" fontSize={9.5}>↗ actually {sig(distAu)} AU away</text>}
            </g>
            <text x={cx + intruderR - 26} y={cy + 22} fill="var(--text-faint)" fontSize={9.5}>black hole · {sig(massSolar)} M☉</text>
          </svg>
        </div>
        <div className="viz-caption">
          Orbits outside the Sun&apos;s Hill radius (r_H ≈ d·(M☉/3M)^⅓ = {fmtLength(result.sunHillRadius)}) turn red: the intruder, not the Sun, rules there.
        </div>
      </div>

      {/* ---------------- Panel B: the night sky ---------------- */}
      <div className="viz-box">
        <div className="viz-title">Tonight&apos;s sky, if it were there</div>
        <div className="viz-stage">
          <svg viewBox={`0 0 ${W} ${HB}`}>
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#050915" />
                <stop offset="1" stopColor="#0d1526" />
              </linearGradient>
              <radialGradient id="ringGlow">
                <stop offset="60%" stopColor="rgba(255,190,110,0)" />
                <stop offset="82%" stopColor="rgba(255,190,110,0.85)" />
                <stop offset="100%" stopColor="rgba(255,190,110,0)" />
              </radialGradient>
            </defs>
            <rect width={W} height={HB} fill="url(#skyGrad)" />
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
            ))}

            {/* black hole shadow + Einstein ring glow, true angular scale vs Moon */}
            {shadowVisible ? (
              <g style={{ transition: 'all 0.4s' }}>
                <circle cx={W * 0.4} cy={78} r={(shadowPx / 2) * 1.35} fill="url(#ringGlow)" style={{ transition: 'r 0.4s' }} />
                <circle cx={W * 0.4} cy={78} r={shadowPx / 2} fill="#000" stroke="rgba(255,200,130,0.9)" strokeWidth={Math.min(1.5 + shadowPx * 0.02, 4)} style={{ transition: 'r 0.4s' }} />
              </g>
            ) : (
              <g>
                <circle cx={W * 0.4} cy={78} r={1} fill="#ffd9a8" />
                <text x={W * 0.4 + 8} y={82} fill="var(--text-faint)" fontSize={9.5}>invisible to the naked eye — {sig(result.shadowAngularDiameter * 2.06265e8)} mas</text>
              </g>
            )}

            {/* full Moon reference */}
            <circle cx={W * 0.82} cy={64} r={MOON_PX / 2} fill="#e8e4da" opacity={0.95} />
            <circle cx={W * 0.82 - 3} cy={61} r={2.4} fill="#c9c4b8" />
            <circle cx={W * 0.82 + 4} cy={68} r={1.7} fill="#c9c4b8" />
            <text x={W * 0.82 - 22} y={92} fill="var(--text-faint)" fontSize={9.5}>full Moon (0.52°)</text>

            {/* mountain silhouette */}
            <path d={`M0 ${HB} L0 ${HB - 44} L46 ${HB - 74} L88 ${HB - 50} L132 ${HB - 86} L172 ${HB - 54} L214 ${HB - 70} L258 ${HB - 42} L300 ${HB - 62} L${W} ${HB - 40} L${W} ${HB} Z`} fill="#05070d" />
          </svg>
        </div>
        <div className="viz-caption">
          Shadow diameter √27·r_s at {fmtLength(result.distanceM)} → {sig(result.shadowAngularDiameter / moonAngular)}× the Moon&apos;s angular size. The bright rim is lensed light from stars behind it.
        </div>
      </div>
    </>
  );
}
