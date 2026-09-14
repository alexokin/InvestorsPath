import { describe, expect, it } from "vitest";
import { calculateDcf } from "@/lib/finance/dcf";
import { impliedGrowthRate, reverseDcfSensitivity } from "@/lib/finance/reverseDcf";

describe("impliedGrowthRate", () => {
  const base = {
    price: 20,
    sharesOutstanding: 100,
    netDebt: 0,
    fcf0: 100,
    discountRate: 0.1,
    terminalGrowthRate: 0.03,
    years: 5,
  };

  it("recovers a known growth rate used to construct the price", () => {
    const knownGrowth = 0.08;
    const dcf = calculateDcf({
      fcf0: base.fcf0,
      growthRate: knownGrowth,
      years: base.years,
      discountRate: base.discountRate,
      terminalGrowthRate: base.terminalGrowthRate,
      netDebt: base.netDebt,
      sharesOutstanding: base.sharesOutstanding,
    });
    const price = dcf.equityValue / base.sharesOutstanding;

    const result = impliedGrowthRate({ ...base, price });
    expect(result.converged).toBe(true);
    expect(result.impliedGrowthRate).toBeCloseTo(knownGrowth, 4);
  });

  it("computes market cap as price times shares", () => {
    const result = impliedGrowthRate(base);
    expect(result.marketCap).toBeCloseTo(base.price * base.sharesOutstanding, 6);
  });

  it("returns null when discountRate does not exceed terminalGrowthRate", () => {
    const result = impliedGrowthRate({ ...base, discountRate: 0.03, terminalGrowthRate: 0.03 });
    expect(result.converged).toBe(false);
    expect(result.impliedGrowthRate).toBeNull();
  });

  it("does not converge when the price is unreachably high within the search bounds", () => {
    const result = impliedGrowthRate({ ...base, price: 1_000_000 });
    expect(result.converged).toBe(false);
    expect(result.impliedGrowthRate).toBeNull();
  });

  it("does not converge when the price is unreachably low (below the -50% growth floor)", () => {
    const result = impliedGrowthRate({ ...base, price: -1000 });
    expect(result.converged).toBe(false);
    expect(result.impliedGrowthRate).toBeNull();
  });

  it("accounts for net debt when solving for implied growth", () => {
    const withDebt = impliedGrowthRate({ ...base, netDebt: 500 });
    const withoutDebt = impliedGrowthRate({ ...base, netDebt: 0 });
    // More debt to subtract means more FCF growth is needed to hit the same equity value/price.
    expect(withDebt.impliedGrowthRate ?? 0).toBeGreaterThan(withoutDebt.impliedGrowthRate ?? 0);
  });
});

describe("reverseDcfSensitivity", () => {
  const base = {
    price: 20,
    sharesOutstanding: 100,
    netDebt: 0,
    fcf0: 100,
    discountRate: 0.1,
    terminalGrowthRate: 0.03,
    years: 5,
  };

  it("builds a row per delta, with higher discount rate requiring higher implied growth", () => {
    const rows = reverseDcfSensitivity(base, [-0.01, 0, 0.01]);
    expect(rows).toHaveLength(3);
    expect(rows[2].impliedGrowthRate ?? 0).toBeGreaterThan(rows[0].impliedGrowthRate ?? 0);
  });
});
