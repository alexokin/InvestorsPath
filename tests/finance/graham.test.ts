import { describe, expect, it } from "vitest";
import { grahamNumber, grahamGrowthValue, GRAHAM_BASE_YIELD_PERCENT } from "@/lib/finance/graham";

describe("grahamNumber", () => {
  it("computes sqrt(22.5 * EPS * BVPS) — EPS 5, BVPS 20 = 47.43", () => {
    expect(grahamNumber({ eps: 5, bookValuePerShare: 20 })).toBeCloseTo(47.43, 2);
  });

  it("returns 0 for non-positive EPS or book value", () => {
    expect(grahamNumber({ eps: -1, bookValuePerShare: 20 })).toBe(0);
    expect(grahamNumber({ eps: 5, bookValuePerShare: 0 })).toBe(0);
  });
});

describe("grahamGrowthValue", () => {
  it("computes V = EPS * (8.5 + 2g) * 4.4 / Y", () => {
    // EPS 2, growth 7%, yield 4.4% (Graham's original baseline yield)
    // V = 2 * (8.5 + 14) * 4.4 / 4.4 = 2 * 22.5 = 45
    expect(grahamGrowthValue({ eps: 2, growthRatePercent: 7, aaaBondYieldPercent: GRAHAM_BASE_YIELD_PERCENT })).toBeCloseTo(45, 6);
  });

  it("computes a second hand-checked case: EPS 3, growth 10%, yield 4.4", () => {
    // V = 3 * (8.5 + 20) * 4.4 / 4.4 = 3 * 28.5 = 85.5
    expect(grahamGrowthValue({ eps: 3, growthRatePercent: 10, aaaBondYieldPercent: 4.4 })).toBeCloseTo(85.5, 6);
  });

  it("scales inversely with the bond yield", () => {
    const base = grahamGrowthValue({ eps: 3, growthRatePercent: 10, aaaBondYieldPercent: 4.4 });
    const higherYield = grahamGrowthValue({ eps: 3, growthRatePercent: 10, aaaBondYieldPercent: 8.8 });
    expect(higherYield).toBeCloseTo(base / 2, 6);
  });

  it("returns 0 when the bond yield is not positive", () => {
    expect(grahamGrowthValue({ eps: 3, growthRatePercent: 10, aaaBondYieldPercent: 0 })).toBe(0);
  });
});
