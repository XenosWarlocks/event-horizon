/**
 * Educational layer: interactive stellar-fate calculator, a time-dilation
 * explorer, and misconception-busting cards with the underlying equations.
 */

import { useMemo, useState } from 'react';
import { stellarFate, mainSequenceLifetimeYears, mainSequenceLuminosity, mainSequenceRadius, effectiveTemperature, coreTemperature } from '../physics/stellar';
import { timeDilationFactor, schwarzschildRadius } from '../physics/blackhole';
import { M_SUN } from '../physics/constants';
import { fmtTimeYears, fmtTemp, sig } from '../physics/units';
import { StatRow, LogSlider, LinSlider, Equation } from './components';
import { StellarEvolutionLab } from './StellarEvolutionLab';
import { TimeDilationClocks } from './TimeDilationClocks';

const REMNANT_LABEL: Record<string, string> = {
  'white-dwarf': 'White Dwarf',
  'neutron-star': 'Neutron Star',
  'black-hole': 'Black Hole',
  'pair-instability-no-remnant': 'Nothing — total disruption',
  'direct-collapse-black-hole': 'Black Hole (direct collapse)',
};

export function LearnPanel() {
  const [zams, setZams] = useState(25);
  const [rOverRs, setROverRs] = useState(3);

  const fate = useMemo(() => stellarFate(zams), [zams]);
  const lum = mainSequenceLuminosity(zams);
  const rad = mainSequenceRadius(zams);
  const dilation = timeDilationFactor(M_SUN, rOverRs * schwarzschildRadius(M_SUN));

  return (
    <div className="panel-scroll">
      <h2>Learn the Physics</h2>
      <p className="subtitle">Interactive derivations — move the sliders and watch the universe obey the equations.</p>

      <h3>1 · A star's destiny is set by its birth mass</h3>
      <LogSlider
        label="Star's initial (ZAMS) mass"
        value={zams}
        min={0.1}
        max={1000}
        onChange={setZams}
        format={(v) => `${sig(v)} M☉`}
      />
      <StatRow k="Main-sequence luminosity" v={`${sig(lum)} L☉`} />
      <StatRow k="Surface temperature" v={fmtTemp(effectiveTemperature(lum, rad))} />
      <StatRow k="Core temperature (virial est.)" v={fmtTemp(coreTemperature(zams, rad))} />
      <StatRow k="Main-sequence lifetime" v={fmtTimeYears(mainSequenceLifetimeYears(zams))} tone="accent" />
      <StatRow k="Final remnant" v={REMNANT_LABEL[fate.remnant]} tone={fate.remnant.includes('black-hole') ? 'warn' : 'ok'} />
      {fate.remnantMassSolar > 0 && <StatRow k="Remnant mass" v={`${sig(fate.remnantMassSolar)} M☉`} />}
      <div className="edu">{fate.pathway}</div>
      <StellarEvolutionLab zamsMass={zams} />
      <Equation cite="Fuel ∝ M, burn rate ∝ L ∝ M³·⁵ → massive stars die young">t_MS ≈ 10 Gyr · M/L</Equation>

      <h3>2 · Time dilation near a black hole</h3>
      <LinSlider
        label="Your distance from the hole (in r_s)"
        value={rOverRs}
        min={1.01}
        max={20}
        step={0.01}
        onChange={setROverRs}
        format={(v) => `${v.toFixed(2)} r_s`}
      />
      <StatRow
        k="Your clock vs. a distant observer"
        v={`${(dilation * 100).toFixed(2)}%`}
        tone={dilation < 0.5 ? 'warn' : undefined}
      />
      <StatRow
        k="While 24 h pass for you, far away…"
        v={fmtTimeYears((1 / Math.max(dilation, 1e-9) / 365.25))}
      />
      <TimeDilationClocks rOverRs={rOverRs} />
      <Equation cite="Schwarzschild metric, static observer; MTW §25.4">dτ/dt = √(1 − r_s/r)</Equation>
      <div className="edu">
        <b>Interstellar's Miller's planet</b> (1 hour = 7 years, factor ~61,000)
        requires hovering at r ≈ 1.0000000003 r_s of a nearly maximally
        spinning black hole — Kip Thorne chose the parameters deliberately.
      </div>

      <h3>3 · Misconceptions, corrected</h3>
      <div className="edu">
        <b>&ldquo;Black holes suck things in.&rdquo;</b> False. At a distance, a black
        hole's gravity is identical to any other object of the same mass
        (Birkhoff's theorem, 1923). Orbits around them are ordinary orbits.
      </div>
      <div className="edu">
        <b>&ldquo;They're infinitely dense everywhere.&rdquo;</b> The classical
        singularity is a point, but the mean density inside the horizon falls
        as 1/M². M87* averages less than air.
      </div>
      <div className="edu">
        <b>&ldquo;Falling in, you'd see the universe's future.&rdquo;</b> Mostly a
        myth for radial infall — you cross the horizon in finite proper time
        and the sky's light is aberrated and redshifted, not fast-forwarded.
      </div>
      <div className="edu">
        <b>&ldquo;Hawking radiation makes black holes explode soon.&rdquo;</b> A
        stellar black hole evaporates in ~10⁶⁷ years — 10⁵⁷ times the current
        age of the universe. It absorbs far more CMB photons than it emits.
      </div>

      <h3>Suggested reading</h3>
      <div className="fact">Kip Thorne — &ldquo;Black Holes and Time Warps&rdquo; (1994)</div>
      <div className="fact">Misner, Thorne & Wheeler — &ldquo;Gravitation&rdquo; (1973)</div>
      <div className="fact">Event Horizon Telescope 2019, ApJL 875 — the first image</div>
      <div className="fact">Abbott et al. 2016, PRL 116 — first gravitational-wave detection</div>
    </div>
  );
}
