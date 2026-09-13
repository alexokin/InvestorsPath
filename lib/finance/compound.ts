/**
 * Compound interest / retirement-savings projection.
 *
 * Pure, dependency-free math used by the compound interest calculator.
 * All rates are given as plain numbers (e.g. `8` for 8%, not `0.08`).
 *
 * The annual rate is converted to an equivalent monthly rate so that, with
 * zero monthly contributions, compounding monthly for 12 months produces
 * exactly the same result as compounding annually once
 * (`principal * (1 + annualRate) ^ years`).
 */

export interface CompoundInterestInputs {
  /** Initial lump sum invested today. */
  principal: number;
  /** Amount added at the end of every month. */
  monthlyContribution: number;
  /** Annual nominal rate of return, as a percentage (e.g. 8 for 8%). */
  annualRatePercent: number;
  /** Number of years to project. */
  years: number;
}

export interface CompoundYearRow {
  /** 1-based year number. */
  year: number;
  /** Balance at the start of the year. */
  startBalance: number;
  /** Contributions made during this year (excludes the initial principal). */
  contributions: number;
  /** Interest earned during this year. */
  interest: number;
  /** Balance at the end of the year. */
  endBalance: number;
}

export interface CompoundInterestResult {
  rows: CompoundYearRow[];
  /** Final balance after the full projection period. */
  finalBalance: number;
  /** Principal + all monthly contributions (no interest). */
  totalContributions: number;
  /** Total interest earned over the whole period. */
  totalInterest: number;
}

/**
 * Projects the growth of a lump sum plus optional monthly contributions
 * under annual compounding (applied via an equivalent monthly rate).
 */
export function calculateCompoundInterest({
  principal,
  monthlyContribution,
  annualRatePercent,
  years,
}: CompoundInterestInputs): CompoundInterestResult {
  const annualRate = annualRatePercent / 100;
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

  const rows: CompoundYearRow[] = [];
  let balance = principal;

  for (let year = 1; year <= years; year++) {
    const startBalance = balance;
    let contributionsThisYear = 0;

    for (let month = 0; month < 12; month++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      contributionsThisYear += monthlyContribution;
    }

    const endBalance = balance;
    const interest = endBalance - startBalance - contributionsThisYear;

    rows.push({
      year,
      startBalance,
      contributions: contributionsThisYear,
      interest,
      endBalance,
    });
  }

  const totalContributions = principal + monthlyContribution * 12 * years;
  const finalBalance = balance;
  const totalInterest = finalBalance - totalContributions;

  return { rows, finalBalance, totalContributions, totalInterest };
}
