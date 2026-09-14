import { describe, expect, it } from "vitest";
import { getChangelogEntries } from "@/lib/content/changelog";

describe("changelog", () => {
  it("loads and validates the real changelog.yaml", () => {
    const entries = getChangelogEntries();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.title_he.length).toBeGreaterThan(0);
      expect(entry.items_he.length).toBeGreaterThan(0);
    }
  });

  it("sorts entries by date descending", () => {
    const entries = getChangelogEntries();
    const dates = entries.map((e) => e.date);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it("includes the launch entry", () => {
    const entries = getChangelogEntries();
    expect(entries.some((e) => e.date === "2026-09-10")).toBe(true);
  });
});
