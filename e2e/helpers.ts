import type { Page } from "@playwright/test";

// The app no longer deploys under a base path (that was a GitHub Pages
// requirement); BASE_PATH stays as an empty-string constant so p()/rx() keep
// working and specs need no edits.
export const BASE_PATH = "";

/** A mock-auth-mode user, matching lib/auth/mock.ts's MOCK_USERS.google. */
export const MOCK_USER = {
  id: "mock-google-user",
  email: "demo@example.com",
  name: "משתמש הדגמה",
};

/**
 * Signs in via the mock-mode cookie (must be called before the first
 * `page.goto`, since `addCookies` doesn't affect an already-loaded page).
 */
export async function signIn(page: Page, user = MOCK_USER): Promise<void> {
  await page.context().addCookies([
    {
      name: "vip-mock-user",
      value: encodeURIComponent(JSON.stringify(user)),
      url: "http://localhost:4173",
    },
  ]);
}

/** Prefix an app-relative path (e.g. "/tools/dcf/") with BASE_PATH, for
 * `page.goto(...)`, `locator('a[href^="..."]')`, etc. */
export const p = (path: string): string => `${BASE_PATH}${path}`;

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a RegExp anchored past BASE_PATH, for `toHaveURL`/`not.toHaveURL`.
 * `pathRegexSource` is the regex source for the app-relative part of the
 * URL, e.g. `rx("/chapters/[^/]+/$")`. */
export const rx = (pathRegexSource: string): RegExp =>
  new RegExp(escapeRegExp(BASE_PATH) + pathRegexSource);
