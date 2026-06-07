import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "43.131.9.176",
    "127.0.0.1",
    "localhost",
    "health-explorer-arcade-economic.trycloudflare.com",
  ],
};

export default nextConfig;
