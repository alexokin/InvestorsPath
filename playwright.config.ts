import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke suite against a production `next start` server.
 *
 * Locally: `npm run build && npm run e2e` (webServer starts the server and
 * reuses it if already running on :4173).
 * In CI: the workflow builds first, then runs `playwright test` with
 * `reuseExistingServer: false` implied by CI env so a fresh server is used.
 *
 * No Supabase secrets are configured for this run, so the app builds in mock
 * auth mode: specs sign in with `signIn(page)` from `e2e/helpers.ts`, which
 * sets the `vip-mock-user` cookie the proxy and AuthProvider trust instead of
 * a real Supabase session.
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
    command: "npm run start -- -p 4173",
    url: "http://localhost:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
