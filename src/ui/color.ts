/**
 * Blackbody temperature → CSS color (Planckian locus approximation,
 * same Krystek-style fit used in the GLSL shader; valid 1000–40000 K).
 */
export function kelvinToRGB(tK: number): [number, number, number] {
  const t = Math.min(Math.max(tK, 1000), 40000) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) r = 1;
  else r = 1.2929 * Math.pow(t - 60, -0.1332);
  if (t <= 66) g = 0.39 * Math.log(t) - 0.6318;
  else g = 1.1299 * Math.pow(t - 60, -0.0755);
  if (t >= 66) b = 1;
  else if (t <= 19) b = 0;
  else b = 0.5432 * Math.log(t - 10) - 1.1962;
  return [clamp01(r), clamp01(g), clamp01(b)];
}

export function kelvinToCSS(tK: number, alpha = 1): string {
  const [r, g, b] = kelvinToRGB(tK);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
}

/** Linear interpolation between two rgb triplets, returns CSS string. */
export function mixRGB(a: [number, number, number], b: [number, number, number], t: number, alpha = 1): string {
  const m = (i: number) => Math.round((a[i] + (b[i] - a[i]) * t) * 255);
  return `rgba(${m(0)}, ${m(1)}, ${m(2)}, ${alpha})`;
}

function clamp01(x: number): number {
  return Math.min(Math.max(x, 0), 1);
}
