"use client";

import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CURRENCIES, type Currency } from "@/lib/currency";

const OPTIONS: Currency[] = ["ILS", "USD"];

/**
 * Compact segmented control for switching the display currency of a
 * calculator (₪ / $). Purely a display choice — no FX conversion is
 * applied to entered values.
 */
export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div>
      <div
        role="group"
        aria-label="בחירת מטבע תצוגה"
        className="inline-flex rounded-lg border border-border bg-slate-50 p-0.5"
      >
        {OPTIONS.map((option) => {
          const meta = CURRENCIES[option];
          const active = currency === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => setCurrency(option)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <span dir="ltr">{meta.symbol}</span> {meta.nameHe}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-muted">
        המעבר משנה את סימון המטבע בלבד, ללא המרה של הערכים.
      </p>
    </div>
  );
}
