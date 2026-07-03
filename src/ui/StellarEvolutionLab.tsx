/**
 * Stellar Evolution Lab.
 *
 * The star on stage is drawn from the physics: radius from the
 * main-sequence mass–radius relation, surface color from its effective
 * temperature (blackbody), core glow from the virial core temperature.
 * "Trigger collapse" plays the pathway that stellarFate() computes:
 * giant → (supernova) → white dwarf / neutron star / black hole /
 * total pair-instability disruption.
 */

import { useEffect, useRef, useState } from 'react';
import { mainSequenceRadius, mainSequenceLuminosity, effectiveTemperature, stellarFate } from '../physics/stellar';
import { kelvinToCSS } from './color';
import { sig } from '../physics/units';

type Phase = 'main-sequence' | 'giant' | 'flash' | 'remnant';

const W = 340, H = 230;

export function StellarEvolutionLab({ zamsMass }: { zamsMass: number }) {
  const [phase, setPhase] = useState<Phase>('main-sequence');
  const [progress, setProgress] = useState(0); // 0..1 within phase
  const animRef = useRef(0);

  const fate = stellarFate(zamsMass);
  const radius = mainSequenceRadius(zamsMass);
  const tEff = effectiveTemperature(mainSequenceLuminosity(zamsMass), radius);

  // reset when the user changes the star
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    setPhase('main-sequence');
    setProgress(0);
  }, [zamsMass]);

  const trigger = () => {
    cancelAnimationFrame(animRef.current);
    const t0 = performance.now();
    const GIANT_MS = 1900, FLASH_MS = 900;
    const tick = (now: number) => {
      const t = now - t0;
      if (t < GIANT_MS) {
        setPhase('giant');
        setProgress(t / GIANT_MS);
        animRef.current = requestAnimationFrame(tick);
      } else if (t < GIANT_MS + FLASH_MS) {
        setPhase('flash');
        setProgress((t - GIANT_MS) / FLASH_MS);
        animRef.current = requestAnimationFrame(tick);
      } else {
        setPhase('remnant');
        setProgress(Math.min((t - GIANT_MS - FLASH_MS) / 800, 1));
        if (t < GIANT_MS + FLASH_MS + 800) animRef.current = requestAnimationFrame(tick);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // ---- stage geometry -----------------------------------------------------
  // main-sequence radius, log-compressed for display (0.1 → 1000 M☉ fits)
  const baseR = 14 + Math.log10(Math.max(radius, 0.2) + 1) * 34;
  const cx = W / 2, cy = H / 2;

  let starR = baseR;
  let starColor = kelvinToCSS(tEff);
  let coreOpacity = Math.min(0.25 + Math.log10(zamsMass + 1) * 0.3, 0.85);

  if (phase === 'giant') {
    starR = baseR * (1 + progress * 2.1);
    starColor = kelvinToCSS(tEff + (3400 - tEff) * progress); // cool & redden
  } else if (phase === 'flash') {
    starR = baseR * (2.9 - progress * 2.6);
  }

  const remnantKind = fate.remnant;
  const showSN = zamsMass >= 8;

  return (
    <div className="viz-box">
      <div className="viz-title">Stellar evolution lab</div>
      <div className="viz-stage">
        <svg viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <radialGradient id="starGrad">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="45%" stopColor={starColor} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id="coreGrad">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="#03050b" />

          {phase !== 'remnant' && (
            <g>
              {/* photosphere */}
              <circle cx={cx} cy={cy} r={starR * 1.5} fill="url(#starGrad)" opacity={0.9} />
              <circle cx={cx} cy={cy} r={starR} fill={starColor} />
              {/* fusing core */}
              {phase === 'main-sequence' && (
                <circle cx={cx} cy={cy} r={starR * 0.32} fill="url(#coreGrad)" opacity={coreOpacity}>
                  <animate attributeName="opacity" values={`${coreOpacity};${coreOpacity * 0.55};${coreOpacity}`} dur="2.2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          )}

          {phase === 'flash' && showSN && (
            <g>
              <circle cx={cx} cy={cy} r={progress * 150} fill="none" stroke="rgba(255,240,210,0.9)" strokeWidth={4 * (1 - progress)} />
              <circle cx={cx} cy={cy} r={progress * 110} fill={`rgba(255, 230, 190, ${0.5 * (1 - progress)})`} />
            </g>
          )}

          {phase === 'remnant' && (
            <g opacity={Math.min(progress * 1.4, 1)}>
              {remnantKind === 'white-dwarf' && (
                <>
                  <circle cx={cx} cy={cy} r={16} fill="url(#starGrad)" opacity={0.7} />
                  <circle cx={cx} cy={cy} r={7} fill="#dfeaff" />
                  {/* planetary nebula shell */}
                  <circle cx={cx} cy={cy} r={62 + progress * 14} fill="none" stroke="rgba(140, 220, 200, 0.35)" strokeWidth={9} />
                </>
              )}
              {remnantKind === 'neutron-star' && (
                <>
                  <circle cx={cx} cy={cy} r={3.4} fill="#fff" />
                  <circle cx={cx} cy={cy} r={10} fill="url(#coreGrad)" opacity={0.8} />
                  {/* pulsar beams */}
                  <line x1={cx - 60} y1={cy - 44} x2={cx + 60} y2={cy + 44} stroke="rgba(160, 200, 255, 0.4)" strokeWidth={7} />
                  <circle cx={cx} cy={cy} r={40 + progress * 60} fill="none" stroke="rgba(255,220,180,0.25)" strokeWidth={2} />
                </>
              )}
              {(remnantKind === 'black-hole' || remnantKind === 'direct-collapse-black-hole') && (
                <>
                  <circle cx={cx} cy={cy} r={24} fill="none" stroke="rgba(255,190,110,0.85)" strokeWidth={2.4} />
                  <circle cx={cx} cy={cy} r={20} fill="#000" stroke="rgba(130,160,255,0.5)" strokeWidth={1} />
                  {/* lensed background streak */}
                  <path d={`M${cx - 70} ${cy} q 70 -46 140 0`} fill="none" stroke="rgba(180,200,255,0.35)" strokeWidth={1.5} />
                </>
              )}
              {remnantKind === 'pair-instability-no-remnant' && (
                <>
                  <circle cx={cx} cy={cy} r={30 + progress * 90} fill="none" stroke="rgba(255,170,120,0.5)" strokeWidth={6 * (1.2 - progress)} />
                  <circle cx={cx} cy={cy} r={16 + progress * 60} fill="none" stroke="rgba(255,220,170,0.4)" strokeWidth={3} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text-faint)" fontSize={10.5}>nothing remains</text>
                </>
              )}
            </g>
          )}

          {/* status line */}
          <text x={10} y={H - 10} fill="var(--text-faint)" fontSize={10}>
            {phase === 'main-sequence' && `Main sequence · ${sig(tEff)} K surface · fusing hydrogen`}
            {phase === 'giant' && 'Fuel exhausted — envelope swells into a giant'}
            {phase === 'flash' && (showSN ? 'Core collapse — supernova!' : 'Envelope ejected')}
            {phase === 'remnant' && fate.pathway.split('.')[0]}
          </text>
        </svg>
      </div>
      <button className="action-btn" onClick={trigger} disabled={phase === 'giant' || phase === 'flash'}>
        {phase === 'remnant' ? '↺ Rewind and collapse again' : '▶ Fast-forward to collapse'}
      </button>
      <div className="viz-caption">
        Size from the mass–radius relation, color from T_eff = {sig(tEff)} K (blackbody). The ending is decided by the Heger et al. (2003) mass windows — change the mass slider and rerun.
      </div>
    </div>
  );
}
