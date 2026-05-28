import { getToolName, isToolUIPart, type UIMessage } from "ai";

type MessagePart = UIMessage["parts"][number];

const RETRYABLE_READ_TOOLS = new Set([
  "get_mento_fx_quote",
  "estimate_mento_fx",
  "get_token_balance",
  "get_token_info",
]);

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
