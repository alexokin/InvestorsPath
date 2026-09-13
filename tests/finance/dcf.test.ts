import { describe, expect, it } from "vitest";
import { calculateDcf, dcfSensitivityGrid } from "@/lib/finance/dcf";

describe("calculateDcf", () => {
  // Hand-computed example: FCF0=100, growth=10% for 5 years, discount=10%,
  // terminal growth=3%, no net debt, 100 shares.
  // Because growth == discount rate for the explicit years, each year's
  // present value collapses to exactly FCF0 (=100), so sumOfPvFcf = 500.
  const inputs = {
    fcf0: 100,
    growthRate: 0.1,
    years: 5,
    discountRate: 0.1,
    terminalGrowthRate: 0.03,
    netDebt: 0,
    sharesOutstanding: 100,
  };

  it("computes the explicit projection years", () => {
    const result = calculateDcf(inputs);
    expect(result.projections).toHaveLength(5);
    expect(result.projections[0].fcf).toBeCloseTo(110, 6);
    expect(result.projections[4].fcf).toBeCloseTo(161.051, 3);
    expect(result.sumOfPvFcf).toBeCloseTo(500, 6);
  });

  it("computes terminal value, enterprise value, equity value and per-share value", () => {
    const result = calculateDcf(inputs);
    expect(result.terminalValue).toBeCloseTo(2369.7504, 3);
    expect(result.pvTerminalValue).toBeCloseTo(1471.4286, 3);
    expect(result.enterpriseValue).toBeCloseTo(1971.4286, 3);
    expect(result.equityValue).toBeCloseTo(1971.4286, 3);
    expect(result.perShareValue).toBeCloseTo(19.7143, 3);
  });

  it("subtracts net debt to get equity value", () => {
    const result = calculateDcf({ ...inputs, netDebt: 500 });
    expect(result.equityValue).toBeCloseTo(1971.4286 - 500, 3);
    expect(result.perShareValue).toBeCloseTo((1971.4286 - 500) / 100, 3);
  });

  it("throws when discount rate does not exceed terminal growth rate", () => {
    expect(() =>
      calculateDcf({ ...inputs, discountRate: 0.03, terminalGrowthRate: 0.03 })
    ).toThrow();
  });

  it("throws when shares outstanding is not positive", () => {
    expect(() => calculateDcf({ ...inputs, sharesOutstanding: 0 })).toThrow();
  });
});

describe("dcfSensitivityGrid", () => {
  const inputs = {
    fcf0: 100,
    growthRate: 0.1,
    years: 5,
    discountRate: 0.1,
    terminalGrowthRate: 0.03,
    netDebt: 0,
    sharesOutstanding: 100,
  };

  it("builds a grid matching calculateDcf for each combination", () => {
    const discountRates = [0.08, 0.1, 0.12];
    const terminalGrowthRates = [0.02, 0.03];
    const grid = dcfSensitivityGrid(inputs, discountRates, terminalGrowthRates);

    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(2);

    const direct = calculateDcf({ ...inputs, discountRate: 0.12, terminalGrowthRate: 0.02 });
    expect(grid[2][0]?.perShareValue).toBeCloseTo(direct.perShareValue, 6);
  });

  it("skips undefined cells where discountRate <= terminalGrowthRate", () => {
    const grid = dcfSensitivityGrid(inputs, [0.03], [0.03, 0.05]);
    expect(grid[0][0]).toBeNull();
    expect(grid[0][1]).toBeNull();
  });
});
