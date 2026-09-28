import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the production Docker image (see Dockerfile).
  output: "standalone",
  // Keep server-only Postgres driver out of the client bundle.
  serverExternalPackages: ["postgres"],
  poweredByHeader: false,
};

export default nextConfig;


