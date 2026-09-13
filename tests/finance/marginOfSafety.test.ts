import { describe, expect, it } from "vitest";
import { marginOfSafety, buyBelowPrice } from "@/lib/finance/marginOfSafety";

describe("marginOfSafety", () => {
  it("computes (intrinsicValue - price) / intrinsicValue: 100 vs 70 = 30%", () => {
    expect(marginOfSafety({ intrinsicValue: 100, price: 70 })).toBeCloseTo(0.3, 6);
  });

  it("is negative when price exceeds intrinsic value", () => {
    expect(marginOfSafety({ intrinsicValue: 100, price: 120 })).toBeCloseTo(-0.2, 6);
  });

  it("returns 0 when intrinsic value is not positive", () => {
    expect(marginOfSafety({ intrinsicValue: 0, price: 10 })).toBe(0);
  });
});

describe("buyBelowPrice", () => {
  it("computes intrinsicValue * (1 - targetMarginOfSafety)", () => {
    expect(buyBelowPrice(100, 0.3)).toBeCloseTo(70, 6);
  });

  it("returns the full intrinsic value when target margin is 0", () => {
    expect(buyBelowPrice(150, 0)).toBeCloseTo(150, 6);
  });
});
