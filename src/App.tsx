/**
 * Event Horizon — application shell.
 * The geodesic renderer always runs behind; glass panels float above.
 */

import { useEffect, useMemo, useState } from 'react';
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

  // Responsive state detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collapse and drawer states with localStorage persistence
  const [leftCollapsed, setLeftCollapsed] = useState(() => {
    try {
      return localStorage.getItem('eh_left_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [rightCollapsed, setRightCollapsed] = useState(() => {
    try {
      return localStorage.getItem('eh_right_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('eh_mobile_sidebar_open') === 'true';
    } catch {
      return false;
    }
  });

  const [quality, setQuality] = useState<'adaptive' | 'low' | 'medium' | 'high' | 'ultra'>(() => {
    try {
      const q = localStorage.getItem('eh_quality');
      if (q && ['adaptive', 'low', 'medium', 'high', 'ultra'].includes(q)) {
        return q as any;
      }
    } catch {}
    return 'adaptive';
  });

  useEffect(() => {
    try {
      localStorage.setItem('eh_left_collapsed', String(leftCollapsed));
    } catch {}
  }, [leftCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('eh_right_collapsed', String(rightCollapsed));
    } catch {}
  }, [rightCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('eh_mobile_sidebar_open', String(mobileSidebarOpen));
    } catch {}
  }, [mobileSidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('eh_quality', quality);
    } catch {}
  }, [quality]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'h' || key === 'escape') {
        e.preventDefault();
        if (isMobile) {
          setMobileSidebarOpen((prev) => !prev);
        } else {
          setLeftCollapsed((prev) => {
            const next = !prev;
            setRightCollapsed(next);
            return next;
          });
        }
      } else if (key === '1') {
        setMode('observatory');
      } else if (key === '2') {
        setMode('cluster');
      } else if (key === '3') {
        setMode('famous');
      } else if (key === '4') {
        setMode('comparison');
      } else if (key === '5') {
        setMode('learn');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  // Renderer parameters derived from physics
  const sceneParams: SceneParams = useMemo(() => {
    const m = obs.massSolar * M_SUN;
    const rs = schwarzschildRadius(m);
    const iscoRs = iscoRadiusKerr(m, obs.spin, true) / rs;
    const tPeak = diskPeakTemperature(obs.massSolar, obs.accretion);
    return {
      diskInnerRs: iscoRs,
      diskOuterRs: Math.max(iscoRs * 4.5, 12),
      diskTempK: Math.min(Math.max(tPeak, 2500), 39000),
      spin: obs.spin,
      accretion: obs.accretion,
      beaming: obs.beaming,
      camDist: 16,
      quality,
    };
  }, [obs, quality]);

  return (
    <div className="app">
      <BlackHoleScene params={sceneParams} />

      <div className="topbar">
        {isMobile ? (
          <button
            className={`sidebar-toggle-btn ${mobileSidebarOpen ? 'active' : ''}`}
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            aria-label="Toggle Controls"
            title="Toggle Controls"
          >
            ☰
          </button>
        ) : (
          <button
            className={`panel-toggle-btn left ${leftCollapsed ? 'collapsed' : ''}`}
            onClick={() => setLeftCollapsed((prev) => !prev)}
            title={leftCollapsed ? 'Expand Controls' : 'Collapse Controls'}
            aria-label="Toggle Controls"
          >
            {leftCollapsed ? '▶' : '◀'}
          </button>
        )}
        <div className="brand">Event <span>Horizon</span></div>
        {!isMobile && (
          <nav className="nav">
            {MODES.map((m) => (
              <button key={m.id} className={m.id === mode ? 'active' : ''} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </nav>
        )}
        {!isMobile && (mode === 'observatory' || mode === 'famous') && (
          <button
            className={`panel-toggle-btn right ${rightCollapsed ? 'collapsed' : ''}`}
            onClick={() => setRightCollapsed((prev) => !prev)}
            title={rightCollapsed ? 'Expand Metrics' : 'Collapse Metrics'}
            aria-label="Toggle Metrics"
            style={{ marginLeft: 'auto' }}
          >
            {rightCollapsed ? '◀' : '▶'}
          </button>
        )}
      </div>

      {isMobile && mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {isMobile ? (
        <div className={`sidebar-drawer ${mobileSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="brand">Event <span>Horizon</span></div>
            <button className="sidebar-close-btn" onClick={() => setMobileSidebarOpen(false)} aria-label="Close Controls">
              ✕
            </button>
          </div>
          <nav className="sidebar-nav">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={m.id === mode ? 'active' : ''}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-content">
            <div className="sidebar-panel-section">
              {mode === 'observatory' && (
                <ObservatoryPanel
                  state={obs}
                  onChange={setObs}
                  quality={quality}
                  onQualityChange={setQuality}
                />
              )}
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
              <div className="sidebar-panel-section stats-section">
                <BlackHoleStats massSolar={obs.massSolar} spin={obs.spin} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {!leftCollapsed && (
            <div className="panel panel-left">
              {mode === 'observatory' && (
                <ObservatoryPanel
                  state={obs}
                  onChange={setObs}
                  quality={quality}
                  onQualityChange={setQuality}
                />
              )}
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
          )}

          {!rightCollapsed && (mode === 'observatory' || mode === 'famous') && (
            <div className="panel panel-right">
              <BlackHoleStats massSolar={obs.massSolar} spin={obs.spin} />
            </div>
          )}
        </>
      )}

      <div className="hint">drag to orbit · double-click to reset · scroll to zoom · the light bending is integrated from Schwarzschild</div>
    </div>
  );
}
