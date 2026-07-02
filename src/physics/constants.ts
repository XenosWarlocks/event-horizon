/**
 * Physical and astronomical constants (SI units).
 *
 * Sources:
 *  - CODATA 2018 recommended values (Tiesinga et al., Rev. Mod. Phys. 93, 025010, 2021)
 *  - IAU 2015 Resolution B3 nominal solar values (Prša et al., AJ 152, 41, 2016)
 */

/** Gravitational constant [m^3 kg^-1 s^-2] — CODATA 2018 */
export const G = 6.6743e-11;

/** Speed of light in vacuum [m/s] — exact, SI definition */
export const C = 2.99792458e8;

/** Reduced Planck constant [J s] — exact, SI definition (h = 6.62607015e-34) */
export const HBAR = 1.054571817e-34;

/** Boltzmann constant [J/K] — exact, SI definition */
export const K_B = 1.380649e-23;

/** Stefan–Boltzmann constant [W m^-2 K^-4] — derived, exact */
export const SIGMA_SB = 5.670374419e-8;

/** Proton mass [kg] — CODATA 2018 */
export const M_PROTON = 1.67262192369e-27;

/** Thomson scattering cross-section [m^2] — CODATA 2018 */
export const SIGMA_THOMSON = 6.6524587321e-29;

/** Nominal solar mass [kg] — IAU 2015 B3 (GM_sun / G) */
export const M_SUN = 1.98892e30;

/** Nominal solar radius [m] — IAU 2015 B3 */
export const R_SUN = 6.957e8;

/** Nominal solar luminosity [W] — IAU 2015 B3 */
export const L_SUN = 3.828e26;

/** Solar effective temperature [K] — IAU 2015 B3 */
export const T_SUN = 5772;

/** Earth mass [kg] — IAU nominal */
export const M_EARTH = 5.9722e24;

/** Earth equatorial radius [m] — IAU nominal */
export const R_EARTH = 6.3781e6;

/** Astronomical unit [m] — exact, IAU 2012 */
export const AU = 1.495978707e11;

/** Julian light-year [m] (c × 365.25 d) */
export const LIGHT_YEAR = 9.4607304725808e15;

/** Parsec [m] (648000/π AU, IAU 2015) */
export const PARSEC = 3.0856775814913673e16;

/** Julian year [s] */
export const YEAR = 3.15576e7;

/** Age of the universe [s] (~13.787 Gyr, Planck 2018: Aghanim et al., A&A 641, A6, 2020) */
export const AGE_UNIVERSE = 13.787e9 * YEAR;

/** Sun–Earth distance = 1 AU; mean Moon distance [m] */
export const MOON_DISTANCE = 3.844e8;

/** Chandrasekhar mass limit [kg] (~1.4 M_sun; Chandrasekhar 1931, ApJ 74, 81) */
export const M_CHANDRASEKHAR = 1.4 * M_SUN;

/**
 * Tolman–Oppenheimer–Volkoff limit [kg].
 * Modern constraints from GW170817 give ~2.2–2.4 M_sun
 * (Rezzolla, Most & Weih 2018, ApJ 852, L25). We adopt 2.3 M_sun.
 */
export const M_TOV = 2.3 * M_SUN;
