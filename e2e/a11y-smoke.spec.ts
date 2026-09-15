import { test, expect } from "@playwright/test";
import { p, signIn } from "./helpers";

const SIGNED_OUT_PAGES = ["/", "/login/"];
const GATED_PAGES = ["/dashboard/", "/curriculum/", "/tools/", "/progress/", "/flashcards/all/"];

function collectConsoleErrors(page: import("@playwright/test").Page): string[] {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    // Next's client segment-cache prefetch (`?_rsc=` / `__next.*.txt`) can 404
    // for a statically generated route; it is a harmless prefetch miss, not a page error.
    const src = msg.location()?.url ?? "";
    if (/_rsc=|__next\./.test(src)) return;
    consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  return consoleErrors;
}

for (const path of SIGNED_OUT_PAGES) {
  test(`${path} (signed out) is RTL Hebrew with no console errors`, async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await page.goto(p(path));

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "he");

    expect(consoleErrors, `console errors on ${path}: ${consoleErrors.join("\n")}`).toEqual([]);
  });
}

for (const path of GATED_PAGES) {
  test(`${path} (signed in) is RTL Hebrew with no console errors`, async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await signIn(page);
    await page.goto(p(path));

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "he");

    expect(consoleErrors, `console errors on ${path}: ${consoleErrors.join("\n")}`).toEqual([]);
  });
}

test("search-index.json is served under the base path and is a non-empty JSON array", async ({
  page,
}) => {
  await page.goto(p("/"));
  const result = await page.evaluate(async (url) => {
    const res = await fetch(url);
    const body = await res.json();
    return { status: res.status, length: Array.isArray(body) ? body.length : -1 };
  }, p("/search-index.json"));

  expect(result.status).toBe(200);
  expect(result.length).toBeGreaterThan(0);
});
