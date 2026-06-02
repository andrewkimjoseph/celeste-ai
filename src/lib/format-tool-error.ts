/** User-facing copy for known tool failures — replaces cold API error strings. */
import { isHiddenCarbonPrepareError } from "@/lib/carbon-error-patterns";

export function formatToolErrorMessage(
  toolName: string,
  errorText: string,
): string {
  const text = errorText.trim();
  if (!text) {
    return "Something went wrong. Please try again.";
  }

  if (toolName === "get_carbon_price_history") {
    if (/400|price history|not found|not available/i.test(text)) {
      return (
        "Chart data isn't available for this pair on Carbon right now. " +
        "Some Celo pairs (including CELO/USDT) don't expose historical OHLC yet — that's normal. " +
        "You can still place limit or discount orders; Carbon fetches the live price when you prepare a strategy."
      );
    }
  }

  if (
    toolName === "simulate_carbon_strategy" &&
    /400|market_price|market price/i.test(text)
  ) {
    return (
      "Couldn't run a backtest for this configuration — Carbon may not have enough price data for this pair."
    );
  }

  if (/carbon api http 400|carbon api returned/i.test(text)) {
    return (
      "Carbon couldn't complete that request for this pair right now. " +
      "Some pairs have limited data on Carbon — limit and discount orders may still work via prepare."
    );
  }

  if (
    toolName.startsWith("prepare_carbon_") &&
    isHiddenCarbonPrepareError(text)
  ) {
    return (
      "Carbon couldn't resolve a live price for this pair. " +
      "Try a limit order with an explicit price, or a different token pair."
    );
  }

  return text;
}

/** Whether a tool error is an expected limitation, not a system failure. */
export function isExpectedToolError(
  toolName: string,
  errorText: string,
): boolean {
  const text = errorText.trim();
  if (!text) {
    return false;
  }

  if (toolName === "get_carbon_price_history") {
    return /400|price history|not found|not available/i.test(text);
  }

  if (
    toolName === "simulate_carbon_strategy" &&
    /400|market_price|market price/i.test(text)
  ) {
    return true;
  }

  if (
    (toolName.startsWith("prepare_carbon_") ||
      toolName.startsWith("get_carbon_")) &&
    (isHiddenCarbonPrepareError(text) || /400|price history/i.test(text))
  ) {
    return true;
  }

  return false;
}
