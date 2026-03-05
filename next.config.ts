import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error - eslint is a valid config property but not in the NextConfig type
  eslint: { ignoreDuringBuilds: true },

};

export default nextConfig;
