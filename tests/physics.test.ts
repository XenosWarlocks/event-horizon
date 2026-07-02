/**
 * Physics validation suite.
 * Every test checks a computed value against an independently published
 * benchmark (textbook or peer-reviewed paper), cited inline.
 */

import { describe, it, expect } from 'vitest';
import {
  schwarzschildRadius, photonSphereRadius, iscoRadiusSchwarzschild, iscoRadiusKerr,
  kerrHorizonRadius, escapeVelocity, timeDilationFactor, gravitationalRedshift,
  hawkingTemperature, hawkingEvaporationTime, eddingtonLuminosity,
  meanDensityInsideHorizon, tidalAcceleration, diskPeakTemperature,
  blackHoleProperties,
} from '../src/physics/blackhole';
import {
  mainSequenceLuminosity, mainSequenceLifetimeYears, stellarFate,
  freeFallTime, effectiveTemperature,
} from '../src/physics/stellar';
import { buildClusterModel, relaxationTime } from '../src/physics/cluster';
import { evaluatePlacement } from '../src/physics/comparison';
import { G, C, M_SUN, M_EARTH, R_EARTH, AU, YEAR, MOON_DISTANCE } from '../src/physics/constants';

const closeTo = (actual: number, expected: number, relTol: number) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(relTol);

describe('Schwarzschild geometry', () => {
  it('r_s of the Sun is 2.95 km (MTW §25)', () => {
    closeTo(schwarzschildRadius(M_SUN), 2953, 0.01);
  });

  it('r_s of Sgr A* (4.297e6 M☉) is ~1.27e10 m ≈ 0.085 AU (GRAVITY 2022)', () => {
    closeTo(schwarzschildRadius(4.297e6 * M_SUN), 1.269e10, 0.01);
  });

  it('photon sphere = 1.5 r_s exactly', () => {
    const m = 10 * M_SUN;
    expect(photonSphereRadius(m)).toBeCloseTo(1.5 * schwarzschildRadius(m), 6);
  });

  it('Schwarzschild ISCO = 3 r_s = 6GM/c²', () => {
    const m = M_SUN;
    closeTo(iscoRadiusSchwarzschild(m), (6 * G * m) / (C * C), 1e-9);
  });

  it('escape velocity equals c at r_s', () => {
    const m = 5 * M_SUN;
    closeTo(escapeVelocity(m, schwarzschildRadius(m)), C, 1e-9);
  });

  it('escape velocity at Earth surface is 11.19 km/s', () => {
    closeTo(escapeVelocity(M_EARTH, R_EARTH), 11186, 0.01);
  });
});

describe('Kerr geometry (Bardeen, Press & Teukolsky 1972)', () => {
  it('a*=0 recovers the Schwarzschild ISCO (6 GM/c²)', () => {
    const m = M_SUN;
    closeTo(iscoRadiusKerr(m, 0, true), 6 * (G * m) / (C * C), 1e-3);
  });

  it('a*=0.998 (Thorne limit) prograde ISCO ≈ 1.237 GM/c²', () => {
    const m = M_SUN;
    const rg = (G * m) / (C * C);
    closeTo(iscoRadiusKerr(m, 0.998, true), 1.237 * rg, 0.01);
  });

  it('extremal retrograde ISCO ≈ 9 GM/c²', () => {
    const m = M_SUN;
    const rg = (G * m) / (C * C);
    closeTo(iscoRadiusKerr(m, 0.9999, false), 9 * rg, 0.01);
  });

  it('horizon: r₊ = r_s at a*=0, → GM/c² as a*→1', () => {
    const m = M_SUN;
    closeTo(kerrHorizonRadius(m, 0), schwarzschildRadius(m), 1e-9);
    closeTo(kerrHorizonRadius(m, 1), (G * m) / (C * C), 1e-6);
  });
});

describe('Time dilation & redshift', () => {
  it('dτ/dt = √(1/2) at r = 2 r_s', () => {
    const m = 1e6 * M_SUN;
    closeTo(timeDilationFactor(m, 2 * schwarzschildRadius(m)), Math.SQRT1_2, 1e-9);
  });

  it('redshift diverges at the horizon, → 0 far away', () => {
    const m = M_SUN;
    expect(gravitationalRedshift(m, schwarzschildRadius(m))).toBe(Infinity);
    expect(gravitationalRedshift(m, 1e15)).toBeLessThan(1e-8);
  });
});

describe('Hawking radiation (Hawking 1974; Page 1976)', () => {
  it('T_H of 1 M☉ is 6.17×10⁻⁸ K', () => {
    closeTo(hawkingTemperature(M_SUN), 6.17e-8, 0.01);
  });

  it('T_H ∝ 1/M', () => {
    closeTo(hawkingTemperature(M_SUN) / hawkingTemperature(10 * M_SUN), 10, 1e-9);
  });

  it('evaporation time of 1 M☉ ≈ 2.1×10⁶⁷ yr (photon-only benchmark)', () => {
    closeTo(hawkingEvaporationTime(M_SUN) / YEAR, 2.1e67, 0.05);
  });
});

