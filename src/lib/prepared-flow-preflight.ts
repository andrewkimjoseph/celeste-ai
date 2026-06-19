import {
  isMiniPayBrowser,
  simulatePreparedStep,
  type PreparedTx,
} from "@andrewkimjoseph/celina-sdk/preflight";
import type { PublicClient } from "viem";
import { formatWalletError } from "@/lib/wallet-error";

/**
 * Run SDK preflight simulation for each prepared step before wallet broadcast.
 * MiniPay auto-fills feeCurrency on send — simulation passes isMiniPay for stable-only gas.
 */
export async function simulatePreparedFlowSteps(
  publicClient: PublicClient,
  from: `0x${string}`,
  steps: PreparedTx[],
): Promise<{ ok: true } | { ok: false; message: string; technicalDetails?: string }> {
  const isMiniPay = isMiniPayBrowser();

  for (const step of steps) {
    try {
      await simulatePreparedStep(
        publicClient as Parameters<typeof simulatePreparedStep>[0],
        {
          from,
          step,
          isMiniPay,
        },
      );
    } catch (error) {
      const formatted = formatWalletError(error);
      return {
        ok: false,
        message: formatted.message,
        technicalDetails: formatted.technicalDetails,
      };
    }
  }

  return { ok: true };
}
