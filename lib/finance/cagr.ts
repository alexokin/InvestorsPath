/**
 * CAGR (compound annual growth rate) and the "Rule of 72" for estimating
 * doubling time.
 *
 * All rate inputs/outputs are decimals (e.g. `0.08` for 8%), matching the
 * rest of `lib/finance/*`.
 */

export interface CagrInputs {
  /** Value at the start of the period. */
  startValue: number;
  /** Value at the end of the period. */
  endValue: number;
  /** Number of years between start and end. */
  years: number;
}

/**
 * Computes the compound annual growth rate: (endValue / startValue)^(1/years) - 1.
 *
 * @throws Error if startValue <= 0 or years <= 0. A non-positive start value
 * makes the ratio undefined/undefined-signed for non-integer exponents.
 */
export function cagr(inputs: CagrInputs): number {
  const { startValue, endValue, years } = inputs;
  if (startValue <= 0) throw new Error("startValue must be positive");
  if (years <= 0) throw new Error("years must be positive");
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export interface DoublingTime {
  /** Rule-of-72 approximation: 0.72 / rate. */
  approxYears: number;
  /** Exact doubling time: ln(2) / ln(1 + rate). */
  exactYears: number;
}

/**
 * Estimates years to double an investment at a constant annual rate, both
 * via the Rule of 72 approximation and the exact compound-interest formula.
 *
 * @throws Error if rate <= -1 (value can never grow).
 * Returns `Infinity` for both fields when rate <= 0 (a zero or negative
 * rate never doubles the investment).
 */
export function yearsToDouble(rate: number): DoublingTime {
  if (rate <= -1) throw new Error("rate must be greater than -100%");
  if (rate <= 0) return { approxYears: Infinity, exactYears: Infinity };
  return {
    approxYears: 0.72 / rate,
    exactYears: Math.log(2) / Math.log(1 + rate),
  };
}

export interface RequiredRate {
  /** Rule-of-72 approximation: 0.72 / years. */
  approxRate: number;
  /** Exact required rate: 2^(1/years) - 1. */
  exactRate: number;
}

/**
 * Solves for the constant annual rate required to double an investment in
 * the given number of years, both via the Rule of 72 approximation and the
 * exact compound-interest formula.
 *
 * @throws Error if years <= 0.
 */
export function rateToDouble(years: number): RequiredRate {
  if (years <= 0) throw new Error("years must be positive");
  return {
    approxRate: 0.72 / years,
    exactRate: Math.pow(2, 1 / years) - 1,
  };
}
