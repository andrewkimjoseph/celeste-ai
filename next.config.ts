/**
 * Next.js config for Celeste AI and wallet libraries.
 * serverExternalPackages: SDK/Mento stay on Node resolution path.
 * turbopack.root + async-storage stub: bundler workarounds for RainbowKit/MetaMask.
 */
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
/** Turbopack needs project-relative aliases (not absolute paths). */
const celinaSdkTools = "../celina-sdk/build/tools/index.js";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@andrewkimjoseph/celina-sdk",
    "@andrewkimjoseph/celina-sdk/tools",
    "@amplitude/analytics-node",
    "@mento-protocol/mento-sdk",
  ],
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      "@react-native-async-storage/async-storage":
        "./src/lib/empty-module.ts",
      "@andrewkimjoseph/celina-sdk/tools": celinaSdkTools,
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
      "@andrewkimjoseph/celina-sdk/tools": path.join(
        projectRoot,
        celinaSdkTools,
      ),
    };
    return config;
  },
};

export default nextConfig;
