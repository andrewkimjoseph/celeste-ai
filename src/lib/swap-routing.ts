import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export type SwapProtocol = "mento_fx" | "uniswap_v4";

export interface SwapQuoteResult {
  protocol: SwapProtocol;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedOut: string;
  routeHops: number;
  network: "mainnet";
  alternatives?: Array<{
    protocol: SwapProtocol;
    expectedOut: string;
    error?: string;
  }>;
}

export interface SwapPrepareParams {
  recipient?: `0x${string}`;
  slippageTolerance?: number;
  deadlineMinutes?: number;
}

function parseExpectedOut(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isMentoRouteError(message: string): boolean {
  return /no mento fx route|mento fx market is currently closed/i.test(message);
}

function isUniswapRouteError(message: string): boolean {
  return /no uniswap v4 route|insufficient liquidity in uniswap v4/i.test(message);
}

async function tryMentoQuote(
  celina: CelinaClient,
  tokenIn: string,
  tokenOut: string,
  amount: string,
) {
  const quote = await celina.mentoFx.getFxQuote(tokenIn, tokenOut, amount);
  return {
    protocol: "mento_fx" as const,
    tokenIn: quote.tokenIn,
    tokenOut: quote.tokenOut,
    amountIn: quote.amountIn,
    expectedOut: quote.expectedOut,
    routeHops: quote.routeHops,
    network: quote.network,
  };
}

async function tryUniswapQuote(
  celina: CelinaClient,
  tokenIn: string,
  tokenOut: string,
  amount: string,
) {
  const quote = await celina.uniswap.getSwapQuote(tokenIn, tokenOut, amount);
  return {
    protocol: "uniswap_v4" as const,
    tokenIn: quote.tokenIn,
    tokenOut: quote.tokenOut,
    amountIn: quote.amountIn,
    expectedOut: quote.expectedOut,
    routeHops: quote.routeHops,
    network: quote.network,
  };
}

/**
 * Quote a swap across Mento FX and Uniswap v4; returns the best available route.
 */
export async function getSwapQuoteWithFallback(
  celina: CelinaClient,
  tokenIn: string,
  tokenOut: string,
  amount: string,
): Promise<SwapQuoteResult> {
  const [mentoResult, uniswapResult] = await Promise.allSettled([
    tryMentoQuote(celina, tokenIn, tokenOut, amount),
    tryUniswapQuote(celina, tokenIn, tokenOut, amount),
  ]);

  const successes: SwapQuoteResult[] = [];
  const alternatives: SwapQuoteResult["alternatives"] = [];

  if (mentoResult.status === "fulfilled") {
    successes.push(mentoResult.value);
  } else {
    const message =
      mentoResult.reason instanceof Error
        ? mentoResult.reason.message
        : String(mentoResult.reason);
    if (!isMentoRouteError(message)) {
      alternatives.push({ protocol: "mento_fx", expectedOut: "0", error: message });
    }
  }

  if (uniswapResult.status === "fulfilled") {
    successes.push(uniswapResult.value);
  } else {
    const message =
      uniswapResult.reason instanceof Error
        ? uniswapResult.reason.message
        : String(uniswapResult.reason);
    if (!isUniswapRouteError(message)) {
      alternatives.push({ protocol: "uniswap_v4", expectedOut: "0", error: message });
    }
  }

  if (successes.length === 0) {
    throw new Error(
      `No swap route for ${tokenIn} → ${tokenOut} via Mento FX or Uniswap v4.`,
    );
  }

  successes.sort(
    (a, b) => parseExpectedOut(b.expectedOut) - parseExpectedOut(a.expectedOut),
  );

  const best = successes[0]!;
  const otherProtocols = successes.slice(1).map((q) => ({
    protocol: q.protocol,
    expectedOut: q.expectedOut,
  }));

  return {
    ...best,
    alternatives: otherProtocols.length > 0 ? otherProtocols : alternatives,
  };
}

export async function prepareSwapWithFallback(
  celina: CelinaClient,
  from: `0x${string}`,
  tokenIn: string,
  tokenOut: string,
  amount: string,
  params?: SwapPrepareParams,
  protocol?: SwapProtocol,
) {
  const chosen =
    protocol ??
    (await getSwapQuoteWithFallback(celina, tokenIn, tokenOut, amount)).protocol;

  if (chosen === "mento_fx") {
    return celina.mentoFx.prepareFx(from, tokenIn, tokenOut, amount, {
      recipient: params?.recipient,
      slippageTolerance: params?.slippageTolerance,
      deadlineMinutes: params?.deadlineMinutes,
    });
  }

  return celina.uniswap.prepareSwap(from, tokenIn, tokenOut, amount, {
    recipient: params?.recipient,
    slippageTolerance: params?.slippageTolerance,
    deadlineMinutes: params?.deadlineMinutes,
  });
}
