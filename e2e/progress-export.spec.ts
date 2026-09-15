import { test, expect } from "@playwright/test";
import { p, signIn } from "./helpers";

test("progress export downloads a v2 JSON file", async ({ page }) => {
  await signIn(page);
  await page.goto(p("/progress/"));
  await expect(page.getByRole("heading", { name: "ההתקדמות שלי" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "ייצוא לקובץ" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^maslul-progress-.*\.json$/);

  const streamPath = await download.path();
  expect(streamPath).toBeTruthy();
  const fs = await import("node:fs/promises");
  const contents = await fs.readFile(streamPath!, "utf8");
  const parsed = JSON.parse(contents);
  expect(parsed.version).toBe(2);
});
