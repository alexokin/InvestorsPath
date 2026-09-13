"use client";

import type { ChangeEvent } from "react";

/**
 * A single numeric input for a calculator: Hebrew label, LTR digit entry,
 * decimal numeric keyboard on mobile, and an optional unit suffix (e.g.
 * "%" or "₪").
 */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = "any",
  helpText,
  id,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  helpText?: string;
  id?: string;
}) {
  const inputId = id ?? `field-${label}`;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const parsed = Number(raw);
    onChange(raw === "" || Number.isNaN(parsed) ? 0 : parsed);
  }

  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <span className="relative flex items-center">
        <input
          id={inputId}
          type="number"
          dir="ltr"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-start text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        {suffix && (
          <span
            dir="ltr"
            className="pointer-events-none absolute end-3 text-xs font-medium text-muted"
          >
            {suffix}
          </span>
        )}
      </span>
      {helpText && <span className="mt-1 block text-xs text-muted">{helpText}</span>}
    </label>
  );
}
