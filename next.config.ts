import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error - turbo is a valid config property but not in the NextConfig type
    turbo: {
      root: typeof __dirname !== 'undefined' ? __dirname : undefined,
    }
  }
};

export default nextConfig;
