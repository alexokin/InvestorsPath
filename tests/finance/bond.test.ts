import { describe, expect, it } from "vitest";
import { bondPrice, bondYtm, bondDurations, bondRateSensitivity } from "@/lib/finance/bond";

describe("bondPrice", () => {
  it("prices at par when coupon rate equals yield to maturity", () => {
    const price = bondPrice({
      faceValue: 1000,
      couponRate: 0.05,
      yearsToMaturity: 10,
      frequency: 1,
      yieldToMaturity: 0.05,
    });
    expect(price).toBeCloseTo(1000, 6);
  });

  it("prices below par when yield exceeds coupon rate", () => {
    const price = bondPrice({
      faceValue: 1000,
      couponRate: 0.04,
      yearsToMaturity: 10,
      frequency: 1,
      yieldToMaturity: 0.06,
    });
    expect(price).toBeLessThan(1000);
  });

  it("prices above par when yield is below coupon rate", () => {
    const price = bondPrice({
      faceValue: 1000,
      couponRate: 0.06,
      yearsToMaturity: 10,
      frequency: 1,
      yieldToMaturity: 0.04,
    });
    expect(price).toBeGreaterThan(1000);
  });

  it("matches a hand-computed semi-annual example", () => {
    // Face 1000, 6% annual coupon paid semi-annually (30/period), 2 years,
    // 8% nominal annual yield (4%/period).
    const price = bondPrice({
      faceValue: 1000,
      couponRate: 0.06,
      yearsToMaturity: 2,
      frequency: 2,
      yieldToMaturity: 0.08,
    });
    // PV = 30/1.04 + 30/1.04^2 + 30/1.04^3 + 1030/1.04^4
    const expected = 30 / 1.04 + 30 / 1.04 ** 2 + 30 / 1.04 ** 3 + 1030 / 1.04 ** 4;
    expect(price).toBeCloseTo(expected, 6);
  });

  it("prices a zero-coupon bond as the discounted face value", () => {
    const price = bondPrice({
      faceValue: 1000,
      couponRate: 0,
      yearsToMaturity: 5,
      frequency: 1,
      yieldToMaturity: 0.1,
    });
    expect(price).toBeCloseTo(1000 / 1.1 ** 5, 6);
  });

  it("throws when faceValue is not positive", () => {
    expect(() =>
      bondPrice({ faceValue: 0, couponRate: 0.05, yearsToMaturity: 10, frequency: 1, yieldToMaturity: 0.05 })
    ).toThrow();
  });

  it("throws when yearsToMaturity is not positive", () => {
    expect(() =>
      bondPrice({ faceValue: 1000, couponRate: 0.05, yearsToMaturity: 0, frequency: 1, yieldToMaturity: 0.05 })
    ).toThrow();
  });
});

describe("bondYtm", () => {
  it("recovers the yield used to compute a price (annual)", () => {
    const faceValue = 1000;
    const couponRate = 0.05;
    const yearsToMaturity = 10;
    const frequency = 1 as const;
    const knownYield = 0.07;
    const price = bondPrice({ faceValue, couponRate, yearsToMaturity, frequency, yieldToMaturity: knownYield });

    const result = bondYtm({ faceValue, couponRate, yearsToMaturity, frequency, price });
    expect(result.converged).toBe(true);
    expect(result.yieldToMaturity).toBeCloseTo(knownYield, 5);
  });

  it("recovers the yield used to compute a price (semi-annual)", () => {
    const faceValue = 1000;
    const couponRate = 0.04;
    const yearsToMaturity = 15;
    const frequency = 2 as const;
    const knownYield = 0.03;
    const price = bondPrice({ faceValue, couponRate, yearsToMaturity, frequency, yieldToMaturity: knownYield });

    const result = bondYtm({ faceValue, couponRate, yearsToMaturity, frequency, price });
    expect(result.converged).toBe(true);
    expect(result.yieldToMaturity).toBeCloseTo(knownYield, 5);
  });

  it("returns YTM equal to the coupon rate when priced at par", () => {
    const result = bondYtm({ faceValue: 1000, couponRate: 0.05, yearsToMaturity: 10, frequency: 1, price: 1000 });
    expect(result.converged).toBe(true);
    expect(result.yieldToMaturity).toBeCloseTo(0.05, 5);
  });

  it("does not converge for a non-positive price", () => {
    const result = bondYtm({ faceValue: 1000, couponRate: 0.05, yearsToMaturity: 10, frequency: 1, price: 0 });
    expect(result.converged).toBe(false);
    expect(result.yieldToMaturity).toBeNull();
  });
});

describe("bondDurations", () => {
  it("equals years to maturity for a zero-coupon bond", () => {
    const { macaulayDuration } = bondDurations({
      faceValue: 1000,
      couponRate: 0,
      yearsToMaturity: 7,
      frequency: 1,
      yieldToMaturity: 0.05,
    });
    expect(macaulayDuration).toBeCloseTo(7, 6);
  });

  it("is shorter than years to maturity for a coupon-paying bond", () => {
    const { macaulayDuration } = bondDurations({
      faceValue: 1000,
      couponRate: 0.05,
      yearsToMaturity: 10,
      frequency: 1,
      yieldToMaturity: 0.05,
    });
    expect(macaulayDuration).toBeLessThan(10);
    expect(macaulayDuration).toBeGreaterThan(0);
  });

  it("modified duration is Macaulay duration discounted by the periodic yield", () => {
    const inputs = { faceValue: 1000, couponRate: 0.05, yearsToMaturity: 10, frequency: 2 as const, yieldToMaturity: 0.06 };
    const { macaulayDuration, modifiedDuration } = bondDurations(inputs);
    expect(modifiedDuration).toBeCloseTo(macaulayDuration / (1 + inputs.yieldToMaturity / inputs.frequency), 6);
  });

  it("longer maturity increases duration, all else equal", () => {
    const short = bondDurations({ faceValue: 1000, couponRate: 0.05, yearsToMaturity: 5, frequency: 1, yieldToMaturity: 0.05 });
    const long = bondDurations({ faceValue: 1000, couponRate: 0.05, yearsToMaturity: 20, frequency: 1, yieldToMaturity: 0.05 });
    expect(long.macaulayDuration).toBeGreaterThan(short.macaulayDuration);
  });
});

describe("bondRateSensitivity", () => {
  it("builds a table with price decreasing as yield increases", () => {
    const rows = bondRateSensitivity(
      { faceValue: 1000, couponRate: 0.05, yearsToMaturity: 10, frequency: 1, yieldToMaturity: 0.05 },
      [-0.02, -0.01, 0, 0.01, 0.02]
    );
    expect(rows).toHaveLength(5);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].price).toBeLessThan(rows[i - 1].price);
    }
  });

  it("skips deltas that would push the periodic yield to <= -100%", () => {
    const rows = bondRateSensitivity(
      { faceValue: 1000, couponRate: 0.05, yearsToMaturity: 10, frequency: 1, yieldToMaturity: -0.9 },
      [-0.2, 0]
    );
    expect(rows.some((r) => r.yieldToMaturity <= -1)).toBe(false);
  });
});
