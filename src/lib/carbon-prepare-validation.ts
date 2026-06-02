import type { CarbonWriteBody } from "@andrewkimjoseph/celina-sdk";

function readRecord(body: CarbonWriteBody): Record<string, unknown> {
  return body as Record<string, unknown>;
}

function parsePositiveAmount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) {
    return null;
  }
  return n;
}

function requirePositive(
  value: unknown,
  label: string,
): number {
  const n = parsePositiveAmount(value);
  if (n === null || n <= 0) {
    throw new Error(
      `Carbon prepare requires a positive ${label}. Ask the user how much to spend before calling prepare.`,
    );
  }
  return n;
}

/** Reject create prepares with missing or zero budget/amount before hitting Carbon REST. */
export function validateCarbonPrepareBody(
  toolName: string,
  body: CarbonWriteBody,
): void {
  const record = readRecord(body);

  switch (toolName) {
    case "prepare_carbon_limit_order":
    case "prepare_carbon_range_order": {
      const direction = String(record.direction ?? "buy").toLowerCase();
      requirePositive(record.budget, `${direction === "sell" ? "base" : "quote"} budget`);
      return;
    }
    case "prepare_carbon_concentrated_strategy":
      requirePositive(
        record.buy_budget ?? record.budget,
        "buy_budget (quote token amount, e.g. USDT to spend)",
      );
      return;
    case "prepare_carbon_full_range_strategy": {
      const buy = parsePositiveAmount(record.buy_budget);
      const sell = parsePositiveAmount(record.sell_budget);
      if ((buy === null || buy <= 0) && (sell === null || sell <= 0)) {
        throw new Error(
          "Carbon prepare requires a positive buy_budget and/or sell_budget. Ask the user how much to allocate before calling prepare.",
        );
      }
      return;
    }
    case "prepare_carbon_recurring_strategy": {
      const buy = parsePositiveAmount(record.buy_budget);
      const sell = parsePositiveAmount(record.sell_budget);
      if ((buy === null || buy <= 0) && (sell === null || sell <= 0)) {
        throw new Error(
          "Carbon recurring strategy requires a positive buy_budget and/or sell_budget. Ask the user how much to allocate before calling prepare.",
        );
      }
      return;
    }
    case "prepare_carbon_trade":
      requirePositive(record.amount, "trade amount");
      return;
    case "prepare_carbon_deposit_budget":
    case "prepare_carbon_withdraw_budget":
      requirePositive(record.budget, "budget amount");
      return;
    default:
      return;
  }
}
