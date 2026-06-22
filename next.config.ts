import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autonome : produit .next/standalone (server.js + deps minimales)
  // pour une image Docker légère.
  output: "standalone",
};

export default nextConfig;
