/**
 * Black hole physics: Schwarzschild & Kerr metrics, horizons, orbits,
 * time dilation, tidal forces, Hawking radiation.
 *
 * References:
 *  - Misner, Thorne & Wheeler, "Gravitation" (1973) [MTW]
 *  - Bardeen, Press & Teukolsky 1972, ApJ 178, 347 (Kerr orbits)
 *  - Hawking 1974, Nature 248, 30 (black hole evaporation)
 *  - Page 1976, Phys. Rev. D 13, 198 (evaporation timescale)
 */

import { G, C, HBAR, K_B, M_SUN, YEAR } from './constants';

/**
 * Schwarzschild radius r_s = 2GM/c².
 * [MTW §25; Schwarzschild 1916]
 * @param mass kg → radius in meters
 */
export function schwarzschildRadius(mass: number): number {
  return (2 * G * mass) / (C * C);
}

/**
 * Photon sphere radius for a non-rotating black hole: r_ph = 3GM/c² = 1.5 r_s.
 * Circular null geodesic of the Schwarzschild metric. [MTW §25.6]
 */
export function photonSphereRadius(mass: number): number {
  return 1.5 * schwarzschildRadius(mass);
}

/**
 * Innermost stable circular orbit (ISCO) for Schwarzschild: r_isco = 6GM/c² = 3 r_s.
 * [MTW §25.6, eq. 25.47]
 */
export function iscoRadiusSchwarzschild(mass: number): number {
  return 3 * schwarzschildRadius(mass);
}

/**
 * Kerr ISCO radius (prograde or retrograde equatorial orbit).
 * Bardeen, Press & Teukolsky 1972, ApJ 178, 347, eqs. (2.21):
 *   Z1 = 1 + (1-a*²)^(1/3) [(1+a*)^(1/3) + (1-a*)^(1/3)]
 *   Z2 = sqrt(3 a*² + Z1²)
 *   r_isco = (GM/c²) [3 + Z2 ∓ sqrt((3-Z1)(3+Z1+2Z2))]   (− prograde, + retrograde)
 * @param spin dimensionless spin a* = Jc/(GM²), 0 ≤ a* ≤ 1
 */
export function iscoRadiusKerr(mass: number, spin: number, prograde = true): number {
  const a = Math.min(Math.max(Math.abs(spin), 0), 0.9999);
  const rg = (G * mass) / (C * C);
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const sign = prograde ? -1 : 1;
  return rg * (3 + z2 + sign * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)));
}

/**
 * Kerr event horizon (outer): r+ = (GM/c²)(1 + sqrt(1 - a*²)).
 * Reduces to r_s at a*=0 and GM/c² at a*=1. [MTW §33]
 */
export function kerrHorizonRadius(mass: number, spin: number): number {
  const a = Math.min(Math.max(Math.abs(spin), 0), 1);
  const rg = (G * mass) / (C * C);
  return rg * (1 + Math.sqrt(Math.max(0, 1 - a * a)));
}

/**
 * Kerr ergosphere radius in the equatorial plane: r_ergo = 2GM/c² (θ=π/2).
 * General: r_E(θ) = (GM/c²)(1 + sqrt(1 - a*² cos²θ)). [MTW §33.4]
 */
export function ergosphereRadiusEquatorial(mass: number): number {
  return (2 * G * mass) / (C * C);
}

/**
 * Frame-dragging (Lense–Thirring) angular velocity at Boyer–Lindquist radius r
 * (equatorial, far-field approximation): ω = 2GJ/(c²r³), J = a* GM²/c.
 * [Lense & Thirring 1918; MTW §33.4 exact form ω = 2Mar/Σ²... — far field here]
 * @returns rad/s
 */
export function frameDraggingOmega(mass: number, spin: number, r: number): number {
  const J = spin * G * mass * mass / C;
  return (2 * G * J) / (C * C * r * r * r);
}

/**
 * Newtonian escape velocity v_esc = sqrt(2GM/r).
 * Coincidentally equals c exactly at r = r_s (Michell 1784, Laplace 1796).
 */
export function escapeVelocity(mass: number, r: number): number {
  return Math.sqrt((2 * G * mass) / r);
}

/**
 * Gravitational time dilation factor for a static observer in the
 * Schwarzschild metric: dτ/dt = sqrt(1 - r_s/r). [MTW §25.4]
 * Returns 0 at the horizon (proper time freezes as seen from infinity).
 */
export function timeDilationFactor(mass: number, r: number): number {
  const rs = schwarzschildRadius(mass);
  if (r <= rs) return 0;
  return Math.sqrt(1 - rs / r);
}

/**
 * Gravitational redshift z of light emitted at radius r and received at infinity:
 * 1 + z = 1/sqrt(1 - r_s/r). [MTW §25.4]
 */
export function gravitationalRedshift(mass: number, r: number): number {
  const f = timeDilationFactor(mass, r);
  if (f === 0) return Infinity;
  return 1 / f - 1;
}

/**
 * "Surface gravity" of a black hole κ = c⁴/(4GM) (Schwarzschild),
 * the horizon force per unit mass as measured at infinity. [Wald, GR (1984) §12.5]
 * For intuition we also expose the Newtonian g = GM/r² at arbitrary r.
 */
export function horizonSurfaceGravity(mass: number): number {
  return Math.pow(C, 4) / (4 * G * mass);
}

/** Newtonian gravitational acceleration g = GM/r² [m/s²]. */
export function newtonianGravity(mass: number, r: number): number {
  return (G * mass) / (r * r);
}

