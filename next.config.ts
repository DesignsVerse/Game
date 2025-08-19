import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // This will allow production builds to pass
    // even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
