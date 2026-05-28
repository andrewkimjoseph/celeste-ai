import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export const AAVE_TOKEN_SYMBOLS = [
  "USDT",
  "WETH",
  "USDm",
  "USDC",
  "CELO",
  "EURm",
] as const;

/** Resolve input to an Aave V3 symbol via the Celo token registry. */
export function normalizeAaveTokenInput(
  celina: CelinaClient,
  token: string,
): (typeof AAVE_TOKEN_SYMBOLS)[number] {
  const resolved = celina.token.resolveToken(token.trim());
  const match = AAVE_TOKEN_SYMBOLS.find(
    (entry) => entry.toLowerCase() === resolved.symbol.toLowerCase(),
  );

  if (!match) {
    throw new Error(
      `Unsupported Aave token "${token}" on Celo mainnet. Supported: ${AAVE_TOKEN_SYMBOLS.join(", ")}.`,
    );
  }

  return match;
}
