import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";

// Static export has no server to compute this per-request; force-static
// makes `next build` emit the manifest as a plain static file in out/
// (see app/sitemap.ts for the same pattern).
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מסלול המשקיע — המדריך המלא להשקעות ערך",
    short_name: "מסלול המשקיע",
    description: "המדריך המלא להשקעות ערך, בעברית.",
    lang: "he",
    dir: "rtl",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      {
        src: withBasePath("/icons/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: withBasePath("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
