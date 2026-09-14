import { test, expect } from "@playwright/test";
import { p } from "./helpers";

test("theme toggle switches to dark and persists across reload", async ({ page }) => {
  await page.goto(p("/"));

  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /מצב (בהיר|כהה|לפי המערכת)/ });
  await expect(toggle).toBeVisible();

  // Cycle is light -> dark -> system; click until data-theme is "dark".
  for (let i = 0; i < 3; i++) {
    if ((await html.getAttribute("data-theme")) === "dark") break;
    await toggle.click();
  }
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});
