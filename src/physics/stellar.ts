/**
 * Stellar structure, evolution, and compact-remnant physics.
 *
 * References:
 *  - Hansen, Kawaler & Trimble, "Stellar Interiors" (2004)
 *  - Kippenhahn, Weigert & Weiss, "Stellar Structure and Evolution" (2012)
 *  - Heger et al. 2003, ApJ 591, 288 (massive star fates, pair instability)
 *  - Chandrasekhar 1931, ApJ 74, 81 (white dwarf mass limit)
 *  - Oppenheimer & Volkoff 1939, Phys. Rev. 55, 374 (neutron star limit)
 */

import { G, M_SUN, R_SUN, L_SUN, T_SUN, SIGMA_SB, YEAR, M_CHANDRASEKHAR, M_TOV } from './constants';

/**
 * Main-sequence mass–luminosity relation (piecewise power law fit to
 * observations; e.g. Salaris & Cassisi 2005 §5.7; Eker et al. 2018, MNRAS 479):
 *   M < 0.43 M☉:  L ∝ 0.23 M^2.3
 *   0.43–2 M☉:    L ∝ M^4
 *   2–55 M☉:      L ∝ 1.4 M^3.5
 *   > 55 M☉:      L ∝ 32000 M   (radiation-pressure dominated, near-Eddington)
 * @param massSolar stellar mass in M☉ → luminosity in L☉
 */
export function mainSequenceLuminosity(massSolar: number): number {
  if (massSolar < 0.43) return 0.23 * Math.pow(massSolar, 2.3);
  if (massSolar < 2) return Math.pow(massSolar, 4);
  if (massSolar < 55) return 1.4 * Math.pow(massSolar, 3.5);
  return 32000 * massSolar;
}

/**
 * Main-sequence radius–mass relation (approximate; Kippenhahn et al. 2012):
 *   R ∝ M^0.8  (M < 1 M☉),  R ∝ M^0.57 (M ≥ 1 M☉)
 * @returns radius in R☉
 */
export function mainSequenceRadius(massSolar: number): number {
  return massSolar < 1 ? Math.pow(massSolar, 0.8) : Math.pow(massSolar, 0.57);
}

/**
 * Effective surface temperature from Stefan–Boltzmann: L = 4πR²σT⁴
 * → T = T☉ (L/L☉)^(1/4) (R/R☉)^(-1/2).
 */
export function effectiveTemperature(luminositySolar: number, radiusSolar: number): number {
  return T_SUN * Math.pow(luminositySolar, 0.25) / Math.sqrt(radiusSolar);
}

/**
 * Main-sequence lifetime: t ≈ 10 Gyr × (M/M☉) / (L/L☉)
 * (fuel ∝ M, burn rate ∝ L; Hansen et al. 2004 §1.6).
 * For the Sun this gives ~10 Gyr, matching solar models.
 * @returns years
 */
export function mainSequenceLifetimeYears(massSolar: number): number {
  return 1e10 * massSolar / mainSequenceLuminosity(massSolar);
}

/**
 * Central temperature estimate from the virial theorem for an ideal-gas star:
 * T_c ≈ (μ m_p / k_B) × GM/(αR), α≈2 for the mean; T_c(Sun) ≈ 1.5×10⁷ K.
 * We calibrate to the solar value: T_c ≈ 1.57×10⁷ K × (M/M☉)/(R/R☉).
 * [Kippenhahn et al. 2012, ch. 2 — order-of-magnitude scaling]
 */
export function coreTemperature(massSolar: number, radiusSolar: number): number {
  return 1.57e7 * (massSolar / radiusSolar);
}

/**
 * Hydrogen fusion rate implied by luminosity: proton–proton chain converts
 * 0.7% of rest mass to energy (4 ¹H → ⁴He releases 26.73 MeV ≈ 0.007×4m_p c²).
 * dm/dt = L / (0.007 c²). Sun: ≈ 4.3×10⁹ kg/s hydrogen → energy at ~6×10¹¹ kg/s burned.
 * @returns kg of hydrogen fused per second
 */
export function fusionMassRate(luminosityWatts: number): number {
  const C = 2.99792458e8;
  return luminosityWatts / (0.007 * C * C);
}

export type RemnantType =
  | 'white-dwarf'
  | 'neutron-star'
  | 'black-hole'
  | 'pair-instability-no-remnant'
  | 'direct-collapse-black-hole';

export interface StellarFate {
  remnant: RemnantType;
  /** Remnant mass in M☉ (0 for pair-instability SN, which leaves nothing). */
  remnantMassSolar: number;
  /** Human-readable pathway. */
  pathway: string;
}

