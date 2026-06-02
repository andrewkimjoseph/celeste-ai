import type {
  CarbonPrepareResult,
  CarbonWriteBody,
  createCelinaClient,
  FinalizedCarbonPrepareFlow,
} from "@andrewkimjoseph/celina-sdk";
import { finalizeCarbonPrepare } from "@/lib/carbon-prepare";
import type { CarbonPrepareFn } from "@/lib/carbon-prepare";
import { needsMarketPriceRetry } from "@/lib/carbon-error-patterns";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export type CarbonPrepareFlowResult = FinalizedCarbonPrepareFlow & {
  market_price?: number;
  market_price_source?: "uniswap_v4";
  /** Set when concentrated/full-range prepare falls back to limit order. */
  carbonFallbackNote?: string;
  /** Body fields used for confirm-card display (e.g. limit fallback params). */
  carbonDisplayBody?: CarbonWriteBody;
};

function bodyHasMarketPrice(body: CarbonWriteBody): boolean {
  const record = body as Record<string, unknown>;
  const value = record.market_price;
  return value !== undefined && value !== null && value !== "";
}

function readMarketPrice(body: CarbonWriteBody): number | undefined {
  const value = (body as Record<string, unknown>).market_price;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Quote per 1 base from a Uniswap probe (amountIn base → expectedOut quote). */
export function deriveMarketPriceFromQuote(
  amountIn: string,
  expectedOut: string,
): number {
  const inAmount = Number(String(amountIn).replace(/,/g, ""));
  const outAmount = Number(String(expectedOut).replace(/,/g, ""));
  if (
    !Number.isFinite(inAmount) ||
    inAmount <= 0 ||
    !Number.isFinite(outAmount) ||
    outAmount <= 0
  ) {
    throw new Error("Invalid Uniswap quote for market price derivation.");
  }
  return outAmount / inAmount;
}

function extractPairTokens(body: CarbonWriteBody): {
  base: string;
  quote: string;
} {
  const record = body as Record<string, unknown>;
  const base = String(record.base_token ?? record.base ?? "").trim();
  const quote = String(record.quote_token ?? record.quote ?? "").trim();
  if (!base || !quote) {
    throw new Error(
      "Carbon prepare body must include base_token and quote_token for Uniswap market price fallback.",
    );
  }
  return { base, quote };
}

/**
 * Uniswap v4 reference: quote token per 1 base token.
 * No wallet address — reference only, must not require user balance.
 */
export async function fetchUniswapReferencePrice(
  celina: CelinaClient,
  baseToken: string,
  quoteToken: string,
): Promise<number> {
  try {
    const direct = await celina.uniswap.getSwapQuote(baseToken, quoteToken, "1");
    return deriveMarketPriceFromQuote(direct.amountIn, direct.expectedOut);
  } catch {
    const inverse = await celina.uniswap.getSwapQuote(quoteToken, baseToken, "1");
    const basePerQuote = deriveMarketPriceFromQuote(
      inverse.amountIn,
      inverse.expectedOut,
    );
    return 1 / basePerQuote;
  }
}

async function attachUniswapMarketPrice(
  celina: CelinaClient,
  body: CarbonWriteBody,
): Promise<CarbonWriteBody> {
  const { base, quote } = extractPairTokens(body);
  const marketPrice = await fetchUniswapReferencePrice(celina, base, quote);
  return { ...body, market_price: marketPrice } as CarbonWriteBody;
}

async function finalizePrepared(
  celina: CelinaClient,
  sender: `0x${string}`,
  prepared: CarbonPrepareResult,
  body: CarbonWriteBody,
): Promise<FinalizedCarbonPrepareFlow> {
  return finalizeCarbonPrepare(celina.carbon, sender, prepared, body);
}

function withMarketMetadata(
  flow: FinalizedCarbonPrepareFlow,
  body: CarbonWriteBody,
  source?: "uniswap_v4",
): CarbonPrepareFlowResult {
  const marketPrice = readMarketPrice(body);
  if (source && marketPrice !== undefined) {
    return {
      ...flow,
      market_price: marketPrice,
      market_price_source: source,
    };
  }
  return flow;
}

async function runPrepare(
  celina: CelinaClient,
  sender: `0x${string}`,
  prepareFn: CarbonPrepareFn,
  body: CarbonWriteBody,
  source?: "uniswap_v4",
): Promise<CarbonPrepareFlowResult> {
  const prepared = await prepareFn(body);
  if (
    !bodyHasMarketPrice(body) &&
    needsMarketPriceRetry(prepared.warnings ?? [])
  ) {
    throw new Error(
      prepared.warnings?.join(" ") ?? "Carbon prepare requires market_price.",
    );
  }
  const flow = await finalizePrepared(celina, sender, prepared, body);
  return withMarketMetadata(flow, body, source);
}

/**
 * Prepare Carbon strategy with Uniswap v4 market_price injected when Carbon
 * cannot resolve spot price on its own.
 */
export async function prepareCarbonWithMarketFallback(
  celina: CelinaClient,
  sender: `0x${string}`,
  prepareFn: CarbonPrepareFn,
  body: CarbonWriteBody,
): Promise<CarbonPrepareFlowResult> {
  let prepareBody = body;
  let usedUniswap = false;

  if (!bodyHasMarketPrice(body)) {
    try {
      prepareBody = await attachUniswapMarketPrice(celina, body);
      usedUniswap = true;
    } catch {
      prepareBody = body;
    }
  }

  try {
    return await runPrepare(
      celina,
      sender,
      prepareFn,
      prepareBody,
      usedUniswap ? "uniswap_v4" : undefined,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (usedUniswap || bodyHasMarketPrice(body) || !needsMarketPriceRetry(message)) {
      throw error;
    }

    const retryBody = await attachUniswapMarketPrice(celina, body);
    return runPrepare(celina, sender, prepareFn, retryBody, "uniswap_v4");
  }
}

function readSpreadBuyParams(body: CarbonWriteBody): {
  spread: number;
  buyBudget: string | number;
} | null {
  const record = body as Record<string, unknown>;
  const spread = Number(record.spread_percentage);
  const buyBudget = record.buy_budget ?? record.budget;
  if (
    !Number.isFinite(spread) ||
    spread <= 0 ||
    buyBudget === undefined ||
    buyBudget === null ||
    buyBudget === ""
  ) {
    return null;
  }
  return { spread, buyBudget: buyBudget as string | number };
}

/**
 * Concentrated prepare with limit-order fallback — Carbon REST concentrated
 * fails on some pairs (e.g. CELO/USDT); limit buy at spread below Uniswap mid works.
 */
export async function prepareCarbonConcentratedWithLimitFallback(
  celina: CelinaClient,
  sender: `0x${string}`,
  body: CarbonWriteBody,
): Promise<CarbonPrepareFlowResult> {
  try {
    return await prepareCarbonWithMarketFallback(
      celina,
      sender,
      (prepareBody) => celina.carbon.prepareConcentratedStrategy(prepareBody),
      body,
    );
  } catch (error) {
    const spreadParams = readSpreadBuyParams(body);
    if (!spreadParams) {
      throw error;
    }

    let marketPrice = readMarketPrice(body);
    if (marketPrice === undefined) {
      try {
        const withPrice = await attachUniswapMarketPrice(celina, body);
        marketPrice = readMarketPrice(withPrice);
      } catch {
        throw error;
      }
    }
    if (marketPrice === undefined) {
      throw error;
    }

    const limitPrice = marketPrice * (1 - spreadParams.spread / 100);
    const limitBody = {
      ...(body as Record<string, unknown>),
      wallet_address: sender,
      direction: "buy",
      price: limitPrice,
      budget: spreadParams.buyBudget,
      market_price: marketPrice,
    } as CarbonWriteBody;

    return prepareCarbonWithMarketFallback(
      celina,
      sender,
      (prepareBody) => celina.carbon.prepareLimitOrder(prepareBody),
      limitBody,
    ).then((flow) => ({
      ...flow,
      market_price: flow.market_price ?? marketPrice,
      market_price_source: flow.market_price_source ?? "uniswap_v4",
      carbonFallbackNote:
        "Carbon concentrated isn't available for this pair — prepared as a one-time limit buy at your spread instead.",
      carbonDisplayBody: limitBody,
    }));
  }
}