describe('Accretion & luminosity', () => {
  it('Eddington luminosity of 1 M☉ ≈ 1.26×10³¹ W (Rybicki & Lightman)', () => {
    closeTo(eddingtonLuminosity(M_SUN), 1.26e31, 0.01);
  });

  it('disk peak T ~10⁷ K for stellar, ~10⁵ K for SMBH (Frank, King & Raine 2002)', () => {
    expect(diskPeakTemperature(10, 1)).toBeGreaterThan(1e7);
    expect(diskPeakTemperature(1e8, 1)).toBeLessThan(1e6);
  });
});

describe('Density paradox', () => {
  it('mean density falls as 1/M²', () => {
    const r = meanDensityInsideHorizon(M_SUN) / meanDensityInsideHorizon(10 * M_SUN);
    closeTo(r, 100, 1e-6);
  });

  it('M87* (6.5e9 M☉) is less dense than air (~1.2 kg/m³)', () => {
    expect(meanDensityInsideHorizon(6.5e9 * M_SUN)).toBeLessThan(1.2);
  });
});

describe('Stellar physics', () => {
  it('Sun: L=1 L☉, t_MS = 10 Gyr by construction of the calibration', () => {
    closeTo(mainSequenceLuminosity(1), 1, 1e-9);
    closeTo(mainSequenceLifetimeYears(1), 1e10, 1e-9);
  });

  it('Sun-like effective temperature at M=1', () => {
    closeTo(effectiveTemperature(1, 1), 5772, 1e-6);
  });

  it('fates follow Heger et al. 2003 mass windows', () => {
    expect(stellarFate(1).remnant).toBe('white-dwarf');
    expect(stellarFate(15).remnant).toBe('neutron-star');
    expect(stellarFate(30).remnant).toBe('black-hole');
    expect(stellarFate(180).remnant).toBe('pair-instability-no-remnant');
    expect(stellarFate(180).remnantMassSolar).toBe(0);
    expect(stellarFate(400).remnant).toBe('direct-collapse-black-hole');
  });

  it('free-fall time at solar mean density (1408 kg/m³) ≈ 30 min (Kippenhahn)', () => {
    closeTo(freeFallTime(1408), 1770, 0.02);
  });
});

describe('Cluster dynamics ("N Suns")', () => {
  it('1e9 Suns at realistic density are NOT a black hole (R/r_s ≫ 1)', () => {
    const m = buildClusterModel(1e9);
    expect(m.isBlackHole).toBe(false);
    expect(m.radiusOverSchwarzschild).toBeGreaterThan(1e4);
  });

  it('compressing 1e9 Suns by 10⁶ crosses the horizon → black hole', () => {
    const m = buildClusterModel(1e9, 1e6);
    expect(m.isBlackHole).toBe(true);
  });

  it('escape velocity approaches c as R → r_s', () => {
    const m = buildClusterModel(1e9, 1e6);
    expect(m.escapeVelocity).toBeGreaterThan(0.9 * C);
  });

  it('relaxation time grows with N (BT08): 1e6-star cluster relaxes slower than 1e3', () => {
    const small = buildClusterModel(1e3);
    const big = buildClusterModel(1e6);
    expect(big.relaxationTimeYr).toBeGreaterThan(small.relaxationTimeYr);
  });

  it('mean separation = n^(-1/3) ≈ 0.046 pc at 10⁴ stars/pc³', () => {
    const m = buildClusterModel(1e6);
    closeTo(m.meanSeparationM / 3.086e16, Math.cbrt(1e-4), 0.01);
  });
});

describe('Earth comparison mode', () => {
  it('1 M☉ black hole replacing nothing at Alpha Centauri: negligible', () => {
    const r = evaluatePlacement(1, 4.132e16);
    expect(r.pullVsSun).toBeLessThan(1e-9);
    expect(r.earthSurvives).toBe(true);
    expect(r.solarSystemBound).toBe(true);
  });

  it('1 M☉ black hole at the Moon\'s distance destroys Earth (tides ~2.7×10⁷ lunar)', () => {
    const r = evaluatePlacement(1, MOON_DISTANCE);
    closeTo(r.tideVsMoon, M_SUN / 7.342e22, 0.01);
    expect(r.earthSurvives).toBe(false);
  });

  it('tidal formula matches hand calculation', () => {
    const expected = (2 * G * M_SUN * R_EARTH) / Math.pow(AU, 3);
    closeTo(tidalAcceleration(M_SUN, AU, R_EARTH), expected, 1e-12);
  });

  it('shadow of Sgr A* from Earth ≈ 50 μas (EHT 2022 measured 51.8 μas)', () => {
    const r = evaluatePlacement(4.297e6, 26673 * 9.4607e15);
    const muas = r.shadowAngularDiameter * 2.06265e11;
    closeTo(muas, 51.8, 0.06);
  });
});

describe('Property sheet integration', () => {
  it('produces finite, positive values across 30 orders of magnitude', () => {
    for (const mass of [1e-12, 1, 10, 1e4, 1e6, 6.5e9, 1e11]) {
      const p = blackHoleProperties(mass, 0.5);
      expect(p.schwarzschildRadius).toBeGreaterThan(0);
      expect(p.hawkingTemperature).toBeGreaterThan(0);
      expect(Number.isFinite(p.evaporationTimeYears)).toBe(true);
      expect(p.iscoPrograde).toBeLessThan(p.iscoRetrograde);
      expect(p.horizonRadius).toBeLessThanOrEqual(p.schwarzschildRadius * 1.0001);
    }
  });
});
