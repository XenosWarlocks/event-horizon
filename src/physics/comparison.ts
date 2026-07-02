/**
 * "What if it appeared here?" — Earth/Solar-System comparison mode.
 *
 * All effects computed from first principles:
 *  - Tides: Δa = 2GMR⊕/d³, compared to the Moon's actual tidal acceleration.
 *  - Orbit disruption: perturbing acceleration vs the Sun's hold on Earth.
 *  - System binding: the Sun's Hill radius in the intruder's field
 *    (Hamilton & Burns 1992): r_H ≈ d (M☉/3M)^(1/3).
 *  - Time dilation, shadow angular size (shadow radius = √27/2 · r_s;
 *    Synge 1966), and lensing scale.
 */

import { G, C, M_SUN, M_EARTH, R_EARTH, AU, MOON_DISTANCE } from './constants';
import { schwarzschildRadius, timeDilationFactor, tidalAcceleration } from './blackhole';

/** Moon's tidal acceleration across Earth — the reference "1 lunar tide". */
const M_MOON = 7.342e22;
export const LUNAR_TIDE = tidalAcceleration(M_MOON, MOON_DISTANCE, R_EARTH);

/** Sun's gravitational acceleration at Earth — the reference for orbit stability. */
export const SUN_PULL_AT_EARTH = (G * M_SUN) / (AU * AU);

export interface PlacementResult {
  distanceM: number;
  /** Intruder's pull on Earth relative to the Sun's pull. */
  pullVsSun: number;
  /** Tidal acceleration across Earth relative to the Moon's tide. */
  tideVsMoon: number;
  /** Clock rate at Earth relative to far observers, from the intruder alone. */
  timeDilation: number;
  /** Angular diameter of the black hole shadow [radians]. Moon ≈ 9.0×10⁻³ rad. */
  shadowAngularDiameter: number;
  /** Sun's Hill radius in the intruder's field [m]; Neptune orbit = 4.5×10¹² m. */
  sunHillRadius: number;
  earthSurvives: boolean;
  solarSystemBound: boolean;
  verdict: string;
}

export function evaluatePlacement(massSolar: number, distanceM: number): PlacementResult {
  const m = massSolar * M_SUN;
  const rs = schwarzschildRadius(m);
  const pull = (G * m) / (distanceM * distanceM);
  const tide = tidalAcceleration(m, distanceM, R_EARTH);
  const pullVsSun = pull / SUN_PULL_AT_EARTH;
  const tideVsMoon = tide / LUNAR_TIDE;
  // Shadow angular radius: √27/2 · r_s / d (impact parameter of the photon
  // capture cross-section; Synge 1966, MNRAS 131, 463)
  const shadow = (2 * (Math.sqrt(27) / 2) * rs) / distanceM;
  // Sun's Hill radius against the intruder (three-body stability boundary)
  const hill = distanceM * Math.cbrt(M_SUN / (3 * m));
  const dilation = timeDilationFactor(m, distanceM);

  const insideHorizon = distanceM < rs;
  const earthSurvives = !insideHorizon && tideVsMoon < 1e7; // ~10⁷ lunar tides ≈ crust-disrupting
  const solarSystemBound = hill > 4.5e12; // Neptune's orbit stays inside Sun's Hill sphere

  let verdict: string;
  if (insideHorizon) {
    verdict = 'Earth would be inside the event horizon. Nothing survives; all worldlines end at the singularity within seconds to hours depending on mass.';
  } else if (tideVsMoon > 1e7) {
    verdict = 'Tidal forces exceed the strength of planetary rock — Earth is torn apart (Roche disruption).';
  } else if (pullVsSun > 1) {
    verdict = 'The intruder\'s gravity exceeds the Sun\'s: Earth is stolen onto a new orbit around the black hole. Oceans experience extreme tides; the year as we know it ends.';
  } else if (!solarSystemBound) {
    verdict = 'The Solar System is no longer gravitationally bound as a unit: outer planets are stripped away over a few orbits, and Earth\'s orbit becomes chaotic.';
  } else if (pullVsSun > 0.01) {
    verdict = 'Orbits become measurably eccentric over centuries. Civilization survives; astronomers become very busy.';
  } else {
    verdict = 'Negligible dynamical effect — a black hole at this distance is only detectable by lensing and precision astrometry. Black holes do not "suck"; gravity is gravity.';
  }

  return {
    distanceM,
    pullVsSun,
    tideVsMoon,
    timeDilation: dilation,
    shadowAngularDiameter: shadow,
    sunHillRadius: hill,
    earthSurvives,
    solarSystemBound,
    verdict,
  };
}

export const PLACEMENTS: Array<{ id: string; label: string; distanceM: number }> = [
  { id: 'moon', label: 'At the Moon\'s distance', distanceM: MOON_DISTANCE },
  { id: 'jupiter', label: 'At Jupiter\'s orbit', distanceM: 5.2 * AU },
  { id: 'neptune', label: 'At Neptune\'s orbit', distanceM: 30.1 * AU },
  { id: 'pluto', label: 'At Pluto\'s orbit', distanceM: 39.5 * AU },
  { id: 'alpha-cen', label: 'At Alpha Centauri', distanceM: 4.132e16 },
  { id: 'betelgeuse', label: 'At Betelgeuse', distanceM: 5.2e18 },
  { id: 'gal-center', label: 'At the Galactic Centre', distanceM: 2.52e20 },
];
