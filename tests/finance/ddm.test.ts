import { describe, expect, it } from "vitest";
import { ddmFairValue, nextDividendFromCurrent, ddmSensitivityGrid } from "@/lib/finance/ddm";

describe("ddmFairValue", () => {
  it("matches a hand-computed Gordon growth example", () => {
    // D1=2, r=8%, g=3% => 2 / 0.05 = 40
    const result = ddmFairValue({ nextDividend: 2, requiredReturn: 0.08, growthRate: 0.03 });
    expect(result.fairValue).toBeCloseTo(40, 6);
    expect(result.warning).toBe(false);
  });

  it("computes dividend yield at fair value equal to r - g", () => {
    const result = ddmFairValue({ nextDividend: 2, requiredReturn: 0.08, growthRate: 0.03 });
    expect(result.dividendYieldAtFairValue).toBeCloseTo(0.05, 6);
  });

  it("reduces to a simple perpetuity (D1/r) at zero growth", () => {
    const result = ddmFairValue({ nextDividend: 5, requiredReturn: 0.1, growthRate: 0 });
    expect(result.fairValue).toBeCloseTo(50, 6);
  });

  it("warns and returns null fair value when growth equals required return", () => {
    const result = ddmFairValue({ nextDividend: 2, requiredReturn: 0.08, growthRate: 0.08 });
    expect(result.warning).toBe(true);
    expect(result.fairValue).toBeNull();
    expect(result.dividendYieldAtFairValue).toBeNull();
  });

  it("warns and returns null fair value when growth exceeds required return", () => {
    const result = ddmFairValue({ nextDividend: 2, requiredReturn: 0.06, growthRate: 0.1 });
    expect(result.warning).toBe(true);
    expect(result.fairValue).toBeNull();
  });

  it("throws when requiredReturn is at or below -100%", () => {
    expect(() => ddmFairValue({ nextDividend: 2, requiredReturn: -1, growthRate: 0 })).toThrow();
  });

  it("higher required growth spread relative to dividend lowers fair value", () => {
    const tight = ddmFairValue({ nextDividend: 2, requiredReturn: 0.08, growthRate: 0.06 });
    const wide = ddmFairValue({ nextDividend: 2, requiredReturn: 0.08, growthRate: 0.02 });
    expect(tight.fairValue ?? 0).toBeGreaterThan(wide.fairValue ?? 0);
  });
});

describe("nextDividendFromCurrent", () => {
  it("grows the current dividend by one period at the given rate", () => {
    expect(nextDividendFromCurrent(2, 0.05)).toBeCloseTo(2.1, 6);
  });
});

describe("ddmSensitivityGrid", () => {
  it("builds a grid matching ddmFairValue for each combination", () => {
    const growthRates = [0.01, 0.03, 0.05];
    const requiredReturns = [0.06, 0.08, 0.1];
    const grid = ddmSensitivityGrid(2, growthRates, requiredReturns);

    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(3);
    const direct = ddmFairValue({ nextDividend: 2, requiredReturn: 0.1, growthRate: 0.05 });
    expect(grid[2][2].fairValue).toBeCloseTo(direct.fairValue ?? NaN, 6);
  });

  it("marks cells null where growthRate >= requiredReturn", () => {
    const grid = ddmSensitivityGrid(2, [0.1], [0.06, 0.1]);
    expect(grid[0][0].fairValue).toBeNull();
    expect(grid[0][1].fairValue).toBeNull();
  });
});
