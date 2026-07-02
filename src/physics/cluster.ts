/**
 * Star-cluster dynamics: the "N Suns" simulator.
 *
 * Given N solar-mass stars packed into a cluster, compute mass, size,
 * density, velocities, energies, relaxation & collision timescales, and
 * the fate of the system.
 *
 * References:
 *  - Binney & Tremaine, "Galactic Dynamics" 2nd ed. (2008) [BT08]
 *  - Spitzer, "Dynamical Evolution of Globular Clusters" (1987)
 *  - Portegies Zwart et al. 2010, ARA&A 48, 431 (runaway mergers → IMBH)
 *  - Rees 1984, ARA&A 22, 471 (routes to supermassive black holes)
 */

import { G, C, M_SUN, R_SUN, L_SUN, PARSEC, YEAR } from './constants';
import { schwarzschildRadius } from './blackhole';
import { mainSequenceLuminosity, freeFallTime, bindingEnergyUniformSphere } from './stellar';

export interface ClusterModel {
  nStars: number;
  totalMassKg: number;
  totalMassSolar: number;
  /** Cluster radius [m] chosen from a realistic density profile (see clusterRadius). */
  radiusM: number;
  radiusPc: number;
  /** Combined volume of the stellar material itself [m³] — N × (4/3)πR☉³. */
  stellarVolumeM3: number;
  /** Radius of a single sphere holding all stellar material [m]. */
  packedRadiusM: number;
  /** Mean separation between neighbouring stars [m]. */
  meanSeparationM: number;
  /** Mean cluster density [kg/m³]. */
  meanDensity: number;
  /** Escape velocity from the cluster edge [m/s]. */
  escapeVelocity: number;
  /** Virial (typical orbital) velocity [m/s]. */
  virialVelocity: number;
  /** Gravitational binding energy (uniform sphere approx) [J]. */
  bindingEnergyJ: number;
  /** Gravitational potential at the surface Φ = -GM/R [J/kg]. */
  surfacePotential: number;
  /** Combined luminosity [W] (all stars on the main sequence). */
  luminosityW: number;
  /** Total hydrogen fusion rate [kg/s]. */
  fusionRateKgS: number;
  /** Two-body relaxation time [yr]. */
  relaxationTimeYr: number;
  /** Core-collapse time ≈ 15 × t_relax [yr] (BT08 §7.5.3). */
  coreCollapseTimeYr: number;
  /** Free-fall time if pressure/orbits vanished [yr]. */
  freeFallTimeYr: number;
  /** Mean time between physical stellar collisions for one star [yr]. */
  collisionTimeYr: number;
  /** Ratio of cluster radius to the Schwarzschild radius of its total mass. */
  radiusOverSchwarzschild: number;
  /** Is the configuration already inside its own event horizon? */
  isBlackHole: boolean;
  /** Relativistic parameter: virial velocity / c. */
  virialBeta: number;
  /** Qualitative fate string (with the physics that decides it). */
  fate: string;
}

/**
 * Adopted cluster radius as a function of N.
 *
 * Real dense systems span:
 *  - Open clusters: ~10³ stars in ~2 pc
 *  - Globular clusters: ~10⁵–10⁶ stars, half-mass radius ~3 pc
 *  - Nuclear star clusters: ~10⁷ stars in ~4 pc (Neumayer et al. 2020)
 *
 * We scale R ∝ N^(1/3) at a fixed typical density of a dense globular core
 * (~10⁵ M☉/pc³ would be extreme; we adopt ~10⁴ M☉/pc³, cf. Harris 1996 catalog
 * core densities), i.e. stars per cubic parsec ≈ 10⁴. This is a *modeling
 * choice*, clearly surfaced in the UI, and the user can compress it.
 */
export function clusterRadius(nStars: number): number {
  const starsPerPc3 = 1e4;
  const volumePc3 = nStars / starsPerPc3;
  const rPc = Math.cbrt((3 * volumePc3) / (4 * Math.PI));
  return rPc * PARSEC;
}

/**
 * Two-body relaxation time (Spitzer 1987; BT08 eq. 7.108):
 *   t_rlx ≈ (0.1 N / ln N) × t_cross,  t_cross = R / v_vir
 * This is the clock for core collapse and mass segregation.
 */
export function relaxationTime(nStars: number, radiusM: number, massKg: number): number {
  const vVir = Math.sqrt((G * massKg) / radiusM);
  const tCross = radiusM / vVir;
  const lnN = Math.log(Math.max(nStars, 2));
  return ((0.1 * nStars) / lnN) * tCross;
}

