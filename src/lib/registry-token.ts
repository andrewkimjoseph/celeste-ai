import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";

type CelinaClient = ReturnType<typeof createCelinaClient>;

const REGISTRY_ALIASES: Record<string, string> = {
  GD: "GoodDollar",
  "G$": "GoodDollar",
  GOODDOLLAR: "GoodDollar",
  "GAS UNITS": "CELO",
  GAS_UNITS: "CELO",
};

/** User-facing label for native CELO in chat and UI. */
export const GAS_UNITS_DISPLAY_LABEL = "GAS units";

/** User-facing label for registry symbols in chat and UI. */
export function formatTokenDisplaySymbol(symbol: string): string {
  if (symbol === "CELO") {
    return GAS_UNITS_DISPLAY_LABEL;
  }
  if (symbol === "WCELO") {
    return `wrapped ${GAS_UNITS_DISPLAY_LABEL}`;
  }
  return symbol;
}

/** Normalize common LLM token shorthands before registry lookup. */
export function normalizeRegistryTokenInput(token: string): string {
  const trimmed = token.trim();
  const upper = trimmed.toUpperCase();
  return REGISTRY_ALIASES[upper] ?? REGISTRY_ALIASES[trimmed] ?? trimmed;
}

export function resolveRegistryTokenSymbol(
  celina: CelinaClient,
  token: string,
): string {
  return celina.token.resolveToken(normalizeRegistryTokenInput(token)).symbol;
}
