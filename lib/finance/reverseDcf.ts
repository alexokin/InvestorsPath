/**
 * Reverse DCF: given the current market price, solves for the constant FCF
 * growth rate (over the explicit projection window) that the market is
 * implicitly pricing in — i.e. the growth rate that makes the standard
 * two-stage DCF (see `lib/finance/dcf.ts`) produce an equity value equal to
 * the current market cap.
 *
 * This deliberately reuses `calculateDcf` rather than duplicating the
 * projection math, and searches for the growth rate via bisection over a
 * wide but bounded range, since the relationship has no closed-form
 * inverse in general.
 *
 * All rate inputs are decimals (e.g. `0.10` for 10%).
 */

import { calculateDcf, type DcfInputs } from "./dcf";

export interface ReverseDcfInputs {
  /** Current share price. */
  price: number;
  /** Diluted shares outstanding. */
  sharesOutstanding: number;
  /** Total debt minus cash & equivalents. */
  netDebt: number;
  /** Most recent free cash flow (year 0). */
  fcf0: number;
  /** Discount rate (WACC / required return). */
  discountRate: number;
  /** Perpetual growth rate assumed after the projection window. */
  terminalGrowthRate: number;
  /** Number of explicit projection years. */
  years: number;
}

export interface ReverseDcfResult {
  /** Market capitalization implied by price * sharesOutstanding. */
  marketCap: number;
  /** The constant projection-year growth rate that reconciles DCF equity value with market cap, or null if unsolvable. */
  impliedGrowthRate: number | null;
  /** Whether the bisection search converged within the search bounds. */
  converged: boolean;
}

const GROWTH_MIN = -0.5;
const GROWTH_MAX = 1.0;
const TOLERANCE = 1e-7;
const MAX_ITERATIONS = 200;

function equityValueAtGrowth(inputs: ReverseDcfInputs, growthRate: number): number {
  const dcfInputs: DcfInputs = {
    fcf0: inputs.fcf0,
    growthRate,
    years: inputs.years,
    discountRate: inputs.discountRate,
    terminalGrowthRate: inputs.terminalGrowthRate,
    netDebt: inputs.netDebt,
    sharesOutstanding: Math.max(inputs.sharesOutstanding, 1e-9),
  };
  return calculateDcf(dcfInputs).equityValue;
}

/**
 * Solves for the implied constant growth rate over `[-50%, +100%]`. Returns
 * `{ impliedGrowthRate: null, converged: false }` when the discount rate
 * does not exceed the terminal growth rate (the DCF is undefined there), or
 * when the target market cap falls outside what's reachable within the
 * search bounds (e.g. an extremely high or low price relative to FCF).
 */
export function impliedGrowthRate(inputs: ReverseDcfInputs): ReverseDcfResult {
  const marketCap = inputs.price * inputs.sharesOutstanding;

  if (inputs.discountRate <= inputs.terminalGrowthRate) {
    return { marketCap, impliedGrowthRate: null, converged: false };
  }

  const valueAtMin = equityValueAtGrowth(inputs, GROWTH_MIN);
  const valueAtMax = equityValueAtGrowth(inputs, GROWTH_MAX);
  const increasing = valueAtMax >= valueAtMin;
  const lowBound = Math.min(valueAtMin, valueAtMax);
  const highBound = Math.max(valueAtMin, valueAtMax);

  if (marketCap < lowBound || marketCap > highBound) {
    return { marketCap, impliedGrowthRate: null, converged: false };
  }

  let lo = GROWTH_MIN;
  let hi = GROWTH_MAX;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const value = equityValueAtGrowth(inputs, mid);
    if (Math.abs(value - marketCap) < TOLERANCE * Math.max(1, Math.abs(marketCap))) {
      return { marketCap, impliedGrowthRate: mid, converged: true };
    }
    const valueIsBelowTarget = value < marketCap;
    if (valueIsBelowTarget === increasing) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return { marketCap, impliedGrowthRate: (lo + hi) / 2, converged: true };
}

export interface ReverseDcfSensitivityRow {
  discountRateDelta: number;
  discountRate: number;
  impliedGrowthRate: number | null;
}

/**
 * Builds a small table of implied growth rate at the given discount rate
 * shifted by each delta in `deltas` (e.g. [-0.01, 0, 0.01]).
 */
export function reverseDcfSensitivity(
  inputs: ReverseDcfInputs,
  deltas: number[]
): ReverseDcfSensitivityRow[] {
  return deltas.map((delta) => {
    const discountRate = inputs.discountRate + delta;
    const result = impliedGrowthRate({ ...inputs, discountRate });
    return { discountRateDelta: delta, discountRate, impliedGrowthRate: result.impliedGrowthRate };
  });
}
