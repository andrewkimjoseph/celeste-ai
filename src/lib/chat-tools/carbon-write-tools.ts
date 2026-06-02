import { tool } from "ai";
import { z } from "zod";
import type { CarbonWriteBody, createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { addressSchema, resolveTargetAddress } from "@/lib/chat-tools/schemas";
import {
  finalizeCarbonPrepare,
  type CarbonPrepareFn,
} from "@/lib/carbon-prepare";
import {
  prepareCarbonWithMarketFallback,
  prepareCarbonConcentratedWithLimitFallback,
  type CarbonPrepareFlowResult,
} from "@/lib/carbon-market-price";
import { validateCarbonPrepareBody } from "@/lib/carbon-prepare-validation";
import { enrichCarbonPrepareFlow } from "@/lib/carbon-prepare-enrich";

type CelinaClient = ReturnType<typeof createCelinaClient>;

const CARBON_PREPARE_SUFFIX =
  " Market price auto-fetched when omitted (Uniswap v4 reference retry if Carbon cannot resolve). Check warnings in result. Returns unsigned steps for wallet confirmation.";

const carbonWriteSchema = z
  .object({
    from: addressSchema.optional(),
  })
  .loose();

type CarbonPrepareToolOptions = {
  marketPriceFallback?: boolean;
};

function createCarbonPrepareTool(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
  toolName: string,
  description: string,
  prepareFn: CarbonPrepareFn,
  options?: CarbonPrepareToolOptions,
) {
  const useMarketPriceFallback = options?.marketPriceFallback ?? false;

  return tool({
    description: description + CARBON_PREPARE_SUFFIX,
    inputSchema: carbonWriteSchema,
    execute: async (args) => {
      const sender = resolveTargetAddress(connectedAddress, args.from);
      const { from, ...rest } = args;
      void from;
      const body = { ...rest, wallet_address: sender } as CarbonWriteBody;

      validateCarbonPrepareBody(toolName, body);

      let flow: CarbonPrepareFlowResult;
      if (useMarketPriceFallback) {
        flow = await prepareCarbonWithMarketFallback(
          celina,
          sender,
          prepareFn,
          body,
        );
      } else {
        const prepared = await prepareFn(body);
        flow = await finalizeCarbonPrepare(celina.carbon, sender, prepared, body);
      }

      return enrichCarbonPrepareFlow(flow, body, {
        fallbackNote: flow.carbonFallbackNote,
        orderType: flow.carbonFallbackNote ? "Limit buy (fallback)" : undefined,
      });
    },
  });
}

export function createCarbonWriteTools(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
) {
  const withMarketFallback = { marketPriceFallback: true as const };

  return {
    prepare_carbon_limit_order: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_limit_order",
      "One-time Carbon limit order on Celo. For absolute limits: base_token, quote_token, direction (buy|sell), price (quote per 1 base), budget. Omit market_price — Carbon auto-fetches; Uniswap reference used if needed.",
      (body) => celina.carbon.prepareLimitOrder(body),
      withMarketFallback,
    ),
    prepare_carbon_range_order: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_range_order",
      "Carbon range order (gradual fill) on Celo. Fields: base_token, quote_token, direction, buy_price_low/high or sell range, budget.",
      (body) => celina.carbon.prepareRangeOrder(body),
      withMarketFallback,
    ),
    prepare_carbon_recurring_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_recurring_strategy",
      "Recurring buy-low/sell-high Carbon strategy on Celo (zero maker gas on fills). Fields: base_token, quote_token, buy_price_low, buy_price_high, buy_budget, sell_price_low, sell_price_high, sell_budget.",
      (body) => celina.carbon.prepareRecurringStrategy(body),
      withMarketFallback,
    ),
    prepare_carbon_concentrated_strategy: tool({
      description:
        "X% below/above market on Celo via spread_percentage + buy_budget. Uses Uniswap reference price; falls back to limit buy if Carbon concentrated API fails. Fields: base_token, quote_token, spread_percentage, buy_budget." +
        CARBON_PREPARE_SUFFIX,
      inputSchema: carbonWriteSchema,
      execute: async (args) => {
        const sender = resolveTargetAddress(connectedAddress, args.from);
        const { from, ...rest } = args;
        void from;
        const body = { ...rest, wallet_address: sender } as CarbonWriteBody;

        validateCarbonPrepareBody("prepare_carbon_concentrated_strategy", body);

        const flow = await prepareCarbonConcentratedWithLimitFallback(
          celina,
          sender,
          body,
        );
        return enrichCarbonPrepareFlow(flow, body, {
          fallbackNote: flow.carbonFallbackNote,
          orderType: flow.carbonFallbackNote ? "Limit buy (fallback)" : "Discount strategy",
        });
      },
    }),
    prepare_carbon_full_range_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_full_range_strategy",
      "Full-range Carbon liquidity on Celo. Fields: base_token, quote_token, spread_percentage, buy_budget, sell_budget.",
      (body) => celina.carbon.prepareFullRangeStrategy(body),
      withMarketFallback,
    ),
    prepare_carbon_reprice_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_reprice_strategy",
      "Update price ranges of an existing Carbon strategy. Fields: strategy_id, buy_price_low/high, sell_price_low/high.",
      (body) => celina.carbon.prepareRepriceStrategy(body),
    ),
    prepare_carbon_edit_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_edit_strategy",
      "Edit prices and budgets of a Carbon strategy. Fields: strategy_id plus fields to update.",
      (body) => celina.carbon.prepareEditStrategy(body),
    ),
    prepare_carbon_deposit_budget: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_deposit_budget",
      "Add funds to a Carbon strategy. Fields: strategy_id, budget amount.",
      (body) => celina.carbon.prepareDepositBudget(body),
    ),
    prepare_carbon_withdraw_budget: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_withdraw_budget",
      "Withdraw funds from a Carbon strategy. Fields: strategy_id, budget amount.",
      (body) => celina.carbon.prepareWithdrawBudget(body),
    ),
    prepare_carbon_pause_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_pause_strategy",
      "Pause a Carbon strategy (funds remain). Field: strategy_id.",
      (body) => celina.carbon.preparePauseStrategy(body),
    ),
    prepare_carbon_resume_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_resume_strategy",
      "Resume a paused Carbon strategy. Field: strategy_id.",
      (body) => celina.carbon.prepareResumeStrategy(body),
    ),
    prepare_carbon_delete_strategy: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_delete_strategy",
      "Permanently close a Carbon strategy. Field: strategy_id.",
      (body) => celina.carbon.prepareDeleteStrategy(body),
    ),
    prepare_carbon_trade: createCarbonPrepareTool(
      celina,
      connectedAddress,
      "prepare_carbon_trade",
      "Immediate taker swap against Carbon maker liquidity. Fields: source_token, target_token, amount; optional min_return, is_trade_by_target. Call get_carbon_trade_quote first.",
      (body) => celina.carbon.prepareTrade(body),
    ),
  };
}
