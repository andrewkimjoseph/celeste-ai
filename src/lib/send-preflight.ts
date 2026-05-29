import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { parseUnits } from "viem";
import { normalizeRegistryTokenInput, formatTokenDisplaySymbol, GAS_UNITS_DISPLAY_LABEL } from "@/lib/registry-token";

type CelinaClient = ReturnType<typeof createCelinaClient>;

/** Minimum native CELO reserved for gas (approximate). */
const MIN_CELO_FOR_GAS = parseUnits("0.01", 18);

export type SendPreflightResult = {
  ok: boolean;
  token: string;
  amount: string;
  tokenBalance: string;
  celoBalance: string;
  message?: string;
};

/** Parse summaries like "Send 1 USDT to 0x…". */
export function parseSendSummary(summary: string): {
  amount: string;
  token: string;
} | null {
  const match = summary.match(/^Send\s+([\d.]+)\s+(\S+)\s+to\s/i);
  if (!match) {
    return null;
  }

  return { amount: match[1], token: match[2] };
}

export async function checkSendPreflight(
  celina: CelinaClient,
  address: `0x${string}`,
  token: string,
  amount: string,
): Promise<SendPreflightResult> {
  const resolved = celina.token.resolveToken(normalizeRegistryTokenInput(token));
  const { balances } = await celina.token.getBalances(address, [
    resolved.symbol,
    "CELO",
  ]);

  const tokenEntry = balances.find((b) => b.token === resolved.symbol);
  const celoEntry = balances.find((b) => b.token === "CELO");

  const tokenBalance = tokenEntry?.formatted ?? "0";
  const celoBalance = celoEntry?.formatted ?? "0";
  const tokenRaw = BigInt(tokenEntry?.raw ?? "0");
  const celoRaw = BigInt(celoEntry?.raw ?? "0");

  let amountWei: bigint;
  try {
    amountWei = parseUnits(amount, resolved.decimals);
  } catch {
    return {
      ok: false,
      token: resolved.symbol,
      amount,
      tokenBalance,
      celoBalance,
      message: `Invalid amount "${amount}".`,
    };
  }

  if (resolved.address === "native") {
    const totalNeeded = amountWei + MIN_CELO_FOR_GAS;
    if (tokenRaw < totalNeeded) {
      return {
        ok: false,
        token: resolved.symbol,
        amount,
        tokenBalance,
        celoBalance,
        message: `Insufficient ${GAS_UNITS_DISPLAY_LABEL}. You have ${tokenBalance} ${GAS_UNITS_DISPLAY_LABEL} but need about ${amount} ${GAS_UNITS_DISPLAY_LABEL} plus gas for fees.`,
      };
    }

    return {
      ok: true,
      token: resolved.symbol,
      amount,
      tokenBalance,
      celoBalance,
    };
  }

  if (tokenRaw < amountWei) {
    return {
      ok: false,
      token: resolved.symbol,
      amount,
      tokenBalance,
      celoBalance,
      message: `Insufficient ${formatTokenDisplaySymbol(resolved.symbol)}. You have ${tokenBalance} but tried to send ${amount}.`,
    };
  }

  if (celoRaw < MIN_CELO_FOR_GAS) {
    return {
      ok: false,
      token: resolved.symbol,
      amount,
      tokenBalance,
      celoBalance,
      message: `Low ${GAS_UNITS_DISPLAY_LABEL} for fees. You have ${celoBalance} ${GAS_UNITS_DISPLAY_LABEL}; keep some ${GAS_UNITS_DISPLAY_LABEL} to pay network fees.`,
    };
  }

  return {
    ok: true,
    token: resolved.symbol,
    amount,
    tokenBalance,
    celoBalance,
  };
}
