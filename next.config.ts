import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // On peut essayer de désactiver Turbopack si le build bloque
  // Mais Next.js 16 le recommande par défaut.
};

export default nextConfig;
