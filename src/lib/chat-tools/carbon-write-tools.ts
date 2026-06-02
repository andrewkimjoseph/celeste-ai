import { tool } from "ai";
import { z } from "zod";
import type { CarbonWriteBody, createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { addressSchema, resolveTargetAddress } from "@/lib/chat-tools/schemas";
import {
  finalizeCarbonPrepare,
  type CarbonPrepareFn,
} from "@/lib/carbon-prepare";

type CelinaClient = ReturnType<typeof createCelinaClient>;

const carbonWriteSchema = z
  .object({
    from: addressSchema.optional(),
  })
  .passthrough();

function createCarbonPrepareTool(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
  description: string,
  prepareFn: CarbonPrepareFn,
) {
  return tool({
    description:
      description +
      " Returns unsigned steps for wallet confirmation. User must sign in wallet.",
    inputSchema: carbonWriteSchema,
    execute: async (args) => {
      const sender = resolveTargetAddress(connectedAddress, args.from);
      const { from: _from, ...rest } = args;
      const body = { ...rest, wallet_address: sender } as CarbonWriteBody;
      const prepared = await prepareFn(body);
      return finalizeCarbonPrepare(celina.carbon, sender, prepared, body);
    },
  });
}

export function createCarbonWriteTools(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
) {
  return {
    prepare_carbon_limit_order: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Create a one-time Carbon limit order on Celo. Prices are quote per base; buy budget in quote, sell budget in base.",
      (body) => celina.carbon.prepareLimitOrder(body),
    ),
    prepare_carbon_range_order: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Create a Carbon range order (gradual execution) on Celo.",
      (body) => celina.carbon.prepareRangeOrder(body),
    ),
    prepare_carbon_recurring_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Create a recurring buy/sell Carbon strategy on Celo (zero maker gas on fills).",
      (body) => celina.carbon.prepareRecurringStrategy(body),
    ),
    prepare_carbon_concentrated_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Create concentrated two-sided Carbon liquidity on Celo.",
      (body) => celina.carbon.prepareConcentratedStrategy(body),
    ),
    prepare_carbon_full_range_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Create full-range Carbon liquidity on Celo.",
      (body) => celina.carbon.prepareFullRangeStrategy(body),
    ),
    prepare_carbon_reprice_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Update price ranges of an existing Carbon strategy on Celo.",
      (body) => celina.carbon.prepareRepriceStrategy(body),
    ),
    prepare_carbon_edit_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Edit prices and budgets of a Carbon strategy on Celo.",
      (body) => celina.carbon.prepareEditStrategy(body),
    ),
    prepare_carbon_deposit_budget: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Add funds to a Carbon strategy on Celo.",
      (body) => celina.carbon.prepareDepositBudget(body),
    ),
    prepare_carbon_withdraw_budget: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Withdraw funds from a Carbon strategy on Celo.",
      (body) => celina.carbon.prepareWithdrawBudget(body),
    ),
    prepare_carbon_pause_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Pause a Carbon strategy on Celo (funds remain).",
      (body) => celina.carbon.preparePauseStrategy(body),
    ),
    prepare_carbon_resume_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Resume a paused Carbon strategy on Celo.",
      (body) => celina.carbon.prepareResumeStrategy(body),
    ),
    prepare_carbon_delete_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Permanently close a Carbon strategy on Celo.",
      (body) => celina.carbon.prepareDeleteStrategy(body),
    ),
    prepare_carbon_trade: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "Build an unsigned taker swap against Carbon liquidity on Celo.",
      (body) => celina.carbon.prepareTrade(body),
    ),
  };
}
