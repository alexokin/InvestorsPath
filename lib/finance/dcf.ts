/**
 * Two-stage discounted cash flow (DCF) valuation.
 *
 * Stage 1: free cash flow (FCF) grows at a constant rate for N explicit
 * projection years, each discounted back to present value.
 * Stage 2: a terminal value (Gordon growth model) captures all cash flows
 * beyond year N, also discounted back to present value.
 *
 * All rate inputs are decimals (e.g. `0.10` for 10%), matching how the
 * calculator components normalize their percentage inputs before calling
 * these functions.
 */

export interface DcfInputs {
  /** Most recent free cash flow (year 0), the base for projections. */
  fcf0: number;
  /** Constant annual growth rate applied during the projection window. */
  growthRate: number;
  /** Number of explicit projection years (N). */
  years: number;
  /** Discount rate (WACC / required return) used to compute present values. */
  discountRate: number;
  /** Perpetual growth rate assumed after the projection window. */
  terminalGrowthRate: number;
  /** Total debt minus cash & equivalents. */
  netDebt: number;
  /** Diluted shares outstanding. */
  sharesOutstanding: number;
}

export interface DcfYearProjection {
  year: number;
  fcf: number;
  discountFactor: number;
  presentValue: number;
}

export interface DcfResult {
  projections: DcfYearProjection[];
  /** Sum of the present values of the explicit projection years. */
  sumOfPvFcf: number;
  /** Undiscounted terminal value as of the end of the projection window. */
  terminalValue: number;
  /** Terminal value discounted back to present. */
  pvTerminalValue: number;
  /** Enterprise value = sumOfPvFcf + pvTerminalValue. */
  enterpriseValue: number;
  /** Equity value = enterprise value - net debt. */
  equityValue: number;
  /** Equity value per share. */
  perShareValue: number;
}

/**
 * Runs a two-stage DCF valuation given the inputs above.
 *
 * @throws Error if discountRate <= terminalGrowthRate (terminal value would
 * be undefined or negative) or if sharesOutstanding <= 0.
 */
export function calculateDcf(inputs: DcfInputs): DcfResult {
  const {
    fcf0,
    growthRate,
    years,
    discountRate,
    terminalGrowthRate,
    netDebt,
    sharesOutstanding,
  } = inputs;

  if (discountRate <= terminalGrowthRate) {
    throw new Error("discountRate must be greater than terminalGrowthRate");
  }
  if (sharesOutstanding <= 0) {
    throw new Error("sharesOutstanding must be positive");
  }

  const projections: DcfYearProjection[] = [];
  let sumOfPvFcf = 0;
  let lastFcf = fcf0;

  for (let year = 1; year <= years; year++) {
    const fcf = lastFcf * (1 + growthRate);
    const discountFactor = 1 / Math.pow(1 + discountRate, year);
    const presentValue = fcf * discountFactor;

    projections.push({ year, fcf, discountFactor, presentValue });
    sumOfPvFcf += presentValue;
    lastFcf = fcf;
  }

  const finalYearFcf = lastFcf;
  const terminalValue =
    (finalYearFcf * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
  const pvTerminalValue = terminalValue / Math.pow(1 + discountRate, years);

  const enterpriseValue = sumOfPvFcf + pvTerminalValue;
  const equityValue = enterpriseValue - netDebt;
  const perShareValue = equityValue / sharesOutstanding;

  return {
    projections,
    sumOfPvFcf,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    equityValue,
    perShareValue,
  };
}

export interface DcfSensitivityCell {
  discountRate: number;
  terminalGrowthRate: number;
  perShareValue: number;
}

/**
 * Builds a sensitivity grid of per-share value over a range of discount
 * rates and terminal growth rates, holding all other inputs constant.
 * Cells where discountRate <= terminalGrowthRate are skipped (returned as
 * `null` in that grid position) since the model is undefined there.
 */
export function dcfSensitivityGrid(
  inputs: DcfInputs,
  discountRates: number[],
  terminalGrowthRates: number[]
): (DcfSensitivityCell | null)[][] {
  return discountRates.map((discountRate) =>
    terminalGrowthRates.map((terminalGrowthRate) => {
      if (discountRate <= terminalGrowthRate) return null;
      const result = calculateDcf({ ...inputs, discountRate, terminalGrowthRate });
      return { discountRate, terminalGrowthRate, perShareValue: result.perShareValue };
    })
  );
}
