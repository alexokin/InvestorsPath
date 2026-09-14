/**
 * Dividend Discount Model (Gordon growth / constant-growth variant).
 *
 * Fair value = D1 / (r - g), where D1 is next year's expected dividend per
 * share, r is the required return, and g is the constant perpetual growth
 * rate. Undefined (and shown as a warning rather than a number) whenever
 * g >= r, since the geometric series that underlies the model would not
 * converge.
 *
 * All rate inputs are decimals (e.g. `0.09` for 9%).
 */

export interface DdmInputs {
  /** Next year's expected dividend per share (D1). */
  nextDividend: number;
  /** Required return / discount rate. */
  requiredReturn: number;
  /** Constant perpetual dividend growth rate (g). */
  growthRate: number;
}

export interface DdmResult {
  /** Fair value per share, or null when growthRate >= requiredReturn (model undefined). */
  fairValue: number | null;
  /** Dividend yield at fair value (nextDividend / fairValue), equals requiredReturn - growthRate when defined. */
  dividendYieldAtFairValue: number | null;
  /** True when growthRate >= requiredReturn, i.e. the model breaks down. */
  warning: boolean;
}

/**
 * Computes the Gordon growth model fair value.
 *
 * @throws Error if requiredReturn <= -1 (nonsensical discount rate).
 */
export function ddmFairValue(inputs: DdmInputs): DdmResult {
  const { nextDividend, requiredReturn, growthRate } = inputs;
  if (requiredReturn <= -1) throw new Error("requiredReturn must be greater than -100%");

  const warning = growthRate >= requiredReturn;
  if (warning) {
    return { fairValue: null, dividendYieldAtFairValue: null, warning: true };
  }

  const fairValue = nextDividend / (requiredReturn - growthRate);
  const dividendYieldAtFairValue = fairValue > 0 ? nextDividend / fairValue : null;

  return { fairValue, dividendYieldAtFairValue, warning: false };
}

/**
 * Derives next year's dividend (D1) from the current dividend (D0) and a
 * growth rate: D1 = D0 * (1 + g).
 */
export function nextDividendFromCurrent(currentDividend: number, growthRate: number): number {
  return currentDividend * (1 + growthRate);
}

export interface DdmSensitivityCell {
  growthRate: number;
  requiredReturn: number;
  fairValue: number | null;
}

/**
 * Builds a sensitivity grid of fair value over a range of growth rates
 * (rows) and required returns (columns), holding `nextDividend` constant.
 * Cells where growthRate >= requiredReturn hold `fairValue: null`.
 */
export function ddmSensitivityGrid(
  nextDividend: number,
  growthRates: number[],
  requiredReturns: number[]
): DdmSensitivityCell[][] {
  return growthRates.map((growthRate) =>
    requiredReturns.map((requiredReturn) => {
      const result = ddmFairValue({ nextDividend, requiredReturn, growthRate });
      return { growthRate, requiredReturn, fairValue: result.fairValue };
    })
  );
}
