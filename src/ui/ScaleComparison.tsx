/**
 * Side-by-side scale overlay: the selected black hole's event-horizon
 * diameter next to the closest-matching familiar landmark (city → Sun →
 * planetary orbits). The reference is auto-picked so both circles are
 * drawable, and the exact ratio is always printed — the drawing is honest.
 */

import { useMemo } from 'react';
import { schwarzschildRadius } from '../physics/blackhole';
import { M_SUN, AU } from '../physics/constants';
import { fmtLength, sig } from '../physics/units';

interface Ref { name: string; diameterM: number; color: string; }

const REFS: Ref[] = [
  { name: 'Manhattan (length)', diameterM: 2.15e4, color: '#9fe0a8' },
  { name: 'Mount Everest (height)', diameterM: 8.8e3, color: '#9fe0a8' },
  { name: 'Earth', diameterM: 1.2742e7, color: '#7fc4ff' },
  { name: 'The Sun', diameterM: 1.391e9, color: '#ffd97a' },
  { name: "Mercury's orbit", diameterM: 2 * 0.387 * AU, color: '#d9b8ff' },
  { name: "Earth's orbit", diameterM: 2 * AU, color: '#7fc4ff' },
  { name: "Jupiter's orbit", diameterM: 2 * 5.2 * AU, color: '#ffc49a' },
  { name: "Neptune's orbit", diameterM: 2 * 30.1 * AU, color: '#8ab8ff' },
  { name: "Pluto's orbit", diameterM: 2 * 39.5 * AU, color: '#c5cee0' },
];

export function ScaleComparison({ name, massSolar }: { name: string; massSolar: number }) {
  const { bhD, ref, ratio } = useMemo(() => {
    const bhD = 2 * schwarzschildRadius(massSolar * M_SUN);
    // pick the reference closest in log-size, biased so the BH stays visible
    let best = REFS[0];
    let bestScore = Infinity;
    for (const r of REFS) {
      const score = Math.abs(Math.log10(bhD / r.diameterM));
      if (score < bestScore) { bestScore = score; best = r; }
    }
    return { bhD, ref: best, ratio: bhD / best.diameterM };
  }, [massSolar]);

  // draw: larger of the two gets radius 78px, the other scales linearly
  // (floor of 2px so a tiny circle stays visible; the label carries the truth)
  const RMAX = 78;
  const bhR = ratio >= 1 ? RMAX : Math.max(RMAX * ratio, 2);
  const refR = ratio >= 1 ? Math.max(RMAX / ratio, 2) : RMAX;
  const W = 340, H = 200;

  return (
    <div className="viz-box">
      <div className="viz-title">How big is it, really?</div>
      <div className="viz-stage">
        <svg viewBox={`0 0 ${W} ${H}`}>
          {/* black hole: shadow disc + photon ring */}
          <g style={{ transition: 'all 0.5s' }}>
            <circle cx={W * 0.28} cy={H / 2} r={bhR * 1.06 + 1.5} fill="none" stroke="rgba(255, 190, 110, 0.8)" strokeWidth={2}
              style={{ transition: 'r 0.5s' }} />
            <circle cx={W * 0.28} cy={H / 2} r={bhR} fill="#000" stroke="rgba(130,160,255,0.5)" strokeWidth={1}
              style={{ transition: 'r 0.5s' }} />
          </g>
          {/* reference object */}
          <circle cx={W * 0.74} cy={H / 2} r={refR} fill="none" stroke={ref.color} strokeWidth={2}
            strokeDasharray={ref.name.includes('orbit') ? '5 4' : undefined}
            style={{ transition: 'r 0.5s' }} />
          {ref.name.includes('orbit') && (
            <circle cx={W * 0.74} cy={H / 2} r={2.5} fill="#ffd97a" />
          )}
        </svg>
      </div>
      <div className="scale-legend">
        <div className="item"><b>{name}</b>event horizon · {fmtLength(bhD)}</div>
        <div className="item"><b>{ref.name}</b>{fmtLength(ref.diameterM)}</div>
      </div>
      <div className="viz-caption">
        The horizon is {ratio >= 1 ? `${sig(ratio)}× wider than` : `${sig(1 / ratio)}× smaller than`} {ref.name.toLowerCase()} — drawn to relative scale.
      </div>
    </div>
  );
}
