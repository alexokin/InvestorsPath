import { test, expect } from "@playwright/test";
import { p, rx, signIn } from "./helpers";

test("Ctrl+K search finds DCF and navigates on Enter", async ({ page }) => {
  await signIn(page);
  await page.goto(p("/"));

  await page.keyboard.press("Control+k");

  const dialog = page.getByRole("dialog", { name: "חיפוש בקורס" });
  await expect(dialog).toBeVisible();

  const input = page.locator('input[aria-label="חיפוש בקורס"]');
  await expect(input).toBeFocused();
  await input.fill("DCF");

  const results = page.getByRole("listbox", { name: "תוצאות חיפוש" });
  await expect(results.getByRole("option").first()).toBeVisible();
  await expect(results.getByText(/DCF/i).first()).toBeVisible();

  await page.keyboard.press("Enter");

  await expect(dialog).not.toBeVisible();
  // Should have navigated away from the home page to whatever the top DCF
  // result pointed at (the DCF tool page, or a lesson mentioning it).
  await expect(page).not.toHaveURL(`http://localhost:4173${p("/")}`);
});

test("Ctrl+K search finds a Hebrew query and navigates on Enter", async ({ page }) => {
  await signIn(page);
  await page.goto(p("/"));

  await page.keyboard.press("Control+k");

  const dialog = page.getByRole("dialog", { name: "חיפוש בקורס" });
  await expect(dialog).toBeVisible();

  const input = page.locator('input[aria-label="חיפוש בקורס"]');
  await expect(input).toBeFocused();
  await input.fill("מרווח ביטחון");

  const results = page.getByRole("listbox", { name: "תוצאות חיפוש" });
  await expect(results.getByRole("option").first()).toBeVisible();
  await expect(results.getByText(/מרווח ביטחון/).first()).toBeVisible();

  await page.keyboard.press("Enter");

  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(rx("/(lessons|tools|glossary)/"));
});
