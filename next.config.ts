/**
 * Next.js config for monorepo dev and wallet libraries.
 * serverExternalPackages: SDK/Mento stay on Node resolution path.
 * turbopack.root + async-storage stub: bundler workarounds for RainbowKit/MetaMask.
 */
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(projectRoot, "..");

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@andrewkimjoseph/celina-sdk",
    "@mento-protocol/mento-sdk",
  ],
  turbopack: {
    root: workspaceRoot,
    resolveAlias: {
      "@react-native-async-storage/async-storage":
        "./celeste/src/lib/empty-module.ts",
    },
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": path.join(
        projectRoot,
        "src/lib/empty-module.ts",
      ),
    };
    return config;
  },
};

export default nextConfig;
