import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    turbopack: {
      root: typeof __dirname !== 'undefined' ? __dirname : undefined,
    }
  }
};

export default nextConfig;
