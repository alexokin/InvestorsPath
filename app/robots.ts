import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Static export has no server to compute this per-request; force-static
// makes `next build` emit robots.txt as a plain static file in out/.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
