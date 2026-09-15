import { test, expect } from "@playwright/test";
import { p, rx, signIn } from "./helpers";

/**
 * Home -> dashboard (signed in) -> first chapter -> first lesson -> quiz ->
 * mark complete -> reload and confirm the sidebar tick + localStorage
 * persistence (vip:progress:v2).
 */
test("lesson flow: quiz, mark complete, persists across reload", async ({ page }) => {
  await signIn(page);
  await page.goto(p("/"));
  await expect(page).toHaveURL(rx("/dashboard/$"));

  // First chapter card under "פרקי הקורס".
  const chapterCards = page.locator(`a[href^="${p("/chapters/")}"]`);
  await expect(chapterCards.first()).toBeVisible();
  await chapterCards.first().click();
  await expect(page).toHaveURL(rx("/chapters/[^/]+/$"));

  // First lesson in the chapter's lesson list.
  const lessonLinks = page.locator(`a[href^="${p("/lessons/")}"]`);
  await expect(lessonLinks.first()).toBeVisible();
  await lessonLinks.first().click();
  await expect(page).toHaveURL(rx("/lessons/[^/]+/[^/]+/$"));

  // h1 renders.
  await expect(page.locator("h1")).toBeVisible();

  // Video or the "no video" notice.
  // Videos render as a click-to-load facade (a "נגן: …" button) until clicked.
  const videoOrNotice = page
    .getByText("אין סרטון")
    .or(page.locator("iframe"))
    .or(page.getByRole("button", { name: /^נגן:/ }));
  await expect(videoOrNotice.first()).toBeVisible();

  // Quiz section.
  const quizHeading = page.getByRole("heading", { name: "בחן את עצמך" });
  await expect(quizHeading).toBeVisible();

  // The Quiz component renders as the element right after the heading.
  const quizRoot = quizHeading.locator("xpath=following-sibling::*[1]");
  const blocks = quizRoot.locator("> div");
  const blockCount = await blocks.count();
  expect(blockCount).toBeGreaterThan(0);
  for (let i = 0; i < blockCount; i++) {
    const block = blocks.nth(i);
    const optionButtons = block.getByRole("button");
    // Question blocks have several option buttons; the trailing controls
    // block (submit button) has just one before submission, so skip it.
    if ((await optionButtons.count()) > 1) {
      await optionButtons.first().click();
    }
  }

  await quizRoot.getByRole("button", { name: "בדיקת תשובות" }).click();
  await expect(page.getByText(/קיבלת \d+ מתוך \d+ נכונות/)).toBeVisible();

  // Mark lesson complete.
  await page.getByRole("button", { name: "סימון כהושלם" }).click();
  await expect(page.getByRole("button", { name: "השיעור סומן כהושלם" })).toBeVisible();

  // localStorage key exists and is a v2 progress export shape.
  const stored = await page.evaluate(() => window.localStorage.getItem("vip:progress:v2"));
  expect(stored).toBeTruthy();
  const parsed = JSON.parse(stored!);
  expect(parsed.version).toBe(2);

  const lessonUrl = new URL(page.url());

  await page.reload();

  // Still marked complete after reload.
  await expect(page.getByRole("button", { name: "השיעור סומן כהושלם" })).toBeVisible();

  // Sidebar shows a completed tick for the current lesson (desktop sidebar only).
  const sidebarNav = page.getByRole("navigation", { name: "שיעורי הפרק" }).first();
  if (await sidebarNav.isVisible().catch(() => false)) {
    const activeLink = sidebarNav.locator(`a[href="${lessonUrl.pathname}"]`);
    await expect(activeLink.locator("svg").first()).toHaveClass(/text-primary/);
  }
});
