import { formatMoney } from "@/lib/currency";

const locale = "he-IL";

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * @deprecated Prefer `formatMoney` from `@/lib/currency`, which this now
 * wraps. Kept for backward compatibility with existing call sites.
 */
export function formatCurrency(value: number, currency: "ILS" | "USD" = "ILS"): string {
  return formatMoney(value, currency);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
