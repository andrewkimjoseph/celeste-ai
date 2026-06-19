import { parseUnits } from "viem";
import { MINIPAY_FEE_CURRENCIES } from "@/lib/minipay-fee-currency";

/** Conservative MiniPay gas reserve when fee token equals spend token (6-decimal stables). */
export const MINIPAY_STABLE_GAS_BUFFER_6 = parseUnits("0.05", 6);

/** Conservative MiniPay gas reserve for 18-decimal USDm. */
export const MINIPAY_STABLE_GAS_BUFFER_18 = parseUnits("0.05", 18);

export type MiniPaySpendBufferInput = {
  balance: bigint;
  spendAmountWei: bigint;
  feeCurrency: `0x${string}`;
  spendTokenAddress: `0x${string}`;
};

export type MiniPaySpendBufferResult = {
  ok: boolean;
  message?: string;
  tokenSymbol?: string;
};

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/** Gas buffer wei for a MiniPay stable symbol. */
export function minipayGasBufferWei(symbol: string): bigint {
  if (symbol === "USDm") {
    return MINIPAY_STABLE_GAS_BUFFER_18;
  }
  return MINIPAY_STABLE_GAS_BUFFER_6;
}

/** True when MiniPay would pay gas from the same ERC-20 being spent. */
export function feeCurrencyMatchesSpendToken(
  feeCurrency: `0x${string}`,
  spendTokenAddress: `0x${string}`,
): boolean {
  const fee = normalizeAddress(feeCurrency);
  const spend = normalizeAddress(spendTokenAddress);

  return MINIPAY_FEE_CURRENCIES.some(
    (entry) =>
      normalizeAddress(entry.token) === spend &&
      (normalizeAddress(entry.feeCurrency) === fee ||
        normalizeAddress(entry.token) === fee),
  );
}

export function minipayEntryForTokenAddress(
  tokenAddress: `0x${string}`,
): (typeof MINIPAY_FEE_CURRENCIES)[number] | undefined {
  const spend = normalizeAddress(tokenAddress);
  return MINIPAY_FEE_CURRENCIES.find(
    (entry) => normalizeAddress(entry.token) === spend,
  );
}

export function minipayEntryForSymbol(
  symbol: string,
): (typeof MINIPAY_FEE_CURRENCIES)[number] | undefined {
  const normalized = symbol.trim().toLowerCase();
  return MINIPAY_FEE_CURRENCIES.find(
    (entry) => entry.symbol.toLowerCase() === normalized,
  );
}

export function minipaySpendBufferMessage(tokenSymbol: string): string {
  return (
    `You're using almost all your ${tokenSymbol}. Leave a little for network fees, ` +
    "or try a slightly smaller amount."
  );
}

/** Block spend-all when MiniPay gas is paid from the same stablecoin. */
export function checkMiniPaySpendBuffer(
  input: MiniPaySpendBufferInput,
): MiniPaySpendBufferResult {
  if (
    !feeCurrencyMatchesSpendToken(input.feeCurrency, input.spendTokenAddress)
  ) {
    return { ok: true };
  }

  const entry = minipayEntryForTokenAddress(input.spendTokenAddress);
  if (!entry) {
    return { ok: true };
  }

  const buffer = minipayGasBufferWei(entry.symbol);
  const totalNeeded = input.spendAmountWei + buffer;

  if (input.balance < totalNeeded) {
    return {
      ok: false,
      tokenSymbol: entry.symbol,
      message: minipaySpendBufferMessage(entry.symbol),
    };
  }

  return { ok: true, tokenSymbol: entry.symbol };
}

/** Pick fee stable symbol from wallet balances (same priority as resolveMiniPayFeeCurrency). */
export function minipayFeeSymbolFromBalances(
  balances: Array<{ symbol: string; raw: bigint }>,
): string | null {
  let bestIndex = -1;
  let bestBalance = BigInt(0);

  for (let i = 0; i < MINIPAY_FEE_CURRENCIES.length; i++) {
    const entry = MINIPAY_FEE_CURRENCIES[i]!;
    const balance =
      balances.find((b) => b.symbol === entry.symbol)?.raw ?? BigInt(0);

    if (balance > bestBalance) {
      bestBalance = balance;
      bestIndex = i;
    } else if (
      balance === bestBalance &&
      balance > BigInt(0) &&
      bestIndex >= 0 &&
      i < bestIndex
    ) {
      bestIndex = i;
    }
  }

  if (bestIndex >= 0 && bestBalance > BigInt(0)) {
    return MINIPAY_FEE_CURRENCIES[bestIndex]!.symbol;
  }

  return null;
}
