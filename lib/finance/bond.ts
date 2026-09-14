/**
 * Bond pricing: price, yield to maturity (YTM), and duration.
 *
 * A bond pays a fixed coupon each period plus its face value at maturity.
 * `bondPrice` discounts every cash flow at a periodic yield derived from the
 * nominal annual yield to maturity (compounded `frequency` times per year).
 * `bondYtm` inverts that relationship via bisection (the price/yield
 * relationship has no closed-form inverse). `bondDurations` computes
 * Macaulay and modified duration, the standard measures of interest-rate
 * sensitivity.
 *
 * All rate inputs are decimals (e.g. `0.05` for 5%), matching the rest of
 * `lib/finance/*`.
 */

export interface BondInputs {
  /** Redemption / par value paid at maturity. */
  faceValue: number;
  /** Annual coupon rate as a fraction of face value (e.g. 0.05 for 5%). */
  couponRate: number;
  /** Years remaining to maturity. */
  yearsToMaturity: number;
  /** Coupon payments per year: 1 (annual) or 2 (semi-annual). */
  frequency: 1 | 2;
  /** Nominal annual yield to maturity (decimal), compounded `frequency` times/year. */
  yieldToMaturity: number;
}

export interface BondCashFlow {
  period: number;
  year: number;
  cashFlow: number;
  discountFactor: number;
  presentValue: number;
}

/**
 * Prices a bond given its nominal annual yield to maturity.
 *
 * @throws Error if faceValue <= 0, yearsToMaturity <= 0, or 1 + yieldToMaturity/frequency <= 0.
 */
export function bondPrice(inputs: BondInputs): number {
  const { cashFlows } = bondCashFlows(inputs);
  return cashFlows.reduce((sum, cf) => sum + cf.presentValue, 0);
}

function bondCashFlows(inputs: BondInputs): { cashFlows: BondCashFlow[]; periodsPerYear: number } {
  const { faceValue, couponRate, yearsToMaturity, frequency, yieldToMaturity } = inputs;

  if (faceValue <= 0) throw new Error("faceValue must be positive");
  if (yearsToMaturity <= 0) throw new Error("yearsToMaturity must be positive");

  const periodsPerYear = frequency;
  const periodicYield = yieldToMaturity / periodsPerYear;
  if (1 + periodicYield <= 0) {
    throw new Error("yieldToMaturity implies a non-positive discount base");
  }

  const totalPeriods = Math.round(yearsToMaturity * periodsPerYear);
  const couponPerPeriod = (faceValue * couponRate) / periodsPerYear;

  const cashFlows: BondCashFlow[] = [];
  for (let period = 1; period <= totalPeriods; period++) {
    const isLast = period === totalPeriods;
    const cashFlow = couponPerPeriod + (isLast ? faceValue : 0);
    const discountFactor = 1 / Math.pow(1 + periodicYield, period);
    cashFlows.push({
      period,
      year: period / periodsPerYear,
      cashFlow,
      discountFactor,
      presentValue: cashFlow * discountFactor,
    });
  }

  return { cashFlows, periodsPerYear };
}

export interface BondYtmInputs {
  faceValue: number;
  couponRate: number;
  yearsToMaturity: number;
  frequency: 1 | 2;
  /** Current market price of the bond. */
  price: number;
}

export interface BondYtmResult {
  yieldToMaturity: number | null;
  converged: boolean;
}

const YTM_MIN = -0.99;
const YTM_MAX = 10; // 1000% nominal annual yield — far beyond any realistic bond
const YTM_TOLERANCE = 1e-9;
const YTM_MAX_ITERATIONS = 200;

/**
 * Solves for the nominal annual yield to maturity implied by a market price,
 * via bisection (bond price is strictly decreasing in yield). Returns
 * `{ yieldToMaturity: null, converged: false }` if the price is out of the
 * range reachable within [-99%, 1000%], or if the price is non-positive.
 */
export function bondYtm(inputs: BondYtmInputs): BondYtmResult {
  const { faceValue, couponRate, yearsToMaturity, frequency, price } = inputs;

  if (price <= 0 || faceValue <= 0 || yearsToMaturity <= 0) {
    return { yieldToMaturity: null, converged: false };
  }

  const priceAt = (y: number) =>
    bondPrice({ faceValue, couponRate, yearsToMaturity, frequency, yieldToMaturity: y });

  let lo = YTM_MIN;
  let hi = YTM_MAX;
  const priceAtLo = priceAt(lo);
  const priceAtHi = priceAt(hi);

  // Price is monotonically decreasing in yield, so priceAtLo >= price >= priceAtHi.
  if (price > priceAtLo || price < priceAtHi) {
    return { yieldToMaturity: null, converged: false };
  }

  for (let i = 0; i < YTM_MAX_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const midPrice = priceAt(mid);
    if (Math.abs(midPrice - price) < YTM_TOLERANCE * Math.max(1, price)) {
      return { yieldToMaturity: mid, converged: true };
    }
    if (midPrice > price) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return { yieldToMaturity: (lo + hi) / 2, converged: true };
}

export interface BondDurationsResult {
  /** Weighted-average time (in years) to receive the bond's cash flows. */
  macaulayDuration: number;
  /** Macaulay duration adjusted for the periodic yield — approximates % price change per 1pt change in yield. */
  modifiedDuration: number;
}

/**
 * Computes Macaulay and modified duration at the given yield to maturity.
 *
 * @throws Error under the same conditions as `bondPrice`.
 */
export function bondDurations(inputs: BondInputs): BondDurationsResult {
  const { cashFlows, periodsPerYear } = bondCashFlows(inputs);
  const price = cashFlows.reduce((sum, cf) => sum + cf.presentValue, 0);

  const weightedTime = cashFlows.reduce((sum, cf) => sum + cf.year * cf.presentValue, 0);
  const macaulayDuration = weightedTime / price;
  const periodicYield = inputs.yieldToMaturity / periodsPerYear;
  const modifiedDuration = macaulayDuration / (1 + periodicYield);

  return { macaulayDuration, modifiedDuration };
}

export interface BondRateSensitivityRow {
  yieldDelta: number;
  yieldToMaturity: number;
  price: number;
}

/**
 * Builds a small table of bond price at the given yield to maturity shifted
 * by each delta in `deltas` (e.g. [-0.02, -0.01, 0, 0.01, 0.02]), to
 * illustrate rate sensitivity. Rows where 1 + shiftedYield/frequency <= 0
 * are skipped.
 */
export function bondRateSensitivity(inputs: BondInputs, deltas: number[]): BondRateSensitivityRow[] {
  const rows: BondRateSensitivityRow[] = [];
  for (const delta of deltas) {
    const yieldToMaturity = inputs.yieldToMaturity + delta;
    if (1 + yieldToMaturity / inputs.frequency <= 0) continue;
    const price = bondPrice({ ...inputs, yieldToMaturity });
    rows.push({ yieldDelta: delta, yieldToMaturity, price });
  }
  return rows;
}