/**
 * Mean density inside the Schwarzschild radius: ρ = M / (4/3 π r_s³) ∝ 1/M².
 * Explains why supermassive black holes are less dense than water.
 */
export function meanDensityInsideHorizon(mass: number): number {
  const rs = schwarzschildRadius(mass);
  return mass / ((4 / 3) * Math.PI * rs * rs * rs);
}

/**
 * Tidal acceleration difference across an object of length L at distance r:
 * Δa = 2GML/r³ (Newtonian tide; valid outside horizon for M >> m).
 * [e.g. Hartle, "Gravity" (2003) §1.3 — spaghettification]
 */
export function tidalAcceleration(mass: number, r: number, length: number): number {
  return (2 * G * mass * length) / (r * r * r);
}

/**
 * Hawking temperature T_H = ħc³ / (8π G M k_B).
 * [Hawking 1974, Nature 248, 30]
 * @returns Kelvin
 */
export function hawkingTemperature(mass: number): number {
  return (HBAR * Math.pow(C, 3)) / (8 * Math.PI * G * mass * K_B);
}

/**
 * Black hole evaporation time t = 5120 π G² M³ / (ħ c⁴)
 * (photons-only emission; Page 1976 gives ~×0.4 shorter with all species —
 * we report the standard photon-only benchmark and mark it as approximate).
 * @returns seconds
 */
export function hawkingEvaporationTime(mass: number): number {
  return (5120 * Math.PI * G * G * Math.pow(mass, 3)) / (HBAR * Math.pow(C, 4));
}

/**
 * Hawking luminosity P = ħc⁶ / (15360 π G² M²) (photon-only). [Page 1976]
 * @returns Watts
 */
export function hawkingLuminosity(mass: number): number {
  return (HBAR * Math.pow(C, 6)) / (15360 * Math.PI * G * G * mass * mass);
}

/**
 * Eddington luminosity: L_Edd = 4π G M m_p c / σ_T ≈ 1.26×10³¹ (M/M_sun) W.
 * Maximum luminosity where radiation pressure balances gravity for ionized H.
 * [Eddington 1926; Rybicki & Lightman 1979 §1.4]
 */
export function eddingtonLuminosity(mass: number): number {
  // Import here would create a cycle in some bundler configs; inline constants:
  const M_PROTON = 1.67262192369e-27;
  const SIGMA_THOMSON = 6.6524587321e-29;
  return (4 * Math.PI * G * mass * M_PROTON * C) / SIGMA_THOMSON;
}

/**
 * Orbital period of a circular orbit at radius r (Kepler's third law, valid
 * in Schwarzschild coordinates for the far-away observer):
 * T = 2π sqrt(r³ / GM). [MTW §25.3 — remarkably identical to Newtonian form]
 */
export function orbitalPeriod(mass: number, r: number): number {
  return 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / (G * mass));
}

/**
 * Radius at which tidal acceleration across a human body (~2 m, ~10 m/s² pain
 * threshold ~ survivable limit; we use 100 m/s² for "lethal") exceeds the limit.
 * Solve 2GML/r³ = a_limit → r = (2GML/a_limit)^(1/3).
 * Illustrative approximation.
 */
export function spaghettificationRadius(mass: number, length = 2, aLimit = 100): number {
  return Math.cbrt((2 * G * mass * length) / aLimit);
}

/**
 * Peak effective temperature of a Shakura–Sunyaev thin disk:
 *   T_max ≈ 6.3×10⁷ K · (Ṁ/Ṁ_Edd)^(1/4) · (M/M☉)^(-1/4)
 * [Frank, King & Raine, "Accretion Power in Astrophysics" 3rd ed. (2002), eq. 5.44]
 * Stellar-mass holes glow in X-rays; supermassive ones peak in UV/optical —
 * this single relation is why the simulation colors disks differently by mass.
 * @param mdotEddington accretion rate in Eddington units
 * @returns Kelvin
 */
export function diskPeakTemperature(massSolar: number, mdotEddington: number): number {
  return 6.3e7 * Math.pow(mdotEddington, 0.25) * Math.pow(massSolar, -0.25);
}

/** Convenience: full property sheet for a black hole of given mass/spin. */
export interface BlackHoleProperties {
  massKg: number;
  massSolar: number;
  schwarzschildRadius: number;
  horizonRadius: number;
  photonSphere: number;
  iscoPrograde: number;
  iscoRetrograde: number;
  ergosphereEquatorial: number;
  meanDensity: number;
  hawkingTemperature: number;
  evaporationTimeYears: number;
  timeDilationAt2Rs: number;
  eddingtonLuminosity: number;
  spaghettificationRadius: number;
}

export function blackHoleProperties(massSolar: number, spin = 0): BlackHoleProperties {
  const m = massSolar * M_SUN;
  return {
    massKg: m,
    massSolar,
    schwarzschildRadius: schwarzschildRadius(m),
    horizonRadius: kerrHorizonRadius(m, spin),
    photonSphere: photonSphereRadius(m),
    iscoPrograde: iscoRadiusKerr(m, spin, true),
    iscoRetrograde: iscoRadiusKerr(m, spin, false),
    ergosphereEquatorial: ergosphereRadiusEquatorial(m),
    meanDensity: meanDensityInsideHorizon(m),
    hawkingTemperature: hawkingTemperature(m),
    evaporationTimeYears: hawkingEvaporationTime(m) / YEAR,
    timeDilationAt2Rs: timeDilationFactor(m, 2 * schwarzschildRadius(m)),
    eddingtonLuminosity: eddingtonLuminosity(m),
    spaghettificationRadius: spaghettificationRadius(m),
  };
}