/**
 * Final fate of a single (non-binary) star of given ZAMS mass at ~solar
 * metallicity, following Heger et al. 2003 (ApJ 591, 288):
 *   < 8 M☉        → white dwarf (CO or ONe), M_wd ≈ 0.109 M + 0.394 (Kalirai et al. 2008)
 *   8–20 M☉       → core-collapse SN → neutron star (≲ M_TOV)
 *   20–40 M☉      → SN / fallback → stellar black hole (~M/3, rough fit to
 *                    Spera & Mapelli 2017 remnant masses)
 *   40–130 M☉     → weak/failed SN → black hole by fallback/direct collapse
 *   130–250 M☉    → pair-instability supernova → NO remnant (fully disrupted)
 *   > 250 M☉      → photodisintegration instability → direct collapse BH
 * All boundaries are metallicity-dependent; values are approximations.
 */
export function stellarFate(zamsMassSolar: number): StellarFate {
  const m = zamsMassSolar;
  if (m < 8) {
    // Kalirai et al. 2008 (ApJ 676, 594) initial–final mass relation
    const wd = Math.min(0.109 * m + 0.394, M_CHANDRASEKHAR / M_SUN);
    return {
      remnant: 'white-dwarf',
      remnantMassSolar: wd,
      pathway: 'Red giant → planetary nebula → white dwarf, supported by electron degeneracy pressure (Chandrasekhar 1931).',
    };
  }
  if (m < 20) {
    const ns = Math.min(1.2 + 0.05 * (m - 8), M_TOV / M_SUN);
    return {
      remnant: 'neutron-star',
      remnantMassSolar: ns,
      pathway: 'Core-collapse supernova (Type II) → neutron star, supported by neutron degeneracy pressure below the TOV limit.',
    };
  }
  if (m < 130) {
    // Rough remnant fraction ~1/3 of ZAMS mass (Spera & Mapelli 2017, MNRAS 470)
    return {
      remnant: 'black-hole',
      remnantMassSolar: Math.max(m / 3, M_TOV / M_SUN),
      pathway: m < 40
        ? 'Core-collapse supernova with fallback → stellar-mass black hole.'
        : 'Weak or failed supernova → black hole by massive fallback / direct collapse.',
    };
  }
  if (m < 250) {
    return {
      remnant: 'pair-instability-no-remnant',
      remnantMassSolar: 0,
      pathway: 'e⁺e⁻ pair production softens the core equation of state → runaway thermonuclear explosion disrupts the entire star. No remnant (Heger et al. 2003).',
    };
  }
  return {
    remnant: 'direct-collapse-black-hole',
    remnantMassSolar: m / 2,
    pathway: 'Photodisintegration-driven collapse; the star implodes directly to a black hole with little mass loss (Heger et al. 2003).',
  };
}

/**
 * Free-fall (dynamical collapse) timescale of a self-gravitating body:
 * t_ff = sqrt(3π / (32 G ρ)). [Kippenhahn et al. 2012, eq. 2.18]
 * The Sun's t_ff ≈ 30 min — this is why pressure support matters.
 * @param density mean density [kg/m³] → seconds
 */
export function freeFallTime(density: number): number {
  return Math.sqrt((3 * Math.PI) / (32 * G * density));
}

/**
 * Kelvin–Helmholtz (thermal) timescale: t_KH = GM²/(2RL).
 * Time to radiate away gravitational binding energy — the pre-fusion
 * contraction clock (~30 Myr for the Sun). [Hansen et al. 2004 §1.3]
 * @returns seconds
 */
export function kelvinHelmholtzTime(massKg: number, radiusM: number, luminosityW: number): number {
  return (G * massKg * massKg) / (2 * radiusM * luminosityW);
}

/**
 * Gravitational binding energy of a uniform-density sphere: U = 3GM²/(5R).
 * Real stars are centrally condensed (U_sun ≈ 2× this), so we mark it approximate.
 * [Chandrasekhar, "Stellar Structure" 1939]
 */
export function bindingEnergyUniformSphere(massKg: number, radiusM: number): number {
  return (3 * G * massKg * massKg) / (5 * radiusM);
}

/** Solar reference numbers, exported for UI display. */
export const SOLAR_REFERENCE = {
  lifetimeYears: mainSequenceLifetimeYears(1),
  coreTempK: coreTemperature(1, 1),
  fusionRateKgPerS: fusionMassRate(L_SUN),
  freeFallSeconds: freeFallTime(M_SUN / ((4 / 3) * Math.PI * Math.pow(R_SUN, 3))),
};
