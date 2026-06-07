import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: [
    "43.131.9.176",
    "127.0.0.1",
    "localhost",
    "health-explorer-arcade-economic.trycloudflare.com",
  ],
};

export default nextConfig;
