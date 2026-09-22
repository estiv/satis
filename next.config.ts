import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client"],
  agentRules: false,
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
    webpackMemoryOptimizations: true,
  },
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
};

export default nextConfig;
