import type { CarbonWriteBody } from "@andrewkimjoseph/celina-sdk";

export type CarbonOrderDisplay = {
  orderType: string;
  pairLabel: string;
  direction?: "buy" | "sell";
  limitPrice?: string;
  budget?: string;
  spreadLabel?: string;
  marketPrice?: string;
  marketPriceSource?: "uniswap_v4" | "carbon";
  fallbackNote?: string;
  budgetValid: boolean;
};

function readRecord(body: CarbonWriteBody): Record<string, unknown> {
  return body as Record<string, unknown>;
}

function formatAmount(value: unknown): string {
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) {
    return String(value ?? "");
  }
  if (n >= 1) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function readPositiveAmount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatPricePerBase(
  price: number,
  quote: string,
  base: string,
): string {
  return `${formatAmount(price)} ${quote} per ${base}`;
}

type BuildCarbonOrderDisplayOptions = {
  orderType?: string;
  fallbackNote?: string;
  marketPrice?: number;
  marketPriceSource?: "uniswap_v4" | "carbon";
};

/** Structured Carbon order facts for the confirm card — client-safe, no SDK imports. */
export function buildCarbonOrderDisplay(
  body: CarbonWriteBody,
  options: BuildCarbonOrderDisplayOptions = {},
): CarbonOrderDisplay {
  const record = readRecord(body);
  const base = String(record.base_token ?? record.base ?? "?").trim();
  const quote = String(record.quote_token ?? record.quote ?? "?").trim();
  const pairLabel = `${base} / ${quote}`;

  const directionRaw = String(record.direction ?? "buy").toLowerCase();
  const direction = directionRaw === "sell" ? "sell" : "buy";

  const spread = readPositiveAmount(record.spread_percentage);
  const price =
    readPositiveAmount(record.price) ??
    readPositiveAmount(record.buy_price) ??
    readPositiveAmount(record.buy_price_low);

  const buyBudget = readPositiveAmount(record.buy_budget);
  const sellBudget = readPositiveAmount(record.sell_budget);
  const budget =
    direction === "sell"
      ? readPositiveAmount(record.budget) ?? sellBudget
      : readPositiveAmount(record.budget) ?? buyBudget;

  const marketPrice =
    options.marketPrice ??
    readPositiveAmount(record.market_price) ??
    undefined;

  const orderType =
    options.orderType ??
    (spread !== null ? "Discount strategy" : "Limit order");

  const display: CarbonOrderDisplay = {
    orderType,
    pairLabel,
    direction,
    budgetValid: budget !== null && budget > 0,
  };

  if (spread !== null) {
    display.spreadLabel = `${formatAmount(spread)}% below market`;
  }

  if (price !== null) {
    display.limitPrice = formatPricePerBase(price, quote, base);
  }

  if (budget !== null) {
    const budgetToken = direction === "sell" ? base : quote;
    display.budget = `${formatAmount(budget)} ${budgetToken}`;
  } else {
    display.budget = `0 ${direction === "sell" ? base : quote}`;
    display.budgetValid = false;
  }

  if (marketPrice !== undefined) {
    display.marketPrice = formatPricePerBase(marketPrice, quote, base);
    display.marketPriceSource = options.marketPriceSource ?? "carbon";
  }

  if (options.fallbackNote) {
    display.fallbackNote = options.fallbackNote;
  }

  return display;
}
