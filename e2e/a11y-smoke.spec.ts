import { test, expect } from "@playwright/test";

const PAGES = ["/", "/curriculum/", "/tools/", "/progress/", "/flashcards/all/"];

for (const path of PAGES) {
  test(`${path} is RTL Hebrew with no console errors`, async ({ page }) => {
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

    await page.goto(path);

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "he");

    expect(consoleErrors, `console errors on ${path}: ${consoleErrors.join("\n")}`).toEqual([]);
  });
}
