/** User-facing copy for known tool failures — replaces cold API error strings. */

import {
  isTruncatedTransactionHash,
  TRUNCATED_TX_HASH_MESSAGE,
} from "@/lib/tx/transaction-hash";

const TOO_MANY_SUBREQUESTS_MESSAGE =
  "This action required too many network calls at once. Please try again — it usually works on the second attempt.";

export function formatToolErrorMessage(
  toolName: string,
  errorText: string,
): string {
  const text = errorText.trim();
  if (!text) {
    return "Something went wrong. Please try again.";
  }

  if (text.includes("Too many subrequests by single Worker invocation")) {
    return TOO_MANY_SUBREQUESTS_MESSAGE;
  }

  if (
    toolName === "get_transaction" &&
    (text.includes("Invalid input for tool get_transaction") ||
      text.includes('"path": [ "hash" ]') ||
      isTruncatedTransactionHash(text))
  ) {
    return TRUNCATED_TX_HASH_MESSAGE;
  }

  return text;
}

/** Whether a tool error is an expected limitation, not a system failure. */
export function isExpectedToolError(
  _toolName: string,
  _errorText: string,
): boolean {
  return false;
}
