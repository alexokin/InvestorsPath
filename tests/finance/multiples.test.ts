import { describe, expect, it } from "vitest";
import { calculateMultiples, compareMultiples } from "@/lib/finance/multiples";

describe("calculateMultiples", () => {
  // Price 50, 10 shares -> market cap 500. Net debt 100 -> EV 600.
  // Earnings 50 -> P/E 10. Book value 250 -> P/B 2. Revenue 200 -> P/S 2.5.
  // EBITDA 120 -> EV/EBITDA 5. FCF 40 -> P/FCF 12.5. EPS 5 -> earnings yield 0.1.
  const inputs = {
    price: 50,
    sharesOutstanding: 10,
    netDebt: 100,
    earnings: 50,
    ebitda: 120,
    revenue: 200,
    fcf: 40,
    bookValue: 250,
  };

  it("computes all standard multiples", () => {
    const result = calculateMultiples(inputs);
    expect(result.marketCap).toBeCloseTo(500, 6);
    expect(result.enterpriseValue).toBeCloseTo(600, 6);
    expect(result.pe).toBeCloseTo(10, 6);
    expect(result.pb).toBeCloseTo(2, 6);
    expect(result.ps).toBeCloseTo(2.5, 6);
    expect(result.evEbitda).toBeCloseTo(5, 6);
    expect(result.pFcf).toBeCloseTo(12.5, 6);
    expect(result.earningsYield).toBeCloseTo(0.1, 6);
  });

  it("returns null for multiples with a non-positive denominator", () => {
    const result = calculateMultiples({ ...inputs, earnings: -10, bookValue: 0 });
    expect(result.pe).toBeNull();
    expect(result.pb).toBeNull();
  });
});

describe("compareMultiples", () => {
  it("caps the comparison at 4 companies", () => {
    const company = {
      price: 10,
      sharesOutstanding: 100,
      netDebt: 0,
      earnings: 100,
      ebitda: 100,
      revenue: 500,
      fcf: 80,
      bookValue: 400,
    };
    const results = compareMultiples([
      { ...company, name: "A" },
      { ...company, name: "B" },
      { ...company, name: "C" },
      { ...company, name: "D" },
      { ...company, name: "E" },
    ]);
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.name)).toEqual(["A", "B", "C", "D"]);
  });
});
