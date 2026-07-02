/**
 * Earth Comparison Mode — "What if this object appeared here?"
 * Uses physics/comparison.ts; every number is derived, the verdict is
 * decided by computed thresholds, not vibes.
 */

import { useMemo, useState } from 'react';
import { evaluatePlacement, PLACEMENTS } from '../physics/comparison';
import { fmtLength, sig } from '../physics/units';
import { StatRow, LogSlider, Equation } from './components';

export function ComparisonPanel({ massSolar, onMassChange }: { massSolar: number; onMassChange: (m: number) => void }) {
  const [placeId, setPlaceId] = useState('pluto');
  const place = PLACEMENTS.find((p) => p.id === placeId)!;
  const result = useMemo(() => evaluatePlacement(massSolar, place.distanceM), [massSolar, place]);

  // Moon's angular diameter for comparison: 2 × 1737 km / 384,400 km ≈ 9.04 mrad
  const moonAngular = 9.04e-3;
  const shadowVsMoon = result.shadowAngularDiameter / moonAngular;

  return (
    <div className="panel-scroll">
      <h2>What if it appeared here?</h2>
      <p className="subtitle">
        Place a black hole near the Solar System and let the equations decide
        what happens to Earth.
      </p>

      <h3>Black hole mass</h3>
      <LogSlider
        label="Mass"
        value={massSolar}
        min={3}
        max={1e11}
        onChange={onMassChange}
        format={(v) => `${sig(v)} M☉`}
      />

      <h3>Placement</h3>
      <div className="chips">
        {PLACEMENTS.map((p) => (
          <button key={p.id} className={`chip ${p.id === placeId ? 'active' : ''}`} onClick={() => setPlaceId(p.id)}>
            {p.label.replace('At the ', '').replace('At ', '')}
          </button>
        ))}
      </div>

      <div className={`verdict ${result.earthSurvives && result.solarSystemBound && result.pullVsSun < 1 ? 'good' : 'bad'}`}>
        {result.verdict}
      </div>

      <h3>The numbers</h3>
      <StatRow k="Distance" v={fmtLength(result.distanceM)} />
      <StatRow
        k="Its pull on Earth vs the Sun's"
        v={`${sig(result.pullVsSun)}×`}
        tone={result.pullVsSun > 1 ? 'warn' : result.pullVsSun > 0.01 ? 'accent' : 'ok'}
      />
      <StatRow
        k="Tides vs the Moon's tides"
        v={`${sig(result.tideVsMoon)}×`}
        tone={result.tideVsMoon > 1000 ? 'warn' : undefined}
      />
      <StatRow
        k="Shadow size in our sky"
        v={shadowVsMoon > 0.01 ? `${sig(shadowVsMoon)}× the full Moon` : `${sig(result.shadowAngularDiameter * 2.063e8)} milliarcsec`}
      />
      <StatRow
        k="Earth clock rate (its gravity alone)"
        v={`${(result.timeDilation * 100).toFixed(6)}%`}
      />
      <StatRow
        k="Sun's sphere of influence shrinks to"
        v={fmtLength(result.sunHillRadius)}
        tone={result.solarSystemBound ? 'ok' : 'warn'}
      />
      <StatRow k="Earth survives?" v={result.earthSurvives ? 'Yes' : 'No'} tone={result.earthSurvives ? 'ok' : 'warn'} />
      <StatRow k="Solar System stays bound?" v={result.solarSystemBound ? 'Yes' : 'No'} tone={result.solarSystemBound ? 'ok' : 'warn'} />

      <div className="edu">
        <b>Misconception check.</b> Black holes are not cosmic vacuum cleaners.
        Replace the Sun with a 1 M☉ black hole and Earth&rsquo;s orbit would not
        change at all — gravity depends on mass and distance, not on what the
        mass is. Danger only begins when you get <i>close</i>.
      </div>

      <h3>Behind the verdict</h3>
      <Equation cite="Newtonian tide across Earth's diameter">Δa = 2GM·R⊕ / d³</Equation>
      <Equation cite="Hamilton & Burns 1992 — three-body stability">r_Hill ≈ d · (M☉ / 3M)^⅓</Equation>
      <Equation cite="Synge 1966, MNRAS 131 — shadow impact parameter">b_shadow = (√27/2) · r_s</Equation>
    </div>
  );
}
