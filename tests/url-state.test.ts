import { describe, expect, it } from "vitest";
import { decodeState, encodeState, parseNumberParam, type UrlStateSchema } from "@/lib/calculators/url-state";

describe("parseNumberParam", () => {
  it("falls back for missing values", () => {
    expect(parseNumberParam(null, { fallback: 7 })).toBe(7);
    expect(parseNumberParam(undefined, { fallback: 7 })).toBe(7);
    expect(parseNumberParam("", { fallback: 7 })).toBe(7);
  });

  it("falls back for invalid numbers", () => {
    expect(parseNumberParam("abc", { fallback: 3 })).toBe(3);
    expect(parseNumberParam("NaN", { fallback: 3 })).toBe(3);
    // "1e999999" overflows to Infinity, which is not a finite number, so it
    // falls back rather than clamping to `max`.
    expect(parseNumberParam("1e999999", { fallback: 3, max: 100 })).toBe(3);
  });

  it("parses valid numbers, including negatives and decimals", () => {
    expect(parseNumberParam("42", { fallback: 0 })).toBe(42);
    expect(parseNumberParam("-3.5", { fallback: 0 })).toBe(-3.5);
  });

  it("clamps to min/max", () => {
    expect(parseNumberParam("-5", { fallback: 0, min: 0 })).toBe(0);
    expect(parseNumberParam("500", { fallback: 0, max: 100 })).toBe(100);
    expect(parseNumberParam("50", { fallback: 0, min: 0, max: 100 })).toBe(50);
  });
});

describe("encodeState", () => {
  const schema: UrlStateSchema = {
    fcf0: { default: 100 },
    g: { default: 8 },
    n: { default: 5, min: 1, max: 15 },
  };

  it("omits values equal to their schema default", () => {
    const qs = encodeState({ fcf0: 100, g: 8, n: 5 }, schema);
    expect(qs).toBe("");
  });

  it("includes only the fields that differ from default", () => {
    const qs = encodeState({ fcf0: 50, g: 8, n: 5 }, schema);
    expect(qs).toBe("fcf0=50");
  });

  it("includes multiple changed fields", () => {
    const params = new URLSearchParams(encodeState({ fcf0: 50, g: 10, n: 5 }, schema));
    expect(params.get("fcf0")).toBe("50");
    expect(params.get("g")).toBe("10");
    expect(params.has("n")).toBe(false);
  });

  it("formats decimals without float noise", () => {
    const qs = encodeState({ fcf0: 100, g: 8.1, n: 5 }, schema);
    expect(qs).toBe("g=8.1");
  });

  it("skips keys with non-finite values", () => {
    const qs = encodeState({ fcf0: NaN, g: 8, n: 5 }, schema);
    expect(qs).toBe("");
  });
});

describe("decodeState", () => {
  const schema: UrlStateSchema = {
    fcf0: { default: 100 },
    g: { default: 8 },
    n: { default: 5, min: 1, max: 15 },
  };

  it("fills in defaults for an empty query string", () => {
    expect(decodeState("", schema)).toEqual({ fcf0: 100, g: 8, n: 5 });
  });

  it("decodes present values and clamps out-of-range ones", () => {
    expect(decodeState("fcf0=50&n=999", schema)).toEqual({ fcf0: 50, g: 8, n: 15 });
  });

  it("ignores unrelated query params", () => {
    expect(decodeState("utm_source=x&fcf0=42", schema)).toEqual({ fcf0: 42, g: 8, n: 5 });
  });

  it("accepts a URLSearchParams instance directly", () => {
    const params = new URLSearchParams("g=12");
    expect(decodeState(params, schema)).toEqual({ fcf0: 100, g: 12, n: 5 });
  });
});

describe("round-trip", () => {
  const schema: UrlStateSchema = {
    fcf0: { default: 100 },
    g: { default: 8 },
    n: { default: 5, min: 1, max: 15 },
    r: { default: 10 },
    tg: { default: 2.5 },
  };

  it("decode(encode(state)) reproduces the original state", () => {
    const state = { fcf0: 75, g: 8, n: 7, r: 9.5, tg: 3 };
    const roundTripped = decodeState(encodeState(state, schema), schema);
    expect(roundTripped).toEqual(state);
  });

  it("a state at all defaults round-trips through an empty query string", () => {
    const state = { fcf0: 100, g: 8, n: 5, r: 10, tg: 2.5 };
    const encoded = encodeState(state, schema);
    expect(encoded).toBe("");
    expect(decodeState(encoded, schema)).toEqual(state);
  });
});
