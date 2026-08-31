import { erc20Abi, type PublicClient } from "viem";

/**
 * MiniPay gas currencies — never CELO.
 * Balance reads use ERC-20 token addresses; simulation/send use feeCurrency
 * (CIP-64 adapters for 6-decimal USDT/USDC, token address for 18-decimal USDm).
 */
export const MINIPAY_FEE_CURRENCIES = [
  {
    symbol: "USDT",
    token: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const,
    feeCurrency: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72" as const,
  },
  {
    symbol: "USDm",
    token: "0x765de816845861e75a25fca122bb6898b8b1282a" as const,
    feeCurrency: "0x765de816845861e75a25fca122bb6898b8b1282a" as const,
  },
  {
    symbol: "USDC",
    token: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as const,
    feeCurrency: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as const,
  },
] as const;

export type ResolveMiniPayFeeCurrencyOptions = {
  isMiniPay?: boolean;
  feeCurrency?: `0x${string}`;
};

/**
 * Resolve Celo fee-abstraction currency for MiniPay simulation and send.
 * MiniPay: highest stable balance (USDT tiebreak); no CELO fallback.
 */
export async function resolveMiniPayFeeCurrency(
  publicClient: PublicClient,
  from: `0x${string}`,
  options?: ResolveMiniPayFeeCurrencyOptions,
): Promise<`0x${string}` | undefined> {
  if (options?.feeCurrency) {
    return options.feeCurrency;
  }

  const isMiniPay = options?.isMiniPay ?? false;

  const results = await publicClient.multicall({
    contracts: MINIPAY_FEE_CURRENCIES.map((entry) => ({
      address: entry.token,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [from] as const,
    })),
    allowFailure: true,
  });

  let bestIndex = -1;
  let bestBalance = BigInt(0);

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    if (result.status !== "success") {
      continue;
    }
    const balance = result.result as bigint;
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
    return MINIPAY_FEE_CURRENCIES[bestIndex]!.feeCurrency;
  }

  if (isMiniPay) {
    throw new Error(
      "No stablecoin balance for gas. MiniPay requires USDT, USDm, or USDC to pay transaction fees.",
    );
  }

  return undefined;
}
