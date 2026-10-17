import type { NextConfig } from "next";

// "standalone" is what the Dockerfile copies into the runtime image.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
