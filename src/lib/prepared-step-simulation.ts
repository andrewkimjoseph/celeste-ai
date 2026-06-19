import { simulatePreparedStep } from "@andrewkimjoseph/celina-sdk/simulation";
import type { PublicClient } from "viem";
import type { PreparedTx } from "@/lib/prepared-flow";
import { resolveMiniPayFeeCurrency } from "@/lib/minipay-fee-currency";
import { formatWalletError } from "@/lib/wallet-error";

export type PreparedStepSimulationOptions = {
  supportsFeeAbstraction?: boolean;
  feeCurrency?: `0x${string}`;
};

/**
 * Simulate one prepared step immediately before wallet broadcast.
 * Resolves MiniPay feeCurrency in Celeste; SDK stays wallet-product agnostic.
 */
export async function simulatePreparedStepBeforeSend(
  publicClient: PublicClient,
  from: `0x${string}`,
  step: PreparedTx,
  options?: PreparedStepSimulationOptions,
): Promise<{ ok: true; feeCurrency?: `0x${string}` } | { ok: false; message: string; technicalDetails?: string }> {
  let feeCurrency = options?.feeCurrency;

  if (options?.supportsFeeAbstraction && !feeCurrency) {
    try {
      feeCurrency = await resolveMiniPayFeeCurrency(publicClient, from, {
        isMiniPay: true,
      });
    } catch (error) {
      const formatted = formatWalletError(error);
      return {
        ok: false,
        message: formatted.message,
        technicalDetails: formatted.technicalDetails,
      };
    }
  }

  try {
    await simulatePreparedStep(
      publicClient as never,
      { account: from, step },
      feeCurrency ? { feeCurrency } : undefined,
    );
  } catch (error) {
    const formatted = formatWalletError(error);
    return {
      ok: false,
      message: formatted.message,
      technicalDetails: formatted.technicalDetails,
    };
  }

  return { ok: true, feeCurrency };
}
