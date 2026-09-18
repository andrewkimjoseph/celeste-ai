import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** CJS wallet/UI deps that crash workerd's RSC module runner unless prebundled. */
const cjsOptimizeDeps = [
  "@metamask/sdk",
  "@metamask/utils",
  "@metamask/utils > semver",
  "@rainbow-me/rainbowkit",
  "@tanstack/react-query",
  "dexie",
  "eventemitter3",
  "semver",
  "use-sync-external-store",
  "valtio",
  "wagmi",
];

function includeCjsOptimizeDeps() {
  return {
    name: "include-cjs-optimize-deps",
    config(config: { environments?: Record<string, { optimizeDeps?: { include?: string[] } }> }) {
      for (const envName of ["ssr", "rsc"] as const) {
        const env = config.environments?.[envName];
        if (!env) continue;
        env.optimizeDeps ??= {};
        env.optimizeDeps.include = [
          ...new Set([...(env.optimizeDeps.include ?? []), ...cjsOptimizeDeps]),
        ];
      }
    },
  };
}

export default defineConfig({
  plugins: [
    vinext({
      // Workers Cache until the CELINA account enables R2 (Response Store needs a bucket).
      cache: { cdn: cdnAdapter() },
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
    includeCjsOptimizeDeps(),
  ],
  resolve: {
    alias: {
      "@react-native-async-storage/async-storage": path.join(
        projectRoot,
        "src/lib/empty-module.ts",
      ),
    },
  },
  legacy: {
    inconsistentCjsInterop: true,
  },
});
