/**
 * Margin of safety: the cushion between a stock's intrinsic value and its
 * market price.
 */

export interface MarginOfSafetyInputs {
  /** Estimated intrinsic (fair) value per share. */
  intrinsicValue: number;
  /** Current market price per share. */
  price: number;
}

/**
 * Margin of safety, as a decimal fraction: (intrinsicValue - price) / intrinsicValue.
 * Positive means the stock trades below its estimated intrinsic value.
 * Returns 0 when intrinsicValue <= 0 (undefined).
 */
export function marginOfSafety({ intrinsicValue, price }: MarginOfSafetyInputs): number {
  if (intrinsicValue <= 0) return 0;
  return (intrinsicValue - price) / intrinsicValue;
}

/**
 * The maximum price to pay today in order to achieve at least
 * `targetMarginOfSafety` (a decimal fraction, e.g. 0.3 for 30%) against a
 * given intrinsic value.
 */
export function buyBelowPrice(intrinsicValue: number, targetMarginOfSafety: number): number {
  return intrinsicValue * (1 - targetMarginOfSafety);
}
