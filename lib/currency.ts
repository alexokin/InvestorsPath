/**
 * Currency support for the /tools calculators. Every calculator can display
 * its money inputs/outputs in either ILS (₪) or USD ($) — this is a display
 * choice only, there is no FX conversion of entered values.
 */

export type Currency = "ILS" | "USD";

export interface CurrencyMeta {
  code: Currency;
  symbol: string;
  nameHe: string;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyMeta> = {
  ILS: { code: "ILS", symbol: "₪", nameHe: "שקל", locale: "he-IL" },
  USD: { code: "USD", symbol: "$", nameHe: "דולר", locale: "he-IL" },
};

export function currencySymbol(currency: Currency): string {
  return CURRENCIES[currency].symbol;
}

/**
 * Format a monetary value for the given currency using Hebrew number
 * formatting conventions (grouping/decimal separators), with the correct
 * currency symbol (₪/$) via Intl's currency formatter. The result contains
 * bidi-sensitive characters, so callers should render it inside a
 * `dir="ltr"` element.
 */
export function formatMoney(
  value: number,
  currency: Currency = "ILS",
  opts: { maximumFractionDigits?: number; minimumFractionDigits?: number; compact?: boolean } = {}
): string {
  const { maximumFractionDigits = 0, minimumFractionDigits, compact = false } = opts;
  return new Intl.NumberFormat(CURRENCIES[currency].locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits: minimumFractionDigits ?? 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

const STORAGE_KEY = "vip:currency:v1";

export function readStoredCurrency(): Currency | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "ILS" || raw === "USD" ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredCurrency(currency: Currency): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently.
  }
}
