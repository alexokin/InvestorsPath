import { test, expect } from "@playwright/test";

test("Ctrl+K search finds DCF and navigates on Enter", async ({ page }) => {
  await page.goto("/");

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
  await expect(page).not.toHaveURL("http://localhost:4173/");
});
