import type { ReactNode } from "react";
import { CurrencyToggle } from "@/components/calculators/CurrencyToggle";

/**
 * Shared two-column layout used by every calculator: inputs on one side,
 * live results on the other. Collapses to a single column on narrow
 * screens. Shows a ₪/$ currency toggle in the header for calculators that
 * deal with money (pass `showCurrencyToggle={false}` to opt out).
 */
export function CalculatorShell({
  inputs,
  results,
  footer,
  showCurrencyToggle = true,
}: {
  inputs: ReactNode;
  results: ReactNode;
  footer?: ReactNode;
  showCurrencyToggle?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      {showCurrencyToggle && (
        <div className="border-b border-border p-5 sm:p-6">
          <CurrencyToggle />
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-4">{inputs}</div>
        <div className="space-y-4">{results}</div>
      </div>
      {footer && <div className="border-t border-border p-5 sm:p-6">{footer}</div>}
    </div>
  );
}
