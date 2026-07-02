/**
 * The black hole taxonomy for the Observatory.
 * Representative masses are chosen from the published literature;
 * all derived quantities (r_s, ISCO, density, T_H, …) are computed live
 * from src/physics/blackhole.ts — never hard-coded.
 */

export interface BlackHoleClass {
  id: string;
  name: string;
  /** Representative mass in solar masses (slider default). */
  massSolar: number;
  /** Slider range [min, max] in solar masses (log scale). */
  massRange: [number, number];
  formation: string;
  largestKnown: string;
  typicalHost: string;
  population: string;
  discovery: string;
  hypothetical?: boolean;
}

export const BLACK_HOLE_CLASSES: BlackHoleClass[] = [
  {
    id: 'primordial',
    name: 'Primordial Black Hole',
    massSolar: 1e-12,
    massRange: [1e-18, 1e5],
    formation:
      'Hypothetical: direct collapse of overdense regions in the first second after the Big Bang (Zel\'dovich & Novikov 1967; Hawking 1971). Never observed.',
    largestKnown: 'None observed — constrained by microlensing surveys (e.g. Subaru HSC, OGLE) and CMB limits.',
    typicalHost: 'Would permeate all of space, possibly contributing to dark matter.',
    population: 'Unknown; could be zero. Asteroid-mass window (10¹⁷–10²² g) remains open as dark matter candidate.',
    discovery: 'Proposed 1967–1971; still hypothetical in 2026.',
    hypothetical: true,
  },
  {
    id: 'stellar',
    name: 'Stellar-Mass Black Hole',
    massSolar: 10,
    massRange: [3, 150],
    formation:
      'Core collapse of stars above ~20 M☉ once nuclear fuel is exhausted and the core exceeds the Tolman–Oppenheimer–Volkoff limit (~2.3 M☉).',
    largestKnown: 'GW190521 merger remnant: ~142 M☉ (LIGO/Virgo, Abbott et al. 2020, PRL 125, 101102).',
    typicalHost: 'Throughout galactic disks; X-ray binaries and isolated stars.',
    population: '~10⁸ per Milky Way-like galaxy (van den Heuvel 1992 estimate).',
    discovery: 'Cygnus X-1 identified as the first strong candidate in 1971 (Webster & Murdin; Bolton).',
  },
  {
    id: 'intermediate',
    name: 'Intermediate-Mass Black Hole',
    massSolar: 1e4,
    massRange: [100, 1e5],
    formation:
      'Runaway stellar collisions in dense clusters, repeated black hole mergers, or direct collapse of Population III stars (Portegies Zwart et al. 2010).',
    largestKnown: 'Strong candidates near 10⁴–10⁵ M☉ (e.g. HLX-1 in ESO 243-49, ~10⁴ M☉; Farrell et al. 2009, Nature 460).',
    typicalHost: 'Globular clusters, dwarf galaxy nuclei, hyperluminous X-ray sources.',
    population: 'Uncertain; the "missing link" — hundreds of candidates, few confirmations.',
    discovery: 'GW190521 (2019) produced the first confirmed IMBH of 142 M☉ via gravitational waves.',
  },
  {
    id: 'massive',
    name: 'Massive Black Hole',
    massSolar: 1e6,
    massRange: [1e5, 1e7],
    formation:
      'Growth by gas accretion and mergers from lighter seeds; occupy the nuclei of dwarf and spiral galaxies.',
    largestKnown: 'Continuum with SMBHs; e.g. the Milky Way\'s Sagittarius A* at 4.3×10⁶ M☉.',
    typicalHost: 'Nuclei of spiral and dwarf galaxies.',
    population: 'Most galaxies with bulges host one (Kormendy & Ho 2013, ARA&A 51).',
    discovery: 'Stellar orbits around Sgr A* tracked from 1995 (Genzel & Ghez groups; 2020 Nobel Prize).',
  },
  {
    id: 'supermassive',
    name: 'Supermassive Black Hole',
    massSolar: 6.5e9,
    massRange: [1e7, 2e10],
    formation:
      'Accretion-dominated growth over cosmic time from heavy seeds (direct-collapse, 10⁴–10⁵ M☉) or light seeds with super-Eddington episodes (Rees 1984; Inayoshi et al. 2020, ARA&A 58).',
    largestKnown: 'M87*: 6.5×10⁹ M☉, first black hole ever imaged (EHT Collaboration 2019, ApJL 875, L1).',
    typicalHost: 'Nuclei of massive elliptical and spiral galaxies; power quasars and AGN.',
    population: 'One per massive galaxy: ≳10¹¹ in the observable universe.',
    discovery: 'Quasars identified as accreting SMBHs in 1963 (Schmidt, 3C 273); imaged directly 2019.',
  },
  {
    id: 'ultramassive',
    name: 'Ultramassive Black Hole',
    massSolar: 4e10,
    massRange: [2e10, 1e11],
    formation:
      'The high-mass tail of SMBH growth in the most massive cluster ellipticals; likely fed by cooling flows and repeated mergers (McConnell et al. 2011, Nature 480).',
    largestKnown: 'TON 618 (~4×10¹⁰ M☉, quasar spectroscopy) and Phoenix A (~10¹¹ M☉, model-dependent).',
    typicalHost: 'Brightest cluster galaxies at the centres of galaxy clusters.',
    population: 'Extremely rare: perhaps one per rich galaxy cluster.',
    discovery: 'Term coined ~2011 for black holes above 10¹⁰ M☉.',
  },
  {
    id: 'hypermassive',
    name: 'Hypermassive Black Hole (theoretical ceiling)',
    massSolar: 2.7e11,
    massRange: [1e11, 1e12],
    formation:
      'None known to exist. Above ~(2–7)×10¹¹ M☉, the accretion disk becomes gravitationally unstable and star formation starves the hole — a theoretical maximum mass (King 2016, MNRAS 456, L109).',
    largestKnown: 'None — this class is a theoretical extrapolation, shown for scale.',
    typicalHost: 'Would require the most extreme cluster environments in the universe.',
    population: 'Zero confirmed.',
    discovery: 'Theoretical limit published 2016.',
    hypothetical: true,
  },
];