/**
 * Physical collision time for a single star (BT08 eq. 7.195, with
 * gravitational focusing):
 *   t_coll⁻¹ = 16 √π n σ v_rel [1 + Θ],  Θ = G m / (2 σ² r_*)  (Safronov number)
 * where n = stellar number density, σ = 1D velocity dispersion, r_* = R☉.
 * We use the simplified form t_coll⁻¹ = n Σ v with Σ = π r_*² (1 + v_esc²/v²).
 */
export function collisionTime(nStars: number, radiusM: number): number {
  const volume = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  const n = nStars / volume; // stars per m³
  const massKg = nStars * M_SUN;
  const v = Math.sqrt((G * massKg) / radiusM); // virial speed
  const rStar = 2 * R_SUN; // collision when centres pass within 2 R☉
  const vEscStar = Math.sqrt((2 * G * M_SUN) / R_SUN);
  const focusing = 1 + (vEscStar * vEscStar) / (v * v);
  const sigma = Math.PI * rStar * rStar * focusing;
  const rate = n * sigma * v;
  return rate > 0 ? 1 / rate : Infinity;
}

/** Decide the qualitative fate of the cluster from its computed physics. */
function clusterFate(m: Omit<ClusterModel, 'fate'>): string {
  if (m.isBlackHole) {
    return 'This configuration is already inside its own Schwarzschild radius — it IS a black hole. No pressure can prevent collapse once R < r_s (Penrose 1965 singularity theorem).';
  }
  if (m.virialBeta > 0.3) {
    return 'Relativistically unstable: virial velocities approach c. General-relativistic instability drives collapse to a supermassive black hole within a free-fall time (Rees 1984; Chandrasekhar 1964).';
  }
  if (m.collisionTimeYr < 1e6) {
    return 'Runaway collision phase: stars physically collide faster than they evolve, building a very massive star that collapses to an intermediate-mass black hole (Portegies Zwart et al. 2010).';
  }
  if (m.coreCollapseTimeYr < 13.8e9) {
    return 'Core collapse occurs within a Hubble time: mass segregation concentrates the heaviest bodies, forming a dense core where black holes form and merge.';
  }
  return 'Dynamically stable for longer than the age of the universe. Orbits (angular momentum), not pressure, prevent collapse — exactly why galaxies do not fall into black holes.';
}

/** Build the full physical model for N solar-mass stars. */
export function buildClusterModel(nStars: number, compression = 1): ClusterModel {
  const totalMassKg = nStars * M_SUN;
  const radiusM = clusterRadius(nStars) / compression;
  const volume = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  const meanDensity = totalMassKg / volume;
  const stellarVolume = nStars * (4 / 3) * Math.PI * Math.pow(R_SUN, 3);
  const packedRadius = Math.cbrt((3 * stellarVolume) / (4 * Math.PI));
  const meanSeparation = Math.cbrt(volume / Math.max(nStars, 1));
  const vEsc = Math.sqrt((2 * G * totalMassKg) / radiusM);
  const vVir = Math.sqrt((G * totalMassKg) / radiusM);
  const rs = schwarzschildRadius(totalMassKg);
  const lum = nStars * mainSequenceLuminosity(1) * L_SUN;

  const base: Omit<ClusterModel, 'fate'> = {
    nStars,
    totalMassKg,
    totalMassSolar: nStars,
    radiusM,
    radiusPc: radiusM / PARSEC,
    stellarVolumeM3: stellarVolume,
    packedRadiusM: packedRadius,
    meanSeparationM: meanSeparation,
    meanDensity,
    escapeVelocity: vEsc,
    virialVelocity: vVir,
    bindingEnergyJ: bindingEnergyUniformSphere(totalMassKg, radiusM),
    surfacePotential: (-G * totalMassKg) / radiusM,
    luminosityW: lum,
    fusionRateKgS: lum / (0.007 * C * C),
    relaxationTimeYr: relaxationTime(nStars, radiusM, totalMassKg) / YEAR,
    coreCollapseTimeYr: (15 * relaxationTime(nStars, radiusM, totalMassKg)) / YEAR,
    freeFallTimeYr: freeFallTime(meanDensity) / YEAR,
    collisionTimeYr: collisionTime(nStars, radiusM) / YEAR,
    radiusOverSchwarzschild: radiusM / rs,
    isBlackHole: radiusM <= rs,
    virialBeta: vVir / C,
  };
  return { ...base, fate: clusterFate(base) };
}

/** The canonical ladder of N used by the UI. */
export const CLUSTER_LADDER = [
  1, 10, 100, 1_000, 10_000, 100_000,
  1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12,
];
