/**
 * Canonical site origin, used for the sitemap, robots.txt and Open Graph
 * metadata. Set NEXT_PUBLIC_SITE_URL (see .env.example) to the production
 * domain; the placeholder below is only a fallback for local builds.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
