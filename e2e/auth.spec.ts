import { test, expect } from "@playwright/test";
import { p, rx, signIn } from "./helpers";

test("/ signed-out shows the landing page, not the dashboard", async ({ page }) => {
  await page.goto(p("/"));
  await expect(page.locator("h1")).toHaveText("מסלול המשקיע");
  await expect(page.getByRole("heading", { name: "מה תלמדו" })).toBeVisible();
  await expect(page.locator(`a[href^="${p("/chapters/")}"]`)).toHaveCount(0);
});

test("a protected lesson URL signed-out redirects to /login/ with next", async ({ page }) => {
  await page.goto(p("/lessons/before-you-start/what-is-value-investing/"));
  await expect(page).toHaveURL(rx("/login/\\?next="));
});

test("mock Google sign-in on /login/ lands on /dashboard/", async ({ page }) => {
  await page.goto(p("/login/"));
  await page.getByRole("button", { name: "התחברות עם Google" }).click();
  await expect(page).toHaveURL(rx("/dashboard/$"));
  await expect(page.locator(`a[href^="${p("/chapters/")}"]`).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /demo@example\.com/ })).toBeVisible();
});

test("/ signed-in redirects to /dashboard/", async ({ page }) => {
  await signIn(page);
  await page.goto(p("/"));
  await expect(page).toHaveURL(rx("/dashboard/$"));
});

test("sign-out clears progress and re-gates lesson URLs", async ({ page }) => {
  await signIn(page);
  await page.goto(p("/lessons/before-you-start/what-is-value-investing/"));
  await expect(page).toHaveURL(rx("/lessons/before-you-start/what-is-value-investing/$"));

  await page.getByRole("button", { name: "סימון כהושלם" }).click();
  await expect(page.getByRole("button", { name: "השיעור סומן כהושלם" })).toBeVisible();

  const stored = await page.evaluate(() => window.localStorage.getItem("vip:progress:v2"));
  expect(stored).toBeTruthy();

  await page.getByRole("button", { name: /demo@example\.com/ }).click();
  await page.getByRole("menuitem", { name: "התנתקות" }).click();

  await page.waitForURL((url) => url.pathname === p("/"));
  expect(await page.evaluate(() => document.cookie)).not.toContain("vip-mock-user");

  const clearedProgress = await page.evaluate(() =>
    window.localStorage.getItem("vip:progress:v2")
  );
  expect(clearedProgress).toBeNull();

  await page.goto(p("/lessons/before-you-start/what-is-value-investing/"));
  await expect(page).toHaveURL(rx("/login/\\?next="));
});

test("switching account owners clears the previous owner's local progress", async ({ page }) => {
  const userA = "user-a";
  const userB = { id: "mock-user-b", email: "b@example.com", name: "משתמש ב" };

  await page.addInitScript(
    ({ ownerKey, ownerValue, progressKey, progressValue }) => {
      window.localStorage.setItem(ownerKey, ownerValue);
      window.localStorage.setItem(progressKey, progressValue);
    },
    {
      ownerKey: "vip:sync:owner:v1",
      ownerValue: userA,
      progressKey: "vip:progress:v2",
      progressValue: JSON.stringify({
        version: 2,
        completedLessons: { "before-you-start/what-is-value-investing": true },
        quizScores: {},
        bookmarks: {},
        notes: {},
        lastVisited: null,
      }),
    }
  );

  await signIn(page, userB);
  await page.goto(p("/dashboard/"));
  await expect(page.locator(`a[href^="${p("/chapters/")}"]`).first()).toBeVisible();

  const progressAfter = await page.evaluate(() =>
    window.localStorage.getItem("vip:progress:v2")
  );
  if (progressAfter !== null) {
    const parsed = JSON.parse(progressAfter);
    expect(Object.keys(parsed.completedLessons ?? {}).length).toBe(0);
  }
});
