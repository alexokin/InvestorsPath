import { describe, expect, it } from "vitest";
import { isProtectedPath, isPublicAuthEntry, safeNext } from "@/lib/auth/protected-paths";

describe("isProtectedPath", () => {
  it("matches protected prefixes with or without a trailing slash", () => {
    expect(isProtectedPath("/dashboard/")).toBe(true);
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/lessons/before-you-start/what-is-value-investing/")).toBe(true);
    expect(isProtectedPath("/chapters/before-you-start")).toBe(true);
    expect(isProtectedPath("/flashcards/")).toBe(true);
    expect(isProtectedPath("/progress/")).toBe(true);
    expect(isProtectedPath("/tools/checklist/")).toBe(true);
    expect(isProtectedPath("/cheatsheets/")).toBe(true);
    expect(isProtectedPath("/glossary/")).toBe(true);
    expect(isProtectedPath("/curriculum/")).toBe(true);
  });

  it("does not match public paths", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login/")).toBe(false);
    expect(isProtectedPath("/changelog/")).toBe(false);
    expect(isProtectedPath("/feed.xml")).toBe(false);
  });

  it("does not match a prefix as a substring of an unrelated path", () => {
    expect(isProtectedPath("/toolsy/")).toBe(false);
    expect(isProtectedPath("/my-dashboard/")).toBe(false);
  });

  it("excludes opengraph-image routes even under a protected prefix", () => {
    expect(isProtectedPath("/chapters/before-you-start/opengraph-image")).toBe(false);
    expect(isProtectedPath("/lessons/x/y/opengraph-image")).toBe(false);
  });
});

describe("isPublicAuthEntry", () => {
  it("accepts the root and /login/ with or without a trailing slash", () => {
    expect(isPublicAuthEntry("/")).toBe(true);
    expect(isPublicAuthEntry("/login/")).toBe(true);
    expect(isPublicAuthEntry("/login")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isPublicAuthEntry("/dashboard/")).toBe(false);
    expect(isPublicAuthEntry("/login/extra/")).toBe(false);
  });
});

describe("safeNext", () => {
  it("returns the default for missing input", () => {
    expect(safeNext(null)).toBe("/dashboard/");
    expect(safeNext(undefined)).toBe("/dashboard/");
    expect(safeNext("")).toBe("/dashboard/");
  });

  it("returns the default for values that don't start with /", () => {
    expect(safeNext("dashboard/")).toBe("/dashboard/");
    expect(safeNext("https://evil.com/")).toBe("/dashboard/");
  });

  it("rejects protocol-relative paths (//)", () => {
    expect(safeNext("//evil.com")).toBe("/dashboard/");
  });

  it("rejects backslashes or colons before the first real slash", () => {
    expect(safeNext("/\\evil.com")).toBe("/dashboard/");
    expect(safeNext("/evil.com:80/x")).toBe("/dashboard/");
  });

  it("passes through a valid root-relative path", () => {
    expect(safeNext("/lessons/before-you-start/what-is-value-investing/")).toBe(
      "/lessons/before-you-start/what-is-value-investing/"
    );
    expect(safeNext("/dashboard/")).toBe("/dashboard/");
  });
});
