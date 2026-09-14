// Shared helpers so specs work against both an unprefixed build (default,
// NEXT_PUBLIC_BASE_PATH unset) and a build made with a base path (e.g.
// "/InvestorsPath", the configuration that actually deploys to GitHub
// Pages). playwright.config.ts's webServer passes NEXT_PUBLIC_BASE_PATH
// through to serve-out.mjs, which mounts ./out at that base path - so the
// export under test and the URLs these tests hit must agree on it.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
