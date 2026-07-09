import { createCelinaClient } from "@andrewkimjoseph/celina-sdk";

type CelinaClient = ReturnType<typeof createCelinaClient>;

let cachedClient: CelinaClient | undefined;

/**
 * Server-side Celina SDK client for `/api/chat` tools.
 * RPC URLs come from `CELO_RPC_URL_MAINNET` and `ETH_RPC_URL_MAINNET`.
 */
export function getCelinaClient() {
  cachedClient ??= createCelinaClient({
    rpcUrl: process.env.CELO_RPC_URL_MAINNET ?? "https://forno.celo.org",
    ethRpcUrl: process.env.ETH_RPC_URL_MAINNET,
    analyticsDeviceId: "celeste_ai",
    attributionTags: ["celo_862c21dd97a7"],
  });
  return cachedClient;
}
