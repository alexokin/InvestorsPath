import { test, expect } from "@playwright/test";

test("flashcards: flip, grade, and persist across reload", async ({ page }) => {
  await page.goto("/flashcards/all/");

  const card = page.getByRole("button", { name: /הצגת ההגדרה/ });
  await expect(card).toBeVisible();

  await card.click();
  await expect(page.getByRole("button", { name: /הצגת המונח/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.getByRole("button", { name: /^ידעתי/ }).click();

  const stored = await page.evaluate(() => window.localStorage.getItem("vip:flashcards:v1"));
  expect(stored).toBeTruthy();
  const parsed = JSON.parse(stored!);
  expect(Object.keys(parsed).length).toBeGreaterThan(0);

  await page.reload();

  const storedAfterReload = await page.evaluate(() =>
    window.localStorage.getItem("vip:flashcards:v1")
  );
  expect(storedAfterReload).toBe(stored);
});
