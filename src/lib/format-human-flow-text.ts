import { formatUnits } from "viem";
import { formatTokenDisplaySymbol } from "@/lib/registry-token";

/** Common Celo mainnet token decimals for display normalization. */
const TOKEN_DECIMALS: Record<string, number> = {
  CELO: 18,
  USDm: 18,
  cUSD: 18,
  EURm: 18,
  cEUR: 18,
  BRLm: 18,
  USDC: 6,
  USDT: 6,
  GoodDollar: 18,
  G$: 18,
  WETH: 18,
};

function getTokenDecimals(symbol: string): number {
  return TOKEN_DECIMALS[symbol] ?? TOKEN_DECIMALS[symbol.toUpperCase()] ?? 18;
}

function stripNumericSeparators(value: string): string {
  return value.replace(/,/g, "").trim();
}

/**
 * If a value looks like raw token base units (integer or decimal with a huge
 * whole part), convert via formatUnits.
 */
function tryFormatFromBaseUnits(
  numeric: string,
  decimals: number,
): string | null {
  const cleaned = stripNumericSeparators(numeric);
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return null;
  }

  const integerPart = cleaned.split(".")[0] ?? cleaned;
  // Short integers are normal human amounts (e.g. "10", "0.5").
  if (integerPart.length < 10) {
    return null;
  }

  try {
    const human = formatUnits(BigInt(integerPart), decimals);
    const asNumber = Number(human);
    if (Number.isFinite(asNumber) && asNumber >= 0 && asNumber < 1_000_000_000) {
      return human;
    }
  } catch {
    return null;
  }

  return null;
}

/** Round and locale-format a numeric string for UI. */
export function formatNumericString(value: string): string {
  const cleaned = stripNumericSeparators(value);
  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    return value;
  }
  if (num === 0) {
    return "0";
  }

  const abs = Math.abs(num);
  if (abs >= 1000) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (abs >= 1) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (abs >= 0.0001) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }
  return num.toLocaleString(undefined, { maximumSignificantDigits: 4 });
}

/**
 * Normalize an amount for display — converts likely raw base-unit integers
 * and trims excessive decimal places.
 */
export function formatDisplayAmount(
  amount: string,
  tokenSymbol?: string,
): string {
  const trimmed = amount.trim();
  const hasApprox = trimmed.startsWith("~");
  const numeric = hasApprox ? trimmed.slice(1).trim() : trimmed;
  const decimals = tokenSymbol ? getTokenDecimals(tokenSymbol) : 18;

  const fromBaseUnits = tryFormatFromBaseUnits(numeric, decimals);
  if (fromBaseUnits !== null) {
    const formatted = formatNumericString(fromBaseUnits);
    return hasApprox ? `~${formatted}` : formatted;
  }

  const formatted = formatNumericString(numeric);
  return hasApprox ? `~${formatted}` : formatted;
}

const AMOUNT_TOKEN_PATTERN =
  /(~?)([\d,]+(?:\.\d+)?)\s+([A-Za-z$][A-Za-z0-9$]*)/g;

/** Make flow summaries and step labels human-readable. */
export function formatHumanFlowText(text: string): string {
  return text.replace(
    AMOUNT_TOKEN_PATTERN,
    (_match, tilde: string, amount: string, symbol: string) =>
      `${tilde}${formatDisplayAmount(amount, symbol)} ${formatTokenDisplaySymbol(symbol)}`,
  );
}
