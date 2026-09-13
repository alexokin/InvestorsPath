/**
 * Benjamin Graham's classic valuation shortcuts.
 */

export interface GrahamNumberInputs {
  /** Trailing (or normalized) earnings per share. */
  eps: number;
  /** Book value per share (shareholders' equity / shares outstanding). */
  bookValuePerShare: number;
}

/**
 * Graham number: sqrt(22.5 * EPS * Book Value Per Share).
 * The constant 22.5 caps the implied P/E at 15 and P/B at 1.5
 * (15 * 1.5 = 22.5), a conservative ceiling for a "fairly priced" stock.
 *
 * Returns 0 (rather than NaN) when the product is negative, since the
 * formula is undefined for a negative EPS or book value.
 */
export function grahamNumber({ eps, bookValuePerShare }: GrahamNumberInputs): number {
  const product = 22.5 * eps * bookValuePerShare;
  if (product <= 0) return 0;
  return Math.sqrt(product);
}

export interface GrahamGrowthInputs {
  /** Trailing (or normalized) earnings per share. */
  eps: number;
  /** Expected long-term annual earnings growth rate, as a percentage (e.g. 12 for 12%). */
  growthRatePercent: number;
  /** Current yield on AAA corporate bonds, as a percentage (e.g. 4.4 for 4.4%). */
  aaaBondYieldPercent: number;
}

/** The yield used when Graham originally calibrated the formula (4.4%). */
export const GRAHAM_BASE_YIELD_PERCENT = 4.4;

/**
 * Graham's revised growth formula:
 * V = EPS * (8.5 + 2g) * 4.4 / Y
 * where g is the expected growth rate (in percentage points, not a decimal)
 * and Y is the current AAA corporate bond yield (in percentage points),
 * used to adjust the base valuation for the present interest rate
 * environment relative to the ~4.4% yield Graham used originally.
 */
export function grahamGrowthValue({
  eps,
  growthRatePercent,
  aaaBondYieldPercent,
}: GrahamGrowthInputs): number {
  if (aaaBondYieldPercent <= 0) return 0;
  return (eps * (8.5 + 2 * growthRatePercent) * GRAHAM_BASE_YIELD_PERCENT) / aaaBondYieldPercent;
}
