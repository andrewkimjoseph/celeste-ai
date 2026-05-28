/** Short display for nav chips (avoids long decimal strings on mobile). */
export function formatBalanceShort(
  formatted: string,
  maxFractionDigits = 4,
): string {
  const num = Number(formatted);
  if (Number.isNaN(num)) {
    return formatted;
  }
  if (num === 0) {
    return "0";
  }
  if (num > 0 && num < 10 ** -maxFractionDigits) {
    return `<${10 ** -maxFractionDigits}`;
  }
  return num.toLocaleString(undefined, {
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Compact tx hash for chat bubbles on mobile. */
export function formatTxHash(hash: string): string {
  if (hash.length <= 18) {
    return hash;
  }
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function formatTxHashes(hashes: string[]): string {
  return hashes.map(formatTxHash).join(", ");
}
