import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks", "@tabler/icons-react"],
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
