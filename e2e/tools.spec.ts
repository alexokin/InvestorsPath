import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

/**
 * Read tool ids straight from lib/finance/tools.ts (source of truth) rather
 * than hardcoding them, so this stays correct if a tool is added/removed.
 */
function readToolIds(): string[] {
  const src = readFileSync(
    path.resolve(__dirname, "..", "lib", "finance", "tools.ts"),
    "utf8"
  );
  const match = src.match(/export type ToolId =\s*([^;]+);/);
  if (!match) throw new Error("Could not find ToolId union in lib/finance/tools.ts");
  return [...match[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
}

const toolIds = readToolIds();

test("tools index links to every calculator", async ({ page }) => {
  await page.goto("/tools/");
  for (const id of toolIds) {
    await expect(page.locator(`a[href="/tools/${id}/"]`)).toBeVisible();
  }
});

for (const id of toolIds) {
  test(`calculator /tools/${id}/ renders and updates on input`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      // Next's client segment-cache prefetch (`?_rsc=` / `__next.*.txt`) can 404
      // against a static export; it is a harmless prefetch miss, not a page error.
      const src = msg.location()?.url ?? "";
      if (/_rsc=|__next\./.test(src)) return;
      consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    await page.goto(`/tools/${id}/`);
    await expect(page.locator("h1")).toBeVisible();

    const numberInputs = page.locator('input[type="number"]');
    const inputCount = await numberInputs.count();
    expect(inputCount).toBeGreaterThan(0);

    const firstInput = numberInputs.first();
    const before = await firstInput.inputValue();

    // Grab a snapshot of the page's visible text before changing the input.
    const textBefore = await page.locator("body").innerText();

    const numericBefore = Number(before) || 0;
    await firstInput.fill(String(numericBefore + 37));
    await firstInput.dispatchEvent("change");

    // React re-renders asynchronously; poll instead of reading the text once.

    await expect

      .poll(async () => (await page.locator("body").innerText()) !== textBefore, { timeout: 5_000 })

      .toBe(true);

    expect(consoleErrors, `console errors on /tools/${id}/: ${consoleErrors.join("\n")}`).toEqual(
      []
    );
  });
}
