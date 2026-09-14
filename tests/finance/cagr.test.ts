import { describe, expect, it } from "vitest";
import { cagr, yearsToDouble, rateToDouble } from "@/lib/finance/cagr";

describe("cagr", () => {
  it("computes a simple doubling over one year as 100% growth", () => {
    expect(cagr({ startValue: 100, endValue: 200, years: 1 })).toBeCloseTo(1, 6);
  });

  it("computes a known multi-year growth rate", () => {
    // 100 -> 200 over 10 years => 2^(1/10) - 1
    const result = cagr({ startValue: 100, endValue: 200, years: 10 });
    expect(result).toBeCloseTo(Math.pow(2, 0.1) - 1, 8);
  });

  it("returns a negative rate when the end value is lower than the start value", () => {
    const result = cagr({ startValue: 100, endValue: 50, years: 5 });
    expect(result).toBeLessThan(0);
  });

  it("returns zero growth when start equals end", () => {
    expect(cagr({ startValue: 100, endValue: 100, years: 5 })).toBeCloseTo(0, 8);
  });

  it("throws when startValue is not positive", () => {
    expect(() => cagr({ startValue: 0, endValue: 100, years: 5 })).toThrow();
  });

  it("throws when years is not positive", () => {
    expect(() => cagr({ startValue: 100, endValue: 200, years: 0 })).toThrow();
  });
});

describe("yearsToDouble", () => {
  it("matches the classic Rule-of-72 approximation at 8%", () => {
    const { approxYears } = yearsToDouble(0.08);
    expect(approxYears).toBeCloseTo(9, 6);
  });

  it("computes the exact doubling time via logarithms", () => {
    const { exactYears } = yearsToDouble(0.08);
    expect(exactYears).toBeCloseTo(Math.log(2) / Math.log(1.08), 8);
  });

  it("returns Infinity for a zero rate (never doubles)", () => {
    const { approxYears, exactYears } = yearsToDouble(0);
    expect(approxYears).toBe(Infinity);
    expect(exactYears).toBe(Infinity);
  });

  it("returns Infinity for a negative rate (value shrinks, never doubles)", () => {
    const { approxYears, exactYears } = yearsToDouble(-0.05);
    expect(approxYears).toBe(Infinity);
    expect(exactYears).toBe(Infinity);
  });

  it("throws for a rate at or below -100%", () => {
    expect(() => yearsToDouble(-1)).toThrow();
  });
});

describe("rateToDouble", () => {
  it("matches the classic Rule-of-72 approximation for 9 years", () => {
    const { approxRate } = rateToDouble(9);
    expect(approxRate).toBeCloseTo(0.08, 6);
  });

  it("computes the exact required rate", () => {
    const { exactRate } = rateToDouble(10);
    expect(exactRate).toBeCloseTo(Math.pow(2, 0.1) - 1, 8);
  });

  it("throws for non-positive years", () => {
    expect(() => rateToDouble(0)).toThrow();
  });
});
