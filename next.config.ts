import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Désactivation explicite de certaines fonctionnalités gourmandes pour accélérer le build
  typescript: {
    ignoreBuildErrors: false, // On garde la sécurité mais on peut mettre à true si le build est trop lent
  },
  eslint: {
    ignoreDuringBuilds: true, // Accélère grandement le build en sautant le linting (déjà fait en local/CI)
  },
};

export default nextConfig;
