import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
  /* config options here */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  staticPageGenerationTimeout: 300,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;