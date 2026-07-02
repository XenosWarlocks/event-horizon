/**
 * Massive Stellar Cluster Simulator: "What if you gathered N Suns?"
 * plus the Compression experiment.
 */

import { useMemo, useState } from 'react';
import { buildClusterModel, CLUSTER_LADDER } from '../physics/cluster';
import {
  fmtLength, fmtMass, fmtSpeed, fmtDensity, fmtTimeYears,
  fmtLuminosity, fmtEnergy, fmtCount, sig,
} from '../physics/units';
import { StatRow, Chips, LinSlider, Equation } from './components';

export function ClusterPanel() {
  const [n, setN] = useState(1e9);
  const [logCompress, setLogCompress] = useState(0); // 0..6 → compression 1..10⁶
  const compression = Math.pow(10, logCompress);
  const model = useMemo(() => buildClusterModel(n, compression), [n, compression]);

  return (
    <div className="panel-scroll">
      <h2>Stellar Cluster Simulator</h2>
      <p className="subtitle">
        Gather N Suns at a realistic dense-cluster density (10⁴ stars/pc³, cf. globular
        cluster cores, Harris 1996), then compress them and watch the physics decide their fate.
      </p>

      <h3>How many Suns?</h3>
      <Chips
        options={CLUSTER_LADDER}
        value={n}
        onChange={setN}
        render={(v) => fmtCount(v)}
      />

      <h3>Compression experiment</h3>
      <LinSlider
        label="Compress the cluster radius by"
        value={logCompress}
        min={0}
        max={6}
        step={0.01}
        onChange={setLogCompress}
        format={(v) => `${sig(Math.pow(10, v))}×`}
      />

      <div className={`verdict ${model.isBlackHole || model.virialBeta > 0.3 ? 'bad' : 'good'}`}>
        {model.fate}
      </div>

      <h3>Bulk properties</h3>
      <StatRow k="Total mass" v={fmtMass(model.totalMassKg)} />
      <StatRow k="Cluster radius" v={fmtLength(model.radiusM)} tone="accent" />
      <StatRow k="All stars melted into one sphere" v={fmtLength(model.packedRadiusM)} />
      <StatRow k="Mean separation" v={fmtLength(model.meanSeparationM)} />
      <StatRow k="Mean density" v={fmtDensity(model.meanDensity)} />
      <StatRow k="Escape velocity" v={fmtSpeed(model.escapeVelocity)} tone={model.virialBeta > 0.1 ? 'warn' : undefined} />
      <StatRow k="Typical orbital speed" v={fmtSpeed(model.virialVelocity)} />
      <StatRow k="Binding energy (≈)" v={fmtEnergy(model.bindingEnergyJ)} />
      <StatRow k="Total luminosity" v={fmtLuminosity(model.luminosityW)} />
      <StatRow k="Hydrogen fused" v={`${sig(model.fusionRateKgS)} kg/s`} />

      <h3>Timescales & fate</h3>
      <StatRow k="Free-fall time (if unsupported)" v={fmtTimeYears(model.freeFallTimeYr)} />
      <StatRow k="Two-body relaxation" v={fmtTimeYears(model.relaxationTimeYr)} />
      <StatRow k="Core collapse (~15 t_rlx)" v={fmtTimeYears(model.coreCollapseTimeYr)} />
      <StatRow k="Stellar collision interval" v={fmtTimeYears(model.collisionTimeYr)} tone={model.collisionTimeYr < 1e6 ? 'warn' : undefined} />
      <StatRow
        k="Radius vs. Schwarzschild radius"
        v={`${sig(model.radiusOverSchwarzschild)}×`}
        tone={model.isBlackHole ? 'warn' : 'ok'}
      />

      <div className="edu">
        <b>Would a billion Suns instantly become a black hole?</b> No. At
        realistic packing, {fmtCount(n)} Suns span {fmtLength(model.radiusM * compression)} —
        {' '}{sig(buildClusterModel(n, 1).radiusOverSchwarzschild)}× wider than their own
        Schwarzschild radius. Orbits, not pressure, hold the system up
        (angular momentum conservation). Collapse needs a way to <i>lose</i>
        {' '}angular momentum and energy — that is why supermassive black holes
        took hundreds of millions of years to grow.
      </div>

      <h3>The equations deciding the fate</h3>
      <Equation cite="Binney & Tremaine 2008, eq. 7.108">t_rlx ≈ (0.1 N / ln N) · R/v</Equation>
      <Equation cite="Kippenhahn et al. 2012, eq. 2.18">t_ff = √(3π / 32Gρ)</Equation>
      <Equation cite="Penrose 1965 — collapse is inevitable once R &lt; r_s">R &lt; 2GM/c² ⇒ black hole</Equation>
    </div>
  );
}
