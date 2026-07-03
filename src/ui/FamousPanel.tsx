/**
 * Famous Black Holes database. Selecting one loads it into the renderer
 * (via onSelect) so its disk temperature/ISCO are physically consistent.
 */

import { FAMOUS_BLACK_HOLES, FamousBlackHole } from '../data/famousBlackHoles';
import { blackHoleProperties } from '../physics/blackhole';
import { fmtLength, fmtDensity, fmtTimeYears, sig } from '../physics/units';
import { LIGHT_YEAR } from '../physics/constants';
import { StatRow } from './components';
import { ScaleComparison } from './ScaleComparison';

export function FamousPanel({
  selectedId, onSelect,
}: {
  selectedId: string;
  onSelect: (bh: FamousBlackHole) => void;
}) {
  const sel = FAMOUS_BLACK_HOLES.find((b) => b.id === selectedId) ?? FAMOUS_BLACK_HOLES[0];
  const p = blackHoleProperties(sel.massSolar, sel.spin ?? 0);

  return (
    <div className="panel-scroll">
      <h2>Famous Black Holes</h2>
      <p className="subtitle">Verified objects from the primary literature. Select one to load it into the simulation.</p>

      {FAMOUS_BLACK_HOLES.map((bh) => (
        <div
          key={bh.id}
          className={`list-item ${bh.id === sel.id ? 'active' : ''}`}
          onClick={() => onSelect(bh)}
        >
          <div className="li-title">{bh.name}</div>
          <div className="li-sub">{sig(bh.massSolar)} M☉ · {sig(bh.distanceLy)} ly</div>
        </div>
      ))}

      <h3>{sel.name}</h3>
      <StatRow k="Mass" v={sel.massNote} />
      <StatRow k="Distance" v={`${sig(sel.distanceLy)} light-years`} />
      <StatRow k="Host" v={sel.hostGalaxy} />
      <StatRow k="Schwarzschild radius" v={fmtLength(p.schwarzschildRadius)} tone="accent" />
      <StatRow k="Shadow diameter (√27 r_s)" v={fmtLength(Math.sqrt(27) * p.schwarzschildRadius)} />
      <StatRow k="Mean density in r_s" v={fmtDensity(p.meanDensity)} />
      <StatRow k="Hawking evaporation" v={fmtTimeYears(p.evaporationTimeYears)} />
      <StatRow k="Light-crossing time of r_s" v={`${sig(p.schwarzschildRadius / 2.998e8)} s`} />

      <h3>Discovery</h3>
      <p className="subtitle">{sel.discovered}</p>

      <h3>Facts</h3>
      {sel.facts.map((f, i) => <div className="fact" key={i}>{f}</div>)}

      <ScaleComparison name={sel.name} massSolar={sel.massSolar} />

      <h3>Primary reference</h3>
      <p className="cite">{sel.reference}</p>
    </div>
  );
}
