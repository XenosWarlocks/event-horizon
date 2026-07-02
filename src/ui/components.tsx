/** Shared UI primitives: stat rows, log sliders, toggles, chips. */

import { ReactNode } from 'react';

export function StatRow({ k, v, tone }: { k: string; v: ReactNode; tone?: 'accent' | 'warn' | 'ok' }) {
  return (
    <div className="stat-row">
      <span className="k">{k}</span>
      <span className={`v ${tone ?? ''}`}>{v}</span>
    </div>
  );
}

/**
 * Logarithmic slider: maps a linear [0,1000] range to [min,max] in log space,
 * which is the only sane way to span 10⁻¹⁸ → 10¹² solar masses.
 */
export function LogSlider({
  label, value, min, max, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const lmin = Math.log10(min);
  const lmax = Math.log10(max);
  const pos = ((Math.log10(value) - lmin) / (lmax - lmin)) * 1000;
  return (
    <div className="slider-block">
      <div className="slider-head">
        <label>{label}</label>
        <span className="val">{format(value)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1000}
        value={pos}
        onChange={(e) => onChange(Math.pow(10, lmin + (Number(e.target.value) / 1000) * (lmax - lmin)))}
      />
    </div>
  );
}

export function LinSlider({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="slider-block">
      <div className="slider-head">
        <label>{label}</label>
        <span className="val">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? (max - min) / 200}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <label>{label}</label>
      <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} aria-label={label} />
    </div>
  );
}

export function Chips<T extends string | number>({
  options, value, onChange, render,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => string;
}) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={String(o)} className={`chip ${o === value ? 'active' : ''}`} onClick={() => onChange(o)}>
          {render(o)}
        </button>
      ))}
    </div>
  );
}

export function Equation({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <div>
      <div className="equation">{children}</div>
      {cite && <div className="cite">{cite}</div>}
    </div>
  );
}
