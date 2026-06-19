import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { parseUnits } from "viem";
import { normalizeRegistryTokenInput } from "@/lib/registry-token";
import {
  minipayFeeSymbolFromBalances,
  minipayGasBufferWei,
  minipaySpendBufferMessage,
} from "@/lib/minipay-spend-buffer";

type CelinaClient = ReturnType<typeof createCelinaClient>;

/** Minimum native CELO reserved for gas (approximate). */
const MIN_CELO_FOR_GAS = parseUnits("0.01", 18);

export type SendPreflightOptions = {
  supportsFeeAbstraction?: boolean;
  blocksCeloSend?: boolean;
};

export type SendPreflightResult = {
  ok: boolean;
  token: string;
  amount: string;
  tokenBalance: string;
  celoBalance: string;
  supportsFeeAbstraction?: boolean;
  blocksCeloSend?: boolean;
  message?: string;
};

const MINIPAY_CELO_SEND_MESSAGE =
  "Sending CELO is not supported in MiniPay. You can send stablecoins like USDC, USDT, or USDm instead.";

function isCeloSendToken(resolved: { symbol: string }): boolean {
  return resolved.symbol === "CELO";
}

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
  options?: SendPreflightOptions,
): Promise<SendPreflightResult> {
  const supportsFeeAbstraction = options?.supportsFeeAbstraction === true;
  const blocksCeloSend = options?.blocksCeloSend === true;
  const resolved = celina.token.resolveToken(normalizeRegistryTokenInput(token));

  if (blocksCeloSend && isCeloSendToken(resolved)) {
    return {
      ok: false,
      token: resolved.symbol,
      amount,
      tokenBalance: "0",
      celoBalance: "0",
      supportsFeeAbstraction,
      blocksCeloSend: true,
      message: MINIPAY_CELO_SEND_MESSAGE,
    };
  }

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
      supportsFeeAbstraction,
      message: `Invalid amount "${amount}".`,
    };
  }

  if (resolved.address === "native") {
    const totalNeeded = supportsFeeAbstraction
      ? amountWei
      : amountWei + MIN_CELO_FOR_GAS;
    if (tokenRaw < totalNeeded) {
      return {
        ok: false,
        token: resolved.symbol,
        amount,
        tokenBalance,
        celoBalance,
        supportsFeeAbstraction,
        message: supportsFeeAbstraction
          ? `Insufficient CELO. You have ${tokenBalance} CELO but tried to send ${amount}.`
          : `Insufficient CELO. You have ${tokenBalance} CELO but need about ${amount} CELO plus gas.`,
      };
    }

    return {
      ok: true,
      token: resolved.symbol,
      amount,
      tokenBalance,
      celoBalance,
      supportsFeeAbstraction,
    };
  }

  if (tokenRaw < amountWei) {
    return {
      ok: false,
      token: resolved.symbol,
      amount,
      tokenBalance,
      celoBalance,
      supportsFeeAbstraction,
      message: `Insufficient ${resolved.symbol}. You have ${tokenBalance} but tried to send ${amount}.`,
    };
  }

  if (supportsFeeAbstraction) {
    const feeSymbol = minipayFeeSymbolFromBalances(
      balances.map((b) => ({ symbol: b.token, raw: BigInt(b.raw) })),
    );
    if (feeSymbol === resolved.symbol) {
      const buffer = minipayGasBufferWei(resolved.symbol);
      if (tokenRaw < amountWei + buffer) {
        return {
          ok: false,
          token: resolved.symbol,
          amount,
          tokenBalance,
          celoBalance,
          supportsFeeAbstraction,
          message: minipaySpendBufferMessage(resolved.symbol),
        };
      }
    }
  }

  if (!supportsFeeAbstraction && celoRaw < MIN_CELO_FOR_GAS) {
    return {
      ok: false,
      token: resolved.symbol,
      amount,
      tokenBalance,
      celoBalance,
      supportsFeeAbstraction,
      message: `Low CELO for gas. You have ${celoBalance} CELO; keep some CELO to pay network fees.`,
    };
  }

  return {
    ok: true,
    token: resolved.symbol,
    amount,
    tokenBalance,
    celoBalance,
    supportsFeeAbstraction,
  };
}
