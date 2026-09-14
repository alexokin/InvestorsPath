import type { NextConfig } from "next";

// GitHub Pages serves this repo at a subpath (https://alexokin.github.io/InvestorsPath)
// until a custom domain is mapped, so every asset/link needs that prefix in
// production. Locally (dev, build, e2e, Lighthouse) nothing should be
// prefixed, so this is opt-in via an env var set only by
// .github/workflows/deploy-pages.yml — never hardcode it here, or local
// `npm run dev`/`npm run build` + e2e + Lighthouse all break (every asset
// and internal link 404s against a server rooted at "/").
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
};

export default nextConfig;
