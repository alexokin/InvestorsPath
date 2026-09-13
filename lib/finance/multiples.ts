/**
 * Valuation multiples for a single company, and side-by-side comparison
 * across up to four companies.
 */

export interface MultiplesInputs {
  /** Optional label used by the comparison table (e.g. a ticker or name). */
  name?: string;
  /** Current share price. */
  price: number;
  /** Diluted shares outstanding. */
  sharesOutstanding: number;
  /** Total debt minus cash & equivalents. */
  netDebt: number;
  /** Trailing net income (earnings). */
  earnings: number;
  /** Trailing EBITDA. */
  ebitda: number;
  /** Trailing revenue. */
  revenue: number;
  /** Trailing free cash flow. */
  fcf: number;
  /** Total book value (shareholders' equity). */
  bookValue: number;
}

export interface MultiplesResult {
  name?: string;
  marketCap: number;
  enterpriseValue: number;
  /** Price / Earnings. Null when earnings <= 0 (undefined multiple). */
  pe: number | null;
  /** Price / Book. Null when bookValue <= 0. */
  pb: number | null;
  /** Price / Sales. Null when revenue <= 0. */
  ps: number | null;
  /** Enterprise Value / EBITDA. Null when ebitda <= 0. */
  evEbitda: number | null;
  /** Price / Free Cash Flow. Null when fcf <= 0. */
  pFcf: number | null;
  /** Earnings Yield = Earnings Per Share / Price (inverse of P/E). */
  earningsYield: number | null;
}

function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

/** Computes the standard valuation multiples for one company. */
export function calculateMultiples(inputs: MultiplesInputs): MultiplesResult {
  const { name, price, sharesOutstanding, netDebt, earnings, ebitda, revenue, fcf, bookValue } =
    inputs;

  const marketCap = price * sharesOutstanding;
  const enterpriseValue = marketCap + netDebt;
  const eps = sharesOutstanding > 0 ? earnings / sharesOutstanding : 0;

  return {
    name,
    marketCap,
    enterpriseValue,
    pe: safeDivide(marketCap, earnings),
    pb: safeDivide(marketCap, bookValue),
    ps: safeDivide(marketCap, revenue),
    evEbitda: safeDivide(enterpriseValue, ebitda),
    pFcf: safeDivide(marketCap, fcf),
    earningsYield: price > 0 ? eps / price : null,
  };
}

/** Computes multiples for 1-4 companies, for side-by-side comparison. */
export function compareMultiples(companies: MultiplesInputs[]): MultiplesResult[] {
  return companies.slice(0, 4).map(calculateMultiples);
}
