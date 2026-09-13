import { describe, expect, it } from "vitest";
import { formatMoney, currencySymbol, CURRENCIES } from "@/lib/currency";

// Intl's currency formatter inserts non-breaking spaces (U+00A0 / U+202F)
// between the symbol and the digits, so assertions below check for the
// presence of the symbol and the raw digits rather than an exact string.

describe("currencySymbol", () => {
  it("returns the shekel sign for ILS", () => {
    expect(currencySymbol("ILS")).toBe("₪");
  });

  it("returns the dollar sign for USD", () => {
    expect(currencySymbol("USD")).toBe("$");
  });

  it("exposes Hebrew names and locale metadata for both currencies", () => {
    expect(CURRENCIES.ILS.nameHe).toBe("שקל");
    expect(CURRENCIES.USD.nameHe).toBe("דולר");
    expect(CURRENCIES.ILS.locale).toBe("he-IL");
    expect(CURRENCIES.USD.locale).toBe("he-IL");
  });
});

describe("formatMoney", () => {
  it("formats an ILS amount with the shekel symbol and correct digits", () => {
    const formatted = formatMoney(1234, "ILS");
    expect(formatted).toContain("₪");
    // Grouping separators vary by Intl version, so just check the raw digits are present.
    expect(formatted.replace(/[^\d]/g, "")).toBe("1234");
  });

  it("formats a USD amount with the dollar symbol and correct digits", () => {
    const formatted = formatMoney(1234, "USD");
    expect(formatted).toContain("$");
    expect(formatted.replace(/[^\d]/g, "")).toBe("1234");
  });

  it("defaults to ILS when no currency is given", () => {
    expect(formatMoney(50)).toContain("₪");
  });

  it("respects maximumFractionDigits", () => {
    const formatted = formatMoney(47.4321, "USD", { maximumFractionDigits: 2 });
    expect(formatted).toContain("$");
    expect(formatted).toMatch(/47\.43/);
  });

  it("rounds to whole numbers by default", () => {
    const formatted = formatMoney(47.9, "ILS");
    expect(formatted.replace(/[^\d]/g, "")).toBe("48");
  });

  it("supports compact notation", () => {
    const formatted = formatMoney(1_500_000, "USD", { compact: true });
    expect(formatted).toContain("$");
    expect(formatted.length).toBeLessThan(formatMoney(1_500_000, "USD").length);
  });

  it("negative values keep the currency symbol", () => {
    const formatted = formatMoney(-100, "USD");
    expect(formatted).toContain("$");
    expect(formatted).toContain("100");
  });
});
