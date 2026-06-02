const MARKET_PRICE_RETRY_PATTERN =
  /market_price|market price|determine market/i;

const CARBON_PREPARE_INTERNAL_ERROR_PATTERN =
  /cannot read properties of undefined|reading 'toString'/i;

/** Whether Carbon needs an explicit market_price (error or warning text). */
export function needsMarketPriceRetry(messageOrWarnings: string | string[]): boolean {
  const texts = Array.isArray(messageOrWarnings)
    ? messageOrWarnings
    : [messageOrWarnings];
  return texts.some((text) => MARKET_PRICE_RETRY_PATTERN.test(text.trim()));
}

/** Carbon prepare failures handled server-side — hide raw pill from chat UI. */
export function isHiddenCarbonPrepareError(errorText: string): boolean {
  const text = errorText.trim();
  if (!text) {
    return false;
  }
  return (
    needsMarketPriceRetry(text) ||
    CARBON_PREPARE_INTERNAL_ERROR_PATTERN.test(text)
  );
}
