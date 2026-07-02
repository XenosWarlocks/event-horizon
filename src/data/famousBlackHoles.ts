/**
 * Famous black holes database — scientifically verified objects only.
 * Masses and distances from the cited primary literature.
 * Schwarzschild radii etc. are computed live from physics/blackhole.ts.
 */

export interface FamousBlackHole {
  id: string;
  name: string;
  massSolar: number;
  /** Estimated uncertainty band as a display string. */
  massNote: string;
  distanceLy: number;
  hostGalaxy: string;
  discovered: string;
  facts: string[];
  reference: string;
  spin?: number;
}

export const FAMOUS_BLACK_HOLES: FamousBlackHole[] = [
  {
    id: 'sgr-a-star',
    name: 'Sagittarius A*',
    massSolar: 4.297e6,
    massNote: '4.297 ± 0.013 ×10⁶ M☉ (GRAVITY interferometry)',
    distanceLy: 26673,
    hostGalaxy: 'Milky Way (our galactic centre)',
    discovered: 'Radio source found 1974 (Balick & Brown); mass confirmed by stellar orbits 1998–2008; imaged by EHT 2022.',
    facts: [
      'The star S2 orbits it every 16 years, reaching 7,650 km/s — 2.55% of light speed at closest approach.',
      'Genzel and Ghez shared the 2020 Nobel Prize in Physics for tracking those orbits.',
      'Despite 4.3 million solar masses, it would fit comfortably inside Mercury\'s orbit.',
    ],
    reference: 'GRAVITY Collaboration 2022, A&A 657, L12; EHT Collaboration 2022, ApJL 930, L12',
  },
  {
    id: 'm87-star',
    name: 'M87*',
    massSolar: 6.5e9,
    massNote: '6.5 ± 0.7 ×10⁹ M☉ (EHT ring diameter)',
    distanceLy: 5.35e7,
    hostGalaxy: 'Messier 87 (Virgo A), giant elliptical',
    discovered: 'First black hole ever directly imaged — Event Horizon Telescope, released 10 April 2019.',
    facts: [
      'Its event horizon is wider than the orbit of Pluto — the shadow spans ~2.5 light-days.',
      'Launches a relativistic jet 5,000 light-years long, visible since 1918.',
      '2021 polarized-light images revealed the magnetic fields that feed it.',
    ],
    reference: 'EHT Collaboration 2019, ApJL 875, L1',
    spin: 0.9,
  },
  {
    id: 'ton-618',
    name: 'TON 618',
    massSolar: 4.07e10,
    massNote: '~4×10¹⁰ M☉ (Hβ line width; systematics ~×2)',
    distanceLy: 1.08e10,
    hostGalaxy: 'Distant hyperluminous quasar host (z = 2.219)',
    discovered: 'Catalogued 1957 in the Tonantzintla survey; recognized as a quasar 1970.',
    facts: [
      'One of the most massive black holes ever measured — 40 billion Suns.',
      'Its Schwarzschild radius is ~40× the Sun–Pluto distance; light takes days to cross it.',
      'Shines at ~4×10⁴⁰ W, about 140 trillion times the Sun\'s luminosity.',
    ],
    reference: 'Shemmer et al. 2004, ApJ 614, 547',
  },
  {
    id: 'holmberg-15a',
    name: 'Holmberg 15A*',
    massSolar: 4.0e10,
    massNote: '(4.0 ± 0.8)×10¹⁰ M☉ (stellar dynamics)',
    distanceLy: 7.0e8,
    hostGalaxy: 'Holmberg 15A, central galaxy of cluster Abell 85',
    discovered: 'Direct dynamical mass measurement published 2019 (MUSE spectroscopy).',
    facts: [
      'The most massive black hole measured by direct stellar dynamics rather than gas or line widths.',
      'Sits inside a "depleted core" — it ejected ~10¹⁰ M☉ of stars while merging.',
    ],
    reference: 'Mehrgan et al. 2019, ApJ 887, 195',
  },
  {
    id: 'phoenix-a',
    name: 'Phoenix A',
    massSolar: 1.0e11,
    massNote: '~10¹¹ M☉ (model-dependent estimate — treat with caution)',
    distanceLy: 5.7e9,
    hostGalaxy: 'Phoenix Cluster central galaxy (SPT-CL J2344-4243)',
    discovered: 'Cluster discovered 2010 by the South Pole Telescope; black hole mass modelled 2015+.',
    facts: [
      'Possibly the most massive black hole known, but the estimate comes from cooling-flow models, not direct dynamics.',
      'Its host cluster forms stars at ~740 M☉ per year — the highest known central starburst.',
    ],
    reference: 'McDonald et al. 2012, Nature 488, 349 (cluster); mass estimates model-dependent',
  },
  {
    id: 'ngc-4889',
    name: 'NGC 4889*',
    massSolar: 2.1e10,
    massNote: '(0.6–3.7)×10¹⁰ M☉, best fit 2.1×10¹⁰ (stellar dynamics)',
    distanceLy: 3.08e8,
    hostGalaxy: 'NGC 4889, brightest galaxy in the Coma Cluster',
    discovered: 'Mass measured 2011 — at the time the largest ever.',
    facts: [
      'A dormant quasar: it once outshone entire galaxies, now sits quietly.',
      'Its event horizon is ~12× the diameter of Neptune\'s orbit.',
    ],
    reference: 'McConnell et al. 2011, Nature 480, 215',
  },
  {
    id: 'cygnus-x1',
    name: 'Cygnus X-1',
    massSolar: 21.2,
    massNote: '21.2 ± 2.2 M☉ (VLBI parallax + orbital dynamics)',
    distanceLy: 7240,
    hostGalaxy: 'Milky Way (Cygnus arm)',
    discovered: 'X-ray source found 1964; first widely accepted black hole (1971–73).',
    facts: [
      'Subject of a famous 1974 bet: Stephen Hawking wagered it was NOT a black hole — and conceded in 1990.',
      'Spins at over 95% of the theoretical maximum, dragging spacetime around with it.',
      'Feeds on the blue supergiant HDE 226868, which orbits it every 5.6 days.',
    ],
    reference: 'Miller-Jones et al. 2021, Science 371, 1046',
    spin: 0.95,
  },
  {
    id: 'gaia-bh1',
    name: 'Gaia BH1',
    massSolar: 9.62,
    massNote: '9.62 ± 0.18 M☉ (astrometric + spectroscopic orbit)',
    distanceLy: 1560,
    hostGalaxy: 'Milky Way — the nearest known black hole to Earth',
    discovered: 'Found 2022 in Gaia astrometry: a Sun-like star wobbling around an invisible companion.',
    facts: [
      'The closest known black hole — 1,560 light-years away, in Ophiuchus.',
      'Completely dormant: no X-rays, no accretion. Found purely by gravity.',
      'Its companion star orbits at roughly the Earth–Sun distance.',
    ],
    reference: 'El-Badry et al. 2023, MNRAS 518, 1057',
  },
];
