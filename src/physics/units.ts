/**
 * Human-readable formatting of physical quantities.
 * Pure presentation — no physics lives here.
 */

import { AU, LIGHT_YEAR, PARSEC, YEAR, M_SUN, R_SUN, M_EARTH, R_EARTH, C, L_SUN } from './constants';

const SI_PREFIXES: Array<[number, string]> = [
  [1e24, 'Y'], [1e21, 'Z'], [1e18, 'E'], [1e15, 'P'], [1e12, 'T'],
  [1e9, 'G'], [1e6, 'M'], [1e3, 'k'],
];

export function sig(x: number, digits = 3): string {
  if (!isFinite(x)) return x > 0 ? '∞' : '-∞';
  if (x === 0) return '0';
  const abs = Math.abs(x);
  if (abs >= 1e5 || abs < 1e-3) {
    const exp = Math.floor(Math.log10(abs));
    const mant = x / Math.pow(10, exp);
    return `${mant.toFixed(digits - 1)}×10${superscript(exp)}`;
  }
  return Number(x.toPrecision(digits)).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function superscript(n: number): string {
  const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  return String(n).split('').map((c) => map[c] ?? c).join('');
}

/** Length: picks m / km / R☉ / AU / ly / pc-Mpc as appropriate. */
export function fmtLength(m: number): string {
  if (!isFinite(m)) return '∞';
  if (m < 1e-2) return `${sig(m * 1000)} mm`;
  if (m < 1e4) return `${sig(m)} m`;
  if (m < 0.1 * AU) return `${sig(m / 1000)} km`;
  if (m < 0.5 * LIGHT_YEAR) return `${sig(m / AU)} AU`;
  if (m < 1e3 * LIGHT_YEAR) return `${sig(m / LIGHT_YEAR)} ly`;
  if (m < 1e6 * PARSEC) return `${sig(m / (1e3 * PARSEC))} kpc`;
  return `${sig(m / (1e6 * PARSEC))} Mpc`;
}

/** Length with a solar-radius comparison when in that regime. */
export function fmtLengthSolar(m: number): string {
  if (m > 0.05 * R_SUN && m < 1e4 * R_SUN) return `${fmtLength(m)} (${sig(m / R_SUN)} R☉)`;
  return fmtLength(m);
}

export function fmtMass(kg: number): string {
  if (kg >= 0.001 * M_SUN) return `${sig(kg / M_SUN)} M☉`;
  if (kg >= 0.01 * M_EARTH) return `${sig(kg / M_EARTH)} M⊕`;
  return `${sig(kg)} kg`;
}

export function fmtTimeYears(yr: number): string {
  if (!isFinite(yr)) return 'forever';
  if (yr < 1 / 525600) return `${sig(yr * YEAR)} s`;
  if (yr < 1 / 8760) return `${sig(yr * 525600)} min`;
  if (yr < 1 / 365.25) return `${sig(yr * 8760)} hours`;
  if (yr < 1) return `${sig(yr * 365.25)} days`;
  if (yr < 1e3) return `${sig(yr)} years`;
  if (yr < 1e6) return `${sig(yr / 1e3)} thousand years`;
  if (yr < 1e9) return `${sig(yr / 1e6)} million years`;
  if (yr < 1e12) return `${sig(yr / 1e9)} billion years`;
  return `${sig(yr / 1e12)} trillion years`;
}

export function fmtSpeed(ms: number): string {
  if (ms >= 0.001 * C) return `${sig(ms / C)} c (${sig(ms / 1000)} km/s)`;
  if (ms >= 1000) return `${sig(ms / 1000)} km/s`;
  return `${sig(ms)} m/s`;
}

export function fmtDensity(kgm3: number): string {
  const water = kgm3 / 1000;
  if (water >= 0.001 && water < 1e6) return `${sig(kgm3)} kg/m³ (${sig(water)}× water)`;
  return `${sig(kgm3)} kg/m³`;
}

export function fmtLuminosity(w: number): string {
  if (w >= 0.001 * L_SUN) return `${sig(w / L_SUN)} L☉`;
  return `${sig(w)} W`;
}

export function fmtEnergy(j: number): string {
  return `${sig(j)} J`;
}

export function fmtTemp(k: number): string {
  if (k < 1e-3) return `${sig(k * 1e9)} nK`;
  if (k < 1) return `${sig(k * 1000)} mK`;
  return `${sig(k)} K`;
}

export function fmtCount(n: number): string {
  if (n < 1e3) return String(Math.round(n));
  if (n < 1e6) return `${sig(n / 1e3)} thousand`;
  if (n < 1e9) return `${sig(n / 1e6)} million`;
  if (n < 1e12) return `${sig(n / 1e9)} billion`;
  return `${sig(n / 1e12)} trillion`;
}
