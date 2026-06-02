import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { isHiddenCarbonPrepareError } from "@/lib/carbon-error-patterns";

type MessagePart = UIMessage["parts"][number];

const RETRYABLE_READ_TOOLS = new Set([
  "get_swap_quote",
  "get_mento_fx_quote",
  "get_uniswap_quote",
  "estimate_mento_fx",
  "estimate_uniswap_swap",
  "get_token_balance",
  "get_token_info",
]);

const HIDDEN_CARBON_ERROR_TOOLS = /^prepare_carbon_/;

/** Hide internal Carbon prepare failures — server retries Uniswap pricing; LLM explains. */
export function shouldHideToolError(
  parts: MessagePart[],
  partIndex: number,
): boolean {
  if (shouldHideSupersededToolError(parts, partIndex)) {
    return true;
  }

  const part = parts[partIndex];
  if (!isToolUIPart(part) || part.state !== "output-error") {
    return false;
  }

  const toolName = getToolName(part);
  const errorText = part.errorText ?? "";

  if (
    HIDDEN_CARBON_ERROR_TOOLS.test(toolName) &&
    isHiddenCarbonPrepareError(errorText)
  ) {
    return true;
  }

  if (
    toolName === "get_carbon_trade_quote" &&
    isHiddenCarbonPrepareError(errorText)
  ) {
    return true;
  }

  return false;
}

/** Hide probe failures when the model retries and gets a later tool result. */
export function shouldHideSupersededToolError(
  parts: MessagePart[],
  partIndex: number,
): boolean {
  const part = parts[partIndex];
  if (!isToolUIPart(part) || part.state !== "output-error") {
    return false;
  }

  const errorText = part.errorText ?? "";
  const toolName = getToolName(part);
  const laterParts = parts.slice(partIndex + 1);

  const hasLaterSameToolResult = laterParts.some((later) => {
    if (!isToolUIPart(later)) {
      return false;
    }
    if (getToolName(later) !== toolName) {
      return false;
    }
    return later.state === "output-available" || later.state === "output-error";
  });

  if (hasLaterSameToolResult && RETRYABLE_READ_TOOLS.has(toolName)) {
    return true;
  }

  if (/unknown token/i.test(errorText)) {
    return laterParts.some((later) => {
      if (!isToolUIPart(later)) {
        return false;
      }
      return (
        RETRYABLE_READ_TOOLS.has(getToolName(later)) &&
        later.state !== "input-streaming" &&
        later.state !== "input-available"
      );
    });
  }

  return false;
}
