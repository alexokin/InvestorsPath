import { describe, expect, it } from "vitest";
import { calculateCompoundInterest } from "@/lib/finance/compound";

describe("calculateCompoundInterest", () => {
  it("matches annual compounding with no contributions: 10,000 at 8% for 10 years", () => {
    const result = calculateCompoundInterest({
      principal: 10000,
      monthlyContribution: 0,
      annualRatePercent: 8,
      years: 10,
    });
    // 10000 * 1.08^10 = 21589.25
    expect(result.finalBalance).toBeCloseTo(21589.25, 1);
    expect(result.totalContributions).toBeCloseTo(10000, 6);
    expect(result.totalInterest).toBeCloseTo(21589.25 - 10000, 1);
    expect(result.rows).toHaveLength(10);
  });

  it("produces 20 yearly rows for a 20-year projection", () => {
    const result = calculateCompoundInterest({
      principal: 1000,
      monthlyContribution: 0,
      annualRatePercent: 5,
      years: 20,
    });
    expect(result.rows).toHaveLength(20);
    expect(result.rows[0].year).toBe(1);
    expect(result.rows[19].year).toBe(20);
    // Each row's end balance should feed the next row's start balance.
    expect(result.rows[1].startBalance).toBeCloseTo(result.rows[0].endBalance, 6);
  });

  it("accounts for monthly contributions: 1,000 principal + 100/mo at 6% for 5 years", () => {
    const result = calculateCompoundInterest({
      principal: 1000,
      monthlyContribution: 100,
      annualRatePercent: 6,
      years: 5,
    });
    expect(result.finalBalance).toBeCloseTo(8286.8, 0);
    expect(result.totalContributions).toBeCloseTo(1000 + 100 * 12 * 5, 6);
  });

  it("returns zero growth when the rate is 0%", () => {
    const result = calculateCompoundInterest({
      principal: 5000,
      monthlyContribution: 50,
      annualRatePercent: 0,
      years: 3,
    });
    expect(result.finalBalance).toBeCloseTo(5000 + 50 * 12 * 3, 6);
    expect(result.totalInterest).toBeCloseTo(0, 6);
  });
});
