const FULL_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

/** True for a complete 32-byte transaction hash (0x + 64 hex). */
export function isFullTransactionHash(value: string): boolean {
  return FULL_TX_HASH.test(value.trim());
}

export function parseTransactionHash(value: string): `0x${string}` | null {
  const trimmed = value.trim();
  if (isFullTransactionHash(trimmed)) {
    return trimmed as `0x${string}`;
  }
  return null;
}

export function isTruncatedTransactionHash(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.includes("…") ||
    trimmed.includes("...") ||
    (trimmed.startsWith("0x") && trimmed.length > 2 && trimmed.length < 66)
  );
}

export const TRUNCATED_TX_HASH_MESSAGE =
  "I need the full transaction hash (0x followed by 64 hex characters). Shortened hashes cannot be looked up on-chain.";
