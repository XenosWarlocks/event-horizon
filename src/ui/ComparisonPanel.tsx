/**
 * "What If?" mode — the Cosmic Devourer Simulator.
 *
 * The live gravitational simulation is the main event; below it, the
 * placement analyser answers "what if it appeared at distance X?" with
 * the same physics engine (physics/comparison.ts). The mass slider is
 * shared: it sets both the intruder in the simulation and the object
 * being analysed.
 */

import { useMemo, useState } from 'react';
import { evaluatePlacement, PLACEMENTS } from '../physics/comparison';
import { fmtLength, sig } from '../physics/units';
import { StatRow, LogSlider, Equation } from './components';
import { CosmicDevourer } from './CosmicDevourer';
import { DisruptionDiagram } from './DisruptionDiagram';

export function ComparisonPanel({ massSolar, onMassChange }: { massSolar: number; onMassChange: (m: number) => void }) {
  const [placeId, setPlaceId] = useState('pluto');
  const place = PLACEMENTS.find((p) => p.id === placeId)!;
  const result = useMemo(() => evaluatePlacement(massSolar, place.distanceM), [massSolar, place]);

  // Moon's angular diameter for comparison: 2 × 1737 km / 384,400 km ≈ 9.04 mrad
  const moonAngular = 9.04e-3;
  const shadowVsMoon = result.shadowAngularDiameter / moonAngular;

  return (
    <div className="panel-scroll">
      <h2>What if it came for us?</h2>
      <p className="subtitle">
        Drop a black hole into a real system and watch gravity do the rest —
        then check the numbers below.
      </p>

      <h3>Black hole mass</h3>
      <LogSlider
        label="Mass (drives the simulation and the analysis)"
        value={massSolar}
        min={3}
        max={1e11}
        onChange={onMassChange}
        format={(v) => `${sig(v)} M☉`}
      />

      <CosmicDevourer massSolar={massSolar} onMassChange={onMassChange} />

      <div className="edu">
        <b>Watch for the difference.</b> A stellar-mass hole shreds the Moon into a
        glowing tidal stream long before anything reaches the horizon — its Roche
        radius lies far <i>outside</i> r_s. A supermassive hole is the opposite:
        Earth would cross M87*&rsquo;s horizon intact, redshifting to black, because
        r_tide sits <i>inside</i> the horizon. Same equations, opposite deaths.
      </div>

      <h3>Placement analysis</h3>
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

      <DisruptionDiagram result={result} massSolar={massSolar} />

      <div className="edu">
        <b>Misconception check.</b> Black holes are not cosmic vacuum cleaners.
        Replace the Sun with a 1 M☉ black hole and Earth&rsquo;s orbit would not
        change at all — gravity depends on mass and distance, not on what the
        mass is. Danger only begins when you get <i>close</i>.
      </div>

      <h3>Behind the verdict</h3>
      <Equation cite="Newtonian tide across Earth's diameter">Δa = 2GM·R⊕ / d³</Equation>
      <Equation cite="Hills 1975 — tidal disruption radius">r_tide = R·(2M/m)^⅓</Equation>
      <Equation cite="Hamilton & Burns 1992 — three-body stability">r_Hill ≈ d · (M☉ / 3M)^⅓</Equation>
      <Equation cite="Synge 1966, MNRAS 131 — shadow impact parameter">b_shadow = (√27/2) · r_s</Equation>
    </div>
  );
}
