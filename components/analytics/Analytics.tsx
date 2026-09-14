import Script from "next/script";

/**
 * Privacy-friendly analytics, opt-in via env vars set at build time (this is
 * a static export — nothing here can react to runtime config). Renders
 * nothing unless one of the two providers below is configured:
 *
 * - Plausible: set NEXT_PUBLIC_PLAUSIBLE_DOMAIN.
 * - Umami: set NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_SRC.
 *
 * If both are set, Plausible takes precedence. See .env.example.
 */
export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;

  if (plausibleDomain) {
    return (
      <Script
        defer
        data-domain={plausibleDomain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    );
  }

  if (umamiWebsiteId && umamiSrc) {
    return (
      <Script
        defer
        data-website-id={umamiWebsiteId}
        src={umamiSrc}
        strategy="afterInteractive"
      />
    );
  }

  return null;
}
