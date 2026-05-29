import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";

type CelinaClient = ReturnType<typeof createCelinaClient>;

const REGISTRY_ALIASES: Record<string, string> = {
  GD: "GoodDollar",
  "G$": "GoodDollar",
  GOODDOLLAR: "GoodDollar",
};

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
