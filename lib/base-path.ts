/**
 * GitHub Pages serves this site at a subpath in production
 * (NEXT_PUBLIC_BASE_PATH, e.g. "/InvestorsPath"; empty locally). Next.js
 * automatically prefixes `<Link href>`, `router.push`, `_next/static`
 * assets and a handful of metadata fields (manifest, icons) with this
 * value, but it has no way to rewrite hand-written strings — a literal
 * `fetch("/search-index.json")`, `navigator.serviceWorker.register("/sw.js")`,
 * a plain `<a href="/feed.xml">`, etc. Route those through
 * `withBasePath()` instead of the config directly, so the prefix stays in
 * one place.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/**
 * Prefixes a root-relative path (e.g. "/sw.js") with {@link BASE_PATH}.
 *
 * - Idempotent: calling it twice on an already-prefixed path is a no-op.
 * - Leaves absolute URLs (`http://`, `https://`, protocol-relative `//`)
 *   and same-page anchors (`#...`) untouched — those never take a
 *   basePath.
 * - Non-root-relative input (no leading "/") is returned unchanged since
 *   there's nothing to prefix.
 */
export function withBasePath(path: string): string {
  if (!BASE_PATH) return path;
  if (!path.startsWith("/")) return path;
  if (path.startsWith("//")) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}
