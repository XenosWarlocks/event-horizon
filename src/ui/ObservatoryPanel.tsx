/**
 * Black Hole Observatory: pick a class, tune mass/spin/accretion,
 * and read every derived quantity — all computed live from the metric.
 */

import { BLACK_HOLE_CLASSES } from '../data/blackHoleClasses';
import { blackHoleProperties } from '../physics/blackhole';
import { fmtLength, fmtDensity, fmtTemp, fmtTimeYears, fmtMass, sig, fmtLuminosity } from '../physics/units';
import { M_SUN, C } from '../physics/constants';
import { StatRow, LogSlider, LinSlider, Toggle, Equation } from './components';

export interface ObservatoryState {
  classId: string;
  massSolar: number;
  spin: number;
  accretion: number;
  beaming: boolean;
}

export function ObservatoryPanel({
  state, onChange,
}: {
  state: ObservatoryState;
  onChange: (s: ObservatoryState) => void;
}) {
  const cls = BLACK_HOLE_CLASSES.find((c) => c.id === state.classId)!;
  return (
    <div className="panel-scroll">
      <h2>Black Hole Observatory</h2>
      <p className="subtitle">Every value below is computed from the Schwarzschild / Kerr metric in real time. Nothing is hard-coded.</p>

      <h3>Class</h3>
      <div className="chips">
        {BLACK_HOLE_CLASSES.map((c) => (
          <button
            key={c.id}
            className={`chip ${c.id === state.classId ? 'active' : ''}`}
            onClick={() => onChange({ ...state, classId: c.id, massSolar: c.massSolar })}
          >
            {c.name.replace(' Black Hole', '').replace(' (theoretical ceiling)', '')}
          </button>
        ))}
      </div>
      {cls.hypothetical && <span className="badge">Hypothetical</span>}

      <h3>Parameters</h3>
      <LogSlider
        label="Mass"
        value={state.massSolar}
        min={cls.massRange[0]}
        max={cls.massRange[1]}
        onChange={(massSolar) => onChange({ ...state, massSolar })}
        format={(v) => `${sig(v)} M☉`}
      />
      <LinSlider
        label="Spin a* (J·c/GM²)"
        value={state.spin}
        min={0}
        max={0.998}
        onChange={(spin) => onChange({ ...state, spin })}
        format={(v) => v.toFixed(3)}
      />
      <LinSlider
        label="Accretion rate (Eddington units)"
        value={state.accretion}
        min={0.01}
        max={2}
        onChange={(accretion) => onChange({ ...state, accretion })}
        format={(v) => `${v.toFixed(2)} Ṁ_Edd`}
      />
      <Toggle
        label="Relativistic beaming (Doppler boost)"
        on={state.beaming}
        onChange={(beaming) => onChange({ ...state, beaming })}
      />

      <div className="edu">
        <b>Why is one side of the disk brighter?</b> Gas orbits at a large
        fraction of light speed. The side moving toward you is Doppler-boosted
        by δ⁴ — this is exactly the asymmetry seen in the real M87* image.
        Toggle beaming off to see the disk without relativity.
      </div>

      <h3>About this class</h3>
      <p className="subtitle"><b style={{ color: 'var(--text)' }}>Formation.</b> {cls.formation}</p>
      <p className="subtitle"><b style={{ color: 'var(--text)' }}>Largest known.</b> {cls.largestKnown}</p>
      <p className="subtitle"><b style={{ color: 'var(--text)' }}>Host.</b> {cls.typicalHost}</p>
      <p className="subtitle"><b style={{ color: 'var(--text)' }}>Population.</b> {cls.population}</p>
      <p className="subtitle"><b style={{ color: 'var(--text)' }}>Discovery.</b> {cls.discovery}</p>

      <h3>Key equations</h3>
      <Equation cite="Schwarzschild 1916; MTW §25">r_s = 2GM/c²</Equation>
      <Equation cite="Bardeen, Press & Teukolsky 1972, ApJ 178, 347">r_ISCO(a*) = GM/c² · [3 + Z₂ − √((3−Z₁)(3+Z₁+2Z₂))]</Equation>
      <Equation cite="Hawking 1974, Nature 248, 30">T_H = ħc³ / 8πGMk_B</Equation>
    </div>
  );
}

/** Right-hand live stats panel for the current black hole. */
export function BlackHoleStats({ massSolar, spin }: { massSolar: number; spin: number }) {
  const p = blackHoleProperties(massSolar, spin);
  const denseWarn = p.meanDensity < 1000;
  return (
    <div className="panel-scroll">
      <h2>Live Metrics</h2>
      <p className="subtitle">Computed from M = {sig(massSolar)} M☉, a* = {spin.toFixed(3)}</p>
      <StatRow k="Mass" v={fmtMass(p.massKg)} />
      <StatRow k="Schwarzschild radius" v={fmtLength(p.schwarzschildRadius)} tone="accent" />
      <StatRow k="Event horizon (Kerr r₊)" v={fmtLength(p.horizonRadius)} />
      <StatRow k="Photon sphere" v={fmtLength(p.photonSphere)} />
      <StatRow k="ISCO (prograde)" v={fmtLength(p.iscoPrograde)} />
      <StatRow k="ISCO (retrograde)" v={fmtLength(p.iscoRetrograde)} />
      <StatRow k="Ergosphere (equator)" v={fmtLength(p.ergosphereEquatorial)} />
      <StatRow
        k="Mean density in r_s"
        v={fmtDensity(p.meanDensity)}
        tone={denseWarn ? 'ok' : undefined}
      />
      <StatRow k="Time rate at 2 r_s" v={`${(p.timeDilationAt2Rs * 100).toFixed(1)}% of far time`} />
      <StatRow k="Hawking temperature" v={fmtTemp(p.hawkingTemperature)} />
      <StatRow k="Evaporation time" v={fmtTimeYears(p.evaporationTimeYears)} />
      <StatRow k="Eddington luminosity" v={fmtLuminosity(p.eddingtonLuminosity)} />
      <StatRow k="Deadly tides begin at" v={fmtLength(p.spaghettificationRadius)} tone="warn" />
      {denseWarn && (
        <div className="edu">
          <b>Less dense than water.</b> Mean density inside the horizon falls
          as 1/M² — supermassive black holes are enormous but astonishingly
          &ldquo;dilute&rdquo;. Crossing this horizon would be locally unremarkable.
        </div>
      )}
      {p.spaghettificationRadius < p.schwarzschildRadius && (
        <div className="edu">
          <b>Gentle horizon.</b> For this mass, lethal tides begin <i>inside</i> the
          horizon — you would cross the point of no return intact.
        </div>
      )}
    </div>
  );
}
