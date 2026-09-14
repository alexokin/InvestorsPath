import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke suite against the static export served from ./out.
 *
 * Locally: `npm run build && npm run e2e` (webServer starts `serve:out` and
 * reuses it if already running on :4173).
 * In CI: the workflow builds first, then runs `playwright test` with
 * `reuseExistingServer: false` implied by CI env so a fresh server is used.
 */
// Optional: run on an installed browser instead of Playwright's bundled
// Chromium, e.g. `PW_CHANNEL=chrome npm run e2e` (also "msedge").
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    locale: "he-IL",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], channel },
    },
  ],
  webServer: {
    command: "npm run serve:out",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
