import type { CarbonWriteBody } from "@andrewkimjoseph/celina-sdk";
import {
  buildCarbonOrderDisplay,
  type CarbonOrderDisplay,
} from "@/lib/carbon-order-display";
import type { CarbonPrepareFlowResult } from "@/lib/carbon-market-price";

type EnrichOptions = {
  orderType?: string;
  fallbackNote?: string;
};

/** Attach structured order facts to a Carbon prepared flow for the confirm card. */
export function enrichCarbonPrepareFlow(
  flow: CarbonPrepareFlowResult,
  body: CarbonWriteBody,
  options: EnrichOptions = {},
): CarbonPrepareFlowResult & { carbonDetails: CarbonOrderDisplay } {
  const displayBody = flow.carbonDisplayBody ?? body;
  const carbonDetails = buildCarbonOrderDisplay(displayBody, {
    orderType: options.orderType,
    fallbackNote: options.fallbackNote ?? flow.carbonFallbackNote,
    marketPrice: flow.market_price ?? readMarketPrice(displayBody),
    marketPriceSource: flow.market_price_source,
  });

  return { ...flow, carbonDetails };
}

function readMarketPrice(body: CarbonWriteBody): number | undefined {
  const value = (body as Record<string, unknown>).market_price;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
