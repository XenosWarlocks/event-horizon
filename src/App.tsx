/**
 * Event Horizon — application shell.
 * The geodesic renderer always runs behind; glass panels float above.
 */

import { useMemo, useState } from 'react';
import { BlackHoleScene, SceneParams } from './render/BlackHoleScene';
import { ObservatoryPanel, BlackHoleStats, ObservatoryState } from './ui/ObservatoryPanel';
import { ClusterPanel } from './ui/ClusterPanel';
import { FamousPanel } from './ui/FamousPanel';
import { ComparisonPanel } from './ui/ComparisonPanel';
import { LearnPanel } from './ui/LearnPanel';
import { iscoRadiusKerr, schwarzschildRadius, diskPeakTemperature } from './physics/blackhole';
import { M_SUN } from './physics/constants';

type Mode = 'observatory' | 'cluster' | 'famous' | 'comparison' | 'learn';

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'observatory', label: 'Observatory' },
  { id: 'cluster', label: 'Cluster Simulator' },
  { id: 'famous', label: 'Famous Black Holes' },
  { id: 'comparison', label: 'What If?' },
  { id: 'learn', label: 'Learn' },
];

export default function App() {
  const [mode, setMode] = useState<Mode>('observatory');
  const [famousId, setFamousId] = useState('m87-star');
  const [obs, setObs] = useState<ObservatoryState>({
    classId: 'supermassive',
    massSolar: 6.5e9,
    spin: 0.6,
    accretion: 1,
    beaming: true,
  });

  // Renderer parameters derived from physics — the disk's inner edge is the
  // Kerr ISCO in units of r_s, its color the Shakura–Sunyaev peak temperature.
  const sceneParams: SceneParams = useMemo(() => {
    const m = obs.massSolar * M_SUN;
    const rs = schwarzschildRadius(m);
    const iscoRs = iscoRadiusKerr(m, obs.spin, true) / rs;
    const tPeak = diskPeakTemperature(obs.massSolar, obs.accretion);
    return {
      diskInnerRs: iscoRs,
      diskOuterRs: Math.max(iscoRs * 4.5, 12),
      // Blackbody→RGB is only meaningful 1000–40000 K; hotter disks are
      // rendered at the blue-white limit (they'd peak in X-rays).
      diskTempK: Math.min(Math.max(tPeak, 2500), 39000),
      spin: obs.spin,
      accretion: obs.accretion,
      beaming: obs.beaming,
      camDist: 16,
    };
  }, [obs]);

  return (
    <div className="app">
      <BlackHoleScene params={sceneParams} />

      <div className="topbar">
        <div className="brand">Event <span>Horizon</span></div>
        <nav className="nav">
          {MODES.map((m) => (
            <button key={m.id} className={m.id === mode ? 'active' : ''} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="panel panel-left">
        {mode === 'observatory' && <ObservatoryPanel state={obs} onChange={setObs} />}
        {mode === 'cluster' && <ClusterPanel />}
        {mode === 'famous' && (
          <FamousPanel
            selectedId={famousId}
            onSelect={(bh) => {
              setFamousId(bh.id);
              setObs({ ...obs, massSolar: bh.massSolar, spin: bh.spin ?? 0, classId: 'supermassive' });
            }}
          />
        )}
        {mode === 'comparison' && (
          <ComparisonPanel massSolar={obs.massSolar} onMassChange={(massSolar) => setObs({ ...obs, massSolar })} />
        )}
        {mode === 'learn' && <LearnPanel />}
      </div>

      {(mode === 'observatory' || mode === 'famous') && (
        <div className="panel panel-right">
          <BlackHoleStats massSolar={obs.massSolar} spin={obs.spin} />
        </div>
      )}

      <div className="hint">drag to orbit · scroll to zoom · the light bending you see is integrated from the Schwarzschild metric</div>
    </div>
  );
}
