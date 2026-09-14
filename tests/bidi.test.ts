import { describe, expect, it } from "vitest";
import { toVisualRtl, wrapRtlLines } from "@/lib/seo/bidi";

describe("toVisualRtl", () => {
  it("returns an empty/falsy string unchanged", () => {
    expect(toVisualRtl("")).toBe("");
  });

  it("reverses word and letter order for pure Hebrew text", () => {
    expect(toVisualRtl("הערכות שווי")).toBe("יווש תוכרעה");
  });

  it("reverses a single Hebrew word", () => {
    expect(toVisualRtl("שלום")).toBe("םולש");
  });

  it("keeps an embedded Latin word reading left-to-right", () => {
    expect(toVisualRtl("שיטת DCF להערכה")).toBe("הכרעהל DCF תטיש");
  });

  it("keeps embedded numbers and a percent sign attached and LTR", () => {
    expect(toVisualRtl("צמיחה של 20% בשנה")).toBe("הנשב 20% לש החימצ");
  });

  it("keeps a decimal number intact", () => {
    expect(toVisualRtl("שיעור של 1.5% בממוצע")).toBe("עצוממב 1.5% לש רועיש");
  });

  it("mirrors parentheses around an acronym so '(DCF)' stays visually correct", () => {
    expect(toVisualRtl("שיטת (DCF) להערכה")).toBe("הכרעהל (DCF) תטיש");
  });

  it("moves trailing sentence punctuation to the visual left", () => {
    expect(toVisualRtl("זוהי שיטה.")).toBe(".הטיש יהוז");
  });

  it("keeps a colon after a digit in the RTL flow (not attached to the number)", () => {
    expect(toVisualRtl("שיטה 1: היוון")).toBe("ןוויה :1 הטיש");
  });

  it("keeps a slash-joined Latin abbreviation together (P/E)", () => {
    expect(toVisualRtl("מכפיל P/E נמוך")).toBe("ךומנ P/E ליפכמ");
  });

  it("keeps a two-word Latin phrase in its original internal order", () => {
    expect(toVisualRtl("לפי Rule 72 מחשבים")).toBe("םיבשחמ Rule 72 יפל");
  });

  it("is its own inverse for a Hebrew-only round trip", () => {
    const original = "כלל האצבע";
    expect(toVisualRtl(toVisualRtl(original))).toBe(original);
  });
});

describe("wrapRtlLines", () => {
  it("returns an empty array for empty/whitespace-only input", () => {
    expect(wrapRtlLines("", 10)).toEqual([]);
    expect(wrapRtlLines("   ", 10)).toEqual([]);
  });

  it("returns a single line when the text fits", () => {
    expect(wrapRtlLines("שיעור קצר", 28)).toEqual(["שיעור קצר"]);
  });

  it("greedily wraps long logical text at word boundaries", () => {
    const text = "שיטת ההיוון של תזרימי מזומנים עתידיים להערכת שווי חברה";
    const lines = wrapRtlLines(text, 20);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(20 + 15); // no single overlong word here, generous bound
    }
    // rejoining the wrapped words reproduces the original word sequence
    expect(lines.join(" ")).toBe(text);
  });

  it("never splits a single word across lines when it alone exceeds the width", () => {
    const lines = wrapRtlLines("קצר מאודארוךמאודארוךמאודארוךמאוד", 5);
    expect(lines).toEqual(["קצר", "מאודארוךמאודארוךמאודארוךמאוד"]);
  });
});
