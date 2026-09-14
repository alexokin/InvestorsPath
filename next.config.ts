import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: "/InvestorsPath",
  assetPrefix: "/InvestorsPath/",
};

export default nextConfig;
