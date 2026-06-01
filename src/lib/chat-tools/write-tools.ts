import { tool } from "ai";
import { isAddress } from "viem";
import { z } from "zod";
import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import {
  addressOrEnsSchema,
  addressSchema,
  resolveTargetAddress,
} from "@/lib/chat-tools/schemas";
import {
  AAVE_TOKEN_SYMBOLS,
  normalizeAaveTokenInput,
} from "@/lib/aave-token";
import { checkSendPreflight } from "@/lib/send-preflight";
import { normalizeRegistryTokenInput } from "@/lib/registry-token";
import {
  prepareSwapWithFallback,
  type SwapProtocol,
} from "@/lib/swap-routing";

const aaveTokenDescription = `Aave asset symbol on Celo (${AAVE_TOKEN_SYMBOLS.join(", ")}). Pass the symbol only — never a contract address from balance results.`;

type CelinaClient = ReturnType<typeof createCelinaClient>;

export function createWriteTools(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
  options?: { supportsFeeAbstraction?: boolean },
) {
  return {
    prepare_send: tool({
      description:
        "Prepare an unsigned send transaction. User must confirm and sign in wallet. Use connected wallet as from unless specified.",
      inputSchema: z.object({
        to: addressOrEnsSchema,
        token: z.string(),
        amount: z.string(),
        from: addressSchema.optional(),
      }),
      execute: async ({ to, token, amount, from }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        const preflight = await checkSendPreflight(
          celina,
          sender,
          normalizeRegistryTokenInput(token),
          amount,
          { supportsFeeAbstraction: options?.supportsFeeAbstraction === true },
        );
        if (!preflight.ok) {
          throw new Error(
            preflight.message ??
              `Insufficient ${token} balance to send ${amount}.`,
          );
        }

        const recipient = isAddress(to)
          ? (to as `0x${string}`)
          : (await celina.ens.resolveAddressOrEns(to)).address;
        return celina.transaction.prepareSend(
          sender,
          recipient,
          normalizeRegistryTokenInput(token),
          amount,
        );
      },
    }),

    prepare_mento_fx: tool({
      description:
        "Prepare Mento FX swap only. For general swaps after get_swap_quote, use prepare_swap with the quoted protocol.",
      inputSchema: z.object({
        token_in: z.string(),
        token_out: z.string(),
        amount: z.string(),
        from: addressSchema.optional(),
        recipient: addressSchema.optional(),
        slippage_tolerance: z.number().min(0).max(20).optional(),
        deadline_minutes: z.number().int().positive().optional(),
      }),
      execute: async ({
        token_in,
        token_out,
        amount,
        from,
        recipient,
        slippage_tolerance,
        deadline_minutes,
      }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        return celina.mentoFx.prepareFx(
          sender,
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          {
            recipient: recipient as `0x${string}` | undefined,
            slippageTolerance: slippage_tolerance,
            deadlineMinutes: deadline_minutes,
          },
        );
      },
    }),

    prepare_swap: tool({
      description:
        "Prepare unsigned swap steps using the best route (Mento FX or Uniswap v4). Call after get_swap_quote once the user confirmed a quoted amount. Do not call with a guessed amount.",
      inputSchema: z.object({
        token_in: z.string(),
        token_out: z.string(),
        amount: z.string().describe("Same human-readable amount from the confirmed get_swap_quote"),
        protocol: z
          .enum(["mento_fx", "uniswap_v4"])
          .optional()
          .describe("From get_swap_quote result; omit to auto-select best route"),
        from: addressSchema.optional(),
        recipient: addressSchema.optional(),
        slippage_tolerance: z.number().min(0).max(20).optional(),
        deadline_minutes: z.number().int().positive().optional(),
      }),
      execute: async ({
        token_in,
        token_out,
        amount,
        protocol,
        from,
        recipient,
        slippage_tolerance,
        deadline_minutes,
      }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        return prepareSwapWithFallback(
          celina,
          sender,
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          {
            recipient: recipient as `0x${string}` | undefined,
            slippageTolerance: slippage_tolerance,
            deadlineMinutes: deadline_minutes,
          },
          protocol as SwapProtocol | undefined,
        );
      },
    }),

    prepare_uniswap_swap: tool({
      description:
        "Prepare Uniswap v4 swap only. Prefer prepare_swap after get_swap_quote for automatic routing.",
      inputSchema: z.object({
        token_in: z.string(),
        token_out: z.string(),
        amount: z.string(),
        from: addressSchema.optional(),
        recipient: addressSchema.optional(),
        slippage_tolerance: z.number().min(0).max(20).optional(),
        deadline_minutes: z.number().int().positive().optional(),
      }),
      execute: async ({
        token_in,
        token_out,
        amount,
        from,
        recipient,
        slippage_tolerance,
        deadline_minutes,
      }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        return celina.uniswap.prepareSwap(
          sender,
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          {
            recipient: recipient as `0x${string}` | undefined,
            slippageTolerance: slippage_tolerance,
            deadlineMinutes: deadline_minutes,
          },
        );
      },
    }),

    prepare_aave_supply: tool({
      description:
        "Prepare unsigned Aave V3 supply steps on Celo. User must sign in wallet. Pass token symbol only.",
      inputSchema: z.object({
        token: z.string().describe(aaveTokenDescription),
        amount: z.string(),
        from: addressSchema.optional(),
      }),
      execute: async ({ token, amount, from }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        const symbol = normalizeAaveTokenInput(celina, token);
        return celina.aave.prepareSupply(sender, symbol, amount);
      },
    }),

    prepare_aave_withdraw: tool({
      description:
        "Prepare unsigned Aave V3 withdraw on Celo. User must sign in wallet. Pass token symbol only.",
      inputSchema: z.object({
        token: z.string().describe(aaveTokenDescription),
        amount: z.string().optional(),
        withdraw_max: z.boolean().optional(),
        from: addressSchema.optional(),
      }),
      execute: async ({ token, amount, withdraw_max, from }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        const symbol = normalizeAaveTokenInput(celina, token);
        return celina.aave.prepareWithdraw(sender, symbol, amount, withdraw_max);
      },
    }),

    prepare_claim_daily_gooddollar_ubi: tool({
      description:
        "Prepare unsigned GoodDollar daily UBI claim for the connected wallet. User must sign in wallet. Call get_gooddollar_ubi_entitlement first when eligibility is unclear.",
      inputSchema: z.object({
        from: addressSchema.optional(),
      }),
      execute: async ({ from }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        return celina.gooddollar.prepareClaimUbi(sender);
      },
    }),
  };
}
