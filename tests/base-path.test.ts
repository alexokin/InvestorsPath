import { afterEach, describe, expect, it, vi } from "vitest";

// BASE_PATH is computed once from process.env at module load time, so each
// scenario below sets the env var, resets the module cache, and re-imports.
const ORIGINAL_ENV = process.env.NEXT_PUBLIC_BASE_PATH;

async function loadWithBasePath(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = value;
  }
  return import("@/lib/base-path");
}

afterEach(() => {
  if (ORIGINAL_ENV === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = ORIGINAL_ENV;
  }
  vi.resetModules();
});

describe("BASE_PATH", () => {
  it("is an empty string when the env var is unset", async () => {
    const { BASE_PATH } = await loadWithBasePath(undefined);
    expect(BASE_PATH).toBe("");
  });

  it("is an empty string when the env var is empty", async () => {
    const { BASE_PATH } = await loadWithBasePath("");
    expect(BASE_PATH).toBe("");
  });

  it("strips a trailing slash", async () => {
    const { BASE_PATH } = await loadWithBasePath("/InvestorsPath/");
    expect(BASE_PATH).toBe("/InvestorsPath");
  });
});

describe("withBasePath", () => {
  it("returns the path unchanged when no base path is configured", async () => {
    const { withBasePath } = await loadWithBasePath(undefined);
    expect(withBasePath("/search-index.json")).toBe("/search-index.json");
    expect(withBasePath("/")).toBe("/");
  });

  it("prefixes a root-relative path when a base path is configured", async () => {
    const { withBasePath } = await loadWithBasePath("/InvestorsPath");
    expect(withBasePath("/search-index.json")).toBe("/InvestorsPath/search-index.json");
    expect(withBasePath("/sw.js")).toBe("/InvestorsPath/sw.js");
    expect(withBasePath("/")).toBe("/InvestorsPath/");
  });

  it("does not double-prefix a path that is already prefixed", async () => {
    const { withBasePath } = await loadWithBasePath("/InvestorsPath");
    expect(withBasePath("/InvestorsPath/search-index.json")).toBe(
      "/InvestorsPath/search-index.json"
    );
    expect(withBasePath(withBasePath("/sw.js"))).toBe("/InvestorsPath/sw.js");
  });

  it("leaves absolute and protocol-relative URLs alone", async () => {
    const { withBasePath } = await loadWithBasePath("/InvestorsPath");
    expect(withBasePath("https://example.com/x")).toBe("https://example.com/x");
    expect(withBasePath("http://example.com/x")).toBe("http://example.com/x");
    expect(withBasePath("//example.com/x")).toBe("//example.com/x");
  });

  it("leaves same-page anchors alone", async () => {
    const { withBasePath } = await loadWithBasePath("/InvestorsPath");
    expect(withBasePath("#top")).toBe("#top");
  });
});
